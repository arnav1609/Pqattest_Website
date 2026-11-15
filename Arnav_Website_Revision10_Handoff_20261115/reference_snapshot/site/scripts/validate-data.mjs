// validate:data - structural checks on the site's data model. Exits 1 on any error.
import { readFileSync } from 'node:fs';
const J = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const arch = J('architecture.json'), scen = J('scenarios.json'), evid = J('evidence.json'), res = J('results.json');
const errs = [];
const err = (m) => errs.push(m);
const ENUM = {
  maturity: ['PLANNED', 'SPECIFIED', 'RTL_IMPLEMENTED', 'SIM_VERIFIED', 'SYNTHESIZED', 'ROUTED', 'HARDWARE_VALIDATED'],
  currency: ['CURRENT_BUILD', 'HISTORICAL', 'UNKNOWN'], confidence: ['DIRECT', 'DERIVED', 'UNVERIFIED'],
  representation: ['LOGICAL', 'CONCEPTUAL', 'PHYSICALLY_EVIDENCED']
};
const REQUIRED = ['id', 'name', 'type', 'tileId', 'parentId', 'modulePath', 'representation', 'maturity', 'currency', 'confidence', 'evidenceRefs',
  'interfaces', 'clockDomain', 'resetDomain', 'geometry', 'geometryRule', 'placementBasis', 'metrics', 'scenarioRefs'];
const comps = arch.components.map((c) => ({ ...arch.defaults, ...c }));
const ids = new Set(), evIds = new Set(evid.refs.map((e) => e.id)), tileIds = new Set(arch.tiles.map((t) => t.id)), scIds = new Set(scen.scenarios.map((s) => s.id));
if (evIds.size !== evid.refs.length) err('duplicate evidence id');

for (const c of comps) {
  for (const k of REQUIRED) if (!(k in c)) err(`${c.id}: missing field ${k}`);
  if (ids.has(c.id)) err(`duplicate component id ${c.id}`); ids.add(c.id);
  for (const k of Object.keys(ENUM)) if (!ENUM[k].includes(c[k])) err(`${c.id}: bad ${k} ${c[k]}`);
  if (c.tileId !== null && !tileIds.has(c.tileId)) err(`${c.id}: unknown tile ${c.tileId}`);
  for (const r of c.evidenceRefs) if (!evIds.has(r)) err(`${c.id}: evidence ref ${r} does not resolve`);
  for (const s of c.scenarioRefs) if (!scIds.has(s)) err(`${c.id}: scenario ref ${s} does not resolve`);
  if (c.currency === 'CURRENT_BUILD' && c.evidenceRefs.length === 0) err(`${c.id}: CURRENT_BUILD without build provenance`);
  if (c.representation === 'PHYSICALLY_EVIDENCED') err(`${c.id}: no physical placement data exists; PHYSICALLY_EVIDENCED is not allowed`);
  if (c.maturity === 'HARDWARE_VALIDATED') err(`${c.id}: no board record for the current build`);
  if (!c.summary && !['router', 'ni'].includes(c.type)) err(`${c.id}: no summary`);
}
for (const c of comps) if (c.parentId !== null && !ids.has(c.parentId)) err(`${c.id}: unknown parent ${c.parentId}`);

// topology: 3x2 mesh, tile = 3y + x, every tile has a router and an NI
if (arch.tiles.length !== 6) err('expected 6 tiles');
for (const t of arch.tiles) {
  if (t.id !== 3 * t.y + t.x) err(`tile ${t.id}: id is not 3y + x`);
  for (const p of ['r', 'ni']) if (!ids.has(p + t.id)) err(`tile ${t.id}: missing ${p}${t.id}`);
}
const adj = new Map();
const link = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a).add(b); };
for (const e of arch.edges) {
  for (const n of [e.a, e.b]) if (!ids.has(n)) err(`edge to unknown component ${n}`);
  link(e.a, e.b); link(e.b, e.a);
}
const xy = (r) => { const t = arch.tiles.find((q) => 'r' + q.id === r); return t ? [t.x, t.y] : null; };
const mesh = arch.edges.filter((e) => e.kind === 'mesh');
if (mesh.length !== 7) err(`expected 7 mesh links in a 3x2 mesh, found ${mesh.length}`);
for (const e of mesh) { const a = xy(e.a), b = xy(e.b); if (!a || !b || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) err(`mesh link ${e.a}-${e.b} is not between neighbours`); }
for (const t of arch.tiles) if (!(adj.get('ni' + t.id) || new Set()).has('r' + t.id)) err(`ni${t.id} is not connected to r${t.id}`);

