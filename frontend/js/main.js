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
import { ArcadeOutcomeScreen } from "./modules/arcade-outcome-screen.js";

import { ExperienceController } from "./modules/experience-controller.js";
import { GlobalPortfolioShell, isCaseStudyPage } from "./modules/global-portfolio-shell.js";
import { ArcadeDeveloperMode } from "./modules/arcade-developer-mode.js";

window.ArcadeExperience = ExperienceController;
window.ArcadeModuleLoader = ArcadeModuleLoader;
window.ArcadeOS = ArcadeOS;
window.ArcadeRegistry = window.ArcadeRegistry || ArcadeRegistry;
window.registerAllArcadeApps = registerAllArcadeApps;
window.ArcadeOutcomeScreen = ArcadeOutcomeScreen;

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

if (!isCaseStudyPage()) {
  initSectionProgressRail();
  initDockController();
}

initNimo();
initRuntimeFixes();

if (!isCaseStudyPage()) {
  initArcadeCinematicScene();
  initArcadeHardwareInputFixes();
}

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
  const projectsSection = document.querySelector('#work .container-centered');
  if (!projectsSection) return;

  const showcase = projectsSection.querySelector('.projects-showcase');
  if (!showcase) return;

  let veldoraArticle = showcase.querySelector('article[data-project-id="velora-bites"]');
  if (!veldoraArticle) {
    veldoraArticle = document.createElement('article');
    veldoraArticle.className = 'project-card project-card--featured';
    veldoraArticle.dataset.projectId = 'velora-bites';

    veldoraArticle.innerHTML = `
      <div class="project-card__header">
        <span class="project-number">01</span>
        <span class="project-tag">FEATURED CASE STUDY</span>
      </div>
      <div class="project-card__content">
        <h3 class="project-title">Velora Bites UI</h3>
        <p class="project-subtitle">Luxury Restaurant UI/UX & Responsive Web Design System</p>
        <p class="project-description">A high-end editorial dining concept built around dark-mode visual hierarchy, fluid micro-interactions, responsive typography, and structured design systems.</p>
        <div class="project-tech-stack">
          <span>HTML5</span>
          <span>CSS3</span>
          <span>Vanilla JS</span>
          <span>Design Systems</span>
          <span>UI/UX</span>
        </div>
        <div class="project-actions">
          <a href="project-velora-bites.html" class="btn btn--primary">View Case Study</a>
          <a href="https://github.com/manav193/Velora-Bites" target="_blank" rel="noopener noreferrer" class="btn btn--secondary">GitHub Repo</a>
        </div>
      </div>
      <div class="project-card__media">
        <img src="images/velora-bites.png" alt="Velora Bites Luxury Restaurant UI case study mockup" width="1200" height="800" loading="lazy">
      </div>
    `;

    showcase.insertBefore(veldoraArticle, showcase.firstChild);
  }
}

function installUIDesignSection() {
  const projectsSection = document.querySelector('#work .container-centered');
  if (!projectsSection) return;

  projectsSection.querySelector('.ui-experiments-section')?.remove();

  const showcase = projectsSection.querySelector('.projects-showcase');
  if (!showcase) return;

  let section = projectsSection.querySelector('.ui-experiments-section');
  if (!section) {
    section = document.createElement('section');
    section.className = 'ui-experiments-section';
    section.style.marginTop = 'clamp(48px, 6vw, 80px)';
    section.innerHTML = `
      <div class="section-header">
        <p class="hero-kicker">UI & INTERACTION EXPERIMENTS</p>
        <h3>Design systems, brand concepts, and interface explorations.</h3>
      </div>
      <div class="experiments-grid">
        <article class="experiment-card">
          <div class="experiment-card__media"><img src="images/nintendo-ui.png" alt="Nintendo UI console interface redesign mockup" width="1200" height="800" loading="lazy"></div>
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
