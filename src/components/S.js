// src/components/S.js
// <S k="footer.legal" /> : footer and legal words that SERVER components can use (like <T>, but reads site.js).
"use client";

import { useLang } from "../lib/i18n/useLang";
import { SITE } from "../lib/i18n/site";

export default function S({ k, vars }) {
  const lang = useLang();                                        // "en", "fr", ...
  const text = SITE[lang]?.[k] ?? SITE.en[k] ?? k;               // missing? English, then the key
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? "").toString()); // fill {date}
}