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

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
    document.body.classList.remove("is-loading");
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
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  if (isLocalPreview) {
    navigator.serviceWorker?.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
    if ("caches" in window) {
      caches.keys().then(keys => {
        keys.filter(key => key.startsWith("manav-portfolio-")).forEach(key => caches.delete(key));
      });
    }
    return;
  }

  if ("serviceWorker" in navigator) {
    const base = process.env.DEPLOY_BASE || '/';
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
  }
}, { once: true });
