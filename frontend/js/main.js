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
import { initNimoExperienceUpgrades } from "./modules/nimo-experience-upgrades.js";
import { initNimoArcade2630 } from "./modules/nimo-arcade-26-30.js";
import { initPortfolio3135 } from "./modules/portfolio-31-35.js";
import { initPortfolioTrust4650 } from "./modules/portfolio-trust-46-50.js";
import { initRuntimeFixes } from "./modules/runtime-fixes.js";
import { initArcadeCinematicScene } from "./modules/arcade-cinematic-scene.js";
import { initArcadeHardwareInputFixes } from "./modules/arcade-hardware-input-fixes.js";
import { initArcadeStandaloneBridge } from "./modules/arcade-standalone-bridge.js";
import { initProjectEnvironment } from "./modules/project-environment.js";
import { initPublicProjectCatalog } from "./modules/public-project-catalog.js";
import { initProjectLaunch } from "./modules/project-launches.js";
import { ArcadeEnvironmentService } from "./modules/arcade-environment-service.js";
import { Arcade3DPlanetEngine } from "./modules/arcade-3d-planet-engine.js";
import { ArcadeModuleLoader } from "./arcade-module-loader.js";
import { ArcadeOS } from "./arcade-os.js";
import { ArcadeRegistry, registerAllArcadeApps } from "./arcade-apps.js";
import { ArcadeOutcomeScreen } from "./modules/arcade-outcome-screen.js";
import { ExperienceController } from "./modules/experience-controller.js";
import { GlobalPortfolioShell, isCaseStudyPage } from "./modules/global-portfolio-shell.js";
import { ArcadeDeveloperMode } from "./modules/arcade-developer-mode.js";
import { initFlagshipExperiences } from "./modules/flagship-experiences.js";
import { initProductProofGallery } from "./modules/product-proof-gallery.js";
import { initBootExperience } from "./modules/boot-experience.js";
import { initAdaptiveHost } from "./shared/adaptive/adaptive-host.js";

const caseStudy = isCaseStudyPage();

// The portfolio homepage uses the shorter runtime theme id. Case studies must
// preserve their authored data-project-theme value so flagship/Arcade runtime
// selectors cannot mistake a content page for the live Arcade experience.
if (!caseStudy && document.body.dataset.projectTheme === "arcade-os") {
  document.body.dataset.projectTheme = "arcade";
}

const qaStyle = document.createElement("link");
qaStyle.rel = "stylesheet";
qaStyle.href = "/assets/case-studies/qa-layout-fixes.css";
qaStyle.dataset.qaLayoutFixes = "true";
document.head.appendChild(qaStyle);

const uiStackStyle = document.createElement("link");
uiStackStyle.rel = "stylesheet";
uiStackStyle.href = "/assets/case-studies/ui-project-stack.css";
uiStackStyle.dataset.uiProjectStackStyles = "true";
document.head.appendChild(uiStackStyle);

const portfolio3135Style = document.createElement("link");
portfolio3135Style.rel = "stylesheet";
portfolio3135Style.href = "/assets/case-studies/portfolio-31-35.css";
portfolio3135Style.dataset.portfolio3135Styles = "true";
document.head.appendChild(portfolio3135Style);

const trustStyle = document.createElement("link");
trustStyle.rel = "stylesheet";
trustStyle.href = "/assets/case-studies/portfolio-trust-46-50.css";
trustStyle.dataset.portfolioTrustStyles = "true";
document.head.appendChild(trustStyle);

window.ArcadeExperience = ExperienceController;
window.ArcadeModuleLoader = ArcadeModuleLoader;
window.ArcadeOS = ArcadeOS;
window.ArcadeRegistry = window.ArcadeRegistry || ArcadeRegistry;
window.registerAllArcadeApps = registerAllArcadeApps;
window.ArcadeOutcomeScreen = ArcadeOutcomeScreen;
window.ArcadeEnvironmentService = ArcadeEnvironmentService;
window.Arcade3DPlanetEngine = Arcade3DPlanetEngine;

document.body.classList.add("is-loading");
document.body.style.opacity = "0";
document.body.style.transition = "opacity 0.45s var(--motion-momentum)";
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.style.opacity = "1";
  document.body.classList.remove("is-loading");
}));

