# Approved revision-10 scope and retained limitations

Approval: Kalash, 2026-11-13, recorded in 7ada59d1. Baseline: 97526015.
Source: `docs/EXECUTION_BLUEPRINT_20261113.md`, signed rev-10 contract, and
`reports/rtl_signoff_20261113/RTL_Signoff_Report_20261113.html`.
This records the blueprint disposition; it does not independently prove the findings unreachable.
HARDWARE_VALIDATED=NO, SOC_INTEGRATION_COMPLETE=NO, FORMAL_PROOF=NO.

| Finding | Approved disposition |
|---|---|
| D-01: only first 64 IMEM bytes measured | Implement full 16,384-byte SHA3-256 measurement on tile 3; encode digest/length/base in the unchanged 64-byte field. Prove a changed instruction beyond 0x40 is refused. |
| D-02: board button waits eventually fail | Firmware v3 uses unbounded revoke/re-attest waits; retain bounded grant wait and testbench watchdogs. |
| D-06 / R10-SCOPE-01: instruction fetch from DMEM and MMIO | Kalash approved IMEM-only local instruction fetches on 14 Nov. Refuse every local instruction fetch outside IMEM using the existing decoder error path; preserve data loads/stores. Production implementation and verification follow the scratch gate. |
| V-01 / V-02 | Replace tautological config check with DUT observation; require an injected flit handshake before asserting isolation. |
| D-03: simultaneous response/slot timeout | Document only. No NI edit. Reviewer's 16,384-cycle trigger and 459-cycle measured workload bound describe the qualified configuration, not a general proof. |
| D-04: unsolicited data to RoT may abort verification | Retain as availability limitation. Board raw injector remains tied off. Revisit destination policy before exposing it. |
| D-05: memory header received while front end busy | Retain the qualified one-authorized-requester/one-outstanding-request configuration; wider admission requires a separate review. |
| D-07: simultaneous trusted fail/GRANT | Retain and document bounded transient; no gate or verifier edits. |
| D-08..D-11: reusable crypto block corners | Do not change protected primitives. Hasher uses exactly 120 non-final 136-byte blocks plus one final 64-byte block; never a final full block. |
| D-12: use-before-declaration accepted with --relax | Retain Vivado's qualified relaxed compilation. Resolve portability in an ASIC adaptation, not this FPGA revision. |
| D-13: self/out-of-mesh traffic | Preserve current source/destination configuration; do not broaden routing inputs. |
| D-14: diagnostic clear/fault precedence | Document only; no diagnostic semantics change. |
| D-15: poison/UART/error-code corner behavior | Document only; no unapproved bridge, adapter or UART rewrite. |

No timed re-attestation, second-board attack link, exposed raw injection input, clock, pin,
packet-format, endpoint, verifier, L2, NI, mesh, or protected-file change is included.
Demo keys/nonces remain public provisioning. Full-IMEM hashing is boot/request driven.
Board validation and ASIC adaptation remain separate from simulation/FPGA implementation evidence.
