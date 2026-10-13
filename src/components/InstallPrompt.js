"use client"; // listens for the phone's install signal

import { useEffect, useState } from "react";

const KEY = "goat-install-dismissed"; // remember "don't show again"

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null); // Android's install event, saved for when the user taps Install
  const [ios, setIos] = useState(false);          // iPhone: show instructions instead of a button
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register the service worker on the live site only (in dev it would cache pages while you code)
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const installed =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone; // already opened as an app?
    let dismissed = false;
    try { dismissed = !!localStorage.getItem(KEY); } catch {}
    if (installed || dismissed) return;                       // never nag

    function onPrompt(e) {
      e.preventDefault();                                     // stop Chrome's own mini-bar; we show our nicer one
      setDeferred(e);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt); // Android / desktop Chrome / Edge

    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)) { // iPhone Safari (Chrome/Firefox on iOS can't install)
      setIos(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();                                        // the phone's real install dialog
    const { outcome } = await deferred.userChoice;            // "accepted" or "dismissed"
    setDeferred(null);
    if (outcome === "accepted") setShow(false);
    else dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:bottom-6 md:right-6 md:w-96">
      {/* phones: floats just above the tab bar; laptops: bottom-right corner */}
      <div className="flex items-center gap-3 rounded-3xl border border-line bg-water p-4 shadow-lg">
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Get the GOAT app</p>
          <p className="text-xs text-stone">
            {ios ? "Tap Share, then \u201CAdd to Home Screen\u201D." : "Full screen, one tap away. Free."}
          </p>
        </div>
        {!ios && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-full bg-forest px-4 py-2 text-sm font-medium text-water hover:bg-moss"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone hover:bg-mist hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}