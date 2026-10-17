// src/app/api/vet/route.js
// GET /api/vet?q=pepe       -> list of matching coins (official first)
// GET /api/vet?q=<address>  -> full safety report
import { NextResponse } from "next/server";
import { searchTokens, vetToken, isEvmAddress, isSolAddress, cleanQuery } from "../../../lib/vet";

export const maxDuration = 30;                             // several free APIs: give them time

export async function GET(request) {
  const q = cleanQuery(request.nextUrl.searchParams.get("q")); // NEW: strip brackets, $, spaces; find addresses
  if (q.length < 2 || q.length > 64) {
    return NextResponse.json({ error: "Type a coin name, ticker or contract address." }, { status: 400 });
  }
  try {
    if (isEvmAddress(q) || isSolAddress(q)) {
      return NextResponse.json({ type: "report", report: await vetToken(q) }); // an address: full check
    }
    return NextResponse.json({ type: "search", results: await searchTokens(q) }); // a name: search list
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 }); // friendly error for the page
  }
}