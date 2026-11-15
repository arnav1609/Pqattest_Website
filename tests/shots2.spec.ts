import { test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Presentation screenshots: landing with the demo caption, a tile card, the results summary.
const out = fileURLToPath(new URL('../qa/screens/', import.meta.url));
const ready = () => (window as unknown as { __pq?: { ready: boolean } }).__pq?.ready === true;

test('presentation screenshots', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/#explore'); await page.waitForFunction(ready); await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}landing.png` });
  await page.locator('#bdemo').click();
  await page.evaluate(`const p = window.__pq; p.st.playing = false; p.st.tour = true; p.st.sc = 2; p.seek(0, false);`); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}landing-demo.png` });
  await page.evaluate(`window.__pq.st.tour = false`);
  await page.locator('.tilebar [data-tile="3"]').click(); await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}tile3-card.png`, fullPage: true });
  await page.goto('/#results'); await page.waitForTimeout(400); await page.screenshot({ path: `${out}results.png` });
});
