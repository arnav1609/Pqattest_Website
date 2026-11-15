# PQ-Attest 3D website: Gate 1 audit (2026-11-12)

Status: **STOPPED AT GATE 1. No site code written.** Awaiting Kalash's decisions in `DECISIONS.md`.
Author: Claude (implementation session, not an independent reviewer). Brief: `PQ_Attest_Claude_Final_3D_Website_Brief_v2.docx`.

## 1. Baseline and inputs

| Item | Value |
|---|---|
| Repo / branch / commit | `C:\vivado_verilog_proj\NOC_PQATTEST`, `noc/credit-integration`, `2792367f` |
| Dirty files | `NOC_PQATTEST.xpr`, two CRLF-only M-F1 docs (standing practice; none is RTL) |
| RTL / XDC / firmware vs tag `rtl-rc1-20261112` (416379e1) | unchanged (`git diff --stat`: only the block-design shell `pq_merged_board_bd_ref.v` added, not in the build list) |
| Top / defines | `pq_merged_board_top`; `PQ_MAC_ON`, `CPU_TILE_MODULE=cpu_tile_noc`, `REAL_CPU_TILE` |
| Source list | `scripts/merged_bitstream_sources.tcl` (70 sources + `sw/riscv/demo_fw_v2.hex`), sha256 `c94ba1a327c46c58…` |
| Device / board / clock | xc7a100tcsg324-1, Arty A7-100T, 100 MHz -> MMCM -> one 50 MHz clock |
| Tools | Vivado / XSim 2024.1; Node v24.22.2, npm 11.19.1 (present, nothing installed for the site yet) |

| Input | sha256 (first 16) | Handling |
|---|---|---|
| `PQ-Attest_OnePager.pdf` (Downloads) | `04baf7855a7aaa58` | Original proposal; read in full (1 page) |
| `PQ-Attest SoC Chip View.html` (Downloads) | `fbe011df0fa47bdb` | Downloaded copy of the artifact; differs from the repo source below (publish wrapper) |
| `docs/figures/soc_chip_view.html` (repo, commit 2792367f) | `7f838a0310a31b3f` | Existing 3D foundation; three.js r128 from a CDN (must be migrated: brief sec. 11) |
| Brief `.docx` | `52cb8425e0ebd335` | Instructions. Its one image is the Concept 3 reference (art direction only) |
| "RC1" | resolved | = tag `rtl-rc1-20261112`, commit 416379e1, record `reports/RELEASE_RC1_20261112.md` |

Not inspected in this audit: every line of the 70 RTL files (the separate RTL sign-off audit is paused, see
`reports/RTL_SIGNOFF_AUDIT_CHECKPOINT_20261112.md`); waveform databases; the three other PQ-Attest PDFs in Downloads.

## 2. Requirements traceability (one-pager -> implemented)

Maturity / Currency / Confidence use the brief's enums. "Safe wording" is a proposal until approved.

