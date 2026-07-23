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
import { initProjectEnvironment } from "./modules/project-environment.js";
import { ArcadeEnvironmentService } from "./modules/arcade-environment-service.js";
import { Arcade3DPlanetEngine } from "./modules/arcade-3d-planet-engine.js";
import ArcadeTransitions from "./modules/arcade-transitions.js";
import { ArcadeModuleLoader } from "./arcade-module-loader.js";
import { ArcadeOS } from "./arcade-os.js";
import { ArcadeRegistry, registerAllArcadeApps } from "./arcade-apps.js";

import { ExperienceController } from "./modules/experience-controller.js";
import { GlobalPortfolioShell } from "./modules/global-portfolio-shell.js";
import { ArcadeDeveloperMode } from "./modules/arcade-developer-mode.js";

window.ArcadeExperience = ExperienceController;
window.ArcadeModuleLoader = ArcadeModuleLoader;
window.ArcadeOS = ArcadeOS;
window.ArcadeRegistry = window.ArcadeRegistry || ArcadeRegistry;
window.registerAllArcadeApps = registerAllArcadeApps;

registerAllArcadeApps();
ArcadeDeveloperMode.init();

document.body.classList.add("is-loading");
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.8s var(--motion-momentum)';
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.style.opacity = '1';
  document.body.classList.remove("is-loading");
}));

window.ArcadeEnvironmentService = ArcadeEnvironmentService;
window.Arcade3DPlanetEngine = Arcade3DPlanetEngine;
ArcadeEnvironmentService.init();
Arcade3DPlanetEngine.init();
ArcadeTransitions.init();
initOS();
GlobalPortfolioShell.init();
initProjectEnvironment();
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

function hydrateTemplateTokens() {
  const defaultName = "MANAV AGARWAL";
  document.querySelectorAll('.brand').forEach(el => {
    if (!el.textContent || el.textContent.includes('{{')) {
      el.textContent = defaultName;
    }
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('{{')) {
      node.nodeValue = node.nodeValue
        .replace(/\{\{PORTFOLIO\.NAME\}\}/gi, defaultName)
        .replace(/\{\{portfolio\.name\}\}/gi, defaultName)
        .replace(/\{\{portfolio\.role\}\}/gi, "Creative Frontend Developer")
        .replace(/\{\{portfolio\.location\}\}/gi, "Hyderabad, India")
        .replace(/\{\{portfolio\.availability\}\}/gi, "Open to junior frontend roles and freelance projects");
    }
  }
}
hydrateTemplateTokens();

function hydrateOptionalFullResImages(root = document) {
  const loadImage = img => {
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
      if (!img.getAttribute('src')) img.removeAttribute('src');
    };
    probe.src = resolvedSrc;
  };

  const images = Array.from(root.querySelectorAll('img[data-fullres-src]'));
  if (!('IntersectionObserver' in window)) {
    images.forEach(loadImage);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      loadImage(entry.target);
    });
  }, { rootMargin: '400px 0px' });

  images.forEach(img => {
    if (img.dataset.fullresState === 'loading' || img.dataset.fullresState === 'loaded') return;
    img.dataset.fullresState = 'pending';
    observer.observe(img);
  });
}

