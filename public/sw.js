// public/sw.js: runs in the background; shows a branded offline page when there's no network
const CACHE = "goat-v2";          // CHANGED: v2 = new logo; phones delete the v1 cache with the old icon
const OFFLINE = "/offline";       // the page we keep ready for no-network moments

// Install: save the offline page and an icon in advance
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "/icons/icon-192.png"])));
  self.skipWaiting();             // take over straight away
});

// Activate: delete old caches from earlier versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();           // control already-open pages too
});

// Fetch: only page loads are touched; prices, radar and API calls always go straight to the network
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;                           // not a page load → leave it alone
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE))); // online = live page; offline = our page
});