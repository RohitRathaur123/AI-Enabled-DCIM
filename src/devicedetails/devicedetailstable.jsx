import { useState } from "react";
import React from "react";
import { Table, Space, Button, Tooltip, Tag, Modal, Form, Input, Select, DatePicker, message } from "antd";
import {
    EditOutlined, DeleteOutlined, EyeOutlined,
    WifiOutlined, MobileOutlined, QrcodeOutlined,
    HistoryOutlined, PlusOutlined, MinusOutlined,
    CalendarOutlined, EnvironmentOutlined,
    LinkOutlined, FileTextOutlined,
    LaptopOutlined, BarcodeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { axiosdevice } from "../../config";

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
    blue:       "#2563EB",
    blueLight:  "#EFF6FF",
    blueBorder: "#BFDBFE",
    teal:       "#0D9488",
    tealLight:  "#F0FDFA",
    orange:     "#EA580C",
    orangeLight:"#FFF7ED",
    green:      "#16A34A",
    greenLight: "#F0FDF4",
    purple:     "#7C3AED",
    purpleLight:"#F5F3FF",
    gray:       "#6B7280",
    border:     "#E5E7EB",
};

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG = {
    Received:        { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "📦" },
    Installed:       { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🔧" },
    Commissioned:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "✅" },
    Decommissioned:  { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "🚫" },
    UnderRepair:     { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "🛠️" },
    Disposed:        { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "🗑️" },
    InStorage:       { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", icon: "📦" },
};

function StageBadge({ stage }) {
    const cfg = STAGE_CONFIG[stage] || { color: "#374151", bg: "#F3F4F6", border: "#E5E7EB", icon: "●" };
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, padding: "2px 8px",
            borderRadius: 99, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
        }}>
            {cfg.icon} {stage}
        </span>
    );
}

