// src/components/RefTracker.js
// Runs once when a page opens. If the address has ?ref=..., it remembers the channel
// and counts ONE visit per browser session. It shows nothing on screen.
"use client";

import { useEffect } from "react";
import { cleanRef, saveRef } from "../lib/ref";

export default function RefTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); // the part after "?" in the address
    const ref = cleanRef(params.get("ref"));               // "" if there's no ref or it's not a safe label
    if (!ref) return;                                      // normal visit: nothing to do

    saveRef(ref);                                          // remember it for signup credit (first touch wins)

    const seenKey = `goat-ref-seen-${ref}`;                // one count per channel per browser session
    try {
      if (sessionStorage.getItem(seenKey)) return;         // already counted (e.g. they refreshed): stop
      sessionStorage.setItem(seenKey, "1");
    } catch {
      // storage blocked: still count once, below
    }

    fetch("/api/ref", {                                    // tell our server "a visit from this channel"
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, path: window.location.pathname }), // label + page only
      keepalive: true,                                     // finishes even if they leave the page quickly
    }).catch(() => {});                                    // counting must never break the site
  }, []);                                                  // [] = run once per page load

  return null;                                             // invisible
}