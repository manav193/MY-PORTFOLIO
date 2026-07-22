// Centralized Arcade Achievements & Progress Manager (Phase 4B)
// Handcrafted ES Module managing unlocked achievements, timestamps, and registry info

export function calculateProfileRank({
  sessionsPlayed = 0,
  totalPlaytime = 0,
  achievementsUnlocked = 0,
  uniqueAppsPlayed = 0,
  presetsCreated = 0
}) {
  const sessions = Math.max(0, Number(sessionsPlayed) || 0);
  const playtime = Math.max(0, Number(totalPlaytime) || 0);
  const achievements = Math.max(0, Number(achievementsUnlocked) || 0);
  const apps = Math.max(0, Number(uniqueAppsPlayed) || 0);
  const presets = Math.max(0, Number(presetsCreated) || 0);

  // Pure weighted score points formula
  const points =
    sessions * 10
    + Math.floor(playtime / 300) * 5
    + achievements * 20
    + apps * 30
    + presets * 15;

  let rank = "Visitor";
  let nextRank = "Operator";
  let minScore = 0;
  let maxScore = 100;
  let progressPct = 0;

  if (points >= 2500) {
    rank = "Machine Master";
    nextRank = "Max Rank";
    minScore = 2500;
    maxScore = 2500;
    progressPct = 100;
  } else if (points >= 1000) {
    rank = "Arcade Regular";
    nextRank = "Machine Master";
    minScore = 1000;
    maxScore = 2500;
    progressPct = Math.floor(((points - minScore) / (maxScore - minScore)) * 100);
  } else if (points >= 400) {
    rank = "Technician";
    nextRank = "Arcade Regular";
    minScore = 400;
    maxScore = 1000;
    progressPct = Math.floor(((points - minScore) / (maxScore - minScore)) * 100);
  } else if (points >= 100) {
    rank = "Operator";
    nextRank = "Technician";
    minScore = 100;
    maxScore = 400;
    progressPct = Math.floor(((points - minScore) / (maxScore - minScore)) * 100);
  } else {
    rank = "Visitor";
    nextRank = "Operator";
    minScore = 0;
    maxScore = 100;
    progressPct = Math.floor(((points - minScore) / (maxScore - minScore)) * 100);
  }

  return {
    score: points,
    title: rank,
    nextTitle: nextRank,
    progress: Math.min(100, Math.max(0, progressPct)),
    thresholds: { min: minScore, max: maxScore }
  };
}

