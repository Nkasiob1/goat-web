// src/lib/company.js
// GOAT Company Check: red flags for "investment" platforms like CBEX.
// It never says a platform is safe or approved. It only lists what it found, with sources.
import dns from "node:dns/promises";                       // turns a website name into an IP address
import net from "node:net";                                // tells us whether a string is an IP address
import { supabase } from "./supabase";                     // read-only connection (the table allows reading only)

const SEC_CHECK_URL = "https://www.sec.gov.ng/cmos";        // SEC's own list of registered operators, shown on every result

// Ponzi phrases we look for on a platform's homepage (lower case)
const PONZI_PHRASES = [
  "guaranteed return", "guaranteed profit", "guaranteed income", // nobody can guarantee investment returns
  "double your money", "double your investment",                 // the CBEX promise
  "risk-free", "risk free", "no risk",                           // all investing has risk
  "daily profit", "daily return", "daily roi", "% daily", "% per day", // fixed daily returns = classic Ponzi maths
  "withdrawal fee", "verification fee", "unlock your withdrawal",      // the fee CBEX demanded after freezing
  "referral bonus", "refer and earn", "team bonus", "level bonus",     // paying to recruit = pyramid signature
];

// ---------- 1. Cleaning what the user typed ----------

// Turn "https://www.Example.com/login" or "example.com" into "example.com"; anything else returns null
export function toDomain(input) {
  const text = String(input || "").trim().toLowerCase();  // tidy the text
  if (!text.includes(".") || text.includes(" ")) return null; // a domain has a dot and no spaces
  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`); // let the URL parser do the work
    const host = url.hostname.replace(/^www\./, "");      // drop "www."
    if (net.isIP(host)) return null;                      // raw IP addresses are refused
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null; // only normal-looking names like name.com
    return host;
  } catch {
    return null;                                          // not a valid web address
  }
}

// ---------- 2. Our own records (SEC warnings, approvals-in-principle) ----------

// Find a platform by exact domain or exact alias in the platforms table
export async function findPlatform(query, domain) {
  const name = String(query || "").trim();
  if (domain) {
    const { data } = await supabase.from("platforms").select("*").contains("domains", [domain]).limit(1); // exact domain match
    if (data?.length) return data[0];
  }
  const term = domain ? domain.split(".")[0] : name;      // "cbex.com" also searches the name "cbex"
  if (term.length < 3) return null;                       // too short to match a name safely
  const safe = term.toLowerCase().replace(/[^a-z0-9 .$-]/g, ""); // keep only plain characters (aliases are stored lower case)
  const { data } = await supabase
    .from("platforms")
    .select("*")
    .contains("aliases", [safe])                          // EXACT alias match only: "coin" must never match "Shalom Coin"
    .limit(1);
  return data?.[0] || null;
}

// ---------- 3. Website age (free public registry, RDAP) ----------

// How many days ago was this domain first registered? null if unknown
export async function domainAgeDays(domain) {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(6000),                  // give up after 6 seconds
      headers: { accept: "application/rdap+json" },
    });
    if (!res.ok) return null;                             // registry doesn't know this domain
    const json = await res.json();
    const reg = (json.events || []).find((e) => e.eventAction === "registration"); // the "created" event
    if (!reg?.eventDate) return null;
    return Math.floor((Date.now() - new Date(reg.eventDate).getTime()) / 86400000); // milliseconds -> days
  } catch {
    return null;                                          // network problem: just skip this check
  }
}

// ---------- 4. Reading the homepage safely ----------

// Is this IP address private or local? (we must never let users make our server visit internal machines)
function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:"); // local / mapped
  }
  const [a, b] = ip.split(".").map(Number);               // first two numbers of the IPv4 address
  return a === 10 || a === 127 || a === 0 ||              // private, loopback, "this network"
    (a === 169 && b === 254) ||                           // cloud metadata range
    (a === 172 && b >= 16 && b <= 31) ||                  // private
    (a === 192 && b === 168) ||                           // private (home routers)
    (a === 100 && b >= 64 && b <= 127) ||                 // carrier-grade NAT
    a >= 224;                                             // multicast and reserved
}

// Check a host name points only to public internet addresses
async function isPublicHost(host) {
  try {
    const records = await dns.lookup(host, { all: true }); // every address the name points to
    return records.length > 0 && records.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;                                         // name doesn't exist
  }
}

// Download up to ~300 KB of the homepage text, following at most 3 redirects, each one re-checked
export async function fetchHomepage(domain) {
  let url = `https://${domain}/`;
  for (let hop = 0; hop < 4; hop++) {
    const host = new URL(url).hostname;
    if (!(await isPublicHost(host))) return null;         // refuse anything that isn't a public website
    let res;
    try {
      res = await fetch(url, {
        redirect: "manual",                               // we follow redirects ourselves so each one is checked
        signal: AbortSignal.timeout(7000),
        headers: { "user-agent": "GOATWatch-CompanyCheck/1.0 (+https://goatwatch.app)" },
      });
    } catch {
      return null;                                        // site down or too slow
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location"), url).toString(); // where the redirect points
      if (!url.startsWith("https://") && !url.startsWith("http://")) return null;
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") || "").includes("text/html")) return null; // only web pages
    const reader = res.body.getReader();                  // read the page bit by bit
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 300000) {                        // stop after ~300 KB
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});                      // close the connection
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")        // drop code
      .replace(/<style[\s\S]*?<\/style>/gi, " ")          // drop styling
      .replace(/<[^>]+>/g, " ")                           // drop tags, keep words
      .replace(/\s+/g, " ")
      .toLowerCase();
  }
  return null;                                            // too many redirects
}

