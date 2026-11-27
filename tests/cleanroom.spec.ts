import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test('cleanroom, guide and chip navigation at ' + width, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await page.goto('/');
    await expect(page.locator('#cleanroom')).toBeVisible();
    await page.getByRole('button',{name:'Meet the engineer'}).click();
    await expect(page.getByRole('dialog')).toContainText('Who gets to use shared memory?');
    await page.getByRole('button',{name:'The tests',exact:true}).click();
    await page.getByRole('link',{name:'See measured results'}).click();
    await expect(page).toHaveURL(/#results$/);
    await page.getByRole('link',{name:'Cleanroom',exact:true}).click();
    await page.locator('.room-chip').click();
    await expect(page.locator('#view')).toHaveValue('top');
    await expect(page.locator('#explore')).toBeVisible();
    await page.getByRole('link',{name:'Glossary',exact:true}).first().click();
    await expect(page.locator('#gsearch')).toBeVisible();
  });
}
