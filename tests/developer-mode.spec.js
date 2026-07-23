import { test, expect } from '@playwright/test';

test.describe('NIMO Developer Mode and game-feel safeguards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.NIMO && window.ArcadeDeveloperMode && window.ArcadeGameFeel);
  });

  test('normal mode exposes no developer console or cheat controls', async ({ page }) => {
    const state = await page.evaluate(() => ({
      authorized: window.ArcadeDeveloperMode.authorized,
      enabled: window.ArcadeDeveloperMode.enabled,
      core: !!document.getElementById('arcade-developer-core'),
      visibleCheatText: document.body.innerText.includes('DEVELOPER CONSOLE')
    }));
    expect(state).toEqual({ authorized: false, enabled: false, core: false, visibleCheatText: false });
  });

  test('NIMO teases first, then grants a session-scoped service authorization', async ({ page }) => {
    const result = await page.evaluate(() => {
      const tease = window.NIMO.processUserQuery('Do you know any Arcade secrets?');
      const before = window.ArcadeDeveloperMode.authorized;
      const authorization = window.NIMO.processUserQuery('Show deeper Arcade secret');
      return {
        tease: tease.text,
        before,
        authorization,
        authorized: window.ArcadeDeveloperMode.authorized,
        code: window.ArcadeDeveloperMode.sessionCode,
        persistedActive: localStorage.getItem('arcade_cheat_mode_active')
      };
    });

    expect(result.tease).toContain('service layer');
    expect(result.before).toBe(false);
    expect(result.authorized).toBe(true);
    expect(result.code).toMatch(/^NIMO:\/\/OVERRIDE-[A-Z0-9]+$/);
    expect(result.authorization.text).toContain('Developer Mode remains OFF');
    expect(result.persistedActive).toBeNull();
  });

  test('service access opens without reparenting the cabinet and Overdrive restores cleanly', async ({ page }) => {
    await page.evaluate(() => {
      window.ArcadeDeveloperMode.authorizeFromNimo();
      window.ArcadeDeveloperMode.openServiceAccess();
    });
    await expect(page.locator('#arcade-developer-core')).toHaveClass(/is-open/);
    await expect(page.locator('#arcade-developer-core')).toContainText('NIMO AUTHORIZATION');
    await expect(page.locator('#arcade-developer-core')).toContainText('PROJECT // MA-X01');

    await page.locator('[data-dev-action="enable"]').click();
    await expect(page.locator('.cabinet-chassis')).toHaveClass(/cabinet-overdrive/);
    await expect(page.locator('#nimo-widget')).toHaveClass(/nimo-override-active/);
    await expect(page.locator('#arcade-developer-core')).toContainText('DEVELOPER CONSOLE');

    await page.locator('[data-dev-action="restore"]').click();
    await expect(page.locator('.cabinet-chassis')).not.toHaveClass(/cabinet-overdrive/);
    await expect(page.locator('#nimo-widget')).not.toHaveClass(/nimo-override-active/);
    expect(await page.evaluate(() => window.ArcadeDeveloperMode.gameSpeed)).toBe(1);
  });

  test('every shipped game receives game-aware controls and marks modified runs', async ({ page }) => {
    const games = [
      'pacmaze', 'pixelplumber', 'flappybyte', 'spacewars', 'snake',
      'breakout', 'neonpong', 'voidinvaders', 'vectordrift', 'blockdrop'
    ];
    const coverage = await page.evaluate((ids) => {
      const dev = window.ArcadeDeveloperMode;
      dev.authorizeFromNimo();
      dev.enable();
      return ids.map(id => {
        dev.activeGameId = id;
        dev.openServiceAccess();
        const buttons = [...document.querySelectorAll('[data-dev-modifier]')];
        buttons[0]?.click();
        return {
          id,
          controls: buttons.map(button => button.textContent.trim()),
          modified: dev.isCheatSession,
          indicator: document.getElementById('arcade-cheat-indicator')?.textContent || ''
        };
      });
    }, games);

    for (const game of coverage) {
      expect(game.controls.length, `${game.id} controls`).toBeGreaterThan(0);
      expect(game.modified).toBe(true);
      expect(game.indicator).toContain('SCORE INVALID');
    }
  });

  test('cheat scores are isolated and a new clean run can save normally', async ({ page }) => {
    const result = await page.evaluate(() => {
      const key = 'arcade_pacmaze_best';
      localStorage.setItem(key, JSON.stringify(100));
      const dev = window.ArcadeDeveloperMode;
      dev.authorizeFromNimo();
      dev.enable();
      dev.toggleModifier('pacmaze', 'invincible');
      dev.beginRun('pacmaze');
      window.ArcadeStorage.set(key, 9999);
      const dirtyStored = JSON.parse(localStorage.getItem(key));
      const isolated = JSON.parse(sessionStorage.getItem(`developer_${key}`));
      dev.restoreStandardMode();
      dev.beginRun('pacmaze');
      window.ArcadeStorage.set(key, 250);
      return { dirtyStored, isolated, cleanStored: JSON.parse(localStorage.getItem(key)), clean: !dev.isCheatSession };
    });
    expect(result).toEqual({ dirtyStored: 100, isolated: 9999, cleanStored: 250, clean: true });
  });

  test('normalized delta-time movement is refresh-rate independent', async ({ page }) => {
    const totals = await page.evaluate(() => {
      const step = window.ArcadeGameFeel.arcadeFrameStep;
      const sample = hz => {
        const app = { _frameTimestamp: 1000 };
        let total = 0;
        for (let frame = 1; frame <= hz; frame++) total += step(app, 1000 + frame * (1000 / hz), 'test');
        return total;
      };
      return { at60: sample(60), at120: sample(120), at144: sample(144) };
    });
    expect(totals.at60).toBeCloseTo(60, 1);
    expect(totals.at120).toBeCloseTo(60, 1);
    expect(totals.at144).toBeCloseTo(60, 1);
  });
});
