// ── Data-access layer for the "real device image" rack view ─────────────
// PHASE: STATIC / MOCK.
//
// Every function below returns local, hardcoded data wrapped in a Promise
// so call sites already look and behave exactly like a real API call.
// When the backend endpoints are ready, only the BODIES of these 3
// functions need to change (to axiosInstance calls) — RackRealFace.js,
// Datacenter3dview.jsx, DCIMViewer.jsx and the future assignment panel
// only ever call these 3 functions, never the mock files directly, so
// nothing outside this file needs to change.

import { DEVICE_IMAGE_LIBRARY } from "./deviceImageLibrary";
import {
  getStoredSlots, setStoredSlots, upsertStoredSlot, removeStoredSlot,
} from "./rackSlotAssignments.mock";
import {
  allCords, cordsTouchingRack, getCord, putCord, deleteCord, nextCordId,
  getKnownSlots, setKnownSlots,
} from "./rackPatchCords.mock";


export async function getDeviceImageLibrary() {
  // TODO(backend): return (await axiosInstance.get("/api/rack-device-images")).data;
  return Promise.resolve(DEVICE_IMAGE_LIBRARY);
}

export async function getRackSlotAssignments(rackId, totalUnitsU = 42) {
  // TODO(backend): return (await axiosInstance.get(`/api/racks/${rackId}/slot-assignments`)).data;
  void totalUnitsU; // kept for API-shape parity with the eventual backend call
  const saved = getStoredSlots(rackId);
  return Promise.resolve(saved || []);
}

export async function saveRackSlotAssignment(rackId, slot, totalUnitsU = 42) {
  // TODO(backend): return (await axiosInstance.post(`/api/racks/${rackId}/slot-assignments`, slot)).data;
  const updated = upsertStoredSlot(rackId, slot, totalUnitsU);
  console.log("[rackDeviceService] (mock) saved slot assignment for rack", rackId, slot);
  return Promise.resolve(updated);
}

// ── Patch cords: every individual cable in a rack's RACK VIEW ───────────
// Synchronous on purpose -- RACK VIEW redraws from these inside a frame and
// while a cable is being carried around.
// TODO(backend): back these with /api/patch-cords and keep this object as
// the local cache the 3D view reads from.
export const patchCordStore = {
  all: allCords,
  forRack: cordsTouchingRack,
  get: getCord,
  save: putCord,
  remove: deleteCord,
  newId: nextCordId,
  knownSlots: getKnownSlots,
  setKnownSlots,
};

// DEMO ONLY -- the "Ideal datacenter" floor seeds what is inside each of its
// racks through here. A rack that already has slots (edited in the Rack
// Elevation dialog, or loaded before) is left exactly as it is.
// TODO(backend): not needed once racks come with their slots from the API.
export function seedRackSlotAssignments(rackId, slots) {
  if (getStoredSlots(rackId)) return getStoredSlots(rackId);
  return setStoredSlots(rackId, slots);
}

export async function removeRackSlotAssignment(rackId, slotId, totalUnitsU = 42) {
  // TODO(backend): return (await axiosInstance.delete(`/api/racks/${rackId}/slot-assignments/${slotId}`)).data;
  const updated = removeStoredSlot(rackId, slotId, totalUnitsU);
  console.log("[rackDeviceService] (mock) removed slot assignment for rack", rackId, slotId);
  return Promise.resolve(updated);
}
