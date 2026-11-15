import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { build, byId, components, edges, fmt, scenarios, type Component, type Ev, type VcId } from './model';

// Coordinate system, declared once: +X = mesh x, +Z = mesh y (row y=1 is nearer the default camera), +Y = up.
// Units are arbitrary; the die top is y = 0. Block footprints: area = LUT x build.areaConstant.
// Every block is drawn as a surface-mount part (conceptual): routers and logic as QFN / gull-wing packages, the security
// blocks as ceramic packages with gold lids, the CPU tiles as small modules carrying their sub-blocks.
const C = { charcoal: 0x1b1e23, raised: 0x272b32, sand: 0xe8dcc6, blue: 0x4d94ff };
const PY = 2.3;

export interface LedState { auth: boolean; led: string }
export interface SceneApi {
  select(id: string | null): void; setFocus(ids: string[]): void; setView(name: string, instant?: boolean): void; stepCamera(dir: string): void;
  showEvent(ev: Ev | null, t: number): void; setLabels(on: boolean): void; setLogical(on: boolean): void; setLeds(s: LedState): void; focusTile(t: number | null, fly?: boolean): void;
  onPick(cb: (id: string | null) => void): void; onHover(cb: (id: string | null, x: number, y: number) => void): void;
  screenOf(id: string): { x: number; y: number } | null; pickAt(x: number, y: number): string | null; info(): { calls: number; triangles: number }; ok: boolean;
}

function rnd(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function tex(c: HTMLCanvasElement, srgb = true, rx = 1, ry = 1) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
function canvas(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); return c; }
const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) * 0.98);

// ------------------------------------------------------------------ procedural textures
const noise = canvas(128, 128, (g) => { const r = rnd(5), im = g.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = 120 + Math.floor(r() * 90); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); });
const routing = canvas(256, 256, (g) => { const r = rnd(7); g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 170; i++) { const v = 150 + Math.floor(r() * 105); g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + Math.floor(r() * 2);
    const x = Math.floor(r() * 32) * 8 + 4, y = Math.floor(r() * 32) * 8 + 4, L = 16 + Math.floor(r() * 12) * 8; g.beginPath(); g.moveTo(x, y); if (r() < 0.5) g.lineTo(x + L, y); else g.lineTo(x, y + L); g.stroke(); }
  for (let k = 0; k < 90; k++) { g.fillStyle = r() < 0.5 ? '#f4f4f4' : '#8f8f8f'; g.fillRect(Math.floor(r() * 32) * 8 + 2, Math.floor(r() * 32) * 8 + 2, 4, 4); } });
const cells = canvas(256, 256, (g) => { const r = rnd(11); g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, 256, 256);        // standard-cell rows for the die surface
  for (let y = 0; y < 256; y += 8) { g.fillStyle = y % 16 ? '#8c939b' : '#a7adb4'; g.fillRect(0, y, 256, 7);
    for (let x = 0; x < 256;) { const w = 3 + Math.floor(r() * 12); g.fillStyle = `rgb(${130 + Math.floor(r() * 60)},${136 + Math.floor(r() * 60)},${146 + Math.floor(r() * 60)})`; g.fillRect(x, y + 1, w - 1, 5); x += w; } } });
/** Board: solder mask over copper (lighter where traces run under the mask), gold pads, vias, sand silkscreen outlines. */
const W = 1536, H = 1024, U = (x: number) => ((x + 75) / 150) * W, V = (z: number) => ((z + 50) / 100) * H, S = W / 150;
const PARTS: [number, number, number, number][] = [[-58, -34, 6, 4], [-60, 38, 4.4, 4.4], [-50, 38, 4.4, 4.4], [-40, 38, 2.8, 4.6], [58, -32, 7, 5.2],
  [40, 38, 2, 1.3], [45, 38, 2, 1.3], [50, 38, 2, 1.3], [55, 38, 2, 1.3], [62, 38, 3.2, 3.2]];
const pcb = canvas(W, H, (g) => { const r = rnd(23); g.fillStyle = '#1f2328'; g.fillRect(0, 0, W, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 110; i++) { g.strokeStyle = r() < 0.7 ? '#272c33' : '#2c323a'; g.lineWidth = 3 + Math.floor(r() * 5);
    const x = r() * W, y = r() * H, a = 60 + r() * 300, b = 40 + r() * 120, s = r() < 0.5 ? b : -b;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + a, y); g.lineTo(x + a + b, y + s); g.lineTo(x + a + b + a * 0.7, y + s); g.stroke(); }
  // escape routing out from under the package
  for (let k = 0; k < 40; k++) { const z = -26 + k * 1.33; g.strokeStyle = '#2a3038'; g.lineWidth = 3; g.beginPath(); g.moveTo(U(39), V(z)); g.lineTo(U(46 + (k % 5) * 2), V(z)); g.lineTo(U(52 + (k % 7) * 3), V(z + (k % 2 ? 3 : -3))); g.stroke();
    g.beginPath(); g.moveTo(U(-39), V(z)); g.lineTo(U(-48 - (k % 6) * 2), V(z)); g.stroke(); }
  for (let k = 0; k < 260; k++) { const px = r() * W, py = r() * H; g.fillStyle = '#b89c5e'; g.beginPath(); g.arc(px, py, 4.2, 0, 6.3); g.fill(); g.fillStyle = '#0d0f12'; g.beginPath(); g.arc(px, py, 1.7, 0, 6.3); g.fill(); }
  // keep the package area clean (the package sits there)
  g.fillStyle = '#1f2328'; g.fillRect(U(-40), V(-29), 80 * S, 58 * S);
  for (const [x, z, w, d] of PARTS) { g.strokeStyle = '#d6c9ae'; g.lineWidth = 2.2; g.strokeRect(U(x - w / 2 - 0.9), V(z - d / 2 - 0.9), (w + 1.8) * S, (d + 1.8) * S);
    g.fillStyle = '#c7a866'; g.fillRect(U(x - w / 2 - 0.5), V(z - d / 2 - 0.5), (w + 1) * S, 0.5 * S); g.fillRect(U(x - w / 2 - 0.5), V(z + d / 2), (w + 1) * S, 0.5 * S); }
  g.strokeStyle = '#d6c9ae'; g.lineWidth = 2.5; g.strokeRect(U(-40.5), V(-29.5), 81 * S, 59 * S);
  g.beginPath(); g.moveTo(U(-40.5), V(25)); g.lineTo(U(-36), V(29.5)); g.stroke(); });                         // pin-1 corner of the package outline

