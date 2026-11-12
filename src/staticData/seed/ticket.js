// Static data — Ticket management: SLAs, escalation matrix, work-order
// templates, e-mail templates, tickets (with audit trail and attachments)
// and the user list used by the "Assign" dropdown.
import { DEVICE_DETAILS } from "./device";

const iso = (y, m, d, h = 10, min = 0) => new Date(Date.UTC(y, m - 1, d, h, min)).toISOString();

export const USERS = [
  { id: "u-1001", email: "admin@dcim.local", name: "Admin", fullName: "System Administrator", userName: "admin", role: "Admin" },
  { id: "u-1002", email: "neha.singh@dcim.local", name: "Neha Singh", fullName: "Neha Singh", userName: "neha.singh", role: "NOC Engineer" },
  { id: "u-1003", email: "arjun.rao@dcim.local", name: "Arjun Rao", fullName: "Arjun Rao", userName: "arjun.rao", role: "Facility Engineer" },
  { id: "u-1004", email: "vikas.jain@dcim.local", name: "Vikas Jain", fullName: "Vikas Jain", userName: "vikas.jain", role: "Network Engineer" },
  { id: "u-1005", email: "pooja.mehta@dcim.local", name: "Pooja Mehta", fullName: "Pooja Mehta", userName: "pooja.mehta", role: "Electrical Engineer" },
  { id: "u-1006", email: "rohan.das@dcim.local", name: "Rohan Das", fullName: "Rohan Das", userName: "rohan.das", role: "Shift Lead" },
];

export const SLAS = [
  [1, "Critical — 1 Hour", 60], [2, "High — 4 Hours", 240], [3, "Normal — 8 Hours", 480],
  [4, "Low — 24 Hours", 1440], [5, "Preventive Maintenance — 72 Hours", 4320],
].map(([id, name, resolutionTimeInMinutes], i) => ({
  id, name, resolutionTimeInMinutes, isActive: true, createdAt: iso(2025, 5, 2 + i), updatedAt: iso(2025, 5, 2 + i),
}));

export const ESCALATIONS = [
  [1, 1, "L1 — NOC Shift Lead", 15, "rohan.das@dcim.local"],
  [1, 2, "L2 — Facility Manager", 30, "facility.manager@dcim.local"],
  [1, 3, "L3 — Head of Operations", 45, "ops.head@dcim.local"],
  [2, 1, "L1 — NOC Shift Lead", 60, "rohan.das@dcim.local"],
  [2, 2, "L2 — Facility Manager", 180, "facility.manager@dcim.local"],
  [3, 1, "L1 — Service Desk", 240, "servicedesk@dcim.local"],
  [3, 2, "L2 — NOC Shift Lead", 420, "rohan.das@dcim.local"],
  [4, 1, "L1 — Service Desk", 720, "servicedesk@dcim.local"],
  [5, 1, "L1 — Maintenance Planner", 2880, "maintenance@dcim.local"],
].map(([slaId, level, levelname, escalationTimeInMinutes, escalateToEmail], i) => ({
  id: i + 1, slaId, level, levelname, escalationTimeInMinutes, escalateToEmail,
  slaName: SLAS.find((s) => s.id === slaId)?.name || "", createdAt: iso(2025, 5, 10 + i), updatedAt: iso(2025, 5, 10 + i),
}));

