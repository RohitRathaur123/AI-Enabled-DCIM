import { useEffect, useState } from "react"
import axiosInstance, { axiosTicket } from "../../config"
import {
    Alert, Badge, Button, Col, Input, InputNumber, message,
    Row, Select, Space, Table, Tooltip, Typography
} from "antd"
import {
    CloseOutlined, EditOutlined, FieldTimeOutlined,
    PlusOutlined, ReloadOutlined, SearchOutlined, ThunderboltOutlined
} from "@ant-design/icons"
import React from "react"

const { Title, Text } = Typography
const { Option } = Select

const formatMinutes = (mins) => {
    if (!mins) return "";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
};

function EsclationMatrix() {
    const emptyForm = {
        slaId: null,
        level: 0,
        levelname: "",
        escalationTimeInMinutes: 0,
        escalateToEmail: ""
    };

    const [dataitems, setitems] = useState([]);
    const [formdata, setformdata] = useState(emptyForm);

    const [editesc, seteditesc] = useState(null);
    const [deleteesc, setdeleteesc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sla, setsla] = useState([]);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [tableLoading, setTableLoading] = useState(false);

    const fetchsla = async () => {
        try {
            const res = await axiosTicket.get("/sla");
            const list = res?.data?.data || res?.data || res || [];
            setsla(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log("sla error", error);
            setsla([]);
        }
    };

    const fetchitems = async () => {
        setTableLoading(true);
        try {
            const res = await axiosTicket.get("/escalation");
            const list = res?.data?.data || res?.data || res || [];
            setitems(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log(error, "err");
            setError("Failed to load escalation matrix");
            setitems([]);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        fetchitems();
        fetchsla();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setformdata((prev) => ({ ...prev, [name]: value }));
    };

    const handleMinutesChange = (value) => {
        setformdata((prev) => ({ ...prev, escalationTimeInMinutes: value ?? 0 }));
    };

    const handleLevelChange = (value) => {
        setformdata((prev) => ({ ...prev, level: value ?? 0 }));
    };

    const handleSelectChange = (name, value) => {
        setformdata((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const openAddModal = () => {
        seteditesc(null);
        setformdata(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (escalation) => {
        seteditesc(escalation);
        setformdata({
            slaId: escalation.slaId || null,
            level: escalation.level ?? 0,
            levelname: escalation.levelname || "",
            escalationTimeInMinutes: escalation.escalationTimeInMinutes ?? 0,
            escalateToEmail: escalation.escalateToEmail || ""
        });
        setShowModal(true);
    };

    const openDeleteModal = (escalation) => {
        setdeleteesc(escalation);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setdeleteesc(null);
        setShowDeleteModal(false);
    };

    const closeModal = () => setShowModal(false);

    const handleDelete = async () => {
        if (!deleteesc) return;
        setLoading(true);
        try {
            await axiosTicket.delete(`/escalation/${deleteesc.id}`);
            message.success("Escalation item deleted successfully");
            closeDeleteModal();
            fetchitems();
        } catch (error) {
            console.log("delete error", error);
            message.error("Failed to delete escalation item");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formdata.slaId || !formdata.levelname || !formdata.escalateToEmail) {
            message.warning("Please fill in SLA, Level Name and Escalate To Email");
            return;
        }
        setLoading(true);
        try {
            if (editesc) {
                await axiosTicket.put(`/escalation/${editesc.id}`, formdata);
                message.success("Escalation item updated successfully");
            } else {
                await axiosTicket.post("/escalation", formdata);
                message.success("Escalation item created successfully");
            }
            closeModal();
            fetchitems();
        } catch (error) {
            console.log("submit error", error);
            message.error("Something went wrong, please try again");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = (dataitems || []).filter((s) => {
        if (!searchText) return true;
        const matchedSla = sla.find((x) => x.id === s.slaId);
        return (
            (s.levelname || "").toLowerCase().includes(searchText.toLowerCase()) ||
            (matchedSla?.name || "").toLowerCase().includes(searchText.toLowerCase())
        );
    });

    const totalescalation = dataitems.length;

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 60, sorter: (a, b) => (a.id || 0) - (b.id || 0) },
        {
            title: "SLA Name", dataIndex: "slaId", key: "slaId", width: 170,
            render: (slaId) => {
                const matchedSla = sla.find((s) => s.id === slaId);
                return (
                    <Space size={6}>
                        <ThunderboltOutlined style={{ color: "#1890ff", fontSize: 12 }} />
                        <Text style={{ fontSize: 12 }}>{matchedSla?.name || "-"}</Text>
                    </Space>
                );
            },
        },
        {
            title: "Level", dataIndex: "level", key: "level", width: 100,
            render: (text) => <Text style={{ fontSize: 12 }}>{text ?? "-"}</Text>,
        },
        {
            title: "Level Name", dataIndex: "levelname", key: "levelname", width: 160,
            render: (text) => <Text style={{ fontSize: 12 }}>{text || "-"}</Text>,
        },
        {
            title: "Escalation Time", dataIndex: "escalationTimeInMinutes", key: "escalationTimeInMinutes", width: 160,
            render: (text) => (
                <Space size={6}>
                    <FieldTimeOutlined style={{ color: "#1890ff", fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>{formatMinutes(text) || "-"}</Text>
                </Space>
            ),
        },
        {
            title: "Escalate To Email", dataIndex: "escalateToEmail", key: "escalateToEmail", width: 200,
            render: (text) => <Text style={{ fontSize: 12 }}>{text || "-"}</Text>,
        },
        {
            title: "Actions", key: "actions", width: 100, fixed: "right",
            render: (_, record) => (
                <Space size={1}>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: "#1890ff", padding: "0 4px" }} />
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
                        Escalation Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Escalation Matrix</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
                        Create Escalation
                    </Button>
                    <Button icon={<ReloadOutlined />} size="small" onClick={fetchitems}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 6, padding: "4px 12px", fontSize: 12, flexShrink: 0 }} />}

            {/* SEARCH */}
            <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Search by SLA or level name..."
                            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear size="small"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 12, color: "#888" }}>Showing {filteredData.length} of {totalescalation}</Text>
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>Escalation Matrix</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff" }} />
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={filteredData} loading={tableLoading}
                        bordered={false} rowKey="id" size="small"
                        scroll={{ x: 1000 }}
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} Items`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
                        style={{ fontSize: 12 }}
                        locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No Escalation Matrix found</div> }}
                    />
                </div>
            </div>


            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div style={backdropStyle} onClick={closeModal}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px 24px", borderRadius: 10, width: "460px", maxWidth: "96%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 16 }}>
                                {editesc ? `Edit Escalation: ${editesc.levelname}` : "Create New Escalation"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    SLA <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Select SLA"
                                    size="small"
                                    style={{ width: "100%" }}
                                    value={formdata.slaId || undefined}
                                    onChange={(val) => handleSelectChange("slaId", val)}
                                    filterOption={(input, option) =>
                                        (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {sla.map((c) => (
                                        <Option key={c.id} value={c.id}>{c.name}</Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Level <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <InputNumber
                                    min={0}
                                    style={{ width: "100%" }}
                                    size="small"
                                    value={formdata.level}
                                    onChange={handleLevelChange}
                                    placeholder="e.g. 1"
                                />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Level Name <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input name="levelname" value={formdata.levelname} onChange={handleInputChange} placeholder="e.g. First Response" size="small" />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Escalation Time (minutes) <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <InputNumber
                                    min={1}
                                    style={{ width: "100%" }}
                                    size="small"
                                    value={formdata.escalationTimeInMinutes}
                                    onChange={handleMinutesChange}
                                    placeholder="e.g. 240"
                                />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {formdata.escalationTimeInMinutes ? `≈ ${formatMinutes(formdata.escalationTimeInMinutes)}` : ""}
                                </Text>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Escalate To Email <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input name="escalateToEmail" value={formdata.escalateToEmail} onChange={handleInputChange} placeholder="e.g. manager@company.com" size="small" />
                            </Col>
                        </Row>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                            <Button onClick={closeModal}>Cancel</Button>
                            <Button type="primary" onClick={handleSubmit} loading={loading} icon={editesc ? <EditOutlined /> : <PlusOutlined />}>
                                {loading ? "Saving..." : (editesc ? "Update Escalation" : "Create Escalation")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {showDeleteModal && (
                <div style={backdropStyle} onClick={closeDeleteModal}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px 24px", borderRadius: 10, width: "380px", maxWidth: "94%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
                    >
                        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Delete Escalation Item?</h3>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Are you sure you want to delete "{deleteesc?.levelname}"? This action cannot be undone.
                        </Text>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                            <Button onClick={closeDeleteModal}>Cancel</Button>
                            <Button danger type="primary" loading={loading} onClick={handleDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EsclationMatrix;