// ═══════════════════════════════════════════════════════════════════════════
// DEVICE NAMING — aliases / asset tags
// ---------------------------------------------------------------------------
// Every placed device carries the name of its Toolbox tile ("Rack",
// "UPS Module", "Access Switch (ToR)"). That is fine for a library, and
// useless the moment there are twelve of them: a failure report that says
// "Rack is down, and it took Rack, Rack and Rack with it" tells nobody
// anything.
//
// So each device also gets an `alias` — the tag a real facility actually
// paints on the cabinet door: RACK-01, UPS-02, ToR-03. It is auto-assigned
// on placement (sequential, per device family), editable in Properties, and
// is what every panel, label, toast and failure report shows.
//
// deviceLabel() is the single accessor. Nothing should read `.name` directly
// for display any more — devices saved before aliases existed simply fall
// back to their type name, so old layouts keep working untouched.
// ═══════════════════════════════════════════════════════════════════════════

// shape key -> tag prefix. Shape is used first because it is the one field a
// Toolbox tile always carries and never localises.
const PREFIX_BY_SHAPE = {
  // compute & storage
  rack: "RACK", netrack: "NRACK", bladeserver: "BLADE", storage: "STOR", isprack: "ISPR",
  // power chain
  transformer: "TR", busway: "BUS", generator: "GEN", mpp: "MPP", pp: "PP",
  ups: "UPS", pdu: "PDU", ipdu: "iPDU", battery: "BAT", breaker: "BR",
  tapoff: "TAP", wldpanel: "WLD",
  // network chain
  wan: "WAN", isplink: "ISP", odf: "ODF", patchpanel: "PATCH",
  corerouter: "CR", router: "RTR", firewall: "FW", distswitch: "DS",
  torswitch: "ToR", switch: "SW", loadbalancer: "LB", idsips: "IPS",
  consoleserver: "OOB",
  // cooling & environment
  crac: "CRAC", chiller: "CH", humidifier: "HUM",
  // security & access
  camera: "CAM", cardreader: "ACR", biometric: "BIO", pushbutton: "PB",
  // safety
  fm200: "FM200", fm200cyl: "FMC", exitsign: "EXIT",
  // infrastructure
  door: "DR", stairs: "STR",
};

// Fallback when a device has no `shape` (older saved layouts, API imports).
const PREFIX_BY_NAME = [
  [/network rack/i, "NRACK"], [/rack|server/i, "RACK"], [/storage/i, "STOR"],
  [/transformer/i, "TR"], [/busway|busbar|power source/i, "BUS"],
  [/generator|dg set|genset/i, "GEN"], [/main power panel|^mpp/i, "MPP"],
  [/power panel|distribution panel/i, "PP"], [/ups/i, "UPS"], [/pdu/i, "PDU"],
  [/battery/i, "BAT"], [/breaker/i, "BR"], [/tap-?off/i, "TAP"],
  [/internet|wan/i, "WAN"], [/isp/i, "ISP"], [/odf|optical/i, "ODF"],
  [/patch panel/i, "PATCH"], [/core router/i, "CR"], [/firewall/i, "FW"],
  [/distribution switch|aggregation/i, "DS"], [/access switch|top-of-rack|tor/i, "ToR"],
  [/load balancer/i, "LB"], [/ids|ips|intrusion/i, "IPS"],
  [/console|out-of-band|oob/i, "OOB"], [/router/i, "RTR"], [/switch/i, "SW"],
  [/crac|pac unit|ac unit/i, "CRAC"], [/chiller/i, "CH"], [/humidifier/i, "HUM"],
  [/camera|cctv/i, "CAM"], [/card reader|access card/i, "ACR"],
  [/biometric/i, "BIO"], [/push button/i, "PB"],
  [/fm200/i, "FM200"], [/exit/i, "EXIT"], [/door/i, "DR"], [/stair|ramp/i, "STR"],
];

const FALLBACK_PREFIX = "DEV";

/** The tag family a device belongs to, e.g. "RACK". */
export function aliasPrefix(dev) {
  const shape = (dev?.shape || "").toLowerCase();
  if (PREFIX_BY_SHAPE[shape]) return PREFIX_BY_SHAPE[shape];
  const name = dev?.name || "";
  const hit = PREFIX_BY_NAME.find(([re]) => re.test(name));
  return hit ? hit[1] : FALLBACK_PREFIX;
}

/**
 * Next free alias in this device's family, given everything already placed.
 *
 * Numbering fills gaps rather than always incrementing: delete RACK-02 and
 * the next rack you place becomes RACK-02 again, which is what a facility
 * naming scheme actually does. Manually-typed aliases are respected — the
 * scan only counts tags that match this exact PREFIX-NN pattern, so calling
 * one cabinet "LEGACY-DB" never shifts the auto numbers around it.
 */
export function nextAlias(dev, existingDevices = []) {
  const prefix = aliasPrefix(dev);
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`, "i");
  const taken = new Set();
  existingDevices.forEach((d) => {
    const m = re.exec((d?.alias || "").trim());
    if (m) taken.add(Number(m[1]));
  });
  let n = 1;
  while (taken.has(n)) n += 1;
  return `${prefix}-${String(n).padStart(2, "0")}`;
}

/**
 * What to SHOW for a device, everywhere: its alias if it has one, its type
 * name otherwise. Never returns an empty string.
 */
export function deviceLabel(dev) {
  const alias = (dev?.alias || "").trim();
  if (alias) return alias;
  return dev?.name || dev?.id || "Device";
}

/** "RACK-01 · Rack" — for tooltips and places with room for both. */
export function deviceLabelLong(dev) {
  const alias = (dev?.alias || "").trim();
  if (!alias || alias === dev?.name) return dev?.name || "Device";
  return `${alias} · ${dev.name}`;
}

/**
 * Is this alias already used by a different device?
 * Aliases are how a human identifies a cabinet, so two of them sharing a tag
 * makes a failure report ambiguous in exactly the way aliases exist to stop.
 */
export function aliasTaken(alias, devices = [], exceptId = null) {
  const a = (alias || "").trim().toLowerCase();
  if (!a) return false;
  return devices.some((d) => d.id !== exceptId && (d.alias || "").trim().toLowerCase() === a);
}

export default { aliasPrefix, nextAlias, deviceLabel, deviceLabelLong, aliasTaken };
