// lib/radar/run.js: one full radar scan, start to finish
import { createClient } from "@supabase/supabase-js";                       // database client
import { EXCHANGES, fromGecko, fromDexScreener, fromBirdeye, passesRules, CHAIN_LABEL } from "./sources";
import { checkSafety } from "./safety";                                     // GoPlus checks
import { sendTelegram, escapeHtml } from "../telegram";                     // channel alerts
import { sleep } from "./http";                                             // polite pauses

const SITE = "https://goat-web-sandy.vercel.app"; // links in alerts always point at the live site
const MAX_CHECKS = 12;                            // safety checks per run (GoPlus free limit)
const MAX_ALERTS = 3;                             // Telegram posts per run (no spam)
const ALERT_WINDOW_HOURS = 6;                     // only alert coins spotted recently
const KEEP_DAYS = 7;                              // delete radar entries older than this

// Server-side client with the secret key (never runs in the browser)
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

// $1.2M style money
const money = (n) =>
  n === null || n === undefined
    ? "n/a"
    : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// Build the Telegram message for one coin
function formatAlert(t) {
  if (t.kind === "cex") {
    return [
      `🏛 <b>New listing on ${escapeHtml(t.source)}</b>`,
      `<b>${escapeHtml(t.symbol)}</b> / USDT is now trading.`,
      `<a href="${t.pair_url}">Trade on ${escapeHtml(t.source)}</a> · <a href="${SITE}/radar">GOAT Radar</a>`,
      "",
      "<i>New listings move fast. Not financial advice.</i>",
    ].join("\n");
  }
  return [
    `🟢 <b>${escapeHtml(t.symbol)}</b> on ${CHAIN_LABEL[t.chain]}`,
    escapeHtml(t.name || ""),
    `Liquidity ${money(t.liquidity_usd)} · Vol 24h ${money(t.volume_24h)}`,
    `Checks: ${escapeHtml((t.safety_notes || []).join(", "))}`,
    `<code>${escapeHtml(t.address)}</code>`,
    `<a href="${t.pair_url}">Chart</a> · <a href="${SITE}/radar">GOAT Radar</a>`,
    "",
    "<i>Passed automated checks. Still high risk. DYOR, not financial advice.</i>",
  ].join("\n");
}

export async function runRadar() {
  const supabase = db();
  const now = new Date().toISOString();
  const report = { ok: true, exchanges: {}, sources: {}, candidates: 0, checked: 0, alerts: 0 };

  // ---- 1. Exchanges: compare today's coin list with the saved one ----
  for (const [name, ex] of Object.entries(EXCHANGES)) {
    try {
      const bases = [...new Set(await ex.bases())];                          // unique symbols
      const { data, error } = await supabase.rpc("radar_register_symbols", {
        p_exchange: name,
        p_symbols: bases,
      });
      if (error) throw error;
      if (data.baseline) {                                                   // first run: just remember
        report.exchanges[name] = `baseline saved (${bases.length} coins)`;
        continue;
      }
      const fresh = data.new || [];                                          // truly new listings
      report.exchanges[name] = fresh.length ? `new: ${fresh.join(", ")}` : "no new listings";
      if (fresh.length) {
        const rows = fresh.map((sym) => ({
          id: `cex:${name.toLowerCase()}:${sym}`,
          kind: "cex",
          symbol: sym,
          name: sym,
          source: name,
          pair_url: ex.trade(sym),
          safety: "listed",
          safety_notes: [`New ${name} spot listing`],
          updated_at: now,
        }));
        const { error: upErr } = await supabase.from("radar_tokens").upsert(rows, { onConflict: "id" });
        if (upErr) throw upErr;
      }
    } catch (err) {
      report.exchanges[name] = `error: ${err.message}`;                      // one exchange failing never stops the rest
    }
  }

  // ---- 2. DEX sources: gather, filter, merge duplicates ----
  const sources = { GeckoTerminal: fromGecko, DexScreener: fromDexScreener, Birdeye: fromBirdeye };
  const merged = new Map();                                                  // id → best candidate
  for (const [name, fetchList] of Object.entries(sources)) {
    if (name === "Birdeye" && !process.env.BIRDEYE_API_KEY) {
      report.sources[name] = "skipped (no key)";
      continue;
    }
    try {
      const list = await fetchList();
      let kept = 0;
      for (const c of list) {
        if (!passesRules(c)) continue;                                       // below the bar
        kept++;
        const prev = merged.get(c.id);
        if (!prev || (c.liquidity_usd || 0) > (prev.liquidity_usd || 0)) merged.set(c.id, c); // keep the deeper pool
      }
      report.sources[name] = `${list.length} found, ${kept} passed`;
    } catch (err) {
      report.sources[name] = `error: ${err.message}`;
    }
  }
  report.candidates = merged.size;

  if (merged.size) {
    // Upsert only market fields, so safety/alerted/first_seen stay as they were
    const rows = [...merged.values()].map((c) => ({ ...c, updated_at: now }));
    const { error } = await supabase.from("radar_tokens").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }

  // ---- 3. Safety checks on the newest unchecked coins ----
  const { data: pending } = await supabase
    .from("radar_tokens")
    .select("id, chain, address")
    .eq("kind", "dex")
    .eq("safety", "pending")
    .order("first_seen", { ascending: false })
    .limit(MAX_CHECKS);
  for (const t of pending || []) {
    try {
      const { safety, notes } = await checkSafety(t);
      await supabase.from("radar_tokens").update({ safety, safety_notes: notes }).eq("id", t.id);
      report.checked++;
    } catch (err) {
      report.safetyError = err.message;                                      // shown in the JSON, run continues
    }
    await sleep(1200);                                                       // stay under GoPlus's free rate limit
  }

  // ---- 4. Telegram alerts: green coins and new listings ----
  const since = new Date(Date.now() - ALERT_WINDOW_HOURS * 36e5).toISOString();
  const { data: toAlert } = await supabase
    .from("radar_tokens")
    .select("*")
    .eq("alerted", false)
    .in("safety", ["green", "listed"])
    .gte("first_seen", since)
    .order("first_seen", { ascending: true })
    .limit(MAX_ALERTS);
  for (const t of toAlert || []) {
    try {
      const sent = await sendTelegram(formatAlert(t));
      if (sent.skipped) {                                                    // keys missing: don't mark as sent
        report.telegram = "skipped (TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL missing)";
        break;
      }
      await supabase.from("radar_tokens").update({ alerted: true }).eq("id", t.id);
      report.alerts++;
    } catch (err) {
      report.telegram = `error: ${err.message}`;
      break;                                                                 // stop if Telegram refuses
    }
  }

  // ---- 5. Prune old entries ----
  const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString();
  await supabase.from("radar_tokens").delete().lt("first_seen", cutoff);

  return report;
}