import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const frontend = path.join(root, 'frontend');
const marker = 'data-case-study-mobile-fix';

const responsiveFix = `
<style ${marker}>
/* Global intrinsic sizing: media and layout blocks must never distort. */
body[data-project-theme],
body[data-project-theme] * { box-sizing: border-box; }
body[data-project-theme] main,
body[data-project-theme] section,
body[data-project-theme] article,
body[data-project-theme] header,
body[data-project-theme] footer,
body[data-project-theme] nav,
body[data-project-theme] div,
body[data-project-theme] figure { min-width: 0; }
body[data-project-theme] img,
body[data-project-theme] video,
body[data-project-theme] canvas,
body[data-project-theme] svg,
body[data-project-theme] iframe {
  max-width: 100%;
}
body[data-project-theme] img,
body[data-project-theme] video {
  height: auto !important;
}
body[data-project-theme] .cs-hero-img,
body[data-project-theme] .project-hero-image img,
body[data-project-theme] .cs-mag-large img,
body[data-project-theme] .cs-mag-card img,
body[data-project-theme] .cs-split-visual img,
body[data-project-theme] .cs-full-bleed img,
body[data-project-theme] .arcade-shot-grid img {
  width: 100%;
  height: auto !important;
  aspect-ratio: auto !important;
  object-fit: contain !important;
  object-position: center !important;
}
body[data-project-theme] :is(h1,h2,h3,h4,p,li,a,span,strong,small,code,pre) {
  overflow-wrap: anywhere;
  word-break: normal;
}
body[data-project-theme] pre,
body[data-project-theme] code { max-width: 100%; white-space: pre-wrap; }

@media (max-width: 1024px) {
  body[data-project-theme] :is(.cs-grid-layout,.cs-split,.cs-split.reversed,.cs-split-layout,.cs-overview-blocks,.cs-mag-split,.cs-grid,.arcade-architecture) {
    grid-template-columns: minmax(0,1fr) !important;
  }
  body[data-project-theme] :is(.cs-grid-col-4,.cs-grid-col-6,.cs-grid-col-8,.cs-grid-col-12) {
    grid-column: 1 !important;
    width: 100%;
  }
  body[data-project-theme] .cs-sticky-col,
  body[data-project-theme] .cs-split-content { position: static !important; top: auto !important; }
}

@media (max-width: 768px) {
  html, body[data-project-theme] { max-width: 100%; overflow-x: clip; }
  body[data-project-theme] .cs-premium-layout { padding-bottom: 64px; }
  body[data-project-theme] .cs-hero-cinematic,
  body[data-project-theme] .project-hero {
    min-height: auto !important;
    height: auto !important;
    justify-content: flex-start !important;
    padding: calc(92px + env(safe-area-inset-top,0px)) 18px 48px !important;
    overflow: visible !important;
  }
  body[data-project-theme] .cs-hero-content {
    width: 100%;
    max-width: 42rem;
    margin: 0 auto 28px !important;
  }
  body[data-project-theme] .cs-hero-title,
  body[data-project-theme] .project-hero h1 {
    font-size: clamp(2.35rem, 12vw, 4rem) !important;
    line-height: 1.02 !important;
    margin-bottom: 16px !important;
  }
  body[data-project-theme] .cs-hero-subtitle,
  body[data-project-theme] .project-hero p.tagline {
    font-size: clamp(.96rem, 4.3vw, 1.16rem) !important;
    line-height: 1.5 !important;
    max-width: 34rem;
  }
  body[data-project-theme] :is(.cs-hero-visual,.project-hero-image,.cs-split-visual,.cs-mag-large,.cs-mag-card,.cs-full-bleed-content,figure) {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    aspect-ratio: auto !important;
    border-radius: clamp(12px,4vw,18px) !important;
    overflow: hidden;
  }
  body[data-project-theme] .project-hero-image { margin-bottom: 56px !important; }
  body[data-project-theme] .cs-hero-stats {
    position: static !important;
    inset: auto !important;
    transform: none !important;
    width: 100% !important;
    margin: 16px 0 0 !important;
    display: grid !important;
    grid-template-columns: repeat(2,minmax(0,1fr)) !important;
    gap: 9px !important;
  }
  body[data-project-theme] .cs-stat-pill,
  body[data-project-theme] :is(.cs-tech-tag,.service-state,.metric-pill,.status-pill) {
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 10px 9px !important;
    border-radius: 11px !important;
    font-size: clamp(.66rem,3vw,.78rem) !important;
    line-height: 1.3 !important;
    white-space: normal !important;
    text-align: center !important;
    transform: none !important;
  }
  body[data-project-theme] :is(.cs-editorial-section,.cs-bg-alternate,.cs-full-bleed) {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    left: auto !important;
    right: auto !important;
    padding: clamp(56px,14vw,76px) 18px !important;
  }
  body[data-project-theme] :is(.cs-grid-layout,.cs-split-layout,.cs-overview-blocks,.cs-magazine-gallery,.cs-mag-split,.cs-feature-grid,.cs-design-list,.cs-grid,.arcade-architecture) {
    width: 100%;
    gap: clamp(18px,5vw,30px) !important;
  }
  body[data-project-theme] .cs-feature-grid { grid-template-columns: minmax(0,1fr) !important; }
  body[data-project-theme] :is(.cs-feature-grid li,.cs-glass-panel,.cs-overview-block,.cs-design-item,.cs-tech-stack,.arcade-architecture div) {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    height: auto !important;
    padding: clamp(18px,5vw,26px) !important;
    transform: none !important;
  }
  body[data-project-theme] .cs-section-heading {
    font-size: clamp(1.9rem,9vw,2.8rem) !important;
    line-height: 1.08 !important;
  }
  body[data-project-theme] :is(.cs-editorial-body,.cs-editorial-lead,.cs-overview-block p,.cs-design-item p,.cs-feature-grid li,.cs-bullet-list li) {
    font-size: clamp(.98rem,4vw,1.08rem) !important;
    line-height: 1.65 !important;
  }
  body[data-project-theme] .cs-tech-stack { display: grid !important; grid-template-columns: repeat(2,minmax(0,1fr)); }
  body[data-project-theme] :is(.progress-bar,.stat-row i,.meter,.bar,[class*="progress"],[class*="meter"]) {
    max-width: 100% !important;
    min-width: 0 !important;
    transform-origin: left center;
  }
  body[data-project-theme] .showroom-nav .nav-container {
    width: 100%;
    max-width: 100%;
    gap: 10px !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
  }
  body[data-project-theme] .showroom-nav .brand { flex: 0 0 auto; }
  body[data-project-theme] .project-nav-actions {
    min-width: 0;
    gap: 7px !important;
    justify-content: flex-end;
  }
  body[data-project-theme] .project-nav-actions a {
    min-width: 0 !important;
    width: auto !important;
    padding: 10px 12px !important;
    font-size: clamp(.72rem,3vw,.82rem) !important;
    white-space: nowrap;
  }
  body[data-project-theme] .project-actions {
    width: 100%;
    margin-bottom: 52px !important;
    flex-wrap: wrap;
  }
  body[data-project-theme] iframe,
  body[data-project-theme] video,
  body[data-project-theme] canvas {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    aspect-ratio: 16/9;
  }
}

@media (max-width: 420px) {
  body[data-project-theme] .cs-hero-stats,
  body[data-project-theme] .cs-tech-stack { grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important; }
  body[data-project-theme] .project-nav-actions .btn-secondary { display: none !important; }
  body[data-project-theme] .cs-stat-pill { font-size: .65rem !important; }
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

const files = fs.readdirSync(frontend).filter(name => /^project-.*\.html$/i.test(name));
const existingBlock = new RegExp(`<style\\s+${marker}>[\\s\\S]*?<\\/style>`, 'i');

for (const name of files) {
  const file = path.join(frontend, name);
  let html = fs.readFileSync(file, 'utf8');
  if (existingBlock.test(html)) {
    html = html.replace(existingBlock, responsiveFix.trim());
  } else {
    if (!/<\/head>/i.test(html)) throw new Error(`Missing </head> in ${name}`);
    html = html.replace(/<\/head>/i, `${responsiveFix}\n</head>`);
  }
  fs.writeFileSync(file, html);
}

console.log(`Applied responsive anti-stretch fixes to ${files.length} project pages.`);
