const { assert, openPage } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage();
  try {
    const result = await page.evaluate(() => ({
      names: [...document.querySelectorAll('#work .project-card h3')].map(node => node.textContent.trim()),
      githubLinks: [...document.querySelectorAll('#work a[href*="github.com/manav193/"]')].length,
      caseStudy: document.querySelector('#work a[href*="project-arcade-os"]')?.getAttribute('href'),
      statuses: [...document.querySelectorAll('#work .project-status')].map(node => node.textContent.trim()),
      copy: document.querySelector('#work')?.innerText || ''
    }));
    assert(result.names.slice(0, 5).join('|') === 'MY-PORTFOLIO / ArcadeOS|ToolVerse|SELFYY|SHIFT-ZERO|LOVE', `Unexpected project order: ${result.names.join(', ')}`);
    assert(result.githubLinks >= 5, 'Project-specific GitHub links are missing.');
    assert(result.caseStudy, 'ArcadeOS case study link is missing.');
    assert(result.statuses.some(status => /In Development/i.test(status)), 'Development status is missing.');
    assert(!/lorem ipsum|coming soon/i.test(result.copy), 'Placeholder copy remains in Work.');
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log('PASS portfolio works: order, evidence, statuses, GitHub links, and case study are present.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
