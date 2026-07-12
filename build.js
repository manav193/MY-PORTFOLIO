const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const CleanCSS = require('clean-css');
const HtmlMinifier = require('html-minifier-terser');

const DIST_DIR = path.join(__dirname, 'dist');

// Clean dist directory
function cleanDist() {
  console.log('Cleaning dist/ directory...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR);
  fs.mkdirSync(path.join(DIST_DIR, 'css'));
  fs.mkdirSync(path.join(DIST_DIR, 'js'));
}

// Copy static directory/file recursively
function copyStatic(src, dest) {
  const srcPath = path.join(__dirname, src);
  const destPath = path.join(DIST_DIR, dest);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${src} to dist/${dest}...`);
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    console.warn(`Warning: Static asset source not found: ${src}`);
  }
}

async function buildJS() {
  console.log('Bundling and minifying JS...');
  
  // 1. Bundle main.js module entry point
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'js/main.js')],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: path.join(DIST_DIR, 'js/main.js'),
    target: ['es2020']
  });

  // 2. Minify deferred classic global scripts
  const classicScripts = ['intro.js', 'arcade-os.js', 'arcade-apps.js', 'machine-bg.js'];
  for (const script of classicScripts) {
    const srcPath = path.join(__dirname, 'js', script);
    if (fs.existsSync(srcPath)) {
      await esbuild.build({
        entryPoints: [srcPath],
        bundle: false,
        minify: true,
        outfile: path.join(DIST_DIR, 'js', script),
        target: ['es2020']
      });
    }
  }
}

function buildCSS() {
  console.log('Minifying CSS...');
  const cssFiles = ['styles.css', 'intro.css', 'arcade-os.css', 'project-page.css'];
  const cleanCSSInstance = new CleanCSS({ level: 1 });

  for (const file of cssFiles) {
    const srcPath = path.join(__dirname, 'css', file);
    if (fs.existsSync(srcPath)) {
      const cssContent = fs.readFileSync(srcPath, 'utf8');
      const minified = cleanCSSInstance.minify(cssContent);
      if (minified.errors.length > 0) {
        throw new Error(`CSS Minification error in ${file}: ${minified.errors.join(', ')}`);
      }
      fs.writeFileSync(path.join(DIST_DIR, 'css', file), minified.styles);
    }
  }
}

async function buildHTML() {
  console.log('Minifying HTML...');
  const htmlFiles = [
    'index.html',
    '404.html',
    'project-toolverse.html',
    'project-selfyy.html',
    'project-love-journey.html',
    'project-promptai.html',
    'project-shift-zero.html',
    'project-nintendo.html',
    'project-velora-bites.html',
    'project-nike.html'
  ];

  for (const file of htmlFiles) {
    const srcPath = path.join(__dirname, file);
    if (fs.existsSync(srcPath)) {
      const htmlContent = fs.readFileSync(srcPath, 'utf8');
      const minified = await HtmlMinifier.minify(htmlContent, {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true,
        processConditionalComments: true,
        removeAttributeQuotes: false,
        removeRedundantAttributes: true,
        useShortDoctype: true
      });
      fs.writeFileSync(path.join(DIST_DIR, file), minified);
    } else {
      throw new Error(`Required HTML file is missing: ${file}`);
    }
  }
}

function validateBuild() {
  console.log('Validating build outputs and paths...');
  
  // 1. Verify expected files exist in dist/
  const expectedFiles = [
    'index.html',
    '404.html',
    'js/main.js',
    'js/intro.js',
    'js/arcade-os.js',
    'js/arcade-apps.js',
    'css/styles.css',
    'css/intro.css',
    'css/arcade-os.css',
    'sw.js',
    'site.webmanifest'
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Build Validation Failed: Expected file is missing in dist: ${file}`);
    }
  }

  // 2. Validate Service Worker precache list matches actual files
  const swContent = fs.readFileSync(path.join(DIST_DIR, 'sw.js'), 'utf8');
  // Simple regex to parse assets array in sw.js
  const assetsMatch = swContent.match(/const assets = \[\s*([\s\S]*?)\s*\];/);
  if (!assetsMatch) {
    throw new Error('Build Validation Failed: Could not parse assets array in sw.js');
  }

  const cachedFiles = assetsMatch[1]
    .split(',')
    .map(item => item.trim().replace(/['"']/g, ''))
    .filter(item => item && item !== './' && item !== './index.html');

  for (const file of cachedFiles) {
    const cleanPath = file.replace(/^\.\//, '');
    const fullPath = path.join(DIST_DIR, cleanPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Build Validation Failed: Precached asset in sw.js does not exist in dist: ${file}`);
    }
  }

  console.log('Build validation passed successfully!');
}

async function main() {
  const startTime = Date.now();
  try {
    cleanDist();
    
    // Build assets
    await buildJS();
    buildCSS();
    await buildHTML();
    
    // Copy remaining static assets
    copyStatic('images', 'images');
    copyStatic('icons', 'icons');
    copyStatic('assets', 'assets');
    copyStatic('site.webmanifest', 'site.webmanifest');
    copyStatic('sw.js', 'sw.js');
    copyStatic('robots.txt', 'robots.txt');
    copyStatic('sitemap.xml', 'sitemap.xml');
    copyStatic('resume.pdf', 'resume.pdf');

    // Validate
    validateBuild();

    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nBuild completed successfully in ${buildTime}s!`);
  } catch (error) {
    console.error('\nBuild failed with error:', error);
    process.exit(1);
  }
}

main();
