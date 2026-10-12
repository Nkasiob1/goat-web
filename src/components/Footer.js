import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const columns = [                                      // each link has a real address
    {
      heading: "Product",
      links: [
        { label: "Markets", href: "/markets" },
        { label: "Charts", href: "/charts" },
        { label: "Radar", href: "/radar" },              // NEW: Launch Radar
        { label: "Scanner", href: "/scanner" },
        { label: "News", href: "/news" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "The Bot", href: "/#bot" },
        { label: "Community", href: "/community" },
        { label: "Advertise", href: "/advertise" },
      ],
    },
    {
      heading: "Legal",
      links: [                                           // CHANGED: the pages now exist
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
        { label: "Risk Disclosure", href: "/risk" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-water">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-stone">Greatest Of All Trades.</p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-semibold text-ink">{col.heading}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-stone hover:text-ink">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="text-xs leading-relaxed text-stone">
            Risk warning: Trading crypto, forex, stocks and indices involves significant risk of loss
            and is not suitable for everyone. Past performance does not guarantee future results.
            GOAT provides information and tools, not financial advice. Only trade with money you can
            afford to lose.{" "}
            <Link href="/risk" className="underline hover:text-ink">Read the full Risk Disclosure</Link>. {/* NEW */}
          </p>
          <p className="mt-4 text-xs text-stone">© 2026 GOAT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}