import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as HtmlMinifier from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'frontend');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) throw new Error('QA post-build: dist/index.html is missing.');

let html = fs.readFileSync(indexPath, 'utf8');
const nimoCardPattern = /(<article[^>]*data-project-id="nimo"[\s\S]*?<div class="project-actions">[\s\S]*?<a href=")https:\/\/github\.com\/manav193\/MY-PORTFOLIO("[^>]*>GitHub<\/a>)/;
if (!nimoCardPattern.test(html)) throw new Error('QA post-build: NIMO GitHub link could not be validated.');
html = html.replace(nimoCardPattern, '$1https://github.com/manav193/NIMO-CORE$2');
fs.writeFileSync(indexPath, html);

const privacySource = path.join(frontendDir, 'privacy.html');
const privacyOutput = path.join(distDir, 'privacy.html');
if (!fs.existsSync(privacySource)) throw new Error('QA post-build: frontend/privacy.html is missing.');
let privacy = fs.readFileSync(privacySource, 'utf8');
privacy = await HtmlMinifier.minify(privacy, {
  collapseWhitespace: true,
  removeComments: true,
  minifyJS: true,
  minifyCSS: true,
  removeRedundantAttributes: true,
  useShortDoctype: true
});
fs.writeFileSync(privacyOutput, privacy);

if (!privacy.includes('NIMO') || !privacy.includes('localStorage') || !privacy.includes('Contact form')) {
  throw new Error('QA post-build: privacy disclosures are incomplete.');
}

console.log('QA post-build: project links and privacy route verified.');
