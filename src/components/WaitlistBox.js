// src/components/WaitlistBox.js
// "GOAT Premium is coming" email box. Used on the home page and under Vet reports.
"use client";

import { useState } from "react";
import { useLang } from "../lib/i18n/useLang";               // the visitor's language
import { WAITLIST } from "../lib/i18n/waitlist";             // this box's words in 7 languages

export default function WaitlistBox({ source = "home" }) {   // source = which page it's on
  const lang = useLang();
  const w = WAITLIST[lang] || WAITLIST.en;                  // fall back to English
  const [email, setEmail] = useState("");                   // what they typed
  const [website, setWebsite] = useState("");               // honeypot: humans never see or fill this
  const [status, setStatus] = useState("idle");             // idle | sending | done | already | invalid | error

  async function join(e) {
    e.preventDefault();                                     // don't reload the page
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {        // quick check before bothering the server
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, lang, source, website }),
      });
      const data = await res.json().catch(() => ({}));      // tolerate an empty reply
      if (!res.ok) throw new Error(data.error || "failed");
      setStatus(data.status === "already" ? "already" : "done");
    } catch {
      setStatus("error");
    }
  }

  const finished = status === "done" || status === "already"; // hide the form once they're in

  return (
    <div className="mt-8 max-w-md rounded-2xl border border-line bg-mist p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-moss">⭐ Premium</p>
      <h3 className="mt-1 text-lg font-semibold text-ink">{w.title}</h3>
      <p className="mt-1 text-sm text-stone">{w.sub}</p>

      {finished ? (
        <p className="mt-4 rounded-xl border border-gain/40 bg-gain/10 px-4 py-3 text-sm font-medium text-gain">
          {status === "already" ? w.already : w.done}
        </p>
      ) : (
        <form onSubmit={join} className="mt-4 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={w.placeholder}
            autoComplete="email"
            className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-ink placeholder:text-stone focus:border-forest focus:outline-none dark:bg-transparent"
          />
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}                                    // keyboard users skip it
            autoComplete="off"
            aria-hidden="true"                               // screen readers skip it
            className="hidden"                               // invisible to humans; bots still fill it
          />
          <button
            disabled={status === "sending"}
            className="shrink-0 rounded-xl bg-forest px-4 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {status === "sending" ? w.sending : w.button}
          </button>
        </form>
      )}

      {status === "invalid" && <p className="mt-2 text-sm text-loss">{w.invalid}</p>}
      {status === "error" && <p className="mt-2 text-sm text-loss">{w.error}</p>}
      <p className="mt-3 text-xs text-stone">{w.privacy}</p>
    </div>
  );
}