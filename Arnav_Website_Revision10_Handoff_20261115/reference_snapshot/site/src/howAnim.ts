// "Watch it happen": a click-to-play animation on the How it works page. It shows, on a flat view of the six tiles, what
// physically moves: bytes into the hash engine, packets along the copper links, the gate on tile 3 opening and closing,
// memory cells being written, text on the UART and the board LEDs. Routes and LED meanings follow the RTL (see EVIDENCE.md);
// the timing is explanatory, not cycle-accurate. State is a pure function of (step, progress), so seeking is always consistent.

type Pt = [number, number];
type Shape = 'vc0' | 'vc1' | 'vc2' | 'local';
interface Step { title: string; who: string; text: string; why: string; tech: string; dur: number; run(p: number, v: Vis): void }
interface Vis {
  glow(ids: string[]): void; gate(open: boolean): void; cells(n: number): void; uart(s: string, p?: number): void; led(i: number, on: boolean): void;
  rot(s: string): void; meas(n: number): void; packet(path: Pt[], p: number, shape: Shape, end?: 'stop' | 'ok'): void; btn(down: boolean): void; power(on: boolean): void;
}

const NS = 'http://www.w3.org/2000/svg';
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
// geometry: tiles 280 x 150, routers at (tx + 248, ty + 110), NI gates at (tx + 214, ty + 110)
const R = { r0: [288, 150], r1: [588, 150], r2: [888, 150], r3: [288, 320], r4: [588, 320], r5: [888, 320] } as Record<string, Pt>;
const G = { g0: [254, 150], g2: [854, 150], g3: [254, 320], g4: [554, 320] } as Record<string, Pt>;
const CHALLENGE: Pt[] = [[446, 280], [446, 320], G.g4, R.r4, R.r3, G.g3, [204, 320], [204, 278]];
const RESPONSE: Pt[] = [...CHALLENGE].reverse() as Pt[];
const WRITE: Pt[] = [[88, 259], [146, 259], [146, 320], G.g3, R.r3, R.r4, R.r5, R.r2, G.g2, [746, 150], [746, 128]];
const READBACK: Pt[] = [[746, 128], [746, 150], G.g2, R.r2, R.r1, R.r0, R.r3, G.g3, [146, 320], [146, 259], [88, 259]];
const T0_TRY: Pt[] = [[88, 89], [146, 89]];
const T3_TRY: Pt[] = [[88, 259], [146, 259]];
const FORGED: Pt[] = [[696, 259], [790, 259]];
const MEM = ['C0', 'DE', '5A', '5A'];

