// DeviceImagesSection.jsx — DEVICE SPECIFIC IMAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
// Device ke lia alag images section
// filestoreDevice.js functions use karta hai
// axiosdevice se baat karta hai
//
// FIX: saved images ka actual thumbnail ab dikhta hai. Pehle sirf
// `img._previewUrl || img.fileUrl || img.filePath` seedha <img src> mein daal
// rahe the — backend jo `filePath` bhejta hai woh ek raw relative/Windows path
// hota hai (e.g. "Uploads\Device\Images\x.jpg"), host ke bina, isliye browser
// use load nahi kar pata tha aur sirf placeholder icon + filename dikhta tha.
// Ab `resolveDeviceFileUrl` (constant.js) use karte hain jo DEVICE_BASE_URL
// prefix karke ek valid, loadable URL banata hai.
// ─────────────────────────────────────────────────────────────────────────────

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
import {
    T, IMG_FILE_TYPES, getDeviceImgDownloadUrl, DEVICE_BASE_URL,
    resolveDeviceFileUrl,
} from "./constant";

import {
    fetchDeviceEntityFiles,
    uploadDeviceFile,
    updateDeviceFile,
    deleteDeviceFile,
    emptyDeviceImg, isDeviceImageFile
} from "./filedevicestore";

const { Option } = Select;
const { Dragger } = Upload;

const ALL_TYPES = [...(IMG_FILE_TYPES || []).filter(t => t !== "Other"), "Other"];

// ─── Small label ─────────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
    <div style={{
        fontSize: 10, fontWeight: 700, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
    }}>
        {children}
    </div>
);

// ─── Exported helper for backward compat ─────────────────────────────────────
export async function uploadAllPendingDeviceImages(images = [], entityTypeId, entityId, deviceId) {
    if (!entityTypeId || !entityId) {
        console.warn("[Device] uploadAllPendingDeviceImages: missing params");
        return images;
    }
    const result = [...images];
    for (let i = 0; i < result.length; i++) {
        const img = result[i];
        if (img.id || !img._file) continue;
        try {
            const saved = await uploadDeviceFile({
                file: img._file,
                entityTypeId,
                entityId,
                fileCategory: "Image",
                fileUse: img.fileUse || undefined,
                fileExpiryDate: img.fileExpiryDate || undefined,
                deviceId: deviceId,
            });
            result[i] = { ...img, ...saved, id: saved?.id ?? null, _file: null, _pending: false };
        } catch (err) {
            console.error("[Device] Image upload failed:", err);
        }
    }
    return result;
}

