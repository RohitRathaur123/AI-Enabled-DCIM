// ═══════════════════════════════════════════════════════════════════════════
// PLACEMENT ENGINE — single source of truth for the 600mm raised-floor grid.
//
// Every consumer (drag-from-Toolbox ghost, click-to-place ghost, existing
// device move/rotate/duplicate, right-click perforated tiles, room drawing)
// MUST go through these functions instead of re-deriving tile math locally.
// This mirrors (and preserves the exact behavior of) the tile helpers that
// already lived inline in Datacenter3dview.jsx — they are re-exported here
// verbatim so nothing about existing placement/snap behavior changes.
// ═══════════════════════════════════════════════════════════════════════════

// Raised-floor access tile: standard 600mm x 600mm. Never approximate this.
export const TILE_SIZE_MM = 600;
export const TILE_SIZE_M = TILE_SIZE_MM * 0.001; // 0.6

export const PLACEMENT_REASONS = {
  OK: "OK",
  OUTSIDE_BUILDING: "OUTSIDE_BUILDING",
  OUTSIDE_ROOM: "OUTSIDE_ROOM",
  OVERLAPPING_DEVICE: "OVERLAPPING_DEVICE",
  OVERLAPPING_WALL: "OVERLAPPING_WALL",
  CORRIDOR_BLOCKED: "CORRIDOR_BLOCKED",
  RESERVED_TILE: "RESERVED_TILE",
  INVALID_FOOTPRINT: "INVALID_FOOTPRINT",
};

export const PLACEMENT_REASON_LABELS = {
  OUTSIDE_BUILDING: "Outside the building floor",
  OUTSIDE_ROOM: "Outside the room boundary",
  OVERLAPPING_DEVICE: "Tile occupied by another device",
  OVERLAPPING_WALL: "Overlaps a wall",
  OVERLAPPING_ROOM: "Overlaps another room/corridor",
  DEVICE_WOULD_BE_OUTSIDE: "Would leave a device outside the room",
  CORRIDOR_BLOCKED: "Corridor path is blocked",
  RESERVED_TILE: "Reserved — perforated floor tile or entrance clearance",
  INVALID_FOOTPRINT: "Invalid device footprint",
};

// ── mm-first helpers ──────────────────────────────────────────────────────
export const mmToM = (mm) => (mm || 0) * 0.001;
export const mToMm = (m) => Math.round((m || 0) * 1000);

// Length/width in mm -> how many 600mm tiles this device reserves.
// 600×1000mm -> 1×2 tiles (600×1200mm reserved). Physical dims are kept
// separate from the reserved tile footprint (see DEVICE_TYPES/deviceModel).
export function getFootprintTiles(dimsMm) {
  const tilesX = Math.max(1, Math.ceil((dimsMm?.length || TILE_SIZE_MM) / TILE_SIZE_MM));
  const tilesZ = Math.max(1, Math.ceil((dimsMm?.width || TILE_SIZE_MM) / TILE_SIZE_MM));
  return {
    tilesX,
    tilesZ,
    reservedWidthMm: tilesX * TILE_SIZE_MM,
    reservedDepthMm: tilesZ * TILE_SIZE_MM,
  };
}

// 90°/270° rotation swaps the footprint's X/Z tile counts.
export function rotateFootprint({ tilesX, tilesZ }) {
  return { tilesX: tilesZ, tilesZ: tilesX };
}

// Which single tile does this world point fall on? Use this for anything
// that IS one tile (a perforated tile pick, a bounds corner) -- NOT for
// positioning a device footprint. See worldToAnchorTile below for that.
export function worldToTile(x, z, originX, originZ) {
  return {
    tx: Math.floor((x - originX) / TILE_SIZE_M),
    tz: Math.floor((z - originZ) / TILE_SIZE_M),
  };
}

// Anchor tile for a tilesX × tilesZ footprint dropped AT (x, z).
//
// The point the user is aiming at is the CENTRE of the device, not its
// front-left corner. Using worldToTile here (as this used to) made the block
// grow away from the cursor toward +X/+Z, so a 1×2 server rack landed half a
// footprint -- effectively a whole tile -- past where it was dropped, and
// changing the L×W in the dimension modal slid an already-positioned device
// sideways because the corner stayed put while the block grew around it.
//
// Centring instead: subtract half the block, then round rather than floor so
// the footprint snaps to the nearest grid position rather than always biasing
// one way. For an odd tile count this lands the cursor's own tile in the
// middle; for an even one it snaps to the nearer tile boundary, which is the
// closest a 2-tile block can physically sit to the cursor.
export function worldToAnchorTile(x, z, originX, originZ, tilesX = 1, tilesZ = 1) {
  return {
    tx: Math.round((x - originX) / TILE_SIZE_M - tilesX / 2),
    tz: Math.round((z - originZ) / TILE_SIZE_M - tilesZ / 2),
  };
}

export function tileAnchorToWorldCenter(tx, tz, tilesX, tilesZ, originX, originZ) {
  return {
    x: originX + (tx + tilesX / 2) * TILE_SIZE_M,
    z: originZ + (tz + tilesZ / 2) * TILE_SIZE_M,
  };
}

export function tileKeysForBlock(tx, tz, tilesX, tilesZ) {
  const keys = [];
  for (let i = 0; i < tilesX; i++) {
    for (let j = 0; j < tilesZ; j++) {
      keys.push(`${tx + i},${tz + j}`);
    }
  }
  return keys;
}

