"use client";                                            // it updates live, so it runs in the browser

import { useEffect, useState } from "react";

const COINS = [                                          // top coins, as Binance names their USDT pairs
  { symbol: "BTCUSDT", short: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", short: "ETH", name: "Ethereum" },
  { symbol: "BNBUSDT", short: "BNB", name: "BNB" },
  { symbol: "SOLUSDT", short: "SOL", name: "Solana" },
  { symbol: "XRPUSDT", short: "XRP", name: "XRP" },
  { symbol: "DOGEUSDT", short: "DOGE", name: "Dogecoin" },
  { symbol: "ADAUSDT", short: "ADA", name: "Cardano" },
  { symbol: "TRXUSDT", short: "TRX", name: "TRON" },
  { symbol: "AVAXUSDT", short: "AVAX", name: "Avalanche" },
  { symbol: "LINKUSDT", short: "LINK", name: "Chainlink" },
];

const volumeFormat = new Intl.NumberFormat("en-US", {    // a reusable formatter for big numbers
  style: "currency",                                     // add the $ sign
  currency: "USD",
  notation: "compact",                                   // 1,240,000,000 becomes $1.24B
  maximumFractionDigits: 2,
});

function formatPrice(price) {                            // small helper: cheap coins need more decimals
  return "$" + price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 4 : 2,            // DOGE at $0.1234 keeps 4 decimals; BTC keeps 2
  });
}

export default function CryptoTable() {
  const [prices, setPrices] = useState({});              // memory for every coin's latest data

  useEffect(() => {                                      // open the live feed once, when the table appears
    const streams = COINS.map((c) => c.symbol.toLowerCase() + "@miniTicker").join("/");
    const socket = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`);

    socket.onmessage = (event) => {                      // each update from Binance
      const { data } = JSON.parse(event.data);
      const price = Number(data.c);                      // c = latest price
      const open = Number(data.o);                       // o = price 24 hours ago
      setPrices((prev) => ({
        ...prev,                                         // keep the other coins
        [data.s]: {
          price,
          change: ((price - open) / open) * 100,         // % move over 24 hours
          volume: Number(data.q),                        // q = 24h trading volume in dollars
        },
      }));
    };

    return () => socket.close();                         // hang up when the visitor leaves or switches tab
  }, []);

  return (
    // overflow-x-auto: on tiny phones the table scrolls sideways instead of breaking
    <div className="overflow-x-auto rounded-3xl border border-line bg-water">
      <table className="w-full text-left">
        {/* column headings */}
        <thead className="border-b border-line text-xs text-stone">
          <tr>
            <th className="px-6 py-4 font-medium">#</th>
            <th className="px-6 py-4 font-medium">Coin</th>
            <th className="px-6 py-4 text-right font-medium">Price</th>
            <th className="px-6 py-4 text-right font-medium">24h</th>
            {/* volume column: hidden on phones to save space */}
            <th className="hidden px-6 py-4 text-right font-medium md:table-cell">24h Volume</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {COINS.map((coin, index) => {                  // index = the row's position: 0, 1, 2...
            const p = prices[coin.symbol];               // this coin's live data, if it has arrived
            const up = p && p.change >= 0;               // true if the price rose over 24 hours

            return (
              // each row tints softly on hover
              <tr key={coin.symbol} className="hover:bg-mist">
                {/* +1 so numbering starts at 1, not 0 */}
                <td className="px-6 py-4 text-sm text-stone">{index + 1}</td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-ink">{coin.name}</span>
                  <span className="ml-2 font-mono text-xs text-stone">{coin.short}</span>
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