import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const file = path.join(root, 'frontend', 'index.html');
const marker = 'data-cabinet-scroll-framing';
const script = `<script src="/js/cabinet-scroll-framing.js" defer ${marker}></script>`;

let html = fs.readFileSync(file, 'utf8');
const existing = new RegExp(`<script[^>]*${marker}[^>]*><\\/script>`, 'i');

if (existing.test(html)) {
  html = html.replace(existing, script);
} else {
  if (!/<\/body>/i.test(html)) throw new Error('Missing </body> in frontend/index.html');
  html = html.replace(/<\/body>/i, `${script}\n</body>`);
}

fs.writeFileSync(file, html);
console.log('Injected cabinet scroll framing controller.');
