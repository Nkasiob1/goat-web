"use client"; // runs in the browser: filters + auto-refresh

import { useEffect, useMemo, useState } from "react";
import { CHAIN_LABEL } from "@/lib/radar/sources"; // chain names

// Filter chips across the top
const FILTERS = [
  { id: "all", label: "All" },
  { id: "green", label: "🟢 Passed checks" },
  { id: "yellow", label: "🟡 Caution" },
  { id: "red", label: "🔴 Risky" },
  { id: "listed", label: "🏛 Exchange listings" },
];

// Badge text + colours per verdict
const BADGE = {
  green: { text: "Passed checks", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  yellow: { text: "Caution", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  red: { text: "Risky", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  listed: { text: "New listing", cls: "bg-sky-50 text-sky-800 ring-sky-200" },
};

// $1.2M style money
const money = (n) =>
  n === null || n === undefined
    ? "n/a"
    : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// "5m ago", "3h ago", "2d ago"
function timeAgo(date) {
  if (!date) return "n/a";
  const mins = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

// One coin card
function TokenCard({ t }) {
  const badge = BADGE[t.safety] || BADGE.yellow;
  return (
    <article className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-3">
        {t.image_url ? (
          <img src={t.image_url} alt="" className="h-10 w-10 rounded-full object-cover" /> // coin logo
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800">
            {t.symbol.slice(0, 2)} {/* initials when there's no logo */}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-neutral-900">{t.symbol}</p>
          <p className="truncate text-sm text-neutral-500">
            {t.kind === "cex" ? `${t.source} spot listing` : `${CHAIN_LABEL[t.chain]} · via ${t.source}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      {t.kind === "dex" && (
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-neutral-400">Liquidity</dt>
            <dd className="font-medium text-neutral-800">{money(t.liquidity_usd)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Vol 24h</dt>
            <dd className="font-medium text-neutral-800">{money(t.volume_24h)}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Launched</dt>
            <dd className="font-medium text-neutral-800">{timeAgo(t.pair_created_at)}</dd>
          </div>
        </dl>
      )}

      <ul className="mt-4 space-y-1 text-sm text-neutral-600">
        {(t.safety_notes || []).slice(0, 3).map((note) => (
          <li key={note}>• {note}</li> // the reasons behind the badge
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between pt-5 text-sm">
        <span className="text-neutral-400">Spotted {timeAgo(t.first_seen)}</span>
        <a
          href={t.pair_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-800 hover:underline"
        >
          {t.kind === "cex" ? `Trade on ${t.source}` : "View chart"} ↗
        </a>
      </div>
    </article>
  );
}

export default function RadarView() {
  const [tokens, setTokens] = useState(null); // null = still loading
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  // Load now, then every 60 seconds
  useEffect(() => {
    let alive = true; // stops updates after leaving the page
    async function load() {
      try {
        const res = await fetch("/api/radar/feed", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load the radar");
        if (alive) {
          setTokens(json.tokens);
          setError("");
        }
      } catch (err) {
        if (alive) setError(err.message);
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // Apply the chosen filter
  const shown = useMemo(
    () => (tokens || []).filter((t) => filter === "all" || t.safety === filter),
    [tokens, filter]
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-700">Launch Radar</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        New coins, checked before you see them.
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Fresh pools from GeckoTerminal, DexScreener and Birdeye, plus new Binance, Bybit and OKX listings.
        Every coin is scanned for traps like honeypots and hidden owners. Updated every 15 minutes.
      </p>

      <a
        href="https://t.me/Goatsradar"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-emerald-900 p-5 text-white"
      >
        <span>
          <span className="block font-semibold">Get 🟢 alerts on Telegram</span>
          <span className="block text-sm text-emerald-100">Only coins that pass the checks, and new listings.</span>
        </span>
        <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-emerald-900">Join</span>
      </a>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ${
              filter === f.id
                ? "bg-emerald-900 text-white ring-emerald-900"
                : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {tokens === null && !error && <p className="mt-10 text-neutral-500">Scanning…</p>}

      {tokens !== null && shown.length === 0 && (
        <p className="mt-10 text-neutral-500">Nothing here yet. The radar checks again every 15 minutes.</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <TokenCard key={t.id} t={t} />
        ))}
      </div>

      <p className="mt-10 text-xs text-neutral-400">
        Automated checks reduce risk; they don't remove it. New coins are extremely volatile. Nothing here is
        financial advice.
      </p>
    </main>
  );
}