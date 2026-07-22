const NIMO_LOGO_PATH = 'icons/nimo-logo.svg';

export function initRuntimeFixes() {
  hardenNimoControls();
  hardenArcadeEntry();
}

function hardenNimoControls() {
  const widget = document.getElementById('nimo-widget');
  const panel = document.getElementById('nimo-panel');
  const launcher = document.getElementById('nimo-launcher');
  const closeBtn = document.getElementById('nimo-close-btn');

  if (!widget || !panel || !launcher || !closeBtn) return;

  closeBtn.type = 'button';
  closeBtn.style.pointerEvents = 'auto';
  closeBtn.style.touchAction = 'manipulation';
  closeBtn.style.position = 'relative';
  closeBtn.style.zIndex = '4';

  const forceClose = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    panel.classList.remove('active');
    launcher.setAttribute('aria-expanded', 'false');
  };

  // Capture phase protects the close action from transformed cabinet/input layers.
  closeBtn.addEventListener('pointerdown', forceClose, { capture: true });
  closeBtn.addEventListener('click', forceClose, { capture: true });

  const brandMarkup = `<img class="nimo-brand-mark" src="${NIMO_LOGO_PATH}" alt="" width="28" height="28" decoding="async">`;
  const avatar = widget.querySelector('.nimo-avatar');
  if (avatar) {
    avatar.classList.add('nimo-avatar--brand');
    avatar.innerHTML = brandMarkup;
  }

  const launcherIcon = widget.querySelector('.nimo-launcher-icon');
  if (launcherIcon) launcherIcon.innerHTML = brandMarkup;

  if (!document.getElementById('nimo-runtime-brand-styles')) {
    const style = document.createElement('style');
    style.id = 'nimo-runtime-brand-styles';
    style.textContent = `
      .nimo-brand-mark{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(79,70,229,.28))}
      .nimo-avatar--brand{display:grid!important;place-items:center!important;padding:0!important;overflow:visible!important;background:transparent!important;border:0!important}
      .nimo-avatar--brand .nimo-brand-mark{width:34px;height:34px}
      .nimo-launcher-icon{display:grid;place-items:center}
      .nimo-launcher-icon .nimo-brand-mark{width:28px;height:28px}
      #nimo-close-btn{cursor:pointer;isolation:isolate}
      #nimo-close-btn svg{pointer-events:none}
    `;
    document.head.appendChild(style);
  }
}

function hardenArcadeEntry() {
  if (typeof window.enterArcade !== 'function' || window.enterArcade.__nimoArcadeHardened) return;

  const originalEnterArcade = window.enterArcade;
  let entrySettlingUntil = 0;

  const stabilizeCabinetPosition = () => {
    const intro = document.getElementById('intro-sequence');
    if (!intro) return;

    const introTop = intro.getBoundingClientRect().top + window.scrollY;
    const targetY = introTop + window.innerHeight * 0.96;
    const distance = Math.abs(window.scrollY - targetY);

    // Smooth-scroll interruptions were leaving the OS around the close/reopen
    // hysteresis boundary. Snap only when the requested Arcade entry did not land.
    if (distance > Math.max(72, window.innerHeight * 0.12)) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      window.dispatchEvent(new Event('scroll'));
    }
  };

  const hardenedEnterArcade = (...args) => {
    entrySettlingUntil = Date.now() + 2200;
    const result = originalEnterArcade(...args);

    requestAnimationFrame(() => requestAnimationFrame(stabilizeCabinetPosition));
    window.setTimeout(stabilizeCabinetPosition, 700);
    window.setTimeout(stabilizeCabinetPosition, 1500);
    return result;
  };

  hardenedEnterArcade.__nimoArcadeHardened = true;
  window.enterArcade = hardenedEnterArcade;

  const installForceHomeGuard = () => {
    const arcade = window.ArcadeOS;
    if (!arcade || typeof arcade.forceGoHome !== 'function' || arcade.forceGoHome.__entryGuarded) return;

    const originalForceGoHome = arcade.forceGoHome.bind(arcade);
    const guardedForceGoHome = (...args) => {
      const enteringArcade = Date.now() < entrySettlingUntil && document.body.classList.contains('arcade-active');
      if (enteringArcade) return;
      return originalForceGoHome(...args);
    };

    guardedForceGoHome.__entryGuarded = true;
    arcade.forceGoHome = guardedForceGoHome;
  };

  installForceHomeGuard();
  window.setTimeout(installForceHomeGuard, 250);
  window.setTimeout(installForceHomeGuard, 1000);
}