// ═══════════════════════════════════════════════════════════════════════════
// NewDcimDashBoard.jsx — DCIM Health Index (DCIMDashboard2)
// ---------------------------------------------------------------------------
// Ported from the reference portal (src/Component/MainDashboard/NewDcimDashBoard.jsx):
// same circular health ring, connector lines, side panels, KPI cards and
// "MORE →" parameter table. It sits at the TOP of the Dashboard's DCIM tab,
// above the existing DCIM KPI dashboard.
//
// What changed from the original: no number is typed in here any more. The
// KPI cards, alarms and tickets come from dcimDashboardData.js, which
// calculates them from the 5D View, and every health score is CALCULATED
// from the parameter table — parameter score from Actual / Target / Worst,
// category score = Σ(score × weight) ÷ Σ weight, DCIM Health Index = mean of
// the eight categories. Editing an Actual Value in the table recalculates the
// ring live.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DCIM, SHOW, ACTIVE_ALARMS, ALARM_SUMMARY, SEVERITY_COLOR, HEALTH_ACTUALS,
} from "./dcimDashboardData";
import { SERVER_FLEET } from "./dcimAssetRegister";
import { useNavigate } from "react-router-dom";
import { useTicketStore, ticketCounts } from "../Tickets/ticketStore";

// Servers by state, counted from the same register as the Asset Dashboard.
const SERVERS_HEALTHY = SERVER_FLEET.filter((s) => s.status === "Online").length;   // 311
const SERVERS_ALARMED = SERVER_FLEET.length - SERVERS_HEALTHY;                       // 1 (GPU-E1-01)



// ── Excel parameter sheet (ported verbatim; actual values are filled from
//    HEALTH_ACTUALS in dcimDashboardData.js) ──
const EXCEL_PARAMS = [{ "id": 1, "category": "Power Health", "name": "Power Availability", "unit": "%", "direction": "Higher", "target": 99.99, "worst": 95, "weight": 15, "actual": null, "score": null, "weighted": null, "calculation": "Available power / required power × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 2, "category": "Power Health", "name": "UPS Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Healthy UPS modules / total UPS modules × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 3, "category": "Power Health", "name": "Generator Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Available generators / total generators × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 4, "category": "Power Health", "name": "PDU Health", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Healthy PDUs / total PDUs × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 5, "category": "Power Health", "name": "Power Quality", "unit": "%", "direction": "Higher", "target": 98, "worst": 90, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Power-quality compliance score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 6, "category": "Power Health", "name": "Power Load & Capacity", "unit": "%", "direction": "Higher", "target": 85, "worst": 50, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Score against approved operating band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 7, "category": "Power Health", "name": "Power Redundancy", "unit": "%", "direction": "Higher", "target": 100, "worst": 80, "weight": 18, "actual": null, "score": null, "weighted": null, "calculation": "Available redundancy / required redundancy × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 8, "category": "Power Health", "name": "Energy Efficiency / PUE", "unit": "PUE", "direction": "Lower", "target": 1.4, "worst": 1.8, "weight": 15, "actual": null, "score": null, "weighted": null, "calculation": "PUE = total facility power / IT equipment power", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 9, "category": "DC Operations", "name": "Change Management", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Compliant changes / total changes × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 10, "category": "DC Operations", "name": "SOP Compliance", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Compliant SOP checks / total checks × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 11, "category": "DC Operations", "name": "Work Order Management", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "WO closed within SLA / due WO × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 12, "category": "DC Operations", "name": "Preventive Maintenance", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "PM completed on time / PM due × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 13, "category": "DC Operations", "name": "Asset Lifecycle Management", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Assets with current lifecycle data / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 14, "category": "DC Operations", "name": "Vendor & Contract Management", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Compliant contracts / total contracts × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 15, "category": "DC Operations", "name": "Documentation & Audit", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Required evidence current / required evidence × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 16, "category": "DC Operations", "name": "Operational Efficiency / KPI", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Composite operational KPI score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 17, "category": "Facility Health", "name": "Electrical Systems", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Healthy electrical assets / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 18, "category": "Facility Health", "name": "Plumbing Systems", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 8, "actual": null, "score": null, "weighted": null, "calculation": "Healthy plumbing systems / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 19, "category": "Facility Health", "name": "Fire Detection & Suppression", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 15, "actual": null, "score": null, "weighted": null, "calculation": "Compliant fire systems / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 20, "category": "Facility Health", "name": "Building Fabric / Structure", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Structural inspection compliance score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 21, "category": "Facility Health", "name": "Lighting Systems", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 8, "actual": null, "score": null, "weighted": null, "calculation": "Functional lighting / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 22, "category": "Facility Health", "name": "Physical Infrastructure", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Healthy physical assets / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 23, "category": "Facility Health", "name": "Housekeeping & Cleanliness", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 8, "actual": null, "score": null, "weighted": null, "calculation": "Inspection score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 24, "category": "Facility Health", "name": "Space & Rack Utilization", "unit": "%", "direction": "Higher", "target": 90, "worst": 60, "weight": 15, "actual": null, "score": null, "weighted": null, "calculation": "Score against approved utilization band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 25, "category": "Network Health", "name": "Network Availability", "unit": "%", "direction": "Higher", "target": 99.99, "worst": 95, "weight": 16, "actual": null, "score": null, "weighted": null, "calculation": "Available service time / total service time × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 26, "category": "Network Health", "name": "Bandwidth Utilization", "unit": "%", "direction": "Higher", "target": 80, "worst": 50, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Score against approved utilization band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 27, "category": "Network Health", "name": "Network Latency", "unit": "ms", "direction": "Lower", "target": 10, "worst": 50, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Average or 95th-percentile latency", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 28, "category": "Network Health", "name": "Packet Loss / Error Rate", "unit": "%", "direction": "Lower", "target": 0.5, "worst": 5, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Packet loss percentage", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 29, "category": "Network Health", "name": "Network Redundancy", "unit": "%", "direction": "Higher", "target": 100, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Available redundant paths / required × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 30, "category": "Network Health", "name": "Core / Distribution Health", "unit": "%", "direction": "Higher", "target": 99, "worst": 85, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Healthy core/distribution devices / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 31, "category": "Network Health", "name": "DNS / DHCP / IP Services", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 8, "actual": null, "score": null, "weighted": null, "calculation": "Successful service checks / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 32, "category": "Network Health", "name": "Network Security", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Compliant network-security controls / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 33, "category": "IT Infrastructure Health", "name": "Server Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Healthy servers / total servers × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 34, "category": "IT Infrastructure Health", "name": "Storage Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Healthy storage systems/components / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 35, "category": "IT Infrastructure Health", "name": "Virtualization Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Healthy virtualization checks × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 36, "category": "IT Infrastructure Health", "name": "Database Health", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Database health/availability score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 37, "category": "IT Infrastructure Health", "name": "Application Availability", "unit": "%", "direction": "Higher", "target": 99.9, "worst": 95, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Available application time / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 38, "category": "IT Infrastructure Health", "name": "Backup & Recovery", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Successful backup/recovery test score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 39, "category": "IT Infrastructure Health", "name": "Capacity Utilization", "unit": "%", "direction": "Higher", "target": 85, "worst": 50, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Score against approved CPU/memory/storage band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 40, "category": "IT Infrastructure Health", "name": "Patch & Update Compliance", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Patched compliant systems / applicable × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 41, "category": "Security Health", "name": "Access Control", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Compliant access-control checks / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 42, "category": "Security Health", "name": "CCTV Surveillance", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Operational cameras / total cameras × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 43, "category": "Security Health", "name": "Perimeter Security", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Operational perimeter controls / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 44, "category": "Security Health", "name": "Intrusion Detection", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Successful IDS tests / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 45, "category": "Security Health", "name": "Fire Safety Systems", "unit": "%", "direction": "Higher", "target": 99, "worst": 90, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Compliant fire-safety checks / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 46, "category": "Security Health", "name": "IT Security Compliance", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Compliant security controls / applicable × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 47, "category": "Security Health", "name": "Security Incidents", "unit": "Incidents/month", "direction": "Lower", "target": 1, "worst": 10, "weight": 8, "actual": null, "score": null, "weighted": null, "calculation": "Material security incidents per month", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 48, "category": "Security Health", "name": "Security Patch Management", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 16, "actual": null, "score": null, "weighted": null, "calculation": "Patches deployed within SLA / applicable × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 49, "category": "Environment Health", "name": "Temperature", "unit": "°C", "direction": "Lower", "target": 24, "worst": 30, "weight": 16, "actual": null, "score": null, "weighted": null, "calculation": "Use approved temperature operating band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 50, "category": "Environment Health", "name": "Humidity", "unit": "%RH", "direction": "Lower", "target": 50, "worst": 70, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Use approved humidity operating band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 51, "category": "Environment Health", "name": "Air Quality", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Air-quality compliance score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 52, "category": "Environment Health", "name": "Water Leak Detection", "unit": "%", "direction": "Higher", "target": 100, "worst": 90, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Healthy leak sensors / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 53, "category": "Environment Health", "name": "Smoke Detection", "unit": "%", "direction": "Higher", "target": 100, "worst": 90, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Healthy smoke detectors / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 54, "category": "Environment Health", "name": "Vibration Monitoring", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 8, "actual": null, "score": null, "weighted": null, "calculation": "Readings within approved limits × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 55, "category": "Environment Health", "name": "Dust & Particulate Monitoring", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Readings within approved limits × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 56, "category": "Environment Health", "name": "Sustainability / Carbon Footprint", "unit": "Score", "direction": "Higher", "target": 90, "worst": 60, "weight": 16, "actual": null, "score": null, "weighted": null, "calculation": "Sustainability KPI score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 57, "category": "Cooling Health", "name": "CRAC / AHU Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Healthy CRAC/AHU units / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 58, "category": "Cooling Health", "name": "Chiller Plant Health", "unit": "%", "direction": "Higher", "target": 98, "worst": 85, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Healthy chiller components / total × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 59, "category": "Cooling Health", "name": "Cooling Capacity Utilization", "unit": "%", "direction": "Higher", "target": 85, "worst": 50, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Score against approved cooling band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 60, "category": "Cooling Health", "name": "Cooling Redundancy", "unit": "%", "direction": "Higher", "target": 100, "worst": 80, "weight": 14, "actual": null, "score": null, "weighted": null, "calculation": "Available redundant cooling / required × 100", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 61, "category": "Cooling Health", "name": "Supply & Return Temperature", "unit": "°C", "direction": "Lower", "target": 24, "worst": 30, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Use approved temperature operating band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 62, "category": "Cooling Health", "name": "Humidity Control", "unit": "%RH", "direction": "Lower", "target": 50, "worst": 70, "weight": 10, "actual": null, "score": null, "weighted": null, "calculation": "Use approved humidity operating band", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 63, "category": "Cooling Health", "name": "Airflow Management", "unit": "%", "direction": "Higher", "target": 98, "worst": 80, "weight": 12, "actual": null, "score": null, "weighted": null, "calculation": "Airflow compliance score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }, { "id": 64, "category": "Cooling Health", "name": "Cooling Energy Efficiency", "unit": "%", "direction": "Higher", "target": 95, "worst": 70, "weight": 16, "actual": null, "score": null, "weighted": null, "calculation": "Cooling efficiency KPI score", "frequency": "Real-time / Daily / Monthly", "owner": null, "notes": null }];

