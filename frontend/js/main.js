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

/**
 * Full-resolution case-study screenshots are intentionally optional at build
 * time so large original PNG files can be added byte-for-byte without blocking
 * a deployment. Once present, they replace their lightweight placeholders.
 */
function hydrateOptionalFullResImages(root = document) {
  root.querySelectorAll('img[data-fullres-src]').forEach(img => {
    if (img.dataset.fullresState === 'loading' || img.dataset.fullresState === 'loaded') return;
    img.dataset.fullresState = 'loading';
    const rawPath = img.dataset.fullresSrc;
    const resolvedSrc = new URL(rawPath, document.baseURI).href;
    const probe = new Image();
    probe.onload = () => {
      img.src = resolvedSrc;
      if (img.dataset.fullresAlt) img.alt = img.dataset.fullresAlt;
      img.dataset.fullresState = 'loaded';
      img.closest('.veldora-fullres-frame')?.querySelector('.veldora-shot-placeholder')?.remove();
    };
    probe.onerror = () => {
      img.dataset.fullresState = 'missing';
      img.removeAttribute('src');
    };
    probe.src = resolvedSrc;
  });
}

function installVeldoraFeaturedProject() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase || showcase.querySelector('[data-project-id="veldora-bites"]')) return;

  const card = document.createElement('article');
  card.className = 'project-card reveal-up';
  card.dataset.projectId = 'veldora-bites';
  card.dataset.projectStatus = 'live';
  card.innerHTML = `
    <div class="project-media veldora-live-preview" style="display:grid;place-items:center;background:radial-gradient(circle at 75% 20%,rgba(245,170,24,.18),transparent 38%),linear-gradient(135deg,#17100b,#080706);min-height:320px;overflow:hidden;">
      <img data-fullres-src="images/veldora-case-01.png" data-fullres-alt="Velora Bites live luxury restaurant homepage with editorial hero and order dock" alt="VELDORA-BITES live restaurant ordering project" width="1897" height="917" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
      <div class="veldora-shot-placeholder" style="position:absolute;text-align:center;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,.72);letter-spacing:.08em;"><strong style="display:block;color:#f5aa18;font-size:1.1rem;margin-bottom:8px;">VELDORA-BITES</strong><span>LIVE RESTAURANT EXPERIENCE</span></div>
    </div>
    <div class="project-body">
      <div class="project-heading-row"><span class="project-index">05</span><span class="project-type">Restaurant ordering experience</span><span class="project-status status-live">Live</span></div>
      <h3>VELDORA-BITES</h3>
      <p class="project-value">A multi-page luxury restaurant experience with five daily specials, a 40-dish filtered menu, persistent cart state, coupons, payment offers, and an intentionally demo-only checkout.</p>
      <dl class="project-evidence"><div><dt>Role</dt><dd>Product design, frontend implementation, commerce-flow UX</dd></div><div><dt>Challenge</dt><dd>Turn a luxury visual direction into a practical Home → Menu → Orders journey without losing the editorial hospitality tone.</dd></div><div><dt>Result</dt><dd>Three connected pages, four menu collections, local cart persistence, INR pricing, responsive ordering, offers, and explicit no-charge demo checkout.</dd></div></dl>
      <div class="project-tech"><span>HTML5</span><span>CSS</span><span>Vanilla JS</span><span>LocalStorage</span><span>Vercel</span></div>
      <div class="project-actions"><a href="https://veldora-bites.vercel.app/orders.html" class="btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a><a href="https://github.com/manav193/VELDORA-BITES" class="btn-secondary" target="_blank" rel="noopener noreferrer">GitHub</a><a href="project-veldora-bites.html" class="btn-secondary">Case Study</a></div>
    </div>`;

  const before = showcase.querySelector('[data-project-id="shift-zero"]');
  showcase.insertBefore(card, before || null);

  showcase.querySelectorAll('.project-index').forEach((index, i) => {
    index.textContent = String(i + 1).padStart(2, '0');
  });

  hydrateOptionalFullResImages(card);
}

installVeldoraFeaturedProject();
hydrateOptionalFullResImages();

// Complete public GitHub archive. Bookmaking is intentionally excluded.
const archiveProjects = [
  ['MY-PORTFOLIO / ArcadeOS','project-arcade-os.html'],['Prompt-Aii','project-promptai.html'],['SHIFT-ZERO','project-shift-zero.html'],['ToolVerse','project-toolverse.html'],['LOVE','project-love-journey.html'],['resume-ai','assets/case-studies/resume-ai.html'],['SHIFT-ZERO-UI','assets/case-studies/shift-zero-ui.html'],['VELORA-BITES-UI','project-velora-bites.html'],['NITENDO-UI','project-nintendo.html'],['AURORA-CONTROL-UI','assets/case-studies/aurora-control-ui.html'],['SELFYY','project-selfyy.html'],['Multi_API_system','assets/case-studies/multi-api-system.html'],['Flora & Flavor','assets/case-studies/flora-and-flavor.html'],['VELDORA-BITES','project-veldora-bites.html'],['FATE-AI','assets/case-studies/fate-ai.html']
];
const projectsSection = document.querySelector('#work .container-centered');
if (projectsSection) {
  const archive = document.createElement('section');
  archive.className = 'design-work reveal-up github-archive';
  archive.setAttribute('aria-labelledby','github-archive-title');
  archive.innerHTML = `<div class="section-header compact-header"><p class="hero-kicker">COMPLETE GITHUB ARCHIVE</p><h3 id="github-archive-title">Every public project. Separate deep dives.</h3><p>All public repositories are represented here except Bookmaking.</p></div><div class="design-work-grid">${archiveProjects.map(([name,path]) => `<article class="design-project"><div><span class="project-status">CASE STUDY</span><h4>${name}</h4><p>Open the dedicated project page for problem, approach, implementation, and project evidence.</p><a href="${path}">View Case Study</a></div></article>`).join('')}</div><p style="margin-top:24px"><a class="btn-secondary" href="assets/github-projects.html">Browse complete project archive + GitHub links</a></p>`;
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
