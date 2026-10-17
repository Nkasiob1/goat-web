// src/lib/i18n/useLang.js
// One shared "current language" that every component can read and change.

import { useCallback, useSyncExternalStore } from "react";
import { DICTS } from "./dictionaries";

const KEY = "goat-lang";                                  // localStorage key for the saved choice
const listeners = new Set();                              // components waiting to hear about changes

// Which language should we use? Saved choice first, else the phone's language, else English.
function read() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && DICTS[saved]) return saved;              // the visitor picked one before
  } catch {}
  const phone = (navigator.language || "en").slice(0, 2).toLowerCase(); // "fr-FR" -> "fr"
  return DICTS[phone] ? phone : "en";                     // we support it? use it. Otherwise English.
}

// Change language: save it, update <html lang>, tell every listening component
export function setLang(lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {}
  document.documentElement.lang = lang;                   // screen readers + Google know the page language
  listeners.forEach((notify) => notify());                // re-render everything that uses useLang()
}

// How React subscribes to our store (also listens to other tabs changing it)
function subscribe(notify) {
  listeners.add(notify);
  const onStorage = (e) => {
    if (e.key === KEY) notify();                          // changed in another tab
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

// The current language code. On the server (and during hydration) it's always "en".
export function useLang() {
  return useSyncExternalStore(subscribe, read, () => "en");
}

// Look up one key and fill in {placeholders}. Missing? fall back to English, then the key itself.
export function translate(lang, key, vars) {
  const text = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? "").toString()); // "{v}" -> vars.v
}

// The t() function components use: const t = useT(); t("vet.title")
export function useT() {
  const lang = useLang();
  return useCallback((key, vars) => translate(lang, key, vars), [lang]);
}