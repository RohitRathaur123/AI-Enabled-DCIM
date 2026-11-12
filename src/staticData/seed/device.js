// Static master data — Device management: categories, types, model
// specifications, device masters, device details (installed assets), floors,
// rooms, racks, rack power, rack locations, network links, connection configs,
// document types, life-cycle history.
import { COMPANIES } from "./company";

const iso = (y, m, d, h = 10, min = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, min)).toISOString();

const companyName = (id) => COMPANIES.find((c) => c.id === id)?.companyName || "";

// ── Device categories ───────────────────────────────────────────────────────
export const DEVICE_CATEGORIES = [
  [1, "Server", "Compute nodes — rack, GPU and blade servers."],
  [2, "Network", "Switches, routers and firewalls."],
  [3, "Storage", "SAN / NAS storage arrays."],
  [4, "Power", "UPS, PDU, DG sets, transformers and ATS panels."],
  [5, "Cooling", "PAC units and chillers."],
  [6, "Security & Surveillance", "CCTV cameras and access control."],
  [7, "Environmental Sensor", "Temperature, humidity and water-leak sensors."],
  [8, "Fire Safety", "Smoke detection and fire-alarm devices."],
].map(([id, name, remarks], i) => ({
  id, name, remarks, isActive: id !== 8 ? true : true, isDeleted: false,
  createdAt: iso(2025, 4, 2 + i, 9), updatedAt: iso(2025, 4, 2 + i, 9),
}));

// ── Device types ────────────────────────────────────────────────────────────
export const DEVICE_TYPES = [
  [1, "Rack Server", 1, "Redfish", "Monitoring", "1U/2U general-purpose servers."],
  [2, "GPU Server", 1, "IPMI", "Monitoring", "AI / HPC accelerated servers."],
  [3, "Blade Chassis", 1, "Redfish", "Inventory Management", "Blade enclosure with shared power and cooling."],
  [4, "Core Switch", 2, "SNMP", "Configuration", "Spine / core layer switching."],
  [5, "Top-of-Rack Switch", 2, "SNMP", "Monitoring", "Leaf switches at the top of each rack."],
  [6, "Router", 2, "SNMP", "Configuration", "WAN edge and internet routers."],
  [7, "Firewall", 2, "HTTPS", "Security Management", "Perimeter and segmentation firewalls."],
  [8, "SAN Storage", 3, "SNMP", "Monitoring", "Block storage arrays."],
  [9, "NAS Storage", 3, "SNMP", "Backup", "File storage and backup targets."],
  [10, "UPS", 4, "Modbus", "Power Management", "Online double-conversion UPS systems."],
  [11, "Rack PDU", 4, "SNMP", "Power Management", "Metered / switched rack PDUs."],
  [12, "DG Set", 4, "Modbus", "Power Management", "Standby diesel generators."],
  [13, "Transformer", 4, "Modbus", "Monitoring", "Utility step-down transformers."],
  [14, "ATS Panel", 4, "Modbus", "Remote Control", "Automatic transfer switch panels."],
  [15, "PAC Unit", 5, "BACnet", "Cooling Management", "Precision air-conditioning units."],
  [16, "Chiller", 5, "BACnet", "Cooling Management", "Water-cooled chiller plant."],
  [17, "CCTV Camera", 6, "HTTP", "Monitoring", "IP surveillance cameras."],
  [18, "Access Controller", 6, "HTTPS", "Security Management", "Biometric / card access controllers."],
  [19, "Temperature & Humidity Sensor", 7, "SNMP", "Alerting", "Rack inlet / outlet climate sensors."],
  [20, "Water Leak Sensor", 7, "Modbus", "Alerting", "Rope-type leak detection under the raised floor."],
  [21, "Smoke Detector", 8, "BACnet", "Alerting", "Addressable smoke and VESDA detectors."],
].map(([id, name, deviceCategoryId, protocol, supportedFeature, remarks], i) => ({
  id, name, deviceCategoryId, protocol, supportedFeature, remarks,
  deviceCategoryName: DEVICE_CATEGORIES.find((c) => c.id === deviceCategoryId)?.name || "",
  isActive: true, isDeleted: false, createdAt: iso(2025, 4, 10 + (i % 15), 11), updatedAt: iso(2025, 4, 10 + (i % 15), 11),
}));

// ── Model categories & units ────────────────────────────────────────────────
export const MODEL_CATEGORIES = [
  [1, "Compute", "Server platforms"], [2, "Networking", "Switching, routing and security"],
  [3, "Storage", "Primary and secondary storage"], [4, "Power Systems", "UPS, PDU, DG, transformer"],
  [5, "Cooling Systems", "Precision cooling and chillers"], [6, "Security Systems", "CCTV and access control"],
  [7, "Sensors & Monitoring", "Environment and safety sensors"],
].map(([id, name, remarks], i) => ({ id, name, remarks, isActive: true, isDeleted: false, createdAt: iso(2025, 5, 1 + i), updatedAt: iso(2025, 5, 1 + i) }));

