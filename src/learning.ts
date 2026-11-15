// learning.ts — Comprehensive beginner-friendly educational explanations, analogies, and glossary.
// Designed so that even someone who has never studied electronics, computer architecture,
// VLSI, cybersecurity, or cryptography can understand every step of the demonstration.

export type Mode = 'presentation' | 'learning';

export interface GlossaryEntry {
  term: string;
  acronym?: string;
  category: 'Architecture' | 'Security' | 'Hardware' | 'Networking';
  def: string;
  analogy: string;
  inThisChip: string;
}

export interface TileLearning {
  tileId: number;
  name: string;
  analogyTitle: string;
  analogyText: string;
  whatIsIt: string;
  responsibility: string;
  whyNeeded: string;
  interaction: string;
  infoEnters: string;
  whatHappensInside: string;
  infoLeaves: string;
  securityBenefit: string;
  ifCompromised: string;
}

export interface EventLearning {
  eventId: string;
  // 5-Part Beginner Breakdown
  whatIsHappening: string;
  whyHappening: string;
  howItWorks: string;
  analogy: string;
  whatHappensNext: string;
  realWorldSignificance: string;
  // Security Scenario Audit
  attemptedAction: string;
  initiatedBy: string;
  checksPerformed: string;
  checkingComponent: string;
  resultStatus: 'Accepted' | 'Refused locally' | 'Rejected at quarantine';
  resultCategory: 'ok' | 'fail' | 'warn' | 'info';
  whyResult: string;
  withoutSecurity: string;
}

export interface HowStepLearning {
  stepIndex: number;
  title: string;
  whatIsHappening: string;
  whyHappening: string;
  howItWorks: string;
  analogy: string;
  whatHappensNext: string;
  realWorldSignificance: string;
}

