// ── RACK VIEW: one cabinet, opened up, with what is really inside it ──────
//
// RACK VIEW isolates a single rack. The rest of the floor steps aside (by
// render layer only -- no other feature's show/hide state is touched), the
// cabinet's doors come off, and its U-slots are drawn as real equipment:
// servers with their own front/back photos, network gear, RESERVED space
// and FREE space. At the rear every device is cabled the way a tidy hall is
// dressed: patch cords leave the back of each server, sweep into a bundle
// on either side, run up the rack and fan into the patch panels / fibre LIU
// at the top, and power cords go to the zero-U PDUs in the rear corners.
//
// It is only ever built for the ONE rack being looked at, so none of this
// costs anything on a floor of fifty cabinets.
//
// Coordinates are the rack's own inner group (see makeRackBody in
// Datacenter3dview.jsx): origin at the cabinet's centre, +Z is the FRONT
// (door / cold aisle), -Z the REAR (hot aisle), +Y up.

import * as THREE from "three";

/** Render layer the isolated rack (and the floor it stands on) is drawn on. */
export const RACK_VIEW_LAYER = 5;

// ── Cable roles, and the colour each is dressed in ──────────────────────
export const RACK_CABLE_ROLES = [
  { key: "dataA",  label: "Data A · Cat6",      hex: "#2563eb" },
  { key: "dataB",  label: "Data B · Cat6",      hex: "#dc2626" },
  { key: "mgmt",   label: "Mgmt · iDRAC/iLO",   hex: "#eab308" },
  { key: "backup", label: "Backup LAN",         hex: "#16a34a" },
  { key: "san",    label: "SAN fibre · OM3",    hex: "#f97316" },
  { key: "uplink", label: "Uplink fibre · OM4", hex: "#06b6d4" },
  { key: "powerA", label: "Power A → PDU-A",    hex: "#1f2227" },
  { key: "powerB", label: "Power B → PDU-B",    hex: "#6b7280" },
];
const ROLE_HEX = Object.fromEntries(RACK_CABLE_ROLES.map((r) => [r.key, r.hex]));
const COPPER_ROLES = new Set(["dataA", "dataB", "mgmt", "backup"]);

// ── Network gear that can sit in a U-slot (no photos -- drawn below) ────
export const RACK_GEAR = {
  "gear-patch-cat6-24": { name: "Cat6 Patch Panel · 24-port", kind: "patch", sizeU: 1, depthM: 0.11 },
  "gear-liu-lc-24":     { name: "Fibre LIU · 12 × LC duplex (OM4)", kind: "liu", sizeU: 1, depthM: 0.2 },
  "gear-switch-48":     { name: "Switch · 48 × 1G + 4 × SFP+", kind: "switch", sizeU: 1, depthM: 0.42 },
  "gear-cable-mgr-1u":  { name: "Horizontal Cable Manager · 1U", kind: "cablemgr", sizeU: 1, depthM: 0.09 },
};

// Port layouts, as fractions of the face they are on: u across (from the
// left as you look at that face), v down (from its top). The artwork below
// draws its ports at exactly these spots, so a plug always lands on one.
const PATCH_PORTS = Array.from({ length: 24 }, (_, i) => ({ u: 0.08 + (i * 0.84) / 23, v: 0.6 }));
const LIU_PORTS = Array.from({ length: 12 }, (_, i) => ({ u: 0.1 + (i * 0.8) / 11, v: 0.58 }));
const SWITCH_COPPER = Array.from({ length: 48 }, (_, k) => ({
  u: 0.1 + (Math.floor(k / 2) * 0.5) / 23, v: k % 2 ? 0.72 : 0.36,
}));
const SWITCH_SFP = [0, 1, 2, 3].map((k) => ({ u: 0.655 + k * 0.042, v: 0.54 }));
const SWITCH_MGMT = { u: 0.845, v: 0.54 };
const SWITCH_PSU = [{ u: 0.065, v: 0.5 }, { u: 0.935, v: 0.5 }];

// Where the NICs and power inlets are on the three server photos (their
// REAR images, see deviceImageLibrary.js).
const SERVER_PORTS = {
  "dev-server-a": {
    data: [
      { u: 0.293, v: 0.33, role: "dataA" }, { u: 0.34, v: 0.33, role: "dataB" },
      { u: 0.421, v: 0.33, role: "backup" }, { u: 0.622, v: 0.33, role: "mgmt" },
      // The other three ports of the 4-port OCP card: left free on purpose,
      // so there is always somewhere to plug a new or re-routed cable.
      { u: 0.453, v: 0.33, role: "dataA", label: "NIC 4", spare: true },
      { u: 0.484, v: 0.33, role: "dataA", label: "NIC 5", spare: true },
      { u: 0.516, v: 0.33, role: "dataA", label: "NIC 6", spare: true },
    ],
    psu: [{ u: 0.166, v: 0.6 }, { u: 0.94, v: 0.6 }],
  },
  "dev-server-b": {
    data: [
      { u: 0.278, v: 0.86, role: "dataA" }, { u: 0.331, v: 0.86, role: "dataB" },
      { u: 0.628, v: 0.86, role: "mgmt" },
    ],
    psu: [{ u: 0.18, v: 0.72 }, { u: 0.922, v: 0.72 }],
  },
  "dev-server-c": {
    data: [
      { u: 0.3, v: 0.27, role: "dataA" }, { u: 0.345, v: 0.27, role: "dataB" },
      { u: 0.46, v: 0.27, role: "san" }, { u: 0.505, v: 0.27, role: "san" },
      { u: 0.62, v: 0.27, role: "mgmt" },
    ],
    psu: [{ u: 0.19, v: 0.08 }, { u: 0.39, v: 0.08 }, { u: 0.695, v: 0.08 }, { u: 0.895, v: 0.08 }],
  },
};
// A device typed in by name (no photo) still gets a NIC, a mgmt port and
// two power supplies -- it is a device, it has to be cabled.
const GENERIC_PORTS = {
  data: [{ u: 0.4, v: 0.5, role: "dataA" }, { u: 0.6, v: 0.5, role: "mgmt" }],
  psu: [{ u: 0.1, v: 0.5 }, { u: 0.9, v: 0.5 }],
};

const RESERVED_RE = /^\s*reserved\b/i;
/** Same rule the STORAGE view uses (rackStorage3d.js). */
export function isReservedSlot(s) {
  return s?.reserved === true || s?.status === "reserved" || s?.state === "reserved" ||
    (!s?.deviceId && RESERVED_RE.test(s?.deviceName || ""));
}

/** What kind of thing a slot holds: reserved | patch | liu | switch | cablemgr | server | device */
export function rackSlotKind(slot) {
  if (isReservedSlot(slot)) return "reserved";
  const g = RACK_GEAR[slot?.deviceId];
  if (g) return g.kind;
  if (SERVER_PORTS[slot?.deviceId] || /^dev-server/.test(slot?.deviceId || "")) return "server";
  return "device";
}

// ═══════════════════════════════════════════════════════════════════════
// ARTWORK -- network gear faces, reserved plates, free tags, PDU strips
// ═══════════════════════════════════════════════════════════════════════
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Plate with the two 19" mounting ears every rack-mount unit has.
function drawPlate(ctx, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, w * 0.035, h);
  ctx.fillRect(w * 0.965, 0, w * 0.035, h);
  ctx.fillStyle = "#07080a";
  [0.0175, 0.9825].forEach((fx) => {
    roundRect(ctx, w * fx - 5, h * 0.5 - 9, 10, 18, 4);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 0, w, 2);
}

function drawRj45(ctx, cx, cy, pw, ph, body, hole) {
  ctx.fillStyle = body;
  roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, 3);
  ctx.fill();
  ctx.fillStyle = hole;
  ctx.fillRect(cx - pw * 0.34, cy - ph * 0.3, pw * 0.68, ph * 0.52);
  ctx.fillRect(cx - pw * 0.14, cy + ph * 0.2, pw * 0.28, ph * 0.16);
}

