# Integration map (current repository snapshot)

| File | Required edit |
|---|---|
| site/data/results.json | Add15 Nov current build; move12 Nov entries to HISTORICAL; latest metrics/status/warnings; keep old board result historical; split historical physical baseline from current matched latency. |
| site/data/architecture.json:build | Friendly new build ID/date/profile, retain part/clock/top. |
| architecture.json:tiles[id=3].detail | Full16KB firmware measurement and IMEM-only successful fetch guarantee; keep limits. |
| architecture.json:components[id=die] |39962LUT/29187FF/20BRAM and~63.0%; timing+0.182/+0.007. |
| architecture.json:components[id=cpuA] | Inclusive8117LUT/6622FF/8RAMB36; includes new hasher. |
| architecture.json:components[id=cpuA.meas] | RetainID if convenient for existing links; rename Measurement window reader -> Whole-IMEM hasher, correct hierarchy/summary; inclusive5445LUT/4897FF/0BRAM. |
| architecture.json:components[id=cpuA.mem], cpuB and crypto/mesh nodes | Read fresh hierarchy CSV/report; do not leave old component figures tagged CURRENT. CPU B2566LUT/1585FF/8BRAM; endpoint6362; L26568; mesh10116; RoT5802. |
| architecture.json:endpoint summaries | Replace old raw64-byte IMEM window with encoded64-byte field derived from full16KB. Endpoint protocol remains unchanged. |
| site/data/scenarios.json:boot | Read4096 words, full-image hash, encoded field; keep local edge direction and schema IDs valid. Optional tamper scenario is a pre-boot alternate image, not rawSPOOF packets. |
| site/src/howAnim.ts | Hardcoded first64-byte narration and “IMEM, first64B” label must change. Show full image ->hasher->endpoint; no continuous monitoring claim. |
| site/src/main.ts | Hardcoded KPI slack+0.120/+0.009 and hold-margin paragraph ->+0.182/+0.007; prefer data-derived strings to prevent divergence. |
| site/src/scene.ts, model.ts | Update geometry/inspector semantics for much larger cpuA.meas; expose nested SHA3 without double-counting CPU/endpoint engines. Do not invent a fabricated ASIC floorplan. |
| site/data/evidence.json | E-GATE/E-UTIL/E-GATES/E-MATCHED titles/dates/current references ->new evidence. Preserve E-HW as old-image evidence. Historical CDC analysis must not be re-dated as fresh. |
| site/data/evidence.dev.json | Update commit/build hashes privately, FWv3, I27R2 paths. rtlTag must not falsely become rtl-rc2: tag remains pending. |
| site/scripts/make-manifest.mjs | E-FW must use demo_fw_v3.hex; add new hasher/profile evidence if useful; point to supplied current evidence. |
| site/data/evidence.manifest.dev.json | Regenerate AFTER evidence paths updated; bundled reports can replace out-of-tree paths. Manifest is developer-only. |
| site/tests/*.spec.ts and screenshots | Update only expected intentional labels; keep assertion strength/accessibility/graph/XY/reduced-motion checks. |
| single-file export / deployment | Rebuild exports after source changes; update existing deployment through your own authorized workflow. No deployment performed by this handoff. |

stale_text_locations.tsv is an exact line-level scan of the present files, not an instruction to replace all historical text.
Keep stable component IDs or update graph edges, focus IDs, scenarioRefs and evidenceRefs together. Current validator checks them.
It also rejects long hashes and local machine paths in PUBLIC data. Keep provenance/hash values in developer-only metadata.