// ---------------------------------------------------------------- GLOSSARY
export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'System-on-Chip (SoC)',
    acronym: 'SoC',
    category: 'Architecture',
    def: 'A complete computer built entirely onto a single silicon chip, combining processors, memory, and communication pathways on one piece of silicon.',
    analogy: 'Like a self-contained modern city built inside a single dome, containing power plants, residential homes, roads, and security stations.',
    inThisChip: 'Our SoC prototype contains 6 interconnected blocks (tiles) on an FPGA chip running at 50 MHz.'
  },
  {
    term: 'Central Processing Unit (CPU)',
    acronym: 'CPU',
    category: 'Hardware',
    def: 'The computational brain of a computer that reads instructions from memory and executes them step by step.',
    analogy: 'Like an office worker who reads instructions from a checklist and carries them out one by one.',
    inThisChip: 'Tiles 0 and 3 each have an open-source RISC-V PicoRV32 processor running demo firmware.'
  },
  {
    term: 'RISC-V',
    category: 'Architecture',
    def: 'An open-standard, royalty-free computer instruction set architecture that anyone can use to build custom processors.',
    analogy: 'Like an open universal language and dictionary for computers that anyone is allowed to speak without paying licensing fees.',
    inThisChip: 'Both CPU A and CPU B use the standard 32-bit RISC-V integer (RV32I) instruction set.'
  },
  {
    term: 'Network-on-Chip (NoC)',
    acronym: 'NoC',
    category: 'Networking',
    def: 'A miniature packet-switched communication network fabricated directly on the chip to let different components exchange data like computers on the internet.',
    analogy: 'Like a building-wide pneumatic tube mail system where labeled capsules travel between offices along dedicated hallways.',
    inThisChip: 'A 3-by-2 grid (mesh) of routers connecting the 6 tiles using 32-bit packet communication.'
  },
  {
    term: 'Mesh Topology',
    category: 'Networking',
    def: 'A grid network arrangement where each router is directly connected to its immediate North, South, East, and West neighbors.',
    analogy: 'Like a city street grid where you can navigate from block to block by turning North, South, East, or West at intersections.',
    inThisChip: 'The 6 tiles form a 3-column by 2-row grid connected by 7 bidirectional inter-router links.'
  },
  {
    term: 'Packet',
    category: 'Networking',
    def: 'A structured bundle of digital data packaged with destination addresses, control flags, and payload data so it can travel across a network.',
    analogy: 'Like a postal envelope stamped with the sender address, destination address, and sealed with a message inside.',
    inThisChip: 'Messages like memory read/writes and security challenges travel as packets through the on-chip routers.'
  },
  {
    term: 'Flit (Flow Control Digit)',
    category: 'Networking',
    def: 'The smallest individual segment of a packet that can be transmitted over a physical communication wire in a single clock cycle.',
    analogy: 'Like the individual cars of a freight train; together they form the train (packet), but they move along the track in sequence.',
    inThisChip: 'Packets are divided into 32-bit flits transmitted sequentially across the router links.'
  },
  {
    term: 'Virtual Channel (VC)',
    category: 'Networking',
    def: 'Independent, parallel traffic lanes sharing the same physical wire, ensuring one type of traffic cannot block another.',
    analogy: 'Like having separate bus lanes, ambulance lanes, and regular car lanes on the same physical roadway.',
    inThisChip: 'VC0 carries memory requests, VC1 carries memory responses, and VC2 carries high-priority attestation security control packets.'
  },
  {
    term: 'Wormhole Routing',
    category: 'Networking',
    def: 'A routing technique where the front of a packet (the head flit) carves a path through routers, and the remaining flits follow behind immediately without waiting for the entire packet to be buffered.',
    analogy: 'Like a fire hose where water follows the nozzle through pipes without waiting for the whole hose to fill up first.',
    inThisChip: 'Routers use wormhole flow control with 4-flit buffers per port to minimize silicon area and latency.'
  },
  {
    term: 'XY Routing',
    category: 'Networking',
    def: 'A deterministic path-finding rule: packets always travel horizontally (along the X-axis) first until reaching the correct column, then vertically (along the Y-axis) to the destination row.',
    analogy: 'Like navigating Manhattan: walk horizontally along the Street first, then walk vertically along the Avenue to reach your building.',
    inThisChip: 'Prevents communication deadlocks where packets could otherwise circle each other in endless loops.'
  },
  {
    term: 'Root of Trust (RoT)',
    acronym: 'RoT',
    category: 'Security',
    def: 'A secure, unassailable hardware controller that serves as the foundational starting point for all trust and security decisions on the chip.',
    analogy: 'Like a high-security embassy desk with a master passport database that determines who is genuine and who is not.',
    inThisChip: 'Tile 4 acts as the RoT Verifier, challenging Tile 3, evaluating cryptographic proofs, and issuing GRANT/REVOKE commands.'
  },
  {
    term: 'Hardware Attestation',
    category: 'Security',
    def: 'A cryptographic verification process where an electronic component proves its true identity and untampered software state to another component.',
    analogy: 'Like an employee presenting their unforgeable biometric security badge and cryptographic token before being admitted to a bank vault.',
    inThisChip: 'Tile 3 hashes its firmware code with SHA3-256 and proves to Tile 4 that its software has not been altered.'
  },
  {
    term: 'Authentication',
    category: 'Security',
    def: 'The process of verifying that a message or component really comes from the genuine entity it claims to be from, rather than an imposter.',
    analogy: 'Checking the photo, watermark, and holographic seal on a passport to ensure it is not a counterfeit.',
    inThisChip: 'Layer-2 link authentication uses a 128-bit KMAC tag on security packets to ensure they were not faked or tampered with.'
  },
  {
    term: 'Authorization',
    category: 'Security',
    def: 'Determining whether an authenticated component is actually allowed to perform a specific privileged action, such as accessing shared memory.',
    analogy: 'Even if your passport proves who you are (authentication), you still need an active security clearance visa to enter the vault (authorization).',
    inThisChip: 'Tile 3 receives an explicit GRANT packet from the Root of Trust before its network bridge and the Shared Memory allow it to read/write.'
  },
  {
    term: 'Firmware',
    category: 'Hardware',
    def: 'Low-level software program stored directly inside a hardware component that runs automatically when power is turned on.',
    analogy: 'Like the built-in operating code programmed into a digital microwave or washing machine that tells it how to operate.',
    inThisChip: 'The startup program stored in the 16KB instruction memory of the processor (demo_fw_v3 in RV32I assembly).'
  },
  {
    term: 'Cryptographic Hash (SHA3-256)',
    category: 'Security',
    def: 'A one-way mathematical function that converts any amount of data into a fixed-length 256-bit digital fingerprint. If even a single bit of the original data changes, the resulting hash changes completely.',
    analogy: 'Like an unforgeable digital DNA sample of a document; altering a single comma creates a completely different DNA profile.',
    inThisChip: 'The dedicated meas_imem_hasher hashes Tile 3’s complete 16KB instruction memory to generate a tamper-evident measurement.'
  },
  {
    term: 'KMAC128 (Keyed Message Authentication Code)',
    category: 'Security',
    def: 'A cryptographic algorithm based on SHA3 that uses a secret key to create a tamper-proof digital seal on a message.',
    analogy: 'Like stamping an official document with a royal wax seal using an exclusive, secretive signet ring.',
    inThisChip: 'Used to authenticate packets between Tile 3 and Tile 4 so no unauthorized entity can forge attestation messages.'
  },
  {
    term: 'Post-Quantum Cryptography (PQC)',
    acronym: 'PQC',
    category: 'Security',
    def: 'Next-generation cryptographic algorithms engineered to resist attacks from future quantum computers, which could easily crack conventional RSA and ECC encryption.',
    analogy: 'Like upgrading from standard metal locks to quantum-proof biometric vaults before thieves invent quantum lockpicks.',
    inThisChip: 'The prototype architecture was designed for post-quantum attestation; this FPGA build implements the foundational SHA3/KMAC symmetric pipeline.'
  },
  {
    term: 'Cryptographic Nonce / Challenge',
    category: 'Security',
    def: 'A unique, fresh random or sequential number used once in a cryptographic exchange to guarantee that old, intercepted messages cannot be re-sent by an attacker.',
    analogy: 'Like a security desk asking you today’s randomly chosen daily secret password rather than a password you used yesterday.',
    inThisChip: 'Tile 4 generates a fresh 224-bit challenge nonce so an adversary cannot record an old valid response and replay it later.'
  },
  {
    term: 'Replay Attack',
    category: 'Security',
    def: 'A cyberattack where an eavesdropper records a valid message previously sent across a network and re-transmits it later to trick the system.',
    analogy: 'Like recording someone saying "Unlock the front door" on tape and playing it back next to the voice-activated lock at midnight.',
    inThisChip: 'Defeated by embedding 80-bit epochs, 64-bit sequence numbers, and fresh challenge nonces in every security packet.'
  },
  {
    term: 'Ingress Quarantine',
    category: 'Security',
    def: 'An isolated staging buffer at the entrance to a network where incoming external packets are detained and inspected before being allowed onto the internal bus.',
    analogy: 'Like an airport customs decontamination room where incoming international baggage is scanned before entering the main terminal.',
    inThisChip: 'Tile 5 contains an Ingress Quarantine that holds packets from the untrusted SPOOF port and rejects forged messages.'
  },
  {
    term: 'Spoofing & Forged Packet',
    category: 'Security',
    def: 'An attack attempt where a malicious sender fabricates a fake packet with a falsified sender address or invalid cryptographic credentials.',
    analogy: 'Like printing a counterfeit letter on stolen company letterhead pretending to be the CEO asking for money.',
    inThisChip: 'Demonstrated in Scenario 6, where fake packets injected at the untrusted port are detected and dropped immediately.'
  },
  {
    term: 'Bus Bridge (Network Bridge)',
    category: 'Hardware',
    def: 'A hardware adapter module inside a tile that converts processor memory bus transactions (like Wishbone or AXI) into network packets, and enforces local access permissions.',
    analogy: 'Like a security gatehouse located directly outside an office building that stops unauthorized employees from driving onto the highway.',
    inThisChip: 'The bridge inside CPU B (Tile 0) stops memory requests locally, so untrusted processors never transmit even a single packet onto the network.'
  },
  {
    term: 'Memory Front End',
    category: 'Hardware',
    def: 'A security wrapper placed directly in front of the shared memory storage that checks the sender’s authorization credentials on every incoming read or write request.',
    analogy: 'Like a bank vault teller who checks your photo ID and permissions checklist every single time you make a deposit or withdrawal.',
    inThisChip: 'Located on Tile 2 in front of the Block RAM, ensuring unauthorized packets cannot read or write data even if they reach the tile.'
  },
  {
    term: 'Field-Programmable Gate Array (FPGA)',
    acronym: 'FPGA',
    category: 'Hardware',
    def: 'A reconfigurable silicon semiconductor chip that can be programmed to emulate any digital circuit design using software code.',
    analogy: 'Like a giant sandbox of electronic LEGO blocks that can be rearranged into a processor today and a graphics card tomorrow.',
    inThisChip: 'Our prototype runs on a Xilinx Artix-7 100T FPGA (XC7A100TCSG324-1) on an Arty A7 development board.'
  },
  {
    term: 'Look-Up Table (LUT)',
    acronym: 'LUT',
    category: 'Hardware',
    def: 'A miniature configurable logic building block on an FPGA that can compute any Boolean logic operation.',
    analogy: 'Like a tiny electronic truth table or mathematical calculator module.',
    inThisChip: 'The design utilizes 39,962 LUTs (about 63.0% of the FPGA’s 63,400 total capacity).'
  },
  {
    term: 'Flip-Flop (FF)',
    acronym: 'FF',
    category: 'Hardware',
    def: 'A 1-bit electronic memory storage circuit that captures and holds a digital state on every tick of the system clock.',
    analogy: 'Like a tiny light switch that remembers whether it was set to ON or OFF.',
    inThisChip: 'The design utilizes 29,187 flip-flops for internal pipeline registers and state machines.'
  },
  {
    term: 'Block RAM (BRAM)',
    acronym: 'BRAM',
    category: 'Hardware',
    def: 'Dedicated high-density on-chip memory blocks built into the FPGA silicon for storing data and instructions.',
    analogy: 'Like compact filing cabinets built right into the walls of an office.',
    inThisChip: 'The design uses 20 Block RAM units (out of 135 available on the FPGA chip).'
  },
  {
    term: 'RTL (Register-Transfer Level)',
    acronym: 'RTL',
    category: 'Architecture',
    def: 'A hardware description code format (such as SystemVerilog or Verilog) that defines how digital signals move between storage registers and logic circuits.',
    analogy: 'Like the precise architectural blueprint used by construction teams to build a skyscraper.',
    inThisChip: 'Our design is written in synthesizable SystemVerilog, verified in simulation and routed with Vivado 2024.1.'
  },
  {
    term: 'MMCM (Clock Generator)',
    acronym: 'MMCM',
    category: 'Hardware',
    def: 'Mixed-Mode Clock Manager: a precision circuit on the FPGA that takes an external raw clock and generates clean, stable system clocks.',
    analogy: 'Like the master conductor of an orchestra setting the exact tempo for all musicians.',
    inThisChip: 'Converts the 100 MHz oscillator signal from the Arty board into a synchronized 50 MHz system clock.'
  },
  {
    term: 'UART (Universal Asynchronous Receiver/Transmitter)',
    acronym: 'UART',
    category: 'Hardware',
    def: 'A simple two-wire serial communication interface used to stream text characters between the chip and an external computer monitor.',
    analogy: 'Like a telegraph line sending Morse code letters one by one between two remote stations.',
    inThisChip: 'Transmits diagnostic messages like "T3 PASS" or "T0 REFUSED" to your screen.'
  }
];

