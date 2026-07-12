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
  const cabVolume = document.querySelector('.cab-3d-volume');
  let rAF;
  
  // Interactive Hardware Nodes
  const glassReflect = document.querySelector('.cab-glass-reflection');
  const joyBall = document.querySelector('.cab-joy-ball');
  const speculars = document.querySelectorAll('.cab-btn-specular, .cab-joy-specular');

  // Performance Monitoring
  let frameCount = 0;
  let lastTime = performance.now();
  let isLowPerf = false;

  // 3D Rotation State
  let isDragging = false;
  let startX = 0, startY = 0;
  let rotX = 0, rotY = 0;
  let targetRotX = 0, targetRotY = 0;
  let velX = 0, velY = 0;
  let lastIdleTime = performance.now();
  let hasBootedOS = false;
  let currentProgress = 0; // SINGLE SOURCE OF TRUTH
  let osVisible = false;   // Track OS visibility for hysteresis
  
  // Hysteresis thresholds for OS lifecycle
  const OS_CLOSE_THRESHOLD = 0.55;   // Below this: suspend OS, destroy active apps
  const OS_HIDE_THRESHOLD = 0.25;    // Below this: hide OS layer entirely
  const OS_REOPEN_THRESHOLD = 0.70;  // Above this: allow OS to reopen

  if (chassis) {
    chassis.addEventListener('pointerdown', (e) => {
      // Only allow drag if cabinet is in scaled/compact state
      if (!chassis.classList.contains('is-scaled')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      chassis.setPointerCapture(e.pointerId);
      velX = 0; 
      velY = 0;
      lastIdleTime = performance.now();
    });

    chassis.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Map delta to rotation (reduced sensitivity)
      targetRotY += deltaX * 0.08;
      targetRotX -= deltaY * 0.08;
      
      // Strict premium limits
      targetRotY = Math.max(-8, Math.min(8, targetRotY));
      targetRotX = Math.max(-5, Math.min(5, targetRotX));
      
      startX = e.clientX;
      startY = e.clientY;
      lastIdleTime = performance.now();
    });

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      chassis.releasePointerCapture(e.pointerId);
    };

    chassis.addEventListener('pointerup', stopDrag);
    chassis.addEventListener('pointercancel', stopDrag);
  }

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
    
    // Skip heavy DOM updates and style manipulation when the cabinet is completely off-screen
    if (scrollY > window.innerHeight * 2.0) {
      rAF = requestAnimationFrame(updateIntro);
      return;
    }
    
    // Track height is 200vh. The sticky container takes 100vh. 
    // We have exactly 100vh (window.innerHeight) to map our progress.
    const maxScroll = window.innerHeight * 1.0;
    
    // clamp progress strictly between 0 and 1 with safety fallback
    const rawProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    const targetProgress = Number.isFinite(rawProgress) ? Math.min(1, Math.max(0, rawProgress)) : 0;
    
    // Smooth absolute progress mapping (works dynamically in both directions)
    currentProgress += (targetProgress - currentProgress) * 0.15;
    
    // SAFE SINGLE SOURCE OF TRUTH (0 to 1)
    const safeProgress = Number.isFinite(currentProgress) ? Math.min(1, Math.max(0, currentProgress)) : 0;
    
    // Add physical corners if we've started moving
    if (safeProgress > 0.05) {
      chassis.classList.add('is-scaled');
      
      // Ensure ArcadeOS and apps are fully loaded before booting to prevent race conditions
      if (!hasBootedOS && window.ArcadeOS && window.ArcadeRegistry && window.ArcadeRegistry.getAll().length > 0) {
        hasBootedOS = true;
        window.ArcadeOS.boot();
        osVisible = true;
      }
    } else {
      chassis.classList.remove('is-scaled');
    }
    
    // ===== OS LIFECYCLE SYNCHRONIZATION (HYSTERESIS) =====
    if (hasBootedOS && window.ArcadeOS) {
      const osLayer = document.getElementById('arcade-os');
      const bootLoader = document.querySelector('.boot-loader');
      
      if (osVisible) {
        // Check if we should suspend the OS
        if (safeProgress < OS_CLOSE_THRESHOLD) {
          // Destroy any active app and return to HOME
          if (window.ArcadeOS.state === 'APP' || window.ArcadeOS.state === 'LOADING') {
            window.ArcadeOS.forceGoHome();
          }
          
          // Hide the OS layer with a fade
          if (osLayer) {
            osLayer.style.transition = 'opacity 0.3s ease';
            osLayer.style.opacity = '0';
          }
          
          // Show boot loader again
          if (bootLoader) {
            bootLoader.classList.remove('is-hidden');
          }
          
          osVisible = false;
        }
      } else {
        // Check if we should reopen the OS
        if (safeProgress > OS_REOPEN_THRESHOLD) {
          // Show OS layer
          if (osLayer) {
            osLayer.style.transition = 'opacity 0.3s ease';
            osLayer.style.opacity = '1';
          }
          
          // Hide boot loader
          if (bootLoader) {
            bootLoader.classList.add('is-hidden');
          }
          
          // Ensure OS is in HOME state
          if (window.ArcadeOS.state !== 'HOME') {
            window.ArcadeOS.state = 'HOME';
            const homeView = document.getElementById('arcade-home');
            const appView = document.getElementById('arcade-app-view');
            const loadingView = document.getElementById('arcade-loading');
            if (homeView) homeView.classList.add('active');
            if (appView) { appView.classList.remove('active'); appView.innerHTML = ''; }
            if (loadingView) loadingView.classList.remove('active');
            window.ArcadeOS.renderHome();
          }
          
          osVisible = true;
        }
      }
    }

    // Mathematical Timeline from single source of truth
    // scale smoothly transitions from 1.0 down to 0.75 across the entire safeProgress
    const ease = 1 - Math.pow(1 - safeProgress, 3); // ease-out cubic
    
    let scale = 1 - (ease * 0.25);     // 1.0 -> 0.75
    // Safety clamp for scale to prevent invisible/NaN values
    scale = Number.isFinite(scale) ? Math.max(0.5, scale) : 1.0;
    
    let opacity = 1;
    const rotateX = 0;

    // Apply strict pure math state safely via raw transform string (chassis is dedicated to scale/opacity)
    chassis.style.transform = `scale(${scale}) translateZ(0) rotateX(${rotateX}deg)`;
    chassis.style.opacity = opacity;
    
    // Disable pointer events if invisible so the real website below is clickable
    chassis.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';

    // 4. MOUSE HARDWARE PARALLAX & 3D ROTATION (Only when scaled)
    if (safeProgress > 0.05 && !isLowPerf) {
      
      // Handle premium spring behavior when not dragging
      if (!isDragging) {
        if (time - lastIdleTime > 3000 && !prefersReducedMotion) {
          // Idle floating motion
          const idleTime = (time - lastIdleTime - 3000) * 0.001; // seconds
          targetRotY = Math.sin(idleTime) * 1.5;
          targetRotX = Math.cos(idleTime * 0.8) * 1.0;
        } else {
          // Smooth spring back to perfect center
          targetRotY += (0 - targetRotY) * 0.08;
          targetRotX += (0 - targetRotX) * 0.08;
        }
      }

      // Smooth interpolation for fluid rendering
      rotX += (targetRotX - rotX) * 0.12;
      rotY += (targetRotY - rotY) * 0.12;

      // Apply to 3D Volume
      if (cabVolume) {
        cabVolume.style.setProperty('--cab-rot-x', `${rotX}deg`);
        cabVolume.style.setProperty('--cab-rot-y', `${rotY}deg`);
      }

      // Hardware parallax (keep perfectly rectangular feel while preserving internal depth)
      const normalizedRotX = rotX / 5; // -1 to 1
      const normalizedRotY = rotY / 8; // -1 to 1

      // Glass sweeps across screen based on Y rotation
      if (glassReflect) {
        glassReflect.style.transform = `translateX(${normalizedRotY * -15}%)`;
        glassReflect.style.opacity = (1 - Math.abs(normalizedRotY * 0.5)) * 0.15;
      }

      // Joystick subtle lean
      if (joyBall) {
        joyBall.style.transform = `translate(${normalizedRotY * 3}px, ${normalizedRotX * 3}px)`;
      }

      // Specular highlights shift on convex buttons
      speculars.forEach(spec => {
        spec.style.transform = `translate(calc(-50% + ${normalizedRotY * 4}px), ${normalizedRotX * 2}px)`;
      });
    } else {
      // Reset rotation when returning to full screen
      targetRotX = 0; targetRotY = 0;
      rotX += (0 - rotX) * 0.1;
      rotY += (0 - rotY) * 0.1;
      if (cabVolume) {
        cabVolume.style.setProperty('--cab-rot-x', `${rotX}deg`);
        cabVolume.style.setProperty('--cab-rot-y', `${rotY}deg`);
      }
      lastIdleTime = time;
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
