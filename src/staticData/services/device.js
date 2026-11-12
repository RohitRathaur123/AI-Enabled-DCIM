// Static "Device Management" service — device categories, types, model
// specifications, device masters, device details, floors, rooms, racks, rack
// power, rack locations, network links, connection configs, documents, files.
// Answers the same URLs the Device screens call, from src/staticData/seed.
import { route, reply, badRequest, notFound } from "../core/http";
import { Table, searchRows, pageInfo, slicePage, byId, toBool, toNum, seedAudit, auditFor } from "../core/store";
import { exportBlob } from "../core/exporters";
import { svgImage, pdfDocument } from "../core/files";
import { qrDataUrl } from "../core/qr";
import { createFileStore, fileStoreRoutes } from "./fileStore";
import {
  DEVICE_CATEGORIES, DEVICE_TYPES, MODEL_CATEGORIES, UNITS, MODEL_SPECS, MODEL_PARAMETERS, DEVICE_MASTERS,
  DEVICE_DETAILS, FLOORS, ROOMS, RACKS, RACK_POWER, DEVICE_RACK_LOCATIONS, NETWORK_CONNECTIONS, CONNECTION_CONFIGS,
  DEVICE_ASSOCIATIONS, DOCUMENT_TYPES, ISSUERS, ENTITY_TYPES_DEVICE, LIFECYCLE_STAGES, LIFECYCLE_USERS,
  LIFECYCLE_LOCATIONS, lifecycleHistoryFor,
} from "../seed/device";
import { COMPANIES } from "../seed/company";

// ── tables ───────────────────────────────────────────────────────────────────
export const ddb = {
  categories: new Table(DEVICE_CATEGORIES, { auditName: "DeviceCategory", softDelete: true }),
  types: new Table(DEVICE_TYPES, { auditName: "DeviceType", softDelete: true }),
  modelCategories: new Table(MODEL_CATEGORIES, { auditName: "ModelCategory", softDelete: true }),
  units: new Table(UNITS, { auditName: "UnitMaster" }),
  specs: new Table(MODEL_SPECS, { auditName: "ModelSpecification", softDelete: true }),
  params: new Table(MODEL_PARAMETERS),
  masters: new Table(DEVICE_MASTERS, { auditName: "DeviceMaster", softDelete: true }),
  details: new Table(DEVICE_DETAILS, { auditName: "DeviceDetail", softDelete: true }),
  floors: new Table(FLOORS, { auditName: "Floors" }),
  rooms: new Table(ROOMS, { auditName: "Rooms" }),
  racks: new Table(RACKS, { auditName: "Racks" }),
  rackPower: new Table(RACK_POWER, { auditName: "RackPowerCapacities" }),
  rackLocations: new Table(DEVICE_RACK_LOCATIONS, { auditName: "DeviceRackLocations" }),
  network: new Table(NETWORK_CONNECTIONS, { auditName: "NetworkConnections" }),
  configs: new Table(CONNECTION_CONFIGS, { auditName: "DeviceConnectionConfigs" }),
  associations: new Table(DEVICE_ASSOCIATIONS.map((a, i) => ({ id: i + 1, ...a }))),
  docTypes: new Table(DOCUMENT_TYPES),
  deviceLocations: new Table([]),
  lifecycle: new Table(DEVICE_DETAILS.flatMap(lifecycleHistoryFor)),
};

// ── seeded files: device photos, model spec images / datasheets ─────────────
const entityTypeIdFor = (name) => {
  // same matching rule the screens use (exact first, then contains either way)
  const s = name.toLowerCase();
  const list = ENTITY_TYPES_DEVICE;
  const hit = list.find((e) => [e.entityTypeName, e.name].some((n) => n && (n.toLowerCase() === s || n.toLowerCase().replace(/\s+/g, "") === s.replace(/\s+/g, "") || n.toLowerCase().includes(s) || s.includes(n.toLowerCase()))));
  return hit?.id ?? null;
};
const seedFiles = [];
MODEL_SPECS.forEach((spec, i) => {
  const img = svgImage(spec.name, `${spec.companyName} · ${spec.modelNumber}`, i);
  const doc = pdfDocument(`${spec.name} — Datasheet`, [`Model number: ${spec.modelNumber}`, `Manufacturer: ${spec.companyName}`, `Device type: ${spec.deviceTypeName}`, `Category: ${spec.modelCategoryName}`]);
  const et = entityTypeIdFor("ModelSpecification");
  seedFiles.push(
    { entityTypeId: et, entityId: spec.id, fileCategory: "Image", fileName: `${spec.modelNumber}_front.svg`, originalFileName: `${spec.modelNumber}_front.svg`, contentType: "image/svg+xml", fileUrl: img.dataUrl, filePath: img.dataUrl, fileData: img.base64, base64Image: null, fileUse: "Product photo", createdAt: spec.createdAt },
    { entityTypeId: et, entityId: spec.id, fileCategory: "Document", fileName: `${spec.modelNumber}_datasheet.pdf`, originalFileName: `${spec.modelNumber}_datasheet.pdf`, contentType: "application/pdf", fileUrl: doc.dataUrl, filePath: doc.dataUrl, documentPath: doc.dataUrl, fileData: doc.base64, documentName: `${spec.name} Datasheet`, documentNumber: `DS-${spec.modelNumber}`, documentTypeId: 6, issuedById: 1, issuedByDate: "2025-01-15", documentValidTill: null, createdAt: spec.createdAt },
  );
});
DEVICE_DETAILS.slice(0, 12).forEach((d, i) => {
  const img = svgImage(d.shortName, d.deviceMasterName, i + 3);
  const inv = pdfDocument(`Purchase Invoice — ${d.tagNumber}`, [`Asset: ${d.shortName}`, `Model: ${d.deviceMasterName}`, `Serial number: ${d.serialNumber}`, `Purchase date: ${d.purchaseDate}`, `Amount: INR ${Number(d.purchaseCost).toLocaleString("en-IN")}`]);
  const et = entityTypeIdFor("DeviceDetail");
  seedFiles.push(
    { entityTypeId: et, entityId: d.id, deviceId: d.id, fileCategory: "Image", fileName: `${d.shortName}.svg`, originalFileName: `${d.shortName}.svg`, contentType: "image/svg+xml", fileUrl: img.dataUrl, filePath: img.dataUrl, fileUse: "Installed photo", createdAt: d.createdAt },
    { entityTypeId: et, entityId: d.id, deviceId: d.id, fileCategory: "Document", fileName: `${d.tagNumber}_invoice.pdf`, originalFileName: `${d.tagNumber}_invoice.pdf`, contentType: "application/pdf", fileUrl: inv.dataUrl, filePath: inv.dataUrl, documentPath: inv.dataUrl, documentName: "Purchase Invoice", documentNumber: `INV-${d.tagNumber}`, documentTypeId: 1, issuedById: 2, issuedByDate: d.purchaseDate, documentValidTill: null, createdAt: d.createdAt },
  );
});
export const deviceFiles = createFileStore(seedFiles, 7001);

