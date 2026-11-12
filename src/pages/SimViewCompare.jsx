// ═══════════════════════════════════════════════════════════════════════════
// SimViewCompare.jsx — 5D View "Compare views"
// ---------------------------------------------------------------------------
// Capture the floor as it is right now — the normal view, or a simulation
// with devices failed — as many times as you like. Then pick any two of the
// captures in the View 1 and View 2 dropdowns: only those two are compared —
// how many devices are affected in each (failed, taken down with them,
// degraded), what changed between them, and the difference in TIME and COST.
//
// Everything is read from the same impact report the Failure Impact Tracker
// shows (dcimIntelligence.js); nothing here changes the simulation.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from "react";
import { diffSnapshots, formatCurrency, formatDuration, formatClock, ROLE_META } from "./Dcimintelligence";

const UI_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Estimated time to restore one failed device, by what it is (hours). Crews
// work in parallel, so a view's restore time is its slowest repair.
export const RESTORE_HOURS = { power: 4, cooling: 3, network: 1.5, load: 2, safety: 1, aux: 1 };
const ROLE_ORDER = ["power", "cooling", "network", "load", "safety", "aux"];

/** Freeze what the floor looks like right now into a comparable snapshot. */
export function buildViewSnapshot({ report, failures, simSeconds, image, index }) {
  const failedIds = Object.keys(failures || {});
  const devStates = report?.devices || new Map();
  const deviceMeta = {};
  const down = [];
  const degraded = [];
  const downByRole = {};
  devStates.forEach((s, id) => {
    if (failures?.[id]) deviceMeta[id] = { name: s.name, category: s.category, roomName: s.roomName, role: s.role };
    if (s.severity === "critical") {
      down.push({ id, name: s.name, role: s.role, roomName: s.roomName, failed: !!failures?.[id] });
      downByRole[s.role] = (downByRole[s.role] || 0) + 1;
    } else if (s.severity === "degraded") {
      degraded.push({ id, name: s.name, role: s.role, roomName: s.roomName });
    }
  });
  const restoreHours = failedIds.reduce((m, id) => Math.max(m, RESTORE_HOURS[deviceMeta[id]?.role] || 1), 0);
  const burn = report?.totals?.burnPerHour || 0;
  const total = report?.totals?.total || 0;
  const rooms = (report?.rooms || []).map((r) => ({
    id: r.id, name: r.name, tempC: r.tempC, bandLabel: r.band.label, bandColor: r.band.color,
    loadCount: r.loadCount, coolerCount: r.coolerCount, failedCoolerCount: r.failedCoolerCount,
    secondsToShutdown: r.secondsToShutdown,
  }));
  const shutdownIn = rooms.reduce((m, r) => Math.min(m, r.secondsToShutdown), Infinity);
  const hottest = rooms.reduce((a, b) => (!a || b.tempC > a.tempC ? b : a), null);
  return {
    id: `${Date.now()}-${index}`,
    label: `View ${index}`,
    kind: failedIds.length ? "Simulation" : "Normal",
    takenAt: new Date(),
    image,
    simSeconds,
    failures: { ...(failures || {}) },
    deviceMeta,
    incidents: (report?.incidents || []).map((i) => ({
      id: i.id, name: i.name, role: i.role, roomName: i.roomName, cascadeCount: i.cascadeCount,
      cascadeIds: i.cascadeIds, directCost: i.directCost, blastCost: i.blastCost, durationSec: i.durationSec,
    })),
    rooms,
    counts: { ...(report?.counts || { ok: 0, degraded: 0, down: 0, failed: 0, total: 0 }) },
    totals: { ...(report?.totals || {}) },
    down, degraded, downByRole,
    downtimeSec: (report?.incidents || []).reduce((m, i) => Math.max(m, i.durationSec), 0),
    restoreSec: restoreHours * 3600,
    costToRestore: total + burn * restoreHours,
    shutdownIn,
    hottest,
    availability: report?.counts?.total ? (report.counts.ok / report.counts.total) * 100 : 100,
  };
}

