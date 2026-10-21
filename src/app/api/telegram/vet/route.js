// src/app/api/telegram/vet/route.js
// Telegram calls this (webhook) whenever someone sends /vet to @GoatVetbot, in a private chat or a group.
// It runs the same full Vet as goatwatch.app/vet and replies with a short report + link to the full one.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vetToken, cleanQuery, isEvmAddress, isSolAddress } from "../../../../lib/vet"; // the one Vet engine
import { escapeHtml } from "../../../../lib/telegram";                                // makes text safe for Telegram HTML
import { SITE_URL } from "../../../../lib/site";                                      // https://goatwatch.app

export const maxDuration = 30;                             // the Vet calls several free APIs: give it time

const BOT_USERNAME = "goatvetbot";                         // lowercase, for comparing "/vet@GoatVetbot"
const COOLDOWN_SECONDS = 15;                               // one check per chat every 15s (protects free API limits)

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

// Reply in the same chat, as a reply to the user's message, with no big link preview
const reply = (msg, html) =>
  tg("sendMessage", {
    chat_id: msg.chat.id,
    text: html,
    parse_mode: "HTML",                                    // allows <b>, <a>, <code>
    reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true },
    link_preview_options: { is_disabled: true },
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
  "In a group, you can also <b>reply</b> to a message containing an address with <code>/vet</code>.",
  "Works on Ethereum, BSC, Solana, Base, Arbitrum, Polygon, Avalanche and Optimism.",
  "",
  `Full checker: <a href="${SITE_URL}/vet?ref=tg-bot">goatwatch.app/vet</a>`,
].join("\n");

// verdict -> headline (careful wording: green is "no major red flags", never "safe")
const HEAD = {
  green: "🟢 <b>No major red flags</b>",
  yellow: "🟡 <b>Caution</b>",
  red: "🔴 <b>High risk</b>",
};
const ICON = { fail: "✕", warn: "!", pass: "✓", unknown: "?" };

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
  lines.push(
    "",
    `<a href="${SITE_URL}/vet?q=${encodeURIComponent(t.address)}&ref=tg-bot">Full report on goatwatch.app</a>`,
    "<i>Automated check. Not financial advice. DYOR.</i>"
  );
  return lines.join("\n");
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
  if (!msg?.text) return NextResponse.json({ ok: true });  // not a text message: nothing to do

  // 2. Is this a command for us? "/vet", "/vet@GoatVetbot", "/start", "/help"
  const m = msg.text.trim().match(/^\/(vet|start|help)(?:@(\w+))?(?:\s+([\s\S]*))?$/i);
  if (!m) return NextResponse.json({ ok: true });          // ordinary chat message: stay quiet
  const [, command, mention, arg] = m;
  if (mention && mention.toLowerCase() !== BOT_USERNAME) return NextResponse.json({ ok: true }); // meant for another bot

  try {
    if (command.toLowerCase() !== "vet") {                 // /start or /help
      await reply(msg, HELP);
      return NextResponse.json({ ok: true });
    }

    // 3. Find the address: after "/vet", or in the message being replied to
    const raw = arg || msg.reply_to_message?.text || msg.reply_to_message?.caption || "";
    const address = cleanQuery(raw);                       // pulls an address out of any text (same as the Vet page)
    if (!isEvmAddress(address) && !isSolAddress(address)) {
      await reply(msg, "Send a contract address after /vet, for example:\n<code>/vet 0x6982508145454ce325ddbe47a25d4ec3d2311933</code>");
      return NextResponse.json({ ok: true });
    }

    // 4. Cooldown: one check per chat every 15 seconds
    const supabase = db();
    const { data: last } = await supabase
      .from("vet_bot_log")
      .select("at")
      .eq("chat_id", msg.chat.id)
      .order("at", { ascending: false })
      .limit(1);
    const lastAt = last?.[0]?.at ? new Date(last[0].at).getTime() : 0;
    if (Date.now() - lastAt < COOLDOWN_SECONDS * 1000) {
      await reply(msg, `⏳ One check every ${COOLDOWN_SECONDS} seconds per chat. Try again in a moment.`);
      return NextResponse.json({ ok: true });
    }

    // 5. Show "typing..." while the Vet runs (a few seconds)
    await tg("sendChatAction", { chat_id: msg.chat.id, action: "typing" });

    // 6. The full Vet (the same engine as goatwatch.app/vet)
    let verdict = "error";
    try {
      const report = await vetToken(address);
      verdict = report.verdict;
      await reply(msg, formatReport(report));
    } catch (err) {
      await reply(msg, `Couldn't check that coin: ${escapeHtml(err.message)}`); // e.g. "isn't trading on any supported DEX yet"
    }

    // 7. Log it (cooldown + growth data). Group names only, never a person's name.
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    await supabase.from("vet_bot_log").insert({
      chat_id: msg.chat.id,
      chat_type: msg.chat.type,
      chat_title: isGroup ? msg.chat.title?.slice(0, 120) : null,
      address,
      verdict,
    });
  } catch (err) {
    console.error("Vet bot error:", err.message);          // visible in Vercel logs
  }

  return NextResponse.json({ ok: true });                  // always 200, so Telegram never re-sends the same message
}