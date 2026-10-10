"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { checkBody } from "../lib/postRules";
import PostCard from "./PostCard";

const fieldClass =
  "w-full rounded-xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none focus:border-moss";

const RULES = [
  "Be respectful. Debate ideas, not people.",
  "No links, promotions or “DM me” offers.",
  "No guaranteed-profit claims. Nothing here is financial advice.",
];

export default function CommunityFeed() {
  const router = useRouter();
  const user = useUser();
  const [profile, setProfile] = useState(undefined);     // undefined = checking, null = no username yet
  const [posts, setPosts] = useState(null);
  const [myLikes, setMyLikes] = useState(new Set());     // ids of posts I've liked
  const [coinFilter, setCoinFilter] = useState(null);    // e.g. "BTC" when a trending tag is tapped
  const [newCount, setNewCount] = useState(0);           // posts that arrived live since the last load
  const [trending, setTrending] = useState([]);
  const [tab, setTab] = useState("latest");              // "latest" or "following"
  const [followingIds, setFollowingIds] = useState([]);  // the people I follow

  async function loadPosts() {
    let query = supabase
      .from("post_feed")
      .select("*")
      .is("parent_id", null)                             // top-level posts only; replies live inside threads
      .order("created_at", { ascending: false })
      .limit(50);
    if (coinFilter) query = query.eq("coin", coinFilter);

    if (tab === "following") {                           // only posts by people I follow
      if (!user) { setPosts([]); return; }
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (f ?? []).map((row) => row.following_id);
      setFollowingIds(ids);
      if (ids.length === 0) { setPosts([]); setNewCount(0); return; } // following nobody yet
      query = query.in("user_id", ids);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    const list = data ?? [];

    let liked = new Set();
    if (user && list.length) {                           // which of these posts have I liked?
      const { data: likes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", list.map((p) => p.id));
      liked = new Set((likes ?? []).map((l) => l.post_id));
    }

    setMyLikes(liked);
    setPosts(list);
    setNewCount(0);
  }

  async function loadTrending() {                        // the most-tagged coins in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("posts")
      .select("coin")
      .not("coin", "is", null)
      .gte("created_at", since)
      .limit(500);
    const counts = {};
    for (const row of data ?? []) counts[row.coin] = (counts[row.coin] ?? 0) + 1;
    setTrending(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)); // [["BTC", 12], ["SOL", 7], ...]
  }

  useEffect(() => { loadPosts(); }, [coinFilter, user, tab]); // reload when the filter, login or tab changes
  useEffect(() => { loadTrending(); }, []);

  useEffect(() => {                                      // look up my username once we know who I am
    if (!user) { setProfile(user === null ? null : undefined); return; }
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  useEffect(() => {                                      // realtime: count new posts as they arrive
    const channel = supabase
      .channel("community-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const p = payload.new;
        if (p.parent_id !== null || p.user_id === user?.id) return;           // ignore replies and my own posts
        if (tab === "following" && !followingIds.includes(p.user_id)) return; // on Following, only count people I follow
        setNewCount((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };   // stop listening when leaving or switching tabs
  }, [user, tab, followingIds]);

  async function toggleLike(id) {
    if (user === null) return router.push("/login");     // logged out: go log in
    if (!user || !profile) return;                       // still loading, or no username yet

    const has = myLikes.has(id);
    setMyLikes((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next; }); // optimistic
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, like_count: p.like_count + (has ? -1 : 1) } : p)));

    const { error } = has
      ? await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id)
      : await supabase.from("likes").insert({ post_id: id });
    if (error) { console.error(error); loadPosts(); }    // failed: reload the truth
  }

  async function removePost(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { console.error(error); loadPosts(); }
  }

  const canPost = Boolean(user && profile);

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">                    {/* the feed: two-thirds of the width on laptops */}
        {user === null && (
          <div className="rounded-3xl bg-sage p-6">
            <p className="font-semibold text-ink">Join the conversation</p>
            <p className="mt-1 text-sm text-stone">
              <Link href="/login" className="font-medium text-moss hover:text-forest">Log in</Link> or{" "}
              <Link href="/signup" className="font-medium text-moss hover:text-forest">create an account</Link> to post, like, reply and follow.
            </p>
          </div>
        )}
        {user && profile === null && <UsernameForm onDone={setProfile} />}
        {canPost && <PostForm username={profile.username} onPosted={() => { loadPosts(); loadTrending(); }} />}

        {user && (                                       // tabs only make sense when logged in
          <div className="mt-6 inline-flex rounded-full bg-mist p-1">
            {["latest", "following"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition ${
                  tab === t ? "bg-water text-ink shadow-sm" : "text-stone hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {coinFilter && (
          <div className="mt-6 flex items-center gap-3 text-sm">
            <span className="text-stone">Showing posts about</span>
            <span className="rounded-full bg-sage px-3 py-1 font-mono text-moss">{coinFilter}</span>
            <button onClick={() => setCoinFilter(null)} className="text-stone hover:text-ink">Clear ✕</button>
          </div>
        )}

        {newCount > 0 && (                               // the X-style "new posts" banner
          <button
            onClick={loadPosts}
            className="mt-6 w-full rounded-full bg-forest py-3 text-sm font-medium text-water hover:bg-moss"
          >
            Show {newCount} new {newCount === 1 ? "post" : "posts"}
          </button>
        )}

        <ul className="mt-6 space-y-4">
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
        {posts === null && <p className="mt-6 text-sm text-stone">Loading posts…</p>}
        {posts?.length === 0 && (
          <p className="mt-6 text-sm text-stone">
            {tab === "following"
              ? "Posts from people you follow appear here. Tap any username to visit their profile and follow them."
              : "No posts yet. Be the first."}
          </p>
        )}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start"> {/* sticky: stays in view while you scroll */}
        <div className="rounded-3xl border border-line bg-water p-6">
          <p className="font-semibold text-ink">Trending today</p>
          {trending.length === 0 ? (
            <p className="mt-3 text-sm text-stone">Tag a coin in your post to start a trend.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {trending.map(([coin, count]) => (
                <li key={coin}>
                  <button
                    onClick={() => setCoinFilter(coin)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-mist"
                  >
                    <span className="font-mono font-semibold text-ink">{coin}</span>
                    <span className="text-xs text-stone">{count} {count === 1 ? "post" : "posts"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-water p-6">
          <p className="font-semibold text-ink">Community rules</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            {RULES.map((r) => <li key={r}>✓ {r}</li>)}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function UsernameForm({ onDone }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("profiles").insert({ username: username.trim() });
    if (!error) return onDone({ username: username.trim() });
    if (error.code === "23505") setError("That username is taken.");
    else if (error.code === "23514") setError("Use 3–20 letters, numbers or underscores.");
    else { console.error(error); setError("Something went wrong. Please try again."); }
  }

  return (
    <form onSubmit={save} className="rounded-3xl border border-line bg-water p-6">
      <p className="font-semibold text-ink">Choose your username</p>
      <p className="mt-1 text-sm text-stone">This is how other members will see you. Your email stays private.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. goat_trader" required className={fieldClass} />
        <button type="submit" className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss">Save</button>
      </div>
      {error && <p className="mt-3 text-sm text-loss">{error}</p>}
    </form>
  );
}

function PostForm({ username, onPosted }) {
  const [body, setBody] = useState("");
  const [coin, setCoin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function post(e) {
    e.preventDefault();
    const problem = checkBody(body);                     // friendly check before the database's strict one
    if (problem) return setError(problem);
    setError("");
    setPending(true);
    const { error } = await supabase.from("posts").insert({
      body: body.trim(),
      coin: coin.trim().toUpperCase() || null,
    });
    setPending(false);
    if (!error) { setBody(""); setCoin(""); return onPosted(); }
    if (error.code === "23514") setError("Coin tags are 2–10 letters or numbers, like BTC.");
    else { console.error(error); setError("Something went wrong. Please try again."); }
  }

  return (
    <form onSubmit={post} className="rounded-3xl border border-line bg-water p-6">
      <p className="text-sm text-stone">
        Posting as{" "}
        <Link href={`/u/${username}`} className="font-semibold text-ink hover:text-moss">@{username}</Link> {/* opens your own profile */}
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        rows={3}
        required
        placeholder="What are you watching today?"
        className={`mt-3 ${fieldClass}`}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={coin}
          onChange={(e) => setCoin(e.target.value)}
          placeholder="Tag a coin (optional), e.g. BTC"
          maxLength={10}
          className={`${fieldClass} sm:max-w-xs`}
        />
        <span className="text-xs text-stone sm:ml-auto">{body.length}/500</span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-water hover:bg-moss disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-loss">{error}</p>}
    </form>
  );
}