// scenarios: every hop is an edge; router hops follow XY (all X moves before any Y move); VC rules; refusals never reach the mesh
const VC = Object.keys(scen.vc);
for (const s of scen.scenarios) {
  for (const r of s.evidenceRefs) if (!evIds.has(r)) err(`scenario ${s.id}: evidence ref ${r} does not resolve`);
  const seen = new Set();
  for (const e of s.events) {
    if (seen.has(e.id)) err(`duplicate event ${e.id}`); seen.add(e.id);
    if (!VC.includes(e.vc)) err(`${e.id}: unknown vc ${e.vc}`);
    if (!['accepted', 'refused', 'rejected'].includes(e.outcome)) err(`${e.id}: bad outcome`);
    for (const n of e.path.concat(e.focus)) if (!ids.has(n)) err(`${e.id}: unknown component ${n}`);
    for (let i = 1; i < e.path.length; i++) if (!(adj.get(e.path[i - 1]) || new Set()).has(e.path[i])) err(`${e.id}: ${e.path[i - 1]} -> ${e.path[i]} is not an edge`);
    const routers = e.path.filter((n) => /^r\d$/.test(n));
    let movedY = false;
    for (let i = 1; i < routers.length; i++) {
      const a = xy(routers[i - 1]), b = xy(routers[i]);
      if (a[1] !== b[1]) movedY = true; else if (movedY) err(`${e.id}: X move after a Y move (not XY routing)`);
    }
    if (routers.length && e.vc === 'local') err(`${e.id}: a local signal cannot cross routers`);
    if (!routers.length && e.vc !== 'local' && e.outcome === 'accepted') err(`${e.id}: accepted network packet that never reaches a router`);
    if (e.outcome === 'refused' && e.path.some((n) => /^(r|ni)\d$/.test(n))) err(`${e.id}: a locally refused request must not enter the network`);
    if (e.outcome === 'rejected' && routers.length) err(`${e.id}: a rejected packet must not reach a router`);
  }
}

// results and public safety
for (const b of res.builds) for (const r of b.evidenceRefs) if (!evIds.has(r)) err(`build ${b.id}: evidence ref ${r} does not resolve`);
for (const c of res.checks.concat(res.comparison.rows)) if (c.ref && !evIds.has(c.ref)) err(`result ref ${c.ref} does not resolve`);
for (const b of res.builds) if (b.currency === 'CURRENT_BUILD' && b.maturity === 'HARDWARE_VALIDATED') err(`build ${b.id}: current build has no board record`);
const total = comps.find((c) => c.id === 'die').metrics.lut;
const top = comps.filter((c) => c.parentId === 'die' && c.type !== 'router').reduce((a, c) => a + (c.metrics.lut || 0), 0) + 10230;
if (top > total) err(`block LUTs (${top}) exceed the design total (${total}): double counting`);
for (const p of comps.filter((c) => c.type === 'cpu')) {
  const kids = comps.filter((c) => c.parentId === p.id).reduce((a, c) => a + (c.metrics.lut || 0), 0);
  if (kids > p.metrics.lut) err(`${p.id}: children LUTs ${kids} exceed parent ${p.metrics.lut}`);
}
const pub = JSON.stringify([arch, scen, evid, res]);
if (/[A-Za-z]:\\\\|vivado_verilog_proj|[0-9a-f]{40}/.test(pub)) err('public data contains a local path or a long hash');

if (errs.length) { console.error('validate:data FAIL\n' + errs.map((e) => ' - ' + e).join('\n')); process.exit(1); }
console.log(`validate:data PASS (${comps.length} components, ${arch.edges.length} edges, ${scen.scenarios.length} scenarios, ${scen.scenarios.reduce((a, s) => a + s.events.length, 0)} events, ${evid.refs.length} evidence refs)`);
