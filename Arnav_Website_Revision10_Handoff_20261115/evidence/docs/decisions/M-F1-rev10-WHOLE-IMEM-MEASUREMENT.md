# M-F1 revision 10: whole-IMEM measurement (APPROVED)

Status: **APPROVED by Kalash on 2026-11-13 in the Codex chat:** "approved start the build excatly follwoing instrctions" (in direct response to the request for revision-10 approval). All five decisions below are approved. Execution remains subject to the blueprint's phase gates and hard stops.
Author: Claude, 2026-11-13. Trigger: sign-off audit finding D-01 (reports/rtl_signoff_20261113) and Kalash's decision
"Measure whole IMEM" (2026-11-13). Supersedes decision I9-D2 (64-byte window) for the merged build.
HARDWARE_VALIDATED=NO, SOC_INTEGRATION_COMPLETE=NO, FORMAL_PROOF=NO.

## 1. Problem

Decision I9-D2 measures the first 64 bytes of tile 3's instruction memory. With firmware v2 those bytes are
`j main`, `j handler` and 14 NOPs. All program code from 0x40 is outside the measurement, so a changed program with the
same first 64 bytes passes attestation. This was recorded as a limitation in the closure profile ("64-byte boot stub
only; no full-firmware integrity claim"); revision 10 removes the limitation.

## 2. Decision in one line

Tile 3 hashes its **entire** instruction memory (16,384 bytes) with SHA3-256 at boot, and that digest is what goes
into the existing 64-byte `imem` field of the measurement. Nothing on the wire changes.

## 3. What changes and what does not

| Item | Revision 9 | Revision 10 |
|---|---|---|
| `imem` field (64 bytes) given to the endpoint | IMEM bytes 0..63 | bytes 0..31 = SHA3-256(IMEM[0..16383]); bytes 32..35 = IMEM length 0x00004000 (little-endian); bytes 36..39 = MEAS_BASE (0); bytes 40..63 = 0 |
| Measurement | SHA3-256(tile ID \|\| config \|\| imem[64]) | same formula, same lengths (K-3: config 16, imem 64) |
| Packet formats, challenge, response, tag, L2 link, status codes | - | **unchanged** |
| Endpoint, verifier, protocol, subsystem, NI, mesh, all protected files | - | **unchanged** |
| Teammate Python reference (ZIP) | - | **unchanged**; it is called with the new 64-byte `imem` value |
| Tile-3 reader | `meas_window_reader` (16 words) | new `meas_imem_hasher` in `rtl/riscv/` (4,096 words through the same dedicated read port, feeding one `sha3_256` instance) |
| Tile 0 (never attested, output unused) | `meas_window_reader` | keeps `meas_window_reader` (parameter selects the reader; saves area) |
| Firmware image file | 206 words | padded with zeros to 4,096 words so every measured byte is defined in simulation and in the bitstream |
| `APPROVED_MEAS`, closure profile vectors | revision 9 values | regenerated |
| Profile number in `config_data` | 9 | 10 |

Hash details: 16,384 bytes = 120 full 136-byte blocks + one final block of 64 bytes, so the existing `sha3_256`
multi-block path is used and the "final block exactly full" case (audit finding D-08) is not reached.
Expected digests come from Python `hashlib.sha3_256` over the padded image, independent of the RTL.

## 4. Firmware change in the same revision (audit finding D-02)

The image changes anyway, so D-02 is fixed in the same step: in firmware v3 the two waits for a button
(`wait_revoke`, `wait_again`) no longer time out into FAIL. `wait_grant` keeps its bound. Benches always press the
buttons, and a hang is still caught by each bench's timeout (a timeout is never a pass).

## 4b. No execution from data memory (audit finding D-06; added 13 Nov, blueprint decision 3)

**Amendment approved by Kalash on 2026-11-14:** "Approve IMEM-only instruction fetch (recommended)".
The registered counterexample in `reports/R10_FETCH_SCOPE_FINDING_20261113.md` shows that a DMEM-only guard still
allows the real CPU to execute STATUS MMIO data as instructions.

Every local instruction fetch outside IMEM is refused through the existing one-cycle error response path:
`local_is_fetch_i && !is_imem`. This includes DMEM, UART, GPIO, STATUS and NI MMIO; unmapped local fetches remain errors.
Ordinary data loads/stores are unchanged. The TMEM bridge already refuses remote instruction fetches.
The guarantee is **successful instruction fetches restricted to measured IMEM**. Existing fault/poison/IRQ semantics
remain unchanged; no stronger exception or control-flow-integrity guarantee is made. `rtl/riscv/addr_decode.sv` only.

## 5. Cost and risk (estimates until measured)

| Item | Estimate | Limit |
|---|---|---|
| Extra logic: one more Keccak / SHA3-256 instance in tile 3 | roughly +4,000 to +6,000 LUT (not measured) | full design must stay <= 47,550 LUT (hard stop); today 34,952 |
| Boot delay before the first attestation can start | about 8,000 clock cycles (0.16 ms at 50 MHz) | firmware waits up to about 0.8 s for the grant |
| Timing | today WNS +0.120 ns, WHS +0.009 ns; a new block can move this | must close at 20 ns; an N-13-style timing FAIL is a hard stop |
| Block RAM | unchanged (same memories, same second read port) | - |

Not covered by revision 10 (state as limitations): the measurement is
taken at boot and on a firmware attestation request, not continuously; keys and nonce remain demonstration constants.

## 6. Verification plan (new increment I-27; expected counts frozen in the registry before the first run)

| Job | What it proves |
|---|---|
| `meas_imem_hasher` unit bench against `hashlib` for at least 3 images (firmware v3, all-zero, pseudo-random) | The hasher is correct, including the 121-block length |
| Mutant: hasher skips one word | The unit bench detects a wrong digest (kill required) |
| Closure bench with revision-10 vectors | Boot, grant, memory access, refusal, revoke, re-attest still pass |
| **New negative test: one instruction changed at an address >= 0x40** | Attestation FAILS. This is the attack revision 9 could not detect |
| Negative control for that test: change inside the padding with the approved value regenerated | The failure is caused by the measurement, not by the bench |
| In-flight, contention, phase-sweep, lifecycle benches | No regression |
| Profile checker (`check_closure_profile.py`, profile 10) | Vectors match the pinned reference and `hashlib` |
| Board build with the release recipe and gate | LUT, WNS, WHS, firmware present |

Harness self-tests (`test_dual_lane.py`) run before the registry change; one registry regeneration for the group.

## 7. Files expected to change (none protected)

`rtl/riscv/meas_imem_hasher.sv` (new), `rtl/riscv/cpu_tile_noc.sv`, `sw/riscv/demo_fw_v3.S` / `.hex` (new),
`scripts/rv32_asm.py` or a small pad step, `scripts/gen_closure_profile.py`, `scripts/check_closure_profile.py`,
`vectors/closure_profile.svh` and `demo_fw_v3.svh` (generated), `synth/merged/pq_merged_board_top.sv` (constants and
firmware name), the merged benches' includes, `scripts/make_merged_sources.py` output, the registry, this document.
`pq_soc_merged_core.sv` only if a parameter must be passed through.

## 8. Questions for Kalash (sign by answering)

1. **Approve the `imem` field layout in section 3** (digest + length + base + zeros)? Recommended: yes.
2. **Tile 0 keeps the small reader** (its measurement is never used)? Recommended: yes.
3. **Fix D-02 in firmware v3 as in section 4**? Recommended: yes.
4. **Accept the estimated +4,000 to +6,000 LUT** on the understanding that I stop and report if the measured total
   exceeds 47,550 or timing does not close? Recommended: yes.

5. **Refuse all local instruction fetches outside IMEM**, including data memory and MMIO (section 4b)? Approved by Kalash 2026-11-14.

Signature: **rev 10 approved** — Kalash, 2026-11-13; approval recorded from the chat instruction quoted above. No changes to the proposed scope.
