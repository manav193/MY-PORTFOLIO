export function initRuntimeFixes() {
  const applyFixes = () => {
    installArcadeHomeRedesign();
    installArcadeOverlayRoot();
    installArcadeEscapeController();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes, { once: true });
  } else {
    applyFixes();
  }
}

function installArcadeHomeRedesign() {
  const home = document.getElementById('arcade-home');
  if (home) {
    home.classList.add('arcade-cinematic-v5');
    const oldBrand = home.querySelector('.arcade-cinematic-brand-v2');
    if (oldBrand) oldBrand.remove();
  }
}

function ensureArcadeSystemOverlayRoot() {
  const appView = document.getElementById('arcade-app-view');
  if (!appView) return null;

  // Keep the shared system overlay OUTSIDE #arcade-app-view.
  // Every game remount replaces appView.innerHTML, which used to delete the
  // outcome root and made GAME OVER / VICTORY fall back to inconsistent local overlays.
  const safeViewport = appView.closest('.arcade-viewport-safe') || appView.parentElement;
  if (!safeViewport) return null;

  let root = document.getElementById('arcade-system-overlay-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'arcade-system-overlay-root';
    root.setAttribute('aria-live', 'polite');
  }

  if (root.parentElement !== safeViewport) {
    safeViewport.appendChild(root);
  }

  return root;
}

function installArcadeOverlayRoot() {
  if (!document.getElementById('arcade-runtime-overlay-safety')) {
    const style = document.createElement('style');
    style.id = 'arcade-runtime-overlay-safety';
    style.textContent = `
      .arcade-viewport-safe { position: relative; }
      #arcade-system-overlay-root {
        position: absolute;
        inset: 0;
        z-index: 1000;
        pointer-events: none;
        overflow: hidden;
      }
      #arcade-system-overlay-root:empty { display: none; }
      #arcade-system-overlay-root:not(:empty) { display: block; }
      #arcade-system-overlay-root > * { pointer-events: auto; }
      #arcade-system-overlay-root .arcade-outcome-overlay {
        position: absolute !important;
        inset: 0 !important;
        z-index: 1001 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
      }
      #arcade-system-overlay-root .arcade-outcome-modal {
        max-width: min(92%, 680px) !important;
        max-height: 90% !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  ensureArcadeSystemOverlayRoot();

  const safeViewport = document.querySelector('.arcade-viewport-safe');
  if (!safeViewport || safeViewport.dataset.overlayRootWatch === 'true') return;
  safeViewport.dataset.overlayRootWatch = 'true';

  const observer = new MutationObserver(() => {
    if (!document.getElementById('arcade-system-overlay-root')) {
      queueMicrotask(ensureArcadeSystemOverlayRoot);
    }
  });
  observer.observe(safeViewport, { childList: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}

function installArcadeEscapeController() {
  if (window.__arcadeEscapeControllerInstalled) return;
  window.__arcadeEscapeControllerInstalled = true;

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;

    const arcade = window.ArcadeOS;
    if (!arcade || arcade.state !== 'APP') return;

    // Required ArcadeOS behavior: ESC from any running game returns to Arcade Home.
    // Capture before per-game key handlers so a game cannot convert ESC into a local pause screen.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    window.ArcadeOutcomeScreen?.hide?.();
    document.getElementById('arcade-pause-overlay')?.remove();
    arcade.goHome();
  }, { capture: true });
}
