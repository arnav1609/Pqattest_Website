import { chromium } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join, resolve, sep } from 'node:path';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const offline = new URL('../dist-single/pq-attest-explorer.html', import.meta.url).href;
const screenshots = process.env.PQ_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(resolve(dist) + sep)) return res.writeHead(403).end();
    const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff'}[extname(file)];
    res.writeHead(200, {'Content-Type':type || 'application/octet-stream'}).end(await readFile(file));
  } catch {res.end();}
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const hosted = 'http://127.0.0.1:' + server.address().port + '/';
let browser;
try {
  browser = await chromium.launch({channel:process.env.PQ_CHROME_CHANNEL || undefined, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for (const [format, url] of [['hosted', hosted], ['offline',offline]]) {
    for (const gpu of [true,false]) {
      const phone = !gpu;
      const context = await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,reducedMotion:'reduce',offline:format==='offline'});
      if (!gpu) await context.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type,...rest) {return type.includes('webgl')?null:get.call(this,type,...rest);};
      });
      const page = await context.newPage();const errors=[];
      page.setDefaultTimeout(30000);
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(/^https?:/.test(r.url()) && (format==='offline' || !r.url().startsWith(hosted))) errors.push(r.url());});
      await page.goto(url);
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.ok(await page.locator('meta[name="description"]').getAttribute('content'));
      await page.locator('.room-person').focus();await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');await dialog.waitFor();
      assert.equal(await dialog.locator('.research-questions li').count(),3);
      assert.equal(await page.locator('.engineer-hand').count(),0);
      await dialog.getByRole('button',{name:'Close guide'}).click();
      await page.locator('.room-chip').click();
      await page.waitForFunction(()=>!document.querySelector('#cleanroom') && window.__pq?.ready);
      assert.equal(await page.evaluate(()=>!!window.__pq.api?.ok),gpu);
      await page.locator('#bdemo').click();await page.locator('[data-step="1"]').click();
      assert.match(await page.locator('#cap').innerText(),/Memory stores/);
      if (screenshots) await page.locator('#stage').screenshot({path:join(screenshots,format+(gpu?'-3d':'-2d')+'.png')});
      await page.locator('[data-step="2"]').click();
      assert.match(await page.locator('#cap').innerText(),/Acknowledgment received/);
      if (!gpu) {
        const nodes=await page.locator('.fallback-route [data-sel]').evaluateAll(bs=>bs.map(b=>b.dataset.sel));
        assert.deepEqual(nodes.filter(id=>/^r\d$/.test(id)),['r2','r1','r0','r3']);
      }
      await page.locator('[data-step="3"]').click();assert.match(await page.locator('#cap').innerText(),/No packet entered/);
      if (gpu) {
        await page.locator('#stage').scrollIntoViewIfNeeded();
        const coords=await page.evaluate(()=>{const p=window.__pq.api.screenOf('ver');const r=document.querySelector('#stage canvas').getBoundingClientRect();return {x:r.x+p.x,y:r.y+p.y};});
        await page.mouse.click(coords.x,coords.y);
      } else { await page.locator('.mesh-map [data-tile="4"]').tap(); }
      await page.waitForFunction(()=>document.activeElement?.id==='insp');
      assert.equal(await page.locator('#insp h2').innerText(),'RoT verifier');
      assert.match(await page.locator('#insp .stats').first().innerText(),/5,802/);
      assert.ok(await page.locator('#insp .stats').first().evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
      if (screenshots) await page.screenshot({path:join(screenshots,format+(gpu?'-desktop-specs':'-phone-specs')+'.png')});
      await page.locator('#bfull').click();
      for(let i=0;i<12;i++){await page.locator('#stepchoices button').nth(i).click();assert.ok(await page.locator('#context-body').innerText());}
      await page.goto(url+'#explore/access/ver?step=acc-4&tour=full');
      await page.waitForFunction(()=>window.__pq.st.ev===3&&window.__pq.st.sc===2);
      assert.equal(await page.evaluate(()=>window.__pq.st.playing),false);
      if (gpu) {
        await page.locator('#mesh-switch').click();await page.locator('.mesh-map').waitFor();
        await page.locator('#mesh-switch').click();
        await page.evaluate(()=>document.querySelector('#stage canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
        await page.locator('.mesh-map').waitFor();
        assert.equal(await page.evaluate(()=>window.__pq.st.ev),3);
      }
      await page.locator('.mesh-parts').selectOption('cpuA.bridge');
      assert.equal(await page.evaluate(()=>window.__pq.st.sel),'cpuA.bridge');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.deepEqual(errors,[]);
      console.log('PASS',format,gpu?'3D, automatic inspector and context loss':'2D, touch, keyboard and ordered route');
      await context.close();
    }
  }
} finally {await browser?.close();server.close();}

