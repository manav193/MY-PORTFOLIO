const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function bindOnce(el, key) {
  if (el.dataset[key] === 'true') return false;
  el.dataset[key] = 'true';
  return true;
}

export function initTilt() {
  if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const tiltElements = document.querySelectorAll('[data-tilt-text]');

  tiltElements.forEach(el => {
    if (!bindOnce(el, 'tiltBound')) return;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = yPct * -5;
      const rotateY = xPct * 5;
      el.style.transform = `perspective(1200px) translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1200px) translateY(0) rotateX(0deg) rotateY(0deg)';
    });
  });
}

export function initMagnetic() {
  if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const magneticElements = document.querySelectorAll('[data-magnetic]');

  magneticElements.forEach(el => {
    if (!bindOnce(el, 'magneticBound')) return;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0px, 0px)';
    });
  });
}

export function initParallax() {
  if (reduceMotion) return;
  const items = document.querySelectorAll('[data-parallax]');
  if (!items.length) return;

  const update = () => {
    const offset = window.scrollY;
    items.forEach((item) => {
      const strength = Number(item.dataset.parallax || 0);
      item.style.translate = `0 ${offset * strength}px`;
    });
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}