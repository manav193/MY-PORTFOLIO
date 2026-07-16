const puppeteer = require('puppeteer');
const { BASE_URL, assert } = require('./test-helpers');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const viewports = [[1920,1080],[1440,900],[1024,768],[820,1180],[430,932],[390,844],[360,800],[600,375]];
    for (const [width, height] of viewports) {
      const page = await browser.newPage();
      page.on('pageerror', error => errors.push(`${width}x${height}: ${error.message}`));
      page.on('console', message => {
        if (message.type() === 'error' && !message.text().includes('favicon.ico')) errors.push(`${width}x${height}: ${message.text()}`);
      });
      await page.setViewport({ width, height });
      await page.goto(`${BASE_URL}?viewport=${width}x${height}`, { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(() => ({
        overflow: Math.max(0,
          document.body.scrollWidth - document.body.clientWidth
          - (window.innerWidth - document.documentElement.clientWidth)
        ),
        dockVisible: getComputedStyle(document.querySelector('.os-dock')).display !== 'none',
        projectWidth: document.querySelector('#work .project-card')?.getBoundingClientRect().width || 0,
        introOverlap: (() => {
          const choice = document.querySelector('.boot-choice')?.getBoundingClientRect();
          const dock = document.querySelector('.os-dock-container')?.getBoundingClientRect();
          if (!choice || !dock) return false;
          return choice.left < dock.right && choice.right > dock.left
            && choice.top < dock.bottom && choice.bottom > dock.top;
        })()
      }));
      assert(result.overflow <= 1, `${width}x${height} has ${result.overflow}px horizontal overflow.`);
      assert(result.dockVisible, `${width}x${height} hides the bottom dock.`);
      assert(result.projectWidth > 0 && result.projectWidth <= width, `${width}x${height} has an invalid project card width.`);
      assert(!result.introOverlap, `${width}x${height} overlaps the intro actions and bottom dock.`);
      await page.close();
    }
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS responsive layout: ${viewports.length} desktop, tablet, mobile, and short viewports are stable.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
