const PORTFOLIO_SECTIONS = [
  { id: "home", label: "Home", shortLabel: "01" },
  { id: "work", label: "Work", shortLabel: "02" },
  { id: "about", label: "About", shortLabel: "03" },
  { id: "skills", label: "Skills", shortLabel: "04" },
  { id: "experience", label: "Experience", shortLabel: "05" },
  { id: "contact", label: "Contact", shortLabel: "06" }
];

export function initSectionProgressRail() {
  const sections = PORTFOLIO_SECTIONS
    .map(item => ({ ...item, element: document.getElementById(item.id) }))
    .filter(item => item.element);

  if (!sections.length) return;

  const rail = document.createElement("nav");
  rail.className = "section-progress-rail";
  rail.setAttribute("aria-label", "Page sections");
  rail.innerHTML = `
    <div class="section-progress-rail__track" aria-hidden="true">
      <div class="section-progress-rail__fill"></div>
    </div>
    <ol class="section-progress-rail__items">
      ${sections.map(({ id, label, shortLabel }) => `
        <li class="section-progress-rail__item">
          <a class="section-progress-rail__link" href="#${id}" data-section-id="${id}" aria-label="Go to ${label} section">
            <span class="section-progress-rail__marker" aria-hidden="true"></span>
            <span class="section-progress-rail__number" aria-hidden="true">${shortLabel}</span>
            <span class="section-progress-rail__label">${label}</span>
          </a>
        </li>
      `).join("")}
    </ol>
  `;
  document.body.append(rail);

  const links = new Map(
    Array.from(rail.querySelectorAll("[data-section-id]"))
      .map(link => [link.dataset.sectionId, link])
  );
  const visibleSections = new Set();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeId = "";
  let scrollTicking = false;
  let focusTimer = 0;

  const setActive = (id) => {
    if (!links.has(id) || activeId === id) return;
    activeId = id;
    links.forEach((link, sectionId) => {
      const active = sectionId === id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const syncActiveFromViewport = () => {
    const anchor = window.innerHeight * 0.44;
    const passed = sections.filter(({ element }) => element.getBoundingClientRect().top <= anchor);
    setActive((passed.at(-1) || sections[0]).id);
  };

  const updateProgress = () => {
    scrollTicking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    rail.style.setProperty("--page-progress", progress.toFixed(4));

    if (max - window.scrollY <= 2) setActive(sections.at(-1).id);
  };

  const requestProgressUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateProgress);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      if (entry.isIntersecting) visibleSections.add(id);
      else visibleSections.delete(id);
    });

    if (!visibleSections.size) return;
    const anchor = window.innerHeight * 0.44;
    const strongest = sections
      .filter(({ id }) => visibleSections.has(id))
      .map(item => ({ ...item, distance: Math.abs(item.element.getBoundingClientRect().top - anchor) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (strongest) setActive(strongest.id);
  }, {
    rootMargin: "-38% 0px -52% 0px",
    threshold: [0, 0.01]
  });

  sections.forEach(({ element }) => observer.observe(element));

  const navigateToSection = (id, {
    updateHistory = true,
    moveFocus = true,
    behavior = reduceMotion ? "auto" : "smooth"
  } = {}) => {
    const target = document.getElementById(id);
    if (!target) return;

    const header = document.getElementById("main-nav");
    const headerOffset = (header?.getBoundingClientRect().height || 0) + 24;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset);
    setActive(id);
    window.scrollTo({ top, behavior });
    if (updateHistory && location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);

    if (moveFocus) {
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 450);
    }
  };

  links.forEach((link, id) => {
    link.addEventListener("click", event => {
      event.preventDefault();
      navigateToSection(id);
    });
  });

  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", () => {
    syncActiveFromViewport();
    requestProgressUpdate();
  });
  window.addEventListener("load", () => {
    const hashId = decodeURIComponent(location.hash.slice(1));
    if (links.has(hashId)) {
      navigateToSection(hashId, { updateHistory: false, moveFocus: false, behavior: "auto" });
    } else {
      syncActiveFromViewport();
    }
    requestProgressUpdate();
  }, { once: true });
  window.addEventListener("popstate", () => {
    const id = decodeURIComponent(location.hash.slice(1)) || sections[0].id;
    if (!links.has(id)) return;
    window.setTimeout(() => navigateToSection(id, { updateHistory: false, moveFocus: false }), 0);
  });

  syncActiveFromViewport();
  updateProgress();
}
