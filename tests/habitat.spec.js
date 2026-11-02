import { test, expect } from 'playwright/test';

test('populated reef swims between chemistry ticks, seats colonies and separates cleanup animals', async ({
    page
}) => {
    test.setTimeout(90000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('/');
    await page.locator('.tank-option').nth(2).click();
    await page.locator('#pauseBtn').click();
    await page.evaluate(() => {
        const e = window.gameEngine;
        e.state.budget = 100000;
        e.state.cycleComplete = true;
        e.state.water.salinity = 35;
        for (const id of [
            'tank',
            'substrate',
            'liveRock',
            'heater',
            'autoTopOff',
            'lightReef',
            'powerhead'
        ])
            e.buyEquipment(id);
        for (const id of [
            'clownfish',
            'royalGramma',
            'firefishGoby',
            'yellowTang',
            'blueHippoTang',
            'banggaiCardinal',
            'tailspotBlenny',
            'sixLineWrasse',
            'mandarinGoby',
            'flameAngel'
        ])
            e.buyFish(id);
        for (const id of [
            'zoanthids',
            'greenStarPolyps',
            'mushrooms',
            'xeniaCorals',
            'hammerCoral',
            'torchCoral',
            'frogspawn',
            'acropora',
            'montipora',
            'birdsnest'
        ])
            e.buyCoral(id);
        for (const id of [
            'hermitCrab',
            'turboSnail',
            'nassariusSnail',
            'emeraldCrab',
            'cleanerShrimp',
            'peppermintShrimp'
        ])
            e.buyCleanup(id);
    });
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.cleanupMeshes.size),
            { timeout: 30000 }
        )
        .toBe(23);
    const sample = () =>
        page.evaluate(() => {
            const r = window.gameEngine.renderer;
            return {
                fish: [...r.fishMeshes.values()].map((m) => ({
                    species: m.userData.templateId,
                    p: m.position.toArray()
                })),
                cleanup: [...r.cleanupMeshes.values()].map((m) => ({
                    id: m.userData.id,
                    p: m.position.toArray()
                })),
                corals: [...r.coralMeshes.values()].map((m) => ({
                    p: m.position.toArray(),
                    radius: m.userData.placementRadius,
                    base: m.userData.coralBaseOffset * m.scale.x,
                    surface: m.userData.surfaceY
                })),
                clock: r._wildlifeTime
            };
        });
    const before = await sample();
    expect(before.fish).toHaveLength(10);
    expect(before.corals).toHaveLength(10);
    for (const [index, coral] of before.corals.entries()) {
        expect(Math.abs(coral.p[1] - coral.base - coral.surface)).toBeLessThan(
            0.02
        );
        for (const other of before.corals.slice(index + 1)) {
            expect(
                Math.hypot(coral.p[0] - other.p[0], coral.p[2] - other.p[2])
            ).toBeGreaterThanOrEqual(coral.radius + other.radius - 0.001);
        }
    }
    // Stop chemistry entirely: visible swimming must not rely on its timer.
    await page.evaluate(() => {
        clearInterval(window.gameEngine.tickTimer);
        window.gameEngine.state.paused = false;
    });
    await expect
        .poll(async () => (await sample()).clock - before.clock, {
            timeout: 30000
        })
        .toBeGreaterThan(3000);
    await page.evaluate(() => {
        window.gameEngine.state.paused = true;
    });
    const after = await sample();
    for (const species of [
        'yellowTang',
        'sixLineWrasse',
        'clownfish',
        'mandarinGoby'
    ]) {
        const a = before.fish.find((f) => f.species === species).p;
        const b = after.fish.find((f) => f.species === species).p;
        expect(
            Math.hypot(...a.map((v, i) => b[i] - v)),
            species
        ).toBeGreaterThan(0.03);
    }
    for (let i = 0; i < after.cleanup.length; i++) {
        for (const other of after.cleanup.slice(i + 1)) {
            const a = after.cleanup[i].p;
            expect(
                Math.hypot(...a.map((v, k) => v - other.p[k]))
            ).toBeGreaterThan(0.08);
        }
    }
    await page.waitForTimeout(400);
    expect((await sample()).fish).toEqual(after.fish);
    expect((await sample()).cleanup).toEqual(after.cleanup);
    await page.screenshot({
        path: 'artifacts/populated-reef.png',
        fullPage: true
    });
    await page.evaluate(() => window.gameEngine.save());
    await page.reload();
    await page.locator('#resumeButton').click();
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.coralMeshes.size)
        )
        .toBe(10);
    expect((await sample()).corals).toEqual(after.corals);
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await expect(
        page.locator('[data-action="buy-cleanup"][data-id="nassariusSnail"]')
    ).toContainText('not algae grazers');
    expect(errors).toEqual([]);
});
