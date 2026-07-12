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
    LAST_SELECTED: 'arcade_last_selected'
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
  soundEnabled: (ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {}).soundEnabled || false,
  
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {};
    settings.soundEnabled = this.soundEnabled;
    if (this.soundEnabled && settings.volume === 0) {
      settings.volume = 0.5; // restore normal volume
    }
    ArcadeStorage.set(ArcadeStorage.KEYS.SETTINGS, settings);
    if (this.soundEnabled) {
      this.init();
    }
    return this.soundEnabled;
  },

  playTone(freq, type = 'sine', duration = 0.1, vol = 0.1) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {};
      const masterVol = typeof settings.volume === 'number' ? settings.volume : 1.0;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol * masterVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) {}
  },
  
  playTick() { this.playTone(600, 'sine', 0.04, 0.05); },
  playSelect() { this.playTone(900, 'triangle', 0.12, 0.08); },
  playBack() { this.playTone(450, 'triangle', 0.1, 0.08); },
  playError() { this.playTone(180, 'sawtooth', 0.2, 0.1); }
};

// ============================================================================
// 3. EVENT BUS
// ============================================================================
const ArcadeEventBus = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  
  emit(event, data = null) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  },
  
  clearAll() {
    // Called when an app is destroyed to prevent memory leaks
    this.listeners = {};
    // Re-register core OS listeners
    ArcadeOS.registerCoreEvents();
  }
};

