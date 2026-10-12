// app/api/radar/feed/route.js: read-only list for the /radar page
import { connection } from "next/server";             // always-live route
import { createClient } from "@supabase/supabase-js"; // database client

export async function GET() {
  await connection();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("radar_tokens")
    .select(
      "id, kind, chain, address, symbol, name, source, pair_url, image_url, liquidity_usd, volume_24h, pair_created_at, safety, safety_notes, first_seen"
    )                                                  // only what the page shows
    .neq("safety", "pending")                          // hide coins still being checked
    .order("first_seen", { ascending: false })         // newest first
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ tokens: data }, { headers: { "Cache-Control": "no-store" } });
}