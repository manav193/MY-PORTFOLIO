import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('frontend');
const limits = {
  javascript: 900 * 1024,
  css: 700 * 1024,
  initialImages: 12,
  animationDeclarations: 180
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(ROOT);
const jsBytes = files.filter(file => file.endsWith('.js')).reduce((sum, file) => sum + fs.statSync(file).size, 0);
const cssFiles = files.filter(file => file.endsWith('.css'));
const cssBytes = cssFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const cssSource = cssFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const animationDeclarations = (cssSource.match(/\b(?:animation|transition)\s*:/g) || []).length;
const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const initialImages = [...homepage.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .filter(match => !/loading=["']lazy["']/i.test(match[0])).length;

const metrics = { javascript: jsBytes, css: cssBytes, initialImages, animationDeclarations };
const failures = [];
if (jsBytes > limits.javascript) failures.push(`JavaScript ${jsBytes} > ${limits.javascript}`);
if (cssBytes > limits.css) failures.push(`CSS ${cssBytes} > ${limits.css}`);
if (initialImages > limits.initialImages) failures.push(`Initial images ${initialImages} > ${limits.initialImages}`);
if (animationDeclarations > limits.animationDeclarations) failures.push(`Animation layer count ${animationDeclarations} > ${limits.animationDeclarations}`);

console.table({
  JavaScript: { value: `${(jsBytes / 1024).toFixed(1)} KB`, budget: `${limits.javascript / 1024} KB` },
  CSS: { value: `${(cssBytes / 1024).toFixed(1)} KB`, budget: `${limits.css / 1024} KB` },
  'Initial images': { value: initialImages, budget: limits.initialImages },
  'Animation declarations': { value: animationDeclarations, budget: limits.animationDeclarations }
});

if (failures.length) {
  failures.forEach(item => console.error(`Budget exceeded: ${item}`));
  process.exit(1);
}
console.log('Performance budgets passed.');
