// Single-file version of dist/ for hosts that take one HTML page (the claude.ai artifact link): CSS, fonts (woff2 as data URIs)
// and the JS bundle are inlined; no <html>/<head>/<body> wrapper, as that host adds its own. Output: dist-single/pq-attest-explorer.html
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
const dist = new URL('../dist/', import.meta.url), assets = new URL('assets/', dist);
const files = readdirSync(assets);
let js = readFileSync(new URL(files.find((f) => /^index-.*\.js$/.test(f)), assets), 'utf8');
for (const name of files.filter(name => name.endsWith('.webp'))) {
  const bytes = readFileSync(new URL(name, assets));
  js = js.replaceAll(JSON.stringify(name), JSON.stringify("data:image/webp;base64," + bytes.toString("base64")));
}
let css = readFileSync(new URL(files.find((f) => /^index-.*\.css$/.test(f)), assets), 'utf8');
css = css.replace(/,\s*url\([^)]*\.woff\)\s*format\(["']woff["']\)/g, '')                                   // keep woff2 only
  .replace(/url\(\.?\/?(?:assets\/)?([^)"']+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${readFileSync(new URL(f.split('/').pop(), assets)).toString('base64')})`);
if (/url\((?!data:)/.test(css)) throw new Error('a CSS url() was not inlined');
if (js.includes('import(') && /import\(["']\.\//.test(js)) throw new Error('the bundle has a dynamic chunk; build with PUBLIC_SAFE on');
const html = readFileSync(new URL('index.html', dist), 'utf8');
const body = html.slice(html.indexOf('<body'), html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '').trim();
const page = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>PQ-Attest SoC Explorer</title>
<style>${css}</style>
${body}
<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>
`;
mkdirSync(new URL('../dist-single/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist-single/pq-attest-explorer.html', import.meta.url), page);
console.log('single file:', (page.length / 1024).toFixed(0), 'kB');