// Seeded audit trail for the device-side tables
let auditId = 3000;
const auditSeed = [];
const seedTableAudit = (tableName, rows, nameKey, updates = []) => {
  rows.forEach((r) => auditSeed.push({ id: (auditId += 1), tableName, recordId: r.id, actionType: "INSERT", columnName: nameKey, oldValue: null, newValue: String(r[nameKey] ?? ""), changedAt: r.createdAt, changedBy: "admin", isFinal: r.id % 5 === 0 }));
  updates.forEach(([recordId, columnName, oldValue, newValue, changedAt]) => auditSeed.push({ id: (auditId += 1), tableName, recordId, actionType: "UPDATE", columnName, oldValue, newValue, changedAt, changedBy: "admin" }));
};
seedTableAudit("DeviceCategory", DEVICE_CATEGORIES, "name", [[5, "Remarks", "PAC units", "PAC units and chillers.", "2025-06-01T10:00:00Z"]]);
seedTableAudit("DeviceType", DEVICE_TYPES, "name", [[10, "Protocol", "SNMP", "Modbus", "2025-06-11T08:30:00Z"], [15, "SupportedFeature", "Monitoring", "Cooling Management", "2025-06-12T11:00:00Z"]]);
seedTableAudit("DeviceMaster", DEVICE_MASTERS, "deviceShortName", [[4, "DataFormat", "Redfish JSON", "IPMI Sensor Data", "2025-07-04T12:00:00Z"]]);
seedTableAudit("DeviceDetail", DEVICE_DETAILS, "shortName", [[9, "Remarks", "", "Under OEM repair — RMA raised.", "2025-10-21T09:15:00Z"]]);
seedTableAudit("Rooms", ROOMS, "name", [[2, "ReservedAreaSqFt", "200", "250", "2025-08-20T10:00:00Z"]]);
seedTableAudit("Racks", RACKS, "rackName", [[6, "Status", "Full", "Under-maintenance", "2025-11-02T07:40:00Z"], [12, "Status", "Full", "Faulty", "2025-10-28T18:05:00Z"]]);
seedTableAudit("RackPowerCapacities", RACK_POWER.slice(0, 16), "pduName", [[3, "MeasuredLoadKW", "6.1", "6.8", "2025-11-05T06:00:00Z"]]);
seedTableAudit("DeviceRackLocations", DEVICE_RACK_LOCATIONS, "rackName", [[5, "StartUPosition", "28", "27", "2025-09-30T13:00:00Z"]]);
seedTableAudit("Floors", FLOORS, "name");
seedTableAudit("NetworkConnections", NETWORK_CONNECTIONS, "cableLabel", [[6, "Status", "Connected", "Faulty", "2025-11-10T22:10:00Z"]]);
seedTableAudit("DeviceConnectionConfigs", CONNECTION_CONFIGS, "protocol");
seedAudit(auditSeed);

// ── helpers ──────────────────────────────────────────────────────────────────
const RESERVED = new Set(["page", "pagesize", "pagenumber", "ispaginated", "search", "format"]);

// Generic list: search + equality filters for any query param that is a field
function filterRows(rows, q, params, searchFields) {
  let out = rows;
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || RESERVED.has(k.toLowerCase())) return;
    const field = Object.keys(out[0] || {}).find((f) => f.toLowerCase() === k.toLowerCase());
    if (field) out = out.filter((r) => String(r[field]).toLowerCase() === String(v).toLowerCase());
  });
  return searchRows(out, q("Search") ?? q("search"), searchFields);
}

// Device API body: { isPaginated:true, data, totalRecords, … } or { data: [...] }
function list(rows, q, { defaultSize = 10 } = {}) {
  const pi = pageInfo(q, { defaultSize });
  if (!pi.paged) return { isPaginated: false, status: true, message: "Success", data: rows, totalRecords: rows.length };
  const p = slicePage(rows, pi);
  return { isPaginated: true, status: true, message: "Success", data: p.rows, totalRecords: p.total, page: p.page, pageSize: p.pageSize, totalPages: p.totalPages };
}
const one = (row, message = "Success") => (row ? { status: true, message, data: row } : notFound());
const ok = (message, data) => ({ status: true, message, ...(data !== undefined ? { data } : {}) });
const live = (t) => t.all({ includeDeleted: false });

