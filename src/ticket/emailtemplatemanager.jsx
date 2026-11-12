import React, { useState, useEffect, useCallback } from "react";
import {
    Table, Alert, Row, Col, Typography, Space,
    Button, message, Input, Tooltip, Tag, Switch, Popconfirm
} from "antd";
import {
    EditOutlined, DeleteOutlined, ReloadOutlined,
    PlusOutlined, CloseOutlined, MailOutlined, CodeOutlined
} from "@ant-design/icons";
import { axiosTicket } from "../../config";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const API_BASE = "/api";

const AVAILABLE_TOKENS = [
    { token: "{{TicketId}}", desc: "Ticket ID" },
    { token: "{{Title}}", desc: "Ticket title" },
    { token: "{{Description}}", desc: "Ticket description" },
    { token: "{{LevelName}}", desc: "Escalation level name" },
    { token: "{{TicketUrl}}", desc: "Link to view the ticket" },
];

const emptyForm = { name: "", subjectTemplate: "", bodyTemplate: "", isHtml: true };

/**
 * EmailTemplateManager
 * Maps to:
 *   GET    /api/templates
 *   POST   /api/templates
 *   GET    /api/templates/{id}
 *   PUT    /api/templates/{id}
 *   DELETE /api/templates/{id}
 */
const EmailTemplateManager = ({ authToken }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // const fetchTemplates = useCallback(async () => {
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         const res = await fetch(`${API_BASE}/templates`, { headers: { ...authHeaders } });
    //         if (!res.ok) throw new Error("Failed to load templates");
    //         const data = await res.json();
    //         setTemplates(data);
    //     } catch (err) {
    //         setError(err.message || "Could not load templates");
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

    // useEffect(() => {
    //     fetchTemplates();
    // }, [fetchTemplates]);

    // const openAddModal = () => {
    //     setEditingTemplate(null);
    //     setFormData(emptyForm);
    //     setShowModal(true);
    // };

    // const openEditModal = (tpl) => {
    //     setEditingTemplate(tpl);
    //     setFormData({
    //         name: tpl.name,
    //         subjectTemplate: tpl.subjectTemplate,
    //         bodyTemplate: tpl.bodyTemplate,
    //         isHtml: tpl.isHtml,
    //     });
    //     setShowModal(true);
    // };

    // const closeModal = () => setShowModal(false);

    // const handleInputChange = (e) => {
    //     const { name, value } = e.target;
    //     setFormData((prev) => ({ ...prev, [name]: value }));
    // };

    // const handleSubmit = async () => {
    //     if (!formData.name || !formData.subjectTemplate || !formData.bodyTemplate) {
    //         setError("Name, subject and body are required");
    //         return;
    //     }
    //     setSaving(true);
    //     try {
    //         const url = editingTemplate
    //             ? `${API_BASE}/templates/${editingTemplate.id}`
    //             : `${API_BASE}/templates`;
    //         const method = editingTemplate ? "PUT" : "POST";

    //         const res = await fetch(url, {
    //             method,
    //             headers: { "Content-Type": "application/json", ...authHeaders },
    //             body: JSON.stringify(formData),
    //         });
    //         if (!res.ok) throw new Error("Save failed");

    //         message.success(editingTemplate ? "Template updated!" : "Template created!");
    //         setShowModal(false);
    //         fetchTemplates();
    //     } catch (err) {
    //         setError(err.message || "Could not save template");
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    // const handleDelete = async (tpl) => {
    //     try {
    //         const res = await fetch(`${API_BASE}/templates/${tpl.id}`, {
    //             method: "DELETE",
    //             headers: { ...authHeaders },
    //         });
    //         if (!res.ok) throw new Error("Delete failed");
    //         message.success("Template deleted");
    //         fetchTemplates();
    //     } catch (err) {
    //         message.error(err.message || "Could not delete template");
    //     }
    // };



    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await axiosTicket.get(`/templates`);
            setTemplates(data);
        } catch (err) {
            setError(err?.message || "Could not load templates");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const openAddModal = () => {
        setEditingTemplate(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (tpl) => {
        setEditingTemplate(tpl);
        setFormData({
            name: tpl.name,
            subjectTemplate: tpl.subjectTemplate,
            bodyTemplate: tpl.bodyTemplate,
            isHtml: tpl.isHtml,
        });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.subjectTemplate || !formData.bodyTemplate) {
            setError("Name, subject and body are required");
            return;
        }
        setSaving(true);
        try {
            if (editingTemplate) {
                await axiosTicket.put(`/templates/${editingTemplate.id}`, formData);
            } else {
                await axiosTicket.post(`/templates`, formData);
            }

            message.success(editingTemplate ? "Template updated!" : "Template created!");
            setShowModal(false);
            fetchTemplates();
        } catch (err) {
            setError(err?.message || "Could not save template");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (tpl) => {
        try {
            await axiosTicket.delete(`/templates/${tpl.id}`);
            message.success("Template deleted");
            fetchTemplates();
        } catch (err) {
            message.error(err?.message || "Could not delete template");
        }
    };

    const insertToken = (token) => {
        setFormData((prev) => ({ ...prev, bodyTemplate: prev.bodyTemplate + token }));
    };

    const columns = [
        {
            title: "Name", dataIndex: "name", key: "name", width: 180,
            render: (t) => (
                <Space size={6}>
                    <MailOutlined style={{ color: "#1890ff" }} />
                    <Text style={{ fontSize: 12 }} strong>{t}</Text>
                </Space>
            ),
        },
        {
            title: "Subject", dataIndex: "subjectTemplate", key: "subjectTemplate",
            render: (t) => <Text style={{ fontSize: 12 }} code>{t}</Text>,
        },
        {
            title: "Format", dataIndex: "isHtml", key: "isHtml", width: 90,
            render: (v) => <Tag color={v ? "blue" : "default"} style={{ fontSize: 11 }}>{v ? "HTML" : "Plain text"}</Tag>,
        },
        {
            title: "Actions", key: "actions", width: 100, fixed: "right",
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: "#1890ff", padding: "0 4px" }} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this template?"
                        description="Emails using this template will fall back to the default HTML."
                        onConfirm={() => handleDelete(record)}
                        okText="Delete" okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: "#ff4d4f", padding: "0 4px" }} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
    const taStyle = { width: "100%", border: "1px solid #d9d9d9", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit", outline: "none", minHeight: 130, boxSizing: "border-box" };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 12px", boxSizing: "border-box", overflow: "hidden" }}>

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                        <MailOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        Email Templates
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Control what escalation emails say</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
                        New Template
                    </Button>
                    <Button icon={<ReloadOutlined />} size="small" onClick={fetchTemplates}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 6, padding: "4px 12px", fontSize: 12, flexShrink: 0 }} />}

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>Templates</Text>
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={templates} loading={loading}
                        bordered={false} rowKey="id" size="small"
                        pagination={{ pageSize: 10, showSizeChanger: false, size: "small", style: { padding: "5px 14px", margin: 0 } }}
                        style={{ fontSize: 12 }}
                        locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No templates yet</div> }}
                    />
                </div>
            </div>


            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <>
                    <div style={backdropStyle} onClick={closeModal} />
                    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "20px 24px", borderRadius: 10, width: "640px", maxWidth: "96%", maxHeight: "88vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 16 }}>
                                {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "New Email Template"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={16}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Template Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. TicketEscalation" size="small" disabled={!!editingTemplate} />
                            </Col>
                            <Col span={8}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Format</label>
                                <div style={{ paddingTop: 4 }}>
                                    <Switch
                                        checked={formData.isHtml}
                                        onChange={(v) => setFormData((prev) => ({ ...prev, isHtml: v }))}
                                        checkedChildren="HTML"
                                        unCheckedChildren="Plain"
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Subject <span style={{ color: "#ff4d4f" }}>*</span></label>
                                <Input name="subjectTemplate" value={formData.subjectTemplate} onChange={handleInputChange} placeholder="Ticket {{TicketId}} escalated ({{LevelName}})" size="small" />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 6 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12 }}>Body <span style={{ color: "#ff4d4f" }}>*</span></label>
                                <textarea name="bodyTemplate" value={formData.bodyTemplate} onChange={handleInputChange} placeholder="<h2>Ticket Escalation</h2>..." style={taStyle} />
                            </Col>
                        </Row>

                        {/* Token helper */}
                        <div style={{ backgroundColor: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 6, padding: "8px 10px", marginBottom: 12 }}>
                            <Space size={4} style={{ marginBottom: 6 }}>
                                <CodeOutlined style={{ fontSize: 12, color: "#888" }} />
                                <Text type="secondary" style={{ fontSize: 11 }}>Click a token to insert it into the body:</Text>
                            </Space>
                            <div>
                                {AVAILABLE_TOKENS.map((t) => (
                                    <Tooltip title={t.desc} key={t.token}>
                                        <Tag
                                            style={{ fontSize: 11, cursor: "pointer", marginBottom: 4 }}
                                            color="blue"
                                            onClick={() => insertToken(t.token)}
                                        >
                                            {t.token}
                                        </Tag>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                            <Button onClick={closeModal}>Cancel</Button>
                            <Button type="primary" onClick={handleSubmit} loading={saving} icon={editingTemplate ? <EditOutlined /> : <PlusOutlined />}>
                                {saving ? "Saving..." : (editingTemplate ? "Update Template" : "Create Template")}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default EmailTemplateManager;