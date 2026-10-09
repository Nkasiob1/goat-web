import { Suspense } from "react";                        // needed because ChartsView reads the address
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChartsView from "../../components/ChartsView";

export const metadata = { title: "Charts | GOAT" };

export default function ChartsPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-moss">Charts</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">Every market, one chart.</h1>
        <p className="mt-4 max-w-xl text-stone">
          Pick a market below, or tap the symbol name inside the chart to search any crypto,
          forex pair, index or stock. Searching inside the chart switches faster.
        </p>
        <div className="mt-10">
          <Suspense>
            <ChartsView />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}