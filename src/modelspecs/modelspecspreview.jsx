// ModelSpecPreview.jsx — MODEL SPECIFICATION PREVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
// "View" modal for a single Model Specification — Details / Parameters /
// Images / Documents tabs, styled the same way as DeviceLocationsModal's
// LocationFilesTab (teal palette, saved-file cards, badge counts).
//
// Images & Documents ab DEVICE FileStore se aaye hue records use karte hain
// (spec.images / spec.documents — jo modelspecspage.jsx ke handlePreview mein
// fetchDeviceEntityFiles se populate hote hain). Preview thumbnail ke liye
// resolveDeviceFileUrl use hota hai — raw backend path (Windows-style, bina
// host ke) seedha <img src> mein daalne se sirf placeholder + filename dikhta
// tha, ab actual image/PDF load hoti hai.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Modal, Tabs, Tag, Table, Empty, Button, Tooltip, Badge, Row, Col } from "antd";
import {
    InfoCircleOutlined, SettingOutlined, PictureOutlined, FileTextOutlined,
    DownloadOutlined, EyeOutlined, ZoomInOutlined, TableOutlined,
} from "@ant-design/icons";
import {
    T, resolveDeviceFileUrl, getDeviceImgDownloadUrl, getDeviceDocDownloadUrl,
} from "../devicedetails/constant";

// ── palette — same teal/gray tokens used across the Device module ───────────
const C = {
    teal: "#0D9488",
    tealLight: "#F0FDFA",
    tealBorder: "#99F6E4",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueBorder: "#BFDBFE",
    orange: "#C2410C",
    gray: "#6B7280",
    grayLight: "#F9FAFB",
    border: "#E5E7EB",
    ink: "#111827",
};