const companyName = (id) => COMPANIES.find((c) => String(c.id) === String(id))?.companyName || "";
const decorateType = (t) => ({ ...t, deviceCategoryName: ddb.categories.find(t.deviceCategoryId)?.name || "" });
const decorateSpec = (s) => ({
  ...s,
  companyName: companyName(s.companyId),
  deviceTypeName: ddb.types.find(s.deviceTypeId)?.name || "",
  modelCategoryName: ddb.modelCategories.find(s.modelCategoryId)?.name || "",
});
const decorateMaster = (m) => ({
  ...m,
  companyName: companyName(m.companyId),
  deviceCategoryName: ddb.categories.find(m.deviceCategoryId)?.name || "",
  deviceTypeName: ddb.types.find(m.deviceTypeId)?.name || "",
  modelSpecificationName: ddb.specs.find(m.modelSpecificationId)?.name || "",
});
const decorateDetail = (d) => {
  const m = ddb.masters.find(d.deviceMasterId) || {};
  const loc = ddb.rackLocations.where((l) => String(l.deviceDetailId) === String(d.id))[0];
  const rack = loc ? ddb.racks.find(loc.rackId) : null;
  return {
    ...d,
    deviceMasterName: m.deviceLongName || d.deviceMasterName || "",
    companyId: d.companyId ?? m.companyId, companyName: companyName(d.companyId ?? m.companyId) || d.companyName || "",
    deviceCategoryId: d.deviceCategoryId ?? m.deviceCategoryId, deviceTypeId: d.deviceTypeId ?? m.deviceTypeId,
    deviceCategoryName: ddb.categories.find(d.deviceCategoryId ?? m.deviceCategoryId)?.name || "",
    deviceTypeName: ddb.types.find(d.deviceTypeId ?? m.deviceTypeId)?.name || "",
    location: rack ? `${rack.rackName} · U${loc.startUPosition}` : d.location || "",
    associatedDevices: ddb.associations.where((a) => String(a.parentDeviceId) === String(d.id)).map((a) => {
      const c = ddb.details.find(a.childDeviceId);
      return c ? { id: c.id, shortName: c.shortName, name: c.shortName, longName: c.longName } : null;
    }).filter(Boolean),
  };
};
const decorateRoom = (r) => ({ ...r, floorName: ddb.floors.find(r.floorId)?.name || "", siteName: ddb.floors.find(r.floorId)?.siteName || "" });
const decorateRack = (r) => {
  const room = ddb.rooms.find(r.roomId);
  return { ...r, roomName: room?.name || "", floorId: r.floorId ?? room?.floorId ?? null, floorName: ddb.floors.find(r.floorId ?? room?.floorId)?.name || "" };
};
const rackName = (id) => ddb.racks.find(id)?.rackName || "";
const deviceShort = (id) => ddb.details.find(id)?.shortName || "";
const decorateRackPower = (p) => ({ ...p, rackName: rackName(p.rackId) });
const decorateRackLocation = (l) => ({ ...l, rackName: rackName(l.rackId), deviceName: deviceShort(l.deviceDetailId), deviceShortName: deviceShort(l.deviceDetailId) });
const decorateNetwork = (n) => ({ ...n, sourceDeviceName: deviceShort(n.sourceDeviceDetailId), targetDeviceName: deviceShort(n.targetDeviceDetailId) });
const decorateConfig = (c) => ({ ...c, deviceName: deviceShort(c.deviceDetailId) });

const pick = (body, keys) => {
  const out = {};
  keys.forEach((k) => {
    const v = body?.[k];
    if (v !== undefined) out[k] = v;
  });
  return out;
};
const numKeys = (obj, keys) => { keys.forEach((k) => { if (obj[k] !== undefined) obj[k] = toNum(obj[k]); }); return obj; };

// CRUD set for a simple table
function crud(t, { decorate = (x) => x, keys = [], nums = [], required = [], label = "Record" } = {}) {
  return {
    create: ({ body }) => {
      const missing = required.filter((k) => body?.[k] === undefined || body?.[k] === null || body?.[k] === "");
      if (missing.length) return badRequest(`${missing.join(", ")} required.`);
      const row = t.insert(numKeys({ isActive: true, isDeleted: false, ...pick(body, keys) }, nums));
      return one(decorate(row), `${label} created successfully`);
    },
    update: (id, body) => {
      if (!t.find(id)) return notFound(`${label} not found`);
      return one(decorate(t.update(id, numKeys(pick(body, keys), nums))), `${label} updated successfully`);
    },
    setActive: (id, body) => {
      const row = t.find(id);
      if (!row) return notFound(`${label} not found`);
      const v = body && typeof body === "object" && "isActive" in body ? toBool(body.isActive) : !row.isActive;
      return one(decorate(t.update(id, { isActive: v })), `${label} ${v ? "activated" : "deactivated"}`);
    },
    remove: (id) => (t.remove(id) ? ok(`${label} deleted successfully`) : notFound(`${label} not found`)),
  };
}

const exportRoute = (path, rowsFn, name) =>
  route("GET", path, ({ q }) => {
    let rows = rowsFn(q);
    const pi = pageInfo(q, { defaultSize: 10 });
    if (pi.paged) rows = slicePage(rows, pi).rows;
    const blob = exportBlob(rows, q("format", "excel"), name);
    return reply(200, blob, { "content-type": blob.type });
  });

