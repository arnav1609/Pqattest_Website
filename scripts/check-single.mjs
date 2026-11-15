// Opens dist-single/pq-attest-explorer.html straight from disk (file://) in headless Chromium and checks that it starts,
// selects a block, and makes no network request. Run after `npm run build:single`.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const file = new URL('../dist-single/pq-attest-explorer.html', import.meta.url);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [], net = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) net.push(r.url()); });
await page.goto(file.href);
await page.waitForFunction(() => window.__pq && window.__pq.ready === true, null, { timeout: 60000 });
const r = await page.evaluate(() => { const p = window.__pq; p.select('ver'); p.setScenario(1, false);
  return { webgl: !!(p.api && p.api.ok), title: document.querySelector('#insp .selname').textContent, font: getComputedStyle(document.body).fontFamily.split(',')[0], events: document.querySelectorAll('#events button').length }; });
await page.screenshot({ path: fileURLToPath(new URL('../qa/screens/single-file.png', import.meta.url)) });
await browser.close();
console.log(JSON.stringify({ ...r, errors, net }));
if (errors.length || net.length || r.title !== 'RoT verifier' || r.events !== 3) { console.error('check-single FAIL'); process.exit(1); }
console.log('check-single PASS');
