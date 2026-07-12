const cacheName = "manav-portfolio-v13";
const assets = [
  "./",
  "./index.html",
  "./404.html",
  "./css/styles.css",
  "./css/intro.css",
  "./css/arcade-os.css",
  "./css/project-page.css",
  "./js/main.js",
  "./js/intro.js",
  "./js/arcade-os.js",
  "./js/arcade-apps.js",
  "./js/machine-bg.js",
  "./project-toolverse.html",
  "./project-selfyy.html",
  "./project-love-journey.html",
  "./project-promptai.html",
  "./project-shift-zero.html",
  "./project-nintendo.html",
  "./project-velora-bites.html",
  "./project-nike.html",
  "./images/toolverse_4.png",
  "./images/toolverse_about.png",
  "./images/toolverse_contact.png",
  "./images/toolverse_upload.png",
  "./images/love_1.png",
  "./images/promptai_new.png",
  "./images/sz_menu.png",
  "./images/nintendo.jpg",
  "./images/velora_mobile.png",
  "./images/velora_desktop.png",
  "./images/nike.png",
  "./images/project-nexus.svg",
  "./images/project-pulse.svg",
  "./icons/favicon.svg",
  "./icons/apple-touch-icon.svg",
  "./assets/og-image.jpg",
  "./assets/og-image.svg",
  "./site.webmanifest",
  "./resume.pdf"
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
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request).catch(() => caches.match("./404.html")))
  );
});
