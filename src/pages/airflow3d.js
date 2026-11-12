// ═══════════════════════════════════════════════════════════════════════════
// airflow3d.js
// ---------------------------------------------------------------------------
// Hot-aisle / cold-aisle visualisation for the 3D floor.
//
// WHAT THIS DRAWS, AND WHY IT IS SO LITTLE
//
// The earlier version drew the whole cooling circuit literally: a chevron
// curtain on every rack front, a plume on every back, ducts running from the
// hot aisles back to each CRAC's intake, and an arrowhead travelling along
// every one of them. It was accurate and it was unreadable -- a floor of
// forty cabinets became a thicket of arrows with the actual layout lost
// behind it, and the return ducts in particular read as physical pipework
// that does not exist in a raised-floor room.
//
// What a floor plan actually needs to answer is one question: WHERE are the
// hot aisles and WHERE are the cold ones. So that is all this draws now --
// the aisles themselves, as flat bands of colour on the floor:
//
//   * light blue in front of the rack doors  -- cold aisle, air coming up
//   * light red  behind the rack backs       -- hot aisle, exhaust
//
// plus a small column of rising arrows per row for direction. Nothing else.
//
// THE ARROWS
//
// Plain solid block arrows -- a shaft and a head, the shape anyone would
// draw -- and small: about a sixth of a cabinet's height. They are not one
// long gradient stream but SEVERAL separate arrows climbing one after
// another, and each is a flat colour picked from the temperature at ITS OWN
// height. That is the whole idea: the arrow low down in front of the doors is
// deep blue because the air there really is cold, the one two thirds of the
// way up may already be light red because that air has picked up rack heat,
// and in a well cooled aisle the whole column stays blue. The colour is the
// reading, not decoration.
//
//   cold  climbs straight up in front of the cabinet doors, off the
//         perforated tiles that feed them.
//   hot   leaves the cabinet BACK face, bends upward and climbs away.
//
// Every arrow fades in at the root and out at the top, then restarts at the
// bottom, so the column reads as continuous flow. Temperature comes from
// `sampleTempC(x, y, z)`, which the caller supplies: it reads placed
// temperature devices where they exist and falls back to the computed
// thermal field where they do not.
//
// Bands are built per rack row, not per rack, so a row reads as one
// continuous aisle. Two rows facing each other both paint the aisle between
// them -- and because rows that share an aisle always face it the same way
// (fronts to a cold aisle, backs to a hot one), the overlap is always the
// same colour and simply reads as a slightly deeper band. That is why no
// merging step is needed.
//
// Directional geometry comes from the racks themselves: a rack's door is its
// local +Z face, so a rack rotated by ry faces (sin ry, 0, cos ry). Rotate a
// rack in the UI and its aisles follow.
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from "three";

const COLD_RGB = [56, 189, 248];   // #38bdf8
const HOT_RGB  = [244, 70, 45];    // #f4462d

// How far out from the rack face an aisle band reaches. A cold aisle is
// conventionally two 600 mm tiles and a hot aisle one to two, so this sits
// where the real aisle sits rather than flooding the room.
const AISLE_DEPTH = 1.25;
// Rows are grouped by which line their faces sit on; this is how far apart
// two racks' faces can be and still count as the same row.
const ROW_TOLERANCE = 0.75;
// Bands shorter than this get one arrow, longer ones get two. Set well past
// a normal row length on purpose: one arrow per row means two per aisle
// (one from each row facing it), which is as many as the floor plan can
// carry before the arrows start competing with the layout for attention.
const TWO_ARROW_LENGTH = 14;