function drawGearCanvas(kind, face) {
  const w = 1024, h = 96;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  const label = (text, x, color = "#9aa6b8") => {
    ctx.fillStyle = color;
    ctx.font = "600 13px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, x, 14);
  };

  if (kind === "patch") {
    drawPlate(ctx, w, h, "#3b424d", "#262b33");
    PATCH_PORTS.forEach((p, i) => {
      const cx = p.u * w, cy = p.v * h;
      if (i % 6 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(cx - 17, 24, (0.84 / 23) * w * 6 - 2, 66);
      }
      drawRj45(ctx, cx, cy, 26, 30, "#e5e7eb", "#15171a");
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), cx, 28);
    });
    label("CAT6 · 24", w * 0.045);
  } else if (kind === "liu") {
    drawPlate(ctx, w, h, "#23272e", "#15181d");
    LIU_PORTS.forEach((p, i) => {
      const cx = p.u * w, cy = p.v * h;
      ctx.fillStyle = "#0e7490";
      roundRect(ctx, cx - 24, cy - 17, 48, 34, 4); ctx.fill();
      ctx.fillStyle = "#22d3ee";
      roundRect(ctx, cx - 21, cy - 14, 42, 28, 3); ctx.fill();
      ctx.fillStyle = "#083344";
      ctx.fillRect(cx - 15, cy - 8, 11, 16);
      ctx.fillRect(cx + 4, cy - 8, 11, 16);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), cx, 16);
    });
    label("LIU · OM4 · 24F", w * 0.045, "#67e8f9");
  } else if (kind === "switch") {
    drawPlate(ctx, w, h, "#1d222b", "#0f1217");
    if (face === "back") {
      SWITCH_COPPER.forEach((p, k) => {
        const cx = p.u * w, cy = p.v * h;
        drawRj45(ctx, cx, cy, 17, 24, "#2b313b", "#050607");
        ctx.fillStyle = (k * 7) % 10 < 8 ? "#22c55e" : "#f59e0b";
        ctx.fillRect(cx - 7, cy + (p.v < 0.5 ? -16 : 14), 4, 3);
      });
      SWITCH_SFP.forEach((p) => {
        const cx = p.u * w, cy = p.v * h;
        ctx.fillStyle = "#9ca3af";
        ctx.fillRect(cx - 17, cy - 13, 34, 26);
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(cx - 13, cy - 8, 26, 16);
      });
      drawRj45(ctx, SWITCH_MGMT.u * w, SWITCH_MGMT.v * h, 22, 26, "#1d4ed8", "#050607");
      SWITCH_PSU.forEach((p) => {
        const cx = p.u * w, cy = p.v * h;
        ctx.fillStyle = "#050607";
        roundRect(ctx, cx - 16, cy - 15, 32, 30, 4); ctx.fill();
        ctx.fillStyle = "#6b7280";
        [-7, 0, 7].forEach((dx) => ctx.fillRect(cx + dx - 1.5, cy - 5, 3, 10));
      });
      label("48 × 1G · 4 × SFP+", w * 0.1);
    } else {
      // The fan side -- what you see from the cold aisle.
      ctx.fillStyle = "#050607";
      for (let k = 0; k < 5; k++) {
        const cx = w * (0.2 + k * 0.15);
        ctx.beginPath(); ctx.arc(cx, h * 0.5, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#2b313b"; ctx.lineWidth = 2;
        for (let r = 8; r < 30; r += 7) { ctx.beginPath(); ctx.arc(cx, h * 0.5, r, 0, Math.PI * 2); ctx.stroke(); }
      }
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(w * 0.9, h * 0.4, 8, 8);
    }
  } else if (kind === "cablemgr") {
    drawPlate(ctx, w, h, "#1b1f25", "#101318");
    ctx.fillStyle = "#050607";
    roundRect(ctx, w * 0.06, h * 0.3, w * 0.88, h * 0.4, 10); ctx.fill();
    ctx.strokeStyle = "#3f4652"; ctx.lineWidth = 2;
    for (let x = w * 0.07; x < w * 0.93; x += 6) {
      ctx.beginPath(); ctx.moveTo(x, h * 0.31); ctx.lineTo(x + 2, h * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 3, h * 0.69); ctx.lineTo(x + 1, h * 0.5); ctx.stroke();
    }
    ctx.fillStyle = "#2a3039";
    [0.2, 0.4, 0.6, 0.8].forEach((fx) => { roundRect(ctx, w * fx - 14, h * 0.12, 28, h * 0.76, 6); ctx.fill(); });
  } else {
    // blank / filler plate
    drawPlate(ctx, w, h, "#1a1e24", "#0f1216");
    ctx.fillStyle = "#07080a";
    for (let x = w * 0.08; x < w * 0.92; x += 22) ctx.fillRect(x, h * 0.35, 12, h * 0.3);
  }
  return c;
}

const GEAR_TEX = new Map();
function gearTexture(kind, face) {
  const key = `${kind}|${face}`;
  let t = GEAR_TEX.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(drawGearCanvas(kind, face));
    t.minFilter = THREE.LinearFilter;
    t.anisotropy = 4;
    GEAR_TEX.set(key, t);
  }
  return t;
}

const GEAR_URL = new Map();
/** Data-URL of a gear face, for slot records (elevation dialog, legacy faces). */
export function gearImageUrl(gearId, face) {
  if (typeof document === "undefined") return null;
  const kind = RACK_GEAR[gearId]?.kind || "blank";
  // Rear-mounted gear shows a blanking plate to the cold aisle -- the same
  // thing the 3D rack shows (a switch shows its fan side).
  const art = face === "front" && kind !== "switch" ? "blank" : kind;
  const key = `${art}|${face}`;
  let u = GEAR_URL.get(key);
  if (!u) {
    u = drawGearCanvas(art, face).toDataURL("image/png");
    GEAR_URL.set(key, u);
  }
  return u;
}

