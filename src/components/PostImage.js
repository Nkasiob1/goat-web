"use client"; // the tap-to-zoom viewer needs state

import { useEffect, useState } from "react";

export default function PostImage({ src, large = false, alt = "Chart attached to post" }) {
  const [open, setOpen] = useState(false); // full-screen viewer on or off

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false); // Esc closes it
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";                   // stop the page scrolling behind
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }} // stopPropagation: don't also open the post page
        aria-label="View image full screen"
        className="mt-3 block overflow-hidden rounded-2xl border border-line bg-mist"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"                                          // only downloads when scrolled near
          className={`${large ? "max-h-[36rem]" : "max-h-[28rem]"} w-auto max-w-full`} // whole chart, never cropped
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }} // tap anywhere to close
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4"
        >
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-xl object-contain" />
          <button aria-label="Close" className="absolute right-4 top-4 rounded-full bg-water/10 p-2 text-water hover:bg-water/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}