/**
 * ARCADE OS PLATFORM
 * Core Architecture: Storage, EventBus, Registry, InputManager, Router
 */

// ============================================================================
// 1. STORAGE SYSTEM
// ============================================================================
const ArcadeStorage = {
  KEYS: {
    SETTINGS: 'arcade_machine_settings',
    STATS: 'arcade_machine_stats',
    ACHIEVEMENTS: 'arcade_machine_achievements',
    PROFILE: 'arcade_machine_profile',
    SAVES: 'arcade_game_saves',
    LAST_SELECTED: 'arcade_last_selected',
    BOOT_COMPLETE: 'arcade_boot_complete',
    ONBOARDING_COMPLETE: 'arcade_onboarding_complete'
  },

  get(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.warn('ArcadeStorage: Read failed', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('ArcadeStorage: Write failed', e);
    }
  },

  init() {
    // 1. Settings Domain Migration
    let settings = this.get(this.KEYS.SETTINGS);
    if (!settings) {
      const legacySound = localStorage.getItem('arcade_sound_enabled');
      const soundEnabled = legacySound !== null ? JSON.parse(legacySound) : false;
      settings = {
        schemaVersion: 1,
        volume: soundEnabled ? 0.5 : 0.0,
        brightness: 1.0,
        glow: 0.8,
        theme: localStorage.getItem('premium-theme') || 'dark-graphite',
        scanlines: true,
        soundEnabled: soundEnabled
      };
      this.set(this.KEYS.SETTINGS, settings);
    }

    // 2. Stats Domain Migration
    let stats = this.get(this.KEYS.STATS);
    if (!stats) {
      stats = {
        schemaVersion: 1,
        totalPlaytime: 0,
        lastSession: Date.now(),
        launches: {},
        playtimes: {}
      };
      this.set(this.KEYS.STATS, stats);
    }

    // 3. Achievements Domain Migration
    let achievements = this.get(this.KEYS.ACHIEVEMENTS);
    if (!achievements) {
      achievements = {
        schemaVersion: 1,
        unlocked: []
      };
      this.set(this.KEYS.ACHIEVEMENTS, achievements);
    }

    // 4. Profile Domain Migration
    let profile = this.get(this.KEYS.PROFILE);
    if (!profile) {
      profile = {
        schemaVersion: 1,
        name: 'Player 1',
        avatar: '🕹️'
      };
      this.set(this.KEYS.PROFILE, profile);
    }

    // 5. Game Saves Domain Migration
    let saves = this.get(this.KEYS.SAVES);
    if (!saves) {
      const getLegacyScore = (key) => {
        const stored = localStorage.getItem(key);
        return stored !== null ? Number(stored) : 0;
      };
      saves = {
        schemaVersion: 1,
        reaction_best: getLegacyScore('reaction_best'),
        snake_best: getLegacyScore('arcade_snake_best'),
        breakout_best: getLegacyScore('arcade_breakout_best')
      };
      this.set(this.KEYS.SAVES, saves);
    }
  }
};

// Run storage migration on script load
ArcadeStorage.init();

// ============================================================================
// 2. AUDIO ENGINE
// ============================================================================
const ArcadeAudio = {
  ctx: null,
  masterGain: null,
  activeNodes: new Set(),
  previewNodes: new Set(),
  maxOscillators: 16,
  profileId: (ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {}).soundProfile || 'industrial',
  reducedAudio: !!(ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {}).reducedAudio,
  soundEnabled: (ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {}).soundEnabled || false,
  masterVolume: typeof (ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {}).volume === 'number'
    ? (ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {}).volume
    : 0.5,

  profiles: {
    industrial: {
      label: 'Industrial',
      boot: [196, 'sawtooth', 0.12, 0.07],
      navigation: [420, 'square', 0.035, 0.035],
      confirm: [740, 'triangle', 0.09, 0.07],
      back: [260, 'triangle', 0.08, 0.06],
      coin: [[988, 'sine', 0.06, 0.08], [1319, 'sine', 0.16, 0.08, 60]],
      achievement: [[523, 'triangle', 0.08, 0.07], [659, 'triangle', 0.08, 0.07, 60], [784, 'triangle', 0.12, 0.07, 120]],
      warning: [220, 'sawtooth', 0.18, 0.09],
      error: [120, 'sawtooth', 0.25, 0.1]
    },
    retroSoft: {
      label: 'Retro Soft',
      boot: [220, 'triangle', 0.14, 0.06],
      navigation: [520, 'triangle', 0.04, 0.035],
      confirm: [660, 'sine', 0.1, 0.065],
      back: [330, 'sine', 0.09, 0.055],
      coin: [[660, 'triangle', 0.08, 0.07], [880, 'triangle', 0.12, 0.075, 80]],
      achievement: [[440, 'sine', 0.08, 0.065], [554, 'sine', 0.08, 0.065, 70], [659, 'sine', 0.16, 0.07, 140]],
      warning: [196, 'triangle', 0.2, 0.08],
      error: [146, 'triangle', 0.24, 0.08]
    },
    digitalClean: {
      label: 'Digital Clean',
      boot: [330, 'square', 0.08, 0.05],
      navigation: [880, 'sine', 0.025, 0.028],
      confirm: [1047, 'sine', 0.06, 0.05],
      back: [523, 'sine', 0.06, 0.045],
      coin: [[784, 'square', 0.04, 0.045], [1175, 'square', 0.06, 0.05, 50]],
      achievement: [[784, 'sine', 0.05, 0.05], [988, 'sine', 0.05, 0.05, 50], [1319, 'sine', 0.1, 0.055, 100]],
      warning: [392, 'square', 0.12, 0.055],
      error: [180, 'square', 0.18, 0.065]
    },
    minimal: {
      label: 'Minimal',
      boot: [300, 'sine', 0.06, 0.035],
      navigation: [500, 'sine', 0.02, 0.02],
      confirm: [640, 'sine', 0.04, 0.03],
      back: [360, 'sine', 0.04, 0.025],
      coin: [700, 'sine', 0.05, 0.03],
      achievement: [760, 'sine', 0.08, 0.035],
      warning: [240, 'sine', 0.08, 0.035],
      error: [160, 'sine', 0.12, 0.04]
    },
    muted: {
      label: 'Muted',
      boot: null,
      navigation: null,
      confirm: null,
      back: null,
      coin: null,
      achievement: null,
      warning: null,
      error: null
    }
  },

  initFromGesture() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.updateMasterGain();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  },

  init() {
    return this.initFromGesture();
  },

  updateMasterGain() {
    if (!this.masterGain || !this.ctx) return;
    const gainValue = this.soundEnabled && !this.isMasterMuted() ? this.masterVolume : 0;
    this.masterGain.gain.setTargetAtTime(gainValue, this.ctx.currentTime, 0.012);
  },

  saveAudioSettings() {
    const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {};
    settings.soundEnabled = this.soundEnabled;
    settings.volume = this.masterVolume;
    settings.soundProfile = this.profileId;
    settings.reducedAudio = !!this.reducedAudio;
    ArcadeStorage.set(ArcadeStorage.KEYS.SETTINGS, settings);
  },

  isMasterMuted() {
    return !this.soundEnabled || this.masterVolume <= 0;
  },

  toggleSound() {
    this.setMuted(this.soundEnabled);
    return this.soundEnabled;
  },

  setProfile(profileId) {
    if (!this.profiles[profileId]) return;
    this.profileId = profileId;
    this.saveAudioSettings();
  },

  getProfile() {
    return this.profileId;
  },

  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.masterVolume > 0 && !this.soundEnabled) {
      this.soundEnabled = true;
    }
    this.saveAudioSettings();
    this.updateMasterGain();
  },

  setMuted(value) {
    this.soundEnabled = !value;
    if (this.soundEnabled && this.masterVolume === 0) {
      this.masterVolume = 0.5;
    }
    this.saveAudioSettings();
    this.updateMasterGain();
    if (!this.soundEnabled) {
      this.suspend();
    } else {
      this.resume();
    }
  },

  playTone(freq, type = 'sine', duration = 0.1, vol = 0.1, options = {}) {
    if (!this.soundEnabled || this.profileId === 'muted') return;
    if (this.activeNodes.size >= this.maxOscillators) return;
    try {
      if (!this.initFromGesture()) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const durationValue = this.reducedAudio ? Math.min(duration, 0.08) : duration;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(Math.max(0.0001, vol), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durationValue);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + durationValue);
      const record = { osc, gain };
      this.activeNodes.add(record);
      if (options.preview) this.previewNodes.add(record);
      osc.onended = () => {
        this.activeNodes.delete(record);
        this.previewNodes.delete(record);
        try { osc.disconnect(); gain.disconnect(); } catch (_) {}
      };
    } catch(e) {}
  },

  play(eventName, options = {}) {
    const profile = this.profiles[this.profileId] || this.profiles.industrial;
    const def = profile[eventName];
    if (!def) return;
    const seq = Array.isArray(def[0]) ? def : [def];
    seq.forEach(step => {
      const [freq, type, duration, vol, delay = 0] = step;
      const run = () => this.playTone(freq, type, duration, vol, options);
      if (delay > 0) {
        const timer = setTimeout(run, delay);
        if (options.preview) {
          this.previewNodes.add({ timer });
        }
      } else {
        run();
      }
    });
  },

  preview(eventName) {
    this.stopPreview();
    this.play(eventName, { preview: true });
  },

  stopPreview() {
    this.previewNodes.forEach(node => {
      try {
        if (node.timer) clearTimeout(node.timer);
        if (node.osc) node.osc.stop();
      } catch (_) {}
    });
    this.previewNodes.clear();
  },

  suspend() {
    this.stopPreview();
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  },

  resume() {
    if (!this.soundEnabled || document.hidden) return;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  destroyTemporaryNodes() {
    this.stopPreview();
    this.activeNodes.forEach(node => {
      try {
        if (node.timer) clearTimeout(node.timer);
        if (node.osc) node.osc.stop();
      } catch (_) {}
    });
    this.activeNodes.clear();
  },

  playTick() { this.play('navigation'); },
  playSelect() { this.play('confirm'); },
  playBack() { this.play('back'); },
  playError() { this.play('error'); },
  playCoinInsert() { this.play('coin'); },
  playAchievementUnlock() { this.play('achievement'); },
  playWarning() { this.play('warning'); }
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    ArcadeAudio.suspend();
  } else if (ArcadeAudio.soundEnabled) {
    ArcadeAudio.resume();
  }
});

// ============================================================================
// 3. EVENT BUS
// ============================================================================
const ArcadeEventBus = {
  listeners: {},
  currentOwner: null, // Holds { owner: 'core'|'route'|'app', ownerId }

  on(event, callback, options = null) {
    if (!this.listeners[event]) this.listeners[event] = [];
    const opt = options || this.currentOwner || { owner: 'core' };
    this.listeners[event].push({ callback, options: opt });
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(item => {
      if (typeof item === 'function') return item !== callback;
      return item.callback !== callback;
    });
  },

  emit(event, data = null) {
    if (!this.listeners[event]) return;
    const list = [...this.listeners[event]];
    list.forEach(item => {
      if (typeof item === 'function') {
        item(data);
      } else if (item && typeof item.callback === 'function') {
        item.callback(data);
      }
    });
  },

  clearAppListeners(appId) {
    for (const event in this.listeners) {
      this.listeners[event] = this.listeners[event].filter(item => {
        if (typeof item === 'function') return true;
        return !(item.options && item.options.owner === 'app' && item.options.ownerId === appId);
      });
    }
  },

  clearRouteListeners(route) {
    for (const event in this.listeners) {
      this.listeners[event] = this.listeners[event].filter(item => {
        if (typeof item === 'function') return true;
        return !(item.options && item.options.owner === 'route' && item.options.ownerId === route);
      });
    }
  },

  clearAll() {
    if (window.ARCADE_DEBUG) {
      console.warn('[ArcadeEventBus] clearAll() was called. Wiping listeners is suppressed to preserve core and stats states.');
    }
  }
};


