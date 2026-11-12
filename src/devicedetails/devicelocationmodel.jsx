// DeviceLocationsModal.jsx — DEVICE LOCATIONS MODAL
// ─────────────────────────────────────────────────────────────────────────────
// Device ke locations manage karne ka modal
// Har location card ke andar 3 Tabs:
//    1) Details    → location ki saari info (view / edit)
//    2) Images     → DeviceImagesSection
//    3) Documents  → DeviceDocumentsSection
// filestoreDevice.js + axiosdevice use karta hai files ke lia
// axiosdevice use karta hai Country/State/City ke lia
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import {
    Modal, Button, Spin, message, Form, Input, Select, Row, Col, Card, Space,
    Popconfirm, Badge, Tabs, Empty,
} from "antd";
import {
    EnvironmentOutlined, PlusOutlined, ExclamationCircleOutlined,
    EditOutlined, SaveOutlined, DeleteOutlined,
    PictureOutlined, FileTextOutlined, UploadOutlined,
    ApartmentOutlined, InfoCircleOutlined, LockOutlined,
} from "@ant-design/icons";
import axiosInstance, { axiosdevice } from "../../config";
import { toArray } from "./helpers";
import DeviceImagesSection from "./deviceimagesection";
import DeviceDocumentsSection from "./devicedocumentsection";
import {
    uploadDeviceEntityFiles,
    getDeviceEntityTypeId,
    fetchDeviceEntityFiles,
} from "./filedevicestore";

const { Option } = Select;

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
    teal: "#0D9488",
    tealLight: "#F0FDFA",
    tealBorder: "#99F6E4",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    amberBorder: "#FDE68A",
    amberDark: "#92400E",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueBorder: "#BFDBFE",
    gray: "#6B7280",
    grayLight: "#F9FAFB",
    border: "#E5E7EB",
    red: "#DC2626",
    redLight: "#FEF2F2",
    redBorder: "#FECACA",
    ink: "#111827",
};

// EntityType name — backend mein yeh hona chahiye
const LOCATION_ENTITY_NAME = "DeviceLocation";

const LOCATION_TYPES = ["HQ", "Branch", "Warehouse", "Regional Office", "Storage"];

const TYPE_COLORS = {
    HQ: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    Branch: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
    Warehouse: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
    "Regional Office": { bg: "#FAF5FF", color: "#7E22CE", border: "#E9D5FF" },
    Storage: { bg: "#F9FAFB", color: "#374151", border: "#D1D5DB" },
};

// ── Empty location template ───────────────────────────────────────────────────
export function emptyDeviceLocation() {
    return {
        id: null,
        locationType: "HQ",
        addressLine1: "",
        addressLine2: "",
        countryId: null,
        stateId: null,
        cityId: null,
        pinCode: "",
        landmark: "",
        latitude: "",
        longitude: "",
        timeZoneId: null,
        locationContactNumber: "",
    };
}

// ── View field helper (used in read-only Details tab) ─────────────────────────
function ViewField({ label, value, span }) {
    return (
        <Col xs={24} sm={span || 8}>
            <div style={{ marginBottom: 14 }}>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: 13, color: value ? C.ink : "#C1C7D0", fontWeight: 500,
                    lineHeight: 1.4, wordBreak: "break-word",
                }}>
                    {value || "—"}
                </div>
            </div>
        </Col>
    );
}

// ── Document name resolver ──────────────────────────────────────────────────
// Backend document record mein naam kabhi "documentName", kabhi "docTypeName",
// kabhi sirf "documentTypeId" (jisse docTypes list se naam nikalna padta hai),
// ya sirf "fileName" mein aata hai. Yeh helper sab combinations try karta hai
// taaki naam kabhi khaali na dikhe.
function resolveDocumentName(doc, docTypes = []) {
    if (!doc) return "Document";
    const directName =
        doc.documentName ||
        doc.docTypeName ||
        doc.documentTypeName ||
        doc.typeName ||
        doc.name;
    if (directName) return directName;

    const typeId = doc.documentTypeId ?? doc.docTypeId ?? doc.typeId;
    if (typeId != null) {
        const match = docTypes.find(dt => String(dt.id) === String(typeId));
        if (match) return match.name || match.documentTypeName || match.typeName;
    }

    return doc.fileName || "Document";
}

