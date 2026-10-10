"use client"; // WebSockets only exist in the browser

import { useEffect, useState } from "react";

// coins = ["BTC", "SOL", ...]; streams live prices for the first `max` of them
export function useLivePrices(coins = [], max = 5) {
  const [quotes, setQuotes] = useState({});              // { BTC: { price, open } }
  const key = coins.slice(0, max).join(",");             // a string, so the effect only re-runs on real changes

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!list.length) return;
    let active = true;                                   // stop updates after leaving the page
    let socket;

    async function start() {
      // one request per coin, so a coin Binance doesn't list can't break the rest
      const results = await Promise.allSettled(
        list.map((c) =>
          fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${c}USDT&type=MINI`)
            .then((r) => (r.ok ? r.json() : null))
        )
      );
      if (!active) return;

      const first = {};
      results.forEach((r, i) => {
        const t = r.status === "fulfilled" ? r.value : null;
        if (t) first[list[i]] = { price: +t.lastPrice, open: +t.openPrice }; // + turns text into a number
      });
      setQuotes(first);                                  // show the snapshot straight away

      const listed = Object.keys(first);                 // only stream coins Binance has
      if (!listed.length) return;
      const streams = listed.map((c) => `${c.toLowerCase()}usdt@miniTicker`).join("/");
      socket = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`); // one socket for all
      socket.onmessage = (e) => {
        const { data } = JSON.parse(e.data);             // { stream, data }
        const coin = data.s.replace(/USDT$/, "");        // "SOLUSDT" becomes "SOL"
        setQuotes((q) => ({ ...q, [coin]: { price: +data.c, open: +data.o } }));
      };
    }

    start();
    return () => { active = false; socket?.close(); };
  }, [key]);

  return quotes;
}

// 24h % change for one quote, or null if we don't have it
export function changeOf(q) {
  return q ? ((q.price - q.open) / q.open) * 100 : null;
}