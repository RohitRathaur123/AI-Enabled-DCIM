import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { InputNumber, Select } from "antd";

const UI_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

import { deviceTier, expectsFeed } from "../dcim/chains/deploymentChains";
import { deviceLabel } from "../dcim/naming/deviceNaming";

const MARGIN_UNIT_TO_METERS = { mm: 0.001, cm: 0.01, m: 1, ft: 0.3048, in: 0.0254 };

// Mirrors the hot/cold containment palette used by the live Thermal
// Hotspot view in DataCenter3DView — orange/red = hot aisle (rack rear /
// exhaust), blue = cold aisle (rack front / intake) — so a capacity-plan
// ghost rack reads as the same design language as the running floor.
export const HOT_AISLE_HEX = 0xf97316;
export const COLD_AISLE_HEX = 0x38bdf8;

// ═══════════════════════════════════════════════════════════════════════════
// 1 · CAPACITY PREDICTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

// Per room type: the unit that gets planned into it, its real footprint, the
// clearances that unit legally needs, and the power/density envelope.
// `layout: "aisle"`   → rows arranged back-to-back with hot/cold aisles.
// `layout: "service"` → free-standing plant with clearance on all four sides.
export const CAPACITY_PROFILES = {
  server: {
    label: "Server Room", unit: "rack", units: "racks", layout: "aisle",
    footprint: { widthMm: 600, depthMm: 1100 },
    kwPerUnit: 5, coldAisleMm: 1200, hotAisleMm: 900, perimeterMm: 900,
    maxKwPerM2: 2.2, ancillary: "it",
  },
  network: {
    label: "Network Room", unit: "rack", units: "racks", layout: "aisle",
    footprint: { widthMm: 600, depthMm: 1000 },
    kwPerUnit: 3, coldAisleMm: 1200, hotAisleMm: 900, perimeterMm: 900,
    maxKwPerM2: 1.6, ancillary: "it",
  },
  storage: {
    label: "Storage Room", unit: "array", units: "storage arrays", layout: "aisle",
    footprint: { widthMm: 600, depthMm: 1200 },
    kwPerUnit: 6, coldAisleMm: 1200, hotAisleMm: 900, perimeterMm: 900,
    maxKwPerM2: 2.4, ancillary: "it",
  },
  ups: {
    label: "UPS Room", unit: "UPS module", units: "UPS modules", layout: "service",
    footprint: { widthMm: 900, depthMm: 900 },
    kwPerUnit: 0, serviceMm: 1200, perimeterMm: 1000, capacityKvaPerUnit: 200,
    ancillary: "power",
  },
  electrical: {
    label: "Electrical Room", unit: "panel", units: "switchgear panels", layout: "service",
    footprint: { widthMm: 800, depthMm: 900 },
    kwPerUnit: 0, serviceMm: 1200, perimeterMm: 1000, ancillary: "power",
  },
  ac: {
    label: "AC Unit Room", unit: "CRAC unit", units: "CRAC units", layout: "service",
    footprint: { widthMm: 1800, depthMm: 900 },
    kwPerUnit: 0, serviceMm: 1200, perimeterMm: 1000, coolingKwPerUnit: 30,
    ancillary: "cooling",
  },
  chiller: {
    label: "Chiller Room", unit: "chiller", units: "chillers", layout: "service",
    footprint: { widthMm: 2400, depthMm: 1200 },
    kwPerUnit: 0, serviceMm: 1500, perimeterMm: 1200, coolingKwPerUnit: 250,
    ancillary: "cooling",
  },
  dg: {
    label: "DG Set Room", unit: "DG set", units: "DG sets", layout: "service",
    footprint: { widthMm: 3500, depthMm: 1800 },
    kwPerUnit: 0, serviceMm: 2000, perimeterMm: 1500, genKwPerUnit: 500,
    ancillary: "power",
  },
  corridor: { label: "Corridor", nonPlaceable: true, unit: "—", units: "—" },
  custom: {
    label: "Custom Room", unit: "unit", units: "units", layout: "service",
    footprint: { widthMm: 600, depthMm: 1200 },
    kwPerUnit: 3, serviceMm: 1000, perimeterMm: 900, maxKwPerM2: 1.5, ancillary: "it",
  },
};

// Growth headroom: never plan the floor to 100% — 15% is left for churn,
// spares and the row you always end up adding late.
export const PLANNING_HEADROOM = 0.85;

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Predicts what fits in a room and why that number is what it is.
 *
 * @param {object} room             room record (width/length in metres, kw, type, innerMargins)
 * @param {number} placedCount      devices already standing inside the room
 * @param {object} tuning           per-run overrides of the profile (aisle widths, kW/unit, …)
 * @returns {object} prediction     numbers + slot geometry + warnings
 */
export function predictRoomCapacity(room, placedCount = 0, tuning = {}) {
  const base = CAPACITY_PROFILES[room.type] || CAPACITY_PROFILES.custom;
  const p = { ...base, ...tuning, footprint: { ...base.footprint, ...(tuning.footprint || {}) } };
  const areaM2 = (room.width || 0) * (room.length || 0);

  if (p.nonPlaceable) {
    return {
      profile: p, nonPlaceable: true, roomId: room.id, roomName: room.name,
      areaM2, usableAreaM2: areaM2, placedCount, planned: 0, hardMax: 0, remaining: 0,
      layout: { rows: 0, perRow: 0, aisles: 0, note: "Circulation space" },
      slots: [], candidates: [], binding: null, ancillary: [],
      warnings: [{ sev: "info", text: "Corridors are circulation space — no equipment is planned here." }],
      utilization: 0,
    };
  }

  // Inner margins are keep-clear bands the user drew inside the room, so they
  // come off the usable envelope before any clearance is applied.
  const f = MARGIN_UNIT_TO_METERS[room.margins?.unit || "m"] ?? 1;
  const im = room.innerMargins || {};
  const mLeft = (im.left || 0) * f, mRight = (im.right || 0) * f;
  const mTop = (im.top || 0) * f, mBottom = (im.bottom || 0) * f;

  const perimM = (p.perimeterMm || 900) / 1000;
  const usableW = Math.max(0, (room.width || 0) - mLeft - mRight - perimM * 2);
  const usableL = Math.max(0, (room.length || 0) - mTop - mBottom - perimM * 2);
  const usableAreaM2 = usableW * usableL;

  // The usable rectangle is recentred when the inner margins are asymmetric.
  const offsetX = (mLeft - mRight) / 2;
  const offsetZ = (mTop - mBottom) / 2;

  const uW = p.footprint.widthMm / 1000;
  const uD = p.footprint.depthMm / 1000;

  const rowZ = [];
  const colX = [];
  let aisles = 0;
  let note = "";

  if (p.layout === "aisle") {
    const cold = (p.coldAisleMm ?? 1200) / 1000;
    const hot = (p.hotAisleMm ?? 900) / 1000;
    // A "pair" is two rows rear-to-rear sharing one hot aisle, followed by a
    // cold aisle before the next pair. The final cold aisle is shared with the
    // perimeter clearance, so it is added back when counting.
    const pairPitch = uD * 2 + hot + cold;
    const pairs = Math.max(0, Math.floor((usableL + cold) / pairPitch));

    let z = -usableL / 2;
    for (let i = 0; i < pairs; i++) {
      rowZ.push(z + uD / 2); z += uD;      // row A — rear faces the hot aisle
      z += hot;
      rowZ.push(z + uD / 2); z += uD;      // row B
      z += cold;
    }
    aisles = pairs * 2;
    // A single orphan row still fits if there is a row depth + its cold aisle left.
    const consumed = pairs * pairPitch - cold;
    const leftover = usableL - Math.max(consumed, 0);
    if (usableL > 0 && leftover >= uD + cold - 1e-6) {
      rowZ.push(z + uD / 2);
      aisles += 1;
    }

    const perRow = Math.max(0, Math.floor(usableW / uW));
    for (let c = 0; c < perRow; c++) colX.push(-usableW / 2 + (c + 0.5) * uW);
    note = `${pairs} hot/cold aisle pair${pairs === 1 ? "" : "s"} · ${p.coldAisleMm ?? 1200}mm cold / ${p.hotAisleMm ?? 900}mm hot · rear-to-rear rows share the hot aisle (red), fronts open onto the cold aisle (blue)`;
  } else {
    const svc = (p.serviceMm ?? 1200) / 1000;
    const rows = Math.max(0, Math.floor((usableL + svc) / (uD + svc)));
    const perRow = Math.max(0, Math.floor((usableW + svc) / (uW + svc)));
    let z = -usableL / 2;
    for (let r = 0; r < rows; r++) { rowZ.push(z + uD / 2); z += uD + svc; }
    let x = -usableW / 2;
    for (let c = 0; c < perRow; c++) { colX.push(x + uW / 2); x += uW + svc; }
    aisles = Math.max(0, rows - 1);
    note = `${p.serviceMm ?? 1200}mm service clearance on all sides`;
  }

  const rows = rowZ.length;
  const perRow = colX.length;
  const geometricMax = rows * perRow;

  const kwPerUnit = p.kwPerUnit ?? 0;
  const powerMax = kwPerUnit > 0 && room.kw > 0 ? Math.floor(room.kw / kwPerUnit) : null;
  const densityMax = kwPerUnit > 0 && p.maxKwPerM2
    ? Math.floor((usableAreaM2 * p.maxKwPerM2) / kwPerUnit)
    : null;

  const candidates = [
    { key: "space", label: "Floor space", value: geometricMax, detail: `${rows} row${rows === 1 ? "" : "s"} × ${perRow}` },
    ...(powerMax != null ? [{ key: "power", label: "Room power budget", value: powerMax, detail: `${room.kw} kW ÷ ${kwPerUnit} kW` }] : []),
    ...(densityMax != null ? [{ key: "cooling", label: "Cooling density", value: densityMax, detail: `${p.maxKwPerM2} kW/m² over ${round1(usableAreaM2)} m²` }] : []),
  ];
  const binding = candidates.reduce((a, b) => (b.value < a.value ? b : a), candidates[0]);
  const hardMax = Math.max(0, binding.value);
  const planned = Math.max(0, Math.floor(hardMax * PLANNING_HEADROOM));
  const remaining = Math.max(0, planned - placedCount);
  const utilization = planned > 0 ? Math.min(1.5, placedCount / planned) : 0;

  // Slot centres, relative to the room centre, ordered row-major so the first
  // `planned` entries are the ones actually recommended. `backDir` is the
  // sign of Z the rack's rear (hot-aisle/exhaust side) faces — +1 or -1 for
  // an aisle-laid-out row, 0 for free-standing "service" plant that has no
  // front/back orientation. Even rows and odd rows always face opposite
  // ways, because every pair is built rear-to-rear around one shared hot
  // aisle (see the row-building loop above) — the same convention the live
  // Thermal Hotspot / Airflow view in DataCenter3DView derives from a
  // rack's own rotation, so a planned room and a built one read the same.
  const slots = [];
  for (let r = 0; r < rows; r++) {
    const backDir = p.layout === "aisle" ? (r % 2 === 0 ? 1 : -1) : 0;
    for (let c = 0; c < perRow; c++) {
      slots.push({
        x: colX[c] + offsetX,
        z: rowZ[r] + offsetZ,
        w: uW, d: uD,
        index: slots.length,
        row: r, col: c,
        backDir,
        withinPlan: false,   // filled below
        withinMax: false,
      });
    }
  }
  slots.forEach((s, i) => { s.withinMax = i < hardMax; s.withinPlan = i < planned; });

  const totalKw = hardMax * kwPerUnit;
  const plannedKw = planned * kwPerUnit;

  // ── Ancillary bill of materials that follows from the unit count ──
  let ancillary = [];
  if (p.ancillary === "it" && planned > 0) {
    ancillary = [
      { label: "Perforated floor tiles", value: Math.ceil(planned * 1.5), note: "cold-aisle airflow" },
      { label: "Rack PDUs", value: planned * 2, note: "dual A+B feed" },
      { label: "Top-of-rack switches", value: Math.ceil(planned / 2), note: "1 per 2 racks" },
      { label: "CRAC units (N+1)", value: Math.ceil(plannedKw / 30) + 1, note: "30 kW each" },
      { label: "UPS capacity", value: Math.ceil(plannedKw * 1.25), suffix: " kVA", note: "1.25 × IT load" },
      { label: "Generator capacity", value: Math.ceil(plannedKw * 1.6), suffix: " kW", note: "1.6 × IT load" },
      { label: "Smoke detectors", value: Math.max(2, Math.ceil(areaM2 / 25)), note: "1 per 25 m²" },
      { label: "CCTV cameras", value: Math.max(2, Math.ceil(((room.width + room.length) * 2) / 12)), note: "1 per 12 m perimeter" },
    ];
  } else if (p.ancillary === "cooling" && planned > 0) {
    const coolKw = planned * (p.coolingKwPerUnit || 30);
    ancillary = [
      { label: "Total cooling", value: coolKw, suffix: " kW", note: `${p.coolingKwPerUnit || 30} kW per unit` },
      { label: "IT load supported", value: Math.floor(coolKw / 1.25), suffix: " kW", note: "1.25 × derating" },
      { label: "Racks cooled", value: Math.floor(coolKw / 1.25 / 5), note: "at 5 kW / rack" },
      { label: "Condensate drains", value: planned, note: "1 per unit" },
      { label: "Leak-detection zones", value: Math.max(1, Math.ceil(areaM2 / 30)) },
    ];
  } else if (p.ancillary === "power" && planned > 0) {
    const kva = planned * (p.capacityKvaPerUnit || 0);
    const gen = planned * (p.genKwPerUnit || 0);
    ancillary = [
      ...(kva ? [{ label: "Total UPS capacity", value: kva, suffix: " kVA" }] : []),
      ...(gen ? [{ label: "Total generator output", value: gen, suffix: " kW" }] : []),
      ...(kva ? [{ label: "IT load supported (N+1)", value: Math.floor((kva * 0.9 * (planned - 1)) / Math.max(planned, 1)), suffix: " kW" }] : []),
      { label: "Battery / fuel runtime", value: p.genKwPerUnit ? 8 : 10, suffix: p.genKwPerUnit ? " hrs" : " min" },
      { label: "Ventilation", value: Math.ceil(areaM2 * 6), suffix: " m³/h", note: "6 ACH" },
    ];
  }

  // ── Warnings the planner actually needs to see ──
  const warnings = [];
  if (geometricMax === 0) {
    warnings.push({
      sev: "critical",
      text: `Too small for even one ${p.unit} once ${p.perimeterMm ?? 900}mm perimeter clearance is applied — needs at least ${round1(uW + (perimM * 2))} × ${round1(uD + (perimM * 2))} m.`,
    });
  }
  if (powerMax != null && geometricMax > 0 && powerMax < geometricMax) {
    warnings.push({
      sev: "warn",
      text: `Power-limited: the floor holds ${geometricMax} ${p.units}, but a ${room.kw} kW budget only supports ${powerMax}. Raise the room kW or accept the smaller count.`,
    });
  }
  if (densityMax != null && geometricMax > 0 && densityMax < geometricMax && densityMax < (powerMax ?? Infinity)) {
    warnings.push({
      sev: "warn",
      text: `Cooling-density-limited: ${p.maxKwPerM2} kW/m² over ${round1(usableAreaM2)} m² caps this at ${densityMax} ${p.units}.`,
    });
  }
  if (kwPerUnit > 0 && !room.kw) {
    warnings.push({ sev: "info", text: "No kW budget set on this room, so the power constraint was skipped. Set one for a true prediction." });
  }
  if (placedCount > planned && planned > 0) {
    warnings.push({ sev: "critical", text: `${placedCount} devices are already placed here — that is over the recommended ${planned} and eats the growth headroom.` });
  } else if (placedCount > 0 && utilization >= 0.85) {
    warnings.push({ sev: "warn", text: `${Math.round(utilization * 100)}% of planned capacity is used. Start planning the next room.` });
  }
  if (rows > 0 && perRow > 0 && p.layout === "aisle" && rows % 2 === 1) {
    warnings.push({ sev: "info", text: "The last row is an orphan (no back-to-back partner) — it will exhaust into the perimeter aisle." });
  }

  return {
    profile: p, roomId: room.id, roomName: room.name, roomType: room.type,
    areaM2, usableAreaM2, usableW, usableL, offsetX, offsetZ,
    layout: { rows, perRow, aisles, note },
    geometricMax, powerMax, densityMax, candidates, binding,
    hardMax, planned, placedCount, remaining, utilization,
    kwPerUnit, totalKw, plannedKw,
    slots, ancillary, warnings,
    nonPlaceable: false,
  };
}

