// DiscoveryTool.jsx — sidebar ▸ Discovery Tool (route /discovery-tool)
// Front end for the protocol discovery flow (static demo data)
// (Discovery_API_Frontend_Guide.md, v1.1):
//   Device list → Probe → Slave scan (Modbus only) → Read points → Bind → Verify
// plus the service's other endpoints: register profiles, gateway restart and
// registry, OID lookup, and service / Device Management DB health.
// Every call goes through src/api/discoveryApi.js. On each screen the next
// button follows the response's `next_step`, and the port / unit ID / community
// that Device Management already holds are passed on to read and bind as they
// are — they are only asked for when the database has no value.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AutoComplete, Button, Checkbox, Input, InputNumber, Modal, Progress, Radio, Select, Spin, Switch, Table, Tag, Tooltip } from "antd";
import {
  ApiOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled,
  DeleteOutlined, DownOutlined, ExclamationCircleFilled, InfoCircleOutlined, LockOutlined,
  PlusOutlined, PoweroffOutlined, ReloadOutlined, SearchOutlined, StarFilled, StopOutlined, UpOutlined, WarningFilled,
} from "@ant-design/icons";
import { discoveryApi } from "../api/discoveryApi";
// The service writes its messages in Hinglish; these build the English text the page shows instead.
import {
  bindMessage, dbMessage, pointDescription, pointError, probeNote, probeSummary, profilesNote, readNotes, readWarnings,
  removeMessage, restartMessage, scanBlockMessage, scanFoundDetail, scanFoundNote, schemaNote, targetMessage, toEnglish, verifyMessage,
} from "../api/discoveryText";

// ── look ────────────────────────────────────────────────────────────────────
const C = {
  navy: "#0b3d79", blue: "#1565c0", blueLight: "#e8f1fc", border: "#dbe3ee", text: "#13233d",
  sub: "#5b6b82", green: "#16a34a", greenBg: "#e9f8ef", amber: "#d97706", amberBg: "#fff7e6",
  red: "#dc2626", redBg: "#fdecec", violet: "#7c3aed", violetBg: "#f3edff", teal: "#0d9488",
};
const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";

const PROTO = {
  snmp: { label: "SNMP", color: "#0d9488", bg: "#e6f7f5", port: 161 },
  modbus: { label: "Modbus", color: "#1565c0", bg: "#e8f1fc", port: 502 },
  bacnet: { label: "BACnet", color: "#7c3aed", bg: "#f3edff", port: 47808 },
};
const STATUS = {
  pending: { label: "Pending", color: "#d97706", bg: "#fff4e0", dot: "#f59e0b" },
  discovered: { label: "Discovered", color: "#16a34a", bg: "#e9f8ef", dot: "#22c55e" },
  onboarded: { label: "Onboarded", color: "#0d9488", bg: "#e6f7f5", dot: "#14b8a6" },
  failed: { label: "Failed", color: "#dc2626", bg: "#fdecec", dot: "#ef4444" },
  needs_profile: { label: "Needs profile", color: "#7c3aed", bg: "#f3edff", dot: "#8b5cf6" },
};
const STEPS = [
  { key: "list", label: "Device List" },
  { key: "probe", label: "Probe" },
  { key: "scan", label: "Slave Scan" },
  { key: "points", label: "Read Points" },
  { key: "bind", label: "Bind" },
  { key: "verify", label: "Verify" },
];
const CACHE_MS = 15 * 60 * 1000; // the service keeps a read result cached for 15 minutes
const PROBE_STATUS = {
  responding: { label: "Responding", color: C.green, bg: C.greenBg },
  no_response: { label: "No response", color: C.sub, bg: "#f1f5f9" },
  timeout: { label: "Timeout", color: C.amber, bg: C.amberBg },
  error: { label: "Error", color: C.red, bg: C.redBg },
};
const GROUPS = [
  { key: "measurement", label: "Measurements", hint: "Live readings such as voltage, current, energy and temperature. Ticked by default." },
  { key: "info", label: "Info", hint: "Device identity such as sysDescr, sysName and model. Shown, but not ticked." },
  { key: "other", label: "Other", hint: "Network counters, file and calendar objects and similar." },
];
const SOURCE_BADGE = {
  profile: { label: "Verified profile", color: C.green, bg: C.greenBg },
  mib: { label: "MIB", color: C.green, bg: C.greenBg },
  self_describing: { label: "Self-describing", color: C.green, bg: C.greenBg },
  inferred: { label: "Inferred — engineer must confirm", color: C.amber, bg: C.amberBg },
  raw: { label: "Raw registers only", color: C.amber, bg: C.amberBg },
};
const CONF_COLOR = { confirmed: "green", high: "blue", medium: "gold", low: "red" };
const CAT_COLOR = { voltage: "blue", current: "cyan", power: "geekblue", energy: "purple", temperature: "volcano", humidity: "green", frequency: "magenta", status: "gold" };
const BANNER = {
  info: [C.blueLight, C.blue, "#c9dcf5"],
  success: [C.greenBg, C.green, "#b7e4c7"],
  warn: [C.amberBg, C.amber, "#f7d9a8"],
  error: [C.redBg, C.red, "#f5c2c2"],
};
const DEFAULT_PROBE_FORM = { check: "all", community: "public", modbus_port: 502, snmp_timeout: 12, bacnet_timeout: 8 };

