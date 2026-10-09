import { cacheLife } from "next/cache";
import { COINS } from "../data/coins";

const SKIP = ["USDC", "FDUSD", "TUSD", "DAI", "USDP", "BUSD", "USD1", "EUR", "EURI", "AEUR"]; // stablecoins: always ~$1, nothing to watch

export async function getTopCoins(limit = 100) {
  "use cache";                                           // the noticeboard
  cacheLife("minutes");                                  // refreshed about once a minute

  const res = await fetch("https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI"); // every Binance pair, slim version
  if (!res.ok) throw new Error(`Binance responded ${res.status}`); // throw, so a failure is NOT cached
  const all = await res.json();

  const known = Object.fromEntries(COINS.map((c) => [c.symbol, c])); // our 10 coins with proper names, for quick look-up

  return all
    .filter((t) => t.symbol.endsWith("USDT"))            // only coins priced in dollars (USDT)
    .map((t) => {
      const short = t.symbol.slice(0, -4);               // "PEPEUSDT" → "PEPE"
      const price = Number(t.lastPrice);
      const open = Number(t.openPrice);
      return {
        symbol: t.symbol,
        short,
        name: known[t.symbol]?.name ?? short,            // "Bitcoin" if we know it, otherwise the ticker
        price,
        change: open ? ((price - open) / open) * 100 : 0,
        volume: Number(t.quoteVolume),                   // 24h volume in dollars
      };
    })
    .filter((c) => !SKIP.includes(c.short))              // no stablecoins
    .filter((c) => !/(UP|DOWN|BULL|BEAR)$/.test(c.short)) // no leveraged tokens
    .filter((c) => c.volume > 0)                         // no dead pairs
    .sort((a, b) => b.volume - a.volume)                 // most traded first
    .slice(0, limit)                                     // keep the top 100
    .map((c, i) => ({ ...c, rank: i + 1 }));             // number them 1, 2, 3...
}