let RESERVED_URL = null;
/** Blue hatch used as the "photo" of a reserved slot (no text -- the name is overlaid). */
export function reservedImageUrl() {
  if (typeof document === "undefined") return null;
  if (!RESERVED_URL) {
    const w = 512, h = 128;
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0f1b33";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(96,165,250,0.45)";
    ctx.lineWidth = 6;
    for (let x = -h; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
    ctx.setLineDash([14, 8]);
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    RESERVED_URL = c.toDataURL("image/png");
  }
  return RESERVED_URL;
}

// Reserved plate in 3D: hatch + "RESERVED · nU" + the note.
const PLATE_TEX = new Map();
function reservedPlateTexture(sizeU, note, aspect) {
  const key = `r|${sizeU}|${note}|${aspect.toFixed(2)}`;
  let t = PLATE_TEX.get(key);
  if (t) return t;
  const w = 512, h = Math.max(40, Math.round(w / aspect));
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(37,99,235,0.16)";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(96,165,250,0.32)";
  ctx.lineWidth = 4;
  for (let x = -h; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
  ctx.setLineDash([12, 7]);
  ctx.strokeStyle = "#60a5fa";
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.setLineDash([]);
  const big = Math.min(34, h * 0.36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#dbeafe";
  ctx.font = `800 ${big}px sans-serif`;
  const hasNote = note && h >= 70;
  ctx.fillText(`RESERVED · ${sizeU}U`, w / 2, hasNote ? h * 0.4 : h * 0.52);
  if (hasNote) {
    ctx.fillStyle = "#93c5fd";
    ctx.font = `600 ${Math.min(22, h * 0.2)}px sans-serif`;
    ctx.fillText(note, w / 2, h * 0.68);
  }
  t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  PLATE_TEX.set(key, t);
  return t;
}

function freeTagTexture(sizeU) {
  const key = `f|${sizeU}`;
  let t = PLATE_TEX.get(key);
  if (t) return t;
  const w = 256, h = 48;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(34,197,94,0.16)";
  roundRect(ctx, 2, 2, w - 4, h - 4, 10); ctx.fill();
  ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 3;
  roundRect(ctx, 2, 2, w - 4, h - 4, 10); ctx.stroke();
  ctx.fillStyle = "#bbf7d0";
  ctx.font = "800 24px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(`FREE · ${sizeU}U`, w / 2, h / 2 + 1);
  t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  PLATE_TEX.set(key, t);
  return t;
}

function namePlateTexture(text, aspect) {
  const key = `n|${text}|${aspect.toFixed(2)}`;
  let t = PLATE_TEX.get(key);
  if (t) return t;
  const w = 512, h = Math.max(28, Math.round(w / Math.max(0.6, aspect)));
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1f2530"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#38bdf8"; ctx.fillRect(0, 0, 6, h);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = `700 ${Math.min(h * 0.45, 30)}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text.length > 34 ? `${text.slice(0, 33)}…` : text, w / 2, h / 2);
  t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  PLATE_TEX.set(key, t);
  return t;
}

function pduTexture(feed) {
  const key = `pdu|${feed}`;
  let t = PLATE_TEX.get(key);
  if (t) return t;
  const w = 64, h = 1024;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#14171c"; ctx.fillRect(0, 0, w, h);
  // metering head
  ctx.fillStyle = "#050607"; roundRect(ctx, 6, 8, w - 12, 70, 6); ctx.fill();
  ctx.fillStyle = "#22c55e"; ctx.font = "700 16px monospace"; ctx.textAlign = "center";
  ctx.fillText(feed === "A" ? "A 9.6" : "B 9.2", w / 2, 40);
  ctx.fillStyle = feed === "A" ? "#f59e0b" : "#38bdf8";
  ctx.font = "700 13px sans-serif";
  ctx.fillText(`PDU-${feed}`, w / 2, 64);
  // C13 outlets, grouped in banks of six
  const top = PDU_TEX_TOP * h, bottom = PDU_TEX_BOTTOM * h, n = PDU_OUTLETS;
  const step = (bottom - top) / n;
  for (let i = 0; i < n; i++) {
    const cy = top + step * (i + 0.5);
    if (i % 6 === 0) {
      ctx.fillStyle = feed === "A" ? "rgba(245,158,11,0.5)" : "rgba(56,189,248,0.5)";
      ctx.fillRect(2, cy - step / 2 + 1, 3, step * 6 - 2);
    }
    ctx.fillStyle = "#2c313a";
    roundRect(ctx, 12, cy - step * 0.38, w - 24, step * 0.76, 4); ctx.fill();
    ctx.fillStyle = "#050607";
    ctx.fillRect(w / 2 - 10, cy - 4, 5, 8);
    ctx.fillRect(w / 2 + 5, cy - 4, 5, 8);
    ctx.fillRect(w / 2 - 2, cy + 4, 4, 5);
  }
  t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  PLATE_TEX.set(key, t);
  return t;
}
const PDU_OUTLETS = 36;
// Where the outlet column starts and ends on the strip art, as a fraction of
// its height from the top -- the cords are plugged in at the same spots.
const PDU_TEX_TOP = 96 / 1024;
const PDU_TEX_BOTTOM = 1008 / 1024;

// Device photos, loaded once per URL.
const PHOTO_TEX = new Map();
const photoLoader = new THREE.TextureLoader();
function photoTexture(url) {
  if (!url) return null;
  let t = PHOTO_TEX.get(url);
  if (!t) {
    t = photoLoader.load(url);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 4;
    PHOTO_TEX.set(url, t);
  }
  return t;
}

// ═══════════════════════════════════════════════════════════════════════
// GEOMETRY -- a tiny accumulator so each colour/material is ONE mesh
// ═══════════════════════════════════════════════════════════════════════
class Accum {
  constructor() { this.pos = []; this.nrm = []; this.idx = []; }
  get empty() { return this.idx.length === 0; }
  box(cx, cy, cz, sx, sy, sz) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const F = [
      [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]]],
      [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]]],
      [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]]],
      [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]]],
      [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]]],
      [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]]],
    ];
    F.forEach(([n, cs]) => {
      const b = this.pos.length / 3;
      cs.forEach((q) => { this.pos.push(cx + q[0], cy + q[1], cz + q[2]); this.nrm.push(n[0], n[1], n[2]); });
      this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
  }
  // A round tube along a polyline, framed by parallel transport so it never
  // twists at a bend. Open-ended: every cable ends inside a plug.
  tube(pts, radius, radial = 6) {
    const n = pts.length;
    if (n < 2) return;
    const T = pts.map((_, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      return new THREE.Vector3().subVectors(b, a).normalize();
    });
    const helper = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const N = new THREE.Vector3().crossVectors(T[0], helper).normalize();
    const B = new THREE.Vector3().crossVectors(T[0], N).normalize();
    const axis = new THREE.Vector3();
    const base = this.pos.length / 3;
    for (let i = 0; i < n; i++) {
      if (i > 0) {
        axis.crossVectors(T[i - 1], T[i]);
        const len = axis.length();
        if (len > 1e-7) {
          axis.divideScalar(len);
          N.applyAxisAngle(axis, Math.acos(THREE.MathUtils.clamp(T[i - 1].dot(T[i]), -1, 1)));
        }
        B.crossVectors(T[i], N).normalize();
        N.crossVectors(B, T[i]).normalize();
      }
      for (let j = 0; j < radial; j++) {
        const th = (j / radial) * Math.PI * 2;
        const c = Math.cos(th), s = Math.sin(th);
        const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
        this.pos.push(pts[i].x + radius * nx, pts[i].y + radius * ny, pts[i].z + radius * nz);
        this.nrm.push(nx, ny, nz);
      }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = base + i * radial + j;
        const b = base + i * radial + ((j + 1) % radial);
        const c = a + radial;
        const d = b + radial;
        this.idx.push(a, b, c, b, d, c);
      }
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Path builder: straight runs and cubic Béziers, sampled into one polyline.
function pathPoints(parts) {
  const out = [];
  const push = (p) => {
    const last = out[out.length - 1];
    if (!last || last.distanceToSquared(p) > 1e-10) out.push(p);
  };
  parts.forEach((pt) => {
    if (pt.line) { push(pt.line[0].clone()); push(pt.line[1].clone()); return; }
    const [p0, p1, p2, p3] = pt.bez;
    const n = pt.n || 18;
    for (let i = 0; i <= n; i++) {
      const t = i / n, mt = 1 - t;
      const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
      push(V(
        a * p0.x + b * p1.x + c * p2.x + d * p3.x,
        a * p0.y + b * p1.y + c * p2.y + d * p3.y,
        a * p0.z + b * p1.z + c * p2.z + d * p3.z,
      ));
    }
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// ONE RACK'S GEOMETRY -- shared by the port catalogue, the default cabling
// plan, the dressing and the cable being carried
// ═══════════════════════════════════════════════════════════════════════
export function rackGeometry(dims) {
  const W = dims.W, D = dims.D, H = dims.H;
  const totalU = Math.max(1, dims.totalUnitsU || Math.floor(H / 0.04445));
  const unitH = H / totalU;
  // The cabinet's own envelope (mirrors makeRackBody).
  const GAP = 0.006, FW = 0.026;
  const Xo = W / 2 - GAP, Zo = D / 2 - GAP;
  const EQ_W = Math.min(0.482, W - 2 * FW - 0.04);
  const Z_FRONT = Zo - FW - 0.004;                     // equipment faces, cold aisle side
  const EQ_DEPTH = THREE.MathUtils.clamp(D * 0.74, 0.4, 0.8);
  const Z_REAR = Z_FRONT - EQ_DEPTH;                   // where every port and inlet is
  const Z_POST_IN = -(Zo - FW);                        // inside face of the rear posts
  // Depth order behind the equipment, from the servers outwards:
  //   ports → PDU strips (close in, so every power cord stays short and
  //   never has to cross a bundle) → the two dressed data bundles (nearest
  //   the rear door, so they are what you see first, as in a real rack).
  const PDU_W = 0.04, PDU_D = 0.05;
  const PDU_INNER_X = EQ_W / 2 - 0.023;
  const PDU_Z = Z_REAR - 0.05;
  const LANE_X0 = EQ_W / 2 - 0.005, LANE_DX = 0.0085, LANE_COLS = 2;
  const LANE_Z0 = PDU_Z - PDU_D / 2 - 0.014, LANE_DZ = 0.0078;
  const LANE_ROWS = Math.max(4, Math.min(12,
    Math.floor((LANE_Z0 - (Z_POST_IN + 0.012)) / LANE_DZ) + 1));
  const pduTop = H / 2 - FW - 0.11;
  const pduBottom = -H / 2 + FW + 0.1;
  const pduLen = pduTop - pduBottom;
  return {
    W, D, H, totalU, unitH, FW, Xo, Zo, EQ_W, Z_FRONT, EQ_DEPTH, Z_REAR, Z_POST_IN,
    PDU_W, PDU_D, PDU_INNER_X, PDU_Z,
    LANE_X0, LANE_DX, LANE_COLS, LANE_Z0, LANE_DZ, LANE_ROWS,
    PLUG_Z: Z_REAR - 0.013,                             // back of an RJ45 boot
    R_DATA: 0.0032, R_POWER: 0.0046,
    pduTop, pduBottom, pduLen,
    floorY: -H / 2 - 0.06,                              // where a cord leaves through the floor
    yOfU: (u) => -H / 2 + u * unitH,                   // bottom edge of U index u (0-based)
    outletY: (i) => pduTop - pduLen
      * (PDU_TEX_TOP + ((i + 0.5) * (PDU_TEX_BOTTOM - PDU_TEX_TOP)) / PDU_OUTLETS),
    clampSlot: (s) => {
      const sizeU = Math.max(1, Math.min(Math.floor(s.sizeU || 1), totalU));
      const startU = Math.max(0, Math.min(Math.floor(s.startU || 0), totalU - sizeU));
      return { startU, sizeU };
    },
  };
}

// ── Cable roles → medium ────────────────────────────────────────────────
export const POWER_ROLES = new Set(["powerA", "powerB"]);
/** copper | fibre | power */
export function roleMedium(role) {
  if (POWER_ROLES.has(role)) return "power";
  return COPPER_ROLES.has(role) ? "copper" : "fibre";
}
/** The roles a cable of this medium can be dressed as (for the type picker). */
export function rolesForMedium(medium) {
  return RACK_CABLE_ROLES.filter((r) => roleMedium(r.key) === medium);
}
function portMediumClass(port) {
  return port.medium === "power-in" || port.medium === "power-out" ? "power" : port.medium;
}

// The A network (and backup, SAN) is dressed up the A side with PDU-A, the
// B network (and mgmt, uplinks) up the B side -- lose one side's bundle and
// the other still carries, exactly like the power.
const ROLE_SIDE = { dataA: 1, backup: 1, san: 1, dataB: -1, mgmt: -1, uplink: -1 };
const DATA_PORT_NAMES = { dataA: "NIC 1", dataB: "NIC 2", backup: "NIC 3", mgmt: "iDRAC", san: "HBA" };

// ═══════════════════════════════════════════════════════════════════════
// PORT CATALOGUE -- every place a cable can plug in, in rack coordinates
// ═══════════════════════════════════════════════════════════════════════
/**
 * Every port in one rack: server NICs and PSUs, switch ports, patch-panel
 * and LIU ports, and the outlets on both PDU strips.
 * Port ids are stable (`<slotId>|<key>`, `pduA|o7`), so a cord can name them.
 * @returns {{ geom, ports: Map<string, object>, layout: Array }}
 */
export function rackPortCatalog(dims, slots) {
  const g = rackGeometry(dims);
  const ports = new Map();
  const layout = [];
  const sorted = [...(slots || [])].sort((a, b) => (b.startU || 0) - (a.startU || 0));

  sorted.forEach((slot) => {
    const { startU, sizeU } = g.clampSlot(slot);
    const h = sizeU * g.unitH - 0.003;
    const cy = g.yOfU(startU) + (sizeU * g.unitH) / 2;
    const kind = rackSlotKind(slot);
    layout.push({ slot, startU, sizeU, h, cy, kind });
    const device = (slot.deviceName || "Device").trim();
    const at = (p) => ({ x: (0.5 - p.u) * g.EQ_W, y: cy + h / 2 - p.v * h });
    const add = (key, pos, extra) => ports.set(`${slot.id}|${key}`, {
      id: `${slot.id}|${key}`, slotId: slot.id, key, x: pos.x, y: pos.y,
      side: pos.x >= 0 ? 1 : -1, device, planned: false, ...extra,
    });

    if (kind === "patch") {
      PATCH_PORTS.forEach((p, i) => add(`pp${i}`, at(p), { medium: "copper", kind: "patch", role: "dataA", label: `Port ${i + 1}` }));
    } else if (kind === "liu") {
      LIU_PORTS.forEach((p, i) => add(`lc${i}`, at(p), { medium: "fibre", kind: "liu", role: "uplink", label: `LC ${i + 1}` }));
    } else if (kind === "switch") {
      const cab = slot.cabling || {};
      const nCopper = Math.max(0, Math.min(48, cab.copper ?? 8));
      const nSfp = Math.max(0, Math.min(4, cab.sfp ?? 2));
      SWITCH_COPPER.forEach((p, k) => add(`gi${k}`, at(p), {
        medium: "copper", kind: "switch", role: cab.role || "dataA", label: `Gi ${k + 1}`, planned: k < nCopper,
      }));
      SWITCH_SFP.forEach((p, k) => add(`sfp${k}`, at(p), {
        medium: "fibre", kind: "switch", role: "uplink", label: `SFP+ ${k + 1}`, planned: k < nSfp,
      }));
      add("mgmt", at(SWITCH_MGMT), { medium: "copper", kind: "switch", role: "mgmt", label: "Mgmt", planned: cab.mgmt !== false });
      SWITCH_PSU.forEach((p, k) => add(`psu${k}`, at(p), { medium: "power-in", kind: "psu", label: `PSU ${k + 1}`, planned: true }));
    } else if (kind === "server" || kind === "device") {
      const map = SERVER_PORTS[slot.deviceId] || GENERIC_PORTS;
      const seen = {};
      map.data.forEach((p, i) => {
        const base = DATA_PORT_NAMES[p.role] || "Port";
        if (!p.label) seen[base] = (seen[base] || 0) + 1;
        add(`d${i}`, at(p), {
          medium: p.role === "san" ? "fibre" : "copper", kind: "nic", role: p.role,
          label: p.label || (p.role === "san" ? `HBA ${seen[base]}` : base),
          // A spare port is never cabled by the installer -- it is yours.
          planned: !p.spare,
        });
      });
      map.psu.forEach((p, i) => add(`psu${i}`, at(p), { medium: "power-in", kind: "psu", label: `PSU ${i + 1}`, planned: true }));
    }
  });

  // The outlets down both zero-U PDU strips (A on +X, B on -X).
  [1, -1].forEach((sx) => {
    const feed = sx > 0 ? "A" : "B";
    for (let i = 0; i < PDU_OUTLETS; i++) {
      const id = `pdu${feed}|o${i}`;
      ports.set(id, {
        id, slotId: `pdu${feed}`, key: `o${i}`, x: sx * (g.PDU_INNER_X - 0.028), y: g.outletY(i), side: sx,
        medium: "power-out", kind: "outlet", feed, role: feed === "A" ? "powerA" : "powerB",
        device: `PDU-${feed}`, label: `Outlet ${i + 1}`, planned: false,
      });
    }
  });
  return { geom: g, ports, layout };
}

/** Where a cable's end sits when plugged into `port` (rack coordinates). */
export function portPlugPoint(g, port) {
  return port.kind === "outlet" ? V(port.x, port.y, g.PDU_Z) : V(port.x, port.y, g.PLUG_Z);
}
/** The way a cable travels as it goes INTO the port. */
export function portInDir(port) {
  return port.kind === "outlet" ? V(port.side, 0, 0) : V(0, 0, 1);
}

/**
 * May a cable of `role` be plugged into `port`?
 * @param {object} o.fixedPort  the port the cable's other end is in (null if
 *                              that end is in another rack / device / loose)
 */
export function canPlugInto(role, port, { fixedPort = null, sameRack = true } = {}) {
  if (!port) return false;
  const medium = roleMedium(role);
  const pm = portMediumClass(port);
  if (medium !== pm) return false;
  if (medium === "power") {
    // Power stays inside its own rack and always joins an inlet to an outlet
    // -- and a Power A cord goes to PDU-A, a Power B cord to PDU-B.
    if (!sameRack) return false;
    if (port.kind === "outlet" && port.feed !== (role === "powerA" ? "A" : "B")) return false;
    if (fixedPort) return fixedPort.medium !== port.medium;
    return true;
  }
  return true;
}

/** The cable types a new cable can be, grouped the way they are cabled. */
export const CABLE_TYPE_GROUPS = [
  { medium: "copper", label: "Network · Cat6", goesTo: "server NICs, patch panels, switch ports" },
  { medium: "fibre",  label: "Fibre",          goesTo: "server HBAs, fibre LIU, switch SFP+" },
  { medium: "power",  label: "Power",          goesTo: "server / switch PSUs and PDU outlets" },
];

// ═══════════════════════════════════════════════════════════════════════
// LANES -- each side's bundle is a small grid of lanes; a cord owns its
// lane between where it joins the bundle and where it leaves it
// ═══════════════════════════════════════════════════════════════════════
function makeLanes(g) {
  const lanes = { 1: [], [-1]: [] };
  [1, -1].forEach((sd) => {
    for (let col = 0; col < g.LANE_COLS; col++) {
      for (let row = 0; row < g.LANE_ROWS; row++) {
        lanes[sd].push({ x: sd * (g.LANE_X0 - col * g.LANE_DX), z: g.LANE_Z0 - row * g.LANE_DZ, col, row, busy: [] });
      }
    }
  });
  return lanes;
}
function allocateLanes(lanes, links) {
  [...links].sort((a, b) => a.lo - b.lo).forEach((l) => {
    const pool = lanes[l.side];
    let lane = pool.find((L) => L.busy.every(([a, b]) => l.hi < a - 0.01 || l.lo > b + 0.01));
    if (!lane) lane = pool.reduce((m, L) => (L.busy.length < m.busy.length ? L : m), pool[0]);
    lane.busy.push([l.lo, l.hi]);
    l.lane = lane;
  });
}
const linkSide = (role, srcPort) => ROLE_SIDE[role] ?? srcPort.side;

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT CABLING -- how a tidy installer would dress this rack
// ═══════════════════════════════════════════════════════════════════════
/**
 * Cords for every planned port that is not cabled yet: NICs / switch ports
 * to the patch panels and LIU (copper → patch panel, fibre → LIU), PSUs to
 * the nearest free outlet on their own side.
 * @param {object} o
 * @param {Array}  o.existing     cords already in this rack (their ports count as taken)
 * @param {Set}    [o.onlySlotIds] only cable these slots (a device just added)
 * @param {Function} o.newId      id factory
 * @returns {Array} new cords
 */
export function planRackCords({ dims, slots, rackId, existing = [], onlySlotIds = null, newId }) {
  const { geom: g, ports } = rackPortCatalog(dims, slots);
  const used = new Set();
  existing.forEach((c) => [c.a, c.b].forEach((e) => { if (e?.rackId === rackId && e.portId) used.add(e.portId); }));
  const mine = (p) => !onlySlotIds || onlySlotIds.has(p.slotId);
  const all = [...ports.values()];
  const out = [];

  // Power: every inlet to the nearest free outlet on its own side.
  all.filter((p) => p.kind === "psu" && p.planned && !used.has(p.id) && mine(p))
    .sort((a, b) => b.y - a.y)
    .forEach((p) => {
      const feed = p.side > 0 ? "A" : "B";
      let best = null, bestD = Infinity;
      all.forEach((o) => {
        if (o.kind !== "outlet" || o.feed !== feed || used.has(o.id)) return;
        const d = Math.abs(o.y - p.y);
        if (d < bestD) { bestD = d; best = o; }
      });
      if (!best) return;
      used.add(best.id);
      out.push({ id: newId(), role: feed === "A" ? "powerA" : "powerB", a: { rackId, portId: p.id }, b: { rackId, portId: best.id } });
    });

  // Data: pick each cord's panel, keeping it on its own side where there is room.
  const targets = all.filter((p) => (p.kind === "patch" || p.kind === "liu") && !used.has(p.id));
  const links = [];
  all.filter((p) => p.planned && (p.kind === "nic" || p.kind === "switch") && !used.has(p.id) && mine(p))
    .sort((a, b) => b.y - a.y || Math.abs(b.x) - Math.abs(a.x))
    .forEach((src) => {
      const side = linkSide(src.role, src);
      const pool = targets.filter((t) => t.medium === src.medium && !used.has(t.id));
      if (!pool.length) return;                        // nothing to land on: leave it free
      const same = pool.filter((t) => t.side === side);
      const cand = same.length ? same : pool;
      // Nearest panel first; the exact port is chosen once the lanes are known.
      const panelY = cand.reduce((m, t) => (Math.abs(t.y - src.y) < Math.abs(m - src.y) ? t.y : m), cand[0].y);
      const slotId = cand.find((t) => Math.abs(t.y - panelY) < 1e-6).slotId;
      const t0 = cand.find((t) => t.slotId === slotId);
      used.add(t0.id);
      links.push({ src, side, panel: slotId, tSide: t0.side, target: t0 });
    });

  // Lanes first (same allocation the dressing makes), then ports: on each
  // panel side the shallowest / outermost lane takes the outermost port --
  // that is what keeps a fan of cords from crossing.
  links.forEach((l) => {
    l.lo = Math.min(l.src.y, l.target.y) - 0.02;
    l.hi = Math.max(l.src.y, l.target.y) + 0.02;
  });
  allocateLanes(makeLanes(g), links);
  const groups = new Map();
  links.forEach((l) => {
    const key = `${l.panel}|${l.tSide}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  });
  groups.forEach((list) => {
    const byOuter = list.map((l) => l.target).sort((a, b) => Math.abs(b.x) - Math.abs(a.x));
    [...list]
      .sort((a, b) => (a.side !== a.tSide) - (b.side !== b.tSide)
        || (a.lane.row * g.LANE_COLS + a.lane.col) - (b.lane.row * g.LANE_COLS + b.lane.col))
      .forEach((l, i) => { l.target = byOuter[i]; });
  });
  links.forEach((l) => out.push({
    id: newId(), role: l.src.role, a: { rackId, portId: l.src.id }, b: { rackId, portId: l.target.id },
  }));
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// THE DRESSING -- equipment, reserved / free space, PDUs and every cord
// ═══════════════════════════════════════════════════════════════════════
// Port markers are screen-size dots. A 1 cm socket seen from three metres is
// four pixels -- far too small to aim at -- so the dots stay the same size
// on screen however far away the camera is.
//   free  green   nothing in it: plug straight in
//   swap  orange  in use: plugging here unplugs the cable that is in it
//   from  yellow  where the cable in your hand starts
const MARKER_COLORS = { free: 0x22c55e, swap: 0xf97316, from: 0xfacc15 };
let DOT_TEX = null;
function dotTexture() {
  if (DOT_TEX) return DOT_TEX;
  const c = makeCanvas(64, 64);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(32, 32, 21, 0, Math.PI * 2); ctx.fill();
  DOT_TEX = new THREE.CanvasTexture(c);
  return DOT_TEX;
}
let RING_TEX = null;
function ringTexture() {
  if (RING_TEX) return RING_TEX;
  const c = makeCanvas(64, 64);
  const ctx = c.getContext("2d");
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.stroke();
  RING_TEX = new THREE.CanvasTexture(c);
  return RING_TEX;
}

function labelTexture(text) {
  const key = `l|${text}`;
  let t = PLATE_TEX.get(key);
  if (t) return t;
  const w = 512, h = 64;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(10,14,26,0.86)";
  roundRect(ctx, 2, 2, w - 4, h - 4, 12); ctx.fill();
  ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3;
  roundRect(ctx, 2, 2, w - 4, h - 4, 12); ctx.stroke();
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "700 26px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text.length > 36 ? `${text.slice(0, 35)}…` : text, w / 2, h / 2 + 1);
  t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  PLATE_TEX.set(key, t);
  return t;
}

/**
 * @param {object} o
 * @param {{W:number,D:number,H:number,totalUnitsU:number}} o.dims  the rack's own dims
 * @param {Array}  o.slots          the rack's slot list (startU from the bottom)
 * @param {Array}  [o.cords]        patch / power cords (only those touching this rack are drawn)
 * @param {string} [o.rackId]
 * @param {boolean} [o.isDark]
 * @param {string} [o.excludeCordId] a cord being carried -- drawn by the hand instead
 * @param {Function} [o.describeEnd] (end) => text for a cord's far end in another rack / device
 * @returns {{ group: THREE.Group, summary: object }}
 */
export function buildRackViewDressing({
  dims, slots, cords = [], rackId = null, isDark = true, excludeCordId = null, describeEnd = null,
}) {
  const { geom: g, ports, layout } = rackPortCatalog(dims, slots);
  const { H, totalU, unitH, FW, Xo, Zo, EQ_W, Z_FRONT, EQ_DEPTH, Z_REAR, PLUG_Z, PDU_Z, PDU_W, PDU_D, PDU_INNER_X } = g;

  const group = new THREE.Group();
  group.name = "RackViewDressing";
  group.userData.isRackViewDressing = true;
  const ownedMats = [];
  const own = (m) => { ownedMats.push(m); return m; };

  // ── Materials ──
  const chassisMat = own(new THREE.MeshStandardMaterial({ color: 0x2a313c, metalness: 0.55, roughness: 0.5 }));
  const railMat = own(new THREE.MeshStandardMaterial({ color: 0x8b98aa, metalness: 0.75, roughness: 0.35 }));
  const pduBodyMat = own(new THREE.MeshStandardMaterial({ color: 0x15181d, metalness: 0.4, roughness: 0.55 }));
  const tieMat = own(new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.8 }));
  const faceMats = new Map();
  const faceMat = (tex) => {
    let m = faceMats.get(tex);
    if (!m) {
      m = own(new THREE.MeshStandardMaterial({
        map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.42,
        roughness: 0.55, metalness: 0.1,
      }));
      faceMats.set(tex, m);
    }
    return m;
  };
  const roleMats = new Map();
  const roleMat = (role) => {
    let m = roleMats.get(role);
    if (!m) {
      const col = new THREE.Color(ROLE_HEX[role] || "#9ca3af");
      const power = POWER_ROLES.has(role);
      m = own(new THREE.MeshStandardMaterial({
        color: col, roughness: power ? 0.38 : 0.48, metalness: power ? 0.25 : 0.05,
        emissive: col, emissiveIntensity: power ? 0.05 : 0.22,
      }));
      roleMats.set(role, m);
    }
    return m;
  };

  const chassis = new Accum();
  const rails = new Accum();
  const ties = new Accum();
  const pick = new Accum();                 // fat, invisible tubes: what a long-press hits
  const pickRanges = [];
  const byRole = new Map();
  const acc = (role) => {
    let a = byRole.get(role);
    if (!a) { a = new Accum(); byRole.set(role, a); }
    return a;
  };

  const addPlane = (tex, w, h, x, y, z, back, opts = {}) => {
    const mat = opts.material || faceMat(tex);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (back) m.rotation.y = Math.PI;
    if (opts.renderOrder) m.renderOrder = opts.renderOrder;
    group.add(m);
    return m;
  };

  // ── 19" mounting rails, front and rear ──
  [-1, 1].forEach((sx) => {
    const rx = sx * (EQ_W / 2 + 0.009);
    rails.box(rx, 0, Z_FRONT - 0.012, 0.016, H - 2 * FW, 0.022);
    rails.box(rx, 0, Z_REAR + 0.02, 0.016, H - 2 * FW, 0.022);
  });

  // ── Smoked side panels -- the cabinet still reads as a cabinet ──
  const glassMat = own(new THREE.MeshStandardMaterial({
    color: isDark ? 0x1e293b : 0x94a3b8, metalness: 0.3, roughness: 0.2,
    transparent: true, opacity: isDark ? 0.26 : 0.2, depthWrite: false, side: THREE.DoubleSide,
  }));
  [-1, 1].forEach((sx) => {
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.004, H - 2 * FW, 2 * (Zo - FW)), glassMat);
    gl.position.set(sx * (Xo - 0.003), 0, 0);
    gl.renderOrder = 1;
    group.add(gl);
  });

  // ── Equipment and reserved space ──
  const occupied = new Array(totalU).fill(false);
  const counts = { servers: 0, network: 0, devices: 0, reserved: 0 };
  layout.forEach(({ slot, startU, sizeU, h, cy, kind }) => {
    for (let u = startU; u < startU + sizeU; u++) occupied[u] = true;
    const tagPort = (mesh) => {
      mesh.userData.isRackSlotPort = true;
      mesh.userData.slotId = slot.id;
      mesh.userData.slot = slot;
      if (rackId) mesh.userData.rackDeviceId = rackId;
    };

    if (kind === "reserved") {
      counts.reserved += 1;
      const note = String(slot.deviceName || "").replace(RESERVED_RE, "").replace(/^[\s—–:-]+/, "").trim();
      const vol = new THREE.Mesh(
        new THREE.BoxGeometry(EQ_W, h, EQ_DEPTH),
        own(new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.07, depthWrite: false })),
      );
      vol.position.set(0, cy, (Z_FRONT + Z_REAR) / 2);
      vol.renderOrder = 2;
      group.add(vol);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(vol.geometry),
        own(new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.55 })),
      );
      edges.position.copy(vol.position);
      group.add(edges);
      const tex = reservedPlateTexture(sizeU, note, EQ_W / h);
      // One-sided: from the rear you must not read the front plate backwards
      // through the see-through volume.
      const plateMat = own(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      addPlane(tex, EQ_W, h, 0, cy, Z_FRONT + 0.002, false, { material: plateMat, renderOrder: 3 });
      addPlane(tex, EQ_W, h, 0, cy, Z_REAR - 0.002, true, { material: plateMat, renderOrder: 3 });
      return;
    }

    const gear = RACK_GEAR[slot.deviceId];
    if (gear) {
      counts.network += 1;
      // Rear-mounted: ports face the hot aisle, a blank faces the cold aisle.
      const depth = Math.min(gear.depthM, EQ_DEPTH);
      chassis.box(0, cy, Z_REAR + depth / 2, EQ_W, h, depth);
      tagPort(addPlane(gearTexture(gear.kind, "back"), EQ_W, h, 0, cy, Z_REAR - 0.0012, true));
      chassis.box(0, cy, Z_FRONT - 0.003, EQ_W, h, 0.006);
      addPlane(gearTexture(gear.kind === "switch" ? "switch" : "blank", "front"), EQ_W, h, 0, cy, Z_FRONT + 0.0008, false);
      return;
    }

    // A server (photo) or a device typed in by name.
    if (kind === "server") counts.servers += 1; else counts.devices += 1;
    chassis.box(0, cy, (Z_FRONT + Z_REAR) / 2, EQ_W, h, EQ_DEPTH);
    const label = (slot.deviceName || "Device").trim();
    const frontTex = photoTexture(slot.frontImageUrl) || namePlateTexture(label, EQ_W / h);
    const backTex = photoTexture(slot.backImageUrl) || namePlateTexture(label, EQ_W / h);
    tagPort(addPlane(frontTex, EQ_W, h, 0, cy, Z_FRONT + 0.0012, false));
    tagPort(addPlane(backTex, EQ_W, h, 0, cy, Z_REAR - 0.0012, true));
    // Rack ears, so a server visibly bolts to the front rails.
    [-1, 1].forEach((sx) => chassis.box(sx * (EQ_W / 2 + 0.009), cy, Z_FRONT + 0.001, 0.018, h, 0.004));
  });

  // ── FREE space: a tag on every open run of two units or more ──
  let freeU = 0;
  for (let u = 0; u < totalU;) {
    if (occupied[u]) { u++; continue; }
    let n = 0;
    while (u + n < totalU && !occupied[u + n]) n++;
    freeU += n;
    if (n >= 2) {
      const tex = freeTagTexture(n);
      const tagMat = own(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      const cy = g.yOfU(u) + (n * unitH) / 2;
      const th = Math.min(0.04, n * unitH - 0.01);
      addPlane(tex, th * (256 / 48), th, 0, cy, Z_FRONT + 0.004, false, { material: tagMat, renderOrder: 3 });
      addPlane(tex, th * (256 / 48), th, 0, cy, Z_REAR - 0.004, true, { material: tagMat, renderOrder: 3 });
    }
    u += n;
  }

  // ── Zero-U PDUs in the two rear corners ──
  // A (the +X side, on your LEFT looking at the rear) and B (-X, right).
  const pduY = (g.pduTop + g.pduBottom) / 2;
  [1, -1].forEach((sx) => {
    const cx = sx * (PDU_INNER_X + PDU_W / 2);
    const feed = sx > 0 ? "A" : "B";
    const mats = [pduBodyMat, pduBodyMat, pduBodyMat, pduBodyMat, pduBodyMat, pduBodyMat];
    // The outlets face the middle of the rack: -X face on A, +X face on B.
    // (A box's side faces run V up the height, so the tall strip art
    // stands upright on them as drawn.)
    mats[sx > 0 ? 1 : 0] = faceMat(pduTexture(feed));
    const body = new THREE.Mesh(new THREE.BoxGeometry(PDU_W, g.pduLen, PDU_D), mats);
    body.position.set(cx, pduY, PDU_Z);
    group.add(body);
    // The feed: a thick cord from the bottom of the strip into the floor.
    const feedPts = pathPoints([
      { line: [V(cx, g.pduBottom + 0.01, PDU_Z), V(cx, g.pduBottom - 0.05, PDU_Z)] },
      { bez: [V(cx, g.pduBottom - 0.05, PDU_Z), V(cx, -H / 2 + 0.02, PDU_Z),
        V(cx, -H / 2 + 0.01, PDU_Z + 0.02), V(cx, -H / 2 - 0.03, PDU_Z + 0.04)], n: 10 },
    ]);
    acc(feed === "A" ? "powerA" : "powerB").tube(feedPts, 0.0085, 8);
  });

  // ── Port markers: shown while a cable is being carried (or for + NEW
  //    CABLE), each a dot just behind its socket ──
  const portList = [...ports.values()];
  // Buffers sized once for every port; paintPortMarkers() rewrites them in
  // place and draws only the first N.
  const makeDots = (size, tex, capacity) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
    geo.setDrawRange(0, 0);
    const dots = new THREE.Points(geo, own(new THREE.PointsMaterial({
      size, sizeAttenuation: false, vertexColors: true, map: tex,
      // Always on top: close up, the cable leaving a busy port would
      // otherwise hide its dot completely.
      transparent: true, alphaTest: 0.3, depthWrite: false, depthTest: false,
    })));
    dots.visible = false;
    dots.renderOrder = 8;
    dots.frustumCulled = false;
    return dots;
  };
  const markers = makeDots(13, dotTexture(), Math.max(1, portList.length));
  markers.name = "RackViewPortMarkers";
  markers.userData.isPortMarkers = true;
  markers.userData.portIds = portList.map((p) => p.id);
  markers.userData.positions = portList.map((p) => (p.kind === "outlet"
    ? V(p.side * (PDU_INNER_X - 0.036), p.y, PDU_Z)
    : V(p.x, p.y, Z_REAR - 0.022)));
  // The ring round the port the pointer is on.
  const hotRing = makeDots(24, ringTexture(), 1);
  hotRing.name = "RackViewPortHot";
  markers.userData.hotRing = hotRing;
  group.add(markers, hotRing);

  // ── The cords ─────────────────────────────────────────────────────────
  const onThisRack = (e) => !!e && e.rackId === rackId;
  const mine = cords.filter((c) => c.id !== excludeCordId && (onThisRack(c.a) || onThisRack(c.b)));
  const portOfEnd = (e) => (onThisRack(e) ? ports.get(e.portId) || null : null);
  const cordEnds = new Map();                       // cordId -> { a, b } where each end physically is
  const occupiedPorts = new Map();                  // portId -> cordId
  const links = [];                                 // data cords that ride a bundle
  const hangs = [];                                 // an end plugged here, the other loose
  const powers = [];                                // PSU ↔ outlet
  const linkCount = {};
  let patchCords = 0, powerCords = 0, crossRack = 0;

  mine.forEach((c) => {
    const pa = portOfEnd(c.a), pb = portOfEnd(c.b);
    if (pa) occupiedPorts.set(pa.id, c.id);
    if (pb) occupiedPorts.set(pb.id, c.id);
    // An end that names a port this rack no longer has is treated as loose.
    const remoteA = c.a && !onThisRack(c.a), remoteB = c.b && !onThisRack(c.b);
    const power = roleMedium(c.role) === "power";
    if (power) powerCords += 1; else { patchCords += 1; linkCount[c.role] = (linkCount[c.role] || 0) + 1; }
    if (pa && pb) {
      if (power) powers.push({ cord: c, pa, pb });
      else links.push({ cord: c, src: pa, dst: pb, endKeys: ["a", "b"] });
    } else if ((pa && remoteB) || (pb && remoteA)) {
      crossRack += 1;
      const local = pa || pb;
      links.push({ cord: c, src: local, remote: pa ? c.b : c.a, endKeys: pa ? ["a", "b"] : ["b", "a"] });
    } else if (pa || pb) {
      hangs.push({ cord: c, port: pa || pb, endKeys: pa ? ["a", "b"] : ["b", "a"] });
    }
  });

  // Lanes for everything that rides a bundle.
  links.forEach((l) => {
    const ty = l.remote ? g.floorY : l.dst.y;
    l.side = linkSide(l.cord.role, l.src);
    l.lo = Math.min(l.src.y, ty) - 0.02;
    l.hi = Math.max(l.src.y, ty) + 0.02;
  });
  const lanes = makeLanes(g);
  allocateLanes(lanes, links);

  const addCord = (cordId, role, pts, radius, radial) => {
    acc(role).tube(pts, radius, radial);
    const start = pick.idx.length / 3;
    pick.tube(pts, 0.011, 4);
    pickRanges.push({ start, end: pick.idx.length / 3, cordId });
  };
  const boot = (role, x, y) => acc(role).box(x, y, Z_REAR - 0.007, 0.012, 0.01, 0.014);

  // 1. Patch cords: out of the port, sweep into the lane, along the bundle,
  //    then fan into the other port -- or down through the floor, for a cord
  //    whose other end is in another rack or device.
  links.forEach((l) => {
    const { src, lane, cord } = l;
    const tx = l.remote ? lane.x : l.dst.x;
    const ty = l.remote ? g.floorY : l.dst.y;
    const s = ty >= src.y ? 1 : -1;
    const span = Math.abs(ty - src.y);
    // How far up (or down) the cord travels while it swings across: a
    // gentle diagonal out of the port, a tight waterfall into the panel.
    const riseJ = Math.min(span * 0.45, 0.03 + Math.abs(lane.x - src.x) * 0.4);
    const riseE = Math.min(span * 0.45, 0.02 + Math.abs(lane.x - tx) * 0.22);
    let yJ = src.y + s * riseJ;
    let yE = ty - s * riseE;
    if ((yE - yJ) * s < 0) { const mid = (yJ + yE) / 2; yJ = mid; yE = mid; }

    boot(cord.role, src.x, src.y);
    const parts = [
      { bez: [V(src.x, src.y, PLUG_Z), V(src.x, src.y, lane.z), V(lane.x, yJ - s * riseJ * 0.6, lane.z), V(lane.x, yJ, lane.z)] },
    ];
    if (l.remote) {
      parts.push({ line: [V(lane.x, yJ, lane.z), V(lane.x, g.floorY, lane.z)] });
    } else {
      boot(cord.role, tx, ty);
      if (Math.abs(yE - yJ) > 1e-4) parts.push({ line: [V(lane.x, yJ, lane.z), V(lane.x, yE, lane.z)] });
      parts.push({ bez: [V(lane.x, yE, lane.z), V(lane.x, yE + s * riseE * 0.6, lane.z), V(tx, ty, lane.z), V(tx, ty, PLUG_Z)] });
    }
    addCord(cord.id, cord.role, pathPoints(parts), g.R_DATA, 6);
    const ends = {};
    ends[l.endKeys[0]] = V(src.x, src.y, PLUG_Z);
    ends[l.endKeys[1]] = l.remote ? V(lane.x, -H / 2, lane.z) : V(tx, ty, PLUG_Z);
    cordEnds.set(cord.id, ends);

    if (l.remote) {
      // Where does it go? A small tag just behind the port.
      const text = `→ ${describeEnd ? describeEnd(l.remote) : "another device"}`;
      const sp = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: labelTexture(text), transparent: true, depthWrite: false })));
      sp.scale.set(0.24, 0.03, 1);
      sp.position.set(src.x, src.y + 0.026, PLUG_Z - 0.05);
      sp.renderOrder = 6;
      sp.userData.isCordTag = true;
      group.add(sp);
    }
  });

  // 2. Power cords: PSU inlet to its outlet on the strip.
  powers.forEach(({ cord, pa, pb }) => {
    const psu = pa.kind === "outlet" ? pb : pa;
    const outlet = pa.kind === "outlet" ? pa : pb;
    const role = outlet.feed === "A" ? "powerA" : "powerB";
    const a = acc(role);
    const sx = outlet.side;
    // C14 plug on the PSU, C13 plug in the strip.
    a.box(psu.x, psu.y, Z_REAR - 0.015, 0.022, 0.016, 0.03);
    a.box(sx * (PDU_INNER_X - 0.014), outlet.y, PDU_Z, 0.028, 0.02, 0.018);
    const start = V(psu.x, psu.y, Z_REAR - 0.03);
    const end = V(outlet.x, outlet.y, PDU_Z);
    addCord(cord.id, role,
      pathPoints([{ bez: [start, V(psu.x, psu.y, PDU_Z), V(end.x - sx * 0.06, end.y, PDU_Z), end], n: 22 }]),
      g.R_POWER, 7);
    cordEnds.set(cord.id, pa.kind === "outlet" ? { a: end, b: start } : { a: start, b: end });
  });

  // 3. Unplugged ends: the cord hangs loose from the port it is still in.
  hangs.forEach(({ cord, port, endKeys }) => {
    const power = roleMedium(cord.role) === "power";
    const plug = portPlugPoint(g, port);
    const out = port.kind === "outlet" ? V(-port.side, 0, 0) : V(0, 0, -1);
    const tipY = Math.max(-H / 2 + 0.04, plug.y - 0.3);
    const tip = V(plug.x + out.x * 0.07 + 0.02 * port.side, tipY, plug.z + out.z * 0.1 - 0.015);
    const role = power && port.kind === "outlet" ? (port.feed === "A" ? "powerA" : "powerB") : cord.role;
    const a = acc(role);
    if (port.kind === "outlet") a.box(port.side * (PDU_INNER_X - 0.014), port.y, PDU_Z, 0.028, 0.02, 0.018);
    else if (power) a.box(port.x, port.y, Z_REAR - 0.015, 0.022, 0.016, 0.03);
    else boot(cord.role, port.x, port.y);
    addCord(cord.id, role, pathPoints([{
      bez: [plug, V(plug.x + out.x * 0.07, plug.y, plug.z + out.z * 0.07), V(tip.x, tip.y + 0.14, tip.z), tip], n: 20,
    }]), power ? g.R_POWER : g.R_DATA, 6);
    // The loose connector at the free end.
    a.box(tip.x, tip.y - 0.012, tip.z, power ? 0.02 : 0.011, 0.026, power ? 0.016 : 0.01);
    const ends = {};
    ends[endKeys[0]] = plug;
    ends[endKeys[1]] = tip;
    cordEnds.set(cord.id, ends);
  });

  // Velcro ties around each bundle, every ~30 cm where it carries cords.
  [1, -1].forEach((sd) => {
    for (let y = -H / 2 + 0.25; y < H / 2 - 0.1; y += 0.3) {
      const live = lanes[sd].filter((L) => L.busy.some(([lo, hi]) => y > lo + 0.04 && y < hi - 0.04));
      if (!live.length) continue;
      const xs = live.map((L) => L.x), zs = live.map((L) => L.z);
      const x0 = Math.min(...xs) - g.R_DATA - 0.002, x1 = Math.max(...xs) + g.R_DATA + 0.002;
      const z0 = Math.min(...zs) - g.R_DATA - 0.002, z1 = Math.max(...zs) + g.R_DATA + 0.002;
      ties.box((x0 + x1) / 2, y, (z0 + z1) / 2, x1 - x0, 0.012, z1 - z0);
    }
  });

  // ── Emit the merged meshes ──
  const emit = (a, mat, name) => {
    if (a.empty) return null;
    const m = new THREE.Mesh(a.geometry(), mat);
    m.name = name;
    group.add(m);
    return m;
  };
  emit(chassis, chassisMat, "RackViewChassis");
  emit(rails, railMat, "RackViewRails");
  emit(ties, tieMat, "RackViewTies");
  byRole.forEach((a, role) => emit(a, roleMat(role), `RackViewCables_${role}`));
  // Never drawn -- only ever hit-tested (three raycasts hidden meshes too).
  const pickMesh = emit(pick, own(new THREE.MeshBasicMaterial({ visible: false })), "RackViewCordPick");
  if (pickMesh) {
    pickMesh.visible = false;
    pickMesh.userData.isCordPick = true;
    pickMesh.userData.cordRanges = pickRanges;
  }

  group.userData.ownedMats = ownedMats;
  group.userData.rackGeom = g;
  group.userData.ports = ports;
  group.userData.portMarkers = markers;
  group.userData.cordEnds = cordEnds;
  group.userData.occupiedPorts = occupiedPorts;
  const reservedU = (slots || []).filter(isReservedSlot).reduce((sum, x) => sum + g.clampSlot(x).sizeU, 0);
  return {
    group,
    summary: {
      totalU, freeU, reservedU, usedU: totalU - freeU - reservedU,
      ...counts,
      links: linkCount,
      patchCords,
      powerCords,
      crossRack,
    },
  };
}

