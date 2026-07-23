import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import CleanCSS from 'clean-css';
import * as HtmlMinifier from 'html-minifier-terser';
import { portfolioConfig } from './frontend/js/portfolio-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const DIST_DIR = path.join(__dirname, 'dist');

// Read command line arguments or environment variables
const args = process.argv.slice(2);
let DEPLOY_BASE = process.env.DEPLOY_BASE || '/';
let SITE_URL = process.env.SITE_URL || portfolioConfig.deployedPortfolioUrl;

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

// Copy static directory/file recursively from frontend/ to dist/
function copyStatic(src, dest) {
  const srcPath = path.join(FRONTEND_DIR, src);
  const destPath = path.join(DIST_DIR, dest);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying frontend/${src} to dist/${dest}...`);
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    console.warn(`Warning: Static asset source not found: ${src}`);
  }
}

async function buildJS() {
  console.log('Bundling and minifying JS...');
  
  // 1. Bundle main.js module entry point
  await esbuild.build({
    entryPoints: [path.join(FRONTEND_DIR, 'js/main.js')],
    bundle: true,
    minify: true,
    sourcemap: false,
    outfile: path.join(DIST_DIR, 'js/main.js'),
    target: ['es2020'],
    define: {
      'process.env.DEPLOY_BASE': JSON.stringify(DEPLOY_BASE)
    }
  });

  // 2. Minify deferred classic global scripts
  const classicScripts = ['intro.js', 'machine-bg.js'];
  for (const script of classicScripts) {
    const srcPath = path.join(FRONTEND_DIR, 'js', script);
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

  // 3. Bundle dynamic ES Modules
  const dynamicModules = [
    'modules/arcade-customizer.js',
    'modules/arcade-stats.js',
    'modules/arcade-achievements.js',
    'modules/arcade-system-ui.js',
    'modules/arcade-audio.js',
    'modules/arcade-soundlab.js',
    'modules/arcade-diagnostics.js',
    'modules/arcade-reset-safety.js',
    'services/nimo-api.js'
  ];
  for (const mod of dynamicModules) {
    const srcPath = path.join(FRONTEND_DIR, 'js', mod);
    if (fs.existsSync(srcPath)) {
      await esbuild.build({
        entryPoints: [srcPath],
        bundle: true,
        minify: true,
        outfile: path.join(DIST_DIR, 'js', mod),
        target: ['es2020'],
        format: 'esm'
      });
    }
  }
}

function buildCSS() {
  console.log('Minifying CSS...');
  const cssFiles = ['styles.css', 'intro.css', 'arcade-os.css', 'project-page.css'];
  const cleanCSSInstance = new CleanCSS({ level: 1 });

  for (const file of cssFiles) {
    const srcPath = path.join(FRONTEND_DIR, 'css', file);
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

  const nameUpper = String(portfolioConfig.name || 'MANAV AGARWAL').toUpperCase();
  const configTokens = {
    'portfolio.name': portfolioConfig.name,
    'PORTFOLIO.NAME': nameUpper,
    'Portfolio.Name': nameUpper,
    'portfolio.role': portfolioConfig.role,
    'PORTFOLIO.ROLE': portfolioConfig.role,
    'portfolio.location': portfolioConfig.location,
    'PORTFOLIO.LOCATION': portfolioConfig.location,
    'portfolio.availability': portfolioConfig.availability,
    'PORTFOLIO.AVAILABILITY': portfolioConfig.availability,
    'portfolio.githubUrl': portfolioConfig.githubUrl,
    'PORTFOLIO.GITHUBURL': portfolioConfig.githubUrl,
    'portfolio.email': portfolioConfig.email,
    'PORTFOLIO.EMAIL': portfolioConfig.email,
    'portfolio.emailMailto': `mailto:${portfolioConfig.email}?subject=Project%20inquiry`,
    'PORTFOLIO.EMAILMAILTO': `mailto:${portfolioConfig.email}?subject=Project%20inquiry`,
    'portfolio.resumePath': `${base}${portfolioConfig.resumePath}`,
    'PORTFOLIO.RESUMEPATH': `${base}${portfolioConfig.resumePath}`,
    'portfolio.siteUrl': siteUrl,
    'PORTFOLIO.SITEURL': siteUrl,
    'portfolio.socialImageUrl': `${siteUrl}${base}${portfolioConfig.socialImagePath}`,
    'PORTFOLIO.SOCIALIMAGEURL': `${siteUrl}${base}${portfolioConfig.socialImagePath}`
  };

  for (const [projectId, project] of Object.entries(portfolioConfig.projects)) {
    configTokens[`projects.${projectId}.githubUrl`] = project.githubUrl;
    configTokens[`projects.${projectId}.liveUrl`] = project.liveUrl || '';
    configTokens[`projects.${projectId}.caseStudyPath`] = `${base}${project.caseStudyPath}`;
    configTokens[`PROJECTS.${projectId.toUpperCase()}.GITHUBURL`] = project.githubUrl;
    configTokens[`PROJECTS.${projectId.toUpperCase()}.CASESTUDYPATH`] = `${base}${project.caseStudyPath}`;
  }

  // Case-insensitive lookup map
  const lowerMap = {};
  for (const [k, v] of Object.entries(configTokens)) {
    lowerMap[k.toLowerCase()] = v;
  }

  processed = processed.replace(/\{\{([\w.-]+)\}\}/g, (match, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey in lowerMap) {
      return lowerMap[lowerKey];
    }
    if (key in configTokens) {
      return configTokens[key];
    }
    throw new Error(`Unknown portfolio config token in ${fileName}: ${match}`);
  });
  
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
    { regex: /href="Manav-Agarwal-Resume\.pdf"/g, replacement: `href="${base}${portfolioConfig.resumePath}"` }
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
    'project-arcade-os.html',
    'project-nimo.html',
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
    const srcPath = path.join(FRONTEND_DIR, file);
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
  processed = processed.replace(/manav-portfolio-v20/g, 'manav-portfolio-v21');
  
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

  const requiredConfig = ['name', 'role', 'availability', 'email', 'githubUrl', 'resumePath', 'deployedPortfolioUrl', 'socialImagePath'];
  for (const key of requiredConfig) {
    if (!portfolioConfig[key] || typeof portfolioConfig[key] !== 'string') {
      throw new Error(`Build Validation Failed: portfolio config value is missing: ${key}`);
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portfolioConfig.email)) {
    throw new Error('Build Validation Failed: portfolio config email is invalid.');
  }
  if (!Array.isArray(portfolioConfig.featuredProjectIds) || portfolioConfig.featuredProjectIds.length === 0) {
    throw new Error('Build Validation Failed: featuredProjectIds must contain at least one project.');
  }
  for (const id of portfolioConfig.featuredProjectIds) {
    if (!portfolioConfig.projects[id]) {
      throw new Error(`Build Validation Failed: featured project is missing from config: ${id}`);
    }
  }
  
  // 1. Verify expected files exist in dist/
  const expectedFiles = [
    'index.html',
    '404.html',
    'js/main.js',
    'js/intro.js',
    'css/styles.css',
    'css/intro.css',
    'css/arcade-os.css',
    'project-arcade-os.html',
    'project-nimo.html',
    portfolioConfig.resumePath,
    portfolioConfig.socialImagePath,
    'images/arcade-home.webp',
    'images/arcade-customize.webp',
    'images/arcade-stats.webp',
    'images/arcade-achievements.webp',
    'images/arcade-soundlab.webp',
    'images/arcade-diagnostics.webp',
    'images/nimo-preview.svg',
    'images/selfyy-preview.webp',
    'js/modules/arcade-system-ui.js',
    'js/modules/arcade-customizer.js',
    'js/modules/arcade-stats.js',
    'js/modules/arcade-achievements.js',
    'js/modules/arcade-soundlab.js',
    'js/modules/arcade-diagnostics.js',
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

    if (/\{\{[\w.-]+\}\}/.test(htmlContent)) {
      throw new Error(`Build Validation Failed: unresolved config token in ${file}.`);
    }
    if (/[A-Za-z]:\\\\Users\\\\|[A-Za-z]:\/Users\//i.test(htmlContent)) {
      throw new Error(`Build Validation Failed: absolute local machine path leaked into ${file}.`);
    }

    const ids = [...htmlContent.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      throw new Error(`Build Validation Failed: duplicate HTML IDs in ${file}: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    if (/href="(?:#|\s*)"|href="javascript:/i.test(htmlContent)) {
      throw new Error(`Build Validation Failed: placeholder or empty href in ${file}.`);
    }

    if (file === 'index.html') {
      const requiredMetadata = [
        '<title>',
        'name="description"',
        'rel="canonical"',
        'property="og:title"',
        'property="og:description"',
        'property="og:image"',
        'name="twitter:card"',
        'type="application/ld+json"'
      ];
      for (const marker of requiredMetadata) {
        if (!htmlContent.includes(marker)) {
          throw new Error(`Build Validation Failed: required metadata missing from index.html: ${marker}`);
        }
      }
    }
    
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
    
    // Copy static assets from frontend/
    copyStatic('images', 'images');
    copyStatic('icons', 'icons');
    copyStatic('assets', 'assets');
    copyStatic('robots.txt', 'robots.txt');
    copyStatic('sitemap.xml', 'sitemap.xml');
    copyStatic(portfolioConfig.resumePath, portfolioConfig.resumePath);

    // Process manifest
    const manifestPath = path.join(FRONTEND_DIR, 'site.webmanifest');
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const processed = processManifestContent(content, DEPLOY_BASE);
      fs.writeFileSync(path.join(DIST_DIR, 'site.webmanifest'), processed);
    }

    // Process sw.js
    const swPath = path.join(FRONTEND_DIR, 'sw.js');
    if (fs.existsSync(swPath)) {
      const content = fs.readFileSync(swPath, 'utf8');
      const processed = processSWContent(content, DEPLOY_BASE);
      fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), processed);
    }

    // Process robots.txt
    const robotsPath = path.join(FRONTEND_DIR, 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      const content = fs.readFileSync(robotsPath, 'utf8');
      const processed = processRobotsContent(content, DEPLOY_BASE, SITE_URL);
      fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), processed);
    }

    // Process sitemap.xml
    const sitemapPath = path.join(FRONTEND_DIR, 'sitemap.xml');
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
