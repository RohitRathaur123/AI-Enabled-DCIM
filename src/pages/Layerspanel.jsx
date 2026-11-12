import React from "react";
import { Checkbox, Button } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";

// ── Layer definitions ─────────────────────────────────────────────────────
// key   -> matches the userData.layer tag set on 3D objects in the scene
// label -> shown in the panel
// icon  -> font-awesome class
// items -> the device/element types that belong to this layer (for the
//          descriptive subtitle only — actual filtering happens via the
//          userData.layer tag on the THREE objects themselves)
export const LAYER_DEFS = [
  { key: "power", label: "Power Layer", icon: "fa-bolt", color: "#f59e0b", items: ["UPS", "PDU", "Power Cable", "Busway", "Panel"] },
  { key: "network", label: "Network Layer", icon: "fa-network-wired", color: "#8b5cf6", items: ["Switch", "Router", "Patch Panel", "Fiber", "Ethernet Cable"] },
  { key: "cooling", label: "Cooling Layer", icon: "fa-snowflake", color: "#38bdf8", items: ["PAC Unit", "Perforated Tile", "Cold Aisle", "Airflow"] },
  { key: "cctv", label: "CCTV Layer", icon: "fa-video", color: "#64748b", items: ["Camera", "NVR"] },
  { key: "temperature", label: "Temperature Layer", icon: "fa-thermometer-half", color: "#ef4444", items: ["Temp Sensor", "Rack Temp"] },
  { key: "humidity", label: "Humidity Layer", icon: "fa-tint", color: "#0ea5e9", items: ["Humidity Sensor"] },
  { key: "fire", label: "Fire Layer", icon: "fa-fire", color: "#dc2626", items: ["Smoke Detector", "Suppression"] },
  { key: "asset", label: "Asset Layer", icon: "fa-server", color: "#3b82f6", items: ["Server Rack", "Compute"] },
  { key: "alarm", label: "Alarm Layer", icon: "fa-bell", color: "#eab308", items: ["Alarm Panel", "Siren"] },
];

export const DEFAULT_LAYER_STATE = LAYER_DEFS.reduce((acc, l) => {
  acc[l.key] = true;
  return acc;
}, {});

/**
 * Dropdown panel of layer checkboxes. Renders as a floating card anchored
 * under the "Layers" navbar button. Purely presentational — visibility
 * logic lives in the parent (it just flips booleans in `layers` state,
 * which a scene.traverse() effect reads to set object.visible).
 */
export default function LayersPanel({ open, layers, onChange, T, isDark }) {
  if (!open) return null;

  const toggle = (key) => onChange({ ...layers, [key]: !layers[key] });
  const allOn = LAYER_DEFS.every((l) => layers[l.key]);
  const setAll = (val) => {
    const next = {};
    LAYER_DEFS.forEach((l) => (next[l.key] = val));
    onChange(next);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 12,
        width: 260,
        background: T?.ctrlBg || "rgba(255,255,255,0.97)",
        border: `1px solid ${T?.ctrlBorder || "#e2e8f0"}`,
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        zIndex: 60,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${T?.ctrlBorder || "#e2e8f0"}`,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: T?.badgeText || "#1a3a5c" }}>
          <i className="fas fa-layer-group" style={{ marginRight: 6 }} />
          Layers
        </span>
        <Button size="small" type="link" style={{ padding: 0, fontSize: 11 }} onClick={() => setAll(!allOn)}>
          {allOn ? "Hide All" : "Show All"}
        </Button>
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto", padding: "6px 4px" }}>
        {LAYER_DEFS.map((l) => (
          <div
            key={l.key}
            onClick={() => toggle(l.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px",
              cursor: "pointer",
              borderRadius: 8,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Checkbox checked={!!layers[l.key]} onClick={(e) => e.stopPropagation()} onChange={() => toggle(l.key)} />
            <i className={`fas ${l.icon}`} style={{ color: l.color, width: 16, textAlign: "center", fontSize: 13 }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T?.badgeText || "#1a3a5c" }}>{l.label}</span>
              <span style={{ fontSize: 9.5, color: T?.badgeSub || "#64748b" }}>{l.items.join(" · ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Header toggle button — drop this next to the other navbar buttons
 * (Toolbox / Dark / Reset View / Bottom View) for identical alignment.
 */
export function LayersButton({ open, onClick, T }) {
  return (
    <Button
      icon={<BgColorsOutlined />}
      onClick={onClick}
      style={{
        background: open ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.3)",
        color: T?.headerColor || "#fff",
        borderRadius: 8,
      }}
      size="small"
    >
      Layers
    </Button>
  );
}