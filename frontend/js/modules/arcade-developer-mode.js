const GAME_MODIFIERS = {
  pacmaze: ['INVINCIBLE', 'FREEZE GHOSTS', 'POWER MODE', 'EXTRA LIFE'],
  pixelplumber: ['INVINCIBLE', 'DOUBLE JUMP', 'NO-CLIP DEBUG', 'SPAWN BUFF'],
  flappybyte: ['INVINCIBLE', 'SLOW TIME', 'SCORE MULTIPLIER'],
  spacewars: ['INVINCIBLE', 'RAPID FIRE', 'TRIPLE SHOT', 'INFINITE SHIELD'],
  snake: ['INVINCIBLE WALLS', 'SPAWN FOOD', 'SCORE MULTIPLIER'],
  breakout: ['MULTIBALL', 'WIDE PADDLE', 'INFINITE LIVES'],
  neonpong: ['PADDLE BOOST', 'BALL SPEED', 'AI DIFFICULTY'],
  voidinvaders: ['INVINCIBLE', 'RAPID FIRE', 'SPREAD SHOT', 'NEXT WAVE'],
  vectordrift: ['INVINCIBLE', 'TRIPLE SHOT', 'THRUST BOOST', 'ASTEROID SPAWN'],
  blockdrop: ['NEXT PIECE DEBUG', 'GRAVITY SPEED', 'CLEAR BOARD'],
  palettelab: ['UNLOCK PALETTE']
};

