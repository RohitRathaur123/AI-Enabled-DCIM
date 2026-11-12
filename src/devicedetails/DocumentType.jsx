// DocumentTypeModal.jsx — Popup modal for managing Document Types
// ════════════════════════════════════════════════════════════════════════════════
// Endpoints used:
//   GET    /api/DocumentMaster/document-types
//   POST   /api/DocumentMaster/create-documenttypes   { id, typeName }
//   DELETE /api/DocumentMaster/document-types/{id}
// ════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import {
    Modal, Button, Input, List, Space, message,
    Popconfirm, Empty, Spin, Typography, Form,
} from "antd";
import {
    PlusOutlined, DeleteOutlined, FileTextOutlined,
} from "@ant-design/icons";

import React from "react";
import { axiosdevice } from "../../config";
const { Text } = Typography;

// ── Trigger button, drop this anywhere (e.g. next to "Import File" button) ──
export function DocumentTypeButton({ style }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button icon={<FileTextOutlined />} onClick={() => setOpen(true)} style={style}>
                Document Types
            </Button>
            <DocumentTypeModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}

// ── Main Modal ───────────────────────────────────────────────────────────
export default function DocumentTypeModal({ open, onClose }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [typeName, setTypeName] = useState("");

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosdevice.get("/DocumentMaster/document-types");
            const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            setList(rows);
        } catch (err) {
            console.error(err);
            message.error("Failed to load document types");
            setList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchTypes();
            setTypeName("");
        }
    }, [open, fetchTypes]);

    const handleAdd = async () => {
        const name = typeName.trim();
        if (!name) {
            message.warning("Please enter a document type name");
            return;
        }
        setSubmitting(true);
        try {
            await axiosdevice.post("/DocumentMaster/create-documenttypes", {

                typeName: name,
            });
            message.success("Document type added");
            setTypeName("");
            fetchTypes();
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || err?.message || "Failed to add document type");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await axiosdevice.delete(`/DocumentMaster/document-types/${id}`);
            message.success("Document type deleted");
            setList(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
            message.error("Failed to delete document type");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 700 }}>Document Types</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={[<Button key="close" onClick={onClose}>Close</Button>]}
            width={480}
            destroyOnClose
        >
            {/* ── Add Form ── */}
            <Form layout="inline" onFinish={handleAdd} style={{ marginBottom: 16, display: "flex", gap: 8 }}>
                <Input
                    placeholder="Enter document type name (e.g. Invoice, Warranty Card)"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    onPressEnter={handleAdd}
                    style={{ flex: 1 }}
                    disabled={submitting}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    loading={submitting}
                    style={{ background: "#1890ff", borderColor: "#1890ff" }}
                >
                    Add
                </Button>
            </Form>

            {/* ── List ── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 30 }}>
                    <Spin size="small" />
                </div>
            ) : list.length === 0 ? (
                <Empty description="No document types yet" style={{ margin: "24px 0" }} />
            ) : (
                <List
                    size="small"
                    bordered
                    dataSource={list}
                    style={{ maxHeight: 320, overflowY: "auto" }}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Popconfirm
                                    key="delete"
                                    title="Delete this document type?"
                                    okText="Delete"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => handleDelete(item.id)}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        loading={deletingId === item.id}
                                    />
                                </Popconfirm>,
                            ]}
                        >
                            <Text>{item.typeName || item.name || "—"}</Text>
                        </List.Item>
                    )}
                />
            )}
        </Modal>
    );
}