export const UNITS = [
  [1, "Kilowatt", "kW"], [2, "Kilovolt-ampere", "kVA"], [3, "Volt", "V"], [4, "Ampere", "A"], [5, "Watt", "W"],
  [6, "Degree Celsius", "°C"], [7, "Relative Humidity", "%RH"], [8, "Percent", "%"], [9, "Rack Unit", "U"],
  [10, "Gigabit per second", "Gbps"], [11, "Terabyte", "TB"], [12, "Hertz", "Hz"], [13, "Kilogram", "kg"],
  [14, "Ton of Refrigeration", "TR"], [15, "Cubic Feet per Minute", "CFM"], [16, "Kilowatt-hour", "kWh"],
].map(([id, unitName, unitSymbol], i) => ({ id, unitName, unitSymbol, isActive: true, isDeleted: false, createdAt: iso(2025, 5, 3, 9, i), updatedAt: iso(2025, 5, 3, 9, i) }));

// ── Model specifications (+ parameters) ─────────────────────────────────────
// [id, name, modelNumber, deviceTypeId, modelCategoryId, companyId, remarks, params[]]
const SPEC_ROWS = [
  [1, "PowerEdge R750", "R750", 1, 1, 1, "2U dual-socket rack server.", [["CPU", "2x Intel Xeon Gold 6338", ""], ["Memory", "512", "GB"], ["Storage", "8x 1.92 TB NVMe", ""], ["Rated Power", "1.4", "kW"]]],
  [2, "ProLiant DL380 Gen10", "DL380G10", 1, 1, 3, "2U general-purpose server.", [["CPU", "2x Intel Xeon Silver 4214", ""], ["Memory", "256", "GB"], ["Rated Power", "0.8", "kW"]]],
  [3, "ThinkSystem SR650 V2", "SR650V2", 1, 1, 4, "2U virtualisation host.", [["CPU", "2x Intel Xeon Gold 5318Y", ""], ["Memory", "384", "GB"], ["Rated Power", "1.1", "kW"]]],
  [4, "PowerEdge XE9680", "XE9680", 2, 1, 1, "6U GPU server for AI training.", [["GPU", "8x accelerator", ""], ["Rated Power", "10.2", "kW"], ["Height", "6", "U"]]],
  [5, "Nexus 93180YC-FX", "N9K-C93180YC-FX", 5, 2, 2, "48x 25G leaf switch.", [["Ports", "48x 25G + 6x 100G", ""], ["Throughput", "3.6", "Tbps"], ["Rated Power", "0.4", "kW"]]],
  [6, "Nexus 9508", "N9K-C9508", 4, 2, 2, "8-slot modular spine switch.", [["Line cards", "8", ""], ["Rated Power", "4.5", "kW"]]],
  [7, "EX4300-48T", "EX4300-48T", 5, 2, 5, "48-port access switch.", [["Ports", "48x 1G + 4x 10G", ""], ["Rated Power", "0.35", "kW"]]],
  [8, "FortiGate 600E", "FG-600E", 7, 2, 12, "NGFW appliance.", [["Firewall throughput", "36", "Gbps"], ["Rated Power", "0.25", "kW"]]],
  [9, "AFF A400", "AFF-A400", 8, 3, 13, "All-flash SAN array.", [["Raw capacity", "368", "TB"], ["Rated Power", "1.2", "kW"]]],
  [10, "Galaxy VX 500 kVA", "GVX500K", 10, 4, 6, "Modular 3-phase UPS.", [["Rated capacity", "500", "kVA"], ["Efficiency", "96", "%"], ["Battery autonomy", "15", "min"]]],
  [11, "Liebert EXL S1 400 kVA", "EXL-S1-400", 10, 4, 7, "Transformer-free UPS.", [["Rated capacity", "400", "kVA"], ["Efficiency", "97", "%"]]],
  [12, "PX3-5190R", "PX3-5190R", 11, 4, 11, "Metered rack PDU, 32 A 3-phase.", [["Outlets", "36x C13 + 6x C19", ""], ["Rated Power", "22", "kW"]]],
  [13, "C1000 D5 Genset", "C1000D5", 12, 4, 9, "1000 kVA standby generator.", [["Rated capacity", "1000", "kVA"], ["Fuel tank", "990", "L"]]],
  [14, "Liebert PDX 35 kW", "PDX035", 15, 5, 7, "Direct-expansion PAC unit.", [["Cooling capacity", "35", "kW"], ["Airflow", "9400", "CFM"]]],
  [15, "CyberAir 3PRO", "ASD-1072", 15, 5, 14, "Downflow precision cooling unit.", [["Cooling capacity", "72", "kW"], ["Airflow", "16000", "CFM"]]],
  [16, "AquaEdge 19DV", "19DV-500", 16, 5, 10, "Water-cooled centrifugal chiller.", [["Cooling capacity", "500", "TR"], ["Rated Power", "290", "kW"]]],
  [17, "P3245-LVE", "P3245-LVE", 17, 6, 15, "Outdoor dome camera, 1080p.", [["Resolution", "1920x1080", ""], ["PoE class", "3", ""]]],
  [18, "DX2-T1H1", "DX2-T1H1", 19, 7, 11, "Temperature & humidity sensor.", [["Temperature range", "-25 to 75", "°C"], ["Humidity range", "0-100", "%RH"]]],
  [19, "Power Xpert 9395P 500 kVA", "9395P-500", 10, 4, 8, "High-efficiency UPS.", [["Rated capacity", "500", "kVA"], ["Efficiency", "96.5", "%"]]],
];