/**
 * Builds the translucent 3D preview of a prediction: solid ghosts for the
 * recommended slots, faint outlines for the extra ones the floor could take
 * if you spent the headroom.
 */
export function createCapacityPreviewGroup(THREE, rect, prediction, floorY, isDark) {
  const g = new THREE.Group();
  g.name = "CapacityPreview";
  if (!prediction || prediction.nonPlaceable || !prediction.slots.length) return g;

  const H = 2.0;
  const planMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e, transparent: true, opacity: 0.16,
    metalness: 0.2, roughness: 0.6, depthWrite: false,
  });
  const planEdge = new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 });
  const overEdge = new THREE.LineBasicMaterial({ color: isDark ? 0x64748b : 0x94a3b8, transparent: true, opacity: 0.45 });
  const padMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false,
  });
  // Same hot-aisle / cold-aisle palette as the live Thermal Hotspot view —
  // a thin glow strip just behind each planned rack's rear (hot aisle) and
  // just in front of its face (cold aisle), so the plan already reads as
  // the containment layout it will become.
  const hotStripMat = new THREE.MeshBasicMaterial({
    color: HOT_AISLE_HEX, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false,
  });
  const coldStripMat = new THREE.MeshBasicMaterial({
    color: COLD_AISLE_HEX, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false,
  });

  prediction.slots.forEach((s) => {
    const x = rect.cx + s.x;
    const z = rect.cz + s.z;
    const geo = new THREE.BoxGeometry(s.w - 0.03, H, s.d - 0.03);

    if (s.withinPlan) {
      const mesh = new THREE.Mesh(geo, planMat);
      mesh.position.set(x, floorY + H / 2, z);
      g.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), planEdge);
      edges.position.copy(mesh.position);
      g.add(edges);
    } else if (s.withinMax) {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), overEdge);
      edges.position.set(x, floorY + H / 2, z);
      g.add(edges);
    } else {
      return;
    }

    const pad = new THREE.Mesh(new THREE.PlaneGeometry(s.w - 0.05, s.d - 0.05), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, floorY + 0.03, z);
    g.add(pad);

    if (s.backDir && s.withinPlan) {
      const stripD = Math.min(0.5, s.d * 0.35);
      const hotStrip = new THREE.Mesh(new THREE.PlaneGeometry(s.w - 0.04, stripD), hotStripMat);
      hotStrip.rotation.x = -Math.PI / 2;
      hotStrip.position.set(x, floorY + 0.032, z + s.backDir * (s.d / 2 + stripD / 2 - 0.02));
      g.add(hotStrip);

      const coldStrip = new THREE.Mesh(new THREE.PlaneGeometry(s.w - 0.04, stripD), coldStripMat);
      coldStrip.rotation.x = -Math.PI / 2;
      coldStrip.position.set(x, floorY + 0.032, z - s.backDir * (s.d / 2 + stripD / 2 - 0.02));
      g.add(coldStrip);
    }
  });

  // Usable-envelope outline, so the perimeter clearance is visible.
  const envGeo = new THREE.BoxGeometry(prediction.usableW, 0.02, prediction.usableL);
  const env = new THREE.LineSegments(
    new THREE.EdgesGeometry(envGeo),
    new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.4, gapSize: 0.25, transparent: true, opacity: 0.7 }),
  );
  env.computeLineDistances();
  env.position.set(rect.cx + prediction.offsetX, floorY + 0.05, rect.cz + prediction.offsetZ);
  g.add(env);

  g.userData.isCapacityPreview = true;
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2 · FAILURE SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_COST_MODEL = {
  rackRevenuePerHour: 48,      // $/h of service revenue behind one compute/storage rack
  networkRevenuePerHour: 26,   // $/h behind a network device
  auxRevenuePerHour: 8,        // $/h behind everything else
  slaBreachPerHour: 320,       // flat penalty once a critical load is past the grace window
  slaGraceMinutes: 5,
  thermalWearPerDegHour: 24,   // accelerated hardware wear, per °C-hour above 27 °C
  emergencyCallout: 450,       // one-off, per failed device
  energyPerKwh: 0.14,
  kwPerRack: 5,
};

export const THERMAL_BANDS = [
  { max: 24, level: 0, label: "Normal", color: "#22c55e" },
  { max: 27, level: 1, label: "Elevated", color: "#f59e0b" },
  { max: 32, level: 2, label: "High", color: "#f97316" },
  { max: Infinity, level: 3, label: "Critical", color: "#ef4444" },
];

export const AMBIENT_TARGET_C = 21;
const THERMAL_SHUTDOWN_C = 32;
const THERMAL_THROTTLE_C = 27;

export function thermalBand(tempC) {
  return THERMAL_BANDS.find((b) => tempC < b.max) || THERMAL_BANDS[THERMAL_BANDS.length - 1];
}

/** Newtonian warm-up toward a ceiling set by how much cooling was lost. */
export function roomThermalCurve(elapsedSec, coolingLostFrac, loadKw, volumeM3) {
  if (coolingLostFrac <= 0) {
    return { tempC: AMBIENT_TARGET_C + Math.sin(elapsedSec / 240) * 0.4, ceiling: AMBIENT_TARGET_C, tau: 0 };
  }
  const frac = Math.min(1, coolingLostFrac);
  const ceiling = AMBIENT_TARGET_C + 26 * frac + Math.min(9, loadKw / 8);
  const tau = Math.max(90, (Math.max(volumeM3, 20) * 14) / Math.max(loadKw, 2));
  const tempC = AMBIENT_TARGET_C + (ceiling - AMBIENT_TARGET_C) * (1 - Math.exp(-elapsedSec / tau));
  return { tempC, ceiling, tau };
}

/** Seconds from cooling loss until the room crosses `targetC` (∞ if never). */
function secondsToTemp(targetC, ceiling, tau) {
  if (ceiling <= targetC || tau <= 0) return Infinity;
  const ratio = 1 - (targetC - AMBIENT_TARGET_C) / (ceiling - AMBIENT_TARGET_C);
  if (ratio <= 0) return 0;
  return -tau * Math.log(ratio);
}

export function deviceRole(dev) {
  const cat = dev?.category;
  if (cat === "Power") return "power";
  if (cat === "Cooling") return "cooling";
  if (cat === "Network") return "network";
  if (cat === "Compute" || cat === "Storage") return "load";
  if (cat === "Security" || cat === "Safety") return "safety";
  return "aux";
}

export const ROLE_META = {
  load: { label: "IT load", color: "#38bdf8" },
  network: { label: "Network", color: "#6366f1" },
  power: { label: "Power", color: "#f59e0b" },
  cooling: { label: "Cooling", color: "#22d3ee" },
  safety: { label: "Life safety", color: "#ef4444" },
  aux: { label: "Auxiliary", color: "#94a3b8" },
};

