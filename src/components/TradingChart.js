"use client";

import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";                  // React 19: open a connection to a server early

export default function TradingChart({ symbol, allowChange = false }) {
  preconnect("https://s3.tradingview.com");              // where the chart's script lives
  preconnect("https://www.tradingview-widget.com");      // where the chart itself loads from

  const container = useRef(null);
  const [loaded, setLoaded] = useState(false);           // memory: has the chart finished loading?

  useEffect(() => {
    const box = container.current;
    setLoaded(false);                                    // new symbol → show the skeleton again

    const watcher = new MutationObserver(() => {         // watches the box for TradingView adding its chart
      const frame = box.querySelector("iframe");         // the chart arrives as an iframe (a page inside our page)
      if (frame) {
        frame.addEventListener("load", () => setLoaded(true)); // when it finishes loading, hide the skeleton
        watcher.disconnect();                            // found it, stop watching
      }
    });
    watcher.observe(box, { childList: true, subtree: true });

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Africa/Lagos",
      theme: "light",
      style: "1",
      locale: "en",
      hide_side_toolbar: !allowChange,
      allow_symbol_change: allowChange,
      support_host: "https://www.tradingview.com",
    });
    box.appendChild(script);

    return () => {
      watcher.disconnect();                              // stop watching if we leave early
      box.innerHTML = "";
    };
  }, [symbol, allowChange]);

  return (
    <div className="overflow-hidden rounded-3xl border border-line">
      <div className="relative h-[460px] md:h-[600px]">  {/* relative: lets the skeleton sit on top of the chart */}
        <div ref={container} className="h-full"></div>
        {!loaded && (                                     // the skeleton, shown until the chart is ready
          <div className="absolute inset-0 flex flex-col justify-end gap-3 bg-water p-6">
            <div className="h-full w-full animate-pulse rounded-2xl bg-mist"></div>
            <p className="text-center text-xs text-stone">Loading chart…</p>
          </div>
        )}
      </div>
      <p className="border-t border-line px-4 py-2 text-xs text-stone">
        Chart by{" "}
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="text-moss hover:text-forest">
          TradingView
        </a>
      </p>
    </div>
  );
}