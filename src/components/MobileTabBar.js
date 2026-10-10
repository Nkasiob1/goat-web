"use client"; // needs the current address to highlight the active tab

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [ // label, address, icon drawing
  { href: "/", label: "Home", icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { href: "/markets", label: "Markets", icon: <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" /> },          // bar chart
  { href: "/scanner", label: "Scanner", icon: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.2-4.2" /></> }, // magnifier
  { href: "/community", label: "Community", icon: <path d="M4 5h16v11H8l-4 4V5z" /> },                 // speech bubble
  { href: "/news", label: "News", icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></> }, // page
];

export default function MobileTabBar() {
  const pathname = usePathname();                         // e.g. "/community" or "/post/42"

  function isActive(href) {
    if (href === "/") return pathname === "/";            // Home only when exactly on the homepage
    if (href === "/community") return pathname.startsWith("/community") || pathname.startsWith("/post"); // posts belong to Community
    return pathname.startsWith(href);                     // /markets/btc still lights up Markets
  }

  return (
    <>
      {/* push page content up so the bar never covers the bottom of the page (phones only) */}
      <style>{`@media (max-width: 767px) { body { padding-bottom: calc(4rem + env(safe-area-inset-bottom)); } }`}</style>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-water/95 backdrop-blur md:hidden" // frosted bar, hidden on laptops
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }} // clears the iPhone home bar
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {TABS.map((t) => {
            const active = isActive(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}   // tells screen readers which tab is open
                  className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${active ? "text-forest" : "text-stone hover:text-ink"}`}
                >
                  {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-forest"></span>} {/* green line on the active tab */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                    {t.icon}
                  </svg>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}