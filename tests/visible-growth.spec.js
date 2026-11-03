import { test, expect } from 'playwright/test';

test('maturation enlarges rendered fish and coral and preserves sizes on reload', async ({
    page
}) => {
    await page.goto('/');
    await page.locator('.tank-option').nth(2).click();
    await page.locator('#pauseBtn').click();
    const result = await page.evaluate(async () => {
        const e = window.gameEngine;
        for (const id of ['tank', 'substrate', 'liveRock', 'lightReef'])
            e.buyEquipment(id);
        e.state.cycleComplete = true;
        e.state.water.salinity = 35;
        e.buyFish('clownfish');
        e.buyCoral('zoanthids');
        e.renderer.render(e.state);
        const fish = e.state.livestock[0],
            coral = e.state.corals[0];
        const before = [
            e.renderer.fishMeshes.get(fish.id).scale.x,
            e.renderer.coralMeshes.get(coral.id).scale.x
        ];
        const { tickHusbandry } = await import('/js/model/Husbandry.js');
        tickHusbandry(e.state, 24 * 30);
        e.renderer.render(e.state);
        const after = [
            e.renderer.fishMeshes.get(fish.id).scale.x,
            e.renderer.coralMeshes.get(coral.id).scale.x
        ];
        e.save();
        return { before, after, sizes: [fish.lengthM, coral.diameterM] };
    });
    expect(result.after[0]).toBeGreaterThan(result.before[0]);
    expect(result.after[1]).toBeGreaterThan(result.before[1]);
    await page.reload();
    await page.locator('#resumeButton').click();
    expect(
        await page.evaluate(() => [
            window.gameEngine.state.livestock[0].lengthM,
            window.gameEngine.state.corals[0].diameterM
        ])
    ).toEqual(result.sizes);
});
