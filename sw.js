const CACHE_NAME = "xw-solver-v1";
const ASSETS = [
  "./",
  "./css",
  "./js",
  "./lib",
  "./index.html",
  "./css/crosswordnexus.css",
  "./css/crossword.shared.css",
  "./css/crossword.mobile.css",
  "./jscrossword_combined.js",
  "./js/crosswords.js",
  "./js/crossword.shared.js",
  "./js/crossword.mobile.js",
  "./lib/jquery.js",
  "./lib/jscrossword_combined.js",
  "./lib/lscache.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
