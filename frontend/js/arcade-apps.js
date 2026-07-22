/**
 * ARCADE OS PLATFORM - APPLICATIONS
 * Includes: Reaction Test, Neon Snake, Breakout, Pixel Pad, Palette Lab
 */

// ============================================================================
// APP: REACTION TEST
// ============================================================================
class ReactionTestApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
    
    // Load persisted scores using standard keys
    this.bestScore = this.storage.get('arcade_reaction_best', null);
    this.latestScore = this.storage.get('arcade_reaction_latest', null);
    this.attempts = this.storage.get('arcade_reaction_attempts', 0);
    
    this.state = 'IDLE'; // IDLE, WAITING, READY, RESULT, FALSE_START
    this.timeoutId = null;
    this.readyTime = 0;
    this.active = false;
    this._lastInputTime = 0; // Dedup guard for double-fire prevention
    
    // Page Visibility listener
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
  
  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-reaction-test" id="reaction-test-game" tabindex="0">
        <!-- Aria-live region for accessibility -->
        <div id="rt-aria-announcer" class="sr-only" aria-live="assertive" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;"></div>
        
        <div id="rt-screen-content" class="rt-screen-idle">
          <!-- Rendered dynamically based on state -->
        </div>
      </div>
    `;
    
    this.gameArea = this.container.querySelector('#reaction-test-game');
    this.contentEl = this.container.querySelector('#rt-screen-content');
    this.announcer = this.container.querySelector('#rt-aria-announcer');
    
    // Focus game area for keyboard accessibility
    this.gameArea.focus({ preventScroll: true });

    // Centralized event listener bindings
    this.confirmHandler = () => this.handleInputConfirm();
    this.backHandler = () => this.handleInputBack();
    
    // Listen to ARCADE_CONFIRM and ARCADE_ACTION_A.
    // When physical Action A button is pressed, both events fire,
    // but the 80ms dedup guard in handleInputConfirm() prevents double-fire.
    this.bus.on('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.on('ARCADE_ACTION_A', this.confirmHandler);
    // NOTE: Do NOT register ARCADE_BACK here.
    // The OS core listener delegates ARCADE_BACK to activeApp.handleBack() already.
    // Registering it here would cause double-fire (OS calls handleBack, then bus fires again).
    this.bus.on('ARCADE_ACTION_B', this.backHandler);
    
    // Click / touch handler on game area (pointerdown with dedup)
    this.clickHandler = (e) => {
      // Only process if click target is not a button
      if (e.target.closest('#rt-back-btn') || e.target.closest('#rt-retry-btn') || e.target.closest('.rt-action-btn')) return;
      e.preventDefault();
      this.handleInputConfirm();
    };
    this.gameArea.addEventListener('pointerdown', this.clickHandler);
    this.gameArea.style.touchAction = 'manipulation'; // Prevent touch+click double-fire
    
    // Initial render
    this.transitionToState('IDLE');
  }

  handleVisibilityChange() {
    if (document.hidden && (this.state === 'WAITING' || this.state === 'READY')) {
      this.cancelTimeout();
      this.state = 'IDLE';
      this.announce('Test interrupted — restart required.');
      this.renderInterrupted();
    }
  }

  announce(text) {
    if (this.announcer) {
      this.announcer.textContent = text;
    }
  }

  cancelTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  transitionToState(nextState) {
    this.state = nextState;
    this.cancelTimeout();
    
    // Clear dynamic classes
    this.contentEl.className = `rt-screen-${nextState.toLowerCase()}`;
    
    if (nextState === 'IDLE') {
      this.announce('Reaction Test Launcher. Press action or click to start.');
      this.audio.playTick();
      this.contentEl.innerHTML = `
        <div class="rt-title-screen">
          <div class="rt-icon">⚡</div>
          <div class="rt-category">REFLEX / UTILITY</div>
          <h2 class="rt-heading">REACTION TEST</h2>
          <p class="rt-instructions">Press Action, Enter, or Click the screen to start. Wait for the screen to turn green, then press as fast as you can.</p>
          <p class="rt-instructions-compact">Wait for green, then press.</p>
          
          <div class="rt-scoreboard">
            <div class="rt-score-item">
              <span class="rt-score-label">BEST</span>
              <span class="rt-score-val">${this.bestScore ? Math.round(this.bestScore) + 'ms' : '--'}</span>
            </div>
            <div class="rt-score-item">
              <span class="rt-score-label">LATEST</span>
              <span class="rt-score-val">${this.latestScore ? Math.round(this.latestScore) + 'ms' : '--'}</span>
            </div>
            <div class="rt-score-item">
              <span class="rt-score-label">ATTEMPTS</span>
              <span class="rt-score-val">${this.attempts}</span>
            </div>
          </div>
          
          <button class="placeholder-back-btn" id="rt-back-btn" data-arcade-focusable>EXIT</button>
        </div>
      `;
    } 
    else if (nextState === 'WAITING') {
      this.announce('Wait for green.');
      // Play start sound (soft confirm tone)
      this.audio.playTone(330, 'sine', 0.12, 0.1);
      setTimeout(() => this.audio.playTone(440, 'sine', 0.12, 0.1), 80);
      
      this.contentEl.innerHTML = `
        <div class="rt-wait-screen">
          <div class="rt-wait-indicator"></div>
          <h2 class="rt-wait-msg">WAIT...</h2>
          <p class="rt-wait-tip">WAIT FOR GREEN</p>
        </div>
      `;
      
      // Randomized waiting delay between 1500ms and 4500ms
      const delay = 1500 + Math.random() * 3000;
      this.timeoutId = setTimeout(() => {
        this.transitionToState('READY');
      }, delay);
    } 
    else if (nextState === 'READY') {
      this.announce('NOW!');
      this.readyTime = performance.now();
      // Short high-frequency cue
      this.audio.playTone(880, 'square', 0.08, 0.08);
      
      this.contentEl.innerHTML = `
        <div class="rt-ready-screen">
          <h2 class="rt-ready-msg">NOW!</h2>
          <p class="rt-ready-tip">TAP SCREEN / PRESS ENTER / ACTION A</p>
        </div>
      `;
    } 
    else if (nextState === 'RESULT') {
      // Logic handled prior to transitionToState call
    } 
    else if (nextState === 'FALSE_START') {
      this.announce('Too early. Press Action or Click to retry.');
      // Low warning tone
      this.audio.playTone(150, 'sawtooth', 0.25, 0.12);
      
      this.contentEl.innerHTML = `
        <div class="rt-error-screen">
          <div class="rt-error-icon">⚠️</div>
          <h2 class="rt-error-msg">TOO EARLY!</h2>
          <p class="rt-error-tip">You pressed before the screen turned green.</p>
          <div class="rt-actions">
            <button class="rt-action-btn primary" id="rt-retry-btn" data-arcade-focusable>RETRY</button>
            <button class="rt-action-btn" id="rt-back-btn" data-arcade-focusable>LAUNCHER</button>
          </div>
        </div>
      `;
    }
    
    // Bind buttons in current screen
    const backBtn = this.contentEl.querySelector('#rt-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.bus.emit('ARCADE_BACK');
      });
    }
    const retryBtn = this.contentEl.querySelector('#rt-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.transitionToState('WAITING');
      });
    }
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
  }

  renderInterrupted() {
    this.contentEl.innerHTML = `
      <div class="rt-error-screen">
        <div class="rt-error-icon">⏱️</div>
        <h2 class="rt-error-msg">INTERRUPTED</h2>
        <p class="rt-error-tip">Test interrupted — tab focus was lost.</p>
        <button class="placeholder-back-btn" id="rt-back-btn" data-arcade-focusable>EXIT</button>
      </div>
    `;
    this.contentEl.querySelector('#rt-back-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.bus.emit('ARCADE_BACK');
    });
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
  }

  handleInputConfirm() {
    if (!this.active) return;
    
    // Dedup guard: prevent double-fire within 80ms
    const now = performance.now();
    if (now - this._lastInputTime < 80) return;
    this._lastInputTime = now;
    
    if (this.state === 'IDLE') {
      this.transitionToState('WAITING');
    } 
    else if (this.state === 'WAITING') {
      // Pressed too early!
      this.transitionToState('FALSE_START');
    } 
    else if (this.state === 'READY') {
      const reactionTime = performance.now() - this.readyTime;
      this.recordResult(reactionTime);
    } 
    else if (this.state === 'RESULT' || this.state === 'FALSE_START') {
      this.transitionToState('WAITING');
    }
  }

  handleBack() {
    // Called by ArcadeOS when ARCADE_BACK fires while this app is active.
    // This method is the app's single back-navigation entry point.
    if (!this.active) return;
    
    if (this.state === 'WAITING' || this.state === 'READY') {
      // Cancel in-progress test, return to idle
      this.transitionToState('IDLE');
    } else {
      // Exit app entirely — call ArcadeOS.goHome() directly
      // (Do NOT re-emit ARCADE_BACK to avoid infinite recursion)
      if (window.ArcadeOS) {
        window.ArcadeOS.goHome();
      }
    }
  }

  // Legacy alias (bus listeners call handleInputBack, OS calls handleBack)
  handleInputBack() {
    this.handleBack();
  }

  recordResult(reactionTime) {
    this.cancelTimeout();
    this.state = 'RESULT';
    this.attempts++;
    this.latestScore = reactionTime;
    
    let newBest = false;
    if (this.bestScore === null || reactionTime < this.bestScore) {
      this.bestScore = reactionTime;
      newBest = true;
      this.storage.set('arcade_reaction_best', this.bestScore);
    }
    this.storage.set('arcade_reaction_latest', this.latestScore);
    this.storage.set('arcade_reaction_attempts', this.attempts);
    this.bus.emit('REACTION_SCORE', { score: reactionTime });
    
    // Ratings
    let rating = '';
    if (reactionTime < 180) rating = 'Elite Reflexes';
    else if (reactionTime < 230) rating = 'Excellent';
    else if (reactionTime < 280) rating = 'Fast';
    else if (reactionTime < 350) rating = 'Average';
    else if (reactionTime < 450) rating = 'Slow';
    else rating = 'Try Again';
    
    this.announce(`Your reaction time is ${Math.round(reactionTime)} milliseconds. Rating: ${rating}`);
    
    // Sound - success/confirm tone
    if (newBest) {
      this.audio.playTone(523.25, 'sine', 0.1, 0.08); // C5
      setTimeout(() => this.audio.playTone(659.25, 'sine', 0.1, 0.08), 80); // E5
      setTimeout(() => this.audio.playTone(783.99, 'sine', 0.15, 0.08), 160); // G5
      setTimeout(() => this.audio.playTone(1046.50, 'sine', 0.25, 0.1), 240); // C6
    } else {
      this.audio.playTone(523.25, 'sine', 0.12, 0.08); // C5
      setTimeout(() => this.audio.playTone(659.25, 'sine', 0.18, 0.08), 80); // E5
    }

    // Achievement hooks
    this.triggerAchievementHooks(reactionTime);
    
    this.contentEl.className = 'rt-screen-result';
    this.contentEl.innerHTML = `
      <div class="rt-result-screen">
        <div class="rt-category">TEST COMPLETED</div>
        <h2 class="rt-result-score">${Math.round(reactionTime)}<span class="rt-ms">ms</span></h2>
        
        <div class="rt-rating-badge ${rating.toLowerCase().replace(' ', '-')}">
          ${rating.toUpperCase()}
        </div>
        
        ${newBest ? '<div class="rt-new-best-banner">🏆 NEW PERSONAL BEST!</div>' : ''}
        
        <div class="rt-scoreboard mini">
          <div class="rt-score-item">
            <span class="rt-score-label">BEST</span>
            <span class="rt-score-val">${Math.round(this.bestScore)}ms</span>
          </div>
          <div class="rt-score-item">
            <span class="rt-score-label">ATTEMPTS</span>
            <span class="rt-score-val">${this.attempts}</span>
          </div>
        </div>
        
        <div class="rt-actions">
          <button class="rt-action-btn primary" id="rt-retry-btn">RETRY</button>
          <button class="rt-action-btn" id="rt-back-btn">LAUNCHER</button>
        </div>
      </div>
    `;
    
    // Bind buttons
    this.contentEl.querySelector('#rt-back-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.bus.emit('ARCADE_BACK');
    });
    this.contentEl.querySelector('#rt-retry-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.transitionToState('WAITING');
    });
  }

  triggerAchievementHooks(reactionTime) {
    if (this.attempts === 1) {
      this.bus.emit('REACTION_FIRST_COMPLETION', { time: reactionTime });
    }
    if (reactionTime < 300) {
      this.bus.emit('REACTION_UNDER_300', { time: reactionTime });
    }
    if (reactionTime < 250) {
      this.bus.emit('REACTION_UNDER_250', { time: reactionTime });
    }
    if (reactionTime < 200) {
      this.bus.emit('REACTION_UNDER_200', { time: reactionTime });
    }
  }

  pause() {
    this.active = false;
    this.cancelTimeout();
  }

  resume() {
    this.active = true;
    this.gameArea.focus({ preventScroll: true });
  }

  destroy() {
    this.active = false;
    this.cancelTimeout();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    
    // Remove listeners from Event Bus (must match what was bound in mount)
    this.bus.off('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.off('ARCADE_ACTION_A', this.confirmHandler);
    this.bus.off('ARCADE_ACTION_B', this.backHandler);
    
    if (this.gameArea) {
      this.gameArea.removeEventListener('pointerdown', this.clickHandler);
    }
    
    this.container.innerHTML = '';
  }
}

// ============================================================================
// APP: NEON SNAKE
// ============================================================================
class NeonSnakeApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
    
    // Storage values using suggested keys
    this.highScore = this.storage.get('arcade_snake_best', 0);
    this.latestScore = this.storage.get('arcade_snake_latest', 0);
    this.gamesPlayed = this.storage.get('arcade_snake_games', 0);
    
    this.state = 'READY'; // READY, PLAYING, PAUSED, GAME_OVER
    this.active = false;
    
    // Grid Setup
    this.gridWidth = 20;
    this.gridHeight = 20;
    
    // Timing and Loops
    this.rafId = null;
    this.lastTickTime = 0;
    this.tickRate = 150; // Milliseconds per movement tick
    
    // Visibility listener
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
  
  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-neon-snake" id="snake-game-container" tabindex="0">
        <!-- Accessibility Announcer -->
        <div id="snake-aria-announcer" class="sr-only" aria-live="assertive" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;"></div>
        
        <!-- OS HUD header for score/level during gameplay -->
        <div id="snake-hud" class="snake-hud-hidden">
          <div class="hud-item">SCORE <span id="hud-score">0</span></div>
          <div class="hud-item">HI <span id="hud-high">${this.highScore}</span></div>
          <div class="hud-item">SPEED <span id="hud-level">LV.1</span></div>
        </div>
        
        <!-- Game Area Canvas -->
        <div class="canvas-wrapper">
          <canvas id="snake-canvas"></canvas>
        </div>
        
        <!-- Menu Views (overlays inside canvas area) -->
        <div id="snake-overlay-view" class="active"></div>
        
        <!-- Compact D-pad for touch devices -->
        <div class="snake-dpad" id="snake-dpad" style="display: none;">
          <button class="dpad-btn up" id="dpad-up">▲</button>
          <div class="dpad-row">
            <button class="dpad-btn left" id="dpad-left">◀</button>
            <button class="dpad-btn right" id="dpad-right">▶</button>
          </div>
          <button class="dpad-btn down" id="dpad-down">▼</button>
        </div>
      </div>
    `;
    
    this.gameContainer = this.container.querySelector('#snake-game-container');
    this.hud = this.container.querySelector('#snake-hud');
    this.canvas = this.container.querySelector('#snake-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#snake-overlay-view');
    this.announcer = this.container.querySelector('#snake-aria-announcer');
    this.dpad = this.container.querySelector('#snake-dpad');
    
    this.gameContainer.focus({ preventScroll: true });
    
    // Set up ResizeObserver
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);
    
    // Direction change handlers
    this.upHandler = () => this.handleDirection('UP');
    this.downHandler = () => this.handleDirection('DOWN');
    this.leftHandler = () => this.handleDirection('LEFT');
    this.rightHandler = () => this.handleDirection('RIGHT');
    this.confirmHandler = () => this.handleConfirm();
    this.backHandler = () => this.handleBack();
    
    this.bus.on('ARCADE_UP', this.upHandler);
    this.bus.on('ARCADE_DOWN', this.downHandler);
    this.bus.on('ARCADE_LEFT', this.leftHandler);
    this.bus.on('ARCADE_RIGHT', this.rightHandler);
    this.bus.on('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.on('ARCADE_ACTION_A', this.confirmHandler);
    
    // Swipe Touch Gestures
    this.setupTouchGestures();
    
    // Transition to initial state
    this.transitionToState('READY');
  }
  
  announce(text) {
    if (this.announcer) this.announcer.textContent = text;
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    const rawSize = Math.min(width - 24, height - 70);
    const size = Math.floor(rawSize / 20) * 20; // align size to multiple of 20
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = size;
    
    this.canvas.style.width = `${cssSize}px`;
    this.canvas.style.height = `${cssSize}px`;
    
    this.canvas.width = Math.round(cssSize * dpr);
    this.canvas.height = Math.round(cssSize * dpr);
    
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    
    this.cellSize = cssSize / this.gridWidth;
    
    this.draw();
  }
  
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    const enableTouchUI = () => {
      if (this.dpad && this.dpad.style.display === 'none') {
        this.dpad.style.display = 'flex';
        this.resizeCanvas();
      }
    };
    
    this.container.addEventListener('touchstart', (e) => {
      enableTouchUI();
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
      if (this.state === 'PLAYING') e.preventDefault();
    }, { passive: false });
    
    this.container.addEventListener('touchmove', (e) => {
      if (this.state === 'PLAYING') e.preventDefault();
    }, { passive: false });
    
    this.container.addEventListener('touchend', (e) => {
      if (this.state !== 'PLAYING') return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      
      if (Math.max(Math.abs(diffX), Math.abs(diffY)) > 30) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) this.handleDirection('RIGHT');
          else this.handleDirection('LEFT');
        } else {
          if (diffY > 0) this.handleDirection('DOWN');
          else this.handleDirection('UP');
        }
      }
    }, { passive: true });
    
    const bindDpad = (id, dir) => {
      const btn = this.container.querySelector(id);
      if (btn) {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleDirection(dir);
        });
      }
    };
    bindDpad('#dpad-up', 'UP');
    bindDpad('#dpad-down', 'DOWN');
    bindDpad('#dpad-left', 'LEFT');
    bindDpad('#dpad-right', 'RIGHT');
  }
  
  handleVisibilityChange() {
    if (document.hidden && this.state === 'PLAYING') {
      this.pause();
    }
  }
  
  transitionToState(nextState) {
    this.state = nextState;
    this.overlay.className = `snake-overlay-${nextState.toLowerCase()}`;
    
    if (nextState === 'READY') {
      this.announce('Neon Snake Launcher. High Score is ' + this.highScore + '. Press confirm or click start.');
      this.hud.className = 'snake-hud-hidden';
      this.overlay.innerHTML = `
        <div class="snake-menu-ready">
          <div class="snake-menu-logo">🐍</div>
          <div class="snake-menu-category">RETRO ARCADE</div>
          <h2 class="snake-menu-title">NEON SNAKE</h2>
          <p class="snake-menu-desc">Eat neon nodes. Do not run into walls or your own tail.</p>
          <div class="snake-menu-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="snake-menu-btn primary" id="snake-start-btn" data-arcade-focusable>START GAME</button>
          <button class="snake-menu-btn" id="snake-exit-btn" data-arcade-focusable>EXIT</button>
        </div>
      `;
      this.overlay.querySelector('#snake-start-btn').addEventListener('click', () => this.start());
      this.overlay.querySelector('#snake-exit-btn').addEventListener('click', () => this.bus.emit('ARCADE_BACK'));
    } 
    else if (nextState === 'PLAYING') {
      this.announce('Game started.');
      this.hud.className = 'snake-hud-active';
      this.overlay.innerHTML = '';
      this.updateHud();
    } 
    else if (nextState === 'PAUSED') {
      this.announce('Game paused.');
      this.overlay.innerHTML = `
        <div class="snake-menu-paused">
          <h2 class="snake-menu-title">PAUSED</h2>
          <button class="snake-menu-btn primary" id="snake-resume-btn" data-arcade-focusable>RESUME</button>
          <button class="snake-menu-btn" id="snake-restart-btn" data-arcade-focusable>RESTART</button>
          <button class="snake-menu-btn" id="snake-exit-btn" data-arcade-focusable>RETURN HOME</button>
        </div>
      `;
      this.overlay.querySelector('#snake-resume-btn').addEventListener('click', () => this.resume());
      this.overlay.querySelector('#snake-restart-btn').addEventListener('click', () => this.restart());
      this.overlay.querySelector('#snake-exit-btn').addEventListener('click', () => this.bus.emit('ARCADE_BACK'));
    } 
    else if (nextState === 'GAME_OVER') {
      this.gamesPlayed++;
      this.storage.set('arcade_snake_games', this.gamesPlayed);
      
      const newBest = this.score > this.highScore;
      if (newBest) {
        this.highScore = this.score;
        this.storage.set('arcade_snake_best', this.highScore);
        this.bus.emit('SNAKE_NEW_BEST', { score: this.score });
      }
      this.storage.set('arcade_snake_latest', this.score);
      this.bus.emit('SNAKE_SCORE', { score: this.score });
      
      if (this.gamesPlayed === 1) this.bus.emit('SNAKE_FIRST_GAME');
      if (this.score >= 50) this.bus.emit('SNAKE_SCORE_50');
      if (this.score >= 100) this.bus.emit('SNAKE_SCORE_100');
      if (this.score >= 200) this.bus.emit('SNAKE_SCORE_200');
      
      this.announce(`Game Over. Score is ${this.score}. ${newBest ? 'New record!' : ''}`);
      this.audio.playTone(180, 'sawtooth', 0.4, 0.1);
      
      this.overlay.innerHTML = `
        <div class="snake-menu-gameover">
          <h2 class="snake-menu-title">GAME OVER</h2>
          <div class="snake-final-score">${this.score}</div>
          <p class="snake-score-tip">Score achieved</p>
          ${newBest ? '<div class="snake-new-best-badge">🏆 NEW RECORD!</div>' : `<div class="snake-menu-hi">BEST: ${this.highScore}</div>`}
          <div class="snake-menu-actions">
            <button class="snake-menu-btn primary" id="snake-retry-btn" data-arcade-focusable>RETRY</button>
            <button class="snake-menu-btn" id="snake-exit-btn" data-arcade-focusable>RETURN HOME</button>
          </div>
        </div>
      `;
      this.overlay.querySelector('#snake-retry-btn').addEventListener('click', () => this.restart());
      this.overlay.querySelector('#snake-exit-btn').addEventListener('click', () => this.bus.emit('ARCADE_BACK'));
    }

    if (nextState !== 'PLAYING' && window.ArcadeSystemUI) {
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
  }
  
  start() {
    this.score = 0;
    this.dir = 'RIGHT';
    this.dirQueue = [];
    this.tickRate = 150;
    this.lastTickTime = 0;
    
    this.snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    
    this.spawnFood();
    this.transitionToState('PLAYING');
    
    this.audio.playTone(440, 'sine', 0.1, 0.08);
    setTimeout(() => this.audio.playTone(554.37, 'sine', 0.1, 0.08), 80);
    setTimeout(() => this.audio.playTone(659.25, 'sine', 0.15, 0.1), 160);
    
    this.cancelLoop();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  spawnFood() {
    let attempts = 0;
    let foodX, foodY;
    while (attempts < 100) {
      foodX = Math.floor(Math.random() * this.gridWidth);
      foodY = Math.floor(Math.random() * this.gridHeight);
      const onSnake = this.snake.some(seg => seg.x === foodX && seg.y === foodY);
      if (!onSnake) break;
      attempts++;
    }
    this.food = { x: foodX, y: foodY };
  }
  
  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    
    if (!this.lastTickTime) this.lastTickTime = timestamp;
    const elapsed = timestamp - this.lastTickTime;
    
    if (elapsed >= this.tickRate) {
      this.moveSnake();
      this.lastTickTime = timestamp - (elapsed % this.tickRate);
    }
    
    this.draw();
  }
  
  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  moveSnake() {
    if (this.dirQueue.length > 0) {
      this.dir = this.dirQueue.shift();
    }
    
    const head = { ...this.snake[0] };
    if (this.dir === 'UP') head.y--;
    else if (this.dir === 'DOWN') head.y++;
    else if (this.dir === 'LEFT') head.x--;
    else if (this.dir === 'RIGHT') head.x++;
    
    if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
      this.gameOver();
      return;
    }
    
    const selfCrash = this.snake.some(seg => seg.x === head.x && seg.y === head.y);
    if (selfCrash) {
      this.gameOver();
      return;
    }
    
    this.snake.unshift(head);
    
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.audio.playTone(800, 'sine', 0.05, 0.08);
      this.spawnFood();
      this.updateHud();
      
      this.tickRate = Math.max(75, 150 - Math.floor(this.score / 50) * 8);
    } else {
      this.snake.pop();
    }
  }
  
  updateHud() {
    const scoreVal = this.hud.querySelector('#hud-score');
    const highVal = this.hud.querySelector('#hud-high');
    const levelVal = this.hud.querySelector('#hud-level');
    
    if (scoreVal) scoreVal.textContent = this.score;
    if (highVal) highVal.textContent = Math.max(this.score, this.highScore);
    if (levelVal) {
      const level = Math.min(10, 1 + Math.floor(this.score / 50));
      levelVal.textContent = `LV.${level}`;
    }
  }
  
  handleDirection(newDir) {
    if (!this.active || this.state !== 'PLAYING') return;
    
    const lastDir = this.dirQueue.length > 0 ? this.dirQueue[this.dirQueue.length - 1] : this.dir;
    if (newDir === 'UP' && lastDir === 'DOWN') return;
    if (newDir === 'DOWN' && lastDir === 'UP') return;
    if (newDir === 'LEFT' && lastDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && lastDir === 'LEFT') return;
    
    if (this.dirQueue.length < 2) {
      this.dirQueue.push(newDir);
    }
  }
  
  handleConfirm() {
    if (!this.active) return;
    
    if (this.state === 'READY') {
      this.start();
    } 
    else if (this.state === 'PAUSED') {
      this.resume();
    } 
    else if (this.state === 'GAME_OVER') {
      this.restart();
    }
  }
  
  handleBack() {
    if (!this.active) return;
    
    if (this.state === 'PLAYING') {
      this.pause();
    } 
    else if (this.state === 'PAUSED') {
      this.resume();
    }
    else {
      window.ArcadeOS.goHome();
    }
  }
  
  pause() {
    if (this.state !== 'PLAYING') return;
    this.cancelLoop();
    this.audio.playTone(330, 'triangle', 0.15, 0.05);
    this.transitionToState('PAUSED');
  }
  
  resume() {
    if (this.state !== 'PAUSED') return;
    this.audio.playTone(440, 'triangle', 0.1, 0.05);
    this.transitionToState('PLAYING');
    
    this.lastTickTime = 0;
    this.cancelLoop();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  restart() {
    this.start();
  }
  
  gameOver() {
    this.cancelLoop();
    this.transitionToState('GAME_OVER');
  }
  
  draw() {
    if (!this.canvas || !this.ctx) return;
    
    this.ctx.fillStyle = '#0c0c0e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#151518';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.gridWidth; i++) {
      const pos = i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }
    
    if (this.state === 'READY') return;
    
    if (this.food) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.shadowColor = '#ef4444';
      this.ctx.shadowBlur = 6;
      
      this.ctx.beginPath();
      this.ctx.arc(
        (this.food.x + 0.5) * this.cellSize,
        (this.food.y + 0.5) * this.cellSize,
        this.cellSize * 0.35,
        0, Math.PI * 2
      );
      this.ctx.fill();
    }
    
    if (this.snake && this.snake.length > 0) {
      this.ctx.fillStyle = '#10b981';
      this.ctx.shadowColor = '#10b981';
      this.ctx.shadowBlur = 8;
      
      this.snake.forEach((seg, idx) => {
        const x = seg.x * this.cellSize + 1;
        const y = seg.y * this.cellSize + 1;
        const size = this.cellSize - 2;
        
        if (idx === 0) {
          this.ctx.fillStyle = '#34d399';
          this.ctx.fillRect(x, y, size, size);
          
          this.ctx.fillStyle = '#062f22';
          this.ctx.shadowBlur = 0;
          const eyeSize = size * 0.15;
          const offset = size * 0.25;
          
          if (this.dir === 'RIGHT' || this.dir === 'LEFT') {
            this.ctx.fillRect(x + size - offset, y + offset, eyeSize, eyeSize);
            this.ctx.fillRect(x + size - offset, y + size - offset - eyeSize, eyeSize, eyeSize);
          } else {
            this.ctx.fillRect(x + offset, y + offset, eyeSize, eyeSize);
            this.ctx.fillRect(x + size - offset - eyeSize, y + offset, eyeSize, eyeSize);
          }
          this.ctx.fillStyle = '#10b981';
          this.ctx.shadowBlur = 8;
        } else {
          this.ctx.fillStyle = '#10b981';
          this.ctx.fillRect(x, y, size, size);
        }
      });
    }
    
    this.ctx.shadowBlur = 0;
  }
  
  destroy() {
    this.active = false;
    this.cancelLoop();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    this.bus.off('ARCADE_UP', this.upHandler);
    this.bus.off('ARCADE_DOWN', this.downHandler);
    this.bus.off('ARCADE_LEFT', this.leftHandler);
    this.bus.off('ARCADE_RIGHT', this.rightHandler);
    this.bus.off('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.off('ARCADE_ACTION_A', this.confirmHandler);
    
    this.container.innerHTML = '';
  }
}

