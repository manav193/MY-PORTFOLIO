import { initTheme } from "./modules/theme.js";
import { initReveal, initCounters, initScrollProgress, initBackToTop } from "./modules/scroll.js";
import { initTyping } from "./modules/typing.js";
import { initParticles } from "./modules/particles.js";
import { initMagnetic, initCursor, initTilt, initParallax } from "./modules/motion.js";
import { initProjects } from "./modules/projects.js";
import { initCarousel } from "./modules/carousel.js";
import { initCommandPalette } from "./modules/command-palette.js";
import { initContactForm } from "./modules/contact.js";

document.body.classList.add("is-loading");

window.addEventListener("load", () => {
  document.querySelector("[data-loader]")?.classList.add("is-hidden");
  document.body.classList.remove("is-loading");
});

initTheme();
initReveal();
initCounters();
initScrollProgress();
initBackToTop();
initTyping();
initParticles();
initMagnetic();
initCursor();
initTilt();
initParallax();
initProjects();
initCarousel();
initCommandPalette();
initContactForm();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
