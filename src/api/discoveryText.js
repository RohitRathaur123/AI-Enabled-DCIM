// src/api/discoveryText.js
// ─────────────────────────────────────────────────────────────────────────────
// English wording for the Discovery Tool.
// The Protocol Service writes its free-text fields (message, note, notes,
// warnings, detail, schema_note …) in Hinglish, so the page never shows them as
// they arrive. Each message is built from the structured fields of the response
// (counts, status, device id …); a service text is shown only when it is already
// English; the documented Hinglish messages are translated; anything else falls
// back to a neutral English sentence. The untouched payload can still be
// inspected in the browser's network tab.
// ─────────────────────────────────────────────────────────────────────────────

// Words that only occur in Hinglish (romanised Hindi), never in English.
const STRONG = new Set([
  "hai", "hain", "nahi", "nahin", "mila", "mili", "raha", "rahi", "rahe", "gaya", "gayi", "gaye", "aur",
  "yaani", "jawab", "maujood", "kiya", "kiye", "karo", "kare", "karna", "karta", "karti", "chahiye",
  "sakte", "sakta", "sakti", "dono", "theek", "bheja", "bhejo", "aane", "aata", "aati", "aate", "jata",
  "jati", "jate", "jaata", "jaati", "wala", "wali", "wale", "pehle", "abhi", "yahan", "wahan", "sirf",
  "kuch", "koi", "isliye", "kyunki", "liye", "liya", "apne", "apni", "khud", "naya", "nayi", "dobara",
  "bina", "saath", "shuru", "hota", "hoti", "hote", "hua", "hui", "bhi", "hata", "hatao", "diya", "diye",
  "naam", "padho", "padhta", "padhti", "chalta", "chalti", "chalata", "wapas", "hamesha", "kaam", "kisi",
  "agar", "lekin", "tha", "thi", "matlab", "pakka", "paya", "pehchana", "pehchane", "dhoondho", "batao",
]);
// Short words that are Hindi in this context but could also be English; two of them mark a sentence.
const WEAK = new Set(["me", "se", "ke", "ki", "ka", "ko", "par", "ho", "ek", "ye", "wo", "jo", "ne"]);

export function isHinglish(text) {
  if (typeof text !== "string") return false;
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  let weak = 0;
  for (const w of words) {
    if (STRONG.has(w)) return true;
    if (WEAK.has(w)) weak += 1;
  }
  return weak >= 2;
}

const plural = (n, one, many) => (Number(n) === 1 ? one : many);

// The service's documented messages (Discovery_API_Frontend_Guide.md and the live API), in English.
const KNOWN = [
  [/^(\d+)\s+protocols?\s+jawab de rah[ae]\s+hai/i, (m) => `${m[1]} ${plural(m[1], "protocol is", "protocols are")} responding.`],
  [/koi protocol jawab nahi/i, () => "No protocol is responding."],
  [/^BACnet device (\d+) mila,?\s*(\d+)\s*objects?/i, (m) => `BACnet device ${m[1]} found with ${m[2]} objects.`],
  [/^(\d+)\s+slave ids?\s+jawab de rah[ie]\s+hai[n]?:?\s*(.*?)\.?$/i, (m) => `${m[1]} slave ${plural(m[1], "ID", "IDs")} responding${m[2] ? `: ${m[2]}` : ""}.`],
  [/exception bheja.*slave id maujood/i, () => "The device returned an exception, which means this slave ID exists."],
  [/koi measurement nahi mila/i, () => "No measurements were found in this scan — the device did not answer in time. Retry the read."],
  [/^'(.+?)' onboard ho gaya/i, (m) => `'${m[1]}' has been onboarded. Telemetry can take 10–30 seconds to arrive.`],
  [/^(\d+)\s+points?\s+par live values aa rahi/i, (m) => `Live values are arriving for ${m[1]} ${plural(m[1], "point", "points")} — the device and its mapping are both working.`],
  [/MIB se naam aur unit/i, () => "Point names and units were taken from the MIB."],
  [/DB se aa rahe hain/i, () => "Port, unit ID, community and BACnet device ID are loaded from the Device Management database."],
  [/bina kisi manual kaam ke onboard/i, () => "Devices of these models are onboarded without manual work. When a new model appears, the tool infers its register map, an engineer confirms it once, and the model is added to this list for good."],
  [/restart ho gaya/i, () => "The gateway has been restarted."],
  [/^(\S+) registry se hata diya/i, (m) => `${m[1]} was removed from the gateway registry.`],
];

