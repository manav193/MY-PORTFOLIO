const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/manav/OneDrive/portfolio';
const files = fs.readdirSync(dir).filter(f => f.startsWith('project-') && f.endsWith('.html'));
files.push('404.html');

const headScript = `
  <script>
    (function() {
      try {
        var localTheme = localStorage.getItem('premium-theme');
        var sysTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-graphite' : 'light-apple';
        var activeTheme = localTheme || sysTheme;
        document.documentElement.setAttribute('data-theme', activeTheme);
      } catch (e) {}
    })();
  </script>
</head>`;

const bodyScript = `
  <div class="cursor-dot" data-cursor-dot></div>
  <div class="cursor-ring" data-cursor-ring></div>
  <script type="module" src="js/main.js"></script>
</body>`;

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if (!content.includes('localStorage.getItem(\'premium-theme\')')) {
    content = content.replace('</head>', headScript);
  }
  
  if (!content.includes('js/main.js')) {
    content = content.replace('</body>', bodyScript);
  }
  
  fs.writeFileSync(p, content);
  console.log('Fixed ' + file);
}