// ============================================================================
// APP: BREAKOUT
// ============================================================================
class BreakoutApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
    
    // Storage initialization
    this.highScore = this.storage.get('arcade_breakout_best', 0);
    this.latestScore = this.storage.get('arcade_breakout_latest', 0);
    this.gamesPlayed = this.storage.get('arcade_breakout_games', 0);
    this.highestLevel = this.storage.get('arcade_breakout_level', 1);
    
    this.state = 'READY'; // READY, PLAYING, PAUSED, LEVEL_CLEAR, GAME_OVER, VICTORY
    this.active = false;
    
    // Playfield Logical Size
    this.playfieldWidth = 400;
    this.playfieldHeight = 400;
    
    // Loops and Anim IDs
    this.rafId = null;
    this.lastTime = 0;
    
    // Key tracking for smooth continuous motion
    this.keysPressed = { left: false, right: false };
    
    // Visibility listener
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
  
  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-breakout" id="breakout-game-container" tabindex="0">
        <!-- Accessibility Announcer -->
        <div id="breakout-aria-announcer" class="sr-only" aria-live="assertive" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;"></div>
        
        <!-- OS HUD header -->
        <div id="breakout-hud" class="breakout-hud-hidden">
          <div class="hud-item">SCORE <span id="hud-score">0</span></div>
          <div class="hud-item">HI <span id="hud-high">${this.highScore}</span></div>
          <div class="hud-item">LIVES <span id="hud-lives">♥♥♥</span></div>
          <div class="hud-item">LV. <span id="hud-level">1</span></div>
        </div>
        
        <!-- Canvas viewport -->
        <div class="canvas-wrapper">
          <canvas id="breakout-canvas"></canvas>
        </div>
        
        <!-- Overlay Views (menus/results) -->
        <div id="breakout-overlay-view" class="active"></div>
      </div>
    `;
    
    this.gameContainer = this.container.querySelector('#breakout-game-container');
    this.hud = this.container.querySelector('#breakout-hud');
    this.canvas = this.container.querySelector('#breakout-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#breakout-overlay-view');
    this.announcer = this.container.querySelector('#breakout-aria-announcer');
    
    this.gameContainer.focus({ preventScroll: true });
    
    // Set up ResizeObserver
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);
    
    // Bind event bus keys
    this.confirmHandler = () => this.handleConfirm();
    this.backHandler = () => this.handleBack();
    this.leftHandler = () => {
      if (this.state === 'PLAYING') {
        this.paddle.x = Math.max(0, this.paddle.x - 24);
      }
    };
    this.rightHandler = () => {
      if (this.state === 'PLAYING') {
        this.paddle.x = Math.min(this.playfieldWidth - this.paddle.width, this.paddle.x + 24);
      }
    };
    
    this.bus.on('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.on('ARCADE_ACTION_A', this.confirmHandler);
    this.bus.on('ARCADE_LEFT', this.leftHandler);
    this.bus.on('ARCADE_RIGHT', this.rightHandler);
    
    // Document keys for smooth keyboard control
    this.keydownHandler = (e) => {
      if (!this.active || this.state !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keysPressed.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keysPressed.right = true;
    };
    this.keyupHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keysPressed.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keysPressed.right = false;
    };
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
    
    // Mouse event listeners
    this.mousemoveHandler = (e) => {
      if (!this.active || this.state !== 'PLAYING') return;
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width * this.playfieldWidth;
      this.paddle.x = Math.max(0, Math.min(this.playfieldWidth - this.paddle.width, relativeX - this.paddle.width / 2));
    };
    this.canvas.addEventListener('mousemove', this.mousemoveHandler);
    
    // Touch event listeners
    this.touchHandler = (e) => {
      if (!this.active || this.state !== 'PLAYING') return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = (touch.clientX - rect.left) / rect.width * this.playfieldWidth;
      this.paddle.x = Math.max(0, Math.min(this.playfieldWidth - this.paddle.width, relativeX - this.paddle.width / 2));
    };
    this.canvas.addEventListener('touchstart', this.touchHandler, { passive: false });
    this.canvas.addEventListener('touchmove', this.touchHandler, { passive: false });
    
    // Transition to initial state
    this.transitionToState('READY');
  }
  
  announce(text) {
    if (this.announcer) this.announcer.textContent = text;
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    const rawSize = Math.min(width - 24, height - 70);
    const size = Math.floor(rawSize / 20) * 20; // clean multiple of 20
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = size;
    
    this.canvas.style.width = `${cssSize}px`;
    this.canvas.style.height = `${cssSize}px`;
    
    this.canvas.width = Math.round(cssSize * dpr);
    this.canvas.height = Math.round(cssSize * dpr);
    
    // Scale context so we draw in logical 400x400 space
    const scale = cssSize / this.playfieldWidth;
    this.ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    
    this.draw();
  }
  
  handleVisibilityChange() {
    if (document.hidden && this.state === 'PLAYING') {
      this.pause();
    }
  }
  
  transitionToState(nextState) {
    this.state = nextState;
    this.overlay.className = `breakout-overlay-${nextState.toLowerCase()}`;
    
    if (nextState === 'READY') {
      this.announce(`Breakout. High Score is ${this.highScore}. Press Start or Click to Play.`);
      this.hud.className = 'breakout-hud-hidden';
      this.overlay.innerHTML = `
        <div class="breakout-menu-ready">
          <div class="breakout-menu-logo">🔵</div>
          <div class="breakout-menu-category">RETRO ARCADE</div>
          <h2 class="breakout-menu-title">BREAKOUT</h2>
          <p class="breakout-menu-desc">Destroy all bricks. Keep the ball bouncing. Move with keys, mouse, or touch.</p>
          <div class="breakout-menu-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="breakout-menu-btn primary" id="breakout-start-btn" data-arcade-focusable>START GAME</button>
          <button class="breakout-menu-btn" id="breakout-exit-btn" data-arcade-focusable>EXIT</button>
        </div>
      `;
      this.overlay.querySelector('#breakout-start-btn').addEventListener('click', () => this.start());
      this.overlay.querySelector('#breakout-exit-btn').addEventListener('click', () => window.ArcadeOS.goHome());
    } 
    else if (nextState === 'PLAYING') {
      this.announce('Game started.');
      this.hud.className = 'breakout-hud-active';
      this.overlay.innerHTML = '';
      this.updateHud();
    } 
    else if (nextState === 'PAUSED') {
      this.announce('Game paused.');
      this.overlay.innerHTML = `
        <div class="breakout-menu-paused">
          <h2 class="breakout-menu-title">PAUSED</h2>
          <button class="breakout-menu-btn primary" id="breakout-resume-btn" data-arcade-focusable>RESUME</button>
          <button class="breakout-menu-btn" id="breakout-restart-btn" data-arcade-focusable>RESTART</button>
          <button class="breakout-menu-btn" id="breakout-exit-btn" data-arcade-focusable>RETURN HOME</button>
        </div>
      `;
      this.overlay.querySelector('#breakout-resume-btn').addEventListener('click', () => this.resume());
      this.overlay.querySelector('#breakout-restart-btn').addEventListener('click', () => this.restart());
      this.overlay.querySelector('#breakout-exit-btn').addEventListener('click', () => window.ArcadeOS.goHome());
    } 
    else if (nextState === 'LEVEL_CLEAR') {
      this.announce(`Level ${this.level} Cleared. Press Action to proceed.`);
      this.audio.playTone(523.25, 'sine', 0.1, 0.08); // C5
      setTimeout(() => this.audio.playTone(659.25, 'sine', 0.1, 0.08), 80); // E5
      setTimeout(() => this.audio.playTone(783.99, 'sine', 0.2, 0.1), 160); // G5
      this.bus.emit('BREAKOUT_LEVEL_CLEARED', { level: this.level });
      
      this.overlay.innerHTML = `
        <div class="breakout-menu-levelclear">
          <div class="breakout-menu-logo">⭐</div>
          <h2 class="breakout-menu-title">LEVEL CLEAR!</h2>
          <p class="breakout-menu-desc">Ready for next level? Speed increases and paddle shrinks.</p>
          <button class="breakout-menu-btn primary" id="breakout-next-btn" data-arcade-focusable>NEXT LEVEL</button>
        </div>
      `;
      this.overlay.querySelector('#breakout-next-btn').addEventListener('click', () => this.nextLevel());
    }
    else if (nextState === 'VICTORY') {
      this.gamesPlayed++;
      this.storage.set('arcade_breakout_games', this.gamesPlayed);
      this.bus.emit('BREAKOUT_LONGEST_STREAK', { streak: this.longestStreak });
      
      const newBest = this.score > this.highScore;
      if (newBest) {
        this.highScore = this.score;
        this.storage.set('arcade_breakout_best', this.highScore);
        this.bus.emit('BREAKOUT_NEW_BEST', { score: this.score });
      }
      this.storage.set('arcade_breakout_latest', this.score);
      this.storage.set('arcade_breakout_level', Math.max(this.level, this.highestLevel));
      this.bus.emit('BREAKOUT_SCORE', { score: this.score });
      this.bus.emit('GAME_COMPLETED', { id: 'breakout' });
      
      this.announce(`Congratulations! You cleared all levels. Final Score: ${this.score}.`);
      this.audio.playTone(523.25, 'sine', 0.1, 0.08);
      setTimeout(() => this.audio.playTone(659.25, 'sine', 0.1, 0.08), 80);
      setTimeout(() => this.audio.playTone(783.99, 'sine', 0.1, 0.08), 160);
      setTimeout(() => this.audio.playTone(1046.50, 'sine', 0.3, 0.1), 240);
      
      this.overlay.innerHTML = `
        <div class="breakout-menu-ready">
          <div class="breakout-menu-logo">🏆</div>
          <h2 class="breakout-menu-title">VICTORY!</h2>
          <div class="breakout-final-score">${this.score}</div>
          <p class="breakout-score-tip">FINAL SCORE ACHIEVED</p>
          ${newBest ? '<div class="breakout-new-best-badge">🏆 NEW RECORD!</div>' : `<div class="breakout-menu-hi">BEST: ${this.highScore}</div>`}
          <div class="breakout-menu-actions">
            <button class="breakout-menu-btn primary" id="breakout-retry-btn" data-arcade-focusable>PLAY AGAIN</button>
            <button class="breakout-menu-btn" id="breakout-exit-btn" data-arcade-focusable>RETURN HOME</button>
          </div>
        </div>
      `;
      this.overlay.querySelector('#breakout-retry-btn').addEventListener('click', () => this.restart());
      this.overlay.querySelector('#breakout-exit-btn').addEventListener('click', () => window.ArcadeOS.goHome());
    }
    else if (nextState === 'GAME_OVER') {
      this.gamesPlayed++;
      this.storage.set('arcade_breakout_games', this.gamesPlayed);
      this.bus.emit('BREAKOUT_LONGEST_STREAK', { streak: this.longestStreak });
      
      const newBest = this.score > this.highScore;
      if (newBest) {
        this.highScore = this.score;
        this.storage.set('arcade_breakout_best', this.highScore);
        this.bus.emit('BREAKOUT_NEW_BEST', { score: this.score });
      }
      this.storage.set('arcade_breakout_latest', this.score);
      this.storage.set('arcade_breakout_level', Math.max(this.level, this.highestLevel));
      this.bus.emit('BREAKOUT_SCORE', { score: this.score });
      
      this.announce(`Game Over. Score is ${this.score}. ${newBest ? 'New record!' : ''}`);
      this.audio.playTone(180, 'sawtooth', 0.4, 0.1);
      
      this.overlay.innerHTML = `
        <div class="breakout-menu-gameover">
          <h2 class="breakout-menu-title">GAME OVER</h2>
          <div class="breakout-final-score">${this.score}</div>
          <p class="breakout-score-tip">Score achieved</p>
          ${newBest ? '<div class="breakout-new-best-badge">🏆 NEW RECORD!</div>' : `<div class="breakout-menu-hi">BEST: ${this.highScore}</div>`}
          <div class="breakout-menu-actions">
            <button class="breakout-menu-btn primary" id="breakout-retry-btn" data-arcade-focusable>RETRY</button>
            <button class="breakout-menu-btn" id="breakout-exit-btn" data-arcade-focusable>RETURN HOME</button>
          </div>
        </div>
      `;
      this.overlay.querySelector('#breakout-retry-btn').addEventListener('click', () => this.restart());
      this.overlay.querySelector('#breakout-exit-btn').addEventListener('click', () => window.ArcadeOS.goHome());
    }

    if (nextState !== 'PLAYING' && window.ArcadeSystemUI) {
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
  }
  
  start() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.streak = 0;
    this.longestStreak = 0;
    
    this.initLevel();
    this.transitionToState('PLAYING');
    
    this.audio.playTone(587.33, 'sine', 0.1, 0.08); // D5
    setTimeout(() => this.audio.playTone(659.25, 'sine', 0.1, 0.08), 80); // E5
    setTimeout(() => this.audio.playTone(880, 'sine', 0.15, 0.1), 160); // A5
    
    this.cancelLoop();
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  initLevel() {
    // Speed maps per level
    const speedTable = { 1: 4.5, 2: 5.2, 3: 6.0 };
    this.ballSpeed = speedTable[this.level] || 4.5;
    
    // Paddle size shrinks as levels progress
    const paddleWidthTable = { 1: 80, 2: 70, 3: 60 };
    const paddleW = paddleWidthTable[this.level] || 80;
    
    this.paddle = {
      x: (this.playfieldWidth - paddleW) / 2,
      y: 370,
      width: paddleW,
      height: 10
    };
    
    this.resetBall();
    this.buildBricks();
    this.keysPressed = { left: false, right: false };
  }
  
  resetBall() {
    this.ball = {
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 6,
      vx: 0,
      vy: 0,
      radius: 5,
      active: false
    };
  }
  
  launchBall() {
    if (this.ball.active) return;
    
    // Random angle between -45 and 45 degrees
    const angle = (Math.random() * 90 - 45) * Math.PI / 180;
    this.ball.vx = this.ballSpeed * Math.sin(angle);
    this.ball.vy = -this.ballSpeed * Math.cos(angle);
    this.ball.active = true;
    
    this.audio.playTone(600, 'sine', 0.1, 0.08);
  }
  
  buildBricks() {
    this.bricks = [];
    
    const rows = 5;
    const cols = 8;
    const w = 44;
    const h = 10;
    const gap = 6;
    const offset = 3;
    
    for (let r = 0; r < rows; r++) {
      let color = '#ef4444'; // Red
      let points = 50;
      let hp = 1;
      
      if (r === 1) { color = '#f97316'; points = 40; } // Orange
      else if (r === 2) { color = '#eab308'; points = 30; } // Yellow
      else if (r === 3) { color = '#10b981'; points = 20; } // Green
      else if (r === 4) { color = '#3b82f6'; points = 10; } // Blue
      
      for (let c = 0; c < cols; c++) {
        // Level 2 alternating checkerboard
        if (this.level === 2 && (r + c) % 2 === 1) continue;
        
        // Level 3 durable bricks on top rows
        let finalHp = hp;
        let finalColor = color;
        if (this.level === 3 && (r === 0 || r === 1)) {
          finalHp = 2;
          finalColor = '#a1a1aa'; // steel grey
          points = 100;
        }
        
        this.bricks.push({
          x: offset + c * (w + gap),
          y: 50 + r * (h + gap),
          w: w,
          h: h,
          color: finalColor,
          points: points,
          hp: finalHp,
          maxHp: finalHp,
          active: true
        });
      }
    }
  }
  
  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    
    if (!this.lastTime) {
      this.lastTime = timestamp;
    }
    
    let dt = timestamp - this.lastTime;
    if (dt > 100) dt = 100; // avoid spiral of death
    this.lastTime = timestamp;
    
    this.accumulator = (this.accumulator || 0) + dt;
    const timeStep = 1000 / 60; // 16.67ms update steps
    
    while (this.accumulator >= timeStep) {
      this.update();
      this.accumulator -= timeStep;
    }
    
    this.draw();
  }
  
  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  update() {
    // 1. Move Paddle smoothly via keys
    if (this.keysPressed.left) {
      this.paddle.x = Math.max(0, this.paddle.x - 6);
    }
    if (this.keysPressed.right) {
      this.paddle.x = Math.min(this.playfieldWidth - this.paddle.width, this.paddle.x + 6);
    }
    
    // 2. Lock Ball on Paddle if not launched
    if (!this.ball.active) {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
      this.ball.y = this.paddle.y - this.ball.radius;
      return;
    }
    
    // 3. Update Ball Position
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    
    // 4. Wall Collisions
    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx = -this.ball.vx;
      this.audio.playTone(280, 'triangle', 0.05, 0.04);
    }
    if (this.ball.x + this.ball.radius > this.playfieldWidth) {
      this.ball.x = this.playfieldWidth - this.ball.radius;
      this.ball.vx = -this.ball.vx;
      this.audio.playTone(280, 'triangle', 0.05, 0.04);
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy = -this.ball.vy;
      this.audio.playTone(280, 'triangle', 0.05, 0.04);
    }
    
    // 5. Out of bounds (lose life)
    if (this.ball.y + this.ball.radius > this.playfieldHeight) {
      this.lives--;
      this.streak = 0;
      this.audio.playTone(150, 'sawtooth', 0.25, 0.08);
      this.updateHud();
      
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.resetBall();
        this.announce(`Life lost. ${this.lives} lives remaining. Press Action to relaunch.`);
      }
      return;
    }
    
    // 6. Paddle Collision
    if (this.ball.vy > 0 &&
        this.ball.y + this.ball.radius >= this.paddle.y &&
        this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
        this.ball.x >= this.paddle.x &&
        this.ball.x <= this.paddle.x + this.paddle.width) {
      
      // Calculate hit reflection angle relative to center of paddle
      const relativeHit = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
      const maxAngle = 60 * Math.PI / 180;
      const angle = relativeHit * maxAngle;
      
      this.ball.vx = this.ballSpeed * Math.sin(angle);
      this.ball.vy = -this.ballSpeed * Math.cos(angle);
      
      // Safe clamp
      this.ball.vy = Math.min(-1.5, this.ball.vy);
      
      this.audio.playTone(250, 'triangle', 0.06, 0.06);
    }
    
    // 7. Bricks Collision (resolve one hit per frame)
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      if (!b.active) continue;
      
      if (this.ball.x + this.ball.radius >= b.x &&
          this.ball.x - this.ball.radius <= b.x + b.w &&
          this.ball.y + this.ball.radius >= b.y &&
          this.ball.y - this.ball.radius <= b.y + b.h) {
        
        b.hp--;
        this.audio.playTone(450, 'sine', 0.04, 0.05);
        
        if (b.hp <= 0) {
          b.active = false;
          this.score += b.points;
          this.streak = (this.streak || 0) + 1;
          this.longestStreak = Math.max(this.longestStreak || 0, this.streak);
          this.updateHud();
        } else {
          b.color = '#71717a'; // cracked styling
        }
        
        // AABB direction heuristic
        const overlapX = this.ball.x < b.x + b.w / 2
          ? (this.ball.x + this.ball.radius - b.x)
          : (b.x + b.w - (this.ball.x - this.ball.radius));
        const overlapY = this.ball.y < b.y + b.h / 2
          ? (this.ball.y + this.ball.radius - b.y)
          : (b.y + b.h - (this.ball.y - this.ball.radius));
          
        if (overlapX < overlapY) {
          this.ball.vx = -this.ball.vx;
        } else {
          this.ball.vy = -this.ball.vy;
        }
        
        break; // resolve only 1 hit
      }
    }
    
    // 8. Level Clear Check
    const activeBricks = this.bricks.filter(b => b.active).length;
    if (activeBricks === 0) {
      this.cancelLoop();
      if (this.level >= 3) {
        this.transitionToState('VICTORY');
      } else {
        this.transitionToState('LEVEL_CLEAR');
      }
    }
  }
  
  updateHud() {
    const scoreVal = this.hud.querySelector('#hud-score');
    const highVal = this.hud.querySelector('#hud-high');
    const levelVal = this.hud.querySelector('#hud-level');
    const livesVal = this.hud.querySelector('#hud-lives');
    
    if (scoreVal) scoreVal.textContent = this.score;
    if (highVal) highVal.textContent = Math.max(this.score, this.highScore);
    if (levelVal) levelVal.textContent = this.level;
    if (livesVal) {
      livesVal.textContent = '♥'.repeat(Math.max(0, this.lives)) || 'EMPTY';
    }
  }
  
  draw() {
    if (!this.canvas || !this.ctx) return;
    
    // Background clear
    this.ctx.fillStyle = '#0c0c0e';
    this.ctx.fillRect(0, 0, this.playfieldWidth, this.playfieldHeight);
    
    // Draw background texture grid
    this.ctx.strokeStyle = '#141416';
    this.ctx.lineWidth = 1;
    const gridSpacing = 20;
    for (let x = 0; x <= this.playfieldWidth; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.playfieldHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.playfieldHeight; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.playfieldWidth, y);
      this.ctx.stroke();
    }
    
    if (this.state === 'READY') return;
    
    // Draw Paddle
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.shadowColor = '#3b82f6';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 3);
    this.ctx.fill();
    
    // Draw Ball
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 6;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw Bricks
    this.ctx.shadowBlur = 0; // disable shadow for bricks performance
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      if (!b.active) continue;
      
      this.ctx.fillStyle = b.color;
      this.ctx.beginPath();
      this.ctx.roundRect(b.x, b.y, b.w, b.h, 2);
      this.ctx.fill();
      
      // Durable outline indicator
      if (b.maxHp === 2) {
        this.ctx.strokeStyle = b.hp === 2 ? '#ffffff' : '#4b5563';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw cracks for hit durable bricks
        if (b.hp === 1) {
          this.ctx.strokeStyle = '#0c0c0e';
          this.ctx.beginPath();
          this.ctx.moveTo(b.x + 5, b.y + 2);
          this.ctx.lineTo(b.x + b.w - 5, b.y + b.h - 2);
          this.ctx.stroke();
        }
      }
    }
  }
  
  handleConfirm() {
    if (!this.active) return;
    
    if (this.state === 'READY') {
      this.start();
    } 
    else if (this.state === 'PLAYING') {
      if (!this.ball.active) this.launchBall();
    } 
    else if (this.state === 'PAUSED') {
      this.resume();
    } 
    else if (this.state === 'LEVEL_CLEAR') {
      this.nextLevel();
    }
    else if (this.state === 'GAME_OVER' || this.state === 'VICTORY') {
      this.restart();
    }
  }
  
  handleBack() {
    if (!this.active) return;
    
    if (this.state === 'PLAYING') {
      this.pause();
    } 
    else if (this.state === 'PAUSED') {
      this.resume();
    }
    else {
      window.ArcadeOS.goHome();
    }
  }
  
  pause() {
    if (this.state !== 'PLAYING') return;
    this.cancelLoop();
    this.audio.playTone(330, 'triangle', 0.15, 0.05);
    this.transitionToState('PAUSED');
  }
  
  resume() {
    if (this.state !== 'PAUSED') return;
    this.audio.playTone(440, 'triangle', 0.1, 0.05);
    this.transitionToState('PLAYING');
    
    this.cancelLoop();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  restart() {
    this.start();
  }
  
  gameOver() {
    this.cancelLoop();
    this.transitionToState('GAME_OVER');
  }
  
  nextLevel() {
    this.level++;
    this.initLevel();
    this.transitionToState('PLAYING');
    
    this.cancelLoop();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  destroy() {
    this.active = false;
    this.cancelLoop();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Remove bus events
    this.bus.off('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.off('ARCADE_ACTION_A', this.confirmHandler);
    this.bus.off('ARCADE_LEFT', this.leftHandler);
    this.bus.off('ARCADE_RIGHT', this.rightHandler);
    
    // Remove doc keys
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    
    // Remove mouse/touch events
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
      this.canvas.removeEventListener('touchstart', this.touchHandler);
      this.canvas.removeEventListener('touchmove', this.touchHandler);
    }
    
    this.container.innerHTML = '';
  }
}

// ============================================================================
// APP: PIXEL PAD
// ============================================================================
class PixelPadApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
  }
  
  mount() {
    this.container.innerHTML = `
      <div class="app-placeholder-screen">
        <div class="placeholder-icon">🎨</div>
        <div class="placeholder-category">CREATIVE TOOL</div>
        <h2 class="placeholder-title">Pixel Pad</h2>
        <div class="placeholder-status-badge ready">READY</div>
        <p class="placeholder-desc">12x12 retro canvas sketching tool.</p>
        
        <div class="placeholder-message">
          Tool ready.
        </div>
        
        <button class="placeholder-back-btn" id="placeholder-back-btn">
          RETURN TO LAUNCHER
        </button>
      </div>
    `;

    const backBtn = this.container.querySelector('#placeholder-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.bus.emit('ARCADE_BACK');
      });
    }
  }
  
  destroy() {
    // Teardown logic
  }
}

// ============================================================================
// APP: PALETTE LAB
// ============================================================================
class PaletteLabApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
  }
  
  mount() {
    this.container.innerHTML = `
      <div class="app-placeholder-screen">
        <div class="placeholder-icon">🧪</div>
        <div class="placeholder-category">CREATIVE TOOL</div>
        <h2 class="placeholder-title">Palette Lab</h2>
        <div class="placeholder-status-badge ready">READY</div>
        <p class="placeholder-desc">Interactive hexadecimal color palette generator.</p>
        
        <div class="placeholder-message">
          Tool ready.
        </div>
        
        <button class="placeholder-back-btn" id="placeholder-back-btn">
          RETURN TO LAUNCHER
        </button>
      </div>
    `;

    const backBtn = this.container.querySelector('#placeholder-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.bus.emit('ARCADE_BACK');
      });
    }
  }
  
  destroy() {
    // Teardown logic
  }
}

class PixelPadToolApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
    this.size = 12;
    this.activeColor = '#10b981';
    this.palette = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ffffff', '#0c0c0e'];
    this.pixels = this.storage.get('pixelpad_pixels', Array(this.size * this.size).fill('#0c0c0e'));
  }

  mount() {
    this.container.innerHTML = `
      <div class="pixelpad-app">
        <div class="tool-header">
          <div>
            <div class="tool-kicker">CREATIVE TOOL</div>
            <h2>Pixel Pad</h2>
          </div>
          <button class="placeholder-back-btn" id="pixelpad-exit" data-arcade-focusable>EXIT</button>
        </div>
        <div class="pixelpad-grid" id="pixelpad-grid" aria-label="12 by 12 pixel canvas"></div>
        <div class="pixelpad-controls">
          <div class="pixelpad-swatches" id="pixelpad-swatches"></div>
          <button class="tool-btn" id="pixelpad-clear" data-arcade-focusable>CLEAR</button>
          <button class="tool-btn" id="pixelpad-save" data-arcade-focusable>SAVE</button>
        </div>
        <p class="tool-status" id="pixelpad-status">Tap a cell to paint.</p>
      </div>
    `;

    this.grid = this.container.querySelector('#pixelpad-grid');
    this.status = this.container.querySelector('#pixelpad-status');
    this.renderGrid();
    this.renderSwatches();

    this.container.querySelector('#pixelpad-exit')?.addEventListener('click', () => this.bus.emit('ARCADE_BACK'));
    this.container.querySelector('#pixelpad-clear')?.addEventListener('click', () => this.clear());
    this.container.querySelector('#pixelpad-save')?.addEventListener('click', () => this.save('Saved to local storage.'));
    
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.mountRoute('pixelpad', this.container);
    }
  }

  renderGrid() {
    this.grid.innerHTML = this.pixels.map((color, idx) => `
      <button class="pixel-cell" data-idx="${idx}" style="background:${color}" aria-label="Pixel ${idx + 1}"></button>
    `).join('');

    this.grid.querySelectorAll('.pixel-cell').forEach(cell => {
      cell.addEventListener('pointerdown', () => {
        const idx = Number(cell.dataset.idx);
        this.pixels[idx] = this.activeColor;
        cell.style.background = this.activeColor;
        this.audio.playTick();
      });
    });
  }

  renderSwatches() {
    const swatches = this.container.querySelector('#pixelpad-swatches');
    swatches.innerHTML = this.palette.map(color => `
      <button class="pixel-swatch ${color === this.activeColor ? 'active' : ''}" data-color="${color}" style="background:${color}" aria-label="Select ${color}" data-arcade-focusable></button>
    `).join('');

    swatches.querySelectorAll('.pixel-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeColor = btn.dataset.color;
        this.renderSwatches();
        this.audio.playSelect();
      });
    });
  }

  clear() {
    this.pixels = Array(this.size * this.size).fill('#0c0c0e');
    this.renderGrid();
    this.save('Canvas cleared.');
    this.audio.playBack();
  }

  save(message) {
    this.storage.set('pixelpad_pixels', this.pixels);
    if (this.status) this.status.textContent = message;
    this.bus.emit('PIXELPAD_SAVED');
  }

  destroy() {
    this.save('Saved to local storage.');
    this.container.innerHTML = '';
  }
}

class PaletteLabToolApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
    this.locks = this.storage.get('palettelab_locks', [false, false, false, false, false]);
    this.colors = this.storage.get('palettelab_colors', this.generatePalette());
  }

  mount() {
    this.container.innerHTML = `
      <div class="palette-app">
        <div class="tool-header">
          <div>
            <div class="tool-kicker">CREATIVE TOOL</div>
            <h2>Palette Lab</h2>
          </div>
          <button class="placeholder-back-btn" id="palette-exit" data-arcade-focusable>EXIT</button>
        </div>
        <div class="palette-strip" id="palette-strip"></div>
        <div class="palette-controls">
          <button class="tool-btn" id="palette-generate" data-arcade-focusable>GENERATE</button>
          <button class="tool-btn" id="palette-copy" data-arcade-focusable>COPY HEX</button>
        </div>
        <p class="tool-status" id="palette-status">Lock colors, then generate variants.</p>
      </div>
    `;

    this.status = this.container.querySelector('#palette-status');
    this.renderPalette();

    this.container.querySelector('#palette-exit')?.addEventListener('click', () => this.bus.emit('ARCADE_BACK'));
    this.container.querySelector('#palette-generate')?.addEventListener('click', () => this.regenerate());
    this.container.querySelector('#palette-copy')?.addEventListener('click', () => this.copyPalette());

    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.mountRoute('palettelab', this.container);
    }
  }

  generatePalette() {
    const base = Math.floor(Math.random() * 360);
    return [0, 34, 78, 146, 212].map((offset, idx) => {
      const hue = (base + offset) % 360;
      const saturation = idx === 4 ? 12 : 62 + (idx * 5);
      const lightness = idx === 0 ? 42 : 48 + (idx * 6);
      return this.hslToHex(hue, saturation, Math.min(lightness, 82));
    });
  }

  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `#${[f(0), f(8), f(4)].map(x => Math.round(255 * x).toString(16).padStart(2, '0')).join('')}`;
  }

  renderPalette() {
    const strip = this.container.querySelector('#palette-strip');
    strip.innerHTML = this.colors.map((color, idx) => `
      <div class="palette-color" style="background:${color}">
        <button class="palette-lock ${this.locks[idx] ? 'active' : ''}" data-idx="${idx}" aria-label="Toggle lock for ${color}" data-arcade-focusable>${this.locks[idx] ? 'LOCK' : 'OPEN'}</button>
        <button class="palette-hex" data-color="${color}" data-arcade-focusable>${color}</button>
      </div>
    `).join('');

    strip.querySelectorAll('.palette-lock').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        this.locks[idx] = !this.locks[idx];
        this.persist();
        this.renderPalette();
        this.audio.playTick();
      });
    });

    strip.querySelectorAll('.palette-hex').forEach(btn => {
      btn.addEventListener('click', () => this.copyText(btn.dataset.color, `Copied ${btn.dataset.color}.`));
    });
  }

  regenerate() {
    const next = this.generatePalette();
    this.colors = this.colors.map((color, idx) => this.locks[idx] ? color : next[idx]);
    this.persist();
    this.renderPalette();
    if (this.status) this.status.textContent = 'Generated a fresh palette.';
    this.audio.playSelect();
    this.bus.emit('PALETTE_GENERATED', { colors: [...this.colors] });
  }

  copyPalette() {
    this.copyText(this.colors.join(' '), 'Copied palette hex values.');
    this.bus.emit('PALETTE_EXPORTED');
  }

  copyText(text, message) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (this.status) this.status.textContent = message;
    this.audio.playSelect();
  }

  persist() {
    this.storage.set('palettelab_colors', this.colors);
    this.storage.set('palettelab_locks', this.locks);
  }

  destroy() {
    this.persist();
    this.container.innerHTML = '';
  }
}