// ── Band texture ──────────────────────────────────────────────────────────
// A soft-edged strip: solid through the middle, fading out at both edges so
// the band reads as a pool of air rather than a hard painted rectangle.
const texCache = new Map();
function aisleTexture(rgb) {
  const key = rgb.join(",");
  let tex = texCache.get(key);
  if (tex) return tex;

  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d");
  const [r, g, b] = rgb;
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0.0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.28, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(0.72, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  texCache.set(key, tex);
  return tex;
}

const matCache = new Map();
function aisleMaterial(rgb, opacity) {
  const key = `${rgb.join(",")}|${opacity}`;
  let m = matCache.get(key);
  if (m) return m;
  m = new THREE.MeshBasicMaterial({
    map: aisleTexture(rgb),
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  m.userData.isSharedAisleMat = true;
  matCache.set(key, m);
  return m;
}

/** Direction a rack's door faces. Local +Z is the front face. */
function facing(ry) {
  return { x: Math.sin(ry), z: Math.cos(ry) };
}

/**
 * Group rack faces into rows.
 *
 * Two racks belong to the same row when they face the same way AND their
 * faces lie on the same line across the room. That is exactly: same facing
 * direction, and the same distance along that direction. Racks then vary
 * only along the perpendicular, which gives the band its length.
 *
 * @param side  +1 for the door side (cold), -1 for the back (hot)
 * @returns Array<{ nx, nz, tx, tz, edge, minT, maxT }>
 */
function groupRowsByFace(racks, side) {
  const rows = new Map();

  racks.forEach((r) => {
    const f = facing(r.ry);
    // Outward normal of the face we are standing in front of.
    const nx = f.x * side, nz = f.z * side;
    // Perpendicular, in plan -- the direction the row runs along.
    const tx = -nz, tz = nx;

    // How far out this rack's face is, measured along its own normal.
    const edge = r.x * nx + r.z * nz + r.d / 2;
    // Where the rack sits along the row.
    const along = r.x * tx + r.z * tz;

    // Quantising both the heading and the edge distance is what merges a row
    // of cabinets into one band while keeping a row on the far side of the
    // room, or one facing another way, separate.
    const key = [
      Math.round(Math.atan2(nz, nx) / (Math.PI / 12)),
      Math.round(edge / ROW_TOLERANCE),
    ].join("|");

    let row = rows.get(key);
    if (!row) {
      row = { nx, nz, tx, tz, edge, minT: Infinity, maxT: -Infinity, count: 0, maxH: 0 };
      rows.set(key, row);
    }
    row.minT = Math.min(row.minT, along - r.w / 2);
    row.maxT = Math.max(row.maxT, along + r.w / 2);
    row.edge = Math.max(row.edge, edge);
    row.maxH = Math.max(row.maxH, r.h || 2);
    row.count++;
  });

  return [...rows.values()];
}

/** A flat band lying on the floor in front of one row. */
function buildBand(row, rgb, y, opacity) {
  const length = row.maxT - row.minT;
  if (!(length > 0.05)) return null;

  const geo = new THREE.PlaneGeometry(length, AISLE_DEPTH);
  const mesh = new THREE.Mesh(geo, aisleMaterial(rgb, opacity));

  // Centre of the band: mid-way along the row, and half the aisle depth out
  // from the rack faces.
  const midT = (row.minT + row.maxT) / 2;
  const out = row.edge + AISLE_DEPTH / 2;
  mesh.position.set(
    row.tx * midT + row.nx * out,
    y,
    row.tz * midT + row.nz * out,
  );
  // Lay it flat, then spin it so its long axis runs along the row.
  mesh.rotation.set(-Math.PI / 2, 0, 0);
  mesh.rotation.z = -Math.atan2(row.tz, row.tx);
  mesh.renderOrder = 2;
  return { mesh, length, midT, out };
}

// ── Temperature -> colour ramp ────────────────────────────────────────────
// Deep blue where the air is genuinely cold, through pale blue as it mixes,
// into light red once it has picked up rack heat. The same ramp is used for
// both aisles: a hot-aisle arrow is red because the air in it IS hot, not
// because it was drawn red.
// The first stop is pinned to supply temperature on purpose: air straight off
// a perforated tile should read as the deepest blue on the ramp, not as a
// midpoint between two stops.
const TEMP_RAMP = [
  { c: 18, rgb: [ 29,  78, 216] },   // deep blue  — cold air off the tile
  { c: 22, rgb: [ 56, 189, 248] },   // cyan
  { c: 26, rgb: [186, 230, 253] },   // pale blue  — mixing
  { c: 30, rgb: [253, 186, 186] },   // light red  — warming
  { c: 36, rgb: [239,  68,  68] },   // red        — exhaust
];

function tempToRgb(c) {
  if (c <= TEMP_RAMP[0].c) return TEMP_RAMP[0].rgb;
  const last = TEMP_RAMP[TEMP_RAMP.length - 1];
  if (c >= last.c) return last.rgb;
  for (let i = 1; i < TEMP_RAMP.length; i++) {
    const a = TEMP_RAMP[i - 1], b = TEMP_RAMP[i];
    if (c > b.c) continue;
    const f = (c - a.c) / (b.c - a.c);
    return [0, 1, 2].map((k) => Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * f));
  }
  return last.rgb;
}

/** Piecewise-linear lookup over [[u, value], ...] with u ascending. */
function rampAt(stops, u) {
  if (u <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (u >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    const [ua, va] = stops[i - 1], [ub, vb] = stops[i];
    if (u > ub) continue;
    return va + (vb - va) * ((u - ua) / (ub - ua));
  }
  return last[1];
}

// How opaque an arrow is at each point of the climb. It fades IN off the tile
// or the cabinet back so it does not pop into existence, holds through the
// middle, and fades to nothing at the top -- the "air has mixed away" end,
// which is also what hides the restart at the bottom.
const ALPHA_STOPS = [[0, 0], [0.09, 0.95], [0.55, 0.92], [0.75, 0.72], [0.92, 0.25], [1, 0]];

// ── The arrow itself ──────────────────────────────────────────────────────
// Small: 0.34 m against a 2 m cabinet. Proportions are the ones a person
// draws freehand -- a squat head about 40% of the length, a shaft half the
// head's width.
const ARROW_H = 0.34;
const ARROW_SHAFT_W = 0.115;
const ARROW_HEAD_W = 0.26;
const ARROW_HEAD_H = 0.145;
const ARROW_DEPTH = 0.07;
// How many arrows are climbing one path at once, evenly spread around the
// loop so one is always low, one mid and one high -- which is what lets the
// three different temperatures be read side by side.
const ARROWS_PER_STREAM = 3;
// Loops per second. Slow: this is a diagram indicating a direction, not a
// particle being fired up the aisle.
const CLIMB_SPEED = { cold: 0.22, hot: 0.26 };
// Resolution of the colour/alpha lookup each climbing arrow reads its own
// appearance from, sampled once at build time from the stream's own
// temperatures.
const LUT_N = 48;

// One shared geometry for every arrow on the floor: they differ only in
// colour, opacity and where they are, none of which touches the vertices.
let arrowGeoCache = null;
function blockArrowGeometry() {
  if (arrowGeoCache) return arrowGeoCache;
  const half = ARROW_H / 2;
  const sw = ARROW_SHAFT_W / 2;
  const hw = ARROW_HEAD_W / 2;
  const neck = -half + (ARROW_H - ARROW_HEAD_H);   // where the shaft meets the head

  const shape = new THREE.Shape();
  shape.moveTo(-sw, -half);
  shape.lineTo(sw, -half);
  shape.lineTo(sw, neck);
  shape.lineTo(hw, neck);
  shape.lineTo(0, half);
  shape.lineTo(-hw, neck);
  shape.lineTo(-sw, neck);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: ARROW_DEPTH, bevelEnabled: false });
  // Centre it on the extrusion axis too, so the arrow rotates about its own
  // middle rather than swinging around one face.
  geo.translate(0, 0, -ARROW_DEPTH / 2);
  arrowGeoCache = geo;
  return geo;
}

/**
 * The colour and opacity an arrow should have at any point of the climb,
 * sampled once from the stream's own temperatures.
 *
 * Sampling per frame would mean re-running the thermal probe dozens of times
 * a tick for an answer that only changes when the floor does, so it is cached
 * here as a plain array the updater interpolates.
 */
function buildClimbLut(curve, temp, facing) {
  const lut = [];
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const ax = new THREE.Vector3();
  const az = new THREE.Vector3();
  const basis = new THREE.Matrix4();

  for (let i = 0; i < LUT_N; i++) {
    const u = i / (LUT_N - 1);
    curve.getPointAt(u, p);
    const [r, g, b] = tempToRgb(temp(p.x, p.y, p.z));

    // Orientation is baked here too. It used to be worked out per frame from
    // curve.getTangentAt(), which walks the arc-length table and allocates
    // three vectors per call — on every arrow, every frame. The path never
    // moves, so the answer never changes: sample it once.
    curve.getTangentAt(u, tan).normalize();
    az.copy(facing).addScaledVector(tan, -facing.dot(tan));
    if (az.lengthSq() < 1e-6) az.set(0, 0, 1); else az.normalize();
    ax.crossVectors(tan, az).normalize();
    basis.makeBasis(ax, tan, az);

    lut.push({
      r: r / 255, g: g / 255, b: b / 255, a: rampAt(ALPHA_STOPS, u),
      pos: p.clone(),
      quat: new THREE.Quaternion().setFromRotationMatrix(basis),
    });
  }
  return lut;
}

// Scratch for readLut — one object reused for every arrow, every frame, so
// the update pass allocates nothing at all.
const LUT_HIT = { r: 0, g: 0, b: 0, a: 0, lo: null, hi: null, k: 0 };

/** Linear read out of a climb LUT at u in 0..1. */
function readLut(lut, u) {
  const f = Math.min(1, Math.max(0, u)) * (lut.length - 1);
  const i = Math.floor(f);
  const a = lut[i], b = lut[Math.min(lut.length - 1, i + 1)];
  const k = f - i;
  LUT_HIT.r = a.r + (b.r - a.r) * k;
  LUT_HIT.g = a.g + (b.g - a.g) * k;
  LUT_HIT.b = a.b + (b.b - a.b) * k;
  LUT_HIT.a = a.a + (b.a - a.a) * k;
  LUT_HIT.lo = a; LUT_HIT.hi = b; LUT_HIT.k = k;
  return LUT_HIT;
}

/**
 * The column of climbing arrows for one row.
 *
 * @param side  +1 cold (in front of the doors), -1 hot (behind the backs)
 */
function buildArrows(row, band, floorY, group, side, sampleTempC, arrows) {
  const n = band.length >= TWO_ARROW_LENGTH ? 2 : 1;
  const rackH = Math.min(2.2, Math.max(1.2, row.maxH || 2));
  const cold = side === 1;
  // The sampler is told which stream it is being asked about: air leaving a
  // perforated tile starts at supply temperature and air leaving a cabinet
  // back starts at exhaust temperature, and neither is what a room-mixed
  // field alone would say about that point.
  const temp = (x, y, z) => sampleTempC(x, y, z, cold ? "cold" : "hot");
  const geo = blockArrowGeometry();

  for (let i = 0; i < n; i++) {
    // Spread the columns along the band rather than stacking them at its centre.
    const frac = n === 1 ? 0.5 : (i + 1) / (n + 1);
    const t = row.minT + (row.maxT - row.minT) * frac;

    // `nx/nz` points OUT of the rack face. A cold column stands just in front
    // of the cabinet doors, over the tiles that feed them; a hot one starts
    // ON the cabinet back.
    const out0 = cold ? Math.min(band.out, row.edge + 0.3) : row.edge + 0.06;
    const bx = row.tx * t + row.nx * out0;
    const bz = row.tz * t + row.nz * out0;
    const at = (d, y) => new THREE.Vector3(
      bx + row.nx * d, floorY + y, bz + row.nz * d,
    );

    // Cold goes straight up the front of the cabinets, which is both what the
    // air does and what makes the arrows read as one legible column. Hot
    // comes OUT of the back first, then bends up and climbs away.
    const pts = cold
      ? [at(0, 0.06), at(0, 0.5), at(0, 0.94), at(0, 1.38)]
      : [at(0.04, rackH * 0.45), at(0.3, rackH * 0.52), at(0.46, rackH * 0.84), at(0.52, rackH * 1.18)];
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.25);
    // The updater calls getPointAt every frame, which walks an arc-length
    // table; 48 divisions is plenty for a path this short and keeps that
    // walk cheap.
    curve.arcLengthDivisions = 48;

    // Which way the arrow faces: flat on to whoever is looking ACROSS the
    // aisle, which is how a rack row is always looked at. Stored per column
    // because it is the row's own outward normal.
    const facing = new THREE.Vector3(row.nx, 0, row.nz).normalize();
    const lut = buildClimbLut(curve, temp, facing);
    const speed = cold ? CLIMB_SPEED.cold : CLIMB_SPEED.hot;

    for (let k = 0; k < ARROWS_PER_STREAM; k++) {
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
      }));
      mesh.renderOrder = 4;
      mesh.userData.sharedGeo = true;   // one geometry for the whole floor
      group.add(mesh);
      arrows.push({ mesh, curve, lut, speed, facing, t: k / ARROWS_PER_STREAM });
    }
  }
}

