// ═══════════════════════════════════════════════════════════════════════════
// dcimDashboardData.js — static data for the Dashboard's DCIM tab, CALCULATED
// from the 5D View.
// ---------------------------------------------------------------------------
// The 5D View (sidebar "5D View" → DataCenter3DView with the ideal-datacenter
// demo: src/pages/idealDatacenterDemo.js + src/pages/idealDemoRackFill.js) is
// the source of truth. This file only COPIES what the 5D View contains —
// device counts, nameplate ratings, room power budgets, and what sits in
// every rack U by U (the same numbers its Facility card, STORAGE panel, Rack
// View and Thermal Monitoring show). Every percentage, total, kW figure, PUE
// and health score on the dashboard is then CALCULATED from those inputs
// below, so the numbers always add up and always agree with each other.
//
// Nothing here imports the 5D View code: the demo floor stays removable, and
// the 5D View itself is untouched. If the demo floor is ever changed, update
// the inputs in section 1 (racks / FLOOR / ROOMS) and everything else follows.
// ═══════════════════════════════════════════════════════════════════════════

// ── helpers ──────────────────────────────────────────────────────────────
const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);
const round = (n, d = 0) => { const p = 10 ** d; return Math.round(n * p) / p; };
const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

/**
 * Round a set of percentages so they still add up to exactly 100
 * (largest-remainder method) — e.g. 50.26 / 14.49 / 35.25 → 50 / 15 / 35.
 */
