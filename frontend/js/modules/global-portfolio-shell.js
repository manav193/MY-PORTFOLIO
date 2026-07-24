/**
 * GLOBAL PORTFOLIO SHELL & ARCADE BOOT CONTROLLER
 * Idempotent global shell managing Palette, NIMO, Left Status Rail, Dock Sync, and Arcade Boot.
 */

let shellInitialized = false;

export const ArcadeBootController = {
  isBooting: false,
  isWarm: false,
  isSleeping: false,
  prewarmed: false,
  bootTimer: null,
  sequenceToken: 0,
  lastDuration: 0,

  prewarm() {
    if (this.prewarmed) return;
    this.prewarmed = true;
    if (window.ArcadeOS && !window.ArcadeOS.booted) {
      // Pre-register apps and prepare ArcadeRegistry without starting game RAF loops
      if (typeof window.registerAllArcadeApps === 'function') {
        window.registerAllArcadeApps();
      }
    }
  },

  async triggerBootSequence(onComplete) {
    if (this.isBooting) return false;
    this.isBooting = true;
    this.isSleeping = false;
    const token = ++this.sequenceToken;
    const startedAt = performance.now();

    const osView = document.getElementById('arcade-os');
    const loadingView = document.getElementById('arcade-loading');
    const homeView = document.getElementById('arcade-home');
    if (osView) {
      osView.style.opacity = '1';
      osView.classList.remove('arcade-sleeping');
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      if (token !== this.sequenceToken) return false;
      this.isWarm = true;
      this.isBooting = false;
      this.lastDuration = performance.now() - startedAt;
      loadingView?.classList.remove('active');
      loadingView?.classList.remove('is-waking');
      homeView?.classList.add('active');
      osView?.classList.remove('arcade-sleeping');
      if (onComplete) onComplete();
      return true;
    };

    // Warm re-entry is a compact wake pulse, never a replay of first boot.
    if (this.isWarm) {
      loadingView?.classList.add('active', 'is-waking');
      if (loadingView) {
        loadingView.innerHTML = `
          <div class="arcade-wake-pulse" role="status" aria-label="ArcadeOS waking">
            <span class="arcade-wake-line"></span>
            <span class="arcade-wake-label">SESSION RESTORED</span>
          </div>`;
      }
      window.ArcadeAudioManager?.resume();
      window.ArcadeAudioManager?.playSequence?.([
        [260, 'sine', 0.06, 0.025, 0, 520],
        [720, 'triangle', 0.08, 0.03, 70]
      ], { owner: 'boot' });
      const duration = reducedMotion ? 100 : 250;
      await new Promise(resolve => {
        this.bootTimer = setTimeout(resolve, duration);
      });
      return finish();
    }

    // First boot: original CRT pulse, identity mark, concise diagnostics, sync.
    if (loadingView) {
      loadingView.classList.add('active');
      loadingView.innerHTML = `
        <div class="crt-boot-sequence ${reducedMotion ? 'reduced-motion' : ''}" role="status" aria-label="ArcadeOS initializing">
          <div class="boot-crt-pulse" aria-hidden="true"></div>
          <div class="boot-mark" aria-hidden="true"><span>A</span><i></i></div>
          <div class="boot-wordmark">ARCADE<span>OS</span></div>
          <div class="boot-diagnostics">
            <span>CORE LINK <b>READY</b></span>
            <span>INPUT MATRIX <b>READY</b></span>
            <span>PIXEL BUS <b>READY</b></span>
          </div>
          <div class="boot-sync"><span>ENVIRONMENT SYNC</span><i><b></b></i></div>
        </div>
      `;
    }
    window.ArcadeAudioManager?.playSequence?.([
      [90, 'sine', 0.14, 0.025, 0, 180],
      [280, 'triangle', 0.08, 0.03, 260, 560],
      [760, 'sine', 0.08, 0.025, 720, 1120],
      [1040, 'triangle', 0.12, 0.03, 1180, 1320]
    ], { owner: 'boot' });

    const duration = reducedMotion ? 380 : 1300;
    await new Promise(resolve => {
      this.bootTimer = setTimeout(resolve, duration);
    });
    return finish();
  },

  async sleep() {
    this.cancel();
    this.isSleeping = true;
    const osView = document.getElementById('arcade-os');
    osView?.classList.add('arcade-sleeping');
    window.ArcadeAudioManager?.playSequence?.([
      [520, 'triangle', 0.06, 0.025, 0, 260],
      [220, 'sine', 0.1, 0.02, 45, 90]
    ], { owner: 'boot' });
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : 180;
    await new Promise(resolve => setTimeout(resolve, duration));
  },

  cancel() {
    if (this.bootTimer) {
      clearTimeout(this.bootTimer);
      this.bootTimer = null;
    }
    this.sequenceToken += 1;
    this.isBooting = false;
    window.ArcadeAudioManager?.stopOwner?.('boot');
    const loadingView = document.getElementById('arcade-loading');
    if (loadingView) loadingView.classList.remove('active', 'is-waking');
  }
};

