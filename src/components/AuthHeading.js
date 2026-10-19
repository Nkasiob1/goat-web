// src/components/AuthHeading.js
// The title + subtitle above the login / sign-up form, in the visitor's language.
// A client component, so the page around it can stay a server component (and keep its metadata).
"use client";

import { useLang } from "../lib/i18n/useLang";           // the visitor's language
import { AUTH_HEAD } from "../lib/i18n/authHeading";     // the heading words in 7 languages

export default function AuthHeading({ mode }) {          // mode: "signup" or "login"
  const lang = useLang();
  const w = (AUTH_HEAD[lang] || AUTH_HEAD.en)[mode];     // English if a language is missing
  return (
    <>                                                   {/* fragment: two elements, no extra wrapper box */}
      <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-ink">{w.title}</h1>
      <p className="mt-2 text-center text-sm text-stone">{w.sub}</p>
    </>
  );
}