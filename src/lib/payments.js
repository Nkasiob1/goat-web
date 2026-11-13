// src/lib/payments.js
// Turning a successful Paystack payment into GOAT AI days. Used by BOTH the webhook and the "payment done" page,
// so whichever arrives first activates it, and the other does nothing (a payment can never be counted twice).
import { supabaseAdmin } from "./supabaseAdmin";
import { verifyTransaction } from "./paystack";
import { addPaidDays, PLANS } from "./aiAccess";

// Returns { ok, code, paidUntil } or { ok: false, reason }
export async function fulfil(reference) {
  const db = supabaseAdmin();
  const { data: pay } = await db.from("payments").select("*").eq("reference", reference).maybeSingle();
  if (!pay) return { ok: false, reason: "unknown_reference" };            // not a payment we started
  if (pay.status === "success") return { ok: true, code: pay.code, already: true };

  const tx = await verifyTransaction(reference);            // ask Paystack itself, never trust the browser
  if (tx.status !== "success") return { ok: false, reason: tx.status || "not_paid" };
  if (tx.currency !== "NGN" || Number(tx.amount) !== Number(pay.amount_kobo)) {
    await db.from("payments").update({ status: "mismatch" }).eq("reference", reference); // amount changed: flag it, don't activate
    return { ok: false, reason: "amount_mismatch" };
  }

  // Claim the payment: only ONE caller can switch it from pending to success
  const { data: claimed } = await db.from("payments")
    .update({ status: "success", paid_at: new Date().toISOString(), channel: tx.channel || null })
    .eq("reference", reference).eq("status", "pending")
    .select();
  if (!claimed?.length) return { ok: true, code: pay.code, already: true }; // someone else already activated it

  const days = PLANS[pay.plan]?.days || 0;
  const paidUntil = await addPaidDays(pay.code, days);
  return { ok: true, code: pay.code, paidUntil };
}
