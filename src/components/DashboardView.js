"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import WatchlistPanel from "./WatchlistPanel";
import CommunityPanel from "./CommunityPanel";             // NEW: your followers and following

export default function DashboardView() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");       // no session: send to login
      else setUser(data.session.user);
    });
  }, [router]);

  if (!user) return <p className="text-stone">Loading…</p>;

  return (
    <div>
      <p className="text-sm font-medium text-moss">Dashboard</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">Welcome to GOAT</h1>
      <p className="mt-2 text-stone">Signed in as {user.email}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">                  {/* watchlist: two-thirds of the width on laptops */}
          <WatchlistPanel />
        </div>

        <div className="space-y-6">                      {/* right column */}
          <CommunityPanel user={user} />                 {/* replaces the old "Community: coming soon" card */}

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