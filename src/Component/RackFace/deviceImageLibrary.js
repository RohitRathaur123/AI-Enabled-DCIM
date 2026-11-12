// ── Device image library (PHASE: STATIC / MOCK) ──────────────────────────
// This is the catalog of real device photos that can be assigned onto a
// rack's front/back face, one photo per U-slot.
//
// TODO(backend): once the Rack Device Image API exists, this array will
// instead be fetched inside rackDeviceService.getDeviceImageLibrary().
// Keep every entry's shape identical to this so nothing else has to change:
//   { id, name, category, defaultSizeU, frontImageUrl, backImageUrl, thumbnail }

import serverAFront from "../../assets/rackDevices/server-a-front.webp";
import serverABack from "../../assets/rackDevices/server-a-back.webp";
import serverBFront from "../../assets/rackDevices/server-b-front.webp";
import serverBBack from "../../assets/rackDevices/server-b-back.webp";
import serverCFront from "../../assets/rackDevices/server-c-front.webp";
import serverCBack from "../../assets/rackDevices/server-c-back.webp";

export const DEVICE_IMAGE_LIBRARY = [
  {
    id: "dev-server-a",
    name: "Rack Server — Model A (5-Bay)",
    category: "Compute",
    defaultSizeU: 2,
    frontImageUrl: serverAFront,
    backImageUrl: serverABack,
    thumbnail: serverAFront,
  },
  {
    id: "dev-server-b",
    name: "Rack Server — Model B (Dual PSU)",
    category: "Compute",
    defaultSizeU: 2,
    frontImageUrl: serverBFront,
    backImageUrl: serverBBack,
    thumbnail: serverBFront,
  },
  {
    id: "dev-server-c",
    name: "Rack Server — Model C (Expansion Chassis)",
    category: "Compute",
    defaultSizeU: 4,
    frontImageUrl: serverCFront,
    backImageUrl: serverCBack,
    thumbnail: serverCFront,
  },
];

export function findDeviceImage(deviceId) {
  return DEVICE_IMAGE_LIBRARY.find((d) => d.id === deviceId) || null;
}
