// Static "Company Management" service — Area (Currency, Country, State, City,
// Time zone), Company, Company role, Domain, Locations, Audit history, Files.
// Answers the same URLs the Company screens call, from src/staticData/seed.
import { route, ok, badRequest, notFound } from "../core/http";
import { Table, searchRows, pageInfo, slicePage, byId, toBool, toNum, auditFor, auditById, seedAudit, nowIso, guid } from "../core/store";
import { CURRENCIES, COUNTRIES, STATES, CITIES, TIME_ZONES } from "../seed/area";
import { COMPANIES, COMPANY_ROLES, COMPANY_DOMAINS, COMPANY_LOCATIONS } from "../seed/company";
import { ENTITY_TYPES_COMPANY } from "../seed/device";
import { svgImage, pdfDocument, registerFileUrl } from "../core/files";
import { createFileStore, fileStoreRoutes } from "./fileStore";

// ── tables ───────────────────────────────────────────────────────────────────
export const db = {
  currencies: new Table(CURRENCIES, { auditName: "Currencies", softDelete: false }),
  countries: new Table(COUNTRIES, { auditName: "Countries" }),
  states: new Table(STATES, { auditName: "States" }),
  cities: new Table(CITIES, { auditName: "Cities", softDelete: true }),
  timezones: new Table(TIME_ZONES, { auditName: "TimeZones" }),
  roles: new Table(COMPANY_ROLES, { auditName: "CompanyRoles", idFactory: guid }),
  domains: new Table(COMPANY_DOMAINS, { auditName: "CompanyDomains" }),
  companies: new Table(COMPANIES, { auditName: "Companies", softDelete: true }),
  locations: new Table(COMPANY_LOCATIONS, { auditName: "Locations" }),
  entityTypes: new Table(ENTITY_TYPES_COMPANY),
};

// Seeded images / documents for a few companies (entity type 1 = "Company")
const seedFiles = [];
[[16, "Acme Technologies"], [17, "Tech Solutions Inc"], [20, "Northstar FinServ Ltd"], [1, "Dell Technologies"], [6, "Schneider Electric"]].forEach(([companyId, name], i) => {
  const img = svgImage(name, "Company profile", i, "site");
  const doc = pdfDocument(`${name} — Registration Certificate`, [`Company: ${name}`, "Document type: Compliance Certificate", "Issued by: Government Authority", "Valid till: 31-Mar-2028"]);
  seedFiles.push(
    { entityTypeId: 1, entityId: companyId, fileCategory: "Image", fileName: `${name.replace(/\W+/g, "_")}_office.svg`, originalFileName: `${name}.svg`, fileType: "Office", contentType: "image/svg+xml", fileUrl: img.dataUrl, filePath: img.dataUrl, fileUse: "Office photo", fileExpiryDate: null, createdAt: "2025-05-02T10:00:00Z" },
    { entityTypeId: 1, entityId: companyId, fileCategory: "Document", fileName: `${name.replace(/\W+/g, "_")}_registration.pdf`, originalFileName: "registration.pdf", contentType: "application/pdf", fileUrl: doc.dataUrl, filePath: doc.dataUrl, documentPath: doc.dataUrl, documentName: "Registration Certificate", documentNumber: `REG-${2025}-${1000 + companyId}`, documentTypeId: 8, documentTypeName: "Compliance Certificate", issuedById: 4, issuedByDate: "2025-04-01", documentValidTill: "2028-03-31", createdAt: "2025-05-02T10:05:00Z" },
  );
});
export const companyFiles = createFileStore(seedFiles, 9001);

// Composite rows exactly like the Company API returns them
db.companies.rows.forEach((c) => {
  c.images = companyFiles.where((f) => f.entityTypeId === 1 && f.entityId === c.id && f.fileCategory === "Image");
  c.documents = companyFiles.where((f) => f.entityTypeId === 1 && f.entityId === c.id && f.fileCategory === "Document");
});