export const WORK_ORDER_TEMPLATES = [
  [1, "UPS Quarterly Preventive Maintenance", "Hardware", "UPS", "Check battery strings, capacitors, fans and event logs. Run a 5-minute battery test.", "Normal", 5, true],
  [2, "DG Set Monthly Load Test", "Hardware", "DG Set", "Run the DG on load for 30 minutes, record fuel level, coolant temperature and output voltage.", "High", 2, true],
  [3, "PAC Filter Replacement", "Hardware", "Cooling", "Replace air filters, inspect belts and condensate drain on all PAC units.", "Normal", 5, true],
  [4, "Firewall Firmware Upgrade", "Security", "Firewall", "Back up configuration, upgrade firmware in the maintenance window, verify HA sync.", "High", 2, true],
  [5, "Rack Cable Audit", "Network", "Cabling", "Verify patch-cord labels against the cabling schedule and update the records.", "Low", 4, true],
  [6, "Chiller Annual Overhaul", "Hardware", "Chiller", "Tube cleaning, refrigerant check and compressor inspection.", "Normal", 5, false],
].map(([id, name, category, subCategory, defaultDescription, defaultPriority, defaultSLAId, isActive], i) => ({
  id, name, category, subCategory, defaultDescription, defaultPriority, defaultSLAId, isActive,
  defaultSLAName: SLAS.find((s) => s.id === defaultSLAId)?.name || "",
  createdAt: iso(2025, 6, 3 + i), updatedAt: iso(2025, 6, 3 + i),
}));

export const EMAIL_TEMPLATES = [
  [1, "Ticket Created", "[{{TicketId}}] New ticket: {{Title}}", "<p>Hello {{AssigneeName}},</p><p>A new ticket <b>{{TicketId}}</b> has been raised.</p><p><b>Title:</b> {{Title}}<br/><b>Priority:</b> {{Priority}}<br/><b>SLA deadline:</b> {{SlaDeadline}}</p><p>Regards,<br/>DCIM Service Desk</p>", true],
  [2, "Ticket Assigned", "[{{TicketId}}] Assigned to you: {{Title}}", "<p>Hi {{AssigneeName}},</p><p>Ticket <b>{{TicketId}}</b> is now assigned to you.</p><p>Please acknowledge within the SLA.</p>", true],
  [3, "SLA Breach Warning", "SLA warning — {{TicketId}} breaches in {{MinutesLeft}} minutes", "<p>Ticket <b>{{TicketId}}</b> ({{Title}}) will breach its SLA in <b>{{MinutesLeft}}</b> minutes.</p>", true],
  [4, "Ticket Escalated", "[Escalation L{{Level}}] {{TicketId}} — {{Title}}", "<p>Ticket <b>{{TicketId}}</b> has been escalated to level {{Level}} ({{LevelName}}).</p>", true],
  [5, "Ticket Closed", "[{{TicketId}}] Closed: {{Title}}", "Ticket {{TicketId}} has been closed.\nResolution: {{Resolution}}\n\nThank you,\nDCIM Service Desk", false],
].map(([id, name, subjectTemplate, bodyTemplate, isHtml], i) => ({
  id, name, subjectTemplate, bodyTemplate, isHtml, createdAt: iso(2025, 6, 12 + i), updatedAt: iso(2025, 6, 12 + i),
}));

const dev = (short) => DEVICE_DETAILS.find((d) => d.shortName === short)?.id ?? "";

