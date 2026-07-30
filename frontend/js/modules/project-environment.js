// Project-relative interactive environment auto-mounter
export function initProjectEnvironment() {
  const body = document.body;
  const theme = body.getAttribute('data-project-theme');
  if (!theme) return;

  if (!document.querySelector('link[data-project-experience]')) {
    const style = document.createElement('link');
    const nestedCaseStudy = location.pathname.includes('/assets/case-studies/');
    style.rel = 'stylesheet';
    style.href = nestedCaseStudy ? '../../css/project-experience.css' : 'css/project-experience.css';
    style.dataset.projectExperience = 'true';
    document.head.appendChild(style);
  }

  if (!document.querySelector('.project-env-bg')) {
    const env = document.createElement('div');
    env.className = 'project-env-bg';
    env.setAttribute('aria-hidden', 'true');
    env.innerHTML = `<div class="env-ambient-gradient"></div><div class="env-glow-primary"></div><div class="env-glow-secondary"></div><div class="env-pattern-grid"></div><div class="env-pattern-motifs"></div><div class="env-vignette"></div>`;
    body.prepend(env);
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    let raf = 0;
    const updatePointer = (event) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
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
    const updateScroll = () => {
      const center = innerHeight / 2;
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const distance = (rect.top + rect.height / 2 - center) / innerHeight;
        section.style.setProperty('--section-shift', `${Math.max(-8, Math.min(8, distance * -7))}px`);
      }
    };
    addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  document.querySelectorAll('.cs-overview-block,.cs-feature-grid li,.cs-tech-tag,.cs-split-half,.cs-hero-visual').forEach((card) => {
    card.dataset.envCard = 'true';
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--card-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initProjectEnvironment); else initProjectEnvironment();
