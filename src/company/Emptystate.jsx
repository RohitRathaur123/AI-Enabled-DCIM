import { T } from "./constant";
import React from "react";
const EmptyState = ({ icon, color, bg, border, message, action }) => (
    <div style={{
        textAlign: "center", padding: "40px 20px",
        border: `1.5px dashed ${border}`, borderRadius: T.radius.lg, background: bg,
    }}>
        <div style={{ fontSize: 32, color, marginBottom: 10, opacity: 0.6 }}>{icon}</div>
        <div style={{ fontSize: 13, color, opacity: 0.8, marginBottom: action ? 14 : 0 }}>{message}</div>
        {action}
    </div>
);

export default EmptyState;