// ── Lifecycle Timeline Component ──────────────────────────────────────────────
function LifecycleTimeline({ deviceId }) {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (!deviceId) return;
        setLoading(true);
        axiosdevice.get(`/DeviceDetail/${deviceId}/lifecycle`)
            .then(res => {
                const body = res?.data ?? res;
                const arr = Array.isArray(body) ? body
                    : Array.isArray(body?.data)    ? body.data
                    : Array.isArray(body?.items)   ? body.items
                    : Array.isArray(body?.history) ? body.history
                    : [];
                setHistory(arr);
            })
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [deviceId]);

    if (loading) return (
        <div style={{ padding: 8, color: C.gray, fontSize: 12, textAlign: "center" }}>
            Loading...
        </div>
    );
    if (!history || history.length === 0) return (
        <div style={{
            padding: 8, textAlign: "center",
            color: C.gray, fontSize: 12,
        }}>
            No history yet
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.slice(0, 3).map((item, idx) => {
                const stage = item.stage || item.stageName || item.lifecycleStage || "—";
                const cfg   = STAGE_CONFIG[stage] || STAGE_CONFIG["Received"];
                const isLast = idx === Math.min(history.length - 1, 2);
                return (
                    <div key={item.id || idx} style={{ display: "flex", gap: 8, paddingBottom: isLast ? 0 : 10, position: "relative" }}>
                        {!isLast && (
                            <div style={{
                                position: "absolute", left: 7, top: 18,
                                width: 2, height: "calc(100% - 4px)",
                                background: C.border,
                            }} />
                        )}
                        <div style={{
                            width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                            background: cfg.color, marginTop: 2, zIndex: 1,
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", alignItems: "center" }}>
                                <StageBadge stage={stage} />
                                {(item.changedAt || item.date || item.createdAt) && (
                                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                                        {dayjs(item.changedAt || item.date || item.createdAt).format("DD MMM YYYY")}
                                    </span>
                                )}
                            </div>
                            {item.notes && (
                                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, fontStyle: "italic" }}>
                                    {item.notes}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {history.length > 3 && (
                <div style={{ fontSize: 10, color: C.blue, textAlign: "center", marginTop: 4 }}>
                    +{history.length - 3} more
                </div>
            )}
        </div>
    );
}

// ── Expanded Row Content ────────────────────────────────────────────────────
function ExpandedDeviceDetails({ record, onLifecycle, onAssociate, onAssignLocations }) {
    const [loading, setLoading] = useState({
        location: false,
        associate: false,
        lifecycle: false
    });

    return (
        <div style={{ 
            padding: "16px 24px 20px 24px",
            background: "#F8FAFC",
            borderTop: `1px solid ${C.border}`,
        }}>
            {/* 3 Professional Action Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
            }}>
                {/* Location Card */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: "16px 20px",
                        border: `1px solid ${C.border}`,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    onClick={() => onAssignLocations(record)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        e.currentTarget.style.borderColor = C.blue;
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: "#F0FDF4",
                            border: `1px solid #BBF7D0`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <EnvironmentOutlined style={{ color: C.green, fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                Location
                            </div>
                            <div style={{ fontSize: 11, color: C.gray }}>
                                Manage device location
                            </div>
                        </div>
                    </div>
                    <div style={{
                        fontSize: 13, color: "#374151",
                        padding: "6px 12px",
                        background: "#F8FAFC",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                    }}>
                        {record.location ? (
                            typeof record.location === 'string' 
                                ? record.location 
                                : record.location.name || record.location.locationName || "Not set"
                        ) : "Not set"}
                    </div>
                </div>

                {/* Associated Devices Card */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: "16px 20px",
                        border: `1px solid ${C.border}`,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    onClick={() => onAssociate(record)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        e.currentTarget.style.borderColor = "#0891B2";
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: "#ECFEFF",
                            border: `1px solid #A5F3FC`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <LinkOutlined style={{ color: "#0891B2", fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                Associated Devices
                            </div>
                            <div style={{ fontSize: 11, color: C.gray }}>
                                Link/unlink devices
                            </div>
                        </div>
                    </div>
                    <div style={{
                        fontSize: 13, color: "#374151",
                        padding: "6px 12px",
                        background: "#F8FAFC",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        minHeight: 32,
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 4,
                    }}>
                        {record.associatedDevices && record.associatedDevices.length > 0 ? (
                            <>
                                {record.associatedDevices.slice(0, 2).map((device, idx) => (
                                    <Tag 
                                        key={idx} 
                                        color="cyan" 
                                        style={{ fontSize: 11, margin: 0 }}
                                    >
                                        {device.shortName || device.name || `#${device.id}`}
                                    </Tag>
                                ))}
                                {record.associatedDevices.length > 2 && (
                                    <Tag color="default" style={{ fontSize: 11, margin: 0 }}>
                                        +{record.associatedDevices.length - 2}
                                    </Tag>
                                )}
                            </>
                        ) : (
                            <span style={{ color: "#9CA3AF", fontSize: 12 }}>No associations</span>
                        )}
                    </div>
                </div>

                {/* Lifecycle Card */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: "16px 20px",
                        border: `1px solid ${C.border}`,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    onClick={() => onLifecycle(record)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        e.currentTarget.style.borderColor = C.orange;
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: "#FFF7ED",
                            border: `1px solid #FED7AA`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <HistoryOutlined style={{ color: C.orange, fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                Lifecycle
                            </div>
                            <div style={{ fontSize: 11, color: C.gray }}>
                                Update device stage
                            </div>
                        </div>
                    </div>
                    <div style={{
                        padding: "4px 12px",
                        background: "#F8FAFC",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                    }}>
                        <LifecycleTimeline deviceId={record.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function DeviceDetailTable({
    dataSource, loading,
    onView, onEdit, onDelete, onShowQR, onLifecycle, onAssociate,
    onUploadFiles,
    onAssignLocations,
}) {
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    const handleExpand = (expanded, record) => {
        if (expanded) {
            setExpandedRowKeys([record.id]);
        } else {
            setExpandedRowKeys([]);
        }
    };

    const columns = [
        {
            title: "",
            key: "expand",
            width: 40,
            fixed: "left",
            render: (_, record) => {
                const isExpanded = expandedRowKeys.includes(record.id);
                return (
                    <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExpand(!isExpanded, record);
                            }}
                            style={{
                                width: 26, height: 26, borderRadius: 7,
                                background: isExpanded ? C.blue : C.blueLight,
                                border: `1px solid ${isExpanded ? C.blue : C.blueBorder}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", padding: 0,
                                transition: "all 0.15s",
                            }}
                        >
                            {isExpanded ? (
                                <MinusOutlined style={{ fontSize: 11, color: "#fff" }} />
                            ) : (
                                <PlusOutlined style={{ fontSize: 11, color: C.blue }} />
                            )}
                        </button>
                    </Tooltip>
                );
            },
        },
        {
            title: "Device",
            key: "device",
            width: 180,
            sorter: (a, b) => (a.shortName || "").localeCompare(b.shortName || ""),
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: C.blueLight, border: `1px solid ${C.blueBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <LaptopOutlined style={{ fontSize: 13, color: C.blue }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            {record.shortName || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>—</span>}
                        </div>
                        {record.longName && (
                            <div style={{ fontSize: 10, color: C.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {record.longName}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Serial Number",
            key: "serialNumber",
            width: 140,
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <BarcodeOutlined style={{ fontSize: 12, color: C.gray }} />
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#374151" }}>
                        {record.serialNumber || <span style={{ color: "#D1D5DB" }}>—</span>}
                    </span>
                </div>
            ),
        },
        {
            title: "IMEI", 
            dataIndex: "imei", 
            key: "imei", 
            width: 150,
            render: text => (
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151" }}>
                    {text || <span style={{ color: "#D1D5DB" }}>—</span>}
                </span>
            ),
        },
        {
            title: "MAC", 
            dataIndex: "macAddress", 
            key: "macAddress", 
            width: 130,
            render: text => (
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151" }}>
                    {text || <span style={{ color: "#D1D5DB" }}>—</span>}
                </span>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 220,
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Edit Device">
                        <Button
                            type="text" size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            style={{ color: C.blue }}
                        />
                    </Tooltip>
                    <Tooltip title="Generate QR">
                        <Button
                            type="text" size="small"
                            icon={<QrcodeOutlined />}
                            onClick={() => onShowQR(record)}
                            style={{ color: C.purple }}
                        />
                    </Tooltip>
                    <Tooltip title="Upload Files">
                        <Button
                            type="text" size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => onUploadFiles(record)}
                            style={{ color: C.teal }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Device">
                        <Button
                            type="text" size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete(record)}
                            style={{ color: "#DC2626" }}
                        />
                    </Tooltip>
                    <Tooltip title="View Details">
                        <Button
                            type="text" size="small"
                            icon={<EyeOutlined />}
                            onClick={() => onView(record)}
                            style={{ color: C.gray }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ overflowX: "auto", width: "100%" }}>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{ x: 1000 }}
                    expandable={{
                        expandedRowKeys: expandedRowKeys,
                        onExpand: handleExpand,
                        expandedRowRender: (record) => (
                            <ExpandedDeviceDetails
                                record={record}
                                onLifecycle={onLifecycle}
                                onAssociate={onAssociate}
                                onAssignLocations={onAssignLocations}
                            />
                        ),
                        rowExpandable: () => true,
                        expandIcon: () => null,
                    }}
                />
            </div>

            <style>{`
                .ant-table-wrapper { overflow: hidden !important; }
                .ant-table { overflow: auto !important; }
            `}</style>
        </>
    );
}