// src/lib/vet.js
// Token Safety Checker: find a coin (by name or address), vet its contract, and measure its price history.

const GOPLUS = "https://api.gopluslabs.io/api/v1";        // free contract scanner
const DEX = "https://api.dexscreener.com/latest/dex";      // free market data + search
const GECKO = "https://api.geckoterminal.com/api/v2";      // free price history (candles)
const CG = "https://api.coingecko.com/api/v3";             // official coin list + contracts

// DexScreener chain id -> label, GoPlus id, GeckoTerminal id, CoinGecko platform id
const CHAINS = {
  ethereum: { label: "Ethereum", goplus: "1", gecko: "eth", cg: "ethereum" },
  solana: { label: "Solana", goplus: "solana", gecko: "solana", cg: "solana" },
  bsc: { label: "BNB Chain", goplus: "56", gecko: "bsc", cg: "binance-smart-chain" },
  base: { label: "Base", goplus: "8453", gecko: "base", cg: "base" },
  arbitrum: { label: "Arbitrum", goplus: "42161", gecko: "arbitrum", cg: "arbitrum-one" },
  polygon: { label: "Polygon", goplus: "137", gecko: "polygon_pos", cg: "polygon-pos" },
  avalanche: { label: "Avalanche", goplus: "43114", gecko: "avax", cg: "avalanche" },
  optimism: { label: "Optimism", goplus: "10", gecko: "optimism", cg: "optimistic-ethereum" },
};
const CHAIN_ORDER = Object.keys(CHAINS);                   // preferred order when a coin lives on many chains

// CoinGecko platform id -> our chain id (the reverse of the cg field above)
const FROM_CG = Object.fromEntries(Object.entries(CHAINS).map(([id, c]) => [c.cg, id]));

// NEW: powers a central issuer (Tether, Circle...) holds BY DESIGN. Scary on a new coin, normal on USDT.
const ISSUER_POWERS = new Set([
  "Balance control",
  "Minting",
  "Mint authority",
  "Freeze authority",
  "Trading pause",
  "Tax control",
  "Blacklist",
  "Upgradeable",
  "Ownership",
]);
const ESTABLISHED_RANK = 200;                              // CoinGecko top 200 = established coin with a known issuer

// NEW (v2 rules): thresholds for the three upgrades, in one place so they're easy to tune
const YOUNG_HOURS = 48;                                    // "young" coin: launched in the last 2 days
const YOUNG_CRASH_WARN = -60;                              // young coin down 60%+ from its peak -> caution
const YOUNG_CRASH_FAIL = -90;                              // young coin down 90%+ from its peak -> classic rug shape
const OLD_CRASH_WARN = -90;                                // older coins: only flag 90%+ crashes (as before)
const FAKE_MIN_CAP = 1_000_000;                            // only judge valuations of $1M+
const FAKE_VOL_RATIO = 0.001;                              // under 0.1% of its value traded in 24h = suspicious
const FAKE_LIQ_RATIO = 100;                                // value more than 100x its liquidity = suspicious
const WHALE_WARN = 0.2;                                    // one wallet holds 20%+ of supply -> caution
const WHALE_FAIL = 0.5;                                    // one wallet holds 50%+ -> it can crash the price alone
const TOP10_WARN = 0.7;                                    // top 10 wallets hold 70%+ -> caution
const BURN = /^0x(0{40}|0{36}dead)$/i;                     // burn addresses (0x000…000 and 0x000…dEaD) don't count
const KEY_WARNS = new Set(["Price crash", "Valuation", "Holders"]); // any ONE of these warnings = no green

// Age text that matches the radar: "45m" under an hour, "5h" under a day
function ageLabel(hours) {
  return hours < 1 ? `${Math.max(1, Math.round(hours * 60))}m` : `${Math.round(hours)}h`;
}

// Is the text an EVM address? (0x + 40 hex characters)
export const isEvmAddress = (q) => /^0x[a-fA-F0-9]{40}$/.test(q);
// Is the text a Solana address? (32-44 base58 characters: no 0, O, I or l)
export const isSolAddress = (q) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q);

// Tidy whatever the user pasted. Finds an address anywhere in it, else cleans the name.
export function cleanQuery(raw) {
  const text = String(raw || "").trim();
  const evm = text.match(/0x[a-fA-F0-9]{40}/);             // an EVM address hiding inside brackets/text
  if (evm) return evm[0];
  const sol = text.split(/[^1-9A-HJ-NP-Za-km-z]+/).find((w) => w.length >= 32 && w.length <= 44); // a Solana address
  if (sol) return sol;
  return text.replace(/[^\p{L}\p{N}\s.-]/gu, "").trim();   // a name: drop $ ( ) and other symbols
}

