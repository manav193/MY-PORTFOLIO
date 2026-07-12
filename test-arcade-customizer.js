const puppeteer = require('puppeteer');

(async () => {
  console.log('=== STARTING MACHINE BUILDER CUSTOMIZATION PHASE 3A VALIDATION ===');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.toString()));
  
  // Set viewport
  await page.setViewport({ width: 1440, height: 900 });
  
  // Navigate
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  
  // Boot OS
  await page.evaluate(() => {
    window.__TEST_MODE__ = true;
    const chassis = document.querySelector('.cabinet-chassis');
    if (chassis) chassis.classList.add('is-scaled');
    window.ArcadeOS.boot();
  });
  
  // Wait for boot sequence to finish
  await new Promise(r => setTimeout(r, 1000));
  
  // 1. Route to CUSTOMIZE
  console.log('\n--- STEP 1: Routing to CUSTOMIZE state ---');
  await page.evaluate(() => {
    window.ArcadeOS.routeTo('CUSTOMIZE');
  });
  await new Promise(r => setTimeout(r, 300)); // wait for lazy-load import
  
  const stateCheck = await page.evaluate(() => {
    const state = window.ArcadeOS.state;
    const marquee = document.querySelector('.cab-marquee-text').textContent;
    const oled = document.querySelector('.oled-status').textContent;
    const isCustomizerLoaded = typeof window.ArcadeCustomizer !== 'undefined';
    return { state, marquee, oled, isCustomizerLoaded };
  });
  
  console.log(`OS State: "${stateCheck.state}" (Expected: CUSTOMIZE)`);
  console.log(`Marquee Text: "${stateCheck.marquee}" (Expected: ARCADE)`);
  console.log(`OLED Status: "${stateCheck.oled}" (Expected: DESIGN LAB)`);
  console.log(`Customizer module loaded globally: ${stateCheck.isCustomizerLoaded} (Expected: true)`);
  
  if (stateCheck.state !== 'CUSTOMIZE' || stateCheck.marquee !== 'ARCADE' || stateCheck.oled !== 'DESIGN LAB' || !stateCheck.isCustomizerLoaded) {
    console.error('FAIL: Customize routing verification failed.');
    process.exit(1);
  }
  
  // 2. Validate Default Config
  console.log('\n--- STEP 2: Validating Default Config ---');
  const defaultsCheck = await page.evaluate(() => {
    const cfg = window.ArcadeCustomizer.draftConfig;
    const chassis = document.querySelector('.cabinet-chassis');
    const accentVar = chassis.style.getPropertyValue('--machine-accent');
    return {
      accentColor: cfg.accentColor,
      scanlineIntensity: cfg.scanlineIntensity,
      accentVar: accentVar
    };
  });
  console.log(`Default Accent: "${defaultsCheck.accentColor}" (Expected: #35d0ba)`);
  console.log(`Default Scanline: ${defaultsCheck.scanlineIntensity} (Expected: 0.35)`);
  console.log(`Default Accent CSS Variable: "${defaultsCheck.accentVar}" (Expected: #35d0ba)`);
  
  if (defaultsCheck.accentColor !== '#35d0ba' || defaultsCheck.scanlineIntensity !== 0.35 || defaultsCheck.accentVar !== '#35d0ba') {
    console.error('FAIL: Default configuration check failed.');
    process.exit(1);
  }
  
  // 3. Test Live Preview Update
  console.log('\n--- STEP 3: Modifying settings draft and checking live variables ---');
  await page.evaluate(() => {
    window.ArcadeCustomizer.updateSetting('accentColor', '#ff00ff');
    window.ArcadeCustomizer.updateSetting('marqueeText', 'BUILDER TEST');
  });
  
  const liveVars = await page.evaluate(() => {
    const chassis = document.querySelector('.cabinet-chassis');
    const accentVar = chassis.style.getPropertyValue('--machine-accent');
    const marquee = document.querySelector('.cab-marquee-text').textContent;
    const isDirty = window.ArcadeCustomizer.isDirty();
    return { accentVar, marquee, isDirty };
  });
  console.log(`Draft Accent CSS Variable: "${liveVars.accentVar}" (Expected: #ff00ff)`);
  console.log(`Draft Marquee Text: "${liveVars.marquee}" (Expected: BUILDER TEST)`);
  console.log(`Is Customizer Dirty: ${liveVars.isDirty} (Expected: true)`);
  
  if (liveVars.accentVar !== '#ff00ff' || liveVars.marquee !== 'BUILDER TEST' || !liveVars.isDirty) {
    console.error('FAIL: Live draft modification failed.');
    process.exit(1);
  }
  
  // 4. Test Cancel Flow
  console.log('\n--- STEP 4: Canceling and verifying state restoration ---');
  await page.evaluate(() => {
    window.ArcadeCustomizer.cancel();
  });
  
  const cancelCheck = await page.evaluate(() => {
    const chassis = document.querySelector('.cabinet-chassis');
    const accentVar = chassis.style.getPropertyValue('--machine-accent');
    const marquee = document.querySelector('.cab-marquee-text').textContent;
    const isDirty = window.ArcadeCustomizer.isDirty();
    return { accentVar, marquee, isDirty };
  });
  console.log(`Restored Accent CSS Variable: "${cancelCheck.accentVar}" (Expected: #35d0ba)`);
  console.log(`Restored Is Customizer Dirty: ${cancelCheck.isDirty} (Expected: false)`);
  
  if (cancelCheck.accentVar !== '#35d0ba' || cancelCheck.isDirty) {
    console.error('FAIL: Cancel flow restoration failed.');
    process.exit(1);
  }
  
  // 5. Test Apply Flow
  console.log('\n--- STEP 5: Applying config changes and checking persistence ---');
  await page.evaluate(() => {
    window.ArcadeCustomizer.updateSetting('accentColor', '#ffcc00');
    window.ArcadeCustomizer.apply();
  });
  
  const applyCheck = await page.evaluate(() => {
    const persisted = window.ArcadeCustomizer.persistedConfig;
    const isDirty = window.ArcadeCustomizer.isDirty();
    return {
      persistedAccent: persisted.accentColor,
      isDirty: isDirty
    };
  });
  console.log(`Persisted Accent Color: "${applyCheck.persistedAccent}" (Expected: #ffcc00)`);
  console.log(`Is Customizer Dirty: ${applyCheck.isDirty} (Expected: false)`);
  
  if (applyCheck.persistedAccent !== '#ffcc00' || applyCheck.isDirty) {
    console.error('FAIL: Apply persistence check failed.');
    process.exit(1);
  }
  
  // 6. Test Dirty Navigation Interception
  console.log('\n--- STEP 6: Testing unsaved changes navigation blocker ---');
  await page.evaluate(() => {
    window.ArcadeCustomizer.updateSetting('accentColor', '#00ff00');
    window.ArcadeOS.goHome(); // This should trigger the confirm modal!
  });
  await new Promise(r => setTimeout(r, 100));
  
  const modalActive = await page.evaluate(() => {
    const modal = document.getElementById('arcade-confirm-modal');
    return modal ? modal.classList.contains('active') : false;
  });
  console.log(`Unsaved Changes Confirm Modal Active: ${modalActive} (Expected: true)`);
  
  if (!modalActive) {
    console.error('FAIL: Navigation interception confirm modal failed.');
    process.exit(1);
  }
  
  // Click Cancel on confirm dialog
  await page.evaluate(() => {
    document.getElementById('modal-cancel-btn').click();
  });
  await new Promise(r => setTimeout(r, 100));
  
  const stillCustomize = await page.evaluate(() => {
    return window.ArcadeOS.state;
  });
  console.log(`OS State after Cancel: "${stillCustomize}" (Expected: CUSTOMIZE)`);
  if (stillCustomize !== 'CUSTOMIZE') {
    console.error('FAIL: Modal Cancel did not keep user in CUSTOMIZE state.');
    process.exit(1);
  }
  
  // Trigger goHome again and Confirm
  await page.evaluate(() => {
    window.ArcadeOS.goHome();
  });
  await new Promise(r => setTimeout(r, 100));
  
  await page.evaluate(() => {
    document.getElementById('modal-confirm-btn').click();
  });
  await new Promise(r => setTimeout(r, 150));
  
  const finalState = await page.evaluate(() => {
    return {
      state: window.ArcadeOS.state,
      persistedAccent: window.ArcadeCustomizer.persistedConfig.accentColor
    };
  });
  console.log(`Final OS State: "${finalState.state}" (Expected: HOME)`);
  console.log(`Final Persisted Accent (Unsaved discard verified): "${finalState.persistedAccent}" (Expected: #ffcc00)`);
  
  if (finalState.state !== 'HOME' || finalState.persistedAccent !== '#ffcc00') {
    console.error('FAIL: Modal Confirm dirty discard failed.');
    process.exit(1);
  }
  
  console.log('\n=== PHASE 3A VALIDATION COMPLETED SUCCESSFULLY! ===');
  await browser.close();
})();
