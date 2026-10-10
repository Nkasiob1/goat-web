import Parser from "rss-parser";
import { cacheLife } from "next/cache";

const FEEDS = [
  { source: "CoinDesk", category: "crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", category: "crypto", url: "https://cointelegraph.com/rss" },
  { source: "Decrypt", category: "crypto", url: "https://decrypt.co/feed" },
  { source: "FXStreet", category: "forex", url: "https://www.fxstreet.com/rss/news" },
  { source: "CNBC", category: "stocks", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258" },
];

const parser = new Parser({
  customFields: {                                        // NEW: also read the image tags feeds use
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumb"],
    ],
  },
});

function pickImage(item) {                               // NEW: feeds hide the cover photo in different places
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image"))) {
    return item.enclosure.url;                           // <enclosure url="…jpg">
  }
  const media = [].concat(item.mediaContent ?? []).find((m) => m?.$?.url && (!m.$.medium || m.$.medium === "image"));
  if (media) return media.$.url;                         // <media:content url="…">
  if (item.mediaThumb?.$?.url) return item.mediaThumb.$.url; // <media:thumbnail url="…">
  const html = item["content:encoded"] ?? item.content ?? "";
  return html.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? null; // first <img> inside the article body
}

async function readFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "GOAT News Reader" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${feed.source} responded ${res.status}`);
  const parsed = await parser.parseString(await res.text());

  return parsed.items.slice(0, 15).map((item) => ({
    id: item.link,
    title: item.title?.trim(),
    link: item.link,
    date: item.isoDate ?? item.pubDate,
    image: pickImage(item),                              // NEW: cover photo URL (or null)
    source: feed.source,
    category: feed.category,
  }));
}

export async function getNews() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const results = await Promise.allSettled(FEEDS.map(readFeed));
  const items = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.link && item.date);

  if (items.length === 0) throw new Error("No news feeds responded");

  return items
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 60);
}