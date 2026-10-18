// lib/radar/run.js: one full radar scan, start to finish
import { createClient } from "@supabase/supabase-js";                       // database client
import { EXCHANGES, fromGecko, fromDexScreener, fromBirdeye, passesRules, CHAIN_LABEL } from "./sources";
import { checkSafety } from "./safety";                                     // GoPlus checks (quick gate)
import { vetToken } from "../vet";                                          // NEW: the full Vet (final gate)
import { sendTelegram, escapeHtml } from "../telegram";                     // channel alerts
import { sleep } from "./http";                                             // polite pauses
import { PARTNERS, goLink } from "../partners";                             // partner (referral) links
import { postRadarToX } from "../x";                                        // posts to @GOATSRADAR
import { SITE_URL } from "../site";                                         // the one place our address lives

const SITE = SITE_URL;                            // our public address
const MAX_CHECKS = 12;                            // quick GoPlus checks per run (free limit)
const MAX_ALERTS = 3;                             // Telegram posts per run (no spam)
const X_PER_RUN = 1;                              // X posts per run (each post costs credit)
const X_MIN_GAP_HOURS = 2;                        // at least 2h between X posts, so 10/day spread over the day
const RECHECK_PER_RUN = 2;                        // NEW: rug watch: re-vet this many green coins every run
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

// market cap if we have it, otherwise FDV, and say which one it is
function capOf(t) {
  if (t.market_cap_usd) return { kind: "mc", value: Number(t.market_cap_usd) };   // real market cap
  if (t.fdv_usd) return { kind: "fdv", value: Number(t.fdv_usd) };                // fallback: fully diluted value
  return null;                                                                    // neither known
}

