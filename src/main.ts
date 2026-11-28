import { mountMesh } from './meshView';
import { story, storyLength, storyFrame, storyNarration, readingSteps, fieldNotes } from './story';
import { mountRoom } from './cleanroom';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './styles.css';
import { build, byId, components, evidence, fmt, LABEL, playbackMode, results, scenarios, tiles, vcInfo, type Component, type Ev, type VcId } from './model';
import { createScene, type SceneApi } from './scene';
import { mountHowAnimation } from './howAnim';
import { GLOSSARY, SYSTEM_OVERVIEW, TILES_LEARNING, SCENARIO_LEARNING, type Mode } from './learning';

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
      <h1>Chip explorer</h1>
      <p class="heroscope">Follow a memory request across the six-tile RISC-V network.</p>
    </div>
    <div class="heroact">
      <div class="mode-toggle-wrap">
        <div class="mode-toggle" role="group" aria-label="Explorer mode">
          <button type="button" class="mode-btn" id="btn-mode-pres" aria-pressed="false">Presentation</button>
          <button type="button" class="mode-btn active" id="btn-mode-learn" aria-pressed="true">Learning</button>
        </div>
      </div>
      <button type="button" id="bdemo" class="primary big">Watch the demo</button>
      <button type="button" id="bfull">Full walkthrough</button>
    </div>
  </header>
  <div class="grid">
    <div class="stagewrap"><button class="mesh-switch" type="button" id="mesh-switch" aria-pressed="false">2D network</button>
        <div class="cambar" role="group" aria-label="Camera">
          <button type="button" data-preset="top">Top</button>
          <button type="button" data-preset="angled">Angled</button>
          <button type="button" data-preset="top" aria-label="Reset camera">Reset</button>
          <details class="view-options"><summary>View options</summary><div class="view-options-body">
          <select id="view" aria-label="Camera view">
            <option value="angled">Angled</option><option value="home">Home view</option><option value="top">Top</option><option value="front">Front</option><option value="back">Back</option>
            <option value="left">Left</option><option value="right">Right</option><option value="underside">Underside</option><option value="noc">Network</option><option value="tile3">Tile 3 close-up</option>
          </select>
          <button type="button" data-cam="left" aria-label="Rotate left">&larr;</button><button type="button" data-cam="right" aria-label="Rotate right">&rarr;</button>
          <button type="button" data-cam="up" aria-label="Tilt up">&uarr;</button><button type="button" data-cam="down" aria-label="Tilt down">&darr;</button>
          <button type="button" data-cam="in" aria-label="Zoom in">+</button><button type="button" data-cam="out" aria-label="Zoom out">&minus;</button>
          <button type="button" id="blogical" aria-pressed="false">Logical</button><button type="button" id="blabels" aria-pressed="true">Labels</button>
          </div></details>
        </div>
      <div class="stage" id="stage" tabindex="0" role="region" aria-label="3D view of the chip. Arrow keys rotate, plus and minus zoom, Home resets. Choose Inspect components below to browse all blocks.">
        <div class="labels" id="labels" aria-hidden="true"></div>
        <div class="tip" id="tip" hidden></div>
        <div class="fallback" id="fallback" hidden></div>
      </div>
        <div class="cap" id="cap">
          <div aria-live="polite" aria-atomic="true"><span class="capmeta"></span><p class="capwhat"></p><p class="capexplain"></p></div>
          <p id="packet-place" hidden></p>
        </div>
      <p class="repr" id="repr">Conceptual drawing: block sizes follow measured LUT counts; positions are illustrative, not a place-and-route floorplan.</p>
    </div>
    <section class="timeline" aria-label="Replay">
      <div class="trow trow-ctrl">
        <div class="btn-group">
          <button type="button" id="bprev" aria-label="Previous step">Previous</button>
          <button type="button" id="bplay" class="primary">Play</button>
          <button type="button" id="bnext" aria-label="Next step">Next</button>
          <button type="button" id="brestart">Replay</button>
        </div>
        <div class="speed-group">
          <label for="speed">Playback speed</label>
          <select id="speed"><option value="0.5">0.5×</option><option value="0.75" selected>0.75×</option><option value="1">1×</option><option value="2">2×</option></select>
        </div>
        <div class="readouts learning-only">
          <span class="read"><b>Tile 3</b><span id="rauth"></span></span>
          <span class="read"><b>UART output</b><span id="ruart"></span></span>
          <span class="read"><b>Board indicators</b><span id="rled"></span></span>
        </div>
      </div>
      <div class="stepbar"><span id="stepcount"></span><div id="stepchoices" role="group" aria-label="Playback steps"></div></div>
      <section class="step-context" aria-labelledby="context-heading"><h3 id="context-heading"></h3><p id="context-body"></p></section>
    </section>
    <section class="reading-panel" id="demo-guide" aria-labelledby="demo-guide-title">
      <h2 id="demo-guide-title">How the demo works</h2>
      <ol class="reading-steps">${readingSteps.map(x => `<li><h3>${esc(x.name)}</h3><p>${esc(x.text)}</p></li>`).join('')}</ol>
    </section>
    <section class="reading-panel learning-only" id="event-guide" aria-labelledby="event-title">
      <h2 id="event-title">Inside this step</h2>
      <div id="learn-timeline-card"></div>
      <details class="techd" id="audit-guide"><summary>How the security check works</summary><dl id="audit-facts"></dl></details>
    </section>
    <details class="side learning-only" id="inspector"><summary>Inspect components</summary>
      <div class="tilebar" role="group" aria-label="Tiles">
        ${tiles.map(t => `<button type="button" data-tile="${t.id}" aria-pressed="false"><b>${t.id}</b>${esc(t.name)}</button>`).join('')}
      </div>
      <section class="insp" id="insp" tabindex="-1" aria-live="polite" aria-label="Selected component"></section>
      <section class="clist" aria-label="All blocks">
        <label for="q">Find any block</label>
        <input id="q" type="search" placeholder="router, memory, verifier..." autocomplete="off">
        <ul id="list"></ul>
      </section>
    </details>
    <section class="timeline learning-only" aria-label="Scenario details">
      <div class="trow trow-scn">
        <div class="scn" id="scn" role="group" aria-label="Scenario"></div>
      </div>
      <details class="techd"><summary>Playback details</summary>
<div class="trow"><label for="scrub">Fine position</label><input id="scrub" type="range" min="0" max="1000" value="0" step="1"></div></details>
      <p class="where" id="where"></p>

      <details class="techd"><summary>Technical detail for this step</summary><div class="narr" id="narr"></div>
        <p class="mode">${esc(playbackMode)}</p></details>
    </section>
  </div>