// ============================================================================
// 4. INPUT MANAGER
// ============================================================================
const ArcadeInput = {
  initialized: false,
  gamepadRafId: null,
  gamepadConnected: false,
  previousGamepadState: {},
  lastDirection: '',
  lastDirectionAt: 0,
  directionRepeatDelay: 280,
  directionRepeatRate: 120,
  deadzone: 0.35,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    window.addEventListener('gamepadconnected', () => this.startGamepadPolling());
    window.addEventListener('gamepaddisconnected', () => this.handleGamepadDisconnect());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopGamepadPolling();
      } else if (this.getConnectedGamepads().length) {
        this.startGamepadPolling();
      }
    });

    // Keyboard Mapping
    document.addEventListener('keydown', (e) => {
      // Accept input whenever ArcadeOS is active, including brief chassis animation transitions.
      const chassis = document.querySelector('.cabinet-chassis');
      const routeActive = window.ArcadeOS
        && !['BOOT', 'HOME'].includes(window.ArcadeOS.state);
      const osActive = chassis?.classList.contains('is-scaled')
        || (window.ArcadeOS?.osVisible && window.ArcadeOS.state !== 'BOOT')
        || routeActive;
      if (!osActive) return;

      // Prevent default scrolling for arcade keys
      const arcadeKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','w','a','s','d'];
      if (arcadeKeys.includes(e.key)) {
        e.preventDefault();
      }

      let moveX = 0;
      let moveY = 0;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        moveY = -12;
        ArcadeEventBus.emit('ARCADE_UP');
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        moveY = 12;
        ArcadeEventBus.emit('ARCADE_DOWN');
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveX = -12;
        ArcadeEventBus.emit('ARCADE_LEFT');
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        moveX = 12;
        ArcadeEventBus.emit('ARCADE_RIGHT');
      }

      if (moveX !== 0 || moveY !== 0) {
        const joystick = document.getElementById('cab-joystick');
        if (joystick) {
          const joyStickEl = joystick.querySelector('.cab-joy-stick');
          const joyBallEl = joystick.querySelector('.cab-joy-ball');
          if (joyStickEl) joyStickEl.style.transform = `translate(${moveX * 0.4}px, ${moveY * 0.4}px) rotateY(${moveX * 1.5}deg) rotateX(${-moveY * 1.5}deg)`;
          if (joyBallEl) joyBallEl.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
      }

      if (e.key === 'Enter') {
        const smallBtns = document.querySelectorAll('.cab-btn-small');
        if (smallBtns.length >= 2) smallBtns[1].classList.add('is-pressed');
        ArcadeEventBus.emit('ARCADE_CONFIRM');
      }
      if (e.key === 'Escape') {
        console.log('ArcadeOS: Escape key down, OS state =', ArcadeOS.state);
        const smallBtns = document.querySelectorAll('.cab-btn-small');
        if (smallBtns.length >= 2) smallBtns[0].classList.add('is-pressed');
        ArcadeEventBus.emit('ARCADE_BACK');
      }
      if (e.key === 'Backspace') {
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.hasAttribute('contenteditable') ||
          active.getAttribute('data-arcade-control') === 'text'
        );
        if (!isInput) {
          e.preventDefault();
          const smallBtns = document.querySelectorAll('.cab-btn-small');
          if (smallBtns.length >= 2) smallBtns[0].classList.add('is-pressed');
          ArcadeEventBus.emit('ARCADE_BACK');
        }
      }
      if (e.key === ' ') {
        const btns = document.querySelectorAll('.cab-btn');
        if (btns.length >= 1) btns[0].classList.add('is-pressed');
        ArcadeEventBus.emit('ARCADE_ACTION_A');
      }
    });

    document.addEventListener('keyup', (e) => {
      const smallBtns = document.querySelectorAll('.cab-btn-small');
      const btns = document.querySelectorAll('.cab-btn');

      if (e.key === 'Enter' && smallBtns.length >= 2) {
        smallBtns[1].classList.remove('is-pressed');
      }
      if ((e.key === 'Escape' || e.key === 'Backspace') && smallBtns.length >= 2) {
        smallBtns[0].classList.remove('is-pressed');
      }
      if (e.key === ' ' && btns.length >= 1) {
        btns[0].classList.remove('is-pressed');
      }

      if (['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) {
        const joystick = document.getElementById('cab-joystick');
        if (joystick) {
          const joyStickEl = joystick.querySelector('.cab-joy-stick');
          const joyBallEl = joystick.querySelector('.cab-joy-ball');
          if (joyStickEl) {
            joyStickEl.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            joyStickEl.style.transform = '';
            setTimeout(() => { joyStickEl.style.transition = ''; }, 150);
          }
          if (joyBallEl) {
            joyBallEl.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            joyBallEl.style.transform = '';
            setTimeout(() => { joyBallEl.style.transition = ''; }, 150);
          }
        }
      }
    });

    // Hardware Buttons Mapping
    const btns = document.querySelectorAll('.cab-btn');
    if (btns.length >= 3) {
      btns[0].addEventListener('pointerdown', (e) => {
        e.preventDefault();
        ArcadeEventBus.emit('ARCADE_ACTION_A');
        ArcadeEventBus.emit('ARCADE_CONFIRM');
      });
      btns[1].addEventListener('pointerdown', (e) => {
        e.preventDefault();
        ArcadeEventBus.emit('ARCADE_ACTION_B');
        ArcadeEventBus.emit('ARCADE_BACK');
      });
      btns[2].addEventListener('pointerdown', (e) => {
        e.preventDefault();
        ArcadeEventBus.emit('ARCADE_CONFIRM');
      });
    }

    const smallBtns = document.querySelectorAll('.cab-btn-small');
    if (smallBtns.length >= 2) {
      smallBtns[0].addEventListener('pointerdown', (e) => {
        e.preventDefault();
        ArcadeEventBus.emit('ARCADE_BACK'); // Select
      });
      smallBtns[1].addEventListener('pointerdown', (e) => {
        e.preventDefault();
        ArcadeEventBus.emit('ARCADE_CONFIRM'); // Start
      });
    }

    // Physical Joystick Drag Interaction
    const joystick = document.getElementById('cab-joystick');
    if (joystick) {
      const joyStickEl = joystick.querySelector('.cab-joy-stick');
      const joyBallEl = joystick.querySelector('.cab-joy-ball');
      let dragStart = null;
      let lastTrigger = 0;
      const minTriggerDistance = 15; // px

      joystick.addEventListener('pointerdown', (e) => {
        const chassis = document.querySelector('.cabinet-chassis');
        if (!chassis || !chassis.classList.contains('is-scaled')) return;

        dragStart = { x: e.clientX, y: e.clientY };
        joystick.setPointerCapture(e.pointerId);
        e.preventDefault();
      });

      joystick.addEventListener('pointermove', (e) => {
        if (!dragStart) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        // Clamp physical movement (max 12px tilt distance)
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDist = 12;
        let moveX = deltaX;
        let moveY = deltaY;
        if (dist > maxDist) {
          moveX = (deltaX / dist) * maxDist;
          moveY = (deltaY / dist) * maxDist;
        }

        // Apply tilt transformation visually
        if (joyStickEl) {
          joyStickEl.style.transform = `translate(${moveX * 0.4}px, ${moveY * 0.4}px) rotateY(${moveX * 1.5}deg) rotateX(${-moveY * 1.5}deg)`;
        }
        if (joyBallEl) {
          joyBallEl.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }

        // Action trigger (throttled to 220ms)
        const now = Date.now();
        if (now - lastTrigger > 220) {
          if (Math.abs(deltaX) > minTriggerDistance || Math.abs(deltaY) > minTriggerDistance) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              if (deltaX > 0) {
                ArcadeEventBus.emit('ARCADE_RIGHT');
              } else {
                ArcadeEventBus.emit('ARCADE_LEFT');
              }
            } else {
              if (deltaY > 0) {
                ArcadeEventBus.emit('ARCADE_DOWN');
              } else {
                ArcadeEventBus.emit('ARCADE_UP');
              }
            }
            lastTrigger = now;
          }
        }
      });

      const releaseJoystick = (e) => {
        if (!dragStart) return;
        dragStart = null;
        try {
          joystick.releasePointerCapture(e.pointerId);
        } catch(err) {}

        // Return joystick to center with smooth spring animation
        if (joyStickEl) {
          joyStickEl.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          joyStickEl.style.transform = '';
          setTimeout(() => { joyStickEl.style.transition = ''; }, 150);
        }
        if (joyBallEl) {
          joyBallEl.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          joyBallEl.style.transform = '';
          setTimeout(() => { joyBallEl.style.transition = ''; }, 150);
        }
      };

      joystick.addEventListener('pointerup', releaseJoystick);
      joystick.addEventListener('pointercancel', releaseJoystick);
    }
  }
  ,

  getConnectedGamepads() {
    if (!navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads()).filter(Boolean);
  },

  startGamepadPolling() {
    if (this.gamepadRafId) return;
    const pads = this.getConnectedGamepads();
    if (!pads.length || document.hidden || (window.ArcadeOS && window.ArcadeOS.osVisible === false && !window.__TEST_MODE__)) return;
    this.gamepadConnected = true;
    ArcadeEventBus.emit('ARCADE_GAMEPAD_CONNECTED', {
      diagnostic: true,
      count: pads.length,
      mapped: pads.some(pad => pad.mapping === 'standard')
    });
    this.gamepadRafId = requestAnimationFrame((time) => this.handleGamepadFrame(time));
  },

  stopGamepadPolling() {
    if (this.gamepadRafId) {
      cancelAnimationFrame(this.gamepadRafId);
      this.gamepadRafId = null;
    }
    this.lastDirection = '';
  },

  handleGamepadDisconnect() {
    this.previousGamepadState = {};
    this.gamepadConnected = false;
    this.stopGamepadPolling();
    ArcadeEventBus.emit('ARCADE_GAMEPAD_DISCONNECTED', { diagnostic: true });
  },

  handleGamepadFrame(time = performance.now()) {
    const pads = this.getConnectedGamepads();
    if (!pads.length || document.hidden || (window.ArcadeOS && window.ArcadeOS.osVisible === false && !window.__TEST_MODE__)) {
      this.handleGamepadDisconnect();
      return;
    }

    const pad = pads.find(candidate => candidate.mapping === 'standard');
    if (!pad) {
      ArcadeEventBus.emit('ARCADE_GAMEPAD_UNMAPPED', { diagnostic: true, count: pads.length });
      this.gamepadRafId = requestAnimationFrame((nextTime) => this.handleGamepadFrame(nextTime));
      return;
    }

    const direction = this.getGamepadDirection(pad);
    if (direction) {
      const repeated = direction === this.lastDirection;
      const elapsed = time - this.lastDirectionAt;
      const shouldEmit = !repeated || elapsed >= (this.lastDirectionAt ? this.directionRepeatRate : this.directionRepeatDelay);
      if (shouldEmit) {
        this.emitDirection(direction);
        this.lastDirection = direction;
        this.lastDirectionAt = time;
      }
    } else {
      this.lastDirection = '';
      this.lastDirectionAt = 0;
    }

    this.handleGamepadButton(pad, 0, 'ARCADE_CONFIRM', 'A');
    this.handleGamepadButton(pad, 1, 'ARCADE_BACK', 'B');
    this.handleGamepadButton(pad, 9, 'ARCADE_CONFIRM', 'START');
    this.handleGamepadButton(pad, 8, 'ARCADE_BACK', 'SELECT');

    this.gamepadRafId = requestAnimationFrame((nextTime) => this.handleGamepadFrame(nextTime));
  },

  getGamepadDirection(pad) {
    const x = Math.abs(pad.axes[0] || 0) > this.deadzone ? pad.axes[0] : 0;
    const y = Math.abs(pad.axes[1] || 0) > this.deadzone ? pad.axes[1] : 0;
    const dpadUp = pad.buttons[12]?.pressed;
    const dpadDown = pad.buttons[13]?.pressed;
    const dpadLeft = pad.buttons[14]?.pressed;
    const dpadRight = pad.buttons[15]?.pressed;

    if (dpadUp || y < 0) return 'UP';
    if (dpadDown || y > 0) return 'DOWN';
    if (dpadLeft || x < 0) return 'LEFT';
    if (dpadRight || x > 0) return 'RIGHT';
    return '';
  },

  emitDirection(direction) {
    ArcadeEventBus.emit(`ARCADE_${direction}`, { source: 'gamepad' });
  },

  handleGamepadButton(pad, index, eventName, label) {
    const pressed = !!pad.buttons[index]?.pressed;
    const key = `${pad.index}:${index}`;
    const wasPressed = !!this.previousGamepadState[key];
    this.previousGamepadState[key] = pressed;
    if (!pressed || wasPressed) return;

    ArcadeEventBus.emit('ARCADE_GAMEPAD_BUTTON', { diagnostic: true, button: label, index });
    if (label === 'A') ArcadeEventBus.emit('ARCADE_ACTION_A', { source: 'gamepad' });
    if (label === 'B') ArcadeEventBus.emit('ARCADE_ACTION_B', { source: 'gamepad' });
    ArcadeEventBus.emit(eventName, { source: 'gamepad' });
  }
};

