import Navbar from "../../components/Navbar";           // up two folders (markets → app → src), into components
import Footer from "../../components/Footer";
import MarketTabs from "../../components/MarketTabs";

export const metadata = {                                // sets the browser tab title for this page only
  title: "Markets | GOAT",
};

export default function MarketsPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">                      {/* same width as the homepage */}
        <p className="text-sm font-medium text-moss">Markets</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">
          Live prices, one calm view.
        </h1>
        <p className="mt-4 max-w-xl text-stone">
          Track crypto, forex and NFTs in one place, then find trusted places to buy.
        </p>
        <div className="mt-10">
          <MarketTabs />
        </div>
      </section>
      <Footer />
    </main>
  );
}