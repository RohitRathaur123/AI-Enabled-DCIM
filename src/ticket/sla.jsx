import React, { useState, useEffect } from "react";
import {
    Table, Alert, Row, Col, Typography, Space,
    Button, Input, Tooltip, Badge, Tag, message, InputNumber
} from "antd";
import {
    EditOutlined, DeleteOutlined, ReloadOutlined,
    PlusOutlined, SearchOutlined, ExclamationCircleOutlined,
    CloseOutlined, ClockCircleOutlined, FieldTimeOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import { axiosTicket } from "../../config";

const { Title, Text } = Typography;

// Converts raw minutes into a readable "Xh Ym" label
const formatMinutes = (mins) => {
    if (mins == null) return "-";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

const Sla = () => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [slaToDelete, setSlaToDelete] = useState(null);
    const [editingSla, setEditingSla] = useState(null);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");

    // dataitems = list of SLA policies (renamed from starter's "data")
    const [dataitems, setdataitems] = useState([]);

    const emptyForm = { name: "", resolutionTimeInMinutes: 0 };
    const [formdata, setformdata] = useState(emptyForm);

    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(t);
        }
    }, [error]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setformdata((prev) => ({ ...prev, [name]: value }));
    };

    const handleMinutesChange = (value) => {
        setformdata((prev) => ({ ...prev, resolutionTimeInMinutes: value ?? 0 }));
    };

    const openAddModal = () => {
        setEditingSla(null);
        setformdata(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (sla) => {
        setEditingSla(sla);
        setformdata({ name: sla.name, resolutionTimeInMinutes: sla.resolutionTimeInMinutes });
        setShowModal(true);
    };

    const fetchdataitems = async () => {
        try {
            const res = await axiosTicket.get("/sla");
            console.log("API response:", res); // res khud hi data hai (interceptor already .data nikal chuka hai)
            setdataitems(Array.isArray(res) ? res : (res?.items || []));
        } catch (err) {
            console.error("Failed to fetch SLAs:", err);
            setError("Failed to load SLA policies");
            setdataitems([]); // fallback empty array, taaki .filter crash na kare
        }
    };

    useEffect(() => {
        fetchdataitems();
    }, []);

    const openDeleteModal = (sla) => { setSlaToDelete(sla); setShowDeleteModal(true); };
    const closeModal = () => setShowModal(false);
    const closeDeleteModal = () => { setShowDeleteModal(false); setSlaToDelete(null); };

    const handleDelete = async () => {
        if (!slaToDelete) return;
        try {
            await axiosTicket.delete(`/sla/${slaToDelete.id}`);
            message.success("SLA deleted!");
            closeDeleteModal();
            fetchdataitems(); // list refresh
        } catch (err) {
            console.error("Failed to delete SLA:", err);
            message.error(err?.message || "Could not delete SLA");
        }
    };

    const handleSubmit = async () => {
        if (!formdata.name.trim() || !formdata.resolutionTimeInMinutes || formdata.resolutionTimeInMinutes <= 0) {
            setError("Please enter a name and a resolution time greater than 0");
            return;
        }

        // Prevent duplicate SLA names
        const nameClash = dataitems.some(
            (s) => s.name.toLowerCase() === formdata.name.trim().toLowerCase() &&
                (!editingSla || s.id !== editingSla.id)
        );
        if (nameClash) {
            setError("An SLA with this name already exists");
            return;
        }

        setLoading(true);
        try {
            if (editingSla) {
                await axiosTicket.put(`/sla/${editingSla.id}`, formdata);
                message.success("SLA updated!");
            } else {
                await axiosTicket.post("/sla", formdata);
                message.success("SLA created!");
            }
            closeModal();
            fetchdataitems(); // list refresh
        } catch (err) {
            console.error("Failed to save SLA:", err);
            setError(err?.message || "Could not save SLA");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = dataitems.filter((s) =>
        !searchText || s.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const totalSlas = dataitems.length;
    const fastestSla = dataitems.length
        ? dataitems.reduce((min, s) => (s.resolutionTimeInMinutes < min.resolutionTimeInMinutes ? s : min))
        : null;
    const avgMinutes = dataitems.length
        ? Math.round(dataitems.reduce((sum, s) => sum + s.resolutionTimeInMinutes, 0) / dataitems.length)
        : 0;

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 50, sorter: (a, b) => a.id - b.id },
        {
            title: "SLA Name", dataIndex: "name", key: "name", width: 220,
            render: (text) => (
                <Space size={6}>
                    <ThunderboltOutlined style={{ color: "#1890ff", fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Resolution Time", dataIndex: "resolutionTimeInMinutes", key: "resolutionTimeInMinutes", width: 150,
            sorter: (a, b) => a.resolutionTimeInMinutes - b.resolutionTimeInMinutes,
            render: (mins) => (
                <Tag color="blue" style={{ fontSize: 11 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {formatMinutes(mins)}
                </Tag>
            ),
        },
        {
            title: "Minutes", dataIndex: "resolutionTimeInMinutes", key: "minutesRaw", width: 90,
            render: (mins) => <Text type="secondary" style={{ fontSize: 11 }}>{mins} min</Text>,
        },
        {
            title: "Actions", key: "actions", width: 100, fixed: "right",
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: "#1890ff", padding: "0 4px" }} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(record)} style={{ color: "#ff4d4f", padding: "0 4px" }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                        <FieldTimeOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        SLA Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Define resolution time policies for tickets</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
                        Create SLA
                    </Button>
                    <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 6, padding: "4px 12px", fontSize: 12, flexShrink: 0 }} />}

            {/* STAT CARDS */}
            <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
                {[
                    { label: "Total SLAs", value: totalSlas, color: "#1890ff", icon: <FieldTimeOutlined /> },
                    { label: "Fastest SLA", value: fastestSla ? formatMinutes(fastestSla.resolutionTimeInMinutes) : "-", color: "#ff4d4f", icon: <ThunderboltOutlined /> },
                    { label: "Avg Resolution", value: formatMinutes(avgMinutes), color: "#52c41a", icon: <ClockCircleOutlined /> },
                ].map(({ label, value, color, icon }) => (
                    <Col key={label} span={8}>
                        <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 14px", borderTop: `3px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 22, color }}>{icon}</span>
                            <div>
                                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>{label}</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            {/* SEARCH */}
            <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Search by SLA name..."
                            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear size="small"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 12, color: "#888" }}>Showing {filteredData.length} of {totalSlas}</Text>
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>SLA Policies</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff" }} />
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={filteredData} loading={loading}
                        bordered={false} rowKey="id" size="small"
                        scroll={{ x: 700 }}
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} SLAs`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
                        style={{ fontSize: 12 }}
                        locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No SLA policies found</div> }}
                    />
                </div>
            </div>


            {/* ADD / EDIT MODAL */}
            {showModal && (
                <>
                    <div style={backdropStyle} onClick={closeModal} />
                    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px 24px", borderRadius: 10, width: "460px", maxWidth: "96%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 16 }}>
                                {editingSla ? `Edit SLA: ${editingSla.name}` : "Create New SLA"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    SLA Name <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input name="name" value={formdata.name} onChange={handleInputChange} placeholder="e.g. Standard - 4 Hour" size="small" />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Resolution Time (minutes) <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <InputNumber
                                    min={1}
                                    style={{ width: "100%" }}
                                    size="small"
                                    value={formdata.resolutionTimeInMinutes}
                                    onChange={handleMinutesChange}
                                    placeholder="e.g. 240"
                                />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {formdata.resolutionTimeInMinutes ? `≈ ${formatMinutes(formdata.resolutionTimeInMinutes)}` : ""}
                                </Text>
                            </Col>
                        </Row>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                            <Button onClick={closeModal}>Cancel</Button>
                            <Button type="primary" onClick={handleSubmit} loading={loading} icon={editingSla ? <EditOutlined /> : <PlusOutlined />}>
                                {loading ? "Saving..." : (editingSla ? "Update SLA" : "Create SLA")}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && slaToDelete && (
                <>
                    <div style={backdropStyle} onClick={closeDeleteModal} />
                    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: 8, width: "380px", maxWidth: "90%", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", textAlign: "center" }}>
                        <ExclamationCircleOutlined style={{ fontSize: 42, color: "#ff4d4f", marginBottom: 10 }} />
                        <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete SLA</h3>
                        <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this SLA policy?</p>
                        <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
                            <p style={{ margin: "3px 0" }}><strong>Name:</strong> {slaToDelete.name}</p>
                            <p style={{ margin: "3px 0" }}><strong>Resolution Time:</strong> {formatMinutes(slaToDelete.resolutionTimeInMinutes)}</p>
                        </div>
                        <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>
                            Tickets already linked to this SLA will keep their current deadline, but no new tickets can use it after deletion.
                        </p>
                        <Space>
                            <Button onClick={closeDeleteModal}>Cancel</Button>
                            <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete SLA</Button>
                        </Space>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sla;