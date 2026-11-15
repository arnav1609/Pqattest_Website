# PQ-Attest 3D website: decisions (Gate 1)

All rows were approved by Kalash on 2026-11-12 ("approve all"). D13 to D15 were decided by the implementation session afterwards and are open to change.

| ID | Decision | Proposal | Status |
|---|---|---|---|
| D1 | Palette | **Charcoal / sand / electric blue** replaces the brief's navy / white / lime (Kalash, 2026-11-12). Same rules: three hue families only, no fourth accent | APPROVED (instruction) |
| D2 | Headline scope line | Under the title, always visible: "Architecture prototype on FPGA. Attestation uses SHA3-256 and KMAC128 (symmetric). ML-KEM / ML-DSA signatures and NTT are not implemented." | APPROVED |
| D3 | Scope deviations shown as "not built" | Second board and physical attacker link; NTT; post-quantum signatures; attestation of every tile; periodic re-attestation | APPROVED |
| D4 | Board status wording | "A 7 November image was reported as passing on the board by the project owner (observations not itemised). The current 12 November image has not been run on the board." | APPROVED |
| D5 | Playback mode | Explanatory walkthrough only for the first release, labelled as such. Verified-trace mode added later if an out-of-tree simulation run is approved | APPROVED |
| D6 | Scenarios | Boot + measurement, attest (CHALLENGE / RESPONSE / GRANT), authorized write/read, local refusal (tile 0), revoke + refused request, forged packet (labelled "simulation only") | APPROVED |
| D7 | Representation | Two views: "Logical architecture" (LOGICAL) and "Conceptual package" (CONCEPTUAL). No "physically evidenced" view: no placement data is used | APPROVED |
| D8 | Block areas | 12 Nov post-route hierarchy report (current build), with the method note that mesh was synthesised separately and the rest with rebuilt hierarchy | APPROVED |
| D9 | Location | `site/` folder on the current branch; website commits touch only `site/`. (A separate worktree would not open in this session's file pane.) | APPROVED |
| D10 | Stack and installs | Vite + TypeScript + three + Playwright + self-hosted IBM Plex, all pinned in a lockfile. Requires `npm install` (downloads packages) | APPROVED |
| D11 | Release mode | Local static `dist/` plus the existing private artifact link; `PUBLIC_SAFE` on by default (no paths, hashes, keys or firmware) | APPROVED |
| D12 | Marks | No Digilent, AMD or RISC-V logos; names in text only | APPROVED |
| D13 | Refusal after REVOKE | Drawn at tile 3's own bridge (RTL: `tmem_app_bridge.sv` 136-144), not at the tile-2 front end as in the old chip view | DECIDED (from RTL) |
| D14 | Underside view | The board is hidden when the camera is below it, so the 18 x 18 ball grid can be seen | DECIDED |
| D15 | Shareable link | The site is also built as one self-contained HTML file (`npm run build:single`) and published to the existing private link, replacing the old chip view (Kalash, 2026-11-13) | DONE |
| D16 | Presentation hierarchy (presentation audit, 13 Nov) | Opening view: short summary, "Watch the demo" (all six scenarios in order with a who / what / why caption) and tile buttons. Selecting any tile shows a tile card: name, purpose, LUT / FF / BRAM of its main block ("Not separately measured" where the report has no figure), what it does, its role in the current scenario, and its parts. The scope clarification moves from the site header to one short line in the opening view; the detailed limits sit in "Limits of this prototype" (How it works) and on the Scope page. Results page leads with four key figures; full evidence is in an expandable section. Without WebGL, the stage shows the step-by-step diagram. Mobile changes are out of scope (assigned to Arnav). | DONE |

## D1 palette tokens (contrast measured, WCAG relative luminance)

| Token | Hex | Use |
|---|---|---|
| `--charcoal` | `#1B1E23` | Background, chip body, text on blue |
| `--charcoal-raised` | `#272B32` | Raised surfaces (tonal shade, not a new hue) |
| `--sand` | `#E8DCC6` | Body text on charcoal, light surfaces |
| `--blue` | `#4D94FF` | Focus, active route, packets, primary action |

| Pair | Ratio | Rule |
|---|---|---|
| Sand on charcoal | 12.32 | Pass, normal text |
| Sand on raised | 10.48 | Pass, normal text |
| Blue `#4D94FF` on charcoal | 5.57 | Pass, normal text and graphics |
| Blue on raised | 4.73 | Pass, normal text |
| Charcoal on blue | 5.57 | Use charcoal text on blue buttons |
| Blue vs sand (either way) | 2.21 | FAIL: never blue text or thin blue marks on sand, never sand text on blue |

A more saturated electric blue (`#2F6BFF`) gives 3.71 on charcoal: below 4.5, so it would be limited to large text and graphics.
`#4D94FF` is proposed so one blue works everywhere. Virtual channels are told apart by flit shape and line pattern, and
rejections by a stop glyph and caption, not by extra colours.
