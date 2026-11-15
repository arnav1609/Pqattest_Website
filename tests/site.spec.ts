import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const scen = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'scenarios.json'), 'utf8'));

async function open(page: Page, hash = '#explore') {
  const errors: string[] = []; const external: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && u.protocol !== 'data:' && u.protocol !== 'blob:') external.push(r.url()); });
  await page.goto('/' + hash);
  await page.waitForFunction(() => (window as unknown as { __pq?: { ready: boolean } }).__pq?.ready === true);
  return { errors, external };
}
const run = <T>(page: Page, body: string) => page.evaluate(`(() => { const p = window.__pq; ${body} })()`) as Promise<T>;

test('loads with no console errors and no external requests', async ({ page }) => {
  const { errors, external } = await open(page);
  await expect(page.locator('.heroscope')).toContainText('Hardware attestation with SHA3-256 and KMAC128');
  await expect(page.locator('.mode')).toContainText('Explanatory walkthrough');
  await page.waitForTimeout(800);
  expect(errors, errors.join('\n')).toEqual([]);
  expect(external, external.join('\n')).toEqual([]);
});

test('every section route renders and deep links survive a reload', async ({ page }) => {
  await open(page);
  for (const [hash, text] of [['#how', 'Limits of this prototype'], ['#architecture', 'Six tiles on a 3'], ['#results', 'Checks on the current build'], ['#scope', 'Planned, built, shown, pending']] as const) {
    await page.goto('/' + hash); await expect(page.locator('#page')).toContainText(text); await expect(page.locator('#explore')).toBeHidden();
  }
  await page.goto('/#explore/access/endp'); await page.reload();
  await page.waitForFunction(() => (window as unknown as { __pq?: { ready: boolean } }).__pq?.ready === true);
  await expect(page.locator('#insp .selname')).toHaveText('PQ-Attest endpoint');
  expect(await run<number>(page, 'return p.st.sc')).toBe(scen.scenarios.findIndex((s: { id: string }) => s.id === 'access'));
});

test('block list is keyboard operable and drives the inspector', async ({ page }) => {
  await open(page);
  await page.locator('#q').fill('verifier');
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  await expect(page.locator('#insp .selname')).toHaveText('RoT verifier');
  await expect(page.locator('#insp')).toContainText('5,807');
  await expect(page.locator('#insp .badges')).toContainText('Current build');
  expect(await run<string>(page, 'return p.st.sel')).toBe('ver');
  await expect(page).toHaveURL(/#explore\/boot\/ver$/);
});

test('scenario state is derived from events, so seeking backwards is consistent', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#scn button', { hasText: 'Attest tile 3' }).click();
  await page.locator('#bplay').click();               // pause wherever it is
  await run(page, 'p.seek(2, false); p.st.t = 1;');
  await page.locator('#events button').nth(2).click(); await run(page, 'p.st.playing = false; p.st.t = 1;');
  expect((await run<{ auth: boolean }>(page, 'return p.derived()')).auth).toBe(true);     // after GRANT
  await run(page, 'p.seek(0, false)');
  expect((await run<{ auth: boolean }>(page, 'return p.derived()')).auth).toBe(false);    // rewound before GRANT
  await page.locator('#scn button', { hasText: 'Authorized memory access' }).click(); await run(page, 'p.seek(3, false); p.st.t = 1;');
  const d = await run<{ uart: string; led: string }>(page, 'return p.derived()');
  expect(d.uart).toBe('T3 PASS'); expect(d.led).toBe('0001');
  await page.locator('#scn button', { hasText: 'Refused tile' }).click();
  await expect(page.locator('#narr')).toContainText('no packet enters the mesh');
  await page.locator('#scn button', { hasText: 'Forged packet' }).click();
  await expect(page.locator('#where')).toContainText('Simulation only');
});

test('3D: clicking a block at fixed camera poses selects that block', async ({ page }) => {
  await open(page);
  const ok = await run<boolean>(page, 'return !!(p.api && p.api.ok)');
  test.skip(!ok, 'WebGL not available in this browser');
  const cases: [string, string[]][] = [['top', ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'endp', 'l2', 'ver', 'bram', 'cpuB.core', 'cpuA.bridge', 'spoof', 'quar', 'mmcm', 'plain']], ['home', ['ver', 'endp', 'r4', 'bram']], ['noc', ['r1', 'r4']], ['tile3', ['endp', 'cpuA.meas']], ['underside', ['pkg']]];
  for (const [view, ids] of cases) {
    await run(page, `p.api.setView('${view}', true)`); await page.waitForTimeout(150);
    for (const id of ids) {
      const hit = await run<string | null>(page, `const s = p.api.screenOf('${id}'); return s ? p.api.pickAt(s.x, s.y) : null`);
      expect(hit, `${view}: ray at ${id}`).toBe(id);
    }
  }
  await run(page, `p.api.setView('top', true)`); await page.waitForTimeout(150);
  const s = await run<{ x: number; y: number }>(page, `return p.api.screenOf('ver')`);
  const box = (await page.locator('#stage canvas').boundingBox())!;
  await page.mouse.click(box.x + s.x, box.y + s.y);
  await expect(page.locator('#insp .selname')).toHaveText('RoT verifier');
  const info = await run<{ calls: number; triangles: number }>(page, 'return p.api.info()');
  expect(info.calls).toBeLessThanOrEqual(250); expect(info.triangles).toBeLessThanOrEqual(250000);
});

test('camera step buttons and view toggles work without dragging', async ({ page }) => {
  await open(page);
  for (const name of ['Rotate left', 'Tilt down', 'Zoom in']) await page.getByRole('button', { name }).click();
  await page.locator('#view').selectOption('underside');
  await page.locator('#blogical').click(); await expect(page.locator('#repr')).toContainText('Logical view');
  await page.locator('#view').selectOption('home');
});

test('phone width: no horizontal scroll and the main controls are reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.locator('#bplay')).toBeVisible();
  for (const b of await page.locator('.cambar button, .timeline button, nav a').all()) { const r = await b.boundingBox(); if (r) expect(r.height).toBeGreaterThanOrEqual(24); }
});

test('public-safe build: no local paths, hashes or secrets in dist', async () => {
  const dist = join(__dirname, '..', 'dist'); const files: string[] = [];
  const walk = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(js|css|html|json)$/.test(e.name)) files.push(p); } };
  walk(dist);
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const bad of ['vivado_verilog_proj', 'Users\\\\kalas', 'Users/kalas', '2b2518be62ca', 'd738b12b9947', '0f0e0d0c0b0a0908', '289767c5289573d1', 'evidence.dev', 'cdnjs', 'googleapis', 'unpkg', 'jsdelivr']) expect(all.includes(bad), `dist contains ${bad}`).toBe(false);
});
