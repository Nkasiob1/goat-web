// src/app/api/pay/init/route.js
// POST { code, plan, email } -> { url } : starts a Paystack checkout for GOAT AI
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { initTransaction } from "../../../../lib/paystack";
import { PLANS, isGoatCode } from "../../../../lib/aiAccess";
import { SITE_URL } from "../../../../lib/site";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;             // simple email shape check (Paystack needs one for the receipt)

export async function POST(request) {
  if (!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({ error: "Payments are not switched on yet." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim().toUpperCase();
  const plan = PLANS[body.plan] ? body.plan : null;
  const email = String(body.email || "").trim().slice(0, 120);
  if (!isGoatCode(code) || !plan || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Check your GOAT ID, plan and email." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: owner } = await db.from("ai_access").select("code").eq("code", code).maybeSingle();
  if (!owner) return NextResponse.json({ error: "We couldn't find that GOAT ID. Copy it from the GOAT bot or your GOAT account." }, { status: 404 });

  const reference = `goat_${Date.now().toString(36)}_${randomBytes(5).toString("hex")}`; // unique, unguessable
  const amountKobo = PLANS[plan].kobo;
  await db.from("payments").insert({ reference, code, plan, amount_kobo: amountKobo, status: "pending" }); // email is NOT stored by us

  try {
    const tx = await initTransaction({
      email,
      amountKobo,
      reference,
      metadata: { goat_id: code, plan },                    // shows in your Paystack dashboard
      callbackUrl: `${SITE_URL}/pay/done`,                  // Paystack sends them back here with ?reference=
    });
    return NextResponse.json({ url: tx.authorization_url });
  } catch (err) {
    await db.from("payments").update({ status: "failed_init" }).eq("reference", reference);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again." }, { status: 502 });
  }
}
