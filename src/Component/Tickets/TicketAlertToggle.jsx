// Header switch for ticket notifications (the bottom-right ticket toasts).
// ON  → new tickets pop up and every open 5D View simulation ticket is
//       announced again every 10 seconds.
// OFF → no ticket toasts at all (tickets are still raised and listed).
import React from "react";
import { Badge, Switch, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { ticketStore, useTicketStore, ticketCounts } from "./ticketStore";

export default function TicketAlertToggle({ compact = false }) {
  const navigate = useNavigate();
  const notify = useTicketStore((s) => s.notify);
  const tickets = useTicketStore((s) => s.tickets);
  const { active, simulationOpen } = ticketCounts(tickets);

  return (
    <Tooltip
      placement="bottom"
      title={notify
        ? `Ticket alerts are on. New tickets appear at the bottom right, and open 5D View simulation tickets are re-announced every 10 seconds (${simulationOpen} open).`
        : "Ticket alerts are off. Tickets are still raised, but no pop-up notifications are shown."}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 10px 0 8px",
        borderRadius: 999, border: "1px solid rgba(255,255,255,.4)",
        background: notify ? "rgba(255,255,255,.18)" : "rgba(15,23,42,.18)", transition: "background .2s",
      }}>
        <button
          onClick={() => navigate("/ticket")}
          aria-label="Open Ticket Management"
          style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
        >
          <Badge count={active} size="small" offset={[4, -2]} color={simulationOpen ? "#e8304a" : "#f59e0b"}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>🎫</span>
          </Badge>
        </button>
        {!compact && (
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 4 }}>
            Ticket Alerts
          </span>
        )}
        <Switch size="small" checked={notify} onChange={(on) => ticketStore.setNotify(on)} />
      </div>
    </Tooltip>
  );
}
