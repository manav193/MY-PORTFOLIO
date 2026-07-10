/**
 * CINEMATIC 3D CABINET INTRO (STATE FIX)
 * Pure scroll-driven mechanics. No artificial state locks.
 */

(function() {
  const introSequence = document.getElementById('intro-sequence');
  if (!introSequence) return;

  // 1. FORCE SCROLL RESTORATION TO TOP
  // This prevents the browser from jumping past the intro on refresh.
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }

  // 2. ACCESSIBILITY OVERRIDE
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('intro-skipped');
    return;
  }

  const chassis = document.querySelector('.cabinet-chassis');
  let rAF;
  
  // Interactive Hardware Nodes
  const glassReflect = document.querySelector('.cab-glass-reflection');
  const joyBall = document.querySelector('.cab-joy-ball');
  const speculars = document.querySelectorAll('.cab-btn-specular, .cab-joy-specular');

  // Mouse State
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = (e.clientX - cx) / cx; // -1 to 1
    targetY = (e.clientY - cy) / cy; // -1 to 1
  }, { passive: true });

  // Performance Monitoring
  let frameCount = 0;
  let lastTime = performance.now();
  let isLowPerf = false;

  // 3. PURE SCRUBBABLE SCROLL MAPPING
  const updateIntro = (time) => {
    // Monitor FPS
    frameCount++;
    if (frameCount % 10 === 0 && !isLowPerf) {
      const delta = time - lastTime;
      if (delta > 300) { 
        chassis.style.boxShadow = 'none';
        isLowPerf = true;
      }
      lastTime = time;
    }

    const scrollY = window.scrollY;
    // Track height is 200vh. The sticky container takes 100vh. 
    // We have exactly 100vh (window.innerHeight) to map our progress.
    const maxScroll = window.innerHeight * 1.0; 
    let progress = Math.min(scrollY / maxScroll, 1);
    
    // Add physical corners if we've started moving
    if (progress > 0.05) {
      chassis.classList.add('is-scaled');
    } else {
      chassis.classList.remove('is-scaled');
    }

    // Mathematical Timeline
    let scale = 1;
    let rotateX = 0;
    let opacity = 1;

    if (progress <= 0.7) {
      // PHASE 1: Shrink & Tilt (0% -> 70% of scroll)
      const p1 = progress / 0.7; // normalized 0 to 1
      const ease = 1 - Math.pow(1 - p1, 3); // ease-out cubic
      
      scale = 1 - (ease * 0.3);      // 1.0 -> 0.7
      rotateX = ease * 12;           // 0deg -> 12deg
      opacity = 1;
    } else {
      // PHASE 2: Cinematic Fly-Through (70% -> 100% of scroll)
      const p2 = (progress - 0.7) / 0.3; // normalized 0 to 1
      const ease = p2 * p2; // ease-in quadratic (accelerate fast)
      
      scale = 0.7 + (ease * 4.3);    // 0.7 -> 5.0
      rotateX = 12 - (ease * 12);    // 12deg -> 0deg
      opacity = 1 - (ease * 1.5);    // 1.0 -> 0 (fades out slightly before end)
      if (opacity < 0) opacity = 0;
    }

    // Apply strict pure math state
    chassis.style.transform = `scale(${scale}) rotateX(${rotateX}deg)`;
    chassis.style.opacity = opacity;
    
    // Disable pointer events if invisible so the real website below is clickable
    chassis.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';

    // 4. MOUSE HARDWARE PARALLAX (Only when scaled)
    if (progress > 0.1 && !isLowPerf) {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      // Glass sweeps across screen
      if (glassReflect) {
        glassReflect.style.transform = `translateX(${currentX * -15}%)`;
        glassReflect.style.opacity = 1 - Math.abs(currentX * 0.5);
      }

      // Joystick subtle lean
      if (joyBall) {
        joyBall.style.transform = `translate(${currentX * 3}px, ${currentY * 3}px)`;
      }

      // Specular highlights shift on convex buttons
      speculars.forEach(spec => {
        spec.style.transform = `translate(calc(-50% + ${currentX * 4}px), ${currentY * 2}px)`;
      });
    }

    rAF = requestAnimationFrame(updateIntro);
  };

  // Start loop
  rAF = requestAnimationFrame(updateIntro);

  // If user unloads the page, scroll to 0 to be double sure
  window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
  });

})();
