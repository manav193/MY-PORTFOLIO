const cacheName = "manav-portfolio-v24";
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
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("manav-portfolio-") && key !== cacheName)
      .map((key) => caches.delete(key)));

    await self.clients.claim();

    // A previous cache-first worker could keep an already-open tab on stale JS/CSS.
    // Reload controlled portfolio tabs once when this new worker takes over so the
    // next request is guaranteed to use the network-first strategy below.
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clients.map((client) => {
      try {
        const url = new URL(client.url);
        if (url.origin !== self.location.origin) return Promise.resolve();
        return client.navigate(client.url).catch(() => undefined);
      } catch (_) {
        return Promise.resolve();
      }
    }));
  })());
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

  return response;
}

function shouldPreferNetwork(request, requestUrl) {
  const pathname = requestUrl.pathname.toLowerCase();
  return request.mode === "navigate"
    || request.destination === "script"
    || request.destination === "style"
    || pathname.endsWith(".js")
    || pathname.endsWith(".css")
    || pathname.endsWith(".json")
    || pathname.endsWith(".webmanifest");
}

async function networkFirst(request) {
  try {
    const networkResponse = validateAssetResponse(request, await fetch(request, { cache: "no-cache" }));
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return (await caches.match(request, { ignoreSearch: true }))
      || (request.mode === "navigate" ? await caches.match("./index.html") : null)
      || (request.mode === "navigate" ? await caches.match("./404.html") : null)
      || new Response("Offline and resource is not cached.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Production correctness first: HTML, JS and CSS always check Vercel before cache.
  if (shouldPreferNetwork(event.request, requestUrl)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static media can stay fast with stale-while-revalidate behavior.
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
