// ═══════════════════════════════════════════════════════════════════════════
// deviceBodies3d.js
// ---------------------------------------------------------------------------
// Procedural 3D bodies for every device in the DCIM Device Library.
//
// Each device the Toolbox can place gets real geometry here rather than a
// tinted box: a transformer has porcelain bushings and radiator fin combs, a
// genset has a finned radiator core and a coupled alternator, a CRAC has a fan
// behind its louvers, a battery stand has terminals and inter-cell straps.
// They hold up when the camera orbits, which a billboarded sprite never does.
//
// Every builder shares one signature —
//   (w, d, colorHex, opts) → { group, heightM }
// — where w/d are the snapped tile footprint in metres, opts.realW/realD are
// the device's true dimensions and opts.heightM its height. Groups are built
// with their base on y = 0, so the caller can drop one straight onto the
// floor plane.
//
// Datacenter3dview.jsx maps a Toolbox tile to a builder in selectShapeBuilder();
// the matching 2D toolbox artwork lives in DeviceIcons.jsx.
// ═══════════════════════════════════════════════════════════════════════════
import * as THREE from "three";

// Mirrors the same-named constants in Datacenter3dview.jsx — kept local so this
// module stays importable on its own.
const UI_FONT   = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";


// Shared material palette so the whole power lineup reads as one product
// family instead of seven differently-shaded boxes.
const DEV_MAT = {
  shell:    () => new THREE.MeshStandardMaterial({ color: 0xb8c2cf, metalness: 0.62, roughness: 0.42 }),
  shellLit: () => new THREE.MeshStandardMaterial({ color: 0xd6dde6, metalness: 0.55, roughness: 0.38 }),
  shellDim: () => new THREE.MeshStandardMaterial({ color: 0x8b97a6, metalness: 0.66, roughness: 0.4  }),
  dark:     () => new THREE.MeshStandardMaterial({ color: 0x2a323f, metalness: 0.7,  roughness: 0.35 }),
  darker:   () => new THREE.MeshStandardMaterial({ color: 0x161c26, metalness: 0.75, roughness: 0.3  }),
  steel:    () => new THREE.MeshStandardMaterial({ color: 0x6b7788, metalness: 0.85, roughness: 0.25 }),
  chrome:   () => new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 0.95, roughness: 0.12 }),
  rubber:   () => new THREE.MeshStandardMaterial({ color: 0x14181f, metalness: 0.1,  roughness: 0.92 }),
  porcelain:() => new THREE.MeshStandardMaterial({ color: 0xe8e2d6, metalness: 0.05, roughness: 0.55 }),
  copper:   () => new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9,  roughness: 0.3  }),
};

const devGlow = (hex, intensity = 1) =>
  new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity, roughness: 0.35 });

// A horizontal louver bank — the stamped ventilation slots every switchgear
// door, UPS intake and radiator core in a real datacenter has.
function devLouvers(group, { width, height, count, x = 0, y, z, depth = 0.012, mat }) {
  const m = mat || DEV_MAT.darker();
  const pitch = height / count;
  const slatH = Math.max(pitch * 0.55, 0.006);
  for (let i = 0; i < count; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(width, slatH, depth), m);
    slat.position.set(x, y - height / 2 + pitch * (i + 0.5), z);
    slat.rotation.x = -0.35; // angled down, like a real weather louver
    group.add(slat);
  }
}

// The lifted floor plinth every free-standing panel/UPS/PDU is bolted onto.
function devPlinth(group, w, d, h = 0.1) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, h, d * 0.96), DEV_MAT.darker());
  p.position.y = h / 2;
  group.add(p);
  return h;
}

// A vertical door handle + its two hinge pucks.
function devDoorFurniture(group, { x, y, z, height }) {
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, height * 0.16, 10), DEV_MAT.chrome());
  bar.position.set(x, y, z + 0.028);
  group.add(bar);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.045, height * 0.2, 0.03), DEV_MAT.steel());
  boss.position.set(x, y, z + 0.014);
  group.add(boss);
}

// ── TRANSFORMER ────────────────────────────────────────────────────────────
// Oil-filled distribution transformer: welded tank, bolted lid, three HV
// porcelain bushings, a conservator drum, radiator fin banks down both
// flanks, and a wheeled skid.
function makeTransformerBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 2.4;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const skidH   = 0.14;
  const tankW   = W * 0.66;          // radiators occupy the outer thirds
  const tankH   = H * 0.62;
  const tankD   = D * 0.86;
  const tankY   = skidH;

  // skid rails + wheels
  const skid = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, skidH, D * 0.9), DEV_MAT.darker());
  skid.position.y = skidH / 2;
  group.add(skid);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(skidH * 0.62, skidH * 0.62, 0.07, 14), DEV_MAT.rubber());
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(sx * W * 0.34, skidH * 0.5, sz * D * 0.34);
    group.add(wheel);
  });

  // main tank
  const tank = new THREE.Mesh(new THREE.BoxGeometry(tankW, tankH, tankD), DEV_MAT.shell());
  tank.position.y = tankY + tankH / 2;
  tank.castShadow = true;
  group.add(tank);

  // welded corner seams
  const seamMat = DEV_MAT.shellDim();
  [-1, 1].forEach((sx) => {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, tankH, tankD * 1.01), seamMat);
    seam.position.set(sx * tankW / 2, tankY + tankH / 2, 0);
    group.add(seam);
  });

  // bolted lid, slightly oversized so it reads as a flange
  const lid = new THREE.Mesh(new THREE.BoxGeometry(tankW * 1.06, H * 0.05, tankD * 1.06), DEV_MAT.shellDim());
  lid.position.y = tankY + tankH + (H * 0.05) / 2;
  group.add(lid);
  const lidY = lid.position.y + (H * 0.05) / 2;

  // rating / nameplate on the front face
  const plate = new THREE.Mesh(new THREE.BoxGeometry(tankW * 0.3, tankH * 0.26, 0.012), devGlow(colorHex, 0.5));
  plate.position.set(0, tankY + tankH * 0.5, tankD / 2 + 0.008);
  group.add(plate);

  // three HV bushings (porcelain sheds + terminal)
  const bushX = [-tankW * 0.3, 0, tankW * 0.3];
  bushX.forEach((bx) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, H * 0.2, 12), DEV_MAT.porcelain());
    stem.position.set(bx, lidY + H * 0.1, -tankD * 0.16);
    group.add(stem);
    for (let s = 0; s < 3; s++) {
      const shed = new THREE.Mesh(new THREE.CylinderGeometry(0.075 - s * 0.008, 0.085 - s * 0.008, 0.028, 14), DEV_MAT.porcelain());
      shed.position.set(bx, lidY + H * 0.045 + s * H * 0.06, -tankD * 0.16);
      group.add(shed);
    }
    const term = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, H * 0.05, 10), DEV_MAT.copper());
    term.position.set(bx, lidY + H * 0.22, -tankD * 0.16);
    group.add(term);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), DEV_MAT.copper());
    cap.position.set(bx, lidY + H * 0.245, -tankD * 0.16);
    group.add(cap);
  });

  // conservator drum (oil expansion vessel) on stand-offs
  const cons = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.085, H * 0.085, tankW * 0.55, 18), DEV_MAT.shellDim());
  cons.rotation.z = Math.PI / 2;
  cons.position.set(0, lidY + H * 0.12, tankD * 0.3);
  group.add(cons);
  [-1, 1].forEach((sx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, H * 0.12, 0.03), DEV_MAT.steel());
    leg.position.set(sx * tankW * 0.2, lidY + H * 0.06, tankD * 0.3);
    group.add(leg);
  });

  // Radiator fin banks down both flanks. The fins stand clear of the tank on
  // slim top/bottom header pipes rather than off a solid backing slab, so the
  // gaps between them stay readable from every camera angle — that comb
  // silhouette is what makes the shape read as a transformer and not a crate.
  const finCount = 8;
  const finW  = W * 0.17;
  const finH  = tankH * 0.72;
  const finD  = (tankD * 0.86) / finCount * 0.5;
  const finMat = DEV_MAT.shellDim();
  [-1, 1].forEach((side) => {
    const finX = side * (tankW / 2 + finW * 0.52);
    // upper + lower header pipes the fins hang between
    [tankH * 0.86, tankH * 0.14].forEach((hy) => {
      const hdr = new THREE.Mesh(new THREE.CylinderGeometry(finW * 0.1, finW * 0.1, tankD * 0.92, 10), DEV_MAT.shell());
      hdr.rotation.x = Math.PI / 2;
      hdr.position.set(finX, tankY + hy, 0);
      group.add(hdr);
    });
    for (let i = 0; i < finCount; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(finW, finH, finD), finMat);
      fin.position.set(
        finX,
        tankY + tankH * 0.5,
        -tankD * 0.4 + (tankD * 0.8 / (finCount - 1)) * i,
      );
      group.add(fin);
    }
  });

  // LV cable box on the back
  const lvBox = new THREE.Mesh(new THREE.BoxGeometry(tankW * 0.45, tankH * 0.4, 0.16), DEV_MAT.shellDim());
  lvBox.position.set(0, tankY + tankH * 0.35, -tankD / 2 - 0.08);
  group.add(lvBox);

  return { group, heightM: lidY + H * 0.26 };
}

