// ── Rack Elevation Modal ──────────────────────────────────────────────────
// Opens on double-clicking a rack in the 3D view. Shows the rack's FRONT and
// BACK as flat elevations, U-by-U, sized to the rack's real U-count (6U,
// 42U, 48U...). Every U row can have a device added or removed — additions
// respect the picked device's U-size and only fill available empty space.
//
// Data comes entirely through rackDeviceService.js (mock today, real API
// later — nothing in this file talks to storage directly). After any
// add/remove it calls onSlotsChanged(rackId, slots) so the caller can push
// the same slots onto the live 3D rack (see Datacenter3dview.jsx).

import React, { useCallback, useEffect, useState } from "react";
import { Modal, Spin, Empty, Tag, ConfigProvider } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import {
  getDeviceImageLibrary,
  getRackSlotAssignments,
  saveRackSlotAssignment,
  removeRackSlotAssignment,
} from "./rackDeviceService";
import { ElevationColumn, PALETTE } from "./ElevationColumn";

export default function RackElevationModal({ open, rack, onClose, onSlotsChanged }) {
  const [library, setLibrary] = useState([]);
  const [slots, setSlots] = useState([]);
  // Which rack the data currently in state belongs to. Rendering rows before
  // this matches the rack being opened is what made a single double-click
  // look like two: the body painted the PREVIOUS rack's rows (or the "no
  // devices" empty state) for a frame, blanked to a spinner, then painted
  // the real rows -- three different bodies in a row, which reads exactly
  // like the dialog closing and reopening.
  const [loadedRackId, setLoadedRackId] = useState(null);

  // What this load actually depends on is WHICH rack and HOW MANY U -- not
  // the identity of the object the parent happened to build this time. The
  // caller creates a fresh { id, name, totalUnitsU } on every open, so
  // depending on `rack` itself re-ran the whole load whenever that object
  // was rebuilt, and the dialog flashed its spinner and re-rendered a
  // second time for a single double-click. Depend on the values instead.
  const rackId = rack?.id ?? null;
  const rackUnits = rack?.totalUnitsU ?? 0;

  useEffect(() => {
    if (!open || !rackId) return;
    let cancelled = false;
    // Drop the last rack's rows immediately, so nothing stale is on screen
    // while this one loads.
    setLoadedRackId(null);
    Promise.all([
      getDeviceImageLibrary(),
      getRackSlotAssignments(rackId, rackUnits),
    ]).then(([lib, s]) => {
      if (cancelled) return;
      setLibrary(lib);
      setSlots(s);
      setLoadedRackId(rackId);
    }).catch(() => { if (!cancelled) setLoadedRackId(rackId); });
    return () => { cancelled = true; };
  }, [open, rackId, rackUnits]);

  const ready = open && rackId != null && loadedRackId === rackId;

  const persist = useCallback((nextSlots) => {
    setSlots(nextSlots);
    if (rack) onSlotsChanged?.(rack.id, nextSlots);
  }, [rack, onSlotsChanged]);

  const handleAdd = useCallback((u, availableUp, dev) => {
    if (!rack) return;
    const sizeU = Math.max(1, Math.min(dev.defaultSizeU || 1, availableUp));
    const startU = u - 1; // 0-indexed from bottom
    const slot = {
      id: `${dev.id}-${startU}-${Date.now()}`,
      deviceId: dev.id,
      deviceName: dev.name,
      startU,
      sizeU,
      frontImageUrl: dev.frontImageUrl,
      backImageUrl: dev.backImageUrl,
    };
    saveRackSlotAssignment(rack.id, slot, rack.totalUnitsU).then((updated) => persist(updated));
  }, [rack, persist]);

  // Free-text label -- no photo, just a real device name typed straight onto
  // a U-row (e.g. "CDU Server 19"). Same store as handleAdd; deviceId stays
  // null so RackRealFace.js knows to draw a text nameplate, not a photo.
  const handleAddLabel = useCallback((u, availableUp, name) => {
    if (!rack) return;
    const sizeU = Math.max(1, Math.min(1, availableUp));
    const startU = u - 1; // 0-indexed from bottom
    const slot = {
      id: `label-${startU}-${Date.now()}`,
      deviceId: null,
      deviceName: name,
      startU,
      sizeU,
      frontImageUrl: null,
      backImageUrl: null,
    };
    saveRackSlotAssignment(rack.id, slot, rack.totalUnitsU).then((updated) => persist(updated));
  }, [rack, persist]);

  const handleRemove = useCallback((slot) => {
    if (!rack) return;
    removeRackSlotAssignment(rack.id, slot.id, rack.totalUnitsU).then((updated) => persist(updated));
  }, [rack, persist]);

  return (
    // ── Why this modal is wrapped and NOT destroyOnClose ──
    // This project runs React 19 with antd 5 and without
    // @ant-design/v5-patch-for-react19, so antd's dialog motion is not
    // officially supported here. destroyOnClose tore the dialog down and
    // rebuilt it on every open, which re-ran rc-motion's enter sequence from
    // scratch and could visibly replay -- the "opens, closes, opens again"
    // on one double-click. forceRender keeps the dialog mounted and the
    // nested ConfigProvider turns the animation off for just this dialog,
    // which is the same fix the device-footprint modal in
    // Datacenter3dview.jsx already carries for the same reason.
    // The BODY is still gated on `open` below, so the 84 dropdown rows of a
    // 42U elevation are not sitting in the DOM while the dialog is shut.
    <ConfigProvider theme={{ token: { motion: false } }}>
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      zIndex={100020}
      forceRender
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AppstoreOutlined style={{ color: PALETTE.accent }} />
          <span>{rack?.name || "Rack"} — Elevation View</span>
          <Tag color="blue">{rack?.totalUnitsU || 0}U</Tag>
        </div>
      }
    >
      {!open ? null : (
      <>
      <div style={{ fontSize: 11.5, color: PALETTE.textSub, marginBottom: 10 }}>
        Click any empty row to add a device from the library, or type a custom label (e.g. a real device name).
        Changes apply instantly to the 3D rack — open <b>RACK VIEW</b> in the header to see them.
      </div>
      {!ready ? (
        // One cheap first paint. The 42U x 2 grid of dropdowns below costs
        // real milliseconds to mount, and mounting it inside the double-click
        // event is what produced the "'dblclick' handler took 245ms"
        // violation; behind the spinner it lands on a later frame instead.
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin /></div>
      ) : !library.length ? (
        <Empty description="No devices in the image library yet" />
      ) : (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: PALETTE.text, marginBottom: 6, letterSpacing: 0.5 }}>
              FRONT
            </div>
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              <ElevationColumn face="front" totalUnitsU={rack.totalUnitsU} slots={slots} library={library} onAdd={handleAdd} onAddLabel={handleAddLabel} onRemove={handleRemove} rowPx={16} imageMinPx={28} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: PALETTE.text, marginBottom: 6, letterSpacing: 0.5 }}>
              BACK
            </div>
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              <ElevationColumn face="back" totalUnitsU={rack.totalUnitsU} slots={slots} library={library} onAdd={handleAdd} onAddLabel={handleAddLabel} onRemove={handleRemove} rowPx={16} imageMinPx={28} />
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </Modal>
    </ConfigProvider>
  );
}
