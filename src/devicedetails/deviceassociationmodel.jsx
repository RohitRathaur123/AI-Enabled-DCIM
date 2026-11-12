import { useState, useEffect, useCallback } from "react";
import {
    Modal, Tree, Input, Button, Spin, message,
    Empty, Table, Tag, Tabs, Badge,
} from "antd";
import {
    SearchOutlined, CheckCircleOutlined,
    LinkOutlined, LaptopOutlined, DeleteOutlined,
    LoadingOutlined, ExclamationCircleOutlined,
    ApartmentOutlined,
} from "@ant-design/icons";
import { axiosdevice } from "../../config";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Utility: safely extract array from any API response shape
// ─────────────────────────────────────────────────────────────────────────────
function extractArray(res) {
    // axios interceptor may already unwrap .data, or may not
    const body = res?.data ?? res;
    if (Array.isArray(body))        return body;
    if (Array.isArray(body?.data))  return body.data;
    if (Array.isArray(body?.items)) return body.items;
    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Associate new devices
// GET  /api/DeviceAssociation/available/{parentId}
// POST /api/DeviceAssociation/{parentId}/associate
// ─────────────────────────────────────────────────────────────────────────────
function AssociateTab({ parentDeviceId, onAssociateSuccess, onClose }) {
    const [availableDevices, setAvailableDevices] = useState([]);
    const [loading,          setLoading]          = useState(false);
    const [searchText,       setSearchText]       = useState("");
    const [selectedKeys,     setSelectedKeys]     = useState([]);
    const [associating,      setAssociating]      = useState(false);

    // ── Fetch available devices ──────────────────────────────────────────────
    const loadAvailable = useCallback(() => {
        if (!parentDeviceId) return;
        setLoading(true);
        setSearchText("");
        setSelectedKeys([]);

        axiosdevice
            .get(`/DeviceAssociation/available/${parentDeviceId}`)
            .then(res => {
                const devices = extractArray(res);
                console.log("[AssociateTab] parentDeviceId:", parentDeviceId);
                console.log("[AssociateTab] available devices:", devices);
                setAvailableDevices(devices);
            })
            .catch(err => {
                console.error("[AssociateTab] load error:", err?.response ?? err);
                message.error("Failed to load available devices");
                setAvailableDevices([]);
            })
            .finally(() => setLoading(false));
    }, [parentDeviceId]);

    useEffect(() => {
        loadAvailable();
    }, [loadAvailable]);

    // ── Filter list ──────────────────────────────────────────────────────────
    const filtered = availableDevices.filter(d => {
        const q = searchText.toLowerCase();
        return (
            d.shortName?.toLowerCase().includes(q) ||
            d.serialNumber?.toLowerCase().includes(q) ||
            d.imei?.toLowerCase().includes(q) ||
            d.deviceMasterName?.toLowerCase().includes(q)
        );
    });

    // ── Build Tree nodes ─────────────────────────────────────────────────────
    // Keys MUST stay as strings (GUIDs); never convert to Number
    const treeData = filtered.map(device => ({
        key: String(device.id),
        title: (
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", paddingRight: 8,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: "#EFF6FF", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <LaptopOutlined style={{ fontSize: 12, color: "#1890ff" }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                            {device.shortName || device.longName || `Device #${device.id}`}
                        </div>
                        {device.deviceMasterName && (
                            <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                                {device.deviceMasterName}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {device.serialNumber && (
                        <Tag color="cyan" style={{ fontSize: 10, margin: 0, fontFamily: "monospace" }}>
                            S/N {device.serialNumber}
                        </Tag>
                    )}
                    {device.imei && (
                        <Tag color="geekblue" style={{ fontSize: 10, margin: 0, fontFamily: "monospace" }}>
                            {device.imei}
                        </Tag>
                    )}
                </div>
            </div>
        ),
    }));

    // ── Associate handler ────────────────────────────────────────────────────
    // POST /api/DeviceAssociation/{parentId}/associate
    // Body: { childDeviceDetailIds: ["guid1", "guid2"] }
    // Keys are already strings (GUIDs) — do NOT convert to Number
    const handleAssociate = async () => {
        if (!selectedKeys.length) {
            message.warning("Select at least one device to associate");
            return;
        }
        setAssociating(true);
        try {
            await axiosdevice.post(`/DeviceAssociation/${parentDeviceId}/associate`, {
                childDeviceDetailIds: selectedKeys, // string GUIDs as-is
            });
            message.success(`${selectedKeys.length} device(s) associated`);
            setSelectedKeys([]);
            onAssociateSuccess?.();
            onClose?.();
        } catch (err) {
            console.error("[AssociateTab] associate error:", err?.response ?? err);
            message.error(
                err?.response?.data?.message ||
                err?.response?.data?.Message ||
                err?.message ||
                "Failed to associate devices"
            );
        } finally {
            setAssociating(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Search */}
            <Input
                prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                placeholder="Search by name, serial number, IMEI…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
            />

            {/* Device tree */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <Spin size="large" />
                </div>
            ) : filtered.length === 0 ? (
                <Empty
                    description={
                        <span style={{ color: "#9CA3AF", fontSize: 13 }}>
                            {searchText
                                ? `No devices match "${searchText}"`
                                : "No devices available to associate"}
                        </span>
                    }
                    style={{ padding: "32px 0" }}
                />
            ) : (
                <div style={{
                    border: "1px solid #E5E7EB", borderRadius: 8,
                    maxHeight: 340, overflow: "auto", background: "#FAFAFA",
                }}>
                    <Tree
                        checkable
                        checkedKeys={selectedKeys}
                        onCheck={keys => setSelectedKeys(keys)}
                        treeData={treeData}
                        style={{ padding: "8px 12px" }}
                        blockNode
                    />
                </div>
            )}

            {/* Footer */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "#F8FAFF",
                borderRadius: 8, border: "1px solid #DBEAFE",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280" }}>
                    <CheckCircleOutlined
                        style={{ color: selectedKeys.length > 0 ? "#10B981" : "#D1D5DB" }}
                    />
                    <span>
                        <strong style={{ color: "#111827" }}>{selectedKeys.length}</strong>
                        {" "}device{selectedKeys.length !== 1 ? "s" : ""} selected
                    </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button size="small" onClick={onClose}>Cancel</Button>
                    <Button
                        type="primary"
                        size="small"
                        loading={associating}
                        disabled={selectedKeys.length === 0}
                        onClick={handleAssociate}
                        icon={<LinkOutlined />}
                        style={{ background: "#1890ff", borderColor: "#1890ff" }}
                    >
                        Associate{selectedKeys.length > 0 ? ` (${selectedKeys.length})` : ""}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — View & remove already associated devices
// GET   /api/DeviceAssociation/{parentId}/subdevices
// PATCH /api/DeviceAssociation/{childId}/unassociate
// ─────────────────────────────────────────────────────────────────────────────
function ViewAssociatedTab({ parentDeviceId, refreshTrigger }) {
    const [subDevices,       setSubDevices]       = useState([]);
    const [loading,          setLoading]          = useState(false);
    const [unassociatingId,  setUnassociatingId]  = useState(null);

    const loadSubDevices = useCallback(() => {
        if (!parentDeviceId) return;
        setLoading(true);
        axiosdevice
            .get(`/DeviceAssociation/${parentDeviceId}/subdevices`)
            .then(res => {
                const devices = extractArray(res);
                console.log("[ViewAssociatedTab] subdevices:", devices);
                setSubDevices(devices);
            })
            .catch(err => {
                console.error("[ViewAssociatedTab] load error:", err?.response ?? err);
                setSubDevices([]);
            })
            .finally(() => setLoading(false));
    }, [parentDeviceId]);

    useEffect(() => {
        loadSubDevices();
    }, [parentDeviceId, refreshTrigger, loadSubDevices]);

    // PATCH /api/DeviceAssociation/{childId}/unassociate
    const handleUnassociate = (deviceId, deviceName) => {
        Modal.confirm({
            title: "Remove Association",
            icon: <ExclamationCircleOutlined />,
            content: `Remove "${deviceName || `Device #${deviceId}`}" from associated devices?`,
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                setUnassociatingId(deviceId);
                try {
                    await axiosdevice.patch(`/DeviceAssociation/${deviceId}/unassociate`);
                    message.success("Device unassociated");
                    loadSubDevices(); // ← correct: call our own function
                } catch (err) {
                    console.error("[ViewAssociatedTab] unassociate error:", err?.response ?? err);
                    message.error(
                        err?.response?.data?.message ||
                        err?.response?.data?.Message ||
                        "Failed to unassociate"
                    );
                } finally {
                    setUnassociatingId(null);
                }
            },
        });
    };

    const columns = [
        {
            title: "Device",
            key: "device",
            render: (_, r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 7,
                        background: "#EFF6FF", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <LaptopOutlined style={{ fontSize: 13, color: "#1890ff" }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                            {r.shortName || r.longName || `Device #${r.id}`}
                        </div>
                        {r.deviceMasterName && (
                            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{r.deviceMasterName}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Serial No.",
            dataIndex: "serialNumber",
            key: "serialNumber",
            width: 140,
            render: sn => sn
                ? <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 11, margin: 0 }}>{sn}</Tag>
                : <span style={{ color: "#D1D5DB" }}>—</span>,
        },
        {
            title: "IMEI",
            dataIndex: "imei",
            key: "imei",
            width: 160,
            render: imei => (
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#374151" }}>
                    {imei || "—"}
                </span>
            ),
        },
        {
            title: "",
            key: "action",
            width: 48,
            render: (_, r) => (
                <Button
                    type="text"
                    danger
                    size="small"
                    title="Remove association"
                    disabled={unassociatingId !== null}
                    onClick={() => handleUnassociate(r.id, r.shortName)}
                    icon={
                        unassociatingId === r.id
                            ? <LoadingOutlined style={{ fontSize: 13 }} />
                            : <DeleteOutlined style={{ fontSize: 13 }} />
                    }
                />
            ),
        },
    ];

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spin size="large" />
        </div>
    );

    if (!subDevices.length) return (
        <Empty
            description={
                <span style={{ color: "#9CA3AF", fontSize: 13 }}>
                    No devices associated yet
                </span>
            }
            style={{ padding: "40px 0" }}
        />
    );

    return (
        <div>
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 12, padding: "8px 12px",
                background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0",
            }}>
                <CheckCircleOutlined style={{ color: "#10B981" }} />
                <span style={{ fontSize: 12, color: "#065F46" }}>
                    <strong>{subDevices.length}</strong>{" "}
                    device{subDevices.length !== 1 ? "s" : ""} currently associated
                </span>
            </div>
            <Table
                columns={columns}
                dataSource={subDevices}
                rowKey="id"
                size="small"
                pagination={false}
                style={{ borderRadius: 8, overflow: "hidden" }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — Device hierarchy tree
// GET /api/DeviceAssociation/{deviceDetailId}/tree
// ─────────────────────────────────────────────────────────────────────────────
function TreeTab({ parentDeviceId }) {
    const [treeData, setTreeData] = useState([]);
    const [loading,  setLoading]  = useState(false);

    // Recursively convert API tree nodes → Ant Design Tree nodes
    const buildTreeNodes = useCallback((nodes) => {
        if (!Array.isArray(nodes)) return [];
        return nodes.map(node => ({
            key:      String(node.id ?? node.deviceDetailId),
            title: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LaptopOutlined style={{ fontSize: 12, color: "#1890ff" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {node.shortName || node.name || `Device #${node.id}`}
                    </span>
                    {node.serialNumber && (
                        <Tag color="cyan" style={{ fontSize: 10, margin: 0, fontFamily: "monospace" }}>
                            {node.serialNumber}
                        </Tag>
                    )}
                </div>
            ),
            children: buildTreeNodes(node.children ?? node.subDevices ?? []),
        }));
    }, []);

    useEffect(() => {
        if (!parentDeviceId) return;
        setLoading(true);
        axiosdevice
            .get(`/DeviceAssociation/${parentDeviceId}/tree`)
            .then(res => {
                const body = res?.data ?? res;
                console.log("[TreeTab] tree response:", body);
                // API may return a single root node or an array
                const nodes = Array.isArray(body) ? body : [body].filter(Boolean);
                setTreeData(buildTreeNodes(nodes));
            })
            .catch(err => {
                console.error("[TreeTab] tree error:", err?.response ?? err);
                setTreeData([]);
            })
            .finally(() => setLoading(false));
    }, [parentDeviceId, buildTreeNodes]);

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spin size="large" />
        </div>
    );

    if (!treeData.length) return (
        <Empty
            description={<span style={{ color: "#9CA3AF", fontSize: 13 }}>No hierarchy data</span>}
            style={{ padding: "40px 0" }}
        />
    );

    return (
        <div style={{
            border: "1px solid #E5E7EB", borderRadius: 8,
            padding: "12px 16px", background: "#FAFAFA",
            maxHeight: 380, overflow: "auto",
        }}>
            <Tree
                treeData={treeData}
                defaultExpandAll
                showLine={{ showLeafIcon: false }}
                blockNode
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────
export default function DeviceAssociationModal({
    open,
    onClose,
    parentDeviceId,
    onAssociateSuccess,
}) {
    const [activeTab,    setActiveTab]    = useState("associate");
    const [viewRefresh,  setViewRefresh]  = useState(0);

    // Always start on the Associate tab when modal opens
    useEffect(() => {
        if (open) setActiveTab("associate");
    }, [open]);

    const handleAssociateSuccess = () => {
        setViewRefresh(p => p + 1);
        onAssociateSuccess?.();
    };

    const tabs = [
        {
            key: "associate",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LinkOutlined />
                    Associate Devices
                </span>
            ),
            children: (
                <AssociateTab
                    parentDeviceId={parentDeviceId}
                    onAssociateSuccess={handleAssociateSuccess}
                    onClose={onClose}
                />
            ),
        },
        {
            key: "view",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LaptopOutlined />
                    Associated Devices
                </span>
            ),
            children: (
                <ViewAssociatedTab
                    parentDeviceId={parentDeviceId}
                    refreshTrigger={viewRefresh}
                />
            ),
        },
        {
            key: "tree",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ApartmentOutlined />
                    Hierarchy
                </span>
            ),
            children: (
                <TreeTab parentDeviceId={parentDeviceId} />
            ),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={760}
            footer={null}
            destroyOnClose     // remounts tabs fresh every open
            styles={{ body: { paddingTop: 0 } }}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "#EFF6FF", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <LinkOutlined style={{ color: "#1890ff", fontSize: 17 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", lineHeight: 1.2 }}>
                            Device Association
                        </div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>
                            Link, view, or browse devices connected to this unit
                        </div>
                    </div>
                </div>
            }
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabs}
                size="small"
                style={{ marginTop: 4 }}
            />
        </Modal>
    );
}