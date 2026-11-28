import { test, expect } from '@playwright/test';

for (const width of [390,1440]) {
  test('one-way photo introduction at '+width, async ({ page }) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await expect(page.locator('#nav')).toBeHidden();
    await expect(page.locator('a:visible,button:visible')).toHaveCount(2);
    const bounds=await page.locator('#cleanroom').boundingBox();
    expect(bounds).toEqual({x:0,y:0,width,height:900});
    await page.getByRole('button',{name:'Meet the engineer'}).click();
    await expect(page.getByRole('dialog')).toContainText('What problem are we solving?');
    await expect(page.locator('.research-questions li')).toHaveCount(3);
    await page.getByRole('button',{name:'The tests',exact:true}).click();
    await page.getByRole('button',{name:'Close guide'}).click();
    const originalCanvas=await page.locator('#stage canvas').elementHandle();
    await page.locator('.room-chip').click();
    await expect(page.locator('.chip-handoff')).toHaveCount(0,{timeout:5000});
    if (originalCanvas) expect(await originalCanvas.evaluate(el=>el===document.querySelector('#stage canvas'))).toBe(true);
    await expect(page.locator('#view')).toHaveValue('top',{timeout:15000});
    await expect(page.locator('#cleanroom')).toHaveCount(0);
    await expect(page.locator('#nav a[href="#cleanroom"]')).toHaveCount(0);
    await page.goto('/#cleanroom');
    await expect(page.locator('#explore')).toBeVisible();
    await page.goto('/');
    await expect(page.locator('#cleanroom')).toHaveCount(0);
    await page.getByRole('link',{name:'Glossary',exact:true}).first().click();
    await expect(page.locator('#gsearch')).toBeVisible();
  });
}
