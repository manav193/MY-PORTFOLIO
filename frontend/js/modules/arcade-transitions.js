/**
 * ArcadeOS — Central Transition & Micro-Interaction Coordinator
 * Authoritative manager for app launches, route navigation, return-home,
 * CRT scan sweeps, toast notifications, and physical hardware feedback.
 */

export const ArcadeTransitions = {
  isTransitioning: false,
  activeToastTimer: null,

  init() {
    this.createToastContainer();
  },

  isReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  createToastContainer() {
    const crtScreen = document.getElementById('arcade-os') || document.querySelector('.screen-content-layer');
    if (!crtScreen) return;
    let container = document.getElementById('arcade-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'arcade-toast-container';
      container.className = 'arcade-toast-container';
      crtScreen.appendChild(container);
    }
  },

  /**
   * App Launch Sequence (350–500ms)
   */
  async launchApp(appId, appConfig, executeLaunch) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const homeView = document.getElementById('arcade-home');
    const universeBg = homeView?.querySelector('.arcade-universe-bg');
    const activeCard = homeView?.querySelector('.app-card.focused, .app-card.is-ui-focused');

    // 1. Focus pulse & audio feedback
    if (window.ArcadeAudio?.playSelect) window.ArcadeAudio.playSelect();
    if (window.ArcadeHardware?.flashActionButtons) window.ArcadeHardware.flashActionButtons();

    if (activeCard) {
      activeCard.classList.add('is-launching-pulse');
    }
    if (homeView) {
      homeView.classList.add('is-app-launching');
    }
    if (universeBg) {
      universeBg.classList.add('is-dimmed');
    }

    this.triggerScanSweep();

    const duration = this.isReducedMotion() ? 100 : 380;
    await new Promise(resolve => setTimeout(resolve, duration));

    // Execute actual launch callback
    try {
      await executeLaunch();
    } finally {
      if (activeCard) activeCard.classList.remove('is-launching-pulse');
      if (homeView) homeView.classList.remove('is-app-launching');
      if (universeBg) universeBg.classList.remove('is-dimmed');
      this.isTransitioning = false;
    }
  },

  /**
   * System Route Open Sequence (250–400ms)
   */
  async openRoute(routeState, routeCfg, executeOpen) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const homeView = document.getElementById('arcade-home');
    if (window.ArcadeAudio?.playSelect) window.ArcadeAudio.playSelect();

    if (homeView) {
      homeView.classList.add('is-route-opening');
    }

    this.triggerScanSweep();

    const duration = this.isReducedMotion() ? 80 : 260;
    await new Promise(resolve => setTimeout(resolve, duration));

    try {
      await executeOpen();
    } finally {
      if (homeView) homeView.classList.remove('is-route-opening');
      this.isTransitioning = false;
    }
  },

  /**
   * Return to HOME Sequence
   */
  async returnHome(executeReturn) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const appView = document.getElementById('arcade-app-view');
    if (window.ArcadeAudio?.playBack) window.ArcadeAudio.playBack();
    if (window.ArcadeHardware?.flashBackButton) window.ArcadeHardware.flashBackButton();

    if (appView) {
      appView.classList.add('is-returning-home');
    }

    const duration = this.isReducedMotion() ? 80 : 220;
    await new Promise(resolve => setTimeout(resolve, duration));

    try {
      await executeReturn();
    } finally {
      if (appView) appView.classList.remove('is-returning-home');
      this.isTransitioning = false;
    }
  },

  /**
   * Standby Sleep Mode Transition
   */
  async enterSleep(executeSleep) {
    const crtScreen = document.getElementById('arcade-os') || document.querySelector('.screen-content-layer');
    if (crtScreen) {
      crtScreen.classList.add('is-shutting-down');
    }
    const duration = this.isReducedMotion() ? 100 : 350;
    await new Promise(resolve => setTimeout(resolve, duration));
    if (crtScreen) crtScreen.classList.remove('is-shutting-down');
    executeSleep();
  },

  /**
   * Standby Wake Transition
   */
  async wakeFromSleep(executeWake) {
    const crtScreen = document.getElementById('arcade-os') || document.querySelector('.screen-content-layer');
    if (crtScreen) {
      crtScreen.classList.add('is-waking-up');
    }
    executeWake();
    const duration = this.isReducedMotion() ? 100 : 400;
    await new Promise(resolve => setTimeout(resolve, duration));
    if (crtScreen) crtScreen.classList.remove('is-waking-up');
  },

  /**
   * Short CRT Scan Sweep Effect
   */
  triggerScanSweep() {
    if (this.isReducedMotion()) return;
    const crtScreen = document.getElementById('arcade-os') || document.querySelector('.screen-content-layer');
    if (!crtScreen) return;

    let sweep = document.getElementById('arcade-scan-sweep');
    if (!sweep) {
      sweep = document.createElement('div');
      sweep.id = 'arcade-scan-sweep';
      sweep.className = 'arcade-scan-sweep';
      crtScreen.appendChild(sweep);
    }

    sweep.classList.remove('active');
    // Force reflow
    void sweep.offsetWidth;
    sweep.classList.add('active');
  },

  /**
   * System Notification Toast
   */
  showToast(title, subtitle = '', icon = '⚡', type = 'info', duration = 3000) {
    this.createToastContainer();
    const container = document.getElementById('arcade-toast-container');
    if (!container) return;

    // Deduplicate existing identical toasts
    const existing = container.querySelector(`[data-toast-title="${title}"]`);
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `arcade-toast-item toast-${type}`;
    toast.setAttribute('data-toast-title', title);
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-content">
        <strong class="toast-title">${title}</strong>
        ${subtitle ? `<span class="toast-subtitle">${subtitle}</span>` : ''}
      </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('active');
    });

    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

if (typeof window !== 'undefined') {
  window.ArcadeTransitions = ArcadeTransitions;
}

export default ArcadeTransitions;
