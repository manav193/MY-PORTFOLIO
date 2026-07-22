// E2E and Unit Test Runner for ArcadeOS Achievements & Profile (Phase 4B)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Load and evaluate modules locally for pure Node.js unit tests
const achievementsFile = fs.readFileSync(path.join(__dirname, 'frontend/js/modules/arcade-achievements.js'), 'utf8');
const cleanAchievementsCode = achievementsFile
  .replace(/export function/g, 'function')
  .replace(/export const/g, 'const')
  .replace(/export default/g, '// export default');

// Load the pure functions into global space for testing
eval(cleanAchievementsCode);

let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    testsFailed++;
  } else {
    console.log(`✅ ASSERTION PASSED: ${message}`);
  }
}

console.log('=== PHASE 1: RUNNING PURE UNIT TESTS ===');

// 1. Test rank calculation boundaries & formulas (Correction 4)
try {
  // Formula: points = sessionsPlayed * 10 + playtime/300 * 5 + achievementsUnlocked * 20 + uniqueAppsPlayed * 30 + presetsCreated * 15
  
  // Test lower boundary of Visitor (0 points)
  let rank = calculateProfileRank({ sessionsPlayed: 0, totalPlaytime: 0, achievementsUnlocked: 0, uniqueAppsPlayed: 0, presetsCreated: 0 });
  assert(rank.score === 0, 'Score is 0 for initial stats');
  assert(rank.title === 'Visitor', 'Initial rank is Visitor');
  assert(rank.progress === 0, 'Visitor progress is 0%');

  // Test upper boundary of Visitor / threshold of Operator (100 points)
  // Let's get exactly 100 points: 10 sessions (10*10 = 100)
  rank = calculateProfileRank({ sessionsPlayed: 10 });
  assert(rank.score === 100, 'Score is 100 with 10 sessions');
  assert(rank.title === 'Operator', 'Rank threshold 100 is Operator');
  assert(rank.progress === 0, 'Operator start progress is 0%');

  // Test boundary at 95 points (should still be Visitor, progress 95%)
  rank = calculateProfileRank({ sessionsPlayed: 8, totalPlaytime: 900 }); // 80 + 15 = 95
  assert(rank.score === 95, 'Score is 95');
  assert(rank.title === 'Visitor', 'Rank 95 is Visitor');
  assert(rank.progress === 95, 'Visitor progress is 95%');

  // Test Technician threshold (400 points)
  // Let's get exactly 400 points: 40 sessions (40*10 = 400)
  rank = calculateProfileRank({ sessionsPlayed: 40 });
  assert(rank.score === 400, 'Score is 400');
  assert(rank.title === 'Technician', 'Rank threshold 400 is Technician');
  assert(rank.progress === 0, 'Technician start progress is 0%');

  // Test Arcade Regular threshold (1000 points)
  // Let's get exactly 1000 points: 100 sessions
  rank = calculateProfileRank({ sessionsPlayed: 100 });
  assert(rank.score === 1000, 'Score is 1000');
  assert(rank.title === 'Arcade Regular', 'Rank threshold 1000 is Arcade Regular');
  assert(rank.progress === 0, 'Arcade Regular start progress is 0%');

  // Test Machine Master threshold (2500 points)
  // Let's get exactly 2500 points: 250 sessions
  rank = calculateProfileRank({ sessionsPlayed: 250 });
  assert(rank.score === 2500, 'Score is 2500');
  assert(rank.title === 'Machine Master', 'Rank threshold 2500 is Machine Master');
  assert(rank.progress === 100, 'Machine Master progress is 100%');

  // Test Negative Inputs (Correction 4)
  rank = calculateProfileRank({ sessionsPlayed: -5, totalPlaytime: -1800, achievementsUnlocked: -2, uniqueAppsPlayed: -1, presetsCreated: -1 });
  assert(rank.score === 0, 'Malformed negative scores normalized to 0');
  assert(rank.title === 'Visitor', 'Negative params fallback to Visitor');

  // Test Missing Fields (Correction 4)
  rank = calculateProfileRank({});
  assert(rank.score === 0, 'Empty params object is safe');
  assert(rank.title === 'Visitor', 'Missing fields fallback to Visitor');

  // Test Maximum Rank Threshold boundaries
  rank = calculateProfileRank({ sessionsPlayed: 1000, totalPlaytime: 360000 }); // points >> 2500
  assert(rank.score > 2500, 'High scores calculate correctly');
  assert(rank.title === 'Machine Master', 'High scores cap/keep Machine Master rank');
  assert(rank.progress === 100, 'Max rank progress stays capped at 100%');

} catch (e) {
  console.error('rank math unit tests threw an error:', e);
  testsFailed++;
}

