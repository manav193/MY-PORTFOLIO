import { ArcadeOutcomeScreen } from "./modules/arcade-outcome-screen.js";

export class PowerUpDefinition {
  constructor({ id, duration = 6000, icon = '◆', effect = '', activate = () => {}, deactivate = () => {} }) {
    Object.assign(this, { id, duration, icon, effect, activate, deactivate });
  }
}

function arcadeFrameStep(app, timestamp, gameId) {
  const previous = app._frameTimestamp || timestamp;
  app._frameTimestamp = timestamp;
  const seconds = Math.min(0.033, Math.max(0, (timestamp - previous) / 1000));
  const speedScale = window.ArcadeDeveloperMode?.getSpeedScale?.() || 1;
  return (seconds || 1 / 60) * 60 * speedScale;
}

function hasDevModifier(gameId, modifier) {
  return !!window.ArcadeDeveloperMode?.hasModifier?.(gameId, modifier);
}

function activateGameBuff(app, definition) {
  if (!definition || !app?.container) return;
  app.activeBuffs ||= new Map();
  const existing = app.activeBuffs.get(definition.id);
  if (existing?.timer) clearTimeout(existing.timer);
  definition.activate(app);
  const expiresAt = performance.now() + definition.duration;
  const timer = setTimeout(() => {
    definition.deactivate(app);
    app.activeBuffs.delete(definition.id);
    app.audio?.play?.('warning');
    renderGameBuffs(app);
  }, definition.duration);
  app.activeBuffs.set(definition.id, { definition, expiresAt, timer });
  app.audio?.playSequence?.([[460, 'triangle', 0.06, 0.035, 0, 820], [980, 'sine', 0.09, 0.04, 55]], { owner: app._rawAppId || 'game' });
  renderGameBuffs(app);
}

function renderGameBuffs(app) {
  if (!app?.container) return;
  let rail = app.container.querySelector('.game-buff-rail');
  if (!app.activeBuffs?.size) {
    rail?.remove();
    return;
  }
  if (!rail) {
    rail = document.createElement('div');
    rail.className = 'game-buff-rail';
    app.container.appendChild(rail);
  }
  rail.innerHTML = Array.from(app.activeBuffs.values()).map(({ definition, expiresAt }) => `
    <span title="${definition.effect}"><b>${definition.icon}</b>${definition.id.replace(/_/g, ' ')}<i style="--buff-duration:${definition.duration}ms"></i></span>
  `).join('');
}

function clearGameBuffs(app) {
  app.activeBuffs?.forEach(({ definition, timer }) => {
    clearTimeout(timer);
    definition.deactivate(app);
  });
  app.activeBuffs?.clear();
  app.container?.querySelector('.game-buff-rail')?.remove();
}

function markOutcome(app, kind, detail = '') {
  const target = app?.gameContainer || app?.container;
  if (!target) return;
  target.dataset.outcome = kind;
  target.classList.remove('game-outcome-impact', 'game-outcome-victory');
  void target.offsetWidth;
  target.classList.add(kind === 'victory' ? 'game-outcome-victory' : 'game-outcome-impact');
  if (detail) target.dataset.outcomeDetail = detail;
}

