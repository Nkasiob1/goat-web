import Link from "next/link";
import { formatPrice } from "../lib/format";
import { changeOf } from "../lib/useLivePrices";

// coins = ["BTC", ...], quotes = { BTC: { price, open } } from useLivePrices
export default function LiveCoinPrices({ coins = [], quotes = {} }) {
  if (!coins.length) return null;

  return (
    <ul className="divide-y divide-line">
      {coins.slice(0, 5).map((coin) => {
        const q = quotes[coin];
        const change = changeOf(q);
        return (
          <li key={coin}>
            <Link
              href={`/markets/${coin.toLowerCase()}`}
              className="flex items-center justify-between py-2.5 text-sm hover:text-forest"
            >
              <span className="font-medium text-ink">${coin}</span>
              <span className="flex items-center gap-3 font-mono tabular-nums">
                <span className="text-ink">{q ? formatPrice(q.price) : "—"}</span>
                {change !== null && (
                  <span className={change >= 0 ? "text-gain" : "text-loss"}>
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}