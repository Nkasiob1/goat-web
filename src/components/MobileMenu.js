"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";

export default function MobileMenu({ links }) {
  const router = useRouter();
  const user = useUser();                                // is someone logged in?
  const [open, setOpen] = useState(false);

  async function logOut() {
    setOpen(false);                                      // close the menu first
    await supabase.auth.signOut();
    router.push("/");
  }

  const rowClass = "block w-full rounded-xl px-3 py-3 text-left text-ink hover:bg-mist"; // one style for every row

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-ink">
          {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
        </svg>
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full z-50 border-b border-line bg-water px-6 py-4 shadow-sm">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={rowClass}>{l.label}</Link>
              </li>
            ))}

            <li className="border-t border-line pt-2">
              {user ? (                                  // logged in: Dashboard + Log out
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className={rowClass}>Dashboard</Link>
                  <button onClick={logOut} className={`${rowClass} text-stone`}>Log out</button>
                </>
              ) : (                                      // logged out: Log in
                <Link href="/login" onClick={() => setOpen(false)} className={rowClass}>Log in</Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}