// ============================================================================
// 4. INPUT MANAGER
// ============================================================================
const ArcadeInput = {
  initialized: false,
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Keyboard Mapping
    document.addEventListener('keydown', (e) => {
      // Only process if OS is active (cabinet is scaled)
      const chassis = document.querySelector('.cabinet-chassis');
      if (!chassis || !chassis.classList.contains('is-scaled')) return;
      
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
      if (e.key === 'Escape' && smallBtns.length >= 2) {
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
    if (state === 'HOME') {
      this.marqueeText.textContent = 'A R C A D E';
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
    let stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS) || {};
    stats.currentCredits = (stats.currentCredits || 0) + 1;
    stats.lifetimeCoinInserts = (stats.lifetimeCoinInserts || 0) + 1;
    
    // Call saveStats to persist and pulse the Storage LED explicitly!
    ArcadeOS.saveStats(stats);

    // 5. Emit COIN_INSERTED event and check achievements
    ArcadeEventBus.emit('COIN_INSERTED', stats);
  }
};

window.ArcadeHardware = ArcadeHardware;

// Expose synthetics on ArcadeAudio
ArcadeAudio.playCoinInsert = function() {
  this.playTone(987.77, 'sine', 0.06, 0.08);
  setTimeout(() => this.playTone(1318.51, 'sine', 0.18, 0.1), 60);
};
ArcadeAudio.playAchievementUnlock = function() {
  this.playTone(523.25, 'triangle', 0.08, 0.08);
  setTimeout(() => this.playTone(659.25, 'triangle', 0.08, 0.08), 60);
  setTimeout(() => this.playTone(783.99, 'triangle', 0.08, 0.08), 120);
  setTimeout(() => this.playTone(1046.50, 'triangle', 0.25, 0.1), 180);
};
ArcadeAudio.playWarning = function() {
  this.playTone(220, 'sawtooth', 0.25, 0.12);
};

// ============================================================================
// 6. OS ROUTER & LIFECYCLE MANAGER
// ============================================================================
window.ArcadeOS = {
  activeApp: null,
  state: 'BOOT', // BOOT, HOME, SETTINGS, PROFILE, ACHIEVEMENTS, LOADING, APP
  osVisible: false,
  
  ACHIEVEMENTS_REGISTRY: [
    { id: 'first_boot', title: 'First Boot', desc: 'Welcome to the Grid.', icon: '🖥️' },
    { id: 'first_coin', title: 'Insert Coin', desc: 'Insert your first arcade coin credit.', icon: '🪙' },
    { id: 'first_game', title: 'First Game', desc: 'Launch any game or creative tool.', icon: '🎮' },
    { id: 'reaction_rookie', title: 'Reaction Rookie', desc: 'Complete a reaction test.', icon: '⚡' },
    { id: 'reaction_master', title: 'Reaction Master', desc: 'Achieve a score under 200ms.', icon: '⚡' },
    { id: 'snake_survivor', title: 'Snake Survivor', desc: 'Score 15 points or more in Neon Snake.', icon: '🐍' },
    { id: 'breakout_beginner', title: 'Breakout Beginner', desc: 'Score 500 points in Breakout.', icon: '🔵' },
    { id: 'breakout_champion', title: 'Breakout Champion', desc: 'Clear a level in Breakout.', icon: '🏆' },
    { id: 'pixel_artist', title: 'Pixel Artist', desc: 'Save a canvas sketch in Pixel Pad.', icon: '🎨' },
    { id: 'palette_explorer', title: 'Palette Explorer', desc: 'Export a color scheme in Palette Lab.', icon: '🧪' },
    { id: 'arcade_regular', title: 'Arcade Regular', desc: 'Play 5 games in total.', icon: '👾' },
    { id: 'playtime_veteran', title: 'Playtime Veteran', desc: 'Accumulate 5 minutes of total playtime.', icon: '⏱️' }
  ],

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
    
    // Build Base OS HTML Structure strictly utilizing requested IDs
    const ui = document.createElement('div');
    ui.id = 'arcade-os';
    ui.innerHTML = `
      <div id="arcade-status-bar">
        <span class="os-brand">ARCADE OS</span>
        <span class="os-status">SYS: ONLINE</span>
        <div class="os-sys-info">
          <span id="os-time">00:00</span>
          <span id="os-mute-btn" class="os-icon" tabindex="0" role="button" aria-label="Toggle Sound">🔇</span>
        </div>
      </div>
      
      <div id="arcade-home" class="os-view">
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
        <span class="footer-control-item"><span class="key-cap">▲▼◀▶</span> NAVIGATE</span>
        <span class="footer-control-item"><span class="key-cap">ENTER</span> OPEN</span>
        <span class="footer-control-item"><span class="key-cap">ESC</span> BACK</span>
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
      muteBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleHandler(e);
        }
      });
    }
    
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
    
    // Home Launcher State (loaded from last_selected)
    const lastSelectedId = ArcadeStorage.get(ArcadeStorage.KEYS.LAST_SELECTED, 'reaction');
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
  },
  
  registerCoreEvents() {
    ArcadeEventBus.on('ARCADE_BACK', () => {
      if (this.state === 'APP') {
        if (this.activeApp && typeof this.activeApp.handleBack === 'function') {
          this.activeApp.handleBack();
        } else {
          this.goHome();
        }
      } else if (['SETTINGS', 'PROFILE', 'ACHIEVEMENTS'].includes(this.state)) {
        this.goHome();
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
    if (event === 'GAME_LAUNCHED' && data?.id === 'os') {
      this.unlockAchievement('first_boot');
    }
    
    if (event === 'GAME_LAUNCHED' && data?.id && data.id !== 'os') {
      this.unlockAchievement('first_game');
    }
    
    if (event === 'COIN_INSERTED') {
      this.unlockAchievement('first_coin');
    }
    
    if (event === 'REACTION_SCORE' && data?.score) {
      this.unlockAchievement('reaction_rookie');
      if (data.score < 200) {
        this.unlockAchievement('reaction_master');
      }
      
      this.saveGameState('reaction_best', data.score);
      localStorage.setItem('reaction_best', data.score);
    }
    
    if (event === 'SNAKE_SCORE' && typeof data?.score === 'number') {
      if (data.score >= 15) {
        this.unlockAchievement('snake_survivor');
      }
      let saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES) || {};
      if (data.score > (saves.snake_best || 0)) {
        this.saveGameState('snake_best', data.score);
      }
      localStorage.setItem('arcade_snake_best', data.score);
    }
    
    if (event === 'BREAKOUT_SCORE' && typeof data?.score === 'number') {
      if (data.score >= 500) {
        this.unlockAchievement('breakout_beginner');
      }
      let saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES) || {};
      if (data.score > (saves.breakout_best || 0)) {
        this.saveGameState('breakout_best', data.score);
      }
      localStorage.setItem('arcade_breakout_best', data.score);
    }
    
    if (event === 'GAME_COMPLETED' && data?.id === 'breakout') {
      this.unlockAchievement('breakout_champion');
    }
    
    if (event === 'PIXELPAD_SAVED') {
      this.unlockAchievement('pixel_artist');
    }
    
    if (event === 'PALETTE_EXPORTED') {
      this.unlockAchievement('palette_explorer');
    }
    
    if (event === 'PLAYTIME_UPDATED') {
      const stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS);
      if (stats && stats.totalPlaytime >= 300) {
        this.unlockAchievement('playtime_veteran');
      }
    }
    
    const stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS);
    if (stats && stats.launches) {
      let sum = 0;
      Object.keys(stats.launches).forEach(k => sum += stats.launches[k]);
      if (sum >= 5) {
        this.unlockAchievement('arcade_regular');
      }
    }
  },

  unlockAchievement(id) {
    let achState = ArcadeStorage.get(ArcadeStorage.KEYS.ACHIEVEMENTS);
    if (!achState) return;
    
    if (achState.unlocked.includes(id)) return;
    
    achState.unlocked.push(id);
    this.saveAchievements(achState);
    
    const achievement = this.ACHIEVEMENTS_REGISTRY.find(a => a.id === id);
    if (achievement) {
      this.showToast(achievement);
      // Play achievement synth sound
      ArcadeAudio.playAchievementUnlock();
    }
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
  
  boot() {
    this.init();
    ArcadeHardware.setState('BOOT');
    this.renderHome();
    
    setTimeout(() => {
      const bootLoader = document.querySelector('.boot-loader');
      if (bootLoader) bootLoader.classList.add('is-hidden');
      
      const osLayer = document.getElementById('arcade-os');
      const homeView = document.getElementById('arcade-home');
      if (osLayer) {
        osLayer.style.opacity = '1';
        osLayer.classList.add('os-booted');
      }
      if (homeView) {
        homeView.classList.add('active');
      }
      this.state = 'HOME';
      ArcadeHardware.setState('HOME');
      
      // Fire first boot event trigger
      ArcadeEventBus.emit('GAME_LAUNCHED', { id: 'os' });
    }, 500);
  },
  
  getHomeItems() {
    const apps = ArcadeRegistry.getAll().map(a => ({ ...a, isSystem: false }));
    const systemItems = [
      { id: 'achievements', title: 'Achievements', category: 'SYSTEM', description: 'View unlocked trophies.', icon: '🏆', isSystem: true, route: 'ACHIEVEMENTS' },
      { id: 'settings', title: 'Settings', category: 'SYSTEM', description: 'Configure display, sound, and system settings.', icon: '⚙️', isSystem: true, route: 'SETTINGS' },
      { id: 'profile', title: 'Player Profile', category: 'SYSTEM', description: 'View stats and playtime summary.', icon: '👤', isSystem: true, route: 'PROFILE' }
    ];
    return [...apps, ...systemItems];
  },

  renderHome() {
    const items = this.getHomeItems();
    const carousel = document.getElementById('home-carousel');
    const details = document.getElementById('home-details');
    if (!carousel || !details) return;
    
    if (this.selectedIndex >= items.length) this.selectedIndex = 0;
    
    carousel.innerHTML = items.map((item, idx) => `
      <div class="app-card ${idx === this.selectedIndex ? 'focused' : ''} ${item.isSystem ? 'system-card' : ''}" data-idx="${idx}">
        <div class="app-icon">${item.icon}</div>
      </div>
    `).join('');
    
    const activeItem = items[this.selectedIndex];
    details.innerHTML = `
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
            ArcadeStorage.set(ArcadeStorage.KEYS.LAST_SELECTED, selectedItem.id);
            // Flash storage LED briefly on last_selected persist
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

  routeTo(routeState) {
    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }
    this.launchPending = false;
    
    this.state = routeState;
    ArcadeHardware.setState(routeState);
    ArcadeAudio.playSelect();
    
    document.getElementById('arcade-home').classList.remove('active');
    
    const view = document.getElementById('arcade-app-view');
    view.innerHTML = '';
    view.classList.add('active');
    
    if (routeState === 'SETTINGS') {
      this.renderSettings(view);
    } else if (routeState === 'PROFILE') {
      this.renderProfile(view);
    } else if (routeState === 'ACHIEVEMENTS') {
      this.renderAchievements(view);
    }
  },
  
  launchApp(id) {
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
        
        let stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS) || {};
        if (!stats.launches) stats.launches = {};
        stats.launches[id] = (stats.launches[id] || 0) + 1;
        this.saveStats(stats);
        
        this.sessionAccumulatedTime = 0;
        this.startPlaytimeSession(id);
        
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
  
  goHome() {
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
      ArcadeHardware.setState('HOME');
      this.renderHome();
      return;
    }

    if (['SETTINGS', 'PROFILE', 'ACHIEVEMENTS'].includes(this.state)) {
      ArcadeAudio.playBack();
      const appView = document.getElementById('arcade-app-view');
      const homeView = document.getElementById('arcade-home');
      if (appView) { appView.classList.remove('active'); appView.innerHTML = ''; }
      if (homeView) homeView.classList.add('active');
      this.state = 'HOME';
      ArcadeHardware.setState('HOME');
      this.renderHome();
      return;
    }

    if (this.state !== 'APP') return;
    
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
    
    ArcadeEventBus.clearAll();
    document.getElementById('arcade-app-view').innerHTML = '';
    
    document.getElementById('arcade-app-view').classList.remove('active');
    document.getElementById('arcade-home').classList.add('active');
    this.state = 'HOME';
    ArcadeHardware.setState('HOME');
    this.renderHome();
  },
  
  forceGoHome() {
    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }
    this.launchPending = false;

    if (this.activeApp) {
      try {
        this.stopPlaytimeSession();
        this.activeApp.destroy();
      } catch(e) {
        console.error('App Force Destroy Failed', e);
      }
      this.activeApp = null;
    }
    
    ArcadeEventBus.clearAll();
    ArcadeHardware.clearAllTimers();
    
    const appView = document.getElementById('arcade-app-view');
    const loadingView = document.getElementById('arcade-loading');
    const homeView = document.getElementById('arcade-home');
    
    if (appView) { appView.classList.remove('active'); appView.innerHTML = ''; }
    if (loadingView) loadingView.classList.remove('active');
    if (homeView) homeView.classList.add('active');
    
    this.state = 'HOME';
    ArcadeHardware.setState('HOME');
    this.renderHome();
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
    
    if (this.sessionAppId && this.sessionAccumulatedTime > 0) {
      let stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS);
      if (stats) {
        stats.totalPlaytime = (stats.totalPlaytime || 0) + this.sessionAccumulatedTime;
        if (!stats.playtimes) stats.playtimes = {};
        stats.playtimes[this.sessionAppId] = (stats.playtimes[this.sessionAppId] || 0) + this.sessionAccumulatedTime;
        this.saveStats(stats);
        
        ArcadeEventBus.emit('PLAYTIME_UPDATED', { totalPlaytime: stats.totalPlaytime });
      }
    }
    
    this.sessionAppId = null;
    this.sessionStartTime = null;
    this.sessionAccumulatedTime = 0;
  },

  renderSettings(view) {
    const settings = ArcadeStorage.get(ArcadeStorage.KEYS.SETTINGS) || {};
    const stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS) || {};
    
    view.innerHTML = `
      <div class="sys-app settings-app">
        <div class="sys-header">
          <h2>SYSTEM SETTINGS</h2>
          <button class="sys-back-btn" id="settings-back-btn">BACK (ESC)</button>
        </div>
        <div class="settings-content">
          <div class="settings-group">
            <h3>DISPLAY</h3>
            <div class="setting-item">
              <label for="setting-brightness">Brightness</label>
              <input type="range" id="setting-brightness" min="0.25" max="1.0" step="0.05" value="${settings.brightness}">
              <span id="val-brightness">${Math.round(settings.brightness * 100)}%</span>
            </div>
            <div class="setting-item">
              <label for="setting-glow">Cabinet Glow</label>
              <input type="range" id="setting-glow" min="0.0" max="1.0" step="0.05" value="${settings.glow}">
              <span id="val-glow">${Math.round(settings.glow * 100)}%</span>
            </div>
          </div>
          <div class="settings-group">
            <h3>AUDIO</h3>
            <div class="setting-item">
              <label for="setting-volume">Master Volume</label>
              <input type="range" id="setting-volume" min="0.0" max="1.0" step="0.05" value="${settings.volume}">
              <span id="val-volume">${Math.round(settings.volume * 100)}%</span>
            </div>
            <div class="setting-item">
              <label>Audio Enabled</label>
              <button id="setting-audio-toggle" class="sys-btn">${settings.soundEnabled ? 'ENABLED' : 'MUTED'}</button>
            </div>
          </div>
          <div class="settings-group">
            <h3>COIN SYSTEM</h3>
            <div class="setting-item">
              <label>Current Credits</label>
              <span id="val-credits">${stats.currentCredits || 0} CREDITS</span>
            </div>
            <button id="setting-reset-credits-btn" class="sys-btn">RESET CREDITS</button>
          </div>
          <div class="settings-group">
            <h3>SYSTEM RESET</h3>
            <button id="setting-reset-btn" class="sys-btn danger-btn">RESET MACHINE DATA</button>
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
      this.applyHardwareEffects();
    });
    
    const aBtn = view.querySelector('#setting-audio-toggle');
    aBtn.addEventListener('click', () => {
      settings.soundEnabled = !settings.soundEnabled;
      aBtn.textContent = settings.soundEnabled ? 'ENABLED' : 'MUTED';
      this.saveSettings(settings);
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
    
    view.querySelector('#setting-reset-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings, playtime stats, and achievements?')) {
        localStorage.removeItem(ArcadeStorage.KEYS.SETTINGS);
        localStorage.removeItem(ArcadeStorage.KEYS.STATS);
        localStorage.removeItem(ArcadeStorage.KEYS.ACHIEVEMENTS);
        localStorage.removeItem(ArcadeStorage.KEYS.PROFILE);
        localStorage.removeItem(ArcadeStorage.KEYS.SAVES);
        ArcadeStorage.init();
        this.applyHardwareEffects();
        alert('Machine reset successfully!');
        window.location.reload();
      }
    });
  },

  renderProfile(view) {
    const profile = ArcadeStorage.get(ArcadeStorage.KEYS.PROFILE) || {};
    const stats = ArcadeStorage.get(ArcadeStorage.KEYS.STATS) || {};
    const saves = ArcadeStorage.get(ArcadeStorage.KEYS.SAVES) || {};
    const achievements = ArcadeStorage.get(ArcadeStorage.KEYS.ACHIEVEMENTS) || { unlocked: [] };
    
    let totalLaunches = 0;
    if (stats.launches) {
      Object.keys(stats.launches).forEach(key => {
        totalLaunches += stats.launches[key];
      });
    }
    
    let favoriteGame = 'None';
    let maxLaunches = 0;
    if (stats.launches) {
      Object.keys(stats.launches).forEach(key => {
        if (stats.launches[key] > maxLaunches) {
          maxLaunches = stats.launches[key];
          const app = ArcadeRegistry.getApp(key);
          if (app) favoriteGame = app.title;
        }
      });
    }

    const playtimeMin = Math.floor((stats.totalPlaytime || 0) / 60);
    const playtimeSec = Math.floor((stats.totalPlaytime || 0) % 60);
    const avatars = ['🕹️', '👽', '👾', '🚀', '⭐', '💀'];

    view.innerHTML = `
      <div class="sys-app profile-app">
        <div class="sys-header">
          <h2>PLAYER PROFILE</h2>
          <button class="sys-back-btn" id="profile-back-btn">BACK (ESC)</button>
        </div>
        <div class="profile-content">
          <div class="profile-card">
            <div class="profile-avatar" id="active-avatar">${profile.avatar}</div>
            <div class="profile-details">
              <input type="text" id="profile-name-input" value="${profile.name}" class="sys-input" maxLength="12">
              <p class="profile-help-text">Click avatar below to change:</p>
              <div class="avatar-selector">
                ${avatars.map(av => `<span class="avatar-option ${av === profile.avatar ? 'active' : ''}">${av}</span>`).join('')}
              </div>
            </div>
          </div>
          
          <div class="stats-panel">
            <h3>STATISTICS</h3>
            <table class="stats-table">
              <tr><td>Total Playtime</td><td>${playtimeMin}m ${playtimeSec}s</td></tr>
              <tr><td>Game Launches</td><td>${totalLaunches} times</td></tr>
              <tr><td>Favorite Game</td><td>${favoriteGame}</td></tr>
              <tr><td>Reaction Best</td><td>${saves.reaction_best ? saves.reaction_best + ' ms' : 'N/A'}</td></tr>
              <tr><td>Snake High Score</td><td>${saves.snake_best || '0'} pts</td></tr>
              <tr><td>Breakout High Score</td><td>${saves.breakout_best || '0'} pts</td></tr>
              <tr><td>Achievements Unlocked</td><td>${achievements.unlocked.length} / ${this.ACHIEVEMENTS_REGISTRY.length}</td></tr>
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
  },

  renderAchievements(view) {
    const achState = ArcadeStorage.get(ArcadeStorage.KEYS.ACHIEVEMENTS) || { unlocked: [] };
    const unlockedList = achState.unlocked;

    view.innerHTML = `
      <div class="sys-app achievements-app">
        <div class="sys-header">
          <h2>ACHIEVEMENTS</h2>
          <button class="sys-back-btn" id="achievements-back-btn">BACK (ESC)</button>
        </div>
        <div class="achievements-content">
          <div class="achievements-grid">
            ${this.ACHIEVEMENTS_REGISTRY.map(ach => {
              const isUnlocked = unlockedList.includes(ach.id);
              return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                  <div class="ach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                  <div class="ach-details">
                    <div class="ach-title">${ach.title}</div>
                    <div class="ach-desc">${ach.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    view.querySelector('#achievements-back-btn').addEventListener('click', () => this.goHome());
  }
};
