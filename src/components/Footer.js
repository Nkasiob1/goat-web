import Link from "next/link";
import Logo from "./Logo";
import T from "./T";                                     // NEW: reuses navbar translations (Markets, Radar...)
import S from "./S";                                     // NEW: footer translations (site.js)

export default function Footer() {
  const columns = [                                      // each link has a real address; labels are translated
    {
      key: "product",
      heading: <S k="footer.product" />,
      links: [
        { href: "/markets", label: <T k="nav.markets" /> },
        { href: "/charts", label: <T k="nav.charts" /> },
        { href: "/radar", label: <T k="nav.radar" /> },
        { href: "/vet", label: <T k="nav.vet" /> },      // NEW: Token Safety Checker
        { href: "/scanner", label: <T k="nav.scanner" /> },
        { href: "/news", label: <T k="nav.news" /> },
      ],
    },
    {
      key: "company",
      heading: <S k="footer.company" />,
      links: [
        { href: "/#bot", label: <S k="footer.bot" /> },
        { href: "/community", label: <T k="nav.community" /> },
        { href: "/advertise", label: <S k="footer.advertise" /> },
      ],
    },
    {
      key: "legal",
      heading: <S k="footer.legal" />,
      links: [
        { href: "/terms", label: <S k="footer.terms" /> },
        { href: "/privacy", label: <S k="footer.privacy" /> },
        { href: "/risk", label: <S k="footer.risk" /> },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-water">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-stone"><S k="footer.tagline" /></p>
          </div>

          {columns.map((col) => (
            <div key={col.key}>                          {/* key is now a plain word (headings are components) */}
              <p className="text-sm font-semibold text-ink">{col.heading}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>                   {/* href is unique, so it makes a good key */}
                    <Link href={link.href} className="text-sm text-stone hover:text-ink">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="text-xs leading-relaxed text-stone">
            <S k="footer.warning" />{" "}
            <Link href="/risk" className="underline hover:text-ink"><S k="footer.readRisk" /></Link>.
          </p>
          <p className="mt-4 text-xs text-stone"><S k="footer.rights" /></p>
        </div>
      </div>
    </footer>
  );
}