const STEPS: Step[] = [
  { title: 'Power on', who: 'The board', dur: 2200, text: 'The clock starts and both processors begin running their firmware. LED 3 blinks as a heartbeat.',
    why: 'Nothing is trusted yet: tile 3 cannot use the shared memory.', tech: 'Board 100 MHz oscillator, MMCM to one 50 MHz clock; LED 3 is bit 24 of a counter.',
    run: (p, v) => { v.power(p > 0.05); v.glow(p > 0.3 ? ['cpuA', 'cpuB'] : []); } },
  { title: 'Measure tile 3', who: 'Tile 3 \u00b7 CPU A', dur: 3200, text: 'The start of tile 3\u2019s firmware is read out and turned into a fingerprint.',
    why: 'Any change to the firmware gives a different fingerprint.', tech: 'SHA3-256 over tile ID, configuration and the first 64 bytes of the instruction memory.',
    run: (p, v) => { v.meas(p); v.glow(['cpuA', 'ep']); } },
  { title: 'Challenge', who: 'Tile 4 \u00b7 Root of trust', dur: 2600, text: 'The root of trust asks tile 3 to prove it can be trusted. The question travels one hop, from router 4 to router 3.',
    why: 'A fresh question each time means an old answer cannot be replayed.', tech: '224-bit challenge on virtual channel 2; the link adds a KMAC128 tag and a sequence number.',
    run: (p, v) => { v.rot(p < 1 ? 'challenge sent' : 'waiting for answer'); v.glow(['rot', 'l2']); v.packet(CHALLENGE, ease(p), 'vc2', p >= 1 ? 'ok' : undefined); } },
  { title: 'Response', who: 'Tile 3 \u00b7 CPU A', dur: 2600, text: 'Tile 3 answers with its fingerprint, sealed with a secret key.',
    why: 'Only genuine hardware running the expected firmware can give a correct answer.', tech: 'Measurement plus KMAC128 tag (512-bit payload), back on virtual channel 2.',
    run: (p, v) => { v.rot(p < 1 ? 'checking the answer' : 'answer correct'); v.glow(['ep', 'l2', 'rot']); v.packet(RESPONSE, ease(p), 'vc2', p >= 1 ? 'ok' : undefined); } },
  { title: 'Grant', who: 'Tile 4 \u00b7 Root of trust', dur: 2600, text: 'The answer is correct, so the root of trust grants access. The lock in front of tile 3 opens and LED 0 lights.',
    why: 'From now on tile 3 may use the shared memory.', tech: 'GRANT control packet; LED 0 shows the authorized signal of tile 3.',
    run: (p, v) => { v.rot('access granted'); v.glow(['rot', 'cpuA']); v.packet(CHALLENGE, ease(p), 'vc2', p >= 1 ? 'ok' : undefined); if (p >= 1) { v.gate(true); v.led(0, true); } } },
  { title: 'Write 0xC0DE5A5A', who: 'Tile 3 \u00b7 CPU A', dur: 4200, text: 'Tile 3 writes a value into the shared memory on tile 2. The packet goes right first (3, 4, 5) and then up (to 2).',
    why: 'The memory checks tile 3\u2019s permission at the moment of the write.', tech: 'Memory request on virtual channel 0; XY routing, X before Y.',
    run: (p, v) => { v.glow(['cpuA', 'mem']); v.packet(WRITE, ease(seg(p, 0, 0.8)), 'vc0', p >= 0.8 ? 'ok' : undefined); v.cells(Math.floor(seg(p, 0.8, 1) * 4.99)); } },
  { title: 'Read it back', who: 'Tile 2 \u00b7 Shared memory', dur: 4200, text: 'Tile 3 reads the same address. The value comes back left (2, 1, 0) and then down to tile 3. It matches, so tile 3 prints \u201cT3 PASS\u201d and LED 2 lights.',
    why: 'The trusted path works from end to end.', tech: 'Response on virtual channel 1, so replies never queue behind requests.',
    run: (p, v) => { v.glow(['mem', 'cpuA']); v.packet(READBACK, ease(seg(p, 0, 0.75)), 'vc1', p >= 0.75 ? 'ok' : undefined); if (p > 0.75) v.uart('T3 PASS', seg(p, 0.75, 1)); if (p >= 1) v.led(2, true); } },
  { title: 'Tile 0 is refused', who: 'Tile 0 \u00b7 CPU B', dur: 3000, text: 'Tile 0 tries the same write. It was never trusted, so its own bridge stops the request: nothing reaches the network. It prints \u201cT0 REFUSED\u201d and the RGB LED lights.',
    why: 'An untrusted tile never gets a single packet onto the network.', tech: 'The bridge never raises a request while the tile is not authorized; the processor receives a poison value.',
    run: (p, v) => { v.glow(['cpuB']); v.packet(T0_TRY, ease(seg(p, 0, 0.5)), 'local', p >= 0.5 ? 'stop' : undefined); if (p > 0.5) v.uart('T0 REFUSED', seg(p, 0.5, 0.9)); if (p >= 0.9) v.led(4, true); } },
  { title: 'Revoke', who: 'Tile 4 \u00b7 Root of trust', dur: 4200, text: 'Button 2 is pressed and the root of trust takes tile 3\u2019s access away. The lock closes and LED 0 goes out. Tile 3\u2019s next request is stopped by its own bridge.',
    why: 'Trust can be withdrawn while the chip is running, not only at power-on.', tech: 'REVOKE control packet on the same channel and path as GRANT; button 1 would attest again.',
    run: (p, v) => { v.btn(p > 0.02 && p < 0.18); v.rot('access revoked'); v.glow(['rot', 'cpuA']); if (p < 0.6) v.packet(CHALLENGE, ease(seg(p, 0.08, 0.55)), 'vc2', p >= 0.55 ? 'ok' : undefined);
      if (p >= 0.55) { v.gate(false); v.led(0, false); } if (p >= 0.6) v.packet(T3_TRY, ease(seg(p, 0.6, 0.9)), 'local', p >= 0.9 ? 'stop' : undefined); } },
  { title: 'Forged packet', who: 'Tile 5 \u00b7 Untrusted port', dur: 3000, text: 'A forged packet is pushed in through the untrusted port and rejected by the quarantine. This step is shown in simulation only; on the board the port is tied off.',
    why: 'Fake security messages cannot get into the network.', tech: 'Ingress quarantine in front of the network; forged control packets also fail the link tag and sequence check.',
    run: (p, v) => { v.glow(['spoof', 'quar']); v.packet(FORGED, ease(seg(p, 0, 0.6)), 'vc2', p >= 0.6 ? 'stop' : undefined); } }
];

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element, text?: string) {
  const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v)); if (text !== undefined) e.textContent = text; parent?.appendChild(e); return e; }

