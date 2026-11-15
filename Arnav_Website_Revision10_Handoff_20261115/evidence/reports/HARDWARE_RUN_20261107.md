# Hardware run, 2026-11-07: merged SoC on the Arty A7-100T, reported PASS by Kalash

- **Who ran it:** Kalash, on his board. Claude has no hardware access. This record holds his report only.
- **Report (Kalash, 2026-11-07, verbatim):** "Board shows PASS".
- **Bitstream:** `NOC_PQATTEST.runs_merged/merged_board/pq_merged_board_top.bit`, sha256 `d738b12b994776d6ab183a9691d77113e2c5f15b4e7105a394a69378e14867e3`. Commit 16f2d63c: 34,987 LUT, WNS +0.237 ns, WHS +0.035 ns.
- **Design:** merged NoC + PQ-Attest SoC with two real PicoRV32 tiles (tile 3 and tile 0) running `sw/riscv/demo_fw`. DEMO secrets only.

| Expected observation (checklist) | Reported |
|---|---|
| led[0] on: tile 3 authorized | covered by "PASS"; not itemised |
| led[2] on: CPU A "T3 PASS" | covered by "PASS"; not itemised |
| led0_r on: CPU B "T0 REFUSED" | not itemised |
| led[1] and led0_g off: no failure | not itemised |
| UART "T3 PASS" (sw[0] = 0) and "T0 REFUSED" (sw[0] = 1) | not itemised |
| btn[2] revoke → led[0] off; btn[1] re-attest → led[0] on | not itemised |

**Status after this report:**
- HARDWARE_VALIDATED = **YES (demo PASS, Kalash's report; itemised observations pending)**.
- SOC_INTEGRATION_COMPLETE = NO (Kalash's decision).
- FORMAL_PROOF = NO.

The rows marked "not itemised" turn into confirmed observations when Kalash reports them. Nothing in this record is claimed beyond his words.
