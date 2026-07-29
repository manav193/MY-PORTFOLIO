const PUBLIC_PROJECTS = Object.freeze({
  featured: [
    { id:'fate-ai', index:'09', type:'Multi-API AI workspace', status:'In Development', statusClass:'status-progress', title:'FATE-AI', description:'One continuous AI workspace designed to connect 100+ provider APIs and accounts instead of forcing users to manage dozens of separate apps.', role:'Product architecture, provider routing, frontend and backend engineering', challenge:'Keep conversations and long-running tasks moving when an API key reaches quota, times out, or becomes unavailable.', result:'A provider pool with automatic failover, manual switching, bounded retries, server-side credentials, account health, latency and usage visibility. Tasks continue through the configured pool until no eligible route remains.', tech:['React','TypeScript','Node.js','Multi-provider APIs','Failover'], github:'https://github.com/manav193/FATE-AI', caseStudy:'assets/case-studies/public-project.html?id=fate-ai', visual:'FATE // 100+ API', visualDetail:'Continuous provider routing' },
    { id:'flora-and-flavor', index:'10', type:'Cinematic restaurant experience', status:'In Development', statusClass:'status-progress', title:'Flora & Flavor', description:'A real interactive vegetarian restaurant project combining scroll-driven storytelling, a seasonal menu, reservations, reviews, gallery and order interactions.', role:'Creative direction, interaction design and frontend development', challenge:'Synchronize premium editorial typography and a rotating hero bowl with scroll progress while preserving mobile performance and reduced-motion accessibility.', result:'A responsive single-page experience with GSAP and ScrollTrigger choreography, staggered copy reveals, menu filters, reservation feedback and front-end ordering interactions.', tech:['HTML5','CSS3','Vanilla JS','GSAP','ScrollTrigger'], github:'https://github.com/manav193/Flora-and-Flavor', caseStudy:'assets/case-studies/public-project.html?id=flora-and-flavor', visual:'FLORA & FLAVOR', visualDetail:'Botanical dining, reimagined' },
    { id:'veldora-bites', index:'11', type:'Restaurant web application', status:'Live', statusClass:'status-live', title:'VELDORA-BITES', description:'A complete responsive restaurant experience with a 40-item photographic menu, persistent cart, coupons, INR pricing and simulated ordering flows.', role:'Product design and frontend engineering', challenge:'Turn a luxury visual concept into a usable multi-page ordering system without introducing real payment risk.', result:'Dedicated home, menu and orders pages; quantity controls; subtotal, delivery and discount logic; local order history; PWA support; and clearly simulated payment interactions.', tech:['HTML','CSS','Vanilla JS','PWA','Local Storage'], github:'https://github.com/manav193/VELDORA-BITES', live:'https://veldora-bites.vercel.app/', caseStudy:'assets/case-studies/veldora-bites.html', image:'images/velora_desktop.png' },
    { id:'prompt-ai', index:'12', type:'Multi-model AI product', status:'In Development', statusClass:'status-progress', title:'PromptAI', description:'A real multi-model workspace for writing prompts, comparing model outputs and retaining testing context inside one dense split-pane environment.', role:'Product direction, AI workflow design and frontend implementation', challenge:'Replace fragmented prompt testing across separate AI interfaces with one coherent, developer-focused workflow.', result:'A product architecture centered on prompt authoring, model comparison, output inspection, testing context and reusable prompt workflows.', tech:['AI Workspace','Prompt Engineering','Multi-model UX','Frontend','Design System'], github:'https://github.com/manav193/Prompt-Aii', caseStudy:'project-promptai.html', image:'images/promptai_new.png' }
  ],
  experiments: [
    { title:'Multi API System', status:'Earlier Prototype', description:'The earlier multi-provider AI routing prototype that informed the architecture and product direction of FATE-AI.', github:'https://github.com/manav193/Multi_API_system', caseStudy:'assets/case-studies/public-project.html?id=multi-api-system', visual:'MULTI API', visualDetail:'Provider routing prototype' },
    { title:'ResumeAI', status:'Android Concept', description:'A Material 3 resume-builder concept with Jetpack Compose, AI-assisted writing, ATS-oriented templates, preview and PDF-export goals.', github:'https://github.com/manav193/resume-ai', caseStudy:'assets/case-studies/public-project.html?id=resume-ai', visual:'RESUME AI', visualDetail:'Kotlin · Compose · Material 3' },
    { title:'Route 73: Night Shift', status:'Game Concept', description:'An early game repository reserved for the Route 73: Night Shift concept and future implementation work.', github:'https://github.com/manav193/Route-73-Night-Shift', visual:'ROUTE 73', visualDetail:'Night Shift' },
    { title:'Aurora Control UI', status:'UI Prototype', description:'A responsive control-dashboard exploration featuring system health, metrics, workspace navigation and priority workflows.', github:'https://github.com/manav193/AURORA-CONTROL-UI', caseStudy:'assets/case-studies/public-project.html?id=aurora-control-ui', visual:'AURORA', visualDetail:'Control systems interface' }
  ],
  uiStack: [
    { index:'01', title:'Velora Bites UI', type:'Luxury hospitality interface', status:'UI Prototype', image:'images/velora_desktop.png', caseStudy:'project-velora-bites.html' },
    { index:'02', title:'Nintendo UI', type:'Console interface concept', status:'UI Prototype', image:'images/nintendo.jpg', caseStudy:'project-nintendo.html' },
    { index:'03', title:'SHIFT-ZERO UI', type:'Game HUD and menu system', status:'Design Prototype', image:'images/sz_menu.png', caseStudy:'assets/case-studies/public-project.html?id=shift-zero-ui' },
    { index:'04', title:'Nike Website UI', type:'E-commerce interaction concept', status:'UI Prototype', image:'images/nike.png', caseStudy:'project-nike.html' }
  ]
});

