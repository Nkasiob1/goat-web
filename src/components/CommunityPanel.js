"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import TimeAgo from "./TimeAgo";

export default function CommunityPanel({ user }) {       // user is passed in from the dashboard (already logged in)
  const [me, setMe] = useState(undefined);               // my profile; undefined = loading, null = no username yet
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [followers, setFollowers] = useState([]);        // people who follow me, newest first
  const [following, setFollowing] = useState([]);        // people I follow
  const [view, setView] = useState("followers");         // which list is showing

  useEffect(() => {                                      // step 1: find my username
    supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMe(data));
  }, [user]);

  useEffect(() => {                                      // step 2: once I have a profile, load counts and lists
    if (!me) return;

    Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", me.id), // follower count
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", me.id),  // following count
      supabase
        .from("follows")
        .select("created_at, profiles!follows_follower_id_fkey(username)")   // WHO followed me (via the follower link)
        .eq("following_id", me.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("follows")
        .select("created_at, profiles!follows_following_id_fkey(username)")  // WHO I follow (via the following link)
        .eq("follower_id", me.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([fc, gc, fl, gl]) => {
      setCounts({ followers: fc.count ?? 0, following: gc.count ?? 0 });
      setFollowers(fl.data ?? []);
      setFollowing(gl.data ?? []);
    });
  }, [me]);

  if (me === undefined) {
    return <div className="h-48 animate-pulse rounded-3xl bg-mist"></div>; // skeleton while loading
  }

  if (me === null) {                                     // signed up but never picked a username
    return (
      <div className="rounded-3xl border border-line bg-water p-6">
        <p className="font-semibold text-ink">Your community</p>
        <p className="mt-2 text-sm text-stone">Choose a username to post, follow traders and get followers.</p>
        <Link href="/community" className="mt-4 inline-block text-sm font-medium text-moss hover:text-forest">
          Join the community →
        </Link>
      </div>
    );
  }

  const list = view === "followers" ? followers : following;

  return (
    <div className="rounded-3xl border border-line bg-water p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">Your community</p>
        <Link href={`/u/${me.username}`} className="text-sm text-moss hover:text-forest">View profile →</Link>
      </div>
      <p className="mt-1 text-sm text-stone">@{me.username}</p>

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
              <li key={name} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/u/${name}`} className="flex items-center gap-3 font-medium text-ink hover:text-moss">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-semibold text-water">
                    {name?.[0]?.toUpperCase()}           {/* tiny avatar: first letter */}
                  </span>
                  @{name}
                </Link>
                <span className="text-xs text-stone">
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