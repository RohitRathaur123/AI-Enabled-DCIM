// ═══════════════════════════════════════════════════════════════════════════
// changeAuditData.js — Change Management + Audit (static demo data)
// ---------------------------------------------------------------------------
// This month's 42 change requests — the same numbers the Dashboard's DCIM tab
// shows (6 open, 36 completed, 33 of them on time, 2.3 days average approval)
// — every one against a real 5D View asset, several of them the fix for one
// of this month's tickets. From them come the change log ("what changed,
// when, by whom") and the audit (each completed change verified, plus the
// physical asset verification against the 5D View's 664 assets).
// Dates are counted back from today so the month stays current.
// ═══════════════════════════════════════════════════════════════════════════
import { OPEN_CHANGES, CHANGES, DCIM } from "../MainDashboard/dcimDashboardData";
import { ASSET_SUMMARY, ASSETS } from "../MainDashboard/dcimAssetRegister";

const pad = (n) => String(n).padStart(2, "0");
export function dayStamp(daysAgo, hhmm = "10:00") {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmm}`;
}

export const PEOPLE = {
  vikram: { name: "Vikram Singh", role: "Data Centre Manager" },
  anita: { name: "Anita Desai", role: "Change Manager (CAB chair)" },
  rajesh: { name: "Rajesh Kumar", role: "IT Support" },
  priya: { name: "Priya Sharma", role: "Network Team" },
  amit: { name: "Amit Verma", role: "Security Team" },
  neha: { name: "Neha Gupta", role: "Facilities (Power & Cooling)" },
  sunil: { name: "Sunil Rao", role: "Internal Auditor" },
};
const P = (k) => PEOPLE[k].name;

// id, title, asset, category, type, risk, requestedBy, approvedBy, implementedBy,
// completed (days ago), approval days, window, on time, before, after, ticket
const COMPLETED = [
  ["CHG-1006", "UPS3 battery string — 2 weak cells replaced", "UPS3", "Power", "Normal", "Medium", "neha", "vikram", "neha", 26, 2, "02:00–04:00", true, "2 cells high impedance (self-test failed)", "2 cells replaced, string re-tested OK", "INC-002"],
  ["CHG-1007", "RPDU-2B breaker replaced after trip", "RPDU-2B", "Power", "Emergency", "High", "neha", "vikram", "neha", 25, 1, "11:30–12:30", true, "B-side 32 A breaker tripped", "Breaker replaced, Row B B-side cords re-balanced", "INC-001"],
  ["CHG-1008", "GEN1 monthly load test", "GEN1", "Power", "Standard", "Low", "neha", "anita", "neha", 6, 1, "06:00–07:00", true, "Last load test 31 days ago", "30 min on 60 % load bank — passed", "INC-010"],
  ["CHG-1009", "PDU1 outlets re-labelled to 5D View rack aliases", "PDU1", "Power", "Standard", "Low", "neha", "anita", "neha", 24, 2, "10:00–12:00", true, "Outlet labels by old rack numbers", "Labels match 5D View aliases (RK-B1 … RK-F7)", null],
  ["CHG-1010", "MPP2 thermography and torque check", "MPP2", "Power", "Standard", "Low", "neha", "anita", "neha", 23, 2, "22:00–23:30", true, "Annual IR scan due", "IR scan clean, 2 lugs re-torqued", null],
  ["CHG-1011", "UPS1 firmware upgrade", "UPS1", "Power", "Normal", "Medium", "neha", "vikram", "neha", 21, 3, "02:00–03:00", true, "Firmware 2.1.4", "Firmware 2.2.0", null],
  ["CHG-1012", "UPS2 firmware upgrade", "UPS2", "Power", "Normal", "Medium", "neha", "vikram", "neha", 20, 3, "02:00–03:00", true, "Firmware 2.1.4", "Firmware 2.2.0", null],
  ["CHG-1013", "UPS4 firmware upgrade", "UPS4", "Power", "Normal", "Medium", "neha", "vikram", "neha", 19, 3, "02:00–03:00", false, "Firmware 2.1.4", "Firmware 2.2.0 (window overran by 40 min — bypass transfer retried)", null],
  ["CHG-1014", "Transformer T2 annual inspection", "T2", "Power", "Standard", "Low", "neha", "anita", "neha", 18, 2, "07:00–09:00", true, "Inspection due", "Windings, fans and temperature relay tested OK", null],
  ["CHG-1015", "PAC-2W air filter replaced", "PAC-2W", "Cooling", "Standard", "Low", "neha", "anita", "neha", 11, 2, "14:00–14:30", true, "Filter ΔP 210 Pa (clogged)", "New filter, ΔP 85 Pa", "INC-003"],
  ["CHG-1016", "CH-01 compressor 2 HP switch reset and refrigerant top-up", "CH-01", "Cooling", "Emergency", "High", "neha", "vikram", "neha", 6, 1, "16:00–17:30", true, "Compressor 2 tripped on high pressure", "HP switch reset, 1.2 kg R-134a added, running normal", "INC-009"],
  ["CHG-1017", "PAC-2E leak-detection cable test", "PAC-2E", "Cooling", "Standard", "Low", "neha", "anita", "neha", 5, 2, "11:00–11:30", true, "Quarterly test due", "Cable continuity and alarm path verified", "INC-011"],
  ["CHG-1018", "PAC-1E fan belt replaced", "PAC-1E", "Cooling", "Standard", "Low", "neha", "anita", "neha", 17, 2, "13:00–14:00", true, "Belt wear 70 %", "New belt, tension set", null],
  ["CHG-1019", "PAC-3W chilled-water valve actuator replaced", "PAC-3W", "Cooling", "Normal", "Medium", "neha", "vikram", "neha", 16, 3, "01:00–03:00", true, "Actuator sticking at 60 %", "New actuator, stroke 0–100 % verified", null],
  ["CHG-1020", "Blanking panels fitted in RK-D4 (14U)", "RK-D4", "Cooling", "Standard", "Low", "neha", "anita", "rajesh", 15, 2, "10:00–11:00", true, "14U open, hot-air recirculation", "14U blanked, inlet temperature −1.4 °C", null],
  ["CHG-1021", "ToR-A uplink optic to DIST-B replaced", "ToR-A", "Network", "Normal", "Medium", "priya", "vikram", "priya", 10, 2, "23:00–23:30", true, "Uplink flapping (CRC errors)", "New 10G SR optic, 0 errors in 24 h", "INC-004"],
  ["CHG-1022", "NDR-3 → RDR-D OM4 trunk connectors cleaned", "NDR-3", "Network", "Standard", "Low", "priya", "anita", "priya", 7, 1, "15:00–16:00", true, "Loss 2.9 dB on trunk", "Loss 1.1 dB after cleaning (re-termination raised as CHG-1043)", "INC-008"],
  ["CHG-1023", "CORE-A OS upgrade", "CORE-A", "Network", "Normal", "High", "priya", "vikram", "priya", 14, 4, "01:00–04:00", true, "OS 17.9.4", "OS 17.12.2", null],
  ["CHG-1024", "VLAN 140 added on DIST-B for Row E", "DIST-B", "Network", "Standard", "Low", "priya", "anita", "priya", 13, 2, "18:00–18:30", true, "Row E on VLAN 100 only", "VLAN 140 trunked to SW-EA / SW-EB", null],
  ["CHG-1025", "ISP-B BGP timers tuned after latency spike", "ISP-B", "Network", "Normal", "Medium", "priya", "vikram", "priya", 2, 2, "22:00–22:30", false, "Hold 180 s / keepalive 60 s", "Hold 30 s / keepalive 10 s (completed 25 min late)", "INC-015"],
  ["CHG-1026", "AGG-2A port 47 re-patched to LIU-1", "AGG-2A", "Network", "Standard", "Low", "priya", "anita", "priya", 12, 2, "12:00–12:30", true, "Port 47 on PP-2", "Port 47 on LIU-1 fibre", null],
  ["CHG-1027", "FW-A / FW-B HA heartbeat moved to dedicated port", "FW-B", "Security", "Emergency", "High", "amit", "vikram", "amit", 8, 1, "20:00–21:00", true, "HA heartbeat shared with data port", "Dedicated heartbeat port 15, failover tested", "INC-007"],
  ["CHG-1028", "Firewall policy review — 12 stale rules removed", "FW-A", "Security", "Normal", "Medium", "amit", "vikram", "amit", 9, 4, "23:00–00:00", true, "418 rules", "406 rules (12 unused > 90 days removed)", null],
  ["CHG-1029", "RK-E2 rear door sensor replaced", "RK-E2", "Security", "Standard", "Low", "rajesh", "anita", "rajesh", 3, 2, "11:00–11:30", true, "Door sensor reporting open", "New sensor, open/close verified", "INC-014"],
  ["CHG-1030", "WEB-D4-02 failed disk replaced, RAID rebuilt", "WEB-D4-02", "Hardware", "Standard", "Low", "rajesh", "anita", "rajesh", 9, 1, "14:00–17:00", true, "RAID 5 degraded (disk 3 failed)", "Disk 3 replaced, RAID optimal", "INC-006"],
  ["CHG-1031", "APP-C2-03 PSU-2 replaced", "APP-C2-03", "Hardware", "Standard", "Low", "rajesh", "anita", "rajesh", 9, 1, "12:00–12:30", true, "PSU-2 failed — running on one feed", "PSU-2 replaced, A + B feeds live", "INC-005"],
  ["CHG-1032", "MGMT-E-01 OS patch rolled back", "MGMT-E-01", "Software", "Emergency", "Medium", "rajesh", "vikram", "rajesh", 4, 1, "19:00–19:30", false, "Patch KB5034441 broke the NIC driver", "Patch rolled back, host reachable (finished 1 h late)", "INC-012"],
  ["CHG-1033", "DNS-2-01 zone-transfer ACL corrected", "DNS-2-01", "Application", "Normal", "Low", "priya", "anita", "priya", 3, 2, "16:00–16:30", true, "Secondary DNS refused AXFR", "ACL allows DNS-1-01 … DNS-6-01", "INC-013"],
  ["CHG-1034", "GPU-B1-01 CUDA driver upgrade", "GPU-B1-01", "Software", "Normal", "Medium", "rajesh", "vikram", "rajesh", 1, 3, "01:00–02:00", true, "Driver 535.x (crashing)", "Driver 550.x, burn-in passed", "INC-016"],
  ["CHG-1035", "Hypervisor patching — Row C application servers (21 hosts)", "APP-C2-01", "Software", "Normal", "Medium", "rajesh", "vikram", "rajesh", 22, 4, "00:00–05:00", true, "Hypervisor 8.0 U2", "Hypervisor 8.0 U3 on 21 APP hosts", null],
  ["CHG-1036", "RK-B1 cable management tidy-up", "RK-B1", "Hardware", "Standard", "Low", "rajesh", "anita", "rajesh", 26, 3, "10:00–12:00", true, "Patch cords crossing U33–U36", "Cords dressed through cable managers", null],
  ["CHG-1037", "Backup window moved for Row D web tier", "WEB-D4-01", "Software", "Standard", "Low", "rajesh", "anita", "rajesh", 27, 2, "—", true, "Nightly backup 01:00", "Nightly backup 02:30 (after batch jobs)", null],
  ["CHG-1038", "NMS-1-01 monitoring templates updated for PAC units", "NMS-1-01", "Software", "Standard", "Low", "priya", "anita", "priya", 20, 2, "15:00–16:00", true, "Generic HVAC template", "PAC template: return air, ΔP, condensate pump", null],
  ["CHG-1039", "Cold aisle 3 perforated tiles rearranged (4 tiles)", "PAC-3E", "Cooling", "Normal", "Medium", "neha", "vikram", "neha", 4, 5, "22:00–23:00", true, "Rows E–F at 94 % of PAC capacity", "4 tiles moved to Row F inlet", null],
  ["CHG-1040", "Battery Room exhaust fan serviced", "BAT1", "Facility", "Standard", "Low", "neha", "anita", "neha", 24, 5, "09:00–10:00", true, "Fan bearing noisy", "Bearings replaced, airflow checked", null],
  ["CHG-1041", "Busway joint torque check", "BUSWAY", "Power", "Standard", "Low", "neha", "anita", "neha", 26, 3, "05:00–06:00", true, "Annual check due", "All 14 joints torqued and recorded", null],
];

const OPEN_DETAIL = {
  "CHG-1047": { asset: "RK-C4", category: "Hardware", type: "Normal", requestedBy: "rajesh", approvedBy: "vikram", implementedBy: "rajesh", raisedDaysAgo: 3, window: "Sat 01:00–03:00" },
  "CHG-1046": { asset: "BAT2", category: "Power", type: "Normal", requestedBy: "neha", approvedBy: null, implementedBy: "neha", raisedDaysAgo: 1, window: "pending approval" },
  "CHG-1045": { asset: DCIM.hottestPac.tag, category: "Cooling", type: "Emergency", requestedBy: "neha", approvedBy: "vikram", implementedBy: "neha", raisedDaysAgo: 0, window: "Today 14:00–18:00" },
  "CHG-1044": { asset: "UPS3", category: "Power", type: "Normal", requestedBy: "neha", approvedBy: "vikram", implementedBy: "neha", raisedDaysAgo: 4, window: "Sun 02:00–03:00" },
  "CHG-1043": { asset: "NDR-3", category: "Network", type: "Normal", requestedBy: "priya", approvedBy: null, implementedBy: "priya", raisedDaysAgo: 2, window: "pending approval" },
  "CHG-1042": { asset: "PDU1", category: "Power", type: "Normal", requestedBy: "neha", approvedBy: null, implementedBy: "neha", raisedDaysAgo: 0, window: "to be scheduled" },
};

// ── change requests ────────────────────────────────────────────────────────
export const CHANGE_REQUESTS = [
  ...OPEN_CHANGES.map((c) => {
    const d = OPEN_DETAIL[c.id] || {};
    return {
      id: c.id, title: c.title, asset: d.asset, category: d.category, type: d.type, risk: c.risk,
      status: c.status, stage: c.stage, open: true,
      requestedBy: P(d.requestedBy), approvedBy: d.approvedBy ? P(d.approvedBy) : null, implementedBy: P(d.implementedBy),
      raisedOn: dayStamp(d.raisedDaysAgo, "09:30"), approvedOn: null, completedOn: null,
      window: d.window, onTime: null, approvalDays: null, before: null, after: null, ticket: null,
    };
  }),
  ...COMPLETED.map(([id, title, asset, category, type, risk, rq, ap, im, doneAgo, apDays, window, onTime, before, after, ticket]) => ({
    id, title, asset, category, type, risk, status: "Completed", stage: "Closed", open: false,
    requestedBy: P(rq), approvedBy: P(ap), implementedBy: P(im),
    raisedOn: dayStamp(doneAgo + apDays + 1, "09:30"),
    approvedOn: dayStamp(doneAgo + 1, "17:00"),
    completedOn: dayStamp(doneAgo, (window.split("–")[1] || "18:00").slice(0, 5)),
    window, onTime, approvalDays: apDays, before, after, ticket, doneAgo,
  })),
];

const completed = CHANGE_REQUESTS.filter((c) => !c.open);
export const CHANGE_SUMMARY = {
  raised: CHANGE_REQUESTS.length,                                         // 42
  open: CHANGE_REQUESTS.filter((c) => c.open).length,                     // 6
  completed: completed.length,                                            // 36
  onTime: completed.filter((c) => c.onTime).length,                       // 33
  late: completed.filter((c) => !c.onTime).length,                        // 3
  emergency: CHANGE_REQUESTS.filter((c) => c.type === "Emergency").length,
  avgApprovalDays: Math.round((completed.reduce((s, c) => s + c.approvalDays, 0) / completed.length) * 10) / 10,
  byCategory: CHANGE_REQUESTS.reduce((m, c) => ({ ...m, [c.category]: (m[c.category] || 0) + 1 }), {}),
};
if (CHANGE_SUMMARY.raised !== CHANGES.raised || CHANGE_SUMMARY.completed !== CHANGES.completed) {
  console.warn("[changeAuditData] change counts differ from the DCIM tab", CHANGE_SUMMARY, CHANGES);
}

// ── change log: what changed, when, by whom ──────────────────────────────────
export const CHANGE_LOG = CHANGE_REQUESTS.flatMap((c) => {
  const rows = [{ at: c.raisedOn, actor: c.requestedBy, action: "Raised", ref: c.id, asset: c.asset, what: c.title, from: null, to: null, category: c.category }];
  if (c.approvedOn) rows.push({ at: c.approvedOn, actor: c.approvedBy, action: "Approved", ref: c.id, asset: c.asset, what: c.title, from: null, to: null, category: c.category });
  if (c.completedOn) {
    rows.push({ at: c.completedOn, actor: c.implementedBy, action: "Implemented", ref: c.id, asset: c.asset, what: c.title, from: c.before, to: c.after, category: c.category });
  }
  return rows;
}).sort((a, b) => (a.at < b.at ? 1 : -1));

// ── audit: every completed change verified ─────────────────────────────────
export const CHANGE_VERIFICATION = completed.map((c) => {
  const late = !c.onTime;
  return {
    ref: c.id, title: c.title, asset: c.asset, category: c.category, implementedBy: c.implementedBy,
    completedOn: c.completedOn, verifiedBy: P("sunil"),
    // checked the morning after it was done (yesterday's changes: late last night)
    verifiedOn: c.doneAgo >= 2 ? dayStamp(c.doneAgo - 1, "10:30") : dayStamp(c.doneAgo, "23:15"),
    approvalOk: true, implementedAsApproved: true,
    evidence: c.ticket ? `Ticket ${c.ticket} closed · before/after recorded` : "Before/after recorded · CAB minutes",
    result: late ? "Observation" : "Verified",
    remark: late ? "Completed outside the approved window — overrun justified and recorded." : "Implemented as approved; 5D View record updated.",
  };
});

// ── audit: physical asset verification against the 5D View register ─────────
export const ASSET_AUDIT = (() => {
  const daysAgo = 4;
  const relabelled = ["RK-C5-PP-B", "PAC-1W", "RPDU-4A", "WEB-F2-03", "NDR-5-LIU-2"].filter((t) => ASSETS.some((a) => a.tag === t));
  const rooms = Object.entries(ASSET_SUMMARY.byRoom).map(([room, n]) => ({
    room, inRegister: n, verified: n, exceptions: relabelled.filter((t) => ASSETS.find((a) => a.tag === t)?.room === room).length,
  }));
  return {
    title: "Physical asset verification — 5D View register",
    date: dayStamp(daysAgo, "10:00").slice(0, 10),
    auditor: P("sunil"),
    total: ASSET_SUMMARY.total,
    verified: ASSET_SUMMARY.total,
    relabelled,
    rooms,
    byCategory: Object.entries(ASSET_SUMMARY.byCategory).filter(([, n]) => n > 0).map(([category, n]) => ({ category, inRegister: n, verified: n })),
  };
})();

// ── audit trail: who did what (static history; live ticket activity is added on the page) ──
export const AUDIT_TRAIL = [
  ...CHANGE_LOG.map((r) => ({ at: r.at, actor: r.actor, area: "Change", action: `${r.action} ${r.ref}`, detail: r.what })),
  ...CHANGE_VERIFICATION.map((v) => ({ at: v.verifiedOn, actor: v.verifiedBy, area: "Audit", action: `${v.result} ${v.ref}`, detail: v.remark })),
  { at: ASSET_AUDIT.date + " 17:45", actor: P("sunil"), area: "Audit", action: "Asset verification closed", detail: `${ASSET_AUDIT.verified}/${ASSET_AUDIT.total} assets verified against the 5D View; ${ASSET_AUDIT.relabelled.length} labels re-printed` },
].sort((a, b) => (a.at < b.at ? 1 : -1));
