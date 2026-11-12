// DeviceDocumentsSection.jsx — DEVICE SPECIFIC DOCUMENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
// Device ke lia alag documents section
// filestoreDevice.js functions use karta hai
// axiosdevice se baat karta hai
//
// CHANGE: local `normalizeDeviceDocPath` hata diya — ab constant.js ka shared
// `resolveDeviceFileUrl` use hota hai, jo images section mein bhi same
// tareeke se preview URL banata hai. Isse dono jagah behaviour consistent
// rehta hai aur future mein sirf ek jagah fix karna padega.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import {
    Button, Tooltip, Popconfirm, Select, Input, Row, Col,
    Form, DatePicker, Upload, Modal, Space, message, Spin,
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
    DownloadOutlined, UpOutlined, CheckCircleOutlined, FileTextOutlined,
    SaveOutlined, CloseOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import FileIcon from "./fileicon";
import EmptyState from "./Emptystate";
import { T, getDeviceDocDownloadUrl, resolveDeviceFileUrl } from "./constant";

import {
    fetchDeviceEntityFiles,
    uploadDeviceFile,
    updateDeviceFile,
    deleteDeviceFile,
    emptyDeviceDoc, isDeviceImageFile
} from "./filedevicestore";

const { Option } = Select;

const COL_WIDTHS = "26px 1fr 140px 120px 100px 100px 96px";
const HEADERS = ["#", "Document Name", "Type", "Doc. Number", "Issue Date", "Valid Till", "Actions"];

const getDeviceDocViewUrl = (doc) => resolveDeviceFileUrl(doc);

