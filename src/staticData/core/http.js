// ─────────────────────────────────────────────────────────────────────────────
// Static data layer — request router
//
// This portal runs entirely on static, in-browser data. There is no backend,
// no API server and nothing is read from .env. Every axios client in the app
// (see /config.js) is created with `staticAdapter(...)`, and the few places
// that used fetch() call `staticFetch(...)` instead. Both hand the request to
// the route table of a local "service" (src/staticData/services/*), which
// answers from the static data in src/staticData/seed/*.
//
// Nothing ever leaves the browser: no XHR / fetch request is made.
// Changes made on screen (add / edit / delete) are kept in memory for the
// current browser tab and reset to the static data on page reload.
// ─────────────────────────────────────────────────────────────────────────────
import { AxiosError } from "axios";

const SIMULATED_LATENCY_MS = 120; // keeps the loading spinners natural

const services = Object.create(null);

export function registerService(name, routes) {
  services[name] = routes;
}

// ── route helpers ────────────────────────────────────────────────────────────
// route("GET", "/Country/get-country", handler)
// route("POST", "/Rack/:id/update-rack", handler)          → ctx.match.id
// route("GET", /^\/state\/remove-state(\d+)$/i, handler)    → ctx.match[1]
export function route(method, pattern, handler) {
  let regex = pattern;
  let keys = [];
  if (typeof pattern === "string") {
    const src = pattern
      .replace(/\/+$/, "")
      .replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === ":" ? c : "\\" + c))
      .replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      });
    regex = new RegExp("^" + (src.startsWith("/") ? src : "/" + src) + "/?$", "i");
  }
  return { method: method.toUpperCase(), regex, keys, handler };
}

export const reply = (status, data, headers = {}) => ({ __reply: true, status, data, headers });
export const ok = (data, headers) => reply(200, data, headers);
export const created = (data) => reply(201, data);
export const noContent = () => reply(204, "");
export const badRequest = (message, extra = {}) => reply(400, { status: false, message, ...extra });
export const notFound = (message = "Record not found") => reply(404, { status: false, message });

// ── URL / body parsing ───────────────────────────────────────────────────────
function normalizePath(p) {
  const s = "/" + String(p || "").replace(/^\/+/, "");
  return s.replace(/\/+$/, "") || "/";
}

export function splitUrl(rawUrl = "") {
  let u = String(rawUrl ?? "");
  const abs = u.match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*(.*)$/i);
  if (abs) u = abs[1] || "/";
  const qi = u.indexOf("?");
  const path = qi >= 0 ? u.slice(0, qi) : u;
  const params = {};
  if (qi >= 0) new URLSearchParams(u.slice(qi + 1)).forEach((v, k) => { params[k] = v; });
  return { path: normalizePath(path), params };
}

const camel = (k) => (k ? k.charAt(0).toLowerCase() + k.slice(1) : k);

// "ContactPersons[0].UserName" → body.contactPersons[0].userName
function setDeep(target, key, value) {
  const parts = [];
  key.replace(/([^.[\]]+)|\[(\d+)\]/g, (_, name, idx) => {
    parts.push(idx !== undefined ? Number(idx) : camel(name));
    return "";
  });
  let cur = target;
  parts.forEach((p, i) => {
    const last = i === parts.length - 1;
    if (last) {
      if (cur[p] === undefined) cur[p] = value;
      else if (Array.isArray(cur[p])) cur[p].push(value);
      else cur[p] = [cur[p], value];
      return;
    }
    if (cur[p] === undefined || cur[p] === null || typeof cur[p] !== "object") {
      cur[p] = typeof parts[i + 1] === "number" ? [] : {};
    }
    cur = cur[p];
  });
}

export function formDataToObject(fd) {
  const out = {};
  fd.forEach((value, key) => setDeep(out, key, value));
  return out;
}

function parseBody(data) {
  if (data === undefined || data === null || data === "") return undefined;
  if (typeof FormData !== "undefined" && data instanceof FormData) return formDataToObject(data);
  if (typeof URLSearchParams !== "undefined" && data instanceof URLSearchParams) {
    const o = {};
    data.forEach((v, k) => { o[k] = v; });
    return o;
  }
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return data; }
  }
  return data;
}

// case-insensitive query/body param lookup: q("page") finds Page / page / PAGE
export function makeParamReader(params) {
  const lower = {};
  Object.keys(params || {}).forEach((k) => { lower[k.toLowerCase()] = params[k]; });
  return (name, fallback) => {
    const v = lower[String(name).toLowerCase()];
    return v === undefined || v === null || v === "" ? fallback : v;
  };
}

// ── dispatcher ───────────────────────────────────────────────────────────────
export async function dispatch(serviceName, { method = "GET", url = "", params = {}, data, responseType } = {}) {
  const table = services[serviceName];
  const { path, params: urlParams } = splitUrl(url);
  const allParams = { ...urlParams };
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) allParams[k] = v; });
  const m = String(method || "GET").toUpperCase();
  const body = parseBody(data);

  if (SIMULATED_LATENCY_MS) await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

  if (!table) return reply(503, { status: false, message: `Static service "${serviceName}" is not registered.` });

  for (const r of table) {
    if (r.method !== m && !(r.method === "ANY")) continue;
    const hit = path.match(r.regex);
    if (!hit) continue;
    const match = Object.assign([...hit], {});
    r.keys.forEach((k, i) => { match[k] = decodeURIComponent(hit[i + 1]); });
    const ctx = {
      method: m, path, params: allParams, q: makeParamReader(allParams),
      body: body ?? {}, rawBody: data, match, responseType,
    };
    try {
      const res = await r.handler(ctx);
      if (res && res.__reply) return res;
      return ok(res === undefined ? { status: true, message: "Success" } : res);
    } catch (err) {
      console.error(`[static ${serviceName}] ${m} ${path} failed`, err);
      return reply(500, { status: false, message: err?.message || "Static data error" });
    }
  }
  console.warn(`[static ${serviceName}] no static route for ${m} ${path}`);
  return notFound(`No static data for ${m} ${path}`);
}

// ── axios adapter ────────────────────────────────────────────────────────────
export function staticAdapter(serviceName) {
  return async function staticAxiosAdapter(config) {
    const res = await dispatch(serviceName, {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
      responseType: config.responseType,
    });
    const response = {
      data: res.data,
      status: res.status,
      statusText: res.status < 400 ? "OK" : "Error",
      headers: { "content-type": res.headers?.["content-type"] || "application/json", ...(res.headers || {}) },
      config,
      request: { responseURL: config.url, static: true },
    };
    const validate = config.validateStatus || ((s) => s >= 200 && s < 300);
    if (validate(response.status)) return response;
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response
    );
  };
}

// ── fetch() replacement ──────────────────────────────────────────────────────
// Returns a real Response object, so .ok / .status / .json() / .text() / .blob()
// behave exactly as with the browser fetch.
export function staticFetch(serviceName) {
  return async function fetchStatic(url, init = {}) {
    const res = await dispatch(serviceName, {
      method: init.method || "GET",
      url: typeof url === "string" ? url : url?.url,
      data: init.body,
    });
    const isBinary = typeof Blob !== "undefined" && res.data instanceof Blob;
    const isText = typeof res.data === "string";
    const bodyOut = isBinary || isText ? res.data : JSON.stringify(res.data ?? null);
    const status = res.status === 204 ? 200 : res.status;
    return new Response(bodyOut, {
      status,
      headers: { "Content-Type": res.headers?.["content-type"] || (isText ? "text/plain" : "application/json") },
    });
  };
}