// ============================================================================
// 5. APP REGISTRY
// ============================================================================
const ArcadeRegistry = {
  apps: [],

  register(appConfig) {
    this.apps.push(appConfig);
  },

  getApp(id) {
    return this.apps.find(a => a.id === id);
  },

  getAll() {
    return this.apps;
  }
};
window.ArcadeRegistry = ArcadeRegistry;
window.ArcadeStorage = ArcadeStorage;
window.ArcadeAudio = ArcadeAudio;
window.ArcadeInput = ArcadeInput;
window.ArcadeEventBus = ArcadeEventBus;

// ============================================================================
// 6. OS ROUTER & LIFECYCLE MANAGER
// ============================================================================
const ArcadeHardware = {
  initialized: false,
  timers: {},
  chassis: null,
  oledStatus: null,
  marqueeText: null,
  powerLed: null,
  inputLed: null,
  storageLed: null,
  networkLed: null,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.chassis = document.querySelector('.cabinet-chassis');
    this.oledStatus = document.querySelector('.oled-status');
    this.marqueeText = document.querySelector('.cab-marquee-text');
    this.powerLed = document.getElementById('led-power');
    this.inputLed = document.getElementById('led-input');
    this.storageLed = document.getElementById('led-storage');
    this.networkLed = document.getElementById('led-network');

    // Set network status initially
    this.setNetworkStatus(navigator.onLine);
    window.addEventListener('online', () => this.setNetworkStatus(true));
    window.addEventListener('offline', () => this.setNetworkStatus(false));

    // Bind click / keydown to coin slot
    const coinSlot = document.querySelector('.cab-coin-slot');
    if (coinSlot) {
      const insertCoinHandler = (e) => {
        e.preventDefault();
        this.insertCoin();
      };
      coinSlot.addEventListener('click', insertCoinHandler);
      coinSlot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          insertCoinHandler(e);
        }
      });
    }

    // Input events feedback (reusing central ArcadeInput events)
    const inputs = ['ARCADE_UP', 'ARCADE_DOWN', 'ARCADE_LEFT', 'ARCADE_RIGHT'];
    inputs.forEach(evt => {
      ArcadeEventBus.on(evt, () => this.pulseInput());
    });

    ArcadeEventBus.on('ARCADE_CONFIRM', () => {
      this.pulseInput();
      const startBtn = document.querySelector('.cab-btn-small[data-tooltip="Start"]');
      if (startBtn) {
        startBtn.classList.add('is-pressed');
        this.setHardwareTimer('confirm_btn', () => startBtn.classList.remove('is-pressed'), 100);
      }
    });

    ArcadeEventBus.on('ARCADE_BACK', () => {
      this.pulseInput();
      const selectBtn = document.querySelector('.cab-btn-small[data-tooltip="Select"]');
      if (selectBtn) {
        selectBtn.classList.add('is-pressed');
        this.setHardwareTimer('back_btn', () => selectBtn.classList.remove('is-pressed'), 100);
      }
    });

    ArcadeEventBus.on('ARCADE_ACTION_A', () => {
      this.pulseInput();
      const actionA = document.querySelector('.cab-btn.action-a');
      if (actionA) {
        actionA.classList.add('is-pressed');
        this.setHardwareTimer('action_a_btn', () => actionA.classList.remove('is-pressed'), 100);
      }
    });

    // Custom pointer click feedback for cabinet controls
    document.querySelectorAll('.cab-btn, .cab-btn-small').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        this.pulseInput();
        btn.classList.add('is-pressed');
      });
      const release = () => btn.classList.remove('is-pressed');
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    });
  },

  setHardwareTimer(key, callback, delay) {
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
      clearInterval(this.timers[key]);
      this.timers[key] = null;
    }
    this.timers[key] = setTimeout(callback, delay);
  },

  clearAllTimers() {
    Object.keys(this.timers).forEach(key => {
      if (this.timers[key]) {
        clearTimeout(this.timers[key]);
        clearInterval(this.timers[key]);
        this.timers[key] = null;
      }
    });
  },

  setState(state) {
    if (!this.chassis) return;

    // Set custom state attribute
    this.chassis.setAttribute('data-machine-state', state.toLowerCase());

    this.setPowerLedState(state);
    this.updateMarquee(state);
    this.updateOled(state);
  },

  setPowerLedState(state) {
    if (!this.powerLed) return;
    this.powerLed.className = 'cab-indicator-led led-power';

    if (state === 'BOOT') {
      this.powerLed.classList.add('amber');
    } else if (state === 'LOADING') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.powerLed.classList.add(prefersReducedMotion ? 'green' : 'pulse-cyan');
    } else if (state === 'ERROR') {
      this.powerLed.classList.add('red');
    } else {
      this.powerLed.classList.add('green');
    }
  },

  updateMarquee(state) {
    if (!this.marqueeText) return;

    // Check if Customizer has custom text
    const customText = (window.ArcadeCustomizer && window.ArcadeCustomizer.persistedConfig)
      ? window.ArcadeCustomizer.persistedConfig.marqueeText.toUpperCase()
      : 'A R C A D E';

    if (state === 'HOME') {
      this.marqueeText.textContent = customText;
    } else if (state === 'APP') {
      const activeApp = ArcadeOS.activeApp;
      const appConfig = activeApp ? ArcadeRegistry.getApp(ArcadeOS.selectedIndex >= 0 ? ArcadeOS.getHomeItems()[ArcadeOS.selectedIndex].id : '') : null;
      this.marqueeText.textContent = appConfig ? appConfig.title.toUpperCase() : 'RUNNING';
    } else if (state === 'SETTINGS') {
      this.marqueeText.textContent = 'SETTINGS';
    } else if (state === 'PROFILE') {
      this.marqueeText.textContent = 'PROFILE';
    } else if (state === 'ACHIEVEMENTS') {
      this.marqueeText.textContent = 'AWARDS';
    } else if (state === 'CUSTOMIZE') {
      this.marqueeText.textContent = (window.ArcadeCustomizer && window.ArcadeCustomizer.draftConfig)
        ? window.ArcadeCustomizer.draftConfig.marqueeText.toUpperCase()
        : 'CUSTOMIZE';
    } else if (state === 'LOADING') {
      this.marqueeText.textContent = 'LOADING...';
    }
  },

  updateOled(state) {
    if (this.timers.oled_loop) {
      clearInterval(this.timers.oled_loop);
      this.timers.oled_loop = null;
    }
    if (this.timers.oled_temp) {
      clearTimeout(this.timers.oled_temp);
      this.timers.oled_temp = null;
    }
    if (!this.oledStatus) return;

    // Visibility check optimization
    if (window.ArcadeOS && window.ArcadeOS.osVisible === false && !window.__TEST_MODE__) {
      this.oledStatus.textContent = 'SYS: IDLE';
      return;
    }

    if (state === 'BOOT') {
      let step = 0;
      const phases = ['SYS CHECK', 'INPUT CHECK', 'STORAGE CHECK'];
      this.oledStatus.textContent = phases[0];
      this.timers.oled_loop = setInterval(() => {
        step++;
        if (step < phases.length) {
          this.oledStatus.textContent = phases[step];
        } else {
          clearInterval(this.timers.oled_loop);
          this.timers.oled_loop = null;
          this.oledStatus.textContent = 'SYS: ONLINE';
        }
      }, 600);
    } else if (state === 'HOME') {
      const items = ArcadeOS.getHomeItems();
      const activeItem = items[ArcadeOS.selectedIndex];
      this.oledStatus.textContent = activeItem ? activeItem.title.toUpperCase() : 'READY';
    } else if (state === 'LOADING') {
      const items = ArcadeOS.getHomeItems();
      const activeItem = items[ArcadeOS.selectedIndex];
      this.oledStatus.textContent = `LOAD: ${activeItem ? activeItem.title.substring(0, 8).toUpperCase() : 'APP'}`;
    } else if (state === 'APP') {
      const activeApp = ArcadeOS.activeApp;
      const appId = activeApp ? (ArcadeOS.getHomeItems()[ArcadeOS.selectedIndex]?.id || 'APP') : 'APP';
      const label = appId.toUpperCase();

      const startTime = performance.now();
      const tick = () => {
        if (window.ArcadeOS && window.ArcadeOS.osVisible === false) return; // skip if off-screen
        const elapsed = Math.floor((performance.now() - startTime) / 1000);
        this.oledStatus.textContent = `${label} ${elapsed}S`;
      };
      tick();
      this.timers.oled_loop = setInterval(tick, 1000);
    } else if (state === 'SETTINGS') {
      this.oledStatus.textContent = 'SYS CONFIG';
    } else if (state === 'PROFILE') {
      this.oledStatus.textContent = 'PLAYER DATA';
    } else if (state === 'ACHIEVEMENTS') {
      this.oledStatus.textContent = 'TROPHY LOG';
    } else if (state === 'CUSTOMIZE') {
      this.oledStatus.textContent = 'DESIGN LAB';
    }
  },

  pulseInput() {
    if (!this.inputLed) return;
    this.inputLed.classList.add('blink');
    this.setHardwareTimer('input_led', () => this.inputLed.classList.remove('blink'), 80);
  },

  pulseStorage() {
    if (!this.storageLed) return;
    this.storageLed.classList.add('blink');
    this.setHardwareTimer('storage_led', () => this.storageLed.classList.remove('blink'), 120);
  },

  setNetworkStatus(online) {
    if (!this.networkLed) return;
    this.networkLed.className = 'cab-indicator-led led-network';
    this.networkLed.classList.add(online ? 'green' : 'amber');
  },

  insertCoin() {
    // 1. Play coin synth sequence
    ArcadeAudio.playCoinInsert();

    // 2. Pulse slot coin return backlight
    const returnBtn = document.querySelector('.cab-coin-return');
    if (returnBtn) {
      returnBtn.classList.add('pulse-light');
      this.setHardwareTimer('coin_slot', () => returnBtn.classList.remove('pulse-light'), 400);
    }

    // 3. Temporarily display CREDIT +1 on OLED status
    if (this.oledStatus) {
      if (this.timers.oled_loop) {
        clearInterval(this.timers.oled_loop);
        this.timers.oled_loop = null;
      }
      this.oledStatus.textContent = 'CREDIT +1';
      this.setHardwareTimer('oled_temp', () => {
        this.updateOled(ArcadeOS.state);
      }, 1200);
    }

    // 4. Update and persist credit stats
    ArcadeOS.loadStatsEngine(statsEngine => {
      statsEngine.recordCoinInsert();
    });
  }
};