export const MODEL_SPECS = SPEC_ROWS.map(([id, name, modelNumber, deviceTypeId, modelCategoryId, companyId, remarks], i) => ({
  id, name, modelNumber, deviceTypeId, modelCategoryId, companyId, remarks,
  companyName: companyName(companyId),
  deviceTypeName: DEVICE_TYPES.find((t) => t.id === deviceTypeId)?.name || "",
  modelCategoryName: MODEL_CATEGORIES.find((c) => c.id === modelCategoryId)?.name || "",
  isDeleted: false, createdAt: iso(2025, 5, 6 + (i % 20), 12), updatedAt: iso(2025, 5, 6 + (i % 20), 12),
}));

let paramId = 0;
export const MODEL_PARAMETERS = SPEC_ROWS.flatMap(([specId, , , , modelCategoryId, , , params]) =>
  params.map(([parameterName, parameterValue, unit], j) => {
    paramId += 1;
    return {
      id: paramId, deviceModelId: specId, modelSpecificationId: specId, modelCategoryId,
      modelCategoryName: MODEL_CATEGORIES.find((c) => c.id === modelCategoryId)?.name || "",
      parameterName, parameterValue, unit,
      capacity: /capacity|power/i.test(parameterName) ? `${parameterValue} ${unit}`.trim() : "",
      processor: parameterName === "CPU" ? parameterValue : "",
      ram: parameterName === "Memory" ? `${parameterValue} ${unit}` : "",
      storage: parameterName === "Storage" ? parameterValue : "",
      firmwareVersion: j === 0 ? "2.14.1" : "",
      protocol: "", warrantyDuration: j === 0 ? "5 Years" : "", endOfLife: j === 0 ? "2032-12-31" : "",
      intro: j === 0 ? "Data-centre grade platform." : "", uses: "", feature: "", remarks: "",
    };
  })
);

// ── Device masters ──────────────────────────────────────────────────────────
// [id, short, long, companyId, categoryId, typeId, specId, dataFormat]
export const DEVICE_MASTERS = [
  [1, "PE-R750", "Dell PowerEdge R750 Rack Server", 1, 1, 1, 1, "Redfish JSON"],
  [2, "DL380-G10", "HPE ProLiant DL380 Gen10 Server", 3, 1, 1, 2, "Redfish JSON"],
  [3, "SR650-V2", "Lenovo ThinkSystem SR650 V2 Server", 4, 1, 1, 3, "Redfish JSON"],
  [4, "XE9680", "Dell PowerEdge XE9680 GPU Server", 1, 1, 2, 4, "IPMI Sensor Data"],
  [5, "N9K-93180", "Cisco Nexus 93180YC-FX Leaf Switch", 2, 2, 5, 5, "SNMP MIB"],
  [6, "N9K-9508", "Cisco Nexus 9508 Spine Switch", 2, 2, 4, 6, "SNMP MIB"],
  [7, "EX4300", "Juniper EX4300-48T Access Switch", 5, 2, 5, 7, "SNMP MIB"],
  [8, "FG-600E", "Fortinet FortiGate 600E Firewall", 12, 2, 7, 8, "REST JSON"],
  [9, "AFF-A400", "NetApp AFF A400 Storage Array", 13, 3, 8, 9, "SNMP MIB"],
  [10, "GVX-500", "Schneider Galaxy VX 500 kVA UPS", 6, 4, 10, 10, "Modbus Register Map"],
  [11, "EXL-400", "Vertiv Liebert EXL S1 400 kVA UPS", 7, 4, 10, 11, "Modbus Register Map"],
  [12, "PX3-PDU", "Raritan PX3 Metered Rack PDU", 11, 4, 11, 12, "SNMP MIB"],
  [13, "C1000-DG", "Cummins C1000 D5 DG Set", 9, 4, 12, 13, "Modbus Register Map"],
  [14, "PDX-35", "Vertiv Liebert PDX 35 kW PAC", 7, 5, 15, 14, "BACnet Objects"],
  [15, "CA-3PRO", "Stulz CyberAir 3PRO PAC", 14, 5, 15, 15, "BACnet Objects"],
  [16, "19DV-CH", "Carrier AquaEdge 19DV Chiller", 10, 5, 16, 16, "BACnet Objects"],
  [17, "P3245-CAM", "Axis P3245-LVE Dome Camera", 15, 6, 17, 17, "ONVIF"],
  [18, "DX2-TH", "Raritan DX2 Temperature/Humidity Sensor", 11, 7, 19, 18, "SNMP MIB"],
  [19, "9395P-500", "Eaton Power Xpert 9395P UPS", 8, 4, 10, 19, "Modbus Register Map"],
].map(([id, deviceShortName, deviceLongName, companyId, deviceCategoryId, deviceTypeId, modelSpecificationId, dataFormat], i) => ({
  id, deviceShortName, deviceLongName, companyId, deviceCategoryId, deviceTypeId, modelSpecificationId, dataFormat,
  companyName: companyName(companyId),
  deviceCategoryName: DEVICE_CATEGORIES.find((c) => c.id === deviceCategoryId)?.name || "",
  deviceTypeName: DEVICE_TYPES.find((t) => t.id === deviceTypeId)?.name || "",
  modelSpecificationName: MODEL_SPECS.find((s) => s.id === modelSpecificationId)?.name || "",
  remarks: "", isDeleted: false, createdAt: iso(2025, 6, 2 + i, 10), updatedAt: iso(2025, 6, 2 + i, 10),
}));

