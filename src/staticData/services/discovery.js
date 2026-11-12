// Static "Protocol Discovery" service for the Discovery Tool page:
// targets → probe → (Modbus unit scan) → read points → bind → verify.
// Every answer is simulated in the browser from the static device list.
import { route, badRequest } from "../core/http";
import { DEVICE_DETAILS } from "../seed/device";
import { CONNECTION_CONFIGS } from "../seed/device";

const PORTS = { modbus: 502, snmp: 161, bacnet: 47808 };
const now = () => new Date().toISOString();

// Discoverable devices = power, cooling and sensor assets (+ one switch)
const TARGET_DEVICES = ["UPS-01", "UPS-02", "UPS-03", "DG-01", "DG-02", "PAC-1A", "PAC-1B", "PAC-2A", "PAC-3E", "CHILLER-01", "PDU-A01-A", "PDU-A01-B", "PDU-B01-A", "TH-A01-IN", "TH-A05-IN", "TH-B01-IN", "SPINE-01"];

const STATUS_BY_DEVICE = {
  "UPS-01": "onboarded", "UPS-02": "onboarded", "DG-01": "onboarded", "PAC-1A": "onboarded", "PDU-A01-A": "onboarded", "TH-A01-IN": "onboarded",
  "PAC-1B": "discovered", "PDU-A01-B": "discovered", "CHILLER-01": "discovered",
  "PAC-3E": "failed", "UPS-03": "needs_profile",
};

const targets = TARGET_DEVICES.map((short) => {
  const d = DEVICE_DETAILS.find((x) => x.shortName === short);
  const cfg = CONNECTION_CONFIGS.find((c) => c.deviceName === short);
  const protocol = cfg ? cfg.protocol.toLowerCase() : null;
  const status = STATUS_BY_DEVICE[short] || "pending";
  return {
    device_detail_id: d.id, device_name: d.shortName, ip: d.ipAddress,
    protocol: protocol === "redfish" ? null : protocol,
    protocol_raw: cfg ? (cfg.protocol === "Modbus" ? "Modbus TCP" : cfg.protocol === "BACnet" ? "BACnet/IP" : cfg.protocol) : null,
    port: cfg?.port ?? null, unit_id: cfg?.unitId ?? null, community: protocol === "snmp" ? "public" : null,
    bacnet_device_id: protocol === "bacnet" ? Number(cfg.objectId) || null : null,
    model: d.modelName, model_number: d.modelNumber, model_specification_id: d.modelSpecificationId,
    gateway_ip: "10.10.0.250", has_profile: status !== "needs_profile",
    discovery_status: status,
    discovery_message: status === "failed" ? "No answer from the device on the last attempt (PAC under repair)." : null,
    last_discovered_at: status === "pending" ? null : new Date(Date.UTC(2026, 10, 1 + (d.id % 10), 6, 15)).toISOString(),
    point_count: status === "onboarded" ? 12 + (d.id % 9) : null,
    is_verified: status === "onboarded",
    ready_for_zero_touch: !!protocol && (protocol !== "modbus" || cfg?.unitId != null),
  };
});

const registry = {}; // ip → onboarded device
targets.filter((t) => t.discovery_status === "onboarded").forEach((t) => {
  registry[t.ip] = { ip: t.ip, device_name: t.device_name, protocol: t.protocol, port: t.port, device_id: t.bacnet_device_id ?? t.unit_id ?? null, objects_onboarded: t.point_count, onboarded_at: t.last_discovered_at };
});

const PROFILES = [
  { model: "Galaxy VX 500 kVA", model_number: "GVX500K", protocol: "modbus", source: "builtin", point_count: 24, verified: true },
  { model: "Liebert EXL S1 400 kVA", model_number: "EXL-S1-400", protocol: "modbus", source: "db", point_count: 22, verified: true },
  { model: "C1000 D5 Genset", model_number: "C1000D5", protocol: "modbus", source: "builtin", point_count: 18, verified: true },
  { model: "PX3-5190R", model_number: "PX3-5190R", protocol: "snmp", source: "builtin", point_count: 30, verified: true },
  { model: "DX2-T1H1", model_number: "DX2-T1H1", protocol: "snmp", source: "builtin", point_count: 6, verified: true },
  { model: "Liebert PDX 35 kW", model_number: "PDX035", protocol: "bacnet", source: "db", point_count: 20, verified: false },
];