function addOutcomeHome(app) {
  if (!app?.overlay || app.overlay.querySelector('[data-outcome-home]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.outcomeHome = '';
  button.dataset.arcadeFocusable = '';
  button.className = 'game-outcome-home';
  button.textContent = 'HOME';
  button.addEventListener('click', () => window.ArcadeOS?.goHome());
  app.overlay.querySelector('div')?.appendChild(button);
}

if (typeof window !== 'undefined') {
  window.PowerUpDefinition = PowerUpDefinition;
  window.ArcadeGameFeel = { activateGameBuff, clearGameBuffs, arcadeFrameStep, markOutcome };
}

// ============================================================================
// 1. GAME: PAC-MAZE (Pac-Man style maze chase)
// ============================================================================
class PacMazeApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_pacmaze_best', 0);
    this.state = 'READY'; // READY, PLAYING, PAUSED, GAME_OVER, VICTORY
    this.active = false;
    this.destroyed = false;
    this.initialized = true;
    this.rafId = null;
    this.lastTime = 0;

    // Maze grid dimensions (19 cols x 17 rows)
    this.cols = 19;
    this.rows = 17;
    this.tileSize = 20;
    this.playfieldWidth = this.cols * this.tileSize; // 380
    this.playfieldHeight = this.rows * this.tileSize; // 340

    // Original Maze Layout (1: Wall, 0: Pellet, 2: Power Pellet, 9: Empty)
    this.baseGrid = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,9,1,9,1,1,1,0,1,1,1,1],
      [9,9,9,1,0,1,9,9,9,9,9,9,9,1,0,1,9,9,9],
      [1,1,1,1,0,1,9,1,1,9,1,1,9,1,0,1,1,1,1],
      [1,0,0,0,0,0,9,1,9,9,9,1,9,0,0,0,0,0,1],
      [1,0,1,1,0,1,9,1,1,1,1,1,9,1,0,1,1,0,1],
      [1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1],
      [1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,2,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    this.grid = JSON.parse(JSON.stringify(this.baseGrid));
    this.ghosts = [];
    this.player = { x: 9 * 20 + 10, y: 12 * 20 + 10, dx: 0, dy: 0, nextDx: 0, nextDy: 0, speed: 2 };
    this.frightenedTimer = 0;
    this.score = 0;
    this.lives = 3;
  }

  mount() {
    this.active = true;
    this.destroyed = false;
    this.container.innerHTML = `
      <div class="app-pacmaze" id="pacmaze-game-container" tabindex="0">
        <div id="pacmaze-hud" class="pacmaze-hud">
          <div class="hud-item">SCORE <span id="pm-score">0</span></div>
          <div class="hud-item">HI <span id="pm-high">${this.highScore}</span></div>
          <div class="hud-item">LIVES <span id="pm-lives">🟡🟡🟡</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="pacmaze-canvas"></canvas>
        </div>
        <div id="pacmaze-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#pacmaze-game-container');
    this.canvas = this.container.querySelector('#pacmaze-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#pacmaze-overlay-view');
    this.hudScore = this.container.querySelector('#pm-score');
    this.hudHigh = this.container.querySelector('#pm-high');
    this.hudLives = this.container.querySelector('#pm-lives');

    this.gameContainer.focus({ preventScroll: true });

    this.upHandler = () => this.setNextDir(0, -1);
    this.downHandler = () => this.setNextDir(0, 1);
    this.leftHandler = () => this.setNextDir(-1, 0);
    this.rightHandler = () => this.setNextDir(1, 0);
    this.confirmHandler = () => this.handleConfirm();

    this.bus.on('ARCADE_UP', this.upHandler);
    this.bus.on('ARCADE_DOWN', this.downHandler);
    this.bus.on('ARCADE_LEFT', this.leftHandler);
    this.bus.on('ARCADE_RIGHT', this.rightHandler);
    this.bus.on('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.on('ARCADE_ACTION_A', this.confirmHandler);

    this.keydownHandler = (e) => {
      if (!this.active || this.state !== 'PLAYING') return;
      if (e.key === 'ArrowUp' || e.key === 'w') this.setNextDir(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') this.setNextDir(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') this.setNextDir(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') this.setNextDir(1, 0);
      if (e.key === 'Escape') this.togglePause();
    };
    document.addEventListener('keydown', this.keydownHandler);

    this.transitionToState('READY');

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);
  }

  resizeCanvas() {
    if (!this.canvas || !this.active || this.destroyed || !this.grid || !this.grid[0]) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  setNextDir(dx, dy) {
    if (this.state === 'PLAYING') {
      this.player.nextDx = dx;
      this.player.nextDy = dy;
    }
  }

  handleConfirm() {
    if (this.state === 'READY' || this.state === 'GAME_OVER' || this.state === 'VICTORY') {
      this.start();
    } else if (this.state === 'PAUSED') {
      this.resume();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') this.pause();
    else if (this.state === 'PAUSED') this.resume();
  }

  pause() {
    this.state = 'PAUSED';
    this.cancelLoop();
    this.stopMazeAmbience();
    this.overlay.className = 'pacmaze-overlay-active';
    this.overlay.innerHTML = `
      <div class="pacmaze-menu">
        <h2>PAUSED</h2>
        <button class="pacmaze-btn primary" id="pm-resume">RESUME</button>
        <button class="pacmaze-btn" id="pm-exit">EXIT</button>
      </div>
    `;
    const pmResume = this.overlay.querySelector('#pm-resume');
    if (pmResume) pmResume.onclick = () => this.resume();
    const pmExit = this.overlay.querySelector('#pm-exit');
    if (pmExit) pmExit.onclick = () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome();
  }

  resume() {
    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.lastTime = performance.now();
    this.startMazeAmbience();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'pacmaze-overlay-active';
      this.overlay.innerHTML = `
        <div class="pacmaze-menu">
          <div class="pacmaze-logo">🟡</div>
          <h2>PAC-MAZE</h2>
          <p>Eat all dots. Avoid ghosts. Eat Power Pellets to hunt ghosts!</p>
          <div class="pacmaze-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="pacmaze-btn primary" id="pm-start">START GAME</button>
          <button class="pacmaze-btn" id="pm-exit">EXIT</button>
        </div>
      `;
      const pmStart = this.overlay.querySelector('#pm-start');
      if (pmStart) pmStart.onclick = () => this.start();
      const pmExit = this.overlay.querySelector('#pm-exit');
      if (pmExit) pmExit.onclick = () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome();
    }
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.level = this.level || 1;
    this.grid = JSON.parse(JSON.stringify(this.baseGrid));

    this.player = {
      x: 9 * this.tileSize + 10,
      y: 12 * this.tileSize + 10,
      dx: 0,
      dy: 0,
      nextDx: -1,
      nextDy: 0,
      speed: 2.42 + Math.min(0.32, (this.level - 1) * 0.06),
      mouthAngle: 0.2
    };

    this.ghosts = [
      { name: 'Blinky', color: '#ef4444', x: 9 * this.tileSize + 10, y: 6 * this.tileSize + 10, dx: 1, dy: 0, speed: 1.95 + this.level * 0.04, mode: 'CHASE', houseState: 'ACTIVE', releaseAt: 0 },
      { name: 'Pinky', color: '#ec4899', x: 8 * this.tileSize + 10, y: 8 * this.tileSize + 10, dx: 0, dy: -1, speed: 1.82 + this.level * 0.04, mode: 'AMBUSH', houseState: 'HOUSE', releaseAt: 700 },
      { name: 'Inky', color: '#06b6d4', x: 9 * this.tileSize + 10, y: 8 * this.tileSize + 10, dx: -1, dy: 0, speed: 1.72 + this.level * 0.04, mode: 'PATROL', houseState: 'HOUSE', releaseAt: 1850 },
      { name: 'Clyde', color: '#f97316', x: 10 * this.tileSize + 10, y: 8 * this.tileSize + 10, dx: -1, dy: 0, speed: 1.62 + this.level * 0.04, mode: 'ERRATIC', houseState: 'HOUSE', releaseAt: 3100 }
    ];

    this.frightenedTimer = 0;
    this.updateHud();
    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.lastTime = performance.now();
    this.roundStartedAt = this.lastTime;
    this.startMazeAmbience();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    this.bus.emit('GAME_LAUNCHED', { id: 'pacmaze' });
  }

  updateHud() {
    if (this.hudScore) this.hudScore.textContent = this.score;
    if (this.hudHigh) this.hudHigh.textContent = Math.max(this.score, this.highScore);
    if (this.hudLives) this.hudLives.textContent = '🟡'.repeat(Math.max(0, this.lives));
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));

    const dt = Math.min(33, timestamp - this.lastTime) * (window.ArcadeDeveloperMode?.getSpeedScale?.() || 1);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();
  }

  update(dt) {
    const step = Math.max(0.25, dt / (1000 / 60));
    const p = this.player;
    const tileX = Math.floor(p.x / this.tileSize);
    const tileY = Math.floor(p.y / this.tileSize);
    const centerX = tileX * this.tileSize + this.tileSize / 2;
    const centerY = tileY * this.tileSize + this.tileSize / 2;

    if (Math.abs(p.x - centerX) < 2 && Math.abs(p.y - centerY) < 2) {
      if (this.canMove(tileX + p.nextDx, tileY + p.nextDy)) {
        p.dx = p.nextDx;
        p.dy = p.nextDy;
        p.x = centerX;
        p.y = centerY;
      }
    }

    if (this.canMove(tileX + p.dx, tileY + p.dy) || Math.abs(p.x - centerX) > 2 || Math.abs(p.y - centerY) > 2) {
      const speedBoost = (this.pacSpeedBurst || hasDevModifier('pacmaze', 'speed')) ? 1.28 : 1;
      p.x += p.dx * p.speed * speedBoost * step;
      p.y += p.dy * p.speed * speedBoost * step;
    }

    if (p.x < 0) p.x = this.playfieldWidth;
    if (p.x > this.playfieldWidth) p.x = 0;

    const curTileX = Math.floor(p.x / this.tileSize);
    const curTileY = Math.floor(p.y / this.tileSize);
    if (curTileX >= 0 && curTileX < this.cols && curTileY >= 0 && curTileY < this.rows) {
      const val = this.grid[curTileY][curTileX];
      if (val === 0) {
        this.grid[curTileY][curTileX] = 9;
        this.score += 10 * (this.pacScoreSurge ? 2 : 1);
        this.audio.playGameSfx('pacmaze', 'pellet');
        this.updateHud();
      } else if (val === 2) {
        this.grid[curTileY][curTileX] = 9;
        this.score += 50;
        this.frightenedTimer = 350;
        this.audio.playGameSfx('pacmaze', 'power');
        const buff = this.score % 400 === 0
          ? new PowerUpDefinition({ id: 'score_surge', icon: '×2', effect: 'Double scoring', activate: app => { app.pacScoreSurge = true; }, deactivate: app => { app.pacScoreSurge = false; } })
          : new PowerUpDefinition({ id: 'speed_burst', icon: '»', effect: 'Faster maze movement', activate: app => { app.pacSpeedBurst = true; }, deactivate: app => { app.pacSpeedBurst = false; } });
        activateGameBuff(this, buff);
        if (this.score > 0 && this.score % 2000 === 0) this.lives++;
        this.updateHud();
      }
    }

    if (this.frightenedTimer > 0) this.frightenedTimer -= step;

    this.ghosts.forEach(g => {
      const gTileX = Math.floor(g.x / this.tileSize);
      const gTileY = Math.floor(g.y / this.tileSize);
      const gCenterX = gTileX * this.tileSize + this.tileSize / 2;
      const gCenterY = gTileY * this.tileSize + this.tileSize / 2;

      if (Math.abs(g.x - gCenterX) < 2 && Math.abs(g.y - gCenterY) < 2) {
        const elapsed = performance.now() - this.roundStartedAt;
        if (g.houseState === 'HOUSE' && elapsed >= g.releaseAt) {
          // The house door is reached through the open column at (8, 7).
          // Move to that column first, then force upward until the maze lane.
          if (gTileY >= 8 && gTileX !== 8) {
            g.dx = gTileX > 8 ? -1 : 1;
            g.dy = 0;
          } else if (gTileY > 6) {
            g.dx = 0;
            g.dy = -1;
          } else {
            g.houseState = 'ACTIVE';
            g.dx = 1;
            g.dy = 0;
          }
        } else if (g.houseState === 'ACTIVE') {
          const dirs = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
          ].filter(d => !(d.dx === -g.dx && d.dy === -g.dy) && this.canMove(gTileX + d.dx, gTileY + d.dy));

          if (dirs.length > 0) {
            const chosen = dirs[Math.floor(Math.random() * dirs.length)];
            g.dx = chosen.dx;
            g.dy = chosen.dy;
          } else {
            g.dx = -g.dx;
            g.dy = -g.dy;
          }
        } else {
          g.dx = 0;
          g.dy = 0;
        }
      }
      const ghostFrozen = hasDevModifier('pacmaze', 'freeze_ghosts');
      const ghostSpeed = ghostFrozen ? 0 : (this.frightenedTimer > 0 ? g.speed * 0.58 : g.speed);
      g.x += g.dx * ghostSpeed * step;
      g.y += g.dy * ghostSpeed * step;

      const dist = Math.hypot(p.x - g.x, p.y - g.y);
      if (dist < 12) {
        if (this.frightenedTimer > 0) {
          this.score += 200;
          g.x = 9 * this.tileSize + 10;
          g.y = 8 * this.tileSize + 10;
          g.dx = -1;
          g.dy = 0;
          g.houseState = 'HOUSE';
          g.releaseAt = performance.now() - this.roundStartedAt + 1200;
          this.audio.playGameSfx('pacmaze', 'ghost');
          this.updateHud();
        } else if (!hasDevModifier('pacmaze', 'invincible')) {
          this.lives--;
          this.audio.playGameSfx('pacmaze', 'defeat');
          this.updateHud();
          if (this.lives <= 0) {
            this.gameOver();
          } else {
            p.x = 9 * this.tileSize + 10;
            p.y = 12 * this.tileSize + 10;
          }
        }
      }
    });
    if (this.gameContainer) {
      this.gameContainer.dataset.ghostsInHouse = String(this.ghosts.filter(g => g.houseState === 'HOUSE').length);
    }

    let remainingDots = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 0 || this.grid[r][c] === 2) remainingDots++;
      }
    }
    if (remainingDots === 0) {
      this.victory();
    }
  }

  canMove(tx, ty) {
    if (ty < 0 || ty >= this.rows) return false;
    if (tx < 0 || tx >= this.cols) return ty === 8;
    return this.grid[ty][tx] !== 1;
  }

  gameOver() {
    this.cancelLoop();
    this.stopMazeAmbience();
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'maze-collapse');
    this.state = 'GAME_OVER';

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('pacmaze'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_pacmaze_best', this.highScore);
    }
    this.bus.emit('PACMAZE_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'pacmaze' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'pacmaze',
      outcome: 'GAME_OVER',
      title: 'GAME OVER',
      subtitle: 'PAC-MAN WAS DEFEATED',
      accentColor: '#f43f5e',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'BEST', value: this.highScore },
        { label: 'MAZE', value: this.level || 1 }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  victory() {
    this.cancelLoop();
    this.stopMazeAmbience();
    clearGameBuffs(this);
    markOutcome(this, 'victory', 'maze-cleared');
    this.state = 'VICTORY';

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('pacmaze'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_pacmaze_best', this.highScore);
    }
    this.bus.emit('PACMAZE_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'pacmaze' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'pacmaze',
      outcome: 'MAZE_CLEARED',
      title: 'MAZE CLEARED!',
      subtitle: 'ALL PELLETS CONSUMED',
      accentColor: '#eab308',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'FINAL SCORE', value: this.score, highlight: true },
        { label: 'BONUS', value: 500 },
        { label: 'BEST', value: this.highScore }
      ],
      onNext: () => {
        this.level = (this.level || 1) + 1;
        this.start();
      },
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.grid || !this.grid[0]) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#060a14';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.tileSize;
        const y = r * this.tileSize;
        const val = this.grid[r][c];

        if (val === 1) {
          this.ctx.fillStyle = '#0f172a';
          this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

          this.ctx.shadowColor = '#3b82f6';
          this.ctx.shadowBlur = 5;
          this.ctx.strokeStyle = '#3b82f6';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
          this.ctx.shadowBlur = 0;
        } else if (val === 0) {
          this.ctx.fillStyle = '#fde047';
          this.ctx.shadowColor = '#fde047';
          this.ctx.shadowBlur = 4;
          this.ctx.beginPath();
          this.ctx.arc(x + 10, y + 10, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        } else if (val === 2) {
          const pulse = 6 + 1.5 * Math.sin(performance.now() / 150);
          this.ctx.fillStyle = '#facc15';
          this.ctx.shadowColor = '#facc15';
          this.ctx.shadowBlur = 12;
          this.ctx.beginPath();
          this.ctx.arc(x + 10, y + 10, pulse, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
    }

    const p = this.player;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);

    let angle = 0;
    if (p.dx === -1) angle = Math.PI;
    else if (p.dy === -1) angle = -Math.PI / 2;
    else if (p.dy === 1) angle = Math.PI / 2;
    this.ctx.rotate(angle);

    const mouth = 0.2 + 0.15 * Math.sin(performance.now() / 60);

    this.ctx.fillStyle = '#facc15';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 8, mouth * Math.PI, (2 - mouth) * Math.PI);
    this.ctx.lineTo(0, 0);
    this.ctx.fill();
    this.ctx.restore();
    this.ghosts.forEach(g => {
      this.ctx.fillStyle = this.frightenedTimer > 0 ? '#2563eb' : g.color;
      this.ctx.beginPath();
      this.ctx.arc(g.x, g.y - 2, 7, Math.PI, 0, false);
      this.ctx.lineTo(g.x + 7, g.y + 6);
      this.ctx.lineTo(g.x - 7, g.y + 6);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(g.x - 3, g.y - 3, 2.5, 0, Math.PI * 2);
      this.ctx.arc(g.x + 3, g.y - 3, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(g.x - 3 + g.dx, g.y - 3 + g.dy, 1.2, 0, Math.PI * 2);
      this.ctx.arc(g.x + 3 + g.dx, g.y - 3 + g.dy, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  startMazeAmbience() {
    this.stopMazeAmbience();
    let step = 0;
    this.mazeAmbienceTimer = window.setInterval(() => {
      if (!this.active || this.state !== 'PLAYING') return;
      if (!this.audio.ctx || this.audio.ctx.state !== 'running') return;
      const moving = this.player && (this.player.dx || this.player.dy);
      if (!moving) return;
      const notes = [146.83, 174.61, 164.81, 196.0];
      this.audio.playTone(notes[step++ % notes.length], 'triangle', 0.055, 0.018, { owner: 'pacmaze', cooldownKey: 'pacmaze:movement', cooldown: 240 });
    }, 280);
  }

  stopMazeAmbience() {
    if (this.mazeAmbienceTimer) {
      window.clearInterval(this.mazeAmbienceTimer);
      this.mazeAmbienceTimer = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    this.stopMazeAmbience();
    document.removeEventListener('keydown', this.keydownHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
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
// 2. GAME: PIXEL PLUMBER (Mario-style platformer)
// ============================================================================
class PixelPlumberApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_plumber_best', 0);
    this.state = 'READY';
    this.active = false;
    this.destroyed = false;
    this.rafId = null;
    this.lastTime = 0;

    this.playfieldWidth = 640;
    this.playfieldHeight = 300;
    this.worldWidth = 4800;

    this.keys = { left: false, right: false, jump: false, jumpPressed: false };
    this.inputPulse = { left: 0, right: 0 };
    this.score = 0;
    this.coins = 0;
    this.elapsedTime = 0;

    this.checkpointReached = false;
    this.checkpointX = 30;
    this.checkpointY = 220;
    this.checkpointLives = 2;

    this.createLevel();
  }

  createLevel() {
    this.worldWidth = 4800;

    this.platforms = [
      { x: 0, y: 260, w: 900, h: 40 },
      { x: 200, y: 200, w: 90, h: 16 },
      { x: 360, y: 160, w: 90, h: 16 },
      { x: 550, y: 200, w: 100, h: 16 },

      { x: 1020, y: 260, w: 450, h: 40 },
      { x: 1080, y: 190, w: 90, h: 16 },
      { x: 1220, y: 140, w: 100, h: 16 },
      { x: 1380, y: 190, w: 90, h: 16 },

      { x: 1620, y: 260, w: 500, h: 40 },
      { x: 1750, y: 180, w: 90, h: 16 },
      { x: 1920, y: 130, w: 100, h: 16 },
      { x: 2100, y: 180, w: 90, h: 16 },
      { x: 2260, y: 260, w: 540, h: 40 },
      { x: 2380, y: 190, w: 90, h: 16 },
      { x: 2520, y: 140, w: 100, h: 16 },

      { x: 2940, y: 260, w: 400, h: 40 },
      { x: 2980, y: 190, w: 80, h: 16 },
      { x: 3100, y: 130, w: 80, h: 16 },
      { x: 3240, y: 80, w: 110, h: 16 },
      { x: 3400, y: 130, w: 90, h: 16 },
      { x: 3550, y: 180, w: 100, h: 16 },

      { x: 3920, y: 260, w: 880, h: 40 },
      { x: 4020, y: 190, w: 90, h: 16 },
      { x: 4180, y: 140, w: 100, h: 16 },
      { x: 4320, y: 190, w: 90, h: 16 },

      { x: 4440, y: 230, w: 30, h: 30 },
      { x: 4470, y: 200, w: 30, h: 60 },
      { x: 4500, y: 170, w: 30, h: 90 }
    ];

    this.coinsList = [
      { x: 220, y: 170, taken: false }, { x: 245, y: 170, taken: false },
      { x: 380, y: 130, taken: false }, { x: 405, y: 130, taken: false },
      { x: 575, y: 170, taken: false }, { x: 750, y: 230, taken: false },
      { x: 1100, y: 160, taken: false }, { x: 1125, y: 160, taken: false },
      { x: 1250, y: 110, taken: false }, { x: 1275, y: 110, taken: false },
      { x: 1400, y: 160, taken: false }, { x: 1520, y: 230, taken: false },
      { x: 1770, y: 150, taken: false }, { x: 1940, y: 100, taken: false },
      { x: 1970, y: 100, taken: false }, { x: 2120, y: 150, taken: false },
      { x: 2220, y: 230, taken: false }, { x: 2400, y: 160, taken: false },
      { x: 2540, y: 110, taken: false }, { x: 2700, y: 230, taken: false },
      { x: 3000, y: 160, taken: false }, { x: 3120, y: 100, taken: false },
      { x: 3260, y: 50, taken: false },  { x: 3295, y: 50, taken: false },
      { x: 3420, y: 100, taken: false }, { x: 3570, y: 150, taken: false },
      { x: 4040, y: 160, taken: false }, { x: 4200, y: 110, taken: false },
      { x: 4225, y: 110, taken: false }, { x: 4340, y: 160, taken: false },
      { x: 4455, y: 200, taken: false }, { x: 4485, y: 170, taken: false }
    ];

    this.enemies = [
      { x: 420, y: 244, w: 16, h: 16, vx: -1.0, minX: 280, maxX: 650, active: true },
      { x: 1150, y: 244, w: 16, h: 16, vx: -1.2, minX: 1030, maxX: 1350, active: true },
      { x: 1240, y: 124, w: 16, h: 16, vx: -1.0, minX: 1220, maxX: 1315, active: true },
      { x: 1780, y: 244, w: 16, h: 16, vx: -1.1, minX: 1640, maxX: 2000, active: true },
      { x: 2000, y: 244, w: 16, h: 16, vx: 1.2, minX: 1850, maxX: 2100, active: true },
      { x: 2450, y: 244, w: 16, h: 16, vx: -1.2, minX: 2300, maxX: 2700, active: true },
      { x: 3050, y: 244, w: 16, h: 16, vx: -1.1, minX: 2950, maxX: 3300, active: true },
      { x: 3260, y: 64, w: 16, h: 16, vx: -0.9, minX: 3240, maxX: 3340, active: true },
      { x: 4080, y: 244, w: 16, h: 16, vx: -1.3, minX: 3940, maxX: 4300, active: true },
      { x: 4200, y: 124, w: 16, h: 16, vx: -1.0, minX: 4180, maxX: 4275, active: true },
      { x: 4350, y: 244, w: 16, h: 16, vx: 1.2, minX: 4250, maxX: 4420, active: true }
    ];

    this.checkpointObj = { x: 2200, y: 100, w: 8, h: 160, reached: false };
    this.flag = { x: 4550, y: 90, w: 8, h: 170 };
    this.player = { x: 30, y: 220, w: 16, h: 22, vx: 0, vy: 0, grounded: false, coyoteTimer: 0 };
    this.cameraX = 0;
  }

  mount() {
    this.active = true;
    this.destroyed = false;
    this.container.innerHTML = `
      <div class="app-pixelplumber" id="plumber-game-container" tabindex="0">
        <div id="plumber-hud" class="plumber-hud">
          <div class="hud-item">SCORE <span id="pp-score">0</span></div>
          <div class="hud-item">COINS <span id="pp-coins">🪙 0</span></div>
          <div class="hud-item">TIME <span id="pp-time">00:00</span></div>
          <div class="hud-item">PROGRESS <span id="pp-prog">0%</span></div>
          <div class="hud-item">HI <span id="pp-high">${this.highScore}</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="plumber-canvas"></canvas>
        </div>
        <div id="plumber-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#plumber-game-container');
    this.canvas = this.container.querySelector('#plumber-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#plumber-overlay-view');
    this.hudScore = this.container.querySelector('#pp-score');
    this.hudCoins = this.container.querySelector('#pp-coins');
    this.hudTime = this.container.querySelector('#pp-time');
    this.hudProg = this.container.querySelector('#pp-prog');

    this.gameContainer.focus({ preventScroll: true });

    this.leftHandler = () => { this.inputPulse.left = 3; };
    this.rightHandler = () => { this.inputPulse.right = 3; };
    this.jumpHandler = () => this.triggerJump();

    this.bus.on('ARCADE_LEFT', this.leftHandler);
    this.bus.on('ARCADE_RIGHT', this.rightHandler);
    this.bus.on('ARCADE_CONFIRM', () => this.handleConfirm());
    this.bus.on('ARCADE_ACTION_A', () => this.triggerJump());

    this.keydownHandler = (e) => {
      if (!this.active || this.destroyed) return;
      const key = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S', ' '].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.left = true;
        if (key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.right = true;
        if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') {
          this.keys.jump = true;
          this.keys.jumpPressed = true;
          this.triggerJump();
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
    };

    this.keyupHandler = (e) => {
      if (!this.active || this.destroyed) return;
      const key = e.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.left = false;
      if (key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.right = false;
      if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') this.keys.jump = false;
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);

    this.transitionToState('READY');

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);
  }

  resizeCanvas() {
    if (!this.canvas || !this.active || this.destroyed || !this.platforms) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  handleConfirm() {
    if (this.state === 'READY' || this.state === 'GAME_OVER' || this.state === 'VICTORY') this.start();
    else if (this.state === 'PAUSED') this.resume();
  }

  triggerJump() {
    if (this.state !== 'PLAYING') {
      this.handleConfirm();
      return;
    }
    this.jumpBufferTimer = 6;
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.cancelLoop();
      this.overlay.className = 'plumber-overlay-active';
      this.overlay.innerHTML = `
        <div class="plumber-menu">
          <h2>PAUSED</h2>
          <button class="plumber-btn primary" id="pp-resume">RESUME</button>
          <button class="plumber-btn" id="pp-exit">EXIT</button>
        </div>
      `;
      const ppResume = this.overlay.querySelector('#pp-resume');
      if (ppResume) ppResume.onclick = () => this.resume();
      const ppExit = this.overlay.querySelector('#pp-exit');
      if (ppExit) ppExit.onclick = () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome();
    } else if (this.state === 'PAUSED') {
      this.resume();
    }
  }

  resume() {
    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'plumber-overlay-active';
      this.overlay.innerHTML = `
        <div class="plumber-menu">
          <div class="plumber-logo">🍄</div>
          <h2>PIXEL PLUMBER</h2>
          <p>Run, jump platforms, collect coins & reach the flag!</p>
          <div class="plumber-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="plumber-btn primary" id="pp-start">START RUN</button>
          <button class="plumber-btn" id="pp-exit">EXIT</button>
        </div>
      `;
      const ppStart = this.overlay.querySelector('#pp-start');
      if (ppStart) ppStart.onclick = () => this.start();
      const ppExit = this.overlay.querySelector('#pp-exit');
      if (ppExit) ppExit.onclick = () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome();
    }
  }

  start() {
    this.score = 0;
    this.coins = 0;
    this.elapsedTime = 0;
    this.checkpointReached = false;
    this.checkpointX = 30;
    this.checkpointY = 220;
    this.checkpointLives = 2;

    this.createLevel();

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    this.bus.emit('GAME_LAUNCHED', { id: 'pixelplumber' });
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));

    const dt = Math.min(33, timestamp - this.lastTime) * (window.ArcadeDeveloperMode?.getSpeedScale?.() || 1);
    this.lastTime = timestamp;

    this.update(Math.max(0.25, dt / (1000 / 60)));
    this.draw();
  }

  update(step = 1) {
    const p = this.player;
    this.elapsedTime += (step / 60);

    const leftHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('LEFT') || this.inputPulse.left > 0 || this.keys.left) : this.keys.left;
    const rightHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('RIGHT') || this.inputPulse.right > 0 || this.keys.right) : this.keys.right;
    this.inputPulse.left = Math.max(0, this.inputPulse.left - 1);
    this.inputPulse.right = Math.max(0, this.inputPulse.right - 1);

    const jumpPressed = window.ArcadeInput ? (window.ArcadeInput.wasPressed('ACTION') || window.ArcadeInput.wasPressed('UP') || this.keys.jumpPressed) : this.keys.jumpPressed;
    const jumpHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('ACTION') || window.ArcadeInput.isDown('UP') || this.keys.jump) : this.keys.jump;

    const buffSpeed = this.plumberSpeedBoost || hasDevModifier('pixelplumber', 'speed') ? 1.24 : 1;
    const accel = 0.58 * step;
    const maxSpeed = 4.35 * buffSpeed;
    const friction = Math.pow(0.76, step);

    if (rightHeld && !leftHeld) {
      p.vx = Math.min(maxSpeed, p.vx + accel * (p.vx < 0 ? 2.5 : 1));
      p.dx = 1;
    } else if (leftHeld && !rightHeld) {
      p.vx = Math.max(-maxSpeed, p.vx - accel * (p.vx > 0 ? 2.5 : 1));
      p.dx = -1;
    } else {
      p.vx *= friction;
      if (Math.abs(p.vx) < 0.05) p.vx = 0;
    }

    if (p.grounded) {
      p.coyoteTimer = 6;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    if (jumpPressed) {
      this.jumpBufferTimer = 8;
      this.keys.jumpPressed = false;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    if (this.jumpBufferTimer > 0 && (p.coyoteTimer > 0 || ((this.plumberDoubleJump || hasDevModifier('pixelplumber', 'double_jump')) && !p.doubleJumpUsed))) {
      p.vy = -9.8;
      if (p.coyoteTimer <= 0) p.doubleJumpUsed = true;
      p.grounded = false;
      p.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.audio.playGameSfx('pixelplumber', 'jump');
    }

    if (!jumpHeld && p.vy < -2.0) {
      p.vy *= 0.55;
    }

    p.vy += 0.58 * step;
    this.movePlayerWithCollisions(p, step);
    if (p.grounded) p.doubleJumpUsed = false;

    const targetCamX = Math.max(0, Math.min(this.worldWidth - this.playfieldWidth, p.x - this.playfieldWidth * 0.35));
    this.cameraX += (targetCamX - this.cameraX) * 0.12;

    this.coinsList.forEach(c => {
      if (!c.taken && Math.hypot(p.x + 8 - c.x, p.y + 11 - c.y) < 18) {
        c.taken = true;
        this.coins++;
        this.score += 100;
        this.audio.playGameSfx('pixelplumber', 'coin');

        if (this.coins % 5 === 0) {
          const buffs = [
            new PowerUpDefinition({ id: 'speed_boost', icon: '»', effect: 'Run boost', activate: app => { app.plumberSpeedBoost = true; }, deactivate: app => { app.plumberSpeedBoost = false; } }),
            new PowerUpDefinition({ id: 'double_jump', icon: '⇈', effect: 'One extra air jump', activate: app => { app.plumberDoubleJump = true; }, deactivate: app => { app.plumberDoubleJump = false; } }),
            new PowerUpDefinition({ id: 'shield', icon: '◇', effect: 'Absorb one hit', activate: app => { app.plumberShield = true; }, deactivate: app => { app.plumberShield = false; } })
          ];
          activateGameBuff(this, buffs[(Math.floor(this.coins / 5) - 1) % buffs.length]);
        }
      }
    });

    this.enemies.forEach(e => {
      if (!e.active) return;
      e.x += e.vx * step;
      if (e.x <= e.minX) {
        e.x = e.minX;
        e.vx = Math.abs(e.vx);
      } else if (e.x >= e.maxX) {
        e.x = e.maxX;
        e.vx = -Math.abs(e.vx);
      }
      e.dir = e.vx > 0 ? 1 : -1;

      if (p.x + p.w > e.x && p.x < e.x + e.w && p.y + p.h > e.y && p.y < e.y + e.h) {
        if (p.vy > 0 && p.y + p.h < e.y + 10) {
          e.active = false;
          p.vy = -6.5;
          this.score += 200;
          this.audio.playGameSfx('pixelplumber', 'stomp');
        } else {
          if (this.plumberShield || hasDevModifier('pixelplumber', 'invincible')) {
            this.plumberShield = false;
            e.active = false;
            renderGameBuffs(this);
          } else {
            this.handlePlayerDeath();
          }
        }
      }
    });

    if (!this.checkpointReached && p.x >= this.checkpointObj.x) {
      this.checkpointReached = true;
      this.checkpointObj.reached = true;
      this.checkpointX = this.checkpointObj.x;
      this.checkpointY = 200;
      this.audio.playGameSfx('pixelplumber', 'powerup', { cooldown: 200 });
    }

    if (p.x >= this.flag.x) {
      this.victory();
    }

    if (p.y > 340) {
      this.handlePlayerDeath();
    }

    const totalSecs = Math.floor(this.elapsedTime);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    if (this.hudTime) this.hudTime.textContent = `${mins}:${secs}`;

    const progPct = Math.min(100, Math.floor((p.x / this.flag.x) * 100));
    if (this.hudProg) this.hudProg.textContent = `${progPct}%`;

    if (this.hudCoins) this.hudCoins.textContent = `🪙 ${this.coins}`;
    if (this.hudScore) this.hudScore.textContent = this.score;

    if (this.gameContainer) {
      this.gameContainer.dataset.playerX = String(Number(p.x.toFixed(2)));
      this.gameContainer.dataset.playerY = String(Number(p.y.toFixed(2)));
      this.gameContainer.dataset.grounded = String(Boolean(p.grounded));
      this.gameContainer.dataset.playerVx = String(Number(p.vx.toFixed(2)));
      this.gameContainer.dataset.gameState = this.state;
      this.gameContainer.dataset.checkpointReached = String(this.checkpointReached);
    }
  }

  handlePlayerDeath() {
    if (this.checkpointReached && this.checkpointLives > 0) {
      this.checkpointLives--;
      this.player.x = this.checkpointX;
      this.player.y = this.checkpointY;
      this.player.vx = 0;
      this.player.vy = 0;
      this.audio.playGameSfx('pixelplumber', 'stomp');
    } else {
      this.gameOver();
    }
  }

  movePlayerWithCollisions(player, step = 1) {
    const overlaps = (a, b) => (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
    const moveAxis = (axis, amount) => {
      const steps = Math.max(1, Math.ceil(Math.abs(amount) / 3));
      const delta = amount / steps;
      for (let step = 0; step < steps; step++) {
        player[axis] += delta;
        for (const solid of this.platforms) {
          if (!overlaps(player, solid)) continue;
          if (axis === 'x') {
            player.x = delta > 0 ? solid.x - player.w : solid.x + solid.w;
            player.vx = 0;
          } else {
            if (delta > 0) {
              player.y = solid.y - player.h;
              player.grounded = true;
            } else {
              player.y = solid.y + solid.h;
            }
            player.vy = 0;
          }
        }
      }
    };

    player.grounded = false;
    if (hasDevModifier('pixelplumber', 'no_clip_debug')) {
      player.x += player.vx * step;
      player.y += player.vy * step;
      return;
    }
    moveAxis('x', player.vx * step);
    moveAxis('y', player.vy * step);
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'plumber-impact');
    this.audio.playGameSfx('pixelplumber', 'defeat');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('pixelplumber'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_plumber_best', this.highScore);
    }
    this.bus.emit('PIXELPLUMBER_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'pixelplumber' });

    const totalSecs = Math.floor(this.elapsedTime);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    const progPct = Math.min(100, Math.floor((this.player.x / this.flag.x) * 100));

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'pixelplumber',
      outcome: 'GAME_OVER',
      title: 'GAME OVER',
      subtitle: 'PLUMBER FELL IN ACTION',
      accentColor: '#ef4444',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'COINS', value: this.coins || 0 },
        { label: 'PROGRESS', value: `${progPct}%` },
        { label: 'TIME', value: `${mins}:${secs}` },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  victory() {
    this.cancelLoop();
    this.state = 'VICTORY';
    clearGameBuffs(this);
    markOutcome(this, 'victory', 'level-complete');
    this.score += 1000;
    this.audio.playGameSfx('pixelplumber', 'victory');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('pixelplumber'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_plumber_best', this.highScore);
    }
    this.bus.emit('PIXELPLUMBER_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'pixelplumber' });

    const totalSecs = Math.floor(this.elapsedTime);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'pixelplumber',
      outcome: 'LEVEL_COMPLETE',
      title: 'LEVEL COMPLETE!',
      subtitle: `FLAGPOLE REACHED IN ${mins}:${secs}`,
      accentColor: '#10b981',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'FINAL SCORE', value: this.score, highlight: true },
        { label: 'COINS', value: this.coins || 0 },
        { label: 'TIME', value: `${mins}:${secs}` },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.platforms) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);
    this.ctx.translate(-Math.floor(this.cameraX), 0);

    this.platforms.forEach(plat => {
      if (plat.x + plat.w < this.cameraX - 50 || plat.x > this.cameraX + this.playfieldWidth + 50) return;

      this.ctx.fillStyle = '#14532d';
      this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      this.ctx.shadowColor = '#22c55e';
      this.ctx.shadowBlur = 4;
      this.ctx.strokeStyle = '#22c55e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#16a34a';
      this.ctx.fillRect(plat.x + 2, plat.y + 2, plat.w - 4, plat.h - 4);
    });

    const time = performance.now();
    this.coinsList.forEach(c => {
      if (!c.taken && c.x >= this.cameraX - 30 && c.x <= this.cameraX + this.playfieldWidth + 30) {
        this.ctx.fillStyle = '#facc15';
        this.ctx.shadowColor = '#facc15';
        this.ctx.shadowBlur = 8;

        const width = 5 * Math.abs(Math.cos(time / 200 + c.x));
        this.ctx.beginPath();
        this.ctx.ellipse(c.x, c.y, width, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    });

    this.enemies.forEach(e => {
      if (e.active && e.x >= this.cameraX - 30 && e.x <= this.cameraX + this.playfieldWidth + 30) {
        this.ctx.fillStyle = '#7f1d1d';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 6;
        this.ctx.fillRect(e.x, e.y, e.w, e.h);
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(e.x, e.y, e.w, e.h);

        this.ctx.fillStyle = '#fca5a5';
        const eyeOffset = (e.dir || -1) * 2;
        this.ctx.fillRect(e.x + 4 + eyeOffset, e.y + 4, 3, 3);
        this.ctx.fillRect(e.x + 10 + eyeOffset, e.y + 4, 3, 3);
      }
    });

    if (this.checkpointObj && this.checkpointObj.x >= this.cameraX - 50 && this.checkpointObj.x <= this.cameraX + this.playfieldWidth + 50) {
      const cp = this.checkpointObj;
      this.ctx.fillStyle = cp.reached ? '#10b981' : '#3b82f6';
      this.ctx.shadowColor = cp.reached ? '#10b981' : '#3b82f6';
      this.ctx.shadowBlur = 6;
      this.ctx.fillRect(cp.x, cp.y, 4, cp.h);
      this.ctx.shadowBlur = 0;

      this.ctx.beginPath();
      this.ctx.moveTo(cp.x + 4, cp.y + 4);
      this.ctx.lineTo(cp.x + 24, cp.y + 12);
      this.ctx.lineTo(cp.x + 4, cp.y + 20);
      this.ctx.fill();
    }

    if (this.flag.x >= this.cameraX - 50 && this.flag.x <= this.cameraX + this.playfieldWidth + 50) {
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.shadowColor = '#cbd5e1';
      this.ctx.shadowBlur = 5;
      this.ctx.fillRect(this.flag.x, this.flag.y, 4, this.flag.h);
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.moveTo(this.flag.x + 4, this.flag.y + 2);
      this.ctx.lineTo(this.flag.x + 28, this.flag.y + 10);
      this.ctx.lineTo(this.flag.x + 4, this.flag.y + 18);
      this.ctx.fill();
    }

    const p = this.player;
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.roundRect(p.x, p.y, p.w, p.h * 0.5, [4, 4, 0, 0]);
    this.ctx.fill();

    this.ctx.fillStyle = '#2563eb';
    this.ctx.beginPath();
    this.ctx.roundRect(p.x, p.y + p.h * 0.5, p.w, p.h * 0.5, [0, 0, 4, 4]);
    this.ctx.fill();

    this.ctx.fillStyle = '#fca5a5';
    const pEyeOffset = p.dx > 0 ? 3 : (p.dx < 0 ? -1 : 1);
    this.ctx.fillRect(p.x + 4 + pEyeOffset, p.y + 4, 2, 2);
    this.ctx.fillRect(p.x + 8 + pEyeOffset, p.y + 4, 2, 2);

    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.bus.off('ARCADE_LEFT', this.leftHandler);
    this.bus.off('ARCADE_RIGHT', this.rightHandler);
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 3. GAME: FLAPPY BYTE (Flappy Bird style endless flyer)
// ============================================================================
class FlappyByteApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_flappy_best', 0);
    this.state = 'READY';
    this.active = false;
    this.destroyed = false;
    this.rafId = null;

    this.playfieldWidth = 640;
    this.playfieldHeight = 360;

    this.pipes = [];
    this.bird = { x: 120, y: 160, vy: 0, radius: 10 };
    this.score = 0;
  }

  mount() {
    this.active = true;
    this.destroyed = false;
    this.container.innerHTML = `
      <div class="app-flappybyte" id="flappy-game-container" tabindex="0">
        <div id="flappy-hud" class="flappy-hud">
          <div class="hud-item">SCORE <span id="fb-score">0</span></div>
          <div class="hud-item">BEST <span id="fb-high">${this.highScore}</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="flappy-canvas"></canvas>
        </div>
        <div id="flappy-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#flappy-game-container');
    this.canvas = this.container.querySelector('#flappy-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#flappy-overlay-view');
    this.hudScore = this.container.querySelector('#fb-score');

    this.gameContainer.focus({ preventScroll: true });

    this.flapAction = () => this.flap();
    this.bus.on('ARCADE_CONFIRM', this.flapAction);
    this.bus.on('ARCADE_ACTION_A', this.flapAction);
    this.bus.on('ARCADE_UP', this.flapAction);

    this.gameContainer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.flap();
    });

    this.keydownHandler = (e) => {
      if (!this.active) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') this.flap();
      if (e.key === 'Escape') this.togglePause();
    };
    document.addEventListener('keydown', this.keydownHandler);

    this.transitionToState('READY');

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);
  }

  resizeCanvas() {
    if (!this.canvas || !this.active || this.destroyed || !this.pipes) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  flap() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') {
      this.start();
    } else if (this.state === 'PLAYING') {
      this.bird.vy = -7.2;
      this.audio.playGameSfx('flappybyte', 'flap');
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.cancelLoop();
      this.overlay.className = 'flappy-overlay-active';
      this.overlay.innerHTML = `<div class="flappy-menu"><h2>PAUSED</h2><button id="fb-resume" class="flappy-btn primary">RESUME</button></div>`;
      const fbResume = this.overlay.querySelector('#fb-resume');
      if (fbResume) fbResume.onclick = () => {
        this.state = 'PLAYING';
        this.overlay.className = '';
        this.overlay.innerHTML = '';
        this.gameLoop(performance.now());
      };
    }
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'flappy-overlay-active';
      this.overlay.innerHTML = `
        <div class="flappy-menu">
          <div class="flappy-logo">🐤</div>
          <h2>FLAPPY BYTE</h2>
          <p>Tap Space / Action button to flap & avoid laser gates!</p>
          <div class="flappy-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="flappy-btn primary" id="fb-start">TAP TO FLY</button>
        </div>
      `;
      const fbStart = this.overlay.querySelector('#fb-start');
      if (fbStart) fbStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.bird = { x: 120, y: 170, vy: 0, radius: 8 };
    this.pipes = [];
    this.spawnTimer = 0;

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'flappybyte' });
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((next) => this.gameLoop(next));

    this.update(arcadeFrameStep(this, timestamp, 'flappybyte'));
    this.draw();
  }

  update(step = 1) {
    if (hasDevModifier('flappybyte', 'slow_time')) step *= 0.65;
    const b = this.bird;
    b.vy += 0.42 * step;
    b.y += b.vy * step;

    this.spawnTimer += step;
    if (this.spawnTimer > 75) {
      this.spawnTimer = 0;
      const gapY = 65 + Math.random() * 165;
      const gapH = 110;
      this.pipes.push({ x: this.playfieldWidth, gapY, gapH, passed: false });
    }

    this.pipes.forEach(p => {
      p.x -= (2.7 + Math.min(1.1, this.score * 0.025)) * step;

      if (!p.passed && p.x < b.x) {
        p.passed = true;
        this.score += (this.flappyDoubleScore || hasDevModifier('flappybyte', 'score_multiplier')) ? 2 : 1;
        this.audio.playGameSfx('flappybyte', 'score');
        if (this.score > 0 && this.score % 5 === 0) {
          const shield = new PowerUpDefinition({ id: 'shield', icon: '◇', effect: 'Absorb one collision', duration: 9000, activate: app => { app.flappyShield = true; }, deactivate: app => { app.flappyShield = false; } });
          activateGameBuff(this, shield);
        }
        if (this.hudScore) this.hudScore.textContent = this.score;
      }

      if (b.x + b.radius > p.x && b.x - b.radius < p.x + 40) {
        if (b.y - b.radius < p.gapY || b.y + b.radius > p.gapY + p.gapH) {
          if (this.flappyShield || hasDevModifier('flappybyte', 'invincible')) {
            this.flappyShield = false;
            p.x = -40;
            renderGameBuffs(this);
          } else this.gameOver();
        }
      }
    });

    if (b.y - b.radius < 0 || b.y + b.radius > this.playfieldHeight - 8) {
      if (this.flappyShield || hasDevModifier('flappybyte', 'invincible')) {
        this.flappyShield = false;
        b.y = this.playfieldHeight / 2;
        b.vy = 0;
        renderGameBuffs(this);
      } else this.gameOver();
    }
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('flappybyte', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'collision-fall');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('flappybyte'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_flappy_best', this.highScore);
    }
    this.bus.emit('FLAPPYBYTE_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'flappybyte' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'flappybyte',
      outcome: isNewHigh ? 'NEW_HIGH_SCORE' : 'GAME_OVER',
      title: isNewHigh ? 'NEW HIGH SCORE!' : 'GAME OVER',
      subtitle: 'SYSTEM COLLISION DETECTED',
      accentColor: '#0ea5e9',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.pipes) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    this.pipes.forEach(p => {
      this.ctx.fillStyle = '#0891b2'; // darker cyan
      this.ctx.fillRect(p.x, 0, 36, p.gapY);
      this.ctx.fillRect(p.x, p.gapY + p.gapH, 36, this.playfieldHeight - (p.gapY + p.gapH));

      this.ctx.shadowColor = '#06b6d4';
      this.ctx.shadowBlur = 5;
      this.ctx.strokeStyle = '#06b6d4';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(p.x, 0, 36, p.gapY);
      this.ctx.strokeRect(p.x, p.gapY + p.gapH, 36, this.playfieldHeight - (p.gapY + p.gapH));

      // Pipe caps
      this.ctx.fillStyle = '#06b6d4';
      this.ctx.fillRect(p.x - 2, p.gapY - 10, 40, 10);
      this.ctx.fillRect(p.x - 2, p.gapY + p.gapH, 40, 10);
      this.ctx.shadowBlur = 0;
    });

    const b = this.bird;
    this.ctx.save();
    this.ctx.translate(b.x, b.y);

    // Rotate bird based on velocity
    const angle = Math.min(Math.max(b.vy * 0.1, -0.4), 0.6);
    this.ctx.rotate(angle);

    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#facc15';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Wing
    this.ctx.fillStyle = '#fde047';
    this.ctx.beginPath();
    const wingY = b.vy < 0 ? 2 : 0; // Flap animation
    this.ctx.ellipse(-3, wingY, 4, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(4, -3, 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Beak
    this.ctx.fillStyle = '#f97316';
    this.ctx.beginPath();
    this.ctx.moveTo(b.radius - 1, -1);
    this.ctx.lineTo(b.radius + 4, 2);
    this.ctx.lineTo(b.radius - 1, 4);
    this.ctx.fill();

    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.bus.off('ARCADE_CONFIRM', this.flapAction);
    this.bus.off('ARCADE_ACTION_A', this.flapAction);
    this.bus.off('ARCADE_UP', this.flapAction);
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 4. GAME: SPACE WARS (Classic Space Combat Shooter)
// ============================================================================
class SpaceWarsApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_spacewars_best', 0);
    this.state = 'READY';
    this.active = false;
    this.destroyed = false;
    this.rafId = null;

    this.playfieldWidth = 640;
    this.playfieldHeight = 360;
    this.keys = { left: false, right: false, up: false, down: false, fire: false };

    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.asteroids = [];
    this.particles = [];
    this.popups = [];
    this.ship = { x: 320, y: 315, w: 20, h: 20, speed: 4.8, hp: 3 };
    this.score = 0;
    this.wave = 1;
  }

  mount() {
    this.active = true;
    this.destroyed = false;
    this.container.innerHTML = `
      <div class="app-spacewars" id="sw-game-container" tabindex="0" style="width: 100%; height: 100%; display: flex; flex-direction: column; position: absolute; inset: 0;">
        <div id="sw-hud" class="sw-hud">
          <div class="hud-item">SCORE <span id="sw-score">0</span></div>
          <div class="hud-item">WAVE <span id="sw-wave">1</span></div>
          <div class="hud-item">HI <span id="sw-high">${this.highScore}</span></div>
        </div>
        <div class="canvas-wrapper" style="flex: 1; position: relative; width: 100%; height: 100%; overflow: hidden;">
          <canvas id="sw-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>
        <div id="sw-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#sw-game-container');
    this.canvas = this.container.querySelector('#sw-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#sw-overlay-view');
    this.hudScore = this.container.querySelector('#sw-score');
    this.hudWave = this.container.querySelector('#sw-wave');

    this.gameContainer.focus({ preventScroll: true });

    this.bus.on('ARCADE_LEFT', () => { this.keys.left = true; setTimeout(() => this.keys.left = false, 150); });
    this.bus.on('ARCADE_RIGHT', () => { this.keys.right = true; setTimeout(() => this.keys.right = false, 150); });
    this.bus.on('ARCADE_UP', () => { this.keys.up = true; setTimeout(() => this.keys.up = false, 150); });
    this.bus.on('ARCADE_DOWN', () => { this.keys.down = true; setTimeout(() => this.keys.down = false, 150); });
    this.bus.on('ARCADE_CONFIRM', () => this.fire());
    this.bus.on('ARCADE_ACTION_A', () => this.fire());

    this.keydownHandler = (e) => {
      if (!this.active) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = true;
      if (e.key === ' ' || e.key === 'Enter') this.fire();
      if (e.key === 'Escape') this.togglePause();
    };
    this.keyupHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = false;
    };
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);

    this.transitionToState('READY');

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);
  }

  resizeCanvas() {
    if (!this.canvas || !this.active || this.destroyed || !this.enemies) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const scaleX = w / this.playfieldWidth;
    const scaleY = h / this.playfieldHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (w - this.playfieldWidth * scale) / 2;
    const offsetY = (h - this.playfieldHeight * scale) / 2;

    this.dpr = dpr;
    this.worldScale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.draw();
  }

  fire() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') {
      this.start();
    } else if (this.state === 'PLAYING') {
      const spread = (this.spaceTripleShot || hasDevModifier('spacewars', 'triple_shot')) ? [-0.22, 0, 0.22] : [0];
      spread.forEach(angle => this.bullets.push({ x: this.ship.x, y: this.ship.y - 12, vx: Math.sin(angle) * 2.4, vy: -9 }));
      this.audio.playGameSfx('spacewars', 'fire');
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.cancelLoop();
      this.overlay.className = 'sw-overlay-active';
      this.overlay.innerHTML = `<div class="sw-menu"><h2>PAUSED</h2><button id="sw-resume" class="sw-btn primary">RESUME</button></div>`;
      const swResume = this.overlay.querySelector('#sw-resume');
      if (swResume) swResume.onclick = () => {
        this.state = 'PLAYING';
        this.overlay.className = '';
        this.overlay.innerHTML = '';
        this.gameLoop(performance.now());
      };
    }
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'sw-overlay-active';
      this.overlay.innerHTML = `
        <div class="sw-menu">
          <div class="sw-logo">🚀</div>
          <h2>SPACE WARS</h2>
          <p>Blast enemy fleets & survive combat waves!</p>
          <div class="sw-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="sw-btn primary" id="sw-start">LAUNCH SHIP</button>
        </div>
      `;
      const swStart = this.overlay.querySelector('#sw-start');
      if (swStart) swStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.wave = 1;
    this.ship = { x: 320, y: 315, speed: 4.8, hp: 3 };
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.asteroids = [];
    this.particles = [];
    this.popups = [];
    this.fireCooldown = 0;
    this.introTimer = 160; // Show intro overlay briefly
    this.spawnWave();

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'spacewars' });
  }

  spawnWave() {
    this.enemies = [];
    this.asteroids = [];
    const enemyCount = 4 + this.wave * 2;
    const types = ['scout', 'interceptor', 'formation', 'bomber'];

    for (let i = 0; i < enemyCount; i++) {
      const type = types[i % types.length];
      this.enemies.push({
        type,
        x: 55 + (i % 6) * 105,
        y: 42 + Math.floor(i / 6) * 42,
        vx: (Math.random() > 0.5 ? 1 : -1) * (1.2 + this.wave * 0.15),
        vy: type === 'scout' ? 1.8 : 1.2,
        hp: type === 'bomber' ? 4 : type === 'interceptor' ? 2 : 1,
        active: true,
        shootTimer: Math.random() * 120
      });
    }

    // Spawn 2-3 asteroids
    const astCount = 2 + Math.min(3, Math.floor(this.wave / 2));
    for (let j = 0; j < astCount; j++) {
      this.asteroids.push({
        x: Math.random() * (this.playfieldWidth - 80) + 40,
        y: -30 - j * 60,
        radius: 12 + Math.random() * 14,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.0 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        hp: 3,
        active: true
      });
    }

    if (this.hudWave) this.hudWave.textContent = this.wave;
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((next) => this.gameLoop(next));

    this.update(arcadeFrameStep(this, timestamp, 'spacewars'));
    this.draw();
  }

  update(step = 1) {
    const s = this.ship;

    // Continuous held input polling
    const actionHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('ACTION') || window.ArcadeInput.isDown('CONFIRM')) : false;
    const leftHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('LEFT') || this.keys.left) : this.keys.left;
    const rightHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('RIGHT') || this.keys.right) : this.keys.right;
    const upHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('UP') || this.keys.up) : this.keys.up;
    const downHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('DOWN') || this.keys.down) : this.keys.down;

    if (leftHeld) s.x = Math.max(16, s.x - s.speed * step);
    if (rightHeld) s.x = Math.min(this.playfieldWidth - 16, s.x + s.speed * step);
    if (upHeld) s.y = Math.max(80, s.y - s.speed * step);
    if (downHeld) s.y = Math.min(this.playfieldHeight - 24, s.y + s.speed * step);

    // Continuous fire with ~140ms cooldown
    if (this.fireCooldown > 0) this.fireCooldown--;
    if ((actionHeld || this.keys.fire) && this.fireCooldown === 0) {
      this.fire();
      this.fireCooldown = (this.spaceRapidFire || hasDevModifier('spacewars', 'rapid_fire')) ? 4 : 9;
    }

    if (this.introTimer > 0) this.introTimer--;

    // Move player bullets
    this.bullets.forEach(b => {
      b.x += (b.vx || 0) * step;
      b.y += b.vy * step;
    });
    this.bullets = this.bullets.filter(b => b.y > -20);

    // Move enemy bullets
    this.enemyBullets.forEach(eb => eb.y += eb.vy * step);
    this.enemyBullets = this.enemyBullets.filter(eb => eb.y < this.playfieldHeight + 20);

    // Move & rotate asteroids
    this.asteroids.forEach(ast => {
      if (!ast.active) return;
      ast.x += ast.vx * step;
      ast.y += ast.vy * step;
      ast.angle += ast.rotSpeed * step;
      if (ast.x < 15 || ast.x > this.playfieldWidth - 15) ast.vx = -ast.vx;
      if (ast.y > this.playfieldHeight + 20) ast.y = -20;

      // Bullet hit asteroid
      this.bullets.forEach(b => {
        if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius) {
          b.y = -50;
          ast.hp--;
          this.createExplosions(b.x, b.y, '#eab308', 4);
          if (ast.hp <= 0) {
            ast.active = false;
            this.score += 100;
            this.createExplosions(ast.x, ast.y, '#f97316', 10);
            if (this.hudScore) this.hudScore.textContent = this.score;
            if (this.score % 600 === 0) {
              activateGameBuff(this, new PowerUpDefinition({ id: 'shield', icon: '◇', effect: 'Absorb one hit', activate: app => { app.spaceShield = true; }, deactivate: app => { app.spaceShield = false; } }));
            }
          }
        }
      });

      // Player collision with asteroid
      if (Math.hypot(s.x - ast.x, s.y - ast.y) < ast.radius + 10) {
        if (this.spaceShield || hasDevModifier('spacewars', 'invincible') || hasDevModifier('spacewars', 'infinite_shield')) this.spaceShield = false;
        else this.gameOver();
      }
    });

    // Move enemies & AI attacks
    let activeCount = 0;
    this.enemies.forEach(e => {
      if (!e.active) return;
      activeCount++;

      if (e.type === 'interceptor') {
        e.vx = (s.x - e.x) * 0.02;
        e.y += 0.8 * step;
      } else if (e.type === 'formation') {
        e.x += Math.sin(performance.now() * 0.003 + e.y) * 1.8 * step;
        e.y += 0.6 * step;
      } else {
        e.x += e.vx * step;
        if (e.x < 20 || e.x > this.playfieldWidth - 20) e.vx = -e.vx;
      }
      if (e.y > this.playfieldHeight - 20) e.y = 30;

      // Enemy firing logic
      e.shootTimer += step;
      if (e.type === 'bomber' && e.shootTimer >= 90) {
        e.shootTimer = 0;
        this.enemyBullets.push({ x: e.x, y: e.y + 12, vy: 4 });
      }

      // Player bullet hit enemy
      this.bullets.forEach(b => {
        if (Math.hypot(b.x - e.x, b.y - e.y) < 18) {
          b.y = -50;
          e.hp--;
          this.createExplosions(e.x, e.y, '#ef4444', 6);
          if (e.hp <= 0) {
            e.active = false;
            this.score += e.type === 'bomber' ? 300 : 150;
            this.audio.playGameSfx('spacewars', 'hit');
            this.createExplosions(e.x, e.y, '#38bdf8', 12);
            if (this.hudScore) this.hudScore.textContent = this.score;
            if (this.score % 750 === 0) {
              activateGameBuff(this, new PowerUpDefinition({ id: 'rapid_fire', icon: '≋', effect: 'Reduced fire cooldown', activate: app => { app.spaceRapidFire = true; }, deactivate: app => { app.spaceRapidFire = false; } }));
            }
          }
        }
      });

      // Player collision with enemy
      if (Math.hypot(s.x - e.x, s.y - e.y) < 18) {
        if (this.spaceShield || hasDevModifier('spacewars', 'invincible')) this.spaceShield = false;
        else this.gameOver();
      }
    });

    // Check player hit by enemy bullets
    this.enemyBullets.forEach(eb => {
      if (Math.hypot(s.x - eb.x, s.y - eb.y) < 12) {
        if (this.spaceShield || hasDevModifier('spacewars', 'invincible')) this.spaceShield = false;
        else this.gameOver();
      }
    });

    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.life -= step;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    if (activeCount === 0) {
      markOutcome(this, 'victory', 'wave-cleared');
      this.audio.playGameSfx('spacewars', 'wave');
      this.wave++;
      this.spawnWave();
    }
    if (this.gameContainer) {
      this.gameContainer.dataset.bulletCount = String(this.bullets.length);
      this.gameContainer.dataset.shipX = String(Math.round(s.x));
    }
  }

  createExplosions(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 14 + Math.floor(Math.random() * 10),
        maxLife: 24
      });
    }
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('spacewars', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'ship-explosion');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('spacewars'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_spacewars_best', this.highScore);
    }
    this.bus.emit('SPACEWARS_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'spacewars' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'spacewars',
      outcome: 'GAME_OVER',
      title: 'MISSION FAILED',
      subtitle: 'STARFIGHTER DESTROYED',
      accentColor: '#f97316',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'WAVE', value: this.wave || 1 },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.enemies || !this.enemyBullets || !this.asteroids) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#030712';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    // Starfield
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 25; i++) {
      const sx = (i * 67 + performance.now() * 0.02) % this.playfieldWidth;
      const sy = (i * 53 + performance.now() * 0.05) % this.playfieldHeight;
      this.ctx.fillRect(sx, sy, (i % 3) + 1, (i % 3) + 1);
    }

    // Asteroids
    this.asteroids.forEach(ast => {
      if (!ast.active) return;
      this.ctx.save();
      this.ctx.translate(ast.x, ast.y);
      this.ctx.rotate(ast.angle);
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.fillStyle = '#1e293b';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      const points = 7;
      for (let i = 0; i < points; i++) {
        const a = (i * Math.PI * 2) / points;
        const r = ast.radius * (0.8 + Math.sin(i * 3) * 0.2);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    });

    // Player Bullets
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#0ea5e9';
    this.ctx.shadowBlur = 8;
    this.bullets.forEach(b => {
      this.ctx.fillRect(b.x - 2, b.y - 8, 4, 10);
    });
    this.ctx.shadowBlur = 0;

    // Enemy Bullets
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.shadowColor = '#e11d48';
    this.ctx.shadowBlur = 6;
    this.enemyBullets.forEach(eb => {
      this.ctx.beginPath();
      this.ctx.arc(eb.x, eb.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.shadowBlur = 0;

    // Enemy Fighters
    this.enemies.forEach(e => {
      if (!e.active) return;
      this.ctx.save();
      this.ctx.translate(e.x, e.y);

      if (e.type === 'bomber') {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 15);
        this.ctx.lineTo(-18, -5);
        this.ctx.lineTo(-9, -12);
        this.ctx.lineTo(0, -7);
        this.ctx.lineTo(9, -12);
        this.ctx.lineTo(18, -5);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (e.type === 'interceptor') {
        this.ctx.fillStyle = '#a855f7';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 15);
        this.ctx.lineTo(-5, 2);
        this.ctx.lineTo(-15, -7);
        this.ctx.lineTo(-5, -5);
        this.ctx.lineTo(0, -13);
        this.ctx.lineTo(5, -5);
        this.ctx.lineTo(15, -7);
        this.ctx.lineTo(5, 2);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (e.type === 'formation') {
        this.ctx.fillStyle = '#eab308';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 13);
        this.ctx.lineTo(-14, 2);
        this.ctx.lineTo(-9, -8);
        this.ctx.lineTo(0, -4);
        this.ctx.lineTo(9, -8);
        this.ctx.lineTo(14, 2);
        this.ctx.fill();
      } else {
        // Scout
        this.ctx.fillStyle = '#f43f5e';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 13);
        this.ctx.lineTo(-12, 4);
        this.ctx.lineTo(-7, -8);
        this.ctx.lineTo(0, -3);
        this.ctx.lineTo(7, -8);
        this.ctx.lineTo(12, 4);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.fillStyle = '#dbeafe';
      this.ctx.beginPath();
      this.ctx.ellipse(0, -1, 3.5, 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fb7185';
      this.ctx.fillRect(-7, 8, 4, 2);
      this.ctx.fillRect(3, 8, 4, 2);
      this.ctx.restore();
    });

    // Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });

    // Player Ship
    const s = this.ship;
    this.ctx.save();
    this.ctx.translate(s.x, s.y);

    // Thruster trail
    this.ctx.fillStyle = '#f97316';
    this.ctx.beginPath();
    this.ctx.moveTo(-4, 10);
    this.ctx.lineTo(0, 18 + Math.random() * 6);
    this.ctx.lineTo(4, 10);
    this.ctx.closePath();
    this.ctx.fill();

    // Fighter Wings & Body
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#0ea5e9';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -14);
    this.ctx.lineTo(-14, 10);
    this.ctx.lineTo(-4, 6);
    this.ctx.lineTo(0, 10);
    this.ctx.lineTo(4, 6);
    this.ctx.lineTo(14, 10);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Cockpit
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -2, 3, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    // Intro Overlay Banner
    if (this.introTimer > 0) {
      this.ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
      this.ctx.fillRect(20, 150, 360, 80);
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(20, 150, 360, 80);

      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 16px "JetBrains Mono", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`SPACE WARS - WAVE ${this.wave}`, 200, 180);

      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.font = '10px "JetBrains Mono", monospace';
      this.ctx.fillText('WASD / ARROWS TO MOVE | HOLD SPACE / A TO FIRE', 200, 205);
    }

    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 5. APP: NEON SNAKE
// ============================================================================
class NeonSnakeApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_snake_best', 0);
    this.state = 'READY';
    this.active = false;
    this.destroyed = false;

    // Landscape board grid setup
    this.gridWidth = 24;
    this.gridHeight = 16;
    this.cellSize = 20;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;

    this.rafId = null;
    this.lastTickTime = 0;
    this.tickRate = 110;
    this.score = 0;
    this.foodCount = 0;

    this.dir = 'RIGHT';
    this.nextDir = 'RIGHT';
    this.inputQueue = [];

    this.snake = [];
    this.food = { x: 0, y: 0 };
  }

  mount() {
    this.active = true;
    this.destroyed = false;
    this.container.innerHTML = `
      <div class="app-neon-snake" id="snake-game-container" tabindex="0">
        <div id="snake-hud" class="snake-hud-hidden">
          <div class="hud-item">SCORE <span id="hud-score">0</span></div>
          <div class="hud-item">HI <span id="hud-high">${this.highScore}</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="snake-canvas"></canvas>
        </div>
        <div id="snake-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#snake-game-container');
    this.canvas = this.container.querySelector('#snake-canvas');
    this.canvasWrapper = this.container.querySelector('.canvas-wrapper');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#snake-overlay-view');
    this.hud = this.container.querySelector('#snake-hud');

    this.gameContainer.focus({ preventScroll: true });

    // Deterministic state reset BEFORE resize / draw
    this.dir = 'RIGHT';
    this.nextDir = 'RIGHT';
    this.inputQueue = [];
    this.score = 0;
    this.foodCount = 0;

    const midX = Math.floor(this.gridWidth / 2);
    const midY = Math.floor(this.gridHeight / 2);
    this.snake = [{ x: midX, y: midY }, { x: midX - 1, y: midY }, { x: midX - 2, y: midY }];
    this.spawnFood();

    // Perform initial viewport measurement & canvas setup
    this.resizeCanvas();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.canvasWrapper || this.container);

    this.upHandler = () => this.handleDirection('UP');
    this.downHandler = () => this.handleDirection('DOWN');
    this.leftHandler = () => this.handleDirection('LEFT');
    this.rightHandler = () => this.handleDirection('RIGHT');

    this.bus.on('ARCADE_UP', this.upHandler);
    this.bus.on('ARCADE_DOWN', this.downHandler);
    this.bus.on('ARCADE_LEFT', this.leftHandler);
    this.bus.on('ARCADE_RIGHT', this.rightHandler);
    this.bus.on('ARCADE_CONFIRM', () => this.handleConfirm());
    this.bus.on('ARCADE_ACTION_A', () => this.handleConfirm());

    this.keydownHandler = (e) => {
      if (!this.active || this.destroyed) return;
      const key = e.key;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        if (key === 'ArrowUp' || key === 'w' || key === 'W') this.handleDirection('UP');
        if (key === 'ArrowDown' || key === 's' || key === 'S') this.handleDirection('DOWN');
        if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.handleDirection('LEFT');
        if (key === 'ArrowRight' || key === 'd' || key === 'D') this.handleDirection('RIGHT');
      } else if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        this.handleConfirm();
      } else if (key === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    this.touchStart = null;
    this.pointerDownHandler = (e) => {
      this.touchStart = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    this.pointerUpHandler = (e) => {
      if (!this.touchStart) return;
      const dx = e.clientX - this.touchStart.x;
      const dy = e.clientY - this.touchStart.y;
      this.touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
        this.handleConfirm();
        return;
      }
      this.handleDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP'));
      e.preventDefault();
    };
    this.gameContainer.addEventListener('pointerdown', this.pointerDownHandler);
    this.gameContainer.addEventListener('pointerup', this.pointerUpHandler);
    this.gameContainer.addEventListener('pointercancel', this.pointerUpHandler);

    this.transitionToState('READY');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvasWrapper || this.container;
    const w = parent.clientWidth || this.container.clientWidth || 600;
    const h = parent.clientHeight || this.container.clientHeight || 400;
    if (!w || !h) return;

    // Use full CRT safe viewport landscape aspect ratio (24 x 16 grid)
    this.gridWidth = 24;
    this.gridHeight = 16;

    // Use 94% of safe area to ensure clean border inset
    const availW = w * 0.94;
    const availH = h * 0.94;

    let cellSize = Math.floor(Math.min(availW / this.gridWidth, availH / this.gridHeight));
    if (cellSize < 12) cellSize = 12;
    this.cellSize = cellSize;

    const boardWidth = this.gridWidth * this.cellSize;
    const boardHeight = this.gridHeight * this.cellSize;

    this.offsetX = Math.floor((w - boardWidth) / 2);
    this.offsetY = Math.floor((h - boardHeight) / 2);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;

    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    this.draw();
  }

  handleDirection(dir) {
    if (this.state !== 'PLAYING') return;
    const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    const lastDir = this.inputQueue.length ? this.inputQueue[this.inputQueue.length - 1] : this.dir;
    if (dir !== lastDir && dir !== opposites[lastDir]) {
      if (this.inputQueue.length < 2) {
        this.inputQueue.push(dir);
        this.audio.playGameSfx('snake', 'turn', { cooldown: 70 });
      }
    }
  }

  handleConfirm() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') {
      this.start();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.cancelLoop();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTickTime = performance.now();
      this.gameLoop(performance.now());
    }
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.score = 0;
      this.dir = 'RIGHT';
      this.nextDir = 'RIGHT';
      this.inputQueue = [];

      const midX = Math.floor(this.gridWidth / 2);
      const midY = Math.floor(this.gridHeight / 2);
      this.snake = [{ x: midX, y: midY }, { x: midX - 1, y: midY }, { x: midX - 2, y: midY }];
      this.spawnFood();
      this.draw();

      this.overlay.className = 'snake-overlay-active';
      this.overlay.innerHTML = `
        <div class="snake-menu">
          <div class="snake-logo">🐍</div>
          <h2>NEON SNAKE</h2>
          <p>Eat food & grow your grid snake!</p>
          <div class="snake-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="snake-btn primary" id="sn-start">START GAME</button>
        </div>
      `;
      const snStart = this.overlay.querySelector('#sn-start');
      if (snStart) snStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.foodCount = 0;
    this.dir = 'RIGHT';
    this.nextDir = 'RIGHT';
    this.inputQueue = [];

    const midX = Math.floor(this.gridWidth / 2);
    const midY = Math.floor(this.gridHeight / 2);
    this.snake = [{ x: midX, y: midY }, { x: midX - 1, y: midY }, { x: midX - 2, y: midY }];
    this.spawnFood();

    this.state = 'PLAYING';
    if (this.hud) this.hud.className = 'snake-hud-active';
    this.overlay.className = '';
    this.overlay.innerHTML = '';

    this.cancelLoop();
    this.lastTickTime = performance.now();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'snake' });
  }

  spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    const emptyCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length > 0) {
      this.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
      this.food = { x: 0, y: 0 };
    }
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));

    const devScale = window.ArcadeDeveloperMode?.getSpeedScale?.() || 1;
    const pace = Math.max(68, 110 - Math.floor(this.score / 30) * 6);
    this.tickRate = this.snakeSlowTime ? pace * 1.35 : pace;

    if (timestamp - this.lastTickTime >= this.tickRate / devScale) {
      this.lastTickTime = timestamp;
      this.update();
    }
    this.draw();
  }

  update() {
    if (this.inputQueue.length > 0) {
      this.dir = this.inputQueue.shift();
    }
    const head = { ...this.snake[0] };

    if (this.dir === 'UP') head.y--;
    if (this.dir === 'DOWN') head.y++;
    if (this.dir === 'LEFT') head.x--;
    if (this.dir === 'RIGHT') head.x++;

    // Wall collision
    if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
      if (hasDevModifier('snake', 'invincible_walls')) {
        head.x = (head.x + this.gridWidth) % this.gridWidth;
        head.y = (head.y + this.gridHeight) % this.gridHeight;
      } else {
        this.gameOver();
        return;
      }
    }

    // Check if food will be eaten
    const isEating = (head.x === this.food.x && head.y === this.food.y);

    // Self collision check (exclude tail if tail will move away)
    const checkSegments = isEating ? this.snake : this.snake.slice(0, -1);
    if (checkSegments.some(s => s.x === head.x && s.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    if (isEating) {
      this.score += (this.snakeScoreMultiplier || hasDevModifier('snake', 'score_multiplier')) ? 20 : 10;
      this.foodCount = (this.foodCount || 0) + 1;
      this.audio.playGameSfx('snake', 'eat');

      if (this.foodCount % 5 === 0) {
        const buff = this.foodCount % 10 === 0
          ? new PowerUpDefinition({ id: 'shorten', icon: '−', effect: 'Shorter tail', activate: app => app.snake.splice(Math.max(3, app.snake.length - 3)), deactivate: () => {}, duration: 1200 })
          : new PowerUpDefinition({ id: 'time_slow', icon: '◷', effect: 'Slower grid clock', activate: app => { app.snakeSlowTime = true; }, deactivate: app => { app.snakeSlowTime = false; } });
        activateGameBuff(this, buff);
      }
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    const scoreEl = this.container.querySelector('#hud-score');
    if (scoreEl) scoreEl.textContent = String(this.score);
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('snake', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'snake-dissolve');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('snake'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_snake_best', this.highScore);
    }
    this.bus.emit('SNAKE_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'snake' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'snake',
      outcome: isNewHigh ? 'NEW_HIGH_SCORE' : 'GAME_OVER',
      title: isNewHigh ? 'NEW HIGH SCORE!' : 'GAME OVER',
      subtitle: 'GRID BOUNDARY COLLISION',
      accentColor: '#22c55e',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'LENGTH', value: this.snake ? this.snake.length : 1 },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed) return;
    const parent = this.canvasWrapper || this.container;
    const w = parent.clientWidth || this.container.clientWidth || 600;
    const h = parent.clientHeight || this.container.clientHeight || 400;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fill canvas background
    this.ctx.fillStyle = '#060f0a';
    this.ctx.fillRect(0, 0, w, h);

    const cs = this.cellSize || 20;
    const ox = this.offsetX || 0;
    const oy = this.offsetY || 0;
    const bw = this.gridWidth * cs;
    const bh = this.gridHeight * cs;

    // Draw board playfield background
    this.ctx.fillStyle = '#08170e';
    this.ctx.fillRect(ox, oy, bw, bh);

    // Draw board border
    this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(ox, oy, bw, bh);

    // Draw grid lines inside board playfield
    this.ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)';
    this.ctx.lineWidth = 1;
    for (let col = 0; col <= this.gridWidth; col++) {
      const gx = ox + col * cs;
      this.ctx.beginPath();
      this.ctx.moveTo(gx, oy);
      this.ctx.lineTo(gx, oy + bh);
      this.ctx.stroke();
    }
    for (let row = 0; row <= this.gridHeight; row++) {
      const gy = oy + row * cs;
      this.ctx.beginPath();
      this.ctx.moveTo(ox, gy);
      this.ctx.lineTo(ox + bw, gy);
      this.ctx.stroke();
    }

    if (!this.snake?.length || !this.food) return;

    // Draw food with pulsing neon red/orange glow
    const foodPulse = (cs - 2) * (0.82 + 0.18 * Math.sin(performance.now() / 140));
    const foodOffset = (cs - foodPulse) / 2;
    const foodX = ox + this.food.x * cs + foodOffset;
    const foodY = oy + this.food.y * cs + foodOffset;

    this.ctx.fillStyle = '#ef4444';
    this.ctx.shadowColor = '#f97316';
    this.ctx.shadowBlur = 12;
    this.ctx.fillRect(foodX, foodY, foodPulse, foodPulse);
    this.ctx.shadowBlur = 0;

    // Draw Snake segments
    this.snake.forEach((s, i) => {
      const segX = ox + s.x * cs;
      const segY = oy + s.y * cs;

      if (i === 0) {
        // Head: bright neon green
        this.ctx.fillStyle = '#10b981';
        this.ctx.shadowColor = '#34d399';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(segX, segY, cs, cs);
        this.ctx.shadowBlur = 0;

        // Snake eyes
        this.ctx.fillStyle = '#ffffff';
        const eyeSize = Math.max(2, cs * 0.16);

        let e1x = segX + cs * 0.2;
        let e1y = segY + cs * 0.2;
        let e2x = segX + cs * 0.6;
        let e2y = segY + cs * 0.2;

        if (this.dir === 'UP' || this.dir === 'DOWN') {
          e1x = segX + cs * 0.2;
          e2x = segX + cs * 0.6;
          e1y = e2y = segY + (this.dir === 'DOWN' ? cs * 0.6 : cs * 0.2);
        } else {
          e1y = segY + cs * 0.2;
          e2y = segY + cs * 0.6;
          e1x = e2x = segX + (this.dir === 'RIGHT' ? cs * 0.6 : cs * 0.2);
        }

        this.ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
        this.ctx.fillRect(e2x, e2y, eyeSize, eyeSize);
      } else {
        // Body: darker neon green segments
        this.ctx.fillStyle = '#047857';
        this.ctx.fillRect(segX + 1, segY + 1, cs - 2, cs - 2);
      }
    });
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    this.gameContainer?.removeEventListener('pointerdown', this.pointerDownHandler);
    this.gameContainer?.removeEventListener('pointerup', this.pointerUpHandler);
    this.gameContainer?.removeEventListener('pointercancel', this.pointerUpHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.bus.off('ARCADE_UP', this.upHandler);
    this.bus.off('ARCADE_DOWN', this.downHandler);
    this.bus.off('ARCADE_LEFT', this.leftHandler);
    this.bus.off('ARCADE_RIGHT', this.rightHandler);
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 6. APP: BREAKOUT (Fixed Stuck-Ball Physics & Anti-Stuck Protection)
// ============================================================================
class BreakoutApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_breakout_best', 0);
    this.state = 'READY';
    this.active = false;

    this.playfieldWidth = 640;
    this.playfieldHeight = 360;
    this.rafId = null;
    this.lastTime = 0;
    this.keysPressed = { left: false, right: false };
    this.stuckTimer = 0;
    this.paddle = { x: 280, y: 330, width: 80, height: 12 };
    this.ball = { x: 320, y: 200, vx: 3, vy: -4, radius: 6 };
    this.bricks = [];
  }

  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-breakout" id="breakout-game-container" tabindex="0">
        <div id="breakout-hud" class="breakout-hud-hidden">
          <div class="hud-item">SCORE <span id="hud-score">0</span></div>
          <div class="hud-item">HI <span id="hud-high">${this.highScore}</span></div>
          <div class="hud-item">LIVES <span id="hud-lives">♥♥♥</span></div>
          <div class="hud-item">LV. <span id="hud-level">1</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="breakout-canvas"></canvas>
        </div>
        <div id="breakout-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#breakout-game-container');
    this.hud = this.container.querySelector('#breakout-hud');
    this.canvas = this.container.querySelector('#breakout-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#breakout-overlay-view');

    this.gameContainer.focus({ preventScroll: true });
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);

    this.confirmHandler = () => this.handleConfirm();
    this.leftHandler = () => { if (this.state === 'PLAYING') this.paddle.x = Math.max(0, this.paddle.x - 24); };
    this.rightHandler = () => { if (this.state === 'PLAYING') this.paddle.x = Math.min(this.playfieldWidth - this.paddle.width, this.paddle.x + 24); };

    this.bus.on('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.on('ARCADE_ACTION_A', this.confirmHandler);
    this.bus.on('ARCADE_LEFT', this.leftHandler);
    this.bus.on('ARCADE_RIGHT', this.rightHandler);

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

    this.transitionToState('READY');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  handleConfirm() {
    if (this.state === 'READY' || this.state === 'GAME_OVER' || this.state === 'VICTORY') {
      this.start();
      this.launchBall();
    }
    else if (this.state === 'PLAYING' && !this.ball.active) this.launchBall();
  }

  transitionToState(nextState) {
    this.state = nextState;
    this.overlay.className = `breakout-overlay-${nextState.toLowerCase()}`;

    if (nextState === 'READY') {
      this.overlay.innerHTML = `
        <div class="breakout-menu-ready">
          <div class="breakout-menu-logo">🔵</div>
          <h2>BREAKOUT</h2>
          <p>Destroy all bricks. Anti-stuck physics enabled!</p>
          <div class="breakout-menu-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="breakout-menu-btn primary" id="bk-start">START GAME</button>
        </div>
      `;
      const bkStart = this.overlay.querySelector('#bk-start');
      if (bkStart) bkStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.initLevel();
    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.lastTime = performance.now();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'breakout' });
  }

  initLevel() {
    this.ballSpeed = 4.5 + (this.level - 1) * 0.8;
    const paddleW = Math.max(50, 80 - (this.level - 1) * 10);

    this.paddle = {
      x: (this.playfieldWidth - paddleW) / 2,
      y: 330,
      width: paddleW,
      height: 10
    };

    this.resetBall();
    this.buildBricks();
  }

  resetBall() {
    this.ball = {
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 8,
      vx: 0,
      vy: 0,
      radius: 5,
      active: false
    };
  }

  launchBall() {
    if (this.ball.active) return;
    const angle = (Math.random() * 60 - 30) * Math.PI / 180;
    this.ball.vx = this.ballSpeed * Math.sin(angle);
    this.ball.vy = -this.ballSpeed * Math.cos(angle);
    this.ball.active = true;
  }

  buildBricks() {
    this.bricks = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        this.bricks.push({
          x: 5 + c * 63,
          y: 50 + r * 16,
          w: 57,
          h: 12,
          active: true
        });
      }
    }
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));

    this.update(arcadeFrameStep(this, timestamp, 'breakout'));
    this.draw();
  }

  update(step = 1) {
    const leftHeld = this.keysPressed.left || window.ArcadeInput?.isDown('LEFT');
    const desiredPaddleWidth = (this.breakoutWide || hasDevModifier('breakout', 'wide_paddle')) ? 118 : Math.max(50, 80 - (this.level - 1) * 10);
    this.paddle.width += (desiredPaddleWidth - this.paddle.width) * Math.min(1, 0.12 * step);
    const rightHeld = this.keysPressed.right || window.ArcadeInput?.isDown('RIGHT');
    const paddleSpeed = hasDevModifier('breakout', 'wide_paddle') ? 8.2 : 7.2;
    if (leftHeld) this.paddle.x = Math.max(0, this.paddle.x - paddleSpeed * step);
    if (rightHeld) this.paddle.x = Math.min(this.playfieldWidth - this.paddle.width, this.paddle.x + paddleSpeed * step);

    if (!this.ball.active) {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
      this.ball.y = this.paddle.y - this.ball.radius - 1;
      if (this.gameContainer) this.gameContainer.dataset.ballActive = 'false';
      return;
    }
    if (this.gameContainer) {
      this.gameContainer.dataset.ballActive = 'true';
      this.gameContainer.dataset.paddleX = String(Math.round(this.paddle.x));
    }

    const lastX = this.ball.x;
    const lastY = this.ball.y;

    this.ball.x += this.ball.vx * step;
    this.ball.y += this.ball.vy * step;

    // ANTI-STUCK PROTECTION: Minimum velocity components & speed normalization
    if (Math.abs(this.ball.vx) < 1.2) {
      this.ball.vx = (this.ball.vx < 0 ? -1.2 : 1.2);
    }
    if (Math.abs(this.ball.vy) < 1.5) {
      this.ball.vy = (this.ball.vy < 0 ? -1.5 : 1.5);
    }
    const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    if (currentSpeed > 0 && Math.abs(currentSpeed - this.ballSpeed) > 0.1) {
      this.ball.vx = (this.ball.vx / currentSpeed) * this.ballSpeed;
      this.ball.vy = (this.ball.vy / currentSpeed) * this.ballSpeed;
    }

    // ANTI-STUCK: Stuck position detector
    const distMoved = Math.hypot(this.ball.x - lastX, this.ball.y - lastY);
    if (distMoved < 0.2) {
      this.stuckTimer = (this.stuckTimer || 0) + 1;
      if (this.stuckTimer > 20) {
        this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * (this.ballSpeed * 0.7);
        this.ball.vy = -this.ballSpeed * 0.7;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }

    // Wall Collisions
    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius + 1;
      this.ball.vx = Math.abs(this.ball.vx);
      this.audio.playGameSfx('breakout', 'wall');
    }
    if (this.ball.x + this.ball.radius > this.playfieldWidth) {
      this.ball.x = this.playfieldWidth - this.ball.radius - 1;
      this.ball.vx = -Math.abs(this.ball.vx);
      this.audio.playGameSfx('breakout', 'wall');
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius + 1;
      this.ball.vy = Math.abs(this.ball.vy);
      this.audio.playGameSfx('breakout', 'wall');
    }

    // Out of bounds
    if (this.ball.y + this.ball.radius > this.playfieldHeight) {
      if (!hasDevModifier('breakout', 'infinite_lives')) this.lives--;
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.resetBall();
      }
      return;
    }

    // Paddle Collision
    if (this.ball.vy > 0 &&
        this.ball.y + this.ball.radius >= this.paddle.y &&
        this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
        this.ball.x >= this.paddle.x &&
        this.ball.x <= this.paddle.x + this.paddle.width) {

      const relHit = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
      const angle = relHit * (60 * Math.PI / 180);
      this.ball.vx = this.ballSpeed * Math.sin(angle);
      this.ball.vy = -this.ballSpeed * Math.cos(angle);
      this.ball.y = this.paddle.y - this.ball.radius - 1;
      this.ballSpeed = Math.min(8.4, this.ballSpeed * 1.018);
      this.audio.playGameSfx('breakout', 'paddle');
    }

    // Brick Collisions
    for (let b of this.bricks) {
      if (!b.active) continue;
      if (this.ball.x + this.ball.radius >= b.x &&
          this.ball.x - this.ball.radius <= b.x + b.w &&
          this.ball.y + this.ball.radius >= b.y &&
          this.ball.y - this.ball.radius <= b.y + b.h) {

        b.active = false;
        this.score += 50;
        this.ball.vy = -this.ball.vy;
        this.audio.playGameSfx('breakout', 'brick');
        if (this.score > 0 && this.score % 400 === 0) {
          activateGameBuff(this, new PowerUpDefinition({ id: 'wide_paddle', icon: '↔', effect: 'Expanded paddle', activate: app => { app.breakoutWide = true; }, deactivate: app => { app.breakoutWide = false; } }));
        }
        break;
      }
    }
    if (this.bricks.length && this.bricks.every(brick => !brick.active)) {
      this.victory();
    }
  }

  victory() {
    this.cancelLoop();
    this.state = 'VICTORY';
    clearGameBuffs(this);
    markOutcome(this, 'victory', 'board-cleared');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('breakout'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_breakout_best', this.highScore);
    }
    this.bus.emit('BREAKOUT_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'breakout' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'breakout',
      outcome: 'BOARD_CLEARED',
      title: 'BOARD CLEARED!',
      subtitle: 'ALL BRICKS DEMOLISHED',
      accentColor: '#a855f7',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'FINAL SCORE', value: this.score, highlight: true },
        { label: 'LEVEL', value: this.level || 1 },
        { label: 'BEST', value: this.highScore }
      ],
      onNext: () => {
        this.level = (this.level || 1) + 1;
        this.initLevel();
        this.startLoop();
      },
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('breakout', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'ball-lost');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('breakout'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_breakout_best', this.highScore);
    }
    this.bus.emit('BREAKOUT_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'breakout' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'breakout',
      outcome: 'GAME_OVER',
      title: 'GAME OVER',
      subtitle: 'ALL BALLS LOST',
      accentColor: '#ec4899',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'LEVEL', value: this.level || 1 },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.paddle || !this.ball || !this.bricks) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#0c0c0e';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#0284c7';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 4);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#facc15';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

    this.bricks.forEach(b => {
      if (b.active) {
        // Determine row index based on Y position (assuming y = 50 + r * 16)
        const rowIndex = Math.floor((b.y - 50) / 16);
        const color = colors[Math.min(colors.length - 1, Math.max(0, rowIndex))];

        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(b.x, b.y, b.w, b.h, 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Specular highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
      }
    });
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.bus.off('ARCADE_CONFIRM', this.confirmHandler);
    this.bus.off('ARCADE_ACTION_A', this.confirmHandler);
    this.bus.off('ARCADE_LEFT', this.leftHandler);
    this.bus.off('ARCADE_RIGHT', this.rightHandler);
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 7. GAME: NEON PONG (Pong style table tennis)
// ============================================================================
class NeonPongApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_pong_best', 0);
    this.state = 'READY';
    this.active = false;
    this.rafId = null;

    this.playfieldWidth = 640;
    this.playfieldHeight = 360;
    this.keys = { p1Up: false, p1Down: false };
    this.p1 = { y: 140, h: 80 };
    this.p2 = { y: 140, h: 80 };
    this.ball = { x: 320, y: 180, r: 5 };
  }

  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-neonpong" id="pong-game-container" tabindex="0">
        <div id="pong-hud" class="pong-hud">
          <div class="hud-item">P1 <span id="p1-score">0</span></div>
          <div class="hud-item">VS</div>
          <div class="hud-item">CPU <span id="p2-score">0</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="pong-canvas"></canvas>
        </div>
        <div id="pong-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#pong-game-container');
    this.canvas = this.container.querySelector('#pong-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#pong-overlay-view');
    this.hudP1 = this.container.querySelector('#p1-score');
    this.hudP2 = this.container.querySelector('#p2-score');

    this.gameContainer.focus({ preventScroll: true });
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);

    this.keydownHandler = (e) => {
      if (!this.active) return;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.p1Up = true;
      if (e.key === 'ArrowDown' || e.key === 's') this.keys.p1Down = true;
      if (e.key === ' ') this.handleConfirm();
    };
    this.keyupHandler = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.p1Up = false;
      if (e.key === 'ArrowDown' || e.key === 's') this.keys.p1Down = false;
    };
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);

    this.transitionToState('READY');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  handleConfirm() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') this.start();
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'pong-overlay-active';
      this.overlay.innerHTML = `
        <div class="pong-menu">
          <div class="pong-logo">🏓</div>
          <h2>NEON PONG</h2>
          <p>Deflect the ball. First to 7 points wins!</p>
          <button class="pong-btn primary" id="np-start">START MATCH</button>
        </div>
      `;
      const npStart = this.overlay.querySelector('#np-start');
      if (npStart) npStart.onclick = () => this.start();
    }
  }

  start() {
    this.p1Score = 0;
    this.p2Score = 0;
    this.p1 = { y: 150, h: 60, speed: 5.5 };
    this.p2 = { y: 150, h: 60, speed: 3.8 };
    this.resetBall();

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'neonpong' });
  }

  resetBall() {
    this.ball = {
      x: 320, y: 180,
      vx: (Math.random() > 0.5 ? 1 : -1) * 4,
      vy: (Math.random() * 4 - 2),
      radius: 5
    };
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((next) => this.gameLoop(next));

    this.update(arcadeFrameStep(this, timestamp, 'neonpong'));
    this.draw();
  }

  update(step = 1) {
    const upHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('UP') || this.keys.p1Up) : this.keys.p1Up;
    const downHeld = window.ArcadeInput ? (window.ArcadeInput.isDown('DOWN') || this.keys.p1Down) : this.keys.p1Down;

    const playerBoost = hasDevModifier('neonpong', 'paddle_boost') ? 1.45 : 1;
    if (upHeld) this.p1.y = Math.max(0, this.p1.y - this.p1.speed * playerBoost * step);
    if (downHeld) this.p1.y = Math.min(this.playfieldHeight - this.p1.h, this.p1.y + this.p1.speed * playerBoost * step);

    const p2Center = this.p2.y + this.p2.h / 2;
    if (this.ball.y < p2Center - 6) this.p2.y -= this.p2.speed * step;
    else if (this.ball.y > p2Center + 6) this.p2.y += this.p2.speed * step;
    this.p2.y = Math.max(0, Math.min(this.playfieldHeight - this.p2.h, this.p2.y));

    const b = this.ball;
    b.x += b.vx * step;
    b.y += b.vy * step;

    if (b.y - b.radius < 0 || b.y + b.radius > this.playfieldHeight) {
      b.vy = -b.vy;
      this.audio.playGameSfx('neonpong', 'wall');
    }

    if (b.vx < 0 && b.x - b.radius <= 16 && b.y >= this.p1.y && b.y <= this.p1.y + this.p1.h) {
      b.vx = -Math.sign(b.vx) * Math.min(8.2, Math.abs(b.vx) * 1.035);
      b.vy = (b.y - (this.p1.y + this.p1.h / 2)) * 0.15;
      this.audio.playGameSfx('neonpong', 'paddle');
    }

    if (b.vx > 0 && b.x + b.radius >= this.playfieldWidth - 16 && b.y >= this.p2.y && b.y <= this.p2.y + this.p2.h) {
      b.vx = -Math.sign(b.vx) * Math.min(8.2, Math.abs(b.vx) * 1.035);
      b.vy = (b.y - (this.p2.y + this.p2.h / 2)) * 0.15;
      this.audio.playGameSfx('neonpong', 'paddle');
    }

    if (b.x < 0) {
      this.p2Score++;
      this.audio.playGameSfx('neonpong', 'score');
      if ((this.p1Score + this.p2Score) % 3 === 0) this.p1.h = Math.min(92, this.p1.h + 18);
      this.checkWin();
    } else if (b.x > this.playfieldWidth) {
      this.p1Score++;
      this.audio.playGameSfx('neonpong', 'score');
      if ((this.p1Score + this.p2Score) % 3 === 0) this.p1.h = Math.min(92, this.p1.h + 18);
      this.checkWin();
    }
  }

  checkWin() {
    if (this.hudP1) this.hudP1.textContent = this.p1Score;
    if (this.hudP2) this.hudP2.textContent = this.p2Score;

    if (this.p1Score >= 7 || this.p2Score >= 7) {
      this.gameOver(this.p1Score >= 7);
    } else {
      this.resetBall();
    }
  }

  gameOver(isP1Winner = false) {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    if (!isP1Winner && this.p2Score < 7) this.p2Score = 7;
    else if (isP1Winner && this.p1Score < 7) this.p1Score = 7;
    if (this.hudP1) this.hudP1.textContent = this.p1Score;
    if (this.hudP2) this.hudP2.textContent = this.p2Score;

    this.audio.playGameSfx('neonpong', 'victory');
    markOutcome(this, isP1Winner ? 'victory' : 'gameover', 'match-win');
    this.bus.emit('NEONPONG_SCORE', { score: this.p1Score });
    this.bus.emit('GAME_COMPLETED', { id: 'neonpong' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'neonpong',
      outcome: isP1Winner ? 'VICTORY' : 'DEFEAT',
      title: isP1Winner ? 'VICTORY!' : 'DEFEAT',
      subtitle: isP1Winner ? 'PLAYER 1 VICTORIOUS' : 'CPU TOURNAMENT WINNER',
      accentColor: '#06b6d4',
      stats: [
        { label: 'PLAYER 1', value: this.p1Score, highlight: isP1Winner },
        { label: 'CPU / P2', value: this.p2Score, highlight: !isP1Winner }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.p1 || !this.p2 || !this.ball) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.setLineDash([8, 8]);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.playfieldWidth / 2, 0);
    this.ctx.lineTo(this.playfieldWidth / 2, this.playfieldHeight);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#0ea5e9';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.roundRect(10, this.p1.y, 8, this.p1.h, 4);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#f43f5e';
    this.ctx.shadowColor = '#e11d48';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.roundRect(this.playfieldWidth - 18, this.p2.y, 8, this.p2.h, 4);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#fde047';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 8. GAME: VOID INVADERS (Space Invaders style)
// ============================================================================
class VoidInvadersApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_invaders_best', 0);
    this.state = 'READY';
    this.active = false;
    this.rafId = null;

    this.playfieldWidth = 640;
    this.playfieldHeight = 360;
    this.keys = { left: false, right: false };
    this.cannon = { x: 320, y: 330 };
    this.bullets = [];
    this.invaders = [];
    this.enemyBullets = [];
    this.wave = 1;
    this.fireCooldown = 0;
  }

  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-voidinvaders" id="vi-game-container" tabindex="0">
        <div id="vi-hud" class="vi-hud">
          <div class="hud-item">SCORE <span id="vi-score">0</span></div>
          <div class="hud-item">HI <span id="vi-high">${this.highScore}</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="vi-canvas"></canvas>
        </div>
        <div id="vi-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#vi-game-container');
    this.canvas = this.container.querySelector('#vi-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#vi-overlay-view');
    this.hudScore = this.container.querySelector('#vi-score');

    this.gameContainer.focus({ preventScroll: true });
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);

    this.bus.on('ARCADE_LEFT', () => { this.keys.left = true; setTimeout(() => this.keys.left = false, 150); });
    this.bus.on('ARCADE_RIGHT', () => { this.keys.right = true; setTimeout(() => this.keys.right = false, 150); });
    this.bus.on('ARCADE_CONFIRM', () => this.fire());
    this.bus.on('ARCADE_ACTION_A', () => this.fire());

    this.keydownHandler = (e) => {
      if (!this.active) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
      if (e.key === ' ' || e.key === 'Enter') this.fire();
      if (e.key === 'Escape') this.togglePause();
    };
    this.keyupHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    };
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);

    this.transitionToState('READY');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  fire() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') {
      this.start();
    } else if (this.state === 'PLAYING' && !this.bullet) {
      this.bullet = { x: this.cannon.x, y: this.cannon.y - 10, vy: -7 };
      this.audio.playGameSfx('voidinvaders', 'fire');
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.cancelLoop();
    }
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'vi-overlay-active';
      this.overlay.innerHTML = `
        <div class="vi-menu">
          <div class="vi-logo">👾</div>
          <h2>VOID INVADERS</h2>
          <p>Defend earth from invading alien fleets!</p>
          <div class="vi-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="vi-btn primary" id="vi-start">DEFEND NOW</button>
        </div>
      `;
      const viStart = this.overlay.querySelector('#vi-start');
      if (viStart) viStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.wave = 1;
    this.cannon = { x: 320, y: 320, speed: 4 };
    this.bullet = null;
    this.enemyBullets = [];
    this.fireCooldown = 0;
    this.spawnInvaderWave();

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'voidinvaders' });
  }

  spawnInvaderWave() {
    this.invaderDx = 1.1 + this.wave * 0.12;
    this.invaders = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        this.invaders.push({ x: 48 + c * 60, y: 42 + r * 30, active: true });
      }
    }
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((next) => this.gameLoop(next));

    this.update(arcadeFrameStep(this, timestamp, 'voidinvaders'));
    this.draw();
  }

  update(step = 1) {
    const c = this.cannon;
    const leftHeld = this.keys.left || window.ArcadeInput?.isDown('LEFT');
    const rightHeld = this.keys.right || window.ArcadeInput?.isDown('RIGHT');
    const fireHeld = window.ArcadeInput?.isDown('PRIMARY');
    if (leftHeld) c.x = Math.max(16, c.x - c.speed * step);
    if (rightHeld) c.x = Math.min(this.playfieldWidth - 16, c.x + c.speed * step);
    if (this.fireCooldown > 0) this.fireCooldown--;
    if (fireHeld && this.fireCooldown === 0) {
      this.fire();
      this.fireCooldown = 10;
    }

    if (this.bullet) {
      this.bullet.y += this.bullet.vy * step;
      if (this.bullet.y < 0) this.bullet = null;
    }

    let shiftDown = false;
    this.invaders.forEach(inv => {
      if (!inv.active) return;
      inv.x += this.invaderDx * step;
      if (inv.x < 15 || inv.x > this.playfieldWidth - 15) shiftDown = true;

      if (this.bullet && Math.hypot(this.bullet.x - inv.x, this.bullet.y - inv.y) < 14) {
        inv.active = false;
        this.bullet = null;
        this.score += 100;
        this.audio.playGameSfx('voidinvaders', 'invader');
        if (this.score % 800 === 0) {
          activateGameBuff(this, new PowerUpDefinition({ id: 'shield', icon: '◇', effect: 'Absorb one hit', activate: app => { app.voidShield = true; }, deactivate: app => { app.voidShield = false; } }));
        }
        if (this.hudScore) this.hudScore.textContent = this.score;
      }
    });

    if (shiftDown) {
      this.invaderDx = -this.invaderDx * 1.05;
      this.invaders.forEach(inv => inv.y += 10);
    }

    if (Math.random() < 0.018 + this.wave * 0.002) {
      const shooters = this.invaders.filter(inv => inv.active);
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      if (shooter) this.enemyBullets.push({ x: shooter.x, y: shooter.y + 8, vy: 3 + this.wave * 0.15 });
    }
    this.enemyBullets.forEach(b => {
      b.y += b.vy * step;
      if (Math.hypot(b.x - c.x, b.y - c.y) < 13 && !hasDevModifier('voidinvaders', 'invincible')) {
        if (this.voidShield) this.voidShield = false;
        else this.gameOver();
      }
    });
    if (this.state !== 'PLAYING') return;
    this.enemyBullets = this.enemyBullets.filter(b => b.y < this.playfieldHeight + 10);

    if (this.invaders.some(inv => inv.active && inv.y >= c.y - 24)) {
      this.gameOver();
      return;
    }
    if (this.invaders.length && this.invaders.every(inv => !inv.active)) {
      markOutcome(this, 'victory', 'wave-cleared');
      this.audio.playGameSfx('voidinvaders', 'waveClear');
      this.wave++;
      this.enemyBullets = [];
      this.spawnInvaderWave();
    }
    if (this.gameContainer) {
      this.gameContainer.dataset.cannonX = String(Math.round(c.x));
      this.gameContainer.dataset.bulletCount = String(this.bullet ? 1 : 0);
      this.gameContainer.dataset.wave = String(this.wave);
    }
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('voidinvaders', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'cannon-explosion');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('voidinvaders'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_invaders_best', this.highScore);
    }
    this.bus.emit('VOIDINVADERS_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'voidinvaders' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'voidinvaders',
      outcome: 'GAME_OVER',
      title: 'DEFENSE BREACHED',
      subtitle: 'VOID INVADERS REACHED SURFACE',
      accentColor: '#8b5cf6',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'WAVE', value: this.wave || 1 },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#060913';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    if (this.bullet) {
      this.ctx.fillStyle = '#fde047';
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 8;
      this.ctx.fillRect(this.bullet.x - 1.5, this.bullet.y, 3, 8);
      this.ctx.shadowBlur = 0;
    }

    this.ctx.fillStyle = '#fb7185';
    this.ctx.shadowColor = '#e11d48';
    this.ctx.shadowBlur = 6;
    this.enemyBullets.forEach(b => {
      this.ctx.fillRect(b.x - 2, b.y, 4, 9);
    });
    this.ctx.shadowBlur = 0;

    const time = performance.now();
    this.invaders.forEach((inv, index) => {
      if (inv.active) {
        this.ctx.fillStyle = '#a855f7';
        this.ctx.shadowColor = '#d946ef';
        this.ctx.shadowBlur = 6;

        // Wobble animation
        const wobble = Math.sin(time / 200 + index) * 2;
        this.ctx.beginPath();
        this.ctx.roundRect(inv.x - 8 + wobble, inv.y - 6, 16, 12, 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Eyes
        this.ctx.fillStyle = '#fdf4ff';
        this.ctx.fillRect(inv.x - 4 + wobble, inv.y - 2, 2, 2);
        this.ctx.fillRect(inv.x + 2 + wobble, inv.y - 2, 2, 2);
      }
    });

    this.ctx.fillStyle = '#10b981';
    this.ctx.shadowColor = '#34d399';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(this.cannon.x, this.cannon.y - 6);
    this.ctx.lineTo(this.cannon.x + 12, this.cannon.y + 10);
    this.ctx.lineTo(this.cannon.x - 12, this.cannon.y + 10);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#059669';
    this.ctx.fillRect(this.cannon.x - 4, this.cannon.y - 2, 8, 12);

    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 9. GAME: VECTOR DRIFT (Asteroids vector arcade shooter)
// ============================================================================
class VectorDriftApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_vector_best', 0);
    this.state = 'READY';
    this.active = false;
    this.rafId = null;

    this.playfieldWidth = 640;
    this.playfieldHeight = 360;
    this.keys = { left: false, right: false, thrust: false };
    this.ship = { x: 320, y: 180, angle: 0, vx: 0, vy: 0 };
    this.bullets = [];
    this.asteroids = [];
    this.fireCooldown = 0;
  }

  mount() {
    this.active = true;
    this.container.innerHTML = `
      <div class="app-vectordrift" id="vd-game-container" tabindex="0">
        <div id="vd-hud" class="vd-hud">
          <div class="hud-item">SCORE <span id="vd-score">0</span></div>
          <div class="hud-item">HI <span id="vd-high">${this.highScore}</span></div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="vd-canvas"></canvas>
        </div>
        <div id="vd-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#vd-game-container');
    this.canvasWrapper = this.container.querySelector('.canvas-wrapper');
    this.canvas = this.container.querySelector('#vd-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#vd-overlay-view');
    this.hudScore = this.container.querySelector('#vd-score');

    this.gameContainer.focus({ preventScroll: true });
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.canvasWrapper);

    this.keydownHandler = (e) => {
      if (!this.active) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.thrust = true;
      if (e.key === ' ') this.fire();
    };
    this.keyupHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.thrust = false;
    };
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);

    this.transitionToState('READY');
  }

  resizeCanvas() {
    if (!this.canvas || !this.canvasWrapper) return;
    const w = this.canvasWrapper.clientWidth;
    const h = this.canvasWrapper.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const worldScale = Math.min(w / this.playfieldWidth, h / this.playfieldHeight);
    const offsetX = (w - this.playfieldWidth * worldScale) / 2;
    const offsetY = (h - this.playfieldHeight * worldScale) / 2;

    this.dpr = dpr;
    this.worldScale = worldScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.draw();
  }

  fire() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') {
      this.start();
    } else if (this.state === 'PLAYING') {
      const spread = (this.vectorTripleShot || hasDevModifier('vectordrift', 'triple_shot')) ? [-0.18, 0, 0.18] : [0];
      spread.forEach(offset => {
        const angle = this.ship.angle + offset;
        this.bullets.push({
          x: this.ship.x + Math.cos(angle) * 12,
          y: this.ship.y + Math.sin(angle) * 12,
          vx: Math.cos(angle) * 7 + this.ship.vx,
          vy: Math.sin(angle) * 7 + this.ship.vy,
          life: 45
        });
      });
      this.audio.playGameSfx('vectordrift', 'fire');
    }
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.overlay.className = 'vd-overlay-active';
      this.overlay.innerHTML = `
        <div class="vd-menu">
          <div class="vd-logo">☄️</div>
          <h2>VECTOR DRIFT</h2>
          <p>Thrust & inertia vector pilot — destroy splitting asteroids!</p>
          <div class="vd-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="vd-btn primary" id="vd-start">PILOT SHIP</button>
        </div>
      `;
      const vdStart = this.overlay.querySelector('#vd-start');
      if (vdStart) vdStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.ship = { x: 320, y: 180, angle: -Math.PI / 2, vx: 0, vy: 0 };
    this.bullets = [];
    this.asteroids = [];
    this.fireCooldown = 0;

    for (let i = 0; i < 5; i++) {
      let asteroidX;
      let asteroidY;
      do {
        asteroidX = Math.random() * this.playfieldWidth;
        asteroidY = Math.random() * this.playfieldHeight;
      } while (Math.hypot(asteroidX - this.ship.x, asteroidY - this.ship.y) < 90);
      this.asteroids.push({
        x: asteroidX,
        y: asteroidY,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        radius: 20
      });
    }

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'vectordrift' });
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((next) => this.gameLoop(next));

    this.update(arcadeFrameStep(this, timestamp, 'vectordrift'));
    this.draw();
  }

  update(step = 1) {
    const s = this.ship;

    // Use ArcadeInput for polled, held-input logic
    const A_isPressed = window.ArcadeInput ? window.ArcadeInput.isPressed('ARCADE_ACTION_A') : false;
    const LEFT_isPressed = window.ArcadeInput ? window.ArcadeInput.isPressed('ARCADE_LEFT') : false;
    const RIGHT_isPressed = window.ArcadeInput ? window.ArcadeInput.isPressed('ARCADE_RIGHT') : false;
    const UP_isPressed = window.ArcadeInput ? window.ArcadeInput.isPressed('ARCADE_UP') : false;

    if (LEFT_isPressed || this.keys.left) s.angle -= 0.095 * step;
    if (RIGHT_isPressed || this.keys.right) s.angle += 0.095 * step;

    if (UP_isPressed || this.keys.thrust) {
      const thrust = hasDevModifier('vectordrift', 'thrust_boost') ? 0.31 : 0.23;
      s.vx += Math.cos(s.angle) * thrust * step;
      s.vy += Math.sin(s.angle) * thrust * step;
      this.audio.playGameSfx('vectordrift', 'thrust', { cooldown: 110 });
    }

    if (this.fireCooldown > 0) this.fireCooldown--;
    if ((A_isPressed || this.keys.fire) && this.fireCooldown === 0) {
      this.fire();
      this.fireCooldown = 15; // Rate limit firing
    }

    s.vx *= Math.pow(0.985, step);
    s.vy *= Math.pow(0.985, step);

    s.x = (s.x + s.vx * step + this.playfieldWidth) % this.playfieldWidth;
    s.y = (s.y + s.vy * step + this.playfieldHeight) % this.playfieldHeight;

    this.bullets.forEach(b => {
      b.x = (b.x + b.vx * step + this.playfieldWidth) % this.playfieldWidth;
      b.y = (b.y + b.vy * step + this.playfieldHeight) % this.playfieldHeight;
      b.life -= step;
    });
    this.bullets = this.bullets.filter(b => b.life > 0);

    const newAsteroids = [];
    this.asteroids.forEach(a => {
      a.x = (a.x + a.vx * step + this.playfieldWidth) % this.playfieldWidth;
      a.y = (a.y + a.vy * step + this.playfieldHeight) % this.playfieldHeight;

      this.bullets.forEach(b => {
        if (b.life > 0 && Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          b.life = 0; // Destroy bullet
          a.radius -= 8;
          this.score += 50;
          this.audio.playGameSfx('vectordrift', 'asteroid');
          if (this.score % 500 === 0) {
            activateGameBuff(this, new PowerUpDefinition({ id: 'triple_shot', icon: '⋔', effect: 'Three-way vector fire', activate: app => { app.vectorTripleShot = true; }, deactivate: app => { app.vectorTripleShot = false; } }));
          }
          if (this.hudScore) this.hudScore.textContent = this.score;

          if (a.radius > 6) {
            this.audio.playGameSfx('vectordrift', 'split');
            // Split into two smaller asteroids
            newAsteroids.push({
              x: a.x,
              y: a.y,
              vx: a.vx + (Math.random() - 0.5) * 2,
              vy: a.vy + (Math.random() - 0.5) * 2,
              radius: a.radius
            });
            a.vx += (Math.random() - 0.5) * 2;
            a.vy += (Math.random() - 0.5) * 2;
          }
        }
      });

      // Check collision with ship
      if (Math.hypot(s.x - a.x, s.y - a.y) < a.radius + 6 && !hasDevModifier('vectordrift', 'invincible')) {
         this.gameOver();
      }
    });

    if (newAsteroids.length > 0) {
      this.asteroids.push(...newAsteroids);
    }
    this.asteroids = this.asteroids.filter(a => a.radius > 6);

    if (this.asteroids.length === 0) {
       this.spawnNextWave();
    }
    if (this.gameContainer) {
      this.gameContainer.dataset.bulletCount = String(this.bullets.length);
      this.gameContainer.dataset.shipX = String(Math.round(s.x));
    }
  }

  spawnNextWave() {
     for (let i = 0; i < 5; i++) {
      let asteroidX;
      let asteroidY;
      do {
        asteroidX = Math.random() * this.playfieldWidth;
        asteroidY = Math.random() * this.playfieldHeight;
      } while (Math.hypot(asteroidX - this.ship.x, asteroidY - this.ship.y) < 90);
      this.asteroids.push({
        x: asteroidX,
        y: asteroidY,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 20
      });
    }
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('vectordrift', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'ship-fragmentation');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('vectordrift'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_vectordrift_best', this.highScore);
    }
    this.bus.emit('VECTOR_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'vectordrift' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'vectordrift',
      outcome: isNewHigh ? 'NEW_HIGH_SCORE' : 'GAME_OVER',
      title: isNewHigh ? 'NEW HIGH SCORE!' : 'GAME OVER',
      subtitle: 'ASTEROID FIELD COLLISION',
      accentColor: '#38bdf8',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.ship || !this.bullets || !this.asteroids) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#04060c';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(this.offsetX || 0, this.offsetY || 0);
    this.ctx.scale(this.worldScale || 1, this.worldScale || 1);

    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.shadowColor = '#0284c7';
    this.ctx.shadowBlur = 6;
    this.ctx.lineWidth = 1.5;

    const s = this.ship;
    this.ctx.save();
    this.ctx.translate(s.x, s.y);
    this.ctx.rotate(s.angle);
    this.ctx.beginPath();
    this.ctx.moveTo(12, 0);
    this.ctx.lineTo(-10, -8);
    this.ctx.lineTo(-6, 0);
    this.ctx.lineTo(-10, 8);
    this.ctx.closePath();
    this.ctx.stroke();

    const UP_isPressed = window.ArcadeInput ? window.ArcadeInput.isPressed('ARCADE_UP') : false;
    if (UP_isPressed || this.keys.thrust) {
      this.ctx.strokeStyle = '#f97316';
      this.ctx.shadowColor = '#ea580c';
      this.ctx.beginPath();
      this.ctx.moveTo(-6, 0);
      this.ctx.lineTo(-14 - Math.random() * 6, 0);
      this.ctx.stroke();
    }

    this.ctx.restore();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 8;
    this.bullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = '#a3e635';
    this.ctx.shadowColor = '#65a30d';
    this.ctx.shadowBlur = 5;
    this.asteroids.forEach(a => {
      this.ctx.beginPath();
      // Draw jagged asteroids
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Pseudo-random offset based on position and size
        const noise = Math.sin(angle * 3 + a.x) * 3 + Math.cos(angle * 5 + a.y) * 2;
        const r = a.radius + noise;
        const px = a.x + Math.cos(angle) * r;
        const py = a.y + Math.sin(angle) * r;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    });
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 10. GAME: BLOCK//DROP (Tetris-style puzzle)
// ============================================================================
class BlockDropApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;

    this.highScore = this.storage.get('arcade_blockdrop_best', 0);
    this.state = 'READY';
    this.active = false;
    this.destroyed = false;

    this.cols = 10;
    this.rows = 20;
    this.cellSize = 20;
    this.boardX = 0;
    this.boardY = 0;
    this.boardW = 200;
    this.boardH = 400;
    this.dpr = 1;

    this.rafId = null;
    this.lastDropTime = 0;

    this.score = 0;
    this.linesCleared = 0;
    this.level = 1;
    this.combo = 0;

    this.nextQueue = [];
    this.heldType = null;
    this.canHold = true;

    this.shapes = {
      I: [[1,1,1,1]],
      J: [[1,0,0],[1,1,1]],
      L: [[0,0,1],[1,1,1]],
      O: [[1,1],[1,1]],
      S: [[0,1,1],[1,1,0]],
      T: [[0,1,0],[1,1,1]],
      Z: [[1,1,0],[0,1,1]]
    };
    this.colors = {
      I: '#06b6d4',
      J: '#3b82f6',
      L: '#f97316',
      O: '#eab308',
      S: '#22c55e',
      T: '#a855f7',
      Z: '#ef4444'
    };

    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.piece = null;
  }

  mount() {
    this.active = true;
    this.destroyed = false;
    this.container.innerHTML = `
      <div class="app-blockdrop" id="bd-game-container" tabindex="0">
        <div class="canvas-wrapper">
          <canvas id="bd-canvas"></canvas>
        </div>
        <div id="bd-overlay-view" class="active"></div>
      </div>
    `;

    this.gameContainer = this.container.querySelector('#bd-game-container');
    this.canvas = this.container.querySelector('#bd-canvas');
    this.canvasWrapper = this.container.querySelector('.canvas-wrapper');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = this.container.querySelector('#bd-overlay-view');

    this.gameContainer.focus({ preventScroll: true });

    // Initial resize calculation BEFORE rendering READY screen
    this.resizeCanvas();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.canvasWrapper || this.container);

    this.bus.on('ARCADE_LEFT', () => this.move(-1));
    this.bus.on('ARCADE_RIGHT', () => this.move(1));
    this.bus.on('ARCADE_UP', () => this.rotate());
    this.bus.on('ARCADE_DOWN', () => this.drop());
    this.bus.on('ARCADE_CONFIRM', () => this.hardDrop());
    this.bus.on('ARCADE_ACTION_A', () => this.hardDrop());
    this.bus.on('ARCADE_ACTION_X', () => this.rotate());
    this.bus.on('ARCADE_ACTION_B', () => this.holdPiece());

    this.keydownHandler = (e) => {
      if (!this.active || this.destroyed) return;
      const key = e.key;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'c', 'C', 'Shift', 'x', 'X'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();

        if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.move(-1);
        else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.move(1);
        else if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'x' || key === 'X') this.rotate();
        else if (key === 'ArrowDown' || key === 's' || key === 'S') this.drop();
        else if (key === ' ' || key === 'Enter') this.hardDrop();
        else if (key === 'c' || key === 'C' || key === 'Shift') this.holdPiece();
      } else if (key === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    this.transitionToState('READY');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvasWrapper || this.container;
    const w = parent.clientWidth || this.container.clientWidth || 600;
    const h = parent.clientHeight || this.container.clientHeight || 400;
    if (!w || !h) return;

    // Standard 10 columns x 20 rows visible playfield
    this.cols = 10;
    this.rows = 20;

    // Use 94% of safe CRT area to ensure full visibility above bottom blind curve
    const availW = w * 0.94;
    const availH = h * 0.94;

    // Side panel width calculation
    const sideW = Math.max(90, Math.floor(w * 0.20));
    const availBoardW = availW - (2 * sideW) - 20;
    const availBoardH = availH - 20;

    let cellSize = Math.floor(Math.min(availBoardW / this.cols, availBoardH / this.rows));
    if (cellSize < 12) cellSize = 12;
    this.cellSize = cellSize;

    this.boardW = this.cols * this.cellSize;
    this.boardH = this.rows * this.cellSize;

    // Center board horizontally and vertically within safe CRT viewport
    this.boardX = Math.floor((w - this.boardW) / 2);
    this.boardY = Math.floor((h - this.boardH) / 2);

    this.leftPanelW = sideW;
    this.leftPanelX = Math.max(10, this.boardX - sideW - 14);

    this.rightPanelW = sideW;
    this.rightPanelX = Math.min(w - sideW - 10, this.boardX + this.boardW + 14);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;

    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.style.display = 'block';

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    this.draw();
  }

  transitionToState(nextState) {
    this.state = nextState;
    if (nextState === 'READY') {
      this.score = 0;
      this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
      this.linesCleared = 0;
      this.level = 1;
      this.combo = 0;
      this.nextQueue = [];
      this.heldType = null;
      this.canHold = true;
      this.refillNextQueue();
      this.draw();

      this.overlay.className = 'bd-overlay-active';
      this.overlay.innerHTML = `
        <div class="bd-menu">
          <div class="bd-logo">🧱</div>
          <h2>BLOCK//DROP</h2>
          <p>Rotate & drop falling blocks to clear lines!</p>
          <div class="bd-hi">HIGH SCORE: ${this.highScore}</div>
          <button class="bd-btn primary" id="bd-start">START PUZZLE</button>
        </div>
      `;
      const bdStart = this.overlay.querySelector('#bd-start');
      if (bdStart) bdStart.onclick = () => this.start();
    }
  }

  start() {
    this.score = 0;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.linesCleared = 0;
    this.level = 1;
    this.combo = 0;
    this.nextQueue = [];
    this.heldType = null;
    this.canHold = true;

    this.refillNextQueue();
    this.spawnPiece();

    this.state = 'PLAYING';
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.cancelLoop();
    this.lastDropTime = performance.now();
    this.gameLoop(performance.now());
    this.bus.emit('GAME_LAUNCHED', { id: 'blockdrop' });
  }

  refillNextQueue() {
    const keys = Object.keys(this.shapes);
    while (this.nextQueue.length < 5) {
      const bag = [...keys].sort(() => Math.random() - 0.5);
      this.nextQueue.push(...bag);
    }
  }

  spawnPiece(forcedType = null) {
    this.refillNextQueue();
    const type = forcedType || this.nextQueue.shift();
    this.piece = {
      type,
      matrix: this.shapes[type].map(row => [...row]),
      color: this.colors[type],
      x: Math.floor((this.cols - this.shapes[type][0].length) / 2),
      y: 0
    };
    if (this.gameContainer) this.gameContainer.dataset.pieceMatrix = JSON.stringify(this.piece.matrix);
  }

  move(dir) {
    if (this.state !== 'PLAYING' || !this.piece) return;
    const now = performance.now();
    if (this._lastMoveTime && now - this._lastMoveTime < 40) return;
    this._lastMoveTime = now;

    this.piece.x += dir;
    if (this.collide()) {
      this.piece.x -= dir;
    } else {
      this.audio.playGameSfx('blockdrop', 'move', { cooldown: 55 });
    }
  }

  rotate() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    const now = performance.now();
    if (this._lastRotateTime && now - this._lastRotateTime < 80) return;
    this._lastRotateTime = now;

    const m = this.piece.matrix;
    const rotated = m[0].map((_, i) => m.map(row => row[i]).reverse());
    const oldX = this.piece.x;
    const oldY = this.piece.y;
    const oldMatrix = this.piece.matrix;

    // SRS Wall Kick Candidate Offsets
    const kickOffsets = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
      [-1, -1],
      [1, -1],
      [0, -2]
    ];

    for (const [dx, dy] of kickOffsets) {
      if (!this.collideAt(oldX + dx, oldY + dy, rotated)) {
        this.piece.x = oldX + dx;
        this.piece.y = oldY + dy;
        this.piece.matrix = rotated;
        if (this.gameContainer) this.gameContainer.dataset.pieceMatrix = JSON.stringify(this.piece.matrix);
        this.audio.playGameSfx('blockdrop', 'rotate');
        return;
      }
    }

    this.piece.x = oldX;
    this.piece.y = oldY;
    this.piece.matrix = oldMatrix;
  }

  holdPiece() {
    if (this.state !== 'PLAYING' || !this.canHold || !this.piece) return;
    const now = performance.now();
    if (this._lastHoldTime && now - this._lastHoldTime < 100) return;
    this._lastHoldTime = now;

    const outgoing = this.piece.type;
    const incoming = this.heldType;
    this.heldType = outgoing;
    this.canHold = false;
    this.audio.playGameSfx('blockdrop', 'hold', { cooldown: 90 });
    this.spawnPiece(incoming || null);
  }

  drop() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    this.piece.y++;
    if (this.collide()) {
      this.piece.y--;
      this.lockPiece();
    }
  }

  hardDrop() {
    if (this.state === 'READY' || this.state === 'GAME_OVER') {
      this.start();
      return;
    }
    if (this.state !== 'PLAYING' || !this.piece) return;

    let ghostY = this.piece.y;
    while (!this.collideAt(this.piece.x, ghostY + 1, this.piece.matrix)) {
      ghostY++;
    }
    const dist = ghostY - this.piece.y;
    this.score += dist * 2;
    this.piece.y = ghostY;
    this.audio.playGameSfx('blockdrop', 'hardDrop');
    this.lockPiece();
  }

  collide() {
    if (!this.piece) return false;
    const { matrix, x, y } = this.piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
          if (newY >= 0 && this.grid[newY] && this.grid[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  collideAt(x, y, matrix) {
    if (!matrix) return true;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
          if (newY >= 0 && this.grid[newY] && this.grid[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  lockPiece() {
    if (!this.piece) return;
    const { matrix, x, y, color } = this.piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] && y + r >= 0 && y + r < this.rows && x + c >= 0 && x + c < this.cols) {
          this.grid[y + r][x + c] = color;
        }
      }
    }
    this.audio.playGameSfx('blockdrop', 'lock');
    this.clearLines();
    this.spawnPiece();
    this.canHold = true;

    if (this.collide()) {
      this.gameOver();
    }
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      this.linesCleared += cleared;
      this.level = 1 + Math.floor(this.linesCleared / 10);
      this.combo++;
      const comboMultiplier = 1 + Math.min(3, this.combo - 1) * 0.25;
      this.score += Math.round(cleared * 100 * cleared * comboMultiplier);
      this.audio.playGameSfx('blockdrop', 'clear');
      if (this.combo > 1) this.audio.playGameSfx('blockdrop', 'combo');
      if (this.grid.every(row => row.every(cell => cell === 0))) {
        this.score += 1000;
        markOutcome(this, 'victory', 'perfect-clear');
      }
    } else {
      this.combo = 0;
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.cancelLoop();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastDropTime = performance.now();
      this.gameLoop(performance.now());
    }
  }

  gameLoop(timestamp) {
    if (!this.active || this.state !== 'PLAYING') return;
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));

    const devScale = window.ArcadeDeveloperMode?.getSpeedScale?.() || 1;
    const gravityModifier = hasDevModifier('blockdrop', 'gravity_speed') ? 0.58 : 1;
    const gravityMs = Math.max(80, 500 - (this.level - 1) * 38) * gravityModifier / devScale;

    if (timestamp - this.lastDropTime > gravityMs) {
      this.lastDropTime = timestamp;
      this.drop();
    }
    if (window.ArcadeInput?.isDown('DOWN') && timestamp - this.lastDropTime > 45) {
      this.lastDropTime = timestamp;
      this.drop();
    }
    this.draw();
  }

  gameOver() {
    this.cancelLoop();
    this.state = 'GAME_OVER';
    this.audio.playGameSfx('blockdrop', 'defeat');
    clearGameBuffs(this);
    markOutcome(this, 'gameover', 'board-lockout');

    const isCheated = !!(this.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.('blockdrop'));
    const isNewHigh = this.score > this.highScore && !isCheated;
    if (isNewHigh) {
      this.highScore = this.score;
      this.storage.set('arcade_blockdrop_best', this.highScore);
    }
    this.bus.emit('BLOCKDROP_SCORE', { score: this.score });
    this.bus.emit('GAME_COMPLETED', { id: 'blockdrop' });

    ArcadeOutcomeScreen.show({
      game: this,
      gameId: 'blockdrop',
      outcome: isNewHigh ? 'NEW_HIGH_SCORE' : 'GAME_OVER',
      title: isNewHigh ? 'NEW HIGH SCORE!' : 'TOP OUT!',
      subtitle: 'MATRIX CAPACITY EXCEEDED',
      accentColor: '#3b82f6',
      isNewHighScore: isNewHigh,
      stats: [
        { label: 'SCORE', value: this.score, highlight: true },
        { label: 'LINES', value: this.linesCleared || 0 },
        { label: 'BEST', value: this.highScore }
      ],
      onRetry: () => this.start(),
      onHome: () => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome()
    });
  }

  drawMiniPiece(ctx, type, startX, startY, miniCellSize) {
    if (!type || !this.shapes[type]) return;
    const matrix = this.shapes[type];
    const color = this.colors[type];
    const mW = matrix[0].length * miniCellSize;
    const mH = matrix.length * miniCellSize;
    const ox = startX + Math.floor((miniCellSize * 4 - mW) / 2);
    const oy = startY + Math.floor((miniCellSize * 4 - mH) / 2);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const px = ox + c * miniCellSize + 1;
          const py = oy + r * miniCellSize + 1;
          const s = miniCellSize - 2;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(px, py, s, s, 2);
          ctx.fill();
        }
      }
    }
  }

  draw() {
    if (!this.ctx || !this.active || this.destroyed || !this.grid) return;
    const parent = this.canvasWrapper || this.container;
    const w = parent.clientWidth || this.container.clientWidth || 600;
    const h = parent.clientHeight || this.container.clientHeight || 400;
    const dpr = this.dpr || 1;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Full canvas background
    this.ctx.fillStyle = '#060913';
    this.ctx.fillRect(0, 0, w, h);

    const cs = this.cellSize || 20;
    const bx = this.boardX || 0;
    const by = this.boardY || 0;
    const bw = this.boardW || (10 * cs);
    const bh = this.boardH || (20 * cs);

    // =========================================================================
    // 1. LEFT SIDE PANEL (HOLD & STATS)
    // =========================================================================
    const lX = this.leftPanelX || 10;
    const lW = this.leftPanelW || 100;

    this.ctx.fillStyle = '#0a0f24';
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(lX, by, lW, bh, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // HOLD Header
    this.ctx.font = 'bold 10px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HOLD', lX + lW / 2, by + 18);

    // HOLD Mini Box
    const miniCs = Math.max(6, Math.floor(lW / 5));
    const holdBoxX = lX + Math.floor((lW - miniCs * 4) / 2);
    const holdBoxY = by + 26;

    this.ctx.fillStyle = '#060a17';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.beginPath();
    this.ctx.roundRect(holdBoxX, holdBoxY, miniCs * 4, miniCs * 4, 4);
    this.ctx.fill();
    this.ctx.stroke();

    if (this.heldType) {
      this.drawMiniPiece(this.ctx, this.heldType, holdBoxX, holdBoxY, miniCs);
    } else {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.font = '9px "JetBrains Mono", monospace';
      this.ctx.fillText('EMPTY', lX + lW / 2, holdBoxY + miniCs * 2.2);
    }

    // STATS: LEVEL & LINES
    const statY1 = holdBoxY + miniCs * 4 + 22;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '8px "JetBrains Mono", monospace';
    this.ctx.fillText('LEVEL', lX + lW / 2, statY1);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px "JetBrains Mono", monospace';
    this.ctx.fillText(String(this.level), lX + lW / 2, statY1 + 16);

    const statY2 = statY1 + 38;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '8px "JetBrains Mono", monospace';
    this.ctx.fillText('LINES', lX + lW / 2, statY2);
    this.ctx.fillStyle = '#22c55e';
    this.ctx.font = 'bold 14px "JetBrains Mono", monospace';
    this.ctx.fillText(String(this.linesCleared), lX + lW / 2, statY2 + 16);

    // =========================================================================
    // 2. CENTER PLAYFIELD BOARD
    // =========================================================================
    this.ctx.fillStyle = '#080c1b';
    this.ctx.fillRect(bx, by, bw, bh);

    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(bx, by, bw, bh);

    // Grid lines inside playfield
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let r = 0; r <= this.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(bx, by + r * cs);
      this.ctx.lineTo(bx + bw, by + r * cs);
      this.ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(bx + c * cs, by);
      this.ctx.lineTo(bx + c * cs, by + bh);
      this.ctx.stroke();
    }

    const drawBlock = (c, r, color) => {
      const px = bx + c * cs + 1;
      const py = by + r * cs + 1;
      const s = cs - 2;

      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 4;
      this.ctx.beginPath();
      this.ctx.roundRect(px, py, s, s, 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px + 2, py + 2, s - 4, 2);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(px + 2, py + s - 4, s - 4, 2);
    };

    // Draw settled blocks
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r] && this.grid[r][c]) {
          drawBlock(c, r, this.grid[r][c]);
        }
      }
    }

    // Draw Ghost piece & Active piece
    if (this.piece) {
      const { matrix, x, y, color } = this.piece;
      let ghostY = y;
      while (!this.collideAt(x, ghostY + 1, matrix)) ghostY++;

      // Ghost piece (alpha = 0.25)
      this.ctx.globalAlpha = 0.25;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) drawBlock(x + c, ghostY + r, color);
        }
      }
      this.ctx.globalAlpha = 1.0;

      // Active piece
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            drawBlock(x + c, y + r, color);
          }
        }
      }
    }

    // =========================================================================
    // 3. RIGHT SIDE PANEL (NEXT QUEUE & SCORE)
    // =========================================================================
    const rX = this.rightPanelX || (w - 110);
    const rW = this.rightPanelW || 100;

    this.ctx.fillStyle = '#0a0f24';
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(rX, by, rW, bh, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // NEXT Header
    this.ctx.font = 'bold 10px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('NEXT', rX + rW / 2, by + 18);

    // RENDER NEXT 3 PIECES IN QUEUE
    for (let n = 0; n < 3; n++) {
      const nextT = this.nextQueue[n];
      const nBoxY = by + 26 + n * (miniCs * 4 + 6);

      this.ctx.fillStyle = '#060a17';
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      this.ctx.beginPath();
      this.ctx.roundRect(rX + Math.floor((rW - miniCs * 4) / 2), nBoxY, miniCs * 4, miniCs * 4, 3);
      this.ctx.fill();
      this.ctx.stroke();

      if (nextT) {
        this.drawMiniPiece(this.ctx, nextT, rX + Math.floor((rW - miniCs * 4) / 2), nBoxY, miniCs);
      }
    }

    // STATS: SCORE & BEST
    const scoreY1 = by + 26 + 3 * (miniCs * 4 + 6) + 16;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '8px "JetBrains Mono", monospace';
    this.ctx.fillText('SCORE', rX + rW / 2, scoreY1);
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.font = 'bold 13px "JetBrains Mono", monospace';
    this.ctx.fillText(String(this.score), rX + rW / 2, scoreY1 + 16);

    const scoreY2 = scoreY1 + 38;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '8px "JetBrains Mono", monospace';
    this.ctx.fillText('BEST', rX + rW / 2, scoreY2);
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = 'bold 13px "JetBrains Mono", monospace';
    this.ctx.fillText(String(this.highScore), rX + rW / 2, scoreY2 + 16);
  }

  cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.cancelLoop();
    document.removeEventListener('keydown', this.keydownHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.container.innerHTML = '';
  }
}

