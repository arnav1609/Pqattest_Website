// Milliseconds on the illustrative clock at 1×. Each arrival has a reading hold.
export const story = [
  { id: 'setup', name: 'Setup', event: 'acc-1', start: 0, arrival: 3000, end: 3000 },
  { id: 'write', name: 'Write', event: 'acc-1', start: 3000, arrival: 9000, end: 10000 },
  { id: 'ack', name: 'ACK', event: 'acc-2', start: 10000, arrival: 14000, end: 15000 },
  { id: 'refusal', name: 'Refusal', event: 'ref-1', start: 15000, arrival: 22000, end: 25000 },
];
export const storyLength = story[story.length - 1].end;

// Field notes stay readable while the live caption tracks the moving packet.
export const fieldNotes: Record<string, [string, string]> = {
  setup: ['Find the two processors and their destination', 'Tile 3 and Tile 0 both know the address of shared memory on Tile 2. Follow the first request to see what a grant lets the processor do. Then watch the second processor try the same address without a grant.'],
  'boot-1': ['Look inside Tile 3 before any memory traffic starts', 'The measurement engine reads all 16 KiB of instruction memory and computes a SHA3-256 fingerprint. Tile 4 will use that evidence when it evaluates the response. Computing the fingerprint alone does not grant access.'],
  'att-1': ['Follow the challenge from Tile 4 to Tile 3', 'The root of trust starts this exchange with a fresh challenge. The endpoint must answer this particular challenge, so a reply saved from an earlier exchange is insufficient. Shared memory is not the destination of this packet.'],
  'att-2': ['Follow the evidence back to the verifier', 'Tile 3 returns its firmware measurement and a keyed KMAC128 tag. The tag binds the response to the challenge. Tile 4 checks the response before deciding whether to send a grant.'],
  'att-3': ['Watch the permission state on Tile 3', 'The grant travels from the verifier back to the measured processor. Once applied, it allows the bridge to forward a memory request. The grant itself does not write a value into memory.'],
  'acc-1': ['Follow the number and its destination separately', '0xC0DE5A5A is the number to save. 0x22000100 is the address where it belongs. Routers 3, 4, 5 and 2 forward the packet. Tile 2 is where the write takes effect.'],
  'acc-2': ['Trace the reply back to its sender', 'The ACK is a receipt for the write. It takes the return route through routers 2, 1, 0 and 3. Passing router 0 does not give CPU B on Tile 0 permission to use memory.'],
  'acc-3': ['Watch Tile 3 ask for the contents of the same address', 'The write receipt confirmed completion. The firmware now asks for the stored number so it can check the value independently. This request travels toward Tile 2 again.'],
  'acc-4': ['Compare the returning word with the original write', 'This reply carries the stored data. Tile 3 compares it with 0xC0DE5A5A. A match is what leads to T3 PASS on the serial output. The earlier ACK alone could not establish that match.'],
  'ref-1': ['Keep your eye on the bridge beside CPU B', 'Tile 0 tries to write 0xB0B0B0B0. Its local permission check fails before a packet can enter router 0. The mesh stays quiet and Tile 2 retains the word from Tile 3.'],
  'rev-1': ['Distinguish the decision from its delivery', 'Tile 4 sends REVOKE to withdraw Tile 3’s grant. Watch the control message cross the mesh and the authorization state change. The next event tests a new write after revocation.'],
  'rev-2': ['Compare Tile 3 with its earlier successful write', 'The processor and memory address are the same, but the grant is gone. The bridge refuses the new request locally. Determining the precise cutoff for an earlier write still in flight is a separate research question.'],
  'for-1': ['Watch the boundary at Tile 5', 'In this simulation, an injected packet reaches the quarantine block and is rejected. The external injection port is tied off in the board image, so this event illustrates the simulation test specifically.'],
};
export function storyFrame(ms: number) {
  const time = Math.max(0, Math.min(ms, storyLength));
  const index = story.findIndex(beat => time < beat.end);
  const beat = story[index < 0 ? story.length - 1 : index];
  const progress = Math.min(1, (time - beat.start) / (beat.arrival - beat.start));
  return { beat, time, progress, arrived: time >= beat.arrival };
}
export const readingSteps = [
  { name: 'Meet the two processors', text: 'The chip is divided into tiles. Two tiles contain processors. Both programs ask to save a number at the same address in shared memory on Tile 2. Only Tile 3 has permission.' },
  { name: 'Follow the write', text: 'Tile 3 puts the address and value in a packet, like a parcel with a delivery address. Routers 3, 4, 5 and 2 pass it along. Tile 2 stores the value when the packet arrives.' },
  { name: 'Follow the receipt', text: 'Tile 2 sends a small reply called an acknowledgment, or ACK. It goes through routers 2, 1, 0 and 3. When Tile 3 receives it, the processor knows its write finished.' },
  { name: 'Watch the other processor', text: 'Tile 0 asks to write a different value. Its bridge checks permission before putting a packet on the network. The check fails, so memory keeps the value from Tile 3.' },
];

export function storyNarration(id: string, node: string, arrived: boolean): [string, string] {
  if (id === 'setup') return ['Two processors want to save a number.', 'Both use the same memory on Tile 2. Tile 3 has permission. Watch what happens when each processor tries to write.'];
  if (id === 'refusal') return arrived
    ? ['Tile 0’s bridge blocks the write.', 'Its request stops here. No packet entered the network, so the value stored by Tile 3 stays in memory.']
    : ['Tile 0 tries the same address.', 'It wants to save a different number, 0xB0B0B0B0. Watch its local bridge, where permission is checked.'];
  if (id === 'write') {
    if (arrived) return ['Memory stores the value.', 'Tile 2 has received the packet and saved 0xC0DE5A5A at address 0x22000100. Tile 3 still needs a reply.'];
    if (/^r\d$/.test(node)) return ['The write is crossing the network.', 'Each router passes the packet to its neighbor. The blue marker carries the same number all the way to Tile 2.'];
    if (['ni2','memfe','bram'].includes(node)) return ['The packet is reaching Tile 2.', 'The memory interface takes the address and number from the packet so shared memory can store it.'];
    return ['Tile 3 sends a write.', 'Its bridge checks permission and packs the number 0xC0DE5A5A with its destination address. Follow the blue marker.'];
  }
  if (arrived) return ['Acknowledgment received at Tile 3.', 'The reply has reached the processor’s bridge. Tile 3 now knows that memory accepted its write.'];
  if (/^r\d$/.test(node)) return ['The receipt is crossing the network.', 'Follow the marker labeled ACK. The routers carry this confirmation back to the processor that sent the write.'];
  if (['ni3','cpuA.bridge'].includes(node)) return ['The reply is reaching Tile 3.', 'The network interface passes the receipt to the processor’s bridge.'];
  return ['Tile 2 sends an ACK.', 'ACK means acknowledgment. It is a receipt telling Tile 3 that shared memory has stored the number.'];
}
