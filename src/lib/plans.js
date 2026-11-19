// src/lib/plans.js
// GOAT AI prices shown in the browser (pay page + pricing box). Display only:
// the SERVER decides the real price (PLANS in lib/aiAccess.js), so keep the two in step.
export const PLANS = [
  { id: "week", naira: 500 },                     // 7 days
  { id: "month", naira: 1500, best: true },       // 30 days (best value)
];

// NEW: GOAT Guard Pro for a Telegram group (display only; the server price is GUARD_PLAN in lib/guard.js)
export const GUARD_PLANS = [{ id: "guard_month", naira: 5000, best: true }];

export const naira = (n) => "₦" + n.toLocaleString("en-NG"); // 1500 -> "₦1,500"
