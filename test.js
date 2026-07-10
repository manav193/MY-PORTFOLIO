const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:4173');
  
  // initial state
  console.log('--- AT TOP ---');
  let text = await page.evaluate(() => {
    const el = document.getElementById('debug-overlay');
    const outer = document.querySelector('.outer-center-wrapper');
    const outRect = outer ? outer.getBoundingClientRect() : null;
    return (el ? el.textContent : 'no overlay') + 
           `\nBody height: ${document.body.scrollHeight}, window height: ${window.innerHeight}` +
           `\nOuter rect: ${outRect ? JSON.stringify(outRect) : 'null'}`;
  });
  console.log(text);

  // scroll down
  await page.evaluate(() => window.scrollTo(0, 1000));
  await new Promise(r => setTimeout(r, 500));
  
  console.log('--- SCROLLED ---');
  text = await page.evaluate(() => {
    const el = document.getElementById('debug-overlay');
    return el ? el.textContent : 'no overlay';
  });
  console.log(text);
  
  await browser.close();
})();
