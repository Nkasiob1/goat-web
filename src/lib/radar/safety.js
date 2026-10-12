// lib/radar/safety.js: GoPlus contract checks → green / yellow / red
import { getJSON } from "./http"; // shared fetch helper

// GoPlus uses numeric chain ids for EVM chains
const EVM_ID = { ethereum: 1, bsc: 56, base: 8453, arbitrum: 42161, polygon: 137 };

const on = (v) => v === "1" || v === 1;   // GoPlus flags are "1" (yes) or "0" (no)
const pct = (v) => Number(v || 0);        // taxes come as fractions: "0.05" = 5%

// Turn lists of problems into one verdict
function verdict(red, yellow) {
  if (red.length) return { safety: "red", notes: [...red, ...yellow] };    // any serious flag = red
  if (yellow.length) return { safety: "yellow", notes: yellow };           // only minor flags = yellow
  return { safety: "green", notes: ["No red flags found"] };               // clean
}

// Main entry: check one token
export async function checkSafety(token) {
  if (token.chain === "solana") return checkSolana(token.address);         // Solana has its own endpoint
  const id = EVM_ID[token.chain];
  if (!id) return { safety: "yellow", notes: ["Chain not covered by safety check"] };

  const json = await getJSON(
    `https://api.gopluslabs.io/api/v1/token_security/${id}?contract_addresses=${token.address}`
  );
  const r = json.result?.[token.address.toLowerCase()];                    // results are keyed by lowercase address
  if (!r) return { safety: "yellow", notes: ["No safety data yet"] };

  const red = [];
  const yellow = [];
  if (on(r.is_honeypot)) red.push("Honeypot: you may not be able to sell");
  if (on(r.cannot_sell_all)) red.push("Can't sell full balance");
  if (on(r.owner_change_balance)) red.push("Owner can change balances");
  if (on(r.hidden_owner)) red.push("Hidden owner");
  if (on(r.selfdestruct)) red.push("Contract can self-destruct");
  if (r.is_open_source === "0") red.push("Code not verified");
  const tax = Math.max(pct(r.buy_tax), pct(r.sell_tax));                   // the worse of buy/sell tax
  if (tax > 0.1) red.push(`High tax (${Math.round(tax * 100)}%)`);
  else if (tax > 0.03) yellow.push(`Tax ${Math.round(tax * 100)}%`);
  if (on(r.is_mintable)) yellow.push("Owner can mint more");
  if (on(r.transfer_pausable)) yellow.push("Trading can be paused");
  if (on(r.is_blacklisted)) yellow.push("Has a blacklist");
  if (on(r.is_proxy)) yellow.push("Upgradeable contract");
  return verdict(red, yellow);
}

// Solana tokens: different flags, same idea
async function checkSolana(address) {
  const json = await getJSON(
    `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`
  );
  const r = json.result?.[address];                                        // Solana addresses keep their case
  if (!r) return { safety: "yellow", notes: ["No safety data yet"] };

  const flag = (f) => on(f?.status);                                       // Solana flags look like { status: "1" }
  const red = [];
  const yellow = [];
  if (flag(r.freezable)) red.push("Owner can freeze wallets");
  if (flag(r.balance_mutable_authority)) red.push("Owner can change balances");
  if (flag(r.closable)) red.push("Token account can be closed");
  if (flag(r.mintable)) yellow.push("Owner can mint more");
  if (r.transfer_fee && Object.keys(r.transfer_fee).length) yellow.push("Has a transfer fee");
  return verdict(red, yellow);
}