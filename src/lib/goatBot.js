import { getNews } from "./news";                        // headlines from the RSS feeds
import { CHAIN_LABEL } from "./radar/sources";           // NEW: "solana" → "Solana"
import {
  fetchImage, findArticleImage, toDataUrl, uploadImage, removeImage,
  listingCard, newsCard, CARD_COLORS,
} from "./botImages";

const LIMITS = { radar: 1, news: 1 };                    // CHANGED: radar replaces raw scanner pools (per hourly run)
const PHOTO_TRIES = 3;                                   // try up to 3 headlines for a real photo before using a card
const NEWS_MAX_AGE_HOURS = 12;                           // ignore stale headlines
const RADAR_MAX_AGE_HOURS = 12;                          // NEW: only radar coins spotted in the last 12h
const MEMORY_DAYS = 3;                                   // how far back bot_log is checked for repeats

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const usd = (n) => (n === null || n === undefined ? "n/a" : "$" + compact.format(n)); // CHANGED: safe on missing numbers

const NEWS_COINS = [                                     // headline words → coin tag
  ["BTC", /\bbitcoin\b|\bbtc\b/i],
  ["ETH", /\bethereum\b|\bether\b|\beth\b/i],
  ["SOL", /\bsolana\b/i],
  ["XRP", /\bxrp\b|\bripple\b/i],
  ["BNB", /\bbnb\b/i],
  ["DOGE", /\bdogecoin\b|\bdoge\b/i],
  ["ADA", /\bcardano\b/i],
];