// ---------------------------------------------------------------- SYSTEM OVERVIEW ANALOGY
export const SYSTEM_OVERVIEW = {
  title: 'How the System on Chip Works: The Secure Office Analogy',
  lead: 'To understand this chip without an engineering background, imagine a high-security corporate facility with six specialized departments working together.',
  analogyRows: [
    {
      officeRole: 'Unvetted Contractor',
      chipComponent: 'Tile 0 (RISC-V CPU B)',
      hardwareRole: 'An unauthorized processor running code.',
      howItWorks: 'Tries to access the company vault, but the security guard at its own office door stops it immediately. No messages ever enter the main hallway.'
    },
    {
      officeRole: 'Postal Sorting Hub',
      chipComponent: 'Tile 1 (Network Tile)',
      hardwareRole: 'On-chip router with no processor attached.',
      howItWorks: 'Acts as a traffic junction along the top hallway, forwarding sealed delivery capsules between other departments without opening them.'
    },
    {
      officeRole: 'Central Records Vault',
      chipComponent: 'Tile 2 (Shared Memory & Front End)',
      hardwareRole: 'On-chip Block RAM with hardware gatekeeper.',
      howItWorks: 'Houses shared files. A strict security guard at the vault door checks employee badges on every single deposit or withdrawal.'
    },
    {
      officeRole: 'Vetted Employee',
      chipComponent: 'Tile 3 (RISC-V CPU A & Attest EP)',
      hardwareRole: 'Attested processor with cryptographic endpoint.',
      howItWorks: 'Calculates an unforgeable digital fingerprint of its startup instructions, answers the Security Chief’s challenge, and earns an authorized access pass.'
    },
    {
      officeRole: 'Chief Security Officer',
      chipComponent: 'Tile 4 (Root of Trust Verifier)',
      hardwareRole: 'Cryptographic security controller.',
      howItWorks: 'The ultimate authority. Generates unguessable quiz challenges, verifies returned cryptographic proof, issues access passes (GRANT), and can revoke them anytime (REVOKE).'
    },
    {
      officeRole: 'External Delivery Quarantine',
      chipComponent: 'Tile 5 (Untrusted Port & Quarantine)',
      hardwareRole: 'Simulated external injection interface.',
      howItWorks: 'An external loading dock with an x-ray scanner. Any suspicious, fake, or replayed parcels from the outside world are flagged and shredded before entering the facility.'
    }
  ]
};