// ── Floors / rooms / racks ──────────────────────────────────────────────────
export const FLOORS = [
  [1, "Ground Floor", "Noida DC-1", 1], [2, "First Floor", "Noida DC-1", 1], [3, "Second Floor", "Noida DC-1", 1],
  [4, "Ground Floor", "Navi Mumbai DR", 2], [5, "Level 1", "Singapore Edge", 3],
].map(([id, name, siteName, siteId], i) => ({
  id, name, siteName, siteId, floorNumber: name === "Ground Floor" ? 0 : i, floorPlanFileUrl: "",
  isActive: true, isDeleted: false, createdAt: iso(2025, 6, 20 + i), updatedAt: iso(2025, 6, 20 + i),
}));

// [id, name, floorId, w, l, x, y, rot, area, reserved, internal]
export const ROOMS = [
  [1, "Server Hall A", 1, 60, 40, 0, 0, 0, 2400, 300, 1800],
  [2, "Server Hall B", 1, 50, 40, 70, 0, 0, 2000, 250, 1500],
  [3, "Network Room", 1, 24, 20, 0, 50, 0, 480, 60, 360],
  [4, "UPS Room", 1, 30, 20, 30, 50, 0, 600, 80, 450],
  [5, "Battery Room", 1, 18, 14, 65, 50, 0, 252, 30, 190],
  [6, "Electrical Room", 2, 36, 24, 0, 0, 0, 864, 120, 640],
  [7, "NOC", 2, 30, 22, 40, 0, 0, 660, 60, 520],
  [8, "Server Hall C", 3, 60, 40, 0, 0, 0, 2400, 400, 1700],
  [9, "DR Server Room", 4, 40, 30, 0, 0, 0, 1200, 150, 900],
  [10, "Edge Room", 5, 20, 16, 0, 0, 90, 320, 40, 240],
].map(([id, name, floorId, width, length, positionX, positionY, rotationAngle, roomAreaSqFt, reservedAreaSqFt, internalUseAreaSqFt], i) => ({
  id, name, floorId, width, length, positionX, positionY, rotationAngle, roomAreaSqFt, reservedAreaSqFt, internalUseAreaSqFt,
  floorName: FLOORS.find((f) => f.id === floorId)?.name || "",
  isActive: id !== 7 ? true : true, isDeleted: false, createdAt: iso(2025, 7, 1 + i), updatedAt: iso(2025, 7, 1 + i),
}));

const RACK_ROWS = [
  // room 1 — Server Hall A
  ["R-A01", 1, 42, "Full"], ["R-A02", 1, 42, "Full"], ["R-A03", 1, 42, "Reserved"], ["R-A04", 1, 42, null],
  ["R-A05", 1, 42, "Full"], ["R-A06", 1, 42, "Under-maintenance"], ["R-A07", 1, 42, null], ["R-A08", 1, 42, "Reserved"],
  // room 2 — Server Hall B
  ["R-B01", 2, 47, "Full"], ["R-B02", 2, 47, "Full"], ["R-B03", 2, 47, null], ["R-B04", 2, 47, "Faulty"],
  ["R-B05", 2, 47, "Reserved"], ["R-B06", 2, 47, null],
  // room 3 — Network Room
  ["NR-01", 3, 42, "Full"], ["NR-02", 3, 42, "Full"], ["NR-03", 3, 42, null],
  // room 8 — Server Hall C
  ["R-C01", 8, 48, "Reserved"], ["R-C02", 8, 48, null], ["R-C03", 8, 48, "Decommissioned"],
  // room 9 — DR
  ["DR-R01", 9, 42, "Full"], ["DR-R02", 9, 42, "Full"], ["DR-R03", 9, 42, null], ["DR-R04", 9, 42, "Under-maintenance"],
  // room 10 — Edge
  ["SG-E01", 10, 42, "Full"], ["SG-E02", 10, 42, null],
];

export const RACKS = RACK_ROWS.map(([rackName, roomId, totalUHeight, status], i) => {
  const room = ROOMS.find((r) => r.id === roomId);
  return {
    id: i + 1, rackName, roomId, floorId: room?.floorId ?? null, roomName: room?.name || "",
    totalUHeight, status, maxWeightCapacityKg: totalUHeight >= 47 ? 1500 : 1200,
    positionX: (i % 8) * 2, positionY: Math.floor(i / 8) * 4,
    isActive: status !== "Decommissioned", isDeleted: false,
    createdAt: iso(2025, 7, 10 + (i % 18), 9, i), updatedAt: iso(2025, 7, 10 + (i % 18), 9, i),
  };
});