// Seeded audit history (Company "Full History" panels)
seedAudit([
  ...COMPANIES.map((c, i) => ({ id: 1000 + i, tableName: "Companies", recordId: c.id, actionType: "INSERT", columnName: "CompanyName", oldValue: null, newValue: c.companyName, changedAt: c.createdAt, changedBy: "admin", isFinal: i % 4 === 0 })),
  { id: 1100, tableName: "Companies", recordId: 16, actionType: "UPDATE", columnName: "CompanyDescription", oldValue: "Primary tenant.", newValue: "Primary tenant — hosts the core production workloads.", changedAt: "2025-08-12T11:20:00Z", changedBy: "admin" },
  { id: 1101, tableName: "Companies", recordId: 22, actionType: "DELETE", columnName: "IsDeleted", oldValue: "false", newValue: "true", changedAt: "2025-10-02T15:45:00Z", changedBy: "admin" },
  { id: 1102, tableName: "Companies", recordId: 18, actionType: "UPDATE", columnName: "CompanyType", oldValue: "Customer", newValue: "Colocation Tenant", changedAt: "2025-09-18T09:10:00Z", changedBy: "admin" },
]);

// ── helpers ──────────────────────────────────────────────────────────────────
const envelopeList = (rows, q, { defaultSize = 10, forcePaged = false } = {}) => {
  const pi = pageInfo(q, { defaultSize });
  if (!pi.paged && !forcePaged) {
    return { status: true, message: "Success", data: rows, totalRecords: rows.length, page: 1, pageSize: rows.length, totalPages: 1 };
  }
  const p = slicePage(rows, pi);
  return { status: true, message: "Success", data: p.rows, totalRecords: p.total, page: p.page, pageSize: p.pageSize, totalPages: p.totalPages };
};
const one = (row, message = "Success") => (row ? { status: true, message, data: row } : notFound());
const done = (message, data) => ({ status: true, message, ...(data !== undefined ? { data } : {}) });

const currencyOf = (id) => db.currencies.find(id);
const decorateCountry = (c) => {
  const cur = currencyOf(c.currencyId);
  return { ...c, currencyName: cur?.name || "", currencySymbol: cur?.symbol || "", currencyCode: cur?.code || "" };
};
const decorateState = (s) => ({ ...s, countryName: db.countries.find(s.countryId)?.name || "" });
const decorateCity = (c) => {
  const s = db.states.find(c.stateId);
  return { ...c, stateName: s?.name || "", countryId: s?.countryId ?? null, countryName: db.countries.find(s?.countryId)?.name || "" };
};

const companyComposite = (c) => {
  const { contactPersons = [], companyAddresses = [], bankDetails = [], companyDomains = [], images = [], documents = [], ...company } = c;
  return {
    company: { ...company },
    contactPersons, companyAddresses, bankDetails,
    companyDomain: companyDomains, companyDomains,
    images: companyFiles.where((f) => f.entityTypeId === 1 && String(f.entityId) === String(c.id) && f.fileCategory === "Image"),
    documents: companyFiles.where((f) => f.entityTypeId === 1 && String(f.entityId) === String(c.id) && f.fileCategory === "Document"),
  };
};

const listOf = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : typeof v === "object" ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]) : [v]);

