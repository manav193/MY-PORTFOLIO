/**
 * ARCADE OS PLATFORM
 * Core Architecture: Storage, EventBus, Registry, InputManager, Router
 */

// ============================================================================
// 1. STORAGE SYSTEM
// ============================================================================
const ArcadeStorage = {
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
  }
};

// ============================================================================
// 2. AUDIO ENGINE
// ============================================================================
const ArcadeAudio = {
  ctx: null,
  soundEnabled: ArcadeStorage.get('arcade_sound_enabled', false),
  
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
    ArcadeStorage.set('arcade_sound_enabled', this.soundEnabled);
    if (this.soundEnabled) {
      this.init();
    }
    return this.soundEnabled;
  },

  playTone(freq, type = 'sine', duration = 0.1, vol = 0.1) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
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

// ============================================================================
// 6. OS ROUTER & LIFECYCLE MANAGER
// ============================================================================
window.ArcadeOS = {
  activeApp: null,
  state: 'BOOT', // BOOT, HOME, LOADING, APP
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.container = document.getElementById('cabinet-screen');
    if (!this.container) return;
    
    ArcadeInput.init();
    this.registerCoreEvents();
    
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
      muteBtn.textContent = ArcadeAudio.soundEnabled ? '🔊' : '🔇';
      
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
    
    // Home Launcher State (loaded from arcade_last_selected)
    const lastSelectedId = ArcadeStorage.get('arcade_last_selected', 'reaction');
    const apps = ArcadeRegistry.getAll();
    const foundIdx = apps.findIndex(app => app.id === lastSelectedId);
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
  },
  
  registerCoreEvents() {
    ArcadeEventBus.on('ARCADE_BACK', () => {
      if (this.state === 'APP') {
        if (this.activeApp && typeof this.activeApp.handleBack === 'function') {
          this.activeApp.handleBack();
        } else {
          this.goHome();
        }
      }
    });
    
    ArcadeEventBus.on('ARCADE_CONFIRM', () => {
      if (this.state === 'HOME') {
        const apps = ArcadeRegistry.getAll();
        if (apps[this.selectedIndex]) {
          this.launchApp(apps[this.selectedIndex].id);
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
  
  boot() {
    this.init();
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
    }, 500);
  },
  
  renderHome() {
    const apps = ArcadeRegistry.getAll();
    const carousel = document.getElementById('home-carousel');
    const details = document.getElementById('home-details');
    if (!carousel || !details) return;
    
    if (this.selectedIndex >= apps.length) this.selectedIndex = 0;
    
    carousel.innerHTML = apps.map((app, idx) => `
      <div class="app-card ${idx === this.selectedIndex ? 'focused' : ''}" data-idx="${idx}">
        <div class="app-icon">${app.icon}</div>
      </div>
    `).join('');
    
    const activeApp = apps[this.selectedIndex];
    details.innerHTML = `
      <div class="app-category">${activeApp.category}</div>
      <h2 class="app-title">${activeApp.title}</h2>
      <p class="app-desc">${activeApp.description}</p>
      <div class="app-status-badge ${activeApp.status}">${activeApp.status.toUpperCase().replace('-', ' ')}</div>
      <div class="app-hint">Press ENTER, Start, or Tap to Open</div>
    `;
    
    // Focus tap support
    carousel.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(card.dataset.idx);
        if (idx === this.selectedIndex) {
          ArcadeEventBus.emit('ARCADE_CONFIRM');
        } else {
          this.selectedIndex = idx;
          const selectedApp = apps[this.selectedIndex];
          if (selectedApp) {
            ArcadeStorage.set('arcade_last_selected', selectedApp.id);
          }
          ArcadeAudio.playTick();
          this.renderHome();
        }
      });
    });
    
    // Carousel Translation (centering active item)
    const cardWidth = 70;
    const gap = 16;
    const offset = -(this.selectedIndex * (cardWidth + gap));
    carousel.style.transform = `translateX(${offset}px)`;
  },
  
  moveSelection(dir) {
    const apps = ArcadeRegistry.getAll();
    let newIdx = this.selectedIndex + dir;
    if (newIdx < 0) newIdx = apps.length - 1;
    if (newIdx >= apps.length) newIdx = 0;
    
    this.selectedIndex = newIdx;
    const selectedApp = apps[this.selectedIndex];
    if (selectedApp) {
      ArcadeStorage.set('arcade_last_selected', selectedApp.id);
    }
    ArcadeAudio.playTick();
    this.renderHome();
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
      this.activeApp = new appConfig.component();
      const view = document.getElementById('arcade-app-view');
      view.innerHTML = '';
      
      try {
        this.activeApp.init(view, ArcadeEventBus, ArcadeStorage, ArcadeAudio);
        this.activeApp.mount();
      } catch (e) {
        console.error('App Launch Failed', e);
        this.goHome();
      }
    }, delay);
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
      this.renderHome();
      return;
    }

    if (this.state !== 'APP') return;
    
    ArcadeAudio.playBack();
    
    if (this.activeApp) {
      try {
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
    this.renderHome();
  },
  
  /**
   * forceGoHome - Safe teardown callable from any OS state.
   * Used by intro.js scroll lifecycle when reverse-scrolling.
   * Does NOT emit events or play audio to avoid side effects during scroll.
   */
  forceGoHome() {
    if (this.launchTimeoutId) {
      clearTimeout(this.launchTimeoutId);
      this.launchTimeoutId = null;
    }
    this.launchPending = false;

    // Destroy active app if running
    if (this.activeApp) {
      try {
        this.activeApp.destroy();
      } catch(e) {
        console.error('App Force Destroy Failed', e);
      }
      this.activeApp = null;
    }
    
    // Reset event bus and re-register core OS events
    ArcadeEventBus.clearAll();
    
    // Reset all views
    const appView = document.getElementById('arcade-app-view');
    const loadingView = document.getElementById('arcade-loading');
    const homeView = document.getElementById('arcade-home');
    
    if (appView) { appView.classList.remove('active'); appView.innerHTML = ''; }
    if (loadingView) loadingView.classList.remove('active');
    if (homeView) homeView.classList.add('active');
    
    this.state = 'HOME';
    this.renderHome();
  }
};
