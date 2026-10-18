// src/app/api/waitlist/route.js
// POST /api/waitlist  { email, lang, source, website }  -> saves one email to the Premium waitlist
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LANGS = new Set(["en", "fr", "es", "pt", "ha", "yo", "ig"]);   // languages we accept
const SOURCES = new Set(["home", "vet"]);                            // pages the box lives on
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;                          // something@something.something

// Server-side client with the secret key (never sent to the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

export async function POST(request) {
  let body;
  try {
    body = await request.json();                                     // the form's data
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ status: "ok" });      // honeypot filled = a bot: pretend success, save nothing

  const email = String(body.email || "").trim().toLowerCase();       // " Kasi@Gmail.com" -> "kasi@gmail.com"
  if (email.length < 5 || email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const lang = LANGS.has(body.lang) ? body.lang : "en";              // unknown values fall back safely
  const source = SOURCES.has(body.source) ? body.source : "home";

  const { error } = await db().from("waitlist").insert({ email, lang, source });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ status: "already" }); // 23505 = email already on the list
    console.error("Waitlist insert failed:", error.message);         // visible in Vercel logs
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ status: "ok" });
}