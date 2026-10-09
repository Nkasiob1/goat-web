/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,                 // the "noticeboard" caching we use in the scanner (keep)
  partialPrefetching: true,              // pre-loads pages before you click them (keep)
  allowedDevOrigins: ["192.168.1.228"],  // NEW: lets your phone on the same Wi-Fi load the dev JavaScript
  turbopack: {                           // tells the fast dev server how to process our CSS with Tailwind (keep)
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;