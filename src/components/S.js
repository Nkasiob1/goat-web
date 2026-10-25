// src/components/S.js
// <S k="footer.legal" /> or <S k="hero.title" /> : translated words that SERVER components can use.
// NEW: <S k="hero.title" highlight /> turns *starred words* in the translation into shimmering gold.
// Reads every page dictionary listed in TABLES (add new page files here).
"use client";

import { useLang } from "../lib/i18n/useLang";
import { SITE } from "../lib/i18n/site";                         // footer + legal frame
import { HOME } from "../lib/i18n/home";                         // home page

const TABLES = [SITE, HOME];                                     // searched in this order

// find one key in one language across all tables
function find(lang, k) {
  for (const table of TABLES) {
    const text = table[lang]?.[k];
    if (text !== undefined) return text;                         // found it
  }
  return undefined;                                              // not in this language
}

export default function S({ k, vars, highlight }) {              // CHANGED: + highlight
  const lang = useLang();                                        // "en", "fr", ...
  let text = find(lang, k) ?? find("en", k) ?? k;                // missing? English, then the key itself
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? "").toString()); // fill {date}
  }
  if (!highlight) return text;                                   // normal text: done

  // NEW: "Check *any coin* before you buy." -> ["Check ", "any coin", " before you buy."]
  // split() keeps what's inside the brackets ( ), so every ODD piece is a starred piece.
  const parts = text.split(/\*(.+?)\*/);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="text-shimmer">{part}</span>    // starred: shimmering gold
      : part                                                     // plain text, unchanged
  );
}