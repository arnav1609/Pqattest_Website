# Current post-route areas and 3D guidance

Source:15 Nov12:22:56 Vivado2024.1 post-route-physopt hierarchical report, included in evidence.
Full hierarchy CSV is mechanical extraction from that report. Values are INCLUSIVE: parents include children.

| Block | LUT | FF | RAMB36 | Relationship |
|---|---:|---:|---:|---|
|Whole design|39962|29187|20|Total, not an additional scene block|
|CPU tile3/A|8117|6622|8|Includes whole-IMEM hasher below|
|Whole-IMEM hasher|5445|4897|0|Child of CPU tile3; includes its SHA3 engine|
|Hasher's SHA3 engine|5429|3516|0|Child of hasher, NOT a new separate top-level crypto block|
|CPU tile0/B|2566|1585|8|Keeps old small reader|
|PQ-Attest endpoint|6362|8081|0|Existing endpoint; separate from CPU hasher|
|Authenticated L2 link|6568|5921|0|Existing shared control-link crypto path|
|NoC mesh|10116|1916|0|All6 routers together, NOT per-router measurement|
|RoT verifier|5802|4621|0|Existing verifier|
|Shared tile2 memory|0|0|4|BRAM resources, no measured LUT footprint; do not hide it|

These selected blocks are NOT an exhaustive additive bill of materials. Remaining logic/wrapper/gates/NIs and
hierarchy sharing are in the full report. Do not invent a new measured “NI+gate” total by subtracting all rows.
Never add CPU8117 + its hasher5445 + its SHA35429: that triple-counts the same hardware.
For six router boxes, an equal10116/6=1686 LUT share is a DERIVED visualization allocation, not six measured router results.

Preserve3x2 coordinates, tile number y*3+x, XY (X first then Y), VC colors, six NIs/routers and all external-interface facts.
Tile3->tile2 request route3->4->5->2; reverse response2->1->0->3. CPU0's local refused request does not enter the mesh;
traffic from OTHER endpoints can still transit router0. Control3<->4 is one hop.

Draw new hasher INSIDE CPU A and connect its local measurement output to endpoint. Reuse existing IMEM; no new BRAM.
New whole-design net increase over12 Nov RC1 is5010 LUT /3859FF (derived difference, not isolated hasher area).
Keep geometry proportional to LUT where appropriate but label illustrative/conceptual FPGA logic layout, not placement,
physical die area, ASIC silicon or fabricated chip. Shared memory size should use a separate BRAM visual legend.

Keep charcoal/sand/electric-blue palette, restrained active-link lighting, readable inspectors, mobile fallback,
light/dark themes, reduced-motion support and a calm idle state. Technical accuracy takes priority over decoration.
