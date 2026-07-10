/**
 * SIGNATURE MOTION LANGUAGE SYSTEM
 * Handles intersection observers, parallax depth, and background velocity synchronization.
 * GPU-Accelerated. No layout recalculations.
 */

(function() {
  // 1. REVEAL ANIMATIONS (Spring Physics & Momentum)
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };

  const motionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Trigger the animation by adding the 'is-visible' class
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Initialize Elements
  document.querySelectorAll('.reveal-up, .reveal-scale, .cs-section-title, .cs-split-visual, .cs-glass-panel').forEach((el, index) => {
    // Add base classes if not present for project pages
    if(!el.classList.contains('reveal-up') && !el.classList.contains('reveal-scale')) {
      el.classList.add('reveal-up');
    }
    
    // Add staggered delays for grids based on DOM index
    if (el.classList.contains('cs-glass-panel')) {
      el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    }
    
    motionObserver.observe(el);
  });

  // 2. DEPTH PARALLAX SYSTEM
  // Foreground, Content, Glass, Background moving at slightly different speeds
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateParallax = () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    
    // Calculate scrolling velocity for the machine background
    // Velocity is higher when scrolling fast.
    const scrollVelocity = Math.abs(scrollDelta);
    
    // Synchronize background motion with scroll speed. Slow down while reading.
    const machineBg = document.querySelector('.mb-svg');
    if (machineBg) {
      // Get the existing rotation/translation from machine-bg.js logic
      // We broadcast the velocity to a CSS variable to affect spin speed
      const speedMultiplier = 1 + (scrollVelocity * 0.05);
      document.body.style.setProperty('--scroll-velocity', speedMultiplier);
    }

    // Parallax layers
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible) {
        // Subtle vertical shift relative to viewport
        const yOffset = (rect.top - window.innerHeight / 2) * 0.05;
        el.style.transform = `translate3d(0, ${yOffset}px, 0) scale(1)`;
      }
    });

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // 3. MICRO MOTION (Hover Physics)
  // Buttons and Links use spring physics tactile feedback
  document.querySelectorAll('.btn-primary, .btn-secondary, .nav-link, .editorial-card').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.02) translateY(-2px)';
      btn.style.transition = 'transform 0.4s var(--motion-spring)';
    });
    
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'scale(0.95)';
      btn.style.transition = 'transform 0.1s ease-out';
    });
    
    btn.addEventListener('mouseup', () => {
      btn.style.transform = 'scale(1.02) translateY(-2px)';
      btn.style.transition = 'transform 0.5s var(--motion-spring)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1) translateY(0)';
      btn.style.transition = 'transform 0.6s var(--motion-momentum)';
    });
  });

})();