export const RACK_POWER = RACKS.filter((r) => r.status !== "Decommissioned").flatMap((rack, i) => {
  const rated = rack.totalUHeight >= 47 ? 22 : 11;
  const est = Math.round(rated * (0.45 + ((i * 7) % 30) / 100) * 10) / 10;
  return ["A", "B"].map((feed, j) => ({
    rackId: rack.id, rackName: rack.rackName, pduName: `PDU-${rack.rackName.replace(/^R-|^DR-|^SG-/, "")}-${feed}`,
    phaseName: rated > 11 ? "3-Phase" : j === 0 ? "L1" : "L2",
    ratedCapacityKW: rated, estimatedLoadKW: est,
    measuredLoadKW: Math.round((est * (0.92 + j * 0.04)) * 10) / 10,
    failoverReservedKW: Math.round(rated * 0.2 * 10) / 10,
    isActive: true, isDeleted: false,
  }));
}).map((r, i) => ({ id: i + 1, ...r, createdAt: iso(2025, 8, 1 + (i % 27), 10), updatedAt: iso(2025, 8, 1 + (i % 27), 10) }));

// ── Device details (installed assets) ───────────────────────────────────────
// [short, masterId, rackName|null, startU, sizeU, ip, stage, roomId]
const DETAIL_ROWS = [
  ["SRV-A01-01", 1, "R-A01", 30, 2, "10.10.1.11", "Commissioned"],
  ["SRV-A01-02", 1, "R-A01", 27, 2, "10.10.1.12", "Commissioned"],
  ["SRV-A01-03", 2, "R-A01", 24, 2, "10.10.1.13", "Commissioned"],
  ["SRV-A02-01", 3, "R-A02", 30, 2, "10.10.1.21", "Commissioned"],
  ["SRV-A02-02", 3, "R-A02", 27, 2, "10.10.1.22", "Installed"],
  ["GPU-A05-01", 4, "R-A05", 20, 6, "10.10.1.51", "Commissioned"],
  ["GPU-A05-02", 4, "R-A05", 12, 6, "10.10.1.52", "Commissioned"],
  ["SRV-B01-01", 2, "R-B01", 33, 2, "10.10.2.11", "Commissioned"],
  ["SRV-B01-02", 2, "R-B01", 30, 2, "10.10.2.12", "UnderRepair"],
  ["SRV-B02-01", 1, "R-B02", 33, 2, "10.10.2.21", "Commissioned"],
  ["STR-B03-01", 9, "R-B03", 20, 4, "10.10.2.31", "Commissioned"],
  ["LEAF-A01", 5, "R-A01", 41, 1, "10.10.0.101", "Commissioned"],
  ["LEAF-A02", 5, "R-A02", 41, 1, "10.10.0.102", "Commissioned"],
  ["LEAF-B01", 5, "R-B01", 46, 1, "10.10.0.111", "Commissioned"],
  ["SPINE-01", 6, "NR-01", 20, 13, "10.10.0.1", "Commissioned"],
  ["SPINE-02", 6, "NR-02", 20, 13, "10.10.0.2", "Commissioned"],
  ["ACC-SW-01", 7, "NR-03", 38, 1, "10.10.0.21", "Installed"],
  ["FW-EDGE-01", 8, "NR-01", 38, 2, "10.10.0.254", "Commissioned"],
  ["FW-EDGE-02", 8, "NR-02", 38, 2, "10.10.0.253", "Commissioned"],
  ["PDU-A01-A", 12, "R-A01", 0, 0, "10.20.1.11", "Commissioned"],
  ["PDU-A01-B", 12, "R-A01", 0, 0, "10.20.1.12", "Commissioned"],
  ["PDU-B01-A", 12, "R-B01", 0, 0, "10.20.2.11", "Commissioned"],
  ["UPS-01", 10, null, 0, 0, "10.30.0.11", "Commissioned"],
  ["UPS-02", 11, null, 0, 0, "10.30.0.12", "Commissioned"],
  ["UPS-03", 19, null, 0, 0, "10.30.0.13", "Installed"],
  ["DG-01", 13, null, 0, 0, "10.30.0.21", "Commissioned"],
  ["DG-02", 13, null, 0, 0, "10.30.0.22", "Commissioned"],
  ["PAC-1A", 14, null, 0, 0, "10.40.0.11", "Commissioned"],
  ["PAC-1B", 14, null, 0, 0, "10.40.0.12", "Commissioned"],
  ["PAC-2A", 15, null, 0, 0, "10.40.0.21", "Commissioned"],
  ["PAC-3E", 15, null, 0, 0, "10.40.0.22", "UnderRepair"],
  ["CHILLER-01", 16, null, 0, 0, "10.40.0.31", "Commissioned"],
  ["CAM-ENT-01", 17, null, 0, 0, "10.50.0.11", "Commissioned"],
  ["CAM-HALL-A", 17, null, 0, 0, "10.50.0.12", "Commissioned"],
  ["TH-A01-IN", 18, "R-A01", 0, 0, "10.60.0.11", "Commissioned"],
  ["TH-A05-IN", 18, "R-A05", 0, 0, "10.60.0.12", "Commissioned"],
  ["TH-B01-IN", 18, "R-B01", 0, 0, "10.60.0.13", "Commissioned"],
  ["SRV-DR-01", 2, "DR-R01", 30, 2, "10.80.1.11", "Commissioned"],
  ["SRV-DR-02", 3, "DR-R02", 30, 2, "10.80.1.12", "InStorage"],
  ["SRV-SG-01", 1, "SG-E01", 30, 2, "10.90.1.11", "Received"],
];

