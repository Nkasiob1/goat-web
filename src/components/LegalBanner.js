// src/components/LegalBanner.js
// Shown on Terms / Privacy / Risk only when the visitor is NOT reading in English.
"use client";

import { useLang } from "../lib/i18n/useLang";
import S from "./S";

export default function LegalBanner() {
  const lang = useLang();
  if (lang === "en") return null;                               // English readers don't need it
  return (
    <p className="mt-6 rounded-2xl border border-line bg-mist p-4 text-sm text-stone">
      🌐 <S k="legal.banner" />
    </p>
  );
}