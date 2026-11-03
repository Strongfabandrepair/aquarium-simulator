import { test, expect } from 'playwright/test';

test('reef renders, resizes, frees removed meshes, and opens quizzes', async ({
    page
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('/');
    await page.locator('.tank-option').first().click();
    await page.evaluate(() => {
        const engine = window.gameEngine;
        engine.state.paused = true;
        Object.assign(engine.state.equipment, {
            tank: true,
            stand: true,
            substrate: 80,
            liveRock: 80,
            lightReef: true,
            lightOn: true,
            powerhead: true,
            powerheadOn: true
        });
        engine.state.water.salinity = 35;
        engine.state.cycleComplete = true;
        engine.state.budget = 10000;
        engine.buyFish('clownfish');
        engine.buyFish('yellowTang');
        engine.render();
    });
    await page.waitForTimeout(300);
    const scene = await page.evaluate(() => {
        const renderer = window.gameEngine.renderer;
        return {
            fish: renderer.fishMeshes.size,
            surface: renderer.waterMesh.geometry.type,
            triangles: renderer.renderer.info.render.triangles,
            pixelRatio: renderer.renderer.getPixelRatio()
        };
    });
    expect(scene.fish).toBeGreaterThan(0);
    expect(scene.surface).toBe('ShapeGeometry');
    expect(scene.triangles).toBeGreaterThan(0);
    expect(scene.pixelRatio).toBeLessThanOrEqual(2);
    await page.screenshot({
        path: 'artifacts/reef-review.png',
        fullPage: true
    });
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect
        .poll(() =>
            page.evaluate(() => {
                const r = window.gameEngine.renderer;
                return Math.abs(
                    r.camera.aspect -
                        r.container.clientWidth / r.container.clientHeight
                );
            })
        )
        .toBeLessThan(0.01);
    await page.evaluate(() => {
        window.gameEngine.state.livestock = [];
    });
    await expect
        .poll(() =>
            page.evaluate(() => window.gameEngine.renderer.fishMeshes.size)
        )
        .toBe(0);
    await page.locator('.right-tab', { hasText: 'Knowledge' }).click();
    const topic = page.locator(
        '[data-action="read-kb"][data-key="nitrogenCycle"]'
    );
    await topic.click();
    await expect(page.locator('#modalBody')).toContainText(/ammonia/i);
    await page.locator('.modal-close').click();
    await topic.click();
    await page.locator('.modal-close').click();
    await topic.locator('.quiz-btn').click();
    await expect(page.locator('.quiz-question')).toBeVisible();
    expect(errors).toEqual([]);
});
