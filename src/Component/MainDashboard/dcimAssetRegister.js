// ═══════════════════════════════════════════════════════════════════════════
// dcimAssetRegister.js — every asset in the 5D View, as one register
// ---------------------------------------------------------------------------
// The Dashboard (DCIM tab), Asset Dashboard, Onboarding, Type, Category,
// Manufacturer and Model Specifications pages all read their asset data from
// this one list, so every page counts the same 664 assets the 5D View has:
//
//     97 devices standing on the floor   (5D View Facility card: "Devices")
//  + 567 items mounted in its 46 racks   (Rack View / STORAGE view)
//
// What is copied from the 5D View (idealDatacenterDemo.js +
// idealDemoRackFill.js): every floor device's asset tag, type and rating,
// where it stands, and what sits in every rack U by U. What the 5D View does
// not hold — manufacturer, model, price, dates, serials, live readings — is
// demo master data, defined once below (CATALOGUE and the telemetry
// generators) so that it, too, is the same on every page.
// ═══════════════════════════════════════════════════════════════════════════
import {
  FLOOR, ROOMS, RACKS as RACK_STATS, RACK_U, DCIM, ASSUMPTIONS, PAC_UNITS, ROOM_TEMP_C,
  ACTIVE_ALARMS, CPU_LOAD_AVG_PCT, MEMORY_UTIL_PCT, DISK_UTIL_PCT, GPU_UTIL_PCT,
} from "./dcimDashboardData";

// ── helpers ──────────────────────────────────────────────────────────────
const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);
const round = (n, d = 0) => { const p = 10 ** d; return Math.round(n * p) / p; };
const countBy = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});

