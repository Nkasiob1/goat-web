// src/components/LanguageSwitcher.js
// 🌐 menu: our 7 languages, plus "More languages (Google)" as a fallback.
// Can appear more than once (navbar + phone menu): each copy gets its own id.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LANGS } from "../lib/i18n/dictionaries";
import { useLang, setLang, useT } from "../lib/i18n/useLang";

// Is Google currently translating? (it stores its choice in a "googtrans" cookie, e.g. /en/de)
function googleActive() {
  return /(^|;\s*)googtrans=\/en\/(?!en\b)/.test(document.cookie);
}

// Turn Google translation off (delete its cookie on every domain form it may use)
function clearGoogle() {
  const gone = "=; path=/; max-age=0";
  document.cookie = `googtrans${gone}`;
  document.cookie = `googtrans${gone}; domain=${location.hostname}`;
  document.cookie = `googtrans${gone}; domain=.${location.hostname}`;
}

// Safety patch: Google swaps page text behind React's back, which can crash React.
// These two tweaks make React ignore nodes Google has already moved.
function patchDomForGoogle() {
  if (window.__goatDomPatched) return;                    // only once
  window.__goatDomPatched = true;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;          // Google moved it: nothing to remove
    return removeChild.call(this, child);
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) return node;      // Google moved the reference node
    return insertBefore.call(this, node, ref);
  };
}

// Load Google's translator script once and draw its picker into the box with this id
function loadGoogle(targetId) {
  patchDomForGoogle();
  window.googleTranslateInit = () => {
    const box = document.getElementById(targetId);
    if (!box || box.childElementCount) return;            // missing, or already drawn
    new window.google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, targetId);
  };
  if (window.google?.translate?.TranslateElement) {
    window.googleTranslateInit();                         // script already here: just draw
    return;
  }
  if (document.getElementById("goat-gt-script")) return;  // already loading
  const s = document.createElement("script");
  s.id = "goat-gt-script";
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateInit";
  s.async = true;
  document.body.appendChild(s);
}

export default function LanguageSwitcher() {
  const gtId = "goat-gt-" + useId().replace(/[^a-zA-Z0-9_-]/g, ""); // NEW: unique, CSS-safe id for this copy
  const lang = useLang();                                 // current language code
  const t = useT();
  const [open, setOpen] = useState(false);                // menu open?
  const [showGoogle, setShowGoogle] = useState(false);    // Google picker visible?
  const box = useRef(null);                               // the whole switcher (for outside taps)

  useEffect(() => {
    document.documentElement.lang = lang;                 // keep <html lang> in sync
  }, [lang]);

  useEffect(() => {
    if (googleActive()) {                                 // came back with Google on: reload it
      setShowGoogle(true);
      loadGoogle(gtId);
    }
  }, [gtId]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false); // tap outside closes
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // pick one of OUR languages
  function pick(code) {
    setOpen(false);
    if (googleActive()) {                                 // Google was translating: switch it off cleanly
      clearGoogle();
      setLang(code);
      window.location.reload();                           // reload to remove Google's changes
      return;
    }
    setLang(code);                                        // instant switch, no reload
  }

  // "More languages (Google)"
  function more() {
    setLang("en");                                        // Google translates from English
    setShowGoogle(true);
    loadGoogle(gtId);
  }

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div ref={box} className="relative">
      {/* hide Google's top banner (and the gap it adds); style its picker to match ours */}
      <style>{`body>.skiptranslate{display:none!important}body{top:0!important}#${gtId} select{width:100%;border-radius:.75rem;padding:.5rem;border:1px solid var(--color-line);background:var(--color-mist);color:var(--color-ink)}#${gtId} .goog-te-gadget{font-size:0;color:transparent}#${gtId} .goog-te-gadget>span{display:none}`}</style>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.label")}
        aria-expanded={open}
        className="flex h-10 items-center gap-1 rounded-full px-2 text-stone hover:text-ink"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        <span className="text-xs font-semibold uppercase">{current.code}</span>
      </button>

      {/* the menu stays in the page (just hidden) so Google's picker isn't destroyed */}
      <div className={`absolute right-0 top-12 z-50 w-60 rounded-2xl border border-line bg-water p-2 shadow-xl ${open ? "" : "hidden"}`}>
        <p className="px-3 py-1 text-xs text-stone">{t("lang.label")}</p>
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => pick(l.code)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-sage ${l.code === lang ? "font-semibold text-forest" : "text-ink"}`}
          >
            <span className="notranslate" translate="no">{l.name}</span> {/* Google must not translate these */}
            {l.code === lang && <span>✓</span>}
          </button>
        ))}
        <div className="mt-1 border-t border-line pt-2">
          {!showGoogle && (
            <button onClick={more} className="w-full rounded-xl px-3 py-2 text-left text-sm text-stone hover:bg-sage">
              🌐 {t("lang.more")}
            </button>
          )}
          <div id={gtId} className={showGoogle ? "px-1 pb-1" : "hidden"} />
          {showGoogle && <p className="px-3 pt-1 text-[11px] text-stone">{t("lang.moreHint")}</p>}
        </div>
      </div>
    </div>
  );
}