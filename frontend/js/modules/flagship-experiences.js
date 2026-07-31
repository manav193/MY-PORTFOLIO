const ROUTES = {
  nimo: 'project-nimo.html',
  'arcade-os': 'project-arcade-os.html',
  toolverse: 'project-toolverse.html',
  'shift-zero': 'project-shift-zero.html',
  love: 'project-love-journey.html',
  nintendo: 'project-nintendo.html',
  nike: 'project-nike.html',
  'velora-bites': 'project-velora-bites.html',
  promptai: 'project-promptai.html'
};

const LIVE_TARGETS = {
  'arcade-os': () => `${location.origin}/`,
  nimo: () => 'https://nimo-core.manav-nimo.workers.dev/api/health',
  toolverse: () => 'https://tool-verse-theta.vercel.app/',
  'velora-bites': () => 'https://veldora-bites.vercel.app/'
};

const MODES = {
  general: {
    label: 'General Visitor',
    order: ['arcade-os', 'nimo', 'toolverse', 'shift-zero', 'love', 'velora-bites', 'nintendo', 'nike']
  },
  frontend: {
    label: 'Frontend Recruiter',
    order: ['toolverse', 'arcade-os', 'nimo', 'love', 'shift-zero', 'velora-bites', 'nike', 'nintendo']
  },
  ai: {
    label: 'AI / Product Reviewer',
    order: ['nimo', 'arcade-os', 'toolverse', 'promptai', 'shift-zero', 'love', 'velora-bites', 'nintendo', 'nike']
  },
  design: {
    label: 'UI / UX Reviewer',
    order: ['velora-bites', 'nike', 'nintendo', 'arcade-os', 'love', 'nimo', 'toolverse', 'shift-zero']
  }
};

function scrollToTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) return false;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function cards() {
  return Array.from(document.querySelectorAll('#work [data-project-id]'));
}

function getLiveTarget(id) {
  return LIVE_TARGETS[id]?.() || '';
}