// The eight categories in ring order (also the order of the overall mean).
const CATEGORIES = [
    "Power Health", "Cooling Health", "Environment Health", "Security Health",
    "IT Infrastructure Health", "Network Health", "Facility Health", "DC Operations",
];

// Ring icon (data-icon key) → its category: clicking an icon opens the same
// parameter modal as that category's "MORE →".
const ICON_CATEGORY = {
    power: "Power Health", cooling: "Cooling Health", env: "Environment Health",
    security: "Security Health", it: "IT Infrastructure Health", network: "Network Health",
    facility: "Facility Health", ops: "DC Operations",
};
// The centre % ticks between the calculated index and one point above it
// (e.g. 91 → 92 → 91 …), like a live reading.
const LIVE_TICK_MS = 3000;

const DESC = {
    "Power Health": "Power availability, UPS, Generators, PDUs, Power quality",
    "Cooling Health": "CRAC/AC, Chillers, AHU, Cooling distribution",
    "Environment Health": "Temperature, Humidity, Airflow, Pressure, Water Leak",
    "Security Health": "Access Control, CCTV, Fire Safety, Intrusion Detection",
    "IT Infrastructure Health": "Servers, Storage, Virtualization, Applications",
    "Network Health": "Network Availability, Bandwidth, Latency, Devices",
    "Facility Health": "Electrical, Plumbing, Fire Systems, Building Fabric",
    "DC Operations": "Processes, SOPs, Compliance, Team Efficiency",
};

// Latest five active alarms — devices are real 5D View asset tags.
const ALARMS = ACTIVE_ALARMS.slice(0, 5).map((a) => ({
    color: SEVERITY_COLOR[a.severity], title: a.title, code: a.device, time: a.time, detail: a.detail,
}));

function computeScore(p) {
    const a = Number(p.actual), t = Number(p.target), w = Number(p.worst);
    if (!Number.isFinite(a)) return null;
    if (p.direction === "Higher") {
        if (a >= t) return 100;
        if (a <= w) return 0;
        return ((a - w) / (t - w)) * 100;
    } else {
        if (a <= t) return 100;
        if (a >= w) return 0;
        return ((w - a) / (w - t)) * 100;
    }
}
function scoreColor(s) {
    if (s == null) return "#7a879a";
    if (s >= 90) return "#159447";
    if (s >= 80) return "#2b8bd1";
    if (s >= 70) return "#d89a00";
    return "#e3343f";
}
function fmt(v) {
    if (v == null || v === "") return "—";
    return Number.isFinite(Number(v)) ? String(v) : String(v);
}
function statusOf(s) {
    if (s == null) return { label: "NO DATA", color: scoreColor(null) };
    const r = Math.round(s);
    if (r >= 90) return { label: "EXCELLENT", color: scoreColor(r) };
    if (r >= 80) return { label: "GOOD", color: scoreColor(r) };
    if (r >= 70) return { label: "FAIR", color: scoreColor(r) };
    return { label: "POOR", color: scoreColor(r) };
}

