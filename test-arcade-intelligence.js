const puppeteer = require('puppeteer');

(async () => {
  console.log('=== STARTING ARCADE OS INTELLIGENCE VALIDATION ===');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1440, height: 900 });
  
  // Navigate to local preview
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  
  // 1. Test Schema V1 -> V2 Migration
  console.log('\n--- STEP 1: Simulating V1 -> V2 Migration ---');
  await page.evaluate(() => {
    // Populate old V1 stats data structure in localStorage
    const oldStats = {
      totalPlaytime: 120.5,
      launches: {
        reaction: 5,
        snake: 2
      },
      currentCredits: 4,
      lifetimeCoinInserts: 10,
      lastPlayedGameId: 'snake'
    };
    localStorage.setItem('arcade_machine_stats', JSON.stringify(oldStats));
    
    // Set legacy best score keys
    localStorage.setItem('arcade_reaction_best', '240');
    localStorage.setItem('arcade_snake_best', '30');
    
    // Boot OS to trigger lazy-load and migration
    window.__TEST_MODE__ = true;
    window.ArcadeOS.boot();
  });
  
  // Wait for dynamic module import and migration
  await new Promise(r => setTimeout(r, 600));
  
  const migrationResult = await page.evaluate(async () => {
    // Navigate to STATS route to force stats engine to initialize if not done
    window.ArcadeOS.routeTo('STATS');
    // Allow brief time for import resolving
    await new Promise(r => setTimeout(r, 200));
    
    const stats = window.ArcadeStats.data;
    return {
      schema: stats.schemaVersion,
      playtime: stats.totalPlaytime,
      launches: stats.totalLaunches,
      currentCredits: stats.currentCredits,
      lifetimeCoins: stats.lifetimeCoinInserts,
      reactionBest: stats.perGame.reaction.bestReactionMs,
      snakeBest: stats.perGame.snake.highScore,
      lastPlayed: stats.lastPlayedGameId
    };
  });
  
  console.log(`Migrated Schema: ${migrationResult.schema} (Expected: 2)`);
  console.log(`Migrated Playtime: ${migrationResult.playtime} (Expected: 120.5)`);
  console.log(`Migrated Current Credits: ${migrationResult.currentCredits} (Expected: 4)`);
  console.log(`Migrated Lifetime Coins: ${migrationResult.lifetimeCoins} (Expected: 10)`);
  console.log(`Migrated Reaction Best Score: ${migrationResult.reactionBest} (Expected: 240)`);
  console.log(`Migrated Snake High Score: ${migrationResult.snakeBest} (Expected: 30)`);
  console.log(`Migrated Last Played Game: "${migrationResult.lastPlayed}" (Expected: snake)`);
  
  if (migrationResult.schema !== 2 || migrationResult.playtime !== 120.5 || migrationResult.currentCredits !== 4 || migrationResult.reactionBest !== 240 || migrationResult.snakeBest !== 30) {
    console.error('FAIL: Stats Schema V1 to V2 migration checks failed.');
    process.exit(1);
  }
  
  // 2. Test Central Session Idempotency
  console.log('\n--- STEP 2: Testing Central Session Idempotency ---');
  const sessionCheck = await page.evaluate(async () => {
    // Start session 1
    window.ArcadeStats.startSession('reaction');
    const s1_active = !!window.ArcadeStats.activeSession;
    const s1_game = window.ArcadeStats.activeSession ? window.ArcadeStats.activeSession.gameId : '';
    
    // Start session 2 without ending 1 (should automatically end session 1 and start session 2)
    window.ArcadeStats.startSession('snake');
    const s2_active = !!window.ArcadeStats.activeSession;
    const s2_game = window.ArcadeStats.activeSession ? window.ArcadeStats.activeSession.gameId : '';
    
    // End session 2
    window.ArcadeStats.endSession('completed');
    const ended_active = !!window.ArcadeStats.activeSession;
    
    return { s1_active, s1_game, s2_active, s2_game, ended_active };
  });
  
  console.log(`Session 1 Active initially: ${sessionCheck.s1_active} (Expected: true)`);
  console.log(`Session 1 Game: "${sessionCheck.s1_game}" (Expected: reaction)`);
  console.log(`Session 2 automatically took over: ${sessionCheck.s2_active} (Expected: true)`);
  console.log(`Session 2 Game: "${sessionCheck.s2_game}" (Expected: snake)`);
  console.log(`Active session cleared after endSession: ${!sessionCheck.ended_active} (Expected: true)`);
  
  if (!sessionCheck.s1_active || sessionCheck.s1_game !== 'reaction' || !sessionCheck.s2_active || sessionCheck.s2_game !== 'snake' || sessionCheck.ended_active) {
    console.error('FAIL: Central session idempotency checks failed.');
    process.exit(1);
  }
  
  // 3. Test Leaderboard score recording
  console.log('\n--- STEP 3: Testing High Score / Record updating ---');
  const scoreResult = await page.evaluate(() => {
    // Record a faster reaction time (e.g., 180ms)
    window.ArcadeStats.recordScore('reaction', 180);
    // Record a higher snake score (e.g., 45)
    window.ArcadeStats.recordScore('snake', 45);
    
    const reactionBest = window.ArcadeStats.data.perGame.reaction.bestReactionMs;
    const snakeBest = window.ArcadeStats.data.perGame.snake.highScore;
    return { reactionBest, snakeBest };
  });
  
  console.log(`New Reaction Best: ${scoreResult.reactionBest} (Expected: 180)`);
  console.log(`New Snake Best: ${scoreResult.snakeBest} (Expected: 45)`);
  
  if (scoreResult.reactionBest !== 180 || scoreResult.snakeBest !== 45) {
    console.error('FAIL: Record scores updating checks failed.');
    process.exit(1);
  }
  
  // 4. Test recent game history capping
  console.log('\n--- STEP 4: Testing Recent Sessions Log capping (Max 50) ---');
  const capCheck = await page.evaluate(() => {
    // Fill stats history list with 55 sessions
    window.ArcadeStats.data.recentSessions = [];
    for (let i = 0; i < 55; i++) {
      window.ArcadeStats.startSession('reaction');
      window.ArcadeStats.endSession('completed');
    }
    return window.ArcadeStats.data.recentSessions.length;
  });
  console.log(`Recent sessions log size: ${capCheck} (Expected: 50)`);
  if (capCheck !== 50) {
    console.error('FAIL: Recent sessions history failed to cap at 50 entries.');
    process.exit(1);
  }
  
  // 5. Test stats route rendering
  console.log('\n--- STEP 5: Testing STATS view rendering ---');
  await page.evaluate(() => {
    window.ArcadeOS.routeTo('STATS');
  });
  await new Promise(r => setTimeout(r, 200));
  
  const statsRendered = await page.evaluate(() => {
    const title = document.querySelector('.stats-app h2').textContent;
    const items = document.querySelectorAll('.metrics-block table tr');
    return { title, itemsCount: items.length };
  });
  console.log(`STATS view header title: "${statsRendered.title}" (Expected: STATS DASHBOARD)`);
  console.log(`STATS tables items rendered count: ${statsRendered.itemsCount} (Expected: 6)`);
  
  if (statsRendered.title !== 'STATS DASHBOARD' || statsRendered.itemsCount !== 6) {
    console.error('FAIL: STATS view rendering verification failed.');
    process.exit(1);
  }
  
  // 6. Test leaderboards route rendering
  console.log('\n--- STEP 6: Testing LEADERBOARDS view rendering ---');
  await page.evaluate(() => {
    window.ArcadeOS.routeTo('LEADERBOARDS');
  });
  await new Promise(r => setTimeout(r, 200));
  
  const leaderboardRendered = await page.evaluate(() => {
    const title = document.querySelector('.leaderboards-app h2').textContent;
    const rows = document.querySelectorAll('.leaderboards-app table tbody tr');
    return { title, rowsCount: rows.length };
  });
  console.log(`LEADERBOARDS view header title: "${leaderboardRendered.title}" (Expected: LOCAL LEADERBOARDS)`);
  console.log(`LEADERBOARDS tables rows rendered: ${leaderboardRendered.rowsCount} (Expected: 5)`);
  
  if (leaderboardRendered.title !== 'LOCAL LEADERBOARDS' || leaderboardRendered.rowsCount !== 5) {
    console.error('FAIL: LEADERBOARDS view rendering verification failed.');
    process.exit(1);
  }
  
  console.log('\n=== PHASE 4A VALIDATION COMPLETED SUCCESSFULLY! ===');
  await browser.close();
})();
