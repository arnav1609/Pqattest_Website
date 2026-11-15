# Arnav's acceptance checklist

This package has been archive/hash/fact checked ONLY. Website edits/build/tests are YOUR pending work.
In your full existing site checkout (Node20+ per site README):

    cd site
    npm ci
    npm run validate:data
    npm run build
    npm test
    npm run build:single
    npm run manifest

Run only scripts available in your package version; current package.json snapshot is included. Playwright/browser
installation may be required on a new machine. Preserve existing test checks. Generate/update intentional screenshot
baselines only after inspecting changes; do not treat missing browsers or timeouts as passes.

- [ ] CURRENT cards show39962LUT/29187FF/20BRAM/63.0%/+0.182/+0.007 and15 Nov build; RC1 rows historical.
- [ ] Full16KB IMEM reading/hash depicted;64-byte endpoint field explained correctly; CPU0 does NOT get a new hasher.
- [ ] New SHA3 engine is inside CPU3 hasher; no duplicated endpoint/L2 engines or new memory/IP.
- [ ] Hierarchy-based inclusive area values replace old current sub-block numbers; no parent+child double counts.
- [ ] New image scenario is pre-boot alteration, rejection under original approval and acceptance under updated approval;
      labeled simulation evidence, not actual live hardware attack or on-chip self-modification.
- [ ] Local CPU0 refusal stops at bridge; XY routes and VC mappings remain correct; controller3/4 one hop.
- [ ] Hardware pending, formalNO, ASIC not started, final RC2 tag pending. Historical old-image PASS not reassigned.
- [ ]31 fresh jobs includes7 expected mutation kills; original I27 failure preserved, not hidden or relabelled.
- [ ] No exact boot/hash latency claim from estimated8000cycles; no inference from the diagnostic auth_cycle=-1 trace.
- [ ] Old physical baseline dated separately; current matched latency32/32vs28/27 correctly scoped.
- [ ] Warnings4 and methodology11+1 distinguished; no unsupported power/CDC/coverage-closure claim.
- [ ] Evidence IDs and graph/component references resolve; source manifest points to FWv3 and current reports.
- [ ] Public-safe validator passes: no machine paths, long hashes or development metadata in public bundle.
- [ ] Desktop/phone, light/dark, orbit/zoom/inspectors, walkthrough controls and prefers-reduced-motion checked.
- [ ] No stale first64-byte/34952/+0.120/+0.009/v2 labels outside clearly historical sections and quoted old evidence.
- [ ] Single-file artifact and deployed build regenerated from same edited source; update existing link only with owner access.
- [ ] Return build/test commands, real results and screenshots to Kalash. Do not claim successful tests not actually run.
