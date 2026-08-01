import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const frontend = path.join(root, 'frontend');
const marker = 'data-case-study-top-gap-fix';

const fix = `
<style ${marker}>
/* Deterministic case-study hero flow.
   Remove viewport-height centering and any transform/position rules that can
   push the title below decorative artwork or background motifs. */
body[data-project-theme] main {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
  display: block !important;
  min-height: 0 !important;
  height: auto !important;
  padding: calc(72px + env(safe-area-inset-top, 0px)) 24px 44px !important;
  margin: 0 !important;
  overflow: visible !important;
}

body[data-project-theme] .cs-hero-content,
body[data-project-theme] .project-hero > :first-child {
  display: block !important;
  position: relative !important;
  inset: auto !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  order: -10 !important;
  transform: none !important;
  translate: none !important;
  width: min(100%, 900px) !important;
  max-width: 900px !important;
  margin: 0 auto 28px !important;
  padding: 0 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

body[data-project-theme] :is(.cs-meta, .cs-hero-title, .cs-hero-subtitle, .project-hero h1, .project-hero p.tagline) {
  position: relative !important;
  inset: auto !important;
  transform: none !important;
  translate: none !important;
  opacity: 1 !important;
  visibility: visible !important;
}

body[data-project-theme] .cs-meta,
body[data-project-theme] .project-hero p.tagline {
  margin-top: 0 !important;
  margin-bottom: 12px !important;
}

body[data-project-theme] .cs-hero-title,
body[data-project-theme] .project-hero h1 {
  margin-top: 0 !important;
  margin-bottom: 18px !important;
}

body[data-project-theme] .project-actions {
  margin-top: 22px !important;
  margin-bottom: 24px !important;
}

body[data-project-theme] .cs-hero-visual,
body[data-project-theme] .project-hero-image {
  display: block !important;
  position: relative !important;
  inset: auto !important;
  transform: none !important;
  translate: none !important;
  width: min(100%, 1400px) !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 auto 32px !important;
}

body[data-project-theme] .cs-hero-stats {
  position: static !important;
  inset: auto !important;
  transform: none !important;
  translate: none !important;
  width: min(100%, 900px) !important;
  margin: 16px auto 0 !important;
}

@media (max-width: 1024px) {
  body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
    padding: calc(64px + env(safe-area-inset-top, 0px)) 20px 36px !important;
  }
}

@media (max-width: 768px) {
  body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
    padding: calc(54px + env(safe-area-inset-top, 0px)) 16px 28px !important;
  }

  body[data-project-theme] .cs-hero-content,
  body[data-project-theme] .project-hero > :first-child {
    margin-bottom: 20px !important;
  }

  body[data-project-theme] .project-actions {
    margin-top: 16px !important;
    margin-bottom: 20px !important;
  }
}
</style>`;

const files = fs.readdirSync(frontend).filter(name => /^project-.*\.html$/i.test(name));
const existingBlock = new RegExp(`<style\\s+${marker}>[\\s\\S]*?<\\/style>`, 'i');

for (const name of files) {
  const file = path.join(frontend, name);
  let html = fs.readFileSync(file, 'utf8');
  if (existingBlock.test(html)) {
    html = html.replace(existingBlock, fix.trim());
  } else {
    if (!/<\/head>/i.test(html)) throw new Error(`Missing </head> in ${name}`);
    html = html.replace(/<\/head>/i, `${fix}\n</head>`);
  }
  fs.writeFileSync(file, html);
}

console.log(`Forced normal-flow hero layout on ${files.length} project pages.`);
