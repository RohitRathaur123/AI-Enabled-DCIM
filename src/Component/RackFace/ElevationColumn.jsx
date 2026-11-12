// ── Shared U-elevation column ─────────────────────────────────────────────
// Renders one face (front/back) of one rack as a stack of U-rows: filled
// rows show the assigned device's photo, empty rows are individually
// clickable to add a device from the library. Used by both the single-rack
// RackElevationModal (double-click a rack) and the all-racks
// RackFarmElevationView ("TRANSPARENT" header tab).

import React, { useMemo, useState } from "react";
import { Dropdown, Tooltip } from "antd";
import { PlusOutlined, CloseOutlined, TagOutlined } from "@ant-design/icons";

export const PALETTE = {
  bg: "#0b0f1a",
  panel: "#0f172a",
  panelAlt: "#131c2e",
  border: "#1e293b",
  borderStrong: "#334155",
  text: "#e2e8f0",
  textSub: "#94a3b8",
  accent: "#38bdf8",
  danger: "#ef4444",
};

// Walks U 1..totalUnitsU top-to-bottom and groups it into contiguous
// "device" or "empty" segments, ready to render in order.
export function buildSegments(slots, totalUnitsU) {
  const occ = new Array(totalUnitsU + 1).fill(null);
  (slots || []).forEach((s) => {
    for (let u = s.startU + 1; u <= s.startU + s.sizeU; u++) {
      if (u >= 1 && u <= totalUnitsU) occ[u] = s;
    }
  });
  const segments = [];
  let u = totalUnitsU;
  while (u >= 1) {
    const slot = occ[u];
    if (slot) {
      let bottom = u;
      while (bottom - 1 >= 1 && occ[bottom - 1] === slot) bottom--;
      segments.push({ type: "device", slot, topU: u, bottomU: bottom, sizeU: u - bottom + 1 });
      u = bottom - 1;
    } else {
      let bottom = u;
      while (bottom - 1 >= 1 && !occ[bottom - 1]) bottom--;
      segments.push({ type: "empty", topU: u, bottomU: bottom, sizeU: u - bottom + 1 });
      u = bottom - 1;
    }
  }
  return segments;
}

function DeviceBlock({ slot, sizeU, face, rowPx, imageMinPx, onRemove }) {
  const [hover, setHover] = useState(false);
  const heightPx = sizeU * rowPx;
  const imageUrl = face === "front" ? slot.frontImageUrl : slot.backImageUrl;
  const showImage = imageUrl && heightPx >= imageMinPx;
  return (
    <Tooltip
      title={`${slot.deviceName || "Device"} · ${sizeU}U · U${slot.startU + 1}-U${slot.startU + slot.sizeU} · ${face === "front" ? "Front" : "Back"}`}
      placement="left"
    >
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          height: heightPx, position: "relative", overflow: "hidden",
          background: showImage ? `url(${imageUrl}) center/cover no-repeat` : PALETTE.accent + "22",
          borderBottom: `1px solid ${PALETTE.bg}`,
          cursor: "default",
        }}
      >
        {!showImage && heightPx >= 6 && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: heightPx >= 20 ? 9.5 : 8, color: PALETTE.text, fontWeight: 600,
            textAlign: "center", padding: "0 3px", lineHeight: 1.15, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {slot.deviceName || `${sizeU}U`}
          </div>
        )}
        {showImage && heightPx >= 34 && (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
            color: "#fff", fontSize: 9.5, padding: "2px 5px", fontWeight: 600,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {slot.deviceName}
          </div>
        )}
        {onRemove && hover && (
          <div
            onClick={() => onRemove(slot)}
            title="Remove device"
            style={{
              position: "absolute", top: 2, right: 2, width: 16, height: 16,
              borderRadius: 3, background: "rgba(239,68,68,0.9)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 10,
            }}
          >
            <CloseOutlined />
          </div>
        )}
      </div>
    </Tooltip>
  );
}