// Fetch JSON with a 10-second limit (with optional extra headers)
async function getJSON(url, headers = {}) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),                    // give up after 10s
    headers: { accept: "application/json", ...headers },   // ask for JSON (+ any API key)
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} replied ${res.status}`);
  return res.json();
}

// CoinGecko key header (only if you added COINGECKO_API_KEY)
function cgHeaders() {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : {};
}

// Keep only pools on chains we support, deepest liquidity first
function supportedPairs(pairs) {
  return (pairs || [])
    .filter((p) => CHAINS[p.chainId])                      // drop unsupported chains
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)); // biggest pool first
}

// ---------- 1a. official coins from CoinGecko ----------
async function officialCoins(q) {
  try {
    const found = await getJSON(`${CG}/search?query=${encodeURIComponent(q)}`, cgHeaders());
    const ranked = (found.coins || []).filter((c) => c.market_cap_rank); // real, ranked coins only
    const wanted = q.toLowerCase();                        // what the user typed
    // only coins whose ticker or name EXACTLY matches the search ("usdt" -> Tether, not evaUSDT)
    const exact = ranked.filter((c) => c.symbol.toLowerCase() === wanted || c.name.toLowerCase() === wanted);
    const top = (exact.length ? exact : ranked.slice(0, 1)).slice(0, 2); // no exact match: just the best one

    const details = await Promise.all(                     // look up each coin's contracts at the same time
      top.map((c) =>
        getJSON(
          `${CG}/coins/${c.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
          cgHeaders()
        ).catch(() => null)                                // one failure doesn't sink the rest
      )
    );
    const out = [];
    top.forEach((c, i) => {
      const entries = Object.entries(details[i]?.platforms || {}) // { "ethereum": "0x...", "solana": "..." }
        .filter(([plat, addr]) => FROM_CG[plat] && addr)   // chains we support, with a real address
        .sort(([a], [b]) => CHAIN_ORDER.indexOf(FROM_CG[a]) - CHAIN_ORDER.indexOf(FROM_CG[b])); // all supported chains
      for (const [plat, addr] of entries) {
        const chain = FROM_CG[plat];
        out.push({
          chain,
          chainLabel: CHAINS[chain].label,
          address: addr,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          image: c.large || c.thumb || null,
          rank: c.market_cap_rank,                         // e.g. 3
          liquidity: null,                                 // not needed: it's the official one
          official: true,                                  // shows the ✓ Official badge
        });
      }
    });
    return out;
  } catch {
    return [];                                             // CoinGecko busy: fall back to DexScreener only
  }
}

