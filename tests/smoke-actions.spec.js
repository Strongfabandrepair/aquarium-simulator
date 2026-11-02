import { test, expect } from 'playwright/test';

test('maintenance, test kit and purchasing guards work', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.locator('.tank-option').nth(1).click();
    await page.locator('#pauseBtn').click();
    await page.locator('.right-tab', { hasText: 'Livestock' }).click();
    await page.locator('[data-id="clownfish"]').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.livestock.length)
    ).toBe(0);
    await page.evaluate(() => {
        const s = window.gameEngine.state;
        Object.assign(s.equipment, {
            tank: true,
            saltMix: 30,
            rodiUnit: true,
            testKit: true
        });
        Object.assign(s.water, { salinity: 36, nitrate: 20, ammonia: 1 });
        s.algaeLevel = 40;
    });
    await page.locator('#btnWaterChange').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.water.nitrate)
    ).toBe(17);
    expect(
        await page.evaluate(() => window.gameEngine.state.equipment.saltMix)
    ).toBe(21);
    await page.locator('#btnTopOff').click();
    expect(
        await page.evaluate(() => window.gameEngine.state.water.salinity)
    ).toBe(35.5);
    await page.locator('#btnCleanGlass').click();
    expect(await page.evaluate(() => window.gameEngine.state.algaeLevel)).toBe(
        20
    );
    await page.getByRole('button', { name: '🧪 Test Water' }).click();
    await expect(page.locator('#modalBody')).toContainText('17.00');
    expect(errors).toEqual([]);
});

test('quiz can finish, award knowledge and save results', async ({ page }) => {
    await page.goto('/');
    await page.locator('.tank-option').first().click();
    await page.locator('#pauseBtn').click();
    await page.evaluate(() => {
        window.gameEngine.state.knowledge.nitrogenCycle = 40;
    });
    await page.locator('.right-tab', { hasText: 'Knowledge' }).click();
    await page.locator('[data-key="nitrogenCycle"] .quiz-btn').click();
    const count = await page.evaluate(
        () => window.gameEngine.currentQuiz.questions.length
    );
    for (let i = 0; i < count; i++) {
        await expect(page.locator('.quiz-modal-content h3')).toHaveText(
            `Question ${i + 1} of ${count}`
        );
        const correct = await page.evaluate(() => {
            const q = window.gameEngine.currentQuiz;
            return q.questions[q.currentQuestionIndex].correct;
        });
        await page.locator('.quiz-option-btn').nth(correct).click();
    }
    await expect(page.locator('#modalTitle')).toHaveText('Quiz Results');
    expect(
        await page.evaluate(
            () => window.gameEngine.state.knowledge.nitrogenCycle
        )
    ).toBe(65);
});

test('autosave runs and reset stays cleared after reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('.tank-option').first().click();
    await page.locator('#pauseBtn').click();
    await page.evaluate(() => {
        const s = window.gameEngine.state;
        s.autosaveSeconds = 1;
        s.budget = 1234;
    });
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    JSON.parse(localStorage.getItem('reefSimProfiles')).Default
                        .budget
            )
        )
        .toBe(1234);
    await page.reload();
    await page.locator('#resetBtn').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    expect(
        await page.evaluate(() => localStorage.getItem('reefSimProfiles'))
    ).toBe(null);
});

test('mobile viewport exposes simulation controls and tank', async ({
    page
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('.tank-option').first().click();
    const bounds = await page.locator('#tank3D').boundingBox();
    expect(bounds.width).toBeGreaterThan(250);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    await expect(page.locator('#speed20')).toBeInViewport();
});
