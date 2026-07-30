const ARCADE_STATE_KEY = 'arcadeos_state_v2';
const ARCADE_BOOT_KEY = 'arcadeos_boot_seen_v2';
const NIMO_HEALTH_URL = 'https://nimo-core.manav-nimo.workers.dev/api/health';

function readState() {
  try {
    return {
      theme: 'dark-graphite',
      lastApp: 'projects',
      sound: true,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      bootMode: 'cinematic',
      ...JSON.parse(localStorage.getItem(ARCADE_STATE_KEY) || '{}')
    };
  } catch {
    return { theme: 'dark-graphite', lastApp: 'projects', sound: true, reducedMotion: false, bootMode: 'cinematic' };
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch, updatedAt: Date.now() };
  localStorage.setItem(ARCADE_STATE_KEY, JSON.stringify(next));
  return next;
}

function addStyles() {
  if (document.getElementById('nimo-arcade-26-30-styles')) return;
  const style = document.createElement('style');
  style.id = 'nimo-arcade-26-30-styles';
  style.textContent = `
    .nimo-health-panel{margin:.55rem .75rem;padding:.75rem;border:1px solid rgba(34,211,238,.22);border-radius:14px;background:rgba(7,16,31,.76)}
    .nimo-health-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem}.nimo-health-head strong{font:700 .68rem/1.2 ui-monospace,monospace;letter-spacing:.1em;color:#dbeafe}.nimo-health-state{display:inline-flex;align-items:center;gap:.42rem;font-size:.66rem;color:#94a3b8}.nimo-health-state i{width:7px;height:7px;border-radius:50%;background:#64748b}.nimo-health-state.is-online i{background:#34d399;box-shadow:0 0 10px #34d399}.nimo-health-state.is-offline i{background:#fb7185}.nimo-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem;margin-top:.65rem}.nimo-health-grid div{padding:.5rem;border-radius:10px;background:rgba(15,23,42,.72)}.nimo-health-grid b,.nimo-health-grid span{display:block}.nimo-health-grid b{font:700 .55rem/1.2 ui-monospace,monospace;color:#64748b;text-transform:uppercase}.nimo-health-grid span{margin-top:.16rem;font-size:.67rem;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .arcade-smart-launcher{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;background:rgba(3,7,18,.82);backdrop-filter:blur(18px)}.arcade-smart-launcher[hidden]{display:none}.arcade-smart-shell{width:min(980px,calc(100% - 28px));max-height:88vh;overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:28px;background:linear-gradient(145deg,#0b1220,#111827);box-shadow:0 40px 120px rgba(0,0,0,.55)}.arcade-smart-top{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid rgba(148,163,184,.12)}.arcade-smart-top strong{font:800 .78rem/1 ui-monospace,monospace;letter-spacing:.14em;color:#e0f2fe}.arcade-smart-close{border:0;background:rgba(255,255,255,.06);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer}.arcade-smart-grid{display:grid;grid-template-columns:220px 1fr;min-height:520px}.arcade-app-list{padding:1rem;border-right:1px solid rgba(148,163,184,.12);display:grid;align-content:start;gap:.55rem}.arcade-app-btn{border:1px solid rgba(148,163,184,.12);background:rgba(15,23,42,.68);color:#cbd5e1;border-radius:14px;padding:.8rem;text-align:left;cursor:pointer}.arcade-app-btn.is-active{border-color:#38bdf8;color:#fff;background:rgba(14,165,233,.14)}.arcade-app-view{padding:1.2rem}.arcade-app-view h2{margin:0 0 .4rem;color:#f8fafc}.arcade-app-view p{color:#94a3b8}.arcade-app-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin-top:1rem}.arcade-app-card{padding:1rem;border:1px solid rgba(148,163,184,.13);border-radius:16px;background:rgba(15,23,42,.64)}.arcade-app-card strong,.arcade-app-card span{display:block}.arcade-app-card span{margin-top:.3rem;color:#94a3b8;font-size:.82rem}.arcade-settings-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem 0;border-bottom:1px solid rgba(148,163,184,.1)}.arcade-settings-row button{border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.05);color:#e2e8f0;border-radius:999px;padding:.5rem .75rem;cursor:pointer}.arcade-open-btn{position:fixed;left:22px;bottom:112px;z-index:10010;border:1px solid rgba(56,189,248,.3);background:rgba(8,15,30,.82);color:#e0f2fe;border-radius:999px;padding:.72rem 1rem;font:700 .68rem/1 ui-monospace,monospace;letter-spacing:.1em;cursor:pointer;backdrop-filter:blur(14px)}
    body.arcade-fast-boot #intro-sequence .boot-terminal{animation-duration:.18s!important}body.arcade-fast-boot #intro-sequence .boot-line{animation-delay:0s!important;animation-duration:.18s!important}body.arcade-skip-boot #intro-sequence .boot-loader{display:none!important}
    @media(max-width:760px){.arcade-smart-grid{grid-template-columns:1fr}.arcade-app-list{grid-template-columns:repeat(2,minmax(0,1fr));border-right:0;border-bottom:1px solid rgba(148,163,184,.12)}.arcade-app-cards{grid-template-columns:1fr}.arcade-open-btn{display:none}.nimo-health-grid{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

async function mountNimoHealth(panel) {
  if (!panel || panel.querySelector('.nimo-health-panel')) return;
  const health = document.createElement('section');
  health.className = 'nimo-health-panel';
  health.innerHTML = `<div class="nimo-health-head"><strong>NIMO SYSTEM HEALTH</strong><span class="nimo-health-state"><i></i><span>Checking</span></span></div><div class="nimo-health-grid"><div><b>Worker</b><span data-health-worker>Checking</span></div><div><b>Version</b><span data-health-version>Unknown</span></div><div><b>Response mode</b><span>Local + secure fallback</span></div><div><b>Context</b><span data-health-context>${document.body.dataset.projectTheme || 'portfolio-home'}</span></div></div>`;
  panel.querySelector('.nimo-routing-view')?.after(health) || panel.querySelector('#nimo-messages')?.before(health);
  const state = health.querySelector('.nimo-health-state');
  try {
    const response = await fetch(NIMO_HEALTH_URL, { cache: 'no-store', signal: AbortSignal.timeout?.(4500) });
    const data = response.ok ? await response.json().catch(() => ({})) : {};
    state.classList.add(response.ok ? 'is-online' : 'is-offline');
    state.querySelector('span').textContent = response.ok ? 'Online' : 'Unavailable';
    health.querySelector('[data-health-worker]').textContent = response.ok ? 'Connected' : `HTTP ${response.status}`;
    health.querySelector('[data-health-version]').textContent = data.version || data.release || 'Live';
  } catch {
    state.classList.add('is-offline');
    state.querySelector('span').textContent = 'Unavailable';
    health.querySelector('[data-health-worker]').textContent = 'No response';
  }
}

function installEasterEggs() {
  const original = window.NIMO?.processUserQuery;
  if (!original || window.NIMO.__easterEggsInstalled) return;
  const answers = [
    [/who built you|kisne banaya|creator/i, 'Mujhe Manav Agarwal ne build kiya—portfolio navigation, verified project knowledge aur safe actions ke liye.'],
    [/weirdest project|sabse weird|strangest/i, 'ArcadeOS sabse unusual hai: portfolio ke andar ek browser operating system, cabinet UI, games aur system tools.'],
    [/developer mode|dev mode/i, 'Developer mode unlocked: try “show routing pipeline”, “open NIMO architecture”, ya “inspect live projects”.'],
    [/secret|easter egg/i, 'Secret command found. Ask: “Who built you?”, “Show the weirdest project”, or “Enter developer mode”.']
  ];
  window.NIMO.processUserQuery = function(query, ...rest) {
    const match = answers.find(([pattern]) => pattern.test(String(query || '')));
    if (match) {
      const input = document.getElementById('nimo-input');
      const messages = document.getElementById('nimo-messages');
      if (input) input.value = '';
      if (messages) {
        const msg = document.createElement('div');
        msg.className = 'nimo-msg nimo-msg-assistant';
        msg.textContent = match[1];
        messages.append(msg);
        messages.scrollTop = messages.scrollHeight;
      }
      window.NIMO.openNimo?.();
      return Promise.resolve(match[1]);
    }
    return original.call(this, query, ...rest);
  };
  window.NIMO.__easterEggsInstalled = true;
}

function applyBootPreference() {
  const state = readState();
  const seen = localStorage.getItem(ARCADE_BOOT_KEY) === '1';
  document.body.classList.toggle('arcade-fast-boot', seen || state.bootMode === 'fast');
  document.body.classList.toggle('arcade-skip-boot', state.bootMode === 'skip');
  if (!seen) localStorage.setItem(ARCADE_BOOT_KEY, '1');
}

function appMarkup(id) {
  const state = readState();
  const views = {
    projects: `<h2>Project Explorer</h2><p>Flagship and shipped work, connected directly to the portfolio.</p><div class="arcade-app-cards"><article class="arcade-app-card"><strong>NIMO</strong><span>Intelligence layer</span></article><article class="arcade-app-card"><strong>ToolVerse</strong><span>70+ browser utilities</span></article><article class="arcade-app-card"><strong>SHIFT-ZERO</strong><span>Godot game system</span></article><article class="arcade-app-card"><strong>Velora Bites</strong><span>Editorial UI concept</span></article></div>`,
    terminal: `<h2>NIMO Terminal</h2><p>Launch the assistant with a prepared developer command.</p><div class="arcade-app-cards"><button class="arcade-app-card" data-nimo-command="Show my strongest engineering project"><strong>Strongest project</strong><span>Run verified recommendation</span></button><button class="arcade-app-card" data-nimo-command="Enter developer mode"><strong>Developer mode</strong><span>Open technical commands</span></button></div>`,
    monitor: `<h2>System Monitor</h2><p>Current browser and runtime capability snapshot.</p><div class="arcade-app-cards"><article class="arcade-app-card"><strong>${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</strong><span>Network state</span></article><article class="arcade-app-card"><strong>${navigator.hardwareConcurrency || '—'} cores</strong><span>Logical processors</span></article><article class="arcade-app-card"><strong>${innerWidth} × ${innerHeight}</strong><span>Viewport</span></article><article class="arcade-app-card"><strong>${matchMedia('(pointer: coarse)').matches ? 'COARSE' : 'FINE'}</strong><span>Pointer mode</span></article></div>`,
    settings: `<h2>ArcadeOS Settings</h2><p>Saved locally on this device.</p><div class="arcade-settings-row"><span>Boot mode</span><button data-cycle-boot>${state.bootMode}</button></div><div class="arcade-settings-row"><span>Sound preference</span><button data-toggle-sound>${state.sound ? 'On' : 'Off'}</button></div><div class="arcade-settings-row"><span>Reduced motion</span><button data-toggle-motion>${state.reducedMotion ? 'On' : 'Off'}</button></div><div class="arcade-settings-row"><span>Reset state</span><button data-reset-arcade>Reset</button></div>`
  };
  return views[id] || views.projects;
}

function mountArcadeLauncher() {
  if (document.querySelector('[data-arcade-smart-launcher]')) return;
  const root = document.createElement('div');
  root.className = 'arcade-smart-launcher';
  root.dataset.arcadeSmartLauncher = '';
  root.hidden = true;
  root.innerHTML = `<section class="arcade-smart-shell" role="dialog" aria-modal="true" aria-label="ArcadeOS mini apps"><header class="arcade-smart-top"><strong>ARCADEOS // CONTROL CENTER</strong><button class="arcade-smart-close" data-arcade-close aria-label="Close">×</button></header><div class="arcade-smart-grid"><nav class="arcade-app-list"><button class="arcade-app-btn" data-arcade-app="projects">Project Explorer</button><button class="arcade-app-btn" data-arcade-app="terminal">NIMO Terminal</button><button class="arcade-app-btn" data-arcade-app="monitor">System Monitor</button><button class="arcade-app-btn" data-arcade-app="settings">Settings</button></nav><main class="arcade-app-view"></main></div></section>`;
  document.body.append(root);
  const openButton = document.createElement('button');
  openButton.className = 'arcade-open-btn';
  openButton.textContent = 'ARCADEOS APPS';
  openButton.type = 'button';
  document.body.append(openButton);

  const openApp = id => {
    const view = root.querySelector('.arcade-app-view');
    view.innerHTML = appMarkup(id);
    root.querySelectorAll('[data-arcade-app]').forEach(button => button.classList.toggle('is-active', button.dataset.arcadeApp === id));
    writeState({ lastApp: id });
    view.querySelectorAll('[data-nimo-command]').forEach(button => button.addEventListener('click', () => {
      root.hidden = true;
      window.NIMO?.openNimo?.();
      window.NIMO?.processUserQuery?.(button.dataset.nimoCommand);
    }));
    view.querySelector('[data-cycle-boot]')?.addEventListener('click', event => {
      const modes = ['cinematic', 'fast', 'skip'];
      const current = readState().bootMode;
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      writeState({ bootMode: next });
      event.currentTarget.textContent = next;
      applyBootPreference();
    });
    view.querySelector('[data-toggle-sound]')?.addEventListener('click', event => {
      const next = !readState().sound;
      writeState({ sound: next });
      event.currentTarget.textContent = next ? 'On' : 'Off';
      document.documentElement.dataset.arcadeSound = next ? 'on' : 'off';
    });
    view.querySelector('[data-toggle-motion]')?.addEventListener('click', event => {
      const next = !readState().reducedMotion;
      writeState({ reducedMotion: next });
      event.currentTarget.textContent = next ? 'On' : 'Off';
      document.documentElement.dataset.arcadeReducedMotion = next ? 'true' : 'false';
    });
    view.querySelector('[data-reset-arcade]')?.addEventListener('click', () => {
      localStorage.removeItem(ARCADE_STATE_KEY);
      localStorage.removeItem(ARCADE_BOOT_KEY);
      openApp('settings');
    });
  };

  const open = () => { root.hidden = false; openApp(readState().lastApp || 'projects'); };
  const close = () => { root.hidden = true; };
  openButton.addEventListener('click', open);
  root.querySelector('[data-arcade-close]').addEventListener('click', close);
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-arcade-app]');
    if (button) openApp(button.dataset.arcadeApp);
    if (event.target === root) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !root.hidden) close(); });
  window.ArcadeMiniApps = { open, close, openApp, getState: readState, setState: writeState };
}

export function initNimoArcade2630() {
  addStyles();
  applyBootPreference();
  mountArcadeLauncher();
  const mount = () => {
    const panel = document.getElementById('nimo-panel');
    if (!panel) return false;
    mountNimoHealth(panel);
    installEasterEggs();
    return true;
  };
  if (!mount()) {
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 6000);
  }
}
