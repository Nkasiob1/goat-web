// app/api/radar/card/route.js: draws a 1200×630 alert card that Telegram downloads
import { ImageResponse } from "next/og";   // turns JSX into a PNG
import { connection } from "next/server";  // always draw fresh from the URL values
import { SITE_URL } from "@/lib/site";     // our one public address

const HOST = new URL(SITE_URL).host;       // "goatwatch.app" (no https://), for the card footer

// $1.2M style money
const money = (n) =>
  n ? "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n)) : "n/a";

// One stat pill (label on top, value below)
function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "18px 28px", borderRadius: 24, background: "rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", fontSize: 24, color: "#a7d7bf" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#ffffff" }}>{value}</div>
    </div>
  );
}

export async function GET(request) {
  await connection();
  const p = new URL(request.url).searchParams;            // values come from the URL
  const symbol = (p.get("s") || "NEW").slice(0, 12);      // ticker, kept short so it fits
  const isListing = p.get("k") === "cex";                 // exchange listing or DEX coin
  const where = p.get("c") || "";                         // chain name or exchange name
  const cap = p.get("m");                                 // NEW: market cap (or FDV) in USD
  const capLabel = p.get("mk") === "fdv" ? "FDV" : "Market cap"; // NEW: honest label

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0d2a1f 0%, #1d4a35 100%)", // GOAT greens
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand line */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: "#a7d7bf", letterSpacing: 2 }}>
          GOAT · LAUNCH RADAR
        </div>

        {/* Middle: verdict + symbol + subtitle */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 22,
                height: 22,
                borderRadius: 11,
                marginRight: 14,
                background: isListing ? "#7dd3fc" : "#4ade80", // blue = listing, green = passed checks
              }}
            />
            <div style={{ display: "flex", fontSize: 30, color: isListing ? "#bae6fd" : "#bbf7d0" }}>
              {isListing ? "NEW EXCHANGE LISTING" : "PASSED SAFETY CHECKS"}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1.05, marginTop: 10 }}>
            {symbol}
          </div>
          <div style={{ display: "flex", fontSize: 38, color: "#d1fae5" }}>
            {isListing ? `Now trading on ${where}` : `New on ${where}`}
          </div>
        </div>

        {/* Bottom: stats (DEX only) + footer */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {isListing ? (
            <div style={{ display: "flex", fontSize: 30, color: "#a7d7bf" }}>{where} · Spot · USDT</div>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              {cap ? <Stat label={capLabel} value={money(cap)} /> : null}   {/* NEW: shown first, when known */}
              <Stat label="Liquidity" value={money(p.get("l"))} />
              <Stat label="Volume 24h" value={money(p.get("v"))} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 24, color: "#a7d7bf" }}>
            <div style={{ display: "flex" }}>{HOST}/radar</div>
            <div style={{ display: "flex" }}>DYOR · not financial advice</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 } // Telegram's ideal landscape size
  );
}