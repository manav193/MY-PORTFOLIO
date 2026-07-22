const selectedClass = "is-selected";

export function initCommandPalette() {
  const root = document.querySelector("[data-cmd-backdrop]");
  const trigger = document.querySelector("[data-cmd-trigger]");
  const input = root?.querySelector("#cmd-input");
  const results = root?.querySelector("#cmd-results");
  const themeAction = root?.querySelector("#cmd-theme-toggle");

  if (!root || !trigger || !input || !results) return;

  const items = Array.from(results.querySelectorAll(".cmd-item"));
  const groups = Array.from(results.querySelectorAll(".cmd-group"));
  let selectedIndex = 0;
  let previousFocus = null;

  const visibleItems = () => items.filter((item) => !item.hidden);

  const selectItem = (index) => {
    const visible = visibleItems();
    if (!visible.length) return;
    selectedIndex = (index + visible.length) % visible.length;
    items.forEach((item) => {
      const selected = item === visible[selectedIndex];
      item.classList.toggle(selectedClass, selected);
      item.setAttribute("aria-selected", String(selected));
    });
    visible[selectedIndex].scrollIntoView({ block: "nearest" });
  };

  const updateGroups = () => {
    groups.forEach((group) => {
      let sibling = group.nextElementSibling;
      let hasVisibleItem = false;
      while (sibling && !sibling.classList.contains("cmd-group")) {
        if (sibling.classList.contains("cmd-item") && !sibling.hidden) hasVisibleItem = true;
        sibling = sibling.nextElementSibling;
      }
      group.hidden = !hasVisibleItem;
    });
  };

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove("cmd-palette-open");
    input.value = "";
    items.forEach((item) => { item.hidden = false; });
    updateGroups();
    previousFocus?.focus?.({ preventScroll: true });
    previousFocus = null;
  };

  const open = () => {
    if (!root.hidden) return;
    previousFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("cmd-palette-open");
    selectedIndex = 0;
    selectItem(0);
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  };

  const activateTheme = () => {
    const buttons = Array.from(document.querySelectorAll(".theme-btn[data-theme-id]"));
    if (!buttons.length) return;
    const current = document.documentElement.getAttribute("data-theme");
    const currentIndex = buttons.findIndex((button) => button.dataset.themeId === current);
    buttons[(currentIndex + 1 + buttons.length) % buttons.length].click();
  };

  trigger.addEventListener("click", open);
  root.addEventListener("click", (event) => {
    if (event.target === root) close();
  });

  items.forEach((item) => {
    item.setAttribute("role", "option");
    item.addEventListener("pointermove", () => {
      const index = visibleItems().indexOf(item);
      if (index >= 0) selectItem(index);
    });
    item.addEventListener("click", () => {
      if (item === themeAction) activateTheme();
      close();
    });
  });

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    items.forEach((item) => {
      item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
    });
    updateGroups();
    selectItem(0);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      root.hidden ? open() : close();
      return;
    }

    if (root.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      selectItem(selectedIndex + (event.key === "ArrowDown" ? 1 : -1));
      return;
    }

    if (event.key === "Enter") {
      const selected = visibleItems()[selectedIndex];
      if (selected) {
        event.preventDefault();
        selected.click();
      }
      return;
    }

    if (event.key === "Tab") {
      const focusable = [input, ...visibleItems()];
      const currentIndex = focusable.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusable.length) % focusable.length
        : (currentIndex + 1) % focusable.length;
      event.preventDefault();
      focusable[nextIndex].focus();
    }
  }, true);
}
