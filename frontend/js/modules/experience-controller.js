/**
 * EXPERIENCE CONTROLLER
 * Authoritative Portfolio <-> Arcade transition controller.
 */

let currentState = 'PORTFOLIO';
const ARCADE_UNDER_CONSTRUCTION = true;

function ensureMaintenanceStyles() {
  if (document.getElementById('arcade-maintenance-styles')) return;

  const style = document.createElement('style');
  style.id = 'arcade-maintenance-styles';
  style.textContent = `
    body.arcade-maintenance-mode #intro-sequence {
      min-height: 72vh !important;
      height: auto !important;
      display: grid !important;
      place-items: center;
      padding: clamp(72px, 10vw, 128px) 20px;
      overflow: hidden;
      position: relative;
    }
    body.arcade-maintenance-mode #intro-sequence > .intro-sticky-container {
      display: none !important;
    }
    .arcade-maintenance-section {
      position: relative;
      z-index: 2;
      width: min(880px, 100%);
      padding: clamp(28px, 5vw, 54px);
      border: 1px solid rgba(111, 226, 255, .22);
      border-radius: 32px;
      text-align: center;
      color: #f6fbff;
      background:
        radial-gradient(circle at 50% -10%, rgba(61, 198, 255, .20), transparent 44%),
        linear-gradient(145deg, rgba(15, 23, 42, .94), rgba(3, 7, 18, .97));
      box-shadow: 0 32px 100px rgba(0, 0, 0, .42), inset 0 1px 0 rgba(255, 255, 255, .05);
    }
    .arcade-maintenance-section::before {
      content: '';
      position: absolute;
      inset: -80px;
      z-index: -1;
      background: radial-gradient(circle, rgba(52, 211, 255, .12), transparent 60%);
      pointer-events: none;
    }
    .arcade-maintenance-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      color: #7ceaff;
      font: 600 11px/1.2 'JetBrains Mono', monospace;
      letter-spacing: .15em;
    }
    .arcade-maintenance-badge span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #65e6ff;
      box-shadow: 0 0 14px #65e6ff;
      animation: arcadeMaintenancePulse 1.5s ease-in-out infinite;
    }
    .arcade-maintenance-eyebrow {
      margin: 0 0 10px;
      color: #8cecff;
      font: 600 12px/1.2 'JetBrains Mono', monospace;
      letter-spacing: .24em;
    }
    .arcade-maintenance-section h2 {
      margin: 0;
      font: 700 clamp(38px, 7vw, 72px)/.98 Inter, system-ui, sans-serif;
      letter-spacing: -.055em;
    }
    .arcade-maintenance-section p {
      max-width: 620px;
      margin: 22px auto 0;
      color: rgba(226, 232, 240, .76);
      font: 400 clamp(15px, 2vw, 18px)/1.7 Inter, system-ui, sans-serif;
    }
    .arcade-maintenance-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-top: 30px;
    }
    .arcade-maintenance-meta span {
      padding: 9px 13px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 999px;
      color: rgba(231, 245, 255, .76);
      background: rgba(255,255,255,.035);
      font: 500 11px/1 'JetBrains Mono', monospace;
      letter-spacing: .06em;
    }
    #arcade-construction-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: grid;
      place-items: center;
      padding: 24px;
      opacity: 0;
      visibility: hidden;
      transition: opacity .24s ease, visibility .24s ease;
    }
    #arcade-construction-overlay.is-visible { opacity: 1; visibility: visible; }
    .arcade-construction-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(2, 4, 12, .82);
      backdrop-filter: blur(18px);
    }
    .arcade-construction-card {
      position: relative;
      width: min(520px, 100%);
      overflow: hidden;
      border: 1px solid rgba(112, 225, 255, .28);
      border-radius: 28px;
      padding: 38px;
      color: #f7fbff;
      text-align: center;
      background: radial-gradient(circle at 50% 0%, rgba(45, 189, 255, .18), transparent 42%), linear-gradient(145deg, rgba(15, 23, 42, .98), rgba(3, 7, 18, .98));
      box-shadow: 0 34px 100px rgba(0, 0, 0, .58), inset 0 1px 0 rgba(255,255,255,.05);
      transform: translateY(16px) scale(.98);
      transition: transform .28s ease;
    }
    #arcade-construction-overlay.is-visible .arcade-construction-card { transform: translateY(0) scale(1); }
    .arcade-construction-close {
      position: absolute;
      top: 16px;
      right: 18px;
      width: 38px;
      height: 38px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 50%;
      color: #dbeafe;
      background: rgba(255,255,255,.04);
      font: 300 26px/1 system-ui, sans-serif;
      cursor: pointer;
    }
    .arcade-construction-status {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 28px;
      color: #78e8ff;
      font: 600 11px/1.2 'JetBrains Mono', monospace;
      letter-spacing: .13em;
    }
    .arcade-construction-status span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #65e6ff;
      box-shadow: 0 0 14px #65e6ff;
      animation: arcadeMaintenancePulse 1.4s ease-in-out infinite;
    }
    .arcade-construction-icon {
      display: grid;
      place-items: center;
      width: 78px;
      height: 78px;
      margin: 0 auto 22px;
      border: 1px solid rgba(120, 232, 255, .25);
      border-radius: 24px;
      color: #8bedff;
      background: rgba(19, 92, 122, .18);
      font-size: 34px;
      animation: arcadeMaintenanceSpin 7s linear infinite;
    }
    .arcade-construction-kicker {
      margin: 0 0 8px;
      color: #8bedff;
      font: 600 12px/1.2 'JetBrains Mono', monospace;
      letter-spacing: .24em;
    }
    .arcade-construction-card h2 {
      margin: 0;
      font: 700 clamp(32px, 7vw, 52px)/1.02 Inter, system-ui, sans-serif;
      letter-spacing: -.045em;
    }
    .arcade-construction-copy {
      max-width: 430px;
      margin: 18px auto 26px;
      color: rgba(226, 232, 240, .75);
      font: 400 15px/1.7 Inter, system-ui, sans-serif;
    }
    .arcade-construction-progress {
      height: 5px;
      overflow: hidden;
      margin: 0 auto 28px;
      border-radius: 999px;
      background: rgba(255,255,255,.08);
    }
    .arcade-construction-progress span {
      display: block;
      width: 44%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #4fd9ff, #8b5cf6);
      box-shadow: 0 0 18px rgba(79,217,255,.6);
    }
    .arcade-construction-action {
      width: 100%;
      border: 1px solid rgba(120, 232, 255, .28);
      border-radius: 15px;
      padding: 14px 20px;
      color: #eafcff;
      background: linear-gradient(135deg, rgba(24, 130, 177, .34), rgba(91, 60, 180, .26));
      font: 600 14px/1 Inter, system-ui, sans-serif;
      cursor: pointer;
    }
    @keyframes arcadeMaintenancePulse { 50% { opacity: .35; transform: scale(.78); } }
    @keyframes arcadeMaintenanceSpin { to { transform: rotate(360deg); } }
    @media (max-width: 560px) {
      body.arcade-maintenance-mode #intro-sequence { min-height: 62vh !important; padding-inline: 14px; }
      .arcade-maintenance-section { padding: 34px 20px; border-radius: 24px; }
      .arcade-construction-card { padding: 34px 22px 24px; border-radius: 22px; }
      .arcade-construction-copy { font-size: 14px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .arcade-maintenance-badge span,
      .arcade-construction-status span,
      .arcade-construction-icon { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

function applyArcadeMaintenancePresentation() {
  if (!ARCADE_UNDER_CONSTRUCTION) return;
  ensureMaintenanceStyles();
  document.body.classList.add('arcade-maintenance-mode');

  const intro = document.getElementById('intro-sequence');
  if (!intro || intro.querySelector('.arcade-maintenance-section')) return;

  const notice = document.createElement('section');
  notice.className = 'arcade-maintenance-section';
  notice.setAttribute('aria-labelledby', 'arcade-maintenance-heading');
  notice.innerHTML = `
    <div class="arcade-maintenance-badge"><span></span> SYSTEM UPDATE IN PROGRESS</div>
    <p class="arcade-maintenance-eyebrow">ARCADE OS</p>
    <h2 id="arcade-maintenance-heading">Under Construction</h2>
    <p>The interactive arcade is temporarily offline while its runtime, controls, and game systems are being rebuilt for a cleaner and more stable experience.</p>
    <div class="arcade-maintenance-meta" aria-label="Maintenance areas">
      <span>RUNTIME</span><span>CONTROLS</span><span>GAMEPLAY</span><span>STABILITY</span>
    </div>
  `;
  intro.appendChild(notice);
}

function closeConstructionNotice(overlay) {
  overlay.classList.remove('is-visible');
  document.body.style.overflow = '';
}

function showArcadeConstructionNotice() {
  ensureMaintenanceStyles();
  let overlay = document.getElementById('arcade-construction-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'arcade-construction-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'arcade-construction-title');
    overlay.innerHTML = `
      <div class="arcade-construction-backdrop" data-arcade-construction-close></div>
      <section class="arcade-construction-card">
        <button class="arcade-construction-close" type="button" aria-label="Close notice" data-arcade-construction-close>×</button>
        <div class="arcade-construction-status"><span></span> SYSTEM UPDATE IN PROGRESS</div>
        <div class="arcade-construction-icon" aria-hidden="true">⚙</div>
        <p class="arcade-construction-kicker">ARCADE OS</p>
        <h2 id="arcade-construction-title">Under Construction</h2>
        <p class="arcade-construction-copy">The arcade is currently being rebuilt and tuned for a more stable experience. It will return after the next system update.</p>
        <div class="arcade-construction-progress" aria-hidden="true"><span></span></div>
        <button class="arcade-construction-action" type="button" data-arcade-construction-close>Back to Portfolio</button>
      </section>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('[data-arcade-construction-close]').forEach((element) => {
      element.addEventListener('click', () => closeConstructionNotice(overlay));
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeConstructionNotice(overlay);
    });
  }

  document.body.classList.remove('arcade-active');
  document.body.style.overflow = 'hidden';
  overlay.classList.add('is-visible');
  overlay.tabIndex = -1;
  overlay.focus();
}

