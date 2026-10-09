import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const columns = [                                   // each column: a heading and its links
    { heading: "Product", links: ["The Bot", "Markets", "Pricing"] },
    { heading: "Company", links: ["About", "Blog", "Contact"] },
    { heading: "Legal", links: ["Terms", "Privacy", "Risk Disclosure"] },
  ];

  return (
    <footer className="border-t border-line bg-water">        {/* thin line separating the footer from the page */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">          {/* logo + 3 link columns side by side on laptops */}
          <div>
            <Logo />
            <p className="mt-4 text-sm text-stone">Greatest Of All Trades.</p>
          </div>

          {columns.map((col) => (                              // draw each column of links
            <div key={col.heading}>
              <p className="text-sm font-semibold text-ink">{col.heading}</p>
              <ul className="mt-4 space-y-3">                  {/* space-y-3 puts even gaps between links */}
                {col.links.map((link) => (                     // a loop inside a loop: each link in this column
                  <li key={link}>
                    <Link href="#" className="text-sm text-stone hover:text-ink">{link}</Link> {/* "#" for now; real pages later */}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-8">     {/* risk warning sits apart, below a divider */}
          <p className="text-xs leading-relaxed text-stone">
            Risk warning: Trading indices and gold involves significant risk of loss and
            is not suitable for everyone. Past performance does not guarantee future
            results. GOAT is an automated tool, not financial advice. Only trade with
            money you can afford to lose.
          </p>
          <p className="mt-4 text-xs text-stone">© 2026 GOAT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
