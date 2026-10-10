"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../lib/useProfile";
import WatchlistPanel from "./WatchlistPanel";
import CommunityPanel from "./CommunityPanel";
import AvatarUploader from "./AvatarUploader";
import UsernameSetup from "./UsernameSetup";

export default function DashboardView() {
  const router = useRouter();
  const { user, profile } = useProfile();

  useEffect(() => {
    if (user === null) router.replace("/login");         // definitely logged out: go to login
  }, [user, router]);

  if (!user || profile === undefined) return <p className="text-stone">Loading…</p>;

  return (
    <div>
      <p className="text-sm font-medium text-moss">Dashboard</p>

      {profile ? (                                       // has a profile: show it with the photo uploader
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-line bg-water p-6">
          <AvatarUploader profile={profile} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">@{profile.username}</h1>
            <p className="mt-1 text-sm text-stone">{user.email}</p>    {/* only you see your email, here */}
          </div>
          <Link href={`/u/${profile.username}`} className="text-sm font-medium text-moss hover:text-forest">
            View public profile →
          </Link>
        </div>
      ) : (                                              // no profile yet: set one up right here
        <div className="mt-4">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-ink">Welcome to GOAT</h1>
          <UsernameSetup />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WatchlistPanel />
        </div>
        <div className="space-y-6">
          <CommunityPanel user={user} />
          <div className="rounded-3xl border border-line bg-water p-6">
            <span className="rounded-full bg-sage px-3 py-1 text-xs text-moss">Waitlist</span>
            <p className="mt-4 font-semibold text-ink">GOAT bot access</p>
            <p className="mt-1 text-sm text-stone">Connect your broker and let GOAT trade within your risk settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}