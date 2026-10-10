import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import AdminLink from "./AdminLink";                     // NEW: admins only

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/charts", label: "Charts" },
  { href: "/scanner", label: "Scanner" },
  { href: "/news", label: "News" },
  { href: "/community", label: "Community" },
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

        <div className="flex items-center gap-2">
          <AdminLink />                                  {/* NEW: shield + review count, invisible to non-admins */}
          <NotificationBell />
          <UserMenu />
          <MobileMenu links={NAV_LINKS} />
        </div>
      </nav>
    </header>
  );
}