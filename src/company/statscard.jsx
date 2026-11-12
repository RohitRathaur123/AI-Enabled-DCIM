import { T } from "./constant";
import React from "react";

const StatCard = ({ label, value, color, bg, border, icon }) => (
    <div style={{
        background: bg, border: `1px solid ${border}`, borderRadius: T.radius.lg,
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
        boxShadow: T.shadow.sm,
    }}>
        <div style={{
            width: 44, height: 44, borderRadius: T.radius.md,
            background: "rgba(255,255,255,0.7)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 20, color, flexShrink: 0,
        }}>
            {icon}
        </div>
        <div>
            <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                textTransform: "uppercase", color, opacity: 0.75, marginBottom: 2,
            }}>
                {label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        </div>
    </div>
);

export default StatCard;