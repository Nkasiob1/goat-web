import { cacheLife } from "next/cache";

export const RULES = {                                   // GOAT's quality filter; change a number here to tighten or loosen it
  minLiquidity: 20000,                                   // dollars in the pool
  minVolume: 5000,                                       // dollars traded in 24 hours
  minTrades: 50,                                         // buys + sells in 24 hours
  maxDrop: -80,                                          // % change; anything worse is treated as collapsed
};

const PAGES = [1, 2, 3];                                 // 3 pages × 20 pools = 60 pools scanned per minute

async function fetchPage(page) {                         // fetch one page of new pools
  const res = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/new_pools?include=base_token,network&page=${page}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return { data: [], included: [] };        // one failed page shouldn't break the rest
  return res.json();
}

export async function getNewPools() {
  "use cache";                                           // the noticeboard
  cacheLife("minutes");                                  // refreshed about once a minute

  try {
    const pages = await Promise.all(PAGES.map(fetchPage)); // fetch all 3 pages at the same time, not one after another

    const lookup = {};                                   // index token and network details by id
    for (const page of pages) {
      for (const item of page.included ?? []) lookup[item.id] = item.attributes;
    }

    const pools = pages.flatMap((page) => page.data ?? []).map((pool) => {  // flatMap joins the 3 lists into one
      const a = pool.attributes;
      const tokenId = pool.relationships.base_token.data.id;
      const networkId = pool.relationships.network.data.id;
      const token = lookup[tokenId] ?? {};
      const network = lookup[networkId] ?? {};
      const tx = a.transactions?.h24 ?? { buys: 0, sells: 0 };

      return {
        id: pool.id,
        tokenId,                                         // used to remove duplicates
        name: token.name ?? a.name,
        symbol: token.symbol ?? "",
        network: network.name ?? networkId,
        networkId,
        address: a.address,
        price: Number(a.base_token_price_usd ?? 0),
        change: Number(a.price_change_percentage?.h24 ?? 0),
        liquidity: Number(a.reserve_in_usd ?? 0),        // missing liquidity counts as 0, so it fails the filter
        volume: Number(a.volume_usd?.h24 ?? 0),
        txns: tx.buys + tx.sells,
        createdAt: a.pool_created_at,
      };
    });

    const passed = pools.filter((p) =>                   // keep only pools that pass EVERY rule
      p.liquidity >= RULES.minLiquidity &&
      p.volume >= RULES.minVolume &&
      p.txns >= RULES.minTrades &&
      p.change > RULES.maxDrop
    );

    const best = {};                                     // one row per token: keep its deepest pool
    for (const p of passed) {
      if (!best[p.tokenId] || p.liquidity > best[p.tokenId].liquidity) best[p.tokenId] = p;
    }

    return Object.values(best)                           // turn the {tokenId: pool} object back into a list
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
  } catch {
    return [];
  }
}