// ── GENERATOR (diesel genset) ──────────────────────────────────────────────
// Skid-mounted set: radiator core with a spinning fan, ribbed engine block,
// exhaust manifold and silencer, coupled alternator, and a control panel.
function makeGeneratorBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 2.2;
  const W = Math.min(w, opts.realW || w);   // length of the set (X)
  const D = Math.min(d, opts.realD || d);   // width  of the set (Z)

  const skidH = 0.18;
  const skid = new THREE.Mesh(new THREE.BoxGeometry(W, skidH, D), DEV_MAT.darker());
  skid.position.y = skidH / 2;
  skid.castShadow = true;
  group.add(skid);

  // anti-vibration mounts
  [[-0.36, -0.32], [0.36, -0.32], [-0.36, 0.32], [0.36, 0.32]].forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.08, 0.06, D * 0.14), DEV_MAT.rubber());
    foot.position.set(fx * W, 0.03, fz * D);
    group.add(foot);
  });

  const deckY = skidH;

  // ── radiator core at the -X end ──
  const radW = W * 0.16, radH = H * 0.62, radD = D * 0.82;
  const rad = new THREE.Mesh(new THREE.BoxGeometry(radW, radH, radD), DEV_MAT.shellDim());
  rad.position.set(-W / 2 + radW / 2, deckY + radH / 2, 0);
  group.add(rad);
  // core matrix
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.02, radH * 0.82, radD * 0.85), DEV_MAT.darker());
  core.position.set(-W / 2 + 0.012, deckY + radH / 2, 0);
  group.add(core);
  for (let i = 0; i < 9; i++) {
    // core matrix bars on the front face…
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.026, radH * 0.06, radD * 0.86), DEV_MAT.steel());
    bar.position.set(-W / 2 + 0.02, deckY + radH * 0.12 + i * (radH * 0.76 / 8), 0);
    group.add(bar);
    // …and wrapped round both side cheeks, so the radiator still reads as a
    // finned core when the camera orbits round to the flank of the set.
    [-1, 1].forEach((sz) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(radW * 0.86, radH * 0.05, 0.022), DEV_MAT.steel());
      side.position.set(-W / 2 + radW / 2, deckY + radH * 0.12 + i * (radH * 0.76 / 8), sz * (radD / 2 + 0.012));
      group.add(side);
    });
  }
  // radiator top tank + guard frame
  const radTop = new THREE.Mesh(new THREE.BoxGeometry(radW * 1.08, radH * 0.1, radD * 1.04), DEV_MAT.shell());
  radTop.position.set(-W / 2 + radW / 2, deckY + radH * 0.95, 0);
  group.add(radTop);
  // radiator fan (animated by the scene's spin pass)
  const fanR = Math.min(radH, radD) * 0.34;
  const fan = new THREE.Group();
  fan.name = "FanBlades";
  fan.userData.spins = true;
  const bladeMat = DEV_MAT.steel();
  for (let i = 0; i < 7; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, fanR * 1.7, fanR * 0.34), bladeMat);
    blade.rotation.x = (i / 7) * Math.PI * 2;
    fan.add(blade);
  }
  fan.rotation.z = Math.PI / 2;
  fan.position.set(-W / 2 + radW + 0.05, deckY + radH * 0.55, 0);
  group.add(fan);
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(fanR * 0.2, fanR * 0.2, 0.05, 12), DEV_MAT.dark());
  fanHub.rotation.z = Math.PI / 2;
  fanHub.position.copy(fan.position);
  group.add(fanHub);

  // ── engine block ──
  const engW = W * 0.38, engH = H * 0.4, engD = D * 0.6;
  const engX = -W * 0.08;
  const eng = new THREE.Mesh(new THREE.BoxGeometry(engW, engH, engD), DEV_MAT.dark());
  eng.position.set(engX, deckY + engH / 2 + 0.06, 0);
  eng.castShadow = true;
  group.add(eng);
  // sump
  const sump = new THREE.Mesh(new THREE.BoxGeometry(engW * 0.9, 0.14, engD * 0.8), DEV_MAT.darker());
  sump.position.set(engX, deckY + 0.07, 0);
  group.add(sump);
  // cylinder-head rocker covers
  const nCyl = 6;
  for (let i = 0; i < nCyl; i++) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(engW / nCyl * 0.78, H * 0.11, engD * 0.42), DEV_MAT.steel());
    head.position.set(engX - engW / 2 + (engW / nCyl) * (i + 0.5), deckY + engH + 0.06 + H * 0.055, -engD * 0.12);
    group.add(head);
  }
  // exhaust manifold running along the block
  const man = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.032, H * 0.032, engW * 0.95, 12), DEV_MAT.darker());
  man.rotation.z = Math.PI / 2;
  man.position.set(engX, deckY + engH * 0.85, engD * 0.42);
  group.add(man);

  // ── exhaust silencer, slung over the top ──
  const silR = H * 0.09;
  const sil = new THREE.Mesh(new THREE.CylinderGeometry(silR, silR, W * 0.34, 16), DEV_MAT.darker());
  sil.rotation.z = Math.PI / 2;
  sil.position.set(engX + W * 0.02, deckY + H * 0.78, engD * 0.2);
  group.add(sil);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(silR * 0.42, silR * 0.42, H * 0.2, 12), DEV_MAT.darker());
  stack.position.set(engX + W * 0.17, deckY + H * 0.86, engD * 0.2);
  group.add(stack);
  [-1, 1].forEach((sx) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, H * 0.2, silR * 2.3), DEV_MAT.steel());
    strap.position.set(engX + sx * W * 0.1, deckY + H * 0.68, engD * 0.2);
    group.add(strap);
  });

  // ── alternator at the +X end ──
  const altR = H * 0.21, altL = W * 0.26;
  const alt = new THREE.Mesh(new THREE.CylinderGeometry(altR, altR, altL, 22), DEV_MAT.shellDim());
  alt.rotation.z = Math.PI / 2;
  alt.position.set(W * 0.24, deckY + altR + 0.1, 0);
  alt.castShadow = true;
  group.add(alt);
  // cooling ribs on the alternator housing
  for (let i = 0; i < 6; i++) {
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(altR * 1.04, altR * 1.04, 0.018, 22), DEV_MAT.steel());
    rib.rotation.z = Math.PI / 2;
    rib.position.set(W * 0.24 - altL * 0.4 + (altL * 0.8 / 5) * i, deckY + altR + 0.1, 0);
    group.add(rib);
  }
  // terminal box on top of the alternator
  const tbox = new THREE.Mesh(new THREE.BoxGeometry(altL * 0.5, H * 0.11, altR * 1.1), DEV_MAT.dark());
  tbox.position.set(W * 0.24, deckY + altR * 2 + 0.1 + H * 0.05, 0);
  group.add(tbox);
  // bellhousing coupling the alternator to the engine
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(altR * 1.02, altR * 0.86, W * 0.06, 20), DEV_MAT.dark());
  bell.rotation.z = Math.PI / 2;
  bell.position.set(W * 0.24 - altL / 2 - W * 0.03, deckY + altR + 0.1, 0);
  group.add(bell);

  // ── control panel, front face ──
  const panW = W * 0.16, panH = H * 0.34;
  const pan = new THREE.Mesh(new THREE.BoxGeometry(panW, panH, 0.1), DEV_MAT.shell());
  pan.position.set(W * 0.02, deckY + H * 0.46, D / 2 - 0.05);
  group.add(pan);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(panW * 0.62, panH * 0.4, 0.014), devGlow(colorHex, 0.9));
  screen.position.set(W * 0.02, deckY + H * 0.52, D / 2 + 0.006);
  group.add(screen);
  [0x22c55e, 0xfacc15, 0xef4444].forEach((c, i) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), devGlow(c, 1.2));
    led.position.set(W * 0.02 - panW * 0.2 + i * panW * 0.2, deckY + H * 0.38, D / 2 + 0.008);
    group.add(led);
  });

  // ── day tank on the skid, behind the engine ──
  const tank = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, H * 0.16, D * 0.22), DEV_MAT.shellDim());
  tank.position.set(engX, deckY + H * 0.08, -D * 0.36);
  group.add(tank);

  return { group, heightM: deckY + H * 0.96 };
}

// ── SWITCHGEAR / PANEL FAMILY (MPP + PP) ───────────────────────────────────
// One builder drives both the multi-section Main Power Panel and the single
// -section Power Panel — same construction, different section count — so the
// two always look like siblings on the floor, exactly as they do in a real
// electrical room.
function makeSwitchPanelBody(w, d, colorHex, opts = {}, cfg = {}) {
  const sections   = cfg.sections || 3;
  const liftingEye = cfg.liftingEyes !== false;
  const busChamber = cfg.busChamber !== false;

  const group = new THREE.Group();
  const H = opts.heightM || 2.2;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const plinthH = devPlinth(group, W, D, Math.min(0.1, H * 0.05));
  const bodyH   = H - plinthH - (busChamber ? H * 0.09 : 0.02);

  // cabinet shell
  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), DEV_MAT.shell());
  shell.position.y = plinthH + bodyH / 2;
  shell.castShadow = true;
  group.add(shell);

  // busbar chamber / roof cap
  const capH = busChamber ? H * 0.09 : 0.02;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, capH, D * 1.02), DEV_MAT.shellDim());
  cap.position.y = plinthH + bodyH + capH / 2;
  group.add(cap);
  const roofY = cap.position.y + capH / 2;

  // lifting eyes on the roof (switchgear ships with them fitted)
  if (liftingEye) {
    [-1, 1].forEach((sx) => {
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), DEV_MAT.steel());
      eye.position.set(sx * W * 0.36, roofY + 0.05, 0);
      group.add(eye);
    });
  }

  // per-section doors
  const secW = W / sections;
  for (let i = 0; i < sections; i++) {
    const cx = -W / 2 + secW * (i + 0.5);
    const doorW = secW * 0.9;
    const doorH = bodyH * 0.9;
    const doorY = plinthH + bodyH / 2;
    const doorZ = D / 2 + 0.012;

    const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.024), DEV_MAT.shellLit());
    door.position.set(cx, doorY, doorZ);
    group.add(door);

    // recessed shadow gap around each door
    const gap = new THREE.Mesh(new THREE.BoxGeometry(doorW * 1.03, doorH * 1.02, 0.01), DEV_MAT.darker());
    gap.position.set(cx, doorY, D / 2 + 0.004);
    group.add(gap);

    // top louver bank
    devLouvers(group, {
      width: doorW * 0.7, height: doorH * 0.18, count: 5,
      x: cx, y: doorY + doorH * 0.36, z: doorZ + 0.014,
    });

    // metering / mimic window
    const win = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.55, doorH * 0.14, 0.012), DEV_MAT.darker());
    win.position.set(cx, doorY + doorH * 0.1, doorZ + 0.014);
    group.add(win);
    const face = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.46, doorH * 0.09, 0.008), devGlow(colorHex, 0.85));
    face.position.set(cx, doorY + doorH * 0.1, doorZ + 0.02);
    group.add(face);

    // indicator lamps
    [0x22c55e, 0xfacc15, 0xef4444].forEach((c, k) => {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), devGlow(c, 1.3));
      led.position.set(cx - doorW * 0.16 + k * doorW * 0.16, doorY - doorH * 0.04, doorZ + 0.018);
      group.add(led);
    });

    // breaker cassette rows behind the lower half of the door
    for (let r = 0; r < 3; r++) {
      const brk = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.62, doorH * 0.07, 0.01), DEV_MAT.steel());
      brk.position.set(cx, doorY - doorH * 0.16 - r * doorH * 0.11, doorZ + 0.014);
      group.add(brk);
    }

    // handle + hinges
    devDoorFurniture(group, { x: cx + doorW * 0.4, y: doorY - doorH * 0.05, z: doorZ, height: doorH });
    [-1, 1].forEach((sy) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, doorH * 0.07, 10), DEV_MAT.steel());
      hinge.position.set(cx - doorW * 0.46, doorY + sy * doorH * 0.36, doorZ);
      group.add(hinge);
    });

    // section divider post
    if (i < sections - 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.02, bodyH, 0.03), DEV_MAT.shellDim());
      post.position.set(-W / 2 + secW * (i + 1), plinthH + bodyH / 2, D / 2 + 0.014);
      group.add(post);
    }
  }

  // rear cable-gland plate
  const rear = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, bodyH * 0.5, 0.02), DEV_MAT.shellDim());
  rear.position.set(0, plinthH + bodyH * 0.35, -D / 2 - 0.011);
  group.add(rear);

  return { group, heightM: roofY + (liftingEye ? 0.1 : 0.02) };
}

function makeMainPowerPanelBody(w, d, colorHex, opts = {}) {
  // Sized by footprint: a wider MPP lineup gets more vertical sections, the
  // way a real switchboard is assembled from 800mm-wide cubicles.
  const W = Math.min(w, opts.realW || w);
  const sections = Math.max(2, Math.min(5, Math.round(W / 0.8)));
  return makeSwitchPanelBody(w, d, colorHex, opts, { sections, liftingEyes: true, busChamber: true });
}

function makePowerPanelBody(w, d, colorHex, opts = {}) {
  const W = Math.min(w, opts.realW || w);
  const sections = W > 1.2 ? 2 : 1;
  return makeSwitchPanelBody(w, d, colorHex, opts, { sections, liftingEyes: false, busChamber: false });
}

