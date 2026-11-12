import { useState, useEffect } from "react";
import {
    Modal, Button, Spin, message,
} from "antd";
import {
    PictureOutlined, FileTextOutlined, UploadOutlined,
} from "@ant-design/icons";
import React from "react";

// ── DEVICE specific sections (axiosdevice / filedevicestore) ──
// company wale CompanyImagesSection / CompanyDocumentsSection hata diye,
// kyuki woh generic filestore.js use karte hain jo Device backend ke sath
// sahi se kaam nahi karta (URLs, entity resolution, etc.). Iske jagah
// Device ke apne components use kar rahe hain jo already
// filedevicestore.js + resolveDeviceFileUrl (constant.js) use karte hain.
import DeviceImagesSection, { uploadAllPendingDeviceImages } from "../devicedetails/deviceimagesection";
import DeviceDocumentsSection, { uploadAllPendingDeviceDocs } from "../devicedetails/devicedocumentsection";
import { fetchDeviceEntityFiles } from "../devicedetails/filedevicestore";
import { getEntityTypeId } from "../modelspecs/filestore";

const sectionBox = { marginTop: 12, border: "1px solid #d9d9d9", borderRadius: 6, padding: 10 };
const sectionHdr = { marginBottom: 10, fontWeight: 600, fontSize: 13, color: "#333" };

// ── Try multiple possible entity type names — some backends register it differently ──
async function resolveDeviceEntityTypeId() {
    const candidates = ["DeviceDetail", "Device", "DeviceDetails", "DeviceEntity"];
    for (const name of candidates) {
        const id = await getEntityTypeId(name);
        if (id) {
            console.log(`✅ Device EntityTypeId resolved via "${name}":`, id);
            return { id, name };
        }
    }
    console.warn("❌ Device EntityTypeId not found under any known name:", candidates);
    return { id: null, name: null };
}

export default function DeviceFilesModal({
    open, onClose,
    device,
    docTypes, issuers,
    onSuccess,
}) {
    const [deviceEntityTypeId, setDeviceEntityTypeId] = useState(null);
    const [loadingEntityType, setLoadingEntityType] = useState(false);

    const [images, setImages] = useState([]);
    const [docs, setDocs] = useState([]);

    const [fetchingFiles, setFetchingFiles] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ── Reset local state every time modal opens for a (possibly different) device ──
    useEffect(() => {
        if (!open) return;
        setImages([]);
        setDocs([]);
    }, [open, device?.id]);

    // ── Resolve Device entity type ID on open ────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setLoadingEntityType(true);
        resolveDeviceEntityTypeId()
            .then(({ id }) => {
                setDeviceEntityTypeId(id);
                if (!id) {
                    message.error("Could not resolve Device entity type. File upload/fetch will fail — check EntityType API.");
                }
            })
            .catch((err) => {
                console.error("❌ Failed to get Device EntityTypeId:", err);
                message.error("Could not load entity type. File upload may fail.");
            })
            .finally(() => setLoadingEntityType(false));
    }, [open]);

    // ── Fetch existing files once entityTypeId + device are ready ────────────────
    // Note: DeviceImagesSection / DeviceDocumentsSection can also autoFetch on
    // their own, but we fetch once here so both sections start with the same
    // merged (saved + pending) list without duplicate calls firing twice.
    useEffect(() => {
        if (!open || !device?.id || !deviceEntityTypeId) return;

        setFetchingFiles(true);
        Promise.all([
            fetchDeviceEntityFiles(deviceEntityTypeId, device.id, "Image"),
            fetchDeviceEntityFiles(deviceEntityTypeId, device.id, "Document"),
        ])
            .then(([imgs, fetchedDocs]) => {
                setImages(imgs || []);
                setDocs(fetchedDocs || []);
            })
            .catch((err) => {
                console.error("Failed to fetch existing device files:", err);
                setImages([]);
                setDocs([]);
            })
            .finally(() => setFetchingFiles(false));
    }, [open, device?.id, deviceEntityTypeId]);

    // ── Upload handler (bulk — for pending items not already uploaded individually) ──
    const handleUploadFiles = async () => {
        if (!device?.id) {
            message.error("Device information missing");
            return;
        }
        if (!deviceEntityTypeId) {
            message.error("Device entity type not resolved — cannot upload files.");
            return;
        }

        const pendingImages = images.filter(i => !i.id && i._file);
        const pendingDocs = docs.filter(d => !d.id && d._file);

        if (pendingImages.length === 0 && pendingDocs.length === 0) {
            message.warning("No files to upload");
            return;
        }

        setUploading(true);
        try {
            const [updatedImages, updatedDocs] = await Promise.all([
                uploadAllPendingDeviceImages(images, deviceEntityTypeId, device.id, device.id),
                uploadAllPendingDeviceDocs(docs, deviceEntityTypeId, device.id, device.id),
            ]);

            const imgOk = updatedImages.filter(i => i.id).length - images.filter(i => i.id).length;
            const docOk = updatedDocs.filter(d => d.id).length - docs.filter(d => d.id).length;

            setImages(updatedImages);
            setDocs(updatedDocs);

            message.success(`${imgOk} images + ${docOk} documents uploaded`);
            onSuccess?.();
        } catch (err) {
            console.error("❌ Device file upload failed:", err);
            message.error("Some files failed to upload. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const isLoading = loadingEntityType || fetchingFiles;
    const pendingCount = images.filter(i => !i.id && i._file).length
        + docs.filter(d => !d.id && d._file).length;
    const hasChanges = pendingCount > 0;

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UploadOutlined style={{ color: "#1890ff" }} />
                    <span>Device Files — {device?.shortName || device?.longName || `Device #${device?.id}`}</span>
                </div>
            }
            open={open}
            onCancel={onClose}
            width={900}
            footer={[
                <Button key="cancel" onClick={onClose}>Close</Button>,
                <Button
                    key="upload"
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={uploading}
                    disabled={!hasChanges || isLoading || !deviceEntityTypeId}
                    onClick={handleUploadFiles}
                >
                    {hasChanges ? `Upload ${pendingCount} Files` : "No files to upload"}
                </Button>,
            ]}
            destroyOnClose
        >
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>
                        <Spin tip="Loading..." />
                    </div>
                ) : !deviceEntityTypeId ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#ff4d4f" }}>
                        Device entity type not found. Please check /EntityType/get-all-entity configuration.
                    </div>
                ) : (
                    <>
                        {/* ══ IMAGES ═════════════════════════════════════════════════ */}
                        <div style={sectionBox}>
                            <div style={sectionHdr}>
                                <PictureOutlined style={{ marginRight: 4, color: "#fa8c16" }} /> Images
                            </div>
                            <DeviceImagesSection
                                images={images}
                                onChange={setImages}
                                entityTypeId={deviceEntityTypeId}
                                entityId={device?.id || null}
                                deviceId={device?.id || null}
                                autoFetch={false}
                            />
                        </div>

                        {/* ══ DOCUMENTS ══════════════════════════════════════════════ */}
                        <div style={{ ...sectionBox, marginBottom: 8 }}>
                            <div style={sectionHdr}>
                                <FileTextOutlined style={{ marginRight: 4, color: "#1890ff" }} /> Documents
                            </div>
                            <DeviceDocumentsSection
                                docs={docs}
                                onChange={setDocs}
                                docTypes={docTypes || []}
                                issuers={issuers || []}
                                modalFetching={false}
                                entityTypeId={deviceEntityTypeId}
                                entityId={device?.id || null}
                                deviceId={device?.id || null}
                                autoFetch={false}
                            />
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}