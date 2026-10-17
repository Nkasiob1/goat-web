"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useProfile } from "../lib/useProfile";
import { useIsAdmin } from "../lib/useIsAdmin";
import Avatar from "./Avatar";
import LanguageSwitcher from "./LanguageSwitcher";       // NEW: 🌐 inside the phone menu
import { useLang, useT } from "../lib/i18n/useLang";     // NEW: current language + t()
import { MENU } from "../lib/i18n/menu";                 // NEW: this menu's own words

export default function MobileMenu({ links }) {
  const router = useRouter();
  const { user, profile } = useProfile();
  const { isAdmin, pending } = useIsAdmin();               // only true for admins
  const [open, setOpen] = useState(false);
  const lang = useLang();                                  // NEW: "en", "fr", ...
  const t = useT();                                        // NEW: main dictionary (for "Language")
  const m = (key) => MENU[lang]?.[key] ?? MENU.en[key];    // NEW: menu words, English if missing

  async function logOut() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  }

  const rowClass = "block w-full rounded-xl px-3 py-3 text-left text-ink hover:bg-mist";

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? m("close") : m("open")}         // NEW: translated for screen readers
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-ink">
          {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
        </svg>
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full z-50 border-b border-line bg-water px-6 py-4 shadow-sm">
          {user && profile && (
            <Link
              href={`/u/${profile.username}`}
              onClick={() => setOpen(false)}
              className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-mist"
            >
              <Avatar name={profile.username} src={profile.avatar_url} />
              <span>
                <span className="block font-semibold text-ink">@{profile.username}</span>
                <span className="block text-xs text-stone">{m("profile")}</span>
              </span>
            </Link>
          )}

          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={rowClass}>{l.label}</Link> {/* labels are <T>: already translated */}
              </li>
            ))}

            {/* NEW: language row. The switcher's own dropdown opens from the 🌐 button */}
            <li className="flex items-center justify-between rounded-xl border-t border-line px-3 pt-3">
              <span className="text-ink">{t("lang.label")}</span>
              <LanguageSwitcher />
            </li>

            <li className="border-t border-line pt-2">
              {user ? (
                <>
                  <Link href="/notifications" onClick={() => setOpen(false)} className={rowClass}>{m("notifications")}</Link>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className={rowClass}>{m("dashboard")}</Link>
                  {isAdmin && (                              // admins only
                    <Link href="/admin" onClick={() => setOpen(false)} className={`${rowClass} flex items-center justify-between`}>
                      {m("moderation")}
                      {pending > 0 && (
                        <span className="rounded-full bg-forest px-2 py-0.5 text-xs font-semibold text-water">{pending}</span>
                      )}
                    </Link>
                  )}
                  <button onClick={logOut} className={`${rowClass} text-stone`}>{m("logout")}</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className={rowClass}>{m("login")}</Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}