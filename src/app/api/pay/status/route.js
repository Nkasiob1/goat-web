// src/app/api/pay/status/route.js
// GET ?code=G4K9Z2Q -> { paidUntil } : shows the new end date on the "payment done" page (no personal data)
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isGoatCode } from "../../../../lib/aiAccess";

export async function GET(request) {
  const code = (request.nextUrl.searchParams.get("code") || "").toUpperCase();
  if (!isGoatCode(code)) return NextResponse.json({ paidUntil: null }, { status: 400 });
  const { data } = await supabaseAdmin().from("ai_access").select("paid_until").eq("code", code).maybeSingle();
  return NextResponse.json({ paidUntil: data?.paid_until || null });
}
