// src/app/pay/page.js: GOAT AI subscription page (Paystack)
import Navbar from "../../components/Navbar";              // each page renders its own navbar
import Footer from "../../components/Footer";              // ...and footer
import PayView from "../../components/PayView";            // the plan picker + Paystack button

export const metadata = {
  title: "Get GOAT AI | GOAT",
  description: "Your crypto and scam expert on WhatsApp and goatwatch.app. From ₦500 a week, paid securely with Paystack.",
};

export default function PayPage() {
  return (
    <>
      <Navbar />
      <PayView />
      <Footer />
    </>
  );
}
