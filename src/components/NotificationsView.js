"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { markAllRead } from "../lib/notifications";
import Avatar from "./Avatar";
import TimeAgo from "./TimeAgo";

const TYPES = { // wording, icon and colour for each kind
  like: {
    text: "liked your post",
    cls: "bg-[#F6E9E7] text-loss",
    icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  },
  reply: {
    text: "replied to your post",
    cls: "bg-sage text-moss",
    icon: <path d="M4 5h16v11H8l-4 4V5z" />,
  },
  follow: {
    text: "followed you",
    cls: "bg-sage text-forest",
    icon: <path d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />,
  },
};

export default function NotificationsView() {
  const user = useUser();
  const [items, setItems] = useState(null); // null = loading

  async function load() {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, post_id, is_read, created_at, actor:profiles!notifications_actor_id_fkey(username, avatar_url), post:posts(body)")
      // actor:... = join the person who did it (we name the FK because the table links to profiles twice)
      // post:...  = join the post text for a preview line
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error(error);
    setItems(data ?? []);
    markAllRead(user.id); // opening this page = everything read, and the bell resets
  }

  useEffect(() => {
    if (!user) return;
    load();

    const channel = supabase // new notifications slide in while you're on the page
      .channel(`notifs-page-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (user === undefined) return <Skeleton />; // still checking login
  if (user === null) {                         // logged out
    return (
      <div className="rounded-3xl border border-line bg-water p-10 text-center">
        <p className="font-semibold text-ink">Log in to see your notifications</p>
        <Link href="/login" className="mt-5 inline-block rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss">Log in</Link>
      </div>
    );
  }
  if (items === null) return <Skeleton />;

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-water">
      <div className="border-b border-line px-5 py-4">
        <h1 className="text-lg font-semibold text-ink">Notifications</h1>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-stone">
          Nothing yet. When people like, reply to or follow you, you'll see it here.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((n) => {
            const t = TYPES[n.type];
            const href = n.type === "follow" ? `/u/${n.actor?.username}` : `/post/${n.post_id}`; // follows open the profile, others open the post
            return (
              <li key={n.id}>
                <Link href={href} className={`flex gap-3 px-5 py-4 transition hover:bg-mist/60 ${n.is_read ? "" : "bg-sage/40"}`}> {/* unread = soft green tint */}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.cls}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {t.icon}
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <Avatar name={n.actor?.username ?? "?"} src={n.actor?.avatar_url} size="sm" />
                    <p className="mt-2 text-sm text-ink">
                      <span className="font-semibold">@{n.actor?.username}</span> {t.text}
                      <span className="text-stone"> · <TimeAgo date={n.created_at} /></span>
                    </p>
                    {n.post?.body && (
                      <p className="mt-1 line-clamp-2 text-sm text-stone">{n.post.body}</p> // 2-line preview of the post
                    )}
                  </div>
                  {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forest" aria-label="Unread"></span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Skeleton() { // grey placeholder while loading
  return <div className="h-64 animate-pulse rounded-3xl border border-line bg-mist"></div>;
}