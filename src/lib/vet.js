// src/lib/vet.js
// Token Safety Checker: find a coin (by name or address), vet its contract, and measure its price history.

const GOPLUS = "https://api.gopluslabs.io/api/v1";        // free contract scanner
const DEX = "https://api.dexscreener.com/latest/dex";      // free market data + search
const GECKO = "https://api.geckoterminal.com/api/v2";      // NEW: free price history (candles)

// DexScreener chain id -> our label + GoPlus chain id + GeckoTerminal network id
const CHAINS = {
  ethereum: { label: "Ethereum", goplus: "1", gecko: "eth" },
  bsc: { label: "BNB Chain", goplus: "56", gecko: "bsc" },
  base: { label: "Base", goplus: "8453", gecko: "base" },
  arbitrum: { label: "Arbitrum", goplus: "42161", gecko: "arbitrum" },
  polygon: { label: "Polygon", goplus: "137", gecko: "polygon_pos" },
  avalanche: { label: "Avalanche", goplus: "43114", gecko: "avax" },
  optimism: { label: "Optimism", goplus: "10", gecko: "optimism" },
  solana: { label: "Solana", goplus: "solana", gecko: "solana" },
};

// Is the text an EVM address? (0x + 40 hex characters)
export const isEvmAddress = (q) => /^0x[a-fA-F0-9]{40}$/.test(q);
// Is the text a Solana address? (32-44 base58 characters: no 0, O, I or l)
export const isSolAddress = (q) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q);

