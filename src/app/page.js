import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";     // new
import Footer from "../components/Footer";         // new

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />                                 {/* section 3 */}
      <Footer />                                   {/* last section */}
    </main>
  );
}