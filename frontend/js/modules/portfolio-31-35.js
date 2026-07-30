const MOBILE_QUERY = '(max-width: 900px)';
const NIMO_HEALTH = 'https://nimo-core.manav-nimo.workers.dev/api/health';

function isCaseStudy() {
  return Boolean(document.body.dataset.projectTheme);
}

function scrollTo(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mountMobileArcadeLite() {
  if (isCaseStudy() || document.querySelector('[data-arcade-lite]')) return;

  const root = document.createElement('div');
  root.className = 'arcade-lite';
  root.dataset.arcadeLite = '';
  root.innerHTML = `
    <button class="arcade-lite__launcher" type="button" aria-expanded="false" data-arcade-lite-toggle>
      <span>ARCADE LITE</span><small>Mobile navigation</small>
    </button>
    <div class="arcade-lite__sheet" hidden data-arcade-lite-sheet>
      <div class="arcade-lite__head"><div><span>MOBILE ALTERNATIVE</span><strong>ArcadeOS without the heavy cabinet.</strong></div><button type="button" data-arcade-lite-close aria-label="Close">×</button></div>
      <div class="arcade-lite__grid">
        <button type="button" data-lite-target="#work"><b>Projects</b><span>Browse shipped work</span></button>
        <button type="button" data-lite-nimo><b>NIMO</b><span>Open assistant</span></button>
        <button type="button" data-lite-target="#about"><b>Profile</b><span>Skills and background</span></button>
        <button type="button" data-lite-target="#contact"><b>Contact</b><span>Start a conversation</span></button>
      </div>
      <p class="arcade-lite__note">Designed for compact screens: no 3D cabinet, no forced cinematic boot, and lower animation overhead.</p>
    </div>`;
  document.body.append(root);

  const launcher = root.querySelector('[data-arcade-lite-toggle]');
  const sheet = root.querySelector('[data-arcade-lite-sheet]');
  const setOpen = open => {
    sheet.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
  };
  launcher.addEventListener('click', () => setOpen(sheet.hidden));
  root.querySelector('[data-arcade-lite-close]').addEventListener('click', () => setOpen(false));
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-lite-target]');
    if (target) {
      setOpen(false);
      scrollTo(target.dataset.liteTarget);
    }
    if (event.target.closest('[data-lite-nimo]')) {
      setOpen(false);
      if (window.NIMO?.openNimo) window.NIMO.openNimo();
      else document.querySelector('[data-nimo-toggle], .nimo-toggle')?.click();
    }
  });
}

function gamepadSnapshot() {
  if (!('getGamepads' in navigator)) return [];
  return Array.from(navigator.getGamepads?.() || []).filter(Boolean);
}

function mountInteractionLab() {
  if (isCaseStudy() || document.querySelector('[data-interaction-lab]')) return;
  const work = document.querySelector('#work');
  if (!work) return;

  const section = document.createElement('section');
  section.className = 'interaction-lab section-shell';
  section.dataset.interactionLab = '';
  section.innerHTML = `
    <div class="interaction-lab__heading">
      <p>INPUT + RUNTIME LAB</p>
      <h2>Inspect browser capabilities instead of trusting decorative badges.</h2>
      <span>The panels below report this device and this browser only. They are not benchmark claims.</span>
    </div>
    <div class="interaction-lab__grid">
      <article class="input-demo">
        <div class="lab-card__head"><div><span>GAMEPAD INPUT</span><h3>Live controller demonstration</h3></div><i data-pad-led></i></div>
        <p data-pad-status>Connect a controller and press any button.</p>
        <div class="input-demo__readout">
          <div><span>Device</span><strong data-pad-name>Not connected</strong></div>
          <div><span>Buttons</span><strong data-pad-buttons>—</strong></div>
          <div><span>Axes</span><strong data-pad-axes>—</strong></div>
        </div>
        <div class="input-demo__buttons" aria-label="Gamepad button activity" data-pad-visual>${Array.from({length: 8}, (_, i) => `<i data-pad-button="${i}">${i}</i>`).join('')}</div>
        <small>Uses the browser Gamepad API. Keyboard input is not presented as a connected controller.</small>
      </article>
      <article class="runtime-tests">
        <div class="lab-card__head"><div><span>TOOL TESTING DASHBOARD</span><h3>Run capability checks</h3></div><button type="button" data-run-tests>Run checks</button></div>
        <div class="runtime-tests__list" data-test-list></div>
        <p data-test-summary>No checks run yet.</p>
      </article>
    </div>`;
  work.before(section);

  const status = section.querySelector('[data-pad-status]');
  const name = section.querySelector('[data-pad-name]');
  const buttons = section.querySelector('[data-pad-buttons]');
  const axes = section.querySelector('[data-pad-axes]');
  const led = section.querySelector('[data-pad-led]');
  let raf = 0;

  const renderGamepad = () => {
    const pads = gamepadSnapshot();
    const pad = pads[0];
    led.classList.toggle('is-online', Boolean(pad));
    if (!pad) {
      status.textContent = 'Connect a controller and press any button.';
      name.textContent = 'Not connected';
      buttons.textContent = '—';
      axes.textContent = '—';
      section.querySelectorAll('[data-pad-button]').forEach(node => node.classList.remove('is-active'));
    } else {
      const activeButtons = pad.buttons.map((button, index) => button.pressed ? index : null).filter(index => index !== null);
      status.textContent = activeButtons.length ? `Active button${activeButtons.length > 1 ? 's' : ''}: ${activeButtons.join(', ')}` : 'Controller connected. Press a button to test input.';
      name.textContent = pad.id || 'Connected controller';
      buttons.textContent = `${pad.buttons.length} mapped`;
      axes.textContent = pad.axes.map(value => Number(value).toFixed(2)).join(' · ') || 'No axes';
      section.querySelectorAll('[data-pad-button]').forEach(node => {
        const index = Number(node.dataset.padButton);
        node.classList.toggle('is-active', Boolean(pad.buttons[index]?.pressed));
      });
    }
    raf = requestAnimationFrame(renderGamepad);
  };
  renderGamepad();
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });

  section.querySelector('[data-run-tests]').addEventListener('click', () => runRuntimeChecks(section));
}

