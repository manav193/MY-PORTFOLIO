const waitForArcade = (attempt = 0) => {
  const os = window.ArcadeOS;
  if (!os) {
    if (attempt < 40) window.setTimeout(() => waitForArcade(attempt + 1), 100);
    return;
  }

  if (os.__qaStabilized) return;
  os.__qaStabilized = true;

  const originalRenderHome = os.renderHome.bind(os);
  os.renderHome = function renderHomeStable() {
    const carousel = document.getElementById('home-carousel');
    if (carousel && carousel.parentNode) {
      const cleanCarousel = carousel.cloneNode(false);
      carousel.parentNode.replaceChild(cleanCarousel, carousel);
    }
    return originalRenderHome();
  };

  const originalLaunchApp = os.launchApp.bind(os);
  os.launchApp = function launchAppStable(id) {
    if (this._qaLaunchPending || this.state !== 'HOME') return;
    this._qaLaunchPending = true;
    originalLaunchApp(id);

    window.clearTimeout(this._qaLaunchGuard);
    this._qaLaunchGuard = window.setTimeout(() => {
      this._qaLaunchPending = false;
    }, 950);
  };

  const resetPendingLaunch = () => {
    os._qaLaunchPending = false;
    window.clearTimeout(os._qaLaunchGuard);
    os._qaLaunchGuard = null;
  };

  const originalGoHome = os.goHome.bind(os);
  os.goHome = function goHomeStable() {
    resetPendingLaunch();

    if (this.state === 'LOADING') {
      const loadingView = document.getElementById('arcade-loading');
      const appView = document.getElementById('arcade-app-view');
      const homeView = document.getElementById('arcade-home');
      if (loadingView) loadingView.classList.remove('active');
      if (appView) {
        appView.classList.remove('active');
        appView.innerHTML = '';
      }
      if (homeView) homeView.classList.add('active');
      this.state = 'HOME';
      this.activeApp = null;
      this.renderHome();
      return;
    }

    return originalGoHome();
  };

  const originalForceGoHome = os.forceGoHome.bind(os);
  os.forceGoHome = function forceGoHomeStable() {
    resetPendingLaunch();
    return originalForceGoHome();
  };

  const screen = document.getElementById('cabinet-screen');
  if (screen) {
    const clarityObserver = new MutationObserver(() => {
      const readyTip = screen.querySelector('.rt-ready-tip');
      if (readyTip && readyTip.textContent.trim() !== 'TAP SCREEN / PRESS ENTER / ACTION A') {
        readyTip.textContent = 'TAP SCREEN / PRESS ENTER / ACTION A';
      }

      const waitingTip = screen.querySelector('.rt-wait-tip');
      if (waitingTip && waitingTip.textContent.trim() !== 'WAIT FOR GREEN') {
        waitingTip.textContent = 'WAIT FOR GREEN';
      }
    });

    clarityObserver.observe(screen, { childList: true, subtree: true });
  }

  window.addEventListener('pagehide', () => {
    resetPendingLaunch();
    if (window.ArcadeOS && typeof window.ArcadeOS.forceGoHome === 'function') {
      window.ArcadeOS.forceGoHome();
    }
  }, { once: true });
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => waitForArcade(), { once: true });
} else {
  waitForArcade();
}
