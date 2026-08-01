const LABELS = {
  'arcade-os': 'ARCADEOS // CASE STUDY',
  arcade: 'ARCADEOS // CASE STUDY',
  nimo: 'NIMO // CASE STUDY',
  toolverse: 'TOOLVERSE // CASE STUDY',
  'shift-zero': 'SHIFT ZERO // CASE STUDY',
  love: 'LOVE // CASE STUDY',
  promptai: 'PROMPT AI // CASE STUDY',
  nintendo: 'NINTENDO UI // CASE STUDY',
  nike: 'NIKE UI // CASE STUDY',
  velora: 'VELORA BITES // CASE STUDY'
};

function getTheme() {
  const raw = (document.body?.dataset.projectTheme || 'project').toLowerCase();
  if (raw.includes('vel')) return 'velora';
  if (raw.includes('shift')) return 'shift-zero';
  return raw;
}

function ensureStyle() {
  if (document.getElementById('case-study-boot-style')) return;
  const style = document.createElement('style');
  style.id = 'case-study-boot-style';
  style.textContent = `
    .case-study-boot {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      width: 100vw;
      height: 100dvh;
      margin: 0;
      padding: 24px;
      overflow: hidden;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 40%, rgba(56,189,248,.12), transparent 38%),
        linear-gradient(180deg, #05070b, #090d14);
      opacity: 1;
      transform: translateZ(0);
      transition: opacity .42s ease, visibility .42s ease;
      contain: strict;
    }
    .case-study-boot::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
      background-size: 28px 28px;
      mask-image: linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent);
    }
    .case-study-boot__panel {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 16px;
      width: min(520px, 88vw);
      text-align: center;
      color: #eef7ff;
      font-family: 'JetBrains Mono', monospace;
      animation: caseStudyBootIn .55s cubic-bezier(.16,1,.3,1) both;
    }
    .case-study-boot__mark {
      width: 54px;
      aspect-ratio: 1;
      border-radius: 14px;
      border: 1px solid rgba(103,232,249,.35);
      background:
        linear-gradient(135deg, rgba(34,211,238,.9), rgba(168,85,247,.9));
      box-shadow: 0 0 42px rgba(56,189,248,.26);
      animation: caseStudyBootPulse 1s ease-in-out infinite alternate;
    }
    .case-study-boot__label {
      margin: 0;
      font-size: clamp(.76rem, 2.5vw, .95rem);
      letter-spacing: .2em;
      text-transform: uppercase;
      color: #9bdcff;
    }
    .case-study-boot__line {
      width: min(320px, 72vw);
      height: 2px;
      overflow: hidden;
      background: rgba(255,255,255,.08);
    }
    .case-study-boot__line::after {
      content: '';
      display: block;
      width: 42%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #67e8f9, #c084fc, transparent);
      animation: caseStudyBootScan .9s ease-in-out infinite;
    }
    .case-study-boot.is-exiting {
      opacity: 0;
      visibility: hidden;
    }
    @keyframes caseStudyBootIn {
      from { opacity: 0; transform: translateY(14px) scale(.98); }
      to { opacity: 1; transform: none; }
    }
    @keyframes caseStudyBootPulse {
      to { transform: scale(1.05); filter: brightness(1.15); }
    }
    @keyframes caseStudyBootScan {
      from { transform: translateX(-120%); }
      to { transform: translateX(340%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .case-study-boot,
      .case-study-boot__panel,
      .case-study-boot__mark,
      .case-study-boot__line::after {
        animation: none !important;
        transition-duration: .12s !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export function initCaseStudyBoot() {
  if (!document.body?.dataset.projectTheme) return;
  if (document.querySelector('.case-study-boot')) return;

  ensureStyle();
  const theme = getTheme();
  const label = LABELS[theme] || `${theme.replace(/[-_]+/g, ' ').toUpperCase()} // CASE STUDY`;
  const overlay = document.createElement('div');
  overlay.className = 'case-study-boot';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="case-study-boot__panel">
      <div class="case-study-boot__mark"></div>
      <p class="case-study-boot__label">${label}</p>
      <div class="case-study-boot__line"></div>
    </div>`;

  document.body.appendChild(overlay);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = reduced ? 180 : 850;
  const exit = reduced ? 120 : 420;

  window.setTimeout(() => {
    overlay.classList.add('is-exiting');
    window.setTimeout(() => overlay.remove(), exit + 40);
  }, hold);
}
