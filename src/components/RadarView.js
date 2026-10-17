"use client"; // runs in the browser: filters + auto-refresh

import { useEffect, useMemo, useState } from "react";
import { CHAIN_LABEL } from "@/lib/radar/sources"; // chain names
import { goLink } from "@/lib/partners"; // partner links
import { useLang } from "@/lib/i18n/useLang"; // current language
import { RADAR } from "@/lib/i18n/radar"; // this page's words
import { translateNote } from "@/lib/i18n/notes"; // NEW: phrasebook for safety notes

// r("key", { vars }) -> this page's text in the current language (English if missing)
function useR() {
  const lang = useLang();
  return {
    lang,
    r: (key, vars) => {
      const text = RADAR[lang]?.[key] ?? RADAR.en[key] ?? key;
      return vars ? text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? "").toString()) : text; // fill {n}, {source}...
    },
  };
}

// Filter chips across the top (labels come from the dictionary: "f.all", "f.green"...)
const FILTERS = ["all", "green", "yellow", "red", "listed"];

// Badge colours per verdict (text comes from the dictionary: "b.green"...)
const BADGE = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  listed: "bg-sky-50 text-sky-800 ring-sky-200",
};

// $1.2M style money
const money = (n) =>
  n === null || n === undefined
    ? "n/a"
    : "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// "5m ago" / "il y a 5 min" / "minti 5 da suka wuce": the number goes wherever each language wants it
function timeAgo(date, r) {
  if (!date) return "n/a";
  const mins = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 60) return r("agoM", { n: mins });
  const hours = Math.round(mins / 60);
  return hours < 48 ? r("agoH", { n: hours }) : r("agoD", { n: Math.round(hours / 24) });
}

// One coin card
function TokenCard({ t }) {
  const { r, lang } = useR();                                      // translations inside the card
  const verdict = BADGE[t.safety] ? t.safety : "yellow";           // unknown verdicts show as caution
  const isBybitListing = t.kind === "cex" && t.source === "Bybit"; // show the sign-up line on these
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
          <p className="notranslate truncate font-semibold text-ink" translate="no">{t.symbol}</p> {/* coin names never translated */}
          <p className="truncate text-sm text-stone">
            {t.kind === "cex" ? r("spot", { source: t.source }) : `${CHAIN_LABEL[t.chain]} · ${t.source}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${BADGE[verdict]}`}>
          {r(`b.${verdict}`)}
        </span>
      </div>

      {t.kind === "dex" && (
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="min-w-0">
            <dt className="truncate text-stone">{r("liquidity")}</dt>
            <dd className="truncate font-medium text-ink">{money(t.liquidity_usd)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="truncate text-stone">{r("vol")}</dt>
            <dd className="truncate font-medium text-ink">{money(t.volume_24h)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="truncate text-stone">{r("launched")}</dt>
            <dd className="truncate font-medium text-ink">{timeAgo(t.pair_created_at, r)}</dd>
          </div>
        </dl>
      )}

      <ul className="mt-4 space-y-1 text-sm text-stone">
        {(t.safety_notes || []).slice(0, 3).map((note) => (
          <li key={note} className="break-words">• {translateNote(note, lang)}</li> // NEW: translated by the phrasebook
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
        <span className="text-stone">{r("spotted", { ago: timeAgo(t.first_seen, r) })}</span>
        <a
          href={t.pair_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-medium text-forest hover:underline"
        >
          {t.kind === "cex" ? r("trade", { source: t.source }) : r("chart")} ↗
        </a>
      </div>

      {isBybitListing && (                                             // referral line on Bybit listings
        <a
          href={goLink("bybit", "radar-card")}
          target="_blank"
          rel="sponsored noopener"                                      // "sponsored" = honest label for search engines
          className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-sage px-3 py-2 text-xs text-ink hover:text-forest"
        >
          <span>{r("bybitNew")}</span>
          <span className="shrink-0 text-stone">{r("partnerLink")}</span>
        </a>
      )}
    </article>
  );
}

export default function RadarView() {
  const { r } = useR();                                            // translations
  const [tokens, setTokens] = useState(null); // null = still loading
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");                          // "" or "load" (translated when shown)

  // Load now, then every 60 seconds
  useEffect(() => {
    let alive = true; // stops updates after leaving the page
    async function load() {
      try {
        const res = await fetch("/api/radar/feed", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "load");
        if (alive) {
          setTokens(json.tokens);
          setError("");
        }
      } catch (err) {
        if (alive) setError(err.message || "load");
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
    // w-full min-w-0: the page stays phone-width; wide children scroll inside instead of stretching it
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wider text-forest">{r("eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{r("title")}</h1>
      <p className="mt-3 max-w-2xl text-stone">{r("intro")}</p>

      <a
        href="https://t.me/Goatsradar"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-forest p-5 text-water"
      >
        <span className="min-w-0"> {/* min-w-0: text wraps so the Join button always fits */}
          <span className="block font-semibold">{r("tgTitle")}</span>
          <span className="block text-sm opacity-80">{r("tgSub")}</span>
        </span>
        <span className="shrink-0 rounded-full bg-water px-4 py-2 text-sm font-medium text-forest">{r("join")}</span>
      </a>

      {/* partner banner (clearly labelled) */}
      <a
        href={goLink("bybit", "radar-banner")}
        target="_blank"
        rel="sponsored noopener"
        className="mt-3 flex items-center justify-between gap-4 rounded-3xl border border-line bg-water p-5"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{r("pitch")}</span>
          <span className="block text-sm text-stone">
            {r("partnerSub")} <span className="whitespace-nowrap">{r("partnerTag")}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-forest px-4 py-2 text-sm font-medium text-water">{r("signup")}</span>
      </a>

      {/* -mx-4 px-4: chips scroll edge-to-edge on phones, but start aligned with the text */}
      <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
              filter === id
                ? "bg-forest text-water ring-forest"
                : "bg-water text-ink ring-line hover:text-forest"
            }`}
          >
            {r(`f.${id}`)}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          {error === "load" ? r("loadError") : error}
        </p>
      )}

      {tokens === null && !error && <p className="mt-10 text-stone">{r("scanning")}</p>}

      {tokens !== null && shown.length === 0 && <p className="mt-10 text-stone">{r("empty")}</p>}

      {/* grid-cols-1 on phones: one card per row, each exactly screen-width */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <TokenCard key={t.id} t={t} />
        ))}
      </div>

      <p className="mt-10 text-xs text-stone">{r("disclaimer")}</p>
    </main>
  );
}