export function createScene(host: HTMLElement, labelLayer: HTMLElement, reduce: boolean): SceneApi {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return { ok: false } as SceneApi; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1.6, 1, 900);
  const ctl = new OrbitControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = 0.09; ctl.minDistance = 12; ctl.maxDistance = 240; ctl.screenSpacePanning = true;
  let dirty = true, camMoved = true; ctl.addEventListener('change', () => { dirty = camMoved = true; });

  // light: a studio environment for reflections, one shadow-casting key light, a cool fill
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xf2ead8, 0x15181c, 0.35));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(52, 96, 40); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -90, right: 90, top: 62, bottom: -62, near: 20, far: 260 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4; scene.add(key);
  const fill = new THREE.DirectionalLight(0xa9c6f5, 0.55); fill.position.set(-70, 36, -50); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(-20, 20, 90); scene.add(rim);

  // materials
  const nTex = tex(noise, false, 3, 3);
  const mold = (color: number) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, roughnessMap: nTex, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.55, emissive: C.blue, emissiveIntensity: 0 });
  const ceramic = () => new THREE.MeshPhysicalMaterial({ color: 0xe4d8c0, roughness: 0.72, roughnessMap: nTex, metalness: 0, sheen: 0.3, emissive: C.blue, emissiveIntensity: 0 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xd9b56c, roughness: 0.26, metalness: 1 });
  const goldLid = () => new THREE.MeshStandardMaterial({ color: 0xd4b06a, roughness: 0.3, roughnessMap: nTex, metalness: 1, emissive: C.blue, emissiveIntensity: 0 });
  const tin = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.32, metalness: 1 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc3c6ca, roughness: 0.22, roughnessMap: nTex, metalness: 1 });
  const traceM = new THREE.MeshStandardMaterial({ color: 0xd2b98a, roughness: 0.3, metalness: 1 });

  const deco = new THREE.Group(); scene.add(deco);           // package and board (hidden in the logical view)
  const bd = new THREE.Group(); deco.add(bd);                // board and its parts (hidden when the camera is below the board)
  const chips = new THREE.Group(); scene.add(chips);         // leads, lids, markings of the logical blocks
  const picks: THREE.Object3D[] = []; const mesh = new Map<string, THREE.Mesh>();
  const glow = new Map<string, { ms: THREE.MeshStandardMaterial[]; g: number; t: number }>(); const subs: THREE.Mesh[] = [];
  const put = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
  const tmp = new THREE.Object3D();
  const inst = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, list: number[][], shadow = false) => { if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => { tmp.position.set(p[0], p[1], p[2]); tmp.rotation.set(0, p[3] || 0, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix); });
    m.instanceMatrix.needsUpdate = true; m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
  // lead shapes, local +x pointing away from the body, foot at y = 0
  const gullGeo = mergeGeometries([new THREE.BoxGeometry(0.24, 0.07, 0.17).translate(0.12, 0.4, 0), new THREE.BoxGeometry(0.07, 0.4, 0.17).translate(0.27, 0.2, 0), new THREE.BoxGeometry(0.32, 0.07, 0.17).translate(0.42, 0.035, 0)])!;
  const padGeo = new THREE.BoxGeometry(0.36, 0.06, 0.2).translate(0.05, 0.03, 0);
  const castGeo = mergeGeometries([new THREE.BoxGeometry(0.06, 0.62, 0.3).translate(0.03, 0.31, 0), new THREE.BoxGeometry(0.42, 0.04, 0.32).translate(0.12, 0.02, 0)])!;
  /** Lead positions around a body: sides 'x' = leads on the +x/-x faces, 'z' = on +z/-z, 'all' = four sides. */
  function ring(list: number[][], cx: number, cz: number, w: number, d: number, y: number, pitch: number, sides: 'x' | 'z' | 'all', inset = 0.45) {
    const span = (len: number) => { const n = Math.max(2, Math.floor((len - 2 * inset) / pitch) + 1), o = ((n - 1) * pitch) / 2; return Array.from({ length: n }, (_, i) => -o + i * pitch); };
    if (sides !== 'z') for (const s of span(d)) { list.push([cx + w / 2, y, cz + s, 0], [cx - w / 2, y, cz + s, Math.PI]); }
    if (sides !== 'x') for (const s of span(w)) { list.push([cx + s, y, cz + d / 2, -Math.PI / 2], [cx + s, y, cz - d / 2, Math.PI / 2]); } }
  /** Laser marking on a package top: text lines plus a pin-1 dimple; redrawn once the web font has loaded. */
  const marks: { c: HTMLCanvasElement; t: THREE.CanvasTexture; lines: string[]; dark: boolean }[] = [];
  function drawMark(m: (typeof marks)[number]) { const g = m.c.getContext('2d')!, w = m.c.width, h = m.c.height; g.clearRect(0, 0, w, h);
    g.fillStyle = m.dark ? 'rgba(52,44,30,0.55)' : 'rgba(232,220,198,0.16)'; g.beginPath(); g.arc(w * 0.1, h * 0.14, Math.min(w, h) * 0.05, 0, 6.3); g.fill();
    const fs = Math.min(h / (m.lines.length * 1.7 + 0.6), (w * 0.82) / Math.max(...m.lines.map((l) => l.length * 0.62)));
    g.fillStyle = m.dark ? 'rgba(48,40,26,0.78)' : 'rgba(232,220,198,0.74)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    m.lines.forEach((l, i) => { g.font = `${i ? 400 : 500} ${(i ? 0.8 : 1) * fs}px "IBM Plex Mono", ui-monospace, monospace`; g.fillText(l, w / 2, h / 2 + (i - (m.lines.length - 1) / 2) * fs * 1.45); });
    m.t.needsUpdate = true; }
  function mark(parent: THREE.Object3D, lines: string[], w: number, d: number, y: number, dark = false) {
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.max(64, Math.round((512 * d) / w));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const m = { c, t, lines, dark }; marks.push(m); drawMark(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
    p.rotation.x = -Math.PI / 2; p.position.y = y; parent.add(p); return p; }
  document.fonts?.ready.then(() => { marks.forEach(drawMark); dirty = true; });

  // ------------------------------------------------------------------ board, package, die
  const g = (id: string) => byId.get(id)!.geometry as Required<Component['geometry']>;
  const maskM = new THREE.MeshPhysicalMaterial({ map: tex(pcb), roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28, metalness: 0 });
  const coreM = new THREE.MeshStandardMaterial({ color: 0x6f6553, roughness: 0.9 });
  const boardM = put(bd, new THREE.BoxGeometry(g('board').w, g('board').h, g('board').d), [coreM, coreM, maskM, coreM, coreM, coreM], 0, -2.3 - g('board').h / 2, 0);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: 0.45 })); catcher.rotation.x = -Math.PI / 2; catcher.position.y = -3.72; catcher.receiveShadow = true; bd.add(catcher);
  const pkgM = put(deco, rbox(g('pkg').w, g('pkg').h, g('pkg').d, 0.45), new THREE.MeshPhysicalMaterial({ color: 0x343a2f, map: tex(routing, true, 10, 7), roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4 }), 0, -0.5 - g('pkg').h / 2, 0);
  put(deco, rbox(61.4, 0.34, 41.4, 0.17), new THREE.MeshStandardMaterial({ color: 0x8a7d63, roughness: 0.85 }), 0, -0.5 + 0.12, 0, false);   // underfill fillet
  const dieM = put(scene, rbox(g('die').w, g('die').h, g('die').d, 0.12), new THREE.MeshPhysicalMaterial({ color: 0x1a1f27, map: tex(cells, true, 26, 18), roughness: 0.2, metalness: 0.65,
    iridescence: 0.22, iridescenceIOR: 1.5, iridescenceThicknessRange: [300, 420], clearcoat: 0.6, clearcoatRoughness: 0.12 }), 0, -g('die').h / 2, 0);
  for (const [id, m] of [['board', boardM], ['pkg', pkgM], ['die', dieM]] as const) { m.userData = { id, top: m.position.y + 0.25 }; picks.push(m); mesh.set(id, m); }
  boardM.userData.top = -2.3; pkgM.userData.top = -0.5; dieM.userData.top = 0;
  // seal ring and pin-1 mark on the die, fiducials and the package pin-1 mark
  put(scene, mergeGeometries([new THREE.BoxGeometry(58.6, 0.04, 0.3).translate(0, 0, 19.3), new THREE.BoxGeometry(58.6, 0.04, 0.3).translate(0, 0, -19.3), new THREE.BoxGeometry(0.3, 0.04, 38.9).translate(29.15, 0, 0), new THREE.BoxGeometry(0.3, 0.04, 38.9).translate(-29.15, 0, 0)])!, goldM, 0, 0.02, 0, false);
  { const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(3.4, 0), new THREE.Vector2(0, 3.4)]); const m = put(deco, new THREE.ShapeGeometry(tri), goldM, -38.4, -0.49, 27.4, false); m.rotation.x = -Math.PI / 2; m.scale.set(1, -1, 1); }
  inst(deco, new THREE.CylinderGeometry(0.55, 0.55, 0.03, 20), goldM, [[-36.5, -0.485, -25.5], [36.5, -0.485, -25.5], [36.5, -0.485, 25.5]]);
  // 324 solder balls (18 x 18, as in csg324), slightly collapsed between package and board
  { const balls: number[][] = []; for (let i = 0; i < 18; i++) for (let j = 0; j < 18; j++) balls.push([-34 + i * 4, -1.9, -24.2 + j * 2.85]);
    const b = inst(deco, new THREE.SphereGeometry(0.62, 14, 8).scale(1, 0.68, 1), tin, balls)!; b.userData.id = 'pkg'; picks.push(b); }
  // decoupling capacitors on the package (die side) and on the board
  const capBody: number[][] = [], capEnd: number[][] = [], bCapBody: number[][] = [], bCapEnd: number[][] = [], resBody: number[][] = [], resEnd: number[][] = [];
  const passive = (body: number[][], end: number[][], x: number, y: number, z: number, rot: number, half: number) => { body.push([x, y, z, rot]); const dx = Math.cos(rot) * half, dz = -Math.sin(rot) * half; end.push([x + dx, y, z + dz, rot], [x - dx, y, z - dz, rot]); };
  for (const z of [-15, -5, 5, 15]) { passive(capBody, capEnd, 34.6, -0.5, z, Math.PI / 2, 0.62); passive(capBody, capEnd, -34.6, -0.5, z, Math.PI / 2, 0.62); }
  for (const x of [-24, -8, 8, 24]) { passive(capBody, capEnd, x, -0.5, 24.6, 0, 0.62); passive(capBody, capEnd, x, -0.5, -24.6, 0, 0.62); }
  for (const [x, z, r] of [[-46, -18, 1], [-46, -8, 1], [-46, 4, 1], [-46, 14, 1], [46, -14, 1], [46, -4, 1], [46, 8, 1], [46, 18, 1], [-20, -34, 0], [-6, -34, 0], [10, -34, 0], [24, -34, 0], [-14, 34, 0], [4, 34, 0], [-52, -28, 0], [50, -26, 1]])
    passive(bCapBody, bCapEnd, x, -2.3, z, r ? Math.PI / 2 : 0, 1.05);
  for (let L = 0; L < 5; L++) passive(resBody, resEnd, 40 + L * 5 + (L === 4 ? 2 : 0), -2.3, 33.4, 0, 0.62);                                   // LED series resistors
  for (const z of [-28.4, -35.6]) for (const x of [52, 55, 61, 64]) passive(resBody, resEnd, x, -2.3, z, 0, 0.62);                       // around the UART bridge
  const capMat = new THREE.MeshStandardMaterial({ color: 0x9c8767, roughness: 0.7 }), resMat = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.55 });
  inst(deco, rbox(1.0, 0.5, 0.62, 0.08).translate(0, 0.25, 0), capMat, capBody); inst(deco, rbox(0.26, 0.54, 0.66, 0.06).translate(0, 0.27, 0), tin, capEnd);
  inst(bd, rbox(1.6, 0.8, 1.0, 0.1).translate(0, 0.4, 0), capMat, bCapBody, true); inst(bd, rbox(0.42, 0.84, 1.04, 0.08).translate(0, 0.42, 0), tin, bCapEnd);
  inst(bd, rbox(1.0, 0.42, 0.62, 0.06).translate(0, 0.21, 0), resMat, resBody); inst(bd, rbox(0.26, 0.45, 0.64, 0.05).translate(0, 0.225, 0), tin, resEnd);

  // board parts named by the design: 100 MHz oscillator, buttons 1 and 2, switch, LEDs, UART bridge
  const boardGull: number[][] = []; const T = -2.3;
  put(bd, rbox(6, 0.7, 4, 0.25), new THREE.MeshStandardMaterial({ color: 0xd9ccb2, roughness: 0.75 }), -58, T + 0.35, -34);              // crystal oscillator: ceramic base
  put(bd, rbox(5.5, 0.75, 3.5, 0.45), steel, -58, T + 0.95, -34);                                                                       //   seam-welded metal lid
  const blackP = new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.5 });
  const btnCaps: THREE.Mesh[] = [];
  for (const x of [-60, -50]) { put(bd, rbox(4.4, 0.9, 4.4, 0.18), blackP, x, T + 0.45, 38); put(bd, rbox(4.5, 0.12, 4.5, 0.05), steel, x, T + 0.96, 38);
    btnCaps.push(put(bd, new THREE.CylinderGeometry(1.15, 1.25, 0.9, 32), blackP, x, T + 1.45, 38)); ring(boardGull, x, 38, 4.4, 4.4, T, 3.0, 'x', 0.7); }
  put(bd, rbox(2.8, 1.1, 4.6, 0.2), blackP, -40, T + 0.55, 38); put(bd, rbox(2.9, 0.1, 4.7, 0.04), steel, -40, T + 1.13, 38);              // slide switch
  put(bd, rbox(1.3, 0.7, 1.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xd9ccb2, roughness: 0.6 }), -40, T + 1.5, 37.3); ring(boardGull, -40, 38, 2.8, 4.6, T, 1.6, 'x', 0.7);
  const ledLens: THREE.MeshPhysicalMaterial[] = [];
  const ledAt: [number, number, number][] = [[40, 2, 1.3], [45, 2, 1.3], [50, 2, 1.3], [55, 2, 1.3], [62, 3.2, 3.2]];
  for (const [x, w, d] of ledAt) { put(bd, rbox(w, 0.45, d, 0.08), new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: 0.5 }), x, T + 0.22, 38);
    const lens = new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: 0.08, transmission: 0, transparent: true, opacity: 0.72, clearcoat: 1, emissive: C.blue, emissiveIntensity: 0 });
    ledLens.push(lens); put(bd, rbox(w * 0.8, 0.5, d * 0.8, 0.22), lens, x, T + 0.66, 38, false);
    put(bd, new THREE.BoxGeometry(0.4, 0.06, 0.4), goldM, x, T + 0.5, 38, false); }
  put(bd, rbox(7, 1.1, 5.2, 0.12), mold(0x16181b), 58, T + 0.67, -32); ring(boardGull, 58, -32, 7, 5.2, T, 0.65, 'z', 0.5);                // UART bridge (SSOP-style)
  mark(bd, ['USB-UART'], 6, 4, T + 1.23);
  inst(bd, gullGeo, tin, boardGull);

  // ------------------------------------------------------------------ logical blocks as surface-mount parts
  type Style = 'qfn' | 'sot' | 'module' | 'chip' | 'ceramic' | 'tsop' | 'header' | 'footprint' | 'can';
  const styleOf = (c: Component): Style => c.id === 'bram' ? 'tsop' : c.id === 'spoof' ? 'header' : ({ router: 'qfn', ni: 'sot', cpu: 'module', sub: 'chip', crypto: 'ceramic', mem: 'qfn', untrusted: 'qfn', plain: 'footprint', clock: 'can' } as Record<string, Style>)[c.type] ?? 'qfn';
  const HGT: Record<Style, number> = { qfn: 0.95, sot: 0.55, module: 0.45, chip: 0.5, ceramic: 1.05, tsop: 0.85, header: 0.95, footprint: 0.05, can: 0.4 };
  const STAND: Record<Style, number> = { qfn: 0.05, sot: 0.12, module: 0.02, chip: 0.04, ceramic: 0, tsop: 0.12, header: 0.02, footprint: 0, can: 0 };
  const SUBNAME: Record<string, string> = { core: 'PicoRV32', mem: 'IMEM DMEM', meas: 'MEAS 64 B', bridge: 'TMEM BRIDGE' };
  const markOf = (c: Component): string[] => {
    const lut = c.metrics.lut !== undefined ? fmt(c.metrics.lut) + ' LUT' : '';
    switch (c.id) { case 'endp': return ['PQ-ATTEST', 'SHA3 KMAC', lut]; case 'l2': return ['L2 AUTH LINK', 'KMAC128', lut]; case 'ver': return ['RoT VERIFIER', 'T4', lut];
      case 'bram': return ['SHARED MEM', 'T2 BRAM x4']; case 'memfe': return ['MEM FRONT END']; case 'quar': return ['QUARANTINE']; case 'mmcm': return ['MMCM', '100>50 MHz']; }
    if (c.type === 'router') return [c.id.toUpperCase(), 'XY 5-PORT'];
    if (c.type === 'sub') return [SUBNAME[c.id.split('.')[1]] ?? c.name];
    return []; };
  const gull: number[][] = [], pads: number[][] = [], casts: number[][] = [], pins: number[][] = [];
  const tint: Record<string, number> = { router: 0x23272d, ni: 0x2b2f35, mem: 0x22262b, untrusted: 0x2c2722, sub: 0x1d2025 };
  const K = build.areaConstant;
  function block(c: Component, w: number, d: number, x: number, z: number, base: number) {
    const st = styleOf(c), h = HGT[st], y0 = base + STAND[st], ms: THREE.MeshStandardMaterial[] = [];
    let mat: THREE.MeshStandardMaterial;
    if (st === 'ceramic' || st === 'can') mat = ceramic();
    else if (st === 'module') mat = new THREE.MeshPhysicalMaterial({ color: 0x252a2e, map: tex(routing, true, w / 3, d / 3), roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3, emissive: C.blue, emissiveIntensity: 0 });
    else if (st === 'footprint') mat = new THREE.MeshStandardMaterial({ color: 0x1f2328, map: tex(canvas(256, 192, (q) => { q.fillStyle = '#2a2f36'; q.fillRect(0, 0, 256, 192);
      q.fillStyle = '#c9ccd0'; for (let i = 0; i < 7; i++) { q.fillRect(28 + i * 30, 14, 14, 22); q.fillRect(28 + i * 30, 156, 14, 22); } q.fillRect(78, 62, 100, 68);
      q.strokeStyle = '#d6c9ae'; q.lineWidth = 3; q.strokeRect(8, 6, 240, 180); q.fillStyle = '#d6c9ae'; q.font = '500 22px "IBM Plex Mono", monospace'; q.textAlign = 'center'; q.fillText('NO PART', 128, 104); })), roughness: 0.6, emissive: C.blue, emissiveIntensity: 0 });
    else mat = mold(st === 'header' ? 0x121416 : tint[c.type] ?? 0x23272d);
    ms.push(mat);
    const m = put(scene, rbox(w, h, d, st === 'footprint' ? 0.02 : Math.min(0.16, h * 0.3)), mat, x, y0 + h / 2, z); m.userData = { id: c.id, top: y0 + h, base, w, d };   // RoundedBoxGeometry reports 1 x 1 x 1 in .parameters, so keep the size here
    let extra = 0;
    if (st === 'ceramic') { const lm = goldLid(); ms.push(lm); const lid = put(m, rbox(w * 0.8, 0.1, d * 0.8, 0.05), lm, 0, h / 2 + 0.05, 0); extra = 0.1;
      mark(lid, markOf(c), w * 0.7, d * 0.7, 0.051, true); ring(casts, x, z, w, d, base, 0.95, 'all', 0.55); }
    else if (st === 'can') { put(m, rbox(w * 0.86, 0.6, d * 0.86, 0.28), steel, 0, h / 2 + 0.3, 0); extra = 0.6; mark(m, markOf(c), w * 0.7, d * 0.7, h / 2 + 0.601, true); }
    else if (st === 'header') { for (let i = 0; i < 4; i++) for (const s of [-1, 1]) pins.push([x - 1.5 + i, y0 + h, z + s * 0.5]); extra = 0.9; }
    else if (st !== 'footprint' && st !== 'module') { const ml = markOf(c); if (ml.length) mark(m, ml, w * 0.86, d * 0.86, h / 2 + 0.006); }
    if (st === 'qfn') ring(pads, x, z, w, d, base, 0.55, 'all', 0.45);
    if (st === 'sot') ring(gull, x, z, w, d, base, 0.7, 'z', 0.4);
    if (st === 'tsop') ring(gull, x, z, w, d, base, 0.55, 'z', 0.5);
    if (st === 'module') ring(casts, x, z, w, d, base, 0.8, 'all', 0.5);
    m.userData.labelY = y0 + h + extra + 1.0;
    mesh.set(c.id, m); picks.push(m); glow.set(c.id, { ms, g: 0, t: 0 }); return m; }
  for (const c of components) { if (['board', 'package', 'die', 'sub'].includes(c.type)) continue;
    const ge = c.geometry, lut = c.metrics.lut ?? c.metrics.lutShare, side = lut ? Math.sqrt(lut * K) : 3;
    block(c, ge.w ?? side, ge.d ?? side, ge.x ?? 0, ge.z ?? 0, 0); }
  for (const c of components.filter((q) => q.type === 'sub')) { const p = mesh.get(c.parentId!)!, pw = p.userData.w as number, pd = p.userData.d as number, s = c.geometry.slot ?? 0;
    // slots 0 and 1 sit on the side of the tile that faces its network interface
    const front = byId.get(c.parentId!)!.tileId === 3 ? -1 : 1, col = s % 2, row = s < 2 ? front : -front;
    const m = block(c, pw * 0.4, pd * 0.4, p.position.x + (col ? 1 : -1) * pw * 0.24, p.position.z + row * pd * 0.24, p.userData.top); subs.push(m); m.userData.y0 = m.position.y; m.userData.lift = 0; }
  inst(chips, gullGeo, tin, gull); inst(chips, padGeo, tin, pads); inst(chips, castGeo, goldM, casts); inst(chips, new THREE.BoxGeometry(0.26, 1.7, 0.26).translate(0, 0.25, 0), goldM, pins);
  for (const c of components) { const m = mesh.get(c.id); if (m && m.userData.labelY === undefined) m.userData.labelY = m.userData.top + 1.0; }

  // traces on the die: each mesh link as a three-line bus, every other connection as one trace; merged into one draw call
  const P = (id: string) => mesh.get(id)!.position;
  { const segs: THREE.BufferGeometry[] = [];
    const seg = (a: THREE.Vector3, b: THREE.Vector3, w: number, h: number, off = 0) => { const horiz = Math.abs(a.z - b.z) < 0.01, len = horiz ? Math.abs(a.x - b.x) : Math.abs(a.z - b.z); if (len < 0.01) return;
      segs.push(new THREE.BoxGeometry(horiz ? len + w : w, h, horiz ? w : len + w).translate((a.x + b.x) / 2 + (horiz ? 0 : off), h / 2 + 0.005, (a.z + b.z) / 2 + (horiz ? off : 0))); };
    for (const e of edges) { const a = P(e.a), b = P(e.b);
      if (e.kind === 'mesh') { for (const o of [-0.42, 0, 0.42]) seg(a, b, 0.26, 0.1, o); }
      else if (Math.abs(a.x - b.x) < 0.01 || Math.abs(a.z - b.z) < 0.01) seg(a, b, 0.32, 0.05);
      else { const m = new THREE.Vector3(a.x, 0, b.z); seg(a, m, 0.32, 0.05); seg(m, b, 0.32, 0.05); } }
    put(scene, mergeGeometries(segs)!, traceM, 0, 0, 0, false); }

  // ------------------------------------------------------------------ labels (HTML, so they stay sharp)
  const labels: { id: string; el: HTMLElement; p: THREE.Vector3; minor: boolean; sub: boolean; shown: boolean; board?: boolean }[] = [];
  let labelsOn = true, selected: string | null = null, phone = false;
  for (const c of components) { if (['board', 'package', 'die'].includes(c.type)) continue; const m = mesh.get(c.id)!;
    const el = document.createElement('div'); el.className = 'lab' + (c.type === 'router' || c.type === 'ni' ? ' minor' : c.type === 'sub' ? ' sub' : '');
    el.textContent = c.type === 'router' ? c.id.toUpperCase() : c.type === 'ni' ? 'NI ' + c.tileId : c.tileId !== null && c.type !== 'sub' ? `T${c.tileId} · ${c.name}` : c.name; labelLayer.appendChild(el);
    labels.push({ id: c.id, el, p: new THREE.Vector3(m.position.x, m.userData.labelY, m.position.z), minor: c.type === 'router' || c.type === 'ni' || c.type === 'clock', sub: c.type === 'sub', shown: false }); }
  for (const [txt, x, y, z] of [['100 MHz oscillator', -58, 0.6, -34], ['Button 1 re-attest · Button 2 revoke', -55, 1.2, 42], ['Switch: UART select', -40, 0.8, 34.4],
    ['LD0 auth · LD1 fail · LD2 T3 PASS · LD3 heartbeat', 47.5, -0.4, 41.6], ['RGB: T0 refused', 62, 0.2, 35], ['UART', 58, 0.6, -32]] as [string, number, number, number][]) {
    const el = document.createElement('div'); el.className = 'lab minor'; el.textContent = txt; labelLayer.appendChild(el); labels.push({ id: 'b:' + txt, el, p: new THREE.Vector3(x, y, z), minor: true, sub: false, shown: false, board: true }); }

  // ------------------------------------------------------------------ packets: flit shape per virtual channel, dashed trail, arrival ring, stop glyph
  const flitMat = new THREE.MeshStandardMaterial({ color: C.blue, emissive: C.blue, emissiveIntensity: 1.4, roughness: 0.3 });
  const flitGeo: Record<VcId, THREE.BufferGeometry> = { vc0: rbox(0.6, 0.48, 1.0, 0.08), vc1: new THREE.CapsuleGeometry(0.3, 0.5, 4, 12).rotateX(Math.PI / 2), vc2: new THREE.OctahedronGeometry(0.52), local: rbox(0.32, 0.32, 0.46, 0.06) };
  const flits = {} as Record<VcId, THREE.InstancedMesh>; const NF = 4;
  (Object.keys(flitGeo) as VcId[]).forEach((k) => { const m = new THREE.InstancedMesh(flitGeo[k], flitMat, NF); m.visible = false; m.frustumCulled = false; scene.add(m); flits[k] = m; });
  const halo = new THREE.PointLight(C.blue, 0, 9, 1.6); scene.add(halo);
  const DASH: Record<VcId, [number, number]> = { vc0: [1000, 0.0001], vc1: [1.7, 0.8], vc2: [0.45, 0.4], local: [0.15, 0.3] };
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
  const trailMat = new THREE.LineDashedMaterial({ color: C.blue, dashSize: 1, gapSize: 0.5 }); const trail = new THREE.Line(trailGeo, trailMat); trail.visible = false; trail.frustumCulled = false; scene.add(trail);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.09, 8, 48), new THREE.MeshBasicMaterial({ color: C.blue, transparent: true })); ring3.rotation.x = Math.PI / 2; ring3.visible = false; scene.add(ring3);
  const stop = new THREE.Group(); { const sm = new THREE.MeshBasicMaterial({ color: C.sand }); const o = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 6, 8), sm); o.rotation.x = Math.PI / 2; o.rotation.z = Math.PI / 8;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 0.34), sm); bar.rotation.y = Math.PI / 4; stop.add(o, bar); stop.visible = false; scene.add(stop); }
  const paths = new Map<string, { pts: THREE.Vector3[]; cum: number[]; tot: number }>();
  for (const s of scenarios) for (const e of s.events) { const pts = e.path.map((id) => new THREE.Vector3(P(id).x, PY, P(id).z)); const cum = [0]; let tot = 0;
    for (let i = 1; i < pts.length; i++) { tot += pts[i].distanceTo(pts[i - 1]); cum.push(tot); } paths.set(e.id, { pts, cum, tot }); }
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const at = (pa: { pts: THREE.Vector3[]; cum: number[]; tot: number }, d: number, out: THREE.Vector3) => { if (d <= 0) return out.copy(pa.pts[0]); if (d >= pa.tot) return out.copy(pa.pts[pa.pts.length - 1]);
    let i = 1; while (pa.cum[i] < d) i++; return out.lerpVectors(pa.pts[i - 1], pa.pts[i], (d - pa.cum[i - 1]) / (pa.cum[i] - pa.cum[i - 1])); };

  // ------------------------------------------------------------------ camera
  const VIEWS: Record<string, [number[], number[]]> = { home: [[30, 34, 62], [0, 0, 2]], top: [[0, 96, 0.01], [0, 0, 0]], front: [[0, 14, 100], [0, 0, 0]], back: [[0, 14, -100], [0, 0, 0]], left: [[-110, 14, 0], [0, 0, 0]], right: [[110, 14, 0], [0, 0, 0]],
    underside: [[30, -70, 50], [0, -2, 0]], bottom: [[0, -96, 0.01], [0, -1, 0]], c1: [[62, 46, 62], [0, 0, 0]], c2: [[-62, 46, 62], [0, 0, 0]], c3: [[62, 46, -62], [0, 0, 0]], c4: [[-62, 46, -62], [0, 0, 0]], noc: [[0, 52, 12], [0, 0, 0]], tile3: [[-32, 18, 36], [-17, 0, 11]] };
  const tw = { on: false, t: 0, p0: new THREE.Vector3(), p1: new THREE.Vector3(), g0: new THREE.Vector3(), g1: new THREE.Vector3() };
  function setView(name: string, instant = false) { const v = VIEWS[name]; if (!v) return; tw.p1.fromArray(v[0]); tw.g1.fromArray(v[1]); if (phone) tw.p1.sub(tw.g1).multiplyScalar(1.5).add(tw.g1);
    if (instant || reduce) { cam.position.copy(tw.p1); ctl.target.copy(tw.g1); ctl.update(); tw.on = false; dirty = camMoved = true; return; }
    tw.p0.copy(cam.position); tw.g0.copy(ctl.target); tw.t = 0; tw.on = true; ctl.enabled = false; }
  const sph = new THREE.Spherical();
  function stepCamera(dir: string) { v1.copy(cam.position).sub(ctl.target); sph.setFromVector3(v1);
    if (dir === 'left') sph.theta -= Math.PI / 12; if (dir === 'right') sph.theta += Math.PI / 12; if (dir === 'up') sph.phi = Math.max(0.05, sph.phi - Math.PI / 14); if (dir === 'down') sph.phi = Math.min(Math.PI - 0.05, sph.phi + Math.PI / 14);
    if (dir === 'in') sph.radius = Math.max(ctl.minDistance, sph.radius * 0.82); if (dir === 'out') sph.radius = Math.min(ctl.maxDistance, sph.radius * 1.22);
    cam.position.setFromSpherical(sph).add(ctl.target); ctl.update(); dirty = camMoved = true; }

  // ------------------------------------------------------------------ selection, focus, picking
  let pickCb: (id: string | null) => void = () => {}, hoverCb: (id: string | null, x: number, y: number) => void = () => {};
  let focus: string[] = [], tileSel: number | null = null;
  // focus = blocks acting in the current event; the selected tile is lit softly, the selected block more strongly
  function applyGlow() { glow.forEach((o, id) => { const c = byId.get(id); o.t = focus.includes(id) ? 1 : tileSel !== null && c && c.tileId === tileSel ? 0.32 : 0; if (id === selected) o.t = Math.max(o.t, 0.75); }); dirty = true; }
  /** Fly the camera to frame one tile (all its blocks), keeping the current viewing direction family. */
  function focusTile(t: number | null, fly = true) { tileSel = t; applyGlow(); if (t === null || !fly) return;
    const box = new THREE.Box3(); components.filter((c) => c.tileId === t && c.type !== 'sub' && mesh.has(c.id)).forEach((c) => box.expandByPoint(mesh.get(c.id)!.position));
    const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), r = Math.max(10, size.x, size.z) * 1.9;
    tw.p1.set(ctr.x + r * 0.45, r * 1.05, ctr.z + r * 1.0); tw.g1.copy(ctr).setY(0); if (phone) tw.p1.sub(tw.g1).multiplyScalar(1.4).add(tw.g1);
    if (reduce) { cam.position.copy(tw.p1); ctl.target.copy(tw.g1); ctl.update(); dirty = camMoved = true; return; }
    tw.p0.copy(cam.position); tw.g0.copy(ctl.target); tw.t = 0; tw.on = true; ctl.enabled = false; }
  function select(id: string | null) { selected = id; const root = id && byId.get(id)?.type === 'sub' ? byId.get(id)!.parentId : id;
    subs.forEach((m) => { m.userData.lift = byId.get(m.userData.id)!.parentId === root ? 0.6 : 0; });
    labels.forEach((l) => l.el.classList.toggle('sel', l.id === id)); applyGlow(); camMoved = true; }
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pickAt(x: number, y: number): string | null { const r = cv.getBoundingClientRect(); ptr.set((x / r.width) * 2 - 1, -(y / r.height) * 2 + 1); ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObjects(picks.filter((p) => p.visible && (p.parent?.visible ?? true)), false)[0]; return hit ? (hit.object.userData.id as string) : null; }
  function screenOf(id: string) { const m = mesh.get(id); if (!m) return null; v1.set(m.position.x, m.userData.top, m.position.z).project(cam);
    const r = cv.getBoundingClientRect(); return { x: (v1.x * 0.5 + 0.5) * r.width, y: (-v1.y * 0.5 + 0.5) * r.height }; }
  let down: number[] | null = null, hoverId: string | null = null;
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(), id = pickAt(e.clientX - r.left, e.clientY - r.top);
    if (id !== hoverId) { hoverId = id; cv.classList.toggle('pick', !!id); } hoverCb(id, e.clientX - r.left, e.clientY - r.top); });
  cv.addEventListener('pointerleave', () => { hoverId = null; hoverCb(null, 0, 0); });
  cv.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerup', (e) => { if (!down) return; const moved = Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]); down = null; if (moved > 7) return;
    const r = cv.getBoundingClientRect(); pickCb(pickAt(e.clientX - r.left, e.clientY - r.top)); });

  // ------------------------------------------------------------------ packets: a pure function of (event, progress), so seeking cannot leave stale state
  let animating = false;
  function showEvent(ev: Ev | null, t: number) { (Object.keys(flits) as VcId[]).forEach((k) => { flits[k].visible = false; }); ring3.visible = stop.visible = false; trail.visible = false; halo.intensity = 0; dirty = true;
    if (!ev) return; const pa = paths.get(ev.id)!, f = flits[ev.vc], s = t * t * (3 - 2 * t), head = s * pa.tot, a = trailGeo.attributes.position as THREE.BufferAttribute;
    pa.pts.forEach((p, i) => a.setXYZ(i, p.x, PY - 0.3, p.z)); a.needsUpdate = true; trailGeo.setDrawRange(0, pa.pts.length); trail.computeLineDistances(); [trailMat.dashSize, trailMat.gapSize] = DASH[ev.vc]; trail.visible = true;
    for (let i = 0; i < NF; i++) { const dd = Math.max(0, head - i * 1.3); at(pa, dd, v1); at(pa, Math.min(pa.tot, dd + 0.4), v2); tmp.position.copy(v1); tmp.rotation.set(0, 0, 0); tmp.scale.set(1, 1, 1); if (v2.distanceToSquared(v1) > 1e-6) tmp.lookAt(v2); tmp.updateMatrix(); f.setMatrixAt(i, tmp.matrix); }
    f.instanceMatrix.needsUpdate = true; f.visible = true; at(pa, head, halo.position); halo.position.y = PY + 0.4; halo.intensity = t < 1 ? 60 : 0;
    if (t >= 1) { const end = pa.pts[pa.pts.length - 1]; if (ev.outcome === 'accepted') { ring3.position.copy(end); ring3.visible = true; } else { stop.position.set(end.x, PY + 0.6, end.z); stop.visible = true; } } }

  // ------------------------------------------------------------------ board LEDs follow the design: LD0 = tile 3 authorized, LD1 = attestation failed, LD2 = CPU A pass flag,
  // LD3 = heartbeat (bit 24 of a 50 MHz counter, about 0.34 s per half period), RGB red channel = CPU B refused flag (pq_merged_board_top.sv)
  const ledOn = [false, false, false, true, false];
  function paintLeds() { ledLens.forEach((m, i) => { m.emissiveIntensity = ledOn[i] ? 2.4 : 0; m.opacity = ledOn[i] ? 0.95 : 0.72; }); dirty = true; }
  function setLeds(s: LedState) { ledOn[0] = s.auth; ledOn[2] = s.led === '0001'; ledOn[4] = s.led === '0010'; paintLeds(); }
  paintLeds();

  function fit() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; phone = w < 560; cam.fov = phone ? 44 : 34; cam.updateProjectionMatrix(); dirty = camMoved = true; }
  new ResizeObserver(fit).observe(host); fit(); setView('home', true);
  function layoutLabels() { const dist = cam.position.distanceTo(ctl.target), w = host.clientWidth, h = host.clientHeight, parent = selected && byId.get(selected)?.type === 'sub' ? byId.get(selected)!.parentId : selected;
    for (const l of labels) { let show = labelsOn && cam.position.y > 0 && (l.sub ? !phone && byId.get(l.id)?.parentId === parent : l.board ? !phone && bd.visible && deco.visible && dist > 56 : l.minor ? !phone && dist < 72 : true);
      if (show) { v1.copy(l.p).project(cam); if (v1.z > 1 || Math.abs(v1.x) > 1.05 || Math.abs(v1.y) > 1.05) show = false; else l.el.style.transform = `translate(${((v1.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-v1.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-100%)`; }
      if (show !== l.shown) { l.shown = show; l.el.classList.toggle('on', show); } } }
  let last = performance.now(), hbT = 0;
  function frame(now: number) { requestAnimationFrame(frame); if (document.hidden) { last = now; return; } const dt = Math.min(now - last, 80); last = now;
    if (tw.on) { tw.t = Math.min(1, tw.t + dt / 1000); const e = 1 - Math.pow(1 - tw.t, 4); cam.position.lerpVectors(tw.p0, tw.p1, e); ctl.target.lerpVectors(tw.g0, tw.g1, e); dirty = camMoved = true; if (tw.t >= 1) { tw.on = false; ctl.enabled = true; } }
    if (!reduce) { hbT += dt; if (hbT >= 335) { hbT = 0; ledOn[3] = !ledOn[3]; paintLeds(); } }
    animating = false; glow.forEach((o) => { if (Math.abs(o.t - o.g) > 0.004) { o.g += (o.t - o.g) * Math.min(1, dt * 0.008); o.ms.forEach((m) => { m.emissiveIntensity = o.g * 0.5; }); animating = true; } });
    for (const m of subs) { const ty = m.userData.y0 + m.userData.lift; if (Math.abs(m.position.y - ty) > 0.002) { m.position.y += (ty - m.position.y) * Math.min(1, dt * 0.012); animating = true; } }
    ctl.update(); bd.visible = cam.position.y > -1;                         // from below, the board is hidden so the ball grid can be seen
    if (camMoved) { camMoved = false; layoutLabels(); }
    if (dirty || animating) { dirty = false; renderer.render(scene, cam); } }
  requestAnimationFrame(frame);
  void btnCaps;

  return { ok: true, select, setView, stepCamera, showEvent, screenOf, pickAt, setLeds, focusTile,
    setFocus(ids) { focus = ids; applyGlow(); },
    setLabels(on) { labelsOn = on; camMoved = true; },
    setLogical(on) { deco.visible = !on; dirty = true; },
    onPick(cb) { pickCb = cb; }, onHover(cb) { hoverCb = cb; },
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }) };
}
