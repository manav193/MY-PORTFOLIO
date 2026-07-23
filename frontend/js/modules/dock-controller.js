const VALID_ACTIONS = new Set(["portfolio-intro", "work", "about", "contact", "arcade", "none"]);
const SECTION_ACTIONS = new Set(["work", "about", "contact"]);

let dockItems = [];
let dockByAction = new Map();
let arcadeExplicitlySelected = false;
let activeAction = "none";
let observer = null;
let userLock = { action: "none", until: 0 };
let arcadeArrivedAtCabinet = false;

export function initDockController() {
  dockItems = Array.from(document.querySelectorAll(".dock-item"));
  dockByAction = new Map(
    dockItems
      .filter((item) => item.dataset.dockAction && !item.classList.contains("dock-external"))
      .map((item) => [item.dataset.dockAction, item])
  );

  if (!dockItems.length) return;

  window.setActiveDock = setActiveDock;
  window.enterArcade = enterArcade;
  window.exitArcadeToPortfolio = exitArcadeToPortfolio;
  document.querySelectorAll("[data-enter-arcade]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      enterArcade();
    });
  });
  bindDockClicks();
  initSectionObserver();
  syncDockFromViewport();
}

export function enterArcade() {
  if (window.ArcadeExperience) {
    window.ArcadeExperience.enterArcadeExperience('dock');
  }
}

export function exitArcadeToPortfolio(targetId = "main-content") {
  if (window.ArcadeExperience) {
    window.ArcadeExperience.exitArcadeExperience('dock', targetId);
  }
}

export function setActiveDock(action) {
  const normalized = VALID_ACTIONS.has(action) ? action : "none";
  activeAction = normalized;
  document.body.classList.toggle("arcade-active", normalized === "arcade");

  const items = Array.from(document.querySelectorAll(".dock-item"));
  items.forEach((item) => {
    const isMatch = item.dataset.dockAction === normalized && !item.classList.contains("dock-external");
    item.classList.toggle("dock-active", isMatch);
    if (isMatch) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });

  window.setCursorMode?.(normalized === "arcade" ? "arcade" : "portfolio");
}

function bindDockClicks() {
  dockItems.forEach((item) => {
    if (item.dataset.dockBound) return;
    item.dataset.dockBound = "true";

    const action = item.dataset.dockAction;

    if (item.classList.contains("dock-external")) {
      item.addEventListener("click", () => {
        item.classList.remove("dock-active");
      });
      return;
    }

    if (!VALID_ACTIONS.has(action)) return;

    if (action === "arcade") {
      item.addEventListener("mouseenter", () => {
        window.ArcadeBootController?.prewarm();
      });
    }

    item.addEventListener("click", (event) => routeDockAction(event, action));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        routeDockAction(event, action);
      }
    });
  });
}

function routeDockAction(event, action) {
  event.preventDefault();

  if (action === "arcade") {
    window.ArcadeBootController?.prewarm();
    if (window.ArcadeExperience) {
      window.ArcadeExperience.enterArcadeExperience('dock');
    }
  } else if (VALID_ACTIONS.has(action)) {
    if (window.ArcadeExperience) {
      window.ArcadeExperience.exitArcadeExperience('dock', action);
    }
  }
}

function lockActiveDock(action, duration) {
  userLock = { action, until: Date.now() + duration };
  setActiveDock(action);
}

function initSectionObserver() {
  if (observer) observer.disconnect();

  const targets = ["intro-sequence", "work", "about", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  observer = new IntersectionObserver((entries) => {
    syncDockFromViewport();
  }, {
    root: null,
    rootMargin: "-18% 0px -48% 0px",
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
  });

  targets.forEach((target) => observer.observe(target));
  window.addEventListener("scroll", syncDockFromViewport, { passive: true });
  window.addEventListener("resize", syncDockFromViewport);
}

function syncDockFromViewport() {
  if (window.ArcadeExperience) {
    const expState = window.ArcadeExperience.getState();
    if (expState === 'ARCADE_HOME' || expState === 'ARCADE_APP' || expState === 'ARCADE_ENTERING') {
      if (activeAction !== 'arcade') setActiveDock('arcade');
      return;
    }
  }

  const isSubpage = !document.getElementById('home');
  if (isSubpage) {
    if (activeAction !== 'work') setActiveDock('work');
    return;
  }

  const sectionAction = getMostVisibleSectionAction();
  if (sectionAction) {
    if (activeAction !== sectionAction) setActiveDock(sectionAction);
    return;
  }

  if (isIntroAtTop()) {
    if (activeAction !== "portfolio-intro") setActiveDock("portfolio-intro");
    return;
  }

  if (activeAction === "arcade") {
    setActiveDock("none");
  }
}

function getMostVisibleSectionAction() {
  const marker = window.innerHeight * 0.42;
  const candidates = Array.from(SECTION_ACTIONS)
    .map((action) => {
      const section = document.getElementById(action);
      if (!section) return null;
      const rect = section.getBoundingClientRect();
      const containsMarker = rect.top <= marker && rect.bottom >= marker;
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      const distance = Math.abs(rect.top - marker);
      return { action, containsMarker, visibleHeight, distance };
    })
    .filter(Boolean);

  const containing = candidates.find((candidate) => candidate.containsMarker);
  if (containing) return containing.action;

  const visible = candidates
    .filter((candidate) => candidate.visibleHeight > window.innerHeight * 0.18)
    .sort((a, b) => b.visibleHeight - a.visibleHeight || a.distance - b.distance);

  if (visible[0]) {
    return visible[0].action;
  }

  return null;
}

function isIntroAtTop() {
  const intro = document.getElementById("intro-sequence");
  if (!intro) return window.scrollY < 64;

  const rect = intro.getBoundingClientRect();
  return window.scrollY < 96 && rect.top <= 64 && rect.bottom > window.innerHeight * 0.5;
}

function isCabinetViewportCurrent() {
  const intro = document.getElementById("intro-sequence");
  if (!intro) return false;

  const rect = intro.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, window.innerHeight)));
  const cabinetVisible = rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.35;
  return cabinetVisible && progress >= 0.42;
}

function scrollToCabinetReadyPosition() {
  const intro = document.getElementById("intro-sequence");
  const introTop = intro ? intro.getBoundingClientRect().top + window.scrollY : 0;
  const targetY = introTop + window.innerHeight * 0.96;
  window.scrollTo({ top: targetY, behavior: "smooth" });
}

function cleanupArcade() {
  if (window.ArcadeOS && typeof window.ArcadeOS.forceGoHome === "function") {
    window.ArcadeOS.forceGoHome();
  }
}
