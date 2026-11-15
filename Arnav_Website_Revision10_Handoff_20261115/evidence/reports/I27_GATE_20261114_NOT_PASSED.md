# I-27 qualification gate — NOT PASSED (14 Nov 2026)

- Commit: abc90d1d.
- Accepted/fresh/reused: 27 / 27 / 0 of 30 jobs. One INVALID functional result; two dependent jobs BLOCKED.
- Current full-subsystem LUT/WNS: NOT MEASURED in this qualification; board job correctly withheld.
- Open blocker: approved-changed-image control checks destination authorization at RoT GRANT-send completion.
- Next dependency: versioned same-count test synchronization and dropped-GRANT negative control, then fresh requalification.
- HARDWARE_VALIDATED=NO, SOC_INTEGRATION_COMPLETE=NO, FORMAL_PROOF=NO.

Evidence: reports/dual_lane_10_20261114_073825_0fc50ad4; command python -E scripts/dual_lane.py run --select I-27.
All 27 completed accepted jobs are PASS_FRESH. No stale result was relabelled.

Failing job i27_attack_approve_changed: checks 6, errors 1, RESULT FAIL, 179040 ns.
Only AT_CONTROL_GRANTED failed. Changed-image hashing, independent complete response, actual memory commit and
no unauthorized writes passed. Tampered-image rejection separately passed all 6 checks.

Source-level failure mechanism: pq_rot_verifier.sv:142 raises grant_done at the outgoing handshake. The GRANT
must subsequently traverse the NoC and authenticated ingress before noc_attest_gate.sv:47 raises authorized.
The original bench sets granted_seen on either grant_done or authorized (line 37), breaks its loop on that flag
(line 61), then immediately requires authorized[3] (line 64). It therefore samples a later event too early.
Runtime cycle tracing in the versioned test will verify the separation; no production RTL change is proposed.
The original failing bench, frozen count, result and reference artifacts are preserved.

I-27-R2 retains all six assertions and the original 100000-cycle wait budget, waits for actual destination
qualification in the approved-image mode, and adds a separate mutation that drops destination authorization.
All I-27 tests will run under new IDs with fresh identities; no historical record will be relabelled.
A design or signed-contract change, should one prove necessary, still requires the project's hard stop.

Passed scope: hasher9 + skip-word kill; decoder19 + guard-removal kill; actual CPU MMIO3 + guard-removal kill;
closure14 and independent lifecycle14; remote-error6; in-flight6; contention8; phase-sweep56; their three fault
controls; tampered-image reject6; I9 integration13; profile/release/project controls; all four matched workloads
and their comparison collector. Final release, GUI and hardware validation have not run for this revision.
