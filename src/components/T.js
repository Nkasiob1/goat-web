// src/components/T.js
// <T k="nav.markets" /> : translated text that SERVER components (like Navbar) can use.
"use client";

import { useT } from "../lib/i18n/useLang";

export default function T({ k, vars }) {
  const t = useT();                                       // current language's t()
  return t(k, vars);                                      // a plain string is a valid React child
}