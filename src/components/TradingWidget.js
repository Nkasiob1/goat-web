"use client";

import { useEffect, useRef } from "react";

export default function TradingWidget({ widget, config, height = 560 }) {
  const container = useRef(null);

  useEffect(() => {
    const box = container.current;
    box.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height,
      colorTheme: "light",
      isTransparent: true,
      locale: "en",
      largeChartUrl: `${window.location.origin}/charts`, // NEW: clicks open GOAT's chart page, not tradingview.com
      ...config,
    });
    box.appendChild(script);

    return () => { box.innerHTML = ""; };
  }, [widget, config, height]);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-water">
      <div ref={container} className="tradingview-widget-container" style={{ height }}></div>
      <p className="border-t border-line px-4 py-2 text-xs text-stone">
        Data by{" "}
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="text-moss hover:text-forest">
          TradingView
        </a>
      </p>
    </div>
  );
}