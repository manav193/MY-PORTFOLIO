const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const CleanCSS = require('clean-css');
const HtmlMinifier = require('html-minifier-terser');

const DIST_DIR = path.join(__dirname, 'dist');

// Read command line arguments or environment variables
const args = process.argv.slice(2);
let DEPLOY_BASE = process.env.DEPLOY_BASE || '/';
let SITE_URL = process.env.SITE_URL || 'https://my-portfolio-mu-jade-52.vercel.app';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base' && args[i+1]) {
    DEPLOY_BASE = args[i+1];
  }
  if (args[i] === '--site' && args[i+1]) {
    SITE_URL = args[i+1];
  }
}

// Normalize DEPLOY_BASE: ensure it starts and ends with /
if (!DEPLOY_BASE.startsWith('/')) {
  DEPLOY_BASE = '/' + DEPLOY_BASE;
}
if (!DEPLOY_BASE.endsWith('/')) {
  DEPLOY_BASE = DEPLOY_BASE + '/';
}

// Normalize SITE_URL: remove trailing slash
if (SITE_URL.endsWith('/')) {
  SITE_URL = SITE_URL.slice(0, -1);
}

console.log(`Starting build with configuration:`);
console.log(`- SITE_URL: ${SITE_URL}`);
console.log(`- DEPLOY_BASE: ${DEPLOY_BASE}`);

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
    target: ['es2020'],
    define: {
      'process.env.DEPLOY_BASE': JSON.stringify(DEPLOY_BASE)
    }
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