/** How many devices a capture shows affected: failed, taken down with them, degraded. */
export function affectedOf(s) {
  const failed = s.down.filter((d) => d.failed).length;
  const down = s.down.length;
  const degraded = s.degraded.length;
  const byRole = {};
  [...s.down, ...s.degraded].forEach((d) => { byRole[d.role] = (byRole[d.role] || 0) + 1; });
  const rooms = new Set([...s.down, ...s.degraded].map((d) => d.roomName).filter(Boolean));
  return { failed, cascade: Math.max(0, down - failed), down, degraded, total: down + degraded, byRole, rooms: rooms.size };
}

// ── small pieces ───────────────────────────────────────────────────────────
const signed = (n, fmt) => (Math.abs(n) < 1e-9 ? "no change" : `${n > 0 ? "+" : "−"}${fmt(Math.abs(n))}`);
const deltaColor = (T, n, goodWhenDown = true) =>
  Math.abs(n) < 1e-9 ? T.textMuted : (n > 0) === goodWhenDown ? T.critical : T.ok;

function Badge({ color, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, color, background: `${color}1f`, border: `1px solid ${color}55`, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Thumb({ T, snap, height, onOpen }) {
  return snap.image ? (
    <button onClick={onOpen} title="Show larger" style={{ display: "block", width: "100%", height, padding: 0, border: "none", cursor: "zoom-in", background: T.bgPrimary }}>
      <img src={snap.image} alt={snap.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </button>
  ) : (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 11, background: T.bgPrimary }}>no image</div>
  );
}

// One capture in the left rail.
function ViewCard({ T, snap, slot, onRemove, onOpen }) {
  const a = affectedOf(snap);
  const color = snap.kind === "Normal" ? T.ok : T.critical;
  return (
    <div style={{
      flexShrink: 0,
      border: `1px solid ${slot ? T.accent : T.borderSubtle}`, borderRadius: 10, overflow: "hidden",
      background: T.bgTertiary, boxShadow: slot ? `0 0 0 2px ${T.accent}44` : "none",
    }}>
      <div style={{ position: "relative" }}>
        <Thumb T={T} snap={snap} height={88} onOpen={onOpen} />
        <span style={{ position: "absolute", left: 6, top: 6, pointerEvents: "none" }}><Badge color={color}>{snap.kind}</Badge></span>
        {slot && (
          <span style={{
            position: "absolute", right: 6, top: 6, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800,
            background: T.accent, color: "#06121f", pointerEvents: "none",
          }}>{slot}</span>
        )}
      </div>
      <div style={{ padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <b style={{ color: T.textPrimary, fontSize: 13 }}>{snap.label}</b>
            <span style={{ color: T.textMuted, fontSize: 10.5, fontFamily: MONO_FONT }}>T+{formatClock(snap.simSeconds)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: a.total ? T.critical : T.ok, fontFamily: MONO_FONT }}>{a.total}</span>
            <span style={{ fontSize: 11.5, color: T.textSecondary }}>affected · {a.down} down · {formatCurrency(snap.totals.total || 0)}</span>
          </div>
        </div>
        <button onClick={onRemove} title="Delete this capture" aria-label={`Delete ${snap.label}`} style={{
          padding: "4px 8px", borderRadius: 7, cursor: "pointer", fontSize: 11, flexShrink: 0,
          border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textMuted,
        }}>✕</button>
      </div>
    </div>
  );
}

function ChipGroup({ T, title, color, items, outline }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 18);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 5 }}>{title} ({items.length})</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {shown.map((d) => (
          <span key={d.id} title={`${d.name}${d.roomName ? ` · ${d.roomName}` : ""} · ${ROLE_META[d.role]?.label || d.role}`} style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            color: T.textPrimary, background: outline ? "transparent" : `${color}1a`, border: `1px solid ${color}66`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: ROLE_META[d.role]?.color || color }} />{d.name}
          </span>
        ))}
        {items.length > 18 && (
          <button onClick={() => setAll((x) => !x)} style={{ border: "none", background: "transparent", color: T.accent, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
            {all ? "show less" : `+${items.length - 18} more`}
          </button>
        )}
      </div>
    </div>
  );
}

