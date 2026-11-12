// ── Rack slot assignments — in-memory mock store (PHASE: STATIC / MOCK) ──
// Maps rackId -> array of slots: { id, deviceId, deviceName, startU, sizeU,
// frontImageUrl, backImageUrl }. startU is measured from the BOTTOM of the
// rack (0 = bottom-most U), matching how real racks are usually described.
//
// TODO(backend): replace this whole file's storage with real API calls
// (GET/POST /api/racks/:rackId/slot-assignments). rackDeviceService.js is
// the only file that imports from here — swap it there and every caller
// (RackRealFace.js, Datacenter3dview.jsx, the future assignment panel)
// keeps working unchanged.

import { DEVICE_IMAGE_LIBRARY } from "./deviceImageLibrary";

const store = {};

// Demo layout kept around for testing/seeding only -- NOT used as the
// automatic fallback below anymore (a real rack should start empty, not
// pre-filled with 3 generic sample photos). Call it yourself if you want
// to seed a rack with sample data to look at.
export function buildDefaultSlots(totalUnitsU = 42) {
  const [a, b, c] = DEVICE_IMAGE_LIBRARY;
  const pattern = [c, b, a, b].filter(Boolean);
  const slots = [];
  let cursor = totalUnitsU - 1; // fill downward from the top
  pattern.forEach((dev) => {
    const sizeU = Math.min(dev.defaultSizeU || 1, cursor + 1);
    if (sizeU <= 0) return;
    const startU = cursor - sizeU + 1;
    if (startU < 0) return;
    slots.push({
      id: `${dev.id}-${startU}`,
      deviceId: dev.id,
      deviceName: dev.name,
      startU,
      sizeU,
      frontImageUrl: dev.frontImageUrl,
      backImageUrl: dev.backImageUrl,
    });
    cursor -= sizeU;
  });
  return slots;
}

export function getStoredSlots(rackId) {
  return store[rackId];
}

// Real racks start with an empty slot list (not the 3-device demo pattern
// below) -- see buildDefaultSlots' own comment for why it's kept around.
function emptySlots() {
  return [];
}

export function setStoredSlots(rackId, slots) {
  store[rackId] = slots;
  return slots;
}

export function upsertStoredSlot(rackId, slot, totalUnitsU = 42) {
  const list = store[rackId] ? [...store[rackId]] : emptySlots(totalUnitsU);
  const idx = list.findIndex((s) => s.id === slot.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...slot };
  else list.push(slot);
  store[rackId] = list;
  return list;
}

export function removeStoredSlot(rackId, slotId, totalUnitsU = 42) {
  const list = store[rackId] ? [...store[rackId]] : emptySlots(totalUnitsU);
  const next = list.filter((s) => s.id !== slotId);
  store[rackId] = next;
  return next;
}
