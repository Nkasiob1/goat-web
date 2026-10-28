// src/app/manifest.js: tells phones how to install and open GOAT as an app
export default function manifest() {
  return {
    name: "GOAT",                                         // shown on the system splash: short and clean
    short_name: "GOAT",                                   // shown under the home-screen icon
    description: "Check any coin before you buy: free rug-pull checks, a new-coin radar, live markets and news.",
    id: "/",                                              // the app's permanent identity
    start_url: "/",                                       // page the app opens on
    scope: "/",                                           // every page belongs to the app
    lang: "en",                                           // NEW: the app's main language
    dir: "ltr",                                           // NEW: reading direction, left to right
    display: "standalone",                                // no browser bar: feels like a real app
    display_override: ["standalone"],                     // NEW: be explicit: always open as a standalone app
    orientation: "portrait",                              // phone app, upright
    background_color: "#0B1210",                          // system splash colour = our animation's colour (seamless)
    theme_color: "#0B1210",                               // status bar colour
    categories: ["finance", "utilities"],                 // CHANGED: + utilities (a safety tool, not just finance)
    prefer_related_applications: false,                   // NEW: "the web app IS the app", no separate native app to send people to
    launch_handler: {                                     // NEW: what happens if GOAT is opened while already open
      client_mode: ["navigate-existing", "auto"],         // reuse the open window and go to the new page (fallback: phone decides)
    },
    share_target: {                                       // NEW: GOAT appears in the phone's Share menu
      action: "/vet",                                     // shared text opens the Vet page...
      method: "GET",                                      // ...as a normal web address: /vet?q=<what was shared>
      params: {
        title: "title",                                   // a shared title (we ignore it)
        text: "q",                                        // the shared text becomes ?q=, and Vet pulls the contract address out of it
        url: "url",                                       // a shared link (we ignore it)
      },
    },
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },               // gold tile, drawn in code
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" }, // goat inside the safe zone
    ],
    shortcuts: [                                          // long-press the app icon to see these
      { name: "Vet a coin", url: "/vet", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Radar", url: "/radar", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Markets", url: "/markets", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
    ],
  };
}