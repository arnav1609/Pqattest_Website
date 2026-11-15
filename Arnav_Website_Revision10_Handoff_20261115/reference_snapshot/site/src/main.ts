import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './styles.css';
import { build, byId, components, evidence, fmt, LABEL, playbackMode, results, scenarios, tiles, vcInfo, type Component, type Ev, type VcId } from './model';
import { createScene, type SceneApi } from './scene';
import { mountHowAnimation } from './howAnim';

declare const __PUBLIC_SAFE__: boolean;
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const main = $('#main');
const NM = '<span class="nm">Not separately measured</span>';

// ---------------------------------------------------------------- shell: see the system, watch it work, explore each tile
main.innerHTML = `
<section id="explore" class="explore" aria-label="Explore chip">
  <header class="hero">
    <div class="herotext">
      <h1>A network-on-chip that checks a processor before trusting it</h1>
      <p class="lead">Six tiles on an FPGA. A root of trust challenges a RISC-V processor, checks a fingerprint of its firmware, and only then lets it use the shared memory. A processor that was never trusted is stopped inside its own tile.</p>
      <p class="heroscope">FPGA prototype, Artix-7 at 50 MHz. Attestation uses SHA3-256 and KMAC128; the post-quantum schemes ML-KEM and ML-DSA are not implemented. <a href="#scope">What is built</a></p>
    </div>
    <div class="heroact">
      <button type="button" id="bdemo" class="primary big">Watch the demo</button>
      <a class="ghostlink" href="#how">Step-by-step diagram</a>
    </div>
  </header>
  <div class="tilebar" role="group" aria-label="Choose a tile">
    <span class="tbl">Tiles</span>
    ${tiles.map((t) => `<button type="button" data-tile="${t.id}" aria-pressed="false"><b>${t.id}</b>${esc(t.name)}</button>`).join('')}
  </div>
  <div class="grid">
    <div class="stagewrap">
      <div class="stage" id="stage" tabindex="0" role="application" aria-label="3D view of the chip. Arrow keys rotate, plus and minus zoom, Home resets. Every block is also listed beside it.">
        <div class="labels" id="labels" aria-hidden="true"></div>
        <div class="tip" id="tip" hidden></div>
        <div class="cap" id="cap" aria-live="polite"></div>
        <div class="cambar" role="group" aria-label="Camera">
          <select id="view" aria-label="Camera view">
            <option value="home">Home view</option><option value="top">Top</option><option value="front">Front</option><option value="back">Back</option>
            <option value="left">Left</option><option value="right">Right</option><option value="underside">Underside</option><option value="noc">Network</option><option value="tile3">Tile 3 close-up</option>
          </select>
          <button type="button" data-cam="left" aria-label="Rotate left">&larr;</button><button type="button" data-cam="right" aria-label="Rotate right">&rarr;</button>
          <button type="button" data-cam="up" aria-label="Tilt up">&uarr;</button><button type="button" data-cam="down" aria-label="Tilt down">&darr;</button>
          <button type="button" data-cam="in" aria-label="Zoom in">+</button><button type="button" data-cam="out" aria-label="Zoom out">&minus;</button>
          <button type="button" id="blogical" aria-pressed="false">Logical</button><button type="button" id="blabels" aria-pressed="true">Labels</button>
        </div>
        <div class="fallback" id="fallback" hidden></div>
      </div>
      <p class="repr" id="repr">Conceptual drawing: block sizes follow measured LUT counts; positions are illustrative, not a place-and-route floorplan.</p>
      <section class="timeline" aria-label="Replay">
        <div class="trow">
          <div class="scn" id="scn" role="group" aria-label="Scenario"></div>
        </div>
        <div class="trow">
          <button type="button" id="bprev" aria-label="Previous step">Previous</button>
          <button type="button" id="bplay" class="primary">Play</button>
          <button type="button" id="bnext" aria-label="Next step">Next</button>
          <button type="button" id="brestart">Restart</button>
          <label for="speed">Speed</label>
          <select id="speed"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="2">2x</option></select>
          <span class="read"><b>Tile 3</b><span id="rauth"></span></span>
          <span class="read"><b>UART</b><span id="ruart"></span></span>
          <span class="read"><b>LED</b><span id="rled"></span></span>
        </div>
        <div class="trow"><label for="scrub">Position</label><input id="scrub" type="range" min="0" max="1000" value="0" step="1"></div>
        <p class="where" id="where"></p>
        <ol class="events" id="events"></ol>
        <details class="techd"><summary>Technical detail for this step</summary><div class="narr" id="narr"></div>
          <p class="mode">${esc(playbackMode)}</p></details>
      </section>
    </div>
    <aside class="side">
      <section class="insp" id="insp" aria-live="polite" aria-label="Selected tile"></section>
      <section class="clist" aria-label="All blocks">
        <label for="q">Find any block</label>
        <input id="q" type="search" placeholder="router, memory, verifier..." autocomplete="off">
        <ul id="list"></ul>
      </section>
    </aside>
  </div>
</section>
<article id="page" class="page" hidden></article>`;

