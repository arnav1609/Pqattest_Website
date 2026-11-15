# Evidence: where each claim on the site comes from

Repository commit at the time of writing: `2792367f` (active RTL, constraints and firmware unchanged since tag `rtl-rc1-20261112`).
All "current build" numbers are from the build of 12 Nov 2026 17:35 (image sha256 `2b2518be…2913`), unless a row says otherwise.

| Claim on the site | Source | Read how |
|---|---|---|
| 34,952 LUT, 25,328 FF, 20 block RAM, 0 DSP; WNS +0.120, WHS +0.009; TNS / THS 0; route and DRC errors 0; check_timing clean; firmware RAMs 4/4 + 4/4 | `NOC_PQATTEST.runs/impl_merged/gate/gate_summary.txt` | Read directly |
| Per-block LUT / FF / BRAM (mesh 10,230; endpoint 6,619; L2 6,612; verifier 5,807; CPU A 2,691; CPU B 2,561; NIs; tile sub-blocks) | `…/gate/util_hier_routed.rpt` | Read directly |
| Router "about 1,705 LUT" | 10,230 / 6 | Derived; labelled an equal share, not a measurement |
| Methodology: 12 findings (11 XDCH-2 warnings, 1 RTGT-1 advisory) | `…/gate/methodology_routed.rpt` | Read directly |
| No clock-to-clock crossings; 0 unconstrained endpoints, loops, latch loops | `report_cdc` and `check_timing` run on `pq_merged_board_top_postroute_physopt.dcp`, 12 Nov 21:05, Vivado 2024.1, outputs kept out of tree | Run for this site |
| Baseline 15,814 LUT, WNS +0.327, WHS +0.028 | `reports/I25_GATE_20261111.md` line 14 | Read from the gate report (not re-derived from the raw reports) |
| Latency 32 / 32 vs 28 / 27 cycles; throughput 0.0179 vs 0.0195 per cycle | `reports/dual_lane_10_20261111_124233_d42406c3/i25_matched_data/matched_latency.json` | Read directly |
| 7 Nov image: 34,987 LUT, WNS +0.237, WHS +0.035, "Board shows PASS" | `reports/HARDWARE_RUN_20261107.md` | Read directly; the board result is the owner's statement, not itemised |
| Tile map, tile 1 has no application, SPOOF port tied off, measurement window goes from CPU A to the endpoint | `rtl/dual_lane/merged/pq_soc_merged_core.sv` (lines 86-154) | Read directly |
| A tile that is not authorized refuses locally; also after a revoke | `rtl/riscv/tmem_app_bridge.sv` lines 116, 134-144 | Read directly |
| Tiles 3 and 4 are the attestable tiles; memory checks authorization at the time of access | `rtl/dual_lane/pq_noc_subsystem_p7_i9.sv` lines 178, 315-319 | Read directly |
| LED meanings: LD0 tile 3 authorized, LD1 attestation failed, LD2 CPU A pass flag, LD3 heartbeat (counter bit 24), RGB red = CPU B refused flag | `synth/merged/pq_merged_board_top.sv` lines 114-126 | Read directly |
| Attestation starts after reset and on button 1; button 2 revokes; no periodic timer | `synth/merged/pq_merged_board_top.sv` lines 64-75 | Read directly |
| 12 constrained pins; 100 MHz input clock; MMCM to 50 MHz | `synth/merged/pq_merged_board_arty.xdc`; board top lines 31-37 | Read directly |
| No NTT, ML-KEM or ML-DSA | Search of `rtl/` and `NOC_PQATTEST.srcs/sources_1/new/` for ntt, ml-kem, ml-dsa, dilithium, kyber: no match | Search, 12 Nov |
| Protocol facts: 224-bit challenge, 512-bit response, KMAC128 128-bit tag, 80-bit epoch, 64-bit sequence number, 3 VCs x 4-flit buffers, 32-bit flits, VC roles | Owner's fact list of 12 Nov, then checked in RTL on 13 Nov (`NOC_PKG.sv`, `noc_l2_auth_p7_i9.sv`, `pq_rot_verifier.sv`; lines in QA_REPORT.md) | Read directly, except the 512-bit response payload split, which is from the owner's list only |
| Simulation behaviour of the six scenarios | Gate reports I-13 to I-26 | Summarised; not re-run, and the independent RTL sign-off audit is still open |

## Known gaps

- No cycle-stamped trace exists, so the replay is an explanatory walkthrough only.
- The order of events inside a scenario follows the RTL and the owner's description; write acknowledgement is inferred from the measured write latency (request to response).
- The forged-packet scenario is simulation evidence; nothing on the board can exercise it.
- A SHA-256 manifest of the cited files is in `data/evidence.manifest.dev.json` (development only; regenerate with `npm run manifest`).
