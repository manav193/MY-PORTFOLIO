const MEMORY_KEY = 'nimo_session_context_v1';
const ONBOARDING_KEY = 'nimo_onboarding_seen_v1';

function readMemory() {
  try {
    return JSON.parse(sessionStorage.getItem(MEMORY_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMemory(memory) {
  sessionStorage.setItem(MEMORY_KEY, JSON.stringify({
    ...memory,
    updatedAt: Date.now(),
    queries: Array.isArray(memory.queries) ? memory.queries.slice(-5) : [],
    projects: Array.isArray(memory.projects) ? [...new Set(memory.projects)].slice(-5) : []
  }));
}

function detectStyle(text) {
  const value = String(text || '').toLowerCase();
  if (/[ऀ-ॿ]/.test(value)) return 'Hindi';
  if (/\b(bhai|mujhe|dikhao|batao|kaunsa|kya|kaise|kholo|le chalo|acha|hai|karna|wala)\b/.test(value)) return 'Hinglish';
  return 'English';
}

function inferIntent(text) {
  const value = String(text || '').toLowerCase();
  if (/recruit|hire|resume|brief/.test(value)) return ['recruiter_briefing', 'Open verified portfolio summary'];
  if (/contact|email|message/.test(value)) return ['contact_navigation', 'Open contact section'];
  if (/arcade|game|cabinet/.test(value)) return ['open_arcade', 'Open ArcadeOS experience'];
  if (/nimo|assistant|ai/.test(value)) return ['project_explanation', 'Use verified NIMO context'];
  if (/project|work|frontend|ui|live/.test(value)) return ['project_discovery', 'Filter or open project work'];
  return ['portfolio_question', 'Generate grounded response'];
}

function currentContext() {
  const theme = document.body.dataset.projectTheme;
  if (theme) return theme;
  const active = ['work', 'skills', 'experience', 'about', 'contact'].find(id => {
    const node = document.getElementById(id);
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    return rect.top <= innerHeight * .55 && rect.bottom >= innerHeight * .3;
  });
  return active || 'portfolio-home';
}

function addStyles() {
  if (document.getElementById('nimo-upgrade-styles')) return;
  const style = document.createElement('style');
  style.id = 'nimo-upgrade-styles';
  style.textContent = `
    .nimo-context-strip{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.62rem .8rem;border-bottom:1px solid rgba(148,163,184,.14);font:600 .68rem/1.3 ui-monospace,SFMono-Regular,monospace;color:#a5b4fc;background:rgba(15,23,42,.78)}
    .nimo-context-strip small{color:#94a3b8;font-weight:500}.nimo-context-strip button{border:0;background:transparent;color:#c4b5fd;font:inherit;cursor:pointer;padding:0}
    .nimo-routing-view{margin:.55rem .75rem 0;padding:.72rem;border:1px solid rgba(99,102,241,.25);border-radius:14px;background:rgba(15,23,42,.72)}
    .nimo-routing-title{display:flex;justify-content:space-between;gap:.5rem;margin-bottom:.55rem;font:700 .66rem/1.2 ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em;text-transform:uppercase;color:#c4b5fd}.nimo-routing-title span:last-child{color:#67e8f9}
    .nimo-routing-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.35rem}.nimo-route-step{min-width:0;padding:.45rem;border-radius:9px;background:rgba(30,41,59,.8);border:1px solid rgba(148,163,184,.12)}.nimo-route-step b,.nimo-route-step span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nimo-route-step b{font:700 .56rem/1.2 ui-monospace,SFMono-Regular,monospace;color:#94a3b8;text-transform:uppercase}.nimo-route-step span{margin-top:.2rem;font-size:.66rem;color:#e2e8f0}.nimo-route-step.is-active{border-color:rgba(34,211,238,.55);box-shadow:0 0 18px rgba(34,211,238,.12)}
    .nimo-onboarding{margin:.7rem;padding:.8rem;border-radius:16px;background:linear-gradient(135deg,rgba(99,102,241,.16),rgba(6,182,212,.08));border:1px solid rgba(129,140,248,.25)}.nimo-onboarding h3{margin:0 0 .25rem;font-size:.88rem;color:#f8fafc}.nimo-onboarding p{margin:0 0 .65rem;font-size:.73rem;color:#cbd5e1}.nimo-onboarding-actions{display:flex;gap:.4rem;flex-wrap:wrap}.nimo-onboarding-actions button{border:1px solid rgba(165,180,252,.25);background:rgba(15,23,42,.7);color:#e0e7ff;border-radius:999px;padding:.45rem .62rem;font-size:.68rem;cursor:pointer}.nimo-onboarding-close{float:right;border:0!important;background:transparent!important;padding:.1rem!important;color:#94a3b8!important}
    .nimo-voice-btn{width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:12px;background:rgba(99,102,241,.13);color:#c4b5fd;cursor:pointer;flex:0 0 auto}.nimo-voice-btn[aria-pressed=true]{color:#67e8f9;box-shadow:0 0 0 2px rgba(34,211,238,.25);animation:nimoVoicePulse 1s infinite}.nimo-voice-btn:disabled{opacity:.4;cursor:not-allowed}.nimo-input-form{gap:.4rem}
    @keyframes nimoVoicePulse{50%{transform:scale(1.06)}}
    @media(max-width:560px){.nimo-routing-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.nimo-routing-view{display:none}.nimo-context-strip{font-size:.62rem}.nimo-onboarding{margin:.5rem}.nimo-voice-btn{width:36px;height:36px}}
    @media(prefers-reduced-motion:reduce){.nimo-voice-btn[aria-pressed=true]{animation:none}}
  `;
  document.head.appendChild(style);
}

function updatePipeline(query, root) {
  const [intent, action] = inferIntent(query);
  const language = detectStyle(query);
  const context = currentContext();
  const values = [query || 'Waiting', language, intent, context, action];
  root.querySelectorAll('.nimo-route-step').forEach((step, index) => {
    step.classList.toggle('is-active', Boolean(query));
    const value = step.querySelector('span');
    if (value) value.textContent = values[index];
  });
  const status = root.querySelector('[data-nimo-route-status]');
  if (status) status.textContent = query ? 'ROUTED' : 'READY';
}

function rememberQuery(query) {
  const memory = readMemory();
  memory.queries = [...(memory.queries || []), String(query).slice(0, 180)];
  memory.language = detectStyle(query);
  memory.context = currentContext();
  writeMemory(memory);
}

function rememberProject(id) {
  if (!id) return;
  const memory = readMemory();
  memory.projects = [...(memory.projects || []), id];
  memory.context = id;
  writeMemory(memory);
}

function mountContext(panel) {
  if (panel.querySelector('.nimo-context-strip')) return;
  const memory = readMemory();
  const latestProject = memory.projects?.at(-1) || document.body.dataset.projectTheme || 'none yet';
  const strip = document.createElement('div');
  strip.className = 'nimo-context-strip';
  strip.innerHTML = `<span>Session context: <strong data-nimo-context>${latestProject}</strong></span><small>No personal profile stored</small><button type="button" data-nimo-clear-memory>Clear</button>`;
  panel.querySelector('.nimo-header')?.after(strip);
  strip.querySelector('[data-nimo-clear-memory]')?.addEventListener('click', () => {
    sessionStorage.removeItem(MEMORY_KEY);
    strip.querySelector('[data-nimo-context]').textContent = 'cleared';
  });
}

function mountPipeline(panel) {
  if (panel.querySelector('.nimo-routing-view')) return panel.querySelector('.nimo-routing-view');
  const view = document.createElement('section');
  view.className = 'nimo-routing-view';
  view.setAttribute('aria-label', 'Safe request routing summary');
  view.innerHTML = `<div class="nimo-routing-title"><span>Safe routing summary</span><span data-nimo-route-status>READY</span></div><div class="nimo-routing-steps">${[['Query','Waiting'],['Language','—'],['Intent','—'],['Context','—'],['Action','—']].map(([label,value]) => `<div class="nimo-route-step"><b>${label}</b><span>${value}</span></div>`).join('')}</div>`;
  panel.querySelector('#nimo-messages')?.before(view);
  return view;
}

function mountOnboarding(panel, input) {
  if (sessionStorage.getItem(ONBOARDING_KEY) || panel.querySelector('.nimo-onboarding')) return;
  const card = document.createElement('section');
  card.className = 'nimo-onboarding';
  card.innerHTML = `<button class="nimo-onboarding-close" type="button" aria-label="Dismiss NIMO introduction">×</button><h3>Meet NIMO</h3><p>Portfolio ko natural language se explore karo. Main verified project context aur allowlisted actions use karti hoon.</p><div class="nimo-onboarding-actions"><button type="button">Recruiter briefing do</button><button type="button">Best AI project dikhao</button><button type="button">Live projects kholo</button></div>`;
  panel.querySelector('#nimo-messages')?.before(card);
  const dismiss = () => { sessionStorage.setItem(ONBOARDING_KEY, '1'); card.remove(); };
  card.querySelector('.nimo-onboarding-close')?.addEventListener('click', dismiss);
  card.querySelectorAll('.nimo-onboarding-actions button').forEach(button => button.addEventListener('click', () => {
    input.value = button.textContent;
    panel.querySelector('#nimo-input-form')?.requestSubmit();
    dismiss();
  }));
}

function mountVoice(form, input) {
  if (form.querySelector('.nimo-voice-btn')) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nimo-voice-btn';
  button.setAttribute('aria-label', SpeechRecognition ? 'Speak to NIMO' : 'Voice input unavailable');
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = '<span aria-hidden="true">◉</span>';
  button.disabled = !SpeechRecognition;
  form.insertBefore(button, form.querySelector('#nimo-send-btn'));
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => button.setAttribute('aria-pressed', 'true');
  recognition.onend = () => button.setAttribute('aria-pressed', 'false');
  recognition.onerror = () => button.setAttribute('aria-pressed', 'false');
  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    input.value = transcript;
    input.focus();
  };
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') recognition.stop();
    else recognition.start();
  });
}

export function initNimoExperienceUpgrades() {
  addStyles();
  const mount = () => {
    const panel = document.getElementById('nimo-panel');
    const form = document.getElementById('nimo-input-form');
    const input = document.getElementById('nimo-input');
    if (!panel || !form || !input) return false;

    mountContext(panel);
    const pipeline = mountPipeline(panel);
    mountOnboarding(panel, input);
    mountVoice(form, input);

    form.addEventListener('submit', () => {
      const query = input.value.trim();
      if (!query) return;
      rememberQuery(query);
      updatePipeline(query, pipeline);
      const style = detectStyle(query);
      if (style === 'Hinglish') window.NIMO?.setSessionLanguage?.('hinglish');
      if (style === 'Hindi') window.NIMO?.setSessionLanguage?.('hi');
      if (style === 'English') window.NIMO?.setSessionLanguage?.('en');
    }, true);

    document.addEventListener('click', event => {
      const card = event.target.closest('[data-project-id]');
      if (card) rememberProject(card.dataset.projectId);
    }, { passive: true });

    const initialProject = document.body.dataset.projectTheme;
    if (initialProject) rememberProject(initialProject);
    updatePipeline('', pipeline);
    return true;
  };

  if (mount()) return;
  const observer = new MutationObserver(() => {
    if (mount()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 5000);
}
