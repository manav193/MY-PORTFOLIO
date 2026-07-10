const isMobileArcade = window.matchMedia('(max-width: 1024px)').matches;

if (isMobileArcade) {
  const removeInjectedControls = () => {
    document.querySelectorAll('.arcade-touch-controls').forEach((node) => node.remove());
  };

  removeInjectedControls();

  const observer = new MutationObserver(removeInjectedControls);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const dockItems = Array.from(document.querySelectorAll('.dock-item'));
  const portfolioBtn = document.getElementById('dock-portfolio-btn');
  const arcadeBtn = document.getElementById('dock-arcade-btn');

  const setActiveDock = (target) => {
    dockItems.forEach((item) => item.classList.remove('dock-active'));
    if (target) target.classList.add('dock-active');
  };

  const goPortfolio = (event) => {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    window.ArcadeOS?.forceGoHome?.();
    setActiveDock(portfolioBtn);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const goArcade = (event) => {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    setActiveDock(arcadeBtn);
    window.scrollTo({ top: Math.max(1, window.innerHeight * 0.96), behavior: 'auto' });
  };

  portfolioBtn?.addEventListener('click', goPortfolio, true);
  arcadeBtn?.addEventListener('click', goArcade, true);

  document.querySelectorAll('.dock-item[href^="#"]').forEach((item) => {
    if (item === arcadeBtn) return;
    item.addEventListener('click', (event) => {
      if (item === portfolioBtn) return;
      setActiveDock(item);
      window.ArcadeOS?.forceGoHome?.();
    }, true);
  });

  let arcadeExplicitlySelected = false;

  arcadeBtn?.addEventListener('click', () => {
    arcadeExplicitlySelected = true;
  }, true);

  portfolioBtn?.addEventListener('click', () => {
    arcadeExplicitlySelected = false;
  }, true);

  document.querySelectorAll('.dock-item[href^="#"]').forEach((item) => {
    if (item !== arcadeBtn && item !== portfolioBtn) {
      item.addEventListener('click', () => {
        arcadeExplicitlySelected = false;
      }, true);
    }
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
    }
  };

  window.addEventListener('scroll', syncDockOnScroll, { passive: true });
  syncDockOnScroll();

  const patchArcadeLaunch = (attempt = 0) => {
    const os = window.ArcadeOS;
    const registry = window.ArcadeRegistry;
    if ((!os || !registry) && attempt < 40) {
      window.setTimeout(() => patchArcadeLaunch(attempt + 1), 100);
      return;
    }
    if (!os || !registry || os.__mobileFastLaunch) return;

    os.__mobileFastLaunch = true;
    os.launchApp = function launchAppMobile(id) {
      if (this.state !== 'HOME') return;
      const appConfig = registry.getApp(id);
      if (!appConfig) return;

      this.state = 'LOADING';
      document.getElementById('arcade-home')?.classList.remove('active');
      document.getElementById('arcade-loading')?.classList.add('active');

      window.setTimeout(() => {
        if (this.state !== 'LOADING') return;
        document.getElementById('arcade-loading')?.classList.remove('active');
        document.getElementById('arcade-app-view')?.classList.add('active');

        this.state = 'APP';
        this.activeApp = new appConfig.component();
        const view = document.getElementById('arcade-app-view');
        if (!view) return;
        view.innerHTML = '';

        try {
          this.activeApp.init(view, window.ArcadeEventBus, window.ArcadeStorage, window.ArcadeAudio);
          this.activeApp.mount();
        } catch (error) {
          console.error('App Launch Failed', error);
          this.forceGoHome();
        }
      }, 140);
    };
  };

  patchArcadeLaunch();
}