function AffectedList({ T, snap, a }) {
  const failed = snap.down.filter((d) => d.failed);
  const cascade = snap.down.filter((d) => !d.failed);
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${T.borderDefault}`, background: T.bgTertiary, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <b style={{ fontSize: 13, color: T.textPrimary }}>{snap.label}</b>
        <Badge color={snap.kind === "Normal" ? T.ok : T.critical}>{snap.kind}</Badge>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: MONO_FONT, color: a.total ? T.critical : T.ok }}>{a.total}</span>
        <span style={{ fontSize: 11.5, color: T.textSecondary }}>affected</span>
      </div>
      {a.total === 0 && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Normal operation — no device affected.</div>}
      <ChipGroup T={T} title="Failed (injected)" color={T.critical} items={failed} />
      <ChipGroup T={T} title="Went down with them" color="#f97316" items={cascade} />
      <ChipGroup T={T} title="Degraded" color={T.warn} items={snap.degraded} outline />
    </div>
  );
}

function BigDelta({ T, title, icon, rows, accent }) {
  return (
    <div style={{
      flex: 1, minWidth: 220, borderRadius: 12, padding: "12px 14px",
      background: `linear-gradient(135deg, ${accent}1c, ${T.bgTertiary})`, border: `1px solid ${accent}55`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: accent, letterSpacing: ".04em", textTransform: "uppercase" }}>{title}</span>
      </div>
      {rows.map(([label, value, color]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "3px 0" }}>
          <span style={{ fontSize: 12, color: T.textSecondary }}>{label}</span>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: MONO_FONT, color: color || T.textPrimary, whiteSpace: "nowrap" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── two views in detail ────────────────────────────────────────────────────
function Comparison({ T, A, B, onOpen }) {
  const diff = useMemo(() => diffSnapshots(A, B), [A, B]);
  const aA = affectedOf(A), aB = affectedOf(B);
  const dt = B.simSeconds - A.simSeconds;
  const dCost = (B.totals.total || 0) - (A.totals.total || 0);
  const dBurn = (B.totals.burnPerHour || 0) - (A.totals.burnPerHour || 0);
  const dRestore = B.restoreSec - A.restoreSec;
  const dDowntime = B.downtimeSec - A.downtimeSec;
  const dToRestore = B.costToRestore - A.costToRestore;
  const dAffected = aB.total - aA.total;
  const dDown = aB.down - aA.down;
  const dDeg = aB.degraded - aA.degraded;
  const dAvail = B.availability - A.availability;
  const dHot = (B.hottest?.tempC ?? 0) - (A.hottest?.tempC ?? 0);

  const aDown = new Set(A.down.map((d) => d.id));
  const bDown = new Set(B.down.map((d) => d.id));
  const newlyDown = B.down.filter((d) => !aDown.has(d.id));
  const backUp = A.down.filter((d) => !bDown.has(d.id));

  const headline = (() => {
    if (!aA.total && !aB.total) return "Both captures show the floor running normally — no device is affected in either view.";
    const parts = [`devices affected ${aA.total} → ${aB.total}`];
    if (newlyDown.length) parts.push(`${newlyDown.length} device${newlyDown.length === 1 ? "" : "s"} down in View 2 that ${newlyDown.length === 1 ? "was" : "were"} up in View 1`);
    if (backUp.length) parts.push(`${backUp.length} back up`);
    if (Math.abs(dCost) > 0.005) parts.push(`${dCost > 0 ? "+" : "−"}${formatCurrency(Math.abs(dCost))} cost of failure`);
    if (Math.abs(dRestore) > 0) parts.push(`${dRestore > 0 ? "+" : "−"}${formatDuration(Math.abs(dRestore))} to restore`);
    return `${parts.join(" · ")}.`;
  })();

  const metricRows = [
    ["Devices affected (down + degraded)", aA.total, aB.total, (n) => String(n), true],
    ["Failed (injected)", aA.failed, aB.failed, (n) => String(n), true],
    ["Went down with them", aA.cascade, aB.cascade, (n) => String(n), true],
    ["Devices degraded", aA.degraded, aB.degraded, (n) => String(n), true],
    ["Rooms affected", aA.rooms, aB.rooms, (n) => String(n), true],
    ["Availability", A.availability, B.availability, (n) => `${n.toFixed(1)}%`, false],
    ["Hottest room", A.hottest?.tempC ?? 0, B.hottest?.tempC ?? 0, (n) => `${n.toFixed(1)} °C`, true],
    ["Simulated time (T+)", A.simSeconds, B.simSeconds, (n) => formatClock(n), true],
    ["Longest outage so far", A.downtimeSec, B.downtimeSec, (n) => formatDuration(n), true],
    ["Est. time to restore", A.restoreSec, B.restoreSec, (n) => (n ? formatDuration(n) : "—"), true],
    ["Cost of failure so far", A.totals.total || 0, B.totals.total || 0, formatCurrency, true],
    ["Burn rate / hr", A.totals.burnPerHour || 0, B.totals.burnPerHour || 0, formatCurrency, true],
    ["Projected +1 hr", A.totals.projected1h || 0, B.totals.projected1h || 0, formatCurrency, true],
    ["Projected +4 hr", A.totals.projected4h || 0, B.totals.projected4h || 0, formatCurrency, true],
    ["Est. cost when restored", A.costToRestore, B.costToRestore, formatCurrency, true],
  ];

  const cell = { padding: "7px 10px", borderBottom: `1px solid ${T.borderSubtle}`, fontSize: 12.5 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* side-by-side images */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["VIEW 1", A, aA], ["VIEW 2", B, aB]].map(([tag, s, a]) => (
          <div key={tag} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderDefault}`, background: T.bgPrimary }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.bgTertiary }}>
              <b style={{ color: T.accent, fontSize: 12.5, letterSpacing: ".06em" }}>{tag}</b>
              <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 700 }}>{s.label}</span>
              <Badge color={s.kind === "Normal" ? T.ok : T.critical}>{s.kind}</Badge>
              <span style={{ flex: 1 }} />
              <span style={{ color: T.textMuted, fontSize: 11, fontFamily: MONO_FONT }}>
                {s.takenAt.toLocaleTimeString()} · T+{formatClock(s.simSeconds)}
              </span>
            </div>
            <div style={{ aspectRatio: "16 / 9" }}><Thumb T={T} snap={s} height="100%" onOpen={() => onOpen(s)} /></div>
            <div style={{ padding: "8px 12px", fontSize: 12, color: T.textSecondary, minHeight: 34 }}>
              <b style={{ color: a.total ? T.critical : T.ok }}>{a.total} affected</b>
              {" · "}{a.failed} failed · {a.cascade} went down with them · {a.degraded} degraded
              {Object.keys(s.failures).length > 0 && <div style={{ marginTop: 2 }}>Failed: {Object.keys(s.failures).map((id) => s.deviceMeta[id]?.name || id).join(", ")}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* headline */}
      <div style={{
        padding: "11px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45,
        background: `${T.accent}14`, border: `1px solid ${T.accent}44`, color: T.textPrimary,
      }}>
        <span style={{ color: T.accent, fontWeight: 800 }}>Major difference: </span>{headline}
      </div>

      {/* devices / time / cost */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <BigDelta T={T} title="Devices affected" icon="🛡" accent={T.critical} rows={[
          ["Total affected", signed(dAffected, String), deltaColor(T, dAffected)],
          ["Devices down", signed(dDown, String), deltaColor(T, dDown)],
          ["Devices degraded", signed(dDeg, String), deltaColor(T, dDeg)],
          ["Availability", signed(dAvail, (n) => `${n.toFixed(1)} pts`), deltaColor(T, dAvail, false)],
          ["Hottest room", signed(dHot, (n) => `${n.toFixed(1)} °C`), deltaColor(T, dHot)],
        ]} />
        <BigDelta T={T} title="Time difference" icon="⏱" accent={T.violet || "#a855f7"} rows={[
          ["Between captures (sim time)", signed(dt, formatDuration), T.textPrimary],
          ["Longest outage", signed(dDowntime, formatDuration), deltaColor(T, dDowntime)],
          ["Est. time to restore", signed(dRestore, formatDuration), deltaColor(T, dRestore)],
          ["Thermal shutdown in", Number.isFinite(B.shutdownIn) ? formatDuration(B.shutdownIn) : "never (View 2)", Number.isFinite(B.shutdownIn) ? T.critical : T.ok],
        ]} />
        <BigDelta T={T} title="Cost difference" icon="💰" accent={T.warn} rows={[
          ["Cost of failure so far", signed(dCost, formatCurrency), deltaColor(T, dCost)],
          ["Burn rate / hr", signed(dBurn, formatCurrency), deltaColor(T, dBurn)],
          ["Projected +4 hr", signed((B.totals.projected4h || 0) - (A.totals.projected4h || 0), formatCurrency), deltaColor(T, (B.totals.projected4h || 0) - (A.totals.projected4h || 0))],
          ["Est. cost when restored", signed(dToRestore, formatCurrency), deltaColor(T, dToRestore)],
        ]} />
      </div>

      {/* which devices are affected in each view */}
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: T.textPrimary, marginBottom: 8 }}>Affected devices</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AffectedList T={T} snap={A} a={aA} />
          <AffectedList T={T} snap={B} a={aB} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
        {/* metric table */}
        <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderDefault}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: T.textPrimary }}>
            <thead>
              <tr style={{ background: T.bgTertiary }}>
                {["Metric", "View 1", "View 2", "Difference"].map((h, i) => (
                  <th key={h} style={{ ...cell, textAlign: i ? "right" : "left", fontSize: 11, color: T.textSecondary, letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map(([label, a, b, fmt, badWhenUp], ri) => {
                const d = b - a;
                return (
                  <tr key={label} style={ri === 0 ? { background: `${T.critical}0d` } : undefined}>
                    <td style={{ ...cell, color: ri === 0 ? T.textPrimary : T.textSecondary, fontWeight: ri === 0 ? 800 : 400 }}>{label}</td>
                    <td style={{ ...cell, textAlign: "right", fontFamily: MONO_FONT }}>{fmt(a)}</td>
                    <td style={{ ...cell, textAlign: "right", fontFamily: MONO_FONT }}>{fmt(b)}</td>
                    <td style={{ ...cell, textAlign: "right", fontFamily: MONO_FONT, fontWeight: 800, color: deltaColor(T, d, badWhenUp) }}>
                      {Math.abs(d) < 1e-9 ? "—" : `${d > 0 ? "+" : "−"}${fmt(Math.abs(d))}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* what changed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.borderDefault}`, padding: "10px 12px", background: T.bgTertiary }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary, marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>What changed</div>
            {diff.changes.length === 0 && <div style={{ fontSize: 12.5, color: T.textMuted }}>No differences — both views show the same state.</div>}
            {diff.changes.map((c, i) => {
              const color = {
                failure: T.critical, availability_down: T.critical, thermal_up: T.warn, cost_up: T.warn,
                recovery: T.ok, availability_up: T.ok, thermal_down: T.ok, cost_down: T.ok,
              }[c.kind] || T.warn;
              return (
                <div key={i} style={{ padding: "7px 0", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                    <b style={{ fontSize: 12.5, color: T.textPrimary }}>{c.label}</b>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{c.sub}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2, paddingLeft: 14 }}>
                    <span style={{ fontFamily: MONO_FONT }}>{c.from}</span> → <span style={{ fontFamily: MONO_FONT, color }}>{c.to}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textMuted, paddingLeft: 14 }}>{c.detail}</div>
                </div>
              );
            })}
          </div>
          {(newlyDown.length > 0 || backUp.length > 0) && (
            <div style={{ borderRadius: 12, border: `1px solid ${T.borderDefault}`, padding: "10px 12px", background: T.bgTertiary }}>
              {newlyDown.length > 0 && <ChipGroup T={T} title="Down in View 2" color={T.critical} items={newlyDown} />}
              {backUp.length > 0 && <ChipGroup T={T} title="Back up in View 2" color={T.ok} items={backUp} />}
            </div>
          )}
          <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
            Restore time is an estimate: {ROLE_ORDER.map((r) => `${ROLE_META[r]?.label || r} ${RESTORE_HOURS[r]} h`).join(" · ")} — repairs run in parallel,
            so a view needs as long as its slowest repair. Costs use the Failure Impact Tracker's cost model.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── the panel ──────────────────────────────────────────────────────────────
export default function SimViewComparePanel({ T, captures, onCapture, onRemove, onClear, onClose, liveSummary }) {
  // The two captures being compared — chosen by the user in the dropdowns.
  const [pair, setPair] = useState({ a: null, b: null });
  const [zoom, setZoom] = useState(null);
  // Minimised to a small bar so the floor stays usable between captures.
  const [mini, setMini] = useState(false);

  // A deleted capture leaves its dropdown empty; nothing is picked automatically.
  useEffect(() => {
    setPair((p) => {
      const ids = new Set(captures.map((c) => c.id));
      const a = ids.has(p.a) ? p.a : null;
      const b = ids.has(p.b) ? p.b : null;
      return a === p.a && b === p.b ? p : { a, b };
    });
  }, [captures]);

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setZoom(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const A = captures.find((c) => c.id === pair.a);
  const B = captures.find((c) => c.id === pair.b);

  if (mini) {
    return (
      <div style={{
        // bottom centre: the ticket toasts own the bottom-right corner
        position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 76, zIndex: 95, display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px", borderRadius: 12, background: T.bgSecondary, border: `1px solid ${T.accent}66`,
        boxShadow: T.shadow, fontFamily: UI_FONT,
      }}>
        <span style={{ fontSize: 18 }}>🆚</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.textPrimary }}>Compare views</span>
        <span style={{ fontSize: 11.5, color: T.textSecondary }}>{captures.length} captured</span>
        <button onClick={onCapture} style={{
          padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 12,
          color: "#fff", background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
        }}>📸 Capture</button>
        <button onClick={() => setMini(false)} style={{
          padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
          border: `1px solid ${T.accent}`, background: `${T.accent}1a`, color: T.accent,
        }}>{captures.length >= 2 ? "Compare ▴" : "Open ▴"}</button>
        <button onClick={onClose} title="Close" aria-label="Close compare views" style={{
          width: 28, height: 28, borderRadius: 7, cursor: "pointer", fontSize: 15,
          border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textSecondary,
        }}>×</button>
      </div>
    );
  }

  // One dropdown per side; the capture picked on the other side is greyed out.
  const picker = (slot, label, value, other) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 260px", minWidth: 0 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: T.accent, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</span>
      <select
        value={value || ""}
        onChange={(e) => setPair((p) => ({ ...p, [slot]: e.target.value || null }))}
        style={{
          width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
          border: `1px solid ${value ? T.accent : T.borderDefault}`, background: T.bgTertiary, color: T.textPrimary,
        }}
      >
        <option value="">Select a view…</option>
        {captures.map((c) => (
          <option key={c.id} value={c.id} disabled={c.id === other}>
            {c.label} · {c.kind} · T+{formatClock(c.simSeconds)} · {affectedOf(c).total} devices affected
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div style={{
      position: "fixed", top: 66, left: 16, right: 16, bottom: 16, zIndex: 95,
      display: "flex", flexDirection: "column", overflow: "hidden",
      background: T.bgSecondary, border: `1px solid ${T.borderDefault}`, borderRadius: 14,
      boxShadow: T.shadow, fontFamily: UI_FONT,
    }}>
      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
        background: `linear-gradient(90deg, ${T.accent}22, ${T.violet || "#a855f7"}18, transparent)`,
        borderBottom: `1px solid ${T.borderDefault}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>🆚</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>Simulation View Comparison</div>
          <div style={{ fontSize: 12, color: T.textSecondary }}>
            Capture as many views as you like, then choose any two to compare: devices affected, what changed, time and cost.
            {liveSummary ? <span style={{ color: T.accent }}> Now: {liveSummary}</span> : null}
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <button onClick={onCapture} style={{
          padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13,
          color: "#fff", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", boxShadow: "0 6px 18px rgba(99,102,241,.35)", whiteSpace: "nowrap",
        }}>📸 Capture current view</button>
        <button onClick={() => setMini(true)} title="Minimise the panel and keep simulating. You can still capture views from the compact bar." style={{
          padding: "8px 12px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12,
          border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textSecondary, whiteSpace: "nowrap",
        }}>▾ Minimise</button>
        {captures.length > 0 && (
          <button onClick={onClear} style={{
            padding: "8px 12px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12,
            border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textSecondary, whiteSpace: "nowrap",
          }}>Clear all</button>
        )}
        <button onClick={onClose} title="Close" aria-label="Close compare views" style={{
          width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 18,
          border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textSecondary,
        }}>×</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)" }}>
        {/* captures */}
        <div style={{ borderRight: `1px solid ${T.borderDefault}`, padding: 12, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: T.textSecondary, letterSpacing: ".08em" }}>CAPTURED VIEWS ({captures.length})</div>
          {captures.length === 0 && (
            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
              Nothing captured yet. Press <b style={{ color: T.textPrimary }}>Capture current view</b>.
            </div>
          )}
          {captures.map((c) => (
            <ViewCard key={c.id} T={T} snap={c}
              slot={c.id === pair.a ? "View 1" : c.id === pair.b ? "View 2" : null}
              onRemove={() => onRemove(c.id)} onOpen={() => setZoom(c)} />
          ))}
        </div>

        {/* comparison */}
        <div style={{ overflowY: "auto", padding: 16, minWidth: 0 }}>
          {captures.length === 0 ? (
            <div style={{ maxWidth: 660, margin: "40px auto", color: T.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, marginBottom: 10 }}>How to compare</div>
              {[
                ["1", "Capture the floor in its current state (the normal view)."],
                ["2", "Turn on SIMULATE and click a device to fail it. The cascade is shown on the floor."],
                ["3", "Capture again as often as you like — after each failure, or as the simulation clock runs."],
                ["4", "Choose any two captures in the View 1 and View 2 dropdowns. Only those two are compared."],
              ].map(([n, t]) => (
                <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${T.accent}22`, color: T.accent, fontWeight: 800, fontSize: 13,
                  }}>{n}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap", marginBottom: 14,
                padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.borderDefault}`, background: T.bgTertiary,
              }}>
                {picker("a", "View 1", pair.a, pair.b)}
                <button onClick={() => setPair((p) => ({ a: p.b, b: p.a }))} disabled={!pair.a && !pair.b}
                  title="Swap View 1 and View 2" aria-label="Swap View 1 and View 2" style={{
                    height: 38, padding: "0 12px", borderRadius: 9, cursor: "pointer", fontWeight: 800, fontSize: 15,
                    border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textSecondary,
                  }}>⇄</button>
                {picker("b", "View 2", pair.b, pair.a)}
              </div>
              {A && B ? (
                <Comparison T={T} A={A} B={B} onOpen={setZoom} />
              ) : (
                <div style={{ maxWidth: 620, margin: "36px auto", textAlign: "center", color: T.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
                  <div style={{ fontSize: 34 }}>🆚</div>
                  {captures.length < 2
                    ? <>One view captured. Capture at least one more view, then choose the two views to compare.</>
                    : <>Choose <b style={{ color: T.textPrimary }}>View 1</b> and <b style={{ color: T.textPrimary }}>View 2</b> from the dropdowns above. Only the two views you choose are compared.</>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* larger image */}
      {zoom && (
        <div onClick={() => setZoom(null)} style={{ position: "absolute", inset: 0, zIndex: 3, background: "rgba(2,6,23,.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <div role="dialog" aria-label={`${zoom.label} image`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "92%", maxHeight: "100%", background: T.bgSecondary, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderDefault}`, cursor: "default" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
              <b style={{ color: T.textPrimary }}>{zoom.label}</b>
              <Badge color={zoom.kind === "Normal" ? T.ok : T.critical}>{zoom.kind}</Badge>
              <span style={{ fontSize: 11.5, color: T.textMuted, fontFamily: MONO_FONT }}>T+{formatClock(zoom.simSeconds)} · {affectedOf(zoom).total} devices affected</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => setZoom(null)} aria-label="Close image" style={{ border: `1px solid ${T.borderDefault}`, background: "transparent", color: T.textSecondary, borderRadius: 7, width: 28, height: 28, cursor: "pointer" }}>×</button>
            </div>
            {zoom.image && <img src={zoom.image} alt={zoom.label} style={{ display: "block", maxWidth: "100%", maxHeight: "calc(100vh - 220px)" }} />}
          </div>
        </div>
      )}
    </div>
  );
}
