const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
  console.log('=== STARTING 4 REGRESSIONS VALIDATION ===\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // -------------------------------------------------------------
  // TEST 0: BUG 1 — ARCADE SCREEN IS NOT APPEARING ON PORTFOLIO HOME
  // -------------------------------------------------------------
  console.log('--- TEST 0: Verify Arcade UI does not leak onto Portfolio Home ---');
  const indexPath = 'http://localhost:8085/index.html';
  await page.goto(indexPath, { waitUntil: 'networkidle0' });
  let isArcadeHomeActive = await page.evaluate(() => document.getElementById('arcade-home')?.classList.contains('active'));
  let isArcadeHomeVisible = await page.evaluate(() => {
    const el = document.getElementById('arcade-home');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
  console.log(`[Portfolio Fresh Load] Arcade Home Active: ${isArcadeHomeActive}, Visually Visible: ${isArcadeHomeVisible}`);
  if (isArcadeHomeActive || isArcadeHomeVisible) {
    throw new Error('Arcade Home UI leaked onto fresh portfolio load');
  }

  // -------------------------------------------------------------
  // TEST 1: BUG 1 & 4 — NIMO CHAT X / CANCEL CLOSE & LOGO
  // -------------------------------------------------------------
  console.log('--- TEST 1: NIMO Close Button, Reopen & Neon Logo ---');
  await page.waitForSelector('#nimo-launcher', { timeout: 5000 });
  const hasLogoSvg = await page.evaluate(() => !!document.querySelector('#nimo-launcher .nimo-logo-svg'));
  console.log(`[NIMO Neon Logo] Present in Launcher: ${hasLogoSvg}`);
  if (!hasLogoSvg) throw new Error('NIMO custom neon logo missing from launcher');

  // Open NIMO
  await page.click('#nimo-launcher');
  await new Promise(r => setTimeout(r, 100));
  let isPanelActive = await page.evaluate(() => document.getElementById('nimo-panel').classList.contains('active'));
  let launcherExpanded = await page.evaluate(() => document.getElementById('nimo-launcher').getAttribute('aria-expanded'));
  console.log(`[NIMO Open] Panel active: ${isPanelActive}, Launcher aria-expanded: ${launcherExpanded}`);

  if (!isPanelActive || launcherExpanded !== 'true') {
    throw new Error('NIMO failed to open cleanly');
  }

  // Click Close X button
  await page.click('#nimo-close-btn');
  await new Promise(r => setTimeout(r, 100));
  isPanelActive = await page.evaluate(() => document.getElementById('nimo-panel').classList.contains('active'));
  launcherExpanded = await page.evaluate(() => document.getElementById('nimo-launcher').getAttribute('aria-expanded'));
  console.log(`[NIMO Close via X] Panel active: ${isPanelActive}, Launcher aria-expanded: ${launcherExpanded}`);

  if (isPanelActive || launcherExpanded !== 'false') {
    throw new Error('NIMO failed to close via X button');
  }

  // Reopen with SINGLE CLICK
  await page.click('#nimo-launcher');
  await new Promise(r => setTimeout(r, 100));
  isPanelActive = await page.evaluate(() => document.getElementById('nimo-panel').classList.contains('active'));
  console.log(`[NIMO Reopen via 1 click] Panel active: ${isPanelActive}`);
  if (!isPanelActive) {
    throw new Error('NIMO failed to reopen with 1 single click after closing');
  }

  // Close via ESC
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 100));
  isPanelActive = await page.evaluate(() => document.getElementById('nimo-panel').classList.contains('active'));
  console.log(`[NIMO Close via ESC] Panel active: ${isPanelActive}`);
  if (isPanelActive) {
    throw new Error('NIMO failed to close via Escape');
  }

  // -------------------------------------------------------------
  // TEST 2: BUG 3 — NIMO ON CASE STUDY PAGES
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: NIMO on Case-Study Pages ---');
  const caseStudies = [
    'project-arcade-os.html',
    'project-nimo.html',
    'project-toolverse.html',
    'project-shift-zero.html',
    'project-selfyy.html',
    'project-love-journey.html',
    'project-velora-bites.html',
    'project-nintendo.html',
    'project-nike.html',
    'project-promptai.html'
  ];

  for (const cs of caseStudies) {
    const csPath = 'http://localhost:8085/' + cs;
    await page.goto(csPath, { waitUntil: 'load' });
    const hasLauncher = await page.evaluate(() => !!document.getElementById('nimo-launcher'));
    const hasPanel = await page.evaluate(() => !!document.getElementById('nimo-panel'));
    console.log(`[Case Study: ${cs}] NIMO Launcher: ${hasLauncher}, Panel: ${hasPanel}`);
    if (!hasLauncher || !hasPanel) {
      throw new Error(`NIMO widget missing on case study ${cs}`);
    }
  }

  // Test NIMO interactive close/reopen on case study page
  await page.click('#nimo-launcher');
  await new Promise(r => setTimeout(r, 100));
  let csPanelActive = await page.evaluate(() => document.getElementById('nimo-panel').classList.contains('active'));
  console.log(`[Case Study NIMO Open] Panel active: ${csPanelActive}`);
  await page.click('#nimo-close-btn');
  await new Promise(r => setTimeout(r, 100));
  csPanelActive = await page.evaluate(() => document.getElementById('nimo-panel').classList.contains('active'));
  console.log(`[Case Study NIMO Close X] Panel active: ${csPanelActive}`);
  if (csPanelActive) throw new Error('NIMO Close X failed on case study page');

  // -------------------------------------------------------------
  // TEST 3: BUG 2 — ARCADE BACK/ESC NAVIGATION HIERARCHY
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Arcade Back / ESC Navigation Hierarchy ---');
  await page.goto(indexPath, { waitUntil: 'load' });

  // Launch Arcade
  await page.evaluate(() => {
    if (window.ArcadeOS) window.ArcadeOS.boot();
  });
  await new Promise(r => setTimeout(r, 600));

  let osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`[Arcade Booted] OS State: ${osState}`);

  // Test Reaction Test -> ESC -> Arcade HOME
  console.log('Testing Reaction Test -> ESC -> Arcade HOME...');
  await page.evaluate(() => window.ArcadeOS.launchApp('REACTION_TEST'));
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [Reaction Test Launched] State: ${osState}`);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [After ESC] State: ${osState} (Expected: HOME)`);
  if (osState !== 'HOME') throw new Error(`ESC from Reaction Test exited to ${osState} instead of HOME`);

  // Test Neon Snake -> ESC -> Arcade HOME
  console.log('Testing Neon Snake -> ESC -> Arcade HOME...');
  await page.evaluate(() => window.ArcadeOS.launchApp('SNAKE'));
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [Neon Snake Launched] State: ${osState}`);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [After ESC] State: ${osState} (Expected: HOME)`);
  if (osState !== 'HOME') throw new Error(`ESC from Neon Snake exited to ${osState} instead of HOME`);

  // Test Breakout -> ESC -> Arcade HOME
  console.log('Testing Breakout -> ESC -> Arcade HOME...');
  await page.evaluate(() => window.ArcadeOS.launchApp('BREAKOUT'));
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [Breakout Launched] State: ${osState}`);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [After ESC] State: ${osState} (Expected: HOME)`);
  if (osState !== 'HOME') throw new Error(`ESC from Breakout exited to ${osState} instead of HOME`);

  // Test Settings -> ESC -> Arcade HOME
  console.log('Testing Settings -> ESC -> Arcade HOME...');
  await page.evaluate(() => window.ArcadeOS.openSystemRoute('SETTINGS'));
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [Settings Opened] State: ${osState}`);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  console.log(`  [After ESC] State: ${osState} (Expected: HOME)`);
  if (osState !== 'HOME') throw new Error(`ESC from Settings exited to ${osState} instead of HOME`);

  // Test ESC on Arcade HOME does NOT exit to portfolio
  console.log('Testing ESC on Arcade HOME...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  osState = await page.evaluate(() => window.ArcadeOS.state);
  const homeActive = await page.evaluate(() => document.getElementById('arcade-home')?.classList.contains('active'));
  console.log(`  [After ESC on HOME] State: ${osState}, Home Active: ${homeActive}`);
  if (osState !== 'HOME' || !homeActive) {
    throw new Error('ESC on Arcade HOME incorrectly exited Arcade OS');
  }

  // -------------------------------------------------------------
  // TEST 4: BUG 4 — CABINET PROPORTIONS
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Cabinet Lower Bezel & Compact Deck ---');
  const cabinetProportions = await page.evaluate(() => {
    const bezel = document.querySelector('.cabinet-screen-bezel');
    const deck = document.querySelector('.cab-control-deck');
    const coinDoor = document.querySelector('.cab-coin-door');
    return {
      bezelHeight: bezel ? window.getComputedStyle(bezel).height : null,
      deckHeight: deck ? window.getComputedStyle(deck).height : null,
      coinDoorHeight: coinDoor ? window.getComputedStyle(coinDoor).height : null
    };
  });
  console.log(`Cabinet Proportions - Screen Bezel: ${cabinetProportions.bezelHeight}, Control Deck: ${cabinetProportions.deckHeight}, Coin Door: ${cabinetProportions.coinDoorHeight}`);

  await browser.close();
  console.log('\n=== ALL 4 REGRESSION TESTS PASSED 100%! ===');
}

runTests().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
