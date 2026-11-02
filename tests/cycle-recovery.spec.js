import { test, expect } from 'playwright/test';

test('a saved zero-nitrate tank completes cycling and permits a fish purchase', async ({
    page
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.locator('.tank-option').nth(1).click();
    await page.evaluate(() => {
        const engine = window.gameEngine;
        const state = engine.state;
        state.paused = true;
        state.cycleDay = 25;
        state.cycleComplete = false;
        state.phase = 1;
        state.ghostFedForCycle = true;
        Object.assign(state.water, {
            salinity: 35,
            ammonia: 0,
            nitrite: 0,
            nitrate: 0
        });
        Object.assign(state.equipment, {
            tank: true,
            heater: true,
            autoTopOff: true,
            proteinSkimmer: true,
            proteinSkimmerOn: true,
            macroAlgae: true
        });
        engine.save();
    });
    await page.reload();
    await page.locator('#resumeButton').click();
    await page.locator('#pauseBtn').click();
    await expect
        .poll(() => page.evaluate(() => window.gameEngine.state.cycleComplete))
        .toBe(true);
    await page.locator('#pauseBtn').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.water.nitrate)
    ).toBe(0);
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await page.locator('[data-action="buy-fish"][data-id="clownfish"]').click();
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.fishMeshes.size)
        )
        .toBe(1);
    expect(
        await page.evaluate(
            () => window.gameEngine.state.livestock[0].templateId
        )
    ).toBe('clownfish');
    expect(errors).toEqual([]);
});
