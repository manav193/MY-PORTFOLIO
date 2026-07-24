import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const root = process.cwd();
const indexPath = path.join(root, 'frontend', 'index.html');
const nimoPath = path.join(root, 'frontend', 'js', 'modules', 'nimo.js');
const buildPath = path.join(root, 'build.js');
const generatedBuildPath = path.join(root, '.build-runtime.mjs');

const originals = new Map();

function remember(filePath) {
  if (!originals.has(filePath)) originals.set(filePath, fs.readFileSync(filePath, 'utf8'));
  return originals.get(filePath);
}

function isRetiredSelfyyObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const directText = Object.entries(value)
    .filter(([key]) => !['itemListElement', '@graph'].includes(key))
    .map(([, item]) => typeof item === 'string' ? item : '')
    .join(' ');
  return /\bselfyy\b/i.test(directText);
}

function pruneStructuredData(value) {
  if (Array.isArray(value)) {
    return value
      .filter(item => !isRetiredSelfyyObject(item))
      .map(pruneStructuredData);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = pruneStructuredData(value[key]);
  }
  return value;
}

function sanitizeIndex() {
  let html = remember(indexPath);

  html = html.replace(/\s*<article\b[^>]*data-project-id=["']selfyy["'][\s\S]*?<\/article>/i, '');

  html = html.replace(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi, (full, jsonText) => {
    if (!/selfyy/i.test(jsonText)) return full;
    try {
      const parsed = JSON.parse(jsonText);
      const cleaned = pruneStructuredData(parsed);
      return `<script type="application/ld+json">\n${JSON.stringify(cleaned, null, 2)}\n</script>`;
    } catch {
      return full.replace(/,?\s*\{[^{}]*"url"\s*:\s*"https:\/\/selfyy\.vercel\.app\/"[^{}]*\}/gi, '');
    }
  });

  fs.writeFileSync(indexPath, html);
}

function sanitizeNimoKnowledge() {
  let source = remember(nimoPath);
  source = source.replace(/\n\s*\{\s*\n\s*id:\s*['"]selfyy['"][\s\S]*?\n\s*\},(?=\s*\n\s*\{)/i, '');
  fs.writeFileSync(nimoPath, source);
}

function createRuntimeBuild() {
  let source = remember(buildPath);
  source = source.replace(/\n\s*'images\/selfyy-preview\.webp',?/g, '');
  source = source.replace(/\n\s*process\.exit\(1\);\s*\n\s*}\s*\n}\s*\n\s*main\(\);\s*$/m,
    '\n    throw error;\n  }\n}\n\nawait main();\n');
  if (!source.includes('await main();')) {
    source = source.replace(/main\(\);\s*$/, 'await main();');
  }
  fs.writeFileSync(generatedBuildPath, source);
}

function restore() {
  for (const [filePath, content] of originals) fs.writeFileSync(filePath, content);
  if (fs.existsSync(generatedBuildPath)) fs.rmSync(generatedBuildPath, { force: true });
}

try {
  sanitizeIndex();
  sanitizeNimoKnowledge();
  createRuntimeBuild();
  await import(`${pathToFileURL(generatedBuildPath).href}?t=${Date.now()}`);
} finally {
  restore();
}
