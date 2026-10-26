// src/app/manifest.js: tells phones how to install and open GOAT as an app
export default function manifest() {
  return {
    name: "GOAT",                                         // shown on the system splash: short and clean
    short_name: "GOAT",                                   // shown under the home-screen icon
    description: "Check any coin before you buy: free rug-pull checks, a new-coin radar, live markets and news.", // CHANGED: leads with Vet
    id: "/",                                              // the app's permanent identity
    start_url: "/",                                       // page the app opens on
    scope: "/",                                           // every page belongs to the app
    display: "standalone",                                // no browser bar: feels like a real app
    orientation: "portrait",                              // phone app, upright
    background_color: "#0B1210",                          // system splash colour = our animation's colour (seamless)
    theme_color: "#0B1210",                               // status bar colour
    categories: ["finance"],
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },               // CHANGED: gold tile, drawn in code
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },               // CHANGED
      { src: "/app-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" }, // CHANGED: goat inside the safe zone; phones crop to their own shape
    ],
    shortcuts: [                                          // long-press the app icon to see these
      { name: "Vet a coin", url: "/vet", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },  // CHANGED: Vet first (our main feature) + new icon
      { name: "Radar", url: "/radar", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Markets", url: "/markets", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
    ],
  };
}