export function mountHowAnimation(host: HTMLElement, reduce: boolean, prefix = ''): () => void {
  const P = prefix, q = <T extends Element = HTMLElement>(id: string) => host.querySelector('#' + P + id) as T;
  host.innerHTML = `
    <div class="howbar">
      <p class="howstep" id="${P}howstep" aria-live="polite"></p>
      <div class="howctl">
        <button type="button" id="${P}hprev">Previous</button><button type="button" id="${P}hplay" class="primary">Play</button><button type="button" id="${P}hnext">Next</button><button type="button" id="${P}hrestart">Restart</button>
      </div>
    </div>
    <div class="howsvg" id="${P}howsvg" title="Click the picture, or use Play, to start or pause"></div>
    <div class="howtext" id="${P}howtext" aria-live="polite"></div>
    <ol class="howdots" id="${P}howdots" aria-label="Steps"></ol>
    <p class="muted hownote">Conceptual animation, informed by the RTL: the order of events, the routes and the LED meanings follow the design; timing is simplified and the tile layout is a diagram, not a floorplan.</p>`;
  const svg = el('svg', { viewBox: '0 0 960 470', role: 'img', 'aria-labelledby': `${P}howsvg-t ${P}howsvg-d`, class: 'howart' }, q('howsvg'));
  el('title', { id: P + 'howsvg-t' }, svg, 'What happens inside the chip');
  el('desc', { id: P + 'howsvg-d' }, svg, 'Six tiles on a 3 by 2 mesh with routers and links, the UART text and the board LEDs. Packets move along the links as each step plays.');
  const defs = el('defs', {}, svg);
  const gl = el('filter', { id: P + 'hglow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); el('feGaussianBlur', { stdDeviation: 4, result: 'b' }, gl);
  const fm = el('feMerge', {}, gl); el('feMergeNode', { in: 'b' }, fm); el('feMergeNode', { in: 'SourceGraphic' }, fm);

  // die, links, routers
  el('rect', { x: 20, y: 18, width: 920, height: 362, rx: 10, class: 'h-die' }, svg);
  el('text', { x: 34, y: 37, class: 'h-cap' }, svg, 'design (logical view) · one 50 MHz clock');
  const links = el('g', { class: 'h-links' }, svg);
  for (const [a, b] of [['r0', 'r1'], ['r1', 'r2'], ['r3', 'r4'], ['r4', 'r5'], ['r0', 'r3'], ['r1', 'r4'], ['r2', 'r5']]) el('line', { x1: R[a][0], y1: R[a][1], x2: R[b][0], y2: R[b][1] }, links);
  const tiles: [number, number, number, string][] = [[0, 40, 40, 'Tile 0 · CPU B'], [1, 340, 40, 'Tile 1 · no application'], [2, 640, 40, 'Tile 2 · shared memory'], [3, 40, 210, 'Tile 3 · CPU A'], [4, 340, 210, 'Tile 4 · root of trust'], [5, 640, 210, 'Tile 5 · untrusted port']];
  for (const [i, x, y, name] of tiles) { el('rect', { x, y, width: 280, height: 150, rx: 8, class: 'h-tile' }, svg); el('text', { x: x + 14, y: y + 20, class: 'h-cap' }, svg, name);
    el('line', { x1: x + 214, y1: y + 110, x2: x + 248, y2: y + 110, class: 'h-local' }, svg);
    el('rect', { x: x + 234, y: y + 96, width: 28, height: 28, rx: 4, class: 'h-router' }, svg); el('text', { x: x + 248, y: y + 114, class: 'h-rl' }, svg, 'R' + i); }
  const box = (id: string, x: number, y: number, w: number, h: number, label: string, cls = '') => { const g = el('g', { class: 'h-box ' + cls, 'data-id': id }, svg);
    el('rect', { x, y, width: w, height: h, rx: 5 }, g); el('text', { x: x + w / 2, y: y + h / 2 + 4, class: 'h-bl' }, g, label); return g; };
  box('cpuB', 56, 70, 64, 38, 'CPU B'); box('brB', 124, 70, 44, 38, 'bridge', 'small');
  el('text', { x: 56, y: 132, class: 'h-note' }, svg, 'never authorized');
  box('plain', 356, 70, 180, 58, 'router only', 'dashed');
  box('mem', 656, 70, 180, 26, 'memory front end', 'small');
  const cellT: SVGTextElement[] = [];
  for (let i = 0; i < 4; i++) { el('rect', { x: 656 + i * 45, y: 102, width: 40, height: 26, rx: 3, class: 'h-cell' }, svg); cellT.push(el('text', { x: 676 + i * 45, y: 120, class: 'h-cv' }, svg, '--')); }
  box('cpuA', 56, 240, 64, 38, 'CPU A'); box('brA', 124, 240, 44, 38, 'bridge', 'small'); box('ep', 172, 240, 64, 38, 'attest EP', 'small');
  const imem: SVGRectElement[] = []; for (let i = 0; i < 4; i++) imem.push(el('rect', { x: 56 + i * 16, y: 284, width: 13, height: 12, rx: 2, class: 'h-imem' }, svg));
  el('text', { x: 124, y: 295, class: 'h-note' }, svg, 'IMEM, first 64 B');
  const measT = el('text', { x: 312, y: 230, class: 'h-note', 'text-anchor': 'end' }, svg, '');
  box('rot', 356, 240, 180, 40, 'root of trust'); const rotT = el('text', { x: 446, y: 302, class: 'h-note mid' }, svg, 'idle');
  box('l2', 360, 330, 150, 20, 'L2 link: tiles 3 ↔ 4', 'small ghost');
  box('spoof', 656, 240, 80, 38, 'SPOOF'); box('quar', 744, 240, 92, 38, 'quarantine', 'small');
  el('text', { x: 746, y: 302, class: 'h-note mid' }, svg, 'tied off in the board image');
  // NI gates (locks): tile 3 can open; tile 0 stays shut
  const lock = (x: number, y: number) => { const g = el('g', { class: 'h-lock', transform: `translate(${x - 8} ${y - 9})` }, svg);
    const sh = el('path', { d: 'M3 8 V5 a5 5 0 0 1 10 0 V8', class: 'h-shackle' }, g); el('rect', { x: 0, y: 8, width: 16, height: 11, rx: 2 }, g); return sh; };
  const shA = lock(254, 320); lock(254, 150);
  // board strip: UART terminal, buttons, LEDs
  el('rect', { x: 20, y: 392, width: 430, height: 62, rx: 6, class: 'h-term' }, svg); el('text', { x: 34, y: 412, class: 'h-cap' }, svg, 'UART (switch selects CPU A or B)');
  const uartT = el('text', { x: 34, y: 440, class: 'h-uart' }, svg, '');
  const btn = el('g', { class: 'h-btn' }, svg); el('rect', { x: 470, y: 404, width: 40, height: 40, rx: 6, class: 'h-btnbase' }, btn); const cap = el('circle', { cx: 490, cy: 424, r: 12, class: 'h-btncap' }, btn);
  el('text', { x: 490, y: 462, class: 'h-note mid' }, svg, 'button 2');
  const leds: SVGCircleElement[] = [];
  ([['LD0', 'auth'], ['LD1', 'fail'], ['LD2', 'T3 pass'], ['LD3', 'beat'], ['RGB', 'T0 ref.']] as const).forEach(([n, m], i) => { const x = 560 + i * 76;
    leds.push(el('circle', { cx: x, cy: 418, r: 9, class: 'h-led' }, svg)); el('text', { x, y: 444, class: 'h-note mid' }, svg, n); el('text', { x, y: 459, class: 'h-note mid dim' }, svg, m); });
  // packet layer
  const trail = el('polyline', { class: 'h-trail', points: '' }, svg);
  const pk = el('g', { class: 'h-pk', filter: `url(#${P}hglow)` }, svg);
  const stopG = el('g', { class: 'h-stop' }, svg); el('polygon', { points: '-6,-14 6,-14 14,-6 14,6 6,14 -6,14 -14,6 -14,-6' }, stopG); el('line', { x1: -9, y1: 9, x2: 9, y2: -9 }, stopG);
  const okRing = el('circle', { r: 12, class: 'h-ok' }, svg);
  const shapeOf: Record<Shape, string> = { vc0: '<rect x="-9" y="-6" width="18" height="12" rx="1"/>', vc1: '<rect x="-11" y="-6" width="22" height="12" rx="6"/>', vc2: '<rect x="-7" y="-7" width="14" height="14" transform="rotate(45)"/>', local: '<circle r="5"/>' };
  const dash: Record<Shape, string> = { vc0: 'none', vc1: '10 5', vc2: '3 4', local: '1 5' };

  const boxes = new Map([...svg.querySelectorAll<SVGGElement>('.h-box')].map((b) => [b.dataset.id!, b]));
  let powered = false, beat = true;
  const vis: Vis = {
    glow: (ids) => boxes.forEach((b, id) => b.classList.toggle('on', ids.includes(id))),
    gate: (open) => shA.setAttribute('transform', open ? 'translate(-6 -3) rotate(-28 13 8)' : ''),
    cells: (n) => cellT.forEach((t, i) => { t.textContent = i < n ? MEM[i] : '--'; t.classList.toggle('set', i < n); }),
    uart: (s, p = 1) => { uartT.textContent = '> ' + s.slice(0, Math.round(s.length * p)); },
    led: (i, on) => leds[i].classList.toggle('lit', on),
    rot: (s) => { rotT.textContent = s; },
    meas: (p) => { imem.forEach((r, i) => r.classList.toggle('lit', p > 0.1 + i * 0.18)); measT.textContent = p >= 0.85 ? 'SHA3-256 done' : p > 0.1 ? 'hashing…' : ''; },
    packet: (path, p, shape, end) => { const pts = path.map((q) => q.join(',')).join(' '); trail.setAttribute('points', pts); trail.style.strokeDasharray = dash[shape]; trail.style.display = '';
      const L = path.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - path[i][0], q[1] - path[i][1]), 0); let d = p * L, i = 1;
      while (i < path.length - 1 && d > Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])) { d -= Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); i++; }
      const a = path[i - 1], b = path[i], sl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, x = a[0] + ((b[0] - a[0]) * Math.min(d, sl)) / sl, y = a[1] + ((b[1] - a[1]) * Math.min(d, sl)) / sl;
      pk.innerHTML = shapeOf[shape]; pk.setAttribute('transform', `translate(${x} ${y})`); pk.style.display = end === 'stop' ? 'none' : '';
      const last = path[path.length - 1]; stopG.style.display = end === 'stop' ? '' : 'none'; stopG.setAttribute('transform', `translate(${last[0]} ${last[1] - 2})`);
      okRing.style.display = end === 'ok' ? '' : 'none'; okRing.setAttribute('cx', String(last[0])); okRing.setAttribute('cy', String(last[1])); host.dataset.pkx = String(Math.round(x)); host.dataset.pky = String(Math.round(y)); },
    btn: (down) => cap.setAttribute('r', down ? '9' : '12'),
    power: (on) => { powered = on; leds[3].classList.toggle('lit', on && beat); }
  };
  function reset() { vis.glow([]); vis.gate(false); vis.cells(0); vis.uart(''); leds.forEach((l) => l.classList.remove('lit')); vis.rot('idle'); vis.meas(0); vis.btn(false); powered = false;
    trail.style.display = pk.style.display = stopG.style.display = okRing.style.display = 'none'; }

  const st = { i: 0, p: reduce ? 1 : 0, playing: false };
  function render() { reset(); for (let k = 0; k < st.i; k++) STEPS[k].run(1, vis);
    trail.style.display = pk.style.display = stopG.style.display = okRing.style.display = 'none';   // a packet belongs to its own step only
    STEPS[st.i].run(Math.min(st.p, 1), vis); if (powered) leds[3].classList.toggle('lit', beat);
    const S = STEPS[st.i]; q('howstep').textContent = `Step ${st.i + 1} of ${STEPS.length} · ${S.title}`;
    q('howtext').innerHTML = `<p class="hwho">${S.who}</p><p class="hwhat">${S.text}</p><p class="hwhy"><b>Why it matters:</b> ${S.why}</p><p class="htech">${S.tech}</p>`;
    host.querySelectorAll('#' + P + 'howdots button').forEach((b, k) => b.setAttribute('aria-current', k === st.i ? 'step' : 'false'));
    q('hplay').textContent = st.playing ? 'Pause' : st.i === STEPS.length - 1 && st.p >= 1 ? 'Play again' : 'Play';
    host.dataset.step = String(st.i); host.dataset.cells = cellT.map((t) => t.textContent).join(' '); host.dataset.uart = uartT.textContent ?? ''; host.dataset.gate = shA.getAttribute('transform') ? 'open' : 'closed'; }
  q('howdots').innerHTML = STEPS.map((s, k) => `<li><button type="button" data-k="${k}">${k + 1}. ${s.title}</button></li>`).join('');
  let raf = 0, last = 0, hb = 0;
  function loop(now: number) { const dt = Math.min(now - last, 80); last = now;
    hb += dt; if (hb > 335) { hb = 0; beat = !beat; if (powered && !reduce) leds[3].classList.toggle('lit', beat); }
    if (st.playing) { st.p += dt / STEPS[st.i].dur;
      if (st.p >= 1.35) { if (st.i < STEPS.length - 1) { st.i++; st.p = 0; } else { st.p = 1; st.playing = false; } }
      render(); }
    raf = requestAnimationFrame(loop); }
  const go = (i: number, play: boolean) => { st.i = Math.max(0, Math.min(STEPS.length - 1, i)); st.p = reduce || !play ? 1 : 0; st.playing = play && !reduce; render(); };
  const toggle = () => { if (reduce) { go(st.i + 1 < STEPS.length ? st.i + 1 : 0, false); return; }
    if (!st.playing && st.i === STEPS.length - 1 && st.p >= 1) { go(0, true); return; } st.playing = !st.playing; if (st.playing && st.p >= 1) { st.p = 1; } render(); };
  q('hplay').addEventListener('click', toggle);
  q('howsvg').addEventListener('click', toggle);
  q('hnext').addEventListener('click', () => go(st.i + 1, false));
  q('hprev').addEventListener('click', () => go(st.i - 1, false));
  q('hrestart').addEventListener('click', () => go(0, true));
  q('howdots').addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-k]'); if (b) go(+b.dataset.k!, true); });
  go(0, true); last = performance.now(); raf = requestAnimationFrame(loop);
  (host as unknown as { __how: unknown }).__how = { go, st, render };
  return () => cancelAnimationFrame(raf);
}
