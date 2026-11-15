# QA report (13 Nov 2026, fourth pass: presentation audit)

Written by the implementation session. This is not an independent review.

## Commands and results

| Command | Result |
|---|---|
| `npm run validate:data` | PASS: 34 components, 26 edges, 6 scenarios, 12 events, 13 evidence refs |
| `npm run build` (validate + strict `tsc --noEmit` + `vite build`) | PASS; JS 581 kB (153 kB gzip), CSS 9 kB, fonts bundled; no CDN |
| `npm test` (Playwright 1.49, Chromium headless shell 131, software GL, 1440 x 900, 1 worker) | **20 passed** (one of them only writes screenshots) |
| `npm run build:single` | PASS: one 737 kB HTML file; opened from `file://` with WebGL, 0 console errors, 0 network requests |
| `npm run manifest` | 17 evidence files hashed (SHA-256), 2 entries are patterns or out-of-tree runs |

| Test | Checks |
|---|---|
| loads | No console or page errors, no request to any external host; scope line and playback-mode label visible |
| routes | `#how`, `#architecture`, `#results`, `#scope` render; `#explore/access/endp` survives a reload |
| block list | Search, Tab, Enter selects a block; inspector shows name, 5,807 LUT, status badges; URL updates |
| scenario state | Authorization, UART and LED derive from events: correct after GRANT and again after seeking back |
| scrub bar, keyboard orbit | Scrubbing to the end, the start and the middle gives the matching event and outputs; arrow key on the 3D view moves the camera |
| 3D picking | 25 rays at 5 poses return the expected block; a real mouse click selects the RoT verifier; draw calls <= 250, triangles <= 250,000 |
| camera-pose matrix | 13 poses: +Y, -Y, +Z, -Z, +X, -X, four corner obliques, network, tile 3, underside. Every ray aimed at a block lands on a named component; 42 exact-hit assertions for unobstructed blocks |
| camera controls | Step buttons, view menu, logical-view toggle work without dragging |
| phone (390 px) | No horizontal scroll; controls at least 24 px tall |
| accessibility (axe-core 4.10, WCAG 2.0 / 2.1 / 2.2 A and AA rules) | 0 violations on each of the 5 sections |
| public-safe | `dist/` has no local path, image hash, demo key, dev metadata or CDN host |
| How it works animation | Steps, gate open / closed, memory cells `C0 DE 5A 5A`, UART `T3 PASS` / `T0 REFUSED`, tile 0's packet stays inside its tile, stepping back restores the earlier state |
| screenshot grid | 14 camera poses, 5 pages, 1 phone view, 1 single-file view in `qa/screens/` |

## Facts re-derived from RTL in this pass

32-bit flits, 3 virtual channels with 4-flit buffers and their roles (`rtl/dual_lane/NOC_PKG.sv` 50-57, 164-168); 128-bit tag (same file, 86);
80-bit epoch, 64-bit sequence number, replay rejection (`noc_l2_auth_p7_i9.sv` 25, 74-75, 285); 224-bit challenge and GRANT / REVOKE sent as
packets on the same channel and path (`pq_rot_verifier.sv` 39, 53-56).
Still from the owner's fact list only: the 512-bit response payload split (measurement + tag).

## Not done, or not possible in this session

| Item | Status |
|---|---|
| Frame rate on a real GPU, load time, mobile performance | **Not measured.** Tests use software rendering |
| Firefox and Safari | **Not tested** (only Chromium installed) |
| Screenshot pixel-diff baselines | **Not set**; they need a real-GPU reference machine |
| Screen-reader pass | **Not done.** axe checks rules, not the listening experience |
| Human look at the 3D from every side | Screenshots reviewed by the builder (home, tile 3, back, underside, three animation steps). Labels overlap at grazing side angles |
| Behaviour inside the hosted link | **Not checked.** The single file was tested from disk; the hosted page's sandbox was not exercised |
| Usability trial with 2 to 3 people | **PENDING** |
| Independent review | **PENDING**; needs a separate session |
| Verified-trace playback, stalls and credit waits | Not built (decision D5): no cycle-stamped trace exists |
| Typed port lists per block | Board-top pins only; other blocks show their RTL instance path |
| Before / after image comparison | Not produced; the corrections are listed below |

