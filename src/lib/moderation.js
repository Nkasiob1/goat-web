import { supabase } from "./supabase";

export const COMMUNITY_RULES = [                         // NEW: shown in the sidebar and the phone strip
  "Be respectful. Debate ideas, not people.",
  "No links, promotions or “DM me” offers.",
  "Never post wallet addresses or payment QR codes.",
  "No guaranteed-profit claims. Nothing here is financial advice.",
];

export const REASONS = [
  { id: "scam", label: "Scam or fraud", hint: "Wallet addresses, payment QR codes, “send and I’ll double it”" },
  { id: "spam", label: "Spam or promotion", hint: "Ads, referral links, “DM me” offers" },
  { id: "abuse", label: "Abuse or harassment", hint: "Insults, threats, hate" },
  { id: "other", label: "Something else", hint: "Breaks the community rules another way" },
];

export const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.id, r.label]));

export async function reportPost(postId, reason) {
  const { error } = await supabase.from("reports").insert({ post_id: postId, reason });
  if (!error) return "sent";
  if (error.code === "23505") return "already";
  console.error(error);
  return "error";
}