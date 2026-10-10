"use client"; // the Rules toggle needs state

import { useState } from "react";
import { formatPrice } from "../lib/format";
import { changeOf } from "../lib/useLivePrices";

// phone-only strip at the top of the feed: swipeable trending coins + a Rules toggle
export default function TrendingStrip({ trending, quotes, rules, activeCoin, onPick }) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="border-b border-line lg:hidden">     {/* lg:hidden = laptops use the sidebar instead */}
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone">Trending today</p>
        <button
          onClick={() => setShowRules(!showRules)}
          aria-expanded={showRules}
          className="text-xs font-medium text-moss hover:text-forest"
        >
          {showRules ? "Hide rules" : "Rules"}
        </button>
      </div>

      {showRules && (
        <ul className="mx-4 mt-2 space-y-1.5 rounded-2xl bg-mist p-3 text-xs text-stone">
          {rules.map((r) => <li key={r}>✓ {r}</li>)}
        </ul>
      )}

      {trending.length === 0 ? (
        <p className="px-4 pb-3 pt-1 text-xs text-stone">Tag a coin like $BTC in your post to start a trend.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-2 [scrollbar-width:none]"> {/* swipe sideways, no scrollbar */}
          {trending.map((t) => {
            const q = quotes[t.coin];                    // only the top 5 have live prices
            const change = changeOf(q);
            const active = activeCoin === t.coin;        // highlight the coin being filtered
            return (
              <button
                key={t.coin}
                onClick={() => onPick(t.coin)}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-left transition ${active ? "border-moss bg-sage" : "border-line bg-water hover:bg-mist"}`}
              >
                <span className="block font-mono text-sm font-semibold text-ink">${t.coin}</span>
                <span className="mt-0.5 flex items-center gap-2 font-mono text-xs tabular-nums">
                  {q ? (
                    <>
                      <span className="text-ink">{formatPrice(q.price)}</span>
                      <span className={change >= 0 ? "text-gain" : "text-loss"}>
                        {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-stone">{t.total} {t.total === 1 ? "post" : "posts"}</span> // no price, so show buzz instead
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}