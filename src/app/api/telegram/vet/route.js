// src/app/api/telegram/vet/route.js
// Telegram calls this (webhook) for messages to @GoatVetbot, in a private chat or a group.
// 1) /vet runs the same full Vet as goatwatch.app/vet and replies with a short report + buttons.
// 2) GOAT Guard counts group activity per day (joins, leaves, messages, contracts). Numbers only, never message text.
// 3) NEW: Auto-check. Any message containing a contract address gets checked automatically (no /vet needed).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vetToken, cleanQuery, isEvmAddress, isSolAddress } from "../../../../lib/vet"; // the one Vet engine
import { escapeHtml } from "../../../../lib/telegram";                                // makes text safe for Telegram HTML
import { SITE_URL } from "../../../../lib/site";                                      // https://goatwatch.app

export const maxDuration = 30;                             // the Vet calls several free APIs: give it time

const BOT_USERNAME = "goatvetbot";                         // lowercase, for comparing "/vet@GoatVetbot"
const COOLDOWN_SECONDS = 15;                               // one check per chat every 15s (protects free API limits)
const AUTO_RECHECK_HOURS = 6;                              // NEW: auto-check skips a coin already checked in this chat within 6h
const ADD_TO_GROUP = "https://t.me/GoatVetbot?startgroup=true"; // opens Telegram's "choose a group" screen for the bot

// Buttons under a message. Each inner array is one row of buttons.
function buttons(reportUrl) {
  const rows = [];
  if (reportUrl) rows.push([{ text: "📋 Full report on goatwatch.app", url: reportUrl }]); // only under a coin report
  rows.push([{ text: "➕ Add GOAT Vet to your group", url: ADD_TO_GROUP }]);                // under every reply
  return { inline_keyboard: rows };
}

// Server-side database client (secret key, never in the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

// Call any Telegram Bot API method, e.g. tg("sendMessage", {...})
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_VET_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),                    // never hang on Telegram
  });
  return res.ok;
}

// Reply in the same chat, as a reply to the user's message, with no big link preview.
// Optional `markup` adds the buttons under the message.
const reply = (msg, html, markup) =>
  tg("sendMessage", {
    chat_id: msg.chat.id,
    text: html,
    parse_mode: "HTML",                                    // allows <b>, <a>, <code>
    reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true },
    link_preview_options: { is_disabled: true },
    ...(markup ? { reply_markup: markup } : {}),           // only include buttons when given
  });

// $1.2M style money
const money = (n) =>
  n === null || n === undefined ? "n/a" : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// +1,234% style percent
const pct = (n) =>
  n === null || n === undefined ? "n/a" : (n > 0 ? "+" : "") + Number(n).toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 1 }) + "%";

const HELP = [
  "🐐 <b>GOAT Vet</b>: free rug-pull check",
  "",
  "Send <code>/vet</code> followed by a contract address:",
  "<code>/vet 0x6982508145454ce325ddbe47a25d4ec3d2311933</code>",
  "",
  "Or just paste a contract address: GOAT checks it automatically.", // NEW
  "In a group, you can also <b>reply</b> to a message containing an address with <code>/vet</code>.",
  "Works on Ethereum, BSC, Solana, Base, Arbitrum, Polygon, Avalanche and Optimism.",
  "",
  "Tap the button below to add GOAT Vet to your own group. It's free.",
].join("\n");

// verdict -> headline (careful wording: green is "no major red flags", never "safe")
const HEAD = {
  green: "🟢 <b>No major red flags</b>",
  yellow: "🟡 <b>Caution</b>",
  red: "🔴 <b>High risk</b>",
};
const ICON = { fail: "✕", warn: "!", pass: "✓", unknown: "?" };

// Address of the full report on the website (ref=tg-bot lets us count visits that came from the bot)
const reportUrl = (address) => `${SITE_URL}/vet?q=${encodeURIComponent(address)}&ref=tg-bot`;