export function splitTo100(values) {
  const total = sum(values);
  if (!total) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - sum(floors);
  raw.map((r, i) => ({ i, rem: r - floors[i] }))
    .sort((a, b) => b.rem - a.rem)
    .forEach(({ i }) => { if (left > 0) { floors[i] += 1; left -= 1; } });
  return floors;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · WHAT THE 5D VIEW CONTAINS (inputs — copied, not invented)
// ═══════════════════════════════════════════════════════════════════════════

export const FACILITY = {
  name: "DEMO — Ideal Datacenter",
  shortName: "Ideal Datacenter",
  code: "DEMO-IDEAL-00",
  lengthM: 42,
  breadthM: 30,
  corridors: 6,          // walk paths — the 5D View does not count them as rooms
  perforatedTiles: 48,
  cableTrays: 34,        // 20 power + 14 data trays (plus 3 un-drawn air channels)
  gatesPerRoom: 2,       // every room has one ENTRY and one EXIT gate
};

// Rooms with the power budget (kW) set on each in the 5D View. The Facility
// card's "Load" is the sum of these: 250 + 20 + 40 + 180 = 490 kW.
export const ROOMS = [
  { id: "server", name: "Server Room", type: "server", widthM: 13, lengthM: 18, budgetKw: 180 },
  { id: "network", name: "Network Room", type: "network", widthM: 12, lengthM: 10, budgetKw: 40 },
  { id: "power", name: "Power Room", type: "electrical", widthM: 9, lengthM: 10, budgetKw: 250 },
  { id: "battery", name: "Battery Room", type: "electrical", widthM: 4, lengthM: 5, budgetKw: 20 },
];

// Every device type standing on the 5D View floor, named exactly as the 5D
// View names it (row PDUs are "PDU Cabinet" too, rated 125 A). `where` is the room it
// stands in (yard = transformer yard, roof = chiller plant deck). `kw` is the
// nameplate draw for active network kit (the only floor devices whose rating
// is an IT load); racks get their load from what is inside them (section 2).
export const FLOOR = [
  { key: "transformer", name: "Transformer", group: "power", where: "yard", count: 3, rating: "1000 kVA", tags: "T1–T3" },
  { key: "busway", name: "Busway", group: "power", where: "power", count: 1, rating: "2500 A", tags: "BUSWAY" },
  { key: "dgset", name: "DG Set", group: "power", where: "power", count: 2, rating: "750 kVA", tags: "GEN1–GEN2" },
  { key: "mpp", name: "MPP (Main Power Panel)", group: "power", where: "power", count: 2, rating: "2500 A", tags: "MPP1–MPP2" },
  { key: "pp", name: "PP (Power Panel)", group: "power", where: "power", count: 3, rating: "400 A", tags: "PP1–PP3" },
  { key: "ups", name: "UPS Module", group: "power", where: "power", count: 4, rating: "300 kVA", kva: 300, tags: "UPS1–UPS4" },
  { key: "pdu", name: "PDU Cabinet", group: "power", where: "power", count: 2, rating: "400 A", tags: "PDU1–PDU2" },
  { key: "battery", name: "Battery Bank", group: "power", where: "battery", count: 4, rating: "40 kWh", tags: "BAT1–BAT4" },
  { key: "rowpdu", name: "PDU Cabinet", group: "power", where: "server", count: 12, rating: "125 A", tags: "RPDU-1A–6B" },
  { key: "pac", name: "PAC Unit", group: "cooling", where: "server", count: 6, rating: "30 kW", tags: "PAC-1W–3E" },
  { key: "chiller", name: "Chiller", group: "cooling", where: "roof", count: 1, rating: "100 kW", tags: "CH-01" },
  { key: "wan", name: "Internet / WAN", group: "network", where: "network", count: 1, rating: "N/A", kw: 0, tags: "WAN" },
  { key: "isp", name: "ISP Uplink", group: "network", where: "network", count: 2, rating: "120 W", kw: 0.12, tags: "ISP-A/B" },
  { key: "core", name: "Core Router", group: "network", where: "network", count: 2, rating: "900 W", kw: 0.9, tags: "CORE-A/B" },
  { key: "firewall", name: "Firewall", group: "network", where: "network", count: 2, rating: "300 W", kw: 0.3, tags: "FW-A/B" },
  { key: "dist", name: "Distribution Switch", group: "network", where: "network", count: 2, rating: "600 W", kw: 0.6, tags: "DIST-A/B" },
  { key: "tor", name: "Access Switch (ToR)", group: "network", where: "server", count: 2, rating: "300 W", kw: 0.3, tags: "ToR-A/B" },
  { key: "ndr", name: "Network Distribution Rack", group: "rack", where: "server", count: 6, rating: "2 kW", tags: "NDR-1–6" },
  { key: "rdr", name: "Row Distribution Rack", group: "rack", where: "server", count: 5, rating: "1.5 kW", tags: "RDR-B–F" },
  { key: "rack", name: "Rack", group: "rack", where: "server", count: 35, rating: "6 kW", tags: "RK-B1–F7" },
];

// Cables on the floor, by type (300 in all).
export const CABLES = { power: 145, fiber: 53, cooling: 52, copper: 41, network: 7, backbone: 2 };

export const RACK_U = 42;

// Every rack exactly as the 5D View STORAGE view / Rack View fills it.
// [alias, row, kind, usedU, reservedU, freeU, largestFreeRunU,
//  2U servers, 4U servers, 48-port switches, passive (patch panel / LIU / cable manager)]
const RACK_ROWS = [
  ["NDR-1", "A", "ndr", 14, 6, 22, 17, 2, 0, 2, 8],
  ["NDR-2", "A", "ndr", 14, 7, 21, 18, 2, 0, 2, 8],
  ["NDR-3", "A", "ndr", 14, 7, 21, 18, 2, 0, 2, 8],
  ["NDR-4", "A", "ndr", 14, 6, 22, 18, 2, 0, 2, 8],
  ["NDR-5", "A", "ndr", 14, 5, 23, 19, 2, 0, 2, 8],
  ["NDR-6", "A", "ndr", 14, 6, 22, 17, 2, 0, 2, 8],
  ["RDR-B", "B", "rdr", 13, 9, 20, 13, 1, 0, 2, 9],
  ["RK-B1", "B", "rack", 24, 3, 15, 11, 8, 1, 0, 4],
  ["RK-B2", "B", "rack", 20, 4, 18, 8, 8, 0, 0, 4],
  ["RK-B3", "B", "rack", 22, 5, 15, 15, 5, 2, 0, 4],
  ["RK-B4", "B", "rack", 28, 4, 10, 9, 6, 3, 0, 4],
  ["RK-B5", "B", "rack", 22, 7, 13, 10, 7, 1, 0, 4],
  ["RK-B6", "B", "rack", 22, 4, 16, 10, 5, 2, 0, 4],
  ["RK-B7", "B", "rack", 26, 7, 9, 7, 9, 1, 0, 4],
  ["RDR-C", "C", "rdr", 13, 7, 22, 15, 1, 0, 2, 9],
  ["RK-C1", "C", "rack", 20, 4, 18, 16, 6, 1, 0, 4],
  ["RK-C2", "C", "rack", 24, 4, 14, 10, 6, 2, 0, 4],
  ["RK-C3", "C", "rack", 20, 7, 15, 13, 6, 1, 0, 4],
  ["RK-C4", "C", "rack", 22, 7, 13, 8, 5, 2, 0, 4],
  ["RK-C5", "C", "rack", 28, 2, 12, 6, 10, 1, 0, 4],
  ["RK-C6", "C", "rack", 24, 7, 11, 9, 6, 2, 0, 4],
  ["RK-C7", "C", "rack", 22, 9, 11, 9, 9, 0, 0, 4],
  ["RDR-D", "D", "rdr", 13, 10, 19, 11, 1, 0, 2, 9],
  ["RK-D1", "D", "rack", 22, 5, 15, 10, 7, 1, 0, 4],
  ["RK-D2", "D", "rack", 22, 4, 16, 16, 7, 1, 0, 4],
  ["RK-D3", "D", "rack", 24, 7, 11, 6, 8, 1, 0, 4],
  ["RK-D4", "D", "rack", 24, 8, 10, 5, 8, 1, 0, 4],
  ["RK-D5", "D", "rack", 20, 5, 17, 12, 2, 3, 0, 4],
  ["RK-D6", "D", "rack", 24, 7, 11, 11, 6, 2, 0, 4],
  ["RK-D7", "D", "rack", 22, 9, 11, 8, 9, 0, 0, 4],
  ["RDR-E", "E", "rdr", 13, 6, 23, 11, 1, 0, 2, 9],
  ["RK-E1", "E", "rack", 26, 5, 11, 3, 5, 3, 0, 4],
  ["RK-E2", "E", "rack", 22, 7, 13, 13, 3, 3, 0, 4],
  ["RK-E3", "E", "rack", 24, 4, 14, 14, 10, 0, 0, 4],
  ["RK-E4", "E", "rack", 28, 5, 9, 9, 12, 0, 0, 4],
  ["RK-E5", "E", "rack", 20, 8, 14, 13, 4, 2, 0, 4],
  ["RK-E6", "E", "rack", 26, 5, 11, 9, 11, 0, 0, 4],
  ["RK-E7", "E", "rack", 22, 7, 13, 11, 9, 0, 0, 4],
  ["RDR-F", "F", "rdr", 13, 7, 22, 12, 1, 0, 2, 9],
  ["RK-F1", "F", "rack", 24, 5, 13, 5, 8, 1, 0, 4],
  ["RK-F2", "F", "rack", 22, 10, 10, 3, 7, 1, 0, 4],
  ["RK-F3", "F", "rack", 26, 3, 13, 4, 9, 1, 0, 4],
  ["RK-F4", "F", "rack", 26, 3, 13, 4, 7, 2, 0, 4],
  ["RK-F5", "F", "rack", 28, 9, 5, 4, 8, 2, 0, 4],
  ["RK-F6", "F", "rack", 22, 9, 11, 6, 5, 2, 0, 4],
  ["RK-F7", "F", "rack", 24, 5, 13, 10, 8, 1, 0, 4],
];
export const RACKS = RACK_ROWS.map(([alias, row, kind, usedU, reservedU, freeU, largestFreeU, s2u, s4u, switches, passive]) => ({
  alias, row, kind, usedU, reservedU, freeU, largestFreeU, s2u, s4u, switches, passive,
}));

// U-by-U picture of three racks (top U42 → bottom U1; u = occupied,
// r = reserved, f = free), for the mini rack cards.
export const RACK_U_MAP = {
  "RK-F5": "uuuuuuuuuuuuuuuuuuuuuuuuuurrrrrfrrrruuffff",
  "RK-B7": "uuuuuurruufuuuurrrrruuuuuuuuuuuufuufffffff",
  "RK-E4": "uuuurrrrruuuuuuuuuuuuuuuuuuuuuuuufffffffff",
};

// What the rack contents are, by role (the server names in Rack View).
export const IN_RACK = {
  serversByRole: { APP: 111, WEB: 138, GPU: 46, DNS: 6, NMS: 6, MGMT: 5 },
  patchPanels: 102,
  fibreLius: 52,
  cableManagers: 79,
  reservedBlocks: 71,
};

// Each server row's racks are plumbed to ONE PAC unit (the 5D View's cooling
// cables); the two units at the ends of a cold aisle serve its two rows.
export const PAC_UNITS = [
  { tag: "PAC-1W", row: "A", aisle: 1 },
  { tag: "PAC-1E", row: "B", aisle: 1 },
  { tag: "PAC-2W", row: "C", aisle: 2 },
  { tag: "PAC-2E", row: "D", aisle: 2 },
  { tag: "PAC-3W", row: "E", aisle: 3 },
  { tag: "PAC-3E", row: "F", aisle: 3 },
];

// Thermal Monitoring (no failures): average °C per room, as the 5D View panel
// lists them ("ROOM TEMPERATURE · AVG / PEAK").
export const ROOM_TEMP_C = { server: 24.0, power: 24.1, network: 22.3, battery: 42.1 };

// The Server Room part of the same Thermal Monitoring heat field, averaged
// into 14 bands (north → south: wall clearance, Row A, cold aisle 1, Row B,
// hot aisle 1, … Row F, hot aisle 3, open floor) × 10 slices (west → east).
export const SERVER_ROOM_HEAT_C = [
  [18.8, 20.1, 23.2, 25.6, 26.0, 24.5, 22.6, 20.5, 19.0, 18.9],
  [18.0, 19.3, 21.8, 22.9, 23.1, 22.6, 21.9, 20.0, 18.2, 18.1],
  [18.0, 18.5, 20.2, 20.8, 21.4, 21.6, 21.3, 19.5, 18.0, 18.0],
  [18.0, 18.9, 25.1, 33.5, 38.3, 36.6, 29.9, 21.8, 18.0, 18.0],
  [18.0, 19.3, 29.1, 43.5, 50.0, 47.9, 36.6, 23.7, 18.0, 18.0],
  [18.0, 18.8, 25.0, 33.6, 38.5, 36.6, 29.8, 21.6, 18.0, 18.0],
  [18.0, 18.2, 20.7, 23.3, 25.0, 24.6, 22.7, 19.4, 18.0, 18.0],
  [18.0, 18.8, 25.0, 33.5, 38.4, 36.5, 29.8, 21.6, 18.0, 18.0],
  [18.0, 19.3, 28.8, 42.9, 49.7, 47.3, 36.2, 23.6, 18.0, 18.0],
  [18.0, 18.9, 25.2, 33.8, 38.7, 36.8, 30.0, 21.8, 18.0, 18.0],
  [18.0, 18.5, 20.9, 22.7, 24.1, 23.8, 22.6, 19.8, 18.0, 18.0],
  [18.1, 19.5, 23.5, 28.1, 30.8, 29.9, 26.3, 21.5, 18.3, 18.1],
  [19.0, 20.5, 25.5, 32.8, 36.8, 35.2, 29.3, 22.8, 19.4, 19.1],
  [20.7, 21.1, 22.7, 25.1, 26.4, 25.8, 23.9, 21.8, 20.8, 20.7],
];

// ═══════════════════════════════════════════════════════════════════════════
// 2 · ASSUMPTIONS — the only numbers the 5D View does not hold itself
// ═══════════════════════════════════════════════════════════════════════════
// The 5D View stores a rack's 6 kW BUDGET, not what it draws, so the IT load is
// built bottom-up from what is mounted in each rack. Every rack stays under its
// own 6 kW rating this way (the busiest, RK-B4, draws 5.1 kW).
export const ASSUMPTIONS = {
  kwPer2UServer: 0.35,     // typical draw, 2U server (Model A / Model B)
  kwPer4UServer: 1.0,      // typical draw, 4U expansion / GPU chassis (Model C)
  kwPerRackSwitch: 0.1,    // 48-port access / aggregation switch
  upsPowerFactor: 0.9,     // kVA → kW
  upsEfficiency: 0.95,     // double-conversion UPS
  pacCoolingKw: 30,        // per PAC unit — 5D View rating, same 30 kW its capacity planner uses
  chillerCoolingKw: 250,   // 5D View capacity planner's chiller capacity
  chillerInputKw: 100,     // 5D View chiller rating → COP 250 / 100 = 2.5
  lightingWPerM2: 5,       // LED lighting + small power, whole 42 × 30 m floor
  gridKgCo2PerKwh: 0.72,   // CEA India grid average
  coolingGrowthPctPerMonth: 1.5,
  spaceGrowthPctPerMonth: 2,
};

// ═══════════════════════════════════════════════════════════════════════════
// 3 · CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════
const A = ASSUMPTIONS;
const floorOf = (key) => FLOOR.find((f) => f.key === key);
const countOf = (key) => floorOf(key)?.count || 0;
const rackKw = (r) => r.s2u * A.kwPer2UServer + r.s4u * A.kwPer4UServer + r.switches * A.kwPerRackSwitch;

function calculate() {
  // ── Inventory ──
  const floorDevices = sum(FLOOR, (f) => f.count);                              // 97
  const racksTotal = RACKS.length;                                               // 46
  const servers2U = sum(RACKS, (r) => r.s2u);                                    // 266
  const servers4U = sum(RACKS, (r) => r.s4u);                                    // 46
  const servers = servers2U + servers4U;                                         // 312
  const rackSwitches = sum(RACKS, (r) => r.switches);                            // 22
  const passive = sum(RACKS, (r) => r.passive);                                  // 233
  const inRackItems = servers + rackSwitches + passive;                          // 567
  const totalAssets = floorDevices + inRackItems;                                // 664
  const floorNetworkActive = sum(FLOOR.filter((f) => f.group === "network"), (f) => f.count); // 11
  const networkDevices = floorNetworkActive + rackSwitches;                      // 33
  const powerDevices = sum(FLOOR.filter((f) => f.group === "power"), (f) => f.count);         // 33
  const coolingDevices = sum(FLOOR.filter((f) => f.group === "cooling"), (f) => f.count);     // 7
  const cablesTotal = sum(Object.values(CABLES));                                // 300
  const rooms = ROOMS.length;                                                    // 4
  const gates = rooms * FACILITY.gatesPerRoom;                                   // 8

  // ── Space (STORAGE view) ──
  const totalU = racksTotal * RACK_U;                                            // 1,932
  const usedU = sum(RACKS, (r) => r.usedU);                                      // 971
  const reservedU = sum(RACKS, (r) => r.reservedU);                              // 280
  const freeU = sum(RACKS, (r) => r.freeU);                                      // 681
  const [usedPct, reservedPct, freePct] = splitTo100([usedU, reservedU, freeU]);
  const allocatedU = usedU + reservedU;
  const allocatedPct = pct(allocatedU, totalU);                                  // 64.75
  const largestFree = RACKS.reduce((m, r) => (r.largestFreeU > m.largestFreeU ? r : m), RACKS[0]);
  const fullest = [...RACKS].filter((r) => r.kind === "rack")
    .sort((a, b) => a.freeU - b.freeU || b.usedU - a.usedU)[0];

  // ── IT load ──
  const rowKw = {};
  RACKS.forEach((r) => { rowKw[r.row] = (rowKw[r.row] || 0) + rackKw(r); });
  const rackItKw = sum(RACKS, rackKw);                                           // 141.30
  const torKw = countOf("tor") * floorOf("tor").kw;                              // 0.60
  const networkRoomItKw = sum(FLOOR.filter((f) => f.where === "network"), (f) => f.count * (f.kw || 0)); // 3.84
  const serverRoomItKw = rackItKw + torKw;                                       // 141.90
  const itKw = serverRoomItKw + networkRoomItKw;                                 // 145.74
  const busiestRack = RACKS.reduce((m, r) => (rackKw(r) > rackKw(m) ? r : m), RACKS[0]);

  // ── Power capacity — IT load against the IT rooms' power budgets ──
  const roomById = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
  const itBudgetKw = roomById.server.budgetKw + roomById.network.budgetKw;      // 220
  const facilityBudgetKw = sum(ROOMS, (r) => r.budgetKw);                        // 490 (5D "Load")
  const powerPct = pct(itKw, itBudgetKw);                                        // 66.2
  const upsInstalledKva = countOf("ups") * floorOf("ups").kva;                   // 1,200
  const upsUsableKw = (upsInstalledKva / 2) * A.upsPowerFactor;                  // 2N → 540
  const upsLoadPct = pct(itKw, upsUsableKw);                                     // 27.0

  // ── Cooling — Server Room heat against the PAC units ──
  const pacCount = countOf("pac");
  const coolingCapKw = pacCount * A.pacCoolingKw;                                // 180
  const coolingPct = pct(serverRoomItKw, coolingCapKw);                          // 78.8
  const pacNeeded = Math.ceil(serverRoomItKw / A.pacCoolingKw);                  // 5
  const pacSpare = pacCount - pacNeeded;                                         // 1 → N+1
  const nPlus1LimitKw = (pacCount - 1) * A.pacCoolingKw;                         // 150
  const pacLoads = PAC_UNITS.map((p) => {
    const kw = (rowKw[p.row] || 0) + (p.row === "A" ? torKw : 0);
    return { ...p, kw, pct: pct(kw, A.pacCoolingKw) };
  });
  const aisles = [1, 2, 3].map((n) => {
    const kw = sum(pacLoads.filter((p) => p.aisle === n), (p) => p.kw);
    return { aisle: n, rows: pacLoads.filter((p) => p.aisle === n).map((p) => p.row).join("–"), kw, pct: pct(kw, 2 * A.pacCoolingKw) };
  });
  const hottestPac = pacLoads.reduce((m, p) => (p.kw > m.kw ? p : m), pacLoads[0]);
  const hottestAisle = aisles.reduce((m, a) => (a.kw > m.kw ? a : m), aisles[0]);
  const coolestAisle = aisles.reduce((m, a) => (a.kw < m.kw ? a : m), aisles[0]);
  const chillerCop = A.chillerCoolingKw / A.chillerInputKw;                     // 2.5
  const chillerLoadPct = pct(serverRoomItKw, A.chillerCoolingKw);                // 56.8

  // ── Facility power, PUE, energy, carbon ──
  const upsLossKw = itKw / A.upsEfficiency - itKw;                               // 7.67
  const coolingInputKw = serverRoomItKw / chillerCop;                            // 56.76
  const lightingKw = (FACILITY.lengthM * FACILITY.breadthM * A.lightingWPerM2) / 1000; // 6.30
  const facilityKw = itKw + upsLossKw + coolingInputKw + lightingKw;            // 216.47
  const pue = facilityKw / itKw;                                                 // 1.485
  const dailyMwh = (facilityKw * 24) / 1000;                                     // 5.20
  const co2TonPerDay = dailyMwh * A.gridKgCo2PerKwh;                             // 3.74
  const powerSplit = splitTo100([itKw, coolingInputKw, upsLossKw, lightingKw]);

  // ── Per-room view (asset table) ──
  const where = (w) => FLOOR.filter((f) => f.where === w);
  const roomTable = [
    { id: "server", name: "Server Room", racks: racksTotal, servers,
      network: sum(where("server").filter((f) => f.group === "network"), (f) => f.count) + rackSwitches + passive,
      powerCooling: sum(where("server").filter((f) => f.group === "power" || f.group === "cooling"), (f) => f.count),
      loadKw: serverRoomItKw, budgetKw: roomById.server.budgetKw },
    { id: "network", name: "Network Room", racks: 0, servers: 0,
      network: sum(where("network"), (f) => f.count), powerCooling: 0,
      loadKw: networkRoomItKw, budgetKw: roomById.network.budgetKw },
    { id: "power", name: "Power Room", racks: 0, servers: 0, network: 0,
      powerCooling: sum(where("power"), (f) => f.count), loadKw: 0, budgetKw: roomById.power.budgetKw },
    { id: "battery", name: "Battery Room", racks: 0, servers: 0, network: 0,
      powerCooling: sum(where("battery"), (f) => f.count), loadKw: 0, budgetKw: roomById.battery.budgetKw },
    { id: "outdoor", name: "Yard & Roof", racks: 0, servers: 0, network: 0,
      powerCooling: sum([...where("yard"), ...where("roof")], (f) => f.count), loadKw: null, budgetKw: null },
  ].map((r) => ({ ...r, total: r.racks + r.servers + r.network + r.powerCooling }));

  return {
    // inventory
    floorDevices, racksTotal, servers, servers2U, servers4U, rackSwitches, passive, inRackItems,
    totalAssets, floorNetworkActive, networkDevices, powerDevices, coolingDevices, cablesTotal, rooms, gates,
    serverRacks: countOf("rack"), ndrs: countOf("ndr"), rdrs: countOf("rdr"),
    // space
    totalU, usedU, reservedU, freeU, usedPct, reservedPct, freePct, allocatedU, allocatedPct, largestFree, fullest,
    // power
    rowKw, rackItKw, torKw, networkRoomItKw, serverRoomItKw, itKw, busiestRack, busiestRackKw: rackKw(busiestRack),
    itBudgetKw, facilityBudgetKw, powerPct, upsInstalledKva, upsUsableKw, upsLoadPct,
    // cooling
    pacCount, coolingCapKw, coolingPct, pacNeeded, pacSpare, nPlus1LimitKw, pacLoads, aisles,
    hottestPac, hottestAisle, coolestAisle, chillerCop, chillerLoadPct,
    // energy
    upsLossKw, coolingInputKw, lightingKw, facilityKw, pue, dailyMwh, co2TonPerDay, powerSplit,
    roomTable,
  };
}

export const DCIM = calculate();
const D = DCIM;

// Short display strings, shared by both halves of the DCIM tab so they can
// never disagree with each other.
export const SHOW = {
  itKw: `${round(D.itKw)} kW`,
  powerPct: Math.round(D.powerPct),
  coolingPct: Math.round(D.coolingPct),
  coolingFreePct: 100 - Math.round(D.coolingPct),
  pue: round(D.pue, 2),
  pueTarget: 1.4,
};

// ═══════════════════════════════════════════════════════════════════════════
// 4 · OPERATIONS — alarms, tickets, changes (static, but tied to real 5D View
//     devices; every count shown on the dashboard is counted from these lists)
// ═══════════════════════════════════════════════════════════════════════════
export const SEVERITY_COLOR = { critical: "#e3343f", major: "#f18b20", minor: "#f2b400" };

export const ACTIVE_ALARMS = [
  { severity: "critical", device: "BAT2", title: "Battery Low", detail: "UPS2 string at 42% SoC", time: "11:28 AM" },
  { severity: "major", device: D.hottestPac.tag, title: "High Return Air Temp",
    detail: `27.4°C · Row ${D.hottestPac.row} at ${Math.round(D.hottestPac.pct)}% of unit`, time: "11:23 AM" },
  { severity: "major", device: "PDU1", title: "Phase Unbalance", detail: "12% · L1 heavy", time: "11:20 AM" },
  { severity: "major", device: "GPU-E1-01", title: "CPU Over-Temperature", detail: "RK-E1 · 4U GPU server", time: "11:18 AM" },
  { severity: "minor", device: "PAC-1W", title: "Condensate Pump Alarm", detail: "Drain pump cycling", time: "11:15 AM" },
  { severity: "minor", device: "GEN2", title: "Fuel Level Low", detail: "62% · refill below 65%", time: "11:09 AM" },
  { severity: "minor", device: D.fullest.alias, title: "Rack Space Low",
    detail: `${D.fullest.freeU}U free (${D.fullest.usedU} used · ${D.fullest.reservedU} reserved)`, time: "10:52 AM" },
  { severity: "minor", device: "CORE-B", title: "Fan Tray Speed High", detail: "Fan 2 at 88%", time: "10:41 AM" },
];

export const ALARM_SUMMARY = ["critical", "major", "minor"].reduce(
  (m, s) => ({ ...m, [s]: ACTIVE_ALARMS.filter((a) => a.severity === s).length }), {});

// Tickets raised this month. Every active alarm has auto-raised a ticket that
// is still open ("Pending" on the dashboard = "Open" on the Ticket page);
// the rest are incidents already resolved. Every device named is a real 5D
// View asset. Dates are counted back from today, so the list stays current.
const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};
// The people who work the tickets (Ticket page's technicians) — each takes
// the systems of their team.
export const TECHNICIANS = [
  { id: 1, name: "Rajesh Kumar", dept: "IT Support" },
  { id: 2, name: "Priya Sharma", dept: "Network Team" },
  { id: 3, name: "Amit Verma", dept: "Security Team" },
  { id: 4, name: "Neha Gupta", dept: "Facilities (Power & Cooling)" },
];
const ALARM_TICKET = {
  "BAT2": { status: "In Progress", priority: "Urgent", category: "Power", assignedTo: "Neha Gupta" },
  [D.hottestPac.tag]: { status: "In Progress", priority: "High", category: "Cooling", assignedTo: "Neha Gupta" },
  "PDU1": { status: "In Progress", priority: "High", category: "Power", assignedTo: "Neha Gupta" },
  "GPU-E1-01": { status: "In Progress", priority: "High", category: "Hardware", assignedTo: "Rajesh Kumar" },
  "PAC-1W": { status: "In Progress", priority: "Medium", category: "Cooling", assignedTo: "Neha Gupta" },
  "GEN2": { status: "Open", priority: "Medium", category: "Power", assignedTo: null },
  [D.fullest.alias]: { status: "Open", priority: "Low", category: "Hardware", assignedTo: null },
  "CORE-B": { status: "Open", priority: "Low", category: "Network", assignedTo: null },
};
const RESOLVED_TICKETS = [
  { device: "RPDU-2B", title: "Breaker trip on RPDU-2B — Row B B-side cords", category: "Power", priority: "High", daysAgo: 12, assignedTo: "Neha Gupta" },
  { device: "UPS3", title: "UPS3 battery self-test failed (re-test passed)", category: "Power", priority: "Medium", daysAgo: 11, assignedTo: "Neha Gupta" },
  { device: "PAC-2W", title: "PAC-2W air filter clogged — filter replaced", category: "Cooling", priority: "Medium", daysAgo: 11, assignedTo: "Neha Gupta" },
  { device: "ToR-A", title: "ToR-A uplink to DIST-B flapping", category: "Network", priority: "High", daysAgo: 10, assignedTo: "Priya Sharma" },
  { device: "APP-C2-03", title: "APP-C2-03 PSU-2 failure — PSU replaced", category: "Hardware", priority: "High", daysAgo: 9, assignedTo: "Rajesh Kumar" },
  { device: "WEB-D4-02", title: "WEB-D4-02 disk failure — RAID rebuilt", category: "Hardware", priority: "Medium", daysAgo: 9, assignedTo: "Rajesh Kumar" },
  { device: "FW-B", title: "FW-A / FW-B HA sync lost for 4 minutes", category: "Security", priority: "Urgent", daysAgo: 8, assignedTo: "Amit Verma" },
  { device: "NDR-3", title: "High loss on NDR-3 → RDR-D OM4 trunk — connectors cleaned", category: "Network", priority: "Medium", daysAgo: 7, assignedTo: "Priya Sharma" },
  { device: "CH-01", title: "CH-01 compressor 2 high-pressure trip", category: "Cooling", priority: "Urgent", daysAgo: 6, assignedTo: "Neha Gupta" },
  { device: "GEN1", title: "GEN1 monthly load test — exhaust smoke check", category: "Power", priority: "Low", daysAgo: 6, assignedTo: "Neha Gupta" },
  { device: "PAC-2E", title: "PAC-2E leak-detection cable test", category: "Cooling", priority: "Low", daysAgo: 5, assignedTo: "Neha Gupta" },
  { device: "MGMT-E-01", title: "MGMT-E-01 unreachable after OS patching", category: "Software", priority: "Medium", daysAgo: 4, assignedTo: "Rajesh Kumar" },
  { device: "DNS-2-01", title: "DNS-2-01 zone transfer failing", category: "Application", priority: "Medium", daysAgo: 3, assignedTo: "Priya Sharma" },
  { device: "RK-E2", title: "RK-E2 rear door sensor fault", category: "Hardware", priority: "Low", daysAgo: 3, assignedTo: "Rajesh Kumar" },
  { device: "ISP-B", title: "ISP-B latency spike to 120 ms", category: "Network", priority: "High", daysAgo: 2, assignedTo: "Priya Sharma", slaBreached: true },
  { device: "GPU-B1-01", title: "GPU-B1-01 driver crash — CUDA driver updated", category: "Software", priority: "Medium", daysAgo: 1, assignedTo: "Rajesh Kumar" },
];
export const TICKET_LIST = [
  ...RESOLVED_TICKETS.map((t) => ({ ...t, status: "Resolved", createdBy: "NOC Desk" })),
  ...ACTIVE_ALARMS.map((a) => ({
    device: a.device, title: `${a.device} — ${a.title} (${a.detail})`, daysAgo: 0, createdBy: "DCIM Alarm",
    ...ALARM_TICKET[a.device],
  })),
].map((t, i) => ({
  id: i + 1,
  ticketNo: `INC-${String(i + 1).padStart(3, "0")}`,
  title: t.title,
  category: t.category,
  priority: t.priority,
  status: t.status,
  createdBy: t.createdBy,
  assignedTo: t.assignedTo || null,
  createdDate: isoDaysAgo(t.daysAgo),
  device: t.device,
  slaBreached: !!t.slaBreached,
}));
const ticketsWith = (status) => TICKET_LIST.filter((t) => t.status === status).length;
export const TICKETS = {
  inProgress: ticketsWith("In Progress"),                                         // 5
  pending: ticketsWith("Open"),                                                   // 3
  resolved: ticketsWith("Resolved"),                                              // 16
  resolvedWithinSla: TICKET_LIST.filter((t) => t.status === "Resolved" && !t.slaBreached).length, // 15
  open: ticketsWith("In Progress") + ticketsWith("Open"),                        // 8 = active alarms
  total: TICKET_LIST.length,                                                      // 24
};