// Small seeded PRNG (the same FNV-1a + mulberry mix idealDemoRackFill.js
// uses), so a reading generated for an asset is identical on every load and
// on every page that shows it.
function seeded(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = (key) => seeded(key)();
const jitter = (key, amp) => (rand(key) * 2 - 1) * amp;

// One reading per key, spread ±spread around `mean`, whose average is EXACTLY
// `mean` at the given precision. Fleet averages shown on one page (e.g. CPU
// 68% on the DCIM tab) therefore equal the average of the per-server values
// listed on another (the Asset Dashboard's server table).
function spreadAround(keys, mean, spread, decimals = 0) {
  if (!keys.length) return [];
  const raw = keys.map((k) => rand(k) * 2 - 1);
  const avg = sum(raw) / raw.length;
  const p = 10 ** decimals;
  const vals = raw.map((r) => Math.round((mean + (r - avg) * spread) * p));
  let diff = Math.round(mean * p * vals.length) - sum(vals);
  for (let i = 0; diff !== 0; i = (i + 1) % vals.length) {
    const step = Math.sign(diff);
    vals[i] += step;
    diff -= step;
  }
  return vals.map((v) => v / p);
}

const addYears = (iso, years) => {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
};
const dateIn = (key, from, toExclusive) => {
  const a = new Date(from).getTime(), b = new Date(toExclusive).getTime();
  return new Date(a + Math.floor(rand(key) * (b - a) / 864e5) * 864e5).toISOString().split("T")[0];
};

// ═══════════════════════════════════════════════════════════════════════════
// 1 · CATALOGUE — one entry per kind of asset (demo master data)
// ═══════════════════════════════════════════════════════════════════════════
// `type` is the name the 5D View gives the device (Properties → Type), so a
// type means the same thing everywhere. `category` uses the Category master's
// names. Prices are in ₹.
export const CATEGORY_NAMES = ["Compute", "Cooling", "Power", "Network", "Security", "Storage", "Safety", "Environment"];

export const CATALOGUE = {
  transformer: { type: "Transformer", category: "Power", manufacturer: "Schneider Electric", model: "Dry-Type Transformer 1000 kVA", rating: "1000 kVA", priceInr: 4500000, warrantyYears: 2, lifeYears: 25, icon: "FaBolt", iconColor: "#fadb14", description: "HT/LT transformer in the yard; three feed the LT busway", specs: [["Power", "Rating", "1000 kVA"], ["Power", "Voltage", "11 kV / 415 V"], ["Cooling", "Type", "Dry type, AN"]] },
  busway: { type: "Busway", category: "Power", manufacturer: "Schneider Electric", model: "LT Busway 2500 A", rating: "2500 A", priceInr: 1800000, warrantyYears: 2, lifeYears: 25, icon: "FaBolt", iconColor: "#eab308", description: "LT busbar trunking that the transformers and DG sets land on", specs: [["Power", "Current", "2500 A"], ["Power", "Voltage", "415 V, 3-phase"]] },
  dgset: { type: "DG Set", category: "Power", manufacturer: "Cummins", model: "Diesel Generator Set 750 kVA", rating: "750 kVA", priceInr: 8500000, warrantyYears: 2, lifeYears: 20, icon: "FaCogs", iconColor: "#e67e22", description: "Standby diesel generator, one per main power panel", specs: [["Power", "Rating", "750 kVA standby"], ["Power", "Voltage", "415 V, 50 Hz"], ["Fuel", "Tank", "990 L"]] },
  mpp: { type: "MPP (Main Power Panel)", category: "Power", manufacturer: "Schneider Electric", model: "Main LV Panel 2500 A", rating: "2500 A", priceInr: 2200000, warrantyYears: 2, lifeYears: 25, icon: "FaTachometerAlt", iconColor: "#6366f1", description: "A- and B-side main LV panels fed from the busway and their DG set", specs: [["Power", "Bus rating", "2500 A"], ["Power", "Incomers", "Busway + DG"]] },
  pp: { type: "PP (Power Panel)", category: "Power", manufacturer: "Schneider Electric", model: "Sub Power Panel 400 A", rating: "400 A", priceInr: 450000, warrantyYears: 2, lifeYears: 25, icon: "FaTachometerAlt", iconColor: "#0ea5e9", description: "Sub panels fed from both MPPs: PP1 mechanical, PP2 / PP3 IT", specs: [["Power", "Rating", "400 A"], ["Power", "Feeds", "Dual (MPP1 + MPP2)"]] },
  ups: { type: "UPS Module", category: "Power", manufacturer: "Vertiv", model: "Online UPS 300 kVA", rating: "300 kVA", priceInr: 3200000, warrantyYears: 3, lifeYears: 12, icon: "FaExclamationTriangle", iconColor: "#f59e0b", description: "Double-conversion UPS, two per IT side (2N)", specs: [["Power", "Rating", "300 kVA / 270 kW (0.9 pf)"], ["Power", "Efficiency", "95%"], ["Battery", "String", "40 kWh VRLA"]] },
  pdu: { type: "PDU Cabinet", category: "Power", manufacturer: "Vertiv", model: "Room PDU Cabinet 400 A", rating: "400 A", priceInr: 900000, warrantyYears: 3, lifeYears: 20, icon: "FaPlug", iconColor: "#14b8a6", description: "Room PDUs: PDU1 = A side, PDU2 = B side", specs: [["Power", "Rating", "400 A, 415 V"], ["Power", "Ways", "42"]] },
  rowpdu: { type: "PDU Cabinet", category: "Power", manufacturer: "Raritan", model: "Row PDU 125 A", rating: "125 A", priceInr: 240000, warrantyYears: 3, lifeYears: 15, icon: "FaPlug", iconColor: "#0d9488", description: "End-of-row PDUs: two per rack row (A and B side)", specs: [["Power", "Rating", "125 A, 415 V, 3-phase"], ["Power", "Outlets", "24 metered"]] },
  battery: { type: "Battery Bank", category: "Power", manufacturer: "Exide", model: "VRLA Battery Bank 40 kWh", rating: "40 kWh", priceInr: 1400000, warrantyYears: 3, lifeYears: 5, icon: "FaBatteryFull", iconColor: "#059669", description: "One battery string per UPS, in the Battery Room", specs: [["Battery", "Energy", "40 kWh"], ["Battery", "Chemistry", "VRLA"]] },
  pac: { type: "PAC Unit", category: "Cooling", manufacturer: "Vertiv", model: "Precision Air Conditioner 30 kW", rating: "30 kW", priceInr: 1200000, warrantyYears: 2, lifeYears: 15, icon: "FaFan", iconColor: "#0891b2", description: "Chilled-water PAC at each end of every cold aisle", specs: [["Cooling", "Capacity", "30 kW"], ["Cooling", "Supply air", "18 °C"], ["Cooling", "Water", "Chilled water from CH-01"]] },
  chiller: { type: "Chiller", category: "Cooling", manufacturer: "Carrier", model: "Air-Cooled Chiller 250 kW", rating: "100 kW", priceInr: 6000000, warrantyYears: 2, lifeYears: 20, icon: "FaSnowflake", iconColor: "#16a085", description: "Rooftop chiller feeding the six PAC units", specs: [["Cooling", "Capacity", "250 kW"], ["Power", "Input", "100 kW (COP 2.5)"], ["Cooling", "Water", "7 / 12 °C"]] },
  wan: { type: "Internet / WAN", category: "Network", manufacturer: "Juniper Networks", model: "WAN Edge Hand-off", rating: "N/A", priceInr: 250000, warrantyYears: 3, lifeYears: 7, icon: "FaCloud", iconColor: "#0ea5e9", description: "Carrier hand-off feeding both ISP uplinks", specs: [["Network", "Links", "2 × 10 GbE"]] },
  isp: { type: "ISP Uplink", category: "Network", manufacturer: "Juniper Networks", model: "ISP Uplink Router", rating: "120 W", kw: 0.12, priceInr: 400000, warrantyYears: 3, lifeYears: 7, icon: "FaWifi", iconColor: "#0284c7", description: "Diverse ISP uplinks, A and B", specs: [["Network", "Ports", "4 × 10 GbE"], ["Power", "Draw", "120 W"]] },
  core: { type: "Core Router", category: "Network", manufacturer: "Cisco Systems", model: "Core Router 36 × 100G", rating: "900 W", kw: 0.9, priceInr: 3500000, warrantyYears: 3, lifeYears: 7, icon: "FaSitemap", iconColor: "#ef4444", description: "Core routing, A and B", specs: [["Network", "Ports", "36 × 100 GbE"], ["Power", "Draw", "900 W"]] },
  firewall: { type: "Firewall", category: "Security", manufacturer: "Fortinet", model: "Next-Gen Firewall", rating: "300 W", kw: 0.3, priceInr: 1600000, warrantyYears: 3, lifeYears: 7, icon: "FaShieldAlt", iconColor: "#c0392b", description: "Perimeter firewalls in an A/B HA pair", specs: [["Network", "Ports", "16 × 10 GbE"], ["Security", "HA", "Active / standby"]] },
  dist: { type: "Distribution Switch", category: "Network", manufacturer: "Cisco Systems", model: "Distribution Switch 32 × 40G", rating: "600 W", kw: 0.6, priceInr: 1200000, warrantyYears: 3, lifeYears: 7, icon: "FaSitemap", iconColor: "#8b5cf6", description: "Aggregation layer between the firewalls and the ToR switches", specs: [["Network", "Ports", "32 × 40 GbE"], ["Power", "Draw", "600 W"]] },
  tor: { type: "Access Switch (ToR)", category: "Network", manufacturer: "Cisco Systems", model: "Access Switch 48 × 10G", rating: "300 W", kw: 0.3, priceInr: 350000, warrantyYears: 3, lifeYears: 7, icon: "FaNetworkWired", iconColor: "#6366f1", description: "Access switches that close the NDR row", specs: [["Network", "Ports", "48 × 10 GbE + 6 × 40 GbE"], ["Power", "Draw", "300 W"]] },
  ndr: { type: "Network Distribution Rack", category: "Network", manufacturer: "Schneider Electric", model: "Network Rack 42U (NDR)", rating: "2 kW", priceInr: 150000, warrantyYears: 5, lifeYears: 15, icon: "FaCubes", iconColor: "#4f46e5", description: "MDA row: aggregation switches and fibre to every RDR", specs: [["Space", "Height", "42U"], ["Power", "Budget", "2 kW"]] },
  rdr: { type: "Row Distribution Rack", category: "Network", manufacturer: "Schneider Electric", model: "Network Rack 42U (RDR)", rating: "1.5 kW", priceInr: 150000, warrantyYears: 5, lifeYears: 15, icon: "FaCubes", iconColor: "#7c3aed", description: "Head of every server row: copper and fibre to each rack", specs: [["Space", "Height", "42U"], ["Power", "Budget", "1.5 kW"]] },
  rack: { type: "Rack", category: "Compute", manufacturer: "Schneider Electric", model: "Server Rack 42U", rating: "6 kW", priceInr: 120000, warrantyYears: 5, lifeYears: 15, icon: "FaCubes", iconColor: "#3b82f6", description: "Server cabinets, dual-corded to the row PDUs", specs: [["Space", "Height", "42U"], ["Power", "Budget", "6 kW"], ["Space", "Size", "600 × 1000 mm"]] },
  serverA: { type: "Rack Server", category: "Compute", manufacturer: "Dell Technologies", model: "Rack Server — Model A (5-Bay) 2U", rating: "350 W", kw: ASSUMPTIONS.kwPer2UServer, sizeU: 2, priceInr: 650000, warrantyYears: 3, lifeYears: 6, icon: "FaServer", iconColor: "#1890ff", description: "2U application server", specs: [["Compute", "Form factor", "2U, 5 drive bays"], ["Power", "Typical draw", "350 W"], ["Network", "NICs", "4 × 10 GbE"]] },
  serverB: { type: "Rack Server", category: "Compute", manufacturer: "Dell Technologies", model: "Rack Server — Model B (Dual PSU) 2U", rating: "350 W", kw: ASSUMPTIONS.kwPer2UServer, sizeU: 2, priceInr: 600000, warrantyYears: 3, lifeYears: 6, icon: "FaServer", iconColor: "#1890ff", description: "2U web / service server", specs: [["Compute", "Form factor", "2U, 8 drive bays"], ["Power", "Typical draw", "350 W, dual PSU"]] },
  serverC: { type: "Rack Server", category: "Compute", manufacturer: "Dell Technologies", model: "Rack Server — Model C (Expansion Chassis) 4U", rating: "1 kW", kw: ASSUMPTIONS.kwPer4UServer, sizeU: 4, priceInr: 2800000, warrantyYears: 3, lifeYears: 6, icon: "FaMicrochip", iconColor: "#722ed1", description: "4U GPU / expansion server", specs: [["Compute", "Form factor", "4U, PCIe expansion"], ["Compute", "GPUs", "4"], ["Power", "Typical draw", "1 kW"]] },
  rackSwitch: { type: "Rack Switch", category: "Network", manufacturer: "Cisco Systems", model: "Switch · 48 × 1G + 4 × SFP+ (1U)", rating: "100 W", kw: ASSUMPTIONS.kwPerRackSwitch, sizeU: 1, priceInr: 180000, warrantyYears: 3, lifeYears: 7, icon: "FaSitemap", iconColor: "#13c2c2", description: "Aggregation switches in the NDRs, access switches in the RDRs", specs: [["Network", "Ports", "48 × 1 GbE + 4 × SFP+"], ["Power", "Draw", "100 W"]] },
  patchPanel: { type: "Patch Panel", category: "Network", manufacturer: "Panduit", model: "Cat6 Patch Panel · 24-port (1U)", rating: "—", sizeU: 1, priceInr: 12000, warrantyYears: 15, lifeYears: 20, icon: "FaNetworkWired", iconColor: "#13c2c2", description: "Copper patching (Cat6) in every rack", specs: [["Network", "Ports", "24 × RJ45 Cat6"]] },
  fibreLiu: { type: "Fibre LIU", category: "Network", manufacturer: "Corning", model: "Fibre LIU · 12 × LC duplex OM4 (1U)", rating: "—", sizeU: 1, priceInr: 18000, warrantyYears: 15, lifeYears: 20, icon: "FaNetworkWired", iconColor: "#0ea5e9", description: "Fibre termination (OM4) in every rack", specs: [["Network", "Ports", "12 × LC duplex, OM4"]] },
  cableManager: { type: "Cable Manager", category: "Network", manufacturer: "Panduit", model: "Horizontal Cable Manager (1U)", rating: "—", sizeU: 1, priceInr: 3500, warrantyYears: 15, lifeYears: 20, icon: "FaList", iconColor: "#8c8c8c", description: "1U horizontal cable management", specs: [["Space", "Height", "1U"]] },
};

// Every manufacturer in the register's master list — the ones the floor uses,
// plus vendors already in the Manufacturer master that supply nothing here.
export const MANUFACTURERS = [
  { name: "Cisco Systems", websiteUrl: "https://www.cisco.com", supportUrl: "https://www.cisco.com/support", responsiblePerson: "John Smith", contactNo: "+1-408-526-4000", createdDate: "2024-01-15" },
  { name: "Dell Technologies", websiteUrl: "https://www.dell.com", supportUrl: "https://www.dell.com/support", responsiblePerson: "Emily Johnson", contactNo: "+1-800-624-9897", createdDate: "2024-01-20" },
  { name: "HP Inc", websiteUrl: "https://www.hp.com", supportUrl: "https://support.hp.com", responsiblePerson: "Michael Brown", contactNo: "+1-650-857-1501", createdDate: "2024-02-10" },
  { name: "Lenovo", websiteUrl: "https://www.lenovo.com", supportUrl: "https://support.lenovo.com", responsiblePerson: "Sarah Davis", contactNo: "+1-855-253-6686", createdDate: "2024-02-15" },
  { name: "Juniper Networks", websiteUrl: "https://www.juniper.net", supportUrl: "https://www.juniper.net/support", responsiblePerson: "Robert Wilson", contactNo: "+1-408-745-2000", createdDate: "2024-03-01" },
  { name: "Fortinet", websiteUrl: "https://www.fortinet.com", supportUrl: "https://www.fortinet.com/support", responsiblePerson: "Jessica Martinez", contactNo: "+1-408-235-7700", createdDate: "2024-03-10" },
  { name: "VMware", websiteUrl: "https://www.vmware.com", supportUrl: "https://www.vmware.com/support", responsiblePerson: "David Anderson", contactNo: "+1-877-486-9273", createdDate: "2024-03-15" },
  { name: "Microsoft", websiteUrl: "https://www.microsoft.com", supportUrl: "https://support.microsoft.com", responsiblePerson: "Laura Thompson", contactNo: "+1-800-642-7676", createdDate: "2024-04-01" },
  { name: "Schneider Electric", websiteUrl: "https://www.se.com", supportUrl: "https://www.se.com/in/en/work/support", responsiblePerson: "Anil Mehta", contactNo: "+91-124-388-8888", createdDate: "2025-05-12" },
  { name: "Vertiv", websiteUrl: "https://www.vertiv.com", supportUrl: "https://www.vertiv.com/en-in/support", responsiblePerson: "Kavita Rao", contactNo: "+91-22-6720-8000", createdDate: "2025-05-12" },
  { name: "Cummins", websiteUrl: "https://www.cummins.com", supportUrl: "https://www.cummins.com/support", responsiblePerson: "Sanjay Kulkarni", contactNo: "+91-20-6706-7000", createdDate: "2025-05-20" },
  { name: "Carrier", websiteUrl: "https://www.carrier.com", supportUrl: "https://www.carrier.com/commercial/en/in", responsiblePerson: "Meera Iyer", contactNo: "+91-124-482-5500", createdDate: "2025-05-20" },
  { name: "Raritan", websiteUrl: "https://www.raritan.com", supportUrl: "https://www.raritan.com/support", responsiblePerson: "Vikram Shah", contactNo: "+91-80-4012-2700", createdDate: "2025-06-02" },
  { name: "Exide", websiteUrl: "https://www.exideindustries.com", supportUrl: "https://www.exideindustries.com/contact-us", responsiblePerson: "Arjun Das", contactNo: "+91-33-2302-3400", createdDate: "2025-06-02" },
  { name: "Panduit", websiteUrl: "https://www.panduit.com", supportUrl: "https://www.panduit.com/en/support", responsiblePerson: "Ritu Bansal", contactNo: "+91-80-4932-0000", createdDate: "2025-06-10" },
  { name: "Corning", websiteUrl: "https://www.corning.com", supportUrl: "https://www.corning.com/in/en/support", responsiblePerson: "Harish Nair", contactNo: "+91-80-4900-6000", createdDate: "2025-06-10" },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2 · WHAT THE 5D VIEW HOLDS (copied from the demo floor)
// ═══════════════════════════════════════════════════════════════════════════
const ROOM_LABEL = {
  yard: "Transformer Yard", roof: "Roof Plant Deck", power: "Power Room",
  battery: "Battery Room", network: "Network Room", server: "Server Room",
};
const ROWS = ["A", "B", "C", "D", "E", "F"];

// Asset tag of every floor device, by FLOOR key, as the 5D View tags them.
const FLOOR_TAGS = {
  transformer: ["T1", "T2", "T3"],
  busway: ["BUSWAY"],
  dgset: ["GEN1", "GEN2"],
  mpp: ["MPP1", "MPP2"],
  pp: ["PP1", "PP2", "PP3"],
  ups: ["UPS1", "UPS2", "UPS3", "UPS4"],
  pdu: ["PDU1", "PDU2"],
  battery: ["BAT1", "BAT2", "BAT3", "BAT4"],
  rowpdu: ROWS.flatMap((_, i) => [`RPDU-${i + 1}A`, `RPDU-${i + 1}B`]),
  pac: PAC_UNITS.map((p) => p.tag),
  chiller: ["CH-01"],
  wan: ["WAN"],
  isp: ["ISP-A", "ISP-B"],
  core: ["CORE-A", "CORE-B"],
  firewall: ["FW-A", "FW-B"],
  dist: ["DIST-A", "DIST-B"],
  tor: ["ToR-A", "ToR-B"],
  ndr: RACK_STATS.filter((r) => r.kind === "ndr").map((r) => r.alias),
  rdr: RACK_STATS.filter((r) => r.kind === "rdr").map((r) => r.alias),
  rack: RACK_STATS.filter((r) => r.kind === "rack").map((r) => r.alias),
};

// What is in every rack, U by U, exactly as the 5D View Rack View fills it
// (idealDemoRackFill.js). [start U (1 = bottom), size U, kind, name]
// kind: a / b / c = server Model A / B / C, s = 48-port switch, p = patch
// panel, l = fibre LIU, m = cable manager, r = reserved block (name = note).
export const RACK_CONTENTS = {
  "NDR-1": [
    [42,1,"l","LIU-1"], [41,1,"l","LIU-2"], [40,1,"m",""], [39,1,"s","AGG-1A"], [38,1,"m",""],
    [37,1,"s","AGG-1B"], [36,1,"m",""], [35,1,"p","PP-1"], [34,1,"p","PP-2"], [33,1,"m",""],
    [30,2,"a","DNS-1-01"], [28,2,"b","NMS-1-01"], [18,6,"r","spine expansion"]],
  "NDR-2": [
    [42,1,"l","LIU-1"], [41,1,"l","LIU-2"], [40,1,"m",""], [39,1,"s","AGG-2A"], [38,1,"m",""],
    [37,1,"s","AGG-2B"], [36,1,"m",""], [35,1,"p","PP-1"], [34,1,"p","PP-2"], [33,1,"m",""],
    [30,2,"a","DNS-2-01"], [28,2,"b","NMS-2-01"], [19,7,"r","spine expansion"]],
  "NDR-3": [
    [42,1,"l","LIU-1"], [41,1,"l","LIU-2"], [40,1,"m",""], [39,1,"s","AGG-3A"], [38,1,"m",""],
    [37,1,"s","AGG-3B"], [36,1,"m",""], [35,1,"p","PP-1"], [34,1,"p","PP-2"], [33,1,"m",""],
    [30,2,"a","DNS-3-01"], [28,2,"b","NMS-3-01"], [19,7,"r","spine expansion"]],
  "NDR-4": [
    [42,1,"l","LIU-1"], [41,1,"l","LIU-2"], [40,1,"m",""], [39,1,"s","AGG-4A"], [38,1,"m",""],
    [37,1,"s","AGG-4B"], [36,1,"m",""], [35,1,"p","PP-1"], [34,1,"p","PP-2"], [33,1,"m",""],
    [30,2,"a","DNS-4-01"], [28,2,"b","NMS-4-01"], [19,6,"r","spine expansion"]],
  "NDR-5": [
    [42,1,"l","LIU-1"], [41,1,"l","LIU-2"], [40,1,"m",""], [39,1,"s","AGG-5A"], [38,1,"m",""],
    [37,1,"s","AGG-5B"], [36,1,"m",""], [35,1,"p","PP-1"], [34,1,"p","PP-2"], [33,1,"m",""],
    [30,2,"a","DNS-5-01"], [28,2,"b","NMS-5-01"], [20,5,"r","spine expansion"]],
  "NDR-6": [
    [42,1,"l","LIU-1"], [41,1,"l","LIU-2"], [40,1,"m",""], [39,1,"s","AGG-6A"], [38,1,"m",""],
    [37,1,"s","AGG-6B"], [36,1,"m",""], [35,1,"p","PP-1"], [34,1,"p","PP-2"], [33,1,"m",""],
    [30,2,"a","DNS-6-01"], [28,2,"b","NMS-6-01"], [18,6,"r","spine expansion"]],
  "RDR-B": [
    [42,1,"l","LIU"], [41,1,"m",""], [40,1,"s","SW-BA"], [39,1,"m",""], [38,1,"s","SW-BB"],
    [37,1,"m",""], [36,1,"p","PP-1"], [35,1,"p","PP-2"], [34,1,"p","PP-3"], [33,1,"p","PP-4"],
    [32,1,"m",""], [29,2,"b","MGMT-B-01"], [23,5,"r","row switch expansion"], [14,4,"r","Storage refresh"]],
  "RK-B1": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-B1-01"],
    [33,4,"c","GPU-B1-01"], [29,2,"a","APP-B1-02"], [25,2,"b","WEB-B1-01"], [23,2,"b","WEB-B1-02"], [21,2,"b","WEB-B1-03"],
    [19,2,"b","WEB-B1-04"], [16,3,"r","Storage refresh"], [14,2,"a","APP-B1-03"], [12,2,"b","WEB-B1-05"]],
  "RK-B2": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-B2-01"],
    [34,2,"b","WEB-B2-02"], [30,4,"r","Hot spares"], [26,2,"a","APP-B2-01"], [21,2,"a","APP-B2-02"], [16,2,"a","APP-B2-03"],
    [14,2,"b","WEB-B2-03"], [12,2,"b","WEB-B2-04"], [9,2,"b","WEB-B2-05"]],
  "RK-B3": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-B3-01"],
    [32,5,"r","Hot spares"], [28,4,"c","GPU-B3-01"], [24,4,"c","GPU-B3-02"], [22,2,"b","WEB-B3-02"], [20,2,"b","WEB-B3-03"],
    [18,2,"a","APP-B3-01"], [16,2,"b","WEB-B3-04"]],
  "RK-B4": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"r","DB cluster"],
    [33,2,"a","APP-B4-01"], [31,2,"a","APP-B4-02"], [28,2,"b","WEB-B4-01"], [26,2,"b","WEB-B4-02"], [22,4,"c","GPU-B4-01"],
    [20,2,"a","APP-B4-03"], [16,4,"c","GPU-B4-02"], [12,4,"c","GPU-B4-03"], [10,2,"b","WEB-B4-03"]],
  "RK-B5": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-B5-01"],
    [35,2,"a","APP-B5-01"], [33,2,"a","APP-B5-02"], [31,2,"b","WEB-B5-02"], [27,4,"c","GPU-B5-01"], [24,3,"r","Storage refresh"],
    [20,4,"r","Q4 expansion"], [16,2,"a","APP-B5-03"], [13,2,"b","WEB-B5-03"], [11,2,"a","APP-B5-04"]],
  "RK-B6": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-B6-01"],
    [35,2,"b","WEB-B6-01"], [29,4,"c","GPU-B6-01"], [24,4,"c","GPU-B6-02"], [22,2,"b","WEB-B6-02"], [18,4,"r","Q4 expansion"],
    [14,2,"a","APP-B6-02"], [11,2,"b","WEB-B6-03"]],
  "RK-B7": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-B7-01"],
    [35,2,"r","Q4 expansion"], [33,2,"a","APP-B7-01"], [30,2,"b","WEB-B7-02"], [28,2,"b","WEB-B7-03"], [23,5,"r","Hot spares"],
    [21,2,"a","APP-B7-02"], [19,2,"b","WEB-B7-04"], [17,2,"b","WEB-B7-05"], [13,4,"c","GPU-B7-01"], [11,2,"a","APP-B7-03"],
    [8,2,"a","APP-B7-04"]],
  "RDR-C": [
    [42,1,"l","LIU"], [41,1,"m",""], [40,1,"s","SW-CA"], [39,1,"m",""], [38,1,"s","SW-CB"],
    [37,1,"m",""], [36,1,"p","PP-1"], [35,1,"p","PP-2"], [34,1,"p","PP-3"], [33,1,"p","PP-4"],
    [32,1,"m",""], [29,2,"b","MGMT-C-01"], [23,4,"r","row switch expansion"], [16,3,"r","Hot spares"]],
  "RK-C1": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-C1-01"],
    [35,2,"b","WEB-C1-01"], [33,2,"a","APP-C1-02"], [28,4,"c","GPU-C1-01"], [26,2,"a","APP-C1-03"], [24,2,"b","WEB-C1-02"],
    [22,2,"r","AI / GPU pilot"], [20,2,"r","AI / GPU pilot"], [17,2,"a","APP-C1-04"]],
  "RK-C2": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-C2-01"],
    [34,2,"a","APP-C2-01"], [29,2,"b","WEB-C2-02"], [27,2,"a","APP-C2-02"], [25,2,"r","Hot spares"], [23,2,"a","APP-C2-03"],
    [21,2,"a","APP-C2-04"], [17,4,"c","GPU-C2-01"], [13,4,"c","GPU-C2-02"], [11,2,"r","Storage refresh"]],
  "RK-C3": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-C3-01"],
    [35,2,"b","WEB-C3-01"], [32,3,"r","DB cluster"], [28,4,"c","GPU-C3-01"], [26,2,"b","WEB-C3-02"], [24,2,"a","APP-C3-02"],
    [21,2,"b","WEB-C3-03"], [17,4,"r","DB cluster"], [14,2,"b","WEB-C3-04"]],
  "RK-C4": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-C4-01"],
    [33,4,"c","GPU-C4-01"], [31,2,"a","APP-C4-01"], [29,2,"a","APP-C4-02"], [25,2,"r","Q4 expansion"], [23,2,"a","APP-C4-03"],
    [21,2,"b","WEB-C4-02"], [16,5,"r","AI / GPU pilot"], [9,4,"c","GPU-C4-02"]],
  "RK-C5": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-C5-01"],
    [33,4,"c","GPU-C5-01"], [31,2,"b","WEB-C5-01"], [29,2,"b","WEB-C5-02"], [27,2,"r","Hot spares"], [23,2,"b","WEB-C5-03"],
    [21,2,"a","APP-C5-02"], [19,2,"b","WEB-C5-04"], [16,2,"b","WEB-C5-05"], [14,2,"b","WEB-C5-06"], [9,2,"a","APP-C5-03"],
    [7,2,"a","APP-C5-04"]],
  "RK-C6": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"c","GPU-C6-01"],
    [33,2,"b","WEB-C6-01"], [31,2,"b","WEB-C6-02"], [29,2,"b","WEB-C6-03"], [27,2,"b","WEB-C6-04"], [25,2,"r","Storage refresh"],
    [21,4,"c","GPU-C6-02"], [19,2,"b","WEB-C6-05"], [14,5,"r","Hot spares"], [10,2,"b","WEB-C6-06"]],
  "RK-C7": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [34,5,"r","AI / GPU pilot"],
    [32,2,"b","WEB-C7-01"], [30,2,"b","WEB-C7-02"], [26,4,"r","AI / GPU pilot"], [24,2,"b","WEB-C7-03"], [22,2,"b","WEB-C7-04"],
    [18,2,"a","APP-C7-01"], [16,2,"a","APP-C7-02"], [14,2,"b","WEB-C7-05"], [12,2,"a","APP-C7-03"], [10,2,"a","APP-C7-04"]],
  "RDR-D": [
    [42,1,"l","LIU"], [41,1,"m",""], [40,1,"s","SW-DA"], [39,1,"m",""], [38,1,"s","SW-DB"],
    [37,1,"m",""], [36,1,"p","PP-1"], [35,1,"p","PP-2"], [34,1,"p","PP-3"], [33,1,"p","PP-4"],
    [32,1,"m",""], [29,2,"b","MGMT-D-01"], [22,6,"r","row switch expansion"], [12,4,"r","AI / GPU pilot"]],
  "RK-D1": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-D1-01"],
    [30,5,"r","Storage refresh"], [28,2,"b","WEB-D1-02"], [26,2,"a","APP-D1-01"], [24,2,"a","APP-D1-02"], [22,2,"b","WEB-D1-03"],
    [20,2,"a","APP-D1-03"], [16,4,"c","GPU-D1-01"], [11,2,"a","APP-D1-04"]],
  "RK-D2": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"r","Client onboarding"],
    [33,2,"b","WEB-D2-01"], [29,4,"c","GPU-D2-01"], [27,2,"b","WEB-D2-02"], [25,2,"b","WEB-D2-03"], [23,2,"a","APP-D2-01"],
    [21,2,"a","APP-D2-02"], [19,2,"a","APP-D2-03"], [17,2,"a","APP-D2-04"]],
  "RK-D3": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-D3-01"],
    [35,2,"b","WEB-D3-02"], [33,2,"b","WEB-D3-03"], [29,4,"c","GPU-D3-01"], [27,2,"a","APP-D3-01"], [25,2,"a","APP-D3-02"],
    [21,2,"a","APP-D3-03"], [16,5,"r","AI / GPU pilot"], [11,2,"b","WEB-D3-04"], [9,2,"a","APP-D3-04"], [7,2,"r","Client onboarding"]],
  "RK-D4": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-D4-01"],
    [35,2,"a","APP-D4-02"], [30,2,"a","APP-D4-03"], [28,2,"b","WEB-D4-01"], [24,2,"a","APP-D4-04"], [22,2,"b","WEB-D4-02"],
    [18,4,"c","GPU-D4-01"], [16,2,"b","WEB-D4-03"], [11,5,"r","AI / GPU pilot"], [8,3,"r","DB cluster"], [6,2,"b","WEB-D4-04"]],
  "RK-D5": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"c","GPU-D5-01"],
    [29,4,"c","GPU-D5-02"], [25,4,"c","GPU-D5-03"], [23,2,"a","APP-D5-01"], [15,5,"r","Hot spares"], [13,2,"b","WEB-D5-01"]],
  "RK-D6": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-D6-01"],
    [35,2,"a","APP-D6-01"], [31,4,"c","GPU-D6-01"], [29,2,"b","WEB-D6-02"], [25,4,"r","Storage refresh"], [21,4,"c","GPU-D6-02"],
    [18,3,"r","Hot spares"], [16,2,"b","WEB-D6-03"], [14,2,"a","APP-D6-02"], [12,2,"b","WEB-D6-04"]],
  "RK-D7": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-D7-01"],
    [35,2,"b","WEB-D7-02"], [33,2,"a","APP-D7-01"], [28,5,"r","Hot spares"], [26,2,"a","APP-D7-02"], [24,2,"a","APP-D7-03"],
    [21,2,"a","APP-D7-04"], [15,4,"r","Client onboarding"], [13,2,"b","WEB-D7-03"], [11,2,"b","WEB-D7-04"], [9,2,"b","WEB-D7-05"]],
  "RDR-E": [
    [42,1,"l","LIU"], [41,1,"m",""], [40,1,"s","SW-EA"], [39,1,"m",""], [38,1,"s","SW-EB"],
    [37,1,"m",""], [36,1,"p","PP-1"], [35,1,"p","PP-2"], [34,1,"p","PP-3"], [33,1,"p","PP-4"],
    [32,1,"m",""], [28,2,"b","MGMT-E-01"], [23,4,"r","row switch expansion"], [12,2,"r","Q4 expansion"]],
  "RK-E1": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"c","GPU-E1-01"],
    [30,5,"r","Hot spares"], [25,2,"b","WEB-E1-01"], [23,2,"a","APP-E1-01"], [16,4,"c","GPU-E1-02"], [13,2,"b","WEB-E1-02"],
    [10,2,"a","APP-E1-02"], [8,2,"b","WEB-E1-03"], [4,4,"c","GPU-E1-03"]],
  "RK-E2": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"c","GPU-E2-01"],
    [33,2,"b","WEB-E2-01"], [31,2,"b","WEB-E2-02"], [26,5,"r","Hot spares"], [24,2,"b","WEB-E2-03"], [22,2,"r","DB cluster"],
    [18,4,"c","GPU-E2-02"], [14,4,"c","GPU-E2-03"]],
  "RK-E3": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-E3-01"],
    [35,2,"b","WEB-E3-02"], [33,2,"b","WEB-E3-03"], [31,2,"b","WEB-E3-04"], [29,2,"a","APP-E3-01"], [27,2,"a","APP-E3-02"],
    [25,2,"a","APP-E3-03"], [23,2,"b","WEB-E3-05"], [19,4,"r","Storage refresh"], [17,2,"b","WEB-E3-06"], [15,2,"b","WEB-E3-07"]],
  "RK-E4": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [34,5,"r","Storage refresh"],
    [32,2,"a","APP-E4-01"], [30,2,"b","WEB-E4-01"], [28,2,"b","WEB-E4-02"], [26,2,"b","WEB-E4-03"], [24,2,"b","WEB-E4-04"],
    [22,2,"b","WEB-E4-05"], [20,2,"b","WEB-E4-06"], [18,2,"b","WEB-E4-07"], [16,2,"b","WEB-E4-08"], [14,2,"a","APP-E4-02"],
    [12,2,"a","APP-E4-03"], [10,2,"a","APP-E4-04"]],
  "RK-E5": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"c","GPU-E5-01"],
    [31,4,"c","GPU-E5-02"], [29,2,"a","APP-E5-01"], [26,2,"a","APP-E5-02"], [24,2,"a","APP-E5-03"], [20,4,"r","DB cluster"],
    [18,2,"a","APP-E5-04"], [14,4,"r","Q4 expansion"]],
  "RK-E6": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-E6-01"],
    [35,2,"b","WEB-E6-01"], [33,2,"b","WEB-E6-02"], [31,2,"b","WEB-E6-03"], [29,2,"a","APP-E6-02"], [27,2,"b","WEB-E6-04"],
    [25,2,"b","WEB-E6-05"], [21,2,"a","APP-E6-03"], [19,2,"a","APP-E6-04"], [17,2,"r","DB cluster"], [15,2,"b","WEB-E6-06"],
    [12,3,"r","Hot spares"], [10,2,"a","APP-E6-05"]],
  "RK-E7": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"r","AI / GPU pilot"],
    [33,2,"a","APP-E7-01"], [31,2,"b","WEB-E7-01"], [29,2,"a","APP-E7-02"], [27,2,"b","WEB-E7-02"], [25,2,"b","WEB-E7-03"],
    [23,2,"b","WEB-E7-04"], [21,2,"b","WEB-E7-05"], [17,2,"b","WEB-E7-06"], [14,3,"r","Q4 expansion"], [12,2,"a","APP-E7-03"]],
  "RDR-F": [
    [42,1,"l","LIU"], [41,1,"m",""], [40,1,"s","SW-FA"], [39,1,"m",""], [38,1,"s","SW-FB"],
    [37,1,"m",""], [36,1,"p","PP-1"], [35,1,"p","PP-2"], [34,1,"p","PP-3"], [33,1,"p","PP-4"],
    [32,1,"m",""], [28,2,"b","MGMT-F-01"], [22,5,"r","row switch expansion"], [13,2,"r","AI / GPU pilot"]],
  "RK-F1": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-F1-01"],
    [34,2,"b","WEB-F1-02"], [29,2,"b","WEB-F1-03"], [27,2,"b","WEB-F1-04"], [25,2,"a","APP-F1-01"], [20,2,"r","Storage refresh"],
    [18,2,"b","WEB-F1-05"], [15,3,"r","DB cluster"], [12,2,"a","APP-F1-02"], [8,4,"c","GPU-F1-01"], [6,2,"a","APP-F1-03"]],
  "RK-F2": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-F2-01"],
    [35,2,"a","APP-F2-02"], [30,5,"r","Client onboarding"], [28,2,"a","APP-F2-03"], [24,2,"b","WEB-F2-01"], [20,4,"c","GPU-F2-01"],
    [15,5,"r","AI / GPU pilot"], [11,2,"a","APP-F2-04"], [9,2,"b","WEB-F2-02"], [4,2,"b","WEB-F2-03"]],
  "RK-F3": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"b","WEB-F3-01"],
    [35,2,"b","WEB-F3-02"], [30,2,"b","WEB-F3-03"], [28,2,"b","WEB-F3-04"], [24,4,"c","GPU-F3-01"], [19,2,"b","WEB-F3-05"],
    [16,2,"a","APP-F3-01"], [14,2,"b","WEB-F3-06"], [11,3,"r","Hot spares"], [9,2,"b","WEB-F3-07"], [5,2,"b","WEB-F3-08"]],
  "RK-F4": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-F4-01"],
    [33,4,"c","GPU-F4-01"], [30,3,"r","Storage refresh"], [27,2,"a","APP-F4-02"], [22,2,"a","APP-F4-03"], [17,2,"a","APP-F4-04"],
    [14,2,"b","WEB-F4-01"], [12,2,"b","WEB-F4-02"], [7,4,"c","GPU-F4-02"], [5,2,"a","APP-F4-05"]],
  "RK-F5": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [37,2,"a","APP-F5-01"],
    [33,4,"c","GPU-F5-01"], [29,4,"c","GPU-F5-02"], [27,2,"a","APP-F5-02"], [25,2,"b","WEB-F5-01"], [23,2,"a","APP-F5-03"],
    [21,2,"a","APP-F5-04"], [19,2,"a","APP-F5-05"], [17,2,"a","APP-F5-06"], [12,5,"r","DB cluster"], [7,4,"r","Storage refresh"],
    [5,2,"a","APP-F5-07"]],
  "RK-F6": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"r","AI / GPU pilot"],
    [33,2,"a","APP-F6-01"], [31,2,"b","WEB-F6-01"], [26,2,"a","APP-F6-02"], [24,2,"a","APP-F6-03"], [20,4,"c","GPU-F6-01"],
    [16,4,"c","GPU-F6-02"], [11,5,"r","AI / GPU pilot"], [7,2,"b","WEB-F6-02"]],
  "RK-F7": [
    [42,1,"p","PP-A"], [41,1,"p","PP-B"], [40,1,"l","LIU"], [39,1,"m",""], [35,4,"c","GPU-F7-01"],
    [33,2,"b","WEB-F7-01"], [31,2,"a","APP-F7-01"], [29,2,"b","WEB-F7-02"], [27,2,"a","APP-F7-02"], [25,2,"b","WEB-F7-03"],
    [23,2,"b","WEB-F7-04"], [18,2,"a","APP-F7-03"], [13,5,"r","Client onboarding"], [11,2,"b","WEB-F7-05"]],
};
const KIND_KEY = { a: "serverA", b: "serverB", c: "serverC", s: "rackSwitch", p: "patchPanel", l: "fibreLiu", m: "cableManager" };
const SERVER_ROLE = {
  APP: "Application server", WEB: "Web server", GPU: "GPU compute", DNS: "DNS / DHCP",
  NMS: "Network monitoring", MGMT: "Row monitoring",
};

