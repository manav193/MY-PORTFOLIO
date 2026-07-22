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
    /* Large immersive CRT + a fully visible physical control deck. */
    .cabinet-chassis.is-scaled {
      width: 92vw !important;
      max-width: 1500px !important;
      height: min(940px, 96vh) !important;
      max-height: 940px !important;
    }

    /* Extend the themed front shell downward instead of clipping the joystick/buttons. */
    .cabinet-chassis.is-scaled .cab-front {
      height: calc(100% + 78px) !important;
      bottom: auto !important;
      overflow: visible !important;
      background-color: var(--cab-bg) !important;
      border-radius: 32px 32px 14px 14px !important;
    }

    .cabinet-chassis.is-scaled .cab-marquee {
      width: 90% !important;
      flex: 0 0 50px !important;
    }

    .cabinet-chassis.is-scaled .cabinet-screen-bezel {
      width: 90% !important;
      flex: 0 0 500px !important;
      min-height: 500px !important;
      max-height: 500px !important;
      margin: 10px auto 0 !important;
    }

    /* Grow the actual render surface with the bezel; never scale/squash the UI. */
    .cabinet-chassis.is-scaled .screen-content-layer {
      top: 96px !important;
      left: calc(5% + 16px) !important;
      width: calc(90% - 32px) !important;
      height: 468px !important;
    }

    .cabinet-chassis.is-scaled .cab-control-deck {
      display: flex !important;
      flex: 0 0 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;
      width: 90% !important;
      margin: 10px auto 0 !important;
      padding: 0 40px !important;
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

    /* Keep the lower themed cabinet body in normal flow, below the complete deck. */
    .cabinet-chassis.is-scaled .cab-bottom-details {
      width: 90% !important;
      min-height: 72px !important;
      height: 72px !important;
      flex: 0 0 72px !important;
      margin: 8px auto 0 !important;
      padding: 8px 0 6px !important;
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

    /* Ensure hardware itself can never be cropped by a parent introduced by themes. */
    .cabinet-chassis.is-scaled .cab-joystick,
    .cabinet-chassis.is-scaled .cab-joy-ball,
    .cabinet-chassis.is-scaled .cab-btn,
    .cabinet-chassis.is-scaled .cab-btn-small {
      clip-path: none !important;
      overflow: visible !important;
    }

    @media (max-width: 1100px) {
      .cabinet-chassis.is-scaled {
        width: 94vw !important;
        height: min(860px, 95vh) !important;
      }

      .cabinet-chassis.is-scaled .cab-front {
        height: calc(100% + 64px) !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        width: 90% !important;
        flex-basis: 450px !important;
        min-height: 450px !important;
        max-height: 450px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        left: calc(5% + 16px) !important;
        width: calc(90% - 32px) !important;
        height: 418px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        flex-basis: 102px !important;
        min-height: 102px !important;
        max-height: 102px !important;
      }
    }

    @media (max-width: 768px) {
      .cabinet-chassis.is-scaled {
        width: 96vw !important;
        height: min(720px, 94vh) !important;
      }

      .cabinet-chassis.is-scaled .cab-front {
        height: calc(100% + 52px) !important;
      }

      .cabinet-chassis.is-scaled .cab-marquee {
        width: 92% !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        width: 92% !important;
        flex-basis: 320px !important;
        min-height: 320px !important;
        max-height: 320px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        top: 90px !important;
        left: calc(4% + 16px) !important;
        width: calc(92% - 32px) !important;
        height: 288px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        width: 92% !important;
        flex-basis: 84px !important;
        min-height: 84px !important;
        max-height: 84px !important;
        padding: 0 20px !important;
      }

      .cabinet-chassis.is-scaled .cab-bottom-details {
        width: 92% !important;
        min-height: 54px !important;
        height: 54px !important;
        flex-basis: 54px !important;
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