const targetByIp = (ip) => targets.find((t) => t.ip === String(ip || "").trim());

// Points per kind of device
function pointsFor(t, protocol) {
  const name = t?.device_name || "";
  const kind = /^UPS/.test(name) ? "ups" : /^DG/.test(name) ? "dg" : /^PAC|^CHILLER/.test(name) ? "cool" : /^PDU/.test(name) ? "pdu" : /^TH/.test(name) ? "th" : protocol === "snmp" ? "net" : "generic";
  const seed = (t?.device_detail_id || 7) % 10;
  const m = (key, display_name, value, unit, category, address, raw, multiplier = 1, fc = 3) => ({
    key, name: key, display_name, value, unit, group: "measurement", category, confidence: "confirmed", selected: true,
    address: String(address), raw_value: raw ?? Math.round(value / multiplier), multiplier, function_code: protocol === "modbus" ? fc : null, register_count: protocol === "modbus" ? 1 : null, source: "profile", error: null,
  });
  const info = (key, display_name, value, address) => ({ key, name: key, display_name, value, unit: "", group: "info", category: "status", confidence: "confirmed", selected: false, address: String(address), raw_value: value, multiplier: null, function_code: null, register_count: null, source: "profile", error: null });
  const sets = {
    ups: [
      m("input_voltage_l1", "Input Voltage L1", 231.4 + seed / 10, "V", "voltage", 30001, null, 0.1), m("input_voltage_l2", "Input Voltage L2", 229.8, "V", "voltage", 30002, null, 0.1),
      m("input_voltage_l3", "Input Voltage L3", 232.1, "V", "voltage", 30003, null, 0.1), m("output_voltage", "Output Voltage", 230.0, "V", "voltage", 30010, null, 0.1),
      m("output_current", "Output Current", 412.6, "A", "current", 30014, null, 0.1), m("output_load", "Output Load", 61 + seed, "%", "power", 30020),
      m("output_power", "Output Power", 284.5, "kW", "power", 30022, null, 0.1), m("input_frequency", "Input Frequency", 50.01, "Hz", "frequency", 30030, null, 0.01),
      m("battery_charge", "Battery Charge", 100, "%", "status", 30040), m("battery_runtime", "Battery Runtime", 18 + seed, "min", "status", 30041),
      m("battery_temperature", "Battery Temperature", 24.6, "°C", "temperature", 30045, null, 0.1), m("energy_total", "Energy Delivered", 1840233, "kWh", "energy", 30060),
      info("model", "Model", t?.model || "UPS", 40001), info("firmware", "Firmware Version", "4.12.1", 40010), info("serial_number", "Serial Number", "UPS" + (900120 + seed), 40020),
    ],
    dg: [
      m("gen_voltage", "Generator Voltage", 415.2, "V", "voltage", 30101, null, 0.1), m("gen_current", "Generator Current", 0, "A", "current", 30105),
      m("gen_frequency", "Frequency", 0, "Hz", "frequency", 30110, null, 0.01), m("fuel_level", "Fuel Level", 86, "%", "status", 30120),
      m("coolant_temperature", "Coolant Temperature", 41.5, "°C", "temperature", 30125, null, 0.1), m("battery_voltage", "Starter Battery Voltage", 25.8, "V", "voltage", 30130, null, 0.1),
      m("run_hours", "Run Hours", 1284, "h", "status", 30140), info("engine_state", "Engine State", "Standby", 40101), info("model", "Model", t?.model || "DG", 40110),
    ],
    cool: [
      m("supply_air_temp", "Supply Air Temperature", 18.4 + seed / 10, "°C", "temperature", "analog-value:1"), m("return_air_temp", "Return Air Temperature", 26.2 + seed / 10, "°C", "temperature", "analog-value:2"),
      m("return_humidity", "Return Air Humidity", 47, "%RH", "humidity", "analog-value:3"), m("fan_speed", "Fan Speed", 72, "%", "status", "analog-value:4"),
      m("compressor_load", "Compressor Load", 58, "%", "power", "analog-value:5"), m("unit_power", "Unit Power", 11.8, "kW", "power", "analog-value:6"),
      info("unit_status", "Unit Status", "Running", "binary-value:1"), info("alarm_active", "Alarm Active", "No", "binary-value:2"),
      { ...info("object_name", "Object Name", t?.device_name || "PAC", "device:1"), group: "other" },
    ],
    pdu: [
      m("outlet_current_total", "Total Current", 14.2 + seed / 10, "A", "current", "1.3.6.1.4.1.13742.6.5.2.3.1.4.1.1.1"), m("active_power", "Active Power", 3.21, "kW", "power", "1.3.6.1.4.1.13742.6.5.2.3.1.4.1.1.5"),
      m("voltage_l1", "Voltage L1", 230.6, "V", "voltage", "1.3.6.1.4.1.13742.6.5.2.3.1.4.1.1.4"), m("energy", "Active Energy", 42188, "kWh", "energy", "1.3.6.1.4.1.13742.6.5.2.3.1.4.1.1.8"),
      m("power_factor", "Power Factor", 0.97, "", "power", "1.3.6.1.4.1.13742.6.5.2.3.1.4.1.1.7"),
      info("sysDescr", "System Description", "Metered rack PDU", "1.3.6.1.2.1.1.1.0"), info("sysName", "System Name", t?.device_name || "PDU", "1.3.6.1.2.1.1.5.0"),
      { ...info("ifInOctets", "Interface In Octets", 81231200, "1.3.6.1.2.1.2.2.1.10.1"), group: "other" },
    ],
    th: [
      m("temperature", "Temperature", 23.4 + seed / 10, "°C", "temperature", "1.3.6.1.4.1.13742.8.1.4.2.1.3.1.1.1"), m("humidity", "Relative Humidity", 45, "%RH", "humidity", "1.3.6.1.4.1.13742.8.1.4.2.1.3.1.1.2"),
      m("dew_point", "Dew Point", 11.2, "°C", "temperature", "1.3.6.1.4.1.13742.8.1.4.2.1.3.1.1.3"),
      info("sysDescr", "System Description", "Temperature/humidity sensor", "1.3.6.1.2.1.1.1.0"), info("sysName", "System Name", t?.device_name || "TH", "1.3.6.1.2.1.1.5.0"),
    ],
    net: [
      m("cpu_util", "CPU Utilisation", 21, "%", "status", "1.3.6.1.4.1.9.9.109.1.1.1.1.8.1"), m("temp_inlet", "Inlet Temperature", 27, "°C", "temperature", "1.3.6.1.4.1.9.9.91.1.1.1.1.4.1"),
      m("power_draw", "Power Draw", 2.9, "kW", "power", "1.3.6.1.4.1.9.9.117.1.1.4.1.1"),
      info("sysDescr", "System Description", "Data-centre spine switch", "1.3.6.1.2.1.1.1.0"), info("sysName", "System Name", t?.device_name || "SWITCH", "1.3.6.1.2.1.1.5.0"),
      { ...info("ifInOctets", "Interface In Octets", 9123345511, "1.3.6.1.2.1.2.2.1.10.1"), group: "other" }, { ...info("ifOutOctets", "Interface Out Octets", 8841022019, "1.3.6.1.2.1.2.2.1.16.1"), group: "other" },
    ],
    generic: [
      m("voltage", "Voltage", 230.2, "V", "voltage", 30001, null, 0.1), m("current", "Current", 12.4, "A", "current", 30002, null, 0.1),
      m("power", "Power", 2.85, "kW", "power", 30003, null, 0.01), m("energy", "Energy", 18420, "kWh", "energy", 30004),
      { ...m("reg_30005", "Register 30005", 512, "", "status", 30005), confidence: "medium", source: "inferred" },
      info("device_state", "Device State", "Online", 40001),
    ],
  };
  return sets[kind];
}

