// lib/partners.js: every partner (affiliate/referral) link lives HERE, and only here.
// PAUSED (Nov 2026): exchange affiliate links are switched off while we check Nigeria's SEC
// promotion rules. Flip PARTNERS_ON to true to bring them back. Nothing else needs to change.

const PARTNERS_ON = false;                                           // the one switch (false = no partner links anywhere)

export const PARTNERS_ENABLED = PARTNERS_ON;                         // NEW: components check this before drawing a partner box

const ALL_PARTNERS = {                                               // kept here so turning them back on is one word
  bybit: {
    name: "Bybit",                                                   // shown on buttons
    url: "https://www.bybit.com/invite?ref=WV2RLQD",                 // your referral link (swap for the affiliate link later)
    pitch: "Trade new listings on Bybit",                            // banner headline
  },
};

export const PARTNERS = PARTNERS_ON ? ALL_PARTNERS : {};             // switched off -> an empty list, so /go/... goes home

// The GOAT short link every button uses: /go/bybit?from=radar-card
// It counts the click, then forwards to the partner's real link.
export function goLink(partner, from) {
  return `/go/${partner}?from=${encodeURIComponent(from)}`;          // encode so odd characters can't break the URL
}