export const SEVERITY_META = {
  ok: { label: "Nominal", color: "#22c55e", rank: 0 },
  degraded: { label: "Degraded", color: "#f59e0b", rank: 1 },
  critical: { label: "Down", color: "#ef4444", rank: 2 },
};

const POWER_TYPES = new Set(["power"]);
const NET_TYPES = new Set(["network", "fiber", "backbone", "equipment", "copper"]);
const COOL_TYPES = new Set(["cooling"]);

// ── The cooling chain ────────────────────────────────────────────────────
// Power and network get their tiers from deploymentChains, which only models
// those two. Cooling had no chain at all, and that was the whole reason a
// rack plumbed straight into a CRAC never appeared when that CRAC was
// failed: the cascade walks cable types belonging to a chain, and `cooling`
// belonged to none of them. Room temperature was the only thing that
// noticed, and that is a slow, room-wide effect rather than "this rack is
// fed by that unit".
//
// The chain itself is short and needs no new stage table -- heat rejection
// feeds room units, room units feed the load:
//   1  chiller / cooling tower / dry cooler / condenser
//   2  CRAC / CRAH / PAC / in-row / CDU / AHU
//   3  everything that is cooled by them
const COOLING_SOURCE_RE = /(chiller|cooling tower|dry cooler|condens|heat reject)/i;
const COOLING_UNIT_RE = /(crac|crah|\bpac\b|crv|in.?row|crab|cdu|ahu|precision air|air handl|fan wall|rear.?door)/i;

function coolingTier(dev) {
  if (!dev) return null;
  const name = String(dev.name || "");
  if (COOLING_SOURCE_RE.test(name)) return 1;
  if (COOLING_UNIT_RE.test(name)) return 2;
  const role = deviceRole(dev);
  // Any other cooling-category kit sits with the room units; anything that
  // draws cooling (a rack, a server) is the load at the end of the chain.
  if (role === "cooling") return 2;
  if (role === "load" || role === "network") return 3;
  return null;   // doors, signage, fire panels: not cooled, not in the chain
}

/**
 * TIER-DIRECTED CASCADE.
 *
 * A cable in the model is undirected (A↔B), but a delivery chain is not:
 * a UPS feeds a PDU, a PDU never feeds a UPS. deploymentChains.js gives every
 * device a tier inside each chain, and this walk only ever moves from a lower
 * tier to a higher one — so a failure travels downstream and can never blame
 * the gear that feeds it.
 *
 * Redundancy is the second half of the rule, and it is what makes the answer
 * useful rather than alarming: a device drops out ONLY when every one of its
 * upstream feeds is dead. A rack corded to PDU1 and PDU2 survives losing
 * PDU1; a rack corded to PDU1 alone does not. That is precisely the
 * difference between a Tier III design and a Tier II one, and it is why
 * killing one MPP on a properly-drawn A/B layout paints far less of the floor
 * red than a planner usually expects.
 *
 * The walk runs to a fixpoint in ascending tier order, so a loss at tier 1
 * reaches tier 7 in a single sweep and multi-hop redundancy still resolves
 * correctly.
 *
 * @returns Map<deviceId, { sinceSec, sourceId, rootId, feeds, hops }>
 *          sourceId — the immediate upstream that went dark
 *          rootId   — the originally injected failure this traces back to
 */
function cascadeChain({ devices, adj, failedIds, failedAt, chain, allowedTypes, tierFn }) {
  const tierOf = new Map();
  const tierLookup = tierFn || ((d) => deviceTier(d, chain));
  devices.forEach((d) => {
    const t = tierLookup(d);
    if (t != null) tierOf.set(d.id, t);
  });
  if (!tierOf.size) return new Map();

  // Upstream feeds = neighbours on an allowed cable type that sit at a
  // strictly lower tier in this chain.
  const upstream = new Map();
  tierOf.forEach((t, id) => {
    const ups = (adj.get(id) || [])
      .filter((e) => allowedTypes.has(e.type) && tierOf.has(e.other) && tierOf.get(e.other) < t)
      .map((e) => e.other);
    upstream.set(id, [...new Set(ups)]);
  });

  const order = [...tierOf.keys()].sort((a, b) => tierOf.get(a) - tierOf.get(b));
  const out = new Map();

  let changed = true;
  let guard = 0;
  while (changed && guard++ <= order.length + 4) {
    changed = false;
    for (const id of order) {
      if (failedIds.has(id) || out.has(id)) continue;
      const ups = upstream.get(id) || [];
      // No modelled feed at all → nothing upstream can take it down. This is
      // also the honest answer for a device the planner never cabled: the
      // Impact panel calls those out separately rather than guessing.
      if (!ups.length) continue;

      const dead = ups.filter((u) => failedIds.has(u) || out.has(u));
      if (dead.length !== ups.length) continue; // a live feed held the load

      let best = null;
      dead.forEach((u) => {
        const rec = failedIds.has(u)
          ? { sinceSec: failedAt(u), rootId: u, hops: 0 }
          : { sinceSec: out.get(u).sinceSec, rootId: out.get(u).rootId, hops: out.get(u).hops };
        // The branch goes dark when its LAST surviving feed dies, so the
        // start time is the latest of the dead feeds, not the earliest.
        if (!best || rec.sinceSec > best.sinceSec) best = { ...rec, sourceId: u };
      });

      out.set(id, {
        sinceSec: best.sinceSec,
        sourceId: best.sourceId,
        rootId: best.rootId,
        feeds: ups.length,
        hops: best.hops + 1,
      });
      changed = true;
    }
  }
  return out;
}

/** Devices in `chain` that carry no modelled upstream feed at all. */
function uncabledInChain(devices, adj, chain, allowedTypes) {
  return devices.filter((d) => {
    if (!expectsFeed(d, chain)) return false;
    const t = deviceTier(d, chain);
    return !(adj.get(d.id) || []).some((e) => {
      if (!allowedTypes.has(e.type)) return false;
      const ot = deviceTier(byIdLookup(devices, e.other), chain);
      return ot != null && ot < t;
    });
  });
}
function byIdLookup(devices, id) {
  return devices.find((d) => d.id === id);
}

/**
 * The whole picture at simulated time `simSeconds`.
 *
 * @param {object[]} devices     placed devices (with a `__roomId` already assigned)
 * @param {object[]} connections cable records {id, fromId, toId, type}
 * @param {object[]} roomRects   [{id, name, type, cx, cz, w, l, h, kw}]
 * @param {object}   failures    { deviceId: { at: simSeconds, mode } }
 * @param {number}   simSeconds  simulated clock
 * @param {object}   costModel
 */
