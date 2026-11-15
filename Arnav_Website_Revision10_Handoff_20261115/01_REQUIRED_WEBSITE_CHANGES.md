# Required changes

## 1. Current result cards and evidence

Replace CURRENT-build RC1/v2 figures with the owner MAIN GUI result of15 Nov2026,12:26:
- Profile10, firmware `demo_fw_v3`; use a friendly current-build ID such as R10-OWNER-GUI-20261115-1226.
- LUT39962 (~63.0% of63400), FF29187, BRAM36=20, DSP=0.
- WNS+0.182ns, WHS+0.007ns, TNS/THS0;20ns/50MHz; route errors0, DRC errors0, clean check_timing.
-0 implementation errors and0 critical warnings, BUT4 implementation warnings. Do not say zero warnings.
- Methodology report separately has11 XDCH-2 warnings and1 RTGT-1 advisory. Do not mix this with the4 run-log warnings.
- Hardware validation pending. Current maturity ROUTED, not HARDWARE_VALIDATED. No final RC2 tag yet.
- Retain12 Nov RC1 figures34952/25328/+0.120/+0.009 only as clearly HISTORICAL records; do not overwrite history.
- Old7 Nov owner board PASS is for its own earlier image, not proof for this revision.
- Four qualified physical builds match in resources/timing: two G4 release runs, GUI-copy run and actual main run.
  The15 Nov owner rerun also matches. Configuration payloads are identical; complete timestamped bit files differ.

Suggested current-build copy:
“Revision10 measures tile3's complete16KB instruction memory. The combined FPGA design uses39962 LUTs and meets
50MHz timing (setup slack+0.182ns, hold slack+0.007ns). This image has not yet been validated on the board.”

## 2. Measurement animation and security explanation

Replace every CURRENT “first64 IMEM bytes /64-byte boot window” claim with FULL16384-byte/4096-word measurement.
Keep the64-byte ENDPOINT FIELD: it is now encoded metadata, NOT a64-byte read of the program.
Pipeline: full IMEM -> dedicated meas_imem_hasher/SHA3-256 ->32-byte digest +4-byte lengthLE +4-byte baseLE +24 zero
bytes -> existing endpoint outer measurement SHA3(tileID ||16-byte config ||64-byte field) -> existing KMAC tag/response.
No wire-format or response/challenge size changes. Existing endpoint/RoT/L2/NoC hardware is not replaced.
Tile3 alone gets this added full-image SHA3 block. Tile0 retains its small reader and is never authorized.
Use a calm boot progress cue for4096 words;~8000 cycles/~0.16ms is an ESTIMATE, not a measured precise animation duration.
The walkthrough remains explanatory, not a cycle-accurate trace replay. Do not claim continuous runtime monitoring.

## 3. Execution boundary and firmware behavior

Successful local instruction fetches are allowed ONLY from IMEM. DMEM and UART/GPIO/STATUS/NI-MMIO fetches are refused;
normal data reads/writes stay unchanged. Remote fetches were already blocked. Do not call this general CFI or exception safety:
existing error/poison/IRQ handling remains unchanged. No new MPU/MMU/IP block was added; this is decoder logic.
Firmware v3 waits indefinitely for the revoke/re-attest buttons; grant wait and simulation watchdogs remain bounded.
Do not display a countdown that turns into FAIL merely because the user waits before pressing a button.

## 4. New simulation evidence / optional tamper illustration

An instruction at byte address0xD4 (212, beyond old64-byte window) was changed BEFORE BOOT in a separate image.
The changed image is rejected under the original approved measurement. With its independently regenerated approval,
the same changed image is accepted and commits memory. Do not depict a running CPU writing its own immutable IMEM.
This is a SIMULATION result, not a board attacker demo, and not the separate SPOOF/raw-packet injection scenario.

First I-27 was NOT PASSED; its approved-image bench checked RoT GRANT-sent before destination authorization.
The original failure was preserved. I-27-R2 uses the same6 assertions/bounds with correct event synchronization;
a dropped-GRANT control explicitly fails.31/31 jobs accepted fresh;7 scoped mutation kills. No timeout counted as pass/kill.
Avoid displaying “31 hardware tests” or “100% verified”. Existing compile warnings and historical coverage remain qualified.

## 5. Comparisons and claims

Matched CURRENT memory latency is still secure32/32 read/write cycles vs fixed research baseline28/27.
Four modes each use64 transfers. Include the supplied matched data for contended distributions and workload totals.
The fixed baseline area15814 LUT and timing+0.327/+0.028 are HISTORICAL earlier-profile measurements, not a fresh
revision10 matched physical build. Do not combine those with39962 into a supposedly controlled new area-overhead result.
Either show the historical area comparison as a dated separate study or withhold the new physical ratio pending matched builds.

Keep limitations: measurement boot/request-driven; public demo keys/nonce; onlytile3 attested; tile0 deliberately denied;
SPOOF port tied off in board image; one authorized requester/one outstanding request; no periodic re-attestation,
TRNG, side-channel protection, formal proof, ASIC silicon, ML-KEM/ML-DSA/NTT or second-board physical attack claim.
