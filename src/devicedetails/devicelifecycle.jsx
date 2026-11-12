
import { useState, useEffect, useCallback } from "react";
import React from "react";
import {
    Modal, Select, Input, Button, Space, Tag, Typography,
    message, Spin, Tabs, Badge, Empty,
} from "antd";
import {
    HistoryOutlined, EnvironmentOutlined, UserOutlined,
    CalendarOutlined, PlusCircleOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { axiosdevice } from "../../config";

const { Text } = Typography;

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG = {
    Received:       { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "📦" },
    Installed:      { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🔧" },
    Commissioned:   { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "✅" },
    Decommissioned: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "🚫" },
    UnderRepair:    { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "🛠️" },
    Disposed:       { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "🗑️" },
    InStorage:      { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", icon: "📦" },
};

function StageBadge({ stage }) {
    const cfg = STAGE_CONFIG[stage] || { color: "#374151", bg: "#F3F4F6", border: "#E5E7EB", icon: "●" };
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 600, padding: "3px 10px",
            borderRadius: 99, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
        }}>
            {cfg.icon} {stage}
        </span>
    );
}

// ── Tab 1: History ────────────────────────────────────────────────────────────
function HistoryTab({ record }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(() => {
        if (!record?.id) return;
        setLoading(true);
        axiosdevice.get(`/DeviceDetail/${record.id}/lifecycle`)
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
    }, [record?.id]);

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <div style={{ textAlign: "center", padding: 48 }}>
            <Spin tip="Loading history…" />
        </div>
    );

    if (!history.length) return (
        <Empty
            description={<span style={{ color: "#9CA3AF", fontSize: 13 }}>No lifecycle history yet</span>}
            style={{ padding: "40px 0" }}
        />
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.map((item, idx) => {
                const stage  = item.stage || item.stageName || item.lifecycleStage || "—";
                const cfg    = STAGE_CONFIG[stage] || STAGE_CONFIG["Received"];
                const isLast = idx === history.length - 1;
                return (
                    <div key={item.id || idx} style={{ display: "flex", gap: 12, paddingBottom: isLast ? 0 : 18, position: "relative" }}>
                        {!isLast && (
                            <div style={{
                                position: "absolute", left: 9, top: 22,
                                width: 2, height: "calc(100% - 4px)",
                                background: "#E5E7EB",
                            }} />
                        )}
                        {/* dot */}
                        <div style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                            background: cfg.color, marginTop: 3, zIndex: 1,
                            boxShadow: `0 0 0 3px ${cfg.bg}`,
                        }} />
                        {/* card */}
                        <div style={{
                            flex: 1, background: "#FAFAFA", borderRadius: 10,
                            padding: "10px 14px", border: "1px solid #F3F4F6",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                                <StageBadge stage={stage} />
                                {(item.changedAt || item.date || item.createdAt) && (
                                    <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                                        <CalendarOutlined style={{ fontSize: 10 }} />
                                        {dayjs(item.changedAt || item.date || item.createdAt).format("DD MMM YYYY HH:mm")}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                                {(item.changedBy || item.changedByName || item.userName) && (
                                    <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                        <UserOutlined style={{ fontSize: 10 }} />
                                        {item.changedBy || item.changedByName || item.userName}
                                    </span>
                                )}
                                {(item.location || item.locationName) && (
                                    <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                        <EnvironmentOutlined style={{ fontSize: 10 }} />
                                        {item.location || item.locationName}
                                    </span>
                                )}
                                {(item.state || item.status) && (
                                    <Tag color={(item.state || item.status) === "Active" ? "success" : "default"} style={{ fontSize: 10, margin: 0 }}>
                                        {item.state || item.status}
                                    </Tag>
                                )}
                            </div>
                            {item.notes && (
                                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, fontStyle: "italic", borderTop: "1px solid #F3F4F6", paddingTop: 6 }}>
                                    {item.notes}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tab 2: Add Stage Form ─────────────────────────────────────────────────────
function AddStageTab({ record, onSuccess }) {
    const [stages,    setStages]    = useState([]);
    const [users,     setUsers]     = useState([]);
    const [locations, setLocations] = useState([]);
    const [ddLoading, setDdLoading] = useState(false);

    const [newStage,   setNewStage]   = useState(undefined);
    const [changedBy,  setChangedBy]  = useState(undefined);
    const [location,   setLocation]   = useState(undefined);
    const [notes,      setNotes]      = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setDdLoading(true);
        Promise.allSettled([
            axiosdevice.get("/LifecycleStage"),
            axiosdevice.get("/User"),
            axiosdevice.get("/Location"),
        ]).then(([stagesRes, usersRes, locsRes]) => {
            const toArr = r => {
                const v = r.status === "fulfilled" ? (r.value?.data ?? r.value) : [];
                return Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : Array.isArray(v?.items) ? v.items : [];
            };
            const rawStages = toArr(stagesRes);
            setStages(rawStages.length > 0 ? rawStages : [
                { id: "Received", name: "Received" },
                { id: "Installed", name: "Installed" },
                { id: "Commissioned", name: "Commissioned" },
                { id: "Decommissioned", name: "Decommissioned" },
                { id: "UnderRepair", name: "Under Repair" },
                { id: "InStorage", name: "In Storage" },
                { id: "Disposed", name: "Disposed" },
            ]);
            setUsers(toArr(usersRes));
            setLocations(toArr(locsRes));
        }).finally(() => setDdLoading(false));
    }, [record?.id]);

    const handleSubmit = async () => {
        if (!newStage)  { message.error("Lifecycle Stage is required"); return; }
        if (!changedBy) { message.error("Changed By is required"); return; }
        if (!location)  { message.error("Location is required"); return; }
        setSubmitting(true);
        try {
            await axiosdevice.post(`/DeviceDetail/${record.id}/lifecycle`, {
                stage: newStage, changedBy, location, notes: notes.trim() || null,
            });
            message.success("Lifecycle stage updated");
            setNewStage(undefined); setChangedBy(undefined);
            setLocation(undefined); setNotes("");
            onSuccess?.();
        } catch (err) {
            message.error(err?.response?.data?.message || "Update failed");
        } finally {
            setSubmitting(false);
        }
    };

    const fieldStyle = { marginBottom: 14 };
    const labelStyle = { fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block", color: "#374151" };

    return (
        <div>
            {/* Current stage info */}
            {(record?.lifecycleStage || record?.stage || record?.currentStage) && (
                <div style={{
                    background: "#F8FAFF", border: "1px solid #DBEAFE",
                    borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Current Stage:</span>
                    <StageBadge stage={record.lifecycleStage || record.stage || record.currentStage} />
                </div>
            )}

            <div style={fieldStyle}>
                <span style={labelStyle}>New Stage <span style={{ color: "#EF4444" }}>*</span></span>
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select new lifecycle stage"
                    value={newStage}
                    onChange={setNewStage}
                    loading={ddLoading}
                    options={stages.map(s => ({
                        value: s.id || s.name || s.stageName,
                        label: (
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span>{STAGE_CONFIG[s.name || s.stageName]?.icon || "●"}</span>
                                <span>{s.name || s.stageName || s.id}</span>
                            </span>
                        ),
                    }))}
                />
            </div>

            <div style={fieldStyle}>
                <span style={labelStyle}>Changed By <span style={{ color: "#EF4444" }}>*</span></span>
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select user"
                    value={changedBy}
                    onChange={setChangedBy}
                    showSearch optionFilterProp="label"
                    loading={ddLoading}
                    options={users.map(u => ({
                        value: u.id || u.userId,
                        label: u.name || u.fullName || u.userName || u.email || String(u.id),
                    }))}
                />
            </div>

            <div style={fieldStyle}>
                <span style={labelStyle}>Location <span style={{ color: "#EF4444" }}>*</span></span>
                <Select
                    style={{ width: "100%" }}
                    placeholder="Select location"
                    value={location}
                    onChange={setLocation}
                    showSearch optionFilterProp="label"
                    loading={ddLoading}
                    options={locations.map(l => ({
                        value: l.id || l.locationId,
                        label: l.name || l.locationName || l.location || String(l.id),
                    }))}
                />
            </div>

            <div style={fieldStyle}>
                <span style={labelStyle}>Notes</span>
                <Input.TextArea
                    rows={3}
                    placeholder="Optional notes about this stage change…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ borderRadius: 8 }}
                />
            </div>

            <Button
                type="primary"
                block
                loading={submitting}
                onClick={handleSubmit}
                icon={<HistoryOutlined />}
                style={{
                    background: "#EA580C", borderColor: "#EA580C",
                    height: 40, borderRadius: 8, fontWeight: 600, fontSize: 14,
                }}
            >
                Update Lifecycle Stage
            </Button>
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function DeviceLifecycleModal({ open, onClose, record }) {
    const [activeTab, setActiveTab] = useState("history");
    const [historyKey, setHistoryKey] = useState(0);

    useEffect(() => {
        if (open) setActiveTab("history");
    }, [open]);

    if (!record) return null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
            style={{ top: 24 }}
            destroyOnClose
            styles={{ body: { padding: 0 } }}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "#FFF7ED", border: "1px solid #FED7AA",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <HistoryOutlined style={{ color: "#EA580C", fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                            Lifecycle Management
                        </div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>
                            {record.shortName || record.longName || `Device #${record.id}`}
                        </div>
                    </div>
                </div>
            }
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ padding: "0 20px" }}
                tabBarStyle={{ marginBottom: 0 }}
                items={[
                    {
                        key: "history",
                        label: (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <UnorderedListOutlined />
                                History
                            </span>
                        ),
                        children: (
                            <div style={{ padding: "16px 0", maxHeight: "60vh", overflowY: "auto" }}>
                                <HistoryTab key={historyKey} record={record} />
                            </div>
                        ),
                    },
                    {
                        key: "add",
                        label: (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <PlusCircleOutlined />
                                Add Stage
                            </span>
                        ),
                        children: (
                            <div style={{ padding: "16px 0" }}>
                                <AddStageTab
                                    record={record}
                                    onSuccess={() => {
                                        setHistoryKey(k => k + 1);
                                        setActiveTab("history");
                                    }}
                                />
                            </div>
                        ),
                    },
                ]}
            />
        </Modal>
    );
}

