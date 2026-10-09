"use client";

import { useState } from "react";
import CryptoTable from "./CryptoTable";
import TradingWidget from "./TradingWidget";

const TABS = [
  { id: "crypto", label: "Crypto" },
  { id: "forex", label: "Forex" },
  { id: "stocks", label: "Stocks" },
  { id: "indices", label: "Indices" },
  { id: "nfts", label: "NFTs" },
];

const FOREX = { market: "forex", defaultScreen: "general", defaultColumn: "overview", showToolbar: true }; // every forex pair, including gold
const STOCKS = { market: "america", defaultScreen: "most_capitalized", defaultColumn: "overview", showToolbar: true }; // every US stock, biggest first
const INDICES = {                                        // the world's major indices, grouped by region
  showSymbolLogo: true,
  symbolsGroups: [
    {
      name: "United States",
      symbols: [
        { name: "FOREXCOM:SPXUSD", displayName: "S&P 500" },
        { name: "FOREXCOM:NSXUSD", displayName: "Nasdaq 100" },
        { name: "FOREXCOM:DJI", displayName: "Dow Jones 30" },
      ],
    },
    {
      name: "Europe & Asia",
      symbols: [
        { name: "INDEX:DEU40", displayName: "DAX 40 (Germany)" },
        { name: "FOREXCOM:UKXGBP", displayName: "FTSE 100 (UK)" },
        { name: "INDEX:NKY", displayName: "Nikkei 225 (Japan)" },
      ],
    },
  ],
};

export default function MarketTabs() {
  const [active, setActive] = useState("crypto");

  return (
    <div>
      {/* the five tabs scroll sideways on small phones */}
      <div className="-mx-6 overflow-x-auto px-6">
        <div className="inline-flex rounded-full bg-mist p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${
                active === tab.id ? "bg-water text-ink shadow-sm" : "text-stone hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {active === "crypto" && <CryptoTable />}
        {active === "forex" && <TradingWidget widget="screener" config={FOREX} />}
        {active === "stocks" && <TradingWidget widget="screener" config={STOCKS} />}
        {active === "indices" && <TradingWidget widget="market-quotes" config={INDICES} height={460} />}
        {active === "nfts" && <ComingSoon label="NFT" />}
      </div>
    </div>
  );
}

function ComingSoon({ label }) {
  return (
    <div className="rounded-3xl border border-dashed border-line p-16 text-center">
      <p className="font-semibold text-ink">{label} prices are on the way.</p>
      <p className="mt-2 text-sm text-stone">We're connecting a live data source for this market.</p>
    </div>
  );
}