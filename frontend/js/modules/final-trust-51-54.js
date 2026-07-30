const RESUME_TERMS = {
  headline: 'Creative Frontend Developer',
  summary: 'Frontend development, responsive UI, browser products, interaction systems, accessibility, performance, testing, and production deployment.',
  skills: ['HTML5','CSS','JavaScript','Responsive UI','Accessibility','PWA','GitHub','Vercel','Playwright','Figma']
};

function alignResumeLanguage() {
  document.documentElement.dataset.resumeAligned = 'true';
  document.querySelectorAll('[data-resume-role]').forEach(node => { if (node.textContent !== RESUME_TERMS.headline) node.textContent = RESUME_TERMS.headline; });
  const skills = document.querySelector('#skills');
  if (skills) {
    skills.dataset.resumeSkills = RESUME_TERMS.skills.join(',');
    const intro = skills.querySelector('.section-header p:not(.hero-kicker)');
    if (intro && !intro.textContent.includes('production')) intro.textContent = RESUME_TERMS.summary;
  }
}

function addPrivacyLinks() {
  document.querySelectorAll('footer').forEach(footer => {
    if (footer.querySelector('a[href$="privacy.html"]')) return;
    const link = document.createElement('a');
    link.href = '/privacy.html';
    link.textContent = 'Privacy';
    link.setAttribute('aria-label', 'Read portfolio privacy information');
    const host = footer.querySelector('.footer-links, .footer-bottom, .cs-footer, .project-footer') || footer;
    host.appendChild(link);
  });
}

function improveForms() {
  document.querySelectorAll('form').forEach(form => {
    form.setAttribute('novalidate', '');
    form.querySelectorAll('input,textarea,select').forEach(field => {
      if (!field.id) field.id = `field-${Math.random().toString(36).slice(2,9)}`;
      const label = field.closest('label');
      if (label && !label.htmlFor) label.htmlFor = field.id;
      if (field.required) field.setAttribute('aria-required', 'true');
      if (!field.getAttribute('aria-label') && !label) field.setAttribute('aria-label', field.name || field.type || 'Form field');
    });
  });
  const contact = document.querySelector('[data-contact-form]');
  if (contact && !contact.querySelector('[name="website"]')) {
    const trap = document.createElement('input');
    trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden','true');
    contact.appendChild(trap);
  }
  const submit = contact?.querySelector('button[type="submit"]');
  if (submit && /prepare email/i.test(submit.textContent)) submit.textContent = 'Send Message';
}

function improveInteractiveSemantics() {
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener'); rel.add('noreferrer'); link.setAttribute('rel', [...rel].join(' '));
    if (!link.getAttribute('aria-label')) link.setAttribute('aria-label', `${link.textContent.trim() || 'Open link'} (opens in a new tab)`);
  });
  document.querySelectorAll('img:not([alt])').forEach(img => img.alt = '');
  document.querySelectorAll('button:not([type])').forEach(button => button.type = 'button');
  document.querySelectorAll('[role="button"][tabindex="0"]').forEach(control => {
    if (control.dataset.keyboardReady) return;
    control.dataset.keyboardReady = 'true';
    control.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); control.click(); }
    });
  });
}

function installLiveRegion() {
  if (document.querySelector('[data-global-a11y-live]')) return;
  const live = document.createElement('div');
  live.className = 'a11y-live-region'; live.dataset.globalA11yLive = ''; live.setAttribute('aria-live','polite'); live.setAttribute('aria-atomic','true');
  document.body.appendChild(live);
  window.PortfolioA11y = { announce(message) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = String(message || ''); }); } };
}

function respectReducedMotion() {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => document.documentElement.classList.toggle('reduce-motion', query.matches);
  apply(); query.addEventListener?.('change', apply);
}

export function initFinalTrust5154() {
  alignResumeLanguage();
  addPrivacyLinks();
  improveForms();
  improveInteractiveSemantics();
  installLiveRegion();
  respectReducedMotion();
}
