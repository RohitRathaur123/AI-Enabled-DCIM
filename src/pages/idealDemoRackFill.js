// ── IDEAL DEMO: what is inside every rack ────────────────────────────────
// Demo data only (kept apart from idealDatacenterDemo.js so that file stays
// free of image imports and removing the demo stays a clean cut).
//
// Every cabinet on the demo floor gets a realistic, repeatable U-plan:
//   • server racks (RK-..): patch panels + fibre LIU on top, then a mix of
//     2U / 4U servers with some FREE gaps and one or two RESERVED blocks;
//   • RDRs (row distribution): LIU from the NDR, two access switches, the
//     copper patch panels that feed their row and the row's management
//     server, plus reserved + free;
//   • NDRs (network distribution): two LIUs, two aggregation switches,
//     patch panels, the DNS/DHCP and network-monitoring servers, a reserved
//     block for the spine, the rest free.
//
// Slots use the same shape as the Rack Elevation dialog writes:
//   { id, deviceId, deviceName, startU, sizeU, frontImageUrl, backImageUrl }
// with startU counted from the BOTTOM. Reserved space carries reserved:true,
// which is what paints it blue in the STORAGE view.

import { DEVICE_IMAGE_LIBRARY } from "../Component/RackFace/deviceImageLibrary";
import { RACK_GEAR, gearImageUrl, reservedImageUrl } from "./rackView3d";

const LIB = Object.fromEntries(DEVICE_IMAGE_LIBRARY.map((d) => [d.id, d]));
const U_M = 0.04445;

// Small seeded PRNG, so a rack gets the same contents on every load.
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

const RESERVED_NOTES = [
  "Q4 expansion", "Client onboarding", "DB cluster", "AI / GPU pilot", "Hot spares", "Storage refresh",
];

const serverSlot = (rackId, model, startU, name) => {
  const lib = LIB[model];
  return {
    id: `${rackId}-u${startU + 1}`,
    deviceId: lib.id,
    deviceName: name,
    startU,
    sizeU: lib.defaultSizeU,
    frontImageUrl: lib.frontImageUrl,
    backImageUrl: lib.backImageUrl,
  };
};

const gearSlot = (rackId, gearId, startU, name, extra = {}) => ({
  id: `${rackId}-u${startU + 1}`,
  deviceId: gearId,
  deviceName: name,
  startU,
  sizeU: RACK_GEAR[gearId].sizeU,
  frontImageUrl: gearImageUrl(gearId, "front"),
  backImageUrl: gearImageUrl(gearId, "back"),
  ...extra,
});

const reservedSlot = (rackId, startU, sizeU, note) => ({
  id: `${rackId}-res-u${startU + 1}`,
  deviceId: null,
  deviceName: `Reserved — ${note}`,
  startU,
  sizeU,
  reserved: true,
  status: "reserved",
  frontImageUrl: reservedImageUrl(),
  backImageUrl: reservedImageUrl(),
});

// Server rack: 4U of cabling gear on top, servers / reserved / free below.
function planServerRack(dev, totalU) {
  const rackId = dev.id;
  const tag = String(dev.alias || rackId).replace(/^RK-/, "");
  const rnd = seeded(`rack|${dev.alias || rackId}`);
  const slots = [];
  let top = totalU - 1;
  slots.push(gearSlot(rackId, "gear-patch-cat6-24", top--, `PP-A · ${tag} · Cat6 → RDR`));
  slots.push(gearSlot(rackId, "gear-patch-cat6-24", top--, `PP-B · ${tag} · Cat6 → RDR`));
  slots.push(gearSlot(rackId, "gear-liu-lc-24", top--, `LIU · ${tag} · OM4 → RDR`));
  slots.push(gearSlot(rackId, "gear-cable-mgr-1u", top--, "Horizontal cable manager"));

  const regionU = top + 1;
  const usedTarget = Math.round(regionU * (0.4 + rnd() * 0.24));
  const items = [];
  let used = 0;
  for (let guard = 0; guard < 60 && used < usedTarget; guard++) {
    const r = rnd();
    const model = r < 0.2 ? "dev-server-c" : r < 0.62 ? "dev-server-a" : "dev-server-b";
    const size = LIB[model].defaultSizeU;
    if (used + size > usedTarget + 1) continue;
    items.push({ type: "server", model });
    used += size;
    if (rnd() < 0.24) items.push({ type: "free", size: 1 + Math.floor(rnd() * 3) });
  }
  const reservedBlocks = rnd() < 0.5 ? 2 : 1;
  for (let k = 0; k < reservedBlocks; k++) {
    const size = 2 + Math.floor(rnd() * 4);                       // 2..5U
    const note = RESERVED_NOTES[Math.floor(rnd() * RESERVED_NOTES.length)];
    items.splice(Math.floor(rnd() * (items.length + 1)), 0, { type: "reserved", size, note });
  }

  const counters = { "dev-server-a": 0, "dev-server-b": 0, "dev-server-c": 0 };
  const prefix = { "dev-server-a": "APP", "dev-server-b": "WEB", "dev-server-c": "GPU" };
  const KEEP_FREE_AT_BOTTOM = 3;
  let cur = top;
  for (const it of items) {
    const size = it.type === "server" ? LIB[it.model].defaultSizeU : it.size;
    const startU = cur - size + 1;
    if (startU < KEEP_FREE_AT_BOTTOM) continue;
    if (it.type === "server") {
      counters[it.model] += 1;
      const nn = String(counters[it.model]).padStart(2, "0");
      slots.push(serverSlot(rackId, it.model, startU, `${prefix[it.model]}-${tag}-${nn}`));
    } else if (it.type === "reserved") {
      slots.push(reservedSlot(rackId, startU, size, it.note));
    }
    cur = startU - 1;
  }

  // Every rack shows all three states. If the dice left this one without a
  // reserved block, carve one out of its biggest free run.
  if (!slots.some((s) => s.reserved)) {
    const taken = new Array(totalU).fill(false);
    slots.forEach((s) => { for (let k = s.startU; k < s.startU + s.sizeU; k++) taken[k] = true; });
    let best = null;
    for (let k = KEEP_FREE_AT_BOTTOM; k < totalU;) {
      if (taken[k]) { k++; continue; }
      let n = 0;
      while (k + n < totalU && !taken[k + n]) n++;
      if (!best || n > best.n) best = { k, n };
      k += n;
    }
    if (best && best.n >= 3) {
      const size = Math.min(4, best.n - 1);
      slots.push(reservedSlot(rackId, best.k + best.n - size, size, RESERVED_NOTES[0]));
    }
  }
  return slots;
}

