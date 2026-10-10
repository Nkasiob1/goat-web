"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useProfile, announceProfileChange } from "../lib/useProfile";
import { removePostImage } from "../lib/images";
import { useLivePrices } from "../lib/useLivePrices";
import { COMMUNITY_RULES } from "../lib/moderation";      // CHANGED: one shared rules list
import PostCard from "./PostCard";
import Composer from "./Composer";
import SentimentBar from "./SentimentBar";
import LiveCoinPrices from "./LiveCoinPrices";
import WhoToFollow from "./WhoToFollow";
import TrendingStrip from "./TrendingStrip";

export default function CommunityFeed() {
  const router = useRouter();
  const params = useSearchParams();
  const paramCoin = params.get("coin")?.toUpperCase() ?? null;
  const { user, profile } = useProfile();
  const [posts, setPosts] = useState(null);
  const [myLikes, setMyLikes] = useState(new Set());
  const [coinFilter, setCoinFilter] = useState(paramCoin);
  const [newCount, setNewCount] = useState(0);
  const [trending, setTrending] = useState([]);
  const [tab, setTab] = useState("latest");
  const [followingIds, setFollowingIds] = useState([]);
  const quotes = useLivePrices(trending.map((t) => t.coin));

  useEffect(() => { setCoinFilter(paramCoin); }, [paramCoin]);

  async function loadPosts() {
    let query = supabase
      .from("post_feed").select("*")
      .is("parent_id", null)
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

  async function loadTrending() {
    const { data } = await supabase
      .from("coin_sentiment").select("*")
      .order("total", { ascending: false })
      .limit(8);
    setTrending(data ?? []);
  }

  useEffect(() => { loadPosts(); }, [coinFilter, user, tab]);
  useEffect(() => { loadTrending(); }, []);

  useEffect(() => {
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
    const target = posts?.find((p) => p.id === id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { console.error(error); return loadPosts(); }
    removePostImage(target?.image_url);
  }

  function pickCoin(coin) {
    router.replace(coinFilter === coin ? "/community" : `/community?coin=${coin}`);
  }

  const canPost = Boolean(user && profile);
  const suggestAt = posts ? Math.min(4, posts.length - 1) : -1;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
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
              userId={user.id}
              username={profile.username}
              avatarUrl={profile.avatar_url}
              onPosted={() => { loadPosts(); loadTrending(); }}
            />
          )}

          <TrendingStrip
            trending={trending}
            quotes={quotes}
            rules={COMMUNITY_RULES}
            activeCoin={coinFilter}
            onPick={pickCoin}
          />

          {user && (
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
            {(posts ?? []).map((p, i) => (
              <Fragment key={p.id}>
                <PostCard
                  post={p}
                  liked={myLikes.has(p.id)}
                  onLike={toggleLike}
                  onDelete={removePost}
                  user={user}
                  canPost={canPost}
                />
                {i === suggestAt && (
                  <li className="bg-mist/50 p-4 lg:hidden">
                    <WhoToFollow />
                  </li>
                )}
              </Fragment>
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

      <aside className="hidden space-y-6 lg:sticky lg:top-6 lg:block lg:self-start">
        <div className="rounded-3xl border border-line bg-water p-5">
          <p className="font-semibold text-ink">Trending today</p>
          {trending.length === 0 ? (
            <p className="mt-3 text-sm text-stone">Tag a coin like $BTC in your post to start a trend.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {trending.map((t) => (
                <li key={t.coin}>
                  <button
                    onClick={() => pickCoin(t.coin)}
                    className={`w-full rounded-xl px-3 py-2 text-left hover:bg-mist ${coinFilter === t.coin ? "bg-sage" : ""}`}
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

        {trending.length > 0 && (
          <div className="rounded-3xl border border-line bg-water p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Live prices</p>
              <span className="flex items-center gap-1.5 text-xs text-stone">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain"></span>
                Live
              </span>
            </div>
            <div className="mt-2">
              <LiveCoinPrices coins={trending.map((t) => t.coin)} quotes={quotes} />
            </div>
          </div>
        )}

        <WhoToFollow />

        <div className="rounded-3xl border border-line bg-water p-5">
          <p className="font-semibold text-ink">Community rules</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            {COMMUNITY_RULES.map((r) => <li key={r}>✓ {r}</li>)}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function UsernameForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("profiles").insert({ username: username.trim() });
    if (!error) return announceProfileChange();
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