export const ExperienceController = {
  get state() { return currentState; },
  getState() { return currentState; },

  async enterArcadeExperience(source = 'button') {
    if (ARCADE_UNDER_CONSTRUCTION) {
      currentState = 'PORTFOLIO';
      showArcadeConstructionNotice();
      return false;
    }

    document.body.classList.add('arcade-active');
    if (['ARCADE_HOME', 'ARCADE_APP', 'ARCADE_ENTERING'].includes(currentState)) return true;
    currentState = 'ARCADE_ENTERING';

    const chassis = document.querySelector('.cabinet-chassis');
    if (chassis) chassis.classList.add('is-scaled');

    const osLayer = document.getElementById('arcade-os');
    if (osLayer) {
      osLayer.style.opacity = '1';
      osLayer.style.pointerEvents = 'auto';
      osLayer.classList.remove('is-hidden');
    }

    if (window.ArcadeOS) {
      window.ArcadeOS.userExited = false;
      window.ArcadeOS.osVisible = true;
      if (!window.ArcadeOS.booted) window.ArcadeOS.boot();
      else window.ArcadeOS.resume();
    }

    window.ArcadeBootController?.triggerBootSequence();

    if (source === 'dock' || source === 'button') {
      const intro = document.getElementById('intro-sequence');
      if (intro) {
        const targetY = window.scrollY + intro.getBoundingClientRect().top + window.innerHeight * .96;
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }
    }

    currentState = window.ArcadeOS?.activeApp || window.ArcadeOS?.state === 'APP' ? 'ARCADE_APP' : 'ARCADE_HOME';
    window.setActiveDock?.('arcade');
    return true;
  },

  async exitArcadeExperience(source = 'button', targetSectionId = null) {
    document.body.classList.remove('arcade-active');
    const chassis = document.querySelector('.cabinet-chassis');
    chassis?.classList.remove('is-scaled');

    if (currentState === 'PORTFOLIO' || currentState === 'ARCADE_EXITING') {
      if (targetSectionId && targetSectionId !== 'none') this.navigateToPortfolioSection(targetSectionId);
      return true;
    }

    currentState = 'ARCADE_EXITING';
    if (window.ArcadeBootController) await window.ArcadeBootController.sleep();

    if (window.ArcadeOS) {
      window.ArcadeOS.userExited = true;
      window.ArcadeOS.osVisible = false;
      window.ArcadeOS.suspend();
    }

    const osLayer = document.getElementById('arcade-os');
    if (osLayer) {
      osLayer.style.opacity = '0';
      osLayer.style.pointerEvents = 'none';
    }

    if (source === 'dock' || source === 'button' || targetSectionId) {
      this.navigateToPortfolioSection(targetSectionId || (source === 'dock' ? 'portfolio-intro' : 'main-content'));
    }

    currentState = 'PORTFOLIO';
    return true;
  },

  navigateToPortfolioSection(targetSectionId) {
    if (!targetSectionId || targetSectionId === 'none') return;
    if (targetSectionId === 'portfolio-intro' || targetSectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.setActiveDock?.('portfolio-intro');
      return;
    }

    const element = document.getElementById(targetSectionId);
    if (element) {
      const header = document.getElementById('main-nav');
      const offset = (header?.getBoundingClientRect().height || 0) + 16;
      const top = Math.max(0, window.scrollY + element.getBoundingClientRect().top - offset);
      window.scrollTo({ top, behavior: 'instant' });
    }
    window.setActiveDock?.(targetSectionId);
  },

  notifyAppStateChange(appActive) {
    if (currentState === 'PORTFOLIO' || currentState === 'ARCADE_EXITING') return;
    currentState = appActive ? 'ARCADE_APP' : 'ARCADE_HOME';
  }
};

if (typeof window !== 'undefined') {
  const initializeMaintenance = () => applyArcadeMaintenancePresentation();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMaintenance, { once: true });
  else initializeMaintenance();

  window.ArcadeExperience = ExperienceController;
  window.enterArcadeExperience = (source) => ExperienceController.enterArcadeExperience(source);
  window.exitArcadeExperience = (source, target) => ExperienceController.exitArcadeExperience(source, target);
  window.enterArcade = () => ExperienceController.enterArcadeExperience('dock');
  window.exitArcadeToPortfolio = (target) => ExperienceController.exitArcadeExperience('dock', target);
  window.activateArcade = () => ExperienceController.enterArcadeExperience('scroll');
}
