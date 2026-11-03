import { test, expect } from 'playwright/test';

test('a cleanup-only tank can be fed and Nassarius emerge without repeated timer resets', async ({
    page
}) => {
    await page.goto('/');
    await page.locator('.tank-option').nth(1).click();
    await page.locator('#pauseBtn').click();
    await page.evaluate(() => {
        const e = window.gameEngine;
        e.state.cycleComplete = true;
        e.state.water.salinity = 35;
        e.buyEquipment('tank');
        e.buyEquipment('substrate');
        e.buyCleanup('nassariusSnail');
        clearInterval(e.tickTimer);
        e.state.paused = false;
    });
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    [...window.gameEngine.renderer.cleanupMeshes.values()][0]
                        ?.userData.burrowDepth
            )
        )
        .toBe(0.1);
    await page.locator('#btnFeedFish').click();
    await expect
        .poll(() => page.evaluate(() => window.gameEngine.state.feedingsToday))
        .toBe(1);
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    [...window.gameEngine.renderer.cleanupMeshes.values()][0]
                        ?.userData.burrowDepth
            )
        )
        .toBe(0);
    expect(
        await page.evaluate(() => window.gameEngine.state.livestock.length)
    ).toBe(0);
});
