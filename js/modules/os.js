export function initOS() {
  // 1. THEME ENGINE 2.0
  const themeBtns = document.querySelectorAll('.theme-btn');
  if (themeBtns.length > 0) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark-graphite';
    
    // Set active button
    document.querySelector(`.theme-btn[data-theme-id="${currentTheme}"]`)?.classList.add('active');

    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.getAttribute('data-theme-id');
        
        // Update DOM
        document.documentElement.setAttribute('data-theme', themeId);
        
        // Persist
        localStorage.setItem('premium-theme', themeId);
        
        // Update UI
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // 2. BOOT SEQUENCE
  const loader = document.querySelector('[data-loader]');
  if (loader) {
    if (!sessionStorage.getItem('booted')) {
      setTimeout(() => {
        loader.classList.add('is-hidden');
        setTimeout(() => loader.remove(), 500);
        sessionStorage.setItem('booted', 'true');
      }, 1200);
    } else {
      loader.remove(); // Instantly remove if already booted
    }
  }

  // 3. MAGNETIC CURSOR
  const cursorDot = document.querySelector('[data-cursor-dot]');
  const cursorRing = document.querySelector('[data-cursor-ring]');
  if (cursorDot && cursorRing) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let isHovering = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      
      // Living Interface Telemetry
      document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
      
      const target = e.target;
      const isInteractable = target.closest('a, button, input, textarea, .cmd-item, .theme-btn, [data-magnetic]');
      
      if (isInteractable && !isHovering) {
        document.body.classList.add('cursor-hover');
        isHovering = true;
      } else if (!isInteractable && isHovering) {
        document.body.classList.remove('cursor-hover');
        isHovering = false;
      }
    });

    const loop = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // 4. COMMAND PALETTE (Ctrl+K or Cmd+K)
  const backdrop = document.querySelector('[data-cmd-backdrop]');
  const input = document.getElementById('cmd-input');
  
  if (backdrop && input) {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        backdrop.classList.add('active');
        input.focus();
      }
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        backdrop.classList.remove('active');
      }
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });

    // Old Theme Toggle removed in favor of Dock
  }

  // 5. KONAMI CODE (Easter Egg)
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === konami[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konami.length) {
        alert("ACCESS GRANTED: You found the developer easter egg. This portfolio was handcrafted with 100% Vanilla JS.");
        document.documentElement.style.setProperty('--aurora-1', '#ff00ff'); 
        document.documentElement.style.setProperty('--aurora-2', '#00ffff'); 
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  // 6. LIVE TIME HUD
  const timeEl = document.getElementById('live-time');
  if (timeEl) {
    setInterval(() => {
      timeEl.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    }, 1000);
  }

  // 7. DYNAMIC NAV & LIVING SCROLL TELEMETRY
  const nav = document.getElementById('main-nav');
  let lastScrollY = window.scrollY;
  let scrollSpeed = 0;
  
  if (nav) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      
      // Calculate momentum
      scrollSpeed = Math.abs(currentScroll - lastScrollY);
      const normalizedSpeed = Math.min(scrollSpeed / 10, 2); // Cap at 2
      document.documentElement.style.setProperty('--scroll-momentum', normalizedSpeed);
      
      // Reset momentum shortly after scroll stops
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => {
        document.documentElement.style.setProperty('--scroll-momentum', '0');
      }, 50);

      lastScrollY = currentScroll;

      if (currentScroll > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // 8. CINEMATIC SCROLL REVEAL
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-up, .reveal-scale').forEach(el => {
    revealObserver.observe(el);
  });
}
