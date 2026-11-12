// ChangeManagement.jsx — Ticket Management ▸ Change Management
// What changed, when, and by whom: this month's change requests (the same 42
// the Dashboard counts), the change log built from them, and the live
// activity of the portal (tickets raised by the 5D View, reassigned, closed).
import React, { useMemo, useState } from "react";
import { Table, Tag, Input, Select, Button, Tabs, Modal, Tooltip, Badge } from "antd";
import {
  SwapOutlined, SearchOutlined, FileTextOutlined, DownloadOutlined, PrinterOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, FieldTimeOutlined,
  ExclamationCircleOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import {
  CHANGE_REQUESTS, CHANGE_SUMMARY, CHANGE_LOG, PEOPLE,
} from "../Component/Tickets/changeAuditData";
import { useTicketStore } from "../Component/Tickets/ticketStore";
import { downloadCsv, htmlTable, printReport } from "../Component/Tickets/reportUtils";

const CAT_COLOR = {
  Power: "#d97706", Cooling: "#0891b2", Network: "#4f46e5", Security: "#dc2626",
  Hardware: "#2563eb", Software: "#7c3aed", Application: "#0d9488", Facility: "#64748b",
};
const TYPE_COLOR = { Standard: "green", Normal: "blue", Emergency: "red" };
const RISK_COLOR = { Low: "green", Medium: "gold", High: "red" };
const STATUS_COLOR = { Completed: "green", Approved: "blue", "In Progress": "purple", "Pending Approval": "orange", Submitted: "default" };
const ACTION_COLOR = { Raised: "#64748b", Approved: "#2563eb", Implemented: "#059669" };

const page = { minHeight: "100%", background: "#f4f7fc", padding: "14px 18px 22px", fontSize: 14, color: "#0f172a" };

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 170, borderRadius: 14, padding: "14px 16px",
      border: `1px solid ${color}33`, boxShadow: "0 2px 10px rgba(15,23,42,.06)",
      background: `linear-gradient(135deg, ${color}14, #ffffff 60%)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          background: color, color: "#fff", fontSize: 18, boxShadow: `0 6px 14px ${color}55`,
        }}>{icon}</span>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</div>
        </div>
      </div>
      {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

const crColumns = [
  { title: "CR", key: "id", value: (r) => r.id },
  { title: "Title", key: "title" },
  { title: "Asset", key: "asset" },
  { title: "Category", key: "category" },
  { title: "Type", key: "type" },
  { title: "Risk", key: "risk" },
  { title: "Status", key: "status" },
  { title: "Requested by", key: "requestedBy" },
  { title: "Approved by", key: "approvedBy" },
  { title: "Implemented by", key: "implementedBy" },
  { title: "Raised", key: "raisedOn" },
  { title: "Completed", key: "completedOn" },
  { title: "On time", key: "onTime", value: (r) => (r.onTime == null ? "—" : r.onTime ? "Yes" : "No") },
  { title: "Before", key: "before" },
  { title: "After", key: "after" },
  { title: "Ticket", key: "ticket" },
];

export default function ChangeManagement() {
  const activity = useTicketStore((s) => s.activity);
  const [tab, setTab] = useState("requests");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [state, setState] = useState("all");
  const [who, setWho] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);

  const people = useMemo(() => [...new Set(CHANGE_REQUESTS.flatMap((c) => [c.requestedBy, c.approvedBy, c.implementedBy]).filter(Boolean))], []);
  const match = (text) => !q || String(text || "").toLowerCase().includes(q.toLowerCase());

  const requests = CHANGE_REQUESTS.filter((c) =>
    (cat === "all" || c.category === cat)
    && (state === "all" || (state === "open" ? c.open : !c.open))
    && (who === "all" || [c.requestedBy, c.approvedBy, c.implementedBy].includes(who))
    && (match(c.id) || match(c.title) || match(c.asset) || match(c.before) || match(c.after)));

  const log = CHANGE_LOG.filter((r) =>
    (cat === "all" || r.category === cat) && (who === "all" || r.actor === who)
    && (match(r.ref) || match(r.what) || match(r.asset) || match(r.from) || match(r.to)));

  const live = activity.filter((a) => (who === "all" || a.actor === who) && (match(a.ref) || match(a.what) || match(a.device)));

  const s = CHANGE_SUMMARY;
  const onTimePct = Math.round((s.onTime / s.completed) * 1000) / 10;

  const requestCols = [
    { title: "CR", dataIndex: "id", width: 96, render: (t) => <b style={{ color: "#1d4ed8", fontFamily: "'JetBrains Mono', monospace" }}>{t}</b>, sorter: (a, b) => a.id.localeCompare(b.id), defaultSortOrder: "descend" },
    { title: "What is changing", dataIndex: "title", render: (t, r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{t}</div>
        {r.after && <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2 }}><span style={{ color: "#b91c1c" }}>{r.before}</span> → <span style={{ color: "#047857" }}>{r.after}</span></div>}
      </div>
    ) },
    { title: "Asset", key: "asset", width: 124, render: (_, r) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <Tag style={{ fontSize: 12.5, marginInlineEnd: 0 }}>{r.asset}</Tag>
        <Tag color={CAT_COLOR[r.category]} style={{ fontSize: 12.5, marginInlineEnd: 0 }}>{r.category}</Tag>
      </div>
    ) },
    { title: "Type / risk", key: "type", width: 120, render: (_, r) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <Tag color={TYPE_COLOR[r.type]} style={{ marginInlineEnd: 0 }}>{r.type}</Tag>
        <Tag color={RISK_COLOR[r.risk]} style={{ marginInlineEnd: 0 }}>{r.risk} risk</Tag>
      </div>
    ) },
    { title: "Who", key: "who", width: 196, render: (_, r) => (
      <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
        <div>Raised: <b>{r.requestedBy}</b></div>
        <div>Approved: <b>{r.approvedBy || "—"}</b></div>
        <div>{r.open ? "Owner" : "Done by"}: <b>{r.implementedBy}</b></div>
      </div>
    ) },
    { title: "When", key: "when", width: 168, render: (_, r) => (
      <div style={{ fontSize: 12.5, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
        <div>{r.raisedOn}</div>
        <div style={{ color: r.completedOn ? "#047857" : "#94a3b8" }}>{r.completedOn || r.window}</div>
      </div>
    ), sorter: (a, b) => (a.raisedOn < b.raisedOn ? -1 : 1) },
    { title: "Status", key: "status", width: 150, render: (_, r) => (
      <div>
        <Tag color={STATUS_COLOR[r.status]} style={{ fontSize: 12.5 }}>{r.status}</Tag>
        {r.onTime === false && <div><Tag color="volcano" style={{ marginTop: 4 }}>late</Tag></div>}
        {r.ticket && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>fixes {r.ticket}</div>}
      </div>
    ) },
  ];

  const logCols = [
    { title: "When", dataIndex: "at", width: 150, render: (t) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{t}</span> },
    { title: "Who", dataIndex: "actor", width: 150, render: (t) => <b>{t}</b> },
    { title: "Action", dataIndex: "action", width: 120, render: (t) => <Tag color={ACTION_COLOR[t]} style={{ fontSize: 12.5 }}>{t}</Tag> },
    { title: "CR", dataIndex: "ref", width: 96, render: (t) => <span style={{ color: "#1d4ed8", fontWeight: 700 }}>{t}</span> },
    { title: "Asset", dataIndex: "asset", width: 110, render: (t) => <Tag>{t}</Tag> },
    { title: "What changed", key: "what", render: (_, r) => (
      <div>
        <div>{r.what}</div>
        {r.from && <div style={{ fontSize: 12.5, marginTop: 2 }}><span style={{ color: "#b91c1c" }}>{r.from}</span> → <span style={{ color: "#047857" }}>{r.to}</span></div>}
      </div>
    ) },
  ];

  const liveCols = [
    { title: "When", dataIndex: "at", width: 170, render: (t) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{t}</span> },
    { title: "Who", dataIndex: "actor", width: 170, render: (t) => <b>{t}</b> },
    { title: "Change", dataIndex: "what" },
    { title: "From → to", key: "ft", render: (_, a) => (a.from || a.to) && a.kind !== "ticket.created"
      ? <span><span style={{ color: "#b91c1c" }}>{a.from}</span> → <span style={{ color: "#047857" }}>{a.to}</span></span>
      : <span style={{ color: "#64748b" }}>{a.to || "—"}</span> },
    { title: "Asset", dataIndex: "device", width: 130, render: (t) => (t ? <Tag>{t}</Tag> : "—") },
    { title: "Note", dataIndex: "note", render: (t) => <span style={{ color: "#64748b" }}>{t || ""}</span> },
  ];

  const generateReport = () => setReportOpen(true);
  const csv = () => downloadCsv(`change-management-${new Date().toISOString().slice(0, 10)}.csv`, CHANGE_REQUESTS, crColumns);
  const print = () => printReport({
    title: "Change Management Report",
    subtitle: `This month's change requests — ${s.raised} raised, ${s.completed} completed, ${s.open} open`,
    kpis: [["Raised", s.raised], ["Completed", s.completed], ["On time", `${s.onTime} (${onTimePct}%)`], ["Avg approval", `${s.avgApprovalDays} days`]],
    sections: [
      { title: "Open change requests", html: htmlTable(CHANGE_REQUESTS.filter((c) => c.open), [
        { title: "CR", key: "id" }, { title: "Title", key: "title" }, { title: "Asset", key: "asset" }, { title: "Status", key: "status" },
        { title: "Risk", key: "risk" }, { title: "Requested by", key: "requestedBy" }, { title: "Window", key: "window" }]) },
      { title: "Completed late (outside the approved window)", html: htmlTable(CHANGE_REQUESTS.filter((c) => c.onTime === false), [
        { title: "CR", key: "id" }, { title: "Title", key: "title" }, { title: "Done by", key: "implementedBy" }, { title: "Completed", key: "completedOn" }, { title: "After", key: "after" }]) },
      { title: "All change requests", html: htmlTable(CHANGE_REQUESTS, [
        { title: "CR", key: "id" }, { title: "Title", key: "title" }, { title: "Asset", key: "asset" }, { title: "Category", key: "category" },
        { title: "Type", key: "type" }, { title: "Status", key: "status" }, { title: "Requested", key: "requestedBy" }, { title: "Approved", key: "approvedBy" },
        { title: "Done by", key: "implementedBy" }, { title: "Completed", key: "completedOn" }, { title: "Before → after", value: (r) => (r.after ? `${r.before} → ${r.after}` : "") }]) },
      { title: "Change log", html: htmlTable(CHANGE_LOG, [
        { title: "When", key: "at" }, { title: "Who", key: "actor" }, { title: "Action", key: "action" }, { title: "CR", key: "ref" },
        { title: "Asset", key: "asset" }, { title: "What", key: "what" }]) },
      ...(activity.length ? [{ title: "Portal activity (tickets)", html: htmlTable(activity, [
        { title: "When", key: "at" }, { title: "Who", key: "actor" }, { title: "Change", key: "what" }, { title: "From", key: "from" }, { title: "To", key: "to" }]) }] : []),
    ],
  });

  return (
    <div style={page}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{
          width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", fontSize: 22, boxShadow: "0 8px 20px rgba(79,70,229,.35)",
        }}><SwapOutlined /></span>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Change Management</div>
          <div style={{ fontSize: 13.5, color: "#475569" }}>What changed, when and by whom — this month's change requests, the change log and today's ticket activity.</div>
        </div>
        <Button icon={<DownloadOutlined />} onClick={csv}>Export CSV</Button>
        <Button type="primary" icon={<FileTextOutlined />} onClick={generateReport}>Generate report</Button>
      </div>

      {/* stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <StatCard icon={<AppstoreOutlined />} label="Raised this month" value={s.raised} color="#2563eb" sub="Last 30 days · same 42 as the Dashboard" />
        <StatCard icon={<ClockCircleOutlined />} label="Open" value={s.open} color="#f59e0b" sub={`${CHANGE_REQUESTS.filter((c) => c.status === "Pending Approval").length} waiting for approval`} />
        <StatCard icon={<CheckCircleOutlined />} label="Completed" value={s.completed} color="#059669" sub={`${s.onTime} on time · ${s.late} late`} />
        <StatCard icon={<FieldTimeOutlined />} label="On time" value={`${onTimePct}%`} color="#0891b2" sub="Within the approved window" />
        <StatCard icon={<ThunderboltOutlined />} label="Emergency" value={s.emergency} color="#dc2626" sub="Approved the same day" />
        <StatCard icon={<ExclamationCircleOutlined />} label="Avg approval" value={`${s.avgApprovalDays} d`} color="#7c3aed" sub="Raised → approved" />
      </div>

      {/* filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 12px", marginBottom: 12, border: "1px solid #e2e8f0" }}>
        <Input allowClear prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Search CR, asset or what changed"
          value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <Select value={cat} onChange={setCat} style={{ width: 160 }}
          options={[{ value: "all", label: "All categories" }, ...Object.keys(CAT_COLOR).map((c) => ({ value: c, label: c }))]} />
        <Select value={state} onChange={setState} style={{ width: 150 }}
          options={[{ value: "all", label: "Open + completed" }, { value: "open", label: "Open only" }, { value: "done", label: "Completed only" }]} />
        <Select value={who} onChange={setWho} style={{ width: 190 }} showSearch
          options={[{ value: "all", label: "Anyone" }, ...people.map((p) => ({ value: p, label: p }))]} />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "#64748b" }}>{Object.values(PEOPLE).filter((p) => people.includes(p.name)).length} people involved</span>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: "4px 14px 12px", border: "1px solid #e2e8f0" }}>
        <Tabs activeKey={tab} onChange={setTab} size="large" items={[
          { key: "requests", label: <span>Change requests <Badge count={requests.length} showZero overflowCount={999} color="#2563eb" /></span>, children: (
            <Table rowKey="id" columns={requestCols} dataSource={requests} size="middle" pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1100 }} />
          ) },
          { key: "log", label: <span>Change log <Badge count={log.length} showZero overflowCount={999} color="#059669" /></span>, children: (
            <Table rowKey={(r, i) => `${r.ref}-${r.action}-${i}`} columns={logCols} dataSource={log} size="middle" pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1000 }} />
          ) },
          { key: "live", label: <span>Ticket activity <Badge count={live.length} showZero overflowCount={999} color="#e8304a" /></span>, children: (
            live.length ? (
              <Table rowKey={(r, i) => `${r.at}-${i}`} columns={liveCols} dataSource={live} size="middle" pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1000 }} />
            ) : (
              <div style={{ padding: "40px 10px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                No ticket changes yet. Fail a device in the 5D View's Simulate mode, or reassign a ticket — every change shows up here with who made it.
              </div>
            )
          ) },
        ]} />
      </div>

      <Modal open={reportOpen} onCancel={() => setReportOpen(false)} width={900} title="Change Management Report" footer={[
        <Button key="csv" icon={<DownloadOutlined />} onClick={csv}>Download CSV</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={print}>Print / Save as PDF</Button>,
      ]}>
        <div style={{ fontSize: 13.5, color: "#475569", marginBottom: 12 }}>
          Generated {new Date().toLocaleString()} · this month · {s.raised} change requests
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {[["Raised", s.raised, "#2563eb"], ["Completed", s.completed, "#059669"], ["On time", `${onTimePct}%`, "#0891b2"], ["Open", s.open, "#f59e0b"]].map(([l, v, c]) => (
            <div key={l} style={{ border: `1px solid ${c}44`, background: `${c}10`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 12.5, color: "#334155" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontWeight: 800, margin: "6px 0" }}>By category</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.entries(s.byCategory).map(([c, n]) => <Tag key={c} color={CAT_COLOR[c]} style={{ fontSize: 13, padding: "3px 10px" }}>{c}: {n}</Tag>)}
        </div>
        <div style={{ fontWeight: 800, margin: "6px 0" }}>Completed late</div>
        {CHANGE_REQUESTS.filter((c) => c.onTime === false).map((c) => (
          <div key={c.id} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
            <b style={{ color: "#1d4ed8" }}>{c.id}</b> {c.title} — {c.implementedBy}, {c.completedOn}. <span style={{ color: "#64748b" }}>{c.after}</span>
          </div>
        ))}
        <div style={{ fontWeight: 800, margin: "12px 0 6px" }}>Open</div>
        {CHANGE_REQUESTS.filter((c) => c.open).map((c) => (
          <div key={c.id} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
            <b style={{ color: "#1d4ed8" }}>{c.id}</b> {c.title} — <Tag color={STATUS_COLOR[c.status]}>{c.status}</Tag> {c.window}
          </div>
        ))}
        <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 12 }}>
          The printed report adds the full list of change requests, the change log{activity.length ? " and today's ticket activity" : ""}.
        </div>
      </Modal>
    </div>
  );
}
