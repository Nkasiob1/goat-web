import { cacheLife } from "next/cache";

export const RULES = {                                   // GOAT's quality filter
  minLiquidity: 20000,                                   // dollars in the pool
  minVolume: 5000,                                       // dollars traded in 24 hours
  minTrades: 50,                                         // buys + sells in 24 hours
  maxDrop: -80,                                          // % change; worse = collapsed
  maxAgeHours: 24,                                       // NEW: only coins listed in the last 24 hours
};

const BASE = "https://api.geckoterminal.com/api/v2/networks";
const SOURCES = [                                        // 4 requests per refresh, inside the free limit
  `${BASE}/new_pools?include=base_token,network&page=1`,      // brand-new listings
  `${BASE}/new_pools?include=base_token,network&page=2`,
  `${BASE}/trending_pools?include=base_token,network&page=1`, // pools with the most activity right now
  `${BASE}/trending_pools?include=base_token,network&page=2`,
];

async function fetchSource(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { data: [], included: [] };        // one failed source shouldn't break the rest
  return res.json();
}

export async function getNewPools() {
  "use cache";
  cacheLife("minutes");

  try {
    const pages = await Promise.all(SOURCES.map(fetchSource)); // fetch all 4 at the same time

    const lookup = {};
    for (const page of pages) {
      for (const item of page.included ?? []) lookup[item.id] = item.attributes;
    }

    const now = Date.now();                              // the moment this refresh ran
    const maxAgeMs = RULES.maxAgeHours * 60 * 60 * 1000; // 24 hours in milliseconds

    const pools = pages.flatMap((page) => page.data ?? []).map((pool) => {
      const a = pool.attributes;
      const tokenId = pool.relationships.base_token.data.id;
      const networkId = pool.relationships.network.data.id;
      const token = lookup[tokenId] ?? {};
      const network = lookup[networkId] ?? {};
      const tx = a.transactions?.h24 ?? { buys: 0, sells: 0 };

      return {
        id: pool.id,
        tokenId,
        name: token.name ?? a.name,
        symbol: token.symbol ?? "",
        network: network.name ?? networkId,
        networkId,
        address: a.address,
        price: Number(a.base_token_price_usd ?? 0),
        change: Number(a.price_change_percentage?.h24 ?? 0),
        liquidity: Number(a.reserve_in_usd ?? 0),
        volume: Number(a.volume_usd?.h24 ?? 0),
        txns: tx.buys + tx.sells,
        createdAt: a.pool_created_at,
      };
    });

    const passed = pools.filter((p) =>
      now - new Date(p.createdAt).getTime() <= maxAgeMs && // NEW: listed within the last 24 hours
      p.liquidity >= RULES.minLiquidity &&
      p.volume >= RULES.minVolume &&
      p.txns >= RULES.minTrades &&
      p.change > RULES.maxDrop
    );

    const best = {};                                     // one row per token: keep its deepest pool
    for (const p of passed) {                            // (a coin can appear in both "new" and "trending")
      if (!best[p.tokenId] || p.liquidity > best[p.tokenId].liquidity) best[p.tokenId] = p;
    }

    return Object.values(best)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
  } catch {
    return [];
  }
}