// ============================================================================
// 11. TOOL: PALETTE LAB TOOL
// ============================================================================
export class PaletteLabToolApp {
  init(container, bus, storage, audio) {
    this.container = container;
    this.bus = bus;
    this.storage = storage;
    this.audio = audio;
    this.colors = this.storage.get('palettelab_colors', ['#00f0ff', '#ff0055', '#00ff88', '#ffea00', '#a052ff']);
    this.locks = this.storage.get('palettelab_locks', [false, false, false, false, false]);
  }

  mount() {
    this.container.innerHTML = `
      <div class="palette-app">
        <h2>PALETTE LAB</h2>
        <div class="swatch-row">
          ${this.colors.map((c, i) => `<div class="swatch" style="background:${c};height:60px;">${c}</div>`).join('')}
        </div>
        <button id="pl-gen" class="tool-btn" data-arcade-focusable>GENERATE</button>
        <button id="pl-exit" class="tool-btn" data-arcade-focusable>EXIT</button>
      </div>
    `;
    this.container.querySelector('#pl-gen').onclick = () => this.generate();
    this.container.querySelector('#pl-exit').onclick = () => window.ArcadeOS.goHome();
  }

  generate() {
    const hex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    this.colors = this.colors.map((c, i) => this.locks[i] ? c : hex());
    this.audio.playGameSfx('palettelab', 'sample');
    this.mount();
    this.bus.emit('PALETTE_GENERATED', { colors: this.colors });
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    this.container.innerHTML = '';
  }
}

