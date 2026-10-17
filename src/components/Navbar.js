import Link from "next/link";                            // fast page-to-page links
import Logo from "./Logo";                               // GOAT logo + wordmark
import MobileMenu from "./MobileMenu";                   // ☰ menu on phones
import UserMenu from "./UserMenu";                       // avatar / sign up button
import NotificationBell from "./NotificationBell";       // 🔔 with unread count
import AdminLink from "./AdminLink";                     // shield, admins only (laptop)
import ThemeToggle from "./ThemeToggle";                 // ☀️/🌙 switch
import MobileTabBar from "./MobileTabBar";               // app-style bottom bar on phones
import SplashScreen from "./SplashScreen";               // NEW: animated opening (installed app only)

const NAV_LINKS = [                                      // one list feeds the laptop bar AND the ☰ menu
  { href: "/markets", label: "Markets" },
  { href: "/charts", label: "Charts" },
  { href: "/radar", label: "Radar" },
  { href: "/vet", label: "Vet a coin" },                 // Token Safety Checker, next to Radar
  { href: "/scanner", label: "Scanner" },
  { href: "/news", label: "News" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  return (
    <header className="relative border-b border-line bg-water">
      <SplashScreen />                                   {/* NEW: covers the screen for ~2s on app launch, then fades */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        {/* laptop links: gap-6 so seven links fit comfortably */}
        <div className="hidden items-center gap-6 text-sm text-stone md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />                                {/* shows on laptops and phones */}
          <AdminLink />
          <NotificationBell />
          <UserMenu />
          <MobileMenu links={NAV_LINKS} />               {/* ☰ holds every link, including Scanner and News */}
        </div>
      </nav>
      <MobileTabBar />                                   {/* fixed to the bottom of the screen, phones only */}
    </header>
  );
}