// Build the short report from the same object the Vet page uses
function formatReport(r) {
  const t = r.token;
  const fails = r.checks.filter((c) => c.status === "fail");          // worst first
  const warns = r.checks.filter((c) => c.status === "warn");
  const passes = r.checks.filter((c) => c.status === "pass");
  const lines = [
    `${HEAD[r.verdict]}: <b>${escapeHtml(t.symbol || "?")}</b> on ${escapeHtml(t.chainLabel)}`,
    `Liquidity ${money(r.market.liquidity)} · Vol 24h ${money(r.market.volume24h)}${r.market.fdv ? ` · FDV ${money(r.market.fdv)}` : ""}`,
  ];
  if (r.history) lines.push(`Since launch ${pct(r.history.sinceLaunchPct)} · From peak ${pct(r.history.fromAthPct)}`);
  lines.push("");
  for (const c of [...fails, ...warns].slice(0, 6)) {                 // up to 6 problems, with details
    lines.push(`${ICON[c.status]} <b>${escapeHtml(c.label)}</b>: ${escapeHtml(c.detail)}`);
  }
  if (passes.length) lines.push(`✓ Passed: ${escapeHtml(passes.map((c) => c.label).join(", "))}`); // passes as one short line
  lines.push("", "<i>Automated check. Not financial advice. DYOR.</i>");
  return lines.join("\n");
}

// Today's date in Nigeria time, as "2026-10-24"
const todayWAT = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

// NEW: find a contract address inside any text ("" if there isn't one)
function findAddress(text) {
  if (!text) return "";
  const found = cleanQuery(text);                          // the same extractor the Vet page uses
  return isEvmAddress(found) || isSolAddress(found) ? found : "";
}

// GOAT Guard: count this group event. Only NUMBERS go to the database, never what anyone wrote.
async function countGroupActivity(msg) {
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  if (!isGroup) return;                                    // only count groups, never private chats

  const joins = (msg.new_chat_members || []).filter((u) => !u.is_bot).length; // people who joined (bots don't count)
  const leaves = msg.left_chat_member && !msg.left_chat_member.is_bot ? 1 : 0; // a person who left or was removed
  const words = msg.text || msg.caption || "";             // the message, read in memory only (never saved)
  const isPersonMessage = !msg.from?.is_bot && !joins && !leaves && (words || msg.photo || msg.sticker || msg.video); // a real chat message
  const hasContract = !!findAddress(words);                // CHANGED: uses the shared helper

  if (!joins && !leaves && !isPersonMessage) return;       // nothing worth counting

  await db().rpc("bump_group_stats", {                     // the database adds to today's row in ONE step
    p_chat_id: msg.chat.id,
    p_day: todayWAT(),
    p_title: msg.chat.title?.slice(0, 120) || null,        // the group's name (public), never a person's name
    p_joins: joins,
    p_leaves: leaves,
    p_messages: isPersonMessage ? 1 : 0,
    p_contracts: isPersonMessage && hasContract ? 1 : 0,
  });
}

