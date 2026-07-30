// Project-relative interactive environment auto-mounter
export function initProjectEnvironment() {
  const body = document.body;
  const theme = body.getAttribute('data-project-theme');
  if (!theme) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const hoverCapable = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobileViewport = innerWidth < 900;
  const lowPowerMode = reduceMotion || coarsePointer || mobileViewport;

  body.classList.toggle('project-env-low-power', lowPowerMode);

  if (!document.querySelector('link[data-project-experience]')) {
    const style = document.createElement('link');
    const nestedCaseStudy = location.pathname.includes('/assets/case-studies/');
    style.rel = 'stylesheet';
    style.href = nestedCaseStudy ? 'project-experience.css' : 'assets/case-studies/project-experience.css';
    style.dataset.projectExperience = 'true';
    document.head.appendChild(style);
  }

  if (!document.querySelector('.project-env-bg')) {
    const env = document.createElement('div');
    env.className = 'project-env-bg';
    env.setAttribute('aria-hidden', 'true');
    env.innerHTML = '<div class="env-pattern-motifs"></div>';
    body.prepend(env);
  }

  if (!lowPowerMode && hoverCapable) {
    let pointerRaf = 0;
    const updatePointer = (event) => {
      if (pointerRaf) return;
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        const x = Math.max(0, Math.min(100, event.clientX / innerWidth * 100));
        const y = Math.max(0, Math.min(100, event.clientY / innerHeight * 100));
        body.style.setProperty('--px', `${x}%`);
        body.style.setProperty('--py', `${y}%`);
        body.style.setProperty('--sx', ((x - 50) / 10).toFixed(2));
        body.style.setProperty('--sy', ((y - 50) / 10).toFixed(2));
      });
    };
    addEventListener('pointermove', updatePointer, { passive: true });

    const sections = [...document.querySelectorAll('.cs-editorial-section')];
    let scrollRaf = 0;
    const updateScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const center = innerHeight / 2;
        for (const section of sections) {
          const rect = section.getBoundingClientRect();
          const distance = (rect.top + rect.height / 2 - center) / innerHeight;
          section.style.setProperty('--section-shift', `${Math.max(-6, Math.min(6, distance * -5))}px`);
        }
      });
    };
    addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  if (hoverCapable && !lowPowerMode) {
    document.querySelectorAll('.cs-overview-block,.cs-feature-grid li,.cs-tech-tag,.cs-split-half,.cs-hero-visual').forEach((card) => {
      card.dataset.envCard = 'true';
      let cardRaf = 0;
      card.addEventListener('pointermove', (event) => {
        if (cardRaf) return;
        cardRaf = requestAnimationFrame(() => {
          cardRaf = 0;
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
          card.style.setProperty('--card-y', `${event.clientY - rect.top}px`);
        });
      }, { passive: true });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectEnvironment, { once: true });
} else {
  initProjectEnvironment();
}