// Actual value of a parameter: the user's edit in the table if there is one,
// otherwise the calculated / demo value from dcimDashboardData.js.
function actualOf(p, overrides) {
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, p.id)) return overrides[p.id];
    return HEALTH_ACTUALS[p.id]?.v ?? p.actual;
}

// Category score = Σ(score × weight) ÷ Σ weight over the parameters that have
// an actual value — the Excel weights of a category do not always total 100.
function categoryResult(category, overrides) {
    const rows = EXCEL_PARAMS.filter((p) => p.category === category).map((p) => {
        const actual = actualOf(p, overrides);
        return { p, actual, score: computeScore({ ...p, actual }) };
    });
    const scored = rows.filter((r) => r.score != null);
    const weightSum = scored.reduce((t, r) => t + Number(r.p.weight), 0);
    const score = weightSum ? scored.reduce((t, r) => t + r.score * Number(r.p.weight), 0) / weightSum : null;
    return { rows, weightSum, score };
}

function computeHealth(overrides) {
    const scores = {};
    CATEGORIES.forEach((c) => { scores[c] = categoryResult(c, overrides).score; });
    const known = CATEGORIES.map((c) => scores[c]).filter((v) => v != null);
    const overall = known.length ? known.reduce((t, v) => t + v, 0) / known.length : null;
    return { scores, overall };
}
const showScore = (v) => (v == null ? "—" : Math.round(v));

// ── Global CSS (ported 1:1 from the source <style> block, class names prefixed dcimx- to avoid clashes) ──
const CSS = `
.dcimx-app{min-height:auto;display:flex;font-family:Arial,"Segoe UI",sans-serif;color:#152033;background:#fff}
.dcimx-main{flex:1;min-width:0;padding:0 18px 20px}
.dcimx-body-grid{display:grid;grid-template-columns:minmax(0,1fr) 415px;gap:14px;align-items:stretch}
.dcimx-health-card{background:#fff;border:1px solid #dfe5ed;border-radius:17px;overflow:hidden}
.dcimx-health-scaler{position:relative;width:100%;overflow:hidden}
.dcimx-health-stage{position:absolute;left:50%;top:0}
.dcimx-health-svg{position:absolute;left:50%;top:45%;width:500px;height:500px;transform:translate(-50%,-50%);z-index:1;overflow:visible}

.dcimx-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;width:246px;height:246px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 0 0 8px #fff,0 7px 28px rgba(20,40,72,.10)}
.dcimx-center .title{font-size:15px;font-weight:800;letter-spacing:.2px}
.dcimx-center .number{font-size:78px;line-height:.95;font-weight:900;letter-spacing:-4px;margin:9px 0 7px}
.dcimx-center .number span{font-size:28px;vertical-align:top;position:relative;top:8px;letter-spacing:0}
.dcimx-center .excellent{background:#159447;color:#fff;border-radius:18px;padding:6px 18px;font-size:12px;font-weight:800;transition:background .4s ease}
.dcimx-center .number.tick{animation:dcimxTick .55s ease}
@keyframes dcimxTick{0%{opacity:.25;transform:translateY(6px) scale(.96)}100%{opacity:1;transform:none}}
.dcimx-ring-icon{cursor:pointer;transition:filter .18s ease}
.dcimx-ring-icon:hover,.dcimx-ring-icon:focus{filter:brightness(1.18) saturate(1.15);outline:none}
.dcimx-cat{position:absolute;width:190px;z-index:8;background:transparent;border:0;border-radius:0;padding:0;margin:0}
.dcimx-cat .name{font-size:13px;line-height:1.18;font-weight:900;letter-spacing:.15px}
.dcimx-cat .score{font-size:20px;line-height:1.05;font-weight:900;margin:5px 0 5px;color:#182033}
.dcimx-cat .score small{font-size:11px;color:#111;font-weight:700}
.dcimx-cat .desc{font-size:11px;line-height:1.45;color:#1d2431;max-width:185px}
.dcimx-more{display:inline-flex;align-items:center;margin-left:5px;margin-top:3px;border:0;background:transparent;color:#1559c5;font-size:10px;font-weight:900;padding:0;cursor:pointer;vertical-align:middle}
.dcimx-more:hover{text-decoration:underline}
/* TOP LEFT */
/* POWER */
.dcimx-c-power {
    left: 34px;
    top: 18px;
}

/* COOLING */
.dcimx-c-cooling {
    right: 20px;
    top: 30px;
}

/* OPERATIONS */
.dcimx-c-ops {
    left: 10px;
    top: 170px;
}

/* ENVIRONMENT */
.dcimx-c-env {
    right: -30px;
    top:295px;
}

/* FACILITY */
.dcimx-c-facility {
    left: 12px;
    top: 300px;
}

/* SECURITY */
.dcimx-c-security {
    right: -20px;
    top: 450px;
}

/* NETWORK */
.dcimx-c-network {
    left: 30px;
    top: 470px;
}

/* IT */
.dcimx-c-it {
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
  
    
    width: 190px;
}
.dcimx-c-it .desc{margin:auto}
.dcimx-connector-svg{position:absolute;inset:0;width:100%;height:100%;z-index:5;overflow:visible;pointer-events:none}
.dcimx-connector-svg path{fill:none;stroke-width:2;opacity:.95;stroke-linecap:round;stroke-linejoin:round}
.dcimx-connector-svg circle{stroke:#fff;stroke-width:2}
.dcimx-c-power .name,.dcimx-c-power{color:#2f72df}
.dcimx-c-cooling .name,.dcimx-c-cooling{color:#2fa84f}
.dcimx-c-env .name,.dcimx-c-env{color:#ec6826}
.dcimx-c-security .name,.dcimx-c-security{color:#159b8e}
.dcimx-c-it .name,.dcimx-c-it{color:#5d3fc4}
.dcimx-c-network .name,.dcimx-c-network{color:#7047c9}
.dcimx-c-facility .name,.dcimx-c-facility{color:#efa824}
.dcimx-c-ops .name,.dcimx-c-ops{color:#1695b8}
.dcimx-side{display:flex;flex-direction:column;gap:14px}
.dcimx-panel{background:#fff;border:1px solid #dfe5ed;border-radius:14px;padding:17px 18px}
.dcimx-panel h3{font-size:13px;margin:0 0 14px;font-weight:900;letter-spacing:.35px}
.dcimx-alerts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.dcimx-alert{border-radius:9px;padding:12px 6px;text-align:center}
.dcimx-alert .n{font-size:24px;font-weight:900}
.dcimx-alert .l{font-size:9px;font-weight:800;margin-top:4px}
.dcimx-critical{background:#fff0f1;color:#e3343f}
.dcimx-major{background:#fff5e8;color:#ed8610}
.dcimx-minor{background:#fff8e7;color:#dba000}
.dcimx-ticket-grid{display:grid;grid-template-columns:repeat(4,1fr)}
.dcimx-ticket{text-align:center;border-right:1px solid #e7ebf1}
.dcimx-ticket:last-child{border:0}
.dcimx-ticket .ti{font-size:22px;margin-bottom:6px}
.dcimx-ticket .tn{font-size:20px;font-weight:900}
.dcimx-ticket .tl{font-size:9px;color:#68758a;font-weight:800;margin-top:5px}
.dcimx-ticket-link{display:block;text-align:center;margin-top:15px;text-decoration:none;color:#1559c5;font-size:12px;font-weight:800}
.dcimx-live-panel{background:#06213e;color:#fff;border-color:#06213e;padding-bottom:13px}
.dcimx-live-panel h3{color:#fff}
.dcimx-live-head{border-bottom:1px solid #29425e;padding-bottom:10px;margin-bottom:2px}
.dcimx-alarm{display:grid;grid-template-columns:minmax(0,1fr) 75px 62px;gap:7px;align-items:center;padding:10px 0;border-bottom:1px solid #203b57;font-size:11.5px}
.dcimx-alarm:last-of-type{border-bottom:0}
.dcimx-alarm .an{display:flex;align-items:center;gap:8px;font-weight:700;min-width:0}
.dcimx-alarm .an span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dcimx-alarm .ad,.dcimx-alarm .at{text-align:right;color:#fff;font-size:10.5px}
.dcimx-alarm-dot{width:8px;height:8px;border-radius:50%;flex:0 0 8px}
.dcimx-live-link{display:block;text-align:center;color:#4aa3ff;text-decoration:none;font-size:12px;font-weight:800;margin-top:10px}
.dcimx-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:15px}
.dcimx-stat{background:#fff;border:1px solid #dfe5ed;border-radius:13px;padding:14px 12px 11px;min-height:140px;box-shadow:0 1px 2px rgba(20,40,72,.03)}
.dcimx-stat-head{display:flex;align-items:center;gap:10px;min-height:52px}
.dcimx-stat-icon{width:46px;height:46px;border-radius:9px;display:grid;place-items:center;color:#fff;font-size:23px;flex:0 0 46px}
.dcimx-stat-value{font-size:23px;line-height:1;font-weight:900;letter-spacing:-.4px}
.dcimx-stat-name{font-size:8.5px;font-weight:900;margin-top:6px;white-space:nowrap}
.dcimx-stat-detail{display:flex;margin-top:13px;padding-top:9px;border-top:1px solid #edf0f4;text-align:center;font-size:8.5px;color:#1b2535;min-height:38px;align-items:center}
.dcimx-stat-detail>div{flex:1}
.dcimx-stat-detail>div+div{border-left:1px solid #edf0f4}
.dcimx-stat-detail b{display:block;font-size:11px;margin-top:4px}
.dcimx-overlay {
    position: fixed !important;

    inset: 0 !important;

    width: 100vw !important;
    height: 100vh !important;

    display: flex;

    align-items: flex-start;
    justify-content: center;

    padding: 20px 10px;

    box-sizing: border-box;

    background: rgba(12, 27, 48, 0.55);

    backdrop-filter: blur(4px);

    z-index: 2147483647 !important;

    overflow-y: auto;
}
.dcimx-overlay.show{display:flex}
.dcimx-modal {
    position: relative;

    width: 96vw;
    max-width: 1300px;

    max-height: calc(100vh - 40px);

    margin: 0 auto;

    background: #fff;
    border-radius: 16px;

    padding: 22px;

    box-sizing: border-box;

    box-shadow: 0 25px 70px rgba(5, 20, 45, 0.30);

    overflow-y: auto;
    overflow-x: auto;

    z-index: 2147483647;
}
.dcimx-modal-top{display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #e7ebf1;padding-bottom:13px}
.dcimx-modal h2{margin:0;font-size:19px}
.dcimx-modal p{margin:5px 0 0;color:#728096;font-size:11px}
.dcimx-close{width:36px;height:36px;border:0;background:#f1f4f8;border-radius:9px;font-size:23px;color:#66758b;cursor:pointer;flex-shrink:0}
.dcimx-modal-score{display:flex;align-items:center;gap:10px;margin:14px 0;flex-wrap:wrap}
.dcimx-big-score{font-size:30px;font-weight:900}
.dcimx-status-tag{color:#fff;padding:5px 12px;border-radius:20px;font-size:10px;font-weight:800}
.dcimx-table-box{border:1px solid #e3e8ef;border-radius:10px;overflow-x:auto;overflow-y:hidden;max-width:100%;-webkit-overflow-scrolling:touch}
.dcimx-table-box table{border-collapse:collapse;width:100%;min-width:1040px;table-layout:fixed;font-size:10.5px}
.dcimx-table-box th{background:#f6f8fb;color:#6d798e;text-align:left;padding:8px 6px;font-size:8.5px;letter-spacing:.2px;white-space:normal;word-break:break-word;position:sticky;top:0}
.dcimx-table-box td{padding:8px 6px;border-top:1px solid #edf0f4;white-space:normal;word-break:break-word;vertical-align:top}
.dcimx-muted{color:#78859a}
.dcimx-actual-input{width:100%;max-width:70px;border:1px solid #cbd5e2;border-radius:6px;padding:5px 6px;font-size:10.5px;box-sizing:border-box}
.dcimx-actual-input:focus{outline:0;border-color:#2769d4;box-shadow:0 0 0 3px #2769d41a}
.dcimx-calc{color:#4b5870;font-size:9.5px;white-space:normal;line-height:1.35}
.dcimx-src{display:block;margin-top:4px;font-size:9px;font-weight:700;line-height:1.3}
.dcimx-src.d5{color:#1559c5}
.dcimx-src.ops{color:#8a94a6}
.dcimx-total-row td{background:#f6f8fb;font-weight:900;border-top:2px solid #e3e8ef}
.dcimx-modal-note{margin-top:12px;background:#f5f9ff;border:1px solid #dce8ff;border-radius:9px;padding:10px;color:#526c94;font-size:10.5px;line-height:1.5}
.dcimx-modal-note b{color:#1b58ba}
@media(max-width:1280px){
  .dcimx-body-grid{grid-template-columns:minmax(0,1fr) 370px}
  .dcimx-stats{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:980px){
  .dcimx-main{padding:0 10px 15px}
  .dcimx-body-grid{grid-template-columns:1fr}
  .dcimx-side{display:grid;grid-template-columns:repeat(3,1fr)}
  .dcimx-stats{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:720px){
  .dcimx-side{display:flex}
  .dcimx-stats{grid-template-columns:1fr}
}
`;

