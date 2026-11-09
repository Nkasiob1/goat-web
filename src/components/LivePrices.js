"use client";                                          // run this component in the browser, not just on the server

import { useEffect, useState } from "react";           // React's memory (useState) and "do this on load" (useEffect) tools

const COINS = [                                        // the coins we show; Binance names them as pairs against USDT (a dollar coin)
  { symbol: "BTCUSDT", short: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", short: "ETH", name: "Ethereum" },
  { symbol: "SOLUSDT", short: "SOL", name: "Solana" },
  { symbol: "BNBUSDT", short: "BNB", name: "BNB" },
];

const SYMBOLS = COINS.map((c) => c.symbol);            // ["BTCUSDT", "ETHUSDT", ...]
const CACHE_KEY = "goat-live-prices";                  // NEW: last prices this phone saw, shown instantly next time
const SNAPSHOT_URL =                                   // NEW: one small request for all 4 prices (Binance public market data)
  "https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI&symbols=" +
  encodeURIComponent(JSON.stringify(SYMBOLS));
const STREAM_URL =                                     // the live stream: one message per coin, about once a second
  "wss://data-stream.binance.vision/stream?streams=" +
  SYMBOLS.map((s) => s.toLowerCase() + "@miniTicker").join("/");
const POLL_MS = 15000;                                 // NEW: while the stream is down, refresh the snapshot every 15s
const SAVE_MS = 10000;                                 // NEW: save prices to the phone at most every 10s (not every tick)

// One coin's numbers from a price now and a price 24h ago
const entry = (price, open) => ({ price, change: open ? ((price - open) / open) * 100 : 0 });

export default function LivePrices() {
  const [prices, setPrices] = useState({});            // memory: { BTCUSDT: { price, change }, ... }
  const [live, setLive] = useState(false);             // NEW: true while the live stream is connected

  useEffect(() => {
    let latest = {};                                   // the newest prices (kept here so we can save them)
    let socket = null;                                 // the live stream connection
    let retry = 0;                                     // how many reconnects in a row (each waits longer)
    let reconnectTimer = null;                         // the pending reconnect
    let pollTimer = null;                              // the backup snapshot refresh
    let lastSave = 0;                                  // when we last saved to the phone
    let stopped = false;                               // true when the page closes or goes to the background

    const show = () => setPrices({ ...latest });       // redraw the card with the newest prices

    const save = (force) => {                          // NEW: remember prices on this phone for next time
      if (!force && Date.now() - lastSave < SAVE_MS) return;
      lastSave = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(latest));
      } catch {}                                       // storage blocked: just skip
    };

    // 1) INSTANT: last saved prices, so the card is never blank
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached) {
        latest = cached;
        show();
      }
    } catch {}

    // 2) FAST: one small request for all 4 prices
    async function snapshot() {
      try {
        const res = await fetch(SNAPSHOT_URL, { signal: AbortSignal.timeout(8000) }); // give up after 8s
        if (!res.ok) return;
        const rows = await res.json();                 // [{ symbol, lastPrice, openPrice, ... }, ...]
        for (const r of rows) latest[r.symbol] = entry(Number(r.lastPrice), Number(r.openPrice));
        show();
        save(true);
      } catch {}                                       // slow or offline: the cached prices stay on screen
    }

    function startPolling() {                          // NEW: backup refresh while the stream is down
      if (!pollTimer) pollTimer = setInterval(snapshot, POLL_MS);
    }
    function stopPolling() {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    // 3) LIVE: the stream, with automatic reconnect
    function connect() {
      if (stopped) return;
      socket = new WebSocket(STREAM_URL);              // open the "phone call" to Binance's price feed

      socket.onopen = () => {
        retry = 0;                                     // connected: reset the waiting time
        setLive(true);
        stopPolling();                                 // the stream is better than polling
      };

      socket.onmessage = (event) => {                  // about once a second per coin
        const { data } = JSON.parse(event.data);       // data.s = symbol, data.c = price now, data.o = price 24h ago
        latest[data.s] = entry(Number(data.c), Number(data.o));
        show();
        save(false);                                   // saved at most every 10s
      };

      socket.onerror = () => socket.close();           // any error -> treat as a drop (onclose handles it)

      socket.onclose = () => {
        setLive(false);
        if (stopped) return;                           // closed on purpose: don't reconnect
        startPolling();                                // keep prices fresh while we wait
        const wait = Math.min(30000, 1000 * 2 ** retry); // 1s, 2s, 4s, 8s... never more than 30s
        retry += 1;
        reconnectTimer = setTimeout(connect, wait);    // try the stream again
      };
    }

    function start() {                                 // page visible: get prices and go live
      stopped = false;
      snapshot();
      connect();
    }

    function stop() {                                  // page closed or in the background: save data and battery
      stopped = true;
      clearTimeout(reconnectTimer);
      stopPolling();
      if (socket) socket.close();
      save(true);
    }

    // NEW: pause when the app/tab is hidden, resume when it's back
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    start();                                           // begin now

    return () => {                                     // the visitor left the page
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);                                              // empty list = set this up once only

  return (
    <div className="rounded-3xl border border-line bg-water p-6 shadow-sm">     {/* same card style as before */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone">Live crypto prices</p>
        <span className="flex items-center gap-2 text-xs text-stone">          {/* live / updating indicator */}
          <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-gain" : "bg-stone"}`}></span>
          {live ? "Live" : "Updating…"}                {/* NEW: honest status when the stream is reconnecting */}
        </span>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {COINS.map((coin) => {                         // one row per coin
          const p = prices[coin.symbol];               // this coin's latest data, or undefined if none yet
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
                    : "—"}                                {/* only on the very first visit, until the snapshot arrives */}
                </p>
                <p className={`text-xs font-medium ${up ? "text-gain" : "text-loss"}`}>
                  {p ? (up ? "+" : "") + p.change.toFixed(2) + "%" : ""}               {/* e.g. +1.24% */}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-stone">Prices from Binance. Live when connected, refreshed every 15s otherwise.</p>
    </div>
  );
}