function EmptyRow({ u, availableUp, rowPx, library, onAdd, onAddLabel }) {
  const [open, setOpen] = useState(false);
  const [labelMode, setLabelMode] = useState(false);
  const [text, setText] = useState("");

  if (!onAdd && !onAddLabel) {
    return <div style={{ height: rowPx, borderBottom: `1px dashed ${PALETTE.border}` }} />;
  }

  if (labelMode) {
    const commit = () => {
      const trimmed = text.trim();
      if (trimmed) onAddLabel(u, availableUp, trimmed);
      setText("");
      setLabelMode(false);
    };
    return (
      <div style={{ height: rowPx, borderBottom: `1px dashed ${PALETTE.border}`, background: PALETTE.panelAlt }}>
        <input
          autoFocus
          value={text}
          placeholder={`Label for U${u}…`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") { setText(""); setLabelMode(false); }
          }}
          onBlur={commit}
          style={{
            width: "100%", height: "100%", border: "none", outline: "none", boxSizing: "border-box",
            background: "transparent", color: PALETTE.text, fontSize: Math.min(11, Math.max(8, rowPx - 4)),
            padding: "0 6px",
          }}
        />
      </div>
    );
  }

  const items = [
    ...(onAddLabel ? [
      {
        key: "__custom_label__",
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: 12, fontWeight: 500 }}>
            <TagOutlined style={{ color: PALETTE.accent }} />
            Type a custom label…
          </div>
        ),
      },
      { type: "divider" },
    ] : []),
    ...(onAdd ? library.map((dev) => ({
      key: dev.id,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
          <div style={{
            width: 28, height: 20, borderRadius: 3, overflow: "hidden", flexShrink: 0,
            background: `url(${dev.thumbnail}) center/cover no-repeat`, border: `1px solid ${PALETTE.border}`,
          }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{dev.name}</span>
            <span style={{ fontSize: 10.5, color: PALETTE.textSub }}>
              {dev.category} · {Math.min(dev.defaultSizeU, availableUp)}U
            </span>
          </div>
        </div>
      ),
      disabled: dev.defaultSizeU < 1,
    })) : []),
  ];
  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      menu={{
        items,
        onClick: ({ key }) => {
          if (key === "__custom_label__") { setLabelMode(true); setOpen(false); return; }
          const dev = library.find((d) => d.id === key);
          if (dev) onAdd(u, availableUp, dev);
          setOpen(false);
        },
      }}
    >
      <div
        title={`Add device at U${u}`}
        style={{
          height: rowPx, borderBottom: `1px dashed ${PALETTE.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: PALETTE.textSub, fontSize: 9,
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = PALETTE.panelAlt; e.currentTarget.style.color = PALETTE.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = PALETTE.textSub; }}
      >
        {rowPx >= 10 && <PlusOutlined style={{ fontSize: 9 }} />}
      </div>
    </Dropdown>
  );
}

export function ElevationColumn({
  face, totalUnitsU, slots, library, onAdd, onRemove, onAddLabel,
  rowPx = 16, imageMinPx = 28, width,
}) {
  const segments = useMemo(() => buildSegments(slots, totalUnitsU), [slots, totalUnitsU]);
  return (
    <div style={{
      border: `1px solid ${PALETTE.borderStrong}`, borderRadius: 6, overflow: "hidden",
      background: PALETTE.panel, width,
    }}>
      {segments.map((seg) => seg.type === "device" ? (
        <DeviceBlock key={seg.slot.id} slot={seg.slot} sizeU={seg.sizeU} face={face} rowPx={rowPx} imageMinPx={imageMinPx} onRemove={onRemove} />
      ) : (
        Array.from({ length: seg.sizeU }, (_, i) => seg.topU - i).map((u) => (
          <EmptyRow key={u} u={u} availableUp={u - seg.bottomU + 1} rowPx={rowPx} library={library} onAdd={onAdd} onAddLabel={onAddLabel} />
        ))
      ))}
    </div>
  );
}

// U-number ruler meant to sit flush beside an ElevationColumn built with the
// same totalUnitsU/rowPx, numbering top (highest U) to bottom (U1).
export function URuler({ totalUnitsU, rowPx = 16, align = "right" }) {
  const units = Array.from({ length: totalUnitsU }, (_, i) => totalUnitsU - i);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 16 }}>
      {units.map((u) => (
        <div key={u} style={{
          height: rowPx, fontSize: 7, lineHeight: `${rowPx}px`, color: PALETTE.textSub,
          fontFamily: "monospace", textAlign: align, paddingLeft: align === "left" ? 2 : 0,
          paddingRight: align === "right" ? 2 : 0,
        }}>
          {rowPx >= 8 ? u : (u % 5 === 0 ? u : "")}
        </div>
      ))}
    </div>
  );
}
