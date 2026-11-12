import { useState, useEffect, useCallback } from "react";
import { Card, Button, Space, List, Empty, Spin, message, Modal, Tooltip, Tag, Table } from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    EyeOutlined,
    LaptopOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import React from "react";      
import {axiosdevice} from "../../config";

// ── View Associated Devices Modal ────────────────────────────────────────────
function ViewAssociatedModal({ open, onClose, parentDeviceId, parentName }) {
    const [subDevices, setSubDevices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !parentDeviceId) return;
        setLoading(true);
        axiosdevice
            .get(`/DeviceAssociation/${parentDeviceId}/subdevices`)
            .then(res => {
                const body = res?.data ?? res;
                const devices = Array.isArray(body?.data)
                    ? body.data
                    : Array.isArray(body)
                    ? body
                    : [];
                setSubDevices(devices);
            })
            .catch(() => {
                message.error("Failed to load associated devices");
                setSubDevices([]);
            })
            .finally(() => setLoading(false));
    }, [open, parentDeviceId]);

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 60,
            render: (id) => (
                <span style={{
                    fontFamily: "monospace", fontSize: 11,
                    color: "#6B7280", background: "#F3F4F6",
                    padding: "1px 6px", borderRadius: 4,
                }}>
                    #{id}
                </span>
            ),
        },
        {
            title: "Device Name",
            dataIndex: "shortName",
            key: "shortName",
            render: (name) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: "#EFF6FF", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <LaptopOutlined style={{ fontSize: 13, color: "#1890ff" }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                        {name || "—"}
                    </span>
                </div>
            ),
        },
        {
            title: "Serial Number",
            dataIndex: "serialNumber",
            key: "serialNumber",
            render: (sn) => (
                <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 11, margin: 0 }}>
                    {sn || "—"}
                </Tag>
            ),
        },
        {
            title: "IMEI",
            dataIndex: "imei",
            key: "imei",
            render: (imei) => (
                <span style={{
                    fontFamily: "monospace", fontSize: 11,
                    color: "#374151",
                }}>
                    {imei || "—"}
                </span>
            ),
        },
        {
            title: "Device Master",
            dataIndex: "deviceMasterName",
            key: "deviceMasterName",
            render: (name) => (
                <span style={{ fontSize: 12, color: "#6B7280" }}>{name || "—"}</span>
            ),
        },
    ];

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "#EFF6FF", display: "flex",
                        alignItems: "center", justifyContent: "center",
                    }}>
                        <LinkOutlined style={{ color: "#1890ff", fontSize: 15 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                            Associated Devices
                        </div>
                        {parentName && (
                            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>
                                Parent: {parentName}
                            </div>
                        )}
                    </div>
                    <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>
                        {subDevices.length} device{subDevices.length !== 1 ? "s" : ""}
                    </Tag>
                </div>
            }
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>Close</Button>,
            ]}
            width={760}
        >
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <Spin size="large" />
                </div>
            ) : subDevices.length === 0 ? (
                <Empty
                    description={
                        <span style={{ color: "#9CA3AF", fontSize: 13 }}>
                            No devices associated yet
                        </span>
                    }
                    style={{ padding: "40px 0" }}
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={subDevices}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    style={{ marginTop: 4 }}
                    rowClassName={() => "assoc-row"}
                    onRow={() => ({
                        style: { cursor: "default" },
                    })}
                />
            )}
        </Modal>
    );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export default function DeviceAssociationPanel({
    parentDeviceId,
    parentName,
    onOpenAssociateModal,
    refreshTrigger,
}) {
    const [subDevices, setSubDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unassociatingId, setUnassociatingId] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    // ✅ Fix



    const fetchSubDevices = useCallback(async () => {
        if (!parentDeviceId) return;
        setLoading(true);
        try {
            const res = await axiosdevice.get(
                `/DeviceAssociation/${parentDeviceId}/subdevices`
            );
            const body = res?.data ?? res;
            const devices = Array.isArray(body?.data) ? body.data : [];
            setSubDevices(devices);
        } catch {
            setSubDevices([]);
        } finally {
            setLoading(false);
        }
    });

    

useEffect(() => {
    fetchSubDevices();
}, [parentDeviceId, refreshTrigger, fetchSubDevices]);

  
    const handleUnassociate = (deviceId, deviceName) => {
        Modal.confirm({
            title: "Unassociate Device",
            icon: <ExclamationCircleOutlined />,
            content: `Remove "${deviceName}" from associated devices?`,
            okText: "Unassociate",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                setUnassociatingId(deviceId);
                try {
                    await axiosdevice.patch(`/DeviceAssociation/${deviceId}/unassociate`);
                    message.success("Device unassociated successfully");
                    fetchSubDevices();
                } catch (err) {
                    message.error(err?.response?.data?.message || "Failed to unassociate device");
                } finally {
                    setUnassociatingId(null);
                }
            },
        });
    };

    return (
        <>
            <Card
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LinkOutlined style={{ color: "#1890ff", fontSize: 13 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                            Associated Devices
                        </span>
                        <Tag
                            color={subDevices.length > 0 ? "blue" : "default"}
                            style={{ fontSize: 11, padding: "1px 8px", margin: 0 }}
                        >
                            {subDevices.length}
                        </Tag>
                    </div>
                }
                extra={
                    <Space size={6}>
                        {subDevices.length > 0 && (
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => setShowViewModal(true)}
                                style={{
                                    fontSize: 11, height: 26,
                                    color: "#1890ff", borderColor: "#1890ff",
                                }}
                            >
                                View All
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="small"
                            onClick={() => onOpenAssociateModal?.()}
                            style={{
                                background: "#1890ff", borderColor: "#1890ff",
                                fontSize: 11, height: 26,
                            }}
                        >
                            Add Device
                        </Button>
                    </Space>
                }
                size="small"
                style={{
                    marginBottom: 16,
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                }}
                bodyStyle={{ padding: subDevices.length === 0 ? "0" : "0" }}
            >
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                        <Spin />
                    </div>
                ) : subDevices.length === 0 ? (
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "28px 16px", gap: 8,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: "#F3F4F6", display: "flex",
                            alignItems: "center", justifyContent: "center",
                        }}>
                            <LinkOutlined style={{ fontSize: 18, color: "#D1D5DB" }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>No associated devices</span>
                        <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => onOpenAssociateModal?.()}
                            style={{ fontSize: 11, color: "#6B7280", borderColor: "#D1D5DB" }}
                        >
                            Associate a device
                        </Button>
                    </div>
                ) : (
                    <List
                        dataSource={subDevices}
                        renderItem={(device) => (
                            <List.Item
                                key={device.id}
                                style={{
                                    padding: "10px 14px",
                                    borderBottom: "1px solid #F3F4F6",
                                }}
                            >
                                {/* Left: icon + info */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 7,
                                        background: "#EFF6FF", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <LaptopOutlined style={{ fontSize: 14, color: "#1890ff" }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                                                {device.shortName}
                                            </span>
                                            <Tag color="default" style={{ fontSize: 10, margin: 0, padding: "0 5px" }}>
                                                #{device.id}
                                            </Tag>
                                        </div>
                                        <div style={{ display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                                            {device.serialNumber && (
                                                <span style={{ fontSize: 11, color: "#6B7280" }}>
                                                    <span style={{ color: "#9CA3AF" }}>S/N </span>
                                                    <code style={{ fontSize: 10, color: "#374151" }}>
                                                        {device.serialNumber}
                                                    </code>
                                                </span>
                                            )}
                                            {device.imei && (
                                                <span style={{ fontSize: 11, color: "#6B7280" }}>
                                                    <span style={{ color: "#9CA3AF" }}>IMEI </span>
                                                    <code style={{ fontSize: 10, color: "#374151" }}>
                                                        {device.imei}
                                                    </code>
                                                </span>
                                            )}
                                            {device.deviceMasterName && (
                                                <Tag color="geekblue" style={{ fontSize: 10, margin: 0 }}>
                                                    {device.deviceMasterName}
                                                </Tag>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: unassociate */}
                                <Tooltip title="Unassociate">
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={
                                            unassociatingId === device.id
                                                ? <LoadingOutlined style={{ fontSize: 13 }} />
                                                : <DeleteOutlined style={{ fontSize: 13 }} />
                                        }
                                        disabled={unassociatingId !== null}
                                        onClick={() => handleUnassociate(device.id, device.shortName)}
                                        style={{ flexShrink: 0 }}
                                    />
                                </Tooltip>
                            </List.Item>
                        )}
                        style={{ margin: 0 }}
                    />
                )}
            </Card>

            {/* View All Modal */}
            <ViewAssociatedModal
                open={showViewModal}
                onClose={() => setShowViewModal(false)}
                parentDeviceId={parentDeviceId}
                parentName={parentName}
            />
        </>
    );
}