export function initProjects() {
  const search = document.querySelector("[data-project-search]");
  const filters = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll(".project-card");
  let active = "all";

  const apply = () => {
    const query = (search?.value || "").trim().toLowerCase();
    cards.forEach((card) => {
      const categories = card.dataset.category || "";
      const title = (card.dataset.title || "").toLowerCase();
      const text = card.textContent.toLowerCase();
      const matchesFilter = active === "all" || categories.includes(active);
      const matchesSearch = !query || title.includes(query) || text.includes(query);
      card.hidden = !(matchesFilter && matchesSearch);
    });
  };

  search?.addEventListener("input", apply);
  filters.forEach((button) => {
    button.addEventListener("click", () => {
      active = button.dataset.filter || "all";
      filters.forEach((filter) => filter.classList.toggle("is-active", filter === button));
      apply();
    });
  });
}