export function isCaseStudyPage() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const path = (window.location.pathname || '').toLowerCase();

  if (path.includes('/case-studies/') || path.includes('project-') || path.includes('case-study')) {
    return true;
  }

  if (document.body?.hasAttribute('data-project-theme') || document.documentElement?.hasAttribute('data-project-theme')) {
    return true;
  }

  if (document.body?.classList.contains('case-study-page') || document.body?.classList.contains('cs-body') || document.body?.classList.contains('project-page')) {
    return true;
  }

  if (document.querySelector('.cs-container, .project-hero, .cs-hero, .cs-wrapper, .case-study-container')) {
    return true;
  }

  if (document.getElementById('home') || document.getElementById('intro-sequence')) {
    return false;
  }

  return false;
}

export const GlobalPortfolioShell = {
  init() {
    if (shellInitialized) return;
    shellInitialized = true;

    if (isCaseStudyPage()) {
      this.removeUnwantedCaseStudyShell();
      this.ensureGlobalNimo();
      return;
    }

    this.ensureGlobalDock();
    this.ensureGlobalPalette();
    this.ensureGlobalNimo();
    this.ensureGlobalStatusRail();
    this.ensureDockSync();
  },

  removeUnwantedCaseStudyShell() {
    document.querySelectorAll('.os-dock, [data-theme-dock], .section-progress-rail').forEach(el => el.remove());
  },

  ensureGlobalDock() {
    let dock = document.querySelector('.os-dock');
    if (!dock) {
      dock = document.createElement('nav');
      dock.className = 'os-dock glass';
      dock.setAttribute('aria-label', 'Quick Actions');
      dock.innerHTML = `
        <div class="dock-container">
          <a href="index.html#main-content" class="dock-item" id="dock-portfolio-btn" data-dock-action="portfolio-intro" data-title="Open Portfolio" aria-label="Open Portfolio">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </a>
          <a href="index.html#work" class="dock-item" data-dock-action="work" data-title="Architecture" aria-label="View Projects">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          </a>
          <a href="index.html#about" class="dock-item" data-dock-action="about" data-title="Log Origin" aria-label="About Me">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </a>
          <a href="index.html#contact" class="dock-item" data-dock-action="contact" data-title="Contact" aria-label="Contact">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>
          </a>
          <a href="index.html#intro-sequence" class="dock-item" id="dock-arcade-btn" data-dock-action="arcade" data-title="Open Arcade" aria-label="Open Arcade">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="17" cy="12" r="2"></circle></svg>
          </a>
        </div>
      `;
      document.body.appendChild(dock);
    }
  },

  ensureGlobalPalette() {
    let themeDock = document.querySelector('[data-theme-dock]');
    if (!themeDock) {
      themeDock = document.createElement('div');
      themeDock.className = 'theme-dock glass';
      themeDock.setAttribute('data-theme-dock', '');
      themeDock.innerHTML = `
        <button class="theme-btn" data-theme-id="light-apple" aria-label="Light Theme" title="Apple Light"></button>
        <button class="theme-btn" data-theme-id="dark-graphite" aria-label="Graphite Luxury" title="Graphite Luxury"></button>
        <button class="theme-btn" data-theme-id="midnight-sapphire" aria-label="Midnight Sapphire" title="Midnight Sapphire"></button>
        <button class="theme-btn" data-theme-id="aurora-violet" aria-label="Aurora Violet" title="Aurora Violet"></button>
        <button class="theme-btn" data-theme-id="forest-premium" aria-label="Forest Premium" title="Forest Premium"></button>
        <button class="theme-btn" data-theme-id="sunset-copper" aria-label="Sunset Copper" title="Sunset Copper"></button>
        <button class="theme-btn" data-theme-id="monochrome" aria-label="Monochrome" title="Monochrome"></button>
      `;
      document.body.appendChild(themeDock);
    }

    // Apply stored theme or default
    const savedTheme = localStorage.getItem('premium-theme') || 'dark-graphite';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const buttons = themeDock.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
      const themeId = btn.getAttribute('data-theme-id');
      btn.classList.toggle('active', themeId === savedTheme);

      if (!btn.dataset.bound) {
        btn.dataset.bound = 'true';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const selected = btn.getAttribute('data-theme-id');
          document.documentElement.setAttribute('data-theme', selected);
          localStorage.setItem('premium-theme', selected);
          buttons.forEach(b => b.classList.toggle('active', b.getAttribute('data-theme-id') === selected));
        });
      }
    });
  },

  ensureGlobalNimo() {
    // The NIMO module owns the single authoritative global widget. The legacy
    // fallback below is intentionally bypassed to prevent duplicate launchers,
    // IDs, forms, and event listeners before initNimo() runs.
    document.getElementById('global-nimo-root')?.remove();
    return;
    let nimoToggle = document.getElementById('nimo-toggle');
    let nimoContainer = document.getElementById('nimo-container');

    if (!nimoToggle || !nimoContainer) {
      const wrapper = document.createElement('div');
      wrapper.id = 'global-nimo-root';
      wrapper.innerHTML = `
        <button id="nimo-toggle" class="nimo-toggle" aria-label="Open NIMO AI Assistant" title="NIMO AI Assistant">
          <span class="nimo-avatar-badge">👾</span>
          <span class="nimo-pulse-ring"></span>
        </button>
        <div id="nimo-container" class="nimo-container glass" hidden>
          <div class="nimo-header">
            <div class="nimo-title"><span class="nimo-icon">👾</span> <strong>NIMO AI</strong></div>
            <button id="nimo-close" class="nimo-close-btn" aria-label="Close NIMO">✕</button>
          </div>
          <div id="nimo-messages" class="nimo-messages"></div>
          <form id="nimo-form" class="nimo-form">
            <input type="text" id="nimo-input" class="nimo-input" placeholder="Ask NIMO about projects, skills..." autocomplete="off">
            <button type="submit" class="nimo-send-btn">Send</button>
          </form>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    if (window.initNimo && typeof window.initNimo === 'function') {
      try { window.initNimo(); } catch(e) {}
    }
  },

  ensureGlobalStatusRail() {
    if (window.initSectionProgressRail && typeof window.initSectionProgressRail === 'function') {
      try { window.initSectionProgressRail(); } catch(e) {}
    }
  },

  ensureDockSync() {
    if (window.initDockController && typeof window.initDockController === 'function') {
      try { window.initDockController(); } catch(e) {}
    }
  }
};

if (typeof window !== 'undefined') {
  window.GlobalPortfolioShell = GlobalPortfolioShell;
  window.ArcadeBootController = ArcadeBootController;
}
