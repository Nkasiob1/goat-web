// src/app/api/ai/link/route.js
// NEW: POST -> a one-time code to link this website account with the person's WhatsApp chat.
// They send "LINK 123456" to the GOAT WhatsApp bot within 10 minutes; the bot merges the two GOAT IDs.
// Logged-in users only: the browser sends its Supabase login token, and we check it here.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { createLinkCode } from "../../../../lib/aiAccess";
import { WHATSAPP_URL } from "../../../../lib/site";

export async function POST(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "login" }, { status: 401 });
  const { data } = await supabaseAdmin().auth.getUser(token); // Supabase checks the token is real and not expired
  const user = data?.user;
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

  try {
    const { code, expiresAt } = await createLinkCode(user.id);
    const text = `LINK ${code}`;                            // exactly what they send on WhatsApp
    return NextResponse.json({
      code,
      text,
      expiresAt,
      whatsapp: `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`, // opens WhatsApp with the message already typed
    });
  } catch {
    return NextResponse.json({ error: "busy" }, { status: 500 });   // e.g. the ai_link table is missing: run the SQL
  }
}