// ═══════════════════════════════════════════════════════════════════════════════
// useLocationFiles — shared data-fetching hook (Images + Documents tabs dono
// isi ek hook se data lete hain, taaki entityTypeId aur files sirf ek baar fetch ho)
// ═══════════════════════════════════════════════════════════════════════════════
function useLocationFiles(locationId) {
    const [entityTypeId, setEntityTypeId] = useState(null);
    const [loadingType, setLoadingType] = useState(false);
    const [existingImages, setExistingImages] = useState([]);
    const [pendingImages, setPendingImages] = useState([]);
    const [existingDocs, setExistingDocs] = useState([]);
    const [pendingDocs, setPendingDocs] = useState([]);
    const [fetchingFiles, setFetchingFiles] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ── Get EntityTypeId from DEVICE API ────────────────────────────────────
    useEffect(() => {
        if (!locationId) return;
        setLoadingType(true);
        getDeviceEntityTypeId(LOCATION_ENTITY_NAME)
            .then(id => {
                if (id) {
                    setEntityTypeId(id);
                } else {
                    message.warning(`Entity type "${LOCATION_ENTITY_NAME}" not found in Device API`);
                }
            })
            .catch(() => {
                message.error("Could not load entity type for device location");
            })
            .finally(() => setLoadingType(false));
    }, [locationId]);

    const refetch = useCallback(() => {
        if (!locationId || !entityTypeId) return Promise.resolve();
        setFetchingFiles(true);
        return Promise.all([
            fetchDeviceEntityFiles(entityTypeId, locationId, "Image"),
            fetchDeviceEntityFiles(entityTypeId, locationId, "Document"),
        ])
            .then(([imgs, docs]) => {
                setExistingImages(imgs || []);
                setExistingDocs(docs || []);
            })
            .catch(() => {
                setExistingImages([]);
                setExistingDocs([]);
            })
            .finally(() => setFetchingFiles(false));
    }, [locationId, entityTypeId]);

    // ── Fetch files from DEVICE API ─────────────────────────────────────────
    useEffect(() => {
        refetch();
    }, [refetch]);

    const mergedImages = [...existingImages, ...pendingImages];
    const mergedDocs = [...existingDocs, ...pendingDocs];

    const handleImagesChange = (all) => {
        setExistingImages(all.filter(i => i.id));
        setPendingImages(all.filter(i => !i.id));
    };

    const handleDocsChange = (all) => {
        setExistingDocs(all.filter(d => d.id));
        setPendingDocs(all.filter(d => !d.id));
    };

    const handleUploadImages = async () => {
        if (!locationId || !entityTypeId) {
            message.error("Location info missing");
            return;
        }
        if (!pendingImages.length) {
            message.warning("No new images to upload");
            return;
        }
        setUploading(true);
        try {
            await uploadDeviceEntityFiles({
                entityName: LOCATION_ENTITY_NAME,
                entityId: locationId,
                deviceId: locationId,
                images: pendingImages,
                docs: [],
                onSuccess: (imgC) => {
                    if (imgC > 0) message.success(`${imgC} image(s) uploaded`);
                },
                onFileError: (name) => message.error(`Failed: "${name}"`),
            });
            setPendingImages([]);
            await refetch();
        } catch {
            message.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleUploadDocs = async () => {
        if (!locationId || !entityTypeId) {
            message.error("Location info missing");
            return;
        }
        if (!pendingDocs.length) {
            message.warning("No new documents to upload");
            return;
        }
        setUploading(true);
        try {
            await uploadDeviceEntityFiles({
                entityName: LOCATION_ENTITY_NAME,
                entityId: locationId,
                deviceId: locationId,
                images: [],
                docs: pendingDocs,
                onSuccess: (_imgC, docC) => {
                    if (docC > 0) message.success(`${docC} document(s) uploaded`);
                },
                onFileError: (name) => message.error(`Failed: "${name}"`),
            });
            setPendingDocs([]);
            await refetch();
        } catch {
            message.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return {
        entityTypeId,
        isLoading: loadingType || fetchingFiles,
        mergedImages,
        mergedDocs,
        pendingImages,
        pendingDocs,
        handleImagesChange,
        handleDocsChange,
        handleUploadImages,
        handleUploadDocs,
        uploading,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LocationImagesTab
// ═══════════════════════════════════════════════════════════════════════════════
function LocationImagesTab({ filesState }) {
    const {
        entityTypeId, isLoading, mergedImages, pendingImages,
        handleImagesChange, handleUploadImages, uploading,
    } = filesState;

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", padding: 36 }}>
                <Spin tip="Loading images..." />
            </div>
        );
    }

    if (!entityTypeId) {
        return (
            <div style={{
                textAlign: "center", padding: "20px 14px",
                background: C.redLight, border: `1px solid ${C.redBorder}`,
                borderRadius: 8, fontSize: 12, color: C.red,
            }}>
                Entity type "{LOCATION_ENTITY_NAME}" not found in Device API.
            </div>
        );
    }

    return (
        <div>
            {pendingImages.length > 0 && (
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 16, padding: "10px 14px",
                    background: C.blueLight, borderRadius: 8,
                    border: `1px solid ${C.blueBorder}`,
                }}>
                    <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>
                        {pendingImages.length} image(s) ready to upload
                    </span>
                    <Button size="small" type="primary" icon={<UploadOutlined />}
                        loading={uploading} onClick={handleUploadImages}
                        style={{ background: C.blue, borderColor: C.blue, borderRadius: 6 }}>
                        Upload Images
                    </Button>
                </div>
            )}

            <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 10,
            }}>
                <PictureOutlined style={{ color: "#C2410C" }} />
                IMAGES
                {filesState.mergedImages.length > 0 && (
                    <Badge count={filesState.mergedImages.length} style={{ background: C.teal }} />
                )}
            </div>
            <DeviceImagesSection
                images={mergedImages}
                onChange={handleImagesChange}
                entityTypeId={entityTypeId}
                entityId={filesState.locationId}
                deviceId={filesState.locationId}
                autoFetch={false}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LocationDocumentsTab
// ═══════════════════════════════════════════════════════════════════════════════
function LocationDocumentsTab({ filesState, docTypes, issuers }) {
    const {
        entityTypeId, isLoading, mergedDocs, pendingDocs,
        handleDocsChange, handleUploadDocs, uploading,
    } = filesState;

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", padding: 36 }}>
                <Spin tip="Loading documents..." />
            </div>
        );
    }

    if (!entityTypeId) {
        return (
            <div style={{
                textAlign: "center", padding: "20px 14px",
                background: C.redLight, border: `1px solid ${C.redBorder}`,
                borderRadius: 8, fontSize: 12, color: C.red,
            }}>
                Entity type "{LOCATION_ENTITY_NAME}" not found in Device API.
            </div>
        );
    }

    // 🔧 FIX: har doc mein "documentName" ko normalize karke inject karo,
    // taaki DeviceDocumentsSection ko hamesha ek consistent naam mile
    // chahe backend field ka naam kuch bhi ho (documentTypeId, docTypeName, etc.)
    const normalizedDocs = mergedDocs.map(d => ({
        ...d,
        documentName: resolveDocumentName(d, docTypes),
    }));

    return (
        <div>
            {pendingDocs.length > 0 && (
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 16, padding: "10px 14px",
                    background: C.blueLight, borderRadius: 8,
                    border: `1px solid ${C.blueBorder}`,
                }}>
                    <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>
                        {pendingDocs.length} document(s) ready to upload
                    </span>
                    <Button size="small" type="primary" icon={<UploadOutlined />}
                        loading={uploading} onClick={handleUploadDocs}
                        style={{ background: C.blue, borderColor: C.blue, borderRadius: 6 }}>
                        Upload Documents
                    </Button>
                </div>
            )}

            <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 10,
            }}>
                <FileTextOutlined style={{ color: C.blue }} />
                DOCUMENTS
                {mergedDocs.length > 0 && (
                    <Badge count={mergedDocs.length} style={{ background: C.teal }} />
                )}
            </div>
            <DeviceDocumentsSection
                docs={normalizedDocs}
                onChange={handleDocsChange}
                docTypes={docTypes || []}
                issuers={issuers || []}
                modalFetching={false}
                entityTypeId={entityTypeId}
                entityId={filesState.locationId}
                deviceId={filesState.locationId}
                autoFetch={false}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LocationDetailsTab — view / edit form for a single location
