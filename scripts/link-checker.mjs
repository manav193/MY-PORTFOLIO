import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('frontend');
const htmlFiles = fs.readdirSync(ROOT).filter(name => name.endsWith('.html'));
const failures = [];
const external = new Set();

function clean(value) {
  return value.trim().replace(/&amp;/g, '&').split('#')[0].split('?')[0];
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const attrs = [...source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)];
  for (const [, raw] of attrs) {
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('data:') || raw.startsWith('javascript:') || raw.includes('{{')) continue;
    if (/^https?:\/\//i.test(raw)) {
      if (/github\.com|vercel\.app|workers\.dev/i.test(raw)) external.add(raw);
      continue;
    }
    const target = clean(raw);
    if (!target) continue;
    const resolved = target.startsWith('/')
      ? path.join(ROOT, target)
      : path.resolve(ROOT, path.dirname(file), target);
    if (!fs.existsSync(resolved)) failures.push(`${file}: missing ${raw}`);
  }
}

for (const url of external) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    if (response.status >= 400 && response.status !== 405 && response.status !== 403) failures.push(`external ${url}: HTTP ${response.status}`);
  } catch (error) {
    failures.push(`external ${url}: ${error.name === 'AbortError' ? 'timeout' : error.message}`);
  }
}

if (failures.length) {
  console.error(`Link check failed (${failures.length})`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Link check passed: ${htmlFiles.length} pages, ${external.size} selected external targets.`);
