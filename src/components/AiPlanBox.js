// src/components/AiPlanBox.js
// NEW: replaces the "Premium is coming" waitlist. GOAT AI is real and paid, so show the price and a Pay button.
// Used on the home page and under each Vet report. All words come from lib/i18n/ai.js (10 languages).
"use client";

import Link from "next/link";
import { useLang } from "../lib/i18n/useLang";               // the visitor's language
import { a } from "../lib/i18n/ai";                          // GOAT AI + pay-page words
import { PLANS, naira } from "../lib/plans";                 // ₦500 / 7 days, ₦1,500 / 30 days
import { WHATSAPP_URL } from "../lib/site";                  // the WhatsApp bot

export default function AiPlanBox() {
  const lang = useLang();
  const perks = a("perks", lang).split(" · ");              // "Expert answers... · Company Check... · ..." -> a list

  return (
    <section className="mt-8 rounded-3xl border border-line bg-water p-6 text-start">
      <p className="text-sm font-semibold uppercase tracking-wider text-forest">🐐 {a("payTitle", lang)}</p>
      <p className="mt-2 text-ink">{a("paySub", lang)}</p>

      <ul className="mt-4 space-y-1.5 text-sm text-stone">
        {perks.map((p) => (
          <li key={p} className="flex gap-2"><span aria-hidden="true" className="text-forest">✓</span>{p}</li>
        ))}
      </ul>

      {/* the two passes, side by side */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`rounded-2xl border p-4 ${p.best ? "border-forest" : "border-line"}`}>
            <p className="text-2xl font-bold text-ink">{naira(p.naira)}</p>
            <p className="text-sm text-stone">{a(p.id, lang)}</p>       {/* "7 days" / "30 days" */}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href="/pay" className="inline-flex min-h-11 items-center rounded-full bg-forest px-6 font-semibold text-water hover:bg-moss">
          {a("subscribe", lang)}                                           {/* "Get GOAT AI" */}
        </Link>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-forest underline">
          WhatsApp
        </a>
      </div>
      <p className="mt-3 text-xs text-stone">{a("secure", lang)} {a("disclaimer", lang)}</p>
    </section>
  );
}