function cashtag(symbol) {                               // "pepe!" → "PEPE", junk → null
  const s = (symbol ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{2,10}$/.test(s) ? s : null;
}

function ageText(date) {                                 // CHANGED: handles a missing launch time
  if (!date) return "recently";
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (!Number.isFinite(mins)) return "recently";
  return mins < 60 ? "under an hour ago" : `${Math.round(mins / 60)}h ago`;
}

const httpsOnly = (url) => (typeof url === "string" && url.startsWith("https://") ? url : null);

// NEW: one radar coin (🟢 DEX coin or 🏛 exchange listing) → a post candidate
function radarCandidate(t, ctx) {
  const coin = cashtag(t.symbol);
  const isListing = t.kind === "cex";
  const chain = CHAIN_LABEL[t.chain] ?? t.chain;

  const body = (isListing
    ? [
        `🏛 ${coin ? `$${coin}` : t.symbol} just listed on ${t.source} (spot, USDT).`,
        `Spotted by GOAT Radar. New listings move fast. Not financial advice.`,
      ]
    : [
        `🟢 New on ${chain}: ${t.name || t.symbol}${coin ? ` $${coin}` : ""}`,
        `Liquidity ${usd(t.liquidity_usd)} · 24h volume ${usd(t.volume_24h)} · launched ${ageText(t.pair_created_at)}`,
        `Passed GOAT Radar safety checks: ${(t.safety_notes ?? []).join(", ") || "no red flags found"}.`,
        `Still high risk. Always DYOR.`,
      ]
  ).join("\n").slice(0, 500);                            // no contract address in the text: posts_no_wallets would block it

  async function picture() {                             // radar coins always get our designed card
    const raw = t.image_url ? await fetchImage(t.image_url) : null;
    const logo = raw && raw.type !== "image/webp" ? toDataUrl(raw) : null; // cards can't draw webp
    const card = await listingCard({
      mark: ctx.mark,
      logo,
      name: isListing ? t.symbol : t.name || t.symbol,
      coin,
      network: isListing ? `${t.source} · Spot` : chain,
      host: ctx.host,
      tag: isListing ? "EXCHANGE LISTING" : "SAFETY CHECKED",
      footer: isListing ? "Spotted by GOAT Radar · Not financial advice" : "Passed GOAT Radar checks · Still high risk · DYOR",
      stats: isListing
        ? [
            { label: "Exchange", value: t.source },
            { label: "Pair", value: "USDT" },
            { label: "Status", value: "Live", color: CARD_COLORS.gain },
          ]
        : [
            { label: "Liquidity", value: usd(t.liquidity_usd) },
            { label: "24h volume", value: usd(t.volume_24h) },
            { label: "Safety", value: "Passed", color: CARD_COLORS.gain },
          ],
    });
    return { ...card, source: "card" };
  }

  return {
    key: `radar:${t.id}`,                                // bot_log key, so the same coin is never posted twice
    body,
    coin,
    link: {
      url: t.pair_url,                                   // chart (DEX) or trade page (exchange)
      title: (isListing ? `Trade ${t.symbol} on ${t.source}` : `${t.name || t.symbol} chart`).slice(0, 120),
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

  async function picture(allowCard) {                    // the card is only allowed when we say so
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

// NEW: the radar's best recent finds, newest first
async function getRadarPicks(db) {
  const since = new Date(Date.now() - RADAR_MAX_AGE_HOURS * 3600000).toISOString();
  const { data, error } = await db
    .from("radar_tokens")
    .select("id, kind, chain, symbol, name, source, pair_url, image_url, liquidity_usd, volume_24h, pair_created_at, safety_notes")
    .in("safety", ["green", "listed"])                   // only 🟢 coins and 🏛 listings
    .gte("first_seen", since)
    .order("first_seen", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function runBot(db, goatId, { origin }) {
  if (!goatId) throw new Error("Missing GOAT_USER_ID");

  const { data: goat } = await db.from("profiles").select("id").eq("id", goatId).maybeSingle();
  if (!goat) throw new Error("GOAT_USER_ID doesn't match any profile");

  const markImg = await fetchImage(`${origin}/goat-mark.svg`, ["image/svg+xml"]);
  const ctx = { mark: markImg ? toDataUrl(markImg) : null, host: new URL(origin).host };

  const picks = await getRadarPicks(db).catch((err) => { // CHANGED: radar instead of raw pools
    console.error("Radar read failed:", err.message);
    return [];
  });
  const news = await getNews().catch(() => []);
  const cutoff = Date.now() - NEWS_MAX_AGE_HOURS * 3600000;

  const candidates = {
    radar: picks.map((t) => radarCandidate(t, ctx)),
    news: news.filter((n) => new Date(n.date).getTime() >= cutoff).map((n) => newsCandidate(n, ctx)),
  };

  const since = new Date(Date.now() - MEMORY_DAYS * 86400000).toISOString();
  const { data: seen, error: seenError } = await db.from("bot_log").select("key").gte("created_at", since);
  if (seenError) throw seenError;
  const done = new Set(seen.map((r) => r.key));          // everything posted in the last 3 days

  const posted = [];
  const skipped = [];

  for (const [kind, list] of Object.entries(candidates)) {
    let count = 0;
    let tries = 0;                                       // how many items we've looked at this run
    for (const c of list) {
      if (count >= LIMITS[kind]) break;
      if (done.has(c.key)) continue;                     // already posted → skip
      tries++;

      const allowCard = kind !== "news" || tries > PHOTO_TRIES; // news: a card only after 3 photo-less tries

      let pic = null;
      try {
        pic = await c.picture(allowCard);
      } catch (err) {
        console.error("Picture failed:", err.message);
      }
      if (!pic && !allowCard) continue;                  // no photo → try the next headline

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
        if (imageUrl) await removeImage(db, imageUrl);   // don't leave orphan pictures
        if (error.code !== "23514") throw error;         // 23514 = blocked by a post rule; anything else is a real error
      }

      await db.from("bot_log").insert({ key: c.key });   // remember it either way
      done.add(c.key);

      if (error) { skipped.push({ key: c.key, reason: "blocked by post rules" }); continue; }
      posted.push({ kind, body: c.body, image: imageUrl, picture: pic?.source ?? "none", link: linkUrl });
      count++;
    }
  }

  return { posted, skipped };
}