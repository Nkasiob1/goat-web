// src/app/api/paystack/webhook/route.js
// Paystack calls this when a payment succeeds, even if the person closed the page. Set this URL in
// Paystack -> Settings -> API Keys & Webhooks:  https://goatwatch.app/api/paystack/webhook
import { NextResponse } from "next/server";
import { signatureIsValid } from "../../../../lib/paystack";
import { fulfil } from "../../../../lib/payments";

export async function POST(request) {
  const raw = await request.text();                         // the exact bytes Paystack signed
  if (!signatureIsValid(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 }); // not from Paystack
  }
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await fulfil(event.data.reference);                   // verifies with Paystack again, then adds the days once
    } catch (err) {
      console.error("Paystack webhook error:", err.message);
      return NextResponse.json({ ok: false }, { status: 500 }); // 500 = Paystack retries later
    }
  }
  return NextResponse.json({ ok: true });                   // other events: acknowledged, ignored
}
