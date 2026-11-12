// ═══════════════════════════════════════════════════════════════════════════
// DEPLOYMENT CHAINS — the "what comes next" brain
// ═══════════════════════════════════════════════════════════════════════════
//
// A datacenter is not a bag of devices, it is two ordered delivery chains:
//
//   POWER    Transformer → Busway → Generator/ATS → MPP → PP → UPS → PDU → Rack
//   NETWORK  Internet/WAN → ISP Uplink → Core Router → Firewall →
//            Distribution Switch → Access Switch (ToR) → Server / Storage Rack
//
// Every stage below carries:
//   • `tier`   — its position in the chain. This is the single source of
//                truth for the failure simulation: a failure only ever
//                cascades to a HIGHER tier (downstream). Upstream gear can
//                never be taken down by something it feeds.
//   • `match`  — the shapes / names of the Toolbox tiles that belong here.
//   • `redundant` — Tier III wants an A and a B of this stage.
//   • `why`    — one line of plain English shown in the guidance toast.
//
// Nothing here touches React or THREE, so it can be unit-tested and reused
// from the Toolbox, the 3D view and the impact engine alike.

import { deviceLabel } from "../naming/deviceNaming";

// ── helpers ────────────────────────────────────────────────────────────────
const norm = (s) => (s || "").toString().trim().toLowerCase();

/** A stage matches a device by its `shape` first, then by a name substring. */
function stageMatches(stage, dev) {
  const shape = norm(dev?.shape);
  if (shape && stage.shapes?.includes(shape)) return true;
  const name = norm(dev?.name);
  if (!name) return false;
  return (stage.names || []).some((n) => name.includes(n));
}