function readResult(body, { verify = false } = {}) {
  const t = targetByIp(body.ip);
  const protocol = String(body.protocol || t?.protocol || "modbus").toLowerCase();
  const points = pointsFor(t, protocol).map((p) => (verify && typeof p.value === "number" ? { ...p, value: Math.round(p.value * (1 + ((Math.random() - 0.5) / 100)) * 100) / 100 } : p));
  const inferred = !t || (protocol === "modbus" && !t.has_profile);
  const pts = inferred ? points.map((p) => ({ ...p, source: "inferred", confidence: p.group === "measurement" ? "high" : "medium" })) : points;
  const measurements = pts.filter((p) => p.group === "measurement").length;
  const info = pts.filter((p) => p.group === "info").length;
  return {
    ip: body.ip, protocol, port: body.port ?? PORTS[protocol], unit_id: body.unit_id ?? null, read_at: now(),
    source: inferred ? "inferred" : protocol === "snmp" ? "mib" : protocol === "bacnet" ? "self_describing" : "profile",
    profile_source: inferred ? null : "builtin", profile_verified: true,
    points: pts, summary: { total: pts.length, measurements, info, other: pts.length - measurements - info },
    notes: inferred ? ["No register profile matched this model, so the points were inferred from the register values."] : [],
    warnings: [], next_step: inferred ? "confirm_mapping" : "bind",
    ...(inferred ? { unmapped: 3, registers_found: pts.length + 3, dominant_scale: 0.1, word_order: "big-endian", confidence_summary: "high" } : {}),
  };
}

