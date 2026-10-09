import Navbar from "../components/Navbar";           // up one folder (app → src), into components
import Hero from "../components/Hero";

export default function HomePage() {
  return (
    <main>
      <Navbar />                                     {/* section 1 */}
      <Hero />                                       {/* section 2 */}
    </main>
  );
}