// ─── Pending image form (type / use / expiry) ────────────────────────────────
function PendingDeviceImageForm({ img, onUpdate, onTypeSelect }) {
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
                <Select
                    size="small"
                    placeholder="Select type…"
                    style={{ width: "100%" }}
                    value={dropdownVal}
                    onChange={v => onTypeSelect(img._uid, v)}
                >
                    {ALL_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                {isOther && (
                    <Input
                        size="small"
                        placeholder="Custom type…"
                        style={{ marginTop: 4 }}
                        value={customText}
                        onChange={e => onUpdate(img._uid, "_customType", e.target.value)}
                        autoFocus
                    />
                )}
            </div>
            <div>
                <FieldLabel>File Use</FieldLabel>
                <Input
                    size="small"
                    placeholder="e.g. Device Photo, Installation…"
                    value={img.fileUse || ""}
                    onChange={e => onUpdate(img._uid, "fileUse", e.target.value)}
                />
            </div>
            <div>
                <FieldLabel>Expiry Date</FieldLabel>
                <DatePicker
                    size="small"
                    style={{ width: "100%" }}
                    allowClear
                    value={img.fileExpiryDate ? dayjs(img.fileExpiryDate) : null}
                    onChange={d => onUpdate(img._uid, "fileExpiryDate", d ? d.toISOString() : null)}
                    format="DD MMM YYYY"
                    placeholder="No expiry"
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeviceImagesSection
//
// Props:
//   images        — array of image objects
//   onChange      — (newImages) => void
//   entityTypeId  — UUID from Device EntityType API
//   entityId      — UUID of the device (or location, or model spec, etc.)
//   deviceId      — Device ID (optional, for backend)
//   autoFetch     — if true, fetch saved images on mount
// ─────────────────────────────────────────────────────────────────────────────
export default function DeviceImagesSection({
    images = [],
    onChange,
    entityTypeId,
    entityId,
    deviceId,
    autoFetch = false,
}) {
    const [editingImg, setEditingImg] = useState(null);
    const [editSaving, setEditSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [fetching, setFetching] = useState(false);

    // ── Auto-fetch ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoFetch || !entityTypeId || !entityId) return;
        setFetching(true);
        fetchDeviceEntityFiles(entityTypeId, entityId, "Image")
            .then(files => {
                const pending = images.filter(i => !i.id && i._file);
                onChange([...files, ...pending]);
            })
            .finally(() => setFetching(false));
    }, [autoFetch, entityTypeId, entityId]);

    // ── Drop handler ─────────────────────────────────────────────────────────
    const handleDrop = useCallback(({ fileList }) => {
        const newItems = fileList
            .filter(f => f.originFileObj)
            .filter(f => !images.find(i => i._uid === f.uid))
            .map(f => ({
                ...emptyDeviceImg(),
                _uid: f.uid,
                _file: f.originFileObj,
                _previewUrl: URL.createObjectURL(f.originFileObj),
                fileName: f.name,
                fileType: "",
                fileUse: "",
                fileExpiryDate: null,
                _customType: "",
                deviceId: deviceId,
            }));
        onChange([...images, ...newItems]);
    }, [images, onChange, deviceId]);

    const updateField = useCallback((uid, field, val) => {
        onChange(images.map(i => i._uid === uid ? { ...i, [field]: val } : i));
    }, [images, onChange]);

    const handleTypeSelect = useCallback((uid, val) => {
        onChange(images.map(i =>
            i._uid === uid
                ? { ...i, fileType: val, _customType: val === "Other" ? (i._customType || "") : "" }
                : i
        ));
    }, [images, onChange]);

    const remove = useCallback((uid) => {
        const img = images.find(i => i._uid === uid);
        if (img?._previewUrl) URL.revokeObjectURL(img._previewUrl);
        onChange(images.filter(i => i._uid !== uid));
    }, [images, onChange]);

    // ── Delete saved image ───────────────────────────────────────────────────
    const handleDeleteSaved = useCallback(async (img) => {
        setDeletingId(img.id);
        try {
            await deleteDeviceFile(img.id);
            message.success("Device image deleted.");
            onChange(images.filter(i => i._uid !== img._uid));
        } catch {
            message.error("Failed to delete device image.");
        } finally {
            setDeletingId(null);
        }
    }, [images, onChange]);

    // ── Upload single pending image now ──────────────────────────────────────
    const uploadPending = useCallback(async (img) => {
        if (!entityTypeId || !entityId) {
            message.warning("Record not saved yet — image will upload after save.");
            return;
        }
        try {
            const saved = await uploadDeviceFile({
                file: img._file,
                entityTypeId,
                entityId,
                fileCategory: "Image",
                fileUse: img.fileUse || undefined,
                fileExpiryDate: img.fileExpiryDate || undefined,
                deviceId: deviceId,
            });
            message.success("Device image uploaded.");
            onChange(images.map(i =>
                i._uid === img._uid
                    // keep the local blob preview around even after upload so the
                    // thumbnail doesn't flash/break while the saved filePath is
                    // resolved into a full URL on next render
                    ? { ...i, ...saved, id: saved?.id ?? null, _file: null, _pending: false }
                    : i
            ));
        } catch {
            message.error("Device image upload failed.");
        }
    }, [entityTypeId, entityId, deviceId, images, onChange]);

    // ── Edit modal open ──────────────────────────────────────────────────────
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

    // ── Edit modal save ──────────────────────────────────────────────────────
    const handleEditSave = useCallback(async () => {
        if (!editingImg) return;
        setEditSaving(true);
        try {
            const resolvedType = editingImg.fileType === "Other"
                ? (editingImg._customType?.trim() || "Other")
                : (editingImg.fileType || "");

            const saved = await updateDeviceFile(editingImg.img.id, {
                file: editingImg._file || undefined,
                fileUse: editingImg.fileUse || undefined,
                fileExpiryDate: editingImg.fileExpiryDate?.toISOString() || undefined,
            });
            message.success("Device image updated.");

            onChange(images.map(i =>
                i._uid === editingImg.img._uid
                    ? {
                        ...i,
                        ...saved,
                        id: saved?.id ?? i.id,
                        fileType: resolvedType,
                        _customType: editingImg.fileType === "Other" ? editingImg._customType : "",
                        _file: null,
                        // if a new file was chosen during edit, replace the local
                        // preview so the thumbnail updates immediately
                        _previewUrl: editingImg._file ? URL.createObjectURL(editingImg._file) : i._previewUrl,
                    }
                    : i
            ));
            setEditingImg(null);
        } catch (err) {
            console.error("[Device] Image update failed:", err);
            message.error("Failed to update device image.");
        } finally {
            setEditSaving(false);
        }
    }, [editingImg, images, onChange]);

    const handleDownload = useCallback((id) => {
        const url = getDeviceImgDownloadUrl(id);
        if (url) window.open(url, "_blank");
    }, []);

    const unsavedCount = images.filter(i => !i.id && i._file).length;

    if (fetching) {
        return (
            <div style={{ textAlign: "center", padding: 20 }}>
                <Spin tip="Loading device images…" />
            </div>
        );
    }

    return (
        <div>
            {/* ── Drop zone ──────────────────────────────────────────────────── */}
            <Dragger
                multiple
                accept="image/*"
                beforeUpload={() => false}
                showUploadList={false}
                onChange={handleDrop}
                style={{
                    borderRadius: T.radius?.md || 8,
                    marginBottom: 14,
                    borderColor: "#DBEAFE",
                    background: "#EFF6FF",
                }}
            >
                <div style={{ padding: "10px 0" }}>
                    <PictureOutlined style={{ color: "#2563EB", fontSize: 26, display: "block", marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1E40AF", marginBottom: 3 }}>
                        Drop device images here or click to upload
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                        JPG, PNG, GIF, WEBP · Multiple files supported
                    </div>
                </div>
            </Dragger>

            {/* ── PENDING images ────────────────────────────────────────────── */}
            {unsavedCount > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{
                        fontSize: 11, color: "#1E40AF", background: "#DBEAFE",
                        border: "1px solid #93C5FD", borderRadius: 6, padding: "6px 10px",
                        marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <LoadingOutlined style={{ fontSize: 11 }} />
                        {unsavedCount} device image{unsavedCount > 1 ? "s" : ""} pending
                    </div>

                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "#2563EB",
                        marginBottom: 8, textTransform: "uppercase",
                    }}>
                        Pending ({unsavedCount})
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {images.filter(i => !i.id && i._file).map((img, idx) => (
                            <div key={img._uid} style={{
                                padding: "12px 14px", background: "#F0F9FF",
                                border: "1px solid #BAE6FD", borderRadius: T.radius?.md || 8,
                            }}>
                                <PendingDeviceImageForm
                                    img={img}
                                    onUpdate={updateField}
                                    onTypeSelect={handleTypeSelect}
                                />

                                <div style={{ borderTop: "1px dashed #BAE6FD", margin: "10px 0" }} />

                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: "50%",
                                        background: "#DBEAFE", color: "#2563EB",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {idx + 1}
                                    </div>

                                    <div style={{
                                        width: 60, height: 46, borderRadius: 6, overflow: "hidden",
                                        flexShrink: 0, background: "#F3F4F6", border: "1px solid #E5E7EB",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {img._previewUrl ? (
                                            <Image.PreviewGroup>
                                                <Image
                                                    src={img._previewUrl} alt=""
                                                    width={60} height={46}
                                                    style={{ objectFit: "cover" }}
                                                    preview={{ mask: <ZoomInOutlined style={{ fontSize: 13, color: "#fff" }} /> }}
                                                />
                                            </Image.PreviewGroup>
                                        ) : (
                                            <PictureOutlined style={{ color: "#D1D5DB", fontSize: 18 }} />
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 12, fontWeight: 600, color: "#374151",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {img.fileName || img._file?.name || "Device Image"}
                                        </div>
                                        {img._file && (
                                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                                {(img._file.size / 1024).toFixed(1)} KB
                                            </div>
                                        )}
                                        <div style={{ fontSize: 10, color: "#2563EB", marginTop: 2 }}>
                                            ⏳ Pending upload
                                        </div>
                                    </div>

                                    {entityTypeId && entityId && (
                                        <Tooltip title="Upload now">
                                            <Button
                                                icon={<ReloadOutlined />}
                                                size="small" type="primary" ghost
                                                onClick={() => uploadPending(img)}
                                                style={{ color: "#059669", borderColor: "#059669" }}
                                            />
                                        </Tooltip>
                                    )}

                                    <Popconfirm
                                        title="Remove image?"
                                        onConfirm={() => remove(img._uid)}
                                        okText="Remove"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                                    </Popconfirm>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── SAVED images ──────────────────────────────────────────────── */}
            {images.some(i => i.id) && (
                <div>
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                        marginBottom: 8, textTransform: "uppercase",
                    }}>
                        Saved ({images.filter(i => i.id).length})
                    </div>

                    <Image.PreviewGroup>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {images.filter(i => i.id).map((img, idx) => {
                                // FIX: resolve the actual loadable URL instead of using
                                // the raw backend path directly.
                                const previewSrc = resolveDeviceFileUrl(img);
                                return (
                                    <div key={img._uid || img.id} style={{
                                        padding: "12px 14px", background: "#FFFFFF",
                                        border: "1px solid #D1FAE5", borderRadius: T.radius?.md || 8,
                                    }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: "50%",
                                                background: "#DBEAFE", color: "#2563EB",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2,
                                            }}>
                                                {idx + 1}
                                            </div>

                                            <div style={{
                                                width: 60, height: 46, borderRadius: 6, overflow: "hidden",
                                                flexShrink: 0, background: "#F3F4F6", border: "1px solid #E5E7EB",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                {previewSrc ? (
                                                    <Image
                                                        src={previewSrc} alt=""
                                                        width={60} height={46}
                                                        style={{ objectFit: "cover" }}
                                                        preview={{ mask: <ZoomInOutlined style={{ fontSize: 13, color: "#fff" }} /> }}
                                                        fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2MCcgaGVpZ2h0PSc0Nicgdmlld0JveD0nMCAwIDYwIDQ2Jz48cmVjdCB3aWR0aD0nNjAnIGhlaWdodD0nNDYnIGZpbGw9JyNGM0Y0RjYnLz48L3N2Zz4="
                                                    />
                                                ) : (
                                                    <PictureOutlined style={{ color: "#D1D5DB", fontSize: 18 }} />
                                                )}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 12, fontWeight: 600, color: "#374151",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {img.fileName || img.originalFileName || "Device Image"}
                                                </div>
                                                <div style={{ fontSize: 10, color: "#16A34A", marginTop: 2 }}>
                                                    ✓ Saved · ID: {img.id}
                                                </div>
                                                {img.fileUse && (
                                                    <div style={{ fontSize: 10, color: "#6B7280" }}>
                                                        Use: {img.fileUse}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                                {previewSrc && (
                                                    <Tooltip title="Preview">
                                                        <Button
                                                            icon={<ZoomInOutlined />}
                                                            size="small" type="text"
                                                            style={{ color: "#2563EB" }}
                                                            onClick={() => window.open(previewSrc, "_blank")}
                                                        />
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Download">
                                                    <Button
                                                        icon={<DownloadOutlined />}
                                                        size="small" type="text"
                                                        style={{ color: "#16A34A" }}
                                                        onClick={() => handleDownload(img.id)}
                                                    />
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <Button
                                                        icon={<EditOutlined />}
                                                        size="small" type="text"
                                                        style={{ color: "#2563EB" }}
                                                        onClick={() => openEditModal(img)}
                                                    />
                                                </Tooltip>
                                                <Popconfirm
                                                    title="Delete device image?"
                                                    onConfirm={() => handleDeleteSaved(img)}
                                                    okText="Delete"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <Button
                                                        danger icon={<DeleteOutlined />}
                                                        size="small" type="text"
                                                        loading={deletingId === img.id}
                                                    />
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
                    No device images uploaded yet.
                </div>
            )}

            {/* ── Edit Modal ────────────────────────────────────────────────── */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: "#2563EB" }} />
                        <span>Edit Device Image</span>
                    </Space>
                }
                open={!!editingImg}
                onCancel={() => setEditingImg(null)}
                footer={[
                    <Button key="cancel" icon={<CloseOutlined />} onClick={() => setEditingImg(null)}>
                        Cancel
                    </Button>,
                    <Button
                        key="save" type="primary" icon={<SaveOutlined />}
                        loading={editSaving} onClick={handleEditSave}
                        style={{ background: "#2563EB" }}
                    >
                        Save Changes
                    </Button>,
                ]}
                width={460}
                destroyOnClose
            >
                {editingImg && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "10px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{
                                width: 96, height: 72, borderRadius: 8, overflow: "hidden",
                                border: "1px solid #E5E7EB", background: "#F9FAFB",
                                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {(() => {
                                    // FIX: same resolver here — was previously falling back
                                    // straight to the raw backend path.
                                    const src = editingImg._file
                                        ? URL.createObjectURL(editingImg._file)
                                        : resolveDeviceFileUrl(editingImg.img);
                                    return src ? (
                                        <img src={src} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <PictureOutlined style={{ color: "#D1D5DB", fontSize: 26 }} />
                                    );
                                })()}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                                    {editingImg.img.fileName || "Device Image"}
                                </div>
                                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
                                    ID: {editingImg.img.id}
                                </div>
                                <Upload
                                    beforeUpload={f => { setEditingImg(p => ({ ...p, _file: f })); return false; }}
                                    showUploadList={false} accept="image/*"
                                >
                                    <Button size="small" icon={<PictureOutlined />}>
                                        {editingImg._file ? editingImg._file.name : "Replace File (optional)"}
                                    </Button>
                                </Upload>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <FieldLabel>File Type</FieldLabel>
                                <Select
                                    size="small" placeholder="Select type…"
                                    style={{ width: "100%" }}
                                    value={editingImg.fileType || undefined}
                                    onChange={v => setEditingImg(p => ({
                                        ...p, fileType: v,
                                        _customType: v === "Other" ? p._customType : "",
                                    }))}
                                >
                                    {ALL_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                                {editingImg.fileType === "Other" && (
                                    <Input
                                        size="small" placeholder="Custom type…"
                                        style={{ marginTop: 6 }}
                                        value={editingImg._customType || ""}
                                        onChange={e => setEditingImg(p => ({ ...p, _customType: e.target.value }))}
                                        autoFocus
                                    />
                                )}
                            </div>
                            <div>
                                <FieldLabel>File Use</FieldLabel>
                                <Input
                                    size="small" placeholder="e.g. Device Photo…"
                                    value={editingImg.fileUse || ""}
                                    onChange={e => setEditingImg(p => ({ ...p, fileUse: e.target.value }))}
                                />
                            </div>
                            <div>
                                <FieldLabel>Expiry Date</FieldLabel>
                                <DatePicker
                                    size="small" style={{ width: "100%" }}
                                    allowClear value={editingImg.fileExpiryDate}
                                    onChange={d => setEditingImg(p => ({ ...p, fileExpiryDate: d }))}
                                    format="DD MMM YYYY" placeholder="No expiry"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}