export function computeImpactReport({
  devices = [], connections = [], roomRects = [], failures = {}, simSeconds = 0,
  costModel = DEFAULT_COST_MODEL,
}) {
  const cm = { ...DEFAULT_COST_MODEL, ...costModel };
  const byId = new Map(devices.map((d) => [d.id, d]));
  const adj = new Map();
  connections.forEach((c) => {
    if (!byId.has(c.fromId) || !byId.has(c.toId)) return;
    if (!adj.has(c.fromId)) adj.set(c.fromId, []);
    if (!adj.has(c.toId)) adj.set(c.toId, []);
    adj.get(c.fromId).push({ other: c.toId, type: c.type, id: c.id });
    adj.get(c.toId).push({ other: c.fromId, type: c.type, id: c.id });
  });

  const failedIds = new Set(Object.keys(failures).filter((id) => byId.has(id)));
  const failedAt = (id) => failures[id]?.at ?? 0;

  // ── Cascades — strictly downstream, redundancy-aware ──
  // Both chains are walked independently: a device can lose its power feed,
  // its network feed, or both, and each is reported with its own cause.
  const powerOut = cascadeChain({
    devices, adj, failedIds, failedAt, chain: "power", allowedTypes: POWER_TYPES,
  });
  const netOut = cascadeChain({
    devices, adj, failedIds, failedAt, chain: "network", allowedTypes: NET_TYPES,
  });
  // Cooling walks the same way: fail a CRAC and everything plumbed downstream
  // of it on a cooling line is reported, by name, straight away -- rather
  // than waiting for the room to warm up enough to notice.
  const coolOut = cascadeChain({
    devices, adj, failedIds, failedAt, chain: "cooling", allowedTypes: COOL_TYPES,
    tierFn: coolingTier,
  });

  // ── Per-room thermal state ──
  const rooms = roomRects.map((r) => {
    const inRoom = devices.filter((d) => d.__roomId === r.id);
    const coolers = inRoom.filter((d) => deviceRole(d) === "cooling");
    // A unit counts as out if it was failed directly, lost its power feed,
    // or lost the chilled-water source it depends on.
    const failedCoolers = coolers.filter(
      (d) => failedIds.has(d.id) || powerOut.has(d.id) || coolOut.has(d.id));
    const loads = inRoom.filter((d) => deviceRole(d) === "load");
    const loadKw = Math.max(loads.length * cm.kwPerRack, r.kw || 0);
    const frac = coolers.length ? failedCoolers.length / coolers.length : 0;

    const startTimes = failedCoolers.map((c) => {
      if (failedIds.has(c.id)) return failures[c.id].at ?? 0;
      return powerOut.get(c.id)?.sinceSec ?? coolOut.get(c.id)?.sinceSec ?? 0;
    });
    const startedAt = startTimes.length ? Math.min(...startTimes) : null;
    const elapsed = startedAt != null ? Math.max(0, simSeconds - startedAt) : 0;

    const volumeM3 = (r.w || 1) * (r.l || 1) * (r.h || 4);
    const { tempC, ceiling, tau } = roomThermalCurve(elapsed, frac, loadKw, volumeM3);
    const band = thermalBand(tempC);

    const tThrottle = secondsToTemp(THERMAL_THROTTLE_C, ceiling, tau);
    const tShutdown = secondsToTemp(THERMAL_SHUTDOWN_C, ceiling, tau);

    return {
      id: r.id, name: r.name, type: r.type, cx: r.cx, cz: r.cz, w: r.w, l: r.l,
      deviceCount: inRoom.length, coolerCount: coolers.length,
      failedCoolerCount: failedCoolers.length, loadCount: loads.length, loadKw,
      coolingLostFrac: frac, noCooling: coolers.length === 0 && loads.length > 0,
      startedAt, elapsedSec: elapsed, tempC, ceiling, tau, band,
      throttleAtSec: tThrottle, shutdownAtSec: tShutdown,
      throttleElapsed: Number.isFinite(tThrottle) ? Math.max(0, elapsed - tThrottle) : 0,
      shutdownElapsed: Number.isFinite(tShutdown) ? Math.max(0, elapsed - tShutdown) : 0,
      secondsToThrottle: Number.isFinite(tThrottle) ? Math.max(0, tThrottle - elapsed) : Infinity,
      secondsToShutdown: Number.isFinite(tShutdown) ? Math.max(0, tShutdown - elapsed) : Infinity,
    };
  });
  const roomById = new Map(rooms.map((r) => [r.id, r]));

  // ── Per-device severity + cost ──
  const deviceStates = new Map();
  let downtimeCost = 0;
  let thermalCost = 0;
  let criticalLoadSeconds = 0;
  let maxCriticalDown = 0;

  // ── Which loads actually feel a cooling loss ──
  // The room temperature curve is room-wide, but the IMPACT of a dead cooling
  // unit is not: only the racks that unit is plumbed to lose their cold air.
  // Fail one PAC and only the racks on its cooling line throttle -- the rest
  // of the room (fed by the other PACs) stays nominal. A load with no cooling
  // cable at all falls back to the room picture, and only when the room has
  // lost ALL of its cooling.
  const coolerDown = (id) => failedIds.has(id) || powerOut.has(id) || coolOut.has(id);
  const thermallyExposed = (d, room) => {
    const feeds = (adj.get(d.id) || []).filter(
      (e) => COOL_TYPES.has(e.type) && deviceRole(byId.get(e.other)) === "cooling");
    if (!feeds.length) return !!room && room.coolerCount > 0 && room.coolingLostFrac >= 1;
    return feeds.some((e) => coolerDown(e.other));
  };

  devices.forEach((d) => {
    const role = deviceRole(d);
    const room = d.__roomId != null ? roomById.get(d.__roomId) : null;
    const exposed = role === "load" && thermallyExposed(d, room);
    const causes = [];
    let severity = "ok";
    let downSince = null;
    let lossFactor = 0;

    if (failedIds.has(d.id)) {
      severity = "critical";
      downSince = failures[d.id].at ?? 0;
      lossFactor = 1;
      causes.push({ kind: "direct", text: failures[d.id].mode || "Manual failure injected" });
    }
    const po = powerOut.get(d.id);
    if (po) {
      const src = byId.get(po.sourceId);
      const proot = byId.get(po.rootId);
      causes.push({
        kind: "power",
        text: `Power feed lost — ${src ? deviceLabel(src) : "upstream"} is down`,
        detail: po.rootId !== po.sourceId && proot
          ? `traced back to ${deviceLabel(proot)}, ${po.hops} hop${po.hops === 1 ? "" : "s"} upstream`
          : `${po.feeds === 1 ? "single-fed — no B-side feed to hold it up" : `both/all ${po.feeds} feeds are down`}`,
      });
      if (severity !== "critical" || downSince == null || po.sinceSec < downSince) {
        severity = "critical";
        downSince = downSince == null ? po.sinceSec : Math.min(downSince, po.sinceSec);
      }
      lossFactor = 1;
    }
    if (room && exposed && room.shutdownElapsed > 0) {
      causes.push({ kind: "thermal", text: `Thermal shutdown — ${room.name} at ${room.tempC.toFixed(1)} °C` });
      const since = (room.startedAt ?? 0) + room.shutdownAtSec;
      if (severity !== "critical") { severity = "critical"; downSince = since; lossFactor = 1; }
      else if (downSince == null || since < downSince) downSince = since;
    } else if (room && exposed && room.throttleElapsed > 0) {
      causes.push({ kind: "thermal", text: `Thermal throttling — ${room.name} at ${room.tempC.toFixed(1)} °C` });
      if (severity === "ok") {
        severity = "degraded";
        downSince = (room.startedAt ?? 0) + room.throttleAtSec;
        lossFactor = 0.4;
      }
    }
    // ── Cooling feed lost ──
    // A rack whose CRAC has just died is not off -- it is running on the
    // room's remaining thermal mass, and it will keep running until the room
    // heats through the throttle and shutdown points above (which the
    // thermal block escalates it to). So this reports it as impaired, names
    // the unit responsible, and lets the temperature curve take it the rest
    // of the way. A cooling unit that loses ITS source is a harder failure:
    // it has nothing to move, so it stops being a cooling unit.
    const co = coolOut.get(d.id);
    if (co) {
      const src = byId.get(co.sourceId);
      const croot = byId.get(co.rootId);
      causes.push({
        kind: "cooling",
        text: `Cooling feed lost — ${src ? deviceLabel(src) : "upstream"} is down`,
        detail: co.rootId !== co.sourceId && croot
          ? `traced back to ${deviceLabel(croot)}, ${co.hops} hop${co.hops === 1 ? "" : "s"} upstream`
          : `${co.feeds === 1 ? "single-fed — no second cooling source on this run" : `all ${co.feeds} cooling feeds are down`}`,
      });
      if (severity === "ok") {
        severity = role === "cooling" ? "critical" : "degraded";
        downSince = co.sinceSec;
        lossFactor = role === "cooling" ? 1 : 0.35;
      }
    }

    const no = netOut.get(d.id);
    if (no) {
      const src = byId.get(no.sourceId);
      const root = byId.get(no.rootId);
      causes.push({
        kind: "network",
        text: `Isolated — ${src ? deviceLabel(src) : "upstream"} lost its uplink`,
        detail: no.rootId !== no.sourceId && root
          ? `traced back to ${deviceLabel(root)}, ${no.hops} hop${no.hops === 1 ? "" : "s"} upstream`
          : `${no.feeds === 1 ? "single-homed — no second uplink to fall back to" : `all ${no.feeds} uplinks are down`}`,
      });
      if (severity === "ok") {
        severity = role === "network" ? "critical" : "degraded";
        downSince = no.sinceSec;
        lossFactor = role === "network" ? 1 : 0.6;
      }
    }

    let cost = 0;
    let downSec = 0;
    if (severity !== "ok" && downSince != null) {
      downSec = Math.max(0, simSeconds - downSince);
      const rate = role === "load" ? cm.rackRevenuePerHour
        : role === "network" ? cm.networkRevenuePerHour
          : cm.auxRevenuePerHour;
      cost = (rate * lossFactor * downSec) / 3600;
      downtimeCost += cost;
      if (severity === "critical" && (role === "load" || role === "network")) {
        criticalLoadSeconds += downSec;
        maxCriticalDown = Math.max(maxCriticalDown, downSec);
      }
    }

    deviceStates.set(d.id, {
      // `name` is what every panel prints, so it is the ALIAS when there is
      // one — `typeName` keeps the library name for the places that want it.
      id: d.id, name: deviceLabel(d), typeName: d.name,
      alias: d.alias || null, category: d.category, role, roomId: d.__roomId ?? null,
      roomName: room?.name || null, severity, causes, downSince, downSec, lossFactor, cost,
    });
  });

  // ── Thermal wear, priced per °C-hour above the throttle point ──
  rooms.forEach((r) => {
    if (r.tempC <= THERMAL_THROTTLE_C || r.elapsedSec <= 0) return;
    const degHours = ((r.tempC - THERMAL_THROTTLE_C) * r.elapsedSec) / 3600;
    thermalCost += degHours * cm.thermalWearPerDegHour * Math.max(1, r.loadCount / 5);
  });

  // ── SLA + call-out ──
  const graceSec = cm.slaGraceMinutes * 60;
  const slaSeconds = Math.max(0, maxCriticalDown - graceSec);
  const slaCost = (cm.slaBreachPerHour * slaSeconds) / 3600;
  const calloutCost = failedIds.size * cm.emergencyCallout;

  const total = downtimeCost + thermalCost + slaCost + calloutCost;
  const burnPerHour = (() => {
    let rate = 0;
    deviceStates.forEach((s) => {
      if (s.severity === "ok") return;
      const r = s.role === "load" ? cm.rackRevenuePerHour
        : s.role === "network" ? cm.networkRevenuePerHour : cm.auxRevenuePerHour;
      rate += r * s.lossFactor;
    });
    if (slaSeconds > 0 || maxCriticalDown > 0) rate += cm.slaBreachPerHour;
    rooms.forEach((r) => {
      if (r.tempC > THERMAL_THROTTLE_C) {
        rate += (r.tempC - THERMAL_THROTTLE_C) * cm.thermalWearPerDegHour * Math.max(1, r.loadCount / 5);
      }
    });
    return rate;
  })();

  // ── Incidents ──
  const incidents = [...failedIds].map((id) => {
    const d = byId.get(id);
    const st = deviceStates.get(id);
    // A victim belongs to the incident it traces back to, however many hops
    // away that is — otherwise a 5-deep chain only ever credits the last hop.
    const cascadeIds = [];
    deviceStates.forEach((st2, sid) => {
      if (sid === id || st2.severity === "ok") return;
      if (powerOut.get(sid)?.rootId === id || netOut.get(sid)?.rootId === id
        || coolOut.get(sid)?.rootId === id) cascadeIds.push(sid);
    });
    const room = d.__roomId != null ? roomById.get(d.__roomId) : null;
    if (deviceRole(d) === "cooling" && room) {
      deviceStates.forEach((s, sid) => {
        if (sid === id || s.roomId !== room.id) return;
        if (s.severity !== "ok" && s.causes.some((c) => c.kind === "thermal") && !cascadeIds.includes(sid)) {
          cascadeIds.push(sid);
        }
      });
    }
    return {
      id, name: deviceLabel(d), typeName: d.name, alias: d.alias || null,
      category: d.category, role: deviceRole(d),
      roomName: room?.name || "—", startedAt: failures[id].at ?? 0,
      durationSec: Math.max(0, simSeconds - (failures[id].at ?? 0)),
      cascadeIds, cascadeCount: cascadeIds.length,
      directCost: st?.cost || 0,
      // What this one failure is actually costing: itself plus everything it
      // dragged down with it. This is the number a planner is really asking
      // for when they click a device in Simulate mode.
      blastCost: (st?.cost || 0) + cascadeIds.reduce((a, sid) => a + (deviceStates.get(sid)?.cost || 0), 0),
      blastBurnPerHour: cascadeIds.reduce((a, sid) => {
        const v = deviceStates.get(sid);
        if (!v || v.severity === "ok") return a;
        const r = v.role === "load" ? cm.rackRevenuePerHour
          : v.role === "network" ? cm.networkRevenuePerHour : cm.auxRevenuePerHour;
        return a + r * v.lossFactor;
      }, 0),
      victims: cascadeIds
        .map((sid) => deviceStates.get(sid))
        .filter(Boolean)
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 8)
        .map((v) => ({
          id: v.id, name: v.name, typeName: v.typeName, role: v.role, severity: v.severity,
          downSec: v.downSec, cost: v.cost, why: v.causes[0]?.text || "",
        })),
      mode: failures[id].mode || "Manual failure",
    };
  }).sort((a, b) => b.cascadeCount - a.cascadeCount || a.startedAt - b.startedAt);

  // ── Headline counts ──
  let downCount = 0, degradedCount = 0, okCount = 0;
  deviceStates.forEach((s) => {
    if (s.severity === "critical") downCount += 1;
    else if (s.severity === "degraded") degradedCount += 1;
    else okCount += 1;
  });

  // ── Pro / caution / risk read-out ──
  const impacts = [];
  const hotRooms = rooms.filter((r) => r.band.level >= 2);
  const warmRooms = rooms.filter((r) => r.band.level === 1);

  if (failedIds.size === 0) {
    impacts.push({ type: "pro", zone: "overall", text: "No failures injected — the facility is running nominal." });
  } else {
    impacts.push({ type: "con", zone: "overall", text: `${failedIds.size} device${failedIds.size > 1 ? "s" : ""} failed, cascading to ${downCount + degradedCount - failedIds.size} more.` });
  }
  if (downCount > 0) impacts.push({ type: "con", zone: "availability", text: `${downCount} device${downCount > 1 ? "s are" : " is"} fully down — revenue is stopped behind them.` });
  if (degradedCount > 0) impacts.push({ type: "warn", zone: "availability", text: `${degradedCount} device${degradedCount > 1 ? "s" : ""} degraded — throttled or isolated, still partially serving.` });
  if (downCount === 0 && degradedCount === 0) impacts.push({ type: "pro", zone: "availability", text: "Every placed device is serving normally." });

  hotRooms.forEach((r) => impacts.push({
    type: "con", zone: "thermal",
    text: `${r.name} at ${r.tempC.toFixed(1)} °C (${r.band.label}) — ${r.shutdownElapsed > 0 ? "loads are shutting down" : `shutdown in ${formatDuration(r.secondsToShutdown)}`}.`,
  }));
  warmRooms.forEach((r) => impacts.push({
    type: "warn", zone: "thermal",
    text: `${r.name} is drifting up (${r.tempC.toFixed(1)} °C) — throttling in ${formatDuration(r.secondsToThrottle)}.`,
  }));
  rooms.filter((r) => r.noCooling).forEach((r) => impacts.push({
    type: "warn", zone: "design", text: `${r.name} holds IT load but has no cooling device placed — no redundancy to lose.`,
  }));
  rooms.filter((r) => r.coolerCount === 1 && r.loadCount > 0).forEach((r) => impacts.push({
    type: "warn", zone: "design", text: `${r.name} has a single cooling unit — no N+1. One failure takes the whole room.`,
  }));
  if (slaSeconds > 0) impacts.push({
    type: "con", zone: "sla",
    text: `SLA breached — ${formatDuration(slaSeconds)} past the ${cm.slaGraceMinutes}-minute grace window.`,
  });
  if (total > 0 && burnPerHour > 0) impacts.push({
    type: "warn", zone: "cost",
    text: `Burning ${formatCurrency(burnPerHour)}/hr at the current state.`,
  });

  // Anything in a chain above tier 1 with no modelled upstream feed is
  // invisible to the simulation — say so plainly rather than reporting it
  // as healthy, which is the more dangerous lie.
  const noPowerFeed = uncabledInChain(devices, adj, "power", POWER_TYPES);
  const noNetFeed = uncabledInChain(devices, adj, "network", NET_TYPES);
  if (noPowerFeed.length) impacts.push({
    type: "warn", zone: "design",
    text: `${noPowerFeed.length} device${noPowerFeed.length > 1 ? "s have" : " has"} no upstream power cable — a power failure cannot be modelled through ${noPowerFeed.length > 1 ? "them" : "it"}.`,
  });
  if (noNetFeed.length) impacts.push({
    type: "warn", zone: "design",
    text: `${noNetFeed.length} device${noNetFeed.length > 1 ? "s have" : " has"} no upstream network link — connect ${noNetFeed.length > 1 ? "them" : "it"} to the tier above with the Connect tool.`,
  });

  // Single-fed devices: the Tier III test. These are the devices where one
  // upstream failure IS an outage, and they are worth naming before one
  // happens rather than after.
  const singleFed = devices.filter((d) => {
    const t = deviceTier(d, "power");
    if (t == null || t <= 1) return false;
    const feeds = (adj.get(d.id) || []).filter((e) => POWER_TYPES.has(e.type)
      && deviceTier(byId.get(e.other), "power") != null
      && deviceTier(byId.get(e.other), "power") < t);
    return feeds.length === 1;
  });
  if (singleFed.length) impacts.push({
    type: "warn", zone: "design",
    text: `${singleFed.length} device${singleFed.length > 1 ? "s are" : " is"} single-fed on power — no B-side path, so one upstream failure takes ${singleFed.length > 1 ? "them" : "it"} straight down.`,
  });

  return {
    simSeconds, costModel: cm,
    devices: deviceStates, rooms, incidents, impacts,
    counts: { ok: okCount, degraded: degradedCount, down: downCount, failed: failedIds.size, total: devices.length },
    totals: {
      downtimeCost, thermalCost, slaCost, calloutCost, total,
      burnPerHour,
      projected15m: total + (burnPerHour * 0.25),
      projected1h: total + burnPerHour,
      projected4h: total + (burnPerHour * 4),
    },
    hottestRoom: rooms.reduce((a, b) => (!a || b.tempC > a.tempC ? b : a), null),
  };
}

