// Static "Ticket Management" service — tickets, SLA, escalation matrix,
// work-order templates, e-mail templates, ticket audit trail, attachments.
// Also answers the User list (for the ticket "Assign" dropdown).
import { route, reply, badRequest, notFound } from "../core/http";
import { Table, searchRows, byId, toBool, toNum, nowIso } from "../core/store";
import { pdfDocument, urlForUpload, dataUrlToBlob } from "../core/files";
import { SLAS, ESCALATIONS, WORK_ORDER_TEMPLATES, EMAIL_TEMPLATES, TICKETS, USERS, seedTicketAudit } from "../seed/ticket";

export const tdb = {
  slas: new Table(SLAS),
  escalations: new Table(ESCALATIONS),
  templates: new Table(WORK_ORDER_TEMPLATES),
  emails: new Table(EMAIL_TEMPLATES),
  tickets: new Table(TICKETS),
  audit: new Table(TICKETS.flatMap(seedTicketAudit)),
  attachments: new Table(
    TICKETS.filter((t) => t.attachmentCount > 0).map((t, i) => {
      const doc = pdfDocument(`Ticket ${t.ticketNumber} — Site Report`, [t.ticketTitle, `Category: ${t.category} / ${t.subCategory}`, `Status: ${t.status}`, `Logged: ${new Date(t.createdAt).toUTCString()}`]);
      return { id: 501 + i, ticketId: t.ticketId, fileName: `${t.ticketNumber}_site_report.pdf`, contentType: "application/pdf", fileSize: doc.base64.length, url: doc.dataUrl, uploadedBy: t.reporterId, uploadedAt: t.createdAt, createdAt: t.createdAt };
    })
  ),
};

const blobs = new Map(); // attachment id → File picked in this session
const user = (idOrEmail) => USERS.find((u) => u.id === idOrEmail || u.email === idOrEmail);
const sla = (id) => tdb.slas.find(id);

function decorate(t) {
  const attachmentCount = tdb.attachments.where((a) => a.ticketId === t.ticketId).length;
  return { ...t, slaName: sla(t.slaId)?.name || t.slaName || "", attachmentCount };
}

function addAudit(ticketId, action, fieldName, oldValue, newValue, notes = "") {
  tdb.audit.insert({ ticketId, action, fieldName, field: fieldName, propertyName: fieldName, oldValue, newValue, performedBy: "admin@dcim.local", performedAt: nowIso(), notes });
}

const TICKET_FIELDS = ["title", "description", "category", "subCategory", "reporterId", "severity", "priority", "slaId", "latitude", "longitude", "landmark", "ticketType", "deviceId", "projectName", "alertId", "ticketSource", "workOrderTemplateId", "scheduledStart", "scheduledEnd"];

function ticketFromBody(body, existing = {}) {
  const t = {};
  TICKET_FIELDS.forEach((k) => { if (body?.[k] !== undefined) t[k] = body[k]; });
  if (t.slaId !== undefined) t.slaId = toNum(t.slaId);
  if (t.workOrderTemplateId !== undefined) t.workOrderTemplateId = toNum(t.workOrderTemplateId);
  if (t.title !== undefined) t.ticketTitle = t.title;
  const slaRow = sla(t.slaId ?? existing.slaId);
  const base = existing.createdAt ? new Date(existing.createdAt) : new Date();
  if (slaRow) t.estimatedResolutionTime = new Date(base.getTime() + slaRow.resolutionTimeInMinutes * 60000).toISOString();
  return t;
}

function createTicket(fields) {
  const now = nowIso();
  const id = tdb.tickets.nextId();
  const row = tdb.tickets.insert({
    id, ticketId: id, ticketNumber: `TKT-${id}`, status: "Open", approvalStatus: fields.ticketType === "WorkOrder" ? "Pending" : null,
    assignedToId: null, slaBreached: false, attachmentCount: 0, incidentOn: now, incidentLoggedOn: now,
    resolvedAt: null, closedAt: null, actualElapsedMinutes: 0, createdAt: now, updatedAt: now, ...fields,
  });
  row.ticketTitle = row.ticketTitle || row.title;
  addAudit(row.ticketId, "Created", null, null, "Open", "Ticket logged.");
  return row;
}