// Change requests raised this month. Open ones are listed; the pipeline and
// the KPI card are counted from them.
const CR_HISTORY = { completed: 36, completedOnTime: 33, avgApprovalDays: 2.3 };
export const OPEN_CHANGES = [
  { id: "CHG-1047", title: "Install 4U GPU server — RK-C4 (5U AI / GPU pilot block)", status: "Approved", stage: "Scheduled", risk: "Medium" },
  { id: "CHG-1046", title: "Battery string replacement — BAT2", status: "Pending Approval", stage: "Review", risk: "Medium" },
  { id: "CHG-1045", title: `Compressor service — ${D.hottestPac.tag}`, status: "In Progress", stage: "Execution", risk: "High" },
  { id: "CHG-1044", title: "Firmware upgrade — UPS3", status: "Approved", stage: "Scheduled", risk: "Low" },
  { id: "CHG-1043", title: "Re-terminate OM4 trunk NDR-3 → RDR-D", status: "Pending Approval", stage: "Review", risk: "Low" },
  { id: "CHG-1042", title: "Rebalance PDU1 phases (L1 → L3)", status: "Submitted", stage: "Intake", risk: "Medium" },
];
const countStatus = (s) => OPEN_CHANGES.filter((c) => c.status === s).length;
export const CHANGES = {
  open: OPEN_CHANGES.length,                                                     // 6
  completed: CR_HISTORY.completed,
  raised: OPEN_CHANGES.length + CR_HISTORY.completed,                            // 42
  onTimePct: pct(CR_HISTORY.completedOnTime, CR_HISTORY.completed),              // 91.7
  avgApprovalDays: CR_HISTORY.avgApprovalDays,
  pipeline: [
    { label: "Submitted", value: countStatus("Submitted") },
    { label: "In Review", value: countStatus("Pending Approval") },
    { label: "Approved", value: countStatus("Approved") },
    { label: "In Progress", value: countStatus("In Progress") },
    { label: "Completed", value: CR_HISTORY.completed },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// 5 · HEALTH INDEX — actual value for every Excel parameter (by id)
// ═══════════════════════════════════════════════════════════════════════════
// Server fleet telemetry (no 5D View equivalent). The asset register gives
// every one of the 312 servers its own reading, spread around exactly these
// averages, so the DCIM tab's System Health panel, the Asset Dashboard and
// the IT capacity parameter below all show the same figures.
export const CPU_LOAD_AVG_PCT = 68;
export const MEMORY_UTIL_PCT = 82;
export const DISK_UTIL_PCT = 78;
export const GPU_UTIL_PCT = 55;

// `src` names where a value comes from: "5D" = calculated from the 5D View
// above, "ops" = operational demo input (no 5D View equivalent).
const r1 = (n) => round(n, 1);
export const HEALTH_ACTUALS = {
  // Power Health
  1: { v: 100, src: `5D: both feeds (A/B) live to all ${D.racksTotal} racks` },
  2: { v: 100, src: `5D: ${countOf("ups")}/${countOf("ups")} UPS modules online` },
  3: { v: 100, src: `5D: ${countOf("dgset")}/${countOf("dgset")} DG sets available` },
  4: { v: 100, src: `5D: ${countOf("pdu") + countOf("rowpdu")}/${countOf("pdu") + countOf("rowpdu")} PDUs healthy (2 room + 12 row)` },
  5: { v: 96, src: "ops: PDU1 phase unbalance alarm" },
  6: { v: r1(D.powerPct), src: `5D: IT load ${r1(D.itKw)} kW ÷ IT room budget ${D.itBudgetKw} kW` },
  7: { v: 100, src: "5D: 2N UPS, N+1 DG, N+2 transformers" },
  8: { v: SHOW.pue, src: `5D: ${r1(D.facilityKw)} kW facility ÷ ${r1(D.itKw)} kW IT` },
  // DC Operations
  9: { v: r1(CHANGES.onTimePct), src: `ops: ${CR_HISTORY.completedOnTime}/${CR_HISTORY.completed} changes closed on time` },
  10: { v: 97, src: "ops" },
  11: { v: r1(pct(TICKETS.resolvedWithinSla, TICKETS.resolved)), src: `ops: ${TICKETS.resolvedWithinSla}/${TICKETS.resolved} tickets closed within SLA` },
  12: { v: 96, src: "ops" },
  13: { v: 100, src: `5D: ${D.totalAssets}/${D.totalAssets} assets tagged in the 5D View` },
  14: { v: 94, src: "ops" },
  15: { v: 97, src: "ops" },
  16: { v: 92, src: "ops" },
  // Facility Health
  17: { v: 100, src: `5D: ${D.powerDevices}/${D.powerDevices} electrical assets online` },
  18: { v: 95, src: "ops: PAC-1W condensate pump alarm" },
  19: { v: 100, src: "ops" },
  20: { v: 96, src: "ops" },
  21: { v: 99, src: "ops" },
  22: { v: 97, src: "ops" },
  23: { v: 92, src: "ops" },
  24: { v: r1(D.allocatedPct), src: `5D: ${D.allocatedU.toLocaleString("en-IN")} of ${D.totalU.toLocaleString("en-IN")} U allocated (used + reserved)` },
  // Network Health
  25: { v: 100, src: "5D: dual WAN / ISP / core / firewall / distribution (A + B)" },
  26: { v: 68, src: "ops" },
  27: { v: 2.4, src: "ops" },
  28: { v: 0.02, src: "ops" },
  29: { v: 100, src: "5D: A/B path at every layer; each RDR fed from an A and a B NDR" },
  30: { v: 100, src: "5D: 4/4 core + distribution devices up" },
  31: { v: 100, src: `5D: ${IN_RACK.serversByRole.DNS}/${IN_RACK.serversByRole.DNS} DNS / DHCP servers (NDR racks)` },
  32: { v: 96, src: "ops" },
  // IT Infrastructure Health
  33: { v: r1(pct(D.servers - 1, D.servers)), src: `5D: ${D.servers - 1}/${D.servers} servers healthy (GPU-E1-01 alarm)` },
  34: { v: 99, src: "ops" },
  35: { v: 98, src: "ops" },
  36: { v: 99.5, src: "ops" },
  37: { v: 99.95, src: "ops" },
  38: { v: 95, src: "ops" },
  39: { v: CPU_LOAD_AVG_PCT, src: "ops: CPU load average (System Health)" },
  40: { v: 96, src: "ops" },
  // Security Health
  41: { v: 100, src: `5D: ${D.gates}/${D.gates} room gates (ENTRY + EXIT) secured` },
  42: { v: 97, src: "ops" },
  43: { v: 100, src: "ops" },
  44: { v: 100, src: "ops" },
  45: { v: 100, src: "ops" },
  46: { v: 96, src: "ops" },
  47: { v: 0, src: "ops" },
  48: { v: 95, src: "ops" },
  // Environment Health
  49: { v: ROOM_TEMP_C.server, src: "5D: Server Room average (Thermal Monitoring)" },
  50: { v: 47, src: "ops" },
  51: { v: 96, src: "ops" },
  52: { v: 100, src: "ops" },
  53: { v: 100, src: "ops" },
  54: { v: 97, src: "ops" },
  55: { v: 95, src: "ops" },
  56: { v: 84, src: "ops" },
  // Cooling Health
  57: { v: 100, src: `5D: ${D.pacCount}/${D.pacCount} PAC units running` },
  58: { v: 100, src: "5D: CH-01 online" },
  59: { v: r1(D.coolingPct), src: `5D: ${r1(D.serverRoomItKw)} kW heat ÷ ${D.coolingCapKw} kW PAC` },
  60: { v: D.pacSpare >= 1 ? 100 : r1(pct(D.pacCount, D.pacNeeded + 1)), src: `5D: N+1 needs ${D.pacNeeded + 1} PAC units, ${D.pacCount} installed` },
  61: { v: ROOM_TEMP_C.server, src: "5D: Server Room average (Thermal Monitoring)" },
  62: { v: 47, src: "ops" },
  63: { v: 95, src: `ops: ${FACILITY.perforatedTiles} perforated tiles for ${D.racksTotal} racks` },
  64: { v: 88, src: "ops" },
};

// ═══════════════════════════════════════════════════════════════════════════
// 6 · NARRATIVE — insights and maintenance lines, written from the numbers
// ═══════════════════════════════════════════════════════════════════════════
const monthsUntil = (fromPct, toPct, perMonth) => Math.max(0, Math.ceil((toPct - fromPct) / perMonth));
export const INSIGHTS = [
  `Cold aisle ${D.hottestAisle.aisle} (Rows ${D.hottestAisle.rows}) is at ${Math.round(D.hottestAisle.pct)}% of its PAC capacity — place new load in Rows ${D.coolestAisle.rows} (${Math.round(D.coolestAisle.pct)}%).`,
  `N+1 cooling holds up to ${D.nPlus1LimitKw} kW (now ${round(D.serverRoomItKw)} kW) — about ${monthsUntil(D.coolingPct, pct(D.nPlus1LimitKw, D.coolingCapKw), A.coolingGrowthPctPerMonth)} months at current growth.`,
  `${D.freeU} U free across ${D.racksTotal} racks, but the largest contiguous block is ${D.largestFree.largestFreeU}U (${D.largestFree.alias}).`,
];

export const MAINTENANCE = [
  { name: D.hottestPac.tag, issue: `High load ${Math.round(D.hottestPac.pct)}% · failure risk`, level: "critical", icon: "🔴" },
  { name: "BAT2", issue: "Replace in 15 days", level: "warn", icon: "🟡" },
  { name: "GPU-E1-01 · RK-E1", issue: "Overheating alert", level: "ok", icon: "🟡" },
];

// Seven-point history ending on today's value (for the KPI sparklines).
export function trail(end, step, n = 7, decimals = 0) {
  return Array.from({ length: n }, (_, i) => round(end - step * (n - 1 - i), decimals));
}

// Twelve monthly points: six up to now, six forecast at `perMonth`.
export function forecast(nowPct, perMonth) {
  return Array.from({ length: 12 }, (_, i) => round(Math.min(100, nowPct + (i - 5) * perMonth), 1));
}
