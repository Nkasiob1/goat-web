// src/app/api/ref/route.js
// Receives { ref, path } from RefTracker and saves one row in ref_visits.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanRef } from "../../../lib/ref";

// Server-side database client (secret key, never in the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

export async function POST(request) {
  let body;
  try {
    body = await request.json();                           // { ref, path }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 }); // not JSON: ignore
  }

  const ref = cleanRef(body?.ref);                         // check the label again: never trust the browser
  if (!ref) return NextResponse.json({ ok: false }, { status: 400 });

  let path = String(body?.path || "/").slice(0, 100);      // page, max 100 characters
  if (!path.startsWith("/")) path = "/";                   // only our own pages

  const { error } = await db().from("ref_visits").insert({ ref, path });
  if (error) console.error("ref_visits insert error:", error.message); // visible in Vercel logs

  return NextResponse.json({ ok: true });
}