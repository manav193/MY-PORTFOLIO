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
    /* Keep the approved horizontal proportions. The previous 96–98vw override
       made the CRT look side-stretched, so width is restored here. */
    .cabinet-chassis.is-scaled {
      width: 92vw !important;
      max-width: 1500px !important;
      height: min(900px, 92vh) !important;
      max-height: 900px !important;
    }

    /* Extend ONLY the physical cabinet shell downward. The screen, marquee and
       control deck keep their own dimensions; this extra 112px is the lower
       hardware bay behind the service hatch, coin LED and serial text. */
    .cabinet-chassis.is-scaled .cab-front {
      inset: 0 !important;
      width: 100% !important;
      height: calc(100% + 112px) !important;
      min-height: calc(100% + 112px) !important;
      overflow: visible !important;
      background-color: var(--cab-bg) !important;
      border-radius: 32px 32px 14px 14px !important;
      box-sizing: border-box !important;
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

    /* Lower hardware stays in normal flow, fully inside the newly extended
       themed shell. Do not stretch the CRT to create this space. */
    .cabinet-chassis.is-scaled .cab-bottom-details {
      width: 90% !important;
      min-height: 78px !important;
      height: 78px !important;
      flex: 0 0 78px !important;
      margin: 8px auto 0 !important;
      padding: 8px 8px 12px !important;
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

    .cabinet-chassis.is-scaled .cab-service-hatch,
    .cabinet-chassis.is-scaled .cab-coin-door,
    .cabinet-chassis.is-scaled .cab-serial {
      position: relative !important;
      z-index: 25 !important;
    }

    /* The feet/base belong at the new physical bottom, not at the old shell edge. */
    .cabinet-chassis.is-scaled .cabinet-base {
      bottom: -16px !important;
      width: 90% !important;
    }

    .cabinet-chassis.is-scaled .cab-joystick,
    .cabinet-chassis.is-scaled .cab-joy-ball,
    .cabinet-chassis.is-scaled .cab-btn,
    .cabinet-chassis.is-scaled .cab-btn-small {
      clip-path: none !important;
      overflow: visible !important;
    }

    /* Laptop-height screens: preserve width and controls. Shorten only the CRT
       when needed, while the front shell still extends downward by 96px. */
    @media (max-height: 900px) and (min-width: 769px) {
      .cabinet-chassis.is-scaled {
        width: 92vw !important;
        max-width: 1500px !important;
        height: 86vh !important;
        max-height: 780px !important;
      }

      .cabinet-chassis.is-scaled .cab-front {
        height: calc(100% + 96px) !important;
        min-height: calc(100% + 96px) !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
        flex-basis: 430px !important;
        min-height: 430px !important;
        max-height: 430px !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        height: 398px !important;
      }

      .cabinet-chassis.is-scaled .cab-control-deck {
        flex-basis: 96px !important;
        min-height: 96px !important;
        max-height: 96px !important;
      }

      .cabinet-chassis.is-scaled .cab-bottom-details {
        min-height: 72px !important;
        height: 72px !important;
        flex-basis: 72px !important;
      }
    }

    @media (max-width: 1100px) {
      .cabinet-chassis.is-scaled {
        width: 94vw !important;
      }

      .cabinet-chassis.is-scaled .cab-marquee,
      .cabinet-chassis.is-scaled .cabinet-screen-bezel,
      .cabinet-chassis.is-scaled .cab-control-deck,
      .cabinet-chassis.is-scaled .cab-bottom-details {
        width: 92% !important;
      }

      .cabinet-chassis.is-scaled .screen-content-layer {
        left: calc(4% + 16px) !important;
        width: calc(92% - 32px) !important;
      }
    }

    @media (max-width: 768px) {
      .cabinet-chassis.is-scaled {
        width: 96vw !important;
        height: min(700px, 88vh) !important;
      }

      .cabinet-chassis.is-scaled .cab-front {
        height: calc(100% + 72px) !important;
        min-height: calc(100% + 72px) !important;
      }

      .cabinet-chassis.is-scaled .cab-marquee,
      .cabinet-chassis.is-scaled .cabinet-screen-bezel,
      .cabinet-chassis.is-scaled .cab-control-deck,
      .cabinet-chassis.is-scaled .cab-bottom-details {
        width: 92% !important;
      }

      .cabinet-chassis.is-scaled .cabinet-screen-bezel {
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
        flex-basis: 84px !important;
        min-height: 84px !important;
        max-height: 84px !important;
        padding: 0 20px !important;
      }

      .cabinet-chassis.is-scaled .cab-bottom-details {
        min-height: 62px !important;
        height: 62px !important;
        flex-basis: 62px !important;
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
