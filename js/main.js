import { initTheme } from "./modules/theme.js";
import { initReveal, initCounters, initScrollProgress, initBackToTop } from "./modules/scroll.js";
import { initTyping } from "./modules/typing.js";
import { initMagnetic, initTilt, initParallax } from "./modules/motion.js";
import { initContactForm } from "./modules/contact.js";
import { initOS } from "./modules/os.js";
import { initDockController } from "./modules/dock-controller.js";
import { initCursorSystem } from "./modules/cursor-system.js";

document.body.classList.add("is-loading");

document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.8s var(--motion-momentum)';

const chamberElements = document.querySelectorAll('main, footer, #intro-sequence, .project-hero, .cs-container');
chamberElements.forEach(el => {
  el.style.transform = 'scale(1.03)';
  el.style.transition = 'transform 0.8s var(--motion-momentum)';
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
    chamberElements.forEach(el => {
      el.style.transform = 'scale(1)';
    });
  });
});

initOS();
initCursorSystem();
initDockController();
initReveal();
initCounters();
initScrollProgress();
initBackToTop();
initTyping();
initMagnetic();
initTilt();
initParallax();
initContactForm();

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}, { once: true });
