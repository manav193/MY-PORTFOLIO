const { assert, openPage } = require('./test-helpers');

const viewports = [
  [1920, 1080],
  [1440, 900],
  [1024, 768],
  [430, 932],
  [390, 844],
  [360, 800]
];

(async () => {
  const { browser, page, errors } = await openPage();

  try {
    for (const [width, height] of viewports) {
      await page.setViewport({ width, height });
      await page.reload({ waitUntil: 'networkidle0' });

      const closed = await page.evaluate(() => {
        const root = document.querySelector('[data-cmd-backdrop]');
        const rect = root.getBoundingClientRect();
        return {
          hidden: root.hidden,
          display: getComputedStyle(root).display,
          area: rect.width * rect.height,
          rawTextVisible: document.body.innerText.includes('Go to Projects'),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      assert(closed.hidden && closed.display === 'none' && closed.area === 0, `${width}x${height}: closed palette occupies layout.`);
      assert(!closed.rawTextVisible, `${width}x${height}: raw palette commands are visible while closed.`);
      assert(closed.overflow <= 1, `${width}x${height}: closed page has horizontal overflow.`);

      const focusSelector = await page.evaluate(() => (
        document.querySelector('[data-cmd-trigger]').getClientRects().length
          ? '[data-cmd-trigger]'
          : '[data-dock-action="work"]'
      ));
      await page.focus(focusSelector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyK');
      await page.keyboard.up('Control');
      await page.waitForFunction(() => !document.querySelector('[data-cmd-backdrop]').hidden);

      const open = await page.evaluate(() => {
        const root = document.querySelector('[data-cmd-backdrop]');
        const dialog = root.querySelector('.cmd-palette');
        const input = root.querySelector('#cmd-input');
        const items = Array.from(root.querySelectorAll('.cmd-item'));
        const first = items[0].getBoundingClientRect();
        const second = items[1].getBoundingClientRect();
        const themeButton = root.querySelector('#cmd-theme-toggle');
        const buttonStyle = getComputedStyle(themeButton);
        const rootStyle = getComputedStyle(root);
        const dialogRect = dialog.getBoundingClientRect();
        return {
          fixed: rootStyle.position === 'fixed',
          focused: document.activeElement === input,
          vertical: second.top >= first.bottom,
          styledButton: buttonStyle.appearance === 'none' && buttonStyle.display === 'flex',
          inViewport: dialogRect.left >= 0 && dialogRect.right <= innerWidth && dialogRect.bottom <= innerHeight,
          bodyLocked: document.body.classList.contains('cmd-palette-open'),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      assert(open.fixed && open.focused && open.vertical, `${width}x${height}: open palette layout or focus is invalid.`);
      assert(open.styledButton && open.inViewport && open.bodyLocked, `${width}x${height}: palette shell or button styling is invalid.`);
      assert(open.overflow <= 1, `${width}x${height}: open palette has horizontal overflow.`);

      await page.keyboard.press('ArrowDown');
      assert(await page.$eval('.cmd-item:nth-of-type(2)', item => item.classList.contains('is-selected')), 'Arrow navigation did not update selection.');
      await page.keyboard.press('Escape');
      assert(await page.$eval('[data-cmd-backdrop]', root => root.hidden), 'Escape did not close the palette.');
      assert(await page.evaluate(selector => document.activeElement.matches(selector), focusSelector), 'Focus did not return to the previously focused control.');
      assert(await page.evaluate(() => !document.body.classList.contains('cmd-palette-open')), 'Body scroll lock remained after close.');

      await page.keyboard.down('Control');
      await page.keyboard.press('KeyK');
      await page.keyboard.up('Control');
      await page.type('#cmd-input', 'skills');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash === '#skills');
      assert(await page.$eval('[data-cmd-backdrop]', root => root.hidden), 'Enter activation did not close the palette.');

      await page.click('[data-dock-action="work"]');
      await page.waitForFunction(() => document.querySelector('[data-dock-action="work"]').classList.contains('dock-active'));

      await page.keyboard.down('Control');
      await page.keyboard.press('KeyK');
      await page.keyboard.up('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      assert(await page.evaluate(() => document.activeElement === Array.from(document.querySelectorAll('.cmd-item')).at(-1)), 'Shift+Tab did not wrap to the final command.');
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => document.activeElement.id === 'cmd-input'), 'Tab did not wrap to the search input.');
      await page.click('[data-cmd-backdrop]', { offset: { x: 2, y: 2 } });
      assert(await page.$eval('[data-cmd-backdrop]', root => root.hidden), 'Backdrop click did not close the palette.');
    }

    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS command palette: closed state, layout, keyboard, focus, filtering, dock recovery, and ${viewports.length} viewports are stable.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
