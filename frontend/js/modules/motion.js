const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


export function initTilt() {
  const tiltElements = document.querySelectorAll('[data-tilt]');
  
  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPct = x / rect.width - 0.5;
      const yPct = y / rect.height - 0.5;
      
      const rotateX = yPct * -15; // Max 15deg tilt
      const rotateY = xPct * 15;
      
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });
  });
}

export function initMagnetic() {
  const magneticElements = document.querySelectorAll('[data-magnetic]');
  
  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Update background radial gradient position for hover glow
      el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = `translate(0px, 0px)`;
    });
  });
}

export function initParallax() {
  if (reduceMotion) return;
  const items = document.querySelectorAll("[data-parallax]");
  if (!items.length) return;

  const update = () => {
    const offset = window.scrollY;
    items.forEach((item) => {
      const strength = Number(item.dataset.parallax || 0);
      item.style.translate = `0 ${offset * strength}px`;
    });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}
