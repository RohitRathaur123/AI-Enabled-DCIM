// ── Real device-image rack faces (shared by DCIMViewer & Datacenter3dview) ─
// Builds/updates the stack of real device-photo planes on a rack's front
// and back face, positioned by actual U-slot (works for 6U, 42U, 48U...
// any rack height) instead of a fixed number of equal segments.

import * as THREE from "three";

// 1U = 1.75in, matches Datacenter3dview.jsx's own U_HEIGHT constant.
export const U_HEIGHT_M = 0.04445;

export function computeTotalUnits(rackHeightM) {
  return Math.max(1, Math.floor(rackHeightM / U_HEIGHT_M));
}

// Shared texture cache so the same device photo used in many racks (or on
// both front/back-matching slots) is only decoded/uploaded to the GPU once.
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();
function loadCachedTexture(url) {
  if (!url) return null;
  if (textureCache.has(url)) return textureCache.get(url);
  const tex = textureLoader.load(url);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(url, tex);
  return tex;
}

// -- Text nameplate for real per-slot names that don't have a photo ------
// Mirrors a physical rack-elevation nameplate: light plate, bold dark text,
// sized to the slot's own aspect ratio so it reads cleanly at any U-height.
// Whatever the caller types (e.g. "F | AO | CDU Server 19") is shown as-is
// -- this file makes no assumption about site/naming conventions.
const nameplateTextureCache = new Map(); // "text:aspect" -> shared CanvasTexture
function drawNameLabelCanvas(text, aspect) {
  const key = `${text}:${aspect.toFixed(2)}`;
  if (nameplateTextureCache.has(key)) return nameplateTextureCache.get(key);

  const w = 512;
  const h = Math.max(24, Math.round(w / Math.max(0.6, aspect)));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#eef1f6";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#9aa7ba";
  ctx.lineWidth = Math.max(2, h * 0.03);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(0, 0, w * 0.012, h);

  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fontPx = Math.min(h * 0.42, 34);
  ctx.font = `700 ${fontPx}px sans-serif`;
  let displayText = text || "";
  while (ctx.measureText(displayText).width > w * 0.92 && fontPx > 9) {
    fontPx -= 1;
    ctx.font = `700 ${fontPx}px sans-serif`;
  }
  while (ctx.measureText(displayText).width > w * 0.92 && displayText.length > 3) {
    displayText = displayText.slice(0, -2) + "\u2026";
  }
  ctx.fillText(displayText, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(c);
  if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  nameplateTextureCache.set(key, tex);
  return tex;
}

// Creates the empty container a rack hangs its real device "bodies" on.
// Call once per rack, at build time; visible=false until the view is toggled.
export function createRackRealFaceContainers({ width, depth, totalUnitsU } = {}) {
  const bodies = new THREE.Group();
  bodies.name = "RackRealFaceBodies";
  bodies.visible = false;
  bodies.userData.isRackRealFaceContainer = true;

  return { bodies, width, depth, totalUnitsU };
}

// Shared "chassis" look for the 4 faces of a device body that aren't the
// front/back (top, bottom, left, right) -- one material reused by every
// slot on every rack instead of allocating one per box.
const CHASSIS_SIDE_MAT = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.5, roughness: 0.55 });

function clearGroup(group) {
  if (!group) return;
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    group.remove(child);
    child.geometry?.dispose?.();
    child.material?.dispose?.(); // texture itself stays alive in textureCache
  }
}

// (Re)builds a full solid body per assigned slot -- not a thin decal --
// from a slot list: [{ id, deviceId, deviceName, startU, sizeU,
// frontImageUrl, backImageUrl }]. startU is measured from the BOTTOM of
// the rack. Each body fills its actual U-height x rack-width x most of the
// rack's depth, so TRANSPARENT shows a genuinely filled device, not a
// floating card. Front/back faces get the photo (if any) else a text
// nameplate of the real device name; the other 4 faces get a plain
// chassis look. rackId (optional) is stamped onto every body so the
// connect tool can resolve "which rack does this port belong to".
export function populateRackRealFaces({ bodies, width, depth, totalHeightM, totalUnitsU, slots, rackId }) {
  clearGroup(bodies);
  if (!bodies || !slots || !slots.length || !totalUnitsU) return;

  const unitH = totalHeightM / totalUnitsU;
  const planeW = Math.max(0.01, width - 2 * getRailWidth(width) - 0.03);
  const bodyDepth = Math.max(0.05, depth - 0.04);

  const faceMat = (imageUrl, label, aspect) => {
    if (imageUrl) return new THREE.MeshStandardMaterial({ map: loadCachedTexture(imageUrl), roughness: 0.4, metalness: 0.1 });
    if (label) return new THREE.MeshBasicMaterial({ map: drawNameLabelCanvas(label, aspect) });
    return CHASSIS_SIDE_MAT;
  };

  slots.forEach((slot) => {
    const sizeU = Math.max(1, Math.min(slot.sizeU || 1, totalUnitsU));
    const startU = Math.max(0, Math.min(slot.startU || 0, totalUnitsU - sizeU));
    const h = Math.max(0.02, sizeU * unitH - 0.004);
    const yCenter = -totalHeightM / 2 + startU * unitH + (sizeU * unitH) / 2;
    const label = (slot.deviceName || "").trim();
    const aspect = planeW / h;

    // BoxGeometry's default material-group order is [+x, -x, +y, -y, +z, -z]
    // -- index 4 (+z) is the same "front" side the old plane sat proud of,
    // index 5 (-z) is "back". The other 4 all share the plain chassis look.
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(planeW, h, bodyDepth),
      [CHASSIS_SIDE_MAT, CHASSIS_SIDE_MAT, CHASSIS_SIDE_MAT, CHASSIS_SIDE_MAT,
        faceMat(slot.frontImageUrl, label, aspect), faceMat(slot.backImageUrl, label, aspect)],
    );
    box.position.set(0, yCenter, 0);
    box.name = `RackDeviceBody_${slot.id || slot.deviceId}`;
    box.userData.slot = slot;
    box.userData.slotId = slot.id;
    box.userData.isRackSlotPort = true;
    if (rackId) box.userData.rackDeviceId = rackId;
    bodies.add(box);
  });
}

