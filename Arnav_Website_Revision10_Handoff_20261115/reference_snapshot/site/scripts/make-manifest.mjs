// Development-only evidence manifest: SHA-256 of every evidence file the site cites. Written next to the other dev metadata
// (data/evidence.manifest.dev.json) and never imported by the site, so it is not in public builds.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const repo = new URL('../../', import.meta.url);
const dev = JSON.parse(readFileSync(new URL('../data/evidence.dev.json', import.meta.url), 'utf8'));
const extra = { 'E-METH': 'NOC_PQATTEST.runs/impl_merged/gate/methodology_routed.rpt', 'E-BIT': 'NOC_PQATTEST.runs/impl_merged/pq_merged_board_top.bit', 'E-SRC-LIST': 'scripts/merged_bitstream_sources.tcl',
  'E-FW': 'sw/riscv/demo_fw_v2.hex', 'E-TOP': 'synth/merged/pq_merged_board_top.sv', 'E-PKG': 'rtl/dual_lane/NOC_PKG.sv', 'E-L2': 'rtl/dual_lane/noc_l2_auth_p7_i9.sv', 'E-VER': 'rtl/dual_lane/pq_rot_verifier.sv' };
const out = { generated: new Date().toISOString(), commit: execSync('git rev-parse HEAD', { cwd: repo }).toString().trim(), files: {} };
for (const [id, p] of Object.entries({ ...dev.paths, ...extra })) {
  const u = new URL(p, repo);
  if (!existsSync(u) || !statSync(u).isFile()) { out.files[id] = { path: p, sha256: null, note: 'not a single file (pattern, folder or out-of-tree run)' }; continue; }
  out.files[id] = { path: p, bytes: statSync(u).size, modified: statSync(u).mtime.toISOString(), sha256: createHash('sha256').update(readFileSync(u)).digest('hex') };
}
writeFileSync(new URL('../data/evidence.manifest.dev.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log('manifest:', Object.values(out.files).filter((f) => f.sha256).length, 'files hashed,', Object.values(out.files).filter((f) => !f.sha256).length, 'not hashable');