// ── UPS ────────────────────────────────────────────────────────────────────
// Tall dark UPS cabinet: full-height louvered intake, a live mimic/LCD panel,
// battery-string status bar, and top-mounted exhaust grille.
function makeUPSBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.95;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const plinthH = devPlinth(group, W, D, Math.min(0.09, H * 0.05));
  const bodyH   = H - plinthH - H * 0.03;

  // near-black cabinet, the way UPS modules actually ship
  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), DEV_MAT.dark());
  shell.position.y = plinthH + bodyH / 2;
  shell.castShadow = true;
  group.add(shell);

  // brushed side panels catch the light differently from the front
  [-1, 1].forEach((sx) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.014, bodyH * 0.96, D * 0.96), DEV_MAT.darker());
    side.position.set(sx * W / 2, plinthH + bodyH / 2, 0);
    group.add(side);
  });

  // roof + exhaust grille
  const capH = H * 0.03;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, capH, D * 1.02), DEV_MAT.darker());
  cap.position.y = plinthH + bodyH + capH / 2;
  group.add(cap);
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.006, D * 0.1), DEV_MAT.steel());
    vent.position.set(0, plinthH + bodyH + capH + 0.004, -D * 0.24 + i * D * 0.16);
    group.add(vent);
  }
  const roofY = plinthH + bodyH + capH;

  const frontZ = D / 2 + 0.013;

  // front door face
  const door = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, bodyH * 0.94, 0.024), DEV_MAT.dark());
  door.position.set(0, plinthH + bodyH / 2, frontZ);
  group.add(door);

  // LCD / mimic panel — a real canvas texture so it reads as a running UPS
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 128;
  const g2 = cv.getContext("2d");
  g2.fillStyle = "#08111e"; g2.fillRect(0, 0, 256, 128);
  g2.strokeStyle = colorHexToCss(colorHex); g2.lineWidth = 3;
  g2.strokeRect(8, 8, 240, 112);
  g2.fillStyle = colorHexToCss(colorHex);
  g2.font = `700 30px ${UI_FONT}`;
  g2.textAlign = "left"; g2.textBaseline = "middle";
  g2.fillText("UPS", 22, 36);
  g2.font = `600 20px ${MONO_FONT}`;
  g2.fillText("ONLINE", 96, 36);
  // load bar
  g2.fillStyle = "#1e293b"; g2.fillRect(22, 58, 212, 18);
  g2.fillStyle = "#22c55e"; g2.fillRect(22, 58, 138, 18);
  g2.fillStyle = "#94a3b8";
  g2.font = `500 17px ${MONO_FONT}`;
  g2.fillText("LOAD 65%   BATT 100%", 22, 100);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  const lcd = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.5, W * 0.5 * (128 / 256)),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
  );
  lcd.position.set(0, plinthH + bodyH * 0.82, frontZ + 0.014);
  group.add(lcd);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(W * 0.56, W * 0.5 * (128 / 256) + 0.05, 0.012), DEV_MAT.darker());
  bezel.position.set(0, plinthH + bodyH * 0.82, frontZ + 0.006);
  group.add(bezel);

  // full-height louvered intake below the display
  devLouvers(group, {
    width: W * 0.66, height: bodyH * 0.46, count: 13,
    x: 0, y: plinthH + bodyH * 0.42, z: frontZ + 0.012,
    mat: DEV_MAT.darker(),
  });

  // battery-string status bar at the bottom
  const barBg = new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, bodyH * 0.05, 0.012), DEV_MAT.darker());
  barBg.position.set(0, plinthH + bodyH * 0.11, frontZ + 0.014);
  group.add(barBg);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.45, bodyH * 0.03, 0.008), devGlow(0x22c55e, 1.1));
  bar.position.set(-W * 0.04, plinthH + bodyH * 0.11, frontZ + 0.02);
  group.add(bar);

  // accent light bar down the door edge — the device's category colour
  const accent = new THREE.Mesh(new THREE.BoxGeometry(W * 0.04, bodyH * 0.88, 0.01), devGlow(colorHex, 0.9));
  accent.position.set(-W * 0.4, plinthH + bodyH / 2, frontZ + 0.014);
  group.add(accent);

  // handle
  devDoorFurniture(group, { x: W * 0.4, y: plinthH + bodyH * 0.5, z: frontZ, height: bodyH });

  return { group, heightM: roofY };
}

// ── PDU ────────────────────────────────────────────────────────────────────
// Floor-standing power distribution unit: metering head, twin doors, branch
// breaker rows and an isolation transformer vent bank down the flanks.
function makePDUBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.9;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const plinthH = devPlinth(group, W, D, Math.min(0.09, H * 0.05));
  const bodyH   = H - plinthH - H * 0.04;

  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), DEV_MAT.shell());
  shell.position.y = plinthH + bodyH / 2;
  shell.castShadow = true;
  group.add(shell);

  const capH = H * 0.04;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W * 1.03, capH, D * 1.03), DEV_MAT.shellDim());
  cap.position.y = plinthH + bodyH + capH / 2;
  group.add(cap);
  const roofY = plinthH + bodyH + capH;

  const frontZ = D / 2 + 0.013;

  // ── metering head across the top of the front face ──
  const headH = bodyH * 0.16;
  const headY = plinthH + bodyH - headH / 2 - bodyH * 0.03;
  const head = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, headH, 0.03), DEV_MAT.darker());
  head.position.set(0, headY, frontZ);
  group.add(head);
  const meter = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, headH * 0.55, 0.012), devGlow(colorHex, 0.95));
  meter.position.set(-W * 0.22, headY, frontZ + 0.018);
  group.add(meter);
  [0x22c55e, 0xfacc15, 0xef4444].forEach((c, i) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), devGlow(c, 1.3));
    led.position.set(W * 0.1 + i * W * 0.12, headY, frontZ + 0.02);
    group.add(led);
  });

  // ── twin doors ──
  const doorH = bodyH * 0.72;
  const doorY = plinthH + doorH / 2 + bodyH * 0.04;
  [-1, 1].forEach((side) => {
    const doorW = W * 0.44;
    const cx = side * W * 0.23;

    const gap = new THREE.Mesh(new THREE.BoxGeometry(doorW * 1.04, doorH * 1.03, 0.01), DEV_MAT.darker());
    gap.position.set(cx, doorY, D / 2 + 0.004);
    group.add(gap);

    const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.024), DEV_MAT.shellLit());
    door.position.set(cx, doorY, frontZ);
    group.add(door);

    // branch breaker rows — the giveaway detail of a PDU vs a plain panel
    for (let r = 0; r < 6; r++) {
      const row = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.7, doorH * 0.06, 0.01), DEV_MAT.steel());
      row.position.set(cx, doorY + doorH * 0.33 - r * doorH * 0.13, frontZ + 0.014);
      group.add(row);
      // individual poles
      for (let p = 0; p < 5; p++) {
        const pole = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.1, doorH * 0.04, 0.006), DEV_MAT.darker());
        pole.position.set(cx - doorW * 0.28 + p * doorW * 0.14, doorY + doorH * 0.33 - r * doorH * 0.13, frontZ + 0.02);
        group.add(pole);
      }
    }

    // handle on the meeting stile, hinges on the outer edge
    devDoorFurniture(group, { x: cx + side * doorW * 0.42 * -1, y: doorY, z: frontZ, height: doorH });
    [-1, 1].forEach((sy) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, doorH * 0.08, 10), DEV_MAT.steel());
      hinge.position.set(cx + side * doorW * 0.47, doorY + sy * doorH * 0.34, frontZ);
      group.add(hinge);
    });
  });

  // ── isolation-transformer vent banks down both flanks ──
  [-1, 1].forEach((side) => {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.012, bodyH * 0.52, D * 0.62), DEV_MAT.darker());
    vent.position.set(side * (W / 2 + 0.007), plinthH + bodyH * 0.45, 0);
    group.add(vent);
    for (let i = 0; i < 9; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.016, bodyH * 0.03, D * 0.58), DEV_MAT.steel());
      slat.position.set(side * (W / 2 + 0.012), plinthH + bodyH * 0.24 + i * bodyH * 0.052, 0);
      group.add(slat);
    }
  });

  // rear output-cable chamber
  const rear = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, bodyH * 0.45, 0.05), DEV_MAT.shellDim());
  rear.position.set(0, plinthH + bodyH * 0.3, -D / 2 - 0.026);
  group.add(rear);

  return { group, heightM: roofY };
}

// Small helper: the canvas 2D context wants "#rrggbb", the meshes want 0xrrggbb.
function colorHexToCss(colorHex) {
  const n = typeof colorHex === "number" ? colorHex : 0x38bdf8;
  return "#" + n.toString(16).padStart(6, "0");
}


// ═══════════════════════════════════════════════════════════════════════════
// COOLING
// ═══════════════════════════════════════════════════════════════════════════

// ── CRAC / PRECISION AC (AC Unit · CRAC Unit · PAC Unit) ───────────────────
// Downflow computer-room air conditioner: return grille on the roof, filter
// section, an EC fan behind the front louvers, chilled-water pipework up both
// flanks and a discharge plenum firing into the raised floor.
function makeCracBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.9;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const plinthH = devPlinth(group, W, D, Math.min(0.09, H * 0.05));
  const bodyH = H - plinthH - H * 0.06;

  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), DEV_MAT.shell());
  shell.position.y = plinthH + bodyH / 2;
  shell.castShadow = true;
  group.add(shell);

  // roof return-air grille
  const capH = H * 0.06;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, capH, D * 1.02), DEV_MAT.shellDim());
  cap.position.y = plinthH + bodyH + capH / 2;
  group.add(cap);
  const roofY = plinthH + bodyH + capH;
  for (let i = 0; i < 6; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(W * 0.78, 0.012, D * 0.09), DEV_MAT.darker());
    slat.position.set(0, roofY + 0.008, -D * 0.3 + i * D * 0.12);
    group.add(slat);
  }

  const frontZ = D / 2 + 0.013;

  // door + filter section
  const door = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, bodyH * 0.94, 0.024), DEV_MAT.shellLit());
  door.position.set(0, plinthH + bodyH / 2, frontZ);
  group.add(door);

  const filter = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, bodyH * 0.2, 0.016), DEV_MAT.shellDim());
  filter.position.set(0, plinthH + bodyH * 0.85, frontZ + 0.014);
  group.add(filter);
  for (let i = 0; i < 9; i++) {
    const pleat = new THREE.Mesh(new THREE.BoxGeometry(0.012, bodyH * 0.18, 0.008), DEV_MAT.darker());
    pleat.position.set(-W * 0.33 + i * (W * 0.66 / 8), plinthH + bodyH * 0.85, frontZ + 0.02);
    group.add(pleat);
  }

  // controller display
  const disp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.24, bodyH * 0.11, 0.014), DEV_MAT.darker());
  disp.position.set(-W * 0.28, plinthH + bodyH * 0.62, frontZ + 0.014);
  group.add(disp);
  const face = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, bodyH * 0.07, 0.008), devGlow(colorHex, 0.95));
  face.position.set(-W * 0.28, plinthH + bodyH * 0.62, frontZ + 0.02);
  group.add(face);

  // EC fan seen through the front grille
  const fanR = Math.min(W, bodyH) * 0.19;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(fanR, fanR * 0.1, 8, 26), DEV_MAT.steel());
  ring.position.set(W * 0.15, plinthH + bodyH * 0.6, frontZ + 0.016);
  group.add(ring);
  const fan = new THREE.Group();
  fan.name = "FanBlades";
  fan.userData.spins = true;
  for (let i = 0; i < 7; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(fanR * 1.7, 0.01, fanR * 0.3), DEV_MAT.shellLit());
    blade.rotation.y = (i / 7) * Math.PI * 2;
    fan.add(blade);
  }
  fan.rotation.x = Math.PI / 2;
  fan.position.set(W * 0.15, plinthH + bodyH * 0.6, frontZ + 0.012);
  group.add(fan);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(fanR * 0.22, fanR * 0.22, 0.03, 12), DEV_MAT.dark());
  hub.rotation.x = Math.PI / 2;
  hub.position.copy(fan.position);
  group.add(hub);

  // supply louvers into the underfloor plenum
  devLouvers(group, {
    width: W * 0.72, height: bodyH * 0.3, count: 8,
    x: 0, y: plinthH + bodyH * 0.24, z: frontZ + 0.012,
  });

  // chilled-water flow / return pipes up both flanks
  [-1, 1].forEach((side) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, bodyH * 0.9, 12), DEV_MAT.steel());
    pipe.position.set(side * (W / 2 + 0.05), plinthH + bodyH * 0.5, -D * 0.2);
    group.add(pipe);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.03, 12), DEV_MAT.shellDim());
    flange.position.set(side * (W / 2 + 0.05), plinthH + bodyH * 0.75, -D * 0.2);
    group.add(flange);
  });

  return { group, heightM: roofY };
}

