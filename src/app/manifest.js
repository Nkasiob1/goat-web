// src/app/manifest.js: tells phones how to install and open GOAT as an app
export default function manifest() {
  return {
    name: "GOAT",                                         // shown on the system splash: short and clean
    short_name: "GOAT",                                   // shown under the home-screen icon
    description: "Greatest Of All Trades: live markets, a new-coin radar and a free token safety checker.",
    id: "/",                                              // the app's permanent identity
    start_url: "/",                                       // page the app opens on
    scope: "/",                                           // every page belongs to the app
    display: "standalone",                                // no browser bar: feels like a real app
    orientation: "portrait",                              // phone app, upright
    background_color: "#0B1210",                          // system splash colour = our animation's colour (seamless)
    theme_color: "#0B1210",                               // status bar colour
    categories: ["finance"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },        // round coin, transparent
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-dark-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" }, // NEW: coin on dark green
      { src: "/icons/icon-maskable-dark-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }, // phones crop this into their own shape
    ],
    shortcuts: [                                          // long-press the app icon to see these
      { name: "Radar", url: "/radar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Vet a coin", url: "/vet", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Markets", url: "/markets", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}