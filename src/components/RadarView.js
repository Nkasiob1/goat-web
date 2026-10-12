"use client"; // runs in the browser: filters + auto-refresh

import { useEffect, useMemo, useState } from "react";
import { CHAIN_LABEL } from "@/lib/radar/sources"; // chain names

// Filter chips across the top
const FILTERS = [
  { id: "all", label: "All" },
  { id: "green", label: "🟢 Passed checks" },
  { id: "yellow", label: "🟡 Caution" },
  { id: "red", label: "🔴 Risky" },
  { id: "listed", label: "🏛 Listings" },
];

// Badge text + colours per verdict (traffic-light colours carry meaning, so they stay)
const BADGE = {
  green: { text: "Passed", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  yellow: { text: "Caution", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  red: { text: "Risky", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  listed: { text: "Listing", cls: "bg-sky-50 text-sky-800 ring-sky-200" },
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
    <article className="flex min-w-0 flex-col rounded-3xl border border-line bg-water p-5"> {/* min-w-0: never wider than its grid cell */}
      <div className="flex min-w-0 items-center gap-3">
        {t.image_url ? (
          <img src={t.image_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> // coin logo
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest/10 text-sm font-semibold text-forest">
            {t.symbol.slice(0, 2)} {/* initials when there's no logo */}
          </div>
        )}
        <div className="min-w-0 flex-1"> {/* min-w-0 lets long names truncate instead of pushing the badge out */}
          <p className="truncate font-semibold text-ink">{t.symbol}</p>
          <p className="truncate text-sm text-stone">
            {t.kind === "cex" ? `${t.source} spot listing` : `${CHAIN_LABEL[t.chain]} · ${t.source}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      {t.kind === "dex" && (
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="min-w-0">
            <dt className="text-stone">Liquidity</dt>
            <dd className="truncate font-medium text-ink">{money(t.liquidity_usd)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-stone">Vol 24h</dt>
            <dd className="truncate font-medium text-ink">{money(t.volume_24h)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-stone">Launched</dt>
            <dd className="truncate font-medium text-ink">{timeAgo(t.pair_created_at)}</dd>
          </div>
        </dl>
      )}

      <ul className="mt-4 space-y-1 text-sm text-stone">
        {(t.safety_notes || []).slice(0, 3).map((note) => (
          <li key={note} className="break-words">• {note}</li> // the reasons behind the badge
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
        <span className="text-stone">Spotted {timeAgo(t.first_seen)}</span>
        <a
          href={t.pair_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-medium text-forest hover:underline"
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
    // w-full min-w-0: THE FIX. The page stays phone-width; wide children scroll inside instead of stretching it
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wider text-forest">Launch Radar</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        New coins, checked before you see them.
      </h1>
      <p className="mt-3 max-w-2xl text-stone">
        Fresh pools from GeckoTerminal, DexScreener and Birdeye, plus new Binance, Bybit and OKX listings.
        Every coin is scanned for traps like honeypots and hidden owners. Updated every 15 minutes.
      </p>

      <a
        href="https://t.me/Goatsradar"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-forest p-5 text-water"
      >
        <span className="min-w-0"> {/* min-w-0: text wraps so the Join button always fits */}
          <span className="block font-semibold">Get 🟢 alerts on Telegram</span>
          <span className="block text-sm opacity-80">Only coins that pass the checks, and new listings.</span>
        </span>
        <span className="shrink-0 rounded-full bg-water px-4 py-2 text-sm font-medium text-forest">Join</span>
      </a>

      {/* -mx-4 px-4: chips scroll edge-to-edge on phones, but start aligned with the text */}
      <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
              filter === f.id
                ? "bg-forest text-water ring-forest"
                : "bg-water text-ink ring-line hover:text-forest"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {tokens === null && !error && <p className="mt-10 text-stone">Scanning…</p>}

      {tokens !== null && shown.length === 0 && (
        <p className="mt-10 text-stone">Nothing here yet. The radar checks again every 15 minutes.</p>
      )}

      {/* grid-cols-1 on phones: one card per row, each exactly screen-width */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <TokenCard key={t.id} t={t} />
        ))}
      </div>

      <p className="mt-10 text-xs text-stone">
        Automated checks reduce risk; they don't remove it. New coins are extremely volatile. Nothing here is
        financial advice.
      </p>
    </main>
  );
}