"use client";                                            // tabs respond to clicks, so they run in the browser

import { useState } from "react";
import CryptoTable from "./CryptoTable";

const TABS = [                                           // the tab buttons, in order
  { id: "crypto", label: "Crypto" },
  { id: "forex", label: "Forex" },
  { id: "nfts", label: "NFTs" },
];

export default function MarketTabs() {
  const [active, setActive] = useState("crypto");        // memory: which tab is open; starts on crypto

  return (
    <div>
      <div className="inline-flex rounded-full bg-mist p-1">                   {/* the pill that holds the tab buttons */}
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}            // on click, remember this tab as active
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              active === tab.id
                ? "bg-water text-ink shadow-sm"          // active tab: white, raised, dark text
                : "text-stone hover:text-ink"            // other tabs: quiet grey
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {active === "crypto" && <CryptoTable />}                  {/* show only the active tab's content */}
        {active === "forex" && <ComingSoon label="Forex" />}      {/* label is a prop: information passed in */}
        {active === "nfts" && <ComingSoon label="NFT" />}
      </div>
    </div>
  );
}

function ComingSoon({ label }) {                         // a small component that receives "label" as a prop
  return (
    <div className="rounded-3xl border border-dashed border-line p-16 text-center"> {/* dashed border = "not built yet" */}
      <p className="font-semibold text-ink">{label} prices are on the way.</p>
      <p className="mt-2 text-sm text-stone">We're connecting a live data source for this market.</p>
    </div>
  );
}