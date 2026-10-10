"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useProfile, announceProfileChange } from "../lib/useProfile"; // who I am + my username and photo
import { removePostImage } from "../lib/images";         // NEW: clean up a deleted post's image
import PostCard from "./PostCard";
import Composer from "./Composer";                       // NEW: the composer now lives in its own file
import SentimentBar from "./SentimentBar";
import LiveCoinPrices from "./LiveCoinPrices";
import WhoToFollow from "./WhoToFollow";

const RULES = [
  "Be respectful. Debate ideas, not people.",
  "No links, promotions or “DM me” offers.",
  "No guaranteed-profit claims. Nothing here is financial advice.",
];

export default function CommunityFeed() {
  const router = useRouter();
  const params = useSearchParams();
  const paramCoin = params.get("coin")?.toUpperCase() ?? null; // /community?coin=BTC → "BTC"
  const { user, profile } = useProfile();
  const [posts, setPosts] = useState(null);
  const [myLikes, setMyLikes] = useState(new Set());
  const [coinFilter, setCoinFilter] = useState(paramCoin);
  const [newCount, setNewCount] = useState(0);
  const [trending, setTrending] = useState([]);
  const [tab, setTab] = useState("latest");
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => { setCoinFilter(paramCoin); }, [paramCoin]); // tapping a $TAG anywhere updates the filter

  async function loadPosts() {
    let query = supabase
      .from("post_feed").select("*")
      .is("parent_id", null)                              // top-level posts only
      .order("created_at", { ascending: false })
      .limit(50);
    if (coinFilter) query = query.eq("coin", coinFilter);

    if (tab === "following") {
      if (!user) { setPosts([]); return; }
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (f ?? []).map((row) => row.following_id);
      setFollowingIds(ids);
      if (ids.length === 0) { setPosts([]); setNewCount(0); return; }
      query = query.in("user_id", ids);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    const list = data ?? [];

    let liked = new Set();
    if (user && list.length) {
      const { data: likes } = await supabase
        .from("likes").select("post_id")
        .eq("user_id", user.id)
        .in("post_id", list.map((p) => p.id));
      liked = new Set((likes ?? []).map((l) => l.post_id));
    }

    setMyLikes(liked);
    setPosts(list);
    setNewCount(0);
  }

  async function loadTrending() {                        // busiest coins in 24h
    const { data } = await supabase
      .from("coin_sentiment").select("*")
      .order("total", { ascending: false })
      .limit(8);
    setTrending(data ?? []);
  }

  useEffect(() => { loadPosts(); }, [coinFilter, user, tab]);
  useEffect(() => { loadTrending(); }, []);

  useEffect(() => {                                      // realtime "new posts" counter
    const channel = supabase
      .channel("community-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const p = payload.new;
        if (p.parent_id !== null || p.user_id === user?.id) return;
        if (tab === "following" && !followingIds.includes(p.user_id)) return;
        if (coinFilter && p.coin !== coinFilter) return;
        setNewCount((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, tab, followingIds, coinFilter]);

  async function toggleLike(id) {
    if (user === null) return router.push("/login");
    if (!user || !profile) return;
    const has = myLikes.has(id);
    setMyLikes((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next; });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, like_count: p.like_count + (has ? -1 : 1) } : p)));
    const { error } = has
      ? await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id)
      : await supabase.from("likes").insert({ post_id: id });
    if (error) { console.error(error); loadPosts(); }
  }

  async function removePost(id) {
    const target = posts?.find((p) => p.id === id);      // NEW: remember it so we know its image
    setPosts((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { console.error(error); return loadPosts(); }
    removePostImage(target?.image_url);                  // NEW: post gone, so delete its image file too
  }

  const canPost = Boolean(user && profile);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* the whole feed lives in one bordered column, like X */}
        <div className="overflow-hidden rounded-3xl border border-line bg-water">
          {user === null && (
            <div className="border-b border-line p-5">
              <p className="font-semibold text-ink">Join the conversation</p>
              <p className="mt-1 text-sm text-stone">
                <Link href="/login" className="font-medium text-moss hover:text-forest">Log in</Link> or{" "}
                <Link href="/signup" className="font-medium text-moss hover:text-forest">create an account</Link> to post, like, reply and follow.
              </p>
            </div>
          )}
          {user && profile === null && <UsernameForm />}
          {canPost && (
            <Composer
              userId={user.id}                          // NEW: needed for the image folder
              username={profile.username}
              avatarUrl={profile.avatar_url}
              onPosted={() => { loadPosts(); loadTrending(); }}
            />
          )}

          {user && (                                     // X-style tabs with an underline
            <div className="flex border-b border-line">
              {[{ id: "latest", label: "Latest" }, { id: "following", label: "Following" }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex-1 py-3 text-sm transition hover:bg-mist ${tab === t.id ? "font-semibold text-ink" : "text-stone"}`}
                >
                  {t.label}
                  {tab === t.id && <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-12 rounded-full bg-forest"></span>}
                </button>
              ))}
            </div>
          )}

          {coinFilter && (
            <div className="flex items-center gap-3 border-b border-line px-5 py-3 text-sm">
              <span className="text-stone">Posts about</span>
              <span className="rounded-full bg-sage px-3 py-1 font-mono text-moss">{"$" + coinFilter}</span>
              <Link href={`/markets/${coinFilter.toLowerCase()}`} className="text-moss hover:text-forest">View price</Link>
              <button onClick={() => router.replace("/community")} className="ml-auto text-stone hover:text-ink">Clear ✕</button>
            </div>
          )}

          {newCount > 0 && (
            <button onClick={loadPosts} className="w-full border-b border-line bg-sage py-3 text-sm font-medium text-moss hover:bg-mist">
              Show {newCount} new {newCount === 1 ? "post" : "posts"}
            </button>
          )}

          <ul className="divide-y divide-line">
            {(posts ?? []).map((p) => (
              <PostCard
                key={p.id}
                post={p}
                liked={myLikes.has(p.id)}
                onLike={toggleLike}
                onDelete={removePost}
                user={user}
                canPost={canPost}
              />
            ))}
          </ul>

          {posts === null && <p className="px-5 py-10 text-center text-sm text-stone">Loading posts…</p>}
          {posts?.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-stone">
              {tab === "following"
                ? "Posts from people you follow appear here. Tap any username to visit their profile and follow them."
                : coinFilter
                ? `No posts about $${coinFilter} yet. Start the conversation.`
                : "No posts yet. Be the first."}
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-3xl border border-line bg-water p-5">
          <p className="font-semibold text-ink">Trending today</p>
          {trending.length === 0 ? (
            <p className="mt-3 text-sm text-stone">Tag a coin like $BTC in your post to start a trend.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {trending.map((t) => (
                <li key={t.coin}>
                  <button
                    onClick={() => router.replace(`/community?coin=${t.coin}`)}
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-mist"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-ink">{"$" + t.coin}</span>
                      <span className="text-xs text-stone">{t.total} {t.total === 1 ? "post" : "posts"}</span>
                    </div>
                    <SentimentBar bullish={t.bullish} bearish={t.bearish} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {trending.length > 0 && (                        // live prices once something is trending
          <div className="rounded-3xl border border-line bg-water p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Live prices</p>
              <span className="flex items-center gap-1.5 text-xs text-stone">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain"></span>
                Live
              </span>
            </div>
            <div className="mt-2">
              <LiveCoinPrices coins={trending.map((t) => t.coin)} />
            </div>
          </div>
        )}

        <WhoToFollow />

        <div className="rounded-3xl border border-line bg-water p-5">
          <p className="font-semibold text-ink">Community rules</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            {RULES.map((r) => <li key={r}>✓ {r}</li>)}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function UsernameForm() {                                // shown inside the feed for members without a username yet
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("profiles").insert({ username: username.trim() });
    if (!error) return announceProfileChange();          // every useProfile() refreshes, so the composer appears
    if (error.code === "23505") setError("That username is taken.");
    else if (error.code === "23514") setError("Use 3–20 letters, numbers or underscores.");
    else { console.error(error); setError("Something went wrong. Please try again."); }
  }

  return (
    <form onSubmit={save} className="border-b border-line p-5">
      <p className="font-semibold text-ink">Choose your username</p>
      <p className="mt-1 text-sm text-stone">This is how you'll appear across GOAT. Your email stays private.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. goat_trader"
          required
          className="w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss"
        />
        <button type="submit" className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">Save</button>
      </div>
      {error && <p className="mt-3 text-sm text-loss">{error}</p>}
    </form>
  );
}