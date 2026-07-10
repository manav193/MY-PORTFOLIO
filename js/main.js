import { initTheme } from "./modules/theme.js";
import { initReveal, initCounters, initScrollProgress, initBackToTop } from "./modules/scroll.js";
import { initTyping } from "./modules/typing.js";
import { initMagnetic, initCursor, initTilt, initParallax } from "./modules/motion.js";
import { initContactForm } from "./modules/contact.js";
import { initOS } from "./modules/os.js";

document.body.classList.add("is-loading");

initOS();
initTheme();
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
