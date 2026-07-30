/**
 * CINEMATIC 3D CABINET INTRO
 * Scroll-driven, defensive, and safe across page lifecycle transitions.
 */

(function () {
  const introSequence = document.getElementById('intro-sequence');
  if (!introSequence) return;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('intro-skipped');
    return;
  }

  const chassis = document.querySelector('.cabinet-chassis');
  const cabVolume = document.querySelector('.cab-3d-volume');

  // The intro markup may be omitted or replaced on non-home builds. Never let
  // a missing cabinet node crash the rest of the portfolio boot sequence.
  if (!chassis) {
    document.body.classList.add('intro-skipped');
    console.warn('[Intro] Cabinet chassis missing; intro safely skipped.');
    return;
  }

  let rAF = null;
  let destroyed = false;

  const glassReflect = document.querySelector('.cab-glass-reflection');
  const joyBall = document.querySelector('.cab-joy-ball');
  const speculars = document.querySelectorAll('.cab-btn-specular, .cab-joy-specular');

  let frameCount = 0;
  let lastTime = performance.now();
  let isLowPerf = false;

  let isDragging = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let rotX = 0;
  let rotY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let currentProgress = 0;

  const OS_CLOSE_THRESHOLD = 0.55;
  const OS_REOPEN_THRESHOLD = 0.70;

  const queueIntroUpdate = () => {
    if (destroyed || document.hidden || rAF !== null) return;
    rAF = requestAnimationFrame(updateIntro);
  };

  const releasePointerSafely = (pointerId) => {
    if (pointerId == null) return;
    try {
      if (chassis.hasPointerCapture?.(pointerId)) {
        chassis.releasePointerCapture(pointerId);
      }
    } catch (_) {
      // Pointer capture can already be released by the browser during
      // navigation, visibility changes, or interrupted touch gestures.
    }
  };

  chassis.addEventListener('pointerdown', (event) => {
    if (!chassis.classList.contains('is-scaled')) return;
    if (event.target.closest('.screen-2d-anchor, .cab-control-deck, .cab-bottom-details, .cab-oled-display, .cab-power-btn, .cab-marquee, .cab-power-led')) return;

    isDragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;

    try {
      chassis.setPointerCapture(event.pointerId);
    } catch (_) {
      // Some embedded/mobile browsers reject capture during lifecycle changes.
    }

    queueIntroUpdate();
  });

  chassis.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    targetRotY = Math.max(-8, Math.min(8, targetRotY + deltaX * 0.08));
    targetRotX = Math.max(-5, Math.min(5, targetRotX - deltaY * 0.08));

    startX = event.clientX;
    startY = event.clientY;
    queueIntroUpdate();
  });

  const stopDrag = (event) => {
    if (!isDragging) return;
    releasePointerSafely(event.pointerId ?? activePointerId);
    isDragging = false;
    activePointerId = null;
    queueIntroUpdate();
  };

  chassis.addEventListener('pointerup', stopDrag);
  chassis.addEventListener('pointercancel', stopDrag);
  chassis.addEventListener('lostpointercapture', () => {
    isDragging = false;
    activePointerId = null;
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

    chassis.style.transform = 'scale(1) translateZ(0) rotateX(0deg)';
    chassis.style.opacity = '1';
    chassis.style.pointerEvents = 'auto';

    if (safeProgress > 0.05 && !isLowPerf) {
      if (!isDragging) {
        targetRotY += (0 - targetRotY) * 0.08;
        targetRotX += (0 - targetRotX) * 0.08;
      }

      rotX += (targetRotX - rotX) * 0.12;
      rotY += (targetRotY - rotY) * 0.12;

      if (cabVolume) {
        cabVolume.style.setProperty('--cab-rot-x', `${rotX}deg`);
        cabVolume.style.setProperty('--cab-rot-y', `${rotY}deg`);
      }

      const normalizedRotX = rotX / 5;
      const normalizedRotY = rotY / 8;

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
    } else {
      targetRotX = 0;
      targetRotY = 0;
      rotX += (0 - rotX) * 0.1;
      rotY += (0 - rotY) * 0.1;

      if (cabVolume) {
        cabVolume.style.setProperty('--cab-rot-x', `${rotX}deg`);
        cabVolume.style.setProperty('--cab-rot-y', `${rotY}deg`);
      }
    }

    const progressSettled = Math.abs(targetProgress - currentProgress) < 0.001;
    const rotationSettled = Math.abs(rotX) < 0.01
      && Math.abs(rotY) < 0.01
      && Math.abs(targetRotX) < 0.01
      && Math.abs(targetRotY) < 0.01;

    if (isDragging || !progressSettled || !rotationSettled) queueIntroUpdate();
  }

  window.addEventListener('scroll', queueIntroUpdate, { passive: true });
  window.addEventListener('resize', queueIntroUpdate, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) queueIntroUpdate();
  });

  // bfcache restores should refresh visual state without forcing a disruptive
  // scroll jump during unload/navigation.
  window.addEventListener('pageshow', queueIntroUpdate);
  window.addEventListener('pagehide', () => {
    destroyed = true;
    releasePointerSafely(activePointerId);
    if (rAF !== null) {
      cancelAnimationFrame(rAF);
      rAF = null;
    }
  }, { once: true });

  queueIntroUpdate();
})();
