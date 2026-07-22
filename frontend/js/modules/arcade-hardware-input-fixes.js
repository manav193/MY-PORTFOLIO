/**
 * Arcade hardware/input stabilization.
 * Keeps the enlarged CRT layout while guaranteeing the physical control deck
 * remains visible and reconnecting the existing shared gamepad polling loop
 * whenever ArcadeOS becomes active.
 */

export function initArcadeHardwareInputFixes() {
  installCabinetLayoutFix();
  installGamepadLifecycleFix();
}

function installCabinetLayoutFix() {
  if (document.getElementById('arcade-hardware-layout-fix')) return;

  const style = document.createElement('style');
  style.id = 'arcade-hardware-layout-fix';
  style.textContent = `
    /* Keep the large CRT, but reserve real physical space for the control deck. */
    .cabinet-chassis.is-scaled {
      height: min(820px, 92vh) !important;
      max-height: 840px !important;
    }

    .cabinet-chassis.is-scaled .cab-marquee {
      flex: 0 0 50px !important;
    }

    .cabinet-chassis.is-scaled .cabinet-screen-bezel {
      flex: 0 0 440px !important;
      min-height: 440px !important;
      max-height: 440px !important;
    }

    .cabinet-chassis.is-scaled .cab-control-deck {
      display: flex !important;
      flex: 0 0 95px !important;
      min-height: 95px !important;
      max-height: 95px !important;
      width: 86% !important;
      margin: 10px auto 0 !important;
      padding: 0 36px !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      position: relative !important;
      z-index: 40 !important;
      transform: none !important;
    }

    .cabinet-chassis.is-scaled .cab-deck-left,
    .cabinet-chassis.is-scaled .cab-deck-right,
    .cabinet-chassis.is-scaled #cab-joystick,
    .cabinet-chassis.is-scaled .cab-btn-grid,
    .cabinet-chassis.is-scaled .cab-utility-group {
      display: flex;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .cabinet-chassis.is-scaled .cab-btn-grid {
      display: grid !important;
    }

    .cabinet-chassis.is-scaled .cab-bottom-details {
      flex: 0 0 auto !important;
      margin-top: auto !important;
      margin-bottom: 8px !important;
    }

    @media (max-width: 768px) {
      .cabinet-chassis.is-scaled {
        height: min(640px, 90vh) !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        flex-basis: 300px !important;
        min-height: 300px !important;
        max-height: 300px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        height: 268px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        flex-basis: 78px !important;
        min-height: 78px !important;
        max-height: 78px !important;
        padding: 0 20px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function installGamepadLifecycleFix() {
  let retryTimer = null;

  const ensurePolling = () => {
    const input = window.ArcadeInput;
    const os = window.ArcadeOS;
    const chassis = document.querySelector('.cabinet-chassis');
    if (!input?.initialized || typeof input.getConnectedGamepads !== 'function') return;

    const arcadeActive = Boolean(
      os?.osVisible ||
      chassis?.classList.contains('is-scaled') ||
      window.__TEST_MODE__
    );
    if (!arcadeActive) return;

    const pads = input.getConnectedGamepads();
    if (pads.length && !input.gamepadRafId) {
      input.startGamepadPolling();
    }
  };

  const scheduleEnsure = () => {
    window.clearTimeout(retryTimer);
    ensurePolling();
    retryTimer = window.setTimeout(ensurePolling, 120);
  };

  window.addEventListener('gamepadconnected', scheduleEnsure);
  window.addEventListener('focus', scheduleEnsure);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleEnsure();
  });

  // Browsers can expose an already-connected controller before the listener is attached.
  window.setTimeout(scheduleEnsure, 0);
  window.setTimeout(scheduleEnsure, 400);
  window.setTimeout(scheduleEnsure, 1200);

  const attachChassisObserver = () => {
    const chassis = document.querySelector('.cabinet-chassis');
    if (!chassis) {
      window.setTimeout(attachChassisObserver, 100);
      return;
    }
    const observer = new MutationObserver(scheduleEnsure);
    observer.observe(chassis, { attributes: true, attributeFilter: ['class'] });
  };
  attachChassisObserver();

  // First user interaction is another reliable point where Gamepad API state becomes available.
  const onFirstInteraction = () => scheduleEnsure();
  window.addEventListener('pointerdown', onFirstInteraction, { once: true, capture: true });
  window.addEventListener('keydown', onFirstInteraction, { once: true, capture: true });
}
