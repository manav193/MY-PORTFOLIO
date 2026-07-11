const isMobileArcade = window.matchMedia('(max-width: 1024px)').matches;

if (isMobileArcade) {
  const removeMobileOnlyElements = () => {
    document.querySelectorAll('.arcade-touch-controls, [data-cursor-dot], [data-cursor-ring], [data-cursor]').forEach((node) => node.remove());
  };

  removeMobileOnlyElements();
  const observer = new MutationObserver(removeMobileOnlyElements);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const dockItems = Array.from(document.querySelectorAll('.dock-item'));
  const portfolioBtn = document.getElementById('dock-portfolio-btn');
  const arcadeBtn = document.getElementById('dock-arcade-btn');

  const setActiveDock = (target) => {
    dockItems.forEach((item) => item.classList.remove('dock-active'));
    if (target) target.classList.add('dock-active');
  };

  let arcadeExplicitlySelected = false;

  const goPortfolio = (event) => {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    arcadeExplicitlySelected = false;
    window.ArcadeOS?.forceGoHome?.();
    setActiveDock(portfolioBtn);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const goArcade = (event) => {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    arcadeExplicitlySelected = true;
    setActiveDock(arcadeBtn);
    window.scrollTo({ top: Math.max(1, window.innerHeight * 0.96), behavior: 'auto' });
  };

  portfolioBtn?.addEventListener('click', goPortfolio, true);
  arcadeBtn?.addEventListener('click', goArcade, true);

  document.querySelectorAll('.dock-item[href^="#"]').forEach((item) => {
    if (item === arcadeBtn || item === portfolioBtn) return;
    item.addEventListener('click', () => {
      arcadeExplicitlySelected = false;
      setActiveDock(item);
      window.ArcadeOS?.forceGoHome?.();
    }, true);
  });

  const syncDockOnScroll = () => {
    if (window.scrollY < 24) {
      arcadeExplicitlySelected = false;
      setActiveDock(portfolioBtn);
      return;
    }

    const sections = [
      ['#work', document.querySelector('.dock-item[href="#work"]')],
      ['#about', document.querySelector('.dock-item[href="#about"]')],
      ['#contact', document.querySelector('.dock-item[href="#contact"]')]
    ];

    const marker = window.innerHeight * 0.42;
    for (const [selector, dock] of sections) {
      const section = document.querySelector(selector);
      if (!section || !dock) continue;
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom >= marker) {
        arcadeExplicitlySelected = false;
        setActiveDock(dock);
        return;
      }
    }

    if (arcadeExplicitlySelected && window.scrollY < window.innerHeight * 1.4) {
      setActiveDock(arcadeBtn);
    } else if (!arcadeExplicitlySelected) {
      arcadeBtn?.classList.remove('dock-active');
    }
  };

  window.addEventListener('scroll', syncDockOnScroll, { passive: true });
  syncDockOnScroll();

  const patchMobileRuntime = (attempt = 0) => {
    const os = window.ArcadeOS;
    if (!os && attempt < 40) {
      window.setTimeout(() => patchMobileRuntime(attempt + 1), 100);
      return;
    }
    if (!os || os.__mobileRuntimePatched) return;

    os.__mobileRuntimePatched = true;
    const originalLaunchApp = os.launchApp.bind(os);

    os.launchApp = function launchAppFast(id) {
      const nativeSetTimeout = window.setTimeout;
      window.setTimeout = (callback, delay, ...args) => {
        const adjustedDelay = delay === 800 ? 100 : delay;
        return nativeSetTimeout(callback, adjustedDelay, ...args);
      };

      try {
        const result = originalLaunchApp(id);

        nativeSetTimeout(() => {
          const app = this.activeApp;
          if (!app || app.__mobileSpeedPatched) return;
          app.__mobileSpeedPatched = true;

          if (app.constructor?.name === 'BreakoutApp' && typeof app.update === 'function') {
            const originalUpdate = app.update.bind(app);
            app.update = function mobileBreakoutUpdate() {
              originalUpdate();
              if (this.active && this.state === 'PLAYING' && this.ball?.active) {
                originalUpdate();
              }
            };
          }
        }, 160);

        return result;
      } finally {
        window.setTimeout = nativeSetTimeout;
      }
    };
  };

  patchMobileRuntime();
}
