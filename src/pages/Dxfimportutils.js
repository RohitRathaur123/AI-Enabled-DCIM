// dxfImportUtils.js
// ─────────────────────────────────────────────────────────────────────────
// Client-side CAD floor-plan import.
//
// IMPORTANT — DWG vs DXF:
//   .dwg is Autodesk's closed, binary format. There is no supported,
//   license-clean way to parse it in a browser. The practical path is:
//     1) User exports/saves the drawing as .dxf from AutoCAD ("Save As" →
//        DXF), OR
//     2) You run a server-side conversion step (e.g. the free ODA File
//        Converter, or Autodesk Forge's Model Derivative API) that turns
//        .dwg into .dxf before it ever reaches the browser.
//   This module accepts .dxf directly. The upload UI still accepts .dwg
//   selection so users don't get a dead-end, but for .dwg it shows a
//   message asking them to convert first instead of silently failing.
//
// Requires: npm install dxf-parser
// ─────────────────────────────────────────────────────────────────────────

import DxfParser from "dxf-parser";

/**
 * Reads a File object as text.
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

/**
 * Extracts a flat list of 2D line-segments (and circles/arcs, converted to
 * polylines) from a parsed DXF document. Units are whatever the DXF file
 * used (assumed consistent, e.g. all meters or all mm) — normalization to
 * the DC's real-world length/breadth happens in normalizeFloorPlan().
 */
function extractSegmentsFromDxf(dxf) {
  const segments = []; // each: { x1, y1, x2, y2 }
  const points = [];   // used only for bounding-box calc

  const pushSeg = (x1, y1, x2, y2) => {
    segments.push({ x1, y1, x2, y2 });
    points.push([x1, y1], [x2, y2]);
  };

  const arcToSegments = (cx, cy, r, startDeg, endDeg, steps = 24) => {
    let start = (startDeg * Math.PI) / 180;
    let end = (endDeg * Math.PI) / 180;
    if (end < start) end += Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = start + ((end - start) * i) / steps;
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      pushSeg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
  };

  const entities = dxf?.entities || [];
  entities.forEach((e) => {
    switch (e.type) {
      case "LINE": {
        if (e.vertices?.length >= 2) {
          pushSeg(e.vertices[0].x, e.vertices[0].y, e.vertices[1].x, e.vertices[1].y);
        }
        break;
      }
      case "LWPOLYLINE":
      case "POLYLINE": {
        const verts = e.vertices || [];
        for (let i = 0; i < verts.length - 1; i++) {
          pushSeg(verts[i].x, verts[i].y, verts[i + 1].x, verts[i + 1].y);
        }
        if (e.shape && verts.length > 2) {
          pushSeg(verts[verts.length - 1].x, verts[verts.length - 1].y, verts[0].x, verts[0].y);
        }
        break;
      }
      case "CIRCLE": {
        if (e.center) arcToSegments(e.center.x, e.center.y, e.radius, 0, 360, 48);
        break;
      }
      case "ARC": {
        if (e.center) {
          arcToSegments(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle, 32);
        }
        break;
      }
      default:
        break; // TEXT, DIMENSION, HATCH, INSERT (blocks) etc. skipped for v1
    }
  });

  return { segments, points };
}

/**
 * Scales/centers raw DXF segments (in drawing units) into the DC's
 * real-world footprint (lengthM x breadthM, centered at origin — matching
 * the coordinate system used by createOuterBuilding in the 3D view).
 */
function normalizeFloorPlan(segments, points, lengthM, breadthM) {
  if (!points.length) return { segments: [], bounds: null, scale: 1 };

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rawW = Math.max(maxX - minX, 1e-6);
  const rawH = Math.max(maxY - minY, 1e-6);

  // Fit within DC footprint, preserving aspect ratio, with a small margin
  const fitPad = 0.96;
  const scale = Math.min((lengthM * fitPad) / rawW, (breadthM * fitPad) / rawH);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const normalized = segments.map((s) => ({
    x1: (s.x1 - cx) * scale,
    z1: (s.y1 - cy) * scale, // DXF Y → world Z (top-down plan onto XZ floor)
    x2: (s.x2 - cx) * scale,
    z2: (s.y2 - cy) * scale,
  }));

  return {
    segments: normalized,
    bounds: { minX, maxX, minY, maxY, rawW, rawH },
    scale,
  };
}

/**
 * Main entry point: parse a .dxf File object and return a floor-plan
 * object ready to hand to the 3D viewer.
 *
 * @param {File} file            The uploaded .dxf file
 * @param {number} lengthM        DC length in meters (for scaling/fit)
 * @param {number} breadthM       DC breadth in meters (for scaling/fit)
 * @returns {Promise<{segments: Array, entityCount: number, sourceFileName: string}>}
 */
export async function parseDxfFile(file, lengthM, breadthM) {
  const name = file.name || "";
  const ext = name.split(".").pop().toLowerCase();

  if (ext === "dwg") {
    throw new Error(
      "DWG files can't be read in the browser (it's a closed binary format). " +
        "Please save/export the drawing as DXF in AutoCAD (File → Save As → " +
        "AutoCAD DXF) and upload the .dxf file instead."
    );
  }
  if (ext !== "dxf") {
    throw new Error("Please upload a .dxf file.");
  }

  const text = await readFileAsText(file);
  const parser = new DxfParser();
  let dxf;
  try {
    dxf = parser.parseSync(text);
  } catch (err) {
    throw new Error("Could not parse this DXF file: " + (err?.message || "unknown error"));
  }

  const { segments, points } = extractSegmentsFromDxf(dxf);
  if (!segments.length) {
    throw new Error("No drawable entities (LINE/POLYLINE/CIRCLE/ARC) were found in this DXF.");
  }

  const { segments: normSegments, bounds, scale } = normalizeFloorPlan(
    segments,
    points,
    lengthM || 40,
    breadthM || 25
  );

  return {
    segments: normSegments,
    entityCount: segments.length,
    sourceFileName: name,
    bounds,
    scale,
    importedAt: new Date().toISOString(),
  };
}