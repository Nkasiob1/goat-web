"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { removePostImage } from "../lib/images";
import { REASON_LABEL } from "../lib/moderation";
import TimeAgo from "./TimeAgo";

export default function AdminQueue() {
  const user = useUser();
  const [isAdmin, setIsAdmin] = useState(undefined);     // undefined = checking
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(null);                // which post is being acted on

  async function load() {
    const { data, error } = await supabase.rpc("moderation_queue"); // the database checks admin again
    if (error) console.error(error);
    setItems(data ?? []);
  }

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("is_admin").then(({ data }) => {         // ask the database, never trust the browser
      setIsAdmin(Boolean(data));
      if (data) load();
    });
  }, [user]);

  async function act(item, action) {
    if (action === "delete" && !window.confirm("Delete this post for everyone? This can't be undone.")) return;
    setBusy(item.post_id);
    const { error } = await supabase.rpc("moderate_post", { target: item.post_id, action });
    if (error) { console.error(error); alert("That didn't work. Please try again."); }
    else if (action === "delete") removePostImage(item.image_url); // clean up the file too
    setBusy(null);
    load();
  }

  if (isAdmin === undefined) return <div className="h-64 animate-pulse rounded-3xl border border-line bg-mist"></div>;
  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-line bg-water p-10 text-center">
        <p className="font-semibold text-ink">This page is for GOAT moderators.</p>
        <Link href="/community" className="mt-5 inline-block rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss">Back to community</Link>
      </div>
    );
  }

  const hiddenCount = items?.filter((i) => i.hidden).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Moderation</h1>
          <p className="mt-1 text-sm text-stone">
            {items === null ? "Loading…" : `${items.length} to review · ${hiddenCount} hidden`}
          </p>
        </div>
        <button onClick={load} className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-mist">Refresh</button>
      </div>

      {items?.length === 0 && (
        <div className="rounded-3xl border border-line bg-water p-10 text-center text-sm text-stone">
          Nothing to review. The community is behaving.
        </div>
      )}

      {items?.map((item) => (
        <article key={item.post_id} className={`rounded-3xl border bg-water p-5 ${item.hidden ? "border-loss/40" : "border-line"}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/u/${item.username}`} className="font-semibold text-ink hover:underline">@{item.username}</Link>
            <span className="text-xs text-stone"><TimeAgo date={item.created_at} /></span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.hidden ? "bg-[#F6E9E7] text-loss" : "bg-sage text-moss"}`}>
              {item.hidden ? "Hidden" : "Visible"}
            </span>
            {item.report_count > 0 && (
              <span className="text-xs text-stone">
                {item.report_count} {item.report_count === 1 ? "report" : "reports"}: {item.reasons.map((r) => REASON_LABEL[r] ?? r).join(", ")}
              </span>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-ink">{item.body}</p>
          {item.image_url && (
            <a href={item.image_url} target="_blank" rel="noreferrer">          {/* open full size in a new tab */}
              <img src={item.image_url} alt="Reported image" className="mt-3 max-h-48 rounded-2xl border border-line" />
            </a>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {item.hidden ? (
              <button disabled={busy === item.post_id} onClick={() => act(item, "restore")} className="rounded-full bg-forest px-4 py-2 text-sm font-medium text-water hover:bg-moss disabled:opacity-50">
                Restore
              </button>
            ) : (
              <>
                <button disabled={busy === item.post_id} onClick={() => act(item, "hide")} className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-mist disabled:opacity-50">
                  Hide
                </button>
                <button disabled={busy === item.post_id} onClick={() => act(item, "dismiss")} className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-mist disabled:opacity-50">
                  Dismiss reports
                </button>
                <Link href={`/post/${item.post_id}`} className="rounded-full px-4 py-2 text-sm text-moss hover:bg-sage">View post</Link>
              </>
            )}
            <button disabled={busy === item.post_id} onClick={() => act(item, "delete")} className="ml-auto rounded-full px-4 py-2 text-sm font-medium text-loss hover:bg-[#F6E9E7] disabled:opacity-50">
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}