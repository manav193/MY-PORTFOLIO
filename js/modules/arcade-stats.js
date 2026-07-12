// Centralized Arcade Stats & Leaderboards Manager (Phase 4A)
// Handcrafted ES Module managing Session Lifecycles, Migration, and Dashboard UIs

export const ArcadeStats = {
  initialized: false,
  data: null,
  activeSession: null,
  
  APPROVED_GAME_IDS: ['reaction', 'snake', 'breakout', 'pixelpad', 'palettelab'],
  
  DEFAULT_STATS: {
    schemaVersion: 2,
    totalPlaytime: 0.0,
    totalLaunches: 0,
    sessionsPlayed: 0,
    currentCredits: 0,
    lifetimeCoinInserts: 0,
    favoriteGameId: "",
    lastPlayedGameId: "",
    longestSessionSeconds: 0.0,
    averageSessionSeconds: 0.0,
    perGame: {
      reaction: { launches: 0, playtimeSeconds: 0.0, lastPlayedAt: "", bestReactionMs: null },
      snake: { launches: 0, playtimeSeconds: 0.0, lastPlayedAt: "", highScore: 0, longestSurvivalSeconds: 0.0 },
      breakout: { launches: 0, playtimeSeconds: 0.0, lastPlayedAt: "", highScore: 0, highestLevel: 0, longestStreak: 0 },
      pixelpad: { launches: 0, playtimeSeconds: 0.0, lastPlayedAt: "", artworksSaved: 0, longestSessionSeconds: 0.0 },
      palettelab: { launches: 0, playtimeSeconds: 0.0, lastPlayedAt: "", palettesExported: 0, uniquePalettesGenerated: 0 }
    },
    recentSessions: []
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Load and Migrate
    this.loadAndMigrate();
    
    // Bind Event Bus Listeners
    if (window.ArcadeEventBus) {
      window.ArcadeEventBus.on('GAME_LAUNCHED', (data) => {
        if (data && data.id && this.APPROVED_GAME_IDS.includes(data.id)) {
          this.startSession(data.id);
        }
      });
      
      window.ArcadeEventBus.on('GAME_COMPLETED', (data) => {
        if (data && data.id && this.APPROVED_GAME_IDS.includes(data.id)) {
          this.recordCompletion(data.id);
          this.endSession('completed');
        }
      });
      
      window.ArcadeEventBus.on('REACTION_SCORE', (data) => {
        if (data && typeof data.score === 'number') {
          this.recordScore('reaction', data.score);
        }
      });
      
      window.ArcadeEventBus.on('SNAKE_SCORE', (data) => {
        if (data && typeof data.score === 'number') {
          this.recordScore('snake', data.score);
        }
      });
      
      window.ArcadeEventBus.on('BREAKOUT_SCORE', (data) => {
        if (data && typeof data.score === 'number') {
          this.recordScore('breakout', data.score);
        }
      });
      
      window.ArcadeEventBus.on('BREAKOUT_LEVEL_CLEARED', (data) => {
        if (data && typeof data.level === 'number') {
          this.recordBreakoutLevel(data.level);
        }
      });
      
      window.ArcadeEventBus.on('BREAKOUT_LONGEST_STREAK', (data) => {
        if (data && typeof data.streak === 'number') {
          this.recordBreakoutStreak(data.streak);
        }
      });
      
      window.ArcadeEventBus.on('PIXELPAD_SAVED', () => {
        this.recordCreativeAction('pixelpad');
      });
      
      window.ArcadeEventBus.on('PALETTE_EXPORTED', () => {
        this.recordCreativeAction('palettelab');
      });
      
      window.ArcadeEventBus.on('PALETTE_GENERATED', () => {
        this.recordPaletteGenerated();
      });
    }

    // Window Lifecycle Interceptions
    const handleUnloadOrHide = () => {
      if (this.activeSession) {
        this.endSession('exited');
      }
    };
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.activeSession) {
        this.endSession('interrupted');
      }
    });
    window.addEventListener('pagehide', handleUnloadOrHide);
    window.addEventListener('beforeunload', handleUnloadOrHide);
  },

  loadAndMigrate() {
    let raw = localStorage.getItem('arcade_machine_stats');
    let loaded = null;
    if (raw) {
      try {
        loaded = JSON.parse(raw);
      } catch (e) {
        console.warn("Failed to parse arcade_machine_stats, starting fresh", e);
      }
    }
    
    if (!loaded) {
      // Create fresh clone of default config
      this.data = JSON.parse(JSON.stringify(this.DEFAULT_STATS));
    } else {
      this.data = loaded;
    }
    
    // Check if we need migration from V1 (or unversioned structure)
    if (!this.data.schemaVersion || this.data.schemaVersion < 2) {
      console.log("Migrating stats schema from V1 to V2...");
      const v2 = JSON.parse(JSON.stringify(this.DEFAULT_STATS));
      
      // Preserve currentCredits
      if (typeof this.data.currentCredits === 'number') {
        v2.currentCredits = this.data.currentCredits;
      } else {
        const legacyCredits = parseInt(localStorage.getItem('arcade_credits') || localStorage.getItem('arcade_coin_credits') || '0', 10);
        v2.currentCredits = legacyCredits;
      }
      
      // Preserve lifetimeCoinInserts
      if (typeof this.data.lifetimeCoinInserts === 'number') {
        v2.lifetimeCoinInserts = this.data.lifetimeCoinInserts;
      } else {
        const legacyLifetimeCoins = parseInt(localStorage.getItem('arcade_lifetime_coins') || '0', 10);
        v2.lifetimeCoinInserts = legacyLifetimeCoins;
      }
      
      // Preserve total playtime
      if (typeof this.data.totalPlaytime === 'number') {
        v2.totalPlaytime = this.data.totalPlaytime;
      }
      
      // Preserve per-game launch counts
      if (this.data.launches && typeof this.data.launches === 'object') {
        for (const gameId of this.APPROVED_GAME_IDS) {
          if (typeof this.data.launches[gameId] === 'number') {
            v2.perGame[gameId].launches = this.data.launches[gameId];
            v2.totalLaunches += this.data.launches[gameId];
          }
        }
      }
      
      // Preserve legacy best scores
      const legacyReactionBest = localStorage.getItem('arcade_reaction_best');
      if (legacyReactionBest !== null) {
        v2.perGame.reaction.bestReactionMs = parseFloat(legacyReactionBest);
      }
      
      const legacySnakeBest = localStorage.getItem('arcade_snake_best');
      if (legacySnakeBest !== null) {
        v2.perGame.snake.highScore = parseInt(legacySnakeBest, 10);
      }
      
      const legacyBreakoutBest = localStorage.getItem('arcade_breakout_best');
      if (legacyBreakoutBest !== null) {
        v2.perGame.breakout.highScore = parseInt(legacyBreakoutBest, 10);
      }

      // Preserve lastPlayedGameId
      if (typeof this.data.lastPlayedGameId === 'string' && this.data.lastPlayedGameId) {
        v2.lastPlayedGameId = this.data.lastPlayedGameId;
      } else {
        const legacyLastPlayed = localStorage.getItem('arcade_last_played');
        if (legacyLastPlayed) v2.lastPlayedGameId = legacyLastPlayed;
      }
      
      this.data = v2;
      this.saveToStorage();
    }
  },

  saveToStorage() {
    this.data.schemaVersion = 2;
    localStorage.setItem('arcade_machine_stats', JSON.stringify(this.data));
    
    // Explicitly update legacy keys for backward compatibility
    if (this.data.perGame.reaction.bestReactionMs !== null) {
      localStorage.setItem('arcade_reaction_best', this.data.perGame.reaction.bestReactionMs.toString());
    }
    if (this.data.perGame.snake.highScore > 0) {
      localStorage.setItem('arcade_snake_best', this.data.perGame.snake.highScore.toString());
    }
    if (this.data.perGame.breakout.highScore > 0) {
      localStorage.setItem('arcade_breakout_best', this.data.perGame.breakout.highScore.toString());
    }
  },

  // ============================================================================
  // SESSION LIFECYCLE
  // ============================================================================
  startSession(gameId) {
    if (!this.APPROVED_GAME_IDS.includes(gameId)) return;
    
    // Idempotence safeguard: if another session is running, close it first!
    if (this.activeSession) {
      this.endSession('exited');
    }
    
    this.activeSession = {
      gameId: gameId,
      startedAt: new Date().toISOString(),
      startTimeMS: performance.now(),
      pendingScore: 0
    };
  },

  endSession(result) {
    if (!this.activeSession) return;
    
    const elapsedSeconds = (performance.now() - this.activeSession.startTimeMS) / 1000;
    
    // Validate / Clamp duration
    const clampedDuration = Math.max(0.0, Math.min(86400, elapsedSeconds));
    const formattedDuration = parseFloat(clampedDuration.toFixed(2));
    
    const gameId = this.activeSession.gameId;
    
    // Increment general metrics
    this.data.sessionsPlayed++;
    this.data.totalPlaytime = parseFloat((this.data.totalPlaytime + formattedDuration).toFixed(2));
    this.data.totalLaunches++;
    
    // Longest Session update
    if (formattedDuration > this.data.longestSessionSeconds) {
      this.data.longestSessionSeconds = formattedDuration;
    }
    
    // Average Session update
    this.data.averageSessionSeconds = parseFloat((this.data.totalPlaytime / this.data.sessionsPlayed).toFixed(2));
    
    // Update Per Game metrics
    const pg = this.data.perGame[gameId];
    if (pg) {
      pg.launches++;
      pg.playtimeSeconds = parseFloat((pg.playtimeSeconds + formattedDuration).toFixed(2));
      pg.lastPlayedAt = new Date().toISOString();
      
      // Update creative tools longest session
      if (gameId === 'pixelpad' && formattedDuration > pg.longestSessionSeconds) {
        pg.longestSessionSeconds = formattedDuration;
      }
    }
    
    this.data.lastPlayedGameId = gameId;
    
    // Recalculate Favorite Game (game with most playtime)
    let favId = "";
    let maxPlay = -1;
    for (const gid of this.APPROVED_GAME_IDS) {
      const play = this.data.perGame[gid].playtimeSeconds;
      if (play > maxPlay && play > 0) {
        maxPlay = play;
        favId = gid;
      }
    }
    this.data.favoriteGameId = favId;
    
    // Append to recent sessions (cap at 50, newest first)
    const sessionItem = {
      id: `session_${Date.now()}`,
      gameId: gameId,
      startedAt: this.activeSession.startedAt,
      endedAt: new Date().toISOString(),
      durationSeconds: formattedDuration,
      score: this.activeSession.pendingScore || 0,
      result: result || 'exited',
      achievementsUnlocked: []
    };
    
    this.data.recentSessions.unshift(sessionItem);
    if (this.data.recentSessions.length > 50) {
      this.data.recentSessions.pop();
    }
    
    this.activeSession = null;
    this.saveToStorage();
  },

  recordCoinInsert() {
    this.data.currentCredits = (this.data.currentCredits || 0) + 1;
    this.data.lifetimeCoinInserts = (this.data.lifetimeCoinInserts || 0) + 1;
    
    this.saveToStorage();
    if (window.ArcadeHardware) {
      window.ArcadeHardware.pulseStorage();
    }
    if (window.ArcadeEventBus) {
      window.ArcadeEventBus.emit('COIN_INSERTED', this.data);
    }
  },

  recordScore(gameId, score) {
    if (!this.APPROVED_GAME_IDS.includes(gameId)) return;
    
    // Update pending session score
    if (this.activeSession && this.activeSession.gameId === gameId) {
      this.activeSession.pendingScore = score;
    }
    
    const pg = this.data.perGame[gameId];
    if (!pg) return;
    
    let isRecord = false;
    if (gameId === 'reaction') {
      if (pg.bestReactionMs === null || score < pg.bestReactionMs) {
        pg.bestReactionMs = score;
        isRecord = true;
      }
    } else if (gameId === 'snake') {
      if (score > pg.highScore) {
        pg.highScore = score;
        isRecord = true;
      }
    } else if (gameId === 'breakout') {
      if (score > pg.highScore) {
        pg.highScore = score;
        isRecord = true;
      }
    }
    
    this.saveToStorage();
  },

  recordBreakoutLevel(level) {
    const pg = this.data.perGame.breakout;
    if (pg && level > pg.highestLevel) {
      pg.highestLevel = level;
      this.saveToStorage();
    }
  },

  recordBreakoutStreak(streak) {
    const pg = this.data.perGame.breakout;
    if (pg && streak > pg.longestStreak) {
      pg.longestStreak = streak;
      this.saveToStorage();
    }
  },

  recordCreativeAction(gameId) {
    const pg = this.data.perGame[gameId];
    if (gameId === 'pixelpad' && pg) {
      pg.artworksSaved = (pg.artworksSaved || 0) + 1;
      this.saveToStorage();
    } else if (gameId === 'palettelab' && pg) {
      pg.palettesExported = (pg.palettesExported || 0) + 1;
      this.saveToStorage();
    }
  },

  recordPaletteGenerated() {
    const pg = this.data.perGame.palettelab;
    if (pg) {
      pg.uniquePalettesGenerated = (pg.uniquePalettesGenerated || 0) + 1;
      this.saveToStorage();
    }
  },

  resetStats() {
    this.data.totalPlaytime = 0.0;
    this.data.totalLaunches = 0;
    this.data.sessionsPlayed = 0;
    this.data.favoriteGameId = "";
    this.data.longestSessionSeconds = 0.0;
    this.data.averageSessionSeconds = 0.0;
    this.data.recentSessions = [];
    
    for (const gid of this.APPROVED_GAME_IDS) {
      const pg = this.data.perGame[gid];
      pg.launches = 0;
      pg.playtimeSeconds = 0.0;
      pg.lastPlayedAt = "";
      if (gid === 'reaction') pg.bestReactionMs = null;
      if (gid === 'snake') {
        pg.highScore = 0;
        pg.longestSurvivalSeconds = 0.0;
      }
      if (gid === 'breakout') {
        pg.highScore = 0;
        pg.highestLevel = 0;
        pg.longestStreak = 0;
      }
      if (gid === 'pixelpad') {
        pg.artworksSaved = 0;
        pg.longestSessionSeconds = 0.0;
      }
      if (gid === 'palettelab') {
        pg.palettesExported = 0;
        pg.uniquePalettesGenerated = 0;
      }
    }
    
    this.saveToStorage();
  },

  // ============================================================================
  // VIEW RENDERING
  // ============================================================================
  renderStats(view) {
    if (!view) return;
    
    const d = this.data;
    const gameTitles = {
      reaction: "Reaction Test",
      snake: "Neon Snake",
      breakout: "Breakout",
      pixelpad: "Pixel Pad",
      palettelab: "Palette Lab"
    };
    
    const favGameName = gameTitles[d.favoriteGameId] || "None Yet";
    const lastPlayedName = gameTitles[d.lastPlayedGameId] || "None Yet";
    
    view.innerHTML = `
      <div class="sys-app stats-app">
        <div class="sys-header">
          <h2>STATS DASHBOARD</h2>
          <button class="sys-back-btn" onclick="window.ArcadeOS.goHome()">BACK (ESC)</button>
        </div>
        
        <div class="stats-grid-container" style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height:165px; overflow-y:auto; padding:5px; font-size:9px;">
          <!-- Left Main Metrics Column -->
          <div class="metrics-block" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">
            <h3 style="margin: 0 0 6px 0; color: var(--machine-accent, #35d0ba); font-size:9px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:3px;">SYSTEM STATS</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="opacity: 0.6;">Total Playtime:</td><td style="text-align: right; font-weight: bold;">${Math.round(d.totalPlaytime)}s</td></tr>
              <tr><td style="opacity: 0.6;">Launches / Sessions:</td><td style="text-align: right; font-weight: bold;">${d.totalLaunches} / ${d.sessionsPlayed}</td></tr>
              <tr><td style="opacity: 0.6;">Average Session:</td><td style="text-align: right; font-weight: bold;">${Math.round(d.averageSessionSeconds)}s</td></tr>
              <tr><td style="opacity: 0.6;">Longest Session:</td><td style="text-align: right; font-weight: bold;">${Math.round(d.longestSessionSeconds)}s</td></tr>
              <tr><td style="opacity: 0.6;">Coin Inserts:</td><td style="text-align: right; font-weight: bold;">${d.lifetimeCoinInserts}</td></tr>
              <tr><td style="opacity: 0.6;">Favorite Game:</td><td style="text-align: right; font-weight: bold; color: var(--machine-secondary, #ff365d);">${favGameName}</td></tr>
            </table>
          </div>
          
          <!-- Right Per-Game Metrics Column -->
          <div class="metrics-block" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 6px; border-radius: 4px;">
            <h3 style="margin: 0 0 6px 0; color: var(--machine-accent, #35d0ba); font-size:9px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:3px;">PER-GAME RUNTIME</h3>
            <div style="display:flex; flex-direction:column; gap:4px;">
              ${this.APPROVED_GAME_IDS.map(gid => {
                const pg = d.perGame[gid];
                const pct = d.totalPlaytime > 0 ? Math.round((pg.playtimeSeconds / d.totalPlaytime) * 100) : 0;
                return `
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:8px;">
                      <span>${gameTitles[gid]}</span>
                      <span>${pg.launches} launches (${pct}%)</span>
                    </div>
                    <!-- CSS Progress Bar -->
                    <div style="background: rgba(255,255,255,0.1); height:4px; border-radius:2px; margin-top:2px;">
                      <div style="background: var(--machine-accent, #35d0ba); height: 100%; width: ${pct}%; border-radius:2px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        
        <!-- Bottom Recent Sessions History Logger -->
        <div style="margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          <h3 style="margin: 0 0 4px 0; font-size:9px; color: var(--machine-accent, #35d0ba);">RECENT GAME LOGS</h3>
          <div style="max-height:60px; overflow-y:auto; display:flex; flex-direction:column; gap:3px;">
            ${d.recentSessions.length === 0 ? '<div style="font-size:8px; opacity:0.5; text-align:center;">No recent game sessions recorded.</div>' : 
              d.recentSessions.slice(0, 15).map(s => {
                const date = new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `
                  <div style="display:flex; justify-content:space-between; font-size:8px; background: rgba(0,0,0,0.15); padding:3px 5px; border-radius:2px;">
                    <span>[${date}] <strong>${gameTitles[s.gameId]}</strong></span>
                    <span>${s.durationSeconds}s (${s.result}) &bull; score: ${s.score}</span>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderLeaderboards(view) {
    if (!view) return;
    
    const d = this.data;
    
    view.innerHTML = `
      <div class="sys-app leaderboards-app">
        <div class="sys-header">
          <h2>LOCAL LEADERBOARDS</h2>
          <button class="sys-back-btn" onclick="window.ArcadeOS.goHome()">BACK (ESC)</button>
        </div>
        
        <div style="max-height:220px; overflow-y:auto; padding:5px; font-size:9px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); color: var(--machine-accent, #35d0ba);">
                <th>GAME / APP</th>
                <th>PRIMARY RECORD</th>
                <th style="text-align: right;">ADDITIONAL METRICS</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); height: 28px;">
                <td><strong>Reaction Test</strong></td>
                <td style="color: #fbbf24;">${d.perGame.reaction.bestReactionMs !== null ? Math.round(d.perGame.reaction.bestReactionMs) + 'ms' : '--'}</td>
                <td style="text-align: right; opacity:0.6;">Lowest ms is best</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); height: 28px;">
                <td><strong>Neon Snake</strong></td>
                <td style="color: #fbbf24;">${d.perGame.snake.highScore} pts</td>
                <td style="text-align: right; opacity:0.6;">Highest score is best</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); height: 28px;">
                <td><strong>Breakout</strong></td>
                <td style="color: #fbbf24;">${d.perGame.breakout.highScore} pts</td>
                <td style="text-align: right; opacity:0.6;">Max Level: ${d.perGame.breakout.highestLevel || 1} &bull; Max Streak: ${d.perGame.breakout.longestStreak || 0}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); height: 28px;">
                <td><strong>Pixel Pad</strong></td>
                <td style="color: #fbbf24;">${d.perGame.pixelpad.artworksSaved || 0} saved</td>
                <td style="text-align: right; opacity:0.6;">Longest session: ${Math.round(d.perGame.pixelpad.longestSessionSeconds || 0)}s</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); height: 28px;">
                <td><strong>Palette Lab</strong></td>
                <td style="color: #fbbf24;">${d.perGame.palettelab.palettesExported || 0} exported</td>
                <td style="text-align: right; opacity:0.6;">Unique generated: ${d.perGame.palettelab.uniquePalettesGenerated || 0}</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 8px; opacity: 0.5; margin-top: 10px; text-align: center;">Note: Leaderboards reflect verified Local Records saved on this cabinet.</p>
        </div>
      </div>
    `;
  }
};

export default ArcadeStats;
