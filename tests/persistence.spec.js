import { test, expect } from 'playwright/test';

test('legacy browser profile imports without losing purchases', async ({
    page
}) => {
    await page.addInitScript(() => {
        if (!sessionStorage.getItem('legacySeeded')) {
            localStorage.setItem(
                'reefSimProfiles',
                JSON.stringify({
                    'Legacy reef': {
                        profileName: 'Legacy reef',
                        started: false,
                        money: 321,
                        equipment: { liveRock: 7 }
                    }
                })
            );
            localStorage.setItem('reefSimActiveProfile', 'Legacy reef');
            sessionStorage.setItem('legacySeeded', '1');
        }
    });
    await page.goto('/');
    await page.waitForFunction(() => window.gameEngine);
    const response = await page.request.get('/api/profiles');
    expect(
        (await response.json()).profiles['Legacy reef'].equipment.liveRock
    ).toBe(7);
});

test('browser profiles migrate to SQLite and restore after local cache loss', async ({
    page
}) => {
    await page.goto('/');
    await page.waitForFunction(() => window.gameEngine);
    await page.evaluate(() => {
        window.gameEngine.gameState.reset('medium', 'Durable reef');
        window.gameEngine.state.started = true;
        window.gameEngine.state.money = 4321;
        window.gameEngine.state.placedItems = [
            {
                id: 'rock-saved',
                kind: 'rock',
                position: { x: 0.1, y: -0.2, z: 0.1 },
                size: 0.12,
                rotation: 0.3,
                baseSize: 0.1
            }
        ];
        window.gameEngine.save();
    });
    await expect(page.locator('#saveStatus')).toHaveText('Saved');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.gameEngine);
    const saved = await page.evaluate(
        () =>
            JSON.parse(localStorage.getItem('reefSimProfiles'))['Durable reef']
    );
    expect(saved.money).toBe(4321);
    expect(saved.placedItems[0].size).toBe(0.12);
    expect(saved.placedItems[0].baseSize).toBe(0.1);
});

test('failed database writes retain local purchase state and report failure', async ({
    page
}) => {
    await page.goto('/');
    await page.waitForFunction(() => window.gameEngine);
    await page.route('**/api/profiles', (route) =>
        route.request().method() === 'PUT'
            ? route.fulfill({ status: 503, body: '{}' })
            : route.continue()
    );
    await page.evaluate(() => {
        window.gameEngine.gameState.reset('medium', 'Offline reef');
        window.gameEngine.state.money = 456;
        window.gameEngine.save();
    });
    await expect(page.locator('#saveStatus')).toContainText(
        'local backup retained'
    );
    expect(
        await page.evaluate(
            () =>
                JSON.parse(localStorage.getItem('reefSimProfiles'))[
                    'Offline reef'
                ].money
        )
    ).toBe(456);
});
