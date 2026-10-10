"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { announceProfileChange } from "../lib/useProfile"; // NEW: tells the rest of the site the photo changed
import PostCard from "./PostCard";
import Avatar from "./Avatar";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;                       // 2 MB

export default function ProfileView({ username }) {
  const router = useRouter();
  const user = useUser();
  const fileInput = useRef(null);                        // a handle on the hidden file picker
  const [person, setPerson] = useState(undefined);
  const [me, setMe] = useState(undefined);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState(null);
  const [myLikes, setMyLikes] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("id, username, created_at, avatar_url").eq("username", username).maybeSingle()
      .then(({ data }) => setPerson(data));
  }, [username]);

  useEffect(() => {
    if (!user) { setMe(user === null ? null : undefined); return; }
    supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMe(data));
  }, [user]);

  async function loadStats(id) {
    const [followers, following] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
    ]);
    setStats({ followers: followers.count ?? 0, following: following.count ?? 0 });
  }

  async function loadPosts(id) {
    const { data } = await supabase
      .from("post_feed").select("*")
      .eq("user_id", id).is("parent_id", null)
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
  }, [person?.id, user]);                                // person?.id: don't reload everything just because the photo changed

  useEffect(() => {
    if (!person || !user) { setIsFollowing(false); return; }
    supabase.from("follows").select("follower_id")
      .eq("follower_id", user.id).eq("following_id", person.id).maybeSingle()
      .then(({ data }) => setIsFollowing(Boolean(data)));
  }, [person?.id, user]);

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];                    // the picked file
    e.target.value = "";                                 // reset, so picking the same file again still triggers
    if (!file) return;
    if (!TYPES.includes(file.type)) return setUploadError("Use a PNG, JPG, WEBP or GIF image.");
    if (file.size > MAX_BYTES) return setUploadError("Images must be under 2 MB.");

    setUploadError("");
    setUploading(true);

    const ext = file.name.split(".").pop().toLowerCase(); // "png", "jpg"...
    const path = `${user.id}/avatar-${Date.now()}.${ext}`; // my folder + a unique name, so browsers never show the old picture

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" }); // cache for a year: the name never repeats
    if (upErr) { console.error(upErr); setUploading(false); return setUploadError("Upload failed. Please try again."); }

    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl; // the image's public address

    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id); // save it
    setUploading(false);
    if (dbErr) { console.error(dbErr); return setUploadError("Couldn't save your new photo. Please try again."); }

    setPerson((p) => ({ ...p, avatar_url: url }));       // show it in the header straight away
    setPosts((prev) => prev?.map((p) => ({ ...p, avatar_url: url })) ?? prev); // NEW: my posts on this page switch photo too
    announceProfileChange();                             // NEW: navbar, phone menu and dashboard refresh as well
  }

  async function toggleFollow() {
    if (user === null) return router.push("/login");
    if (!me) return router.push("/dashboard");           // no username yet: set it up on the dashboard
    const was = isFollowing;
    setIsFollowing(!was);
    setStats((s) => ({ ...s, followers: s.followers + (was ? -1 : 1) }));
    const { error } = was
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", person.id)
      : await supabase.from("follows").insert({ following_id: person.id });
    if (error) { console.error(error); setIsFollowing(was); loadStats(person.id); }
  }

  async function toggleLike(id) {
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
  const joined = new Date(person.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="rounded-3xl border border-line bg-water p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-4">
          {isMe ? (                                      // my profile: the avatar is a button that opens the file picker
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="group relative rounded-full"
            >
              <Avatar name={person.username} src={person.avatar_url} size="lg" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/60 text-xs font-medium text-water opacity-0 transition group-hover:opacity-100">
                {uploading ? "Uploading…" : "Change photo"}
              </span>
            </button>
          ) : (
            <Avatar name={person.username} src={person.avatar_url} size="lg" />
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif" // the picker only offers these types
            onChange={uploadPhoto}
            className="hidden"                           // hidden: the avatar and button open it
          />

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">@{person.username}</h1>
            <p className="text-sm text-stone">Joined {joined}</p>
          </div>

          <div className="ml-auto">
            {isMe ? (                                    // visible button too, because phones have no hover
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-moss disabled:opacity-60"
              >
                {uploading ? "Uploading…" : person.avatar_url ? "Change photo" : "Add photo"}
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                  isFollowing
                    ? "border border-line text-ink hover:border-loss hover:text-loss"
                    : "bg-forest text-water hover:bg-moss"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {uploadError && <p className="mt-3 text-sm text-loss">{uploadError}</p>}

        <div className="mt-6 flex gap-6 text-sm">
          <p><span className="font-semibold text-ink">{stats.followers}</span> <span className="text-stone">followers</span></p>
          <p><span className="font-semibold text-ink">{stats.following}</span> <span className="text-stone">following</span></p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink">Posts</h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-water">
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