// Spiral-search outward from the requested anchor tile for the nearest
// block of tilesX × tilesZ tiles that is entirely free (or already owned
// by `excludeId`, so a device doesn't block itself while being re-placed).
// Falls back to the original anchor (allowing overlap) if nothing free is
// found within a generous search radius, so placement never silently fails.
export function findFreeTileAnchor(occupiedTiles, tx0, tz0, tilesX, tilesZ, excludeId, reservedTiles) {
  const maxR = 25;
  for (let r = 0; r <= maxR; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const tx = tx0 + dx, tz = tz0 + dz;
        const keys = tileKeysForBlock(tx, tz, tilesX, tilesZ);
        const free = keys.every((k) => (!occupiedTiles.has(k) || occupiedTiles.get(k) === excludeId) && !(reservedTiles && reservedTiles.has(k)));
        if (free) return { tx, tz, keys };
      }
    }
  }
  return { tx: tx0, tz: tz0, keys: tileKeysForBlock(tx0, tz0, tilesX, tilesZ) };
}

export function isFootprintAvailable(occupiedTiles, tx, tz, tilesX, tilesZ, excludeId) {
  const keys = tileKeysForBlock(tx, tz, tilesX, tilesZ);
  return keys.every((k) => !occupiedTiles.has(k) || occupiedTiles.get(k) === excludeId);
}

export function reserveTiles(occupiedTiles, keys, deviceId) {
  keys.forEach((k) => occupiedTiles.set(k, deviceId));
}

export function releaseTiles(occupiedTiles, deviceId) {
  occupiedTiles.forEach((v, k) => {
    if (v === deviceId) occupiedTiles.delete(k);
  });
}

// Full placement validation with a machine-readable reason, so the ghost
// preview / drop handlers can show *why* a spot is red instead of just
// refusing silently. `bounds` (in tile units, inclusive) is optional and
// represents the building's placeable tile range.
// `reservedTiles` (optional Set<"tx,tz">) marks tiles that aren't owned by
// any device but still can't be built on — perforated raised-floor tiles
// and the main entrance's walk-through clearance are the two current
// sources. Checked before device-overlap so the reason reported is the
// more specific/accurate one.
export function canPlaceDevice({ occupiedTiles, tx, tz, tilesX, tilesZ, excludeId, bounds, reservedTiles }) {
  if (!Number.isFinite(tx) || !Number.isFinite(tz) || tilesX < 1 || tilesZ < 1) {
    return { valid: false, reason: PLACEMENT_REASONS.INVALID_FOOTPRINT, tx, tz, tilesX, tilesZ };
  }
  if (bounds) {
    const maxTx = tx + tilesX - 1;
    const maxTz = tz + tilesZ - 1;
    if (tx < bounds.minTx || tz < bounds.minTz || maxTx > bounds.maxTx || maxTz > bounds.maxTz) {
      return { valid: false, reason: PLACEMENT_REASONS.OUTSIDE_BUILDING, tx, tz, tilesX, tilesZ };
    }
  }
  const keys = tileKeysForBlock(tx, tz, tilesX, tilesZ);
  if (reservedTiles) {
    const reservedBlocker = keys.find((k) => reservedTiles.has(k));
    if (reservedBlocker) {
      return {
        valid: false,
        reason: PLACEMENT_REASONS.RESERVED_TILE,
        blockingKey: reservedBlocker,
        tx, tz, tilesX, tilesZ, keys,
      };
    }
  }
  const blocker = keys.find((k) => occupiedTiles.has(k) && occupiedTiles.get(k) !== excludeId);
  if (blocker) {
    return {
      valid: false,
      reason: PLACEMENT_REASONS.OVERLAPPING_DEVICE,
      blockingDeviceId: occupiedTiles.get(blocker),
      tx, tz, tilesX, tilesZ, keys,
    };
  }
  return { valid: true, reason: PLACEMENT_REASONS.OK, tx, tz, tilesX, tilesZ, keys };
}

// Resolve a requested world-space drop point into a final tile anchor,
// honoring the "exact -> nearest valid (if autoCorrect) -> reject" priority
// described in the product spec. Returns { accepted, tx, tz, keys, reason }.
export function resolvePlacement({ occupiedTiles, worldX, worldZ, tilesX, tilesZ, originX, originZ, excludeId, bounds, autoCorrect = true, reservedTiles }) {
  const { tx: tx0, tz: tz0 } = worldToAnchorTile(worldX, worldZ, originX, originZ, tilesX, tilesZ);
  const exact = canPlaceDevice({ occupiedTiles, tx: tx0, tz: tz0, tilesX, tilesZ, excludeId, bounds, reservedTiles });
  if (exact.valid) return { accepted: true, tx: tx0, tz: tz0, keys: exact.keys, reason: PLACEMENT_REASONS.OK };
  if (!autoCorrect) return { accepted: false, tx: tx0, tz: tz0, reason: exact.reason };
  const { tx, tz, keys } = findFreeTileAnchor(occupiedTiles, tx0, tz0, tilesX, tilesZ, excludeId, reservedTiles);
  // findFreeTileAnchor only checks tile occupancy, not the building bounds
  // (it has no concept of the building shell) — re-validate its result so
  // auto-correct can never silently walk a device outside the floor.
  const corrected = canPlaceDevice({ occupiedTiles, tx, tz, tilesX, tilesZ, excludeId, bounds, reservedTiles });
  if (!corrected.valid) return { accepted: false, tx: tx0, tz: tz0, reason: corrected.reason };
  return { accepted: true, tx, tz, keys, reason: PLACEMENT_REASONS.OK, corrected: tx !== tx0 || tz !== tz0 };
}
