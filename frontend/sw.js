const cacheName = "manav-portfolio-v22";
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
  "./js/modules/arcade-audio.js",
  "./js/modules/arcade-soundlab.js",
  "./js/modules/arcade-diagnostics.js",
  "./js/modules/arcade-reset-safety.js",
  "./js/modules/arcade-system-ui.js",
  "./js/modules/arcade-stats.js",
  "./js/modules/arcade-achievements.js",
  "./js/modules/arcade-customizer.js",
  "./js/machine-bg.js",
  "./project-arcade-os.html",
  "./project-nimo.html",
  "./project-toolverse.html",
  "./project-love-journey.html",
  "./project-promptai.html",
  "./project-shift-zero.html",
  "./project-nintendo.html",
  "./project-velora-bites.html",
  "./project-nike.html",
  "./images/nimo-preview.svg",
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
  "./images/arcade-home.webp",
  "./images/arcade-customize.webp",
  "./images/arcade-stats.webp",
  "./images/arcade-achievements.webp",
  "./images/arcade-soundlab.webp",
  "./images/arcade-diagnostics.webp",
  "./icons/favicon.svg",
  "./icons/apple-touch-icon.svg",
  "./assets/og-image.jpg",
  "./assets/og-image.svg",
  "./site.webmanifest",
  "./Manav-Agarwal-Resume.pdf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key.startsWith("manav-portfolio-") && key !== cacheName)
      .map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function validateAssetResponse(request, response) {
  const pathname = new URL(request.url).pathname.toLowerCase();
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const expectsScript = request.destination === "script" || pathname.endsWith(".js");
  const expectsStyle = request.destination === "style" || pathname.endsWith(".css");
  const scriptTypeValid = /javascript|ecmascript/.test(contentType);
  const styleTypeValid = contentType.includes("text/css");

  if ((expectsScript && !scriptTypeValid) || (expectsStyle && !styleTypeValid)) {
    return new Response("Resource returned an invalid content type.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  if (!response.ok) return response;

  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(cacheName);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match(event.request, { ignoreSearch: true }))
          || (await caches.match("./index.html"))
          || (await caches.match("./404.html"));
      }
    })());
    return;
  }

  const network = fetch(event.request).then(async (networkResponse) => {
    const response = validateAssetResponse(event.request, networkResponse);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(event.request, response.clone());
    }
    return response;
  }).catch(() => null);

  event.waitUntil(network.then(() => undefined));
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(async (cached) => {
      if (cached) return cached;
      return (await network) || new Response("Offline and resource is not cached.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    })
  );
});
