const PUBLIC_PROJECTS = Object.freeze({
  featured: [
    {
      id: 'fate-ai',
      index: '09',
      type: 'Multi-API AI workspace',
      status: 'In Development',
      statusClass: 'status-progress',
      title: 'FATE-AI',
      description: 'One continuous AI workspace designed to connect 100+ provider APIs and accounts instead of forcing users to manage dozens of separate apps.',
      role: 'Product architecture, provider routing, frontend and backend engineering',
      challenge: 'Keep conversations and long-running tasks moving when an API key reaches quota, times out, or becomes unavailable.',
      result: 'A provider pool with automatic failover, manual switching, bounded retries, server-side credentials, account health, latency and usage visibility. Tasks continue through the configured pool until no eligible route remains.',
      tech: ['React', 'TypeScript', 'Node.js', 'Multi-provider APIs', 'Failover'],
      github: 'https://github.com/manav193/FATE-AI',
      visual: 'FATE // 100+ API',
      visualDetail: 'Continuous provider routing'
    },
    {
      id: 'flora-and-flavor',
      index: '10',
      type: 'Cinematic restaurant experience',
      status: 'Portfolio Concept',
      statusClass: 'status-progress',
      title: 'Flora & Flavor',
      description: 'An elegant botanical vegetarian restaurant experience combining scroll-driven storytelling, a seasonal menu, reservations, reviews, gallery and order interactions.',
      role: 'Creative direction, interaction design and frontend development',
      challenge: 'Synchronize premium editorial typography and a rotating hero bowl with scroll progress while preserving mobile performance and reduced-motion accessibility.',
      result: 'A responsive single-page experience with GSAP and ScrollTrigger choreography, staggered copy reveals, menu filters, reservation feedback and front-end ordering interactions.',
      tech: ['HTML5', 'CSS3', 'Vanilla JS', 'GSAP', 'ScrollTrigger'],
      github: 'https://github.com/manav193/Flora-and-Flavor',
      visual: 'FLORA & FLAVOR',
      visualDetail: 'Botanical dining, reimagined'
    },
    {
      id: 'veldora-bites',
      index: '11',
      type: 'Restaurant web application',
      status: 'Live',
      statusClass: 'status-live',
      title: 'VELDORA-BITES',
      description: 'A complete responsive restaurant experience with a 40-item photographic menu, persistent cart, coupons, INR pricing and simulated ordering flows.',
      role: 'Product design and frontend engineering',
      challenge: 'Turn a luxury visual concept into a usable multi-page ordering system without introducing real payment risk.',
      result: 'Dedicated home, menu and orders pages; quantity controls; subtotal, delivery and discount logic; local order history; PWA support; and clearly simulated payment interactions.',
      tech: ['HTML', 'CSS', 'Vanilla JS', 'PWA', 'Local Storage'],
      github: 'https://github.com/manav193/VELDORA-BITES',
      live: 'https://veldora-bites.vercel.app/',
      caseStudy: 'assets/case-studies/veldora-bites.html',
      image: 'images/velora_desktop.png'
    }
  ],
  experiments: [
    {
      title: 'PromptAI',
      status: 'Product Concept',
      description: 'A dense split-pane workspace for authoring prompts, comparing models and outputs, and retaining testing context in one interface.',
      github: 'https://github.com/manav193/Prompt-Aii',
      caseStudy: 'project-promptai.html',
      image: 'images/promptai_new.png'
    },
    {
      title: 'Multi API System',
      status: 'Earlier Prototype',
      description: 'The earlier multi-provider AI routing prototype that informed the architecture and product direction of FATE-AI.',
      github: 'https://github.com/manav193/Multi_API_system',
      visual: 'MULTI API',
      visualDetail: 'Provider routing prototype'
    },
    {
      title: 'ResumeAI',
      status: 'Android Concept',
      description: 'A Material 3 resume-builder concept with Jetpack Compose, AI-assisted writing, ATS-oriented templates, preview and PDF-export goals.',
      github: 'https://github.com/manav193/resume-ai',
      visual: 'RESUME AI',
      visualDetail: 'Kotlin · Compose · Material 3'
    },
    {
      title: 'Route 73: Night Shift',
      status: 'Game Concept',
      description: 'An early game repository reserved for the Route 73: Night Shift concept and future implementation work.',
      github: 'https://github.com/manav193/Route-73-Night-Shift',
      visual: 'ROUTE 73',
      visualDetail: 'Night Shift'
    },
    {
      title: 'Aurora Control UI',
      status: 'UI Prototype',
      description: 'A responsive control-dashboard exploration featuring system health, metrics, workspace navigation and priority workflows.',
      github: 'https://github.com/manav193/AURORA-CONTROL-UI',
      visual: 'AURORA',
      visualDetail: 'Control systems interface'
    },
    {
      title: 'SHIFT-ZERO UI',
      status: 'Design Prototype',
      description: 'The dedicated premium HUD and menu direction supporting the wider SHIFT-ZERO Godot game project.',
      github: 'https://github.com/manav193/SHIFT-ZERO-UI',
      image: 'images/sz_menu.png'
    }
  ]
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createVisual(project, compact = false) {
  if (project.image) {
    return `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project preview" width="${compact ? 1200 : 1600}" height="${compact ? 800 : 900}" loading="lazy">`;
  }

  return `<div style="min-height:${compact ? '220px' : '320px'};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px;background:radial-gradient(circle at 25% 20%,rgba(132,94,247,.34),transparent 34%),radial-gradient(circle at 80% 75%,rgba(0,212,255,.2),transparent 38%),linear-gradient(135deg,#080a12,#141827);color:#fff;">
    <strong style="font-family:'JetBrains Mono',monospace;font-size:clamp(1.35rem,3vw,2.5rem);letter-spacing:.08em;">${escapeHtml(project.visual || project.title)}</strong>
    <span style="margin-top:12px;color:rgba(255,255,255,.66);font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(project.visualDetail || project.status)}</span>
  </div>`;
}

function featuredCard(project) {
  const tech = project.tech.map(item => `<span>${escapeHtml(item)}</span>`).join('');
  const actions = [
    project.live ? `<a href="${escapeHtml(project.live)}" class="btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>` : '',
    `<a href="${escapeHtml(project.github)}" class="${project.live ? 'btn-secondary' : 'btn-primary'}" target="_blank" rel="noopener noreferrer">GitHub</a>`,
    project.caseStudy ? `<a href="${escapeHtml(project.caseStudy)}" class="btn-secondary">Case Study</a>` : ''
  ].join('');

  return `<article class="project-card reveal-up" data-project-id="${escapeHtml(project.id)}" data-project-status="${escapeHtml(project.status.toLowerCase().replaceAll(' ', '-'))}">
    <div class="project-media">${createVisual(project)}</div>
    <div class="project-body">
      <div class="project-heading-row"><span class="project-index">${escapeHtml(project.index)}</span><span class="project-type">${escapeHtml(project.type)}</span><span class="project-status ${escapeHtml(project.statusClass)}">${escapeHtml(project.status)}</span></div>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="project-value">${escapeHtml(project.description)}</p>
      <dl class="project-evidence"><div><dt>Role</dt><dd>${escapeHtml(project.role)}</dd></div><div><dt>Challenge</dt><dd>${escapeHtml(project.challenge)}</dd></div><div><dt>Current result</dt><dd>${escapeHtml(project.result)}</dd></div></dl>
      <div class="project-tech">${tech}</div>
      <div class="project-actions">${actions}</div>
    </div>
  </article>`;
}

function experimentCard(project) {
  const actions = [
    project.caseStudy ? `<a href="${escapeHtml(project.caseStudy)}">View Case Study</a>` : '',
    `<a href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">View GitHub</a>`
  ].join('');

  return `<article class="experiment-card">
    <div class="experiment-card__media">${createVisual(project, true)}</div>
    <div class="experiment-card__content"><span class="project-status status-progress">${escapeHtml(project.status)}</span><h4>${escapeHtml(project.title)}</h4><p>${escapeHtml(project.description)}</p><div class="experiment-card__actions">${actions}</div></div>
  </article>`;
}

function augmentExistingExperiment(experiments, project) {
  const card = [...experiments.querySelectorAll('.experiment-card')]
    .find(node => node.querySelector('h4')?.textContent.trim().toLowerCase() === project.title.toLowerCase());
  if (!card) return false;

  const actions = card.querySelector('.experiment-card__actions');
  if (actions && !actions.querySelector(`a[href="${project.github}"]`)) {
    actions.insertAdjacentHTML('beforeend', `<a href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">View GitHub</a>`);
  }
  return true;
}

export function initPublicProjectCatalog() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (showcase) {
    const existingIds = new Set([...showcase.querySelectorAll('[data-project-id]')].map(node => node.dataset.projectId));
    const markup = PUBLIC_PROJECTS.featured.filter(project => !existingIds.has(project.id)).map(featuredCard).join('');
    if (markup) showcase.insertAdjacentHTML('beforeend', markup);
  }

  const experiments = document.querySelector('.experiments-grid');
  if (experiments) {
    const missing = PUBLIC_PROJECTS.experiments.filter(project => !augmentExistingExperiment(experiments, project));
    const markup = missing.map(experimentCard).join('');
    if (markup) experiments.insertAdjacentHTML('beforeend', markup);
  }
}

export { PUBLIC_PROJECTS };
