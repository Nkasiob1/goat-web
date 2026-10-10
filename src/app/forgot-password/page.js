import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Reset password | GOAT" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-line bg-water p-8">
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}