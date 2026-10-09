"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COINS } from "../data/coins";
import { formatPrice } from "../lib/format";
import { useWatchlist } from "../lib/useWatchlist";
import StarButton from "./StarButton";

export default function WatchlistPanel() {
  const { symbols, toggle } = useWatchlist();
  const [prices, setPrices] = useState({});
  const saved = symbols.map((s) => {                     // build details for ANY saved coin, not just our 10
    const known = COINS.find((c) => c.symbol === s);
    const short = s.replace(/USDT$/, "");                // "PEPEUSDT" → "PEPE"
    return { symbol: s, short, name: known?.name ?? short };
  });
  const key = symbols.join(",");                         // changes only when the list changes, which reopens the price feed

  useEffect(() => {
    if (!key) return;                                    // nothing saved: no feed needed
    const streams = key.split(",").map((s) => s.toLowerCase() + "@miniTicker").join("/");
    const socket = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`);
    socket.onmessage = (event) => {
      const { data } = JSON.parse(event.data);
      const price = Number(data.c);
      const open = Number(data.o);
      setPrices((prev) => ({ ...prev, [data.s]: { price, change: ((price - open) / open) * 100 } }));
    };
    return () => socket.close();
  }, [key]);

  return (
    <div className="rounded-3xl border border-line bg-water p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">Your watchlist</p>
        <Link href="/markets" className="text-sm text-moss hover:text-forest">Add coins →</Link>
      </div>

      {saved.length === 0 ? (
        <p className="mt-4 text-sm text-stone">Tap the ☆ next to any coin in Markets to follow it here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {saved.map((coin) => {
            const p = prices[coin.symbol];
            const up = p && p.change >= 0;
            return (
              <li key={coin.symbol} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <StarButton active onClick={() => toggle(coin.symbol)} /> {/* tap to remove */}
                  <Link href={`/markets/${coin.short.toLowerCase()}`} className="font-semibold text-ink hover:text-moss">
                    {coin.name} <span className="ml-1 font-mono text-xs text-stone">{coin.short}</span>
                  </Link>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-ink">{p ? formatPrice(p.price) : "—"}</p>
                  <p className={`font-mono text-xs ${up ? "text-gain" : "text-loss"}`}>
                    {p ? (up ? "+" : "") + p.change.toFixed(2) + "%" : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}