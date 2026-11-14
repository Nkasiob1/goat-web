"use client"; // the GOAT AI payment form: choose a plan, enter email, go to Paystack

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";                              // NEW: links to the Terms and Privacy pages
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/useLang";
import { a } from "@/lib/i18n/ai";

const PLANS = [                                             // must match PLANS in lib/aiAccess.js (the server decides the real price)
  { id: "week", naira: 500 },
  { id: "month", naira: 1500, best: true },
];
const naira = (n) => "₦" + n.toLocaleString("en-NG");

function PayForm() {
  const lang = useLang();
  const params = useSearchParams();
  const [code, setCode] = useState((params.get("id") || "").toUpperCase()); // GOAT ID from the WhatsApp link
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("month");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Logged in on the website and no ID in the link? Fill in their own GOAT ID and email.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return;
      if (!email && session.user.email) setEmail(session.user.email);
      if (code) return;
      const res = await fetch("/api/ai/chat", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const info = await res.json().catch(() => ({}));
      if (info.code) setCode(info.code);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pay(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/pay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, plan, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || a("badInput", lang));
      window.location.href = data.url;                      // off to Paystack's secure checkout
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const price = naira(PLANS.find((p) => p.id === plan).naira);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <p className="text-4xl" aria-hidden="true">🐐</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{a("payTitle", lang)}</h1>
      <p className="mt-2 text-stone">{a("paySub", lang)}</p>
      <ul className="mt-5 space-y-1.5 text-sm text-ink">
        {a("perks", lang).split(" · ").map((p) => <li key={p}>✓ {p}</li>)}
      </ul>

      <form onSubmit={pay} className="mt-8 space-y-5">
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Plan</legend>
          {PLANS.map((p) => (
            <label key={p.id} className={`cursor-pointer rounded-2xl border p-4 ${plan === p.id ? "border-forest bg-sage" : "border-line"}`}>
              <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="sr-only" />
              <span className="block text-sm text-stone">{a(p.id, lang)}</span>
              <span className="block text-2xl font-bold text-ink">{naira(p.naira)}</span>
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="goat-id" className="block text-sm font-medium text-ink">{a("goatId", lang)}</label>
          <input id="goat-id" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().trim())} required maxLength={8} placeholder="G4K9Z2Q"
            className="mt-1 w-full rounded-xl border border-line bg-mist px-4 py-3 font-mono text-ink outline-none focus:border-forest" />
          <p className="mt-1 text-xs text-stone">{a("goatIdHelp", lang)}</p>
        </div>

        <div>
          <label htmlFor="pay-email" className="block text-sm font-medium text-ink">{a("email", lang)}</label>
          <input id="pay-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120}
            className="mt-1 w-full rounded-xl border border-line bg-mist px-4 py-3 text-ink outline-none focus:border-forest" />
        </div>

        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-full bg-forest px-6 py-3.5 font-semibold text-water hover:bg-moss disabled:opacity-60">
          {a("pay", lang, { price })}
        </button>
        <p className="text-center text-xs text-stone">{a("secure", lang)}</p>
        {/* NEW: consent line, so buyers see the terms and refund rules before paying */}
        <p className="text-center text-xs text-stone">
          {a("agreePre", lang)}{" "}
          <Link href="/terms#payments" target="_blank" className="font-medium text-forest underline">{a("agreeTerms", lang)}</Link>{" "}
          {a("agreeAnd", lang)}{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-forest underline">{a("agreePrivacy", lang)}</Link>.
        </p>
      </form>
    </main>
  );
}

export default function PayView() {
  return (
    <Suspense fallback={null}>{/* useSearchParams needs a Suspense boundary */}
      <PayForm />
    </Suspense>
  );
}
