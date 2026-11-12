// ═══════════════════════════════════════════════════════════════════════════
// idealDatacenterDemo.js — a worked, "textbook" datacenter, built in code
// ---------------------------------------------------------------------------
// This is a DEMO fixture, not product data. It exists so the 5D view has one
// floor that shows every feature working together without anyone having to
// draw it first: four rooms plus a circulation corridor ring, a real Tier-III
// power chain, a real network chain, hot/cold aisle rack rows sitting hard up
// against their perforated tiles, and cabling on every layer so CONNECTIVITY,
// LAYERS, STORAGE, AIRFLOW, THERMAL MONITORING and SIMULATE all have
// something meaningful to show.
//
// Two things here are deliberately "by the book" because a DC engineer will
// look for them:
//   * The CHILLER is not in the server room. It sits on the ROOF (a plant
//     deck at roof level over the east yard) and its chilled-water pipes drop
//     down a riser and run under the raised floor to the PAC units.
//   * The DATA CABLING is structured: Network Room → backbone tray → the NDR
//     row (Network Distribution Racks) → fiber trunks down the spine tray →
//     one RDR (Row Distribution Rack) at the head of every server row → one
//     Copper (Cat6A) and one Fiber (OM4) run to every server rack. Every run
//     lies in an under-floor cable tray (under the hot aisles, where TIA-942
//     puts data cabling) instead of cutting across the plenum.
//
// ── HOW TO REMOVE IT ──────────────────────────────────────────────────────
// It is deliberately confined to this one file plus three small hooks:
//   1. AddDataCenter.jsx  — `IDEAL_DC` is spread into the dataCenters list,
//                           and open3DView passes IDEAL_ROOMS for it.
//   2. Datacenter3dview.jsx — one effect seeds the scene when dc.isDemo.
// Delete this file and those hooks and nothing else changes; no other code
// imports from here.
//
// ── HOW THE GEOMETRY WORKS ────────────────────────────────────────────────
// Everything is placed on the same 600 mm tile grid the placement engine
// uses, through the same helpers, so a demo device is indistinguishable from
// a hand-placed one: it can be selected, moved, rotated, failed and cabled.
// Positions below are written in METRES relative to the floor centre, and
// snapped to the tile grid on the way in.
// ═══════════════════════════════════════════════════════════════════════════

import {
  TILE_SIZE_MM,
  TILE_SIZE_M,
  getFootprintTiles,
  rotateFootprint,
  tileAnchorToWorldCenter,
  tileKeysForBlock,
} from "../dcim/placement/placementEngine";

// ── The floor ─────────────────────────────────────────────────────────────
// 42 x 30 m: big enough for two aisles of racks, three plant rooms and a
// walkable corridor ring, small enough to read in one screen without flying
// the camera around.
export const IDEAL_DC = {
  id: "demo-ideal",
  isDemo: true,
  dataCenterName: "DEMO — Ideal Datacenter",
  dataCenterCode: "DEMO-IDEAL-00",
  countryId: 1, countryName: "United States",
  stateId: 1, stateName: "California",
  cityId: 1, cityName: "Los Angeles",
  locationName: "Reference Layout",
  streetAddress: "—", pinCode: "—",
  latitude: "34.0522", longitude: "-118.2437",
  siteId: 1, siteName: "Reference Site",
  tenantId: 1, tenantName: "Demo Tenant",
  totalRacks: 12, utilizedRacks: 8,
  powerCapacity: 400, coolingCapacity: 120,
  contactPersonId: 1, contactPersonName: "Reference Design",
  contactEmail: "demo@example.com", contactPhone: "—",
  status: "Active",
  createdDate: "2026-01-01",
  dcLength: 42, dcLengthUnit: "m",
  dcBreadth: 30, dcBreadthUnit: "m",
  totalKW: 400, totalKWUnit: "kW",
  margins: { top: 2, bottom: 2, left: 2, right: 2, unit: "m" },
  doorDirection: "South", doorPosition: "center",
};

// ── The rooms ─────────────────────────────────────────────────────────────
// posX/posZ are explicit so computeRoomLayout places them exactly here
// rather than auto-flowing them. Buildable area is x -19..19, z -13..13.
//
// The plan is drawn around a CIRCULATION RING rather than butting the rooms
// against each other: a 2 m corridor runs right round the inside of the
// building line, one runs down between the plant block and the server room,
// and one splits the plant block itself. Every room therefore has walkable
// floor on the outside of every wall, which is what makes an entry gate on
// one wall and an exit gate on another mean anything.
//
//        x  -19    -17            -8 -7   -3 -2   0  1        14  16      19
//   z -13  ┌───────────────────────────────────────────────────────────────┐
//          │                      corridor (north)                         │
//   z -11  ├──────┬────────────────┬──────┬───┬──────────────────┬───┬─────┤
//          │  c   │   POWER ROOM   │ BATT │ c │   SERVER ROOM    │ c │  T  │
//   z  -1  │  o   ├────────────────┴──────┤ o │                  │ o │  X  │
//          │  r   │      corridor         │ r │                  │ r │  yard
//   z   1  │  r   ├───────────────────────┤ r │                  │ r │     │
//          │  i   │    NETWORK ROOM       │ i │                  │ i │     │
//   z  11  ├──────┴───────────────────────┴───┴──────────────────┴───┴─────┤
//          │                      corridor (south)                         │
//   z  13  └───────────────────────────────────────────────────────────────┘
const room = (id, name, type, color, icon, width, length, posX, posZ, kw) => ({
  id, name, type, typeLabel: name, color, hex: color, icon,
  width, length, height: 4, kw,
  dimUnit: "m", posX, posZ,
  margins: { top: 0, bottom: 0, left: 0, right: 0, unit: "m" },
  innerMargins: { top: 0, bottom: 0, left: 0, right: 0 },
});

// A corridor is an ordinary room of type "corridor" — the 3D builder already
// draws those as a flat walk path with yellow edge lines instead of a
// walled room, so the circulation ring costs no new geometry code.
const walk = (id, name, width, length, posX, posZ) =>
  room(id, name, "corridor", "#475569", "fa-person-walking", width, length, posX, posZ, 0);

export const IDEAL_ROOMS = [
  // The power room carries the whole Tier-III chain from utility to PDU --
  // three transformers (outside, in the yard), a busway, two gensets, two
  // MPPs, three panels, four UPS and two PDUs.
  room("demo-power",   "Power Room",   "electrical", "#eab308", "fa-plug",           9, 10, -12.5, -6.0, 250),
  // The battery room is deliberately tiny next to the others: it is a
  // cupboard for the UPS battery banks, sitting immediately beside the power
  // room so the DC runs between UPS and battery stay short.
  room("demo-battery", "Battery Room", "electrical", "#059669", "fa-car-battery",    4,  5,  -5.0, -8.5,  20),
  room("demo-network", "Network Room", "network",    "#6366f1", "fa-network-wired", 12, 10, -11.0,  6.0,  40),
  // 13 m wide, not 11: the extra 2 m is the service walkway the PAC units
  // were moved back to make -- see the PAC placement further down.
  room("demo-server",  "Server Room",  "server",     "#38bdf8", "fa-server",        13, 18,   7.5,  0.0, 180),

  // ── The circulation ring ────────────────────────────────────────────────
  walk("demo-walk-n", "Corridor — North", 38,  2,   0.0, -12.0),
  walk("demo-walk-s", "Corridor — South", 38,  2,   0.0,  12.0),
  walk("demo-walk-w", "Corridor — West",   2, 22, -18.0,   0.0),
  // No east perimeter walkway: the strip against the east wall is the
  // transformer yard, which is exactly where an HT yard belongs. The server
  // room's own east wall is served by "Corridor — Server" below. Above the
  // north end of that yard, at roof level, is the chiller's plant deck.
  // Between the plant block and the server room, and between the server room
  // and the transformer yard.
  walk("demo-walk-c", "Corridor — Central", 2, 22,  -1.0,  0.0),
  walk("demo-walk-r", "Corridor — Server",  2, 22,  15.0,  0.0),
  // Splits the plant block: power + battery above it, network below.
  walk("demo-walk-p", "Corridor — Plant",  14,  2, -10.0,  0.0),
];