// ── CategoryLabel (one health-category label on the ring) ──
function CategoryLabel({ posClass, name, score, desc, category, onMore }) {
    return (
        <div className={`dcimx-cat ${posClass}`} data-cat={posClass}>
            <div className="name">{name}</div>
            <div className="score">{score}<small>/100</small></div>
            <div className="desc">
                {desc}
                <button className="dcimx-more" onClick={() => onMore(category)}>MORE →</button>
            </div>
        </div>
    );
}

// key = matches the data-icon on the corresponding SVG <circle> below,
// so the connector line always finds and points to the correct icon —
// no angle math, so it is immune to any reordering/relayout.

const CONNECTOR_MAP = {
    power: {
        color: "#2f72df",
        side: "left",
        cls: "dcimx-c-power"
    },

    cooling: {
        color: "#2fa84f",
        side: "right",
        cls: "dcimx-c-cooling"
    },

    env: {
        color: "#ec6826",
        side: "right",
        cls: "dcimx-c-env",
        lineStart: { x: 650, y: 300 }
    },

    security: {
        color: "#159b8e",
        side: "right",
        cls: "dcimx-c-security",
        lineStart: { x: 650, y: 470 }
    },

    it: {
        color: "#5d3fc4",
        side: "bottom",
        cls: "dcimx-c-it"
    },

    network: {
        color: "#7047c9",
        side: "left",
        cls: "dcimx-c-network"
    },

    facility: {
        color: "#efa824",
        side: "left",
        cls: "dcimx-c-facility"
    },

    ops: {
        color: "#1695b8",
        side: "left",
        cls: "dcimx-c-ops"
    }
};
// ── HealthIndexChart (donut + connector lines + labels) ──
function HealthIndexChart({ onMore, scores, overall }) {
    const scalerRef = useRef(null);
    const stageRef = useRef(null);
    const groupRef = useRef(null);
    const [scale, setScale] = useState(1);

    const STAGE_W = 860;
    const STAGE_H = 680;

    // Live centre value: the calculated index, and every other tick one
    // point above it (91 → 92 → 91 …).
    const [liveTick, setLiveTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setLiveTick((t) => t + 1), LIVE_TICK_MS);
        return () => clearInterval(id);
    }, []);
    const baseIndex = overall == null ? null : Math.round(overall);
    const liveIndex = baseIndex == null ? null
        : baseIndex >= 100 ? (liveTick % 2 ? 99 : 100)
            : baseIndex + (liveTick % 2);
    const iconProps = (key) => ({
        className: "dcimx-ring-icon",
        role: "button",
        tabIndex: 0,
        "aria-label": `${ICON_CATEGORY[key]} — open parameters`,
        onClick: () => onMore(ICON_CATEGORY[key]),
        onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onMore(ICON_CATEGORY[key]); } },
    });

    // Draws every connector line + endpoint dot fresh on each pass.
    // Targets are read directly from the real DOM position of the icon
    // circle (via data-icon), NOT from trigonometry — immune to
    // reordering/relayout of the ring itself, and also immune to the
    // whole stage being shifted/scaled by a parent sidebar/tab shell,
    // because every coordinate is measured relative to `stage`'s own
    // current bounding box on every single call.
    function draw() {
        const stage = stageRef.current;
        const group = groupRef.current;
        if (!stage || !group) return;

        const sr = stage.getBoundingClientRect();
        // If the stage hasn't actually been laid out yet (e.g. parent
        // sidebar/tab shell still mounting), bail out quietly — a later
        // scheduled pass will pick it up once real dimensions exist.
        if (sr.width === 0 || sr.height === 0) return;

        group.innerHTML = "";

        Object.entries(CONNECTOR_MAP).forEach(([key, cfg]) => {
            const label = stage.querySelector("." + cfg.cls);
            const iconEl = stage.querySelector('[data-icon="' + key + '"]');
            if (!label || !iconEl) return;

            // Real on-screen center of the icon circle.
            const ir = iconEl.getBoundingClientRect();

            let targetX = (ir.left - sr.left) / scale + (ir.width / scale) / 2;
            let targetY = (ir.top - sr.top) / scale + (ir.height / scale) / 2;

            if (key === "power") {
                targetX += 10;
                targetY += 5;
            }
            if (key === "cooling") {
                targetX += 25;
                targetY += 5;
            }
            if (key === "env") {
                targetX += 10;
                targetY += 10;
            }
            if (key === "security") {
                targetX += 20;
                targetY += 0;
            }
            if (key === "it") {
                targetX += 10;
                targetY += 15;
            }
            if (key === "network") {
                targetX += 15;
                targetY += 0;
            }
            if (key === "ops") {
                targetX += 0;
                targetY += 0;
            }
            if (key === "facility") {
                targetX += 0;
                targetY += 15;
            }

            // Anchor the line start on the label's heading text only, so
            // it never crosses the description text below it.
            let startX, startY;

            if (cfg.lineStart) {
                // Line ki position text se independent rahegi
                startX = cfg.lineStart.x;
                startY = cfg.lineStart.y;

            } else if (cfg.side === "left") {
                // Screen px → stage units (÷ scale), same as the icon target
                // above, so the lines still meet their labels when the ring
                // is scaled down to fit a narrower screen.
                const nameEl = label.querySelector(".name") || label;
                const lr = nameEl.getBoundingClientRect();
                startX = (lr.right - sr.left) / scale;
                startY = (lr.top - sr.top + lr.height / 2) / scale;

            } else if (cfg.side === "right") {
                const nameEl = label.querySelector(".name") || label;
                const lr = nameEl.getBoundingClientRect();
                startX = (lr.left - sr.left) / scale;
                startY = (lr.top - sr.top + lr.height / 2) / scale;

            } else {
                const fullLr = label.getBoundingClientRect();
                startX = (fullLr.left - sr.left + fullLr.width / 2) / scale;
                startY = (fullLr.top - sr.top) / scale;
            }

            // Build the path "d" — ONE assignment only, based on side.
            let d;
            if (cfg.side === "left") {
                const elbowX = Math.min(startX + 90, targetX - 25);
                if (key === "facility") startY += 45;
                if (key === "ops") startY += 45;
                if (key === "network") startY += 45;
                d = `M ${startX} ${startY} H ${elbowX} L ${targetX} ${targetY}`;

            } else if (cfg.side === "right") {
                let elbowX;
                if (key === "env") elbowX = startX + 45;
                else if (key === "security") elbowX = startX;
                else if (key === "cooling") elbowX = startX - 45;
                else elbowX = Math.max(startX - 90, targetX + 25);
                d = `M ${startX} ${startY} H ${elbowX} L ${targetX} ${targetY}`;

            } else if (cfg.side === "bottom") {
                // Rise from the top of the label towards the icon (going
                // down first ran the line through the label's own heading).
                const elbowY = startY - 30;
                d = `M ${startX} ${startY} V ${elbowY} L ${targetX} ${targetY}`;
            }

            // Safety net: agar kisi wajah se d nahi bana, path skip kar do
            // (crash se better hai).
            if (!d) return;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            path.setAttribute("stroke", cfg.color);
            group.appendChild(path);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", targetX);
            circle.setAttribute("cy", targetY);
            circle.setAttribute("r", "4");
            circle.setAttribute("fill", cfg.color);
            group.appendChild(circle);
        });
    }

    // Runs draw() once now (rAF) and then again repeatedly over the
    // next ~2.4s. This "settle burst" absorbs late reflow caused by
    // the surrounding sidebar/tab shell — webfont swap (Exo 2 / Share
    // Tech Mono loading via @import), tab-switch transitions, sidebar
    // collapse/width animations — none of which necessarily trigger a
    // `stage` resize by themselves but can still shift where
    // labels/icons land on screen.
    function scheduleSettleRedraw() {
        const delays = [0, 30, 60, 100, 150, 220, 300, 400, 550, 700, 900, 1200, 1600, 2000, 2400];
        delays.forEach((ms) => {
            setTimeout(() => requestAnimationFrame(draw), ms);
        });
    }

    // Scale the whole 860x680 stage down (never up) to fit the actual
    // container width, so right-side labels/lines never get clipped.
    useEffect(() => {
        function updateScale() {
            const scaler = scalerRef.current;
            if (!scaler) return;
            const w = scaler.clientWidth;
            const s = Math.min(1, w / STAGE_W);
            setScale(s > 0 ? s : 1);
        }
        updateScale();
        window.addEventListener("resize", updateScale);
        let ro;
        if (window.ResizeObserver && scalerRef.current) {
            ro = new ResizeObserver(updateScale);
            ro.observe(scalerRef.current);
        }
        return () => {
            window.removeEventListener("resize", updateScale);
            if (ro) ro.disconnect();
        };
    }, []);

    useEffect(() => {
        scheduleSettleRedraw();

        // Also redraw once webfonts used by the surrounding shell have
        // actually finished loading/swapping — that's a classic cause
        // of "line is fine, then jumps a few px after a second."
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => scheduleSettleRedraw()).catch(() => { });
        }

        const onWindowChange = () => scheduleSettleRedraw();
        window.addEventListener("load", onWindowChange);
        window.addEventListener("resize", onWindowChange);
        // capture:true so a scroll on the sidebar / tab-content wrapper
        // (not just window) also triggers a redraw.
        window.addEventListener("scroll", onWindowChange, true);

        // Sidebar collapse, tab-switch fades, width transitions etc. in
        // the parent shell fire transitionend/animationend that bubble
        // up to document — use that as a redraw trigger too.
        document.addEventListener("transitionend", onWindowChange, true);
        document.addEventListener("animationend", onWindowChange, true);

        let roStage, roBody;
        if (window.ResizeObserver) {
            if (stageRef.current) {
                roStage = new ResizeObserver(onWindowChange);
                roStage.observe(stageRef.current);
            }
            // Observing the whole document body catches sidebar
            // collapse / width changes that never resize `stage`
            // itself but do move it around on screen.
            roBody = new ResizeObserver(onWindowChange);
            roBody.observe(document.body);
        }

        return () => {
            window.removeEventListener("load", onWindowChange);
            window.removeEventListener("resize", onWindowChange);
            window.removeEventListener("scroll", onWindowChange, true);
            document.removeEventListener("transitionend", onWindowChange, true);
            document.removeEventListener("animationend", onWindowChange, true);
            if (roStage) roStage.disconnect();
            if (roBody) roBody.disconnect();
        };
    }, [scale]);

    return (
        <section className="dcimx-health-card">
            <div
                className="dcimx-health-scaler"
                ref={scalerRef}
                style={{ height: STAGE_H * scale }}
            >
                <div
                    className="dcimx-health-stage"
                    ref={stageRef}
                    style={{
                        width: STAGE_W,
                        height: STAGE_H,
                        transform: `translateX(-50%) scale(${scale})`,
                        transformOrigin: "top center",
                    }}
                >
                    <svg className="dcimx-connector-svg" aria-hidden="true"><g ref={groupRef} /></svg>

                    <svg className="dcimx-health-svg" viewBox="0 0 510 510" aria-label="DCIM Health Index">
                        <defs>
                            <filter id="dcimx-shadow" x="-30%" y="-30%" width="160%" height="160%">
                                <feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity=".13" />
                            </filter>
                        </defs>
                        <g transform="translate(255 255)">
                            <path d="M0 0 L-89.93 -217.11 A235 235 0 0 1 89.93 -217.11 Z" fill="#2f72df" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L89.93 -217.11 A235 235 0 0 1 217.11 -89.93 Z" fill="#2fa84f" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L217.11 -89.93 A235 235 0 0 1 217.11 89.93 Z" fill="#ec6826" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L217.11 89.93 A235 235 0 0 1 89.93 217.11 Z" fill="#159b8e" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L89.93 217.11 A235 235 0 0 1 -89.93 217.11 Z" fill="#5d3fc4" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L-89.93 217.11 A235 235 0 0 1 -217.11 89.93 Z" fill="#7047c9" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L-217.11 89.93 A235 235 0 0 1 -217.11 -89.93 Z" fill="#efa824" stroke="#fff" strokeWidth="5" />
                            <path d="M0 0 L-217.11 -89.93 A235 235 0 0 1 -89.93 -217.11 Z" fill="#1695b8" stroke="#fff" strokeWidth="5" />
                            <circle cx="0" cy="0" r="149" fill="#fff" />
                            <g filter="url(#dcimx-shadow)">
                                <circle data-icon="power" {...iconProps("power")} cx="0" cy="-199" r="34" fill="#1760d1" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.power} — click for parameters</title></circle>
                                <circle data-icon="cooling" {...iconProps("cooling")} cx="141" cy="-141" r="34" fill="#2ca544" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.cooling} — click for parameters</title></circle>
                                <circle data-icon="env" {...iconProps("env")} cx="199" cy="0" r="34" fill="#ec6826" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.env} — click for parameters</title></circle>
                                <circle data-icon="security" {...iconProps("security")} cx="141" cy="141" r="34" fill="#159b8e" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.security} — click for parameters</title></circle>
                                <circle data-icon="it" {...iconProps("it")} cx="0" cy="199" r="34" fill="#5d3fc4" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.it} — click for parameters</title></circle>
                                <circle data-icon="network" {...iconProps("network")} cx="-141" cy="141" r="34" fill="#7047c9" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.network} — click for parameters</title></circle>
                                <circle data-icon="facility" {...iconProps("facility")} cx="-199" cy="0" r="34" fill="#efa824" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.facility} — click for parameters</title></circle>
                                <circle data-icon="ops" {...iconProps("ops")} cx="-141" cy="-141" r="34" fill="#1695b8" stroke="#fff" strokeWidth="5"><title>{ICON_CATEGORY.ops} — click for parameters</title></circle>
                            </g>
                            <g fill="#fff" fontSize="28" fontFamily="Arial" textAnchor="middle" dominantBaseline="middle" fontWeight="700" style={{ pointerEvents: "none" }}>
                                <text x="0" y="-199">ϟ</text>
                                <text x="141" y="-141">❄</text>
                                <text x="199" y="0">♧</text>
                                <text x="141" y="141">♢</text>
                                <text x="0" y="199">▤</text>
                                <text x="-141" y="141">⌘</text>
                                <text x="-199" y="0">▥</text>
                                <text x="-141" y="-141">⚙</text>
                            </g>
                        </g>
                    </svg>

                    <div className="dcimx-center">
                        <div className="title">DCIM HEALTH INDEX</div>
                        <div key={liveIndex} className="number tick">{showScore(liveIndex)}<span>%</span></div>
                        <div className="excellent" style={{ background: statusOf(liveIndex).color }}>{statusOf(liveIndex).label}</div>
                    </div>

                    <CategoryLabel posClass="dcimx-c-power" name="POWER HEALTH" score={showScore(scores["Power Health"])}
                        desc={<>Power availability,<br />UPS, Generators,<br />PDUs, Power quality</>}
                        category="Power Health" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-cooling" name="COOLING HEALTH" score={showScore(scores["Cooling Health"])}
                        desc={<>CRAC/AC, Chillers,<br />AHU, Cooling distribution</>}
                        category="Cooling Health" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-ops" name="DC OPERATIONS" score={showScore(scores["DC Operations"])}
                        desc={<>Processes, SOPs,<br />Compliance, Team<br />Efficiency</>}
                        category="DC Operations" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-env" name={<>ENVIRONMENT<br />HEALTH</>} score={showScore(scores["Environment Health"])}
                        desc={<>Temperature, Humidity,<br />Airflow, Pressure,<br />Water Leak</>}
                        category="Environment Health" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-facility" name="FACILITY HEALTH" score={showScore(scores["Facility Health"])}
                        desc={<>Electrical, Plumbing,<br />Fire Systems,<br />Building Fabric</>}
                        category="Facility Health" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-security" name="SECURITY HEALTH" score={showScore(scores["Security Health"])}
                        desc={<>Access Control, CCTV,<br />Fire Safety, Intrusion<br />Detection</>}
                        category="Security Health" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-network" name="NETWORK HEALTH" score={showScore(scores["Network Health"])}
                        desc={<>Network Availability,<br />Bandwidth, Latency,<br />Devices</>}
                        category="Network Health" onMore={onMore} />
                    <CategoryLabel posClass="dcimx-c-it" name="IT INFRA HEALTH" score={showScore(scores["IT Infrastructure Health"])}
                        desc={<>Servers, Storage, Virtualization,<br />Applications</>}
                        category="IT Infrastructure Health" onMore={onMore} />
                </div>
            </div>
        </section>
    );
}

