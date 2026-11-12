import React, { useState, useCallback, useEffect } from "react";
import {
    Image, Button, Select, Input, Tooltip, Popconfirm,
    Upload, Modal, Space, message, DatePicker, Spin,
} from "antd";
import {
    PictureOutlined, DeleteOutlined, DownloadOutlined,
    ZoomInOutlined, EditOutlined, SaveOutlined, CloseOutlined,
    LoadingOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { T, IMG_FILE_TYPES, getImgDownloadUrl } from "./constant";
import { emptyImg } from "./helpers";
import { fetchEntityFiles, uploadFile, updateFile, deleteFile } from "./filestore"; // ← adjust path

const { Option } = Select;
const { Dragger } = Upload;

const ALL_TYPES = [...(IMG_FILE_TYPES || []).filter((t) => t !== "Other"), "Other"];

const FieldLabel = ({ children }) => (
    <div style={{
        fontSize: 10, fontWeight: 700, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
    }}>
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// uploadAllPendingImages — exported for backward compat (company.jsx calls this)
// entityTypeId + entityId are now required
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadAllPendingImages(images = [], entityTypeId, entityId) {
    if (!entityTypeId || !entityId) {
        console.warn("uploadAllPendingImages: missing entityTypeId or entityId — skipping");
        return images;
    }
    const result = [...images];
    for (let i = 0; i < result.length; i++) {
        const img = result[i];
        if (img.id || !img._file) continue;
        try {
            const saved = await uploadFile({
                file: img._file,
                entityTypeId,
                entityId,
                fileCategory: "Image",
                fileUse: img.fileUse || undefined,
                fileExpiryDate: img.fileExpiryDate || undefined,
            });
            result[i] = { ...img, ...saved, id: saved?.id ?? null, _file: null, _pending: false };
        } catch (err) {
            console.error("Image upload failed:", err);
        }
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// PendingImageForm
// ─────────────────────────────────────────────────────────────────────────────
function PendingImageForm({ img, onUpdate, onTypeSelect }) {
    const dropdownVal = !img.fileType
        ? undefined
        : ALL_TYPES.includes(img.fileType) ? img.fileType : "Other";

    const isOther = dropdownVal === "Other";
    const customText = img._customType !== undefined
        ? img._customType
        : (img.fileType && !ALL_TYPES.includes(img.fileType) ? img.fileType : "");

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px 12px" }}>
            <div>
                <FieldLabel>File Type</FieldLabel>
                <Select size="small" placeholder="Select type…" style={{ width: "100%" }}
                    value={dropdownVal} onChange={(v) => onTypeSelect(img._uid, v)}>
                    {ALL_TYPES.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                {isOther && (
                    <Input size="small" placeholder="Custom type…" style={{ marginTop: 4 }}
                        value={customText}
                        onChange={(e) => onUpdate(img._uid, "_customType", e.target.value)} autoFocus />
                )}
            </div>
            <div>
                <FieldLabel>File Use</FieldLabel>
                <Input size="small" placeholder="e.g. Logo, Banner…"
                    value={img.fileUse || ""}
                    onChange={(e) => onUpdate(img._uid, "fileUse", e.target.value)} />
            </div>
            <div>
                <FieldLabel>Expiry Date</FieldLabel>
                <DatePicker size="small" style={{ width: "100%" }} allowClear
                    value={img.fileExpiryDate ? dayjs(img.fileExpiryDate) : null}
                    onChange={(d) => onUpdate(img._uid, "fileExpiryDate", d ? d.toISOString() : null)}
                    format="DD MMM YYYY" placeholder="No expiry" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompanyImagesSection
//
// Props:
//   images        — array of image objects (local state in parent)
//   onChange      — (newImages) => void
//   entityTypeId  — UUID from EntityType API (e.g. Company or Location type UUID)
//   entityId      — UUID of the actual entity (companyId or locationId)
//   autoFetch     — if true, fetch saved images from API on mount (default false)
//                   Set true in CompanyDetailModal / LocationCard view mode
// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyImagesSection({
    images = [],
    onChange,
    entityTypeId,
    entityId,
    autoFetch = false,
}) {
    const [editingImg, setEditingImg] = useState(null);
    const [editSaving, setEditSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [fetching, setFetching] = useState(false);

    // ── Auto-fetch saved images when entityTypeId + entityId are available ────
    useEffect(() => {
        if (!autoFetch || !entityTypeId || !entityId) return;
        setFetching(true);
        fetchEntityFiles(entityTypeId, entityId, "Image")
            .then((files) => {
                // Only set saved images (id exists); keep any pending local ones
                const pending = images.filter((i) => !i.id && i._file);
                onChange([...files, ...pending]);
            })
            .finally(() => setFetching(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFetch, entityTypeId, entityId]);

    // ── Drop handler ──────────────────────────────────────────────────────────
    const handleDrop = useCallback(({ fileList }) => {
        const newItems = fileList
            .filter((f) => f.originFileObj)
            .filter((f) => !images.find((i) => i._uid === f.uid))
            .map((f) => ({
                ...emptyImg(),
                _uid: f.uid,
                _file: f.originFileObj,
                _previewUrl: URL.createObjectURL(f.originFileObj),
                fileName: f.name,
                fileType: "",
                fileUse: "",
                fileExpiryDate: null,
                _customType: "",
            }));
        onChange([...images, ...newItems]);
    }, [images, onChange]);

    const updateField = useCallback((uid, field, val) => {
        onChange(images.map((i) => i._uid === uid ? { ...i, [field]: val } : i));
    }, [images, onChange]);

    const handleTypeSelect = useCallback((uid, val) => {
        onChange(images.map((i) =>
            i._uid === uid
                ? { ...i, fileType: val, _customType: val === "Other" ? (i._customType || "") : "" }
                : i
        ));
    }, [images, onChange]);

    const remove = useCallback((uid) => {
        const img = images.find((i) => i._uid === uid);
        if (img?._previewUrl) URL.revokeObjectURL(img._previewUrl);
        onChange(images.filter((i) => i._uid !== uid));
    }, [images, onChange]);

    // ── Delete saved image via FileStore API ──────────────────────────────────
    const handleDeleteSaved = useCallback(async (img) => {
        setDeletingId(img.id);
        try {
            await deleteFile(img.id);
            message.success("Image deleted.");
            onChange(images.filter((i) => i._uid !== img._uid));
        } catch {
            message.error("Failed to delete image.");
        } finally {
            setDeletingId(null);
        }
    }, [images, onChange]);

    // ── Upload single pending image immediately (for LocationCard save flow) ──
    const uploadPending = useCallback(async (img) => {
        if (!entityTypeId || !entityId) {
            message.warning("Entity not saved yet — image will upload after save.");
            return;
        }
        try {
            const saved = await uploadFile({
                file: img._file,
                entityTypeId,
                entityId,
                fileCategory: "Image",
                fileUse: img.fileUse || undefined,
                fileExpiryDate: img.fileExpiryDate || undefined,
            });
            message.success("Image uploaded.");
            onChange(images.map((i) =>
                i._uid === img._uid
                    ? { ...i, ...saved, id: saved?.id ?? null, _file: null, _pending: false }
                    : i
            ));
        } catch {
            message.error("Image upload failed.");
        }
    }, [entityTypeId, entityId, images, onChange]);

    // ── Open edit modal ───────────────────────────────────────────────────────
    const openEditModal = useCallback((img) => {
        const isCustomType = img.fileType && !ALL_TYPES.includes(img.fileType);
        setEditingImg({
            img,
            fileType: isCustomType ? "Other" : (img.fileType || ""),
            _customType: isCustomType ? img.fileType : (img._customType || ""),
            fileUse: img.fileUse || "",
            fileExpiryDate: img.fileExpiryDate ? dayjs(img.fileExpiryDate) : null,
            _file: null,
        });
    }, []);

    // ── Save edit via FileStore PUT ───────────────────────────────────────────
    // const handleEditSave = useCallback(async () => {
    //     if (!editingImg) return;
    //     setEditSaving(true);
    //     try {
    //         const resolvedType = editingImg.fileType === "Other"
    //             ? (editingImg._customType?.trim() || "Other")
    //             : (editingImg.fileType || "");

    //         await updateFile(editingImg.img.id, {
    //             file:          editingImg._file || undefined,
    //             fileUse:       editingImg.fileUse || undefined,
    //             fileExpiryDate:editingImg.fileExpiryDate?.toISOString() || undefined,
    //         });
    //         message.success("Image updated.");
    //         onChange(images.map((i) =>
    //             i._uid === editingImg.img._uid ? {
    //                 ...i,
    //                 fileType:       resolvedType,
    //                 fileUse:        editingImg.fileUse,
    //                 fileExpiryDate: editingImg.fileExpiryDate?.toISOString() || null,
    //                 _customType:    editingImg.fileType === "Other" ? editingImg._customType : "",
    //                 ...(editingImg._file ? {
    //                     _file:       editingImg._file,
    //                     _previewUrl: URL.createObjectURL(editingImg._file),
    //                     fileName:    editingImg._file.name,
    //                 } : {}),
    //             } : i
    //         ));
    //         setEditingImg(null);
    //     } catch {
    //         message.error("Failed to update image.");
    //     } finally {
    //         setEditSaving(false);
    //     }
    // }, [editingImg, images, onChange]);
    const handleEditSave = useCallback(async () => {
        if (!editingImg) return;
        setEditSaving(true);
        try {
            const resolvedType = editingImg.fileType === "Other"
                ? (editingImg._customType?.trim() || "Other")
                : (editingImg.fileType || "");

            const saved = await updateFile(editingImg.img.id, {
                file: editingImg._file || undefined,
                fileUse: editingImg.fileUse || undefined,
                fileExpiryDate: editingImg.fileExpiryDate?.toISOString() || undefined,
            });
            message.success("Image updated.");

            // ✅ Server response ka naya id/data use karo
            onChange(images.map((i) =>
                i._uid === editingImg.img._uid
                    ? {
                        ...i,
                        ...saved,
                        id: saved?.id ?? i.id,
                        fileType: resolvedType,
                        _customType: editingImg.fileType === "Other" ? editingImg._customType : "",
                        _file: null,
                    }
                    : i
            ));
            setEditingImg(null);
        } catch (err) {
            console.error("Image update failed:", err);
            message.error("Failed to update image.");
        } finally {
            setEditSaving(false);
        }
    }, [editingImg, images, onChange]);

    const handleDownload = useCallback((id) => {
        const url = getImgDownloadUrl(id);
        if (url) window.open(url, "_blank");
    }, []);

    const unsavedCount = images.filter((i) => !i.id && i._file).length;

    if (fetching) return <div style={{ textAlign: "center", padding: 20 }}><Spin tip="Loading images…" /></div>;

    return (
        <div>
            {/* ── Drop zone ──────────────────────────────────────────────────── */}
            <Dragger multiple accept="image/*" beforeUpload={() => false}
                showUploadList={false} onChange={handleDrop}
                style={{ borderRadius: T.radius.md, marginBottom: 14, borderColor: "#E9D5FF", background: "#FAF5FF" }}>
                <div style={{ padding: "10px 0" }}>
                    <PictureOutlined style={{ color: T.purple.text, fontSize: 26, display: "block", marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.purple.dark, marginBottom: 3 }}>
                        Drop images here or click to upload
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>JPG, PNG, GIF, WEBP · Multiple files supported</div>
                </div>
            </Dragger>

            {/* ── PENDING images ────────────────────────────────────────────── */}
            {unsavedCount > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{
                        fontSize: 11, color: "#92400e", background: "#FFFBEB",
                        border: "1px solid #FCD34D", borderRadius: 6, padding: "6px 10px",
                        marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <LoadingOutlined style={{ fontSize: 11 }} />
                        {unsavedCount} image{unsavedCount > 1 ? "s" : ""} pending — will upload when location/company is saved.
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", marginBottom: 8, textTransform: "uppercase" }}>
                        Pending ({unsavedCount})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {images.filter((i) => !i.id && i._file).map((img, idx) => (
                            <div key={img._uid} style={{
                                padding: "12px 14px", background: "#FFFDF5",
                                border: "1px solid #FDE68A", borderRadius: T.radius.md,
                            }}>
                                <PendingImageForm img={img} onUpdate={updateField} onTypeSelect={handleTypeSelect} />
                                <div style={{ borderTop: "1px dashed #FDE68A", margin: "10px 0" }} />
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: "50%",
                                        background: T.purple.bg, color: T.purple.text,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                                    }}>{idx + 1}</div>
                                    <div style={{
                                        width: 60, height: 46, borderRadius: T.radius.sm, overflow: "hidden",
                                        flexShrink: 0, background: "#F3F4F6", border: "1px solid #E5E7EB",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {img._previewUrl
                                            ? <Image.PreviewGroup><Image src={img._previewUrl} alt="" width={60} height={46} style={{ objectFit: "cover" }} preview={{ mask: <ZoomInOutlined style={{ fontSize: 13, color: "#fff" }} /> }} /></Image.PreviewGroup>
                                            : <PictureOutlined style={{ color: "#D1D5DB", fontSize: 18 }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {img.fileName || img._file?.name || "Image"}
                                        </div>
                                        {img._file && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{(img._file.size / 1024).toFixed(1)} KB</div>}
                                        <div style={{ fontSize: 10, color: "#d97706", marginTop: 2 }}>⏳ Pending upload</div>
                                    </div>
                                    {/* Upload now (if entity already saved) */}
                                    {entityTypeId && entityId && (
                                        <Tooltip title="Upload now">
                                            <Button icon={<ReloadOutlined />} size="small" type="primary" ghost
                                                onClick={() => uploadPending(img)}
                                                style={{ color: T.teal.text, borderColor: T.teal.border }} />
                                        </Tooltip>
                                    )}
                                    <Popconfirm title="Remove image?" onConfirm={() => remove(img._uid)} okText="Remove" okButtonProps={{ danger: true }}>
                                        <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                                    </Popconfirm>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── SAVED images ──────────────────────────────────────────────── */}
            {images.some((i) => i.id) && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase" }}>
                        Saved ({images.filter((i) => i.id).length})
                    </div>
                    <Image.PreviewGroup>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {images.filter((i) => i.id).map((img, idx) => {
                                // FileStore response: filePath or fileUrl
                                const previewSrc = img._previewUrl || img.fileUrl || img.filePath || null;
                                return (
                                    <div key={img._uid || img.id} style={{
                                        padding: "12px 14px", background: "#FFFFFF",
                                        border: "1px solid #D1FAE5", borderRadius: T.radius.md,
                                    }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: "50%",
                                                background: T.purple.bg, color: T.purple.text,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2,
                                            }}>{idx + 1}</div>
                                            <div style={{
                                                width: 60, height: 46, borderRadius: T.radius.sm, overflow: "hidden",
                                                flexShrink: 0, background: "#F3F4F6", border: "1px solid #E5E7EB",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                {previewSrc
                                                    ? <Image src={previewSrc} alt="" width={60} height={46} style={{ objectFit: "cover" }}
                                                        preview={{ mask: <ZoomInOutlined style={{ fontSize: 13, color: "#fff" }} /> }} />
                                                    : <PictureOutlined style={{ color: "#D1D5DB", fontSize: 18 }} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {img.fileName || img.originalFileName || "Image"}
                                                </div>
                                                <div style={{ fontSize: 10, color: "#16a34a", marginTop: 2 }}>✓ Saved · ID: {img.id}</div>
                                                {img.fileUse && <div style={{ fontSize: 10, color: "#6B7280" }}>Use: {img.fileUse}</div>}
                                            </div>
                                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                                {previewSrc && (
                                                    <Tooltip title="Preview">
                                                        <Button icon={<ZoomInOutlined />} size="small" type="text"
                                                            style={{ color: T.blue.text }}
                                                            onClick={() => window.open(previewSrc, "_blank")} />
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Download">
                                                    <Button icon={<DownloadOutlined />} size="small" type="text"
                                                        style={{ color: "#16a34a" }}
                                                        onClick={() => handleDownload(img.id)} />
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <Button icon={<EditOutlined />} size="small" type="text"
                                                        style={{ color: T.blue.text }}
                                                        onClick={() => openEditModal(img)} />
                                                </Tooltip>
                                                <Popconfirm title="Delete image from server?" onConfirm={() => handleDeleteSaved(img)}
                                                    okText="Delete" okButtonProps={{ danger: true }}>
                                                    <Button danger icon={<DeleteOutlined />} size="small" type="text"
                                                        loading={deletingId === img.id} />
                                                </Popconfirm>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Image.PreviewGroup>
                </div>
            )}

            {images.length === 0 && (
                <div style={{ textAlign: "center", padding: "6px 0", color: "#9CA3AF", fontSize: 12 }}>
                    No images uploaded yet.
                </div>
            )}

            {/* ── Edit Modal ────────────────────────────────────────────────── */}
            <Modal title={<Space><EditOutlined style={{ color: T.blue?.text }} /><span>Edit Image</span></Space>}
                open={!!editingImg} onCancel={() => setEditingImg(null)}
                footer={[
                    <Button key="cancel" icon={<CloseOutlined />} onClick={() => setEditingImg(null)}>Cancel</Button>,
                    <Button key="save" type="primary" icon={<SaveOutlined />} loading={editSaving}
                        onClick={handleEditSave} style={{ background: T.blue?.text }}>Save Changes</Button>,
                ]}
                width={460} destroyOnClose>
                {editingImg && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "10px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 96, height: 72, borderRadius: T.radius.md, overflow: "hidden", border: "1px solid #E5E7EB", background: "#F9FAFB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {(() => {
                                    const src = editingImg._file
                                        ? URL.createObjectURL(editingImg._file)
                                        : (editingImg.img._previewUrl || editingImg.img.fileUrl || editingImg.img.filePath);
                                    return src
                                        ? <img src={src} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : <PictureOutlined style={{ color: "#D1D5DB", fontSize: 26 }} />;
                                })()}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{editingImg.img.fileName || "Image"}</div>
                                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>ID: {editingImg.img.id}</div>
                                <Upload beforeUpload={(f) => { setEditingImg((p) => ({ ...p, _file: f })); return false; }}
                                    showUploadList={false} accept="image/*">
                                    <Button size="small" icon={<PictureOutlined />}>
                                        {editingImg._file ? editingImg._file.name : "Replace File (optional)"}
                                    </Button>
                                </Upload>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <FieldLabel>File Type</FieldLabel>
                                <Select size="small" placeholder="Select type…" style={{ width: "100%" }}
                                    value={editingImg.fileType || undefined}
                                    onChange={(v) => setEditingImg((p) => ({ ...p, fileType: v, _customType: v === "Other" ? p._customType : "" }))}>
                                    {ALL_TYPES.map((t) => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                                {editingImg.fileType === "Other" && (
                                    <Input size="small" placeholder="Custom type…" style={{ marginTop: 6 }}
                                        value={editingImg._customType || ""}
                                        onChange={(e) => setEditingImg((p) => ({ ...p, _customType: e.target.value }))} autoFocus />
                                )}
                            </div>
                            <div>
                                <FieldLabel>File Use</FieldLabel>
                                <Input size="small" placeholder="e.g. Logo, Banner…"
                                    value={editingImg.fileUse || ""}
                                    onChange={(e) => setEditingImg((p) => ({ ...p, fileUse: e.target.value }))} />
                            </div>
                            <div>
                                <FieldLabel>Expiry Date</FieldLabel>
                                <DatePicker size="small" style={{ width: "100%" }} allowClear
                                    value={editingImg.fileExpiryDate}
                                    onChange={(d) => setEditingImg((p) => ({ ...p, fileExpiryDate: d }))}
                                    format="DD MMM YYYY" placeholder="No expiry" />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}