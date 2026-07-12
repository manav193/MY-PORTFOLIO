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
    if (this._qaLateMountGuard) {
      window.clearTimeout(this._qaLateMountGuard);
      this._qaLateMountGuard = null;
    }
    if (this._qaLaunchPending || this.state !== 'HOME') {
      return;
    }
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

  const restoreHomeView = () => {
    const loadingView = document.getElementById('arcade-loading');
    const appView = document.getElementById('arcade-app-view');
    const homeView = document.getElementById('arcade-home');

    if (os.activeApp) {
      try {
        os.activeApp.destroy?.();
      } catch (_) {}
      os.activeApp = null;
    }

    if (loadingView) loadingView.classList.remove('active');
    if (appView) {
      appView.classList.remove('active');
      appView.innerHTML = '';
    }
    if (homeView) homeView.classList.add('active');

    os.state = 'HOME';
    os.renderHome();
  };

  const suppressLateMount = () => {
    window.clearTimeout(os._qaLateMountGuard);
    os._qaLateMountGuard = window.setTimeout(() => {
      if (os.state === 'APP' || os.state === 'LOADING' || os.activeApp) {
        restoreHomeView();
      }
    }, 900);
  };

  const originalGoHome = os.goHome.bind(os);
  os.goHome = function goHomeStable() {
    resetPendingLaunch();

    if (this.state === 'LOADING') {
      restoreHomeView();
      suppressLateMount();
      return;
    }

    return originalGoHome();
  };

  const originalForceGoHome = os.forceGoHome.bind(os);
  os.forceGoHome = function forceGoHomeStable() {
    resetPendingLaunch();
    const result = originalForceGoHome();
    suppressLateMount();
    return result;
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
    window.clearTimeout(os._qaLateMountGuard);
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
