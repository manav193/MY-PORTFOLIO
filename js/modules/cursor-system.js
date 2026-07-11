const finePointer = window.matchMedia("(pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactViewport = window.matchMedia("(max-width: 1024px)").matches;

export function initCursorSystem() {
  const dot = document.querySelector("[data-cursor-dot]");
  const ring = document.querySelector("[data-cursor-ring]");

  if (!dot || !ring) return;

  window.setCursorMode = setCursorMode;

  if (!finePointer || compactViewport || reduceMotion) {
    dot.remove();
    ring.remove();
    document.body.removeAttribute("data-cursor-mode");
    document.body.classList.remove("cursor-hover", "cursor-pressed");
    return;
  }

  document.body.dataset.cursorMode = "portfolio";

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let ringX = pointerX;
  let ringY = pointerY;
  let rafId = 0;

  const updateHoverState = (target) => {
    const isInteractable = Boolean(target.closest("a, button, input, textarea, .cmd-item, .theme-btn, [data-magnetic], .dock-item, .app-card, .cab-btn, .cab-btn-small"));
    document.body.classList.toggle("cursor-hover", isInteractable);
  };

  const render = () => {
    const lag = document.body.dataset.cursorMode === "arcade" ? 0.75 : 0.28;
    ringX += (pointerX - ringX) * lag;
    ringY += (pointerY - ringY) * lag;

    dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(render);
  };

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.documentElement.style.setProperty("--mouse-x", `${pointerX}px`);
    document.documentElement.style.setProperty("--mouse-y", `${pointerY}px`);
    updateHoverState(event.target);
  }, { passive: true });

  window.addEventListener("pointerdown", () => document.body.classList.add("cursor-pressed"), { passive: true });
  window.addEventListener("pointerup", () => document.body.classList.remove("cursor-pressed"), { passive: true });
  window.addEventListener("pointerleave", () => document.body.classList.remove("cursor-hover", "cursor-pressed"));

  rafId = requestAnimationFrame(render);
  window.addEventListener("pagehide", () => cancelAnimationFrame(rafId), { once: true });
}

export function setCursorMode(mode) {
  if (!finePointer || compactViewport || reduceMotion) return;
  document.body.dataset.cursorMode = mode === "arcade" ? "arcade" : "portfolio";
  document.body.classList.remove("cursor-hover", "cursor-pressed");
}
