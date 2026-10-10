import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CommunityFeed from "../../components/CommunityFeed";

export const metadata = { title: "Community | GOAT" };

export default function CommunityPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-moss">Community</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">Talk markets with other traders.</h1>
        <div className="mt-10">
          <CommunityFeed />
        </div>
      </section>
      <Footer />
    </main>
  );
}