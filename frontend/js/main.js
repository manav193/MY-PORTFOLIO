import { initTheme } from "./modules/theme.js";
import { initReveal, initCounters, initScrollProgress, initBackToTop } from "./modules/scroll.js";
import { initTyping } from "./modules/typing.js";
import { initMagnetic, initTilt, initParallax } from "./modules/motion.js";
import { initContactForm } from "./modules/contact.js";
import { initOS } from "./modules/os.js";
import { initDockController } from "./modules/dock-controller.js";
import { initCursorSystem } from "./modules/cursor-system.js";
import { initCommandPalette } from "./modules/command-palette.js";
import { initSectionProgressRail } from "./modules/section-progress-rail.js";
import { initNimo } from "./modules/nimo.js";
import { initRuntimeFixes } from "./modules/runtime-fixes.js";

document.body.classList.add("is-loading");
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.8s var(--motion-momentum)';
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.style.opacity = '1';
  document.body.classList.remove("is-loading");
}));

initOS();
initCursorSystem();
initCommandPalette();
initSectionProgressRail();
initDockController();
initNimo();
initRuntimeFixes();
initReveal();
initCounters();
initScrollProgress();
initBackToTop();
initTyping();
initMagnetic();
initTilt();
initParallax();
initContactForm();

// Complete public GitHub archive. Bookmaking is intentionally excluded.
const archiveProjects = [
  ['MY-PORTFOLIO / ArcadeOS','project-arcade-os.html'],['Prompt-Aii','project-promptai.html'],['SHIFT-ZERO','project-shift-zero.html'],['ToolVerse','project-toolverse.html'],['LOVE','project-love-journey.html'],['resume-ai','assets/case-studies/resume-ai.html'],['SHIFT-ZERO-UI','assets/case-studies/shift-zero-ui.html'],['VELORA-BITES-UI','project-velora-bites.html'],['NITENDO-UI','project-nintendo.html'],['AURORA-CONTROL-UI','assets/case-studies/aurora-control-ui.html'],['SELFYY','project-selfyy.html'],['Multi_API_system','assets/case-studies/multi-api-system.html'],['Flora & Flavor','assets/case-studies/flora-and-flavor.html'],['VELDORA-BITES','assets/case-studies/veldora-bites.html'],['FATE-AI','assets/case-studies/fate-ai.html']
];
const projectsSection = document.querySelector('#work .container-centered');
if (projectsSection) {
  const archive = document.createElement('section');
  archive.className = 'design-work reveal-up github-archive';
  archive.setAttribute('aria-labelledby','github-archive-title');
  archive.innerHTML = `<div class="section-header compact-header"><p class="hero-kicker">COMPLETE GITHUB ARCHIVE</p><h3 id="github-archive-title">Every public project. Separate deep dives.</h3><p>All public repositories are represented here except Bookmaking.</p></div><div class="design-work-grid">${archiveProjects.map(([name,path]) => `<article class="design-project"><div><span class="project-status">CASE STUDY</span><h4>${name}</h4><p>Open the dedicated project page for problem, approach, implementation, and project evidence.</p><a href="${path}">View Case Study</a></p></div></article>`).join('')}</div><p style="margin-top:24px"><a class="btn-secondary" href="assets/github-projects.html">Browse complete project archive + GitHub links</a></p>`;
  const designWork = projectsSection.querySelector('.design-work');
  projectsSection.insertBefore(archive, designWork || null);
}

window.addEventListener("load", () => {
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  if (isLocalPreview) {
    navigator.serviceWorker?.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister()));
    if ("caches" in window) caches.keys().then(keys => keys.filter(key => key.startsWith("manav-portfolio-")).forEach(key => caches.delete(key)));
    return;
  }
  if ("serviceWorker" in navigator) {
    const base = process.env.DEPLOY_BASE || '/';
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
  }
}, { once: true });