"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REASONS, reportPost } from "../lib/moderation";

export default function PostMenu({ postId, own, user, onDelete }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);         // the small dropdown
  const [reporting, setReporting] = useState(false); // the report sheet
  const ref = useRef(null);

  useEffect(() => {                                // tap outside the menu to close it
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} data-no-open className="relative ml-auto"> {/* data-no-open: taps here never open the post page */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="-my-1 rounded-full p-1.5 text-stone hover:bg-mist hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-water py-1 shadow-lg">
          {own ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); if (window.confirm("Delete this post?")) onDelete(postId); }}
              className="block w-full px-4 py-2.5 text-left text-sm text-loss hover:bg-mist"
            >
              Delete post
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); if (!user) return router.push("/login"); setReporting(true); }}
              className="block w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-mist"
            >
              Report post
            </button>
          )}
        </div>
      )}

      {reporting && <ReportSheet postId={postId} onClose={() => setReporting(false)} />}
    </div>
  );
}

function ReportSheet({ postId, onClose }) {        // slides up from the bottom on phones, centred on laptops
  const [reason, setReason] = useState(null);
  const [status, setStatus] = useState("idle");    // idle | sending | sent | already | error

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose(); // Esc closes
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";       // freeze the page behind
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  async function send() {
    setStatus("sending");
    setStatus(await reportPost(postId, reason));
  }

  const done = status === "sent" || status === "already";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report post"
      onClick={(e) => { e.stopPropagation(); onClose(); }}   // tap the dark area to close
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 sm:items-center sm:p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-water p-6 sm:rounded-3xl"> {/* taps inside don't close */}
        {done ? (
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            </span>
            <p className="mt-4 text-lg font-semibold text-ink">
              {status === "sent" ? "Thanks for reporting" : "You've already reported this"}
            </p>
            <p className="mt-1 text-sm text-stone">
              Our team will review it. Posts reported by several members are hidden automatically.
            </p>
            <button type="button" onClick={onClose} className="mt-6 w-full rounded-full bg-forest py-3 text-sm font-medium text-water hover:bg-moss">Done</button>
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold text-ink">Report this post</p>
            <p className="mt-1 text-sm text-stone">What's wrong with it?</p>

            <div className="mt-4 space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={reason === r.id}
                  onClick={() => setReason(r.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${reason === r.id ? "border-moss bg-sage" : "border-line hover:bg-mist"}`}
                >
                  <span className="block text-sm font-medium text-ink">{r.label}</span>
                  <span className="block text-xs text-stone">{r.hint}</span>
                </button>
              ))}
            </div>

            {status === "error" && <p className="mt-3 text-sm text-loss">Couldn't send the report. Please try again.</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm text-stone hover:bg-mist">Cancel</button>
              <button
                type="button"
                onClick={send}
                disabled={!reason || status === "sending"}
                className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-water hover:bg-moss disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}