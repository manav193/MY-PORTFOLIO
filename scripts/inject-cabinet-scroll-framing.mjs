import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const file = path.join(root, 'frontend', 'index.html');
const sourceFile = path.join(root, 'frontend', 'js', 'cabinet-scroll-framing.js');
const marker = 'data-cabinet-scroll-framing';
const source = fs.readFileSync(sourceFile, 'utf8').replace(/<\/script/gi, '<\\/script');
const script = `<script ${marker}>\n${source}\n</script>`;

let html = fs.readFileSync(file, 'utf8');
const existing = new RegExp(`<script[^>]*${marker}[^>]*>[\\s\\S]*?<\\/script>`, 'i');

if (existing.test(html)) {
  html = html.replace(existing, script);
} else {
  if (!/<\/body>/i.test(html)) throw new Error('Missing </body> in frontend/index.html');
  html = html.replace(/<\/body>/i, `${script}\n</body>`);
}

fs.writeFileSync(file, html);
console.log('Injected inline cabinet scroll framing controller.');
