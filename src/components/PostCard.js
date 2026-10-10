"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import TimeAgo from "./TimeAgo";
import { checkBody } from "../lib/postRules";

export default function PostCard({ post, liked, onLike, onDelete, user, canPost }) {
  const [open, setOpen] = useState(false);               // is the reply thread showing?
  const [replies, setReplies] = useState(null);          // null = not loaded yet
  const [replyCount, setReplyCount] = useState(post.reply_count);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function loadReplies() {
    const { data } = await supabase
      .from("post_feed")
      .select("*")
      .eq("parent_id", post.id)                          // only replies to THIS post
      .order("created_at", { ascending: true });         // oldest first, so the conversation reads in order
    setReplies(data ?? []);
  }

  function toggleThread() {
    if (!open && replies === null) loadReplies();        // load only the first time it's opened
    setOpen(!open);
  }

  async function sendReply(e) {
    e.preventDefault();
    const problem = checkBody(text);                     // friendly check before the database's strict one
    if (problem) return setError(problem);
    setError("");
    const { error } = await supabase.from("posts").insert({ body: text.trim(), parent_id: post.id });
    if (error) { console.error(error); return setError("Couldn't send that reply. Please try again."); }
    setText("");
    setReplyCount((n) => n + 1);
    loadReplies();
  }

  async function deleteReply(id) {
    setReplies((prev) => prev.filter((r) => r.id !== id));
    setReplyCount((n) => n - 1);
    await supabase.from("posts").delete().eq("id", id);
  }

  return (
    <li className="rounded-3xl border border-line bg-water p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* username now opens their profile */}
        <Link href={`/u/${post.username}`} className="font-semibold text-ink hover:text-moss">@{post.username}</Link>
        {post.coin && (
          <Link href={`/markets/${post.coin.toLowerCase()}`} className="rounded-full bg-sage px-2 py-0.5 font-mono text-xs text-moss">
            {post.coin}
          </Link>
        )}
        <span className="text-xs text-stone">· <TimeAgo date={post.created_at} /></span>
        {user?.id === post.user_id && (
          <button onClick={() => onDelete(post.id)} className="ml-auto text-xs text-stone hover:text-loss">Delete</button>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{post.body}</p>

      <div className="mt-4 flex items-center gap-6 text-sm text-stone">
        {/* like button: a liked heart turns brick red */}
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

        {/* reply button: a speech bubble that opens the thread */}
        <button onClick={toggleThread} aria-label="Replies" className="flex items-center gap-1.5 hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 5h16v11H8l-4 4V5z" />
          </svg>
          {replyCount}
        </button>
      </div>

      {open && (                                         // the thread, shown under the post
        <div className="mt-5 space-y-4 border-l-2 border-line pl-4">
          {replies === null && <p className="text-xs text-stone">Loading replies…</p>}
          {replies?.map((r) => (
            <div key={r.id}>
              <p className="text-xs text-stone">
                <Link href={`/u/${r.username}`} className="font-semibold text-ink hover:text-moss">@{r.username}</Link> · <TimeAgo date={r.created_at} />
                {user?.id === r.user_id && (
                  <button onClick={() => deleteReply(r.id)} className="ml-3 hover:text-loss">Delete</button>
                )}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">{r.body}</p>
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
    </li>
  );
}