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
    /* Larger premium cabinet/background with the complete hardware kept visible. */
    .cabinet-chassis.is-scaled {
      width: 96vw !important;
      max-width: 1660px !important;
      height: min(940px, 94vh) !important;
      max-height: 940px !important;
    }

    .cabinet-chassis.is-scaled .cab-front {
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: visible !important;
      background-color: var(--cab-bg) !important;
      border-radius: 32px 32px 14px 14px !important;
    }

    .cabinet-chassis.is-scaled .cab-marquee {
      width: 93% !important;
      flex: 0 0 50px !important;
    }

    .cabinet-chassis.is-scaled .cabinet-screen-bezel {
      width: 93% !important;
      flex: 0 0 520px !important;
      min-height: 520px !important;
      max-height: 520px !important;
      margin: 10px auto 0 !important;
    }

    /* Grow the real render surface with the bezel; never scale/squash the UI. */
    .cabinet-chassis.is-scaled .screen-content-layer {
      top: 96px !important;
      left: calc(3.5% + 16px) !important;
      width: calc(93% - 32px) !important;
      height: 488px !important;
    }

    .cabinet-chassis.is-scaled .cab-control-deck {
      display: flex !important;
      flex: 0 0 112px !important;
      min-height: 112px !important;
      max-height: 112px !important;
      width: 93% !important;
      margin: 10px auto 0 !important;
      padding: 0 44px !important;
      opacity: 1 !important;
      visibility: visible !important;
      overflow: visible !important;
      pointer-events: auto !important;
      position: relative !important;
      z-index: 50 !important;
      transform: none !important;
      align-self: center !important;
      flex-shrink: 0 !important;
    }

    .cabinet-chassis.is-scaled .cab-deck-left,
    .cabinet-chassis.is-scaled .cab-deck-right,
    .cabinet-chassis.is-scaled #cab-joystick,
    .cabinet-chassis.is-scaled .cab-btn-grid,
    .cabinet-chassis.is-scaled .cab-utility-group {
      opacity: 1 !important;
      visibility: visible !important;
      flex-shrink: 0 !important;
    }

    .cabinet-chassis.is-scaled .cab-deck-left,
    .cabinet-chassis.is-scaled .cab-deck-right,
    .cabinet-chassis.is-scaled #cab-joystick,
    .cabinet-chassis.is-scaled .cab-utility-group {
      display: flex !important;
    }

    .cabinet-chassis.is-scaled .cab-btn-grid {
      display: grid !important;
    }

    .cabinet-chassis.is-scaled .cab-bottom-details {
      width: 93% !important;
      min-height: 60px !important;
      height: 60px !important;
      flex: 0 0 60px !important;
      margin: 6px auto 0 !important;
      padding: 5px 0 4px !important;
      box-sizing: border-box !important;
      background: transparent !important;
      align-items: flex-end !important;
      position: relative !important;
      z-index: 20 !important;
      overflow: visible !important;
    }

    .cabinet-chassis.is-scaled .cab-bottom-details::before {
      content: none !important;
    }

    .cabinet-chassis.is-scaled .cab-joystick,
    .cabinet-chassis.is-scaled .cab-joy-ball,
    .cabinet-chassis.is-scaled .cab-btn,
    .cabinet-chassis.is-scaled .cab-btn-small {
      clip-path: none !important;
      overflow: visible !important;
    }

    /* Laptop-height screens: enlarge the cabinet background, but shorten only
       the CRT enough to guarantee the complete physical deck remains visible. */
    @media (max-height: 900px) and (min-width: 769px) {
      .cabinet-chassis.is-scaled {
        width: 96vw !important;
        max-width: 1660px !important;
        height: 92vh !important;
        max-height: 830px !important;
      }

      .cabinet-chassis.is-scaled .cab-marquee,
      .cabinet-chassis.is-scaled .cabinet-screen-bezel,
      .cabinet-chassis.is-scaled .cab-control-deck,
      .cabinet-chassis.is-scaled .cab-bottom-details {
        width: 93% !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        flex-basis: 445px !important;
        min-height: 445px !important;
        max-height: 445px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        left: calc(3.5% + 16px) !important;
        width: calc(93% - 32px) !important;
        height: 413px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        flex-basis: 100px !important;
        min-height: 100px !important;
        max-height: 100px !important;
      }

      .cabinet-chassis.is-scaled .cab-bottom-details {
        min-height: 50px !important;
        height: 50px !important;
        flex-basis: 50px !important;
      }
    }

    @media (max-width: 1100px) {
      .cabinet-chassis.is-scaled {
        width: 97vw !important;
      }
    }

    @media (max-width: 768px) {
      .cabinet-chassis.is-scaled {
        width: 98vw !important;
        height: min(740px, 92vh) !important;
      }

      .cabinet-chassis.is-scaled .cab-marquee,
      .cabinet-chassis.is-scaled .cabinet-screen-bezel,
      .cabinet-chassis.is-scaled .cab-control-deck,
      .cabinet-chassis.is-scaled .cab-bottom-details {
        width: 94% !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        flex-basis: 330px !important;
        min-height: 330px !important;
        max-height: 330px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        top: 90px !important;
        left: calc(3% + 16px) !important;
        width: calc(94% - 32px) !important;
        height: 298px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        flex-basis: 86px !important;
        min-height: 86px !important;
        max-height: 86px !important;
        padding: 0 20px !important;
      }

      .cabinet-chassis.is-scaled .cab-bottom-details {
        min-height: 46px !important;
        height: 46px !important;
        flex-basis: 46px !important;
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

  const onFirstInteraction = () => scheduleEnsure();
  window.addEventListener('pointerdown', onFirstInteraction, { once: true, capture: true });
  window.addEventListener('keydown', onFirstInteraction, { once: true, capture: true });
}
