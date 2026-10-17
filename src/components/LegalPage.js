import Link from "next/link";                                       // links between the legal pages
import Navbar from "./Navbar";                                      // top bar + phone tab bar
import Footer from "./Footer";                                      // site footer
import S from "./S";                                                // NEW: translated page frame
import LegalBanner from "./LegalBanner";                            // NEW: "English version applies" note

export const CONTACT_EMAIL = "goat0support@gmail.com";              // GOAT's public support address

// One shared layout for Terms, Privacy and Risk Disclosure.
// The legal TEXT stays English (it's the binding version); the frame around it is translated.
export default function LegalPage({ eyebrow, title, updated, intro, sections }) {
  return (
    <>                                                              {/* fragment: Navbar, page, Footer side by side */}
      <Navbar />

      <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-12 sm:px-6"> {/* narrow column = comfortable reading */}
        <p className="text-sm font-medium uppercase tracking-wider text-forest">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-stone"><S k="legal.updated" vars={{ date: updated }} /></p>

        <LegalBanner />                                             {/* NEW: only shows for non-English readers */}

        <p className="mt-6 text-lg leading-relaxed text-ink">{intro}</p>

        {/* table of contents: jump links to each section */}
        <nav aria-label="On this page" className="mt-8 rounded-3xl border border-line p-5">
          <p className="text-sm font-semibold text-ink"><S k="legal.onPage" /></p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-stone hover:text-forest">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-24"> {/* scroll-mt: heading isn't hidden under the navbar */}
            <h2 className="text-xl font-semibold text-ink">
              {i + 1}. {s.title}
            </h2>
            {s.body.map((block, j) =>
              Array.isArray(block) ? (                                // an array = a bullet list
                <ul key={j} className="mt-3 list-disc space-y-1.5 pl-5 text-stone">
                  {block.map((item) => (
                    <li key={item} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              ) : (                                                   // a string = a paragraph
                <p key={j} className="mt-3 leading-relaxed text-stone">{block}</p>
              )
            )}
          </section>
        ))}

        {/* contact strip: a tappable email link */}
        <div className="mt-12 rounded-3xl bg-sage p-5 text-sm text-ink">
          <S k="legal.questions" />{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-forest underline">
            {CONTACT_EMAIL}
          </a>
          .
        </div>

        {/* links to the other two pages */}
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
          <Link href="/terms" className="text-stone hover:text-forest"><S k="legal.terms" /></Link>
          <Link href="/privacy" className="text-stone hover:text-forest"><S k="legal.privacy" /></Link>
          <Link href="/risk" className="text-stone hover:text-forest"><S k="legal.risk" /></Link>
        </div>
      </main>

      <Footer />
    </>
  );
}