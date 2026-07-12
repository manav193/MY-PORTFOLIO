// Puppeteer Integration Test Suite - Verified against production build (dist/)
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let errors = [];
  page.on('pageerror', err => {
    errors.push('[PAGE ERROR] ' + err.toString());
  });
  page.on('console', msg => {
    console.log(`[PAGE CONSOLE] [${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push('[CONSOLE ERROR] ' + msg.text());
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ERROR ${response.status()}] ${response.url()}`);
    }
  });

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0', timeout: 15000 });

    console.log('=== TEST 1: INITIAL STATE (PORTFOLIO INTRO) ===');
    const isScaled0 = await page.evaluate(() => {
      const c = document.querySelector('.cabinet-chassis');
      return c ? c.classList.contains('is-scaled') : false;
    });
    console.log('Cabinet is-scaled initially:', isScaled0);

    const portfolioActive0 = await page.evaluate(() => {
      const btn = document.getElementById('dock-portfolio-btn');
      return btn ? btn.classList.contains('dock-active') : false;
    });
    const arcadeActive0 = await page.evaluate(() => {
      const btn = document.getElementById('dock-arcade-btn');
      return btn ? btn.classList.contains('dock-active') : false;
    });
    console.log('Portfolio button active initially:', portfolioActive0);
    console.log('Arcade button active initially:', arcadeActive0);

    console.log('\n=== TEST 2: CLICK ARCADE ICON ===');
    await page.click('#dock-arcade-btn');
    await new Promise(r => setTimeout(r, 3500)); // wait for scroll and progress animation

    const isScaled1 = await page.evaluate(() => {
      const c = document.querySelector('.cabinet-chassis');
      return c ? c.classList.contains('is-scaled') : false;
    });
    console.log('Cabinet is-scaled after Arcade click:', isScaled1);

    const portfolioActive1 = await page.evaluate(() => {
      const btn = document.getElementById('dock-portfolio-btn');
      return btn ? btn.classList.contains('dock-active') : false;
    });
    const arcadeActive1 = await page.evaluate(() => {
      const btn = document.getElementById('dock-arcade-btn');
      return btn ? btn.classList.contains('dock-active') : false;
    });
    console.log('Portfolio button active:', portfolioActive1);
    console.log('Arcade button active:', arcadeActive1);

    const osState1 = await page.evaluate(() => window.ArcadeOS ? window.ArcadeOS.state : 'N/A');
    console.log('OS state after Arcade click:', osState1);

    const appsInReg = await page.evaluate(() => window.ArcadeRegistry ? window.ArcadeRegistry.getAll().map(a => ({ id: a.id, title: a.title, status: a.status })) : []);
    console.log('Apps in registry:', appsInReg);

    console.log('\n=== TEST 3: LAUNCH REACTION TEST APP ===');
    const listeners = await page.evaluate(() => {
      // Find where ArcadeEventBus is exposed, or evaluate its listeners
      return window.ArcadeOS ? Object.keys(window.ArcadeOS.state) : null;
    });
    const busInfo = await page.evaluate(() => {
      // Let's inspect the actual global/local event bus if possible
      // Wait, is ArcadeEventBus exposed globally? Let's check!
      return {
        hasGlobalBus: typeof window.ArcadeEventBus !== 'undefined',
        busKeys: typeof window.ArcadeEventBus !== 'undefined' ? Object.keys(window.ArcadeEventBus.listeners) : []
      };
    });
    console.log('Event bus info:', busInfo);

    const cardExists = await page.evaluate(() => !!document.querySelector('.app-card.focused'));
    console.log('Focused app card exists:', cardExists);
    await page.evaluate(() => {
      const card = document.querySelector('.app-card.focused');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 1500)); // wait for launch transition

    const osState2 = await page.evaluate(() => window.ArcadeOS ? window.ArcadeOS.state : 'N/A');
    const activeAppName = await page.evaluate(() => window.ArcadeOS.activeApp ? window.ArcadeOS.activeApp.constructor.name : 'null');
    console.log('OS state:', osState2);
    console.log('Active app:', activeAppName);

    console.log('\n=== TEST 4: CLICK PORTFOLIO DOCK ICON ===');
    await page.click('#dock-portfolio-btn');
    await new Promise(r => setTimeout(r, 3500)); // wait for scroll up and transition

    const isScaled2 = await page.evaluate(() => {
      const c = document.querySelector('.cabinet-chassis');
      return c ? c.classList.contains('is-scaled') : false;
    });
    console.log('Cabinet is-scaled after Portfolio click:', isScaled2);

    const debugInfo = await page.evaluate(() => {
      const intro = document.getElementById("intro-sequence");
      const rect = intro ? intro.getBoundingClientRect() : null;
      return {
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        introExists: !!intro,
        rect: rect ? { top: rect.top, bottom: rect.bottom, height: rect.height } : null
      };
    });
    console.log('Debug Intro sequence positioning:', debugInfo);

    const portfolioActive2 = await page.evaluate(() => {
      const btn = document.getElementById('dock-portfolio-btn');
      return btn ? btn.classList.contains('dock-active') : false;
    });
    const arcadeActive2 = await page.evaluate(() => {
      const btn = document.getElementById('dock-arcade-btn');
      return btn ? btn.classList.contains('dock-active') : false;
    });
    console.log('Portfolio button active:', portfolioActive2);
    console.log('Arcade button active:', arcadeActive2);

    const osState3 = await page.evaluate(() => window.ArcadeOS ? window.ArcadeOS.state : 'N/A');
    const activeApp3 = await page.evaluate(() => window.ArcadeOS.activeApp !== null);
    console.log('OS state:', osState3);
    console.log('Is app active:', activeApp3);

    console.log('\n=== TEST 5: CLICK ARCADE ICON AGAIN ===');
    await page.click('#dock-arcade-btn');
    await new Promise(r => setTimeout(r, 3500)); // wait for scroll down and transition

    const isScaled3 = await page.evaluate(() => {
      const c = document.querySelector('.cabinet-chassis');
      return c ? c.classList.contains('is-scaled') : false;
    });
    console.log('Cabinet is-scaled after second Arcade click:', isScaled3);

    const osState4 = await page.evaluate(() => window.ArcadeOS ? window.ArcadeOS.state : 'N/A');
    const activeApp4 = await page.evaluate(() => window.ArcadeOS.activeApp !== null);
    console.log('OS state:', osState4);
    console.log('Is app active:', activeApp4);

  } catch (err) {
    console.error('Test error:', err);
  }

  console.log('\n=== Page/Console Errors ===');
  if (errors.length === 0) {
    console.log('No console or page errors detected.');
  } else {
    console.log(errors);
  }

  await browser.close();
  process.exit(0);
})();
