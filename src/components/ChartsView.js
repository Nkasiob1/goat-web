"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";       // to read ?tvwidgetsymbol= from the address
import TradingChart from "./TradingChart";

const PICKS = [
  { label: "BTC", symbol: "BINANCE:BTCUSDT" },
  { label: "ETH", symbol: "BINANCE:ETHUSDT" },
  { label: "EUR/USD", symbol: "FX:EURUSD" },
  { label: "GBP/USD", symbol: "FX:GBPUSD" },
  { label: "USD/NGN", symbol: "FX_IDC:USDNGN" },
  { label: "Gold", symbol: "OANDA:XAUUSD" },
  { label: "US30", symbol: "FOREXCOM:DJI" },
  { label: "NAS100", symbol: "FOREXCOM:NSXUSD" },
  { label: "S&P 500", symbol: "FOREXCOM:SPXUSD" },
  { label: "Apple", symbol: "NASDAQ:AAPL" },
  { label: "Nvidia", symbol: "NASDAQ:NVDA" },
];

export default function ChartsView() {
  const params = useSearchParams();
  const fromWidget = params.get("tvwidgetsymbol");       // the market clicked on the Markets page, if any
  const [symbol, setSymbol] = useState(fromWidget ?? PICKS[0].symbol); // start there, or on BTC

  return (
    <div>
      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex gap-2">
          {PICKS.map((p) => (
            <button
              key={p.symbol}
              onClick={() => setSymbol(p.symbol)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                symbol === p.symbol ? "bg-forest text-water" : "bg-mist text-stone hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <TradingChart symbol={symbol} allowChange />
      </div>
    </div>
  );
}