| # | One-pager claim | Implemented (source) | Evidence | Maturity / Currency / Confidence | Safe website wording |
|---|---|---|---|---|---|
| R1 | 2 x Arty A7-100T | One board. No second-board link found in the build list or XDC (12 pins: clock, 3 buttons, 1 switch, 6 LEDs, UART TX) | `synth/merged/pq_merged_board_arty.xdc` | Second board: PLANNED / - / - | "Single Arty A7-100T. The two-board physical attacker link was not built." |
| R2 | Two RV32I soft cores | Two PicoRV32 tiles (tile 3, tile 0). The build contains PicoRV32's multiply and divide units | `rtl/riscv/tile_top.sv`; `impl_merged/gate/util_hier_routed.rpt` (`pcpi_mul`, `pcpi_div`) | ROUTED / CURRENT_BUILD / DIRECT | "Two PicoRV32 RISC-V tiles; the demo firmware is RV32I assembly." |
| R3 | 2D mesh NoC, XY routing | 3x2 mesh, 6 routers, 5 ports, XY, wormhole, credits, 3 VCs | `noc_mesh_3x2.sv`, `noc_router.sv`, `NOC_XY_ROUTING.sv` | ROUTED / CURRENT_BUILD / DIRECT (structure); routing behaviour SIM_VERIFIED per gate reports, not re-run here | "3x2 mesh, 6 routers" (never 3x3) |
| R4 | PQ primitive tile: Keccak/SHA-3 + NTT | Keccak-f[1600], SHA3-256, KMAC128. **No NTT** in the active RTL (search of `rtl/` and `sources_1/new/` for ntt / ml-kem / ml-dsa / dilithium / kyber: no match) | source search 2026-11-12 | SHA-3/KMAC: ROUTED / CURRENT_BUILD; NTT: PLANNED | "SHA3-256 and KMAC128. NTT, ML-KEM and ML-DSA are not implemented." |
| R5 | Post-quantum-**signed** measurement | Symmetric: SHA3-256 measurement + KMAC128 tag checked by the root of trust. No signature scheme | `pq_attest_endpoint.sv`, `pq_rot_verifier.sv` | SIM_VERIFIED / CURRENT_BUILD / DERIVED (from gate reports) | Headline clarification, see DECISIONS D2 |
| R6 | Each NI withholds routing until the tile is attested | Per-tile gates exist; only tiles 3 and 4 are attestable (`ATTESTABLE(g==3 \|\| g==4)`). Tile 0 is never authorized and refuses locally. Tile 3 is the one attested tile | `pq_noc_subsystem_p7_i9.sv:178`; `pq_soc_merged_core.sv:99-110` | SIM_VERIFIED / CURRENT_BUILD / DERIVED | "One tile (tile 3) is attested; one tile (tile 0) is never authorized." Not "every tile". |
| R7 | Continuous verification while running | Attestation starts once after reset and again on button 1; button 2 revokes. Memory access checks authorization at the time of each access. No periodic re-attestation timer found in the board top | `pq_merged_board_top.sv:64-75` | RTL_IMPLEMENTED / CURRENT_BUILD / DIRECT | "On-demand re-attestation; authorization is checked on every memory access." Not "continuous re-attestation". |
| R8 | Memory subsystem | Shared BRAM on tile 2 behind a front end | `pq_soc_merged_core.sv:133-136` | ROUTED / CURRENT_BUILD / DIRECT | as is |
| R9 | Hardware root of trust | RoT verifier on tile 4 (CHALLENGE, GRANT, REVOKE) | `pq_rot_verifier.sv` | SIM_VERIFIED / CURRENT_BUILD / DERIVED | as is |
| R10 | Spoofed-tile threat model over a physical link | SPOOF injection port (tile 5) behind an ingress quarantine. **In the board image the port is tied off** (`.spoof_raw_valid(1'b0)`), so forged-packet rejection is simulation evidence only | `pq_soc_merged_core.sv:145` | SIM_VERIFIED / CURRENT_BUILD / DERIVED; not in the board image | "Forged-packet rejection: shown in simulation. Not part of the board demo." |
| R11 | Overhead vs a non-attested baseline (latency, area, throughput) | Area: 34,952 LUT secure vs 15,814 LUT fixed-admission research baseline. Memory latency: 32 / 32 cycles secure vs 28 / 27 fixed (steady). Throughput: not checked in this audit | `reports/I25_GATE_20261111.md:14-22` (same part, clock, tool) | ROUTED + SIM_VERIFIED / CURRENT_BUILD / DERIVED | Show with the baseline's "research only, never a release image" label; throughput "not shown" until sourced |
| R12 | FPGA demonstration | 7 Nov image: owner reported "Board shows PASS", not itemised. Current images: no board record | `reports/HARDWARE_RUN_20261107.md` | 7 Nov: HARDWARE_VALIDATED / HISTORICAL / owner report, not itemised. Current: ROUTED / CURRENT_BUILD | see DECISIONS D4 |

## 3. Build identity and results (evidence chain)

| Build | Commit | Image sha256 | LUT | WNS / WHS (ns) | Board | Currency |
|---|---|---|---|---|---|---|
| Owner GUI build 12 Nov 17:35 | RTL = 416379e1 | `2b2518be…2913` | 34,952 | +0.120 / +0.009 | none | CURRENT_BUILD |
| Release flow 12 Nov 14:05 | RTL = 416379e1 | `9dd6dca6…7000` | 34,952 | +0.120 / +0.009 | none | CURRENT_BUILD |
| Board demo image 7 Nov | 16f2d63c | `d738b12b…67e3` | 34,987 | +0.237 / +0.035 | "PASS" (owner, not itemised) | HISTORICAL |