// ─── Exported helper ─────────────────────────────────────────────────────────
export async function uploadAllPendingDeviceDocs(docs, entityTypeId, entityId, deviceId) {
    if (!entityTypeId || !entityId) {
        console.warn("[Device] uploadAllPendingDeviceDocs: missing params");
        return docs;
    }
    const result = [...docs];
    for (let i = 0; i < result.length; i++) {
        const doc = result[i];
        if (doc.id || !doc._file) continue;
        try {
            const saved = await uploadDeviceFile({
                file: doc._file,
                entityTypeId,
                entityId,
                fileCategory: "Document",
                documentName: doc.documentName || undefined,
                documentNumber: doc.documentNumber || undefined,
                documentTypeId: doc.documentTypeId || undefined,
                issuedById: doc.issuedById || undefined,
                issuedByDate: doc.issuedByDate || undefined,
                documentValidTill: doc.documentValidTill || undefined,
                deviceId: deviceId,
            });
            result[i] = { ...doc, ...saved, id: saved?.id ?? null, _file: null };
        } catch (err) {
            console.error(`[Device] Doc upload failed: ${doc.fileName}`, err);
        }
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// DeviceDocumentsSection
//
// Props:
//   docs          — array
//   onChange      — (newDocs) => void
//   docTypes      — [{id, name}]
//   issuers       — [{id, name}]
//   modalFetching — bool
//   entityTypeId  — UUID from Device EntityType API
//   entityId      — UUID of device / location / model spec / etc.
//   deviceId      — Device ID (optional)
//   autoFetch     — if true, fetch saved docs on mount
// ─────────────────────────────────────────────────────────────────────────────
const DeviceDocumentsSection = ({
    docs = [],
    onChange,
    docTypes = [],
    issuers = [],
    modalFetching,
    entityTypeId,
    entityId,
    deviceId,
    autoFetch = false,
}) => {
    const [expandedUid, setExpandedUid] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [editSaving, setEditSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [fetching, setFetching] = useState(false);

    // ── Auto-fetch ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoFetch || !entityTypeId || !entityId) return;
        setFetching(true);
        fetchDeviceEntityFiles(entityTypeId, entityId, "Document")
            .then(files => {
                const pending = docs.filter(d => !d.id && d._file);
                onChange([...files, ...pending]);
            })
            .finally(() => setFetching(false));
    }, [autoFetch, entityTypeId, entityId]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const addDoc = () => {
        const d = { ...emptyDeviceDoc(), deviceId: deviceId };
        onChange([...docs, d]);
        setExpandedUid(d._uid);
    };

    const updateDoc = (uid, field, val) => {
        onChange(docs.map(d => d._uid === uid ? { ...d, [field]: val } : d));
    };

    const removeDoc = (uid) => {
        onChange(docs.filter(d => d._uid !== uid));
        // Agar wahi doc expand hua tha toh collapse bhi kar do
        if (expandedUid === uid) {
            setExpandedUid(null);
        }
    };

    const pickFile = (uid, file) => {
        onChange(docs.map(d => d._uid === uid ? { ...d, _file: file, fileName: file.name } : d));
        return false;
    };

    const getTypeName = (id) => {
        if (!id) return "—";
        const type = docTypes.find(t => t.id === id);
        return type?.name || type?.documentTypeName || type?.typeName || "—";
    };

    // ── Upload single pending doc now ────────────────────────────────────────
    const uploadPendingDoc = async (doc) => {
        if (!entityTypeId || !entityId) {
            message.warning("Record not saved yet — document will upload after save.");
            return;
        }
        try {
            const saved = await uploadDeviceFile({
                file: doc._file,
                entityTypeId,
                entityId,
                fileCategory: "Document",
                documentName: doc.documentName || undefined,
                documentNumber: doc.documentNumber || undefined,
                documentTypeId: doc.documentTypeId || undefined,
                issuedById: doc.issuedById || undefined,
                issuedByDate: doc.issuedByDate || undefined,
                documentValidTill: doc.documentValidTill || undefined,
                deviceId: deviceId,
            });
            message.success("Device document uploaded.");
            onChange(docs.map(d =>
                d._uid === doc._uid
                    ? { ...d, ...saved, id: saved?.id ?? null, _file: null }
                    : d
            ));
        } catch {
            message.error("Device document upload failed.");
        }
    };

    // ── Delete saved doc ─────────────────────────────────────────────────────
    const handleDeleteSaved = async (doc) => {
        setDeletingId(doc.id);
        try {
            await deleteDeviceFile(doc.id);
            message.success("Device document deleted.");
            onChange(docs.filter(d => d._uid !== doc._uid));
        } catch {
            message.error("Failed to delete device document.");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Edit modal ───────────────────────────────────────────────────────────
    const openEditModal = (doc) => {
        setEditingDoc({
            ...doc,
            _file: null,
            issuedByDate: doc.issuedByDate ? dayjs(doc.issuedByDate) : null,
            documentValidTill: doc.documentValidTill ? dayjs(doc.documentValidTill) : null,
        });
    };

    const handleEditSave = async () => {
        if (!editingDoc) return;
        setEditSaving(true);
        try {
            const saved = await updateDeviceFile(editingDoc.id, {
                file: editingDoc._file || undefined,
                documentName: editingDoc.documentName || undefined,
                documentNumber: editingDoc.documentNumber || undefined,
                documentTypeId: editingDoc.documentTypeId || undefined,
                issuedById: editingDoc.issuedById || undefined,
                issuedByDate: editingDoc.issuedByDate?.toISOString() || undefined,
                documentValidTill: editingDoc.documentValidTill?.toISOString() || undefined,
            });
            message.success("Device document updated.");

            onChange(docs.map(d =>
                d._uid === editingDoc._uid
                    ? { ...d, ...saved, id: saved?.id ?? d.id, _file: null }
                    : d
            ));
            setEditingDoc(null);
        } catch (err) {
            console.error("[Device] Doc update failed:", err);
            message.error("Failed to update device document.");
        } finally {
            setEditSaving(false);
        }
    };

    // ─── Type Badge ──────────────────────────────────────────────────────────
    const TypeBadge = ({ typeId }) => {
        const label = getTypeName(typeId);
        if (label === "—") return <span style={{ color: "#D1D5DB" }}>—</span>;
        return (
            <span style={{
                background: "#DBEAFE", color: "#1E40AF", fontSize: 10, fontWeight: 600,
                padding: "2px 6px", borderRadius: 4, border: "1px solid #93C5FD",
                display: "inline-block", wordBreak: "break-word", lineHeight: 1.5,
            }}>
                {label}
            </span>
        );
    };

    const unsavedDocCount = docs.filter(d => !d.id && d._file).length;

    if (fetching) {
        return (
            <div style={{ textAlign: "center", padding: 20 }}>
                <Spin tip="Loading device documents…" />
            </div>
        );
    }

    return (
        <div>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileTextOutlined style={{ color: "#2563EB", fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Device Documents</span>
                    {docs.length > 0 && (
                        <span style={{
                            background: "#DBEAFE", color: "#1E40AF", fontSize: 11, fontWeight: 700,
                            padding: "1px 8px", borderRadius: 99, border: "1px solid #93C5FD",
                        }}>
                            {docs.length}
                        </span>
                    )}
                </div>
                <Button
                    size="small" icon={<PlusOutlined />} onClick={addDoc}
                    style={{ background: "#2563EB", borderColor: "#2563EB", color: "#fff", fontWeight: 500 }}
                >
                    Add Document
                </Button>
            </div>

            {/* ── Pending warning ───────────────────────────────────────────── */}
            {unsavedDocCount > 0 && (
                <div style={{
                    fontSize: 11, color: "#1E40AF", background: "#DBEAFE",
                    border: "1px solid #93C5FD", borderRadius: 6, padding: "6px 10px",
                    marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
                }}>
                    ⏳ {unsavedDocCount} doc{unsavedDocCount > 1 ? "s" : ""} pending
                </div>
            )}

            {docs.length === 0 && (
                <EmptyState
                    icon={<FileTextOutlined />}
                    color="#2563EB" bg="#DBEAFE" border="#93C5FD"
                    message='No device documents. Click "Add Document" to begin.'
                />
            )}

            {/* ── Unsaved expanded forms ────────────────────────────────────── */}
            {docs.map(doc => {
                if (expandedUid !== doc._uid || !!doc.id) return null;
                return (
                    <div key={`form-${doc._uid}`} style={{
                        padding: "16px 18px 18px", background: "#EFF6FF",
                        border: "1px solid #BAE6FD", borderRadius: T.radius?.md || 8, marginBottom: 8,
                    }}>
                        <Row gutter={[12, 0]}>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Document Name</span>} style={{ marginBottom: 10 }}>
                                    <Input size="small" value={doc.documentName} placeholder="e.g. Warranty Certificate"
                                        onChange={e => updateDoc(doc._uid, "documentName", e.target.value)} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Document Type</span>} style={{ marginBottom: 10 }}>
                                    <Select size="small" style={{ width: "100%" }} placeholder="Select type"
                                        value={doc.documentTypeId || undefined}
                                        onChange={v => updateDoc(doc._uid, "documentTypeId", v)}>
                                        {docTypes.map(t => (
                                            <Option key={t.id} value={t.id}>{t.name || t.documentTypeName || t.typeName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Document Number</span>} style={{ marginBottom: 10 }}>
                                    <Input size="small" value={doc.documentNumber} placeholder="e.g. DEV-2024-001"
                                        onChange={e => updateDoc(doc._uid, "documentNumber", e.target.value)} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Issued By</span>} style={{ marginBottom: 10 }}>
                                    <Select size="small" style={{ width: "100%" }} placeholder="Select issuer"
                                        value={doc.issuedById || undefined}
                                        onChange={v => updateDoc(doc._uid, "issuedById", v)}>
                                        {issuers.map(i => (
                                            <Option key={i.id} value={i.id}>{i.name || i.issuerName || i.issuedByName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Issue Date</span>} style={{ marginBottom: 10 }}>
                                    <DatePicker size="small" style={{ width: "100%" }}
                                        value={doc.issuedByDate ? dayjs(doc.issuedByDate) : null}
                                        onChange={date => updateDoc(doc._uid, "issuedByDate", date ? date.toISOString() : null)} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Valid Till</span>} style={{ marginBottom: 10 }}>
                                    <DatePicker size="small" style={{ width: "100%" }}
                                        value={doc.documentValidTill ? dayjs(doc.documentValidTill) : null}
                                        onChange={date => updateDoc(doc._uid, "documentValidTill", date ? date.toISOString() : null)} />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Attach File</span>} style={{ marginBottom: 6 }}>
                                    <Upload beforeUpload={f => pickFile(doc._uid, f)} showUploadList={false}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip">
                                        <Button size="small" icon={<PlusOutlined />}>
                                            {doc.fileName || doc._file?.name || "Choose File"}
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                            {entityTypeId && entityId && doc._file && (
                                <Button size="small" icon={<ReloadOutlined />} type="primary" ghost
                                    style={{ color: "#059669", borderColor: "#059669" }}
                                    onClick={() => { uploadPendingDoc(doc); setExpandedUid(null); }}>
                                    Upload Now
                                </Button>
                            )}
                            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => setExpandedUid(null)}
                                style={{ background: "#2563EB", borderColor: "#2563EB", color: "#fff", fontWeight: 500 }}>
                                Done
                            </Button>
                        </div>
                    </div>
                );
            })}

            {/* ── Table header ──────────────────────────────────────────────── */}
            {docs.length > 0 && (
                <div style={{
                    display: "grid", gridTemplateColumns: COL_WIDTHS, gap: 8,
                    padding: "10px 14px", alignItems: "center",
                    background: "#F9FAFB", borderBottom: "2px solid #E5E7EB",
                    borderTop: "1px solid #E5E7EB", marginTop: 12,
                    fontWeight: 600, fontSize: 12, color: "#6B7280",
                }}>
                    {HEADERS.map((h, i) => (
                        <div key={i} style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                    ))}
                </div>
            )}

            {/* ── Table rows ────────────────────────────────────────────────── */}
            {docs.map((doc, idx) => {
                const viewUrl = getDeviceDocViewUrl(doc);
                const isImg = isDeviceImageFile(doc.documentPath || doc.fileName || "");
                const isPdf = (doc.documentPath || doc.fileUrl || doc.fileName || "").toLowerCase().endsWith(".pdf");
                const isExpanded = expandedUid === doc._uid;
                const isSaved = !!doc.id;

                return (
                    <div key={doc._uid || doc.id} style={{
                        display: "grid", gridTemplateColumns: COL_WIDTHS, gap: 8,
                        padding: "10px 14px", alignItems: "center",
                        borderBottom: "1px solid #F3F4F6",
                        background: isSaved ? "#F0FDF4" : idx % 2 === 0 ? "#fff" : "#FAFAFA",
                    }}>
                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{idx + 1}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", width: "100%" }}>
                            <div style={{ flexShrink: 0 }}><FileIcon name={doc.fileName || doc.documentPath || ""} /></div>
                            <div style={{ overflow: "hidden", minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 500, color: "#374151",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                    {doc.documentName || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Untitled</span>}
                                </span>
                                {isSaved && <span style={{ fontSize: 9, color: "#16A34A", flexShrink: 0 }}>✓</span>}
                            </div>
                        </div>
                        <div style={{ lineHeight: 1.4 }}><TypeBadge typeId={doc.documentTypeId} /></div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#374151" }}>{doc.documentNumber || "—"}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                            {doc.issuedByDate ? dayjs(doc.issuedByDate).format("YYYY-MM-DD") : "—"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                            {doc.documentValidTill ? dayjs(doc.documentValidTill).format("YYYY-MM-DD") : "—"}
                        </div>
                        <div style={{ display: "flex", gap: 3 }}>
                            {isSaved && viewUrl && (
                                <Tooltip title="Preview">
                                    <Button icon={<EyeOutlined />} size="small" type="text"
                                        style={{ color: "#2563EB" }}
                                        onClick={() => setPreviewDoc({ ...doc, viewUrl, isImg, isPdf })} />
                                </Tooltip>
                            )}
                            {isSaved && (
                                <Tooltip title="Download">
                                    <Button icon={<DownloadOutlined />} size="small" type="text"
                                        style={{ color: "#16A34A" }}
                                        onClick={() => window.open(getDeviceDocDownloadUrl(doc.id), "_blank")} />
                                </Tooltip>
                            )}
                            {isSaved ? (
                                <Tooltip title="Edit">
                                    <Button icon={<EditOutlined />} size="small" type="text"
                                        style={{ color: "#2563EB" }}
                                        onClick={() => openEditModal(doc)} />
                                </Tooltip>
                            ) : (
                                <Tooltip title={isExpanded ? "Collapse" : "Edit"}>
                                    <Button icon={isExpanded ? <UpOutlined /> : <EditOutlined />} size="small"
                                        type={isExpanded ? "primary" : "default"}
                                        onClick={() => setExpandedUid(isExpanded ? null : doc._uid)}
                                        style={isExpanded ? { background: "#2563EB", borderColor: "#2563EB" } : {}} />
                                </Tooltip>
                            )}
                            {isSaved ? (
                                <Popconfirm title="Delete this device document?" onConfirm={() => handleDeleteSaved(doc)}
                                    okText="Delete" okButtonProps={{ danger: true }}>
                                    <Button danger icon={<DeleteOutlined />} size="small" type="text"
                                        loading={deletingId === doc.id} />
                                </Popconfirm>
                            ) : (
                                <Popconfirm title="Remove document?" onConfirm={() => removeDoc(doc._uid)}
                                    okText="Remove" okButtonProps={{ danger: true }}>
                                    <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                                </Popconfirm>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* ── Edit Modal ────────────────────────────────────────────────── */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: "#2563EB" }} />
                        <span>Edit Device Document</span>
                    </Space>
                }
                open={!!editingDoc} onCancel={() => setEditingDoc(null)}
                footer={[
                    <Button key="cancel" icon={<CloseOutlined />} onClick={() => setEditingDoc(null)}>Cancel</Button>,
                    <Button key="save" type="primary" icon={<SaveOutlined />} loading={editSaving}
                        onClick={handleEditSave} style={{ background: "#2563EB" }}>Save Changes</Button>,
                ]}
                width={640} destroyOnClose
            >
                {editingDoc && (
                    <div style={{ padding: "8px 0" }}>
                        <Row gutter={[12, 0]}>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Document Name</span>} style={{ marginBottom: 12 }}>
                                    <Input value={editingDoc.documentName} placeholder="e.g. Warranty Certificate"
                                        onChange={e => setEditingDoc(p => ({ ...p, documentName: e.target.value }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Document Number</span>} style={{ marginBottom: 12 }}>
                                    <Input value={editingDoc.documentNumber}
                                        onChange={e => setEditingDoc(p => ({ ...p, documentNumber: e.target.value }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Document Type</span>} style={{ marginBottom: 12 }}>
                                    <Select style={{ width: "100%" }} value={editingDoc.documentTypeId || undefined}
                                        onChange={v => setEditingDoc(p => ({ ...p, documentTypeId: v }))} placeholder="Select type">
                                        {docTypes.map(t => (
                                            <Option key={t.id} value={t.id}>{t.name || t.documentTypeName || t.typeName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Issued By</span>} style={{ marginBottom: 12 }}>
                                    <Select style={{ width: "100%" }} value={editingDoc.issuedById || undefined}
                                        onChange={v => setEditingDoc(p => ({ ...p, issuedById: v }))} placeholder="Select issuer">
                                        {issuers.map(i => (
                                            <Option key={i.id} value={i.id}>{i.name || i.issuerName || i.issuedByName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Issue Date</span>} style={{ marginBottom: 12 }}>
                                    <DatePicker style={{ width: "100%" }} value={editingDoc.issuedByDate}
                                        onChange={d => setEditingDoc(p => ({ ...p, issuedByDate: d }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Valid Till</span>} style={{ marginBottom: 12 }}>
                                    <DatePicker style={{ width: "100%" }} value={editingDoc.documentValidTill}
                                        onChange={d => setEditingDoc(p => ({ ...p, documentValidTill: d }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Replace File (optional)</span>} style={{ marginBottom: 12 }}>
                                    <Upload beforeUpload={f => { setEditingDoc(p => ({ ...p, _file: f })); return false; }}
                                        showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip">
                                        <Button icon={<PlusOutlined />}>
                                            {editingDoc._file ? editingDoc._file.name : (editingDoc.fileName || "Choose New File")}
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            {/* ── Preview Modal ─────────────────────────────────────────────── */}
            <Modal
                title={
                    <Space>
                        <FileIcon name={previewDoc?.documentPath || previewDoc?.fileName || ""} size={18} />
                        <span>{previewDoc?.documentName || "Preview"}</span>
                    </Space>
                }
                open={!!previewDoc} onCancel={() => setPreviewDoc(null)}
                footer={[
                    previewDoc?.id && (
                        <Button key="dl" type="primary" icon={<DownloadOutlined />}
                            onClick={() => window.open(getDeviceDocDownloadUrl(previewDoc.id), "_blank")}>
                            Download
                        </Button>
                    ),
                    <Button key="cls" onClick={() => setPreviewDoc(null)}>Close</Button>,
                ].filter(Boolean)}
                width={800} style={{ top: 20 }}
                styles={{ body: { padding: "12px 16px", maxHeight: "75vh", overflowY: "auto" } }}
                destroyOnClose
            >
                {previewDoc && (
                    <div style={{
                        border: "1px solid #E5E7EB", borderRadius: T.radius?.md || 8,
                        overflow: "hidden", background: "#F9FAFB", minHeight: 300,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {previewDoc.isImg ? (
                            <img src={previewDoc.viewUrl} alt="preview"
                                style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain" }} />
                        ) : previewDoc.isPdf ? (
                            <iframe src={previewDoc.viewUrl} width="100%" height="500px"
                                style={{ border: "none", display: "block" }} title="PDF Preview" />
                        ) : (
                            <div style={{ textAlign: "center", padding: 40 }}>
                                <FileIcon name={previewDoc.documentPath || previewDoc.fileName || ""} size={48} />
                                <div style={{ marginTop: 12, fontSize: 13, color: "#6B7280" }}>Preview not available.</div>
                                {previewDoc.id && (
                                    <Button type="primary" icon={<DownloadOutlined />} style={{ marginTop: 12 }}
                                        onClick={() => window.open(getDeviceDocDownloadUrl(previewDoc.id), "_blank")}>
                                        Download File
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DeviceDocumentsSection;