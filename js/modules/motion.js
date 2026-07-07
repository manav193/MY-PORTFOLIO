const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initCursor() {
  const cursor = document.querySelector("[data-cursor]");
  if (!cursor || reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

  window.addEventListener("pointermove", (event) => {
    cursor.style.opacity = "1";
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    cursor.style.opacity = "0";
  });
}

export function initMagnetic() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll(".magnetic").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

export function initTilt() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg) translateZ(0)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
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
