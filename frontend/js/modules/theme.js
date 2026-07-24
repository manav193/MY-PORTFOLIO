const storageKey = "portfolio-theme";

export function initTheme() {
  if (document.body?.hasAttribute('data-project-theme') || document.documentElement?.hasAttribute('data-project-theme')) {
    return;
  }

  const root = document.documentElement;
  const button = document.querySelector("[data-theme-toggle]");
  const icon = document.querySelector("[data-theme-icon]");
  const saved = localStorage.getItem(storageKey);
  const preferred = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const theme = saved || preferred;

  root.dataset.theme = theme;
  updateIcon(icon, theme);

  button?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(storageKey, next);
    updateIcon(icon, next);
  });
}

function updateIcon(icon, theme) {
  if (icon) icon.textContent = theme === "dark" ? "Dark" : "Light";
}
