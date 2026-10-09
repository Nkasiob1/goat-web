"use client";                                            // it updates live, so it runs in the browser

import { useEffect, useState } from "react";
import Link from "next/link";                            // to make each coin name clickable
import { COINS } from "../data/coins";                   // the shared coin list
import { formatPrice, volumeFormat } from "../lib/format"; // the shared formatters

export default function CryptoTable() {
  const [prices, setPrices] = useState({});              // memory for every coin's latest data

  useEffect(() => {                                      // open the live feed once
    const streams = COINS.map((c) => c.symbol.toLowerCase() + "@miniTicker").join("/");
    const socket = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`);

    socket.onmessage = (event) => {                      // each update from Binance
      const { data } = JSON.parse(event.data);
      const price = Number(data.c);                      // c = latest price
      const open = Number(data.o);                       // o = price 24 hours ago
      setPrices((prev) => ({
        ...prev,
        [data.s]: { price, change: ((price - open) / open) * 100, volume: Number(data.q) },
      }));
    };

    return () => socket.close();                         // hang up when leaving
  }, []);

  return (
    // overflow-x-auto: on tiny phones the table scrolls sideways
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
          {COINS.map((coin, index) => {
            const p = prices[coin.symbol];               // this coin's live data, if it has arrived
            const up = p && p.change >= 0;               // true if the price rose over 24 hours

            return (
              <tr key={coin.symbol} className="hover:bg-mist">
                <td className="px-6 py-4 text-sm text-stone">{index + 1}</td>
                <td className="px-6 py-4">
                  {/* clicking the name opens /markets/btc, /markets/eth, and so on */}
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
    </div>
  );
}