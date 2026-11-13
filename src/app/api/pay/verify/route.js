// src/app/api/pay/verify/route.js
// GET ?reference=... -> { ok, paidUntil } : used by the "payment done" page right after checkout
import { NextResponse } from "next/server";
import { fulfil } from "../../../../lib/payments";

export async function GET(request) {
  const reference = (request.nextUrl.searchParams.get("reference") || "").slice(0, 80);
  if (!/^goat_[a-z0-9_]+$/.test(reference)) return NextResponse.json({ ok: false, reason: "bad_reference" }, { status: 400 });
  try {
    const result = await fulfil(reference);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, reason: "check_failed" }, { status: 502 });
  }
}
