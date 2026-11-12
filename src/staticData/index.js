// ─────────────────────────────────────────────────────────────────────────────
// Static data layer — entry point
//
// Registers every local service and exports the helpers the app uses instead
// of real API clients. Nothing here reads .env or contacts a server.
//
//   service      replaces                 static data
//   company      Company Management API   seed/area.js, seed/company.js
//   device       Device Management API    seed/device.js
//   ticket       Ticket Management API    seed/ticket.js
//   user         User list (Assign)       seed/ticket.js (USERS)
//   gas          CO₂ / PH₃ monitoring      services/co2.js
//   discovery    Protocol Discovery       services/discovery.js
// ─────────────────────────────────────────────────────────────────────────────
import axios from "axios";
import { registerService, staticAdapter, staticFetch } from "./core/http";
import { companyRoutes } from "./services/company";
import { deviceRoutes } from "./services/device";
import { ticketRoutes, userRoutes } from "./services/ticket";
import { co2Routes } from "./services/co2";
import { discoveryRoutes } from "./services/discovery";

registerService("company", companyRoutes);
registerService("device", deviceRoutes);
registerService("ticket", ticketRoutes);
registerService("user", userRoutes);
registerService("gas", co2Routes);
registerService("discovery", discoveryRoutes);

// Safety net: any plain `axios` call that is not wired to a static service is
// answered locally with an error instead of going to the network.
axios.defaults.adapter = staticAdapter("unrouted");

// An axios instance whose requests are answered by a local static service.
export function createStaticClient(service, config = {}) {
  return axios.create({ ...config, baseURL: undefined, adapter: staticAdapter(service) });
}

// fetch() replacement for a local static service (returns a real Response).
export const gasFetch = staticFetch("gas");

export { staticAdapter, staticFetch };
export { fileUrlById, isInlineUrl } from "./core/files";
export { staticAssistantReply } from "./assistant";