// ── AlertSummaryPanel ──
function AlertSummaryPanel() {
    return (
        <section className="dcimx-panel">
            <h3>ALERT SUMMARY</h3>
            <div className="dcimx-alerts">
                <div className="dcimx-alert dcimx-critical"><div className="n">{ALARM_SUMMARY.critical}</div><div className="l">CRITICAL</div></div>
                <div className="dcimx-alert dcimx-major"><div className="n">{ALARM_SUMMARY.major}</div><div className="l">MAJOR</div></div>
                <div className="dcimx-alert dcimx-minor"><div className="n">{ALARM_SUMMARY.minor}</div><div className="l">MINOR</div></div>
            </div>
        </section>
    );
}

// ── OpenTicketsPanel ──
// Live from the shared ticket store: this month's tickets plus any raised
// since (e.g. by a failure in the 5D View simulation). "Pending" = Open.
function OpenTicketsPanel() {
    const navigate = useNavigate();
    const c = ticketCounts(useTicketStore((s) => s.tickets));
    return (
        <section className="dcimx-panel">
            <h3>OPEN TICKETS</h3>
            <div className="dcimx-ticket-grid">
                <div className="dcimx-ticket"><div className="ti" style={{ color: "#1759c7" }}>◇</div><div className="tn">{c.total}</div><div className="tl">TOTAL</div></div>
                <div className="dcimx-ticket"><div className="ti" style={{ color: "#ee8610" }}>◌</div><div className="tn">{c.inProgress}</div><div className="tl">IN PROGRESS</div></div>
                <div className="dcimx-ticket"><div className="ti" style={{ color: "#ee8610" }}>◷</div><div className="tn">{c.open}</div><div className="tl">PENDING</div></div>
                <div className="dcimx-ticket"><div className="ti" style={{ color: "#159447" }}>✓</div><div className="tn">{c.resolved + c.closed}</div><div className="tl">RESOLVED</div></div>
            </div>
            <a className="dcimx-ticket-link" href="/ticket" onClick={(e) => { e.preventDefault(); navigate("/ticket"); }}>VIEW ALL TICKETS →</a>
        </section>
    );
}

