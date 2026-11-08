// src/app/api/whatsapp/webhook/route.js
// Meta's WhatsApp Cloud API calls this webhook for every message sent to GOAT's WhatsApp number.
// 1) GET  = the one-time handshake: Meta checks this URL is ours (verify token -> echo the challenge).
// 2) POST = a message arrived: check Meta's signature, find a contract address, run the SAME Vet
//    as goatwatch.app/vet and the Telegram bot, and reply in the chat.
// GOAT only ever REPLIES (inside WhatsApp's 24-hour window), so replies are free and never spam.
// Privacy: phone numbers are never stored. The log keeps a one-way scrambled number instead.
import { NextResponse, after } from "next/server";          // after() = run work AFTER answering Meta
import { createHmac, timingSafeEqual } from "node:crypto";   // signature check + scrambling phone numbers
import { createClient } from "@supabase/supabase-js";
import { vetToken, cleanQuery, isEvmAddress, isSolAddress } from "../../../../lib/vet"; // the one Vet engine
import { SITE_URL } from "../../../../lib/site";                                      // https://goatwatch.app

export const maxDuration = 30;                             // the Vet calls several free APIs: give it time

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
// We sign it ourselves and compare. A stranger can't produce the right signature.
function signatureIsValid(rawBody, header) {
  if (!header || !process.env.WHATSAPP_APP_SECRET) return false;          // no signature, or not configured
  const expected = "sha256=" + createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
    .update(rawBody, "utf8")                               // sign the body exactly as it arrived
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);   // compare in constant time (no timing hints for attackers)
}

// Turn a phone number into a number that identifies the person for cooldowns, but can't be turned back.
// Keyed with our secret, so nobody can guess numbers and match them. Range is far from Telegram's chat ids.
function chatIdFor(phone) {
  const hex = createHmac("sha256", process.env.WHATSAPP_APP_SECRET).update(phone).digest("hex");
  return -(2 ** 52) + parseInt(hex.slice(0, 12), 16);      // 48 random bits, shifted into a range of its own
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

// verdict -> headline (careful wording: green is "no major red flags", never "safe")
const HEAD = {
  green: "🟢 *No major red flags*",
  yellow: "🟡 *Caution*",
  red: "🔴 *High risk*",
};
const ICON = { fail: "✕", warn: "!", pass: "✓", unknown: "?" };

// Full report on the website (ref=wa-bot lets us count visits that came from WhatsApp)
const reportUrl = (address) => `${SITE_URL}/vet?q=${encodeURIComponent(address)}&ref=wa-bot`;

const HELP = [
  "🐐 *GOAT Vet*: free rug-pull check",
  "",
  "Send me any contract address and I go check am for you:",
  "0x6982508145454ce325ddbe47a25d4ec3d2311933",
  "",
  "You fit forward a coin from any group too. I go reply with the verdict.",
  "Works on Ethereum, BSC, Solana, Base, Arbitrum, Polygon, Avalanche and Optimism.",
  "",
  `More tools: ${SITE_URL}/?ref=wa-bot`,
].join("\n");

// Build the short report from the same object the Vet page uses
function formatReport(r) {
  const t = r.token;
  const fails = r.checks.filter((c) => c.status === "fail");          // worst first
  const warns = r.checks.filter((c) => c.status === "warn");
  const passes = r.checks.filter((c) => c.status === "pass");
  const lines = [
    `${HEAD[r.verdict]}: *${plain(t.symbol || "?")}* on ${plain(t.chainLabel)}`,
    `Liquidity ${money(r.market.liquidity)} · Vol 24h ${money(r.market.volume24h)}${r.market.fdv ? ` · FDV ${money(r.market.fdv)}` : ""}`,
  ];
  if (r.history) lines.push(`Since launch ${pct(r.history.sinceLaunchPct)} · From peak ${pct(r.history.fromAthPct)}`);
  lines.push("");
  for (const c of [...fails, ...warns].slice(0, 6)) {                 // up to 6 problems, with details
    lines.push(`${ICON[c.status]} *${plain(c.label)}*: ${plain(c.detail)}`);
  }
  if (passes.length) lines.push(`✓ Passed: ${plain(passes.map((c) => c.label).join(", "))}`); // passes as one short line
  lines.push("", `📋 Full report: ${reportUrl(t.address)}`);
  lines.push("", "_Automated check. Not financial advice. DYOR._");
  return lines.join("\n");
}

// Find a contract address inside any text ("" if there isn't one)
function findAddress(text) {
  if (!text) return "";
  const found = cleanQuery(text);                          // the same extractor the Vet page uses
  return isEvmAddress(found) || isSolAddress(found) ? found : "";
}

// ------------------------------------------------------------
// HANDLE ONE MESSAGE
// ------------------------------------------------------------

async function handleMessage(m) {
  const from = m.from;                                     // the sender's WhatsApp number (in memory only)
  const words = m.text?.body || m.image?.caption || m.video?.caption || m.document?.caption || ""; // text, or a caption under media
  if (!words) return;                                      // stickers, reactions, voice notes: stay quiet

  const address = findAddress(words);
  if (!address) {                                          // no contract: show how to use GOAT
    await reply(from, m.id, HELP);
    return;
  }

  const supabase = db();
  const chatId = chatIdFor(from);                          // scrambled id, safe to store

  // Cooldown: one check per person every 15 seconds
  const { data: last } = await supabase
    .from("vet_bot_log")
    .select("at")
    .eq("chat_id", chatId)
    .order("at", { ascending: false })
    .limit(1);
  const lastAt = last?.[0]?.at ? new Date(last[0].at).getTime() : 0;
  if (Date.now() - lastAt < COOLDOWN_SECONDS * 1000) {
    await reply(from, m.id, `⏳ One check every ${COOLDOWN_SECONDS} seconds. Try again small time.`);
    return;
  }

  await markReadAndTyping(m.id);                           // blue ticks + "typing..." while we work

  let verdict = "error";
  try {
    const report = await vetToken(address);                // the same engine as goatwatch.app/vet and Telegram
    verdict = report.verdict;
    await reply(from, m.id, formatReport(report));
  } catch (err) {
    await reply(from, m.id, `Couldn't check that coin: ${plain(err.message)}`);
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

  // Answer Meta at once, then do the slow Vet afterwards. A slow reply makes Meta re-send the same message.
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