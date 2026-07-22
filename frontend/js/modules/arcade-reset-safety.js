const DOMAIN_KEYS = {
  settings: 'arcade_machine_settings',
  stats: 'arcade_machine_stats',
  achievements: 'arcade_machine_achievements',
  profile: 'arcade_machine_profile',
  customization: 'arcade_machine_customization',
  saves: 'arcade_game_saves'
};

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const ArcadeResetSafety = {
  schemaVersion: 1,

  createBackupPayload() {
    return {
      schemaVersion: this.schemaVersion,
      exportedAt: new Date().toISOString(),
      domains: {
        settings: readJson(DOMAIN_KEYS.settings),
        stats: readJson(DOMAIN_KEYS.stats),
        achievements: readJson(DOMAIN_KEYS.achievements),
        profile: readJson(DOMAIN_KEYS.profile),
        customization: readJson(DOMAIN_KEYS.customization),
        saves: readJson(DOMAIN_KEYS.saves)
      }
    };
  },

  getBackupSummary(payload = this.createBackupPayload()) {
    const domains = Object.entries(payload.domains)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => `${key}:${JSON.stringify(value).length}b`);
    return `Backup includes ${domains.length} domains (${domains.join(', ')}).`;
  },

  exportBackup() {
    const payload = this.createBackupPayload();
    const text = JSON.stringify(payload, null, 2);
    if (text.length > 256 * 1024) {
      throw new Error('Backup payload exceeds 256 KB safety limit.');
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `arcade-machine-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return { bytes: text.length, summary: this.getBackupSummary(payload) };
  },

  resetSoundProfile() {
    const settings = readJson(DOMAIN_KEYS.settings) || {};
    settings.soundProfile = 'industrial';
    settings.reducedAudio = false;
    writeJson(DOMAIN_KEYS.settings, settings);
    if (window.ArcadeAudio) {
      window.ArcadeAudio.setProfile('industrial');
      window.ArcadeAudio.reducedAudio = false;
    }
  },

  clearSessionHistory() {
    const stats = readJson(DOMAIN_KEYS.stats);
    if (!stats) return;
    stats.recentSessions = [];
    writeJson(DOMAIN_KEYS.stats, stats);
    if (window.ArcadeStats) {
      window.ArcadeStats.data = stats;
    }
  },

  resetAchievements() {
    const data = { schemaVersion: 2, unlocked: {}, counters: {} };
    writeJson(DOMAIN_KEYS.achievements, data);
    if (window.ArcadeAchievements) {
      window.ArcadeAchievements.data = clone(data);
    }
  },

  resetAggregateStats() {
    if (window.ArcadeStats) {
      window.ArcadeStats.loadAndMigrate();
      const credits = window.ArcadeStats.data.currentCredits || 0;
      const lifetimeCoinInserts = window.ArcadeStats.data.lifetimeCoinInserts || 0;
      window.ArcadeStats.resetStats();
      window.ArcadeStats.data.currentCredits = credits;
      window.ArcadeStats.data.lifetimeCoinInserts = lifetimeCoinInserts;
      window.ArcadeStats.saveToStorage();
      return;
    }
    const stats = readJson(DOMAIN_KEYS.stats);
    if (stats) {
      const credits = stats.currentCredits || 0;
      const lifetimeCoinInserts = stats.lifetimeCoinInserts || 0;
      localStorage.removeItem(DOMAIN_KEYS.stats);
      window.ArcadeStorage?.init();
      const next = readJson(DOMAIN_KEYS.stats) || {};
      next.currentCredits = credits;
      next.lifetimeCoinInserts = lifetimeCoinInserts;
      writeJson(DOMAIN_KEYS.stats, next);
    }
  },

  resetPerGameRecords() {
    this.resetAggregateStats();
    ['arcade_reaction_best', 'arcade_reaction_latest', 'arcade_reaction_attempts', 'arcade_snake_best', 'arcade_breakout_best', 'reaction_best'].forEach(key => {
      localStorage.removeItem(key);
    });
  },

  fullMachineResetSelectedDomains() {
    this.resetAggregateStats();
    this.resetAchievements();
    this.clearSessionHistory();
    localStorage.removeItem('arcade_diag_storage_test');
    window.ArcadeStorage?.init();
    window.ArcadeOS?.applyHardwareEffects();
    if (window.ArcadeOS) {
      window.ArcadeOS.forceGoHome(true);
      window.ArcadeOS.showConfirmModal('Safe machine reset complete. Preserved settings, credits, profile, saves, customization presets, and browser caches.', () => {}, null);
    }
  },

  fullMachineResetFlow() {
    const affected = 'Affected domains: aggregate stats, per-game records, recent session history, achievements. Preserved: settings, sound profile, credits, profile, saves, customization presets, service worker cache.';
    window.ArcadeOS.showConfirmModal(`${affected} Download a backup before continuing?`, () => {
      try {
        this.exportBackup();
      } catch (err) {
        console.warn('Backup export failed', err);
      }
      window.ArcadeOS.showConfirmModal(`Final destructive confirmation. ${affected}`, () => {
        this.fullMachineResetSelectedDomains();
      }, () => {});
    }, () => {});
  }
};

if (typeof window !== 'undefined') {
  window.ArcadeResetSafety = ArcadeResetSafety;
}

export default ArcadeResetSafety;
