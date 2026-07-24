import fs from 'fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, value) { fs.writeFileSync(file, value); }
function replace(file, transform) {
  const before = read(file);
  const after = transform(before);
  if (after !== before) write(file, after);
}

function isRetiredObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const direct = Object.entries(value)
    .filter(([key]) => !['itemListElement', '@graph'].includes(key))
    .map(([, item]) => typeof item === 'string' ? item : '')
    .join(' ');
  return /\bselfyy\b/i.test(direct);
}

function prune(value) {
  if (Array.isArray(value)) return value.filter(item => !isRetiredObject(item)).map(prune);
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(key => { value[key] = prune(value[key]); });
  }
  return value;
}

replace('frontend/index.html', html => {
  html = html.replace(/\s*<article\b[^>]*data-project-id=["']selfyy["'][\s\S]*?<\/article>/i, '');
  html = html.replace(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi, (full, body) => {
    if (!/selfyy/i.test(body)) return full;
    try { return `<script type="application/ld+json">\n${JSON.stringify(prune(JSON.parse(body)), null, 2)}\n</script>`; }
    catch { return full; }
  });
  let projectIndex = 0;
  html = html.replace(/<span class="project-index">\d+<\/span>/g, () => `<span class="project-index">${String(++projectIndex).padStart(2, '0')}</span>`);
  html = html.replace('Three games, two creative tools, eight system routes', 'Multiple playable games, creative tools, system routes');
  return html;
});

replace('frontend/js/modules/nimo.js', source => source
  .replace(/\n\s*\{\s*\n\s*id:\s*['"]selfyy['"][\s\S]*?\n\s*\},(?=\s*\n\s*\{)/i, '')
  .replace('featuring 3 playable retro games, 2 creative tools,', 'featuring multiple playable games, creative tools,'));

replace('build.js', source => source
  .replace(/\n\s*'project-selfyy\.html',?/g, '')
  .replace(/\n\s*'images\/selfyy-preview\.webp',?/g, ''));

replace('build_case_studies.js', source => source
  .replace(/\n\s*\{ id: 'selfyy',[^\n]*\},?/g, '')
  .replace("next: 'selfyy', prev: 'nike', nextTitle: 'SELFYY'", "next: 'love-journey', prev: 'nike', nextTitle: 'Love Journey'")
  .replace("next: 'love-journey', prev: 'selfyy', nextTitle: 'Love Journey', prevTitle: 'SELFYY'", "next: 'shift-zero', prev: 'toolverse', nextTitle: 'SHIFT ZERO', prevTitle: 'ToolVerse'"));

replace('frontend/css/project-page.css', css => css
  .replace(/\n\/\* 7\. SELFYY:[\s\S]*?@keyframes selfyyShift \{[^}]*\}\s*/i, '\n')
  .replace(/\n\[data-project-theme="selfyy"\] \{[\s\S]*?\n\}\s*/i, '\n'));

replace('backend/src/services/openrouter.js', source => source
  .replace(/, SELFYY \(cinematic memories\)/g, '')
  .replace(/SELFYY \(cinematic memories\),\s*/g, ''));

replace('frontend/assets/case-studies/resume-ai.html', source => source
  .replace(/ToolVerse, SELFYY, SHIFT-ZERO, and FATE AI/g, 'ToolVerse, SHIFT-ZERO, and FATE AI'));

for (const file of ['tests/case-study-shell.spec.js', 'tests/final-production-qa.spec.js']) {
  replace(file, source => source.replace(/\n\s*'project-selfyy\.html',?/g, ''));
}

replace('test-portfolio-works.js', source => source
  .replace('MY-PORTFOLIO / ArcadeOS|ToolVerse|SELFYY|SHIFT-ZERO|LOVE', 'MY-PORTFOLIO / ArcadeOS|ToolVerse|SHIFT-ZERO|LOVE|Velora Bites'));

if (fs.existsSync('test-4-regressions.js')) fs.rmSync('test-4-regressions.js');
if (fs.existsSync('frontend/project-selfyy.html')) fs.rmSync('frontend/project-selfyy.html');

console.log('One-time portfolio source cleanup complete.');
