// src/app/api/company/route.js
// GET /api/company?q=cbex  or  ?q=example.com  -> red-flag report for an investment platform
import { NextResponse } from "next/server";
import { checkCompany } from "../../../lib/company";

export const maxDuration = 30;                             // website + registry lookups can be slow

export async function GET(request) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 120); // what the user typed, capped in length
  if (q.length < 3) {
    return NextResponse.json({ error: "Type a platform name or website." }, { status: 400 });
  }
  try {
    const report = await checkCompany(q);                  // all the checks
    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json({ error: "Check failed. Please try again." }, { status: 502 }); // never leak internal errors
  }
}