// ── CHILLER ────────────────────────────────────────────────────────────────
// Air-cooled packaged chiller: a row of condenser fans on the roof, finned
// coil blocks down both long sides, compressors and the control panel on the
// skid. Sized so a wider footprint simply gets more fans.
function makeChillerBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 2.2;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const railH = 0.16;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(W, railH, D), DEV_MAT.darker());
  rail.position.y = railH / 2;
  group.add(rail);
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.08, 0.06, D * 0.12), DEV_MAT.rubber());
    foot.position.set(sx * W * 0.4, 0.03, sz * D * 0.38);
    group.add(foot);
  }));

  const coilH = H * 0.52;
  const bodyY = railH;

  // condenser coil blocks — the fins are the whole point of the silhouette
  [-1, 1].forEach((side) => {
    const back = new THREE.Mesh(new THREE.BoxGeometry(W * 0.94, coilH, 0.05), DEV_MAT.shellDim());
    back.position.set(0, bodyY + coilH / 2, side * (D / 2 - 0.05));
    group.add(back);
    const nFins = Math.max(10, Math.round(W / 0.18));
    for (let i = 0; i < nFins; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9 / nFins * 0.55, coilH * 0.92, 0.03), DEV_MAT.steel());
      fin.position.set(-W * 0.45 + (W * 0.9 / (nFins - 1)) * i, bodyY + coilH / 2, side * (D / 2 - 0.02));
      group.add(fin);
    }
  });

  // compressors + pipework in the middle bay
  const nComp = 2;
  for (let i = 0; i < nComp; i++) {
    const comp = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.09, H * 0.1, coilH * 0.55, 14), DEV_MAT.dark());
    comp.position.set(-W * 0.2 + i * W * 0.4, bodyY + coilH * 0.3, 0);
    group.add(comp);
  }
  const suction = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, W * 0.6, 10), DEV_MAT.steel());
  suction.rotation.z = Math.PI / 2;
  suction.position.set(0, bodyY + coilH * 0.62, 0);
  group.add(suction);

  // fan deck
  const deckY = bodyY + coilH;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.05, D), DEV_MAT.shellDim());
  deck.position.y = deckY + H * 0.025;
  group.add(deck);

  // condenser fans across the roof
  const nFans = Math.max(2, Math.min(5, Math.round(W / 1.1)));
  const fanR = Math.min(D * 0.38, (W / nFans) * 0.42);
  for (let i = 0; i < nFans; i++) {
    const fx = -W / 2 + (W / nFans) * (i + 0.5);
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(fanR * 1.12, fanR * 1.0, H * 0.1, 22, 1, true), DEV_MAT.shell());
    cowl.position.set(fx, deckY + H * 0.1, 0);
    group.add(cowl);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(fanR * 1.1, 0.016, 8, 24), DEV_MAT.steel());
    guard.rotation.x = Math.PI / 2;
    guard.position.set(fx, deckY + H * 0.15, 0);
    group.add(guard);
    const fan = new THREE.Group();
    fan.name = "FanBlades";
    fan.userData.spins = true;
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(fanR * 1.75, 0.014, fanR * 0.38), DEV_MAT.shellLit());
      blade.rotation.y = (b / 6) * Math.PI * 2;
      fan.add(blade);
    }
    fan.position.set(fx, deckY + H * 0.12, 0);
    group.add(fan);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(fanR * 0.2, fanR * 0.2, 0.05, 12), DEV_MAT.dark());
    hub.position.set(fx, deckY + H * 0.12, 0);
    group.add(hub);
  }

  // control panel on the long face
  const pan = new THREE.Mesh(new THREE.BoxGeometry(W * 0.22, coilH * 0.5, 0.09), DEV_MAT.shell());
  pan.position.set(W * 0.3, bodyY + coilH * 0.45, D / 2 + 0.03);
  group.add(pan);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(W * 0.14, coilH * 0.2, 0.012), devGlow(colorHex, 0.95));
  scr.position.set(W * 0.3, bodyY + coilH * 0.55, D / 2 + 0.082);
  group.add(scr);

  return { group, heightM: deckY + H * 0.18 };
}

// ── HUMIDIFIER ─────────────────────────────────────────────────────────────
// Electrode-boiler steam humidifier: cabinet with the cylinder behind a sight
// window, steam hose up to the distributor pipe, fill and drain below.
function makeHumidifierBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.8;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const plinthH = devPlinth(group, W, D, Math.min(0.08, H * 0.05));
  const bodyH = H * 0.62;

  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), DEV_MAT.shell());
  shell.position.y = plinthH + bodyH / 2;
  shell.castShadow = true;
  group.add(shell);

  const frontZ = D / 2 + 0.012;

  // sight window onto the steam cylinder
  const win = new THREE.Mesh(new THREE.BoxGeometry(W * 0.4, bodyH * 0.55, 0.014), DEV_MAT.darker());
  win.position.set(-W * 0.2, plinthH + bodyH * 0.5, frontZ);
  group.add(win);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.12, W * 0.12, bodyH * 0.45, 16), DEV_MAT.shellDim());
  cyl.position.set(-W * 0.2, plinthH + bodyH * 0.5, frontZ + 0.012);
  group.add(cyl);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.115, W * 0.115, bodyH * 0.16, 16), devGlow(colorHex, 0.5));
  water.position.set(-W * 0.2, plinthH + bodyH * 0.36, frontZ + 0.012);
  group.add(water);

  // controller
  const disp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.26, bodyH * 0.2, 0.014), DEV_MAT.darker());
  disp.position.set(W * 0.22, plinthH + bodyH * 0.68, frontZ);
  group.add(disp);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, bodyH * 0.1, 0.008), devGlow(colorHex, 0.95));
  scr.position.set(W * 0.22, plinthH + bodyH * 0.68, frontZ + 0.008);
  group.add(scr);

  // steam hose up to the distributor pipe
  const topY = plinthH + bodyH;
  const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, H * 0.2, 10), DEV_MAT.rubber());
  hose.position.set(-W * 0.2, topY + H * 0.1, 0);
  group.add(hose);
  const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, W * 1.1, 12), DEV_MAT.steel());
  dist.rotation.z = Math.PI / 2;
  dist.position.set(0, topY + H * 0.22, 0);
  group.add(dist);
  for (let i = 0; i < 5; i++) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.06, 8), DEV_MAT.chrome());
    nozzle.position.set(-W * 0.42 + i * (W * 0.84 / 4), topY + H * 0.26, 0);
    group.add(nozzle);
  }

  // fill / drain assembly
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H * 0.1, 10), DEV_MAT.steel());
  drain.position.set(W * 0.25, plinthH * 0.5 + H * 0.05, D * 0.2);
  group.add(drain);

  return { group, heightM: topY + H * 0.3 };
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK & SECURITY
// ═══════════════════════════════════════════════════════════════════════════

// ── NETWORK GEAR (switch · router · firewall) ──────────────────────────────
// A switch, a router and a firewall are the same rack-mount box in the real
// world; what differs is port density, the badge colour and whether it wears
// antennas. One builder, three configs — so they line up on a shelf the way
// they would in an actual comms cabinet.
function makeNetworkGearBody(w, d, colorHex, opts = {}, cfg = {}) {
  const portRows = cfg.portRows || 2;
  const antennas = cfg.antennas || false;
  const badge    = cfg.badge || null;

  const group = new THREE.Group();
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);
  const frameH = Math.max(1.1, Math.min(opts.heightM || 1.4, 2.0));
  const chassisH = portRows > 1 ? 0.16 : 0.1;

  // Two-post open relay rack. Network gear is rack-mounted in real life, so
  // it gets the posts and cable tray it would actually be bolted into rather
  // than standing on a table.
  const baseFoot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.05, D * 0.9), DEV_MAT.darker());
  baseFoot.position.y = 0.025;
  group.add(baseFoot);
  [-1, 1].forEach((sx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, frameH, D * 0.28), DEV_MAT.steel());
    post.position.set(sx * (W * 0.45), frameH / 2, 0);
    group.add(post);
    // punched mounting holes down the post
    for (let h = 0; h < Math.round(frameH / 0.09); h++) {
      const hole = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.008), DEV_MAT.darker());
      hole.position.set(sx * (W * 0.45), 0.08 + h * 0.09, D * 0.14 + 0.004);
      group.add(hole);
    }
  });
  // top cable tray tying the posts together
  const tray = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.03, D * 0.4), DEV_MAT.shellDim());
  tray.position.y = frameH;
  group.add(tray);

  // the gear is mounted about two-thirds up the frame
  const bodyY = frameH * 0.62;

  // chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, chassisH, D * 0.8), DEV_MAT.dark());
  chassis.position.y = bodyY + chassisH / 2;
  chassis.castShadow = true;
  group.add(chassis);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.01, D * 0.8), DEV_MAT.steel());
  lid.position.y = bodyY + chassisH;
  group.add(lid);

  // rack-mount ears
  [-1, 1].forEach((sx) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(W * 0.05, chassisH * 0.9, 0.014), DEV_MAT.shellDim());
    ear.position.set(sx * W * 0.475, bodyY + chassisH / 2, D * 0.4);
    group.add(ear);
  });

  const frontZ = D * 0.4 + 0.008;

  // port banks + link LEDs
  const nPorts = 12;
  for (let r = 0; r < portRows; r++) {
    const py = bodyY + chassisH * (portRows === 1 ? 0.5 : 0.3 + r * 0.42);
    for (let i = 0; i < nPorts; i++) {
      const px = -W * 0.38 + i * (W * 0.68 / (nPorts - 1));
      const port = new THREE.Mesh(new THREE.BoxGeometry(W * 0.035, chassisH * 0.3, 0.012), DEV_MAT.darker());
      port.position.set(px, py, frontZ);
      group.add(port);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6),
        devGlow(i % 3 === 0 ? 0x22c55e : colorHex, 1.2));
      led.position.set(px, py + chassisH * 0.22, frontZ + 0.004);
      group.add(led);
    }
  }

  // SFP uplink cage
  const sfp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.12, chassisH * 0.34, 0.012), DEV_MAT.darker());
  sfp.position.set(W * 0.38, bodyY + chassisH * 0.5, frontZ);
  group.add(sfp);

  // badge stripe — this is what tells a firewall from a switch at a glance
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(W * 0.1, chassisH * 0.5, 0.01),
    devGlow(badge ?? colorHex, 0.9));
  stripe.position.set(-W * 0.42, bodyY + chassisH * 0.5, frontZ + 0.002);
  group.add(stripe);

  // antennas (routers / wireless controllers)
  if (antennas) {
    [-1, 1].forEach((sx) => {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.34, 8), DEV_MAT.darker());
      ant.position.set(sx * W * 0.36, bodyY + chassisH + 0.17, -D * 0.3);
      ant.rotation.z = sx * 0.22;
      group.add(ant);
    });
  }

  return { group, heightM: Math.max(frameH, bodyY + chassisH + (antennas ? 0.36 : 0.02)) };
}