// ── LiveAlarmsPanel ──
function LiveAlarmsPanel() {
    return (
        <section className="dcimx-panel dcimx-live-panel">
            <div className="dcimx-live-head"><h3>LIVE ALARMS</h3></div>
            <div>
                {ALARMS.map((a, i) => (
                    <div className="dcimx-alarm" key={i} title={`${a.code} · ${a.title} — ${a.detail}`}>
                        <div className="an"><span className="dcimx-alarm-dot" style={{ background: a.color }} /><span>{a.title}</span></div>
                        <div className="ad">{a.code}</div>
                        <div className="at">{a.time}</div>
                    </div>
                ))}
            </div>
            <a className="dcimx-live-link" href="#!">VIEW ALL ALARMS →</a>
        </section>
    );
}

// ── SidePanels (stack of the three right-hand panels) ──
function SidePanels() {
    return (
        <aside className="dcimx-side">
            <AlertSummaryPanel />
            <OpenTicketsPanel />
            <LiveAlarmsPanel />
        </aside>
    );
}

// ── StatsSection (bottom 6 KPI cards) ──
function StatsSection() {
    const n = (v) => v.toLocaleString("en-IN");
    const stats = [
        {
            icon: "▤", bg: "#1759c7", value: n(DCIM.totalAssets), name: "TOTAL ASSETS",
            detail: [["Floor", n(DCIM.floorDevices), "#1759c7"], ["In-rack", n(DCIM.inRackItems), "#5b3fc2"]]
        },
        {
            icon: "◉", bg: "#159447", value: n(DCIM.servers), name: "IT ASSETS",
            detail: [["Healthy", n(SERVERS_HEALTHY), "#159447"], ["Warning", n(SERVERS_ALARMED), SEVERITY_COLOR.major]]
        },
        {
            icon: "⌘", bg: "#5b3fc2", value: n(DCIM.networkDevices), name: "NETWORK DEVICES",
            detail: [["Floor", n(DCIM.floorNetworkActive), "#159447"], ["In-rack", n(DCIM.rackSwitches), "#159447"]]
        },
        {
            icon: "ϟ", bg: "#ef8b0a", value: `${SHOW.powerPct}%`, name: "POWER CAPACITY",
            detail: [[null, `${Math.round(DCIM.itKw)} kW of ${DCIM.itBudgetKw} kW`, null]]
        },
        {
            icon: "❄", bg: "#2165c5", value: `${SHOW.coolingPct}%`, name: "COOLING CAPACITY",
            detail: [["Free", `${SHOW.coolingFreePct}%`, "#159447"], ["Used", `${SHOW.coolingPct}%`, "#e98710"]]
        },
        {
            icon: "↗", bg: "#e3343f", value: SHOW.pue.toFixed(2), name: "AVERAGE PUE",
            detail: [["Target", `≤ ${SHOW.pueTarget.toFixed(2)}`, null]]
        },
    ];
    return (
        <section className="dcimx-stats">
            {stats.map((s, i) => (
                <div className="dcimx-stat" key={i}>
                    <div className="dcimx-stat-head">
                        <div className="dcimx-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                        <div>
                            <div className="dcimx-stat-value">{s.value}</div>
                            <div className="dcimx-stat-name">{s.name}</div>
                        </div>
                    </div>
                    <div className="dcimx-stat-detail">
                        {s.detail.map(([label, value, color], di) => (
                            <div key={di}>
                                {label}
                                <b style={color ? { color } : undefined}>{value}</b>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}

// ── ParameterModal ("MORE" click → Excel parameter table) ──
function ParameterModal({ category, overrides, onActualChange, onReset, onClose }) {
    if (!category) return null;

    const { rows, weightSum, score: categoryScore } = categoryResult(category, overrides);
    const status = statusOf(categoryScore);
    const edited = rows.some((r) => Object.prototype.hasOwnProperty.call(overrides, r.p.id));

    const modalUI = (
        <div
            className="dcimx-overlay show"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="dcimx-modal">

                {/* ================= HEADER ================= */}
                <div className="dcimx-modal-top">
                    <div>
                        <h2>
                            {category.toUpperCase()} — PARAMETERS
                        </h2>

                        <p>
                            {DESC[category] ||
                                "Excel-defined health parameters"}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="dcimx-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* ================= SCORE ================= */}
                <div className="dcimx-modal-score">

                    <div className="dcimx-big-score">
                        {categoryScore == null ? "—" : categoryScore.toFixed(1)}
                        <span>/100</span>
                    </div>

                    <span
                        className="dcimx-status-tag"
                        style={{
                            background: status.color,
                        }}
                    >
                        {status.label}
                    </span>

                    {edited && (
                        <button
                            type="button"
                            onClick={onReset}
                            style={{ border: "1px solid #cbd5e2", background: "#fff", borderRadius: 16, padding: "4px 12px", fontSize: 10, fontWeight: 800, color: "#1559c5", cursor: "pointer" }}
                        >
                            RESET TO CALCULATED VALUES
                        </button>
                    )}

                </div>

                {/* ================= TABLE ================= */}
                <div className="dcimx-table-box">

                    <table>

                        <thead>
                            <tr>
                                <th style={{ width: "34px" }}>
                                    ID
                                </th>

                                <th style={{ width: "150px" }}>
                                    SUB-PARAMETER
                                </th>

                                <th style={{ width: "50px" }}>
                                    UNIT
                                </th>

                                <th style={{ width: "68px" }}>
                                    DIRECTION
                                </th>

                                <th style={{ width: "56px" }}>
                                    TARGET
                                </th>

                                <th style={{ width: "56px" }}>
                                    WORST
                                </th>

                                <th style={{ width: "56px" }}>
                                    WEIGHT
                                </th>

                                <th style={{ width: "90px" }}>
                                    ACTUAL VALUE
                                </th>

                                <th style={{ width: "56px" }}>
                                    SCORE
                                </th>

                                <th style={{ width: "90px" }}>
                                    WEIGHTED SCORE
                                </th>

                                <th style={{ width: "260px" }}>
                                    CALCULATION / SOURCE
                                </th>

                                <th style={{ width: "170px" }}>
                                    FREQUENCY
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {rows.map(({ p, actual, score }) => {

                                // Share of the category score: the weighted
                                // scores of a category add up to its score.
                                const weightedScore =
                                    score == null || !weightSum
                                        ? "—"
                                        : (
                                            (score *
                                                Number(p.weight)) /
                                            weightSum
                                        ).toFixed(2);

                                const src = HEALTH_ACTUALS[p.id]?.src || "";
                                const from5D = src.startsWith("5D");
                                const srcText = src.replace(/^(5D|ops):?\s*/, "");

                                return (
                                    <tr key={p.id}>

                                        {/* ID */}
                                        <td>
                                            {p.id}
                                        </td>

                                        {/* PARAMETER */}
                                        <td>
                                            <b>{p.name}</b>
                                        </td>

                                        {/* UNIT */}
                                        <td>
                                            {p.unit}
                                        </td>

                                        {/* DIRECTION */}
                                        <td>
                                            {p.direction}
                                        </td>

                                        {/* TARGET */}
                                        <td>
                                            {fmt(p.target)}
                                        </td>

                                        {/* WORST */}
                                        <td>
                                            {fmt(p.worst)}
                                        </td>

                                        {/* WEIGHT */}
                                        <td>
                                            {fmt(p.weight)}%
                                        </td>

                                        {/* ACTUAL VALUE */}
                                        <td>
                                            <input
                                                className="dcimx-actual-input"
                                                type="number"
                                                step="any"
                                                placeholder="Enter"
                                                value={
                                                    actual ?? ""
                                                }
                                                onChange={(e) => {

                                                    const value =
                                                        e.target.value === ""
                                                            ? null
                                                            : Number(
                                                                e.target.value
                                                            );

                                                    onActualChange(p.id, value);
                                                }}
                                            />
                                        </td>

                                        {/* SCORE */}
                                        <td
                                            style={{
                                                color: scoreColor(score),
                                                fontWeight: 900,
                                            }}
                                        >
                                            {score == null
                                                ? "—"
                                                : score.toFixed(1)}
                                        </td>

                                        {/* WEIGHTED SCORE */}
                                        <td
                                            style={{
                                                fontWeight: 800,
                                            }}
                                        >
                                            {weightedScore}
                                        </td>

                                        {/* CALCULATION */}
                                        <td className="dcimx-calc">
                                            {p.calculation}
                                            <span className={`dcimx-src ${from5D ? "d5" : "ops"}`}>
                                                {from5D ? "5D View · " : "Demo input"}{from5D ? srcText : (srcText ? ` · ${srcText}` : "")}
                                            </span>
                                        </td>

                                        {/* FREQUENCY */}
                                        <td className="dcimx-muted">
                                            {p.frequency}
                                        </td>

                                    </tr>
                                );
                            })}

                            <tr className="dcimx-total-row">
                                <td colSpan={6}>CATEGORY SCORE = Σ(score × weight) ÷ Σ weight</td>
                                <td>{weightSum}%</td>
                                <td />
                                <td />
                                <td style={{ color: status.color }}>
                                    {categoryScore == null ? "—" : categoryScore.toFixed(2)}
                                </td>
                                <td colSpan={2} className="dcimx-muted">
                                    The DCIM Health Index is the mean of the eight category scores.
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

                {/* ================= NOTE ================= */}
                <div className="dcimx-modal-note">

                    <b>Excel mapping:</b>{" "}
                    Sub-parameters, Direction, Target, Worst and Weight are
                    loaded directly from the Input sheet.

                    {" "}
                    Actual values marked <b>5D View</b> are calculated from the
                    5D View ({DCIM.racksTotal} racks, {DCIM.floorDevices} floor
                    devices); the rest are demo operating inputs.

                    {" "}
                    Score runs linearly from Worst (0) to Target (100). Edit
                    any Actual Value to recalculate this category and the DCIM
                    Health Index.

                </div>

            </div>
        </div>
    );

    /*
     * IMPORTANT:
     * Render modal directly inside document.body.
     * This makes it independent from DCIMDashboard2,
     * sidebar, navbar, overflow and stacking contexts.
     */
    return createPortal(
        modalUI,
        document.body
    );
}

// ══════════════════════════════════════════
//  DCIMDashboard2 — used inside SmartCityDashboard's
//  sidebar/tab shell (as the "DCIM" tab)
// ══════════════════════════════════════════
export default function DCIMDashboard2() {
    const [modalCategory, setModalCategory] = useState(null);
    // Actual values the user typed into the parameter table (id → value).
    const [overrides, setOverrides] = useState({});
    const health = useMemo(() => computeHealth(overrides), [overrides]);

    useEffect(() => {
        function onKey(e) { if (e.key === "Escape") setModalCategory(null); }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const resetCategory = () => {
        setOverrides((prev) => {
            const next = { ...prev };
            EXCEL_PARAMS.filter((p) => p.category === modalCategory).forEach((p) => { delete next[p.id]; });
            return next;
        });
    };

    return (
        <div className="dcimx-app">
            <style>{CSS}</style>
            <main className="dcimx-main">
                <div className="dcimx-body-grid">
                    <HealthIndexChart onMore={setModalCategory} scores={health.scores} overall={health.overall} />
                    <SidePanels />
                </div>
                <StatsSection />
            </main>
            <ParameterModal
                category={modalCategory}
                overrides={overrides}
                onActualChange={(id, value) => setOverrides((prev) => ({ ...prev, [id]: value }))}
                onReset={resetCategory}
                onClose={() => setModalCategory(null)}
            />
        </div>
    );
}