const importRoute = (path, label) =>
  route("POST", path, ({ body }) => {
    const file = body?.file || body?.File;
    return {
      status: true,
      message: `${label} import received${file?.name ? ` (${file.name})` : ""}. Static demo data is kept unchanged.`,
      totalRows: 0, insertedCount: 0, updatedCount: 0, failedCount: 0, inserted: 0, updated: 0, failed: 0, errors: [],
      data: { totalRows: 0, inserted: 0, updated: 0, failed: 0, errors: [] },
    };
  });

const C = {
  categories: crud(ddb.categories, { keys: ["name", "remarks", "isActive"], required: ["name"], label: "Device category" }),
  types: crud(ddb.types, { decorate: decorateType, keys: ["name", "deviceCategoryId", "protocol", "supportedFeature", "remarks", "isActive"], nums: ["deviceCategoryId"], required: ["name"], label: "Device type" }),
  modelCategories: crud(ddb.modelCategories, { keys: ["name", "remarks", "isActive"], required: ["name"], label: "Model category" }),
  units: crud(ddb.units, { keys: ["unitName", "unitSymbol"], required: ["unitName"], label: "Unit" }),
  masters: crud(ddb.masters, { decorate: decorateMaster, keys: ["deviceShortName", "deviceLongName", "companyId", "deviceCategoryId", "deviceTypeId", "modelSpecificationId", "dataFormat", "remarks"], nums: ["companyId", "deviceCategoryId", "deviceTypeId", "modelSpecificationId"], required: ["deviceShortName"], label: "Device master" }),
  floors: crud(ddb.floors, { keys: ["name", "siteName", "siteId", "floorNumber", "floorPlanFileUrl", "isActive"], required: ["name"], label: "Floor" }),
  rooms: crud(ddb.rooms, { decorate: decorateRoom, keys: ["floorId", "name", "roomAreaSqFt", "reservedAreaSqFt", "internalUseAreaSqFt", "positionX", "positionY", "width", "length", "rotationAngle", "isActive"], nums: ["floorId", "roomAreaSqFt", "reservedAreaSqFt", "internalUseAreaSqFt", "positionX", "positionY", "width", "length", "rotationAngle"], required: ["name"], label: "Room" }),
  racks: crud(ddb.racks, { decorate: decorateRack, keys: ["floorId", "roomId", "rackName", "totalUHeight", "status", "maxWeightCapacityKg", "positionX", "positionY", "isActive"], nums: ["floorId", "roomId", "totalUHeight", "maxWeightCapacityKg", "positionX", "positionY"], required: ["rackName"], label: "Rack" }),
  rackPower: crud(ddb.rackPower, { decorate: decorateRackPower, keys: ["rackId", "pduName", "phaseName", "ratedCapacityKW", "estimatedLoadKW", "measuredLoadKW", "failoverReservedKW", "isActive"], nums: ["rackId", "ratedCapacityKW", "estimatedLoadKW", "measuredLoadKW", "failoverReservedKW"], required: ["rackId"], label: "Rack power capacity" }),
  rackLocations: crud(ddb.rackLocations, { decorate: decorateRackLocation, keys: ["deviceDetailId", "rackId", "startUPosition", "uOccupied", "address", "country", "state", "city", "pinCode", "latitude", "longitude", "isActive"], nums: ["deviceDetailId", "rackId", "startUPosition", "uOccupied", "latitude", "longitude"], required: ["deviceDetailId", "rackId"], label: "Device rack location" }),
  network: crud(ddb.network, { decorate: decorateNetwork, keys: ["sourceDeviceDetailId", "sourcePortName", "targetDeviceDetailId", "targetPortName", "cableType", "cableLabel", "cableColorCode", "status", "cableLengthMeters", "remarks", "isActive"], nums: ["sourceDeviceDetailId", "targetDeviceDetailId", "cableLengthMeters"], label: "Network connection" }),
  configs: crud(ddb.configs, { decorate: decorateConfig, keys: ["deviceDetailId", "protocol", "ipAddress", "port", "unitId", "objectId", "pollingIntervalSeconds", "thingsBoardDeviceId", "isActive"], nums: ["deviceDetailId", "port", "unitId", "pollingIntervalSeconds"], required: ["deviceDetailId"], label: "Connection config" }),
};

const DETAIL_KEYS = ["deviceMasterId", "imei", "macAddress", "tagNumber", "shortName", "longName", "serialNumber", "purchaseDate", "warrantyExpiry", "purchaseCost", "remarks", "ipAddress", "simNumber", "rfidTagNumber", "companyId", "lifecycleStage"];

function detailFromBody(body) {
  const d = pick(body, DETAIL_KEYS);
  numKeys(d, ["deviceMasterId", "purchaseCost", "companyId"]);
  const m = ddb.masters.find(d.deviceMasterId);
  if (m) Object.assign(d, { companyId: d.companyId ?? m.companyId, deviceCategoryId: m.deviceCategoryId, deviceTypeId: m.deviceTypeId, modelSpecificationId: m.modelSpecificationId });
  return d;
}

const filesFor = (name, entityId, cat) => {
  const et = entityTypeIdFor(name);
  return deviceFiles.where((f) => f.entityTypeId === et && String(f.entityId) === String(entityId) && (!cat || f.fileCategory === cat));
};

