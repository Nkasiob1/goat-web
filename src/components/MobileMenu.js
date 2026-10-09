"use client";                                            // it opens and closes on tap, so it runs in the browser

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu({ links }) {          // links is a prop: the same list the desktop navbar uses
  const [open, setOpen] = useState(false);               // memory: is the menu open? starts closed

  return (
    <div className="md:hidden">                          {/* phones only; laptops use the normal links */}
      <button
        onClick={() => setOpen(!open)}                   // tap flips it: closed → open, open → closed
        aria-label={open ? "Close menu" : "Open menu"}   // read aloud by screen readers, since the button has no words
        aria-expanded={open}                             // tells screen readers whether the menu is showing
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-ink">
          {open ? (
            <path d="M4 4l10 10M14 4L4 14" />            // an X when open
          ) : (
            <path d="M2 5h14M2 9h14M2 13h14" />          // three lines when closed
          )}
        </svg>
      </button>

      {open && (                                         // only draw the panel when open
        <nav className="absolute inset-x-0 top-full z-50 border-b border-line bg-water px-6 py-4 shadow-sm">
          {/* absolute + top-full = drop down directly under the navbar, full width; z-50 keeps it above the page */}
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}         // close the menu after choosing a page
                  className="block rounded-xl px-3 py-3 text-ink hover:bg-mist" // block + py-3 = big, easy-to-tap rows
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-line pt-2">
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-ink hover:bg-mist">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}