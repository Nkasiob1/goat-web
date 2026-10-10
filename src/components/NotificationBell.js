"use client"; // live count + realtime need the browser

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { NOTIFS_READ } from "../lib/notifications";

export default function NotificationBell() {
  const user = useUser();
  const [count, setCount] = useState(0); // unread notifications

  useEffect(() => {
    if (!user) return; // logged out: no bell work
    let active = true;

    async function load() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true }) // head: true = just the number, no rows (cheap)
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (active) setCount(count ?? 0);
    }
    load();

    const channel = supabase
      .channel(`bell-${Math.random().toString(36).slice(2)}`) // unique name, since the bell can appear twice (desktop + mobile menu)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, // only MY notifications
        () => setCount((c) => c + 1) // a new one arrived, so the badge goes up
      )
      .subscribe();

    const reset = () => setCount(0); // the notifications page marked everything read
    window.addEventListener(NOTIFS_READ, reset);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      window.removeEventListener(NOTIFS_READ, reset);
    };
  }, [user]);

  if (!user) return null; // no bell for visitors

  return (
    <Link
      href="/notifications"
      aria-label={count ? `${count} unread notifications` : "Notifications"}
      className="relative rounded-full p-2 text-ink transition hover:bg-mist"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /> {/* bell body */}
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />            {/* clapper */}
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-loss px-1 text-[10px] font-semibold text-water">
          {count > 9 ? "9+" : count} {/* keep the badge small */}
        </span>
      )}
    </Link>
  );
}