const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");

export const DEVICE_DETAILS = DETAIL_ROWS.map(([shortName, masterId, rackName, startU, sizeU, ipAddress, stage], i) => {
  const m = DEVICE_MASTERS.find((x) => x.id === masterId);
  const spec = MODEL_SPECS.find((s) => s.id === m.modelSpecificationId);
  const id = i + 1;
  const cost = { 1: 1250000, 2: 980000, 3: 1060000, 4: 18500000, 5: 860000, 6: 6400000, 7: 310000, 8: 1450000, 9: 7200000, 10: 9800000, 11: 8600000, 12: 145000, 13: 7400000, 14: 2350000, 15: 3900000, 16: 21000000, 17: 68000, 18: 24000, 19: 9300000 }[masterId] || 100000;
  const year = 2023 + (i % 3);
  const month = 1 + (i % 12);
  return {
    id, deviceMasterId: masterId, deviceMasterName: m.deviceLongName,
    shortName, longName: `${m.deviceLongName}${rackName ? ` — ${rackName}` : ""}`,
    companyId: m.companyId, companyName: m.companyName,
    deviceCategoryId: m.deviceCategoryId, deviceCategoryName: m.deviceCategoryName,
    deviceTypeId: m.deviceTypeId, deviceTypeName: m.deviceTypeName,
    modelSpecificationId: m.modelSpecificationId, modelName: spec?.name || "", modelNumber: spec?.modelNumber || "",
    imei: [17, 18].includes(masterId) ? `35${String(8209 + id).padStart(6, "0")}${String(1000000 + id * 7919).slice(-7)}` : "",
    macAddress: `00:1B:${hex2(17 + masterId)}:${hex2(40 + id)}:${hex2((id * 37) % 256)}:${hex2((id * 91) % 256)}`,
    tagNumber: `AST-${year}-${String(id).padStart(4, "0")}`,
    serialNumber: `${m.deviceShortName.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase()}${year}${String(48210 + id * 13)}`,
    rfidTagNumber: `RFID-${String(700100 + id)}`,
    ipAddress, simNumber: [17, 18].includes(masterId) ? `8991000${String(4400000000 + id * 1777)}` : "",
    purchaseDate: iso(year, month, 5 + (i % 20)).slice(0, 10),
    warrantyExpiry: iso(year + 5, month, 5 + (i % 20)).slice(0, 10),
    purchaseCost: cost,
    lifecycleStage: stage, stage, currentStage: stage,
    rackName: rackName || "", startUPosition: rackName && sizeU ? startU : null, uOccupied: rackName && sizeU ? sizeU : null,
    remarks: stage === "UnderRepair" ? "Under OEM repair — RMA raised." : "",
    isActive: stage !== "Decommissioned", isDeleted: false,
    createdAt: iso(2025, 8, 1 + (i % 28), 9, i), updatedAt: iso(2025, 9, 1 + (i % 28), 9, i),
  };
});

const ADDR = { address: "Plot 12, Sector 62", city: "Noida", state: "Uttar Pradesh", country: "India", pinCode: "201309", latitude: 28.627, longitude: 77.3727 };
const ADDR_DR = { address: "MIDC Industrial Area, Building 4", city: "Navi Mumbai", state: "Maharashtra", country: "India", pinCode: "400710", latitude: 19.117, longitude: 73.027 };
const ADDR_SG = { address: "1 Innovation Way, #12-01", city: "Singapore", state: "Central Region", country: "Singapore", pinCode: "138632", latitude: 1.299, longitude: 103.787 };

export const DEVICE_RACK_LOCATIONS = DEVICE_DETAILS.filter((d) => d.rackName && d.uOccupied).map((d, i) => {
  const rack = RACKS.find((r) => r.rackName === d.rackName);
  const addr = d.rackName.startsWith("DR-") ? ADDR_DR : d.rackName.startsWith("SG-") ? ADDR_SG : ADDR;
  return {
    id: i + 1, deviceDetailId: d.id, deviceName: d.shortName, rackId: rack.id, rackName: rack.rackName,
    startUPosition: d.startUPosition, uOccupied: d.uOccupied, ...addr,
    isActive: true, isDeleted: false, createdAt: iso(2025, 9, 2 + (i % 26), 11), updatedAt: iso(2025, 9, 2 + (i % 26), 11),
  };
});

const dev = (short) => DEVICE_DETAILS.find((d) => d.shortName === short)?.id;

