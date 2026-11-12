// src/api/discoveryApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Protocol Discovery Service — client (STATIC DATA).
// Used only by the Discovery Tool page (src/pages/DiscoveryTool.jsx).
//
//   Static   : every call below is answered in the browser by
//              src/staticData/services/discovery.js — no server, no .env.
//
//   Endpoint                               What it does
//   GET    /                               service name, version and status
//   GET    /api/db/health                  can the service reach the Device Management DB
//   GET    /api/discovery/targets          step 1  – devices in Device Management that can be discovered
//   POST   /api/discovery/probe            step 2  – which protocol (Modbus / SNMP / BACnet) answers on an IP
//   POST   /api/discovery/modbus/units     step 2b – Modbus only: find the slave (unit) IDs, one block per call
//   POST   /api/discovery/read             step 3  – read every point (name, scaled value, unit, group)
//   POST   /api/discovery/bind             step 4  – onboard the device into the gateway
//   POST   /api/discovery/verify           step 5  – read live values straight from the device after bind
//   GET    /api/discovery/profiles         models that already have a register map (DB first, then built-in)
//   POST   /api/gateway/restart            restart the gateway by hand
//   GET    /api/gateway/registry           BACnet devices this service has onboarded
//   DELETE /api/gateway/registry/{ip}      remove a device from that registry (gateway config is rewritten)
//   GET    /api/mib/resolve?oid=…          what an SNMP OID means (name, unit, scale, phase)
// ─────────────────────────────────────────────────────────────────────────────
import axios from "axios";
import { toEnglish } from "./discoveryText";
import { createStaticClient } from "../staticData";

// Label only (shown nowhere as a link) — there is no remote service.
export const DISCOVERY_API_URL = "static://protocol-discovery";

// The guide asks for at least 5 minutes: an SNMP read walks the whole device (2–3 min).
export const LONG_TIMEOUT_MS = 5 * 60 * 1000;
const SHORT_TIMEOUT_MS = 60 * 1000;

const client = createStaticClient("discovery", {
  timeout: LONG_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

// The request models give unit_id / community non-null defaults (unit_id: int = 1,
// community: str = "public"), so sending null fails validation (422). Empty
// fields are left out and the service fills in its own defaults.
export const compact = (body) =>
  Object.fromEntries(Object.entries(body || {}).filter(([, v]) => v !== null && v !== undefined && v !== ""));

const STATUS_HINT = {
  400: "The service rejected the request.",
  404: "No register profile was found for this Modbus model. Turn on inference and read again.",
  422: "Some request fields are not valid.",
  500: "The Protocol Service hit an internal error. If it keeps happening, contact support.",
  502: "The service could not connect to the device. Check its power, network cable and IP address, then retry.",
  503: "The Protocol Service is not available right now. Try again shortly.",
  504: "The request timed out at the proxy before the device finished answering.",
  524: "Cloudflare closed the request after about 100 seconds, before the device finished answering.",
};

// FastAPI puts the reason in `detail`: a string (400 / 404 / 502) or a list (422 validation).
function detailText(data) {
  const d = data?.detail ?? data?.message;
  if (Array.isArray(d)) {
    return d
      .map((x) => {
        const where = Array.isArray(x?.loc) ? x.loc.filter((p) => p !== "body").join(".") : "";
        return where ? `${where}: ${x?.msg}` : x?.msg || JSON.stringify(x);
      })
      .join("; ");
  }
  if (d && typeof d === "object") return JSON.stringify(d);
  if (typeof d === "string" && d.trim()) return d.trim();
  if (typeof data === "string" && data.trim() && !/^\s*</.test(data)) return data.trim().slice(0, 300);
  return "";
}

// Every failed call rejects with { status, message, hint, data?, cancelled?, network?, timeout? }.
export function toDiscoveryError(error, startedAt) {
  const elapsedMs = startedAt ? Date.now() - startedAt : 0;
  if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
    return { cancelled: true, status: 0, message: "Request cancelled.", hint: "", elapsedMs };
  }
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    const secs = Math.round((error?.config?.timeout || LONG_TIMEOUT_MS) / 1000);
    return {
      status: 0, timeout: true, elapsedMs,
      message: `No answer from the Protocol Service within ${secs} seconds.`,
      hint: "The device may be slow or unreachable. Increase the timeout and retry.",
    };
  }
  if (!error?.response) {
    // A Cloudflare 524 page carries no CORS headers, so the browser reports it as a network error.
    const longRun = elapsedMs > 90 * 1000;
    return {
      status: 0, network: true, elapsedMs,
      message: "Cannot reach the Protocol Service.",
      hint: longRun
        ? "The connection closed after about 100 seconds, which is the time limit of the proxy in front of the service. Retry; if it keeps happening, the proxy timeout needs to be raised for long device reads."
        : "Check the network connection, then retry.",
    };
  }
  const { status, data } = error.response;
  // The service writes `detail` in Hinglish; only English text is shown, otherwise the status message.
  const detail = toEnglish(detailText(data), "");
  return {
    status, data, elapsedMs,
    message: detail || STATUS_HINT[status] || `Request failed (HTTP ${status}).`,
    hint: detail ? STATUS_HINT[status] || "" : "",
  };
}

