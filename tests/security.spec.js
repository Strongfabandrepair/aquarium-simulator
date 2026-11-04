import { test, expect } from 'playwright/test';
test('saved journal and livestock markup is displayed as text, never executed', async ({
    page
}) => {
    await page.goto('/');
    await page.locator('.tank-option').first().click();
    await page.evaluate(() => {
        const e = window.gameEngine,
            payload = '<img src=x onerror="window.savedXSS=true">';
        e.state.journal = [{ time: payload, text: payload, tip: payload }];
        e.state.knowledge.nitrogenCycle =
            '\"><img src=x onerror="window.savedXSS=true">';
        e.state.feedingsToday = payload;
        e.state.livestock = [
            {
                id: '"><img src=x onerror="window.savedXSS=true">',
                templateId: 'clownfish',
                name: payload,
                icon: payload,
                health: 0,
                alive: false,
                lengthM: 0.04
            }
        ];
        e.state.corals = [
            {
                id: 'bad-coral',
                templateId: 'zoanthids',
                name: payload,
                icon: payload,
                health: 0,
                alive: false,
                diameterM: 0.05
            }
        ];
        e.state.cleanupCrew = [
            {
                id: 'bad-cleaner',
                templateId: 'turboSnail',
                name: payload,
                health: 0,
                alive: false,
                count: 1
            }
        ];
        e.save();
        e.render();
    });
    await page.locator('.right-tab', { hasText: 'Journal' }).click();
    await expect(page.locator('#tab-journal')).toContainText('<img src=x');
    expect(await page.locator('#tab-journal img').count()).toBe(0);
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await expect(page.locator('#tab-livestock')).toContainText('<img src=x');
    expect(await page.locator('#tab-livestock img').count()).toBe(0);
    expect(await page.evaluate(() => window.savedXSS)).toBeUndefined();
});
