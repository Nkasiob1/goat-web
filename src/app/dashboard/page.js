import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DashboardView from "../../components/DashboardView";

export const metadata = { title: "Dashboard | GOAT" };

export default function DashboardPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto min-h-[60vh] max-w-6xl px-6 py-16">
        <DashboardView />
      </section>
      <Footer />
    </main>
  );
}