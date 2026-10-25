// src/components/LiveTicker.js
// A thin strip of REAL recent GOAT verdicts that scrolls forever. Every item opens that coin's full Vet report.
"use client"; // runs in the browser: it fetches data after the page loads and animates

import { useEffect, useState } from "react";
import Link from "next/link";
import S from "./S";                                     // translated words

const DOT = { green: "🟢", yellow: "🟡", red: "🔴", listed: "🏦" }; // verdict -> icon (pending/unknown are skipped)

export default function LiveTicker() {
  const [items, setItems] = useState([]);                // the coins to show (empty until loaded)

  useEffect(() => {
    let alive = true;                                    // stops a late answer updating a page you've left
    fetch("/api/radar/feed")                             // the same data the /radar page uses: one source of truth
      .then((r) => (r.ok ? r.json() : { tokens: [] }))   // a failed request -> treat as "no coins"
      .then((d) => {
        if (!alive) return;
        const list = (d.tokens || [])
          .filter((t) => t.symbol && DOT[t.safety])      // only coins with a name and a final verdict
          .slice(0, 20);                                 // the 20 newest are plenty for one loop
        setItems(list);
      })
      .catch(() => {});                                  // offline? the ticker simply doesn't appear
    return () => { alive = false; };                     // runs when the component disappears
  }, []);                                                // [] = run once, when the page first loads

  if (items.length < 3) return null;                     // too few to scroll nicely: show nothing rather than a gap

  const row = [...items, ...items];                      // the list TWICE: the trick behind the seamless loop

  return (
    <div className="border-b border-line bg-mist/70">    {/* full-width strip under the navbar */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-2 text-xs">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold uppercase tracking-wide text-moss"> {/* "LIVE" label */}
          <span className="live-dot" aria-hidden="true"></span> {/* the pulsing green dot */}
          <S k="tk.live" />
        </span>

        <div className="ticker-window min-w-0 flex-1 overflow-hidden"> {/* the "window" the list slides behind */}
          <div className="ticker-track flex w-max">      {/* w-max = as wide as all items in one line */}
            {row.map((t, i) => {
              const copy = i >= items.length;            // true for the second (duplicate) half
              return (
                <Link
                  key={`${t.id}-${i}`}                   // unique even for the duplicate
                  href={t.address ? `/vet?q=${encodeURIComponent(t.address)}` : "/radar"} // coin -> its full report
                  className="flex shrink-0 items-center gap-1.5 pr-8 text-stone hover:text-ink" // pr-8 (not gap) keeps the loop exact
                  aria-hidden={copy ? "true" : undefined} // screen readers hear the list once, not twice
                  tabIndex={copy ? -1 : undefined}       // keyboard users skip the duplicate too
                >
                  <span>{DOT[t.safety]}</span>
                  <span className="font-semibold text-ink">{"$" + String(t.symbol).slice(0, 12)}</span> {/* $SYMBOL, kept short */}
                  <span>· <S k={`tk.${t.safety}`} /></span> {/* verdict in the visitor's language */}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}