/** Which cord a hit on the pick mesh belongs to. */
export function cordIdFromPick(hit) {
  const ranges = hit?.object?.userData?.cordRanges;
  if (!ranges || hit.faceIndex == null) return null;
  const r = ranges.find((x) => hit.faceIndex >= x.start && hit.faceIndex < x.end);
  return r ? r.cordId : null;
}

/**
 * Colour / show the port markers.
 * @param {Function} stateOf (portId) => "free" | "swap" | "from" | "hidden"
 * @param {boolean}  visible
 * @param {string}   [hotId] the port under the pointer (gets a white ring)
 */
export function paintPortMarkers(markers, stateOf, visible, hotId = null) {
  if (!markers) return;
  const ring = markers.userData.hotRing;
  const pos = markers.geometry.attributes.position;
  const col = markers.geometry.attributes.color;
  const c = new THREE.Color();
  let n = 0, hot = null;
  if (visible) {
    markers.userData.portIds.forEach((id, i) => {
      const st = stateOf(id);
      if (!st || st === "hidden") return;
      const p = markers.userData.positions[i];
      c.setHex(MARKER_COLORS[st] ?? MARKER_COLORS.free);
      pos.setXYZ(n, p.x, p.y, p.z);
      col.setXYZ(n, c.r, c.g, c.b);
      n += 1;
      if (id === hotId) hot = p;
    });
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  markers.geometry.setDrawRange(0, n);
  markers.visible = n > 0;
  if (ring) {
    if (hot) {
      ring.geometry.attributes.position.setXYZ(0, hot.x, hot.y, hot.z);
      ring.geometry.attributes.color.setXYZ(0, 1, 1, 1);
      ring.geometry.attributes.position.needsUpdate = true;
      ring.geometry.attributes.color.needsUpdate = true;
    }
    ring.geometry.setDrawRange(0, hot ? 1 : 0);
    ring.visible = !!hot;
  }
}

/**
 * The cable in your hand: a live, highlighted run from where its other end
 * is to wherever the pointer is (or the port it is about to snap into).
 */
export function buildHandCable({ from, fromDir, to, toDir, role }) {
  const k = Math.max(0.05, Math.min(0.35, from.distanceTo(to) * 0.35));
  const pts = pathPoints([{
    bez: [from, from.clone().addScaledVector(fromDir, k), to.clone().addScaledVector(toDir, -k), to], n: 30,
  }]);
  const a = new Accum();
  const power = POWER_ROLES.has(role);
  a.tube(pts, power ? 0.0055 : 0.0042, 8);
  // The connector you are holding.
  a.box(to.x, to.y, to.z, power ? 0.022 : 0.013, power ? 0.018 : 0.011, power ? 0.03 : 0.018);
  const col = new THREE.Color(ROLE_HEX[role] || "#e2e8f0");
  const mat = new THREE.MeshStandardMaterial({
    color: col, emissive: col, emissiveIntensity: power ? 0.35 : 0.6, roughness: 0.35, metalness: 0.1,
  });
  const mesh = new THREE.Mesh(a.geometry(), mat);
  mesh.name = "RackViewHandCable";
  mesh.renderOrder = 7;
  return mesh;
}

export function disposeHandCable(mesh) {
  if (!mesh) return;
  mesh.parent?.remove(mesh);
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

/** Free everything a dressing made (cached art and photos stay shared). */
export function disposeRackViewDressing(group) {
  if (!group) return;
  group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  (group.userData.ownedMats || []).forEach((m) => m.dispose());
  group.userData.ownedMats = [];
  group.parent?.remove(group);
}