function openProject(id) {
  const card = document.querySelector(`[data-project-id="${id}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('is-controller-focus');
    setTimeout(() => card.classList.remove('is-controller-focus'), 1800);
    return true;
  }
  if (ROUTES[id]) {
    location.href = ROUTES[id];
    return true;
  }
  return false;
}

function showByStatus(status) {
  cards().forEach(card => {
    card.hidden = !(status === 'all' || card.dataset.projectStatus === status);
  });
  scrollToTarget('#work');
}

function projectInfo(card) {
  const id = card.dataset.projectId;
  const externalLinks = Array.from(card.querySelectorAll('a[href^="http"]'));
  const github = externalLinks.find(link => link.href.includes('github.com'))?.href || '';
  const productLink = externalLinks.find(link => !link.href.includes('github.com'))?.href || '';
  return {
    id,
    name: card.querySelector('h3')?.textContent?.trim() || id,
    type: card.querySelector('.project-type')?.textContent?.trim() || 'Project',
    status: card.dataset.projectStatus || 'documented',
    summary: card.querySelector('.project-value')?.textContent?.trim() || '',
    image: card.querySelector('.project-media img')?.getAttribute('src') || '',
    caseStudy: card.querySelector('a[href*="project-"]')?.getAttribute('href') || ROUTES[id] || '',
    live: getLiveTarget(id) || productLink,
    github
  };
}

function ensurePreview() {
  if (document.querySelector('[data-project-preview]')) return;
  const root = document.createElement('div');
  root.className = 'project-preview-shell';
  root.dataset.projectPreview = '';
  root.hidden = true;
  root.innerHTML = `
    <div class="project-preview-backdrop" data-preview-close></div>
    <section class="project-preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <button class="preview-close" data-preview-close aria-label="Close preview">×</button>
      <div class="preview-media"><img data-preview-image alt=""></div>
      <div class="preview-copy">
        <span data-preview-meta></span>
        <h2 id="preview-title" data-preview-title></h2>
        <p data-preview-summary></p>
        <div class="preview-actions">
          <a data-preview-case class="btn-primary">Full Case Study</a>
          <a data-preview-live class="btn-secondary" target="_blank" rel="noopener noreferrer">Live Product</a>
          <a data-preview-github class="btn-secondary" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </section>`;
  document.body.append(root);
  root.addEventListener('click', event => {
    if (event.target.closest('[data-preview-close]')) closePreview();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !root.hidden) closePreview();
  });
}

function closePreview() {
  const root = document.querySelector('[data-project-preview]');
  if (!root) return;
  root.hidden = true;
  document.body.classList.remove('preview-open');
}

function previewProject(id) {
  ensurePreview();
  const card = document.querySelector(`[data-project-id="${id}"]`);
  if (!card) return openProject(id);
  const data = projectInfo(card);
  const root = document.querySelector('[data-project-preview]');
  root.querySelector('[data-preview-title]').textContent = data.name;
  root.querySelector('[data-preview-meta]').textContent = `${data.type} · ${data.status.replace('-', ' ')}`;
  root.querySelector('[data-preview-summary]').textContent = data.summary;
  const image = root.querySelector('[data-preview-image]');
  image.src = data.image;
  image.alt = `${data.name} preview`;
  const assign = (selector, url) => {
    const element = root.querySelector(selector);
    element.hidden = !url;
    if (url) element.href = url;
  };
  assign('[data-preview-case]', data.caseStudy);
  assign('[data-preview-live]', data.live);
  assign('[data-preview-github]', data.github);
  root.hidden = false;
  document.body.classList.add('preview-open');
}

function attachPreviewButtons() {
  cards().forEach(card => {
    if (card.querySelector('[data-quick-preview]')) return;
    const actions = card.querySelector('.project-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-secondary';
    button.dataset.quickPreview = '';
    button.textContent = 'Quick Preview';
    button.addEventListener('click', () => previewProject(card.dataset.projectId));
    actions.prepend(button);
  });
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      mode: url.includes('nimo-core.manav-nimo.workers.dev') ? 'no-cors' : 'cors',
      signal: controller.signal,
      headers: { Accept: 'text/html,application/json' }
    });
    return response.ok || response.type === 'opaque';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function ensureLiveBadges() {
  cards().forEach(card => {
    const id = card.dataset.projectId;
    const url = getLiveTarget(id);
    if (!url) return;
    let badge = card.querySelector('[data-live-health]');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'runtime-health is-checking';
      badge.dataset.liveHealth = '';
      badge.innerHTML = '<i></i><span>Checking live</span>';
      card.querySelector('.project-heading-row')?.append(badge);
    }
    probe(url).then(ok => {
      badge.classList.remove('is-checking');
      badge.classList.toggle('is-online', ok);
      badge.classList.toggle('is-offline', !ok);
      badge.querySelector('span').textContent = ok ? 'Live now' : 'Unavailable';
      badge.title = ok ? 'Endpoint responded successfully' : 'Live endpoint did not respond from this browser';
    });
  });
}

function restoreFlagshipPair() {
  const flagshipGrid = document.querySelector('.flagship-pair__grid');
  const flagship = document.querySelector('.flagship-pair');
  const arcade = document.querySelector('[data-project-id="arcade-os"]');
  const nimo = document.querySelector('[data-project-id="nimo"]');
  if (!flagshipGrid || !arcade || !nimo) return;
  flagship.hidden = false;
  flagshipGrid.append(arcade, nimo);
}

function applyMode(key, shouldScroll = true) {
  const config = MODES[key] || MODES.general;
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase) return;
  const map = new Map(cards().map(card => [card.dataset.projectId, card]));
  const flagship = document.querySelector('.flagship-pair');

  if (key === 'general') {
    restoreFlagshipPair();
    config.order.filter(id => !['arcade-os', 'nimo'].includes(id)).forEach(id => {
      if (map.has(id)) showcase.append(map.get(id));
    });
  } else {
    if (flagship) flagship.hidden = true;
    config.order.forEach(id => {
      if (map.has(id)) showcase.append(map.get(id));
    });
  }

  cards().forEach(card => {
    card.hidden = false;
    const index = config.order.indexOf(card.dataset.projectId);
    card.dataset.modePriority = String(index < 0 ? 0 : config.order.length - index);
  });
  document.querySelectorAll('[data-role-mode]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.roleMode === key);
  });
  localStorage.setItem('portfolio-review-mode', key);
  const label = document.querySelector('[data-current-mode]');
  if (label) label.textContent = config.label;
  if (shouldScroll) scrollToTarget('#work');
}

function ensureRoleModes() {
  const work = document.querySelector('#work .container-centered');
  if (!work || document.querySelector('[data-role-modes]')) return;
  const panel = document.createElement('section');
  panel.className = 'role-mode-panel';
  panel.dataset.roleModes = '';
  panel.innerHTML = '<div><span>PORTFOLIO VIEW</span><strong data-current-mode>General Visitor</strong><p>Reorder the project gallery around the reviewer’s priorities.</p></div><div class="role-mode-actions"><button data-role-mode="general">General</button><button data-role-mode="frontend">Frontend</button><button data-role-mode="ai">AI / Product</button><button data-role-mode="design">UI / UX</button></div>';
  work.querySelector('.section-header')?.after(panel);
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-role-mode]');
    if (button) applyMode(button.dataset.roleMode);
  });
  applyMode(localStorage.getItem('portfolio-review-mode') || 'general', false);
}

function ensureRecruiterPath() {
  if (document.querySelector('[data-recruiter-path]')) return;
  const work = document.querySelector('#work');
  if (!work) return;
  const section = document.createElement('section');
  section.className = 'recruiter-path';
  section.dataset.recruiterPath = '';
  section.innerHTML = '<div class="recruiter-path-copy"><span>60-SECOND REVIEW</span><h2>Evaluate the strongest work without searching the whole site.</h2><p>One guided path through product engineering, AI systems, interface work, verified live deployments, resume, and contact.</p><button class="btn-primary" data-start-review>Start recruiter briefing</button></div><ol class="recruiter-steps"><li><strong>01 · Product system</strong><button data-review-project="arcade-os">Preview ArcadeOS</button></li><li><strong>02 · AI system</strong><button data-review-project="nimo">Preview NIMO</button></li><li><strong>03 · Shipped utility product</strong><button data-review-project="toolverse">Preview ToolVerse</button></li><li><strong>04 · Credentials</strong><a href="Manav-Agarwal-Resume.pdf" target="_blank" rel="noopener noreferrer">Open resume</a></li><li><strong>05 · Contact</strong><button data-review-contact>Contact Manav</button></li></ol>';
  work.before(section);
  section.addEventListener('click', event => {
    const project = event.target.closest('[data-review-project]');
    if (project) previewProject(project.dataset.reviewProject);
    if (event.target.closest('[data-review-contact]')) scrollToTarget('#contact');
    if (event.target.closest('[data-start-review]')) {
      applyMode('frontend');
      previewProject('arcade-os');
    }
  });
}

function ensureFilters() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase || document.querySelector('[data-portfolio-filters]')) return;
  const bar = document.createElement('div');
  bar.dataset.portfolioFilters = '';
  bar.className = 'portfolio-filter-bar';
  bar.innerHTML = '<button data-filter="all" class="is-active">All</button><button data-filter="live">Live Products</button><button data-filter="ai">AI Systems</button><button data-filter="frontend">Frontend</button><button data-filter="game">Games</button><button data-filter="ui">UI/UX</button>';
  showcase.before(bar);
  bar.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    bar.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
    const filter = button.dataset.filter;
    cards().forEach(card => {
      const id = card.dataset.projectId || '';
      const text = card.textContent.toLowerCase();
      let match = filter === 'all';
      if (filter === 'live') match = card.dataset.projectStatus === 'live';
      if (filter === 'ai') match = ['nimo', 'fate-ai', 'promptai', 'multi-api-system'].includes(id) || text.includes('ai');
      if (filter === 'frontend') match = text.includes('frontend') || ['toolverse', 'arcade-os', 'love'].includes(id);
      if (filter === 'game') match = id.includes('shift') || id === 'arcade-os' || text.includes('game');
      if (filter === 'ui') match = ['velora-bites', 'nintendo', 'nike'].includes(id) || text.includes('ui/ux');
      card.hidden = !match;
    });
  });
}

function addStyles() {
  if (document.querySelector('#flagship-controller-style')) return;
  const style = document.createElement('style');
  style.id = 'flagship-controller-style';
  style.textContent = `.portfolio-filter-bar{display:flex;gap:.6rem;flex-wrap:wrap;margin:0 0 1.5rem}.portfolio-filter-bar button,.role-mode-actions button{border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.04);color:inherit;padding:.72rem 1rem;cursor:pointer}.portfolio-filter-bar button.is-active,.role-mode-actions button.is-active{background:var(--accent,#fff);color:#080808}.is-controller-focus{outline:2px solid var(--accent,#fff);outline-offset:8px}.runtime-health{display:inline-flex;align-items:center;gap:.42rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em}.runtime-health i{width:.48rem;height:.48rem;border-radius:50%;background:#888}.runtime-health.is-checking i{animation:healthPulse 1s infinite}.runtime-health.is-online i{background:#43e39b;box-shadow:0 0 12px #43e39b}.runtime-health.is-offline i{background:#ff6b6b}.role-mode-panel,.recruiter-path{max-width:1180px;margin:1.5rem auto 3rem;padding:1.4rem;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(10,10,14,.7);display:flex;justify-content:space-between;gap:1.4rem;align-items:center}.role-mode-panel span,.recruiter-path span{font-size:.7rem;letter-spacing:.16em}.role-mode-actions{display:flex;gap:.5rem;flex-wrap:wrap}.recruiter-path{padding:clamp(1.4rem,4vw,3rem);align-items:flex-start}.recruiter-path-copy{max-width:520px}.recruiter-steps{display:grid;gap:.75rem;min-width:min(100%,380px);list-style:none;padding:0}.recruiter-steps li{display:flex;justify-content:space-between;gap:1rem;padding:.85rem;border-bottom:1px solid rgba(255,255,255,.1)}.recruiter-steps button,.recruiter-steps a{border:0;background:none;color:var(--accent,#fff);cursor:pointer}.project-preview-shell{position:fixed;inset:0;z-index:10020}.project-preview-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.76)}.project-preview-modal{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:min(920px,calc(100% - 28px));max-height:88vh;overflow:auto;border:1px solid rgba(255,255,255,.16);border-radius:24px;background:#0d0f14;display:grid;grid-template-columns:1.05fr .95fr;box-shadow:0 32px 100px rgba(0,0,0,.55)}.preview-media img{width:100%;height:100%;min-height:360px;object-fit:cover}.preview-copy{padding:clamp(1.4rem,4vw,2.8rem);align-self:center}.preview-copy>span{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em}.preview-actions{display:flex;gap:.65rem;flex-wrap:wrap;margin-top:1.4rem}.preview-close{position:absolute;right:14px;top:12px;z-index:2;border:0;border-radius:50%;width:38px;height:38px;background:rgba(0,0,0,.6);color:#fff;font-size:1.6rem;cursor:pointer}.preview-open{overflow:hidden}@keyframes healthPulse{50%{opacity:.35}}@media(max-width:760px){.portfolio-filter-bar{overflow:auto;flex-wrap:nowrap;padding-bottom:.4rem}.portfolio-filter-bar button{white-space:nowrap}.role-mode-panel,.recruiter-path{margin-left:14px;margin-right:14px;display:grid}.role-mode-actions{overflow:auto;flex-wrap:nowrap}.role-mode-actions button{white-space:nowrap}.project-preview-modal{grid-template-columns:1fr}.preview-media img{min-height:210px;max-height:260px}.recruiter-steps li{align-items:center}.runtime-health{display:none}}`;
  document.head.append(style);
}

export function initFlagshipExperiences() {
  addStyles();
  ensureFilters();
  ensurePreview();
  attachPreviewButtons();
  ensureLiveBadges();
  ensureRoleModes();
  ensureRecruiterPath();
  window.PortfolioController = {
    openProject,
    previewProject,
    openNimo: () => window.NIMO?.openNimo?.() || scrollToTarget('#nimo-widget') || openProject('nimo'),
    openArcade: () => scrollToTarget('#intro-sequence') || openProject('arcade-os'),
    showLive: () => showByStatus('live'),
    showAll: () => showByStatus('all'),
    setMode: applyMode,
    recruiter: () => {
      applyMode('frontend');
      previewProject('arcade-os');
    },
    contact: () => scrollToTarget('#contact')
  };
}
