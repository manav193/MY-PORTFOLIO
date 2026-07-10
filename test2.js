const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const activeBtn = document.querySelector('.theme-btn.active');
      return {
        hasActiveBtn: !!activeBtn,
        activeBtnId: activeBtn ? activeBtn.getAttribute('data-theme-id') : null
      };
    });
    console.log(data);

    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
