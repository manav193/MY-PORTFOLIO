import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const frontend = path.join(root, 'frontend');
const marker = 'data-case-study-top-gap-fix';

const fix = `
<style ${marker}>
/* Compact shared case-study header. The fixed showroom navigation is roughly
   56-64px high, so the hero only needs a small breathing space below it. */
body[data-project-theme] main {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
  min-height: 0 !important;
  height: auto !important;
  justify-content: flex-start !important;
  align-content: start !important;
  gap: clamp(20px, 3vw, 36px) !important;
  padding-top: calc(68px + env(safe-area-inset-top, 0px)) !important;
  padding-bottom: clamp(30px, 4vw, 52px) !important;
  margin: 0 !important;
}

body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) > :first-child,
body[data-project-theme] .cs-hero-content {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

body[data-project-theme] .project-hero h1,
body[data-project-theme] .cs-hero-title,
body[data-project-theme] .cs-meta {
  margin-top: 0 !important;
}

body[data-project-theme] .cs-meta {
  margin-bottom: 12px !important;
}

body[data-project-theme] .project-actions {
  margin-top: 24px !important;
  margin-bottom: clamp(24px, 3vw, 44px) !important;
}

body[data-project-theme] .project-hero-image,
body[data-project-theme] .cs-hero-visual,
body[data-project-theme] .cs-hero-stats {
  margin-top: 0 !important;
}

@media (max-width: 1024px) {
  body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
    gap: 22px !important;
    padding-top: calc(64px + env(safe-area-inset-top, 0px)) !important;
    padding-bottom: 36px !important;
  }
}

@media (max-width: 768px) {
  body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
    gap: 18px !important;
    padding-top: calc(58px + env(safe-area-inset-top, 0px)) !important;
    padding-bottom: 28px !important;
  }
  body[data-project-theme] .project-actions {
    margin-top: 18px !important;
    margin-bottom: 24px !important;
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

console.log(`Normalized compact top spacing on ${files.length} project pages.`);
