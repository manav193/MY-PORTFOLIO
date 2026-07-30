const PROJECT_GROUPS = {
  all: () => true,
  live: card => card.dataset.projectStatus === 'live',
  ai: card => ['nimo', 'promptai', 'fate-ai'].some(id => (card.dataset.projectId || '').includes(id)),
  frontend: card => ['arcade-os', 'nimo', 'toolverse', 'love'].includes(card.dataset.projectId),
  games: card => ['arcade-os', 'shift-zero', 'nintendo'].includes(card.dataset.projectId),
  design: card => ['velora-bites', 'nintendo', 'nike'].includes(card.dataset.projectId)
};

const PROJECT_ROUTES = {
  nimo: '/project-nimo.html',
  arcade: '/project-arcade-os.html',
  toolverse: '/project-toolverse.html',
  shift: '/project-shift-zero.html',
  velora: '/project-velora-bites.html',
  nintendo: '/project-nintendo.html',
  nike: '/project-nike.html',
  love: '/project-love-journey.html'
};

function injectStyles() {
  if (document.getElementById('flagship-experience-styles')) return;
  const style = document.createElement('style');
  style.id = 'flagship-experience-styles';
  style.textContent = `
    .project-filter-bar{display:flex;gap:.65rem;flex-wrap:wrap;margin:1.5rem 0 2.5rem}.project-filter-bar button{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:inherit;border-radius:999px;padding:.72rem 1rem;font:600 .78rem/1 Inter,sans-serif;letter-spacing:.04em;cursor:pointer}.project-filter-bar button[aria-pressed=true]{background:var(--accent,#7c5cff);color:#fff;border-color:transparent}.project-card.is-filtered-out{display:none!important}
    .flagship-launcher{position:fixed;right:18px;bottom:88px;z-index:10030;display:flex;flex-direction:column;gap:10px}.flagship-launcher button{width:48px;height:48px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(10,12,20,.82);color:#fff;backdrop-filter:blur(16px);box-shadow:0 14px 40px rgba(0,0,0,.28);cursor:pointer;font-weight:800}.flagship-launcher button:first-child{background:linear-gradient(135deg,#7657ff,#00b7ff)}
    .flagship-overlay{position:fixed;inset:0;z-index:10040;background:rgba(3,5,12,.92);backdrop-filter:blur(22px);display:none;overflow:auto;color:#eef2ff}.flagship-overlay.is-open{display:block}.flagship-shell{width:min(1180px,calc(100% - 32px));margin:32px auto;min-height:calc(100vh - 64px);border:1px solid rgba(255,255,255,.14);border-radius:28px;background:linear-gradient(145deg,rgba(20,24,39,.96),rgba(7,9,18,.97));box-shadow:0 35px 100px rgba(0,0,0,.5);overflow:hidden}.flagship-head{display:flex;justify-content:space-between;gap:20px;padding:24px 26px;border-bottom:1px solid rgba(255,255,255,.1)}.flagship-head small{display:block;color:#91a0bd;text-transform:uppercase;letter-spacing:.14em}.flagship-head h2{margin:.35rem 0 0;font-size:clamp(1.6rem,4vw,3rem)}.flagship-close{border:0;background:rgba(255,255,255,.08);color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer;font-size:1.25rem}.flagship-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;padding:22px}.flagship-panel{border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(255,255,255,.035);padding:20px}.flagship-panel h3{margin:0 0 14px}.nimo-command-grid,.arcade-app-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.nimo-command,.arcade-app{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;text-align:left;border-radius:14px;padding:14px;cursor:pointer}.nimo-command:hover,.arcade-app:hover{background:rgba(124,92,255,.18)}.nimo-transcript{min-height:250px;display:flex;flex-direction:column;gap:12px}.nimo-msg{padding:12px 14px;border-radius:14px;max-width:90%;line-height:1.55}.nimo-msg.user{align-self:flex-end;background:#7657ff}.nimo-msg.assistant{background:rgba(255,255,255,.08)}.nimo-pipeline{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px}.nimo-stage{padding:10px 7px;border-radius:10px;background:rgba(255,255,255,.04);font-size:.7rem;text-align:center;color:#8290ab}.nimo-stage.active{color:#fff;background:rgba(0,183,255,.2);box-shadow:0 0 28px rgba(0,183,255,.15)}.flagship-input{display:flex;gap:10px;margin-top:14px}.flagship-input input{flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);color:#fff;border-radius:12px;padding:12px}.flagship-input button,.flagship-primary{border:0;border-radius:12px;background:#7657ff;color:#fff;padding:12px 16px;cursor:pointer;font-weight:700}.arcade-screen{aspect-ratio:16/9;border:8px solid #202432;border-radius:18px;background:radial-gradient(circle at 50% 20%,#26325f,#080a12 65%);padding:18px;display:flex;flex-direction:column}.arcade-top{display:flex;justify-content:space-between;color:#9ba8c5;font:600 .72rem monospace}.arcade-window{flex:1;display:grid;place-items:center;text-align:center}.arcade-window h3{font-size:clamp(1.5rem,4vw,3.5rem);margin:.4rem}.arcade-status{font:600 .75rem monospace;color:#6cf5ba}.mobile-performance-note{display:none}
    @media(max-width:760px){html{scroll-behavior:auto}.flagship-launcher{right:12px;bottom:76px}.flagship-launcher button{width:44px;height:44px}.flagship-shell{width:calc(100% - 16px);margin:8px auto;min-height:calc(100vh - 16px);border-radius:20px}.flagship-grid{grid-template-columns:1fr;padding:12px}.flagship-head{padding:17px}.nimo-command-grid,.arcade-app-grid{grid-template-columns:1fr 1fr}.nimo-pipeline{grid-template-columns:repeat(5,minmax(54px,1fr));overflow-x:auto}.mobile-performance-note{display:block;color:#91a0bd;font-size:.75rem;margin-top:8px}#intro-sequence .arcade-env-particles,#intro-sequence .cab-3d-volume,.cursor-dot,.cursor-ring{display:none!important}.project-media[data-tilt]{transform:none!important}.project-showcase{content-visibility:auto;contain-intrinsic-size:1000px}.flagship-overlay{backdrop-filter:none;background:#050712}.flagship-panel{backdrop-filter:none}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
  `;
  document.head.appendChild(style);
}