/** Diff two saved snapshots into a human-readable change list. */
export function diffSnapshots(from, to) {
  const changes = [];
  const dt = to.simSeconds - from.simSeconds;

  const allIds = new Set([...Object.keys(from.failures), ...Object.keys(to.failures)]);
  allIds.forEach((id) => {
    const wasFailed = !!from.failures[id];
    const isFailed = !!to.failures[id];
    if (wasFailed === isFailed) return;
    const meta = to.deviceMeta[id] || from.deviceMeta[id] || {};
    const cascade = (isFailed ? to.incidents : from.incidents).find((i) => i.id === id);
    changes.push({
      kind: isFailed ? "failure" : "recovery",
      label: `${meta.name || id}`,
      sub: `${meta.category || "Device"} · ${meta.roomName || "unassigned"}`,
      from: wasFailed ? "Down" : "Online",
      to: isFailed ? "Down" : "Online",
      detail: isFailed
        ? `Failed — ${cascade?.cascadeCount ?? 0} downstream device${(cascade?.cascadeCount ?? 0) === 1 ? "" : "s"} affected`
        : "Restored — downstream devices recovered",
      cost: isFailed ? cascade?.directCost ?? 0 : 0,
      affected: cascade?.cascadeIds || [],
    });
  });

  const roomIds = new Set([...from.rooms.map((r) => r.id), ...to.rooms.map((r) => r.id)]);
  roomIds.forEach((rid) => {
    const a = from.rooms.find((r) => r.id === rid);
    const b = to.rooms.find((r) => r.id === rid);
    if (!a || !b) return;
    if (Math.abs(b.tempC - a.tempC) < 0.6 && a.bandLabel === b.bandLabel) return;
    changes.push({
      kind: b.tempC > a.tempC ? "thermal_up" : "thermal_down",
      label: `${b.name} temperature`,
      sub: `${b.loadCount} IT device${b.loadCount === 1 ? "" : "s"} · ${b.coolerCount - b.failedCoolerCount}/${b.coolerCount} cooling online`,
      from: `${a.tempC.toFixed(1)} °C (${a.bandLabel})`,
      to: `${b.tempC.toFixed(1)} °C (${b.bandLabel})`,
      detail: b.tempC > a.tempC
        ? `Rose ${(b.tempC - a.tempC).toFixed(1)} °C over ${formatDuration(Math.abs(dt))}`
        : `Fell ${(a.tempC - b.tempC).toFixed(1)} °C — cooling recovered`,
      cost: 0, affected: [],
    });
  });

  const dDown = to.counts.down - from.counts.down;
  const dDeg = to.counts.degraded - from.counts.degraded;
  if (dDown !== 0 || dDeg !== 0) {
    changes.push({
      kind: dDown > 0 ? "availability_down" : "availability_up",
      label: "Availability",
      sub: `${to.counts.total} devices tracked`,
      from: `${from.counts.down} down · ${from.counts.degraded} degraded`,
      to: `${to.counts.down} down · ${to.counts.degraded} degraded`,
      detail: dDown > 0
        ? `${dDown} more device${dDown === 1 ? "" : "s"} went fully offline`
        : `${Math.abs(dDown)} device${Math.abs(dDown) === 1 ? "" : "s"} came back online`,
      cost: 0, affected: [],
    });
  }

  const costDelta = to.totals.total - from.totals.total;
  if (Math.abs(costDelta) > 0.005) {
    changes.push({
      kind: costDelta > 0 ? "cost_up" : "cost_down",
      label: "Cumulative cost of failure",
      sub: `over ${formatDuration(Math.abs(dt))} of simulated time`,
      from: formatCurrency(from.totals.total),
      to: formatCurrency(to.totals.total),
      detail: `${costDelta > 0 ? "+" : "−"}${formatCurrency(Math.abs(costDelta))} — burn rate now ${formatCurrency(to.totals.burnPerHour)}/hr`,
      cost: Math.max(0, costDelta), affected: [],
    });
  }

  return { from, to, dt, changes, costDelta };
}

// ── formatting ────────────────────────────────────────────────────────────
export function formatCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `$${Math.round(n).toLocaleString()}`;
  if (abs >= 100) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

export function formatDuration(sec) {
  if (!Number.isFinite(sec)) return "never";
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), rs = s % 60;
  if (m < 60) return rs ? `${m}m ${rs}s` : `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  if (h < 24) return rm ? `${h}h ${rm}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

// The sim clock is a stopwatch -- elapsed time since the run started -- so
// it is NOT wrapped to a day. A failure left for thirty hours should read
// 30:00:00, not 06:00:00.
export function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

// Durations (how long something has been down) already have their own
// formatter above -- formatDuration -- and are plain elapsed spans, so they
// are never wrapped to a day the way the clock is.

// ═══════════════════════════════════════════════════════════════════════════
// 3 · SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

function Micro({ text, T, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: "0.1em",
      textTransform: "uppercase", padding: "10px 0 7px", ...style,
    }}>{text}</div>
  );
}