window.ArcadeHardware = ArcadeHardware;

// Shared ArcadeAudio now owns coin, achievement, warning, preview, and profile sounds.

// ============================================================================
// 6. OS ROUTER & LIFECYCLE MANAGER
// ============================================================================
const SYSTEM_ROUTES = {
  CUSTOMIZE: {
    title: 'Machine Customizer',
    description: 'Visually configure your premium cabinet.',
    icon: '🎨',
    isLazy: true,
    loader: () => import('./modules/arcade-customizer.js'),
    moduleName: 'ArcadeCustomizer',
    render: (view, engine) => engine.open(view)
  },
  ACHIEVEMENTS: {
    title: 'Achievements',
    description: 'View unlocked trophies.',
    icon: '🏆',
    isLazy: true,
    loader: () => import('./modules/arcade-achievements.js'),
    moduleName: 'ArcadeAchievements',
    render: (view, engine) => engine.renderAchievements(view)
  },
  STATS: {
    title: 'Stats Dashboard',
    description: 'Detailed play statistics and logs.',
    icon: '📊',
    isLazy: true,
    loader: () => import('./modules/arcade-stats.js'),
    moduleName: 'ArcadeStats',
    render: (view, engine) => engine.renderStats(view)
  },
  LEADERBOARDS: {
    title: 'Local Records',
    description: 'Cabinet high scores and ratings.',
    icon: '🏆',
    isLazy: true,
    loader: () => import('./modules/arcade-stats.js'),
    moduleName: 'ArcadeStats',
    render: (view, engine) => engine.renderLeaderboards(view)
  },
  SETTINGS: {
    title: 'Settings',
    description: 'Configure display, sound, and system settings.',
    icon: '⚙️',
    isLazy: false,
    render: (view, engine) => engine.renderSettings(view)
  },
PROFILE: {
    title: 'Player Profile',
    description: 'View stats and playtime summary.',
    icon: '👤',
    isLazy: false,
    render: (view, engine) => engine.renderProfile(view)
  },
  SOUNDLAB: {
    title: 'SoundLab',
    description: 'Tune locally generated cabinet sound profiles.',
    icon: '♫',
    isLazy: true,
    loader: () => import('./modules/arcade-soundlab.js'),
    moduleName: 'ArcadeSoundLab',
    render: (view, engine) => engine.open(view)
  },
  DIAGNOSTICS: {
    title: 'Diagnostics',
    description: 'Test cabinet input, storage, audio, and hardware.',
    icon: '▣',
    isLazy: true,
    loader: () => import('./modules/arcade-diagnostics.js'),
    moduleName: 'ArcadeDiagnostics',
    render: (view, engine) => engine.open(view)
  }
};
window.SYSTEM_ROUTES = SYSTEM_ROUTES;

let lastHomeLauncherItemId = null;

