const { assert, openPage, openArcade, openRoute } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage();
  try {
    await openArcade(page);
    await openRoute(page, 'CUSTOMIZE');
    const result = await page.evaluate(() => ({
      route: document.querySelector('#os-route-label')?.textContent.trim(),
      controls: document.querySelectorAll('#arcade-app-view [data-arcade-focusable]').length,
      module: typeof window.ArcadeCustomizer?.open === 'function'
    }));
    assert(result.route === 'Machine Customizer', `Customizer route label is ${result.route || 'missing'}.`);
    assert(result.controls >= 3, 'Customizer controls are missing.');
    assert(result.module, 'Customizer module did not load.');
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log('PASS arcade builder: route, controls, and lazy module are ready.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