</section>
<article id="page" class="page" hidden></article>
<aside id="gloss-drawer" class="gloss-drawer" aria-label="Glossary lookup" hidden>
  <div class="drawer-header">
    <h3>&#128214; Glossary Lookup</h3>
    <button type="button" class="drawer-close" id="btn-gloss-close" aria-label="Close glossary">&times;</button>
  </div>
  <div class="drawer-body" id="gloss-drawer-content"></div>
</aside>`;

// ---------------------------------------------------------------- 3D scene (optional: everything also works without it)
let api: SceneApi | null = null;
try { const a = createScene($('#stage'), $('#labels'), reduce); if (a.ok) api = a; } catch (e) { console.warn('3D view unavailable', e); }

const stage = $('#stage'), fallback = $('#fallback'), meshSwitch = $('#mesh-switch');
const stageLabel = stage.getAttribute('aria-label')!;
const mesh = mountMesh(fallback, id => select(id));
let useMesh = !api;
function setMeshMode(on: boolean) {
  useMesh = on || !api;
  stage.classList.toggle('nogl', useMesh);
  fallback.hidden = !useMesh;
  stage.setAttribute('aria-label', useMesh ? 'Interactive 2D network. Choose a tile or component to inspect.' : stageLabel);
  meshSwitch.hidden = !api;
  meshSwitch.setAttribute('aria-pressed', String(useMesh));
  meshSwitch.textContent = useMesh ? 'Return to 3D chip' : '2D network';
}
meshSwitch.addEventListener('click', () => {setMeshMode(!useMesh); updateFrame();});
stage.addEventListener('webglcontextlost', () => {
  api = null; setMeshMode(true); updateFrame();
}, true);
setMeshMode(useMesh);
function showFrame(e: Ev, progress: number) {
  return useMesh || !api ? mesh.render(e, progress) : api.showEvent(e, progress);
}

// ---------------------------------------------------------------- state & mode
const st = {
  sel: null as string | null,
  sc: 0,
  ev: 0,
  t: reduce ? 1 : 0,
  playing: false,
  speed: Number($<HTMLSelectElement>('#speed').value),
  sequence: 'scenario' as 'scenario' | 'short' | 'full',
  complete: false,
  storyTime: 0,
  mode: 'presentation' as Mode
};
const scn = () => scenarios[st.sc];
/** Authorization, UART and LED are derived from the events up to the current one, so seeking is always consistent. */
function derived() { let auth = scn().authStart, uart = '', led = '';
  scn().events.forEach((e, i) => { if (i < st.ev || (i === st.ev && st.t >= 1)) { if (e.authAfter !== undefined) auth = e.authAfter; if (e.uart) uart = e.uart; if (e.led) led = e.led; } });
  return { auth, uart, led }; }

function setAppMode(m: Mode) {
  st.mode = m;
  $('#explore').dataset.mode = m;
  if (m === 'presentation') closeGlossary();
  $('#btn-mode-pres').setAttribute('aria-pressed', String(m === 'presentation'));
  $('#btn-mode-pres').classList.toggle('active', m === 'presentation');
  $('#btn-mode-learn').setAttribute('aria-pressed', String(m === 'learning'));
  $('#btn-mode-learn').classList.toggle('active', m === 'learning');
  paint();
  if (m === 'learning') renderInspector();
}
$('#btn-mode-pres').addEventListener('click', () => setAppMode('presentation'));
$('#btn-mode-learn').addEventListener('click', () => setAppMode('learning'));

// ---------------------------------------------------------------- floating glossary drawer
function openGlossary(termKey?: string) {
  const drawer = $('#gloss-drawer'), body = $('#gloss-drawer-content');
  drawer.hidden = false;
  drawer.classList.add('open');
  const matched = termKey ? GLOSSARY.find((g) => g.term.toLowerCase().includes(termKey.toLowerCase()) || (g.acronym && g.acronym.toLowerCase() === termKey.toLowerCase())) : null;
  const list = matched ? [matched, ...GLOSSARY.filter((g) => g !== matched)] : GLOSSARY;
  body.innerHTML = `
    <div class="drawer-search"><label for="gd-q" class="eyebrow">Search term</label><input type="search" id="gd-q" placeholder="Type term or abbreviation..." autocomplete="off"></div>
    <div class="drawer-list" id="gd-list">
      ${list.map((g) => `
        <article class="gloss-card ${matched && g === matched ? 'highlighted' : ''}">
          <div class="gloss-top"><h4>${esc(g.term)}</h4><span class="gloss-cat">${esc(g.category)}</span></div>
          <p class="gloss-def">${esc(g.def)}</p>
          <div class="gloss-analogy">💡 <b>Analogy:</b> ${esc(g.analogy)}</div>
          <p class="gloss-chip"><strong>In this SoC:</strong> ${esc(g.inThisChip)}</p>
        </article>`).join('')}
    </div>`;
  const inEl = $<HTMLInputElement>('#gd-q', body);
  if (termKey) inEl.value = termKey;
  inEl.addEventListener('input', (e) => {
    const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
    const filtered = GLOSSARY.filter((g) => `${g.term} ${g.acronym || ''} ${g.def} ${g.category}`.toLowerCase().includes(q));
    $('#gd-list', body).innerHTML = filtered.map((g) => `
      <article class="gloss-card">
        <div class="gloss-top"><h4>${esc(g.term)}</h4><span class="gloss-cat">${esc(g.category)}</span></div>
        <p class="gloss-def">${esc(g.def)}</p>
        <div class="gloss-analogy">💡 <b>Analogy:</b> ${esc(g.analogy)}</div>
        <p class="gloss-chip"><strong>In this SoC:</strong> ${esc(g.inThisChip)}</p>
      </article>`).join('') || '<p class="muted">No matching terminology found.</p>';
  });
  inEl.focus();
}
function closeGlossary() {
  const drawer = $('#gloss-drawer');
  drawer.classList.remove('open');
  drawer.hidden = true;
}
$('#btn-gloss-close').addEventListener('click', closeGlossary);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#gloss-drawer').hidden) closeGlossary(); });

// ---------------------------------------------------------------- tile card: name, purpose, resources, what it does, its role in the demo
const badge = (k: string, v: string) => `<span class="badge" title="${esc(k)}">${esc(LABEL[v] ?? v)}</span>`;
const link = (id: string) => { const c = byId.get(id); return c ? `<button type="button" class="lnk" data-sel="${esc(id)}">${esc(c.name)}</button>` : esc(id); };
const hasRes = (c: Component) => ['lut', 'ff', 'bram', 'lutShare'].some((k) => (c.metrics as Record<string, unknown>)[k] !== undefined);
const val = (n: number | undefined) => (n === undefined ? NM : fmt(n));
function stats(c: Component) {
  const m = c.metrics;
  const source = c.evidenceRefs.includes('E-UTIL') || c.type === 'router' ? 'E-UTIL' : c.evidenceRefs[0];
  const report = source && evidence.get(source);
  const router = c.type === 'router';
  const basis = router ? 'Equal share of the six-router mesh' : hasRes(c) ? 'Measured after place and route' : 'Resource accounting';
  const numbers = [
    ['LUTs', router ? `${fmt(m.lutShare!)} <small>estimate</small>` : val(m.lut)],
    ['Flip-flops', router ? NM : val(m.ff)],
    ['Block RAMs', router ? NM : val(m.bram)],
  ];
  return `<div class="figure-source">${esc(basis)}${report ? ` · <a href="#results/${esc(source)}">${esc(report.title)}</a>` : ''}</div>
    <div class="stats">${numbers.map(([label,value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('')}</div>
    ${m.note ? `<p class="muted small">${esc(m.note)}</p>` : ''}`;
}
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

function renderInspector() {
  const el = $('#insp'), c = st.sel ? byId.get(st.sel) : null;
  document.querySelectorAll<HTMLElement>('.tilebar [data-tile]').forEach((b) => b.setAttribute('aria-pressed', String(!!c && +b.dataset.tile! === c.tileId)));
  if (!c) {
    el.innerHTML = `<p class="eyebrow">Explore each tile</p><h2>Pick a tile</h2><p class="purpose">Choose a tile above, a block on the chip, or a search result. You will see what the tile is for, how much hardware it uses and what it does in the demo.</p>
`;
    return;
  }
  if (c.tileId === null) {
    el.innerHTML = `<p class="eyebrow">${esc(c.coordinates)}</p><h2 class="selname">${esc(c.name)}</h2><p class="purpose">${esc(c.summary)}</p>${stats(c)}
      ${c.id === 'l2' ? `<p class="muted small">Shared by ${link('cpuA')} (tile 3) and ${link('ver')} (tile 4).</p>` : ''}${techDetail(c)}`;
    return;
  }
  const t = tiles[c.tileId], prim = byId.get(t.primary)!, parent = c.type === 'sub' && c.parentId ? byId.get(c.parentId)! : null;
  const parts = tileComps(t.id).filter((k) => k.type !== 'sub').concat(t.id === 3 || t.id === 4 ? [byId.get('l2')!] : []);
  const tl = TILES_LEARNING[t.id];

  // Learning mode full 9-point educational guide and analogy
  const learnGuideHtml = st.mode === 'learning' && tl ? `
    <div class="tile-analogy-box">
      <div class="analogy-head">💡 <b>Everyday Analogy:</b> <span>${esc(tl.analogyTitle)}</span></div>
      <p class="analogy-desc">${esc(tl.analogyText)}</p>
    </div>
    <div class="tile-learn-guide">
      <div class="guide-title-bar">
        <h3>Complete Tile Guide (9-Point Breakdown)</h3>
        <button type="button" class="btn-guide-gloss" data-gloss="SoC">📖 Glossary</button>
      </div>
      <div class="guide-grid">
        <div class="guide-item"><b>1. What is this component?</b><p>${esc(tl.whatIsIt)}</p></div>
        <div class="guide-item"><b>2. What is its responsibility?</b><p>${esc(tl.responsibility)}</p></div>
        <div class="guide-item"><b>3. Why does the system need it?</b><p>${esc(tl.whyNeeded)}</p></div>
        <div class="guide-item"><b>4. How does it interact with other tiles?</b><p>${esc(tl.interaction)}</p></div>
        <div class="guide-item"><b>5. What information enters it?</b><p>${esc(tl.infoEnters)}</p></div>
        <div class="guide-item"><b>6. What happens inside it?</b><p>${esc(tl.whatHappensInside)}</p></div>
        <div class="guide-item"><b>7. What information leaves it?</b><p>${esc(tl.infoLeaves)}</p></div>
        <div class="guide-item"><b>8. What security benefit does it provide?</b><p>${esc(tl.securityBenefit)}</p></div>
        <div class="guide-item"><b>9. What happens if compromised/unavailable?</b><p>${esc(tl.ifCompromised)}</p></div>
      </div>
    </div>` : '';

  el.innerHTML = `<p class="eyebrow">Tile ${t.id} · ${esc(t.name)}</p>
    <h2 class="selname">${esc(c.name)}</h2><p class="purpose">${esc(c.summary)}</p>${stats(c)}
    ${techDetail(c)}
    <details class="techd"><summary>Tile ${t.id} context and resource accounting</summary>
      <p>${esc(t.purpose)}</p>
      ${c !== prim ? `<h3>${esc(prim.name)} · main block</h3>${stats(prim)}` : ''}
      <h3>Measured tile resources</h3>${table(['Component', 'LUTs', 'Flip-flops', 'Block RAMs'], parts.filter(p => p.type !== 'router' && p.metrics.lut !== undefined).map(p => [esc(p.name), val(p.metrics.lut), val(p.metrics.ff), val(p.metrics.bram)]))}
      <ul class="does">${t.does.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <div id="tile-scenario">${demoRole(t.id)}</div>
    </details>
    <details class="techd"><summary>Tile learning guide</summary>${learnGuideHtml}</details>
    <h3>Parts in this tile</h3><ul class="parts">${parts.map((k) => `<li><button type="button" data-sel="${esc(k.id)}" aria-current="${k.id === c.id}"><span>${esc(k.name)}${k.id === 'l2' ? ' (shared with tile ' + (t.id === 3 ? 4 : 3) + ')' : ''}</span>${compact(k)}</button>
      ${k.type === 'cpu' ? `<details class="subparts-details"${parent && parent.id === k.id ? ' open' : ''}><summary><small>Subcomponents (${components.filter((s) => s.parentId === k.id).length})</small></summary><ul class="subparts">${components.filter((s) => s.parentId === k.id).map((s) => `<li><button type="button" data-sel="${esc(s.id)}" aria-current="${s.id === c.id}"><span>${esc(s.name)}</span>${compact(s)}</button></li>`).join('')}</ul></details>` : ''}</li>`).join('')}</ul>
    `;
}

function select(id: string | null, fromHash = false, fly = false) { st.sel = id && byId.has(id) ? id : null; if (st.sel && st.mode !== 'learning') setAppMode('learning'); if (st.sel) $<HTMLDetailsElement>('#inspector').open = true; api?.select(st.sel); api?.focusTile(st.sel ? byId.get(st.sel)!.tileId : null, fly); renderInspector();
  document.querySelectorAll('#list button').forEach((b) => b.setAttribute('aria-current', String((b as HTMLElement).dataset.sel === st.sel)));
  mesh.select(st.sel);
  if (!fromHash) {
    writeHash();
    if (st.sel) {
      const spec = $('#insp');
      spec.focus({preventScroll:true});
      spec.scrollIntoView({block:'start', behavior:reduce ? 'instant' : 'smooth'});
    }
  }
}

// ---------------------------------------------------------------- searchable, keyboard-operable block list (mirrors the 3D selection)
function renderList(q = '') { const f = q.trim().toLowerCase();
  const rows = components.filter((c) => !f || `${c.name} ${c.type} tile ${c.tileId ?? ''} ${c.summary}`.toLowerCase().includes(f));
  $('#list').innerHTML = rows.map((c) => `<li><button type="button" data-sel="${esc(c.id)}" aria-current="${c.id === st.sel}"><span>${esc(c.name)}</span><small>${c.tileId !== null ? 'tile ' + c.tileId : esc(c.type)}</small></button></li>`).join('') || '<li class="muted">No block matches.</li>'; }
$('#q').addEventListener('input', (e) => renderList((e.target as HTMLInputElement).value));
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-sel],[data-sc],[data-tile],[data-ev],[data-gloss]');
  if (!b) return;
  if (b.dataset.gloss) { openGlossary(b.dataset.gloss); }
  else if (b.dataset.sel) {
    if (!location.hash.startsWith('#explore')) {
      returnHash = '';
      history.pushState(null, '', '#explore');
      route();
    }
    select(b.dataset.sel);
  }
  else if (b.dataset.tile !== undefined) { select(tiles[+b.dataset.tile].primary); }
  else if (b.dataset.sc) { const i = scenarios.findIndex((s) => s.id === b.dataset.sc); if (i >= 0) { stopTour(); location.hash = '#explore'; setScenario(i, true); } }
  else if (b.dataset.ev !== undefined) { stopTour(); seek(+b.dataset.ev, true); }
});

// ---------------------------------------------------------------- playback, captions, and educational breakdowns
function paint() {
  const s = scn(), e = s.events[st.ev], d = derived();
  const elData = SCENARIO_LEARNING[e.id];
  $('#rauth').textContent = d.auth ? 'authorized' : 'not authorized';
  $('#ruart').textContent = d.uart ? `"${d.uart}"` : 'no output yet';
  const lights = [d.auth ? 'LD0 authorization on' : 'LD0 authorization off'];
  if (d.led === '0001') lights.push('LD2 Tile 3 pass');
  if (d.led === '0010') lights.push('RGB Tile 0 refused');
  $('#rled').textContent = lights.join(' · ');
  const tileContext = document.getElementById('tile-scenario');
  const tileId = st.sel ? byId.get(st.sel)?.tileId : null;
  if (tileContext && tileId != null && tileContext.dataset.event !== e.id) {
    tileContext.dataset.event = e.id;
    tileContext.innerHTML = demoRole(tileId);
  }
  $('#where').textContent = `${s.summary} Shown: ${s.where}.`;


  const short = st.sequence === 'short';
  const frame = storyFrame(st.storyTime);
  $('#where').hidden = short;
  const setup = short && frame.beat.id === 'setup';
  $('#narr').closest('details')!.hidden = setup;
  $('#demo-guide').hidden = !short;
  const note = fieldNotes[setup ? 'setup' : e.id];
  setCopy($('#context-heading'), note[0]);
  setCopy($('#context-body'), note[1]);
  renderSteps();
  const learnBox = $('#learn-timeline-card');
  if (st.mode === 'learning') {
    const rows = (values: string[][]) => values.map(([title, detail]) => `<div><dt>${esc(title)}</dt><dd>${esc(detail)}</dd></div>`).join('');
    $('#event-title').textContent = setup ? 'Before the first packet' : e.label;
    $('#audit-guide').hidden = setup || !elData;
    if (setup) {
      learnBox.innerHTML = '<dl>' + rows([
        ['What to watch', 'Find CPU A on Tile 3, CPU B on Tile 0 and shared memory on Tile 2. A tile is one part of the chip.'],
        ['What a write means', 'A processor asks memory to save a number at an address. Both processors use address 0x22000100.'],
        ['Why permission matters', 'Tile 3 already has a grant. Tile 0 has no grant. The bridge beside each processor checks this before sending a packet.'],
      ]) + '</dl>';
    } else if (elData) {
      learnBox.innerHTML = '<dl>' + rows([
        ['What happens', elData.whatIsHappening], ['Why it happens', elData.whyHappening],
        ['How it works', elData.howItWorks], ['An everyday comparison', elData.analogy],
        ['What comes next', elData.whatHappensNext], ['Why it matters', elData.realWorldSignificance],
      ]) + '</dl>';
      $('#audit-facts').innerHTML = rows([
        ['Who starts it', elData.initiatedBy], ['Requested action', elData.attemptedAction],
        ['Where the check happens', elData.checkingComponent], ['Checks', elData.checksPerformed],
        ['Outcome', elData.resultStatus], ['Reason', elData.whyResult], ['Without the check', elData.withoutSecurity],
      ]);
    } else learnBox.textContent = e.what;
  }
  const route = e.path.map((p) => byId.get(p)!.type === 'router' ? p.toUpperCase() : byId.get(p)!.name).join(' → ');
  $('#narr').innerHTML = `<p><strong>${esc(e.label)}.</strong> ${esc(e.what)} ${esc(e.why)}</p>
    <p class="muted"><span class="mono">${esc(vcInfo[e.vc as VcId].name)}</span> carries ${esc(vcInfo[e.vc as VcId].carries)} (${esc(vcInfo[e.vc as VcId].shape)}). Route: ${esc(route)}.
    ${e.outcome === 'accepted' ? '' : `<strong>Outcome: ${e.outcome}.</strong> The stop sign marks where it ends.`}</p>`;
  document.querySelectorAll('#scn button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.sc)));
  $('#bplay').textContent = st.playing ? 'Pause' : st.complete ? 'Replay' : reduce ? 'Step' : (st.sequence === 'short' ? st.storyTime : elapsed) > 0 ? 'Resume' : 'Play';
  $('#bdemo').textContent = st.sequence === 'short' && st.playing ? 'Pause demo' : 'Watch the demo';
  $('#bfull').textContent = st.sequence === 'full' && st.playing ? 'Pause walkthrough' : 'Full walkthrough';

  api?.setFocus(short && frame.beat.id === 'setup' ? ['cpuA','cpuB'] : st.t >= 1 ? [e.path[e.path.length - 1]] : [e.actor]);
  updateFrame();
  api?.setLeds(d);
  syncScrub();
}

const scrub = $<HTMLInputElement>('#scrub');
let stepKey = '';
function renderSteps() {
  const short = st.sequence === 'short';
  const list = playlist();
  const index = short ? story.indexOf(storyFrame(st.storyTime).beat) : list.findIndex(x => x.sc === st.sc && x.ev === st.ev);
  const key = short ? 'short' : st.sequence === 'full' ? 'full' : scn().id;
  const names = short ? story.map(x => x.name) : list.map(x => scenarios[x.sc].events[x.ev].label);
  if (key !== stepKey) {
    stepKey = key;
    $('#stepchoices').innerHTML = names.map((name,i) => `<button type="button" data-step="${i}">${esc(name)}</button>`).join('');
  }
  $('#stepcount').textContent = `${index + 1} of ${names.length} · ${names[index]}`;
  Array.from($('#stepchoices').children).forEach((b,i) => b.setAttribute('aria-current', i === index ? 'step' : 'false'));
  $('#stepchoices').classList.toggle('long-list', names.length > 4);
  $('#bprev').toggleAttribute('disabled', index === 0);
}
$('#stepchoices').addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-step]');
  if (!button) return;
  const index = Number(button.dataset.step);
  if (st.sequence === 'short') jumpStory(index);
  else { const step = playlist()[index]; st.sc = step.sc; seek(step.ev, false); writeHash(); }
});
function syncScrub() {
  const short = st.sequence === 'short';
  const fullIndex = st.sequence === 'full' ? allSteps.findIndex(x => x.sc === st.sc && x.ev === st.ev) : -1;
  const fraction = fullIndex >= 0 ? (fullIndex + st.t) / allSteps.length : short ? st.storyTime / storyLength : (st.ev + st.t) / scn().events.length;
  scrub.value = String(Math.round(fraction * 1000));
  scrub.setAttribute('aria-valuetext', short ? `${(st.storyTime / 1000).toFixed(1)} seconds, ${storyFrame(st.storyTime).beat.name}` : scn().events[st.ev].label);
}
function setCopy(el: HTMLElement, text: string) {
  if (el.textContent !== text) el.textContent = text;
}
const capMeta = $('#cap .capmeta'), capTitle = $('#cap .capwhat'), capDetail = $('#cap .capexplain'), packetPlace = $('#packet-place');
function updateFrame() {
  const event = scn().events[st.ev];
  const setup = st.sequence === 'short' && storyFrame(st.storyTime).beat.id === 'setup';
  let node = '';
  if (setup) {
    if (useMesh) mesh.render(null, 0);
    else api?.showEvent(null, 0);
  } else node = showFrame(event, st.t);
  const short = st.sequence === 'short';
  const frame = short ? storyFrame(st.storyTime) : null;
  const beat = frame?.beat.id ?? ({'acc-1':'write', 'acc-2':'ack', 'ref-1':'refusal'} as Record<string,string>)[event.id];
  const copy = beat ? storyNarration(beat, node, st.t >= 1) : [st.t >= 1 ? event.plain : event.label, st.t >= 1 ? event.matters : event.who + ' · ' + event.what];
  setCopy(capMeta, frame ? `Step ${story.indexOf(frame.beat) + 1} of ${story.length} · ${frame.beat.name}` : scn().name);
  setCopy(capTitle, copy[0]); setCopy(capDetail, copy[1]);
  packetPlace.hidden = !node;
  if (node) {
    const label = /^r\d$/.test(node) ? `Router ${node.slice(1)}` : byId.get(node)?.name ?? node;
    setCopy(packetPlace, (event.vc === 'local' ? 'Local request' : event.id === 'acc-2' ? 'Reply' : 'Transfer') + ' · ' + label);
  }
}
const storyEvents = new Map(scenarios.flatMap((scenario, sc) =>
  scenario.events.map((event, ev) => [event.id, {sc, ev}] as const)));
function sampleStory(ms: number, force = false) {
  const previous = storyFrame(st.storyTime);
  const frame = storyFrame(ms);
  st.storyTime = frame.time;
  const event = storyEvents.get(frame.beat.event)!;
  st.sc = event.sc; st.ev = event.ev; st.t = frame.progress;
  st.complete = frame.time === storyLength;
  if (st.complete) st.playing = false;
  if (force || previous.beat !== frame.beat || previous.arrived !== frame.arrived || st.complete) {
    paint(); writeHash();
  } else { updateFrame(); syncScrub(); }
}
function jumpStory(index: number, play = false) {
  st.playing = play && !reduce;
  const beat = story[index];
  // Manual stepping exposes the result even when motion is reduced.
  sampleStory(reduce && index > 0 ? beat.arrival : beat.start, true);
  schedule();
}
/** Scrubbing sets (event, progress) directly; everything shown is recomputed from that pair. */
const allSteps = scenarios.flatMap((scenario, sc) => scenario.events.map((event, ev) => ({ sc, ev, id: event.id })));

function playlist() {

  if (st.sequence === 'full') return allSteps;
  return allSteps.filter(step => step.sc === st.sc);
}
let elapsed = 0, raf = 0, lastFrame = 0;
function duration() { return 1500 + scn().events[st.ev].path.length * 420; }
function stopTour() { st.sequence = 'scenario'; }
function seek(i: number, play: boolean) {
  cancelAnimationFrame(raf);
  st.ev = Math.max(0, Math.min(scn().events.length - 1, i));
  st.t = reduce ? 1 : 0;
  elapsed = st.t * duration();
  st.complete = false;
  st.playing = play && !reduce;
  paint();
  schedule();
}
function setScenario(i: number, play: boolean) { st.sc = i; seek(0, play); writeHash(); }
function stepBy(direction: number, play = false) {
  if (st.sequence === 'short') {
    const index = story.indexOf(storyFrame(st.storyTime).beat) + direction;
    if (index === story.length) sampleStory(storyLength, true);
    else if (index >= 0) jumpStory(index);
    return;
  }
  const steps = playlist();
  const i = steps.findIndex(step => step.sc === st.sc && step.ev === st.ev);
  const next = steps[i + direction];
  if (next) {
    st.sc = next.sc; seek(next.ev, play); writeHash();
  } else if (direction > 0) {
    st.playing = false; st.complete = true; st.t = 1; paint();
  }
}
function schedule() {
  cancelAnimationFrame(raf);
  if (!st.playing || document.hidden) return;
  lastFrame = performance.now();
  raf = requestAnimationFrame(tick);
}
function tick(now: number) {
  if (!st.playing || document.hidden) return;
  if (st.sequence === 'short') {
    const delta = (now - lastFrame) * st.speed;
    lastFrame = now;
    sampleStory(st.storyTime + delta);
    if (st.playing) raf = requestAnimationFrame(tick);
    return;
  }
  elapsed += (now - lastFrame) * st.speed;
  lastFrame = now;
  const previous = st.t;
  st.t = Math.min(1, elapsed / duration());
  if (previous < 1 && st.t === 1) {
    // Start the caption hold when the final packet position first reaches the screen.
    elapsed = duration();
    paint();
  }
  else { updateFrame(); syncScrub(); }
  if (elapsed >= duration() + 1400) stepBy(1, true);
  else raf = requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', schedule);
function restart() {
  if (st.sequence === 'short') { jumpStory(0, true); return; }
  const first = playlist()[0];
  st.sc = first.sc; seek(first.ev, true); writeHash();
}
scrub.addEventListener('input', () => {
  if (st.sequence === 'short') {
    st.playing = false; sampleStory(Number(scrub.value) * storyLength / 1000, true); schedule(); return;
  }
  const choices = playlist();
  const x = Number(scrub.value) / 1000 * choices.length;
  const index = Math.min(choices.length - 1, Math.floor(x));
  st.sc = choices[index].sc; st.ev = choices[index].ev;
  st.t = reduce ? 1 : x - index;
  elapsed = st.t * duration();
  st.playing = st.complete = false;
  schedule(); paint(); writeHash();
});
$('#scn').innerHTML = scenarios.map((s, i) => `<button type="button" data-scn="${i}">${i + 1}. ${esc(s.name)}</button>`).join('');
$('#scn').addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-scn]'); if (b) { stopTour(); setScenario(+b.dataset.scn!, true); } });
$('#bplay').addEventListener('click', () => {
  if (st.complete) { restart(); return; }
  if (reduce) { stepBy(1); return; }
  st.playing = !st.playing; paint(); schedule();
});
$('#bnext').addEventListener('click', () => stepBy(1));
$('#bprev').addEventListener('click', () => stepBy(-1));
$('#brestart').addEventListener('click', restart);
$('#speed').addEventListener('change', (e) => { st.speed = Number((e.target as HTMLSelectElement).value); });
function startSequence(sequence: 'short' | 'full') {
  if (st.sequence === sequence && st.playing) {
    st.playing = false; schedule(); paint(); return;
  }
  st.sequence = sequence;
  if (sequence === 'full') setAppMode('learning');
  cameraView('top', true);
  restart();
  $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
}
$('#bdemo').addEventListener('click', () => startSequence('short'));
$('#bfull').addEventListener('click', () => startSequence('full'));

// ---------------------------------------------------------------- camera and view controls
function cameraView(name: string, instant = false) {
  $<HTMLSelectElement>('#view').value = name;
  api?.setView(name, instant);
}
$('#view').addEventListener('change', (e) => cameraView((e.target as HTMLSelectElement).value));
document.querySelector('.cambar')!.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) return;
  if (b.dataset.preset) cameraView(b.dataset.preset);
  if (b.dataset.cam) api?.stepCamera(b.dataset.cam);
  if (b.id === 'blogical') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); api?.setLogical(on);
    $('#repr').textContent = on ? 'Logical view: blocks, links and routes follow the RTL; the layout is a diagram, not a physical floorplan.' : 'Conceptual drawing: block sizes follow measured LUT counts; positions are illustrative, not a place-and-route floorplan.'; }
  if (b.id === 'blabels') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); api?.setLabels(on); } });
api?.onPick((id) => select(id, false, false));
$('#stage').addEventListener('keydown', (e) => { if (useMesh || e.target !== e.currentTarget) return; const k: Record<string, string> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out' };
  if (k[e.key]) { api?.stepCamera(k[e.key]); e.preventDefault(); } else if (e.key === 'Home') { cameraView('top'); e.preventDefault(); } });
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

  overview: () => `<p class="eyebrow">Complete System Overview</p><h1>${esc(SYSTEM_OVERVIEW.title)}</h1>
    <p class="lead">${esc(SYSTEM_OVERVIEW.lead)}</p>
    <div class="overview-analogy-box">
      <h3>The Six Departments of the SoC</h3>
      <p>In modern computing, multiple processing cores, memories, and cryptographic engines reside together on a single silicon chip (a System on Chip). Rather than trusting every component implicitly, our architecture enforces a strict zero-trust security perimeter.</p>
    </div>
    <div class="tw">
      <table class="overview-table">
        <thead>
          <tr><th>Office Analogy</th><th>SoC Component</th><th>Hardware Implementation</th><th>How It Works (Plain English)</th></tr>
        </thead>
        <tbody>
          ${SYSTEM_OVERVIEW.analogyRows.map((r) => `
            <tr>
              <td><strong>${esc(r.officeRole)}</strong></td>
              <td><span class="mono">${esc(r.chipComponent)}</span></td>
              <td>${esc(r.hardwareRole)}</td>
              <td>${esc(r.howItWorks)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <h2>Life of a Transaction: Step-by-Step Flow</h2>
    <div class="overview-steps">
      <div class="ov-step"><b>1. Boot &amp; Measure</b><p>At startup, Tile 3 computes a digital fingerprint (hash) of its initial code. Any modification alters this fingerprint.</p></div>
      <div class="ov-step"><b>2. Challenge &amp; Response</b><p>Tile 4 (Root of Trust) issues a fresh challenge question. Tile 3 seals its fingerprint with a secret key and returns it.</p></div>
      <div class="ov-step"><b>3. Access Grant</b><p>Tile 4 checks the keyed tag and expected firmware measurement. If valid, Tile 4 sends GRANT and unlocks Tile 3’s network gate.</p></div>
      <div class="ov-step"><b>4. Guarded Memory Access</b><p>Tile 3 writes to shared memory. The Memory Front End re-checks authorization at the moment of access.</p></div>
      <div class="ov-step"><b>5. Local Refusal of Unauthorized Units</b><p>Tile 0 was never authorized. Its requests are halted right at its own local bridge; zero packets enter the network.</p></div>
      <div class="ov-step"><b>6. Dynamic Revocation</b><p>Button 2 triggers REVOKE. Once Tile 3 applies the revocation, its bridge refuses the next request.</p></div>
      <div class="ov-step"><b>7. Ingress Quarantine</b><p>The simulated forged packet is stopped at Tile 5. Its external injection port is tied off in the board image.</p></div>
    </div>
    <p><a class="cta" href="#explore">Try the Interactive 3D Demonstration &rarr;</a></p>`,

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

  glossary: () => `<p class="eyebrow">Technical Reference</p><h1>Complete System Glossary</h1>
    <p class="lead">Beginner-friendly definitions and everyday analogies for every technical term, acronym, and hardware concept used in the PQ-Attest SoC Explorer.</p>
    <div class="gloss-filter-bar">
      <div class="gloss-cats" role="tablist" aria-label="Glossary categories">
        <button type="button" class="btn-gcat active" data-cat="all">All Terms (${GLOSSARY.length})</button>
        <button type="button" class="btn-gcat" data-cat="Architecture">Architecture</button>
        <button type="button" class="btn-gcat" data-cat="Security">Security</button>
        <button type="button" class="btn-gcat" data-cat="Hardware">Hardware</button>
        <button type="button" class="btn-gcat" data-cat="Networking">Networking</button>
      </div>
      <input type="search" id="gsearch" placeholder="Filter terms or analogies..." autocomplete="off">
    </div>
    <div class="gloss-grid" id="gloss-grid-main">
      ${GLOSSARY.map((g) => `
        <article class="gloss-card" data-cat="${esc(g.category)}" data-term="${esc(g.term.toLowerCase())}">
          <div class="gloss-top">
            <h3>${esc(g.term)}</h3>
            <span class="gloss-cat">${esc(g.category)}</span>
          </div>
          <p class="gloss-def">${esc(g.def)}</p>
          <div class="gloss-analogy">💡 <b>Analogy:</b> ${esc(g.analogy)}</div>
          <p class="gloss-chip"><strong>In this SoC:</strong> ${esc(g.inThisChip)}</p>
        </article>`).join('')}
    </div>`,

  results: () => `<p class="eyebrow">Results</p><h1>What was built and measured</h1>
    <p class="lead">${esc(build.device)} on the ${esc(build.board)}, ${esc(build.tool)}, ${esc(build.clock)}. Figures are from the ${esc(build.label)} after place and route.</p>
    <div class="kpis">
      <div class="kpi"><b>${fmt(cur.lut)}</b><span>LUTs</span><small>${esc(cur.lutPct)}</small></div>
      <div class="kpi"><b>${fmt(cur.ff!)}</b><span>Flip-flops</span><small>of 126,800</small></div>
      <div class="kpi"><b>${cur.bram}</b><span>Block RAMs</span><small>of 135</small></div>
      <div class="kpi"><b>50 MHz</b><span>Timing met</span><small>setup ${cur.wns} ns · hold ${cur.whs} ns</small></div>
    </div>
    <div class="cols"><div>
    <h2>What works</h2><ul class="works">${results.scope.filter((s) => s.status === 'Built and routed' || s.status === 'Shown in simulation').map((s) => `<li><b>${esc(s.item)}</b><small>${esc(s.status)}${s.note ? ' · ' + esc(s.note) : ''}</small></li>`).join('')}</ul>
    </div><div>
    <h2>Cost of the security logic</h2><p>The area and slack comparison uses an earlier FPGA research build. Latency and throughput come from a matched simulation of 64 transactions per mode.</p>
    ${table(['Measure', 'Secure', 'Without'], results.comparison.rows.map((r) => [esc(r.metric), esc(r.secure), esc(r.baseline)]))}
    <p><a href="https://github.com/arnav1609/Pqattest_Website/blob/a2f7499f6c3c049361c063b20f1aac93d99c71e7/Arnav_Website_Revision10_Handoff_20261115/evidence/reports/I27_R2_GATE_20261114.md">Matched simulation report</a></p><h2>On the board</h2><p>An image from 7 November was reported as passing on the board by the project owner (observations not itemised). The current 15 November image has board validation pending. <a href="https://github.com/arnav1609/Pqattest_Website/blob/a2f7499f6c3c049361c063b20f1aac93d99c71e7/Arnav_Website_Revision10_Handoff_20261115/evidence/reports/HARDWARE_RUN_20261107.md">Historical board report</a></p>
    </div></div>
    <details class="evid"><summary>Full build and verification evidence</summary>
    <h2>Builds</h2>${table(['Build', 'Status', 'LUTs', 'Flip-flops', 'Block RAM', 'Setup slack (ns)', 'Hold slack (ns)', 'Board'],
      results.builds.map((b) => [esc(b.label), `${esc(LABEL[b.maturity])}; ${esc(LABEL[b.currency])}`, `${nn(b.lut)} <small>${esc(b.lutPct)}</small>`, nn(b.ff), nn(b.bram), nn(b.wns), nn(b.whs), esc(b.board)]))}
    <p class="muted">The hold margin of the current build (+0.007 ns) is thin but positive. Each build embeds its build time, so two builds of the same sources produce different image files.</p>
    <h2>Checks on the current build</h2>${table(['Check', 'Result', 'Source'], results.checks.map((c) => [esc(c.name), esc(c.value), refName(c.ref)]))}
    <h2>Comparison sources</h2><p>${esc(results.comparison.note)}</p>${table(['Measure', 'Source'], results.comparison.rows.map((r) => [esc(r.metric), refName(r.ref)]))}
    <h2>Evidence used on this site</h2><p><a href="https://github.com/arnav1609/Pqattest_Website/blob/a2f7499f6c3c049361c063b20f1aac93d99c71e7/Arnav_Website_Revision10_Handoff_20261115/evidence/NOC_PQATTEST.runs/impl_merged/gate/util_hier_routed.rpt">Read the Revision 10 hierarchical utilization report on GitHub</a></p>${table(['Evidence', 'Kind', 'Date', 'Build', 'What it shows', 'Limits'], [...evidence.values()].map((e) => [`<span id="${esc(e.id)}">${esc(e.title)}</span>`, esc(e.kind), esc(e.date), esc(LABEL[e.currency]), esc(e.says), esc(e.limits)]))}
    <div id="dev"></div></details>`,

  scope: () => `<p class="eyebrow">Project scope</p><h1>Planned, built, shown, pending</h1>
    <p class="lead">The original proposal against what exists today. Items marked "not built" were proposed and are not part of this prototype.</p>
    ${table(['Item', 'Status', 'Note'], results.scope.map((s) => [esc(s.item), `<span class="st st-${s.status.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(s.status)}</span>`, esc(s.note)]))}
    <h2>What comes next</h2><ol><li>Run the current image on the board and record each observation against the image it was made from.</li>
    <li>Finish the independent RTL sign-off review that is in progress.</li><li>Decide the scope of an ASIC flow (RTL to GDSII). That work has not started.</li></ol>
    <h2>Cleanroom image credit</h2><p>The introductory illustration comes from the project asset <code>cleanroom-photo.webp</code>, added in revision <code>b49af72</code>. The equipment bears ASML branding. The original creator and license are undocumented.</p>`
};

async function devBlock() { if (__PUBLIC_SAFE__) return; const el = document.getElementById('dev'); if (!el) return; const dev = (await import('../data/evidence.dev.json')).default;
  el.innerHTML = `<h2>Development metadata (not in public builds)</h2><pre class="mono">${esc(JSON.stringify(dev, null, 1))}</pre>`; }

// ---------------------------------------------------------------- hash routes
let introComplete = false;
try { introComplete = sessionStorage.getItem('pq-entered') === '1'; } catch { /* private browsing */ }
const displayRoom = mountRoom(() => {
  history.replaceState(null, '', '#inspect');
  route();
  return api?.overheadDie();
}, () => {
  api?.finishEntrance();
  $('#stage').focus({ preventScroll: true });
});
let writing = false, disposeHow: (() => void) | null = null;
let returnHash = '';
function explorerHash() {
  const step = st.sequence === 'short' ? storyFrame(st.storyTime).beat.id : scn().events[st.ev].id;
  const params = new URLSearchParams({step, tour: st.sequence});
  return `#explore/${scn().id}${st.sel ? '/' + st.sel : ''}?${params}`;
}
function writeHash() {
  if (!location.hash.startsWith('#explore')) return;
  const h = explorerHash();
  if (location.hash === h) return;
  writing = true;
  try { history.replaceState(null, '', h); } catch { /* restricted preview */ }
  writing = false;
}
function route() {
  if (writing) return;
  const [path, query] = location.hash.slice(1).split('?');
  const [requested,a,b] = path.split('/');
  const params = new URLSearchParams(query);
  const name = !requested && !introComplete ? 'intro' : requested === 'cleanroom' || !requested ? 'explore' : requested;
  if (name !== 'intro' || requested) {
    introComplete = true;
    try { sessionStorage.setItem('pq-entered','1'); } catch { /* memory still covers this visit */ }
    if (!requested || requested === 'cleanroom') history.replaceState(null,'','#explore');
  } const page = PAGES[name] as (() => string) | undefined;
  const inRoom = name === 'intro' && !requested && !introComplete; displayRoom(inRoom); $('#explore').hidden = !!page || inRoom; $('#page').hidden = !page;
  document.querySelectorAll('#nav a').forEach((l) => l.setAttribute('aria-current', String(l.getAttribute('href') === '#' + (page || inRoom ? name : 'explore') ? 'page' : 'false')));
  disposeHow?.(); disposeHow = null;
  if (inRoom) {st.playing=false; requestAnimationFrame(() => { if (document.body.classList.contains('intro-only')) api?.warmEntrance(); }); return;}
  if (page) {
    if (!returnHash) returnHash = explorerHash();
    st.playing = false; schedule();
    $('#page').innerHTML = page();
    void devBlock();
    if (name === 'results' && a && evidence.has(a)) {
      const section = $('.evid') as HTMLDetailsElement;
      section.open = true;
      requestAnimationFrame(() => document.getElementById(a)?.scrollIntoView({block: 'center'}));
    }
    if (name === 'how') disposeHow = mountHowAnimation($('#howfig'), reduce);
    if (name === 'glossary') {
      const gInput = $<HTMLInputElement>('#gsearch'), grid = $('#gloss-grid-main');
      const filterGloss = () => {
        const q = gInput?.value.trim().toLowerCase() || '';
        const activeCat = $('.btn-gcat.active')?.dataset.cat || 'all';
        grid.querySelectorAll<HTMLElement>('.gloss-card').forEach((card) => {
          const matchCat = activeCat === 'all' || card.dataset.cat === activeCat;
          const matchQ = !q || card.textContent?.toLowerCase().includes(q);
          card.style.display = matchCat && matchQ ? '' : 'none';
        });
      };
      gInput?.addEventListener('input', filterGloss);
      document.querySelectorAll('.btn-gcat').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-gcat').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          filterGloss();
        });
      });
    }
    st.playing = false; window.scrollTo(0, 0); main.focus({ preventScroll: true }); return;
  }
  if (name === 'inspect') {
    $<HTMLSelectElement>('#view').value = 'top';
    api?.setView('top',true);
    history.replaceState(null, '', '#explore');
    $('#stage').scrollIntoView({block:'center', behavior: 'instant'});
  }
  if (returnHash && (path === 'explore' || location.hash === returnHash)) {
    returnHash = ''; paint(); writeHash(); return;
  }
  returnHash = '';
  const sc = scenarios.findIndex(s => s.id === a);
  if (sc >= 0) {
    const index = story.findIndex(x => x.id === params.get('step'));
    if (params.get('tour') === 'short' && index >= 0) {
      st.sequence = 'short'; jumpStory(index);
    } else {
      st.sequence = params.get('tour') === 'full' ? 'full' : 'scenario';
      if (st.sequence === 'full') setAppMode('learning');
      st.sc = sc;
      const ev = scn().events.findIndex(e => e.id === params.get('step'));
      seek(Math.max(0, ev), false);
    }
    select(b ?? null, true);
    if (params.has('step')) writeHash();
    if (!params.has('step') && !b) setAppMode('learning');
  }
}
window.addEventListener('hashchange', route);
renderList();
st.sequence = 'short';
const opening = storyEvents.get(story[0].event)!;
st.sc = opening.sc; st.ev = opening.ev; st.t = 0;
setAppMode('presentation'); route();
(window as unknown as Record<string, unknown>).__pq = { get api() { return api; }, st, select, seek, setScenario, setAppMode, derived, ready: true };
