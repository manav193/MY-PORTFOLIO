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
import { initArcadeCinematicScene } from "./modules/arcade-cinematic-scene.js";
import { initArcadeHardwareInputFixes } from "./modules/arcade-hardware-input-fixes.js";

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
initArcadeCinematicScene();
initArcadeHardwareInputFixes();
initReveal();
initCounters();
initScrollProgress();
initBackToTop();
initTyping();
initMagnetic();
initTilt();
initParallax();
initContactForm();

function hydrateOptionalFullResImages(root = document) {
  root.querySelectorAll('img[data-fullres-src]').forEach(img => {
    if (img.dataset.fullresState === 'loading' || img.dataset.fullresState === 'loaded') return;
    img.dataset.fullresState = 'loading';
    const resolvedSrc = new URL(img.dataset.fullresSrc, document.baseURI).href;
    const probe = new Image();
    probe.onload = () => {
      img.src = resolvedSrc;
      if (img.dataset.fullresAlt) img.alt = img.dataset.fullresAlt;
      img.dataset.fullresState = 'loaded';
      img.closest('.veldora-fullres-frame')?.querySelector('.veldora-shot-placeholder')?.remove();
      img.closest('.veldora-live-preview')?.querySelector('.veldora-shot-placeholder')?.remove();
    };
    probe.onerror = () => {
      img.dataset.fullresState = 'missing';
      // Keep any real fallback src already present instead of leaving a broken image.
      if (!img.getAttribute('src')) img.removeAttribute('src');
    };
    probe.src = resolvedSrc;
  });
}

function installVeldoraFeaturedProject() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase || showcase.querySelector('[data-project-id="veldora-bites"]')) return;

  const card = document.createElement('article');
  // No reveal-only class here: this card is injected after the initial reveal observer.
  card.className = 'project-card';
  card.dataset.projectId = 'veldora-bites';
  card.dataset.projectStatus = 'live';
  card.innerHTML = `
    <div class="project-media veldora-live-preview" style="display:grid;place-items:center;background:radial-gradient(circle at 75% 20%,rgba(245,170,24,.18),transparent 38%),linear-gradient(135deg,#17100b,#080706);min-height:320px;overflow:hidden;position:relative;">
      <img src="images/velora_desktop.png" data-fullres-src="images/veldora-case-01.png" data-fullres-alt="VELDORA-BITES live luxury restaurant homepage with editorial hero and floating order dock" alt="VELDORA-BITES live restaurant ordering project" width="1897" height="917" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
    </div>
    <div class="project-body">
      <div class="project-heading-row"><span class="project-index">05</span><span class="project-type">Restaurant ordering experience</span><span class="project-status status-live">Live</span></div>
      <h3>VELDORA-BITES</h3>
      <p class="project-value">A multi-page luxury restaurant experience with five daily specials, a 40-dish filtered menu, persistent cart state, coupons, payment offers, and an intentionally demo-only checkout.</p>
      <dl class="project-evidence"><div><dt>Role</dt><dd>Product design, frontend implementation, commerce-flow UX</dd></div><div><dt>Challenge</dt><dd>Turn a luxury visual direction into a practical Home → Menu → Orders journey without losing the editorial hospitality tone.</dd></div><div><dt>Result</dt><dd>Three connected pages, four menu collections, local cart persistence, INR pricing, responsive ordering, offers, and explicit no-charge demo checkout.</dd></div></dl>
      <div class="project-tech"><span>HTML5</span><span>CSS</span><span>Vanilla JS</span><span>LocalStorage</span><span>Vercel</span></div>
      <div class="project-actions"><a href="https://veldora-bites.vercel.app/orders.html" class="btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a><a href="https://github.com/manav193/VELDORA-BITES" class="btn-secondary" target="_blank" rel="noopener noreferrer">GitHub</a><a href="assets/case-studies/veldora-bites.html" class="btn-secondary">Case Study</a></div>
    </div>`;

  const before = showcase.querySelector('[data-project-id="shift-zero"]');
  showcase.insertBefore(card, before || null);
  hydrateOptionalFullResImages(card);
}