/**
 * The temperature model used when the caller supplies none.
 *
 * Deliberately crude, and only a stand-in: floor level near the tiles is
 * cold, and air warms as it climbs and mixes with what the cabinets are
 * throwing out. Real numbers come from the caller's `sampleTempC`, which
 * reads placed temperature devices and the computed thermal field.
 */
const DEFAULT_STACK_GAIN_C = 9;
const DEFAULT_MIX_HEIGHT_M = 1.3;
const defaultSampleTempC = (floorY) => (_x, y) => {
  const h = Math.min(1, Math.max(0, (y - floorY) / DEFAULT_MIX_HEIGHT_M));
  return 18 + DEFAULT_STACK_GAIN_C * h;
};

/**
 * createAirflowSystem — the hot and cold aisles, and nothing else.
 *
 * `coolers`, `tiles` and `plenumY` are still accepted so the call site does
 * not have to change, but they are no longer drawn: the plenum run and the
 * return path to the CRAC were the parts that made this unreadable.
 *
 * @param {object}   o
 * @param {Array}    o.racks        [{ x, z, ry, w, d, h }]  w across the face, d front-to-back
 * @param {number}   o.floorY       top of the raised floor
 * @param {Function} o.sampleTempC  (x, y, z) => °C at that point in the room.
 *                                  Drives every arrow's colour and its fade.
 * @returns {THREE.Group} with userData.scrollers / .arrows for the updater
 */
