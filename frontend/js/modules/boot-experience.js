import { createProjectEvent, createSystemStatus } from '../nimo-core/index.js';
import { PROJECT_MODULE_DEFINITIONS } from '../generated/project-federation.js';
import { createMaintenanceWrench, runWrenchCalibration } from './arcade-maintenance.js';

const SESSION_KEY = 'arcade-os:system-boot-complete';
const PROJECT_EVENT_NAME = 'nimo:project-event';
const STATUS_EVENT_NAME = 'nimo:system-status';

const createOverlay = (modules, fullBoot) => {
  const overlay = document.createElement('section');
  overlay.className = `system-boot ${fullBoot ? 'system-boot--full' : 'system-boot--returning'}`;
  overlay.dataset.bootMode = fullBoot ? 'full' : 'returning';
  overlay.setAttribute('aria-label', 'Arcade OS starting');
  overlay.innerHTML = `
    <div class="system-boot__surface" aria-hidden="true">
      <span class="system-boot__line"></span>
      <div class="system-boot__mark"><span>ARCADE</span><strong>OS</strong></div>
      <p class="system-boot__status">INITIALIZING ARCADE OS</p>
      <div class="system-boot__modules">${modules.map(module => `<i title="${module.name}"></i>`).join('')}</div>
      <span class="system-boot__calibration-line"></span>
    </div>
    <button type="button" class="system-boot__skip">Skip system opening</button>
    <p class="system-boot__live visually-hidden" aria-live="polite" aria-atomic="true">Arcade OS is starting.</p>`;
  overlay.querySelector('.system-boot__surface').appendChild(createMaintenanceWrench());
  return overlay;
};

export function initBootExperience() {
  if (!document.body || window.__arcadeBootExperience) return window.__arcadeBootExperience || null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modules = PROJECT_MODULE_DEFINITIONS.map(({ manifest }) => manifest);
  const moduleIds = new Set(modules.map(module => module.id));
  let fullBoot = true;
  try { fullBoot = sessionStorage.getItem(SESSION_KEY) !== '1'; } catch {}

  const overlay = createOverlay(modules, fullBoot);
  const statusText = overlay.querySelector('.system-boot__status');
  const liveRegion = overlay.querySelector('.system-boot__live');
  const skipButton = overlay.querySelector('.system-boot__skip');
  const wrench = overlay.querySelector('.system-boot-wrench');
  const timers = new Set();
  const eventTypes = [];
  let completed = false;
  const scale = Math.max(0.01, Number(window.__ARCADE_BOOT_TEST_SCALE__) || 1);
  const schedule = (callback, delay) => {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, Math.max(0, delay * scale));
    timers.add(timer);
  };

  const emit = (type, detail = {}) => {
    if (eventTypes.includes(type)) return;
    eventTypes.push(type);
    window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, {
      detail: createProjectEvent(type, { moduleId: 'arcade-os', detail })
    }));
  };
  const publishStatus = (status, text, detail = {}) => {
    window.dispatchEvent(new CustomEvent(STATUS_EVENT_NAME, {
      detail: createSystemStatus(status, { moduleId: 'arcade-os', detail: { text, ...detail } })
    }));
  };
  const renderStatus = event => {
    if (event.detail?.detail?.text) statusText.textContent = event.detail.detail.text;
  };

  const complete = (reason = 'complete') => {
    if (completed) return;
    completed = true;
    timers.forEach(clearTimeout);
    timers.clear();
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    emit('systemBootCompleted', { reason, moduleCount: modules.length });
    publishStatus('system-ready', 'SYSTEM STABLE', { reason });
    liveRegion.textContent = 'Arcade OS interface ready.';
    document.body.classList.remove('system-boot-active');
    overlay.classList.add('is-complete');
    window.removeEventListener(STATUS_EVENT_NAME, renderStatus);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    schedule(() => overlay.remove(), reducedMotion ? 80 : 360);
    if (reason === 'skip') {
      const main = document.getElementById('main-content');
      if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
    }
  };
  const onVisibilityChange = () => { if (document.hidden) complete('hidden'); };

  window.addEventListener(STATUS_EVENT_NAME, renderStatus);
  document.addEventListener('visibilitychange', onVisibilityChange);
  skipButton.addEventListener('click', () => complete('skip'), { once: true });
  document.body.appendChild(overlay);
  document.body.classList.add('system-boot-active');
  requestAnimationFrame(() => overlay.classList.add('is-running'));

  emit('systemBootStarted', { mode: fullBoot ? 'full' : 'returning' });
  publishStatus('boot-started', 'INITIALIZING ARCADE OS');

  const stages = reducedMotion
    ? [
        [60, () => { if (moduleIds.has('nimo')) { emit('nimoCoreOnline'); publishStatus('core-online', 'NIMO CORE ONLINE'); } }],
        [220, () => complete('reduced-motion')]
      ]
    : fullBoot
      ? [
          [430, () => overlay.dataset.stage = 'mark'],
          [820, () => { if (moduleIds.has('nimo')) { emit('nimoCoreOnline'); publishStatus('core-online', 'NIMO CORE ONLINE'); } }],
          [1240, () => { emit('moduleRegistryReady', { moduleCount: modules.length }); publishStatus('registry-ready', 'LOADING SYSTEM MODULES', { moduleCount: modules.length }); overlay.dataset.stage = 'modules'; }],
          [1640, () => { if (moduleIds.has('toolverse')) { emit('toolVerseRegistered'); publishStatus('module-registered', 'TOOLVERSE UTILITIES REGISTERED', { registered: true }); } }],
          [1930, () => { overlay.dataset.stage = 'calibration'; runWrenchCalibration(wrench, { duration: 470 * scale }); }],
          [2600, () => complete('complete')]
        ]
      : [
          [90, () => { overlay.dataset.stage = 'mark'; if (moduleIds.has('nimo')) emit('nimoCoreOnline'); }],
          [210, () => { emit('moduleRegistryReady', { moduleCount: modules.length }); overlay.dataset.stage = 'modules'; }],
          [480, () => complete('returning')]
        ];
  stages.forEach(([delay, callback]) => schedule(callback, delay));

  const safetyDelay = Number(window.__ARCADE_BOOT_TEST_TIMEOUT__) || (fullBoot ? 3400 : 1000);
  schedule(() => complete('safety-timeout'), safetyDelay);

  const controller = Object.freeze({
    mode: fullBoot ? 'full' : 'returning',
    reducedMotion,
    complete,
    getEventTypes: () => [...eventTypes]
  });
  window.__arcadeBootExperience = controller;
  return controller;
}
