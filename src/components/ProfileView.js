"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import PostCard from "./PostCard";

export default function ProfileView({ username }) {
  const router = useRouter();
  const user = useUser();
  const [person, setPerson] = useState(undefined);       // the profile being viewed; undefined = loading, null = not found
  const [me, setMe] = useState(undefined);               // MY profile (needed to follow, like and reply)
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState(null);
  const [myLikes, setMyLikes] = useState(new Set());

  useEffect(() => {                                      // look up the person by username
    supabase.from("profiles").select("id, username, created_at").eq("username", username).maybeSingle()
      .then(({ data }) => setPerson(data));
  }, [username]);

  useEffect(() => {                                      // look up my own profile
    if (!user) { setMe(user === null ? null : undefined); return; }
    supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMe(data));
  }, [user]);

  async function loadStats(id) {
    const [followers, following] = await Promise.all([   // two counts at once
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id), // head: true = count only, no rows
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
    ]);
    setStats({ followers: followers.count ?? 0, following: following.count ?? 0 });
  }

  async function loadPosts(id) {
    const { data } = await supabase
      .from("post_feed").select("*")
      .eq("user_id", id).is("parent_id", null)           // their top-level posts
      .order("created_at", { ascending: false }).limit(50);
    const list = data ?? [];
    let liked = new Set();
    if (user && list.length) {
      const { data: likes } = await supabase.from("likes").select("post_id")
        .eq("user_id", user.id).in("post_id", list.map((p) => p.id));
      liked = new Set((likes ?? []).map((l) => l.post_id));
    }
    setMyLikes(liked);
    setPosts(list);
  }

  useEffect(() => {
    if (!person) return;
    loadStats(person.id);
    loadPosts(person.id);
  }, [person, user]);

  useEffect(() => {                                      // do I already follow them?
    if (!person || !user) { setIsFollowing(false); return; }
    supabase.from("follows").select("follower_id")
      .eq("follower_id", user.id).eq("following_id", person.id).maybeSingle()
      .then(({ data }) => setIsFollowing(Boolean(data)));
  }, [person, user]);

  async function toggleFollow() {
    if (user === null) return router.push("/login");     // logged out
    if (!me) return router.push("/community");           // no username yet: they pick one on the community page
    const was = isFollowing;
    setIsFollowing(!was);                                // optimistic
    setStats((s) => ({ ...s, followers: s.followers + (was ? -1 : 1) }));
    const { error } = was
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", person.id)
      : await supabase.from("follows").insert({ following_id: person.id }); // follower_id fills in automatically
    if (error) { console.error(error); setIsFollowing(was); loadStats(person.id); }
  }

  async function toggleLike(id) {                        // same logic as the main feed
    if (user === null) return router.push("/login");
    if (!user || !me) return;
    const has = myLikes.has(id);
    setMyLikes((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next; });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, like_count: p.like_count + (has ? -1 : 1) } : p)));
    const { error } = has
      ? await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id)
      : await supabase.from("likes").insert({ post_id: id });
    if (error) { console.error(error); loadPosts(person.id); }
  }

  async function removePost(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("posts").delete().eq("id", id);
  }

  if (person === undefined) return <p className="text-stone">Loading profile…</p>;
  if (person === null) return <p className="text-stone">There's no member called @{username}.</p>;

  const isMe = me?.id === person.id;
  const joined = new Date(person.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); // "October 2026"

  return (
    <div>
      <div className="rounded-3xl border border-line bg-water p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-2xl font-semibold text-water">
            {person.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">@{person.username}</h1>
            <p className="text-sm text-stone">Joined {joined}</p>
          </div>
          <div className="ml-auto">
            {isMe ? (
              <span className="rounded-full bg-mist px-4 py-2 text-sm text-stone">This is you</span>
            ) : (
              <button
                onClick={toggleFollow}
                className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                  isFollowing
                    ? "border border-line text-ink hover:border-loss hover:text-loss"  // following: quiet, red on hover = "unfollow"
                    : "bg-forest text-water hover:bg-moss"                             // not following: the strong button
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-6 text-sm">
          <p><span className="font-semibold text-ink">{stats.followers}</span> <span className="text-stone">followers</span></p>
          <p><span className="font-semibold text-ink">{stats.following}</span> <span className="text-stone">following</span></p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink">Posts</h2>
      <ul className="mt-4 space-y-4">
        {(posts ?? []).map((p) => (
          <PostCard
            key={p.id}
            post={p}
            liked={myLikes.has(p.id)}
            onLike={toggleLike}
            onDelete={removePost}
            user={user}
            canPost={Boolean(user && me)}
          />
        ))}
      </ul>
      {posts === null && <p className="mt-4 text-sm text-stone">Loading posts…</p>}
      {posts?.length === 0 && <p className="mt-4 text-sm text-stone">@{person.username} hasn't posted yet.</p>}
    </div>
  );
}