function processHTMLContent(content, base, siteUrl, fileName) {
  let processed = content;
  
  // 1. Replace hardcoded Vercel URL with dynamic SITE_URL + DEPLOY_BASE
  processed = processed.replace(/https:\/\/my-portfolio-mu-jade-52\.vercel\.app\//g, `${siteUrl}${base}`);
  
  // 2. Prepend DEPLOY_BASE to relative paths to support subdirectory deployments
  const relativeAssetPatterns = [
    { regex: /href="css\//g, replacement: `href="${base}css/` },
    { regex: /src="js\//g, replacement: `src="${base}js/` },
    { regex: /src="images\//g, replacement: `src="${base}images/` },
    { regex: /src="icons\//g, replacement: `src="${base}icons/` },
    { regex: /href="icons\//g, replacement: `href="${base}icons/` },
    { regex: /href="project-/g, replacement: `href="${base}project-` },
    { regex: /href="index\.html/g, replacement: `href="${base}index.html` },
    { regex: /href="site\.webmanifest"/g, replacement: `href="${base}site.webmanifest"` },
    { regex: /href="resume\.pdf"/g, replacement: `href="${base}resume.pdf"` }
  ];

  for (const pattern of relativeAssetPatterns) {
    processed = processed.replace(pattern.regex, pattern.replacement);
  }

  // 3. For case studies, dynamically add canonical tags if they don't exist
  if (fileName !== 'index.html' && fileName !== '404.html') {
    if (!processed.includes('<link rel="canonical"')) {
      const canonicalTag = `\n  <link rel="canonical" href="${siteUrl}${base}${fileName}">`;
      processed = processed.replace(/<\/title>/i, `</title>${canonicalTag}`);
    }
  }

  return processed;
}

async function buildHTML() {
  console.log('Minifying and processing HTML...');
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
      const processedHtml = processHTMLContent(htmlContent, DEPLOY_BASE, SITE_URL, file);
      
      const minified = await HtmlMinifier.minify(processedHtml, {
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

function processManifestContent(content, base) {
  const manifest = JSON.parse(content);
  manifest.start_url = base;
  manifest.scope = base;
  if (manifest.icons) {
    manifest.icons = manifest.icons.map(icon => {
      if (icon.src && !icon.src.startsWith('http') && !icon.src.startsWith('/')) {
        icon.src = base + icon.src;
      }
      return icon;
    });
  }
  return JSON.stringify(manifest, null, 2);
}

function processSWContent(content, base) {
  let processed = content;
  
  // Bump version to trigger fresh caching on update
  processed = processed.replace(/manav-portfolio-v13/g, 'manav-portfolio-v14');
  
  // Prepend base path to cached assets
  processed = processed.replace(/"\.\/"/g, `"${base}"`);
  processed = processed.replace(/"\.\/([^"]+)"/g, (match, p1) => {
    return `"${base}${p1}"`;
  });

  // Prepend base path to offline fallback
  processed = processed.replace(/caches\.match\("\.\/404\.html"\)/g, `caches.match("${base}404.html")`);

  return processed;
}

function processRobotsContent(content, base, siteUrl) {
  return content.replace(/Sitemap:\s*https:\/\/my-portfolio-mu-jade-52\.vercel\.app\/sitemap\.xml/g, `Sitemap: ${siteUrl}${base}sitemap.xml`);
}

function processSitemapContent(content, base, siteUrl) {
  return content.replace(/https:\/\/my-portfolio-mu-jade-52\.vercel\.app\//g, `${siteUrl}${base}`);
}

function validateBuild(base, siteUrl) {
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
  const assetsMatch = swContent.match(/const assets = \[\s*([\s\S]*?)\s*\];/);
  if (!assetsMatch) {
    throw new Error('Build Validation Failed: Could not parse assets array in sw.js');
  }

  const cachedFiles = assetsMatch[1]
    .split(',')
    .map(item => item.trim().replace(/['"']/g, ''))
    .filter(item => item && item !== base);

  for (const file of cachedFiles) {
    let cleanPath = file;
    if (file.startsWith(base)) {
      cleanPath = file.substring(base.length);
    }
    if (cleanPath === '' || cleanPath === 'index.html') continue;
    
    const fullPath = path.join(DIST_DIR, cleanPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Build Validation Failed: Precached asset in sw.js does not exist in dist: ${file} (resolved to ${fullPath})`);
    }
  }

  // 3. Parse manifest and verify icons exist
  const manifestContent = fs.readFileSync(path.join(DIST_DIR, 'site.webmanifest'), 'utf8');
  const manifest = JSON.parse(manifestContent);
  if (manifest.icons) {
    for (const icon of manifest.icons) {
      let iconPath = icon.src;
      if (iconPath.startsWith(base)) {
        iconPath = iconPath.substring(base.length);
      }
      const fullIconPath = path.join(DIST_DIR, iconPath);
      if (!fs.existsSync(fullIconPath)) {
        throw new Error(`Build Validation Failed: Manifest icon does not exist in dist: ${icon.src}`);
      }
    }
  }

  // 4. Validate all local href and src links in HTML files
  const htmlFiles = fs.readdirSync(DIST_DIR).filter(file => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const htmlContent = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');
    
    const urlMatches = [
      ...htmlContent.matchAll(/href="([^"]+)"/g),
      ...htmlContent.matchAll(/src="([^"]+)"/g)
    ];

    for (const match of urlMatches) {
      const url = match[1];

      // Check validation constraints
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        throw new Error(`Build Validation Failed: Localhost reference leaked into ${file}: ${url}`);
      }
      if (url.includes('\\')) {
        throw new Error(`Build Validation Failed: Windows backslash file path leaked into ${file}: ${url}`);
      }
      if (url.startsWith('C:') || url.startsWith('Users')) {
        throw new Error(`Build Validation Failed: Absolute local path leaked into ${file}: ${url}`);
      }
      if (url.includes('my-portfolio-mu-jade-52.vercel.app') && siteUrl !== 'https://my-portfolio-mu-jade-52.vercel.app') {
        throw new Error(`Build Validation Failed: Old Vercel domain leaked into ${file}: ${url}`);
      }
      if (url.includes('/js/modules/') || url.includes('js/motion.js')) {
        throw new Error(`Build Validation Failed: Source module reference leaked into ${file}: ${url}`);
      }

      // Skip external links, anchors, mailto, tel, etc.
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('data:')) {
        continue;
      }

      // Check local path resolution
      let localPath = url;
      if (url.startsWith(base)) {
        localPath = url.substring(base.length);
      }

      if (localPath.includes('#')) {
        localPath = localPath.split('#')[0];
      }
      if (localPath === '') continue;

      const fullAssetPath = path.join(DIST_DIR, localPath);
      if (!fs.existsSync(fullAssetPath)) {
        throw new Error(`Build Validation Failed: Referenced asset does not exist in dist: ${url} inside ${file} (resolved to ${fullAssetPath})`);
      }
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
    
    // Copy static assets
    copyStatic('images', 'images');
    copyStatic('icons', 'icons');
    copyStatic('assets', 'assets');
    copyStatic('robots.txt', 'robots.txt');
    copyStatic('sitemap.xml', 'sitemap.xml');
    copyStatic('resume.pdf', 'resume.pdf');

    // Process manifest
    const manifestPath = path.join(__dirname, 'site.webmanifest');
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const processed = processManifestContent(content, DEPLOY_BASE);
      fs.writeFileSync(path.join(DIST_DIR, 'site.webmanifest'), processed);
    }

    // Process sw.js
    const swPath = path.join(__dirname, 'sw.js');
    if (fs.existsSync(swPath)) {
      const content = fs.readFileSync(swPath, 'utf8');
      const processed = processSWContent(content, DEPLOY_BASE);
      fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), processed);
    }

    // Process robots.txt
    const robotsPath = path.join(__dirname, 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      const content = fs.readFileSync(robotsPath, 'utf8');
      const processed = processRobotsContent(content, DEPLOY_BASE, SITE_URL);
      fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), processed);
    }

    // Process sitemap.xml
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const content = fs.readFileSync(sitemapPath, 'utf8');
      const processed = processSitemapContent(content, DEPLOY_BASE, SITE_URL);
      fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), processed);
    }

    // Validate
    validateBuild(DEPLOY_BASE, SITE_URL);

    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nBuild completed successfully in ${buildTime}s!`);
  } catch (error) {
    console.error('\nBuild failed with error:', error);
    process.exit(1);
  }
}

main();
