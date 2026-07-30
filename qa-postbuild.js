import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  throw new Error('QA post-build: dist/index.html is missing.');
}

let html = fs.readFileSync(indexPath, 'utf8');
const nimoCardPattern = /(<article[^>]*data-project-id="nimo"[\s\S]*?<div class="project-actions">[\s\S]*?<a href=")https:\/\/github\.com\/manav193\/MY-PORTFOLIO("[^>]*>GitHub<\/a>)/;

if (!nimoCardPattern.test(html)) {
  throw new Error('QA post-build: NIMO GitHub link could not be validated.');
}

html = html.replace(nimoCardPattern, '$1https://github.com/manav193/NIMO-CORE$2');
fs.writeFileSync(indexPath, html);
console.log('QA post-build: portfolio link integrity verified.');