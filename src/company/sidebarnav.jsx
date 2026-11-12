import { message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { MODAL_STEPS, LOCKED_SECTIONS } from "./constant";
import React from "react";

const SidebarNav = ({ active, onChange, counts, basicInfoFilled }) => (
    <div style={{ width: 200, minWidth: 200, borderRight: "1px solid #F3F4F6", paddingTop: 6, background: "#FAFAFA" }}>
        {MODAL_STEPS.map(step => {
            const isActive = active === step.key;
            const isLocked = !basicInfoFilled && LOCKED_SECTIONS.includes(step.key);
            return (
                <div
                    key={step.key}
                    onClick={() => {
                        if (isLocked) { message.warning("Please fill Company Name and Type first."); return; }
                        onChange(step.key);
                    }}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", cursor: isLocked ? "not-allowed" : "pointer",
                        marginBottom: 2,
                        background: isActive ? "#fff" : "transparent",
                        borderRight: isActive ? `2px solid ${step.color}` : "2px solid transparent",
                        borderRadius: "6px 0 0 6px",
                        opacity: isLocked ? 0.35 : 1,
                        transition: "all 0.15s",
                    }}
                >
                    <span style={{ fontSize: 15, color: isActive ? step.color : "#9CA3AF" }}>{step.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? step.color : "#6B7280", flex: 1 }}>
                        {step.label}
                    </span>
                    {isLocked
                        ? <LockOutlined style={{ fontSize: 10, color: "#D1D5DB" }} />
                        : counts[step.key] > 0 && (
                            <span style={{
                                minWidth: 18, height: 18, borderRadius: 99, padding: "0 5px",
                                background: isActive ? step.color : "#E5E7EB",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 700, color: isActive ? "#fff" : "#6B7280",
                            }}>
                                {counts[step.key]}
                            </span>
                        )
                    }
                </div>
            );
        })}
    </div>
);

export default SidebarNav;