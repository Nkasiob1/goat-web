import Link from "next/link";                       // page links without full reloads
import Logo from "./Logo";                          // our logo, from the same folder

export default function Navbar() {
  return (
    <header className="border-b border-line bg-water">       {/* thin border line under the bar, white background */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"> {/* centred, max width, logo left / buttons right */}
        <Logo />                                             {/* the coin and GOAT wordmark */}

        <div className="hidden items-center gap-8 text-sm text-stone md:flex"> {/* middle links: hidden on phones, a row on laptops */}
          <Link href="#markets" className="hover:text-ink">Markets</Link>   {/* # links jump to a section on this page */}
          <Link href="#bot" className="hover:text-ink">The Bot</Link>       {/* hover:text-ink darkens the link on hover */}
          <Link href="#pricing" className="hover:text-ink">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">            {/* the two buttons on the right */}
          <Link href="/login" className="text-sm font-medium text-ink hover:text-moss"> {/* quiet text button */}
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss" /* the one strong button */
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}