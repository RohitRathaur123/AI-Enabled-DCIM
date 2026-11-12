// DeviceTypeModelsModal.jsx
// View: DeviceType ke saare assigned ModelSpecifications

import { useEffect, useState } from "react";
import { Modal, Spin, Empty, Tag, Badge, Input, Tooltip } from "antd";
import { AppstoreOutlined, SearchOutlined, CalendarOutlined, UserOutlined } from "@ant-design/icons";
import { FaCubes } from "react-icons/fa";
import { axiosdevice } from "../../config";
import React from "react";
import dayjs from "dayjs";

export default function DeviceTypeModelsModal({ open, onCancel, deviceType }) {
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open || !deviceType?.id) return;
        setModels([]);
        setSearch("");
        setLoading(true);
        axiosdevice
            .get(`DeviceModel/models-by-devicetype/${deviceType.id}`)
            .then((res) => {
                const raw = res?.data ?? res;
                const arr = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.data) ? raw.data
                    : Array.isArray(raw?.items) ? raw.items
                    : [];
                setModels(arr);
            })
            .catch(() => setModels([]))
            .finally(() => setLoading(false));
    }, [open, deviceType?.id]);

    const filtered = models.filter((m) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (m.name || "").toLowerCase().includes(q) ||
            (m.modelNumber || "").toLowerCase().includes(q) ||
            (m.remarks || "").toLowerCase().includes(q)
        );
    });

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={620}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: "#F0FDF4", border: "1px solid #BBF7D0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <FaCubes style={{ color: "#16A34A", fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            Models — {deviceType?.name || "Device Type"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>
                            Associated model specifications
                        </div>
                    </div>
                </div>
            }
        >
            {/* ── Total count ── */}
            {!loading && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: models.length ? "#F0FDF4" : "#F9FAFB",
                    border: `1px solid ${models.length ? "#BBF7D0" : "#E5E7EB"}`,
                    borderRadius: 8,
                    marginBottom: 12,
                }}>
                    <AppstoreOutlined style={{ color: models.length ? "#16A34A" : "#9CA3AF", fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: models.length ? "#15803D" : "#6B7280" }}>
                        Total Models:
                    </span>
                    <Badge
                        count={models.length}
                        showZero
                        style={{
                            backgroundColor: models.length ? "#16A34A" : "#9CA3AF",
                            fontSize: 12, fontWeight: 700,
                        }}
                    />
                </div>
            )}

            {/* ── Search ── */}
            {!loading && models.length > 0 && (
                <Input
                    prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                    placeholder="Search by model name, number or remarks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    size="small"
                    style={{ marginBottom: 10 }}
                />
            )}

            {/* ── Body ── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
                        Loading models…
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                            {search.trim()
                                ? `No models found for "${search}"`
                                : "No models associated with this device type"}
                        </span>
                    }
                    style={{ padding: "28px 0" }}
                />
            ) : (
                <div style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}>
                    {filtered.map((model, idx) => {
                        const name = model.name || "—";
                        const modelNumber = model.modelNumber || "";
                        const remarks = model.remarks || "";
                        const createdAt = model.createdAt || model.createdDate || "";
                        const updatedAt = model.updatedAt || model.updatedDate || "";

                        return (
                            <div
                                key={model.id ?? idx}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: "12px 14px",
                                    background: "#FAFAFA",
                                    border: "1px solid #F3F4F6",
                                    borderRadius: 8,
                                    transition: "all 0.15s",
                                    cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "#BBF7D0";
                                    e.currentTarget.style.background = "#F8FAFC";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#F3F4F6";
                                    e.currentTarget.style.background = "#FAFAFA";
                                }}
                            >
                                {/* Index */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: 6,
                                    background: "#F0FDF4", border: "1px solid #BBF7D0",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#16A34A",
                                    marginTop: 2,
                                }}>
                                    {idx + 1}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Name + model number */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{
                                            fontSize: 14, fontWeight: 600, color: "#111827",
                                        }}>
                                            {name}
                                        </span>
                                        {modelNumber && (
                                            <Tag style={{
                                                background: "#F3F4F6", color: "#6B7280",
                                                border: "1px solid #E5E7EB",
                                                fontSize: 10, fontWeight: 500,
                                                borderRadius: 4, margin: 0,
                                            }}>
                                                {modelNumber}
                                            </Tag>
                                        )}
                                    </div>

                                    {/* Device Type info */}
                                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                        {model.deviceTypeId && (
                                            <Tag style={{
                                                background: "#EFF6FF", color: "#1D4ED8",
                                                border: "1px solid #BFDBFE",
                                                fontSize: 10, fontWeight: 500,
                                                borderRadius: 99, margin: 0, padding: "0 7px",
                                            }}>
                                                <ApiOutlined style={{ fontSize: 10, marginRight: 3 }} />
                                                Device Type ID: {model.deviceTypeId}
                                            </Tag>
                                        )}
                                    </div>

                                    {/* Timestamps */}
                                    <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                                        {createdAt && (
                                            <Tooltip title="Created At">
                                                <span style={{
                                                    fontSize: 10, color: "#9CA3AF",
                                                    display: "flex", alignItems: "center", gap: 3,
                                                }}>
                                                    <CalendarOutlined style={{ fontSize: 10 }} />
                                                    {dayjs(createdAt).format("DD MMM YYYY")}
                                                </span>
                                            </Tooltip>
                                        )}
                                        {updatedAt && updatedAt !== createdAt && (
                                            <Tooltip title="Updated At">
                                                <span style={{
                                                    fontSize: 10, color: "#9CA3AF",
                                                    display: "flex", alignItems: "center", gap: 3,
                                                }}>
                                                    <CalendarOutlined style={{ fontSize: 10 }} />
                                                    Updated: {dayjs(updatedAt).format("DD MMM YYYY")}
                                                </span>
                                            </Tooltip>
                                        )}
                                    </div>

                                    {/* Remarks */}
                                    {remarks && (
                                        <div style={{
                                            fontSize: 11, color: "#6B7280",
                                            marginTop: 4,
                                            background: "#F3F4F6",
                                            padding: "2px 8px",
                                            borderRadius: 4,
                                            display: "inline-block",
                                        }}>
                                            {remarks}
                                        </div>
                                    )}
                                </div>

                                {/* ID chip */}
                                <Tooltip title="Model Specification ID">
                                    <span style={{
                                        fontSize: 10, color: "#9CA3AF",
                                        background: "#F3F4F6", border: "1px solid #E5E7EB",
                                        borderRadius: 4, padding: "1px 8px",
                                        flexShrink: 0, marginTop: 2,
                                        fontFamily: "monospace",
                                    }}>
                                        #{model.id}
                                    </span>
                                </Tooltip>
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}