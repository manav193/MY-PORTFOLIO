// Centralized Arcade Achievements & Progress Manager (Phase 4B)
// Handcrafted ES Module managing unlocked achievements, timestamps, and registry info

export const ArcadeAchievements = {
  initialized: false,
  data: {
    schemaVersion: 2,
    unlocked: {},
    counters: {}
  },
  
  // Track achievements unlocked during the current active session
  sessionUnlocked: [],

  REGISTRY: [
    // --- SYSTEM ---
    { id: 'first_boot', title: 'First Boot', desc: 'Welcome to the Grid.', icon: '🖥️', category: 'SYSTEM' },
    { id: 'first_coin', title: 'Insert Coin', desc: 'Insert your first coin credit.', icon: '🪙', category: 'SYSTEM' },
    { id: 'first_cabinet', title: 'First Custom Cabinet', desc: 'Apply your first cabinet customization.', icon: '🎨', category: 'SYSTEM' },
    { id: 'preset_saved', title: 'First Preset Saved', desc: 'Save a customized cabinet preset.', icon: '💾', category: 'SYSTEM' },
    { id: 'config_exported', title: 'Config Exported', desc: 'Export a custom cabinet profile.', icon: '📤', category: 'SYSTEM' },
    { id: 'config_imported', title: 'Config Imported', desc: 'Import a custom cabinet profile.', icon: '📥', category: 'SYSTEM' },

    // --- PLAY ---
    { id: 'first_game', title: 'First Game', desc: 'Launch any game or creative tool.', icon: '🎮', category: 'PLAY' },
    { id: 'five_sessions', title: 'Five Sessions', desc: 'Play 5 game sessions.', icon: '👾', category: 'PLAY', target: 5 },
    { id: 'ten_sessions', title: 'Ten Sessions', desc: 'Play 10 game sessions.', icon: '🕹️', category: 'PLAY', target: 10 },
    { id: 'one_hour', title: 'One Hour Played', desc: 'Play for 1 hour in total.', icon: '⏱️', category: 'PLAY', target: 3600 },
    { id: 'five_hours', title: 'Five Hours Played', desc: 'Play for 5 hours in total.', icon: '⏳', category: 'PLAY', target: 18000 },
    { id: 'every_app', title: 'Played Every App', desc: 'Launch every game and creative tool once.', icon: '💫', category: 'PLAY', target: 5 },

    // --- REACTION ---
    { id: 'reaction_rookie', title: 'Reaction Rookie', desc: 'Complete a reaction test.', icon: '⚡', category: 'REACTION' },
    { id: 'under_300', title: 'Under 300ms', desc: 'Achieve a score under 300ms.', icon: '🏹', category: 'REACTION' },
    { id: 'under_200', title: 'Under 200ms', desc: 'Achieve a score under 200ms.', icon: '🎯', category: 'REACTION' },
    { id: 'under_150', title: 'Under 150ms', desc: 'Achieve a score under 150ms.', icon: '🔥', category: 'REACTION' },
    { id: 'three_fast', title: 'Three Fast Runs', desc: 'Achieve under 250ms three times.', icon: '⚡', category: 'REACTION', target: 3 },

    // --- SNAKE ---
    { id: 'snake_10', title: 'Score 10', desc: 'Score 10 points in Neon Snake.', icon: '🐍', category: 'SNAKE' },
    { id: 'snake_25', title: 'Score 25', desc: 'Score 25 points in Neon Snake.', icon: '🐉', category: 'SNAKE' },
    { id: 'snake_50', title: 'Score 50', desc: 'Score 50 points in Neon Snake.', icon: '👑', category: 'SNAKE' },
    { id: 'snake_survivor', title: 'Long Survivor', desc: 'Survive 45s or longer in Neon Snake.', icon: '⏱️', category: 'SNAKE' },

    // --- BREAKOUT ---
    { id: 'breakout_brick', title: 'First Brick', desc: 'Break your first brick.', icon: '🧱', category: 'BREAKOUT' },
    { id: 'breakout_level', title: 'First Level', desc: 'Clear a level in Breakout.', icon: '🏆', category: 'BREAKOUT' },
    { id: 'breakout_1000', title: 'Score 1000', desc: 'Score 1000 points in Breakout.', icon: '💎', category: 'BREAKOUT' },
    { id: 'breakout_streak', title: 'No-Miss Streak', desc: 'Achieve a 15-brick hit streak.', icon: '💫', category: 'BREAKOUT' },

    // --- CREATIVE ---
    { id: 'pixel_saved', title: 'Pixel Art Saved', desc: 'Save a canvas sketch in Pixel Pad.', icon: '🎨', category: 'CREATIVE' },
    { id: 'five_arts', title: 'Five Artworks', desc: 'Save 5 artworks in Pixel Pad.', icon: '🖼️', category: 'CREATIVE', target: 5 },
    { id: 'palette_exported', title: 'Palette Exported', desc: 'Export a color scheme in Palette Lab.', icon: '🧪', category: 'CREATIVE' },
    { id: 'ten_palettes', title: 'Ten Palettes', desc: 'Export 10 color schemes.', icon: '🔬', category: 'CREATIVE', target: 10 },

    // --- CUSTOMIZATION ---
    { id: 'theme_switcher', title: 'Theme Switcher', desc: 'Load a built-in chassis theme.', icon: '🎨', category: 'CUSTOMIZATION' },
    { id: 'cabinet_designer', title: 'Cabinet Designer', desc: 'Save custom accent colors.', icon: '⚙️', category: 'CUSTOMIZATION' },
    { id: 'preset_collector', title: 'Preset Collector', desc: 'Save 5 cabinet presets.', icon: '🗃️', category: 'CUSTOMIZATION', target: 5 },
    { id: 'random_variant', title: 'Random Variant', desc: 'Generate a random variant.', icon: '🎲', category: 'CUSTOMIZATION' },
    { id: 'custom_marquee', title: 'Custom Marquee', desc: 'Save a custom marquee header text.', icon: '✨', category: 'CUSTOMIZATION' }
  ],

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.loadAndMigrate();
  },

  loadAndMigrate() {
    const raw = localStorage.getItem('arcade_machine_achievements');
    if (!raw) {
      this.data = { schemaVersion: 2, unlocked: {}, counters: {} };
      this.saveToStorage();
      return;
    }
    
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Migrate legacy array structure
        this.data = { schemaVersion: 2, unlocked: {}, counters: {} };
        parsed.forEach(id => {
          this.data.unlocked[id] = { unlockedAt: new Date().toISOString() };
        });
        this.saveToStorage();
      } else if (parsed && typeof parsed === 'object') {
        if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
          // Schema structure V1 -> V2
          this.data = {
            schemaVersion: 2,
            unlocked: parsed.unlocked || {},
            counters: parsed.counters || {}
          };
          this.saveToStorage();
        } else {
          this.data = parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse achievements data, resetting", e);
      this.data = { schemaVersion: 2, unlocked: {}, counters: {} };
    }
  },

  saveToStorage() {
    localStorage.setItem('arcade_machine_achievements', JSON.stringify(this.data));
  },

  getStatsData() {
    if (window.ArcadeStats && window.ArcadeStats.data) {
      return window.ArcadeStats.data;
    }
    const raw = localStorage.getItem('arcade_machine_stats');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  },

  getCustomizerData() {
    if (window.ArcadeCustomizer && window.ArcadeCustomizer.presets) {
      return window.ArcadeCustomizer;
    }
    const raw = localStorage.getItem('arcade_machine_customization');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return { presets: parsed.presets || [] };
      } catch (e) {}
    }
    return { presets: [] };
  },

  // ============================================================================
  // PROGRESS COMPUTATION
  // ============================================================================
  getProgress(id) {
    const ach = this.REGISTRY.find(a => a.id === id);
    if (!ach || !ach.target) return null;
    
    const stats = this.getStatsData();
    const customizer = this.getCustomizerData();
    
    let current = 0;
    
    switch (id) {
      case 'five_sessions':
      case 'ten_sessions':
        current = stats ? stats.sessionsPlayed : 0;
        break;
      case 'one_hour':
      case 'five_hours':
        current = stats ? Math.floor(stats.totalPlaytime) : 0;
        break;
      case 'every_app':
        if (stats && stats.perGame) {
          const launchedApps = Object.keys(stats.perGame).filter(key => stats.perGame[key].launches > 0);
          current = launchedApps.length;
        }
        break;
      case 'three_fast':
        current = this.data.counters['fast_reaction_runs'] || 0;
        break;
      case 'five_arts':
        current = (stats && stats.perGame && stats.perGame.pixelpad) ? stats.perGame.pixelpad.artworksSaved : 0;
        break;
      case 'ten_palettes':
        current = (stats && stats.perGame && stats.perGame.palettelab) ? stats.perGame.palettelab.palettesExported : 0;
        break;
      case 'preset_collector':
        current = customizer ? customizer.presets.length : 0;
        break;
      default:
        current = 0;
    }
    
    const completed = current >= ach.target;
    return {
      current: Math.min(current, ach.target),
      target: ach.target,
      completed: completed
    };
  },

  // ============================================================================
  // EVALUATION & UNLOCKS
  // ============================================================================
  evaluate(eventName, payload) {
    const stats = this.getStatsData();
    
    // Evaluate SYSTEM checks
    if (eventName === 'GAME_LAUNCHED' && payload && payload.id === 'os') {
      this.unlock('first_boot');
    }
    if (eventName === 'COIN_INSERTED') {
      this.unlock('first_coin');
    }
    if (eventName === 'CUSTOMIZER_APPLIED') {
      this.unlock('first_cabinet');
      this.unlock('cabinet_designer');
      
      const customizer = this.getCustomizerData();
      if (customizer && customizer.presets && customizer.presets.length >= 5) {
        this.unlock('preset_collector');
      }
    }
    if (eventName === 'PRESET_SAVED') {
      this.unlock('preset_saved');
      const customizer = this.getCustomizerData();
      if (customizer && customizer.presets && customizer.presets.length >= 5) {
        this.unlock('preset_collector');
      }
    }
    if (eventName === 'THEME_LOADED') {
      this.unlock('theme_switcher');
    }
    if (eventName === 'CONFIG_EXPORTED') {
      this.unlock('config_exported');
    }
    if (eventName === 'CONFIG_IMPORTED') {
      this.unlock('config_imported');
    }
    if (eventName === 'RANDOM_VARIANT') {
      this.unlock('random_variant');
    }
    if (eventName === 'CUSTOM_MARQUEE') {
      this.unlock('custom_marquee');
    }

    // Evaluate PLAY checks
    if (eventName === 'GAME_LAUNCHED' && payload && payload.id !== 'os') {
      this.unlock('first_game');
      
      if (stats && stats.perGame) {
        // check played every app progress
        const launchedApps = Object.keys(stats.perGame).filter(key => {
          return stats.perGame[key].launches > 0 || key === payload.id;
        });
        if (launchedApps.length >= 5) {
          this.unlock('every_app');
        }
      }
    }
    
    if (eventName === 'PLAYTIME_UPDATED' && payload) {
      const play = payload.totalPlaytime || 0;
      if (play >= 3600) this.unlock('one_hour');
      if (play >= 18000) this.unlock('five_hours');
    }
    
    // Evaluate count based session counters
    if (stats) {
      if (stats.sessionsPlayed >= 5) this.unlock('five_sessions');
      if (stats.sessionsPlayed >= 10) this.unlock('ten_sessions');
    }

    // Evaluate REACTION checks
    if (eventName === 'REACTION_SCORE' && payload) {
      const score = payload.score;
      this.unlock('reaction_rookie');
      if (score < 300) this.unlock('under_300');
      if (score < 200) this.unlock('under_200');
      if (score < 150) this.unlock('under_150');
      
      if (score < 250) {
        this.data.counters['fast_reaction_runs'] = (this.data.counters['fast_reaction_runs'] || 0) + 1;
        this.saveToStorage();
        if (this.data.counters['fast_reaction_runs'] >= 3) {
          this.unlock('three_fast');
        }
      }
    }

    // Evaluate SNAKE checks
    if (eventName === 'SNAKE_SCORE' && payload) {
      const score = payload.score;
      if (score >= 10) this.unlock('snake_10');
      if (score >= 25) this.unlock('snake_25');
      if (score >= 50) this.unlock('snake_50');
    }
    if (eventName === 'SNAKE_SURVIVAL' && payload) {
      if (payload.duration >= 45) {
        this.unlock('snake_survivor');
      }
    }

    // Evaluate BREAKOUT checks
    if (eventName === 'BREAKOUT_SCORE' && payload) {
      this.unlock('breakout_brick');
      if (payload.score >= 1000) {
        this.unlock('breakout_1000');
      }
    }
    if (eventName === 'BREAKOUT_LEVEL_CLEARED') {
      this.unlock('breakout_level');
    }
    if (eventName === 'BREAKOUT_LONGEST_STREAK' && payload) {
      if (payload.streak >= 15) {
        this.unlock('breakout_streak');
      }
    }

    // Evaluate CREATIVE checks
    if (eventName === 'PIXELPAD_SAVED') {
      this.unlock('pixel_saved');
      if (stats && stats.perGame && stats.perGame.pixelpad) {
        const saved = (stats.perGame.pixelpad.artworksSaved || 0) + 1;
        if (saved >= 5) this.unlock('five_arts');
      }
    }
    if (eventName === 'PALETTE_EXPORTED') {
      this.unlock('palette_exported');
      if (stats && stats.perGame && stats.perGame.palettelab) {
        const exported = (stats.perGame.palettelab.palettesExported || 0) + 1;
        if (exported >= 10) this.unlock('ten_palettes');
      }
    }
  },

  unlock(id) {
    if (this.data.unlocked[id]) return; // duplicate unlock blocker
    
    const ach = this.REGISTRY.find(a => a.id === id);
    if (!ach) return;
    
    this.data.unlocked[id] = { unlockedAt: new Date().toISOString() };
    this.saveToStorage();
    
    // Add to active session achievements list
    if (!this.sessionUnlocked.includes(id)) {
      this.sessionUnlocked.push(id);
    }
    
    // Notify stats dashboard or recent session calculations
    if (window.ArcadeStats && window.ArcadeStats.activeSession) {
      if (!window.ArcadeStats.activeSession.unlockedThisSession) {
        window.ArcadeStats.activeSession.unlockedThisSession = [];
      }
      if (!window.ArcadeStats.activeSession.unlockedThisSession.includes(id)) {
        window.ArcadeStats.activeSession.unlockedThisSession.push(id);
      }
    }
    
    // Trigger OS toast alerts dynamically
    if (window.ArcadeOS) {
      window.ArcadeOS.showToast(ach);
      if (window.ArcadeAudio) {
        window.ArcadeAudio.playAchievementUnlock();
      }
    }
  },

  getUnlocked() {
    return Object.keys(this.data.unlocked);
  },

  getByCategory(category) {
    return this.REGISTRY.filter(a => a.category === category);
  },

  // ============================================================================
  // PROFILE LOCAL RANK CALCULATION
  // ============================================================================
  calculatePlayerRank() {
    const unlockedCount = this.getUnlocked().length;
    const stats = this.getStatsData();
    const customizer = this.getCustomizerData();
    
    const launches = stats ? stats.totalLaunches : 0;
    const presetsCount = customizer ? customizer.presets.length : 0;
    
    // Ranks threshold checklist:
    // Machine Master: >= 20 achievements, >= 50 launches, >= 3 custom presets saved
    // Arcade Regular: >= 12 achievements, >= 30 launches
    // Technician: >= 6 achievements, >= 15 launches, >= 1 customization preset
    // Operator: >= 2 achievements, >= 5 launches
    // Visitor: default baseline
    
    let rank = "Visitor";
    let nextRank = "Operator";
    let progressPct = 0;
    
    if (unlockedCount >= 20 && launches >= 50 && presetsCount >= 3) {
      rank = "Machine Master";
      nextRank = "Max Rank Unlocked";
      progressPct = 100;
    } else if (unlockedCount >= 12 && launches >= 30) {
      rank = "Arcade Regular";
      nextRank = "Machine Master";
      // Calc progress to next rank
      const p1 = (unlockedCount - 12) / 8;
      const p2 = (launches - 30) / 20;
      const p3 = Math.min(1, presetsCount / 3);
      progressPct = Math.round(((p1 + p2 + p3) / 3) * 100);
    } else if (unlockedCount >= 6 && launches >= 15) {
      rank = "Technician";
      nextRank = "Arcade Regular";
      const p1 = (unlockedCount - 6) / 6;
      const p2 = (launches - 15) / 15;
      progressPct = Math.round(((p1 + p2) / 2) * 100);
    } else if (unlockedCount >= 2 && launches >= 5) {
      rank = "Operator";
      nextRank = "Technician";
      const p1 = (unlockedCount - 2) / 4;
      const p2 = (launches - 5) / 10;
      progressPct = Math.round(((p1 + p2) / 2) * 100);
    } else {
      rank = "Visitor";
      nextRank = "Operator";
      const p1 = unlockedCount / 2;
      const p2 = launches / 5;
      progressPct = Math.round(((p1 + p2) / 2) * 100);
    }
    
    return {
      title: rank,
      nextTitle: nextRank,
      progress: Math.min(100, Math.max(0, progressPct))
    };
  },

  // ============================================================================
  // VIEW RENDERING
  // ============================================================================
  renderAchievements(view) {
    if (!view) return;
    
    const categories = ['SYSTEM', 'PLAY', 'REACTION', 'SNAKE', 'BREAKOUT', 'CREATIVE', 'CUSTOMIZATION'];
    const unlockedList = this.getUnlocked();
    const pct = Math.round((unlockedList.length / this.REGISTRY.length) * 100);
    
    view.innerHTML = `
      <div class="sys-app achievements-app" style="display:flex; flex-direction:column; height: 100%;">
        <div class="sys-header" style="flex-shrink:0;">
          <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
            <div>
              <h2 style="margin:0;">ACHIEVEMENTS</h2>
              <div style="font-size:8px; opacity:0.6; margin-top:2px;">
                🏆 ${unlockedList.length}/${this.REGISTRY.length} Unlocked (${pct}%)
              </div>
            </div>
            <button class="sys-back-btn" onclick="window.ArcadeOS.goHome()" style="margin:0;">BACK (ESC)</button>
          </div>
        </div>

        <!-- Scrollable cards container -->
        <div class="achievements-scroll-area" style="flex:1; overflow-y:auto; padding:6px; display:grid; grid-template-columns: 1fr; gap:5px; max-height: 200px;">
          ${this.REGISTRY.map(ach => {
            const unlocked = !!this.data.unlocked[ach.id];
            const prog = this.getProgress(ach.id);
            const dateStr = unlocked 
              ? new Date(this.data.unlocked[ach.id].unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : '';
              
            return `
              <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" tabindex="0" style="background:${unlocked ? 'rgba(53, 208, 186, 0.04)' : 'rgba(255,255,255,0.01)'}; border: 1px solid ${unlocked ? 'rgba(53, 208, 186, 0.2)' : 'rgba(255,255,255,0.05)'}; border-radius:4px; padding:6px; display:flex; align-items:center; gap:8px;">
                <div class="ach-icon" style="font-size:16px; opacity:${unlocked ? '1' : '0.2'}">${ach.icon}</div>
                <div style="flex:1; font-size:8px; text-align:left;">
                  <div style="font-weight:bold; color:${unlocked ? 'var(--machine-accent, #35d0ba)' : '#888'};">${ach.title.toUpperCase()}</div>
                  <div style="opacity:0.6; margin-top:2px;">${ach.desc}</div>
                  
                  <!-- Progress Bar for count based targets -->
                  ${prog && !unlocked ? `
                    <div style="display:flex; align-items:center; gap:5px; margin-top:4px;">
                      <div style="flex:1; background:rgba(255,255,255,0.1); height:3px; border-radius:1.5px;">
                        <div style="background:var(--machine-accent, #35d0ba); height:100%; width:${(prog.current/prog.target)*100}%; border-radius:1.5px;"></div>
                      </div>
                      <span style="font-size:7px; opacity:0.6;">${prog.current}/${prog.target}</span>
                    </div>
                  ` : ''}
                </div>
                ${unlocked ? `<div style="font-size:7px; opacity:0.5; align-self:flex-start;">Unlocked<br>${dateStr}</div>` : `<div style="font-size:8px; opacity:0.2;">🔒</div>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};

export default ArcadeAchievements;
