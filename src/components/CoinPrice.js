"use client";                                            // live updates, so it runs in the browser

import { useEffect, useState } from "react";
import { formatPrice, volumeFormat } from "../lib/format";

export default function CoinPrice({ symbol }) {          // symbol is a prop, e.g. "BTCUSDT"
  const [d, setD] = useState(null);                      // memory: this coin's latest data, empty at first

  useEffect(() => {
    const socket = new WebSocket(                        // a single stream for just this one coin
      `wss://data-stream.binance.vision/ws/${symbol.toLowerCase()}@miniTicker`
    );
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);               // single streams send the data directly, with no wrapper
      const price = Number(data.c);
      const open = Number(data.o);
      setD({
        price,
        change: ((price - open) / open) * 100,
        high: Number(data.h),                            // h = highest price in 24 hours
        low: Number(data.l),                             // l = lowest price in 24 hours
        volume: Number(data.q),
      });
    };
    return () => socket.close();
  }, [symbol]);                                          // reconnect only if the coin changes

  if (!d) {                                              // before the first price arrives
    return <p className="mt-6 font-mono text-4xl text-stone">Loading…</p>;
  }

  const up = d.change >= 0;
  const stats = [                                        // the four small stat boxes
    { label: "24h High", value: formatPrice(d.high) },
    { label: "24h Low", value: formatPrice(d.low) },
    { label: "24h Volume", value: volumeFormat.format(d.volume) },
    { label: "24h Change", value: (up ? "+" : "") + d.change.toFixed(2) + "%" },
  ];

  return (
    <div className="mt-6">
      <div className="flex items-baseline gap-4">        {/* big price and % change sit on one line */}
        <p className="font-mono text-4xl font-semibold text-ink md:text-5xl">{formatPrice(d.price)}</p>
        <p className={`font-mono text-lg ${up ? "text-gain" : "text-loss"}`}>
          {(up ? "+" : "") + d.change.toFixed(2)}%
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">   {/* 2 boxes per row on phones, 4 on laptops */}
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-mist p-4">
            <p className="text-xs text-stone">{s.label}</p>
            <p className="mt-1 font-mono font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}