// src/app/api/pay/status/route.js
// GET ?code=G4K9Z2Q -> { paidUntil } : shows the new end date on the "payment done" page (no personal data)
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isGoatCode, isGroupCode } from "../../../../lib/aiAccess";

export async function GET(request) {
  const code = (request.nextUrl.searchParams.get("code") || "").toUpperCase();
  if (!isGoatCode(code)) return NextResponse.json({ paidUntil: null }, { status: 400 });
  const db = supabaseAdmin();
  if (isGroupCode(code)) {                                 // NEW: a Telegram group's Guard Pro
    const { data: g } = await db.from("guard_groups").select("paid_until").eq("code", code).maybeSingle();
    return NextResponse.json({ paidUntil: g?.paid_until || null });
  }
  let { data } = await db.from("ai_access").select("paid_until, merged_into").eq("code", code).maybeSingle();
  if (data?.merged_into) {                                 // NEW: a WhatsApp ID that was linked into a website account
    ({ data } = await db.from("ai_access").select("paid_until, merged_into").eq("code", data.merged_into).maybeSingle());
  }
  return NextResponse.json({ paidUntil: data?.paid_until || null });
}
