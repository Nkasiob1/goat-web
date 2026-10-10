const CASHTAG = /\$([A-Za-z][A-Za-z0-9]{1,9})\b/g;     // "$" + a letter + 1–9 letters or digits, e.g. $BTC, $PEPE (not $5)

export function extractCoins(text) {                     // "$btc and $SOL" → ["BTC", "SOL"]
  const coins = [];
  for (const match of text.matchAll(CASHTAG)) {
    const coin = match[1].toUpperCase();
    if (!coins.includes(coin)) coins.push(coin);         // no duplicates
  }
  return coins.slice(0, 5);                              // at most 5 tags per post
}

export function splitCashtags(text) {                    // breaks text into plain pieces and tag pieces, for display
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(CASHTAG)) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "tag", value: match[1].toUpperCase() });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}