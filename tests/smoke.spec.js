import { test, expect } from 'playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.tank-option').nth(1).click();
    await page.locator('#pauseBtn').click();
});

test('fresh setup reaches seawater, cycles and permits livestock', async ({
    page
}) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const id of [
        'tank',
        'heater',
        'powerhead',
        'liveRock',
        'saltMix',
        'lightBasic'
    ])
        await page
            .locator(`[data-action="buy-equip"][data-id="${id}"]`)
            .click();
    await page.evaluate(() => {
        for (let i = 0; i < 96; i++) window.gameEngine.tick();
    });
    expect(
        await page.evaluate(() => window.gameEngine.state.water.salinity)
    ).toBeGreaterThanOrEqual(34);
    await page.locator('#btnGhostFeed').click();
    await page.evaluate(() => {
        for (let i = 0; i < 96 * 15; i++) window.gameEngine.tick();
    });
    expect(
        await page.evaluate(() => window.gameEngine.state.cycleComplete)
    ).toBe(true);
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await page.locator('[data-action="buy-fish"][data-id="clownfish"]').click();
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.state.livestock.length)
        )
        .toBe(1);
    await page
        .locator('[data-action="buy-coral"][data-id="zoanthids"]')
        .click();
    await expect
        .poll(() => page.evaluate(() => window.gameEngine.state.corals.length))
        .toBe(1);
    expect(errors).toEqual([]);
});

test('feeding and control changes survive reload with correct timer and labels', async ({
    page
}) => {
    await page.evaluate(() => {
        const e = window.gameEngine;
        e.state.cycleComplete = true;
        e.state.water.salinity = 35;
        e.state.equipment.tank = true;
        e.buyFish('clownfish');
    });
    await page.locator('#btnFeedFish').click();
    await page.locator('#speed20').click();
    await page.reload();
    await page.locator('#resumeButton').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.feedingsToday)
    ).toBe(1);
    await expect(page.locator('#speed20')).toHaveClass(/active/);
    await expect(page.locator('#pauseBtn')).toHaveText('▶');
    const before = await page.evaluate(() => window.gameEngine.state.minute);
    await page.locator('#pauseBtn').click();
    await expect
        .poll(() => page.evaluate(() => window.gameEngine.state.minute), {
            timeout: 800
        })
        .not.toBe(before);
});

test('closing a quiz during feedback keeps it closed', async ({ page }) => {
    await page.locator('.right-tab', { hasText: 'Knowledge' }).click();
    const topic = page.locator(
        '[data-action="read-kb"][data-key="nitrogenCycle"]'
    );
    for (let i = 0; i < 2; i++) {
        await topic.click();
        await page.locator('.modal-close').click();
    }
    await topic.locator('.quiz-btn').click();
    await page.locator('.quiz-option-btn').first().click();
    await page.locator('.modal-close').click();
    await page.waitForTimeout(1700);
    await expect(page.locator('#modalOverlay')).not.toBeVisible();
});

test('profile names display as text and corrupted saves do not break boot', async ({
    page
}) => {
    await page.evaluate(() => {
        window.gameEngine.state.started = false;
        localStorage.setItem('reefSimProfiles', 'broken');
    });
    await page.reload();
    await page.locator('#profileBtn').click();
    await expect(page.locator('#newProfileName')).toBeVisible();
    await page.locator('#newProfileName').fill('<b>Reef</b>');
    await page.locator('#createNewProfileBtn').click();
    await expect(
        page.locator('[data-profile]').filter({ hasText: '<b>Reef</b>' })
    ).toContainText('<b>Reef</b>');
    expect(await page.locator('[data-profile] b').count()).toBe(0);
});