// ---------------------------------------------------------------- 3D scene (optional: everything also works without it)
let api: SceneApi | null = null;
try { const a = createScene($('#stage'), $('#labels'), reduce); if (a.ok) api = a; } catch (e) { console.warn('3D view unavailable', e); }
let fallbackHow: { go(i: number, play: boolean): void } | null = null;
if (!api) {           // no WebGL: the stage shows the step-by-step diagram instead of an empty box
  $('#stage').classList.add('nogl'); const fb = $('#fallback'); fb.hidden = false;
  fb.innerHTML = '<p class="muted">The 3D view needs WebGL, which this browser does not provide. Here is the same story as a diagram; every block is still listed beside it.</p><div id="fbhow"></div>';
  mountHowAnimation($('#fbhow'), reduce, 'fb-'); fallbackHow = ($('#fbhow') as unknown as { __how: { go(i: number, play: boolean): void } }).__how; }

// ---------------------------------------------------------------- state
const st = { sel: null as string | null, sc: 0, ev: 0, t: reduce ? 1 : 0, playing: false, speed: 1, tour: false };
const scn = () => scenarios[st.sc];
/** Authorization, UART and LED are derived from the events up to the current one, so seeking is always consistent. */
function derived() { let auth = scn().authStart, uart = '', led = '';
  scn().events.forEach((e, i) => { if (i < st.ev || (i === st.ev && st.t >= 1)) { if (e.authAfter !== undefined) auth = e.authAfter; if (e.uart) uart = e.uart; if (e.led) led = e.led; } });
  return { auth, uart, led }; }

// ---------------------------------------------------------------- tile card: name, purpose, resources, what it does, its role in the demo
const badge = (k: string, v: string) => `<span class="badge" title="${esc(k)}">${esc(LABEL[v] ?? v)}</span>`;
const link = (id: string) => { const c = byId.get(id); return c ? `<button type="button" class="lnk" data-sel="${esc(id)}">${esc(c.name)}</button>` : esc(id); };
const hasRes = (c: Component) => ['lut', 'ff', 'bram', 'lutShare'].some((k) => (c.metrics as Record<string, unknown>)[k] !== undefined);
const val = (n: number | undefined) => (n === undefined ? NM : fmt(n));
function stats(c: Component) {
  if (!hasRes(c)) return `<p class="callout">${esc(c.metrics.note ?? 'No resource figures: this is not a logic block.')}</p>`;
  const m = c.metrics;
  return `<div class="stats"><div class="stat"><b>${val(m.lut)}</b><span>LUTs</span></div><div class="stat"><b>${val(m.ff)}</b><span>Flip-flops</span></div><div class="stat"><b>${val(m.bram)}</b><span>Block RAMs</span></div></div>
    ${m.note ? `<p class="muted small">${esc(m.note)}</p>` : ''}`; }
const compact = (c: Component) => !hasRes(c) ? `<small>${c.metrics.note ? (/^Not separately measured/.test(c.metrics.note) ? 'Not separately measured' : esc(c.metrics.note)) : 'Not separately measured'}</small>`
  : `<small>${c.metrics.lut !== undefined ? fmt(c.metrics.lut) + ' LUT' : 'LUT not separately measured'}${c.metrics.ff !== undefined ? ' · ' + fmt(c.metrics.ff) + ' FF' : ''}${c.metrics.bram !== undefined ? ' · ' + c.metrics.bram + ' BRAM' : ''}</small>`;
