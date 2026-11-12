// ─────────────────────────────────────────────────────────────────────────────
// In-memory tables for the static data layer.
//
// Each table starts from the static rows in src/staticData/seed/* and lives
// only in memory: whatever is added / edited / deleted on screen stays until
// the page is reloaded, then the static data comes back.
// Every change is also written to the audit log, so the "History" panels show
// it the same way they show the seeded history.
// ─────────────────────────────────────────────────────────────────────────────

export const nowIso = () => new Date().toISOString();
// GUID-style id for tables whose ids are strings in the original API
export const guid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
const clone = (v) => (v && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v);

// ── audit log (shared by all tables that have an auditName) ─────────────────
const auditRows = [];
let auditSeq = 5000;

export function addAudit({ tableName, recordId, actionType, columnName = null, oldValue = null, newValue = null, changedBy = "admin", changedAt = nowIso(), isFinal = false, remarks = null }) {
  auditSeq += 1;
  const row = { id: auditSeq, tableName, recordId, actionType, columnName, oldValue, newValue, changedAt, changedBy, isFinal, remarks };
  auditRows.unshift(row);
  return row;
}

export function seedAudit(rows) {
  rows.forEach((r) => {
    auditSeq = Math.max(auditSeq, r.id || 0);
    auditRows.push({ isFinal: false, remarks: null, changedBy: "admin", ...r });
  });
  auditRows.sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt)) || b.id - a.id);
}

export function auditFor(tableName, recordId) {
  const t = String(tableName || "").toLowerCase();
  return auditRows.filter(
    (r) => String(r.tableName).toLowerCase() === t && (recordId == null || String(r.recordId) === String(recordId))
  );
}

export function auditById(id) {
  return auditRows.find((r) => String(r.id) === String(id));
}

const SKIP_AUDIT = new Set(["createdAt", "updatedAt", "createdDate", "updatedDate", "_files"]);
const asText = (v) => (v === null || v === undefined ? null : typeof v === "object" ? JSON.stringify(v) : String(v));

// ── table ────────────────────────────────────────────────────────────────────
export class Table {
  constructor(rows = [], { auditName = null, idField = "id", softDelete = false, idFactory = null } = {}) {
    this.rows = rows.map(clone);
    this.auditName = auditName;
    this.idField = idField;
    this.softDelete = softDelete;
    this.idFactory = idFactory;
    this.seq = this.rows.reduce((m, r) => Math.max(m, Number(r[idField]) || 0), 0);
  }

  nextId() {
    if (this.idFactory) return this.idFactory();
    this.seq += 1;
    return this.seq;
  }

  all({ includeDeleted = true } = {}) {
    return includeDeleted ? this.rows : this.rows.filter((r) => !r.isDeleted);
  }

  find(id) {
    return this.rows.find((r) => String(r[this.idField]) === String(id)) || null;
  }

  where(fn) {
    return this.rows.filter(fn);
  }

  insert(data = {}) {
    const row = { ...clone(data) };
    if (row[this.idField] === undefined || row[this.idField] === null || row[this.idField] === "" || this.find(row[this.idField])) {
      row[this.idField] = this.nextId();
    } else {
      this.seq = Math.max(this.seq, Number(row[this.idField]) || 0);
    }
    const ts = nowIso();
    if (row.createdAt === undefined) row.createdAt = ts;
    if (row.updatedAt === undefined) row.updatedAt = ts;
    if (row.isDeleted === undefined && this.softDelete) row.isDeleted = false;
    this.rows.unshift(row);
    if (this.auditName) {
      const first = Object.keys(row).find((k) => /name/i.test(k) && typeof row[k] === "string") || this.idField;
      addAudit({ tableName: this.auditName, recordId: row[this.idField], actionType: "INSERT", columnName: first, newValue: asText(row[first]) });
    }
    return row;
  }

  update(id, patch = {}) {
    const row = this.find(id);
    if (!row) return null;
    const changes = [];
    Object.entries(patch).forEach(([k, v]) => {
      if (k === this.idField || v === undefined) return;
      const before = row[k];
      if (asText(before) !== asText(v)) changes.push([k, before, v]);
      row[k] = clone(v);
    });
    row.updatedAt = nowIso();
    if (this.auditName) {
      changes
        .filter(([k]) => !SKIP_AUDIT.has(k) && typeof patch[k] !== "object")
        .slice(0, 8)
        .forEach(([k, before, after]) =>
          addAudit({ tableName: this.auditName, recordId: row[this.idField], actionType: "UPDATE", columnName: k, oldValue: asText(before), newValue: asText(after) })
        );
    }
    return row;
  }

  remove(id) {
    const row = this.find(id);
    if (!row) return null;
    if (this.softDelete) {
      row.isDeleted = true;
      row.updatedAt = nowIso();
    } else {
      this.rows = this.rows.filter((r) => r !== row);
    }
    if (this.auditName) {
      addAudit({ tableName: this.auditName, recordId: row[this.idField], actionType: "DELETE", columnName: "isDeleted", oldValue: "false", newValue: "true" });
    }
    return row;
  }

  restore(id) {
    const row = this.find(id);
    if (!row) return null;
    row.isDeleted = false;
    row.updatedAt = nowIso();
    if (this.auditName) {
      addAudit({ tableName: this.auditName, recordId: row[this.idField], actionType: "UPDATE", columnName: "isDeleted", oldValue: "true", newValue: "false" });
    }
    return row;
  }
}

// ── list helpers ─────────────────────────────────────────────────────────────
export function searchRows(rows, term, fields) {
  const t = String(term || "").trim().toLowerCase();
  if (!t) return rows;
  return rows.filter((r) =>
    (fields || Object.keys(r)).some((f) => {
      const v = typeof f === "function" ? f(r) : r[f];
      return v !== null && v !== undefined && typeof v !== "object" && String(v).toLowerCase().includes(t);
    })
  );
}

// Reads Page/PageSize (or page/pageSize, pageNumber/pageSize) case-insensitively.
export function pageInfo(q, { defaultSize = 10 } = {}) {
  const pageRaw = q("Page") ?? q("pageNumber");
  const sizeRaw = q("PageSize");
  const isPaginatedRaw = q("IsPaginated");
  const explicitOff = String(isPaginatedRaw).toLowerCase() === "false";
  const explicitOn = String(isPaginatedRaw).toLowerCase() === "true";
  const paged = explicitOn || (!explicitOff && pageRaw !== undefined);
  const page = Math.max(1, Number(pageRaw) || 1);
  const pageSize = Math.max(1, Number(sizeRaw) || defaultSize);
  return { paged, page, pageSize };
}

export function slicePage(rows, { page, pageSize }) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(page, totalPages);
  return { rows: rows.slice((p - 1) * pageSize, p * pageSize), total, page: p, pageSize, totalPages };
}

export const byNewest = (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || (Number(b.id) || 0) - (Number(a.id) || 0);
export const byId = (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0);
export const toBool = (v) => v === true || v === "true" || v === 1 || v === "1" || v === "True";
export const toNum = (v, fb = null) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? fb : Number(v));