// [source, sourcePort, target, targetPort, cableType, label, color, status]
export const NETWORK_CONNECTIONS = [
  ["LEAF-A01", "Eth1/49", "SPINE-01", "Eth1/1", "Fiber", "FO-A01-S1", "#00BFFF", "Connected"],
  ["LEAF-A01", "Eth1/50", "SPINE-02", "Eth1/1", "Fiber", "FO-A01-S2", "#00BFFF", "Connected"],
  ["LEAF-A02", "Eth1/49", "SPINE-01", "Eth1/2", "Fiber", "FO-A02-S1", "#00BFFF", "Connected"],
  ["LEAF-A02", "Eth1/50", "SPINE-02", "Eth1/2", "Fiber", "FO-A02-S2", "#00BFFF", "Connected"],
  ["LEAF-B01", "Eth1/49", "SPINE-01", "Eth1/3", "Fiber", "FO-B01-S1", "#00BFFF", "Connected"],
  ["LEAF-B01", "Eth1/50", "SPINE-02", "Eth1/3", "Fiber", "FO-B01-S2", "#00BFFF", "Faulty"],
  ["SRV-A01-01", "NIC1", "LEAF-A01", "Eth1/1", "Cat6a", "CU-A01-01", "#3B82F6", "Connected"],
  ["SRV-A01-02", "NIC1", "LEAF-A01", "Eth1/2", "Cat6a", "CU-A01-02", "#3B82F6", "Connected"],
  ["SRV-A01-03", "NIC1", "LEAF-A01", "Eth1/3", "Cat6a", "CU-A01-03", "#3B82F6", "Connected"],
  ["SRV-A02-01", "NIC1", "LEAF-A02", "Eth1/1", "Cat6a", "CU-A02-01", "#3B82F6", "Connected"],
  ["SRV-A02-02", "NIC1", "LEAF-A02", "Eth1/2", "Cat6a", "CU-A02-02", "#3B82F6", "Planned"],
  ["GPU-A05-01", "NIC1", "LEAF-A02", "Eth1/20", "Fiber", "FO-A05-01", "#22C55E", "Connected"],
  ["SRV-B01-01", "NIC1", "LEAF-B01", "Eth1/1", "Cat6", "CU-B01-01", "#F59E0B", "Connected"],
  ["SRV-B01-02", "NIC1", "LEAF-B01", "Eth1/2", "Cat6", "CU-B01-02", "#F59E0B", "Disconnected"],
  ["SPINE-01", "Eth2/1", "FW-EDGE-01", "port1", "Fiber", "FO-S1-FW1", "#A855F7", "Connected"],
  ["SPINE-02", "Eth2/1", "FW-EDGE-02", "port1", "Fiber", "FO-S2-FW2", "#A855F7", "Connected"],
  ["STR-B03-01", "e0a", "LEAF-B01", "Eth1/30", "Fiber", "FO-B03-ST", "#22C55E", "Connected"],
].map(([s, sp, t, tp, cableType, cableLabel, cableColorCode, status], i) => ({
  id: i + 1, sourceDeviceDetailId: dev(s), sourceDeviceName: s, sourcePortName: sp,
  targetDeviceDetailId: dev(t), targetDeviceName: t, targetPortName: tp,
  cableType, cableLabel, cableColorCode, status, cableLengthMeters: 3 + (i % 8) * 2,
  isActive: status !== "Disconnected", isDeleted: false, createdAt: iso(2025, 9, 10 + (i % 18), 14), updatedAt: iso(2025, 9, 10 + (i % 18), 14),
}));

// [device, protocol, port, unitId, objectId, interval]
export const CONNECTION_CONFIGS = [
  ["UPS-01", "Modbus", 502, 1, "", 30], ["UPS-02", "Modbus", 502, 1, "", 30], ["UPS-03", "Modbus", 502, 2, "", 30],
  ["DG-01", "Modbus", 502, 3, "", 60], ["DG-02", "Modbus", 502, 4, "", 60],
  ["PAC-1A", "BACnet", 47808, null, "2001", 60], ["PAC-1B", "BACnet", 47808, null, "2002", 60],
  ["PAC-2A", "BACnet", 47808, null, "2003", 60], ["CHILLER-01", "BACnet", 47808, null, "3001", 120],
  ["PDU-A01-A", "SNMP", 161, null, "1.3.6.1.4.1.13742.6", 30], ["PDU-A01-B", "SNMP", 161, null, "1.3.6.1.4.1.13742.6", 30],
  ["PDU-B01-A", "SNMP", 161, null, "1.3.6.1.4.1.13742.6", 30], ["TH-A01-IN", "SNMP", 161, null, "1.3.6.1.4.1.13742.8", 15],
  ["TH-A05-IN", "SNMP", 161, null, "1.3.6.1.4.1.13742.8", 15], ["SPINE-01", "SNMP", 161, null, "1.3.6.1.2.1.2", 60],
  ["SRV-A01-01", "Redfish", 443, null, "/redfish/v1/Systems/1", 120],
].map(([short, protocol, port, unitId, objectId, pollingIntervalSeconds], i) => {
  const d = DEVICE_DETAILS.find((x) => x.shortName === short);
  return {
    id: i + 1, deviceDetailId: d.id, deviceName: d.shortName, protocol, ipAddress: d.ipAddress, port, unitId, objectId,
    pollingIntervalSeconds,
    thingsBoardDeviceId: `${(0x1a2b3c4d + i * 4099).toString(16)}-6f1e-11ef-9c4a-${(0x0242ac120002 + i).toString(16).padStart(12, "0")}`,
    isActive: true, isDeleted: false, createdAt: iso(2025, 10, 1 + (i % 25), 12), updatedAt: iso(2025, 10, 1 + (i % 25), 12),
  };
});

