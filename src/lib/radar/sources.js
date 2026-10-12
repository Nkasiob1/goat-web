// lib/radar/sources.js: where new coins come from, and the rules they must pass
import { getJSON } from "./http"; // shared fetch helper

// Friendly names for the chains we cover
export const CHAIN_LABEL = {
  ethereum: "Ethereum",
  bsc: "BNB Chain",
  solana: "Solana",
  base: "Base",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
};

// GeckoTerminal's chain ids → ours
const GECKO_CHAIN = { eth: "ethereum", bsc: "bsc", solana: "solana", base: "base", arbitrum: "arbitrum", polygon_pos: "polygon" };

// The quality bar every DEX coin must clear
export const RULES = { minLiquidity: 20000, minVolume: 5000, maxAgeHours: 72 };

// Turn "123.4" or 123.4 into a number, and empty into null
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// One stable id per coin; EVM addresses are lowercased, Solana's are case-sensitive
const tokenId = (chain, address) => `${chain}:${chain === "solana" ? address : address.toLowerCase()}`;

// Does this candidate clear the bar?
export function passesRules(c) {
  if (!c.symbol || !c.address || !CHAIN_LABEL[c.chain]) return false;          // must be complete and on a chain we cover
  if ((c.liquidity_usd ?? 0) < RULES.minLiquidity) return false;               // too little money in the pool
  if (c.volume_24h !== null && c.volume_24h < RULES.minVolume) return false;   // too little trading (skipped when unknown)
  const age = (Date.now() - new Date(c.pair_created_at).getTime()) / 36e5;    // age in hours
  if (Number.isFinite(age) && age > RULES.maxAgeHours) return false;          // too old to be "new"
  return true;
}

// ----- GeckoTerminal: newest pools across all chains -----
export async function fromGecko() {
  const json = await getJSON(
    "https://api.geckoterminal.com/api/v2/networks/new_pools?include=base_token,network&page=1",
    { headers: { Accept: "application/json;version=20230302" } }               // their versioned JSON
  );
  const tokens = new Map(                                                       // token id → token details
    (json.included || []).filter((i) => i.type === "token").map((t) => [t.id, t.attributes])
  );
  return (json.data || [])
    .map((pool) => {
      const a = pool.attributes;                                                // pool numbers
      const network = pool.relationships?.network?.data?.id;                    // e.g. "eth"
      const chain = GECKO_CHAIN[network];                                       // e.g. "ethereum"
      const t = tokens.get(pool.relationships?.base_token?.data?.id) || {};     // the coin being launched
      if (!chain || !t.address) return null;                                    // skip chains we don't cover
      return {
        id: tokenId(chain, t.address),
        kind: "dex",
        chain,
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        source: "GeckoTerminal",
        pair_url: `https://www.geckoterminal.com/${network}/pools/${a.address}`,
        image_url: t.image_url && t.image_url !== "missing.png" ? t.image_url : null,
        liquidity_usd: num(a.reserve_in_usd),
        volume_24h: num(a.volume_usd?.h24),
        price_usd: num(a.base_token_price_usd),
        pair_created_at: a.pool_created_at,
      };
    })
    .filter(Boolean);                                                           // drop the skipped ones
}

// ----- DexScreener: newest token profiles, then their best pool -----
export async function fromDexScreener() {
  const profiles = await getJSON("https://api.dexscreener.com/token-profiles/latest/v1");
  const byChain = {};                                                           // chain → list of addresses
  for (const p of profiles || []) {
    if (!CHAIN_LABEL[p.chainId]) continue;                                      // only chains we cover
    (byChain[p.chainId] ||= []).push(p.tokenAddress);
  }
  const out = [];
  for (const [chain, addresses] of Object.entries(byChain)) {
    const pairs = await getJSON(
      `https://api.dexscreener.com/tokens/v1/${chain}/${addresses.slice(0, 30).join(",")}` // max 30 per call
    );
    const best = new Map();                                                     // address → deepest pool
    for (const pair of pairs || []) {
      const addr = pair.baseToken?.address;
      if (!addr) continue;
      const prev = best.get(addr);
      if (!prev || (pair.liquidity?.usd || 0) > (prev.liquidity?.usd || 0)) best.set(addr, pair);
    }
    for (const pair of best.values()) {
      out.push({
        id: tokenId(chain, pair.baseToken.address),
        kind: "dex",
        chain,
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        source: "DexScreener",
        pair_url: pair.url,
        image_url: pair.info?.imageUrl || null,
        liquidity_usd: num(pair.liquidity?.usd),
        volume_24h: num(pair.volume?.h24),
        price_usd: num(pair.priceUsd),
        pair_created_at: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
      });
    }
  }
  return out;
}

// ----- Birdeye: new Solana listings (only when BIRDEYE_API_KEY exists) -----
export async function fromBirdeye() {
  const key = process.env.BIRDEYE_API_KEY;                                      // server-only key
  if (!key) return [];                                                          // no key = quietly skip
  const json = await getJSON("https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=20", {
    headers: { "X-API-KEY": key, "x-chain": "solana" },
  });
  return (json.data?.items || []).map((t) => ({
    id: tokenId("solana", t.address),
    kind: "dex",
    chain: "solana",
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    source: "Birdeye",
    pair_url: `https://birdeye.so/token/${t.address}?chain=solana`,
    image_url: t.logoURI || null,
    liquidity_usd: num(t.liquidity),
    volume_24h: null,                                                           // Birdeye's list has no volume
    price_usd: null,
    pair_created_at: t.liquidityAddedAt || null,
  }));
}

// ----- Exchanges: full USDT coin lists, plus a trade link per coin -----
export const EXCHANGES = {
  Binance: {
    trade: (s) => `https://www.binance.com/en/trade/${s}_USDT`,
    async bases() {
      const list = await getJSON("https://api.binance.com/api/v3/ticker/price");  // every pair, e.g. BTCUSDT
      return list.map((t) => t.symbol).filter((s) => s.endsWith("USDT")).map((s) => s.slice(0, -4));
    },
  },
  Bybit: {
    trade: (s) => `https://www.bybit.com/en/trade/spot/${s}/USDT`,
    async bases() {
      const json = await getJSON("https://api.bybit.com/v5/market/instruments-info?category=spot");
      return (json.result?.list || [])
        .filter((i) => i.quoteCoin === "USDT" && i.status === "Trading")
        .map((i) => i.baseCoin);
    },
  },
  OKX: {
    trade: (s) => `https://www.okx.com/trade-spot/${s.toLowerCase()}-usdt`,
    async bases() {
      const json = await getJSON("https://www.okx.com/api/v5/public/instruments?instType=SPOT");
      return (json.data || [])
        .filter((i) => i.quoteCcy === "USDT" && i.state === "live")
        .map((i) => i.baseCcy);
    },
  },
};