// Static replies for the floating AI assistant.
// The assistant answers from the portal's own static data — there is no
// external AI / chat service and no network request.
import { DCIM, SHOW, ACTIVE_ALARMS, ALARM_SUMMARY, TICKETS, CHANGES, FACILITY } from "../Component/MainDashboard/dcimDashboardData";

const r1 = (n) => Math.round(n * 10) / 10;

const TOPICS = [
  {
    keys: ["alarm", "alert", "critical", "warning", "fault"],
    answer: () => {
      const top = ACTIVE_ALARMS.slice(0, 4).map((a) => `• ${a.title} — ${a.device} (${a.severity}, ${a.time})`).join("\n");
      return `There are ${ACTIVE_ALARMS.length} active alarms: ${ALARM_SUMMARY.critical} critical, ${ALARM_SUMMARY.major} major and ${ALARM_SUMMARY.minor} minor.\n${top}\nOpen "Monitoring & Operations → Alarms & Event" for the full list.`;
    },
  },
  {
    keys: ["pue", "efficien", "energy", "carbon", "co2"],
    answer: () => `Current PUE is ${SHOW.pue} (target ${SHOW.pueTarget}). Facility load is ${r1(DCIM.facilityKw)} kW for ${r1(DCIM.itKw)} kW of IT load — about ${r1(DCIM.dailyMwh)} MWh per day and ${r1(DCIM.co2TonPerDay)} t CO₂ per day.`,
  },
  {
    keys: ["power", "ups", "pdu", "kw", "load", "generator", "dg"],
    answer: () => `IT load is ${SHOW.itKw}, which is ${SHOW.powerPct}% of the IT power budget. UPS load is ${Math.round(DCIM.upsLoadPct)}% of ${DCIM.upsInstalledKva} kVA installed. The busiest rack draws ${r1(DCIM.busiestRackKw)} kW.`,
  },
  {
    keys: ["cool", "temperature", "temp", "pac", "chiller", "airflow", "hot", "thermal"],
    answer: () => `Cooling is at ${SHOW.coolingPct}% of ${r1(DCIM.coolingCapKw)} kW capacity (${SHOW.coolingFreePct}% headroom) across ${DCIM.pacCount} PAC units. The warmest unit is ${DCIM.hottestPac.tag} on row ${DCIM.hottestPac.row}. Use "Thermal Monitoring" in the 5D View to see the aisles.`,
  },
  {
    keys: ["capacity", "space", "rack", " u ", "free", "storage"],
    answer: () => `Rack space: ${DCIM.usedU}U used, ${DCIM.reservedU}U reserved and ${DCIM.freeU}U free out of ${DCIM.totalU}U (${Math.round(DCIM.usedPct)}% used). The fullest rack is ${DCIM.fullest.alias} with ${DCIM.fullest.freeU}U free.`,
  },
  {
    keys: ["asset", "device", "server", "inventory", "network"],
    answer: () => `The site has ${DCIM.totalAssets} tracked assets: ${DCIM.servers} servers, ${DCIM.networkDevices} network devices, ${DCIM.powerDevices} power devices and ${DCIM.coolingDevices} cooling devices, in ${DCIM.racksTotal} racks.`,
  },
  {
    keys: ["ticket", "incident", "sla", "issue"],
    answer: () => `Tickets this month: ${TICKETS.total} total — ${TICKETS.inProgress} in progress, ${TICKETS.pending} pending and ${TICKETS.resolved} resolved (${TICKETS.resolvedWithinSla} within SLA). Open "Ticket Management" to work on them.`,
  },
  {
    keys: ["change", "cr ", "maintenance", "upgrade"],
    answer: () => `There are ${CHANGES.open} open change requests and ${CHANGES.completed} completed this month (${Math.round(CHANGES.onTimePct)}% on time, ${CHANGES.avgApprovalDays} days average approval).`,
  },
  {
    keys: ["5d", "3d", "digital twin", "view", "floor", "room"],
    answer: () => `The 5D View shows ${FACILITY.name} (${FACILITY.lengthM} m × ${FACILITY.breadthM} m) with ${DCIM.rooms} rooms, ${FACILITY.perforatedTiles} perforated tiles and ${FACILITY.cableTrays} cable trays. Open it from "5D View" in the sidebar — use Layers, Simulate and Thermal Monitoring from its toolbar.`,
  },
  {
    keys: ["health", "status", "summary", "overview", "how is"],
    answer: () => `Overall: IT load ${SHOW.itKw} (${SHOW.powerPct}% of budget), cooling ${SHOW.coolingPct}% used, PUE ${SHOW.pue}, ${ACTIVE_ALARMS.length} active alarms (${ALARM_SUMMARY.critical} critical) and ${TICKETS.open} open tickets.`,
  },
];

const GREETING = /^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/i;

export function staticAssistantReply(messages = []) {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const text = ` ${String(last).toLowerCase()} `;
  if (GREETING.test(last.trim())) {
    return "Hello! I can answer questions about power, cooling, PUE, rack capacity, assets, alarms, tickets and change requests on this portal. What would you like to know?";
  }
  const hits = TOPICS.filter((t) => t.keys.some((k) => text.includes(k)));
  if (hits.length) return hits.slice(0, 2).map((t) => t.answer()).join("\n\n");
  return "I can help with power, cooling, PUE, rack space, assets, alarms, tickets and change requests on this portal. Try asking “What is the current PUE?” or “Show active alarms”.";
}