function resultRow(label, state, detail) {
  return `<div class="runtime-test is-${state}"><i></i><div><strong>${label}</strong><span>${detail}</span></div><b>${state === 'pass' ? 'PASS' : state === 'warn' ? 'UNAVAILABLE' : 'FAIL'}</b></div>`;
}

async function runRuntimeChecks(section) {
  const list = section.querySelector('[data-test-list]');
  const summary = section.querySelector('[data-test-summary]');
  const button = section.querySelector('[data-run-tests]');
  button.disabled = true;
  button.textContent = 'Running…';
  const checks = [];

  checks.push(['Project catalog', document.querySelectorAll('[data-project-id]').length > 0 ? 'pass' : 'fail', `${document.querySelectorAll('[data-project-id]').length} project cards detected`]);
  checks.push(['Sticky layout support', CSS.supports('position', 'sticky') ? 'pass' : 'warn', CSS.supports('position', 'sticky') ? 'Supported by this browser' : 'Not supported by this browser']);
  checks.push(['Gamepad API', 'getGamepads' in navigator ? 'pass' : 'warn', 'getGamepads' in navigator ? `${gamepadSnapshot().length} controller(s) currently connected` : 'API not exposed']);
  checks.push(['Speech input API', ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'pass' : 'warn', ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'Browser speech recognition available' : 'Not available in this browser']);
  checks.push(['Service worker API', 'serviceWorker' in navigator ? 'pass' : 'warn', 'serviceWorker' in navigator ? 'Offline-capable API available' : 'API unavailable']);

  let storageState = 'pass';
  let storageDetail = 'Write and cleanup succeeded';
  try {
    const key = '__portfolio_runtime_check__';
    localStorage.setItem(key, '1');
    if (localStorage.getItem(key) !== '1') throw new Error('read mismatch');
    localStorage.removeItem(key);
  } catch {
    storageState = 'warn';
    storageDetail = 'Storage blocked or unavailable';
  }
  checks.push(['Local state', storageState, storageDetail]);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(NIMO_HEALTH, { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    checks.push(['NIMO worker', response.ok ? 'pass' : 'fail', response.ok ? `Health endpoint responded HTTP ${response.status}` : `Health endpoint returned HTTP ${response.status}`]);
  } catch {
    checks.push(['NIMO worker', 'warn', 'Endpoint could not be reached from this browser']);
  }

  list.innerHTML = checks.map(check => resultRow(...check)).join('');
  const pass = checks.filter(([, state]) => state === 'pass').length;
  const fail = checks.filter(([, state]) => state === 'fail').length;
  summary.textContent = `${pass}/${checks.length} checks passed · ${fail} failed · ${new Date().toLocaleTimeString()}`;
  button.disabled = false;
  button.textContent = 'Run again';
}

function removePlaceholderMonetization() {
  const selectors = [
    '[data-placeholder-monetization]', '[data-monetization-placeholder]',
    '.pricing-placeholder', '.paywall-placeholder', '.subscription-placeholder',
    '[class*="fake-pricing"]', '[id*="fake-pricing"]'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(node => node.remove());

  document.querySelectorAll('section, article, aside, dialog').forEach(node => {
    const identity = `${node.id} ${node.className || ''}`.toLowerCase();
    if (!/(pricing|monetization|paywall|subscription)/.test(identity)) return;
    const text = node.textContent.toLowerCase();
    const placeholder = /(coming soon|placeholder|demo only|upgrade to pro|buy credits|choose plan)/.test(text);
    const hasRealCheckout = Boolean(node.querySelector('a[href*="checkout"], form[action]:not([action=""]), [data-real-checkout]'));
    if (placeholder && !hasRealCheckout) node.remove();
  });
}

function disableFakeNewsletterSuccess() {
  const forms = Array.from(document.querySelectorAll('form')).filter(form => {
    const identity = `${form.id} ${form.className || ''} ${form.getAttribute('data-form') || ''}`.toLowerCase();
    return identity.includes('newsletter') || identity.includes('subscribe');
  });

  forms.forEach(form => {
    const action = (form.getAttribute('action') || '').trim();
    const hasEndpoint = Boolean(action && action !== '#' && !action.startsWith('javascript:')) || Boolean(form.dataset.endpoint || form.dataset.realSubscription);
    if (hasEndpoint) return;
    const replacement = document.createElement('div');
    replacement.className = 'newsletter-disabled-note';
    replacement.innerHTML = '<strong>Email updates are not enabled.</strong><span>No subscription request is sent and no success state is simulated.</span>';
    form.replaceWith(replacement);
  });
}

export function initPortfolio3135() {
  if (isCaseStudy()) return;
  removePlaceholderMonetization();
  disableFakeNewsletterSuccess();
  mountMobileArcadeLite();
  mountInteractionLab();

  const query = matchMedia(MOBILE_QUERY);
  const syncMobile = () => document.documentElement.classList.toggle('has-arcade-lite', query.matches);
  syncMobile();
  query.addEventListener?.('change', syncMobile);
}
