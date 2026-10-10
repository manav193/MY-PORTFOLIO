import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_ROOT = path.resolve('frontend');
const DIST_ROOT = path.resolve('dist');
const limits = {
  initialJavaScript: 900 * 1024,
  shippedCss: 700 * 1024,
  initialImages: 12
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sumBytes(files) {
  return files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

if (!fs.existsSync(path.join(DIST_ROOT, 'index.html'))) {
  console.error('Performance budget check requires a production build. Run "npm run build" first.');
  process.exit(2);
}

const sourceFiles = walk(FRONTEND_ROOT);
const sourceJs = sourceFiles.filter(file => file.endsWith('.js'));
const sourceCss = sourceFiles.filter(file => file.endsWith('.css'));
const distFiles = walk(DIST_ROOT);
const distJs = distFiles.filter(file => file.endsWith('.js'));
const distCss = distFiles.filter(file => file.endsWith('.css'));
const entryJs = path.join(DIST_ROOT, 'js', 'main.js');

if (!fs.existsSync(entryJs)) {
  console.error('Performance budget check could not find dist/js/main.js. Verify the production build output.');
  process.exit(2);
}

const sourceJsBytes = sumBytes(sourceJs);
const sourceCssBytes = sumBytes(sourceCss);
const entryJsBytes = fs.statSync(entryJs).size;
const shippedJsBytes = sumBytes(distJs);
const shippedCssBytes = sumBytes(distCss);
const productionCss = distCss.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const productionAnimationDeclarations =
  (productionCss.match(/\b(?:animation|transition)\s*:/g) || []).length;
const homepage = fs.readFileSync(path.join(DIST_ROOT, 'index.html'), 'utf8');
const initialImages = [...homepage.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .filter(match => !/\bloading=["']lazy["']/i.test(match[0])).length;

const failures = [];
if (entryJsBytes > limits.initialJavaScript) {
  failures.push(`Initial JavaScript entry ${entryJsBytes} bytes exceeds ${limits.initialJavaScript} bytes`);
}
if (shippedCssBytes > limits.shippedCss) {
  failures.push(`Shipped CSS ${shippedCssBytes} bytes exceeds ${limits.shippedCss} bytes`);
}
if (initialImages > limits.initialImages) {
  failures.push(`Initial images ${initialImages} exceeds ${limits.initialImages}`);
}

console.table({
  'Initial JS entry (dist/js/main.js)': {
    value: formatKB(entryJsBytes),
    budget: formatKB(limits.initialJavaScript)
  },
  'All shipped JavaScript (informational)': {
    value: formatKB(shippedJsBytes),
    budget: 'informational'
  },
  'All shipped CSS (dist/**/*.css)': {
    value: formatKB(shippedCssBytes),
    budget: formatKB(limits.shippedCss)
  },
  'Initial non-lazy images (built homepage)': {
    value: initialImages,
    budget: limits.initialImages
  },
  'Source JavaScript inventory (informational)': {
    value: formatKB(sourceJsBytes),
    budget: 'not a download-size budget'
  },
  'Source CSS inventory (informational)': {
    value: formatKB(sourceCssBytes),
    budget: 'not a download-size budget'
  },
  'Animation/transition declarations in shipped CSS (informational)': {
    value: productionAnimationDeclarations,
    budget: 'not a performance proxy'
  }
});

if (failures.length) {
  failures.forEach(item => console.error(`Budget exceeded: ${item}`));
  process.exit(1);
}
console.log('Production performance budgets passed.');