function escapeHtml(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}

function ensureStackStyles(){
  if(document.querySelector('link[data-project-stack-styles]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='assets/project-stack.css';
  link.dataset.projectStackStyles='';
  document.head.appendChild(link);
}

function createVisual(project,compact=false){
  if(project.image) return `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project preview" width="${compact?1200:1600}" height="${compact?800:900}" loading="lazy">`;
  return `<div class="project-text-visual" aria-hidden="true"><strong>${escapeHtml(project.visual||project.title)}</strong><span>${escapeHtml(project.visualDetail||project.status)}</span></div>`;
}

function featuredCard(project){
  const tech=project.tech.map(item=>`<span>${escapeHtml(item)}</span>`).join('');
  const actions=[project.live?`<a href="${escapeHtml(project.live)}" class="btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>`:'',`<a href="${escapeHtml(project.github)}" class="${project.live?'btn-secondary':'btn-primary'}" target="_blank" rel="noopener noreferrer">GitHub</a>`,project.caseStudy?`<a href="${escapeHtml(project.caseStudy)}" class="btn-secondary">Case Study</a>`:''].join('');
  const textOnly=project.image?'':' data-tilt-text';
  return `<article class="project-card reveal-up${project.image?' has-project-image':' is-text-project'}" data-project-id="${escapeHtml(project.id)}" data-project-status="${escapeHtml(project.status.toLowerCase().replaceAll(' ','-'))}"${textOnly}><div class="project-media">${createVisual(project)}</div><div class="project-body"><div class="project-heading-row"><span class="project-index">${escapeHtml(project.index)}</span><span class="project-type">${escapeHtml(project.type)}</span><span class="project-status ${escapeHtml(project.statusClass)}">${escapeHtml(project.status)}</span></div><h3>${escapeHtml(project.title)}</h3><p class="project-value">${escapeHtml(project.description)}</p><dl class="project-evidence"><div><dt>Role</dt><dd>${escapeHtml(project.role)}</dd></div><div><dt>Challenge</dt><dd>${escapeHtml(project.challenge)}</dd></div><div><dt>Current result</dt><dd>${escapeHtml(project.result)}</dd></div></dl><div class="project-tech">${tech}</div><div class="project-actions">${actions}</div></div></article>`;
}

function experimentCard(project){
  const actions=[project.caseStudy?`<a href="${escapeHtml(project.caseStudy)}">View Case Study</a>`:'',`<a href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">View GitHub</a>`].join('');
  const textOnly=project.image?'':' data-tilt-text';
  return `<article class="experiment-card${project.image?' has-project-image':' is-text-project'}"${textOnly}><div class="experiment-card__media">${createVisual(project,true)}</div><div class="experiment-card__content"><span class="project-status status-progress">${escapeHtml(project.status)}</span><h4>${escapeHtml(project.title)}</h4><p>${escapeHtml(project.description)}</p><div class="experiment-card__actions">${actions}</div></div></article>`;
}

function removeLegacyCards(){
  const projectIds=new Set(['velora-bites','nintendo','nike']);
  document.querySelectorAll('[data-project-showcase] [data-project-id]').forEach(card=>{
    if(projectIds.has(card.dataset.projectId)) card.remove();
  });
  const removeTitles=new Set(['promptai','shift-zero ui']);
  document.querySelectorAll('.experiments-grid .experiment-card').forEach(card=>{
    const title=card.querySelector('h4')?.textContent.trim().toLowerCase();
    if(removeTitles.has(title)) card.remove();
  });
}

function uiStackMarkup(){
  const cards=PUBLIC_PROJECTS.uiStack.map((project,i)=>`<article class="ui-stack-item" style="--stack-index:${i}"><a class="ui-stack-link" href="${escapeHtml(project.caseStudy)}" aria-label="Open ${escapeHtml(project.title)} case study"><img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} interface preview" loading="lazy" width="1600" height="1000"><span class="ui-stack-shade" aria-hidden="true"></span><span class="ui-stack-copy"><span class="ui-stack-meta">${escapeHtml(project.index)} · ${escapeHtml(project.type)}</span><strong>${escapeHtml(project.title)}</strong><span class="ui-stack-footer"><span>${escapeHtml(project.status)}</span><span>View Case Study ↗</span></span></span></a></article>`).join('');
  return `<section class="ui-project-showcase" aria-labelledby="ui-project-showcase-title"><header class="ui-stack-heading"><p class="hero-kicker">[ SEC-UI ] // VISUAL SYSTEMS</p><h3 id="ui-project-showcase-title">Interface projects, presented at full scale.</h3><p>Scroll to layer each project over the previous one. Select any full-screen panel to open its case study.</p></header><div class="ui-project-stack">${cards}</div></section>`;
}

function insertUiStack(){
  if(document.querySelector('.ui-project-showcase')) return;
  const showcase=document.querySelector('[data-project-showcase]');
  if(!showcase) return;
  showcase.insertAdjacentHTML('afterend',uiStackMarkup());
}

export function initPublicProjectCatalog(){
  ensureStackStyles();
  removeLegacyCards();
  const showcase=document.querySelector('[data-project-showcase]');
  if(showcase){
    const existingIds=new Set([...showcase.querySelectorAll('[data-project-id]')].map(node=>node.dataset.projectId));
    const markup=PUBLIC_PROJECTS.featured.filter(project=>!existingIds.has(project.id)).map(featuredCard).join('');
    if(markup) showcase.insertAdjacentHTML('beforeend',markup);
  }
  insertUiStack();
  const experiments=document.querySelector('.experiments-grid');
  if(experiments){
    const existingText=experiments.textContent.toLowerCase();
    const markup=PUBLIC_PROJECTS.experiments.filter(project=>!existingText.includes(project.title.toLowerCase())).map(experimentCard).join('');
    if(markup) experiments.insertAdjacentHTML('beforeend',markup);
  }
}

export { PUBLIC_PROJECTS };