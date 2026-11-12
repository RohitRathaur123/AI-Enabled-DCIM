
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
// Used to bake a rack's ~150 interior part meshes down to ~6 merged ones.
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  makeTransformerBody, makeGeneratorBody, makeMainPowerPanelBody, makePowerPanelBody,
  makeUPSBody, makePDUBody, makeCracBody, makeChillerBody, makeHumidifierBody,
  makeSwitchBody, makeRouterBody, makeFirewallBody, makeCameraBody,
  makeCardReaderBody, makeBiometricBody, makePushButtonBody,
  makeFireCylinderBody, makeFireSystemBody, makeBatteryBankBody, makeIPDUBody,
  makeBuswayBody, makeTapOffBody, makeBreakerBody, makeWLDPanelBody,
  makeDoorBody, makeStairsRampBody,
  makeCoreRouterBody, makeDistSwitchBody, makeTorSwitchBody, makeIspUplinkBody,
  makeLoadBalancerBody, makeIdsIpsBody, makeConsoleServerBody,
  makePatchPanelBody, makeOdfBody, makeWanBody,
} from "./deviceBodies3d";
import { createAirflowSystem, updateAirflowSystem, disposeAirflowSystem } from "./airflow3d";
// ── Deployment chains: what feeds what, and what to place next ──────────
import DeploymentGuidePanel from "./DeploymentGuidePanel";
import { guidanceFor, primaryChain, CHAIN_COLORS } from "../dcim/chains/deploymentChains";
import {
  nextAlias, deviceLabel, deviceLabelLong, aliasTaken,
} from "../dcim/naming/deviceNaming";
import {
  Button, Tooltip, Modal, InputNumber, Input, Select, Space, Typography, message,
  notification,
  ConfigProvider, theme as antdTheme,
} from "antd";
import {
  ArrowLeftOutlined,
  BulbOutlined,
  BulbFilled,
  RotateRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DragOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  UndoOutlined,
  RedoOutlined,
  BorderTopOutlined,
  CloseOutlined,
  CompassOutlined,
  ExpandOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  TagOutlined,
  CloudOutlined,
  BorderOutlined,
  NodeIndexOutlined,
  WarningOutlined,
  FundProjectionScreenOutlined,
  RadarChartOutlined,
  DatabaseOutlined,
  FireOutlined,
  PictureOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import Toolbox, { dcimBus } from "./ToolBox";
// Simulation → tickets (shared with Ticket Management + the header's Ticket Alerts)
import { ticketStore } from "../Component/Tickets/ticketStore";
// Capture views (normal / simulated) and compare them: differences, time, cost
import SimViewComparePanel, { buildViewSnapshot } from "./SimViewCompare";
export { dcimBus };
import { AppstoreOutlined } from "@ant-design/icons";
import LayersPanel, { LayersButton, DEFAULT_LAYER_STATE } from "./Layerspanel";
// ── DEMO fixture: the "ideal datacenter" showcase floor ─────────────────
// Only reachable when the opened datacenter carries isDemo. Delete the
// import, the seeding effect below (search "IDEAL DEMO"), and the row in
// AddDataCenter.jsx to remove the feature entirely.
import { buildIdealDemoScene, describeIdealDemo } from "./idealDatacenterDemo";
import { buildIdealDemoRackSlots } from "./idealDemoRackFill";
// ── RACK VIEW: one rack isolated, opened up, with its rear cabling ──────
import {
  RACK_VIEW_LAYER,
  RACK_CABLE_ROLES,
  buildRackViewDressing,
  disposeRackViewDressing,
  planRackCords,
  rackPortCatalog,
  canPlugInto,
  roleMedium,
  rolesForMedium,
  CABLE_TYPE_GROUPS,
  portPlugPoint,
  portInDir,
  cordIdFromPick,
  paintPortMarkers,
  buildHandCable,
  disposeHandCable,
} from "./rackView3d";
// ── STORAGE view: per-U rack occupancy ──────────────────────────────────
import {
  computeRackOccupancy,
  summariseStorage,
  createRackStorageOverlay,
  disposeRackStorageOverlay,
  STORAGE_STATE,
} from "./rackStorage3d";
import {
  TILE_SIZE_MM,
  TILE_SIZE_M,
  getFootprintTiles,
  rotateFootprint,
  worldToTile,
  worldToAnchorTile,
  tileAnchorToWorldCenter,
  tileKeysForBlock,
  findFreeTileAnchor,
  canPlaceDevice,
  resolvePlacement,
  PLACEMENT_REASON_LABELS,
} from "../dcim/placement/placementEngine";

// ── Real device-image rack faces (front/back photos per U-slot) ─────────
import { getRackSlotAssignments, seedRackSlotAssignments, patchCordStore } from "../Component/RackFace/rackDeviceService";
import {
  createRackRealFaceContainers,
  createRackURailPlanes,
  populateRackRealFaces,
  setRackRealFaceVisible,
  computeTotalUnits,
} from "../Component/RackFace/RackRealFace";
import RackElevationModal from "../Component/RackFace/RackElevationModal";

// ── NEW: capacity prediction + failure-impact simulation ────────────────
import {
  predictRoomCapacity,
  computeImpactReport,
  DEFAULT_COST_MODEL,
  deviceRole,
  ROLE_META,
  SEVERITY_META,
  ImpactTrackerPanel,
  formatCurrency,
  formatClock,
} from "./Dcimintelligence";

const { Text } = Typography;

// ── Unit conversion ──────────────────────────────────────────────────────
const UNIT_TO_METERS = { m: 1, mm: 0.001, ft: 0.3048, yd: 0.9144, km: 1000 };
const MARGIN_UNIT_TO_METERS = { mm: 0.001, cm: 0.01, m: 1, ft: 0.3048, in: 0.0254 };

// ── mm-first constants ──────────────────────────────────────────────────
const MM_TO_M = 0.001;
const M_TO_MM = 1000;
const mmToM = (mm) => (mm || 0) * MM_TO_M;
const mToMm = (m) => Math.round((m || 0) * M_TO_MM);

// Raised-floor access tile: standard 600mm x 600mm — imported from the
// shared placement engine (single source of truth, see task #34).

// ── Generic placed-device visual height fallback ─────────────────────────
const DEVICE_HEIGHT_M = 1.8;

// ── Movable device long-press timing ──────────────────────────────────────
const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 6;

// ── Data-hall envelope, matched to the reference digital twin ────────────
const BUILDING_H = 4.2;
const WALL_T = 0.2;

// ── Cut-away masonry walls ───────────────────────────────────────────────
// The floor is drawn the way a datacenter floor plan is: real, solid walls,
// but sliced off at waist height so every rack, panel and cable tray inside
// stays visible from above. Full-height walls would hide the whole point of
// the view; a transparent glass box never reads as a building at all.
const PARAPET_H        = 1.5;   // outer perimeter wall, above finished floor
const ROOM_PARAPET_H   = 1.3;   // interior partitions, kept a touch lower
const PARAPET_T        = 0.26;  // wall thickness
const PARAPET_CAP_H    = 0.08;  // coping cap along the cut edge
const PARAPET_PLINTH_H = 0.1;   // skirting at the base
const FLOOR_APRON_H    = 0.55;  // exposed slab edge band around the floor

// Height of the suspended ceiling above the finished floor. Busway runs hang
// from it (makeBuswayBody builds its run 0.55 m below its own top), so the two
// have to agree or the hanger rods would end in mid-air.
const CEILING_H = 2.8;

// Raised access floor: tiles sit on a 300mm plenum over a 200mm structural
// slab, so the walkable surface — and everything placed on it — lives at
// y = FLOOR_Y, not y = 0.
const RAISED_FLOOR_H = 0.3;
const STRUCTURAL_H = 0.2;
const FLOOR_Y = RAISED_FLOOR_H;

// Rack interior: 1U = 44.45mm, equipment is 580mm wide inside a 600mm rack.
const U_HEIGHT = 0.04445;
const EQUIP_W = 0.58;

// Main entrance: a real 2.1m double door, not a building-scale opening.
const DOOR_H = 2.1;
const doorWidthFor = (oW, oL) => Math.min(2.4, oW * 0.3, oL * 0.3);

// ── Design-system typography (matches the DCIM console shell) ─────────────
const UI_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// ── default margin strip color ────────────────────────────────────────────
const DEFAULT_MARGIN_COLOR = "#ef4444";

// Placement-reason copy, extended locally so a reason the engine does not
// ship a label for still reads as a sentence instead of a raw enum.
const REASON_LABELS = {
  ...PLACEMENT_REASON_LABELS,
  OUTSIDE_BUILDING: PLACEMENT_REASON_LABELS?.OUTSIDE_BUILDING || "That falls outside the building floor",
  OVERLAPPING_ROOM: PLACEMENT_REASON_LABELS?.OVERLAPPING_ROOM || "That overlaps another room",
  DEVICE_WOULD_BE_OUTSIDE: PLACEMENT_REASON_LABELS?.DEVICE_WOULD_BE_OUTSIDE || "A device inside would end up outside the room",
  OK: "OK",
};
const reasonText = (r) => REASON_LABELS[r] || r || "Can't place here";

// ── cable / wiring types (Connect tool) ──────────────────────────────────
// power/network/fiber/cooling are load-bearing for the failure simulation
// (severity propagation keys off these 4 strings elsewhere) -- kept as-is.
// The rest is the structured-cabling legend the user standardized on.
// Copper and fiber are drawn in clearly different colours (blue / violet --
// violet is the OM4 jacket colour) so the structured cabling reads at a
// glance: which runs are copper, which are glass.
const CABLE_TYPES = {
  power:     { label: "Power",              color: 0xf59e0b },
  network:   { label: "Network Data",       color: 0x3b82f6 },
  copper:    { label: "Copper · Cat6A",     color: 0x60a5fa },
  fiber:     { label: "Fiber · OM4",        color: 0xa855f7 },
  cooling:   { label: "Cooling Line",       color: 0x22d3ee },
  backbone:  { label: "Backbone / Uplink",  color: 0xf97316 },
  equipment: { label: "Server / Equipment", color: 0x64748b },
  wifi:      { label: "Wi-Fi / PoE",        color: 0xeab308 },
  cctv:      { label: "CCTV / Security",    color: 0x22c55e },
  telephony: { label: "Telephony / Voice",  color: 0xf1f5f9 },
};
const CABLE_LAYER_MAP = {
  power: "power", network: "network", copper: "network", fiber: "network", cooling: "cooling",
  backbone: "network", equipment: "network", wifi: "network", cctv: "cctv", telephony: "network",
};

// ── Cable containment: one lane per cable TYPE, one "way" per cable ──────
// Two cables never share a line -- but WHICH offset does the separating
// depends on which way the run goes, and that is the part the first attempt
// got wrong.
//
// Two parallel runs pushed apart by a vector w are only actually apart by
// the part of w that is perpendicular to the run. So:
//   * a HEIGHT offset separates a horizontal run perfectly and a vertical
//     run not at all (a drop into a rack passes through every height, so
//     two cables at different tray heights land right on top of each other);
//   * an ACROSS-the-run offset is horizontal and always perpendicular, so
//     it works at every angle;
//   * an ALONG-the-run offset separates a vertical run and does nothing on
//     a horizontal one (where it would just make the cable overshoot).
//
// Hence three offsets, each doing the job the others can't:
//   height  -- one tray level per cable TYPE  (carries horizontal runs)
//   across  -- one way per cable of that type (carries every angle)
//   along   -- one depth per TYPE, faded in as the run turns vertical
//              (carries vertical drops, faded out so horizontal runs never
//              overshoot their device)
// Power is furthest out on its own, the six data services sit together with
// a line each, cooling and CCTV get their own lanes past them.
const CABLE_LANE_INDEX = {
  power:     0,
  // -- data services, adjacent to each other but each on its own line --
  network:   2,
  fiber:     3,
  backbone:  4,
  equipment: 5,
  telephony: 6,
  wifi:      7,
  copper:    8,
  // -- separate services again --
  cooling:   9,
  cctv:     11,
};
const CABLE_LANE_CENTRE = 5.5;
const cableLaneRank = (type) =>
  (CABLE_LANE_INDEX[type] ?? CABLE_LANE_INDEX.equipment) - CABLE_LANE_CENTRE;

// Across-the-run spacing between two cables of the SAME type, and how many
// ways a lane holds before it wraps to a lower tier. The half-pitch stagger
// on odd tiers means a wrapped way never lands under an earlier one, so the
// smallest across gap is half the pitch.
const CABLE_WAY_PITCH = 0.12;
const CABLE_WAYS_PER_TRAY = 9;
const CABLE_WAY_TIERS = 4;
const CABLE_TIER_DROP = 0.03;

// Along-the-run depth between two cable TYPES, used only as a run turns
// vertical (see cableAlongOffset).
const CABLE_TYPE_DEPTH_PITCH = 0.06;

const cableWayTier = (wayIndex) =>
  Math.floor(wayIndex / CABLE_WAYS_PER_TRAY) % CABLE_WAY_TIERS;

// A cable's own way across its lane: 0, +1, -1, +2, -2 ... so a bundle opens
// out symmetrically instead of drifting off to one side.
function cableAcrossOffset(wayIndex) {
  const i = wayIndex % CABLE_WAYS_PER_TRAY;
  const step = Math.ceil(i / 2) * (i % 2 === 1 ? 1 : -1);
  const stagger = cableWayTier(wayIndex) % 2 ? CABLE_WAY_PITCH * 0.5 : 0;
  return step * CABLE_WAY_PITCH + stagger;
}
function cableWayDrop(wayIndex) {
  return -cableWayTier(wayIndex) * CABLE_TIER_DROP;
}

// `verticality` is 0 for a run that is flat and 1 for one that is a straight
// drop. Fading the along-the-run offset with it is what stops a horizontal
// cable from starting 30 cm past the device it plugs into, while still
// giving a rack drop the sideways spread that height offsets cannot.
//
// The MINUS is load-bearing, not a typo. Height and along both scale with
// the same lane rank, so if they shared a sign the combined offset would
// point the same way as a rising run at one particular slope -- and an
// offset parallel to the run separates nothing, so two cables would pass
// straight through each other on a diagonal at about 55 degrees. Sending
// the along offset the other way makes the combined vector lean against the
// run instead of along it, which no upward slope can ever be parallel to.
function cableAlongOffset(type, verticality) {
  return -cableLaneRank(type) * CABLE_TYPE_DEPTH_PITCH * verticality;
}

// The three route levels have very different headroom, so the tray spacing
// is set per level rather than shared. The plenum is 1.4 m deep and takes
// the full stack; "floor" level has only the air above the tiles, so its
// lanes are tighter and lifted clear of the floor; the ceiling stack is
// tightened and dropped so the topmost lane stays under the slab.
const LEVEL_LANE_SHAPE = {
  plenum:  { pitch: 0.075, bias: 0 },
  floor:   { pitch: 0.062, bias: 0.38 },
  ceiling: { pitch: 0.062, bias: -0.16 },
};
function cableLaneY(levelKey, levelY, type, wayIndex) {
  const shape = LEVEL_LANE_SHAPE[levelKey] || LEVEL_LANE_SHAPE.plenum;
  return levelY + cableLaneRank(type) * shape.pitch + shape.bias + cableWayDrop(wayIndex);
}

// ── Composite connection-endpoint ids ─────────────────────────────────────
// An endpoint is either a plain top-level device id ("dev_3") or, for a
// specific slot's "port" inside a rack (only reachable once RACK VIEW
// shows that rack's real contents), a composite "dev_3#slotId". These three
// helpers are the only place that needs to know that encoding.
// ── Rack U heights ─────────────────────────────────────────────────────
// A rack's U count is derived from its physical height, so "what size rack
// do I get" is really "what heightMm was it placed with". Everything used
// to inherit one 2000mm default, which is why every rack came out 44U.
// These presets let a rack be placed (and later resized) at any standard
// height, and the two helpers are the single place that converts between
// the two representations.
// 44 is what every rack used to come out as (the old 2000mm default), so
// it stays in the list -- existing racks keep showing their real size.
const RACK_U_PRESETS = [6, 9, 12, 15, 18, 20, 22, 24, 27, 32, 36, 42, 44, 45, 47, 48];
const DEFAULT_RACK_U = 42;
// The rack body derives its usable U as floor(heightM / U_HEIGHT), so the
// conversion back has to agree exactly. The small margin keeps a "42U"
// rack safely inside the 42U band rather than landing on the boundary and
// floating-point-rounding down to 41U.
const RACK_U_MARGIN_MM = 10;
function rackUToHeightMm(u) {
  return Math.round(u * U_HEIGHT * 1000) + RACK_U_MARGIN_MM;
}
function rackHeightMmToU(heightMm) {
  return Math.max(1, Math.floor((heightMm || 0) / 1000 / U_HEIGHT));
}

const ENDPOINT_SEP = "#";
const PORT_SEP = "@";
// How many individually addressable ports run across the back of one slot.
// A real 1U server has a row of NICs/PSU inlets side by side -- clicking a
// different spot along the slot picks a different one, so several cables
// leave the same device from visibly different places instead of all
// bunching at its centre.
const PORTS_PER_SLOT = 12;
function makeEndpointId(rackDeviceId, slotId, portIdx) {
  const base = `${rackDeviceId}${ENDPOINT_SEP}${slotId}`;
  return portIdx == null ? base : `${base}${PORT_SEP}${portIdx}`;
}
function parseEndpointId(id) {
  const i = id.indexOf(ENDPOINT_SEP);
  if (i === -1) return { deviceId: id, slotId: null, portIdx: null };
  const deviceId = id.slice(0, i);
  const rest = id.slice(i + 1);
  const p = rest.indexOf(PORT_SEP);
  if (p === -1) return { deviceId, slotId: rest, portIdx: null };
  const parsed = Number(rest.slice(p + 1));
  return { deviceId, slotId: rest.slice(0, p), portIdx: Number.isFinite(parsed) ? parsed : null };
}
function parentDeviceId(id) {
  return parseEndpointId(id).deviceId;
}
// Lateral offset (from the slot's centre) of port `idx`, evenly spread
// across 90% of the slot width. Shared by the cable anchor, the click
// hit-test and the selection ring so all three agree exactly.
function portOffsetAlongSlot(idx, width) {
  return ((idx + 0.5) / PORTS_PER_SLOT - 0.5) * width * 0.9;
}
// Inverse: which port does a world-space hit on this slot mesh land on?
function portIdxFromHit(portMesh, worldPoint) {
  const local = portMesh.worldToLocal(worldPoint.clone());
  const width = portMesh.geometry.parameters?.width || 0.4;
  const u = local.x / width + 0.5; // 0..1 across the slot
  return Math.min(PORTS_PER_SLOT - 1, Math.max(0, Math.floor(u * PORTS_PER_SLOT)));
}

// device category (from DEVICE_TYPES in ToolBox.jsx) -> Layers-panel key
const CATEGORY_TO_LAYER = {
  Compute: "asset", Storage: "asset", Cooling: "cooling", Power: "power",
  Network: "network", Security: "cctv", Safety: "fire", Environment: "humidity",
  Infrastructure: "asset", Floor: "asset",
};
const DEVICE_LAYER_OVERRIDES = {
  "Access Card Reader": "alarm",
  "Biometric Access": "alarm",
  "Push Button - Access": "alarm",
  "Emergency Exit": "fire",
  "Firewall": "network",
};
function getDeviceLayerKey(name, category) {
  return DEVICE_LAYER_OVERRIDES[name] || CATEGORY_TO_LAYER[category] || "asset";
}

// ── helper: hex string ("#rrggbb") -> THREE color int ───────────────────
function hexToColorNum(hex) {
  if (!hex) return parseInt(DEFAULT_MARGIN_COLOR.replace("#", ""), 16);
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  const num = parseInt(clean, 16);
  return Number.isNaN(num) ? parseInt(DEFAULT_MARGIN_COLOR.replace("#", ""), 16) : num;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME TOKENS — mirrors the DCIM console design system exactly.
// ═══════════════════════════════════════════════════════════════════════════
const THEMES = {
  dark: {
    isDark: true,
    bg: 0x0d1117,
    fog: 0x0d1117,
    ground: 0x080c14,
    tileColor: 0x1a2535,
    tileMetalness: 0.5,
    tileRoughness: 0.6,
    structuralFloorColor: 0x080c14,
    gridColor: 0x2d4166,
    wallColor: 0x3b82f6,
    wallOpacity: 0.14,
    wallTrimColor: 0x60a5fa,
    // solid cut-away wall: body, coping cap, skirting, exposed slab edge
    parapetColor: 0x2b3546,
    parapetCapColor: 0x55627a,
    parapetPlinthColor: 0x161d29,
    apronColor: 0x121926,
    mullionColor: 0x60a5fa,
    roomWallColor: 0x3b82f6,
    roomWallOpacity: 0.14,
    trussColor: 0x1a2a40,
    lightStripColor: 0x4080ff,
    trayColor: 0x1a2a3a,
    trayAccent: 0x243450,
    floor: 0x0f1623,
    tile: 0x1a2535,
    grid1: 0x2d4166,
    grid2: 0x1e2d45,
    edgeColor: 0x1e3a5f,
    pillarColor: 0x243450,
    boundaryColor: 0x1e3a5f,
    // Light rig. three r128 uses legacy (non-physical) lights, so these are
    // plain multipliers that simply add up — the old ambient 1.35 + hemi 0.85
    // pushed every surface past 100% and flattened the whole scene into a
    // silhouette-free wash. Ambient is now just the floor of the range and a
    // real key light does the shaping.
    ambientIntensity: 0.22,
    hemiIntensity: 0.26,
    keyIntensity: 0.55,
    fillIntensity: 0.18,
    bgPrimary: "#0a0e1a",
    bgSecondary: "#0f1623",
    bgTertiary: "#151c2e",
    bgElevated: "#1a2236",
    borderSubtle: "#1e2d45",
    borderDefault: "#243450",
    borderStrong: "#2d4166",
    textPrimary: "#e2e8f0",
    textSecondary: "#94a3b8",
    textMuted: "#475569",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.12)",
    accentGlow: "rgba(56,189,248,0.35)",
    ok: "#22c55e",
    warn: "#f59e0b",
    critical: "#ef4444",
    indigo: "#6366f1",
    violet: "#a855f7",
    shadow: "0 4px 20px rgba(0,0,0,0.45)",
    shadowSoft: "0 2px 8px rgba(0,0,0,0.30)",
    headerBg: "#0f1623",
    headerColor: "#e2e8f0",
    badgeBg: "#0f1623",
    badgeBorder: "#1e2d45",
    badgeText: "#e2e8f0",
    badgeSub: "#94a3b8",
    dimBadgeBg: "#0f1623",
    ctrlBg: "#0f1623",
    ctrlBorder: "#1e2d45",
    loadingBg: "rgba(10,14,26,0.97)",
    loadingTitle: "#e2e8f0",
    loadingSub: "#475569",
    loadingAccent: "#38bdf8",
    statusBadgeSub: "#475569",
  },
  light: {
    isDark: false,
    bg: 0xdfe6ee,
    fog: 0xdfe6ee,
    ground: 0x97a3b0,
    tileColor: 0xb3bfcb,
    tileMetalness: 0.1,
    tileRoughness: 0.8,
    structuralFloorColor: 0x8e9aa7,
    gridColor: 0x76828f,
    wallColor: 0x1e3a8a,
    wallOpacity: 0.16,
    wallTrimColor: 0x3b82f6,
    // solid cut-away wall: body, coping cap, skirting, exposed slab edge
    parapetColor: 0xb9c2cc,
    parapetCapColor: 0xd6dee7,
    parapetPlinthColor: 0x7d8894,
    apronColor: 0x99a4b0,
    mullionColor: 0x3b82f6,
    roomWallColor: 0x1e3a8a,
    roomWallOpacity: 0.18,
    trussColor: 0x90a0b0,
    lightStripColor: 0x60a0ff,
    trayColor: 0x8090a0,
    trayAccent: 0x6080a0,
    floor: 0xffffff,
    tile: 0xc8d4e0,
    grid1: 0x8090a0,
    grid2: 0xa8b6c4,
    edgeColor: 0x7090b0,
    pillarColor: 0x94a3b8,
    boundaryColor: 0x7090b0,
    // See the dark theme's note: ambient 1.75 + hemi 1.0 meant every face was
    // rendered at ~275% and clipped to white, which is why the light theme
    // read as a blank sheet of paper regardless of the colours below.
    ambientIntensity: 0.16,
    hemiIntensity: 0.2,
    keyIntensity: 0.6,
    fillIntensity: 0.18,
    bgPrimary: "#f1f5f9",
    bgSecondary: "#ffffff",
    bgTertiary: "#f8fafc",
    bgElevated: "#e2e8f0",
    borderSubtle: "#e2e8f0",
    borderDefault: "#cbd5e1",
    borderStrong: "#94a3b8",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent: "#0284c7",
    accentSoft: "rgba(2,132,199,0.10)",
    accentGlow: "rgba(2,132,199,0.30)",
    ok: "#16a34a",
    warn: "#d97706",
    critical: "#dc2626",
    indigo: "#4f46e5",
    violet: "#9333ea",
    shadow: "0 4px 20px rgba(15,23,42,0.12)",
    shadowSoft: "0 2px 8px rgba(15,23,42,0.08)",
    headerBg: "#ffffff",
    headerColor: "#0f172a",
    badgeBg: "#ffffff",
    badgeBorder: "#e2e8f0",
    badgeText: "#0f172a",
    badgeSub: "#475569",
    dimBadgeBg: "#ffffff",
    ctrlBg: "#ffffff",
    ctrlBorder: "#e2e8f0",
    loadingBg: "rgba(241,245,249,0.97)",
    loadingTitle: "#0f172a",
    loadingSub: "#475569",
    loadingAccent: "#0284c7",
    statusBadgeSub: "#94a3b8",
  },
};

function labelPalette(isDark) {
  return isDark
    ? { panel: "rgba(15,22,35,0.94)", border: "#1e2d45", title: "#e2e8f0", sub: "#94a3b8", accent: "#38bdf8" }
    : { panel: "rgba(255,255,255,0.95)", border: "#e2e8f0", title: "#0f172a", sub: "#475569", accent: "#0284c7" };
}

// ── Room type definitions ────────────────────────────────────────────────
export const ROOM_TYPES = [
  { value: "server", label: "Server Room", color: "#38bdf8", icon: "fa-server" },
  { value: "ac", label: "AC Unit Room", color: "#22c55e", icon: "fa-snowflake" },
  { value: "dg", label: "DG Set Room", color: "#f59e0b", icon: "fa-bolt" },
  { value: "electrical", label: "Electrical Room", color: "#eab308", icon: "fa-plug" },
  { value: "network", label: "Network Room", color: "#6366f1", icon: "fa-network-wired" },
  { value: "storage", label: "Storage Room", color: "#64748b", icon: "fa-hdd" },
  { value: "ups", label: "UPS Room", color: "#14b8a6", icon: "fa-car-battery" },
  { value: "chiller", label: "Chiller Room", color: "#22d3ee", icon: "fa-fan" },
  { value: "corridor", label: "Corridor", color: "#475569", icon: "fa-road" },
  { value: "custom", label: "Custom Room", color: "#94a3b8", icon: "fa-door-open" },
];

// ── Simple Orbit Controls ────────────────────────────────────────────────
class SimpleOrbit {
  constructor(cam, dom) {
    this.cam = cam;
    this.dom = dom;
    this.target = new THREE.Vector3();
    this.sph = new THREE.Spherical();
    const off = cam.position.clone().sub(this.target);
    this.sph.setFromCartesianCoords(off.x, off.y, off.z);
    this._dn = false;
    this._lx = 0;
    this._ly = 0;
    this._btn = -1;
    this.minD = 5;
    this.maxD = 500;
    this.minPhi = 0.001;
    this.maxPhi = Math.PI - 0.001;
    this.rSpeed = 0.5;
    this.zSpeed = 0.1;
    this.enabled = true;
    this._pd = this._PD.bind(this);
    this._pm = this._PM.bind(this);
    this._pu = this._PU.bind(this);
    this._wh = this._WH.bind(this);
    dom.addEventListener("pointerdown", this._pd);
    dom.addEventListener("pointermove", this._pm);
    dom.addEventListener("pointerup", this._pu);
    dom.addEventListener("wheel", this._wh, { passive: false });
    dom.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  _PD(e) {
    if (!this.enabled) return;
    if (e.button === 2) return;
    this._dn = true;
    this._lx = e.clientX;
    this._ly = e.clientY;
    this._btn = e.button;
  }
  _PU() {
    this._dn = false;
    this._btn = -1;
  }
  _PM(e) {
    if (!this.enabled) return;
    if (!this._dn || e.buttons === 2) return;
    const dx = e.clientX - this._lx,
      dy = e.clientY - this._ly;
    this._lx = e.clientX;
    this._ly = e.clientY;
    if (this._btn === 0) {
      this.sph.theta -= dx * 0.005 * this.rSpeed;
      this.sph.phi = Math.max(
        this.minPhi,
        Math.min(this.maxPhi, this.sph.phi - dy * 0.005 * this.rSpeed),
      );
    }
    this.update();
  }
  _WH(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.sph.radius = Math.max(
      this.minD,
      Math.min(this.maxD, this.sph.radius * (1 + e.deltaY * this.zSpeed * 0.01)),
    );
    this.update();
  }
  update() {
    const off = new THREE.Vector3().setFromSpherical(this.sph);
    this.cam.position.copy(this.target).add(off);
    this.cam.lookAt(this.target);
  }
  dispose() {
    this.dom.removeEventListener("pointerdown", this._pd);
    this.dom.removeEventListener("pointermove", this._pm);
    this.dom.removeEventListener("pointerup", this._pu);
    this.dom.removeEventListener("wheel", this._wh);
  }
}

// ── Corner-anchored tile grid ────────────────────────────────────────────
function createTileGrid(oW, oL, tileSize, majorColor, minorColor) {
  const group = new THREE.Group();
  group.name = "TileGrid";
  const originX = -oW / 2;
  const originZ = -oL / 2;

  const majorMat = new THREE.LineBasicMaterial({ color: majorColor, transparent: true, opacity: 0.6 });
  const minorMat = new THREE.LineBasicMaterial({ color: minorColor, transparent: true, opacity: 0.32 });
  const MAJOR_EVERY = 5;

  const vertsMajor = [];
  const vertsMinor = [];

  let x = 0, col = 0;
  while (x <= oW + 1e-6) {
    const wx = originX + x;
    (col % MAJOR_EVERY === 0 ? vertsMajor : vertsMinor).push(wx, 0, originZ, wx, 0, originZ + oL);
    x += tileSize;
    col++;
  }
  if (Math.abs(x - tileSize - oW) > 1e-6) {
    const wx = originX + oW;
    vertsMinor.push(wx, 0, originZ, wx, 0, originZ + oL);
  }

  let z = 0, row = 0;
  while (z <= oL + 1e-6) {
    const wz = originZ + z;
    (row % MAJOR_EVERY === 0 ? vertsMajor : vertsMinor).push(originX, 0, wz, originX + oW, 0, wz);
    z += tileSize;
    row++;
  }
  if (Math.abs(z - tileSize - oL) > 1e-6) {
    const wz = originZ + oL;
    vertsMinor.push(originX, 0, wz, originX + oW, 0, wz);
  }

  const minorGeo = new THREE.BufferGeometry();
  minorGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertsMinor, 3));
  group.add(new THREE.LineSegments(minorGeo, minorMat));

  const majorGeo = new THREE.BufferGeometry();
  majorGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertsMajor, 3));
  group.add(new THREE.LineSegments(majorGeo, majorMat));

  group.userData.originX = originX;
  group.userData.originZ = originZ;
  group.userData.tileSize = tileSize;
  return group;
}

// ── Raised access floor ─────────────────────────────────────────────────
// ── Studio environment ───────────────────────────────────────────────────
// Every metal surface in this scene — cabinet shells, busbars, handrails,
// the chrome on a door lever — is a MeshStandardMaterial with real metalness.
// A metal has almost no diffuse response: it shows you its surroundings. With
// no environment there is nothing to show, so all of it renders near-black no
// matter how many lights are added, which is exactly why the equipment came
// out as dark silhouettes on a pale floor.
//
// This builds a cheap three-stop gradient (sky / horizon / floor), runs it
// through PMREM once, and hands it to scene.environment. It costs one small
// texture and gives every metal something to reflect.
function createStudioEnvironment(renderer, isDark) {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 128;
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  // These are deliberately dark. The gradient is a light source, not a
  // backdrop: at "correct-looking" brightness its diffuse contribution alone
  // lifts every surface to white, which is the trap the old rig fell into.
  if (isDark) {
    grad.addColorStop(0.0, "#36404f");
    grad.addColorStop(0.45, "#181e27");
    grad.addColorStop(0.55, "#10151c");
    grad.addColorStop(1.0, "#07090d");
  } else {
    grad.addColorStop(0.0, "#5c646e");
    grad.addColorStop(0.45, "#4e565f");
    grad.addColorStop(0.55, "#434a52");
    grad.addColorStop(1.0, "#31363c");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.minFilter = THREE.LinearFilter;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

// ── Suspended ceiling ────────────────────────────────────────────────────
// The counterpart to the raised floor: the plane overhead that busway runs,
// tap-off boxes and overhead cable trays actually hang from. Built as its own
// named group so the CEILING toggle can hide it in one line — and it hides
// itself in a top-down view regardless, because a lid over the room would
// make the whole floor plan invisible from above.
function createCeilingSystem(oW, oL, T) {
  const group = new THREE.Group();
  group.name = "CeilingSystem";
  group.visible = false;

  const y = FLOOR_Y + CEILING_H;
  const slabMat = new THREE.MeshStandardMaterial({
    color: T.parapetColor, metalness: 0.15, roughness: 0.85,
    transparent: true, opacity: 0.92, side: THREE.DoubleSide,
  });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(oW, 0.12, oL), slabMat);
  slab.position.y = y + 0.06;
  slab.receiveShadow = true;
  group.add(slab);

  // Perimeter down-stand, so from inside the room the ceiling reads as a
  // built edge rather than a floating sheet.
  const beamMat = new THREE.MeshStandardMaterial({
    color: T.parapetCapColor, metalness: 0.2, roughness: 0.7,
  });
  [[oW, 0.22, -oL / 2 + 0.11, 0], [oW, 0.22, oL / 2 - 0.11, 0]].forEach(([w, h, z]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), beamMat);
    b.position.set(0, y - h / 2, z);
    group.add(b);
  });
  [-1, 1].forEach((sx) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, oL), beamMat);
    b.position.set(sx * (oW / 2 - 0.11), y - 0.11, 0);
    group.add(b);
  });

  // Grid tees, on a 1.2 m module — enough to read as a ceiling grid without
  // becoming thousands of meshes on a large floor.
  const teeMat = new THREE.MeshStandardMaterial({
    color: T.parapetCapColor, metalness: 0.25, roughness: 0.6,
  });
  const STEP = 1.2;
  const nx = Math.min(60, Math.floor(oW / STEP));
  const nz = Math.min(60, Math.floor(oL / STEP));
  for (let i = 1; i < nx; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, oL), teeMat);
    t.position.set(-oW / 2 + i * (oW / nx), y - 0.02, 0);
    group.add(t);
  }
  for (let i = 1; i < nz; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(oW, 0.04, 0.035), teeMat);
    t.position.set(0, y - 0.02, -oL / 2 + i * (oL / nz));
    group.add(t);
  }

  // Overhead cable tray running the long axis, on drop rods — this is what
  // overhead-routed cables are dressed into.
  const trayMat = new THREE.MeshStandardMaterial({
    color: T.trayColor, metalness: 0.6, roughness: 0.4,
  });
  const trayY = y - 0.42;
  const trayW = Math.min(0.55, oL * 0.08);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(oW * 0.86, 0.05, trayW), trayMat);
  tray.position.set(0, trayY, 0);
  group.add(tray);
  [-1, 1].forEach((sz) => {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(oW * 0.86, 0.1, 0.03), trayMat);
    lip.position.set(0, trayY + 0.05, sz * (trayW / 2));
    group.add(lip);
  });
  const nRods = Math.max(2, Math.round(oW / 2.4));
  for (let i = 0; i <= nRods; i++) {
    const rx = -oW * 0.43 + (oW * 0.86 / nRods) * i;
    [-1, 1].forEach((sz) => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), trayMat);
      rod.position.set(rx, trayY + 0.21, sz * (trayW / 2 - 0.04));
      group.add(rod);
    });
  }

  group.userData.ceilingY = y;
  return group;
}

// ── Cut-away wall run ────────────────────────────────────────────────────
// Builds one straight length of solid wall along local +X, centred on the
// origin with its base at y = 0, so the caller only has to position and
// rotate it. `openings` carves doorways out of the run — each entry is a
// { center, width } in the run's own local X, and the wall is emitted as the
// solid spans left over between them, with a reveal down each cut edge so a
// doorway reads as a real opening rather than a missing chunk.
function createParapetRun(runLength, {
  height = PARAPET_H,
  thickness = PARAPET_T,
  bodyColor = 0xd2d9e1,
  capColor = 0xeff3f7,
  plinthColor = 0x9aa6b4,
  accentColor = null,
  openings = [],
} = {}) {
  const group = new THREE.Group();
  const bodyMat   = new THREE.MeshStandardMaterial({ color: bodyColor,   metalness: 0.08, roughness: 0.92 });
  const capMat    = new THREE.MeshStandardMaterial({ color: capColor,    metalness: 0.12, roughness: 0.8  });
  const plinthMat = new THREE.MeshStandardMaterial({ color: plinthColor, metalness: 0.15, roughness: 0.85 });

  const capH   = PARAPET_CAP_H;
  const baseH  = PARAPET_PLINTH_H;
  const bodyH  = Math.max(0.2, height - capH);
  const half   = runLength / 2;

  // Work out the solid spans left between the openings.
  const cuts = openings
    .filter((o) => o && o.width > 0)
    .map((o) => [Math.max(-half, o.center - o.width / 2), Math.min(half, o.center + o.width / 2)])
    .sort((a, b) => a[0] - b[0]);
  const spans = [];
  let cursor = -half;
  cuts.forEach(([cs, ce]) => {
    if (cs > cursor) spans.push([cursor, cs]);
    cursor = Math.max(cursor, ce);
  });
  if (cursor < half) spans.push([cursor, half]);

  spans.forEach(([sx, ex]) => {
    const len = ex - sx;
    if (len <= 0.02) return;
    const cx = (sx + ex) / 2;

    const body = new THREE.Mesh(new THREE.BoxGeometry(len, bodyH, thickness), bodyMat);
    body.position.set(cx, bodyH / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // skirting, stood slightly proud of the wall face
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(len, baseH, thickness + 0.05), plinthMat);
    plinth.position.set(cx, baseH / 2, 0);
    group.add(plinth);

    // coping cap — the light top edge that makes a cut-away wall legible
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len, capH, thickness + 0.06), capMat);
    cap.position.set(cx, bodyH + capH / 2, 0);
    cap.castShadow = true;
    group.add(cap);

    // optional colour band, used by rooms to keep their category identity
    if (accentColor !== null) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.03, thickness + 0.045),
        new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.1 }),
      );
      stripe.position.set(cx, bodyH - 0.075, 0);
      group.add(stripe);
    }
  });

  // reveals down the cut edges of each opening
  cuts.forEach(([cs, ce]) => {
    [cs, ce].forEach((edge) => {
      if (Math.abs(edge) >= half - 0.02) return;
      const reveal = new THREE.Mesh(new THREE.BoxGeometry(0.05, bodyH, thickness + 0.02), plinthMat);
      reveal.position.set(edge, bodyH / 2, 0);
      group.add(reveal);
    });
  });

  return group;
}

// ── Under-floor plenum ──────────────────────────────────────────────────
// How far the structural slab sits below the raised floor. This is the
// clear space the cabling runs through, and it's what makes the PLENUM
// view read as an actual under-floor void rather than a thin gap.
const PLENUM_DEPTH = 1.4;
// Height the cross-room cable runs sit at inside that void.
const PLENUM_Y = -PLENUM_DEPTH * 0.55;
// The ground plane the building stands on. In the normal view it sits just
// under the raised floor, as it always has. In the CONNECTIVITY view it drops
// below the structural slab: at its normal height it cuts straight through
// the 1.4 m plenum, and every tray and cable run under the floor was hidden
// behind it -- only the short vertical stubs above it ever showed.
const GROUND_Y = -(STRUCTURAL_H + 0.02);
const GROUND_Y_UNDERFLOOR = -(PLENUM_DEPTH + STRUCTURAL_H + 0.02);

function createRaisedFloorSystem(oW, oL, T) {
  const group = new THREE.Group();
  group.name = "FloorSystem";

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(oW + 0.4, STRUCTURAL_H, oL + 0.4),
    new THREE.MeshStandardMaterial({ color: T.structuralFloorColor, metalness: 0.2, roughness: 0.8 }),
  );
  // The structural slab sits a full PLENUM_DEPTH below the raised floor,
  // so there's real, walkable-looking headroom for the cabling instead of
  // the few centimetres of tile thickness there used to be.
  slab.position.y = -(PLENUM_DEPTH + STRUCTURAL_H / 2);
  slab.receiveShadow = true;
  group.add(slab);

  const tilesX = Math.max(1, Math.round(oW / TILE_SIZE_M));
  const tilesZ = Math.max(1, Math.round(oL / TILE_SIZE_M));
  const originX = -oW / 2, originZ = -oL / 2;

  // A 600 mm tile on a 200 m floor means ~111,000 separate boxes, each with a
  // 10 mm gap around it. Zoomed out those gaps land well under one pixel, so
  // instead of a floor you get a shimmering white moiré — and 111,000
  // instances to push every frame. Past a sane instance budget the tile field
  // becomes one slab wearing a repeating tile texture: mipmaps and anisotropy
  // resolve it cleanly at any distance, and it costs a single draw call.
  const TILE_INSTANCE_BUDGET = 20000;
  const textured = tilesX * tilesZ > TILE_INSTANCE_BUDGET;
  group.userData.texturedFloor = textured;

  if (textured) {
    // 4x4 tiles baked into one power-of-two texture rather than one tile per
    // texture: fewer repeats across the floor means the mip chain does more of
    // the work, and the grid survives to a much shallower viewing angle before
    // it starts to alias.
    const CELLS = 4;
    const px = 256;
    const cell = px / CELLS;
    const c = document.createElement("canvas");
    c.width = px; c.height = px;
    const cx2 = c.getContext("2d");
    cx2.fillStyle = "#" + T.tileColor.toString(16).padStart(6, "0");
    cx2.fillRect(0, 0, px, px);
    cx2.strokeStyle = "#" + T.gridColor.toString(16).padStart(6, "0");
    cx2.globalAlpha = 0.38;
    cx2.lineWidth = 1.5;
    for (let i = 0; i < CELLS; i++) {
      cx2.strokeRect(i * cell + 0.75, 0.75, cell - 1.5, px - 1.5);
      cx2.strokeRect(0.75, i * cell + 0.75, px - 1.5, cell - 1.5);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(tilesX / CELLS, tilesZ / CELLS);
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;

    const field = new THREE.Mesh(
      new THREE.BoxGeometry(oW, RAISED_FLOOR_H, oL),
      new THREE.MeshStandardMaterial({
        map: tex, metalness: T.tileMetalness, roughness: T.tileRoughness,
      }),
    );
    field.name = "FloorTiles";
    field.position.y = RAISED_FLOOR_H / 2;
    field.receiveShadow = true;
    group.add(field);
  } else {
    const tileGeo = new THREE.BoxGeometry(TILE_SIZE_M - 0.01, RAISED_FLOOR_H, TILE_SIZE_M - 0.01);
    const tileMat = new THREE.MeshStandardMaterial({
      color: T.tileColor, metalness: T.tileMetalness, roughness: T.tileRoughness,
    });
    const field = new THREE.InstancedMesh(tileGeo, tileMat, tilesX * tilesZ);
    field.name = "FloorTiles";
    field.receiveShadow = true;

    const m0 = new THREE.Matrix4();
    let i = 0;
    for (let tx = 0; tx < tilesX; tx++) {
      for (let tz = 0; tz < tilesZ; tz++) {
        m0.setPosition(
          originX + (tx + 0.5) * TILE_SIZE_M,
          RAISED_FLOOR_H / 2,
          originZ + (tz + 0.5) * TILE_SIZE_M,
        );
        field.setMatrixAt(i++, m0);
      }
    }
    field.instanceMatrix.needsUpdate = true;
    group.add(field);
  }

  const m = new THREE.Matrix4();

  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(oW + 0.06, RAISED_FLOOR_H, oL + 0.06),
    new THREE.MeshStandardMaterial({ color: T.structuralFloorColor, metalness: 0.3, roughness: 0.85 }),
  );
  skirt.position.y = RAISED_FLOOR_H / 2 - 0.004;
  group.add(skirt);

  // ── Exposed slab edge ──────────────────────────────────────────────────
  // The thick band that makes the floor sit on something instead of floating.
  // Built as four side pieces rather than one solid box on purpose: a box
  // would seal the plenum shut and PLENUM view would show nothing but its
  // underside. Living inside FloorSystem means the under-floor view ghosts
  // it along with the rest of the floor.
  const apronMat = new THREE.MeshStandardMaterial({
    color: T.apronColor ?? T.structuralFloorColor, metalness: 0.15, roughness: 0.9,
  });
  const apronTop = RAISED_FLOOR_H - 0.01;
  const apronOut = 0.24;
  const apron = new THREE.Group();
  apron.name = "FloorApron";
  [
    { w: oW + apronOut * 2, d: apronOut, x: 0, z: -(oL / 2 + apronOut / 2) },
    { w: oW + apronOut * 2, d: apronOut, x: 0, z: oL / 2 + apronOut / 2 },
    { w: apronOut, d: oL, x: -(oW / 2 + apronOut / 2), z: 0 },
    { w: apronOut, d: oL, x: oW / 2 + apronOut / 2, z: 0 },
  ].forEach(({ w, d, x, z }) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w, FLOOR_APRON_H, d), apronMat);
    band.position.set(x, apronTop - FLOOR_APRON_H / 2, z);
    band.receiveShadow = true;
    band.castShadow = true;
    apron.add(band);
  });
  group.add(apron);

  // Pedestal legs standing the raised floor off the slab. Spaced well
  // apart (every PEDESTAL_TILE_STEP tiles) so they read as occasional
  // supports and leave the plenum open, rather than crowding the cable
  // runs out of view. One InstancedMesh, so they cost a single draw call.
  const PEDESTAL_TILE_STEP = 6;
  const pedGeo = new THREE.CylinderGeometry(0.05, 0.08, PLENUM_DEPTH, 6);
  const pedMat = new THREE.MeshStandardMaterial({ color: T.trayColor, metalness: 0.5, roughness: 0.6 });
  const pedX = Math.max(1, Math.floor(tilesX / PEDESTAL_TILE_STEP));
  const pedZ = Math.max(1, Math.floor(tilesZ / PEDESTAL_TILE_STEP));
  const pedestals = new THREE.InstancedMesh(pedGeo, pedMat, pedX * pedZ);
  pedestals.name = "PlenumPedestals";
  pedestals.visible = false;
  let pi = 0;
  for (let tx = 0; tx < pedX; tx++) {
    for (let tz = 0; tz < pedZ; tz++) {
      m.setPosition(
        originX + (tx * PEDESTAL_TILE_STEP + 0.5) * TILE_SIZE_M,
        -PLENUM_DEPTH / 2,
        originZ + (tz * PEDESTAL_TILE_STEP + 0.5) * TILE_SIZE_M,
      );
      pedestals.setMatrixAt(pi++, m);
    }
  }
  pedestals.count = pi;
  pedestals.instanceMatrix.needsUpdate = true;
  group.add(pedestals);

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNDER-FLOOR CABLE TRAYS + TRAY-LAID CABLES
// ---------------------------------------------------------------------------
// A cable with `route: "tray"` (or "pipe") is not auto-shaped at all: its
// waypoints are the exact centreline of its slot in the trays it is laid in,
// and the only thing added here is the vertical drop at each end, straight
// down from the floor cut-out under the cabinet it plugs into. That is what
// keeps a tray of forty cables reading as forty parallel runs instead of a
// fan of straight lines across the plenum.
//
// The trays themselves are data (`cableTrays`, one record per straight run)
// and are drawn only in the CONNECTIVITY view, on the network layer.
// ═══════════════════════════════════════════════════════════════════════════
// Where a cable comes up into a cabinet from below: the floor cut-out under
// its REAR face, this far in from it. KEEP IN STEP with trayEntry() in
// idealDatacenterDemo.js, which lays its tray waypoints against the same point.
const TRAY_ENTRY_INSET = 0.12;
const TRAY_CABLE_R = 0.012;      // a single cable in a tray
const PIPE_R = 0.034;            // a chilled-water pipe
const TRAY_SIDE_H = 0.1;         // tray side-wall height
// Roof-mounted plant (a device with elevationM > 0) stands on a deck this
// much bigger than its footprint on every side.
const ROOF_DECK_MARGIN = 0.5;

// Wire-mesh basket texture shared by every tray: a light grid on a darker
// field, so a tray reads as mesh up close and as a solid channel from afar.
let TRAY_MESH_TEX = null;
function trayMeshTexture() {
  if (TRAY_MESH_TEX) return TRAY_MESH_TEX;
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#3a4658";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#b8c4d4";
  ctx.fillRect(0, 0, 64, 7);
  ctx.fillRect(0, 0, 7, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.isSharedTexture = true;
  TRAY_MESH_TEX = tex;
  return tex;
}

// One straight tray run -> geometry pieces, all in world space. `mesh` parts
// wear the basket texture (UVs in 60 mm cells), `solid` parts are plain steel.
function trayRunPieces(t) {
  const mesh = [], solid = [];
  const len = Math.max(0.05, t.to - t.from);
  const mid = (t.from + t.to) / 2;
  const alongX = t.axis === "x";
  const place = (geo, x, y, z, rotY = 0) => {
    const m = new THREE.Matrix4().makeRotationY(rotY);
    m.setPosition(x, y, z);
    geo.applyMatrix4(m);
    return geo;
  };
  const at = (along, across) => (alongX ? [mid + along, across] : [across, mid + along]);
  const CELL = 0.06;
  const uvScale = (geo, u, v) => {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
    uv.needsUpdate = true;
    return geo;
  };
  const rot = alongX ? 0 : Math.PI / 2;
  // floor of the tray
  const floor = new THREE.PlaneGeometry(len, t.width);
  floor.rotateX(-Math.PI / 2);
  uvScale(floor, len / CELL, t.width / CELL);
  const [fx, fz] = at(0, t.line);
  mesh.push(place(floor, fx, t.y, fz, rot));
  // two side walls
  [-1, 1].forEach((s) => {
    const wall = new THREE.PlaneGeometry(len, TRAY_SIDE_H);
    uvScale(wall, len / CELL, TRAY_SIDE_H / CELL);
    const [wx, wz] = at(0, t.line + s * (t.width / 2));
    mesh.push(place(wall, wx, t.y + TRAY_SIDE_H / 2, wz, rot));
    // rolled top edge, so the wall has a visible lip
    const lip = new THREE.BoxGeometry(len, 0.014, 0.014);
    solid.push(place(lip, wx, t.y + TRAY_SIDE_H, wz, rot));
  });
  // support stands down to the slab, every 1.5 m or so
  const nStands = Math.max(2, Math.round(len / 1.5) + 1);
  for (let i = 0; i < nStands; i++) {
    const a = -len / 2 + 0.12 + (len - 0.24) * (i / (nStands - 1));
    const postH = t.y - (-PLENUM_DEPTH);
    const [px, pz] = at(a, t.line);
    solid.push(place(new THREE.BoxGeometry(0.03, postH, 0.03), px, -PLENUM_DEPTH + postH / 2, pz, rot));
    const bar = new THREE.BoxGeometry(0.03, 0.025, t.width + 0.06);
    solid.push(place(bar, px, t.y - 0.0125, pz, rot));
  }
  return { mesh, solid };
}

// All trays on the floor as two merged meshes (basket + steel), plus a small
// nameplate on each labelled run. Built from data, so it survives a theme
// switch or scene rebuild the same way devices do.
function createCableTrayGroup(trays, isDark) {
  const group = new THREE.Group();
  group.name = "CableTrayGroup";
  if (!trays?.length) return group;
  // Data trays and power trays are built the same way but kept apart, so
  // each follows its own layer and power containment reads as power (a warm
  // steel) at a glance. "air" records are allocation-only: nothing is drawn.
  const parts = {
    network: { mesh: [], solid: [] },
    power: { mesh: [], solid: [] },
  };
  trays.forEach((t) => {
    if (t.kind === "label" || t.kind === "air") return;
    const bucket = t.kind === "power" ? parts.power : parts.network;
    const { mesh, solid } = trayRunPieces(t);
    bucket.mesh.push(...mesh);
    bucket.solid.push(...solid);
  });
  const merge = (geos) => {
    const g = BufferGeometryUtils.mergeBufferGeometries(geos, false);
    geos.forEach((x) => x.dispose());
    return g;
  };
  [["network", 0xc8d2de, 0xe2e8f0, 0x8fa0b5, 0x7c8a9c],
   ["power", 0xe0c48a, 0xd8b56a, 0xb08a3e, 0x9a7630]].forEach(([layer, basketDark, basketLight, steelDark, steelLight]) => {
    const p = parts[layer];
    if (!p.mesh.length) return;
    const basket = new THREE.Mesh(merge(p.mesh), new THREE.MeshStandardMaterial({
      map: trayMeshTexture(), side: THREE.DoubleSide,
      color: isDark ? basketDark : basketLight, metalness: 0.55, roughness: 0.45,
      emissive: isDark ? 0x0f1a2a : 0x000000, emissiveIntensity: isDark ? 0.6 : 0,
    }));
    basket.name = layer === "power" ? "PowerTrayBaskets" : "CableTrayBaskets";
    basket.userData.layer = layer;
    group.add(basket);
    const steel = new THREE.Mesh(merge(p.solid), new THREE.MeshStandardMaterial({
      color: isDark ? steelDark : steelLight, metalness: 0.6, roughness: 0.4,
    }));
    steel.name = layer === "power" ? "PowerTraySteel" : "CableTraySteel";
    steel.userData.layer = layer;
    group.add(steel);
  });

  const LP = labelPalette(isDark);
  trays.forEach((t) => {
    if (!t.label) return;
    const tint = t.labelColor ?? (t.kind === "power" ? 0xf59e0b : 0x94a3b8);
    const tex = wireLabelTexture(t.label, tint, LP, isDark ? "d" : "l");
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.1, 0.3, 1);
    if (t.kind === "label") {
      sp.position.set(t.x, t.y, t.z);
    } else {
      const along = t.axis === "x" ? t.to - 0.6 : (t.from + t.to) / 2;
      sp.position.set(t.axis === "x" ? along : t.line, t.y + 0.34, t.axis === "x" ? t.line : along);
    }
    sp.renderOrder = 6;
    sp.userData.isLabel = true;
    sp.userData.layer = t.layer || (t.kind === "power" ? "power" : "network");
    group.add(sp);
  });
  return group;
}

// The roof plant deck a roof-mounted device stands on: a slab at roof level,
// a handrail round it, four steel columns down to the floor and a cat ladder
// up the west side. Built in the device's own space, underneath it, so it
// moves, ghosts and selects with the device.
function createRoofDeck(footprint, elevationM, isDark) {
  const g = new THREE.Group();
  g.name = "RoofDeck";
  const W = (footprint?.w || 1.2) + ROOF_DECK_MARGIN * 2;
  const D = (footprint?.d || 1.2) + ROOF_DECK_MARGIN * 2;
  const SLAB = 0.15;
  const slabMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x3b4556 : 0xc9d1dc, metalness: 0.15, roughness: 0.85,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x94a3b8 : 0x64748b, metalness: 0.7, roughness: 0.35,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, metalness: 0.4, roughness: 0.5,
  });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(W, SLAB, D), slabMat);
  slab.position.y = -SLAB / 2;
  g.add(slab);
  // waterproofing upstand round the slab edge
  const upMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x556174 : 0xaeb8c5, roughness: 0.9 });
  [[W, 0.08, 0.06, 0, D / 2 - 0.03], [W, 0.08, 0.06, 0, -D / 2 + 0.03],
   [0.06, 0.08, D, W / 2 - 0.03, 0], [0.06, 0.08, D, -W / 2 + 0.03, 0]].forEach(([w, h, d, x, z]) => {
    const u = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), upMat);
    u.position.set(x, h / 2, z);
    g.add(u);
  });

  // columns carry the deck down to the floor
  const colH = Math.max(0.2, elevationM - SLAB);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, colH, 0.18), steelMat);
    col.position.set(sx * (W / 2 - 0.15), -SLAB - colH / 2, sz * (D / 2 - 0.15));
    g.add(col);
  });
  // edge beams under the slab
  [[W, 0.2, 0.12, 0, D / 2 - 0.15], [W, 0.2, 0.12, 0, -D / 2 + 0.15]].forEach(([w, h, d, x, z]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steelMat);
    b.position.set(x, -SLAB - h / 2, z);
    g.add(b);
  });

  // handrail: posts + top and knee rails, safety yellow; open at the ladder
  const RAIL_H = 1.0;
  const LADDER_W = 0.6;
  const runs = [
    { len: W, x: 0, z: -D / 2 + 0.05, rot: 0 },
    { len: W, x: 0, z: D / 2 - 0.05, rot: 0 },
    { len: D, x: W / 2 - 0.05, z: 0, rot: Math.PI / 2 },
  ];
  // west side: two short runs either side of the ladder opening
  const westPart = (D - LADDER_W) / 2;
  runs.push({ len: westPart, x: -W / 2 + 0.05, z: -D / 2 + westPart / 2, rot: Math.PI / 2 });
  runs.push({ len: westPart, x: -W / 2 + 0.05, z: D / 2 - westPart / 2, rot: Math.PI / 2 });
  runs.forEach(({ len, x, z, rot }) => {
    [RAIL_H, RAIL_H * 0.5].forEach((h) => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.04), railMat);
      r.position.set(x, h, z);
      r.rotation.y = rot;
      g.add(r);
    });
    const nPosts = Math.max(2, Math.round(len / 1.0) + 1);
    for (let i = 0; i < nPosts; i++) {
      const a = -len / 2 + (len * i) / (nPosts - 1);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, RAIL_H, 0.04), railMat);
      p.position.set(x + (rot ? 0 : a), RAIL_H / 2, z + (rot ? a : 0));
      g.add(p);
    }
  });

  // cat ladder up the west face, at the gap in the handrail
  const ladderX = -W / 2 - 0.12;
  const ladderH = elevationM + RAIL_H * 0.6;
  [-1, 1].forEach((s) => {
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.04, ladderH, 0.04), steelMat);
    stile.position.set(ladderX, -elevationM + ladderH / 2, s * (LADDER_W / 2 - 0.08));
    g.add(stile);
  });
  const nRungs = Math.floor(elevationM / 0.3);
  for (let i = 1; i <= nRungs; i++) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, LADDER_W - 0.16), steelMat);
    rung.position.set(ladderX, -elevationM + i * 0.3, 0);
    g.add(rung);
  }

  // nameplate so the level reads without having to count metres
  const LP = labelPalette(isDark);
  const tex = deviceLabelTexture(
    "ROOF LEVEL", "ROOFTOP PLANT", `+${elevationM.toFixed(1)} m · chiller deck`,
    0x16a085, LP, isDark ? "d" : "l");
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  label.scale.set(1.45, 1.45 * (104 / 320), 1);
  label.position.set(W / 2 + 0.4, -0.35, D / 2 + 0.2);
  label.renderOrder = 4;
  label.userData.isLabel = true;
  g.add(label);

  return g;
}

// ═══════════════════════════════════════════════════════════════════════════
// THERMAL MONITORING — CFD-style heat map on the raised floor.
//
// Mirrors the "Rendering 3D CFD for detecting Hotspots" workflow: every IT
// load (Compute/Storage/Power/Network racks) is a heat source, every
// Cooling unit is a heat sink, and the two are blended into a smooth
// blue → cyan → green → yellow → red field across the floor, exactly like
// the CFD renders used for Risk Analysis / Capacity Planning / Optimizing
// Cooling. Turn a CRAC off in Simulate mode and watch the red bloom around
// the racks it used to serve — same cause/effect as the "Before / After
// Adding HD Racks" comparison.
// ═══════════════════════════════════════════════════════════════════════════
const HOTSPOT_MIN_C = 18;
const HOTSPOT_MAX_C = 50;
const HOTSPOT_AMBIENT_C = 22;
const HOTSPOT_WARN_C = 35;
const HOTSPOT_CRITICAL_C = 42;

// Nominal heat contribution (°C-equivalent strength) per device category —
// used only when a device has no explicit power rating to parse.
const HEAT_SOURCE_KW = {
  Compute: 5.5, Storage: 3.2, Power: 2.4, Network: 1.1,
  Security: 0.15, Safety: 0, Environment: 0, Infrastructure: 0, Floor: 0,
};
// A CRAC in a raised-floor room does NOT cool the air around itself — it
// pushes cold air into the plenum and the room is cooled by the perforated
// tiles. Modelling the unit as a wide cold blob (the old 9 kW over 7.2 m) made
// the whole floor read as cooled-by-proximity, and left the tiles doing
// nothing at all. So the unit is now a small local sink and the tiles carry
// the actual cooling.
const COOLING_SINK_KW = 3.0;
const HEAT_SINK_SIGMA = 2.6;     // metres — just the unit's own intake area

// Heat leaves a rack at its BACK, and a tight sigma keeps it in the hot aisle.
// At the old 3.1 m a cabinet's heat reached clean across the cold aisle, and
// two rows facing each other piled their Gaussians up in the middle — putting
// the hottest point of the map exactly where the cold air comes out.
const HEAT_SOURCE_SIGMA = 1.15;
const RACK_EXHAUST_OFFSET_M = 0.45;  // how far behind the cabinet it discharges

// What the ducted hot-aisle return carries away before it can spread. Scaled
// by how many cooling units are actually alive, so failing one still blooms.
const RETURN_CAPTURE = 0.6;

// Each perforated tile is a cold-air outlet in its own right.
const COLD_TILE_KW = 0.5;
const COLD_TILE_SIGMA = 0.9;

const HEAT_KELVIN_PER_KW = 1.55; // tuning: peak °C rise at a source's centre per kW

const HEATMAP_STOPS = [
  { t: 0.00, c: [30, 58, 138] },
  { t: 0.16, c: [37, 99, 235] },
  { t: 0.34, c: [34, 211, 238] },
  { t: 0.52, c: [34, 197, 94] },
  { t: 0.68, c: [234, 221, 33] },
  { t: 0.84, c: [249, 115, 22] },
  { t: 1.00, c: [220, 38, 38] },
];
function heatColorRGB(t) {
  const tt = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
    const a = HEATMAP_STOPS[i], b = HEATMAP_STOPS[i + 1];
    if (tt >= a.t && tt <= b.t) {
      const f = (tt - a.t) / (b.t - a.t || 1);
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
      ];
    }
  }
  return HEATMAP_STOPS[HEATMAP_STOPS.length - 1].c;
}
const HEATMAP_CSS_GRADIENT = HEATMAP_STOPS
  .map((s) => `rgb(${s.c[0]},${s.c[1]},${s.c[2]}) ${Math.round(s.t * 100)}%`)
  .join(", ");

function parseKwFromPower(powerStr) {
  if (!powerStr) return null;
  const m = String(powerStr).match(/([\d.]+)\s*kw/i);
  return m ? parseFloat(m[1]) : null;
}

// Builds the list of { x, z, kw, sigma } heat sources/sinks for the current
// device layout. `failures` (device id -> failure record, from Simulate
// mode) knocks a Cooling unit's sink strength to zero — the whole point of
// the demo: fail a CRAC, watch the floor around it redden.
function buildHeatSources(devices, failures, perfTiles = []) {
  const sources = [];

  // How much of the cooling chain is actually running. Everything the tiles
  // and the return duct do is scaled by this, so a failed unit degrades the
  // whole loop instead of only removing one blob from the map.
  let coolers = 0, healthy = 0;
  devices.forEach((d) => {
    if (d.category !== "Cooling") return;
    coolers++;
    if (!failures?.[d.id]) healthy++;
  });
  const coolingFrac = coolers ? healthy / coolers : 0;

  devices.forEach((d) => {
    if (d.category === "Cooling") {
      // Roof-mounted plant (the chiller) cools the floor only THROUGH the
      // units it feeds; it is not a cold spot on the floor under the deck.
      // It still counts towards coolingFrac above, so failing it matters.
      if (!failures?.[d.id] && !(d.elevationM > 0)) {
        sources.push({ x: d.position.x, z: d.position.z, kw: -COOLING_SINK_KW, sigma: HEAT_SINK_SIGMA });
      }
      return;
    }

    const parsed = parseKwFromPower(d.metadata?.power);
    const kw = parsed ?? HEAT_SOURCE_KW[d.category] ?? 0;
    if (kw <= 0) return;

    // A rack exhausts from its back face, not from its middle. Its door is
    // local +Z, so the back is the opposite way — the same rule the airflow
    // streams use, which keeps the heat map and the airflow agreeing with
    // each other when a cabinet is rotated.
    let ex = d.position.x, ez = d.position.z;
    if (isRackDevice(d.name, d.category, d.shape)) {
      const ry = ((d.rotation || 0) * Math.PI) / 180;
      const depth = (d.dimensions?.widthMm || 1000) / 1000;
      const off = depth / 2 + RACK_EXHAUST_OFFSET_M;
      ex -= Math.sin(ry) * off;
      ez -= Math.cos(ry) * off;
    }

    sources.push({
      x: ex, z: ez,
      kw: kw * (1 - RETURN_CAPTURE * coolingFrac),
      sigma: HEAT_SOURCE_SIGMA,
    });
  });

  // The perforated tiles are where cold air actually enters the room.
  perfTiles.forEach((t) => {
    sources.push({ x: t.x, z: t.z, kw: -COLD_TILE_KW * coolingFrac, sigma: COLD_TILE_SIGMA });
  });

  return sources;
}

// Evaluates the Gaussian-blended thermal field on a resX × resZ grid over
// the building footprint (oW × oL, centred on origin). Returns the raw
// Float32Array plus summary stats (peak cell + its world position) so the
// UI can report "hottest zone" the way a real CFD tool would.
function computeHeatField(devices, failures, oW, oL, resX, resZ, perfTiles = []) {
  const sources = buildHeatSources(devices, failures, perfTiles);
  const field = new Float32Array(resX * resZ);
  const originX = -oW / 2, originZ = -oL / 2;

  let peak = -Infinity, peakX = 0, peakZ = 0, sum = 0;
  for (let pz = 0; pz < resZ; pz++) {
    const wz = originZ + ((pz + 0.5) / resZ) * oL;
    for (let px = 0; px < resX; px++) {
      const wx = originX + ((px + 0.5) / resX) * oW;
      let temp = HOTSPOT_AMBIENT_C;
      for (let i = 0; i < sources.length; i++) {
        const s = sources[i];
        const dx = wx - s.x, dz = wz - s.z;
        const d2 = dx * dx + dz * dz;
        const falloff = Math.exp(-d2 / (2 * s.sigma * s.sigma));
        temp += s.kw * HEAT_KELVIN_PER_KW * falloff;
      }
      temp = Math.max(HOTSPOT_MIN_C, Math.min(HOTSPOT_MAX_C, temp));
      const idx = pz * resX + px;
      field[idx] = temp;
      sum += temp;
      if (temp > peak) { peak = temp; peakX = wx; peakZ = wz; }
    }
  }
  return {
    field, resX, resZ, oW, oL,
    peakC: peak, peakX, peakZ,
    avgC: sum / (resX * resZ),
    sourceCount: sources.filter((s) => s.kw > 0).length,
    sinkCount: sources.filter((s) => s.kw < 0).length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM TEMPERATURE PROBE — what the airflow arrows are coloured from
// ---------------------------------------------------------------------------
// computeHeatField above answers "how hot is the FLOOR here", on a grid, for
// the heat map. The airflow arrows need a different question answered: how
// hot is the air at an arbitrary point, INCLUDING its height, and at the
// start of a stream where the room-mixed average is simply the wrong answer.
//
// Three things feed it, in order of authority:
//
//   1. Placed temperature devices. If the floor has sensors on it, their
//      readings win outright near where they stand — that is the whole point
//      of putting them there. Blended by inverse square distance in 3D, so a
//      sensor at rack top does not speak for the aisle floor.
//   2. The stream's own source temperature. Air leaving a perforated tile is
//      at SUPPLY temperature and air leaving a cabinet back is at exhaust
//      temperature — supply plus the ΔT the servers just put into it. Neither
//      is what a room-average says about that spot.
//   3. The modelled field, as the air mixes with the room on the way up. The
//      higher the sample, the more the source temperature has given way to
//      the room, plus the stack gain the plume picks up climbing past the
//      cabinets.
// ═══════════════════════════════════════════════════════════════════════════
const SUPPLY_AIR_C = 18;         // what a perforated tile actually delivers
const RACK_DELTA_T_C = 14;       // rise across a loaded cabinet, front to back
const STACK_GAIN_C = 11;         // how much a plume warms climbing to ceiling
const STACK_MIX_HEIGHT_M = 1.3;  // by this height it has mixed into the room
const SENSOR_REACH_M = 4;        // how far one temperature device speaks for

/** A placed device that reports an air temperature, and its reading in °C. */
function readTempDevice(d) {
  const name = (d?.name || "").toLowerCase();
  const isProbe = /temp|thermal|thermo/.test(name)
    || getDeviceLayerKey(d?.name, d?.category) === "temperature";
  if (!isProbe) return null;
  const raw = d?.metadata?.tempC ?? d?.metadata?.temperature ?? d?.metadata?.temp;
  const c = typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(c) ? c : null;
}

/**
 * Build the probe for the floor as it currently stands.
 *
 * @returns {(x:number, y:number, z:number, kind?:"cold"|"hot") => number} °C
 */
function makeRoomTempSampler(devices, failures, perfWorld, floorY) {
  const sources = buildHeatSources(devices, failures, perfWorld);

  const sensors = [];
  devices.forEach((d) => {
    const c = readTempDevice(d);
    if (c == null) return;
    sensors.push({
      x: d.position.x, z: d.position.z,
      y: floorY + (d.dimensions?.heightMm || 300) / 2000,
      c,
    });
  });

  // The floor-level field at one point — the same sum computeHeatField walks
  // per grid cell, evaluated for a single position instead.
  const fieldAt = (x, z) => {
    let temp = HOTSPOT_AMBIENT_C;
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const dx = x - s.x, dz = z - s.z;
      const falloff = Math.exp(-(dx * dx + dz * dz) / (2 * s.sigma * s.sigma));
      temp += s.kw * HEAT_KELVIN_PER_KW * falloff;
    }
    return Math.max(HOTSPOT_MIN_C, Math.min(HOTSPOT_MAX_C, temp));
  };

  return (x, y, z, kind) => {
    // 1 ── measured
    if (sensors.length) {
      let wsum = 0, tsum = 0;
      for (let i = 0; i < sensors.length; i++) {
        const s = sensors[i];
        const dx = x - s.x, dy = y - s.y, dz = z - s.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 1e-4) return s.c;
        if (d2 > SENSOR_REACH_M * SENSOR_REACH_M) continue;
        const w = 1 / d2;
        wsum += w; tsum += w * s.c;
      }
      if (wsum > 0) return tsum / wsum;
    }

    // 2 + 3 ── the stream's own source temperature, giving way to the room.
    // The exponent makes the handover happen early: a plume has largely
    // become room air by the time it clears the cabinets, which is why the
    // top of a cold arrow can read warm even though its root is 18 °C.
    const h = Math.min(1, Math.max(0, (y - floorY) / STACK_MIX_HEIGHT_M));
    const mixed = fieldAt(x, z) + STACK_GAIN_C * h;
    if (!kind) return mixed;
    const root = kind === "hot" ? SUPPLY_AIR_C + RACK_DELTA_T_C : SUPPLY_AIR_C;
    const blend = Math.pow(h, 0.5);
    return root * (1 - blend) + mixed * blend;
  };
}

// Rasterises a computed field into a THREE.CanvasTexture. Row 0 of the
// canvas (top) is drawn at world Z = originZ so it lines up with a
// PlaneGeometry rotated -90° about X (THREE's default flipY keeps this
// correct without any extra UV flipping).
function renderHeatFieldTexture(result) {
  const { field, resX, resZ } = result;
  const canvas = document.createElement("canvas");
  canvas.width = resX;
  canvas.height = resZ;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(resX, resZ);
  for (let i = 0; i < field.length; i++) {
    const t = (field[i] - HOTSPOT_MIN_C) / (HOTSPOT_MAX_C - HOTSPOT_MIN_C);
    const [r, g, b] = heatColorRGB(t);
    const o = i * 4;
    img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 215;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createThermalHeatmapGroup(oW, oL) {
  const group = new THREE.Group();
  group.name = "ThermalHeatmap";
  const mat = new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(oW, oL), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = FLOOR_Y + 0.007;
  mesh.renderOrder = 1;
  mesh.name = "ThermalHeatmapPlane";
  group.add(mesh);
  group.visible = false;
  return group;
}

// ── Perforated raised-floor tile ────────────────────────────────────────
// ── Concatenate a handful of small geometries into one ──────────────────
// Not a general-purpose merge: it assumes every input carries the same
// attributes (position/normal/uv, which every primitive here does) and is
// only used for sets of identical little boxes and planes. Enough to turn a
// few hundred one-vertex-each draw calls into one.
function mergeSimpleGeometries(geos) {
  const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = new THREE.BufferGeometry();
  ["position", "normal", "uv"].forEach((name) => {
    const first = flat[0].getAttribute(name);
    if (!first) return;
    const size = first.itemSize;
    const total = flat.reduce((a, g) => a + g.getAttribute(name).array.length, 0);
    const arr = new Float32Array(total);
    let off = 0;
    flat.forEach((g) => { const a = g.getAttribute(name); arr.set(a.array, off); off += a.array.length; });
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  });
  flat.forEach((g, i) => { if (g !== geos[i]) g.dispose(); });
  geos.forEach((g) => g.dispose());
  return out;
}

// ── The grille on a perforated tile, baked once ─────────────────────────
// Every perforated tile carries the same ten slats, and every tile used to
// build its own ten meshes and ten geometries. A floor with fifty vents was
// five hundred draw calls of one thin box each — paid on every frame of
// every orbit, for a pattern that is identical on all of them.
const PERF_SLAT_CACHE = new Map();
const PERF_SLAT_MAT = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.95, roughness: 0.2 });
PERF_SLAT_MAT.userData.isSharedRackMat = true;
function perfSlatGeometry(tileSizeM) {
  const key = tileSizeM.toFixed(3);
  const hit = PERF_SLAT_CACHE.get(key);
  if (hit) return hit;
  const count = 10;
  const spacing = (tileSizeM - 0.08) / count;
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.BoxGeometry(tileSizeM - 0.08, 0.01, 0.015);
    g.translate(0, RAISED_FLOOR_H / 2 + 0.006, -tileSizeM / 2 + 0.04 + spacing * i);
    parts.push(g);
  }
  const merged = mergeSimpleGeometries(parts);
  merged.userData.isSharedRackGeo = true;
  PERF_SLAT_CACHE.set(key, merged);
  return merged;
}

const PERF_BASE_CACHE = new Map();
function perfBaseGeometry(tileSizeM) {
  const key = tileSizeM.toFixed(3);
  let g = PERF_BASE_CACHE.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(tileSizeM - 0.01, RAISED_FLOOR_H, tileSizeM - 0.01);
    g.userData.isSharedRackGeo = true;
    PERF_BASE_CACHE.set(key, g);
  }
  return g;
}

function createSlattedTileMesh(tileSizeM, isDark, tintColor, fullSize = false) {
  const group = new THREE.Group();
  group.name = "PerforatedTileUnit";

  // The tile body keeps its own material — the tint varies by caller — but
  // shares the slab shape with every other tile.
  const tileMat = new THREE.MeshStandardMaterial({
    color: tintColor ?? (isDark ? 0x1a2535 : 0xc8d4e0),
    metalness: 0.5,
    roughness: 0.45,
  });
  const base = new THREE.Mesh(perfBaseGeometry(tileSizeM), tileMat);
  base.receiveShadow = true;
  group.add(base);

  // Ten slats, one mesh.
  group.add(new THREE.Mesh(perfSlatGeometry(tileSizeM), PERF_SLAT_MAT));

  group.userData.raisedFloorHeight = RAISED_FLOOR_H;
  return group;
}

// ── One room's four partition runs, with its gates cut out of them ───────
// A gate is a hole in the wall, not a panel stuck to it: every gate on a wall
// carves a real opening out of that wall's run, the same way the building's
// main entrance does. Without the cut, the partition (1.3 m) crosses the door
// leaf (2.1 m) and only the top of the door is ever visible.
//
// A run is built along its own local X, centred on the wall's midpoint. On
// the north/south walls local X is world X; the east/west runs are turned
// -90°, which maps local +X onto world +Z. So an opening's offset along its
// run is just the gate's world X or Z minus the room's centre.
//
// Pulled out of createRoom3DAt so a gate being dragged can re-cut the four
// walls it is sliding along without rebuilding the whole room.
function buildRoomWallRuns(roomId, rx, rz, rW, rL, wallOpts, gates = []) {
  const rect = { cx: rx, cz: rz, w: rW, l: rL };
  const openingsFor = (side) => gates
    .filter((g) => g.side === side)
    .map((g) => {
      const tr = gateTransform(rect, side, g.t);
      return {
        center: (side === "N" || side === "S") ? tr.x - rx : tr.z - rz,
        width: GATE_W + 0.18,
      };
    });

  return [
    { len: rW, x: rx, z: rz - rL / 2, rot: 0, side: "N" },
    { len: rW, x: rx, z: rz + rL / 2, rot: 0, side: "S" },
    { len: rL, x: rx - rW / 2, z: rz, rot: -Math.PI / 2, side: "W" },
    { len: rL, x: rx + rW / 2, z: rz, rot: -Math.PI / 2, side: "E" },
  ].map(({ len, x, z, rot, side }, i) => {
    const run = createParapetRun(len + PARAPET_T * 0.8, {
      ...wallOpts, openings: openingsFor(side),
    });
    run.position.set(x, FLOOR_Y, z);
    run.rotation.y = rot;
    run.name = `RoomWall_${roomId}_${i}`;
    run.userData.wallOpts = wallOpts;
    return run;
  });
}

// ── Room 3D at world position ────────────────────────────────────────────
function createRoom3DAt(room, rx, rz, isDark, gates = [], corridorRects = null) {
  if (room.type === "corridor") return createCorridor3DAt(room, rx, rz, isDark, corridorRects);

  const LP = labelPalette(isDark);
  const group = new THREE.Group();
  group.name = `Room_${room.id}`;
  const rW = room.width;
  const rL = room.length;
  const rH = Math.min(room.height || 8, BUILDING_H - 0.25);
  const colorNum = parseInt((room.color || "#38bdf8").replace("#", ""), 16);

  const floorMat = new THREE.MeshStandardMaterial({
    color: colorNum, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false,
  });
  const roomFloor = new THREE.Mesh(new THREE.PlaneGeometry(rW, rL), floorMat);
  roomFloor.rotation.x = -Math.PI / 2;
  roomFloor.position.set(rx, FLOOR_Y + 0.012, rz);
  group.add(roomFloor);

  // ── Cut-away partition walls ───────────────────────────────────────────
  // Same masonry construction as the building's perimeter, one step lower so
  // the rooms read as inside it. The room's own colour survives as a thin
  // band under the coping — without it every room would be the same grey and
  // the floor plan would lose its at-a-glance zoning.
  const T2 = THEMES[isDark ? "dark" : "light"];
  const wallH = ROOM_PARAPET_H;
  const roomWallOpts = {
    height: wallH,
    thickness: PARAPET_T * 0.8,
    bodyColor: T2.parapetColor,
    capColor: T2.parapetCapColor,
    plinthColor: T2.parapetPlinthColor,
    accentColor: colorNum,
  };
  buildRoomWallRuns(room.id, rx, rz, rW, rL, roomWallOpts, gates)
    .forEach((run) => group.add(run));

  // corner piers, in the room's colour so the zone stays identifiable
  const pierMat = new THREE.MeshStandardMaterial({
    color: T2.parapetColor, metalness: 0.1, roughness: 0.9,
  });
  const pierCapMat = new THREE.MeshStandardMaterial({
    color: colorNum, emissive: colorNum, emissiveIntensity: 0.12, metalness: 0.3, roughness: 0.5,
  });
  const roomPierH = wallH + 0.05;
  const pierW = PARAPET_T * 1.05;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const px = rx + sx * (rW / 2), pz = rz + sz * (rL / 2);
    const pier = new THREE.Mesh(new THREE.BoxGeometry(pierW, roomPierH, pierW), pierMat);
    pier.position.set(px, FLOOR_Y + roomPierH / 2, pz);
    pier.castShadow = true;
    group.add(pier);
    const pierCap = new THREE.Mesh(new THREE.BoxGeometry(pierW * 1.12, 0.06, pierW * 1.12), pierCapMat);
    pierCap.position.set(px, FLOOR_Y + roomPierH + 0.03, pz);
    group.add(pierCap);
  });

  const topEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(rW, 0.05, rL)),
    new THREE.LineBasicMaterial({ color: colorNum, transparent: true, opacity: 0.35 }),
  );
  topEdges.position.set(rx, FLOOR_Y + wallH, rz);
  group.add(topEdges);

  const innerMarginGroup = createInnerMarginStrips(room, rx, rz, rW, rL);
  innerMarginGroup.name = `InnerMargin_${room.id}`;
  group.add(innerMarginGroup);

  const userTiles = new THREE.Group();
  userTiles.name = `UserTiles_${room.id}`;
  group.add(userTiles);

  const lc = document.createElement("canvas");
  lc.width = 512; lc.height = 140;
  const ctx = lc.getContext("2d");
  ctx.fillStyle = LP.panel;
  ctx.beginPath(); ctx.roundRect(0, 0, 512, 140, 12); ctx.fill();
  ctx.strokeStyle = LP.border; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(1, 1, 510, 138, 11); ctx.stroke();
  const r = (colorNum >> 16) & 255, gv = (colorNum >> 8) & 255, b = colorNum & 255;
  ctx.fillStyle = `rgb(${r},${gv},${b})`;
  ctx.fillRect(0, 0, 4, 140);
  ctx.font = `600 12px ${UI_FONT}`;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = `rgb(${r},${gv},${b})`;
  ctx.fillText((room.typeLabel || room.type || "ROOM").toUpperCase(), 22, 28);
  ctx.font = `700 34px ${UI_FONT}`;
  ctx.fillStyle = LP.title;
  ctx.fillText(room.name.substring(0, 22), 20, 66);
  ctx.font = `500 18px ${MONO_FONT}`;
  ctx.fillStyle = LP.sub;
  ctx.fillText(
    `${mToMm(rW)} × ${mToMm(rL)} × ${mToMm(rH)} mm  ·  ${room.kw || 0} kW`,
    20, 104,
  );
  const lt = new THREE.CanvasTexture(lc);
  lt.minFilter = THREE.LinearFilter;
  const ls = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthTest: false }));
  ls.scale.set(Math.max(rW * 0.36, 4.2), Math.max(rW * 0.36, 4.2) * (140 / 512), 1);
  ls.position.set(rx, FLOOR_Y + wallH + 0.75, rz);
  ls.renderOrder = 2;
  ls.userData.isLabel = true;
  group.add(ls);

  if (room.kw) {
    const kc = document.createElement("canvas");
    kc.width = 192; kc.height = 48;
    const kctx = kc.getContext("2d");
    kctx.fillStyle = LP.panel;
    kctx.beginPath(); kctx.roundRect(0, 0, 192, 48, 8); kctx.fill();
    kctx.strokeStyle = "#f59e0b"; kctx.lineWidth = 2;
    kctx.beginPath(); kctx.roundRect(1, 1, 190, 46, 7); kctx.stroke();
    kctx.font = `600 20px ${MONO_FONT}`;
    kctx.textAlign = "center"; kctx.textBaseline = "middle";
    kctx.fillStyle = "#f59e0b";
    kctx.fillText(`${room.kw} kW`, 96, 25);
    const kt = new THREE.CanvasTexture(kc);
    kt.minFilter = THREE.LinearFilter;
    const ks = new THREE.Sprite(new THREE.SpriteMaterial({ map: kt, transparent: true, depthTest: false }));
    ks.scale.set(2.2, 0.55, 1);
    ks.position.set(rx, FLOOR_Y + wallH + 0.3, rz + rL / 2 + 0.8);
    ks.userData.isLabel = true;
    group.add(ks);
  }

  group.userData.roomCenter = { x: rx, z: rz };
  group.userData.roomDims = { w: rW, l: rL, h: rH };
  group.userData.roomId = room.id;
  group.userData.roomType = room.type;
  // The recipe its partitions were built from, so a gate drag can re-cut the
  // walls live without knowing anything about the room's styling.
  group.userData.roomWallOpts = roomWallOpts;
  group.traverse((o) => { if (o !== group) o.userData.roomRoot = group; });
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM ENTRY / EXIT GATES
// ---------------------------------------------------------------------------
// Every room gets two named gates: one ENTRY and one EXIT. They are drawn as
// real door leaves standing in the room's wall line, colour-coded green and
// amber, each carrying a nameplate that says which it is.
//
// A gate is stored as { roomId, kind, side, t } -- a wall, and how far along
// that wall it sits (0..1). Storing it that way rather than as a world point
// is what makes the drag constraint fall out for free: wherever the pointer
// goes, the gate can only ever resolve to a point ON one of its own room's
// four walls, and it follows the room when the room is moved or resized.
// ═══════════════════════════════════════════════════════════════════════════
const GATE_W = 1.5;          // clear opening
const GATE_H = 2.1;
// Keeps a leaf clear of the corner piers at either end of a wall.
const GATE_INSET = GATE_W / 2 + 0.3;

const GATE_KINDS = {
  entry: { label: "ENTRY GATE", color: 0x22c55e, css: "#22c55e" },
  exit:  { label: "EXIT GATE",  color: 0xf59e0b, css: "#f59e0b" },
};

/** The walkable span along one wall, once both corners are kept clear. */
function gateSpan(rect, side) {
  const full = side === "N" || side === "S" ? rect.w : rect.l;
  return Math.max(0.001, full - GATE_INSET * 2);
}

/**
 * World transform for a gate sitting at offset `t` along `side`.
 *
 * The gate is always turned so its LOCAL +Z points out of the room. Every
 * part of the gate is then modelled once, in local space, and the threshold
 * pad and the direction chevron land on the correct side of the wall on all
 * four walls without a single per-wall special case.
 */
function gateTransform(rect, side, t) {
  const span = gateSpan(rect, side);
  const u = Math.min(1, Math.max(0, t));
  // Outward normal of the wall this gate stands in.
  const nx = side === "W" ? -1 : side === "E" ? 1 : 0;
  const nz = side === "N" ? -1 : side === "S" ? 1 : 0;
  const onZWall = side === "N" || side === "S";
  return {
    x: onZWall ? rect.cx - span / 2 + u * span : rect.cx + nx * (rect.w / 2),
    z: onZWall ? rect.cz + nz * (rect.l / 2) : rect.cz - span / 2 + u * span,
    rotY: Math.atan2(nx, nz),
    nx, nz,
  };
}

/**
 * Snap an arbitrary ground point onto the nearest wall of `rect`.
 *
 * This is the whole constraint: a drag reports a point anywhere on the
 * floor, and this answers with the closest legal slot on THIS room's walls
 * and nowhere else. Returns { side, t }.
 */
function nearestWallSlot(rect, px, pz) {
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const spanX = gateSpan(rect, "N");
  const spanZ = gateSpan(rect, "W");
  const tAlongX = clamp01((px - (rect.cx - spanX / 2)) / spanX);
  const tAlongZ = clamp01((pz - (rect.cz - spanZ / 2)) / spanZ);

  // Distance from the pointer to each wall, measured to the point on that
  // wall the gate would actually land on, so a pointer past a corner picks
  // the wall it is really nearer to rather than the one it is level with.
  const candidates = [
    { side: "N", t: tAlongX, p: gateTransform(rect, "N", tAlongX) },
    { side: "S", t: tAlongX, p: gateTransform(rect, "S", tAlongX) },
    { side: "W", t: tAlongZ, p: gateTransform(rect, "W", tAlongZ) },
    { side: "E", t: tAlongZ, p: gateTransform(rect, "E", tAlongZ) },
  ];
  let best = candidates[0], bestD = Infinity;
  candidates.forEach((c) => {
    const d = Math.hypot(px - c.p.x, pz - c.p.z);
    if (d < bestD) { bestD = d; best = c; }
  });
  return { side: best.side, t: best.t };
}

/** The nameplate above a gate: "ENTRY GATE" over the room's own name. */
function gateLabelSprite(gate, roomName, isDark) {
  const LP = labelPalette(isDark);
  const kind = GATE_KINDS[gate.kind] || GATE_KINDS.entry;
  const c = document.createElement("canvas");
  c.width = 320; c.height = 96;
  const ctx = c.getContext("2d");
  ctx.fillStyle = LP.panel;
  ctx.beginPath(); ctx.roundRect(0, 0, 320, 96, 10); ctx.fill();
  ctx.strokeStyle = kind.css; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(1.5, 1.5, 317, 93, 9); ctx.stroke();
  ctx.fillStyle = kind.css;
  ctx.fillRect(0, 0, 5, 96);
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.font = `700 26px ${UI_FONT}`;
  ctx.fillStyle = kind.css;
  ctx.fillText(kind.label, 20, 34);
  ctx.font = `500 17px ${MONO_FONT}`;
  ctx.fillStyle = LP.sub;
  ctx.fillText((roomName || "").substring(0, 24), 20, 68);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(2.6, 2.6 * (96 / 320), 1);
  sprite.userData.isLabel = true;
  return sprite;
}

/**
 * One gate: a leaf in a frame, a threshold pad on the floor, a direction
 * chevron and a nameplate. Tagged all over with `gateRoot` so a single
 * raycast against the gates group can pick it up from any of its parts.
 */
function createRoomGate(gate, rect, roomName, isDark) {
  const kind = GATE_KINDS[gate.kind] || GATE_KINDS.entry;
  const tr = gateTransform(rect, gate.side, gate.t);
  const group = new THREE.Group();
  group.name = `Gate_${gate.id}`;
  group.position.set(tr.x, FLOOR_Y, tr.z);
  group.rotation.y = tr.rotY;

  const leafMat = new THREE.MeshStandardMaterial({
    color: kind.color, metalness: 0.35, roughness: 0.45,
    emissive: kind.color, emissiveIntensity: 0.18,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1, metalness: 0.6, roughness: 0.35,
  });

  const leaf = new THREE.Mesh(new THREE.BoxGeometry(GATE_W, GATE_H, 0.08), leafMat);
  leaf.position.y = GATE_H / 2;
  leaf.castShadow = true;
  group.add(leaf);

  // A vision panel, so the leaf reads as a door and not a coloured slab.
  const vision = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_W * 0.42, GATE_H * 0.26, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x0f172a, metalness: 0.2, roughness: 0.15,
      transparent: true, opacity: 0.55,
    }),
  );
  vision.position.set(0, GATE_H * 0.7, 0.05);
  group.add(vision);

  // The frame is a hair deeper than the partition it stands in, so it fills
  // the carved opening edge to edge instead of leaving a slot of daylight.
  const frameD = PARAPET_T * 0.8 + 0.04;
  [-1, 1].forEach((sx) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, GATE_H + 0.14, frameD), frameMat);
    jamb.position.set(sx * (GATE_W / 2 + 0.04), (GATE_H + 0.14) / 2, 0);
    group.add(jamb);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(GATE_W + 0.16, 0.1, frameD), frameMat);
  lintel.position.y = GATE_H + 0.08;
  group.add(lintel);

  // Threshold sill across the bottom of the opening — without it the carved
  // wall reads as a gap someone forgot to finish.
  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_W + 0.16, 0.05, frameD + 0.06),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4, roughness: 0.6 }),
  );
  sill.position.y = 0.025;
  group.add(sill);

  // Threshold pad on the floor — also the easiest thing to grab when
  // dragging the gate from a top-down camera.
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(GATE_W + 0.5, 1.5),
    new THREE.MeshBasicMaterial({
      color: kind.color, transparent: true, opacity: 0.3,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  pad.rotation.x = -Math.PI / 2;
  // Pushed to whichever side of the wall the traffic uses: an entry pad sits
  // outside the room, an exit pad inside it.
  pad.position.set(0, 0.02, (gate.kind === "entry" ? 1 : -1) * 0.85);
  pad.renderOrder = 3;
  group.add(pad);

  // Direction chevron: entry points into the room, exit points out of it.
  const chevron = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.6, 3),
    new THREE.MeshBasicMaterial({ color: kind.color, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  chevron.rotation.set(Math.PI / 2, 0, 0);
  if (gate.kind === "entry") chevron.rotation.x = -Math.PI / 2;
  chevron.position.set(0, 0.06, (gate.kind === "entry" ? 1 : -1) * 0.85);
  chevron.renderOrder = 4;
  group.add(chevron);

  const plate = gateLabelSprite(gate, roomName, isDark);
  plate.position.set(0, GATE_H + 0.75, 0);
  group.add(plate);

  group.userData.gateId = gate.id;
  group.userData.gateRoomId = gate.roomId;
  group.traverse((o) => { if (o !== group) o.userData.gateRoot = group; });
  return group;
}

// ── Walk-path floor texture ─────────────────────────────────────────────
// A corridor inside a datacenter is a walk path, not a road: smooth, light
// epoxy-coated concrete with only a very fine, low-contrast speckle so it
// doesn't read as flat plastic. No asphalt grain, no cracks.
function createCorridorPavementTexture(isDark) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d");

  ctx.fillStyle = isDark ? "#3b434f" : "#8a9098";
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 2500; i++) {
    const shade = Math.random() * 0.06;
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(255,255,255,${shade})`
      : `rgba(0,0,0,${shade})`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 1, 1);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ── Walk-path yellow lines ──────────────────────────────────────────────
// Yellow floor-marking tape run just inside the edges of the walkway. The
// tape follows the outline of all the corridors on the floor taken
// together, not each corridor on its own: where two walkways meet, the
// junction is left open (no tape across the mouth) and the tape turns the
// corner into the other walkway instead of crossing it. A dead end gets a
// closing line. `allRects` is every corridor on the floor as world-space
// {x0, x1, z0, z1}; without it the corridor is simply outlined.
const WALK_LINE_W = 0.12;     // tape width, m
const WALK_LINE_INSET = 0.12; // gap between the corridor edge and the tape, m

function buildWalkPathLineGeos(own, allRects) {
  const rects = allRects?.length ? allRects : [own];
  const E = 0.01;
  const W = WALK_LINE_W, IN = WALK_LINE_INSET;
  const covered = (x, z) => rects.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
  // Each edge is walked along u; v is the edge's fixed coordinate and
  // inSign says which side of it the walkway is on.
  const edges = [
    { alongX: true,  v: own.z0, inSign: 1,  lo: own.x0, hi: own.x1 },
    { alongX: true,  v: own.z1, inSign: -1, lo: own.x0, hi: own.x1 },
    { alongX: false, v: own.x0, inSign: 1,  lo: own.z0, hi: own.z1 },
    { alongX: false, v: own.x1, inSign: -1, lo: own.z0, hi: own.z1 },
  ];
  const geos = [];
  edges.forEach(({ alongX, v, inSign, lo, hi }) => {
    const cov = (u, w) => (alongX ? covered(u, w) : covered(w, u));
    const vOut = v - inSign * E, vIn = v + inSign * E;
    // Cut the edge wherever another corridor starts or stops along it, and
    // keep the pieces that face open floor -- the rest is a junction.
    const cuts = [lo, hi];
    rects.forEach((r) => {
      [alongX ? r.x0 : r.z0, alongX ? r.x1 : r.z1].forEach((c) => { if (c > lo && c < hi) cuts.push(c); });
    });
    cuts.sort((a, b) => a - b);
    const runs = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1];
      if (b - a < 1e-6 || cov((a + b) / 2, vOut)) continue;
      const last = runs[runs.length - 1];
      if (last && Math.abs(last[1] - a) < 1e-6) last[1] = b;
      else runs.push([a, b]);
    }
    // Ends: an inside corner runs on into the other walkway to meet its
    // tape, a straight continuation stops dead so the next piece carries
    // on, and an outside corner stops short so the two tapes meet square.
    const reach = (u, dir) => {
      const inside = cov(u + dir * E, vIn), outside = cov(u + dir * E, vOut);
      if (inside && outside) return IN + W;
      return inside ? 0 : -IN;
    };
    const vc = v + inSign * (IN + W / 2);
    runs.forEach(([a, b]) => {
      const u0 = a - reach(a, -1), u1 = b + reach(b, 1);
      if (u1 - u0 < 1e-3) return;
      const uc = (u0 + u1) / 2;
      // Laid flat with rotation.x = -90deg, which maps local +Y onto
      // world -Z -- so the world z of each strip is negated here.
      const g = alongX ? new THREE.PlaneGeometry(u1 - u0, W) : new THREE.PlaneGeometry(W, u1 - u0);
      if (alongX) g.translate(uc, -vc, 0);
      else g.translate(vc, -uc, 0);
      geos.push(g);
    });
  });
  return geos;
}

// ── Corridor render ─────────────────────────────────────────────────────
function createCorridor3DAt(room, rx, rz, isDark, corridorRects = null) {
  const LP = labelPalette(isDark);
  const group = new THREE.Group();
  group.name = `Room_${room.id}`;
  const rW = room.width;
  const rL = room.length;

  const pavementTex = createCorridorPavementTexture(isDark);
  const TILE_WORLD = 2;
  pavementTex.repeat.set(Math.max(1, rW / TILE_WORLD), Math.max(1, rL / TILE_WORLD));
  const floorMat = new THREE.MeshStandardMaterial({
    map: pavementTex, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(rW, rL), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(rx, FLOOR_Y + 0.008, rz);
  group.add(floor);

  // A flat walk path: no kerbs, no white road edge lines, no dashed centre
  // line -- just yellow safety tape along its edges, all of it one mesh.
  const own = { x0: rx - rW / 2, x1: rx + rW / 2, z0: rz - rL / 2, z1: rz + rL / 2 };
  const lineGeos = buildWalkPathLineGeos(own, corridorRects);
  if (lineGeos.length) {
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, emissive: 0xeab308, emissiveIntensity: isDark ? 0.3 : 0.12, roughness: 0.55,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    const lines = new THREE.Mesh(mergeSimpleGeometries(lineGeos), lineMat);
    lines.rotation.x = -Math.PI / 2;
    lines.position.set(0, FLOOR_Y + 0.015, 0);
    group.add(lines);
  }

  const userTiles = new THREE.Group();
  userTiles.name = `UserTiles_${room.id}`;
  group.add(userTiles);

  const lc = document.createElement("canvas");
  lc.width = 420; lc.height = 104;
  const ctx = lc.getContext("2d");
  ctx.fillStyle = LP.panel;
  ctx.beginPath(); ctx.roundRect(0, 0, 420, 104, 10); ctx.fill();
  ctx.strokeStyle = LP.border; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(1, 1, 418, 102, 9); ctx.stroke();
  ctx.fillStyle = "#475569";
  ctx.fillRect(0, 0, 4, 104);
  ctx.font = `600 11px ${UI_FONT}`;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = LP.sub;
  ctx.fillText("CORRIDOR", 20, 24);
  ctx.font = `700 28px ${UI_FONT}`;
  ctx.fillStyle = LP.title;
  ctx.fillText(room.name.substring(0, 20), 18, 54);
  ctx.font = `500 16px ${MONO_FONT}`;
  ctx.fillStyle = LP.sub;
  ctx.fillText(`${mToMm(rW)} × ${mToMm(rL)} mm`, 18, 84);
  const lt = new THREE.CanvasTexture(lc);
  lt.minFilter = THREE.LinearFilter;
  const ls = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthTest: false }));
  // Capped: a perimeter walkway can be the full width of the building, and
  // an un-capped nameplate on one would be a banner across the whole floor.
  const corridorLabelW = Math.min(Math.max(rW * 0.3, 3.2), 5.5);
  ls.scale.set(corridorLabelW, corridorLabelW * (104 / 420), 1);
  ls.position.set(rx, FLOOR_Y + 1.25, rz);
  ls.renderOrder = 2;
  ls.userData.isLabel = true;
  group.add(ls);

  group.userData.roomCenter = { x: rx, z: rz };
  group.userData.roomDims = { w: rW, l: rL, h: 0.5 };
  group.userData.roomId = room.id;
  group.userData.roomType = "corridor";
  group.traverse((o) => { if (o !== group) o.userData.roomRoot = group; });
  return group;
}

function getDoorTransform(direction, position, oW, oL, doorW) {
  const marginFactor = 0.18;
  const posFactor = position === "start" ? 0 : position === "end" ? 1 : 0.5;
  let x = 0, z = 0, rotY = 0;

  switch (direction) {
    case "North": {
      z = -(oL / 2 - WALL_T / 2);
      const availX = oW - doorW - oW * marginFactor * 2;
      x = -oW / 2 + oW * marginFactor + doorW / 2 + posFactor * availX;
      rotY = 0;
      break;
    }
    case "East": {
      x = oW / 2 - WALL_T / 2;
      const availZ = oL - doorW - oL * marginFactor * 2;
      z = -oL / 2 + oL * marginFactor + doorW / 2 + posFactor * availZ;
      rotY = Math.PI / 2;
      break;
    }
    case "West": {
      x = -(oW / 2 - WALL_T / 2);
      const availZ = oL - doorW - oL * marginFactor * 2;
      z = -oL / 2 + oL * marginFactor + doorW / 2 + posFactor * availZ;
      rotY = Math.PI / 2;
      break;
    }
    case "South":
    default: {
      z = oL / 2 - WALL_T / 2;
      const availX = oW - doorW - oW * marginFactor * 2;
      x = -oW / 2 + oW * marginFactor + doorW / 2 + posFactor * availX;
      rotY = 0;
      break;
    }
  }
  return { x, z, rotY };
}

function createCompassLabels(oW, oL, isDark, LP = labelPalette(isDark)) {
  const group = new THREE.Group();
  group.name = "CompassLabels";
  const offset = 6;
  const points = [
    { text: "N", x: 0, z: -(oL / 2 + offset) },
    { text: "S", x: 0, z: oL / 2 + offset },
    { text: "E", x: oW / 2 + offset, z: 0 },
    { text: "W", x: -(oW / 2 + offset), z: 0 },
  ];
  points.forEach(({ text, x, z }) => {
    const c = document.createElement("canvas");
    c.width = 96; c.height = 96;
    const ctx = c.getContext("2d");
    ctx.fillStyle = LP.panel;
    ctx.beginPath();
    ctx.arc(48, 48, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LP.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.font = `700 38px ${UI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = LP.accent;
    ctx.fillText(text, 48, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.35, 1.35, 1);
    sp.position.set(x, FLOOR_Y + 1.0, z);
    sp.renderOrder = 5;
    sp.userData.isLabel = true;
    group.add(sp);
  });
  return group;
}

// ── Build outer building shell (door-aware) ──────────────────────────────
function createOuterBuilding(lengthM, breadthM, dcName, T, doorDirection = "South", doorPosition = "center") {
  const g = new THREE.Group();
  g.name = "DataCenter";
  const isDark = T.isDark !== false;
  const LP = labelPalette(isDark);
  const oW = lengthM + WALL_T * 2;
  const oL = breadthM + WALL_T * 2;

  const floorSystem = createRaisedFloorSystem(oW, oL, T);
  g.add(floorSystem);

  g.add(createCeilingSystem(oW, oL, T));

  // Skip the line grid when the floor is already wearing a tile texture: two
  // grids on top of each other at that scale is exactly the shimmer the
  // textured path exists to remove.
  if (!floorSystem.userData.texturedFloor) {
    const tileGrid = createTileGrid(oW, oL, TILE_SIZE_M, T.gridColor, T.gridColor);
    tileGrid.position.y = RAISED_FLOOR_H + 0.001;
    tileGrid.userData.layer = "grid";
    g.add(tileGrid);
  }
  g.userData.gridOriginX = -oW / 2;
  g.userData.gridOriginZ = -oL / 2;
  g.userData.tileSizeM = TILE_SIZE_M;

  const halfW = oW / 2, halfD = oL / 2;

  // ── Cut-away perimeter wall ────────────────────────────────────────────
  // Four solid runs with a coping cap and skirting, sliced off at waist
  // height. The doorway is carved out of whichever run it lands on, so the
  // entrance is a real opening in the masonry rather than a panel stuck to
  // the face of an unbroken wall.
  const doorW = doorWidthFor(oW, oL);
  const { x: doorX, z: doorZ, rotY } = getDoorTransform(doorDirection, doorPosition, oW, oL, doorW);
  const openingW = doorW + 0.18;

  const parapetOpts = {
    height: PARAPET_H,
    thickness: PARAPET_T,
    bodyColor: T.parapetColor,
    capColor: T.parapetCapColor,
    plinthColor: T.parapetPlinthColor,
  };

  [
    { side: "North", len: oW, x: 0,      z: -halfD, rot: 0,             at: doorX },
    { side: "South", len: oW, x: 0,      z: halfD,  rot: 0,             at: doorX },
    // Rotating by -90° maps the run's local +X onto world +Z, so an opening
    // centre on these two sides is just the door's world z, unflipped.
    { side: "West",  len: oL, x: -halfW, z: 0,      rot: -Math.PI / 2,  at: doorZ },
    { side: "East",  len: oL, x: halfW,  z: 0,      rot: -Math.PI / 2,  at: doorZ },
  ].forEach(({ side, len, x, z, rot, at }) => {
    const run = createParapetRun(len + PARAPET_T, {
      ...parapetOpts,
      openings: side === doorDirection ? [{ center: at, width: openingW }] : [],
    });
    run.position.set(x, FLOOR_Y, z);
    run.rotation.y = rot;
    run.name = `PerimeterWall_${side}`;
    g.add(run);
  });

  // Corner piers tie the four runs together and hide the mitre joints.
  const pierMat = new THREE.MeshStandardMaterial({
    color: T.parapetCapColor, metalness: 0.12, roughness: 0.85,
  });
  const pierH = PARAPET_H + 0.05;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(PARAPET_T * 1.4, pierH, PARAPET_T * 1.4), pierMat);
    pier.position.set(sx * halfW, FLOOR_Y + pierH / 2, sz * halfD);
    pier.castShadow = true;
    g.add(pier);
  });

  // ── Main entrance door, standing in the opening ────────────────────────
  // Left taller than the wall on purpose: in a cut-away plan the door slab
  // rising past the coping is what makes the entrance findable at a glance.
  const doorGroup = new THREE.Group();
  doorGroup.name = "MainDoor";

  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, DOOR_H, 0.09),
    new THREE.MeshStandardMaterial({ color: T.parapetPlinthColor, metalness: 0.4, roughness: 0.45 }),
  );
  leaf.position.y = DOOR_H / 2;
  leaf.castShadow = true;
  doorGroup.add(leaf);

  // Dark frame, not the theme's accent blue: on a grey masonry wall a bright
  // blue surround pulls the eye off the equipment the view is actually about.
  const jambMat = new THREE.MeshStandardMaterial({
    color: T.parapetPlinthColor, metalness: 0.5, roughness: 0.4,
  });
  [-1, 1].forEach((sx) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.07, DOOR_H + 0.12, PARAPET_T * 1.15), jambMat);
    jamb.position.set(sx * (doorW / 2 + 0.035), (DOOR_H + 0.12) / 2, 0);
    doorGroup.add(jamb);
  });
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(doorW + 0.14, 0.1, PARAPET_T * 1.15), jambMat);
  lintel.position.y = DOOR_H + 0.07;
  doorGroup.add(lintel);

  // vision slot + lever, so it reads as a door and not a slab
  const vision = new THREE.Mesh(
    new THREE.BoxGeometry(doorW * 0.34, DOOR_H * 0.3, 0.02),
    new THREE.MeshStandardMaterial({
      color: T.wallTrimColor, emissive: T.wallTrimColor, emissiveIntensity: 0.35,
      transparent: true, opacity: 0.55,
    }),
  );
  vision.position.set(0, DOOR_H * 0.68, 0.05);
  doorGroup.add(vision);
  const lever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, doorW * 0.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 0.9, roughness: 0.15 }),
  );
  lever.rotation.z = Math.PI / 2;
  lever.position.set(-doorW * 0.24, DOOR_H * 0.45, 0.075);
  doorGroup.add(lever);

  doorGroup.position.set(doorX, FLOOR_Y, doorZ);
  doorGroup.rotation.y = rotY;
  g.add(doorGroup);

  const dc2 = document.createElement("canvas");
  dc2.width = 256; dc2.height = 64;
  const dctx = dc2.getContext("2d");
  dctx.fillStyle = LP.panel;
  dctx.beginPath(); dctx.roundRect(0, 0, 256, 64, 8); dctx.fill();
  dctx.strokeStyle = LP.accent; dctx.lineWidth = 2;
  dctx.beginPath(); dctx.roundRect(1, 1, 254, 62, 7); dctx.stroke();
  dctx.font = `600 22px ${UI_FONT}`;
  dctx.textAlign = "center"; dctx.textBaseline = "middle";
  dctx.fillStyle = LP.accent;
  dctx.fillText(`ENTRANCE · ${doorDirection.toUpperCase()}`, 128, 32);
  const dTex = new THREE.CanvasTexture(dc2);
  dTex.minFilter = THREE.LinearFilter;
  const dTagSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: dTex, transparent: true, depthTest: false }),
  );
  dTagSprite.scale.set(1.6, 0.4, 1);
  dTagSprite.position.set(doorX, FLOOR_Y + DOOR_H + 0.45, doorZ);
  dTagSprite.renderOrder = 4;
  dTagSprite.userData.isLabel = true;
  g.add(dTagSprite);

  const compass = createCompassLabels(oW, oL, isDark, LP);
  compass.userData.layer = "labels";
  g.add(compass);

  const lc = document.createElement("canvas");
  lc.width = 1280;
  lc.height = 220;
  const lx = lc.getContext("2d");
  lx.fillStyle = LP.panel;
  lx.beginPath(); lx.roundRect(0, 0, 1280, 220, 18); lx.fill();
  lx.strokeStyle = LP.border; lx.lineWidth = 3;
  lx.beginPath(); lx.roundRect(1.5, 1.5, 1277, 217, 17); lx.stroke();
  lx.fillStyle = LP.accent;
  lx.fillRect(0, 0, 1280, 5);
  lx.font = `700 68px ${UI_FONT}`;
  lx.textAlign = "center";
  lx.textBaseline = "middle";
  lx.fillStyle = LP.title;
  lx.fillText((dcName || "Data Center").substring(0, 28), 640, 105);
  lx.font = `500 34px ${MONO_FONT}`;
  lx.fillStyle = LP.sub;
  lx.fillText(
    `${lengthM.toFixed(1)} m (E-W)  ×  ${breadthM.toFixed(1)} m (N-S)   ·   ${(lengthM * breadthM).toFixed(1)} m²`,
    640, 172,
  );
  const lt = new THREE.CanvasTexture(lc);
  lt.minFilter = THREE.LinearFilter;
  const ls = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthTest: false }));
  ls.scale.set(Math.max(oW * 0.18, 9), Math.max(oW * 0.18, 9) * (220 / 1280), 1);
  ls.position.set(0, FLOOR_Y + BUILDING_H + 1.4, 0);
  ls.renderOrder = 2;
  ls.userData.isLabel = true;
  g.add(ls);
  return g;
}

// Rooms with an explicit posX/posZ render exactly where the user put them;
// rooms with no explicit position keep the original row-wise auto-flow.
function computeRoomLayout(rooms, lengthM, breadthM, dcMargins) {
  const halfL = lengthM / 2, halfB = breadthM / 2;
  const dcTop = dcMargins?.top ?? 2;
  const dcBottom = dcMargins?.bottom ?? 2;
  const dcLeft = dcMargins?.left ?? 2;
  const dcRight = dcMargins?.right ?? 2;

  const boundLeft = -halfL + dcLeft;
  const boundRight = halfL - dcRight;
  const boundTop = -halfB + dcTop;
  const boundBottom = halfB - dcBottom;

  const placed = [];

  const explicitRooms = rooms.filter((r) => r.posX != null && r.posZ != null);
  const autoRooms = rooms.filter((r) => !(r.posX != null && r.posZ != null));

  explicitRooms.forEach((room) => {
    placed.push({
      room, rx: room.posX, rz: room.posZ,
      marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0,
    });
  });

  let cursorX = boundLeft, rowStartZ = boundTop, rowMaxRL = 0;

  autoRooms.forEach((room) => {
    const rW = room.width, rL = room.length;
    const mUnit = room.margins?.unit || "m";
    const factor = MARGIN_UNIT_TO_METERS[mUnit] ?? 1;
    const left = (room.margins?.left ?? 0) * factor;
    const right = (room.margins?.right ?? 0) * factor;
    const top = (room.margins?.top ?? 0) * factor;
    const bottom = (room.margins?.bottom ?? 0) * factor;

    if (cursorX + left + rW + right > boundRight) {
      cursorX = boundLeft;
      rowStartZ += rowMaxRL + Math.max(top, bottom, 0);
      rowMaxRL = 0;
    }

    let rx = cursorX + left + rW / 2;
    let rz = rowStartZ + top + rL / 2;

    const roomLeftEdge = rx - rW / 2 - left;
    const roomRightEdge = rx + rW / 2 + right;
    const roomTopEdge = rz - rL / 2 - top;
    const roomBottomEdge = rz + rL / 2 + bottom;

    if (roomLeftEdge < boundLeft) rx += boundLeft - roomLeftEdge;
    if (roomRightEdge > boundRight) rx -= roomRightEdge - boundRight;
    if (roomTopEdge < boundTop) rz += boundTop - roomTopEdge;
    if (roomBottomEdge > boundBottom) rz -= roomBottomEdge - boundBottom;

    placed.push({
      room, rx, rz,
      marginLeft: left, marginRight: right, marginTop: top, marginBottom: bottom,
      rowStartZ,
    });

    cursorX += left + rW + right;
    rowMaxRL = Math.max(rowMaxRL, top + rL + bottom);
  });

  return placed;
}

// ── Margin band INSIDE the room, inset from its own walls ───────────────
function createInnerMarginStrips(room, rx, rz, rW, rL) {
  const group = new THREE.Group();
  group.name = `InnerMargin_${room.id}`;
  const im = room.innerMargins;
  if (!im) return group;

  const mUnit = room.margins?.unit || "m";
  const factor = MARGIN_UNIT_TO_METERS[mUnit] ?? 1;
  const top = (im.top || 0) * factor;
  const bottom = (im.bottom || 0) * factor;
  const left = (im.left || 0) * factor;
  const right = (im.right || 0) * factor;
  if (!top && !bottom && !left && !right) return group;

  const colorNum = hexToColorNum(room.innerMarginColor || DEFAULT_MARGIN_COLOR);

  const Y = FLOOR_Y + 0.02;
  const mat = new THREE.MeshStandardMaterial({
    color: colorNum, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: colorNum, transparent: true, opacity: 0.55 });

  const addBand = (w, d, x, z) => {
    if (w <= 0 || d <= 0) return;
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, Y, z);
    group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    edges.rotation.x = -Math.PI / 2;
    edges.position.set(x, Y + 0.001, z);
    group.add(edges);
  };

  if (top > 0) addBand(rW, top, rx, rz - rL / 2 + top / 2);
  if (bottom > 0) addBand(rW, bottom, rx, rz + rL / 2 - bottom / 2);
  if (left > 0) addBand(left, rL - top - bottom, rx - rW / 2 + left / 2, rz + (top - bottom) / 2);
  if (right > 0) addBand(right, rL - top - bottom, rx + rW / 2 - right / 2, rz + (top - bottom) / 2);

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE SHAPES — every category gets a real, recognizable silhouette.
// Each builder returns { group, heightM }.
// ═══════════════════════════════════════════════════════════════════════════
// Cabinet frame: 26 mm of visibly lighter metal around every panel. Wide
// enough to read at a distance, narrow enough that a 600 mm cabinet still
// looks like a 600 mm cabinet.
const RACK_FRAME_W = 0.026;
const RACK_FRAME_COLOR = 0x6c7d96;
// Clear air on every side of a cabinet. Racks sit on adjacent 600 mm tiles,
// so without it neighbours share a face and the row reads as one block.
const RACK_GAP = 0.006;

const RACK_VISUAL = {
  colors: { compute: 0x1a2535, network: 0x1a3525, storage: 0x2a1a35, empty: 0x0f1520 },
  accent: { compute: 0x38bdf8, network: 0x22c55e, storage: 0x6366f1, empty: 0x1e2d45 },
  frame: { metalness: 0.8, roughness: 0.3 },
};

function seededRandom(seedStr) {
  let h = 1779033703 ^ String(seedStr).length;
  for (let i = 0; i < String(seedStr).length; i++) {
    h = Math.imul(h ^ String(seedStr).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeServerUnit(heightU, rackD) {
  const g = new THREE.Group();
  const H = heightU * U_HEIGHT;
  const W = EQUIP_W;
  const D = rackD * 0.9;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.9, D),
    new THREE.MeshStandardMaterial({ color: 0x1a2535, metalness: 0.8, roughness: 0.3 }),
  );
  body.castShadow = true;
  g.add(body);

  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.98, H * 0.85, 0.005),
    new THREE.MeshStandardMaterial({ color: 0x0f1828, metalness: 0.5, roughness: 0.5 }),
  );
  bezel.position.z = D / 2 + 0.001;
  g.add(bezel);

  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 }),
  );
  led.position.set(-W * 0.4, 0, D / 2 + 0.007);
  g.add(led);

  if (heightU >= 2) {
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.45, H * 0.08, 0.001),
      new THREE.MeshStandardMaterial({ color: 0x0a1020 }),
    );
    track.position.set(-W * 0.1, -H * 0.15, D / 2 + 0.007);
    g.add(track);

    const fillW = W * 0.45 * 0.62;
    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(fillW, H * 0.07, 0.001),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 }),
    );
    fill.position.set(-W * 0.1 - (W * 0.45) / 2 + fillW / 2, -H * 0.15, D / 2 + 0.008);
    g.add(fill);

    const bay = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.3, H * 0.4, 0.003),
      new THREE.MeshStandardMaterial({ color: 0x1a2535, metalness: 0.9, roughness: 0.1 }),
    );
    bay.position.set(W * 0.15, H * 0.1, D / 2 + 0.006);
    g.add(bay);
  }
  return g;
}

function makeSwitchUnit(heightU, rackD) {
  const g = new THREE.Group();
  const H = heightU * U_HEIGHT;
  const W = EQUIP_W;
  const D = rackD * 0.85;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.9, D),
    new THREE.MeshStandardMaterial({ color: 0x1a3525, metalness: 0.8, roughness: 0.3 }),
  );
  body.castShadow = true;
  g.add(body);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.98, H * 0.85, 0.005),
    new THREE.MeshStandardMaterial({ color: 0x0f1a10, metalness: 0.5, roughness: 0.5 }),
  );
  panel.position.z = D / 2 + 0.001;
  g.add(panel);

  [0, 1, 2, 3, 4].forEach((i) => {
    const on = i < 4;
    const c = on ? 0x22c55e : 0x1a3525;
    const port = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.012, 0.004),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: on ? 1.0 : 0.2 }),
    );
    port.position.set((i - 2) * (W * 0.16), H * 0.1, D / 2 + 0.007);
    g.add(port);
  });

  const link = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 }),
  );
  link.position.set(W * 0.4, -H * 0.2, D / 2 + 0.007);
  g.add(link);
  return g;
}

function makeUpsUnit(heightU, rackD) {
  const g = new THREE.Group();
  const H = heightU * U_HEIGHT;
  const W = EQUIP_W;
  const D = rackD * 0.9;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.95, D),
    new THREE.MeshStandardMaterial({ color: 0x2a1f0a, metalness: 0.7, roughness: 0.4 }),
  );
  body.castShadow = true;
  g.add(body);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.98, H * 0.9, 0.005),
    new THREE.MeshStandardMaterial({ color: 0x1a1208, metalness: 0.5, roughness: 0.6 }),
  );
  panel.position.z = D / 2 + 0.001;
  g.add(panel);

  const track = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.55, H * 0.1, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a }),
  );
  track.position.set(0, H * 0.2, D / 2 + 0.006);
  g.add(track);

  const fillW = W * 0.55 * 0.92;
  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(fillW, H * 0.08, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8 }),
  );
  fill.position.set(-(W * 0.55) / 2 + fillW / 2, H * 0.2, D / 2 + 0.008);
  g.add(fill);

  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.012, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 }),
  );
  led.position.set(W * 0.38, H * 0.2, D / 2 + 0.008);
  g.add(led);
  return g;
}

function makePatchPanelUnit(heightU, rackD, fiber) {
  const g = new THREE.Group();
  const H = heightU * U_HEIGHT;
  const W = EQUIP_W;
  const D = rackD * 0.3;
  const portColor = fiber ? 0xff6600 : 0x4080ff;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.9, D),
    new THREE.MeshStandardMaterial({ color: 0x0f1520, metalness: 0.7, roughness: 0.4 }),
  );
  body.castShadow = true;
  g.add(body);

  for (let i = 0; i < 12; i++) {
    const port = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.012, 0.006),
      new THREE.MeshStandardMaterial({ color: portColor, emissive: portColor, emissiveIntensity: 0.3 }),
    );
    port.position.set((i - 5.5) * (W / 13), 0, D / 2 + 0.004);
    g.add(port);
  }
  return g;
}

function makeBlankUnit(heightU) {
  const g = new THREE.Group();
  const H = heightU * U_HEIGHT;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(EQUIP_W, H * 0.9, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x0d1520, metalness: 0.6, roughness: 0.6 }),
  );
  g.add(plate);
  return g;
}

// ── Rack interior: built once as separate parts, shipped as merged meshes ─
// A 42U cabinet's procedural filler is ~35 units of 1-13 little boxes each --
// roughly 150 meshes, every one with its own geometry AND its own material.
// Twenty racks in a row was therefore ~3000 draw calls plus ~3000 more for
// the shadow pass, which is exactly why the view crawled until TRANSPARENT
// (which hides this filler wholesale) was switched on.
//
// Nothing about the look needs that. Every part is a plain box with no map,
// so once a rack's parts are built they are baked into ONE merged mesh per
// distinct material -- about six meshes for the whole cabinet -- and the
// materials themselves are shared across every rack in the building. Same
// pixels, ~25x fewer draw calls.
const RACK_MAT_CACHE = new Map();
function sharedStandardMaterial(params) {
  const key = [
    params.color ?? 0xffffff,
    params.metalness ?? 0,
    params.roughness ?? 1,
    params.emissive ?? 0,
    params.emissiveIntensity ?? 1,
  ].join("|");
  let m = RACK_MAT_CACHE.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: params.color ?? 0xffffff,
      metalness: params.metalness ?? 0,
      roughness: params.roughness ?? 1,
    });
    if (params.emissive != null) {
      m.emissive.setHex(params.emissive);
      m.emissiveIntensity = params.emissiveIntensity ?? 1;
    }
    m.userData.isSharedRackMat = true;
    RACK_MAT_CACHE.set(key, m);
  }
  return m;
}

// Signature of a material as it exists on a built part, so two parts that
// look identical are merged into the same batch.
function rackMatSignature(m) {
  return [
    m.color ? m.color.getHex() : 0xffffff,
    m.metalness ?? 0,
    m.roughness ?? 1,
    m.emissive ? m.emissive.getHex() : 0,
    m.emissiveIntensity ?? 1,
  ].join("|");
}

// Flatten a freshly built group of plain boxes into one merged part per
// material. The parts' own transforms are baked into the vertex data, so the
// result is pixel-identical to the un-merged version -- it is just drawn in
// six calls instead of a hundred and fifty.
function mergeGroupToParts(src) {
  src.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(src.matrixWorld).invert();
  const rel = new THREE.Matrix4();
  const batches = new Map(); // signature -> { geos, material, castShadow }

  src.traverse((o) => {
    if (!o.isMesh || !o.geometry || Array.isArray(o.material) || !o.material) return;
    const m = o.material;
    const sig = rackMatSignature(m);
    let batch = batches.get(sig);
    if (!batch) {
      batch = {
        geos: [],
        material: sharedStandardMaterial({
          color: m.color ? m.color.getHex() : 0xffffff,
          metalness: m.metalness,
          roughness: m.roughness,
          emissive: m.emissive ? m.emissive.getHex() : 0,
          emissiveIntensity: m.emissiveIntensity,
        }),
        castShadow: false,
      };
      batches.set(sig, batch);
    }
    const g = o.geometry.clone();
    g.applyMatrix4(rel.multiplyMatrices(inv, o.matrixWorld));
    batch.geos.push(g);
    if (o.castShadow) batch.castShadow = true;
  });

  const parts = [];
  batches.forEach((batch) => {
    let geo = batch.geos[0];
    if (batch.geos.length > 1) {
      const merged = BufferGeometryUtils.mergeBufferGeometries(batch.geos, false);
      if (merged) {
        batch.geos.forEach((g) => g.dispose());
        geo = merged;
      } else {
        // Merge refused (mismatched attributes) -- fall back to keeping the
        // parts as they are rather than dropping them from the cabinet.
        batch.geos.forEach((g, idx) => {
          if (idx > 0) parts.push({ geometry: g, material: batch.material, castShadow: batch.castShadow });
        });
      }
    }
    parts.push({ geometry: geo, material: batch.material, castShadow: batch.castShadow });
  });

  // These live in the cache and are shared by every rack that uses them, so
  // the per-device dispose pass has to leave them alone (see disposeGroup).
  parts.forEach((prt) => { prt.geometry.userData.isSharedRackGeo = true; });

  // The originals were only ever scaffolding for the merge.
  src.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  return parts;
}

// Merged interior parts, cached per (depth, height, seed). Adding one device
// re-runs the whole device list, so without this every existing rack would
// re-generate and re-merge its ~150 parts on every single placement.
const RACK_EQUIP_CACHE = new Map();
const RACK_EQUIP_CACHE_MAX = 400;

function buildRackEquipment(rackW, rackD, rackH, seedStr) {
  const group = new THREE.Group();
  group.name = "RackEquipment";
  // rackW only ever shows up as the group's x-scale, so it stays out of the
  // cache key -- a 600 mm and an 800 mm cabinet share the same baked parts.
  const key = `${rackD.toFixed(3)}|${rackH.toFixed(3)}|${seedStr}`;
  let parts = RACK_EQUIP_CACHE.get(key);
  if (!parts) {
    parts = bakeRackEquipmentParts(rackD, rackH, seedStr);
    if (RACK_EQUIP_CACHE.size >= RACK_EQUIP_CACHE_MAX) {
      const oldest = RACK_EQUIP_CACHE.keys().next().value;
      RACK_EQUIP_CACHE.get(oldest)?.forEach((prt) => prt.geometry.dispose());
      RACK_EQUIP_CACHE.delete(oldest);
    }
    RACK_EQUIP_CACHE.set(key, parts);
  }
  parts.forEach((prt) => {
    const mesh = new THREE.Mesh(prt.geometry, prt.material);
    mesh.castShadow = prt.castShadow;
    group.add(mesh);
  });
  group.scale.x = Math.min(1, (rackW - RACK_GAP * 2 - RACK_FRAME_W * 2 - 0.03) / EQUIP_W);
  return group;
}

function bakeRackEquipmentParts(rackD, rackH, seedStr) {
  const group = new THREE.Group();
  const rnd = seededRandom(seedStr);

  const usableH = rackH - 0.14;
  const units = Math.max(6, Math.floor(usableH / U_HEIGHT));
  const yBottom = -rackH / 2 + 0.07;

  const place = (mesh, uIndex, heightU) => {
    mesh.position.y = yBottom + (uIndex + heightU / 2) * U_HEIGHT;
    group.add(mesh);
  };

  let u = 0;
  place(makeUpsUnit(3, rackD), u, 3); u += 3;
  place(makeBlankUnit(1), u, 1); u += 1;

  while (u < units - 5) {
    if (rnd() < 0.24) { place(makeBlankUnit(1), u, 1); u += 1; continue; }
    const hU = rnd() < 0.35 ? 2 : 1;
    if (u + hU > units - 5) break;
    place(makeServerUnit(hU, rackD), u, hU); u += hU;
  }

  while (u < units - 3) { place(makeBlankUnit(1), u, 1); u += 1; }
  place(makeSwitchUnit(1, rackD), u, 1); u += 1;
  place(makePatchPanelUnit(1, rackD, false), u, 1); u += 1;
  place(makePatchPanelUnit(1, rackD, true), u, 1); u += 1;

  // ~150 little meshes in, ~6 merged, shared-material parts out.
  return mergeGroupToParts(group);
}

// ── Front door: perforated vent grid + accent handle, so a rack reads as
// "front" at a glance even in the plain default view (no photos loaded). ──
function drawRackFrontDoorCanvas(w, h, accentColorHex) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = Math.max(64, Math.round(128 * (h / w)));
  const cx = c.getContext("2d");
  const accentHex = "#" + accentColorHex.toString(16).padStart(6, "0");

  cx.fillStyle = "#12161f";
  cx.fillRect(0, 0, c.width, c.height);

  cx.fillStyle = "#060810";
  const cols = 8, rows = Math.max(10, Math.round(c.height / 14));
  const padX = c.width * 0.12, padY = c.height * 0.08;
  const usableW = c.width - padX * 2, usableH = c.height * 0.68;
  const cellW = usableW / cols, cellH = usableH / rows;
  const holeR = Math.min(cellW, cellH) * 0.28;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const px = padX + cellW * (col + 0.5);
      const py = padY + cellH * (r + 0.5);
      cx.beginPath();
      cx.arc(px, py, holeR, 0, Math.PI * 2);
      cx.fill();
    }
  }

  cx.fillStyle = "#1e2531";
  cx.fillRect(0, 0, c.width, c.height * 0.05);

  cx.fillStyle = accentHex;
  cx.fillRect(c.width * 0.03, c.height * 0.8, c.width * 0.07, c.height * 0.16);

  return c;
}

// ── Back panel: solid (no perforation) with cable bars + power sockets, so
// it never reads as the front, even without any photo loaded. ──
function drawRackBackPanelCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = Math.max(64, Math.round(128 * (h / w)));
  const cx = c.getContext("2d");

  cx.fillStyle = "#0a0d14";
  cx.fillRect(0, 0, c.width, c.height);

  cx.fillStyle = "#242c3a";
  for (let i = 0; i < 3; i++) {
    const y = c.height * (0.08 + i * 0.06);
    cx.fillRect(c.width * 0.1, y, c.width * 0.8, c.height * 0.025);
  }

  cx.strokeStyle = "#333c4d";
  cx.lineWidth = Math.max(1, c.width * 0.01);
  [[0.3, 0.44], [0.7, 0.44]].forEach(([fx, fy]) => {
    const fcx = c.width * fx, fcy = c.height * fy, r = c.width * 0.13;
    for (let k = 1; k <= 3; k++) {
      cx.beginPath();
      cx.arc(fcx, fcy, (r * k) / 3, 0, Math.PI * 2);
      cx.stroke();
    }
  });

  cx.fillStyle = "#1a1f29";
  cx.strokeStyle = "#4a5568";
  cx.lineWidth = Math.max(1, c.width * 0.012);
  [0.25, 0.75].forEach((fx) => {
    const sx = c.width * fx - c.width * 0.07, sy = c.height * 0.8;
    const sw = c.width * 0.14, sh = c.height * 0.11;
    cx.fillRect(sx, sy, sw, sh);
    cx.strokeRect(sx, sy, sw, sh);
  });

  return c;
}

// Both rack faces are drawn on a canvas and uploaded to the GPU. They only
// ever depend on the cabinet's size and accent colour, so a row of identical
// racks used to build (and upload) the same two textures over and over.
// Cached by that signature instead -- one upload for the whole row.
const RACK_TEX_CACHE = new Map();
function cachedCanvasTexture(key, draw) {
  let tex = RACK_TEX_CACHE.get(key);
  if (!tex) {
    tex = new THREE.CanvasTexture(draw());
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    RACK_TEX_CACHE.set(key, tex);
  }
  return tex;
}
const rackDoorTexture = (w, h, accent) =>
  cachedCanvasTexture(`door|${w.toFixed(3)}|${h.toFixed(3)}|${accent}`,
    () => drawRackFrontDoorCanvas(w, h, accent));
const rackBackTexture = (w, h) =>
  cachedCanvasTexture(`back|${w.toFixed(3)}|${h.toFixed(3)}`,
    () => drawRackBackPanelCanvas(w, h));

function makeRackBody(w, d, colorHex, opts = {}) {
  const outer = new THREE.Group();
  const H = opts.heightM || 2.0;
  const W = opts.realW || w;
  const D = opts.realD || d;
  const category = opts.category || "compute";
  const frameColor = RACK_VISUAL.colors[category] ?? RACK_VISUAL.colors.compute;
  const accentColor = colorHex ?? (RACK_VISUAL.accent[category] ?? RACK_VISUAL.accent.compute);

  const g = new THREE.Group();

  // Everything that makes up the plain (non-photo) rack body lives in its own
  // group so REAL VIEW can hide the whole thing in one shot instead of the
  // photos just layering on top of it.
  const defaultBody = new THREE.Group();
  defaultBody.name = "RackDefaultBody";
  defaultBody.userData.isRackDefaultBody = true;

  // ── Cabinet envelope ──────────────────────────────────────────────────
  // Racks stand on adjacent 600 mm tiles, so a 600 mm-wide cabinet touches
  // its neighbour exactly. Two coplanar faces at the same X is what made a
  // row read as one long slab (and made the GPU flicker between them).
  //
  // So the cabinet is built a hair inside its tile: RACK_GAP of clear air on
  // every side, the frame sitting on that envelope, and the panels recessed
  // behind the frame. Nothing in here is coplanar with anything, and a real
  // shadow line falls between one cabinet and the next.
  const GAP = RACK_GAP;
  const Xo = W / 2 - GAP;            // frame outer half-width
  const Zo = D / 2 - GAP;            // frame outer half-depth
  const FW = RACK_FRAME_W;
  const FH = FW / 2;
  const PANEL_INSET = 0.004;         // how far the sheet metal sits behind the frame

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry((Xo - PANEL_INSET) * 2, H - PANEL_INSET * 2, (Zo - PANEL_INSET) * 2),
    new THREE.MeshStandardMaterial({
      color: frameColor,
      metalness: RACK_VISUAL.frame.metalness,
      roughness: RACK_VISUAL.frame.roughness,
      transparent: false,
      opacity: 1,
    }),
  );
  frame.name = "RackEnvelope";
  frame.userData.isRackShell = true;
  frame.castShadow = true;
  frame.receiveShadow = true;
  defaultBody.add(frame);

  const doorTex = rackDoorTexture(W, H, accentColor);
  // The door fills the opening *inside* the frame, not the whole cabinet
  // face. That border is what tells you where one cabinet stops.
  const door = new THREE.Mesh(
    new THREE.BoxGeometry((Xo - FW) * 2, H - FW * 2, 0.01),
    new THREE.MeshStandardMaterial({ map: doorTex, metalness: 0.35, roughness: 0.55 }),
  );
  door.position.z = Zo - 0.008;
  door.name = "RackFrontDoor";
  door.userData.isRackShell = true;
  defaultBody.add(door);

  const backTex = rackBackTexture(W, H);
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry((Xo - FW) * 2, H - FW * 2, 0.01),
    new THREE.MeshStandardMaterial({ map: backTex, metalness: 0.35, roughness: 0.55 }),
  );
  backPanel.position.z = -(Zo - 0.008);
  backPanel.name = "RackBackPanel";
  backPanel.userData.isRackShell = true;
  defaultBody.add(backPanel);

  // Roof plate, recessed inside the top rails rather than capping the whole
  // footprint -- a flush cap would bridge straight onto the next cabinet.
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry((Xo - FW) * 2, 0.016, (Zo - FW) * 2),
    new THREE.MeshStandardMaterial({ color: 0x1e2d45, emissive: 0x1e2d45, emissiveIntensity: 0.2 }),
  );
  cap.position.y = H / 2 - 0.01;
  cap.userData.isRackShell = true;
  defaultBody.add(cap);

  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.28, 0.012, 0.004),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x22c55e, emissiveIntensity: 0.55 }),
  );
  ledStrip.position.set(0, -H / 2 + FW + 0.05, Zo - 0.001);
  ledStrip.name = "HealthLed";
  defaultBody.add(ledStrip);

  // ── Cabinet frame ──
  // The old posts were 0x243450 -- barely a shade off the body colour -- and
  // inset 20 mm, so they sat inside the shell where nothing could see them.
  // A frame has to be a different metal from its panels and it has to be on
  // the corner, or a row of racks fuses into one dark mass.
  const postMat = new THREE.MeshStandardMaterial({
    color: RACK_FRAME_COLOR, metalness: 0.72, roughness: 0.34,
  });
  // Posts, rails and stiles are 14 boxes in one metal. They are collected
  // here and welded into a single mesh below: identical silhouette, one
  // draw call per cabinet instead of fourteen (x2 with the shadow pass).
  const frameGeos = [];
  const weld = (geo, x, y, z) => {
    geo.translate(x, y, z);
    frameGeos.push(geo);
  };

  [
    [-(Xo - FH), -(Zo - FH)],
    [Xo - FH, -(Zo - FH)],
    [-(Xo - FH), Zo - FH],
    [Xo - FH, Zo - FH],
  ].forEach(([cx, cz]) => {
    weld(new THREE.BoxGeometry(FW, H, FW), cx, 0, cz);
  });

  // Top and base rails closing the frame on all four sides. Looking down a
  // row, these are what outline each cabinet's own footprint.
  [H / 2 - FH, -(H / 2 - FH)].forEach((ry) => {
    [-1, 1].forEach((sz) => {
      weld(new THREE.BoxGeometry(Xo * 2, FW, FW), 0, ry, sz * (Zo - FH));
    });
    [-1, 1].forEach((sx) => {
      weld(new THREE.BoxGeometry(FW, FW, Zo * 2), sx * (Xo - FH), ry, 0);
    });
  });

  // Mid-height stile down each side face, so the frame still reads as a
  // separate cabinet edge when you look at a row side-on.
  [-1, 1].forEach((sx) => {
    weld(new THREE.BoxGeometry(FW * 0.8, H - FW * 2, FW * 0.8), sx * (Xo - FH), 0, 0);
  });

  const weldedFrameGeo = BufferGeometryUtils.mergeBufferGeometries(frameGeos, false);
  if (weldedFrameGeo) {
    frameGeos.forEach((gg) => gg.dispose());
    const frameWork = new THREE.Mesh(weldedFrameGeo, postMat);
    frameWork.name = "RackFrameWork";
    frameWork.userData.isRackShell = true;
    frameWork.castShadow = true;
    defaultBody.add(frameWork);
  } else {
    // Merge refused for some reason -- fall back to the loose boxes so the
    // cabinet still has a frame.
    frameGeos.forEach((gg) => {
      const piece = new THREE.Mesh(gg, postMat);
      piece.userData.isRackShell = true;
      piece.castShadow = true;
      defaultBody.add(piece);
    });
  }

  // Procedural filler (random blank/server/UPS blocks) so an unassigned
  // rack doesn't look empty by default -- hidden while RACK VIEW has this
  // rack open, where its real contents are drawn instead.
  const equipGroup = buildRackEquipment(W, D, H, opts.seed || "rack");
  equipGroup.userData.isRackProceduralFiller = true;
  defaultBody.add(equipGroup);
  g.add(defaultBody);
  g.userData.defaultBody = defaultBody;

  // ── Real device-image faces (front/back), populated later once the
  // rack's deviceId is known — see renderDevicesIntoScene(). Sized by
  // actual U-count so it works for any rack height (6U, 42U, 48U...).
  const totalUnitsU = computeTotalUnits(H);
  const { bodies: realBodies } = createRackRealFaceContainers({
    width: W, depth: D, totalUnitsU,
  });
  g.add(realBodies);

  // U-number rail strips (left/right edges, front & back) -- same toggle,
  // drawn straight onto the rack in the room, no separate panel/modal.
  const realRail = createRackURailPlanes({ width: W, depth: D, totalUnitsU, totalHeightM: H });
  g.add(realRail);

  g.userData.isRackBody = true;
  g.userData.realBodies = realBodies;
  g.userData.realRail = realRail;
  g.userData.rackDims = { W, D, H, totalUnitsU };

  g.position.y = H / 2;
  outer.add(g);
  outer.userData.rackInnerGroup = g;
  return { group: outer, heightM: H };
}

// ── RACK VIEW: open one cabinet up, or close it back to normal ──────────
// Open = doors and envelope off, the procedural filler out, the real slot
// contents + rear cabling (rackView3d.js) in. Closed = exactly the cabinet
// makeRackBody built. The per-slot "real face" bodies stay hidden either
// way now: they only exist as cable endpoints (see resolveEndpointGeom).
const RACK_OPEN_HIDES = new Set(["RackEnvelope", "RackFrontDoor", "RackBackPanel", "HealthLed"]);
function setRackOpened(root, open, {
  slots, cords = [], isDark = true, excludeCordId = null, cordsVersion = 0, describeEnd = null,
} = {}) {
  const inner = root?.userData?.rackInnerGroup;
  const rf = root?.userData?.rackRealFace;
  if (!inner || !rf) return null;
  rf.defaultBody?.children.forEach((c) => {
    if (c.userData?.isRackProceduralFiller || RACK_OPEN_HIDES.has(c.name)) c.visible = !open;
  });
  setRackRealFaceVisible(rf.bodies, false);
  setRackRealFaceVisible(rf.rail, open);

  // Rebuilt whenever what it shows changes -- the slot list (an elevation
  // edit hands over a new array), the cords (cordsVersion), the cable being
  // carried -- and torn down the moment the rack closes.
  let dressing = inner.userData.rackViewDressing || null;
  if (dressing && (!open || dressing.userData.slotsRef !== slots || dressing.userData.isDark !== isDark
    || dressing.userData.cordsVersion !== cordsVersion || dressing.userData.excludeCordId !== excludeCordId)) {
    disposeRackViewDressing(dressing);
    dressing = null;
    inner.userData.rackViewDressing = null;
    root.userData.rackViewSummary = null;
  }
  if (open && !dressing && slots) {
    const { group, summary } = buildRackViewDressing({
      dims: rf.dims, slots, cords, isDark, rackId: root.userData.deviceId, excludeCordId, describeEnd,
    });
    group.userData.slotsRef = slots;
    group.userData.isDark = isDark;
    group.userData.cordsVersion = cordsVersion;
    group.userData.excludeCordId = excludeCordId;
    // Clicking anything in it is clicking the rack (select, double-click
    // for the elevation editor) -- same as the rest of the cabinet.
    group.traverse((o) => {
      o.userData.deviceId = root.userData.deviceId;
      if (o !== group) o.userData.movableRoot = root;
    });
    inner.add(group);
    inner.userData.rackViewDressing = group;
    root.userData.rackViewSummary = summary;
  }
  return root.userData.rackViewSummary || null;
}

// ── RACK VIEW cabling kept in step with what is in the rack ─────────────
// The first time a rack is opened it is dressed the way an installer would
// do it (planRackCords). After that the cords are the user's: a device added
// in the elevation editor gets cabled to free ports, one removed takes its
// cords with it, and nothing else is ever re-planned.
const cordPortSlot = (portId) => String(portId || "").split("|")[0];
function syncRackCabling(rackId, dims, slots) {
  const current = new Set((slots || []).map((s) => s.id));
  const known = patchCordStore.knownSlots(rackId);
  const removedCords = [];
  if (known) {
    const gone = new Set([...known].filter((id) => !current.has(id)));
    if (gone.size) {
      patchCordStore.forRack(rackId).forEach((c) => {
        if ([c.a, c.b].some((e) => e?.rackId === rackId && gone.has(cordPortSlot(e.portId)))) {
          patchCordStore.remove(c.id);
          removedCords.push(c);
        }
      });
    }
  }
  const added = known ? [...current].filter((id) => !known.has(id)) : null;
  let addedCords = [];
  if (!known || added.length) {
    addedCords = planRackCords({
      dims, slots, rackId,
      existing: patchCordStore.forRack(rackId),
      onlySlotIds: known ? new Set(added) : null,
      newId: () => patchCordStore.newId(rackId),
    });
    addedCords.forEach((c) => patchCordStore.save(c));
  }
  patchCordStore.setKnownSlots(rackId, current);
  return { removedCords, changed: removedCords.length > 0 || addedCords.length > 0 };
}

// Puts an object (and its subtree) on the RACK VIEW render layer. Storage
// bands, the selection ring and the floating nameplate are skipped: this
// close up they would only sit in front of the very equipment the view is
// for (the RACK VIEW panel names the rack instead).
function tagRackViewLayer(obj) {
  if (!obj || obj.userData?.isRackStorageOverlay || obj.userData?.isLabel || obj.name === "SelectionRing") return;
  obj.layers.enable(RACK_VIEW_LAYER);
  const ch = obj.children;
  for (let i = 0; i < ch.length; i++) tagRackViewLayer(ch[i]);
}

// three r128 raycasts hidden meshes too. Anything that should only be
// clickable while it is on screen checks this.
function isShownInScene(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

// RACK VIEW camera angles, relative to the rack's own facing -- so the same
// "REAR" works for a row that faces the other way. dTheta 0 = straight at
// the front door, PI = straight at the back.
const RACK_VIEW_CAMS = {
  front: { dTheta: 0.14, phi: 1.44, radius: 3.15 },
  rear: { dTheta: Math.PI - 0.14, phi: 1.44, radius: 3.15 },
  rear34: { dTheta: Math.PI + 0.44, phi: 1.34, radius: 3.35 },
};

// The app opens this whole view in a full-screen portal at zIndex 99990
// (Sidebar.jsx / AddDataCenter.jsx), so a RACK VIEW dropdown or tooltip,
// which antd portals to <body>, has to sit above that or it opens unseen
// underneath the 3D view.
const RV_POPUP_Z = 100050;

function makeExitSignBody(w, d, colorHex) {
  const group = new THREE.Group();
  const poleHeight = 1.6;
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, poleHeight, 10), poleMat);
  pole.position.y = poleHeight / 2;
  group.add(pole);

  const signW = Math.max(w * 0.9, 0.5);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(signW, 0.32, 0.04), signMat);
  sign.position.set(0, poleHeight, 0);
  group.add(sign);

  const c = document.createElement("canvas");
  c.width = 256; c.height = 96;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(60, 28, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(52, 38, 16, 26);
  ctx.save();
  ctx.translate(60, 64); ctx.rotate(-0.5); ctx.fillRect(-4, 0, 8, 22); ctx.restore();
  ctx.save();
  ctx.translate(60, 64); ctx.rotate(0.6); ctx.fillRect(-4, 0, 8, 22); ctx.restore();
  ctx.save();
  ctx.translate(52, 44); ctx.rotate(0.8); ctx.fillRect(-4, 0, 7, 20); ctx.restore();
  ctx.font = `700 32px ${UI_FONT}`;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("EXIT", 100, 48);
  ctx.beginPath();
  ctx.moveTo(210, 30); ctx.lineTo(240, 48); ctx.lineTo(210, 66); ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(signW * 0.96, 0.28), faceMat);
  face.position.set(0, poleHeight, 0.021);
  group.add(face);

  return { group, heightM: poleHeight + 0.2 };
}

function makeGenericBody(w, d, colorHex) {
  const group = new THREE.Group();
  const height = DEVICE_HEIGHT_M;
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex, metalness: 0.5, roughness: 0.4, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  });
  const geo = new THREE.BoxGeometry(w, height, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  group.add(mesh);
  const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
  edges.position.copy(mesh.position);
  group.add(edges);

  const postMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.9, roughness: 0.15 });
  const postW = Math.min(0.03, w * 0.05);
  const postD = Math.min(0.03, d * 0.05);
  [
    [-w / 2 + postW / 2, -d / 2 + postD / 2],
    [w / 2 - postW / 2, -d / 2 + postD / 2],
    [-w / 2 + postW / 2, d / 2 - postD / 2],
    [w / 2 - postW / 2, d / 2 - postD / 2],
  ].forEach(([cx, cz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, height, postD), postMat);
    post.position.set(cx, height / 2, cz);
    group.add(post);
  });
  return { group, heightM: height };
}

// A device is a rack when selectShapeBuilder would give it makeRackBody --
// keep the two in step by asking the same question in one place.
function isRackDevice(name, category, shape) {
  return selectShapeBuilder(name, category, shape) === makeRackBody;
}

// Toolbox tiles carry an explicit `shape` key, so the tile the user dragged
// decides its own 3D body instead of us re-parsing its label. Anything placed
// before this key existed (or coming from a saved layout / the API) still
// resolves correctly through the name matching below it.
const DEVICE_SHAPE_BUILDERS = {
  // power chain
  transformer: makeTransformerBody,
  generator:   makeGeneratorBody,
  mpp:         makeMainPowerPanelBody,
  pp:          makePowerPanelBody,
  ups:         makeUPSBody,
  pdu:         makePDUBody,
  rack:        makeRackBody,
  // compute & storage — both are rack bodies, tinted by their category
  bladeserver: makeRackBody,
  storage:     makeRackBody,
  isprack:     makeRackBody,
  // cooling & environment
  crac:        makeCracBody,
  chiller:     makeChillerBody,
  humidifier:  makeHumidifierBody,
  // network
  switch:      makeSwitchBody,
  router:      makeRouterBody,
  firewall:    makeFirewallBody,
  // network — Tier III deployment chain
  wan:           makeWanBody,
  isplink:       makeIspUplinkBody,
  corerouter:    makeCoreRouterBody,
  distswitch:    makeDistSwitchBody,
  torswitch:     makeTorSwitchBody,
  loadbalancer:  makeLoadBalancerBody,
  idsips:        makeIdsIpsBody,
  patchpanel:    makePatchPanelBody,
  odf:           makeOdfBody,
  consoleserver: makeConsoleServerBody,
  netrack:       makeRackBody,
  // security & access
  camera:      makeCameraBody,
  cardreader:  makeCardReaderBody,
  biometric:   makeBiometricBody,
  pushbutton:  makePushButtonBody,
  // safety
  fm200:       makeFireSystemBody,
  fm200cyl:    makeFireCylinderBody,
  exitsign:    makeExitSignBody,
  // power accessories
  battery:     makeBatteryBankBody,
  ipdu:        makeIPDUBody,
  busway:      makeBuswayBody,
  tapoff:      makeTapOffBody,
  breaker:     makeBreakerBody,
  wldpanel:    makeWLDPanelBody,
  // infrastructure
  door:        makeDoorBody,
  stairs:      makeStairsRampBody,
};

function selectShapeBuilder(name, category, shape) {
  if (shape && DEVICE_SHAPE_BUILDERS[shape]) return DEVICE_SHAPE_BUILDERS[shape];

  const n = (name || "").toLowerCase();

  // ── safety & access, matched before anything broader ──
  if (n.includes("emergency exit")) return makeExitSignBody;
  if (n.includes("fm200") || n.includes("suppression")) {
    return n.includes("cylinder") ? makeFireCylinderBody : makeFireSystemBody;
  }
  if (n.includes("push button")) return makePushButtonBody;
  if (n.includes("biometric") || n.includes("fingerprint")) return makeBiometricBody;
  if (n.includes("access card") || n.includes("card reader")) return makeCardReaderBody;
  if (n.includes("camera") || n.includes("cctv")) return makeCameraBody;

  // ── infrastructure ──
  if (n.includes("stair") || n.includes("ramp")) return makeStairsRampBody;
  if (n === "door" || (category === "Infrastructure" && n.includes("door"))) return makeDoorBody;

  // ── power distribution, most-specific first ──
  // "UPS/WLD Panel" and "PAC Panel" are panels, not UPS modules or air
  // handlers, so they are peeled off before the generic ups/cooling tests.
  if (n.includes("wld")) return makeWLDPanelBody;
  if (n.includes("pac panel")) return makePowerPanelBody;
  if (n.includes("transformer")) return makeTransformerBody;
  if (n.includes("generator") || n.includes("genset") || n.includes("dg set")) return makeGeneratorBody;
  if (n.includes("main power panel") || n.startsWith("mpp")) return makeMainPowerPanelBody;
  if (n.includes("power panel") || n.startsWith("pp ") || n === "pp" || n.includes("distribution panel")) return makePowerPanelBody;
  if (n.includes("tap-off") || n.includes("tap off")) return makeTapOffBody;
  if (n.includes("busway") || n.includes("busbar") || n.includes("power source")) return makeBuswayBody;
  if (n.includes("breaker") || n.startsWith("br ")) return makeBreakerBody;
  if (n.includes("battery")) return makeBatteryBankBody;
  if (n.includes("ipdu")) return makeIPDUBody;   // a zero-U rack strip, not a cabinet
  if (n.includes("ups")) return makeUPSBody;
  if (n.includes("pdu")) return makePDUBody;

  // ── cooling & environment ──
  if (n.includes("chiller")) return makeChillerBody;
  if (n.includes("humidifier")) return makeHumidifierBody;
  if (category === "Cooling") return makeCracBody;

  // ── network ──
  // Most specific first: a "Core Router" is not a generic router and an
  // "Access Switch (ToR)" is not a generic switch.
  if (n.includes("internet") || n === "wan" || n.includes("/ wan")) return makeWanBody;
  if (n.includes("isp uplink")) return makeIspUplinkBody;
  if (n.includes("odf") || n.includes("optical distribution")) return makeOdfBody;
  if (n.includes("patch panel")) return makePatchPanelBody;
  if (n.includes("core router")) return makeCoreRouterBody;
  if (n.includes("ids") || n.includes("ips ") || n.includes("intrusion")) return makeIdsIpsBody;
  if (n.includes("load balancer") || n.includes("balancer")) return makeLoadBalancerBody;
  if (n.includes("distribution switch") || n.includes("dist. switch") || n.includes("aggregation")) return makeDistSwitchBody;
  if (n.includes("access switch") || n.includes("top-of-rack") || n.includes("tor")) return makeTorSwitchBody;
  if (n.includes("console") || n.includes("out-of-band") || n.includes("oob")) return makeConsoleServerBody;
  if (n.includes("firewall")) return makeFirewallBody;
  if (n.includes("router")) return makeRouterBody;
  if (n.includes("switch")) return makeSwitchBody;
  if (n.includes("rack")) return makeRackBody;

  if (category === "Power") return makePowerPanelBody;
  if (category === "Network") return makeSwitchBody;
  if (category === "Compute" || category === "Storage") return makeRackBody;
  return makeGenericBody;
}

// ═══════════════════════════════════════════════════════════════════════════
// CABLE PRIMITIVES — built once for the whole building
// ---------------------------------------------------------------------------
// A floor of this size carries a few hundred cables and every cable is a
// handful of straight runs, a bead at each corner and a node at each end.
// Built literally, that is thousands of one-off geometries allocated on every
// wiring pass — and the wiring is rebuilt whenever anything on the floor
// moves.
//
// None of those shapes actually differ: a run is a cylinder and a corner is a
// sphere, and the only thing that changes is how long and how fat. So there
// is exactly ONE of each here, all of unit size, and each cable part is
// scaled into place instead of being modelled. They are tagged with the same
// `isSharedRackGeo` flag the baked rack interiors use, which is what stops
// disposeGroup() from freeing them out from under the next rebuild.
// ═══════════════════════════════════════════════════════════════════════════
const sharedGeo = (geo) => { geo.userData.isSharedRackGeo = true; return geo; };
// Open-ended so the run has no end caps to draw — the beads and nodes cover
// every join anyway.
const WIRE_RUN_GEO  = sharedGeo(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true));
const WIRE_BEAD_GEO = sharedGeo(new THREE.SphereGeometry(1, 8, 6));
const WIRE_NODE_GEO = sharedGeo(new THREE.SphereGeometry(1, 10, 10));

// Cable nameplates say what the cable CARRIES ("POWER", "FIBER", …), not
// which cable it is — there are half a dozen distinct plates on a floor of
// three hundred cables. Drawing each one again per cable was three hundred
// canvas rasterisations and three hundred texture uploads for six pictures.
const WIRE_LABEL_TEX = new Map();
function wireLabelTexture(text, colorNum, LP, themeKey) {
  const key = `${text}|${colorNum}|${themeKey}`;
  const hit = WIRE_LABEL_TEX.get(key);
  if (hit) return hit;

  const lc = document.createElement("canvas");
  lc.width = 220; lc.height = 60;
  const ctx = lc.getContext("2d");
  const hex = "#" + colorNum.toString(16).padStart(6, "0");
  ctx.fillStyle = LP.panel;
  ctx.beginPath(); ctx.roundRect(0, 0, 220, 60, 8); ctx.fill();
  ctx.strokeStyle = hex; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(1, 1, 218, 58, 7); ctx.stroke();
  ctx.font = `600 17px ${UI_FONT}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = hex;
  ctx.fillText(text, 110, 31);

  const tex = new THREE.CanvasTexture(lc);
  tex.minFilter = THREE.LinearFilter;
  // Shared across every cable of this type, so it must survive a rebuild.
  // Flagged on the texture itself, not on userData: three r128's Texture has
  // no userData object (BufferGeometry does, Texture does not), so writing
  // through it throws.
  tex.isSharedTexture = true;
  WIRE_LABEL_TEX.set(key, tex);
  return tex;
}

// Device nameplates repeat far more than they look like they do: every
// cabinet in a row differs only by its tag, and whole classes of plant kit
// (six PAC units, twelve row PDUs, four battery banks) draw an identical
// plate. Keyed on exactly what gets painted, so two plates share a texture
// if and only if they are the same picture.
const DEVICE_LABEL_TEX = new Map();
function deviceLabelTexture(strap, title, sub, colorNum, LP, themeKey) {
  const key = `${strap}|${title}|${sub}|${colorNum}|${themeKey}`;
  const hit = DEVICE_LABEL_TEX.get(key);
  if (hit) return hit;

  const c = document.createElement("canvas");
  c.width = 320; c.height = 104;
  const cx = c.getContext("2d");
  const hex = "#" + colorNum.toString(16).padStart(6, "0");
  cx.fillStyle = LP.panel;
  cx.beginPath(); cx.roundRect(0, 0, 320, 104, 10); cx.fill();
  cx.strokeStyle = LP.border; cx.lineWidth = 2;
  cx.beginPath(); cx.roundRect(1, 1, 318, 102, 9); cx.stroke();
  cx.fillStyle = hex;
  cx.fillRect(0, 0, 4, 104);
  cx.font = `600 11px ${UI_FONT}`;
  cx.textAlign = "left"; cx.textBaseline = "middle";
  cx.fillStyle = hex;
  cx.fillText(strap, 18, 22);
  cx.font = `700 22px ${UI_FONT}`;
  cx.fillStyle = LP.title;
  cx.fillText(title, 16, 52);
  cx.font = `500 15px ${MONO_FONT}`;
  cx.fillStyle = LP.sub;
  cx.fillText(sub, 16, 82);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  // Shared between devices, so a device being disposed must not free it.
  // See wireLabelTexture() for why this is not on userData.
  tex.isSharedTexture = true;
  DEVICE_LABEL_TEX.set(key, tex);
  return tex;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC DEVICE PLACEMENT
// ═══════════════════════════════════════════════════════════════════════════
function createDeviceMesh(payload, tilesX, tilesZ, dimsMm, isDark = true) {
  const LP = labelPalette(isDark);
  const group = new THREE.Group();
  group.name = `Device_${payload.name}`;
  const w = tilesX * TILE_SIZE_M;
  const d = tilesZ * TILE_SIZE_M;
  const colorHex = hexToColorNum(payload.color || "#38bdf8");

  const slabMat = new THREE.MeshStandardMaterial({
    color: colorHex, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false,
  });
  const slabGeo = new THREE.BoxGeometry(w, 0.05, d);
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = 0.025;
  group.add(slab);
  const slabEdges = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo), new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.6 }));
  slabEdges.position.copy(slab.position);
  group.add(slabEdges);

  const RACK_CATEGORY = { Compute: "compute", Storage: "storage", Network: "network" };
  const builder = selectShapeBuilder(payload.name, payload.category, payload.shape);
  const { group: bodyGroup, heightM } = builder(w, d, colorHex, {
    category: RACK_CATEGORY[payload.category] || "compute",
    heightM: dimsMm.height ? dimsMm.height / 1000 : 2.0,
    seed: payload.seed || payload.name,
    realW: Math.min(w, (dimsMm.length || 600) / 1000),
    realD: Math.min(d, (dimsMm.width || 600) / 1000),
  });
  group.add(bodyGroup);

  // Carry a switchable device's lever up onto the root, so the click handler
  // and the frame loop can find it without walking the whole subtree.
  if (bodyGroup.userData.switchable) {
    group.userData.switchable = bodyGroup.userData.switchable;
    group.userData.switchLever = bodyGroup.getObjectByName(bodyGroup.userData.leverName);
  }

  const rackInner = bodyGroup.userData.rackInnerGroup;
  if (rackInner?.userData.isRackBody) {
    group.userData.isRackBody = true;
    // Carried up to the device root so the Storage view can hang its
    // occupancy bands on the cabinet without re-walking the subtree.
    group.userData.rackInnerGroup = rackInner;
    group.userData.rackRealFace = {
      bodies: rackInner.userData.realBodies,
      rail: rackInner.userData.realRail,
      dims: rackInner.userData.rackDims,
      defaultBody: rackInner.userData.defaultBody,
    };
  }

  // Top strapline carries the type, because the headline below is now the
  // device's own tag — "RACK-07" is what you look for on a floor, "Rack" is
  // what it is.
  const strap = payload.alias
    ? `${(payload.category || "DEVICE").toUpperCase()} · ${payload.name.toUpperCase()}`
    : (payload.category || "DEVICE").toUpperCase();
  const title = (payload.alias || payload.name).substring(0, 24);
  const sub = `${dimsMm.length} × ${dimsMm.width} mm · ${tilesX}×${tilesZ} tiles`;
  const tex = deviceLabelTexture(strap.substring(0, 38), title, sub, colorHex, LP, isDark ? "d" : "l");
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  label.scale.set(1.45, 1.45 * (104 / 320), 1);
  label.position.set(0, heightM + 0.38, 0);
  label.renderOrder = 4;
  label.userData.isLabel = true;
  group.add(label);

  group.userData.isPlacedDevice = true;
  group.userData.deviceName = payload.name;
  group.userData.deviceAlias = payload.alias || null;
  group.userData.footprint = { w, d };
  group.userData.tilesX = tilesX;
  group.userData.tilesZ = tilesZ;
  group.userData.dimsMm = dimsMm;
  group.userData.heightM = heightM;

  group.traverse((o) => { if (o !== group) o.userData.movableRoot = group; });
  return group;
}

// ── Simulate mode: the healthy-state ring ───────────────────────────────
// In Simulate mode every device wears a ground ring in its chain's colour --
// network blue, power yellow, cooling cyan -- so "this is fine" is a colour
// you can read across the whole floor, and red genuinely means something.
// Deliberately flat and unanimated: only failures are allowed to move, or
// the eye stops noticing them.
function createChainRing(footprint, colorNum) {
  const g = new THREE.Group();
  g.name = "ChainRing";
  const span = Math.max(footprint.w || 0.6, footprint.d || 0.6);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(span * 0.6, span * 0.72, 40),
    new THREE.MeshBasicMaterial({
      color: colorNum, side: THREE.DoubleSide,
      transparent: true, opacity: 0.42, depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  ring.renderOrder = 2;
  g.add(ring);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(span * 0.6, 36),
    new THREE.MeshBasicMaterial({
      color: colorNum, transparent: true, opacity: 0.09, depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.008;
  glow.renderOrder = 1;
  g.add(glow);

  return g;
}

// ── NEW: failure / degradation halo around a device ─────────────────────
function createStatusHalo(footprint, heightM, colorNum) {
  const g = new THREE.Group();
  g.name = "StatusHalo";
  const span = Math.max(footprint.w || 0.6, footprint.d || 0.6);

  const ringMat = new THREE.MeshBasicMaterial({
    color: colorNum, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(span * 0.58, span * 0.78, 44), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.11;
  ring.renderOrder = 8;
  ring.userData.pulse = true;
  ring.userData.baseOpacity = 0.75;
  g.add(ring);

  const shellMat = new THREE.MeshBasicMaterial({
    color: colorNum, transparent: true, opacity: 0.13, depthWrite: false,
  });
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry((footprint.w || 0.6) + 0.07, heightM || DEVICE_HEIGHT_M, (footprint.d || 0.6) + 0.07),
    shellMat,
  );
  shell.position.y = (heightM || DEVICE_HEIGHT_M) / 2;
  shell.renderOrder = 8;
  shell.userData.pulse = true;
  shell.userData.baseOpacity = 0.13;
  g.add(shell);

  const beamMat = new THREE.MeshBasicMaterial({
    color: colorNum, transparent: true, opacity: 0.2, depthWrite: false,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.11, 2.8, 8, 1, true), beamMat);
  beam.position.y = (heightM || DEVICE_HEIGHT_M) + 1.5;
  beam.renderOrder = 8;
  beam.userData.pulse = true;
  beam.userData.baseOpacity = 0.2;
  g.add(beam);

  return g;
}

// ── Shared ground-plane raycast helper ──────────────────────────────────
function groundPointFromClient(clientX, clientY, canvas, camera, planeY = FLOOR_Y) {
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  // The plane has to sit at the height of the surface the user is actually
  // looking at — the TOP of the raised floor, not y = 0.
  //
  // Tiles are drawn at FLOOR_Y (0.3 m). Casting against y = 0 meant the ray
  // carried on 0.3 m PAST the visible floor before it was measured, and at an
  // angled camera that overshoot turns into a horizontal error of
  // FLOOR_Y / tan(elevation): about half a tile at 45°, nearly a full tile at
  // 30°, almost none looking straight down. That is exactly the "sometimes
  // right, sometimes one tile out" drop behaviour — the device always landed
  // FURTHER FROM the camera than the cursor.
  //
  // A THREE.Plane is normal·p + constant = 0, so the plane y = planeY has
  // constant = -planeY.
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
  const pt = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(plane, pt);
  return hit ? pt : null;
}

function buildBuildingTileBounds(dcGroup) {
  const originX = dcGroup?.userData.gridOriginX ?? 0;
  const originZ = dcGroup?.userData.gridOriginZ ?? 0;
  const oW = -2 * originX;
  const oL = -2 * originZ;
  return {
    minTx: 0,
    minTz: 0,
    maxTx: Math.max(0, Math.round(oW / TILE_SIZE_M) - 1),
    maxTz: Math.max(0, Math.round(oL / TILE_SIZE_M) - 1),
  };
}

const GATE_CLEARANCE_M = 2;
function computeGateTileKeys(dcGroup, doorDirection, doorPosition, oW, oL) {
  const originX = dcGroup?.userData.gridOriginX ?? 0;
  const originZ = dcGroup?.userData.gridOriginZ ?? 0;
  const doorW = doorWidthFor(oW, oL);
  const { x: doorX, z: doorZ } = getDoorTransform(doorDirection, doorPosition, oW, oL, doorW);

  let minX, maxX, minZ, maxZ;
  switch (doorDirection) {
    case "North": minX = doorX - doorW / 2; maxX = doorX + doorW / 2; minZ = doorZ; maxZ = doorZ + GATE_CLEARANCE_M; break;
    case "East":  minX = doorX - GATE_CLEARANCE_M; maxX = doorX; minZ = doorZ - doorW / 2; maxZ = doorZ + doorW / 2; break;
    case "West":  minX = doorX; maxX = doorX + GATE_CLEARANCE_M; minZ = doorZ - doorW / 2; maxZ = doorZ + doorW / 2; break;
    case "South":
    default:      minX = doorX - doorW / 2; maxX = doorX + doorW / 2; minZ = doorZ - GATE_CLEARANCE_M; maxZ = doorZ; break;
  }

  const a = worldToTile(minX, minZ, originX, originZ);
  const b = worldToTile(maxX, maxZ, originX, originZ);
  const keys = [];
  for (let tx = Math.min(a.tx, b.tx); tx <= Math.max(a.tx, b.tx); tx++) {
    for (let tz = Math.min(a.tz, b.tz); tz <= Math.max(a.tz, b.tz); tz++) {
      keys.push(`${tx},${tz}`);
    }
  }
  return keys;
}

// ── Ghost preview mesh ──────────────────────────────────────────────────
function createGhostMesh(tilesX, tilesZ) {
  const w = tilesX * TILE_SIZE_M;
  const d = tilesZ * TILE_SIZE_M;
  const group = new THREE.Group();
  group.name = "PlacementGhost";

  const mainMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.3, depthWrite: false });
  const mainGeo = new THREE.BoxGeometry(w, 0.08, d);
  const mainMesh = new THREE.Mesh(mainGeo, mainMat);
  mainMesh.position.y = 0.05;
  group.add(mainMesh);

  const edgeMat = new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.95 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mainGeo), edgeMat);
  edges.position.copy(mainMesh.position);
  group.add(edges);

  const tileMats = [];
  for (let i = 0; i < tilesX; i++) {
    for (let j = 0; j < tilesZ; j++) {
      const tileMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
      const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE_M * 0.9, TILE_SIZE_M * 0.9), tileMat);
      tileMesh.rotation.x = -Math.PI / 2;
      tileMesh.position.set(-w / 2 + TILE_SIZE_M * (i + 0.5), 0.09, -d / 2 + TILE_SIZE_M * (j + 0.5));
      group.add(tileMesh);
      tileMats.push(tileMat);
    }
  }

  group.userData.mainMat = mainMat;
  group.userData.edgeMat = edgeMat;
  group.userData.tileMats = tileMats;
  group.renderOrder = 5;
  return group;
}

function setGhostValidity(ghost, valid) {
  if (!ghost?.userData?.mainMat) return;
  const color = valid ? 0x22c55e : 0xef4444;
  ghost.userData.mainMat.color.setHex(color);
  ghost.userData.mainMat.opacity = valid ? 0.3 : 0.38;
  ghost.userData.edgeMat.color.setHex(color);
  ghost.userData.tileMats.forEach((m) => m.color.setHex(color));
}

function disposeGroup(group) {
  if (!group) return;
  group.parent?.remove(group);
  group.traverse((o) => {
    // Rack interiors are baked once and shared by every cabinet in the
    // building (RACK_EQUIP_CACHE / RACK_MAT_CACHE). Placing one device
    // re-runs the whole device list through here, so freeing those would
    // blank out every other rack on the floor.
    if (o.geometry && !o.geometry.userData?.isSharedRackGeo) o.geometry.dispose();
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (!m?.userData?.isSharedRackMat) m?.dispose();
      });
    }
  });
}

// ── Circuit trace ────────────────────────────────────────────────────────
// How far X-RAY follows the wiring out from the device you clicked.
// 1 = only what is DIRECTLY cabled to it, which is the question being asked
// ("what serves this rack?"). The walk below is a plain flood fill, so
// without a limit it returns the whole connected component -- on a properly
// cabled floor that is every device in the building, and nothing is left to
// ghost. Raise this to follow a chain further out.
const XRAY_TRACE_DEPTH = 1;

function traceCircuit(connections, startId, maxDepth = Infinity) {
  if (!startId) return null;
  const adj = new Map();
  const link = (a, b, conn) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push({ other: b, conn });
  };
  connections.forEach((c) => { link(c.fromId, c.toId, c); link(c.toId, c.fromId, c); });

  const deviceIds = new Set([startId, parentDeviceId(startId)]);
  const wireIds = new Set();
  const hops = [];
  const seenWire = new Set();
  const queue = [{ id: startId, depth: 0 }];

  while (queue.length) {
    const { id, depth } = queue.shift();
    if (depth >= maxDepth) continue;      // far enough out; stop expanding here
    (adj.get(id) || []).forEach(({ other, conn }) => {
      if (seenWire.has(conn.id)) return;
      seenWire.add(conn.id);
      wireIds.add(conn.id);
      hops.push({ id: conn.id, fromId: id, toId: other, type: conn.type, depth: depth + 1 });
      if (!deviceIds.has(other)) {
        deviceIds.add(other);
        deviceIds.add(parentDeviceId(other));
        queue.push({ id: other, depth: depth + 1 });
      }
    });
  }
  return { startId, deviceIds, wireIds, hops };
}

// ── X-ray focus ──────────────────────────────────────────────────────────
// Ghosted objects keep this fraction of their own opacity, with a floor so
// they stay as a faint outline rather than vanishing -- the point is to show
// WHERE the rest of the floor is while making it obvious what is in focus.
const XRAY_DIM_FACTOR = 0.15;
const XRAY_MIN_OPACITY = 0.06;
// How much of its own glow a ghosted emissive object keeps.
const XRAY_EMISSIVE_FACTOR = 0.05;
function setObjectDimmed(obj, dimmed) {
  if (!obj.material) return;
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  mats.forEach((m) => {
    if (m.userData.xrayBaseOpacity === undefined) {
      m.userData.xrayBaseOpacity = m.opacity;
      m.userData.xrayBaseTransparent = m.transparent;
      m.userData.xrayBaseDepthWrite = m.depthWrite;
    }
    // Cables are emissive -- they light themselves. Opacity alone barely
    // touches them: a ghosted power run at 15% opacity still glows amber
    // through everything, which is why the plenum looked unchanged. The glow
    // has to come down with the opacity.
    if (m.emissive) {
      if (dimmed) {
        if (!m.userData.xrayGhosted) {
          m.userData.xrayBaseEmissive = m.emissiveIntensity;
          m.emissiveIntensity = m.emissiveIntensity * XRAY_EMISSIVE_FACTOR;
        }
      } else if (m.userData.xrayGhosted && m.userData.xrayBaseEmissive !== undefined) {
        m.emissiveIntensity = m.userData.xrayBaseEmissive;
      }
    }
    m.userData.xrayGhosted = dimmed;

    if (dimmed) {
      m.transparent = true;
      m.opacity = Math.max(XRAY_MIN_OPACITY, m.userData.xrayBaseOpacity * XRAY_DIM_FACTOR);
      // Turning depth-write OFF is what actually makes the focused run
      // readable. A ghost is still solid to the depth buffer, so a faded
      // cabinet standing in front of the cable you are tracing would carry
      // on hiding it -- see-through but still occluding, which is the
      // opposite of what an x-ray is for. With this off, whatever stays in
      // focus reads through everything ghosted in front of it.
      m.depthWrite = false;
    } else {
      m.transparent = m.userData.xrayBaseTransparent;
      m.opacity = m.userData.xrayBaseOpacity;
      m.depthWrite = m.userData.xrayBaseDepthWrite;
    }
    m.needsUpdate = true;
  });
}

// ── Room/corridor drag-to-move helpers ──────────────────────────────────
function buildBuildingMeterBounds(dcGroup) {
  const originX = dcGroup?.userData.gridOriginX ?? 0;
  const originZ = dcGroup?.userData.gridOriginZ ?? 0;
  const oW = -2 * originX;
  const oL = -2 * originZ;
  return { minX: originX, minZ: originZ, maxX: originX + oW, maxZ: originZ + oL };
}

function rectsOverlap(a, b) {
  return Math.abs(a.cx - b.cx) * 2 < (a.w + b.w - 1e-6) && Math.abs(a.cz - b.cz) * 2 < (a.l + b.l - 1e-6);
}

function checkRoomPlacement(scene, dcGroup, rect, excludeRoomId) {
  const bounds = buildBuildingMeterBounds(dcGroup);
  if (
    rect.cx - rect.w / 2 < bounds.minX || rect.cx + rect.w / 2 > bounds.maxX ||
    rect.cz - rect.l / 2 < bounds.minZ || rect.cz + rect.l / 2 > bounds.maxZ
  ) {
    return { valid: false, reason: "OUTSIDE_BUILDING" };
  }
  const roomsGroup = scene.getObjectByName("RoomsGroup");
  if (roomsGroup) {
    for (const child of roomsGroup.children) {
      if (!child.name?.startsWith("Room_")) continue;
      if (child.userData.roomId === excludeRoomId) continue;
      const c = child.userData.roomCenter, d = child.userData.roomDims;
      if (!c || !d) continue;
      if (rectsOverlap(rect, { cx: c.x, cz: c.z, w: d.w, l: d.l })) {
        return { valid: false, reason: "OVERLAPPING_ROOM" };
      }
    }
  }
  return { valid: true, reason: "OK" };
}

function createRoomGhostOutline(w, l) {
  const group = new THREE.Group();
  group.name = "RoomMoveGhost";
  const mainMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mainMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = FLOOR_Y + 0.04;
  group.add(mesh);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.95 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.06, l)), edgeMat);
  edges.position.y = FLOOR_Y + 0.06;
  group.add(edges);
  group.userData.mainMat = mainMat;
  group.userData.edgeMat = edgeMat;
  group.userData.tileMats = [];
  group.renderOrder = 6;
  return group;
}

// ── Room/corridor RESIZE helpers ────────────────────────────────────────
const MIN_ROOM_DIM_M = 0.5;

function createResizeHandleGroup(w, l) {
  const group = new THREE.Group();
  group.name = "ResizeHandles";
  const geo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
  ["N", "S", "E", "W"].forEach((edge) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.45, roughness: 0.35 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.resizeHandle = edge;
    mesh.renderOrder = 7;
    group.add(mesh);
  });
  positionResizeHandles(group, w, l);
  return group;
}

function positionResizeHandles(group, w, l) {
  const y = FLOOR_Y + 0.25;
  group.children.forEach((mesh) => {
    switch (mesh.userData.resizeHandle) {
      case "N": mesh.position.set(0, y, -l / 2); break;
      case "S": mesh.position.set(0, y, l / 2); break;
      case "E": mesh.position.set(w / 2, y, 0); break;
      case "W": mesh.position.set(-w / 2, y, 0); break;
      default: break;
    }
  });
}

function computeResizeRect(edge, center0, w0, l0, pt) {
  if (edge === "E" || edge === "W") {
    const west0 = center0.x - w0 / 2, east0 = center0.x + w0 / 2;
    let w, cx;
    if (edge === "E") { w = Math.max(MIN_ROOM_DIM_M, pt.x - west0); cx = west0 + w / 2; }
    else { w = Math.max(MIN_ROOM_DIM_M, east0 - pt.x); cx = east0 - w / 2; }
    return { center: { x: cx, z: center0.z }, w, l: l0 };
  }
  const north0 = center0.z - l0 / 2, south0 = center0.z + l0 / 2;
  let l, cz;
  if (edge === "S") { l = Math.max(MIN_ROOM_DIM_M, pt.z - north0); cz = north0 + l / 2; }
  else { l = Math.max(MIN_ROOM_DIM_M, south0 - pt.z); cz = south0 - l / 2; }
  return { center: { x: center0.x, z: cz }, w: w0, l };
}

// ═══════════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
function SectionLabel({ text, T, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: T.textMuted,
      letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 0 8px", ...style,
    }}>
      {text}
    </div>
  );
}

function Divider({ T, style }) {
  return <div style={{ borderTop: `1px solid ${T.borderSubtle}`, ...style }} />;
}

function PropertyRow({ label, value, valueColor, T, mono }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "5px 0", borderBottom: `1px solid ${T.borderSubtle}`, gap: 12,
    }}>
      <span style={{ fontSize: 12, color: T.textSecondary, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{
        fontSize: 12, color: valueColor ?? T.textPrimary, fontWeight: 500,
        fontFamily: mono ? MONO_FONT : UI_FONT,
        maxWidth: 160, textAlign: "right", overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}

function ToolButton({ icon, label, active, disabled, danger, onClick, title, T, accent }) {
  const color = danger ? T.critical : active ? (accent || T.accent) : disabled ? T.textMuted : T.textSecondary;
  return (
    <Tooltip title={title}>
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: label ? "5px 10px" : "5px 7px",
          background: active ? (accent ? `${accent}1f` : T.bgElevated) : "transparent",
          border: `1px solid ${active ? (accent || T.accent) : "transparent"}`,
          borderRadius: 5,
          color,
          fontSize: 11,
          fontWeight: active ? 600 : 500,
          letterSpacing: "0.05em",
          fontFamily: UI_FONT,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "all 0.15s ease",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = T.bgElevated; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}

function ControlCluster({ caption, children, T, style }) {
  return (
    <div style={{
      position: "absolute",
      display: "flex", alignItems: "center", gap: 4,
      background: T.bgSecondary,
      border: `1px solid ${T.borderSubtle}`,
      borderRadius: 8,
      padding: "6px 8px",
      zIndex: 45,
      boxShadow: T.shadow,
      fontFamily: UI_FONT,
      ...style,
    }}>
      {caption && (
        <span style={{
          fontSize: 10, color: T.textMuted, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          paddingRight: 8, borderRight: `1px solid ${T.borderSubtle}`, marginRight: 4,
        }}>
          {caption}
        </span>
      )}
      {children}
    </div>
  );
}

function Chip({ children, color, T, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: T.bgElevated, border: `1px solid ${color}40`,
      borderRadius: 4, padding: "4px 10px",
      fontSize: 11, color, fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.08em",
      fontFamily: UI_FONT, ...style,
    }}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const DataCenter3DView = ({ dc, onBack, rooms = [], theme: themeProp, onThemeChange }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const orbitRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animRef = useRef(null);
  const sceneRef = useRef(null);
  const rackRuntimeRef = useRef(new Map()); // deviceId -> { bodies, rail, dims }
  // Which datacenter the current scene was built for. The main scene effect
  // uses it to decide whether a rebuild should keep the existing cabling --
  // it should, unless the floor itself changed.
  const dcIdentity = dc?.id ?? null;
  const sceneDcIdRef = useRef(undefined);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(themeProp || "dark");
  const [toolboxOpen, setToolboxOpen] = useState(false);

  const [layersOpen, setLayersOpen] = useState(false);
  const [layers, setLayers] = useState({ ...DEFAULT_LAYER_STATE });

  // ── Design Tools mode: "view" | "drawRoom" | "connect" | "simulate" ─────
  const [mode, setMode] = useState("view");
  const modeRef = useRef("view");
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const [camPreset, setCamPreset] = useState("iso");

  const [deviceModal, setDeviceModal] = useState(null);
  const [deviceDimsMm, setDeviceDimsMm] = useState({ length: 600, width: 600 });

  const [roomDraft, setRoomDraft] = useState(null);

  const [pendingConnectDevice, setPendingConnectDevice] = useState(null);
  // The connect listeners are attached once, so they read the live value
  // through a ref rather than closing over a stale piece of state.
  const pendingConnectRef = useRef(null);

  // ── Polygon cable routing ──────────────────────────────────────────────
  // A click in a 3D view is a ray, not a point — it needs a plane to land on.
  // Rather than asking for a height at every vertex, the route runs at one of
  // three real cabling levels, and the level can be changed mid-route: drop to
  // PLENUM to cross under the floor, come up to CEILING to ride the tray.
  const ROUTE_LEVELS = useMemo(() => ([
    { key: "plenum",  label: "PLENUM",  y: PLENUM_Y,             hint: "under the raised floor" },
    { key: "floor",   label: "FLOOR",   y: FLOOR_Y + 0.12,       hint: "along the floor" },
    { key: "ceiling", label: "CEILING", y: FLOOR_Y + CEILING_H - 0.45, hint: "on the overhead tray" },
  ]), []);
  const [routeLevel, setRouteLevel] = useState("plenum");
  const routeLevelRef = useRef("plenum");
  useEffect(() => { routeLevelRef.current = routeLevel; }, [routeLevel]);
  useEffect(() => { pendingConnectRef.current = pendingConnectDevice; }, [pendingConnectDevice]);

  // Waypoints clicked so far for the cable being drawn.
  const [routePoints, setRoutePoints] = useState([]);
  const routePointsRef = useRef([]);
  useEffect(() => { routePointsRef.current = routePoints; }, [routePoints]);
  const [cableModal, setCableModal] = useState(null);
  const connectionsRef = useRef([]);

  const [connVersion, setConnVersion] = useState(0);
  const bumpConnections = useCallback(() => setConnVersion((v) => v + 1), []);

  const [xrayFocus, setXrayFocus] = useState(false);
  // Declared up here, not next to the circuit trace below, because
  // applyLabelVisibility() closes over both and is defined earlier in the
  // file. The two sync effects that fill them stay beside their state.
  const xrayFocusRef = useRef(false);
  const circuitRef = useRef(null);

  const [labelsVisible, setLabelsVisible] = useState(true);
  const labelsVisibleRef = useRef(true);
  useEffect(() => { labelsVisibleRef.current = labelsVisible; }, [labelsVisible]);

  const [underFloor, setUnderFloor] = useState(false);
  const underFloorRef = useRef(false);
  useEffect(() => { underFloorRef.current = underFloor; }, [underFloor]);

  // ── RACK VIEW (was TRANSPARENT): ONE rack isolated and opened up ──────
  // null = off; otherwise the id of the rack being looked at. The ref is
  // also written synchronously on open/close, because the frame loop and the
  // pick handlers read it and must not lag a render behind.
  const [rackViewId, setRackViewId] = useState(null);
  const rackViewIdRef = useRef(null);
  useEffect(() => { rackViewIdRef.current = rackViewId; }, [rackViewId]);
  const [rackViewFace, setRackViewFace] = useState("rear34");
  const rackViewFaceRef = useRef("rear34");
  const rackViewCamRef = useRef(null);         // the camera to go back to on exit
  const rackViewTaggedRootRef = useRef(null);  // the rack currently on the RACK VIEW layer
  const [rackViewInfo, setRackViewInfo] = useState(null);

  // ── RACK VIEW cabling: the cable in your hand ──────────────────────────
  // { cordId (null = a brand-new cable), role, moving: "a" | "b",
  //   fixed: End | null, isNew }. The cord itself is left untouched in the
  // store until it is plugged in somewhere, so cancelling is just letting go.
  const [cableHand, setCableHandState] = useState(null);
  const cableHandRef = useRef(null);
  const setCableHand = useCallback((h) => { cableHandRef.current = h; setCableHandState(h); }, []);
  // "+ NEW CABLE": every free port lights up, a click on one starts a cable.
  const [portPickMode, setPortPickModeState] = useState(false);
  const portPickModeRef = useRef(false);
  const setPortPickMode = useCallback((on) => { portPickModeRef.current = on; setPortPickModeState(on); }, []);
  // ...and the type of cable it will be (picked first; only ports that take
  // that type light up), plus how many free ones this rack has.
  const [newCableRole, setNewCableRoleState] = useState("dataA");
  const newCableRoleRef = useRef("dataA");
  const setNewCableRole = useCallback((r) => { newCableRoleRef.current = r; setNewCableRoleState(r); }, []);
  const [pickFreeCount, setPickFreeCount] = useState(0);
  // Bumped on every cord change so the open rack redraws its cabling.
  const cordsVersionRef = useRef(0);
  const [cordsVersion, setCordsVersion] = useState(0);
  const bumpCords = useCallback(() => {
    cordsVersionRef.current += 1;
    setCordsVersion(cordsVersionRef.current);
  }, []);
  const handPointerRef = useRef(null);         // last pointer position while carrying
  const handHoverPortRef = useRef(null);       // port id the carried end would snap into
  const handVisualRef = useRef(null);          // { mesh } -- the cable drawn in your hand
  const [handHoverLabel, setHandHoverLabel] = useState(null);   // { text, busy }
  // What the last plug / unplug did, shown for a few seconds where the
  // CABLE IN HAND box was (antd's static message() toasts do not render
  // under React 19, so they cannot carry this).
  const [cableNote, setCableNote] = useState(null);             // { text, tone }
  useEffect(() => {
    if (!cableNote) return undefined;
    const t = setTimeout(() => setCableNote(null), 6000);
    return () => clearTimeout(t);
  }, [cableNote]);
  // Set further down, once rebuildWiring exists (keeps a cross-rack cord's
  // floor connection in step with the cord).
  const syncCordConnectionRef = useRef(null);
  // A raycaster for picking: in RACK VIEW it only sees what is on screen.
  const pickRaycaster = () => {
    const rc = new THREE.Raycaster();
    if (rackViewIdRef.current) rc.layers.set(RACK_VIEW_LAYER);
    return rc;
  };

  // ── Thermal Monitoring (CFD-style floor heatmap; was "Hotspot Detection") ─
  const [hotspotOpen, setHotspotOpen] = useState(false);
  const hotspotOpenRef = useRef(false);
  useEffect(() => { hotspotOpenRef.current = hotspotOpen; }, [hotspotOpen]);
  const [hotspotStats, setHotspotStats] = useState(null);
  const hotspotWarnedRef = useRef(false);

  // ── Airflow simulation (hot aisle / cold aisle loop) ───────────────────
  const [airflowOn, setAirflowOn] = useState(false);
  const airflowOnRef = useRef(false);
  useEffect(() => { airflowOnRef.current = airflowOn; }, [airflowOn]);

  // ── Suspended ceiling (busway / overhead tray level) ───────────────────
  const [ceilingOn, setCeilingOn] = useState(false);
  const ceilingOnRef = useRef(false);
  useEffect(() => { ceilingOnRef.current = ceilingOn; }, [ceilingOn]);

  // ── Switch states for MCBs / breakers ──────────────────────────────────
  // deviceId -> true (closed, live) | false (open, isolated). Anything not in
  // the map is closed, so a freshly placed breaker is energised by default.
  const [switchStates, setSwitchStates] = useState({});
  const switchStatesRef = useRef({});
  useEffect(() => { switchStatesRef.current = switchStates; }, [switchStates]);

  // ── Frozen shadow map: re-taken only when a caster changes ─────────────
  // Counts frames rather than being a boolean, because a rebuild often lands
  // one frame before the objects it created are in the scene graph.
  const shadowDirtyRef = useRef(3);
  const markShadowsDirty = useCallback(() => { shadowDirtyRef.current = 3; }, []);

  // ── Spinning fans, resolved once per device build ──────────────────────
  // A chiller carries several fans and a CRAC one, and they used to be found
  // with root.getObjectByName("FanBlades") per device per frame — a full
  // recursive walk of every cabinet on the floor, sixty times a second, to
  // locate six objects. It also only ever returned the FIRST match, which is
  // why a chiller with two fans only ever spun one of them.
  const spinnersRef = useRef([]);

  const occupiedTilesRef = useRef(new Map());
  const deviceIdCounterRef = useRef(1);

  const gateTileKeysRef = useRef([]);
  const perforatedTileKeysRef = useRef(new Set());
  const reservedTilesRef = useRef(new Set());
  const rebuildReservedTiles = useCallback(() => {
    reservedTilesRef.current = new Set([...gateTileKeysRef.current, ...perforatedTileKeysRef.current]);
  }, []);

  // ── Room entry / exit gates ────────────────────────────────────────────
  // One ENTRY and one EXIT per room, each pinned to a wall of its own room
  // and free to slide along any of them. Held here rather than on the room
  // record so a gate can be dragged without re-emitting the whole room.
  const [roomGates, setRoomGates] = useState([]);
  const roomGatesRef = useRef([]);
  useEffect(() => { roomGatesRef.current = roomGates; }, [roomGates]);

  const [perfTiles, setPerfTiles] = useState([]);
  const perfTilesRef = useRef(perfTiles);
  useEffect(() => { perfTilesRef.current = perfTiles; }, [perfTiles]);
  const perfTileIdRef = useRef(1);

  // Under-floor cable trays (straight runs), drawn in the CONNECTIVITY view.
  // Data, like the perforated tiles: they outlive a scene rebuild.
  const cableTraysRef = useRef([]);

  useEffect(() => {
    perforatedTileKeysRef.current = new Set(perfTiles.map((t) => `${t.tx},${t.tz}`));
    rebuildReservedTiles();
  }, [perfTiles, rebuildReservedTiles]);

  const layersStateRef = useRef(layers);
  useEffect(() => { layersStateRef.current = layers; }, [layers]);

  // ═══════════════════════════════════════════════════════════════════════
  // NEW STATE — failure simulation + capacity prediction
  // ═══════════════════════════════════════════════════════════════════════
  const [trackerOpen, setTrackerOpen] = useState(false);
  // ── Storage view: rack occupancy, U by U ──
  const [storageOn, setStorageOn] = useState(false);
  const storageOnRef = useRef(false);
  useEffect(() => { storageOnRef.current = storageOn; }, [storageOn]);
  // deviceId -> the rack's slot list, cached as it resolves so the overlay
  // can be rebuilt without re-fetching.
  const rackSlotsRef = useRef(new Map());
  const [storageVersion, setStorageVersion] = useState(0);
  const [storageSummary, setStorageSummary] = useState(null);
  const trackerOpenRef = useRef(false);
  useEffect(() => { trackerOpenRef.current = trackerOpen; }, [trackerOpen]);
  // Deployment Guide — the live "what comes next" chain checklist.
  const [guideOpen, setGuideOpen] = useState(false);
  // Chain guidance toasts on every placement. On by default; the toast
  // itself carries the switch to turn them off, because a planner who is
  // laying 40 racks in a row does not need 40 identical hints.
  const [guideToasts, setGuideToasts] = useState(true);
  const guideToastsRef = useRef(true);
  useEffect(() => { guideToastsRef.current = guideToasts; }, [guideToasts]);

  const [failures, setFailures] = useState({});          // deviceId -> { at, mode }
  // The sim clock is a STOPWATCH: it starts at zero and counts how long the
  // simulation has been running, which is what makes "how long has this been
  // down" readable straight off it. At 1x one tick is one real second.
  const [simClock, setSimClock] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);           // 1× — live, real time
  const [costModel, setCostModel] = useState({ ...DEFAULT_COST_MODEL });

  const simClockRef = useRef(0);
  useEffect(() => { simClockRef.current = simClock; }, [simClock]);

  const [capacityRoomId, setCapacityRoomId] = useState(null);
  // Per-room-type capacity overrides. The Capacity Planner panel that used
  // to edit these is gone from the header (Storage took its place), but the
  // prediction engine still reads them for room-fit checks and the "planned
  // capacity" figure, so the defaults stay wired up.
  const [capacityTuning] = useState({});

  const statusHalosRef = useRef([]);
  const impactReportRef = useRef(null);

  const applyLabelVisibility = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const on = labelsVisibleRef.current;
    // While X-RAY is focused on a device, the labels of everything ghosted
    // are hidden outright rather than faded. A sprite label does not dim
    // with the body it belongs to (it is drawn on top, depth-test off), so
    // leaving them on puts a wall of crisp nameplates over the very run the
    // x-ray is meant to isolate.
    const focus = xrayFocusRef.current && circuitRef.current ? circuitRef.current : null;
    scene.traverse((o) => {
      if (!o.userData?.isLabel) return;
      const layerOk = o.userData.layer ? layersStateRef.current[o.userData.layer] !== false : true;
      let focusOk = true;
      if (focus) {
        if (o.userData.wireId) focusOk = focus.wireIds.has(o.userData.wireId);
        else if (o.userData.deviceId) focusOk = focus.deviceIds.has(o.userData.deviceId);
      }
      o.visible = on && layerOk && focusOk;
    });
  }, []);

  const applyUnderFloorView = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const on = underFloorRef.current;

    const floorSystem = scene.getObjectByName("DataCenter")?.getObjectByName("FloorSystem");
    // The raised-floor tiles are one big InstancedMesh covering the whole
    // room. Making it translucent meant every pixel of the plenum was
    // drawn through a full-screen transparent layer (sorted, depth-write
    // off) on top of everything below it -- expensive from a low angle,
    // which is exactly where PLENUM stuttered while the top-down view
    // stayed smooth. Lifting the tiles away instead is both faster and a
    // genuinely clear, wide look into the plenum.
    const tiles = floorSystem?.getObjectByName("FloorTiles");
    if (tiles) tiles.visible = !on;
    // Pedestal legs stay solid -- ghosting them would wash the view out.
    // Turning PLENUM off hides them outright; while it's on, the frame
    // loop shows them only once the camera is actually below the floor.
    const pedestals = floorSystem?.getObjectByName("PlenumPedestals");
    if (pedestals && !on) pedestals.visible = false;
    // Drop the ground plane under the slab while looking under the floor,
    // so the plenum -- trays, cable runs, pipes -- is actually in view.
    const ground = scene.getObjectByName("GroundPlane");
    if (ground) ground.position.y = on ? GROUND_Y_UNDERFLOOR : GROUND_Y;
    // Perforated tiles are floor tiles too: ghost them, or the power trays
    // and cold-air runs under the cold aisles stay hidden beneath them.
    scene.getObjectByName("PerfTilesGroup")?.traverse((o) => {
      if (!o.isMesh) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (m.userData.pfBaseOpacity === undefined) {
          m.userData.pfBaseOpacity = m.opacity;
          m.userData.pfBaseTransparent = m.transparent;
          m.userData.pfBaseDepthWrite = m.depthWrite;
        }
        m.transparent = on ? true : m.userData.pfBaseTransparent;
        m.opacity = on ? 0.22 : m.userData.pfBaseOpacity;
        m.depthWrite = on ? false : m.userData.pfBaseDepthWrite;
        m.needsUpdate = true;
      });
    });
    // The slab and skirt are a couple of meshes, so ghosting those is
    // cheap and keeps the room's footprint readable.
    floorSystem?.traverse((o) => {
      if (!o.isMesh || o === tiles || o === pedestals) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m.userData.ufBaseOpacity === undefined) {
          m.userData.ufBaseOpacity = m.opacity;
          m.userData.ufBaseTransparent = m.transparent;
          m.userData.ufBaseDepthWrite = m.depthWrite;
        }
        m.transparent = on ? true : m.userData.ufBaseTransparent;
        m.opacity = on ? 0.16 : m.userData.ufBaseOpacity;
        m.depthWrite = on ? false : m.userData.ufBaseDepthWrite;
        m.needsUpdate = true;
      });
    });
  }, []);

  // ── RACK VIEW: open the isolated rack, keep every other one closed ──────
  // The old TRANSPARENT toggle ghosted EVERY cabinet on the floor at once.
  // RACK VIEW works on one: that rack opens up (setRackOpened) and gets its
  // real contents + rear cabling; the frame loop draws only it and the floor
  // under it. Every other rack stays exactly as built.
  // A cord end in words: "RK-B3 · WEB-B3-02 · NIC 2", or a device's name.
  const describeCordEnd = useCallback((end) => {
    if (!end) return "loose";
    const dev = devicesRef.current.find((d) => d.id === (end.deviceId || end.rackId));
    const devName = dev ? deviceLabel(dev) : "(removed device)";
    if (end.deviceId) return devName;
    const rt = rackRuntimeRef.current.get(end.rackId);
    const slots = rackSlotsRef.current.get(end.rackId);
    if (!rt || !slots) return devName;
    const port = rackPortCatalog(rt.dims, slots).ports.get(end.portId);
    return port ? `${devName} · ${port.device} · ${port.label}` : devName;
  }, []);

  // The open rack's pieces: its root, inner group and RACK VIEW dressing.
  const rackViewParts = useCallback(() => {
    const id = rackViewIdRef.current;
    const root = id ? sceneRef.current?.getObjectByName("DevicesGroup")?.children
      .find((c) => c.userData.deviceId === id) : null;
    const inner = root?.userData?.rackInnerGroup || null;
    return { id, root, inner, dressing: inner?.userData?.rackViewDressing || null };
  }, []);

  // Pointer (client px) → a point on a plane just behind the equipment,
  // in the open rack's own coordinates. Where a carried plug "is".
  const pointerOnRackPlane = useCallback((ptr, inner, g) => {
    const camera = cameraRef.current;
    const canvas = canvasRef.current;
    if (!ptr || !camera || !canvas || !inner) return null;
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ptr.x - rect.left) / rect.width) * 2 - 1, -((ptr.y - rect.top) / rect.height) * 2 + 1);
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, camera);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(inner.matrixWorld);
    const onPlane = inner.localToWorld(new THREE.Vector3(0, 0, g.Z_REAR - 0.09));
    const hit = new THREE.Vector3();
    if (!rc.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(normal, onPlane), hit)) return null;
    const p = inner.worldToLocal(hit);
    p.x = THREE.MathUtils.clamp(p.x, -0.34, 0.34);
    p.y = THREE.MathUtils.clamp(p.y, -g.H / 2 - 0.05, g.H / 2 + 0.12);
    p.z = g.Z_REAR - 0.09;
    return p;
  }, []);

  // Port markers + the cable drawn in your hand, for whatever the open
  // rack and the hand hold right now. Cheap: runs on every pointer move.
  const refreshHandVisuals = useCallback(() => {
    if (handVisualRef.current) { disposeHandCable(handVisualRef.current.mesh); handVisualRef.current = null; }
    const { id: rackId, inner, dressing } = rackViewParts();
    if (!dressing) return;
    const hand = cableHandRef.current;
    const markers = dressing.userData.portMarkers;
    const ports = dressing.userData.ports;
    const busyBy = dressing.userData.occupiedPorts;
    const g = dressing.userData.rackGeom;
    if (!hand && !portPickModeRef.current) { paintPortMarkers(markers, () => "hidden", false); return; }

    const fixedPort = hand && hand.fixed?.rackId === rackId ? ports.get(hand.fixed.portId) || null : null;
    const sameRack = !hand?.fixed || !hand.fixed.rackId || hand.fixed.rackId === rackId;
    const hover = hand ? handHoverPortRef.current : null;
    // green = free, orange = in use (plugging there swaps the old cable
    // out), yellow = where the cable in hand starts.
    let freeForNew = 0;
    paintPortMarkers(markers, (pid) => {
      const p = ports.get(pid);
      if (!hand) {                                                     // + NEW CABLE
        const ok = !busyBy.has(pid) && canPlugInto(newCableRoleRef.current, p);
        if (ok) freeForNew += 1;
        return ok ? "free" : "hidden";
      }
      if (fixedPort && pid === fixedPort.id) return "from";
      if (!canPlugInto(hand.role, p, { fixedPort, sameRack })) return "hidden";
      return busyBy.has(pid) && busyBy.get(pid) !== hand.cordId ? "swap" : "free";
    }, true, hover);
    if (!hand) { setPickFreeCount(freeForNew); return; }

    // The cable itself: from where its other end is, to the pointer -- or
    // snapped into the port it would plug into.
    const hoverPort = hover ? ports.get(hover) : null;
    let to, toDir = null;
    if (hoverPort) {
      to = portPlugPoint(g, hoverPort);
      toDir = portInDir(hoverPort);
    } else {
      to = pointerOnRackPlane(handPointerRef.current, inner, g) || new THREE.Vector3(0, 0, g.Z_REAR - 0.09);
    }
    let from, fromDir;
    if (fixedPort) {
      from = portPlugPoint(g, fixedPort);
      fromDir = portInDir(fixedPort).negate();
    } else if (hand.fixed) {
      // The other end is in another rack / device: it comes up through the floor.
      from = new THREE.Vector3(0.18, -g.H / 2 - 0.02, g.Z_REAR - 0.12);
      fromDir = new THREE.Vector3(0, 1, 0);
    } else {
      from = to.clone().add(new THREE.Vector3(0, -0.3, -0.02));
      fromDir = new THREE.Vector3(0, 1, 0);
    }
    if (!toDir) toDir = to.clone().sub(from).normalize();
    const mesh = buildHandCable({ from, fromDir, to, toDir, role: hand.role });
    mesh.userData.deviceId = rackId;
    inner.add(mesh);
    handVisualRef.current = { mesh };
  }, [rackViewParts, pointerOnRackPlane]);

  const applyRackView = useCallback(() => {
    const scene = sceneRef.current;
    const devicesGroup = scene?.getObjectByName("DevicesGroup");
    if (!devicesGroup) return;
    const isoId = rackViewIdRef.current;
    const isDarkNow = scene.userData?.isDark ?? true;
    let info = null;
    devicesGroup.children.forEach((root) => {
      if (!root.userData?.isRackBody) return;
      const id = root.userData.deviceId;
      const open = !!isoId && id === isoId;
      const slots = rackSlotsRef.current.get(id);
      let cords = [];
      if (open && slots) {
        // First look at this rack (or its contents changed): bring its
        // cabling in step before drawing it.
        const sync = syncRackCabling(id, root.userData.rackRealFace.dims, slots);
        if (sync.changed) cordsVersionRef.current += 1;
        sync.removedCords.forEach((c) => syncCordConnectionRef.current?.(c.id));
        // A far end on a device that has since been deleted is now loose.
        const alive = new Set(devicesRef.current.map((d) => d.id));
        patchCordStore.forRack(id).forEach((c) => {
          const lost = (e) => e && !alive.has(e.deviceId || e.rackId);
          if (!lost(c.a) && !lost(c.b)) return;
          const fixed = { ...c, a: lost(c.a) ? null : c.a, b: lost(c.b) ? null : c.b };
          if (!fixed.a && !fixed.b) patchCordStore.remove(c.id); else patchCordStore.save(fixed);
          cordsVersionRef.current += 1;
        });
        cords = patchCordStore.all();
      }
      const summary = setRackOpened(root, open, {
        slots, cords, isDark: isDarkNow,
        excludeCordId: open ? (cableHandRef.current?.cordId || null) : null,
        cordsVersion: cordsVersionRef.current,
        describeEnd: describeCordEnd,
      });
      if (open) info = { id, summary, slots: slots || null };
    });
    setRackViewInfo(info);
    refreshHandVisuals();
  }, [describeCordEnd, refreshHandVisuals]);

  // ═══════════════════════════════════════════════════════════════════════
  // DEVICE DATA MODEL
  // ═══════════════════════════════════════════════════════════════════════
  const [devices, setDevices] = useState([]);
  const devicesRef = useRef(devices);
  useEffect(() => { devicesRef.current = devices; }, [devices]);

  // ── Backfill asset tags ────────────────────────────────────────────────
  // Devices placed before aliases existed (or arriving from a saved layout /
  // the API) have no tag. deviceLabel() falls back to the type name so
  // nothing breaks, but a floor of nine identically-named "Rack"s is exactly
  // what tags are for — so give them one on sight. setDevices, not
  // commitDevices: this is a repair, not an edit, and it should not land in
  // the undo stack. Once every device has a tag the effect is a no-op.
  useEffect(() => {
    if (!devices.length || devices.every((d) => (d.alias || "").trim())) return;
    setDevices((prev) => {
      const out = [];
      prev.forEach((d) => {
        // Tags already on the floor come from `prev`; ones assigned in this
        // very pass come from `out` — both have to be in view or two devices
        // could be handed the same number.
        out.push((d.alias || "").trim() ? d : { ...d, alias: nextAlias(d, [...prev, ...out]) });
      });
      return out;
    });
  }, [devices]);

  const historyRef = useRef({ past: [], future: [] });
  const [histVersion, setHistVersion] = useState(0);
  const commitDevices = useCallback((updater, opts = {}) => {
    setDevices((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (opts.pushHistory !== false) {
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > 60) historyRef.current.past.shift();
        historyRef.current.future = [];
      }
      return next;
    });
    setHistVersion((v) => v + 1);
  }, []);
  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    setDevices((prev) => {
      const previous = h.past.pop();
      h.future.push(prev);
      return previous;
    });
    setHistVersion((v) => v + 1);
  }, []);
  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    setDevices((prev) => {
      const nextState = h.future.pop();
      h.past.push(prev);
      return nextState;
    });
    setHistVersion((v) => v + 1);
  }, []);

  const canUndo = useMemo(() => historyRef.current.past.length > 0, [histVersion]);
  const canRedo = useMemo(() => historyRef.current.future.length > 0, [histVersion]);

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const selectedDeviceIdRef = useRef(null);
  useEffect(() => { selectedDeviceIdRef.current = selectedDeviceId; }, [selectedDeviceId]);
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  const circuit = useMemo(
    () => (selectedDeviceId
      ? traceCircuit(connectionsRef.current, selectedDeviceId, XRAY_TRACE_DEPTH)
      : null),
    [selectedDeviceId, connVersion],
  );

  useEffect(() => { xrayFocusRef.current = xrayFocus; }, [xrayFocus]);
  useEffect(() => { circuitRef.current = circuit; }, [circuit]);

  const applyXrayFocus = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const active = xrayFocusRef.current && circuitRef.current ? circuitRef.current : null;

    const devicesGroup = scene.getObjectByName("DevicesGroup");
    if (devicesGroup) {
      devicesGroup.children.forEach((root) => {
        const dimmed = !!active && !active.deviceIds.has(root.userData.deviceId);
        root.traverse((o) => setObjectDimmed(o, dimmed));
      });
    }

    // Cables, including the plenum runs under the floor: only the ones that
    // land on the focused device stay lit.
    const wiringGroup = scene.getObjectByName("WiringGroup");
    if (wiringGroup) {
      wiringGroup.children.forEach((o) => {
        const dimmed = !!active && !active.wireIds.has(o.userData.wireId);
        setObjectDimmed(o, dimmed);
      });
    }

    // Labels are hidden rather than faded, so re-run that pass too -- it is
    // the one that knows about the focus (see applyLabelVisibility).
    applyLabelVisibility();
  }, [applyLabelVisibility]);

  const [placeDeviceSession, setPlaceDeviceSession] = useState(null);
  const placeDeviceSessionRef = useRef(null);
  useEffect(() => { placeDeviceSessionRef.current = placeDeviceSession; }, [placeDeviceSession]);

  const [placementToast, setPlacementToast] = useState(null);
  const [roomDrawInfo, setRoomDrawInfo] = useState(null);

  const clipboardRef = useRef(null);
  const moveArmedRef = useRef(false);
  const cancelActiveSessionRef = useRef(() => false);
  const cancelResizeSessionRef = useRef(() => false);
  const pulseIdRef = useRef(null);

  const infoPanelElRef = useRef(null);
  const actionBarElRef = useRef(null);

  const rawLength = parseFloat(dc?.dcLength) || 40;
  const rawBreadth = parseFloat(dc?.dcBreadth) || 25;
  const lengthUnit = dc?.dcLengthUnit || "m";
  const breadthUnit = dc?.dcBreadthUnit || "m";
  const lengthM = rawLength * (UNIT_TO_METERS[lengthUnit] || 1);
  const breadthM = rawBreadth * (UNIT_TO_METERS[breadthUnit] || 1);
  const clampedLength = Math.max(10, Math.min(lengthM, 200));
  const clampedBreadth = Math.max(10, Math.min(breadthM, 200));

  // ═══════════════════════════════════════════════════════════════════════
  // DERIVED MODEL — room rectangles, device→room assignment, prediction,
  // and the live impact report. All pure, all memoised.
  // ═══════════════════════════════════════════════════════════════════════
  const roomRects = useMemo(() => {
    if (!rooms?.length) return [];
    const margins = dc?.margins || { top: 2, bottom: 2, left: 2, right: 2, color: DEFAULT_MARGIN_COLOR };
    return computeRoomLayout(rooms, clampedLength, clampedBreadth, margins).map(({ room, rx, rz }) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      cx: rx, cz: rz,
      w: room.width, l: room.length,
      h: Math.min(room.height || 8, BUILDING_H - 0.25),
      kw: room.kw || 0,
      room,
    }));
  }, [rooms, clampedLength, clampedBreadth, dc?.margins]);

  // A ref mirror of roomRects, so the thermal-hotspot rebuild (triggered
  // from event handlers / effects, not render) can look up "which room is
  // this hotspot in" without depending on React state timing.
  const roomRectsRef = useRef([]);
  useEffect(() => { roomRectsRef.current = roomRects; }, [roomRects]);

  // A device belongs to whichever room rectangle contains its centre.
  const devicesWithRoom = useMemo(() => devices.map((d) => {
    const hit = roomRects.find((r) =>
      Math.abs(d.position.x - r.cx) <= r.w / 2 && Math.abs(d.position.z - r.cz) <= r.l / 2);
    return hit ? { ...d, __roomId: hit.id } : { ...d, __roomId: null };
  }), [devices, roomRects]);

  const predictions = useMemo(() => roomRects.map((r) => {
    const placed = devicesWithRoom.filter((d) => d.__roomId === r.id).length;
    return predictRoomCapacity(r.room, placed, capacityTuning[r.room.type] || {});
  }), [roomRects, devicesWithRoom, capacityTuning]);

  const impactReport = useMemo(() => computeImpactReport({
    devices: devicesWithRoom,
    connections: connectionsRef.current,
    roomRects,
    failures,
    simSeconds: simClock,
    costModel,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [devicesWithRoom, roomRects, failures, simClock, costModel, connVersion]);

  useEffect(() => { impactReportRef.current = impactReport; }, [impactReport]);

  // ── Simulation → tickets ────────────────────────────────────────────────
  // Every device failed in Simulate mode raises a ticket in the shared ticket
  // store — it pops up bottom-right and lands in Ticket Management, where it
  // can be reassigned. Restoring the device resolves it. While the device is
  // down, its ticket carries the live downtime, cost and blast radius.
  const simTicketsRef = useRef(new Map());          // deviceId -> ticketNo
  useEffect(() => {
    const open = simTicketsRef.current;
    const failedNow = new Set(Object.keys(failures));
    failedNow.forEach((id) => {
      if (open.has(id)) return;
      const dev = devicesRef.current.find((d) => d.id === id);
      if (!dev) return;
      const role = deviceRole(dev);
      const st = impactReportRef.current?.devices.get(id);
      const inc = impactReportRef.current?.incidents?.find((i) => i.id === id);
      const t = ticketStore.raiseSimulationTicket({
        deviceId: id, deviceName: deviceLabel(dev), role,
        category: { power: "Power", cooling: "Cooling", network: "Network", safety: "Security" }[role] || "Hardware",
        roomName: st?.roomName || null, dcName: dc?.dataCenterName || null,
        cascadeCount: inc?.cascadeCount || 0,
      });
      open.set(id, t.ticketNo);
    });
    [...open.keys()].forEach((id) => {
      if (failedNow.has(id)) return;
      ticketStore.resolveSimulationTicket(open.get(id));
      open.delete(id);
    });
  }, [failures]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const open = simTicketsRef.current;
    if (!open.size || !impactReport) return;
    const cm = impactReport.costModel || {};
    impactReport.incidents.forEach((inc) => {
      const no = open.get(inc.id);
      if (!no) return;
      const own = impactReport.devices.get(inc.id);
      const ownRate = !own ? 0 : (own.role === "load" ? cm.rackRevenuePerHour
        : own.role === "network" ? cm.networkRevenuePerHour : cm.auxRevenuePerHour) * own.lossFactor;
      ticketStore.setLive(no, {
        downSec: Math.round(inc.durationSec), cost: inc.blastCost,
        burnPerHour: (inc.blastBurnPerHour || 0) + (ownRate || 0), cascadeCount: inc.cascadeCount,
      });
    });
  }, [impactReport]);

  // Leaving the 5D View stops the live readings; the tickets stay open.
  useEffect(() => () => ticketStore.clearLive([...simTicketsRef.current.values()]), []);

  // ── Compare views ───────────────────────────────────────────────────────
  const [compareOpen, setCompareOpen] = useState(false);
  const [viewCaptures, setViewCaptures] = useState([]);
  const captureSeqRef = useRef(0);
  const captureView = useCallback(() => {
    let image = null;
    try {
      const renderer = rendererRef.current, scene = sceneRef.current, camera = cameraRef.current;
      if (renderer && scene && camera) {
        // Render now and read the frame back straight away (no
        // preserveDrawingBuffer needed), scaled down to a light thumbnail.
        renderer.render(scene, camera);
        const src = renderer.domElement;
        const w = Math.min(800, src.width);
        const h = Math.round((src.height / src.width) * w);
        const c2 = document.createElement("canvas");
        c2.width = w; c2.height = h;
        c2.getContext("2d").drawImage(src, 0, 0, w, h);
        image = c2.toDataURL("image/jpeg", 0.8);
      }
    } catch { image = null; }
    captureSeqRef.current += 1;
    const snap = buildViewSnapshot({
      report: impactReportRef.current, failures, simSeconds: simClockRef.current,
      image, index: captureSeqRef.current,
    });
    // No limit: capture as many views as needed and compare them all.
    setViewCaptures((prev) => [...prev, snap]);
    message.success(`${snap.label} captured — ${snap.kind === "Normal" ? "normal view" : `simulation, ${snap.counts.failed} failed`}.`);
  }, [failures]);

  // A stable fingerprint of "who is unhealthy and how badly" — this changes
  // rarely, so the expensive 3D halo rebuild does not run on every sim tick.
  const severitySignature = useMemo(() => {
    if (!impactReport) return "";
    const parts = [];
    impactReport.devices.forEach((s, id) => { if (s.severity !== "ok") parts.push(`${id}:${s.severity}`); });
    return parts.sort().join("|");
  }, [impactReport]);

  const failedCount = Object.keys(failures).length;

  // Keep a room selected in the capacity planner as rooms come and go.
  useEffect(() => {
    if (!roomRects.length) { setCapacityRoomId(null); return; }
    if (capacityRoomId == null || !roomRects.some((r) => r.id === capacityRoomId)) {
      const firstPlaceable = roomRects.find((r) => r.type !== "corridor") || roomRects[0];
      setCapacityRoomId(firstPlaceable.id);
    }
  }, [roomRects, capacityRoomId]);

  // ── Simulated clock ──
  // Advanced from the real elapsed time between ticks rather than by adding
  // a fixed 0.25 s each time, because setInterval does not fire on schedule:
  // it drifts under load and is throttled hard in a background tab, so a
  // fixed increment would quietly under-count exactly when a long failure is
  // being left to run. At 1x this makes a second on the clock a real second.
  useEffect(() => {
    if (!simRunning) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const realElapsed = (now - last) / 1000;
      last = now;
      setSimClock((c) => c + realElapsed * simSpeed);
    }, 250);
    return () => clearInterval(id);
  }, [simRunning, simSpeed]);

  const toggleFailure = useCallback((deviceId) => {
    setFailures((prev) => {
      const next = { ...prev };
      if (next[deviceId]) {
        delete next[deviceId];
      } else {
        next[deviceId] = { at: simClockRef.current, mode: "Manual failure injected" };
      }
      return next;
    });
    setTrackerOpen(true);
    setSimRunning(true);
  }, []);

  const clearFailure = useCallback((deviceId) => {
    setFailures((prev) => {
      if (!prev[deviceId]) return prev;
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
  }, []);

  const clearAllFailures = useCallback(() => setFailures({}), []);

  const resetSimulation = useCallback(() => {
    setFailures({});
    setSimClock(0);
    setSimRunning(false);
    message.info("Simulation reset — stopwatch back to zero, every device restored.");
  }, []);

  // Snapshot capture / compare was removed with the Snapshots and Compare
  // tabs — the simulation now answers one question: what does THIS failure
  // take down, for how long, and at what cost.

  const handleAddRoom = (roomData) => {
    const id = Date.now();
    const newRoom = { id, ...roomData, hex: roomData.color };

    const dcTop = dc?.margins?.top ?? 2;
    const dcBottom = dc?.margins?.bottom ?? 2;
    const dcLeft = dc?.margins?.left ?? 2;
    const dcRight = dc?.margins?.right ?? 2;
    const buildableWidth = Math.max(0, clampedLength - dcLeft - dcRight);
    const buildableDepth = Math.max(0, clampedBreadth - dcTop - dcBottom);

    if (newRoom.width > buildableWidth || newRoom.length > buildableDepth) {
      message.error(
        `"${newRoom.name || "Room"}" is ${newRoom.width.toFixed(2)}m × ${newRoom.length.toFixed(2)}m — that's bigger than the buildable floor area (${buildableWidth.toFixed(2)}m × ${buildableDepth.toFixed(2)}m). Reduce the size (check the dimension unit) and try again.`
      );
      return false;
    }

    // Predict this room's capacity the moment it is created, and say so.
    const preview = predictRoomCapacity(newRoom, 0, capacityTuning[newRoom.type] || {});
    dcimBus.emit("addRoom", newRoom);
    // The Capacity Planner no longer springs open on every new room -- it
    // only pre-selects the room that was just made, so opening the panel
    // from the header lands on it. Auto-opening a modal on top of the floor
    // plan interrupted the actual layout work.
    setCapacityRoomId(id);
    if (!preview.nonPlaceable) {
      if (preview.planned > 0) {
        message.success(
          `"${newRoom.name}" fits about ${preview.planned} ${preview.profile.units} (${preview.geometricMax} at absolute max) — limited by ${preview.binding.label.toLowerCase()}.`
        );
      } else {
        message.warning(
          `"${newRoom.name}" is too small for even one ${preview.profile.unit} once clearances are applied. Check the Capacity Planner for the minimum size.`
        );
      }
    }
    return true;
  };
  const handleDeleteRoom = (id) => dcimBus.emit("deleteRoom", { id });
  const handleViewRoom = (id) => dcimBus.emit("zoomRoom", { id });

  const handleToggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      if (onThemeChange) onThemeChange(next);
      return next;
    });
  }, [onThemeChange]);

  useEffect(() => {
    if (themeProp) setTheme(themeProp);
  }, [themeProp]);

  const updateRoomsInScene = useCallback((scene, roomsList, lM, bM, isDark, gates = []) => {
    const existing = scene.getObjectByName("RoomsGroup");
    if (existing) {
      existing.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
      });
      scene.remove(existing);
    }
    if (!roomsList?.length) return;

    const group = new THREE.Group();
    group.name = "RoomsGroup";
    group.userData.layer = "rooms";

    const layout = computeRoomLayout(roomsList, lM, bM, dc?.margins || { top: 2, bottom: 2, left: 2, right: 2, color: DEFAULT_MARGIN_COLOR });
    // Every corridor's footprint, so each walk path can leave its junctions
    // with the others open instead of lining straight across them.
    const corridorRects = layout
      .filter(({ room }) => room.type === "corridor")
      .map(({ room, rx, rz }) => ({
        x0: rx - room.width / 2, x1: rx + room.width / 2,
        z0: rz - room.length / 2, z1: rz + room.length / 2,
      }));

    layout.forEach(({ room, rx, rz, marginLeft, marginRight, marginTop, marginBottom }) => {
      const marginGroup = new THREE.Group();
      marginGroup.name = `Margin_${room.id}`;
      const roomMarginColorNum = hexToColorNum(dc?.margins?.color || DEFAULT_MARGIN_COLOR);
      const marginMat = new THREE.MeshStandardMaterial({ color: roomMarginColorNum, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
      const addBand = (w, d, x, z) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), marginMat);
        m.rotation.x = -Math.PI / 2; m.position.set(x, FLOOR_Y + 0.014, z);
        marginGroup.add(m);
      };
      if (marginLeft > 0) addBand(marginLeft, room.length, rx - room.width / 2 - marginLeft / 2, rz);
      if (marginRight > 0) addBand(marginRight, room.length, rx + room.width / 2 + marginRight / 2, rz);
      if (marginTop > 0) addBand(room.width + marginLeft + marginRight, marginTop, rx, rz - room.length / 2 - marginTop / 2);
      if (marginBottom > 0) addBand(room.width + marginLeft + marginRight, marginBottom, rx, rz + room.length / 2 + marginBottom / 2);
      group.add(marginGroup);

      const roomGroup = createRoom3DAt(room, rx, rz, isDark, gates.filter((g) => g.roomId === room.id), corridorRects);
      group.add(roomGroup);
    });

    scene.add(group);
    // Walls and piers are the floor's main shadow casters, so a rebuild is
    // one of the few things that makes the frozen shadow map stale.
    markShadowsDirty();
  }, [dc?.margins, markShadowsDirty]);

  // ── Gates: (re)build the 3D group ──────────────────────────────────────
  // Its own top-level group, not a child of RoomsGroup, so moving a gate
  // costs one small rebuild instead of regenerating every wall on the floor.
  const rebuildGates = useCallback((scene, gates, rects, isDark) => {
    const old = scene.getObjectByName("RoomGatesGroup");
    if (old) {
      old.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])
          .forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      scene.remove(old);
    }
    if (!gates?.length) return;
    const group = new THREE.Group();
    group.name = "RoomGatesGroup";
    gates.forEach((g) => {
      const rect = rects.find((r) => r.id === g.roomId);
      if (!rect) return;
      group.add(createRoomGate(g, rect, rect.name, isDark));
    });
    scene.add(group);
    markShadowsDirty();
  }, [markShadowsDirty]);

  const rebuildWiring = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const old = scene.getObjectByName("WiringGroup");
    if (old) {
      old.traverse((o) => {
        // The unit run/bead/node shapes and the per-type nameplate textures
        // are shared by the whole building and outlive this pass.
        if (o.geometry && !o.geometry.userData?.isSharedRackGeo) o.geometry.dispose();
        if (o.material) {
          if (o.material.map && !o.material.map.isSharedTexture) o.material.map.dispose();
          o.material.dispose();
        }
      });
      scene.remove(old);
    }
    const devicesGroup = scene.getObjectByName("DevicesGroup");
    if (!devicesGroup) return;
    scene.updateMatrixWorld(true); // ports read live mesh world position/rotation below

    const isDarkNow = sceneRef.current?.userData?.isDark ?? true;
    const LP = labelPalette(isDarkNow);
    const under = underFloorRef.current;

    const group = new THREE.Group();
    group.name = "WiringGroup";

    // Resolves one connection endpoint to a world point + the direction a
    // cable should exit it: straight up out of a whole device's top (as
    // before), or straight out of a rack slot's own front face for a port
    // (rotated into world space so it's correct even if the rack itself is
    // rotated). Returns null if the device/slot no longer exists.
    // One pass over the device roots instead of a linear scan per endpoint:
    // with a few hundred cables and a hundred devices that scan was tens of
    // thousands of comparisons for an answer that never changes mid-pass.
    const rootById = new Map();
    devicesGroup.children.forEach((c) => rootById.set(c.userData.deviceId, c));

    const resolveEndpointGeom = (id) => {
      const { deviceId, slotId, portIdx } = parseEndpointId(id);
      const root = rootById.get(deviceId);
      if (!root) return null;
      if (slotId) {
        let portMesh = null;
        root.traverse((o) => { if (!portMesh && o.userData?.isRackSlotPort && o.userData.slotId === slotId) portMesh = o; });
        if (!portMesh) return null;
        const worldQuat = root.getWorldQuaternion(new THREE.Quaternion());
        // Real rack cabling is dressed at the REAR, not the front -- exit
        // out of the port box's back face.
        const exitDir = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat);
        // getWorldPosition() is the port box's CENTER, which sits at the
        // rack's front-to-back midpoint -- push it out to the box's own
        // back face (where slot.backImageUrl/the nameplate renders) so the
        // cable visibly plugs in at the rear of the slot instead of
        // appearing to emerge from inside the rack's cross-section.
        const halfDepth = (portMesh.geometry.parameters?.depth || 0.1) / 2;
        const point = portMesh.getWorldPosition(new THREE.Vector3()).addScaledVector(exitDir, halfDepth);
        // ...then slide along the slot to the specific port that was
        // clicked, so two cables off the same server visibly leave from
        // two different sockets rather than the same centre point.
        if (portIdx != null) {
          const w = portMesh.geometry.parameters?.width || 0.4;
          const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(worldQuat);
          point.addScaledVector(rightDir, portOffsetAlongSlot(portIdx, w));
        }
        return { point, exitDir, isPort: true };
      }
      const rackFace = root.userData.rackRealFace;
      if (rackFace) {
        // A rack-level connection with no specific slot picked: exit from
        // the back-top edge -- the same face ports use -- instead of
        // straight up from the rack's dead-center, so it never reads as
        // cutting through the shelves inside.
        const worldQuat = root.getWorldQuaternion(new THREE.Quaternion());
        const exitDir = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat);
        const halfDepth = (rackFace.dims?.D || 0.9) / 2;
        const topY = root.position.y + (root.userData.heightM || DEVICE_HEIGHT_M) - 0.08;
        const point = new THREE.Vector3(root.position.x, topY, root.position.z).addScaledVector(exitDir, halfDepth);
        return { point, exitDir, isPort: false };
      }
      // No rack geometry at all (e.g. a cooling unit) -- exit near its own
      // base at floor height, not its top, so it feeds straight into the
      // under-floor plenum run below instead of dropping in from above.
      const baseY = root.position.y + 0.05;
      return { point: new THREE.Vector3(root.position.x, baseY, root.position.z), exitDir: new THREE.Vector3(0, -1, 0), isPort: false };
    };

    // ── Which way of its lane does each cable take? ──
    // Numbered per TYPE (not per layer), in the order the cables were drawn.
    // Counting per type is what keeps a fiber run off a network run: they
    // are different lanes to begin with, and each still gets way 0 rather
    // than being crowded into one shared numbering.
    const wayCounters = new Map();
    const wayIndexById = new Map();
    connectionsRef.current.forEach((conn) => {
      const t = conn.type || "power";
      const n = wayCounters.get(t) || 0;
      wayIndexById.set(conn.id, n);
      wayCounters.set(t, n + 1);
    });

    // ── Laid cables: where a tray / pipe run comes up into its device ──
    // The floor cut-out under the device's REAR face, slid `offset` metres
    // along its width. KEEP IN STEP with trayEntry() in idealDatacenterDemo.js
    // -- the tray waypoints were laid against exactly this point, which is
    // what lets the run drop straight down into its tray slot.
    const devById = new Map(devicesRef.current.map((d) => [d.id, d]));
    // `face` picks the cut-out under the REAR (default -- data) or the FRONT
    // (power and cold air, which come up on the cold-aisle side); `offset`
    // slides it along the device's width, `shift` is a final world {x, z}.
    const trayEntryPoint = (id, offset, face, shift) => {
      const { deviceId, slotId } = parseEndpointId(id);
      if (slotId) return resolveEndpointGeom(id);
      const root = rootById.get(deviceId);
      if (!root) return null;
      const ry = root.rotation.y;
      const depth = (devById.get(deviceId)?.dimensions?.widthMm || 600) / 1000;
      const back = Math.max(0, depth / 2 - TRAY_ENTRY_INSET);
      const s = face === "front" ? 1 : -1;
      const off = offset || 0;
      return {
        point: new THREE.Vector3(
          root.position.x + s * Math.sin(ry) * back + Math.cos(ry) * off + (shift?.x || 0),
          root.position.y + 0.05,
          root.position.z + s * Math.cos(ry) * back - Math.sin(ry) * off + (shift?.z || 0),
        ),
        exitDir: new THREE.Vector3(0, -1, 0),
        isPort: false,
      };
    };

    connectionsRef.current.forEach((conn) => {
      const layerKey = CABLE_LAYER_MAP[conn.type] || "power";
      const cfg = CABLE_TYPES[conn.type] || CABLE_TYPES.power;

      // ── Tray-laid cable or pipe: drawn exactly as laid ──
      // Straight down from the device's floor cut-out to the first waypoint's
      // level, then the waypoints (already sitting in this cable's own tray
      // slot), then straight up into the other device. No lanes, no stubs.
      const laid = (conn.route === "tray" || conn.route === "pipe") && conn.waypoints?.length > 0;
      let a, b, pts;
      if (laid) {
        a = trayEntryPoint(conn.fromId, conn.fromOffset, conn.fromFace, conn.fromShift);
        b = trayEntryPoint(conn.toId, conn.toOffset, conn.toFace, conn.toShift);
        if (!a || !b) return;
        const wps = conn.waypoints.map((w) => new THREE.Vector3(w.x, w.y, w.z));
        const first = wps[0], last = wps[wps.length - 1];
        const path = [
          a.point, new THREE.Vector3(a.point.x, first.y, a.point.z),
          ...wps,
          new THREE.Vector3(b.point.x, last.y, b.point.z), b.point,
        ];
        pts = path.filter((pt, i) => i === 0 || pt.distanceToSquared(path[i - 1]) > 1e-6);
      } else {
        a = resolveEndpointGeom(conn.fromId);
        b = resolveEndpointGeom(conn.toId);
        if (!a || !b) return;

        // This cable's own slot in space -- height, across, and along, each
        // covering the run angles the others can't (see CABLE_LANE_INDEX).
        const cabType = conn.type || "power";
        const wayIdx = wayIndexById.get(conn.id) ?? 0;

        // How steep is this run? 0 = flat, 1 = a straight drop. It decides how
        // much of the along-the-run offset is used -- see cableAlongOffset.
        const span = new THREE.Vector3().subVectors(b.point, a.point);
        const planLen = Math.hypot(span.x, span.z);
        const verticality = planLen + Math.abs(span.y) < 1e-6
          ? 1
          : Math.abs(span.y) / (planLen + Math.abs(span.y));

        const acrossOff = cableAcrossOffset(wayIdx);
        const alongOff = cableAlongOffset(cabType, verticality);

        const runDir = new THREE.Vector3(span.x, 0, span.z);
        if (runDir.lengthSq() < 1e-6) runDir.set(1, 0, 0);
        runDir.normalize();
        // Across the run, in plan. Perpendicular to the run at every angle, so
        // this one offset works whether the cable is crossing the floor or
        // dropping straight into a rack.
        const acrossDir = new THREE.Vector3(-runDir.z, 0, runDir.x);
        // A waypoint dropped at one of the three route levels is snapped back
        // to that exact level first, so a hand-drawn run and an auto-routed
        // one end up in the same containment before lanes are applied.
        const laneY = (y) => {
          const lvl = ROUTE_LEVELS.find((l) => Math.abs(l.y - y) < 0.5);
          if (!lvl) return y + cableLaneRank(cabType) * LEVEL_LANE_SHAPE.plenum.pitch;
          return cableLaneY(lvl.key, lvl.y, cabType, wayIdx);
        };
        const toLane = (p) =>
          new THREE.Vector3(p.x, laneY(p.y), p.z)
            .addScaledVector(acrossDir, acrossOff)
            .addScaledVector(runDir, alongOff);

        // ── The route is whatever the user drew ──
        // Cables are no longer auto-shaped. The path is the exact polygon of
        // waypoints that was clicked out, joined by straight runs: click a
        // corner, get a corner. Anything without waypoints (an older saved
        // cable) still gets a sensible plenum drop so nothing breaks, but
        // nothing invents bends any more.
        // The stub is the short lead straight out of the device before the
        // run proper begins. It carries the sideways lane offset as well, so
        // cables fan apart the moment they leave the device instead of
        // travelling glued together and only separating further down.
        const STUB = 0.14;
        const stubA = a.point.clone().addScaledVector(a.exitDir, STUB)
          .addScaledVector(acrossDir, acrossOff).addScaledVector(runDir, alongOff);
        const stubB = b.point.clone().addScaledVector(b.exitDir, STUB)
          .addScaledVector(acrossDir, acrossOff).addScaledVector(runDir, alongOff);

        const drawn = (conn.waypoints || []).map((w) => new THREE.Vector3(w.x, w.y, w.z));
        if (!drawn.length) {
          drawn.push(new THREE.Vector3(stubA.x, PLENUM_Y, stubA.z));
          drawn.push(new THREE.Vector3(stubB.x, PLENUM_Y, stubB.z));
        }
        // Every mid-run vertex is moved into this cable's own lane+way. The
        // shape the user clicked is preserved exactly -- the whole polyline is
        // simply carried to its tray, the way a real pull would be.
        const mids = drawn.map(toLane);

        const path = [a.point, stubA, ...mids, stubB, b.point];
        // Drop any duplicate points — a zero-length segment makes a degenerate
        // tube that renders as a black speck.
        pts = path.filter((pt, i) => i === 0 || pt.distanceToSquared(path[i - 1]) > 1e-6);
      }

      const mid = pts[Math.floor(pts.length / 2)].clone();
      const endpoints = [a.point, b.point];
      // Thin, patch-cable-scale radii -- port-to-port reads as an
      // individual lead; a whole-device connection stays a hair thicker
      // (a coarser feed/trunk) but nowhere near pipe-thick. A cable in a tray
      // is thinner still, so a full tray shows every run side by side; a
      // chilled-water pipe is drawn as the pipe it is.
      const radius = laid
        ? (conn.route === "pipe" ? PIPE_R : TRAY_CABLE_R)
        : (a.isPort && b.isPort ? 0.015 : 0.022);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: cfg.color, emissive: cfg.color,
        emissiveIntensity: 0.6,
        metalness: 0.3, roughness: 0.4,
      });
      tubeMat.userData.wireBaseColor = cfg.color;

      // One straight tube per segment, plus a bead at each vertex to fill the
      // mitre. A single TubeGeometry through the whole path would round every
      // corner off — which is precisely the auto-bending being removed.
      for (let i = 1; i < pts.length; i++) {
        const from = pts[i - 1], to = pts[i];
        const len = from.distanceTo(to);
        if (len < 1e-4) continue;
        // The shared unit cylinder, stretched to this run's length and
        // thickness. Modelling a fresh geometry per run is what made a
        // rebuild expensive; a scale is free.
        const seg = new THREE.Mesh(WIRE_RUN_GEO, tubeMat);
        seg.scale.set(radius, len, radius);
        seg.position.copy(from).lerp(to, 0.5);
        seg.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(to, from).normalize());
        seg.userData.wireId = conn.id;
        seg.userData.layer = layerKey;
        group.add(seg);
      }
      // A tray cable is thin enough that its corners need no bead -- which
      // also keeps a floor of several hundred laid runs cheap to draw.
      for (let i = 1; i < pts.length - 1 && !(laid && conn.route === "tray"); i++) {
        const elbow = new THREE.Mesh(WIRE_BEAD_GEO, tubeMat);
        elbow.scale.setScalar(radius);
        elbow.position.copy(pts[i]);
        elbow.userData.wireId = conn.id;
        elbow.userData.layer = layerKey;
        group.add(elbow);
      }

      // End nodes ride the cable's own material rather than owning one each.
      // That is not just an allocation saved: the severity and X-RAY passes
      // recolour a cable through its material, and a node on the same
      // material now changes with the run it terminates instead of having to
      // be found and changed separately.
      endpoints.forEach((p, i) => {
        const isPortEnd = i === 0 ? a.isPort : b.isPort;
        const node = new THREE.Mesh(WIRE_NODE_GEO, tubeMat);
        node.scale.setScalar(laid ? radius * 1.6 : (isPortEnd ? 0.018 : 0.026));
        node.position.copy(p);
        node.userData.wireId = conn.id;
        node.userData.layer = layerKey;
        group.add(node);
      });

      // A laid run is named by the tray it lies in (the tray nameplates),
      // not by a plate of its own: forty identical "COPPER" plates stacked
      // along one tray would bury the tray they are meant to explain.
      if (laid) return;

      // The plate itself is shared; the sprite material is not, because
      // X-RAY ghosts a cable by writing opacity onto its own materials.
      const tex = wireLabelTexture(cfg.label.toUpperCase(), cfg.color, LP, isDarkNow ? "d" : "l");
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      label.scale.set(0.95, 0.26, 1);
      label.position.copy(mid);
      label.position.y += 0.16;
      label.userData.wireId = conn.id;
      label.userData.layer = layerKey;
      label.userData.isLabel = true;
      group.add(label);
    });

    scene.add(group);
    group.visible = under; // cabling only shows while PLENUM reveals the raised floor
    group.traverse((obj) => {
      if (obj.userData?.layer) obj.visible = layersStateRef.current[obj.userData.layer] !== false;
    });
    // The trays the cables lie in come and go with them.
    const trayGroup = scene.getObjectByName("CableTrayGroup");
    if (trayGroup) trayGroup.visible = under;
    applyLabelVisibility();
    // Every cable above was just built from scratch with fresh materials, so
    // any X-RAY ghosting that was on the old ones is gone. This runs on every
    // PLENUM toggle (see the underFloor effect), which is exactly when a user
    // has X-RAY focused on a device and goes looking for its run under the
    // floor -- without this the cables all come back at full brightness.
    applyXrayFocus();
  }, [applyLabelVisibility, applyXrayFocus, ROUTE_LEVELS]);

  // ── One wiring rebuild per burst ───────────────────────────────────────
  // Every rack resolves its slot list asynchronously, and each resolution
  // used to call rebuildWiring() directly. On a floor of forty-odd cabinets
  // that meant forty-odd FULL wiring passes in a single microtask drain —
  // every cable on the floor torn down and rebuilt, forty times, before the
  // first frame was drawn. That is what made the devices take so long to
  // appear even though the room itself was up.
  //
  // They all want the same thing, so they now ask for it instead of doing
  // it: the first caller books a rebuild on the next frame and everyone
  // after it joins that booking.
  const wiringRebuildRafRef = useRef(0);
  const scheduleWiringRebuild = useCallback(() => {
    if (wiringRebuildRafRef.current) return;
    wiringRebuildRafRef.current = requestAnimationFrame(() => {
      wiringRebuildRafRef.current = 0;
      rebuildWiring();
    });
  }, [rebuildWiring]);
  useEffect(() => () => {
    if (wiringRebuildRafRef.current) cancelAnimationFrame(wiringRebuildRafRef.current);
  }, []);

  // Same idea for the STORAGE bands: forty-odd racks resolving their slot
  // lists in one burst ask for ONE repaint, and only while STORAGE is on
  // (turning it on reads the cached lists straight away).
  const storageRefreshRafRef = useRef(0);
  const scheduleStorageRefresh = useCallback(() => {
    if (!storageOnRef.current || storageRefreshRafRef.current) return;
    storageRefreshRafRef.current = requestAnimationFrame(() => {
      storageRefreshRafRef.current = 0;
      setStorageVersion((v) => v + 1);
    });
  }, []);
  useEffect(() => () => {
    if (storageRefreshRafRef.current) cancelAnimationFrame(storageRefreshRafRef.current);
  }, []);

  // ── NEW: rebuild the CFD-style thermal hotspot texture on the floor ─────
  // Heat sources = IT load (Compute/Storage/Power/Network racks, by their
  // metadata.power rating or a per-category default). Heat sinks = Cooling
  // units, at full strength unless the operator has failed them in
  // Simulate mode — that's the live "what happens if this CRAC goes down"
  // story the CFD render in the reference deck is used to answer.
  const rebuildHeatmap = useCallback(() => {
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    const group = scene?.getObjectByName("ThermalHeatmap");
    if (!scene || !dcGroup || !group) return;

    if (!hotspotOpenRef.current) {
      group.visible = false;
      return;
    }

    const oW = clampedLength + WALL_T * 2;
    const oL = clampedBreadth + WALL_T * 2;
    const RES = 128;
    const aspect = oW / oL;
    const resX = aspect >= 1 ? RES : Math.max(32, Math.round(RES * aspect));
    const resZ = aspect >= 1 ? Math.max(32, Math.round(RES / aspect)) : RES;

    // The heat map's origin matches the building's tile grid, so the tiles can
    // be handed over in world space.
    const hmOriginX = dcGroup.userData.gridOriginX ?? -oW / 2;
    const hmOriginZ = dcGroup.userData.gridOriginZ ?? -oL / 2;
    const perfWorld = perfTilesRef.current.map((t) => {
      const c = tileAnchorToWorldCenter(t.tx, t.tz, 1, 1, hmOriginX, hmOriginZ);
      return { x: c.x, z: c.z };
    });

    const result = computeHeatField(devicesRef.current, failures, oW, oL, resX, resZ, perfWorld);

    const plane = group.getObjectByName("ThermalHeatmapPlane");
    if (plane) {
      const oldTex = plane.material.map;
      plane.material.map = renderHeatFieldTexture(result);
      plane.material.needsUpdate = true;
      if (oldTex) oldTex.dispose();
    }
    group.visible = true;

    const hitRoom = roomRectsRef.current.find((r) =>
      Math.abs(result.peakX - r.cx) <= r.w / 2 && Math.abs(result.peakZ - r.cz) <= r.l / 2);

    // Per-room temperature — average + peak of the field cells that fall
    // inside each room (corridors skipped), so the panel can say how hot the
    // Server Room itself is, not just the whole building.
    const roomTemps = roomRectsRef.current
      .filter((r) => r.type !== "corridor")
      .map((r) => {
        let sum = 0, n = 0, pk = -Infinity;
        const x0 = r.cx - r.w / 2, x1 = r.cx + r.w / 2;
        const z0 = r.cz - r.l / 2, z1 = r.cz + r.l / 2;
        for (let pz = 0; pz < result.resZ; pz++) {
          const wz = -oL / 2 + ((pz + 0.5) / result.resZ) * oL;
          if (wz < z0 || wz > z1) continue;
          for (let px = 0; px < result.resX; px++) {
            const wx = -oW / 2 + ((px + 0.5) / result.resX) * oW;
            if (wx < x0 || wx > x1) continue;
            const v = result.field[pz * result.resX + px];
            sum += v; n++; if (v > pk) pk = v;
          }
        }
        return n ? { id: r.id, name: r.name, type: r.type, avgC: sum / n, peakC: pk } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.type === "server") - (a.type === "server") || b.avgC - a.avgC);

    const stats = {
      peakC: result.peakC,
      avgC: result.avgC,
      peakRoomName: hitRoom?.name || null,
      sourceCount: result.sourceCount,
      sinkCount: result.sinkCount,
      roomTemps,
    };
    setHotspotStats(stats);

    if (stats.peakC >= HOTSPOT_CRITICAL_C) {
      if (!hotspotWarnedRef.current) {
        hotspotWarnedRef.current = true;
        message.warning(
          `Thermal Monitoring: hotspot${stats.peakRoomName ? ` in ${stats.peakRoomName}` : ""} — peaking at ${stats.peakC.toFixed(1)}°C. Check cooling coverage nearby.`
        );
      }
    } else if (stats.peakC < HOTSPOT_WARN_C) {
      hotspotWarnedRef.current = false;
    }
  }, [clampedLength, clampedBreadth, failures]);

  useEffect(() => {
    const map = new Map();
    devices.forEach((d) => (d.occupiedTiles || []).forEach((k) => map.set(k, d.id)));
    occupiedTilesRef.current = map;
  }, [devices]);

  const renderDevicesIntoScene = useCallback((scene, devicesList) => {
    if (!scene) return;
    const devicesGroup = scene.getObjectByName("DevicesGroup");
    const dcGroup = scene.getObjectByName("DataCenter");
    if (!devicesGroup || !dcGroup) return;

    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const isDarkNow = scene.userData?.isDark ?? true;

    while (devicesGroup.children.length) {
      disposeGroup(devicesGroup.children[devicesGroup.children.length - 1]);
    }
    rackRuntimeRef.current = new Map();
    spinnersRef.current = [];

    // Racks that have a cable landing on one of their U-slots (see the
    // slot lookup below) -- worked out once, not once per rack.
    const racksWithSlotCables = new Set();
    connectionsRef.current.forEach((c) => {
      [c.fromId, c.toId].forEach((eid) => {
        const p = parseEndpointId(eid);
        if (p.slotId) racksWithSlotCables.add(p.deviceId);
      });
    });

    devicesList.forEach((dev) => {
      const native = getFootprintTiles({ length: dev.dimensions.lengthMm, width: dev.dimensions.widthMm });
      const group = createDeviceMesh(
        { name: dev.name, alias: dev.alias, category: dev.category, color: dev.color, seed: dev.id, shape: dev.shape },
        native.tilesX,
        native.tilesZ,
        { length: dev.dimensions.lengthMm, width: dev.dimensions.widthMm, height: dev.dimensions.heightMm },
        isDarkNow,
      );
      const center = tileAnchorToWorldCenter(dev.tileAnchor.tx, dev.tileAnchor.tz, dev.footprint.tilesX, dev.footprint.tilesZ, originX, originZ);
      // Roof-mounted plant (a chiller, say) carries `elevationM`: it stands
      // on a roof deck at that height instead of on the raised floor.
      const elevationM = Math.max(0, Number(dev.elevationM) || 0);
      group.position.set(center.x, FLOOR_Y + elevationM, center.z);
      if (elevationM > 0) group.add(createRoofDeck(group.userData.footprint, elevationM, isDarkNow));
      group.rotation.y = ((dev.rotation || 0) * Math.PI) / 180;
      group.userData.deviceId = dev.id;
      group.userData.rotationDeg = dev.rotation || 0;
      group.userData.layer = getDeviceLayerKey(dev.name, dev.category);
      // Every fan on this device, not just the first one — a chiller has a
      // whole deck of them. Collected here, once, so the frame loop never
      // has to search for them.
      const fans = [];
      group.traverse((o) => { if (o.userData?.spins) fans.push(o); });
      if (fans.length) spinnersRef.current.push({ deviceId: dev.id, fans });
      group.userData.role = deviceRole(dev);
      group.visible = layersStateRef.current[group.userData.layer] !== false;
      group.traverse((o) => {
        o.userData.deviceId = dev.id;
        // ── Devices cast no shadow ──
        // The body builders each set castShadow on their own meshes, which
        // put a hard shadow under every cabinet and panel. On a floor of
        // rack rows that reads as dirt rather than depth, and it doubles the
        // draw calls for those meshes (the shadow map re-renders every
        // caster each frame). The building shell still casts, so the
        // cut-away walls keep their shadow; only the equipment stops.
        o.castShadow = false;
      });
      if (pulseIdRef.current === dev.id) {
        group.scale.setScalar(0.85);
        group.userData.pulseStart = performance.now();
        pulseIdRef.current = null;
      }
      devicesGroup.add(group);

      // Real device-image faces load async (mock today, API later) so the
      // rack itself never blocks on it — it just pops in once resolved.
      if (group.userData.isRackBody) {
        const { bodies, rail, dims } = group.userData.rackRealFace;
        rackRuntimeRef.current.set(dev.id, { bodies, rail, dims });
        setRackRealFaceVisible(rail, false);     // RACK VIEW shows it (applyRackView)
        getRackSlotAssignments(dev.id, dims.totalUnitsU)
          .then((slots) => {
            populateRackRealFaces({
              bodies, rackId: dev.id,
              width: dims.W, depth: dims.D,
              totalHeightM: dims.H, totalUnitsU: dims.totalUnitsU,
              slots,
            });
            setRackRealFaceVisible(bodies, false);
            // STORAGE and RACK VIEW both read this rack's contents from here.
            rackSlotsRef.current.set(dev.id, slots || []);
            scheduleStorageRefresh();
            if (rackViewIdRef.current === dev.id) applyRackView();
            // Slot data resolves after the initial wiring pass above, so a
            // connection targeting a port on this rack needs another pass to
            // find it. Only if one actually does, though: a rack full of
            // slots with nothing cabled to them has nothing to be missed.
            if (slots?.length && racksWithSlotCables.has(dev.id)) scheduleWiringRebuild();
          })
          .catch((err) => console.error("[RACK VIEW] failed to load rack slot assignments for", dev.id, err));
      }
    });

    rebuildWiring();
    applyXrayFocus();
    applyLabelVisibility();
    applyRackView();
    markShadowsDirty();
  }, [rebuildWiring, scheduleWiringRebuild, scheduleStorageRefresh, applyXrayFocus, applyLabelVisibility, applyRackView, markShadowsDirty]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loading) return;
    renderDevicesIntoScene(scene, devices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, loading, renderDevicesIntoScene]);

  // Rebuilds the airflow loop from whatever is actually on the floor right
  // now. Cheap enough to throw away and redo whenever a device moves, which
  // is far simpler than trying to patch individual streams in place.
  const rebuildAirflow = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const dcGroup = scene.getObjectByName("DataCenter");
    if (!dcGroup) return;

    const prev = scene.getObjectByName("AirflowSystem");
    if (prev) { scene.remove(prev); disposeAirflowSystem(prev); }
    if (!airflowOnRef.current) return;

    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;

    const racks = [], coolers = [];
    devicesRef.current.forEach((d) => {
      const ry = ((d.rotation || 0) * Math.PI) / 180;
      const entry = {
        x: d.position.x, z: d.position.z, ry,
        // lengthMm runs across the face, widthMm front-to-back — the same
        // convention createDeviceMesh uses when it sizes the body.
        w: (d.dimensions?.lengthMm || 600) / 1000,
        d: (d.dimensions?.widthMm || 1000) / 1000,
        h: (d.dimensions?.heightMm || 2000) / 1000,
      };
      if (isRackDevice(d.name, d.category, d.shape)) racks.push(entry);
      else if (d.category === "Cooling") coolers.push(entry);
    });

    const tiles = perfTilesRef.current.map((t) => {
      const c = tileAnchorToWorldCenter(t.tx, t.tz, 1, 1, originX, originZ);
      return { x: c.x, z: c.z };
    });

    if (!racks.length && !tiles.length) return;

    // Every arrow is coloured from this, stop by stop along its own path —
    // which is what makes a plume read blue at the tile and red where it has
    // picked up rack heat, instead of being painted blue or red by rule.
    const sampleTempC = makeRoomTempSampler(devicesRef.current, failures, tiles, FLOOR_Y);

    const sys = createAirflowSystem({ racks, coolers, tiles, floorY: FLOOR_Y, plenumY: PLENUM_Y, sampleTempC });
    sys.userData.layer = "cooling";
    scene.add(sys);
    // `failures` is a real dependency now, not incidental: the arrows are
    // coloured from the thermal field, and failing a PAC unit changes that
    // field — so an aisle should visibly warm up the moment it loses its
    // cooling, without waiting for anything else to move.
  }, [failures]);

  useEffect(() => {
    if (loading) return;
    rebuildAirflow();
  }, [airflowOn, devices, perfTiles, loading, rebuildAirflow]);

  const renderPerfTilesIntoScene = useCallback((scene, list) => {
    if (!scene) return;
    const group = scene.getObjectByName("PerfTilesGroup");
    const dcGroup = scene.getObjectByName("DataCenter");
    if (!group || !dcGroup) return;

    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const isDarkNow = scene.userData?.isDark ?? true;

    while (group.children.length) {
      disposeGroup(group.children[group.children.length - 1]);
    }

    list.forEach((t) => {
      const tile = createSlattedTileMesh(TILE_SIZE_M, isDarkNow, isDarkNow ? 0x1e3a5f : 0xdbeafe, true);
      const c = tileAnchorToWorldCenter(t.tx, t.tz, 1, 1, originX, originZ);
      tile.position.set(c.x, RAISED_FLOOR_H / 2 + 0.002, c.z);
      tile.userData.perfTileId = t.id;
      tile.userData.perfRoomId = t.roomId;
      tile.userData.userTileRoot = tile;
      tile.traverse((o) => {
        o.userData.userTileRoot = tile;
        o.userData.perfTileId = t.id;
        o.userData.perfRoomId = t.roomId;
      });
      group.add(tile);
    });
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loading) return;
    renderPerfTilesIntoScene(scene, perfTiles);
  }, [perfTiles, loading, renderPerfTilesIntoScene]);
  // Freshly built perforated tiles pick up the CONNECTIVITY ghosting too.
  useEffect(() => {
    if (!loading) applyUnderFloorView();
  }, [perfTiles, loading, applyUnderFloorView]);

  // ── Under-floor cable trays ──
  // Rebuilt from cableTraysRef whenever the scene is (theme switch, floor
  // resize) and when the demo seeds them. Visible with the cabling only.
  const renderCableTraysIntoScene = useCallback((scene) => {
    if (!scene) return;
    const old = scene.getObjectByName("CableTrayGroup");
    if (old) disposeGroup(old);
    if (!cableTraysRef.current.length) return;
    const group = createCableTrayGroup(cableTraysRef.current, scene.userData?.isDark ?? true);
    group.visible = underFloorRef.current;
    group.traverse((o) => {
      if (o.userData?.layer) o.visible = layersStateRef.current[o.userData.layer] !== false;
    });
    scene.add(group);
    applyLabelVisibility();
  }, [applyLabelVisibility]);

  useEffect(() => {
    if (!rooms?.length) return;
    const live = new Set(rooms.map((r) => r.id));
    setPerfTiles((prev) => {
      const next = prev.filter((t) => t.roomId == null || live.has(t.roomId));
      return next.length === prev.length ? prev : next;
    });
  }, [rooms]);

  // ── Selection highlight ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const devicesGroup = scene.getObjectByName("DevicesGroup");
    if (!devicesGroup) return;
    devicesGroup.children.forEach((c) => {
      const ring = c.getObjectByName("SelectionRing");
      if (ring) disposeGroup(ring);
    });
    if (!selectedDeviceId) return;
    const target = devicesGroup.children.find((c) => c.userData.deviceId === selectedDeviceId);
    if (!target) return;
    const footprint = target.userData.footprint || { w: TILE_SIZE_M, d: TILE_SIZE_M };
    const ringGroup = new THREE.Group();
    ringGroup.name = "SelectionRing";
    const outlineGeo = new THREE.BoxGeometry(footprint.w + 0.06, 0.02, footprint.d + 0.06);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(outlineGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95, linewidth: 2 }),
    );
    outline.position.y = 0.09;
    ringGroup.add(outline);
    const corner = new THREE.RingGeometry(0.08, 0.13, 16);
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    [
      [footprint.w / 2, footprint.d / 2], [-footprint.w / 2, footprint.d / 2],
      [footprint.w / 2, -footprint.d / 2], [-footprint.w / 2, -footprint.d / 2],
    ].forEach(([cx, cz]) => {
      const m = new THREE.Mesh(corner, cornerMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx, 0.1, cz);
      ringGroup.add(m);
    });
    target.add(ringGroup);
  }, [selectedDeviceId, devices]);

  useEffect(() => { applyXrayFocus(); }, [circuit, xrayFocus, devices, connVersion, layers, applyXrayFocus]);
  useEffect(() => { applyLabelVisibility(); }, [labelsVisible, devices, rooms, connVersion, layers, loading, applyLabelVisibility]);

  useEffect(() => {
    if (loading) return;
    applyUnderFloorView();
    rebuildWiring();
  }, [underFloor, loading, devices, applyUnderFloorView, rebuildWiring]);


  useEffect(() => {
    if (loading) return;
    applyRackView();
    // cableHand / cordsVersion / portPickMode: picking a cable up, plugging
    // it in, or lighting up the ports all redraw the open rack.
  }, [rackViewId, loading, cableHand, cordsVersion, portPickMode, applyRackView]);
  // A different type picked for + NEW CABLE lights up different ports.
  useEffect(() => { if (!loading) refreshHandVisuals(); }, [newCableRole, loading, refreshHandVisuals]);

  // ── NEW: recompute the thermal hotspot field whenever the layout, the
  // IT/cooling roster, or the failure set changes — and whenever the panel
  // is opened (it's skipped while closed to avoid needless work). ──
  useEffect(() => {
    if (loading) return;
    rebuildHeatmap();
    // perfTiles is in the list because the tiles are now the room's actual
    // cooling delivery — add or move one and the map has to be redrawn.
  }, [devices, failures, rooms, perfTiles, hotspotOpen, loading, rebuildHeatmap]);

  // ═══════════════════════════════════════════════════════════════════════
  // FAILURE VISUALS — halos on unhealthy devices, red cables on dead runs.
  // Keyed on the severity fingerprint, so this does NOT run every sim tick.
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loading) return;
    const devicesGroup = scene.getObjectByName("DevicesGroup");
    if (!devicesGroup) return;

    statusHalosRef.current = [];
    devicesGroup.children.forEach((root) => {
      const old = root.getObjectByName("StatusHalo");
      if (old) disposeGroup(old);
      const ring = root.getObjectByName("ChainRing");
      if (ring) disposeGroup(ring);
    });

    const report = impactReportRef.current;
    if (!report) return;

    const simMode = modeRef.current === "simulate" || trackerOpenRef.current;
    // Once a failure is injected, healthy devices drop their chain ring: the
    // power ring is amber -- the same colour as a "degraded" halo -- so with
    // it on, a transformer three hops UPSTREAM of a failed PAC looked
    // impacted. During a failure only the devices it actually reaches glow.
    const failureActive = (report.counts?.failed || 0) > 0;
    const deviceById = new Map(devicesRef.current.map((d) => [d.id, d]));

    report.devices.forEach((state, id) => {
      // Healthy device: in Simulate mode it still gets its chain colour, so
      // the floor reads blue-for-network / yellow-for-power at a glance.
      if (state.severity === "ok") {
        if (!simMode || failureActive) return;
        const rootOk = devicesGroup.children.find((c) => c.userData.deviceId === id);
        const dev = deviceById.get(id);
        if (!rootOk || !dev) return;
        const chain = primaryChain(dev);
        if (chain === "other") return;   // doors, stairs, signage — leave them alone
        rootOk.add(createChainRing(
          rootOk.userData.footprint || { w: 0.6, d: 0.6 },
          CHAIN_COLORS[chain] ?? CHAIN_COLORS.other,
        ));
        return;
      }
      const root = devicesGroup.children.find((c) => c.userData.deviceId === id);
      if (!root) return;
      const colorNum = state.severity === "critical" ? 0xef4444 : 0xf59e0b;
      const halo = createStatusHalo(
        root.userData.footprint || { w: 0.6, d: 0.6 },
        root.userData.heightM || DEVICE_HEIGHT_M,
        colorNum,
      );
      root.add(halo);
      halo.traverse((o) => { if (o.userData?.pulse) statusHalosRef.current.push(o); });

      // The rack's own health LED and temperature strip follow the state too.
      const led = root.getObjectByName("HealthLed");
      if (led?.material) {
        led.material.color.setHex(colorNum);
        led.material.emissive?.setHex(colorNum);
      }
      const strip = root.getObjectByName("TempStrip");
      if (strip?.material) {
        strip.material.color.setHex(colorNum);
        strip.material.emissive?.setHex(colorNum);
      }
    });
  }, [severitySignature, devices, loading, layers, theme, mode, trackerOpen]);

  // ── Cables show the state of the service THEY carry ──
  // This used to paint any cable touching a non-ok device, using that
  // device's overall severity. Two things were wrong with that.
  //
  // 1. A device can be "degraded" for a reason that has nothing to do with
  //    the cable you are looking at. Fail a switch and a CRAC downstream of
  //    it is marked degraded -- isolated, it lost its management uplink --
  //    yet its chilled-water line was painted as faulty too. The CRAC is
  //    still powered and still cooling; only its data path is gone.
  // 2. The "degraded" tint was 0xf59e0b, which is EXACTLY the power cable's
  //    own colour. So a degraded cooling or network run turned amber and
  //    read as a power cable -- the layers appeared to merge.
  //
  // So a cable now asks a narrower question: is the service I carry still
  // flowing? A device that is off (failed outright, starved of power, or
  // thermally shut down) carries nothing on any cable. A device that has
  // only lost its uplink still carries power and coolant -- just not data.
  // And a faulted cable keeps its own hue instead of borrowing another
  // layer's, so what it is stays readable while it says it is in trouble.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const wiringGroup = scene.getObjectByName("WiringGroup");
    if (!wiringGroup) return;
    const states = impactReportRef.current?.devices;

    // What does this cable actually carry? Each of the three chains fails
    // independently, so a cable only reacts to its own.
    const chainOf = (type) =>
      type === "power" ? "power" : type === "cooling" ? "cool" : "data";

    const endpointState = (devId, chain) => {
      const st = states?.get(devId);
      if (!st || st.severity === "ok") return "ok";
      const kinds = new Set((st.causes || []).map((c) => c.kind));
      // Off at the device: no power in, or shut down. Nothing leaves it on
      // any cable, whatever that cable carries.
      if (kinds.has("direct") || kinds.has("power")) return "cut";
      if (kinds.has("thermal") && st.severity === "critical") return "cut";
      // Isolated: the data path is gone, power and coolant are not.
      if (kinds.has("network") && chain === "data") {
        return st.severity === "critical" ? "cut" : "weak";
      }
      // Cooling feed lost: the chilled-water run is the thing that stopped;
      // power and data are untouched.
      if (kinds.has("cooling") && chain === "cool") {
        return st.severity === "critical" ? "cut" : "weak";
      }
      // Thermal throttling -- slower, but still connected on every cable.
      return "ok";
    };

    const tint = new THREE.Color();
    // A cable is several meshes — runs, beads, end nodes — so this loop is a
    // few thousand objects long, and it used to answer "which connection is
    // this?" with a linear scan of the connection list for every one of
    // them. That is a million comparisons per pass, and this pass re-runs
    // whenever anything on the floor changes. One index, built once.
    const connById = new Map();
    connectionsRef.current.forEach((c) => connById.set(c.id, c));

    wiringGroup.children.forEach((o) => {
      if (!o.material || !o.userData.wireId) return;
      const conn = connById.get(o.userData.wireId);
      if (!conn) return;
      const base = o.material.userData?.wireBaseColor;
      if (base === undefined) return;

      const chain = chainOf(conn.type);
      const sa = endpointState(parentDeviceId(conn.fromId), chain);
      const sb = endpointState(parentDeviceId(conn.toId), chain);
      const cut = sa === "cut" || sb === "cut";
      const weak = sa === "weak" || sb === "weak";

      if (cut) {
        // Dead runs are the one case that overrides the cable's own colour:
        // red is not any cable type's colour, so it can't be mistaken for a
        // layer.
        o.material.color?.setHex(0xef4444);
        if (o.material.emissive) {
          o.material.emissive.setHex(0x7a1414);
          o.material.emissiveIntensity = 0.85;
        }
      } else if (weak) {
        // Impaired: keep the cable's own hue, drop it to a dull, unlit
        // version of itself. It still reads as "that layer", and it clearly
        // is not carrying.
        tint.setHex(base).multiplyScalar(0.42);
        o.material.color?.copy(tint);
        if (o.material.emissive) {
          o.material.emissive.copy(tint).multiplyScalar(0.5);
          o.material.emissiveIntensity = 0.25;
        }
      } else {
        o.material.color?.setHex(base);
        if (o.material.emissive) {
          o.material.emissive.setHex(base);
          o.material.emissiveIntensity = underFloorRef.current ? 0.6 : 0.35;
        }
      }
      // This effect owns a cable's colour and glow, so it has just written
      // over whatever X-RAY had ghosted. Clearing the flag says "these are
      // fresh values"; applyXrayFocus below then re-ghosts from them, rather
      // than restoring the stale ones it captured last time.
      o.material.userData.xrayGhosted = false;
      o.material.needsUpdate = true;
    });

    // Re-apply the focus on top of the colours just written. Without this,
    // anything that re-runs this effect -- toggling PLENUM, failing a device
    // -- would quietly un-ghost every cable on the floor.
    applyXrayFocus();
  }, [severitySignature, connVersion, devices, underFloor, theme, applyXrayFocus]);

  // ── IDEAL DEMO: seed the showcase floor once the grid exists ──
  // Runs only for the demo datacenter, only once, and only after the tile
  // grid is built (device positions are snapped to it). Everything it
  // creates is an ordinary device/connection/tile, so the demo floor can be
  // edited, cabled, failed and moved exactly like a hand-drawn one.
  // Seeds once. A scene rebuild (theme switch, floor resize) no longer
  // wipes the cabling, so there is nothing to restore afterwards -- see the
  // main scene effect for why connections now outlive the scene.
  const demoSeededRef = useRef(false);
  useEffect(() => {
    if (!dc?.isDemo || demoSeededRef.current || loading) return;
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    if (!dcGroup) return;
    // Something is already on this floor (a reopened session) -- leave it.
    if (devicesRef.current.length) { demoSeededRef.current = true; return; }

    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const built = buildIdealDemoScene({ originX, originZ });
    demoSeededRef.current = true;
    // What is inside every rack -- servers, network gear, RESERVED and FREE
    // U. Seeded before the devices land, so each rack's very first slot
    // lookup already finds them (a rack edited earlier keeps its edits).
    buildIdealDemoRackSlots(built.devices).forEach((slots, id) => seedRackSlotAssignments(id, slots));

    built.devices.forEach((d) => (d.occupiedTiles || []).forEach(
      (k) => occupiedTilesRef.current.set(k, d.id)));
    devicesRef.current = built.devices;
    setDevices(built.devices);
    setPerfTiles(built.perfTiles);
    connectionsRef.current = built.connections;
    bumpConnections();
    cableTraysRef.current = built.cableTrays || [];
    renderCableTraysIntoScene(scene);

    const info = describeIdealDemo(built);
    message.success({
      content: `Ideal datacenter loaded — ${info.devices} devices (${info.racks} racks), `
        + `${info.connections} cables across ${info.cableTypes.join(", ")}, `
        + `${info.perfTiles} perforated tiles. Drag a room's ENTRY / EXIT gate along its own walls. `
        + `Try RACK VIEW, CONNECTIVITY, THERMAL MONITORING, LAYERS, STORAGE and AIRFLOW.`,
      duration: 7,
    });
  }, [dc?.isDemo, loading, bumpConnections, renderCableTraysIntoScene]);

  // ── STORAGE: paint every rack by what is actually in it ──
  // Bands hang off the rack's own inner group, so they move, rotate and
  // hide with the cabinet. Racks whose slot list has not resolved yet read
  // as fully free, which is the truth for a rack nobody has filled.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loading) return;
    const devicesGroup = scene.getObjectByName("DevicesGroup");
    if (!devicesGroup) return;

    // Always clear first: toggling off, or any rebuild, starts from clean.
    const stale = [];
    devicesGroup.traverse((o) => { if (o.userData?.isRackStorageOverlay) stale.push(o); });
    stale.forEach(disposeRackStorageOverlay);

    if (!storageOn) {
      setStorageSummary(null);
      return;
    }

    const perRack = [];
    devicesGroup.children.forEach((root) => {
      if (!root.userData?.isRackBody && !root.userData?.rackInnerGroup) return;
      const inner = root.userData.rackInnerGroup;
      const dims = inner?.userData?.rackDims;
      if (!inner || !dims) return;

      const slots = rackSlotsRef.current.get(root.userData.deviceId) || [];
      const occupancy = computeRackOccupancy(slots, dims.totalUnitsU);
      perRack.push(occupancy);

      const overlay = createRackStorageOverlay(THREE, {
        width: dims.W, depth: dims.D, totalHeightM: dims.H, occupancy,
      });
      if (overlay) {
        overlay.userData.deviceId = root.userData.deviceId;
        inner.add(overlay);
      }
    });

    setStorageSummary(perRack.length ? summariseStorage(perRack) : null);
  }, [storageOn, storageVersion, devices, loading]);

  // ── Layer visibility ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.userData?.layer) {
        obj.visible = layers[obj.userData.layer] !== false;
      }
    });
    applyLabelVisibility();
  }, [layers, rooms, applyLabelVisibility]);

  useEffect(() => {
    const off = dcimBus.on("zoomRoom", (e) => {
      const scene = sceneRef.current;
      const orbit = orbitRef.current;
      if (!scene || !orbit) return;
      const roomGroup = scene.getObjectByName(`Room_${e.detail.id}`);
      if (!roomGroup) return;
      const { x, z } = roomGroup.userData.roomCenter || { x: 0, z: 0 };
      const { w, l, h } = roomGroup.userData.roomDims || { w: 20, l: 20, h: 8 };
      orbit.target.set(x, h / 2, z);
      orbit.sph.radius = Math.max(w, l) * 1.8;
      orbit.sph.phi = Math.PI / 3.2;
      orbit.update();
      setCamPreset("focus");
    });
    return off;
  }, []);

  // ── Main scene setup ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = () => {
      const W = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 800;
      const H = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 600;
      const T = THEMES[theme];
      const isDark = theme === "dark";

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(T.bg);
      scene.fog = new THREE.Fog(T.fog, 220, 520);
      scene.userData.isDark = isDark;
      sceneRef.current = scene;

      occupiedTilesRef.current = new Map();
      devicesRef.current.forEach((d) => (d.occupiedTiles || []).forEach((k) => occupiedTilesRef.current.set(k, d.id)));

      // ── Cables are DATA, and they outlive the scene ──
      // This effect re-runs whenever the scene has to be rebuilt: a theme
      // switch, a floor resize, a door move, a margin-colour change. It used
      // to wipe connectionsRef every single time, which meant toggling
      // DARK/LIGHT silently deleted every cable on the floor -- the devices
      // came back (they are re-rendered from devicesRef below) but nothing
      // was left to wire them together.
      //
      // Connections are exactly as much "data" as devices are: they name
      // device and slot ids, and those ids survive a rebuild untouched. So
      // they are only reset when the DATACENTER itself changes -- a
      // different floor genuinely has different cabling. Everything else
      // keeps its wiring and renderDevicesIntoScene() redraws it below.
      if (sceneDcIdRef.current !== dcIdentity) {
        sceneDcIdRef.current = dcIdentity;
        connectionsRef.current = [];
      }
      bumpConnections();
      setPendingConnectDevice(null);

      const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 600);
      const maxDim = Math.max(clampedLength, clampedBreadth);
      camera.position.set(maxDim * 0.8, maxDim * 0.6, maxDim * 1.2);
      cameraRef.current = camera;

      // No preserveDrawingBuffer: nothing in this view reads the canvas back
      // (no toDataURL / toBlob anywhere in this file), and keeping the
      // backbuffer alive costs a copy every frame on several drivers.
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if ("useLegacyLights" in renderer) renderer.useLegacyLights = false;
      rendererRef.current = renderer;

      const orbit = new SimpleOrbit(camera, renderer.domElement);
      orbit.target.set(0, FLOOR_Y, 0);
      orbit.minD = 1.5;
      orbit.maxD = 500;
      const viewRadius = Math.max(maxDim, 40) * 1.5;
      orbit.sph.radius = viewRadius;
      orbit.sph.phi = Math.PI / 3.5;
      orbit.sph.theta = Math.PI / 6;
      orbit.update();
      orbitRef.current = orbit;

      // ── Light rig ──────────────────────────────────────────────────────
      // Ambient + hemisphere alone give every face the same brightness, so a
      // grey cabinet and the grey wall behind it come out as one flat shape.
      // A key light from one shoulder and a weaker fill from the other is
      // what actually separates them: lit faces, shaded faces, and a cast
      // shadow anchoring each object to the floor.
      const lighting = new THREE.Group();
      lighting.name = "LightingSystem";
      lighting.add(new THREE.AmbientLight(0xffffff, T.ambientIntensity));
      lighting.add(new THREE.HemisphereLight(
        isDark ? 0xdfe8f5 : 0xffffff,
        isDark ? 0x8b96a8 : 0xc3cdd8,
        T.hemiIntensity,
      ));

      const keyLight = new THREE.DirectionalLight(
        isDark ? 0xdce8f8 : 0xfff6e8, T.keyIntensity ?? 0.85);
      keyLight.name = "KeyLight";
      keyLight.position.set(maxDim * 0.55, maxDim * 0.95, maxDim * 0.45);
      lighting.add(keyLight);

      const fillLight = new THREE.DirectionalLight(
        isDark ? 0x9fb4d0 : 0xdce8f5, T.fillIntensity ?? 0.3);
      fillLight.name = "FillLight";
      fillLight.position.set(-maxDim * 0.6, maxDim * 0.45, -maxDim * 0.5);
      lighting.add(fillLight);

      // Shadows are what sell the cut-away walls, but the shadow map has to
      // cover the whole floor in one texture — on a 200 m floor that is ~10 cm
      // per texel and the map gets re-rendered every frame. Past that size the
      // shadows stop being worth their cost, so only smaller floors get them
      // and everything else still reads correctly from the key/fill contrast.
      const SHADOW_MAX_SPAN_M = 90;
      if (maxDim <= SHADOW_MAX_SPAN_M) {
        renderer.shadowMap.enabled = true;
        // ...but NOT re-rendered every frame. A 2048² PCF-soft map is a whole
        // second render pass over every shadow caster on the floor, and it
        // was being paid on every single frame — including every frame of an
        // orbit, which is exactly when the budget is tightest. Nothing that
        // casts here moves on its own: the walls, piers, doors and gates are
        // static and the key light never swings. So the map is frozen and
        // re-taken only when something that casts actually changes, via
        // markShadowsDirty().
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        const span = Math.max(maxDim, 14) * 0.78;
        const sc = keyLight.shadow.camera;
        sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span;
        sc.near = 0.5; sc.far = maxDim * 2.6 + 40;
        sc.updateProjectionMatrix();
        keyLight.shadow.bias = -0.0009;
        keyLight.shadow.normalBias = 0.02;
      }

      scene.add(lighting);

      // Give the metals something to reflect (see createStudioEnvironment).
      const prevEnv = scene.environment;
      scene.environment = createStudioEnvironment(renderer, isDark);
      if (prevEnv) prevEnv.dispose();

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(800, 800),
        new THREE.MeshStandardMaterial({ color: T.ground, roughness: 1, side: THREE.DoubleSide }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = GROUND_Y;
      ground.receiveShadow = true;
      ground.name = "GroundPlane";
      scene.add(ground);

      const building = createOuterBuilding(clampedLength, clampedBreadth, dc?.dataCenterName, T, dc?.doorDirection || "South", dc?.doorPosition || "center");
      building.userData.layer = "building";
      scene.add(building);

      {
        // The door itself is built with the perimeter wall (createOuterBuilding).
        // What used to stand here was an outdoor approach — eight steps, two
        // blue ramps and four glass railings — which read as clutter hanging
        // off the gate. Only the tile reservation in front of the door is kept,
        // so the entrance clearance still can't be built on.
        const doorDirection = dc?.doorDirection || "South";
        const doorPosition = dc?.doorPosition || "center";
        const oW = clampedLength + WALL_T * 2;
        const oL = clampedBreadth + WALL_T * 2;

        gateTileKeysRef.current = computeGateTileKeys(building, doorDirection, doorPosition, oW, oL);
        perforatedTileKeysRef.current = new Set(perfTilesRef.current.map((t) => `${t.tx},${t.tz}`));
        rebuildReservedTiles();
      }

      updateRoomsInScene(scene, rooms, clampedLength, clampedBreadth, isDark, roomGatesRef.current);
      // The gates live in their own top-level group, so a full scene rebuild
      // (theme flip, floor resize, a new entrance) drops them along with
      // everything else — put them straight back.
      rebuildGates(scene, roomGatesRef.current, roomRectsRef.current, isDark);

      const devicesGroup = new THREE.Group();
      devicesGroup.name = "DevicesGroup";
      scene.add(devicesGroup);

      const wiringGroup = new THREE.Group();
      wiringGroup.name = "WiringGroup";
      scene.add(wiringGroup);

      const perfTilesGroup = new THREE.Group();
      perfTilesGroup.name = "PerfTilesGroup";
      scene.add(perfTilesGroup);

      // Thermal Monitoring plane — a CFD-style heat map laid over the
      // raised floor. Built hidden; rebuildHeatmap() below fills it in and
      // only reveals it once the THERMAL MONITORING toggle is on.
      const heatmapGroup = createThermalHeatmapGroup(clampedLength + WALL_T * 2, clampedBreadth + WALL_T * 2);
      scene.add(heatmapGroup);

      renderDevicesIntoScene(scene, devicesRef.current);
      renderPerfTilesIntoScene(scene, perfTilesRef.current);
      renderCableTraysIntoScene(scene);
      applyUnderFloorView();
      applyLabelVisibility();
      rebuildHeatmap();
      // Rebuilt (a theme flip) while RACK VIEW is open: the new camera keeps
      // looking at the same rack.
      if (rackViewIdRef.current) frameRackView(rackViewIdRef.current, rackViewFaceRef.current);

      function onResize() {
        const rw = canvas.offsetWidth, rh = canvas.offsetHeight;
        if (rw > 0 && rh > 0) {
          camera.aspect = rw / rh;
          camera.updateProjectionMatrix();
          renderer.setSize(rw, rh);
        }
      }
      window.addEventListener("resize", onResize);
      let ro = null;
      if (typeof ResizeObserver !== "undefined" && stageRef.current) {
        ro = new ResizeObserver(() => onResize());
        ro.observe(stageRef.current);
      }

      // ── Adaptive resolution ──────────────────────────────────────────
      // On a retina panel the GPU shades 4x the pixels of the CSS size, and
      // a floor packed with cabinets is where that stops being affordable.
      // So when the renderer is struggling it gives back RETINA headroom --
      // and only that.
      //
      // Two rules make this safe, and the first version of it broke both:
      //
      // 1. NEVER render below one device pixel per CSS pixel. Going under
      //    1.0 means upscaling a smaller buffer, which is visible as blur on
      //    every display and is simply not worth any frame rate. On a
      //    non-retina screen MAX and MIN are therefore both 1.0 and this
      //    whole mechanism does nothing at all -- which is correct, because
      //    there is no headroom there to give back in the first place.
      //
      // 2. Judge by how long OUR OWN work takes, not by the gap between
      //    frames. rAF is vsync-locked, so on a 60 Hz screen the gap can
      //    never average below 16.7 ms no matter how fast the scene is. The
      //    first version stepped down above 26 ms and only climbed back
      //    below 14 ms -- a threshold vsync makes unreachable -- so one
      //    hitch dropped the resolution permanently and nothing could ever
      //    restore it. Measuring the work itself has no such ceiling.
      const MAX_PR = Math.min(window.devicePixelRatio || 1, 2);
      const MIN_PR = 1;                      // the sharpness floor, never crossed
      // ...and there has to be enough headroom for the trade to be worth it.
      // A 1.25x screen only carries ~56% more pixels than native, so giving
      // that back buys little frame rate while still being just visible as a
      // softening. Only a genuinely dense panel (1.5x and up, where native
      // is 2.25x the pixels or more) has enough to spare. Below that the
      // controller is inert and the view renders at full resolution, always.
      const PR_ADAPT_MIN_DPR = 1.5;
      const canAdapt = MAX_PR >= PR_ADAPT_MIN_DPR;
      let curPR = MAX_PR;
      let workAvg = 4;                       // ms of CPU work per frame
      let prCooldown = 0;
      // ── ...but CPU work is only half the story ─────────────────────────
      // renderer.render() returns as soon as the GL commands are queued; the
      // GPU does the work afterwards. So on a scene that is GPU-bound —
      // which a retina canvas with MSAA very easily is — workAvg reads low
      // and happy while the view is visibly crawling, and the controller
      // never steps in. What DOES reflect the GPU is the interval the
      // browser actually delivers frames at, because rAF cannot outrun
      // presentation.
      //
      // The reason the first version abandoned that signal was vsync: on a
      // 60 Hz panel the gap can never average under 16.7 ms, so any fixed
      // "fast enough" threshold below that is unreachable. The way round it
      // is to stop using a fixed number and compare against the display's
      // OWN period, learned as the shortest interval it keeps producing —
      // clamped to the range real panels live in so a permanently slow scene
      // can never talk the controller into believing 30 ms is normal.
      let frameAvg = 16.7;
      let refreshMs = 16.7;
      const REFRESH_MIN = 6, REFRESH_MAX = 17;
      const applyPR = (next) => {
        const clamped = Math.max(MIN_PR, Math.min(MAX_PR, next));
        if (Math.abs(clamped - curPR) < 0.02) return;
        curPR = clamped;
        renderer.setPixelRatio(curPR);
        prCooldown = 90;   // frames to settle before judging again
      };

      let lastT = performance.now();
      let perfLogAcc = 0, perfLogFrames = 0;
      function animate() {
        animRef.current = requestAnimationFrame(animate);
        const now = performance.now();
        const frameMs = now - lastT;
        const dt = Math.min(0.05, frameMs / 1000);
        lastT = now;

        // Resolution is judged from workAvg, measured at the bottom of this
        // function. Nothing to do here when there is no retina headroom.
        if (canAdapt) {
          if (prCooldown > 0) {
            prCooldown--;
          } else if ((workAvg > 13 || frameAvg > refreshMs * 1.55) && curPR > MIN_PR) {
            // Either we are eating the CPU budget, or frames are simply not
            // arriving on time — GPU-bound, and pixels are the thing to give
            // back.
            applyPR(curPR - 0.5);
          } else if (workAvg < 6 && frameAvg < refreshMs * 1.15 && curPR < MAX_PR) {
            applyPR(curPR + 0.5);         // keeping pace with room to spare
          }
        }

        // Pedestal legs are part of the under-floor view only: show them
        // while PLENUM is on AND the camera has actually dropped below the
        // raised floor. Looking down from above, they'd just be a forest of
        // posts standing in the room.
        const pedestalsNow = scene
          .getObjectByName("DataCenter")?.getObjectByName("FloorSystem")
          ?.getObjectByName("PlenumPedestals");
        if (pedestalsNow) {
          pedestalsNow.visible = underFloorRef.current && camera.position.y < FLOOR_Y;
        }

        // Airflow is animated by walking each block arrow up its own short
        // curve and repainting it from that curve's temperature lookup — a
        // position, a quaternion and a colour per arrow, no geometry work.
        updateAirflowSystem(scene.getObjectByName("AirflowSystem"), dt);

        // The ceiling is only ever drawn when the camera is actually inside
        // the room looking across it. Left on from a top-down view it would
        // be a lid over the entire floor plan and hide everything below.
        const ceilingNow = scene.getObjectByName("DataCenter")?.getObjectByName("CeilingSystem");
        if (ceilingNow) {
          const ceilY = ceilingNow.userData.ceilingY ?? (FLOOR_Y + CEILING_H);
          ceilingNow.visible = ceilingOnRef.current && camera.position.y < ceilY + 1.2;
        }

        const selId = selectedDeviceIdRef.current;
        const devicesGroupNow = scene.getObjectByName("DevicesGroup");
        // Ease each breaker/MCB lever toward its target angle. Snapping it
        // would read as a glitch; a short throw reads as a switch being
        // operated, which is the whole point of making them switchable.
        devicesGroupNow?.children.forEach((c) => {
          if (!c.userData.switchLever) return;
          const closed = switchStatesRef.current[c.userData.deviceId] !== false;
          const target = closed ? 0 : (c.userData.switchable === "mccb" ? -0.62 : -0.75);
          const lever = c.userData.switchLever;
          lever.rotation.x += (target - lever.rotation.x) * Math.min(1, dt * 14);
        });

        const selRoot = selId ? devicesGroupNow?.children.find((c) => c.userData.deviceId === selId) : null;
        if (selRoot && (infoPanelElRef.current || actionBarElRef.current)) {
          const vec = new THREE.Vector3(
            selRoot.position.x,
            selRoot.position.y + (selRoot.userData.heightM || DEVICE_HEIGHT_M) + 0.9,
            selRoot.position.z,
          );
          vec.project(camera);
          const rect = canvas.getBoundingClientRect();
          const sx = (vec.x * 0.5 + 0.5) * rect.width;
          const sy = (-vec.y * 0.5 + 0.5) * rect.height;
          const onScreen = vec.z < 1 && sx > -80 && sx < rect.width + 80 && sy > -80 && sy < rect.height + 80;
          [infoPanelElRef.current, actionBarElRef.current].forEach((el) => {
            if (!el) return;
            el.style.display = onScreen ? "flex" : "none";
            el.style.left = `${sx}px`;
            el.style.top = `${sy}px`;
          });
        } else {
          if (infoPanelElRef.current) infoPanelElRef.current.style.display = "none";
          if (actionBarElRef.current) actionBarElRef.current.style.display = "none";
        }

        devicesGroupNow?.children.forEach((c) => {
          if (!c.userData.pulseStart) return;
          const t = Math.min(1, (now - c.userData.pulseStart) / 220);
          const eased = 1 - Math.pow(1 - t, 3);
          c.scale.setScalar(0.85 + 0.15 * eased);
          if (t >= 1) delete c.userData.pulseStart;
        });

        // ── Failure halos breathe so a dead device is unmissable ──
        const halos = statusHalosRef.current;
        if (halos.length) {
          const p = 0.5 + 0.5 * Math.sin(now / 210);
          for (let i = 0; i < halos.length; i++) {
            const h = halos[i];
            if (!h.material) continue;
            h.material.opacity = (h.userData.baseOpacity || 0.4) * (0.45 + 0.55 * p);
          }
        }

        // ── Cooling fans spin only while their unit is healthy ──
        // Walks the pre-resolved list, so a chiller turns all of its fans and
        // the loop costs one iteration per fan instead of a subtree search
        // per device.
        const states = impactReportRef.current?.devices;
        const spinners = spinnersRef.current;
        for (let i = 0; i < spinners.length; i++) {
          const s = spinners[i];
          const sev = states?.get(s.deviceId)?.severity;
          if (sev === "critical") continue;
          const step = dt * (sev === "degraded" ? 1.4 : 5.2);
          for (let f = 0; f < s.fans.length; f++) s.fans[f].rotation.y += step;
        }

        // ── RACK VIEW: draw only the isolated rack and the floor under it ──
        // Done with the camera's render layer, not by hiding things, so no
        // other feature's show/hide state is ever touched: leaving RACK VIEW
        // is just the camera going back to layer 0. Tagged every frame (a few
        // hundred objects) so anything rebuilt meanwhile is picked up too.
        const rvId = rackViewIdRef.current;
        if (rvId) {
          const top = scene.children;
          for (let i = 0; i < top.length; i++) {
            const o = top[i];
            if (o.name === "LightingSystem" || o.name === "GroundPlane" || o.name === "PerfTilesGroup") {
              tagRackViewLayer(o);
            } else if (o.name === "DataCenter") {
              o.children.forEach((c) => {
                if (c.name === "FloorSystem" || c.userData?.layer === "grid") tagRackViewLayer(c);
              });
            }
          }
          const rvRoot = devicesGroupNow?.children.find((c) => c.userData.deviceId === rvId) || null;
          // Switched racks: the one we were looking at goes back to layer 0
          // only, or it would stay on screen next to the new one.
          const prevRoot = rackViewTaggedRootRef.current;
          if (prevRoot && prevRoot !== rvRoot) prevRoot.traverse((o) => o.layers.disable(RACK_VIEW_LAYER));
          rackViewTaggedRootRef.current = rvRoot;
          tagRackViewLayer(rvRoot);
          if (camera.layers.mask !== (1 << RACK_VIEW_LAYER)) camera.layers.set(RACK_VIEW_LAYER);
        } else if (camera.layers.mask !== 1) {
          camera.layers.set(0);
        }

        // The shadow map is frozen (see shadowMap.autoUpdate above); this is
        // the only thing that ever re-takes it.
        if (shadowDirtyRef.current > 0) {
          shadowDirtyRef.current--;
          renderer.shadowMap.needsUpdate = true;
        }

        renderer.render(scene, camera);

        // How long this frame actually cost us, start to finish. Unlike the
        // gap between frames, this is not clamped by vsync, so it stays a
        // true reading whether the display runs at 60 Hz or 144. The rolling
        // average means one hitch -- a device being placed, a panel opening,
        // the demo floor seeding itself -- can never move it on its own.
        const workMs = performance.now() - now;
        if (workMs < 500) workAvg += (workMs - workAvg) * 0.05;
        if (frameMs > 0 && frameMs < 500) {
          frameAvg += (frameMs - frameAvg) * 0.05;
          // A decaying minimum: snaps down to any faster frame, creeps back
          // up very slowly, and is fenced into the range real panels use.
          refreshMs = Math.min(REFRESH_MAX, Math.max(REFRESH_MIN,
            frameMs < refreshMs ? frameMs : refreshMs + (frameMs - refreshMs) * 0.0004));
        }

        // ── Set window.__DC_PERF = true in the console to see where the
        //    frame is actually going. Off by default and free when off.
        if (window.__DC_PERF) {
          perfLogAcc += frameMs;
          perfLogFrames++;
          if (perfLogAcc >= 1000) {
            const info = renderer.info.render;
            console.log(
              `[DC perf] ${Math.round(1000 / (perfLogAcc / perfLogFrames))} fps`
              + ` | frame ${frameAvg.toFixed(1)}ms (cpu ${workAvg.toFixed(1)}ms, panel ~${refreshMs.toFixed(1)}ms)`
              + ` | pixelRatio ${curPR}`
              + ` | draws ${info.calls} tris ${(info.triangles / 1000).toFixed(0)}k`
              + ` | objects ${scene.children.length} top-level`,
            );
            perfLogAcc = 0; perfLogFrames = 0;
          }
        }
      }
      animate();
      setTimeout(() => setLoading(false), 600);

      return () => {
        cancelAnimationFrame(animRef.current);
        window.removeEventListener("resize", onResize);
        ro?.disconnect();
        orbit.dispose();
        renderer.dispose();
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
        sceneRef.current = null;
        cameraRef.current = null;
      };
    };

    const rafId = requestAnimationFrame(() => {
      const cleanup = init();
      canvasRef.current._cleanup = cleanup;
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (canvasRef.current?._cleanup) canvasRef.current._cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dc?.id, clampedLength, clampedBreadth, theme, dc?.doorDirection, dc?.doorPosition, dc?.margins?.color]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loading) return;
    // roomGates is a dependency because a gate is a hole in a wall: move one
    // and the wall it came out of has to be re-cut.
    updateRoomsInScene(scene, rooms, clampedLength, clampedBreadth, theme === "dark", roomGates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, roomGates, updateRoomsInScene]);

  // ── Gates: keep one entry and one exit per room ────────────────────────
  // Rooms appear, get renamed, get deleted; this reconciles the gate list
  // against whatever rooms currently exist without disturbing the position
  // of a gate the user has already moved. Corridors are skipped — a walkway
  // is the circulation, it is not something you gate.
  useEffect(() => {
    const gateable = roomRects.filter((r) => r.type !== "corridor");
    setRoomGates((prev) => {
      const live = new Set(gateable.map((r) => r.id));
      const kept = prev.filter((g) => live.has(g.roomId));
      const have = new Set(kept.map((g) => `${g.roomId}|${g.kind}`));
      const added = [];
      gateable.forEach((r) => {
        // Defaults put the entry on the south wall and the exit on the
        // north, offset from each other so neither hides behind the room's
        // own nameplate. Both are draggable from there.
        if (!have.has(`${r.id}|entry`)) {
          added.push({ id: `gate_${r.id}_entry`, roomId: r.id, kind: "entry", side: "S", t: 0.3 });
        }
        if (!have.has(`${r.id}|exit`)) {
          added.push({ id: `gate_${r.id}_exit`, roomId: r.id, kind: "exit", side: "N", t: 0.7 });
        }
      });
      if (!added.length && kept.length === prev.length) return prev;
      return [...kept, ...added];
    });
  }, [roomRects]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loading) return;
    rebuildGates(scene, roomGates, roomRects, theme === "dark");
    applyLabelVisibility();
  }, [roomGates, roomRects, theme, loading, rebuildGates, applyLabelVisibility]);

  // ── Camera presets ──────────────────────────────────────────────────────
  const resetView = () => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const maxDim = Math.max(clampedLength, clampedBreadth);
    orbit.target.set(0, FLOOR_Y, 0);
    orbit.sph.radius = Math.max(maxDim * 1.5, 40);
    orbit.sph.phi = Math.PI / 3.5;
    orbit.sph.theta = Math.PI / 6;
    orbit.update();
    setCamPreset("iso");
  };

  const bottomView = () => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const maxDim = Math.max(clampedLength, clampedBreadth);
    orbit.target.set(0, FLOOR_Y, 0);
    orbit.sph.radius = Math.max(maxDim * 1.5, 40);
    orbit.sph.phi = Math.PI - Math.PI / 3.5;
    orbit.sph.theta = Math.PI / 6;
    orbit.update();
    setCamPreset("under");
  };

  const topView = () => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const maxDim = Math.max(clampedLength, clampedBreadth);
    orbit.target.set(0, FLOOR_Y, 0);
    orbit.sph.radius = Math.max(maxDim * 1.3, 30);
    orbit.sph.phi = 0.05;
    orbit.sph.theta = 0;
    orbit.update();
    setCamPreset("top");
  };

  const focusSelected = () => {
    const orbit = orbitRef.current;
    const scene = sceneRef.current;
    const id = selectedDeviceIdRef.current;
    if (!orbit || !scene || !id) return;
    const root = scene.getObjectByName("DevicesGroup")?.children.find((c) => c.userData.deviceId === id);
    if (!root) return;
    orbit.target.set(root.position.x, root.position.y + (root.userData.heightM || DEVICE_HEIGHT_M) / 2, root.position.z);
    orbit.sph.radius = 6;
    orbit.sph.phi = Math.PI / 3.4;
    orbit.update();
    setCamPreset("focus");
  };

  const focusDeviceById = useCallback((id) => {
    setSelectedDeviceId(id);
    const orbit = orbitRef.current;
    const scene = sceneRef.current;
    if (!orbit || !scene) return;
    const root = scene.getObjectByName("DevicesGroup")?.children.find((c) => c.userData.deviceId === id);
    if (!root) return;
    orbit.target.set(root.position.x, root.position.y + (root.userData.heightM || DEVICE_HEIGHT_M) / 2, root.position.z);
    orbit.sph.radius = 7;
    orbit.sph.phi = Math.PI / 3.4;
    orbit.update();
    setCamPreset("focus");
  }, []);

  // ── RACK VIEW: open / switch / close ────────────────────────────────────
  const camPresetRef = useRef("iso");
  useEffect(() => { camPresetRef.current = camPreset; }, [camPreset]);

  const frameRackView = useCallback((id, face = "rear34") => {
    const orbit = orbitRef.current;
    const root = sceneRef.current?.getObjectByName("DevicesGroup")?.children
      .find((c) => c.userData.deviceId === id);
    if (!orbit || !root) return;
    const v = RACK_VIEW_CAMS[face] || RACK_VIEW_CAMS.rear34;
    const h = root.userData.heightM || DEVICE_HEIGHT_M;
    // Aimed a little above the middle, so the top of the rack (where the
    // cabling fans into the panels) clears the toolbar along the top.
    orbit.target.set(root.position.x, root.position.y + h * 0.56, root.position.z);
    orbit.sph.theta = root.rotation.y + v.dTheta;
    orbit.sph.phi = v.phi;
    orbit.sph.radius = v.radius;
    orbit.update();
    setCamPreset("rack");
    rackViewFaceRef.current = face;
    setRackViewFace(face);
  }, []);

  const openRackView = useCallback((id, face) => {
    if (!id) return;
    const orbit = orbitRef.current;
    // Remember where the camera was, once, so leaving puts it back.
    if (!rackViewIdRef.current && orbit) {
      rackViewCamRef.current = {
        target: orbit.target.clone(),
        radius: orbit.sph.radius, phi: orbit.sph.phi, theta: orbit.sph.theta,
        preset: camPresetRef.current,
      };
    }
    rackViewIdRef.current = id;
    setRackViewId(id);
    moveArmedRef.current = false;
    // A port the pointer was on belonged to the rack just left.
    handHoverPortRef.current = null;
    setHandHoverLabel(null);
    // The floor-wide overlays have nothing to show on one rack: X-RAY would
    // ghost this very rack, CONNECTIVITY lifts the floor out from under it,
    // THERMAL / AIRFLOW paint a floor that is not on screen. Turning any of
    // them back on leaves RACK VIEW (see below).
    setXrayFocus(false);
    setUnderFloor(false);
    setHotspotOpen(false);
    setAirflowOn(false);
    // Carrying a cable: the ports are at the back, so look at the back.
    const carrying = !!cableHandRef.current || portPickModeRef.current;
    frameRackView(id, face || (carrying && rackViewFaceRef.current === "front" ? "rear34" : rackViewFaceRef.current));
  }, [frameRackView]);

  const closeRackView = useCallback(() => {
    if (!rackViewIdRef.current) return;
    // Leaving with a cable in hand puts it back where it was.
    setCableHand(null);
    setPortPickMode(false);
    setCableNote(null);
    rackViewIdRef.current = null;
    setRackViewId(null);
    const saved = rackViewCamRef.current;
    const orbit = orbitRef.current;
    if (saved && orbit) {
      orbit.target.copy(saved.target);
      orbit.sph.radius = saved.radius;
      orbit.sph.phi = saved.phi;
      orbit.sph.theta = saved.theta;
      orbit.update();
      setCamPreset(saved.preset || "iso");
    }
    rackViewCamRef.current = null;
  }, [setCableHand, setPortPickMode]);

  const toggleRackView = useCallback(() => {
    if (rackViewIdRef.current) { closeRackView(); return; }
    const racks = devicesRef.current.filter((d) => isRackDevice(d.name, d.category, d.shape));
    if (!racks.length) {
      message.info("RACK VIEW opens one rack at a time — place a rack first.");
      return;
    }
    // The selected rack if there is one, else the first server rack.
    const sel = selectedDeviceIdRef.current;
    const pick = racks.find((d) => d.id === sel) || racks.find((d) => d.shape === "rack") || racks[0];
    openRackView(pick.id);
  }, [openRackView, closeRackView]);

  const rackViewRacks = useMemo(
    () => devices.filter((d) => isRackDevice(d.name, d.category, d.shape)),
    [devices],
  );

  // The rack being looked at was deleted (or the floor changed): leave.
  useEffect(() => {
    if (rackViewId && !devices.some((d) => d.id === rackViewId)) closeRackView();
  }, [devices, rackViewId, closeRackView]);

  // A floor-wide overlay switched on from the toolbar means "show me the
  // floor again" -- so RACK VIEW steps back and the overlay appears.
  useEffect(() => {
    if ((xrayFocus || underFloor || hotspotOpen || airflowOn) && rackViewIdRef.current) closeRackView();
  }, [xrayFocus, underFloor, hotspotOpen, airflowOn, closeRackView]);

  // ═══════════════════════════════════════════════════════════════════════
  // RACK VIEW CABLING — take a cable in hand, plug it in somewhere else (in
  // this rack, another rack, or another device), unplug it, or run a new
  // one. Long-press is the gesture for "take hold of".
  // ═══════════════════════════════════════════════════════════════════════

  // A cord whose two ends are in different racks / devices is a real cable
  // on the floor too: it gets (or loses) a matching connection, so it shows
  // in CONNECTIVITY, X-RAY and the failure simulation like any other run.
  const syncCordConnection = useCallback((cordId) => {
    const cord = patchCordStore.get(cordId);
    const devOf = (e) => (e ? (e.deviceId || e.rackId || null) : null);
    const exists = (id) => devicesRef.current.some((d) => d.id === id);
    const da = devOf(cord?.a), db = devOf(cord?.b);
    const wanted = !!cord && roleMedium(cord.role) !== "power"
      && !!da && !!db && da !== db && exists(da) && exists(db);
    const list = connectionsRef.current;
    const idx = list.findIndex((c) => c.patchCordId === cordId);
    if (wanted) {
      const conn = {
        id: idx >= 0 ? list[idx].id : `pc-${cordId}`,
        fromId: da, toId: db,
        type: roleMedium(cord.role) === "fibre" ? "fiber" : "copper",
        waypoints: [],
        patchCordId: cordId,
      };
      connectionsRef.current = idx >= 0 ? list.map((c, i) => (i === idx ? conn : c)) : [...list, conn];
    } else if (idx >= 0) {
      connectionsRef.current = list.filter((c) => c.patchCordId !== cordId);
    } else {
      return false;
    }
    bumpConnections();
    rebuildWiring();
    return true;
  }, [bumpConnections, rebuildWiring]);
  useEffect(() => { syncCordConnectionRef.current = syncCordConnection; }, [syncCordConnection]);

  const takeHold = useCallback((hand) => {
    setPortPickMode(false);
    handHoverPortRef.current = null;
    setHandHoverLabel(null);
    setCableNote(null);
    setCableHand(hand);
  }, [setCableHand, setPortPickMode]);

  const pickUpCord = useCallback((cordId, moving) => {
    const cord = patchCordStore.get(cordId);
    if (!cord) return;
    takeHold({ cordId, role: cord.role, moving, fixed: cord[moving === "a" ? "b" : "a"] || null, isNew: false });
  }, [takeHold]);

  // A new cable from a free port: the type picked for + NEW CABLE, or (for a
  // long-press) what that port is usually cabled with. An outlet decides it.
  const startNewCable = useCallback((port, chosenRole = null) => {
    const rackId = rackViewIdRef.current;
    if (!rackId || !port) return;
    let role = chosenRole && canPlugInto(chosenRole, port) ? chosenRole
      : port.kind === "psu" ? (port.side > 0 ? "powerA" : "powerB") : port.role;
    if (port.kind === "outlet") role = port.feed === "A" ? "powerA" : "powerB";
    takeHold({ cordId: null, role, moving: "b", fixed: { rackId, portId: port.id }, isNew: true });
  }, [takeHold]);

  const finishHand = useCallback(() => {
    handHoverPortRef.current = null;
    setHandHoverLabel(null);
    setCableHand(null);
  }, [setCableHand]);

  // Plug the carried end into a port of the open rack -- or into a device.
  const plugCableHand = useCallback((target) => {
    const hand = cableHandRef.current;
    const rackId = rackViewIdRef.current;
    if (!hand || !target) return;
    const end = target.deviceId ? { deviceId: target.deviceId } : { rackId, portId: target.id };
    const role = target.kind === "outlet" ? (target.feed === "A" ? "powerA" : "powerB") : hand.role;
    let cord;
    if (hand.isNew) {
      cord = { id: patchCordStore.newId(rackId), role, a: hand.fixed, b: end };
    } else {
      const cur = patchCordStore.get(hand.cordId);
      if (!cur) { finishHand(); return; }
      cord = { ...cur, role, [hand.moving]: end };
    }
    // A port takes one plug: whatever cable was in it comes out and hangs
    // from its other end (or goes, if that end was loose too).
    let swapped = null;
    if (end.portId) {
      const inPort = (e) => !!e && e.rackId === rackId && e.portId === end.portId;
      swapped = patchCordStore.forRack(rackId).find((c) => c.id !== cord.id && (inPort(c.a) || inPort(c.b))) || null;
      if (swapped) {
        const out = { ...swapped, a: inPort(swapped.a) ? null : swapped.a, b: inPort(swapped.b) ? null : swapped.b };
        if (!out.a && !out.b) patchCordStore.remove(out.id); else patchCordStore.save(out);
        syncCordConnection(out.id);
      }
    }
    patchCordStore.save(cord);
    syncCordConnection(cord.id);
    finishHand();
    bumpCords();
    const far = cord.a && cord.b && (cord.a.deviceId || cord.a.rackId) !== (cord.b.deviceId || cord.b.rackId);
    setCableNote({
      tone: "ok",
      text: `Plugged in → ${describeCordEnd(end)}`
        + (swapped ? " · the cable that was in it is now unplugged" : "")
        + (far && roleMedium(role) !== "power" ? " · runs across the floor (see CONNECTIVITY)" : ""),
    });
  }, [finishHand, bumpCords, syncCordConnection, describeCordEnd]);

  // Pull the carried end out and let the cable hang from its other end.
  const unplugCableHand = useCallback(() => {
    const hand = cableHandRef.current;
    if (!hand) return;
    const cur = hand.isNew ? null : patchCordStore.get(hand.cordId);
    if (cur) {
      const cord = { ...cur, [hand.moving]: null };
      if (!cord.a && !cord.b) patchCordStore.remove(cord.id);
      else patchCordStore.save(cord);
      syncCordConnection(cur.id);
      setCableNote({ tone: "info", text: "Unplugged — the cable now hangs from its other end." });
    }
    finishHand();
    bumpCords();
  }, [finishHand, bumpCords, syncCordConnection]);

  const removeCableHand = useCallback(() => {
    const hand = cableHandRef.current;
    if (!hand) return;
    if (!hand.isNew) {
      patchCordStore.remove(hand.cordId);
      syncCordConnection(hand.cordId);
      setCableNote({ tone: "info", text: "Cable removed." });
    }
    finishHand();
    bumpCords();
  }, [finishHand, bumpCords, syncCordConnection]);

  const setCableHandRole = useCallback((role) => {
    const hand = cableHandRef.current;
    if (!hand) return;
    // The port under the pointer may not take the new type.
    handHoverPortRef.current = null;
    setHandHoverLabel(null);
    setCableHand({ ...hand, role });
  }, [setCableHand]);

  // Devices outside the racks a patch cord can be run to (switches,
  // routers, firewalls...) -- racks are plugged port-by-port in RACK VIEW.
  const cordDeviceTargets = useMemo(() => devices
    .filter((d) => !isRackDevice(d.name, d.category, d.shape)
      && ["Network", "Security", "Compute", "Storage"].includes(d.category))
    .map((d) => ({ value: d.id, label: deviceLabel(d) })), [devices]);

  // ── Pointer: long-press to take hold, click (or drag-and-drop) to plug ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const LONG_PRESS_MS = 450;
    const MOVE_PX = 6;
    let press = null;
    let raf = 0;

    // Nearest port to the pointer, on screen -- far more forgiving than
    // ray-hitting a one-centimetre socket from three metres away.
    const nearestPort = (clientX, clientY, maxPx, filter) => {
      const { inner, dressing } = rackViewParts();
      const camera = cameraRef.current;
      if (!inner || !dressing || !camera) return null;
      const g = dressing.userData.rackGeom;
      const rect = canvas.getBoundingClientRect();
      const v = new THREE.Vector3();
      let best = null, bestD = maxPx;
      dressing.userData.ports.forEach((p) => {
        if (filter && !filter(p)) return;
        v.copy(portPlugPoint(g, p));
        inner.localToWorld(v);
        v.project(camera);
        if (v.z > 1 || v.z < -1) return;
        const d = Math.hypot(rect.left + (v.x * 0.5 + 0.5) * rect.width - clientX,
          rect.top + (-v.y * 0.5 + 0.5) * rect.height - clientY);
        if (d < bestD) { bestD = d; best = p; }
      });
      return best;
    };

    // Ports the carried end could go into right now -- free ones, and ones
    // in use (plugging there pulls the cable that is in it out).
    const pluggable = () => {
      const hand = cableHandRef.current;
      const { id: rackId, dressing } = rackViewParts();
      if (!hand || !dressing) return () => false;
      const ports = dressing.userData.ports;
      const fixedPort = hand.fixed?.rackId === rackId ? ports.get(hand.fixed.portId) || null : null;
      const sameRack = !hand.fixed || !hand.fixed.rackId || hand.fixed.rackId === rackId;
      return (p) => (!fixedPort || p.id !== fixedPort.id)
        && canPlugInto(hand.role, p, { fixedPort, sameRack });
    };

    const updateHover = (clientX, clientY) => {
      handPointerRef.current = { x: clientX, y: clientY };
      const port = nearestPort(clientX, clientY, 18, pluggable());
      const id = port ? port.id : null;
      if (id !== handHoverPortRef.current) {
        handHoverPortRef.current = id;
        const busy = port && rackViewParts().dressing?.userData.occupiedPorts.has(port.id);
        setHandHoverLabel(port ? { text: `${port.device} · ${port.label}`, busy: !!busy } : null);
      }
      refreshHandVisuals();
    };

    // Long-press: on a port, take hold of the cable in it (or start a new
    // one from a free port); on a cable, take hold of its nearer end.
    const onLongPress = (clientX, clientY) => {
      const { id: rackId, inner, dressing } = rackViewParts();
      if (!dressing) return false;
      const port = nearestPort(clientX, clientY, 12, null);
      if (port) {
        const cordId = dressing.userData.occupiedPorts.get(port.id);
        if (cordId) {
          const cord = patchCordStore.get(cordId);
          pickUpCord(cordId, cord?.a?.rackId === rackId && cord.a.portId === port.id ? "a" : "b");
        } else {
          startNewCable(port);
        }
        return true;
      }
      const pickMesh = dressing.children.find((c) => c.userData?.isCordPick);
      const camera = cameraRef.current;
      if (!pickMesh || !camera) return false;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      const rc = pickRaycaster();
      rc.setFromCamera(ndc, camera);
      const hit = rc.intersectObject(pickMesh, false)[0];
      const cordId = cordIdFromPick(hit);
      if (!cordId) return false;
      const ends = dressing.userData.cordEnds.get(cordId) || {};
      const local = inner.worldToLocal(hit.point.clone());
      const da = ends.a ? local.distanceTo(ends.a) : Infinity;
      const db = ends.b ? local.distanceTo(ends.b) : Infinity;
      pickUpCord(cordId, da <= db ? "a" : "b");
      return true;
    };

    const onDown = (e) => {
      if (!rackViewIdRef.current || modeRef.current !== "view" || e.button !== 0) return;
      press = { x: e.clientX, y: e.clientY, moved: false, fired: false, timer: 0 };
      if (cableHandRef.current) return;                 // carrying: the click plugs, on release
      if (portPickModeRef.current) {
        // + NEW CABLE: only a free port that takes the chosen type.
        const busyBy = rackViewParts().dressing?.userData.occupiedPorts;
        const role = newCableRoleRef.current;
        const port = nearestPort(e.clientX, e.clientY, 14, (p) => !busyBy?.has(p.id) && canPlugInto(role, p));
        if (port) {
          press.fired = true;
          if (orbitRef.current) orbitRef.current.enabled = false;
          handPointerRef.current = { x: e.clientX, y: e.clientY };
          startNewCable(port, role);
        }
        return;
      }
      const at = { x: e.clientX, y: e.clientY };
      press.timer = setTimeout(() => {
        if (!press || press.moved) return;
        if (onLongPress(at.x, at.y)) {
          press.fired = true;
          // Held down: the camera stays put while the plug is dragged about.
          if (orbitRef.current) orbitRef.current.enabled = false;
          handPointerRef.current = at;
        }
      }, LONG_PRESS_MS);
    };

    const onMove = (e) => {
      if (press && !press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_PX) {
        press.moved = true;
        if (!press.fired) clearTimeout(press.timer);
      }
      if (!cableHandRef.current || !rackViewIdRef.current) return;
      const cx = e.clientX, cy = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; updateHover(cx, cy); });
    };

    const onUp = (e) => {
      if (!press) return;
      clearTimeout(press.timer);
      const p = press;
      press = null;
      if (orbitRef.current) orbitRef.current.enabled = true;
      if (!cableHandRef.current) return;
      // Let go right after taking hold: the cable stays in hand and follows
      // the pointer. A drag-and-drop onto a port, or a plain click on one
      // while carrying, plugs it in. Any other drag was just the camera.
      if (p.fired && !p.moved) return;
      if (!p.fired && p.moved) return;
      const port = nearestPort(e.clientX, e.clientY, 18, pluggable());
      if (port) plugCableHand(port);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (press) clearTimeout(press.timer);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
    // (pickRaycaster only reads refs, so the first render's copy is fine.)
  }, [rackViewParts, refreshHandVisuals, pickUpCord, startNewCable, plugCableHand]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (cancelActiveSessionRef.current?.()) return;
      if (cancelResizeSessionRef.current?.()) return;
      if (placeDeviceSessionRef.current) { setPlaceDeviceSession(null); return; }
      // RACK VIEW, innermost first: let go of the cable, then stop picking a
      // port, then leave the rack.
      if (cableHandRef.current) { finishHand(); return; }
      if (portPickModeRef.current) { setPortPickMode(false); return; }
      if (rackViewIdRef.current) { closeRackView(); return; }
      if (selectedDeviceIdRef.current) { setSelectedDeviceId(null); return; }
      if (mode !== "view") { setMode("view"); setPendingConnectDevice(null); return; }
      if (onBack) onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, mode, closeRackView, finishHand, setPortPickMode]);

  const T = THEMES[theme];
  const isDark = theme === "dark";

  // ── Tap-off boxes only exist on a busway ───────────────────────────────
  // A tap-off is not free-standing kit: it is the plug-in box that clamps onto
  // an overhead busway run and drops power into the rack below it. So instead
  // of letting it land wherever it was dropped, it is snapped onto the nearest
  // busway's centre line — and refused outright if there is no busway to
  // clamp to, which is exactly what would happen on site.
  const snapTapOffToBusway = useCallback((dropX, dropZ) => {
    const busways = devicesRef.current.filter((d) => d.shape === "busway"
      || /busway|busduct|busbar/i.test(d.name || ""));
    if (!busways.length) return { ok: false };

    let best = null;
    busways.forEach((b) => {
      // The run lies along the busway's own length axis, rotated with it.
      const ry = ((b.rotation || 0) * Math.PI) / 180;
      const ax = Math.cos(ry), az = -Math.sin(ry);          // unit vector along the run
      const half = ((b.dimensions?.lengthMm || 3000) / 1000) / 2;
      const vx = dropX - b.position.x, vz = dropZ - b.position.z;
      const t = Math.max(-half, Math.min(half, vx * ax + vz * az));  // clamp to the run
      const px = b.position.x + ax * t, pz = b.position.z + az * t;
      const dist = Math.hypot(dropX - px, dropZ - pz);
      if (!best || dist < best.dist) best = { dist, x: px, z: pz, busId: b.id };
    });

    // Far enough away and the user clearly meant somewhere else, not this run.
    if (!best || best.dist > 4) return { ok: false, tooFar: true };
    return { ok: true, ...best };
  }, []);

  // ── Place a device at the nearest valid tile block ─────────────────────

  // ═══════════════════════════════════════════════════════════════════════
  // CHAIN GUIDANCE — fired after every placement.
  //
  // Three things get said, in the order a planner actually needs them:
  //   1. what should have come BEFORE this device (if anything was skipped)
  //   2. what comes NEXT in the same chain
  //   3. whether this stage still needs its Tier III B side
  //
  // Nothing is ever blocked. Placing a PDU before its UPS is legal, you just
  // get told that the UPS is missing and what it feeds.
  // ═══════════════════════════════════════════════════════════════════════
  const announceGuidance = useCallback((placedDevice) => {
    if (!guideToastsRef.current || !placedDevice) return;
    const g = guidanceFor(devicesRef.current, placedDevice);
    if (!g) return;

    const accent = g.chainColor || "#38bdf8";
    const skipped = g.missingBefore.length > 0;

    notification.open({
      key: `chain-guide-${placedDevice.id}`,
      placement: "bottomRight",
      duration: skipped ? 9 : 6,
      closeIcon: null,
      style: {
        width: 372,
        borderLeft: `3px solid ${skipped ? "#f59e0b" : accent}`,
        padding: "12px 14px",
      },
      message: (
        <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>
          {skipped ? "⚠ Out of order" : "✓"} {deviceLabel(placedDevice)} · {g.chainLabel} chain
          <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 11, marginLeft: 6 }}>
            stage {g.position}
          </span>
        </span>
      ),
      description: (
        <div style={{ fontSize: 11.5, lineHeight: 1.55 }}>
          {/* what was skipped */}
          {skipped && (
            <div style={{ marginBottom: 6 }}>
              <b>Should have come first:</b>{" "}
              {g.missingBefore.map((s) => s.label).join(" → ")}.
              <div style={{ opacity: 0.75, marginTop: 2 }}>
                {g.missingBefore[0].why}
              </div>
            </div>
          )}

          {/* what comes next */}
          {g.next ? (
            <div>
              <b>Next:</b> {g.next.label}
              <div style={{ opacity: 0.75, marginTop: 2 }}>{g.next.why}</div>
            </div>
          ) : (
            <div><b>Next:</b> nothing — the {g.chainLabel.toLowerCase()} chain is complete end to end.</div>
          )}

          {/* Tier III A/B redundancy on this stage */}
          {g.redundancyHint && (
            <div style={{ marginTop: 6, color: "#f59e0b" }}>{g.redundancyHint}</div>
          )}

          {/* the cable reminder — without it the simulation cannot model it */}
          {g.cableHint && (
            <div style={{ marginTop: 6, opacity: 0.7, fontSize: 11 }}>{g.cableHint}</div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 9 }}>
            <a onClick={() => { setGuideOpen(true); notification.destroy(`chain-guide-${placedDevice.id}`); }}
               style={{ fontSize: 11, fontWeight: 600 }}>
              Open Deployment Guide
            </a>
            <a onClick={() => { setGuideToasts(false); notification.destroy(); }}
               style={{ fontSize: 11, opacity: 0.7 }}>
              Mute these hints
            </a>
          </div>
        </div>
      ),
    });
  }, []);

  const placeDeviceAt = useCallback((payload, dimsMm, dropX, dropZ) => {
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    if (!dcGroup) return;

    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const { tilesX, tilesZ } = getFootprintTiles({ length: dimsMm.length, width: dimsMm.width });
    const deviceId = `dev_${deviceIdCounterRef.current++}`;
    const bounds = buildBuildingTileBounds(dcGroup);

    let hostBuswayId = null;
    if (payload.shape === "tapoff") {
      const snap = snapTapOffToBusway(dropX, dropZ);
      if (!snap.ok) {
        message.error(snap.tooFar
          ? "That's too far from any busway — a tap-off box clamps onto a busway run."
          : "Place a Busway first — a tap-off box has nothing to clamp onto without one.");
        return;
      }
      dropX = snap.x; dropZ = snap.z; hostBuswayId = snap.busId;
    }

    // Why the exact drop tile was refused, if it was — resolvePlacement only
    // reports the reason when it gives up entirely, but a silent one-tile
    // nudge is exactly the thing that makes placement feel broken.
    const exactAnchor = worldToAnchorTile(dropX, dropZ, originX, originZ, tilesX, tilesZ);
    const exactCheck = canPlaceDevice({
      occupiedTiles: occupiedTilesRef.current,
      tx: exactAnchor.tx, tz: exactAnchor.tz, tilesX, tilesZ,
      excludeId: deviceId, bounds, reservedTiles: reservedTilesRef.current,
    });

    const resolved = resolvePlacement({
      occupiedTiles: occupiedTilesRef.current,
      worldX: dropX, worldZ: dropZ,
      tilesX, tilesZ, originX, originZ,
      excludeId: deviceId, bounds, autoCorrect: true,
      reservedTiles: reservedTilesRef.current,
    });

    if (!resolved.accepted) {
      message.error(`Can't place ${payload.name} here: ${reasonText(resolved.reason)}`);
      return;
    }

    const center = tileAnchorToWorldCenter(resolved.tx, resolved.tz, tilesX, tilesZ, originX, originZ);
    const newDevice = {
      id: deviceId,
      name: payload.name,
      // Asset tag. Auto-assigned per family (RACK-01, RACK-02, UPS-01 …) so
      // the failure report can name the cabinet instead of saying "Rack" nine
      // times. Editable from Properties.
      alias: nextAlias(payload, devicesRef.current),
      category: payload.category,
      color: payload.color,
      icon: payload.icon,
      // Carried straight through from the Toolbox tile so the device keeps
      // its real 3D body (transformer / genset / switchboard / UPS / PDU)
      // across re-renders, reloads and saved layouts. Devices created before
      // this field existed simply have it undefined and fall back to the
      // name-based match inside selectShapeBuilder().
      shape: payload.shape,
      svgIcon: payload.svgIcon,
      // Which busway run this tap-off is clamped to (tap-offs only).
      hostBuswayId,
      roomId: payload.targetRoomId || null,
      position: { x: center.x, z: center.z },
      rotation: 0,
      dimensions: {
        lengthMm: dimsMm.length,
        widthMm: dimsMm.width,
        // Racks take their height from the U size selected in the toolbar,
        // so you can drop a 12U, a 42U and a 48U side by side instead of
        // everything inheriting one 2000mm default.
        heightMm: isRackDevice(payload.name, payload.category, payload.shape)
          ? rackUToHeightMm(newRackURef.current)
          : payload.defaultDimensions?.heightMm || Math.round(DEVICE_HEIGHT_M * 1000),
      },
      footprint: { tilesX, tilesZ, widthMm: tilesX * TILE_SIZE_MM, depthMm: tilesZ * TILE_SIZE_MM },
      tileAnchor: { tx: resolved.tx, tz: resolved.tz },
      occupiedTiles: resolved.keys,
      metadata: { power: payload.power || "N/A" },
    };

    pulseIdRef.current = deviceId;
    commitDevices((prev) => [...prev, newDevice]);
    setSelectedDeviceId(deviceId);

    // Chain guidance. devicesRef is updated by an effect, so the new device
    // is appended here explicitly rather than waiting a render for it.
    devicesRef.current = [...devicesRef.current, newDevice];
    announceGuidance(newDevice);
    if (resolved.corrected) {
      const dx = resolved.tx - exactAnchor.tx;
      const dz = resolved.tz - exactAnchor.tz;
      const moved = Math.max(Math.abs(dx), Math.abs(dz));
      const blocker = exactCheck.blockingDeviceId
        ? deviceLabel(devicesRef.current.find((d) => d.id === exactCheck.blockingDeviceId))
        : null;
      message.warning({
        content: `${newDevice.alias} moved ${moved} tile${moved === 1 ? "" : "s"} to the nearest free spot — ${
          blocker ? `${blocker} was already on those tiles`
            : reasonText(exactCheck.reason).toLowerCase()
        }. It reserves ${tilesX}×${tilesZ} tiles (${tilesX * TILE_SIZE_MM}×${tilesZ * TILE_SIZE_MM} mm), so it needs that whole block free.`,
        duration: 6,
      });
    }

    // Capacity feedback: tell the planner when a room is filling up.
    const rect = roomRects.find((r) =>
      Math.abs(center.x - r.cx) <= r.w / 2 && Math.abs(center.z - r.cz) <= r.l / 2);
    if (rect) {
      const already = devicesRef.current.filter((d) =>
        Math.abs(d.position.x - rect.cx) <= rect.w / 2 && Math.abs(d.position.z - rect.cz) <= rect.l / 2).length;
      const pred = predictRoomCapacity(rect.room, already + 1, capacityTuning[rect.type] || {});
      if (!pred.nonPlaceable && pred.planned > 0) {
        if (already + 1 > pred.planned) {
          message.warning(`${rect.name} is now over its recommended ${pred.planned} ${pred.profile.units}.`);
        } else if (already + 1 === pred.planned) {
          message.warning(`${rect.name} has just hit its recommended capacity of ${pred.planned} ${pred.profile.units}.`);
        }
      }
    }
  }, [commitDevices, roomRects, capacityTuning, snapTapOffToBusway, announceGuidance]);

  const confirmDeviceDims = () => {
    if (!deviceModal) return;
    placeDeviceAt(deviceModal.payload, deviceDimsMm, deviceModal.x, deviceModal.z);
    setDeviceModal(null);
    setDeviceDimsMm({ length: 600, width: 600 });
  };

  const cancelDeviceDims = () => {
    setDeviceModal(null);
    setDeviceDimsMm({ length: 600, width: 600 });
  };

  const rotateSelectedDevice = useCallback(() => {
    const id = selectedDeviceIdRef.current;
    if (!id) return;
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    const dev = devicesRef.current.find((d) => d.id === id);
    if (!dcGroup || !dev) return;
    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const bounds = buildBuildingTileBounds(dcGroup);
    const rotated = rotateFootprint(dev.footprint);
    const check = canPlaceDevice({
      occupiedTiles: occupiedTilesRef.current,
      tx: dev.tileAnchor.tx, tz: dev.tileAnchor.tz,
      tilesX: rotated.tilesX, tilesZ: rotated.tilesZ,
      excludeId: id, bounds,
      reservedTiles: reservedTilesRef.current,
    });
    if (!check.valid) {
      message.warning(`Can't rotate here: ${reasonText(check.reason)}`);
      return;
    }
    const center = tileAnchorToWorldCenter(dev.tileAnchor.tx, dev.tileAnchor.tz, rotated.tilesX, rotated.tilesZ, originX, originZ);
    commitDevices((prev) => prev.map((d) => (d.id !== id ? d : {
      ...d,
      rotation: (d.rotation + 90) % 360,
      footprint: { tilesX: rotated.tilesX, tilesZ: rotated.tilesZ, widthMm: rotated.tilesX * TILE_SIZE_MM, depthMm: rotated.tilesZ * TILE_SIZE_MM },
      position: { x: center.x, z: center.z },
      occupiedTiles: check.keys,
    })));
  }, [commitDevices]);

  const duplicateSelectedDevice = useCallback(() => {
    const id = selectedDeviceIdRef.current;
    if (!id) return;
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    const dev = devicesRef.current.find((d) => d.id === id);
    if (!dcGroup || !dev) return;
    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const newId = `dev_${deviceIdCounterRef.current++}`;
    const bounds = buildBuildingTileBounds(dcGroup);
    const { tx, tz, keys } = findFreeTileAnchor(occupiedTilesRef.current, dev.tileAnchor.tx + 1, dev.tileAnchor.tz, dev.footprint.tilesX, dev.footprint.tilesZ, newId, reservedTilesRef.current);
    if (!canPlaceDevice({ occupiedTiles: occupiedTilesRef.current, tx, tz, tilesX: dev.footprint.tilesX, tilesZ: dev.footprint.tilesZ, excludeId: newId, bounds, reservedTiles: reservedTilesRef.current }).valid) {
      message.error("No free space nearby to duplicate this device.");
      return;
    }
    const center = tileAnchorToWorldCenter(tx, tz, dev.footprint.tilesX, dev.footprint.tilesZ, originX, originZ);
    // A duplicate is a different physical box, so it gets its own tag —
    // copying the alias would put two RACK-03s on the floor.
    const clone = {
      ...dev, id: newId, alias: nextAlias(dev, devicesRef.current),
      position: { x: center.x, z: center.z }, tileAnchor: { tx, tz }, occupiedTiles: keys,
    };
    commitDevices((prev) => [...prev, clone]);
    setSelectedDeviceId(newId);
  }, [commitDevices]);

  const deleteSelectedDevice = useCallback(() => {
    const id = selectedDeviceIdRef.current;
    if (!id) return;
    connectionsRef.current = connectionsRef.current.filter((c) => parentDeviceId(c.fromId) !== id && parentDeviceId(c.toId) !== id);
    bumpConnections();
    setFailures((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    commitDevices((prev) => prev.filter((d) => d.id !== id));
    setSelectedDeviceId(null);
  }, [commitDevices, bumpConnections]);

  const pasteClipboardDevice = useCallback(() => {
    const src = clipboardRef.current;
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    if (!src || !dcGroup) return;
    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const newId = `dev_${deviceIdCounterRef.current++}`;
    const bounds = buildBuildingTileBounds(dcGroup);
    const { tx, tz, keys } = findFreeTileAnchor(occupiedTilesRef.current, src.tileAnchor.tx + 1, src.tileAnchor.tz + 1, src.footprint.tilesX, src.footprint.tilesZ, newId, reservedTilesRef.current);
    if (!canPlaceDevice({ occupiedTiles: occupiedTilesRef.current, tx, tz, tilesX: src.footprint.tilesX, tilesZ: src.footprint.tilesZ, excludeId: newId, bounds, reservedTiles: reservedTilesRef.current }).valid) {
      message.error("No free space nearby to paste this device.");
      return;
    }
    const center = tileAnchorToWorldCenter(tx, tz, src.footprint.tilesX, src.footprint.tilesZ, originX, originZ);
    const clone = {
      ...src, id: newId, alias: nextAlias(src, devicesRef.current),
      position: { x: center.x, z: center.z }, tileAnchor: { tx, tz }, occupiedTiles: keys,
    };
    commitDevices((prev) => [...prev, clone]);
    setSelectedDeviceId(newId);
  }, [commitDevices]);

  const connectFromSelection = useCallback(() => {
    // No pre-existing selection required any more -- Connect mode's own
    // two-click handler (below) resolves both endpoints itself, including a
    // specific rack slot's port, which was never independently selectable.
    setMode("connect");
    setPendingConnectDevice(selectedDeviceIdRef.current || null);
  }, []);

  // Human-readable name for a connection endpoint, whether it's a plain
  // device id or a "dev_3#slotId" rack-slot port. Reads live scene state
  // via refs so it stays stable (safe to omit from dep arrays) yet current.
  const endpointLabel = useCallback((id) => {
    const { deviceId, slotId, portIdx } = parseEndpointId(id);
    const dev = devicesRef.current.find((d) => d.id === deviceId);
    const devName = dev ? deviceLabel(dev) : deviceId;
    if (!slotId) return devName;
    const devicesGroup = sceneRef.current?.getObjectByName("DevicesGroup");
    const root = devicesGroup?.children.find((c) => c.userData.deviceId === deviceId);
    let portMesh = null;
    root?.traverse((o) => { if (!portMesh && o.userData?.isRackSlotPort && o.userData.slotId === slotId) portMesh = o; });
    const slotName = portMesh?.userData?.slot?.deviceName || slotId;
    const portName = portIdx == null ? "" : ` \u00b7 P${portIdx + 1}`;
    return `${devName} \u00b7 ${slotName}${portName}`;
  }, []);

  // U height applied to newly placed racks (the toolbar's RACK selector).
  const [newRackU, setNewRackU] = useState(DEFAULT_RACK_U);
  const newRackURef = useRef(DEFAULT_RACK_U);
  useEffect(() => { newRackURef.current = newRackU; }, [newRackU]);

  const [propertiesModal, setPropertiesModal] = useState(null);

  // ── Rack elevation editor (opens on double-click of a rack) ──────────
  const [rackElevation, setRackElevation] = useState(null);
  // The dblclick listener below is installed once, so it cannot read
  // `rackElevation` from state -- it needs refs. These two are what stop the
  // dialog being opened a second time: once while it is already up, and once
  // by a stray click that lands on the canvas during the dialog's own
  // close animation (the mask stops swallowing clicks before it unmounts).
  const rackElevationOpenRef = useRef(false);
  const rackElevationClosedAtRef = useRef(0);
  useEffect(() => { rackElevationOpenRef.current = !!rackElevation; }, [rackElevation]);

  const refreshRackRealFace = useCallback((rackId, slots) => {
    const rt = rackRuntimeRef.current.get(rackId);
    if (!rt) return;
    populateRackRealFaces({
      bodies: rt.bodies, rackId,
      width: rt.dims.W, depth: rt.dims.D,
      totalHeightM: rt.dims.H, totalUnitsU: rt.dims.totalUnitsU,
      slots,
    });
    setRackRealFaceVisible(rt.bodies, false);
    // Storage reads the same slot list, so an edit here repaints it too.
    rackSlotsRef.current.set(rackId, slots || []);
    setStorageVersion((v) => v + 1);
    // ...and so does RACK VIEW, when this is the rack being looked at.
    if (rackViewIdRef.current === rackId) applyRackView();
    else if (patchCordStore.knownSlots(rackId)) {
      // Cables follow the devices even when the rack is not open: a removed
      // device's cords go with it (and any floor run they made).
      const sync = syncRackCabling(rackId, rt.dims, slots || []);
      sync.removedCords.forEach((c) => syncCordConnectionRef.current?.(c.id));
    }
    // Slot edits can add/remove ports that existing connections reference.
    rebuildWiring();
  }, [rebuildWiring, applyRackView]);
  const openPropertiesForSelection = useCallback(() => {
    const id = selectedDeviceIdRef.current;
    const dev = devicesRef.current.find((d) => d.id === id);
    if (!dev) return;
    setPropertiesModal({
      id, alias: dev.alias || "",
      length: dev.dimensions.lengthMm, width: dev.dimensions.widthMm, height: dev.dimensions.heightMm,
    });
  }, []);
  const confirmPropertiesModal = () => {
    if (!propertiesModal) return;
    const { id, length, width, height } = propertiesModal;
    const alias = (propertiesModal.alias || "").trim();
    if (alias && aliasTaken(alias, devicesRef.current, id)) {
      message.error(`"${alias}" is already used by another device — an asset tag has to be unique or the impact report can't tell them apart.`);
      return;
    }
    const scene = sceneRef.current;
    const dcGroup = scene?.getObjectByName("DataCenter");
    const dev = devicesRef.current.find((d) => d.id === id);
    if (!dcGroup || !dev) { setPropertiesModal(null); return; }
    const originX = dcGroup.userData.gridOriginX ?? 0;
    const originZ = dcGroup.userData.gridOriginZ ?? 0;
    const native = getFootprintTiles({ length, width });
    const isSideways = dev.rotation === 90 || dev.rotation === 270;
    const tilesX = isSideways ? native.tilesZ : native.tilesX;
    const tilesZ = isSideways ? native.tilesX : native.tilesZ;
    const bounds = buildBuildingTileBounds(dcGroup);
    const check = canPlaceDevice({
      occupiedTiles: occupiedTilesRef.current,
      tx: dev.tileAnchor.tx, tz: dev.tileAnchor.tz, tilesX, tilesZ, excludeId: id, bounds,
      reservedTiles: reservedTilesRef.current,
    });
    if (!check.valid) {
      message.error(`Can't resize: ${reasonText(check.reason)}. Dimensions were not changed.`);
      return;
    }
    const center = tileAnchorToWorldCenter(dev.tileAnchor.tx, dev.tileAnchor.tz, tilesX, tilesZ, originX, originZ);
    commitDevices((prev) => prev.map((d) => (d.id !== id ? d : {
      ...d,
      // An emptied field falls back to the auto tag rather than leaving the
      // device nameless in the failure report.
      alias: alias || nextAlias(d, devicesRef.current.filter((x) => x.id !== id)),
      dimensions: { lengthMm: length, widthMm: width, heightMm: height },
      footprint: { tilesX, tilesZ, widthMm: tilesX * TILE_SIZE_MM, depthMm: tilesZ * TILE_SIZE_MM },
      position: { x: center.x, z: center.z },
      occupiedTiles: check.keys,
    })));
    setPropertiesModal(null);
  };
  const cancelPropertiesModal = () => setPropertiesModal(null);

  // ── Global keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      // A cable in hand: Delete throws the CABLE away -- never the rack it
      // happens to be selected in.
      if (cableHandRef.current && !mod && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        removeCableHand();
        return;
      }
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === "d") { if (selectedDeviceIdRef.current) { e.preventDefault(); duplicateSelectedDevice(); } return; }
      if (mod && e.key.toLowerCase() === "c") { if (selectedDeviceIdRef.current) clipboardRef.current = devicesRef.current.find((d) => d.id === selectedDeviceIdRef.current) || null; return; }
      if (mod && e.key.toLowerCase() === "v") { if (clipboardRef.current) pasteClipboardDevice(); return; }
      if (!mod && e.key.toLowerCase() === "r" && selectedDeviceIdRef.current) { rotateSelectedDevice(); return; }
      if (!mod && e.key.toLowerCase() === "f" && selectedDeviceIdRef.current) { toggleFailure(selectedDeviceIdRef.current); return; }
      if (!mod && e.key === " " && (simRunning || Object.keys(failures).length)) { e.preventDefault(); setSimRunning((r) => !r); return; }
      if (!mod && (e.key === "Delete" || e.key === "Backspace") && selectedDeviceIdRef.current) { e.preventDefault(); deleteSelectedDevice(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, duplicateSelectedDevice, deleteSelectedDevice, rotateSelectedDevice, pasteClipboardDevice, toggleFailure, simRunning, failures, removeCableHand]);

  // ── Finalize a freeform-drawn room ──────────────────────────────────────
  const confirmRoomDraft = () => {
    if (!roomDraft || !roomDraft.name.trim()) return;
    const typeInfo = ROOM_TYPES.find((t) => t.value === roomDraft.type) || ROOM_TYPES[0];
    const id = Date.now();
    const newRoom = {
      id,
      name: roomDraft.name.trim(),
      type: roomDraft.type,
      typeLabel: typeInfo.label,
      color: typeInfo.color,
      hex: typeInfo.color,
      icon: typeInfo.icon,
      width: roomDraft.width,
      length: roomDraft.length,
      height: 8,
      kw: roomDraft.kw || 0,
      dimUnit: "m",
      posX: roomDraft.posX,
      posZ: roomDraft.posZ,
      margins: { top: 0, bottom: 0, left: 0, right: 0, unit: "m" },
      innerMargins: { top: 0, bottom: 0, left: 0, right: 0 },
    };
    const preview = predictRoomCapacity(newRoom, 0, capacityTuning[newRoom.type] || {});
    dcimBus.emit("addRoom", newRoom);
    setRoomDraft(null);
    setMode("view");
    // Same as handleAddRoom: pre-select, never auto-open.
    setCapacityRoomId(id);
    if (!preview.nonPlaceable) {
      if (preview.planned > 0) {
        message.success(
          `"${newRoom.name}" created — it holds about ${preview.planned} ${preview.profile.units} (${preview.geometricMax} absolute max), limited by ${preview.binding.label.toLowerCase()}.`
        );
      } else {
        message.warning(`"${newRoom.name}" is too small for even one ${preview.profile.unit} once clearances are applied.`);
      }
    }
  };
  const cancelRoomDraft = () => setRoomDraft(null);

  const confirmCable = () => {
    if (!cableModal) return;
    const id = `wire_${Date.now()}`;
    connectionsRef.current.push({
      id, fromId: cableModal.fromId, toId: cableModal.toId, type: cableModal.type,
      waypoints: cableModal.waypoints || [],
    });
    bumpConnections();
    rebuildWiring();
    setCableModal(null);
  };
  const cancelCable = () => setCableModal(null);

  // ── Ghost preview while a Toolbox device is being dragged ───────────────
  const newGhostRef = useRef(null);

  useEffect(() => {
    const offStart = dcimBus.on("dragStart", (e) => {
      const payload = e.detail;
      if (!payload?.name) return;
      const dims = payload.defaultDimensions
        ? { length: payload.defaultDimensions.lengthMm, width: payload.defaultDimensions.widthMm }
        : { length: TILE_SIZE_MM, width: TILE_SIZE_MM };
      const { tilesX, tilesZ } = getFootprintTiles(dims);
      const ghost = createGhostMesh(tilesX, tilesZ);
      ghost.visible = false;
      sceneRef.current?.add(ghost);
      newGhostRef.current = { ghost, tilesX, tilesZ, payload };
    });
    const offEnd = dcimBus.on("dragEnd", () => {
      disposeGroup(newGhostRef.current?.ghost);
      newGhostRef.current = null;
      setPlacementToast(null);
    });
    return () => { offStart(); offEnd(); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDragOver = (e) => {
      e.preventDefault();
      const session = newGhostRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const dcGroup = scene?.getObjectByName("DataCenter");
      if (!session || !scene || !camera || !dcGroup) return;
      const pt = groundPointFromClient(e.clientX, e.clientY, canvas, camera);
      if (!pt) return;
      const originX = dcGroup.userData.gridOriginX ?? 0;
      const originZ = dcGroup.userData.gridOriginZ ?? 0;
      const { tx, tz } = worldToAnchorTile(pt.x, pt.z, originX, originZ, session.tilesX, session.tilesZ);
      const center = tileAnchorToWorldCenter(tx, tz, session.tilesX, session.tilesZ, originX, originZ);
      session.ghost.position.set(center.x, FLOOR_Y + 0.02, center.z);
      session.ghost.visible = true;
      const bounds = buildBuildingTileBounds(dcGroup);
      const check = canPlaceDevice({ occupiedTiles: occupiedTilesRef.current, tx, tz, tilesX: session.tilesX, tilesZ: session.tilesZ, bounds, reservedTiles: reservedTilesRef.current });
      setGhostValidity(session.ghost, check.valid);
      setPlacementToast(check.valid ? null : { reason: check.reason, x: e.clientX, y: e.clientY });
    };

    const onDrop = (e) => {
      e.preventDefault();
      disposeGroup(newGhostRef.current?.ghost);
      newGhostRef.current = null;
      setPlacementToast(null);

      const raw = e.dataTransfer.getData("text/plain");
      if (!raw) return;
      let payload;
      try { payload = JSON.parse(raw); } catch { return; }
      if (!payload?.name) return;

      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!scene || !camera) return;

      const dropPt = groundPointFromClient(e.clientX, e.clientY, canvas, camera);
      if (!dropPt) return;

      const dims = payload.defaultDimensions
        ? { length: payload.defaultDimensions.lengthMm, width: payload.defaultDimensions.widthMm }
        : { length: TILE_SIZE_MM, width: TILE_SIZE_MM };
      setDeviceDimsMm(dims);
      setDeviceModal({ payload, x: dropPt.x, z: dropPt.z, roomId: payload.targetRoomId || null });
    };

    canvas.addEventListener("dragover", onDragOver);
    canvas.addEventListener("drop", onDrop);
    return () => {
      canvas.removeEventListener("dragover", onDragOver);
      canvas.removeEventListener("drop", onDrop);
    };
  }, []);

  // ── Click to select · long-press to move (devices and rooms) ───────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let downX = 0, downY = 0;
    let pending = null;
    let longPressTimer = null;
    let moveSession = null;

    const raycastGroup = (e, group, tagKey) => {
      const camera = cameraRef.current;
      if (!camera || !group) return null;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = pickRaycaster();
      raycaster.setFromCamera(ndc, camera);
      const meshes = [];
      group.traverse((o) => { if (o.isMesh && o.userData?.[tagKey]) meshes.push(o); });
      const hits = raycaster.intersectObjects(meshes, false);
      if (!hits.length) return null;
      return hits[0].object.userData[tagKey];
    };

    const getMovableRootAt = (e) => raycastGroup(e, sceneRef.current?.getObjectByName("DevicesGroup"), "movableRoot");
    const getRoomRootAt = (e) => raycastGroup(e, sceneRef.current?.getObjectByName("RoomsGroup"), "roomRoot");
    const getWireIdAt = (e) => raycastGroup(e, sceneRef.current?.getObjectByName("WiringGroup"), "wireId");
    const getGateRootAt = (e) => raycastGroup(e, sceneRef.current?.getObjectByName("RoomGatesGroup"), "gateRoot");

    // ── Dragging a gate ────────────────────────────────────────────────
    // A gate has one degree of freedom that matters: where on ITS OWN room's
    // perimeter it sits. So the drag does not move the gate to the pointer —
    // it asks nearestWallSlot() which slot on this room's walls the pointer
    // is closest to, and puts the gate there. Drag it into the middle of the
    // floor, into another room, off the building: it stays on its own walls.
    // Re-cuts one room's four partitions for a given gate list. Cheap enough
    // to run mid-drag (four parapet runs), which is what keeps the doorway
    // opening travelling WITH the gate instead of appearing when it lands.
    const recutRoomWalls = (roomId, gates) => {
      const scene = sceneRef.current;
      const roomGroup = scene?.getObjectByName(`Room_${roomId}`);
      const opts = roomGroup?.userData.roomWallOpts;
      const center = roomGroup?.userData.roomCenter;
      const dims = roomGroup?.userData.roomDims;
      if (!roomGroup || !opts || !center || !dims) return;
      roomGroup.children
        .filter((c) => c.name?.startsWith(`RoomWall_${roomId}_`))
        .forEach((c) => { roomGroup.remove(c); disposeGroup(c); });
      buildRoomWallRuns(roomId, center.x, center.z, dims.w, dims.l, opts, gates)
        .forEach((run) => roomGroup.add(run));
    };

    const beginGateMove = (root) => {
      const gate = roomGatesRef.current.find((g) => g.id === root.userData.gateId);
      const rect = roomRectsRef.current.find((r) => r.id === root.userData.gateRoomId);
      if (!gate || !rect) return;
      moveSession = {
        kind: "gate", id: gate.id, roomId: gate.roomId, root, rect,
        side: gate.side, t: gate.t,
        original: { side: gate.side, t: gate.t },
      };
      if (orbitRef.current) orbitRef.current.enabled = false;
    };

    const beginDeviceMove = (id, root) => {
      const dev = devicesRef.current.find((d) => d.id === id);
      if (!dev) return;
      const ghost = createGhostMesh(dev.footprint.tilesX, dev.footprint.tilesZ);
      ghost.position.copy(root.position);
      sceneRef.current?.add(ghost);
      root.visible = false;
      moveSession = { kind: "device", id, ghost, tilesX: dev.footprint.tilesX, tilesZ: dev.footprint.tilesZ };
      setSelectedDeviceId(id);
      if (orbitRef.current) orbitRef.current.enabled = false;
    };

    const beginRoomMove = (id, root, e) => {
      const scene = sceneRef.current;
      const dcGroup = scene?.getObjectByName("DataCenter");
      if (!scene || !dcGroup) return;
      const center = root.userData.roomCenter;
      const dims = root.userData.roomDims;
      if (!center || !dims) return;

      const camera = cameraRef.current;
      const startPt = groundPointFromClient(e.clientX, e.clientY, canvas, camera);
      if (!startPt) return;

      const roomGroup = scene.getObjectByName(`Room_${id}`);
      const marginGroup = scene.getObjectByName(`Margin_${id}`);
      const devicesGroup = scene.getObjectByName("DevicesGroup");

      const containedIds = new Set();
      const contained = [];
      devicesRef.current.forEach((dev) => {
        if (Math.abs(dev.position.x - center.x) > dims.w / 2) return;
        if (Math.abs(dev.position.z - center.z) > dims.l / 2) return;
        const group = devicesGroup?.children.find((c) => c.userData.deviceId === dev.id);
        if (!group) return;
        containedIds.add(dev.id);
        contained.push({ id: dev.id, tileAnchor: dev.tileAnchor, footprint: dev.footprint, originalPos: group.position.clone(), group });
      });

      const tempOccupied = new Map();
      occupiedTilesRef.current.forEach((v, k) => { if (!containedIds.has(v)) tempOccupied.set(k, v); });

      const perfGroup = scene.getObjectByName("PerfTilesGroup");
      const movingPerf = [];
      perfTilesRef.current.forEach((t) => {
        if (t.roomId !== id) return;
        const mesh = perfGroup?.children.find((c) => c.userData.perfTileId === t.id);
        movingPerf.push({
          id: t.id, tx: t.tx, tz: t.tz, mesh,
          originalPos: mesh ? mesh.position.clone() : null,
        });
      });
      const movingPerfKeys = new Set(movingPerf.map((t) => `${t.tx},${t.tz}`));
      const tempReserved = new Set();
      reservedTilesRef.current.forEach((k) => { if (!movingPerfKeys.has(k)) tempReserved.add(k); });

      // The room's own gates travel with it, so the doors do not detach from
      // the walls mid-drag.
      const gatesGroup = scene.getObjectByName("RoomGatesGroup");
      const movingGates = (gatesGroup?.children || [])
        .filter((g) => g.userData.gateRoomId === id)
        .map((g) => ({ group: g, originalPos: g.position.clone() }));

      const ghost = createRoomGhostOutline(dims.w, dims.l);
      ghost.position.set(center.x, 0, center.z);
      scene.add(ghost);

      moveSession = {
        kind: "room", id, roomGroup, marginGroup, ghost, dims, movingGates,
        originalCenter: { x: center.x, z: center.z }, startPt: { x: startPt.x, z: startPt.z },
        contained, tempOccupied, movingPerf, tempReserved, lastValid: true,
      };
      if (orbitRef.current) orbitRef.current.enabled = false;
    };

    const beginMove = (kind, id, root, e) => {
      if (kind === "device") beginDeviceMove(id, root);
      else beginRoomMove(id, root, e);
    };

    const revertRoomSession = (s) => {
      disposeGroup(s.ghost);
      s.roomGroup?.position.set(0, 0, 0);
      s.marginGroup?.position.set(0, 0, 0);
      s.movingGates?.forEach((g) => g.group.position.copy(g.originalPos));
      s.contained.forEach((c) => c.group.position.copy(c.originalPos));
      s.movingPerf?.forEach((t) => { if (t.mesh && t.originalPos) t.mesh.position.copy(t.originalPos); });
    };

    const cancelMove = () => {
      if (!moveSession) return false;
      if (moveSession.kind === "gate") {
        const { root, rect, original, roomId } = moveSession;
        const tr = gateTransform(rect, original.side, original.t);
        root.position.set(tr.x, FLOOR_Y, tr.z);
        root.rotation.y = tr.rotY;
        recutRoomWalls(roomId, roomGatesRef.current.filter((g) => g.roomId === roomId));
        moveSession = null;
        if (orbitRef.current) orbitRef.current.enabled = true;
        setPlacementToast(null);
        return true;
      }
      if (moveSession.kind === "device") {
        disposeGroup(moveSession.ghost);
        const devicesGroup = sceneRef.current?.getObjectByName("DevicesGroup");
        const root = devicesGroup?.children.find((c) => c.userData.deviceId === moveSession.id);
        if (root) root.visible = layersStateRef.current[root.userData.layer] !== false;
      } else {
        revertRoomSession(moveSession);
      }
      moveSession = null;
      if (orbitRef.current) orbitRef.current.enabled = true;
      setPlacementToast(null);
      return true;
    };
    cancelActiveSessionRef.current = cancelMove;

    const onPointerDown = (e) => {
      if (modeRef.current !== "view" || e.button !== 0 || moveSession) return;
      if (raycastGroup(e, sceneRef.current?.getObjectByName("ResizeHandles"), "resizeHandle")) return;
      downX = e.clientX; downY = e.clientY;
      // RACK VIEW is for looking: a click selects the rack, and nothing --
      // rack, room or gate -- can be picked up and moved from here.
      if (rackViewIdRef.current) {
        const root = getMovableRootAt(e);
        pending = root ? { kind: "device", id: root.userData.deviceId, root } : null;
        return;
      }
      // A gate is a handle, not a selectable object: grab it and it moves,
      // with no long-press first. It is checked ahead of devices and rooms
      // because it stands in a wall, where both of those also live.
      const gateRoot = getGateRootAt(e);
      if (gateRoot) {
        pending = null;
        beginGateMove(gateRoot);
        return;
      }
      const deviceRoot = getMovableRootAt(e);
      if (deviceRoot) {
        const id = deviceRoot.userData.deviceId;
        pending = { kind: "device", id, root: deviceRoot };
        if (moveArmedRef.current) {
          moveArmedRef.current = false;
          beginMove("device", id, deviceRoot, e);
          pending = null;
          return;
        }
      } else {
        const roomRoot = getRoomRootAt(e);
        if (!roomRoot) { pending = null; return; }
        pending = { kind: "room", id: roomRoot.userData.roomId, root: roomRoot };
      }
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        if (!pending) return;
        beginMove(pending.kind, pending.id, pending.root, e);
        pending = null;
      }, LONG_PRESS_MS);
    };

    const onPointerMove = (e) => {
      if (modeRef.current !== "view") return;
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (pending && moved > MOVE_CANCEL_PX) {
        clearTimeout(longPressTimer);
        pending = null;
      }
      if (!moveSession) return;

      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const dcGroup = scene?.getObjectByName("DataCenter");
      if (!camera || !dcGroup) return;
      const pt = groundPointFromClient(e.clientX, e.clientY, canvas, camera);
      if (!pt) return;

      if (moveSession.kind === "gate") {
        const s2 = moveSession;
        const slot = nearestWallSlot(s2.rect, pt.x, pt.z);
        const moved = slot.side !== s2.side || Math.abs(slot.t - s2.t) > 0.008;
        s2.side = slot.side;
        s2.t = slot.t;
        const tr = gateTransform(s2.rect, slot.side, slot.t);
        s2.root.position.set(tr.x, FLOOR_Y, tr.z);
        s2.root.rotation.y = tr.rotY;
        shadowDirtyRef.current = 3;
        // Move the hole with the door. Throttled to a real change so a
        // pointer jitter does not rebuild four walls a frame.
        if (moved) {
          recutRoomWalls(s2.roomId, roomGatesRef.current.map((g) => (
            g.id === s2.id ? { ...g, side: slot.side, t: slot.t } : g
          )).filter((g) => g.roomId === s2.roomId));
        }
        return;
      }

      if (moveSession.kind === "device") {
        const originX = dcGroup.userData.gridOriginX ?? 0;
        const originZ = dcGroup.userData.gridOriginZ ?? 0;
        const { tx, tz } = worldToAnchorTile(pt.x, pt.z, originX, originZ, moveSession.tilesX, moveSession.tilesZ);
        const center = tileAnchorToWorldCenter(tx, tz, moveSession.tilesX, moveSession.tilesZ, originX, originZ);
        moveSession.ghost.position.set(center.x, FLOOR_Y + 0.02, center.z);

        const bounds = buildBuildingTileBounds(dcGroup);
        const check = canPlaceDevice({ occupiedTiles: occupiedTilesRef.current, tx, tz, tilesX: moveSession.tilesX, tilesZ: moveSession.tilesZ, excludeId: moveSession.id, bounds, reservedTiles: reservedTilesRef.current });
        setGhostValidity(moveSession.ghost, check.valid);
        setPlacementToast(check.valid ? null : { reason: check.reason, x: e.clientX, y: e.clientY });
        return;
      }

      const s = moveSession;
      const deltaTilesX = Math.round((pt.x - s.startPt.x) / TILE_SIZE_M);
      const deltaTilesZ = Math.round((pt.z - s.startPt.z) / TILE_SIZE_M);
      const deltaX = deltaTilesX * TILE_SIZE_M;
      const deltaZ = deltaTilesZ * TILE_SIZE_M;
      const newCenter = { x: s.originalCenter.x + deltaX, z: s.originalCenter.z + deltaZ };

      s.roomGroup?.position.set(deltaX, 0, deltaZ);
      s.marginGroup?.position.set(deltaX, 0, deltaZ);
      s.ghost.position.set(newCenter.x, 0, newCenter.z);
      s.contained.forEach((c) => {
        c.group.position.set(c.originalPos.x + deltaX, c.originalPos.y, c.originalPos.z + deltaZ);
      });
      s.movingPerf.forEach((t) => {
        if (!t.mesh || !t.originalPos) return;
        t.mesh.position.set(t.originalPos.x + deltaX, t.originalPos.y, t.originalPos.z + deltaZ);
      });
      s.movingGates?.forEach((g) => {
        g.group.position.set(g.originalPos.x + deltaX, g.originalPos.y, g.originalPos.z + deltaZ);
      });
      shadowDirtyRef.current = 3;   // a room in motion drags its shadow with it

      const bounds = buildBuildingTileBounds(dcGroup);
      const roomCheck = checkRoomPlacement(scene, dcGroup, { cx: newCenter.x, cz: newCenter.z, w: s.dims.w, l: s.dims.l }, s.id);
      let devicesValid = true;
      let failReason = roomCheck.reason;
      for (const c of s.contained) {
        const tx = c.tileAnchor.tx + deltaTilesX, tz = c.tileAnchor.tz + deltaTilesZ;
        const check = canPlaceDevice({ occupiedTiles: s.tempOccupied, tx, tz, tilesX: c.footprint.tilesX, tilesZ: c.footprint.tilesZ, bounds, reservedTiles: s.tempReserved });
        if (!check.valid) { devicesValid = false; failReason = check.reason; break; }
      }
      const valid = roomCheck.valid && devicesValid;
      s.lastValid = valid;
      s.deltaTilesX = deltaTilesX;
      s.deltaTilesZ = deltaTilesZ;
      s.newCenter = newCenter;
      setGhostValidity(s.ghost, valid);
      setPlacementToast(valid ? null : { reason: failReason, x: e.clientX, y: e.clientY });
    };

    const onPointerUp = (e) => {
      if (modeRef.current !== "view" || e.button !== 0) return;
      clearTimeout(longPressTimer);

      if (moveSession && moveSession.kind === "gate") {
        const { id, side, t, original } = moveSession;
        moveSession = null;
        if (orbitRef.current) orbitRef.current.enabled = true;
        if (side !== original.side || Math.abs(t - original.t) > 1e-4) {
          setRoomGates((prev) => prev.map((g) => (g.id === id ? { ...g, side, t } : g)));
        }
        return;
      }

      if (moveSession && moveSession.kind === "device") {
        const scene = sceneRef.current;
        const dcGroup = scene?.getObjectByName("DataCenter");
        const { id, tilesX, tilesZ, ghost } = moveSession;
        const originX = dcGroup.userData.gridOriginX ?? 0;
        const originZ = dcGroup.userData.gridOriginZ ?? 0;
        const bounds = buildBuildingTileBounds(dcGroup);

        const resolved = resolvePlacement({
          occupiedTiles: occupiedTilesRef.current,
          worldX: ghost.position.x, worldZ: ghost.position.z,
          tilesX, tilesZ, originX, originZ, excludeId: id, bounds, autoCorrect: true,
          reservedTiles: reservedTilesRef.current,
        });

        disposeGroup(ghost);
        if (orbitRef.current) orbitRef.current.enabled = true;
        setPlacementToast(null);
        moveSession = null;

        if (resolved.accepted) {
          const center = tileAnchorToWorldCenter(resolved.tx, resolved.tz, tilesX, tilesZ, originX, originZ);
          pulseIdRef.current = id;
          commitDevices((prev) => prev.map((d) => (d.id !== id ? d : {
            ...d,
            position: { x: center.x, z: center.z },
            tileAnchor: { tx: resolved.tx, tz: resolved.tz },
            occupiedTiles: resolved.keys,
          })));
        } else {
          const devicesGroup = scene?.getObjectByName("DevicesGroup");
          const root = devicesGroup?.children.find((c) => c.userData.deviceId === id);
          if (root) root.visible = layersStateRef.current[root.userData.layer] !== false;
        }
        return;
      }

      if (moveSession && moveSession.kind === "room") {
        const s = moveSession;
        disposeGroup(s.ghost);
        if (orbitRef.current) orbitRef.current.enabled = true;
        setPlacementToast(null);
        moveSession = null;

        const deltaTilesX = s.deltaTilesX || 0, deltaTilesZ = s.deltaTilesZ || 0;
        if (s.lastValid && (deltaTilesX !== 0 || deltaTilesZ !== 0)) {
          const newCenter = s.newCenter || s.originalCenter;
          dcimBus.emit("updateRoom", { id: s.id, posX: newCenter.x, posZ: newCenter.z });
          if (s.contained.length) {
            const dcGroup = sceneRef.current?.getObjectByName("DataCenter");
            const originX = dcGroup?.userData.gridOriginX ?? 0;
            const originZ = dcGroup?.userData.gridOriginZ ?? 0;
            const movedIds = new Set(s.contained.map((c) => c.id));
            const patchById = new Map(s.contained.map((c) => {
              const tx = c.tileAnchor.tx + deltaTilesX, tz = c.tileAnchor.tz + deltaTilesZ;
              const center = tileAnchorToWorldCenter(tx, tz, c.footprint.tilesX, c.footprint.tilesZ, originX, originZ);
              const keys = tileKeysForBlock(tx, tz, c.footprint.tilesX, c.footprint.tilesZ);
              return [c.id, { position: { x: center.x, z: center.z }, tileAnchor: { tx, tz }, occupiedTiles: keys }];
            }));
            commitDevices((prev) => prev.map((d) => (movedIds.has(d.id) ? { ...d, ...patchById.get(d.id) } : d)));
          }
          if (s.movingPerf.length) {
            const perfIds = new Set(s.movingPerf.map((t) => t.id));
            setPerfTiles((prev) => prev.map((t) => (
              perfIds.has(t.id) ? { ...t, tx: t.tx + deltaTilesX, tz: t.tz + deltaTilesZ } : t
            )));
          }
          s.roomGroup?.position.set(0, 0, 0);
          s.marginGroup?.position.set(0, 0, 0);
        } else {
          revertRoomSession(s);
        }
        return;
      }

      const clickDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (clickDist <= MOVE_CANCEL_PX && !(pending && pending.kind === "device")) {
        const wireId = getWireIdAt(e);
        if (wireId) {
          const conn = connectionsRef.current.find((c) => c.id === wireId);
          if (conn) {
            setSelectedDeviceId(parentDeviceId(conn.fromId));
            setXrayFocus(true);
            pending = null;
            return;
          }
        }
      }

      if (pending) {
        const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
        if (moved <= MOVE_CANCEL_PX) {
          if (pending.kind === "device") {
            // A breaker or tap-off MCB is a switch first and a selectable
            // object second: clicking one throws it. Everything else selects
            // as before.
            const devGroup = sceneRef.current?.getObjectByName("DevicesGroup");
            const root = devGroup?.children.find((c) => c.userData.deviceId === pending.id);
            if (root?.userData.switchable) {
              const wasClosed = switchStatesRef.current[pending.id] !== false;
              setSwitchStates((prev) => ({ ...prev, [pending.id]: !wasClosed }));
              const dev = devicesRef.current.find((d) => d.id === pending.id);
              message.info(`${dev ? deviceLabel(dev) : "Breaker"} ${wasClosed ? "OPEN — isolated" : "CLOSED — live"}`);
            }
            setSelectedDeviceId(pending.id);
          }
          else {
            setSelectedDeviceId(null);
            // Clicking a room floor selects it in the Capacity Planner.
            setCapacityRoomId(pending.id);
          }
        }
        pending = null;
        return;
      }

      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved <= MOVE_CANCEL_PX && !getMovableRootAt(e)) setSelectedDeviceId(null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    return () => {
      clearTimeout(longPressTimer);
      cancelMove();
      cancelActiveSessionRef.current = () => false;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [commitDevices]);

  // ── Click-to-place from the Toolbox ────────────────────────────────────
  useEffect(() => {
    const off = dcimBus.on("placeDeviceClick", (e) => {
      const payload = e.detail;
      if (!payload?.name) return;
      const dims = payload.defaultDimensions
        ? { length: payload.defaultDimensions.lengthMm, width: payload.defaultDimensions.widthMm }
        : { length: TILE_SIZE_MM, width: TILE_SIZE_MM };
      const { tilesX, tilesZ } = getFootprintTiles(dims);
      setMode("view");
      setSelectedDeviceId(null);
      setPlaceDeviceSession({ payload, tilesX, tilesZ });
    });
    return off;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !placeDeviceSession) return;

    const ghost = createGhostMesh(placeDeviceSession.tilesX, placeDeviceSession.tilesZ);
    ghost.visible = false;
    sceneRef.current?.add(ghost);
    if (orbitRef.current) orbitRef.current.enabled = false;
    let lastHit = null;

    const onMove = (e) => {
      if (modeRef.current !== "view") return;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const dcGroup = scene?.getObjectByName("DataCenter");
      if (!camera || !dcGroup) return;
      const pt = groundPointFromClient(e.clientX, e.clientY, canvas, camera);
      if (!pt) return;
      const originX = dcGroup.userData.gridOriginX ?? 0;
      const originZ = dcGroup.userData.gridOriginZ ?? 0;
      const { tx, tz } = worldToAnchorTile(pt.x, pt.z, originX, originZ, placeDeviceSession.tilesX, placeDeviceSession.tilesZ);
      const center = tileAnchorToWorldCenter(tx, tz, placeDeviceSession.tilesX, placeDeviceSession.tilesZ, originX, originZ);
      ghost.position.set(center.x, FLOOR_Y + 0.02, center.z);
      ghost.visible = true;
      const bounds = buildBuildingTileBounds(dcGroup);
      const check = canPlaceDevice({ occupiedTiles: occupiedTilesRef.current, tx, tz, tilesX: placeDeviceSession.tilesX, tilesZ: placeDeviceSession.tilesZ, bounds, reservedTiles: reservedTilesRef.current });
      setGhostValidity(ghost, check.valid);
      setPlacementToast(check.valid ? null : { reason: check.reason, x: e.clientX, y: e.clientY });
      lastHit = { pt };
    };

    const onClick = () => {
      if (modeRef.current !== "view" || !lastHit) return;
      setDeviceDimsMm({
        length: placeDeviceSession.payload.defaultDimensions?.lengthMm || TILE_SIZE_MM,
        width: placeDeviceSession.payload.defaultDimensions?.widthMm || TILE_SIZE_MM,
      });
      setDeviceModal({ payload: placeDeviceSession.payload, x: lastHit.pt.x, z: lastHit.pt.z, roomId: null });
      setPlaceDeviceSession(null);
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("click", onClick);
      disposeGroup(ghost);
      if (orbitRef.current) orbitRef.current.enabled = true;
      setPlacementToast(null);
    };
  }, [placeDeviceSession]);

  // ── "Draw Room" tool ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let startPt = null;
    let previewGroup = null;

    const getGroundPoint = (e) => {
      const camera = cameraRef.current;
      if (!camera) return null;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pt);
      return pt;
    };

    const removePreview = () => {
      if (!previewGroup) return;
      previewGroup.parent?.remove(previewGroup);
      previewGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      previewGroup = null;
    };

    const onDown = (e) => {
      if (modeRef.current !== "drawRoom" || e.button !== 0) return;
      const pt = getGroundPoint(e);
      if (!pt) return;
      startPt = pt.clone();
      if (orbitRef.current) orbitRef.current.enabled = false;
    };

    const onMove = (e) => {
      if (modeRef.current !== "drawRoom" || !startPt) return;
      const pt = getGroundPoint(e);
      const scene = sceneRef.current;
      const dcGroup = scene?.getObjectByName("DataCenter");
      if (!pt || !scene) return;
      removePreview();

      const w = Math.max(0.2, Math.abs(pt.x - startPt.x));
      const d = Math.max(0.2, Math.abs(pt.z - startPt.z));
      const cx = (pt.x + startPt.x) / 2;
      const cz = (pt.z + startPt.z) / 2;

      const check = dcGroup ? checkRoomPlacement(scene, dcGroup, { cx, cz, w, l: d }, null) : { valid: true };
      const colorNum = check.valid ? 0x22c55e : 0xef4444;

      const geo = new THREE.PlaneGeometry(w, d);
      const mat = new THREE.MeshBasicMaterial({ color: colorNum, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx, FLOOR_Y + 0.05, cz);

      const edgesGeo = new THREE.EdgesGeometry(geo);
      const edges = new THREE.LineSegments(edgesGeo, new THREE.LineDashedMaterial({ color: colorNum, dashSize: 0.5, gapSize: 0.3 }));
      edges.computeLineDistances();
      edges.rotation.x = -Math.PI / 2;
      edges.position.set(cx, FLOOR_Y + 0.06, cz);

      const group = new THREE.Group();
      group.add(mesh);
      group.add(edges);
      group.userData.dims = { w, d, cx, cz, valid: check.valid, reason: check.reason };
      scene.add(group);
      previewGroup = group;

      // Live capacity read-out while the room is still being dragged out.
      const livePred = predictRoomCapacity(
        { id: "__draft", name: "Draft", type: "server", width: w, length: d, kw: 0 },
        0, capacityTuning.server || {},
      );

      setRoomDrawInfo({
        wMm: mToMm(w), dMm: mToMm(d),
        tilesX: Math.max(1, Math.ceil(mToMm(w) / TILE_SIZE_MM)),
        tilesZ: Math.max(1, Math.ceil(mToMm(d) / TILE_SIZE_MM)),
        valid: check.valid, reason: check.reason,
        predictedRacks: livePred.planned,
        predictedMax: livePred.geometricMax,
        x: e.clientX, y: e.clientY,
      });
    };

    const onUp = () => {
      if (modeRef.current !== "drawRoom" || !startPt) { startPt = null; return; }
      if (orbitRef.current) orbitRef.current.enabled = true;
      const dims = previewGroup?.userData.dims;
      removePreview();
      startPt = null;
      setRoomDrawInfo(null);
      if (!dims || dims.w < 0.5 || dims.d < 0.5) return;
      if (!dims.valid) {
        message.error(
          `Can't create this room: ${reasonText(dims.reason)} (${mToMm(dims.w)} × ${mToMm(dims.d)} mm). Draw a smaller area inside the floor.`
        );
        return;
      }
      setRoomDraft({
        width: Number(dims.w.toFixed(2)),
        length: Number(dims.d.toFixed(2)),
        posX: Number(dims.cx.toFixed(2)),
        posZ: Number(dims.cz.toFixed(2)),
        name: "",
        type: "server",
        kw: 0,
      });
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      removePreview();
      setRoomDrawInfo(null);
    };
  }, [capacityTuning]);

  // ── "Connect" tool ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let downPt = null;

    const getConnectTargetIdAt = (e) => {
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return null;
      const devicesGroup = scene.getObjectByName("DevicesGroup");
      if (!devicesGroup) return null;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = pickRaycaster();
      raycaster.setFromCamera(ndc, camera);

      // A rack slot's port wins over the whole rack -- it's a smaller, more
      // specific target, and it only counts while it is actually on screen
      // (RACK VIEW), so you naturally have to be able to see a port to wire
      // it. three r128 raycasts hidden meshes too, hence the explicit check:
      // without it every rack's hidden slot bodies would swallow the click.
      const portMeshes = [];
      devicesGroup.traverse((o) => { if (o.isMesh && o.userData?.isRackSlotPort && isShownInScene(o)) portMeshes.push(o); });
      const portHits = raycaster.intersectObjects(portMeshes, false);
      if (portHits.length) {
        const hit = portHits[0];
        const u = hit.object.userData;
        return makeEndpointId(u.rackDeviceId, u.slotId, portIdxFromHit(hit.object, hit.point));
      }

      const meshes = [];
      devicesGroup.traverse((o) => { if (o.isMesh && o.userData?.movableRoot) meshes.push(o); });
      const hits = raycaster.intersectObjects(meshes, false);
      return hits.length ? hits[0].object.userData.movableRoot.userData.deviceId : null;
    };

    const onDown = (e) => {
      if (modeRef.current !== "connect" || e.button !== 0) return;
      downPt = { x: e.clientX, y: e.clientY };
    };

    const onUp = (e) => {
      if (modeRef.current !== "connect" || e.button !== 0 || !downPt) { downPt = null; return; }
      const moved = Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y);
      downPt = null;
      if (moved > 6) return;

      const id = getConnectTargetIdAt(e);

      // ── Polygon routing, MS-Paint style ──
      // First click picks the source. Every click after that on empty floor
      // drops a vertex at the current route level. Clicking a second device
      // ends the run. The cable is exactly the polygon that was clicked —
      // nothing is smoothed, nothing is re-routed.
      if (!pendingConnectRef.current) {
        if (!id) return;                       // nothing to start from
        setRoutePoints([]);
        setPendingConnectDevice(id);
        return;
      }

      if (id && id !== pendingConnectRef.current) {
        setCableModal({
          fromId: pendingConnectRef.current, toId: id, type: "power",
          waypoints: routePointsRef.current.slice(),
        });
        setPendingConnectDevice(null);
        setRoutePoints([]);
        return;
      }

      if (id === pendingConnectRef.current) {   // clicked the source again: cancel
        setPendingConnectDevice(null);
        setRoutePoints([]);
        return;
      }

      // Empty floor: add a vertex at the level the route is currently running.
      const camera = cameraRef.current;
      if (!camera) return;
      const lvl = ROUTE_LEVELS.find((l) => l.key === routeLevelRef.current) || ROUTE_LEVELS[0];
      const pt = groundPointFromClient(e.clientX, e.clientY, canvas, camera, lvl.y);
      if (!pt) return;
      setRoutePoints((prev) => [...prev, { x: pt.x, y: lvl.y, z: pt.z }]);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, []);

  // ── "Simulate" tool: click a device to fail or restore it ──────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let downPt = null;

    const getDeviceRootAt = (e) => {
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return null;
      const devicesGroup = scene.getObjectByName("DevicesGroup");
      if (!devicesGroup) return null;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = pickRaycaster();
      raycaster.setFromCamera(ndc, camera);
      const meshes = [];
      devicesGroup.traverse((o) => { if (o.isMesh && o.userData?.movableRoot) meshes.push(o); });
      const hits = raycaster.intersectObjects(meshes, false);
      return hits.length ? hits[0].object.userData.movableRoot : null;
    };

    const onDown = (e) => {
      if (modeRef.current !== "simulate" || e.button !== 0) return;
      downPt = { x: e.clientX, y: e.clientY };
    };

    const onUp = (e) => {
      if (modeRef.current !== "simulate" || e.button !== 0 || !downPt) { downPt = null; return; }
      const moved = Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y);
      downPt = null;
      if (moved > 6) return;

      const root = getDeviceRootAt(e);
      if (!root) { setSelectedDeviceId(null); return; }
      const id = root.userData.deviceId;
      const dev = devicesRef.current.find((d) => d.id === id);
      setSelectedDeviceId(id);
      toggleFailure(id);
      if (dev) {
        const wasFailed = !!failures[id];
        message[wasFailed ? "success" : "warning"](
          wasFailed
            ? `${deviceLabel(dev)} restored — downstream devices will recover.`
            : `${deviceLabel(dev)} failed at T+${formatClock(simClockRef.current)} — watch the cascade.`
        );
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [toggleFailure, failures]);

  // Ring around the pending "first click" of a connection.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const devicesGroup = scene.getObjectByName("DevicesGroup");
    if (devicesGroup) {
      const stale = [];
      devicesGroup.traverse((o) => { if (o.name === "ConnectHighlightRing") stale.push(o); });
      stale.forEach((ring) => {
        ring.parent?.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
      });
    }
    if (!pendingConnectDevice || !devicesGroup) return;

    const { deviceId, slotId, portIdx } = parseEndpointId(pendingConnectDevice);
    const root = devicesGroup.children.find((c) => c.userData.deviceId === deviceId);
    if (!root) return;

    if (slotId) {
      let portMesh = null;
      root.traverse((o) => { if (!portMesh && o.userData?.isRackSlotPort && o.userData.slotId === slotId) portMesh = o; });
      if (!portMesh) return;
      // Sized to one port, not the whole slot, so you can see exactly which
      // socket the pending cable will land on.
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.012, 0.022, 20),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false }),
      );
      ring.name = "ConnectHighlightRing";
      const w = portMesh.geometry.parameters?.width || 0.4;
      ring.position.set(
        portIdx == null ? 0 : portOffsetAlongSlot(portIdx, w),
        0,
        -((portMesh.geometry.parameters?.depth || 0.1) / 2 + 0.01),
      );
      portMesh.add(ring);
      return;
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.62, 32),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
    );
    ring.name = "ConnectHighlightRing";
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.15, 0);
    root.add(ring);
  }, [pendingConnectDevice]);

  // Where a route visually starts from: the same port or device face the
  // finished cable will leave from, so the preview and the built cable agree.
  const resolveConnectAnchor = useCallback((endpointId) => {
    const scene = sceneRef.current;
    const devicesGroup = scene?.getObjectByName("DevicesGroup");
    if (!devicesGroup || !endpointId) return null;
    const { deviceId, slotId } = parseEndpointId(endpointId);
    const root = devicesGroup.children.find((c) => c.userData.deviceId === deviceId);
    if (!root) return null;

    if (slotId) {
      let portMesh = null;
      root.traverse((o) => {
        if (!portMesh && o.userData?.isRackSlotPort && o.userData.slotId === slotId) portMesh = o;
      });
      if (portMesh) return portMesh.getWorldPosition(new THREE.Vector3());
    }
    return new THREE.Vector3(
      root.position.x,
      root.position.y + (root.userData.heightM || DEVICE_HEIGHT_M) * 0.5,
      root.position.z,
    );
  }, []);

  // ── Live preview of the route being drawn ─────────────────────────────
  // Drawing blind would be unusable, so the vertices placed so far are drawn
  // as beads joined by straight runs, plus a rubber band from the last vertex
  // to the cursor. Rebuilt only when a vertex is added — the rubber band is
  // the only thing that follows the mouse, and it is a two-point line.
  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;

    const prev = scene.getObjectByName("RoutePreview");
    if (prev) { scene.remove(prev); disposeGroup(prev); }
    if (!pendingConnectDevice) return;

    const g = new THREE.Group();
    g.name = "RoutePreview";
    scene.add(g);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, transparent: true, opacity: 0.95, depthTest: false,
    });
    const ghostMat = new THREE.LineBasicMaterial({
      color: 0x22c55e, transparent: true, opacity: 0.7, depthTest: false,
    });

    const anchorGeom = resolveConnectAnchor(pendingConnectDevice);
    const pts = [];
    if (anchorGeom) pts.push(anchorGeom);
    routePoints.forEach((w) => pts.push(new THREE.Vector3(w.x, w.y, w.z)));

    // placed vertices + the straight runs between them
    pts.forEach((p, i) => {
      if (i > 0) {
        const from = pts[i - 1], len = from.distanceTo(p);
        if (len > 1e-4) {
          const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 6), mat);
          seg.position.copy(from).lerp(p, 0.5);
          seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0),
            new THREE.Vector3().subVectors(p, from).normalize());
          seg.renderOrder = 6;
          g.add(seg);
        }
      }
      if (i > 0) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat);
        bead.position.copy(p);
        bead.renderOrder = 7;
        g.add(bead);
      }
    });

    // the rubber band to the cursor
    const bandGeo = new THREE.BufferGeometry().setFromPoints([
      pts.length ? pts[pts.length - 1] : new THREE.Vector3(),
      pts.length ? pts[pts.length - 1] : new THREE.Vector3(),
    ]);
    const band = new THREE.Line(bandGeo, ghostMat);
    band.renderOrder = 6;
    band.frustumCulled = false;
    g.add(band);

    const onMove = (e) => {
      const camera = cameraRef.current;
      if (!camera || !pts.length) return;
      const lvl = ROUTE_LEVELS.find((l) => l.key === routeLevelRef.current) || ROUTE_LEVELS[0];
      const hit = groundPointFromClient(e.clientX, e.clientY, canvas, camera, lvl.y);
      if (!hit) return;
      const arr = bandGeo.attributes.position.array;
      const last = pts[pts.length - 1];
      arr[0] = last.x; arr[1] = last.y; arr[2] = last.z;
      arr[3] = hit.x;  arr[4] = lvl.y;  arr[5] = hit.z;
      bandGeo.attributes.position.needsUpdate = true;
    };
    canvas.addEventListener("pointermove", onMove);

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      const cur = sceneRef.current?.getObjectByName("RoutePreview");
      if (cur) { sceneRef.current.remove(cur); disposeGroup(cur); }
    };
  }, [pendingConnectDevice, routePoints, ROUTE_LEVELS, resolveConnectAnchor]);

  // Backspace undoes the last vertex; Escape abandons the whole route.
  useEffect(() => {
    if (!pendingConnectDevice) return;
    const onKey = (e) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        setRoutePoints((p) => p.slice(0, -1));
      } else if (e.key === "Escape") {
        setPendingConnectDevice(null);
        setRoutePoints([]);
      } else if (e.key >= "1" && e.key <= "3") {
        setRouteLevel(ROUTE_LEVELS[Number(e.key) - 1].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingConnectDevice, ROUTE_LEVELS]);

  // ── Double-click a device to open Properties ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDblClick = (e) => {
      if (modeRef.current !== "view") return;
      // Two quick clicks while handling a cable are cable clicks.
      if (cableHandRef.current || portPickModeRef.current) return;
      // Already showing an elevation dialog, or one just closed under the
      // cursor -- either way this double-click is not a request to open
      // another one.
      if (rackElevationOpenRef.current) return;
      if (performance.now() - rackElevationClosedAtRef.current < 500) return;
      if (window.__RACK_DBG) {
        console.log("[RackDBG] dblclick", {
          t: Math.round(performance.now()),
          detail: e.detail,
          dialogs: document.querySelectorAll(".ant-modal").length,
          canvases: document.querySelectorAll("canvas").length,
        });
      }
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return;
      const devicesGroup = scene.getObjectByName("DevicesGroup");
      if (!devicesGroup) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = pickRaycaster();
      raycaster.setFromCamera(ndc, camera);
      const meshes = [];
      devicesGroup.traverse((o) => { if (o.isMesh && o.userData?.movableRoot) meshes.push(o); });
      const hits = raycaster.intersectObjects(meshes, false);
      if (!hits.length) return;
      const movableRoot = hits[0].object.userData.movableRoot;
      const id = movableRoot.userData.deviceId;
      setSelectedDeviceId(id);
      const dev = devicesRef.current.find((d) => d.id === id);
      // A rack opens its front/back elevation editor instead of the plain
      // dimension-editing Properties modal — that's what's actually useful
      // for a rack (add/remove devices per U), and it's what got asked for.
      if (movableRoot.userData.isRackBody) {
        const rt = rackRuntimeRef.current.get(id);
        if (rt && dev) {
          // Set synchronously, not via the effect below: two dblclick events
          // dispatched in the same tick would both still see `false` if this
          // only flipped after the next render.
          rackElevationOpenRef.current = true;
          // Keep the same object when the dialog is already showing this
          // rack. A fresh object every time makes the modal treat it as a
          // different rack and reload -- which is what made one double-tap
          // look like the dialog opening twice.
          //
          // This stays synchronous on purpose. Deferring it a frame was
          // tried to shorten the handler, but the dialog now costs almost
          // nothing to open (forceRender builds it once at mount instead of
          // on every double-click), and a deferred open would simply never
          // arrive in a background tab where rAF does not run.
          setRackElevation((prev) => (
            prev && prev.id === id && prev.totalUnitsU === rt.dims.totalUnitsU
              ? prev
              : { id, name: deviceLabel(dev), typeName: dev.name, totalUnitsU: rt.dims.totalUnitsU }
          ));
        }
        return;
      }
      if (dev) setPropertiesModal({ id, length: dev.dimensions.lengthMm, width: dev.dimensions.widthMm, height: dev.dimensions.heightMm });
    };
    canvas.addEventListener("dblclick", onDblClick);
    return () => canvas.removeEventListener("dblclick", onDblClick);
  }, []);

  // ── Right-click: perforated tiles, cable delete, room resize handles ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeHandles = null;
    let session = null;

    const clearHandles = () => {
      if (!resizeHandles) return;
      disposeGroup(resizeHandles.group);
      resizeHandles = null;
    };

    const endSession = (commit) => {
      if (!session) return;
      const s = session;
      session = null;
      disposeGroup(s.ghost);
      if (s.roomGroup) s.roomGroup.visible = true;
      if (s.marginGroup) s.marginGroup.visible = true;
      if (orbitRef.current) orbitRef.current.enabled = true;
      setPlacementToast(null);
      setRoomDrawInfo(null);
      if (commit && s.lastValid && s.changed) {
        dcimBus.emit("updateRoom", {
          id: s.roomId,
          width: s.lastRect.w, length: s.lastRect.l,
          posX: s.lastRect.cx, posZ: s.lastRect.cz,
        });
      }
      clearHandles();
    };
    cancelResizeSessionRef.current = () => {
      if (session) { endSession(false); return true; }
      if (resizeHandles) { clearHandles(); return true; }
      return false;
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return;
      if (session) return;
      // Nothing to edit from RACK VIEW -- the floor it would edit is hidden.
      if (rackViewIdRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);

      const wiringGroup = scene.getObjectByName("WiringGroup");
      if (wiringGroup) {
        const wireMeshes = [];
        wiringGroup.traverse((o) => { if (o.isMesh && o.userData?.wireId) wireMeshes.push(o); });
        const wireHits = raycaster.intersectObjects(wireMeshes, false);
        if (wireHits.length) {
          const wireId = wireHits[0].object.userData.wireId;
          // A run that is a RACK VIEW patch cord goes with its cord.
          const cordId = connectionsRef.current.find((c) => c.id === wireId)?.patchCordId;
          if (cordId) patchCordStore.remove(cordId);
          connectionsRef.current = connectionsRef.current.filter((c) => c.id !== wireId);
          bumpConnections();
          rebuildWiring();
          return;
        }
      }

      const roomsGroup = scene.getObjectByName("RoomsGroup");
      if (!roomsGroup) return;

      const perfGroup = scene.getObjectByName("PerfTilesGroup");
      if (perfGroup) {
        const tileMeshes = [];
        perfGroup.traverse((o) => { if (o.isMesh && o.userData?.perfTileId) tileMeshes.push(o); });
        const tileHits = raycaster.intersectObjects(tileMeshes, false);
        if (tileHits.length) {
          clearHandles();
          const delId = tileHits[0].object.userData.perfTileId;
          setPerfTiles((prev) => prev.filter((t) => t.id !== delId));
          return;
        }
      }

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, pt);
      if (!pt) return;

      const BORDER_ZONE_M = 0.4;
      let borderRoom = null;
      roomsGroup.children.forEach((child) => {
        if (!child.name?.startsWith("Room_")) return;
        const center = child.userData.roomCenter;
        const dims = child.userData.roomDims;
        if (!center || !dims) return;
        const withinX = pt.x >= center.x - dims.w / 2 - BORDER_ZONE_M && pt.x <= center.x + dims.w / 2 + BORDER_ZONE_M;
        const withinZ = pt.z >= center.z - dims.l / 2 - BORDER_ZONE_M && pt.z <= center.z + dims.l / 2 + BORDER_ZONE_M;
        if (!withinX || !withinZ) return;
        const dW = Math.abs(pt.x - (center.x - dims.w / 2));
        const dE = Math.abs(pt.x - (center.x + dims.w / 2));
        const dN = Math.abs(pt.z - (center.z - dims.l / 2));
        const dS = Math.abs(pt.z - (center.z + dims.l / 2));
        if (Math.min(dW, dE, dN, dS) > BORDER_ZONE_M) return;
        borderRoom = child;
      });

      if (borderRoom) {
        clearHandles();
        const { w, l } = borderRoom.userData.roomDims;
        const { x, z } = borderRoom.userData.roomCenter;
        const group = createResizeHandleGroup(w, l);
        group.position.set(x, 0, z);
        scene.add(group);
        resizeHandles = { roomId: borderRoom.userData.roomId, group };
        message.info("Drag a handle to resize — right-click elsewhere or press Escape to cancel.");
        return;
      }

      clearHandles();
      let targetRoom = null;
      roomsGroup.children.forEach((child) => {
        if (!child.name?.startsWith("Room_")) return;
        const center = child.userData.roomCenter;
        const dims = child.userData.roomDims;
        if (!center || !dims) return;
        if (Math.abs(pt.x - center.x) <= dims.w / 2 && Math.abs(pt.z - center.z) <= dims.l / 2) {
          targetRoom = child;
        }
      });
      if (!targetRoom) return;

      if (targetRoom.userData.roomType === "corridor") {
        message.warning("Corridors are walkways — perforated tiles can't be cut into a corridor floor.");
        return;
      }

      const dcGroup = scene.getObjectByName("DataCenter");
      const originX = dcGroup?.userData.gridOriginX ?? 0;
      const originZ = dcGroup?.userData.gridOriginZ ?? 0;
      const { tx: perfTx, tz: perfTz } = worldToTile(pt.x, pt.z, originX, originZ);
      const tileKey = `${perfTx},${perfTz}`;

      const occupantId = occupiedTilesRef.current.get(tileKey);
      if (occupantId) {
        const occupant = devicesRef.current.find((d) => d.id === occupantId);
        message.warning(
          `This tile is occupied by ${occupant?.name || "a device"} — move it first, then cut the perforated tile.`
        );
        return;
      }

      if (gateTileKeysRef.current.includes(tileKey)) {
        message.warning("This tile is part of the entrance clearance and has to stay solid.");
        return;
      }

      const roomId = targetRoom.userData.roomId;
      setPerfTiles((prev) => {
        if (prev.some((t) => t.tx === perfTx && t.tz === perfTz)) return prev;
        return [...prev, { id: `perf_${perfTileIdRef.current++}`, roomId, tx: perfTx, tz: perfTz }];
      });
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 || !resizeHandles || session) return;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const meshes = [];
      resizeHandles.group.traverse((o) => { if (o.isMesh && o.userData?.resizeHandle) meshes.push(o); });
      const hits = raycaster.intersectObjects(meshes, false);
      if (!hits.length) return;

      const roomId = resizeHandles.roomId;
      const roomRoot = scene.getObjectByName(`Room_${roomId}`);
      if (!roomRoot) return;
      const center0 = { ...roomRoot.userData.roomCenter };
      const dims0 = roomRoot.userData.roomDims;

      const contained = devicesRef.current
        .filter((dev) => Math.abs(dev.position.x - center0.x) <= dims0.w / 2 && Math.abs(dev.position.z - center0.z) <= dims0.l / 2)
        .map((dev) => ({ position: dev.position }));

      session = {
        roomId, edge: hits[0].object.userData.resizeHandle,
        center0, w0: dims0.w, l0: dims0.l,
        roomGroup: roomRoot,
        marginGroup: scene.getObjectByName(`Margin_${roomId}`),
        contained,
        lastValid: true, changed: false,
        lastRect: { cx: center0.x, cz: center0.z, w: dims0.w, l: dims0.l },
        ghost: null,
        roomType: roomRoot.userData.roomType,
      };
      session.ghost = createRoomGhostOutline(dims0.w, dims0.l);
      session.ghost.position.set(center0.x, 0, center0.z);
      scene.add(session.ghost);
      session.roomGroup.visible = false;
      if (session.marginGroup) session.marginGroup.visible = false;
      if (orbitRef.current) orbitRef.current.enabled = false;
    };

    const onPointerMove = (e) => {
      if (!session) return;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const dcGroup = scene?.getObjectByName("DataCenter");
      if (!camera || !scene || !dcGroup) return;
      const pt = groundPointFromClient(e.clientX, e.clientY, canvas, camera);
      if (!pt) return;

      const r = computeResizeRect(session.edge, session.center0, session.w0, session.l0, pt);

      const roomCheck = checkRoomPlacement(scene, dcGroup, { cx: r.center.x, cz: r.center.z, w: r.w, l: r.l }, session.roomId);
      let devicesValid = true;
      let failReason = roomCheck.reason;
      for (const c of session.contained) {
        if (Math.abs(c.position.x - r.center.x) > r.w / 2 || Math.abs(c.position.z - r.center.z) > r.l / 2) {
          devicesValid = false;
          failReason = "DEVICE_WOULD_BE_OUTSIDE";
          break;
        }
      }
      const valid = roomCheck.valid && devicesValid;

      session.lastValid = valid;
      session.changed = Math.abs(r.w - session.w0) > 0.01 || Math.abs(r.l - session.l0) > 0.01;
      session.lastRect = { cx: r.center.x, cz: r.center.z, w: r.w, l: r.l };

      disposeGroup(session.ghost);
      session.ghost = createRoomGhostOutline(r.w, r.l);
      session.ghost.position.set(r.center.x, 0, r.center.z);
      setGhostValidity(session.ghost, valid);
      scene.add(session.ghost);

      resizeHandles.group.position.set(r.center.x, 0, r.center.z);
      positionResizeHandles(resizeHandles.group, r.w, r.l);

      // Live capacity read-out while resizing, in this room's own type.
      const livePred = predictRoomCapacity(
        { id: session.roomId, name: "", type: session.roomType || "server", width: r.w, length: r.l, kw: 0 },
        0, capacityTuning[session.roomType || "server"] || {},
      );

      setPlacementToast(valid ? null : { reason: failReason, x: e.clientX, y: e.clientY });
      setRoomDrawInfo({
        wMm: mToMm(r.w), dMm: mToMm(r.l),
        tilesX: Math.max(1, Math.ceil(mToMm(r.w) / TILE_SIZE_MM)),
        tilesZ: Math.max(1, Math.ceil(mToMm(r.l) / TILE_SIZE_MM)),
        valid, reason: failReason,
        predictedRacks: livePred.nonPlaceable ? null : livePred.planned,
        predictedMax: livePred.nonPlaceable ? null : livePred.geometricMax,
        x: e.clientX, y: e.clientY,
      });
    };

    const onPointerUp = () => {
      if (!session) return;
      endSession(true);
    };

    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    return () => {
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      endSession(false);
      clearHandles();
      cancelResizeSessionRef.current = () => false;
    };
  }, [theme, rebuildWiring, bumpConnections, rebuildReservedTiles, capacityTuning]);

  const handleSetMode = useCallback((next) => {
    cancelActiveSessionRef.current?.();
    cancelResizeSessionRef.current?.();
    setPlaceDeviceSession(null);
    setSelectedDeviceId(null);
    setMode(next);
    setPendingConnectDevice(null);
    if (next === "simulate") setTrackerOpen(true);
  }, []);

  const antdConfig = useMemo(() => ({
    algorithm: isDark ? antdTheme?.darkAlgorithm : antdTheme?.defaultAlgorithm,
    token: {
      colorPrimary: T.accent,
      colorInfo: T.accent,
      colorSuccess: T.ok,
      colorWarning: T.warn,
      colorError: T.critical,
      colorBgElevated: T.bgSecondary,
      colorBgContainer: isDark ? T.bgTertiary : "#ffffff",
      colorBorder: T.borderDefault,
      colorText: T.textPrimary,
      colorTextSecondary: T.textSecondary,
      borderRadius: 6,
      fontFamily: UI_FONT,
      fontSize: 13,
    },
  }), [isDark, T]);

  const totalKw = rooms.reduce((s, r) => s + (r.kw || 0), 0);
  const modeMeta = mode === "drawRoom"
    ? { label: "Draw Room", color: T.ok, hint: "Click-drag on the floor to sketch a room — the badge predicts how many racks it will hold as you drag" }
    : mode === "connect"
      ? { label: "Connect", color: T.indigo, hint: "Click a device, then another, to run a cable · right-click a cable to remove it" }
      : mode === "simulate"
        ? { label: "Simulate", color: T.critical, hint: "Click any device to fail it — power, cooling and network cascades are priced live in the tracker" }
        : null;

  const selectedState = selectedDeviceId ? impactReport?.devices.get(selectedDeviceId) : null;
  const selectedFailed = selectedDeviceId ? !!failures[selectedDeviceId] : false;

  return (
    <ConfigProvider theme={antdConfig}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes alarmPulse { 0%,100% { box-shadow: 0 0 0 0 ${T.critical}00; } 50% { box-shadow: 0 0 0 5px ${T.critical}22; } }
        .dcim-view { --bg-primary:${T.bgPrimary}; --bg-secondary:${T.bgSecondary};
          --bg-tertiary:${T.bgTertiary}; --bg-elevated:${T.bgElevated};
          --border-subtle:${T.borderSubtle}; --border-default:${T.borderDefault};
          --text-primary:${T.textPrimary}; --text-secondary:${T.textSecondary};
          --text-muted:${T.textMuted}; --accent-primary:${T.accent}; --status-ok:${T.ok}; }
        .dcim-view ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dcim-view ::-webkit-scrollbar-track { background: transparent; }
        .dcim-view ::-webkit-scrollbar-thumb { background: ${T.borderDefault}; border-radius: 4px; }
        .dcim-view ::-webkit-scrollbar-thumb:hover { background: ${T.borderStrong}; }
      `}</style>

      <div
        className="dcim-view"
        data-theme={theme}
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          position: "relative", background: T.bgPrimary, color: T.textPrimary,
          fontFamily: UI_FONT, fontSize: 13, animation: "fadeIn 0.2s ease",
        }}
      >

        {/* ══ Header ══════════════════════════════════════════════════════ */}
        <header style={{
          height: 48, flexShrink: 0,
          background: T.bgSecondary,
          borderBottom: `1px solid ${T.borderSubtle}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px 0 10px", zIndex: 30,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {onBack && (
              <ToolButton
                T={T}
                icon={<ArrowLeftOutlined style={{ fontSize: 12 }} />}
                label="BACK"
                title="Back to facility list (Esc)"
                onClick={onBack}
              />
            )}
            <div style={{ width: 1, height: 22, background: T.borderSubtle }} />
            <ThunderboltOutlined style={{ fontSize: 16, color: T.accent }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 8,
                color: T.textPrimary, fontWeight: 600, fontSize: 14, letterSpacing: "0.03em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {dc?.dataCenterName || "Data Center"}
                <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Digital Twin
                </span>
              </div>
            </div>
            {dc?.dataCenterCode && (
              <span style={{
                fontSize: 10, fontFamily: MONO_FONT, color: T.textMuted,
                border: `1px solid ${T.borderSubtle}`, borderRadius: 4, padding: "2px 6px",
              }}>
                {dc.dataCenterCode}
              </span>
            )}
            {failedCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 10, fontFamily: MONO_FONT, fontWeight: 600, color: T.critical,
                border: `1px solid ${T.critical}55`, background: `${T.critical}14`,
                borderRadius: 4, padding: "2px 7px", animation: "alarmPulse 1.8s ease-in-out infinite",
              }}>
                <WarningOutlined style={{ fontSize: 10 }} />
                {failedCount} FAILED · {formatCurrency(impactReport?.totals.total || 0)}
              </span>
            )}
            {hotspotOpen && hotspotStats && hotspotStats.peakC >= HOTSPOT_WARN_C && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 10, fontFamily: MONO_FONT, fontWeight: 600,
                color: hotspotStats.peakC >= HOTSPOT_CRITICAL_C ? T.critical : T.warn,
                border: `1px solid ${hotspotStats.peakC >= HOTSPOT_CRITICAL_C ? T.critical : T.warn}55`,
                background: `${hotspotStats.peakC >= HOTSPOT_CRITICAL_C ? T.critical : T.warn}14`,
                borderRadius: 4, padding: "2px 7px",
              }}>
                <FireOutlined style={{ fontSize: 10 }} />
                THERMAL {hotspotStats.peakC.toFixed(1)}°C{hotspotStats.peakRoomName ? ` · ${hotspotStats.peakRoomName}` : ""}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <ToolButton
              T={T} icon={<AppstoreOutlined style={{ fontSize: 12 }} />} label="TOOLBOX"
              title="Open the device & room toolbox" active={toolboxOpen}
              onClick={() => setToolboxOpen((p) => !p)}
            />
            <LayersButton open={layersOpen} onClick={() => setLayersOpen((p) => !p)} T={T} />
            <div style={{ width: 1, height: 22, background: T.borderSubtle, margin: "0 4px" }} />
            <ToolButton
              T={T} icon={<ApiOutlined style={{ fontSize: 12 }} />} label="GUIDE"
              accent="#22d3ee" active={guideOpen}
              title="Deployment Guide — the Tier III power and network chains as a live checklist: what is placed, what is missing, and what comes next"
              onClick={() => setGuideOpen((p) => !p)}
            />
            <ToolButton
              T={T} icon={<DatabaseOutlined style={{ fontSize: 12 }} />} label="STORAGE"
              accent={T.ok} active={storageOn}
              title="Storage — paints every cabinet by what is actually in it, U by U: green free, red occupied, blue reserved"
              onClick={() => setStorageOn((p) => !p)}
            />
            <ToolButton
              T={T} icon={<FundProjectionScreenOutlined style={{ fontSize: 12 }} />} label="TRACKER"
              accent={T.violet} active={trackerOpen}
              title="Failure Impact Tracker — run the clock, fail devices, and watch downtime, thermal ramp and cost accumulate"
              onClick={() => setTrackerOpen((p) => !p)}
            />
            <ToolButton
              T={T} icon={<WarningOutlined style={{ fontSize: 12 }} />} label="SIMULATE"
              danger={mode === "simulate"} accent={T.critical} active={mode === "simulate"}
              title="Simulate mode — click any device on the floor to take it offline (or bring it back)"
              onClick={() => handleSetMode(mode === "simulate" ? "view" : "simulate")}
            />
            <ToolButton
              T={T} icon={<DiffOutlined style={{ fontSize: 12 }} />} label="COMPARE"
              accent={T.accent} active={compareOpen}
              title="Compare views — capture the normal view and as many simulated views as you like, then compare them: devices affected, time and cost"
              onClick={() => setCompareOpen((p) => !p)}
            />
            <div style={{ width: 1, height: 22, background: T.borderSubtle, margin: "0 4px" }} />
            <ToolButton
              T={T} icon={<UndoOutlined style={{ fontSize: 12 }} />} title="Undo (Ctrl+Z)"
              disabled={!canUndo} onClick={undo}
            />
            <ToolButton
              T={T} icon={<RedoOutlined style={{ fontSize: 12 }} />} title="Redo (Ctrl+Y)"
              disabled={!canRedo} onClick={redo}
            />
            <div style={{ width: 1, height: 22, background: T.borderSubtle, margin: "0 4px" }} />
            <ToolButton
              T={T}
              icon={isDark ? <BulbOutlined style={{ fontSize: 12 }} /> : <BulbFilled style={{ fontSize: 12 }} />}
              label={isDark ? "LIGHT" : "DARK"}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={handleToggleTheme}
            />
          </div>
        </header>

        <Toolbox
          open={toolboxOpen}
          onClose={() => setToolboxOpen(false)}
          anchorX={12}
          rooms={rooms}
          onAddRoom={handleAddRoom}
          onDeleteRoom={handleDeleteRoom}
          onViewRoom={handleViewRoom}
          mode={mode}
          onSetMode={handleSetMode}
        />

        <LayersPanel
          open={layersOpen}
          layers={layers}
          onChange={setLayers}
          T={T}
          isDark={isDark}
        />

        {/* ══ Body: viewport ═══════════════════════════════════════════ */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          <div ref={stageRef} style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
            {loading && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", background: T.loadingBg, zIndex: 100,
              }}>
                <div style={{
                  fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
                  color: T.accent, fontWeight: 600, marginBottom: 10,
                }}>
                  Digital Twin
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>
                  {dc?.dataCenterName || "Data Center"}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 24, fontFamily: MONO_FONT }}>
                  {clampedLength.toFixed(1)} m × {clampedBreadth.toFixed(1)} m
                </div>
                <div style={{
                  width: 34, height: 34, border: `3px solid ${T.borderSubtle}`,
                  borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.85s linear infinite",
                }} />
                <div style={{
                  color: T.textSecondary, fontWeight: 500, fontSize: 12, marginTop: 16,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  Building scene
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              style={{
                width: "100%", height: "100%", display: "block",
                cursor: placeDeviceSession ? "crosshair"
                  : mode === "drawRoom" ? "crosshair"
                    : mode === "connect" ? "pointer"
                      : mode === "simulate" ? "pointer" : "default",
              }}
            />

            {/* ── Facility card ── */}
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 45, width: 186,
              background: T.bgSecondary, border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
            }}>
              <SectionLabel T={T} text="Facility" style={{ padding: "0 0 6px" }} />
              <PropertyRow T={T} label="Rooms" value={String(rooms.filter((r) => r.type !== "corridor").length)} mono
                valueColor={rooms.length ? T.ok : T.textMuted} />
              <PropertyRow T={T} label="Devices" value={String(devices.length)} mono
                valueColor={devices.length ? T.accent : T.textMuted} />
              <PropertyRow T={T} label="Cables" value={String(connectionsRef.current.length)} mono />
              <PropertyRow T={T} label="Load" value={`${totalKw} kW`} mono valueColor={totalKw ? T.warn : T.textMuted} />
              <PropertyRow T={T} label="Planned cap."
                value={`${predictions.reduce((s, p) => s + (p.planned || 0), 0)} units`} mono
                valueColor={T.ok} />
            </div>

            {/* ── RACK VIEW panel: which rack, what is in it, how it is cabled ── */}
            {rackViewId && (() => {
              const dev = devices.find((d) => d.id === rackViewId);
              if (!dev) return null;
              const idx = rackViewRacks.findIndex((d) => d.id === rackViewId);
              const s = rackViewInfo && rackViewInfo.id === rackViewId ? rackViewInfo.summary : null;
              const occ = s ? [
                { key: "used", n: s.usedU, st: STORAGE_STATE.used },
                { key: "reserved", n: s.reservedU, st: STORAGE_STATE.reserved },
                { key: "free", n: s.freeU, st: STORAGE_STATE.free },
              ] : [];
              const step = (dir) => {
                const n = rackViewRacks.length;
                if (!n) return;
                openRackView(rackViewRacks[(Math.max(0, idx) + dir + n) % n].id);
              };
              const roles = RACK_CABLE_ROLES.filter((r) => (
                r.key === "powerA" || r.key === "powerB"
                  ? (s?.powerCords || 0) > 0
                  : (s?.links?.[r.key] || 0) > 0
              ));
              const navBtn = {
                width: 24, height: 24, flexShrink: 0, cursor: "pointer", borderRadius: 5,
                border: `1px solid ${T.borderDefault}`, background: "transparent",
                color: T.textSecondary, fontSize: 14, lineHeight: "20px", padding: 0,
              };
              return (
                <div style={{
                  position: "absolute", top: 196, left: 12, zIndex: 46, width: 266,
                  // stops short of the RACK U control in the bottom-left corner
                  maxHeight: "calc(100% - 262px)", overflowY: "auto",
                  background: T.bgSecondary, border: `1px solid ${T.accent}66`,
                  borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <PictureOutlined style={{ fontSize: 11, color: T.accent }} />
                    <SectionLabel T={T} text="Rack View" style={{ padding: 0 }} />
                    <Tooltip title="Leave RACK VIEW (Esc)" zIndex={RV_POPUP_Z}>
                      <button onClick={closeRackView} style={{ ...navBtn, marginLeft: "auto", width: 22, height: 22, fontSize: 11 }}>
                        <CloseOutlined />
                      </button>
                    </Tooltip>
                  </div>

                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button style={navBtn} title="Previous rack" onClick={() => step(-1)}>‹</button>
                    <Select
                      size="small"
                      value={rackViewId}
                      onChange={(v) => openRackView(v)}
                      showSearch
                      optionFilterProp="label"
                      style={{ flex: 1, minWidth: 0 }}
                      getPopupContainer={() => document.body}
                      dropdownStyle={{ zIndex: RV_POPUP_Z }}
                      listHeight={260}
                      options={rackViewRacks.map((d) => ({ value: d.id, label: deviceLabel(d) }))}
                    />
                    <button style={navBtn} title="Next rack" onClick={() => step(1)}>›</button>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.textMuted, margin: "6px 0 8px" }}>
                    {dev.name}{s ? ` · ${s.totalU}U` : ""}
                  </div>

                  {s ? (
                    <>
                      {/* U by U: occupied / reserved / free -- same colours as STORAGE */}
                      <div style={{
                        display: "flex", height: 10, borderRadius: 5, overflow: "hidden",
                        border: `1px solid ${T.borderSubtle}`, marginBottom: 6,
                      }}>
                        {occ.filter((o) => o.n > 0).map((o) => (
                          <div key={o.key} title={`${o.st.label} ${o.n}U`}
                            style={{ flex: o.n, background: o.st.hex }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        {occ.map((o) => (
                          <span key={o.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: T.textSecondary }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: o.st.hex }} />
                            {o.st.label}
                            <b style={{ fontFamily: MONO_FONT, color: T.textPrimary, fontWeight: 600 }}>{o.n}U</b>
                          </span>
                        ))}
                      </div>
                      <PropertyRow T={T} label="Servers" value={String(s.servers + s.devices)} mono valueColor={T.accent} />
                      <PropertyRow T={T} label="Network gear" value={String(s.network)} mono />
                      <PropertyRow T={T} label="Reserved blocks" value={String(s.reserved)} mono valueColor={STORAGE_STATE.reserved.hex} />
                      <PropertyRow T={T} label="Patch / power cords" value={`${s.patchCords} / ${s.powerCords}`} mono />
                      {s.crossRack > 0 && (
                        <PropertyRow T={T} label="To other racks / devices" value={String(s.crossRack)} mono valueColor={T.accent} />
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 10.5, color: T.textMuted, padding: "4px 0 8px" }}>Loading rack contents…</div>
                  )}

                  <div style={{ display: "flex", gap: 4, margin: "9px 0 2px" }}>
                    {[["front", "FRONT"], ["rear", "REAR"], ["rear34", "3D REAR"]].map(([k, lbl]) => (
                      <ToolButton key={k} T={T} label={lbl} active={rackViewFace === k} accent={T.accent}
                        title={k === "front" ? "Look at the front (cold aisle)" : k === "rear" ? "Look straight at the rear, where the cabling is" : "Three-quarter view of the rear"}
                        onClick={() => frameRackView(rackViewId, k)} />
                    ))}
                  </div>

                  {roles.length > 0 && (
                    <>
                      <div style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted, letterSpacing: 0.5, margin: "8px 0 4px" }}>
                        REAR CABLING
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 8, rowGap: 3 }}>
                        {roles.map((r) => (
                          <span key={r.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textSecondary, minWidth: 0 }}>
                            <span style={{
                              width: 14, height: 4, borderRadius: 2, flexShrink: 0, background: r.hex,
                              boxShadow: `0 0 0 1px ${T.borderSubtle}`,
                            }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ display: "flex", gap: 4, margin: "9px 0 0" }}>
                    <ToolButton T={T} label={portPickMode ? "NEW CABLE: PICK TYPE & PORT…" : "+ NEW CABLE"} active={portPickMode} accent={T.ok}
                      title="Run a new cable: pick its type (network, fibre or power) in the box at the bottom — the free ports that take it light up green — then click the one it starts from."
                      disabled={!!cableHand}
                      onClick={() => {
                        const on = !portPickModeRef.current;
                        setPortPickMode(on);
                        // the ports are at the back
                        if (on && rackViewFaceRef.current === "front") frameRackView(rackViewId, "rear34");
                      }} />
                  </div>

                  <div style={{
                    marginTop: 8, paddingTop: 7, borderTop: `1px solid ${T.borderSubtle}`,
                    fontSize: 9.5, color: T.textMuted, lineHeight: 1.45,
                  }}>
                    <b style={{ color: T.textSecondary }}>Long-press a cable</b> to take hold of it — a <b style={{ color: T.textSecondary }}>CABLE IN HAND</b> box opens at the bottom. Click a <b style={{ color: T.ok }}>green dot</b> to plug it in, or pick <b style={{ color: T.textSecondary }}>Another rack…</b> in that box and click a dot there.{" "}
                    <b style={{ color: T.textSecondary }}>+ NEW CABLE</b> runs a new one: pick network, fibre or power first — APP servers keep NIC 4–6 free for this ·{" "}<b style={{ color: T.textSecondary }}>Double-click</b> the rack to edit its U-slots · <b style={{ color: T.textSecondary }}>Esc</b> to leave.
                  </div>
                </div>
              );
            })()}

            {/* ── RACK VIEW: + NEW CABLE — pick its type, then the port it starts from ── */}
            {rackViewId && portPickMode && !cableHand && (() => {
              const cur = RACK_CABLE_ROLES.find((r) => r.key === newCableRole) || RACK_CABLE_ROLES[0];
              const curMedium = roleMedium(cur.key);
              const goesTo = curMedium === "power"
                ? `PSUs and PDU-${cur.key === "powerA" ? "A" : "B"} outlets`
                : CABLE_TYPE_GROUPS.find((gp) => gp.medium === curMedium)?.goesTo;
              const stepLbl = { fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted, letterSpacing: 0.5 };
              return (
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 50,
                  background: T.bgSecondary, border: `1px solid ${T.ok}`, borderRadius: 10,
                  padding: "9px 12px", boxShadow: T.shadow, width: "min(660px, calc(100% - 330px))", minWidth: 380,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <span style={{ width: 22, height: 6, borderRadius: 3, background: cur.hex, boxShadow: `0 0 0 1px ${T.textMuted}` }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textSecondary }}>
                      New cable
                    </span>
                    <span style={{ fontSize: 11, color: T.textPrimary, fontWeight: 600 }}>{cur.label}</span>
                    <span style={{ fontSize: 10, color: T.textMuted, marginLeft: "auto", fontFamily: MONO_FONT }}>Esc · cancel</span>
                  </div>
                  {/* The cable type: one dropdown, grouped Network / Fibre /
                      Power. It opens by itself; typing filters it. */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={stepLbl}>1 · CABLE TYPE</span>
                    <Select
                      size="small"
                      value={newCableRole}
                      onChange={setNewCableRole}
                      defaultOpen
                      autoFocus
                      showSearch
                      filterOption={(input, opt) => (opt?.search || "").includes(input.trim().toLowerCase())}
                      style={{ width: 216 }}
                      getPopupContainer={() => document.body}
                      dropdownStyle={{ zIndex: RV_POPUP_Z }}
                      listHeight={400}
                      options={CABLE_TYPE_GROUPS.map((gp) => ({
                        label: gp.label,
                        title: gp.label,
                        search: `${gp.label} ${gp.medium}`.toLowerCase(),
                        options: rolesForMedium(gp.medium).map((r) => ({
                          value: r.key,
                          search: `${r.label} ${gp.label} ${gp.medium}`.toLowerCase(),
                          label: (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                              <span style={{ width: 16, height: 5, borderRadius: 3, flexShrink: 0, background: r.hex, boxShadow: `0 0 0 1px ${T.textMuted}` }} />
                              {r.label}
                            </span>
                          ),
                        })),
                      }))}
                    />
                    <span style={{ fontSize: 10.5, color: T.textMuted }}>plugs into {goesTo}</span>
                  </div>
                  <div style={{ ...stepLbl, marginTop: 8 }}>2 · WHERE IT STARTS</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, flex: 1, minWidth: 220 }}>
                      {pickFreeCount > 0
                        ? <>Click a <b style={{ color: T.ok }}>green dot</b> — {pickFreeCount} free {pickFreeCount === 1 ? "port" : "ports"} here take this cable ({goesTo}).</>
                        : <>No free port in this rack takes this cable ({goesTo}) — pick another type or another rack.</>}
                    </span>
                    {rackViewRacks.length > 1 && (
                      <Select
                        size="small"
                        showSearch
                        optionFilterProp="label"
                        placeholder="Another rack…"
                        value={null}
                        onChange={(v) => openRackView(v)}
                        style={{ width: 150 }}
                        getPopupContainer={() => document.body}
                        dropdownStyle={{ zIndex: RV_POPUP_Z }}
                        listHeight={220}
                        options={rackViewRacks.filter((d) => d.id !== rackViewId).map((d) => ({ value: d.id, label: deviceLabel(d) }))}
                      />
                    )}
                    <button onClick={() => setPortPickMode(false)} title="Stop (Esc)" style={{
                      cursor: "pointer", borderRadius: 6, padding: "4px 9px", fontSize: 10.5, fontWeight: 600,
                      fontFamily: UI_FONT, letterSpacing: "0.03em", background: "transparent",
                      border: `1px solid ${T.borderDefault}`, color: T.textSecondary, whiteSpace: "nowrap",
                    }}>
                      CANCEL
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── RACK VIEW: the cable in your hand ── */}
            {rackViewId && cableHand && (() => {
              const meta = RACK_CABLE_ROLES.find((r) => r.key === cableHand.role);
              const hex = meta?.hex || T.accent;
              const medium = roleMedium(cableHand.role);
              const hudBtn = (danger) => ({
                cursor: "pointer", borderRadius: 6, padding: "4px 9px", fontSize: 10.5, fontWeight: 600,
                fontFamily: UI_FONT, letterSpacing: "0.03em", background: "transparent",
                border: `1px solid ${danger ? T.critical : T.borderDefault}`,
                color: danger ? T.critical : T.textSecondary, whiteSpace: "nowrap",
              });
              // A power cord whose other end is in a PDU outlet belongs to that PDU.
              const feedLocked = medium === "power" && /^pdu[AB]\|/.test(cableHand.fixed?.portId || "");
              const feed = cableHand.role === "powerA" ? "A" : "B";
              return (
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 50,
                  background: T.bgSecondary, border: `1px solid ${cableHand.role === "powerA" ? T.textMuted : hex}`, borderRadius: 10,
                  padding: "9px 12px", boxShadow: T.shadow, width: "min(640px, calc(100% - 330px))", minWidth: 380,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 6, borderRadius: 3, background: hex, boxShadow: `0 0 0 1px ${T.textMuted}` }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textSecondary }}>
                      Cable in hand
                    </span>
                    <span style={{ fontSize: 11, color: T.textPrimary, fontWeight: 600 }}>{meta?.label || cableHand.role}</span>
                    <span style={{ fontSize: 10, color: T.textMuted, marginLeft: "auto", fontFamily: MONO_FONT }}>Esc · put it back</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 7 }}>
                    <span style={{ color: T.textMuted }}>From </span>
                    <b style={{ color: T.textPrimary, fontWeight: 600 }}>
                      {cableHand.fixed ? describeCordEnd(cableHand.fixed) : "a loose end"}
                    </b>
                    <span style={{ color: T.textMuted }}> → </span>
                    {handHoverLabel
                      ? (
                        <b style={{ color: handHoverLabel.busy ? "#f97316" : T.ok, fontWeight: 600 }}>
                          {handHoverLabel.text}{handHoverLabel.busy ? " — in use: click to swap it in" : " — click to plug in"}
                        </b>
                      )
                      : <span>click a <b style={{ color: T.ok }}>green dot</b>{medium === "power" ? ` on PDU-${feed} or a PSU` : " on this rack"}</span>}
                  </div>
                  {/* Where this end can go: this rack, another rack, a device. */}
                  {medium !== "power" && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 7 }}>
                      <span style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted, letterSpacing: 0.5 }}>PLUG INTO</span>
                      <span style={{
                        fontSize: 10.5, color: T.textSecondary, border: `1px dashed ${T.borderDefault}`,
                        borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
                      }}>
                        this rack: click a dot
                      </span>
                      {rackViewRacks.length > 1 && (
                        <Select
                          size="small"
                          showSearch
                          optionFilterProp="label"
                          placeholder="Another rack…"
                          value={null}
                          onChange={(v) => openRackView(v)}
                          style={{ width: 150 }}
                          getPopupContainer={() => document.body}
                          dropdownStyle={{ zIndex: RV_POPUP_Z }}
                          listHeight={220}
                          options={rackViewRacks.filter((d) => d.id !== rackViewId).map((d) => ({ value: d.id, label: deviceLabel(d) }))}
                        />
                      )}
                      {cordDeviceTargets.length > 0 && (
                        <Select
                          size="small"
                          showSearch
                          optionFilterProp="label"
                          placeholder="A device (ToR, router…)"
                          value={null}
                          onChange={(v) => plugCableHand({ deviceId: v })}
                          style={{ width: 196 }}
                          getPopupContainer={() => document.body}
                          dropdownStyle={{ zIndex: RV_POPUP_Z }}
                          options={cordDeviceTargets}
                        />
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Which cable this is. Only types that fit the port its
                        other end is in (a copper port takes copper types...). */}
                    <span style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted, letterSpacing: 0.5 }}>CABLE TYPE</span>
                    <Tooltip zIndex={RV_POPUP_Z} title={feedLocked ? `Its other end is in a PDU-${feed} outlet, so it is a PDU-${feed} cord.` : ""}>
                      <Select
                        size="small"
                        value={cableHand.role}
                        onChange={setCableHandRole}
                        disabled={feedLocked}
                        style={{ width: 176 }}
                        getPopupContainer={() => document.body}
                        dropdownStyle={{ zIndex: RV_POPUP_Z }}
                        options={rolesForMedium(medium).map((r) => ({
                          value: r.key,
                          label: (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 14, height: 4, borderRadius: 2, background: r.hex, boxShadow: `0 0 0 1px ${T.textMuted}` }} />
                              {r.label}
                            </span>
                          ),
                        }))}
                      />
                    </Tooltip>
                    <div style={{ flex: 1 }} />
                    {!cableHand.isNew && (
                      <button style={hudBtn(false)} onClick={unplugCableHand} title="Pull this end out and leave the cable hanging from its other end">
                        UNPLUG
                      </button>
                    )}
                    {!cableHand.isNew && (
                      <button style={hudBtn(true)} onClick={removeCableHand} title="Take the whole cable out (Delete)">
                        REMOVE
                      </button>
                    )}
                    <button style={hudBtn(false)} onClick={finishHand} title="Put it back where it was (Esc)">
                      {cableHand.isNew ? "CANCEL" : "PUT BACK"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 9.5, color: T.textMuted, marginTop: 7 }}>
                    {[["#22c55e", "free"], ["#f97316", "in use — swaps the old cable out"], ["#facc15", "where it starts"]].map(([c, t]) => (
                      <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: c, boxShadow: "0 0 0 1.5px rgba(0,0,0,0.55)" }} />
                        {t}
                      </span>
                    ))}
                    {medium !== "power" && <span style={{ marginLeft: "auto" }}>another rack: the cable stays in your hand</span>}
                  </div>
                </div>
              );
            })()}

            {/* ── RACK VIEW: what the last cable action did ── */}
            {rackViewId && !cableHand && cableNote && (
              <div style={{
                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 50,
                background: T.bgSecondary, border: `1px solid ${cableNote.tone === "ok" ? T.ok : T.borderDefault}`,
                borderRadius: 10, padding: "8px 10px 8px 12px", boxShadow: T.shadow,
                maxWidth: "min(640px, calc(100% - 330px))", display: "flex", alignItems: "center", gap: 8,
                fontSize: 11.5, color: T.textPrimary, lineHeight: 1.45,
              }}>
                {cableNote.tone === "ok"
                  ? <b style={{ color: T.ok, fontSize: 13 }}>✓</b>
                  : <InfoCircleOutlined style={{ color: T.textSecondary }} />}
                <span>{cableNote.text}</span>
                <button onClick={() => setCableNote(null)} title="Dismiss" style={{
                  marginLeft: 4, cursor: "pointer", border: "none", background: "transparent",
                  color: T.textMuted, fontSize: 11, padding: 2, lineHeight: 1,
                }}>
                  <CloseOutlined />
                </button>
              </div>
            )}

            {/* ── Top control bar ──
                Camera and Overlay used to be positioned independently — one
                centred, one pinned right — so the moment Overlay grew (AIRFLOW
                was the sixth button) they ran into each other on anything but
                a very wide window. Putting both in one centred flex row that
                is allowed to wrap means they can never overlap at any width:
                if there is no room side by side, Overlay simply drops onto a
                second line. */}
            <div style={{
              // left/right rather than left:50% + translateX. An absolutely
              // positioned box with only `left` set can never be wider than
              // the space to the RIGHT of that offset — anchored at 50% it had
              // half the window to work with and wrapped even on a wide
              // screen. Spanning edge to edge and centring with justifyContent
              // gives it the whole width, so it stays on one row until it
              // genuinely cannot fit. pointerEvents is off on the strip and
              // back on for the clusters, so the invisible full-width band
              // never swallows a drag on the canvas.
              position: "absolute", top: 12, left: 0, right: 0,
              display: "flex", flexWrap: "wrap", justifyContent: "center",
              alignItems: "flex-start", gap: 8, zIndex: 45,
              padding: "0 12px", boxSizing: "border-box", pointerEvents: "none",
            }}>
            <ControlCluster T={T} caption="Camera" style={{ position: "static", pointerEvents: "auto" }}>
              <ToolButton T={T} icon={<CompassOutlined style={{ fontSize: 12 }} />} label="ISO"
                title="Isometric view" active={camPreset === "iso"} onClick={resetView} />
              <ToolButton T={T} icon={<BorderTopOutlined style={{ fontSize: 12 }} />} label="TOP"
                title="Near top-down build view" active={camPreset === "top"} onClick={topView} />
              <ToolButton T={T} icon={<ExpandOutlined style={{ fontSize: 12 }} />} label="UNDER"
                title="Look up at the floor's underside" active={camPreset === "under"} onClick={bottomView} />
              <ToolButton T={T} icon={<EyeOutlined style={{ fontSize: 12 }} />} label="FOCUS"
                title="Focus the selected device" active={camPreset === "focus"}
                disabled={!selectedDeviceId} onClick={focusSelected} />
            </ControlCluster>

            {/* ── Overlay cluster ── */}
            <ControlCluster T={T} caption="Overlay" style={{ position: "static", pointerEvents: "auto" }}>
              <ToolButton T={T} icon={<ApiOutlined style={{ fontSize: 12 }} />} label="X-RAY"
                title="Pick a device, then X-RAY: it and everything cabled to it stay lit, and the rest of the floor — plenum cables included — ghosts out behind them."
                active={xrayFocus} accent={T.ok} onClick={() => setXrayFocus((p) => !p)} />
              <ToolButton T={T} icon={<NodeIndexOutlined style={{ fontSize: 12 }} />} label="CONNECTIVITY"
                title="Look under the raised floor — tiles go translucent, cable trays appear and every cable re-routes below the floor."
                active={underFloor} accent={T.warn} onClick={() => setUnderFloor((p) => !p)} />
              <ToolButton T={T} icon={<FireOutlined style={{ fontSize: 12 }} />} label="THERMAL MONITORING"
                title="Thermal Monitoring — a CFD-style heat map of IT load vs. cooling coverage on the raised floor. Fail a cooling unit in Simulate mode and watch it bloom red, just like the reference 3D CFD renders."
                active={hotspotOpen} accent={T.critical} onClick={() => setHotspotOpen((p) => !p)} />
              <ToolButton T={T} icon={<BorderOutlined style={{ fontSize: 12 }} />} label="CEILING"
                title="Show the suspended ceiling — the grid, the overhead cable tray and the level busway runs and tap-off boxes hang from. Hides itself automatically when you look straight down."
                active={ceilingOn} accent={T.textSecondary} onClick={() => setCeilingOn((p) => !p)} />
              <ToolButton T={T} icon={<CloudOutlined style={{ fontSize: 12 }} />} label="AIRFLOW"
                title="Hot / cold aisles — light blue in front of the rack doors, light red behind the rack backs, with an arrow showing which way the air moves."
                active={airflowOn} accent="#38bdf8" onClick={() => setAirflowOn((p) => !p)} />
              <ToolButton T={T} icon={<TagOutlined style={{ fontSize: 12 }} />} label="LABELS"
                title="Show or hide the floating labels on the facility, rooms, devices and cables"
                active={labelsVisible} onClick={() => setLabelsVisible((p) => !p)} />
              <ToolButton T={T} icon={<PictureOutlined style={{ fontSize: 12 }} />} label="RACK VIEW"
                title="Rack View — isolate ONE rack. The rest of the floor steps aside, the cabinet opens up and shows its servers, RESERVED and FREE U, and the cables coming out of the back of every server. Opens the selected rack (or the first server rack); switch racks from its panel. Double-click the rack to edit its U-slots. Esc to leave."
                active={!!rackViewId} accent={T.accent} onClick={toggleRackView} />
            </ControlCluster>
            </div>

            {/* ── Rack size cluster ── */}
            {/* Bottom-left, on its own: the top row is already three
                clusters wide and the left column is the Facility card, so
                anything tucked between them was easy to miss. Its dropdown
                is portalled to <body> with a zIndex above every overlay
                card, otherwise the list opened underneath them and the
                options couldn't be clicked. */}
            <ControlCluster T={T} caption="Rack U" style={{ bottom: 12, left: 12, zIndex: 60 }}>
              <Tooltip title="U height applied to the next rack you drop in. Already-placed racks can be changed from their Properties dialog (double-click a rack).">
                <span style={{ display: "inline-flex" }}>
                  <Select
                    size="small"
                    value={newRackU}
                    onChange={setNewRackU}
                    style={{ width: 92 }}
                    getPopupContainer={() => document.body}
                    dropdownStyle={{ zIndex: 2200 }}
                    listHeight={240}
                    options={RACK_U_PRESETS.map((u) => ({ value: u, label: `${u}U` }))}
                  />
                </span>
              </Tooltip>
            </ControlCluster>

            {/* ── Floor metrics card ── */}
            <div style={{
              position: "absolute", top: 62, right: 12, zIndex: 45, width: 208,
              background: T.bgSecondary, border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
            }}>
              <SectionLabel T={T} text="Floor" style={{ padding: "0 0 8px" }} />
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO_FONT, lineHeight: 1, color: T.accent }}>
                  {clampedLength.toFixed(1)}
                </span>
                <span style={{ fontSize: 11, color: T.textSecondary, paddingBottom: 1 }}>m</span>
                <span style={{ fontSize: 14, color: T.textMuted, padding: "0 2px 1px" }}>×</span>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO_FONT, lineHeight: 1, color: T.accent }}>
                  {clampedBreadth.toFixed(1)}
                </span>
                <span style={{ fontSize: 11, color: T.textSecondary, paddingBottom: 1 }}>m</span>
              </div>
              <PropertyRow T={T} label="Area" value={`${(clampedLength * clampedBreadth).toFixed(1)} m²`} mono />
              <PropertyRow T={T} label="Height" value={`${BUILDING_H} m`} mono />
              <PropertyRow T={T} label="Tile" value={`${TILE_SIZE_MM} × ${TILE_SIZE_MM} mm`} mono valueColor={T.ok} />
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "5px 0", borderBottom: `1px solid ${T.borderSubtle}`,
              }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Margin</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 9, height: 9, borderRadius: 2,
                    background: dc?.margins?.color || DEFAULT_MARGIN_COLOR,
                    border: `1px solid ${T.borderDefault}`,
                  }} />
                  <span style={{ fontSize: 11, fontFamily: MONO_FONT, color: T.textSecondary }}>
                    {dc?.margins?.color || DEFAULT_MARGIN_COLOR}
                  </span>
                </span>
              </div>
            </div>

            {/* ── Cable routing HUD ── */}
            {mode === "connect" && (
              <div style={{
                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                zIndex: 50, background: T.bgSecondary, border: `1px solid ${T.ok}66`,
                borderRadius: 10, padding: "9px 12px", boxShadow: T.shadow, minWidth: 380,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <ApiOutlined style={{ fontSize: 12, color: T.ok }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: T.textSecondary }}>Route cable</span>
                  <span style={{ fontSize: 10.5, color: T.textMuted, marginLeft: "auto", fontFamily: MONO_FONT }}>
                    {!pendingConnectDevice
                      ? "click the source device"
                      : `${routePoints.length} bend${routePoints.length === 1 ? "" : "s"} · click the target to finish`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted, paddingRight: 4 }}>Level</span>
                  {ROUTE_LEVELS.map((l, i) => (
                    <button key={l.key} onClick={() => setRouteLevel(l.key)}
                      title={`Run the next segment ${l.hint}  (${i + 1})`}
                      style={{
                        display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                        padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.05em", fontFamily: UI_FONT,
                        border: `1px solid ${routeLevel === l.key ? T.accent : T.borderDefault}`,
                        background: routeLevel === l.key ? `${T.accent}1f` : "transparent",
                        color: routeLevel === l.key ? T.accent : T.textSecondary,
                      }}>
                      <span style={{ fontSize: 9, opacity: 0.65, fontFamily: MONO_FONT }}>{i + 1}</span>
                      {l.label}
                    </button>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 9.5, color: T.textMuted }}>
                    Backspace undo · Esc cancel
                  </span>
                </div>
              </div>
            )}

            {/* ── Airflow legend: names the four stages of the loop ── */}
            {airflowOn && (
              <div style={{
                position: "absolute", bottom: 12, right: 12, zIndex: 45, width: 224,
                background: T.bgSecondary, border: "1px solid #38bdf855",
                borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CloudOutlined style={{ fontSize: 11, color: "#38bdf8" }} />
                  <SectionLabel T={T} text="Cooling Airflow" style={{ padding: "0 0 8px" }} />
                </div>
                {[
                  { c: "#38bdf8", t: "Cold aisle — in front of the rack doors" },
                  { c: "#f4462d", t: "Hot aisle — behind the rack backs" },
                ].map((row) => (
                  <div key={row.t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                    <span style={{
                      width: 22, height: 10, borderRadius: 3, flexShrink: 0,
                      background: `${row.c}66`, border: `1px solid ${row.c}`,
                    }} />
                    <span style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.3 }}>{row.t}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: 7, paddingTop: 7, borderTop: `1px solid ${T.borderSubtle}`,
                  fontSize: 9.5, color: T.textMuted, lineHeight: 1.4,
                }}>
                  Bands are grouped per row, so two rows facing the same aisle
                  share one band. Rotate a rack and its aisles follow.
                </div>
              </div>
            )}

            {/* ── STORAGE legend + floor-wide tally ── */}
            {storageOn && (
              <div style={{
                position: "absolute", top: 300, right: 12, zIndex: 45, width: 218,
                background: T.bgSecondary, border: `1px solid ${T.ok}55`,
                borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DatabaseOutlined style={{ fontSize: 11, color: T.ok }} />
                  <SectionLabel T={T} text="Rack Storage" style={{ padding: "0 0 8px" }} />
                </div>
                {[STORAGE_STATE.free, STORAGE_STATE.used, STORAGE_STATE.reserved].map((st) => (
                  <div key={st.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                    <span style={{
                      width: 20, height: 9, borderRadius: 2, background: st.hex,
                      border: `1px solid ${T.borderSubtle}`, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 10.5, color: T.textSecondary }}>{st.label}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10.5, fontFamily: MONO_FONT, color: T.textPrimary }}>
                      {storageSummary
                        ? `${st.key === "free" ? storageSummary.freeU : st.key === "used" ? storageSummary.usedU : storageSummary.reservedU}U`
                        : "—"}
                    </span>
                  </div>
                ))}
                <Divider T={T} style={{ margin: "7px 0" }} />
                <PropertyRow T={T} label="Racks" mono
                  value={storageSummary ? String(storageSummary.racks) : "—"} />
                <PropertyRow T={T} label="Empty" mono valueColor={T.ok}
                  value={storageSummary ? String(storageSummary.emptyRacks) : "—"} />
                <PropertyRow T={T} label="Full" mono valueColor={T.critical}
                  value={storageSummary ? String(storageSummary.fullRacks) : "—"} />
                <PropertyRow T={T} label="Biggest gap" mono
                  value={storageSummary ? `${storageSummary.largestFreeRunU}U` : "—"} />
                <div style={{
                  marginTop: 7, paddingTop: 7, borderTop: `1px solid ${T.borderSubtle}`,
                  fontSize: 9.5, color: T.textMuted, lineHeight: 1.4,
                }}>
                  {storageSummary && storageSummary.racks === 0
                    ? "No racks placed yet."
                    : <>Free U is not the same as usable U — <b style={{ color: T.textSecondary }}>biggest gap</b> is the tallest single device the floor can still take.</>}
                </div>
              </div>
            )}

            {/* ── Thermal Monitoring legend (CFD-style scale) ── */}
            {hotspotOpen && (
              <div style={{
                // Storage takes the same slot, so step down past it when both are on.
                position: "absolute", top: storageOn ? 560 : 300, right: 12, zIndex: 45, width: 208,
                maxHeight: `calc(100% - ${storageOn ? 572 : 312}px)`, overflowY: "auto",
                background: T.bgSecondary, border: `1px solid ${T.critical}55`,
                borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FireOutlined style={{ fontSize: 11, color: T.critical }} />
                  <SectionLabel T={T} text="Thermal Monitoring" style={{ padding: "0 0 8px" }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted }}>{HOTSPOT_MAX_C}°C</span>
                    <div style={{
                      width: 14, height: 118, borderRadius: 7,
                      background: `linear-gradient(to top, ${HEATMAP_CSS_GRADIENT})`,
                      border: `1px solid ${T.borderDefault}`,
                    }} />
                    <span style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted }}>{HOTSPOT_MIN_C}°C</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <PropertyRow T={T} label="Peak" mono
                      value={hotspotStats ? `${hotspotStats.peakC.toFixed(1)}°C` : "—"}
                      valueColor={
                        !hotspotStats ? T.textMuted
                          : hotspotStats.peakC >= HOTSPOT_CRITICAL_C ? T.critical
                            : hotspotStats.peakC >= HOTSPOT_WARN_C ? T.warn : T.ok
                      } />
                    <PropertyRow T={T} label="Average" value={hotspotStats ? `${hotspotStats.avgC.toFixed(1)}°C` : "—"} mono />
                    <PropertyRow T={T} label="Heat sources" value={hotspotStats ? String(hotspotStats.sourceCount) : "—"} mono valueColor={T.warn} />
                    <PropertyRow T={T} label="Cooling on" value={hotspotStats ? String(hotspotStats.sinkCount) : "—"} mono valueColor={T.ok} />
                  </div>
                </div>
                {/* Per-room temperature — Server Room first */}
                {hotspotStats?.roomTemps?.length > 0 && (
                  <div style={{ marginTop: 8, borderTop: `1px solid ${T.borderDefault}`, paddingTop: 6 }}>
                    <div style={{ fontSize: 9, fontFamily: MONO_FONT, color: T.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>
                      ROOM TEMPERATURE · AVG / PEAK
                    </div>
                    {hotspotStats.roomTemps.map((rt) => {
                      const col = rt.peakC >= HOTSPOT_CRITICAL_C ? T.critical : rt.peakC >= HOTSPOT_WARN_C ? T.warn : T.ok;
                      const isServer = rt.type === "server";
                      return (
                        <div key={rt.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6,
                          padding: isServer ? "4px 6px" : "2px 0", marginBottom: 2, borderRadius: 4,
                          background: isServer ? `${col}14` : "transparent",
                          border: isServer ? `1px solid ${col}55` : "1px solid transparent",
                        }}>
                          <span style={{
                            fontSize: isServer ? 11 : 10.5, fontWeight: isServer ? 600 : 400,
                            color: isServer ? T.textPrimary : T.textSecondary,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{rt.name}</span>
                          <span style={{ fontSize: isServer ? 11 : 10, fontFamily: MONO_FONT, color: col, whiteSpace: "nowrap" }}>
                            {rt.avgC.toFixed(1)}° / {rt.peakC.toFixed(1)}°C
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: T.textSecondary, marginTop: 8, lineHeight: 1.45 }}>
                  {hotspotStats?.peakRoomName
                    ? <>Hottest zone: <b style={{ color: T.textPrimary }}>{hotspotStats.peakRoomName}</b>. Rendered like a 3D CFD pass — IT load vs. cooling throw.</>
                    : "CFD-style thermal field from IT heat load and live cooling coverage. Fail a CRAC in Simulate mode to watch it redden."}
                </div>
              </div>
            )}

            {/* ── Mode / placing banner ── */}
            {(modeMeta || placeDeviceSession) && (
              <div style={{
                position: "absolute", top: 58, left: "50%", transform: "translateX(-50%)", zIndex: 46,
                display: "flex", alignItems: "center", gap: 8,
                background: T.bgSecondary, border: `1px solid ${placeDeviceSession ? T.ok : modeMeta.color}66`,
                borderRadius: 8, padding: "6px 10px", boxShadow: T.shadow, maxWidth: "70%",
              }}>
                <Chip T={T} color={placeDeviceSession ? T.ok : modeMeta.color}>
                  {placeDeviceSession ? "Placing" : modeMeta.label}
                </Chip>
                <span style={{ fontSize: 11, color: T.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {placeDeviceSession
                    ? `${placeDeviceSession.payload.name} — click the floor to place`
                    : modeMeta.hint}
                </span>
                <button
                  onClick={() => { setPlaceDeviceSession(null); handleSetMode("view"); }}
                  title="Exit (Esc)"
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: T.textMuted, display: "flex", alignItems: "center", padding: 2,
                  }}
                >
                  <CloseOutlined style={{ fontSize: 11 }} />
                </button>
              </div>
            )}

            {/* ── Live simulation HUD ── */}
            {(simRunning || failedCount > 0) && (
              <div style={{
                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 46,
                display: "flex", alignItems: "stretch", gap: 0,
                background: T.bgSecondary, border: `1px solid ${failedCount ? `${T.critical}55` : T.borderSubtle}`,
                borderRadius: 9, boxShadow: T.shadow, overflow: "hidden",
              }}>
                <button onClick={() => setSimRunning((r) => !r)} title="Play / pause the simulated clock (Space)"
                  style={{
                    padding: "0 12px", border: "none", cursor: "pointer",
                    background: simRunning ? `${T.warn}18` : `${T.ok}18`,
                    color: simRunning ? T.warn : T.ok, fontSize: 13,
                    display: "flex", alignItems: "center", borderRight: `1px solid ${T.borderSubtle}`,
                  }}>
                  <i className={`fas fa-${simRunning ? "pause" : "play"}`} />
                </button>
                {[
                  { l: "Elapsed", v: `T+${formatClock(simClock)}`, c: T.accent },
                  { l: "Failed", v: String(failedCount), c: failedCount ? T.critical : T.ok },
                  { l: "Down", v: `${impactReport?.counts.down || 0}/${impactReport?.counts.total || 0}`, c: impactReport?.counts.down ? T.critical : T.ok },
                  { l: "Cost", v: formatCurrency(impactReport?.totals.total || 0), c: impactReport?.totals.total ? T.critical : T.ok },
                  { l: "Burn / hr", v: formatCurrency(impactReport?.totals.burnPerHour || 0), c: T.warn },
                  ...(impactReport?.hottestRoom ? [{
                    l: impactReport.hottestRoom.name.slice(0, 14),
                    v: `${impactReport.hottestRoom.tempC.toFixed(1)}°C`,
                    c: impactReport.hottestRoom.band.color,
                  }] : []),
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: "6px 13px", textAlign: "center", minWidth: 74,
                    borderRight: `1px solid ${T.borderSubtle}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO_FONT, color: s.c, lineHeight: 1.15 }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
                <button onClick={() => setTrackerOpen(true)} title="Open the Failure Impact Tracker"
                  style={{
                    padding: "0 12px", border: "none", cursor: "pointer",
                    background: "transparent", color: T.violet, fontSize: 12,
                    display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontFamily: UI_FONT,
                  }}>
                  <FundProjectionScreenOutlined /> Tracker
                </button>
              </div>
            )}

            {/* ── Floating device chip ── */}
            <div
              ref={infoPanelElRef}
              style={{
                position: "absolute", display: "none",
                transform: "translate(-50%, calc(-100% - 44px))", zIndex: 60, pointerEvents: "none",
              }}
            >
              {selectedDevice && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: T.bgSecondary,
                  border: `1px solid ${selectedState && selectedState.severity !== "ok" ? SEVERITY_META[selectedState.severity].color : T.accent}66`,
                  borderRadius: 7, padding: "5px 10px", boxShadow: T.shadow, whiteSpace: "nowrap",
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: selectedState && selectedState.severity !== "ok" ? SEVERITY_META[selectedState.severity].color : T.accent,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }} title={deviceLabelLong(selectedDevice)}>{deviceLabel(selectedDevice)}</span>
                  <span style={{ fontSize: 10.5, color: T.textMuted, fontFamily: MONO_FONT }}>
                    {selectedDevice.footprint.tilesX}×{selectedDevice.footprint.tilesZ}
                  </span>
                  {selectedState && selectedState.severity !== "ok" && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                      color: SEVERITY_META[selectedState.severity].color,
                      background: `${SEVERITY_META[selectedState.severity].color}22`,
                      borderRadius: 5, padding: "1px 6px",
                    }}>
                      {SEVERITY_META[selectedState.severity].label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Contextual action toolbar ── */}
            <div
              ref={actionBarElRef}
              style={{
                position: "absolute", display: "none", transform: "translate(-50%, -100%)",
                zIndex: 60, gap: 2, background: T.bgSecondary,
                border: `1px solid ${T.borderSubtle}`, borderRadius: 8, padding: 4, boxShadow: T.shadow,
              }}
            >
              {[
                { key: "move", icon: <DragOutlined />, label: "Move — then drag on canvas", onClick: () => { moveArmedRef.current = true; message.info("Move armed — click and drag the device on the canvas."); } },
                { key: "rotate", icon: <RotateRightOutlined />, label: "Rotate 90° (R)", onClick: rotateSelectedDevice },
                { key: "duplicate", icon: <CopyOutlined />, label: "Duplicate (Ctrl+D)", onClick: duplicateSelectedDevice },
                { key: "properties", icon: <InfoCircleOutlined />, label: "Properties", onClick: openPropertiesForSelection },
                { key: "connect", icon: <ApiOutlined />, label: "Connect", onClick: connectFromSelection },
                {
                  key: "fail", icon: <WarningOutlined />,
                  label: selectedFailed ? "Restore this device (F)" : "Fail this device (F)",
                  onClick: () => selectedDeviceId && toggleFailure(selectedDeviceId),
                  danger: selectedFailed,
                },
                { key: "delete", icon: <DeleteOutlined />, label: "Delete (Del)", onClick: deleteSelectedDevice, danger: true },
              ].map((a) => (
                <Tooltip key={a.key} title={a.label}>
                  <button
                    onClick={a.onClick}
                    style={{
                      width: 27, height: 27, borderRadius: 5, border: "1px solid transparent",
                      background: "transparent", color: a.danger ? T.critical : T.textSecondary,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = a.danger ? `${T.critical}1f` : T.bgElevated;
                      e.currentTarget.style.color = a.danger ? T.critical : T.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = a.danger ? T.critical : T.textSecondary;
                    }}
                  >
                    {a.icon}
                  </button>
                </Tooltip>
              ))}
            </div>

            {/* ── X-RAY with nothing picked yet ── */}
            {xrayFocus && !selectedDeviceId && (
              <div style={{
                position: "absolute", left: 12, bottom: 12, zIndex: 47, width: 268,
                background: T.bgSecondary, border: `1px solid ${T.ok}55`,
                borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <ApiOutlined style={{ fontSize: 11, color: T.ok }} />
                  <SectionLabel T={T} text="X-Ray" style={{ padding: 0 }} />
                </div>
                <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.45 }}>
                  Click any device to isolate it. Everything cabled to it stays
                  lit; the rest of the floor ghosts out. Turn on <b style={{ color: T.textPrimary }}>PLENUM</b> to
                  see it on the cable runs under the floor.
                </div>
              </div>
            )}

            {/* ── Circuit trace panel ── */}
            {(xrayFocus || underFloor) && circuit && circuit.hops.length > 0 && (
              <div style={{
                position: "absolute", left: 12, bottom: 12, zIndex: 47, width: 268,
                background: T.bgSecondary, border: `1px solid ${T.borderSubtle}`,
                borderRadius: 8, padding: "10px 12px", boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <SectionLabel T={T} text="Circuit Trace" style={{ padding: 0 }} />
                  <span style={{ fontSize: 10, color: T.textMuted, marginLeft: "auto", fontFamily: MONO_FONT }}>
                    {circuit.hops.length} hop{circuit.hops.length > 1 ? "s" : ""} · {circuit.deviceIds.size} devices
                  </span>
                </div>
                <div style={{ maxHeight: 168, overflowY: "auto" }}>
                  {circuit.hops.map((h, i) => {
                    const cfg = CABLE_TYPES[h.type] || CABLE_TYPES.power;
                    const hex = "#" + cfg.color.toString(16).padStart(6, "0");
                    const sevTo = impactReport?.devices.get(parentDeviceId(h.toId))?.severity;
                    return (
                      <div key={h.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
                        borderTop: i === 0 ? "none" : `1px solid ${T.borderSubtle}`,
                      }}>
                        <span style={{
                          flex: "0 0 16px", height: 16, borderRadius: 4, background: `${hex}22`,
                          border: `1px solid ${hex}`, color: hex, fontSize: 9, fontWeight: 600,
                          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_FONT,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 11, color: T.textPrimary, lineHeight: 1.35, minWidth: 0 }}>
                          {endpointLabel(h.fromId)} <span style={{ color: T.textMuted }}>→</span> {endpointLabel(h.toId)}
                        </span>
                        <span style={{
                          fontSize: 9.5, marginLeft: "auto", fontFamily: MONO_FONT, whiteSpace: "nowrap",
                          color: sevTo && sevTo !== "ok" ? SEVERITY_META[sevTo].color : hex,
                        }}>
                          {sevTo && sevTo !== "ok" ? SEVERITY_META[sevTo].label : cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Controls hint (hidden in plain view mode) ── */}
            {mode !== "view" && (
            <div style={{
              position: "absolute", bottom: 12, right: 12, zIndex: 45, maxWidth: 420,
              background: T.bgSecondary, border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: "8px 12px", boxShadow: T.shadowSoft,
              fontSize: 11, color: T.textSecondary, lineHeight: 1.9,
            }}>
              {mode === "drawRoom" && (
                <div>
                  <b style={{ color: T.ok, fontWeight: 600 }}>Click-drag</b> the floor to sketch a room —
                  the badge predicts its rack capacity live · <b style={{ color: T.ok, fontWeight: 600 }}>Esc</b> to exit
                </div>
              )}
              {mode === "connect" && (
                <div>
                  <b style={{ color: T.indigo, fontWeight: 600 }}>Click</b> a device, then another ·{" "}
                  <b style={{ color: T.indigo, fontWeight: 600 }}>Right-click</b> a cable to remove it
                </div>
              )}
              {mode === "simulate" && (
                <div>
                  <b style={{ color: T.critical, fontWeight: 600 }}>Click</b> a device to fail it ·{" "}
                  click it again to restore · <b style={{ color: T.critical, fontWeight: 600 }}>Space</b> play/pause the clock
                </div>
              )}
            </div>
            )}
          </div>

        </div>

        {/* ══ Status bar ═══════════════════════════════════════════════════ */}
        <div style={{
          height: 28, flexShrink: 0, background: T.bgPrimary,
          borderTop: `1px solid ${T.borderSubtle}`,
          display: "flex", alignItems: "center", padding: "0 14px", gap: 20,
          fontSize: 11, color: T.textMuted, overflow: "hidden", whiteSpace: "nowrap",
        }}>
          <span style={{ color: selectedDevice ? T.textSecondary : T.textMuted }}>
            {selectedDevice
              ? `Selected: ${deviceLabelLong(selectedDevice)} (${selectedDevice.category})`
              : "No selection"}
          </span>
          <span style={{ fontFamily: MONO_FONT }}>
            {rawLength} {lengthUnit} × {rawBreadth} {breadthUnit}
          </span>
          <span style={{ fontFamily: MONO_FONT }}>
            {(lengthM * breadthM).toFixed(2)} m²
          </span>
          <span style={{ fontFamily: MONO_FONT }}>
            Tile {TILE_SIZE_MM}×{TILE_SIZE_MM} mm
          </span>
          {failedCount > 0 && (
            <span style={{ fontFamily: MONO_FONT, color: T.critical }}>
              T+{formatClock(simClock)} · {failedCount} failed · {formatCurrency(impactReport?.totals.total || 0)}
            </span>
          )}
          {hotspotOpen && hotspotStats && (
            <span style={{
              fontFamily: MONO_FONT,
              color: hotspotStats.peakC >= HOTSPOT_CRITICAL_C ? T.critical : hotspotStats.peakC >= HOTSPOT_WARN_C ? T.warn : T.textMuted,
            }}>
              Thermal peak {hotspotStats.peakC.toFixed(1)}°C{hotspotStats.peakRoomName ? ` · ${hotspotStats.peakRoomName}` : ""}
            </span>
          )}
          {(dc?.cityName || dc?.countryName) && (
            <span>{[dc?.cityName, dc?.countryName].filter(Boolean).join(", ")}</span>
          )}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <span>Tenant: {dc?.tenantName || "—"}</span>
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              color: dc?.status === "Active" ? T.ok : dc?.status === "Maintenance" ? T.warn : T.critical,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "currentColor",
                animation: dc?.status === "Active" ? "pulseDot 2.4s ease-in-out infinite" : "none",
              }} />
              {dc?.status || "Unknown"}
            </span>
          </span>
        </div>

        {/* ── Placement validity toast ── */}
        {placementToast && (
          <div style={{
            position: "fixed", left: placementToast.x + 14, top: placementToast.y + 14, zIndex: 200,
            background: T.bgSecondary, color: T.critical,
            border: `1px solid ${T.critical}`, borderLeft: `3px solid ${T.critical}`,
            borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 500,
            pointerEvents: "none", boxShadow: T.shadow, fontFamily: UI_FONT,
          }}>
            {reasonText(placementToast.reason)}
          </div>
        )}

        {/* ── Live room-footprint + capacity badge ── */}
        {roomDrawInfo && (
          <div style={{
            position: "fixed", left: roomDrawInfo.x + 16, top: roomDrawInfo.y + 16, zIndex: 200,
            background: T.bgSecondary,
            border: `1px solid ${roomDrawInfo.valid ? T.ok : T.critical}`,
            borderLeft: `3px solid ${roomDrawInfo.valid ? T.ok : T.critical}`,
            borderRadius: 6, padding: "7px 12px", pointerEvents: "none",
            boxShadow: T.shadow, fontFamily: MONO_FONT, lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: roomDrawInfo.valid ? T.ok : T.critical }}>
              {roomDrawInfo.wMm} × {roomDrawInfo.dMm} mm
            </div>
            <div style={{ fontSize: 10.5, color: T.textSecondary }}>
              {(roomDrawInfo.wMm / 1000).toFixed(2)} × {(roomDrawInfo.dMm / 1000).toFixed(2)} m · {roomDrawInfo.tilesX} × {roomDrawInfo.tilesZ} tiles
            </div>
            {roomDrawInfo.predictedRacks != null && (
              <div style={{ fontSize: 11, color: T.accent, marginTop: 3, fontWeight: 600 }}>
                ≈ {roomDrawInfo.predictedRacks} racks planned
                <span style={{ color: T.textMuted, fontWeight: 400 }}> ({roomDrawInfo.predictedMax} max)</span>
              </div>
            )}
            {!roomDrawInfo.valid && (
              <div style={{ fontSize: 10.5, color: T.critical, marginTop: 2 }}>
                {reasonText(roomDrawInfo.reason)}
              </div>
            )}
          </div>
        )}

        {/* ══ Floating intelligence panels ═══════════════════════════════ */}
        {guideOpen && (
          <DeploymentGuidePanel
            T={T}
            devices={devices}
            onFocusDevice={focusDeviceById}
            onClose={() => setGuideOpen(false)}
          />
        )}

        {compareOpen && (
          <SimViewComparePanel
            T={T}
            captures={viewCaptures}
            onCapture={captureView}
            onRemove={(id) => setViewCaptures((prev) => prev.filter((c) => c.id !== id))}
            onClear={() => { setViewCaptures([]); captureSeqRef.current = 0; }}
            onClose={() => setCompareOpen(false)}
            liveSummary={failedCount
              ? `T+${formatClock(simClock)} · ${failedCount} failed · ${(impactReport?.counts.down || 0) + (impactReport?.counts.degraded || 0)} devices affected · ${formatCurrency(impactReport?.totals.total || 0)}`
              : "normal operation"}
          />
        )}

        {trackerOpen && (
          <ImpactTrackerPanel
            T={T}
            report={impactReport}
            failures={failures}
            simSeconds={simClock}
            running={simRunning}
            speed={simSpeed}
            onToggleRun={() => setSimRunning((r) => !r)}
            onSetSpeed={setSimSpeed}
            onReset={resetSimulation}
            onClearFailure={clearFailure}
            onClearAll={clearAllFailures}
            onFocusDevice={focusDeviceById}
            costModel={costModel}
            onCostChange={setCostModel}
            onClose={() => setTrackerOpen(false)}
          />
        )}
      </div>

      {/* ── Device dimension modal ──
          forceRender keeps this dialog's DOM permanently mounted instead of
          destroying/recreating it on every open (destroyOnClose used to do
          that, forcing a full remount on every single drag-and-drop). The
          nested ConfigProvider with token.motion=false turns off rc-dialog's
          enter/mask animation for just this modal, via antd's own official
          "disable motion" switch. Together these stop the "opens twice"
          flash on drag-and-drop: without them, every open re-ran the
          dialog's mount + CSS-motion enter sequence from scratch, and that
          sequence could visibly replay/flash under this project's React 19
          + antd v5 combo (antd v5's animation internals aren't officially
          patched for React 19 yet — see @ant-design/v5-patch-for-react19
          for the upstream fix).
          NOTE: do not remove this block — if this file is open in an
          editor with an older cached copy, saving over this fix will bring
          the flash bug back. */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          zIndex={100010}
          title={deviceModal ? `${deviceModal.payload.name} — Footprint` : "Footprint"}
          open={!!deviceModal}
          onOk={confirmDeviceDims}
          onCancel={cancelDeviceDims}
          okText="Place Device"
          forceRender
        >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Enter the device's real footprint (Length × Width). Each floor tile is {TILE_SIZE_MM}×{TILE_SIZE_MM} mm, so the
          device automatically claims the tiles it needs and reserves them against overlap.
        </Text>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Length (mm)</label>
            <InputNumber
              value={deviceDimsMm.length}
              min={50} max={10000} step={10} style={{ width: "100%" }}
              addonAfter="mm"
              onChange={(v) => setDeviceDimsMm((p) => ({ ...p, length: v || 0 }))}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Width (mm)</label>
            <InputNumber
              value={deviceDimsMm.width}
              min={50} max={10000} step={10} style={{ width: "100%" }}
              addonAfter="mm"
              onChange={(v) => setDeviceDimsMm((p) => ({ ...p, width: v || 0 }))}
            />
          </div>
          <div style={{
            fontSize: 11, color: T.textSecondary, fontFamily: MONO_FONT,
            background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`,
            borderRadius: 6, padding: "7px 10px",
          }}>
            Footprint: {Math.max(1, Math.ceil((deviceDimsMm.length || TILE_SIZE_MM) / TILE_SIZE_MM))} ×{" "}
            {Math.max(1, Math.ceil((deviceDimsMm.width || TILE_SIZE_MM) / TILE_SIZE_MM))} tiles
          </div>
          <Space size={4} wrap style={{ fontSize: 11, color: T.textMuted }}>
            Presets:
            {[
              { label: "600×600", l: 600, w: 600 },
              { label: "600×1200", l: 600, w: 1200 },
              { label: "Rack 600×1000", l: 600, w: 1000 },
            ].map((p) => (
              <Button key={p.label} size="small" onClick={() => setDeviceDimsMm({ length: p.l, width: p.w })}>
                {p.label}
              </Button>
            ))}
          </Space>
        </div>
        </Modal>
      </ConfigProvider>

      {/* ── Draw Room finalize modal — with a live capacity prediction ──
          Same motion-off + forceRender treatment as the Footprint modal
          above: stops this dialog's mount/animation from replaying as a
          double-flash right when you finish drawing a room. Do not remove
          this block; if the file is open in an editor with a stale cached
          copy, saving over this fix will bring the flash back. */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          zIndex={100010}
          title="New room"
          open={!!roomDraft}
          onOk={confirmRoomDraft}
          onCancel={cancelRoomDraft}
          okText="Create Room"
          okButtonProps={{ disabled: !roomDraft?.name?.trim() }}
          forceRender
        >
        {roomDraft && (() => {
          const pred = predictRoomCapacity(
            {
              id: "__draft", name: roomDraft.name || "Draft", type: roomDraft.type,
              width: roomDraft.width, length: roomDraft.length, kw: roomDraft.kw || 0,
            },
            0, capacityTuning[roomDraft.type] || {},
          );
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                fontSize: 11.5, color: T.textSecondary, fontFamily: MONO_FONT,
                background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`,
                borderRadius: 6, padding: "7px 10px",
              }}>
                {mToMm(roomDraft.width)} × {mToMm(roomDraft.length)} mm
                {"  ·  "}{roomDraft.width.toFixed(2)} × {roomDraft.length.toFixed(2)} m — placed exactly where you drew it.
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Room Name</label>
                <Input
                  autoFocus
                  value={roomDraft.name}
                  placeholder="e.g. Corridor A, UPS Room 2"
                  onChange={(e) => setRoomDraft((p) => ({ ...p, name: e.target.value }))}
                  onPressEnter={confirmRoomDraft}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Room Type</label>
                <Select
                  style={{ width: "100%" }}
                  value={roomDraft.type}
                  onChange={(v) => setRoomDraft((p) => ({ ...p, type: v }))}
                  options={ROOM_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
                {roomDraft.type === "corridor" && (
                  <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                    Corridors render as a flat walk path (no walls) with yellow lines along its edges.
                  </Text>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                  Power budget (kW)
                </label>
                <InputNumber
                  style={{ width: "100%" }} addonAfter="kW" min={0} max={100000} step={5}
                  value={roomDraft.kw}
                  onChange={(v) => setRoomDraft((p) => ({ ...p, kw: v ?? 0 }))}
                />
                <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                  Leave at 0 to plan on floor space alone — set it and the prediction below will tell you
                  whether space or power is the real limit.
                </Text>
              </div>

              {/* ── Live capacity prediction ── */}
              {!pred.nonPlaceable && (
                <div style={{
                  border: `1px solid ${pred.planned > 0 ? `${T.ok}55` : `${T.critical}55`}`,
                  background: pred.planned > 0 ? `${T.ok}0e` : `${T.critical}0e`,
                  borderRadius: 8, padding: "10px 12px",
                }}>
                  <div style={{
                    fontSize: 9.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
                    color: T.textMuted, marginBottom: 6,
                  }}>
                    Predicted capacity
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 26, fontWeight: 700, fontFamily: MONO_FONT, lineHeight: 1,
                      color: pred.planned > 0 ? T.ok : T.critical,
                    }}>
                      {pred.planned}
                    </span>
                    <span style={{ fontSize: 12, color: T.textSecondary }}>{pred.profile.units}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, fontFamily: MONO_FONT, marginLeft: "auto" }}>
                      {pred.geometricMax} absolute max
                    </span>
                  </div>
                  <div style={{
                    marginTop: 7, fontSize: 11, color: T.textSecondary, lineHeight: 1.55,
                  }}>
                    {pred.layout.rows} row{pred.layout.rows === 1 ? "" : "s"} × {pred.layout.perRow} per row ·{" "}
                    usable {pred.usableW.toFixed(2)} × {pred.usableL.toFixed(2)} m ·{" "}
                    limited by <b style={{ color: T.textPrimary }}>{pred.binding.label.toLowerCase()}</b>
                    {pred.plannedKw > 0 && ` · ${Math.round(pred.plannedKw)} kW IT load`}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 10.5, color: T.textMuted, fontFamily: MONO_FONT }}>
                    {pred.layout.note}
                  </div>
                  {pred.warnings.slice(0, 2).map((w, i) => (
                    <div key={i} style={{
                      marginTop: 6, fontSize: 10.5, lineHeight: 1.45,
                      color: w.sev === "critical" ? T.critical : w.sev === "warn" ? T.warn : T.accent,
                    }}>
                      • {w.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        </Modal>
      </ConfigProvider>

      {/* ── Connect devices — cable type modal ──
          Same motion-off + forceRender treatment as the other modals above,
          to prevent the open-twice flash. Do not remove. */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          zIndex={100010}
          title="Run a cable"
          open={!!cableModal}
          onOk={confirmCable}
          onCancel={cancelCable}
          okText="Connect"
          forceRender
        >
        {cableModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text strong style={{ fontSize: 12.5 }}>
              {endpointLabel(cableModal.fromId)} <span style={{ color: T.textMuted }}>→</span> {endpointLabel(cableModal.toId)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Choose what this cable represents. It's auto-routed as a bent run — out of the port, along an
              overhead channel, into the other end, never a straight line — grouped under the matching layer
              in the header <b>Layers</b> panel, and it is what the failure simulation walks when it
              propagates a power or network outage.
            </Text>
            <Select
              style={{ width: "100%" }}
              value={cableModal.type}
              onChange={(v) => setCableModal((p) => ({ ...p, type: v }))}
              options={Object.entries(CABLE_TYPES).map(([value, cfg]) => ({
                value,
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: 2,
                      background: "#" + cfg.color.toString(16).padStart(6, "0"),
                    }} />
                    {cfg.label}
                  </span>
                ),
              }))}
            />
          </div>
        )}
        </Modal>
      </ConfigProvider>

      {/* ── Properties modal ──
          Same motion-off + forceRender treatment as the other modals above,
          to prevent the open-twice flash. Do not remove. */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          zIndex={100010}
          title={propertiesModal
            ? `${deviceLabelLong(devices.find((d) => d.id === propertiesModal.id)) || "Device"} — Properties`
            : "Properties"}
          open={!!propertiesModal}
          onOk={confirmPropertiesModal}
          onCancel={cancelPropertiesModal}
          okText="Save"
          forceRender
        >
        {propertiesModal && (() => {
          const dev = devices.find((d) => d.id === propertiesModal.id);
          if (!dev) return null;
          const nativePreview = getFootprintTiles({ length: propertiesModal.length, width: propertiesModal.width });
          const sidewaysPreview = dev.rotation === 90 || dev.rotation === 270;
          const tilesX = sidewaysPreview ? nativePreview.tilesZ : nativePreview.tilesX;
          const tilesZ = sidewaysPreview ? nativePreview.tilesX : nativePreview.tilesZ;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                fontSize: 11.5, color: T.textSecondary,
                background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`,
                borderRadius: 6, padding: "7px 10px",
              }}>
                Type <b style={{ color: T.textPrimary }}>{dev.name}</b>
                {"  ·  "}Category <b style={{ color: T.textPrimary }}>{dev.category}</b>
                {"  ·  "}Room <b style={{ color: T.textPrimary }}>{impactReport?.devices.get(dev.id)?.roomName || "—"}</b>
                {"  ·  "}Power <b style={{ color: T.textPrimary }}>{dev.metadata?.power || "N/A"}</b>
                {"  ·  "}Rotation <b style={{ color: T.textPrimary }}>{dev.rotation}°</b>
              </div>

              {/* Asset tag. This is the name the 3D label, the Deployment
                  Guide and every line of the failure report use — so a
                  cascade reads "ToR-02 took RACK-07 and RACK-08 offline"
                  instead of "Access Switch (ToR) took Rack and Rack offline". */}
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                  Alias / asset tag
                </label>
                <Input
                  value={propertiesModal.alias}
                  maxLength={24}
                  placeholder={nextAlias(dev, devices.filter((d) => d.id !== dev.id))}
                  onChange={(e) => setPropertiesModal((p) => ({ ...p, alias: e.target.value }))}
                  status={
                    propertiesModal.alias?.trim()
                    && aliasTaken(propertiesModal.alias, devices, dev.id) ? "error" : ""
                  }
                />
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.45 }}>
                  {propertiesModal.alias?.trim() && aliasTaken(propertiesModal.alias, devices, dev.id)
                    ? <span style={{ color: T.critical }}>
                        Already used by another device — tags have to be unique.
                      </span>
                    : "Shown on the 3D label, in the Deployment Guide and in every failure-impact line. Leave it blank to fall back to the auto tag."}
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Length (mm)</label>
                <InputNumber value={propertiesModal.length} min={50} max={10000} step={10} style={{ width: "100%" }} addonAfter="mm"
                  onChange={(v) => setPropertiesModal((p) => ({ ...p, length: v || 0 }))} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Width (mm)</label>
                <InputNumber value={propertiesModal.width} min={50} max={10000} step={10} style={{ width: "100%" }} addonAfter="mm"
                  onChange={(v) => setPropertiesModal((p) => ({ ...p, width: v || 0 }))} />
              </div>
              {isRackDevice(dev.name, dev.category, dev.shape) && (
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Rack height (U)</label>
                  <Select
                    value={rackHeightMmToU(propertiesModal.height)}
                    onChange={(u) => setPropertiesModal((p) => ({ ...p, height: rackUToHeightMm(u) }))}
                    style={{ width: "100%" }}
                    getPopupContainer={() => document.body}
                    dropdownStyle={{ zIndex: 2200 }}
                    listHeight={240}
                    options={RACK_U_PRESETS.map((u) => ({ value: u, label: `${u}U` }))}
                  />
                </div>
              )}
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Height (mm)</label>
                <InputNumber value={propertiesModal.height} min={100} max={6000} step={10} style={{ width: "100%" }} addonAfter="mm"
                  onChange={(v) => setPropertiesModal((p) => ({ ...p, height: v || 0 }))} />
              </div>
              <div style={{
                fontSize: 11, color: T.textSecondary, fontFamily: MONO_FONT,
                background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`,
                borderRadius: 6, padding: "7px 10px",
              }}>
                Footprint: {tilesX} × {tilesZ} tiles ({tilesX * TILE_SIZE_MM} × {tilesZ * TILE_SIZE_MM} mm reserved)
              </div>
            </div>
          );
        })()}
        </Modal>
      </ConfigProvider>

      <RackElevationModal
        open={!!rackElevation}
        rack={rackElevation}
        onClose={() => {
          rackElevationClosedAtRef.current = performance.now();
          rackElevationOpenRef.current = false;
          setRackElevation(null);
        }}
        onSlotsChanged={refreshRackRealFace}
      />
    </ConfigProvider>
  );
};

export default DataCenter3DView;