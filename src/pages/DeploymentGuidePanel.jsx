// ═══════════════════════════════════════════════════════════════════════════
// DeploymentGuidePanel.jsx
// ---------------------------------------------------------------------------
// The live "what do I place next" checklist for both delivery chains.
//
//   POWER    Transformer → Busway → Generator → MPP → PP → UPS → PDU → Rack
//   NETWORK  Internet/WAN → ISP Uplink → Core Router → Firewall →
//            Distribution Switch → Access Switch (ToR) → Server / Storage Rack
//
// Every stage shows one of four states:
//   ✓ green   placed, and its Tier III A/B pair is complete
//   ◐ amber   placed, but only one side — no redundancy, not yet Tier III
//   ! red     required and missing — everything downstream of it is unfed
//   ○ grey    optional and not placed
//
// The panel is read-only: it never blocks a placement, it only tells the
// planner what the chain still needs and in what order, which is exactly
// what was asked for.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from "react";
import { FloatingPanel } from "./Dcimintelligence";
import { CHAINS, fullGuide } from "../dcim/chains/deploymentChains";
import { deviceLabel, deviceLabelLong } from "../dcim/naming/deviceNaming";

const UI_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function stageState(s) {
  if (!s.satisfied) return s.optional ? "optional" : "missing";
  if (s.redundant && !s.redundancyMet) return "single";
  return "done";
}

const STATE_META = {
  done:     { glyph: "✓", label: "Complete",      key: "ok" },
  single:   { glyph: "◐", label: "No A/B pair",   key: "warn" },
  missing:  { glyph: "!", label: "Missing",       key: "critical" },
  optional: { glyph: "○", label: "Optional",      key: "muted" },
};