window.ArcadeOS = {
  initialized: false,
  activeApp: null,
  state: 'BOOT', // BOOT, HOME, SETTINGS, PROFILE, ACHIEVEMENTS, LOADING, APP
  osVisible: false,
  systemRouteRequestId: 0,



  toastQueue: [],
  toastActive: false,

  sessionAppId: null,
  sessionStartTime: null,
  sessionAccumulatedTime: 0,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.container = document.getElementById('cabinet-screen');
    if (!this.container) return;

    ArcadeInput.init();
    ArcadeHardware.init();
    this.registerCoreEvents();
    this.applyHardwareEffects();

    // Central delegated action handler for confirmations & resets (Correction 5)
    this.container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-arcade-action]');
      if (!target) return;

      const action = target.getAttribute('data-arcade-action');
      if (action === 'clear-session-history') {
        e.preventDefault();
        this.showConfirmModal("Clear recent session logs? aggregate stats will be preserved.", () => {
          this.loadStatsEngine(statsEngine => {
            statsEngine.data.recentSessions = [];
            statsEngine.saveToStorage();

            // Re-render STATS if it's the current route
            if (this.state === 'STATS') {
              const view = document.getElementById('arcade-app-view');
              if (view) {
                statsEngine.renderStats(view);
                if (window.ArcadeSystemUI) {
                  window.ArcadeSystemUI.refreshFocusableElements();
                  window.ArcadeSystemUI.focusFirst();
                }
              }
            }
          });
        }, () => {});
      } else if (action === 'reset-achievements') {
        e.preventDefault();
        this.showConfirmModal("Reset all achievements? Presets, stats, and credits will be preserved.", () => {
          this.loadAchievementsEngine(achEngine => {
            achEngine.data = {
              schemaVersion: 2,
              unlocked: {},
              counters: {}
            };
            achEngine.saveToStorage();

            // Re-render ACHIEVEMENTS if it's the current route
            if (this.state === 'ACHIEVEMENTS') {
              const view = document.getElementById('arcade-app-view');
              if (view) {
                achEngine.renderAchievements(view);
                if (window.ArcadeSystemUI) {
                  window.ArcadeSystemUI.refreshFocusableElements();
                  window.ArcadeSystemUI.focusFirst();
                }
              }
            }
          });
        }, () => {});
      } else if (action === 'backup-export') {
        e.preventDefault();
        this.loadResetSafetyEngine(resetSafety => {
          const summary = resetSafety.getBackupSummary();
          this.showConfirmModal(`${summary} Download machine backup JSON now?`, () => {
            resetSafety.exportBackup();
          }, () => {});
        });
      } else if (action === 'reset-sound-profile') {
        e.preventDefault();
        this.loadResetSafetyEngine(resetSafety => {
          this.showConfirmModal("Reset only the selected sound profile and reduced-audio flag? Master volume and mute stay unchanged.", () => {
            resetSafety.resetSoundProfile();
          }, () => {});
        });
      } else if (action === 'reset-aggregate-stats') {
        e.preventDefault();
        this.loadResetSafetyEngine(resetSafety => {
          this.showConfirmModal("Reset aggregate stats and per-game records? Credits, profile, saves, settings, and customization presets will be preserved.", () => {
            resetSafety.resetAggregateStats();
            if (this.state === 'SETTINGS') this.renderSettings(document.getElementById('arcade-app-view'));
          }, () => {});
        });
      } else if (action === 'reset-game-records') {
        e.preventDefault();
        this.loadResetSafetyEngine(resetSafety => {
          this.showConfirmModal("Reset per-game records and legacy high-score keys? Credits, profile, saves, settings, and customization presets will be preserved.", () => {
            resetSafety.resetPerGameRecords();
            if (this.state === 'SETTINGS') this.renderSettings(document.getElementById('arcade-app-view'));
          }, () => {});
        });
      } else if (action === 'full-machine-reset') {
        e.preventDefault();
        this.loadResetSafetyEngine(resetSafety => resetSafety.fullMachineResetFlow());
      } else if (action === 'replay-onboarding') {
        e.preventDefault();
        ArcadeStorage.set(ArcadeStorage.KEYS.ONBOARDING_COMPLETE, false);
        this.goHome();
        this.renderOnboarding(true);
      } else if (action === 'replay-boot') {
        e.preventDefault();
        this.replayBootSequence();
      }
    });

    window.ArcadeModuleLoader.import('./modules/arcade-customizer.js').then(module => {
      window.ArcadeCustomizer = module.ArcadeCustomizer;
      window.ArcadeCustomizer.init();
    }).catch(err => {
      console.warn('Lazy-load customizer failed initially', err);
    });

    window.ArcadeModuleLoader.import('./modules/arcade-reset-safety.js').then(module => {
      window.ArcadeResetSafety = module.ArcadeResetSafety;
    }).catch(err => {
      console.warn('Lazy-load reset safety failed initially', err);
    });

    // Build Base OS HTML Structure strictly utilizing requested IDs
    const ui = document.createElement('div');
    ui.id = 'arcade-os';
    ui.innerHTML = `
      <div id="arcade-status-bar">
        <span class="os-brand">ARCADE OS</span>
        <span class="os-status" id="os-route-label">HOME</span>
        <div class="os-sys-info">
          <span id="os-time">00:00</span>
          <button id="os-home-btn" class="os-text-btn" type="button" aria-label="Return to Arcade home">HOME</button>
          <button id="os-exit-btn" class="os-text-btn" type="button" aria-label="Exit Arcade to portfolio">EXIT</button>
          <button id="os-mute-btn" class="os-icon" type="button" aria-label="Toggle Sound">🔇</button>
        </div>
      </div>
      <div id="arcade-route-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>

      <div id="arcade-home" class="os-view">
        <aside id="arcade-onboarding" class="arcade-onboarding" aria-labelledby="arcade-onboarding-title" hidden></aside>
        <div class="home-carousel-wrapper">
          <div class="home-carousel" id="home-carousel"></div>
        </div>
        <div class="home-details" id="home-details"></div>
      </div>

      <div id="arcade-app-view" class="os-view"></div>

      <div id="arcade-loading" class="os-view">
        <div class="loading-spinner"></div>
        <div class="loading-text">BOOTING APP...</div>
      </div>

      <div id="arcade-footer-controls">
        <span class="footer-control-item"><span class="key-cap">ARROWS</span> MOVE</span>
        <span class="footer-control-item"><span class="key-cap">ENTER / A</span> SELECT</span>
        <span class="footer-control-item"><span class="key-cap">ESC / B</span> BACK</span>
        <span class="footer-control-item pointer-hint"><span class="key-cap">TAP</span> TOUCH</span>
      </div>
    `;
    this.container.appendChild(ui);

    // Mute toggle setup
    const muteBtn = document.getElementById('os-mute-btn');
    if (muteBtn) {
      const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {};
      muteBtn.textContent = settings.soundEnabled ? '🔊' : '🔇';

      const toggleHandler = (e) => {
        e.preventDefault();
        const enabled = ArcadeAudio.toggleSound();
        muteBtn.textContent = enabled ? '🔊' : '🔇';
        if (enabled) ArcadeAudio.playTick();
      };

      muteBtn.addEventListener('click', toggleHandler);
    }

    document.getElementById('os-home-btn')?.addEventListener('click', () => this.goHome());
    document.getElementById('os-exit-btn')?.addEventListener('click', () => this.exitToPortfolio());

    // Clock updates once per minute to preserve CPU cycles
    const updateTime = () => {
      const timeEl = document.getElementById('os-time');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    };
    updateTime();
    this.clockInterval = setInterval(updateTime, 60000);

    // Home Launcher State (loaded from lastHomeLauncherItemId)
    const lastSelectedId = lastHomeLauncherItemId || 'reaction';
    const items = this.getHomeItems();
    const foundIdx = items.findIndex(item => item.id === lastSelectedId);
    this.selectedIndex = foundIdx !== -1 ? foundIdx : 0;

    this.launchPending = false;
    this.launchTimeoutId = null;

    // Touch swipe support (bind once)
    const carousel = document.getElementById('home-carousel');
    if (carousel) {
      let touchStartX = 0;
      carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });

      carousel.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 40) {
          if (diffX > 0) {
            ArcadeEventBus.emit('ARCADE_LEFT');
          } else {
            ArcadeEventBus.emit('ARCADE_RIGHT');
          }
        }
      }, { passive: true });
    }

    // Page focus / visibility listeners for session playtime
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'APP') {
          this.pausePlaytimeSession();
          if (this.activeApp && typeof this.activeApp.pause === 'function') {
            this.activeApp.pause();
          }
        }
      } else {
        if (this.state === 'APP') {
          this.resumePlaytimeSession();
          if (this.activeApp && typeof this.activeApp.resume === 'function') {
            this.activeApp.resume();
          }
        }
      }
    });

    // Central achievement unlock listeners
    const achievementEvents = [
      'GAME_LAUNCHED',
      'GAME_COMPLETED',
      'REACTION_SCORE',
      'SNAKE_SCORE',
      'BREAKOUT_SCORE',
      'PIXELPAD_SAVED',
      'PALETTE_EXPORTED',
      'PLAYTIME_UPDATED',
      'COIN_INSERTED'
    ];
    achievementEvents.forEach(evt => {
      ArcadeEventBus.on(evt, (data) => {
        this.checkAchievements(evt, data);
      });
    });
    this.ensureSystemUI().catch(err => {
      console.warn('Lazy-load System UI failed initially', err);
    });
  },

  ensureSystemUI() {
    if (window.ArcadeSystemUI) {
      const previousOwner = ArcadeEventBus.currentOwner;
      ArcadeEventBus.currentOwner = null;
      try {
        window.ArcadeSystemUI.init();
      } finally {
        ArcadeEventBus.currentOwner = previousOwner;
      }
      return Promise.resolve(window.ArcadeSystemUI);
    }
    if (!this.systemUILoadPromise) {
      this.systemUILoadPromise = import('./modules/arcade-system-ui.js').then(module => {
        window.ArcadeSystemUI = module.ArcadeSystemUI;
        const previousOwner = ArcadeEventBus.currentOwner;
        ArcadeEventBus.currentOwner = null;
        try {
          window.ArcadeSystemUI.init();
        } finally {
          ArcadeEventBus.currentOwner = previousOwner;
        }
        return window.ArcadeSystemUI;
      }).catch(error => {
        this.systemUILoadPromise = null;
        throw error;
      });
    }
    return this.systemUILoadPromise;
  },

  registerCoreEvents() {
    ArcadeEventBus.on('ARCADE_BACK', () => {
      if (this.state === 'APP') {
        if (this.activeApp && typeof this.activeApp.handleBack === 'function') {
          this.activeApp.handleBack();
        } else {
          this.goHome();
        }
      } else if (this.state === 'HOME') {
        this.exitToPortfolio();
      }
    });

    ArcadeEventBus.on('ARCADE_CONFIRM', () => {
      if (this.state === 'HOME') {
        const items = this.getHomeItems();
        const activeItem = items[this.selectedIndex];
        if (activeItem) {
          if (activeItem.isSystem) {
            this.routeTo(activeItem.route);
          } else {
            this.launchApp(activeItem.id);
          }
        }
      }
    });

    ArcadeEventBus.on('ARCADE_LEFT', () => {
      if (this.state === 'HOME') this.moveSelection(-1);
    });

    ArcadeEventBus.on('ARCADE_RIGHT', () => {
      if (this.state === 'HOME') this.moveSelection(1);
    });
  },

  applyHardwareEffects() {
    const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS);
    if (settings) {
      const brightnessVal = typeof settings.brightness === 'number' ? Math.max(0.25, settings.brightness) : 1.0;
      document.documentElement.style.setProperty('--arcade-brightness', brightnessVal);

      const glowVal = typeof settings.glow === 'number' ? settings.glow : 0.8;
      document.documentElement.style.setProperty('--arcade-glow', glowVal);

      ArcadeAudio.soundEnabled = settings.soundEnabled;
      ArcadeAudio.masterVolume = typeof settings.volume === 'number' ? settings.volume : ArcadeAudio.masterVolume;
      ArcadeAudio.profileId = settings.soundProfile || ArcadeAudio.profileId || 'industrial';
      ArcadeAudio.reducedAudio = !!settings.reducedAudio;
      ArcadeAudio.updateMasterGain?.();
    }
  },

  // State Persistence Helpers with explicit Storage LED Pulses
  saveSettings(settings) {
    ArcadeStorage.set(ArcadeStorage.KEYS.SETTINGS, settings);
    ArcadeHardware.pulseStorage();
  },
  saveStats(stats) {
    ArcadeStorage.set(ArcadeStorage.KEYS.STATS, stats);
    ArcadeHardware.pulseStorage();
  },
  saveAchievements(achievements) {
    ArcadeStorage.set(ArcadeStorage.KEYS.ACHIEVEMENTS, achievements);
    ArcadeHardware.pulseStorage();
  },
  saveProfile(profile) {
    ArcadeStorage.set(ArcadeStorage.KEYS.PROFILE, profile);
    ArcadeHardware.pulseStorage();
  },
  saveGameState(keyOrAppId, state) {
    let saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES) || {};
    if (typeof state === 'object' && state !== null) {
      saves[`state_${keyOrAppId}`] = state;
    } else {
      saves[keyOrAppId] = state;
    }
    ArcadeStorage.set(ArcadeStorage.KEYS.SAVES, saves);
    ArcadeHardware.pulseStorage();
  },

  checkAchievements(event, data) {
    if (data && data.diagnostic) return;
    if (event && String(event).startsWith('DIAGNOSTIC_')) return;
    if (event === 'REACTION_SCORE' && data?.score) {
      this.saveGameState('reaction_best', data.score);
      localStorage.setItem('reaction_best', data.score);
    }
    if (event === 'SNAKE_SCORE' && typeof data?.score === 'number') {
      let saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES) || {};
      if (data.score > (saves.snake_best || 0)) {
        this.saveGameState('snake_best', data.score);
      }
      localStorage.setItem('arcade_snake_best', data.score);
    }
    if (event === 'BREAKOUT_SCORE' && typeof data?.score === 'number') {
      let saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES) || {};
      if (data.score > (saves.breakout_best || 0)) {
        this.saveGameState('breakout_best', data.score);
      }
      localStorage.setItem('arcade_breakout_best', data.score);
    }

    this.loadAchievementsEngine(engine => {
      engine.evaluate(event, data);
    });
  },

  unlockAchievement(id) {
    this.loadAchievementsEngine(engine => {
      engine.unlock(id);
    });
  },

  showToast(achievement) {
    this.toastQueue.push(achievement);
    this.processToastQueue();
  },

  processToastQueue() {
    if (this.toastActive || this.toastQueue.length === 0) return;
    this.toastActive = true;

    const achievement = this.toastQueue.shift();

    let toastHost = document.getElementById('arcade-toast-host');
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.id = 'arcade-toast-host';
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }

    const toast = document.createElement('div');
    toast.className = 'arcade-toast';
    toast.innerHTML = `
      <div class="toast-icon">${achievement.icon}</div>
      <div class="toast-body">
        <div class="toast-title">Achievement Unlocked!</div>
        <div class="toast-name">${achievement.title}</div>
        <div class="toast-desc">${achievement.desc}</div>
      </div>
    `;

    toastHost.appendChild(toast);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setTimeout(() => {
      toast.classList.add('visible');
    }, 50);

    const duration = prefersReducedMotion ? 2500 : 3500;

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toast.remove();
        this.toastActive = false;
        this.processToastQueue();
      }, 500);
    }, duration);
  },

  boot(options = {}) {
    this.init();
    if (this.bootTimer) clearTimeout(this.bootTimer);
    ArcadeHardware.setState('BOOT');
    this.renderHome();

    this.setRouteStatus('BOOTING');
    const bootLoader = document.querySelector('.boot-loader');
    const osLayer = document.getElementById('arcade-os');
    const homeView = document.getElementById('arcade-home');
    if (bootLoader) bootLoader.classList.remove('is-hidden');
    if (osLayer) osLayer.style.opacity = '0';
    if (homeView) homeView.classList.remove('active');

    const completedBefore = ArcadeStorage.get(ArcadeStorage.KEYS.BOOT_COMPLETE, false) === true;
    const bootDuration = options.replay || !completedBefore ? 700 : 120;

    this.bootTimer = setTimeout(() => {
      if (bootLoader) bootLoader.classList.add('is-hidden');
      if (osLayer) {
        osLayer.style.opacity = '1';
        osLayer.classList.add('os-booted');
      }
      if (homeView) {
        homeView.classList.add('active');
      }
      this.state = 'HOME';
      ArcadeHardware.setState('HOME');
      ArcadeStorage.set(ArcadeStorage.KEYS.BOOT_COMPLETE, true);
      this.setRouteStatus('HOME');
      this.renderOnboarding(options.onboarding === true);

      if (!completedBefore) ArcadeEventBus.emit('GAME_LAUNCHED', { id: 'os' });
      this.bootTimer = null;
    }, bootDuration);
  },

  replayBootSequence() {
    this.forceGoHome(true);
    this.boot({ replay: true });
  },

  renderOnboarding(force = false) {
    const panel = document.getElementById('arcade-onboarding');
    if (!panel) return;
    const completed = ArcadeStorage.get(ArcadeStorage.KEYS.ONBOARDING_COMPLETE, false) === true;
    if (completed && !force) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }

    panel.innerHTML = `
      <div>
        <strong id="arcade-onboarding-title">CABINET CONTROLS</strong>
        <span>Arrows or joystick move. Enter, A, or Start selects. Escape or B goes back. Mouse, touch, and standard gamepads are supported.</span>
      </div>
      <button type="button" class="onboarding-dismiss" data-arcade-focusable>GOT IT</button>
    `;
    panel.hidden = false;
    panel.querySelector('.onboarding-dismiss')?.addEventListener('click', () => {
      ArcadeStorage.set(ArcadeStorage.KEYS.ONBOARDING_COMPLETE, true);
      panel.hidden = true;
      this.announce('Control guide dismissed. Replay it from Settings.');
    }, { once: true });
  },

  setRouteStatus(label) {
    const normalized = String(label || 'HOME').replace(/_/g, ' ');
    const routeLabel = document.getElementById('os-route-label');
    if (routeLabel) routeLabel.textContent = normalized;
    this.announce(`${normalized} screen`);
  },

  announce(message) {
    const announcer = document.getElementById('arcade-route-announcer');
    if (announcer) announcer.textContent = message;
  },

  exitToPortfolio() {
    this.forceGoHome(true);
    if (typeof window.exitArcadeToPortfolio === 'function') window.exitArcadeToPortfolio();
    else document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
  },

  getHomeItems() {
    const apps = ArcadeRegistry.getAll().map(a => ({
      ...a,
      isSystem: false,
      group: ['reaction', 'snake', 'breakout'].includes(a.id) ? 'PLAY' : 'CREATE'
    }));
    const systemItems = Object.keys(SYSTEM_ROUTES).map(routeKey => {
      const routeCfg = SYSTEM_ROUTES[routeKey];
      return {
        id: routeKey.toLowerCase(),
        title: routeCfg.title,
        category: 'SYSTEM',
        description: routeCfg.description,
        icon: routeCfg.icon,
        isSystem: true,
        group: 'SYSTEM',
        route: routeKey
      };
    });
    return [...apps, ...systemItems];
  },

  renderHome() {
    const items = this.getHomeItems();
    const carousel = document.getElementById('home-carousel');
    const details = document.getElementById('home-details');
    if (!carousel || !details) return;

    if (this.selectedIndex >= items.length) this.selectedIndex = 0;

    const launcherHadFocus = carousel.contains(document.activeElement);
    carousel.innerHTML = items.map((item, idx) => `
      <button type="button" class="app-card ${idx === this.selectedIndex ? 'focused' : ''} ${item.isSystem ? 'system-card' : ''}" data-idx="${idx}" data-launcher-id="${item.id}" data-launcher-group="${item.group}" aria-label="Open ${item.title}" aria-current="${idx === this.selectedIndex ? 'true' : 'false'}">
        <div class="app-icon">${item.icon}</div>
      </button>
    `).join('');

    const activeItem = items[this.selectedIndex];
    details.innerHTML = `
      <div class="app-group">${activeItem.group}</div>
      <div class="app-category">${activeItem.category}</div>
      <h2 class="app-title">${activeItem.title}</h2>
      <p class="app-desc">${activeItem.description}</p>
      <div class="app-status-badge ${activeItem.status || 'ready'}">${(activeItem.status || 'SYSTEM').toUpperCase().replace('-', ' ')}</div>
      <div class="app-hint">Press ENTER, Start, or Tap to Open</div>
    `;

    carousel.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(card.dataset.idx);
        if (idx === this.selectedIndex) {
          ArcadeEventBus.emit('ARCADE_CONFIRM');
        } else {
          this.selectedIndex = idx;
          const selectedItem = items[this.selectedIndex];
          if (selectedItem) {
            lastHomeLauncherItemId = selectedItem.id;
            ArcadeHardware.pulseStorage();
          }
          ArcadeAudio.playTick();
          this.renderHome();
          // Keep hardware status in sync
          ArcadeHardware.updateOled(this.state);
        }
      });
    });

    const cardWidth = 70;
    const gap = 16;
    const offset = -(this.selectedIndex * (cardWidth + gap));
    carousel.style.transform = `translateX(${offset}px)`;
    if (launcherHadFocus) carousel.querySelector('.app-card.focused')?.focus({ preventScroll: true });
  },

  moveSelection(dir) {
    const items = this.getHomeItems();
    let newIdx = this.selectedIndex + dir;
    if (newIdx < 0) newIdx = items.length - 1;
    if (newIdx >= items.length) newIdx = 0;

    this.selectedIndex = newIdx;
    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      ArcadeStorage.set(ArcadeStorage.KEYS.LAST_SELECTED, selectedItem.id);
      ArcadeHardware.pulseStorage();
    }
    ArcadeAudio.playTick();
    this.renderHome();
    ArcadeHardware.updateOled(this.state);
  },

  routeTo(routeState, bypass = false) {
    if (this.checkUnsavedChanges(() => this.routeTo(routeState, true), bypass)) return;
    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }
    this.launchPending = false;

    // Validate that route has a handler or falls back safely
    if (!SYSTEM_ROUTES[routeState]) {
      console.warn(`ArcadeOS Development Warning: Route "${routeState}" has no registered handler in SYSTEM_ROUTES manifest!`);
      this.goHome();
      return;
    }

    // Save stable selection ID in-memory before navigating away from HOME
    const homeItems = this.getHomeItems();
    const activeItem = homeItems[this.selectedIndex];
    if (activeItem) {
      lastHomeLauncherItemId = activeItem.id;
    }

    this.openSystemRoute(routeState);
  },

  async openSystemRoute(routeState) {
    const routeCfg = SYSTEM_ROUTES[routeState];
    if (!routeCfg) {
      console.warn(`ArcadeOS Development Warning: Route "${routeState}" not found in manifest!`);
      this.goHome();
      return;
    }

    if (this.bootTimer) {
      clearTimeout(this.bootTimer);
      this.bootTimer = null;
      document.querySelector('.boot-loader')?.classList.add('is-hidden');
      const osLayer = document.getElementById('arcade-os');
      if (osLayer) {
        osLayer.style.opacity = '1';
        osLayer.classList.add('os-booted');
      }
      ArcadeStorage.set(ArcadeStorage.KEYS.BOOT_COMPLETE, true);
    }

    const requestId = ++this.systemRouteRequestId;
    const view = document.getElementById('arcade-app-view');
    if (!view) return;

    // Acknowledge target route states
    this.state = routeState;
    this.setRouteStatus(`LOADING ${routeCfg.title}`);
    ArcadeHardware.setState(routeState);
    ArcadeAudio.playSelect();
    document.getElementById('arcade-home').classList.remove('active');

    // Set status and display loading screen
    view.setAttribute('data-route-status', 'loading');
    view.innerHTML = `
      <div class="sys-app route-loading-state" style="display:flex; align-items:center; justify-content:center; height:100%;">
        <div class="loading-label" style="font-size:12px; font-weight:bold; color:var(--machine-accent, #35d0ba); text-transform:uppercase;">LOADING ${routeCfg.title}...</div>
      </div>
    `;
    view.classList.add('active');

    try {
      let engine = null;
      if (routeCfg.isLazy) {
        // Tag route listeners registered during loader sequence
        ArcadeEventBus.currentOwner = { owner: 'route', ownerId: routeState };
        const module = await routeCfg.loader();
        engine = module[routeCfg.moduleName];
        ArcadeEventBus.currentOwner = null;

        // Globally cache successful loader results
        if (routeCfg.moduleName && !window[routeCfg.moduleName]) {
          window[routeCfg.moduleName] = engine;
          if (typeof engine.init === 'function') {
            engine.init();
          }
        }
      } else {
        engine = this;
      }

      // Check route request race condition
      if (requestId !== this.systemRouteRequestId) {
        if (window.ARCADE_DEBUG) {
          console.warn(`[ArcadeOS Debug] Aborting route mount: requestId mismatch for ${routeState}`);
        }
        return;
      }

      // Render route view content
      view.innerHTML = '';

      // Tag events specifically registered in the render phase
      ArcadeEventBus.currentOwner = { owner: 'route', ownerId: routeState };
      routeCfg.render(view, engine);
      ArcadeEventBus.currentOwner = null;

      // Await render microtasks completion
      await new Promise(resolve => setTimeout(resolve, 50));

      if (requestId !== this.systemRouteRequestId) return;

      // Route readiness includes the shared input/focus controller.
      await this.ensureSystemUI();
      if (requestId !== this.systemRouteRequestId) return;
      window.ArcadeSystemUI.mountRoute(routeState, view);
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();

      // Update hardware
      ArcadeHardware.updateOled(routeState);

      // Set route status ready
      view.setAttribute('data-route-status', 'ready');
      this.setRouteStatus(routeCfg.title);

      if (window.ARCADE_DEBUG) {
        console.log(`[ArcadeOS Debug] Route successfully opened and mounted: ${routeState}`);
        console.log(`[ArcadeOS Debug] Focusable count: ${window.ArcadeSystemUI ? window.ArcadeSystemUI.focusableElements.length : 0}`);
      }

    } catch (err) {
      console.error(`[ArcadeOS Debug] Error opening route: ${routeState}`, err);
      view.setAttribute('data-route-status', 'error');
      this.setRouteStatus(`${routeCfg.title} ERROR`);
      view.innerHTML = `
        <div class="sys-app error-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; padding:20px; box-sizing:border-box; text-align:center;">
          <h2 style="color:#ef4444; margin:0;">SYSTEM ERROR</h2>
          <p style="font-size:9px; opacity:0.8; margin:0;">Failed to load module for route "${routeCfg.title}".</p>
          <p class="error-details" style="font-size:8px; opacity:0.5; max-width:80%; word-break:break-all; margin:0;">${err.message}</p>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="sys-btn" id="error-retry-btn" data-arcade-focusable data-arcade-action="retry">RETRY</button>
            <button class="sys-btn" id="error-home-btn" data-arcade-focusable data-arcade-action="home">RETURN HOME</button>
          </div>
        </div>
      `;
      if (window.ArcadeSystemUI) {
        window.ArcadeSystemUI.mountRoute(routeState, view);
        window.ArcadeSystemUI.refreshFocusableElements();
        window.ArcadeSystemUI.focusFirst();
      }
      view.querySelector('#error-retry-btn')?.addEventListener('click', () => this.openSystemRoute(routeState));
      view.querySelector('#error-home-btn')?.addEventListener('click', () => this.goHome());
    }
  },

  closeSystemRoute() {
    if (window.ARCADE_DEBUG) console.log(`[ArcadeOS Debug] Exiting system route from ${this.state}`);

    const closingRoute = this.state;
    const closingCfg = SYSTEM_ROUTES[closingRoute];
    const closingEngine = closingCfg && closingCfg.moduleName ? window[closingCfg.moduleName] : null;
    if (closingEngine && typeof closingEngine.destroy === 'function') {
      try {
        closingEngine.destroy();
      } catch (err) {
        console.warn(`Route teardown failed for ${closingRoute}`, err);
      }
    }

    // Clear route-local event listeners registered on event bus
    ArcadeEventBus.clearRouteListeners(closingRoute);

    // Cancel active confirm modals
    const modal = document.getElementById('arcade-confirm-modal');
    if (modal) modal.classList.remove('active');

    // Exit editing modes and unmount from System UI focus controller
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.clearEditingMode();
      window.ArcadeSystemUI.unmountRoute();
    }

    // Clean up DOM view container
    const appView = document.getElementById('arcade-app-view');
    if (appView) {
      appView.classList.remove('active');
      appView.innerHTML = '';
      appView.removeAttribute('data-route-status');
    }

    const loadingView = document.getElementById('arcade-loading');
    if (loadingView) loadingView.classList.remove('active');

    const homeView = document.getElementById('arcade-home');
    if (homeView) homeView.classList.add('active');

    this.state = 'HOME';
    this.setRouteStatus('HOME');
    ArcadeHardware.setState('HOME');

    // Recover selection focus to stable ID (Correction 1)
    const homeItems = this.getHomeItems();
    let targetIndex = -1;
    if (lastHomeLauncherItemId) {
      targetIndex = homeItems.findIndex(item => item.id === lastHomeLauncherItemId);
    }
    if (targetIndex === -1) {
      targetIndex = Math.max(0, Math.min(this.selectedIndex, homeItems.length - 1));
    }
    this.selectedIndex = targetIndex;

    ArcadeAudio.playBack();
    this.renderHome();

    // Query card element and verify connection
    if (lastHomeLauncherItemId) {
      const activeCard = document.querySelector(`.app-card[data-launcher-id="${lastHomeLauncherItemId}"]`);
      if (activeCard && activeCard.isConnected) {
        activeCard.focus({ preventScroll: true });
        if (window.ARCADE_DEBUG) {
          console.log(`[ArcadeOS] Restored selection focus to card element: ${lastHomeLauncherItemId}`);
        }
      }
    }
    ArcadeHardware.updateOled('HOME');
  },

  launchApp(id, bypass = false) {
    if (this.checkUnsavedChanges(() => this.launchApp(id, true), bypass)) return;
    if (this.launchPending || this.state !== 'HOME') return;

    const appConfig = ArcadeRegistry.getApp(id);
    if (!appConfig) return;

    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }

    this.launchPending = true;
    ArcadeAudio.playSelect();
    this.state = 'LOADING';
    this.setRouteStatus(`LOADING ${appConfig.title}`);
    ArcadeHardware.setState('LOADING');

    document.getElementById('arcade-home').classList.remove('active');
    document.getElementById('arcade-loading').classList.add('active');

    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    const delay = isMobile ? 100 : 800;

    this.launchTimeoutId = setTimeout(() => {
      this.launchTimeoutId = null;
      this.launchPending = false;
      document.getElementById('arcade-loading').classList.remove('active');
      document.getElementById('arcade-app-view').classList.add('active');

      this.state = 'APP';
      this.setRouteStatus(appConfig.title);

      try {
        const rawApp = new appConfig.component();
        // Decorate app metadata for marquee updates
        rawApp._rawAppTitle = appConfig.title;
        rawApp._rawAppId = appConfig.id;

        this.activeApp = this.createLifecycleAdapter(rawApp, id);

        const view = document.getElementById('arcade-app-view');
        view.innerHTML = '';

        this.activeApp.init(view, ArcadeEventBus, ArcadeStorage, ArcadeAudio);
        this.activeApp.mount();

        ArcadeHardware.setState('APP');

        this.sessionAccumulatedTime = 0;
        this.startPlaytimeSession(id);

        this.loadStatsEngine(statsEngine => {
          statsEngine.startSession(id);
        });

        ArcadeEventBus.emit('GAME_LAUNCHED', { id });
      } catch (e) {
        console.error('App Launch Failed', e);
        this.goHome();
      }
    }, delay);
  },

  createLifecycleAdapter(app, appId) {
    const adapter = {
      init(container, bus, storage, audio) {
        if (typeof app.init === 'function') {
          app.init(container, bus, storage, audio);
        }
      },
      mount() {
        if (typeof app.mount === 'function') {
          app.mount();
        }
        if (typeof app.restoreState === 'function') {
          try {
            const saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES);
            const savedState = saves ? saves[`state_${appId}`] : null;
            if (savedState) app.restoreState(savedState);
          } catch (err) {
            console.warn('Adapter: restoreState failed', err);
          }
        }
      },
      pause() {
        if (typeof app.pause === 'function') {
          app.pause();
        }
      },
      resume() {
        if (typeof app.resume === 'function') {
          app.resume();
        }
      },
      destroy() {
        if (typeof app.saveState === 'function') {
          try {
            const state = app.saveState();
            if (state) {
              window.ArcadeOS.saveGameState(appId, state);
            }
          } catch (err) {
            console.warn('Adapter: saveState failed', err);
          }
        }
        if (typeof app.destroy === 'function') {
          app.destroy();
        }
      },
      handleBack() {
        if (typeof app.handleBack === 'function') {
          app.handleBack();
        } else {
          ArcadeOS.goHome();
        }
      }
    };

    // Copy decorated metadata values
    adapter._rawAppTitle = app._rawAppTitle;
    adapter._rawAppId = app._rawAppId;
    return adapter;
  },

  goHome(bypass = false) {
    if (this.checkUnsavedChanges(() => this.goHome(true), bypass)) return;
    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }
    this.launchPending = false;

    if (this.state === 'LOADING') {
      const appView = document.getElementById('arcade-app-view');
      const loadingView = document.getElementById('arcade-loading');
      const homeView = document.getElementById('arcade-home');
      if (appView) { appView.classList.remove('active'); appView.innerHTML = ''; }
      if (loadingView) loadingView.classList.remove('active');
      if (homeView) homeView.classList.add('active');
      this.state = 'HOME';
      this.setRouteStatus('HOME');
      ArcadeHardware.setState('HOME');
      this.renderHome();
      return;
    }

    if (this.state === 'APP') {
      const activeAppId = this.activeApp ? this.activeApp._rawAppId : null;
      ArcadeAudio.playBack();
      if (this.activeApp) {
        try {
          this.stopPlaytimeSession();
          this.activeApp.destroy();
        } catch(e) {
          console.error('App Destroy Failed', e);
        }
        this.activeApp = null;
      }

      if (activeAppId) {
        ArcadeEventBus.clearAppListeners(activeAppId);
      }

      const appView = document.getElementById('arcade-app-view');
      if (appView) {
        appView.classList.remove('active');
        appView.innerHTML = '';
      }
      const homeView = document.getElementById('arcade-home');
      if (homeView) homeView.classList.add('active');

      this.state = 'HOME';
      this.setRouteStatus('HOME');
      ArcadeHardware.setState('HOME');
      this.renderHome();
      return;
    }

    // Default system route exit
    this.closeSystemRoute();
  },

  forceGoHome(bypass = false) {
    if (this.checkUnsavedChanges(() => this.forceGoHome(true), bypass)) return;
    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }
    this.launchPending = false;

    if (this.activeApp) {
      const activeAppId = this.activeApp._rawAppId;
      try {
        this.stopPlaytimeSession();
        this.activeApp.destroy();
      } catch(e) {
        console.error('App Force Destroy Failed', e);
      }
      this.activeApp = null;
      if (activeAppId) {
        ArcadeEventBus.clearAppListeners(activeAppId);
      }
    }

    ArcadeHardware.clearAllTimers();

    // Close system routes
    this.closeSystemRoute();
  },

  startPlaytimeSession(appId) {
    this.sessionAppId = appId;
    this.sessionStartTime = performance.now();
    this.sessionAccumulatedTime = 0;
  },

  pausePlaytimeSession() {
    if (this.sessionStartTime) {
      const elapsed = (performance.now() - this.sessionStartTime) / 1000;
      this.sessionAccumulatedTime += elapsed;
      this.sessionStartTime = null;
    }
  },

  resumePlaytimeSession() {
    if (this.sessionAppId && !this.sessionStartTime) {
      this.sessionStartTime = performance.now();
    }
  },

  stopPlaytimeSession() {
    this.pausePlaytimeSession();
    if (this.sessionAppId) {
      this.loadStatsEngine(statsEngine => {
        statsEngine.endSession('completed');
      });
    }
    this.sessionAppId = null;
    this.sessionStartTime = null;
    this.sessionAccumulatedTime = 0;
  },

  loadStatsEngine(callback) {
    if (window.ArcadeStats) {
      if (callback) callback(window.ArcadeStats);
      return;
    }
    window.ArcadeModuleLoader.import('./modules/arcade-stats.js').then(module => {
      window.ArcadeStats = module.ArcadeStats;
      window.ArcadeStats.init();
      if (callback) callback(window.ArcadeStats);
    }).catch(err => {
      console.error("Failed to load stats engine dynamically", err);
    });
  },

  loadAchievementsEngine(callback) {
    if (window.ArcadeAchievements) {
      if (callback) callback(window.ArcadeAchievements);
      return;
    }
    window.ArcadeModuleLoader.import('./modules/arcade-achievements.js').then(module => {
      window.ArcadeAchievements = module.ArcadeAchievements;
      window.ArcadeAchievements.init();
      if (callback) callback(window.ArcadeAchievements);
    }).catch(err => {
      console.error("Failed to load achievements engine dynamically", err);
    });
  },

  loadResetSafetyEngine(callback) {
    if (window.ArcadeResetSafety) {
      if (callback) callback(window.ArcadeResetSafety);
      return;
    }
    window.ArcadeModuleLoader.import('./modules/arcade-reset-safety.js').then(module => {
      window.ArcadeResetSafety = module.ArcadeResetSafety;
      if (callback) callback(window.ArcadeResetSafety);
    }).catch(err => {
      console.error("Failed to load reset safety engine dynamically", err);
    });
  },

  renderSettings(view) {
    const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {};
    const stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS) || {};

    view.innerHTML = `
      <div class="sys-app settings-app">
        <div class="sys-header">
          <h2>SYSTEM SETTINGS</h2>
          <button class="sys-back-btn" id="settings-back-btn" data-arcade-focusable data-arcade-action="back">BACK (ESC)</button>
        </div>
        <div class="settings-content">
          <div class="settings-group">
            <h3>DISPLAY</h3>
            <div class="setting-item">
              <label for="setting-brightness">Brightness</label>
              <input type="range" id="setting-brightness" min="0.25" max="1.0" step="0.05" value="${settings.brightness}" data-arcade-focusable data-arcade-control="range" data-arcade-value="brightness">
              <span id="val-brightness">${Math.round(settings.brightness * 100)}%</span>
            </div>
            <div class="setting-item">
              <label for="setting-glow">Cabinet Glow</label>
              <input type="range" id="setting-glow" min="0.0" max="1.0" step="0.05" value="${settings.glow}" data-arcade-focusable data-arcade-control="range" data-arcade-value="glow">
              <span id="val-glow">${Math.round(settings.glow * 100)}%</span>
            </div>
          </div>
          <div class="settings-group">
            <h3>AUDIO</h3>
            <div class="setting-item">
              <label for="setting-volume">Master Volume</label>
              <input type="range" id="setting-volume" min="0.0" max="1.0" step="0.05" value="${settings.volume}" data-arcade-focusable data-arcade-control="range" data-arcade-value="volume">
              <span id="val-volume">${Math.round(settings.volume * 100)}%</span>
            </div>
            <div class="setting-item">
              <label>Audio Enabled</label>
              <button id="setting-audio-toggle" class="sys-btn" data-arcade-focusable data-arcade-action="audio-toggle">${settings.soundEnabled ? 'ENABLED' : 'MUTED'}</button>
            </div>
          </div>
          <div class="settings-group">
            <h3>COIN SYSTEM</h3>
            <div class="setting-item">
              <label>Current Credits</label>
              <span id="val-credits">${stats.currentCredits || 0} CREDITS</span>
            </div>
            <button id="setting-reset-credits-btn" class="sys-btn" data-arcade-focusable data-arcade-action="reset-credits">RESET CREDITS</button>
          </div>
          <div class="settings-group">
            <h3>BACKUP / RESET SAFETY</h3>
            <button id="setting-replay-onboarding-btn" class="sys-btn" data-arcade-focusable data-arcade-action="replay-onboarding">REPLAY CONTROL GUIDE</button>
            <button id="setting-replay-boot-btn" class="sys-btn" data-arcade-focusable data-arcade-action="replay-boot">REPLAY BOOT SEQUENCE</button>
            <button id="setting-backup-btn" class="sys-btn" data-arcade-focusable data-arcade-action="backup-export">EXPORT MACHINE BACKUP</button>
            <button id="setting-reset-sound-btn" class="sys-btn" data-arcade-focusable data-arcade-action="reset-sound-profile">RESET SOUND PROFILE</button>
            <button id="setting-reset-history-btn" class="sys-btn" data-arcade-focusable data-arcade-action="clear-session-history">CLEAR SESSION HISTORY</button>
            <button id="setting-reset-records-btn" class="sys-btn danger-btn" data-arcade-focusable data-arcade-action="reset-game-records">RESET PER-GAME RECORDS</button>
            <button id="setting-reset-stats-btn" class="sys-btn danger-btn" data-arcade-focusable data-arcade-action="reset-aggregate-stats">RESET AGGREGATE STATS</button>
            <button id="setting-reset-btn" class="sys-btn danger-btn" data-arcade-focusable data-arcade-action="full-machine-reset">FULL MACHINE RESET</button>
          </div>
        </div>
      </div>
    `;

    view.querySelector('#settings-back-btn').addEventListener('click', () => this.goHome());

    const bSlider = view.querySelector('#setting-brightness');
    bSlider.addEventListener('input', () => {
      settings.brightness = parseFloat(bSlider.value);
      view.querySelector('#val-brightness').textContent = `${Math.round(settings.brightness * 100)}%`;
      this.saveSettings(settings);
      this.applyHardwareEffects();
    });

    const gSlider = view.querySelector('#setting-glow');
    gSlider.addEventListener('input', () => {
      settings.glow = parseFloat(gSlider.value);
      view.querySelector('#val-glow').textContent = `${Math.round(settings.glow * 100)}%`;
      this.saveSettings(settings);
      this.applyHardwareEffects();
    });

    const vSlider = view.querySelector('#setting-volume');
    vSlider.addEventListener('input', () => {
      settings.volume = parseFloat(vSlider.value);
      view.querySelector('#val-volume').textContent = `${Math.round(settings.volume * 100)}%`;
      if (settings.volume > 0 && !settings.soundEnabled) {
        settings.soundEnabled = true;
        view.querySelector('#setting-audio-toggle').textContent = 'ENABLED';
      }
      this.saveSettings(settings);
      ArcadeAudio.setMasterVolume(settings.volume);
      this.applyHardwareEffects();
    });

    const aBtn = view.querySelector('#setting-audio-toggle');
    aBtn.addEventListener('click', () => {
      settings.soundEnabled = !settings.soundEnabled;
      aBtn.textContent = settings.soundEnabled ? 'ENABLED' : 'MUTED';
      this.saveSettings(settings);
      ArcadeAudio.setMuted(!settings.soundEnabled);
      this.applyHardwareEffects();
      const muteBtn = document.getElementById('os-mute-btn');
      if (muteBtn) muteBtn.textContent = settings.soundEnabled ? '🔊' : '🔇';
      ArcadeAudio.playTick();
    });

    view.querySelector('#setting-reset-credits-btn').addEventListener('click', () => {
      stats.currentCredits = 0;
      this.saveStats(stats);
      view.querySelector('#val-credits').textContent = '0 CREDITS';
      ArcadeAudio.playBack();
    });

    // Destructive backup/reset actions are delegated through the central container
    // handler so keyboard, cabinet, and pointer activation all use one modal flow.
  },

  renderProfile(view) {
    view.innerHTML = '<div class="sys-app"><h2>LOADING PLAYER PROFILE...</h2></div>';
    this.loadAchievementsEngine(achievementsEngine => {
      // Reload on open (Correction 9)
      achievementsEngine.loadAndMigrate();

      this.loadStatsEngine(statsEngine => {
        // Reload on open (Correction 9)
        statsEngine.loadAndMigrate();

        const profile = ArcadeStorage.get(ArcadeStorage.KEYS.PROFILE) || {};
        const stats = statsEngine.data;
        const rankInfo = achievementsEngine.calculatePlayerRank();
        const unlockedList = achievementsEngine.getUnlocked();
        const achievementsCount = achievementsEngine.REGISTRY.length;
        const achievementsPct = Math.round((unlockedList.length / achievementsCount) * 100);

        const gameTitles = {
          reaction: "Reaction Test",
          snake: "Neon Snake",
          breakout: "Breakout",
          pixelpad: "Pixel Pad",
          palettelab: "Palette Lab"
        };
        const favGameName = gameTitles[stats.favoriteGameId] || "None Yet";

        const avatars = ['🕹️', '👽', '👾', '🚀', '⭐', '💀'];

        // Find recent achievement badge
        let recentBadgeHtml = '<span style="opacity:0.4;">None yet</span>';
        if (unlockedList.length > 0) {
          const sorted = Object.keys(achievementsEngine.data.unlocked).sort((a,b) => {
            return new Date(achievementsEngine.data.unlocked[b].unlockedAt) - new Date(achievementsEngine.data.unlocked[a].unlockedAt);
          });
          const newestId = sorted[0];
          const newestAch = achievementsEngine.REGISTRY.find(a => a.id === newestId);
          if (newestAch) {
            recentBadgeHtml = `<span title="${newestAch.desc}" style="background: rgba(53, 208, 186, 0.1); border: 1px solid rgba(53, 208, 186, 0.3); padding: 2px 4px; border-radius: 3px; font-size: 8px; color: var(--machine-accent, #35d0ba);">${newestAch.icon} ${newestAch.title}</span>`;
          }
        }

        // Find last session details
        let lastSessionHtml = '<span style="opacity:0.4;">No recent sessions</span>';
        if (stats.recentSessions && stats.recentSessions.length > 0) {
          const ls = stats.recentSessions[0];
          lastSessionHtml = `<span style="font-size:8px;">${gameTitles[ls.gameId] || ls.gameId} (${ls.durationSeconds}s, ${ls.result})</span>`;
        }

        // Get current cabinet preset theme
        const config = ArcadeStorage.get('arcade_machine_customization') || {};
        const activeTheme = config.activeTheme || 'Default';

        view.innerHTML = `
          <div class="sys-app profile-app" style="display:flex; flex-direction:column; height:100%;">
            <div class="sys-header" style="flex-shrink:0;">
              <h2>PLAYER PROFILE</h2>
              <button class="sys-back-btn" id="profile-back-btn" data-arcade-focusable data-arcade-action="back">BACK (ESC)</button>
            </div>

            <div class="profile-content" style="flex:1; display:flex; flex-direction:column; gap:8px; overflow-y:auto; max-height:220px; font-size:9px; padding:2px;">
              <div class="profile-card" style="display:flex; gap:10px; align-items:center; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
                <div class="profile-avatar" id="active-avatar" style="font-size:24px;">${profile.avatar}</div>
                <div class="profile-details" style="flex:1;">
                  <input type="text" id="profile-name-input" value="${profile.name}" class="sys-input" maxLength="12" style="font-size:10px; font-weight:bold; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:2px; padding:2px 4px; color:#fff; width:100px;" data-arcade-focusable data-arcade-control="text" data-arcade-value="name">
                  <p class="profile-help-text" style="font-size:7px; opacity:0.5; margin:4px 0 2px 0;">Click avatar below to change:</p>
                  <div class="avatar-selector" style="display:flex; gap:4px;">
                    ${avatars.map(av => `<span class="avatar-option ${av === profile.avatar ? 'active' : ''}" style="cursor:pointer; font-size:12px; padding:2px; border-radius:2px; border:1px solid transparent; transition:0.2s;" data-arcade-focusable data-arcade-action="avatar" data-arcade-value="${av}">${av}</span>`).join('')}
                  </div>
                </div>
              </div>

              <!-- Rank progress panel -->
              <div style="background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold;">
                  <span>ACTIVITY RANK:</span>
                  <span style="color:var(--machine-accent, #35d0ba);">${rankInfo.title.toUpperCase()}</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                  <div style="flex:1; background:rgba(255,255,255,0.1); height:4px; border-radius:2px;">
                    <div style="background:var(--machine-accent, #35d0ba); height:100%; width:${rankInfo.progress}%; border-radius:2px;"></div>
                  </div>
                  <span style="font-size:8px; opacity:0.6;">${rankInfo.progress}% to ${rankInfo.nextTitle} (${rankInfo.score} pts)</span>
                </div>
              </div>

              <!-- Quick Stats Details -->
              <div class="stats-panel" style="background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
                <table class="stats-table" style="width:100%; border-collapse:collapse;">
                  <tr style="height:18px; border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="opacity:0.6;">Favorite Game</td><td style="text-align:right; font-weight:bold;">${favGameName}</td></tr>
                  <tr style="height:18px; border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="opacity:0.6;">Cabinet Theme</td><td style="text-align:right; font-weight:bold; color:var(--machine-secondary,#ff365d);">${activeTheme}</td></tr>
                  <tr style="height:18px; border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="opacity:0.6;">Achievements Unlocked</td><td style="text-align:right; font-weight:bold;">${unlockedList.length} / ${achievementsCount} (${achievementsPct}%)</td></tr>
                  <tr style="height:18px; border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="opacity:0.6;">Recent Unlock</td><td style="text-align:right;">${recentBadgeHtml}</td></tr>
                  <tr style="height:18px;"><td style="opacity:0.6;">Last Played Session</td><td style="text-align:right; font-weight:bold;">${lastSessionHtml}</td></tr>
                </table>
              </div>
            </div>
          </div>
        `;

        view.querySelector('#profile-back-btn').addEventListener('click', () => this.goHome());

        const nameInput = view.querySelector('#profile-name-input');
        nameInput.addEventListener('change', () => {
          profile.name = nameInput.value.trim() || 'Player 1';
          this.saveProfile(profile);
        });

        view.querySelectorAll('.avatar-option').forEach(opt => {
          opt.addEventListener('click', () => {
            profile.avatar = opt.textContent;
            view.querySelector('#active-avatar').textContent = profile.avatar;
            view.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            this.saveProfile(profile);
            ArcadeAudio.playTick();
          });
        });
      });
    });
  },

  showConfirmModal(message, onConfirm, onCancel) {
    let modal = document.getElementById('arcade-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'arcade-confirm-modal';
      modal.className = 'confirm-modal';
      const os = document.getElementById('arcade-os');
      if (os) {
        os.appendChild(modal);
      } else {
        document.body.appendChild(modal);
      }
    }
    const isAlert = !onCancel;
    modal.innerHTML = `
      <div class="confirm-modal-box">
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          ${isAlert ? `
            <button id="modal-ok-btn" class="sys-btn active" data-arcade-focusable data-arcade-action="ok">OK</button>
          ` : `
            <button id="modal-confirm-btn" class="sys-btn danger-btn active" data-arcade-focusable data-arcade-action="confirm">CONFIRM</button>
            <button id="modal-cancel-btn" class="sys-btn" data-arcade-focusable data-arcade-action="cancel">CANCEL</button>
          `}
        </div>
      </div>
    `;
    modal.classList.add('active');
    if (window.ArcadeAudio) window.ArcadeAudio.playWarning();

    const close = () => {
      modal.classList.remove('active');
    };

    if (isAlert) {
      modal.querySelector('#modal-ok-btn').addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
      });
    } else {
      modal.querySelector('#modal-confirm-btn').addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
      });
      modal.querySelector('#modal-cancel-btn').addEventListener('click', () => {
        close();
        if (onCancel) onCancel();
      });
    }
  },

  checkUnsavedChanges(onConfirm, bypass = false) {
    if (!bypass && this.state === 'CUSTOMIZE' && window.ArcadeCustomizer && window.ArcadeCustomizer.isDirty()) {
      this.showConfirmModal("Unsaved machine builder changes will be lost. Discard and continue?", () => {
        if (window.ArcadeCustomizer) {
          window.ArcadeCustomizer.cancel();
        }
        onConfirm();
      }, () => {});
      return true; // Intercepted
    }
    return false; // Not intercepted
  }
};
