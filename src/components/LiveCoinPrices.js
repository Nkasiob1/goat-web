"use client"; // runs in the browser, because WebSockets only exist there

import { useEffect, useState } from "react"; // state plus side effects
import Link from "next/link"; // fast client-side links
import { formatPrice } from "@/lib/format"; // our tiny-price-aware formatter

// coins = an array of symbols like ["BTC", "SOL"]
export default function LiveCoinPrices({ coins = [] }) {
  const [quotes, setQuotes] = useState({}); // { BTC: { price, open } }
  const key = coins.slice(0, 5).join(","); // max 5; a string so the effect only re-runs when the list really changes

  useEffect(() => {
    const list = key ? key.split(",") : []; // rebuild the array from the key
    if (!list.length) return; // nothing trending yet, so do nothing
    let active = true; // stops updates after the component unmounts
    let socket; // holds the live connection so cleanup can close it

    async function start() {
      // one request per coin, so a coin Binance doesn't list can't break the others
      const results = await Promise.allSettled(
        list.map((c) =>
          fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${c}USDT&type=MINI`)
            .then((r) => (r.ok ? r.json() : null)) // a 400 means not listed, so null
        )
      );
      if (!active) return; // user left the page while we waited

      const first = {}; // first snapshot of prices
      results.forEach((r, i) => {
        const t = r.status === "fulfilled" ? r.value : null; // the ticker, or null
        if (t) first[list[i]] = { price: +t.lastPrice, open: +t.openPrice }; // + turns text into a number
      });
      setQuotes(first); // show the snapshot straight away

      const listed = Object.keys(first); // only stream coins Binance actually has
      if (!listed.length) return;
      const streams = listed.map((c) => `${c.toLowerCase()}usdt@miniTicker`).join("/"); // e.g. btcusdt@miniTicker/solusdt@miniTicker
      socket = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`); // one socket for all of them

      socket.onmessage = (e) => {
        const { data } = JSON.parse(e.data); // combined streams wrap each tick in { stream, data }
        const coin = data.s.replace(/USDT$/, ""); // "SOLUSDT" becomes "SOL"
        setQuotes((q) => ({ ...q, [coin]: { price: +data.c, open: +data.o } })); // c = close (live), o = 24h open
      };
    }

    start();
    return () => {
      active = false; // block late updates
      socket?.close(); // hang up the live stream
    };
  }, [key]);

  if (!key) return null; // hide the block when nothing is trending

  return (
    <ul className="divide-y divide-line">
      {key.split(",").map((coin) => {
        const q = quotes[coin]; // may be undefined while loading or if not listed
        const change = q ? ((q.price - q.open) / q.open) * 100 : null; // 24h % move
        return (
          <li key={coin}>
            <Link
              href={`/markets/${coin.toLowerCase()}`}
              className="flex items-center justify-between py-2.5 text-sm hover:text-forest"
            >
              <span className="font-medium text-ink">${coin}</span>
              <span className="flex items-center gap-3 font-mono tabular-nums">
                <span className="text-ink">{q ? formatPrice(q.price) : "—"}</span>
                {change !== null && (
                  <span className={change >= 0 ? "text-gain" : "text-loss"}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}