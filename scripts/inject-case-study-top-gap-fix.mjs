import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const frontend = path.join(root, 'frontend');
const marker = 'data-case-study-top-gap-fix';

const fix = `
<style ${marker}>
/* Shared case-study hero rhythm: content starts below the fixed navigation,
   never vertically centered inside an artificial viewport-height spacer. */
body[data-project-theme] main {
  padding-top: 0 !important;
}

body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
  min-height: 0 !important;
  height: auto !important;
  justify-content: flex-start !important;
  padding-top: clamp(104px, 10vw, 136px) !important;
  padding-bottom: clamp(44px, 6vw, 76px) !important;
  margin-top: 0 !important;
}

body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) > :first-child {
  margin-top: 0 !important;
}

body[data-project-theme] .project-hero h1,
body[data-project-theme] .cs-hero-title {
  margin-top: 0 !important;
}

/* Prevent the first hero visual/action block from recreating a second
   viewport-sized gap below the heading. */
body[data-project-theme] .project-actions {
  margin-bottom: clamp(36px, 5vw, 72px) !important;
}
body[data-project-theme] .project-hero-image,
body[data-project-theme] .cs-hero-visual {
  margin-top: 0 !important;
}

@media (max-width: 1024px) {
  body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
    padding-top: calc(88px + env(safe-area-inset-top, 0px)) !important;
    padding-bottom: 48px !important;
  }
}

@media (max-width: 768px) {
  body[data-project-theme] :is(.project-hero, .cs-hero-cinematic) {
    padding-top: calc(76px + env(safe-area-inset-top, 0px)) !important;
    padding-bottom: 36px !important;
  }
  body[data-project-theme] .project-actions {
    margin-bottom: 32px !important;
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

console.log(`Normalized top spacing on ${files.length} project pages.`);
