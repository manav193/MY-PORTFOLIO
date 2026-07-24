export function initRuntimeFixes() {
  const applyFixes = () => {
    installArcadeHomeRedesign();
    removeRetiredSelfyyReferences();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes);
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
    root.querySelectorAll?.('[data-project-id="selfyy"], [data-project="selfyy"], a[href*="selfyy"], a[href*="SELFYY"]').forEach(node => {
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
