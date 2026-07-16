const puppeteer = require('puppeteer');
const { BASE_URL, assert } = require('./test-helpers');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const base = new URL(BASE_URL);
  const origin = base.origin;

  try {
    await page.goto(`${origin}/project-arcade-os.html`, { waitUntil: 'domcontentloaded' });
    const cacheVersion = await page.evaluate(async () => {
      const source = await (await fetch('/sw.js', { cache: 'no-store' })).text();
      return source.match(/const cacheName = ["']([^"']+)/)?.[1] || null;
    });
    assert(cacheVersion, 'Could not read the generated service-worker cache version.');

    await page.evaluate(async () => {
      const oldCache = await caches.open('manav-portfolio-v1');
      await oldCache.put('/stale-system-module.js', new Response('stale'));
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
          setTimeout(resolve, 3000);
        });
      }
      await registration.update();
    });

    await page.waitForFunction(
      version => caches.keys().then(keys => keys.includes(version) && !keys.includes('manav-portfolio-v1')),
      { timeout: 15000 },
      cacheVersion
    );

    const cacheAudit = await page.evaluate(async version => {
      const cache = await caches.open(version);
      const keys = (await cache.keys()).map(request => new URL(request.url).pathname);
      const failed = await fetch('/missing-release-check.js');
      const keysAfterFailure = (await cache.keys()).map(request => new URL(request.url).pathname);
      return {
        required: [
          '/project-arcade-os.html',
          '/Manav-Agarwal-Resume.pdf',
          '/js/modules/arcade-soundlab.js',
          '/js/modules/arcade-diagnostics.js'
        ].every(path => keys.includes(path)),
        failedStatus: failed.status,
        failedCached: keysAfterFailure.includes('/missing-release-check.js')
      };
    }, cacheVersion);
    assert(cacheAudit.required, 'Required release assets are absent from the service-worker cache.');
    assert(cacheAudit.failedStatus >= 400, `Expected missing asset failure, got HTTP ${cacheAudit.failedStatus}.`);
    assert(!cacheAudit.failedCached, 'A failed response was cached.');

    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'Hard reload lost service-worker control.');

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    assert((await page.title()).includes('ArcadeOS'), 'Offline navigation fallback did not render the cached case study.');
    const offlineScript = await page.evaluate(async () => {
      const response = await fetch('/missing-offline-module.js');
      return { status: response.status, type: response.headers.get('content-type') };
    });
    assert(offlineScript.status >= 400, `Expected offline script failure, got HTTP ${offlineScript.status}.`);
    assert(/text\/plain/.test(offlineScript.type || ''), 'Offline script failure has an unsafe MIME type.');

    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });

    const bypassContext = await browser.createBrowserContext();
    const bypassPage = await bypassContext.newPage();
    await bypassPage.goto(`${origin}/`, { waitUntil: 'load' });
    await new Promise(resolve => setTimeout(resolve, 500));
    const bypass = await bypassPage.evaluate(async () => ({
      registrations: (await navigator.serviceWorker.getRegistrations()).length,
      portfolioCaches: (await caches.keys()).filter(key => key.startsWith('manav-portfolio-')).length
    }));
    assert(bypass.registrations === 0 && bypass.portfolioCaches === 0, 'Local preview bypass leaves service-worker state behind.');
    await bypassContext.close();

    console.log(`PASS service worker release: ${cacheVersion}, update cleanup, hard reload, offline fallback, failure handling, and local bypass.`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
