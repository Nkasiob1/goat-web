import { supabase } from "./supabase";

export const REASONS = [ // what members can report, with a hint so they pick the right one
  { id: "scam", label: "Scam or fraud", hint: "Wallet addresses, payment QR codes, “send and I’ll double it”" },
  { id: "spam", label: "Spam or promotion", hint: "Ads, referral links, “DM me” offers" },
  { id: "abuse", label: "Abuse or harassment", hint: "Insults, threats, hate" },
  { id: "other", label: "Something else", hint: "Breaks the community rules another way" },
];

export const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.id, r.label])); // { scam: "Scam or fraud", ... }

// returns "sent", "already" (reported before) or "error"
export async function reportPost(postId, reason) {
  const { error } = await supabase.from("reports").insert({ post_id: postId, reason }); // reporter_id fills itself in
  if (!error) return "sent";
  if (error.code === "23505") return "already"; // unique (post_id, reporter_id) said no
  console.error(error);
  return "error";
}