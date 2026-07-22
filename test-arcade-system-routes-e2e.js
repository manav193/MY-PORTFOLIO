const puppeteer = require('puppeteer');

(async () => {
  console.log('=== STARTING ARCADE SYSTEM ROUTES E2E VALIDATION ===');
  
  const browser = await browserLaunch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  let errors = [];
  page.on('pageerror', err => {
    console.error('BROWSER PAGEERROR:', err.toString());
    errors.push(`PageError: ${err.toString()}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico')) {
        console.error('BROWSER CONSOLE ERROR:', text);
        errors.push(`ConsoleError: ${text}`);
      }
    }
  });

  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', event => {
      console.error('BROWSER UNHANDLED REJECTION:', event.reason);
      window.__unhandledRejections = window.__unhandledRejections || [];
      window.__unhandledRejections.push(String(event.reason));
    });
  });

  try {
    console.log('\n- Loading portfolio index page...');
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      localStorage.clear();
      window.__TEST_MODE__ = true;
      window.ARCADE_DEBUG = true;
      if (window.ArcadeOS) {
        window.ArcadeOS.selectedIndex = 0;
        window.ArcadeOS.renderHome();
      }
      window.scrollTo(0, window.innerHeight * 1.5);
    });
    
    await page.waitForFunction(
      () => document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled')
        && window.ArcadeOS?.state === 'HOME'
        && document.querySelector('#arcade-home.active'),
      { timeout: 12000 }
    );

    const isScaled = await page.evaluate(() => {
      return document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled') || false;
    });
    console.log(`Chassis Scaled: ${isScaled}`);
    if (!isScaled) throw new Error('Cabinet chassis failed to scale.');

    const runDOMAudit = async (description) => {
      console.log(`  [Audit: ${description}] Auditing active DOM state...`);
      const auditResult = await page.evaluate(() => {
        const homeActive = document.getElementById('arcade-home')?.classList.contains('active') || false;
        const appViewActive = document.getElementById('arcade-app-view')?.classList.contains('active') || false;
        const loadingActive = document.getElementById('arcade-loading')?.classList.contains('active') || false;
        const activeViewsCount = [homeActive, appViewActive, loadingActive].filter(Boolean).length;

        const focusedEls = Array.from(document.querySelectorAll('.is-ui-focused'));
        const focusedCount = focusedEls.length;
        const focusedInfo = focusedEls.map(el => `${el.tagName}#${el.id}.${Array.from(el.classList).join('.')}`);

        const focusedElement = document.querySelector('.is-ui-focused');
        const focusedIsDetached = focusedElement ? !focusedElement.isConnected : false;

        const confirmModal = document.getElementById('arcade-confirm-modal');
        let hiddenOverlayIntercepts = false;
        if (confirmModal && !confirmModal.classList.contains('active')) {
          const style = window.getComputedStyle(confirmModal);
          const hasPointerEvents = style.pointerEvents === 'none';
          if (!hasPointerEvents) {
            hiddenOverlayIntercepts = true;
          }
        }

        const rejections = window.__unhandledRejections || [];
        const systemRoutesCount = document.querySelectorAll('.sys-app').length;
        const state = window.ArcadeOS.state;
        const html = document.getElementById('arcade-app-view')?.innerHTML || '';

        return {
          homeActive,
          appViewActive,
          loadingActive,
          activeViewsCount,
          focusedCount,
          focusedInfo,
          focusedIsDetached,
          hiddenOverlayIntercepts,
          rejections,
          systemRoutesCount,
          state,
          html
        };
      });

      console.log(`  [Audit Details] State: "${auditResult.state}", HTML content length: ${auditResult.html.length}`);
      if (auditResult.html.length < 500) {
        console.log(`  [Audit Details] HTML snippet:`, auditResult.html);
      }

      if (auditResult.activeViewsCount !== 1) {
        throw new Error(`DOM Audit Fail: Multiple views active concurrently (${auditResult.activeViewsCount})`);
      }
      if (auditResult.focusedCount > 1) {
        throw new Error(`DOM Audit Fail: Multiple elements have .is-ui-focused (${auditResult.focusedCount}): ${JSON.stringify(auditResult.focusedInfo)}`);
      }
      if (auditResult.focusedIsDetached) {
        throw new Error(`DOM Audit Fail: The currently focused element is detached from the document!`);
      }
      if (auditResult.hiddenOverlayIntercepts) {
        throw new Error(`DOM Audit Fail: Visually hidden confirm modal overlay is intercepting pointer-events!`);
      }
      if (auditResult.systemRoutesCount > 1) {
        throw new Error(`DOM Audit Fail: Multiple system route views render roots detected! (${auditResult.systemRoutesCount})`);
      }
      if (auditResult.rejections.length > 0) {
        throw new Error(`Unhandled Rejection detected inside browser context: ${auditResult.rejections.join(', ')}`);
      }
      return auditResult;
    };

    await runDOMAudit('HOME Route');

    console.log('Focusing initial launcher card...');
    await page.focus('.app-card.focused');
    await delay(100);
    
    const initialIdx = await page.evaluate(() => window.ArcadeOS.selectedIndex);
    console.log(`Initial selection index on HOME: ${initialIdx}`);

    // Customizer is index 5
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await delay(100);
    }
    
    console.log('Clicking the focused launcher card to route to CUSTOMIZE...');
    await page.evaluate(() => document.querySelector('.app-card.focused')?.click());
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'CUSTOMIZE'
        && document.querySelector('#arcade-app-view')?.dataset.routeStatus === 'ready',
      { timeout: 12000 }
    );
    
    await runDOMAudit('CUSTOMIZE Open');
    
    console.log('Pressing Escape to return HOME...');
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'HOME' && document.querySelector('#arcade-home.active'),
      { timeout: 5000 }
    );
    
    await runDOMAudit('CUSTOMIZE back HOME');
    
    const selectedIdx = await page.evaluate(() => window.ArcadeOS.selectedIndex);
    console.log(`Current Selection Index (Expected: 5): ${selectedIdx}`);
    if (selectedIdx !== 5) throw new Error(`Focus recovery failed: expected selection index 5, got ${selectedIdx}`);

    console.log('Restoring focus to launcher card...');
    await page.focus('.app-card.focused');
    await delay(100);

    console.log('Routing directly to SETTINGS...');
    await page.evaluate(() => window.ArcadeOS.routeTo('SETTINGS'));
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'SETTINGS'
        && document.querySelector('#arcade-app-view')?.dataset.routeStatus === 'ready'
        && document.getElementById('settings-back-btn'),
      { timeout: 12000 }
    );
    
    await runDOMAudit('SETTINGS Open');

    console.log('Focusing settings back button...');
    await page.focus('#settings-back-btn');
    await delay(100);

    await page.evaluate(() => {
      const target = document.getElementById('setting-reset-btn');
      document.querySelectorAll('.is-ui-focused').forEach(element => element.classList.remove('is-ui-focused'));
      target?.focus();
      target?.classList.add('is-ui-focused');
    });
    await delay(100);

    const resetFocusedId = await page.evaluate(() => document.querySelector('.is-ui-focused')?.id);
    console.log(`Focused element (Expected: setting-reset-btn): ${resetFocusedId}`);
    if (resetFocusedId !== 'setting-reset-btn') throw new Error(`Failed to focus settings reset button, focused ID: ${resetFocusedId}`);

    console.log('Clicking Setting Reset Button to trigger confirm modal...');
    await page.click('#setting-reset-btn');
    await delay(400);

    const isModalActive = await page.evaluate(() => {
      const modal = document.getElementById('arcade-confirm-modal');
      return modal ? modal.classList.contains('active') : false;
    });
    console.log(`Confirm Modal opened: ${isModalActive}`);
    if (!isModalActive) throw new Error('Custom accessible confirm modal did not open!');

    console.log('Pressing Escape to cancel confirm modal...');
    await page.focus('#modal-confirm-btn');
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => !document.getElementById('arcade-confirm-modal')?.classList.contains('active'),
      { timeout: 3000 }
    );

    const isModalActiveAfterCancel = await page.evaluate(() => {
      const modal = document.getElementById('arcade-confirm-modal');
      return modal ? modal.classList.contains('active') : false;
    });
    console.log(`Confirm Modal active after cancel (Expected: false): ${isModalActiveAfterCancel}`);
    if (isModalActiveAfterCancel) throw new Error('Confirm modal remained active after Escape cancel!');

    console.log('Going back HOME from SETTINGS...');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const modal = document.getElementById('arcade-confirm-modal');
      return window.ArcadeOS?.state === 'HOME'
        && (!modal || (
          getComputedStyle(modal).pointerEvents === 'none'
          && Number.parseFloat(getComputedStyle(modal).opacity) < 0.01
        ));
    }, { timeout: 3000 });
    await runDOMAudit('HOME from SETTINGS');

    console.log('\n--- TEST 3: Rapid Navigation Race Test ---');

    await page.evaluate(() => {
      window.ArcadeOS.selectedIndex = 0;
      window.ArcadeOS.renderHome();
    });

    console.log('Triggering rapid navigations: ACHIEVEMENTS then immediately STATS...');
    await page.evaluate(() => {
      window.ArcadeOS.routeTo('ACHIEVEMENTS');
      window.ArcadeOS.routeTo('STATS');
    });

    await delay(600);

    const finalState = await page.evaluate(() => window.ArcadeOS.state);
    console.log(`Final OS state after race (Expected: STATS): ${finalState}`);
    if (finalState !== 'STATS') throw new Error(`Race condition fail: expected route STATS, got ${finalState}`);

    await runDOMAudit('STATS Race Resolved');

    console.log('Returning HOME...');
    await page.keyboard.press('Escape');
    await delay(300);
    await runDOMAudit('HOME from Race');

    console.log('Testing: open CUSTOMIZE then rapidly return HOME...');
    await page.evaluate(() => {
      window.ArcadeOS.routeTo('CUSTOMIZE');
      window.ArcadeOS.goHome();
    });
    await delay(600);
    await runDOMAudit('CUSTOMIZE to HOME resolved');

    console.log('Testing: press Enter repeatedly on a launcher card...');
    await page.evaluate(() => {
      window.ArcadeOS.selectedIndex = 5;
      window.ArcadeOS.renderHome();
    });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await delay(600);
    await runDOMAudit('CUSTOMIZE repeated Enter resolved');

    console.log('Testing: Escape while a module is still loading...');
    await page.evaluate(() => {
      window.ArcadeOS.goHome();
    });
    await delay(300);
    
    await page.evaluate(() => {
      window.ArcadeOS.routeTo('STATS');
    });
    await page.keyboard.press('Escape');
    await delay(600);
    await runDOMAudit('Escape during load resolved');

    console.log('\n--- TEST 4: SoundLab and Diagnostics Routes ---');

    console.log('Triggering routeTo("SOUNDLAB")...');
    await page.evaluate(() => {
      window.ArcadeOS.routeTo('SOUNDLAB');
    });
    await delay(800);

    const soundlabState = await page.evaluate(() => {
      const view = document.getElementById('arcade-app-view');
      return {
        state: window.ArcadeOS.state,
        status: view?.dataset.routeStatus,
        title: view?.querySelector('h2')?.textContent || '',
        profiles: view?.querySelectorAll('.sound-profile-card').length || 0,
        previewButtons: view?.querySelectorAll('[data-preview-event]').length || 0
      };
    });
    console.log(`SOUNDLAB state: ${soundlabState.state}, status: ${soundlabState.status}`);
    if (soundlabState.state !== 'SOUNDLAB') throw new Error(`Expected SOUNDLAB route, got ${soundlabState.state}`);
    if (soundlabState.status !== 'ready') throw new Error(`Expected SOUNDLAB ready status, got ${soundlabState.status}`);
    if (!soundlabState.title.toUpperCase().includes('SOUNDLAB')) throw new Error(`SOUNDLAB title missing, got "${soundlabState.title}"`);
    if (soundlabState.profiles < 5 || soundlabState.previewButtons < 8) throw new Error('SOUNDLAB controls did not render.');
    await runDOMAudit('SOUNDLAB Open');

    await page.keyboard.press('Escape');
    await delay(300);
    await runDOMAudit('HOME from SOUNDLAB');

    console.log('Triggering routeTo("DIAGNOSTICS")...');
    await page.evaluate(() => {
      window.ArcadeOS.routeTo('DIAGNOSTICS');
    });
    await delay(800);

    const diagnosticsState = await page.evaluate(() => {
      const view = document.getElementById('arcade-app-view');
      return {
        state: window.ArcadeOS.state,
        status: view?.dataset.routeStatus,
        title: view?.querySelector('h2')?.textContent || '',
        panels: view?.querySelectorAll('.diagnostic-panel').length || 0,
        actions: view?.querySelectorAll('.diagnostics-toolbar button').length || 0
      };
    });
    console.log(`DIAGNOSTICS state: ${diagnosticsState.state}, status: ${diagnosticsState.status}`);
    if (diagnosticsState.state !== 'DIAGNOSTICS') throw new Error(`Expected DIAGNOSTICS route, got ${diagnosticsState.state}`);
    if (diagnosticsState.status !== 'ready') throw new Error(`Expected DIAGNOSTICS ready status, got ${diagnosticsState.status}`);
    if (!diagnosticsState.title.toUpperCase().includes('DIAGNOSTICS')) throw new Error(`DIAGNOSTICS title missing, got "${diagnosticsState.title}"`);
    if (diagnosticsState.panels < 12 || diagnosticsState.actions < 5) throw new Error('DIAGNOSTICS panels did not render.');
    await runDOMAudit('DIAGNOSTICS Open');

    await page.keyboard.press('Escape');
    await delay(300);
    await runDOMAudit('HOME from DIAGNOSTICS');

    if (errors.length > 0) {
      throw new Error(`Browser Console/Page errors captured during test:\n${errors.join('\n')}`);
    }

    console.log('\n=== ALL ARCADE E2E ROUTE NAVIGATION TESTS PASSED SUCCESSFULLY! ===');
    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ E2E TEST CRITICAL FAILURE:', err);
    await browser.close();
    process.exit(1);
  }
})();

async function browserLaunch() {
  return await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