if (!caseStudy) initBootExperience();

initTheme();

if (!caseStudy) {
  registerAllArcadeApps();
  ArcadeDeveloperMode.init();
  ArcadeEnvironmentService.init();
  Arcade3DPlanetEngine.init();
  initOS();

  GlobalPortfolioShell.init();
  window.ArcadeAdaptive = initAdaptiveHost({
    moduleId: "arcade-os",
    projectSelector: "[data-project-id]",
    searchSelector: "#cmd-input, #nimo-input",
    fabricContainer: "#machine-bg"
  });

  initProjectLaunch();
  initCursorSystem();
  initCommandPalette();

  const proofStyle = document.createElement("link");
  proofStyle.rel = "stylesheet";
  proofStyle.href = "/assets/case-studies/product-proof-gallery.css";
  document.head.appendChild(proofStyle);
  initProductProofGallery();
} else {
  // Case studies are content pages. Remove any stale shell nodes that may have
  // been restored from bfcache or injected by an older cached bundle.
  document.querySelectorAll([
    ".os-dock",
    "[data-theme-dock]",
    ".section-progress-rail",
    "#nimo-widget",
    "#global-nimo-root",
    ".nimo-widget",
    ".nimo-launcher",
    "[data-nimo-root]",
    ".flagship-showcase",
    "[data-flagship-showcase]",
    ".arcade-cinematic-scene",
    "[data-arcade-cinematic]",
    ".arcade-apps-label"
  ].join(",")).forEach((node) => node.remove());
}

initProjectEnvironment();

const UI_STACK_IDS = ["velora-bites", "nintendo", "nike"];

function maintainUiProjectStack() {
  if (caseStudy) return;
  const showcase = document.querySelector("[data-project-showcase]");
  if (!showcase?.parentElement) return;

  const cards = UI_STACK_IDS.map((id, index) => {
    const card = document.querySelector(`[data-project-id="${id}"]`);
    if (!card) return null;
    card.dataset.uiStack = "true";
    card.style.setProperty("--ui-stack-index", String(index));
    return card;
  }).filter(Boolean);

  if (!cards.length) return;

  let stack = showcase.parentElement.querySelector(":scope > .ui-project-stack");
  if (!stack) {
    stack = document.createElement("section");
    stack.className = "ui-project-stack";
    stack.dataset.uiProjectStack = "true";
    stack.setAttribute("aria-label", "UI and interface design projects");
    stack.innerHTML = '<div class="ui-project-stack__heading"><span>UI / UX COLLECTION</span><h3>Interface studies, layered as a visual stack.</h3></div><div class="ui-project-stack__cards"></div>';
    showcase.after(stack);
  }

  const host = stack.querySelector(".ui-project-stack__cards");
  cards.forEach(card => {
    if (card.parentElement !== host) host.appendChild(card);
  });
}

function initUiProjectStack() {
  if (caseStudy) return;
  const work = document.querySelector("#work");
  if (!work) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      maintainUiProjectStack();
    });
  };

  maintainUiProjectStack();
  new MutationObserver(schedule).observe(work, { childList: true, subtree: true });
  window.addEventListener("resize", schedule, { passive: true });
}

const flagshipTheme = document.body.dataset.projectTheme;
if (!caseStudy && (flagshipTheme === "nimo" || flagshipTheme === "arcade")) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "assets/case-studies/flagship-showcase.css";
  document.head.appendChild(style);
  import("../assets/case-studies/flagship-showcase.js").catch(() => {});
}

if (caseStudy) {
  import("../assets/case-studies/story-lab.js")
    .then(({ initStoryLab }) => initStoryLab())
    .catch(() => {});
} else {
  initPublicProjectCatalog();
  initSectionProgressRail();
  initDockController();

  initNimo();
  initNimoExperienceUpgrades();
  initNimoArcade2630();
  initFlagshipExperiences();
  initUiProjectStack();
  initPortfolio3135();
  initPortfolioTrust4650();

  initArcadeCinematicScene();
  initArcadeHardwareInputFixes();
  initArcadeStandaloneBridge();
}

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