const phrases = [
  "fast web products.",
  "AI-powered workflows.",
  "premium interfaces.",
  "game-like interactions."
];

export function initTyping() {
  const target = document.querySelector("[data-typing]");
  if (!target) return;

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const phrase = phrases[phraseIndex];
    target.textContent = phrase.slice(0, charIndex);

    if (!deleting && charIndex < phrase.length) {
      charIndex += 1;
      setTimeout(tick, 52);
      return;
    }

    if (!deleting) {
      deleting = true;
      setTimeout(tick, 1200);
      return;
    }

    if (charIndex > 0) {
      charIndex -= 1;
      setTimeout(tick, 28);
      return;
    }

    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(tick, 180);
  };

  tick();
}