export const ticketRoutes = [
  // Tickets
  route("GET", "/tickets", ({ q }) => {
    let rows = tdb.tickets.all().slice().sort((a, b) => b.ticketId - a.ticketId);
    ["status", "priority", "severity", "category"].forEach((k) => { if (q(k)) rows = rows.filter((r) => String(r[k]).toLowerCase() === String(q(k)).toLowerCase()); });
    rows = searchRows(rows, q("search"), ["ticketTitle", "description", "ticketNumber", "category"]);
    const page = Math.max(1, Number(q("page")) || 1);
    const pageSize = Math.max(1, Number(q("pageSize")) || 10);
    return { items: rows.slice((page - 1) * pageSize, page * pageSize).map(decorate), total: rows.length, page, pageSize, totalPages: Math.max(1, Math.ceil(rows.length / pageSize)) };
  }),
  route("GET", "/tickets/:id/audit", ({ match }) => tdb.audit.where((a) => String(a.ticketId) === String(match.id)).sort((a, b) => String(a.performedAt).localeCompare(String(b.performedAt)))),
  route("GET", "/tickets/:id/attachments", ({ match }) => tdb.attachments.where((a) => String(a.ticketId) === String(match.id)).map(({ url, ...a }) => a)),
  route("POST", "/tickets/:id/attachments", ({ match, body }) => {
    const f = body.file || body.File || body.files;
    const file = Array.isArray(f) ? f[0] : f;
    const row = tdb.attachments.insert({ ticketId: toNum(match.id), fileName: file?.name || "attachment", contentType: file?.type || "", fileSize: file?.size || 0, url: urlForUpload(file), uploadedBy: "admin@dcim.local", uploadedAt: nowIso() });
    if (file instanceof Blob) blobs.set(String(row.id), file);
    addAudit(toNum(match.id), "AttachmentAdded", "Attachment", null, row.fileName);
    const { url, ...out } = row;
    return out;
  }),
  route("GET", "/tickets/:id/attachments/:attId/download", ({ match }) => {
    const a = tdb.attachments.find(match.attId);
    if (!a) return notFound("Attachment not found");
    const blob = blobs.get(String(a.id)) || dataUrlToBlob(a.url);
    return reply(200, blob, { "content-type": a.contentType || blob.type });
  }),
  route("GET", "/tickets/:id", ({ match }) => {
    const t = tdb.tickets.find(match.id);
    return t ? decorate(t) : notFound("Ticket not found");
  }),
  route("POST", "/tickets", ({ body }) => {
    if (!body?.title) return badRequest("Title is required.");
    return decorate(createTicket(ticketFromBody(body)));
  }),
  route("PUT", "/tickets/:id", ({ match, body }) => {
    const t = tdb.tickets.find(match.id);
    if (!t) return notFound("Ticket not found");
    const patch = ticketFromBody(body, t);
    Object.entries(patch).filter(([k, v]) => ["title", "priority", "severity", "category", "slaId"].includes(k) && String(t[k]) !== String(v)).forEach(([k, v]) => addAudit(t.ticketId, "Updated", k, t[k] == null ? null : String(t[k]), String(v)));
    return decorate(tdb.tickets.update(match.id, patch));
  }),
  route("PATCH", "/tickets/:id/assign", ({ match, body }) => {
    const t = tdb.tickets.find(match.id);
    if (!t) return notFound("Ticket not found");
    const assignee = typeof body === "string" ? body : body?.assigneeId || body?.assignedToId || "";
    const u = user(assignee);
    addAudit(t.ticketId, "Assigned", "AssignedToId", t.assignedToId, u?.email || assignee);
    return decorate(tdb.tickets.update(match.id, { assignedToId: u?.email || assignee, status: t.status === "Open" ? "Assigned" : t.status }));
  }),
  route("POST", "/tickets/:id/approve", ({ match, body }) => {
    const t = tdb.tickets.find(match.id);
    if (!t) return notFound("Ticket not found");
    addAudit(t.ticketId, "Approved", "ApprovalStatus", t.approvalStatus, "Approved", body?.notes || "");
    return decorate(tdb.tickets.update(match.id, { approvalStatus: "Approved" }));
  }),
  route("POST", "/tickets/:id/reject", ({ match, body }) => {
    const t = tdb.tickets.find(match.id);
    if (!t) return notFound("Ticket not found");
    addAudit(t.ticketId, "Rejected", "ApprovalStatus", t.approvalStatus, "Rejected", body?.notes || "");
    return decorate(tdb.tickets.update(match.id, { approvalStatus: "Rejected" }));
  }),
  route("PATCH", "/tickets/:id/close", ({ match, body }) => {
    const t = tdb.tickets.find(match.id);
    if (!t) return notFound("Ticket not found");
    const now = nowIso();
    addAudit(t.ticketId, "Closed", "Status", t.status, "Closed", typeof body === "string" ? body : body?.resolution || "");
    return decorate(tdb.tickets.update(match.id, {
      status: "Closed", closedAt: now, resolvedAt: t.resolvedAt || now, resolution: typeof body === "string" ? body : body?.resolution || "",
      actualElapsedMinutes: Math.round((Date.now() - new Date(t.createdAt).getTime()) / 60000),
    }));
  }),

  // SLA
  route("GET", "/sla", () => tdb.slas.all().slice().sort(byId)),
  route("GET", "/sla/:id", ({ match }) => tdb.slas.find(match.id) || notFound("SLA not found")),
  route("POST", "/sla", ({ body }) => (body?.name ? tdb.slas.insert({ name: body.name, resolutionTimeInMinutes: toNum(body.resolutionTimeInMinutes, 0), isActive: true }) : badRequest("Name is required."))),
  route("PUT", "/sla/:id", ({ match, body }) => tdb.slas.update(match.id, { name: body.name, resolutionTimeInMinutes: toNum(body.resolutionTimeInMinutes, 0) }) || notFound()),
  route("DELETE", "/sla/:id", ({ match }) => (tdb.slas.remove(match.id) ? reply(204, "") : notFound())),

  // Escalation matrix
  route("GET", "/escalation", () => tdb.escalations.all().slice().sort(byId).map((e) => ({ ...e, slaName: sla(e.slaId)?.name || "" }))),
  route("POST", "/escalation", ({ body }) => tdb.escalations.insert({ slaId: toNum(body.slaId), level: toNum(body.level, 0), levelname: body.levelname || "", escalationTimeInMinutes: toNum(body.escalationTimeInMinutes, 0), escalateToEmail: body.escalateToEmail || "" })),
  route("PUT", "/escalation/:id", ({ match, body }) => tdb.escalations.update(match.id, { slaId: toNum(body.slaId), level: toNum(body.level, 0), levelname: body.levelname, escalationTimeInMinutes: toNum(body.escalationTimeInMinutes, 0), escalateToEmail: body.escalateToEmail }) || notFound()),
  route("DELETE", "/escalation/:id", ({ match }) => (tdb.escalations.remove(match.id) ? reply(204, "") : notFound())),

  // Work-order templates
  route("GET", "/workordertemplates", ({ q }) => {
    const activeOnly = toBool(q("activeOnly"));
    return tdb.templates.all().slice().sort(byId).filter((t) => !activeOnly || t.isActive).map((t) => ({ ...t, defaultSLAName: sla(t.defaultSLAId)?.name || "" }));
  }),
  route("POST", "/workordertemplates", ({ body }) => tdb.templates.insert({ ...body, defaultSLAId: toNum(body.defaultSLAId), isActive: body.isActive ?? true })),
  route("PUT", "/workordertemplates/:id", ({ match, body }) => tdb.templates.update(match.id, { ...body, defaultSLAId: toNum(body.defaultSLAId) }) || notFound()),
  route("DELETE", "/workordertemplates/:id", ({ match }) => (tdb.templates.remove(match.id) ? reply(204, "") : notFound())),
  route("POST", "/workordertemplates/:id/create-ticket", ({ match, body }) => {
    const tpl = tdb.templates.find(match.id);
    if (!tpl) return notFound("Template not found");
    const slaId = toNum(body.slaIdOverride) ?? tpl.defaultSLAId;
    const created = createTicket(ticketFromBody({
      title: body.titleOverride || tpl.name, description: body.descriptionOverride || tpl.defaultDescription,
      category: tpl.category, subCategory: tpl.subCategory, priority: body.priorityOverride || tpl.defaultPriority,
      severity: "Medium", slaId, reporterId: body.reporterId || "admin@dcim.local", ticketType: body.ticketType || "WorkOrder",
      ticketSource: "Manual", workOrderTemplateId: tpl.id, scheduledStart: body.scheduledStart || null, scheduledEnd: body.scheduledEnd || null,
    }));
    return decorate(created);
  }),

  // E-mail templates
  route("GET", "/templates", () => tdb.emails.all().slice().sort(byId)),
  route("GET", "/templates/:id", ({ match }) => tdb.emails.find(match.id) || notFound()),
  route("POST", "/templates", ({ body }) => tdb.emails.insert({ name: body.name || "", subjectTemplate: body.subjectTemplate || "", bodyTemplate: body.bodyTemplate || "", isHtml: toBool(body.isHtml) })),
  route("PUT", "/templates/:id", ({ match, body }) => tdb.emails.update(match.id, { name: body.name, subjectTemplate: body.subjectTemplate, bodyTemplate: body.bodyTemplate, isHtml: toBool(body.isHtml) }) || notFound()),
  route("DELETE", "/templates/:id", ({ match }) => (tdb.emails.remove(match.id) ? reply(204, "") : notFound())),
];

// User list (the portal's User API — only the list is used, for "Assign")
export const userRoutes = [
  route("GET", "/api/users", () => USERS),
  route("GET", "/api/users/:id", ({ match }) => user(match.id) || notFound("User not found")),
];