// ---------------------------------------------------------------- TILE EDUCATIONAL PROFILES (9-POINT BREAKDOWN)
export const TILES_LEARNING: Record<number, TileLearning> = {
  0: {
    tileId: 0,
    name: 'RISC-V CPU B (Untrusted Processor)',
    analogyTitle: 'The Unvetted Contractor',
    analogyText: 'Imagine a temporary contractor who works inside an office building but has never been granted security clearance. The moment they attempt to enter the executive records vault, the guard posted right outside their office door turns them away.',
    whatIsIt: 'A 32-bit RISC-V PicoRV32 processor core equipped with its own private instruction memory, data memory, and a local bus bridge.',
    responsibility: 'Demonstrates how the system handles an unauthorized or compromised processing unit that attempts to access sensitive shared memory.',
    whyNeeded: 'Real-world computer chips often host multiple processor cores. The system must prove it can isolate and stop an untrusted core without letting it disrupt the rest of the chip.',
    interaction: 'It runs independently. Because it has never received authorization clearance, its on-tile bridge stops its requests locally, so it never successfully communicates over the network.',
    infoEnters: 'System clock (50 MHz), system reset, and program instructions loaded from its private instruction memory.',
    whatHappensInside: 'The processor executes instructions and issues a write request to shared memory. Its local bridge detects that the tile is not authorized, aborts the request, returns a poisoned error value, and directs error text to the UART.',
    infoLeaves: 'An error message to the serial terminal ("T0 REFUSED") and a red warning LED signal. Exactly zero packets leave Tile 0 onto the network.',
    securityBenefit: 'Local perimeter containment. Untrusted or compromised cores cannot flood the network with denial-of-service traffic or tamper with shared memory.',
    ifCompromised: 'Even if an attacker gains total control over CPU B’s software, they remain completely trapped inside Tile 0 and cannot spy on or modify data on other tiles.'
  },
  1: {
    tileId: 1,
    name: 'Network Tile (Routing Junction)',
    analogyTitle: 'The Highway Interchange',
    analogyText: 'Like a highway roundabout or postal sorting conveyor that smoothly directs delivery trucks between different streets without inspecting what is inside the cargo boxes.',
    whatIsIt: 'A 5-port on-chip router and network interface with no attached processor or memory in this build.',
    responsibility: 'Forwarding packets travelling across the top row of the 3-by-2 network grid (such as memory reply packets returning to Tile 3).',
    whyNeeded: 'Enables a scalable, modular network-on-chip topology where tiles can communicate efficiently without requiring separate dedicated wires between every pair of components.',
    interaction: 'Connects directly to Router 0 (West), Router 2 (East), and Router 4 (South).',
    infoEnters: '32-bit flits from neighboring routers arriving on Virtual Channels 0, 1, or 2.',
    whatHappensInside: 'Inspects destination coordinates on incoming flits, checks downstream buffer availability using credit-based flow control, and switches packets onto the correct output port using XY routing.',
    infoLeaves: 'Unmodified packets transmitted to the next adjacent router along their route.',
    securityBenefit: 'Maintains strict separation between traffic classes using three independent Virtual Channels, ensuring memory replies cannot be blocked behind congested memory requests.',
    ifCompromised: 'If this router were disabled or damaged, communication between Tile 2 and Tile 0/3 would have to take an alternate path or would fail.'
  },
  2: {
    tileId: 2,
    name: 'Shared Memory & Memory Front End',
    analogyTitle: 'The High-Security Vault',
    analogyText: 'Like a bank’s central safe deposit vault guarded by an unbribable checkpoint officer. You cannot just walk in; the guard inspects your photo ID and active access credentials every single time you make a deposit or withdrawal.',
    whatIsIt: 'Fast on-chip Block RAM storage paired with a hardware gatekeeper called the Memory Front End.',
    responsibility: 'Providing shared data storage for verified processors, while verifying access permissions on every single incoming read or write packet.',
    whyNeeded: 'Processors need a common place to share information and store results, but sensitive data must be protected against unauthorized snooping or tampering.',
    interaction: 'Receives write and read request packets from authorized processors (Tile 3) over the network, and transmits acknowledgements and read data back.',
    infoEnters: 'Memory request packets containing addresses, data values (such as 0xC0DE5A5A), and sender identification tags travelling on Virtual Channel 0.',
    whatHappensInside: 'The Memory Front End consults its internal authorization table. If the requesting tile is verified and authorized, the Block RAM executes the read or write. If not authorized, the access is rejected.',
    infoLeaves: 'Write acknowledgement packets and read-data response packets travelling on Virtual Channel 1.',
    securityBenefit: 'Continuous access verification. Even if an attacker somehow sneaked a packet across the network, the memory itself verifies authorization at the moment of access.',
    ifCompromised: 'If the memory front end failed, unauthorized processors could read secret data or overwrite critical system files.'
  },
  3: {
    tileId: 3,
    name: 'RISC-V CPU A & PQ-Attest Endpoint',
    analogyTitle: 'The Vetted Employee',
    analogyText: 'Like an employee who arrives at work, produces a tamper-evident cryptographic security token, submits their credentials for inspection, and only receives an office keycard after passing verification.',
    whatIsIt: 'A 32-bit RISC-V PicoRV32 processor paired with a dedicated cryptographic attestation engine (the PQ-Attest endpoint).',
    responsibility: 'Running application software, calculating an unforgeable cryptographic fingerprint of its own firmware, proving its integrity to the Root of Trust, and securely interacting with shared memory once approved.',
    whyNeeded: 'To prove how a legitimate processor can establish trust cryptographically without relying on blind assumptions or hardcoded vulnerabilities.',
    interaction: 'Performs an attestation handshake with Tile 4 (Root of Trust) and reads/writes shared data on Tile 2 (Shared Memory).',
    infoEnters: 'System clock, startup firmware, and cryptographic CHALLENGE, GRANT, or REVOKE packets from Tile 4.',
    whatHappensInside: 'Hashes its complete 16KB instruction memory (4,096 words) with a dedicated SHA3-256 engine to create an unforgeable fingerprint, packages it into a 64-byte field, seals the response with KMAC128, and unlocks its network bridge once granted access. Instruction fetches are constrained to IMEM.',
    infoLeaves: 'RESPONSE packets containing cryptographic proof to Tile 4, and authorized memory read/write requests to Tile 2.',
    securityBenefit: 'Guarantees that only genuine hardware running untampered, verified software can access the chip’s shared resources.',
    ifCompromised: 'If an attacker alters even a single bit of CPU A’s firmware, its cryptographic fingerprint changes, verification fails, and it is permanently locked out of shared memory.'
  },
  4: {
    tileId: 4,
    name: 'Root of Trust Verifier (Security Authority)',
    analogyTitle: 'The Chief Security Officer',
    analogyText: 'Like the master security department of an intelligence agency. It maintains master records, issues unguessable challenge quizzes, verifies cryptographic signatures, hands out access badges, and can instantly revoke them if a threat is detected.',
    whatIsIt: 'A dedicated, tamper-resistant hardware security controller acting as the foundational trust anchor for the entire SoC.',
    responsibility: 'Issuing fresh challenges to processor tiles, verifying returned cryptographic proofs against master criteria, granting access permissions, and revoking privileges upon button press or error.',
    whyNeeded: 'Without a trusted central authority, there is no objective, unbribable way to determine which processors are genuine and which have been compromised.',
    interaction: 'Sends CHALLENGE, GRANT, and REVOKE control packets to Tile 3 over the network, and updates board status LEDs.',
    infoEnters: 'Button inputs (Button 1: re-attest, Button 2: revoke) and 512-bit cryptographic RESPONSE packets containing firmware measurements and KMAC authentication tags.',
    whatHappensInside: 'Generates fresh 224-bit nonces, verifies incoming KMAC authentication tags, checks sequence numbers to defeat replay attacks, and manages authorization state flags.',
    infoLeaves: 'CHALLENGE packets on Virtual Channel 2, GRANT packets granting permission, and REVOKE packets stripping permissions.',
    securityBenefit: 'Eliminates blind trust. Ensures that no processor can access sensitive resources without proving its software integrity using strong cryptography.',
    ifCompromised: 'If the Root of Trust were compromised, rogue components could be falsely authorized. It is designed as an isolated, hardened hardware module to prevent tampering.'
  },
  5: {
    tileId: 5,
    name: 'Untrusted Port & Ingress Quarantine',
    analogyTitle: 'The Mailroom Quarantine Scanner',
    analogyText: 'Like a high-security corporate mailroom where all incoming external parcels are placed in an x-ray quarantine room. Any fake, counterfeit, or replayed packages are detected and shredded before they can enter the building hallways.',
    whatIsIt: 'An external packet injection port (SPOOF) monitored by an Ingress Quarantine buffer (active in simulation; tied off on the physical board).',
    responsibility: 'Simulating adversarial cyberattacks by injecting fake, modified, or replayed packets, demonstrating that the chip’s boundary defenses reject malicious traffic.',
    whyNeeded: 'To prove that an attacker connecting to an external debugging or expansion pin cannot forge authorization messages or bypass security controls.',
    interaction: 'Attempts to inject packets into the on-chip network interface, where the quarantine engine intercepts and analyzes them.',
    infoEnters: 'Raw external packet streams, including forged control packets, replayed tokens, and corrupted sequence numbers.',
    whatHappensInside: 'Holds incoming packets in an isolation buffer, verifies the Layer-2 authentication tag and sequence number freshness, and drops invalid packets immediately.',
    infoLeaves: 'Nothing during an attack! All forged or unauthorized packets are discarded at the quarantine barrier.',
    securityBenefit: 'Perimeter immunity. Malicious external inputs are filtered out before they can enter internal network routers or disrupt processors.',
    ifCompromised: 'On the physical board, this port is permanently disabled (tied off) for safety. In simulation, it proves the quarantine hardware works with 100% effectiveness.'
  }
};

