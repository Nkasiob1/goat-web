// src/app/twitter-image.js
// X (Twitter) looks for twitter-image. We reuse the exact same picture code.
export { default } from "./opengraph-image";              // the same drawing function

export const alt = "GOAT: Check any coin before you buy"; // these three must be written here too
export const size = { width: 1200, height: 630 };         // (Next.js reads them from each file directly)
export const contentType = "image/png";