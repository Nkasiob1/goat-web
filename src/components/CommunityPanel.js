"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useProfile } from "../lib/useProfile";            // the shared "who am I" hook
import TimeAgo from "./TimeAgo";
import Avatar from "./Avatar";

export default function CommunityPanel() {               // no props needed now: useProfile knows who's logged in
  const { profile: me } = useProfile();                  // my profile; undefined = loading, null = no username yet
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [followers, setFollowers] = useState([]);        // people who follow me, newest first
  const [following, setFollowing] = useState([]);        // people I follow
  const [view, setView] = useState("followers");         // which list is showing

  useEffect(() => {                                      // once I have a profile, load counts and lists
    if (!me) return;

    Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", me.id), // follower count
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", me.id),  // following count
      supabase
        .from("follows")
        .select("created_at, profiles!follows_follower_id_fkey(username, avatar_url)")   // WHO followed me
        .eq("following_id", me.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("follows")
        .select("created_at, profiles!follows_following_id_fkey(username, avatar_url)")  // WHO I follow
        .eq("follower_id", me.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([fc, gc, fl, gl]) => {
      setCounts({ followers: fc.count ?? 0, following: gc.count ?? 0 });
      setFollowers(fl.data ?? []);
      setFollowing(gl.data ?? []);
    });
  }, [me?.id]);                                          // reload only if it's a different person, not on every photo change

  if (me === undefined) {
    return <div className="h-48 animate-pulse rounded-3xl bg-mist"></div>; // skeleton while loading
  }

  if (me === null) {                                     // no username yet: the dashboard's setup card handles it
    return (
      <div className="rounded-3xl border border-line bg-water p-6">
        <p className="font-semibold text-ink">Your community</p>
        <p className="mt-2 text-sm text-stone">Set up your username above to post, follow traders and get followers.</p>
      </div>
    );
  }

  const list = view === "followers" ? followers : following;

  return (
    <div className="rounded-3xl border border-line bg-water p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">Your community</p>
        <Link href="/community" className="text-sm text-moss hover:text-forest">Open feed →</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">          {/* the two counts double as tab buttons */}
        {[
          { id: "followers", label: "Followers", n: counts.followers },
          { id: "following", label: "Following", n: counts.following },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`rounded-2xl p-3 text-left transition ${view === t.id ? "bg-sage" : "bg-mist hover:bg-sage"}`}
          >
            <p className="text-xl font-semibold text-ink">{t.n}</p>
            <p className="text-xs text-stone">{t.label}</p>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-5 text-sm text-stone">
          {view === "followers"
            ? "No followers yet. Post in the community to get noticed."
            : "You're not following anyone yet. Tap a username in the community to follow them."}
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-line">
          {list.map((row) => {
            const name = row.profiles?.username;         // the joined username
            return (
              <li key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/u/${name}`} className="flex min-w-0 items-center gap-3 font-medium text-ink hover:text-moss">
                  <Avatar name={name ?? "?"} src={row.profiles?.avatar_url} size="sm" /> {/* their photo, or their initial */}
                  <span className="truncate">@{name}</span> {/* truncate: long names end in "…" instead of breaking the row */}
                </Link>
                <span className="shrink-0 text-xs text-stone">
                  {view === "followers" ? "followed you " : "followed "}
                  <TimeAgo date={row.created_at} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}