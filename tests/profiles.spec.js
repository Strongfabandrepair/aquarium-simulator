import { test, expect } from 'playwright/test';

test('switching named profiles preserves both tanks independently', async ({page}) => {
    await page.goto('/');
    await page.locator('.tank-option').nth(1).click();
    await page.locator('#pauseBtn').click();
    await page.evaluate(()=>{window.gameEngine.state.budget=4321;});
    await page.getByRole('button',{name:'👤 Profile',exact:true}).click();
    await page.locator('#newProfileName').fill('Second tank');
    await page.locator('#createNewProfileBtn').click();
    await page.locator('.modal-close').click();
    await page.locator('.tank-option').first().click();
    expect(await page.evaluate(()=>window.gameEngine.state.tankGallons)).toBe(20);
    await page.getByRole('button',{name:'👤 Profile',exact:true}).click();
    await page.locator('[data-profile="Default"]').click();
    await page.locator('#resumeButton').click();
    expect(await page.evaluate(()=>window.gameEngine.state.budget)).toBe(4321);
    expect(await page.evaluate(()=>window.gameEngine.state.tankGallons)).toBe(55);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('reefSimProfiles'))['Second tank'].tankGallons)).toBe(20);
});

for (const [index,gallons,budget] of [[0,20,1500],[1,55,5000],[2,120,8000]]) {
    test(`starts ${gallons}-gallon tank with correct budget`,async({page})=>{
        await page.goto('/');await page.locator('.tank-option').nth(index).click();
        expect(await page.evaluate(()=>window.gameEngine.state.tankGallons)).toBe(gallons);
        expect(await page.evaluate(()=>window.gameEngine.state.budget)).toBe(budget);
    });
}
