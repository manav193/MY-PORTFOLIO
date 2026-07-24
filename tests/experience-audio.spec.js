import { test, expect } from '@playwright/test';

test.describe('ArcadeOS boot and premium audio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.ArcadeBootController && window.ArcadeAudioManager);
  });

  test('cold boot is staged, branded, and completes inside the target window', async ({ page }) => {
    const startedAt = Date.now();
    await page.evaluate(() => {
      if (!window.ArcadeOS.booted) window.ArcadeOS.boot();
      window.ArcadeBootController.triggerBootSequence();
    });

    await expect(page.locator('.boot-mark')).toHaveCount(1);
    await expect(page.locator('.boot-diagnostics span')).toHaveCount(3);
    await expect(page.locator('.boot-sync')).toContainText('ENVIRONMENT SYNC');
    await expect.poll(() => page.evaluate(() => window.ArcadeBootController.isWarm), {
      timeout: 4000
    }).toBe(true);

    const measured = await page.evaluate(() => window.ArcadeBootController.lastDuration);
    expect(measured).toBeGreaterThanOrEqual(1200);
    expect(measured).toBeLessThanOrEqual(3000);
  });

  test('warm re-entry uses wake pulse and completes in 250–500ms', async ({ page }) => {
    await page.evaluate(async () => {
      window.ArcadeAudioManager.initFromGesture();
      window.ArcadeBootController.isWarm = true;
      await window.ArcadeBootController.triggerBootSequence();
    });

    const duration = await page.evaluate(() => window.ArcadeBootController.lastDuration);
    expect(duration).toBeGreaterThanOrEqual(250);
    expect(duration).toBeLessThanOrEqual(500);
    await expect(page.locator('.crt-boot-sequence')).toHaveCount(0);
  });

  test('reverse navigation cancels an in-flight boot without a delayed reveal', async ({ page }) => {
    await page.evaluate(() => {
      if (!window.ArcadeOS.booted) window.ArcadeOS.boot();
      window.ArcadeBootController.triggerBootSequence();
    });
    await page.waitForTimeout(100);
    await page.evaluate(() => window.ArcadeBootController.cancel());
    await page.waitForTimeout(1650);

    const state = await page.evaluate(() => ({
      booting: window.ArcadeBootController.isBooting,
      warm: window.ArcadeBootController.isWarm,
      loading: document.getElementById('arcade-loading')?.classList.contains('active')
    }));
    expect(state).toEqual({ booting: false, warm: false, loading: false });
  });

  test('one manager exposes separate persisted channels and every shipped app sound bank', async ({ page }) => {
    const result = await page.evaluate(() => {
      const audio = window.ArcadeAudioManager;
      audio.setMasterVolume(0.65);
      audio.setSfxVolume(0.45);
      audio.setMusicVolume(0.25);
      const settings = window.ArcadeStorage.get(window.ArcadeStorage.KEYS.SETTINGS);
      return {
        sameSingleton: audio === window.ArcadeAudio,
        volumes: [settings.volume, settings.sfxVolume, settings.musicVolume],
        banks: Object.keys(audio.gameEffects),
        maxVoices: audio.maxOscillators
      };
    });

    expect(result.sameSingleton).toBe(true);
    expect(result.volumes).toEqual([0.65, 0.45, 0.25]);
    expect(result.banks.sort()).toEqual([
      'blockdrop', 'breakout', 'flappybyte', 'neonpong', 'pacmaze',
      'palettelab', 'pixelplumber', 'snake', 'spacewars', 'vectordrift',
      'voidinvaders'
    ]);
    expect(result.maxVoices).toBeLessThanOrEqual(24);
  });

  test('temporary voices and owner loops are cleaned on teardown', async ({ page }) => {
    await page.evaluate(() => {
      const audio = window.ArcadeAudioManager;
      audio.setMuted(false);
      audio.initFromGesture();
      audio.startLoop('test-game', 'engine', { frequency: 100, volume: 0.01 });
      audio.playGameSfx('spacewars', 'fire');
    });
    await expect.poll(() => page.evaluate(() => window.ArcadeAudioManager.activeNodes.size)).toBeGreaterThan(0);

    const cleaned = await page.evaluate(() => {
      window.ArcadeAudioManager.destroyTemporaryNodes();
      return {
        nodes: window.ArcadeAudioManager.activeNodes.size,
        loops: window.ArcadeAudioManager.activeLoops.size
      };
    });
    expect(cleaned).toEqual({ nodes: 0, loops: 0 });
  });
});
