import arch from '../data/architecture.json';
import scen from '../data/scenarios.json';
import evid from '../data/evidence.json';
import res from '../data/results.json';

export type Maturity = 'PLANNED' | 'SPECIFIED' | 'RTL_IMPLEMENTED' | 'SIM_VERIFIED' | 'SYNTHESIZED' | 'ROUTED' | 'HARDWARE_VALIDATED';
export type Currency = 'CURRENT_BUILD' | 'HISTORICAL' | 'UNKNOWN';
export type Confidence = 'DIRECT' | 'DERIVED' | 'UNVERIFIED';
export type Representation = 'LOGICAL' | 'CONCEPTUAL' | 'PHYSICALLY_EVIDENCED';
export type VcId = 'vc0' | 'vc1' | 'vc2' | 'local';

export interface Geometry { x?: number; z?: number; w?: number; d?: number; h?: number; slot?: number }
export interface Metrics { lut?: number; ff?: number; bram?: number; lutShare?: number; note?: string }
export interface Component {
  id: string; name: string; type: string; tileId: number | null; parentId: string | null; modulePath: string;
  representation: Representation; maturity: Maturity; currency: Currency; confidence: Confidence;
  clockDomain: string; resetDomain: string; placementBasis: string; geometryRule: string;
  evidenceRefs: string[]; interfaces: string[]; scenarioRefs: string[]; metrics: Metrics; geometry: Geometry;
  summary: string; detail?: string[]; adjacency: string[]; coordinates: string; ports?: [string, string][];
}
export interface Ev { actor: string; who: string; plain: string; matters: string; id: string; label: string; path: string[]; vc: VcId; outcome: 'accepted' | 'refused' | 'rejected'; what: string; why: string; focus: string[]; authAfter?: boolean; uart?: string; led?: string; memoryAction?: string }
export interface Scenario { id: string; name: string; where: string; summary: string; authStart: boolean; evidenceRefs: string[]; events: Ev[] }
export interface EvidenceRef { id: string; title: string; kind: string; date: string; currency: Currency; confidence: Confidence; says: string; limits: string }

const TYPE_SUMMARY: Record<string, string> = {
  router: 'One of the six mesh routers. It has five ports (north, south, east, west and local), routes in X first and then Y, and passes packets on as a train of 32-bit flits under credit-based flow control. Each port has three virtual channels with 4-flit buffers.',
  ni: 'The network interface joins a tile to its router. Each tile has an authorization gate, and incoming packets go through an ingress parser.'
};
const d = arch.defaults as unknown as Partial<Component>;
export const build = arch.build;
export interface Tile { id: number; x: number; y: number; role: string; name: string; primary: string; purpose: string; does: string[] }
export const tiles = arch.tiles as Tile[];
export const edges = arch.edges as { a: string; b: string; kind: string }[];

export const components: Component[] = (arch.components as unknown as Partial<Component>[]).map((c) => {
  const t = tiles.find((x) => x.id === c.tileId);
  const m = { ...d, ...c } as Component;
  if (!m.summary) m.summary = TYPE_SUMMARY[m.type] ?? '';
  if (m.type === 'router') {
    m.geometryRule = 'Footprint from an equal share of the mesh total (10,230 LUT / 6 routers): an estimated allocation, not a per-router measurement';
    m.detail = ['Whole mesh: 10,230 LUT, 1,916 flip-flops (measured).', 'Virtual channels: VC0 memory requests, VC1 memory responses, VC2 attestation control.'];
  }
  m.coordinates = t ? `tile ${t.id} at (x ${t.x}, y ${t.y})` : 'not tied to one tile';
  m.adjacency = edges.filter((e) => e.a === m.id || e.b === m.id).map((e) => (e.a === m.id ? e.b : e.a));
  return m;
});
export const byId = new Map(components.map((c) => [c.id, c]));
export const scenarios = scen.scenarios as unknown as Scenario[];
export const vcInfo = scen.vc as Record<VcId, { name: string; carries: string; shape: string }>;
export const playbackMode = scen.modeNote;
export const evidence = new Map((evid.refs as EvidenceRef[]).map((e) => [e.id, e]));
export const results = res;

export const LABEL: Record<string, string> = {
  PLANNED: 'Planned', SPECIFIED: 'Specified', RTL_IMPLEMENTED: 'RTL written', SIM_VERIFIED: 'Simulated', SYNTHESIZED: 'Synthesised', ROUTED: 'Placed and routed', HARDWARE_VALIDATED: 'Run on the board',
  CURRENT_BUILD: 'Current build', HISTORICAL: 'Earlier build', UNKNOWN: 'Unknown build',
  DIRECT: 'Read from the report', DERIVED: 'Derived from reports', UNVERIFIED: 'Not independently checked',
  LOGICAL: 'Logical view', CONCEPTUAL: 'Conceptual drawing', PHYSICALLY_EVIDENCED: 'From physical data'
};
export const fmt = (n: number) => n.toLocaleString('en-US');
/** Top-level selectable parent of a component (a CPU tile for its sub-blocks). */
export const rootOf = (id: string) => { const c = byId.get(id); return c && c.type === 'sub' && c.parentId ? c.parentId : id; };
