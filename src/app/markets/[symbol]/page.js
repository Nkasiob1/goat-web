import { notFound } from "next/navigation";              // shows the 404 page for unknown coins
import Link from "next/link";
import Navbar from "../../../components/Navbar";         // up three folders: [symbol] → markets → app → src
import Footer from "../../../components/Footer";
import CoinPrice from "../../../components/CoinPrice";
import { COINS } from "../../../data/coins";
import { VENUES } from "../../../data/venues";

export function generateStaticParams() {                 // tells Next.js every coin page in advance, so they load fast
  return COINS.map((c) => ({ symbol: c.short.toLowerCase() }));  // [{ symbol: "btc" }, { symbol: "eth" }, ...]
}

export async function generateMetadata({ params }) {     // sets the browser tab title per coin
  const { symbol } = await params;                       // read the blank from the URL
  const coin = COINS.find((c) => c.short.toLowerCase() === symbol);
  return { title: coin ? `${coin.name} price | GOAT` : "Not found | GOAT" };
}

export default async function CoinPage({ params }) {
  const { symbol } = await params;                       // e.g. "btc" from /markets/btc
  const coin = COINS.find((c) => c.short.toLowerCase() === symbol); // look it up in our list

  if (!coin) notFound();                                 // not in our list → 404

  const venues = [...VENUES].sort((a, b) => b.sponsored - a.sponsored); // copy the list, sponsored ones first

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/markets" className="text-sm text-stone hover:text-ink">← All markets</Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {coin.name} <span className="font-mono text-xl text-stone">{coin.short}</span>
        </h1>
        <p className="mt-3 max-w-xl text-stone">{coin.about}</p>

        <CoinPrice symbol={coin.symbol} />               {/* the live price and stats */}

        <div className="mt-16">
          <h2 className="text-xl font-semibold text-ink">Where to buy {coin.name}</h2>
          <ul className="mt-6 divide-y divide-line rounded-3xl border border-line">
            {venues.map((v) => (
              <li key={v.name} className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{v.name}</span>
                  <span className="text-xs text-stone">{v.type}</span>
                  {v.sponsored && (                      // only show the tag when sponsored is true
                    <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-moss">Sponsored</span>
                  )}
                </div>
                <a
                  href={v.url}
                  target="_blank"                        // opens in a new tab, so GOAT stays open
                  rel={v.sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"} // "sponsored" tells Google it's a paid link
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-moss"
                >
                  Visit
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-stone">
            Availability depends on your country. GOAT may earn a fee from sponsored listings.
            Always check that a platform is licensed where you live, and do your own research.
          </p>

          <div className="mt-8 rounded-3xl bg-sage p-6">  {/* the advertiser call-to-action */}
            <p className="font-semibold text-ink">Run an exchange or broker?</p>
            <p className="mt-1 text-sm text-stone">Get listed where traders decide where to buy.</p>
            <Link href="#" className="mt-4 inline-block text-sm font-medium text-moss hover:text-forest">
              Advertise with GOAT →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}