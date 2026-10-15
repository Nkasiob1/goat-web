// app/go/[partner]/route.js: counts a partner click, then forwards to the partner
import { connection } from "next/server";                            // always run fresh, never cached
import { createClient } from "@supabase/supabase-js";                // database client
import { PARTNERS } from "@/lib/partners";                           // the one list of partner links

export async function GET(request, { params }) {
  await connection();
  const { partner } = await params;                                  // e.g. "bybit" (params is a Promise in Next 16)
  const p = PARTNERS[partner];
  if (!p) return Response.redirect(new URL("/", request.url), 302);  // unknown partner -> back to the homepage

  const from = (new URL(request.url).searchParams.get("from") || "unknown").slice(0, 40); // which page sent the click

  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false },
    });
    await db.from("partner_clicks").insert({ partner, source: from }); // count it (no IP, no user id)
  } catch {
    // counting failed -> still send the user on; a click must never be lost
  }

  return Response.redirect(p.url, 302);                              // off to the referral page
}