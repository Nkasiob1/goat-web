// src/app/vet/page.js: the Token Safety Checker page
import Navbar from "../../components/Navbar";              // each page renders its own navbar
import Footer from "../../components/Footer";              // ...and footer
import VetView from "../../components/VetView";            // the checker itself

const TITLE = "Token Safety Checker: honeypot and rug check | GOAT";
const DESCRIPTION =
  "Check any crypto token for honeypots, high taxes, minting, freeze authority, thin liquidity and copycats before you buy. Free and instant, no sign-up.";

// Google + share cards read this. The picture comes from opengraph-image.js automatically.
export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {                                             // NEW: LinkedIn, WhatsApp, Telegram, Facebook
    title: "Is this coin a trap? Check it free | GOAT",
    description: DESCRIPTION,
    type: "website",
    siteName: "GOAT",
  },
  twitter: {                                               // NEW: X shows the BIG image card
    card: "summary_large_image",
    title: "Is this coin a trap? Check it free | GOAT",
    description: DESCRIPTION,
  },
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