Gate summary of the 17:35 build (`NOC_PQATTEST.runs/impl_merged/gate/gate_summary.txt`): TNS 0, THS 0, route errors 0, DRC errors 0,
check_timing clean, FF 25,328, BRAM36 20, DSP 0. **Not yet extracted for the site:** methodology warning counts, CDC report,
unconstrained-path count (reports exist in the gate folder; CDC needs a `report_cdc` run on the routed checkpoint).
The block areas used in the current chip view come from the 7 Nov build and are HISTORICAL; the 12 Nov hierarchy report is available
and should replace them (mesh 10,230; endpoint 6,619; L2 6,612; verifier 5,807; CPU A 2,691; CPU B 2,561).

## 4. Discrepancy register

| ID | Impact | Discrepancy | Proposed disposition |
|---|---|---|---|
| X1 | High | Name and proposal say "post-quantum"; implementation is symmetric SHA-3/KMAC, no signatures, no NTT | Keep the name, put a scope line directly under the title (D2) |
| X2 | High | Proposal: every unit continuously verified. Built: one attested tile, on-demand | Say exactly that (R6, R7) |
| X3 | High | Proposal: two boards, physical attacker. Built: one board; SPOOF port tied off in the board image | Mark as not built; forged-packet scenario labelled "simulation" |
| X4 | High | Current chip view implies the six-step demo is one board demo. Steps 1-5 match the firmware/board design; step 6 is simulation only; the 7 Nov board report is not itemised | Per-scenario evidence badge; no "shown on the board" wording without an itemised record |
| X5 | Medium | Chip view mixes 12 Nov totals with 7 Nov block areas | Use the 12 Nov hierarchy report for both |
| X6 | Medium | Chip view step 5 draws the refusal at the tile-2 front end and step 1 draws the measurement going to the endpoint; neither was traced in RTL | Trace both in RTL before Gate 2, or label "explanatory" |
| X7 | Medium | Chip view loads three.js r128 and fonts from CDNs | Migrate to a pinned, bundled build (brief sec. 11) |
| X8 | Low | Concept 3 shows a nine-tile grid | Art direction only; six tiles |
| X9 | Low | "RV32I cores" vs PicoRV32 built with mul/div units | Wording in R2 |

## 5. Architecture (exact, from RTL)

Tile = 3*y + x. Row y=0: tile 0 (0,0), tile 1 (1,0), tile 2 (2,0). Row y=1: tile 3 (0,1), tile 4 (1,1), tile 5 (2,1).

```
            x=0                      x=1                      x=2
y=0   R0 -- NI0 -- CPU B        R1 -- NI1 (no app)       R2 -- NI2 -- mem front end -- BRAM
      |                         |                        |
y=1   R3 -- NI3 -- CPU A        R4 -- NI4 -- RoT         R5 -- quarantine -- SPOOF port
            + PQ-Attest               verifier                 (tied off in the board image)
              endpoint
      L2 authenticated link: control packets between tiles 3 and 4 only (shared KMAC engine)
Mesh links: R0-R1, R1-R2, R3-R4, R4-R5 (X); R0-R3, R1-R4, R2-R5 (Y). XY routing: X first, then Y.
Board top: MMCM (100 -> 50 MHz) + 2 BUFG, reset generator, button/switch synchronisers, UART TX mux, LEDs.
```

Playback modes available today: **EXPLANATORY WALKTHROUGH only.** No cycle-stamped event trace has been extracted; VERIFIED TRACE
needs an out-of-tree simulation run or log parsing (D5).

## 6. Proposed plan after approval

| Gate | Work | Check |
|---|---|---|
| 2 | Vite + TypeScript + three (pinned, bundled), design tokens, data model with schema + `validate:data`, 3D hierarchy from the data model, playback engine | Kalash reviews look and all-angle 3D |
| 3 | Inspector, tile list, How it works / Architecture / Results / Scope pages, public-safe build | Independent reviewer (separate session) |
| 4 | Playwright: routes, selection, scenarios, camera-pose raycasts, a11y scan, offline `dist` | Reviewer + 2-3 real users (PENDING until done) |
| 5 | README, CREDITS, LICENSES, QA_REPORT, final report with five verdicts | Kalash |

Limits to expect: FPS on a real GPU and the user trial cannot be done by me; independent review needs a separate session.
Skills named in the brief: "Frontend Design", "Playwright", "Context7" are not installed here; equivalents present are the
frontend / visual-design / motion skills already used, and Playwright as an npm dependency (needs approval to install).
