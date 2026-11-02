import { test, expect } from 'playwright/test';

test('cleanup purchase renders every individual and removes stale models', async ({
    page
}) => {
    await page.goto('/');
    await page.locator('.tank-option').first().click();
    await page.evaluate(() => {
        const s = window.gameEngine.state;
        s.paused = true;
        s.cycleComplete = true;
        s.equipment.tank = true;
        s.water.salinity = 35;
        s.budget = 5000;
    });
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await page
        .locator('[data-action="buy-cleanup"][data-id="cleanerShrimp"]')
        .click();
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.cleanupMeshes.size)
        )
        .toBe(1);
    await page
        .locator('[data-action="buy-cleanup"][data-id="cleanerShrimp"]')
        .click();
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.cleanupMeshes.size)
        )
        .toBe(2);
    await page.evaluate(() => {
        window.gameEngine.state.cleanupCrew = [];
    });
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.cleanupMeshes.size)
        )
        .toBe(0);
});
