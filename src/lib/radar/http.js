// lib/radar/http.js: small helpers every radar source shares

// Pause for `ms` milliseconds (keeps us under free API rate limits)
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch a URL and return its JSON, or throw a clear error
export async function getJSON(url, { headers = {}, timeout = 8000 } = {}) {
  const controller = new AbortController();                      // a switch that can cancel the request
  const timer = setTimeout(() => controller.abort(), timeout);   // flip it if the site is too slow
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },       // ask for JSON, plus any extra headers
      signal: controller.signal,                                 // connect the cancel switch
      cache: "no-store",                                         // always fresh data
    });
    if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`); // e.g. "429 from api.geckoterminal.com"
    return await res.json();                                     // turn the body into an object
  } finally {
    clearTimeout(timer);                                         // stop the timer either way
  }
}