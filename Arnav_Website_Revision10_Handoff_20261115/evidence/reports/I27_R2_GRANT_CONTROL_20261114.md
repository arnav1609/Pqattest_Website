# I-27-R2 grant-control qualification (partial gate)

Commit: fd6079f0; source changes frozen in 1db787bb. 14 Nov 2026.
Run: dual_lane_10_20261114_114143_ce2c2eba.
HARDWARE_VALIDATED=NO, SOC_INTEGRATION_COMPLETE=NO, FORMAL_PROOF=NO.

- i27r2_attack_approve_changed: PASS_FRESH, six checks, zero errors, 179040 ns.
- i27r2_attack_control_drop_grant: PASS_FRESH, six checks, two scoped errors, KILLED, 3152360 ns.
  Explicit failures AT_CONTROL_GRANTED and AT_CONTROL_MEMORY_COMMIT; no watchdog timeout.
- Profile, board-profile, release controls and mutation-adapter tests also PASS_FRESH (six accepted jobs total).

The original failed run remains unchanged. Correcting only the test's event synchronization made the positive
case pass; dropping destination authorization then made the same assertions fail as required. Production RTL,
reference artifacts, six-check count, 100000/50000-cycle bounds and 10 ms watchdog are unchanged.
Static assertion comparison: reports/i27r2_assertion_preservation_20261114.json.

The diagnostic authorization_cycle field samples pre-NBA state and may remain -1 at the negedge print before
its next monitor edge. It is not used as an oracle or latency result. The actual authorized[3] assertion and
memory-commit checks are the evidence; no grant-arrival latency is claimed from that trace.

Full 31-job requalification, physical implementation, release, GUI and hardware gates remain pending.