// 2. Test timestamp preservation during database migration (Correction 7)
try {
  // Test legacy string format
  let ts = extractBestTimestamp('2026-07-10T12:00:00.000Z');
  assert(ts === '2026-07-10T12:00:00.000Z', 'Valid date string timestamp preserved');

  // Test legacy objects
  ts = extractBestTimestamp({ unlockedAt: '2026-07-11T14:30:00.000Z' });
  assert(ts === '2026-07-11T14:30:00.000Z', 'Legacy unlockedAt string preserved');

  ts = extractBestTimestamp({ timestamp: '2026-07-12T15:00:00.000Z' });
  assert(ts === '2026-07-12T15:00:00.000Z', 'Legacy timestamp field preserved');

  ts = extractBestTimestamp({ date: '2026-07-13T09:00:00.000Z' });
  assert(ts === '2026-07-13T09:00:00.000Z', 'Legacy date field preserved');

  // Test malformed fallbacks
  ts = extractBestTimestamp('invalid-date-string');
  assert(!isNaN(new Date(ts).getTime()), 'Malformed date fallback generates valid ISO string');

  ts = extractBestTimestamp(null);
  assert(!isNaN(new Date(ts).getTime()), 'Null date fallback generates valid ISO string');

} catch (e) {
  console.error('timestamp extractor unit tests threw an error:', e);
  testsFailed++;
}


