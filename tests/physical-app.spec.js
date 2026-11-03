import { test, expect } from 'playwright/test';

for (const shape of ['rectangular', 'cube', 'cylinder', 'bowfront']) {
    test(`custom ${shape} uses meter dimensions, water outline and saved volume`, async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/');
        await page.locator('.custom-tank summary').click();
        await page.locator('[name=shape]').selectOption(shape);
        await page.locator('[name=width]').fill('90');
        if (shape !== 'cube') await page.locator('[name=height]').fill('55');
        if (!['cube', 'cylinder'].includes(shape))
            await page.locator('[name=depth]').fill('50');
        await page
            .getByRole('button', { name: 'Start custom tank', exact: true })
            .click();
        await page.locator('#pauseBtn').click();
        await page.evaluate(() => {
            const e = window.gameEngine;
            for (const id of [
                'tank',
                'substrate',
                'liveRock',
                'lightReef',
                'heater',
                'powerhead',
                'proteinSkimmer'
            ])
                e.buyEquipment(id);
            e.state.cycleComplete = true;
            e.state.water.salinity = 35;
            e.buyFish('greenChromis');
            e.buyFish('greenChromis');
            e.buyCoral('toadstoolLeather');
            e.buyCleanup('trochusSnail');
            e.save();
        });
        await expect
            .poll(() =>
                page.evaluate(() => window.gameEngine.renderer.fishMeshes.size)
            )
            .toBe(2);
        const data = await page.evaluate(() => {
            const e = window.gameEngine,
                r = e.renderer;
            r.waterMesh.geometry.computeBoundingBox();
            const box = r.waterMesh.geometry.boundingBox;
            return {
                spec: r.tankSpec,
                gallons: e.state.tankGallons,
                waterWidth: box.max.x - box.min.x,
                fish: e.state.livestock[0].lengthM,
                placed: e.state.placedItems.length
            };
        });
        expect(data.spec.shape).toBe(shape);
        expect(data.spec.width).toBe(0.9);
        expect(data.waterWidth).toBeCloseTo(0.9, 4);
        expect(data.gallons).toBeGreaterThan(20);
        expect(data.fish).toBeLessThan(0.06);
        expect(data.placed).toBeGreaterThanOrEqual(4);
        await page.screenshot({
            path: `artifacts/tank-${shape}.png`,
            fullPage: true
        });
        await page.reload();
        await page.locator('#resumeButton').click();
        expect(
            await page.evaluate(() => window.gameEngine.state.tankSpec.shape)
        ).toBe(shape);
        expect(errors).toEqual([]);
    });
}

test('raycast editor saves a moved coral, rotation snaps, feeding and remains removal work', async ({
    page
}) => {
    test.setTimeout(90000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.locator('.tank-option').nth(2).click();
    await page.locator('#pauseBtn').click();
    await page.evaluate(() => {
        const e = window.gameEngine;
        for (const id of ['tank', 'substrate', 'liveRock', 'lightReef'])
            e.buyEquipment(id);
        e.state.cycleComplete = true;
        e.state.water.salinity = 35;
        e.buyFish('clownfish');
        e.buyCoral('zoanthids');
        e.buyCleanup('nassariusSnail');
    });
    await page.locator('#aquascapePanel summary').click();
    await expect(page.locator('#placementItem option')).toHaveCount(5);
    await page.locator('#placementItem').selectOption('coral:1');
    await page.locator('#placementBegin').click();
    await page.locator('#placementRight').click();
    const target = await page.evaluate(() => {
        const r = window.gameEngine.renderer,
            h = r._wildlifeContext.habitat;
        const p = r.camera.position
            .clone()
            .set(r.tankSpec.width * 0.36, h.floorY, r.tankSpec.depth * 0.28)
            .project(r.camera);
        const rect = r.renderer.domElement.getBoundingClientRect();
        return {
            x: rect.left + ((p.x + 1) * rect.width) / 2,
            y: rect.top + ((1 - p.y) * rect.height) / 2
        };
    });
    await page.mouse.move(target.x, target.y);
    await expect
        .poll(() =>
            page.evaluate(
                () => window.gameEngine.renderer.placement.pending?.valid
            )
        )
        .toBe(true);
    await page.mouse.click(target.x, target.y);
    const placement = await page.evaluate(() =>
        window.gameEngine.state.placedItems.find((i) => i.kind === 'coral')
    );
    expect(placement.rotation).toBeCloseTo(Math.PI / 12);
    await page.waitForTimeout(250);
    expect(
        await page.evaluate(
            () =>
                window.gameEngine.state.placedItems.find(
                    (i) => i.kind === 'coral'
                ).position
        )
    ).toEqual(placement.position);
    await page.locator('#placementEnabled').uncheck();
    await page.locator('#foodType').selectOption('meaty');
    await page.locator('#btnFeedFish').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.feedingEvent.diet)
    ).toBe('meaty');
    await page.evaluate(() => {
        const e = window.gameEngine;
        e.state.livestock[0].alive = false;
        e.state.livestock[0].health = 0;
        e.render();
    });
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await page.locator('[data-remove-kind=fish]').click();
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.fishMeshes.size)
        )
        .toBe(0);
    await page.reload();
    await page.locator('#resumeButton').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.livestock.length)
    ).toBe(0);
    expect(
        await page.evaluate(
            () =>
                window.gameEngine.state.placedItems.find(
                    (i) => i.kind === 'coral'
                ).rotation
        )
    ).toBeCloseTo(Math.PI / 12);
    expect(errors).toEqual([]);
});