// NEW: one function runs every check, typed (/vet) or automatic. `auto` changes how polite/quiet it is.
async function runVet(msg, address, auto) {
  const supabase = db();

  // Cooldown: one check per chat every 15 seconds
  const { data: last } = await supabase
    .from("vet_bot_log")
    .select("at")
    .eq("chat_id", msg.chat.id)
    .order("at", { ascending: false })
    .limit(1);
  const lastAt = last?.[0]?.at ? new Date(last[0].at).getTime() : 0;
  if (Date.now() - lastAt < COOLDOWN_SECONDS * 1000) {
    if (!auto) await reply(msg, `⏳ One check every ${COOLDOWN_SECONDS} seconds per chat. Try again in a moment.`);
    return;                                                // auto-check stays silent: never spam a group with "wait"
  }

  // Auto-check only: skip a coin this chat already saw checked recently (shills repost the same contract)
  if (auto) {
    const since = new Date(Date.now() - AUTO_RECHECK_HOURS * 3600 * 1000).toISOString();
    const { data: seen } = await supabase
      .from("vet_bot_log")
      .select("at")
      .eq("chat_id", msg.chat.id)
      .eq("address", address)
      .gte("at", since)                                    // "greater than or equal": only the last 6 hours
      .limit(1);
    if (seen?.length) return;                              // already answered: stay quiet
  }

  await tg("sendChatAction", { chat_id: msg.chat.id, action: "typing" }); // "typing..." while the Vet runs

  let verdict = "error";
  try {
    const report = await vetToken(address);                // the same engine as goatwatch.app/vet
    verdict = report.verdict;
    const header = auto ? "🔎 <b>GOAT auto-check</b>\n" : ""; // tells the group why the bot spoke up
    await reply(msg, header + formatReport(report), buttons(reportUrl(report.token.address)));
  } catch (err) {
    if (!auto) await reply(msg, `Couldn't check that coin: ${escapeHtml(err.message)}`, buttons()); // auto: stay quiet on errors
  }

  // Log it (cooldown, repeat check, growth data). Group names only, never a person's name.
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  await supabase.from("vet_bot_log").insert({
    chat_id: msg.chat.id,
    chat_type: msg.chat.type,
    chat_title: isGroup ? msg.chat.title?.slice(0, 120) : null,
    address,
    verdict,
    auto,                                                  // NEW: true = automatic, false = typed /vet
  });
}

export async function POST(request) {
  // 1. Only Telegram knows the secret: reject everyone else
  if (request.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_VET_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update;
  try {
    update = await request.json();                         // what Telegram sent
  } catch {
    return NextResponse.json({ ok: true });                // junk: ignore (always 200 so Telegram doesn't retry)
  }
  const msg = update.message;
  if (!msg) return NextResponse.json({ ok: true });        // no message at all (e.g. an edit): nothing to do

  // 2. GOAT Guard counts first. A counting error must never stop the Vet, so it has its own try/catch.
  try {
    await countGroupActivity(msg);
  } catch (err) {
    console.error("GOAT Guard count error:", err.message); // visible in Vercel logs
  }

  const words = msg.text || msg.caption || "";             // CHANGED: captions too (contracts are often posted under a picture)
  if (!words || msg.from?.is_bot || msg.via_bot) return NextResponse.json({ ok: true }); // nothing to read, or a bot wrote it (avoid bot loops)

  try {
    // 3. Is this a command for us? "/vet", "/vet@GoatVetbot", "/start", "/help"
    const m = words.trim().match(/^\/(vet|start|help)(?:@(\w+))?(?:\s+([\s\S]*))?$/i);

    if (!m) {                                              // NEW: not a command -> auto-check if it contains a contract
      const address = findAddress(words);
      if (address) await runVet(msg, address, true);
      return NextResponse.json({ ok: true });              // ordinary chat with no contract: stay quiet
    }

    const [, command, mention, arg] = m;
    if (mention && mention.toLowerCase() !== BOT_USERNAME) return NextResponse.json({ ok: true }); // meant for another bot

    if (command.toLowerCase() !== "vet") {                 // /start or /help
      await reply(msg, HELP, buttons());
      return NextResponse.json({ ok: true });
    }

    // 4. /vet: the address is after "/vet", or in the message being replied to
    const raw = arg || msg.reply_to_message?.text || msg.reply_to_message?.caption || "";
    const address = findAddress(raw);                      // CHANGED: shared helper
    if (!address) {
      await reply(msg, "Send a contract address after /vet, for example:\n<code>/vet 0x6982508145454ce325ddbe47a25d4ec3d2311933</code>");
      return NextResponse.json({ ok: true });
    }
    await runVet(msg, address, false);                     // CHANGED: the shared check, typed mode
  } catch (err) {
    console.error("Vet bot error:", err.message);          // visible in Vercel logs
  }

  return NextResponse.json({ ok: true });                  // always 200, so Telegram never re-sends the same message
}