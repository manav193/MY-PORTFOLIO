export function initReveal() {
  const selector = [
    '[data-reveal]',
    '.reveal-up',
    '.project-card',
    '.experiment-card',
    '.ui-stack-item'
  ].join(',');
  const items = [...document.querySelectorAll(selector)];
  if (!items.length) return;

  const revealImmediately = (item) => {
    item.classList.add('is-visible');
    item.dataset.revealState = 'visible';
  };

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(revealImmediately);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealImmediately(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.04, rootMargin: '0px 0px 8% 0px' });

  items.forEach((item, index) => {
    item.dataset.revealIndex = String(index);
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.05 && rect.bottom > 0) revealImmediately(item);
    else observer.observe(item);
  });

  // Dynamic catalog cards may be inserted after module initialization.
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      const candidates = [node, ...node.querySelectorAll(selector)].filter((el) => el.matches?.(selector));
      candidates.forEach((item) => {
        if (item.dataset.revealState === 'visible') return;
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.05 && rect.bottom > 0) revealImmediately(item);
        else observer.observe(item);
      });
    }));
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Never leave content permanently invisible because of layout shifts or restored scroll positions.
  window.setTimeout(() => {
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.35 && rect.bottom > -120) revealImmediately(item);
    });
  }, 900);
}

export function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.42 });

  counters.forEach((counter) => observer.observe(counter));
}

export function initScrollProgress() {
  const bar = document.querySelector('[data-scroll-progress]');
  if (!bar) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = `${progress}%`;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

export function initBackToTop() {
  document.querySelector('[data-back-top]')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function animateCount(node) {
  const target = Number(node.dataset.count || 0);
  const duration = 1200;
  const start = performance.now();

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = Math.round(target * eased).toString();
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