// Fresh market numbers (market cap, liquidity, volume) from DexScreener, saved back to the row
async function enrich(supabase, t, cache) {
  if (t.kind !== "dex" || !t.address || !t.chain) return t;                // listings have no pool to look up
  if (cache.has(t.id)) return cache.get(t.id);                             // already looked up this run
  let out = t;                                                             // fall back to what we saved
  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/${t.chain}/${t.address}`, {
      signal: AbortSignal.timeout(8000),                                   // never let this slow the run much
    });
    if (res.ok) {
      const pairs = await res.json();                                      // every pool holding this coin
      const mine = (pairs || [])
        .filter((p) => p.baseToken?.address?.toLowerCase() === t.address.toLowerCase()) // pools where it's the main token
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));             // deepest first
      const best = mine[0];
      if (best) {
        const fresh = {
          market_cap_usd: best.marketCap ?? t.market_cap_usd ?? null,      // newest value wins, else keep the old one
          fdv_usd: best.fdv ?? t.fdv_usd ?? null,
          liquidity_usd: best.liquidity?.usd ?? 0,                         // no liquidity reported = treat as $0
          volume_24h: best.volume?.h24 ?? t.volume_24h,
          price_usd: best.priceUsd ? Number(best.priceUsd) : t.price_usd,
        };
        await supabase.from("radar_tokens").update(fresh).eq("id", t.id);  // the radar page gets them too
        out = { ...t, ...fresh };                                          // use the fresh numbers below
      }
    }
  } catch {
    /* DexScreener slow or down: carry on with what we have */
  }
  cache.set(t.id, out);                                                    // remember for later steps
  return out;
}

// NEW: the final gate. Runs the SAME full Vet as goatwatch.app/vet and saves its verdict.
// Returns { ok: true } only for a 🟢 Vet verdict. Listings skip it (the exchange already vetted them).
async function vetGate(supabase, t) {
  if (t.kind !== "dex") return { ok: true, t };                            // exchange listings: no pool to vet
  let report;
  try {
    report = await vetToken(t.address);                                    // contract + liquidity + age + price history
  } catch (err) {
    return { ok: false, t, reason: `vet unavailable: ${err.message}` };    // can't verify = don't post (row unchanged, retried later)
  }
  const problems = report.checks                                           // only the checks that aren't clean
    .filter((c) => c.status === "fail" || c.status === "warn")
    .map((c) => `${c.label}: ${c.detail}`);                                // e.g. "Liquidity: Only $0. Easy to manipulate..."
  const notes = report.verdict === "green"
    ? [`Full Vet passed (${report.counts.pass} checks)`, ...problems]      // green: say so, plus any single warning
    : problems;                                                            // yellow/red: the reasons
  await supabase
    .from("radar_tokens")
    .update({
      safety: report.verdict,                                              // green | yellow | red, same as the Vet page
      safety_notes: notes,
      vetted_at: new Date().toISOString(),                                 // the rug watch uses this to take turns
    })
    .eq("id", t.id);
  const out = { ...t, safety: report.verdict, safety_notes: notes };       // the caption shows Vet's notes
  return { ok: report.verdict === "green", t: out, reason: report.verdict };
}

// Address of the picture card for one coin (drawn by /api/radar/card)
function cardUrl(t) {
  const cap = capOf(t);
  const params = new URLSearchParams({
    s: t.symbol,                                                  // ticker
    k: t.kind,                                                    // dex or cex
    c: t.kind === "cex" ? t.source : CHAIN_LABEL[t.chain] || "",  // exchange or chain name
    l: t.liquidity_usd ?? "",                                     // liquidity (DEX only)
    v: t.volume_24h ?? "",                                        // volume (DEX only)
    m: cap?.value ?? "",                                          // market cap (or FDV)
    mk: cap?.kind ?? "",                                          // "mc" or "fdv" (sets the label)
  });
  return `${SITE}/api/radar/card?${params}`;
}

// Build the Telegram caption for one coin
function formatAlert(t) {
  if (t.kind === "cex") {
    const lines = [
      `🏛 <b>New listing on ${escapeHtml(t.source)}</b>`,
      `<b>${escapeHtml(t.symbol)}</b> / USDT is now trading.`,
      `<a href="${t.pair_url}">Trade on ${escapeHtml(t.source)}</a> · <a href="${SITE}/radar">GOAT Radar</a>`,
    ];
    if (t.source === "Bybit" && PARTNERS.bybit) {                 // sign-up line on Bybit listings only
      lines.push(
        `New to Bybit? <a href="${SITE}${goLink("bybit", "telegram")}">Sign up with GOAT</a> (partner link)`
      );
    }
    lines.push("", "<i>New listings move fast. Not financial advice.</i>");
    return lines.join("\n");
  }
  const cap = capOf(t);
  const capText = cap ? ` · ${cap.kind === "mc" ? "MCap" : "FDV"} ${money(cap.value)}` : "";
  return [
    `🟢 <b>${escapeHtml(t.symbol)}</b> on ${CHAIN_LABEL[t.chain]}`,
    escapeHtml(t.name || ""),
    `Liquidity ${money(t.liquidity_usd)} · Vol 24h ${money(t.volume_24h)}${capText}`,
    `Checks: ${escapeHtml((t.safety_notes || []).join(" · "))}`,  // CHANGED: Vet's notes, separated by dots
    `<code>${escapeHtml(t.address)}</code>`,
    `<a href="${t.pair_url}">Chart</a> · <a href="${SITE}/vet?q=${t.address}">Full safety check</a> · <a href="${SITE}/radar">GOAT Radar</a>`,
    "",
    "<i>Passed GOAT's full Vet. Still high risk. DYOR, not financial advice.</i>", // CHANGED: says which check it passed
  ].join("\n");
}

export async function runRadar() {
  const supabase = db();
  const now = new Date().toISOString();
  const report = { ok: true, exchanges: {}, sources: {}, candidates: 0, checked: 0, alerts: 0, x: [], blocked: [], rechecked: [] }; // NEW: blocked + rechecked lists
  const fresh = new Map();                                                   // enrich() results for this run

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
      const freshList = data.new || [];                                      // truly new listings
      report.exchanges[name] = freshList.length ? `new: ${freshList.join(", ")}` : "no new listings";
      if (freshList.length) {
        const rows = freshList.map((sym) => ({
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

  // ---- 3. Quick safety checks (GoPlus) on the newest unchecked coins ----
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

  // ---- 3b. NEW: rug watch. Re-vet green coins already on the radar, longest-unchecked first ----
  const { data: watch } = await supabase
    .from("radar_tokens")
    .select("*")
    .eq("kind", "dex")
    .eq("safety", "green")                                                   // only coins we currently call safe
    .order("vetted_at", { ascending: true, nullsFirst: true })               // never-vetted first, then the oldest check
    .limit(RECHECK_PER_RUN);
  for (const row of watch || []) {
    const gate = await vetGate(supabase, row);                               // saves the new verdict either way
    report.rechecked.push(`${row.symbol}: ${gate.reason ?? "green"}`);       // e.g. "YOYO: red" when liquidity is pulled
  }

  // ---- 4. Telegram alerts: only coins that pass the FULL Vet, plus exchange listings ----
  const since = new Date(Date.now() - ALERT_WINDOW_HOURS * 36e5).toISOString();
  const { data: toAlert } = await supabase
    .from("radar_tokens")
    .select("*")
    .eq("alerted", false)
    .in("safety", ["green", "listed"])
    .gte("first_seen", since)
    .order("first_seen", { ascending: true })
    .limit(MAX_ALERTS);
  for (const row of toAlert || []) {
    const gate = await vetGate(supabase, await enrich(supabase, row, fresh)); // fresh numbers, then the full Vet
    if (!gate.ok) {
      report.blocked.push(`${row.symbol}: ${gate.reason}`);                  // why it wasn't posted (yellow/red/unavailable)
      continue;                                                              // never post a coin Vet doesn't call green
    }
    const t = gate.t;                                                        // the coin with Vet's notes
    try {
      const sent = await sendTelegram(formatAlert(t), cardUrl(t));           // caption + picture card
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

  // ---- 5. X posts (@GOATSRADAR), spaced out, full Vet too ----
  const { data: last } = await supabase                                      // when did we last post on X?
    .from("radar_tokens")
    .select("x_posted_at")
    .not("x_posted_at", "is", null)                                          // only rows that were posted
    .order("x_posted_at", { ascending: false })                              // newest first
    .limit(1);
  const lastAt = last?.[0]?.x_posted_at ? new Date(last[0].x_posted_at).getTime() : 0; // 0 = never posted
  const waitMs = lastAt + X_MIN_GAP_HOURS * 36e5 - Date.now();               // time left before the next post is allowed

  if (waitMs > 0) {
    report.x.push({ skipped: true, reason: `gap: next X post in ${Math.ceil(waitMs / 6e4)} min` }); // too soon, wait
  } else {
    const { data: toPost, error: xErr } = await supabase
      .from("radar_tokens")
      .select("*")
      .is("x_posted_at", null)                                               // not on X yet
      .in("safety", ["green", "listed"])                                     // same quality bar as Telegram
      .gte("first_seen", since)                                              // only fresh coins
      .order("first_seen", { ascending: false })                             // newest first, freshest coin wins
      .limit(X_PER_RUN);                                                     // 1 per run keeps costs tiny
    if (xErr) report.x.push({ error: xErr.message });                        // e.g. column missing: run the SQL
    for (const row of toPost || []) {
      const cached = fresh.get(row.id);                                      // step 4 may have vetted it already this run
      const gate = cached?.safety === "green"
        ? { ok: true, t: cached }                                            // already passed this run: don't vet twice
        : await vetGate(supabase, await enrich(supabase, row, fresh));       // otherwise: fresh numbers + full Vet
      if (!gate.ok) {
        report.x.push({ symbol: row.symbol, skipped: true, reason: `vet: ${gate.reason}` });
        continue;                                                            // the next run picks another coin
      }
      fresh.set(row.id, gate.t);                                             // remember the vetted version
      const result = await postRadarToX(supabase, gate.t, cardUrl(gate.t));  // never throws
      report.x.push({ symbol: row.symbol, ...result });                      // shows ok / skipped / error in JSON
      if (!result.ok) break;                                                 // X refused: don't retry others this run
    }
  }

  // ---- 6. Prune old entries ----
  const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString();
  await supabase.from("radar_tokens").delete().lt("first_seen", cutoff);

  return report;
}