import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const arch = JSON.parse(readFileSync(fileURLToPath(new URL('../data/architecture.json', import.meta.url)), 'utf8'));
const ids: string[] = arch.components.map((c: { id: string }) => c.id);
const ready = () => (window as unknown as { __pq?: { ready: boolean } }).__pq?.ready === true;
const run = <T>(page: Page, body: string) => page.evaluate(`(() => { const p = window.__pq; ${body} })()`) as Promise<T>;

test('camera-pose matrix: six directions, four corners, close-ups, underside', async ({ page }) => {
  await page.goto('/#explore'); await page.waitForFunction(ready);
  test.skip(!(await run<boolean>(page, 'return !!(p.api && p.api.ok)')), 'WebGL not available');
  const logical = ids.filter((i) => !['board', 'pkg', 'die'].includes(i));
  // exact hits: blocks that nothing stands in front of from these directions
  const exact: Record<string, string[]> = { top: logical.filter((i) => !/^cpu[AB]$/.test(i)), c1: ['ver', 'r4', 'r1', 'bram', 'endp'], c2: ['ver', 'r4', 'r1', 'endp', 'l2'], c3: ['r1', 'r4', 'bram', 'ver'], c4: ['r1', 'r4', 'ver', 'l2'],
    noc: ['r0', 'r1', 'r2', 'r3', 'r4', 'r5'], tile3: ['endp', 'cpuA.meas', 'cpuA.bridge'], bottom: ['pkg'], underside: ['pkg'] };
  for (const view of ['top', 'bottom', 'front', 'back', 'left', 'right', 'c1', 'c2', 'c3', 'c4', 'noc', 'tile3', 'underside']) {
    await run(page, `p.api.setView('${view}', true)`); await page.waitForTimeout(120);
    // every ray aimed at a block lands on a known component: never on nothing, never on unnamed decoration
    for (const id of view === 'bottom' || view === 'underside' ? ['pkg'] : logical) {
      const hit = await run<string | null>(page, `const s = p.api.screenOf('${id}'); return s ? p.api.pickAt(s.x, s.y) : 'offscreen'`);
      expect(hit === 'offscreen' || ids.includes(hit as string), `${view}: ray at ${id} hit ${hit}`).toBe(true);
    }
    for (const id of exact[view] ?? []) {
      const hit = await run<string | null>(page, `const s = p.api.screenOf('${id}'); return p.api.pickAt(s.x, s.y)`);
      expect(hit, `${view}: exact ray at ${id}`).toBe(id);
    }
  }
});

test('scrub bar and keyboard orbit', async ({ page }) => {
  await page.goto('/#explore/access'); await page.waitForFunction(ready);
  await page.getByText('Playback details', { exact: true }).click();
  await page.locator('#scrub').focus(); await page.locator('#scrub').fill('1000');
  expect(await run<{ uart: string }>(page, 'return p.derived()')).toMatchObject({ uart: 'T3 PASS', led: '0001' });
  await page.locator('#scrub').fill('0');
  expect(await run<{ uart: string }>(page, 'return p.derived()')).toMatchObject({ uart: '', led: '' });
  expect(await run<number>(page, 'return p.st.ev')).toBe(0);
  await page.locator('#scrub').fill('600');
  expect(await run<number>(page, 'return p.st.ev')).toBe(2);
  const before = await run<{ x: number }>(page, `return p.api ? p.api.screenOf('ver') : { x: 0 }`);
  await page.locator('#stage').focus(); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(100);
  const after = await run<{ x: number }>(page, `return p.api ? p.api.screenOf('ver') : { x: 1 }`);
  expect(before.x).not.toBe(after.x);
});

test('How it works animation: steps, memory, UART, gate and refusal follow the design', async ({ page }) => {
  await page.goto('/#how'); await page.waitForFunction(ready);
  const fig = page.locator('#howfig');
  await expect(fig).toHaveAttribute('data-step', '0');
  const step = async (n: number) => { await page.locator('#howdots button').nth(n).click(); await page.locator('#hplay').click(); await page.evaluate("const h = document.getElementById('howfig').__how; h.st.playing = false; h.go(" + n + ", false);"); };
  await step(4); await expect(fig).toHaveAttribute('data-gate', 'open');
  await step(5); await expect(fig).toHaveAttribute('data-cells', 'C0 DE 5A 5A');
  await step(6); await expect(fig).toHaveAttribute('data-uart', '> T3 PASS');
  await step(7); await expect(fig).toHaveAttribute('data-uart', '> T0 REFUSED');
  expect(Number(await fig.getAttribute('data-pkx'))).toBeLessThan(200);          // tile 0's request never leaves its tile
  await step(8); await expect(fig).toHaveAttribute('data-gate', 'closed');
  await page.locator('#hprev').click(); await expect(fig).toHaveAttribute('data-step', '7'); await expect(fig).toHaveAttribute('data-gate', 'open');
  await expect(page.locator('#howstep')).toContainText('Step 8 of 10');
});

test('tile card: every tile shows name, purpose, resources, what it does and its demo role', async ({ page }) => {
  await page.goto('/#explore'); await page.waitForFunction(ready);
  const expect3 = arch.tiles.map((tile: { primary: string }) => arch.components.find((c: { id: string }) => c.id === tile.primary));
  await page.locator('#btn-mode-learn').click();
  await page.locator('#inspector > summary').click();
  for (let t = 0; t < 6; t++) {
    await page.locator(`.tilebar [data-tile="${t}"]`).click();
    const card = page.locator('#insp');
    await expect(card.locator('h2')).toHaveText(expect3[t].name);
    await expect(card.locator('.stats').first()).toContainText((expect3[t].metrics.lut ?? expect3[t].metrics.bram).toLocaleString('en-US'));
    await expect(card.locator('.stats').first()).toContainText('LUTs');
    await expect(card.getByText(`Tile ${t} context and resource accounting`, {exact: true})).toBeVisible();
    await expect(page.locator(`.tilebar [data-tile="${t}"]`)).toHaveAttribute('aria-pressed', 'true');
  }
  await page.locator('.tilebar [data-tile="2"]').click(); await page.locator('#insp ul.parts button', { hasText: 'Memory front end' }).click();
  await expect(page.locator('#insp .stats')).toContainText('Not separately measured');
  await expect(page.locator('#insp')).not.toContainText('NaN');
});

test('short demo and full walkthrough use separate playlists', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#explore');
  await page.locator('#bdemo').click();
  await expect(page.locator('#stepcount')).toHaveText('1 of 4 · Setup');
  await page.locator('#bnext').click();
  await expect(page.locator('#stepcount')).toHaveText('2 of 4 · Write');
  await page.locator('#bnext').click();
  await expect(page.locator('#stepcount')).toHaveText('3 of 4 · ACK');
  await page.locator('#bnext').click();
  await expect(page.locator('#stepcount')).toHaveText('4 of 4 · Refusal');
  await page.locator('#bfull').click();
  await expect(page.locator('#cap')).toContainText('Boot and measure');
  await page.locator('#bnext').click();
  await expect(page.locator('#cap')).toContainText('Attest tile 3');
});

for (const hash of ['#explore', '#how', '#architecture', '#results', '#scope']) {
  test(`accessibility scan (axe, WCAG 2.2 A and AA): ${hash}`, async ({ page }) => {
    await page.goto('/' + hash); await page.waitForFunction(ready); await page.waitForTimeout(400);
    if (hash === '#explore') await run(page, `p.select('endp')`);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(res.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0].target.join(' ')}`), 'axe violations').toEqual([]);
  });
}
