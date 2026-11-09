// src/lib/ref.js
// Shared helpers for ref tracking (?ref=meta-in). Safe to import on the server too:
// the browser storage is only touched inside the functions, never at import time.

export const REF_KEY = "goat-ref";                         // where the first channel is remembered in the browser
const REF_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;           // allowed labels: lowercase letters, numbers, dashes
const REF_DAYS = 30;                                       // credit the channel for 30 days after the first visit

// Turn any input into a safe label, or "" if it isn't one ("Meta-IN " -> "meta-in", "<script>" -> "")
export function cleanRef(raw) {
  const r = String(raw || "").trim().toLowerCase();        // ignore spaces and capitals
  return REF_PATTERN.test(r) ? r : "";                     // only exact safe labels pass
}

// The channel that first brought this browser here (within 30 days), or ""
export function getSavedRef() {
  try {
    const saved = JSON.parse(localStorage.getItem(REF_KEY) || "null"); // { ref, at } or null
    if (!saved) return "";
    if (Date.now() - saved.at > REF_DAYS * 24 * 60 * 60 * 1000) return ""; // too old: no longer counts
    return cleanRef(saved.ref);
  } catch {
    return "";                                             // storage blocked (private mode): just no credit
  }
}

// Remember a channel, but only if none is remembered yet (first touch wins)
export function saveRef(ref) {
  try {
    if (getSavedRef()) return false;                       // an earlier channel already gets the credit
    localStorage.setItem(REF_KEY, JSON.stringify({ ref, at: Date.now() }));
    return true;
  } catch {
    return false;                                          // storage blocked: nothing saved, nothing breaks
  }
}