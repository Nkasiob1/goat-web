import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import CoinPrice from "../../../components/CoinPrice";
import CoinStar from "../../../components/CoinStar";
import TradingChart from "../../../components/TradingChart";
import { COINS } from "../../../data/coins";
import { VENUES } from "../../../data/venues";
import { getTopCoins } from "../../../lib/cryptoList";
import CoinSentiment from "../../../components/CoinSentiment";
export function generateStaticParams() {                 // our 10 are built in advance; the other 90 are built on first visit
  return COINS.map((c) => ({ symbol: c.short.toLowerCase() }));
}

export async function generateMetadata({ params }) {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} price | GOAT` };
}

async function findCoin(symbol) {                        // look in our 10 first, then the top 100
  const known = COINS.find((c) => c.short.toLowerCase() === symbol);
  if (known) return known;

  const top = await getTopCoins(100).catch(() => []);    // if Binance is unreachable, treat as not found
  const listed = top.find((c) => c.short.toLowerCase() === symbol);
  if (!listed) return null;

  return {
    symbol: listed.symbol,
    short: listed.short,
    name: listed.name,
    about: `${listed.short} is one of the 100 most traded coins on Binance, priced here against USDT (a dollar stablecoin).`,
  };
}

export default async function CoinPage({ params }) {
  const { symbol } = await params;
  const coin = await findCoin(symbol);
  if (!coin) notFound();

  const venues = [...VENUES].sort((a, b) => b.sponsored - a.sponsored);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/markets" className="text-sm text-stone hover:text-ink">← All markets</Link>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {coin.name} <span className="font-mono text-xl text-stone">{coin.short}</span>
          </h1>
          <CoinStar symbol={coin.symbol} />
        </div>
        <p className="mt-3 max-w-xl text-stone">{coin.about}</p>

        <CoinPrice symbol={coin.symbol} />
        <div className="mt-8">
          <CoinSentiment coin={coin.short} />            {/* what GOAT members think, plus a link to the discussion */}
        </div>

        <div className="mt-10">
          <TradingChart symbol={`BINANCE:${coin.symbol}`} />
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-semibold text-ink">Where to buy {coin.name}</h2>
          <ul className="mt-6 divide-y divide-line rounded-3xl border border-line">
            {venues.map((v) => (
              <li key={v.name} className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{v.name}</span>
                  <span className="text-xs text-stone">{v.type}</span>
                  {v.sponsored && (
                    <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-moss">Sponsored</span>
                  )}
                </div>
                <a
                  href={v.url}
                  target="_blank"
                  rel={v.sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-moss"
                >
                  Visit
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-stone">
            Availability depends on your country. Not every platform lists every coin. GOAT may earn
            a fee from sponsored listings. Always check that a platform is licensed where you live,
            and do your own research.
          </p>

          <div className="mt-8 rounded-3xl bg-sage p-6">
            <p className="font-semibold text-ink">Run an exchange or broker?</p>
            <p className="mt-1 text-sm text-stone">Get listed where traders decide where to buy.</p>
            <Link href="/advertise" className="mt-4 inline-block text-sm font-medium text-moss hover:text-forest">
              Advertise with GOAT →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}