// ═══════════════════════════════════════════════════════════════════════════
// 3 · THE REGISTER
// ═══════════════════════════════════════════════════════════════════════════
const ALARM_OF = Object.fromEntries(ACTIVE_ALARMS.map((a) => [a.device, a]));
const statusOf = (tag, key) => {
  const alarm = ALARM_OF[tag];
  if (alarm) return alarm.severity === "critical" ? "Critical" : "Warning";
  if (key === "dgset") return "Standby";            // generators idle until the mains fail
  return "Online";
};
const rowOfRack = Object.fromEntries(RACK_STATS.map((r) => [r.alias, r.row]));
const floorLocation = (key, tag, where) => {
  if (key === "rack" || key === "ndr" || key === "rdr") return `Server Room · Row ${rowOfRack[tag]}`;
  if (key === "rowpdu") {
    const m = tag.match(/RPDU-(\d)([AB])/);
    return `Server Room · Row ${ROWS[Number(m[1]) - 1]} (${m[2]}-side)`;
  }
  if (key === "pac") {
    const p = PAC_UNITS.find((x) => x.tag === tag);
    return `Server Room · Cold aisle ${p.aisle} (Row ${p.row})`;
  }
  if (key === "tor") return "Server Room · Row A";
  return ROOM_LABEL[where];
};
const serial = (cat, tag) => {
  const prefix = cat.manufacturer.replace(/[^A-Z]/g, "").slice(0, 2) || "SN";
  const h = Math.floor(rand(`sn|${tag}`) * 36 ** 6).toString(36).toUpperCase().padStart(6, "0");
  return `${prefix}${h}${String(Math.floor(rand(`sn2|${tag}`) * 900) + 100)}`;
};

