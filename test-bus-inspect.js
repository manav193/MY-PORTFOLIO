const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

  console.log('Scrolling down to trigger boot...');
  await page.evaluate(() => window.scrollTo(0, 800));
  await new Promise(r => setTimeout(r, 2000)); // wait for boot

  const listenersCount = await page.evaluate(() => {
    const bus = window.ArcadeEventBus;
    const rightListeners = bus && bus.listeners['ARCADE_RIGHT'] ? bus.listeners['ARCADE_RIGHT'].length : 0;
    const allEvents = bus ? Object.keys(bus.listeners).reduce((acc, ev) => {
      acc[ev] = bus.listeners[ev].length;
      return acc;
    }, {}) : null;
    return { rightListeners, allEvents };
  });
  console.log('ArcadeEventBus Listeners:', listenersCount);

  await browser.close();
})();
