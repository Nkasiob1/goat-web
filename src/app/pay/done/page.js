// src/app/pay/done/page.js: where Paystack sends people after paying
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import PayDoneView from "../../../components/PayDoneView";

export const metadata = {
  title: "Payment | GOAT",
  robots: { index: false },                                // a private result page: keep it out of Google
};

export default function PayDonePage() {
  return (
    <>
      <Navbar />
      <PayDoneView />
      <Footer />
    </>
  );
}
