const { assert, openPage, openArcade, openRoute } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage();
  try {
    await openArcade(page);
    const routes = ['CUSTOMIZE', 'ACHIEVEMENTS', 'STATS', 'SOUNDLAB', 'DIAGNOSTICS'];
    for (const route of routes) {
      await openRoute(page, route);
      const ready = await page.evaluate(() => Boolean(document.querySelector('#arcade-app-view.active')));
      assert(ready, `${route} did not become active.`);
      await page.evaluate(() => window.ArcadeOS.forceGoHome());
    }
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS arcade modules: ${routes.length} lazy routes loaded without errors.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
