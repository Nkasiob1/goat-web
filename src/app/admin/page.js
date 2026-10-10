import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminQueue from "@/components/AdminQueue";

export const metadata = {
  title: "Moderation | GOAT",
  robots: { index: false, follow: false }, // keep Google away from this page
};

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <AdminQueue />
      </main>
      <Footer />
    </>
  );
}