function Row({ label, value, color, T, mono = true, title }) {
  return (
    <div title={title} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "4px 0", borderBottom: `1px solid ${T.borderSubtle}`, gap: 10,
    }}>
      <span style={{ fontSize: 11.5, color: T.textSecondary, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{
        fontSize: 11.5, color: color ?? T.textPrimary, fontWeight: 500,
        fontFamily: mono ? MONO_FONT : UI_FONT, textAlign: "right",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, color, T, sub }) {
  return (
    <div style={{
      background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`,
      borderRadius: 7, padding: "8px 6px 7px", textAlign: "center", minWidth: 0,
    }}>
      <div style={{
        fontSize: 17, fontWeight: 700, fontFamily: MONO_FONT, lineHeight: 1.05,
        color: color || T.textPrimary, overflow: "hidden", textOverflow: "ellipsis",
      }}>{value}</div>
      <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 8.5, color: T.textMuted, marginTop: 1, opacity: 0.75 }}>{sub}</div>}
    </div>
  );
}

function Meter({ value, max, color, T, height = 6, segments }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div style={{
      position: "relative", height, borderRadius: height / 2,
      background: T.bgElevated, overflow: "hidden", border: `1px solid ${T.borderSubtle}`,
    }}>
      <div style={{
        position: "absolute", inset: 0, width: `${pct * 100}%`,
        background: segments || color, borderRadius: height / 2, transition: "width .4s ease",
      }} />
    </div>
  );
}

function TabBar({ tabs, active, onChange, T }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            flex: 1, padding: "5px 4px", borderRadius: 5, cursor: "pointer",
            fontSize: 10.5, fontFamily: UI_FONT, whiteSpace: "nowrap",
            border: `1px solid ${on ? T.accent : "transparent"}`,
            background: on ? T.accentSoft : "transparent",
            color: on ? T.accent : T.textSecondary,
            fontWeight: on ? 600 : 500, letterSpacing: "0.04em",
            textTransform: "uppercase", transition: "all .15s",
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

/** Draggable, minimisable floating panel that matches the console chrome. */
export function FloatingPanel({
  title, subtitle, icon, accent, T, width = 340, defaultPos, onClose, children, footer,
}) {
  const [pos, setPos] = useState(defaultPos || { x: 16, y: 90 });
  const [minimized, setMinimized] = useState(false);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onHeaderDown = useCallback((e) => {
    if (e.button !== 0 || e.target.closest("button") || e.target.closest("input") || e.target.closest(".ant-select")) return;
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - width - 8, e.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - offset.current.y)),
      });
    };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [width]);

  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, width, zIndex: 90,
      maxHeight: minimized ? 46 : "calc(100vh - 120px)",
      display: "flex", flexDirection: "column",
      background: T.bgSecondary, border: `1px solid ${T.borderSubtle}`,
      borderRadius: 10, boxShadow: T.shadow, overflow: "hidden",
      fontFamily: UI_FONT, transition: "max-height .25s cubic-bezier(.4,0,.2,1)",
    }}>
      <div onMouseDown={onHeaderDown} style={{
        display: "flex", alignItems: "center", gap: 9, padding: "9px 10px",
        background: T.bgTertiary, borderBottom: minimized ? "none" : `1px solid ${T.borderSubtle}`,
        cursor: "grab", userSelect: "none", flexShrink: 0,
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          background: `${accent}22`, border: `1px solid ${accent}55`, color: accent,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>{icon}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 600, color: T.textPrimary, lineHeight: 1.25,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontSize: 10, color: T.textMuted, fontFamily: MONO_FONT, marginTop: 1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{subtitle}</div>
          )}
        </div>
        <button onClick={() => setMinimized((m) => !m)} title={minimized ? "Expand" : "Collapse"} style={{
          width: 22, height: 22, borderRadius: 5, border: `1px solid ${T.borderSubtle}`,
          background: "transparent", color: T.textMuted, cursor: "pointer", fontSize: 9,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>{minimized ? "▲" : "▼"}</button>
        <button onClick={onClose} title="Close" style={{
          width: 22, height: 22, borderRadius: 5, border: `1px solid ${T.borderSubtle}`,
          background: "transparent", color: T.textMuted, cursor: "pointer", fontSize: 11,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>×</button>
      </div>

      {!minimized && (
        <div className="dcim-panel-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 12px 14px" }}>
          {children}
        </div>
      )}
      {!minimized && footer}
      <style>{`
        .dcim-panel-scroll::-webkit-scrollbar { width: 5px; }
        .dcim-panel-scroll::-webkit-scrollbar-thumb { background: ${T.borderDefault}; border-radius: 4px; }
        .dcim-panel-scroll { scrollbar-width: thin; scrollbar-color: ${T.borderDefault} transparent; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4 · IMPACT TRACKER PANEL
// ═══════════════════════════════════════════════════════════════════════════

// Sim clock speeds, expressed as "how much simulated time passes per real
// second". The spread runs from slow-motion (for watching a cascade step by
// step) up to a full day per second (for MTTR / burn-rate over a long
// outage), so an incident can be replayed at whatever scale it happens on.
const SPEED_OPTIONS = [
  { value: 1, label: "1× — real time (1 sec/sec)" },
  { value: 0.25, label: "0.25× — slow motion" },
  { value: 0.5, label: "0.5× — half speed" },
  { value: 5, label: "5× — 5 sec/sec" },
  { value: 10, label: "10× — 10 sec/sec" },
  { value: 30, label: "30× — 30 sec/sec" },
  { value: 60, label: "60× — 1 min/sec" },
  { value: 120, label: "120× — 2 min/sec" },
  { value: 300, label: "300× — 5 min/sec" },
  { value: 600, label: "600× — 10 min/sec" },
  { value: 900, label: "900× — 15 min/sec" },
  { value: 1800, label: "1800× — 30 min/sec" },
  { value: 3600, label: "3600× — 1 hr/sec" },
  { value: 21600, label: "21600× — 6 hr/sec" },
  { value: 86400, label: "86400× — 1 day/sec" },
];

export function ImpactTrackerPanel({
  T, report, failures, simSeconds, running, speed,
  onToggleRun, onSetSpeed, onReset, onClearFailure, onClearAll, onFocusDevice,
  costModel, onCostChange, onClose,
}) {
  const [tab, setTab] = useState("live");
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape" && zoom) { e.stopPropagation(); setZoom(null); } };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [zoom]);

  const totals = report?.totals || {};
  const counts = report?.counts || { ok: 0, degraded: 0, down: 0, failed: 0, total: 0 };
  const hottest = report?.hottestRoom;
  const impacts = report?.impacts || [];
  const pro = impacts.filter((i) => i.type === "pro").length;
  const warn = impacts.filter((i) => i.type === "warn").length;
  const con = impacts.filter((i) => i.type === "con").length;

  const impactColor = { pro: T.ok, warn: T.warn, con: T.critical };
  const impactBg = { pro: `${T.ok}14`, warn: `${T.warn}14`, con: `${T.critical}14` };
  const impactLabel = { pro: "Healthy", warn: "Caution", con: "Risk" };

  return (
    <FloatingPanel
      T={T} accent="#a855f7" width={352}
      icon={<i className="fas fa-chart-line" />}
      title="Failure Impact Tracker"
      subtitle={`T+${formatClock(simSeconds)} · ${counts.failed} injected · ${counts.down} down · ${counts.degraded} degraded`}
      defaultPos={{ x: 16, y: 96 }}
      onClose={onClose}
    >
      {/* ── Transport controls ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginTop: 4, marginBottom: 10,
        background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`, borderRadius: 7, padding: "6px 8px",
      }}>
        <button onClick={onToggleRun} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 5,
          border: `1px solid ${running ? T.warn : T.ok}`,
          background: running ? `${T.warn}1f` : `${T.ok}1f`,
          color: running ? T.warn : T.ok, cursor: "pointer",
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", fontFamily: UI_FONT,
        }}>
          <i className={`fas fa-${running ? "pause" : "play"}`} style={{ fontSize: 9 }} />
          {running ? "PAUSE" : "RUN"}
        </button>
        <button onClick={onReset} title="Reset the simulated clock and clear every injected failure" style={{
          padding: "4px 9px", borderRadius: 5, border: `1px solid ${T.borderSubtle}`,
          background: "transparent", color: T.textSecondary, cursor: "pointer",
          fontSize: 10.5, fontWeight: 600, fontFamily: UI_FONT,
        }}>RESET</button>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em",
          padding: "1px 5px", borderRadius: 3, marginRight: 6,
          color: running ? T.ok : T.textMuted,
          border: `1px solid ${running ? T.ok : T.borderSubtle}`,
        }}>{speed === 1 ? "REAL TIME" : `${speed}×`}</span>
        <span
          title={speed === 1
            ? "Elapsed since the run started — one second here is one real second"
            : `Elapsed since the run started, running at ${speed}× real time`}
          style={{ fontSize: 13, fontFamily: MONO_FONT, fontWeight: 600, color: running ? T.accent : T.textSecondary }}
        >
          T+{formatClock(simSeconds)}
        </span>
      </div>

      <Select
        size="small" style={{ width: "100%", marginBottom: 10 }}
        value={speed} onChange={onSetSpeed} options={SPEED_OPTIONS}
        listHeight={260} showSearch optionFilterProp="label"
        title="How much simulated time passes per real second. At 1× the clock is the real clock."
        placeholder="Sim speed"
      />

      <TabBar T={T} active={tab} onChange={setTab} tabs={[
        { key: "live", label: "Live" },
        { key: "incidents", label: "Incidents" },
        { key: "model", label: "Cost" },
      ]} />

      {/* ═══ LIVE ═══ */}
      {tab === "live" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
            <Stat T={T} label="Cost of failure" value={formatCurrency(totals.total || 0)}
              color={totals.total > 0 ? T.critical : T.ok} sub={`${formatCurrency(totals.burnPerHour || 0)}/hr`} />
            <Stat T={T} label="Devices down" value={`${counts.down}/${counts.total}`}
              color={counts.down > 0 ? T.critical : T.ok} sub={`${counts.degraded} degraded`} />
            <Stat T={T} label="Hottest room" value={hottest ? `${hottest.tempC.toFixed(1)}°` : "—"}
              color={hottest ? hottest.band.color : T.textMuted} sub={hottest ? hottest.band.label : "no rooms"} />
          </div>

          {/* Cost breakdown */}
          <Micro T={T} text="Cost breakdown" />
          <Row T={T} label="Lost revenue" value={formatCurrency(totals.downtimeCost || 0)} color={totals.downtimeCost ? T.critical : T.textMuted} />
          <Row T={T} label="SLA penalties" value={formatCurrency(totals.slaCost || 0)} color={totals.slaCost ? T.critical : T.textMuted} />
          <Row T={T} label="Thermal wear" value={formatCurrency(totals.thermalCost || 0)} color={totals.thermalCost ? T.warn : T.textMuted} />
          <Row T={T} label="Emergency call-out" value={formatCurrency(totals.calloutCost || 0)} color={totals.calloutCost ? T.warn : T.textMuted} />
          <Row T={T} label="Projected +15 min" value={formatCurrency(totals.projected15m || 0)} />
          <Row T={T} label="Projected +1 hr" value={formatCurrency(totals.projected1h || 0)} />
          <Row T={T} label="Projected +4 hr" value={formatCurrency(totals.projected4h || 0)} color={totals.projected4h > 0 ? T.critical : undefined} />

          {/* Rooms */}
          {report?.rooms?.length > 0 && (
            <>
              <Micro T={T} text={`Room thermal state (${report.rooms.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {report.rooms.map((r) => (
                  <div key={r.id} style={{
                    border: `1px solid ${T.borderSubtle}`, borderLeft: `3px solid ${r.band.color}`,
                    borderRadius: 6, padding: "7px 9px", background: T.bgTertiary,
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: T.textPrimary, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.name}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO_FONT, color: r.band.color }}>
                        {r.tempC.toFixed(1)}°C
                      </span>
                    </div>
                    <div style={{ margin: "5px 0 4px" }}>
                      <Meter T={T} value={r.tempC - 16} max={24} height={5}
                        segments={`linear-gradient(90deg, ${T.ok} 0%, ${T.warn} 55%, ${T.critical} 100%)`} />
                    </div>
                    <div style={{ fontSize: 9.5, color: T.textMuted, fontFamily: MONO_FONT, lineHeight: 1.5 }}>
                      {r.coolerCount - r.failedCoolerCount}/{r.coolerCount || 0} cooling online ·{" "}
                      {r.loadCount} IT · {Math.round(r.loadKw)} kW
                    </div>
                    {r.coolingLostFrac > 0 && (
                      <div style={{ fontSize: 9.5, color: r.band.color, fontFamily: MONO_FONT, marginTop: 2 }}>
                        {r.shutdownElapsed > 0
                          ? `Shutting down for ${formatDuration(r.shutdownElapsed)}`
                          : r.throttleElapsed > 0
                            ? `Throttling · shutdown in ${formatDuration(r.secondsToShutdown)}`
                            : `Throttle in ${formatDuration(r.secondsToThrottle)}`}
                      </div>
                    )}
                    {r.noCooling && (
                      <div style={{ fontSize: 9.5, color: T.warn, fontFamily: MONO_FONT, marginTop: 2 }}>
                        No cooling device placed in this room
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Impact read-out */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "12px 0 7px" }}>
            <Micro T={T} text="Impact analysis" style={{ padding: 0 }} />
            <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <span style={{ fontSize: 9.5, background: `${T.ok}1f`, color: T.ok, padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>{pro}✓</span>
              <span style={{ fontSize: 9.5, background: `${T.warn}1f`, color: T.warn, padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>{warn}!</span>
              <span style={{ fontSize: 9.5, background: `${T.critical}1f`, color: T.critical, padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>{con}✗</span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {impacts.map((it, i) => (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "6px 8px", borderRadius: 6, background: impactBg[it.type],
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: impactColor[it.type], flexShrink: 0, marginTop: 5 }} />
                <span style={{ flex: 1, fontSize: 11, color: T.textPrimary, lineHeight: 1.45 }}>
                  {it.text}
                  <span style={{
                    marginLeft: 6, padding: "0 5px", borderRadius: 7, fontSize: 9,
                    fontWeight: 600, background: `${impactColor[it.type]}22`, color: impactColor[it.type],
                  }}>{impactLabel[it.type]}</span>
                </span>
              </div>
            ))}
          </div>

        </>
      )}

      {/* ═══ INCIDENTS ═══ */}
      {tab === "incidents" && (
        <>
          <Micro T={T} text={`Injected failures (${report?.incidents?.length || 0})`} />
          {!report?.incidents?.length ? (
            <div style={{ textAlign: "center", padding: "26px 12px", color: T.textMuted, fontSize: 11.5, lineHeight: 1.6 }}>
              No failures injected.<br />
              Switch to <b style={{ color: T.critical }}>Simulate</b> mode and click a device to take it offline.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.incidents.map((inc) => {
                  const rm = ROLE_META[inc.role] || ROLE_META.aux;
                  return (
                    <div key={inc.id} style={{
                      border: `1px solid ${T.critical}44`, borderLeft: `3px solid ${T.critical}`,
                      borderRadius: 7, overflow: "hidden", background: T.bgTertiary,
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 7, padding: "7px 9px",
                        borderBottom: `1px solid ${T.borderSubtle}`,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.critical, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: T.textPrimary, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {inc.name}
                        </span>
                        <span style={{ fontSize: 9, color: rm.color, border: `1px solid ${rm.color}55`, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>
                          {rm.label}
                        </span>
                      </div>
                      <div style={{ padding: "7px 9px", fontSize: 10.5, color: T.textSecondary, lineHeight: 1.6 }}>
                        <div style={{ fontFamily: MONO_FONT, color: T.textMuted }}>
                          {inc.typeName ? `${inc.typeName} · ` : ""}{inc.roomName} · down {formatDuration(inc.durationSec)}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          Cascade: <b style={{ color: inc.cascadeCount ? T.critical : T.ok }}>{inc.cascadeCount}</b> downstream device{inc.cascadeCount === 1 ? "" : "s"} affected
                          {inc.cascadeCount === 0 && (
                            <span style={{ color: T.ok }}> — redundancy held</span>
                          )}
                        </div>

                        {/* what this failure costs: itself, plus its blast radius */}
                        <div style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 6,
                        }}>
                          <div style={{
                            background: `${T.critical}12`, border: `1px solid ${T.critical}33`,
                            borderRadius: 5, padding: "5px 7px",
                          }}>
                            <div style={{ fontSize: 8.5, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              Total impact
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO_FONT, color: T.critical }}>
                              {formatCurrency(inc.blastCost ?? inc.directCost)}
                            </div>
                            <div style={{ fontSize: 8.5, color: T.textMuted, fontFamily: MONO_FONT }}>
                              incl. {inc.cascadeCount} downstream
                            </div>
                          </div>
                          <div style={{
                            background: `${T.warn}12`, border: `1px solid ${T.warn}33`,
                            borderRadius: 5, padding: "5px 7px",
                          }}>
                            <div style={{ fontSize: 8.5, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              Elapsed
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO_FONT, color: T.warn }}>
                              {formatDuration(inc.durationSec)}
                            </div>
                            <div style={{ fontSize: 8.5, color: T.textMuted, fontFamily: MONO_FONT }}>
                              {formatCurrency(inc.blastBurnPerHour || 0)}/hr downstream
                            </div>
                          </div>
                        </div>

                        {/* who exactly went down because of this, and for how long */}
                        {inc.victims?.length > 0 && (
                          <div style={{ marginTop: 7 }}>
                            <div style={{
                              fontSize: 8.5, color: T.textMuted, letterSpacing: "0.06em",
                              textTransform: "uppercase", marginBottom: 3,
                            }}>Knocked offline by this</div>
                            {inc.victims.map((v) => {
                              const vm = SEVERITY_META[v.severity] || SEVERITY_META.critical;
                              return (
                                <div
                                  key={v.id}
                                  onClick={() => onFocusDevice(v.id)}
                                  title={`${v.name}${v.typeName ? ` (${v.typeName})` : ""} — ${v.why}`}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "3px 5px", borderRadius: 4, cursor: "pointer",
                                    background: `${vm.color}0e`, marginBottom: 2,
                                  }}
                                >
                                  <span style={{
                                    width: 5, height: 5, borderRadius: "50%",
                                    background: vm.color, flexShrink: 0,
                                  }} />
                                  <span style={{
                                    flex: 1, minWidth: 0, fontSize: 10, color: T.textPrimary,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}>{v.name}</span>
                                  <span style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted, flexShrink: 0 }}>
                                    {formatDuration(v.downSec)}
                                  </span>
                                  <span style={{
                                    fontSize: 9, fontFamily: MONO_FONT, color: vm.color,
                                    fontWeight: 600, flexShrink: 0, minWidth: 42, textAlign: "right",
                                  }}>{formatCurrency(v.cost)}</span>
                                </div>
                              );
                            })}
                            {inc.cascadeCount > inc.victims.length && (
                              <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                                +{inc.cascadeCount - inc.victims.length} more downstream
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                          <button onClick={() => onFocusDevice(inc.id)} style={{
                            padding: "3px 9px", borderRadius: 5, border: `1px solid ${T.borderSubtle}`,
                            background: "transparent", color: T.accent, cursor: "pointer", fontSize: 10, fontWeight: 600,
                          }}>Focus</button>
                          <button onClick={() => onClearFailure(inc.id)} style={{
                            padding: "3px 9px", borderRadius: 5, border: `1px solid ${T.ok}55`,
                            background: `${T.ok}14`, color: T.ok, cursor: "pointer", fontSize: 10, fontWeight: 600,
                          }}>Restore</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={onClearAll} style={{
                width: "100%", marginTop: 10, padding: "7px", borderRadius: 6,
                border: `1px solid ${T.ok}55`, background: `${T.ok}12`, color: T.ok,
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: UI_FONT,
              }}>Restore everything</button>
            </>
          )}

          {/* Affected (non-injected) devices */}
          {report && (() => {
            const cascaded = [...report.devices.values()].filter((s) => s.severity !== "ok" && !failures[s.id]);
            if (!cascaded.length) return null;
            return (
              <>
                <Micro T={T} text={`Cascade victims (${cascaded.length})`} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {cascaded.map((s) => {
                    const sm = SEVERITY_META[s.severity];
                    return (
                      <div key={s.id} onClick={() => onFocusDevice(s.id)} style={{
                        display: "flex", alignItems: "center", gap: 7, padding: "5px 8px",
                        borderRadius: 6, background: `${sm.color}10`, cursor: "pointer",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sm.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 9.5, color: T.textMuted, fontFamily: MONO_FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.causes[0]?.text || "—"}
                          </div>
                        </div>
                        <span style={{ fontSize: 9.5, color: sm.color, fontFamily: MONO_FONT, fontWeight: 600, flexShrink: 0 }}>
                          {formatCurrency(s.cost)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* Snapshot / Compare tabs were removed: the simulation is now focused on
          one question — what does THIS failure take down, for how long, and at
          what cost. */}

      {/* ═══ COST MODEL ═══ */}
      {tab === "model" && (
        <>
          <Micro T={T} text="Cost assumptions" />
          <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.55, marginBottom: 10 }}>
            Every number the tracker reports is derived from these rates. Change one and the whole
            simulation re-prices instantly, including every failure already injected.
          </div>
          {[
            { k: "rackRevenuePerHour", label: "IT rack revenue", suffix: "$/hr", step: 1, min: 0, max: 100000 },
            { k: "networkRevenuePerHour", label: "Network device revenue", suffix: "$/hr", step: 1, min: 0, max: 100000 },
            { k: "auxRevenuePerHour", label: "Auxiliary device revenue", suffix: "$/hr", step: 1, min: 0, max: 100000 },
            { k: "slaBreachPerHour", label: "SLA breach penalty", suffix: "$/hr", step: 10, min: 0, max: 1000000 },
            { k: "slaGraceMinutes", label: "SLA grace window", suffix: "min", step: 1, min: 0, max: 240 },
            { k: "thermalWearPerDegHour", label: "Thermal wear", suffix: "$/°C·hr", step: 1, min: 0, max: 10000 },
            { k: "emergencyCallout", label: "Emergency call-out", suffix: "$ each", step: 25, min: 0, max: 100000 },
            { k: "kwPerRack", label: "Load per IT rack", suffix: "kW", step: 0.5, min: 0.5, max: 60 },
            { k: "energyPerKwh", label: "Energy tariff", suffix: "$/kWh", step: 0.01, min: 0, max: 10 },
          ].map((f) => (
            <div key={f.k} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10.5, color: T.textSecondary, marginBottom: 3 }}>{f.label}</div>
              <InputNumber
                size="small" style={{ width: "100%" }} addonAfter={f.suffix}
                value={costModel[f.k]} step={f.step} min={f.min} max={f.max}
                onChange={(v) => onCostChange({ ...costModel, [f.k]: v ?? 0 })}
              />
            </div>
          ))}
          <button onClick={() => onCostChange({ ...DEFAULT_COST_MODEL })} style={{
            width: "100%", marginTop: 6, padding: "7px", borderRadius: 6,
            border: `1px solid ${T.borderSubtle}`, background: "transparent", color: T.textSecondary,
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: UI_FONT,
          }}>Reset to defaults</button>
        </>
      )}

      {/* ── Snapshot lightbox ── */}
      {zoom && (
        <div onClick={() => setZoom(null)} style={{
          position: "fixed", inset: 0, zIndex: 999999, background: "rgba(5,8,20,.92)",
          backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "min(92vw, 940px)", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,.7)", background: T.bgSecondary,
          }}>
            <div style={{
              padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: `1px solid ${T.borderSubtle}`, background: T.bgTertiary,
            }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.textPrimary }}>{zoom.label}</div>
                <div style={{ fontSize: 10, color: T.textMuted, fontFamily: MONO_FONT }}>
                  Sim {formatClock(zoom.simSeconds)} · captured {zoom.wallClock}
                </div>
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <a href={zoom.screenshot} download={`${zoom.label.replace(/\s+/g, "-")}-impact-snapshot.jpg`}
                  onClick={(e) => e.stopPropagation()} style={{
                    padding: "4px 11px", borderRadius: 6, fontSize: 10.5, fontWeight: 600,
                    background: T.accentSoft, color: T.accent, border: `1px solid ${T.accent}55`,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
                  }}>
                  <i className="fas fa-download" style={{ fontSize: 10 }} /> Download
                </a>
                <button onClick={() => setZoom(null)} style={{
                  width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.critical}55`,
                  background: `${T.critical}18`, color: T.critical, cursor: "pointer", fontSize: 13,
                }}>×</button>
              </div>
            </div>
            <img src={zoom.screenshot} alt={zoom.label}
              style={{ width: "100%", maxHeight: "64vh", objectFit: "contain", display: "block", background: "#0a0f1e" }} />
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0,
              borderTop: `1px solid ${T.borderSubtle}`, background: T.bgTertiary, padding: "9px 14px",
            }}>
              {[
                { l: "Cost", v: formatCurrency(zoom.totals.total), c: zoom.totals.total ? T.critical : T.ok },
                { l: "Burn / hr", v: formatCurrency(zoom.totals.burnPerHour), c: T.warn },
                { l: "Down", v: `${zoom.counts.down}/${zoom.counts.total}`, c: zoom.counts.down ? T.critical : T.ok },
                { l: "Degraded", v: String(zoom.counts.degraded), c: zoom.counts.degraded ? T.warn : T.ok },
                { l: "Hottest", v: zoom.hottestTemp != null ? `${zoom.hottestTemp.toFixed(1)}°C` : "—", c: zoom.hottestColor || T.textMuted },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center", borderLeft: i ? `1px solid ${T.borderSubtle}` : "none" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO_FONT, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </FloatingPanel>
  );
}

function to_meta(diff, id) {
  const m = diff.to.deviceMeta[id] || diff.from.deviceMeta[id];
  return m?.name || id;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5 · CAPACITY PLANNER PANEL
// ═══════════════════════════════════════════════════════════════════════════

export function CapacityPanel({
  T, predictions, selectedRoomId, onSelectRoom, onFocusRoom,
  showPreview, onTogglePreview, tuning, onTuningChange, onClose,
}) {
  const [tab, setTab] = useState("plan");
  const pred = predictions.find((p) => p.roomId === selectedRoomId) || predictions[0] || null;

  const totalPlanned = predictions.reduce((s, p) => s + (p.planned || 0), 0);
  const totalPlaced = predictions.reduce((s, p) => s + (p.placedCount || 0), 0);
  const totalKw = predictions.reduce((s, p) => s + (p.plannedKw || 0), 0);

  const bindingColor = { space: T.accent, power: T.warn, cooling: "#22d3ee" };

  return (
    <FloatingPanel
      T={T} accent="#22c55e" width={340}
      icon={<i className="fas fa-ruler-combined" />}
      title="Capacity Planner"
      subtitle={`${predictions.length} room${predictions.length === 1 ? "" : "s"} · ${totalPlaced}/${totalPlanned} placed · ${Math.round(totalKw)} kW planned`}
      defaultPos={{ x: Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1400) - 372), y: 220 }}
      onClose={onClose}
    >
      {/* Room picker */}
      <Micro T={T} text="Room" style={{ padding: "4px 0 6px" }} />
      <Select
        size="small" style={{ width: "100%" }}
        value={pred?.roomId ?? undefined}
        placeholder="Select a room…"
        onChange={(v) => onSelectRoom(v)}
        options={predictions.map((p) => ({
          value: p.roomId,
          label: `${p.roomName} — ${p.nonPlaceable ? "corridor" : `${p.planned} ${p.profile.units}`}`,
        }))}
      />

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={() => pred && onFocusRoom(pred.roomId)} style={{
          flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.borderSubtle}`,
          background: "transparent", color: T.accent, cursor: "pointer", fontSize: 10.5,
          fontWeight: 600, fontFamily: UI_FONT,
        }}>Focus room</button>
        <button onClick={onTogglePreview} style={{
          flex: 1, padding: "6px", borderRadius: 6,
          border: `1px solid ${showPreview ? T.ok : T.borderSubtle}`,
          background: showPreview ? `${T.ok}18` : "transparent",
          color: showPreview ? T.ok : T.textSecondary, cursor: "pointer",
          fontSize: 10.5, fontWeight: 600, fontFamily: UI_FONT,
        }}>{showPreview ? "Hide 3D plan" : "Show 3D plan"}</button>
      </div>

      {!pred ? (
        <div style={{ textAlign: "center", padding: "30px 12px", color: T.textMuted, fontSize: 11.5, lineHeight: 1.6 }}>
          No rooms yet.<br />Draw one with the <b>Draw Room</b> tool, then come back for a capacity prediction.
        </div>
      ) : pred.nonPlaceable ? (
        <div style={{ textAlign: "center", padding: "30px 12px", color: T.textMuted, fontSize: 11.5, lineHeight: 1.6 }}>
          <i className="fas fa-road" style={{ fontSize: 20, opacity: 0.4, display: "block", marginBottom: 8 }} />
          {pred.roomName} is a corridor — circulation space, so nothing is planned into it.
        </div>
      ) : (
        <>
          <div style={{ marginTop: 12 }}>
            <TabBar T={T} active={tab} onChange={setTab} tabs={[
              { key: "plan", label: "Prediction" },
              { key: "bom", label: "Ancillary" },
              { key: "tune", label: "Assumptions" },
            ]} />
          </div>

          {/* ═══ PREDICTION ═══ */}
          {tab === "plan" && (
            <>
              <div style={{
                marginTop: 12, padding: "12px 10px 11px", borderRadius: 9, textAlign: "center",
                background: T.bgTertiary, border: `1px solid ${T.ok}44`,
              }}>
                <div style={{ fontSize: 9.5, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em" }}>
                  Recommended capacity
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 7, marginTop: 5 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, fontFamily: MONO_FONT, lineHeight: 1, color: T.ok }}>
                    {pred.planned}
                  </span>
                  <span style={{ fontSize: 13, color: T.textSecondary }}>{pred.profile.units}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5, fontFamily: MONO_FONT }}>
                  hard max {pred.hardMax} · {Math.round((1 - PLANNING_HEADROOM) * 100)}% growth headroom held back
                </div>
                {pred.plannedKw > 0 && (
                  <div style={{ fontSize: 10.5, color: T.warn, marginTop: 4, fontFamily: MONO_FONT }}>
                    {Math.round(pred.plannedKw)} kW IT load at {pred.kwPerUnit} kW / {pred.profile.unit}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
                <Stat T={T} label="Placed" value={String(pred.placedCount)}
                  color={pred.placedCount > pred.planned ? T.critical : T.accent} />
                <Stat T={T} label="Remaining" value={String(pred.remaining)}
                  color={pred.remaining > 0 ? T.ok : T.warn} />
                <Stat T={T} label="Utilised" value={`${Math.round(pred.utilization * 100)}%`}
                  color={pred.utilization >= 1 ? T.critical : pred.utilization >= 0.85 ? T.warn : T.ok} />
              </div>

              <div style={{ marginTop: 9 }}>
                <Meter T={T} value={pred.placedCount} max={Math.max(pred.planned, 1)} height={7}
                  color={pred.utilization >= 1 ? T.critical : pred.utilization >= 0.85 ? T.warn : T.ok} />
              </div>

              {/* Binding constraint */}
              <Micro T={T} text="Binding constraint" />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {pred.candidates.map((c) => {
                  const isBinding = c.key === pred.binding.key;
                  const col = bindingColor[c.key] || T.textSecondary;
                  return (
                    <div key={c.key} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 6,
                      background: isBinding ? `${col}14` : T.bgTertiary,
                      border: `1px solid ${isBinding ? `${col}55` : T.borderSubtle}`,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: T.textPrimary, fontWeight: isBinding ? 600 : 400 }}>
                          {c.label}
                          {isBinding && (
                            <span style={{
                              marginLeft: 6, fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em",
                              textTransform: "uppercase", color: col, background: `${col}22`,
                              borderRadius: 6, padding: "1px 5px",
                            }}>binding</span>
                          )}
                        </div>
                        <div style={{ fontSize: 9.5, color: T.textMuted, fontFamily: MONO_FONT }}>{c.detail}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO_FONT, color: col, flexShrink: 0 }}>
                        {c.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Layout geometry */}
              <Micro T={T} text="Layout" />
              <Row T={T} label="Rows × per row" value={`${pred.layout.rows} × ${pred.layout.perRow}`} color={T.accent} />
              <Row T={T} label="Aisles" value={String(pred.layout.aisles)} />
              <Row T={T} label={`${pred.profile.unit} footprint`}
                value={`${pred.profile.footprint.widthMm} × ${pred.profile.footprint.depthMm} mm`} />
              <Row T={T} label="Room area" value={`${pred.areaM2.toFixed(1)} m²`} />
              <Row T={T} label="Usable envelope"
                value={`${pred.usableW.toFixed(2)} × ${pred.usableL.toFixed(2)} m`} color={T.ok} />
              <Row T={T} label="Usable area" value={`${pred.usableAreaM2.toFixed(1)} m²`} />
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6, lineHeight: 1.5, fontFamily: MONO_FONT }}>
                {pred.layout.note}
              </div>

              {/* Warnings */}
              {pred.warnings.length > 0 && (
                <>
                  <Micro T={T} text={`Planner notes (${pred.warnings.length})`} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {pred.warnings.map((w, i) => {
                      const c = w.sev === "critical" ? T.critical : w.sev === "warn" ? T.warn : T.accent;
                      return (
                        <div key={i} style={{
                          display: "flex", gap: 7, alignItems: "flex-start",
                          padding: "6px 8px", borderRadius: 6, background: `${c}12`,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0, marginTop: 5 }} />
                          <span style={{ fontSize: 10.5, color: T.textPrimary, lineHeight: 1.45 }}>{w.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══ ANCILLARY BOM ═══ */}
          {tab === "bom" && (
            <>
              <Micro T={T} text="What this room then needs" />
              <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.55, marginBottom: 9 }}>
                Derived from the {pred.planned} planned {pred.profile.units} — the supporting infrastructure
                you have to budget for alongside them.
              </div>
              {pred.ancillary.length === 0 ? (
                <div style={{ textAlign: "center", padding: 22, color: T.textMuted, fontSize: 11 }}>
                  Nothing to derive until the room can hold at least one {pred.profile.unit}.
                </div>
              ) : pred.ancillary.map((a, i) => (
                <Row key={i} T={T}
                  label={a.label}
                  title={a.note}
                  value={`${a.value.toLocaleString()}${a.suffix || ""}`}
                  color={T.accent} />
              ))}
              {pred.ancillary.some((a) => a.note) && (
                <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 3 }}>
                  {pred.ancillary.filter((a) => a.note).map((a, i) => (
                    <div key={i} style={{ fontSize: 9.5, color: T.textMuted, fontFamily: MONO_FONT }}>
                      {a.label}: {a.note}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ ASSUMPTIONS ═══ */}
          {tab === "tune" && (
            <>
              <Micro T={T} text="Planning assumptions" />
              <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.55, marginBottom: 10 }}>
                These drive the prediction for <b style={{ color: T.textPrimary }}>every</b> room of this type.
                Tighten the aisles or raise the kW per unit and the counts update as you type.
              </div>
              {[
                { k: "perimeterMm", label: "Perimeter clearance", suffix: "mm", step: 50, min: 0, max: 4000 },
                ...(pred.profile.layout === "aisle" ? [
                  { k: "coldAisleMm", label: "Cold aisle width", suffix: "mm", step: 50, min: 600, max: 3600 },
                  { k: "hotAisleMm", label: "Hot aisle width", suffix: "mm", step: 50, min: 600, max: 3600 },
                ] : [
                  { k: "serviceMm", label: "Service clearance", suffix: "mm", step: 50, min: 300, max: 4000 },
                ]),
                { k: "kwPerUnit", label: `kW per ${pred.profile.unit}`, suffix: "kW", step: 0.5, min: 0, max: 60 },
                { k: "maxKwPerM2", label: "Max cooling density", suffix: "kW/m²", step: 0.1, min: 0, max: 20 },
              ].map((f) => (
                <div key={f.k} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, color: T.textSecondary, marginBottom: 3 }}>{f.label}</div>
                  <InputNumber
                    size="small" style={{ width: "100%" }} addonAfter={f.suffix}
                    value={tuning[pred.roomType]?.[f.k] ?? pred.profile[f.k]}
                    step={f.step} min={f.min} max={f.max}
                    onChange={(v) => onTuningChange(pred.roomType, { [f.k]: v ?? 0 })}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, color: T.textSecondary, marginBottom: 3 }}>
                  {pred.profile.unit} footprint (mm)
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <InputNumber size="small" style={{ flex: 1 }} addonAfter="W"
                    value={tuning[pred.roomType]?.footprint?.widthMm ?? pred.profile.footprint.widthMm}
                    step={50} min={200} max={6000}
                    onChange={(v) => onTuningChange(pred.roomType, { footprint: { widthMm: v ?? 600 } })} />
                  <InputNumber size="small" style={{ flex: 1 }} addonAfter="D"
                    value={tuning[pred.roomType]?.footprint?.depthMm ?? pred.profile.footprint.depthMm}
                    step={50} min={200} max={6000}
                    onChange={(v) => onTuningChange(pred.roomType, { footprint: { depthMm: v ?? 1100 } })} />
                </div>
              </div>
              <button onClick={() => onTuningChange(pred.roomType, null)} style={{
                width: "100%", marginTop: 6, padding: "7px", borderRadius: 6,
                border: `1px solid ${T.borderSubtle}`, background: "transparent", color: T.textSecondary,
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: UI_FONT,
              }}>Reset {pred.profile.label} assumptions</button>
            </>
          )}
        </>
      )}

      {/* All-rooms roll-up */}
      {predictions.length > 1 && (
        <>
          <Micro T={T} text="All rooms" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {predictions.map((p) => {
              const on = p.roomId === pred?.roomId;
              const col = p.nonPlaceable ? T.textMuted
                : p.utilization >= 1 ? T.critical
                  : p.utilization >= 0.85 ? T.warn : T.ok;
              return (
                <div key={p.roomId} onClick={() => onSelectRoom(p.roomId)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6,
                  cursor: "pointer", background: on ? T.accentSoft : "transparent",
                  border: `1px solid ${on ? `${T.accent}55` : "transparent"}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.roomName}
                  </span>
                  <span style={{ fontSize: 10, color: T.textMuted, fontFamily: MONO_FONT, flexShrink: 0 }}>
                    {p.nonPlaceable ? "—" : `${p.placedCount}/${p.planned}`}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </FloatingPanel>
  );

}