// ---------------------------------------------------------------- SCENARIO EVENT DETAILED EDUCATIONAL DATA (5-PART BREAKDOWN)
export const SCENARIO_LEARNING: Record<string, EventLearning> = {
  'boot-1': {
    eventId: 'boot-1',
    whatIsHappening: 'Tile 3’s processor starts up, and the dedicated hardware measurement engine hashes the entire 16KB instruction memory (4,096 words) into the cryptographic attestation pipeline.',
    whyHappening: 'Before a processor can be trusted, the system must know exactly what software code it is running. Reading and hashing these startup instructions allows the hardware to calculate an unforgeable digital fingerprint.',
    howItWorks: 'The dedicated meas_imem_hasher reads the 4,096 words of IMEM into a SHA3-256 cryptographic hashing engine, supplying an encoded 64-byte field to the PQ-Attest endpoint alongside Tile 3’s hardware ID and configuration settings.',
    analogy: 'Imagine taking a high-resolution fingerprint of a new employee’s ID badge and background record before letting them through the front lobby.',
    whatHappensNext: 'The calculated fingerprint is held securely inside Tile 3, waiting for the Root of Trust to challenge it.',
    realWorldSignificance: 'If software on a processor was modified by a hacker or infected with malware, its cryptographic fingerprint would change completely, immediately alerting the system to the intrusion.',
    attemptedAction: 'Whole-IMEM hashing and initial measurement computation.',
    initiatedBy: 'Tile 3 (CPU A) hardware measurement engine.',
    checksPerformed: 'Dedicated SHA3-256 hashing across all 4,096 words (16KB) of IMEM and tile configuration registers.',
    checkingComponent: 'On-tile measurement unit (meas_imem_hasher) and PQ-Attest endpoint.',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'The instruction memory was completely hashed and the SHA3-256 pipeline successfully delivered the measurement field.',
    withoutSecurity: 'An infected processor could boot with corrupted or malicious instructions, and the system would never know it was compromised.'
  },
  'att-1': {
    eventId: 'att-1',
    whatIsHappening: 'The Root of Trust on Tile 4 creates a fresh 224-bit challenge question and sends it across the network to Tile 3.',
    whyHappening: 'To prevent an attacker from recording an old valid answer and re-sending it later (a replay attack), the Root of Trust issues a brand-new, unguessable challenge every time verification takes place.',
    howItWorks: 'Tile 4 generates a unique 224-bit challenge nonce and packages it into a packet stamped with an 80-bit epoch, a 64-bit sequence number, and a 128-bit KMAC authentication tag on Virtual Channel 2.',
    analogy: 'Like a security officer asking you: "What is the secret one-time password for today at 2:15 PM?" rather than accepting a password from yesterday.',
    whatHappensNext: 'Tile 3 receives the challenge and prepares a cryptographic response using its stored firmware fingerprint.',
    realWorldSignificance: 'Without fresh challenges, an adversary could record a single successful login packet and play it back indefinitely to gain permanent unauthorized access.',
    attemptedAction: 'Sending cryptographic attestation challenge from Root of Trust to Tile 3.',
    initiatedBy: 'Tile 4 (Root of Trust verifier).',
    checksPerformed: 'Sequence number increment, epoch verification, and Layer-2 link KMAC tag generation.',
    checkingComponent: 'Layer-2 link security engine (l2) and Router 4/3.',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'The challenge packet is genuine, stamped with the active epoch, and transmitted along authorized attestation channel VC2.',
    withoutSecurity: 'An attacker could forge fake challenges to trigger false authorizations or disrupt processors.'
  },
  'att-2': {
    eventId: 'att-2',
    whatIsHappening: 'Tile 3 answers the Root of Trust by sending back a 512-bit response containing its firmware fingerprint, sealed with a secret cryptographic key.',
    whyHappening: 'Tile 3 must prove two things: that it is genuine hardware holding the master secret key, and that its firmware instructions have not been altered.',
    howItWorks: 'The PQ-Attest endpoint combines the SHA3-256 firmware measurement with the challenge nonce received from Tile 4, signs it using KMAC128 and its secret key, and sends the 512-bit packet back across Router 3 to Router 4.',
    analogy: 'Like solving a customized math problem that only someone with the official company signet ring and today’s password can solve.',
    whatHappensNext: 'The Root of Trust receives the response and compares the cryptographic signature and fingerprint against its expected values.',
    realWorldSignificance: 'Even if an attacker intercepts this response, they cannot reverse-engineer the secret key or reuse the response for a different challenge.',
    attemptedAction: 'Cryptographic response transmission with firmware proof.',
    initiatedBy: 'Tile 3 (PQ-Attest endpoint).',
    checksPerformed: 'KMAC128 authentication tag calculation and payload alignment check.',
    checkingComponent: 'Tile 3 endpoint and Router 3/4.',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'The response packet payload is well-formed, carrying the measurement fingerprint and valid KMAC tag.',
    withoutSecurity: 'Any fake hardware device could claim to be Tile 3 and take over computing operations.'
  },
  'att-3': {
    eventId: 'att-3',
    whatIsHappening: 'The Root of Trust checks Tile 3’s answer, confirms it is 100% correct, and sends back a GRANT packet. Tile 3’s network lock opens and LED 0 lights up green.',
    whyHappening: 'Tile 3 has officially proven it can be trusted. The system now promotes it to an authorized state, allowing it to communicate with the shared memory.',
    howItWorks: 'The Root of Trust checks that the KMAC tag is mathematically valid and matches the golden firmware image. Upon validation, it dispatches an authenticated GRANT packet that flips Tile 3’s internal authorization register to TRUE.',
    analogy: 'The security desk stamps your visitor pass, hands you the electronic keycard to the building, and the security turnstile clicks open.',
    whatHappensNext: 'With its authorization gate unlocked, Tile 3 can now send memory requests to the Shared Memory on Tile 2.',
    realWorldSignificance: 'Ensures that memory access is earned through cryptographic proof, never assumed by default.',
    attemptedAction: 'Authorization approval and access grant issuance.',
    initiatedBy: 'Tile 4 (Root of Trust verifier).',
    checksPerformed: 'Cryptographic tag verification, measurement comparison against golden model, and sequence check.',
    checkingComponent: 'Tile 4 RoT verifier (ver).',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'The cryptographic proof matched the expected firmware fingerprint and secret key perfectly.',
    withoutSecurity: 'Unverified processors could access shared memory immediately upon power-on, opening the system to immediate hijacking.'
  },
  'acc-1': {
    eventId: 'acc-1',
    whatIsHappening: 'Tile 3 writes the hex value 0xC0DE5A5A to the Shared Memory on Tile 2. The packet travels across the network through Routers 3, 4, 5, and then 2.',
    whyHappening: 'CPU A needs to store calculation results in shared memory. Now that it is verified, it is permitted to send memory packets.',
    howItWorks: 'The processor writes to a shared address. Its bus bridge checks that Tile 3 is authorized, converts the write into a network packet on Virtual Channel 0, and routes it along X first (3 → 4 → 5), then Y (5 → 2).',
    analogy: 'An authorized employee carrying a sealed document walks down the main hallway and delivers it to the company filing vault.',
    whatHappensNext: 'The Memory Front End on Tile 2 inspects the incoming packet and verifies Tile 3’s authorization status before performing the write.',
    realWorldSignificance: 'Routing packets across the network follows strict XY rules to prevent gridlock, and packets travel on dedicated memory channels.',
    attemptedAction: 'Writing 32-bit word 0xC0DE5A5A into shared memory.',
    initiatedBy: 'Tile 3 (RISC-V CPU A).',
    checksPerformed: 'Tile 3 local bridge authorization check; XY routing path verification.',
    checkingComponent: 'Tile 3 bridge (cpuA.bridge) and Memory Front End (memfe).',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'Tile 3 holds an active GRANT, and the request was delivered to the Memory Front End.',
    withoutSecurity: 'Any unauthorized processor could write rogue data into shared memory and crash system software.'
  },
  'acc-2': {
    eventId: 'acc-2',
    whatIsHappening: 'The Shared Memory confirms the write was successful and sends back an acknowledgement packet to Tile 3 through Routers 2, 1, 0, and 3.',
    whyHappening: 'In computing, the processor must be certain its write completed before it continues executing further instructions.',
    howItWorks: 'The Memory Front End writes the 4 bytes into Block RAM, packages an acknowledgement flit, and dispatches it over Virtual Channel 1 (dedicated to memory replies).',
    analogy: 'The vault manager hands the employee a signed delivery receipt confirming the deposit was placed safely in the safe.',
    whatHappensNext: 'Tile 3 receives the confirmation, completing the write transaction.',
    realWorldSignificance: 'Using a separate virtual channel (VC1) for responses guarantees that replies never get stuck behind a queue of incoming requests, avoiding protocol deadlocks.',
    attemptedAction: 'Write acknowledgement transmission.',
    initiatedBy: 'Tile 2 (Memory Front End / BRAM).',
    checksPerformed: 'Block RAM write timing and VC1 credit availability.',
    checkingComponent: 'Memory Front End (memfe) and Router 2.',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'The write completed successfully in Block RAM.',
    withoutSecurity: 'Processors would have to guess whether data was written, risking data corruption and silent software crashes.'
  },
  'acc-3': {
    eventId: 'acc-3',
    whatIsHappening: 'Tile 3 sends a read request back to the Shared Memory to inspect the address it just wrote.',
    whyHappening: 'To prove that the memory write was genuine and that stored data can be retrieved accurately.',
    howItWorks: 'CPU A issues a read instruction. Its bridge packages a read request flit and transmits it across the network along Routers 3 → 4 → 5 → 2.',
    analogy: 'The employee walks back to the vault and asks the teller to retrieve the document they just deposited to verify its contents.',
    whatHappensNext: 'The Memory Front End re-checks authorization permissions before fetching the data from Block RAM.',
    realWorldSignificance: 'Security is not checked once at power-on and then forgotten; the system verifies permissions on every single transaction.',
    attemptedAction: 'Reading shared memory address.',
    initiatedBy: 'Tile 3 (RISC-V CPU A).',
    checksPerformed: 'Active authorization check at Tile 3 bridge and Tile 2 memory front end.',
    checkingComponent: 'Memory Front End (memfe).',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'Tile 3 remains authorized, and the read address is valid.',
    withoutSecurity: 'An expired or revoked entity could keep reading sensitive records indefinitely.'
  },
  'acc-4': {
    eventId: 'acc-4',
    whatIsHappening: 'The stored value returns to Tile 3 and matches 0xC0DE5A5A. Tile 3 prints "T3 PASS" on the serial UART and LED 2 lights up.',
    whyHappening: 'Demonstrates complete end-to-end success: software attestation, secure routing, memory writing, and data retrieval all succeeded.',
    howItWorks: 'The Block RAM outputs the 32-bit data word. It travels back on VC1 to Tile 3. CPU A’s firmware compares the returned word against 0xC0DE5A5A, confirms an exact match, and prints "T3 PASS" over the UART.',
    analogy: 'The teller hands you the exact document you deposited intact; you verify your signature, stamp the task complete, and light up the green success board.',
    whatHappensNext: 'The authorized memory access demonstration is successfully complete.',
    realWorldSignificance: 'Proves that cryptographic attestation and hardware access control work seamlessly at 50 MHz without degrading system correctness.',
    attemptedAction: 'Read response retrieval and verification.',
    initiatedBy: 'Tile 2 (Shared Memory).',
    checksPerformed: 'Firmware value comparison (0xC0DE5A5A == 0xC0DE5A5A).',
    checkingComponent: 'Tile 3 RISC-V CPU A firmware.',
    resultStatus: 'Accepted',
    resultCategory: 'ok',
    whyResult: 'The retrieved data matched the written value with 100% integrity.',
    withoutSecurity: 'Data could be intercepted or modified in flight across the network without detection.'
  },
  'ref-1': {
    eventId: 'ref-1',
    whatIsHappening: 'Tile 0 (CPU B) attempts to write to the shared memory, but its own local bridge stops the request. No packet ever enters the network. It prints "T0 REFUSED" and the RGB LED turns red.',
    whyHappening: 'Tile 0 was never attested or authorized. The system proves that untrusted processors are blocked locally before they can even touch network wires.',
    howItWorks: 'CPU B issues a write bus command. Its local bridge (cpuB.bridge) checks its internal authorization flag. Seeing it is FALSE, the bridge refuses to assert a network request, poisons the CPU bus response, and redirects CPU B to its refusal handler.',
    analogy: 'An unvetted contractor tries to open their office door to go to the vault, but the door is locked from the outside. They never even make it into the hallway.',
    whatHappensNext: 'CPU B handles the error, prints "T0 REFUSED" to the UART, and activates the red warning LED.',
    realWorldSignificance: 'Local refusal prevents untrusted cores from wasting network bandwidth, launching denial-of-service floods, or snooping on memory traffic.',
    attemptedAction: 'Unauthorized write attempt by unvetted processor (CPU B).',
    initiatedBy: 'Tile 0 (RISC-V CPU B).',
    checksPerformed: 'Local bridge authorization clearance check.',
    checkingComponent: 'Tile 0 bus bridge (cpuB.bridge).',
    resultStatus: 'Refused locally',
    resultCategory: 'fail',
    whyResult: 'Tile 0 has no authorization grant; its bridge is hard-configured to block external access.',
    withoutSecurity: 'An unauthorized or hijacked processor could flood the network with rogue writes, corrupting memory and crashing other cores.'
  },
  'rev-1': {
    eventId: 'rev-1',
    whatIsHappening: 'Button 2 is pressed on the board, and the Root of Trust sends an authenticated REVOKE packet to Tile 3. Tile 3’s lock snaps shut and LED 0 goes out.',
    whyHappening: 'Trust is not permanent. If a threat is detected or a security epoch ends, the Root of Trust must be able to cancel privileges immediately while the chip continues running.',
    howItWorks: 'Tile 4 generates an authenticated REVOKE packet and transmits it across the network. Tile 3’s network interface receives the packet, validates the signature, and clears its authorization register back to FALSE.',
    analogy: 'A security officer presses a button that instantly cancels your badge access; the electronic lock clicks shut and the green indicator light turns off.',
    whatHappensNext: 'Tile 3 is now stripped of all privileges. Any subsequent attempt to access shared memory will be refused.',
    realWorldSignificance: 'Proves the system supports dynamic real-time revocation. Security can be revoked in microseconds without needing a full system reboot or power cycle.',
    attemptedAction: 'Dynamic privilege revocation.',
    initiatedBy: 'Tile 4 (Root of Trust verifier) via Button 2 trigger.',
    checksPerformed: 'REVOKE command authentication and sequence freshness check.',
    checkingComponent: 'Tile 4 verifier (ver) and Tile 3 endpoint (endp).',
    resultStatus: 'Accepted',
    resultCategory: 'warn',
    whyResult: 'The REVOKE command was authorized by the Root of Trust and successfully executed.',
    withoutSecurity: 'Once authorized, a compromised processor would keep permanent access forever until the entire chip was physically powered off.'
  },
  'rev-2': {
    eventId: 'rev-2',
    whatIsHappening: 'Tile 3 tries to send another memory write request, but its local bridge now blocks it inside its own tile, exactly like Tile 0.',
    whyHappening: 'Demonstrates that once revoked, Tile 3 is treated as an untrusted unit. Its privileges have completely vanished.',
    howItWorks: 'CPU A attempts a memory transaction. Because its authorization flag was cleared by the REVOKE command, its bridge denies the transaction, halts the request on-tile, and prevents any flits from entering the network.',
    analogy: 'The employee walks up to the door and swipes their badge, but the scanner flashes red and refuses to open the door.',
    whatHappensNext: 'Tile 3 cannot access shared memory until it undergoes a complete re-attestation handshake.',
    realWorldSignificance: 'Ensures instantaneous protection. The moment a component is flagged as compromised, its access to shared assets is severed immediately.',
    attemptedAction: 'Post-revocation memory write attempt.',
    initiatedBy: 'Tile 3 (RISC-V CPU A).',
    checksPerformed: 'Authorization register inspection at Tile 3 bridge.',
    checkingComponent: 'Tile 3 bus bridge (cpuA.bridge).',
    resultStatus: 'Refused locally',
    resultCategory: 'fail',
    whyResult: 'Privileges were revoked in step 1; authorization is now FALSE.',
    withoutSecurity: 'A revoked core might retain lingering access or cached permissions, allowing an attacker a window of exploitation.'
  },
  'for-1': {
    eventId: 'for-1',
    whatIsHappening: 'An adversary injects a forged packet through the external untrusted port (Tile 5). The Ingress Quarantine intercepts it, detects the forgery, and rejects it immediately.',
    whyHappening: 'Tests the chip against direct external cyberattacks. An attacker might try to forge a fake GRANT packet or replay an old message to trick the network.',
    howItWorks: 'The forged packet enters Tile 5’s Ingress Quarantine. The hardware parser inspects the Layer-2 authentication tag and sequence number. The counterfeit tag fails verification, and the packet is dropped without ever reaching Router 5.',
    analogy: 'A stranger drops a suspicious unmarked box into the mailroom; the x-ray bomb-detector scanner sounds an alarm, and the box is immediately isolated and destroyed.',
    whatHappensNext: 'The packet is destroyed. The internal network remains completely untouched and secure.',
    realWorldSignificance: 'Proves the chip has a hardened exterior perimeter. Counterfeit messages cannot bypass internal cryptographic filters.',
    attemptedAction: 'Adversarial injection of counterfeit/replayed control packet (simulated attack).',
    initiatedBy: 'Tile 5 external untrusted port (spoof).',
    checksPerformed: 'Layer-2 KMAC tag verification, sequence number freshness check, and ingress quarantine filtering.',
    checkingComponent: 'Ingress Quarantine module (quar).',
    resultStatus: 'Rejected at quarantine',
    resultCategory: 'warn',
    whyResult: 'The packet failed cryptographic tag verification and carried an invalid sequence number.',
    withoutSecurity: 'An external attacker could inject counterfeit security packets, falsely granting access to malicious cores or crashing the on-chip network.'
  }
};