const tileComps = (t: number) => components.filter((c) => c.tileId === t);
function demoRole(t: number) { const ids = new Set(tileComps(t).map((c) => c.id)), s = scn(), rows: string[] = [];
  s.events.forEach((e, i) => { const acting = ids.has(e.actor), touched = e.path.concat(e.focus).some((id) => ids.has(id)); if (!acting && !touched) return;
    const onlyRouter = !acting && e.path.filter((id) => ids.has(id)).every((id) => /^(r|ni)\d$/.test(id)) && !e.focus.some((id) => ids.has(id));
    rows.push(`<li${i === st.ev ? ' class="now"' : ''}><button type="button" class="lnk" data-ev="${i}">${esc(e.label)}</button> ${onlyRouter ? 'Its router passes the packet on.' : esc(e.plain)}</li>`); });
  if (rows.length) return `<p class="muted small">In “${esc(s.name)}”:</p><ol class="role">${rows.join('')}</ol>`;
  const other = scenarios.filter((x) => x.events.some((e) => e.path.concat(e.focus).some((id) => ids.has(id))));
  return `<p>Not involved in “${esc(s.name)}”.${other.length ? ' See ' + other.map((x) => `<button type="button" class="lnk" data-sc="${esc(x.id)}">${esc(x.name)}</button>`).join(' ') : ''}</p>`; }
