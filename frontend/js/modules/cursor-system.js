const finePointer = window.matchMedia("(pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactViewport = window.matchMedia("(max-width: 1024px)").matches;

let cursorSystemInitialized = false;

function ensureGlobalPointerGlow() {
  let glow = document.querySelector("[data-global-pointer-glow]");
  if (!glow) {
    glow = document.createElement("div");
    glow.className = "living-ambient-light global-pointer-glow";
    glow.setAttribute("data-global-pointer-glow", "");
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
  }

  if (!document.getElementById("global-pointer-glow-styles")) {
    const style = document.createElement("style");
    style.id = "global-pointer-glow-styles";
    style.textContent = `
      .global-pointer-glow {
        position: fixed;
        inset: 0;
        z-index: 9997;
        pointer-events: none;
        opacity: 0;
        mix-blend-mode: screen;
        background:
          radial-gradient(
            460px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh),
            var(--color-glow, rgba(110, 169, 149, 0.16)) 0%,
            rgba(var(--highlight-rgb, 232, 240, 235), 0.045) 28%,
            transparent 68%
          ),
          radial-gradient(
            820px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh),
            rgba(var(--highlight-rgb, 232, 240, 235), 0.025) 0%,
            transparent 72%
          );
        transition: opacity 180ms ease;
        will-change: opacity, background;
      }

      .global-pointer-glow.is-active {
        opacity: 1;
      }

      body[data-cursor-mode="arcade"] .global-pointer-glow,
      body.arcade-active .global-pointer-glow {
        background:
          radial-gradient(
            520px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh),
            rgba(34, 211, 238, 0.18) 0%,
            rgba(96, 165, 250, 0.10) 30%,
            rgba(168, 85, 247, 0.055) 48%,
            transparent 72%
          ),
          radial-gradient(
            900px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh),
            rgba(34, 211, 238, 0.035) 0%,
            transparent 76%
          );
      }

      @media (pointer: coarse) {
        .global-pointer-glow { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .global-pointer-glow { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  return glow;
}

export function initCursorSystem() {
  if (cursorSystemInitialized) return;
  cursorSystemInitialized = true;

  const glow = ensureGlobalPointerGlow();
  const dot = document.querySelector("[data-cursor-dot]");
  const ring = document.querySelector("[data-cursor-ring]");

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  const setPointerPosition = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.documentElement.style.setProperty("--mouse-x", `${pointerX}px`);
    document.documentElement.style.setProperty("--mouse-y", `${pointerY}px`);
    glow?.classList.add("is-active");
  };

  // The ambient glow is global and independent of the custom cursor DOM.
  // This keeps it working on portfolio pages, case studies, and inside ArcadeOS.
  if (finePointer) {
    window.addEventListener("pointermove", setPointerPosition, { passive: true });
    window.addEventListener("pointerenter", () => glow?.classList.add("is-active"), { passive: true });
    window.addEventListener("pointerleave", () => glow?.classList.remove("is-active"), { passive: true });
  }

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
