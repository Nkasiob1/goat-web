"use client";

import Link from "next/link";
import { useIsAdmin } from "../lib/useIsAdmin";

export default function AdminLink() {
  const { isAdmin, pending } = useIsAdmin();
  if (!isAdmin) return null; // invisible to everyone except admins

  return (
    <Link
      href="/admin"
      aria-label={pending ? `Moderation: ${pending} to review` : "Moderation"}
      className="relative hidden rounded-full p-2 text-ink transition hover:bg-mist md:block" // laptop only (phones use the menu row)
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /> {/* shield */}
        <path d="M9 12l2 2 4-4" />                                       {/* tick */}
      </svg>
      {pending > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-semibold text-water">
          {pending > 9 ? "9+" : pending} {/* green, so it doesn't look like the red notification badge */}
        </span>
      )}
    </Link>
  );
}