// Row Distribution Rack: fibre in from the NDR, two access switches, the
// copper that runs out to every cabinet in the row.
function planRdr(dev, totalU) {
  const rackId = dev.id;
  const row = String(dev.alias || "").replace(/^RDR-/, "") || "X";
  const rnd = seeded(`rdr|${dev.alias || rackId}`);
  let u = totalU - 1;
  const slots = [
    gearSlot(rackId, "gear-liu-lc-24", u--, `LIU · RDR-${row} · OM4 from NDR`),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
    gearSlot(rackId, "gear-switch-48", u--, `SW-${row}A · Access switch (A)`, { cabling: { copper: 14, role: "dataA", sfp: 2 } }),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
    gearSlot(rackId, "gear-switch-48", u--, `SW-${row}B · Access switch (B)`, { cabling: { copper: 14, role: "dataB", sfp: 2 } }),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
  ];
  for (let k = 1; k <= 4; k++) {
    slots.push(gearSlot(rackId, "gear-patch-cat6-24", u--, `PP-${k} · Cat6 → row ${row} racks`));
  }
  slots.push(gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"));
  u -= 1 + Math.floor(rnd() * 2);                                   // a little air
  // The row's own management host (jump box / monitoring probe).
  slots.push(serverSlot(rackId, "dev-server-b", u - 1, `MGMT-${row}-01 · Row monitoring`));
  u -= 2 + 1 + Math.floor(rnd() * 2);
  const res = 4 + Math.floor(rnd() * 3);
  slots.push(reservedSlot(rackId, u - res + 1, res, "row switch expansion"));
  u -= res + 4 + Math.floor(rnd() * 6);
  if (u > 8) {
    const res2 = 2 + Math.floor(rnd() * 3);
    slots.push(reservedSlot(rackId, u - res2 + 1, res2, RESERVED_NOTES[Math.floor(rnd() * RESERVED_NOTES.length)]));
  }
  return slots;
}

// Network Distribution Rack: the MDA -- fibre out to every RDR, the
// aggregation pair, patch panels for the core / firewall side.
function planNdr(dev, totalU) {
  const rackId = dev.id;
  const n = String(dev.alias || "").replace(/^NDR-/, "") || "1";
  const rnd = seeded(`ndr|${dev.alias || rackId}`);
  let u = totalU - 1;
  const slots = [
    gearSlot(rackId, "gear-liu-lc-24", u--, `LIU-1 · NDR-${n} · OM4 to RDRs`),
    gearSlot(rackId, "gear-liu-lc-24", u--, `LIU-2 · NDR-${n} · OM4 to RDRs`),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
    gearSlot(rackId, "gear-switch-48", u--, `AGG-${n}A · Aggregation switch (A)`, { cabling: { copper: 8, role: "dataA", sfp: 4 } }),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
    gearSlot(rackId, "gear-switch-48", u--, `AGG-${n}B · Aggregation switch (B)`, { cabling: { copper: 8, role: "dataB", sfp: 4 } }),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
    gearSlot(rackId, "gear-patch-cat6-24", u--, `PP-1 · NDR-${n} · Core / firewall`),
    gearSlot(rackId, "gear-patch-cat6-24", u--, `PP-2 · NDR-${n} · ToR uplinks`),
    gearSlot(rackId, "gear-cable-mgr-1u", u--, "Horizontal cable manager"),
  ];
  u -= 1;
  // Network services live next to the network they serve.
  slots.push(serverSlot(rackId, "dev-server-a", u - 1, `DNS-${n}-01 · DNS / DHCP`));
  u -= 2;
  slots.push(serverSlot(rackId, "dev-server-b", u - 1, `NMS-${n}-01 · Network monitoring`));
  u -= 2 + 2 + Math.floor(rnd() * 3);
  const res = 4 + Math.floor(rnd() * 4);
  slots.push(reservedSlot(rackId, u - res + 1, res, "spine expansion"));
  return slots;
}

/**
 * Slot plans for every rack-type device on the demo floor.
 * @param {Array} devices  the demo's device list (buildIdealDemoScene().devices)
 * @returns {Map<string, Array>} deviceId -> slots
 */
export function buildIdealDemoRackSlots(devices) {
  const out = new Map();
  (devices || []).forEach((d) => {
    if (d.shape !== "rack" && d.shape !== "netrack") return;
    const heightM = (d.dimensions?.heightMm || 2000) / 1000;
    // Same U count the 3D rack uses (computeTotalUnits in RackRealFace.js).
    const totalU = Math.max(1, Math.floor(heightM / U_M));
    const alias = String(d.alias || "");
    const plan = alias.startsWith("NDR") ? planNdr : alias.startsWith("RDR") ? planRdr : planServerRack;
    out.set(d.id, plan(d, totalU));
  });
  return out;
}
