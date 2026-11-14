// src/app/api/whatsapp/webhook/route.js
// Meta's WhatsApp Cloud API calls this webhook for every message sent to GOAT's WhatsApp number.
// 1) GET  = the one-time handshake: Meta checks this URL is ours (verify token -> echo the challenge).
// 2) POST = a message arrived: check Meta's signature, find a contract address, run the SAME Vet
//    as goatwatch.app/vet and the Telegram bot, and reply in the chat, IN THE PERSON'S LANGUAGE.
// GOAT only ever REPLIES (inside WhatsApp's 24-hour window), so replies are free and never spam.
// Privacy: phone numbers are never stored. The log and language choice use a one-way scrambled id.
import { NextResponse, after } from "next/server";          // after() = run work AFTER answering Meta
import { createHmac, timingSafeEqual } from "node:crypto";   // signature check + scrambling phone numbers
import { createClient } from "@supabase/supabase-js";
import { vetToken, searchTokens, cleanQuery, isEvmAddress, isSolAddress } from "../../../../lib/vet"; // the one Vet engine (CHANGED: + name search)
import { SITE_URL } from "../../../../lib/site";                                      // https://goatwatch.app
import { translateNote } from "../../../../lib/i18n/notes";                           // NEW: same phrasebook as the website
import { WA_LANGS, LANG_NAMES, LANG_WORDS, SUB_WORDS, guessLang, w } from "../../../../lib/i18n/wa"; // the bot's words, 10 languages
import { askGoat } from "../../../../lib/goatAgent";                                  // NEW: GOAT AI (paid chat)
import { getAccess, gate as aiGate, webAllowed, bumpUsage, loadHistory, saveTurn, saveNickname, today, FREE_AI_CHATS } from "../../../../lib/aiAccess"; // NEW: shared with the website

export const maxDuration = 60;                             // CHANGED: GOAT AI with web search needs up to ~50s (was 30: answers got killed)

const COOLDOWN_SECONDS = 15;                               // one check per person every 15s (protects free API limits)
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0"; // Meta Graph API version
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;  // Meta's API address

// Server-side database client (secret key, never in the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

// ------------------------------------------------------------
// SECURITY
// ------------------------------------------------------------

// Is this POST really from Meta? Meta signs the exact raw body with our App Secret.
function signatureIsValid(rawBody, header) {
  if (!header || !process.env.WHATSAPP_APP_SECRET) return false;          // no signature, or not configured
  const expected = "sha256=" + createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
    .update(rawBody, "utf8")                               // sign the body exactly as it arrived
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);   // compare in constant time
}

// Phone number -> a number that identifies the person but can't be turned back into the phone number
function chatIdFor(phone) {
  const hex = createHmac("sha256", process.env.WHATSAPP_APP_SECRET).update(phone).digest("hex");
  return -(2 ** 52) + parseInt(hex.slice(0, 12), 16);      // 48 random bits, shifted into a range of its own
}

// ------------------------------------------------------------
// LANGUAGE (NEW)
// ------------------------------------------------------------

// The person's saved language, or a first guess from their country code. { lang, saved }
async function getLang(supabase, chatId, phone) {
  const { data } = await supabase.from("wa_prefs").select("lang").eq("chat_id", chatId).maybeSingle();
  if (data?.lang && WA_LANGS.includes(data.lang)) return { lang: data.lang, saved: true };
  return { lang: guessLang(phone), saved: false };         // not chosen yet
}

// Remember their choice (one row per person, overwritten if they change it)
async function saveLang(supabase, chatId, lang) {
  await supabase
    .from("wa_prefs")
    .upsert({ chat_id: chatId, lang, updated_at: new Date().toISOString() }, { onConflict: "chat_id" });
}

// ------------------------------------------------------------
// WHATSAPP API
// ------------------------------------------------------------

// POST to our phone number's /messages endpoint (sending a reply, marking read, typing)
async function wa(body) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, // proves we own this WhatsApp number
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    signal: AbortSignal.timeout(10000),                    // never hang on Meta
  });
  if (!res.ok) console.error("WhatsApp API error:", res.status, await res.text()); // visible in Vercel logs
  return res.ok;
}

// Show blue ticks + "typing..." while the Vet runs
const markReadAndTyping = (messageId) =>
  wa({ status: "read", message_id: messageId, typing_indicator: { type: "text" } });