function installVeldoraFeaturedProject() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase || showcase.querySelector('[data-project-id="veldora-bites"]')) return;

  const card = document.createElement('article');
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
  if (!projectsSection || !showcase) return;

  ['velora-bites', 'nintendo', 'nike'].forEach(id => showcase.querySelector(`[data-project-id="${id}"]`)?.remove());

  document.querySelectorAll('.experiment-card').forEach(card => {
    const title = card.querySelector('h4')?.textContent?.trim().toUpperCase();
    if (title === 'SHIFT-ZERO UI') card.remove();
  });

  if (!projectsSection.querySelector('[data-ui-projects-section]')) {
    const section = document.createElement('section');
    section.className = 'more-experiments ui-projects-section';
    section.dataset.uiProjectsSection = '';
    section.style.marginTop = 'clamp(72px, 10vw, 140px)';
    section.innerHTML = `
      <div class="section-header more-experiments__header">
        <p class="hero-kicker">[ UI / UX ] // INTERFACE DESIGN</p>
        <h3>Dedicated UI design work.</h3>
        <p>Four interface-only projects, separated cleanly from shipped products and engineering work.</p>
      </div>
      <div class="experiments-grid">
        <article class="experiment-card">
          <div class="experiment-card__media"><img src="images/velora_desktop.png" alt="Velora Bites UI luxury restaurant landing page concept" width="1200" height="800" loading="lazy"></div>
          <div class="experiment-card__content"><span class="project-status status-progress">UI / UX Design</span><h4>Velora Bites UI</h4><p>Luxury hospitality UI direction with editorial typography, premium food presentation, responsive composition, and a refined dark-gold design system.</p><div class="experiment-card__actions"><a href="project-velora-bites.html">View Case Study</a><a href="https://github.com/manav193/VELORA-BITES-UI" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
        </article>
        <article class="experiment-card">
          <div class="experiment-card__media"><img src="images/sz_menu.png" alt="SHIFT-ZERO high-contrast game interface UI" width="1200" height="800" loading="lazy"></div>
          <div class="experiment-card__content"><span class="project-status status-progress">Game UI Design</span><h4>SHIFT-ZERO UI</h4><p>High-contrast game HUD and menu language designed for fast readability, controller-friendly navigation, and a premium futuristic identity.</p><div class="experiment-card__actions"><a href="assets/case-studies/shift-zero-ui.html">View Case Study</a><a href="https://github.com/manav193/SHIFT-ZERO-UI" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
        </article>
        <article class="experiment-card">
          <div class="experiment-card__media"><img src="images/nintendo.jpg" alt="Nintendo console interface UI concept" width="1200" height="800" loading="lazy"></div>
          <div class="experiment-card__content"><span class="project-status status-progress">Console UI Design</span><h4>Nintendo UI</h4><p>Console-interface redesign focused on spatial navigation, game-library hierarchy, and a cleaner modern presentation.</p><div class="experiment-card__actions"><a href="project-nintendo.html">View Case Study</a><a href="https://github.com/manav193/NITENDO-UI" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
        </article>
        <article class="experiment-card">
          <div class="experiment-card__media"><img src="images/nike.png" alt="Nike sports e-commerce website UI concept" width="1200" height="800" loading="lazy"></div>
          <div class="experiment-card__content"><span class="project-status status-progress">E-commerce UI Design</span><h4>Nike Website UI</h4><p>High-energy sports-commerce interface exploring product storytelling, dynamic typography, visual hierarchy, and conversion-focused interaction.</p><div class="experiment-card__actions"><a href="project-nike.html">View Case Study</a><a href="https://github.com/manav193" target="_blank" rel="noopener noreferrer">GitHub</a></div></div>
        </article>
      </div>`;

    const moreExperiments = projectsSection.querySelector('.more-experiments');
    if (moreExperiments) projectsSection.insertBefore(section, moreExperiments);
    else projectsSection.appendChild(section);
  }

  showcase.querySelectorAll('.project-index').forEach((index, i) => {
    index.textContent = String(i + 1).padStart(2, '0');
  });
}

function installCompactArchiveLink() {
  const projectsSection = document.querySelector('#work .container-centered');
  if (!projectsSection) return;

  projectsSection.querySelector('.github-archive')?.remove();
  projectsSection.querySelector('[data-compact-archive]')?.remove();

  const archive = document.createElement('section');
  archive.className = 'more-experiments github-archive-cta';
  archive.dataset.compactArchive = '';
  archive.style.marginTop = 'clamp(72px, 10vw, 140px)';
  archive.innerHTML = `
    <div class="section-header more-experiments__header">
      <p class="hero-kicker">COMPLETE GITHUB ARCHIVE</p>
      <h3>All public projects, organized separately.</h3>
      <p>The homepage stays focused. The complete archive contains every public repository except Bookmaking, with case-study and GitHub links.</p>
    </div>
    <div class="experiment-card" style="max-width:760px;">
      <div class="experiment-card__content">
        <span class="project-status">FULL ARCHIVE</span>
        <h4>Browse every project</h4>
        <p>Development projects, experiments, supporting builds, and additional case studies live in one dedicated archive instead of being dumped into the main Work section.</p>
        <div class="experiment-card__actions"><a href="assets/github-projects.html">Open Complete Project Archive</a></div>
      </div>
    </div>`;

  projectsSection.appendChild(archive);
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
installCompactArchiveLink();
renameLegacyVeloraUIPage();
hydrateOptionalFullResImages();

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