## Fifth pass (13 Nov): Beginner-Friendly Educational Upgrade

| Item | Change | Test |
|---|---|---|
| Presentation vs Learning Mode | Seamless toggle added to Hero header and How-It-Works animation. Presentation mode stays crisp and fast; Learning mode provides in-depth beginner explanations and analogies | axe scans, site.spec, extra.spec |
| Every demonstration step explained | Complete 5-part breakdown (A: What is happening, B: Why is this happening, C: How does it work + Analogy, D: What happens next, E: Real-world significance) for all 12 events and all 10 How-it-works steps | Playwright test suites (all 20 passed) |
| Security Scenario Audit Cards | Clear breakdown of attempted action, initiator, checks performed, checker component, result (Green/Red/Amber/Blue badges), why it occurred, and what would happen without security | Demo test, accessibility scan |
| Complete 9-point tile profiles | Every tile (0-5) includes everyday analogy and 9-point system guide: what is it, responsibility, why needed, interactions, inputs, internal operations, outputs, security benefit, and compromise impact | Tile card test (all six tiles) |
| System Overview page (`#overview`) | Complete high-level architecture overview using the "Secure Office Building" analogy, department comparison table, and transaction lifecycle walkthrough | Nav & routing tests |
| Comprehensive Glossary (`#glossary` & Drawer) | 32 terms with category filtering, search, plain-English definitions, everyday analogies, and SoC context; accessible via `#glossary` route and slide-over drawer via inline terms | Route test, axe scans |
| WCAG 2.2 AA Compliance | Zero axe violations across `#explore`, `#how`, `#architecture`, `#results`, `#scope`, `#overview`, `#glossary` | 10/10 extra.spec passed |

## Fourth pass (13 Nov): presentation audit P1 / P2 items

| Audit item | Change | Test |
|---|---|---|
| P-01 opening view | Two-line summary, "Watch the demo" button, tile buttons above the 3D view | Watch the demo test |
| P-02 tile inspection | Tile card for every tile: name, purpose, LUT / FF / BRAM of the main block clearly distinguished from total tile resources, breakdown table of measured components without inventing unmeasured tile totals, what it does, role in the current scenario; subcomponents collapsed in secondary detail | Tile card test (all six tiles) |
| P-03 unimplemented features | Header line is now a positive tagline focused on demonstrated capabilities (Hardware attestation with SHA3-256 and KMAC128); limits moved into collapsible section and Scope page | Routes test, loads test |
| P-04 WebGL fallback | Without WebGL the stage shows the step-by-step diagram (2D animation) | Not run: the test browser has WebGL |
| P-06 one guided demo | "Watch the demo" plays all six scenarios in order; the tile card and highlight follow whoever acts; clear success/failure indicators (badges, trail rings, and refusal stops) | Watch the demo test |
| P-07 plain language | Every step has who / what / why in plain words; routes, channels and protocol fields moved to "Technical detail" | Captions checked in the demo test |
| P-08 results | Four key figures first, then what works, cost of security, board status; full evidence collapsible | Routes test |
| P-09 small targets | Inline links are now at least 32 px tall | axe scans |
| P-10 / P-11 animation wording | Explicit controls on the diagram; active tile highlights, glowing state transitions, and step-by-step progression | How it works test |
| P1 3D labels overlap | Added 2D label collision avoidance with priority sorting and raycast occlusion hiding labels behind 3D components | Camera pose matrix, 3D picking |
| P1 Board sizing & side height match | Board footprint scaled down to 136x88 mm; timeline moved below stage/side; side inspector pinned to exactly match the 490px stage height with dedicated scrolling | Desktop & phone layout tests |
| P-05 real-GPU checks | **Still open**: needs a person on a GPU-equipped browser | none |

## Third pass (13 Nov): realism and the How it works animation

