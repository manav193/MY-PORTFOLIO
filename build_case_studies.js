const fs = require('fs');
const path = require('path');

const projects = [
  { id: 'toolverse', title: 'ToolVerse', tagline: 'Engineering Case Study', theme: 'toolverse', next: 'selfyy', prev: 'nike', nextTitle: 'SELFYY', prevTitle: 'Nike Air Zoom', img: 'images/toolverse_4.png', img2: 'images/toolverse_1.png', link: 'https://tool-verse-theta.vercel.app/' },
  { id: 'selfyy', title: 'SELFYY', tagline: 'Edge Routing Architecture', theme: 'selfyy', next: 'love-journey', prev: 'toolverse', nextTitle: 'Love Journey', prevTitle: 'ToolVerse', img: 'images/project-nexus.svg', img2: 'images/project-nexus.svg', link: 'https://selfyy.vercel.app/' },
  { id: 'love-journey', title: 'Love Journey', tagline: 'Immersive WebGL Experience', theme: 'love', next: 'shift-zero', prev: 'selfyy', nextTitle: 'SHIFT ZERO', prevTitle: 'SELFYY', img: 'images/love_1.png', img2: 'images/love_1.png', link: '#' },
  { id: 'shift-zero', title: 'SHIFT ZERO', tagline: 'Game HUD Design', theme: 'shift-zero', next: 'nintendo', prev: 'love-journey', nextTitle: 'Nintendo OS', prevTitle: 'Love Journey', img: 'images/sz_menu.png', img2: 'images/sz_menu.png', link: '#' },
  { id: 'nintendo', title: 'Nintendo OS', tagline: 'Spatial Navigation Interface', theme: 'nintendo', next: 'velora-bites', prev: 'shift-zero', nextTitle: 'Velora Bites', prevTitle: 'SHIFT ZERO', img: 'images/nintendo.jpg', img2: 'images/nintendo.jpg', link: '#' },
  { id: 'velora-bites', title: 'Velora Bites', tagline: 'Luxury Web Architecture', theme: 'velora', next: 'nike', prev: 'nintendo', nextTitle: 'Nike Air Zoom', prevTitle: 'Nintendo OS', img: 'images/velora_2.png', img2: 'images/velora_2.png', link: '#' },
  { id: 'nike', title: 'Nike Air Zoom', tagline: 'E-Commerce Interaction Model', theme: 'nike', next: 'promptai', prev: 'velora-bites', nextTitle: 'PromptAI', prevTitle: 'Velora Bites', img: 'images/nike.png', img2: 'images/nike.png', link: '#' },
  { id: 'promptai', title: 'PromptAI', tagline: 'UI Architecture', theme: 'promptai', next: 'toolverse', prev: 'nike', nextTitle: 'ToolVerse', prevTitle: 'Nike Air Zoom', img: 'images/promptai_new.png', img2: 'images/promptai_new.png', link: '#' },
];

function parseMarkdown(content) {
  const sections = {};
  let currentSection = null;
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim().toLowerCase().replace(/ /g, '-');
      sections[currentSection] = { title: line.replace('## ', '').trim(), body: [] };
    } else if (currentSection && line.trim() !== '') {
      sections[currentSection].body.push(line.trim());
    }
  }
  return sections;
}

