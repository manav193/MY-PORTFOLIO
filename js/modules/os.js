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

        // Update OLED Status Display on the Cabinet
        const oledThemeText = document.getElementById('oled-theme-text');
        if (oledThemeText) {
          const themeNameMap = {
            'dark-graphite': 'MOD: GRAPHITE',
            'light-apple': 'MOD: ALUMINUM',
            'aurora-violet': 'MOD: IRIDESCENT',
            'forest-premium': 'MOD: ALLOY',
            'sunset-copper': 'MOD: COPPER',
            'midnight-sapphire': 'MOD: TITANIUM'
          };
          oledThemeText.textContent = themeNameMap[themeId] || 'MOD: CUSTOM';
        }
      });
    });
  }

  // 2. BOOT SEQUENCE & OLED STATUS
  const loader = document.querySelector('[data-loader]');
  const oledStatus = document.querySelector('.oled-status');
  
  if (loader) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        if (!loader.classList.contains('is-hidden')) {
          loader.classList.add('is-hidden');
          if (oledStatus) oledStatus.textContent = 'SYS: ONLINE';
          sessionStorage.setItem('booted', 'true');
        }
      } else {
        if (loader.classList.contains('is-hidden')) {
          loader.classList.remove('is-hidden');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    if (!sessionStorage.getItem('booted')) {
      if (oledStatus && window.scrollY <= 50) {
        oledStatus.textContent = 'SYS: BOOTING';
        setTimeout(() => {
          if (oledStatus.textContent === 'SYS: BOOTING') {
            oledStatus.textContent = 'SYS: ONLINE';
          }
        }, 2000);
      }
    } else {
      if (oledStatus) oledStatus.textContent = 'SYS: ONLINE';
      // Bypass animations if already booted
      const bootLines = loader.querySelectorAll('.boot-line');
      bootLines.forEach(line => {
        line.style.animation = 'none';
        line.style.opacity = '1';
      });
    }
  }

  // 3. Cursor handling now lives in modules/cursor-system.js.

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

    if (nav) {
      if (currentScroll > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }, { passive: true });

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

  // 9. CHAMBER TRANSITIONS (Cinematic Narrative Flow)
  document.querySelectorAll('a[href^="project-"], a[href="index.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
      // Allow new tabs to function normally
      if (e.ctrlKey || e.metaKey || link.target === "_blank") return;
      
      e.preventDefault();
      const target = link.getAttribute('href');
      
      // Simulate diving deeper into the machine
      document.body.style.transition = 'opacity 0.6s var(--motion-momentum)';
      document.body.style.opacity = '0';
      
      const chamberElements = document.querySelectorAll('main, footer, #intro-sequence, .project-hero, .cs-container');
      chamberElements.forEach(el => {
        el.style.transition = 'transform 0.6s var(--motion-momentum)';
        el.style.transform = 'scale(0.97)';
      });
      
      setTimeout(() => {
        window.location.href = target;
      }, 550);
    });
  });

  // 10. LIVING SYSTEM HEARTBEAT (Asynchronous Polish)
  // The machine occasionally communicates tiny, unnoticeable states.
  const livingOledStatus = document.querySelector('.oled-status');
  const livingStates = ['SYS: ONLINE', 'SYS: SYNCED', 'SYS: READY', 'SYS: IDLE', 'SYS: KERNEL', 'SYS: ACTIVE'];
  
  setInterval(() => {
    // 8% chance to update OLED status every 3 seconds (avg ~40 seconds)
    if (livingOledStatus && Math.random() < 0.08) {
      const randomState = livingStates[Math.floor(Math.random() * livingStates.length)];
      if (livingOledStatus.textContent !== randomState) {
        livingOledStatus.style.opacity = '0.4';
        setTimeout(() => {
          livingOledStatus.textContent = randomState;
          livingOledStatus.style.opacity = '1';
        }, 150);
      }
    }
  }, 3000);

  // 11. Dock routing now lives in modules/dock-controller.js.
  // Keep this module focused on theme, cursor, command palette, reveals, and OS polish.
}
