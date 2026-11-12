import React, { useState, useEffect } from "react";
import {
    Table, Alert, Row, Col, Typography, Space,
    Button, Input, Tooltip, Badge, Tag, message, Select, Switch, DatePicker
} from "antd";
import {
    EditOutlined, DeleteOutlined, ReloadOutlined,
    PlusOutlined, SearchOutlined, ExclamationCircleOutlined,
    CloseOutlined, FileTextOutlined, ThunderboltOutlined,
    CheckCircleOutlined, StopOutlined
} from "@ant-design/icons";
import { axiosTicket } from "../../config";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Must match backend's exact string values
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const TICKET_TYPES = ["WorkOrder", "ChangeRequest"];

const emptyForm = {
    name: "",
    category: "",
    subCategory: "",
    defaultDescription: "",
    defaultPriority: "Normal",
    defaultSLAId: undefined,
    isActive: true,
};

const emptyCreateTicketForm = {
    reporterId: "",
    ticketType: "WorkOrder",
    titleOverride: "",
    descriptionOverride: "",
    priorityOverride: undefined,
    slaIdOverride: undefined,
    scheduledStart: null,
    scheduledEnd: null,
};

const WorkOrderTemplates = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [activeOnly, setActiveOnly] = useState(true);

    // dataitems = list of work order templates
    const [dataitems, setdataitems] = useState([]);
    const [slaOptions, setSlaOptions] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formdata, setformdata] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);

    const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
    const [templateForTicket, setTemplateForTicket] = useState(null);
    const [ctFormdata, setCtFormdata] = useState(emptyCreateTicketForm);
    const [creatingTicket, setCreatingTicket] = useState(false);

    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(t);
        }
    }, [error]);

    const fetchdataitems = async () => {
        setLoading(true);
        try {
            const res = await axiosTicket.get(`/workordertemplates?activeOnly=${activeOnly}`);
            setdataitems(Array.isArray(res) ? res : (res?.items || []));
        } catch (err) {
            console.error("Failed to fetch templates:", err);
            setError("Failed to load work order templates");
            setdataitems([]); // fallback empty array, taaki .filter crash na kare
        } finally {
            setLoading(false);
        }
    };

    const fetchSlas = async () => {
        try {
            const res = await axiosTicket.get("/sla");
            setSlaOptions(Array.isArray(res) ? res : (res?.items || []));
        } catch {
            // non-fatal — SLA dropdown just stays empty
        }
    };

    useEffect(() => {
        fetchdataitems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeOnly]);

    useEffect(() => {
        fetchSlas();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setformdata((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setformdata((prev) => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingTemplate(null);
        setformdata(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (template) => {
        setEditingTemplate(template);
        setformdata({
            name: template.name || "",
            category: template.category || "",
            subCategory: template.subCategory || "",
            defaultDescription: template.defaultDescription || "",
            defaultPriority: template.defaultPriority || "Normal",
            defaultSLAId: template.defaultSLAId,
            isActive: template.isActive ?? true,
        });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const openDeleteModal = (template) => { setTemplateToDelete(template); setShowDeleteModal(true); };
    const closeDeleteModal = () => { setShowDeleteModal(false); setTemplateToDelete(null); };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        try {
            await axiosTicket.delete(`/workordertemplates/${templateToDelete.id}`);
            message.success("Template deleted!");
            closeDeleteModal();
            fetchdataitems(); // list refresh
        } catch (err) {
            console.error("Failed to delete template:", err);
            message.error(err?.message || "Could not delete template");
        }
    };

    const handleSubmit = async () => {
        if (!formdata.name.trim() || !formdata.category.trim() || !formdata.defaultSLAId) {
            setError("Name, Category and Default SLA are required");
            return;
        }

        setSaving(true);
        try {
            if (editingTemplate) {
                await axiosTicket.put(`/workordertemplates/${editingTemplate.id}`, formdata);
                message.success("Template updated!");
            } else {
                await axiosTicket.post("/workordertemplates", formdata);
                message.success("Template created!");
            }
            closeModal();
            fetchdataitems(); // list refresh
        } catch (err) {
            console.error("Failed to save template:", err);
            setError(err?.message || "Could not save template");
        } finally {
            setSaving(false);
        }
    };

    const openCreateTicketModal = (template) => {
        setTemplateForTicket(template);
        setCtFormdata({ ...emptyCreateTicketForm, priorityOverride: template.defaultPriority, slaIdOverride: template.defaultSLAId });
        setShowCreateTicketModal(true);
    };

    const closeCreateTicketModal = () => { setShowCreateTicketModal(false); setTemplateForTicket(null); };

    const handleCtInputChange = (e) => {
        const { name, value } = e.target;
        setCtFormdata((prev) => ({ ...prev, [name]: value }));
    };

    const handleCtSelectChange = (name, value) => {
        setCtFormdata((prev) => ({ ...prev, [name]: value }));
    };

    const handleCtDateChange = (name, date) => {
        setCtFormdata((prev) => ({ ...prev, [name]: date ? date.toISOString() : null }));
    };

    const handleCreateTicketFromTemplate = async () => {
        if (!ctFormdata.reporterId.trim()) {
            message.warning("Enter a reporter ID / email");
            return;
        }
        setCreatingTicket(true);
        try {
            await axiosTicket.post(`/workordertemplates/${templateForTicket.id}/create-ticket`, ctFormdata);
            message.success("Ticket created from template!");
            closeCreateTicketModal();
        } catch (err) {
            console.error("Failed to create ticket from template:", err);
            message.error(err?.message || "Could not create ticket from template");
        } finally {
            setCreatingTicket(false);
        }
    };

    const filteredData = dataitems.filter((t) =>
        !searchText ||
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Critical": return "#ff4d4f";
            case "High": return "#fa8c16";
            case "Normal": return "#faad14";
            case "Low": return "#52c41a";
            default: return "#d9d9d9";
        }
    };

    const totalTemplates = dataitems.length;
    const activeTemplates = dataitems.filter((t) => t.isActive).length;
    const inactiveTemplates = totalTemplates - activeTemplates;

    const slaName = (id) => slaOptions.find((s) => s.id === id)?.name || (id ?? "-");

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 50, sorter: (a, b) => a.id - b.id },
        {
            title: "Template Name", dataIndex: "name", key: "name", width: 200,
            render: (text) => (
                <Space size={6}>
                    <FileTextOutlined style={{ color: "#1890ff", fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Category", dataIndex: "category", key: "category", width: 120,
            render: (text, record) => (
                <Tag style={{ fontSize: 11 }}>{text}{record.subCategory ? ` / ${record.subCategory}` : ""}</Tag>
            ),
        },
        {
            title: "Priority", dataIndex: "defaultPriority", key: "defaultPriority", width: 90,
            render: (text) => <Badge color={getPriorityColor(text)} text={<span style={{ fontSize: 11 }}>{text}</span>} />,
        },
        {
            title: "Default SLA", dataIndex: "defaultSLAId", key: "defaultSLAId", width: 130,
            render: (id) => (
                <Tag color="blue" style={{ fontSize: 11 }}>
                    <ThunderboltOutlined style={{ marginRight: 4 }} />
                    {slaName(id)}
                </Tag>
            ),
        },
        {
            title: "Status", dataIndex: "isActive", key: "isActive", width: 90,
            render: (active) => (
                active
                    ? <Badge status="success" text={<span style={{ fontSize: 11 }}>Active</span>} />
                    : <Badge status="default" text={<span style={{ fontSize: 11 }}>Inactive</span>} />
            ),
        },
        {
            title: "Actions", key: "actions", width: 150, fixed: "right",
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="Create ticket from this template">
                        <Button type="text" size="small" icon={<CheckCircleOutlined />} onClick={() => openCreateTicketModal(record)} style={{ color: "#52c41a", padding: "0 4px" }} />
                    </Tooltip>
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
    const taStyle = { width: "100%", border: "1px solid #d9d9d9", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit", outline: "none", minHeight: 62, boxSizing: "border-box" };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                        <FileTextOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        Work Order Templates
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Reusable templates for recurring work orders</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
                        Create Template
                    </Button>
                    <Button icon={<ReloadOutlined />} size="small" onClick={fetchdataitems}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 6, padding: "4px 12px", fontSize: 12, flexShrink: 0 }} />}

            {/* STAT CARDS */}
            <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
                {[
                    { label: "Total Templates", value: totalTemplates, color: "#1890ff", icon: <FileTextOutlined /> },
                    { label: "Active", value: activeTemplates, color: "#52c41a", icon: <CheckCircleOutlined /> },
                    { label: "Inactive", value: inactiveTemplates, color: "#8c8c8c", icon: <StopOutlined /> },
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

            {/* SEARCH + FILTER */}
            <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Search by name or category..."
                            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear size="small"
                        />
                    </Col>
                    <Col xs={24} sm={6} md={6}>
                        <Space size={6}>
                            <Switch size="small" checked={activeOnly} onChange={setActiveOnly} />
                            <Text style={{ fontSize: 12 }}>Active only</Text>
                        </Space>
                    </Col>
                    <Col xs={24} sm={6} md={10} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 12, color: "#888" }}>Showing {filteredData.length} of {totalTemplates}</Text>
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>Templates</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff" }} />
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={filteredData} loading={loading}
                        bordered={false} rowKey="id" size="small"
                        scroll={{ x: 800 }}
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} templates`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
                        style={{ fontSize: 12 }}
                        locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No templates found</div> }}
                    />
                </div>
            </div>


            {/* CREATE / EDIT TEMPLATE MODAL */}
            {showModal && (
                <>
                    <div style={backdropStyle} onClick={closeModal} />
                    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px 24px", borderRadius: 10, width: "560px", maxWidth: "96%", maxHeight: "88vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 16 }}>
                                {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Create New Template"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Template Name <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input name="name" value={formdata.name} onChange={handleInputChange} placeholder="e.g. Monthly UPS Servicing" size="small" />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Category <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input name="category" value={formdata.category} onChange={handleInputChange} placeholder="e.g. Electrical" size="small" />
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Sub-category</label>
                                <Input name="subCategory" value={formdata.subCategory} onChange={handleInputChange} placeholder="e.g. UPS" size="small" />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Default Description</label>
                                <textarea name="defaultDescription" value={formdata.defaultDescription} onChange={handleInputChange} placeholder="Default description that pre-fills new tickets..." style={taStyle} />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Default Priority</label>
                                <Select style={{ width: "100%" }} size="small" value={formdata.defaultPriority} onChange={(v) => handleSelectChange("defaultPriority", v)}>
                                    {PRIORITIES.map((p) => <Option key={p} value={p}>{p}</Option>)}
                                </Select>
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Default SLA <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Select placeholder="Select SLA" style={{ width: "100%" }} size="small" value={formdata.defaultSLAId} onChange={(v) => handleSelectChange("defaultSLAId", v)}>
                                    {slaOptions.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <Space size={8}>
                                    <Switch checked={formdata.isActive} onChange={(v) => handleSelectChange("isActive", v)} />
                                    <Text style={{ fontSize: 12 }}>Active (available for creating tickets)</Text>
                                </Space>
                            </Col>
                        </Row>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                            <Button onClick={closeModal}>Cancel</Button>
                            <Button type="primary" onClick={handleSubmit} loading={saving} icon={editingTemplate ? <EditOutlined /> : <PlusOutlined />}>
                                {saving ? "Saving..." : (editingTemplate ? "Update Template" : "Create Template")}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && templateToDelete && (
                <>
                    <div style={backdropStyle} onClick={closeDeleteModal} />
                    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: 8, width: "380px", maxWidth: "90%", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", textAlign: "center" }}>
                        <ExclamationCircleOutlined style={{ fontSize: 42, color: "#ff4d4f", marginBottom: 10 }} />
                        <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Template</h3>
                        <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this template?</p>
                        <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
                            <p style={{ margin: "3px 0" }}><strong>Name:</strong> {templateToDelete.name}</p>
                            <p style={{ margin: "3px 0" }}><strong>Category:</strong> {templateToDelete.category}</p>
                        </div>
                        <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>
                            Tickets already created from this template are not affected.
                        </p>
                        <Space>
                            <Button onClick={closeDeleteModal}>Cancel</Button>
                            <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Template</Button>
                        </Space>
                    </div>
                </>
            )}

            {/* CREATE TICKET FROM TEMPLATE MODAL */}
            {showCreateTicketModal && templateForTicket && (
                <>
                    <div style={backdropStyle} onClick={closeCreateTicketModal} />
                    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px 24px", borderRadius: 10, width: "520px", maxWidth: "96%", maxHeight: "88vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 16 }}>
                                Create Ticket from: {templateForTicket.name}
                            </h3>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeCreateTicketModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>
                                    Reporter (ID / email) <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input name="reporterId" value={ctFormdata.reporterId} onChange={handleCtInputChange} placeholder="user@company.com" size="small" />
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Ticket Type</label>
                                <Select style={{ width: "100%" }} size="small" value={ctFormdata.ticketType} onChange={(v) => handleCtSelectChange("ticketType", v)}>
                                    {TICKET_TYPES.map((t) => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Title override</label>
                                <Input name="titleOverride" value={ctFormdata.titleOverride} onChange={handleCtInputChange} placeholder="Leave blank to use template name" size="small" />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Description override</label>
                                <textarea name="descriptionOverride" value={ctFormdata.descriptionOverride} onChange={handleCtInputChange} placeholder="Leave blank to use template's default description" style={taStyle} />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Priority override</label>
                                <Select allowClear placeholder="Use template default" style={{ width: "100%" }} size="small" value={ctFormdata.priorityOverride} onChange={(v) => handleCtSelectChange("priorityOverride", v)}>
                                    {PRIORITIES.map((p) => <Option key={p} value={p}>{p}</Option>)}
                                </Select>
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>SLA override</label>
                                <Select allowClear placeholder="Use template default" style={{ width: "100%" }} size="small" value={ctFormdata.slaIdOverride} onChange={(v) => handleCtSelectChange("slaIdOverride", v)}>
                                    {slaOptions.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Scheduled Start</label>
                                <DatePicker showTime style={{ width: "100%" }} size="small" onChange={(d) => handleCtDateChange("scheduledStart", d)} />
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Scheduled End</label>
                                <DatePicker showTime style={{ width: "100%" }} size="small" onChange={(d) => handleCtDateChange("scheduledEnd", d)} />
                            </Col>
                        </Row>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                            <Button onClick={closeCreateTicketModal}>Cancel</Button>
                            <Button type="primary" onClick={handleCreateTicketFromTemplate} loading={creatingTicket} icon={<CheckCircleOutlined />}>
                                {creatingTicket ? "Creating..." : "Create Ticket"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkOrderTemplates;