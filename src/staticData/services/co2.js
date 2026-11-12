// Static data for the gas-monitoring pages (CO₂ / PH₃ dashboard, godowns,
// compartments, device ranges, reports). These pages are kept from the
// original portal; their data is static like everything else.
import { route, reply, badRequest, notFound } from "../core/http";
import { Table, toBool, toNum } from "../core/store";
import { rowsToXlsxBlob } from "../core/exporters";

const CO2 = 30000;
const PH3 = 30001;
const iso = (d) => new Date(d).toISOString();
const BASE = Date.UTC(2026, 10, 12, 4, 0); // 12 Nov 2026, 09:30 IST

const GODOWNS = ["Godown 1", "Godown 2", "Godown 3"];
const COMPARTMENTS = ["Compartment A", "Compartment B", "Compartment C", "Compartment D"];

export const cdb = {
  shads: new Table(GODOWNS.map((name, i) => ({ id: i + 1, name, status: true, regDate: iso(Date.UTC(2025, 6, 1 + i)) }))),
  columns: new Table(COMPARTMENTS.map((name, i) => ({ id: i + 1, name, status: i !== 3, regDate: iso(Date.UTC(2025, 6, 5 + i)) }))),
  ranges: new Table([
    [CO2, "Normal", 0, 5000], [CO2, "Severe", 5000, 10000], [CO2, "Critical", 10000, 50000],
    [PH3, "Normal", 0, 100], [PH3, "Severe", 100, 300], [PH3, "Critical", 300, 1000],
  ].map(([deviceTypeId, alertType, minValue, maxValue], i) => ({ id: i + 1, deviceTypeId, alertType, minValue, maxValue, status: true, regDate: iso(Date.UTC(2025, 6, 2, 6, i * 5)), createdAt: iso(Date.UTC(2025, 6, 2, 6, i * 5)) }))),
  devices: new Table(
    GODOWNS.flatMap((g, gi) => [CO2, PH3, CO2, PH3].map((type, di) => {
      const comp = COMPARTMENTS[di % COMPARTMENTS.length];
      const n = gi * 4 + di + 1;
      return {
        id: n, name: `${type === CO2 ? "CO2" : "PH3"}-${g.replace("Godown ", "G")}-${comp.replace("Compartment ", "")}`,
        deviceType: type, deviceTypeId: type, status: n !== 7, ipAddress: `192.168.${10 + gi}.${20 + di}`,
        address: `${g}, ${comp}`, areaShad: g, areaColumn: comp, latitude: 28.62 + gi * 0.01, longitude: 77.37 + di * 0.01,
        regDate: iso(Date.UTC(2025, 6, 10 + n)),
      };
    }))
  ),
};

const rangeFor = (type, v) => {
  const rows = cdb.ranges.all().filter((r) => r.deviceTypeId === type);
  return rows.find((r) => v >= r.minValue && v < r.maxValue)?.alertType || "Normal";
};

// Deterministic readings: one every 15 minutes for the last 2 days
function readingAt(dev, k) {
  const base = dev.deviceType === CO2 ? 3200 : 60;
  const amp = dev.deviceType === CO2 ? 3400 : 140;
  const wave = Math.sin((k + dev.id * 3) / 7) * 0.5 + Math.sin((k + dev.id) / 2.3) * 0.25;
  return Math.max(0, Math.round(base + amp * (wave + (dev.id % 3) * 0.18)));
}
const LOGS = [];
cdb.devices.all().forEach((dev) => {
  for (let k = 0; k < 192; k += 1) {
    const t = BASE - k * 15 * 60000;
    LOGS.push({ id: dev.id * 1000 + k, deviceId: dev.id, name: dev.name, deviceType: dev.deviceType, deviceTypeId: dev.deviceType, ipAddress: dev.ipAddress, address: dev.address, areaShad: dev.areaShad, areaColumn: dev.areaColumn, deviceValue: readingAt(dev, k), value: readingAt(dev, k), dateTime: iso(t), regDate: iso(t) });
  }
});
LOGS.sort((a, b) => b.regDate.localeCompare(a.regDate));

const ALERTS = LOGS.filter((l) => rangeFor(l.deviceType, l.deviceValue) !== "Normal").map((l, i) => ({
  id: i + 1, deviceTypeId: l.deviceType, ipAddress: l.ipAddress, godown: l.areaShad, location: l.areaColumn, value: l.deviceValue,
  alertType: rangeFor(l.deviceType, l.deviceValue), status: i % 3 === 0 ? "Resolved" : "Active", regDate: l.regDate, name: l.name,
}));

const paged = (rows, q, { totalKey = "totalRecords" } = {}) => {
  const pageNumber = Math.max(1, Number(q("pageNumber") ?? q("Page")) || 1);
  const pageSize = Math.max(1, Number(q("pageSize")) || 10);
  return { data: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), [totalKey]: rows.length, totalRecords: rows.length, totalCount: rows.length, pageNumber, pageSize };
};

