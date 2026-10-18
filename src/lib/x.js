// src/lib/x.js
// Posts radar alerts to X (@GOATSRADAR) using OAuth 1.0a request signing.
// It never throws, so a problem with X can never break the radar run.

import crypto from "node:crypto"; // Node's built-in crypto: random nonces + HMAC-SHA1 signing

const API = "https://api.x.com/2"; // base address of the X API v2
const DAILY_LIMIT = Number(process.env.X_DAILY_LIMIT || 10); // max X posts per 24h (cost control)

// ---------- helpers ----------

// enc: percent-encode text exactly the way OAuth demands (RFC 3986).
// encodeURIComponent leaves ! ' ( ) * alone, so we encode those too.
function enc(value) {
  return encodeURIComponent(String(value)).replace(
    /[!'()*]/g, // the five characters encodeURIComponent skips
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase() // turn each into %XX
  );
}

// xKeys: read the 4 secrets from the environment.
// Returns null if any is missing, so the caller can skip quietly.
function xKeys() {
  const keys = {
    consumerKey: process.env.X_API_KEY, // the app's "API Key"
    consumerSecret: process.env.X_API_SECRET, // the app's "API Key Secret"
    token: process.env.X_ACCESS_TOKEN, // @GOATSRADAR's access token
    tokenSecret: process.env.X_ACCESS_SECRET, // @GOATSRADAR's access token secret
  };
  return Object.values(keys).every(Boolean) ? keys : null; // all four present, or null
}

// oauthHeader: build the signed "Authorization: OAuth ..." header for one request.
// Our JSON and multipart bodies are NOT part of the signature, only these oauth_ fields.
function oauthHeader(method, url, keys) {
  const params = {
    oauth_consumer_key: keys.consumerKey, // which app is calling
    oauth_nonce: crypto.randomBytes(16).toString("hex"), // random one-time value (blocks replays)
    oauth_signature_method: "HMAC-SHA1", // the signing method X expects
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(), // current time in seconds
    oauth_token: keys.token, // which account the app is acting for
    oauth_version: "1.0", // OAuth version
  };

  // 1) sort the params alphabetically and join them as key=value&key=value
  const paramString = Object.keys(params)
    .sort() // OAuth requires alphabetical order
    .map((k) => `${enc(k)}=${enc(params[k])}`) // encode each key and value
    .join("&"); // glue them together

  // 2) the "sentence" we sign: METHOD & encoded URL & encoded params
  const baseString = [method.toUpperCase(), enc(url), enc(paramString)].join("&");

  // 3) the signing key is the two secrets joined by &
  const signingKey = `${enc(keys.consumerSecret)}&${enc(keys.tokenSecret)}`;

  // 4) HMAC-SHA1 fingerprint, base64-encoded; this is all X ever sees
  params.oauth_signature = crypto
    .createHmac("sha1", signingKey) // make a signer with our secret key
    .update(baseString) // feed it the sentence
    .digest("base64"); // output the fingerprint as text

  // 5) format as: OAuth key="value", key="value", ...
  return (
    "OAuth " +
    Object.keys(params)
      .sort()
      .map((k) => `${enc(k)}="${enc(params[k])}"`)
      .join(", ")
  );
}

// money: 45210 -> "$45.2K", 1200000 -> "$1.2M"
function money(n) {
  const v = Number(n); // make sure it's a number
  if (!Number.isFinite(v) || v <= 0) return null; // nothing useful to show
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`; // billions
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`; // millions
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`; // thousands
  return `$${v.toFixed(0)}`; // small amounts
}

// cashtag: "pepe" -> "$PEPE" (clickable on X). Odd symbols stay plain text.
function cashtag(symbol) {
  const s = String(symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); // letters/digits only
  if (!s) return "this coin"; // no symbol at all
  return /^[A-Z][A-Z0-9]{0,9}$/.test(s) ? `$${s}` : s; // cashtags must start with a letter
}

// pretty chain names for the post
const CHAINS = {
  solana: "Solana",
  ethereum: "Ethereum",
  eth: "Ethereum",
  bsc: "BNB Chain",
  base: "Base",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
};

// capitalise the first letter: "bybit" -> "Bybit"
function title(word) {
  const w = String(word || "");
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// ---------- the post text ----------

// formatTweet: turn a radar_tokens row into post text.
// NO links on purpose: a post with a URL costs about 13x more on pay-per-use.
export function formatTweet(t) {
  const tag = cashtag(t.symbol); // e.g. $PEPE
  const name = t.name && t.name !== t.symbol ? ` (${t.name})` : ""; // add the name if it's different

  // exchange listing (Binance / Bybit / OKX)
  if (t.safety === "listed") {
    return [
      `🚨 New listing on ${title(t.source)}`, // e.g. "New listing on Bybit"
      ``,
      `${tag}${name}`, // the coin
      ``,
      `Caught by the GOAT Radar as soon as it went live.`, // what we do
      ``,
      `Live radar + instant alerts: link in bio`, // the bio holds the link (free)
      `Not financial advice.`,
      `#crypto #${title(t.source)}`, // hashtags help discovery
    ].join("\n");
  }

  // new DEX coin that passed the safety checks
  if (t.safety === "green") {
    const chain = CHAINS[String(t.chain || "").toLowerCase()] || title(t.chain); // pretty chain
    const cap = money(t.market_cap_usd);                    // NEW: market cap first...
    const fdv = cap ? null : money(t.fdv_usd);              // NEW: ...FDV only if market cap is missing
    const liq = money(t.liquidity_usd); // liquidity
    const vol = money(t.volume_24h); // 24h volume
    return [
      `🟢 New coin passed GOAT safety checks`,
      ``,
      `${tag}${name}${chain ? ` on ${chain}` : ""}`,
      cap ? `🏦 Market cap: ${cap}` : null,                  // NEW
      fdv ? `🏦 FDV: ${fdv}` : null,                         // NEW: honest label when it's FDV
      liq ? `💧 Liquidity: ${liq}` : null, // only show lines we have data for
      vol ? `📊 24h volume: ${vol}` : null,
      `🛡 Contract scanned: no honeypot flags`,
      ``,
      `Full safety check + live radar: link in bio`,       // CHANGED: mentions the checker too
      `Not financial advice. DYOR.`,
      `#crypto #${chain ? chain.replace(/\s/g, "") : "altcoins"}`,
    ]
      .filter((line) => line !== null) // drop the missing-data lines
      .join("\n");
  }

  return null; // yellow / red / pending: never posted to X
}

