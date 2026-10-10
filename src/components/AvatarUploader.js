"use client";

import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { announceProfileChange } from "../lib/useProfile";
import Avatar from "./Avatar";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;                       // 2 MB

export default function AvatarUploader({ profile }) {    // profile = { id, username, avatar_url }
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError("Use a PNG, JPG, WEBP or GIF image.");
    if (file.size > MAX_BYTES) return setError("Images must be under 2 MB.");

    setError("");
    setUploading(true);
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`; // my folder + unique name

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (upErr) { console.error(upErr); setUploading(false); return setError("Upload failed. Please try again."); }

    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    setUploading(false);
    if (dbErr) { console.error(dbErr); return setError("Couldn't save your new photo. Please try again."); }

    announceProfileChange();                             // tell the navbar, menu and everything else to refresh
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={profile.username} src={profile.avatar_url} size="lg" />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-moss disabled:opacity-60"
        >
          {uploading ? "Uploading…" : profile.avatar_url ? "Change photo" : "Add photo"}
        </button>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} className="hidden" />
      </div>
      {error && <p className="mt-2 text-sm text-loss">{error}</p>}
    </div>
  );
}