// ---------- 1b. search by name or ticker ----------
export async function searchTokens(q) {
  const [official, dex] = await Promise.all([              // both sources at the same time
    officialCoins(q),
    getJSON(`${DEX}/search?q=${encodeURIComponent(q)}`).catch(() => ({ pairs: [] })),
  ]);

  const officialAddrs = new Set(official.map((o) => o.address.toLowerCase())); // the real contracts
  const officialSymbols = new Set(official.map((o) => o.symbol.toUpperCase())); // their tickers

  const seen = new Map();                                  // one entry per coin (not per pool)
  for (const p of supportedPairs(dex.pairs)) {
    if ((p.liquidity?.usd || 0) < 1000) continue;          // under $1K liquidity = noise
    const addr = p.baseToken.address;
    if (officialAddrs.has(addr.toLowerCase())) continue;   // already listed as official
    const key = `${p.chainId}:${addr.toLowerCase()}`;
    if (seen.has(key)) continue;                           // already kept its deepest pool
    seen.set(key, {
      chain: p.chainId,
      chainLabel: CHAINS[p.chainId].label,
      address: addr,
      symbol: p.baseToken.symbol,
      name: p.baseToken.name,
      image: p.info?.imageUrl || null,
      liquidity: p.liquidity?.usd ?? null,
      official: false,
      copycat: officialSymbols.has(String(p.baseToken.symbol).toUpperCase()), // same ticker, different contract
    });
  }

  return [...official, ...seen.values()].slice(0, 12);     // official first, then the rest
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

// ---------- 2c. market checks (DexScreener + price history + CoinGecko) ----------
function marketChecks(pair, history, listing, list) {
  // is this the contract CoinGecko lists? (info only: never changes the verdict)
  if (listing?.listed) add(list, "Listed on CoinGecko", "pass", listing.rank ? `Ranked #${listing.rank} by market cap.` : "Tracked by CoinGecko.");
  else if (listing && !listing.listed) add(list, "Listed on CoinGecko", "unknown", "Not listed. Most new coins aren't, but double-check you have the right contract.");

  const liq = pair.liquidity?.usd || 0;
  const liqText = "$" + Intl.NumberFormat("en-US", { notation: "compact" }).format(liq);
  if (liq < 10000) add(list, "Liquidity", "fail", `Only ${liqText}. Easy to manipulate and hard to exit.`);
  else if (liq < 50000) add(list, "Liquidity", "warn", `${liqText}. Thin, so big orders will move the price.`);
  else add(list, "Liquidity", "pass", `${liqText} in the main pool.`);

  const hours = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 36e5 : null; // age in hours (null = unknown)
  if (hours !== null) {
    if (hours < 24) add(list, "Age", "warn", `Launched ${ageLabel(hours)} ago. Most rugs happen early.`); // CHANGED: minutes under 1h
    else add(list, "Age", "pass", `Trading for ${Math.round(hours / 24)} days.`);
  }

  // CHANGED: price crash. Young coins are judged much more strictly: a big early drop is the rug shape.
  if (history) {
    const drop = history.fromAthPct;                       // e.g. -78
    const young = hours !== null && hours < YOUNG_HOURS;
    const pct = Math.abs(drop).toFixed(0);
    if (young && drop <= YOUNG_CRASH_FAIL) {
      add(list, "Price crash", "fail", `Down ${pct}% from its peak within ${ageLabel(hours)} of launch. Classic rug shape.`);
    } else if (young && drop <= YOUNG_CRASH_WARN) {
      add(list, "Price crash", "warn", `Down ${pct}% from its peak within ${ageLabel(hours)} of launch. Early holders may be dumping.`);
    } else if (!young && drop <= OLD_CRASH_WARN) {
      add(list, "Price crash", "warn", `Down ${pct}% from its peak. Early holders may have dumped.`);
    }
  }

  // NEW: fake valuation. A huge "market cap" that almost nobody trades, or that dwarfs the money in the pool,
  // is easy to fake with a tiny supply float. Established (top-200) coins are skipped.
  const established = listing?.listed && listing.rank && listing.rank <= ESTABLISHED_RANK;
  const cap = Number(pair.marketCap || pair.fdv) || 0;     // market cap, else FDV
  const vol = Number(pair.volume?.h24) || 0;
  if (!established && cap >= FAKE_MIN_CAP) {
    const fmt = (n) => "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
    if (vol < cap * FAKE_VOL_RATIO) {
      add(list, "Valuation", "warn", `Valued at ${fmt(cap)} but only ${fmt(vol)} traded in 24h. The value may be inflated.`);
    } else if (liq > 0 && cap > liq * FAKE_LIQ_RATIO) {
      add(list, "Valuation", "warn", `Valued at ${fmt(cap)} with only ${liqText} of liquidity. Most of that value can't actually be sold.`);
    }
  }
}

// ---------- NEW: holders (who owns the supply?) ----------
// EVM: GoPlus lists the top holders. We ignore contracts (pools, lockers), locked wallets and burn addresses,
// then flag a single whale or a top-10 that owns most of the supply.
// Solana: GoPlus gives no reliable holder data for new tokens yet, so we say so honestly (doesn't change the verdict).
function holderChecks(scan, isSolana, hours, listing, list) {
  const established = listing?.listed && listing.rank && listing.rank <= ESTABLISHED_RANK;
  if (established) return;                                 // big known coins: exchanges and issuers hold a lot, by design
  const young = hours !== null && hours < YOUNG_HOURS;

  if (isSolana) {
    if (young) add(list, "Holders", "unknown", "Top-holder data isn't available yet for this Solana token. Check the holders on the chart before buying.");
    return;
  }

  const raw = Array.isArray(scan?.holders) ? scan.holders : [];
  if (!raw.length) {
    if (young) add(list, "Holders", "warn", "GOAT couldn't see who holds the supply. Be extra careful with a new coin.");
    return;
  }

  let rows = raw
    .filter((h) => String(h.is_contract) !== "1" && String(h.is_locked) !== "1") // pools, lockers, vesting: not a dump risk
    .filter((h) => !BURN.test(String(h.address || "")))                         // burned tokens can't be sold
    .map((h) => Number(h.percent) || 0);
  if (rows.some((p) => p > 1)) rows = rows.map((p) => p / 100);                 // accept "12.5" as well as "0.125"

  const top = rows.length ? Math.max(...rows) : 0;
  const top10 = rows.slice(0, 10).reduce((a, b) => a + b, 0);
  const pct = (n) => `${(n * 100).toFixed(0)}%`;

  if (top >= WHALE_FAIL) add(list, "Holders", "fail", `One wallet holds ${pct(top)} of the supply. It can crash the price alone.`);
  else if (top >= WHALE_WARN) add(list, "Holders", "warn", `One wallet holds ${pct(top)} of the supply.`);
  else if (top10 >= TOP10_WARN) add(list, "Holders", "warn", `The top 10 wallets hold ${pct(top10)} of the supply.`);
  else add(list, "Holders", "pass", `Spread out: the biggest wallet holds ${pct(top)}.`);
}

// ---------- NEW: established coins (top 200) -> issuer powers become warnings, with context ----------
function softenIssuerPowers(checks, listing) {
  const established = listing?.listed && listing.rank && listing.rank <= ESTABLISHED_RANK; // e.g. USDT is #3
  if (!established) return false;                          // new/unknown coin: keep the strict verdict
  for (const c of checks) {
    if (!ISSUER_POWERS.has(c.label)) continue;             // honeypot, sell limits, liquidity: never softened
    if (c.status === "fail") c.status = "warn";            // ✕ -> ! for a known issuer
    if (c.status === "warn") c.detail += " Normal for a centrally issued coin, but the issuer holds this power.";
  }
  return true;                                             // tells the report this coin is established
}

// ---------- price history -> since launch % and from peak % ----------
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

    const first = candles.reduce((a, b) => (b[0] < a[0] ? b : a)); // the oldest candle = first trades
    const launchPrice = Number(first[1]);                  // its OPEN price
    if (!launchPrice) return null;

    const athPrice = Math.max(now, ...candles.map((c) => Number(c[2]) || 0)); // highest HIGH = the peak

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

// ---------- is this exact contract listed on CoinGecko? ----------
async function coingeckoListing(chain, address) {
  try {
    const coin = await getJSON(`${CG}/coins/${chain.cg}/contract/${address}`, cgHeaders());
    return { listed: true, rank: coin.market_cap_rank || null };
  } catch (err) {
    if (String(err.message).includes("404")) return { listed: false }; // 404 = genuinely not listed
    return null;                                           // busy/throttled = unknown (show nothing)
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

  // scan + price history + CoinGecko check, all at the SAME time
  const [scan, history, listing] = await Promise.all([
    scanContract(chain, address),
    isBase ? priceHistory(pair) : Promise.resolve(null),   // history only makes sense for the base token
    coingeckoListing(chain, address),
  ]);

  const checks = [];
  if (scan) (chain.goplus === "solana" ? solChecks : evmChecks)(scan, checks);
  else add(checks, "Contract scan", "unknown", "The scanner had no data for this token. Treat it with caution.");
  marketChecks(pair, history, listing, checks);
  const ageHours = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 36e5 : null; // NEW: shared with the holder check
  holderChecks(scan, chain.goplus === "solana", ageHours, listing, checks); // NEW: whales and missing holder data
  const established = softenIssuerPowers(checks, listing);  // USDT-style coins get context, not a false alarm

  // tally and decide the verdict
  const counts = { pass: 0, warn: 0, fail: 0, unknown: 0 };
  for (const c of checks) counts[c.status]++;
  // NEW: some warnings are serious enough on their own to block a green (a crash, a fake valuation, a whale)
  const keyWarn = checks.some((c) => c.status === "warn" && KEY_WARNS.has(c.label));
  const verdict = counts.fail > 0 ? "red" : !scan || counts.warn >= 2 || keyWarn ? "yellow" : "green"; // CHANGED: + keyWarn

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
    history,                                               // { sinceLaunchPct, fromAthPct, ... } or null
    listing,                                               // { listed, rank } or null
    established,                                           // NEW: true for top-200 coins
    holders: scan?.holder_count ? Number(scan.holder_count) : null,
    checks,
    counts,
    verdict,                                               // green | yellow | red
    checkedAt: new Date().toISOString(),
  };
}