// -- U-number rail (front & back, left & right edges) --------------------
// Narrow vertical strips ticked and numbered per-U, drawn straight onto the
// rack in the actual 3D room (no overlay/panel) -- matches a real elevation
// diagram's U-ruler. Ridden by the same isRackRealFaceContainer toggle as
// the device-photo planes, so no extra wiring is needed to show/hide it.
function getRailWidth(width) {
  return Math.min(0.035, Math.max(0.014, width * 0.09));
}

const PX_PER_U = 24;
const railTextureCache = new Map(); // "totalUnitsU:align" -> shared CanvasTexture

function drawURailCanvas(totalUnitsU, align) {
  const cacheKey = `${totalUnitsU}:${align}`;
  if (railTextureCache.has(cacheKey)) return railTextureCache.get(cacheKey);

  const w = 64;
  const h = Math.max(1, totalUnitsU) * PX_PER_U;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#11151c";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#3a4453";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#c7d2e0";
  ctx.font = "bold 15px monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = align === "right" ? "right" : "left";
  const labelX = align === "right" ? w - 6 : 6;
  const labelEvery = totalUnitsU > 30 ? 2 : 1;

  // U numbers count from the rack's BOTTOM (u=1) up, same convention as
  // startU everywhere else in this file -- so row for U u sits
  // (totalUnitsU - u) texture-rows down from the top of the canvas.
  for (let u = 1; u <= totalUnitsU; u++) {
    const rowFromTop = totalUnitsU - u;
    const yTop = rowFromTop * PX_PER_U;
    const yMid = yTop + PX_PER_U / 2;

    ctx.beginPath();
    ctx.moveTo(0, yTop);
    ctx.lineTo(w, yTop);
    ctx.stroke();

    if (u % labelEvery === 0 || u === totalUnitsU || u === 1) {
      ctx.fillText(String(u), labelX, yMid);
    }
  }
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, h);
  ctx.stroke();

  ctx.strokeStyle = "#5b6b82";
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  const tex = new THREE.CanvasTexture(canvas);
  if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  railTextureCache.set(cacheKey, tex);
  return tex;
}

// Builds the (initially hidden) left/right U-rail strips for a rack's front
// AND back faces. Call once per rack at build time, same as
// createRackRealFaceContainers -- add the returned group to the rack's
// THREE.Group and it rides the existing TRANSPARENT-view toggle for free.
export function createRackURailPlanes({ width, depth, totalUnitsU, totalHeightM } = {}) {
  const group = new THREE.Group();
  group.name = "RackURail";
  group.visible = false;
  group.userData.isRackRealFaceContainer = true;

  if (!width || !depth || !totalUnitsU || !totalHeightM) return group;

  const railW = getRailWidth(width);
  const xOffset = width / 2 - railW / 2 - 0.003;
  const geo = new THREE.PlaneGeometry(railW, totalHeightM);
  // Numbers hug the inner edge of each strip (closer to the device photos):
  // left strip aligns right, right strip aligns left.
  const texLeft = drawURailCanvas(totalUnitsU, "right");
  const texRight = drawURailCanvas(totalUnitsU, "left");

  [
    { z: depth / 2 + 0.014, flip: false, key: "front" },
    { z: -(depth / 2 + 0.014), flip: true, key: "back" },
  ].forEach(({ z, flip, key }) => {
    const left = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texLeft }));
    left.position.set(-xOffset, 0, z);
    left.name = `RackURail_${key}_left`;

    const right = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texRight }));
    right.position.set(xOffset, 0, z);
    right.name = `RackURail_${key}_right`;

    if (flip) {
      left.rotation.y = Math.PI;
      right.rotation.y = Math.PI;
    }

    group.add(left, right);
  });

  return group;
}

export function setRackRealFaceVisible(container, visible) {
  if (container) container.visible = !!visible;
}

export function disposeRackRealFaces({ front, back } = {}) {
  clearGroup(front);
  clearGroup(back);
}
