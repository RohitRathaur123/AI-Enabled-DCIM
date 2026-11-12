// ═══════════════════════════════════════════════════════════════════════════
// ticketStore.js — one live ticket list for the whole portal
// ---------------------------------------------------------------------------
// Ticket Management, the Dashboard's open-ticket counts, the header's ticket
// alert switch, the bottom-right ticket toasts and the 5D View simulation all
// read and write this one store, so a ticket raised in the 5D View shows up
// everywhere at once.
//
// It starts from this month's 24 tickets (dcimDashboardData.js). Everything
// that happens after that — tickets raised by the 5D View simulation or by
// hand, reassignments, status changes, deletions — is kept in localStorage
// as a small "delta", so it survives a page reload while the seed list keeps
// its dates current.
// ═══════════════════════════════════════════════════════════════════════════
import { useSyncExternalStore } from "react";
import { TICKET_LIST, TECHNICIANS } from "../MainDashboard/dcimDashboardData";

const LS_NOTIFY = "dcim.tickets.notify";
const LS_DELTA = "dcim.tickets.delta.v1";

// How often an open simulation ticket is re-announced (bottom-right toast).
export const REMINDER_MS = 10_000;
// How long a toast stays up on its own.
export const TOAST_MS = 8_500;
const MAX_TOASTS = 3;
const MAX_ACTIVITY = 400;

// Which team takes which kind of ticket (same split as the seed tickets).
export const TECH_FOR = {
  Power: "Neha Gupta", Cooling: "Neha Gupta", Network: "Priya Sharma", Security: "Amit Verma",
  Hardware: "Rajesh Kumar", Software: "Rajesh Kumar", Application: "Priya Sharma", Database: "Rajesh Kumar",
};
export { TECHNICIANS };

export const OPEN_STATUSES = ["Open", "In Progress"];
export const isOpen = (t) => OPEN_STATUSES.includes(t.status);

/** Name of whoever is signed in (falls back to "Admin"). */
export function currentUser() {
  try {
    const u = JSON.parse(localStorage.getItem("userData") || "null");
    return u?.fullName || u?.name || u?.userName || u?.username || u?.email || "Admin";
  } catch {
    return "Admin";
  }
}

const pad = (n) => String(n).padStart(2, "0");
const localStamp = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const today = () => localStamp().slice(0, 10);

// ── persistence (best effort: private windows / blocked storage just lose it) ──
function readDelta() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_DELTA) || "null");
    if (d && typeof d === "object") {
      return { overrides: d.overrides || {}, added: d.added || [], deleted: d.deleted || [], activity: d.activity || [] };
    }
  } catch { /* ignore */ }
  return { overrides: {}, added: [], deleted: [], activity: [] };
}
function readNotify() {
  try {
    const v = localStorage.getItem(LS_NOTIFY);
    return v == null ? true : v === "1";
  } catch {
    return true;
  }
}

const SEED = TICKET_LIST.map((t) => ({
  ...t,
  source: t.createdBy === "DCIM Alarm" ? "alarm" : "noc",
  createdAt: `${t.createdDate} ${t.createdBy === "DCIM Alarm" ? "09:15:00" : "10:00:00"}`,
}));
const SEED_NOS = new Set(SEED.map((t) => t.ticketNo));

let delta = readDelta();
let state = null;
state = build();
const listeners = new Set();

function build() {
  const deleted = new Set(delta.deleted);
  const tickets = [
    ...SEED.filter((t) => !deleted.has(t.ticketNo)).map((t) => ({ ...t, ...(delta.overrides[t.ticketNo] || {}) })),
    ...delta.added.filter((t) => !deleted.has(t.ticketNo)),
  ];
  return {
    tickets,
    activity: delta.activity,
    notify: state?.notify ?? readNotify(),
    toasts: state?.toasts ?? [],
    live: state?.live ?? {},
    viewing: state?.viewing ?? null,
  };
}

function persist() {
  try { localStorage.setItem(LS_DELTA, JSON.stringify(delta)); } catch { /* ignore */ }
}
function emit() { listeners.forEach((l) => l()); }
function commit({ save = true } = {}) {
  state = build();
  if (save) persist();
  emit();
}
function patchState(patch) {
  state = { ...state, ...patch };
  emit();
}