// ── routes ───────────────────────────────────────────────────────────────────
export const deviceRoutes = [
  // Device category
  route("GET", "/DeviceCategory/get-all-category", ({ q, params }) => list(filterRows(live(ddb.categories).slice().sort(byId), q, params, ["name", "remarks"]), q)),
  route("POST", "/DeviceCategory/create-deviceCategory", (ctx) => C.categories.create(ctx)),
  route("POST", /^\/DeviceCategory\/update-category\/?(\d+)$/i, ({ match, body }) => C.categories.update(match[1], body)),
  route("POST", "/DeviceCategory/soft-delete/:id", ({ match }) => C.categories.remove(match.id)),
  importRoute("/DeviceCategory/import-deviceCategory", "Device category"),
  exportRoute("/DeviceCategory/export", (q) => searchRows(live(ddb.categories), q("Search"), ["name", "remarks"]), "Device Categories"),
  route("GET", "/DeviceModel/by-category/:id", ({ match }) =>
    ({ status: true, data: live(ddb.masters).filter((m) => String(m.deviceCategoryId) === String(match.id)).map(decorateMaster).map((m) => ({ ...m, deviceId: m.id, deviceName: m.deviceLongName })) })),
  route("GET", "/DeviceModel/by-company/:id", ({ match }) =>
    ({ status: true, data: live(ddb.masters).filter((m) => String(m.companyId) === String(match.id)).map(decorateMaster).map((m) => ({ ...m, deviceId: m.id, name: m.deviceLongName, deviceName: m.deviceLongName, shortName: m.deviceShortName, deviceType: m.deviceTypeName })) })),

  // Device type
  route("GET", "/DeviceType/get-all-devicetype", ({ q, params }) => list(filterRows(live(ddb.types).slice().sort(byId).map(decorateType), q, params, ["name", "protocol", "supportedFeature", "remarks", "deviceCategoryName"]), q)),
  route("POST", "/DeviceType/create-devicetype", (ctx) => C.types.create(ctx)),
  route("POST", "/DeviceType/update-type/:id", ({ match, body }) => C.types.update(match.id, body)),
  route("DELETE", "/DeviceType/soft-delete/:id", ({ match }) => C.types.remove(match.id)),
  importRoute("/DeviceType/import-deviceType", "Device type"),
  exportRoute("/DeviceType/export", (q) => searchRows(live(ddb.types).map(decorateType), q("Search"), ["name", "protocol"]), "Device Types"),
  route("GET", "/DeviceDetail/by-type/:id", ({ match, q }) => list(live(ddb.details).filter((d) => String(d.deviceTypeId) === String(match.id)).map(decorateDetail), q)),

  // Model category / units
  route("GET", "/ModelCategory/get-all-model", ({ q }) => list(searchRows(live(ddb.modelCategories).slice().sort(byId), q("search") ?? q("Search"), ["name", "remarks"]), q)),
  route("POST", "/ModelCategory/create-model", (ctx) => C.modelCategories.create(ctx)),
  route("POST", "/ModelCategory/update-model/:id", ({ match, body }) => C.modelCategories.update(match.id, body)),
  route("DELETE", "/ModelCategory/soft-delete/:id", ({ match }) => C.modelCategories.remove(match.id)),
  importRoute("/ModelCategory/import-modelcategories", "Model category"),
  route("GET", "/UnitMaster/get-all-units", ({ q }) => list(searchRows(ddb.units.all().slice().sort(byId), q("search") ?? q("Search"), ["unitName", "unitSymbol"]), q)),
  route("POST", "/UnitMaster/create-unit", (ctx) => C.units.create(ctx)),
  route("POST", "/UnitMaster/update-unit/:id", ({ match, body }) => C.units.update(match.id, body)),
  route("DELETE", "/UnitMaster/:id", ({ match }) => C.units.remove(match.id)),

  // Model specifications + parameters + files
  route("GET", "/ModelSpecification/get-all-modelspecification", ({ q }) => {
    let rows = live(ddb.specs).slice().sort(byId).map(decorateSpec);
    if (q("deviceTypeId")) rows = rows.filter((r) => String(r.deviceTypeId) === String(q("deviceTypeId")));
    if (q("companyId")) rows = rows.filter((r) => String(r.companyId) === String(q("companyId")));
    return list(searchRows(rows, q("search") ?? q("Search"), ["name", "modelNumber", "companyName", "deviceTypeName"]), q);
  }),
  route("POST", "/ModelSpecification/create-modelspecification", ({ body }) => {
    if (!body.name) return badRequest("Name is required.");
    const row = ddb.specs.insert(numKeys(pick(body, ["name", "modelNumber", "deviceTypeId", "modelCategoryId", "companyId", "remarks"]), ["deviceTypeId", "modelCategoryId", "companyId"]));
    return one(decorateSpec(row), "Model specification created");
  }),
  route("POST", "/ModelSpecification/update-modelspecification/:id", ({ match, body }) =>
    one(ddb.specs.find(match.id) && decorateSpec(ddb.specs.update(match.id, numKeys(pick(body, ["name", "modelNumber", "deviceTypeId", "modelCategoryId", "companyId", "remarks"]), ["deviceTypeId", "modelCategoryId", "companyId"]))), "Model specification updated")),
  route("POST", "/ModelSpecification/:id/soft-delete", ({ match }) => (ddb.specs.remove(match.id) ? ok("Deleted") : notFound())),
  route("POST", "/ModelSpecification/soft-delete/:id", ({ match }) => (ddb.specs.remove(match.id) ? ok("Deleted") : notFound())),
  importRoute("/ModelSpecification/import-specifications", "Model specification"),
  route("GET", "/ModelParameter/model/:specId", ({ match }) => ({ status: true, data: ddb.params.where((p) => String(p.deviceModelId) === String(match.specId)) })),
  route("POST", "/ModelParameter/create-modelparameter", ({ body }) => {
    const rows = (Array.isArray(body) ? body : [body]).map((p) => {
      const mc = ddb.modelCategories.find(p.modelCategoryId);
      return ddb.params.insert({ ...p, deviceModelId: toNum(p.deviceModelId ?? p.modelSpecificationId), modelCategoryId: toNum(p.modelCategoryId), modelCategoryName: mc?.name || "" });
    });
    return { status: true, message: "Parameters saved", data: Array.isArray(body) ? rows : rows[0] };
  }),
  route("PUT", /^\/ModelParameter\/update-parameter\/?(\d+)$/i, ({ match, body }) => one(ddb.params.update(match[1], body), "Parameter updated")),
  route("GET", "/Image/model/:specId", ({ match }) => ({ status: true, data: filesFor("ModelSpecification", match.specId, "Image") })),
  route("GET", "/Image/by-company/:companyId", ({ match }) => ({ status: true, data: live(ddb.specs).filter((s) => String(s.companyId) === String(match.companyId)).flatMap((s) => filesFor("ModelSpecification", s.id, "Image").map((f) => ({ ...f, modelSpecificationId: s.id }))) })),
  route("GET", "/document/model/:specId", ({ match }) => ({ status: true, data: filesFor("ModelSpecification", match.specId, "Document") })),
  route("GET", "/document/company/:companyId", ({ match }) => ({ status: true, data: live(ddb.specs).filter((s) => String(s.companyId) === String(match.companyId)).flatMap((s) => filesFor("ModelSpecification", s.id, "Document").map((f) => ({ ...f, modelSpecificationId: s.id }))) })),

  // Device master
  route("GET", "/DeviceMaster/get-all-device", ({ q, params }) => list(filterRows(live(ddb.masters).slice().sort(byId).map(decorateMaster), q, params, ["deviceShortName", "deviceLongName", "companyName", "deviceTypeName", "dataFormat"]), q)),
  route("POST", "/DeviceMaster/create-device", (ctx) => C.masters.create(ctx)),
  route("POST", "/DeviceMaster/update-device/:id", ({ match, body }) => C.masters.update(match.id, body)),
  route("DELETE", "/DeviceMaster/soft-delete/:id", ({ match }) => C.masters.remove(match.id)),
  importRoute("/DeviceMaster/import", "Device master"),
  exportRoute("/DeviceMaster/export", (q) => searchRows(live(ddb.masters).map(decorateMaster), q("Search"), ["deviceShortName", "deviceLongName"]), "Device Masters"),

  // Device detail
  route("GET", "/DeviceDetail/get-all-devicedetail", ({ q, params }) => list(filterRows(live(ddb.details).slice().sort(byId).map(decorateDetail), q, params, ["shortName", "longName", "serialNumber", "imei", "macAddress", "tagNumber", "ipAddress", "companyName", "deviceMasterName"]), q)),
  route("GET", /^\/DeviceDetail\/get-devicedetail\/?(\d+)$/i, ({ match }) => {
    const d = ddb.details.find(match[1]);
    return d ? { status: true, data: decorateDetail(d) } : notFound("Device not found");
  }),
  route("POST", "/DeviceDetail/create-devicedetail", ({ body }) => {
    const d = detailFromBody(body);
    if (!d.deviceMasterId && !d.shortName) return badRequest("Device master and short name are required.");
    const row = ddb.details.insert({ lifecycleStage: "Received", stage: "Received", currentStage: "Received", isActive: true, isDeleted: false, ...d });
    ddb.lifecycle.insert({ deviceDetailId: row.id, stage: "Received", stageName: "Received", changedAt: row.createdAt, changedBy: "admin", location: "Noida DC-1 / Stores", notes: "Device registered." });
    return { status: true, message: "Device created successfully", data: decorateDetail(row), id: row.id };
  }),
  route("POST", /^\/DeviceDetail\/update-devicedetail\/?(\d+)$/i, ({ match, body }) => {
    if (!ddb.details.find(match[1])) return notFound("Device not found");
    return one(decorateDetail(ddb.details.update(match[1], detailFromBody(body))), "Device updated successfully");
  }),
  route("POST", "/DeviceDetail/soft-delete/:id", ({ match }) => (ddb.details.remove(match.id) ? ok("Device deleted") : notFound())),
  route("POST", "/DeviceDetail/setup-tracking/:id", ({ match, body }) => one(ddb.details.update(match.id, pick(body, ["serialNumber", "rfidTagNumber"])), "Tracking details saved")),
  route("GET", "/DeviceDetail/generate-qr/:id", ({ match }) => {
    const d = ddb.details.find(match.id);
    const text = d ? `ASSET:${d.tagNumber}|SN:${d.serialNumber}|NAME:${d.shortName}|RFID:${d.rfidTagNumber || "-"}` : `DEVICE:${match.id}`;
    return { message: "QR Code Generated Successfully", qrCodeImage: qrDataUrl(text) };
  }),
  route("GET", "/DeviceDetail/:id/lifecycle", ({ match }) => ({ status: true, data: ddb.lifecycle.where((l) => String(l.deviceDetailId) === String(match.id)).sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt))) })),
  route("POST", "/DeviceDetail/:id/lifecycle", ({ match, body }) => {
    const stageObj = LIFECYCLE_STAGES.find((s) => String(s.id) === String(body.lifecycleStageId ?? body.stageId ?? body.stage) || s.name === (body.stage || body.stageName));
    const stage = stageObj?.name || body.stage || body.stageName || "Installed";
    const user = LIFECYCLE_USERS.find((u) => String(u.id) === String(body.userId ?? body.changedById));
    const loc = LIFECYCLE_LOCATIONS.find((l) => String(l.id) === String(body.locationId));
    const row = ddb.lifecycle.insert({ deviceDetailId: toNum(match.id), stage, stageName: stage, changedAt: new Date().toISOString(), changedBy: user?.name || "admin", location: loc?.name || "", notes: body.notes || body.remarks || "" });
    ddb.details.update(match.id, { lifecycleStage: stage, stage, currentStage: stage });
    return one(row, "Life-cycle stage updated");
  }),
  importRoute("/DeviceDetail/import-devicedetail", "Device detail"),
  importRoute("/DeviceFile/import-bulk", "Device"),
  route("GET", "/LifecycleStage", () => ({ status: true, data: LIFECYCLE_STAGES })),
  route("GET", "/User", () => ({ status: true, data: LIFECYCLE_USERS })),
  route("GET", "/Location", () => ({ status: true, data: LIFECYCLE_LOCATIONS })),

  // Device location (address of a device)
  route("GET", "/DeviceLocation/:id/get-by-device", ({ match }) => ({ status: true, data: ddb.deviceLocations.where((l) => String(l.deviceDetailId) === String(match.id)) })),
  route("POST", "/DeviceLocation/add-device-location", ({ body }) => one(ddb.deviceLocations.insert(numKeys({ ...body, images: [], documents: [] }, ["deviceDetailId", "countryId", "stateId", "cityId", "timeZoneId", "latitude", "longitude"])), "Location created")),
  route("POST", "/DeviceLocation/:id/update-device-location", ({ match, body }) => one(ddb.deviceLocations.update(match.id, numKeys({ ...body }, ["deviceDetailId", "countryId", "stateId", "cityId", "timeZoneId", "latitude", "longitude"])), "Location updated")),

  // Device associations
  route("GET", "/DeviceAssociation/:id/subdevices", ({ match }) => ({
    status: true,
    data: ddb.associations.where((a) => String(a.parentDeviceId) === String(match.id)).map((a) => ddb.details.find(a.childDeviceId)).filter(Boolean).map(decorateDetail),
  })),
  route("POST", "/DeviceAssociation/:id/associate", ({ match, body }) => {
    const ids = [body?.childDeviceIds, body?.subDeviceIds, body?.deviceIds, body?.childDeviceId, Array.isArray(body) ? body : null].flat().filter((x) => x !== undefined && x !== null);
    ids.forEach((cid) => {
      if (!ddb.associations.where((a) => String(a.parentDeviceId) === String(match.id) && String(a.childDeviceId) === String(cid)).length) {
        ddb.associations.insert({ parentDeviceId: toNum(match.id), childDeviceId: toNum(cid) });
      }
    });
    return ok("Devices associated");
  }),
  route("PATCH", "/DeviceAssociation/:id/unassociate", ({ match }) => {
    ddb.associations.where((a) => String(a.childDeviceId) === String(match.id)).forEach((a) => ddb.associations.remove(a.id));
    return ok("Device unassociated");
  }),

  // Floors
  route("GET", "/Floor/get-all-floors", ({ q, params }) => list(filterRows(ddb.floors.all().slice().sort(byId), q, params, ["name", "siteName"]), q, { defaultSize: 100 })),
  route("POST", "/floor/add-floor", (ctx) => C.floors.create(ctx)),
  route("POST", "/floor/:id/update-floor", ({ match, body }) => C.floors.update(match.id, body)),
  importRoute("/Floor/import", "Floor"),

  // Rooms
  route("GET", "/Room/get-all-rooms", ({ q, params }) => list(filterRows(ddb.rooms.all().slice().sort(byId).map(decorateRoom), q, params, ["name", "floorName"]), q)),
  route("GET", "/Room/:id/get-room", ({ match }) => one(ddb.rooms.find(match.id) && decorateRoom(ddb.rooms.find(match.id)))),
  route("POST", "/Room/add-room", (ctx) => C.rooms.create(ctx)),
  route("POST", "/Room/:id/update-room", ({ match, body }) => C.rooms.update(match.id, body)),
  route("PATCH", "/Room/:id/set-active", ({ match, body }) => C.rooms.setActive(match.id, body)),
  importRoute("/Room/import", "Room"),
  exportRoute("/Room/export", (q) => searchRows(ddb.rooms.all().map(decorateRoom), q("Search"), ["name"]), "Rooms"),

  // Racks
  route("GET", "/Rack/get-all-racks", ({ q, params }) => list(filterRows(ddb.racks.all().slice().sort(byId).map(decorateRack), q, params, ["rackName", "roomName", "status"]), q)),
  route("POST", "/Rack/add-rack", (ctx) => C.racks.create(ctx)),
  route("POST", "/Rack/:id/update-rack", ({ match, body }) => C.racks.update(match.id, body)),
  route("PATCH", "/Rack/:id/set-active", ({ match, body }) => C.racks.setActive(match.id, body)),
  importRoute("/Rack/import", "Rack"),
  exportRoute("/Rack/Export", (q) => searchRows(ddb.racks.all().map(decorateRack), q("Search"), ["rackName"]), "Racks"),

  // Rack power capacity
  route("GET", "/RackPowerCapacity/get-all-rack-power-capacities", ({ q, params }) => list(filterRows(ddb.rackPower.all().slice().sort(byId).map(decorateRackPower), q, params, ["pduName", "phaseName", "rackName"]), q)),
  route("POST", "/RackPowerCapacity/add-rack-power-capacity", (ctx) => C.rackPower.create(ctx)),
  route("POST", "/RackPowerCapacity/:id/update-rack-power-capacity", ({ match, body }) => C.rackPower.update(match.id, body)),
  route("PATCH", "/RackPowerCapacity/:id/set-active", ({ match, body }) => C.rackPower.setActive(match.id, body)),
  importRoute("/RackPowerCapacity/import", "Rack power capacity"),
  exportRoute("/RackPowerCapacity/export", (q) => searchRows(ddb.rackPower.all().map(decorateRackPower), q("Search"), ["pduName", "rackName"]), "Rack Power Capacity"),

  // Device rack locations
  route("GET", "/DeviceRackLocation/get-all-device-rack-locations", ({ q, params }) => list(filterRows(ddb.rackLocations.all().slice().sort(byId).map(decorateRackLocation), q, params, ["rackName", "deviceName", "city", "state", "country"]), q)),
  route("GET", "/DeviceRackLocation/:id/get-device-rack-location", ({ match }) => one(ddb.rackLocations.find(match.id) && decorateRackLocation(ddb.rackLocations.find(match.id)))),
  route("POST", "/DeviceRackLocation/add-device-rack-location", (ctx) => C.rackLocations.create(ctx)),
  route("POST", "/DeviceRackLocation/:id/update-device-rack-location", ({ match, body }) => C.rackLocations.update(match.id, body)),
  importRoute("/DeviceRackLocation/import", "Device rack location"),
  exportRoute("/DeviceRackLocation/export", (q) => searchRows(ddb.rackLocations.all().map(decorateRackLocation), q("Search"), ["rackName", "deviceName"]), "Device Rack Locations"),

  // Network connections
  route("GET", "/NetworkConnection/get-all-network-connections", ({ q, params }) => {
    let rows = ddb.network.all().slice().sort(byId).map(decorateNetwork);
    const dev = q("DeviceDetailId");
    if (dev) rows = rows.filter((r) => String(r.sourceDeviceDetailId) === String(dev) || String(r.targetDeviceDetailId) === String(dev));
    const p = { ...params };
    delete p.DeviceDetailId;
    return list(filterRows(rows, q, p, ["sourcePortName", "targetPortName", "cableLabel", "cableType", "status", "sourceDeviceName", "targetDeviceName"]), q);
  }),
  route("GET", "/NetworkConnection/:id/get-network-connection", ({ match }) => one(ddb.network.find(match.id) && decorateNetwork(ddb.network.find(match.id)))),
  route("POST", "/NetworkConnection/add-network-connection", (ctx) => C.network.create(ctx)),
  route("POST", "/NetworkConnection/:id/update-network-connection", ({ match, body }) => C.network.update(match.id, body)),
  importRoute("/NetworkConnection/import", "Network connection"),

  // Device connection config
  route("GET", "/DeviceConnectionConfig/get-all-device-connection-configs", ({ q, params }) => list(filterRows(ddb.configs.all().slice().sort(byId).map(decorateConfig), q, params, ["protocol", "ipAddress", "deviceName"]), q)),
  route("GET", "/DeviceConnectionConfig/:id/get-device-connection-config", ({ match }) => one(ddb.configs.find(match.id) && decorateConfig(ddb.configs.find(match.id)))),
  route("POST", "/DeviceConnectionConfig/add-device-connection-config", (ctx) => C.configs.create(ctx)),
  route("POST", "/DeviceConnectionConfig/:id/update-device-connection-config", ({ match, body }) => C.configs.update(match.id, body)),
  importRoute("/DeviceConnectionConfig/import", "Connection config"),
  exportRoute("/DeviceConnectionConfig/export", (q) => searchRows(ddb.configs.all().map(decorateConfig), q("Search"), ["protocol", "ipAddress"]), "Connection Configs"),

  // Document master
  route("GET", "/DocumentMaster/document-types", () => ({ status: true, data: ddb.docTypes.all().slice().sort(byId) })),
  route("POST", "/DocumentMaster/create-documenttypes", ({ body }) => one(ddb.docTypes.insert({ name: body.name || body.typeName || body.documentTypeName || "", typeName: body.name || body.typeName || "", documentTypeName: body.name || body.typeName || "", isActive: true }), "Document type created")),
  route("DELETE", "/DocumentMaster/document-types/:id", ({ match }) => (ddb.docTypes.remove(match.id) ? ok("Document type deleted") : notFound())),
  route("GET", "/DocumentMaster/issued-by", () => ({ status: true, data: ISSUERS })),

  // Entity types + files
  route("GET", "/EntityType/get-all-entity", () => ({ status: true, data: ENTITY_TYPES_DEVICE })),
  ...fileStoreRoutes(route, deviceFiles, { uploadPath: "/FileStore/upload-file", wrap: (x) => ({ status: true, message: "Success", data: x }) }),

  // Audit (Device API side, used by a few history widgets)
  route("GET", "/Audit/history/:table/:id", ({ match }) => ({ status: true, data: auditFor(match.table, match.id) })),
  route("GET", "/Audit/history/:table", ({ match }) => ({ status: true, data: auditFor(match.table) })),
];