// ============================================================================
// REGISTRATION
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  if (!window.ArcadeRegistry) return;
  
  ArcadeRegistry.register({
    id: 'reaction',
    title: 'Reaction Test',
    category: 'REFLEX / UTILITY',
    description: 'Test your reflexes in milliseconds.',
    icon: '⚡',
    status: 'ready',
    component: ReactionTestApp
  });

  ArcadeRegistry.register({
    id: 'snake',
    title: 'Neon Snake',
    category: 'RETRO ARCADE',
    description: 'Classic grid-based snake survival.',
    icon: '🐍',
    status: 'ready',
    component: NeonSnakeApp
  });
  
  ArcadeRegistry.register({
    id: 'breakout',
    title: 'Breakout',
    category: 'RETRO ARCADE',
    description: 'Classic brick breaker with paddle physics.',
    icon: '🔵',
    status: 'ready',
    component: BreakoutApp
  });
  
  ArcadeRegistry.register({
    id: 'pixelpad',
    title: 'Pixel Pad',
    category: 'CREATIVE TOOL',
    description: '12x12 retro canvas sketching tool.',
    icon: '🎨',
    status: 'ready',
    component: PixelPadToolApp
  });
  
  ArcadeRegistry.register({
    id: 'palettelab',
    title: 'Palette Lab',
    category: 'CREATIVE TOOL',
    description: 'Interactive hexadecimal color palette generator.',
    icon: '🧪',
    status: 'ready',
    component: PaletteLabToolApp
  });
});
