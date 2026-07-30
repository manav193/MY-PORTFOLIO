import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('frontend');
const contracts = [
  { file: 'index.html', required: ['id="work"', 'data-project-showcase', 'id="contact"'] },
  { file: 'project-nimo.html', required: ['<main', 'data-project-theme="nimo"'] },
  { file: 'project-arcade-os.html', required: ['<main'] },
  { file: 'project-toolverse.html', required: ['<main'] },
  { file: 'project-velora-bites.html', required: ['<main'] }
];

const failures = [];
for (const contract of contracts) {
  const target = path.join(root, contract.file);
  if (!fs.existsSync(target)) {
    failures.push(`${contract.file}: file missing`);
    continue;
  }
  const html = fs.readFileSync(target, 'utf8');
  for (const selectorToken of contract.required) {
    if (!html.includes(selectorToken)) failures.push(`${contract.file}: missing DOM contract ${selectorToken}`);
  }
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${contract.file}: meaningful title missing`);
  if (!/<main(?:\s|>)/i.test(html)) failures.push(`${contract.file}: semantic main element missing`);
}

const mainJs = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const moduleContracts = [
  './modules/portfolio-trust-46-50.js',
  'initPortfolioTrust4650()',
  './modules/portfolio-31-35.js'
];
for (const token of moduleContracts) {
  if (!mainJs.includes(token)) failures.push(`frontend/js/main.js: missing integration contract ${token}`);
}

if (failures.length) {
  console.error('DOM contract QA failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log(`DOM contract QA passed (${contracts.length} key pages).`);