// FormData from the Company modal → company row
function companyFromBody(body, existing = {}) {
  const domainIds = listOf(body.companyDomainIds).map((x) => toNum(x)).filter((x) => x !== null);
  const typeVal = body.companyType;
  const role = db.roles.find(typeVal);
  const contacts = listOf(body.contactPersons).map((ct, i) => ({
    id: toNum(ct.id) ?? Date.now() + i, companyId: existing.id, isPrimary: i === 0, images: [], documents: [],
    userName: ct.userName || "", userPrimaryEmail: ct.userPrimaryEmail || "", userSecondaryEmail: ct.userSecondaryEmail || "",
    userPrimaryPhoneNumber: ct.userPrimaryPhoneNumber || "", userSecondaryPhoneNumber: ct.userSecondaryPhoneNumber || "",
  }));
  const addresses = listOf(body.companyAddresses).map((a, i) => {
    const city = db.cities.find(a.cityId);
    const state = db.states.find(a.stateId);
    return {
      id: toNum(a.id) ?? Date.now() + 100 + i, companyId: existing.id, images: [], documents: [],
      addressLine1: a.addressLine1 || "", addressLine2: a.addressLine2 || "", pinCode: a.pinCode || "", landmark: a.landmark || "",
      locationContactNumber: a.locationContactNumber || "", countryId: toNum(a.countryId), stateId: toNum(a.stateId), cityId: toNum(a.cityId),
      timeZoneId: toNum(a.timeZoneId), latitude: toNum(a.latitude, ""), longitude: toNum(a.longitude, ""),
      city: city?.name || "", state: state?.name || "",
    };
  });
  const banks = listOf(body.bankDetails).map((b, i) => ({
    id: toNum(b.id) ?? Date.now() + 200 + i, companyId: existing.id, images: [], documents: [],
    bankName: b.bankName || "", accountHolderName: b.accountHolderName || "", accountNumber: b.accountNumber || "",
    ifscCode: b.ifscCode || "", branchName: b.branchName || "", swiftCode: b.swiftCode || "", iban: b.iban || "",
    accountType: b.accountType || "", isPrimary: toBool(b.isPrimary),
  }));
  return {
    companyName: body.companyName ?? existing.companyName ?? "",
    companyType: role ? role.name : typeVal ?? existing.companyType ?? "",
    companyDescription: body.companyDescription ?? existing.companyDescription ?? "",
    companyDomains: domainIds.length ? domainIds.map((id) => db.domains.find(id)).filter(Boolean).map((d) => ({ id: d.id, domainName: d.domainName })) : existing.companyDomains || [],
    contactPersons: body.contactPersons !== undefined ? contacts : existing.contactPersons || [],
    companyAddresses: body.companyAddresses !== undefined ? addresses : existing.companyAddresses || [],
    bankDetails: body.bankDetails !== undefined ? banks : existing.bankDetails || [],
  };
}

function locationFromBody(b) {
  return {
    companyId: toNum(b.companyId), locationType: b.locationType || "", addressLine1: b.addressLine1 || "", addressLine2: b.addressLine2 || "",
    countryId: toNum(b.countryId), stateId: toNum(b.stateId), cityId: toNum(b.cityId), pinCode: b.pinCode ?? "",
    landmark: b.landmark || "", latitude: toNum(b.latitude, ""), longitude: toNum(b.longitude, ""), timeZoneId: toNum(b.timeZoneId),
    locationContactNumber: b.locationContactNumber || "", images: [], documents: [],
  };
}

const auditList = (table, recordId, q) => {
  const rows = auditFor(table, recordId);
  const pi = pageInfo(q, { defaultSize: 10 });
  const p = slicePage(rows, pi.paged ? pi : { page: 1, pageSize: rows.length || 1 });
  return { status: true, message: "Success", data: p.rows, totalRecords: p.total, page: p.page, pageSize: p.pageSize, totalPages: p.totalPages };
};