const makeSwitchBody   = (w, d, c, o) => makeNetworkGearBody(w, d, c, o, { portRows: 2 });
const makeRouterBody   = (w, d, c, o) => makeNetworkGearBody(w, d, c, o, { portRows: 1, antennas: true });
const makeFirewallBody = (w, d, c, o) => makeNetworkGearBody(w, d, c, o, { portRows: 1, badge: 0xef4444 });


// ═══════════════════════════════════════════════════════════════════════════
// TIER III NETWORK ROOM BODIES
// ---------------------------------------------------------------------------
// The active gear (core router, distribution switch, ToR, load balancer,
// IDS/IPS, ISP CPE, console server) all shares makeNetworkGearBody, tuned per
// role so a router reads differently from a ToR at a glance. The passive gear
// (patch panel, ODF) and the WAN demarcation marker get their own bodies
// because a punch-down frame genuinely does not look like a switch.
// ═══════════════════════════════════════════════════════════════════════════

// Chassis router: three stacked line cards, tall frame, no antennas.
const makeCoreRouterBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, { ...o, heightM: Math.max(o?.heightM || 1.6, 1.6) },
    { portRows: 3, badge: 0xef4444 });

// Aggregation switch: two dense port rows, violet uplink badge.
const makeDistSwitchBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, o, { portRows: 2, badge: 0x8b5cf6 });

// Top-of-rack: single row, mounted low on a short frame the way a 1U ToR
// sits at the top of a cabinet rather than on its own relay rack.
const makeTorSwitchBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, { ...o, heightM: Math.min(o?.heightM || 1.2, 1.3) },
    { portRows: 1, badge: 0x6366f1 });

// ISP CPE: small, single row, antennas for the carrier link.
const makeIspUplinkBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, { ...o, heightM: Math.min(o?.heightM || 1.2, 1.4) },
    { portRows: 1, antennas: true, badge: 0x0284c7 });

const makeLoadBalancerBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, o, { portRows: 1, badge: 0x0d9488 });

const makeIdsIpsBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, o, { portRows: 1, badge: 0xf43f5e });

const makeConsoleServerBody = (w, d, c, o) =>
  makeNetworkGearBody(w, d, c, { ...o, heightM: Math.min(o?.heightM || 1.1, 1.2) },
    { portRows: 1, badge: 0xa3e635 });

/**
 * PASSIVE PANEL — patch panel / fiber ODF.
 * A two-post frame carrying one or more punch-down panels, with a bundle of
 * patch cords looping out of the front. `cfg.fiber` swaps copper RJ45 jacks
 * for LC duplex adapters and adds the splice-tray drawer.
 */
function makePassivePanelBody(w, d, colorHex, opts = {}, cfg = {}) {
  const fiber = !!cfg.fiber;
  const panels = cfg.panels || (fiber ? 2 : 3);
  const group = new THREE.Group();
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);
  const frameH = Math.max(1.2, Math.min(opts.heightM || 1.8, 2.1));

  // two-post frame
  const foot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.05, D * 0.9), DEV_MAT.darker());
  foot.position.y = 0.025;
  group.add(foot);
  [-1, 1].forEach((sx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, frameH, D * 0.3), DEV_MAT.steel());
    post.position.set(sx * W * 0.45, frameH / 2, 0);
    group.add(post);
  });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.03, D * 0.42), DEV_MAT.shellDim());
  tray.position.y = frameH;
  group.add(tray);

  const panelH = 0.09;
  const frontZ = D * 0.4 + 0.008;
  const topY = frameH * 0.78;

  for (let p = 0; p < panels; p++) {
    const py = topY - p * (panelH + 0.075);
    if (py < 0.2) break;

    const face = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, panelH, D * 0.55), DEV_MAT.shell());
    face.position.set(0, py, 0);
    face.castShadow = true;
    group.add(face);

    // jack row
    const n = fiber ? 8 : 12;
    for (let i = 0; i < n; i++) {
      const px = -W * 0.38 + i * (W * 0.7 / (n - 1));
      const jack = new THREE.Mesh(
        new THREE.BoxGeometry(W * (fiber ? 0.05 : 0.038), panelH * 0.46, 0.012),
        DEV_MAT.darker());
      jack.position.set(px, py, frontZ);
      group.add(jack);
      if (fiber) {
        const lit = new THREE.Mesh(new THREE.BoxGeometry(W * 0.03, panelH * 0.14, 0.008),
          devGlow(colorHex, 1.1));
        lit.position.set(px, py + panelH * 0.1, frontZ + 0.004);
        group.add(lit);
      }
    }
    // numbering strip
    const strip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, panelH * 0.14, 0.008),
      devGlow(colorHex, 0.5));
    strip.position.set(0, py - panelH * 0.34, frontZ + 0.002);
    group.add(strip);

    // horizontal cable manager under each panel
    const mgr = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.05, D * 0.42), DEV_MAT.shellDim());
    mgr.position.set(0, py - panelH * 0.5 - 0.035, D * 0.12);
    group.add(mgr);
  }

  // fiber: the pulled-out splice drawer with its coiled loops
  if (fiber) {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, 0.06, D * 0.75), DEV_MAT.shellLit());
    drawer.position.set(0, topY + 0.16, D * 0.12);
    group.add(drawer);
    [0.9, 0.62].forEach((r, i) => {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(Math.min(W, D) * 0.16 * r, 0.006, 6, 24),
        devGlow(colorHex, 0.7));
      coil.rotation.x = -Math.PI / 2;
      coil.position.set((i ? 1 : -1) * W * 0.16, topY + 0.2, D * 0.12);
      group.add(coil);
    });
  }

  // patch cords looping out of the front
  const cordMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
  for (let i = 0; i < 5; i++) {
    const x = -W * 0.3 + i * (W * 0.6 / 4);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, topY, frontZ),
      new THREE.Vector3(x * 0.6, topY - 0.22, frontZ + D * 0.22),
      new THREE.Vector3(x * 0.2, topY - 0.5, frontZ + D * 0.06),
    ]);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.007, 5, false), cordMat);
    group.add(cord);
  }

  return { group, heightM: frameH };
}

const makePatchPanelBody = (w, d, c, o) => makePassivePanelBody(w, d, c, o, { fiber: false });
const makeOdfBody        = (w, d, c, o) => makePassivePanelBody(w, d, c, o, { fiber: true, panels: 2 });

/**
 * INTERNET / WAN DEMARCATION MARKER.
 * Not a cabinet — a floor-standing demarc pedestal with a slowly-lit globe
 * ring on top, so the entry point of the whole network chain is obvious in
 * the 3D view without pretending to be a piece of rack gear.
 */
function makeWanBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);
  const H = Math.max(1.2, Math.min(opts.heightM || 1.8, 2.2));

  const plinthH = devPlinth(group, W, D, 0.1);

  // pedestal enclosure
  const bodyH = H * 0.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, bodyH, D * 0.6), DEV_MAT.shell());
  body.position.y = plinthH + bodyH / 2;
  body.castShadow = true;
  group.add(body);
  devLouvers(group, {
    width: W * 0.5, height: bodyH * 0.45, count: 6,
    y: plinthH + bodyH * 0.62, z: D * 0.3 + 0.006,
  });
  // demarc label plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42, bodyH * 0.16, 0.01),
    devGlow(colorHex, 0.9));
  plate.position.set(0, plinthH + bodyH * 0.28, D * 0.3 + 0.008);
  group.add(plate);

  // mast
  const mastH = H - plinthH - bodyH;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, mastH, 10), DEV_MAT.steel());
  mast.position.y = plinthH + bodyH + mastH / 2;
  group.add(mast);

  // globe: sphere + two orbital rings, lit in the chain colour
  const globeR = Math.min(W, D) * 0.22;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(globeR, 16, 12),
    new THREE.MeshStandardMaterial({
      color: colorHex, emissive: colorHex, emissiveIntensity: 0.55,
      transparent: true, opacity: 0.55, roughness: 0.25,
    }));
  globe.position.y = H;
  group.add(globe);
  [0, Math.PI / 2].forEach((rot, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(globeR * 1.15, 0.008, 6, 28),
      devGlow(colorHex, 1.3));
    ring.position.y = H;
    if (i === 0) ring.rotation.x = Math.PI / 2;
    else ring.rotation.y = rot;
    group.add(ring);
  });

  // the two carrier drops leaving toward ISP A and ISP B
  [-1, 1].forEach((sx) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, H - globeR, 0),
      new THREE.Vector3(sx * W * 0.34, H * 0.62, D * 0.16),
      new THREE.Vector3(sx * W * 0.46, plinthH + 0.05, D * 0.3),
    ]);
    const drop = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.009, 5, false),
      new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.55 }));
    group.add(drop);
  });

  return { group, heightM: H + globeR * 1.3 };
}

// ── CAMERA (CCTV) ──────────────────────────────────────────────────────────
// Bullet camera on a pole and knuckle bracket: barrel body, sunshield, lens
// assembly with an IR illuminator ring and the status LED.
function makeCameraBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const poleH = opts.heightM && opts.heightM > 0.6 ? Math.min(opts.heightM, 2.6) : 1.4;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 14), DEV_MAT.darker());
  base.position.y = 0.025;
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, poleH, 12), DEV_MAT.steel());
  pole.position.y = poleH / 2;
  group.add(pole);

  // knuckle bracket
  const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), DEV_MAT.shellDim());
  knuckle.position.y = poleH;
  group.add(knuckle);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.13), DEV_MAT.shellDim());
  arm.position.set(0, poleH + 0.02, 0.08);
  group.add(arm);

  // barrel body
  const barrelL = 0.3;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, barrelL, 18), DEV_MAT.shell());
  body.rotation.x = Math.PI / 2;
  body.position.set(0, poleH + 0.05, 0.2);
  group.add(body);

  // sunshield hood
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, barrelL * 0.95, 18, 1, true, Math.PI * 0.15, Math.PI * 0.7), DEV_MAT.shellDim());
  hood.rotation.x = Math.PI / 2;
  hood.position.set(0, poleH + 0.058, 0.2);
  group.add(hood);

  // lens + IR ring
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.062, 0.03, 20), DEV_MAT.dark());
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(0, poleH + 0.05, 0.2 + barrelL / 2);
  group.add(bezel);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 18),
    new THREE.MeshStandardMaterial({ color: 0x0a0e1a, metalness: 0.95, roughness: 0.08, emissive: colorHex, emissiveIntensity: 0.3 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, poleH + 0.05, 0.2 + barrelL / 2 + 0.012);
  group.add(lens);
  for (let i = 0; i < 8; i++) {
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), devGlow(0x7f1d1d, 0.8));
    ir.position.set(
      0.048 * Math.cos((i / 8) * Math.PI * 2),
      poleH + 0.05 + 0.048 * Math.sin((i / 8) * Math.PI * 2),
      0.2 + barrelL / 2 + 0.014,
    );
    group.add(ir);
  }

  // status LED + cable tail
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), devGlow(0x22c55e, 1.3));
  led.position.set(0, poleH + 0.1, 0.09);
  group.add(led);

  return { group, heightM: poleH + 0.16 };
}