const normalizeModifier = label => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const ArcadeDeveloperMode = {
  authorized: false,
  discovered: localStorage.getItem('arcade_developer_discovered') === 'true',
  enabled: false,
  isCheatSession: false,
  sessionCode: null,
  gameSpeed: 1,
  modifiers: new Map(),
  activeGameId: null,

  init() {
    window.ArcadeDeveloperMode = this;
    window.authorizeArcadeDeveloperMode = () => this.authorizeFromNimo();
    window.addEventListener('arcade:app-launched', event => this.beginRun(event.detail?.id));
  },

  authorizeFromNimo() {
    if (!this.sessionCode) {
      const fragment = crypto.getRandomValues(new Uint16Array(2));
      this.sessionCode = `NIMO://OVERRIDE-${fragment[0].toString(36).toUpperCase()}${fragment[1].toString(36).toUpperCase()}`;
    }
    this.authorized = true;
    this.discovered = true;
    localStorage.setItem('arcade_developer_discovered', 'true');
    document.body.classList.add('nimo-service-authorized');
    window.ArcadeAudioManager?.playSequence?.([
      [220, 'triangle', 0.08, 0.035, 0, 440],
      [660, 'sine', 0.09, 0.04, 70, 990]
    ], { owner: 'developer' });
    window.ArcadeEventBus?.emit('NIMO_OVERRIDE_AUTHORIZED', { discovered: true });
    return {
      code: this.sessionCode,
      text: 'Override accepted. The machine has more layers than it shows.',
      actions: [{ label: 'SERVICE ACCESS', action: 'openArcadeServiceAccess' }]
    };
  },

  openServiceAccess() {
    if (!this.authorized) return false;
    const chassis = document.querySelector('.cabinet-chassis');
    if (!chassis) return false;
    let core = document.getElementById('arcade-developer-core');
    if (!core) {
      core = document.createElement('section');
      core.id = 'arcade-developer-core';
      core.className = 'arcade-developer-core';
      core.setAttribute('role', 'dialog');
      core.setAttribute('aria-label', 'ArcadeOS Developer Core');
      chassis.appendChild(core);
    }
    core.innerHTML = this.renderCore();
    core.classList.add('is-open');
    chassis.classList.add('service-unlocking');
    window.ArcadeAudioManager?.playSequence?.([
      [150, 'square', 0.06, 0.03], [240, 'triangle', 0.07, 0.035, 65], [520, 'sine', 0.1, 0.04, 140]
    ], { owner: 'developer' });
    setTimeout(() => chassis.classList.remove('service-unlocking'), 700);
    this.bindCore(core);
    return true;
  },

  renderCore() {
    const gameId = this.getActiveGameId();
    const modifiers = GAME_MODIFIERS[gameId] || [];
    return `
      <div class="developer-core-shell">
        <header>
          <div><small>PROJECT // MA-X01</small><h2>DEVELOPER CORE</h2></div>
          <button data-dev-action="close" aria-label="Close Developer Core">×</button>
        </header>
        <div class="developer-auth-line"><span>NIMO AUTHORIZATION</span><b>AUTHORIZED</b></div>
        <section class="developer-mode-switch">
          <div><small>SESSION CONTROL</small><strong>DEVELOPER MODE: ${this.enabled ? 'ON' : 'OFF'}</strong></div>
          <button data-dev-action="${this.enabled ? 'restore' : 'enable'}">${this.enabled ? 'RESTORE STANDARD MODE' : 'ENABLE OVERDRIVE'}</button>
        </section>
        <p class="developer-lore">CLASSIFIED BUILD NOTE 07: the service layer was left reachable by NIMO for field diagnostics. Fair-play records are isolated whenever a gameplay modifier is active.</p>
        ${this.enabled ? `
          <section class="developer-console">
            <div class="developer-console-title"><span>DEVELOPER CONSOLE</span><b>${gameId.toUpperCase()}</b></div>
            <label>GAME SPEED
              <select data-dev-speed>
                ${[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => `<option value="${value}" ${value === this.gameSpeed ? 'selected' : ''}>${value}x${value === 2 ? ' // WARNING' : ''}</option>`).join('')}
              </select>
            </label>
            <div class="developer-modifier-grid">
              ${modifiers.map(label => {
                const id = normalizeModifier(label);
                return `<button data-dev-modifier="${id}" class="${this.hasModifier(gameId, id) ? 'active' : ''}" aria-pressed="${this.hasModifier(gameId, id)}">${label}</button>`;
              }).join('')}
            </div>
          </section>` : ''}
      </div>`;
  },

  bindCore(core) {
    core.querySelector('[data-dev-action="close"]')?.addEventListener('click', () => core.classList.remove('is-open'));
    core.querySelector('[data-dev-action="enable"]')?.addEventListener('click', () => {
      this.enable();
      this.openServiceAccess();
    });
    core.querySelector('[data-dev-action="restore"]')?.addEventListener('click', () => {
      this.restoreStandardMode();
      this.openServiceAccess();
    });
    core.querySelector('[data-dev-speed]')?.addEventListener('change', event => {
      this.gameSpeed = Math.max(0.5, Math.min(2, Number(event.target.value) || 1));
      if (this.gameSpeed !== 1) this.markCheatSession();
      this.syncIndicator();
    });
    core.querySelectorAll('[data-dev-modifier]').forEach(button => {
      button.addEventListener('click', () => {
        this.toggleModifier(this.getActiveGameId(), button.dataset.devModifier);
        this.openServiceAccess();
      });
    });
  },

  enable() {
    this.enabled = true;
    document.body.classList.add('arcade-overdrive');
    document.querySelector('.cabinet-chassis')?.classList.add('cabinet-overdrive');
    document.getElementById('nimo-widget')?.classList.add('nimo-override-active');
    const marquee = document.querySelector('.cab-marquee-text');
    if (marquee) marquee.dataset.standardText = marquee.textContent;
    if (marquee) marquee.textContent = 'ARCADEOS // OVERDRIVE';
    window.ArcadeAudioManager?.playSequence?.([
      [110, 'sawtooth', 0.12, 0.04, 0, 220], [440, 'triangle', 0.1, 0.04, 90, 880], [1040, 'sine', 0.14, 0.045, 180]
    ], { owner: 'developer' });
    window.ArcadeEventBus?.emit('DEVELOPER_MODE_DISCOVERED', {});
    window.ArcadeOS?.unlockAchievement?.('behind_cabinet');
    this.syncIndicator();
  },

  restoreStandardMode() {
    this.enabled = false;
    this.gameSpeed = 1;
    this.modifiers.clear();
    this.isCheatSession = false;
    document.body.classList.remove('arcade-overdrive');
    document.querySelector('.cabinet-chassis')?.classList.remove('cabinet-overdrive');
    document.getElementById('nimo-widget')?.classList.remove('nimo-override-active');
    document.getElementById('arcade-cheat-indicator')?.remove();
    const marquee = document.querySelector('.cab-marquee-text');
    if (marquee?.dataset.standardText) marquee.textContent = marquee.dataset.standardText;
    window.ArcadeAudioManager?.playSequence?.([[520, 'triangle', 0.08, 0.03, 0, 260]], { owner: 'developer' });
  },

  getActiveGameId() {
    return window.ArcadeOS?.activeApp?._rawAppId || window.ArcadeOS?.activeApp?.appId || this.activeGameId || 'pacmaze';
  },

  beginRun(gameId) {
    this.activeGameId = gameId;
    this.isCheatSession = this.gameSpeed !== 1 || (this.modifiers.get(gameId)?.size || 0) > 0;
    this.syncIndicator();
  },

  toggleModifier(gameId, modifier) {
    if (!this.enabled) return;
    if (!this.modifiers.has(gameId)) this.modifiers.set(gameId, new Set());
    const set = this.modifiers.get(gameId);
    set.has(modifier) ? set.delete(modifier) : set.add(modifier);
    this.markCheatSession();
    if (set.has(modifier)) this.applyImmediateModifier(gameId, modifier);
  },

  applyImmediateModifier(gameId, modifier) {
    const app = window.ArcadeOS?.activeApp?._rawApp;
    if (!app) return;
    const actions = {
      'pacmaze:extra_life': () => { app.lives = (app.lives || 0) + 1; app.updateHud?.(); },
      'pacmaze:power_mode': () => { app.frightenedTimer = Math.max(app.frightenedTimer || 0, 600); },
      'pixelplumber:spawn_buff': () => { app.plumberShield = true; },
      'flappybyte:slow_time': () => { app.flappySlowTime = true; },
      'spacewars:infinite_shield': () => { app.spaceShield = true; },
      'snake:spawn_food': () => app.spawnFood?.(),
      'breakout:wide_paddle': () => { if (app.paddle) app.paddle.width = 118; },
      'neonpong:ball_speed': () => { if (app.ball) { app.ball.vx *= 1.25; app.ball.vy *= 1.25; } },
      'voidinvaders:next_wave': () => { app.wave = (app.wave || 1) + 1; app.spawnInvaderWave?.(); },
      'vectordrift:asteroid_spawn': () => app.asteroids?.push({ x: 40, y: 40, vx: 1.8, vy: 1.2, radius: 20 }),
      'blockdrop:next_piece_debug': () => app.spawnPiece?.('I'),
      'blockdrop:clear_board': () => { if (app.grid) app.grid = app.grid.map(row => row.map(() => 0)); }
    };
    actions[`${gameId}:${modifier}`]?.();
  },

  hasModifier(gameId, modifier) {
    return !!this.modifiers.get(gameId)?.has(modifier);
  },

  markCheatSession() {
    this.isCheatSession = true;
    this.syncIndicator();
  },

  syncIndicator() {
    let indicator = document.getElementById('arcade-cheat-indicator');
    if (!this.enabled || !this.isCheatSession) {
      indicator?.remove();
      return;
    }
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'arcade-cheat-indicator';
      indicator.className = 'arcade-cheat-indicator';
      (document.getElementById('arcade-os') || document.body).appendChild(indicator);
    }
    indicator.textContent = 'DEV MODIFIED // SCORE INVALID';
  },

  getSpeedScale() {
    return this.enabled ? this.gameSpeed : 1;
  },

  shouldBlockScore() {
    return this.isCheatSession;
  }
};

export default ArcadeDeveloperMode;
