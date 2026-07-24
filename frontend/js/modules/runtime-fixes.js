import { ArcadePauseMenu } from './arcade-pause-menu.js';

export function initRuntimeFixes() {
  const applyFixes = () => {
    installArcadeHomeRedesign();
    removeRetiredSelfyyReferences();
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

function removeRetiredSelfyyReferences() {
  const removeMatches = (root = document) => {
    root.querySelectorAll?.('[data-project-id="selfyy"], [data-project="selfyy"], a[href*="selfyy" i]').forEach(node => {
      const removable = node.closest('article, .project-card, .experiment-card, .cmd-item, .github-project-card, li');
      (removable || node).remove();
    });

    root.querySelectorAll?.('article, .project-card, .experiment-card, .cmd-item, .github-project-card').forEach(node => {
      if (/\bselfyy\b/i.test(node.textContent || '')) node.remove();
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      if (!/selfyy/i.test(script.textContent || '')) return;
      try {
        const data = JSON.parse(script.textContent);
        const prune = value => {
          if (Array.isArray(value)) {
            return value
              .filter(item => !/selfyy/i.test(JSON.stringify(item)))
              .map(prune);
          }
          if (value && typeof value === 'object') {
            Object.keys(value).forEach(key => {
              value[key] = prune(value[key]);
            });
          }
          return value;
        };
        script.textContent = JSON.stringify(prune(data));
      } catch (_) {
        script.remove();
      }
    });
  };

  removeMatches();

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        removeMatches(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}

function ensureArcadeSystemOverlayRoot() {
  const appView = document.getElementById('arcade-app-view');
  if (!appView) return null;

  let root = document.getElementById('arcade-system-overlay-root');
  if (!root || root.parentElement !== appView) {
    root?.remove();
    root = document.createElement('div');
    root.id = 'arcade-system-overlay-root';
    root.setAttribute('aria-live', 'polite');
    appView.appendChild(root);
  }
  return root;
}

function installArcadeOverlayRoot() {
  if (!document.getElementById('arcade-runtime-overlay-safety')) {
    const style = document.createElement('style');
    style.id = 'arcade-runtime-overlay-safety';
    style.textContent = `
      #arcade-app-view { position: relative; }
      #arcade-system-overlay-root {
        position: absolute;
        inset: 0;
        z-index: 120;
        pointer-events: none;
        overflow: hidden;
      }
      #arcade-system-overlay-root > * { pointer-events: auto; }
      #arcade-system-overlay-root .arcade-outcome-overlay {
        position: absolute !important;
        inset: 0 !important;
        z-index: 121 !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  ensureArcadeSystemOverlayRoot();

  const observer = new MutationObserver(() => {
    if (!document.getElementById('arcade-app-view')) return;
    if (!document.getElementById('arcade-system-overlay-root')) {
      queueMicrotask(ensureArcadeSystemOverlayRoot);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}

function installArcadeEscapeController() {
  if (window.__arcadeEscapeControllerInstalled) return;
  window.__arcadeEscapeControllerInstalled = true;
  window.ArcadePauseMenu = ArcadePauseMenu;

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const arcade = window.ArcadeOS;
    if (!arcade || arcade.state !== 'APP') return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const outcome = document.getElementById('arcade-outcome-overlay');
    if (outcome) {
      outcome.querySelector('[data-arcade-focusable], button')?.focus({ preventScroll: true });
      return;
    }

    ensureArcadeSystemOverlayRoot();
    ArcadePauseMenu.toggle(arcade.activeApp);
  }, { capture: true });
}
