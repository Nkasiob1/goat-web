"use client";                                          // run this component in the browser, not just on the server

import { useEffect, useState } from "react";           // React's memory (useState) and "do this on load" (useEffect) tools

const COINS = [                                        // the coins we show; Binance names them as pairs against USDT (a dollar coin)
  { symbol: "BTCUSDT", short: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", short: "ETH", name: "Ethereum" },
  { symbol: "SOLUSDT", short: "SOL", name: "Solana" },
  { symbol: "BNBUSDT", short: "BNB", name: "BNB" },
];

export default function LivePrices() {
  const [prices, setPrices] = useState({});            // memory: starts empty, fills as prices arrive

  useEffect(() => {                                    // runs once when the card first appears
    const streams = COINS.map((c) => c.symbol.toLowerCase() + "@miniTicker").join("/"); // builds "btcusdt@miniTicker/ethusdt@miniTicker/..."
    const socket = new WebSocket(                      // open the "phone call" to Binance's public price feed
      `wss://data-stream.binance.vision/stream?streams=${streams}`
    );

    socket.onmessage = (event) => {                    // runs every time Binance sends an update (about once a second)
      const { data } = JSON.parse(event.data);         // turn the text message into an object and take its "data" part
      const price = Number(data.c);                    // c = current (last) price; Number() turns text into a number
      const open = Number(data.o);                     // o = price 24 hours ago
      setPrices((prev) => ({                           // update memory: keep the other coins, replace this one
        ...prev,                                       // copy everything already stored
        [data.s]: { price, change: ((price - open) / open) * 100 }, // s = symbol; change = % move over 24 hours
      }));
    };

    return () => socket.close();                       // "hang up" when the visitor leaves the page
  }, []);                                              // empty list = run once only, not on every redraw

  return (
    <div className="rounded-3xl border border-line bg-water p-6 shadow-sm">     {/* same card style as before */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone">Live crypto prices</p>
        <span className="flex items-center gap-2 text-xs text-stone">          {/* the small "live" indicator */}
          <span className="h-2 w-2 animate-pulse rounded-full bg-gain"></span>   {/* a gently pulsing green dot */}
          Live
        </span>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {COINS.map((coin) => {                         // one row per coin
          const p = prices[coin.symbol];               // this coin's latest data, or undefined if none has arrived yet
          const up = p && p.change >= 0;               // true if the price is up over 24 hours

          return (
            <li key={coin.symbol} className="flex items-center justify-between py-4">
              <div>
                <p className="font-mono font-semibold text-ink">{coin.short}</p>
                <p className="text-xs text-stone">{coin.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-ink">
                  {p
                    ? "$" + p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) // e.g. $63,412.50
                    : "—"}                                {/* a dash while waiting for the first price */}
                </p>
                <p className={`text-xs font-medium ${up ? "text-gain" : "text-loss"}`}> {/* muted green if up, brick red if down */}
                  {p ? (up ? "+" : "") + p.change.toFixed(2) + "%" : ""}               {/* e.g. +1.24% */}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-stone">Prices from Binance. Updated every second.</p> {/* honest source credit */}
    </div>
  );
}