// ── ACCESS TERMINALS (card reader · biometric · push button) ───────────────
// All three are the same wall-mounted plate on a stand; the face plate is what
// changes — a card target, a fingerprint platen, or a mushroom-head button.
function makeAccessTerminalBody(w, d, colorHex, opts = {}, cfg = {}) {
  const kind = cfg.kind || "card";
  const group = new THREE.Group();
  const mountH = opts.heightM && opts.heightM > 0.6 ? Math.min(opts.heightM, 1.6) : 1.15;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), DEV_MAT.darker());
  base.position.y = 0.02;
  group.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, mountH, 10), DEV_MAT.steel());
  post.position.y = mountH / 2;
  group.add(post);

  const pw = 0.17, ph = 0.28;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.05), DEV_MAT.shell());
  plate.position.set(0, mountH, 0);
  group.add(plate);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.86, ph * 0.9, 0.012), DEV_MAT.shellLit());
  inset.position.set(0, mountH, 0.03);
  group.add(inset);

  if (kind === "button") {
    // green mushroom-head release
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 18), DEV_MAT.shellDim());
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, mountH + ph * 0.12, 0.035);
    group.add(collar);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      devGlow(0x16a34a, 0.5));
    head.rotation.x = Math.PI / 2;
    head.position.set(0, mountH + ph * 0.12, 0.04);
    group.add(head);
    const legend = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.72, ph * 0.16, 0.008), devGlow(colorHex, 0.7));
    legend.position.set(0, mountH - ph * 0.28, 0.036);
    group.add(legend);
  } else if (kind === "bio") {
    // display + fingerprint platen
    const scr = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.66, ph * 0.2, 0.008), devGlow(colorHex, 0.95));
    scr.position.set(0, mountH + ph * 0.28, 0.037);
    group.add(scr);
    const platen = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.6, ph * 0.36, 0.012), DEV_MAT.darker());
    platen.position.set(0, mountH - ph * 0.06, 0.036);
    group.add(platen);
    for (let i = 0; i < 4; i++) {
      const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.012 + i * 0.009, 0.0022, 6, 18, Math.PI), devGlow(colorHex, 0.9));
      ridge.position.set(0, mountH - ph * 0.09, 0.043);
      group.add(ridge);
    }
  } else {
    // card presentation target + keypad
    const target = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.62, ph * 0.24, 0.01), DEV_MAT.darker());
    target.position.set(0, mountH + ph * 0.26, 0.036);
    group.add(target);
    const card = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.44, ph * 0.14, 0.006), devGlow(colorHex, 0.85));
    card.position.set(0, mountH + ph * 0.26, 0.042);
    group.add(card);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const key = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.17, ph * 0.07, 0.008), DEV_MAT.shellDim());
        key.position.set(-pw * 0.22 + c * pw * 0.22, mountH + ph * 0.06 - r * ph * 0.1, 0.036);
        group.add(key);
      }
    }
  }

  // accept LED, common to all three
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), devGlow(0x22c55e, 1.4));
  led.position.set(0, mountH - ph * 0.42, 0.038);
  group.add(led);

  return { group, heightM: mountH + ph * 0.6 };
}

const makeCardReaderBody = (w, d, c, o) => makeAccessTerminalBody(w, d, c, o, { kind: "card" });
const makeBiometricBody  = (w, d, c, o) => makeAccessTerminalBody(w, d, c, o, { kind: "bio" });
const makePushButtonBody = (w, d, c, o) => makeAccessTerminalBody(w, d, c, o, { kind: "button" });

// ═══════════════════════════════════════════════════════════════════════════
// SAFETY · POWER ACCESSORIES · INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

// ── FIRE SUPPRESSION CYLINDER (single FM200 bottle) ────────────────────────
// Agent bottle strapped to its wall channel: domed shoulders, valve head with
// a pressure gauge, actuator and the discharge hose into the manifold.
function makeFireCylinderBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.5;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);
  const r = Math.max(0.12, Math.min(W, D) * 0.36);

  const bodyH = H * 0.72;
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.55, roughness: 0.32 });

  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, bodyH, 22), bodyMat);
  shell.position.y = H * 0.06 + bodyH / 2;
  shell.castShadow = true;
  group.add(shell);
  // domed top + dished base
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
  dome.position.y = H * 0.06 + bodyH;
  group.add(dome);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, H * 0.06, 22), DEV_MAT.darker());
  foot.position.y = H * 0.03;
  group.add(foot);

  // neck, valve head + actuator
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.34, H * 0.08, 14), DEV_MAT.steel());
  neck.position.y = H * 0.06 + bodyH + r * 0.6;
  group.add(neck);
  const valve = new THREE.Mesh(new THREE.BoxGeometry(r * 0.85, H * 0.07, r * 0.85), DEV_MAT.shellDim());
  valve.position.y = H * 0.06 + bodyH + r * 0.6 + H * 0.07;
  group.add(valve);
  const act = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.24, r * 0.24, H * 0.08, 12), DEV_MAT.dark());
  act.position.y = H * 0.06 + bodyH + r * 0.6 + H * 0.14;
  group.add(act);
  // pressure gauge, faced outward so it reads from the aisle
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.02, 16), DEV_MAT.shellLit());
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(0, H * 0.06 + bodyH + r * 0.6 + H * 0.07, r * 0.55);
  group.add(gauge);

  // retaining straps
  [0.3, 0.72].forEach((f) => {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(r * 1.06, 0.014, 8, 22), DEV_MAT.steel());
    strap.rotation.x = Math.PI / 2;
    strap.position.y = H * 0.06 + bodyH * f;
    group.add(strap);
  });

  // agent label band
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, bodyH * 0.22, 22, 1, true), DEV_MAT.shellLit());
  label.position.y = H * 0.06 + bodyH * 0.52;
  group.add(label);

  return { group, heightM: H * 0.06 + bodyH + r * 0.6 + H * 0.2 };
}

// ── FIRE SUPPRESSION SYSTEM (cylinder bank + manifold) ─────────────────────
// The whole skid: several bottles on a common discharge manifold feeding a
// ceiling nozzle, with the release control head at floor level.
function makeFireSystemBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.6;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const nBottles = Math.max(2, Math.min(4, Math.round(W / 0.42)));
  const r = Math.min(W / nBottles * 0.36, D * 0.34);
  const bodyH = H * 0.62;
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.55, roughness: 0.32 });

  // floor channel
  const channel = new THREE.Mesh(new THREE.BoxGeometry(W * 0.94, 0.06, D * 0.7), DEV_MAT.darker());
  channel.position.y = 0.03;
  group.add(channel);

  for (let i = 0; i < nBottles; i++) {
    const bx = -W / 2 + (W / nBottles) * (i + 0.5);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, bodyH, 18), bodyMat);
    shell.position.set(bx, 0.06 + bodyH / 2, 0);
    group.add(shell);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
    dome.position.set(bx, 0.06 + bodyH, 0);
    group.add(dome);
    const label = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, bodyH * 0.2, 18, 1, true), DEV_MAT.shellLit());
    label.position.set(bx, 0.06 + bodyH * 0.5, 0);
    group.add(label);
    // riser into the manifold
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, H * 0.16, 10), DEV_MAT.steel());
    riser.position.set(bx, 0.06 + bodyH + r * 0.5 + H * 0.08, 0);
    group.add(riser);
  }

  // common discharge manifold
  const manY = 0.06 + bodyH + r * 0.5 + H * 0.18;
  const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, W * 0.96, 12), DEV_MAT.steel());
  manifold.rotation.z = Math.PI / 2;
  manifold.position.y = manY;
  group.add(manifold);

  // riser + ceiling nozzle
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, H * 0.3, 10), DEV_MAT.steel());
  riser.position.set(0, manY + H * 0.15, 0);
  group.add(riser);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, H * 0.08, 14), DEV_MAT.chrome());
  nozzle.position.set(0, manY + H * 0.32, 0);
  group.add(nozzle);

  // release control head
  const head = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, H * 0.16, 0.1), DEV_MAT.darker());
  head.position.set(0, 0.06 + H * 0.12, D * 0.36);
  group.add(head);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(W * 0.14, H * 0.07, 0.01), devGlow(0xef4444, 1.1));
  scr.position.set(-W * 0.06, 0.06 + H * 0.12, D * 0.36 + 0.055);
  group.add(scr);
  const ok = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), devGlow(0x22c55e, 1.3));
  ok.position.set(W * 0.08, 0.06 + H * 0.12, D * 0.36 + 0.055);
  group.add(ok);

  return { group, heightM: manY + H * 0.4 };
}

// ── BATTERY BANK ───────────────────────────────────────────────────────────
// VRLA battery stand: open shelves of blocks, posts and inter-cell straps,
// with the DC isolator on the end frame.
function makeBatteryBankBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.3;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const tiers = Math.max(2, Math.min(4, Math.round(H / 0.42)));
  const perTier = Math.max(2, Math.min(6, Math.round(W / 0.28)));

  // frame uprights
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), DEV_MAT.steel());
    post.position.set(sx * (W / 2 - 0.03), H / 2, sz * (D / 2 - 0.03));
    group.add(post);
  }));

  const blockW = (W * 0.92) / perTier;
  const tierGap = H / tiers;
  const blockH = tierGap * 0.6;

  for (let t = 0; t < tiers; t++) {
    const shelfY = t * tierGap + 0.04;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.03, D * 0.9), DEV_MAT.shellDim());
    shelf.position.y = shelfY;
    group.add(shelf);

    for (let i = 0; i < perTier; i++) {
      const bx = -W * 0.46 + blockW * (i + 0.5);
      const block = new THREE.Mesh(new THREE.BoxGeometry(blockW * 0.86, blockH, D * 0.78), DEV_MAT.shellLit());
      block.position.set(bx, shelfY + 0.015 + blockH / 2, 0);
      group.add(block);
      // + / − terminals
      const posT = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10), devGlow(0xef4444, 0.6));
      posT.position.set(bx - blockW * 0.22, shelfY + 0.015 + blockH + 0.015, D * 0.22);
      group.add(posT);
      const negT = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10), DEV_MAT.dark());
      negT.position.set(bx + blockW * 0.22, shelfY + 0.015 + blockH + 0.015, D * 0.22);
      group.add(negT);
      // vent cap strip
      const vent = new THREE.Mesh(new THREE.BoxGeometry(blockW * 0.6, 0.012, 0.03), DEV_MAT.darker());
      vent.position.set(bx, shelfY + 0.015 + blockH + 0.006, -D * 0.1);
      group.add(vent);
      // inter-cell strap to the next block
      if (i < perTier - 1) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(blockW * 0.44, 0.012, 0.024), DEV_MAT.copper());
        strap.position.set(bx + blockW * 0.5, shelfY + 0.015 + blockH + 0.024, D * 0.22);
        group.add(strap);
      }
    }
  }

  // DC isolator on the end frame
  const iso = new THREE.Mesh(new THREE.BoxGeometry(W * 0.22, H * 0.16, 0.09), DEV_MAT.darker());
  iso.position.set(W * 0.3, H * 0.86, D / 2 + 0.045);
  group.add(iso);
  const isoScr = new THREE.Mesh(new THREE.BoxGeometry(W * 0.12, H * 0.07, 0.01), devGlow(colorHex, 1));
  isoScr.position.set(W * 0.3, H * 0.86, D / 2 + 0.095);
  group.add(isoScr);

  return { group, heightM: H };
}

