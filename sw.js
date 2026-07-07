const cacheName = "manav-portfolio-v1";
const assets = [
  "./",
  "./index.html",
  "./404.html",
  "./css/styles.css",
  "./js/main.js",
  "./js/modules/theme.js",
  "./js/modules/scroll.js",
  "./js/modules/typing.js",
  "./js/modules/motion.js",
  "./js/modules/particles.js",
  "./js/modules/projects.js",
  "./js/modules/carousel.js",
  "./js/modules/command-palette.js",
  "./js/modules/contact.js",
  "./images/project-nexus.svg",
  "./images/project-pulse.svg",
  "./images/project-orbit.svg",
  "./icons/favicon.svg",
  "./assets/og-image.svg",
  "./site.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("./404.html")))
  );
});
