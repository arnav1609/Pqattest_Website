# Owner main-project GUI build - PASS (15 Nov2026,12:26 IST)

Confirmed from actual current main project and fresh run logs, not from a prior copy.
Active runs synth_merged / impl_merged; dl_gui_src73files, meas_imem_hasher.sv and demo_fw_v3.hex present.
Mesh post-hook linked17236 primitives and rewrote complete synthesis checkpoint. Both IMEMs initialized.
Final build:39962LUT,29187FF,20BRAM36,WNS+0.182ns,WHS+0.007ns,TNS/THS0,route/DRC0,clean check_timing.
Bitgen completed successfully;0 errors,0 critical warnings,4 warnings. No diagnostic suppression.
Warnings: vectorless reset activity affects power-estimate accuracy; Oracle tile-group/virtual-grid initialization;
headless DRC name option. Timing/routing/DRC/bitstream gates passed independently. No power accuracy claim.

Main image NOC_PQATTEST.runs/impl_merged/pq_merged_board_top.bit
SHA256:7a81ddf2c8f6c10bf5410f04dc5f55fc0fe2748575b3a85fc30f56c345fdd20e.
Configuration payload matches both G4 releases and GUI copy exactly:
54228bfc7b7536a48cb27e1538574199d7088fd4ff2f849664d141317204c3dd.
Whole-file hashes change with header timestamps; the old14 Nov8d951... image remains a historical record.

All requested revision10 source/firmware/build updates are present. Hardware programming/validation NOT performed.
Next: Kalash programs THIS exact image and returns UART/LED/revoke/re-attest observations. No new build needed.
HARDWARE_VALIDATED=NO, SOC_INTEGRATION_COMPLETE=NO, FORMAL_PROOF=NO. RC2 tag/site finalization await board record.