// ── iPDU (vertical rack power strip) ───────────────────────────────────────
// Zero-U intelligent rack PDU: metered head, a column of switched outlets and
// branch breakers, standing at rack height against the cabinet rail.
function makeIPDUBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM && opts.heightM > 0.5 ? Math.min(opts.heightM, 2.0) : 1.7;
  const W = Math.min(w, Math.max(opts.realW || 0.1, 0.09));
  const D = Math.min(d, Math.max(opts.realD || 0.08, 0.07));

  // mounting bracket + strip body
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, H, 0.02), DEV_MAT.steel());
  bracket.position.set(0, H / 2, -D / 2 - 0.01);
  group.add(bracket);
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), DEV_MAT.dark());
  body.position.y = H / 2;
  body.castShadow = true;
  group.add(body);

  const frontZ = D / 2 + 0.004;

  // metering head at the top
  const head = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.07, 0.012), DEV_MAT.darker());
  head.position.set(0, H * 0.94, frontZ);
  group.add(head);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, H * 0.035, 0.008), devGlow(colorHex, 1.1));
  scr.position.set(0, H * 0.95, frontZ + 0.005);
  group.add(scr);

  // outlet column
  const nOut = Math.max(8, Math.round(H / 0.1));
  for (let i = 0; i < nOut; i++) {
    const oy = H * 0.08 + i * (H * 0.8 / nOut);
    const outlet = new THREE.Mesh(new THREE.BoxGeometry(W * 0.74, H * 0.028, 0.01), DEV_MAT.darker());
    outlet.position.set(0, oy, frontZ);
    group.add(outlet);
    for (let p = 0; p < 3; p++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(W * 0.1, H * 0.012, 0.006), DEV_MAT.shellDim());
      pin.position.set(-W * 0.2 + p * W * 0.2, oy, frontZ + 0.004);
      group.add(pin);
    }
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), devGlow(colorHex, 1.2));
    led.position.set(W * 0.3, oy, frontZ + 0.004);
    group.add(led);
  }

  // branch breakers down the flank
  for (let i = 0; i < 3; i++) {
    const brk = new THREE.Mesh(new THREE.BoxGeometry(0.012, H * 0.05, D * 0.6), DEV_MAT.shellLit());
    brk.position.set(W / 2 + 0.006, H * 0.2 + i * H * 0.12, 0);
    group.add(brk);
  }

  return { group, heightM: H };
}

// ── BUSWAY / POWER SOURCE ──────────────────────────────────────────────────
// Overhead busbar trunking: the suspended housing run with its joint packs,
// tap-off apertures along the underside and the drop rods to the ceiling.
function makeBuswayBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 2.6;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const runH = Math.max(0.18, Math.min(D * 0.6, 0.3));
  // Hang the run a clear drop below the ceiling so the hanger rods are
  // actually visible — pinned flush to H they collapse to nothing.
  const ceilY = H;
  const runY = Math.max(runH, H - 0.55);

  // housing
  const housing = new THREE.Mesh(new THREE.BoxGeometry(W, runH, D * 0.7), DEV_MAT.shell());
  housing.position.y = runY;
  housing.castShadow = true;
  group.add(housing);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W, runH * 0.16, D * 0.72), DEV_MAT.shellLit());
  lid.position.y = runY + runH / 2;
  group.add(lid);

  // live conductors glimpsed at the ends
  [-1, 1].forEach((sx) => {
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, runH * 0.14, D * 0.5),
        i === 3 ? DEV_MAT.copper() : devGlow(colorHex, 0.5));
      bar.position.set(sx * (W / 2 + 0.006), runY - runH * 0.28 + i * runH * 0.18, 0);
      group.add(bar);
    }
  });

  // joint packs + hanger rods
  const nJoints = Math.max(2, Math.round(W / 2.4));
  for (let i = 0; i < nJoints; i++) {
    const jx = -W / 2 + (W / nJoints) * (i + 0.5);
    const joint = new THREE.Mesh(new THREE.BoxGeometry(0.1, runH * 1.15, D * 0.76), DEV_MAT.shellDim());
    joint.position.set(jx, runY, 0);
    group.add(joint);
    [-1, 1].forEach((sz) => {
      const rodLen = Math.max(0.08, ceilY - runY - runH / 2);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, rodLen, 8), DEV_MAT.steel());
      rod.position.set(jx, runY + runH / 2 + rodLen / 2, sz * D * 0.25);
      group.add(rod);
    });
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, D * 0.6), DEV_MAT.steel());
    yoke.position.set(jx, ceilY, 0);
    group.add(yoke);
  }

  // tap-off apertures on the underside
  const nTaps = Math.max(2, Math.round(W / 1.2));
  for (let i = 0; i < nTaps; i++) {
    const tx = -W / 2 + (W / nTaps) * (i + 0.5);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, D * 0.34), DEV_MAT.darker());
    slot.position.set(tx, runY - runH / 2 - 0.008, 0);
    group.add(slot);
  }

  return { group, heightM: ceilY };
}

// ── TAP-OFF BOX ────────────────────────────────────────────────────────────
// The plug-in box that hangs off a busway: stab housing, rotary isolator
// handle, output socket and the flexible drop to the rack.
function makeTapOffBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 0.4;
  const W = Math.min(w, Math.max(opts.realW || 0.4, 0.24));
  const D = Math.min(d, Math.max(opts.realD || 0.16, 0.12));

  // the box hangs under the busway, so it sits high off the floor
  const hangY = 2.15;

  const stab = new THREE.Mesh(new THREE.BoxGeometry(W * 0.4, 0.07, D * 0.6), DEV_MAT.steel());
  stab.position.y = hangY + H / 2 + 0.035;
  group.add(stab);

  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), DEV_MAT.shell());
  body.position.y = hangY;
  body.castShadow = true;
  group.add(body);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.86, 0.014), DEV_MAT.shellLit());
  lid.position.set(0, hangY, D / 2 + 0.008);
  group.add(lid);

  // ── MCB with a lever that actually throws ──
  // The lever lives in its own pivot group so the switch can be animated by
  // rotating ONE object: a lever mesh rotated about its own centre would
  // spin in place instead of hinging from the bottom of its travel.
  const din = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, H * 0.5, 0.014), DEV_MAT.darker());
  din.position.set(-W * 0.14, hangY + H * 0.05, D / 2 + 0.016);
  group.add(din);

  const pivot = new THREE.Group();
  pivot.name = "SwitchLever";
  pivot.position.set(-W * 0.14, hangY + H * 0.02, D / 2 + 0.03);
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.16, H * 0.26, 0.026),
    new THREE.MeshStandardMaterial({ color: 0xe8edf3, metalness: 0.2, roughness: 0.5 }),
  );
  lever.position.y = H * 0.13;          // sits above the hinge, so it swings
  pivot.add(lever);
  const tip = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.16, H * 0.07, 0.03), devGlow(colorHex, 0.9));
  tip.position.y = H * 0.23;
  pivot.add(tip);
  group.add(pivot);

  // I / O legend either side of the lever's travel
  const onMark = new THREE.Mesh(new THREE.BoxGeometry(W * 0.05, H * 0.05, 0.008), devGlow(0x22c55e, 1.2));
  onMark.position.set(-W * 0.3, hangY + H * 0.26, D / 2 + 0.02);
  group.add(onMark);
  const offMark = new THREE.Mesh(new THREE.BoxGeometry(W * 0.05, H * 0.05, 0.008), devGlow(0xef4444, 1.2));
  offMark.position.set(-W * 0.3, hangY - H * 0.16, D / 2 + 0.02);
  group.add(offMark);

  // status lamps + output socket
  [0x22c55e, 0xef4444].forEach((c, i) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), devGlow(c, 1.3));
    led.position.set(W * 0.06, hangY + H * 0.2 - i * H * 0.2, D / 2 + 0.018);
    group.add(led);
  });
  const socket = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, H * 0.34, 0.02), DEV_MAT.darker());
  socket.position.set(W * 0.28, hangY, D / 2 + 0.018);
  group.add(socket);

  // drop cable to the rack below
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, hangY - H / 2, 8), DEV_MAT.rubber());
  drop.position.set(W * 0.28, (hangY - H / 2) / 2, D * 0.2);
  group.add(drop);

  // Tells the view this device can be switched, and which object to throw.
  group.userData.switchable = "mcb";
  group.userData.leverName = "SwitchLever";

  return { group, heightM: hangY + H / 2 + 0.08 };
}

