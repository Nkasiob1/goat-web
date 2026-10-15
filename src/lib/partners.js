// lib/partners.js: every partner (affiliate/referral) link lives HERE, and only here.
// When Bybit approves the affiliate account, change the url below and the whole site follows.

export const PARTNERS = {
  bybit: {
    name: "Bybit",                                                   // shown on buttons
    url: "https://www.bybit.com/invite?ref=WV2RLQD",                 // your referral link (swap for the affiliate link later)
    pitch: "Trade new listings on Bybit",                            // banner headline
  },
};

// The GOAT short link every button uses: /go/bybit?from=radar-card
// It counts the click, then forwards to the partner's real link.
export function goLink(partner, from) {
  return `/go/${partner}?from=${encodeURIComponent(from)}`;          // encode so odd characters can't break the URL
}