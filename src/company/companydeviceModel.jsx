import { useEffect, useState } from "react";
import { Modal, Spin, Empty, Tag, Badge } from "antd";
import { ApiOutlined, AppstoreOutlined } from "@ant-design/icons";
import axiosInstance, { axiosdevice } from "../../config";   
import React from "react";

export default function CompanyDevicesModal({ open, onCancel, company }) {
    const [loading,  setLoading]  = useState(false);
    const [devices,  setDevices]  = useState([]);

    useEffect(() => {
        if (!open || !company?.id) return;
        setDevices([]);
        setLoading(true);
        axiosdevice
            .get(`DeviceModel/by-company/${company.id}`)
            .then((res) => {
                const raw = res?.data ?? res;
                const arr = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.data)  ? raw.data
                    : Array.isArray(raw?.items) ? raw.items
                    : [];
                setDevices(arr);
            })
            .catch(() => setDevices([]))
            .finally(() => setLoading(false));
    }, [open, company?.id]);

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={560}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: "#EFF6FF", border: "1px solid #BFDBFE",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <ApiOutlined style={{ color: "#2563EB", fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            Devices — {company?.companyName || "Company"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>
                            Manufactured / associated devices
                        </div>
                    </div>
                </div>
            }
        >
            {/* ── Total count badge ── */}
            {!loading && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: devices.length ? "#EFF6FF" : "#F9FAFB",
                    border: `1px solid ${devices.length ? "#BFDBFE" : "#E5E7EB"}`,
                    borderRadius: 8,
                    marginBottom: 14,
                }}>
                    <AppstoreOutlined style={{ color: devices.length ? "#2563EB" : "#9CA3AF", fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: devices.length ? "#1D4ED8" : "#6B7280" }}>
                        Total Devices:
                    </span>
                    <Badge
                        count={devices.length}
                        showZero
                        style={{
                            backgroundColor: devices.length ? "#2563EB" : "#9CA3AF",
                            fontSize: 12, fontWeight: 700,
                        }}
                    />
                </div>
            )}

            {/* ── Body ── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
                        Loading devices…
                    </div>
                </div>
            ) : devices.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                            No devices found for this company
                        </span>
                    }
                    style={{ padding: "30px 0" }}
                />
            ) : (
                <div style={{
                    maxHeight: 420,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}>
                    {devices.map((device, idx) => {
                        const shortName = device.deviceShortName || device.shortName || device.name || "—";
                        const fullName  = device.deviceName      || device.name      || "";
                        const devType   = device.deviceType?.name || device.deviceTypeName || "";
                        const devId     = device.id;

                        return (
                            <div
                                key={devId ?? idx}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 14px",
                                    background: "#FAFAFA",
                                    border: "1px solid #F3F4F6",
                                    borderRadius: 8,
                                    transition: "border-color 0.15s",
                                    cursor: "default",
                                }}
                                onMouseEnter={e  => e.currentTarget.style.borderColor = "#BFDBFE"}
                                onMouseLeave={e  => e.currentTarget.style.borderColor = "#F3F4F6"}
                            >
                                {/* Index badge */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: 6,
                                    background: "#EFF6FF", border: "1px solid #BFDBFE",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#2563EB",
                                }}>
                                    {idx + 1}
                                </div>

                                {/* Device info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 600, color: "#111827",
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>
                                        {shortName}
                                    </div>
                                    {fullName && fullName !== shortName && (
                                        <div style={{
                                            fontSize: 11, color: "#6B7280",
                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                        }}>
                                            {fullName}
                                        </div>
                                    )}
                                </div>

                                {/* Device type tag */}
                                {devType && (
                                    <Tag
                                        style={{
                                            background: "#F0FDF4", color: "#15803D",
                                            border: "1px solid #BBF7D0",
                                            fontSize: 11, fontWeight: 600,
                                            borderRadius: 99, margin: 0,
                                        }}
                                    >
                                        {devType}
                                    </Tag>
                                )}

                                {/* ID chip */}
                                {devId && (
                                    <span style={{
                                        fontSize: 10, color: "#9CA3AF",
                                        background: "#F3F4F6", border: "1px solid #E5E7EB",
                                        borderRadius: 4, padding: "1px 5px",
                                        flexShrink: 0,
                                    }}>
                                        #{devId}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}