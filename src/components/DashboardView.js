"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import WatchlistPanel from "./WatchlistPanel";

export default function DashboardView() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setUser(data.session.user);
    });
  }, [router]);

  if (!user) return <p className="text-stone">Loading…</p>;

  const cards = [                                        // what's still coming
    { title: "GOAT bot access", text: "Connect your broker and let GOAT trade within your risk settings.", tag: "Waitlist" },
    { title: "Community", text: "Discuss markets and new listings with other members.", tag: "Coming soon" },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-moss">Dashboard</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">Welcome to GOAT</h1>
      <p className="mt-2 text-stone">Signed in as {user.email}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">                  {/* the watchlist takes two-thirds of the width on laptops */}
          <WatchlistPanel />
        </div>
        <div className="space-y-6">
          {cards.map((c) => (
            <div key={c.title} className="rounded-3xl border border-line bg-water p-6">
              <span className="rounded-full bg-sage px-3 py-1 text-xs text-moss">{c.tag}</span>
              <p className="mt-4 font-semibold text-ink">{c.title}</p>
              <p className="mt-1 text-sm text-stone">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}