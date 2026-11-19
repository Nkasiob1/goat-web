// src/lib/guard.js
// NEW: GOAT Guard Pro, the paid plan for Telegram groups. Server only (uses the secret key).
// Each group gets a GOAT ID starting with "T" (made from its chat id, never from anyone's personal data).
// Pro adds: auto-delete of 🔴 High risk coins, a link guard (new members + SEC-warned sites), /report, no promo button.
import { createHash } from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin";

export const GUARD_PLAN = { id: "guard_month", days: 30, kobo: Number(process.env.GOAT_PRICE_GUARD_KOBO || 500000) }; // ₦5,000 / 30 days
export const NEW_MEMBER_HOURS = 24;                         // new members can't post links for their first 24 hours

// "T" + the group's chat id in base 36, e.g. T1A2B3C4. Telegram group ids are negative: we drop the sign.
export const codeForGroup = (chatId) => "T" + Math.abs(Number(chatId)).toString(36).toUpperCase().slice(-9);

// Find (or create) this group's Guard row. Returns null for private chats.
export async function getGuard(chat) {
  if (chat.type !== "group" && chat.type !== "supergroup") return null;
  const db = supabaseAdmin();
  const { data: row } = await db.from("guard_groups").select("*").eq("chat_id", chat.id).maybeSingle();
  if (row) return row;
  const fresh = { code: codeForGroup(chat.id), chat_id: chat.id, title: chat.title?.slice(0, 120) || null };
  const { data } = await db.from("guard_groups").upsert(fresh, { onConflict: "code" }).select().maybeSingle();
  return data || { ...fresh, paid_until: null, delete_red: true, link_guard: true };
}

export const isPro = (row) => Boolean(row?.paid_until && new Date(row.paid_until) > new Date());

// Add paid days (renewals stack on top of time left). Used by payments.js after Paystack confirms.
export async function addGuardDays(code, days) {
  const db = supabaseAdmin();
  const { data: row } = await db.from("guard_groups").select("paid_until").eq("code", code).maybeSingle();
  if (!row) return false;
  const start = row.paid_until && new Date(row.paid_until) > new Date() ? new Date(row.paid_until) : new Date();
  const until = new Date(start.getTime() + days * 86400000).toISOString();
  await db.from("guard_groups").update({ paid_until: until }).eq("code", code);
  return until;
}

// A member, scrambled: we never store Telegram user ids as they are (and the scramble differs per group)
const memberKey = (chatId, userId) =>
  createHash("sha256").update(`${chatId}:${userId}:${process.env.TELEGRAM_VET_SECRET || "goat"}`).digest("hex").slice(0, 32);

// Remember that someone joined (Pro groups only). Deleted after NEW_MEMBER_HOURS by the cleanup.
export async function noteJoins(chatId, users) {
  const rows = users.filter((u) => !u.is_bot).map((u) => ({ member: memberKey(chatId, u.id), chat_id: chatId }));
  if (rows.length) await supabaseAdmin().from("guard_joins").upsert(rows, { onConflict: "member" });
}

// Did this person join within the last NEW_MEMBER_HOURS?
export async function isNewMember(chatId, userId) {
  const since = new Date(Date.now() - NEW_MEMBER_HOURS * 3600 * 1000).toISOString();
  const { data } = await supabaseAdmin().from("guard_joins").select("member")
    .eq("member", memberKey(chatId, userId)).gte("joined_at", since).maybeSingle();
  return Boolean(data);
}

// Links in a message: every domain mentioned (lower case, without "www."). A bare "word.word" only counts
// when it ends in a real web ending, so "ok.thanks" in normal chat is never treated as a link.
const TLDS = "com|net|org|io|app|xyz|co|ng|finance|pro|site|online|top|vip|cc|me|info|biz|club|live|link|ai|exchange|trade|money|bet|win|tk|ml|ga|cf|gq|ly|to|gg|im|us|uk|in|ae|world|cash|capital|fund|invest|global|asia";
const LINK_RE = new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?((?:[a-z0-9-]+\\.)+(?:${TLDS}))(?![a-z0-9-])(?:[/:?#]\\S*)?`, "gi");
export function linkDomains(text) {
  const found = String(text || "").match(LINK_RE) || [];
  return [...new Set(found.map((u) => u.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/:?#]/)[0].toLowerCase()))];
}
export const hasLink = (text) => /(https?:\/\/|t\.me\/|wa\.me\/|www\.)/i.test(String(text || "")) || linkDomains(text).length > 0;

// Is any of these domains a platform on SEC Nigeria's warning list (our platforms table)?
export async function secWarnedDomain(domains) {
  if (!domains.length) return null;
  const { data } = await supabaseAdmin().from("platforms").select("name, domains")
    .eq("status", "sec_warning").overlaps("domains", domains).limit(1);
  return data?.[0] || null;                                // { name, domains } or null
}

// Last 7 days of group activity (the numbers GOAT Guard already counts) + what Guard caught
export async function weekReport(chatId) {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const { data: days } = await db.from("group_stats").select("joins, leaves, messages, contracts")
    .eq("chat_id", chatId).gte("day", since);
  const sum = (k) => (days || []).reduce((n, d) => n + (d[k] || 0), 0);
  const sinceIso = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: checks } = await db.from("vet_bot_log").select("verdict").eq("chat_id", chatId).gte("at", sinceIso);
  const count = (v) => (checks || []).filter((c) => c.verdict === v).length;
  const { count: removed } = await db.from("guard_actions").select("id", { count: "exact", head: true })
    .eq("chat_id", chatId).gte("at", sinceIso);
  return {
    joins: sum("joins"), leaves: sum("leaves"), messages: sum("messages"), contracts: sum("contracts"),
    checked: (checks || []).length, red: count("red"), yellow: count("yellow"), green: count("green"),
    removed: removed || 0,
  };
}

// Log one thing Guard removed (numbers and reason only, never the message text)
export async function logAction(chatId, reason) {
  await supabaseAdmin().from("guard_actions").insert({ chat_id: chatId, reason: String(reason).slice(0, 40) });
}
