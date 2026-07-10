const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });

    console.log("INITIAL STATE:");
    const initial = await page.evaluate(() => {
      return {
        htmlTheme: document.documentElement.getAttribute('data-theme'),
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyText: window.getComputedStyle(document.body).color
      };
    });
    console.log(initial);

    console.log("CLICKING LIGHT-APPLE...");
    await page.evaluate(() => {
      const btn = document.querySelector('.theme-btn[data-theme-id="light-apple"]');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 500)); // wait for transition

    console.log("NEW STATE:");
    const after = await page.evaluate(() => {
      return {
        htmlTheme: document.documentElement.getAttribute('data-theme'),
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyText: window.getComputedStyle(document.body).color,
        activeClass: document.querySelector('.theme-btn[data-theme-id="light-apple"]').className
      };
    });
    console.log(after);

    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
