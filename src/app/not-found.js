import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = { title: "Page not found | GOAT" };

export default function NotFound() {                     // Next.js shows this for any address that doesn't exist
  return (
    <main>
      <Navbar />
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-mono text-sm text-moss">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">This page wandered off.</h1>
        <p className="mt-3 text-stone">The address may be mistyped, or the page may have moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">Go home</Link>
          <Link href="/markets" className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:border-moss">View markets</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
