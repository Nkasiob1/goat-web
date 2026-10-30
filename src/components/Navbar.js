import Link from "next/link";                            // fast page-to-page links
import Logo from "./Logo";                               // GOAT logo + wordmark
import MobileMenu from "./MobileMenu";                   // ☰ menu on phones
import UserMenu from "./UserMenu";                       // avatar / sign up button
import NotificationBell from "./NotificationBell";       // 🔔 with unread count
import AdminLink from "./AdminLink";                     // shield, admins only (laptop)
import ThemeToggle from "./ThemeToggle";                 // ☀️/🌙 switch
import MobileTabBar from "./MobileTabBar";               // app-style bottom bar on phones
import LanguageSwitcher from "./LanguageSwitcher";       // 🌐 language menu
import GetAppButton from "./GetAppButton";               // 📲 "get the app" (hidden inside the installed app)
import T from "./T";                                     // translated text
// REMOVED: SplashScreen. It now lives in layout.js, drawn once per launch.

const NAV_LINKS = [                                      // labels are <T> so they follow the language
  { href: "/markets", label: <T k="nav.markets" /> },
  { href: "/charts", label: <T k="nav.charts" /> },
  { href: "/radar", label: <T k="nav.radar" /> },
  { href: "/vet", label: <T k="nav.vet" /> },
  { href: "/scanner", label: <T k="nav.scanner" /> },
  { href: "/news", label: <T k="nav.news" /> },
  { href: "/community", label: <T k="nav.community" /> },
];

export default function Navbar() {
  return (
    <header className="relative border-b border-line bg-water">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        {/* laptop links */}
        <div className="hidden items-center gap-6 text-sm text-stone md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">              {/* 🌐 on laptops (phones get it in ☰) */}
            <LanguageSwitcher />
          </div>
          <GetAppButton />                               {/* phones AND laptops, in every language */}
          <ThemeToggle />
          <AdminLink />
          <NotificationBell />
          <UserMenu />
          <MobileMenu links={NAV_LINKS} />               {/* ☰ holds every link */}
        </div>
      </nav>
      <MobileTabBar />                                   {/* fixed to the bottom of the screen, phones only */}
    </header>
  );
}