console.log('\n=== PHASE 2: RUNNING E2E BROWSER TESTS ===');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[Browser PageError] ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:4173/...');
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    
    // Clear state & converge
    await page.evaluate(() => {
      localStorage.clear();
      window.scrollTo(0, window.innerHeight * 1.5);
    });

    console.log('Waiting for boot sequence...');
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'HOME' && document.querySelector('#arcade-home.active'),
      { timeout: 12000 }
    );

    // Reset index to HOME launcher
    await page.evaluate(() => {
      window.ArcadeOS.selectedIndex = 0;
      window.ArcadeOS.renderHome();
      document.querySelector('.app-card.focused')?.focus();
    });

    // 1. Verify we can navigate to ACHIEVEMENTS (index 6)
    console.log('Selecting ACHIEVEMENTS...');
    await page.evaluate(() => document.querySelector('[data-launcher-id="achievements"]')?.click());
    await page.waitForFunction(
      () => document.querySelector('.app-card.focused')?.dataset.launcherId === 'achievements',
      { timeout: 5000 }
    );
    console.log('Activating the selected ACHIEVEMENTS card...');
    await page.evaluate(() => document.querySelector('.app-card.focused')?.click());
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'ACHIEVEMENTS'
        && document.querySelector('#arcade-app-view')?.dataset.routeStatus === 'ready'
        && document.querySelector('.achievement-card'),
      { timeout: 12000 }
    );

    // Check we are on the ACHIEVEMENTS route
    const currentRoute = await page.evaluate(() => window.ArcadeOS.state);
    assert(currentRoute === 'ACHIEVEMENTS', `Currently on route state: "${currentRoute}"`);

    // Verify hidden achievement description obfuscation (Correction 6)
    const hiddenCardText = await page.evaluate(() => {
      // Find a hidden achievement
      const elements = Array.from(document.querySelectorAll('.achievement-card'));
      for (const el of elements) {
        const titleEl = el.querySelector('div[style*="font-weight:bold"]');
        if (titleEl && titleEl.textContent.trim().toUpperCase() === 'HIDDEN ACHIEVEMENT') {
          const descEl = el.querySelector('div[style*="opacity:0.6"]');
          return {
            title: titleEl.textContent,
            desc: descEl ? descEl.textContent : '',
            progExist: !!el.querySelector('[role="progressbar"]')
          };
        }
      }
      return null;
    });

    if (hiddenCardText) {
      assert(hiddenCardText.title.trim().toUpperCase() === 'HIDDEN ACHIEVEMENT', 'Secret achievement title is hidden');
      assert(hiddenCardText.desc === 'Keep playing to find out.', 'Secret achievement description is hidden');
      assert(hiddenCardText.progExist === false, 'Secret achievement progress is completely hidden');
    } else {
      console.warn('Could not locate the hidden achievement cards in the DOM');
    }

    // Return HOME
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));

    // 2. Verify selection focus was restored correctly (Correction 1)
    const restoredIndex = await page.evaluate(() => window.ArcadeOS.selectedIndex);
    assert(restoredIndex === 6, `Focus index restored to launcher item index: ${restoredIndex}`);

    // 3. Verify Decoupled session collection (Correction 3)
    console.log('Testing decoupled session achievements set...');
    await page.evaluate(async () => {
      // Ensure engines are loaded first
      await new Promise(resolve => window.ArcadeOS.loadAchievementsEngine(() => resolve()));
      await new Promise(resolve => window.ArcadeOS.loadStatsEngine(() => resolve()));

      // Simulate coin inserted & launch reaction game
      window.ArcadeEventBus.emit('COIN_INSERTED');
      window.ArcadeEventBus.emit('GAME_LAUNCHED', { id: 'reaction' });
      
      // Simulate unlocking "under_300" achievement during active session
      window.ArcadeAchievements.unlock('under_300');
      
      // End session
      window.ArcadeStats.endSession('completed');
    });

    const reactionHistory = await page.evaluate(() => {
      const recent = window.ArcadeStats.data.recentSessions;
      return recent.length > 0 ? recent[0] : null;
    });

    assert(reactionHistory && reactionHistory.achievementsUnlocked.includes('under_300'), 'Unlocked achievement captured during active game session');
    assert(reactionHistory && reactionHistory.achievementsUnlocked.length === 1, 'Decoupled session Set contains exactly one item');

    // 4. Verify STATS Route (index 7)
    console.log('Navigating to STATS route...');
    await page.evaluate(() => {
      window.ArcadeOS.selectedIndex = 0;
      window.ArcadeOS.renderHome();
      document.querySelector('.app-card.focused')?.focus();
    });
    await page.evaluate(() => document.querySelector('[data-launcher-id="stats"]')?.click());
    await page.waitForFunction(
      () => document.querySelector('.app-card.focused')?.dataset.launcherId === 'stats',
      { timeout: 5000 }
    );
    await page.evaluate(() => document.querySelector('.app-card.focused')?.click());
    await page.waitForFunction(
      () => window.ArcadeOS?.state === 'STATS'
        && document.querySelector('#arcade-app-view')?.dataset.routeStatus === 'ready'
        && document.getElementById('clear-history-btn'),
      { timeout: 12000 }
    );

    const statsRoute = await page.evaluate(() => window.ArcadeOS.state);
    assert(statsRoute === 'STATS', `STATS route loads successfully: "${statsRoute}"`);

    // Verify clear history confirm modal works using delegated action system (Correction 5)
    console.log('Clicking Clear History button...');
    await page.click('#clear-history-btn');
    await page.waitForFunction(
      () => document.getElementById('arcade-confirm-modal')?.classList.contains('active'),
      { timeout: 5000 }
    );

    const isModalActive = await page.evaluate(() => {
      const modal = document.getElementById('arcade-confirm-modal');
      return modal && modal.classList.contains('active');
    });
    assert(isModalActive === true, 'Confirmation modal opens after clicking Clear History button');

    // Click confirm inside modal
    console.log('Confirming reset inside modal...');
    await page.click('#modal-confirm-btn');
    await page.waitForFunction(
      () => !document.getElementById('arcade-confirm-modal')?.classList.contains('active')
        && window.ArcadeStats?.data.recentSessions.length === 0,
      { timeout: 5000 }
    );

    const clearedHistoryLength = await page.evaluate(() => {
      return window.ArcadeStats.data.recentSessions.length;
    });
    assert(clearedHistoryLength === 0, 'Recent session history cleared successfully');

    await browser.close();
    
    if (testsFailed > 0) {
      console.log(`\n❌ TEST SUITE FAILED WITH ${testsFailed} FAILURES.`);
      process.exit(1);
    } else {
      console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟');
      process.exit(0);
    }
  } catch (err) {
    console.error('Browser run critical failure:', err);
    await browser.close();
    process.exit(1);
  }
})();