// ── helpers ─────────────────────────────────────────────────────────────────
const has = (v) => v !== null && v !== undefined && v !== "";
const show = (v) => (has(v) ? String(v) : "—");
const isIp = (v) => /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(String(v || "").trim());
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || lo));
const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const fmtValue = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(4)));
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};
const protoLabel = (p) => PROTO[p]?.label || (p ? String(p).toUpperCase() : "—");
const mono = (v) => <span style={{ fontFamily: MONO, fontSize: 12.5 }}>{show(v)}</span>;
// One level of nesting is spread into rows (the OID lookup returns { oid, meta: { mib_name, unit, … } }).
const flatRows = (obj) => {
  const rows = [];
  const seen = new Set();
  const add = (label, v) => { const l = seen.has(label) ? `${label} (${rows.length})` : label; seen.add(l); rows.push([l, v]); };
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v && typeof v === "object" && !Array.isArray(v)) Object.entries(v).forEach(([k2, v2]) => add(seen.has(k2) ? `${k}.${k2}` : k2, v2));
    else add(k, v);
  });
  return rows;
};
const summarise = (v) => {
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}`;
  if (v && typeof v === "object") return Object.entries(v).map(([k, x]) => `${k}: ${typeof x === "object" ? JSON.stringify(x) : x}`).join(", ");
  return show(v);
};

// Which screen a `next_step` opens (guide rule 1: the next button always follows next_step).
function screenFor(nextStep, protocol) {
  const n = String(nextStep || "").toLowerCase();
  if (n === "read" || n === "retry_read") return "points";
  if (n === "bind" || n === "confirm_mapping") return "bind";
  if (n === "verify") return "verify";
  if (n.includes("unit") || n.includes("scan")) return "scan";
  return protocol === "modbus" ? "scan" : "points";
}

// Body for /read and /verify (same shape). Fields that do not belong to the protocol stay empty
// and are left out of the request, so the service uses its own defaults.
function readBody(j, infer) {
  return {
    ip: j.ip,
    protocol: j.protocol,
    port: j.port ?? null,
    unit_id: j.protocol === "modbus" ? j.unit_id ?? null : null,
    community: j.protocol === "snmp" ? j.community || "public" : null,
    model: j.protocol === "modbus" ? j.model || null : null,
    model_specification_id: j.model_specification_id || null,
    infer: j.protocol === "modbus" ? !!infer : null,
  };
}
const sameBody = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const initialProbe = (form = DEFAULT_PROBE_FORM) => ({ form, running: false, startedAt: 0, error: null, result: null, chosen: null });
const initialScan = () => ({
  form: { start: 1, end: 32, probe_address: 0, timeout: 0.6, stopOnFound: true },
  running: false, startedAt: 0, progress: 0, error: null, blocks: [], found: [], last: null, chosen: null, current: null, manualUnit: null,
});
const initialRead = () => ({
  running: false, startedAt: 0, error: null, result: null, params: null, receivedAt: 0, selected: new Set(),
  advanced: false, confirmed: false, infer: true, open: { measurement: true, info: true, other: false },
});
const initialBind = (name = "") => ({ name, restart: true, running: false, startedAt: 0, error: null, result: null });
const initialVerify = () => ({ running: false, startedAt: 0, error: null, result: null, showAll: false });

function useNow(active, ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

// ── small UI pieces ─────────────────────────────────────────────────────────
const Card = ({ children, style, ...rest }) => (
  <div {...rest} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 1px 4px rgba(16,40,80,.06)", ...style }}>{children}</div>
);
const EmptyCard = ({ children }) => <Card style={{ padding: 28, textAlign: "center", color: C.sub, fontSize: 13.5, marginBottom: 12 }}>{children}</Card>;
const ProtoBadge = ({ proto }) => {
  if (!proto) {
    return <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: C.sub, background: "#f1f5f9", border: "1px dashed #cbd5e1", whiteSpace: "nowrap" }}>Not set</span>;
  }
  const m = PROTO[proto] || { color: C.text, bg: "#f1f5f9" };
  return <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: m.color, background: m.bg, border: `1px solid ${m.color}44`, whiteSpace: "nowrap" }}>{protoLabel(proto)}</span>;
};
const StatusPill = ({ status }) => {
  const m = STATUS[status] || { label: status || "Unknown", color: C.sub, bg: "#f1f5f9" };
  return <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: m.color, background: m.bg, whiteSpace: "nowrap" }}>{m.label}</span>;
};
const Pill = ({ color, bg, children }) => (
  <span style={{ padding: "2px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12, color, background: bg, whiteSpace: "nowrap" }}>{children}</span>
);
const Label = ({ children }) => <div style={{ fontSize: 12.5, fontWeight: 600, color: C.sub, marginBottom: 5 }}>{children}</div>;
const NextBtn = ({ children, onClick, disabled }) => (
  <Button type="primary" size="large" disabled={disabled} onClick={onClick} style={{ background: disabled ? undefined : C.blue, fontWeight: 700, borderRadius: 8 }}>
    {children} <ArrowRightOutlined />
  </Button>
);
const BackBtn = ({ onClick, disabled }) => (
  <Button size="large" disabled={disabled} onClick={onClick} style={{ borderRadius: 8 }}><ArrowLeftOutlined /> Back</Button>
);
const SectionTitle = ({ title, sub, extra }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.text }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, color: C.sub }}>{sub}</div>}
    </div>
    {extra}
  </div>
);
const CardTitle = ({ children }) => <div style={{ fontWeight: 800, fontSize: 14.5, color: C.text, marginBottom: 12 }}>{children}</div>;

// Readable labels for the service's `next_step` and `needs` codes.
const NEXT_LABEL = {
  read: "Read points", retry_read: "Retry the read", bind: "Bind", confirm_mapping: "Confirm the mapping",
  verify: "Verify", scan_more_units: "Scan the next range", scan_units: "Run the slave scan",
};
const NEED_LABEL = { unit_id: "Unit ID", community: "Community", port: "Port" };
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const nextLabel = (n) => NEXT_LABEL[n] || (n ? capitalize(String(n).replace(/_/g, " ")) : "—");
const needLabel = (n) => NEED_LABEL[n] || capitalize(String(n).replace(/_/g, " "));

function Banner({ kind = "info", icon, children, action, style }) {
  const [bg, fg, bd] = BANNER[kind] || BANNER.info;
  const ic = icon ?? { info: <InfoCircleOutlined />, success: <CheckCircleFilled />, warn: <WarningFilled />, error: <ExclamationCircleFilled /> }[kind];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 13px", borderRadius: 9, background: bg, border: `1px solid ${bd}`, color: fg, fontSize: 13.5, marginBottom: 12, ...style }}>
      <span style={{ lineHeight: "21px" }}>{ic}</span>
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.55 }}>{children}</div>
      {action}
    </div>
  );
}

// Error from discoveryApi: { status, message (the service's `detail`), hint }.
function ErrorBanner({ error, onRetry, retryLabel = "Retry", children, style }) {
  if (!error || error.cancelled) return null;
  return (
    <Banner kind="error" style={style} action={onRetry ? <Button size="small" danger icon={<ReloadOutlined />} onClick={onRetry}>{retryLabel}</Button> : null}>
      <div style={{ fontWeight: 700, wordBreak: "break-word" }}>{error.status ? `HTTP ${error.status} · ` : ""}{error.message}</div>
      {error.hint && <div style={{ fontSize: 12.5, color: C.text, marginTop: 3 }}>{error.hint}</div>}
      {children}
    </Banner>
  );
}

function Elapsed({ since }) {
  const now = useNow(true);
  return <span style={{ fontFamily: MONO }}>{fmtClock(now - since)}</span>;
}

function Busy({ since, title, note, onCancel }) {
  return (
    <Card style={{ padding: 26, textAlign: "center", marginBottom: 12 }}>
      <Spin size="large" />
      <div style={{ fontWeight: 800, color: C.blue, marginTop: 12 }}>{title}</div>
      {since ? <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}><ClockCircleOutlined /> Elapsed <Elapsed since={since} /></div> : null}
      {note && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4, maxWidth: 480, marginInline: "auto" }}>{note}</div>}
      {onCancel && <Button size="small" icon={<StopOutlined />} onClick={onCancel} style={{ marginTop: 12 }}>Cancel</Button>}
    </Card>
  );
}

// Guide rule 6: bind within 15 minutes of the read, or the service scans the device again.
function CacheClock({ receivedAt }) {
  const now = useNow(!!receivedAt);
  if (!receivedAt) return null;
  const left = CACHE_MS - (now - receivedAt);
  return left > 0 ? (
    <Banner kind="info" icon={<ClockCircleOutlined />}>
      The read result is cached on the server for 15 minutes. Bind within <b style={{ fontFamily: MONO }}>{fmtClock(left)}</b> to reuse it without scanning the device again.
    </Banner>
  ) : (
    <Banner kind="warn" icon={<ClockCircleOutlined />}>
      The 15-minute scan cache has expired. Bind will scan the device again, which can take 2–3 minutes for SNMP.
    </Banner>
  );
}

function KV({ rows, cols = "150px minmax(0, 1fr)", style }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, rowGap: 7, columnGap: 12, fontSize: 13.5, alignItems: "center", ...style }}>
      {rows.filter(Boolean).map(([k, v, opt = {}]) => (
        <React.Fragment key={k}>
          <span style={{ color: C.sub }}>{k}</span>
          <span style={{ fontWeight: 700, fontFamily: opt.mono ? MONO : FONT, fontSize: opt.mono ? 12.5 : 13.5, wordBreak: "break-all" }}>{v}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// A value Device Management already holds is shown locked; only an empty one gets an input.
function Field({ label, locked, value, children, note }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <Label>{label}</Label>
      {locked ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px", minHeight: 32, borderRadius: 7, border: `1px solid ${C.border}`, background: "#f6f9ff", fontFamily: MONO, fontSize: 13 }}>
          <span style={{ flex: 1, wordBreak: "break-all" }}>{show(value)}</span>
          <Tooltip title="Loaded from the Device Management database">
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: C.teal, fontWeight: 700, whiteSpace: "nowrap" }}><LockOutlined /> DB</span>
          </Tooltip>
        </div>
      ) : children}
      {note && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{note}</div>}
    </div>
  );
}

const Chip = ({ state, title, children }) => (
  <Tooltip title={title}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,.16)", whiteSpace: "nowrap" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: state === "ok" ? "#4ade80" : state === "warn" ? "#fbbf24" : state === "wait" ? "#cbd5e1" : "#f87171" }} />
      {children}
    </span>
  </Tooltip>
);

function Stepper({ step, skipped, done }) {
  const idx = STEPS.findIndex((s) => s.key === step);
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 22px", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
      {STEPS.map((s, i) => {
        const isSkipped = skipped.includes(s.key);
        const isDone = (i < idx || (done && i === idx)) && !isSkipped;
        const active = i === idx && !done;
        const bg = active ? C.blue : isDone ? C.green : "#fff";
        const fg = active || isDone ? "#fff" : isSkipped ? "#b6c0cf" : C.sub;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: bg, color: fg, fontWeight: 800, fontSize: 14,
                border: active || isDone ? "none" : `2px solid ${isSkipped ? "#dfe5ee" : C.border}`,
                boxShadow: active ? "0 0 0 5px rgba(21,101,192,.15)" : "none",
              }}>{isDone ? <CheckCircleFilled /> : i + 1}</span>
              <span style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: active ? C.blue : isSkipped ? "#b6c0cf" : C.text, textDecoration: isSkipped ? "line-through" : "none" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, margin: "0 14px", background: i < idx ? C.green : C.border, minWidth: 20 }} />}
          </React.Fragment>
        );
      })}
      {done && <span style={{ marginLeft: 16, color: C.green, fontWeight: 700, whiteSpace: "nowrap" }}>✓ Done</span>}
    </div>
  );
}

function DeviceStrip({ job }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 16px", padding: "9px 12px", borderRadius: 9, background: C.blueLight, color: C.blue, fontSize: 13.5 }}>
      <InfoCircleOutlined />
      <span>Device: <b>{job.device_name || "—"}</b></span>
      <span>IP: <b style={{ fontFamily: MONO }}>{job.ip}</b></span>
      <span>Protocol: <b>{job.protocol ? protoLabel(job.protocol) : "to be detected"}</b></span>
      {has(job.port) && <span>Port: <b>{job.port}</b></span>}
      {job.protocol === "modbus" && has(job.unit_id) && <span>Unit ID: <b>{job.unit_id}</b></span>}
      {job.protocol === "snmp" && has(job.community) && <span>Community: <b>{job.community}</b></span>}
      {job.manual ? <Tag color="blue" style={{ marginInlineEnd: 0 }}>Manual entry</Tag> : <Tag color="cyan" style={{ marginInlineEnd: 0 }}>Device Management</Tag>}
    </div>
  );
}

function ProbeCard({ r, recommended, chosen, onChoose }) {
  const m = PROTO[r.protocol] || { label: protoLabel(r.protocol), color: C.text };
  const st = PROBE_STATUS[r.status] || PROBE_STATUS.no_response;
  return (
    <Card
      onClick={() => r.detected && onChoose(r.protocol)}
      style={{
        padding: "12px 14px", borderLeft: `5px solid ${r.detected ? C.green : "#cbd5e1"}`,
        background: chosen ? "#f0f7ff" : r.detected ? "#f6fdf8" : "#fff",
        outline: chosen ? `2px solid ${C.blue}` : "none", cursor: r.detected ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <Radio checked={chosen} disabled={!r.detected} onChange={() => onChoose(r.protocol)} />
        {r.detected ? <CheckCircleFilled style={{ color: C.green, fontSize: 18 }} /> : <CloseCircleFilled style={{ color: "#cbd5e1", fontSize: 18 }} />}
        <span style={{ fontWeight: 800, fontSize: 15, color: m.color }}>{m.label}</span>
        <Pill color={st.color} bg={st.bg}>{PROBE_STATUS[r.status]?.label || (r.status ? String(r.status).replace(/_/g, " ") : "Unknown")}</Pill>
        {recommended && <Tag color="gold" icon={<StarFilled />} style={{ marginInlineEnd: 0 }}>Recommended</Tag>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, fontSize: 13 }}>
        <div><div style={{ color: C.sub, fontSize: 12 }}>Port</div><b>{show(r.port)}</b></div>
        {has(r.device_id) && <div><div style={{ color: C.sub, fontSize: 12 }}>Device ID</div><b>{r.device_id}</b></div>}
        {has(r.objects_found) && <div><div style={{ color: C.sub, fontSize: 12 }}>Objects Found</div><b>{r.objects_found}</b></div>}
        <div style={{ gridColumn: "span 2" }}><div style={{ color: C.sub, fontSize: 12 }}>Note</div>{probeNote(r)}</div>
      </div>
      {Array.isArray(r.needs) && r.needs.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12.5, color: C.amber, fontWeight: 600 }}>Needs: {r.needs.map(needLabel).join(", ")}</div>
      )}
    </Card>
  );
}

function PointsSection({ group, points, selected, open, onOpen, onToggle, onMany, showConfidence, advanced, protocol, onLookupOid }) {
  if (!points.length) return null;
  const selectable = points.filter((p) => !p.error).map((p) => p.key);
  const nSel = points.filter((p) => selected.has(p.key)).length;
  const columns = [
    {
      title: "", key: "sel", width: 44, fixed: "left",
      render: (_, r) => <Checkbox checked={selected.has(r.key)} disabled={!!r.error} onChange={(e) => onToggle(r.key, e.target.checked)} />,
    },
    {
      title: "Name", dataIndex: "display_name",
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600, color: r.error ? C.red : C.text }}>{t || r.key}</div>
          {pointDescription(r) && <div style={{ fontSize: 11.5, color: C.sub }}>{pointDescription(r)}</div>}
        </div>
      ),
    },
    {
      title: "Value", key: "value", width: 170,
      render: (_, r) => (
        <Tooltip title={has(r.raw_value) ? `Raw value from the device: ${r.raw_value}${has(r.multiplier) ? ` × ${r.multiplier}` : ""}` : null}>
          <b style={{ fontFamily: MONO, color: r.error ? C.red : C.blue }}>{fmtValue(r.value)}</b>
          {r.unit && <span style={{ color: C.sub, marginLeft: 5 }}>{r.unit}</span>}
        </Tooltip>
      ),
    },
    { title: "Category", dataIndex: "category", width: 120, render: (t) => (t ? <Tag color={CAT_COLOR[t] || "default"}>{t}</Tag> : <span style={{ color: C.sub }}>—</span>) },
    showConfidence && { title: "Confidence", dataIndex: "confidence", width: 110, render: (t) => (t ? <Tag color={CONF_COLOR[t] || "default"}>{t}</Tag> : "—") },
    {
      title: "Status", key: "err", width: 92,
      render: (_, r) => (r.error ? <Tooltip title={pointError(r)}><Tag color="red">Error</Tag></Tooltip> : <Tag color="green">OK</Tag>),
    },
    ...(advanced ? [
      { title: "Key", dataIndex: "key", width: 190, render: mono },
      {
        title: "Address", dataIndex: "address", width: 260,
        render: (t) => (protocol === "snmp" && has(t)
          ? <Tooltip title="Look up this OID"><Button type="link" size="small" onClick={() => onLookupOid(t)} style={{ padding: 0, fontFamily: MONO, fontSize: 12 }}>{t}</Button></Tooltip>
          : mono(t)),
      },
      { title: "Raw", dataIndex: "raw_value", width: 90, render: mono },
      { title: "Multiplier", dataIndex: "multiplier", width: 96, render: mono },
      { title: "FC", dataIndex: "function_code", width: 60, render: mono },
      { title: "Regs", dataIndex: "register_count", width: 64, render: mono },
      { title: "Source", dataIndex: "source", width: 96, render: (t) => show(t) },
    ] : []),
  ].filter(Boolean);
  const tint = group.key === "measurement" ? "#f6f9ff" : group.key === "info" ? "#faf7ff" : "#f8fafc";
  return (
    <Card style={{ marginBottom: 12, overflow: "hidden" }}>
      <div onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: tint, borderBottom: open ? `1px solid ${C.border}` : "none", cursor: "pointer", flexWrap: "wrap" }}>
        {open ? <UpOutlined style={{ color: C.blue }} /> : <DownOutlined style={{ color: C.blue }} />}
        <b style={{ fontSize: 14.5 }}>{group.label}</b>
        <Tag style={{ marginInlineEnd: 0 }}>{points.length}</Tag>
        <Tooltip title={group.hint}><InfoCircleOutlined style={{ color: C.sub }} /></Tooltip>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: C.sub }}>{nSel} selected</span>
        <Button size="small" type="link" onClick={(e) => { e.stopPropagation(); onMany(selectable, true); }}>Select all</Button>
        <Button size="small" type="link" onClick={(e) => { e.stopPropagation(); onMany(selectable, false); }}>Clear</Button>
      </div>
      {open && (
        <Table
          size="small" rowKey="key" columns={columns} dataSource={points}
          pagination={points.length > 25 ? { pageSize: 25, showSizeChanger: false } : false}
          scroll={{ x: advanced ? 1500 : 760 }}
          onRow={(r) => (r.error ? { style: { background: C.redBg } } : {})}
        />
      )}
    </Card>
  );
}

function OnboardedList({ title, items }) {
  const [open, setOpen] = useState(false);
  if (!Array.isArray(items) || !items.length) return null;
  const label = (x) => (typeof x === "string" ? x : x?.key || x?.name || x?.display_name || JSON.stringify(x));
  return (
    <div style={{ marginTop: 8 }}>
      <Button type="link" size="small" onClick={() => setOpen((o) => !o)} style={{ padding: 0, fontWeight: 700 }}>
        {open ? <UpOutlined /> : <DownOutlined />} {title} ({items.length})
      </Button>
      {open && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{items.map((x, i) => <Tag key={i}>{label(x)}</Tag>)}</div>}
    </div>
  );
}

function TargetDetails({ r }) {
  return (
    <KV
      cols="180px minmax(0, 1fr) 180px minmax(0, 1fr)"
      style={{ padding: "4px 8px" }}
      rows={[
        ["Device detail ID", show(r.device_detail_id), { mono: true }],
        ["Model specification ID", show(r.model_specification_id), { mono: true }],
        ["Model number", show(r.model_number)],
        ["Protocol in Device Management", show(r.protocol_raw)],
        ["BACnet device ID", show(r.bacnet_device_id), { mono: true }],
        ["Gateway IP", show(r.gateway_ip), { mono: true }],
        ["Ready for zero-touch", r.ready_for_zero_touch === false ? "No" : "Yes"],
        ["Last discovered", show(r.last_discovered_at)],
        ["Discovery message", show(targetMessage(r))],
      ]}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function DiscoveryTool() {
  const [tab, setTab] = useState("discovery");
  const [service, setService] = useState({ loading: true, info: null, infoError: null, dbLoading: true, db: null, dbError: null });
  const [targetsQ, setTargetsQ] = useState({ loading: true, error: null, data: null });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [step, setStep] = useState("list");
  const [job, setJob] = useState(null); // the device being discovered + every parameter collected so far
  const [prepare, setPrepare] = useState(null); // asks for protocol / unit ID when ready_for_zero_touch is false
  const [manual, setManual] = useState({ open: false, ip: "", name: "" });

  const [probe, setProbe] = useState(() => initialProbe());
  const [scan, setScan] = useState(initialScan);
  const [read, setRead] = useState(initialRead);
  const [bind, setBind] = useState(() => initialBind());
  const [verify, setVerify] = useState(initialVerify);

  const [profilesQ, setProfilesQ] = useState({ loading: false, error: null, data: null });
  const [registryQ, setRegistryQ] = useState({ loading: false, error: null, data: null, loaded: false });
  const [restartQ, setRestartQ] = useState({ running: false, error: null, result: null, at: null });
  const [removeQ, setRemoveQ] = useState({ ip: null, error: null, message: null });
  const [oidQ, setOidQ] = useState({ oid: "", running: false, error: null, result: null });
  const [confirmBox, setConfirmBox] = useState(null);

  // One AbortController + run id per operation: a new run (or Cancel) drops the old answer.
  const ctrls = useRef({});
  const runs = useRef({});
  const startRun = useCallback((name) => {
    ctrls.current[name]?.abort();
    const ctrl = new AbortController();
    ctrls.current[name] = ctrl;
    const id = (runs.current[name] || 0) + 1;
    runs.current[name] = id;
    return { signal: ctrl.signal, live: () => runs.current[name] === id };
  }, []);
  const stopRun = useCallback((name) => {
    ctrls.current[name]?.abort();
    runs.current[name] = (runs.current[name] || 0) + 1;
  }, []);
  useEffect(() => {
    const all = ctrls.current;
    return () => Object.values(all).forEach((c) => c?.abort());
  }, []);

  // ── loaders ───────────────────────────────────────────────────────────────
  // GET /  and  GET /api/db/health — separately, so the quick service check does not wait for the DB check.
  const loadService = useCallback(() => {
    setService((s) => ({ ...s, loading: true, dbLoading: true }));
    discoveryApi.serviceInfo().then(
      (info) => setService((s) => ({ ...s, loading: false, info, infoError: null })),
      (infoError) => setService((s) => ({ ...s, loading: false, info: null, infoError })),
    );
    discoveryApi.dbHealth().then(
      (db) => setService((s) => ({ ...s, dbLoading: false, db, dbError: null })),
      (dbError) => setService((s) => ({ ...s, dbLoading: false, db: null, dbError })),
    );
  }, []);

  // GET /api/discovery/targets
  const loadTargets = useCallback(async () => {
    const { signal, live } = startRun("targets");
    setTargetsQ((q) => ({ ...q, loading: true, error: null }));
    try {
      const data = await discoveryApi.targets({ signal });
      if (live()) setTargetsQ({ loading: false, error: null, data });
    } catch (error) {
      if (live() && !error.cancelled) setTargetsQ((q) => ({ ...q, loading: false, error }));
    }
  }, [startRun]);

  // GET /api/discovery/profiles
  const loadProfiles = useCallback(async () => {
    const { signal, live } = startRun("profiles");
    setProfilesQ((q) => ({ ...q, loading: true, error: null }));
    try {
      const data = await discoveryApi.profiles({ signal });
      if (live()) setProfilesQ({ loading: false, error: null, data });
    } catch (error) {
      if (live() && !error.cancelled) setProfilesQ((q) => ({ ...q, loading: false, error }));
    }
  }, [startRun]);

  // GET /api/gateway/registry
  const loadRegistry = useCallback(async () => {
    const { signal, live } = startRun("registry");
    setRegistryQ((q) => ({ ...q, loading: true, error: null }));
    try {
      const data = await discoveryApi.registry({ signal });
      if (live()) setRegistryQ({ loading: false, error: null, data, loaded: true });
    } catch (error) {
      if (live() && !error.cancelled) setRegistryQ((q) => ({ ...q, loading: false, error, loaded: true }));
    }
  }, [startRun]);

  useEffect(() => {
    loadService();
    loadTargets();
    loadProfiles();
  }, [loadService, loadTargets, loadProfiles]);

  useEffect(() => {
    if (tab === "gateway" && !registryQ.loaded && !registryQ.loading) loadRegistry();
  }, [tab, registryQ.loaded, registryQ.loading, loadRegistry]);

  // ── derived ───────────────────────────────────────────────────────────────
  const targets = useMemo(() => (Array.isArray(targetsQ.data?.targets) ? targetsQ.data.targets : []), [targetsQ.data]);
  const statusCounts = useMemo(() => targets.reduce((m, t) => {
    const k = t.discovery_status || "pending";
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {}), [targets]);
  const profileList = useMemo(() => (Array.isArray(profilesQ.data?.profiles) ? profilesQ.data.profiles : []), [profilesQ.data]);
  const profileModels = useMemo(() => [...new Set(profileList.map((p) => p.model).filter(Boolean))].map((m) => ({ value: m })), [profileList]);
  const points = useMemo(() => (Array.isArray(read.result?.points) ? read.result.points : []), [read.result]);
  const grouped = useMemo(() => {
    const g = { measurement: [], info: [], other: [] };
    points.forEach((p) => (g[p.group] || g.other).push(p));
    return g;
  }, [points]);
  const regRows = useMemo(() => {
    const d = registryQ.data?.devices;
    if (Array.isArray(d)) return d.map((x, i) => (x && typeof x === "object" ? { _k: String(x.ip || i), ...x } : { _k: String(i), ip: String(x) }));
    if (d && typeof d === "object") return Object.entries(d).map(([ip, x]) => (x && typeof x === "object" ? { _k: ip, ip, ...x } : { _k: ip, ip, value: x }));
    return [];
  }, [registryQ.data]);

  const q = search.trim().toLowerCase();
  const filtered = targets.filter((t) =>
    (statusFilter === "all" || (t.discovery_status || "pending") === statusFilter) &&
    (!q || [t.device_name, t.ip, t.model, t.model_number].some((v) => String(v ?? "").toLowerCase().includes(q))));

  // ── wizard control ────────────────────────────────────────────────────────
  const resetWizard = (form, name) => {
    ["probe", "scan", "read", "bind", "verify"].forEach(stopRun);
    setProbe(initialProbe(form));
    setScan(initialScan());
    setRead(initialRead());
    setBind(initialBind(name));
    setVerify(initialVerify());
  };

  const openJob = (t, overrides = {}) => {
    // Guide rule 9: whatever Device Management already holds is used as it is.
    const locked = { port: has(t.port), unit_id: has(t.unit_id), community: has(t.community) };
    const protocol = (overrides.protocol ?? t.protocol) || null;
    const fromDb = has(t.protocol) && (!has(overrides.protocol) || overrides.protocol === t.protocol);
    const j = {
      device_detail_id: t.device_detail_id || null,
      device_name: t.device_name || "",
      ip: String(t.ip || "").trim(),
      model: t.model || null,
      model_number: t.model_number || null,
      model_specification_id: t.model_specification_id || null,
      protocol,
      port: t.port ?? null,
      unit_id: overrides.unit_id ?? t.unit_id ?? null,
      community: overrides.community ?? t.community ?? null,
      bacnet_device_id: t.bacnet_device_id ?? null,
      gateway_ip: t.gateway_ip || null,
      has_profile: !!t.has_profile,
      discovery_status: t.discovery_status || null,
      manual: !!t.manual,
      locked,
      declared: PROTO[protocol] ? { protocol, from: fromDb ? "db" : "user" } : null, // what the probe is narrowed to
    };
    // A known protocol is probed on its own — much faster than checking all three.
    const form = {
      ...DEFAULT_PROBE_FORM,
      check: PROTO[protocol] ? protocol : "all",
      community: j.community || "public",
      modbus_port: protocol === "modbus" && has(j.port) ? j.port : 502,
    };
    resetWizard(form, j.device_name || `Device-${j.ip.replace(/\./g, "-")}`);
    setJob(j);
    setTab("discovery");
    setStep("probe");
  };

  const onDiscover = (t) => {
    if (t.ready_for_zero_touch === false) {
      setPrepare({ target: t, protocol: PROTO[t.protocol] ? t.protocol : "auto", unit_id: t.unit_id ?? null, community: t.community || "public" });
    } else {
      openJob(t);
    }
  };

  const confirmPrepare = () => {
    const p = prepare;
    setPrepare(null);
    openJob(p.target, {
      protocol: p.protocol === "auto" ? null : p.protocol,
      unit_id: p.protocol === "modbus" || p.protocol === "auto" ? p.unit_id : null,
      community: p.protocol === "snmp" ? p.community : undefined,
    });
  };

  const openManual = () => {
    const ip = manual.ip.trim();
    if (!isIp(ip)) return;
    const name = manual.name.trim();
    setManual({ open: false, ip: "", name: "" });
    openJob({ manual: true, ip, device_name: name || `Manual-${ip.replace(/\./g, "-")}` });
  };

  const finish = () => {
    ["probe", "scan", "read", "bind", "verify"].forEach(stopRun);
    setJob(null);
    setStep("list");
    loadTargets();
  };

  const setProbeForm = (patch) => setProbe((p) => ({ ...p, form: { ...p.form, ...patch } }));
  const setScanForm = (patch) => setScan((s) => ({ ...s, form: { ...s.form, ...patch } }));
  const patchJob = (patch) => setJob((j) => (j ? { ...j, ...patch } : j));

  // ── 2 · probe ─────────────────────────────────────────────────────────────
  // Take over the protocol the operator picked from the probe result.
  const adoptProtocol = (protocol, res, community) => {
    const card = res?.protocols?.find((x) => x.protocol === protocol);
    setJob((j) => {
      if (!j) return j;
      const n = { ...j, protocol };
      if (j.protocol !== protocol) {
        n.port = card?.port ?? PROTO[protocol]?.port ?? null; // the stored port belonged to another protocol
        n.locked = { ...j.locked, port: false };
      } else if (!has(j.port)) {
        n.port = card?.port ?? PROTO[protocol]?.port ?? null;
      }
      if (protocol === "snmp" && !has(j.community)) n.community = community || "public";
      if (protocol === "bacnet" && !has(j.bacnet_device_id) && has(card?.device_id)) n.bacnet_device_id = card.device_id;
      return n;
    });
  };

  const runProbe = async () => {
    if (!job) return;
    const f = probe.form;
    const { signal, live } = startRun("probe");
    setProbe((p) => ({ ...p, running: true, startedAt: Date.now(), error: null, result: null, chosen: null }));
    try {
      const res = await discoveryApi.probe({
        ip: job.ip,
        check: f.check === "all" ? null : [f.check],
        community: f.community || "public",
        modbus_port: f.modbus_port || 502,
        snmp_timeout: f.snmp_timeout,
        bacnet_timeout: f.bacnet_timeout,
      }, { signal });
      if (!live()) return;
      const detected = (res?.protocols || []).filter((x) => x.detected);
      const chosen = res?.recommended?.protocol || detected[0]?.protocol || null; // recommended is pre-selected
      setProbe((p) => ({ ...p, running: false, result: res, chosen }));
      if (chosen) adoptProtocol(chosen, res, f.community);
    } catch (error) {
      if (live() && !error.cancelled) setProbe((p) => ({ ...p, running: false, error }));
    }
  };

  const chooseProtocol = (protocol) => {
    if (protocol === probe.chosen) return;
    setProbe((p) => ({ ...p, chosen: protocol }));
    adoptProtocol(protocol, probe.result, probe.form.community);
    // results from a different protocol no longer apply
    ["scan", "read", "bind", "verify"].forEach(stopRun);
    setScan(initialScan());
    setRead(initialRead());
    setBind((b) => initialBind(b.name));
    setVerify(initialVerify());
  };

  const wants = (p) => probe.form.check === "all" || probe.form.check === p; // probe fields that apply to the chosen check
  const probeCard = probe.result?.protocols?.find((x) => x.protocol === probe.chosen) || null;
  const probeNextStep = probe.result && probe.chosen
    ? ((probe.result.recommended?.protocol === probe.chosen && probe.result.recommended?.next_step) || (probeCard?.needs?.includes("unit_id") ? "scan_units" : "read"))
    : null;
  const probeNext = probeNextStep ? screenFor(probeNextStep, probe.chosen) : null;

  // ── 2b · Modbus slave scan, in blocks of 32 IDs ───────────────────────────
  // `append` keeps the blocks already scanned (used by "Scan next range").
  const runScan = async (fromArg, toArg, append = false) => {
    if (!job) return;
    const from = clamp(fromArg ?? scan.form.start, 1, 247);
    const to = clamp(toArg ?? scan.form.end, from, 247);
    const blocks = [];
    for (let a = from; a <= to; a += 32) blocks.push([a, Math.min(to, a + 31)]);
    const { probe_address, timeout, stopOnFound } = scan.form;
    const port = job.port ?? 502;
    const log = append ? [...scan.blocks] : [];
    const found = append ? [...scan.found] : [];
    const { signal, live } = startRun("scan");
    setScan((s) => ({
      ...s, form: { ...s.form, start: from, end: to }, running: true, startedAt: Date.now(), progress: 0, error: null,
      blocks: [...log], found: [...found], last: append ? s.last : null, chosen: null, current: blocks[0],
    }));
    for (let i = 0; i < blocks.length; i += 1) {
      const [a, b] = blocks[i];
      if (i > 0) setScan((s) => ({ ...s, current: [a, b] }));
      let res;
      try {
        res = await discoveryApi.scanUnits({ ip: job.ip, port, start: a, end: b, probe_address, timeout }, { signal });
      } catch (error) {
        if (live() && !error.cancelled) setScan((s) => ({ ...s, running: false, current: null, error }));
        return;
      }
      if (!live()) return;
      log.push({ range: [a, b], ...res });
      (res?.found || []).forEach((f) => { if (!found.some((x) => x.unit_id === f.unit_id)) found.push(f); });
      setScan((s) => ({ ...s, progress: Math.round(((i + 1) / blocks.length) * 100), blocks: [...log], found: [...found], last: res }));
      if (found.length && stopOnFound) break;
    }
    if (!live()) return;
    setScan((s) => ({ ...s, running: false, current: null, progress: 100, chosen: found[0]?.unit_id ?? null }));
  };

  const scanDone = !scan.running && scan.blocks.length > 0;
  const scanNoneYet = scanDone && !scan.found.length;
  const nextRange = scan.form.end < 247 ? [scan.form.end + 1, Math.min(247, scan.form.end + 32)] : null;
  const unitPick = scan.chosen ?? scan.manualUnit ?? null;

  // ── 3 · read points ───────────────────────────────────────────────────────
  const runRead = async ({ j = job, infer = read.infer } = {}) => {
    if (!j || !j.protocol) return;
    const body = readBody(j, infer);
    const { signal, live } = startRun("read");
    stopRun("verify");
    setRead((r) => ({ ...r, infer, params: body, running: true, startedAt: Date.now(), error: null, result: null, receivedAt: 0, confirmed: false }));
    setBind((b) => ({ ...b, error: null, result: null }));
    setVerify(initialVerify());
    try {
      const res = await discoveryApi.read(body, { signal });
      if (!live()) return;
      const pts = Array.isArray(res?.points) ? res.points : [];
      setRead((r) => ({
        ...r, running: false, result: res, receivedAt: Date.now(),
        // `selected` from the service is the default tick (guide rule 3)
        selected: new Set(pts.filter((p) => p.selected && !p.error).map((p) => p.key)),
        open: { measurement: true, info: true, other: false },
      }));
    } catch (error) {
      if (live() && !error.cancelled) setRead((r) => ({ ...r, running: false, error }));
    }
  };

  // Open the points screen; read straight away unless a read with the same parameters is already there.
  const goPoints = (patch) => {
    const j = patch ? { ...job, ...patch } : job;
    if (patch) setJob(j);
    setStep("points");
    const same = read.params && sameBody(read.params, readBody(j, read.infer));
    if (!(same && (read.running || read.result))) runRead({ j });
  };

  const togglePoint = (key, on) => setRead((r) => {
    const s = new Set(r.selected);
    if (on) s.add(key); else s.delete(key);
    return { ...r, selected: s };
  });
  const setMany = (keys, on) => setRead((r) => {
    const s = new Set(r.selected);
    keys.forEach((k) => (on ? s.add(k) : s.delete(k)));
    return { ...r, selected: s };
  });

  const rr = read.result;
  const sum = rr?.summary || {};
  const readRetry = !!rr && (rr.next_step === "retry_read" || rr.retry_recommended === true);
  const needsConfirm = !!rr && (rr.next_step === "confirm_mapping" || rr.source === "inferred");
  const canBind = !!rr && points.length > 0 && !readRetry && (!needsConfirm || read.confirmed);
  const srcBadge = rr ? SOURCE_BADGE[rr.source] : null;
  const inferredExtra = rr ? ["unmapped", "registers_found", "dominant_scale", "word_order", "confidence_summary"].filter((k) => has(rr[k])) : [];

  // ── 4 · bind ──────────────────────────────────────────────────────────────
  const runBind = async () => {
    if (!job || !rr) return;
    const keys = [...read.selected];
    const body = {
      ip: job.ip,
      device_name: bind.name.trim(),
      protocol: job.protocol,
      port: job.port ?? null,
      unit_id: job.protocol === "modbus" ? job.unit_id ?? null : null,
      community: job.protocol === "snmp" ? job.community || "public" : null,
      model: job.protocol === "modbus" ? job.model || null : null,
      model_specification_id: job.model_specification_id || null,
      device_detail_id: job.device_detail_id || null, // guide rule 8: always sent for a Device Management device
      selected_keys: keys.length ? keys : null, // left out → the service picks the points itself
      restart_gateway: bind.restart,
    };
    const { signal, live } = startRun("bind");
    setBind((b) => ({ ...b, running: true, startedAt: Date.now(), error: null, result: null }));
    try {
      const res = await discoveryApi.bind(body, { signal });
      if (!live()) return;
      setBind((b) => ({ ...b, running: false, result: res }));
      if (job.device_detail_id) loadTargets(); // the list picks up DiscoveryStatus = onboarded
    } catch (error) {
      if (live() && !error.cancelled) setBind((b) => ({ ...b, running: false, error }));
    }
  };
  const bindOk = !!bind.result && bind.result.success !== false;

  // ── 5 · verify ────────────────────────────────────────────────────────────
  const runVerify = async (j = job) => {
    if (!j) return;
    const { signal, live } = startRun("verify");
    setVerify((v) => ({ ...v, running: true, startedAt: Date.now(), error: null, result: null }));
    try {
      const res = await discoveryApi.verify(readBody(j, read.infer), { signal });
      if (live()) setVerify((v) => ({ ...v, running: false, result: res }));
    } catch (error) {
      if (live() && !error.cancelled) setVerify((v) => ({ ...v, running: false, error }));
    }
  };
  const goVerify = () => {
    setStep(screenFor(bind.result?.next_step || "verify", job?.protocol));
    if (!verify.running && !verify.result) runVerify();
  };

  // ── gateway, registry, OID lookup ─────────────────────────────────────────
  const runRestart = async () => {
    const { signal, live } = startRun("restart");
    setRestartQ({ running: true, error: null, result: null, at: null });
    try {
      const res = await discoveryApi.restartGateway({ signal });
      if (live()) setRestartQ({ running: false, error: null, result: res, at: new Date() });
    } catch (error) {
      if (live() && !error.cancelled) setRestartQ({ running: false, error, result: null, at: null });
    }
  };
  const askRestart = () => setConfirmBox({
    title: "Restart the gateway?",
    body: "Bind already restarts the gateway on its own. Restart it by hand only after its configuration was changed manually, or when it is stuck. Data from every onboarded device pauses while the gateway restarts.",
    okText: "Restart gateway",
    onOk: runRestart,
  });

  const runRemove = async (ip) => {
    setRemoveQ({ ip, error: null, message: null });
    try {
      const res = await discoveryApi.removeFromRegistry(ip);
      setRemoveQ({ ip: null, error: null, message: removeMessage(res, ip) });
      loadRegistry();
    } catch (error) {
      setRemoveQ({ ip: null, error, message: null });
    }
  };
  const askRemove = (ip) => setConfirmBox({
    title: `Remove ${ip} from the gateway registry?`,
    body: "The device is taken out of the gateway registry and the gateway configuration is written again. Its telemetry stops until it is bound again.",
    okText: "Remove",
    onOk: () => runRemove(ip),
  });

  const runOid = async (value) => {
    const oid = String(value ?? oidQ.oid).trim();
    if (!oid) return;
    const { signal, live } = startRun("oid");
    setOidQ({ oid, running: true, error: null, result: null });
    try {
      const res = await discoveryApi.resolveOid(oid, { signal });
      if (live()) setOidQ((s) => ({ ...s, running: false, result: res }));
    } catch (error) {
      if (live() && !error.cancelled) setOidQ((s) => ({ ...s, running: false, error }));
    }
  };
  const lookupOid = (oid) => {
    setTab("oid");
    runOid(oid);
  };

  // ── screens ───────────────────────────────────────────────────────────────
  const svcState = service.loading ? "wait" : service.info && !service.infoError ? "ok" : "bad";
  const dbState = service.dbLoading ? "wait" : service.db?.connected ? "ok" : service.db ? "warn" : "bad";

  // FastAPI sends an unhandled-error 500 without CORS headers, so the browser only reports a
  // network error. When the service itself answers, say that instead of "cannot reach".
  const explain = (error) => {
    if (!error || !error.network || svcState !== "ok" || error.elapsedMs > 90 * 1000) return error;
    return {
      ...error,
      message: "The Protocol Service returned an error the browser cannot read.",
      hint: "The service itself is reachable, so this is most likely an internal server error (HTTP 500). The service sends that error without CORS headers, so the browser blocks the details — check the Protocol Service logs.",
    };
  };

  const resumeStep =bind.result ? (verify.result || verify.running ? "verify" : "bind")
    : rr || read.running ? "points" : scan.blocks.length || scan.running ? "scan" : "probe";

  const listColumns = [
    { title: "#", key: "i", width: 48, render: (_, __, i) => <span style={{ color: C.sub }}>{i + 1}</span> },
    {
      title: "Device Name", dataIndex: "device_name",
      render: (t, r) => <div><b style={{ color: C.text }}>{show(t)}</b>{r.model_number && <div style={{ fontSize: 12, color: C.sub }}>{r.model_number}</div>}</div>,
    },
    { title: "IP Address", dataIndex: "ip", width: 132, render: (t) => <span style={{ fontFamily: MONO }}>{show(t)}</span> },
    { title: "Model", dataIndex: "model", render: (t) => <span style={{ color: C.sub }}>{show(t)}</span> },
    {
      title: "Protocol", dataIndex: "protocol", width: 104,
      render: (t, r) => (
        <Tooltip title={t ? (r.protocol_raw ? `Device Management: ${r.protocol_raw}` : "") : "Not set — the probe will detect it"}>
          <span><ProtoBadge proto={t} /></span>
        </Tooltip>
      ),
    },
    { title: "Port", dataIndex: "port", width: 72, render: mono },
    { title: "Unit ID", dataIndex: "unit_id", width: 76, render: mono },
    { title: "Community", dataIndex: "community", width: 104, render: (t) => show(t) },
    {
      title: "Profile", dataIndex: "has_profile", width: 80,
      render: (t) => (t ? <Tooltip title="A register map already exists (Modbus zero-touch)"><Tag color="green">Yes</Tag></Tooltip> : <span style={{ color: C.sub }}>—</span>),
    },
    {
      title: "Discovery Status", dataIndex: "discovery_status", width: 150,
      render: (t, r) => (
        <Tooltip title={[r.last_discovered_at && `Last discovered ${r.last_discovered_at}`, targetMessage(r)].filter(Boolean).join(" · ") || "Never discovered"}>
          <span><StatusPill status={t || "pending"} /></span>
        </Tooltip>
      ),
    },
    {
      title: "Action", key: "a", width: 132,
      render: (_, r) => {
        const onboarded = r.discovery_status === "onboarded";
        const ready = r.ready_for_zero_touch !== false;
        return (
          <Tooltip title={!r.ip ? "No IP address in Device Management" : ready ? "" : "Some details are missing — the protocol / unit ID is asked for first."}>
            <Button
              type="primary" disabled={!r.ip} onClick={() => onDiscover(r)}
              style={{ background: !r.ip ? undefined : onboarded ? C.teal : ready ? C.blue : C.amber, fontWeight: 700, borderRadius: 7, width: 112 }}
            >
              {onboarded ? "Re-discover" : "Discover"}
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  const statusFilters = [["all", "All", targets.length, C.blue], ...Object.entries(STATUS).map(([k, m]) => [k, m.label, statusCounts[k] || 0, m.dot])];

  const screenList = (
    <div style={{ padding: 22 }}>
      <SectionTitle
        title="Discoverable Devices"
        sub="Devices from Device Management that can be discovered. Pick one, or enter an IP address manually."
        extra={(
          <>
            <Input allowClear size="large" prefix={<SearchOutlined style={{ color: "#9aa8bb" }} />} placeholder="Search by name, IP or model…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
            <Button size="large" icon={<ReloadOutlined />} loading={targetsQ.loading} onClick={loadTargets}>Refresh</Button>
            <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => setManual({ open: true, ip: "", name: "" })} style={{ background: C.blue, fontWeight: 700 }}>Add Manual IP</Button>
          </>
        )}
      />
      {job && (
        <Banner kind="info" action={<Button size="small" type="primary" onClick={() => setStep(resumeStep)}>Continue</Button>}>
          Discovery of <b>{job.device_name || job.ip}</b> ({job.ip}) is still open.
        </Banner>
      )}
      <ErrorBanner error={explain(targetsQ.error)} onRetry={loadTargets}>
        {service.db && service.db.connected === false && (
          <div style={{ fontSize: 12.5, color: C.text, marginTop: 4 }}><b>Device Management DB:</b> {dbMessage(service.db)}</div>
        )}
        <div style={{ fontSize: 12.5, color: C.text, marginTop: 4 }}>You can still discover a device by entering its IP address with <b>Add Manual IP</b>.</div>
      </ErrorBanner>
      {targetsQ.data?.schema_ready === false && (
        <Banner kind="warn">
          <b>The discovery columns are missing in this Device Management database.</b> Port, unit ID, community and BACnet device ID come back empty and have to be entered by hand.
          {schemaNote(targetsQ.data.schema_note) && <div style={{ fontSize: 12.5, color: C.text, marginTop: 3 }}>{schemaNote(targetsQ.data.schema_note)}</div>}
        </Banner>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {statusFilters.map(([k, label, n, dot]) => (
          <button
            key={k} type="button" onClick={() => setStatusFilter(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, border: `1px solid ${statusFilter === k ? C.blue : C.border}`, background: statusFilter === k ? C.blueLight : "#fff", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot }} />{label} <b>{n}</b>
          </button>
        ))}
      </div>
      <Card style={{ overflow: "hidden" }}>
        <Table
          rowKey={(r) => r.device_detail_id || `${r.ip}-${r.device_name}`}
          columns={listColumns} dataSource={filtered} loading={targetsQ.loading} size="middle" scroll={{ x: 1180 }}
          pagination={filtered.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
          expandable={{ expandedRowRender: (r) => <TargetDetails r={r} /> }}
          onRow={(r) => (job && r.device_detail_id && r.device_detail_id === job.device_detail_id ? { style: { background: C.blueLight } } : {})}
          locale={{
            emptyText: targetsQ.loading ? "Loading devices…"
              : targetsQ.error ? "The device list could not be loaded."
                : q || statusFilter !== "all" ? "No device matches the filter." : "No discoverable devices in Device Management.",
          }}
        />
      </Card>
      <Card style={{ padding: "14px 16px", background: "#f6f9ff", marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.blue, fontSize: 14 }}><InfoCircleOutlined /> How the list works</div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.6 }}>
          Port, unit ID, community and BACnet device ID come from the Device Management database and are passed to the read and bind steps as they are; only missing values are asked for.
          Devices that are ready for zero-touch start discovery straight away, the others ask for their protocol or unit ID first. Onboarded devices show <b>Re-discover</b>.
        </div>
      </Card>
    </div>
  );

  const screenProbe = job && (
    <div style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 18 }}>
      <div>
        <SectionTitle title="Probe Device" sub="Check which protocol answers on this IP address." />
        <Card style={{ padding: 16 }}>
          <CardTitle>Probe Settings</CardTitle>
          <Label>IP Address</Label>
          <Input size="large" value={job.ip} readOnly style={{ fontFamily: MONO, marginBottom: 12 }} />
          <Label>Check Protocols</Label>
          <Radio.Group value={probe.form.check} disabled={probe.running} onChange={(e) => setProbeForm({ check: e.target.value })} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            <Radio value="all">All three (Modbus, SNMP, BACnet)</Radio>
            <Radio value="modbus">Modbus only</Radio>
            <Radio value="snmp">SNMP only</Radio>
            <Radio value="bacnet">BACnet only</Radio>
          </Radio.Group>
          {job.declared && (
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
              {job.declared.from === "db" ? "Device Management lists this device as" : "You selected"} {protoLabel(job.declared.protocol)}. Probing only that protocol is much faster.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 12 }}>
            {wants("snmp") && (
              <Field label="Community (SNMP)" locked={job.locked.community} value={job.community}>
                <Input value={probe.form.community} disabled={probe.running} onChange={(e) => setProbeForm({ community: e.target.value })} />
              </Field>
            )}
            {wants("modbus") && (
              <Field label="Modbus Port" locked={job.locked.port && job.protocol === "modbus"} value={job.port}>
                <InputNumber min={1} max={65535} value={probe.form.modbus_port} disabled={probe.running} onChange={(v) => setProbeForm({ modbus_port: v ?? 502 })} style={{ width: "100%" }} />
              </Field>
            )}
            {wants("snmp") && (
              <div style={{ marginBottom: 11 }}>
                <Label>SNMP Timeout (s)</Label>
                <InputNumber min={1} max={120} value={probe.form.snmp_timeout} disabled={probe.running} onChange={(v) => setProbeForm({ snmp_timeout: v ?? 12 })} style={{ width: "100%" }} />
              </div>
            )}
            {wants("bacnet") && (
              <div style={{ marginBottom: 11 }}>
                <Label>BACnet Timeout (s)</Label>
                <InputNumber min={1} max={120} value={probe.form.bacnet_timeout} disabled={probe.running} onChange={(v) => setProbeForm({ bacnet_timeout: v ?? 8 })} style={{ width: "100%" }} />
              </div>
            )}
          </div>
          {(wants("snmp") || wants("bacnet")) && <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>Raise the timeouts for a slow device.</div>}
          <Button type="primary" size="large" loading={probe.running} onClick={runProbe} style={{ background: C.blue, fontWeight: 700 }}>
            {probe.result ? "Probe again" : "Start Probe"}
          </Button>
        </Card>
      </div>
      <div style={{ minWidth: 0 }}>
        <SectionTitle title="Probe Result" />
        {!probe.result && !probe.running && !probe.error && <EmptyCard>Start the probe to see which protocol answers on <b style={{ fontFamily: MONO }}>{job.ip}</b>.</EmptyCard>}
        {probe.running && (
          <Busy
            since={probe.startedAt} title={`Probing ${job.ip}…`} note="The protocols are checked side by side."
            onCancel={() => { stopRun("probe"); setProbe((p) => ({ ...p, running: false })); }}
          />
        )}
        <ErrorBanner error={explain(probe.error)} onRetry={runProbe} />
        {probe.result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Banner kind={probe.result.detected_count ? "success" : "error"} style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 800 }}>{probeSummary(probe.result)}</div>
              <div style={{ fontSize: 12.5, color: C.sub }}>
                IP <span style={{ fontFamily: MONO }}>{show(probe.result.ip)}</span> · Duration {show(probe.result.duration_seconds)} s · {probe.result.detected_count ?? 0} detected
              </div>
            </Banner>
            {(probe.result.protocols || []).map((r) => (
              <ProbeCard key={r.protocol} r={r} recommended={probe.result.recommended?.protocol === r.protocol} chosen={probe.chosen === r.protocol} onChoose={chooseProtocol} />
            ))}
            {probeCard && Array.isArray(probeCard.needs) && probeCard.needs.length > 0 && (
              <Card style={{ padding: 14, borderColor: "#f7d9a8", background: C.amberBg }}>
                <div style={{ fontWeight: 800, color: C.amber, marginBottom: 8 }}>{protoLabel(probe.chosen)} also needs: {probeCard.needs.map(needLabel).join(", ")}</div>
                {probeCard.needs.includes("unit_id") && (
                  <Field
                    label="Unit ID (Modbus slave ID)" locked={job.locked.unit_id} value={job.unit_id}
                    note={job.locked.unit_id ? "Taken from Device Management." : "Enter it if you know it, or find it with the slave scan."}
                  >
                    <InputNumber min={1} max={247} value={job.unit_id} placeholder="1–247" onChange={(v) => patchJob({ unit_id: v ?? null })} style={{ width: 180 }} />
                  </Field>
                )}
                {probeCard.needs.includes("community") && (
                  <Field label="Community" locked={job.locked.community} value={job.community}>
                    <Input value={job.community || ""} placeholder="public" onChange={(e) => patchJob({ community: e.target.value || null })} style={{ width: 220 }} />
                  </Field>
                )}
                {probeCard.needs.filter((n) => n !== "unit_id" && n !== "community").map((n) => (
                  <div key={n} style={{ fontSize: 12.5, color: C.text }}>Required by the service: <b>{needLabel(n)}</b></div>
                ))}
              </Card>
            )}
            {probe.result.recommended ? (
              <Banner kind="warn" icon={<StarFilled />} style={{ marginBottom: 0 }}>
                <b>Recommended:</b> {protoLabel(probe.result.recommended.protocol)} on port <b>{show(probe.result.recommended.port)}</b> · next step: <b>{nextLabel(probe.result.recommended.next_step)}</b>
              </Banner>
            ) : (
              !probe.result.detected_count && <div><Button danger icon={<ReloadOutlined />} onClick={runProbe}>Retry probe</Button></div>
            )}
          </div>
        )}
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <BackBtn onClick={() => setStep("list")} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {probeNext === "scan" && has(job.unit_id) && (
            <Button size="large" onClick={() => goPoints()} style={{ borderRadius: 8 }}>Use unit ID {job.unit_id} and read points</Button>
          )}
          {probeNext === "points" && probe.chosen === "modbus" && <Button size="large" onClick={() => setStep("scan")} style={{ borderRadius: 8 }}>Slave Scan</Button>}
          {probeNext === "scan"
            ? <NextBtn onClick={() => setStep("scan")}>Next: Slave Scan</NextBtn>
            : <NextBtn disabled={!probeNext} onClick={() => goPoints()}>Next: Read Points</NextBtn>}
        </div>
      </div>
    </div>
  );

  const screenScan = job && (
    <div style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr)", gap: 18 }}>
      <div style={{ gridColumn: "1 / -1" }}>
        <SectionTitle title="Modbus Slave Scan" sub="Find the slave (unit) IDs behind this Modbus TCP address without going to the meter panel." />
        <Banner kind="info" style={{ marginBottom: 0 }}>
          Only Modbus needs this step. A unit ID that exists always answers — even with an "Illegal Data Address" exception — while a missing one times out.
          IDs are scanned in blocks of 32 (1–32, 33–64 … 225–247); the whole 1–247 range in one call would be far too slow.
        </Banner>
      </div>
      <Card style={{ padding: 16 }}>
        <CardTitle>Scan Settings</CardTitle>
        <Label>IP Address</Label>
        <Input value={job.ip} readOnly style={{ fontFamily: MONO, marginBottom: 11 }} />
        <Field label="Port" locked={job.locked.port} value={job.port}>
          <InputNumber min={1} max={65535} value={job.port ?? 502} disabled={scan.running} onChange={(v) => patchJob({ port: v ?? 502 })} style={{ width: "100%" }} />
        </Field>
        <Label>Scan Range</Label>
        <div style={{ display: "flex", gap: 10, marginBottom: 11 }}>
          <InputNumber min={1} max={247} value={scan.form.start} disabled={scan.running} onChange={(v) => setScanForm({ start: v ?? 1 })} addonBefore="From" style={{ flex: 1 }} />
          <InputNumber min={1} max={247} value={scan.form.end} disabled={scan.running} onChange={(v) => setScanForm({ end: v ?? 32 })} addonBefore="To" style={{ flex: 1 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 11 }}>
          <div>
            <Label>Probe Address</Label>
            <InputNumber min={0} max={65535} value={scan.form.probe_address} disabled={scan.running} onChange={(v) => setScanForm({ probe_address: v ?? 0 })} style={{ width: "100%" }} />
          </div>
          <div>
            <Label>Timeout per ID (s)</Label>
            <InputNumber min={0.1} max={10} step={0.1} value={scan.form.timeout} disabled={scan.running} onChange={(v) => setScanForm({ timeout: v ?? 0.6 })} style={{ width: "100%" }} />
          </div>
        </div>
        <Checkbox checked={scan.form.stopOnFound} disabled={scan.running} onChange={(e) => setScanForm({ stopOnFound: e.target.checked })} style={{ marginBottom: 14 }}>
          Stop after the first block that answers
        </Checkbox>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button type="primary" size="large" loading={scan.running} onClick={() => runScan()} style={{ background: C.blue, fontWeight: 700 }}>Scan Units</Button>
          {scan.running
            ? <Button size="large" icon={<StopOutlined />} onClick={() => { stopRun("scan"); setScan((s) => ({ ...s, running: false, current: null })); }}>Stop</Button>
            : <Button size="large" onClick={() => runScan(1, 247)}>Scan 1–247 in blocks</Button>}
        </div>
        {(scan.running || scan.blocks.length > 0) && <Progress percent={scan.progress} strokeColor={C.blue} style={{ marginTop: 12 }} />}
        {scan.running && scan.current && (
          <div style={{ fontSize: 12.5, color: C.sub }}>Scanning IDs {scan.current[0]}–{scan.current[1]} · elapsed <Elapsed since={scan.startedAt} /></div>
        )}
      </Card>
      <Card style={{ padding: 16, minWidth: 0 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Scan Result</div>
        <ErrorBanner error={explain(scan.error)} onRetry={() => runScan()} />
        {!scan.blocks.length && !scan.running && !scan.error && <div style={{ color: C.sub, fontSize: 13.5, marginBottom: 12 }}>Run the scan to list the slave IDs that answer.</div>}
        {scan.blocks.length > 0 && (
          <>
            <Banner kind={scan.found.length ? "success" : "warn"}>
              <b>{scan.found.length ? `${scan.found.length} slave ID${scan.found.length > 1 ? "s" : ""} responding: ${scan.found.map((f) => f.unit_id).join(", ")}` : "No slave ID has answered yet."}</b>
              <div style={{ fontSize: 12.5, color: C.text }}>
                Scanned {scan.blocks.reduce((n, b) => n + (Number(b.scanned) || b.range[1] - b.range[0] + 1), 0)} IDs in {scan.blocks.length} {scan.blocks.length === 1 ? "block" : "blocks"}.
              </div>
            </Banner>
            {scan.found.length > 0 && (
              <Table
                size="small" rowKey="unit_id" pagination={false} dataSource={scan.found}
                rowSelection={{ type: "radio", selectedRowKeys: has(scan.chosen) ? [scan.chosen] : [], onChange: (keys) => setScan((s) => ({ ...s, chosen: keys[0] ?? null })) }}
                columns={[
                  { title: "Slave ID", dataIndex: "unit_id", width: 90, render: (t) => <b style={{ fontFamily: MONO }}>{t}</b> },
                  { title: "Response", dataIndex: "response", width: 110, render: (t) => <Tag color={t === "exception" ? "gold" : "green"}>{t === "exception" ? "Exception" : t === "ok" ? "OK" : show(t)}</Tag> },
                  { title: "Note", key: "note", render: (_, r) => <span style={{ fontSize: 12.5 }}>{scanFoundNote(r)}</span> },
                  { title: "Detail", key: "detail", render: (_, r) => <span style={{ fontSize: 12, color: C.sub }}>{scanFoundDetail(r)}</span> },
                ]}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: 13, margin: "12px 0 6px" }}>Blocks scanned</div>
            <Table
              size="small" rowKey={(r) => r.range.join("-")} pagination={false} dataSource={scan.blocks}
              columns={[
                { title: "Range", key: "r", width: 100, render: (_, r) => <span style={{ fontFamily: MONO }}>{r.range[0]}–{r.range[1]}</span> },
                { title: "Scanned", dataIndex: "scanned", width: 84, render: mono },
                { title: "Found", key: "f", width: 70, render: (_, r) => (r.found || []).length },
                { title: "Next step", dataIndex: "next_step", width: 160, render: (t) => nextLabel(t) },
                { title: "Result", key: "message", render: (_, r) => <span style={{ fontSize: 12.5 }}>{scanBlockMessage(r)}</span> },
              ]}
            />
          </>
        )}
        <div style={{ marginTop: 14 }}>
          <Label>Or enter the unit ID</Label>
          <InputNumber min={1} max={247} value={scan.manualUnit} placeholder={has(job.unit_id) ? String(job.unit_id) : "1–247"} onChange={(v) => setScan((s) => ({ ...s, manualUnit: v ?? null, chosen: null }))} style={{ width: 180 }} />
        </div>
      </Card>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <BackBtn disabled={scan.running} onClick={() => setStep("probe")} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {scanNoneYet && nextRange && (scan.last?.next_step === "scan_more_units" || !scan.last?.next_step) && (
            <Button size="large" onClick={() => runScan(nextRange[0], nextRange[1], true)} style={{ borderRadius: 8, fontWeight: 700 }}>
              Scan next range ({nextRange[0]}–{nextRange[1]})
            </Button>
          )}
          {!has(unitPick) && has(job.unit_id) && !scan.running && (
            <Button size="large" onClick={() => goPoints()} style={{ borderRadius: 8 }}>Use unit ID {job.unit_id}</Button>
          )}
          <NextBtn
            disabled={!has(unitPick) || scan.running}
            onClick={() => goPoints(unitPick !== job.unit_id ? { unit_id: unitPick, locked: { ...job.locked, unit_id: false } } : undefined)}
          >
            Next: Read Points{has(unitPick) ? ` (unit ${unitPick})` : ""}
          </NextBtn>
        </div>
      </div>
    </div>
  );

  const screenPoints = job && (
    <div style={{ padding: 22 }}>
      <SectionTitle title="Read Points" sub="Every point the device offers — name, scaled value and unit — in the same shape for all three protocols." />
      <div style={{ display: "grid", gridTemplateColumns: "290px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <Card style={{ padding: 16 }}>
          <CardTitle>Read Settings</CardTitle>
          <KV cols="80px minmax(0, 1fr)" style={{ marginBottom: 12 }} rows={[["Protocol", <ProtoBadge key="p" proto={job.protocol} />], ["IP", job.ip, { mono: true }]]} />
          <Field label="Port" locked={job.locked.port} value={job.port}>
            <InputNumber min={1} max={65535} value={job.port} placeholder={String(PROTO[job.protocol]?.port || "")} disabled={read.running} onChange={(v) => patchJob({ port: v ?? null })} style={{ width: "100%" }} />
          </Field>
          {job.protocol === "modbus" && (
            <Field label="Unit ID" locked={job.locked.unit_id} value={job.unit_id} note={!has(job.unit_id) ? "Empty means the service uses unit 1." : null}>
              <InputNumber min={1} max={247} value={job.unit_id} placeholder="1" disabled={read.running} onChange={(v) => patchJob({ unit_id: v ?? null })} style={{ width: "100%" }} />
            </Field>
          )}
          {job.protocol === "snmp" && (
            <Field label="Community" locked={job.locked.community} value={job.community}>
              <Input value={job.community || ""} placeholder="public" disabled={read.running} onChange={(e) => patchJob({ community: e.target.value || null })} />
            </Field>
          )}
          {job.protocol === "modbus" && (
            <div style={{ marginBottom: 11 }}>
              <Label>Model (used to find the register profile)</Label>
              <AutoComplete
                options={profileModels} value={job.model || ""} disabled={read.running} placeholder="e.g. TRINITY TINYPRO-6" style={{ width: "100%" }}
                onChange={(v) => patchJob({ model: v || null })}
                filterOption={(input, opt) => String(opt?.value || "").toLowerCase().includes(String(input || "").toLowerCase())}
              />
            </div>
          )}
          {job.model_specification_id && <Field label="Model Specification ID" locked value={job.model_specification_id} />}
          {job.protocol === "bacnet" && has(job.bacnet_device_id) && <Field label="BACnet Device ID" locked={!job.manual} value={job.bacnet_device_id} />}
          {job.protocol === "modbus" && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12, fontSize: 13 }}>
              <Switch size="small" checked={read.infer} disabled={read.running} onChange={(v) => setRead((r) => ({ ...r, infer: v }))} style={{ marginTop: 2 }} />
              <span>Infer the register map when no profile is found</span>
            </div>
          )}
          <Button type="primary" size="large" block loading={read.running} disabled={!job.protocol} onClick={() => runRead()} style={{ background: C.blue, fontWeight: 700 }}>
            {rr ? "Read again" : "Read Points"}
          </Button>
          {job.protocol === "snmp" && <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>An SNMP read walks the whole device and can take 2–3 minutes. The page waits up to 5 minutes.</div>}
        </Card>
        <div style={{ minWidth: 0 }}>
          {read.running && (
            <Busy
              since={read.startedAt} title={`Reading points from ${job.ip}…`}
              note={job.protocol === "snmp" ? "The device is being scanned. An SNMP read can take 2–3 minutes — keep this page open." : "Reading every point from the device."}
              onCancel={() => { stopRun("read"); setRead((r) => ({ ...r, running: false })); }}
            />
          )}
          <ErrorBanner error={explain(read.error)} onRetry={() => runRead()}>
            {read.error?.status === 404 && job.protocol === "modbus" && (
              <Button size="small" type="primary" onClick={() => runRead({ infer: true })} style={{ marginTop: 8 }}>Retry with inference</Button>
            )}
          </ErrorBanner>
          {!rr && !read.running && !read.error && <EmptyCard>Press <b>Read Points</b> to read every point from the device.</EmptyCard>}
          {rr && (
            <>
              <Card style={{ padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <CheckCircleFilled style={{ color: C.green }} />
                  <b>{sum.total ?? points.length} points found</b>
                  <span style={{ fontSize: 13, color: C.sub }}>
                    — <b style={{ color: C.blue }}>{sum.measurements ?? grouped.measurement.length} measurement</b>, <b style={{ color: C.violet }}>{sum.info ?? grouped.info.length} info</b>, {sum.other ?? grouped.other.length} other · <b style={{ color: C.text }}>{read.selected.size}</b> selected for bind
                  </span>
                  <span style={{ flex: 1 }} />
                  {srcBadge && <Pill color={srcBadge.color} bg={srcBadge.bg}>{srcBadge.label}</Pill>}
                  {!srcBadge && rr.source && <Pill color={C.sub} bg="#f1f5f9">{rr.source}</Pill>}
                  {rr.source === "profile" && rr.profile_source && <span style={{ fontSize: 12, color: C.sub }}>Profile: {rr.profile_source === "db" ? "Device Management" : rr.profile_source === "builtin" ? "built-in" : rr.profile_source}</span>}
                  {rr.source === "profile" && rr.profile_verified === false && <Pill color={C.amber} bg={C.amberBg}>Unverified profile</Pill>}
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <span>Read at <span style={{ fontFamily: MONO }}>{show(rr.read_at)}</span></span>
                  <span>Port <span style={{ fontFamily: MONO }}>{show(rr.port)}</span></span>
                  <span>Next step: <b>{nextLabel(rr.next_step)}</b></span>
                  <span style={{ flex: 1 }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Switch size="small" checked={read.advanced} onChange={(v) => setRead((r) => ({ ...r, advanced: v }))} /> Advanced columns
                  </span>
                </div>
              </Card>
              {readWarnings(rr).length > 0 && (
                <Banner kind="warn">{readWarnings(rr).map((w) => <div key={w}>{w}</div>)}</Banner>
              )}
              {readRetry && (
                <Banner kind="error" action={<Button size="small" danger icon={<ReloadOutlined />} onClick={() => runRead()}>Retry</Button>}>
                  <b>Bind stays disabled until a read returns measurements.</b> Retry the read.
                </Banner>
              )}
              {needsConfirm && (
                <Banner kind="warn">
                  <b>The tool inferred this register map itself. An engineer must check the points and confirm the mapping before binding.</b>
                  {inferredExtra.length > 0 && (
                    <KV cols="160px minmax(0, 1fr)" style={{ marginTop: 8, color: C.text }} rows={inferredExtra.map((k) => [capitalize(k.replace(/_/g, " ")), summarise(rr[k])])} />
                  )}
                </Banner>
              )}
              {readNotes(rr).length > 0 && (
                <Banner kind="info"><ul style={{ margin: 0, paddingLeft: 18 }}>{readNotes(rr).map((n) => <li key={n}>{n}</li>)}</ul></Banner>
              )}
              <CacheClock receivedAt={read.receivedAt} />
              {GROUPS.map((g) => (
                <PointsSection
                  key={g.key} group={g} points={grouped[g.key]} selected={read.selected} open={read.open[g.key]}
                  onOpen={() => setRead((r) => ({ ...r, open: { ...r.open, [g.key]: !r.open[g.key] } }))}
                  onToggle={togglePoint} onMany={setMany} showConfidence={rr.source === "inferred"}
                  advanced={read.advanced} protocol={job.protocol} onLookupOid={lookupOid}
                />
              ))}
              {!points.length && <EmptyCard>The device returned no points.</EmptyCard>}
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <BackBtn onClick={() => setStep(job.protocol === "modbus" && (scan.blocks.length || probeNext === "scan") ? "scan" : "probe")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {needsConfirm && (
            <Checkbox checked={read.confirmed} onChange={(e) => setRead((r) => ({ ...r, confirmed: e.target.checked }))}>
              I have checked the inferred points and confirm the mapping
            </Checkbox>
          )}
          <NextBtn disabled={!canBind} onClick={() => setStep("bind")}>Next: Bind</NextBtn>
        </div>
      </div>
    </div>
  );

  const bindSummary = job && (
    <Card style={{ padding: 16 }}>
      <KV
        rows={[
          ["Device", job.device_name || "—"],
          ["IP address", job.ip, { mono: true }],
          ["Protocol", <ProtoBadge key="p" proto={job.protocol} />],
          ["Port", show(job.port), { mono: true }],
          job.protocol === "modbus" && ["Unit ID", show(job.unit_id), { mono: true }],
          job.protocol === "snmp" && ["Community", show(job.community || "public"), { mono: true }],
          ["Model", show(job.model)],
          ["Model spec ID", show(job.model_specification_id), { mono: true }],
          ["Device detail ID", job.device_detail_id || "Manual entry — not linked to Device Management", { mono: !!job.device_detail_id }],
          has(job.bacnet_device_id) && ["BACnet device ID", show(job.bacnet_device_id), { mono: true }],
          has(job.gateway_ip) && ["Gateway IP", show(job.gateway_ip), { mono: true }],
          ["Points selected", read.selected.size ? `${read.selected.size} of ${points.length}` : "None — the service chooses the points itself"],
        ]}
      />
    </Card>
  );

  const br = bind.result;
  const bindCounts = br
    ? has(br.timeseries_onboarded) || has(br.attributes_onboarded)
      ? [["Time series", br.timeseries_onboarded, C.blue], ["Attributes", br.attributes_onboarded, C.violet], ["Skipped", br.objects_skipped, C.sub]]
      : [["Objects onboarded", br.objects_onboarded, C.blue], ["Objects found", br.objects_found, C.sub]]
    : [];

  const screenBind = job && (
    <div style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
      <div>
        <SectionTitle title="Bind Device" sub="Onboard the device into the gateway so its data starts flowing." />
        <Card style={{ padding: "10px 14px", marginBottom: 12 }}><div style={{ fontSize: 12.5, color: C.sub }}>The service writes the gateway configuration{bind.restart ? ", restarts the gateway" : ""}{job.device_detail_id ? " and saves the discovery status in Device Management" : ""}.</div></Card>
        {bindSummary}
        <div style={{ marginTop: 12 }}>
          <Label>Device name (must be unique)</Label>
          <Input size="large" value={bind.name} maxLength={120} disabled={bind.running || bindOk} onChange={(e) => setBind((b) => ({ ...b, name: e.target.value }))} />
        </div>
        <Checkbox checked={bind.restart} disabled={bind.running || bindOk} onChange={(e) => setBind((b) => ({ ...b, restart: e.target.checked }))} style={{ marginTop: 10 }}>
          Restart the gateway after binding (recommended, so data starts flowing at once)
        </Checkbox>
        <div style={{ marginTop: 12 }}><CacheClock receivedAt={bindOk ? 0 : read.receivedAt} /></div>
        {bindOk ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 8, background: C.greenBg, color: C.green, fontWeight: 700 }}>
            <CheckCircleFilled /> Bound to the gateway
          </div>
        ) : (
          <Button type="primary" size="large" loading={bind.running} disabled={!bind.name.trim() || !rr} onClick={runBind} style={{ background: C.blue, fontWeight: 700 }}>
            Bind Device
          </Button>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <SectionTitle title="Result" />
        {!br && !bind.running && !bind.error && <EmptyCard>Bind the device to start telemetry.</EmptyCard>}
        {bind.running && (
          <Busy since={bind.startedAt} title="Onboarding the device to the gateway…" note="If the 15-minute scan cache has expired, the service scans the device again first — that can take 2–3 minutes." />
        )}
        <ErrorBanner error={explain(bind.error)} onRetry={runBind} />
        {br && (
          <Card style={{ padding: 16, background: bindOk ? "#f6fdf8" : C.redBg, borderColor: bindOk ? "#b7e4c7" : "#f5c2c2" }}>
            <div style={{ fontWeight: 800, color: bindOk ? C.green : C.red, fontSize: 15 }}>
              {bindOk ? <CheckCircleFilled /> : <ExclamationCircleFilled />} {bindMessage(br, bind.name)}
            </div>
            {bindCounts.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${bindCounts.length}, 1fr)`, gap: 10, marginTop: 14 }}>
                {bindCounts.map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center", padding: 10, borderRadius: 10, background: "#fff", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{show(v)}</div>
                    <div style={{ fontSize: 12.5, color: C.sub }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            <KV
              cols="170px minmax(0, 1fr)" style={{ marginTop: 14 }}
              rows={[
                ["Device name", show(br.device_name || bind.name)],
                has(br.objects_found) && ["Objects found", show(br.objects_found)],
                has(br.reused_scan) && ["Scan reused", br.reused_scan ? "Yes — the cached read was used" : "No — the service scanned the device again"],
                has(br.gateway_pid) && ["Gateway PID", show(br.gateway_pid), { mono: true }],
                has(br.discovery_status_saved) && ["Status saved in DB", br.discovery_status_saved ? "Yes — DiscoveryStatus is onboarded" : "No"],
              ]}
            />
            {br.discovery_status_saved === false && job.device_detail_id && (
              <Banner kind="warn" style={{ marginTop: 12, marginBottom: 0 }}>
                The device is bound, but its discovery status was not saved in Device Management. The device list has been refreshed.
              </Banner>
            )}
            <OnboardedList title="Time series" items={br.timeseries} />
            <OnboardedList title="Attributes" items={br.attributes} />
          </Card>
        )}
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <BackBtn disabled={bind.running} onClick={() => setStep("points")} />
        <NextBtn disabled={!bindOk} onClick={goVerify}>Next: Verify</NextBtn>
      </div>
    </div>
  );

  const vr = verify.result;
  const vPoints = Array.isArray(vr?.points) ? vr.points : [];
  const vShown = verify.showAll || !read.selected.size ? vPoints : vPoints.filter((p) => read.selected.has(p.key));
  const listed = job?.device_detail_id ? targets.find((t) => t.device_detail_id === job.device_detail_id) : null;
  // discovery_status_saved = true means Device Management now says "onboarded", even before the list refresh lands.
  const savedOnboarded = br?.discovery_status_saved === true;
  const statusNow = savedOnboarded ? "onboarded" : listed?.discovery_status || "pending";
  const lastNow = savedOnboarded
    ? (listed?.discovery_status === "onboarded" && listed.last_discovered_at ? listed.last_discovered_at : "Just now")
    : show(listed?.last_discovered_at);

  const screenVerify = job && (
    <div style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 18 }}>
      <div>
        <SectionTitle title="Bound Device" />
        {bindSummary}
        {br && (
          <Card style={{ padding: 16, marginTop: 12 }}>
            <KV
              cols="170px minmax(0, 1fr)"
              rows={[
                ["Device name", show(br.device_name || bind.name)],
                has(br.timeseries_onboarded) && ["Time series onboarded", show(br.timeseries_onboarded)],
                job.device_detail_id && ["Discovery status", <StatusPill key="s" status={statusNow} />],
                job.device_detail_id && ["Last discovered", lastNow],
              ]}
            />
          </Card>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <SectionTitle title="Verify" sub="Read live values straight from the device." />
        <Card style={{ padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: C.sub }}>
            If values arrive here but not on the dashboard, the device, network and register map are fine — the problem is on the gateway / MQTT side.
            Telemetry can take 10–30 seconds to appear after bind.
          </div>
        </Card>
        {verify.running && (
          <Busy
            since={verify.startedAt} title="Reading live values…" note={job.protocol === "snmp" ? "An SNMP read can take 2–3 minutes." : null}
            onCancel={() => { stopRun("verify"); setVerify((v) => ({ ...v, running: false })); }}
          />
        )}
        <ErrorBanner error={explain(verify.error)} onRetry={() => runVerify()} />
        {!vr && !verify.running && !verify.error && (
          <EmptyCard><Button type="primary" onClick={() => runVerify()} style={{ background: C.blue, fontWeight: 700 }}>Run Verify</Button></EmptyCard>
        )}
        {vr && (
          <Card style={{ padding: 16 }}>
            <Banner kind={vr.verified ? "success" : "error"}>
              <div style={{ fontWeight: 800 }}>{vr.verified ? "Verified — live values are arriving." : "Verification failed."}</div>
              <div style={{ color: C.text }}>{verifyMessage(vr)}</div>
              {!vr.verified && <div style={{ fontSize: 12.5, color: C.text, marginTop: 3 }}>Check the device power, wiring and unit ID, then verify again.</div>}
            </Banner>
            <KV cols="150px minmax(0, 1fr)" style={{ marginBottom: 12 }} rows={[["Live points", show(vr.live_point_count)], has(vr.read_at) && ["Read at", show(vr.read_at), { mono: true }], has(vr.source) && ["Source", show(vr.source)]]} />
            {readWarnings(vr).length > 0 && <Banner kind="warn">{readWarnings(vr).map((w) => <div key={w}>{w}</div>)}</Banner>}
            {vPoints.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <b style={{ fontSize: 13.5 }}>{verify.showAll || !read.selected.size ? "All points" : "Bound points"} ({vShown.length})</b>
                  <span style={{ flex: 1 }} />
                  {read.selected.size > 0 && <Checkbox checked={verify.showAll} onChange={(e) => setVerify((v) => ({ ...v, showAll: e.target.checked }))}>Show all points</Checkbox>}
                </div>
                <Table
                  size="small" rowKey="key" dataSource={vShown} pagination={vShown.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
                  onRow={(r) => (r.error ? { style: { background: C.redBg } } : {})}
                  columns={[
                    { title: "Point", dataIndex: "display_name", render: (t, r) => <span style={{ fontWeight: 600 }}>{t || r.key}</span> },
                    { title: "Live value", key: "v", width: 170, render: (_, r) => <span><b style={{ fontFamily: MONO, color: r.error ? C.red : C.blue }}>{fmtValue(r.value)}</b>{r.unit && <span style={{ color: C.sub, marginLeft: 5 }}>{r.unit}</span>}</span> },
                    { title: "Status", key: "s", width: 92, render: (_, r) => (r.error ? <Tooltip title={pointError(r)}><Tag color="red">Error</Tag></Tooltip> : <Tag color="green">Live</Tag>) },
                  ]}
                />
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {vr.verified ? (
                <Button size="large" type="primary" style={{ background: C.green, fontWeight: 700 }} onClick={finish}>Done</Button>
              ) : (
                <>
                  <Button size="large" type="primary" icon={<ReloadOutlined />} onClick={() => runVerify()} style={{ background: C.blue, fontWeight: 700 }}>Verify again</Button>
                  <Button size="large" onClick={finish}>Back to device list</Button>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-start" }}>
        <BackBtn disabled={verify.running} onClick={() => setStep("bind")} />
      </div>
    </div>
  );

  const screenProfiles = (
    <div style={{ padding: 22 }}>
      <SectionTitle
        title="Register Profiles"
        sub="Models that already have a register map. Devices of these models are onboarded without manual work."
        extra={<Button size="large" icon={<ReloadOutlined />} loading={profilesQ.loading} onClick={loadProfiles}>Refresh</Button>}
      />
      <ErrorBanner error={explain(profilesQ.error)} onRetry={loadProfiles} />
      {profilesNote(profilesQ.data?.note) && <Banner kind="info">{profilesNote(profilesQ.data.note)}</Banner>}
      <Card style={{ overflow: "hidden" }}>
        <Table
          size="middle" loading={profilesQ.loading} dataSource={profileList} pagination={profileList.length > 15 ? { pageSize: 15, showSizeChanger: false } : false}
          rowKey={(r) => r.profile_id || r.key || `${r.source}-${r.model}`}
          locale={{ emptyText: profilesQ.error ? "The profiles could not be loaded." : "No profiles yet." }}
          columns={[
            { title: "Model", dataIndex: "model", render: (t) => <b>{show(t)}</b> },
            { title: "Model No.", dataIndex: "model_number", render: (t) => show(t) },
            { title: "Protocol", dataIndex: "protocol", width: 110, render: (t) => (t ? <ProtoBadge proto={t} /> : <span style={{ color: C.sub }}>—</span>) },
            { title: "Points / Registers", key: "n", width: 150, render: (_, r) => show(r.point_count ?? r.register_count) },
            {
              title: "Verified", key: "v", width: 130,
              render: (_, r) => (r.source === "builtin" ? <Tag color="green">Verified map</Tag> : r.is_verified ? <Tag color="green">Verified</Tag> : <Tag color="orange">Unverified</Tag>),
            },
            { title: "Source", dataIndex: "source", width: 170, render: (t) => <Tag color={t === "db" ? "blue" : "default"}>{t === "db" ? "Device Management" : t === "builtin" ? "Built-in" : show(t)}</Tag> },
            { title: "ID", key: "id", render: (_, r) => mono(r.profile_id || r.key) },
          ]}
        />
      </Card>
    </div>
  );

  const screenGateway = (
    <div style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.7fr)", gap: 18, alignItems: "start" }}>
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>Restart Gateway</div>
        <div style={{ fontSize: 13, color: C.sub, margin: "4px 0 14px", lineHeight: 1.55 }}>
          Bind restarts the gateway on its own. Use this only after the gateway configuration was changed by hand, or when the gateway is stuck.
        </div>
        <Button danger size="large" icon={<PoweroffOutlined />} loading={restartQ.running} onClick={askRestart}>Restart Gateway</Button>
        <ErrorBanner error={explain(restartQ.error)} style={{ marginTop: 12 }} />
        {restartQ.result && (
          <Banner kind="success" style={{ marginTop: 12 }}>
            <b>{restartMessage(restartQ.result)}</b>
            {restartQ.at && <div style={{ fontSize: 12.5, color: C.text }}>at {restartQ.at.toLocaleTimeString()}</div>}
            {has(restartQ.result.gateway_pid) && <div style={{ fontSize: 12.5, color: C.text }}>Gateway PID {restartQ.result.gateway_pid}</div>}
          </Banner>
        )}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 14 }}>
          <CardTitle>Service Status</CardTitle>
          <KV
            cols="140px minmax(0, 1fr)"
            rows={[
              ["Service", svcState === "ok" ? `${show(service.info?.service)} ${show(service.info?.version)} — ${show(service.info?.status)}` : service.infoError?.message || "Checking…"],
              ["Device DB", service.dbLoading ? "Checking…" : service.db ? (service.db.connected ? "Connected" : `Not connected — ${dbMessage(service.db)}`) : service.dbError?.message || "Checking…"],
            ]}
          />
          <Button size="small" icon={<ReloadOutlined />} loading={service.loading || service.dbLoading} onClick={loadService} style={{ marginTop: 10 }}>Check again</Button>
        </div>
      </Card>
      <Card style={{ padding: 16, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Gateway Registry</div>
          <Button icon={<ReloadOutlined />} loading={registryQ.loading} onClick={loadRegistry}>Refresh</Button>
        </div>
        <div style={{ fontSize: 13, color: C.sub, margin: "4px 0 12px" }}>BACnet devices this service has onboarded{registryQ.data ? ` — ${registryQ.data.count ?? regRows.length} in total` : ""}.</div>
        <ErrorBanner error={explain(registryQ.error)} onRetry={loadRegistry} />
        <ErrorBanner error={explain(removeQ.error)} />
        {removeQ.message && <Banner kind="success">{removeQ.message}</Banner>}
        <Table
          size="small" loading={registryQ.loading} dataSource={regRows} rowKey="_k" pagination={regRows.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
          locale={{ emptyText: registryQ.error ? "The registry could not be loaded." : "No BACnet devices in the registry." }}
          columns={[
            { title: "IP Address", dataIndex: "ip", width: 140, render: (t) => <span style={{ fontFamily: MONO }}>{show(t)}</span> },
            { title: "Device Name", key: "n", render: (_, r) => <b>{show(r.device_name || r.name)}</b> },
            { title: "BACnet ID", key: "id", width: 110, render: (_, r) => mono(r.device_id ?? r.bacnet_device_id) },
            { title: "Objects", key: "o", width: 90, render: (_, r) => show(r.objects_onboarded ?? r.objects_found ?? r.point_count ?? (Array.isArray(r.objects) ? r.objects.length : null)) },
            {
              title: "", key: "x", width: 110,
              render: (_, r) => (
                <Button danger size="small" icon={<DeleteOutlined />} loading={removeQ.ip === r.ip} disabled={!r.ip} onClick={() => askRemove(r.ip)}>Remove</Button>
              ),
            },
          ]}
        />
        <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>
          Removing a device writes the gateway configuration again without it.
        </div>
      </Card>
    </div>
  );

  const screenOid = (
    <div style={{ padding: 22, maxWidth: 920 }}>
      <SectionTitle title="OID Lookup" sub="What an SNMP OID means — its name, unit, scale and phase." />
      <Card style={{ padding: 16 }}>
        <Input.Search
          size="large" placeholder="e.g. 1.3.6.1.4.1.3711.24.1.1.7.3.1.1.4.1" enterButton="Resolve" allowClear
          value={oidQ.oid} loading={oidQ.running} onChange={(e) => setOidQ((s) => ({ ...s, oid: e.target.value }))} onSearch={(v) => runOid(v)}
          style={{ fontFamily: MONO }}
        />
        <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>Tip: on Read Points, turn on Advanced columns and click an SNMP address to look it up here.</div>
        <div style={{ marginTop: 14 }}>
          <ErrorBanner error={explain(oidQ.error)} onRetry={() => runOid()} />
          {oidQ.result && typeof oidQ.result === "object" && (
            <KV cols="170px minmax(0, 1fr)" rows={flatRows(oidQ.result).map(([k, v]) => [k, typeof v === "string" ? toEnglish(v, "—") : fmtValue(v), { mono: true }])} />
          )}
          {has(oidQ.result) && typeof oidQ.result !== "object" && <div style={{ fontFamily: MONO }}>{String(oidQ.result)}</div>}
        </div>
      </Card>
    </div>
  );

  // ── layout ────────────────────────────────────────────────────────────────
  const activeStep = job ? step : "list";
  const stepIdx = STEPS.findIndex((s) => s.key === activeStep);
  const skipped = job?.protocol && job.protocol !== "modbus" ? ["scan"] : !scan.blocks.length && stepIdx > 2 ? ["scan"] : [];
  const screen = (job && { probe: screenProbe, scan: screenScan, points: screenPoints, bind: screenBind, verify: screenVerify }[step]) || screenList;
  const tabCount = { profiles: profilesQ.data ? profileList.length : null, gateway: registryQ.data ? registryQ.data.count ?? regRows.length : null };

  return (
    <div style={{ minHeight: "100%", background: "#eef3f9", padding: 14, fontFamily: FONT, color: C.text, fontSize: 14 }}>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(16,40,80,.08)" }}>
        {/* title bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "14px 22px", background: `linear-gradient(90deg, ${C.navy}, ${C.blue})`, color: "#fff" }}>
          <ApiOutlined style={{ fontSize: 24 }} />
          <span style={{ fontSize: 19, fontWeight: 800 }}>Protocol Service - Discovery Tool</span>
          <span style={{ flex: 1 }} />
          <Chip state={svcState} title={service.infoError ? service.infoError.message : service.info ? `${show(service.info.service)} ${show(service.info.version)} — ${show(service.info.status)}` : "Checking the service…"}>
            {svcState === "wait" ? "Checking service…" : svcState === "ok" ? `Service ${service.info?.status || "running"}` : "Service unreachable"}
          </Chip>
          <Chip state={dbState} title={service.db ? dbMessage(service.db) : service.dbError?.message || "Device Management database"}>
            {dbState === "wait" ? "Checking DB…" : dbState === "ok" ? "Device DB connected" : "Device DB not connected"}
          </Chip>
          <Tooltip title="Check the service and DB again">
            <Button size="small" type="text" icon={<ReloadOutlined />} loading={service.loading || service.dbLoading} onClick={loadService} style={{ color: "#fff" }} />
          </Tooltip>
          <span style={{ fontSize: 13, padding: "2px 9px", borderRadius: 999, background: "rgba(255,255,255,.18)" }}>v{service.info?.version || "1.1"}</span>
        </div>
        {/* tabs */}
        <div style={{ display: "flex", gap: 2, padding: "0 14px", borderBottom: `1px solid ${C.border}`, background: "#f8fafd", overflowX: "auto" }}>
          {[["discovery", "Discovery"], ["profiles", "Profiles"], ["gateway", "Gateway"], ["oid", "OID Lookup"]].map(([k, label]) => (
            <button
              key={k} type="button" onClick={() => setTab(k)}
              style={{ padding: "11px 16px", border: "none", background: "transparent", borderBottom: `3px solid ${tab === k ? C.blue : "transparent"}`, color: tab === k ? C.blue : C.sub, fontWeight: 700, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {label}{has(tabCount[k]) ? ` (${tabCount[k]})` : ""}
            </button>
          ))}
        </div>
        {tab === "discovery" && (
          <>
            <Stepper step={activeStep} skipped={skipped} done={!!vr?.verified && step === "verify"} />
            {job && step !== "list" && <div style={{ padding: "16px 22px 0" }}><DeviceStrip job={job} /></div>}
            {screen}
          </>
        )}
        {tab === "profiles" && screenProfiles}
        {tab === "gateway" && screenGateway}
        {tab === "oid" && screenOid}
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginTop: 8, textAlign: "center" }}>
        Protocol discovery runs on static demo data — no device is contacted.
      </div>

      {/* manual IP */}
      <Modal
        open={manual.open} title="Add a device by IP address" okText="Probe this IP"
        okButtonProps={{ disabled: !isIp(manual.ip) }} onOk={openManual} onCancel={() => setManual((m) => ({ ...m, open: false }))}
      >
        <Label>IP address *</Label>
        <Input
          size="large" placeholder="e.g. 172.17.4.50" value={manual.ip} status={manual.ip && !isIp(manual.ip) ? "error" : undefined}
          onChange={(e) => setManual((m) => ({ ...m, ip: e.target.value.trim() }))} onPressEnter={openManual} style={{ fontFamily: MONO }}
        />
        <div style={{ height: 12 }} />
        <Label>Device name (optional)</Label>
        <Input size="large" placeholder="Used as the device name when it is bound" value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} />
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 10 }}>
          The probe checks Modbus, SNMP and BACnet on this address. A device added here is not linked to Device Management, so no discovery status is saved for it.
        </div>
      </Modal>

      {/* details needed before discovery (ready_for_zero_touch = false) */}
      <Modal
        open={!!prepare} title={`Details needed for ${prepare?.target?.device_name || prepare?.target?.ip || "this device"}`}
        okText="Continue to Probe" onOk={confirmPrepare} onCancel={() => setPrepare(null)}
      >
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>
          This device is not ready for zero-touch discovery: Device Management is missing its protocol or unit ID.
        </div>
        <Label>Protocol</Label>
        <Select
          value={prepare?.protocol} onChange={(v) => setPrepare((p) => ({ ...p, protocol: v }))} style={{ width: "100%", marginBottom: 12 }}
          options={[
            { value: "auto", label: "Not sure — let the probe detect it" },
            { value: "modbus", label: "Modbus TCP" },
            { value: "snmp", label: "SNMP" },
            { value: "bacnet", label: "BACnet/IP" },
          ]}
        />
        {(prepare?.protocol === "modbus" || prepare?.protocol === "auto") && !has(prepare?.target?.unit_id) && (
          <>
            <Label>Unit ID (Modbus slave ID)</Label>
            <InputNumber min={1} max={247} value={prepare?.unit_id} placeholder="Leave empty to find it with the slave scan" onChange={(v) => setPrepare((p) => ({ ...p, unit_id: v ?? null }))} style={{ width: "100%" }} />
          </>
        )}
        {prepare?.protocol === "snmp" && !has(prepare?.target?.community) && (
          <>
            <Label>Community</Label>
            <Input value={prepare?.community} onChange={(e) => setPrepare((p) => ({ ...p, community: e.target.value }))} />
          </>
        )}
      </Modal>

      {/* confirm for gateway restart / registry remove */}
      <Modal
        open={!!confirmBox} title={confirmBox?.title} okText={confirmBox?.okText} okButtonProps={{ danger: true }}
        onCancel={() => setConfirmBox(null)}
        onOk={() => { const fn = confirmBox?.onOk; setConfirmBox(null); if (fn) fn(); }}
      >
        <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>{confirmBox?.body}</div>
      </Modal>
    </div>
  );
}