// ═══════════════════════════════════════════════════════════════════════════════
function LocationDetailsTab({
    loc, editing, setEditing,
    onUpdate, onSave, saving,
    countries, timezones,
}) {
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        if (loc.countryId) {
            axiosInstance.get(`/State/by-country/${loc.countryId}`)
                .then(r => setStates(toArray(r)))
                .catch(() => setStates([]));
        }
    }, [loc.countryId]);

    useEffect(() => {
        if (loc.stateId) {
            axiosInstance.get(`/City/by-state/${loc.stateId}`)
                .then(r => setCities(toArray(r)))
                .catch(() => setCities([]));
        }
    }, [loc.stateId]);

    const handleCountry = async (v) => {
        onUpdate("countryId", v);
        onUpdate("stateId", null);
        onUpdate("cityId", null);
        setStates([]);
        setCities([]);
        try {
            const res = await axiosInstance.get(`/State/by-country/${v}`);
            setStates(toArray(res));
        } catch { /* ignore */ }
    };

    const handleState = async (v) => {
        onUpdate("stateId", v);
        onUpdate("cityId", null);
        setCities([]);
        try {
            const res = await axiosInstance.get(`/City/by-state/${v}`);
            setCities(toArray(res));
        } catch { /* ignore */ }
    };

    const handleSaveClick = async () => {
        await onSave();
        setEditing(false);
    };

    const tc = TYPE_COLORS[loc.locationType] || TYPE_COLORS.Storage;

    // ── VIEW MODE ─────────────────────────────────────────────────────────────
    if (loc.id && !editing) {
        return (
            <div>
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 18,
                }}>
                    <span style={{
                        background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                    }}>
                        {loc.locationType || "—"}
                    </span>
                    <Button icon={<EditOutlined />} size="small" onClick={() => setEditing(true)}
                        style={{ borderRadius: 6 }}>
                        Edit Details
                    </Button>
                </div>

                <Row gutter={[24, 0]}>
                    <ViewField label="Address Line 1" value={loc.addressLine1} span={12} />
                    <ViewField label="Address Line 2" value={loc.addressLine2} span={12} />
                    <ViewField label="Pin Code" value={loc.pinCode} span={6} />
                    <ViewField label="Landmark" value={loc.landmark} span={6} />
                    <ViewField label="Contact Number" value={loc.locationContactNumber} span={6} />
                    <ViewField
                        label="Timezone"
                        value={timezones.find(t => t.id === loc.timeZoneId)?.timeZoneName}
                        span={6}
                    />
                    <ViewField label="Latitude" value={loc.latitude} span={6} />
                    <ViewField label="Longitude" value={loc.longitude} span={6} />
                </Row>
            </div>
        );
    }

    // ── EDIT MODE ─────────────────────────────────────────────────────────────
    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col xs={24} sm={8}>
                    <Form.Item label="Location Type" style={{ marginBottom: 14 }}>
                        <Select size="middle" placeholder="Select type" style={{ width: "100%" }}
                            value={loc.locationType || undefined}
                            onChange={v => onUpdate("locationType", v)}>
                            {LOCATION_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item label="Address Line 1" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.addressLine1}
                            onChange={e => onUpdate("addressLine1", e.target.value)} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item label="Address Line 2" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.addressLine2}
                            onChange={e => onUpdate("addressLine2", e.target.value)} />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                    <Form.Item label="Country" style={{ marginBottom: 14 }}>
                        <Select showSearch size="middle" placeholder="Country"
                            style={{ width: "100%" }} value={loc.countryId || undefined}
                            filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                            onChange={handleCountry}>
                            {countries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item label="State" style={{ marginBottom: 14 }}>
                        <Select showSearch size="middle" placeholder="State"
                            style={{ width: "100%" }} value={loc.stateId || undefined}
                            disabled={!states.length}
                            filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                            onChange={handleState}>
                            {states.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item label="City" style={{ marginBottom: 14 }}>
                        <Select showSearch size="middle" placeholder="City"
                            style={{ width: "100%" }} value={loc.cityId || undefined}
                            disabled={!cities.length}
                            filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                            onChange={v => onUpdate("cityId", v)}>
                            {cities.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={12} sm={6}>
                    <Form.Item label="Pin Code" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.pinCode}
                            onChange={e => onUpdate("pinCode", e.target.value)} />
                    </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                    <Form.Item label="Landmark" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.landmark}
                            onChange={e => onUpdate("landmark", e.target.value)} />
                    </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                    <Form.Item label="Latitude" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.latitude}
                            onChange={e => onUpdate("latitude", e.target.value)} />
                    </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                    <Form.Item label="Longitude" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.longitude}
                            onChange={e => onUpdate("longitude", e.target.value)} />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item label="Timezone" style={{ marginBottom: 14 }}>
                        <Select showSearch size="middle" placeholder="Timezone"
                            style={{ width: "100%" }} value={loc.timeZoneId || undefined}
                            filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                            onChange={v => onUpdate("timeZoneId", v)}>
                            {timezones.map(t => (
                                <Option key={t.id} value={t.id}>
                                    {t.timeZoneName}{t.utcOffset ? ` (${t.utcOffset})` : ""}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="Contact Number" style={{ marginBottom: 14 }}>
                        <Input size="middle" value={loc.locationContactNumber}
                            onChange={e => onUpdate("locationContactNumber", e.target.value)} />
                    </Form.Item>
                </Col>
            </Row>

            <div style={{
                display: "flex", justifyContent: "flex-end", gap: 8,
                borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4,
            }}>
                {loc.id && (
                    <Button size="middle" onClick={() => setEditing(false)} style={{ borderRadius: 6 }}>
                        Cancel
                    </Button>
                )}
                <Button type="primary" size="middle" loading={saving}
                    icon={<SaveOutlined />}
                    style={{ background: C.teal, borderColor: C.teal, borderRadius: 6 }}
                    onClick={handleSaveClick}>
                    Save Location
                </Button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LocationCardDevice — single location card with 3 tabs
// ═══════════════════════════════════════════════════════════════════════════════
const LocationCardDevice = ({
    loc, index,
    onUpdate, onDelete, onSave,
    saving, deleting,
    countries, timezones,
    docTypes, issuers,
}) => {
    const [editing, setEditing] = useState(!loc.id);
    const [activeTab, setActiveTab] = useState("details");

    const tc = TYPE_COLORS[loc.locationType] || TYPE_COLORS.Storage;

    // 🔧 Shared files-state hook — Images aur Documents tab dono isi se
    // data lete hain (sirf ek baar fetch hoga, tab switch karne par dubara nahi)
    const filesState = useLocationFiles(loc.id);
    filesState.locationId = loc.id; // convenience — tabs ko entityId/deviceId ke liye chahiye

    const tabItems = [
        {
            key: "details",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <InfoCircleOutlined /> Details
                </span>
            ),
            children: (
                <LocationDetailsTab
                    loc={loc}
                    editing={editing}
                    setEditing={setEditing}
                    onUpdate={onUpdate}
                    onSave={onSave}
                    saving={saving}
                    countries={countries}
                    timezones={timezones}
                />
            ),
        },
        {
            key: "images",
            disabled: !loc.id,
            label: (
                <Space size={6}>
                    {!loc.id ? <LockOutlined /> : <PictureOutlined />}
                    Images
                    {loc.id && filesState.mergedImages.length > 0 && (
                        <Badge count={filesState.mergedImages.length} style={{ background: C.teal }} />
                    )}
                </Space>
            ),
            children: loc.id
                ? <LocationImagesTab filesState={filesState} />
                : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Save this location first to add images."
                        style={{ padding: "24px 0" }}
                    />
                ),
        },
        {
            key: "documents",
            disabled: !loc.id,
            label: (
                <Space size={6}>
                    {!loc.id ? <LockOutlined /> : <FileTextOutlined />}
                    Documents
                    {loc.id && filesState.mergedDocs.length > 0 && (
                        <Badge count={filesState.mergedDocs.length} style={{ background: C.teal }} />
                    )}
                </Space>
            ),
            children: loc.id
                ? <LocationDocumentsTab filesState={filesState} docTypes={docTypes} issuers={issuers} />
                : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Save this location first to add documents."
                        style={{ padding: "24px 0" }}
                    />
                ),
        },
    ];

    return (
        <Card
            size="small"
            style={{
                marginBottom: 16,
                border: editing ? `1.5px solid ${C.tealBorder}` : `1px solid ${C.border}`,
                background: "#fff",
                borderRadius: 12,
                boxShadow: editing
                    ? "0 2px 12px rgba(13,148,136,0.10)"
                    : "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.2s",
                overflow: "hidden",
            }}
            styles={{ body: { padding: "16px 20px 18px" } }}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, padding: "4px 0" }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: C.tealLight, border: `1px solid ${C.tealBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <EnvironmentOutlined style={{ color: C.teal, fontSize: 14 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>
                            Location {index + 1}
                        </div>
                        {loc.addressLine1 && (
                            <div style={{
                                fontSize: 11, color: C.gray, fontWeight: 400,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                maxWidth: 260,
                            }}>
                                {loc.addressLine1}
                            </div>
                        )}
                    </div>
                    <span style={{
                        background: loc.id ? C.greenLight : C.amberLight,
                        color: loc.id ? C.green : C.amber,
                        fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
                        marginLeft: 4, flexShrink: 0,
                    }}>
                        {loc.id ? "Saved" : "Unsaved"}
                    </span>
                </div>
            }
            extra={
                <Popconfirm title="Delete this location?"
                    description="This action cannot be undone."
                    onConfirm={onDelete} okText="Delete"
                    okButtonProps={{ danger: true }}>
                    <Button danger icon={<DeleteOutlined />} size="small"
                        loading={deleting} style={{ borderRadius: 6 }}>
                        Delete
                    </Button>
                </Popconfirm>
            }
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="small"
                tabBarStyle={{ marginBottom: 18 }}
            />
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DeviceLocationsModal — main modal
// ═══════════════════════════════════════════════════════════════════════════════
export default function DeviceLocationsModal({
    open,
    onCancel,
    device,
    assignedLocations,
    setAssignedLocations,
    locationLoading,
    savingLocIdx,
    deletingLocId,
    countries,
    timezones,
    onUpdate,
    onSave,
    onDelete,
    docTypes,
    issuers,
}) {
    const locCount = assignedLocations.length;
    const unsaved = assignedLocations.filter(l => !l.id).length;

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: C.tealLight, border: `1px solid ${C.tealBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <ApartmentOutlined style={{ color: C.teal, fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
                            {device?.shortName || device?.longName || `Device #${device?.id}`}
                        </div>
                        <div style={{ fontSize: 11, color: C.gray, fontWeight: 400 }}>
                            Locations, Images & Documents
                            {locCount > 0 && (
                                <span style={{ marginLeft: 8, color: C.teal }}>
                                    ({locCount} location{locCount > 1 ? "s" : ""})
                                </span>
                            )}
                            {unsaved > 0 && (
                                <span style={{ marginLeft: 8, color: C.amber }}>
                                    ({unsaved} unsaved)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            }
            open={open}
            onCancel={onCancel}
            width={1000}
            style={{ top: 16 }}
            styles={{
                body: { padding: "0 20px", maxHeight: "80vh", overflowY: "auto" },
            }}
            footer={[
                <Button key="close" onClick={onCancel} style={{ borderRadius: 6 }}>
                    Close
                </Button>,
                <Button key="add" icon={<PlusOutlined />}
                    onClick={() => setAssignedLocations(p => [...p, emptyDeviceLocation()])}
                    style={{ borderStyle: "dashed", borderRadius: 6, color: C.teal, borderColor: C.teal }}>
                    Add Location
                </Button>,
            ]}
            destroyOnClose
        >
            <div style={{ padding: "16px 0" }}>
                {/* Info banner */}
                <div style={{
                    background: C.amberLight, border: `1px solid ${C.amberBorder}`,
                    borderRadius: 8, padding: "10px 14px", marginBottom: 18,
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    <ExclamationCircleOutlined style={{ color: C.amber, fontSize: 14, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.amberDark, lineHeight: 1.5 }}>
                        Each location is saved independently — fill in the <strong>Details</strong> tab,
                        click <strong>Save Location</strong>, then switch to the
                        <strong> Images</strong> or <strong>Documents</strong> tab to attach files.
                    </span>
                </div>

                {/* Loading */}
                {locationLoading ? (
                    <div style={{ textAlign: "center", padding: 48 }}>
                        <Spin tip="Loading device locations..." />
                    </div>
                ) : assignedLocations.length === 0 ? (
                    /* Empty */
                    <div style={{
                        textAlign: "center", padding: "48px 20px",
                        background: C.grayLight, borderRadius: 12,
                        border: `1.5px dashed ${C.tealBorder}`,
                    }}>
                        <EnvironmentOutlined style={{
                            fontSize: 36, color: C.teal,
                            marginBottom: 10, display: "block",
                        }} />
                        <p style={{ color: C.gray, fontSize: 13, marginBottom: 4 }}>
                            No locations assigned to this device yet.
                        </p>
                        <p style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 0 }}>
                            Click <strong>"Add Location"</strong> below to get started.
                        </p>
                    </div>
                ) : (
                    /* Cards */
                    assignedLocations.map((loc, index) => (
                        <LocationCardDevice
                            key={loc.id || `new-${index}`}
                            loc={loc}
                            index={index}
                            countries={countries}
                            timezones={timezones}
                            docTypes={docTypes}
                            issuers={issuers}
                            onUpdate={(field, val) => onUpdate(index, field, val)}
                            onSave={() => onSave(index)}
                            onDelete={() => onDelete(index)}
                            saving={savingLocIdx === index}
                            deleting={deletingLocId === loc.id}
                        />
                    ))
                )}
            </div>
        </Modal>
    );
}