function techDetail(c: Component) {
  return `<details class="techd"><summary>Technical detail: ${esc(c.name)}</summary>
    <p class="badges">${badge('How far it got', c.maturity)}${badge('Which build', c.currency)}${badge('How it was checked', c.confidence)}${badge('How it is drawn', c.representation)}</p>
    ${c.detail ? `<ul class="plain facts">${c.detail.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
    <dl class="kv wide"><dt>RTL instance</dt><dd class="mono">${esc(c.modulePath)}</dd><dt>Clock</dt><dd>${esc(c.clockDomain)}</dd><dt>Reset</dt><dd>${esc(c.resetDomain)}</dd>
    ${c.ports ? `<dt>Ports</dt><dd><ul class="plain ports">${c.ports.map((p) => `<li><span class="mono">${esc(p[0])}</span> ${esc(p[1])}</li>`).join('')}</ul></dd>` : ''}
    ${c.interfaces.length ? `<dt>Interfaces</dt><dd>${c.interfaces.map(esc).join('; ')}</dd>` : ''}
    ${c.adjacency.length ? `<dt>Connected to</dt><dd>${c.adjacency.map(link).join(' ')}</dd>` : ''}
    <dt>Drawing</dt><dd>${esc(c.geometryRule)}. ${esc(c.placementBasis)}.</dd></dl>
    <p class="muted small">Evidence</p><ul class="plain ev">${c.evidenceRefs.map((r) => { const e = evidence.get(r)!; return `<li><strong>${esc(e.title)}</strong> (${esc(LABEL[e.currency])}). ${esc(e.says)} <em>Limit: ${esc(e.limits)}</em></li>`; }).join('')}</ul>
  </details>`; }
function renderInspector() { const el = $('#insp'), c = st.sel ? byId.get(st.sel) : null;
  document.querySelectorAll<HTMLElement>('.tilebar [data-tile]').forEach((b) => b.setAttribute('aria-pressed', String(!!c && +b.dataset.tile! === c.tileId)));
  if (!c) { el.innerHTML = `<p class="eyebrow">Explore each tile</p><h2>Pick a tile</h2><p class="purpose">Click a tile above, a block in the 3D view, or any name in the list below. You will see what the tile is for, how much hardware it uses and what it does in the demo.</p>
    <div class="tilegrid">${tiles.map((t) => `<button type="button" data-tile="${t.id}"><b>Tile ${t.id}</b><span>${esc(t.name)}</span></button>`).join('')}</div>`; return; }
  if (c.tileId === null) { el.innerHTML = `<p class="eyebrow">${esc(c.coordinates)}</p><h2 class="selname">${esc(c.name)}</h2><p class="purpose">${esc(c.summary)}</p>${stats(c)}
      ${c.id === 'l2' ? `<p class="muted small">Shared by ${link('cpuA')} (tile 3) and ${link('ver')} (tile 4).</p>` : ''}${techDetail(c)}`; return; }
  const t = tiles[c.tileId], prim = byId.get(t.primary)!, parent = c.type === 'sub' && c.parentId ? byId.get(c.parentId)! : null;
  const parts = tileComps(t.id).filter((k) => k.type !== 'sub').concat(t.id === 3 || t.id === 4 ? [byId.get('l2')!] : []);
  el.innerHTML = `<p class="eyebrow">Tile ${t.id} · position x ${t.x}, y ${t.y}</p>
    <h2>Tile ${t.id} — ${esc(t.name)}</h2>
    <p class="purpose">${esc(t.purpose)}</p>
    ${stats(prim)}
    <p class="muted small">Main block: ${esc(prim.name)}. Post-route figures, ${esc(build.label)}.</p>
    <h3>What it does</h3><ul class="does">${t.does.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    <h3>In this demo</h3>${demoRole(t.id)}
    <div class="selbox"><p class="eyebrow">Selected part${parent ? ` · inside ${esc(parent.name)}` : ''}</p><p class="selname">${esc(c.name)}</p><p>${esc(c.summary)}</p>${c.id !== prim.id ? stats(c) : ''}</div>
    <h3>Parts in this tile</h3><ul class="parts">${parts.map((k) => `<li><button type="button" data-sel="${esc(k.id)}" aria-current="${k.id === c.id}"><span>${esc(k.name)}${k.id === 'l2' ? ' (shared with tile ' + (t.id === 3 ? 4 : 3) + ')' : ''}</span>${compact(k)}</button>
      ${k.type === 'cpu' ? `<ul class="subparts">${components.filter((s) => s.parentId === k.id).map((s) => `<li><button type="button" data-sel="${esc(s.id)}" aria-current="${s.id === c.id}"><span>${esc(s.name)}</span>${compact(s)}</button></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>
    ${techDetail(c)}`; }
function select(id: string | null, fromHash = false, fly = true) { st.sel = id && byId.has(id) ? id : null; api?.select(st.sel); api?.focusTile(st.sel ? byId.get(st.sel)!.tileId : null, fly); renderInspector();
  document.querySelectorAll('#list button').forEach((b) => b.setAttribute('aria-current', String((b as HTMLElement).dataset.sel === st.sel)));
  if (!fromHash) writeHash(); }

// ---------------------------------------------------------------- searchable, keyboard-operable block list (mirrors the 3D selection)
function renderList(q = '') { const f = q.trim().toLowerCase();
  const rows = components.filter((c) => !f || `${c.name} ${c.type} tile ${c.tileId ?? ''} ${c.summary}`.toLowerCase().includes(f));
  $('#list').innerHTML = rows.map((c) => `<li><button type="button" data-sel="${esc(c.id)}" aria-current="${c.id === st.sel}"><span>${esc(c.name)}</span><small>${c.tileId !== null ? 'tile ' + c.tileId : esc(c.type)}</small></button></li>`).join('') || '<li class="muted">No block matches.</li>'; }
$('#q').addEventListener('input', (e) => renderList((e.target as HTMLInputElement).value));
document.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-sel],[data-sc],[data-tile],[data-ev]'); if (!b) return;
  if (b.dataset.sel) { stopTour(); if (location.hash.split('/')[0] !== '#explore') location.hash = '#explore'; select(b.dataset.sel); }
  else if (b.dataset.tile !== undefined) { stopTour(); select(tiles[+b.dataset.tile].primary); }
  else if (b.dataset.sc) { const i = scenarios.findIndex((s) => s.id === b.dataset.sc); if (i >= 0) { stopTour(); location.hash = '#explore'; setScenario(i, true); } }
  else if (b.dataset.ev !== undefined) { stopTour(); seek(+b.dataset.ev, true); } });

// ---------------------------------------------------------------- playback, with a caption that says who acts, what happens and why it matters
function paint() { const s = scn(), e = s.events[st.ev], d = derived();
  $('#rauth').textContent = d.auth ? 'authorized' : 'not authorized'; $('#ruart').textContent = d.uart ? `"${d.uart}"` : 'no output yet'; $('#rled').textContent = d.led || 'no pattern yet';
  $('#where').textContent = `${s.summary} Shown: ${s.where}.`;
  $('#events').innerHTML = s.events.map((x, i) => `<li><button type="button" data-ev="${i}" aria-current="${i === st.ev ? 'step' : 'false'}"><span class="vc vc-${x.vc}" aria-hidden="true"></span>${esc(x.label)}${x.outcome === 'accepted' ? '' : `<small>${x.outcome}</small>`}</button></li>`).join('');
  $('#cap').innerHTML = `<p class="capmeta">${st.tour ? `Demo · part ${st.sc + 1} of ${scenarios.length}: ${esc(s.name)}` : esc(s.name)} · step ${st.ev + 1} of ${s.events.length}</p>
    <p class="capwho">${esc(e.who)}</p><p class="capwhat">${esc(e.plain)}</p><p class="capwhy"><b>Why it matters:</b> ${esc(e.matters)}</p>`;
  const route = e.path.map((p) => byId.get(p)!.type === 'router' ? p.toUpperCase() : byId.get(p)!.name).join(' → ');
  $('#narr').innerHTML = `<p><strong>${esc(e.label)}.</strong> ${esc(e.what)} ${esc(e.why)}</p>
    <p class="muted"><span class="mono">${esc(vcInfo[e.vc as VcId].name)}</span> carries ${esc(vcInfo[e.vc as VcId].carries)} (${esc(vcInfo[e.vc as VcId].shape)}). Route: ${esc(route)}.
    ${e.outcome === 'accepted' ? '' : `<strong>Outcome: ${e.outcome}.</strong> The stop sign marks where it ends.`}</p>`;
  document.querySelectorAll('#scn button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.sc)));
  $('#bplay').textContent = st.playing ? 'Pause' : 'Play'; $('#bdemo').textContent = st.tour ? 'Stop the demo' : 'Watch the demo';
  if (st.tour && st.sel !== e.actor) select(e.actor, false, false); else if (st.sel) renderInspector();
  api?.setFocus(e.focus); api?.showEvent(e, Math.min(st.t, 1)); api?.setLeds(d); syncScrub(); }
const scrub = $<HTMLInputElement>('#scrub');
function syncScrub() { const n = scn().events.length; scrub.value = String(Math.round(((st.ev + Math.min(st.t, 1)) / n) * 1000)); scrub.setAttribute('aria-valuetext', `step ${st.ev + 1} of ${n}: ${scn().events[st.ev].label}`); }
/** Scrubbing sets (event, progress) directly; everything shown is recomputed from that pair. */
scrub.addEventListener('input', () => { stopTour(); const n = scn().events.length, x = Math.min(0.9999, +scrub.value / 1000) * n; st.playing = false; st.ev = Math.floor(x); st.t = reduce ? 1 : x - st.ev; if (+scrub.value >= 1000) { st.ev = n - 1; st.t = 1; } paint(); });
function seek(i: number, play: boolean) { const n = scn().events.length; st.ev = Math.max(0, Math.min(n - 1, i)); st.t = reduce ? 1 : 0; st.playing = play && !reduce; paint(); if (st.playing) loop(); }
function setScenario(i: number, play: boolean) { st.sc = i; seek(0, play); writeHash(); }
function stopTour() { if (st.tour) { st.tour = false; $('#bdemo').textContent = 'Watch the demo'; } }
let raf = 0, lastT = 0, hold = 0;
function loop() { cancelAnimationFrame(raf); lastT = performance.now(); const step = (now: number) => { if (!st.playing) return; const dt = Math.min(now - lastT, 80); lastT = now;
    const e: Ev = scn().events[st.ev], dur = (st.tour ? 1500 : 900) + e.path.length * 420, was = st.t; st.t = Math.min(1.6, st.t + (dt * st.speed) / dur);
    if (was < 1 && st.t >= 1) paint(); else { api?.showEvent(e, Math.min(st.t, 1)); syncScrub(); }
    if (st.t >= 1.6) { hold += dt;
      if (hold > (st.tour ? 1800 : 0)) { hold = 0;
        if (st.ev < scn().events.length - 1) { st.ev++; st.t = 0; paint(); }
        else if (st.tour && st.sc < scenarios.length - 1) { st.sc++; st.ev = 0; st.t = 0; writeHash(); paint(); }
        else { st.playing = false; st.t = 1; stopTour(); paint(); return; } } }
    raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
$('#scn').innerHTML = scenarios.map((s, i) => `<button type="button" data-scn="${i}">${i + 1}. ${esc(s.name)}</button>`).join('');
$('#scn').addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-scn]'); if (b) { stopTour(); setScenario(+b.dataset.scn!, true); } });
$('#bplay').addEventListener('click', () => { if (reduce) { seek(st.ev + 1 < scn().events.length ? st.ev + 1 : 0, false); return; }
  if (!st.playing && st.t >= 1 && st.ev === scn().events.length - 1) { seek(0, true); return; } if (!st.playing && st.t >= 1) { seek(st.ev + 1, true); return; } st.playing = !st.playing; if (!st.playing) stopTour(); paint(); if (st.playing) loop(); });
$('#bnext').addEventListener('click', () => { stopTour(); seek(st.ev + 1, false); }); $('#bprev').addEventListener('click', () => { stopTour(); seek(st.ev - 1, false); }); $('#brestart').addEventListener('click', () => { stopTour(); seek(0, true); });
$('#speed').addEventListener('change', (e) => { st.speed = parseFloat((e.target as HTMLSelectElement).value) || 1; });
/** Watch the demo: all six scenarios in order, the caption and the tile card following whoever acts. */
$('#bdemo').addEventListener('click', () => {
  if (!api) { fallbackHow?.go(0, true); $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return; }
  if (st.tour) { stopTour(); st.playing = false; paint(); return; }
  st.tour = true; api.setView('home'); st.sc = 0; seek(0, true); writeHash(); $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });

// ---------------------------------------------------------------- camera and view controls
$('#view').addEventListener('change', (e) => api?.setView((e.target as HTMLSelectElement).value));
document.querySelector('.cambar')!.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) return;
  if (b.dataset.cam) api?.stepCamera(b.dataset.cam);
  if (b.id === 'blogical') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); api?.setLogical(on);
    $('#repr').textContent = on ? 'Logical view: blocks, links and routes follow the RTL; the layout is a diagram, not a physical floorplan.' : 'Conceptual drawing: block sizes follow measured LUT counts; positions are illustrative, not a place-and-route floorplan.'; }
  if (b.id === 'blabels') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); api?.setLabels(on); } });
