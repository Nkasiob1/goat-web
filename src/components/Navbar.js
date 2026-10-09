import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import UserMenu from "./UserMenu";

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/charts", label: "Charts" },
  { href: "/scanner", label: "Scanner" },
  { href: "/news", label: "News" },                      // NEW
  { href: "/advertise", label: "Advertise" },
];

export default function Navbar() {
  return (
    <header className="relative border-b border-line bg-water">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        <div className="hidden items-center gap-8 text-sm text-stone md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <UserMenu />                                   {/* Log in / Sign up, or avatar / Log out */}
          <MobileMenu links={NAV_LINKS} />               {/* phone menu reads the same list */}
        </div>
      </nav>
    </header>
  );
}