// Which Ponzi phrases appear in the text?
export function findPonziPhrases(text) {
  if (!text) return [];
  return PONZI_PHRASES.filter((p) => text.includes(p));
}

// ---------- 5. Putting it together ----------

// Main check: returns { verdict, name, domain, findings: [{ level, key, vars, source }], secCheckUrl }
export async function checkCompany(query) {
  const domain = toDomain(query);                         // null if they typed a name
  const findings = [];                                    // each finding: level = "fail" | "warn" | "info"

  const record = await findPlatform(query, domain);      // our sourced records first
  if (record) {
    const level = record.status === "arip_aip" ? "info" : "fail";
    findings.push({ level, key: `status.${record.status}`, vars: { date: record.source_date }, note: record.note, source: record.source_url });
  }

  if (domain) {
    const [age, text] = await Promise.all([domainAgeDays(domain), fetchHomepage(domain)]); // both at once, faster
    if (age !== null) {
      const months = Math.floor(age / 30);
      if (age < 365) findings.push({ level: "warn", key: "age.young", vars: { months: Math.max(1, months) } }); // under a year old
      else findings.push({ level: "info", key: "age.old", vars: { years: Math.floor(age / 365) } });
    } else {
      findings.push({ level: "info", key: "age.unknown" });
    }
    if (text === null) {
      findings.push({ level: "info", key: "site.unreadable" });
    } else {
      const phrases = findPonziPhrases(text);
      if (phrases.length) findings.push({ level: phrases.length >= 2 ? "fail" : "warn", key: "site.phrases", vars: { phrases: phrases.slice(0, 4).join(", ") } });
      else findings.push({ level: "info", key: "site.clean" });
    }
  }

  if (!record) findings.push({ level: "warn", key: "notInRecords" }); // we can't confirm registration ourselves

  const fails = findings.filter((f) => f.level === "fail").length;
  const warns = findings.filter((f) => f.level === "warn").length;
  const verdict = fails ? "red" : warns ? "yellow" : "green";      // green = no red flags found, never "safe"

  return { verdict, name: record?.name || domain || String(query).trim(), domain, findings, secCheckUrl: SEC_CHECK_URL };
}