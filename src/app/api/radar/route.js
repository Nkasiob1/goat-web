// app/api/radar/route.js: runs one radar scan (called by Supabase cron)
import { connection } from "next/server";     // marks this route as always-live, never prerendered
import { runRadar } from "@/lib/radar/run";   // the scan itself

export const maxDuration = 60;                // allow up to 60s on Vercel

export async function GET(request) {
  await connection();                                                       // run fresh on every call
  const url = new URL(request.url);
  const given =
    request.headers.get("authorization")?.replace("Bearer ", "") ||         // header form
    url.searchParams.get("key");                                            // or ?key= form
  if (!process.env.CRON_SECRET || given !== process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 }); // strangers can't trigger scans
  }
  try {
    return Response.json(await runRadar());                                 // the report JSON
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}