function crudRoutes(path, table, label) {
  return [
    route("GET", path, ({ q }) => paged(table.all().slice().sort((a, b) => a.id - b.id), q)),
    route("POST", path, ({ body }) => {
      if (!body?.name) return badRequest(`${label} name is required`);
      table.insert({ name: body.name, status: toBool(body.status ?? true), regDate: body.regDate || new Date().toISOString() });
      return reply(200, `${label} added`, { "content-type": "text/plain" });
    }),
    route("PUT", `${path}/:id`, ({ match, body }) => (table.update(match.id, { name: body.name, status: toBool(body.status), regDate: body.regDate }) ? reply(200, `${label} updated`, { "content-type": "text/plain" }) : notFound())),
    route("DELETE", `${path}/:id`, ({ match }) => (table.remove(match.id) ? reply(200, `${label} deleted`, { "content-type": "text/plain" }) : notFound())),
  ];
}

function transactions(q) {
  let rows = LOGS;
  const type = toNum(q("deviceType"));
  if (type) rows = rows.filter((l) => l.deviceType === type);
  if (q("ipAddress")) rows = rows.filter((l) => l.ipAddress === q("ipAddress"));
  return rows;
}

export const co2Routes = [
  route("GET", "/api/devices", ({ q }) => paged(cdb.devices.all().slice().sort((a, b) => a.id - b.id), q)),
  route("GET", "/api/device-logs/real-time", ({ q }) => {
    const latest = cdb.devices.all().map((d) => LOGS.find((l) => l.deviceId === d.id)).filter(Boolean);
    return paged(latest, q);
  }),
  route("GET", "/api/device-logs/alerts", () => {
    const out = {};
    GODOWNS.forEach((g) => {
      out[g] = cdb.devices.all().filter((d) => d.areaShad === g).map((d) => {
        const last = LOGS.find((l) => l.deviceId === d.id);
        const own = ALERTS.filter((a) => a.ipAddress === d.ipAddress);
        return {
          deviceId: d.id, name: d.name, deviceTypeId: d.deviceType, ipAddress: d.ipAddress, value: last?.deviceValue ?? 0,
          severeCount: own.filter((a) => a.alertType === "Severe").length, criticalCount: own.filter((a) => a.alertType === "Critical").length,
          dateTime: last?.dateTime, location: d.areaColumn, godown: g,
        };
      });
    });
    return out;
  }),
  route("GET", "/api/device-logs/transactions-excel", ({ q }) => {
    const rows = transactions(q).map(({ name, address, areaShad, areaColumn, ipAddress, deviceValue, regDate }) => ({ name, address, godown: areaShad, compartment: areaColumn, ipAddress, deviceValue, recordTime: regDate }));
    const blob = rowsToXlsxBlob(rows, "Report");
    return reply(200, blob, { "content-type": blob.type });
  }),
  route("GET", "/api/device-logs/transactions", ({ q }) => {
    const rows = transactions(q);
    const values = rows.map((r) => r.deviceValue);
    return { ...paged(rows, q), deviceMaxValue: values.length ? Math.max(...values) : 0, deviceMinValue: values.length ? Math.min(...values) : 0 };
  }),
  route("GET", "/api/device-logs", ({ q }) => paged(LOGS, q)),
  route("GET", "/api/device-alerts", ({ q }) => {
    let rows = ALERTS;
    if (q("alertType")) rows = rows.filter((a) => a.alertType.toLowerCase() === String(q("alertType")).toLowerCase());
    if (q("deviceTypeId")) rows = rows.filter((a) => String(a.deviceTypeId) === String(q("deviceTypeId")));
    if (q("location")) rows = rows.filter((a) => a.location === q("location") || a.godown === q("location"));
    if (q("startDate")) rows = rows.filter((a) => a.regDate.slice(0, 10) >= q("startDate"));
    if (q("endDate")) rows = rows.filter((a) => a.regDate.slice(0, 10) <= q("endDate"));
    return paged(rows, q, { totalKey: "totalCount" });
  }),
  route("GET", "/api/device-ranges", ({ q }) => (q("pageNumber") ? paged(cdb.ranges.all().slice().sort((a, b) => a.id - b.id), q) : cdb.ranges.all().slice().sort((a, b) => a.id - b.id))),
  route("POST", "/api/device-ranges", ({ body }) => { cdb.ranges.insert({ deviceTypeId: toNum(body.deviceTypeId), alertType: body.alertType, minValue: toNum(body.minValue), maxValue: toNum(body.maxValue), status: toBool(body.status ?? true), regDate: new Date().toISOString() }); return reply(200, "Range added", { "content-type": "text/plain" }); }),
  route("PUT", "/api/device-ranges/:id", ({ match, body }) => (cdb.ranges.update(match.id, { deviceTypeId: toNum(body.deviceTypeId), alertType: body.alertType, minValue: toNum(body.minValue), maxValue: toNum(body.maxValue), status: toBool(body.status) }) ? reply(200, "Range updated", { "content-type": "text/plain" }) : notFound())),
  route("DELETE", "/api/device-ranges/:id", ({ match }) => (cdb.ranges.remove(match.id) ? reply(200, "Range deleted", { "content-type": "text/plain" }) : notFound())),
  ...crudRoutes("/api/Column", cdb.columns, "Compartment"),
  ...crudRoutes("/api/shads", cdb.shads, "Godown"),
];
