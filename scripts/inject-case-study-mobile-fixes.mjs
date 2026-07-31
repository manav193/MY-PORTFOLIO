import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const frontend = path.join(root, 'frontend');
const marker = 'data-case-study-mobile-fix';

const mobileFix = `
<style ${marker}>
@media (max-width: 768px) {
  body[data-project-theme] .cs-premium-layout { padding-bottom: 72px; }
  body[data-project-theme] .cs-hero-cinematic {
    min-height: auto !important;
    height: auto !important;
    justify-content: flex-start !important;
    padding: calc(96px + env(safe-area-inset-top, 0px)) 20px 56px !important;
    overflow: visible;
  }
  body[data-project-theme] .cs-hero-content {
    width: 100%;
    margin: 0 auto 32px !important;
  }
  body[data-project-theme] .cs-hero-title {
    font-size: clamp(2.65rem, 14vw, 4.2rem) !important;
    margin-bottom: 18px;
  }
  body[data-project-theme] .cs-hero-subtitle {
    font-size: clamp(1rem, 4.8vw, 1.2rem) !important;
    max-width: 34rem;
  }
  body[data-project-theme] .cs-hero-visual {
    width: 100%;
    max-width: 100%;
    border-radius: 16px;
    transform-origin: center top;
  }
  body[data-project-theme] .cs-hero-img {
    width: 100%;
    border-radius: 16px;
  }
  body[data-project-theme] .cs-hero-stats {
    position: static !important;
    inset: auto !important;
    transform: none !important;
    width: 100% !important;
    margin: 18px 0 0 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }
  body[data-project-theme] .cs-stat-pill {
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    padding: 10px 8px !important;
    border-radius: 12px !important;
    font-size: 0.68rem !important;
    line-height: 1.25 !important;
    white-space: normal !important;
    text-align: center !important;
    transform: none !important;
  }
  body[data-project-theme] .cs-editorial-section,
  body[data-project-theme] .cs-bg-alternate {
    padding: 72px 20px !important;
  }
  body[data-project-theme] .cs-grid-layout { gap: 30px; }
  body[data-project-theme] .cs-section-heading {
    font-size: clamp(2rem, 10vw, 3rem);
  }
  body[data-project-theme] .showroom-nav .nav-container {
    gap: 14px;
    padding-left: 18px;
    padding-right: 18px;
  }
  body[data-project-theme] .project-nav-actions { gap: 8px; }
  body[data-project-theme] .project-nav-actions a {
    padding: 11px 14px;
    font-size: 0.82rem;
  }
}
@media (max-width: 420px) {
  body[data-project-theme] .cs-hero-stats { grid-template-columns: 1fr 1fr !important; }
  body[data-project-theme] .project-nav-actions .btn-secondary { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  body[data-project-theme] .reveal-text,
  body[data-project-theme] .reveal-scale {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }
}
</style>`;

const files = fs.readdirSync(frontend)
  .filter(name => /^project-.*\.html$/i.test(name));

for (const name of files) {
  const file = path.join(frontend, name);
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(marker)) continue;
  if (!/<\/head>/i.test(html)) throw new Error(`Missing </head> in ${name}`);
  html = html.replace(/<\/head>/i, `${mobileFix}\n</head>`);
  fs.writeFileSync(file, html);
}

console.log(`Applied mobile case-study layout fix to ${files.length} project pages.`);
