// src/app/manifest.js: tells phones how to install and open GOAT as an app
export default function manifest() {
  return {
    name: "GOAT",                                         // shown on the system splash: short and clean
    short_name: "GOAT",                                   // shown under the home-screen icon
    description: "Check any coin before you buy: free rug-pull checks, a new-coin radar, live markets and news.",
    id: "/",                                              // the app's permanent identity
    start_url: "/",                                       // page the app opens on
    scope: "/",                                           // every page belongs to the app
    lang: "en",                                           // the app's main language
    dir: "ltr",                                           // reading direction, left to right
    display: "standalone",                                // no browser bar: feels like a real app
    display_override: ["standalone"],                     // always open as a standalone app
    orientation: "portrait",                              // phone app, upright
    background_color: "#0B1210",                          // system splash colour = our animation's colour (seamless)
    theme_color: "#0B1210",                               // status bar colour
    categories: ["finance", "utilities"],                 // a safety tool, not just finance
    prefer_related_applications: false,                   // "the web app IS the app"
    launch_handler: {                                     // what happens if GOAT is opened while already open
      client_mode: ["navigate-existing", "auto"],         // reuse the open window and go to the new page
    },
    share_target: {                                       // GOAT appears in the phone's Share menu
      action: "/vet",                                     // shared text opens the Vet page...
      method: "GET",                                      // ...as /vet?q=<what was shared>
      params: { title: "title", text: "q", url: "url" },  // the shared text becomes ?q= (Vet finds the address in it)
    },
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },               // gold tile, drawn in code
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" }, // goat inside the safe zone
    ],
    screenshots: [                                        // NEW: shown in the install dialog and app-store listings
      {
        src: "/screenshots/home.jpg",                     // the file in public/screenshots/
        sizes: "1080x2316",                               // must match the picture's real pixel size exactly
        type: "image/jpeg",                               // .jpg files are "image/jpeg"
        form_factor: "narrow",                            // "narrow" = a phone screenshot
        label: "Check any coin before you buy, with live verdicts", // read aloud by screen readers, shown by some stores
      },
      {
        src: "/screenshots/vet.jpg",
        sizes: "1080x2316",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "A fake Bitcoin token flagged High risk in seconds",
      },
      {
        src: "/screenshots/community.jpg",
        sizes: "1080x2316",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Talk markets with other traders in the GOAT community",
      },
    ],
    shortcuts: [                                          // long-press the app icon to see these
      { name: "Vet a coin", url: "/vet", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Radar", url: "/radar", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
      { name: "Markets", url: "/markets", icons: [{ src: "/app-icon/192", sizes: "192x192" }] },
    ],
  };
}