// [title, description, category, sub, severity, priority, status, slaId, assignee, device, type, source, created(d,h), approval]
const TICKET_ROWS = [
  ["UPS-02 running on battery", "UPS-02 switched to battery mode after an input breaker trip in the UPS room.", "Hardware", "UPS", "Critical", "Critical", "Escalated", 1, "u-1005", "UPS-02", "System", "System", [11, 8], "Pending"],
  ["High return-air temperature on PAC-3E", "PAC-3E return air reached 29 °C; compressor 2 not starting.", "Hardware", "Cooling", "High", "High", "Assigned", 2, "u-1003", "PAC-3E", "System", "System", [11, 9], "Pending"],
  ["Phase imbalance on PDU-A01-A", "L1/L2 load difference above 20 % on PDU-A01-A.", "Hardware", "Power", "Medium", "Normal", "Open", 3, null, "PDU-A01-A", "System", "System", [11, 11], null],
  ["Fiber link down LEAF-B01 ↔ SPINE-02", "Uplink Eth1/50 on LEAF-B01 reports link down; light levels below threshold.", "Network", "Uplink", "High", "High", "Assigned", 2, "u-1004", "LEAF-B01", "System", "System", [10, 22], "Pending"],
  ["Firewall firmware upgrade — FW-EDGE-01", "Planned firmware upgrade in the Saturday maintenance window.", "Security", "Firewall", "Medium", "High", "Open", 2, "u-1004", "FW-EDGE-01", "WorkOrder", "Manual", [10, 14], "Approved"],
  ["DG-01 monthly load test", "Monthly 30-minute load test for DG-01.", "Hardware", "DG Set", "Low", "Normal", "Resolved", 2, "u-1005", "DG-01", "WorkOrder", "Manual", [10, 4], "Approved"],
  ["Server SRV-B01-02 fan failure", "iDRAC reports fan 3 failure; RMA raised with the OEM.", "Hardware", "Server", "Medium", "Normal", "Escalated", 3, "u-1003", "SRV-B01-02", "Human", "Manual", [9, 28], "Pending"],
  ["Water leak sensor alarm — Server Hall A", "Leak rope triggered near PAC-1A condensate tray. Area checked, tray cleaned.", "Hardware", "Environment", "High", "High", "Closed", 2, "u-1003", "", "System", "System", [9, 19], "Approved"],
  ["Access card not working at Hall B door", "Card reader at Server Hall B rejects valid cards.", "Security", "Access Control", "Low", "Low", "Resolved", 4, "u-1002", "", "Human", "Manual", [9, 12], null],
  ["Storage latency spike on STR-B03-01", "Read latency above 8 ms during the backup window.", "Database", "Storage", "Medium", "Normal", "Open", 3, null, "STR-B03-01", "System", "System", [11, 10], null],
  ["Quarterly UPS PM — UPS-01", "Quarterly preventive maintenance for UPS-01.", "Hardware", "UPS", "Low", "Normal", "Assigned", 5, "u-1005", "UPS-01", "WorkOrder", "Manual", [11, 2], "Approved"],
  ["Rack R-A06 under maintenance", "Re-cabling of R-A06 after the server refresh.", "Network", "Cabling", "Low", "Low", "Open", 4, "u-1004", "", "Human", "Manual", [11, 5], null],
  ["CCTV camera CAM-HALL-A offline", "Camera stopped streaming; PoE port shows no power draw.", "Security", "CCTV", "Medium", "Normal", "Closed", 3, "u-1002", "CAM-HALL-A", "System", "System", [8, 30], "Approved"],
  ["Chiller-01 condenser approach high", "Condenser approach temperature trending up — tube cleaning recommended.", "Hardware", "Chiller", "Medium", "Normal", "Resolved", 3, "u-1003", "CHILLER-01", "Human", "Manual", [8, 21], null],
  ["Application monitoring agent crash", "DCIM collector service restarted 3 times in one hour.", "Application", "Collector", "Low", "Low", "Closed", 4, "u-1001", "", "Human", "Manual", [8, 15], null],
];

