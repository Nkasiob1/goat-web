import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import NewsPreview from "../components/NewsPreview";
import Features from "../components/Features";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <NewsPreview />                                    {/* NEW: between the hero and the features */}
      <Features />
      <Footer />
    </main>
  );
}