// ── BR (MOULDED-CASE BREAKER) ──────────────────────────────────────────────
// Wall enclosure with the MCCB inside: arc chutes, the trip toggle, line and
// load terminal shrouds and the rating plate.
function makeBreakerBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 0.6;
  const W = Math.min(w, Math.max(opts.realW || 0.5, 0.3));
  const D = Math.min(d, Math.max(opts.realD || 0.25, 0.15));
  const mountY = 1.35; // breakers live at chest height on a wall or panel

  // A breaker enclosure is wall-mounted in real life; dropped on open floor it
  // would hang in mid-air, so it comes with the slim mounting stand it would
  // be bolted to in a plant room.
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, mountY + H / 2, 0.03), DEV_MAT.shellDim());
  backPlate.position.set(0, (mountY + H / 2) / 2, -D / 2 - 0.015);
  group.add(backPlate);
  [-1, 1].forEach((sx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, mountY, 0.035), DEV_MAT.steel());
    leg.position.set(sx * W * 0.28, mountY / 2, -D / 2 - 0.03);
    group.add(leg);
  });
  const foot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 0.03, D * 0.5), DEV_MAT.darker());
  foot.position.set(0, 0.015, -D * 0.2);
  group.add(foot);

  const encl = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), DEV_MAT.shell());
  encl.position.y = mountY;
  encl.castShadow = true;
  group.add(encl);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, H * 0.9, 0.02), DEV_MAT.shellLit());
  lid.position.set(0, mountY, D / 2 + 0.011);
  group.add(lid);

  const frontZ = D / 2 + 0.022;

  // the MCCB body
  const mccb = new THREE.Mesh(new THREE.BoxGeometry(W * 0.56, H * 0.62, 0.03), DEV_MAT.dark());
  mccb.position.set(0, mountY, frontZ);
  group.add(mccb);
  // arc chute vents
  for (let i = 0; i < 3; i++) {
    const chute = new THREE.Mesh(new THREE.BoxGeometry(W * 0.13, H * 0.09, 0.012), DEV_MAT.darker());
    chute.position.set(-W * 0.17 + i * W * 0.17, mountY + H * 0.24, frontZ + 0.016);
    group.add(chute);
  }
  // ── trip toggle, hinged so ON/OFF is a visible throw ──
  // Same trick as the tap-off's MCB: a pivot group at the hinge, with the
  // toggle offset above it, so one rotation swings the handle through its
  // travel instead of spinning it about its own middle.
  const pivot = new THREE.Group();
  pivot.name = "SwitchLever";
  pivot.position.set(0, mountY - H * 0.1, frontZ + 0.02);
  const toggle = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, H * 0.2, 0.04), DEV_MAT.shellLit());
  toggle.position.y = H * 0.1;
  pivot.add(toggle);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.1, H * 0.08, 0.018), devGlow(colorHex, 0.95));
  tip.position.set(0, H * 0.17, 0.022);
  pivot.add(tip);
  group.add(pivot);
  // ON / OFF legend
  const on = new THREE.Mesh(new THREE.BoxGeometry(W * 0.08, H * 0.04, 0.008), devGlow(0x22c55e, 1.2));
  on.position.set(-W * 0.18, mountY + H * 0.05, frontZ + 0.018);
  group.add(on);
  const off = new THREE.Mesh(new THREE.BoxGeometry(W * 0.08, H * 0.04, 0.008), devGlow(0xef4444, 1.2));
  off.position.set(W * 0.18, mountY - H * 0.12, frontZ + 0.018);
  group.add(off);
  // line / load terminal shrouds
  [-1, 1].forEach((sy) => {
    for (let i = 0; i < 3; i++) {
      const term = new THREE.Mesh(new THREE.BoxGeometry(W * 0.1, H * 0.07, 0.018), DEV_MAT.copper());
      term.position.set(-W * 0.17 + i * W * 0.17, mountY + sy * H * 0.37, frontZ + 0.006);
      group.add(term);
    }
  });
  // rating plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, H * 0.1, 0.008), devGlow(colorHex, 0.55));
  plate.position.set(0, mountY - H * 0.24, frontZ + 0.018);
  group.add(plate);

  group.userData.switchable = "mccb";
  group.userData.leverName = "SwitchLever";

  return { group, heightM: mountY + H / 2 };
}

// ── DOOR ───────────────────────────────────────────────────────────────────
// Access-controlled door: frame, leaf with a vision panel, lever handle and
// escutcheon, three hinges, the maglock at the head and a threshold plate.
function makeDoorBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 2.1;
  const W = Math.min(w, opts.realW || w);
  const leafD = Math.min(d, 0.06);

  // frame
  const frameMat = DEV_MAT.shellDim();
  [-1, 1].forEach((sx) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(W * 0.07, H, leafD * 2.2), frameMat);
    jamb.position.set(sx * (W / 2 - W * 0.035), H / 2, 0);
    group.add(jamb);
  });
  const headFrame = new THREE.Mesh(new THREE.BoxGeometry(W, W * 0.07, leafD * 2.2), frameMat);
  headFrame.position.set(0, H - W * 0.035, 0);
  group.add(headFrame);

  // leaf
  const leafW = W * 0.86, leafH = H - W * 0.07;
  const leafMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.35, roughness: 0.55 });
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafD), leafMat);
  leaf.position.y = leafH / 2;
  leaf.castShadow = true;
  group.add(leaf);

  // vision panel
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd, metalness: 0.1, roughness: 0.06, transparent: true, opacity: 0.42,
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.5, leafH * 0.3, leafD + 0.006), glassMat);
  glass.position.y = leafH * 0.68;
  group.add(glass);
  const glassFrame = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.56, leafH * 0.34, leafD * 0.6), DEV_MAT.steel());
  glassFrame.position.set(0, leafH * 0.68, leafD * 0.3);
  group.add(glassFrame);

  // lever handle both sides + escutcheon
  [-1, 1].forEach((sz) => {
    const esc = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.1, leafH * 0.12, 0.012), DEV_MAT.chrome());
    esc.position.set(-leafW * 0.36, leafH * 0.46, sz * (leafD / 2 + 0.006));
    group.add(esc);
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, leafW * 0.2, 10), DEV_MAT.chrome());
    lever.rotation.z = Math.PI / 2;
    lever.position.set(-leafW * 0.28, leafH * 0.46, sz * (leafD / 2 + 0.03));
    group.add(lever);
  });

  // hinges
  [0.12, 0.5, 0.88].forEach((f) => {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, leafH * 0.07, 10), DEV_MAT.steel());
    hinge.position.set(leafW / 2, leafH * f, leafD / 2);
    group.add(hinge);
  });

  // maglock + armature at the head, with its status LED
  const lock = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.4, W * 0.06, leafD * 1.6), DEV_MAT.darker());
  lock.position.set(0, leafH - W * 0.03, 0);
  group.add(lock);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), devGlow(0x22c55e, 1.3));
  led.position.set(leafW * 0.26, leafH - W * 0.03, leafD * 0.9);
  group.add(led);

  // threshold
  const sill = new THREE.Mesh(new THREE.BoxGeometry(W, 0.02, leafD * 2.4), DEV_MAT.steel());
  sill.position.y = 0.01;
  group.add(sill);

  return { group, heightM: H };
}

// ── STAIRS & RAMP ──────────────────────────────────────────────────────────
// The loading-bay approach: a flight of steps with nosings and a handrail,
// and the accessibility ramp with its kerb running up alongside.
function makeStairsRampBody(w, d, colorHex, opts = {}) {
  const group = new THREE.Group();
  const H = opts.heightM || 1.0;
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  const stairW = W * 0.45;
  const rampW  = W * 0.42;
  const stairX = W * 0.26;
  const rampX  = -W * 0.26;

  const nSteps = Math.max(3, Math.round(H / 0.18));
  const riser = H / nSteps;
  const tread = D / nSteps;

  // steps
  for (let i = 0; i < nSteps; i++) {
    const stepH = riser * (i + 1);
    const step = new THREE.Mesh(new THREE.BoxGeometry(stairW, stepH, tread * 0.98), DEV_MAT.shell());
    step.position.set(stairX, stepH / 2, D / 2 - tread * (i + 0.5));
    step.castShadow = true;
    group.add(step);
    // anti-slip nosing
    const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairW * 0.98, 0.012, 0.05),
      devGlow(colorHex, 0.45));
    nosing.position.set(stairX, stepH + 0.006, D / 2 - tread * i - 0.03);
    group.add(nosing);
  }

  // ramp deck + kerb
  const rampLen = Math.sqrt(D * D + H * H);
  // The flight rises toward -Z (step 0 sits at +Z), so the ramp has to lean the
  // same way — with the sign flipped they splay apart and the whole assembly
  // reads as broken.
  const slopeX = Math.atan2(H, D);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(rampW, 0.06, rampLen), DEV_MAT.shellDim());
  ramp.position.set(rampX, H / 2, 0);
  ramp.rotation.x = slopeX;
  ramp.castShadow = true;
  group.add(ramp);
  [-1, 1].forEach((sx) => {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, rampLen), DEV_MAT.steel());
    kerb.position.set(rampX + sx * rampW / 2, H / 2 + 0.06, 0);
    kerb.rotation.x = slopeX;
    group.add(kerb);
  });

  // handrails on the outer edges of both
  [[stairX + stairW / 2, 1], [rampX - rampW / 2, -1]].forEach(([hx]) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, rampLen, 10), DEV_MAT.chrome());
    rail.position.set(hx, H / 2 + 0.95, 0);
    // a +Y cylinder aligned onto (0, H, -D)
    rail.rotation.x = -Math.atan2(D, H);
    group.add(rail);
    [-1, 0, 1].forEach((f) => {
      const zz = f * D * 0.36;
      const y = H / 2 - (zz / D) * H;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 8), DEV_MAT.steel());
      post.position.set(hx, y + 0.475, zz);
      group.add(post);
    });
  });

  // landing at the top
  const landing = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, D * 0.16), DEV_MAT.shellDim());
  landing.position.set(0, H, -D / 2 + D * 0.08);
  group.add(landing);

  return { group, heightM: H + 1.05 };
}

// ── WLD PANEL (water-leak detection) ───────────────────────────────────────
// A power-panel shell wearing a strobe beacon and the sensing-cable gland —
// same cabinet family as the PP, which is exactly how it looks in an
// electrical room.
function makeWLDPanelBody(w, d, colorHex, opts = {}) {
  const { group, heightM } = makeSwitchPanelBody(w, d, colorHex, opts,
    { sections: 1, liftingEyes: false, busChamber: false });
  const W = Math.min(w, opts.realW || w);
  const D = Math.min(d, opts.realD || d);

  // strobe beacon on the roof
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.09, 10), DEV_MAT.steel());
  stem.position.set(0, heightM + 0.045, 0);
  group.add(stem);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.11, 14), devGlow(0xef4444, 1.1));
  beacon.position.set(0, heightM + 0.145, 0);
  group.add(beacon);
  const domeCap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), devGlow(0xef4444, 1.1));
  domeCap.position.set(0, heightM + 0.2, 0);
  group.add(domeCap);

  // sensing-cable gland + the loop running off under the floor
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 10), DEV_MAT.steel());
  gland.rotation.x = Math.PI / 2;
  gland.position.set(0, 0.14, D / 2 + 0.03);
  group.add(gland);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.14, D / 2 + 0.05),
    new THREE.Vector3(W * 0.5, 0.06, D * 0.9),
    new THREE.Vector3(W * 1.1, 0.05, D * 0.4),
    new THREE.Vector3(W * 1.4, 0.05, -D * 0.4),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.014, 8, false), devGlow(colorHex, 0.5));
  group.add(cable);

  return { group, heightM: heightM + 0.26 };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
export {
  // power chain
  makeTransformerBody, makeGeneratorBody, makeSwitchPanelBody,
  makeMainPowerPanelBody, makePowerPanelBody, makeUPSBody, makePDUBody,
  // cooling & environment
  makeCracBody, makeChillerBody, makeHumidifierBody,
  // network
  makeNetworkGearBody, makeSwitchBody, makeRouterBody, makeFirewallBody,
  // network — Tier III deployment chain
  makeCoreRouterBody, makeDistSwitchBody, makeTorSwitchBody, makeIspUplinkBody,
  makeLoadBalancerBody, makeIdsIpsBody, makeConsoleServerBody,
  makePassivePanelBody, makePatchPanelBody, makeOdfBody, makeWanBody,
  // security & access
  makeCameraBody, makeAccessTerminalBody,
  makeCardReaderBody, makeBiometricBody, makePushButtonBody,
  // safety
  makeFireCylinderBody, makeFireSystemBody,
  // power accessories
  makeBatteryBankBody, makeIPDUBody, makeBuswayBody, makeTapOffBody,
  makeBreakerBody, makeWLDPanelBody,
  // infrastructure
  makeDoorBody, makeStairsRampBody,
};
