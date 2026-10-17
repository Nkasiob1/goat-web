// src/components/S.js
// <S k="footer.legal" /> or <S k="hero.title" /> : translated words that SERVER components can use.
// Reads every page dictionary listed in TABLES (add new page files here).
"use client";

import { useLang } from "../lib/i18n/useLang";
import { SITE } from "../lib/i18n/site";                         // footer + legal frame
import { HOME } from "../lib/i18n/home";                         // NEW: home page

const TABLES = [SITE, HOME];                                     // NEW: searched in this order

// find one key in one language across all tables
function find(lang, k) {
  for (const table of TABLES) {
    const text = table[lang]?.[k];
    if (text !== undefined) return text;                         // found it
  }
  return undefined;                                              // not in this language
}

export default function S({ k, vars }) {
  const lang = useLang();                                        // "en", "fr", ...
  const text = find(lang, k) ?? find("en", k) ?? k;              // missing? English, then the key itself
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? "").toString()); // fill {date}
}