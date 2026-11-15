# PQ-Attest SoC Explorer

A static website that explains the PQ-Attest prototype: an interactive 3D view of the design, a replay of the attestation and
memory-access flows, a block inspector, and the measured results with the build each number belongs to.

It is a visualisation and evidence browser. It is not a simulator, and the 3D chip is a conceptual drawing, not a floorplan.

## Run it

Needs Node 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Build the static site (also validates the data and type-checks) and serve the result locally:

```bash
npm run build
```

```bash
npm run preview
```

Then open http://127.0.0.1:4173. The `dist/` folder is self-contained (no CDN, fonts bundled) and can be put on any static host.
`dist/index.html` must be served over http. For a file that opens straight from disk or can be sent to someone, build the single-file version:

```bash
npm run build:single
```

That writes `dist-single/pq-attest-explorer.html` (about 0.7 MB, everything inlined) and checks that it starts from `file://`.

Tests (builds must exist first; the first run needs `npx playwright install chromium`):

```bash
npm test
```

## Layout

| Path | What |
|---|---|
| `data/architecture.json` | Tiles, blocks, edges, sizes, status of every block |
| `data/scenarios.json` | The six walkthrough scenarios and their events |
| `data/evidence.json`, `data/results.json` | Public evidence labels and measured results |
| `data/evidence.dev.json` | Paths and hashes; left out of the bundle unless `PUBLIC_SAFE=0` |
| `scripts/validate-data.mjs` | `npm run validate:data`: ids, topology, XY routes, evidence links, no double counting, no leaked paths |
| `src/model.ts` | Typed data model |
| `src/scene.ts` | three.js scene, camera, picking, packet display |
| `src/main.ts` | Pages, inspector, block list, playback, hash routes |
| `src/howAnim.ts` | The click-to-play animation on the How it works page |
| `tests/` | Playwright end-to-end tests and the camera-pose screenshot grid |
| `qa/screens/` | Screenshots from the last test run |

Routes: `#explore/<scenario>/<block>`, `#how`, `#architecture`, `#results`, `#scope`.

## Changing a number

Edit the JSON in `data/`, name the evidence it comes from, then run `npm run build`. The validator fails the build if an evidence
link is missing, a route is not a legal XY path, or block areas add up to more than the design total.

See `AUDIT.md` (sources and discrepancies), `DECISIONS.md` (approved choices), `EVIDENCE.md` (claim to source), `QA_REPORT.md` (what was tested).