function nextNumber() {
  const max = state.tickets.reduce((m, t) => Math.max(m, Number(String(t.ticketNo).replace(/\D/g, "")) || 0), 0);
  const maxId = state.tickets.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
  return { id: Math.max(maxId, max) + 1, ticketNo: `INC-${String(max + 1).padStart(3, "0")}` };
}

function log(entry) {
  delta.activity = [{ at: localStamp(), actor: currentUser(), ...entry }, ...delta.activity].slice(0, MAX_ACTIVITY);
}

function writeTicket(ticketNo, patch) {
  if (SEED_NOS.has(ticketNo)) {
    delta.overrides[ticketNo] = { ...(delta.overrides[ticketNo] || {}), ...patch };
  } else {
    delta.added = delta.added.map((t) => (t.ticketNo === ticketNo ? { ...t, ...patch } : t));
  }
}

let toastSeq = 0;
function pushToast(toast) {
  if (!state.notify) return;
  const t = { id: ++toastSeq, at: Date.now(), ...toast };
  patchState({ toasts: [...state.toasts, t].slice(-MAX_TOASTS) });
}

const FIELD_LABEL = { assignedTo: "Assignee", status: "Status", priority: "Priority", category: "Category", title: "Title", description: "Description" };

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════
export const ticketStore = {
  getState: () => state,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  find(ticketNo) {
    return state.tickets.find((t) => t.ticketNo === ticketNo) || null;
  },

  /** New ticket from Ticket Management (or anywhere else). */
  createTicket(fields, { source = "manual", actor } = {}) {
    const { id, ticketNo } = nextNumber();
    const ticket = {
      id, ticketNo,
      title: fields.title, description: fields.description || "",
      category: fields.category, priority: fields.priority || "Medium",
      status: fields.status || "Open",
      createdBy: fields.createdBy || actor || currentUser(),
      assignedTo: fields.assignedTo || null,
      createdDate: today(), createdAt: localStamp(),
      device: fields.device || null, slaBreached: false,
      source, ...(fields.extra || {}),
    };
    delta.added = [...delta.added, ticket];
    log({ kind: "ticket.created", ref: ticketNo, actor: actor || ticket.createdBy, what: `Ticket ${ticketNo} created — ${ticket.title}`, to: ticket.assignedTo ? `assigned to ${ticket.assignedTo}` : "unassigned", device: ticket.device });
    commit();
    return ticket;
  },

  /** Change any fields; every changed field is written to the activity log. */
  updateTicket(ticketNo, patch, { actor, note } = {}) {
    const before = ticketStore.find(ticketNo);
    if (!before) return null;
    const changed = Object.keys(patch).filter((k) => (before[k] ?? null) !== (patch[k] ?? null));
    if (!changed.length && !note) return before;
    writeTicket(ticketNo, patch);
    changed.forEach((k) => {
      const kind = k === "assignedTo" ? "ticket.reassigned" : k === "status" ? "ticket.status" : "ticket.updated";
      log({
        kind, ref: ticketNo, actor: actor || currentUser(), device: before.device,
        what: k === "assignedTo"
          ? `Ticket ${ticketNo} reassigned`
          : `Ticket ${ticketNo} ${FIELD_LABEL[k] || k} changed`,
        from: before[k] || "—", to: patch[k] || "—", note: note || "",
      });
    });
    if (!changed.length && note) log({ kind: "ticket.note", ref: ticketNo, actor: actor || currentUser(), what: `Note on ${ticketNo}`, note, device: before.device });
    commit();
    if (changed.includes("assignedTo") && patch.assignedTo) {
      pushToast({ kind: "reassigned", ticketNo, title: `${ticketNo} reassigned to ${patch.assignedTo}`, body: before.title });
    }
    return ticketStore.find(ticketNo);
  },

  deleteTicket(ticketNo, { actor } = {}) {
    const t = ticketStore.find(ticketNo);
    if (!t) return;
    delta.deleted = [...new Set([...delta.deleted, ticketNo])];
    log({ kind: "ticket.deleted", ref: ticketNo, actor: actor || currentUser(), what: `Ticket ${ticketNo} deleted — ${t.title}`, device: t.device });
    commit();
  },

  // ── 5D View simulation ────────────────────────────────────────────────
  /** A device was failed in the 5D View: raise (and announce) a ticket. */
  raiseSimulationTicket({ deviceId, deviceName, category, role, roomName, dcName, cascadeCount = 0 }) {
    const cat = category || "Hardware";
    const priority = role === "power" || role === "cooling"
      ? (cascadeCount >= 5 ? "Urgent" : "High")
      : role === "network" ? "High" : role === "load" ? "Medium" : "Low";
    const ticket = ticketStore.createTicket({
      title: `${deviceName} down — simulated failure${roomName ? ` (${roomName})` : ""}`,
      description: `Raised automatically by the 5D View simulation${dcName ? ` in ${dcName}` : ""}: ${deviceName} was taken offline.`,
      category: cat, priority, status: "Open",
      createdBy: "5D View Simulation", assignedTo: TECH_FOR[cat] || "Rajesh Kumar",
      device: deviceName,
      extra: { simDeviceId: deviceId, roomName: roomName || null, dcName: dcName || null },
    }, { source: "simulation", actor: "5D View Simulation" });
    pushToast({ kind: "new", ticketNo: ticket.ticketNo });
    return ticket;
  },

  /** The device came back in the simulation: close its ticket. */
  resolveSimulationTicket(ticketNo, note = "Device restored in the 5D View simulation") {
    const t = ticketStore.find(ticketNo);
    if (!t || !isOpen(t)) return;
    ticketStore.updateTicket(ticketNo, { status: "Resolved" }, { actor: "5D View Simulation", note });
    pushToast({ kind: "resolved", ticketNo });
    const live = { ...state.live };
    delete live[ticketNo];
    patchState({ live });
  },

  /** Live impact of a simulated failure (not persisted). */
  setLive(ticketNo, info) {
    const prev = state.live[ticketNo];
    if (prev && prev.downSec === info.downSec && prev.cascadeCount === info.cascadeCount && Math.round(prev.cost) === Math.round(info.cost)) return;
    patchState({ live: { ...state.live, [ticketNo]: info } });
  },

  /** The 5D View closed: its live readings stop (the tickets stay open). */
  clearLive(ticketNos) {
    if (!ticketNos?.length) return;
    const live = { ...state.live };
    ticketNos.forEach((n) => { delete live[n]; });
    patchState({ live });
  },

  // ── notifications ────────────────────────────────────────────────────
  setNotify(on) {
    try { localStorage.setItem(LS_NOTIFY, on ? "1" : "0"); } catch { /* ignore */ }
    patchState({ notify: !!on, toasts: on ? state.toasts : [] });
  },
  dismissToast(id) {
    patchState({ toasts: state.toasts.filter((t) => t.id !== id) });
  },

  /** Re-announce the next open simulation ticket (round robin). */
  remind() {
    if (!state.notify) return;
    const open = state.tickets.filter((t) => t.source === "simulation" && isOpen(t));
    if (!open.length) return;
    remindCursor = (remindCursor + 1) % open.length;
    const t = open[remindCursor];
    // never stack a reminder on a toast that is already showing this ticket
    if (state.toasts.some((x) => x.ticketNo === t.ticketNo)) return;
    pushToast({ kind: "reminder", ticketNo: t.ticketNo });
  },

  // ── the "View" modal ─────────────────────────────────────────────────
  view(ticketNo) { patchState({ viewing: ticketNo }); },
  closeView() { patchState({ viewing: null }); },
};
let remindCursor = -1;

/** React hook: `useTicketStore((s) => s.tickets)`. */
export function useTicketStore(selector = (s) => s) {
  return selector(useSyncExternalStore(ticketStore.subscribe, ticketStore.getState, ticketStore.getState));
}

/** Open / in-progress / resolved counts, for dashboards. */
export function ticketCounts(tickets) {
  const by = (s) => tickets.filter((t) => t.status === s).length;
  return {
    total: tickets.length,
    open: by("Open"),
    inProgress: by("In Progress"),
    resolved: by("Resolved"),
    closed: by("Closed"),
    active: tickets.filter(isOpen).length,
    simulationOpen: tickets.filter((t) => t.source === "simulation" && isOpen(t)).length,
  };
}

// Other tabs of the portal (a second window) see the same tickets.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === LS_DELTA) {
      delta = readDelta();
      commit({ save: false });
    } else if (e.key === LS_NOTIFY) {
      patchState({ notify: readNotify() });
    }
  });
}
