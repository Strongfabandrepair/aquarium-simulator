import { test, expect } from 'playwright/test';
import { build } from 'esbuild';

test.beforeAll(async () => {
    await build({
        entryPoints: ['tests/wildlife-harness.js'],
        bundle: true,
        format: 'esm',
        outfile: 'artifacts/wildlife-harness.js'
    });
});

for (const category of ['Fish', 'Corals', 'Cleanup']) {
    test(`all ${category} have valid detailed geometry and render without shader errors`, async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => {
            if (m.type() === 'error') errors.push(m.text());
        });
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.goto('/');
        const results = await page.evaluate(async (category) => {
            const harness = await import('/artifacts/wildlife-harness.js');
            return harness.showWildlife(category);
        }, category);
        for (const result of results) {
            expect(result.finite, result.species).toBe(true);
            expect(result.vertices, result.species).toBeGreaterThan(300);
            expect(result.triangles, result.species).toBeGreaterThan(100);
        }
        await page.screenshot({
            path: `artifacts/wildlife-${category.toLowerCase()}.png`,
            fullPage: true
        });
        expect(errors).toEqual([]);
        console.log(category, JSON.stringify(results));
    });
}
