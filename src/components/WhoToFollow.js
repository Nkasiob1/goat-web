"use client"; // needs the logged-in user and click handlers

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // to send logged-out users to /login
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser"; // undefined = checking, null = logged out, object = user
import Avatar from "./Avatar";

export default function WhoToFollow() {
  const user = useUser();
  const router = useRouter();
  const [people, setPeople] = useState([]); // suggested profiles
  const [followed, setFollowed] = useState({}); // { userId: true } for ones followed from this card

  useEffect(() => {
    if (user === undefined) return; // wait until we know who's looking
    let active = true;

    async function load() {
      // 1. the last 200 top-level posts tell us who's active
      const { data: posts } = await supabase
        .from("posts")
        .select("user_id")
        .is("parent_id", null) // ignore replies
        .order("created_at", { ascending: false })
        .limit(200);

      // 2. never suggest yourself or people you already follow
      const skip = new Set();
      if (user) {
        skip.add(user.id);
        const { data: f } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        f?.forEach((r) => skip.add(r.following_id));
      }

      // 3. count posts per person and keep the top 3
      const counts = {};
      posts?.forEach((p) => {
        if (!skip.has(p.user_id)) counts[p.user_id] = (counts[p.user_id] || 0) + 1;
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // most posts first
        .slice(0, 3)
        .map(([id]) => id);

      if (!top.length) {
        if (active) setPeople([]);
        return;
      }

      // 4. fetch their names and photos
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", top);

      const ordered = top
        .map((id) => profiles?.find((p) => p.id === id)) // keep the ranking order
        .filter((p) => p?.username); // skip anyone without a username yet
      if (active) setPeople(ordered.map((p) => ({ ...p, posts: counts[p.id] })));
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  async function toggle(id) {
    if (!user) return router.push("/login"); // must be logged in to follow
    const now = !followed[id]; // the state we're switching to
    setFollowed((f) => ({ ...f, [id]: now })); // optimistic: flip instantly

    const { error } = now
      ? await supabase.from("follows").insert({ follower_id: user.id, following_id: id })
      : await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);

    if (error) setFollowed((f) => ({ ...f, [id]: !now })); // database said no, so undo
  }

  if (!people.length) return null; // no suggestions, so no empty box

  return (
    <div className="rounded-2xl border border-line bg-water p-4">
      <h3 className="mb-3 text-sm font-semibold text-ink">Who to follow</h3>
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <Link href={`/u/${p.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={p.username} src={p.avatar_url} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">@{p.username}</span>
                <span className="block text-xs text-stone">{p.posts} recent posts</span>
              </span>
            </Link>
            <button
              onClick={() => toggle(p.id)}
              className={
                followed[p.id]
                  ? "rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-loss hover:text-loss"
                  : "rounded-full bg-forest px-3 py-1 text-xs font-medium text-water hover:bg-moss"
              }
            >
              {followed[p.id] ? "Following" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}