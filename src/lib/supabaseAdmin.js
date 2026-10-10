import { createClient } from "@supabase/supabase-js";

// a Supabase client with the SECRET key: skips RLS, so it must NEVER reach the browser
export function supabaseAdmin() {
  if (typeof window !== "undefined") {                   // safety net: crash if someone imports this in client code
    throw new Error("supabaseAdmin must only run on the server");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;           // no NEXT_PUBLIC_, so Next.js never sends it to browsers
  if (!url || !key) throw new Error("Missing SUPABASE_SECRET_KEY in .env.local");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }, // a server script, not a logged-in person
  });
}