// Reply to the person, quoting their message, with no big link preview
const reply = (to, messageId, text) =>
  wa({
    recipient_type: "individual",
    to,                                                    // their WhatsApp number (used to reply, never stored)
    context: { message_id: messageId },                    // shows our reply attached to their message
    type: "text",
    text: { body: text.slice(0, 4000), preview_url: false }, // WhatsApp's limit is 4096 characters
  });

// NEW: long answers are split into parts at paragraph breaks (WhatsApp allows ~4,096 characters per message)
async function replyLong(to, messageId, text) {
  const parts = [];
  let rest = text.trim();
  while (rest.length > 3800) {
    let cut = rest.lastIndexOf("\n\n", 3800);            // best: between paragraphs
    if (cut < 1500) cut = rest.lastIndexOf("\n", 3800);   // else: between lines
    if (cut < 1500) cut = rest.lastIndexOf(" ", 3800);     // else: between words
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  parts.push(rest);
  for (const part of parts) await reply(to, messageId, part); // in order, one after another
}

// NEW: the tap-to-choose language menu (a WhatsApp "list" message)
function sendLanguageMenu(to, lang) {
  const t = w(lang);
  return wa({
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: t.menuBody },                          // "Choose your language 🌍"
      action: {
        button: t.menuButton,                              // the button that opens the list (max 20 characters)
        sections: [
          {
            title: "GOAT",
            rows: WA_LANGS.map((code) => ({ id: `lang:${code}`, title: LANG_NAMES[code] })), // "lang:ha" -> Hausa
          },
        ],
      },
    },
  });
}

// ------------------------------------------------------------
// FORMATTING (WhatsApp uses *bold* and _italic_, not HTML)
// ------------------------------------------------------------

