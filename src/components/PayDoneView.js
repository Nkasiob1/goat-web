"use client"; // after Paystack: confirm the payment with the server and show the result

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";
import { a } from "@/lib/i18n/ai";

function Done() {
  const lang = useLang();
  const reference = useSearchParams().get("reference") || "";
  const [state, setState] = useState({ status: "pending" }); // pending | ok | fail

  useEffect(() => {
    let tries = 0;
    let stop = false;
    async function check() {
      const res = await fetch(`/api/pay/verify?reference=${encodeURIComponent(reference)}`);
      const data = await res.json().catch(() => ({}));
      if (stop) return;
      if (data.ok) {
        const info = await fetch(`/api/pay/status?code=${encodeURIComponent(data.code)}`).then((r) => r.json()).catch(() => ({}));
        setState({ status: "ok", until: info.paidUntil || data.paidUntil });
      } else if (++tries < 5) setTimeout(check, 3000); // bank transfers can take a few seconds to confirm
      else setState({ status: "fail" });
    }
    if (reference) check(); else setState({ status: "fail" });
    return () => { stop = true; };
  }, [reference]);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">{state.status === "ok" ? "✅" : state.status === "fail" ? "⚠️" : "⏳"}</p>
      <p className="mt-4 text-lg text-ink">
        {state.status === "ok" ? a("doneOk", lang, { date: state.until ? new Date(state.until).toLocaleDateString() : "" })
          : state.status === "fail" ? a("doneFail", lang) : a("donePending", lang)}
      </p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-forest px-6 py-3 font-medium text-water">{a("back", lang)}</Link>
    </main>
  );
}

export default function PayDoneView() {
  return <Suspense fallback={null}><Done /></Suspense>;
}