export const TICKETS = TICKET_ROWS.map(([title, description, category, subCategory, severity, priority, status, slaId, assignee, device, ticketType, ticketSource, [m, d], approvalStatus], i) => {
  const id = 1001 + i;
  const created = new Date(Date.UTC(2026, m - 1, d, 6 + (i % 10), (i * 13) % 60));
  const sla = SLAS.find((s) => s.id === slaId);
  const deadline = new Date(created.getTime() + sla.resolutionTimeInMinutes * 60000);
  const done = status === "Resolved" || status === "Closed";
  const resolvedAt = done ? new Date(created.getTime() + Math.round(sla.resolutionTimeInMinutes * (0.4 + (i % 5) * 0.15)) * 60000) : null;
  const now = new Date("2026-11-12T09:00:00Z");
  const breached = done ? resolvedAt > deadline : now > deadline;
  const assignedUser = USERS.find((u) => u.id === assignee);
  return {
    id, ticketId: id, ticketNumber: `TKT-${id}`, ticketTitle: title, title, description, category, subCategory,
    severity, priority, status, slaId, slaName: sla.name,
    reporterId: i % 3 === 0 ? "admin@dcim.local" : "neha.singh@dcim.local",
    assignedToId: assignedUser ? assignedUser.email : null,
    estimatedResolutionTime: deadline.toISOString(), slaBreached: breached,
    attachmentCount: i % 4 === 0 ? 1 : 0,
    ticketType, ticketSource, deviceId: device ? dev(device) : "", deviceName: device || "",
    projectName: "Noida DC-1", alertId: ticketSource === "System" ? `ALM-${4400 + i}` : "",
    latitude: 28.627, longitude: 77.3727, landmark: "Noida DC-1",
    workOrderTemplateId: ticketType === "WorkOrder" ? (subCategory === "UPS" ? 1 : subCategory === "DG Set" ? 2 : subCategory === "Firewall" ? 4 : null) : null,
    scheduledStart: ticketType === "WorkOrder" ? new Date(created.getTime() + 86400000).toISOString() : null,
    scheduledEnd: ticketType === "WorkOrder" ? new Date(created.getTime() + 86400000 + 4 * 3600000).toISOString() : null,
    incidentOn: created.toISOString(), incidentLoggedOn: new Date(created.getTime() + 5 * 60000).toISOString(),
    resolvedAt: resolvedAt ? resolvedAt.toISOString() : null,
    closedAt: status === "Closed" ? new Date(resolvedAt.getTime() + 3600000).toISOString() : null,
    actualElapsedMinutes: done ? Math.round((resolvedAt - created) / 60000) : Math.round((now - created) / 60000),
    approvalStatus, resolution: done ? "Root cause fixed and verified by the NOC." : null,
    createdAt: created.toISOString(), updatedAt: (resolvedAt || created).toISOString(),
  };
});

export function seedTicketAudit(t) {
  const rows = [{ action: "Created", fieldName: null, oldValue: null, newValue: t.status === "Open" ? "Open" : "Open", performedBy: t.reporterId, performedAt: t.createdAt, notes: "Ticket logged." }];
  if (t.assignedToId) rows.push({ action: "Assigned", fieldName: "AssignedToId", oldValue: null, newValue: t.assignedToId, performedBy: "admin@dcim.local", performedAt: new Date(new Date(t.createdAt).getTime() + 12 * 60000).toISOString(), notes: "" });
  if (t.status === "Escalated") rows.push({ action: "Escalated", fieldName: "Status", oldValue: "Assigned", newValue: "Escalated", performedBy: "system", performedAt: new Date(new Date(t.createdAt).getTime() + 45 * 60000).toISOString(), notes: "SLA level 1 crossed." });
  if (t.approvalStatus === "Approved") rows.push({ action: "Approved", fieldName: "ApprovalStatus", oldValue: "Pending", newValue: "Approved", performedBy: "rohan.das@dcim.local", performedAt: new Date(new Date(t.createdAt).getTime() + 30 * 60000).toISOString(), notes: "Approved for execution." });
  if (t.resolvedAt) rows.push({ action: "Resolved", fieldName: "Status", oldValue: "Assigned", newValue: "Resolved", performedBy: t.assignedToId || "admin@dcim.local", performedAt: t.resolvedAt, notes: t.resolution });
  if (t.closedAt) rows.push({ action: "Closed", fieldName: "Status", oldValue: "Resolved", newValue: "Closed", performedBy: "admin@dcim.local", performedAt: t.closedAt, notes: "Closed after verification." });
  return rows.map((r, i) => ({ id: t.ticketId * 100 + i, ticketId: t.ticketId, ...r, field: r.fieldName, propertyName: r.fieldName }));
}