async function call(method, url, { data, params, signal, timeout } = {}) {
  const startedAt = Date.now();
  try {
    const res = await client.request({ method, url, data, params, signal, timeout });
    return res.data;
  } catch (e) {
    throw toDiscoveryError(e, startedAt);
  }
}

const short = (opts) => ({ timeout: SHORT_TIMEOUT_MS, ...opts });

// Every function takes an optional { signal } (AbortController) so the page can cancel it.
export const discoveryApi = {
  /** GET / → { service, version, status, docs, discovery_flow[] } */
  serviceInfo: (opts) => call("get", "/", short(opts)),

  /** GET /api/db/health → { connected, message } */
  dbHealth: (opts) => call("get", "/api/db/health", short(opts)),

  /** GET /api/discovery/targets → { count, targets[], schema_ready, schema_note } */
  targets: (opts) => call("get", "/api/discovery/targets", short(opts)),

  /** POST /api/discovery/probe  body { ip, check?, community?, modbus_port?, snmp_timeout?, bacnet_timeout? }
   *  → { ip, duration_seconds, protocols[], detected_count, recommended, message } */
  probe: (body, opts) => call("post", "/api/discovery/probe", { data: compact(body), ...opts }),

  /** POST /api/discovery/modbus/units  body { ip, port?, start?, end?, probe_address?, timeout? }
   *  → { scanned_range, scanned, found[], next_step, message }. Call it one block (≤ 32 IDs) at a time. */
  scanUnits: (body, opts) => call("post", "/api/discovery/modbus/units", { data: compact(body), ...opts }),

  /** POST /api/discovery/read  body { ip, protocol, port?, unit_id?, community?, model?, model_specification_id?, infer? }
   *  → { ip, protocol, port, read_at, source, points[], summary, notes[], warnings[], next_step, … } */
  read: (body, opts) => call("post", "/api/discovery/read", { data: compact(body), ...opts }),

  /** POST /api/discovery/bind  body { ip, device_name, protocol, port?, unit_id?, community?, model?,
   *  model_specification_id?, selected_keys?, device_detail_id?, restart_gateway? }
   *  → { success, device_name, timeseries_onboarded, attributes_onboarded, reused_scan, discovery_status_saved, next_step, message, … } */
  bind: (body, opts) => call("post", "/api/discovery/bind", { data: compact(body), ...opts }),

  /** POST /api/discovery/verify  body = same as read → read response + { verified, live_point_count, message } */
  verify: (body, opts) => call("post", "/api/discovery/verify", { data: compact(body), ...opts }),

  /** GET /api/discovery/profiles → { count, profiles[], note } */
  profiles: (opts) => call("get", "/api/discovery/profiles", short(opts)),

  /** POST /api/gateway/restart (no body) */
  restartGateway: (opts) => call("post", "/api/gateway/restart", { ...opts }),

  /** GET /api/gateway/registry → { count, devices } */
  registry: (opts) => call("get", "/api/gateway/registry", short(opts)),

  /** DELETE /api/gateway/registry/{ip} */
  removeFromRegistry: (ip, opts) => call("delete", `/api/gateway/registry/${encodeURIComponent(ip)}`, { ...opts }),

  /** GET /api/mib/resolve?oid=… → name, unit, scale, phase of one OID */
  resolveOid: (oid, opts) => call("get", "/api/mib/resolve", short({ params: { oid }, ...opts })),
};

export default discoveryApi;