function ChainColumn({ T, chainKey, stages, onFocusDevice }) {
  const meta = CHAINS[chainKey];
  const [openKey, setOpenKey] = useState(null);

  const required = stages.filter((s) => !s.optional);
  const done = required.filter((s) => stageState(s) === "done").length;
  const nextUp = stages.find((s) => !s.optional && !s.satisfied)
    || stages.find((s) => !s.optional && !s.redundancyMet)
    || null;

  const color = (state) => ({
    ok: T.ok, warn: T.warn, critical: T.critical, muted: T.textMuted,
  }[STATE_META[state].key]);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* chain header + completion bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <span style={{
          width: 8, height: 8, borderRadius: 2, background: meta.color, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
          textTransform: "uppercase", color: T.textPrimary,
        }}>{meta.label} chain</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, fontFamily: MONO_FONT, color: T.textMuted }}>
          {done}/{required.length}
        </span>
      </div>
      <div style={{
        height: 4, borderRadius: 3, background: T.bgTertiary, overflow: "hidden", marginBottom: 8,
      }}>
        <div style={{
          height: "100%", width: `${(done / Math.max(1, required.length)) * 100}%`,
          background: meta.color, transition: "width .3s ease",
        }} />
      </div>

      {/* the ladder */}
      {stages.map((s, i) => {
        const state = stageState(s);
        const c = color(state);
        const isNext = nextUp && nextUp.key === s.key;
        const open = openKey === s.key;
        return (
          <div key={s.key}>
            <div
              onClick={() => setOpenKey(open ? null : s.key)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 7px",
                borderRadius: 6, cursor: "pointer",
                background: isNext ? `${meta.color}14` : open ? T.bgTertiary : "transparent",
                border: `1px solid ${isNext ? `${meta.color}55` : "transparent"}`,
              }}
            >
              {/* tier badge + connector */}
              <span style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${c}1f`, border: `1px solid ${c}66`, color: c,
                fontSize: 10, fontWeight: 700, fontFamily: MONO_FONT,
              }}>{STATE_META[state].glyph}</span>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: T.textPrimary, lineHeight: 1.3,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  <span style={{ color: T.textMuted, fontFamily: MONO_FONT, fontWeight: 500 }}>
                    T{s.tier}·
                  </span>{" "}
                  {s.label}
                </div>
                <div style={{ fontSize: 9.5, color: T.textMuted, fontFamily: MONO_FONT }}>
                  {s.count} placed
                  {s.redundant ? ` · needs A+B` : ""}
                  {s.optional ? " · optional" : ""}
                </div>
              </div>

              {isNext && (
                <span style={{
                  fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em",
                  color: meta.color, border: `1px solid ${meta.color}66`,
                  borderRadius: 4, padding: "1px 5px", flexShrink: 0,
                }}>NEXT</span>
              )}
            </div>

            {open && (
              <div style={{
                margin: "2px 0 6px 28px", padding: "6px 9px", borderRadius: 6,
                background: T.bgTertiary, border: `1px solid ${T.borderSubtle}`,
              }}>
                <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.5 }}>
                  {s.why}
                </div>
                {state === "single" && (
                  <div style={{ fontSize: 10.5, color: T.warn, marginTop: 4, lineHeight: 1.45 }}>
                    Only one side placed. Tier III wants a second one so this stage can be
                    taken down for maintenance without an outage.
                  </div>
                )}
                {state === "missing" && (
                  <div style={{ fontSize: 10.5, color: T.critical, marginTop: 4, lineHeight: 1.45 }}>
                    Nothing below tier {s.tier} in this chain is actually fed until this is placed.
                  </div>
                )}
                {s.devices?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {s.devices.slice(0, 12).map((d) => (
                      <button
                        key={d.id}
                        onClick={(e) => { e.stopPropagation(); onFocusDevice?.(d.id); }}
                        title={`${deviceLabelLong(d)} — click to fly the camera to it`}
                        style={{
                          fontSize: 9.5, fontFamily: MONO_FONT, padding: "2px 6px",
                          borderRadius: 4, cursor: "pointer",
                          border: `1px solid ${meta.color}44`, background: `${meta.color}12`,
                          color: T.textSecondary,
                        }}
                      >{deviceLabel(d)}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {i < stages.length - 1 && (
              <div style={{
                width: 1, height: 5, marginLeft: 17,
                background: state === "done" ? meta.color : T.borderSubtle,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DeploymentGuidePanel({ T, devices = [], onFocusDevice, onClose }) {
  const guide = useMemo(() => fullGuide(devices), [devices]);

  const [chain, setChain] = useState("network");
  const stages = chain === "both" ? null : guide[chain];

  const totalMissing =
    guide.power.filter((s) => !s.optional && !s.satisfied).length +
    guide.network.filter((s) => !s.optional && !s.satisfied).length;

  return (
    <FloatingPanel
      T={T}
      accent="#22d3ee"
      width={330}
      icon={<i className="fas fa-diagram-project" />}
      title="Deployment Guide"
      subtitle={totalMissing === 0
        ? "Both chains complete end to end"
        : `${totalMissing} required stage${totalMissing === 1 ? "" : "s"} still missing`}
      defaultPos={{ x: 16, y: 96 }}
      onClose={onClose}
    >
      {/* chain switcher */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 10, padding: 3,
        background: T.bgTertiary, borderRadius: 7, border: `1px solid ${T.borderSubtle}`,
      }}>
        {[
          { k: "network", label: "Network" },
          { k: "power", label: "Power" },
          { k: "both", label: "Both" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setChain(t.k)}
            style={{
              flex: 1, padding: "4px 0", borderRadius: 5, cursor: "pointer",
              border: "none", fontFamily: UI_FONT, fontSize: 10.5, fontWeight: 600,
              background: chain === t.k ? T.bgSecondary : "transparent",
              color: chain === t.k ? T.textPrimary : T.textMuted,
              boxShadow: chain === t.k ? T.shadow : "none",
            }}
          >{t.label}</button>
        ))}
      </div>

      {chain === "both" ? (
        <>
          <ChainColumn T={T} chainKey="network" stages={guide.network} onFocusDevice={onFocusDevice} />
          <ChainColumn T={T} chainKey="power" stages={guide.power} onFocusDevice={onFocusDevice} />
        </>
      ) : (
        <ChainColumn T={T} chainKey={chain} stages={stages} onFocusDevice={onFocusDevice} />
      )}

      {/* legend */}
      <div style={{
        marginTop: 4, paddingTop: 8, borderTop: `1px solid ${T.borderSubtle}`,
        display: "flex", flexWrap: "wrap", gap: "4px 10px",
      }}>
        {Object.entries(STATE_META).map(([k, m]) => (
          <span key={k} style={{
            fontSize: 9.5, color: T.textMuted, display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{
              color: { ok: T.ok, warn: T.warn, critical: T.critical, muted: T.textMuted }[m.key],
              fontFamily: MONO_FONT, fontWeight: 700,
            }}>{m.glyph}</span>
            {m.label}
          </span>
        ))}
      </div>
      <div style={{
        marginTop: 8, fontSize: 10, color: T.textMuted, lineHeight: 1.5,
      }}>
        Tap a stage for why it exists and what it feeds. Placing a device out of
        order is allowed — the toast just tells you what should have come first.
      </div>
    </FloatingPanel>
  );
}