// ── routes ───────────────────────────────────────────────────────────────────
export const companyRoutes = [
  // Currency
  route("GET", "/Currency/get-all-currency", ({ q }) =>
    envelopeList(searchRows(db.currencies.all().slice().sort(byId), q("Search"), ["name", "code", "symbol"]), q)),
  route("GET", "/Currency/get-currency/:id", ({ match }) => one(db.currencies.find(match.id))),
  route("POST", "/Currency/add-currency", ({ body }) => {
    if (!body.code || !body.name) return badRequest("Code and name are required.");
    if (db.currencies.all().some((c) => c.code?.toLowerCase() === String(body.code).toLowerCase())) return badRequest(`Currency code ${body.code} already exists.`);
    return one(db.currencies.insert({ code: body.code, name: body.name, symbol: body.symbol || "", isActive: body.isActive ?? true }), "Currency created");
  }),
  route("POST", "/Currency/update-currency/:id", ({ match, body }) => one(db.currencies.update(match.id, { code: body.code, name: body.name, symbol: body.symbol, isActive: body.isActive }), "Currency updated")),
  route("DELETE", "/Currency/remove-currency/:id", ({ match }) => (db.currencies.remove(match.id) ? done("Currency deleted") : notFound())),
  route("PATCH", "/Currency/restore-currency/:id/status", ({ match, body }) => one(db.currencies.update(match.id, { isActive: toBool(body?.isActive ?? body) }), "Status updated")),

  // Country
  route("GET", "/Country/get-country", ({ q }) =>
    envelopeList(searchRows(db.countries.all({ includeDeleted: false }).slice().sort(byId).map(decorateCountry), q("Search"), ["name", "code", "currencyName"]), q)),
  route("GET", "/Country/get-country/:id", ({ match }) => one(db.countries.find(match.id) && decorateCountry(db.countries.find(match.id)))),
  route("POST", "/Country/add-country", ({ body }) => {
    if (!body.name) return badRequest("Country name is required.");
    return one(decorateCountry(db.countries.insert({ name: body.name, code: body.code || "", currencyId: toNum(body.currencyId), timeZoneId: toNum(body.timeZoneId), isDeleted: false })), "Country created");
  }),
  route("PUT", "/Country/update-country/:id", ({ match, body }) => one(db.countries.update(match.id, { name: body.name, code: body.code, currencyId: toNum(body.currencyId), timeZoneId: toNum(body.timeZoneId) }), "Country updated")),
  route("DELETE", "/remove-country/:id", ({ match }) => (db.countries.remove(match.id) ? done("Country deleted") : notFound())),
  route("DELETE", "/Country/remove-country/:id", ({ match }) => (db.countries.remove(match.id) ? done("Country deleted") : notFound())),

  // State
  route("GET", "/State/getAll-state", ({ q }) => {
    let rows = db.states.all({ includeDeleted: false }).slice().sort(byId).map(decorateState);
    if (q("CountryId")) rows = rows.filter((s) => String(s.countryId) === String(q("CountryId")));
    return envelopeList(searchRows(rows, q("Search"), ["name", "statusCode", "countryName"]), q);
  }),
  route("GET", "/State/by-country/:countryId", ({ match }) =>
    envelopeList(db.states.where((s) => String(s.countryId) === String(match.countryId) && !s.isDeleted).sort(byId).map(decorateState), () => undefined)),
  route("POST", "/State/create-state", ({ body }) => {
    if (!body.name || !body.countryId) return badRequest("State name and country are required.");
    return one(decorateState(db.states.insert({ name: body.name, countryId: toNum(body.countryId), statusCode: body.statusCode || body.stateCode || "", isDeleted: false })), "State created");
  }),
  route("POST", "/State/update-state/:id", ({ match, body }) => one(db.states.update(match.id, { name: body.name, countryId: toNum(body.countryId), statusCode: body.statusCode ?? body.stateCode }), "State updated")),
  route("DELETE", /^\/State\/remove-state\/?(\d+)$/i, ({ match }) => (db.states.remove(match[1]) ? done("State deleted") : notFound())),

  // City
  route("GET", "/City/get-all-city", ({ q }) =>
    envelopeList(searchRows(db.cities.all().slice().sort(byId).map(decorateCity), q("Search"), ["name", "stateName", "countryName"]), q)),
  route("GET", "/City/by-state/:stateId", ({ match }) =>
    envelopeList(db.cities.where((c) => String(c.stateId) === String(match.stateId) && !c.isDeleted).sort(byId).map(decorateCity), () => undefined)),
  route("POST", "/City/create-city", ({ body }) => {
    if (!body.name || !body.stateId) return badRequest("City name and state are required.");
    return one(decorateCity(db.cities.insert({ name: body.name, stateId: toNum(body.stateId), isDeleted: false })), "City created");
  }),
  route("POST", "/City/update-city/:id", ({ match, body }) => one(db.cities.update(match.id, { name: body.name, stateId: toNum(body.stateId) }), "City updated")),
  route("DELETE", "/City/remove-city/:id", ({ match }) => (db.cities.remove(match.id) ? done("City deleted") : notFound())),
  route("PATCH", "/City/:id/restore-city", ({ match }) => one(db.cities.restore(match.id), "City restored")),

  // Time zone
  route("GET", "/TimeZone/get-all-timezone", ({ q }) =>
    envelopeList(searchRows(db.timezones.all().slice().sort(byId), q("Search"), ["timeZoneName", "utcOffset"]), q)),
  route("POST", "/TimeZone/add-timezone", ({ body }) => one(db.timezones.insert({ timeZoneName: body.timeZoneName || body.name || "", utcOffset: body.utcOffset || "", countryId: toNum(body.countryId), isActive: true }), "Timezone added")),
  route("POST", "/TimeZone/update-timezone/:id", ({ match, body }) => one(db.timezones.update(match.id, { timeZoneName: body.timeZoneName, utcOffset: body.utcOffset, countryId: toNum(body.countryId) }), "Timezone updated")),
  route("DELETE", "/TimeZone/:id", ({ match }) => (db.timezones.remove(match.id) ? done("Timezone deleted") : notFound())),

  // Company domains
  route("GET", "/CompanyDomain/get-all-domain", ({ q }) =>
    envelopeList(searchRows(db.domains.all().slice().sort(byId), q("Search"), ["domainName"]), q)),
  route("GET", /^\/CompanyDomain\/get-domain-by-company\/?(\d+)\/companies$/i, ({ match }) => {
    const c = db.companies.find(match[1]);
    return { status: true, message: "Success", data: c?.companyDomains || [] };
  }),
  route("POST", "/CompanyDomain/add-domain", ({ body }) => one(db.domains.insert({ domainName: body.domainName || "", description: body.description || "", isActive: true }), "Domain added")),
  route("POST", /^\/CompanyDomain\/update-domain\/?(\d+)$/i, ({ match, body }) => one(db.domains.update(match[1], { domainName: body.domainName, description: body.description }), "Domain updated")),
  route("POST", "/CompanyDomain/:id", ({ match }) => (db.domains.remove(match.id) ? done("Domain deleted") : notFound())),
  route("DELETE", "/CompanyDomain/:id", ({ match }) => (db.domains.remove(match.id) ? done("Domain deleted") : notFound())),

  // Company roles
  route("GET", "/CompanyRole/get-all-companyrole", ({ q }) =>
    envelopeList(searchRows(db.roles.all().slice().sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || ""))), q("Search"), ["name", "description"]), q)),
  route("POST", "/CompanyRole/add-companyrole", ({ body }) => one(db.roles.insert({ name: body.name || "", description: body.description || "", isActive: body.isActive ?? true }), "Company role added")),
  route("POST", "/CompanyRole/update-companyrole/:id", ({ match, body }) => one(db.roles.update(match.id, { name: body.name, description: body.description, isActive: body.isActive }), "Company role updated")),

  // Companies
  route("GET", "/Company/get-all-company", ({ q }) => {
    let rows = db.companies.all().slice().sort(byId);
    const term = q("search") ?? q("Search");
    if (term) rows = searchRows(rows, term, ["companyName", "companyType", "companyDescription", (r) => r.contactPersons?.[0]?.userName, (r) => r.contactPersons?.[0]?.userPrimaryEmail]);
    const type = q("companyType");
    if (type) {
      const t = String(type).toLowerCase();
      rows = rows.filter((r) => String(r.companyType).toLowerCase() === t || String(r.ownershipType || "").toLowerCase() === t);
    }
    return envelopeList(rows.map(companyComposite), q);
  }),
  route("GET", "/Company/get-company/:id", ({ match }) => {
    const c = db.companies.find(match.id);
    return c ? companyComposite(c) : notFound("Company not found");
  }),
  route("POST", "/Company/add-company", ({ body }) => {
    const data = companyFromBody(body);
    if (!data.companyName) return badRequest("Company name is required.");
    const row = db.companies.insert({ ...data, ownershipType: "Private", isDeleted: false, images: [], documents: [] });
    row.contactPersons.forEach((c) => { c.companyId = row.id; });
    row.companyAddresses.forEach((a) => { a.companyId = row.id; });
    row.bankDetails.forEach((b) => { b.companyId = row.id; });
    return { status: true, message: "Company created", data: { ...companyComposite(row), id: row.id, companyId: row.id } };
  }),
  route("POST", "/Company/update-company/:id", ({ match, body }) => {
    const existing = db.companies.find(match.id);
    if (!existing) return notFound("Company not found");
    const row = db.companies.update(match.id, companyFromBody(body, existing));
    return { status: true, message: "Company updated", data: { ...companyComposite(row), id: row.id, companyId: row.id } };
  }),
  route("POST", "/remove-company/:id", ({ match }) => (db.companies.remove(match.id) ? done("Company deleted") : notFound())),
  route("POST", "/Company/:id/MarkDeleteFalse", ({ match }) => one(db.companies.restore(match.id), "Company restored")),
  route("PUT", "/Company/restore/:id", ({ match }) => one(db.companies.restore(match.id), "Company restored")),
  route("POST", "/Company/import-company-data", ({ body }) => importRows(body)),
  route("POST", "/CompanyImport/import", ({ body }) => importRows(body)),

  // Locations
  route("GET", "/Locations/:companyId/get-location-by-company", ({ match }) => {
    const rows = db.locations.where((l) => String(l.companyId) === String(match.companyId) && !l.isDeleted).sort(byId);
    return { status: true, message: "Success", data: rows, totalRecords: rows.length };
  }),
  route("POST", "/Locations/add-location", ({ body }) => one(db.locations.insert({ ...locationFromBody(body), isDeleted: false }), "Location added")),
  route("POST", "/Locations/:id/update-location", ({ match, body }) => {
    const patch = locationFromBody(body);
    Object.keys(patch).forEach((k) => (patch[k] === null || patch[k] === "" || (Array.isArray(patch[k]) && !patch[k].length)) && body[k] === undefined && delete patch[k]);
    return one(db.locations.update(match.id, patch), "Location updated");
  }),
  route("POST", /^\/Locations\/(\d+)\/?remove-location$/i, ({ match }) => (db.locations.remove(match[1]) ? done("Location removed") : notFound())),

  // Audit history (all "History" panels)
  route("GET", "/Audit/history/:table/:id", ({ match, q }) => auditList(match.table, match.id, q)),
  route("GET", "/Audit/history/:table", ({ match, q }) => auditList(match.table, null, q)),
  route("POST", "/Audit/mark-as-final/:id", ({ match }) => {
    const row = auditById(match.id);
    if (!row) return notFound("Audit record not found");
    row.isFinal = true;
    row.markedAt = nowIso();
    return { status: true, message: "Marked as final", data: row };
  }),

  // Entity types + files
  route("GET", "/EntityType/get-all-entity", () => ({ status: true, message: "Success", data: db.entityTypes.all() })),
  ...fileStoreRoutes(route, companyFiles, { uploadPath: "/FileStore/upload-files", wrap: (x) => ({ status: true, message: "Success", data: x }) }),
];

function importRows(body) {
  const file = body?.file || body?.File;
  return { status: true, message: `Import received${file?.name ? ` (${file.name})` : ""}. The demo keeps the current static records.`, data: { totalRows: 0, inserted: 0, updated: 0, failed: 0, errors: [] } };
}

export { registerFileUrl };
