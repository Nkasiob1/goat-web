// src/app/vet/page.js: the Token Safety Checker page
import Navbar from "../../components/Navbar";              // each page renders its own navbar
import Footer from "../../components/Footer";              // ...and footer
import VetView from "../../components/VetView";            // the checker itself

// Google reads this, which is how people searching "is X a honeypot" find us
export const metadata = {
  title: "Token Safety Checker: honeypot and rug check | GOAT",
  description:
    "Check any crypto token for honeypots, high taxes, minting, freeze authority and thin liquidity before you buy. Free and instant, no sign-up.",
};

export default function VetPage() {
  return (
    <>
      <Navbar />
      <VetView />
      <Footer />
    </>
  );
}