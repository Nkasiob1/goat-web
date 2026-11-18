// src/lib/aiAccess.js
// GOAT AI access, shared by WhatsApp and the website: one GOAT ID, one free trial, one subscription.
// Server only (uses the secret key). Phone numbers and emails are never stored here.
import { createHash, randomInt } from "node:crypto";   // CHANGED: + randomInt for one-time link codes
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
    row = { ...row, isNew: true };                         // NEW: first contact ever (used for the one-time terms notice)
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
  const { data: row } = await db.from("ai_access").select("paid_until, merged_into").eq("code", code).maybeSingle();
  if (!row) return false;
  if (row.merged_into) return addPaidDays(row.merged_into, days); // NEW: a linked (retired) GOAT ID pays into the account it joined
  const start = row.paid_until && new Date(row.paid_until) > new Date() ? new Date(row.paid_until) : new Date();
  const until = new Date(start.getTime() + days * 86400000).toISOString();
  await db.from("ai_access").update({ paid_until: until }).eq("code", code);
  return until;
}

// ---------- NEW: link a website account and a WhatsApp chat into ONE GOAT ID ----------
// The website shows a one-time 6-digit code; the person sends "LINK 123456" to the WhatsApp bot.
// No phone number is ever stored: only the scrambled chat id gets attached to their account.
const LINK_MINUTES = 10;                                   // a code works for 10 minutes, once

// Website side: make a fresh code for this logged-in user (any older code of theirs stops working)
export async function createLinkCode(userId) {
  const db = supabaseAdmin();
  const now = new Date().toISOString();
  await db.from("ai_link").delete().or(`user_id.eq.${userId},expires_at.lt."${now}"`); // their old code + anyone's expired ones
  const expiresAt = new Date(Date.now() + LINK_MINUTES * 60000).toISOString();
  for (let tries = 0; tries < 3; tries++) {
    const code = String(randomInt(100000, 1000000));       // 6 random digits, e.g. "482913"
    const { error } = await db.from("ai_link").insert({ code, user_id: userId, expires_at: expiresAt });
    if (!error) return { code, expiresAt };
    if (error.code !== "23505") throw new Error(error.message); // 23505 = that code is taken right now: try another
  }
  throw new Error("could not make a link code");
}

// Time left on a pass, in milliseconds (0 if none)
const timeLeft = (row) => (row?.paid_until ? Math.max(0, new Date(row.paid_until) - Date.now()) : 0);

// WhatsApp side: "LINK 123456" arrived from this chat. Returns the merged GOAT ID, or null if the code is bad.
export async function redeemLinkCode(code, chatId) {
  const db = supabaseAdmin();
  const { data: link } = await db.from("ai_link").select("user_id")
    .eq("code", code).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!link) return null;                                  // wrong or expired
  await db.from("ai_link").delete().eq("code", code);      // one use only

  const web = await getAccess({ userId: link.user_id });   // the website account's row (W...)
  if (web.chat_id === chatId) return web.code;             // already linked to this chat
  const { data: chat } = await db.from("ai_access").select("*").eq("chat_id", chatId).maybeSingle(); // this chat's row

  const merged = { chat_id: chatId };
  if (chat && !chat.user_id) {                             // a WhatsApp-only row (G...): fold it into the account
    const left = timeLeft(web) + timeLeft(chat);           // passes bought on both sides ADD UP
    merged.paid_until = left ? new Date(Date.now() + left).toISOString() : web.paid_until;
    merged.free_used = Math.max(web.free_used || 0, chat.free_used || 0); // the trial is per person, not per app
    merged.nickname = web.nickname || chat.nickname || null;
    const sameDay = web.day === today() && chat.day === today();
    merged.day = today();
    merged.day_count = sameDay ? (web.day_count || 0) + (chat.day_count || 0) : web.day === today() ? web.day_count || 0 : chat.day === today() ? chat.day_count || 0 : 0;
    merged.day_searches = sameDay ? (web.day_searches || 0) + (chat.day_searches || 0) : web.day === today() ? web.day_searches || 0 : chat.day === today() ? chat.day_searches || 0 : 0;
    const { error } = await db.from("ai_access")           // retire the old WhatsApp-only row (kept, not deleted:
      .update({ chat_id: null, paid_until: null, merged_into: web.code }) // payment records may point at it, and an old
      .eq("code", chat.code);                              // pay link with that GOAT ID must still credit the right person)
    if (error) throw new Error(error.message);             // e.g. merged_into column missing: stop before anything half-changes
  } else if (chat) {                                       // this chat was linked to ANOTHER account: move it here
    const { error } = await db.from("ai_access").update({ chat_id: null }).eq("code", chat.code); // that account keeps its pass
    if (error) throw new Error(error.message);
  }
  const { error } = await db.from("ai_access").update(merged).eq("code", web.code);
  if (error) throw new Error(error.message);
  return web.code;
}
