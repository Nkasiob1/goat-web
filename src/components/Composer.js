"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { checkBody } from "../lib/postRules";
import { extractCoins } from "../lib/cashtags";
import { compressImage, uploadPostImage, removePostImage, MAX_RAW_BYTES } from "../lib/images";
import Avatar from "./Avatar";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export default function Composer({ userId, username, avatarUrl, onPosted }) {
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInput = useRef(null);
  const coins = extractCoins(body);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function takeFile(f) {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) return setError("Use a PNG, JPG or WebP image.");
    if (f.size > MAX_RAW_BYTES) return setError("That image is too large (max 15MB).");
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setOpen(true);
  }

  function onPick(e) {
    takeFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function onPaste(e) {
    const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
    if (f) { e.preventDefault(); takeFile(f); }
  }

  function clearImage() {
    setFile(null);
    setPreview(null);
  }

  async function post(e) {
    e.preventDefault();
    const problem = checkBody(body);
    if (problem) return setError(problem);
    setError("");
    setPending(true);

    let imageUrl = null;
    try {
      if (file) {
        const small = await compressImage(file);
        imageUrl = await uploadPostImage(userId, small);
      }
    } catch (err) {
      console.error(err);
      setPending(false);
      return setError("Couldn't upload that image. Please try again.");
    }

    const { error } = await supabase.from("posts").insert({
      body: body.trim(),
      coin: coins[0] ?? null,
      sentiment,
      image_url: imageUrl,
    });
    setPending(false);

    if (error) {
      console.error(error);
      removePostImage(imageUrl);
      return setError(
        error.code === "23514"                           // NEW: a database rule said no (links or wallet address)
          ? "Posts can't include links or wallet addresses. Keep it about the market."
          : "Something went wrong. Please try again."
      );
    }
    setBody(""); setSentiment(null); setOpen(false); clearImage();
    onPosted();
  }

  const choices = [
    { id: "bullish", label: "Bullish", on: "bg-gain text-water", off: "border border-line text-gain hover:border-gain" },
    { id: "bearish", label: "Bearish", on: "bg-loss text-water", off: "border border-line text-loss hover:border-loss" },
  ];

  return (
    <form onSubmit={post} className="flex gap-3 border-b border-line p-4 sm:p-5">
      <Link href={`/u/${username}`} aria-label="Your profile"><Avatar name={username} src={avatarUrl} /></Link>
      <div className="min-w-0 flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setOpen(true)}
          onPaste={onPaste}
          rows={open ? 3 : 1}
          maxLength={500}
          placeholder="What are you watching? Tag coins like $BTC"
          className="w-full resize-none bg-transparent py-2 text-ink outline-none placeholder:text-stone"
        />

        {preview && (
          <div className="relative mt-2 inline-block">
            <img src={preview} alt="Selected image" className="max-h-72 rounded-2xl border border-line" />
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove image"
              className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-water hover:bg-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}

        {open && (
          <div className="mt-2 border-t border-line pt-3">
            {coins.length > 0 && (
              <p className="mb-3 text-xs text-stone">Tagging {coins.map((c) => "$" + c).join(" ")}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileInput} type="file" accept={ALLOWED.join(",")} onChange={onPick} className="hidden" />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                aria-label="Add image"
                className="rounded-full p-2 text-moss hover:bg-sage"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 16l5-5 4 4 3-3 6 6" />
                  <circle cx="16" cy="9" r="1.5" />
                </svg>
              </button>

              {choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={sentiment === c.id}
                  onClick={() => setSentiment(sentiment === c.id ? null : c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${sentiment === c.id ? c.on : c.off}`}
                >
                  {c.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-stone">{body.length}/500</span>
              <button
                type="submit"
                disabled={pending || !body.trim()}
                className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss disabled:opacity-50"
              >
                {pending ? (file ? "Uploading…" : "Posting…") : "Post"}
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-loss">{error}</p>}
      </div>
    </form>
  );
}