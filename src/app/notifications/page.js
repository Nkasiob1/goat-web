import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationsView from "@/components/NotificationsView";

export const metadata = { title: "Notifications | GOAT" }; // browser tab title

export default function NotificationsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <NotificationsView />
      </main>
      <Footer />
    </>
  );
}