// ---------- the two API calls ----------

// uploadImage: download our radar card, upload it to X, get back a media id.
async function uploadImage(imageUrl, keys) {
  const img = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) }); // fetch the card (15s max)
  if (!img.ok) throw new Error(`card image ${img.status}`); // card route failed

  const form = new FormData(); // multipart form, like a file-upload form
  const blob = new Blob([await img.arrayBuffer()], { type: "image/png" }); // image bytes
  form.append("media", blob, "goat-radar.png"); // the file itself
  form.append("media_category", "tweet_image"); // tells X it's for a post
  form.append("media_type", "image/png"); // the file type

  const url = `${API}/media/upload`; // v2 upload endpoint
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: oauthHeader("POST", url, keys) }, // signed; fetch adds the form boundary itself
    body: form,
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => ({})); // parse the reply safely
  if (!res.ok) throw new Error(`upload ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.data?.id || json.media_id_string; // the media id
}

// sendTweet: post text (+ optional picture). Always returns an object, never throws.
export async function sendTweet(text, imageUrl) {
  const keys = xKeys(); // get the 4 secrets
  if (!keys) return { skipped: true, reason: "X keys not set" }; // quiet skip

  let mediaId = null; // stays null if the upload fails
  if (imageUrl) {
    try {
      mediaId = await uploadImage(imageUrl, keys); // step 1: the picture
    } catch (err) {
      console.error("X image upload failed:", err.message); // log it, then post text only
    }
  }

  const body = { text }; // the post text
  if (mediaId) body.media = { media_ids: [mediaId] }; // attach the picture if we have one

  const url = `${API}/tweets`; // v2 create-post endpoint
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: oauthHeader("POST", url, keys), // signed request
        "Content-Type": "application/json", // we're sending JSON
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status, // 401 keys, 403 read-only, 402/429 credits or limits
        error: json.detail || json.title || JSON.stringify(json).slice(0, 200),
      };
    }
    return { ok: true, id: json.data?.id, withImage: Boolean(mediaId) }; // success
  } catch (err) {
    return { ok: false, error: err.message }; // network failure or timeout
  }
}

// ---------- what run.js calls ----------

// postRadarToX: daily cap -> format -> post -> remember. One line to call from run.js.
export async function postRadarToX(supabase, token, imageUrl) {
  if (!xKeys()) return { skipped: true, reason: "X keys not set" }; // keys missing: do nothing
  if (token.x_posted_at) return { skipped: true, reason: "already on X" }; // never double-post

  const text = formatTweet(token); // build the post
  if (!text) return { skipped: true, reason: `safety ${token.safety}` }; // not postable

  // count how many coins went to X in the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("radar_tokens")
    .select("id", { count: "exact", head: true }) // count only, no rows downloaded
    .gte("x_posted_at", since);
  if (error) return { ok: false, error: error.message };
  if ((count ?? 0) >= DAILY_LIMIT) return { skipped: true, reason: "daily X limit reached" };

  const result = await sendTweet(text, imageUrl); // post it

  if (result.ok) {
    await supabase
      .from("radar_tokens")
      .update({ x_posted_at: new Date().toISOString() }) // stamp it so it isn't posted again
      .eq("id", token.id);
  }
  return result; // shown in the radar's JSON response
}