/**
 * CINEMATIC 3D CABINET INTRO
 * Scroll-driven, defensive, and safe across page lifecycle transitions.
 */

(function () {
  const DESKTOP_CABINET_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
  const isDesktopCabinetAvailable = () => {
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(DESKTOP_CABINET_QUERY).matches;
  };

  const introSequence = document.getElementById('intro-sequence');
  if (!introSequence) return;

  const isMobile = window.matchMedia(
    '(max-width: 767px), (hover: none) and (pointer: coarse)'
  ).matches;

  if (isMobile || !isDesktopCabinetAvailable()) {
    document.documentElement.setAttribute('data-cabinet-enabled', 'false');
    document.body.classList.add('intro-skipped', 'arcade-mobile-disabled');

    introSequence.remove();
    document.getElementById('machine-bg')?.remove();
    document.querySelector('.living-ambient-light')?.remove();

    document.documentElement.style.setProperty(
      '--cabinet-mobile-disabled',
      '1'
    );

    document
      .querySelectorAll('.reveal-up, .reveal-text, .reveal-scale')
      .forEach((element) => {
        element.classList.add('is-visible', 'visible');
        element.style.opacity = '1';
        element.style.transform = 'none';
      });

    return;
  }

  document.documentElement.setAttribute('data-cabinet-enabled', 'true');
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('intro-skipped');
    return;
  }

  const chassis = document.querySelector('.cabinet-chassis');
  const framingRoot = document.querySelector('.cabinet-framing-root');
  const rotateButton = document.querySelector('[data-cabinet-rotate]');

  if (!chassis || !framingRoot) {
    document.body.classList.add('intro-skipped');
    console.warn('[Intro] Cabinet framing root missing; intro safely skipped.');
    return;
  }

  const CABINET_VIEWS = [
    { id: 'front', label: 'front view', x: 0, y: 0 },
    { id: 'right', label: 'right three-quarter view', x: 0, y: 25 },
    { id: 'left', label: 'left three-quarter view', x: 0, y: -25 }
  ];

  const cabinetState = {
    currentView: 'front',
    targetRotX: 0,
    targetRotY: 0,
    isDragging: false,
    isMobileDisabled: false,
    rotX: 0,
    rotY: 0
  };

  let rAF = null;
  let destroyed = false;
  let currentProgress = 0;
  let frameCount = 0;
  let lastTime = performance.now();
  let isLowPerf = false;

  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let manualRotY = 0;
  let currentProgress = 0;

  const glassReflect = document.querySelector('.cab-glass-reflection');
  const joyBall = document.querySelector('.cab-joy-ball');
  const speculars = document.querySelectorAll(
    '.cab-btn-specular, .cab-joy-specular'
  );
  const OS_CLOSE_THRESHOLD = 0.55;
  const OS_REOPEN_THRESHOLD = 0.70;
  const views = [
    { name: 'front', angle: 0 },
    { name: 'right', angle: 32 },
    { name: 'left', angle: -32 }
  ];
  let viewIndex = 0;

  const queueIntroUpdate = () => {
    if (destroyed || document.hidden || rAF !== null) return;
    rAF = requestAnimationFrame(updateIntro);
  };

  rotateButton?.addEventListener('click', () => {
    const currentIndex = CABINET_VIEWS.findIndex(
      (view) => view.id === cabinetState.currentView
    );

    const nextView =
      CABINET_VIEWS[(currentIndex + 1) % CABINET_VIEWS.length];

    cabinetState.currentView = nextView.id;
    cabinetState.targetRotX = nextView.x;
    cabinetState.targetRotY = nextView.y;
    manualRotY = nextView.y;

    rotateButton.dataset.view = nextView.id;
    rotateButton.setAttribute(
      'aria-pressed',
      String(nextView.id !== 'front')
    );
    rotateButton.setAttribute(
      'aria-label',
      nextView.id === 'front'
        ? 'Rotate arcade cabinet'
        : `Cabinet ${nextView.label}. Press to rotate again`
    );

    queueIntroUpdate();
  });

  const releasePointerSafely = (pointerId) => {
    if (pointerId == null) return;

    try {
      if (chassis.hasPointerCapture?.(pointerId)) {
        chassis.releasePointerCapture(pointerId);
      }
    } catch (_) {
      // Pointer capture may already have been released.
    }
  };

  chassis.addEventListener('pointerdown', (event) => {
    if (!chassis.classList.contains('is-scaled')) return;

    if (
      event.target.closest(
        '.screen-2d-anchor, .cab-control-deck, .cab-bottom-details, ' +
        '.cab-oled-display, .cab-power-btn, .cab-marquee, ' +
        '.cab-power-led, .cabinet-rotate-control'
      )
    ) {
      return;
    }

    cabinetState.isDragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;

    try {
      chassis.setPointerCapture(event.pointerId);
    } catch (_) {
      // Pointer capture is optional.
    }

    queueIntroUpdate();
  });

  chassis.addEventListener('pointermove', (event) => {
    if (
      !cabinetState.isDragging ||
      event.pointerId !== activePointerId
    ) {
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    cabinetState.targetRotY = Math.max(
      -38,
      Math.min(38, cabinetState.targetRotY + deltaX * 0.08)
    );

    cabinetState.targetRotX = Math.max(
      -6,
      Math.min(6, cabinetState.targetRotX - deltaY * 0.08)
    );

    manualRotY = cabinetState.targetRotY;
    cabinetState.currentView = 'custom';

    if (rotateButton) {
      rotateButton.dataset.view = 'custom';
      rotateButton.setAttribute('aria-pressed', 'true');
      rotateButton.setAttribute(
        'aria-label',
        'Cabinet custom view. Press to rotate to the next preset view'
      );
    }

    startX = event.clientX;
    startY = event.clientY;

    queueIntroUpdate();
  });

  const stopDrag = (event) => {
    if (!cabinetState.isDragging) return;

    releasePointerSafely(event.pointerId ?? activePointerId);

    cabinetState.isDragging = false;
    activePointerId = null;

    queueIntroUpdate();
  };

  const updateHardwareHighlights = () => {
    const normalizedRotX = cabinetState.rotX / 25;
    const normalizedRotY = cabinetState.rotY / 25;

    if (glassReflect) {
      glassReflect.style.transform =
        `translateX(${normalizedRotY * -15}%)`;

      glassReflect.style.opacity = String(
        Math.max(
          0,
          (1 - Math.abs(normalizedRotY * 0.5)) * 0.15
        )
      );
    }

    if (joyBall) {
      joyBall.style.transform =
        `translate(${normalizedRotY * 3}px, ` +
        `${normalizedRotX * 3}px)`;
    }

    speculars.forEach((specular) => {
      specular.style.transform =
        `translate(calc(-50% + ${normalizedRotY * 4}px), ` +
        `${normalizedRotX * 2}px)`;
    });
  };

  const writeRotationVars = () => {
    framingRoot.style.setProperty('--cab-rot-x', `${cabinetState.targetRotX}deg`);
    framingRoot.style.setProperty('--cab-rot-y', `${cabinetState.targetRotY}deg`);
  };

  const applyCabinetView = (view, animate = true) => {
    cabinetState.currentView = view.id;
    cabinetState.targetRotX = view.x;
    cabinetState.targetRotY = view.y;
    chassis.dataset.cabinetView = view.id;

    if (rotateButton) {
      rotateButton.setAttribute('aria-label', `Rotate arcade cabinet view, currently ${view.label}`);
      rotateButton.dataset.cabinetView = view.id;
    }

    cabinetState.rotX = view.x;
    cabinetState.rotY = view.y;
    writeRotationVars();
    updateHardwareHighlights();

    if (animate) queueIntroUpdate();
  };

  rotateButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const currentIndex = CABINET_VIEWS.findIndex((view) => view.id === cabinetState.currentView);
    const nextView = CABINET_VIEWS[(currentIndex + 1) % CABINET_VIEWS.length];
    applyCabinetView(nextView);
  });

  chassis.addEventListener('dblclick', (event) => {
    if (event.target.closest('.screen-2d-anchor, .cab-control-deck, .cab-bottom-details, .cab-oled-display, .cab-power-btn, .cab-marquee, .cab-power-led, [data-cabinet-rotate]')) return;
    applyCabinetView(CABINET_VIEWS[0]);
  });

  document.querySelectorAll('[data-intro-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.introAction === 'enter') {
        if (typeof window.enterArcade === 'function') window.enterArcade();
        else window.scrollTo({ top: window.innerHeight * 0.96, behavior: 'smooth' });
      } else if (button.dataset.introAction === 'work') {
        if (typeof window.exitArcadeToPortfolio === 'function') window.exitArcadeToPortfolio('work');
        else document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (typeof window.exitArcadeToPortfolio === 'function') window.exitArcadeToPortfolio();
        else document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  function updateIntro(time) {
    rAF = null;
    if (destroyed || !chassis.isConnected || !introSequence.isConnected) return;

    frameCount += 1;
    if (frameCount % 10 === 0 && !isLowPerf) {
      const delta = time - lastTime;
      if (Number.isFinite(delta) && delta > 300) {
        chassis.style.boxShadow = 'none';
        isLowPerf = true;
      }
      lastTime = time;
    }

    const introRect = introSequence.getBoundingClientRect();
    if (introRect.bottom <= 0) {
      chassis.classList.remove('is-scaled');
      const experience = window.ArcadeExperience;
      const state = experience?.getState?.();
      if (experience && state !== 'PORTFOLIO' && state !== 'ARCADE_EXITING') experience.exitArcadeExperience?.('scroll');
      return;
    }

    const maxScroll = Math.max(window.innerHeight, 1);
    const rawProgress = window.scrollY / maxScroll;
    const targetProgress = Number.isFinite(rawProgress) ? Math.min(1, Math.max(0, rawProgress)) : 0;
    currentProgress += (targetProgress - currentProgress) * 0.15;
    if (!Number.isFinite(currentProgress)) currentProgress = targetProgress;
    const safeProgress = Math.min(1, Math.max(0, currentProgress));

    if (safeProgress > 0.05) chassis.classList.add('is-scaled');
    else if (window.ArcadeExperience?.getState?.() === 'PORTFOLIO') chassis.classList.remove('is-scaled');

    if (targetProgress >= 0.40) window.ArcadeBootController?.prewarm?.();

    const experience = window.ArcadeExperience;
    if (experience?.getState) {
      const state = experience.getState();
      if (targetProgress >= OS_REOPEN_THRESHOLD && state === 'PORTFOLIO') experience.enterArcadeExperience?.('scroll');
      else if (targetProgress <= OS_CLOSE_THRESHOLD && state !== 'PORTFOLIO' && state !== 'ARCADE_EXITING') experience.exitArcadeExperience?.('scroll');
    }

    chassis.style.transform = 'translateZ(0)';
    chassis.style.opacity = '1';
    chassis.style.pointerEvents = 'auto';

    writeRotationVars();

    if (safeProgress > 0.05 && !isLowPerf) {
      if (!cabinetState.isDragging) {
        cabinetState.targetRotY +=
          (manualRotY - cabinetState.targetRotY) * 0.1;

        cabinetState.targetRotX +=
          (0 - cabinetState.targetRotX) * 0.08;
      }

      cabinetState.rotX +=
        (cabinetState.targetRotX - cabinetState.rotX) * 0.12;

      cabinetState.rotY +=
        (cabinetState.targetRotY - cabinetState.rotY) * 0.12;

      if (cabVolume) {
        cabVolume.style.setProperty(
          '--cab-rot-x',
          `${cabinetState.rotX}deg`
        );

        cabVolume.style.setProperty(
          '--cab-rot-y',
          `${cabinetState.rotY}deg`
        );
      }

      updateHardwareHighlights();
    } else {
      cabinetState.targetRotX = 0;
      cabinetState.targetRotY = manualRotY;

      cabinetState.rotX +=
        (0 - cabinetState.rotX) * 0.1;

      cabinetState.rotY +=
        (manualRotY - cabinetState.rotY) * 0.1;

      if (cabVolume) {
        cabVolume.style.setProperty(
          '--cab-rot-x',
          `${cabinetState.rotX}deg`
        );

        cabVolume.style.setProperty(
          '--cab-rot-y',
          `${cabinetState.rotY}deg`
        );
      }

      updateHardwareHighlights();
    }

    const progressSettled =
      Math.abs(targetProgress - currentProgress) < 0.001;

    const rotationSettled =
      Math.abs(
        cabinetState.rotX - cabinetState.targetRotX
      ) < 0.01 &&
      Math.abs(
        cabinetState.rotY - cabinetState.targetRotY
      ) < 0.01;

    if (
      cabinetState.isDragging ||
      !progressSettled ||
      !rotationSettled
    ) {
      queueIntroUpdate();
    }

  window.addEventListener('scroll', queueIntroUpdate, { passive: true });
  window.addEventListener('resize', queueIntroUpdate, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) queueIntroUpdate();
  });
  window.addEventListener('pageshow', queueIntroUpdate);
  window.addEventListener('pagehide', () => {
    destroyed = true;
    if (rAF !== null) {
      cancelAnimationFrame(rAF);
      rAF = null;
    }
  }, { once: true });

  applyCabinetView(CABINET_VIEWS[0], false);
  queueIntroUpdate();
})();