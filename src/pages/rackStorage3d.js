// ── STORAGE view: what is actually in each rack, U by U ──────────────────
//
// The header's Storage toggle paints every cabinet with its real occupancy
// rather than its looks: which rack units hold something, which are spare,
// and which are spoken for. A rack nobody has filled reads solid green; a
// rack with no room left reads solid red; anything in between reads as the
// bands it really is, which is the whole point -- "we have 14 racks free" is
// almost never the useful number, "we have 180U free, but only 6U of it is
// contiguous" is.
//
// Slot data is the same list the rack face uses:
//   [{ id, deviceId, deviceName, startU, sizeU, ... }]
// with startU measured from the BOTTOM of the rack. A slot may additionally
// carry reserved:true (or status/state === "reserved") for space that is
// allocated but not yet filled -- the mock store has no such flag today, so
// nothing renders blue until the backend starts sending one.

export const STORAGE_STATE = {
  free: { key: "free", label: "Free", hex: "#22c55e", color: 0x22c55e },
  used: { key: "used", label: "Occupied", hex: "#ef4444", color: 0xef4444 },
  reserved: { key: "reserved", label: "Reserved", hex: "#3b82f6", color: 0x3b82f6 },
};

// A free-text label (Rack Elevation -> "Add label") whose name is
// "Reserved" -- any case, optionally followed by a note such as
// "Reserved - Client X" or "reserved: DB servers" -- also counts as
// reserved space, so it paints blue in the Storage view.
const RESERVED_LABEL_RE = /^\s*reserved\b/i;

const isReserved = (slot) =>
  slot?.reserved === true || slot?.status === "reserved" || slot?.state === "reserved" ||
  (!slot?.deviceId && RESERVED_LABEL_RE.test(slot?.deviceName || ""));

/**
 * Fold a slot list into one state per rack unit, then into contiguous runs.
 *
 * Slots are clamped and allowed to overlap (a bad import, or a device being
 * moved) -- last writer wins per unit rather than throwing, because a
 * storage view that refuses to draw is less useful than one that draws what
 * it was given.
 *
 * @returns {{ runs: Array<{startU:number,sizeU:number,state:string}>,
 *             usedU:number, reservedU:number, freeU:number, totalU:number,
 *             largestFreeRunU:number, full:boolean, empty:boolean }}
 */
export function computeRackOccupancy(slots, totalUnitsU) {
  const total = Math.max(0, Math.floor(totalUnitsU || 0));
  const units = new Array(total).fill("free");

  (slots || []).forEach((slot) => {
    const sizeU = Math.max(1, Math.min(Math.floor(slot?.sizeU || 1), total));
    const startU = Math.max(0, Math.min(Math.floor(slot?.startU || 0), total - sizeU));
    const state = isReserved(slot) ? "reserved" : "used";
    for (let u = startU; u < startU + sizeU && u < total; u++) units[u] = state;
  });

  const runs = [];
  let usedU = 0, reservedU = 0, largestFreeRunU = 0;
  for (let u = 0; u < total;) {
    const state = units[u];
    let n = 1;
    while (u + n < total && units[u + n] === state) n++;
    runs.push({ startU: u, sizeU: n, state });
    if (state === "used") usedU += n;
    else if (state === "reserved") reservedU += n;
    else largestFreeRunU = Math.max(largestFreeRunU, n);
    u += n;
  }

  const freeU = total - usedU - reservedU;
  return {
    runs, usedU, reservedU, freeU, totalU: total, largestFreeRunU,
    full: total > 0 && freeU === 0,
    empty: total > 0 && usedU === 0 && reservedU === 0,
  };
}

/** Roll several racks' occupancy into one floor-wide tally. */
export function summariseStorage(perRack) {
  return perRack.reduce((acc, o) => ({
    racks: acc.racks + 1,
    totalU: acc.totalU + o.totalU,
    usedU: acc.usedU + o.usedU,
    reservedU: acc.reservedU + o.reservedU,
    freeU: acc.freeU + o.freeU,
    fullRacks: acc.fullRacks + (o.full ? 1 : 0),
    emptyRacks: acc.emptyRacks + (o.empty ? 1 : 0),
    largestFreeRunU: Math.max(acc.largestFreeRunU, o.largestFreeRunU),
  }), { racks: 0, totalU: 0, usedU: 0, reservedU: 0, freeU: 0, fullRacks: 0, emptyRacks: 0, largestFreeRunU: 0 });
}

// One material per state, shared by every band on every rack -- a floor of
// 200 cabinets is then three materials, not six hundred.
const matCache = new Map();
function bandMaterial(THREE, state) {
  let m = matCache.get(state);
  if (!m) {
    const meta = STORAGE_STATE[state] || STORAGE_STATE.free;
    m = new THREE.MeshBasicMaterial({
      color: meta.color,
      transparent: true,
      opacity: state === "free" ? 0.55 : 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    m.userData.isSharedStorageMat = true;
    matCache.set(state, m);
  }
  return m;
}

/**
 * Build the coloured band stack for one rack.
 *
 * Bands sit just proud of the front and back faces rather than replacing the
 * cabinet, so the rack still reads as a rack and the occupancy reads as an
 * overlay on it. Returns null for a rack with no units to show.
 */
export function createRackStorageOverlay(THREE, { width, depth, totalHeightM, occupancy }) {
  if (!occupancy || !occupancy.totalU) return null;

  const group = new THREE.Group();
  group.name = "RackStorageOverlay";
  group.userData.isRackStorageOverlay = true;

  const unitH = totalHeightM / occupancy.totalU;
  const w = Math.max(0.02, width * 0.82);
  const zFront = depth / 2 + 0.014;
  const zBack = -(depth / 2 + 0.014);

  occupancy.runs.forEach((run) => {
    // A hair of air between bands so a 1U device next to another 1U device
    // still reads as two units rather than one taller block.
    const h = Math.max(0.006, run.sizeU * unitH - 0.006);
    const y = -totalHeightM / 2 + run.startU * unitH + (run.sizeU * unitH) / 2;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = bandMaterial(THREE, run.state);

    const front = new THREE.Mesh(geo, mat);
    front.position.set(0, y, zFront);
    front.userData.storageRun = run;
    group.add(front);

    const back = new THREE.Mesh(geo, mat);
    back.position.set(0, y, zBack);
    back.rotation.y = Math.PI;
    back.userData.storageRun = run;
    group.add(back);
  });

  return group;
}

/** Free the per-rack geometry. The three band materials are shared, so they stay. */
export function disposeRackStorageOverlay(group) {
  if (!group) return;
  group.parent?.remove(group);
  group.traverse((o) => {
    o.geometry?.dispose?.();
    if (o.material && !o.material.userData?.isSharedStorageMat) o.material.dispose?.();
  });
}
