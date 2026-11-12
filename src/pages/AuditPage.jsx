// AuditPage.jsx — Ticket Management ▸ Audit
// Verify: every completed change checked against its approval, every asset
// on the floor checked against the 5D View's register, and a trail of who
// did what (including today's ticket activity).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Table, Tag, Input, Select, Button, Tabs, Modal, Progress, Badge } from "antd";
import {
  AuditOutlined, SearchOutlined, FileTextOutlined, DownloadOutlined, PrinterOutlined,
  SafetyCertificateOutlined, CheckCircleOutlined, EyeOutlined, TagsOutlined, ScanOutlined, TeamOutlined,
} from "@ant-design/icons";
import {
  CHANGE_VERIFICATION, ASSET_AUDIT, AUDIT_TRAIL, CHANGE_SUMMARY,
} from "../Component/Tickets/changeAuditData";
import { useTicketStore } from "../Component/Tickets/ticketStore";
import { downloadCsv, htmlTable, printReport } from "../Component/Tickets/reportUtils";

const RESULT_COLOR = { Verified: "green", Observation: "gold", "Non-conformance": "red" };
const AREA_COLOR = { Change: "#2563eb", Audit: "#059669", Ticket: "#e8304a" };
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

export default function AuditPage() {
  const activity = useTicketStore((s) => s.activity);
  const [tab, setTab] = useState("changes");
  const [q, setQ] = useState("");
  const [result, setResult] = useState("all");
  const [area, setArea] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);

  // "Verify now": re-check the register against the 5D View (static, animated).
  const [verify, setVerify] = useState({ running: false, done: 0, lastRun: ASSET_AUDIT.date });
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const runVerification = () => {
    clearInterval(timer.current);
    setVerify({ running: true, done: 0, lastRun: verify.lastRun });
    timer.current = setInterval(() => {
      setVerify((v) => {
        const done = Math.min(ASSET_AUDIT.total, v.done + 37);
        if (done >= ASSET_AUDIT.total) {
          clearInterval(timer.current);
          return { running: false, done, lastRun: new Date().toLocaleString() };
        }
        return { ...v, done };
      });
    }, 90);
  };

  const match = (t) => !q || String(t || "").toLowerCase().includes(q.toLowerCase());
  const verified = CHANGE_VERIFICATION.filter((v) => v.result === "Verified").length;
  const observations = CHANGE_VERIFICATION.filter((v) => v.result === "Observation").length;
  const compliance = Math.round((verified / CHANGE_VERIFICATION.length) * 1000) / 10;

  const changes = CHANGE_VERIFICATION.filter((v) => (result === "all" || v.result === result)
    && (match(v.ref) || match(v.title) || match(v.asset) || match(v.implementedBy)));

  const trail = useMemo(() => [
    ...activity.map((a) => ({ at: a.at, actor: a.actor, area: "Ticket", action: a.what, detail: [a.from && a.to && a.kind !== "ticket.created" ? `${a.from} → ${a.to}` : a.to, a.note].filter(Boolean).join(" · ") })),
    ...AUDIT_TRAIL,
  ].sort((x, y) => (x.at < y.at ? 1 : -1)), [activity]);
  const trailRows = trail.filter((t) => (area === "all" || t.area === area) && (match(t.actor) || match(t.action) || match(t.detail)));

  const changeCols = [
    { title: "CR", dataIndex: "ref", width: 96, render: (t) => <b style={{ color: "#1d4ed8", fontFamily: "'JetBrains Mono', monospace" }}>{t}</b> },
    { title: "Change", dataIndex: "title", render: (t, r) => <div><div style={{ fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12.5, color: "#64748b" }}>{r.asset} · {r.category}</div></div> },
    { title: "Done by / on", key: "done", width: 172, render: (_, r) => <div style={{ fontSize: 12.5, lineHeight: 1.6 }}><b>{r.implementedBy}</b><div style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.completedOn}</div></div> },
    { title: "Checks & evidence", key: "checks", width: 260, render: (_, r) => (
      <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
        <div>{r.approvalOk ? "✅" : "❌"} Approved before work</div>
        <div>{r.implementedAsApproved ? "✅" : "❌"} Done as approved</div>
        <div>{r.result === "Verified" ? "✅" : "⚠️"} Within the window</div>
        <div style={{ marginTop: 4, color: "#475569", fontSize: 12 }}>📎 {r.evidence}</div>
      </div>
    ) },
    { title: "Result", key: "result", width: 210, render: (_, r) => (
      <div>
        <Tag color={RESULT_COLOR[r.result]} style={{ fontSize: 13, padding: "2px 10px" }}>{r.result}</Tag>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{r.remark}</div>
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{r.verifiedBy} · {r.verifiedOn}</div>
      </div>
    ) },
  ];

  const trailCols = [
    { title: "When", dataIndex: "at", width: 160, render: (t) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{t}</span> },
    { title: "Who", dataIndex: "actor", width: 170, render: (t) => <b>{t}</b> },
    { title: "Area", dataIndex: "area", width: 100, render: (t) => <Tag color={AREA_COLOR[t]} style={{ fontSize: 12.5 }}>{t}</Tag> },
    { title: "Action", dataIndex: "action" },
    { title: "Detail", dataIndex: "detail", render: (t) => <span style={{ color: "#475569" }}>{t}</span> },
  ];

  const csvChanges = () => downloadCsv(`audit-change-verification-${new Date().toISOString().slice(0, 10)}.csv`, CHANGE_VERIFICATION, [
    { title: "CR", key: "ref" }, { title: "Change", key: "title" }, { title: "Asset", key: "asset" }, { title: "Done by", key: "implementedBy" },
    { title: "Completed", key: "completedOn" }, { title: "Verified by", key: "verifiedBy" }, { title: "Verified on", key: "verifiedOn" },
    { title: "Evidence", key: "evidence" }, { title: "Result", key: "result" }, { title: "Remark", key: "remark" },
  ]);
  const print = () => printReport({
    title: "Audit Report",
    subtitle: `Change verification and physical asset verification against the 5D View`,
    kpis: [["Change compliance", `${compliance}%`], ["Changes verified", `${CHANGE_VERIFICATION.length}/${CHANGE_SUMMARY.completed}`],
      ["Observations", observations], ["Assets verified", `${ASSET_AUDIT.verified}/${ASSET_AUDIT.total}`]],
    sections: [
      { title: "Observations", html: htmlTable(CHANGE_VERIFICATION.filter((v) => v.result !== "Verified"), [
        { title: "CR", key: "ref" }, { title: "Change", key: "title" }, { title: "Done by", key: "implementedBy" }, { title: "Completed", key: "completedOn" }, { title: "Remark", key: "remark" }]) },
      { title: "Change verification", html: htmlTable(CHANGE_VERIFICATION, [
        { title: "CR", key: "ref" }, { title: "Change", key: "title" }, { title: "Asset", key: "asset" }, { title: "Done by", key: "implementedBy" },
        { title: "Completed", key: "completedOn" }, { title: "Verified", key: "verifiedOn" }, { title: "Result", key: "result" }, { title: "Evidence", key: "evidence" }]) },
      { title: `Physical asset verification — ${ASSET_AUDIT.date} (${ASSET_AUDIT.auditor})`, html:
        htmlTable(ASSET_AUDIT.rooms, [{ title: "Room", key: "room" }, { title: "In 5D View", key: "inRegister" }, { title: "Verified", key: "verified" }, { title: "Labels re-printed", key: "exceptions" }])
        + `<p style="font-size:11px">Labels re-printed: ${ASSET_AUDIT.relabelled.join(", ")}</p>` },
      { title: "Audit trail (latest 60)", html: htmlTable(trail.slice(0, 60), [
        { title: "When", key: "at" }, { title: "Who", key: "actor" }, { title: "Area", key: "area" }, { title: "Action", key: "action" }, { title: "Detail", key: "detail" }]) },
    ],
  });

  const pctDone = Math.round((verify.done / ASSET_AUDIT.total) * 100);

  return (
    <div style={page}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{
          width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #059669, #0891b2)", color: "#fff", fontSize: 22, boxShadow: "0 8px 20px rgba(5,150,105,.35)",
        }}><AuditOutlined /></span>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Audit</div>
          <div style={{ fontSize: 13.5, color: "#475569" }}>Verify every change against its approval, every asset against the 5D View, and see who did what.</div>
        </div>
        <Button icon={<DownloadOutlined />} onClick={csvChanges}>Export CSV</Button>
        <Button type="primary" icon={<FileTextOutlined />} onClick={() => setReportOpen(true)} style={{ background: "#059669" }}>Generate audit report</Button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <StatCard icon={<SafetyCertificateOutlined />} label="Change compliance" value={`${compliance}%`} color="#059669" sub={`${verified} of ${CHANGE_VERIFICATION.length} changes fully verified`} />
        <StatCard icon={<CheckCircleOutlined />} label="Changes checked" value={`${CHANGE_VERIFICATION.length}/${CHANGE_SUMMARY.completed}`} color="#2563eb" sub="Every completed change this month" />
        <StatCard icon={<EyeOutlined />} label="Observations" value={observations} color="#f59e0b" sub="Finished outside the window" />
        <StatCard icon={<ScanOutlined />} label="Assets verified" value={`${ASSET_AUDIT.verified}/${ASSET_AUDIT.total}`} color="#0891b2" sub="Matches the 5D View 100%" />
        <StatCard icon={<TagsOutlined />} label="Labels re-printed" value={ASSET_AUDIT.relabelled.length} color="#7c3aed" sub="Faded asset tags fixed" />
        <StatCard icon={<TeamOutlined />} label="Audit trail" value={trail.length} color="#e8304a" sub="Actions recorded this month" />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 12px", marginBottom: 12, border: "1px solid #e2e8f0" }}>
        <Input allowClear prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Search CR, asset, person or action"
          value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 320 }} />
        {tab === "changes" && (
          <Select value={result} onChange={setResult} style={{ width: 170 }}
            options={[{ value: "all", label: "All results" }, { value: "Verified", label: "Verified" }, { value: "Observation", label: "Observations" }]} />
        )}
        {tab === "trail" && (
          <Select value={area} onChange={setArea} style={{ width: 170 }}
            options={[{ value: "all", label: "All areas" }, { value: "Change", label: "Changes" }, { value: "Audit", label: "Audit" }, { value: "Ticket", label: "Tickets" }]} />
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: "4px 14px 12px", border: "1px solid #e2e8f0" }}>
        <Tabs activeKey={tab} onChange={setTab} size="large" items={[
          { key: "changes", label: <span>Change verification <Badge count={changes.length} showZero color="#059669" /></span>, children: (
            <Table rowKey="ref" columns={changeCols} dataSource={changes} size="middle" pagination={{ pageSize: 7, showSizeChanger: false }} scroll={{ x: 1150 }}
              onRow={(r) => (r.result !== "Verified" ? { style: { background: "#fffbeb" } } : {})} />
          ) },
          { key: "assets", label: "Asset verification", children: (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, padding: "6px 2px 10px" }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, textAlign: "center", background: "linear-gradient(180deg, #ecfeff, #fff)" }}>
                <Progress type="circle" percent={verify.running ? pctDone : 100} size={170} strokeWidth={9}
                  strokeColor={{ "0%": "#0891b2", "100%": "#059669" }}
                  format={() => <div><div style={{ fontSize: 30, fontWeight: 800, color: "#047857" }}>{verify.running ? verify.done : ASSET_AUDIT.verified}</div><div style={{ fontSize: 13, color: "#475569" }}>of {ASSET_AUDIT.total} assets</div></div>} />
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12 }}>{verify.running ? "Checking against the 5D View…" : "All assets match the 5D View"}</div>
                <div style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 12px" }}>Last run: {verify.lastRun} · {ASSET_AUDIT.auditor}</div>
                <Button type="primary" icon={<ScanOutlined />} loading={verify.running} onClick={runVerification} style={{ background: "#0891b2" }}>
                  {verify.running ? "Verifying" : "Verify now"}
                </Button>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>By room</div>
                <Table rowKey="room" size="middle" pagination={false} dataSource={ASSET_AUDIT.rooms} columns={[
                  { title: "Room", dataIndex: "room", render: (t) => <b>{t}</b> },
                  { title: "In 5D View", dataIndex: "inRegister", align: "right" },
                  { title: "Verified on site", dataIndex: "verified", align: "right", render: (t) => <span style={{ color: "#047857", fontWeight: 700 }}>{t}</span> },
                  { title: "Match", key: "m", width: 220, render: (_, r) => <Progress percent={Math.round((r.verified / r.inRegister) * 100)} size="small" strokeColor="#059669" /> },
                  { title: "Labels re-printed", dataIndex: "exceptions", align: "right", render: (t) => (t ? <Tag color="purple">{t}</Tag> : "—") },
                ]} />
                <div style={{ fontSize: 15, fontWeight: 800, margin: "14px 0 8px" }}>By category</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {ASSET_AUDIT.byCategory.map((c) => (
                    <div key={c.category} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", minWidth: 140, background: "#f8fafc" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{c.verified}/{c.inRegister}</div>
                      <div style={{ fontSize: 13, color: "#475569" }}>{c.category}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 12 }}>
                  Labels re-printed: {ASSET_AUDIT.relabelled.map((t) => <Tag key={t} color="purple" style={{ marginBottom: 4 }}>{t}</Tag>)}
                </div>
              </div>
            </div>
          ) },
          { key: "trail", label: <span>Audit trail <Badge count={trailRows.length} showZero overflowCount={999} color="#e8304a" /></span>, children: (
            <Table rowKey={(r, i) => `${r.at}-${i}`} columns={trailCols} dataSource={trailRows} size="middle" pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1000 }} />
          ) },
        ]} />
      </div>

      <Modal open={reportOpen} onCancel={() => setReportOpen(false)} width={860} title="Audit Report" footer={[
        <Button key="csv" icon={<DownloadOutlined />} onClick={csvChanges}>Download CSV</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={print} style={{ background: "#059669" }}>Print / Save as PDF</Button>,
      ]}>
        <div style={{ fontSize: 13.5, color: "#475569", marginBottom: 12 }}>Generated {new Date().toLocaleString()} · auditor {ASSET_AUDIT.auditor}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {[["Change compliance", `${compliance}%`, "#059669"], ["Changes checked", `${CHANGE_VERIFICATION.length}`, "#2563eb"], ["Observations", observations, "#f59e0b"], ["Assets verified", `${ASSET_AUDIT.verified}/${ASSET_AUDIT.total}`, "#0891b2"]].map(([l, v, c]) => (
            <div key={l} style={{ border: `1px solid ${c}44`, background: `${c}10`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 12.5, color: "#334155" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontWeight: 800, margin: "6px 0" }}>Findings</div>
        {CHANGE_VERIFICATION.filter((v) => v.result !== "Verified").map((v) => (
          <div key={v.ref} style={{ fontSize: 13, padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
            <Tag color={RESULT_COLOR[v.result]}>{v.result}</Tag><b style={{ color: "#1d4ed8" }}>{v.ref}</b> {v.title} — {v.remark}
          </div>
        ))}
        <div style={{ fontWeight: 800, margin: "12px 0 6px" }}>Asset verification</div>
        <div style={{ fontSize: 13 }}>
          {ASSET_AUDIT.verified} of {ASSET_AUDIT.total} assets found where the 5D View says they are ({ASSET_AUDIT.date}). {ASSET_AUDIT.relabelled.length} faded labels re-printed: {ASSET_AUDIT.relabelled.join(", ")}.
        </div>
        <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 12 }}>The printed report adds the full change verification table and the latest 60 audit-trail entries.</div>
      </Modal>
    </div>
  );
}
