import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "New password | GOAT", robots: { index: false } }; // keep it out of Google

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-line bg-water p-8">
          <ResetPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}