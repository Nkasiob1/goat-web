export function formatPrice(price) {                     // $82,484.01 for big coins, $0.1234 for cheap ones
  return "$" + price.toLocaleString("en-US", {
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