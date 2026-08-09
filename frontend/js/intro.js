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
    document.querySelector('.living-ambient-light')?.remove();
    document.documentElement.style.setProperty('--cabinet-mobile-disabled', '1');
    document.querySelectorAll('.reveal-up, .reveal-text, .reveal-scale').forEach((element) => {
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
  const cabinetVolume = document.querySelector('.cab-3d-volume');
  const screenLayer = document.querySelector('.screen-content-layer');
  const controlDeck = document.querySelector('.cab-control-deck');
  const rotateButton = document.querySelector('[data-cabinet-rotate]');

  if (!chassis || !framingRoot || !cabinetVolume || !screenLayer || !controlDeck) {
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
  let framingMetrics = null;
  let framingMetricsDirty = true;
  let frameCount = 0;
  let lastTime = performance.now();
  let isLowPerf = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;

  const glassReflect = document.querySelector('.cab-glass-reflection');
  const joyBall = document.querySelector('.cab-joy-ball');
  const speculars = document.querySelectorAll('.cab-btn-specular, .cab-joy-specular');

  const OS_CLOSE_THRESHOLD = 0.55;
  const OS_REOPEN_THRESHOLD = 0.70;

  const queueIntroUpdate = () => {
    if (destroyed || document.hidden || rAF !== null) return;
    rAF = requestAnimationFrame(updateIntro);
  };

  const updateHardwareHighlights = () => {
    const normalizedRotX = cabinetState.rotX / 25;
    const normalizedRotY = cabinetState.rotY / 25;

    if (glassReflect) {
      glassReflect.style.transform = `translateX(${normalizedRotY * -15}%)`;
      glassReflect.style.opacity = String((1 - Math.abs(normalizedRotY * 0.5)) * 0.15);
    }

    if (joyBall) {
      joyBall.style.transform = `translate(${normalizedRotY * 3}px, ${normalizedRotX * 3}px)`;
    }

    speculars.forEach((specular) => {
      specular.style.transform = `translate(calc(-50% + ${normalizedRotY * 4}px), ${normalizedRotX * 2}px)`;
    });
  };

  const writeRotationVars = () => {
    cabinetVolume.style.setProperty('--cab-rot-x', `${cabinetState.targetRotX}deg`);
    cabinetVolume.style.setProperty('--cab-rot-y', `${cabinetState.targetRotY}deg`);
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;

  const setFrame = (scale, x, y) => {
    framingRoot.style.setProperty('--frame-scale', String(scale));
    framingRoot.style.setProperty('--frame-x', `${x}px`);
    framingRoot.style.setProperty('--frame-y', `${y}px`);
  };

  const measureFraming = () => {
    // Keep all measurements in the physical cabinet's neutral coordinate system.
    setFrame(1, 0, 0);
    const rootBox = framingRoot.getBoundingClientRect();
    const screenBox = screenLayer.getBoundingClientRect();
    const deckBox = controlDeck.getBoundingClientRect();
    const navBox = document.querySelector('.showroom-nav')?.getBoundingClientRect();
    const dockBox = document.querySelector('.os-dock')?.getBoundingClientRect();

    const targetLeft = Math.min(screenBox.left, deckBox.left);
    const targetRight = Math.max(screenBox.right, deckBox.right);
    const targetTop = Math.min(screenBox.top, deckBox.top);
    const targetBottom = Math.max(screenBox.bottom, deckBox.bottom);
    const targetWidth = Math.max(targetRight - targetLeft, 1);
    const targetHeight = Math.max(targetBottom - targetTop, 1);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeLeftRight = viewportWidth < 1280 ? 72 : 160;
    const safeTop = Math.max((navBox?.bottom || 0) + 20, 36);
    const safeBottom = Math.min((dockBox?.top || viewportHeight) - 24, viewportHeight - 32);
    const availableWidth = Math.max(viewportWidth - safeLeftRight * 2, 1);
    const availableHeight = Math.max(safeBottom - safeTop, 1);
    const rootCenterX = rootBox.left + rootBox.width / 2;
    const rootCenterY = rootBox.top + rootBox.height / 2;
    const targetCenterX = (targetLeft + targetRight) / 2;
    const targetCenterY = (targetTop + targetBottom) / 2;
    const safeCenterY = safeTop + availableHeight / 2;
    const closeScale = clamp(Math.min(availableWidth / targetWidth, availableHeight / targetHeight), 0.92, 1.16);
    const fullScale = clamp(Math.min(availableWidth / rootBox.width, availableHeight / rootBox.height, 0.9), 0.66, 0.9);

    framingMetrics = {
      closeScale,
      fullScale,
      closeX: viewportWidth / 2 - (rootCenterX + (targetCenterX - rootCenterX) * closeScale),
      closeY: safeCenterY - (rootCenterY + (targetCenterY - rootCenterY) * closeScale),
      fullX: viewportWidth / 2 - rootCenterX,
      fullY: safeCenterY - rootCenterY
    };
    framingMetricsDirty = false;
  };

  const applyFraming = (progress) => {
    if (framingMetricsDirty || !framingMetrics) measureFraming();
    const amount = clamp(progress, 0, 1);
    setFrame(
      lerp(framingMetrics.closeScale, framingMetrics.fullScale, amount),
      lerp(framingMetrics.closeX, framingMetrics.fullX, amount),
      lerp(framingMetrics.closeY, framingMetrics.fullY, amount)
    );
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

  const releasePointerCapture = (pointerId) => {
    if (pointerId == null) return;
    try {
      if (chassis.hasPointerCapture?.(pointerId)) chassis.releasePointerCapture(pointerId);
    } catch (_) {
      // Pointer capture may already have been released by the browser.
    }
  };

  chassis.addEventListener('pointerdown', (event) => {
    if (!chassis.classList.contains('is-scaled')) return;
    if (event.target.closest('.screen-2d-anchor, .cab-control-deck, .cab-bottom-details, .cab-oled-display, .cab-power-btn, .cab-marquee, .cab-power-led, [data-cabinet-rotate]')) return;

    cabinetState.isDragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    try {
      chassis.setPointerCapture(event.pointerId);
    } catch (_) {
      // Pointer capture is optional for cabinet drag input.
    }
  });

  chassis.addEventListener('pointermove', (event) => {
    if (!cabinetState.isDragging || event.pointerId !== activePointerId) return;

    cabinetState.targetRotY = clamp(cabinetState.targetRotY + (event.clientX - startX) * 0.08, -38, 38);
    cabinetState.targetRotX = clamp(cabinetState.targetRotX - (event.clientY - startY) * 0.08, -6, 6);
    cabinetState.rotX = cabinetState.targetRotX;
    cabinetState.rotY = cabinetState.targetRotY;
    cabinetState.currentView = 'custom';
    startX = event.clientX;
    startY = event.clientY;
    writeRotationVars();
    updateHardwareHighlights();
  });

  const stopDragging = (event) => {
    if (!cabinetState.isDragging) return;
    releasePointerCapture(event.pointerId ?? activePointerId);
    cabinetState.isDragging = false;
    activePointerId = null;
  };

  chassis.addEventListener('pointerup', stopDragging);
  chassis.addEventListener('pointercancel', stopDragging);
  chassis.addEventListener('lostpointercapture', stopDragging);

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
      if (experience && state !== 'PORTFOLIO' && state !== 'ARCADE_EXITING') {
        experience.exitArcadeExperience?.('scroll');
      }
      return;
    }

    const maxScroll = Math.max(window.innerHeight, 1);
    const rawProgress = window.scrollY / maxScroll;
    const targetProgress = Number.isFinite(rawProgress)
      ? Math.min(1, Math.max(0, rawProgress))
      : 0;

    currentProgress += (targetProgress - currentProgress) * 0.15;
    if (!Number.isFinite(currentProgress)) currentProgress = targetProgress;

    const safeProgress = Math.min(1, Math.max(0, currentProgress));

    if (safeProgress > 0.05) {
      chassis.classList.add('is-scaled');
    } else if (window.ArcadeExperience?.getState?.() === 'PORTFOLIO') {
      chassis.classList.remove('is-scaled');
    }

    if (targetProgress >= 0.40) {
      window.ArcadeBootController?.prewarm?.();
    }

    const experience = window.ArcadeExperience;
    if (experience?.getState) {
      const state = experience.getState();
      if (targetProgress >= OS_REOPEN_THRESHOLD && state === 'PORTFOLIO') {
        experience.enterArcadeExperience?.('scroll');
      } else if (targetProgress <= OS_CLOSE_THRESHOLD && state !== 'PORTFOLIO' && state !== 'ARCADE_EXITING') {
        experience.exitArcadeExperience?.('scroll');
      }
    }

    chassis.style.opacity = '1';
    chassis.style.pointerEvents = 'auto';

    writeRotationVars();
    applyFraming(safeProgress);

    if (safeProgress > 0.05 && !isLowPerf) {
      updateHardwareHighlights();
    }

    const progressSettled = Math.abs(targetProgress - currentProgress) < 0.001;

    if (!progressSettled) queueIntroUpdate();
  }

  window.addEventListener('scroll', queueIntroUpdate, { passive: true });
  window.addEventListener('resize', () => {
    framingMetricsDirty = true;
    queueIntroUpdate();
  }, { passive: true });
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