function renderHtml(project, sections) {
  let html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${project.title} — Product Case Study</title>
  <meta name="theme-color" content="#000000">
  <link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/project-page.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body data-project-theme="${project.theme}">
  <nav class="site-nav showroom-nav">
    <div class="nav-container">
      <a href="index.html#work" class="brand" style="display:flex; align-items:center; gap:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Index
      </a>
    </div>
  </nav>

  <main>
    <header class="project-hero">
      <h1>${project.title}</h1>
      <p class="tagline">${project.tagline}</p>
      <div class="project-actions">
        ${project.link !== '#' ? `<a href="${project.link}" class="btn-primary" target="_blank" rel="noopener">Live Demo</a>` : ''}
        <a href="https://github.com/manav193" class="btn-secondary" target="_blank" rel="noopener">GitHub Repo</a>
      </div>
      <div class="project-hero-image">
        <img src="${project.img}" alt="${project.title} Showcase">
      </div>
    </header>

    <article class="cs-container">
`;

  let sectionCounter = 1;
  const formatText = (lines) => {
    return lines.map(line => {
      if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
      return `<p class="cs-body">${line}</p>`;
    }).join('').replace(/(<li>.*<\/li>)/g, '<ul class="cs-body" style="padding-left:24px; margin-bottom:24px; font-size:1.05rem; line-height:1.8; color:var(--color-text-secondary);">$1</ul>');
  };

  // OVERVIEW
  const overviewKeys = Object.keys(sections).filter(k => k.includes('overview'));
  if (overviewKeys.length > 0) {
    const sec = sections[overviewKeys[0]];
    html += `
      <section class="cs-split">
        <div class="cs-split-content">
          <span class="cs-meta">0${sectionCounter++} // OVERVIEW</span>
          <h2 class="cs-section-title">${sec.title}</h2>
          ${formatText(sec.body)}
        </div>
        <div class="cs-split-visual" style="padding: 40px; display:flex; align-items:center; justify-content:center;">
          <img src="${project.img2}" alt="${project.title} Overview">
        </div>
      </section>
`;
  }

  // PROBLEM / GOAL
  const problemKeys = Object.keys(sections).filter(k => k.includes('problem') || k.includes('goal'));
  if (problemKeys.length > 0) {
    const sec = sections[problemKeys[0]];
    html += `
      <section class="cs-split reversed">
        <div class="cs-split-content">
          <span class="cs-meta">0${sectionCounter++} // THE PROBLEM</span>
          <h2 class="cs-section-title">${sec.title}</h2>
          ${formatText(sec.body)}
        </div>
        <div class="cs-split-visual" style="padding: 40px; display:flex; align-items:center; justify-content:center;">
          <img src="${project.img}" alt="${project.title} Problem Space">
        </div>
      </section>
`;
  }

  // TECH STACK / ARCHITECTURE
  const techKeys = Object.keys(sections).filter(k => k.includes('tech') || k.includes('architecture'));
  if (techKeys.length > 0) {
    const sec = sections[techKeys[0]];
    html += `
      <section>
        <span class="cs-meta">0${sectionCounter++} // ENGINEERING</span>
        <h2 class="cs-section-title">${sec.title}</h2>
        <div class="cs-grid">
`;
    // Try to parse bullets into glass panels
    const items = sec.body.filter(l => l.startsWith('- '));
    if (items.length > 0) {
      items.forEach(item => {
         const parts = item.substring(2).split(':');
         const h4 = parts[0];
         const p = parts.slice(1).join(':');
         html += `
          <div class="cs-glass-panel">
            <h4>${h4}</h4>
            <p class="cs-body" style="font-size: 0.95rem; margin:0;">${p || ''}</p>
          </div>
`;
      });
    } else {
        html += `
          <div class="cs-glass-panel" style="grid-column: span 3;">
            ${formatText(sec.body)}
          </div>
`;
    }
    html += `
        </div>
      </section>
`;
  }

  // REMAINING SECTIONS
  for (const key of Object.keys(sections)) {
    if (overviewKeys.includes(key) || problemKeys.includes(key) || techKeys.includes(key)) continue;
    const sec = sections[key];
    html += `
      <section class="cs-split">
        <div class="cs-split-content" style="grid-column: span 2;">
          <span class="cs-meta">${String(sectionCounter++).padStart(2, '0')} // ${sec.title.toUpperCase()}</span>
          <h2 class="cs-section-title">${sec.title}</h2>
          ${formatText(sec.body)}
        </div>
      </section>
`;
  }

  html += `
    </article>

    <nav class="project-nav">
      <a href="project-${project.prev}.html" class="nav-link prev">
        <span class="nav-label">Previous Project</span>
        <span class="nav-title">${project.prevTitle}</span>
      </a>
      <a href="project-${project.next}.html" class="nav-link next">
        <span class="nav-label">Next Project</span>
        <span class="nav-title">${project.nextTitle}</span>
      </a>
    </nav>
  </main>

  <footer class="site-footer" style="padding: 64px; text-align: center; border-top: 1px solid var(--color-border); margin-top: 120px;">
    <p style="color: var(--color-text-muted); font-size: 0.9rem;">&copy; 2026 Manav Agarwal.</p>
  </footer>
  <script type="module" src="js/main.js"></script>
</body>
</html>`;
  return html;
}

projects.forEach(p => {
  const mdPath = path.join(__dirname, 'case-studies', p.id + '.md');
  if (fs.existsSync(mdPath)) {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const sections = parseMarkdown(mdContent);
    const html = renderHtml(p, sections);
    fs.writeFileSync(path.join(__dirname, 'project-' + p.id + '.html'), html);
    console.log('Built project-' + p.id + '.html');
  }
});