function addProjectFilters() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase || document.querySelector('.project-filter-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'project-filter-bar';
  bar.setAttribute('aria-label', 'Filter projects');
  const labels = { all:'All', live:'Live Products', ai:'AI Systems', frontend:'Frontend', games:'Games', design:'UI/UX' };
  Object.entries(labels).forEach(([key,label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.dataset.filter = key;
    button.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false');
    button.addEventListener('click', () => {
      bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      showcase.querySelectorAll('.project-card').forEach(card => card.classList.toggle('is-filtered-out', !PROJECT_GROUPS[key](card)));
    });
    bar.appendChild(button);
  });
  showcase.parentElement.insertBefore(bar, showcase);
}

function makeOverlay(type) {
  const overlay = document.createElement('div');
  overlay.className = 'flagship-overlay'; overlay.dataset.flagship = type;
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  overlay.innerHTML = type === 'nimo' ? nimoMarkup() : arcadeMarkup();
  document.body.appendChild(overlay);
  overlay.querySelector('.flagship-close').addEventListener('click', () => closeOverlay(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(overlay); });
  return overlay;
}

function openOverlay(overlay) { overlay.classList.add('is-open'); document.body.style.overflow = 'hidden'; overlay.querySelector('button,input')?.focus(); }
function closeOverlay(overlay) { overlay.classList.remove('is-open'); document.body.style.overflow = ''; }

function nimoMarkup() { return `<div class="flagship-shell"><header class="flagship-head"><div><small>Portfolio intelligence layer</small><h2>NIMO Command Center</h2></div><button class="flagship-close" aria-label="Close">×</button></header><div class="flagship-grid"><section class="flagship-panel"><h3>Live conversation</h3><div class="nimo-transcript" data-nimo-transcript><div class="nimo-msg assistant">Namaste. Main NIMO hoon—Manav ke portfolio ko understand aur operate karne ke liye.</div></div><div class="nimo-pipeline">${['Language','Intent','Context','Action','Response'].map(x=>`<div class="nimo-stage">${x}</div>`).join('')}</div><form class="flagship-input" data-nimo-form><input aria-label="Ask NIMO" placeholder="Try: strongest AI project dikhao"><button>Send</button></form><p class="mobile-performance-note">Mobile performance mode active: heavy visual effects disabled.</p></section><aside class="flagship-panel"><h3>Quick commands</h3><div class="nimo-command-grid">${[['Recruiter briefing','recruiter'],['Strongest AI project','nimo'],['Best frontend work','toolverse'],['Open ArcadeOS','arcade'],['Show live projects','filter-live'],['Contact Manav','contact']].map(([l,a])=>`<button class="nimo-command" data-nimo-action="${a}">${l}</button>`).join('')}</div><h3 style="margin-top:22px">System</h3><p>Local intent routing with optional NIMO Core fallback. Actions are allowlisted and page-aware.</p><button class="flagship-primary" data-open-nimo-case>Open full case study</button></aside></div></div>`; }

function arcadeMarkup() { return `<div class="flagship-shell"><header class="flagship-head"><div><small>Interactive desktop demonstration</small><h2>ArcadeOS Launcher</h2></div><button class="flagship-close" aria-label="Close">×</button></header><div class="flagship-grid"><section class="flagship-panel"><div class="arcade-screen"><div class="arcade-top"><span>ARCADEOS // ONLINE</span><span data-arcade-clock></span></div><div class="arcade-window"><div><span class="arcade-status" data-arcade-status>SELECT AN APPLICATION</span><h3 data-arcade-title>LAUNCHER</h3><p data-arcade-copy>Choose a module to preview the operating-system architecture.</p></div></div></div></section><aside class="flagship-panel"><h3>Applications</h3><div class="arcade-app-grid">${[['Projects','Project Explorer'],['NIMO','Assistant Terminal'],['System','System Monitor'],['Themes','Theme Manager'],['Input','Input Diagnostics'],['Library','Game Library']].map(([a,b])=>`<button class="arcade-app" data-arcade-app="${a}" data-copy="${b}"><strong>${a}</strong><br><small>${b}</small></button>`).join('')}</div><button class="flagship-primary" style="margin-top:18px" data-open-arcade-case>Open ArcadeOS case study</button></aside></div></div>`; }

function runNimoAction(action, overlay) {
  if (action === 'filter-live') { closeOverlay(overlay); document.querySelector('[data-filter="live"]')?.click(); document.querySelector('#work')?.scrollIntoView(); return; }
  if (action === 'contact') { closeOverlay(overlay); document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'}); return; }
  if (action === 'arcade') { closeOverlay(overlay); document.querySelector('[data-flagship="arcade"]') && openOverlay(document.querySelector('[data-flagship="arcade"]')); return; }
  if (PROJECT_ROUTES[action]) location.href = PROJECT_ROUTES[action];
}

function wireNimo(overlay) {
  const transcript = overlay.querySelector('[data-nimo-transcript]');
  const stages = [...overlay.querySelectorAll('.nimo-stage')];
  const respond = query => {
    const user = document.createElement('div'); user.className='nimo-msg user'; user.textContent=query; transcript.appendChild(user);
    stages.forEach((stage,i)=>setTimeout(()=>stage.classList.add('active'),i*140));
    setTimeout(()=>{
      const assistant=document.createElement('div'); assistant.className='nimo-msg assistant';
      assistant.textContent = query.toLowerCase().includes('recruit') ? 'Recruiter path ready: NIMO, ArcadeOS and ToolVerse are the strongest proof points. Opening the live projects view.' : 'Intent resolved. Main portfolio assistant is processing this through its website-aware command layer.';
      transcript.appendChild(assistant); transcript.scrollTop=transcript.scrollHeight;
      if (window.NIMO?.processUserQuery) window.NIMO.processUserQuery(query);
      setTimeout(()=>stages.forEach(s=>s.classList.remove('active')),1000);
    },850);
  };
  overlay.querySelector('[data-nimo-form]').addEventListener('submit', e=>{e.preventDefault();const input=e.currentTarget.querySelector('input');if(input.value.trim()){respond(input.value.trim());input.value='';}});
  overlay.querySelectorAll('[data-nimo-action]').forEach(btn=>btn.addEventListener('click',()=>{const action=btn.dataset.nimoAction;if(['filter-live','contact','arcade','nimo','toolverse'].includes(action)) runNimoAction(action,overlay); else respond(btn.textContent);}));
  overlay.querySelector('[data-open-nimo-case]').addEventListener('click',()=>location.href=PROJECT_ROUTES.nimo);
}

function wireArcade(overlay) {
  const title=overlay.querySelector('[data-arcade-title]'), copy=overlay.querySelector('[data-arcade-copy]'), status=overlay.querySelector('[data-arcade-status]');
  const clock=overlay.querySelector('[data-arcade-clock]'); const tick=()=>clock.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});tick();setInterval(tick,30000);
  overlay.querySelectorAll('[data-arcade-app]').forEach(btn=>btn.addEventListener('click',()=>{status.textContent='APPLICATION READY';title.textContent=btn.dataset.arcadeApp.toUpperCase();copy.textContent=btn.dataset.copy+' preview loaded inside the lightweight portfolio demo.';}));
  overlay.querySelector('[data-open-arcade-case]').addEventListener('click',()=>location.href=PROJECT_ROUTES.arcade);
}

export function initFlagshipExperience() {
  injectStyles();
  const isCaseStudy = document.body.classList.contains('case-study') || location.pathname.includes('project-');
  if (!isCaseStudy) addProjectFilters();
  const nimo=makeOverlay('nimo'), arcade=makeOverlay('arcade'); wireNimo(nimo); wireArcade(arcade);
  if (!isCaseStudy) {
    const launcher=document.createElement('div');launcher.className='flagship-launcher';launcher.innerHTML='<button aria-label="Open NIMO">N</button><button aria-label="Open ArcadeOS">A</button>';document.body.appendChild(launcher);
    launcher.children[0].addEventListener('click',()=>openOverlay(nimo)); launcher.children[1].addEventListener('click',()=>openOverlay(arcade));
  }
  window.PortfolioController = { openNimo:()=>openOverlay(nimo), openArcade:()=>openOverlay(arcade), openProject:key=>PROJECT_ROUTES[key]&&(location.href=PROJECT_ROUTES[key]), showLive:()=>document.querySelector('[data-filter="live"]')?.click() };
}