function buildRegister() {
  const assets = [];
  const add = (key, tag, extra) => {
    const cat = CATALOGUE[key];
    const installedOn = extra.installedOn;
    assets.push({
      id: assets.length + 1,
      tag,
      key,
      type: cat.type,
      category: cat.category,
      manufacturer: cat.manufacturer,
      model: cat.model,
      rating: cat.rating,
      kw: cat.kw ?? null,
      status: statusOf(tag, key),
      alarm: ALARM_OF[tag] || null,
      serialNumber: serial(cat, tag),
      assetTag: `AST-${String(assets.length + 1).padStart(4, "0")}`,
      priceInr: cat.priceInr,
      installedOn,
      warrantyUntil: addYears(installedOn, cat.warrantyYears),
      eolOn: addYears(installedOn, cat.lifeYears),
      ...extra,
    });
  };

  // Floor devices (97)
  FLOOR.forEach((f) => {
    const tags = FLOOR_TAGS[f.key] || [];
    if (tags.length !== f.count) console.warn(`[dcimAssetRegister] ${f.key}: ${tags.length} tags for ${f.count} devices`);
    tags.forEach((tag) => add(f.key, tag, {
      name: tag,
      onFloor: true,
      room: ROOM_LABEL[f.where],
      location: floorLocation(f.key, tag, f.where),
      rack: null, u: null, sizeU: null,
      installedOn: dateIn(`inst|${tag}`, "2025-06-02", "2025-08-30"),
    }));
  });

  // Rack contents (567)
  RACK_STATS.forEach((r) => {
    (RACK_CONTENTS[r.alias] || []).forEach(([u, sizeU, kind, name]) => {
      if (kind === "r") return;
      const key = KIND_KEY[kind];
      const tag = kind === "m" ? `${r.alias}-CM${u}` : (kind === "p" || kind === "l") ? `${r.alias}-${name}` : name;
      const prefix = name.split("-")[0];
      add(key, tag, {
        name: tag,
        role: kind === "a" || kind === "b" || kind === "c" ? SERVER_ROLE[prefix] || "Server"
          : kind === "s" ? (prefix === "AGG" ? "Aggregation switch" : "Access switch") : CATALOGUE[key].type,
        onFloor: false,
        room: "Server Room",
        location: `Server Room · ${r.alias} · U${u}${sizeU > 1 ? `–U${u + sizeU - 1}` : ""}`,
        rack: r.alias, row: r.row, u, sizeU,
        installedOn: kind === "a" || kind === "b" || kind === "c"
          ? dateIn(`inst|${tag}`, "2025-09-01", "2026-09-01")
          : dateIn(`inst|${tag}`, "2025-08-01", "2025-09-01"),
      });
    });
  });
  return assets;
}

