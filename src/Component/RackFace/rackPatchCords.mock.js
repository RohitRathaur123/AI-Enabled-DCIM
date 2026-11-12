// ── Rack patch cords — in-memory mock store (PHASE: STATIC / MOCK) ────────
// Every individual cable dressed in a rack's RACK VIEW: server NIC → patch
// panel, switch → LIU, PSU → PDU outlet, and cords that leave the rack for
// another rack or device.
//
//   cord = { id, role, a: End | null, b: End | null }
//   End  = { rackId, portId }      a port inside a rack (see rackView3d.js)
//        | { deviceId }            a whole device that is not a rack
//   null = that end is unplugged and hanging loose.
//
// `role` is the cable's colour / purpose: dataA, dataB, mgmt, backup, san,
// uplink, powerA, powerB.
//
// TODO(backend): replace with GET/POST/DELETE /api/patch-cords. Only
// rackDeviceService.js imports this file.

const cords = new Map();          // id -> cord
const knownSlots = new Map();     // rackId -> Set(slotId) the cabling was last synced against
let seq = 1;

export function nextCordId(rackId) {
  seq += 1;
  return `${rackId || "pc"}:cord${seq}`;
}

export function allCords() {
  return [...cords.values()];
}

export function cordsTouchingRack(rackId) {
  return allCords().filter((c) => c.a?.rackId === rackId || c.b?.rackId === rackId);
}

export function getCord(id) {
  return cords.get(id) || null;
}

export function putCord(cord) {
  cords.set(cord.id, cord);
  return cord;
}

export function deleteCord(id) {
  cords.delete(id);
}

export function getKnownSlots(rackId) {
  return knownSlots.get(rackId);
}

export function setKnownSlots(rackId, slotIds) {
  knownSlots.set(rackId, new Set(slotIds));
}
