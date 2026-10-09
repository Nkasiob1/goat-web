import Parser from "rss-parser";
import { cacheLife } from "next/cache";

const FEEDS = [                                          // source name, category, and the feed address
  { source: "CoinDesk", category: "crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", category: "crypto", url: "https://cointelegraph.com/rss" },
  { source: "Decrypt", category: "crypto", url: "https://decrypt.co/feed" },
  { source: "FXStreet", category: "forex", url: "https://www.fxstreet.com/rss/news" },
  { source: "CNBC", category: "stocks", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258" },
];

const parser = new Parser();

async function readFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "GOAT News Reader" },       // some sites refuse requests that don't say who they are
    signal: AbortSignal.timeout(8000),                   // give up after 8 seconds, so one slow site can't stall the rest
  });
  if (!res.ok) throw new Error(`${feed.source} responded ${res.status}`);
  const parsed = await parser.parseString(await res.text()); // XML text → { items: [...] }

  return parsed.items.slice(0, 15).map((item) => ({      // keep each source's 15 newest
    id: item.link,                                       // the article address doubles as a unique id
    title: item.title?.trim(),
    link: item.link,
    date: item.isoDate ?? item.pubDate,                  // publish time
    source: feed.source,
    category: feed.category,
  }));
}

export async function getNews() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 }); // refresh about every 15 minutes

  const results = await Promise.allSettled(FEEDS.map(readFeed)); // allSettled: wait for all, even if some fail
  const items = results
    .filter((r) => r.status === "fulfilled")             // keep only the feeds that worked
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.link && item.date);

  if (items.length === 0) throw new Error("No news feeds responded"); // all failed: don't cache an empty page

  return items
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first, across all sources
    .slice(0, 60);
}