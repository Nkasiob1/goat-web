"use client";                                            // the filter pills respond to taps

import { useState } from "react";
import TimeAgo from "./TimeAgo";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "forex", label: "Forex" },
  { id: "stocks", label: "Stocks" },
];

export default function NewsFeed({ items }) {            // items arrive ready-made from the server
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f.id ? "bg-forest text-water" : "bg-mist text-stone hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 divide-y divide-line rounded-3xl border border-line bg-water">
        {shown.map((item) => (
          <li key={item.id}>
            <a
              href={item.link}
              target="_blank"                            // the article opens in a new tab; GOAT stays open
              rel="noopener noreferrer"
              className="block px-6 py-5 hover:bg-mist"
            >
              <p className="font-medium leading-snug text-ink">{item.title}</p>
              <p className="mt-2 text-xs text-stone">
                {item.source} · <TimeAgo date={item.date} />
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}