const { openPage } = require('../test-helpers');

(async () => {
  const { browser, page } = await openPage({ width: 1280, height: 800 });

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('arcade_os_onboarded', 'true');
    localStorage.setItem('arcade_os_boot_complete', 'true');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.click('#dock-arcade-btn');
  await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

  // Wait for state HOME then launch Reaction Test
  await page.evaluate(() => {
    window.ArcadeOS.state = 'HOME';
    window.ArcadeOS.launchApp('reaction');
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 1200)));

  const metrics = await page.evaluate(() => {
    const getBox = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        id: el.id || el.className,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        display: style.display,
        flex: style.flex,
        heightStyle: style.height,
        maxHeight: style.maxHeight,
        padding: style.padding,
        margin: style.margin
      };
    };

    return {
      homeClass: document.getElementById('arcade-home')?.className,
      appClass: document.getElementById('arcade-app-view')?.className,
      chassis: getBox(document.querySelector('.cabinet-chassis')),
      bezel: getBox(document.querySelector('.cabinet-screen-bezel')),
      contentLayer: getBox(document.querySelector('.screen-content-layer')),
      arcadeOs: getBox(document.getElementById('arcade-os')),
      topbar: getBox(document.getElementById('arcade-status-bar')),
      homeView: getBox(document.getElementById('arcade-home')),
      appView: getBox(document.getElementById('arcade-app-view')),
      rtContent: getBox(document.getElementById('rt-screen-content')),
      footer: getBox(document.getElementById('arcade-footer-controls'))
    };
  });

  console.log('VIEWPORT METRICS:\n', JSON.stringify(metrics, null, 2));

  await browser.close();
})();
