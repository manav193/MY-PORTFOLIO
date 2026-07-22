// Project Environment Background Layer Auto-Mounter
export function initProjectEnvironment() {
  const theme = document.body.getAttribute('data-project-theme');
  if (!theme) return;

  if (!document.querySelector('.project-env-bg')) {
    const env = document.createElement('div');
    env.className = 'project-env-bg';
    env.setAttribute('aria-hidden', 'true');
    env.innerHTML = `
      <div class="env-ambient-gradient"></div>
      <div class="env-glow-primary"></div>
      <div class="env-glow-secondary"></div>
      <div class="env-pattern-grid"></div>
      <div class="env-pattern-motifs"></div>
      <div class="env-vignette"></div>
    `;
    document.body.prepend(env);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectEnvironment);
} else {
  initProjectEnvironment();
}