// ── Device catalogue (mirrors the Toolbox tiles these are "dragged" from) ──
// Only the fields a placed device actually keeps. Names must match the
// Toolbox exactly: deploymentChains and selectShapeBuilder both key off them.
const CATALOG = {
  busway:      { name: "Busway", shape: "busway", svgIcon: "busway", icon: "fa-grip-lines", color: "#eab308", category: "Power", power: "2500A", dims: { lengthMm: 6000, widthMm: 400, heightMm: 2800 } },
  dgset:       { name: "DG Set", shape: "generator", svgIcon: "generator", icon: "fa-bolt", color: "#e67e22", category: "Power", power: "750kVA", dims: { lengthMm: 3000, widthMm: 1200, heightMm: 2000 } },
  transformer: { name: "Transformer", shape: "transformer", svgIcon: "transformer", icon: "fa-bolt", color: "#8b5cf6", category: "Power", power: "1000kVA", dims: { lengthMm: 2400, widthMm: 1600, heightMm: 2400 } },
  mpp:         { name: "MPP (Main Power Panel)", shape: "mpp", svgIcon: "mpp", icon: "fa-table-columns", color: "#6366f1", category: "Power", power: "2500A", dims: { lengthMm: 2400, widthMm: 800, heightMm: 2200 } },
  ups:         { name: "UPS Module", shape: "ups", svgIcon: "ups", icon: "fa-car-battery", color: "#f59e0b", category: "Power", power: "300kVA", dims: { lengthMm: 1200, widthMm: 850, heightMm: 1950 } },
  pdu:         { name: "PDU Cabinet", shape: "pdu", svgIcon: "pdu", icon: "fa-plug", color: "#14b8a6", category: "Power", power: "400A", dims: { lengthMm: 1000, widthMm: 800, heightMm: 1900 } },
  // Row PDU: the same PDU cabinet, in the narrow end-of-row format that sits
  // at the head of a rack row rather than in the electrical room.
  rowpdu:      { name: "PDU Cabinet", shape: "pdu", svgIcon: "pdu", icon: "fa-plug", color: "#0d9488", category: "Power", power: "125A", dims: { lengthMm: 600, widthMm: 1000, heightMm: 1900 } },
  pp:          { name: "PP (Power Panel)", shape: "pp", svgIcon: "pp", icon: "fa-table-cells-large", color: "#0ea5e9", category: "Power", power: "400A", dims: { lengthMm: 900, widthMm: 600, heightMm: 2000 } },
  battery:     { name: "Battery Bank", shape: "battery", svgIcon: "battery", icon: "fa-battery-full", color: "#059669", category: "Power", power: "40kWh", dims: { lengthMm: 1200, widthMm: 800, heightMm: 1200 } },

  wan:         { name: "Internet / WAN", shape: "wan", svgIcon: "wan", icon: "fa-globe", color: "#0ea5e9", category: "Network", power: "N/A", dims: { lengthMm: 800, widthMm: 800, heightMm: 1800 } },
  isp:         { name: "ISP Uplink", shape: "isplink", svgIcon: "isplink", icon: "fa-tower-broadcast", color: "#0284c7", category: "Network", power: "120W", dims: { lengthMm: 600, widthMm: 600, heightMm: 1200 } },
  core:        { name: "Core Router", shape: "corerouter", svgIcon: "corerouter", icon: "fa-route", color: "#ef4444", category: "Network", power: "900W", dims: { lengthMm: 600, widthMm: 1000, heightMm: 1600 } },
  firewall:    { name: "Firewall", shape: "firewall", svgIcon: "firewall", icon: "fa-shield-alt", color: "#c0392b", category: "Security", power: "300W", dims: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  dist:        { name: "Distribution Switch", shape: "distswitch", svgIcon: "distswitch", icon: "fa-diagram-project", color: "#8b5cf6", category: "Network", power: "600W", dims: { lengthMm: 600, widthMm: 1000, heightMm: 1600 } },
  tor:         { name: "Access Switch (ToR)", shape: "torswitch", svgIcon: "torswitch", icon: "fa-network-wired", color: "#6366f1", category: "Network", power: "300W", dims: { lengthMm: 600, widthMm: 1000, heightMm: 1200 } },

  rack:        { name: "Rack", shape: "rack", svgIcon: "rack", icon: "fa-server", category: "Compute", color: "#3b82f6", power: "6kW", dims: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  // A network rack is a different cabinet from a server rack: shallower kit,
  // patching and aggregation rather than compute, and drawn in the network
  // colour so the first row of the hall reads as "this is the MDA".
  netrack:     { name: "Network Rack", shape: "netrack", svgIcon: "netrack", icon: "fa-server", category: "Network", color: "#4f46e5", power: "3kW", dims: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  // The two passive distribution cabinets of the structured cabling. Both
  // are network-rack bodies; their NAMES are what put them in the right
  // place in the network chain (see NETWORK_PATCH_STAGES in
  // deploymentChains.js): switch → NDR → RDR → server rack.
  //   NDR — Network Distribution Rack: the MDA row. Takes the access switch
  //         ports and sends a fiber trunk to every row.
  //   RDR — Row Distribution Rack: the head of each server row. Receives the
  //         trunks and hands every rack in its row one copper and one fiber.
  ndr:         { name: "Network Distribution Rack", shape: "netrack", svgIcon: "netrack", icon: "fa-server", category: "Network", color: "#4f46e5", power: "2kW", dims: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  rdr:         { name: "Row Distribution Rack", shape: "netrack", svgIcon: "netrack", icon: "fa-server", category: "Network", color: "#7c3aed", power: "1.5kW", dims: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  // "PAC Unit" is the Toolbox name for the in-room precision air conditioner.
  crac:        { name: "PAC Unit", shape: "crac", svgIcon: "crac", icon: "fa-fan", color: "#0891b2", category: "Cooling", power: "30kW", dims: { lengthMm: 1200, widthMm: 800, heightMm: 1900 } },
  chiller:     { name: "Chiller", shape: "chiller", svgIcon: "chiller", icon: "fa-fan", color: "#16a085", category: "Cooling", power: "100kW", dims: { lengthMm: 1800, widthMm: 1200, heightMm: 2200 } },
};

// ── Roof level ────────────────────────────────────────────────────────────
// Height of the roof deck above the finished floor. Matches the 4.2 m
// building height the 5D view reports, so the chiller stands on the roof.
const ROOF_LEVEL_M = 4.2;

// ── Under-floor containment ───────────────────────────────────────────────
// Everything below is at raised-floor PLENUM heights (the tiles occupy
// y 0 .. 0.3, the slab top is at -1.4). Data trays hang high, just under the
// tiles; chilled-water pipes run lower; power keeps the slab level it
// already used.
//
// KEEP IN STEP with Datacenter3dview.jsx (TRAY_ENTRY_INSET / trayEntryPoint):
// a cable leaves a cabinet through the floor cut-out under its REAR, and both
// files have to agree on where that is or the breakout will not line up.
const TRAY_BOTTOM_Y = -0.34;     // tray floor
const TRAY_CABLE_R = 0.012;      // one cable, as drawn
const TRAY_LAYER_H = 0.027;      // cables stack in up to four layers
const TRAY_ENTRY_INSET = 0.12;   // floor cut-out, this far in from the rear face
const PIPE_Y = -0.62;            // chilled-water pipe run level

const cableLayerY = (layer) => TRAY_BOTTOM_Y + TRAY_CABLE_R + 0.004 + layer * TRAY_LAYER_H;

// Where a cable enters a device from below: the floor cut-out under its rear
// face, slid `offset` metres along the device's own width so several cables
// into one cabinet come up side by side instead of on top of each other.
function trayEntry(dev, offset = 0) {
  const ry = ((dev.rotation || 0) * Math.PI) / 180;
  const depth = (dev.dimensions?.widthMm || 600) / 1000;
  const back = Math.max(0, depth / 2 - TRAY_ENTRY_INSET);
  return {
    x: dev.position.x - Math.sin(ry) * back + Math.cos(ry) * offset,
    z: dev.position.z - Math.cos(ry) * back - Math.sin(ry) * offset,
  };
}
// The same offset, asked for in WORLD x: "put this cable 0.1 m further east".
function lateralForWorldX(dev, dx) {
  const ry = ((dev.rotation || 0) * Math.PI) / 180;
  return dx * Math.cos(ry);
}

// A tray is an axis-aligned straight run. `line` is its centreline (z for an
// x-running tray, x for a z-running one); `near` is the side cables break
// out towards (+1 / -1 in world terms), and slot 0 is the one hard against
// that side. Slots are numbered away from it, so "nearest the exit" is
// always slot 0 whichever way a tray faces.
function makeTray(id, axis, line, from, to, { width = 0.3, slots = 7, near = 1, label = null } = {}) {
  return {
    id, axis, line, width, slots, near, label,
    from: Math.min(from, to), to: Math.max(from, to),
    y: TRAY_BOTTOM_Y,
    pitch: (width - 0.04) / slots,
  };
}
const slotOffset = (tray, slot) => tray.near * ((tray.slots - 1) / 2 - slot) * tray.pitch;
const legCoord = (leg) => leg.tray.line + slotOffset(leg.tray, leg.slot);

// Waypoints for a cable laid through a chain of trays. Consecutive legs are
// perpendicular, so each corner is simply where the two slot lines cross;
// the first and last points sit straight out from the device cut-outs, so
// the renderer only has to add the vertical drop at each end.
function trayWaypoints(entryA, entryB, legs, layer) {
  const y = cableLayerY(layer);
  const pts = [];
  const first = legs[0];
  pts.push(first.tray.axis === "x"
    ? { x: entryA.x, y, z: legCoord(first) }
    : { x: legCoord(first), y, z: entryA.z });
  for (let i = 1; i < legs.length; i++) {
    const p = legs[i - 1], q = legs[i];
    pts.push(p.tray.axis === "x"
      ? { x: legCoord(q), y, z: legCoord(p) }
      : { x: legCoord(p), y, z: legCoord(q) });
  }
  const last = legs[legs.length - 1];
  pts.push(last.tray.axis === "x"
    ? { x: entryB.x, y, z: legCoord(last) }
    : { x: legCoord(last), y, z: entryB.z });
  return pts;
}

// ── Power + cooling containment: the same idea, laid automatically ────────
// The data cabling above is laid slot by slot by hand. Power and cooling have
// far more runs (every rack has two cords and an air line), so for those the
// slots are ALLOCATED: every run is given its chain of trays, and each tray
// then shares its width (and up to four stacking layers) out between the
// runs lying in it -- shortest runs nearest the side they leave from, and no
// run ever given a slot where leaving the tray would cut across another run
// still passing by.
const POWER_TRAY_Y = -1.22;      // power trays sit low, just off the slab
const AIR_Y = -0.9;              // cold-air lines, mid-plenum under the cold aisle
const MAX_LAYERS = 4;

// The point under a device where a run comes up through the floor: `face`
// "rear" or "front", `offset` metres along the device's own width (local X),
// then a world-space `shift` {x, z}. KEEP IN STEP with trayEntryPoint() in
// Datacenter3dview.jsx.
function faceEntry(dev, face = "rear", offset = 0, shift = null) {
  const ry = ((dev.rotation || 0) * Math.PI) / 180;
  const depth = (dev.dimensions?.widthMm || 600) / 1000;
  const back = Math.max(0, depth / 2 - TRAY_ENTRY_INSET);
  const s = face === "front" ? 1 : -1;
  return {
    x: dev.position.x + s * Math.sin(ry) * back + Math.cos(ry) * offset + (shift?.x || 0),
    z: dev.position.z + s * Math.cos(ry) * back - Math.sin(ry) * offset + (shift?.z || 0),
  };
}
// Which of a device's two faces looks towards a tray line.
function faceToward(dev, axis, line) {
  const ry = ((dev.rotation || 0) * Math.PI) / 180;
  const fwd = axis === "x" ? Math.cos(ry) : Math.sin(ry);     // front dir, across the tray
  const toTray = line - (axis === "x" ? dev.position.z : dev.position.x);
  return fwd * toTray >= 0 ? "front" : "rear";
}

const alongOf = (axis, p) => (axis === "x" ? p.x : p.z);
const acrossOf = (axis, p) => (axis === "x" ? p.z : p.x);

// Centreline geometry of a route: entry, each corner, exit.
function routeSkeleton(entryA, entryB, trays) {
  const pts = [entryA];
  for (let i = 1; i < trays.length; i++) {
    const p = trays[i - 1], q = trays[i];
    pts.push(p.axis === "x" ? { x: q.line, z: p.line } : { x: p.line, z: q.line });
  }
  pts.push(entryB);
  return pts;
}

// Shares every tray's width out between the runs lying in it. `items` are
// { a, b, ends: [{ at, side }] } -- the run's extent along the tray and, at
// each end, which side it leaves (or arrives) from. Runs are placed shortest
// first; each takes the free slot nearest its own exit side, on the lowest
// layer where it neither overlaps a run in the same slot nor has to cut
// across one that is still running past the point it leaves at.
function allocateTray(tray, items) {
  const n = tray.slots;
  const EPS = 1e-3;
  const acrossOfSlot = (k) => (k - (n - 1) / 2) * tray.pitch;
  const placed = [];
  const conflicts = (it, c, layer) => {
    for (const d of placed) {
      if (d.layer !== layer) continue;
      if (Math.min(it.b, d.b) - Math.max(it.a, d.a) <= EPS) continue;   // no overlap along the tray
      if (Math.abs(d.across - c) < 1e-6) return true;                   // same slot
      for (const e of it.ends) {
        if (e.at > d.a + EPS && e.at < d.b - EPS && (d.across - c) * e.side > 0) return true;
      }
      for (const e of d.ends) {
        if (e.at > it.a + EPS && e.at < it.b - EPS && (c - d.across) * e.side > 0) return true;
      }
    }
    return false;
  };
  items
    .map((it, i) => ({ it, i }))
    .sort((p, q) => (p.it.b - p.it.a) - (q.it.b - q.it.a) || p.i - q.i)
    .forEach(({ it }) => {
      // Prefer the side this run leaves from; a run leaving both ways (or
      // neither) prefers the tray's own near side.
      const pull = it.ends.reduce((s, e) => s + e.side, 0) || tray.near || 1;
      const order = [...Array(n).keys()].sort((p, q) => (q - p) * Math.sign(pull));
      let best = null;
      for (let layer = 0; layer < MAX_LAYERS && !best; layer++) {
        for (const k of order) {
          const c = acrossOfSlot(k);
          if (!conflicts(it, c, layer)) { best = { across: c, layer }; break; }
        }
      }
      // Nothing clean left: stack it on the top layer rather than lose it.
      if (!best) best = { across: acrossOfSlot(order[0]), layer: MAX_LAYERS - 1 };
      it.across = best.across;
      it.layer = best.layer;
      placed.push(it);
    });
}

// Waypoints for an allocated route: every leg in its own slot and layer; a
// corner between two layers becomes a short vertical step.
function allocatedWaypoints(entryA, entryB, legs) {
  const yOf = (leg) => leg.tray.y + TRAY_CABLE_R + 0.004 + leg.layer * TRAY_LAYER_H;
  const coord = (leg) => leg.tray.line + leg.across;
  const pts = [];
  const first = legs[0];
  pts.push(first.tray.axis === "x"
    ? { x: entryA.x, y: yOf(first), z: coord(first) }
    : { x: coord(first), y: yOf(first), z: entryA.z });
  for (let i = 1; i < legs.length; i++) {
    const p = legs[i - 1], q = legs[i];
    const c = p.tray.axis === "x" ? { x: coord(q), z: coord(p) } : { x: coord(p), z: coord(q) };
    pts.push({ x: c.x, y: yOf(p), z: c.z });
    if (Math.abs(yOf(q) - yOf(p)) > 1e-6) pts.push({ x: c.x, y: yOf(q), z: c.z });
  }
  const last = legs[legs.length - 1];
  pts.push(last.tray.axis === "x"
    ? { x: entryB.x, y: yOf(last), z: coord(last) }
    : { x: coord(last), y: yOf(last), z: entryB.z });
  return pts;
}

/**
 * Build the whole demo scene.
 *
 * @param {object} o
 * @param {number} o.originX  dcGroup.userData.gridOriginX — the tile grid's corner
 * @param {number} o.originZ  dcGroup.userData.gridOriginZ
 * @returns {{devices: Array, connections: Array, perfTiles: Array, cableTrays: Array}}
 */
export function buildIdealDemoScene({ originX, originZ }) {
  const devices = [];
  const connections = [];
  const perfTiles = [];
  const cableTrays = [];
  const occupied = new Set();
  let seq = 1;

  // Place one device at a world position, snapped onto the tile grid exactly
  // the way a drag-and-drop would. Returns the device (or null if the block
  // it needs is already taken, which keeps a layout slip from silently
  // stacking two devices on one tile).
  // Place by TILE ANCHOR. Everything in the server room is laid out this way
  // rather than in metres, because the whole point of that room is an exact
  // tile pattern -- "racks hard against the perforated tiles, no gap" only
  // survives if the tiles, not rounded metres, are what is being counted.
  const placeAt = (key, tx, tz, { rotation = 0, alias, rackU, roomId = null, elevationM = 0 } = {}) => {
    const t = CATALOG[key];
    const dims = rackU
      ? { ...t.dims, heightMm: Math.round(rackU * 44.45 + 10) }
      : t.dims;
    const base = getFootprintTiles({ length: dims.lengthMm, width: dims.widthMm });
    const fp = rotation === 90 || rotation === 270 ? rotateFootprint(base) : base;
    const anchor = { tx, tz };
    const keys = tileKeysForBlock(anchor.tx, anchor.tz, fp.tilesX, fp.tilesZ);
    if (keys.some((k) => occupied.has(k))) return null;
    keys.forEach((k) => occupied.add(k));

    const center = tileAnchorToWorldCenter(anchor.tx, anchor.tz, fp.tilesX, fp.tilesZ, originX, originZ);
    const dev = {
      id: `demo_dev_${seq++}`,
      name: t.name,
      alias: alias || null,
      category: t.category,
      color: t.color,
      icon: t.icon,
      shape: t.shape,
      svgIcon: t.svgIcon,
      hostBuswayId: null,
      roomId,
      position: { x: center.x, z: center.z },
      rotation,
      dimensions: { ...dims },
      footprint: {
        tilesX: fp.tilesX, tilesZ: fp.tilesZ,
        widthMm: fp.tilesX * TILE_SIZE_MM, depthMm: fp.tilesZ * TILE_SIZE_MM,
      },
      tileAnchor: { tx: anchor.tx, tz: anchor.tz },
      occupiedTiles: keys,
      metadata: { power: t.power || "N/A" },
    };
    // Roof-mounted plant: the 5D view lifts the device to this height and
    // stands it on a roof deck instead of on the raised floor.
    if (elevationM > 0) dev.elevationM = elevationM;
    devices.push(dev);
    return dev;
  };

  // Perforated raised-floor tile, addressed by tile coordinate. Skips any
  // tile a device already stands on -- a vent under a cabinet is a hole, not
  // an air supply.
  const addPerfTile = (tx, tz2) => {
    const key = `${tx},${tz2}`;
    if (occupied.has(key)) return;
    if (perfTiles.some((t) => t.tx === tx && t.tz === tz2)) return;
    perfTiles.push({ id: `demo_perf_${perfTiles.length + 1}`, roomId: "demo-server", tx, tz: tz2 });
  };

  // `extra` carries the routing for cables that are laid in trays or run as
  // pipes: { route, waypoints, fromOffset, toOffset } (see Datacenter3dview's
  // rebuildWiring). Anything without it keeps the default plenum run.
  const link = (from, to, type, extra = {}) => {
    if (!from || !to) return null;
    const c = { id: `demo_wire_${seq++}`, fromId: from.id, toId: to.id, type, waypoints: [], ...extra };
    connections.push(c);
    return c;
  };

  // A cable laid through `legs` of tray, entering each end's cabinet through
  // the floor cut-out at `dxA` / `dxB` metres (world x) from its centre.
  const trayLink = (from, to, type, legs, layer, dxA = 0, dxB = 0) => {
    if (!from || !to) return null;
    const offA = lateralForWorldX(from, dxA);
    const offB = lateralForWorldX(to, dxB);
    return link(from, to, type, {
      route: "tray",
      fromOffset: offA,
      toOffset: offB,
      waypoints: trayWaypoints(trayEntry(from, offA), trayEntry(to, offB), legs, layer),
    });
  };

  // Tile helpers for a room: the first tile that sits FULLY inside it, so a
  // layout can be written in tiles from the room's own corner.
  const roomTiles = (roomId) => {
    const r = IDEAL_ROOMS.find((x) => x.id === roomId);
    return {
      x0: Math.ceil((r.posX - r.width / 2 - originX) / TILE_SIZE_M),
      x1: Math.floor((r.posX + r.width / 2 - originX) / TILE_SIZE_M) - 1,
      z0: Math.ceil((r.posZ - r.length / 2 - originZ) / TILE_SIZE_M),
      z1: Math.floor((r.posZ + r.length / 2 - originZ) / TILE_SIZE_M) - 1,
    };
  };

  // ═══ POWER ROOM ══════════════════════════════════════════════════════════
  // Wired exactly as the Tier-III single line reads, top to bottom:
  //
  //   T1 T2 T3 ──────────> BUSWAY
  //   BUSWAY ──> MPP1 <── GEN1          BUSWAY ──> MPP2 <── GEN2
  //   MPP1 ─┬──> PP1 <──┬─ MPP2         PP1 ──> AC1..AC6  (mechanical)
  //         ├──> PP2 <──┤               PP2 ──> UPS1, UPS2 ──> PDU1  (A side)
  //         └──> PP3 <──┘               PP3 ──> UPS3, UPS4 ──> PDU2  (B side)
  //   UPSn ──> BATn  (battery room)     PDU1 ──> every rack <── PDU2
  //
  // Every panel below the MPPs is fed from BOTH main panels, and every rack
  // from both PDUs. That is the whole point of the drawing: there is no
  // single box anywhere in it whose loss drops the floor.
  const pw = roomTiles("demo-power");
  let pz = pw.z0 + 1;                        // one tile of clearance off the wall

  // ── Tier 1: utility transformers — OUTSIDE the power room ──
  // HT transformers do not belong in the LV electrical room: they sit in
  // their own yard, and the only thing that crosses into the building is the
  // LT feed to the busway. The yard is the strip against the building's east
  // wall, past the server room's corridor.
  const yardX = Math.ceil((16.0 - originX) / TILE_SIZE_M);
  const yardZ0 = Math.ceil((-9.5 - originZ) / TILE_SIZE_M);
  const transformers = [0, 4, 8].map((dz, i) =>
    placeAt("transformer", yardX, yardZ0 + dz, { alias: `T${i + 1}` }));

  // ── Tier 2: the LT busway both sources land on ──
  const busway = placeAt("busway", pw.x0 + 1, pz, { alias: "BUSWAY", roomId: "demo-power" });
  pz += 2;

  // ── Tier 2: standby generation ──
  const gen1 = placeAt("dgset", pw.x0 + 1, pz, { alias: "GEN1", roomId: "demo-power" });
  const gen2 = placeAt("dgset", pw.x0 + 7, pz, { alias: "GEN2", roomId: "demo-power" });
  pz += 3;

  // ── Tier 3: main power panels, A and B ──
  const mpp1 = placeAt("mpp", pw.x0 + 1, pz, { alias: "MPP1", roomId: "demo-power" });
  const mpp2 = placeAt("mpp", pw.x0 + 6, pz, { alias: "MPP2", roomId: "demo-power" });
  pz += 3;

  // ── Tier 4: sub panels. PP1 is mechanical, PP2/PP3 are the IT sides ──
  const pp1 = placeAt("pp", pw.x0 + 1, pz, { alias: "PP1", roomId: "demo-power" });
  const pp2 = placeAt("pp", pw.x0 + 4, pz, { alias: "PP2", roomId: "demo-power" });
  const pp3 = placeAt("pp", pw.x0 + 7, pz, { alias: "PP3", roomId: "demo-power" });
  pz += 2;

  // ── Tier 5: UPS, two per IT side ──
  const ups = [1, 4, 7, 10].map((dx, i) =>
    placeAt("ups", pw.x0 + dx, pz, { alias: `UPS${i + 1}`, roomId: "demo-power" }));
  pz += 3;

  // ── Tier 6: PDUs, one per side ──
  const pdu1 = placeAt("pdu", pw.x0 + 1, pz, { alias: "PDU1", roomId: "demo-power" });
  const pdu2 = placeAt("pdu", pw.x0 + 5, pz, { alias: "PDU2", roomId: "demo-power" });

  transformers.forEach((t) => link(t, busway, "power"));
  link(busway, mpp1, "power");
  link(busway, mpp2, "power");
  link(gen1, mpp1, "power");
  link(gen2, mpp2, "power");
  [pp1, pp2, pp3].forEach((pp) => {
    link(mpp1, pp, "power");
    link(mpp2, pp, "power");
  });
  link(pp2, ups[0], "power");
  link(pp2, ups[1], "power");
  link(pp3, ups[2], "power");
  link(pp3, ups[3], "power");
  link(ups[0], pdu1, "power");
  link(ups[1], pdu1, "power");
  link(ups[2], pdu2, "power");
  link(ups[3], pdu2, "power");

  // ═══ BATTERY ROOM ════════════════════════════════════════════════════════
  // One bank per UPS, in its own small room immediately beside the power
  // room. Each bank hangs off its UPS's DC bus, so it is wired UPS -> BAT:
  // that is what puts the banks INSIDE the power cascade rather than beside
  // it — fail a panel or a UPS in SIMULATE and the bank it holds up goes
  // with it, which is exactly the dependency an operator wants to see.
  const bt = roomTiles("demo-battery");
  const batteries = [];
  for (let i = 0; i < 4; i++) {
    const bx = bt.x0 + (i % 2) * 2;
    const bz = bt.z0 + 1 + Math.floor(i / 2) * 2;
    const bank = placeAt("battery", bx, bz, { alias: `BAT${i + 1}`, roomId: "demo-battery" });
    if (bank) batteries.push(bank);
  }
  batteries.forEach((bank, i) => link(ups[i], bank, "power"));

  // ═══ NETWORK ROOM ════════════════════════════════════════════════════════
  //   Internet / WAN ─┬─> ISP A ─> CORE A ─> FW A ─> DIST A ─┬─> ToR A
  //                   └─> ISP B ─> CORE B ─> FW B ─> DIST B ─┴─> ToR B
  //   plus the A<->B peer link at every layer and the DIST<->ToR cross links.
  //   From the access switches down it is structured cabling:
  //   ToR ─> NDR (MDA row) ─fiber trunk─> RDR (head of each row) ─Cu + fiber─> rack
  //   The cables themselves are laid further down, once the server room --
  //   and so the tray network -- is known (see "STRUCTURED CABLING").
  const nw = roomTiles("demo-network");
  const colA = nw.x0 + 4;
  const colB = nw.x0 + 12;
  let nz = nw.z0 + 1;

  const wan = placeAt("wan", nw.x0 + 8, nz, { alias: "WAN", roomId: "demo-network" });
  nz += 3;
  const ispA = placeAt("isp", colA, nz, { alias: "ISP-A", roomId: "demo-network" });
  const ispB = placeAt("isp", colB, nz, { alias: "ISP-B", roomId: "demo-network" });
  nz += 3;
  const coreA = placeAt("core", colA, nz, { alias: "CORE-A", roomId: "demo-network" });
  const coreB = placeAt("core", colB, nz, { alias: "CORE-B", roomId: "demo-network" });
  nz += 3;
  const fwA = placeAt("firewall", colA, nz, { alias: "FW-A", roomId: "demo-network" });
  const fwB = placeAt("firewall", colB, nz, { alias: "FW-B", roomId: "demo-network" });
  nz += 3;
  const distA = placeAt("dist", colA, nz, { alias: "DIST-A", roomId: "demo-network" });
  const distB = placeAt("dist", colB, nz, { alias: "DIST-B", roomId: "demo-network" });

  // Network kit is powered from the power room, A side off PDU1 and B side
  // off PDU2 -- which is what makes a power failure cascade into the network
  // chain in SIMULATE rather than the two behaving as separate worlds.
  [ispA, coreA, fwA, distA].forEach((d) => link(pdu1, d, "power"));
  [ispB, coreB, fwB, distB].forEach((d) => link(pdu2, d, "power"));


  // ═══ SERVER ROOM ════════════════════════════════════════════════════════
  // Laid out tile by tile from the room's own edges, so the pattern holds
  // wherever the room is moved to. Reading across the depth (Z) of the room,
  // starting one tile in from the wall:
  //
  //   [1 tile clear]  wall clearance (the NDR row's data tray runs under it)
  //   [network racks] 2 tiles deep — the MDA / NDR row always comes FIRST
  //   [perf][perf]    the cold aisle, immediately in front of those doors
  //   [rack row]      2 tiles, facing back at the SAME perforated tiles
  //   [hot aisle]     2 tiles, no perforated tile in it (data trays below)
  //   ... repeated ...
  //
  // Every server row starts with its RDR (Row Distribution Rack) at the west
  // end, next to the spine tray; the chiller is NOT in this room at all -- it
  // is on the roof (see below).
  //
  // The rule that matters here, and the one this layout exists to show: a
  // rack row STARTS where the perforated tiles start. There is no spacer
  // tile between a cabinet door and the vent it breathes from -- put one
  // there and the cold plume has somewhere to spill before it reaches the
  // intake. Two rows face each other across one perforated aisle and exhaust
  // into a shared hot aisle behind them; that is what containment is, and it
  // is why there are deliberately NO perforated tiles in the hot aisles.
  const roomRect = IDEAL_ROOMS.find((r) => r.id === "demo-server");
  // First and last tile that sits FULLY inside the room, on each axis.
  const firstTileX = Math.ceil((roomRect.posX - roomRect.width / 2 - originX) / TILE_SIZE_M);
  const lastTileX = Math.floor((roomRect.posX + roomRect.width / 2 - originX) / TILE_SIZE_M) - 1;
  const firstTileZ = Math.ceil((roomRect.posZ - roomRect.length / 2 - originZ) / TILE_SIZE_M);

  // Three aisle PAIRS = six rows. Row 0 is the network rack row.
  const RACK_PAIRS = 3;
  // Reading across the room, wall to wall:
  //
  //   [PAC 2][ walkway 3 ][RPDU 1][ racks N ][RPDU 1][ walkway 3 ][PAC 2]
  //
  // The two walkways are the point of this layout. A PAC unit parked hard
  // against the end of a rack row seals the aisle off: there is no way in or
  // out of it except the far end, and nothing can be wheeled in at all. So
  // the units are stood back three tiles -- 1.8 m, enough for a person and a
  // trolley -- and the room was widened to 13 m to pay for it rather than
  // taking the space out of the rack run.
  const PAC_TILES = 2;
  const PAC_SETBACK_TILES = 3;
  const ROW_PDU_TILES = 1;
  const rackX0 = firstTileX + PAC_TILES + PAC_SETBACK_TILES + ROW_PDU_TILES;
  // Eight cabinets per row, clamped so the run plus both PAC units, both row
  // PDUs and both walkways can never spill past the far wall if the room is
  // ever made narrower.
  const RACKS_PER_ROW = Math.max(1, Math.min(8,
    lastTileX - rackX0 - (ROW_PDU_TILES + PAC_SETBACK_TILES + PAC_TILES) + 1));
  const rackRows = [];
  const coldAisles = [];

  let tz = firstTileZ + 1;                  // one tile of clearance off the wall
  for (let pair = 0; pair < RACK_PAIRS; pair++) {
    // ── Row A: faces +Z, straight into the cold aisle placed right after it
    const isMdaRow = pair === 0;
    const letterA = String.fromCharCode(65 + pair * 2);
    const rowARacks = [];
    for (let i = 0; i < RACKS_PER_ROW; i++) {
      // Cabinets are one tile wide, so the pitch is one tile: they touch,
      // exactly as a real row does.
      // The first row of the hall is the MDA: the NDRs (Network Distribution
      // Racks), with the two access switches closing the row off at its far
      // end. Every other row opens with its RDR (Row Distribution Rack).
      const isTor = isMdaRow && i >= RACKS_PER_ROW - 2;
      const kind = isMdaRow ? (isTor ? "tor" : "ndr") : (i === 0 ? "rdr" : "rack");
      const alias = isMdaRow
        ? (isTor ? `ToR-${i === RACKS_PER_ROW - 2 ? "A" : "B"}` : `NDR-${i + 1}`)
        : (i === 0 ? `RDR-${letterA}` : `RK-${letterA}${i}`);
      const r = placeAt(kind, rackX0 + i, tz, {
        rotation: 0, alias, rackU: kind === "tor" ? undefined : 42, roomId: "demo-server",
      });
      if (r) rowARacks.push({ dev: r, kind });
    }
    rackRows.push({ racks: rowARacks, tz, rotation: 0, isMdaRow, letter: letterA });
    tz += 2;                                // the row itself is two tiles deep

    // ── The cold aisle: perforated tiles hard against the row above, and
    //    the row below sits hard against their far edge. No spacer either
    //    side, which is the whole point of this pass.
    const coldZ = tz;
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < RACKS_PER_ROW; i++) addPerfTile(rackX0 + i, tz);
      tz += 1;
    }
    coldAisles.push({ tz: coldZ });

    // ── Row B: faces -Z, back at those same perforated tiles
    const letterB = String.fromCharCode(65 + pair * 2 + 1);
    const rowBRacks = [];
    for (let i = 0; i < RACKS_PER_ROW; i++) {
      const kind = i === 0 ? "rdr" : "rack";
      const r = placeAt(kind, rackX0 + i, tz, {
        rotation: 180, alias: i === 0 ? `RDR-${letterB}` : `RK-${letterB}${i}`,
        rackU: 42, roomId: "demo-server",
      });
      if (r) rowBRacks.push({ dev: r, kind });
    }
    rackRows.push({ racks: rowBRacks, tz, rotation: 180, isMdaRow: false, letter: letterB });
    tz += 2;

    // ── The hot aisle: two tiles, and deliberately no perforated tile in it.
    tz += 2;
  }

  // ── Cooling: a PAC unit at BOTH ends of every perforated-tile row ────────
  // Each cold aisle is served by two units facing each other down it, which
  // is how a real hall is built: air is pushed into the aisle from both ends
  // so the cabinets in the middle of the run are not starved. A PAC unit is
  // 2 x 2 tiles, so it exactly spans the two-tile depth of the aisle it
  // stands at the head of.
  const acUnits = [];
  coldAisles.forEach((aisle, i) => {
    const west = placeAt("crac", rackX0 - ROW_PDU_TILES - PAC_SETBACK_TILES - PAC_TILES, aisle.tz, {
      rotation: 90, alias: `PAC-${i + 1}W`, roomId: "demo-server",
    });
    const east = placeAt("crac", rackX0 + RACKS_PER_ROW + ROW_PDU_TILES + PAC_SETBACK_TILES, aisle.tz, {
      rotation: 270, alias: `PAC-${i + 1}E`, roomId: "demo-server",
    });
    aisle.pacs = [west, east].filter(Boolean);
    acUnits.push(...aisle.pacs);
  });

  // ── Row PDUs: two per rack row, one at each end of the run, on the room
  //    side of the walkway that separates the racks from the PAC units.
  //
  // End-of-row is where a row PDU actually lives -- it is the busbar the
  // cabinets in that row are corded to -- and there are two of them for the
  // same reason there are two of everything else on this floor: the west one
  // is the A side and takes its feed from PDU1, the east one is the B side
  // and takes PDU2. Every cabinet is then corded left and right, and losing
  // either room PDU costs a rack one cord, not its power.
  const rowPduPairs = [];
  rackRows.forEach((row, idx) => {
    const west = placeAt("rowpdu", rackX0 - 1, row.tz, {
      rotation: 0, alias: `RPDU-${idx + 1}A`, roomId: "demo-server",
    });
    const east = placeAt("rowpdu", rackX0 + RACKS_PER_ROW, row.tz, {
      rotation: 0, alias: `RPDU-${idx + 1}B`, roomId: "demo-server",
    });
    if (west) link(pdu1, west, "power");
    if (east) link(pdu2, east, "power");
    rowPduPairs.push({ row, a: west, b: east });
  });

  // ── The chiller: on the ROOF, never inside the server room ──
  // A chiller's whole job is to throw the floor's heat away to outside air.
  // Standing inside the hall it would dump that heat (and its condenser fan
  // noise and refrigerant) straight back into the room it is meant to cool,
  // so the chiller sits on a plant deck at roof level over the north end of
  // the east yard, clear of the transformers. Only its chilled-water pipes
  // come into the building. It is still the cooling source feeding the PAC
  // units -- that is what gives the cooling cascade something to walk when
  // it is failed -- it just is not on the floor any more.
  const chiller = placeAt("chiller", yardX + 2, yardZ0 - 3, {
    rotation: 180, alias: "CH-01", elevationM: ROOF_LEVEL_M,
  });

  // Chilled-water (CHW) pipework, one flow per PAC unit:
  //   chiller → under the roof deck → RISER at the deck's west edge → down
  //   into the raised-floor plenum → a header along the server room's north
  //   side → a branch down each side of the room → the PAC unit.
  // The six pipes are ordered so they never cross: the east PACs peel off
  // the header first, so they ride its south side; the first unit off each
  // branch is the one nearest the room.
  const FLOOR_LEVEL_Y = 0.3;                 // top of the raised floor (5D view FLOOR_Y)
  const DECK_UNDER_Y = FLOOR_LEVEL_Y + ROOF_LEVEL_M - 0.35;
  const chillerW = (chiller?.footprint.tilesX || 3) * TILE_SIZE_M;
  const riserX = chiller ? chiller.position.x - chillerW / 2 - 0.25 : 0;
  const headerZ = roomRect.posZ - roomRect.length / 2 - 1.0;   // in the strip north of the room
  const eastBranchX = roomRect.posX + roomRect.width / 2 - 0.6; // between the east PACs and the wall
  const westBranchX = roomRect.posX - roomRect.width / 2 - 0.4; // just outside the west wall
  const PIPE_PITCH = 0.12;
  const pipePlan = [];
  coldAisles.forEach((aisle, a) => {
    const [west, east] = aisle.pacs;
    if (east) pipePlan.push({ ac: east, side: "east", a });
    if (west) pipePlan.push({ ac: west, side: "west", a });
  });
  // West to east across the chiller's outlet face: the pipe heading furthest
  // north leaves furthest west, so none has to cross another under the deck.
  const headerOff = (p) => (p.side === "east" ? 1 : -1) * (PIPE_PITCH / 2 + p.a * PIPE_PITCH);
  const outletOrder = [...pipePlan].sort((p, q) => headerOff(p) - headerOff(q));

  acUnits.forEach((ac) => {
    const plan = pipePlan.find((p) => p.ac === ac);
    if (chiller && plan) {
      const k = outletOrder.indexOf(plan);
      const dx = (k - (outletOrder.length - 1) / 2) * 0.1;
      const offA = lateralForWorldX(chiller, dx);
      const outlet = trayEntry(chiller, offA);
      const inlet = trayEntry(ac, 0);
      const zLane = headerZ + headerOff(plan);
      const branchX = plan.side === "east"
        ? eastBranchX + (plan.a - 1) * PIPE_PITCH
        : westBranchX + (1 - plan.a) * PIPE_PITCH;
      link(chiller, ac, "cooling", {
        route: "pipe",
        fromOffset: offA,
        toOffset: 0,
        waypoints: [
          { x: outlet.x, y: DECK_UNDER_Y, z: zLane },   // under the deck, into its lane
          { x: riserX, y: DECK_UNDER_Y, z: zLane },     // across to the riser
          { x: riserX, y: PIPE_Y, z: zLane },           // down the riser, through the floor
          { x: branchX, y: PIPE_Y, z: zLane },          // along the header
          { x: branchX, y: PIPE_Y, z: inlet.z },        // down the branch
          { x: inlet.x, y: PIPE_Y, z: inlet.z },        // across to the PAC unit
        ],
      });
    } else {
      link(chiller, ac, "cooling");
    }
    // Every PAC unit comes off PP1, the mechanical panel, exactly as drawn --
    // and PP1 is itself fed from both MPPs, so cooling survives losing
    // either main panel.
    link(pp1, ac, "power");
  });

  // ── The access switches close the MDA row ──
  const torA = rackRows[0].racks.find((r) => r.kind === "tor")?.dev || null;
  const torB = rackRows[0].racks.filter((r) => r.kind === "tor")[1]?.dev || null;
  link(pdu1, torA, "power");
  link(pdu2, torB, "power");

  // Per-rack service, straight off the two drawings:
  //   power   -- corded left and right to the A and B row PDUs at the two
  //              ends of its own row
  //   cooling -- fed from the PAC unit at the head of its own cold aisle
  //   data    -- one copper and one fiber from its row's RDR, laid in the
  //              row's under-floor tray (see STRUCTURED CABLING below)
  rackRows.forEach((row, idx) => {
    const aisle = coldAisles[Math.floor(idx / 2)] || coldAisles[0];
    const ac = aisle?.pacs?.[idx % 2] || acUnits[0];
    const rp = rowPduPairs.find((r) => r.row === row);
    row.racks.forEach(({ dev: r, kind }) => {
      if (kind === "tor") return;         // powered straight off PDU1/PDU2 above
      if (rp?.a) link(rp.a, r, "power");
      if (rp?.b) link(rp.b, r, "power");
      if (ac) link(ac, r, "cooling");
    });
  });

  // ═══ STRUCTURED CABLING — every data run is laid in an under-floor tray ═══
  //
  //   NETWORK ROOM                    SERVER ROOM
  //   WAN ─ ISP ─ CORE ─ FW ─ DIST ═══ backbone tray ═══╗
  //   (A side on the west rail,                        ║ spine tray
  //    B side on the east rail)      NDR row tray ═════╣ (west walkway)
  //                                  ToR-A/B → NDR-1..6 ║
  //                                  row B tray ═══════╣  RDR-B → RK-B1..B7
  //                                  row C tray ═══════╣  RDR-C → RK-C1..C7
  //                                          ...        ╝
  //
  // Media, by run:
  //   DIST → ToR       fiber   (backbone uplinks, A/B plus the cross links)
  //   ToR  → NDR       copper  (patch cords into the NDR patch panels)
  //   NDR  → RDR       fiber   (one trunk from an A-side and one from a
  //                             B-side NDR into every RDR)
  //   RDR  → rack      copper (Cat6A) + fiber (OM4), one of each per rack
  //
  // Data trays run under the HOT aisles and behind the NDR row -- TIA-942's
  // rule, so cabling never blocks the cold air leaving the perforated tiles.
  // Inside a tray a cable keeps to its own slot (and stacking layer), and
  // the slots are ordered so that a cable leaving the tray for its cabinet
  // never has to cross one that is still running past.
  const T = TILE_SIZE_M;
  const ndrs = rackRows[0].racks.filter((r) => r.kind === "ndr").map((r) => r.dev);
  const serverRows = rackRows.filter((r) => !r.isMdaRow);

  // ── Tray network ──
  // Spine: north-south under the middle tile of the west walkway.
  const spineX = originX + (rackX0 - ROW_PDU_TILES - 2 + 0.5) * T;
  const SPINE_W = 0.45;
  // One tray behind every rack row, hard against the cabinets' rear faces.
  const rowTrayOf = new Map();
  rackRows.forEach((row) => {
    const rearZ = row.rotation === 180
      ? originZ + (row.tz + 2) * T                   // backs face +Z
      : originZ + row.tz * T;                        // backs face -Z
    const line = row.rotation === 180 ? rearZ + 0.18 : rearZ - 0.18;
    const lastX = Math.max(...row.racks.map((r) => r.dev.position.x));
    const tr = makeTray(`tray-row-${row.letter}`, "x", line, spineX - SPINE_W / 2, lastX + 0.45, {
      near: row.rotation === 180 ? -1 : 1,           // slot 0 hugs the cabinets
      label: row.isMdaRow ? "NDR ROW TRAY" : `ROW ${row.letter} TRAY`,
    });
    rowTrayOf.set(row, tr);
    cableTrays.push(tr);
  });
  const rowATray = rowTrayOf.get(rackRows[0]);

  // Network room: a rung behind every device level, joined by an A-side rail
  // (west of the A column) and a B-side rail (east of the B column) -- two
  // physically separate pathways, the same A/B rule as everything else.
  const rungBehind = (dev) => dev.position.z - (dev.footprint.tilesZ * T) / 2 - T / 2;
  const railAX = (ispA?.position.x ?? 0) - T;
  const railBX = (ispB?.position.x ?? 0) + T;
  const R1 = makeTray("tray-nr-wan", "x", rungBehind(wan), railAX - 0.15, railBX + 0.15, { slots: 2 });
  const R2 = makeTray("tray-nr-isp", "x", rungBehind(ispA), railAX - 0.15, railBX + 0.15, { slots: 2 });
  const R3 = makeTray("tray-nr-core", "x", rungBehind(coreA), railAX - 0.15, railBX + 0.15, { slots: 2 });
  const R4 = makeTray("tray-nr-fw", "x", rungBehind(fwA), railAX - 0.15, railBX + 0.15, { slots: 2 });
  // The DIST rung carries straight on out of the room as the backbone tray,
  // under the central corridor, to the foot of the spine.
  const BB = makeTray("tray-backbone", "x", rungBehind(distA), railAX - 0.15, spineX + SPINE_W / 2, {
    slots: 3, label: "BACKBONE TRAY",
  });
  const RA = makeTray("tray-nr-rail-a", "z", railAX, R1.line - 0.15, BB.line + 0.15, {
    slots: 2, near: 1, label: "A-SIDE TRAY",
  });
  const RB = makeTray("tray-nr-rail-b", "z", railBX, R1.line - 0.15, BB.line + 0.15, {
    slots: 2, near: -1, label: "B-SIDE TRAY",
  });
  const SP = makeTray("tray-spine", "z", spineX, rowATray.line - 0.15, BB.line + 0.15, {
    width: SPINE_W, slots: 7, near: 1, label: "SPINE TRAY",
  });
  cableTrays.push(R1, R2, R3, R4, BB, RA, RB, SP);

  const leg = (tray, slot) => ({ tray, slot });

  // ── Network room chain ──
  // Layers alternate down the chain so a cable arriving at a device and the
  // one leaving it never share a stacking level where they overlap.
  trayLink(wan, ispA, "backbone", [leg(R1, 0), leg(RA, 0), leg(R2, 0)], 0, -0.1, -0.12);
  trayLink(wan, ispB, "backbone", [leg(R1, 0), leg(RB, 0), leg(R2, 0)], 0, 0.1, 0.12);
  trayLink(ispA, coreA, "fiber", [leg(R2, 1), leg(RA, 0), leg(R3, 0)], 1, -0.04, -0.12);
  trayLink(ispB, coreB, "fiber", [leg(R2, 1), leg(RB, 0), leg(R3, 0)], 1, 0.04, 0.12);
  trayLink(coreA, fwA, "network", [leg(R3, 1), leg(RA, 0), leg(R4, 0)], 0, -0.04, -0.12);
  trayLink(coreB, fwB, "network", [leg(R3, 1), leg(RB, 0), leg(R4, 0)], 0, 0.04, 0.12);
  trayLink(fwA, distA, "network", [leg(R4, 1), leg(RA, 0), leg(BB, 0)], 2, -0.04, -0.18);
  trayLink(fwB, distB, "network", [leg(R4, 1), leg(RB, 0), leg(BB, 0)], 2, 0.04, 0.18);
  // The A<->B peer link at each layer (the dashed rungs on the drawing).
  trayLink(ispA, ispB, "fiber", [leg(R2, 0)], 3, 0.1, -0.1);
  trayLink(coreA, coreB, "fiber", [leg(R3, 0)], 3, 0.1, -0.1);
  trayLink(fwA, fwB, "network", [leg(R4, 0)], 3, 0.1, -0.1);
  trayLink(distA, distB, "network", [leg(BB, 0)], 3, 0.18, -0.18);

  // ── DIST → ToR: the fiber uplinks, backbone → spine → NDR row ──
  // The cross links (DIST A also reaches ToR B and vice versa) mean losing
  // one aggregation switch never isolates an access switch.
  const upDx = { A: { A: 0.06, B: -0.06 }, B: { A: 0.06, B: -0.06 } };
  [["A", distA], ["B", distB]].forEach(([dSide, dist]) => {
    [["A", torA], ["B", torB]].forEach(([tSide, tor]) => {
      const slotBB = tSide === "A" ? 1 : 2;
      const slotUp = tSide === "A" ? 5 : 6;
      trayLink(dist, tor, "fiber",
        [leg(BB, slotBB), leg(SP, slotUp), leg(rowATray, slotUp)],
        dSide === "A" ? 0 : 1,
        upDx[dSide][tSide],
        dSide === "A" ? -0.2 : -0.13);
    });
  });
  // ToR-A <-> ToR-B peer link, copper DAC along the NDR row tray.
  trayLink(torA, torB, "network", [leg(rowATray, 3)], 2, 0.2, -0.06);

  // ── ToR → NDR patching (copper) ──
  // ToR-A patches the A-side NDRs (1, 3, 5), ToR-B the B-side ones (2, 4, 6).
  // The NDR nearest the switch gets the slot nearest the cabinets.
  const aSideNdrs = ndrs.filter((_, i) => i % 2 === 0);
  const bSideNdrs = ndrs.filter((_, i) => i % 2 === 1);
  [[torA, aSideNdrs, 2], [torB, bSideNdrs, 3]].forEach(([tor, list, layer]) => {
    [...list].reverse().forEach((ndr, s) => {
      const torDx = tor === torA ? -0.06 + s * 0.07 : 0.01 + s * 0.07;
      trayLink(tor, ndr, "copper", [leg(rowATray, s)], layer, torDx, 0.12);
    });
  });

  // ── NDR → RDR fiber trunks, NDR row tray → spine → row tray ──
  // Every RDR takes one trunk from an A-side NDR and one from a B-side NDR,
  // so no single NDR can cut a row off. Trunks for the first row off the
  // spine ride its east edge and peel off first.
  const trunkPlan = [];
  serverRows.forEach((row, r) => {
    const pairIdx = Math.min(Math.floor(r / 2), Math.floor((ndrs.length - 1) / 2));
    const ndrA = ndrs[pairIdx * 2];
    const ndrB = ndrs[pairIdx * 2 + 1] || ndrA;
    trunkPlan.push({ row, r, ndr: ndrA, side: "A" }, { row, r, ndr: ndrB, side: "B" });
  });
  // Slot in the NDR row tray: grouped by destination row, A/B stacked.
  trunkPlan.forEach((t) => { t.slotA = Math.min(4, t.r); });
  const rdrOf = (row) => row.racks.find((x) => x.kind === "rdr")?.dev || null;
  trunkPlan.forEach((t) => {
    const rdr = rdrOf(t.row);
    const mine = trunkPlan.filter((u) => u.ndr === t.ndr);
    const ndrDx = -0.12 + mine.indexOf(t) * 0.08;
    trayLink(t.ndr, rdr, "fiber",
      [leg(rowATray, t.slotA), leg(SP, Math.min(4, t.r)), leg(rowTrayOf.get(t.row), 0)],
      t.side === "A" ? 0 : 1,
      ndrDx,
      t.side === "A" ? -0.225 : -0.195);
  });

  // ── RDR → every rack in its row: one copper (Cat6A), one fiber (OM4) ──
  // Rack i takes slot i-1 (nearest the cabinets for the nearest rack), with
  // copper on the bottom layer and fiber stacked on top of it. At the RDR the
  // cables for the far end of the row come up furthest west, so no run ever
  // crosses another on its way out of the tray.
  serverRows.forEach((row) => {
    const rdr = rdrOf(row);
    const tr = rowTrayOf.get(row);
    const racks = row.racks.filter((x) => x.kind === "rack").map((x) => x.dev)
      .sort((p, q) => p.position.x - q.position.x);
    const n = racks.length;
    racks.forEach((rack, i) => {
      const k = n - 1 - i;                          // far racks first, west to east
      const cuDx = -0.165 + k * 0.06;
      trayLink(rdr, rack, "copper", [leg(tr, i)], 0, cuDx, -0.05);
      trayLink(rdr, rack, "fiber", [leg(tr, i)], 1, cuDx + 0.03, 0.05);
    });
  });

  // ═══ POWER + COOLING — laid in their own containment ═════════════════════
  //
  //   POWER ROOM   a rung behind every row of plant, joined by an A-side rail
  //                (west wall) and a B-side rail (east wall)
  //   A PATH       PDU1 / PP1 → west rail → SOUTH TRUNK (under the plant
  //                corridor) → the A SPINE down the server room's west walkway
  //   B PATH       PDU2 / PP1 → east rail → NORTH HEADER (along the north of
  //                the building) → the B SPINE down the east walkway
  //   NETWORK RM   an A and a B power rail beside the two device columns, off
  //                the south trunk
  //   ROW TRAYS    one low power tray in the cold aisle along the front of
  //                every rack row: RPDU-A cords run east, RPDU-B cords west
  //   AIR          each PAC unit's cold air runs down the middle of its cold
  //                aisle, under the perforated tiles, to every rack it serves
  //                (drawn without a tray -- it is air, not a cable)
  //   HT FEEDERS   transformers → yard rail → north header → busway
  //
  // Power never shares containment with data: data trays hang high under the
  // hot aisles, power trays sit low, at the front of the racks, in the cold
  // aisles -- the TIA-942 split. So a rack takes its data at the back and its
  // power (and air) at the front.
  const PW = (id, axis, line, from, to, opts = {}) => {
    const tr = makeTray(id, axis, line, from, to, { width: 0.36, slots: 9, ...opts });
    tr.y = POWER_TRAY_Y;
    tr.kind = "power";
    return tr;
  };
  const rungBehindTiles = (dev) => dev.position.z - (dev.footprint.tilesZ * T) / 2 - T / 2;

  // Power room grid.
  const prWestX = originX + (pw.x0 + 0.5) * T;
  const prEastX = originX + (pw.x1 - 1 + 0.5) * T;
  const walkP = IDEAL_ROOMS.find((r) => r.id === "demo-walk-p");
  const trunkZ = originZ + (Math.round((walkP.posZ - originZ) / T - 0.5) + 0.5) * T;
  const txList = transformers.filter(Boolean);
  const yardRailX = Math.min(...txList.map((t) => t.position.x - (t.footprint.tilesX * T) / 2)) - T / 2;
  const aSpineX = originX + (rackX0 - ROW_PDU_TILES - PAC_SETBACK_TILES + 0.5) * T;
  const bSpineX = originX + (rackX0 + RACKS_PER_ROW + ROW_PDU_TILES + PAC_SETBACK_TILES - 1 + 0.5) * T;

  // The busway's rung carries straight on east as the NORTH HEADER, all the
  // way to the transformer yard.
  const HDR = PW("ptray-north-header", "x", rungBehindTiles(busway), prWestX - 0.2, yardRailX + 0.2,
    { width: 0.45, slots: 10, label: "POWER HEADER (B)" });
  const Rg = PW("ptray-pr-gen", "x", rungBehindTiles(gen1), prWestX - 0.2, prEastX + 0.2);
  const Rm = PW("ptray-pr-mpp", "x", rungBehindTiles(mpp1), prWestX - 0.2, prEastX + 0.2);
  const Rp = PW("ptray-pr-pp", "x", rungBehindTiles(pp1), prWestX - 0.2, prEastX + 0.2);
  const Ru = PW("ptray-pr-ups", "x", rungBehindTiles(ups[0]), prWestX - 0.2, prEastX + 0.2);
  const Rd = PW("ptray-pr-pdu", "x", rungBehindTiles(pdu1), prWestX - 0.2, prEastX + 0.2);
  const PRW = PW("ptray-pr-rail-a", "z", prWestX, HDR.line - 0.2, trunkZ + 0.2,
    { width: 0.45, slots: 10, near: 1, label: "POWER RAIL (A)" });
  const PRE = PW("ptray-pr-rail-b", "z", prEastX, HDR.line - 0.2, trunkZ + 0.2,
    { width: 0.45, slots: 10, near: -1, label: "POWER RAIL (B)" });
  const TRUNK = PW("ptray-south-trunk", "x", trunkZ, prWestX - 0.2, aSpineX + 0.2,
    { width: 0.45, slots: 10, label: "POWER TRUNK (A)" });
  const lastTx = txList.reduce((m, t) => (t.position.z > m.position.z ? t : m), txList[0]);
  const YARD = PW("ptray-yard", "z", yardRailX, HDR.line - 0.2,
    lastTx.position.z - (lastTx.footprint.tilesZ * T) / 2 + 0.3, { near: 1, label: "HT FEEDERS" });

  // Network room: a power rail outside each device column.
  const netA = [ispA, coreA, fwA, distA].filter(Boolean);
  const netB = [ispB, coreB, fwB, distB].filter(Boolean);
  const netLastZ = Math.max(...[...netA, ...netB].map((d) => d.position.z + (d.footprint.tilesZ * T) / 2)) + 0.1;
  const NRA = PW("ptray-nr-a", "z", (ispA?.position.x ?? 0) - 2 * T, trunkZ - 0.2, netLastZ, { near: 1 });
  const NRB = PW("ptray-nr-b", "z", (ispB?.position.x ?? 0) + 2 * T, trunkZ - 0.2, netLastZ, { near: -1 });

  // Server room: the two power spines and a power tray along the front of
  // every rack row, in the cold aisle.
  const rowPowerTray = new Map();
  rackRows.forEach((row) => {
    const line = row.rotation === 180
      ? originZ + row.tz * T - 0.2                   // front faces -Z
      : originZ + (row.tz + 2) * T + 0.2;            // front faces +Z
    rowPowerTray.set(row, PW(`ptray-row-${row.letter}`, "x", line, aSpineX - 0.2, bSpineX + 0.2, {
      near: row.rotation === 180 ? 1 : -1, label: `ROW ${row.letter} POWER`,
    }));
  });
  const powerZs = [...rowPowerTray.values()].map((t) => t.line);
  const ASP = PW("ptray-spine-a", "z", aSpineX, Math.min(...powerZs, trunkZ) - 0.2,
    Math.max(...powerZs, trunkZ) + 0.2, { width: 0.45, slots: 10, near: 1, label: "POWER SPINE (A)" });
  const BSP = PW("ptray-spine-b", "z", bSpineX, HDR.line - 0.2, Math.max(...powerZs) + 0.2,
    { width: 0.45, slots: 10, near: -1, label: "POWER SPINE (B)" });

  // Cold-air "channels" down the middle of each cold aisle: allocation only,
  // nothing is drawn for them.
  const airChannel = coldAisles.map((aisle, i) => {
    const [w, e] = aisle.pacs;
    const x0 = w ? faceEntry(w, "front").x - 0.4 : aSpineX;
    const x1 = e ? faceEntry(e, "front").x + 0.4 : bSpineX;
    const ch = makeTray(`air-${i + 1}`, "x", originZ + (aisle.tz + 1) * T, x0, x1, { width: 0.5, slots: 16 });
    ch.y = AIR_Y - TRAY_CABLE_R - 0.004;
    ch.kind = "air";
    return ch;
  });

  cableTrays.push(HDR, Rg, Rm, Rp, Ru, Rd, PRW, PRE, TRUNK, YARD, NRA, NRB,
    ...rowPowerTray.values(), ASP, BSP, ...airChannel);

  // ── Which containment each run takes ──
  const txIds = new Set(txList.map((t) => t.id));
  const upsIds = new Set(ups.filter(Boolean).map((u) => u.id));
  const batIds = new Set(batteries.map((b) => b.id));
  const ppIds = new Set([pp1, pp2, pp3].filter(Boolean).map((p) => p.id));
  const netAIds = new Set(netA.map((d) => d.id));
  const netBIds = new Set(netB.map((d) => d.id));
  const rpduRow = new Map();
  rowPduPairs.forEach(({ row, a, b }) => {
    if (a) rpduRow.set(a.id, row);
    if (b) rpduRow.set(b.id, row);
  });
  const rackRowOf = new Map();
  rackRows.forEach((row) => row.racks.forEach(({ dev, kind }) => { if (kind !== "tor") rackRowOf.set(dev.id, row); }));
  const pacInfo = new Map();
  coldAisles.forEach((aisle, i) => aisle.pacs.forEach((p) => {
    pacInfo.set(p.id, { aisle: i, west: p.position.x < aSpineX + 1 });
  }));
  const powerTrays = (from, to) => {
    const A = (dev) => dev === mpp1 || dev === gen1 || dev === pp2 || dev === pdu1;
    if (txIds.has(from.id) && to === busway) return [YARD, HDR];
    if (from === busway && (to === mpp1 || to === mpp2)) return [HDR, to === mpp1 ? PRW : PRE, Rm];
    if ((from === gen1 || from === gen2) && (to === mpp1 || to === mpp2)) return [Rg, A(from) ? PRW : PRE, Rm];
    if ((from === mpp1 || from === mpp2) && ppIds.has(to.id)) return [Rm, A(from) ? PRW : PRE, Rp];
    if ((from === pp2 || from === pp3) && upsIds.has(to.id)) return [Rp, A(from) ? PRW : PRE, Ru];
    if (upsIds.has(from.id) && (to === pdu1 || to === pdu2)) return [Ru, A(to) ? PRW : PRE, Rd];
    if (upsIds.has(from.id) && batIds.has(to.id)) return [Ru, PRE, HDR];
    if (from === pdu1 || from === pdu2) {
      const aSide = from === pdu1;
      if (rpduRow.has(to.id) || to === torA || to === torB) {
        const rt = rowPowerTray.get(rpduRow.get(to.id) || rackRows[0]);
        return aSide ? [Rd, PRW, TRUNK, ASP, rt] : [Rd, PRE, HDR, BSP, rt];
      }
      if (netAIds.has(to.id)) return [Rd, PRW, TRUNK, NRA];
      if (netBIds.has(to.id)) return [Rd, PRE, TRUNK, NRB];
    }
    if (from === pp1 && pacInfo.has(to.id)) {
      return pacInfo.get(to.id).west ? [Rp, PRW, TRUNK, ASP] : [Rp, PRE, HDR, BSP];
    }
    if (rpduRow.has(from.id) && rackRowOf.has(to.id)) return [rowPowerTray.get(rpduRow.get(from.id))];
    return null;
  };
  const coolingTrays = (from, to) => (pacInfo.has(from.id) && rackRowOf.has(to.id)
    ? [airChannel[pacInfo.get(from.id).aisle]] : null);
  // Every run comes up on the face that looks at its tray; a transformer's
  // HT feeders leave from its back, towards the header.
  const faceFor = (dev, tray) => (txIds.has(dev.id) ? "rear" : faceToward(dev, tray.axis, tray.line));

  const byId = new Map(devices.map((d) => [d.id, d]));
  const laid = [];
  connections.forEach((c) => {
    if (c.route || (c.type !== "power" && c.type !== "cooling")) return;
    const from = byId.get(c.fromId), to = byId.get(c.toId);
    if (!from || !to) return;
    const trays = c.type === "cooling" ? coolingTrays(from, to) : powerTrays(from, to);
    if (!trays) return;
    laid.push({
      c, from, to, trays,
      faceA: faceFor(from, trays[0]),
      faceB: faceFor(to, trays[trays.length - 1]),
    });
  });

  // Pass 1: share every tray out between the runs in it.
  const itemsByTray = new Map();
  laid.forEach((r) => {
    const pts = routeSkeleton(faceEntry(r.from, r.faceA), faceEntry(r.to, r.faceB), r.trays);
    const n = r.trays.length;
    r.legs = r.trays.map((tray, i) => {
      const a0 = alongOf(tray.axis, pts[i]), a1 = alongOf(tray.axis, pts[i + 1]);
      const fromPt = i === 0 ? pts[0] : pts[i - 1];
      const toPt = i === n - 1 ? pts[n] : pts[i + 2];
      const side = (p) => Math.sign(acrossOf(tray.axis, p) - tray.line);
      const item = {
        tray, a: Math.min(a0, a1), b: Math.max(a0, a1), dir: Math.sign(a1 - a0),
        ends: [{ at: a0, side: side(fromPt) }, { at: a1, side: side(toPt) }],
      };
      if (!itemsByTray.has(tray)) itemsByTray.set(tray, []);
      itemsByTray.get(tray).push(item);
      return item;
    });
  });
  itemsByTray.forEach((items, tray) => allocateTray(tray, items));

  // Pass 2: where several runs come up into one device, spread them across
  // it -- in the order that lets each one reach its slot without cutting
  // across another (the run whose slot is closest leaves furthest ahead).
  const endGroups = new Map();
  laid.forEach((r) => {
    const n = r.legs.length;
    [["A", r.from, r.faceA, r.legs[0], r.legs[0].dir],
     ["B", r.to, r.faceB, r.legs[n - 1], -r.legs[n - 1].dir]].forEach(([end, dev, face, lg, dir]) => {
      const key = `${dev.id}|${face}|${lg.tray.axis}`;
      if (!endGroups.has(key)) endGroups.set(key, { dev, face, axis: lg.tray.axis, members: [] });
      const base = faceEntry(dev, face);
      endGroups.get(key).members.push({
        r, end, dir: dir || 1,
        close: Math.abs(lg.tray.line + lg.across - acrossOf(lg.tray.axis, base)),
      });
    });
  });
  endGroups.forEach(({ dev, face, axis, members }) => {
    const neg = members.filter((m) => m.dir < 0).sort((p, q) => p.close - q.close);
    const pos = members.filter((m) => m.dir >= 0).sort((p, q) => q.close - p.close);
    const ordered = [...neg, ...pos];
    // How much of the device there is to spread across along this axis.
    const ry = ((dev.rotation || 0) * Math.PI) / 180;
    const widthAxisIsX = Math.abs(Math.cos(ry)) > 0.5;
    const size = (axis === "x") === widthAxisIsX
      ? (dev.dimensions?.lengthMm || 600) / 1000
      : (dev.dimensions?.widthMm || 600) / 1000;
    const pitch = Math.min(0.07, Math.max(0.02, (size - 0.14) / Math.max(1, ordered.length)));
    const base = faceEntry(dev, face);
    const centre = axis === "x" ? dev.position.x : dev.position.z;
    ordered.forEach((m, k) => {
      const want = centre + (k - (ordered.length - 1) / 2) * pitch;
      const d = want - (axis === "x" ? base.x : base.z);
      const shift = ordered.length > 1 ? (axis === "x" ? { x: d, z: 0 } : { x: 0, z: d }) : null;
      if (m.end === "A") m.r.shiftA = shift; else m.r.shiftB = shift;
    });
  });

  laid.forEach((r) => {
    const eA = faceEntry(r.from, r.faceA, 0, r.shiftA);
    const eB = faceEntry(r.to, r.faceB, 0, r.shiftB);
    Object.assign(r.c, {
      route: "tray",
      fromFace: r.faceA, toFace: r.faceB,
      fromShift: r.shiftA || null, toShift: r.shiftB || null,
      waypoints: allocatedWaypoints(eA, eB, r.legs.map((lg) => ({ tray: lg.tray, across: lg.across, layer: lg.layer }))),
    });
  });

  return { devices, connections, perfTiles, cableTrays };
}

/** A one-line summary, used for the toast shown when the demo loads. */
export function describeIdealDemo({ devices, connections, perfTiles }) {
  // Counted by body, not by name: NDRs and RDRs are racks too.
  const racks = devices.filter((d) => d.shape === "rack" || d.shape === "netrack").length;
  const byType = connections.reduce((m, c) => ({ ...m, [c.type]: (m[c.type] || 0) + 1 }), {});
  return {
    devices: devices.length,
    racks,
    connections: connections.length,
    perfTiles: perfTiles.length,
    cableTypes: Object.keys(byType).sort(),
  };
}