// ---------------------------------------------------------------- 10 HOW-IT-WORKS STEP DETAILED EDUCATIONAL BREAKDOWN
export const HOW_LEARNING: HowStepLearning[] = [
  {
    stepIndex: 0,
    title: 'Power on',
    whatIsHappening: 'Electrical power is applied to the FPGA chip. The master 50 MHz clock starts ticking, both processors begin executing their startup code, and LED 3 blinks as a heartbeat.',
    whyHappening: 'All electronic circuits require stable power and a rhythmic clock signal before digital logic can begin processing instructions.',
    howItWorks: 'The Arty board’s 100 MHz crystal oscillator feeds an on-chip clock generator (MMCM), which synthesizes a clean 50 MHz clock. A 24-bit counter toggles LED 3 approximately once every 0.34 seconds as a visible heartbeat.',
    analogy: 'Turning on the lights and master generator in a factory. The machines wake up and the rhythmic hum of the conveyor belt begins.',
    whatHappensNext: 'Before either processor can use shared memory, Tile 3 must measure its startup firmware.',
    realWorldSignificance: 'At power-on, the chip enforces a strict "zero trust" policy: all tiles start in an unauthorized state.'
  },
  {
    stepIndex: 1,
    title: 'Measure tile 3',
    whatIsHappening: 'The dedicated hardware measurement unit on Tile 3 hashes its entire 16KB (4,096 words) instruction memory with SHA3-256 and calculates a unique cryptographic fingerprint.',
    whyHappening: 'To ensure the processor is running genuine, untampered firmware before granting it network access.',
    howItWorks: 'The dedicated meas_imem_hasher processes all 4,096 words of IMEM alongside the tile’s hardware ID to produce an immutable 256-bit measurement.',
    analogy: 'Taking a digital biometric scan of an employee’s security pass to verify its authenticity.',
    whatHappensNext: 'Tile 3 stores this fingerprint, waiting for the Root of Trust to challenge it.',
    realWorldSignificance: 'If an adversary modified even one character in the firmware, the resulting fingerprint would be totally different, alerting the system.'
  },
  {
    stepIndex: 2,
    title: 'Challenge',
    whatIsHappening: 'The Root of Trust (Tile 4) sends a fresh 224-bit challenge question across the network to Tile 3.',
    whyHappening: 'To prevent replay attacks, where a thief records yesterday’s correct answer and plays it back today.',
    howItWorks: 'Tile 4 generates a unique 224-bit challenge nonce, attaches an 80-bit epoch and a 64-bit sequence counter, signs it with a 128-bit KMAC tag, and sends it over Virtual Channel 2.',
    analogy: 'The security desk calls Tile 3 and asks: "What is your secret response code for today’s one-time challenge number 4,921?"',
    whatHappensNext: 'Tile 3 receives the challenge and computes a mathematical response.',
    realWorldSignificance: 'Guarantees freshness. An old recorded response cannot trick the verifier.'
  },
  {
    stepIndex: 3,
    title: 'Response',
    whatIsHappening: 'Tile 3 answers the Root of Trust by sending back its firmware fingerprint sealed with a secret cryptographic key.',
    whyHappening: 'Tile 3 must prove that it possesses the authentic secret key and that its firmware is unmodified.',
    howItWorks: 'The PQ-Attest endpoint seals the measurement and challenge nonce using KMAC128, creating a 512-bit response payload sent back across the network to Tile 4.',
    analogy: 'Tile 3 stamps the answer with an official wax seal using an exclusive royal signet ring and sends it back by courier.',
    whatHappensNext: 'The Root of Trust inspects the seal and compares the fingerprint against its golden standard.',
    realWorldSignificance: 'Only genuine hardware running the approved software can produce a signature the Root of Trust accepts.'
  },
  {
    stepIndex: 4,
    title: 'Grant',
    whatIsHappening: 'The Root of Trust validates Tile 3’s answer, confirms it is authentic, and sends back an authorized GRANT packet. The network lock on Tile 3 opens, and LED 0 lights up green.',
    whyHappening: 'Tile 3 has satisfied all security requirements and is now granted permission to use the shared memory.',
    howItWorks: 'Tile 4 sends an authenticated GRANT control packet. Upon receipt, Tile 3 flips its internal authorization register to TRUE and opens its local bridge gate.',
    analogy: 'The security officer approves your clearance, hands you an electronic keycard, and the security door unlocks.',
    whatHappensNext: 'Tile 3 can now send memory read and write requests to the shared memory on Tile 2.',
    realWorldSignificance: 'Access is granted dynamically based on real-time verification, never assumed by default.'
  },
  {
    stepIndex: 5,
    title: 'Write 0xC0DE5A5A',
    whatIsHappening: 'Tile 3 writes the hex value 0xC0DE5A5A to the Shared Memory on Tile 2. The packet travels horizontally through Routers 3, 4, 5, then vertically up to Router 2.',
    whyHappening: 'CPU A needs to store calculation results in shared memory.',
    howItWorks: 'CPU A’s bridge converts the write request into a packet on Virtual Channel 0, following XY routing (X first, then Y). The memory front end checks permissions before writing the data to Block RAM.',
    analogy: 'An authorized employee walks down the main hallway and places a confidential folder into the central vault.',
    whatHappensNext: 'The memory accepts the write and updates its memory cells.',
    realWorldSignificance: 'Permissions are verified by hardware gatekeepers at the destination, preventing unauthorized writes.'
  },
  {
    stepIndex: 6,
    title: 'Read it back',
    whatIsHappening: 'Tile 3 reads back the address it just wrote. The data returns across the top row (Routers 2 → 1 → 0 → 3), matches 0xC0DE5A5A, prints "T3 PASS" on the UART, and lights LED 2.',
    whyHappening: 'Confirms that the memory transaction succeeded with 100% data integrity.',
    howItWorks: 'The Block RAM outputs the stored data on Virtual Channel 1 (dedicated to memory replies). CPU A verifies the value, prints "T3 PASS" to the console, and lights the success LED.',
    analogy: 'Retrieving your file from the vault, confirming every page is intact, and stamping the mission successful.',
    whatHappensNext: 'Next, the demonstration shows what happens when an untrusted processor tries the same write.',
    realWorldSignificance: 'Dedicated virtual channels for replies prevent network deadlocks where requests and replies block each other.'
  },
  {
    stepIndex: 7,
    title: 'Tile 0 is refused',
    whatIsHappening: 'Tile 0 (CPU B) tries to write to the shared memory. It was never attested, so its own local bridge stops the request: nothing reaches the network. It prints "T0 REFUSED" and the RGB LED turns red.',
    whyHappening: 'Demonstrates that untrusted or rogue processors are contained locally and cannot touch network wires.',
    howItWorks: 'CPU B’s bridge detects that authorization is FALSE, refuses to assert network signals, returns an error to the core, and lights the refusal LED.',
    analogy: 'An unvetted contractor tries to open their office door to visit the vault, but the door is locked from the outside. They never reach the corridor.',
    whatHappensNext: 'Next, the demonstration shows that trust can be revoked dynamically while the system is running.',
    realWorldSignificance: 'Local containment prevents unauthorized processors from launching denial-of-service floods or eavesdropping on shared memory.'
  },
  {
    stepIndex: 8,
    title: 'Revoke',
    whatIsHappening: 'Button 2 is pressed, and the Root of Trust revokes Tile 3’s access. The lock closes, LED 0 turns off, and Tile 3’s next memory request is stopped by its own bridge.',
    whyHappening: 'Trust must never be permanent. If a threat is detected, privileges must be stripped immediately.',
    howItWorks: 'Tile 4 sends an authenticated REVOKE packet. Tile 3 clears its authorization flag to FALSE, instantly re-locking its bridge.',
    analogy: 'A security officer clicks a master button that instantly disables an employee’s keycard; the security door immediately re-locks.',
    whatHappensNext: 'Tile 3 is now completely blocked until a new attestation handshake is completed.',
    realWorldSignificance: 'Allows immediate containment of compromised units without requiring a full chip reboot.'
  },
  {
    stepIndex: 9,
    title: 'Forged packet',
    whatIsHappening: 'A forged packet is injected through the untrusted port (Tile 5) and is rejected by the quarantine. (Shown in simulation; the port is tied off on the physical board).',
    whyHappening: 'Tests whether an attacker connecting to external pins can inject fake control packets into the on-chip network.',
    howItWorks: 'The Ingress Quarantine holds incoming packets in an isolation buffer, verifies the Layer-2 KMAC tag and sequence counter, detects the counterfeit signature, and destroys the packet.',
    analogy: 'A suspicious parcel from an unknown sender arrives at the mailroom; the x-ray scanner detects a hazard and the parcel is incinerated.',
    whatHappensNext: 'The demonstration concludes with all security properties verified.',
    realWorldSignificance: 'Guarantees boundary protection: external pins cannot be exploited to bypass internal cryptographic defenses.'
  }
];

