"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import TimeAgo from "./TimeAgo";
import Avatar from "./Avatar";
import PostBody from "./PostBody";
import { checkBody } from "../lib/postRules";

const SENTIMENT = {                                      // how each sentiment looks
  bullish: { label: "Bullish", cls: "bg-sage text-gain" },
  bearish: { label: "Bearish", cls: "bg-[#F6E9E7] text-loss" },
};

export default function PostCard({ post, liked, onLike, onDelete, user, canPost }) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState(null);
  const [replyCount, setReplyCount] = useState(post.reply_count);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const own = user?.id === post.user_id;
  const showCoinChip = post.coin && !post.body.toUpperCase().includes("$" + post.coin); // old posts tagged without a $ in the text

  async function loadReplies() {
    const { data } = await supabase
      .from("post_feed").select("*")
      .eq("parent_id", post.id)
      .order("created_at", { ascending: true });
    setReplies(data ?? []);
  }

  function toggleThread() {
    if (!open && replies === null) loadReplies();
    setOpen(!open);
  }

  async function sendReply(e) {
    e.preventDefault();
    const problem = checkBody(text);
    if (problem) return setError(problem);
    setError("");
    const { error } = await supabase.from("posts").insert({ body: text.trim(), parent_id: post.id });
    if (error) { console.error(error); return setError("Couldn't send that reply. Please try again."); }
    setText("");
    setReplyCount((n) => n + 1);
    loadReplies();
  }

  async function deleteReply(id) {
    if (!window.confirm("Delete this reply?")) return;   // a quick "are you sure?"
    setReplies((prev) => prev.filter((r) => r.id !== id));
    setReplyCount((n) => n - 1);
    await supabase.from("posts").delete().eq("id", id);
  }

  return (
    <li className="flex gap-3 px-4 py-4 transition hover:bg-mist/60 sm:px-5">
      <Link href={`/u/${post.username}`} aria-label={`@${post.username}'s profile`}>
        <Avatar name={post.username} src={post.avatar_url} />
      </Link>

      <div className="min-w-0 flex-1">                   {/* min-w-0 lets long text wrap instead of stretching the row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link href={`/u/${post.username}`} className="font-semibold text-ink hover:underline">@{post.username}</Link>
          <span className="text-xs text-stone"><TimeAgo date={post.created_at} /></span>
          {post.sentiment && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SENTIMENT[post.sentiment].cls}`}>
              {SENTIMENT[post.sentiment].label}
            </span>
          )}
          {own && (
            <button
              onClick={() => window.confirm("Delete this post?") && onDelete(post.id)}
              className="ml-auto text-xs text-stone hover:text-loss"
            >
              Delete
            </button>
          )}
        </div>

        <PostBody text={post.body} className="mt-1 leading-relaxed text-ink" />

        {showCoinChip && (
          <Link href={`/community?coin=${post.coin}`} className="mt-2 inline-block rounded-full bg-sage px-2 py-0.5 font-mono text-xs text-moss">
            {"$" + post.coin}
          </Link>
        )}

        <div className="mt-3 flex items-center gap-8 text-sm text-stone">
          {/* replies */}
          <button onClick={toggleThread} aria-label="Replies" className="flex items-center gap-1.5 hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 5h16v11H8l-4 4V5z" />
            </svg>
            {replyCount}
          </button>

          {/* likes */}
          <button
            onClick={() => onLike(post.id)}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className={`flex items-center gap-1.5 transition ${liked ? "text-loss" : "hover:text-loss"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {post.like_count}
          </button>
        </div>

        {open && (
          <div className="mt-4 space-y-4 border-l-2 border-line pl-4">
            {replies === null && <p className="text-xs text-stone">Loading replies…</p>}
            {replies?.map((r) => (
              <div key={r.id} className="flex gap-2">
                <Link href={`/u/${r.username}`}><Avatar name={r.username} src={r.avatar_url} size="sm" /></Link>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-stone">
                    <Link href={`/u/${r.username}`} className="font-semibold text-ink hover:underline">@{r.username}</Link>{" "}
                    · <TimeAgo date={r.created_at} />
                    {user?.id === r.user_id && (
                      <button onClick={() => deleteReply(r.id)} className="ml-3 hover:text-loss">Delete</button>
                    )}
                  </p>
                  <PostBody text={r.body} className="mt-0.5 text-sm text-ink" />
                </div>
              </div>
            ))}

            {canPost ? (
              <form onSubmit={sendReply} className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  placeholder="Write a reply…"
                  className="w-full rounded-full border border-line bg-mist px-4 py-2 text-sm text-ink outline-none focus:border-moss"
                />
                <button type="submit" className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss">Reply</button>
              </form>
            ) : (
              <p className="text-xs text-stone">Log in and choose a username to reply.</p>
            )}
            {error && <p className="text-xs text-loss">{error}</p>}
          </div>
        )}
      </div>
    </li>
  );
}