export function extractBestTimestamp(entry) {
  if (!entry) return new Date().toISOString();
  if (typeof entry === 'string') {
    const d = new Date(entry);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof entry === 'object') {
    const candidate = entry.unlockedAt || entry.timestamp || entry.date;
    if (candidate) {
      const d = new Date(candidate);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return new Date().toISOString();
}

export const ArcadeAchievements = {
  initialized: false,
  data: {
    schemaVersion: 2,
    unlocked: {},
    counters: {}
  },
  activeFilter: 'ALL',

  REGISTRY: [
    // --- SYSTEM ---
    { id: 'first_boot', title: 'First Boot', desc: 'Welcome to the Grid.', icon: '🖥️', category: 'SYSTEM' },
    { id: 'first_coin', title: 'First Coin', desc: 'Insert your first coin credit.', icon: '🪙', category: 'SYSTEM' },
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
    { id: 'three_fast', title: 'Three Fast Runs', desc: 'Achieve under 250ms three times.', icon: '⚡', category: 'REACTION', target: 3, hidden: true },

    // --- SNAKE ---
    { id: 'snake_10', title: 'Score 10', desc: 'Score 10 points in Neon Snake.', icon: '🐍', category: 'SNAKE' },
    { id: 'snake_25', title: 'Score 25', desc: 'Score 25 points in Neon Snake.', icon: '🐉', category: 'SNAKE' },
    { id: 'snake_50', title: 'Score 50', desc: 'Score 50 points in Neon Snake.', icon: '👑', category: 'SNAKE' },
    { id: 'snake_survivor', title: 'Long Survivor', desc: 'Survive 45s or longer in Neon Snake.', icon: '⏱️', category: 'SNAKE' },

    // --- BREAKOUT ---
    { id: 'breakout_brick', title: 'First Brick', desc: 'Break your first brick.', icon: '🧱', category: 'BREAKOUT' },
    { id: 'breakout_level', title: 'First Level', desc: 'Clear a level in Breakout.', icon: '🏆', category: 'BREAKOUT' },
    { id: 'breakout_1000', title: 'Score 1000', desc: 'Score 1000 points in Breakout.', icon: '💎', category: 'BREAKOUT' },
    { id: 'breakout_streak', title: 'No-Miss Streak', desc: 'Achieve a 15-brick hit streak.', icon: '💫', category: 'BREAKOUT', hidden: true },

    // --- CREATIVE ---
    { id: 'pixel_saved', title: 'Pixel Art Saved', desc: 'Save a canvas sketch in Pixel Pad.', icon: '🎨', category: 'CREATIVE' },
    { id: 'five_arts', title: 'Five Artworks', desc: 'Save 5 artworks in Pixel Pad.', icon: '🖼️', category: 'CREATIVE', target: 5 },
    { id: 'palette_exported', title: 'Palette Exported', desc: 'Export a color scheme in Palette Lab.', icon: '🧪', category: 'CREATIVE' },
    { id: 'ten_palettes', title: 'Ten Palettes', desc: 'Export 10 color schemes.', icon: '🔬', category: 'CREATIVE', target: 10 },

    // --- CUSTOMIZATION ---
    { id: 'theme_switcher', title: 'Theme Switcher', desc: 'Load a built-in chassis theme.', icon: '🎨', category: 'CUSTOMIZATION' },
    { id: 'cabinet_designer', title: 'Cabinet Designer', desc: 'Save custom accent colors.', icon: '⚙️', category: 'CUSTOMIZATION' },
    { id: 'preset_collector', title: 'Preset Collector', desc: 'Save 5 cabinet presets.', icon: '🗃️', category: 'CUSTOMIZATION', target: 5 },
    { id: 'random_variant', title: 'Random Variant', desc: 'Generate a random variant.', icon: '🎲', category: 'CUSTOMIZATION', hidden: true },
    { id: 'custom_marquee', title: 'Custom Marquee', desc: 'Save a custom marquee header text.', icon: '✨', category: 'CUSTOMIZATION' }
  ],

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadAndMigrate();
  },

  loadAndMigrate() {
    const raw = localStorage.getItem('arcade_machine_achievements');
    this.data = {
      schemaVersion: 2,
      unlocked: {},
      counters: {}
    };

    if (!raw) {
      this.saveToStorage();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Legacy array of achievement IDs
        parsed.forEach(id => {
          if (id && typeof id === 'string') {
            this.data.unlocked[id] = { unlockedAt: new Date().toISOString() };
          }
        });
        this.saveToStorage();
      } else if (parsed && typeof parsed === 'object') {
        if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
          // V1 to V2 object migration
          if (Array.isArray(parsed.unlocked)) {
            parsed.unlocked.forEach(id => {
              if (id && typeof id === 'string') {
                this.data.unlocked[id] = { unlockedAt: new Date().toISOString() };
              }
            });
          } else if (parsed.unlocked && typeof parsed.unlocked === 'object') {
            Object.keys(parsed.unlocked).forEach(id => {
              this.data.unlocked[id] = { unlockedAt: extractBestTimestamp(parsed.unlocked[id]) };
            });
          }
          this.data.counters = parsed.counters || {};
          this.saveToStorage();
        } else {
          // Valid V2, copy securely preserving dates
          if (parsed.unlocked && typeof parsed.unlocked === 'object') {
            Object.keys(parsed.unlocked).forEach(id => {
              this.data.unlocked[id] = { unlockedAt: extractBestTimestamp(parsed.unlocked[id]) };
            });
          }
          if (parsed.counters && typeof parsed.counters === 'object') {
            this.data.counters = parsed.counters;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse achievements, using safe recovery", e);
    }
  },

  saveToStorage() {
    this.data.schemaVersion = 2;
    localStorage.setItem('arcade_machine_achievements', JSON.stringify(this.data));
  },

  getStatsData() {
    const raw = localStorage.getItem('arcade_machine_stats');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  },

  getCustomizerData() {
    const raw = localStorage.getItem('arcade_machine_customization');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return { presets: [] };
  },

  getProgress(id) {
    const ach = this.REGISTRY.find(a => a.id === id);
    if (!ach || !ach.target) return null;

    const stats = this.getStatsData();
    const customizer = this.getCustomizerData();
    let current = 0;

    // Explicitly mapped progress sources (Correction 8)
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
          current = Object.keys(stats.perGame).filter(key => stats.perGame[key].launches > 0).length;
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
        current = customizer ? (customizer.presets ? customizer.presets.length : 0) : 0;
        break;
      default:
        current = 0;
    }

    return {
      current: Math.max(0, Math.min(current, ach.target)),
      target: ach.target,
      completed: current >= ach.target
    };
  },

  evaluate(eventName, payload) {
    // Diagnostic events must never unlock achievements or mutate counters.
    if (payload && payload.diagnostic) return;
    if (eventName && String(eventName).startsWith('DIAGNOSTIC_')) return;

    const stats = this.getStatsData();

    // SYSTEM Evaluation
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
    if (eventName === 'THEME_LOADED' || eventName === 'THEME_SWITCHER') {
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

    // PLAY Evaluation
    if (eventName === 'GAME_LAUNCHED' && payload && payload.id !== 'os') {
      this.unlock('first_game');
      if (stats && stats.perGame) {
        const launchedApps = Object.keys(stats.perGame).filter(key => stats.perGame[key].launches > 0 || key === payload.id);
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
    if (stats) {
      if (stats.sessionsPlayed >= 5) this.unlock('five_sessions');
      if (stats.sessionsPlayed >= 10) this.unlock('ten_sessions');
    }

    // REACTION Evaluation
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

    // SNAKE Evaluation
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

    // BREAKOUT Evaluation
    if (eventName === 'BREAKOUT_SCORE' && payload) {
      this.unlock('breakout_brick');
      if (payload.score >= 1000) {
        this.unlock('breakout_1000');
      }
    }
    if (eventName === 'BREAKOUT_LEVEL_CLEARED' || eventName === 'BREAKOUT_LEVEL') {
      this.unlock('breakout_level');
    }
    if (eventName === 'BREAKOUT_LONGEST_STREAK' || eventName === 'BREAKOUT_STREAK') {
      if (payload && payload.streak >= 15) {
        this.unlock('breakout_streak');
      }
    }

    // CREATIVE Evaluation
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
    if (this.data.unlocked[id]) return; // prevent duplicate toast/unlocks

    const ach = this.REGISTRY.find(a => a.id === id);
    if (!ach) return;

    this.data.unlocked[id] = { unlockedAt: new Date().toISOString() };
    this.saveToStorage();

    // Emit event for session-level capture inside Stats (Correction 3 Decoupling)
    if (window.ArcadeEventBus) {
      window.ArcadeEventBus.emit('ACHIEVEMENT_UNLOCKED', { id });
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

  getCompletionSummary() {
    const unlocked = this.getUnlocked().length;
    const total = this.REGISTRY.length;
    return {
      unlockedCount: unlocked,
      totalCount: total,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0
    };
  },

  calculatePlayerRank() {
    const stats = this.getStatsData() || {};
    const customizer = this.getCustomizerData() || { presets: [] };
    const unlockedCount = this.getUnlocked().length;

    const sessionsPlayed = stats.sessionsPlayed || 0;
    const totalPlaytime = stats.totalPlaytime || 0;
    const uniqueAppsPlayed = stats.perGame
      ? Object.keys(stats.perGame).filter(key => stats.perGame[key].launches > 0).length
      : 0;
    const presetsCreated = customizer.presets ? customizer.presets.length : 0;

    return calculateProfileRank({
      sessionsPlayed,
      totalPlaytime,
      achievementsUnlocked: unlockedCount,
      uniqueAppsPlayed,
      presetsCreated
    });
  },

  setFilter(filter, view) {
    this.activeFilter = filter;
    this.renderAchievements(view);
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.refreshFocusableElements();
      const activeBtn = view.querySelector(`[data-filter="${filter}"]`);
      if (activeBtn) {
        window.ArcadeSystemUI.setFocus(activeBtn);
      } else {
        window.ArcadeSystemUI.focusFirst();
      }
    }
  },

  renderAchievements(view) {
    if (!view) return;

    // Stale-data synchronization on route open (Correction 9)
    this.loadAndMigrate();

    const categories = ['ALL', 'SYSTEM', 'PLAY', 'REACTION', 'SNAKE', 'BREAKOUT', 'CREATIVE', 'CUSTOMIZATION'];
    const unlockedList = this.getUnlocked();
    const summary = this.getCompletionSummary();

    const filtered = this.activeFilter === 'ALL'
      ? this.REGISTRY
      : this.REGISTRY.filter(a => a.category === this.activeFilter);

    view.innerHTML = `
      <div class="sys-app achievements-app">
        <div class="sys-header">
          <div>
            <h2 style="margin:0;"><span class="hw-icon">🏆</span> ACHIEVEMENT VAULT // ${summary.unlockedCount}/${summary.totalCount} (${summary.percentage}%)</h2>
            <div style="font-size:7px; color:rgba(255,255,255,0.6); margin-top:3px; letter-spacing:0.08em;">
              UNLOCK TROPHIES THROUGH GAMEPLAY & MACHINE CUSTOMIZATION
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="sys-btn danger-btn" data-arcade-action="reset-achievements" data-arcade-focusable style="margin:0; font-size:7px; padding:3px 6px;">RESET</button>
            <button class="sys-back-btn" onclick="window.ArcadeOS.goHome()" style="margin:0;" data-arcade-focusable data-arcade-action="back">BACK (ESC)</button>
          </div>
        </div>

        <!-- Category Filters Container -->
        <div class="category-filters-container" style="display:flex; gap:4px; margin-bottom:8px; flex-wrap:wrap;">
          ${categories.map(cat => {
            const isSelected = this.activeFilter === cat;
            return `
              <button class="sys-btn filter-btn ${isSelected ? 'active' : ''}"
                      style="font-size:7px; padding:3px 6px; margin:0; border-radius:4px; ${isSelected ? 'background:rgba(56,189,248,0.2); border-color:#38bdf8; color:#fff; box-shadow:0 0 8px rgba(56,189,248,0.4);' : ''}"
                      data-arcade-focusable
                      data-filter="${cat}"
                      aria-selected="${isSelected ? 'true' : 'false'}"
                      onclick="window.ArcadeAchievements.setFilter('${cat}', this.closest('.achievements-app').parentNode)">
                ${cat}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Scrollable cards container -->
        <div class="achievements-scroll-area" style="flex:1; overflow-y:auto; padding:2px; display:grid; grid-template-columns: 1fr; gap:6px; max-height: 175px;">
          ${filtered.length === 0 ? `
            <div style="font-size:8px; opacity:0.6; text-align:center; padding:24px 10px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px dashed rgba(255,255,255,0.1);">No achievements in this category yet. Play a game or customize the cabinet to unlock one.</div>
          ` : filtered.map(ach => {
            const unlocked = !!this.data.unlocked[ach.id];
            const isHidden = ach.hidden && !unlocked;

            const cardIcon = isHidden ? "🔒" : ach.icon;
            const cardTitle = isHidden ? "Hidden Achievement" : ach.title.toUpperCase();
            const cardDesc = isHidden ? "Keep playing to discover this trophy." : ach.desc;

            const prog = isHidden ? null : this.getProgress(ach.id);
            const dateStr = unlocked
              ? new Date(this.data.unlocked[ach.id].unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : '';

            return `
              <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" style="background:${unlocked ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${unlocked ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.08)'}; border-radius:6px; padding:8px 10px; display:flex; align-items:center; gap:10px; box-shadow:${unlocked ? '0 0 10px rgba(56,189,248,0.15)' : 'none'};">
                <div class="ach-icon" style="font-size:18px; filter:${unlocked ? 'drop-shadow(0 0 6px rgba(56,189,248,0.6))' : 'grayscale(100%) opacity(0.3)'};">${cardIcon}</div>
                <div style="flex:1; font-size:8px; text-align:left;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:9px; color:${unlocked ? '#38bdf8' : '#cbd5e1'}; font-weight:800; letter-spacing:0.06em;">${cardTitle}</strong>
                    ${unlocked ? `<span style="font-size:7px; color:#10b981; font-weight:bold;">UNLOCKED ${dateStr}</span>` : ''}
                  </div>
                  <div style="opacity:0.75; margin-top:2px; line-height:1.3;">${cardDesc}</div>
                  ${(!unlocked && prog) ? `
                    <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                      <div style="flex:1; background:rgba(255,255,255,0.1); height:3px; border-radius:2px;">
                        <div style="background:#38bdf8; height:100%; width:${prog.percentage}%; border-radius:2px;"></div>
                      </div>
                      <span style="font-size:7px; opacity:0.6;">${prog.current}/${prog.target}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};

export default ArcadeAchievements;
