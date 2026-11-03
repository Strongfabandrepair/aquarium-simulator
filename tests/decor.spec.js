import { test, expect } from 'playwright/test';

test('decor purchases, editor selection, backgrounds and reload retain ownership', async ({
    page
}) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.evaluate(() => {
        window.startGame('large');
        window.gameEngine.buyEquipment('tank');
        window.gameEngine.buyEquipment('lightReef');
        window.gameEngine.state.paused = true;
    });
    for (const id of [
        'limestonePebble',
        'corallineBoulder',
        'slateShelf',
        'reefArch',
        'shipwreck',
        'treasureChest'
    ])
        await page
            .locator(`[data-action="buy-equip"][data-id="${id}"]`)
            .click();
    expect(
        await page.evaluate(() => window.gameEngine.state.placedItems.length)
    ).toBe(6);
    expect(
        await page.evaluate(() => window.gameEngine.state.equipment.liveRock)
    ).toBe(0);
    await page.locator('#aquascapePanel summary').click();
    const ship = await page.evaluate(
        () =>
            window.gameEngine.state.placedItems.find(
                (i) => i.templateId === 'shipwreck'
            ).id
    );
    await page.locator('#placementItem').selectOption(`rock:${ship}`);
    await page.locator('#placementBegin').click();
    expect(
        await page.evaluate(
            () => window.gameEngine.renderer.placement.selection.id
        )
    ).toBe(ship);
    await page.locator('#placementRight').click();
    const target = await page.evaluate(() => {
        const r = window.gameEngine.renderer;
        const point = r.camera.position
            .clone()
            .set(-0.3, r.scene.userData.livestockHabitat.floorY, -0.16)
            .project(r.camera);
        const rect = r.renderer.domElement.getBoundingClientRect();
        return {
            x: rect.left + ((point.x + 1) * rect.width) / 2,
            y: rect.top + ((1 - point.y) * rect.height) / 2
        };
    });
    await page.locator('#aquascapePanel summary').click();
    await page.mouse.move(target.x, target.y);
    await page.mouse.click(target.x, target.y);
    expect(
        await page.evaluate(() => ({
            selection: window.gameEngine.renderer.placement.selection,
            pending: window.gameEngine.renderer.placement.pending
        }))
    ).toMatchObject({ selection: null });
    expect(
        await page.evaluate(
            (id) =>
                window.gameEngine.state.placedItems.find((i) => i.id === id)
                    .position.z,
            ship
        )
    ).toBeCloseTo(-0.16, 1);
    await page
        .locator('[data-action="buy-equip"][data-id="backgroundOcean"]')
        .click();
    await page
        .locator('[data-action="buy-equip"][data-id="backgroundReef"]')
        .click();
    const budget = await page.evaluate(() => window.gameEngine.state.budget);
    await page
        .locator('[data-action="buy-equip"][data-id="backgroundOcean"]')
        .click();
    expect(await page.evaluate(() => window.gameEngine.state.budget)).toBe(
        budget
    );
    expect(
        await page.evaluate(() => window.gameEngine.state.activeBackground)
    ).toBe('backgroundOcean');
    await page
        .locator('[data-action="buy-equip"][data-id="backgroundOcean"]')
        .click();
    expect(
        await page.evaluate(() => window.gameEngine.state.activeBackground)
    ).toBe(null);
    await page
        .locator('[data-action="buy-equip"][data-id="backgroundReef"]')
        .click();
    await page.evaluate(() => {
        document.getElementById('aquascapePanel').open = false;
    });
    await page.screenshot({ path: 'artifacts/decor-reef.png', fullPage: true });
    await page.reload();
    await page.locator('#resumeButton').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.activeBackground)
    ).toBe('backgroundReef');
    expect(
        await page.evaluate(() => window.gameEngine.state.placedItems.length)
    ).toBe(6);
    expect(errors).toEqual([]);
});
