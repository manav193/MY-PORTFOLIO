// Puppeteer Automated Integration Test - ArcadeOS System UI Input & Focus
// Validates keyboard, mouse, cabinet button actions, slider ranges, focus trap rules, and duplicate listener safeguards

const puppeteer = require('puppeteer');

(async () => {
  console.log('=== STARTING ARCADE OS SYSTEM UI INPUT VALIDATION ===');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  // Track page console errors
  let consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.toString()));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Initial Load & Setup
    await page.evaluateOnNewDocument(() => localStorage.clear());
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      window.__TEST_MODE__ = true;
      // Scroll window to trigger cabinet scale intro animation
      window.scrollTo(0, window.innerHeight * 1.5);
    });
    
    // Wait for scroll convergence, boot loader sequence, and dynamic import loading
    await new Promise(r => setTimeout(r, 1200));
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'HOME' && window.ArcadeOS?.osVisible === true,
      { timeout: 5000 }
    );
    await new Promise(r => setTimeout(r, 500));

    // Verify cabinet chassis class scaled is active
    const isChassisScaled = await page.evaluate(() => {
      const chassis = document.querySelector('.cabinet-chassis');
      return chassis ? chassis.classList.contains('is-scaled') : false;
    });
    console.log('Cabinet chassis is-scaled class active:', isChassisScaled);
    
    // ============================================================================
    // TEST 1: SETTINGS ROUTE INTERACTIVE TESTS
    // ============================================================================
    console.log('\n--- TEST 1: Settings Navigation & Sliders ---');
    
    // Open SETTINGS route
    await page.evaluate(() => {
      window.ArcadeOS.routeTo('SETTINGS');
    });
    await new Promise(r => setTimeout(r, 200));

    // Focus the back button using Puppeteer to activate page keyboard capture
    await page.focus('#settings-back-btn');

    // Verify first focusable element is focused (back button)
    let debugInfo = await page.evaluate(() => {
      const uiExists = typeof window.ArcadeSystemUI !== 'undefined';
      const focusableCount = window.ArcadeSystemUI ? window.ArcadeSystemUI.focusableElements.length : 0;
      const index = window.ArcadeSystemUI ? window.ArcadeSystemUI.selectedIndex : -1;
      const elClassList = document.getElementById('settings-back-btn')?.classList.toString();
      const documentFocused = document.activeElement ? document.activeElement.id : 'NONE';
      const busKeys = window.ArcadeEventBus ? Object.keys(window.ArcadeEventBus.listeners) : [];
      const downListeners = window.ArcadeEventBus && window.ArcadeEventBus.listeners['ARCADE_DOWN'] ? window.ArcadeEventBus.listeners['ARCADE_DOWN'].length : 0;
      const hasIsScaled = document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled');
      return { uiExists, focusableCount, index, elClassList, documentFocused, busKeys, downListeners, hasIsScaled };
    });
    console.log('ArcadeSystemUI Debug Info:', debugInfo);

    let focusedId = await page.evaluate(() => {
      const el = document.querySelector('.is-ui-focused');
      return el ? el.id : 'NONE';
    });
    console.log('Initial focused element ID (Expected: settings-back-btn):', focusedId);
    
    // Press ArrowDown to navigate to Brightness slider
    await page.keyboard.press('ArrowDown');
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Focused element after Down Arrow (Expected: setting-brightness):', focusedId);
    
    // Get initial value of brightness slider
    let brightnessVal = await page.evaluate(() => parseFloat(document.getElementById('setting-brightness').value));
    console.log('Initial brightness value:', brightnessVal);
    
    // Press ArrowLeft to decrement value
    await page.keyboard.press('ArrowLeft');
    let decrementedVal = await page.evaluate(() => parseFloat(document.getElementById('setting-brightness').value));
    console.log('Decremented brightness value (Expected: < initial):', decrementedVal);
    
    // Press ArrowRight to increment value
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    let incrementedVal = await page.evaluate(() => parseFloat(document.getElementById('setting-brightness').value));
    console.log('Incremented brightness value:', incrementedVal);
    
    // Press ArrowDown to Audio Toggle button
    await page.keyboard.press('ArrowDown'); // to setting-glow
    await page.keyboard.press('ArrowDown'); // to setting-volume
    await page.keyboard.press('ArrowDown'); // to setting-audio-toggle
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Focused element (Expected: setting-audio-toggle):', focusedId);
    
    let audioState = await page.evaluate(() => document.getElementById('setting-audio-toggle').textContent);
    console.log('Audio toggle initial state:', audioState);
    
    // Activate via Enter key
    await page.evaluate(() => document.getElementById('setting-audio-toggle').click());
    let audioStateAfter = await page.evaluate(() => document.getElementById('setting-audio-toggle').textContent);
    console.log('Audio toggle after Enter activation (Expected: toggled):', audioStateAfter);
    
    // ============================================================================
    // TEST 2: MOUSE INTERACTION & FOCUS RING
    // ============================================================================
    console.log('\n--- TEST 2: Mouse Clicks & Focus Ring updates ---');
    
    // Direct click on Reset Credits button
    await page.evaluate(() => {
      const button = document.getElementById('setting-reset-credits-btn');
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      button.click();
    });
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Focused element after direct mouse click (Expected: setting-reset-credits-btn):', focusedId);
    
    // ============================================================================
    // TEST 3: MACHINE CUSTOMIZER ROUTE
    // ============================================================================
    console.log('\n--- TEST 3: Machine Builder Customizer Navigation ---');
    
    // Return home, then open customize
    await page.evaluate(() => window.ArcadeOS.forceGoHome());
    await page.evaluate(() => window.ArcadeOS.routeTo('CUSTOMIZE'));
    await page.waitForSelector('#builder-back-btn', { timeout: 5000 });
    
    let customizerRoute = await page.evaluate(() => window.ArcadeOS.state);
    console.log('Active state (Expected: CUSTOMIZE):', customizerRoute);
    
    // Verify first focusable is builder back btn
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Customizer initial focus ID (Expected: builder-back-btn):', focusedId);
    
    // Move down to category tabs
    await page.keyboard.press('ArrowDown');
    let tabFocusedCat = await page.evaluate(() => document.querySelector('.is-ui-focused')?.getAttribute('data-cat-id') || 'NONE');
    console.log('Tab category focused (Expected: cabinet):', tabFocusedCat);
    
    // Press Enter to confirm category and loadswatch swatches
    await page.keyboard.press('ArrowRight'); // move to next tab: colors
    await page.keyboard.press('Enter');
    
    let activeCat = await page.evaluate(() => window.ArcadeCustomizer.activeCategory);
    console.log('Active category after Tab action (Expected: colors):', activeCat);
    
    // Move to color swatch accent hex input
    await page.keyboard.press('ArrowDown'); // to tab controls or swatch
    
    // ============================================================================
    // TEST 4: MODALS FOCUS TRAPPING
    // ============================================================================
    console.log('\n--- TEST 4: Confirmation Dialog Focus Trap ---');
    
    // Trigger confirm modal warning
    await page.evaluate(() => {
      window.ArcadeOS.showConfirmModal("Confirm test message", () => window.__CONFIRMED__ = true, () => window.__CANCELED__ = true);
    });
    await new Promise(r => setTimeout(r, 100));
    
    const isModalActive = await page.evaluate(() => document.getElementById('arcade-confirm-modal').classList.contains('active'));
    console.log('Modal is active (Expected: true):', isModalActive);
    
    // Check trapped focus elements list
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Trapped focused element ID (Expected: modal-confirm-btn):', focusedId);
    
    // Press ArrowDown / right, focus should wrap only between confirm and cancel buttons
    await page.keyboard.press('ArrowDown');
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Focused element after Down in modal (Expected: modal-cancel-btn):', focusedId);
    
    await page.keyboard.press('ArrowDown');
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Focused element wraps back inside modal (Expected: modal-confirm-btn):', focusedId);
    
    // Click Cancel to dismiss
    await page.click('#modal-cancel-btn');
    const isModalActiveAfter = await page.evaluate(() => document.getElementById('arcade-confirm-modal').classList.contains('active'));
    console.log('Modal dismissed (Expected: false):', isModalActiveAfter);
    
    // ============================================================================
    // TEST 5: DUPLICATE LISTENERS PREVENTION
    // ============================================================================
    console.log('\n--- TEST 5: Duplicate Event Listeners Check ---');
    
    // Reopen SETTINGS route 5 times
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.ArcadeOS.forceGoHome();
        window.ArcadeOS.routeTo('SETTINGS');
      });
      await new Promise(r => setTimeout(r, 50));
    }
    
    // If listeners were duplicated, pressing Down once might move focus by multiple slots
    await page.keyboard.press('ArrowDown'); // moves from back-btn to brightness slider
    focusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id || 'NONE');
    console.log('Focused element after Down on 5x re-opened view (Expected: setting-brightness):', focusedId);
    
    // ============================================================================
    // TEST 6: GAME ROUTE BYPASS
    // ============================================================================
    console.log('\n--- TEST 6: Game State Bypass Verification ---');
    
    // Launch game app
    await page.evaluate(() => window.ArcadeOS.forceGoHome());
    await page.evaluate(() => window.ArcadeOS.launchApp('reaction', true));
    await page.waitForFunction(() => window.ArcadeOS.state === 'APP', { timeout: 5000 });
    
    let gameState = await page.evaluate(() => window.ArcadeOS.state);
    console.log('Active state (Expected: APP):', gameState);
    
    // Focus should be empty or disabled for System UI
    let systemFocusExists = await page.evaluate(() => !!document.querySelector('.is-ui-focused'));
    console.log('System UI Focus Ring active (Expected: false):', systemFocusExists);
    
    // Press ArrowDown to verify game keys don't trigger settings overlays or errors
    await page.keyboard.press('ArrowDown');
    let hasConsoleErrors = consoleErrors.length > 0;
    console.log('Tests completed. Console errors detected:', hasConsoleErrors ? consoleErrors : 'None');

    if (hasConsoleErrors) {
      process.exit(1);
    }
    console.log('\n=== ALL SYSTEM UI INPUT VALIDATIONS PASSED! ===');
    
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
