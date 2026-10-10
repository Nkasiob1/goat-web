import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { runBot } from "@/lib/goatBot";

export const maxDuration = 60;                           // allow up to 60s (downloads + making pictures)

// GET /api/goat-bot: one round of @GOAT posts
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const header = request.headers.get("authorization");   // "Bearer …" from the scheduler
  const given = header?.startsWith("Bearer ") ? header.slice(7) : url.searchParams.get("key"); // or ?key= when testing

  if (!secret || given !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBot(supabaseAdmin(), process.env.GOAT_USER_ID, { origin: url.origin }); // origin = where our logo lives
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}