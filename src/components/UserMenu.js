"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useProfile } from "../lib/useProfile";
import Avatar from "./Avatar";

export default function UserMenu() {
  const router = useRouter();
  const { user, profile } = useProfile();

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
          href={profile ? `/u/${profile.username}` : "/dashboard"} // with a profile: your page; without: set it up on the dashboard
          aria-label="Your profile"
          className="rounded-full ring-2 ring-transparent transition hover:ring-sage"
        >
          <Avatar name={profile?.username ?? user.email} src={profile?.avatar_url} size="sm" />
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