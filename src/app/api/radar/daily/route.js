// app/api/radar/daily/route.js: once a day, post yesterday's radar numbers to the @Goatsradar channel.
// Called by Supabase cron (job "goat-radar-daily"). Shows GOAT working even on days with no 🟢 coin.
// It names high-risk coins only with Vet's own measured reasons, and never promotes any coin.
import { connection } from "next/server";                                   // always run fresh, never prerendered
import { createClient } from "@supabase/supabase-js";                        // database client
import { sendTelegram, escapeHtml } from "@/lib/telegram";                   // channel post
import { CHAIN_LABEL } from "@/lib/radar/sources";                           // "solana" -> "Solana"
import { SITE_URL } from "@/lib/site";                                       // https://goatwatch.app

export const maxDuration = 30;                                               // a few reads + one message

// Server-side client with the secret key (never runs in the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

// Yesterday's date in Nigeria time, e.g. "2026-11-15"
const yesterdayWAT = () =>
  new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

// The single most telling Vet reason for a high-risk coin (crash or whale first)
function topReason(notes = []) {
  const pick = notes.find((n) => n.startsWith("Price crash")) ||            // e.g. "Down 92% from its peak..."
    notes.find((n) => n.startsWith("Holders")) ||                            // e.g. "One wallet holds 100%..."
    notes.find((n) => n.startsWith("Liquidity")) ||                          // e.g. "Only $0.05..."
    notes[0] || "";
  return pick.split(". ")[0];                                                // first sentence only, keeps it short
}

export async function GET(request) {
  await connection();                                                        // run fresh on every call
  const url = new URL(request.url);
  const given =
    request.headers.get("authorization")?.replace("Bearer ", "") ||          // header form (Supabase cron)
    url.searchParams.get("key");                                             // or ?key= when testing
  if (!process.env.CRON_SECRET || given !== process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 }); // strangers can't post to the channel
  }

  const supabase = db();
  const day = yesterdayWAT();                                                // e.g. "2026-11-15"
  const start = new Date(`${day}T00:00:00+01:00`);                           // midnight at the START of that day (WAT)
  const end = new Date(start.getTime() + 24 * 3600 * 1000);                  // midnight at the END of it

  // 1. Every DEX coin the radar first saw yesterday, with its latest verdict
  const { data: rows, error } = await supabase
    .from("radar_tokens")
    .select("symbol, chain, safety, safety_notes, alerted")
    .eq("kind", "dex")
    .gte("first_seen", start.toISOString())
    .lt("first_seen", end.toISOString());
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const list = rows || [];
  if (!list.length) return Response.json({ ok: true, day, skipped: "no coins yesterday" }); // nothing to report

  // 2. Add it up
  const count = (s) => list.filter((r) => r.safety === s).length;            // how many of each verdict
  const green = count("green");
  const yellow = count("yellow");
  const red = count("red");
  const posted = list.filter((r) => r.alerted).length;                       // how many reached the channel

  // 3. Up to 3 high-risk examples, with Vet's measured reason
  const examples = list
    .filter((r) => r.safety === "red" && (r.safety_notes || []).length)
    .sort((a, b) => Number((b.safety_notes || []).some((n) => n.startsWith("Price crash"))) -
                    Number((a.safety_notes || []).some((n) => n.startsWith("Price crash")))) // crashes first
    .slice(0, 3)
    .map((r) => `• <b>${escapeHtml(r.symbol)}</b> (${escapeHtml(CHAIN_LABEL[r.chain] || r.chain || "")}): ${escapeHtml(topReason(r.safety_notes))}`);

  // 4. Build the post
  const lines = [
    `🐐 <b>GOAT Radar daily report</b>: ${day}`,
    "",
    `Yesterday GOAT checked <b>${list.length}</b> new coins:`,
    `🟢 ${green} no major red flags · 🟡 ${yellow} caution · 🔴 ${red} high risk`,
  ];
  if (examples.length) lines.push("", "<b>Caught by the checks:</b>", ...examples);
  lines.push(
    "",
    posted
      ? `${posted} coin${posted === 1 ? "" : "s"} passed every check and ${posted === 1 ? "was" : "were"} posted here.`
      : "None passed every check, so GOAT posted none. Most new coins don't.",
    `Check any coin yourself: <a href="${SITE_URL}/vet">goatwatch.app/vet</a>`,
    "",
    "<i>Results describe each coin at check time. Not financial advice.</i>"
  );

  // 5. Post it to the channel (text only, no picture)
  try {
    const sent = await sendTelegram(lines.join("\n"));
    if (sent?.skipped) return Response.json({ ok: false, day, error: "Telegram keys missing" });
  } catch (err) {
    return Response.json({ ok: false, day, error: err.message }, { status: 500 });
  }
  return Response.json({ ok: true, day, checked: list.length, green, yellow, red, posted }); // shows in cron history
}
