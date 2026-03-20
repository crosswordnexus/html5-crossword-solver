// CRITICAL: You MUST change this string (e.g., v3, v4) every time you deploy a new update!
const CACHE_NAME = "xw-solver-v2026.3.19.1";

const ASSETS = [
    "./",
    "./index.html",
    "./css/crosswordnexus.css",
    "./css/crossword.shared.css",
    "./css/crossword.mobile.css",
    "./js/crosswords.js",
    "./js/crossword.shared.js",
    "./js/crossword.mobile.js",
    "./lib/jquery.js",
    "./lib/jscrossword_combined.js",
    "./lib/lscache.min.js",
    "./manifest.json",
    "./images/xw-solve-icon-192.png",
    "./images/xw-solve-icon-512.png"
];

self.addEventListener("install", (event) => {
    // FIX 1: Forces this new worker to become the active one immediately, skipping the "waiting" phase
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener("activate", (event) => {
    // FIX 2: Wipe out the old, stale caches so the browser is forced to use the new one
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => clients.claim()) // FIX 3: Tells the new worker to take control of the currently open tabs immediately
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).catch(() => cached);
        })
    );
});
