const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const isCompactViewport = window.matchMedia('(max-width: 1024px)').matches;

if (isCoarsePointer || isCompactViewport) {
  document.documentElement.classList.add('arcade-mobile-mode');

  const ensureStyles = () => {
    if (document.querySelector('link[data-arcade-mobile]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './css/arcade-mobile.css';
    link.dataset.arcadeMobile = 'true';
    document.head.appendChild(link);
  };

  const emit = (eventName) => {
    const bus = window.ArcadeEventBus;
    if (bus && typeof bus.emit === 'function') bus.emit(eventName);
  };

  const bindPress = (button, eventName) => {
    const press = (event) => {
      event.preventDefault();
      button.classList.add('is-pressed');
      emit(eventName);
    };

    const release = () => button.classList.remove('is-pressed');

    button.addEventListener('pointerdown', press, { passive: false });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  };

  const installControls = () => {
    const screen = document.getElementById('cabinet-screen');
    if (!screen || screen.querySelector('.arcade-touch-controls')) return;

    const controls = document.createElement('div');
    controls.className = 'arcade-touch-controls';
    controls.setAttribute('aria-label', 'Arcade touch controls');
    controls.innerHTML = `
      <div class="arcade-touch-dpad" aria-label="Directional controls">
        <button class="arcade-touch-btn arcade-touch-up" type="button" aria-label="Up">▲</button>
        <button class="arcade-touch-btn arcade-touch-left" type="button" aria-label="Left">◀</button>
        <button class="arcade-touch-btn arcade-touch-right" type="button" aria-label="Right">▶</button>
        <button class="arcade-touch-btn arcade-touch-down" type="button" aria-label="Down">▼</button>
      </div>
      <div class="arcade-touch-actions" aria-label="Action controls">
        <button class="arcade-touch-btn arcade-touch-a" type="button" aria-label="Action A">A</button>
        <button class="arcade-touch-btn arcade-touch-b" type="button" aria-label="Action B">B</button>
        <button class="arcade-touch-btn arcade-touch-back" type="button" aria-label="Back">BACK</button>
      </div>
    `;

    screen.appendChild(controls);

    bindPress(controls.querySelector('.arcade-touch-up'), 'ARCADE_UP');
    bindPress(controls.querySelector('.arcade-touch-down'), 'ARCADE_DOWN');
    bindPress(controls.querySelector('.arcade-touch-left'), 'ARCADE_LEFT');
    bindPress(controls.querySelector('.arcade-touch-right'), 'ARCADE_RIGHT');
    bindPress(controls.querySelector('.arcade-touch-a'), 'ARCADE_ACTION_A');
    bindPress(controls.querySelector('.arcade-touch-b'), 'ARCADE_ACTION_B');
    bindPress(controls.querySelector('.arcade-touch-back'), 'ARCADE_BACK');

    controls.querySelector('.arcade-touch-a').addEventListener('pointerdown', (event) => {
      event.preventDefault();
      emit('ARCADE_CONFIRM');
    }, { passive: false });
  };

  const optimizeMobileRuntime = () => {
    const root = document.documentElement;
    root.style.setProperty('--arcade-mobile-performance', '1');

    const screen = document.getElementById('cabinet-screen');
    if (screen) {
      screen.style.contain = 'layout paint size';
      screen.style.willChange = 'auto';
    }

    document.querySelectorAll('canvas').forEach((canvas) => {
      canvas.style.imageRendering = 'pixelated';
      canvas.style.touchAction = 'none';
    });
  };

  ensureStyles();

  const boot = () => {
    installControls();
    optimizeMobileRuntime();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  const observer = new MutationObserver(() => {
    installControls();
    optimizeMobileRuntime();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}
