import { test, expect } from '@playwright/test';

for (const width of [390,1440]) {
  test('one-way photo introduction at '+width, async ({ page }) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.getByRole('button',{name:'Meet the engineer'}).click();
    await expect(page.getByRole('dialog')).toContainText('Who gets to use shared memory?');
    await page.getByRole('button',{name:'The tests',exact:true}).click();
    await page.getByRole('button',{name:'Close guide'}).click();
    await page.locator('.room-chip').click();
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