// ── Read-only field ───────────────────────────────────────────────────────────
function ViewField({ label, value, span = 8 }) {
    return (
        <Col xs={24} sm={span}>
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

// ── Details tab ───────────────────────────────────────────────────────────────
function DetailsTab({ spec }) {
    return (
        <div>
            <Row gutter={[24, 0]}>
                <ViewField label="Name" value={spec.name} span={8} />
                <ViewField label="Model Number" value={spec.modelNumber} span={8} />
                <ViewField label="Device Type" value={spec.deviceTypeName} span={8} />
                <ViewField label="Company" value={spec.companyName} span={8} />
                {/* <ViewField label="Model Category" value={spec.categoryName || spec.modelCategoryName} span={8} /> */}
                <ViewField label="Parameters" value={spec.parameters?.length ? `${spec.parameters.length} parameter(s)` : "—"} span={8} />
                <ViewField label="Remarks" value={spec.remarks} span={24} />
            </Row>
        </div>
    );
}

// ── Parameters tab ────────────────────────────────────────────────────────────
function ParametersTab({ parameters = [] }) {
    if (!parameters.length) {
        return <Empty description="No parameters added." style={{ padding: "24px 0" }} />;
    }

    const columns = [
        {
            title: "Category", dataIndex: "categoryName", width: 140,
            render: (v) => v ? <Tag color="purple" style={{ fontSize: 11 }}>{v}</Tag> : "—",
        },
        {
            title: "Parameter", dataIndex: "parameterName", width: 180,
            render: (v) => <span style={{ fontWeight: 500 }}>{v}</span>
        },
        { title: "Value", dataIndex: "parameterValue", width: 160 },
        {
            title: "Unit", dataIndex: "unit", width: 90,
            render: (v) => v ? <Tag>{v}</Tag> : "—",
        },
        { title: "Capacity", dataIndex: "capacity", width: 120, render: v => v || "—" },
        { title: "Processor", dataIndex: "processor", width: 120, render: v => v || "—" },
        { title: "RAM", dataIndex: "ram", width: 90, render: v => v || "—" },
        { title: "Storage", dataIndex: "storage", width: 110, render: v => v || "—" },
        { title: "Remarks", dataIndex: "remarks", ellipsis: true, render: v => v || "—" },
    ];

    return (
        <Table
            dataSource={parameters}
            rowKey={(r, i) => r.id ?? i}
            columns={columns}
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} parameters` }}
            scroll={{ x: 1100 }}
        />
    );
}

// ── Images tab — read-only cards, same shape as DeviceImagesSection saved view ─
function PreviewImagesTab({ images = [] }) {
    if (!images.length) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No images attached."
                style={{ padding: "24px 0" }}
            />
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {images.map((img, idx) => {
                const previewSrc = resolveDeviceFileUrl(img);
                return (
                    <div key={img.id || img._uid || idx} style={{
                        padding: "12px 14px", background: "#fff",
                        border: `1px solid ${C.border}`, borderRadius: T.radius?.md || 8,
                        display: "flex", alignItems: "center", gap: 12,
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: C.blueLight, color: C.blue,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, flexShrink: 0,
                        }}>
                            {idx + 1}
                        </div>

                        <div style={{
                            width: 64, height: 48, borderRadius: 6, overflow: "hidden",
                            flexShrink: 0, background: "#F3F4F6", border: `1px solid ${C.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {previewSrc ? (
                                <img
                                    src={previewSrc} alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                            ) : (
                                <PictureOutlined style={{ color: "#D1D5DB", fontSize: 18 }} />
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: 12, fontWeight: 600, color: C.ink,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                                {img.fileName || img.originalFileName || "Image"}
                            </div>
                            {img.fileType && (
                                <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>Type: {img.fileType}</div>
                            )}
                            {img.fileUse && (
                                <div style={{ fontSize: 10, color: C.gray }}>Use: {img.fileUse}</div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            {previewSrc && (
                                <Tooltip title="Preview">
                                    <Button icon={<ZoomInOutlined />} size="small" type="text"
                                        style={{ color: C.blue }}
                                        onClick={() => window.open(previewSrc, "_blank")} />
                                </Tooltip>
                            )}
                            {img.id && (
                                <Tooltip title="Download">
                                    <Button icon={<DownloadOutlined />} size="small" type="text"
                                        style={{ color: C.green }}
                                        onClick={() => window.open(getDeviceImgDownloadUrl(img.id), "_blank")} />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Documents tab — read-only table with preview + download ──────────────────
function PreviewDocumentsTab({ documents = [] }) {
    if (!documents.length) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No documents attached."
                style={{ padding: "24px 0" }}
            />
        );
    }

    const columns = [
        {
            title: "Document", dataIndex: "documentName", ellipsis: true,
            render: (v, r) => (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FileTextOutlined style={{ color: C.blue }} />
                    <span style={{ fontWeight: 500 }}>{v || r.fileName || "Untitled"}</span>
                </span>
            ),
        },
        { title: "Doc. Number", dataIndex: "documentNumber", width: 140, render: v => v || "—" },
        {
            title: "Issue Date", dataIndex: "issuedByDate", width: 120,
            render: v => v ? new Date(v).toISOString().slice(0, 10) : "—",
        },
        {
            title: "Valid Till", dataIndex: "documentValidTill", width: 120,
            render: v => v ? new Date(v).toISOString().slice(0, 10) : "—",
        },
        {
            title: "Actions", width: 100, fixed: "right",
            render: (_, doc) => {
                const viewUrl = resolveDeviceFileUrl(doc);
                return (
                    <div style={{ display: "flex", gap: 4 }}>
                        {viewUrl && (
                            <Tooltip title="Preview">
                                <Button icon={<EyeOutlined />} size="small" type="text"
                                    style={{ color: C.blue }}
                                    onClick={() => window.open(viewUrl, "_blank")} />
                            </Tooltip>
                        )}
                        {doc.id && (
                            <Tooltip title="Download">
                                <Button icon={<DownloadOutlined />} size="small" type="text"
                                    style={{ color: C.green }}
                                    onClick={() => window.open(getDeviceDocDownloadUrl(doc.id), "_blank")} />
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <Table
            dataSource={documents}
            rowKey={(r, i) => r.id ?? i}
            columns={columns}
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} documents` }}
            scroll={{ x: 700 }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ModelSpecPreview — main modal
//
// Props (unchanged signature — called from modelspecspage.jsx):
//   spec        — { name, modelNumber, deviceTypeName, companyName, remarks,
//                   parameters: [], images: [], documents: [] } | null
//   activeTab   — "details" | "parameters" | "images" | "documents"
//   onTabChange — (key) => void
//   onClose     — () => void
// ═══════════════════════════════════════════════════════════════════════════════
export default function ModelSpecPreview({ spec, activeTab = "details", onTabChange, onClose }) {
    if (!spec) return null;

    const imgCount = spec.images?.length || 0;
    const docCount = spec.documents?.length || 0;
    const paramCount = spec.parameters?.length || 0;

    const tabItems = [
        {
            key: "details",
            label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><InfoCircleOutlined /> Details</span>,
            children: <DetailsTab spec={spec} />,
        },
        {
            key: "parameters",
            label: (
                <Badge size="small" count={paramCount} offset={[6, -2]} style={{ background: C.teal }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: paramCount ? 10 : 0 }}>
                        <SettingOutlined /> Parameters
                    </span>
                </Badge>
            ),
            children: <ParametersTab parameters={spec.parameters} />,
        },
        {
            key: "images",
            label: (
                <Badge size="small" count={imgCount} offset={[6, -2]} style={{ background: C.teal }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: imgCount ? 10 : 0 }}>
                        <PictureOutlined /> Images
                    </span>
                </Badge>
            ),
            children: <PreviewImagesTab images={spec.images} />,
        },
        {
            key: "documents",
            label: (
                <Badge size="small" count={docCount} offset={[6, -2]} style={{ background: C.teal }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: docCount ? 10 : 0 }}>
                        <FileTextOutlined /> Documents
                    </span>
                </Badge>
            ),
            children: <PreviewDocumentsTab documents={spec.documents} />,
        },
    ];

    return (
        <Modal
            open={!!spec}
            onCancel={onClose}
            width={900}
            style={{ top: 20 }}
            styles={{ body: { padding: "0 20px 8px", maxHeight: "78vh", overflowY: "auto" } }}
            footer={[<Button key="close" onClick={onClose}>Close</Button>]}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: C.tealLight, border: `1px solid ${C.tealBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <TableOutlined style={{ color: C.teal, fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
                            {spec.name || "Model Specification"}
                        </div>
                        <div style={{ fontSize: 11, color: C.gray, fontWeight: 400 }}>
                            {spec.modelNumber ? `#${spec.modelNumber} · ` : ""}
                            {spec.deviceTypeName || "—"}
                        </div>
                    </div>
                </div>
            }
            destroyOnClose
        >
            <Tabs
                activeKey={activeTab}
                onChange={onTabChange}
                items={tabItems}
                size="small"
                tabBarStyle={{ marginBottom: 16, position: "sticky", top: 0, background: "#fff", zIndex: 1 }}
            />
        </Modal>
    );
}