export const ASSETS = buildRegister();

// ── Server telemetry: one reading per server, averaging exactly to the
//    fleet figures the DCIM tab shows (CPU / memory / disk / GPU) ──
const SERVERS_ONLY = ASSETS.filter((a) => a.type === "Rack Server");
const keysOf = (list, what) => list.map((a) => `${what}|${a.tag}`);
const cpu = spreadAround(keysOf(SERVERS_ONLY, "cpu"), CPU_LOAD_AVG_PCT, 22);
const mem = spreadAround(keysOf(SERVERS_ONLY, "mem"), MEMORY_UTIL_PCT, 12);
const disk = spreadAround(keysOf(SERVERS_ONLY, "disk"), DISK_UTIL_PCT, 16);
const GPU_SERVERS = SERVERS_ONLY.filter((a) => a.key === "serverC");
const gpu = spreadAround(keysOf(GPU_SERVERS, "gpu"), GPU_UTIL_PCT, 30);
const OS_OF = { APP: "RHEL 9.4", WEB: "Ubuntu 22.04", GPU: "Ubuntu 22.04 + CUDA 12", DNS: "RHEL 9.4", NMS: "Ubuntu 22.04", MGMT: "Windows Server 2022" };
export const SERVER_FLEET = SERVERS_ONLY.map((a, i) => {
  const prefix = a.tag.split("-")[0];
  const hot = a.status !== "Online";                       // GPU-E1-01: CPU over-temperature
  const rowIdx = ROWS.indexOf(a.row);
  const gi = GPU_SERVERS.indexOf(a);
  const up = Math.max(1, Math.floor((Date.now() - new Date(a.installedOn).getTime()) / 864e5) - Math.floor(rand(`up|${a.tag}`) * 40));
  return {
    ...a,
    cpu: cpu[i], ram: mem[i], disk: disk[i], gpu: gi >= 0 ? gpu[gi] : null,
    temp: hot ? 47 : round(33 + (a.key === "serverC" ? 3 : 0) + jitter(`t|${a.tag}`, 3.5)),
    powerW: Math.round((a.kw || 0) * 1000),
    ip: `10.20.${rowIdx + 1}.${(i % 250) + 2}`,
    os: OS_OF[prefix] || "Ubuntu 22.04",
    uptime: `${up}d ${Math.floor(rand(`uh|${a.tag}`) * 24)}h`,
  };
});
export const FLEET_AVG = {
  cpu: round(sum(SERVER_FLEET, (s) => s.cpu) / SERVER_FLEET.length, 1),
  ram: round(sum(SERVER_FLEET, (s) => s.ram) / SERVER_FLEET.length, 1),
  disk: round(sum(SERVER_FLEET, (s) => s.disk) / SERVER_FLEET.length, 1),
  gpu: round(sum(GPU_SERVERS.map((a) => gpu[GPU_SERVERS.indexOf(a)])) / Math.max(1, GPU_SERVERS.length), 1),
};

