const { assert, openPage, openArcade } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage();
  try {
    await openArcade(page);
    const result = await page.evaluate(() => {
      const before = window.ArcadeOS.state;
      document.querySelector('.cab-coin-return')?.click();
      return {
        before,
        hardware: typeof window.ArcadeHardware?.setState === 'function',
        controls: document.querySelectorAll('.cab-btn, .cab-btn-small, .cab-joystick').length,
        oled: Boolean(document.querySelector('.cab-oled-display .oled-status'))
      };
    });
    assert(result.before === 'HOME', 'Cabinet did not reach HOME.');
    assert(result.hardware, 'Hardware controller is unavailable.');
    assert(result.controls >= 4, 'Physical controls are missing.');
    assert(result.oled, 'OLED status display is missing.');
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log('PASS arcade hardware: controller, physical inputs, and status display are mounted.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