// ═══════════════════════════════════════════════════════════════════════════
// POWER CHAIN
// ═══════════════════════════════════════════════════════════════════════════
export const POWER_CHAIN = [
  {
    key: "transformer", tier: 1, label: "Transformer", short: "T1 / T2 / T3",
    shapes: ["transformer"], names: ["transformer"],
    redundant: true, minCount: 1, cable: "power",
    why: "Utility HT supply steps down here. Nothing downstream is energised without it.",
  },
  {
    key: "busway", tier: 2, label: "Busway", short: "BUSWAY",
    shapes: ["busway"], names: ["busway", "busbar", "power source"],
    redundant: false, minCount: 1, cable: "power",
    why: "The common LT bus the transformers and generators both feed into.",
  },
  {
    key: "generator", tier: 2, label: "Generator (DG Set)", short: "GEN1 / GEN2",
    shapes: ["generator"], names: ["generator", "dg set", "genset"],
    redundant: true, minCount: 1, cable: "power",
    why: "Standby source. It backs the busway when utility power drops.",
  },
  {
    key: "mpp", tier: 3, label: "Main Power Panel", short: "MPP1 / MPP2",
    shapes: ["mpp"], names: ["main power panel", "mpp"],
    redundant: true, minCount: 1, cable: "power",
    why: "Splits the busway into the A and B distribution paths.",
  },
  {
    key: "pp", tier: 4, label: "Power Panel", short: "PP1 / PP2 / PP3",
    shapes: ["pp"], names: ["power panel", "distribution panel", "pac panel"],
    redundant: true, minCount: 2, cable: "power",
    why: "Sub-distribution — feeds the UPS rooms and mechanical (AC) loads.",
  },
  {
    key: "ups", tier: 5, label: "UPS", short: "UPS1…UPS4",
    shapes: ["ups"], names: ["ups"], exclude: ["wld"],
    redundant: true, minCount: 2, cable: "power",
    why: "Rides through the transfer gap. Below this point everything is protected load.",
  },
  {
    key: "pdu", tier: 6, label: "PDU", short: "PDU1 / PDU2",
    shapes: ["pdu", "ipdu"], names: ["pdu"],
    redundant: true, minCount: 2, cable: "power",
    why: "Final distribution — the A-feed and B-feed that reach each rack.",
  },
  {
    key: "rack_power", tier: 7, label: "Rack (dual-fed)", short: "RACK1…RACKn",
    shapes: ["rack", "bladeserver", "storage", "isprack", "netrack"],
    names: ["rack", "server", "storage array"],
    redundant: false, minCount: 1, cable: "power",
    why: "The load. Tier III wants each rack corded to PDU-A and PDU-B both.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK CHAIN — the Tier III deployment pattern from the reference diagram
// ═══════════════════════════════════════════════════════════════════════════
export const NETWORK_CHAIN = [
  {
    key: "wan", tier: 1, label: "Internet / WAN", short: "WAN",
    shapes: ["wan"], names: ["internet", "wan"],
    redundant: false, minCount: 1, cable: "backbone",
    why: "The demarcation point — everything the facility serves arrives here.",
  },
  {
    key: "isp", tier: 2, label: "ISP Uplink (A / B)", short: "ISP A / ISP B",
    shapes: ["isplink", "isprack"], names: ["isp"],
    redundant: true, minCount: 2, cable: "backbone",
    why: "Two carriers on two physical entries — one primary, one secondary.",
  },
  {
    key: "odf", tier: 2, label: "Fiber ODF / Patch Panel", short: "ODF",
    shapes: ["odf", "patchpanel"], names: ["odf", "patch panel", "optical distribution"],
    redundant: false, minCount: 1, cable: "fiber", optional: true,
    why: "Where carrier fiber lands and is patched into your own cabling.",
  },
  {
    key: "core", tier: 3, label: "Core Router (A / B)", short: "CORE A / CORE B",
    shapes: ["corerouter", "router"], names: ["core router", "router"],
    redundant: true, minCount: 2, cable: "backbone",
    why: "Owns the routing table and the peer-link between the A and B cores.",
  },
  {
    key: "firewall", tier: 4, label: "Firewall (A / B)", short: "FW A / FW B",
    shapes: ["firewall"], names: ["firewall"],
    redundant: true, minCount: 2, cable: "network",
    why: "Perimeter security. An HA pair so a failover is not an outage.",
  },
  {
    key: "ids", tier: 4, label: "IDS / IPS", short: "IPS",
    shapes: ["idsips"], names: ["ids", "ips", "intrusion"],
    redundant: false, minCount: 1, cable: "network", optional: true,
    why: "Inspects what the firewall lets through. Usually inline behind it.",
  },
  {
    key: "lb", tier: 5, label: "Load Balancer", short: "LB",
    shapes: ["loadbalancer"], names: ["load balancer", "balancer", "adc"],
    redundant: true, minCount: 1, cable: "network", optional: true,
    why: "Spreads sessions across the server pool once traffic is inside.",
  },
  {
    key: "dist", tier: 5, label: "Distribution Switch (A / B)", short: "DIST A / DIST B",
    shapes: ["distswitch"], names: ["distribution switch", "dist switch", "aggregation"],
    redundant: true, minCount: 2, cable: "network",
    why: "Aggregation layer. Both distribution switches peer-link to each other.",
  },
  {
    key: "access", tier: 6, label: "Access Switch / ToR (A / B)", short: "ToR A / ToR B",
    shapes: ["torswitch", "switch"], names: ["access switch", "top-of-rack", "tor", "network switch"],
    redundant: true, minCount: 2, cable: "network",
    why: "Top-of-rack. Each ToR must be dual-homed to BOTH distribution switches.",
  },
  {
    key: "oob", tier: 6, label: "Console / OOB Server", short: "OOB",
    shapes: ["consoleserver"], names: ["console server", "oob", "out-of-band"],
    redundant: false, minCount: 1, cable: "network", optional: true,
    why: "Out-of-band access, so a dead switch can still be reached to fix it.",
  },
  {
    key: "rack_net", tier: 7, label: "Server & Storage Rack", short: "RACK1…RACKn",
    shapes: ["rack", "bladeserver", "storage", "netrack"],
    names: ["rack", "server", "storage array"],
    redundant: false, minCount: 1, cable: "equipment",
    why: "Dual-homed to Access A and Access B — no single ToR takes a rack offline.",
  },
];

// ── Passive distribution racks of the structured cabling ─────────────────
// In a structured-cabling hall the servers are not cabled to the switch
// directly: the switch ports are patched into an NDR (Network Distribution
// Rack) in the MDA row, a fiber trunk runs from there to the RDR (Row
// Distribution Rack) at the head of each server row, and the RDR hands every
// rack in its row its copper and fiber. So these two sit BETWEEN the access
// switch (tier 6) and the rack (tier 7):
//
//   access switch (6) → NDR (6.3) → RDR (6.6) → server / storage rack (7)
//
// They are matched by NAME only (both use the ordinary network-rack body),
// so a plain "Network Rack" dropped from the Toolbox keeps behaving exactly
// as before. They are not listed in NETWORK_CHAIN because they are optional
// passive patching, not a stage the Deployment Guide should ask for -- they
// only need a tier so the failure cascade walks through them in the right
// direction.
export const NETWORK_PATCH_STAGES = [
  {
    key: "ndr", tier: 6.3, label: "Network Distribution Rack (NDR)", short: "NDR",
    shapes: [], names: ["network distribution rack"],
    redundant: true, minCount: 2, cable: "copper", optional: true,
    why: "Patches the access switch ports and sends a fiber trunk to every row.",
  },
  {
    key: "rdr", tier: 6.6, label: "Row Distribution Rack (RDR)", short: "RDR",
    shapes: [], names: ["row distribution rack"],
    redundant: false, minCount: 1, cable: "fiber", optional: true,
    why: "Head of a server row: takes the trunks in and gives every rack its copper and fiber.",
  },
];

export const CHAINS = {
  power: { key: "power", label: "Power", color: "#f59e0b", stages: POWER_CHAIN },
  network: { key: "network", label: "Network", color: "#3b82f6", stages: NETWORK_CHAIN },
};

// Default halo / cable colour for a healthy device, by chain.
export const CHAIN_COLORS = {
  power: 0xf59e0b,      // yellow
  network: 0x3b82f6,    // blue
  cooling: 0x22d3ee,
  other: 0x94a3b8,
};
export const CHAIN_COLORS_HEX = {
  power: "#f59e0b",
  network: "#3b82f6",
  cooling: "#22d3ee",
  other: "#94a3b8",
};

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Which stage(s) does this device belong to?
 * A rack sits in BOTH chains (it is the terminal load of each), which is
 * exactly right — it is the one device a power failure and a network
 * failure can each take down independently.
 *
 * @returns {{power: object|null, network: object|null}}
 */
export function classifyDevice(dev) {
  const out = { power: null, network: null };
  const name = norm(dev?.name);

  for (const s of POWER_CHAIN) {
    if (s.exclude?.some((x) => name.includes(x))) continue;
    if (stageMatches(s, dev)) { out.power = s; break; }
  }
  // NDR / RDR first: they wear a rack body, and would otherwise be read as
  // the rack at the end of the chain.
  for (const s of NETWORK_PATCH_STAGES) {
    if (stageMatches(s, dev)) { out.network = s; break; }
  }
  if (!out.network) {
    for (const s of NETWORK_CHAIN) {
      if (s.exclude?.some((x) => name.includes(x))) continue;
      if (stageMatches(s, dev)) { out.network = s; break; }
    }
  }

  // Anything that matched no named stage still needs a tier, or the cascade
  // would quietly skip it and report a CRAC or a camera as healthy while its
  // feed is dead. Two fallbacks:
  //   • Power/Network gear the chain does not name (a breaker, a tap-off box,
  //     a battery bank) sits mid-chain, where it can both lose a feed and
  //     pass the loss on.
  //   • Everything else — cooling, cameras, fire panels, humidifiers — is a
  //     terminal consumer: it can lose power or a link, but nothing hangs
  //     off it, so the cascade stops there.
  if (!out.power) {
    out.power = dev?.category === "Power"
      ? { key: "power_other", tier: 4, label: dev.name, redundant: false, terminal: false, why: "" }
      : { key: "power_load", tier: 7, label: dev?.name || "Load", redundant: false, terminal: true, why: "" };
  }
  if (!out.network) {
    out.network = dev?.category === "Network"
      ? { key: "net_other", tier: 5, label: dev.name, redundant: false, terminal: false, why: "" }
      : { key: "net_load", tier: 7, label: dev?.name || "Endpoint", redundant: false, terminal: true, why: "" };
  }
  return out;
}

/** The tier of `dev` inside `chain` ("power" | "network"), or null. */
export function deviceTier(dev, chain) {
  const c = classifyDevice(dev);
  return c[chain]?.tier ?? null;
}

/** True when `dev` is a NAMED stage of `chain` (not just a terminal consumer). */
export function inChain(dev, chain) {
  const st = classifyDevice(dev)[chain];
  return !!st && !st.terminal && !st.key.endsWith("_other");
}

/**
 * Should this device have an upstream feed in `chain`?
 *
 * Used to decide what counts as a genuine wiring gap. A CRAC with no power
 * cable is a real omission; a door with no power cable is a door.
 */
export function expectsFeed(dev, chain) {
  const st = classifyDevice(dev)[chain];
  if (!st || st.tier <= 1) return false;          // the source itself feeds nothing upstream
  if (!st.terminal) return true;                  // a named mid-chain stage always has a feed
  const cat = dev?.category;
  if (chain === "power") return cat !== "Infrastructure";
  return cat === "Compute" || cat === "Storage" || cat === "Security";
}

/**
 * The chain a device primarily belongs to, for colouring.
 * Racks are terminal loads of both, so they read as "other" (neutral) and
 * take their colour from whichever failure actually reaches them.
 */
export function primaryChain(dev) {
  const cat = dev?.category;
  if (cat === "Cooling") return "cooling";
  if (cat === "Power") return "power";
  if (cat === "Network") return "network";
  const net = inChain(dev, "network");
  const pwr = inChain(dev, "power");
  if (net && !pwr) return "network";
  if (pwr && !net) return "power";
  return "other";
}

// ═══════════════════════════════════════════════════════════════════════════
// GUIDANCE — "what should I place next, and what did I skip?"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Roll the placed devices up into a per-stage tally for one chain.
 * @returns {Array<stage & {count, satisfied, redundancyMet}>}
 */
export function chainStatus(devices = [], chain = "power") {
  const stages = CHAINS[chain].stages;
  return stages.map((s) => {
    const matched = devices.filter((d) => {
      const n = norm(d?.name);
      if (s.exclude?.some((x) => n.includes(x))) return false;
      return stageMatches(s, d);
    });
    const count = matched.length;
    const need = s.minCount || 1;
    return {
      ...s,
      count,
      devices: matched,
      satisfied: count >= need,
      redundancyMet: s.redundant ? count >= Math.max(2, need) : count >= need,
    };
  });
}

/**
 * The full guidance read-out after `placed` was just dropped on the floor.
 *
 * @param {object[]} devices  every device on the floor INCLUDING `placed`
 * @param {object}   placed   the device that was just added
 * @returns {{
 *   chain: "power"|"network"|null,
 *   stage: object|null,
 *   next: {label, why, short}|null,
 *   missingBefore: object[],
 *   redundancyHint: string|null,
 *   cableHint: string|null,
 *   headline: string,
 * }|null}
 */
export function guidanceFor(devices = [], placed) {
  if (!placed) return null;
  const cls = classifyDevice(placed);
  // A device in both chains (a rack) is reported against whichever chain is
  // further from complete, because that is the advice that is actually useful.
  // The terminal-consumer fallbacks are deliberately excluded: a CRAC needs a
  // power cable, but it is not a stage of the power chain and it would be
  // nonsense to tell someone their next step after a CRAC is a transformer.
  const candidates = ["power", "network"].filter((c) => inChain(placed, c));
  if (!candidates.length) {
    // Not a stage of either chain — but it may still be a consumer that has
    // to be fed, and saying so is the useful half of the advice.
    const needsPower = expectsFeed(placed, "power");
    const needsNet = expectsFeed(placed, "network");
    const needs = [needsPower && "power", needsNet && "network"].filter(Boolean);

    if (!needs.length) {
      return {
        chain: null, chainLabel: "—", chainColor: "#94a3b8",
        stage: null, next: null, missingBefore: [], redundancyHint: null, cableHint: null,
        position: "—",
        headline: `${deviceLabel(placed)} placed — it sits outside both delivery chains, so nothing is required before or after it.`,
      };
    }

    // Name the stage that would actually feed this consumer — a PDU, or the
    // power panel above it. "There is no transformer yet" is true but useless
    // advice for someone who has just dropped a CRAC.
    const pwrStatus = chainStatus(devices, "power");
    const feeder = needsPower
      ? (pwrStatus.find((st) => st.key === "pdu") || pwrStatus.find((st) => st.key === "pp"))
      : null;
    const feederPlaced = (feeder?.count || 0) > 0;

    return {
      chain: needsPower ? "power" : "network",
      chainLabel: needsPower ? "Power" : "Network",
      chainColor: needsPower ? CHAINS.power.color : CHAINS.network.color,
      stage: null, next: null, missingBefore: [], redundancyHint: null,
      position: "consumer",
      cableHint: `Run a ${needs.join(" and a ")} cable to it, or the simulation will treat it as unfed and never show it failing.`,
      headline: needsPower && feeder && !feederPlaced
        ? `${deviceLabel(placed)} placed — it draws power, but there is no ${feeder.label} on the floor yet to feed it.`
        : `${deviceLabel(placed)} placed — it is a ${needs.join(" and ")} consumer, not a chain stage. Cable it to ${needsPower ? `a ${feeder?.label || "PDU"}` : "an access switch"}.`,
    };
  }

  const pick = candidates
    .map((c) => {
      const st = chainStatus(devices, c);
      const stage = cls[c];
      const idx = st.findIndex((s) => s.key === stage.key);
      const missingBefore = st
        .slice(0, Math.max(0, idx))
        .filter((s) => !s.optional && !s.satisfied);
      return { chain: c, stage, status: st, idx, missingBefore };
    })
    .sort((a, b) => b.missingBefore.length - a.missingBefore.length)[0];

  const { chain, stage, status, idx, missingBefore } = pick;
  const chainMeta = CHAINS[chain];

  // Next: the first stage after this one that is still short. Optional
  // stages are suggested only once every required stage after them is done.
  const after = status.slice(idx + 1);
  const nextRequired = after.find((s) => !s.optional && !s.satisfied);
  const nextRedundancy = after.find((s) => !s.optional && s.satisfied && !s.redundancyMet);
  const nextOptional = after.find((s) => s.optional && !s.satisfied);
  const next = nextRequired || nextRedundancy || nextOptional || null;

  // This stage's own redundancy — Tier III means an A side and a B side.
  const self = status[idx];
  let redundancyHint = null;
  if (stage.redundant && self && !self.redundancyMet) {
    redundancyHint = `Tier III needs a second ${stage.label.replace(/ \(.*\)$/, "")} (the B side) — you have ${self.count}.`;
  }

  const cableHint = stage.cable
    ? `Run a ${stage.cable} cable from the ${chainMeta.label.toLowerCase()} stage above it with the Connect tool, or the simulation cannot model a failure through this device.`
    : null;

  let headline;
  if (missingBefore.length) {
    const names = missingBefore.map((s) => s.label).join(" → ");
    headline = `${deviceLabel(placed)} placed out of order — ${names} should have come before it in the ${chainMeta.label.toLowerCase()} chain.`;
  } else if (next) {
    headline = `${deviceLabel(placed)} placed. Next in the ${chainMeta.label.toLowerCase()} chain: ${next.label}.`;
  } else {
    headline = `${deviceLabel(placed)} placed — the ${chainMeta.label.toLowerCase()} chain is complete end to end.`;
  }

  return {
    chain, chainLabel: chainMeta.label, chainColor: chainMeta.color,
    stage, next, missingBefore, redundancyHint, cableHint, headline,
    position: `${idx + 1} of ${status.length}`,
  };
}

/** Everything the Deployment Guide panel needs, in one call. */
export function fullGuide(devices = []) {
  return {
    power: chainStatus(devices, "power"),
    network: chainStatus(devices, "network"),
  };
}

export default {
  POWER_CHAIN, NETWORK_CHAIN, CHAINS, CHAIN_COLORS, CHAIN_COLORS_HEX,
  classifyDevice, deviceTier, inChain, primaryChain,
  chainStatus, guidanceFor, fullGuide,
};
