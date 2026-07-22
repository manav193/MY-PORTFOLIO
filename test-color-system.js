const fs = require('fs');
const path = require('path');
const { assert, openPage } = require('./test-helpers');

const themes = [
  'light-apple',
  'dark-graphite',
  'midnight-sapphire',
  'aurora-violet',
  'forest-premium',
  'sunset-copper',
  'monochrome'
];

const requiredTokens = [
  '--color-bg-deep',
  '--color-bg',
  '--color-bg-soft',
  '--color-surface',
  '--color-surface-elevated',
  '--color-surface-solid',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-border',
  '--color-border-strong',
  '--color-overlay-soft',
  '--shadow-soft',
  '--shadow-deep'
];

function parseColor(value) {
  const hex = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const normalized = hex.length === 3 ? hex.split('').map(channel => channel + channel).join('') : hex;
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: 1
    };
  }
  const channels = value.match(/[\d.]+/g)?.map(Number) || [];
  return { r: channels[0], g: channels[1], b: channels[2], a: channels[3] ?? 1 };
}

function composite(foreground, background) {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  return {
    r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
    g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
    b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
    a: alpha
  };
}

function luminance(color) {
  const channel = value => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(first, second) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

function colorDistance(first, second) {
  return Math.sqrt(
    (first.r - second.r) ** 2 +
    (first.g - second.g) ** 2 +
    (first.b - second.b) ** 2
  );
}

function auditSource() {
  const styles = fs.readFileSync(path.join(__dirname, 'css', 'styles.css'), 'utf8');
  const projectStyles = fs.readFileSync(path.join(__dirname, 'css', 'project-page.css'), 'utf8');

  requiredTokens.forEach(token => {
    const count = (styles.match(new RegExp(`${token.replace(/-/g, '\\-')}\\s*:`, 'g')) || []).length;
    assert(count >= themes.length + 1, `${token} is not defined for the root and every theme.`);
  });

  const publicBlack = (styles.match(/#(?:000000|000)\b/gi) || []).length;
  const caseStudyBlack = (projectStyles.match(/#(?:000000|000)\b/gi) || []).length;
  assert(publicBlack <= 1, `Public UI contains ${publicBlack} exact-black declarations.`);
  assert(caseStudyBlack <= 3, `Case-study UI contains ${caseStudyBlack} exact-black declarations.`);
  assert((styles.match(/var\(--shadow-(?:soft|deep)\)/g) || []).length >= 12, 'Shared shadow tokens are not used broadly enough.');
  assert((styles.match(/var\(--color-(?:bg-soft|bg-deep|surface-solid|overlay-soft)\)/g) || []).length >= 8, 'Layering tokens are not used broadly enough.');
}

(async () => {
  auditSource();
  const { browser, page, errors } = await openPage();

  try {
    await page.evaluate(() => document.body.classList.add('intro-skipped'));

    for (const theme of themes) {
      await page.evaluate(themeId => {
        document.documentElement.dataset.theme = themeId;
        localStorage.setItem('premium-theme', themeId);
        window.scrollTo(0, 0);
      }, theme);

      const colors = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const card = document.querySelector('.project-card');
        const button = document.querySelector('.project-card .btn-primary');
        const dock = document.querySelector('.os-dock-container');
        const rail = document.querySelector('.section-progress-rail__link');
        return {
          bg: root.getPropertyValue('--color-bg').trim(),
          primary: root.getPropertyValue('--color-text-primary').trim(),
          secondary: root.getPropertyValue('--color-text-secondary').trim(),
          muted: root.getPropertyValue('--color-text-muted').trim(),
          border: root.getPropertyValue('--color-border').trim(),
          card: getComputedStyle(card).backgroundColor,
          buttonBg: getComputedStyle(button).backgroundColor,
          buttonText: getComputedStyle(button).color,
          dock: getComputedStyle(dock).backgroundColor,
          rail: rail ? getComputedStyle(rail).color : null,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });

      const bg = parseColor(colors.bg);
      const card = composite(parseColor(colors.card), bg);
      const dock = composite(parseColor(colors.dock), bg);
      const primaryContrast = contrast(parseColor(colors.primary), bg);
      const secondaryContrast = contrast(parseColor(colors.secondary), bg);
      const mutedContrast = contrast(parseColor(colors.muted), bg);
      const buttonContrast = contrast(parseColor(colors.buttonText), parseColor(colors.buttonBg));

      assert(primaryContrast >= 7, `${theme}: primary text contrast is ${primaryContrast.toFixed(2)}.`);
      assert(secondaryContrast >= 4.5, `${theme}: secondary text contrast is ${secondaryContrast.toFixed(2)}.`);
      assert(mutedContrast >= 3, `${theme}: muted text contrast is ${mutedContrast.toFixed(2)}.`);
      assert(buttonContrast >= 4.5, `${theme}: primary button contrast is ${buttonContrast.toFixed(2)}.`);
      assert(colorDistance(card, bg) >= 10, `${theme}: card surface merges into the page background.`);
      assert(colorDistance(dock, bg) >= 10, `${theme}: dock surface merges into the page background.`);
      assert(parseColor(colors.border).a >= 0.08, `${theme}: subtle border is too faint.`);
      assert(colors.overflow <= 1, `${theme}: desktop page has horizontal overflow.`);

      await page.keyboard.down('Control');
      await page.keyboard.press('KeyK');
      await page.keyboard.up('Control');
      await page.waitForFunction(() => !document.querySelector('[data-cmd-backdrop]').hidden);
      const palette = await page.evaluate(() => {
        const backdrop = document.querySelector('[data-cmd-backdrop]');
        const dialog = backdrop.querySelector('.cmd-palette');
        const input = backdrop.querySelector('input');
        return {
          backdrop: getComputedStyle(backdrop).backgroundColor,
          dialog: getComputedStyle(dialog).backgroundColor,
          text: getComputedStyle(input).color,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      const dialog = parseColor(palette.dialog);
      assert(contrast(parseColor(palette.text), dialog) >= 4.5, `${theme}: command palette text is unreadable.`);
      assert(colorDistance(dialog, composite(parseColor(palette.backdrop), bg)) >= 10, `${theme}: command palette does not separate from its backdrop.`);
      assert(palette.overflow <= 1, `${theme}: open command palette causes horizontal overflow.`);
      await page.keyboard.press('Escape');
    }

    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewport(viewport);
      await page.reload({ waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow <= 1, `${viewport.width}x${viewport.height}: responsive page has horizontal overflow.`);
    }

    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS color system: ${themes.length} themes, contrast, layering, palette, docks, source tokens, and responsive overflow are stable.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
