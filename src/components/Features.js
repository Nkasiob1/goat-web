import Link from "next/link";                             // NEW: cards link to the tool they describe
import S from "./S";                                     // translated words
import { WHATSAPP_URL } from "../lib/site";              // NEW: the GOAT WhatsApp bot link

// CHANGED: "What GOAT does", the four crypto-safety tools. (The trading bot stays private while it's tested,
// so it's no longer advertised on the home page: one clear focus, and nothing that looks like investment advice.)
const TOOLS = [
  { num: "01", key: "t1", href: "/vet", icon: "🔍" },                 // coin check (Vet)
  { num: "02", key: "t2", href: WHATSAPP_URL, icon: "🏢", external: true }, // Company Check runs inside GOAT AI / the bots
  { num: "03", key: "t3", href: WHATSAPP_URL, icon: "💬", external: true }, // GOAT AI on WhatsApp
  { num: "04", key: "t4", href: "/radar", icon: "📡" },               // radar + rug watch
];

export default function Features() {
  return (
    <section id="tools" className="bg-mist py-24">          {/* CHANGED: id="tools" (was "bot") */}
      <div className="mx-auto max-w-6xl px-6">               {/* same centred width as the hero, so edges line up */}
        <p className="text-sm font-medium text-moss"><S k="tools.label" /></p>   {/* small label above the heading */}
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink md:text-4xl">
          <S k="tools.title" />
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"> {/* 1 column on phones, 2 on tablets, 4 on wide screens */}
          {TOOLS.map((t) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-moss">{t.num}</span>  {/* 01, 02... in the number font */}
                  <span aria-hidden="true" className="text-xl">{t.icon}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink"><S k={`${t.key}.title`} /></h3>
                <p className="mt-2 text-sm leading-relaxed text-stone"><S k={`${t.key}.text`} /></p>
              </>
            );
            const card = "block h-full rounded-2xl border border-line bg-water p-6 transition hover:border-forest"; // white card on mist
            return t.external ? (
              <a key={t.num} href={t.href} target="_blank" rel="noopener noreferrer" className={card}>{inner}</a>
            ) : (
              <Link key={t.num} href={t.href} className={card}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