// Fetch JSON with a 10-second limit, so a slow service can't hang the page
async function getJSON(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),                    // give up after 10s
    headers: { accept: "application/json" },               // ask for JSON
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} replied ${res.status}`);
  return res.json();
}

// Keep only pools on chains we support, deepest liquidity first
function supportedPairs(pairs) {
  return (pairs || [])
    .filter((p) => CHAINS[p.chainId])                      // drop unsupported chains
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)); // biggest pool first
}

// ---------- 1. search by name or ticker ----------
export async function searchTokens(q) {
  const data = await getJSON(`${DEX}/search?q=${encodeURIComponent(q)}`); // DexScreener search
  const seen = new Map();                                  // one entry per coin (not per pool)
  for (const p of supportedPairs(data.pairs)) {
    const key = `${p.chainId}:${p.baseToken.address.toLowerCase()}`; // same coin on same chain
    if (seen.has(key)) continue;                           // already kept its deepest pool
    seen.set(key, {
      chain: p.chainId,
      chainLabel: CHAINS[p.chainId].label,
      address: p.baseToken.address,
      symbol: p.baseToken.symbol,
      name: p.baseToken.name,
      image: p.info?.imageUrl || null,                     // logo if DexScreener has one
      liquidity: p.liquidity?.usd ?? null,
      volume24h: p.volume?.h24 ?? null,
    });
  }
  return [...seen.values()].slice(0, 8);                   // top 8 is plenty
}

// ---------- helpers for reading GoPlus answers ----------

// GoPlus answers "1" (yes), "0" (no), or nothing. Solana wraps it as { status: "1" }.
function flag(v) {
  if (v && typeof v === "object") v = v.status;            // unwrap Solana style
  if (v === "1" || v === 1) return true;                   // yes
  if (v === "0" || v === 0) return false;                  // no
  return null;                                             // unknown
}

// Add one check row to the list
function add(list, label, status, detail) {
  list.push({ label, status, detail });                    // status: pass | warn | fail | unknown
}

// ---------- 2a. EVM contract checks ----------
function evmChecks(s, list) {
  const honeypot = flag(s.is_honeypot);
  if (honeypot === true) add(list, "Honeypot", "fail", "Buyers can't sell. This is a trap.");
  else if (honeypot === false) add(list, "Honeypot", "pass", "A test sell went through.");
  else add(list, "Honeypot", "unknown", "Sell test unavailable for this token.");

  const buy = parseFloat(s.buy_tax);                       // e.g. "0.05" = 5%
  const sell = parseFloat(s.sell_tax);
  if (Number.isNaN(buy) && Number.isNaN(sell)) {
    add(list, "Buy / sell tax", "unknown", "Tax could not be measured.");
  } else {
    const worst = Math.max(buy || 0, sell || 0);           // judge by the higher tax
    const status = worst >= 0.3 ? "fail" : worst > 0.1 ? "warn" : "pass"; // 30%+ fail, 10%+ warn
    add(list, "Buy / sell tax", status, `Buy ${((buy || 0) * 100).toFixed(1)}% · Sell ${((sell || 0) * 100).toFixed(1)}%`);
  }

  const verified = flag(s.is_open_source);
  if (verified === false) add(list, "Contract code", "warn", "The code is not verified, so nobody can read it.");
  else if (verified === true) add(list, "Contract code", "pass", "Verified and public.");

  const mint = flag(s.is_mintable);
  if (mint === true) add(list, "Minting", "warn", "The owner can create new tokens and dilute holders.");
  else if (mint === false) add(list, "Minting", "pass", "No one can mint more.");

  // red flags: only shown when present
  if (flag(s.cannot_sell_all) === true) add(list, "Sell limits", "fail", "Holders can't sell their full balance.");
  if (flag(s.owner_change_balance) === true) add(list, "Balance control", "fail", "The owner can change wallet balances.");
  if (flag(s.hidden_owner) === true) add(list, "Hidden owner", "fail", "Control is hidden behind another address.");
  if (flag(s.transfer_pausable) === true) add(list, "Trading pause", "warn", "The owner can pause all trading.");
  if (flag(s.slippage_modifiable) === true) add(list, "Tax control", "warn", "The owner can raise the tax at any time.");
  if (flag(s.is_blacklisted) === true) add(list, "Blacklist", "warn", "The owner can block wallets from trading.");
  if (flag(s.can_take_back_ownership) === true) add(list, "Ownership", "warn", "Renounced ownership can be reclaimed.");
  if (flag(s.is_proxy) === true) add(list, "Upgradeable", "warn", "The code can be swapped later (proxy contract).");
}

// ---------- 2b. Solana token checks ----------
function solChecks(s, list) {
  const mint = flag(s.mintable);
  if (mint === true) add(list, "Mint authority", "warn", "New tokens can still be created.");
  else if (mint === false) add(list, "Mint authority", "pass", "Revoked. Supply is fixed.");

  const freeze = flag(s.freezable);
  if (freeze === true) add(list, "Freeze authority", "fail", "Your tokens can be frozen so you can't sell.");
  else if (freeze === false) add(list, "Freeze authority", "pass", "Revoked.");

  if (flag(s.balance_mutable_authority) === true) add(list, "Balance control", "fail", "An authority can change balances.");
  if (flag(s.non_transferable) === true) add(list, "Transfers", "fail", "The token can't be transferred.");
  if (flag(s.closable) === true) add(list, "Closable", "warn", "The token program can be closed.");
  if (s.transfer_fee && Object.keys(s.transfer_fee).length) add(list, "Transfer fee", "warn", "A fee is taken on every transfer.");
  if (flag(s.metadata_mutable) === true) add(list, "Metadata", "warn", "The name and logo can be changed.");
}

// ---------- 2c. market checks (DexScreener + price history) ----------
function marketChecks(pair, history, list) {
  const liq = pair.liquidity?.usd || 0;
  const liqText = "$" + Intl.NumberFormat("en-US", { notation: "compact" }).format(liq);
  if (liq < 10000) add(list, "Liquidity", "fail", `Only ${liqText}. Easy to manipulate and hard to exit.`);
  else if (liq < 50000) add(list, "Liquidity", "warn", `${liqText}. Thin, so big orders will move the price.`);
  else add(list, "Liquidity", "pass", `${liqText} in the main pool.`);

  if (pair.pairCreatedAt) {
    const hours = (Date.now() - pair.pairCreatedAt) / 36e5; // age in hours
    if (hours < 24) add(list, "Age", "warn", `Launched ${Math.max(1, Math.round(hours))}h ago. Most rugs happen early.`);
    else add(list, "Age", "pass", `Trading for ${Math.round(hours / 24)} days.`);
  }

  // NEW: a 90%+ crash from the peak is the classic dump / rug shape
  if (history && history.fromAthPct <= -90) {
    add(list, "Price crash", "warn", `Down ${Math.abs(history.fromAthPct).toFixed(0)}% from its peak. Early holders may have dumped.`);
  }
}

// ---------- NEW: price history -> since launch % and from peak % ----------
async function priceHistory(pair) {
  const net = CHAINS[pair.chainId]?.gecko;                 // GeckoTerminal's name for the chain
  const now = Number(pair.priceUsd);                       // current price
  if (!net || !pair.pairAddress || !now) return null;      // nothing to measure against

  // pick a candle size so 1000 candles cover the coin's whole life
  const ageHours = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 36e5 : Infinity;
  const timeframe = ageHours <= 16 ? "minute" : ageHours <= 1000 ? "hour" : "day";

  try {
    const url = `${GECKO}/networks/${net}/pools/${pair.pairAddress}/ohlcv/${timeframe}?aggregate=1&limit=1000&currency=usd`;
    const data = await getJSON(url);
    const candles = data?.data?.attributes?.ohlcv_list || []; // each: [time, open, high, low, close, volume]
    if (!candles.length) return null;

    // the oldest candle = the first trades in this pool
    const first = candles.reduce((a, b) => (b[0] < a[0] ? b : a));
    const launchPrice = Number(first[1]);                  // its OPEN price
    if (!launchPrice) return null;

    // the highest HIGH of any candle (or today's price if that's higher) = the peak
    const athPrice = Math.max(now, ...candles.map((c) => Number(c[2]) || 0));

    return {
      launchPrice,
      since: first[0] * 1000,                              // seconds -> milliseconds
      sinceLaunchPct: (now / launchPrice - 1) * 100,       // + means up since launch
      athPrice,
      fromAthPct: (now / athPrice - 1) * 100,              // always 0 or negative
      fullHistory: !(timeframe === "day" && candles.length >= 1000), // false = older than our window
    };
  } catch {
    return null;                                           // history down: the report still works
  }
}

// ---------- contract scan (GoPlus) ----------
async function scanContract(chain, address) {
  try {
    const url =
      chain.goplus === "solana"
        ? `${GOPLUS}/solana/token_security?contract_addresses=${address}`
        : `${GOPLUS}/token_security/${chain.goplus}?contract_addresses=${address}`;
    const res = await getJSON(url);
    return res.result ? Object.values(res.result)[0] || null : null; // the one token we asked about
  } catch {
    return null;                                           // scanner down: report still shows market checks
  }
}

// ---------- 3. full report for one address ----------
export async function vetToken(address) {
  const data = await getJSON(`${DEX}/tokens/${address}`);  // every pool holding this token
  const lower = address.toLowerCase();
  const pairs = supportedPairs(data.pairs);
  // prefer pools where it's the main (base) token, not the quote token
  const pair = pairs.find((p) => p.baseToken.address.toLowerCase() === lower) || pairs[0];
  if (!pair) throw new Error("This token isn't trading on any supported DEX yet.");

  const chain = CHAINS[pair.chainId];
  const isBase = pair.baseToken.address.toLowerCase() === lower; // which side of the pool is ours
  const token = isBase ? pair.baseToken : pair.quoteToken;

  // NEW: scan + price history at the SAME time (faster than one after the other)
  const [scan, history] = await Promise.all([
    scanContract(chain, address),
    isBase ? priceHistory(pair) : Promise.resolve(null),   // history only makes sense for the base token
  ]);

  const checks = [];
  if (scan) (chain.goplus === "solana" ? solChecks : evmChecks)(scan, checks);
  else add(checks, "Contract scan", "unknown", "The scanner had no data for this token. Treat it with caution.");
  marketChecks(pair, history, checks);

  // tally and decide the verdict
  const counts = { pass: 0, warn: 0, fail: 0, unknown: 0 };
  for (const c of checks) counts[c.status]++;
  const verdict = counts.fail > 0 ? "red" : !scan || counts.warn >= 2 ? "yellow" : "green";

  return {
    token: {
      address,
      symbol: token.symbol,
      name: token.name,
      chain: pair.chainId,
      chainLabel: chain.label,
      image: pair.info?.imageUrl || null,
    },
    market: {
      price: isBase ? Number(pair.priceUsd) || null : null,
      liquidity: pair.liquidity?.usd ?? null,
      volume24h: pair.volume?.h24 ?? null,
      change24h: pair.priceChange?.h24 ?? null,
      fdv: pair.fdv ?? null,
      dex: pair.dexId,
      pairUrl: pair.url,                                   // DexScreener chart link
    },
    history,                                               // NEW: { sinceLaunchPct, fromAthPct, ... } or null
    holders: scan?.holder_count ? Number(scan.holder_count) : null,
    checks,
    counts,
    verdict,                                               // green | yellow | red
    checkedAt: new Date().toISOString(),
  };
}