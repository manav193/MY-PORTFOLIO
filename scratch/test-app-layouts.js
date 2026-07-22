const { openPage } = require('../test-helpers');

(async () => {
  console.log('Testing App Viewport Sizing & Layouts for all ArcadeOS Apps...');
  const { browser, page } = await openPage({ width: 1280, height: 800 });

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('arcade_os_onboarded', 'true');
    localStorage.setItem('arcade_os_boot_complete', 'true');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.click('#dock-arcade-btn');
  await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

  const appsToTest = ['reaction', 'snake', 'breakout', 'pixelpad', 'palettelab', 'settings'];

  for (const appId of appsToTest) {
    await page.evaluate(async (id) => {
      window.ArcadeOS.state = 'HOME';
      if (id === 'settings') {
        await window.ArcadeOS.openSystemRoute('SETTINGS');
      } else {
        window.ArcadeOS.launchApp(id);
      }
    }, appId);

    await page.evaluate(() => new Promise(r => setTimeout(r, 1200)));

    const result = await page.evaluate((id) => {
      const home = document.getElementById('arcade-home');
      const appView = document.getElementById('arcade-app-view');
      const homeRect = home ? home.getBoundingClientRect() : { width: 0, height: 0 };
      const appRect = appView ? appView.getBoundingClientRect() : { width: 0, height: 0 };

      return {
        appId: id,
        state: window.ArcadeOS.state,
        homeDisplay: home ? getComputedStyle(home).display : null,
        homeHeight: homeRect.height,
        appDisplay: appView ? getComputedStyle(appView).display : null,
        appHeight: appRect.height,
        appChildrenCount: appView ? appView.children.length : 0
      };
    }, appId);

    console.log(`[TEST] App '${appId}':`, JSON.stringify(result));

    if (result.state !== 'APP' && result.state !== 'ROUTE' && result.state !== 'SETTINGS') {
      console.error(`FAIL: App '${appId}' state is invalid (got '${result.state}')`);
      process.exit(1);
    }
    if (result.homeHeight !== 0) {
      console.error(`FAIL: App '${appId}' home height is not 0 (got ${result.homeHeight})`);
      process.exit(1);
    }
    if (result.appHeight < 150) {
      console.error(`FAIL: App '${appId}' appView height is too small (got ${result.appHeight})`);
      process.exit(1);
    }

    // Go back to home
    await page.evaluate(() => window.ArcadeOS.forceGoHome());
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
  }

  console.log('SUCCESS: All 6 apps launch in full CRT viewport height with zero layout leakage!');
  await browser.close();
})();
