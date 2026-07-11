const isMobileArcade = window.matchMedia('(max-width: 1024px)').matches;

if (isMobileArcade) {
  const removeMobileOnlyElements = () => {
    document.querySelectorAll('.arcade-touch-controls, [data-cursor-dot], [data-cursor-ring], [data-cursor]').forEach((node) => node.remove());
  };

  removeMobileOnlyElements();
  const observer = new MutationObserver(removeMobileOnlyElements);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Mobile dock state is handled by the shared dock controller.
  // This file only removes heavy desktop-only effects and patches mobile arcade runtime speed.

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
