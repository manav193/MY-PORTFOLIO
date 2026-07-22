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
    /* Large immersive CRT + guaranteed physical control deck. */
    .cabinet-chassis.is-scaled {
      width: 92vw !important;
      max-width: 1500px !important;
      height: min(900px, 94vh) !important;
      max-height: 920px !important;
    }

    .cabinet-chassis.is-scaled .cab-marquee {
      width: 90% !important;
      flex: 0 0 50px !important;
    }

    .cabinet-chassis.is-scaled .cabinet-screen-bezel {
      width: 90% !important;
      flex: 0 0 520px !important;
      min-height: 520px !important;
      max-height: 520px !important;
      margin: 10px auto 0 !important;
    }

    /* Grow the actual render surface with the bezel instead of stretching it. */
    .cabinet-chassis.is-scaled .screen-content-layer {
      top: 96px !important;
      left: calc(5% + 16px) !important;
      width: calc(90% - 32px) !important;
      height: 488px !important;
    }

    .cabinet-chassis.is-scaled .cab-control-deck {
      display: flex !important;
      flex: 0 0 95px !important;
      min-height: 95px !important;
      max-height: 95px !important;
      width: 90% !important;
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
      width: 90% !important;
      flex: 0 0 auto !important;
      margin-top: auto !important;
      margin-bottom: 8px !important;
    }

    @media (max-width: 1100px) {
      .cabinet-chassis.is-scaled {
        width: 94vw !important;
        height: min(820px, 93vh) !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        width: 90% !important;
        flex-basis: 470px !important;
        min-height: 470px !important;
        max-height: 470px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        left: calc(5% + 16px) !important;
        width: calc(90% - 32px) !important;
        height: 438px !important;
      }
    }

    @media (max-width: 768px) {
      .cabinet-chassis.is-scaled {
        width: 96vw !important;
        height: min(680px, 92vh) !important;
      }

      .cabinet-chassis.is-scaled .cab-marquee {
        width: 92% !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        width: 92% !important;
        flex-basis: 330px !important;
        min-height: 330px !important;
        max-height: 330px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        top: 90px !important;
        left: calc(4% + 16px) !important;
        width: calc(92% - 32px) !important;
        height: 298px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        width: 92% !important;
        flex-basis: 78px !important;
        min-height: 78px !important;
        max-height: 78px !important;
        padding: 0 20px !important;
      }

      .cabinet-chassis.is-scaled .cab-bottom-details {
        width: 92% !important;
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
