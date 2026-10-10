"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useProfile } from "../lib/useProfile";
import { checkBody } from "../lib/postRules";
import { removePostImage } from "../lib/images";         // NEW
import Avatar from "./Avatar";
import PostBody from "./PostBody";
import PostCard from "./PostCard";
import PostImage from "./PostImage";                     // NEW

const SENTIMENT = {
  bullish: { label: "Bullish", cls: "bg-sage text-gain" },
  bearish: { label: "Bearish", cls: "bg-[#F6E9E7] text-loss" },
};

export default function PostThread({ id }) {
  const router = useRouter();
  const { user, profile } = useProfile();
  const [post, setPost] = useState(undefined);           // undefined = loading, null = not found
  const [parent, setParent] = useState(null);            // the post this one replies to
  const [replies, setReplies] = useState([]);
  const [myLikes, setMyLikes] = useState(new Set());
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadReplies() {
    const { data } = await supabase
      .from("post_feed").select("*")
      .eq("parent_id", id)
      .order("created_at", { ascending: true });
    setReplies(data ?? []);
  }

  async function load() {
    const { data: main, error } = await supabase.from("post_feed").select("*").eq("id", id).maybeSingle();
    if (error || !main) { setPost(null); return; }

    const { data: above } = main.parent_id
      ? await supabase.from("post_feed").select("*").eq("id", main.parent_id).maybeSingle()
      : { data: null };

    const { data: below } = await supabase
      .from("post_feed").select("*")
      .eq("parent_id", id)
      .order("created_at", { ascending: true });

    let liked = new Set();
    if (user) {
      const ids = [main, above, ...(below ?? [])].filter(Boolean).map((p) => p.id);
      const { data: likes } = await supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", ids);
      liked = new Set((likes ?? []).map((l) => l.post_id));
    }

    setPost(main);
    setParent(above);
    setReplies(below ?? []);
    setMyLikes(liked);
  }

  useEffect(() => {
    if (user === undefined) return;                      // wait until we know who's looking
    load();
  }, [id, user]);

  useEffect(() => {                                      // realtime: new replies appear live
    const channel = supabase
      .channel(`thread-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts", filter: `parent_id=eq.${id}` }, () => loadReplies())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function toggleLike(postId) {
    if (user === null) return router.push("/login");
    if (!user || !profile) return;
    const has = myLikes.has(postId);
    const bump = (p) => (p && p.id === postId ? { ...p, like_count: p.like_count + (has ? -1 : 1) } : p);
    setMyLikes((prev) => { const next = new Set(prev); has ? next.delete(postId) : next.add(postId); return next; });
    setPost(bump);
    setParent(bump);
    setReplies((prev) => prev.map(bump));
    const { error } = has
      ? await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id)
      : await supabase.from("likes").insert({ post_id: postId });
    if (error) { console.error(error); load(); }
  }

  async function removePost(postId) {
    if (postId === post.id || postId === parent?.id) {   // deleting the main post (or its parent): leave the page
      const target = postId === post.id ? post : parent;
      await supabase.from("posts").delete().eq("id", postId);
      removePostImage(target.image_url);                 // NEW: delete its image file too
      return router.push("/community");
    }
    const target = replies.find((r) => r.id === postId);
    setReplies((prev) => prev.filter((r) => r.id !== postId));
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) { console.error(error); return loadReplies(); }
    removePostImage(target?.image_url);
  }

  async function sendReply(e) {
    e.preventDefault();
    const problem = checkBody(text);
    if (problem) return setError(problem);
    setError("");
    setPending(true);
    const { error } = await supabase.from("posts").insert({ body: text.trim(), parent_id: post.id });
    setPending(false);
    if (error) { console.error(error); return setError("Couldn't send that reply. Please try again."); }
    setText("");
    loadReplies();
  }

  async function share() {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copy this link:", url); }
  }

  if (post === undefined) {
    return <div className="h-64 animate-pulse rounded-3xl border border-line bg-mist"></div>;
  }

  if (post === null) {
    return (
      <div className="rounded-3xl border border-line bg-water p-10 text-center">
        <p className="font-semibold text-ink">This post doesn't exist</p>
        <p className="mt-1 text-sm text-stone">It may have been deleted.</p>
        <Link href="/community" className="mt-5 inline-block rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss">Back to community</Link>
      </div>
    );
  }

  const canPost = Boolean(user && profile);
  const liked = myLikes.has(post.id);
  const fullDate = new Date(post.created_at).toLocaleString(undefined, {
    hour: "numeric", minute: "2-digit", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-water">
      <div className="flex items-center gap-4 border-b border-line px-4 py-3 sm:px-5">
        <button onClick={() => router.back()} aria-label="Back" className="rounded-full p-1.5 text-ink hover:bg-mist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        </button>
        <p className="font-semibold text-ink">Post</p>
      </div>

      {parent && (
        <ul className="border-b border-line">
          <PostCard post={parent} liked={myLikes.has(parent.id)} onLike={toggleLike} onDelete={removePost} user={user} canPost={canPost} />
        </ul>
      )}

      <article className="border-b border-line px-4 py-5 sm:px-5">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.username}`}><Avatar name={post.username} src={post.avatar_url} size="md" /></Link>
          <div className="min-w-0 flex-1">
            <Link href={`/u/${post.username}`} className="font-semibold text-ink hover:underline">@{post.username}</Link>
            {parent && <p className="text-xs text-stone">Replying to <Link href={`/u/${parent.username}`} className="text-moss">@{parent.username}</Link></p>}
          </div>
          {post.sentiment && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SENTIMENT[post.sentiment].cls}`}>{SENTIMENT[post.sentiment].label}</span>
          )}
        </div>

        <PostBody text={post.body} className="mt-4 text-lg leading-relaxed text-ink" />
        {post.image_url && <PostImage src={post.image_url} large />} {/* NEW: bigger on the post page */}
        <p className="mt-4 text-sm text-stone">{fullDate}</p>

        <div className="mt-4 flex gap-5 border-t border-line pt-3 text-sm">
          <span><b className="text-ink">{replies.length}</b> <span className="text-stone">{replies.length === 1 ? "Reply" : "Replies"}</span></span>
          <span><b className="text-ink">{post.like_count}</b> <span className="text-stone">{post.like_count === 1 ? "Like" : "Likes"}</span></span>
        </div>

        <div className="mt-3 flex items-center gap-8 border-t border-line pt-3 text-sm text-stone">
          <button
            onClick={() => toggleLike(post.id)}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className={`flex items-center gap-1.5 transition ${liked ? "text-loss" : "hover:text-loss"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {liked ? "Liked" : "Like"}
          </button>
          <button onClick={share} className="flex items-center gap-1.5 hover:text-forest">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" /></svg>
            {copied ? "Link copied" : "Share"}
          </button>
          {user?.id === post.user_id && (
            <button onClick={() => window.confirm("Delete this post?") && removePost(post.id)} className="ml-auto hover:text-loss">Delete</button>
          )}
        </div>
      </article>

      {canPost ? (
        <form onSubmit={sendReply} className="flex gap-3 border-b border-line p-4 sm:p-5">
          <Avatar name={profile.username} src={profile.avatar_url} />
          <div className="min-w-0 flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={`Reply to @${post.username}`}
              className="w-full resize-none bg-transparent py-2 text-ink outline-none placeholder:text-stone"
            />
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs text-stone">{text.length}/500</span>
              <button type="submit" disabled={pending || !text.trim()} className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss disabled:opacity-50">
                {pending ? "Replying…" : "Reply"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-loss">{error}</p>}
          </div>
        </form>
      ) : (
        <p className="border-b border-line px-5 py-4 text-sm text-stone">
          <Link href="/login" className="font-medium text-moss hover:text-forest">Log in</Link> and choose a username to reply.
        </p>
      )}

      <ul className="divide-y divide-line">
        {replies.map((r) => (
          <PostCard key={r.id} post={r} liked={myLikes.has(r.id)} onLike={toggleLike} onDelete={removePost} user={user} canPost={canPost} />
        ))}
      </ul>
      {replies.length === 0 && <p className="px-5 py-10 text-center text-sm text-stone">No replies yet. Start the conversation.</p>}
    </div>
  );
}