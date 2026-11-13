// src/lib/paystack.js
// Talking to Paystack (server only). Money goes to GOATWATCH TECHNOLOGIES' business account, set up in Paystack.
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.paystack.co";
const key = () => process.env.PAYSTACK_SECRET_KEY;          // sk_test_... while testing, sk_live_... when live. Never NEXT_PUBLIC_.

async function paystack(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.status) throw new Error(json.message || `Paystack error ${res.status}`);
  return json.data;
}

// Start a payment: Paystack returns a checkout page (card, bank transfer, USSD) to send the person to
export const initTransaction = ({ email, amountKobo, reference, metadata, callbackUrl }) =>
  paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email, amount: amountKobo, currency: "NGN", reference, metadata, callback_url: callbackUrl }),
  });

// Ask Paystack directly whether a payment really succeeded (never trust the browser)
export const verifyTransaction = (reference) => paystack(`/transaction/verify/${encodeURIComponent(reference)}`);

// Webhooks: Paystack signs the raw body with our secret key (HMAC SHA-512)
export function signatureIsValid(rawBody, header) {
  if (!header || !key()) return false;
  const expected = createHmac("sha512", key()).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(header));
  return a.length === b.length && timingSafeEqual(a, b);
}
