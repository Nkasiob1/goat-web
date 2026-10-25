// src/app/api/telegram/daily-summary/route.js
// Vercel's scheduler calls this every morning (see vercel.json).
// It reads YESTERDAY's numbers (GOAT Guard group stats + Vet checks) and DMs them to the admin on Telegram.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeHtml } from "../../../../lib/telegram";   // makes group names safe for Telegram HTML

export const maxDuration = 30;                             // a few database reads + one message: plenty of time

// Server-side database client (secret key, never in the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

// Yesterday's date in Nigeria time, as "2026-10-24" (en-CA formats dates exactly like that)
const yesterdayWAT = () =>
  new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export async function GET(request) {
  // 1. Only Vercel's scheduler knows CRON_SECRET: it sends "Bearer <secret>" automatically
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = db();
  const day = yesterdayWAT();                              // e.g. "2026-10-24"
  const start = new Date(`${day}T00:00:00+01:00`);         // midnight at the START of that day, Nigeria time
  const end = new Date(start.getTime() + 24 * 3600 * 1000); // midnight at the END of that day

  // 2. GOAT Guard: one row per group for that day
  const { data: groups } = await supabase
    .from("group_stats")
    .select("chat_title, joins, leaves, messages, contracts")
    .eq("day", day)
    .order("messages", { ascending: false });              // busiest group first

  // 3. Vet checks made that day (typed /vet and automatic)
  const { data: checks } = await supabase
    .from("vet_bot_log")
    .select("chat_id, verdict, auto")
    .gte("at", start.toISOString())                        // from the start of the day...
    .lt("at", end.toISOString());                          // ...up to (not including) the next midnight

  // 4. Premium waitlist: total sign-ups so far (count only, no emails)
  const { count: waitlist } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });          // head: true = return the number, not the rows

  // 5. Add it all up
  const list = checks || [];
  const byVerdict = (v) => list.filter((c) => c.verdict === v).length; // how many of each colour
  const autoCount = list.filter((c) => c.auto).length;                 // automatic checks
  const chats = new Set(list.map((c) => c.chat_id)).size;              // how many different chats used the bot

  const lines = [
    `🐐 <b>GOAT daily summary</b>: ${day}`,
    "",
    "<b>Vet checks</b>",
    `${list.length} total (${autoCount} auto, ${list.length - autoCount} typed) in ${chats} chat${chats === 1 ? "" : "s"}`,
    `🟢 ${byVerdict("green")} · 🟡 ${byVerdict("yellow")} · 🔴 ${byVerdict("red")} · ⚠️ ${byVerdict("error")} errors`,
    "",
    "<b>Groups</b>",
  ];

  if (groups?.length) {
    for (const g of groups) {                              // one line per group
      lines.push(`• ${escapeHtml(g.chat_title || "Unnamed group")}: +${g.joins} joined, −${g.leaves} left, ${g.messages} msgs, ${g.contracts} contracts`);
    }
  } else {
    lines.push("No group activity yesterday.");
  }

  lines.push("", `📋 Premium waitlist: ${waitlist ?? "n/a"} total`);

  // 6. Send it to you on Telegram, from the GOAT Vet bot
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_VET_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.ADMIN_TELEGRAM_ID,              // your personal Telegram ID (set in Vercel)
      text: lines.join("\n"),
      parse_mode: "HTML",                                  // allows <b>
      link_preview_options: { is_disabled: true },
    }),
    signal: AbortSignal.timeout(10000),                    // never hang on Telegram
  });

  return NextResponse.json({ ok: res.ok, day });           // shows in Vercel logs: did it send?
}