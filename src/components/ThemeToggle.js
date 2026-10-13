"use client"; // needs clicks and browser storage

import { useEffect, useState } from "react";

const KEY = "goat-theme"; // where the choice is saved in the browser

export default function ThemeToggle() {
  const [dark, setDark] = useState(null); // null = not known yet (server can't see the browser), so show nothing

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark")); // read what the no-flash script decided

    const media = window.matchMedia("(prefers-color-scheme: dark)"); // the phone/computer setting
    function onSystemChange(e) {
      let saved = null;
      try { saved = localStorage.getItem(KEY); } catch {}            // storage can be blocked in private mode
      if (saved) return;                                             // the user picked one: respect it
      document.documentElement.classList.toggle("dark", e.matches);  // otherwise follow the system live
      setDark(e.matches);
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange); // tidy up when the navbar unmounts
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);        // switch every colour at once
    try { localStorage.setItem(KEY, next ? "dark" : "light"); } catch {} // remember for next visit
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 place-items-center rounded-full text-stone transition hover:bg-mist hover:text-ink"
    >
      {dark === null ? (
        <span className="h-5 w-5" />                                  // same size placeholder: no layout jump
      ) : dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />                            {/* sun: tap to go light */}
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /> {/* moon: tap to go dark */}
        </svg>
      )}
    </button>
  );
}