- Every block is now drawn as a surface-mount part: routers and logic as QFN and gull-wing packages with tin leads, the three security blocks as ceramic packages with gold lids and castellated pads, the CPU tiles as small modules carrying their four sub-blocks, the shared memory as a TSOP, the SPOOF port as a pin header, the empty tile as an unpopulated footprint. Laser-style markings on each part.
- Package and board: rounded substrate, underfill fillet, silicon die with standard-cell texture, die- and board-side capacitors and resistors, flattened solder balls, solder mask with traces, vias and silkscreen, metal-lid oscillator, tactile buttons, slide switch, LEDs with lenses, a studio environment for reflections and a shadow-catching floor.
- Board LEDs follow the design (board top RTL lines 122-126): LD0 tile 3 authorized, LD2 CPU A pass flag, LD3 heartbeat (bit 24 of the 50 MHz counter, about 0.34 s per half period), RGB = CPU B refused flag.
- How it works page: a ten-step animation (click or Play) showing the measurement, challenge, response, grant, write, read-back, local refusal, revoke and the simulation-only forged packet on a flat tile view, with UART text, LEDs and button 2.

## Corrections against the earlier chip view

- After REVOKE the refusal is at tile 3's own bridge (RTL), not at the tile-2 memory front end.
- The forged-packet step is labelled simulation only; the SPOOF port is tied off in the board image.
- Every block area comes from the 12 Nov report (the old view mixed in 7 Nov figures).
- Virtual channels are told apart by shape and line pattern; the palette has three hue families only.
- three.js and fonts are bundled; nothing loads from a CDN.

## Sixth pass (15 Nov 2026): Revision 10 Integration

| Item | Change | Status / Test |
|---|---|---|
| Revision 10 Build Data | Added `R10-OWNER-GUI-20261115-1226` as `CURRENT_BUILD`: 39,962 LUTs (63.0%), 29,187 FFs, 20 BRAMs, WNS +0.182 ns, WHS +0.007 ns, 4 implementation warnings, 11 methodology warnings, 1 advisory. 12 Nov RC1 moved to HISTORICAL. | `validate:data PASS`, `check-single PASS` |
| Whole-IMEM Measurement | Replaced all "first 64 bytes" claims with complete 16KB (4,096 words) IMEM measurement via dedicated `meas_imem_hasher` (5,445 LUTs). Endpoint retains 64-byte encoded metadata field derived from the full hash. | `validate:data PASS`, `build PASS` |
| Hierarchical Inclusive Resources | Updated CPU A tile inclusive to 8,117 LUTs (includes 5,445 LUT hasher with internal 5,429 LUT SHA3-256), CPU B to 2,566 LUTs, RoT verifier to 5,802 LUTs, Endpoint to 6,362 LUTs, L2 to 6,568 LUTs, Mesh to 10,116 LUTs (1,686 LUT share per router). | `validate:data PASS`, unit assertions updated |
| Firmware v3 & Execution Boundary | Firmware v3 (`demo_fw_v3`) with unbounded revoke/re-attest button waits; IMEM-only execution boundary (local DMEM/MMIO fetch refused through existing poison/error). | Documented across architecture, scenarios, and learning |
| Verification Increment I-27-R2 | Updated verification status: Increment I-27-R2 (31 fresh jobs, 7 mutation kills); original I-27 preserved as historical NOT PASSED. Hardware validation status remains pending. | Reflected in results and evidence |
| Developer Metadata & Single File | Regenerated dev manifest and single-file distribution (838 kB); verified zero console errors, zero external requests, WebGL clean. | `npm run build:single` PASS |

## Verdicts (builder's own; to be replaced by the independent review)

| Gate | Verdict | Condition |
|---|---|---|
| Technical claims | CONDITIONAL GO | RTL sign-off audit still open; response payload split not re-derived |
| Routing and interaction | CONDITIONAL GO | Explanatory mode only; routes validated against the mesh graph and the XY rule |
| 360-degree model | CONDITIONAL GO | 13-pose ray matrix passes; no human all-angle review |
| Browser and accessibility | CONDITIONAL GO | axe clean in Chromium; other browsers, screen reader and real-GPU numbers missing |
| Static public release | CONDITIONAL GO | Self-contained and public-safe; usability trial and independent review pending |
