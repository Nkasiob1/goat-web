export function formatPrice(price) {
  if (price > 0 && price < 0.01) {                       // tiny prices: show every zero, plus 3 real digits
    const zeros = -Math.floor(Math.log10(price));        // 0.00000000117 → log10 ≈ -8.9 → 9 places to the first digit
    return "$" + price.toFixed(Math.min(zeros + 2, 20)); // 9 + 2 = 11 decimals → "0.00000000117"; capped at 20
  }
  return "$" + price.toLocaleString("en-US", {           // normal prices: $82,484.01 or $0.1234
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 4 : 2,
  });
}

export const volumeFormat = new Intl.NumberFormat("en-US", {  // $1.74B style for big numbers
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});