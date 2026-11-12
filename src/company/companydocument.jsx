import { useState, useEffect } from "react";
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
import { T, getDocDownloadUrl, BASE_URL } from "./constant";
import { emptyDoc, isImageFile } from "./helpers";
import { fetchEntityFiles, uploadFile, updateFile, deleteFile } from "./filestore";
import React from "react";

const { Option } = Select;

// ─── Path normalizer ──────────────────────────────────────────────────────────
const normalizeDocPath = (filePath) => {
    if (!filePath) return null;
    const normalized = filePath.replace(/\\/g, "/");
    if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;
    const idx = normalized.toLowerCase().indexOf("uploads/");
    const relative = idx !== -1 ? normalized.slice(idx) : normalized.replace(/^\/+/, "");
    return `${BASE_URL}${relative}`;
};

const getDocViewUrl = (doc) => doc.documentPath ? normalizeDocPath(doc.documentPath) : (doc.fileUrl || null);

// ─────────────────────────────────────────────────────────────────────────────
// uploadAllPendingDocs — exported for backward compat
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadAllPendingDocs(docs, entityTypeId, entityId) {
    if (!entityTypeId || !entityId) {
        console.warn("uploadAllPendingDocs: missing entityTypeId or entityId — skipping");
        return docs;
    }
    const result = [...docs];
    for (let i = 0; i < result.length; i++) {
        const doc = result[i];
        if (doc.id || !doc._file) continue;
        try {
            const saved = await uploadFile({
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
            });
            result[i] = { ...doc, ...saved, id: saved?.id ?? null, _file: null };
        } catch (err) {
            console.error(`Doc upload failed: ${doc.fileName}`, err);
        }
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CompanyDocumentsSection
// ─────────────────────────────────────────────────────────────────────────────
const CompanyDocumentsSection = ({
    docs = [],
    onChange,
    docTypes = [],
    issuers = [],
    modalFetching,
    entityTypeId,
    entityId,
    autoFetch = false,
}) => {
    const [expandedUid, setExpandedUid] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [editSaving, setEditSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [fetching, setFetching] = useState(false);

    // ── Auto-fetch saved docs ─────────────────────────────────────────────────
    useEffect(() => {
        if (!autoFetch || !entityTypeId || !entityId) return;
        setFetching(true);
        fetchEntityFiles(entityTypeId, entityId, "Document")
            .then((files) => {
                const pending = docs.filter((d) => !d.id && d._file);
                onChange([...files, ...pending]);
            })
            .finally(() => setFetching(false));
    }, [autoFetch, entityTypeId, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helpers ───────────────────────────────────────────────────────────────
    const addDoc = () => {
        const d = { ...emptyDoc() };
        onChange([...docs, d]);
        setExpandedUid(d._uid);
    };

    const updateDoc = (uid, field, val) => {
        onChange(docs.map((d) => d._uid === uid ? { ...d, [field]: val } : d));
    };

    const removeDoc = (uid) => {
        onChange(docs.filter((d) => d._uid !== uid));
        if (expandedUid === uid) setExpandedUid(null);
    };

    const pickFile = (uid, file) => {
        onChange(docs.map((d) => d._uid === uid ? { ...d, _file: file, fileName: file.name } : d));
        return false;
    };

    const getTypeName = (id) => {
        if (!id) return "—";
        const type = docTypes.find((t) => t.id === id);
        return type?.name || type?.documentTypeName || type?.typeName || "—";
    };

    // ── Upload single pending doc now ─────────────────────────────────────────
    const uploadPendingDoc = async (doc) => {
        if (!entityTypeId || !entityId) {
            message.warning("Entity not saved yet — document will upload after save.");
            return;
        }
        try {
            const saved = await uploadFile({
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
            });
            message.success("Document uploaded.");
            onChange(docs.map((d) =>
                d._uid === doc._uid
                    ? { ...d, ...saved, id: saved?.id ?? null, _file: null }
                    : d
            ));
        } catch {
            message.error("Document upload failed.");
        }
    };

    // ── DELETE via FileStore API ──────────────────────────────────────────────
    const handleDeleteSaved = async (doc) => {
        setDeletingId(doc.id);
        try {
            await deleteFile(doc.id);
            message.success("Document deleted.");
            onChange(docs.filter((d) => d._uid !== doc._uid));
        } catch {
            message.error("Failed to delete document.");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Edit modal ────────────────────────────────────────────────────────────
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
            const saved = await updateFile(editingDoc.id, {
                file: editingDoc._file || undefined,
                documentName: editingDoc.documentName || undefined,
                documentNumber: editingDoc.documentNumber || undefined,
                documentTypeId: editingDoc.documentTypeId || undefined,
                issuedById: editingDoc.issuedById || undefined,
                issuedByDate: editingDoc.issuedByDate?.toISOString() || undefined,
                documentValidTill: editingDoc.documentValidTill?.toISOString() || undefined,
            });
            message.success("Document updated.");
            onChange(docs.map((d) =>
                d._uid === editingDoc._uid
                    ? { ...d, ...saved, id: saved?.id ?? d.id, _file: null }
                    : d
            ));
            setEditingDoc(null);
        } catch (err) {
            console.error("Doc update failed:", err);
            message.error("Failed to update document.");
        } finally {
            setEditSaving(false);
        }
    };

    const TypeBadge = ({ typeId }) => {
        const label = getTypeName(typeId);
        if (label === "—") return <span style={{ color: "#9CA3AF" }}>—</span>;
        return (
            <span style={{
                background: "#E0E7FF", color: "#3730A3", fontSize: 10, fontWeight: 600,
                padding: "3px 8px", borderRadius: 6, display: "inline-block", wordBreak: "break-word", lineHeight: 1.4,
            }}>
                {label}
            </span>
        );
    };

    const unsavedDocCount = docs.filter((d) => !d.id && d._file).length;

    // ─── Styles ───────────────────────────────────────────────────────────────
    const styles = {
        container: {
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        },
        header: {
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
        },
        tableHead: {
            display: "grid", gridTemplateColumns: "32px 1fr 130px 110px 100px 100px 90px", gap: 10,
            padding: "10px 16px", alignItems: "center",
            background: "#F9FAFB", borderBottom: "2px solid #E5E7EB", borderTop: "1px solid #E5E7EB",
            fontWeight: 600, fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px",
            borderRadius: "8px 8px 0 0",
        },
        tableRow: (isSaved, idx) => ({
            display: "grid", gridTemplateColumns: "32px 1fr 130px 110px 100px 100px 90px", gap: 10,
            padding: "12px 16px", alignItems: "center",
            borderBottom: "1px solid #F3F4F6",
            background: isSaved ? "#F0FDF4" : idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
            transition: "all 0.2s ease",
        }),
        formCard: {
            padding: "20px 24px 24px",
            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            border: "1px solid #FDE68A",
            borderRadius: 10,
            marginBottom: 12,
            boxShadow: "0 4px 6px -1px rgba(217, 119, 6, 0.08)",
        },
    };

    if (fetching) return (
        <div style={{ ...styles.container, textAlign: "center", padding: 40 }}>
            <Spin tip="Loading documents…" />
        </div>
    );

    return (
        <div style={styles.container}>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8, background: "#FEF3C7",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid #FDE68A",
                    }}>
                        <FileTextOutlined style={{ color: "#D97706", fontSize: 15 }} />
                    </div>
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", display: "block", lineHeight: 1.2 }}>Documents</span>
                        {docs.length > 0 && (
                            <span style={{ fontSize: 11, color: "#6B7280" }}>{docs.length} total</span>
                        )}
                    </div>
                </div>
                <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addDoc}
                    style={{
                        background: "#D97706", borderColor: "#D97706", color: "#fff",
                        fontWeight: 600, borderRadius: 6, boxShadow: "0 2px 0 rgba(0,0,0,0.05)"
                    }}
                >
                    Add Document
                </Button>
            </div>

            {/* ── Pending warning ───────────────────────────────────────────── */}
            {unsavedDocCount > 0 && (
                <div style={{
                    fontSize: 12, color: "#92400E", background: "#FFFBEB",
                    border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 14px",
                    marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
                    fontWeight: 500,
                }}>
                    <ReloadOutlined spin style={{ color: "#D97706" }} />
                    {unsavedDocCount} doc{unsavedDocCount > 1 ? "s" : ""} pending — will upload when saved.
                </div>
            )}

            {docs.length === 0 && (
                <EmptyState
                    icon={<FileTextOutlined />}
                    color="#D97706"
                    bg="#FFFBEB"
                    border="#FDE68A"
                    message='No documents added yet. Click "Add Document" to begin.'
                />
            )}

            {/* ── Unsaved expanded forms ────────────────────────────────────── */}
            {docs.map((doc) => {
                if (expandedUid !== doc._uid || !!doc.id) return null;
                return (
                    <div key={`form-${doc._uid}`} style={styles.formCard}>
                        <Row gutter={[16, 0]}>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Document Name</span>} style={{ marginBottom: 12 }}>
                                    <Input size="small" value={doc.documentName} placeholder="e.g. GST Certificate"
                                        onChange={(e) => updateDoc(doc._uid, "documentName", e.target.value)}
                                        style={{ borderRadius: 6 }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Document Type</span>} style={{ marginBottom: 12 }}>
                                    <Select size="small" style={{ width: "100%", borderRadius: 6 }} placeholder="Select type"
                                        value={doc.documentTypeId || undefined}
                                        onChange={(v) => updateDoc(doc._uid, "documentTypeId", v)}>
                                        {docTypes.map((t) => (
                                            <Option key={t.id} value={t.id}>{t.name || t.documentTypeName || t.typeName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Document Number</span>} style={{ marginBottom: 12 }}>
                                    <Input size="small" value={doc.documentNumber} placeholder="e.g. ABCDE1234F"
                                        onChange={(e) => updateDoc(doc._uid, "documentNumber", e.target.value)}
                                        style={{ borderRadius: 6 }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Issued By</span>} style={{ marginBottom: 12 }}>
                                    <Select size="small" style={{ width: "100%", borderRadius: 6 }} placeholder="Select issuer"
                                        value={doc.issuedById || undefined}
                                        onChange={(v) => updateDoc(doc._uid, "issuedById", v)}>
                                        {issuers.map((i) => (
                                            <Option key={i.id} value={i.id}>{i.name || i.issuerName || i.issuedByName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Issue Date</span>} style={{ marginBottom: 12 }}>
                                    <DatePicker size="small" style={{ width: "100%", borderRadius: 6 }}
                                        value={doc.issuedByDate ? dayjs(doc.issuedByDate) : null}
                                        onChange={(date) => updateDoc(doc._uid, "issuedByDate", date ? date.toISOString() : null)} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Valid Till</span>} style={{ marginBottom: 12 }}>
                                    <DatePicker size="small" style={{ width: "100%", borderRadius: 6 }}
                                        value={doc.documentValidTill ? dayjs(doc.documentValidTill) : null}
                                        onChange={(date) => updateDoc(doc._uid, "documentValidTill", date ? date.toISOString() : null)} />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Attach File</span>} style={{ marginBottom: 8 }}>
                                    <Upload beforeUpload={(f) => pickFile(doc._uid, f)} showUploadList={false}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip">
                                        <Button size="small" icon={<PlusOutlined />} style={{ borderRadius: 6 }}>
                                            {doc.fileName || doc._file?.name || "Choose File"}
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px dashed #FDE68A" }}>
                            {entityTypeId && entityId && doc._file && (
                                <Button size="small" icon={<ReloadOutlined />} type="primary" ghost
                                    style={{ color: "#059669", borderColor: "#059669", borderRadius: 6, fontWeight: 500 }}
                                    onClick={() => { uploadPendingDoc(doc); setExpandedUid(null); }}>
                                    Upload Now
                                </Button>
                            )}
                            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => setExpandedUid(null)}
                                style={{ background: "#D97706", borderColor: "#D97706", color: "#fff", fontWeight: 600, borderRadius: 6 }}>
                                Done
                            </Button>
                        </div>
                    </div>
                );
            })}

            {/* ── Table header ──────────────────────────────────────────────── */}
            {docs.length > 0 && (
                <div style={{ ...styles.tableHead, marginTop: 16 }}>
                    {["#", "Document Name", "Type", "Doc. Number", "Issue Date", "Valid Till", "Actions"].map((h, i) => (
                        <div key={i}>{h}</div>
                    ))}
                </div>
            )}

            {/* ── Table rows ────────────────────────────────────────────────── */}
            {docs.map((doc, idx) => {
                const viewUrl = getDocViewUrl(doc);
                const isImg = isImageFile(doc.documentPath || doc.fileName || "");
                const isPdf = (doc.documentPath || doc.fileUrl || doc.fileName || "").toLowerCase().endsWith(".pdf");
                const isExpanded = expandedUid === doc._uid;
                const isSaved = !!doc.id;

                return (
                    <div key={doc._uid || doc.id} style={styles.tableRow(isSaved, idx)}>
                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{idx + 1}</div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", width: "100%" }}>
                            <div style={{
                                flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                                background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <FileIcon name={doc.fileName || doc.documentPath || ""} />
                            </div>
                            <div style={{ overflow: "hidden", minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 500, color: "#111827",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                }}>
                                    {doc.documentName || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Untitled</span>}
                                </span>
                                {isSaved && (
                                    <span style={{
                                        fontSize: 9, color: "#16A34A", flexShrink: 0, background: "#DCFCE7",
                                        padding: "1px 5px", borderRadius: 4, fontWeight: 700
                                    }}>
                                        SAVED
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ lineHeight: 1.4 }}><TypeBadge typeId={doc.documentTypeId} /></div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", fontWeight: 500 }}>{doc.documentNumber || "—"}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{doc.issuedByDate ? dayjs(doc.issuedByDate).format("YYYY-MM-DD") : "—"}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{doc.documentValidTill ? dayjs(doc.documentValidTill).format("YYYY-MM-DD") : "—"}</div>

                        <div style={{ display: "flex", gap: 2 }}>
                            {isSaved && viewUrl && (
                                <Tooltip title="Preview">
                                    <Button icon={<EyeOutlined />} size="small" type="text" style={{ color: "#6366F1" }}
                                        onClick={() => setPreviewDoc({ ...doc, viewUrl, isImg, isPdf })} />
                                </Tooltip>
                            )}
                            {isSaved && (
                                <Tooltip title="Download">
                                    <Button icon={<DownloadOutlined />} size="small" type="text" style={{ color: "#059669" }}
                                        onClick={() => window.open(getDocDownloadUrl(doc.id), "_blank")} />
                                </Tooltip>
                            )}
                            {isSaved ? (
                                <Tooltip title="Edit">
                                    <Button icon={<EditOutlined />} size="small" type="text" style={{ color: "#6366F1" }}
                                        onClick={() => openEditModal(doc)} />
                                </Tooltip>
                            ) : (
                                <Tooltip title={isExpanded ? "Collapse" : "Edit"}>
                                    <Button icon={isExpanded ? <UpOutlined /> : <EditOutlined />} size="small"
                                        type={isExpanded ? "primary" : "default"}
                                        onClick={() => setExpandedUid(isExpanded ? null : doc._uid)}
                                        style={isExpanded ? { background: "#D97706", borderColor: "#D97706" } : {}} />
                                </Tooltip>
                            )}
                            {isSaved ? (
                                <Popconfirm title="Delete this document?" onConfirm={() => handleDeleteSaved(doc)}
                                    okText="Delete" okButtonProps={{ danger: true }}>
                                    <Button danger icon={<DeleteOutlined />} size="small" type="text" loading={deletingId === doc.id} />
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
                    <Space style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <EditOutlined style={{ color: "#6366F1", fontSize: 13 }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>Edit Document</span>
                    </Space>
                }
                open={!!editingDoc} onCancel={() => setEditingDoc(null)}
                footer={[
                    <Button key="cancel" icon={<CloseOutlined />} onClick={() => setEditingDoc(null)}>Cancel</Button>,
                    <Button key="save" type="primary" icon={<SaveOutlined />} loading={editSaving}
                        onClick={handleEditSave} style={{ background: "#6366F1", borderColor: "#6366F1", fontWeight: 600 }}>Save Changes</Button>,
                ]}
                width={640} destroyOnClose
            >
                {editingDoc && (
                    <div style={{ padding: "12px 0" }}>
                        <Row gutter={[16, 0]}>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Document Name</span>} style={{ marginBottom: 14 }}>
                                    <Input value={editingDoc.documentName} placeholder="e.g. GST Certificate"
                                        onChange={(e) => setEditingDoc((p) => ({ ...p, documentName: e.target.value }))}
                                        style={{ borderRadius: 6 }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Document Number</span>} style={{ marginBottom: 14 }}>
                                    <Input value={editingDoc.documentNumber}
                                        onChange={(e) => setEditingDoc((p) => ({ ...p, documentNumber: e.target.value }))}
                                        style={{ borderRadius: 6 }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Document Type</span>} style={{ marginBottom: 14 }}>
                                    <Select style={{ width: "100%", borderRadius: 6 }} value={editingDoc.documentTypeId || undefined}
                                        onChange={(v) => setEditingDoc((p) => ({ ...p, documentTypeId: v }))} placeholder="Select type">
                                        {docTypes.map((t) => (
                                            <Option key={t.id} value={t.id}>{t.name || t.documentTypeName || t.typeName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Issued By</span>} style={{ marginBottom: 14 }}>
                                    <Select style={{ width: "100%", borderRadius: 6 }} value={editingDoc.issuedById || undefined}
                                        onChange={(v) => setEditingDoc((p) => ({ ...p, issuedById: v }))} placeholder="Select issuer">
                                        {issuers.map((i) => (
                                            <Option key={i.id} value={i.id}>{i.name || i.issuerName || i.issuedByName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Issue Date</span>} style={{ marginBottom: 14 }}>
                                    <DatePicker style={{ width: "100%", borderRadius: 6 }} value={editingDoc.issuedByDate}
                                        onChange={(d) => setEditingDoc((p) => ({ ...p, issuedByDate: d }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Valid Till</span>} style={{ marginBottom: 14 }}>
                                    <DatePicker style={{ width: "100%", borderRadius: 6 }} value={editingDoc.documentValidTill}
                                        onChange={(d) => setEditingDoc((p) => ({ ...p, documentValidTill: d }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Replace File (optional)</span>} style={{ marginBottom: 14 }}>
                                    <Upload beforeUpload={(f) => { setEditingDoc((p) => ({ ...p, _file: f })); return false; }}
                                        showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip">
                                        <Button icon={<PlusOutlined />} style={{ borderRadius: 6 }}>
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
                    <Space style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileIcon name={previewDoc?.documentPath || previewDoc?.fileName || ""} size={15} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{previewDoc?.documentName || "Preview"}</span>
                    </Space>
                }
                open={!!previewDoc} onCancel={() => setPreviewDoc(null)}
                footer={[
                    previewDoc?.id && (
                        <Button key="dl" type="primary" icon={<DownloadOutlined />}
                            onClick={() => window.open(getDocDownloadUrl(previewDoc.id), "_blank")}
                            style={{ background: "#059669", borderColor: "#059669" }}>
                            Download
                        </Button>
                    ),
                    <Button key="cls" onClick={() => setPreviewDoc(null)}>Close</Button>,
                ].filter(Boolean)}
                width={800} style={{ top: 20 }}
                styles={{ body: { padding: "16px 20px", maxHeight: "75vh", overflowY: "auto" } }}
                destroyOnClose
            >
                {previewDoc && (
                    <div style={{
                        border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden",
                        background: "#F9FAFB", minHeight: 300, display: "flex",
                        alignItems: "center", justifyContent: "center"
                    }}>
                        {previewDoc.isImg ? (
                            <img src={previewDoc.viewUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain" }} />
                        ) : previewDoc.isPdf ? (
                            <iframe src={previewDoc.viewUrl} width="100%" height="500px" style={{ border: "none", display: "block" }} title="PDF Preview" />
                        ) : (
                            <div style={{ textAlign: "center", padding: 40 }}>
                                <FileIcon name={previewDoc.documentPath || previewDoc.fileName || ""} size={48} />
                                <div style={{ marginTop: 16, fontSize: 14, color: "#6B7280", fontWeight: 500 }}>Preview not available for this file type.</div>
                                {previewDoc.id && (
                                    <Button type="primary" icon={<DownloadOutlined />} style={{ marginTop: 16, background: "#059669", borderColor: "#059669" }}
                                        onClick={() => window.open(getDocDownloadUrl(previewDoc.id), "_blank")}>Download File</Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CompanyDocumentsSection;