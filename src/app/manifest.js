// app/manifest.js: the app's ID card (name, icons, colours, how it opens)
export default function manifest() {
  return {
    name: "GOAT | Greatest Of All Trades",           // full name (install screen, app info)
    short_name: "GOAT",                              // name under the home-screen icon
    description: "Live markets, a safety-checked Launch Radar for new coins, and a trading community.",
    id: "/",                                         // the app's permanent identity
    start_url: "/?source=app",                       // where the app opens (?source=app tells us it came from the icon)
    scope: "/",                                      // every GOAT page stays inside the app
    display: "standalone",                           // full screen, no browser address bar
    orientation: "portrait",                         // phone-first
    background_color: "#0B1210",                     // splash screen colour while it loads (GOAT night)
    theme_color: "#0B1210",                          // status bar colour inside the app
    categories: ["finance", "news", "social"],       // used by app stores
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }, // Android can crop this one into any shape
    ],
    shortcuts: [                                     // long-press the icon → jump straight in
      { name: "Launch Radar", url: "/radar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Community", url: "/community", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Markets", url: "/markets", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}