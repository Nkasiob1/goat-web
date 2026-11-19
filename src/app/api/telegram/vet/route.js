// src/app/api/telegram/vet/route.js
// Telegram calls this (webhook) for messages to @GoatVetbot, in a private chat or a group.
// 1) /vet runs the same full Vet as goatwatch.app/vet and replies with a short report + buttons.
// 2) GOAT Guard counts group activity per day (joins, leaves, messages, contracts). Numbers only, never message text.
// 3) Auto-check. Any message containing a contract address gets checked automatically (no /vet needed).
// 4) NEW: GOAT Guard Pro (paid, per group): removes 🔴 High risk coins, guards links, /report, no promo button.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vetToken, cleanQuery, isEvmAddress, isSolAddress } from "../../../../lib/vet"; // the one Vet engine
import { escapeHtml } from "../../../../lib/telegram";                                // makes text safe for Telegram HTML
import { SITE_URL } from "../../../../lib/site";                                      // https://goatwatch.app
import { getGuard, isPro, noteJoins, isNewMember, linkDomains, hasLink, secWarnedDomain, weekReport, logAction, NEW_MEMBER_HOURS } from "../../../../lib/guard"; // NEW: Guard Pro

export const maxDuration = 30;                             // the Vet calls several free APIs: give it time

const BOT_USERNAME = "goatvetbot";                         // lowercase, for comparing "/vet@GoatVetbot"
const COOLDOWN_SECONDS = 15;                               // one check per chat every 15s (protects free API limits)
const AUTO_RECHECK_HOURS = 6;                              // NEW: auto-check skips a coin already checked in this chat within 6h
const ADD_TO_GROUP = "https://t.me/GoatVetbot?startgroup=true"; // opens Telegram's "choose a group" screen for the bot