function installUIDesignSection() {
  const projectsSection = document.querySelector('#work .container-centered');
  const showcase = document.querySelector('[data-project-showcase]');
  if (!projectsSection || !showcase || projectsSection.querySelector('[data-ui-projects-section]')) return;

  // UI-only concepts should not compete with shipped/live engineering projects.
  ['velora-bites', 'nintendo', 'nike'].forEach(id => showcase.querySelector(`[data-project-id="${id}"]`)?.remove());

  // Remove the old SHIFT-ZERO UI duplicate from More Experiments, leaving PromptAI there.
  document.querySelectorAll('.experiment-card').forEach(card => {
    const title = card.querySelector('h4')?.textContent?.trim().toUpperCase();
    if (title === 'SHIFT-ZERO UI') card.remove();
  });

  const section = document.createElement('section');
  section.className = 'more-experiments ui-projects-section';
  section.dataset.uiProjectsSection = '';
  section.style.marginTop = 'clamp(72px, 10vw, 140px)';
  section.innerHTML = `
    <div class="section-header more-experiments__header">
      <p class="hero-kicker">[ UI / UX ] // INTERFACE DESIGN</p>
      <h3>Dedicated UI design explorations.</h3>
      <p>Four interface-focused projects separated from the shipped product work: restaurant, gaming, console, and e-commerce UI systems.</p>
    </div>
    <div class="experiments-grid">
      <article class="experiment-card">
        <div class="experiment-card__media"><img src="images/velora_desktop.png" alt="Velora Bites UI luxury restaurant landing page concept" width="1200" height="800" loading="lazy"></div>
        <div class="experiment-card__content"><span class="project-status status-progress">UI / UX Design</span><h4>Velora Bites UI</h4><p>The original luxury hospitality UI direction: editorial typography, premium food presentation, responsive composition, and a refined dark-gold design system.</p><div class="experiment-card__actions"><a href="project-velora-bites.html">View Case Study</a><a href="https://github.com/manav193/VELORA-BITES-UI" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
      </article>
      <article class="experiment-card">
        <div class="experiment-card__media"><img src="images/sz_menu.png" alt="SHIFT-ZERO high-contrast game interface UI" width="1200" height="800" loading="lazy"></div>
        <div class="experiment-card__content"><span class="project-status status-progress">Game UI Design</span><h4>SHIFT-ZERO UI</h4><p>A high-contrast game HUD and menu language designed for fast readability, controller-friendly navigation, and a premium futuristic identity.</p><div class="experiment-card__actions"><a href="assets/case-studies/shift-zero-ui.html">View Case Study</a><a href="https://github.com/manav193/SHIFT-ZERO-UI" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
      </article>
      <article class="experiment-card">
        <div class="experiment-card__media"><img src="images/nintendo.jpg" alt="Nintendo console interface UI concept" width="1200" height="800" loading="lazy"></div>
        <div class="experiment-card__content"><span class="project-status status-progress">Console UI Design</span><h4>Nintendo UI</h4><p>A conceptual console-interface redesign focused on spatial navigation, game-library hierarchy, and a cleaner modern presentation.</p><div class="experiment-card__actions"><a href="project-nintendo.html">View Case Study</a><a href="https://github.com/manav193/NITENDO-UI" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
      </article>
      <article class="experiment-card">
        <div class="experiment-card__media"><img src="images/nike.png" alt="Nike sports e-commerce website UI concept" width="1200" height="800" loading="lazy"></div>
        <div class="experiment-card__content"><span class="project-status status-progress">E-commerce UI Design</span><h4>Nike Website UI</h4><p>A high-energy sports-commerce interface exploring product storytelling, dynamic typography, visual hierarchy, and conversion-focused interaction.</p><div class="experiment-card__actions"><a href="project-nike.html">View Case Study</a><a href="https://github.com/manav193" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
      </article>
    </div>`;

  const moreExperiments = projectsSection.querySelector('.more-experiments');
  if (moreExperiments) projectsSection.insertBefore(section, moreExperiments);
  else projectsSection.appendChild(section);

  showcase.querySelectorAll('.project-index').forEach((index, i) => {
    index.textContent = String(i + 1).padStart(2, '0');
  });
}

function renameLegacyVeloraUIPage() {
  if (!location.pathname.endsWith('/project-velora-bites.html') && !location.pathname.endsWith('project-velora-bites.html')) return;
  document.title = 'Velora Bites UI — Luxury Restaurant Interface Case Study';
  const heading = document.querySelector('h1');
  if (heading) heading.textContent = 'Velora Bites UI';
  const subtitle = document.querySelector('.cs-hero-subtitle');
  if (subtitle) subtitle.textContent = 'The original luxury restaurant UI/UX concept — a premium responsive design system focused on editorial hospitality, visual hierarchy, and interaction direction.';
}

installVeldoraFeaturedProject();
installUIDesignSection();
renameLegacyVeloraUIPage();
hydrateOptionalFullResImages();

// Complete public GitHub archive. Bookmaking is intentionally excluded.
const archiveProjects = [
  ['MY-PORTFOLIO / ArcadeOS','project-arcade-os.html'],['Prompt-Aii','project-promptai.html'],['SHIFT-ZERO','project-shift-zero.html'],['ToolVerse','project-toolverse.html'],['LOVE','project-love-journey.html'],['resume-ai','assets/case-studies/resume-ai.html'],['SHIFT-ZERO-UI','assets/case-studies/shift-zero-ui.html'],['VELORA-BITES-UI','project-velora-bites.html'],['NITENDO-UI','project-nintendo.html'],['AURORA-CONTROL-UI','assets/case-studies/aurora-control-ui.html'],['SELFYY','project-selfyy.html'],['Multi_API_system','assets/case-studies/multi-api-system.html'],['Flora & Flavor','assets/case-studies/flora-and-flavor.html'],['VELDORA-BITES','assets/case-studies/veldora-bites.html'],['FATE-AI','assets/case-studies/fate-ai.html']
];
const projectsSection = document.querySelector('#work .container-centered');
if (projectsSection) {
  const archive = document.createElement('section');
  archive.className = 'design-work github-archive';
  archive.setAttribute('aria-labelledby','github-archive-title');
  archive.innerHTML = `<div class="section-header compact-header"><p class="hero-kicker">COMPLETE GITHUB ARCHIVE</p><h3 id="github-archive-title">Every public project. Separate deep dives.</h3><p>All public repositories are represented here except Bookmaking.</p></div><div class="design-work-grid">${archiveProjects.map(([name,path]) => `<article class="design-project"><div><span class="project-status">CASE STUDY</span><h4>${name}</h4><p>Open the dedicated project page for problem, approach, implementation, and project evidence.</p><a href="${path}">View Case Study</a></div></article>`).join('')}</div><p style="margin-top:24px"><a class="btn-secondary" href="assets/github-projects.html">Browse complete project archive + GitHub links</a></p>`;
  const uiSection = projectsSection.querySelector('[data-ui-projects-section]');
  const moreExperiments = projectsSection.querySelector('.more-experiments:not([data-ui-projects-section])');
  projectsSection.insertBefore(archive, uiSection || moreExperiments || null);
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
