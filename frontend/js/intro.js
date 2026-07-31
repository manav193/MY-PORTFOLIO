/**
 * CINEMATIC 3D CABINET INTRO
 * Scroll-driven, defensive, and safe across page lifecycle transitions.
 */

(function () {
  const introSequence = document.getElementById('intro-sequence');
  if (!introSequence) return;

  const isMobile = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
  if (isMobile) {
    document.body.classList.add('intro-skipped', 'arcade-mobile-disabled');
    introSequence.remove();
    document.getElementById('machine-bg')?.remove();
    document.querySelector('.living-ambient-light')?.remove();
    document.documentElement.style.setProperty('--cabinet-mobile-disabled', '1');
    document.querySelectorAll('.reveal-up, .reveal-text, .reveal-scale').forEach((element) => {
      element.classList.add('is-visible', 'visible');
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
    return;
  }

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

  if (!chassis) {
    document.body.classList.add('intro-skipped');
    console.warn('[Intro] Cabinet chassis missing; intro safely skipped.');
    return;
  }

  const showroom = document.querySelector('.outer-center-wrapper');
  const style = document.createElement('style');
  style.textContent = `
    .cabinet-rotate-control{position:absolute;right:clamp(20px,4vw,72px);top:50%;translate:0 -50%;z-index:40;display:grid;place-items:center;gap:7px;width:82px;height:82px;border:1px solid rgba(125,211,252,.5);border-radius:50%;background:linear-gradient(145deg,rgba(10,15,27,.92),rgba(24,17,44,.9));box-shadow:0 18px 50px rgba(0,0,0,.55),inset 0 0 0 4px rgba(56,189,248,.07),0 0 26px rgba(124,58,237,.2);color:#f8fafc;font:600 11px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;pointer-events:auto;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
    .cabinet-rotate-control:hover{transform:scale(1.06);border-color:#a78bfa;box-shadow:0 20px 55px rgba(0,0,0,.65),0 0 34px rgba(124,58,237,.38)}
    .cabinet-rotate-control:focus-visible{outline:3px solid #38bdf8;outline-offset:5px}
    .cabinet-rotate-control svg{width:27px;height:27px;display:block}
    .cabinet-rotate-control[data-view="right"] svg{transform:rotate(22deg)}
    .cabinet-rotate-control[data-view="left"] svg{transform:rotate(-22deg)}
    .cabinet-chassis{max-width:min(760px,72vw);max-height:88vh;aspect-ratio:4/5}
    .cab-3d-volume{--cab-rot-x:0deg;--cab-rot-y:0deg}
    @media(max-width:1100px){.cabinet-rotate-control{right:18px;width:70px;height:70px}.cabinet-chassis{max-width:75vw}}
    @media(max-width:767px),(hover:none) and (pointer:coarse){#intro-sequence,.cabinet-rotate-control,#machine-bg,.living-ambient-light{display:none!important}.system-architecture{display:block!important;visibility:visible!important;opacity:1!important}}
  `;
  document.head.appendChild(style);

  const rotateButton = document.createElement('button');
  rotateButton.type = 'button';
  rotateButton.className = 'cabinet-rotate-control';
  rotateButton.dataset.view = 'front';
  rotateButton.setAttribute('aria-label', 'Rotate arcade cabinet');
  rotateButton.setAttribute('aria-pressed', 'false');
  rotateButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9A7 7 0 0 1 18.4 6.6L20 9"/><path d="M17.9 15A7 7 0 0 1 5.6 17.4L4 15"/></svg><span>Rotate</span>';
  showroom?.appendChild(rotateButton);

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
  let manualRotY = 0;
  let currentProgress = 0;

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

  rotateButton.addEventListener('click', () => {
    viewIndex = (viewIndex + 1) % views.length;
    const view = views[viewIndex];
    manualRotY = view.angle;
    targetRotY = manualRotY;
    targetRotX = 0;
    rotateButton.dataset.view = view.name;
    rotateButton.setAttribute('aria-pressed', String(view.name !== 'front'));
    rotateButton.setAttribute('aria-label', view.name === 'front' ? 'Rotate arcade cabinet' : `Cabinet ${view.name} view. Press to rotate again`);
    queueIntroUpdate();
  });

  const releasePointerSafely = (pointerId) => {
    if (pointerId == null) return;
    try {
      if (chassis.hasPointerCapture?.(pointerId)) chassis.releasePointerCapture(pointerId);
    } catch (_) {}
  };

  chassis.addEventListener('pointerdown', (event) => {
    if (!chassis.classList.contains('is-scaled')) return;
    if (event.target.closest('.screen-2d-anchor, .cab-control-deck, .cab-bottom-details, .cab-oled-display, .cab-power-btn, .cab-marquee, .cab-power-led, .cabinet-rotate-control')) return;
    isDragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    try { chassis.setPointerCapture(event.pointerId); } catch (_) {}
    queueIntroUpdate();
  });

  chassis.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    targetRotY = Math.max(-38, Math.min(38, targetRotY + deltaX * 0.08));
    targetRotX = Math.max(-6, Math.min(6, targetRotX - deltaY * 0.08));
    manualRotY = targetRotY;
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

    chassis.style.transform = 'scale(1) translateZ(0) rotateX(0deg)';
    chassis.style.opacity = '1';
    chassis.style.pointerEvents = 'auto';

    if (safeProgress > 0.05 && !isLowPerf) {
      if (!isDragging) {
        targetRotY += (manualRotY - targetRotY) * 0.1;
        targetRotX += (0 - targetRotX) * 0.08;
      }
      rotX += (targetRotX - rotX) * 0.12;
      rotY += (targetRotY - rotY) * 0.12;
      if (cabVolume) {
        cabVolume.style.setProperty('--cab-rot-x', `${rotX}deg`);
        cabVolume.style.setProperty('--cab-rot-y', `${rotY}deg`);
      }
      const normalizedRotX = rotX / 6;
      const normalizedRotY = rotY / 38;
      if (glassReflect) {
        glassReflect.style.transform = `translateX(${normalizedRotY * -15}%)`;
        glassReflect.style.opacity = String((1 - Math.abs(normalizedRotY * 0.5)) * 0.15);
      }
      if (joyBall) joyBall.style.transform = `translate(${normalizedRotY * 3}px, ${normalizedRotX * 3}px)`;
      speculars.forEach((specular) => {
        specular.style.transform = `translate(calc(-50% + ${normalizedRotY * 4}px), ${normalizedRotX * 2}px)`;
      });
    } else {
      targetRotX = 0;
      targetRotY = manualRotY;
      rotX += (0 - rotX) * 0.1;
      rotY += (manualRotY - rotY) * 0.1;
      if (cabVolume) {
        cabVolume.style.setProperty('--cab-rot-x', `${rotX}deg`);
        cabVolume.style.setProperty('--cab-rot-y', `${rotY}deg`);
      }
    }

    const progressSettled = Math.abs(targetProgress - currentProgress) < 0.001;
    const rotationSettled = Math.abs(rotX - targetRotX) < 0.01 && Math.abs(rotY - targetRotY) < 0.01;
    if (isDragging || !progressSettled || !rotationSettled) queueIntroUpdate();
  }

  window.addEventListener('scroll', queueIntroUpdate, { passive: true });
  window.addEventListener('resize', queueIntroUpdate, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queueIntroUpdate(); });
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