export const discoveryRoutes = [
  route("GET", "/", () => ({ service: "Protocol Discovery Service", version: "2.3.0", status: "running", docs: "/docs", discovery_flow: ["targets", "probe", "scan_units", "read", "bind", "verify"] })),
  route("GET", "/api/db/health", () => ({ connected: true, message: "Device Management database reachable." })),
  route("GET", "/api/discovery/targets", () => ({ count: targets.length, targets: targets.map((t) => ({ ...t })), schema_ready: true, schema_note: null })),
  route("GET", "/api/discovery/profiles", () => ({ count: PROFILES.length, profiles: PROFILES, note: null })),
  route("POST", "/api/discovery/probe", ({ body }) => {
    if (!body?.ip) return badRequest("ip is required");
    const t = targetByIp(body.ip);
    const check = String(body.check || "all").toLowerCase();
    const real = t?.protocol || "modbus";
    const protos = check === "all" ? ["modbus", "snmp", "bacnet"] : [check];
    const protocols = protos.map((p) => {
      const detected = p === real && !(t && t.discovery_status === "failed");
      return {
        protocol: p, detected, status: detected ? "responding" : t?.discovery_status === "failed" && p === real ? "timeout" : "no_response",
        port: p === "modbus" ? body.modbus_port ?? 502 : PORTS[p],
        ...(p === "bacnet" && detected ? { device_id: t?.bacnet_device_id ?? 2001, objects_found: 24 } : {}),
        ...(p === "snmp" && detected ? { sys_descr: t?.model || "SNMP agent" } : {}),
        needs: p === "modbus" && detected && (t?.unit_id == null) ? ["unit_id"] : [],
      };
    });
    const det = protocols.filter((p) => p.detected);
    const rec = det[0] || null;
    return {
      ip: body.ip, duration_seconds: check === "all" ? 6.4 : 1.8, protocols, detected_count: det.length,
      recommended: rec ? { protocol: rec.protocol, port: rec.port, next_step: rec.needs.includes("unit_id") ? "scan_units" : "read" } : null,
      message: rec ? `${rec.protocol.toUpperCase()} is answering on ${body.ip}.` : `No protocol answered on ${body.ip}.`,
    };
  }),
  route("POST", "/api/discovery/modbus/units", ({ body }) => {
    const start = Number(body.start ?? 1);
    const end = Number(body.end ?? 32);
    const t = targetByIp(body.ip);
    const unit = t?.unit_id ?? 1;
    const found = unit >= start && unit <= end ? [{ unit_id: unit, responding: true, note: "Answered the probe register.", detail: `Register ${body.probe_address ?? 0} = 1` }] : [];
    return { scanned_range: [start, end], scanned: end - start + 1, found, next_step: found.length ? "read" : "scan_more_units", message: found.length ? `Unit ${unit} is responding.` : "No unit answered in this range." };
  }),
  route("POST", "/api/discovery/read", ({ body }) => (body?.ip ? readResult(body) : badRequest("ip is required"))),
  route("POST", "/api/discovery/verify", ({ body }) => {
    const r = readResult(body, { verify: true });
    return { ...r, verified: true, live_point_count: r.points.filter((p) => p.group === "measurement").length, message: "Live values are arriving from the device." };
  }),
  route("POST", "/api/discovery/bind", ({ body }) => {
    const t = targetByIp(body.ip);
    const pts = pointsFor(t, String(body.protocol || t?.protocol || "modbus").toLowerCase());
    const keys = Array.isArray(body.selected_keys) && body.selected_keys.length ? body.selected_keys : pts.filter((p) => p.selected).map((p) => p.key);
    const ts = pts.filter((p) => keys.includes(p.key) && p.group === "measurement");
    const at = pts.filter((p) => keys.includes(p.key) && p.group !== "measurement");
    if (t) Object.assign(t, { discovery_status: "onboarded", last_discovered_at: now(), point_count: ts.length + at.length, is_verified: false });
    registry[body.ip] = { ip: body.ip, device_name: body.device_name, protocol: body.protocol, port: body.port, device_id: body.unit_id ?? t?.bacnet_device_id ?? null, objects_onboarded: ts.length + at.length, onboarded_at: now() };
    return {
      success: true, device_name: body.device_name, timeseries_onboarded: ts.length, attributes_onboarded: at.length, objects_skipped: pts.length - ts.length - at.length,
      timeseries: ts.map((p) => p.key), attributes: at.map((p) => p.key),
      reused_scan: true, discovery_status_saved: !!t, next_step: "verify", gateway_restarted: !!body.restart_gateway, gateway_pid: body.restart_gateway ? 48213 : undefined,
      message: `${body.device_name} is onboarded with ${ts.length} time series and ${at.length} attributes.`,
    };
  }),
  route("POST", "/api/gateway/restart", () => ({ success: true, message: "The gateway restart was requested.", gateway_pid: 48213 + Math.floor(Math.random() * 100) })),
  route("GET", "/api/gateway/registry", () => ({ count: Object.keys(registry).length, devices: { ...registry } })),
  route("DELETE", "/api/gateway/registry/:ip", ({ match }) => {
    delete registry[match.ip];
    const t = targetByIp(match.ip);
    if (t) t.discovery_status = "discovered";
    return { success: true, message: `${match.ip} was removed from the gateway registry.` };
  }),
  route("GET", "/api/mib/resolve", ({ q }) => {
    const oid = String(q("oid") || "");
    const known = {
      "1.3.6.1.2.1.1.1.0": ["sysDescr", "", 1, null, "A textual description of the entity."],
      "1.3.6.1.2.1.1.5.0": ["sysName", "", 1, null, "An administratively-assigned name for this node."],
      "1.3.6.1.2.1.2.2.1.10.1": ["ifInOctets", "octets", 1, null, "Octets received on the interface."],
    };
    const k = known[oid];
    if (k) return { oid, name: k[0], unit: k[1], scale: k[2], phase: k[3], description: k[4] };
    const tail = oid.split(".").slice(-1)[0];
    return { oid, name: oid.includes("13742.6") ? `pduMeasurement.${tail}` : oid.includes("13742.8") ? `sensorMeasurement.${tail}` : `oid.${tail}`, unit: oid.includes("13742.8") ? "°C" : "", scale: 1, phase: null, description: "Vendor-specific measurement object." };
  }),
];