// ═══════════════════════════════════════════════════════════════════════════
// 4 · SUMMARIES every page shares
// ═══════════════════════════════════════════════════════════════════════════
export const ASSET_SUMMARY = {
  total: ASSETS.length,                                                    // 664
  onFloor: ASSETS.filter((a) => a.onFloor).length,                         // 97
  inRack: ASSETS.filter((a) => !a.onFloor).length,                         // 567
  byStatus: { Online: 0, Warning: 0, Critical: 0, Standby: 0, ...countBy(ASSETS, (a) => a.status) },
  byCategory: { ...Object.fromEntries(CATEGORY_NAMES.map((c) => [c, 0])), ...countBy(ASSETS, (a) => a.category) },
  byType: countBy(ASSETS, (a) => a.type),
  byManufacturer: { ...Object.fromEntries(MANUFACTURERS.map((m) => [m.name, 0])), ...countBy(ASSETS, (a) => a.manufacturer) },
  byRoom: countBy(ASSETS, (a) => a.room),
  totalValueInr: sum(ASSETS, (a) => a.priceInr),
};

// Earliest installation date in a list of assets (master records — a type, a
// model — are created shortly before the first unit goes in).
const firstInstall = (list) => list.reduce((m, a) => (a.installedOn < m ? a.installedOn : m), "9999-12-31");
const daysBefore = (iso, n) => {
  const d = new Date(iso);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

// One row per model on the floor (Model Specifications page).
export const MODELS = Object.entries(CATALOGUE).map(([key, c]) => {
  const list = ASSETS.filter((a) => a.key === key);
  return {
    key, ...c, count: list.length,
    rooms: [...new Set(list.map((a) => a.room))],
    createdDate: list.length ? daysBefore(firstInstall(list), 21) : null,
  };
});

// One row per type (Type page), in first-seen order.
export const TYPES = [...new Map(Object.values(CATALOGUE).map((c) => [c.type, c])).values()].map((c) => {
  const models = MODELS.filter((m) => m.type === c.type);
  return {
    type: c.type, category: c.category, icon: c.icon, iconColor: c.iconColor,
    count: ASSET_SUMMARY.byType[c.type] || 0,
    models: models.map((m) => m.model),
    description: [...new Set(models.map((m) => m.description))].join(" · "),
    createdDate: models.map((m) => m.createdDate).filter(Boolean).sort()[0] || null,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · ASSET DASHBOARD DETAIL (per-device rows, all derived from the above)
// ═══════════════════════════════════════════════════════════════════════════
const V_LL = 415, PF_LOAD = 0.95;                                     // 415 V, 3-phase
const ampsFor = (kw) => round((kw * 1000) / (Math.sqrt(3) * V_LL * PF_LOAD), 1);
const history = (key, end, spread = 0.06, n = 7) =>
  Array.from({ length: n }, (_, i) => round(end * (1 + (i === n - 1 ? 0 : jitter(`${key}|${i}`, spread))), 1));
const byTag = Object.fromEntries(ASSETS.map((a) => [a.tag, a]));

// PDUs: room PDUs (A / B side) and the twelve row PDUs. Every rack is corded
// to both of its row's PDUs, so each side carries half the row.
const sideKw = DCIM.rackItKw / 2 + DCIM.torKw / 2 + DCIM.networkRoomItKw / 2;
export const PDU_LIST = [
  ...["PDU1", "PDU2"].map((tag) => ({ tag, kw: sideKw, maxAmp: 400, outlets: 42, active: ROWS.length + 1 + 4, kind: "Room PDU (switched)" })),
  ...ROWS.flatMap((row, i) => ["A", "B"].map((side) => {
    const racks = RACK_STATS.filter((r) => r.row === row).length;
    return { tag: `RPDU-${i + 1}${side}`, kw: (DCIM.rowKw[row] || 0) / 2, maxAmp: 125, outlets: 24, active: racks, kind: "Row PDU (metered)" };
  })),
].map((p) => ({
  id: p.tag, name: byTag[p.tag].model, rack: byTag[p.tag].location, type: p.kind,
  ampere: ampsFor(p.kw), maxAmp: p.maxAmp, outlets: p.outlets, active: p.active, voltage: V_LL,
  status: byTag[p.tag].status, phase: "3-Phase", powerKW: round(p.kw, 1), history: history(p.tag, round(p.kw, 1)),
}));

// Network: every active network device — floor kit plus the 22 rack switches.
const NET_SPEC = {
  WAN: { type: "Internet / WAN", ports: 2, speed: "10GbE" },
  ISP: { type: "ISP Uplink", ports: 4, speed: "10GbE" },
  CORE: { type: "Core Router", ports: 36, speed: "100GbE" },
  FW: { type: "Firewall", ports: 16, speed: "10GbE" },
  DIST: { type: "Distribution Switch", ports: 32, speed: "40GbE" },
  ToR: { type: "Access Switch (ToR)", ports: 54, speed: "10GbE" },
  AGG: { type: "Aggregation Switch", ports: 52, speed: "1/10GbE" },
  SW: { type: "Access Switch", ports: 52, speed: "1/10GbE" },
};
export const NETWORK_LIST = ASSETS
  .filter((a) => ["wan", "isp", "core", "firewall", "dist", "tor", "rackSwitch"].includes(a.key))
  .map((a) => {
    const spec = NET_SPEC[a.tag.split("-")[0]];
    const tp = Math.round(35 + rand(`tp|${a.tag}`) * 50);
    const gbps = spec.speed.startsWith("100") ? 100 : spec.speed.startsWith("40") ? 40 : 10;
    return {
      id: a.tag, name: a.model, type: spec.type, rack: a.rack || a.location, ports: spec.ports,
      active: Math.max(2, Math.round(spec.ports * (0.55 + rand(`pt|${a.tag}`) * 0.4))),
      speed: spec.speed, throughput: tp, status: a.status,
      vlan: a.key === "rackSwitch" ? `${100 + ROWS.indexOf(a.row) * 10},${200 + ROWS.indexOf(a.row) * 10}` : "10,20,30",
      rxGbps: round(gbps * tp / 100 * 0.45, 1), txGbps: round(gbps * tp / 100 * 0.4, 1),
      errors: a.status === "Online" ? 0 : 3, history: history(`nh|${a.tag}`, tp, 0.08),
    };
  });

// UPS: two modules per IT side share that side's load (2N).
const BATTERY_SOC = { BAT1: 98, BAT2: 42, BAT3: 97, BAT4: 99 };
export const UPS_LIST = ["UPS1", "UPS2", "UPS3", "UPS4"].map((tag, i) => {
  const loadKw = sideKw / 2;
  const bat = `BAT${i + 1}`;
  const soc = BATTERY_SOC[bat];
  return {
    id: tag, name: byTag[tag].model, rack: "Power Room", battery: soc, batteryTag: bat,
    capacity: 300, load: round(loadKw / ASSUMPTIONS.upsPowerFactor, 1), loadKw: round(loadKw, 1),
    runtime: Math.round(((40 * soc) / 100 / loadKw) * 60),
    status: byTag[tag].status, mode: "Double Conversion", inputV: V_LL, outputV: V_LL, freq: 50,
    temp: round(24 + jitter(`ut|${tag}`, 1.5), 1), side: i < 2 ? "A" : "B",
    history: history(`uh|${tag}`, round(loadKw / ASSUMPTIONS.upsPowerFactor, 1), 0.04),
  };
});

// Cooling: the six PAC units carry the Server Room heat; CH-01 feeds them.
// Return air rises with load (18 °C supply + 9.8 K at full load), so the unit
// at 96 % (PAC-3E) returns 27.4 °C — the alarm on the dashboard.
const AIR_KJ_PER_M3K = 1.2 * 1.005;
export const COOLING_LIST = [
  ...DCIM.pacLoads.map((p) => {
    const ret = round(18 + 9.8 * (p.pct / 100), 1);
    const dT = Math.max(0.5, ret - 18);
    return {
      id: p.tag, name: byTag[p.tag].model, type: "PAC", rack: byTag[p.tag].location, status: byTag[p.tag].status,
      setTemp: 18, actTemp: ret, humidity: Math.round(46 + jitter(`h|${p.tag}`, 2.5)),
      loadKw: round(p.kw, 1), capacityKw: ASSUMPTIONS.pacCoolingKw, loadPct: round(p.pct, 1),
      power: round(p.kw / DCIM.chillerCop, 1), airflow: Math.round((p.kw / (AIR_KJ_PER_M3K * dT)) * 3600),
      serves: `Row ${p.row}`, tempHistory: history(`ct|${p.tag}`, ret, 0.015),
    };
  }),
  {
    id: "CH-01", name: byTag["CH-01"].model, type: "Chiller", rack: "Roof Plant Deck", status: byTag["CH-01"].status,
    setTemp: 7, actTemp: 12, humidity: null,
    loadKw: round(DCIM.serverRoomItKw, 1), capacityKw: ASSUMPTIONS.chillerCoolingKw, loadPct: round(DCIM.chillerLoadPct, 1),
    power: round(DCIM.coolingInputKw, 1), airflow: null, serves: "All 6 PAC units", tempHistory: history("ct|CH-01", 12, 0.02),
  },
];

// Generators: both on standby; GEN2's tank is below the refill mark.
export const GENERATOR_LIST = [
  { id: "GEN1", fuel: 85, lastTestDaysAgo: 6, runtime: "0.5h", coolantTemp: 30, oilPressure: 42 },
  { id: "GEN2", fuel: 62, lastTestDaysAgo: 20, runtime: "0h", coolantTemp: 28, oilPressure: 38 },
].map((g) => {
  const d = new Date();
  d.setDate(d.getDate() - g.lastTestDaysAgo);
  return {
    ...g, name: byTag[g.id].model, kva: 750, status: byTag[g.id].status, mode: "Auto",
    voltage: V_LL, freq: 50, lastTest: d.toISOString().split("T")[0],
  };
});

// Racks: every cabinet with its real U fill (STORAGE view), its estimated
// draw against its budget, and the air through it.
const ITEM_KG = { a: 28, b: 26, c: 52, s: 6, p: 1.5, l: 3, m: 1 };
const rackDrawKw = (alias) => sum((RACK_CONTENTS[alias] || []).filter((x) => x[2] !== "r"),
  ([, , k]) => CATALOGUE[KIND_KEY[k]].kw || 0);
export const RACK_LIST = RACK_STATS.map((r) => {
  const kw = rackDrawKw(r.alias);
  const maxKw = parseFloat(byTag[r.alias].rating);
  const aisle = DCIM.aisles.find((a) => a.rows.includes(r.row));
  const inlet = round(20.2 + ((aisle?.pct || 60) / 100) * 1.6 + jitter(`in|${r.alias}`, 0.3), 1);
  const dT = Math.max(1, 14 * (kw / maxKw) * (0.9 + rand(`dt|${r.alias}`) * 0.2));
  return {
    id: r.alias, room: `Server Room · Row ${r.row}`, row: r.row, kind: r.kind,
    units: RACK_U, used: r.usedU, reserved: r.reservedU, free: r.freeU, largestFree: r.largestFreeU,
    power: round(kw, 2), maxPower: maxKw, status: byTag[r.alias].status,
    tempFront: inlet, tempRear: round(inlet + dT, 1),
    airflow: Math.round((kw / (AIR_KJ_PER_M3K * dT)) * 3600),
    weight: Math.round(130 + sum((RACK_CONTENTS[r.alias] || []).filter((x) => x[2] !== "r"), ([, , k]) => ITEM_KG[k])),
  };
});

// U-by-U map of any rack, top (U42) first: u = occupied, r = reserved, f = free.
export function rackUMap(alias) {
  const units = new Array(RACK_U).fill("f");
  (RACK_CONTENTS[alias] || []).forEach(([u, size, kind]) => {
    for (let k = u; k < u + size && k <= RACK_U; k++) units[k - 1] = kind === "r" ? "r" : "u";
  });
  return units.reverse().join("");
}

// Rows of the server room, summed (used by overview cards).
export const ROW_LIST = ROWS.map((row) => {
  const racks = RACK_LIST.filter((r) => r.row === row);
  return {
    id: `Row ${row}`, racks: racks.length, units: sum(racks, (r) => r.units), used: sum(racks, (r) => r.used),
    reserved: sum(racks, (r) => r.reserved), power: round(sum(racks, (r) => r.power), 1),
    maxPower: sum(racks, (r) => r.maxPower), status: racks.some((r) => r.status !== "Online") ? "Warning" : "Online",
    tempFront: round(sum(racks, (r) => r.tempFront) / racks.length, 1),
    tempRear: round(Math.max(...racks.map((r) => r.tempRear)), 1),
  };
});

// Facility readings the BMS / ACS tabs share with the 5D View.
export const BUILDING = {
  avgTempC: 22.7,                                   // Thermal Monitoring "Average"
  roomTempC: ROOM_TEMP_C,
  gates: ROOMS.flatMap((r) => [`${r.name} · ENTRY`, `${r.name} · EXIT`]),
  hvacUnits: COOLING_LIST.length,                   // 6 PAC + 1 chiller
  lightingKw: round(DCIM.lightingKw, 1),
  dailyKwh: Math.round(DCIM.dailyMwh * 1000),
};
