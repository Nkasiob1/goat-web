"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COINS } from "../data/coins";
import { formatPrice, volumeFormat } from "../lib/format";
import { useWatchlist } from "../lib/useWatchlist";
import StarButton from "./StarButton";

export default function CryptoTable() {
  const [list, setList] = useState(null);                // the coins to show; null = still loading
  const [prices, setPrices] = useState({});              // live prices, keyed by symbol
  const [query, setQuery] = useState("");                // what's typed in the search box
  const { symbols, toggle } = useWatchlist();

  useEffect(() => {                                      // step 1: get the top 100 from OUR server
    fetch("/api/crypto")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((coins) => {
        setList(coins);
        setPrices(Object.fromEntries(coins.map((c) => [c.symbol, c]))); // show the cached prices straight away
      })
      .catch(() => setList(COINS.map((c, i) => ({ ...c, rank: i + 1 })))); // if it fails, fall back to our 10
  }, []);

  useEffect(() => {                                      // step 2: once we have the list, open ONE live feed for all of them
    if (!list) return;
    const streams = list.map((c) => c.symbol.toLowerCase() + "@miniTicker").join("/");
    const socket = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`);

    socket.onmessage = (event) => {
      const { data } = JSON.parse(event.data);
      const price = Number(data.c);
      const open = Number(data.o);
      setPrices((prev) => ({
        ...prev,
        [data.s]: { price, change: ((price - open) / open) * 100, volume: Number(data.q) },
      }));
    };

    return () => socket.close();
  }, [list]);

  const q = query.trim().toLowerCase();
  const shown = (list ?? []).filter(                     // search by name or ticker
    (c) => !q || c.name.toLowerCase().includes(q) || c.short.toLowerCase().includes(q)
  );

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search coins, e.g. PEPE"
        className="mb-4 w-full rounded-full border border-line bg-mist px-5 py-3 text-sm text-ink outline-none focus:border-moss md:max-w-sm"
      />

      <div className="overflow-x-auto rounded-3xl border border-line bg-water">
        <table className="w-full text-left">
          <thead className="border-b border-line text-xs text-stone">
            <tr>
              <th className="px-6 py-4 font-medium">#</th>
              <th className="px-6 py-4 font-medium">Coin</th>
              <th className="px-6 py-4 text-right font-medium">Price</th>
              <th className="px-6 py-4 text-right font-medium">24h</th>
              <th className="hidden px-6 py-4 text-right font-medium md:table-cell">24h Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((coin) => {
              const p = prices[coin.symbol];
              const up = p && p.change >= 0;

              return (
                <tr key={coin.symbol} className="hover:bg-mist">
                  <td className="px-6 py-4 text-sm text-stone">
                    <div className="flex items-center gap-3">
                      <StarButton active={symbols.includes(coin.symbol)} onClick={() => toggle(coin.symbol)} />
                      <span>{coin.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/markets/${coin.short.toLowerCase()}`} className="hover:text-moss">
                      <span className="font-semibold text-ink">{coin.name}</span>
                      <span className="ml-2 font-mono text-xs text-stone">{coin.short}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-ink">
                    {p ? formatPrice(p.price) : "—"}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono text-sm ${up ? "text-gain" : "text-loss"}`}>
                    {p ? (up ? "+" : "") + p.change.toFixed(2) + "%" : ""}
                  </td>
                  <td className="hidden px-6 py-4 text-right font-mono text-sm text-stone md:table-cell">
                    {p ? volumeFormat.format(p.volume) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {list === null && <p className="px-6 py-10 text-center text-sm text-stone">Loading coins…</p>}
        {list && shown.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-stone">No coin matches “{query}” in the top 100.</p>
        )}
      </div>
      <p className="mt-4 text-xs text-stone">Top 100 coins on Binance by 24h volume. Prices update live.</p>
    </div>
  );
}