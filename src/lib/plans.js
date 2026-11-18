// src/lib/plans.js
// GOAT AI prices shown in the browser (pay page + pricing box). Display only:
// the SERVER decides the real price (PLANS in lib/aiAccess.js), so keep the two in step.
export const PLANS = [
  { id: "week", naira: 500 },                     // 7 days
  { id: "month", naira: 1500, best: true },       // 30 days (best value)
];

export const naira = (n) => "₦" + n.toLocaleString("en-NG"); // 1500 -> "₦1,500"