api?.onPick((id) => { stopTour(); select(id); });
$('#stage').addEventListener('keydown', (e) => { const k: Record<string, string> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out' };
  if (k[e.key]) { api?.stepCamera(k[e.key]); e.preventDefault(); } else if (e.key === 'Home') { api?.setView('home'); e.preventDefault(); } });
api?.onHover((id, x, y) => { const t = $('#tip'); if (!id) { t.hidden = true; return; } const c = byId.get(id); t.textContent = c ? (c.tileId !== null ? `Tile ${c.tileId} · ${c.name}` : c.name) : id; t.hidden = false; t.style.transform = `translate(${x + 14}px,${Math.max(4, y - 30)}px)`; });

// ---------------------------------------------------------------- pages
const table = (head: string[], rows: string[][]) => `<div class="tw"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const refName = (r: string | null) => (r ? esc(evidence.get(r)?.title) : '');
const nn = (v: unknown) => (v === null || v === undefined ? '<span class="muted">not recorded</span>' : esc(typeof v === 'number' ? fmt(v) : v));
const cur = results.builds[0];
const PAGES: Record<string, () => string> = {
  how: () => `<p class="eyebrow">How it works</p><h1>A chip that checks a tile before it trusts it</h1>
    <p class="lead">Press Play, or click the picture, to follow the design step by step: who acts, what happens and why it matters.</p>
    <figure class="howfig" id="howfig" aria-label="Animation: what happens inside the chip"></figure>
    <div class="cols"><div>
    <h2>The problem</h2><p>A system-on-chip is built from separate units (processors, memory, security hardware) that talk over an on-chip network. Usually every unit is trusted from power-on. If one is tampered with or replaced, it can use the network like any other.</p>
    <h2>The idea</h2><p>Make a unit prove itself before it may touch shared resources, and keep checking its permission on every access.</p>
    </div><div>
    <h2>What this prototype does</h2><p>A root of trust on tile 4 challenges tile 3. Tile 3 answers with a fingerprint of its firmware, sealed with a secret key. Only after a correct answer may tile 3 use the shared memory on tile 2, and the memory checks that permission on every access.</p>
    <p>A second processor on tile 0 is never trusted: its requests are stopped inside its own tile. Trust can also be taken away again with a revoke.</p>
    <p><a class="cta" href="#explore">Explore the tiles in 3D</a></p>
    </div></div>
    <details class="limits"><summary>Limits of this prototype</summary>
    <ul><li>The cryptography is symmetric (SHA3-256 and KMAC128). The post-quantum schemes ML-KEM and ML-DSA, and the NTT they need, are not implemented. The project name reflects the original proposal.</li>
    <li>One tile is attested, and re-attestation happens on request (button 1), not on a timer.</li>
    <li>The forged-packet test runs in simulation only; the untrusted port is tied off in the board image.</li>
    <li>The keys are fixed demonstration values. There is no random number generator and no protection against side-channel attacks.</li>
    <li>It is an FPGA design. No chip has been fabricated. Full list on the <a href="#scope">Scope</a> page.</li></ul></details>`,
  architecture: () => `<p class="eyebrow">Architecture and flow</p><h1>Six tiles on a 3 &times; 2 mesh</h1>
    <p class="lead">Tile number = 3 &times; y + x. This is the logical layout taken from the RTL; it is also the text alternative to the 3D view.</p>
    <div class="grid6" role="list">${tiles.map((t) => { const cs = components.filter((c) => c.tileId === t.id && !['router', 'ni', 'sub'].includes(c.type));
      return `<div class="tile" role="listitem"><p class="eyebrow">Tile ${t.id} · (x ${t.x}, y ${t.y})</p><h2 class="tname">${esc(t.name)}</h2><p>${esc(t.purpose)}</p><p>${cs.map((c) => link(c.id)).join(' ')} ${link('ni' + t.id)} ${link('r' + t.id)}</p></div>`; }).join('')}</div>
    <div class="cols"><div>
    <h2>Routing</h2><p>A packet first moves along the row (X) until it reaches the right column, then along the column (Y). Tile 3 to tile 2 therefore goes 3 → 4 → 5 → 2, and the reply 2 → 1 → 0 → 3.</p>
    <details class="techd"><summary>Technical detail: routers and channels</summary>
    <p>Each router has five ports: north, south, east, west and local. Packets are sent as trains of 32-bit flits (wormhole switching), and a router only sends a flit when the next buffer has room, which it tracks with credits.</p>
    ${table(['Channel', 'Carries', 'Shown as'], (Object.keys(vcInfo) as VcId[]).map((k) => [esc(vcInfo[k].name), esc(vcInfo[k].carries), `<span class="vc vc-${k}" aria-hidden="true"></span> ${esc(vcInfo[k].shape)}`]))}
    <p class="muted">Three virtual channels share each physical link; every channel has a 4-flit buffer per port.</p></details>
    </div><div>
    <h2>Who may do what</h2><ul><li>Every tile has an authorization gate at its network interface, and every incoming packet is checked by a parser.</li>
    <li>The shared memory checks the sender's permission at the moment of each read or write.</li>
    <li>A tile without permission never sends a memory request: its own bridge refuses it.</li>
    <li>Security messages between tiles 3 and 4 carry a tag, an epoch and a sequence number, so a replayed message is rejected.</li>
    <li>Anything from the untrusted port on tile 5 is held in a quarantine first.</li></ul>
    <h2>Clock and reset</h2><p>${esc(build.clock)}. One reset, held until the clock generator has locked. Buttons and the switch pass through two-flop synchronisers.</p>
    </div></div>`,
  results: () => `<p class="eyebrow">Results</p><h1>What was built and measured</h1>
    <p class="lead">${esc(build.device)} on the ${esc(build.board)}, ${esc(build.tool)}, ${esc(build.clock)}. Figures are from the ${esc(build.label)} after place and route.</p>
    <div class="kpis">
      <div class="kpi"><b>${fmt(cur.lut)}</b><span>LUTs</span><small>${esc(cur.lutPct)}</small></div>
      <div class="kpi"><b>${fmt(cur.ff!)}</b><span>Flip-flops</span><small>of 126,800</small></div>
      <div class="kpi"><b>${cur.bram}</b><span>Block RAMs</span><small>of 135</small></div>
      <div class="kpi"><b>50 MHz</b><span>Timing met</span><small>setup +0.120 ns · hold +0.009 ns</small></div>
    </div>
    <div class="cols"><div>
    <h2>What works</h2><ul class="works">${results.scope.filter((s) => s.status === 'Built and routed' || s.status === 'Shown in simulation').map((s) => `<li><b>${esc(s.item)}</b><small>${esc(s.status)}${s.note ? ' · ' + esc(s.note) : ''}</small></li>`).join('')}</ul>
    </div><div>
    <h2>Cost of the security logic</h2><p>Compared with the same network and memory without attestation (a research build, never a release image):</p>
    ${table(['Measure', 'Secure', 'Without'], results.comparison.rows.map((r) => [esc(r.metric), esc(r.secure), esc(r.baseline)]))}
    <h2>On the board</h2><p>An image from 7 November was reported as passing on the board by the project owner (observations not itemised). The current 12 November image has not yet been run on the board.</p>
    </div></div>
    <details class="evid"><summary>Full build and verification evidence</summary>
    <h2>Builds</h2>${table(['Build', 'Status', 'LUTs', 'Flip-flops', 'Block RAM', 'Setup slack (ns)', 'Hold slack (ns)', 'Board'],
      results.builds.map((b) => [esc(b.label), `${esc(LABEL[b.maturity])}; ${esc(LABEL[b.currency])}`, `${nn(b.lut)} <small>${esc(b.lutPct)}</small>`, nn(b.ff), nn(b.bram), nn(b.wns), nn(b.whs), esc(b.board)]))}
    <p class="muted">The hold margin of the current build (+0.009 ns) is thin but positive. Each build embeds its build time, so two builds of the same sources produce different image files.</p>
    <h2>Checks on the current build</h2>${table(['Check', 'Result', 'Source'], results.checks.map((c) => [esc(c.name), esc(c.value), refName(c.ref)]))}
    <h2>Comparison sources</h2><p>${esc(results.comparison.note)}</p>${table(['Measure', 'Source'], results.comparison.rows.map((r) => [esc(r.metric), refName(r.ref)]))}
    <h2>Evidence used on this site</h2>${table(['Evidence', 'Kind', 'Date', 'Build', 'What it shows', 'Limits'], [...evidence.values()].map((e) => [esc(e.title), esc(e.kind), esc(e.date), esc(LABEL[e.currency]), esc(e.says), esc(e.limits)]))}
    <div id="dev"></div></details>`,
  scope: () => `<p class="eyebrow">Project scope</p><h1>Planned, built, shown, pending</h1>
    <p class="lead">The original proposal against what exists today. Items marked "not built" were proposed and are not part of this prototype.</p>
    ${table(['Item', 'Status', 'Note'], results.scope.map((s) => [esc(s.item), `<span class="st st-${s.status.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(s.status)}</span>`, esc(s.note)]))}
    <h2>What comes next</h2><ol><li>Run the current image on the board and record each observation against the image it was made from.</li>
    <li>Finish the independent RTL sign-off review that is in progress.</li><li>Decide the scope of an ASIC flow (RTL to GDSII). That work has not started.</li></ol>`
};
async function devBlock() { if (__PUBLIC_SAFE__) return; const el = document.getElementById('dev'); if (!el) return; const dev = (await import('../data/evidence.dev.json')).default;
  el.innerHTML = `<h2>Development metadata (not in public builds)</h2><pre class="mono">${esc(JSON.stringify(dev, null, 1))}</pre>`; }

// ---------------------------------------------------------------- hash routes: #explore/<scenario>/<block>, #how, #architecture, #results, #scope
let writing = false, disposeHow: (() => void) | null = null;
function writeHash() { if ((location.hash.split('/')[0] || '#explore') !== '#explore') return; const h = `#explore/${scn().id}${st.sel ? '/' + st.sel : ''}`; if (location.hash !== h) { writing = true; try { history.replaceState(null, '', h); } catch { /* sandboxed viewers may refuse; the page still works */ } writing = false; } }
function route() { if (writing) return; const [name, a, b] = (location.hash || '#explore').slice(1).split('/'); const page = PAGES[name] as (() => string) | undefined;
  $('#explore').hidden = !!page; $('#page').hidden = !page;
  document.querySelectorAll('#nav a').forEach((l) => l.setAttribute('aria-current', String(l.getAttribute('href') === '#' + (page ? name : 'explore') ? 'page' : 'false')));
  disposeHow?.(); disposeHow = null;
  if (page) { stopTour(); $('#page').innerHTML = page(); void devBlock(); if (name === 'how') disposeHow = mountHowAnimation($('#howfig'), reduce); st.playing = false; window.scrollTo(0, 0); main.focus({ preventScroll: true }); return; }
  const i = scenarios.findIndex((s) => s.id === a); if (i >= 0 && i !== st.sc) { st.sc = i; seek(0, false); } if (b !== undefined || st.sel) select(b ?? null, true); }
window.addEventListener('hashchange', route);
renderList(); renderInspector(); seek(0, false); route();
(window as unknown as Record<string, unknown>).__pq = { api, st, select, seek, setScenario, derived, ready: true };