// ── Associations (parent device → sub devices) ──────────────────────────────
export const DEVICE_ASSOCIATIONS = [
  ["PDU-A01-A", ["TH-A01-IN"]],
  ["SPINE-01", ["LEAF-A01", "LEAF-A02", "LEAF-B01"]],
  ["UPS-01", ["PDU-A01-A", "PDU-B01-A"]],
  ["UPS-02", ["PDU-A01-B"]],
].flatMap(([parent, children]) => children.map((c) => ({ parentDeviceId: dev(parent), childDeviceId: dev(c) })));

// ── Document master / entity types ──────────────────────────────────────────
export const DOCUMENT_TYPES = [
  "Purchase Invoice", "Warranty Certificate", "AMC Contract", "Installation Report", "Test Certificate",
  "Datasheet", "User Manual", "Compliance Certificate", "GST Certificate", "PAN Card", "Insurance Policy",
].map((name, i) => ({ id: i + 1, name, documentTypeName: name, typeName: name, description: "", isActive: true, createdAt: iso(2025, 3, 1 + i), updatedAt: iso(2025, 3, 1 + i) }));

export const ISSUERS = [
  "Manufacturer (OEM)", "Authorised Distributor", "System Integrator", "Government Authority",
  "Insurance Company", "Testing Laboratory", "Internal Facilities Team",
].map((name, i) => ({ id: i + 1, name, issuerName: name, issuedByName: name, isActive: true }));

export const ENTITY_TYPES_COMPANY = [
  "Company", "UserProfile", "CompanyAddress", "BankDetail", "LocationModel",
].map((name, i) => ({ id: i + 1, entityTypeName: name, name, isActive: true }));

export const ENTITY_TYPES_DEVICE = [
  "DeviceDetail", "DeviceLocation", "ModelSpecification", "DeviceMaster", "Device", "Rack", "Room",
].map((name, i) => ({ id: i + 1, entityTypeName: name, name, isActive: true }));

// ── Life-cycle ──────────────────────────────────────────────────────────────
export const LIFECYCLE_STAGES = ["Received", "Installed", "Commissioned", "UnderRepair", "InStorage", "Decommissioned", "Disposed"]
  .map((name, i) => ({ id: i + 1, name, stageName: name, sequence: i + 1 }));

export const LIFECYCLE_USERS = [
  { id: 1, name: "Admin", userName: "admin", email: "admin@dcim.local" },
  { id: 2, name: "Rahul Verma", userName: "rahul.verma", email: "rahul.verma@acmetech.example.com" },
  { id: 3, name: "Suresh Yadav", userName: "suresh.yadav", email: "suresh.yadav@primefacility.example.com" },
  { id: 4, name: "Neha Singh", userName: "neha.singh", email: "neha.singh@dcim.local" },
];

export const LIFECYCLE_LOCATIONS = [
  { id: 1, name: "Noida DC-1 / Server Hall A" }, { id: 2, name: "Noida DC-1 / Server Hall B" },
  { id: 3, name: "Noida DC-1 / Network Room" }, { id: 4, name: "Noida DC-1 / Stores" },
  { id: 5, name: "Navi Mumbai DR / DR Server Room" }, { id: 6, name: "Singapore Edge / Edge Room" },
];

const ORDER = ["Received", "Installed", "Commissioned"];
export function lifecycleHistoryFor(device) {
  const steps = [...ORDER];
  if (device.lifecycleStage === "UnderRepair") steps.push("UnderRepair");
  if (device.lifecycleStage === "InStorage") steps.splice(1, 2, "InStorage");
  if (device.lifecycleStage === "Received") steps.splice(1);
  if (device.lifecycleStage === "Installed") steps.splice(2);
  const base = new Date(device.purchaseDate || "2025-01-01");
  return steps.map((stage, i) => ({
    id: device.id * 10 + i, deviceDetailId: device.id, stage, stageName: stage,
    changedAt: new Date(base.getTime() + i * 9 * 86400000).toISOString(),
    changedBy: LIFECYCLE_USERS[(device.id + i) % LIFECYCLE_USERS.length].name,
    location: device.rackName ? `Noida DC-1 / ${device.rackName}` : LIFECYCLE_LOCATIONS[(device.id + i) % LIFECYCLE_LOCATIONS.length].name,
    notes: i === 0 ? "Received at stores against PO." : stage === "UnderRepair" ? "Fan failure — sent for OEM repair." : `${stage} by facilities team.`,
  })).reverse();
}