// ============================================================================
// REGISTRATION
// ============================================================================
export function registerAllArcadeApps() {
  const registry = (typeof window !== 'undefined' ? window.ArcadeRegistry : globalThis.ArcadeRegistry);
  if (!registry) return;

  registry.register({
    id: 'pacmaze',
    title: 'PAC-MAZE',
    category: 'RETRO ARCADE',
    description: 'Classic maze chase — eat dots & dodge ghosts.',
    icon: '🟡',
    status: 'ready',
    component: PacMazeApp
  });

  registry.register({
    id: 'pixelplumber',
    title: 'Pixel Plumber',
    category: 'PLATFORMER',
    description: 'Side-scrolling platformer action & collectibles.',
    icon: '🍄',
    status: 'ready',
    component: PixelPlumberApp
  });

  registry.register({
    id: 'flappybyte',
    title: 'Flappy Byte',
    category: 'ARCADE FLYER',
    description: 'One-button endless cyber flight challenge.',
    icon: '🐤',
    status: 'ready',
    component: FlappyByteApp
  });

  registry.register({
    id: 'spacewars',
    title: 'Space Wars',
    category: 'SPACE SHOOTER',
    description: 'Classic space combat — waves, shields & bombs.',
    icon: '🚀',
    status: 'ready',
    component: SpaceWarsApp
  });

  registry.register({
    id: 'snake',
    title: 'Neon Snake',
    category: 'RETRO ARCADE',
    description: 'Classic grid-based snake survival.',
    icon: '🐍',
    status: 'ready',
    component: NeonSnakeApp
  });

  registry.register({
    id: 'breakout',
    title: 'Breakout',
    category: 'RETRO ARCADE',
    description: 'Classic brick breaker with paddle physics.',
    icon: '🔵',
    status: 'ready',
    component: BreakoutApp
  });

  registry.register({
    id: 'neonpong',
    title: 'Neon Pong',
    category: 'RETRO ARCADE',
    description: 'Head-to-head table tennis vs CPU or Player 2.',
    icon: '🏓',
    status: 'ready',
    component: NeonPongApp
  });

  registry.register({
    id: 'voidinvaders',
    title: 'Void Invaders',
    category: 'SPACE SHOOTER',
    description: 'Defend earth from descending alien formations.',
    icon: '👾',
    status: 'ready',
    component: VoidInvadersApp
  });

  registry.register({
    id: 'vectordrift',
    title: 'Vector Drift',
    category: 'VECTOR ARCADE',
    description: 'Inertia space pilot — blast splitting asteroids.',
    icon: '☄️',
    status: 'ready',
    component: VectorDriftApp
  });

  registry.register({
    id: 'blockdrop',
    title: 'BLOCK//DROP',
    category: 'PUZZLE ARCADE',
    description: 'Tetris-style falling geometry puzzle.',
    icon: '🧱',
    status: 'ready',
    component: BlockDropApp
  });

  registry.register({
    id: 'palettelab',
    title: 'Palette Lab',
    category: 'CREATIVE TOOL',
    description: 'Interactive hexadecimal color palette generator.',
    icon: '🧪',
    status: 'ready',
    component: PaletteLabToolApp
  });
}

// Execute registration immediately upon module execution
registerAllArcadeApps();

if (typeof window !== 'undefined' && document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', registerAllArcadeApps);
}

export const ArcadeRegistry = new Proxy({}, {
  get(target, prop) {
    const reg = (typeof window !== 'undefined' ? window.ArcadeRegistry : globalThis.ArcadeRegistry);
    if (!reg) return undefined;
    const val = reg[prop];
    return typeof val === 'function' ? val.bind(reg) : val;
  }
});
