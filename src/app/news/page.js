import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import NewsFeed from "../../components/NewsFeed";
import { getNews } from "../../lib/news";

export const metadata = { title: "Market News | GOAT" };

export default async function NewsPage() {
  const items = await getNews().catch(() => []);         // if every feed is down, show the empty message instead of crashing

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-16">  {/* narrower than other pages: headlines read better */}
        <p className="text-sm font-medium text-moss">News</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">What's moving markets.</h1>
        <p className="mt-4 max-w-xl text-stone">
          Headlines from trusted crypto, forex and stock market publishers, refreshed every 15 minutes.
        </p>

        <div className="mt-10">
          {items.length === 0 ? (
            <p className="text-stone">News is taking a breather. Please check back shortly.</p>
          ) : (
            <NewsFeed items={items} />
          )}
        </div>

        <p className="mt-6 text-xs text-stone">
          Headlines link to the original publishers. GOAT is not responsible for external content.
        </p>
      </section>
      <Footer />
    </main>
  );
}
