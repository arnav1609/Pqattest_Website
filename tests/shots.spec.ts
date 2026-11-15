import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Camera-pose screenshot grid for human review (qa/screens). Not a pixel-diff test: baselines need a real-GPU reference first.
const out = fileURLToPath(new URL('../qa/screens/', import.meta.url));
mkdirSync(out, { recursive: true });
const ready = () => (window as unknown as { __pq?: { ready: boolean } }).__pq?.ready === true;

test('camera-pose screenshot grid', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/#explore'); await page.waitForFunction(ready);
  for (const v of ['home', 'top', 'front', 'back', 'left', 'right', 'underside', 'bottom', 'c1', 'c2', 'c3', 'c4', 'noc', 'tile3']) {
    await page.evaluate(`window.__pq.api && window.__pq.api.setView('${v}', true)`); await page.waitForTimeout(500);
    await page.locator('#stage').screenshot({ path: `${out}pose-${v}.png` });
  }
  await page.evaluate(`window.__pq.api && window.__pq.api.setView('home', true); window.__pq.setScenario(2, false); window.__pq.st.t = 1; window.__pq.select('endp')`);
  await page.waitForTimeout(600); await page.screenshot({ path: `${out}page-explore.png`, fullPage: true });
  for (const [n, p] of [[5, 0.5], [7, 0.8], [3, 0.6]]) {
    await page.goto('/#how'); await page.waitForTimeout(300);
    await page.evaluate(`const h = document.getElementById('howfig').__how; h.st.playing = false; h.st.i = ${n}; h.st.p = ${p}; h.render();`);
    await page.locator('#howfig').screenshot({ path: `${out}how-step${n + 1}.png` });
  }
  for (const p of ['how', 'architecture', 'results', 'scope']) { await page.goto('/#' + p); await page.waitForTimeout(300); await page.screenshot({ path: `${out}page-${p}.png`, fullPage: true }); }
  await page.setViewportSize({ width: 390, height: 800 }); await page.goto('/#explore'); await page.waitForFunction(ready); await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}phone-explore.png`, fullPage: true });
});
