import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = [                                      // one list for desktop AND mobile
  { href: "/markets", label: "Markets" },
  { href: "/scanner", label: "Scanner" },
  { href: "/#bot", label: "The Bot" },
  { href: "/advertise", label: "Advertise" },
];

export default function Navbar() {
  return (
    <header className="relative border-b border-line bg-water">  {/* relative: the mobile menu drops down from here */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        <div className="hidden items-center gap-8 text-sm text-stone md:flex">  {/* desktop links: tablets and up */}
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-ink hover:text-moss md:inline"> {/* on phones it's in the menu instead */}
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss" /* always visible: the main action */
          >
            Sign up
          </Link>
          <MobileMenu links={NAV_LINKS} />               {/* only shows on phones */}
        </div>
      </nav>
    </header>
  );
}