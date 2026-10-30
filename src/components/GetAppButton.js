// src/components/GetAppButton.js
// A round phone-with-arrow icon in the top bar that links to /download.
// Hidden inside the installed app (no point offering the app to someone already using it).
"use client"; // needs the browser to know how GOAT is being viewed

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GetAppButton() {
  const [show, setShow] = useState(false);              // hidden until we've checked (avoids a flash inside the app)

  useEffect(() => {
    const installed = document.documentElement.classList.contains("is-app"); // CHANGED: the same "am I the app?" answer layout.js decided
    setShow(!installed);                                  // only show in a normal browser
  }, []);                                                 // [] = check once, when the page loads

  if (!show) return null;                                 // inside the app (or still checking): show nothing

  return (
    <Link
      href="/download"
      aria-label="Get the GOAT app"                       // what screen readers say (the icon has no words)
      title="Get the GOAT app"                            // tooltip on laptops
      className="flex h-10 w-10 items-center justify-center rounded-full text-stone hover:bg-mist hover:text-ink"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="2" width="12" height="20" rx="2.5" /> {/* the phone */}
        <path d="M12 7v7" />                              {/* the arrow's line */}
        <path d="m9 11 3 3 3-3" />                        {/* the arrow's head, pointing down = download */}
      </svg>
    </Link>
  );
}