export function createAirflowSystem({ racks = [], floorY = 0.3, sampleTempC } = {}) {
  const group = new THREE.Group();
  group.name = "AirflowSystem";

  const scrollers = [];   // kept for the updater's contract; nothing scrolls now
  const arrows = [];      // ditto — the indication arrows below are static
  const temp = typeof sampleTempC === "function" ? sampleTempC : defaultSampleTempC(floorY);

  if (racks.length) {
    // Hot sits a hair lower than cold so that where a hot band and a cold
    // band from different rows do cross, one wins cleanly instead of the two
    // z-fighting.
    const sides = [
      { side: +1, rgb: COLD_RGB, y: floorY + 0.016, opacity: 0.42 },
      { side: -1, rgb: HOT_RGB,  y: floorY + 0.014, opacity: 0.40 },
    ];

    sides.forEach(({ side, rgb, y, opacity }) => {
      const container = new THREE.Group();
      container.name = side === 1 ? "ColdAisleZones" : "HotAisleZones";
      groupRowsByFace(racks, side).forEach((row) => {
        const band = buildBand(row, rgb, y, opacity);
        if (!band) return;
        container.add(band.mesh);
        buildArrows(row, band, floorY, container, side, temp, arrows);
      });
      group.add(container);
    });
  }

  group.userData.scrollers = scrollers;
  group.userData.arrows = arrows;
  return group;
}

