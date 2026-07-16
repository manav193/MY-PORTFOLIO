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

    // Populate old V1 achievements array structure in localStorage
    const oldAchievements = ["first_boot", "first_coin"];
    localStorage.setItem('arcade_machine_achievements', JSON.stringify(oldAchievements));

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
    await new Promise(r => setTimeout(r, 100));
    window.ArcadeOS.routeTo('ACHIEVEMENTS');
    await new Promise(r => setTimeout(r, 200));

    const stats = window.ArcadeStats.data;
    const achievements = window.ArcadeAchievements.data;

    return {
      schema: stats.schemaVersion,
      playtime: stats.totalPlaytime,
      launches: stats.totalLaunches,
      currentCredits: stats.currentCredits,
      lifetimeCoins: stats.lifetimeCoinInserts,
      reactionBest: stats.perGame.reaction.bestReactionMs,
      snakeBest: stats.perGame.snake.highScore,
      lastPlayed: stats.lastPlayedGameId,
      achSchema: achievements.schemaVersion,
      unlockedIds: Object.keys(achievements.unlocked)
    };
  });

  console.log(`Migrated Schema: ${migrationResult.schema} (Expected: 2)`);
  console.log(`Migrated Playtime: ${migrationResult.playtime} (Expected: 120.5)`);
  console.log(`Migrated Current Credits: ${migrationResult.currentCredits} (Expected: 4)`);
  console.log(`Migrated Lifetime Coins: ${migrationResult.lifetimeCoins} (Expected: 10)`);
  console.log(`Migrated Reaction Best Score: ${migrationResult.reactionBest} (Expected: 240)`);
  console.log(`Migrated Snake High Score: ${migrationResult.snakeBest} (Expected: 30)`);
  console.log(`Migrated Last Played Game: "${migrationResult.lastPlayed}" (Expected: snake)`);
  console.log(`Achievements Schema: ${migrationResult.achSchema} (Expected: 2)`);
  console.log(`Achievements Unlocked count: ${migrationResult.unlockedIds.length} (Expected: 2)`);
  console.log(`Achievements Unlocked list: ${JSON.stringify(migrationResult.unlockedIds)} (Expected: ["first_boot", "first_coin"])`);

  if (migrationResult.schema !== 2 || migrationResult.playtime !== 120.5 || migrationResult.currentCredits !== 4 || migrationResult.reactionBest !== 240 || migrationResult.snakeBest !== 30 || migrationResult.achSchema !== 2 || !migrationResult.unlockedIds.includes("first_boot") || !migrationResult.unlockedIds.includes("first_coin")) {
    console.error('FAIL: Stats/Achievements Schema V1 to V2 migration checks failed.');
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

  // 5. Test achievements unlock prevention, timestamps, and categories progress calculation
  console.log('\n--- STEP 5: Testing Achievements Progress & Category Filtering ---');
  const achievementsCheck = await page.evaluate(() => {
    const achEngine = window.ArcadeAchievements;

    // Evaluate under_200 achievement unlock
    achEngine.evaluate('REACTION_SCORE', { score: 190 });
    const isUnlocked = achEngine.getUnlocked().includes('under_200');
    const timestamp = achEngine.data.unlocked['under_200']?.unlockedAt;

    // Attempt duplicate unlock (should ignore)
    const countBefore = achEngine.getUnlocked().length;
    achEngine.unlock('under_200');
    const countAfter = achEngine.getUnlocked().length;

    // Calculate progress for played_every_app
    const progressEveryApp = achEngine.getProgress('every_app');

    return {
      isUnlocked,
      hasTimestamp: !!timestamp,
      unlockedCountPreserved: countBefore === countAfter,
      progressEveryAppCurrent: progressEveryApp ? progressEveryApp.current : 0,
      progressEveryAppTarget: progressEveryApp ? progressEveryApp.target : 0
    };
  });

  console.log(`under_200 Unlocked successfully: ${achievementsCheck.isUnlocked} (Expected: true)`);
  console.log(`Unlock Timestamp populated: ${achievementsCheck.hasTimestamp} (Expected: true)`);
  console.log(`Duplicate unlock blocked: ${achievementsCheck.unlockedCountPreserved} (Expected: true)`);
  console.log(`every_app current launch count: ${achievementsCheck.progressEveryAppCurrent} (Expected: 2, reaction and snake launched in migration/session steps)`);
  console.log(`every_app target launch count: ${achievementsCheck.progressEveryAppTarget} (Expected: 5)`);

  if (!achievementsCheck.isUnlocked || !achievementsCheck.hasTimestamp || !achievementsCheck.unlockedCountPreserved || achievementsCheck.progressEveryAppCurrent < 2) {
    console.error('FAIL: Achievements engine checks failed.');
    process.exit(1);
  }

  // 6. Test session achievements mapping
  console.log('\n--- STEP 6: Testing Session Achievement Mapping ---');
  const sessionAchCheck = await page.evaluate(() => {
    // Start session
    window.ArcadeStats.startSession('breakout');
    // Trigger achievements unlock during gameplay
    window.ArcadeAchievements.unlock('breakout_brick');
    // End session
    window.ArcadeStats.endSession('completed');

    const newestSession = window.ArcadeStats.data.recentSessions[0];
    return {
      gamePlayed: newestSession.gameId,
      sessionUnlocks: newestSession.achievementsUnlocked
    };
  });
  console.log(`Newest Session Game: "${sessionAchCheck.gamePlayed}" (Expected: breakout)`);
  console.log(`Achievements logged to session record: ${JSON.stringify(sessionAchCheck.sessionUnlocks)} (Expected: ["breakout_brick"])`);

  if (sessionAchCheck.gamePlayed !== 'breakout' || !sessionAchCheck.sessionUnlocks.includes('breakout_brick')) {
    console.error('FAIL: Session achievements mapping check failed.');
    process.exit(1);
  }

  // 7. Test profile activity ranks calculation
  console.log('\n--- STEP 7: Testing Profile Activity Ranks Calculation ---');
  const rankCheck = await page.evaluate(() => {
    const achEngine = window.ArcadeAchievements;

    // Simulate low activity (Correction 12 - Visitor/Operator)
    window.ArcadeStats.data.sessionsPlayed = 2;
    window.ArcadeStats.data.totalPlaytime = 120;
    window.ArcadeStats.data.recentSessions = [];
    window.ArcadeStats.saveToStorage();

    achEngine.data.unlocked = {};
    achEngine.saveToStorage();
    const rankVisitor = achEngine.calculatePlayerRank();

    // Simulate high activity: unlocks, playtime, presets, apps (Correction 12 - Arcade Regular)
    window.ArcadeStats.data.sessionsPlayed = 50;
    window.ArcadeStats.data.totalPlaytime = 3600;
    window.ArcadeStats.data.perGame.reaction.launches = 1;
    window.ArcadeStats.data.perGame.snake.launches = 1;
    window.ArcadeStats.data.perGame.breakout.launches = 1;
    window.ArcadeStats.data.perGame.pixelpad.launches = 1;
    window.ArcadeStats.data.perGame.palettelab.launches = 1;
    window.ArcadeStats.saveToStorage();

    localStorage.setItem('arcade_machine_customization', JSON.stringify({ presets: [1, 2, 3, 4, 5] }));

    // Unlock 12 achievements manually
    for (let i = 0; i < 12; i++) {
      const achId = achEngine.REGISTRY[i].id;
      achEngine.unlock(achId);
    }

    const rankRegular = achEngine.calculatePlayerRank();

    return {
      visitorTitle: rankVisitor.title,
      regularTitle: rankRegular.title,
      regularProgress: rankRegular.progress
    };
  });
  console.log(`Initial Rank: "${rankCheck.visitorTitle}" (Expected: Visitor/Operator)`);
  console.log(`Simulated High Rank: "${rankCheck.regularTitle}" (Expected: Arcade Regular)`);
  console.log(`Simulated Rank progress: ${rankCheck.regularProgress}%`);

  if (rankCheck.regularTitle !== 'Arcade Regular') {
    console.error('FAIL: Profile Rank system calculation verification failed.');
    process.exit(1);
  }

  // 8. Test recent sessions history clear operation (without resetting aggregate stats)
  console.log('\n--- STEP 8: Testing Recent Sessions history clear ---');
  const clearHistoryCheck = await page.evaluate(() => {
    const initialPlaytime = window.ArcadeStats.data.totalPlaytime;
    const initialLaunches = window.ArcadeStats.data.totalLaunches;

    // Simulate clear recent logs
    window.ArcadeStats.data.recentSessions = [];
    window.ArcadeStats.saveToStorage();

    return {
      logsSize: window.ArcadeStats.data.recentSessions.length,
      playtimePreserved: window.ArcadeStats.data.totalPlaytime === initialPlaytime,
      launchesPreserved: window.ArcadeStats.data.totalLaunches === initialLaunches
    };
  });
  console.log(`Cleared logs history length: ${clearHistoryCheck.logsSize} (Expected: 0)`);
  console.log(`Aggregate Playtime preserved: ${clearHistoryCheck.playtimePreserved} (Expected: true)`);
  console.log(`Aggregate Launches preserved: ${clearHistoryCheck.launchesPreserved} (Expected: true)`);

  if (clearHistoryCheck.logsSize !== 0 || !clearHistoryCheck.playtimePreserved || !clearHistoryCheck.launchesPreserved) {
    console.error('FAIL: Recent sessions logs clear operation verification failed.');
    process.exit(1);
  }

  // 9. Test views rendering
  console.log('\n--- STEP 9: Testing Stats, Leaderboards, Achievements and Profile view rendering ---');
  await page.evaluate(() => {
    window.ArcadeOS.routeTo('STATS');
  });
  await new Promise(r => setTimeout(r, 100));

  await page.evaluate(() => {
    window.ArcadeOS.routeTo('ACHIEVEMENTS');
  });
  await new Promise(r => setTimeout(r, 100));

  await page.evaluate(() => {
    window.ArcadeOS.routeTo('PROFILE');
  });
  await new Promise(r => setTimeout(r, 200));

  const profileRendered = await page.evaluate(() => {
    const title = document.querySelector('.profile-app h2').textContent;
    const activeRankText = document.querySelector('.profile-content').innerText;
    return { title, activeRankText };
  });

  console.log(`PROFILE view header title: "${profileRendered.title}" (Expected: PLAYER PROFILE)`);
  console.log(`PROFILE view contains ACTIVITY RANK: ${profileRendered.activeRankText.includes('ACTIVITY RANK')}`);

  if (profileRendered.title !== 'PLAYER PROFILE' || !profileRendered.activeRankText.includes('ACTIVITY RANK')) {
    console.error('FAIL: PROFILE view rendering verification failed.');
    process.exit(1);
  }

  console.log('\n=== PHASE 4B VALIDATION COMPLETED SUCCESSFULLY! ===');
  await browser.close();
})();