// Remove WhatsApp's formatting symbols from names we didn't write (a coin called "*SAFE*" can't break our layout)
const plain = (s) => String(s ?? "").replace(/[*_~`]/g, "");

// $1.2M style money
const money = (n) =>
  n === null || n === undefined ? "n/a" : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// +1,234% style percent
const pct = (n) =>
  n === null || n === undefined ? "n/a" : (n > 0 ? "+" : "") + Number(n).toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 1 }) + "%";

const ICON = { fail: "✕", warn: "!", pass: "✓", unknown: "?" };

// Full report on the website (ref=wa-bot lets us count visits that came from WhatsApp)
const reportUrl = (address) => `${SITE_URL}/vet?q=${encodeURIComponent(address)}&ref=wa-bot`;

// CHANGED: the help message, in the person's language
function helpText(lang) {
  const t = w(lang);
  return [
    t.helpTitle,
    "",
    t.helpSend,
    "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    t.helpName,                                            // NEW: "Or just type the coin's name, e.g. pepe"
    "",
    t.helpForward,
    t.helpChains,
    "",
    t.helpLang,                                            // "Type *language* to change language."
    `${t.helpMore} ${SITE_URL}/?ref=wa-bot`,
  ].join("\n");
}

// CHANGED: the short report, in the person's language (check names + details via the website's phrasebook)
function formatReport(r, lang) {
  const t = w(lang);
  const tn = (s) => plain(translateNote(s, lang));         // translate a Vet note, then make it WhatsApp-safe
  const tk = r.token;
  const fails = r.checks.filter((c) => c.status === "fail");          // worst first
  const warns = r.checks.filter((c) => c.status === "warn");
  const passes = r.checks.filter((c) => c.status === "pass");
  const lines = [
    `${t[r.verdict]}: *${plain(tk.symbol || "?")}* ${t.on} ${plain(tk.chainLabel)}`,
    `${t.liquidity} ${money(r.market.liquidity)} · ${t.vol} ${money(r.market.volume24h)}${r.market.fdv ? ` · FDV ${money(r.market.fdv)}` : ""}`,
  ];
  if (r.history) lines.push(`${t.sinceLaunch} ${pct(r.history.sinceLaunchPct)} · ${t.fromPeak} ${pct(r.history.fromAthPct)}`);
  lines.push("");
  for (const c of [...fails, ...warns].slice(0, 6)) {                 // up to 6 problems, with details
    lines.push(`${ICON[c.status]} *${tn(c.label)}*: ${tn(c.detail)}`);
  }
  if (passes.length) lines.push(`✓ ${t.clean}: ${passes.map((c) => tn(c.label)).join(", ")}`); // passes as one short line
  lines.push("", `📋 ${t.fullReport}: ${reportUrl(tk.address)}`);
  lines.push("", t.disclaimer);
  return lines.join("\n");
}

// NEW: greetings (incl. the ad's pre-filled "नमस्ते" / "مرحبا") get the welcome message, not a coin search
const GREETINGS = /^(hi|hii+|hello|hey|yo|start|\/start|help|good (morning|afternoon|evening)|bonjour|salut|hola|olá|ola|oi|salam|salaam|marhaba|مرحبا|السلام عليكم|سلام|namaste|नमस्ते|sannu|ina kwana|bawo|ẹ n lẹ|e kaaro|ndewo|kedu|how far)[\s!.?]*$/i;

// NEW: could this text be a coin name? (short, a few words, has letters, not a link)
function looksLikeCoinName(text) {
  const t = text.trim().replace(/^\$/, "");               // "$PEPE" -> "PEPE"
  if (t.length < 2 || t.length > 30) return false;         // too short or a whole sentence
  if (t.split(/\s+/).length > 3) return false;             // more than 3 words = probably a question, not a name
  if (/https?:|www\./i.test(t)) return false;              // links are not coin names
  return /[a-z0-9]/i.test(t);                              // needs at least one letter or digit
}

// NEW: list the matching coins as a tap-to-choose menu (max 10 rows, WhatsApp's limit)
function sendCoinChoices(to, messageId, coins, lang) {
  const t = w(lang);
  const rows = coins.slice(0, 10).map((c) => {
    const tag = c.official ? t.official : c.copycat ? `⚠ ${t.copycat}` : "";      // official / possible copycat
    const liq = c.liquidity ? `Liq ${money(c.liquidity)}` : "";
    return {
      id: `vet:${c.address}`,                              // what comes back when they tap (max 200 characters)
      title: `${c.official ? "✓ " : ""}${plain(c.symbol)}`.slice(0, 24),          // WhatsApp's limit: 24 characters
      description: [c.chainLabel, tag, liq].filter(Boolean).join(" · ").slice(0, 72), // limit: 72 characters
    };
  });
  return wa({
    recipient_type: "individual",
    to,
    context: { message_id: messageId },
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: t.pickBody },                          // "Which coin do you mean? ✓ = official..."
      action: { button: t.pickButton, sections: [{ title: "GOAT Vet", rows }] },
    },
  });
}

// Find a contract address inside any text ("" if there isn't one)
function findAddress(text) {
  if (!text) return "";
  const found = cleanQuery(text);                          // the same extractor the Vet page uses
  return isEvmAddress(found) || isSolAddress(found) ? found : "";
}

// ------------------------------------------------------------
// GOAT AI (NEW). Access, memory and payments live in lib/aiAccess.js, shared with the website.
// ------------------------------------------------------------

// Run GOAT AI for one message. Returns true if it replied, false if the normal bot should answer instead.
async function runAi(supabase, from, messageId, chatId, lang, words, row) {
  await markReadAndTyping(messageId);
  const t = w(lang);
  // NEW: if the answer takes more than 10 seconds (web search), say so, so they know we're on it
  let working = false;
  const timer = setTimeout(() => { working = true; reply(from, messageId, t.aiWorking).catch(() => {}); }, 10000);
  const history = await loadHistory(row.code, "whatsapp");
  const last = history[history.length - 1];
  if (last?.role === "user") last.content += "\n" + words; // two messages in a row from them: join them
  else history.push({ role: "user", content: words });

  let ans;
  try {
    ans = await askGoat({ history, lang, nickname: row.nickname, allowWeb: webAllowed(row), channel: "whatsapp", budgetMs: 45000 });
  } catch (err) {
    console.error("GOAT AI error:", err.message);          // visible in Vercel logs
    ans = null;
  } finally {
    clearTimeout(timer);                                   // answered (or failed) in time: no "one moment" needed
  }
  if (!ans || (!ans.text && !ans.coins && !ans.report)) {
    if (looksLikeCoinName(words) && !working) return false; // a coin name: the normal bot's search can still help
    await reply(from, messageId, t.aiBusy);                // CHANGED: say sorry instead of sending the help menu
    return true;
  }

  if (ans.text) await replyLong(from, messageId, ans.truncated ? `${ans.text}\n\n${t.aiMore}` : ans.text); // CHANGED: never cut off
  if (ans.coins?.length) await sendCoinChoices(from, messageId, ans.coins, lang);   // then the tap-to-pick list
  if (ans.report) {
    await reply(from, messageId, formatReport(ans.report, lang));                   // or the full coin report
    await supabase.from("vet_bot_log").insert({ chat_id: chatId, chat_type: "whatsapp", chat_title: null, address: ans.report.token.address, verdict: ans.report.verdict, auto: false });
  }
  if (ans.nickname) await saveNickname(row, ans.nickname);

  await saveTurn(row.code, "whatsapp", words, [ans.text, ans.memo].filter(Boolean).join("\n")); // memo = what the tools did
  await bumpUsage(row, ans.searches || 0);
  return true;
}

// The subscription link for this person (their GOAT ID is filled in on the pay page)
const payLink = (code) => `${SITE_URL}/pay?id=${code}&ref=wa-bot`;

// ------------------------------------------------------------
// HANDLE ONE MESSAGE
// ------------------------------------------------------------

async function handleMessage(m) {
  // NEW: Meta sometimes delivers the same message again (e.g. after a slow reply). Handle each message ONCE.
  if (m.id) {
    const { error } = await db().from("wa_seen").insert({ id: m.id });
    if (error?.code === "23505") return;                   // 23505 = already in the table = already handled
  }
  const from = m.from;                                     // the sender's WhatsApp number (in memory only)
  const supabase = db();
  const chatId = chatIdFor(from);                          // scrambled id, safe to store
  const { lang, saved } = await getLang(supabase, chatId, from); // NEW: their language (saved, or guessed)

  // NEW: their GOAT ID row. A brand-new person first gets a one-time notice: terms, privacy, 18+, not advice.
  const row = await getAccess({ chatId });
  if (row.isNew) await reply(from, m.id, w(lang).legalNotice);

  // NEW: they tapped a language in the menu -> save it, confirm, and show help in that language
  const picked = m.type === "interactive" ? m.interactive?.list_reply?.id || "" : "";
  if (picked.startsWith("lang:")) {
    const code = picked.slice(5);
    if (!WA_LANGS.includes(code)) return;                  // not one of ours: ignore
    await saveLang(supabase, chatId, code);
    await reply(from, m.id, `${w(code).langSet}\n\n${helpText(code)}`);
    return;
  }

  // NEW: they tapped a coin in the "Which coin do you mean?" list -> check that exact contract
  if (picked.startsWith("vet:")) {
    const tapped = picked.slice(4);
    if (isEvmAddress(tapped) || isSolAddress(tapped)) return runVet(supabase, from, m.id, chatId, lang, tapped);
    return;                                                // not a real address: ignore
  }

  const words = m.text?.body || m.image?.caption || m.video?.caption || m.document?.caption || ""; // text, or a caption under media
  if (!words) return;                                      // stickers, reactions, voice notes: stay quiet

  if (LANG_WORDS.test(words.trim())) {                     // NEW: "language", "langue", "harshe"... -> the menu
    await sendLanguageMenu(from, lang);
    return;
  }

  const address = findAddress(words);
  if (address) return runVet(supabase, from, m.id, chatId, lang, address); // a contract address: check it (always free)

  // NEW: GOAT AI access (one GOAT ID per person, shared with the website)

  // "subscribe" -> their GOAT ID and the payment link on goatwatch.app (Paystack)
  if (SUB_WORDS.test(words.trim())) {
    await reply(from, m.id, w(lang).aiSubscribe.replace("{id}", row.code).replace("{link}", payLink(row.code)));
    return;
  }

  // GOAT AI answers everything else (free trial, then paid)
  const access = aiGate(row);
  if (access.ok) {
    const answered = await runAi(supabase, from, m.id, chatId, lang, words, row);
    if (answered) {
      if (!saved && (row.free_used || 0) === 0) await sendLanguageMenu(from, lang); // very first chat: offer languages too
      return;
    }
  } else if ((access.reason === "trial_over" || access.reason === "cap") && row.last_upsell !== today()) {
    const t = w(lang);                                     // tell them once a day, not on every message
    await reply(from, m.id, access.reason === "cap" ? t.aiCap : t.aiUpsell.replace("{n}", FREE_AI_CHATS).replace("{link}", payLink(row.code)));
    await supabase.from("ai_access").update({ last_upsell: today() }).eq("code", row.code);
  }

  // Normal (free) bot: greetings get help, coin names get the list

  if (GREETINGS.test(words.trim()) || !looksLikeCoinName(words)) {         // "hi", or a long sentence: show how to use GOAT
    await reply(from, m.id, helpText(lang));
    if (!saved) await sendLanguageMenu(from, lang);        // first-time users also get the language menu
    return;
  }

  // NEW: a coin NAME ("pepe", "$PEPE", "shiba inu") -> search it like goatwatch.app/vet does
  const name = words.trim().replace(/^\$/, "");
  await markReadAndTyping(m.id);
  const coins = await searchTokens(name).catch(() => []);  // official coins first, then others with real liquidity
  const unique = [...new Map(coins.map((c) => [c.address.toLowerCase(), c])).values()]; // one row per contract
  if (unique.length === 0) {
    await reply(from, m.id, w(lang).noCoins.replace("{q}", plain(name)));         // "No coin found for ..."
    return;
  }
  if (unique.length === 1) return runVet(supabase, from, m.id, chatId, lang, unique[0].address); // only one: check it straight away
  await sendCoinChoices(from, m.id, unique, lang);         // several: let them pick (copycats are labelled)
}

// The full Vet for one contract address (cooldown -> check -> reply -> log). Used for typed, forwarded and tapped coins.
async function runVet(supabase, from, messageId, chatId, lang, address) {
  // Cooldown: one check per person every 15 seconds
  const { data: last } = await supabase
    .from("vet_bot_log")
    .select("at")
    .eq("chat_id", chatId)
    .order("at", { ascending: false })
    .limit(1);
  const lastAt = last?.[0]?.at ? new Date(last[0].at).getTime() : 0;
  if (Date.now() - lastAt < COOLDOWN_SECONDS * 1000) {
    await reply(from, messageId, w(lang).cooldown.replace("{n}", COOLDOWN_SECONDS)); // translated
    return;
  }

  await markReadAndTyping(messageId);                      // blue ticks + "typing..." while we work

  let verdict = "error";
  try {
    const report = await vetToken(address);                // the same engine as goatwatch.app/vet and Telegram
    verdict = report.verdict;
    await reply(from, messageId, formatReport(report, lang)); // in their language
  } catch (err) {
    await reply(from, messageId, `${w(lang).cantCheck} ${plain(translateNote(err.message, lang))}`);
  }

  // Log it (cooldown + growth data). No phone number, no name, no message text.
  await supabase.from("vet_bot_log").insert({
    chat_id: chatId,
    chat_type: "whatsapp",                                 // tells WhatsApp checks apart from Telegram ones
    chat_title: null,
    address,
    verdict,
    auto: false,                                           // on WhatsApp the person always asks
  });
}

// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------

// 1. Handshake: Meta calls GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=123
export async function GET(request) {
  const p = request.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge"), { status: 200 }); // echo the number back = "yes, this URL is ours"
  }
  return new Response("Forbidden", { status: 403 });       // wrong token: not Meta, or not set up
}

// 2. Messages: Meta POSTs JSON describing new messages (and delivery receipts, which we ignore)
export async function POST(request) {
  const raw = await request.text();                        // RAW body: the signature is made from these exact bytes
  if (!signatureIsValid(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false }, { status: 401 }); // not signed by Meta: reject
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });                // junk: ignore (always 200 so Meta doesn't retry)
  }

  // Meta nests messages: entry[] -> changes[] -> value.messages[]
  const messages = (body.entry || [])
    .flatMap((e) => e.changes || [])
    .filter((c) => c.field === "messages")
    .flatMap((c) => c.value?.messages || []);              // delivery/read receipts have no "messages": skipped

  // Answer Meta at once, then do the slow work afterwards. A slow reply makes Meta re-send the same message.
  after(async () => {
    for (const m of messages) {
      try {
        await handleMessage(m);
      } catch (err) {
        console.error("WhatsApp bot error:", err.message); // visible in Vercel logs
      }
    }
  });

  return NextResponse.json({ ok: true });
}