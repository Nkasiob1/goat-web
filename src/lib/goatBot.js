import { getNewPools } from "./scanner";
import { getNews } from "./news";
import {
  fetchImage, findArticleImage, toDataUrl, uploadImage, removeImage,
  listingCard, newsCard, CARD_COLORS,
} from "./botImages";

const LIMITS = { scanner: 1, news: 1 };                  // per run (hourly)
const PHOTO_TRIES = 3;                                   // NEW: try up to 3 headlines for a real photo before using a card
const NEWS_MAX_AGE_HOURS = 12;
const MEMORY_DAYS = 3;

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const usd = (n) => "$" + compact.format(n);

const NEWS_COINS = [
  ["BTC", /\bbitcoin\b|\bbtc\b/i],
  ["ETH", /\bethereum\b|\bether\b|\beth\b/i],
  ["SOL", /\bsolana\b/i],
  ["XRP", /\bxrp\b|\bripple\b/i],
  ["BNB", /\bbnb\b/i],
  ["DOGE", /\bdogecoin\b|\bdoge\b/i],
  ["ADA", /\bcardano\b/i],
];

function cashtag(symbol) {
  const s = (symbol ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{2,10}$/.test(s) ? s : null;
}

function ageText(createdAt) {
  const mins = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
  return mins < 60 ? "under an hour ago" : `${Math.round(mins / 60)}h ago`;
}

const httpsOnly = (url) => (typeof url === "string" && url.startsWith("https://") ? url : null);

function scannerCandidate(p, ctx) {
  const coin = cashtag(p.symbol);
  const body = [
    `New listing on ${p.network}: ${p.name}${coin ? ` $${coin}` : ""}`,
    `Liquidity ${usd(p.liquidity)} · 24h volume ${usd(p.volume)} · ${p.txns} trades · listed ${ageText(p.createdAt)}`,
    `Passed the GOAT liquidity filter. Not financial advice, always DYOR.`,
  ].join("\n").slice(0, 500);

  async function picture() {                             // listings always get our designed card
    const raw = p.image ? await fetchImage(p.image) : null;
    const logo = raw && raw.type !== "image/webp" ? toDataUrl(raw) : null;
    const card = await listingCard({
      mark: ctx.mark, logo, name: p.name, coin, network: p.network, host: ctx.host,
      stats: [
        { label: "Liquidity", value: usd(p.liquidity) },
        { label: "24h volume", value: usd(p.volume) },
        { label: "24h change", value: `${p.change >= 0 ? "+" : ""}${p.change.toFixed(1)}%`, color: p.change >= 0 ? CARD_COLORS.gain : CARD_COLORS.loss },
        { label: "Trades", value: compact.format(p.txns) },
      ],
    });
    return { ...card, source: "card" };
  }

  return {
    key: `pool:${p.id}`,
    body,
    coin,
    link: {
      url: `https://www.geckoterminal.com/${p.networkId}/pools/${p.address}`,
      title: `${p.name} chart on GeckoTerminal`.slice(0, 120),
    },
    picture,
  };
}

function newsCandidate(item, ctx) {
  const coin = NEWS_COINS.find(([, re]) => re.test(item.title))?.[0] ?? null;
  const body = [
    item.title.slice(0, 400),
    `via ${item.source}${coin ? ` · $${coin}` : ""}`,
  ].join("\n\n");

  async function picture(allowCard) {                    // CHANGED: the card is only allowed when we say so
    if (item.image) {
      const photo = await fetchImage(item.image);
      if (photo) return { ...photo, source: "article (feed)" };
    }
    const ogUrl = await findArticleImage(item.link);
    if (ogUrl) {
      const photo = await fetchImage(ogUrl);
      if (photo) return { ...photo, source: "article (page)" };
    }
    if (!allowCard) return null;                         // no real photo → let the caller try the next headline
    const card = await newsCard({ mark: ctx.mark, title: item.title, source: item.source, host: ctx.host });
    return { ...card, source: "card" };
  }

  return {
    key: `news:${item.id}`,
    body,
    coin,
    link: { url: item.link, title: `Read the full story on ${item.source}` },
    picture,
  };
}

export async function runBot(db, goatId, { origin }) {
  if (!goatId) throw new Error("Missing GOAT_USER_ID");

  const { data: goat } = await db.from("profiles").select("id").eq("id", goatId).maybeSingle();
  if (!goat) throw new Error("GOAT_USER_ID doesn't match any profile");

  const markImg = await fetchImage(`${origin}/goat-mark.svg`, ["image/svg+xml"]);
  const ctx = { mark: markImg ? toDataUrl(markImg) : null, host: new URL(origin).host };

  const pools = await getNewPools().catch(() => []);
  const news = await getNews().catch(() => []);
  const cutoff = Date.now() - NEWS_MAX_AGE_HOURS * 3600000;

  const candidates = {
    scanner: pools.map((p) => scannerCandidate(p, ctx)),
    news: news.filter((n) => new Date(n.date).getTime() >= cutoff).map((n) => newsCandidate(n, ctx)),
  };

  const since = new Date(Date.now() - MEMORY_DAYS * 86400000).toISOString();
  const { data: seen, error: seenError } = await db.from("bot_log").select("key").gte("created_at", since);
  if (seenError) throw seenError;
  const done = new Set(seen.map((r) => r.key));

  const posted = [];
  const skipped = [];

  for (const [kind, list] of Object.entries(candidates)) {
    let count = 0;
    let tries = 0;                                       // NEW: how many headlines we've looked at this run
    for (const c of list) {
      if (count >= LIMITS[kind]) break;
      if (done.has(c.key)) continue;
      tries++;

      const allowCard = kind !== "news" || tries > PHOTO_TRIES; // news: a card only after 3 photo-less tries

      let pic = null;
      try {
        pic = await c.picture(allowCard);
      } catch (err) {
        console.error("Picture failed:", err.message);
      }
      if (!pic && !allowCard) continue;                  // NEW: no photo → try the next headline (not remembered, may return later)

      let imageUrl = null;
      try {
        if (pic) imageUrl = await uploadImage(db, goatId, pic);
      } catch (err) {
        console.error("Upload failed, posting without a picture:", err.message);
      }

      const linkUrl = httpsOnly(c.link?.url);

      const { error } = await db.from("posts").insert({
        user_id: goatId,
        body: c.body,
        coin: c.coin,
        image_url: imageUrl,
        link_url: linkUrl,
        link_title: linkUrl ? c.link.title : null,
      });

      if (error) {
        if (imageUrl) await removeImage(db, imageUrl);
        if (error.code !== "23514") throw error;
      }

      await db.from("bot_log").insert({ key: c.key });
      done.add(c.key);

      if (error) { skipped.push({ key: c.key, reason: "blocked by post rules" }); continue; }
      posted.push({ kind, body: c.body, image: imageUrl, picture: pic?.source ?? "none", link: linkUrl });
      count++;
    }
  }

  return { posted, skipped };
}