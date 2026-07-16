const { assert, openPage, openArcade, openRoute } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage();
  try {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await openArcade(page);
    const arcadeLayering = await page.evaluate(() => {
      const hitTarget = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return hit === element || element.contains(hit);
      };
      return {
        navHidden: getComputedStyle(document.querySelector('#main-nav')).pointerEvents === 'none',
        homeClickable: hitTarget('#os-home-btn'),
        cabinetBackClickable: hitTarget('.action-b')
      };
    });
    assert(arcadeLayering.navHidden, 'Portfolio navigation can intercept Arcade input.');
    assert(arcadeLayering.homeClickable && arcadeLayering.cabinetBackClickable, 'Arcade HOME or cabinet Back is occluded.');
    assert(await page.$eval('#arcade-onboarding', element => !element.hidden), 'First-use control guide is hidden.');
    await page.click('#arcade-onboarding .onboarding-dismiss');
    assert(await page.evaluate(() => localStorage.getItem('arcade_onboarding_complete') === 'true'), 'Onboarding choice was not persisted.');
    assert(await page.$('#os-home-btn'), 'HOME control is missing.');
    assert(await page.$('#os-exit-btn'), 'EXIT control is missing.');

    for (let pass = 0; pass < 2; pass += 1) {
      for (const route of ['CUSTOMIZE', 'ACHIEVEMENTS', 'STATS', 'SETTINGS', 'PROFILE', 'SOUNDLAB', 'DIAGNOSTICS']) {
        await openRoute(page, route);
        await page.click('#os-home-btn');
        await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME');
      }
    }
    const state = await page.evaluate(() => ({
      loading: Boolean(document.querySelector('#arcade-loading.active')),
      activeViews: document.querySelectorAll('#arcade-os .os-view.active').length,
      announcementHidden: getComputedStyle(document.querySelector('#arcade-route-announcer')).width === '1px'
    }));
    assert(!state.loading, 'Arcade remained in a loading state.');
    assert(state.activeViews === 1, `Expected one active view, found ${state.activeViews}.`);
    assert(state.announcementHidden, 'Route announcement is visually exposed.');
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log('PASS arcade final polish: onboarding, navigation, announcements, and repeated route cleanup are stable.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
