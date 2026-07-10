import { initTheme } from "./modules/theme.js";
import { initReveal, initCounters, initScrollProgress, initBackToTop } from "./modules/scroll.js";
import { initTyping } from "./modules/typing.js";
import { initMagnetic, initCursor, initTilt, initParallax } from "./modules/motion.js";
import { initContactForm } from "./modules/contact.js";
import { initOS } from "./modules/os.js";

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
initReveal();
initCounters();
initScrollProgress();
initBackToTop();
initTyping();
initMagnetic();
initCursor();
initTilt();
initParallax();
initContactForm();

window.addEventListener("load", () => {
  import("./arcade-qa-fixes.js").catch(() => {});
  import("./mobile-arcade-hotfix.js").catch(() => {});

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}, { once: true });
