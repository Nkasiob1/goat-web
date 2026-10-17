// src/components/VetView.js
// The checker screen: search box -> pick a coin -> safety report.
"use client";

import { useEffect, useState } from "react";
import { goLink } from "../lib/partners";                  // Bybit partner link

// $1.2M style money
const money = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? "n/a"
    : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);

// tiny prices need more digits: $0.00001234
const price = (n) =>
  n === null || n === undefined ? "n/a" : "$" + (n < 0.01 ? Number(n).toPrecision(3) : Number(n).toLocaleString("en-US", { maximumFractionDigits: 4 }));

// +1,234% / -85.2% style percentages
const pct = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "n/a";
  const digits = Math.abs(n) >= 100 ? 0 : 1;               // big moves don't need decimals
  return (n > 0 ? "+" : "") + Number(n).toLocaleString("en-US", { maximumFractionDigits: digits }) + "%";
};

// green for up, red for down
const tone = (n) => (n === null || n === undefined ? "text-ink" : n >= 0 ? "text-gain" : "text-loss");

// "12 Oct 2026" style date
const day = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// how each verdict looks
const VERDICT = {
  green: { label: "Passed safety checks", icon: "🟢", cls: "border-gain/40 bg-gain/10 text-gain" },
  yellow: { label: "Caution: risks found", icon: "🟡", cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  red: { label: "High risk", icon: "🔴", cls: "border-loss/40 bg-loss/10 text-loss" },
};

// how each check row looks
const STATUS = {
  pass: { icon: "✓", cls: "bg-gain/15 text-gain" },
  warn: { icon: "!", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  fail: { icon: "✕", cls: "bg-loss/15 text-loss" },
  unknown: { icon: "?", cls: "bg-line text-stone" },
};

export default function VetView() {
  const [query, setQuery] = useState("");                  // the search box text
  const [loading, setLoading] = useState(false);           // spinner on/off
  const [error, setError] = useState("");                  // error message
  const [results, setResults] = useState([]);              // search list
  const [report, setReport] = useState(null);              // the safety report
  const [copied, setCopied] = useState(false);             // "Link copied" feedback

  // ask our API, then show either a list or a report
  async function run(q) {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setError("");
    setResults([]);
    setReport(null);
    try {
      const res = await fetch(`/api/vet?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      if (data.type === "report") {
        setReport(data.report);
        setQuery(data.report.token.address);               // NEW: show the clean address in the box
        window.history.replaceState(null, "", `/vet?q=${data.report.token.address}`); // shareable URL
      } else {
        setResults(data.results);
        if (!data.results.length) setError("No coins found. Try the contract address instead.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // opened from a shared link (/vet?q=...)? run it straight away
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      run(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // share the report link (phone share sheet, or copy on desktop)
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "GOAT safety check", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user closed the share sheet: nothing to do */
    }
  }

  const v = report ? VERDICT[report.verdict] : null;       // current verdict style
  const h = report?.history;                               // price history (may be null)

  // the number cards (label, value, colour class, small note)
  const stats = report
    ? [
        ["Price", price(report.market.price), "text-ink", report.market.change24h != null ? `${pct(report.market.change24h)} 24h` : ""],
        [
          h?.fullHistory === false ? "Since first record" : "Since launch",
          h ? pct(h.sinceLaunchPct) : "n/a",
          tone(h?.sinceLaunchPct),
          h ? `from ${price(h.launchPrice)} · ${day(h.since)}` : "",
        ],
        ["From peak", h ? pct(h.fromAthPct) : "n/a", tone(h ? Math.min(h.fromAthPct, 0) : null), h ? `peak ${price(h.athPrice)}` : ""],
        ["Liquidity", money(report.market.liquidity), "text-ink", ""],
        ["Volume 24h", money(report.market.volume24h), "text-ink", ""],
        ["Holders", report.holders ? report.holders.toLocaleString() : "n/a", "text-ink", ""],
      ]
    : [];

  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-10">
      {/* heading */}
      <h1 className="text-3xl font-semibold text-ink">Token Safety Checker</h1>
      <p className="mt-2 text-stone">
        Paste a contract address or type a coin name. We check for honeypots, high taxes, minting, freezing and thin
        liquidity in seconds. Free, no sign-up.
      </p>

      {/* search box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();                              // don't reload the page
          run();
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. pepe, or 0x… / Solana address"
          className="min-w-0 flex-1 rounded-xl border border-line bg-mist px-4 py-3 text-ink placeholder:text-stone focus:border-forest focus:outline-none"
        />
        <button disabled={loading} className="rounded-xl bg-forest px-5 py-3 font-medium text-white disabled:opacity-60">
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      {/* error */}
      {error && <p className="mt-4 rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-loss">{error}</p>}

      {/* search results: official first, copycats flagged */}
      {results.length > 0 && (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-mist">
          {results.map((r) => (
            <li key={`${r.chain}:${r.address}`}>
              <button
                onClick={() => {
                  setQuery(r.address);
                  run(r.address);                          // vet the chosen coin
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sage"
              >
                {r.image ? (
                  <img src={r.image} alt="" className="h-9 w-9 rounded-full" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-sm font-semibold text-forest">
                    {r.symbol?.[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-ink">
                    {r.symbol}
                    <span className="font-normal text-stone">· {r.chainLabel}</span>
                    {r.official && (                       // NEW: the real one, per CoinGecko
                      <span className="rounded-full bg-gain/15 px-2 py-0.5 text-[11px] font-semibold text-gain">✓ Official</span>
                    )}
                    {r.copycat && (                        // NEW: same ticker, different contract
                      <span className="rounded-full bg-loss/15 px-2 py-0.5 text-[11px] font-semibold text-loss">⚠ Possible copycat</span>
                    )}
                  </span>
                  <span className="block truncate text-sm text-stone">{r.name}</span>
                </span>
                <span className="text-right text-sm text-stone">
                  {r.official ? `#${r.rank}` : `Liq ${money(r.liquidity)}`} {/* rank for official, liquidity for others */}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* the report */}
      {report && (
        <section className="mt-6 space-y-4">
          {/* coin header + verdict */}
          <div className="rounded-2xl border border-line bg-mist p-5">
            <div className="flex items-center gap-3">
              {report.token.image && <img src={report.token.image} alt="" className="h-11 w-11 rounded-full" />}
              <div className="min-w-0">
                <p className="text-xl font-semibold text-ink">
                  {report.token.symbol} <span className="text-base font-normal text-stone">{report.token.name}</span>
                </p>
                <p className="truncate font-mono text-xs text-stone">
                  {report.token.chainLabel} · {report.token.address}
                </p>
              </div>
            </div>
            <div className={`mt-4 rounded-xl border px-4 py-3 font-semibold ${v.cls}`}>
              {v.icon} {v.label}
              <span className="ml-2 text-sm font-normal opacity-80">
                {report.counts.fail} fail · {report.counts.warn} warn · {report.counts.pass} pass
              </span>
            </div>
          </div>

          {/* number cards, 2 per row on phones, 3 on wider screens */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(([label, value, cls, note]) => (
              <div key={label} className="rounded-xl border border-line bg-mist p-3">
                <p className="text-xs text-stone">{label}</p>
                <p className={`mt-1 text-lg font-semibold ${cls}`}>{value}</p>
                {note && <p className="mt-0.5 truncate text-xs text-stone">{note}</p>}
              </div>
            ))}
          </div>

          {/* check list */}
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-mist">
            {report.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold ${STATUS[c.status].cls}`}>
                  {STATUS[c.status].icon}
                </span>
                <span>
                  <span className="block font-medium text-ink">{c.label}</span>
                  <span className="block text-sm text-stone">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={share} className="rounded-xl bg-forest px-4 py-2 font-medium text-white">
              {copied ? "Link copied ✓" : "Share this check"}
            </button>
            <a
              href={report.market.pairUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-line px-4 py-2 font-medium text-ink hover:bg-sage"
            >
              View chart ↗
            </a>
          </div>

          {/* partner line (disclosed) */}
          <p className="text-sm text-stone">
            Prefer coins already on a major exchange?{" "}
            <a href={goLink("bybit", "vet")} className="font-medium text-forest underline">
              Trade on Bybit
            </a>{" "}
            (partner link).
          </p>

          {/* honesty footer */}
          <p className="text-xs text-stone">
            Automated checks from GoPlus, DexScreener, GeckoTerminal and CoinGecko, run{" "}
            {new Date(report.checkedAt).toLocaleString()}. &quot;Launch&quot; means the first trade in this pool. A pass
            is not a guarantee: owners can change things after launch. Not financial advice. DYOR.
          </p>
        </section>
      )}
    </main>
  );
}