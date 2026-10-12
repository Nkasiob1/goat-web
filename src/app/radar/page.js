// app/radar/page.js: the /radar page
import Navbar from "@/components/Navbar";       // NEW: top bar + phone tab bar (each page brings its own)
import Footer from "@/components/Footer";       // NEW: footer with the legal links
import RadarView from "@/components/RadarView"; // all the radar UI

export const metadata = {
  title: "Launch Radar | GOAT",
  description: "New crypto coins and exchange listings, safety-checked every 15 minutes.",
};

export default function RadarPage() {
  return (
    <>                                           {/* fragment: three siblings, no extra wrapper div */}
      <Navbar />
      <RadarView />
      <Footer />
    </>
  );
}