// ═══════════════════════════════════════════════════════════════════════════
// TicketNotifications.jsx — bottom-right ticket toasts + the ticket "View"
// window, mounted once for the whole portal (Layout.jsx).
// ---------------------------------------------------------------------------
// • A ticket raised by the 5D View simulation pops up here straight away.
// • While the header's "Ticket Alerts" switch is ON, every open simulation
//   ticket is announced again every 10 seconds (one toast per tick, taking
//   turns), with how long the device has been down and what it is costing.
// • "View" opens the ticket: reassign it, change its status, or jump to it in
//   Ticket Management.
// Both layers sit above the full-screen 5D View.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Select, Switch } from "antd";
import {
  ticketStore, useTicketStore, TECHNICIANS, REMINDER_MS, TOAST_MS, isOpen,
} from "./ticketStore";

const Z_TOAST = 100500;
const Z_MODAL = 100600;

const KIND = {
  new:        { label: "NEW TICKET",  color: "#e8304a", bg: "#fff1f3", icon: "🎫" },
  reminder:   { label: "REMINDER",    color: "#f59e0b", bg: "#fff8eb", icon: "⏰" },
  resolved:   { label: "RESOLVED",    color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  reassigned: { label: "REASSIGNED",  color: "#2563eb", bg: "#eff6ff", icon: "🔁" },
};
const PRIORITY_COLOR = { Urgent: "#e8304a", High: "#f07030", Medium: "#d89a00", Low: "#10b981" };
const STATUS_COLOR = { Open: "#2563eb", "In Progress": "#7c3aed", Resolved: "#10b981", Closed: "#64748b" };
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export function fmtDuration(sec) {
  if (!Number.isFinite(sec)) return "—";
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), rs = s % 60;
  if (m < 60) return rs ? `${m}m ${rs}s` : `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}
export function fmtMoney(n) {
  if (!Number.isFinite(n)) return "—";
  return n >= 100 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
}

const Pill = ({ color, children, solid }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999,
    fontSize: 11, fontWeight: 700, letterSpacing: ".02em", whiteSpace: "nowrap",
    color: solid ? "#fff" : color, background: solid ? color : `${color}18`, border: `1px solid ${color}55`,
  }}>{children}</span>
);

// ── one toast ──────────────────────────────────────────────────────────────
function Toast({ toast, ticket, live, notify }) {
  const [hover, setHover] = useState(false);
  const k = KIND[toast.kind] || KIND.new;

  useEffect(() => {
    if (hover) return undefined;
    const id = setTimeout(() => ticketStore.dismissToast(toast.id), TOAST_MS);
    return () => clearTimeout(id);
  }, [hover, toast.id]);

  const title = toast.title || (ticket ? ticket.title : toast.ticketNo);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 380, background: "#fff", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 18px 40px rgba(15,23,42,.22), 0 2px 6px rgba(15,23,42,.08)",
        border: `1px solid ${k.color}40`, borderLeft: `6px solid ${k.color}`,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", animation: "tktIn .35s cubic-bezier(.2,.9,.3,1.2)",
      }}
    >
      <div style={{ padding: "12px 14px 10px", background: `linear-gradient(135deg, ${k.bg}, #fff 70%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>{k.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: k.color }}>{k.label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{toast.ticketNo}</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => ticketStore.dismissToast(toast.id)} title="Dismiss"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.35 }}>{title}</div>
        {toast.body && <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{toast.body}</div>}
        {ticket && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <Pill color={PRIORITY_COLOR[ticket.priority] || "#64748b"}>{ticket.priority}</Pill>
            <Pill color={STATUS_COLOR[ticket.status] || "#64748b"}>{ticket.status}</Pill>
            <Pill color="#334155">👤 {ticket.assignedTo || "Unassigned"}</Pill>
          </div>
        )}
        {live && toast.kind !== "resolved" && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 9,
            background: "#0f172a", borderRadius: 9, padding: "7px 8px",
          }}>
            {[
              ["Down for", fmtDuration(live.downSec), "#fca5a5"],
              ["Cost so far", fmtMoney(live.cost), "#fcd34d"],
              ["Affected", `${live.cascadeCount} device${live.cascadeCount === 1 ? "" : "s"}`, "#93c5fd"],
            ].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderTop: "1px solid #eef2f7" }}>
        <button onClick={() => { ticketStore.view(toast.ticketNo); ticketStore.dismissToast(toast.id); }}
          style={{
            padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${k.color}, ${k.color}cc)`, color: "#fff", fontWeight: 700, fontSize: 12.5,
          }}>View</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#64748b" }}>Ticket alerts</span>
        <Switch size="small" checked={notify} onChange={(on) => ticketStore.setNotify(on)} />
      </div>
      <div style={{ height: 3, background: "#eef2f7" }}>
        <div style={{
          height: "100%", background: k.color, transformOrigin: "left",
          animation: `tktBar ${TOAST_MS}ms linear forwards`, animationPlayState: hover ? "paused" : "running",
        }} />
      </div>
    </div>
  );
}

// ── the "View" window ──────────────────────────────────────────────────────
function TicketViewModal({ ticket, live, activity, onClose }) {
  const navigate = useNavigate();
  const [assignee, setAssignee] = useState(ticket.assignedTo || undefined);
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { setAssignee(ticket.assignedTo || undefined); setStatus(ticket.status); }, [ticket.ticketNo]); // eslint-disable-line react-hooks/exhaustive-deps
  // Escape closes the window.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dirty = (assignee || null) !== (ticket.assignedTo || null) || status !== ticket.status || note.trim();
  const save = () => {
    ticketStore.updateTicket(ticket.ticketNo, { assignedTo: assignee || null, status }, { note: note.trim() });
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const openInTicketManagement = () => {
    if (dirty) save();
    onClose();
    // A full-screen 5D View would hide the page underneath — close it first.
    window.dispatchEvent(new CustomEvent("dcim:close5dView"));
    navigate(`/ticket?focus=${encodeURIComponent(ticket.ticketNo)}`);
  };
  const popup = (trigger) => trigger.parentElement;
  const field = (label, value) => (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 11px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{value || "—"}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: Z_MODAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(2px)" }} />
      <div role="dialog" aria-modal="true" aria-label={`Ticket ${ticket.ticketNo}`} style={{
        position: "relative", width: 620, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
        background: "#fff", borderRadius: 16, boxShadow: "0 30px 80px rgba(15,23,42,.35)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", color: "#fff", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎫</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800 }}>{ticket.ticketNo}</span>
            <Pill color="#fff" solid={false}><span style={{ color: "#fff" }}>{ticket.source === "simulation" ? "5D View simulation" : ticket.source === "alarm" ? "DCIM alarm" : "Manual"}</span></Pill>
            <span style={{ flex: 1 }} />
            <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "rgba(255,255,255,.18)", color: "#fff", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8, lineHeight: 1.3 }}>{ticket.title}</div>
          {ticket.description && <div style={{ fontSize: 12.5, opacity: .9, marginTop: 4 }}>{ticket.description}</div>}
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Pill color={PRIORITY_COLOR[ticket.priority] || "#64748b"} solid>{ticket.priority}</Pill>
            <Pill color={STATUS_COLOR[ticket.status] || "#64748b"}>{ticket.status}</Pill>
            <Pill color="#0891b2">{ticket.category}</Pill>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {field("Asset", ticket.device)}
            {field("Room", ticket.roomName)}
            {field("Created", ticket.createdAt || ticket.createdDate)}
            {field("Created by", ticket.createdBy)}
            {field("Assigned to", ticket.assignedTo || "Unassigned")}
            {field("Data centre", ticket.dcName)}
          </div>

          {live && isOpen(ticket) && (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                ["Down for", fmtDuration(live.downSec), "#e8304a"],
                ["Cost so far", fmtMoney(live.cost), "#d97706"],
                ["Burn / hr", fmtMoney(live.burnPerHour || 0), "#7c3aed"],
                ["Devices affected", String(live.cascadeCount), "#2563eb"],
              ].map(([l, v, c]) => (
                <div key={l} style={{ borderRadius: 10, padding: "9px 10px", background: `${c}12`, border: `1px solid ${c}40`, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "#f5f7ff", border: "1px solid #dbe4ff" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a", marginBottom: 10 }}>Reassign / update</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Assign to</div>
                <Select value={assignee} onChange={setAssignee} allowClear placeholder="Choose a technician"
                  style={{ width: "100%" }} getPopupContainer={popup}
                  options={TECHNICIANS.map((t) => ({ value: t.name, label: `${t.name} — ${t.dept}` }))} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Status</div>
                <Select value={status} onChange={setStatus} style={{ width: "100%" }} getPopupContainer={popup}
                  options={STATUSES.map((s) => ({ value: s, label: s }))} />
              </div>
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the change log (optional)"
              rows={2} style={{ width: "100%", marginTop: 10, borderRadius: 8, border: "1px solid #cbd5e1", padding: "7px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <button disabled={!dirty} onClick={save} style={{
                padding: "7px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
                cursor: dirty ? "pointer" : "default", color: "#fff",
                background: dirty ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#94a3b8",
              }}>Save</button>
              <button onClick={openInTicketManagement} style={{
                padding: "7px 16px", borderRadius: 8, border: "1px solid #2563eb", background: "#fff",
                color: "#2563eb", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>Open in Ticket Management →</button>
              {saved && <span style={{ color: "#10b981", fontWeight: 700, fontSize: 12.5 }}>✓ Saved</span>}
            </div>
          </div>

          {activity.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>History</div>
              <div style={{ borderLeft: "3px solid #c7d2fe", paddingLeft: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {activity.slice(0, 8).map((a, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: "#334155" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b", fontSize: 11.5 }}>{a.at}</span>{" · "}
                    <b>{a.actor}</b>{" — "}{a.what}
                    {(a.from || a.to) && a.kind !== "ticket.created" && <> : <span style={{ color: "#e8304a" }}>{a.from}</span> → <span style={{ color: "#10b981" }}>{a.to}</span></>}
                    {a.note && <div style={{ color: "#64748b", fontStyle: "italic" }}>“{a.note}”</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── mounted once in Layout ─────────────────────────────────────────────────
export default function TicketNotifications() {
  const { toasts, tickets, live, viewing, notify, activity } = useTicketStore();

  // Every 10 s: re-announce the next open simulation ticket.
  useEffect(() => {
    const id = setInterval(() => ticketStore.remind(), REMINDER_MS);
    return () => clearInterval(id);
  }, []);

  const byNo = useMemo(() => Object.fromEntries(tickets.map((t) => [t.ticketNo, t])), [tickets]);
  const viewTicket = viewing ? byNo[viewing] : null;
  const viewActivity = useMemo(
    () => (viewing ? activity.filter((a) => a.ref === viewing) : []),
    [activity, viewing]);

  return createPortal(
    <>
      <style>{`
        @keyframes tktIn { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes tktBar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>
      {toasts.length > 0 && (
        <div style={{
          position: "fixed", right: 20, bottom: 20, zIndex: Z_TOAST,
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end",
        }}>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} ticket={byNo[t.ticketNo]} live={live[t.ticketNo]} notify={notify} />
          ))}
        </div>
      )}
      {viewTicket && (
        <TicketViewModal ticket={viewTicket} live={live[viewTicket.ticketNo]} activity={viewActivity}
          onClose={() => ticketStore.closeView()} />
      )}
    </>,
    document.body,
  );
}
