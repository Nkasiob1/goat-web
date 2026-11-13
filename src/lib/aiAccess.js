// src/lib/aiAccess.js
// GOAT AI access, shared by WhatsApp and the website: one GOAT ID, one free trial, one subscription.
// Server only (uses the secret key). Phone numbers and emails are never stored here.
import { createHash } from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin";           // secret-key client (skips RLS, server only)

export const FREE_AI_CHATS = 10;                           // free AI replies per person, ever (the trial)
export const PAID_DAILY_CAP = 100;                         // fair-use replies per paying person per day
export const WEB_SEARCHES_PER_DAY = Number(process.env.GOAT_AI_WEB_PER_DAY || 10); // ~₦15 each
const HISTORY_LIMIT = 12;                                  // remember the last 12 messages (6 back-and-forths)

// Plans sold on goatwatch.app/pay (prices in kobo: ₦1 = 100 kobo). Change in Vercel without a code change.
export const PLANS = {
  week: { days: 7, kobo: Number(process.env.GOAT_PRICE_WEEK_KOBO || 50000) },   // ₦500 for 7 days
  month: { days: 30, kobo: Number(process.env.GOAT_PRICE_MONTH_KOBO || 150000) }, // ₦1,500 for 30 days
};

export const today = () => new Date().toISOString().slice(0, 10); // "2026-11-13" (UTC)

// GOAT IDs: short codes people can quote. Never made from a phone number or email directly.
export const codeForChat = (chatId) => "G" + Math.abs(chatId).toString(36).toUpperCase().slice(-7);      // WhatsApp users
export const codeForUser = (userId) =>
  "W" + BigInt("0x" + createHash("sha256").update(String(userId)).digest("hex").slice(0, 12)).toString(36).toUpperCase().slice(-7); // website users

export const isGoatCode = (s) => /^[GW][0-9A-Z]{4,7}$/.test(String(s || ""));

// Find (or create) the access row for a WhatsApp chat or a logged-in website user
export async function getAccess({ chatId, userId }) {
  const db = supabaseAdmin();
  const col = chatId ? "chat_id" : "user_id";
  const val = chatId ?? userId;
  let { data: row } = await db.from("ai_access").select("*").eq(col, val).maybeSingle();
  if (!row) {
    const fresh = chatId ? { code: codeForChat(chatId), chat_id: chatId } : { code: codeForUser(userId), user_id: userId };
    const { data } = await db.from("ai_access").upsert(fresh, { onConflict: "code" }).select().single();
    row = data || { ...fresh, free_used: 0, day_count: 0, day_searches: 0 };
  }
  return row;
}

export const isPaid = (row) => Boolean(row.paid_until && new Date(row.paid_until) > new Date());

// May this person use GOAT AI right now? -> { ok, reason: "trial_over" | "cap" | "off", paid }
export function gate(row) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "off" };
  const paid = isPaid(row);
  const usedToday = row.day === today() ? row.day_count || 0 : 0;
  if (paid) return usedToday >= PAID_DAILY_CAP ? { ok: false, reason: "cap", paid } : { ok: true, paid };
  return (row.free_used || 0) >= FREE_AI_CHATS ? { ok: false, reason: "trial_over", paid } : { ok: true, paid };
}

export const webAllowed = (row) => (row.day === today() ? row.day_searches || 0 : 0) < WEB_SEARCHES_PER_DAY;

// Count one AI reply (+ any web searches it used)
export async function bumpUsage(row, searches = 0) {
  const sameDay = row.day === today();
  await supabaseAdmin().from("ai_access").update({
    free_used: isPaid(row) ? row.free_used : (row.free_used || 0) + 1,
    day: today(),
    day_count: (sameDay ? row.day_count || 0 : 0) + 1,
    day_searches: (sameDay ? row.day_searches || 0 : 0) + searches,
  }).eq("code", row.code);
}

export async function saveNickname(row, nickname) {
  await supabaseAdmin().from("ai_access").update({ nickname }).eq("code", row.code);
}

// Last messages from the past 24 hours for this person + channel, oldest first, cleaned for the API
export async function loadHistory(code, channel) {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  await db.from("ai_chat").delete().eq("code", code).lt("at", since);   // forget anything older than 24 hours
  const { data } = await db.from("ai_chat").select("role, content")
    .eq("code", code).eq("channel", channel).gte("at", since)
    .order("at", { ascending: false }).limit(HISTORY_LIMIT);
  const msgs = [];
  for (const m of (data || []).reverse()) {
    if (!msgs.length && m.role !== "user") continue;       // must start with the person
    const prev = msgs[msgs.length - 1];
    if (prev && prev.role === m.role) prev.content += "\n" + m.content; // merge two in a row from the same side
    else msgs.push({ role: m.role, content: m.content });
  }
  return msgs;
}

export async function saveTurn(code, channel, userText, botText) {
  await supabaseAdmin().from("ai_chat").insert([
    { code, channel, role: "user", content: String(userText).slice(0, 1000) },
    { code, channel, role: "assistant", content: String(botText || "…").slice(0, 2000) },
  ]);
}

// Add days to a subscription (renewals stack on top of time already paid)
export async function addPaidDays(code, days) {
  const db = supabaseAdmin();
  const { data: row } = await db.from("ai_access").select("paid_until").eq("code", code).maybeSingle();
  if (!row) return false;
  const start = row.paid_until && new Date(row.paid_until) > new Date() ? new Date(row.paid_until) : new Date();
  const until = new Date(start.getTime() + days * 86400000).toISOString();
  await db.from("ai_access").update({ paid_until: until }).eq("code", code);
  return until;
}
