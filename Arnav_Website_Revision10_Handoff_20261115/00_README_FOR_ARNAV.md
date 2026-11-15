# Arnav: revision-10 website update handoff

Prepared15 November2026 from live repository commit `8a6c4b57a0118da5e928b3e654cfc64ec325a9a9`. Kalash assigned website integration to you.
This ZIP contains verified facts, exact editing targets, current hierarchical area data and evidence.
It DOES NOT change or publish the website, and does not contain a new deployed site. Preserve your own changes.

Read in order:
1. `01_REQUIRED_WEBSITE_CHANGES.md` - complete change list, priorities and public wording.
2. `02_FILE_BY_FILE_MAP.md` and `stale_text_locations.tsv` - exact current files/JSON locations to inspect.
3. `data_for_integration/latest_verified_facts.public.json` - current facts, NOT a drop-in site schema.
4. `03_AREA_AND_3D_GUIDANCE.md` - measured block sizes and parent/child rules.
5. `04_VERIFICATION_AND_LIMITATIONS.md` - what may and may not be claimed.
6. `05_ACCEPTANCE_CHECKLIST.md` - commands and visual/content checks you must run after editing.
7. `evidence/` - actual gates, RTL snippets and current Vivado reports. Internal/development use only.

Latest hardware build:39962 LUT (~63.0% of63400),29187 FF,20 BRAM36,WNS+0.182ns,WHS+0.007ns.
Firmware v3/profile10, full16KB IMEM measurement. Actual MAIN GUI build completed15 Nov12:26 IST.
**Current image HARDWARE_VALIDATED=NO. No final rtl-rc2 tag has been issued.** No formal proof/ASIC claim.
Do not call this a hardware-validated RC2 release. You may update current FPGA implementation facts now while
retaining pending-board/final-freeze labels. Final board sign-off requires Kalash's later exact-image observations.

`reference_snapshot/` is a small READ-ONLY snapshot of the current website files for context, not a standalone runnable site.
Use your actual site repository. Keep charcoal/sand/electric-blue styling, light/dark/mobile and reduced-motion support.
No redesign, new IP, new CPU, new memory, AXI, TRNG or lattice cryptography is requested.

Privacy: public data currently rejects machine paths and long hashes. Do not import `developer_only/`, raw reports,
`evidence.dev.json` or manifests into public bundles. Keep full hashes in development metadata/evidence links as permitted.
The included public facts file itself contains no machine path or long hash. It still needs mapping to existing schemas.

Source/measurement dates are in the evidence; older source-header comments and RC1 documents may describe64 bytes/v2.
The approved rev10 contract and CURRENT code/gates govern. Never do a global replace of historical rows.
See `MANIFEST.json` for file hashes. No RTL was changed and no website build/test was executed while packaging.
