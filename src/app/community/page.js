import { Suspense } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CommunityFeed from "../../components/CommunityFeed";

export const metadata = { title: "Community | GOAT" };

export default function CommunityPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Community</h1>
          <p className="mt-1 text-sm text-stone">Talk markets with other traders. Tag coins with $ and call it bullish or bearish.</p>
        </div>
        <Suspense fallback={<p className="text-sm text-stone">Loading…</p>}>
          <CommunityFeed />
        </Suspense>
      </section>
      <Footer />
    </main>
  );
}