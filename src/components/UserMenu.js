"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";                // our new hook

export default function UserMenu() {
  const router = useRouter();
  const user = useUser();                                // one line replaces all the session code

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="hidden text-sm font-medium text-ink hover:text-moss md:inline">Dashboard</Link>
        <button onClick={logOut} className="hidden text-sm text-stone hover:text-ink md:inline">Log out</button>
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-semibold text-water"
          aria-label="Your dashboard"
        >
          {user.email[0].toUpperCase()}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden text-sm font-medium text-ink hover:text-moss md:inline">Log in</Link>
      <Link href="/signup" className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss">Sign up</Link>
    </div>
  );
}