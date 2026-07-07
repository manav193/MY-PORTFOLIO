export function initCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector(".carousel__track");
  const slides = [...carousel.querySelectorAll("blockquote")];
  const dots = carousel.querySelector(".carousel__dots");
  let index = 0;
  let startX = 0;
  let timer = 0;

  slides.forEach((_, slideIndex) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show testimonial ${slideIndex + 1}`);
    dot.addEventListener("click", () => show(slideIndex));
    dots.append(dot);
  });

  const dotButtons = [...dots.children];

  const show = (next) => {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dotButtons.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
    window.clearInterval(timer);
    timer = window.setInterval(() => show(index + 1), 4800);
  };

  carousel.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
  });

  carousel.addEventListener("pointerup", (event) => {
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 42) show(index + (delta < 0 ? 1 : -1));
  });

  show(0);
}