// Buttons under a message. Each inner array is one row of buttons.
// CHANGED: Pro groups don't get the "Add GOAT Vet" promo button (cleaner for paying admins).
function buttons(reportUrl, pro = false) {
  const rows = [];
  if (reportUrl) rows.push([{ text: "📋 Full report on goatwatch.app", url: reportUrl }]); // only under a coin report
  if (!pro) rows.push([{ text: "➕ Add GOAT Vet to your group", url: ADD_TO_GROUP }]);    // free groups and private chats
  return rows.length ? { inline_keyboard: rows } : undefined;
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

// NEW: same as tg() but returns Telegram's JSON answer (to read a result, e.g. someone's admin status)
async function tgJson(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_VET_BOT_TOKEN}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

// NEW: is the sender an admin of this group? (Anonymous admins post "as the group" and count too.)
async function isAdmin(msg) {
  if (msg.sender_chat?.id === msg.chat.id) return true;
  const r = await tgJson("getChatMember", { chat_id: msg.chat.id, user_id: msg.from?.id });
  return ["creator", "administrator"].includes(r?.result?.status);
}

// NEW: post in the group WITHOUT replying (used after we deleted the message we'd reply to)
const say = (chatId, html, markup) =>
  tg("sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true }, ...(markup ? { reply_markup: markup } : {}) });

// NEW: delete a message (needs the bot to be an admin with "Delete messages"). Returns true if it worked.
const removeMsg = (msg) => tg("deleteMessage", { chat_id: msg.chat.id, message_id: msg.message_id });

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
  "",
  "🛡️ <b>GOAT Guard Pro</b> for group admins: removes 🔴 High risk coins, blocks links from new members, removes links to SEC-warned platforms, and /report. Type <code>/pro</code> in your group.", // NEW
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
async function runVet(msg, address, auto, guard = null) {   // CHANGED: + this group's Guard row
  const supabase = db();
  const pro = isPro(guard);

  // NEW (Pro): a coin this group already saw as 🔴 in the last 6 hours, posted again -> remove it straight away
  if (pro && auto && guard.delete_red) {
    const since = new Date(Date.now() - AUTO_RECHECK_HOURS * 3600 * 1000).toISOString();
    const { data: seenRed } = await supabase.from("vet_bot_log").select("at")
      .eq("chat_id", msg.chat.id).eq("address", address).eq("verdict", "red").gte("at", since).limit(1);
    if (seenRed?.length && !(await isAdmin(msg)) && (await removeMsg(msg))) {
      await logAction(msg.chat.id, "repost_red");
      await say(msg.chat.id, "🛡️ <b>GOAT Guard</b> removed a repost of a coin already flagged 🔴 <b>High risk</b> in this group.");
      return;
    }
  }

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
    // NEW (Pro): a 🔴 coin posted by a non-admin is removed, and the report explains why
    if (pro && auto && guard.delete_red && verdict === "red" && !(await isAdmin(msg)) && (await removeMsg(msg))) {
      await logAction(msg.chat.id, "red_coin");
      await say(msg.chat.id, "🛡️ <b>GOAT Guard removed a message</b> with a 🔴 High risk coin.\n\n" + formatReport(report), buttons(reportUrl(report.token.address), true));
    } else {
      await reply(msg, header + formatReport(report), buttons(reportUrl(report.token.address), pro));
    }
  } catch (err) {
    if (!auto) await reply(msg, `Couldn't check that coin: ${escapeHtml(err.message)}`, buttons(null, pro)); // auto: stay quiet on errors
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

// NEW: /pro, /report and /guard. Only in groups, and only group admins can use them.
async function guardCommand(msg, cmd, arg, guard) {
  if (!guard) return reply(msg, "🛡️ GOAT Guard Pro works inside groups. Add me to your group, make me an admin, then type /pro there.", buttons());
  if (!(await isAdmin(msg))) return reply(msg, "Only group admins can use this command.");
  const pro = isPro(guard);
  const until = pro ? new Date(guard.paid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const payUrl = `${SITE_URL}/pay?id=${guard.code}`;

  if (cmd === "pro") {
    const lines = pro
      ? [`🛡️ <b>GOAT Guard Pro is active</b> until ${until}.`, "", `Group ID: <code>${guard.code}</code>`,
         `Remove 🔴 coins: <b>${guard.delete_red ? "on" : "off"}</b> · Link guard: <b>${guard.link_guard ? "on" : "off"}</b>`,
         "Change with <code>/guard coins off</code> or <code>/guard links off</code>. See your week with /report."]
      : ["🛡️ <b>GOAT Guard Pro</b> protects this group:", "",
         "• Removes messages with 🔴 High risk coins (and reposts of them)",
         `• Removes links from new members for their first ${NEW_MEMBER_HOURS} hours`,
         "• Removes links to platforms on SEC Nigeria's warning list",
         "• /report: your group's week in numbers",
         "• No GOAT promo button in your group", "",
         `₦5,000 for 30 days. No auto-renew. Group ID: <code>${guard.code}</code>`,
         "Make me an admin with <b>Delete messages</b> so I can remove scam posts."];
    return reply(msg, lines.join("\n"), { inline_keyboard: [[{ text: pro ? "➕ Add 30 more days" : "🛡️ Get Guard Pro", url: payUrl }]] });
  }

  if (!pro) return reply(msg, "This is a GOAT Guard Pro feature. Type /pro to see what it does.");

  if (cmd === "report") {
    const r = await weekReport(msg.chat.id);
    return reply(msg, [
      "📊 <b>GOAT Guard: last 7 days</b>", "",
      `👥 Joined ${r.joins} · Left ${r.leaves}`,
      `💬 Messages ${r.messages} · Contracts posted ${r.contracts}`,
      `🔎 Coins checked ${r.checked}: 🟢 ${r.green} · 🟡 ${r.yellow} · 🔴 ${r.red}`,
      `🛡️ Messages removed by Guard: ${r.removed}`, "",
      `Pro active until ${until}.`,
    ].join("\n"));
  }

  // /guard coins on|off, /guard links on|off
  const [what, onoff] = arg.split(/\s+/);
  const col = what === "coins" ? "delete_red" : what === "links" ? "link_guard" : null;
  if (!col || !["on", "off"].includes(onoff)) {
    return reply(msg, "Use <code>/guard coins on</code>, <code>/guard coins off</code>, <code>/guard links on</code> or <code>/guard links off</code>.");
  }
  await db().from("guard_groups").update({ [col]: onoff === "on" }).eq("code", guard.code);
  return reply(msg, `✅ ${what === "coins" ? "Removing 🔴 coins" : "Link guard"} is now <b>${onoff}</b>.`);
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

  // NEW: this group's Guard row (null in private chats). Remember new members in Pro groups for the link guard.
  let guard = null;
  try {
    guard = await getGuard(msg.chat);
    if (isPro(guard) && msg.new_chat_members?.length) await noteJoins(msg.chat.id, msg.new_chat_members);
  } catch (err) {
    console.error("GOAT Guard Pro error:", err.message);
  }

  const words = msg.text || msg.caption || "";             // CHANGED: captions too (contracts are often posted under a picture)
  if (!words || msg.from?.is_bot || msg.via_bot) return NextResponse.json({ ok: true }); // nothing to read, or a bot wrote it (avoid bot loops)

  // NEW (Pro): link guard. Links to SEC-warned platforms are removed for everyone except admins;
  // links from people who joined in the last 24 hours are removed too (the classic scam-bot pattern).
  if (isPro(guard) && guard.link_guard && hasLink(words) && !words.trim().startsWith("/")) {
    try {
      if (!(await isAdmin(msg))) {
        const warned = await secWarnedDomain(linkDomains(words));
        const fresh = !warned && msg.from?.id ? await isNewMember(msg.chat.id, msg.from.id) : false;
        if ((warned || fresh) && (await removeMsg(msg))) {
          await logAction(msg.chat.id, warned ? "sec_warned_link" : "new_member_link");
          await say(msg.chat.id, warned
            ? `🛡️ <b>GOAT Guard</b> removed a link to <b>${escapeHtml(warned.name)}</b>, which is on SEC Nigeria's warning list.`
            : `🛡️ <b>GOAT Guard</b> removed a link: new members can post links after ${NEW_MEMBER_HOURS} hours.`);
          return NextResponse.json({ ok: true });
        }
      }
    } catch (err) {
      console.error("GOAT Guard link error:", err.message);
    }
  }

  try {
    // 3. Is this a command for us? "/vet", "/vet@GoatVetbot", "/start", "/help"
    const m = words.trim().match(/^\/(vet|start|help|pro|report|guard)(?:@(\w+))?(?:\s+([\s\S]*))?$/i); // CHANGED: + Guard Pro commands

    if (!m) {                                              // NEW: not a command -> auto-check if it contains a contract
      const address = findAddress(words);
      if (address) await runVet(msg, address, true, guard);
      return NextResponse.json({ ok: true });              // ordinary chat with no contract: stay quiet
    }

    const [, command, mention, arg] = m;
    if (mention && mention.toLowerCase() !== BOT_USERNAME) return NextResponse.json({ ok: true }); // meant for another bot

    const cmd = command.toLowerCase();
    if (["pro", "report", "guard"].includes(cmd)) {        // NEW: Guard Pro commands (groups, admins only)
      await guardCommand(msg, cmd, (arg || "").trim().toLowerCase(), guard);
      return NextResponse.json({ ok: true });
    }
    if (cmd !== "vet") {                                   // /start or /help
      await reply(msg, HELP, buttons(null, isPro(guard)));
      return NextResponse.json({ ok: true });
    }

    // 4. /vet: the address is after "/vet", or in the message being replied to
    const raw = arg || msg.reply_to_message?.text || msg.reply_to_message?.caption || "";
    const address = findAddress(raw);                      // CHANGED: shared helper
    if (!address) {
      await reply(msg, "Send a contract address after /vet, for example:\n<code>/vet 0x6982508145454ce325ddbe47a25d4ec3d2311933</code>");
      return NextResponse.json({ ok: true });
    }
    await runVet(msg, address, false, guard);              // CHANGED: the shared check, typed mode
  } catch (err) {
    console.error("Vet bot error:", err.message);          // visible in Vercel logs
  }

  return NextResponse.json({ ok: true });                  // always 200, so Telegram never re-sends the same message
}