// The third-party platform behind the gateway is never named on screen:
// "saved in ThingsBoard" → "saved in the platform", "ThingsBoard device" → "Device".
const neutral = (s) => {
  if (typeof s !== "string") return s;
  const out = s
    .replace(/\b(in|on|to|into|from|with|for|by|via)\s+things\s*board\b/gi, "$1 the platform")
    .replace(/\bthings\s*board\b\s*/gi, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Re-capitalise only when the removed name opened the sentence (keeps identifiers like "sysDescr" intact).
  return out && /^\s*things\s*board\b/i.test(s) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
};

/** The text itself when it is English, its translation when it is a known service message, otherwise `fallback`. */
export function toEnglish(text, fallback = null) {
  if (text === null || text === undefined) return fallback;
  const s = String(text).trim();
  if (!s) return fallback;
  if (!isHinglish(s)) return neutral(s);
  for (const [re, make] of KNOWN) {
    const m = s.match(re);
    if (m) return neutral(make(m));
  }
  return fallback;
}

const has = (v) => v !== null && v !== undefined && v !== "";

// ── probe ───────────────────────────────────────────────────────────────────
export function probeSummary(res) {
  const n = Number(res?.detected_count ?? (res?.protocols || []).filter((p) => p.detected).length) || 0;
  return n > 0
    ? `${n} ${plural(n, "protocol is", "protocols are")} responding.`
    : "No protocol is responding. Check the device power, network cable and IP address, then probe again.";
}

export function probeNote(r) {
  const own = toEnglish(r?.note, null);
  if (own) return own;
  if (r?.detected || r?.status === "responding") {
    if (r.protocol === "bacnet") {
      return has(r.device_id) ? `BACnet device ${r.device_id} found${has(r.objects_found) ? ` with ${r.objects_found} objects` : ""}.` : "The BACnet device is responding.";
    }
    if (r.protocol === "modbus") {
      return (r.needs || []).includes("unit_id")
        ? `Modbus TCP port ${r.port ?? 502} is open. The unit (slave) ID is still needed.`
        : `Modbus TCP port ${r.port ?? 502} is open and responding.`;
    }
    if (r.protocol === "snmp") return "The device answered the SNMP request.";
    return "The device is responding.";
  }
  if (r?.status === "timeout") return "The device did not answer before the timeout.";
  if (r?.status === "error") return "The check failed with an error.";
  return "No response from the device.";
}

// ── Modbus slave scan ───────────────────────────────────────────────────────
export function scanBlockMessage(block) {
  const found = block?.found || [];
  const [a, b] = block?.range || block?.scanned_range || [];
  return found.length
    ? `${found.length} slave ${plural(found.length, "ID", "IDs")} responding: ${found.map((f) => f.unit_id).join(", ")}.`
    : `No slave ID answered in ${a}–${b}.`;
}

export const scanFoundNote = (f) => toEnglish(
  f?.note,
  f?.response === "exception" ? "The device returned an exception, which means this slave ID exists." : "This slave ID answered.",
);
export const scanFoundDetail = (f) => toEnglish(f?.detail, "—");

// ── read / verify ───────────────────────────────────────────────────────────
const SOURCE_NOTE = {
  mib: "Point names and units were taken from the MIB.",
  profile: "The points come from the model's register profile.",
  self_describing: "The BACnet device describes its own points.",
  inferred: "No register profile was found, so the tool identified the registers itself.",
  raw: "The registers could not be identified, so only raw registers are shown.",
};

export function readNotes(rr) {
  const notes = Array.isArray(rr?.notes) ? rr.notes : [];
  const out = [];
  notes.forEach((n) => {
    const e = toEnglish(n, null);
    if (e && !out.includes(e)) out.push(e);
  });
  if (!out.length && notes.length && SOURCE_NOTE[rr?.source]) out.push(SOURCE_NOTE[rr.source]);
  return out;
}

export function readWarnings(rr) {
  const warnings = Array.isArray(rr?.warnings) ? rr.warnings : [];
  const retry = rr?.next_step === "retry_read" || rr?.retry_recommended === true;
  const out = [];
  warnings.forEach((w) => {
    const e = toEnglish(w, retry
      ? "No measurements were found in this scan — the device did not answer in time. Retry the read."
      : rr?.source === "inferred" ? SOURCE_NOTE.inferred : "The service reported a warning for this read. Check the points before binding.");
    if (!out.includes(e)) out.push(e);
  });
  return out;
}

export const pointDescription = (p) => toEnglish(p?.description, null);
export const pointError = (p) => toEnglish(p?.error === null || p?.error === undefined ? null : String(p.error), "This point could not be read.");

// ── bind / verify ───────────────────────────────────────────────────────────
export function bindMessage(br, name) {
  if (br?.success === false) return toEnglish(br?.message, "The device could not be onboarded.");
  return `'${br?.device_name || name}' has been onboarded. Telemetry can take 10–30 seconds to arrive.`;
}

export function verifyMessage(vr) {
  if (vr?.verified) {
    const n = vr.live_point_count;
    return has(n)
      ? `Live values are arriving for ${n} ${plural(n, "point", "points")} — the device and its mapping are both working.`
      : "Live values are arriving — the device and its mapping are both working.";
  }
  return toEnglish(vr?.message, "No live values were received from the device.");
}

// ── lists, health, gateway ──────────────────────────────────────────────────
export const profilesNote = (note) => toEnglish(note, null);
export const schemaNote = (note) => toEnglish(note, null);
export const targetMessage = (t) => toEnglish(t?.discovery_message, t?.discovery_status === "failed" ? "The last discovery attempt failed." : null);
export const dbMessage = (db) => (db?.connected ? "Connected" : toEnglish(db?.message, "The service cannot reach the Device Management database."));
export const restartMessage = (res) => toEnglish(res?.message, res?.success === false ? "The gateway could not be restarted." : "The gateway restart was requested.");
export const removeMessage = (res, ip) => toEnglish(res?.message, `${ip} was removed from the gateway registry.`);
