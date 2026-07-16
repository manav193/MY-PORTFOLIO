const { assert, openPage } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage();
  try {
    const result = await page.evaluate(async () => {
      const hrefs = [...document.querySelectorAll('a[href]')].map(link => link.getAttribute('href'));
      const localFiles = [...new Set(hrefs.filter(href => href && !href.startsWith('#') && !/^(https?:|mailto:|tel:)/.test(href)))];
      const checks = await Promise.all(localFiles.map(async href => ({ href, status: (await fetch(href)).status })));
      return {
        broken: checks.filter(item => item.status >= 400),
        resume: hrefs.some(href => /resume\.pdf/i.test(href)),
        email: hrefs.some(href => /^mailto:[^?\s]+@[^?\s]+\?subject=/.test(href)),
        unsafeBlanks: [...document.querySelectorAll('a[target="_blank"]')].filter(link => !/noopener/.test(link.rel)).length
      };
    });
    assert(result.broken.length === 0, `Broken local links: ${JSON.stringify(result.broken)}`);
    assert(result.resume, 'Resume link is missing.');
    assert(result.email, 'Contact email link is missing or malformed.');
    assert(result.unsafeBlanks === 0, `${result.unsafeBlanks} external links lack noopener.`);
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log('PASS portfolio links: local files, resume, email, and external link safety are valid.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
