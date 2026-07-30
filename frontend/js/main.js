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
import { initPublicProjectCatalog } from "./modules/public-project-catalog.js";
import { initProjectLaunch } from "./modules/project-launches.js";
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
import { initFlagshipExperiences } from "./modules/flagship-experiences.js";

const caseStudy = isCaseStudyPage();
if (document.body.dataset.projectTheme === "arcade-os") {
  document.body.dataset.projectTheme = "arcade";
}

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

initTheme();

if (!caseStudy) {
  registerAllArcadeApps();
  ArcadeDeveloperMode.init();
  ArcadeEnvironmentService.init();
  Arcade3DPlanetEngine.init();
  ArcadeTransitions.init();
  initOS();
}

GlobalPortfolioShell.init();
initProjectEnvironment();
initProjectLaunch();
initCursorSystem();
initCommandPalette();

const flagshipTheme = document.body.dataset.projectTheme;
if (flagshipTheme === "nimo" || flagshipTheme === "arcade") {
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
}

initNimo();
initFlagshipExperiences();
initRuntimeFixes();

if (!caseStudy) {
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