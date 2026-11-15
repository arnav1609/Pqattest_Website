# Findings and evidence boundaries

D-01:64-byte-only coverage limitation addressed in qualified rev10 by full16384-byte hashing, independent three-image
hashlib checks and beyond64-byte modified-instruction rejection with an approved-image control.
D-02:firmware button-wait timeout addressed by v3's unbounded revoke/re-attest waits. Grant wait stays bounded.
D-06:successful fetches outside measured IMEM prevented, including MMIO; verified at decoder and realCPU level
with guard-removal mutation. This does not promise general CFI or stronger poison/exception semantics.
V-01/V-02: DUT-observed measurement check and actual injected-flit acceptance required in integration verification.

D-03/D-04/D-05/D-07..D-15 were NOT all repaired or proven unreachable. Approved dispositions are in the supplied
R10_SCOPE_AND_LIMITATIONS report: NI response/timeout race, availability behavior, one-requester scope, transient
trusted-fail/GRANT, reusable crypto corners, declaration-order portability, routing-input restrictions and diagnostic/
poison/UART corner semantics remain documented or scoped/deferred. Do not render them as a green “all bugs fixed”.
Do not promote16,384-vs459 cycle observations into a general theorem.

Coverage: phase-0 baseline was measured BEFORE new RTL. Closure statement77.961%,branch57.0144%,condition27.384%,
toggle16.78%; other benches in R10_COV report. This is not current full-rev10 coverage closure, not formal proof,
and not a single project coverage percentage. Either show a clearly dated baseline-only subsection or state current
rev10 coverage closure was not established. Replace the site's blanket “coverage never measured” with this distinction.

Warnings: latest implementation run has4 warnings (vectorless reset activity/power accuracy, device virtual grid,
headless DRC name option). No errors or critical warnings. Methodology has11warnings+1advisory separately.
Existing simulation compiler/declaration/enum diagnostics are retained. No warning suppression was used.
Fresh CDC-specific analysis was not re-run in this handoff; old E-CDC results are historical unless separately proven
configuration/source-equivalent. Do not automatically assign a current date to them. No clocks/pins/CDC were changed.

Status for current15 Nov image: FPGA implementation and timing PASS; hardware pending; formalNO; ASIC not started.
Prior7 Nov board PASS remains historical and non-itemised. There is no signed current-board record or rtl-rc2 tag yet.
Demo keys/nonce remain fixed/public; measurement boot/request-driven, not continuous. SPOOF board input tied off.
No new lattice cryptography, TRNG, side-channel protection or silicon claim. Never interpret no known new failure as zero bugs.

Bit reproducibility: current owner image SHA is in developer_only/provenance.json. Release files have different build
TIME headers but identical programmed configuration payloads; binary comparison evidence is included. Hardware record
must cite the WHOLE-FILE hash of the exact image actually programmed, not merely a shared payload hash.