/**
 * updateAirflowSystem — call once per frame with the frame delta.
 *
 * Walks every arrow a little further up its own path, repaints it from that
 * path's temperature LUT, and turns it to stay flat on to the aisle.
 *
 * The repaint is the part that matters: an arrow is not "the blue one" or
 * "the red one", it is whatever colour the air it is currently passing
 * through happens to be. So the same arrow leaves the tile deep blue and, in
 * an aisle that is not keeping up, is light red by the time it reaches the
 * top of the cabinets -- and in an aisle that IS keeping up, it stays blue
 * the whole way. Nothing about the column is hard-coded per side.
 */

export function updateAirflowSystem(group, dt) {
  if (!group || !group.visible) return;
  const { scrollers, arrows } = group.userData;

  if (scrollers) {
    for (let i = 0; i < scrollers.length; i++) {
      const s = scrollers[i];
      if (!s.map) continue;
      if (s.axis === "x") s.map.offset.x = (s.map.offset.x + s.speed * dt) % 1;
      else s.map.offset.y = (s.map.offset.y + s.speed * dt) % 1;
    }
  }

  if (!arrows) return;
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    a.t += a.speed * dt;
    if (a.t >= 1) a.t -= Math.floor(a.t);
    const t = a.t < 0 ? a.t + 1 : a.t;

    // Everything an arrow needs at this point of the climb — where it is,
    // which way it faces, what colour the air is and how solid it reads —
    // was baked into the LUT when the stream was built. A frame is now two
    // lerps and a slerp per arrow, and allocates nothing.
    const s = readLut(a.lut, t);
    a.mesh.position.lerpVectors(s.lo.pos, s.hi.pos, s.k);
    a.mesh.quaternion.copy(s.lo.quat).slerp(s.hi.quat, s.k);
    const m = a.mesh.material;
    m.color.setRGB(s.r, s.g, s.b);
    m.opacity = s.a;
  }
}

/**
 * Free every material the system allocated.
 *
 * Two things here are deliberately NOT freed. The aisle bands share cached
 * materials and textures across rebuilds, and every arrow on the floor shares
 * one block-arrow geometry — disposing either would pull the rug out from
 * under the next rebuild, which happens on every device move. Each arrow's
 * own material is per-arrow and does go.
 */
export function disposeAirflowSystem(group) {
  if (!group) return;
  group.traverse((o) => {
    if (o.geometry && !o.userData?.sharedGeo) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((m) => {
      if (m.userData?.isSharedAisleMat) return;
      if (m.map) m.map.dispose();
      m.dispose();
    });
  });
}
