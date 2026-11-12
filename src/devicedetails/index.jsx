// DeviceDetail.jsx — server-side search + filters + export + QR tracking + DEVICE ASSOCIATION
// ════════════════════════════════════════════════════════════════════════════════
// DEVICEDETAIL.JSX - CLEAN IMPORTS (replace all import section with this)
// ════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import {
    Row, Col, Card, Space, Button, Modal,
    Typography, message, Descriptions, Tag,
    Pagination, Input, Select, Tooltip, Image,
    Empty, Spin,
} from "antd";
import {
    LaptopOutlined, PlusOutlined, ReloadOutlined,
    ExclamationCircleOutlined, CalendarOutlined,
    ImportOutlined, SearchOutlined, DownloadOutlined,
    QrcodeOutlined, FileOutlined, PictureOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import axiosInstance, { axiosdevice } from "../../config";

import { EMPTY_FORM, resolveDeviceFileUrl } from "./constant";
import { createDeviceDetail, updateDeviceDetail, deleteDeviceDetail, buildPayload } from "./helpers";

import DeviceDetailTable from "./devicedetailstable";
import DeviceLifecycleModal from "./devicelifecycle";
import DeviceDetailModal from "./devicedetailsmodel";
import ImportDeviceDetailModal from "./excelfile";
import QRModal from "./qrmodel";
import DeviceAssociationModal from "./deviceassociationmodel";
import DeviceAssociationPanel from "./deviceassociatePanel";
import DeviceFilesModal from "./devicedetailfile";           // ← NEW
// ── CHANGED: DeviceLocationsModal + emptyDeviceLocation import ──
import DeviceLocationsModal, { emptyDeviceLocation } from "./devicelocationmodel";
// ── CHANGED: uploadEntityFiles import add kiya ──
import { fetchEntityFiles, getEntityTypeId, uploadEntityFiles } from "../modelspecs/filestore";
import ExcelExport from "../entity/excelexport";
import GenericImportModal from "./GenericImportFIle";
import { DocumentTypeButton } from "./DocumentType";

const { Title, Text } = Typography;

// ════════════════════════════════════════════════════════════════════════════════
// Rest of your DeviceDetail.jsx code continues below...
// ════════════════════════════════════════════════════════════════════════════════


const PAGE_SIZE = 10;


const BACKEND_FIELDS = [
    { key: "CompanyName", label: "Company Name", col: 1, color: "red", hint: "Must exist in DB — e.g. DELL, CISCO, Lenovo" },
    { key: "CategoryName", label: "Device Category Name", col: 2, color: "volcano", hint: "Auto-created if missing — e.g. IT Equipment" },
    { key: "DeviceTypeName", label: "Device Type Name", col: 3, color: "orange", hint: "Auto-created if missing — e.g. Laptop, Switch" },
    { key: "ModelName", label: "Model Specification Name", col: 4, color: "gold", hint: "Auto-created if missing — e.g. Latitude 5420" },
    { key: "ModelNumber", label: "Model Number", col: 5, color: "lime", hint: "e.g. LAT5420, TPE14" },
    { key: "DeviceShortName", label: "Device Short Name", col: 6, color: "green", hint: "e.g. Dell-LT01, CAM01" },
    { key: "DeviceLongName", label: "Device Long Name", col: 7, color: "cyan", hint: "Full descriptive name" },
    { key: "IMEI", label: "IMEI", col: 8, color: "purple", hint: "15-digit — kept as text" },
    { key: "MACAddress", label: "MAC Address", col: 9, color: "geekblue", hint: "e.g. AA:BB:CC:DD:EE:FF" },
    { key: "TagNumber", label: "Tag Number", col: 10, color: "blue", hint: "Asset tag / sticker number" },
    { key: "SerialNumber", label: "Serial Number", col: 11, color: "default", hint: "Manufacturer serial number" },
    { key: "PurchaseDate", label: "Purchase Date", col: 12, color: "magenta", hint: "Formatted as YYYY-MM-DD" },
    { key: "WarrantyExpiry", label: "Warranty Expiry", col: 13, color: "magenta", hint: "Formatted as YYYY-MM-DD" },
    { key: "PurchaseCost", label: "Purchase Cost (₹)", col: 14, color: "green", hint: "Numeric only — e.g. 65000" },
    { key: "IPAddress", label: "IP Address", col: 15, color: "lime", hint: "e.g. 192.168.1.100" },
    { key: "SIMNumber", label: "SIM Number", col: 16, color: "cyan", hint: "SIM card ICCID" },
    { key: "Remarks", label: "Remarks", col: 17, color: "default", hint: "Any additional notes" },
];

// ════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════

function parsePaged(raw) {
    console.log("[parsePaged] raw keys:", raw && typeof raw === "object" ? Object.keys(raw) : raw);
    console.log("[parsePaged] raw.data keys:", raw?.data && typeof raw.data === "object" ? Object.keys(raw.data) : raw?.data);

    const try_ = (obj) => {
        if (!obj || typeof obj !== "object") return null;

        if ("totalRecords" in obj && Array.isArray(obj.data))
            return { rows: obj.data, total: Number(obj.totalRecords) || 0 };
        if ("totalCount" in obj && Array.isArray(obj.data))
            return { rows: obj.data, total: Number(obj.totalCount) || 0 };
        if (Array.isArray(obj.items))
            return { rows: obj.items, total: Number(obj.totalCount ?? obj.totalRecords ?? obj.total ?? obj.items.length) };
        if (Array.isArray(obj.rows))
            return { rows: obj.rows, total: Number(obj.total ?? obj.rows.length) };
        if (Array.isArray(obj.pageData))
            return { rows: obj.pageData, total: Number(obj.totalRecords ?? obj.totalCount ?? obj.total ?? obj.pageData.length) };
        if (Array.isArray(obj.result))
            return { rows: obj.result, total: Number(obj.totalCount ?? obj.totalRecords ?? obj.total ?? obj.result.length) };
        if (obj.value && typeof obj.value === "object")
            return try_(obj.value);
        if (Array.isArray(obj))
            return { rows: obj, total: obj.length };

        return null;
    };

    const result = try_(raw) || try_(raw?.data) || { rows: [], total: 0 };
    console.log("[parsePaged] result → rows:", result.rows.length, "total:", result.total);
    return result;
}

function toArr(r) {
    if (Array.isArray(r)) return r;
    if (Array.isArray(r?.data)) return r.data;
    if (Array.isArray(r?.rows)) return r.rows;
    if (Array.isArray(r?.items)) return r.items;
    return [];
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT HELPER
// ════════════════════════════════════════════════════════════════════════════════
async function exportAllToExcel({ filters, total, setExporting }) {
    if (!total) { message.warning("No data to export"); return; }
    setExporting(true);
    try {
        const totalPages = Math.ceil(total / 100);
        const pages = Array.from({ length: Math.min(totalPages, 100) }, (_, i) => i + 1);
        const results = await Promise.all(
            pages.map(pg =>
                axiosdevice.get("/DeviceDetail/get-all-devicedetail", {
                    params: { ...filters, Page: pg, PageSize: 100 },
                })
            )
        );
        const allRows = results.flatMap(res => parsePaged(res).rows);
        if (!allRows.length) { message.warning("No records found"); return; }

        const exportData = allRows.map((r, i) => ({
            "S.No": i + 1,
            "Short Name": r.shortName || "",
            "Long Name": r.longName || "",
            "Company": r.companyName || "",
            "IMEI": r.imei || "",
            "MAC Address": r.macAddress || "",
            "Tag Number": r.tagNumber || "",
            "Serial Number": r.serialNumber || "",
            "RFID Tag": r.rfidTagNumber || "",
            "IP Address": r.ipAddress || "",
            "SIM Number": r.simNumber || "",
            "Purchase Date": r.purchaseDate ? dayjs(r.purchaseDate).format("DD-MMM-YYYY") : "",
            "Warranty Expiry": r.warrantyExpiry ? dayjs(r.warrantyExpiry).format("DD-MMM-YYYY") : "",
            "Purchase Cost": r.purchaseCost || "",
            "Lifecycle Stage": r.lifecycleStage || r.stage || r.currentStage || "",
            "Remarks": r.remarks || "",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        ws["!cols"] = [
            { wch: 6 }, { wch: 18 }, { wch: 28 }, { wch: 18 },
            { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
            { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 14 },
            { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 28 },
        ];
        ["IMEI", "Serial Number", "RFID Tag"].forEach(colName => {
            const header = exportData.length > 0 ? Object.keys(exportData[0]) : [];
            const colIdx = header.indexOf(colName);
            if (colIdx < 0) return;
            for (let r2 = 1; r2 <= exportData.length; r2++) {
                const addr = XLSX.utils.encode_cell({ r: r2, c: colIdx });
                if (ws[addr]) { ws[addr].t = "s"; ws[addr].v = String(ws[addr].v ?? ""); delete ws[addr].z; }
            }
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Device Details");
        XLSX.writeFile(wb, `DeviceDetails_${dayjs().format("YYYY-MM-DD_HHmm")}.xlsx`);
        message.success(`${allRows.length} records exported`);
    } catch (err) {
        console.error(err);
        message.error("Export failed");
    } finally {
        setExporting(false);
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// PaginationBar
// ════════════════════════════════════════════════════════════════════════════════
function PaginationBar({ page, pageSize, total, onChange }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 16px", borderTop: "1px solid #F3F4F6",
            background: "#FAFAFA", flexShrink: 0,
        }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
                Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} records
            </Text>
            <Pagination
                current={page} pageSize={pageSize} total={total}
                size="small" showTotal={() => null}
                onChange={onChange} showSizeChanger={false}
            />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// StatCard
// ════════════════════════════════════════════════════════════════════════════════
function StatCard({ label, value, color, icon }) {
    return (
        <Card size="small" style={{ borderTop: `3px solid ${color}` }}>
            <Space>
                <span style={{ fontSize: 22, color }}>{icon}</span>
                <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
                    <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
                </div>
            </Space>
        </Card>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// ViewModal
// ════════════════════════════════════════════════════════════════════════════════


export function ViewModal({ record, onClose, deviceMasters }) {
    const [images, setImages] = useState([]);
    const [docs, setDocs] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [deviceEntityTypeId, setDeviceEntityTypeId] = useState(null);

    // ── Get Device entity type ID ──────────────────────────────────────────────
    useEffect(() => {
        if (!record) return;

        getEntityTypeId("DeviceDetail")
            .then((id) => {
                console.log("✅ Device EntityTypeId:", id);
                setDeviceEntityTypeId(id);
            })
            .catch((err) => {
                console.error("❌ Failed to get Device EntityTypeId:", err);
            });
    }, [record]);

    // ── Fetch files when modal opens ───────────────────────────────────────────
    useEffect(() => {
        if (!record?.id || !deviceEntityTypeId) return;

        setLoadingFiles(true);
        Promise.all([
            fetchEntityFiles(deviceEntityTypeId, record.id, "Image"),
            fetchEntityFiles(deviceEntityTypeId, record.id, "Document"),
        ])
            .then(([imgs, docs]) => {
                setImages(imgs || []);
                setDocs(docs || []);
            })
            .catch((err) => {
                console.error("Failed to fetch files:", err);
                setImages([]);
                setDocs([]);
            })
            .finally(() => setLoadingFiles(false));
    }, [record?.id, deviceEntityTypeId]);

    if (!record) return null;

    const master = deviceMasters.find(m => m.id === record.deviceMasterId);
    const masterName = master?.deviceShortName || master?.deviceName || master?.shortName || master?.name || "—";

    const warrantyExpiry = record.warrantyExpiry;
    const warrantyDiff = warrantyExpiry ? dayjs(warrantyExpiry).diff(dayjs(), "day") : null;
    const warrantyExpired = warrantyDiff !== null && warrantyDiff < 0;

    const field = (label, value, mono = false) => ({
        label,
        children: value
            ? <span style={{ fontFamily: mono ? "monospace" : undefined }}>{value}</span>
            : <span style={{ color: "#D1D5DB" }}>—</span>,
    });

    return (
        <Modal
            title={
                <Space>
                    <LaptopOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 700 }}>{record.shortName || record.longName || `Device #${record.id}`}</span>
                    {warrantyExpired && <Tag color="red">Warranty Expired</Tag>}
                </Space>
            }
            open={!!record}
            onCancel={onClose}
            footer={[<Button key="close" onClick={onClose}>Close</Button>]}
            width={800}
            style={{ top: 20 }}
            bodyStyle={{ maxHeight: "85vh", overflowY: "auto" }}
        >
            {/* ── Basic Details ── */}
            <Descriptions
                bordered
                size="small"
                column={2}
                items={[
                    field("ID", `#${record.id}`, true),
                    field("Company Name", record.companyName || "—"),
                    field("Device Master", masterName),
                    field("Short Name", record.shortName),
                    field("Long Name", record.longName),
                    field("IMEI", record.imei, true),
                    field("MAC Address", record.macAddress, true),
                    field("Tag Number", record.tagNumber),
                    field("Serial Number", record.serialNumber, true),
                    field("RFID Tag", record.rfidTagNumber, true),
                    field("IP Address", record.ipAddress, true),
                    field("SIM Number", record.simNumber),
                    {
                        label: "Purchase Date",
                        children: record.purchaseDate
                            ? dayjs(record.purchaseDate).format("DD MMM YYYY")
                            : <span style={{ color: "#D1D5DB" }}>—</span>,
                    },
                    {
                        label: "Warranty Expiry",
                        children: warrantyExpiry ? (
                            <span style={{
                                color: warrantyExpired ? "#991B1B" : warrantyDiff < 30 ? "#92400E" : "#065F46",
                                fontWeight: 600
                            }}>
                                {dayjs(warrantyExpiry).format("DD MMM YYYY")}
                                {warrantyExpired ? " (Expired)" : ` (${warrantyDiff}d left)`}
                            </span>
                        ) : <span style={{ color: "#D1D5DB" }}>—</span>,
                    },
                    {
                        label: "Purchase Cost",
                        children: record.purchaseCost
                            ? <strong style={{ color: "#065F46" }}>₹{Number(record.purchaseCost).toLocaleString()}</strong>
                            : <span style={{ color: "#D1D5DB" }}>—</span>,
                    },
                    {
                        label: "Lifecycle Stage",
                        children: (record.lifecycleStage || record.stage || record.currentStage) || <span style={{ color: "#D1D5DB" }}>—</span>,
                    },
                    {
                        label: "Remarks",
                        span: 2,
                        children: record.remarks || <span style={{ color: "#D1D5DB" }}>—</span>,
                    },
                ]}
            />

            {/* ── Images Section ── */}
            {/* ── Images Section ── */}
            <div style={{ marginTop: 20 }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                    <PictureOutlined style={{ color: "#fa8c16" }} />
                    Images ({images.length})
                </h4>
                {loadingFiles ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                        <Spin size="small" />
                    </div>
                ) : images.length === 0 ? (
                    <Empty description="No images" style={{ margin: "20px 0" }} />
                ) : (
                    <Row gutter={[12, 12]}>
                        {images.map((img) => {
                            const imgUrl = resolveDeviceFileUrl(img); // 🔧 FIX: raw path ki jagah normalized URL
                            return (
                                <Col key={img.id} xs={24} sm={12} md={8} lg={6}>
                                    <div style={{
                                        border: "1px solid #d9d9d9",
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        background: "#fafafa",
                                    }}>
                                        {imgUrl ? (
                                            <Image
                                                src={imgUrl}
                                                alt={img.fileName}
                                                style={{
                                                    width: "100%",
                                                    height: 120,
                                                    objectFit: "cover",
                                                }}
                                                preview={{ mask: "View" }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: "100%",
                                                height: 120,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#f0f0f0",
                                            }}>
                                                <PictureOutlined style={{ fontSize: 32, color: "#bfbfbf" }} />
                                            </div>
                                        )}
                                        <div style={{ padding: 8, fontSize: 11 }}>
                                            <p style={{ margin: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {img.fileName || "Image"}
                                            </p>
                                            {img.fileUse && <p style={{ margin: "2px 0 0", color: "#666" }}>{img.fileUse}</p>}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>

            {/* ── Documents Section ── */}
            <div style={{ marginTop: 20 }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                    Documents ({docs.length})
                </h4>
                {loadingFiles ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                        <Spin size="small" />
                    </div>
                ) : docs.length === 0 ? (
                    <Empty description="No documents" style={{ margin: "20px 0" }} />
                ) : (
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 11,
                    }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
                                <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Document Name</th>
                                <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Number</th>
                                <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Valid Till</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((doc) => {
                                const docUrl = resolveDeviceFileUrl(doc); // 🔧 FIX: raw path ki jagah normalized URL
                                return (
                                    <tr key={doc.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                        <td style={{ padding: 8 }}>
                                            <Space size="small">
                                                <FileOutlined style={{ color: "#1890ff" }} />
                                                {docUrl ? (
                                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>
                                                        {doc.documentName || doc.fileName || "Document"}
                                                    </a>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "#D1D5DB" }}>
                                                        {doc.documentName || doc.fileName || "Document"}
                                                    </span>
                                                )}
                                            </Space>
                                        </td>
                                        <td style={{ padding: 8 }}>{doc.documentNumber || "—"}</td>
                                        <td style={{ padding: 8 }}>
                                            {doc.documentValidTill
                                                ? dayjs(doc.documentValidTill).format("DD MMM YYYY")
                                                : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </Modal>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// FilterBar
// ════════════════════════════════════════════════════════════════════════════════
function FilterBar({
    searchText, masterFilter, categoryFilter, typeFilter, companyFilter,
    onSearchChange, onMasterChange, onCategoryChange, onTypeChange, onCompanyChange, onClear,
    deviceMasters, deviceCategories, deviceTypes, companies,
    loading, totalCount,
}) {
    const hasFilter = searchText || masterFilter !== "all" || categoryFilter !== "all" || typeFilter !== "all" || companyFilter !== "all";
    const selStyle = { width: 180 };

    return (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }} bodyStyle={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <Input
                    prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                    placeholder="Search name, IMEI, serial, MAC, IP…"
                    value={searchText}
                    onChange={e => onSearchChange(e.target.value)}
                    allowClear
                    style={{ width: 260 }}
                    size="middle"
                />
                <Select
                    style={selStyle} size="middle" value={companyFilter}
                    onChange={onCompanyChange} showSearch optionFilterProp="label"
                    placeholder="All Companies"
                    options={[
                        { value: "all", label: "All Companies" },
                        ...companies.map(c => ({ value: String(c.id), label: c.companyName })),
                    ]}
                />
                <Select
                    style={selStyle} size="middle" value={categoryFilter}
                    onChange={onCategoryChange} showSearch optionFilterProp="label"
                    placeholder="All Categories"
                    options={[
                        { value: "all", label: "All Categories" },
                        ...deviceCategories.map(c => ({
                            value: String(c.id),
                            label: c.name || c.categoryName || c.Name || "",
                        })),
                    ]}
                />
                <Select
                    style={selStyle} size="middle" value={typeFilter}
                    onChange={onTypeChange} showSearch optionFilterProp="label"
                    placeholder="All Types"
                    options={[
                        { value: "all", label: "All Types" },
                        ...deviceTypes.map(t => ({
                            value: String(t.id),
                            label: t.name || t.typeName || t.Name || "",
                        })),
                    ]}
                />
                <Select
                    style={{ width: 200 }} size="middle" value={masterFilter}
                    onChange={onMasterChange} showSearch optionFilterProp="label"
                    placeholder="All Masters"
                    options={[
                        { value: "all", label: "All Device Masters" },
                        ...deviceMasters.map(m => ({
                            value: String(m.id),
                            label: m.deviceShortName || m.shortName || m.name || m.deviceName || String(m.id),
                        })),
                    ]}
                />
                {hasFilter && (
                    <Button size="middle" onClick={onClear}>Clear Filters</Button>
                )}
                <div style={{ flex: 1 }} />
                <Tag color="blue" style={{ fontSize: 12, padding: "3px 10px" }}>
                    {totalCount} records
                </Tag>
            </div>
        </Card>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════════
export default function DeviceDetail() {

    // ── data ─────────────────────────────────────────────────────────────
    const [records, setRecords] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [deviceMasters, setDeviceMasters] = useState([]);
    const [deviceCategories, setDeviceCategories] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [companies, setCompanies] = useState([]);

    // ── loading ──────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // ── modals ───────────────────────────────────────────────────────────
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrDeviceId, setQrDeviceId] = useState(null);
    const [showLifecycleModal, setShowLifecycleModal] = useState(false);
    const [lifecycleRecord, setLifecycleRecord] = useState(null);
    const [viewRecord, setViewRecord] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    // ── device association ───────────────────────────────────────────────── ← NEW
    const [showAssociationModal, setShowAssociationModal] = useState(false);
    const [selectedDeviceForAssociation, setSelectedDeviceForAssociation] = useState(null);
    const [associationRefresh, setAssociationRefresh] = useState(0);
    ///////


    const [showExportModal, setShowExportModal] = useState(false)

    // ── FILE UPLOAD MODAL (NEW) ─────────────────────────────────────────────
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [selectedDeviceForFiles, setSelectedDeviceForFiles] = useState(null);

    // ── LOCATION ASSIGNMENT MODAL (NEW) ─────────────────────────────────────
    const [showLocationsModal, setShowLocationsModal] = useState(false);
    const [selectedDeviceForLocs, setSelectedDeviceForLocs] = useState(null);
    const [assignedLocations, setAssignedLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [savingLocIdx, setSavingLocIdx] = useState(null);
    const [deletingLocId, setDeletingLocId] = useState(null);

    // ── DROPDOWN DATA FOR LOCATIONS (NEW) ───────────────────────────────────
    const [countries, setCountries] = useState([]);
    const [timezones, setTimezones] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [issuers, setIssuers] = useState([]);

    // ── pagination ───────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const currentPageRef = useRef(1);

    // ── filters ──────────────────────────────────────────────────────────
    const [searchText, setSearchText] = useState("");
    const [masterFilter, setMasterFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [companyFilter, setCompanyFilter] = useState("all");

    const searchRef = useRef("");
    const masterRef = useRef("all");
    const categoryRef = useRef("all");
    const typeRef = useRef("all");
    const companyRef = useRef("all");

    const searchTimer = useRef(null);

    // ── dropdowns ────────────────────────────────────────────────────────

    // ────────────────────────────────────────────────────────────────────────────────

    const fetchDropdowns = useCallback(async () => {
        try {
            const [
                mastersRes, categoriesRes, typesRes, companiesRes,
                countriesRes,  // ← NEW
                timezonesRes,  // ← NEW
                docTypesRes,   // ← NEW
                issuersRes     // ← NEW
            ] = await Promise.all([
                axiosdevice.get("/DeviceMaster/get-all-device").catch(() => []),
                axiosdevice.get("/DeviceCategory/get-all-category").catch(() => []),
                axiosdevice.get("/DeviceType/get-all-devicetype").catch(() => []),
                axiosInstance.get("/Company/get-all-company").catch(() => []),
                // ── NEW: Location dropdowns ──
                axiosInstance.get("/Country/get-country").catch(() => []),
                axiosInstance.get("/TimeZone/get-all-timezone").catch(() => []),
                axiosdevice.get("/DocumentMaster/document-types").catch(() => []),
                axiosdevice.get("/DocumentMaster/issued-by").catch(() => []),
            ]);

            setDeviceMasters(toArr(mastersRes));
            setDeviceCategories(toArr(categoriesRes));
            setDeviceTypes(toArr(typesRes));

            // ── NEW: Set location dropdowns ──
            setCountries(toArr(countriesRes));
            setTimezones(toArr(timezonesRes));
            setDocTypes(toArr(docTypesRes));
            setIssuers(toArr(issuersRes));

            const rawCompanies = toArr(companiesRes);
            setCompanies(
                rawCompanies
                    .map(c => ({
                        id: c?.company?.id ?? c?.id,
                        companyName: c?.company?.companyName ?? c?.companyName ?? c?.name ?? "",
                    }))
                    .filter(c => c.id && c.companyName)
            );
        } catch {
            message.error("Failed to load dropdown data");
        }
    }, []);

    // ── core fetch ───────────────────────────────────────────────────────
    const fetchRecords = useCallback(async (targetPage) => {
        const pg = targetPage ?? currentPageRef.current;
        setLoading(true);
        try {
            const params = { Page: pg, PageSize: PAGE_SIZE };
            const search = searchRef.current?.trim();
            const master = masterRef.current;
            const category = categoryRef.current;
            const type = typeRef.current;
            const company = companyRef.current;
            if (search) params.Search = search;
            if (master && master !== "all") params.DeviceMasterId = master;
            if (category && category !== "all") params.DeviceCategoryId = category;
            if (type && type !== "all") params.DeviceTypeId = type;
            if (company && company !== "all") params.CompanyId = company;

            const raw = await axiosdevice.get("/DeviceDetail/get-all-devicedetail", { params });

            console.log("[fetchRecords] API response keys:", raw && typeof raw === "object" ? Object.keys(raw) : typeof raw);
            console.log("[fetchRecords] Full response:", raw);

            const { rows, total } = parsePaged(raw);
            console.log("[fetchRecords] Parsed data → rows count:", rows?.length || 0, "total records:", total);

            setRecords(rows || []);
            setTotalRecords(total || 0);

        } catch (err) {
            console.error("[fetchRecords] Error:", err);
            console.error("[fetchRecords] Error details:", {
                message: err?.message,
                status: err?.response?.status,
                data: err?.response?.data,
            });
            message.error("Failed to load device details");
            setRecords([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── mount ────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchDropdowns();
        fetchRecords(1);
    }, []); // eslint-disable-line



    // ════════════════════════════════════════════════════════════════════════
    // FILE UPLOAD HANDLERS (NEW)
    // ════════════════════════════════════════════════════════════════════════

    const handleOpenFilesModal = useCallback((record) => {
        setSelectedDeviceForFiles(record);
        setShowFilesModal(true);
    }, []);


    // ════════════════════════════════════════════════════════════════════════
    // LOCATION ASSIGNMENT HANDLERS
    // ════════════════════════════════════════════════════════════════════════

    // ── CHANGED: sahi endpoint use kiya — GET /DeviceLocation/{deviceDetailId}/get-by-device ──
    const handleOpenLocationsModal = useCallback(async (record) => {
        setSelectedDeviceForLocs(record);
        setLocationLoading(true);
        try {
            const res = await axiosdevice.get(`/DeviceLocation/${record.id}/get-by-device`);
            const locs = toArr(res);
            setAssignedLocations(
                locs.length
                    ? locs.map((l) => ({ ...emptyDeviceLocation(), ...l }))
                    : [emptyDeviceLocation()]
            );
        } catch (err) {
            console.warn("Could not fetch device locations, starting fresh:", err);
            setAssignedLocations([emptyDeviceLocation()]);
        } finally {
            setLocationLoading(false);
        }
        setShowLocationsModal(true);
    }, []);

    const handleUpdateLocation = useCallback((index, field, value) => {
        setAssignedLocations(prev => {
            const updated = [...prev];
            if (!updated[index]) return prev;
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }, []);

    // ── CHANGED: axiosdevice use kiya, naye endpoints (add-device-location / update-device-location),
    //             aur save ke baad images/docs FileStore upload bhi add kiya ──
    const handleSaveLocation = useCallback(async (index) => {
        const loc = assignedLocations[index];
        if (!loc || !selectedDeviceForLocs) return;

        setSavingLocIdx(index);
        try {
            // 🔧 Payload ko FormData mein convert kar rahe hain
            // taaki Content-Type: multipart/form-data ke saath bhej sakein
            const formData = new FormData();
            formData.append("deviceDetailId", selectedDeviceForLocs.id ?? "");
            formData.append("locationType", loc.locationType ?? "");
            formData.append("addressLine1", loc.addressLine1 ?? "");
            formData.append("addressLine2", loc.addressLine2 ?? "");
            formData.append("countryId", loc.countryId ?? "");
            formData.append("stateId", loc.stateId ?? "");
            formData.append("cityId", loc.cityId ?? "");
            formData.append("pinCode", loc.pinCode ?? "");
            formData.append("landmark", loc.landmark ?? "");
            formData.append(
                "latitude",
                loc.latitude !== "" && loc.latitude != null ? Number(loc.latitude) : ""
            );
            formData.append(
                "longitude",
                loc.longitude !== "" && loc.longitude != null ? Number(loc.longitude) : ""
            );
            formData.append("timeZoneId", loc.timeZoneId ?? "");
            formData.append("locationContactNumber", loc.locationContactNumber ?? "");

            // 🔧 IMPORTANT: Content-Type explicitly "multipart/form-data" set mat karo
            // yahan manually — browser khud boundary ke saath sahi header lagayega.
            // Agar hum yahan hardcode karenge "multipart/form-data" (bina boundary ke),
            // toh backend request parse hi nahi kar payega.
            const axiosConfig = {
                headers: { "Content-Type": "multipart/form-data" },
            };

            let locationId = loc.id;

            if (loc.id) {
                // ── UPDATE (POST, as per given API — not PUT) ──
                await axiosdevice.post(
                    `/DeviceLocation/${loc.id}/update-device-location`,
                    formData,
                    axiosConfig
                );
                message.success("Location updated successfully");
            } else {
                // ── CREATE ──
                const res = await axiosdevice.post(
                    `/DeviceLocation/add-device-location`,
                    formData,
                    axiosConfig
                );
                const saved = res?.data !== undefined ? res.data : res;
                locationId = saved?.id ?? saved?.locationId ?? saved?.data?.id ?? null;

                if (locationId) {
                    setAssignedLocations(prev => {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], id: locationId };
                        return updated;
                    });
                }
                message.success("Location created successfully");
            }

            // ── Images/Docs upload via FileStore — same pattern as Company Locations ──
            if (locationId) {
                const freshLoc = assignedLocations[index] || loc;
                const result = await uploadEntityFiles({
                    entityName: "DeviceLocation", // ⚠️ verify exact name in /EntityType/get-all-entity
                    entityId: locationId,
                    images: freshLoc.images || [],
                    docs: freshLoc.documents || [],
                    onSuccess: (imgs, docs) => {
                        if (imgs + docs > 0)
                            message.success(`${imgs} image(s) and ${docs} doc(s) uploaded for location.`);
                    },
                    onFileError: (fileName) =>
                        message.error(`"${fileName}" upload failed.`),
                });
                console.log("📊 DeviceLocation file upload result:", result);
            } else {
                message.warning("Location saved but ID not received — files not uploaded.");
            }

        } catch (err) {
            console.error("Failed to save device location:", err);
            message.error(
                err?.response?.data?.message ||
                err?.normalizedMessage ||
                "Failed to save location. Please try again."
            );
        } finally {
            setSavingLocIdx(null);
        }
    }, [selectedDeviceForLocs, assignedLocations]);

    // ── CHANGED: koi delete endpoint diye gaye 5 endpoints mein nahi hai,
    //             isliye filhaal sirf local list se remove karta hai ──
    const handleDeleteLocation = useCallback(async (index) => {
        const loc = assignedLocations[index];
        if (!loc) return;

        if (!loc.id) {
            setAssignedLocations(prev => prev.filter((_, i) => i !== index));
            return;
        }

        // ⚠️ Backend delete endpoint abhi provided nahi hai DeviceLocation ke liye.
        // Jab mile (e.g. POST /DeviceLocation/{id}/remove-device-location), yahan call add karo.
        message.warning("Delete endpoint not configured for device locations yet. Removed from view only.");
        setAssignedLocations(prev => prev.filter((_, i) => i !== index));
    }, [assignedLocations]);

    // ── reset + fetch ────────────────────────────────────────────────────
    const resetAndFetch = useCallback(() => {
        currentPageRef.current = 1;
        setCurrentPage(prev => {
            if (prev === 1) fetchRecords(1);
            return 1;
        });
    }, [fetchRecords]);

    const handlePageChange = useCallback((newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchRecords(newPage);
    }, [fetchRecords]);

    const handleSearchChange = useCallback((val) => {
        setSearchText(val);
        searchRef.current = val;
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            currentPageRef.current = 1;
            setCurrentPage(1);
            fetchRecords(1);
        }, 400);
    }, [fetchRecords]);

    const handleMasterChange = useCallback((v) => { masterRef.current = v; setMasterFilter(v); resetAndFetch(); }, [resetAndFetch]);
    const handleCategoryChange = useCallback((v) => { categoryRef.current = v; setCategoryFilter(v); resetAndFetch(); }, [resetAndFetch]);
    const handleTypeChange = useCallback((v) => { typeRef.current = v; setTypeFilter(v); resetAndFetch(); }, [resetAndFetch]);
    const handleCompanyChange = useCallback((v) => { companyRef.current = v; setCompanyFilter(v); resetAndFetch(); }, [resetAndFetch]);

    const handleClearFilters = useCallback(() => {
        searchRef.current = ""; masterRef.current = "all";
        categoryRef.current = "all"; typeRef.current = "all"; companyRef.current = "all";
        setSearchText(""); setMasterFilter("all");
        setCategoryFilter("all"); setTypeFilter("all"); setCompanyFilter("all");
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRecords(1);
    }, [fetchRecords]);

    const handleRefresh = useCallback(() => {
        handleClearFilters();
        fetchDropdowns();
    }, [handleClearFilters, fetchDropdowns]);

    const handleExport = useCallback(() => {
        const filters = {};
        const search = searchRef.current?.trim();
        const master = masterRef.current;
        const category = categoryRef.current;
        const type = typeRef.current;
        const company = companyRef.current;
        if (search) filters.Search = search;
        if (master && master !== "all") filters.DeviceMasterId = master;
        if (category && category !== "all") filters.DeviceCategoryId = category;
        if (type && type !== "all") filters.DeviceTypeId = type;
        if (company && company !== "all") filters.CompanyId = company;
        exportAllToExcel({ filters, total: totalRecords, setExporting });
    }, [totalRecords]);

    // ── stats ────────────────────────────────────────────────────────────
    const expiredCount = records.filter(r =>
        r.warrantyExpiry && dayjs(r.warrantyExpiry).isBefore(dayjs())
    ).length;
    const expiringCount = records.filter(r => {
        if (!r.warrantyExpiry) return false;
        const diff = dayjs(r.warrantyExpiry).diff(dayjs(), "day");
        return diff >= 0 && diff < 30;
    }).length;

    // ── CRUD ─────────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditingRecord(null);
        setSelectedDeviceForAssociation(null); // ← NEW
        setFormData({ ...EMPTY_FORM });
        setShowModal(true);
    };

    const openEdit = (record) => {
        setEditingRecord(record);
        setSelectedDeviceForAssociation(record.id); // ← NEW: Store device ID for association
        setFormData({
            deviceMasterId: record.deviceMasterId || null,
            imei: record.imei || "",
            macAddress: record.macAddress || "",
            tagNumber: record.tagNumber || "",
            shortName: record.shortName || "",
            longName: record.longName || "",
            serialNumber: record.serialNumber || "",
            purchaseDate: record.purchaseDate || null,
            warrantyExpiry: record.warrantyExpiry || null,
            purchaseCost: record.purchaseCost || "",
            remarks: record.remarks || "",
            ipAddress: record.ipAddress || "",
            simNumber: record.simNumber || "",
            rfidTagNumber: record.rfidTagNumber || "",
        });
        setShowModal(true);
    };

    // ── NEW: Association handlers ────────────────────────────────────────
    const handleOpenAssociationModal = () => {
        if (!editingRecord?.id) {
            message.warning("Please edit a device first");
            return;
        }
        setShowAssociationModal(true);
    };

    const handleAssociationSuccess = () => {
        setAssociationRefresh(prev => prev + 1);
    };

    // ════════════════════════════════════════════════════════════════════
    // callSetupTracking — POST setup-tracking to persist serial/rfid,
    //   then open QR modal (QRModal fetches generate-qr internally)
    // Only called after create or edit — NOT from the grid QR button
    // ════════════════════════════════════════════════════════════════════
    const callSetupTracking = useCallback(async ({ deviceId, serialNumber, rfidTagNumber }) => {
        try {
            await axiosdevice.post(
                `/DeviceDetail/setup-tracking/${deviceId}`,
                { serialNumber: serialNumber || "", rfidTagNumber: rfidTagNumber || "" }
            );
        } catch (err) {
            console.warn("setup-tracking warning:", err?.response?.data?.message || err?.message);
        }
        setQrDeviceId(deviceId);
        setShowQRModal(true);
    }, []);

    // ════════════════════════════════════════════════════════════════════
    // handleShowQRForRecord — grid QR button
    // ════════════════════════════════════════════════════════════════════
    const handleShowQRForRecord = useCallback((record) => {
        setQrDeviceId(record.id);
        setShowQRModal(true);
    }, []);

    // ════════════════════════════════════════════════════════════════════
    // handleOpenLifecycle
    // ════════════════════════════════════════════════════════════════════
    const handleOpenLifecycle = useCallback((record) => {
        setLifecycleRecord(record);
        setShowLifecycleModal(true);
    }, []);

    const handleOpenAssociateFromGrid = useCallback((record) => {
        // setEditingRecord(record);
        setSelectedDeviceForAssociation(record.id);
        setShowAssociationModal(true);
    }, []);

    // ════════════════════════════════════════════════════════════════════
    // handleSubmit — ADD and EDIT
    // ════════════════════════════════════════════════════════════════════
    const handleSubmit = async () => {
        if (!formData.deviceMasterId) {
            message.error("Device Master is required");
            return;
        }
        setSubmitLoading(true);
        try {
            const payload = buildPayload(formData);

            if (editingRecord) {
                // ── EDIT path ──
                await updateDeviceDetail(editingRecord.id, payload);
                message.success("Device detail updated successfully");
                setShowModal(false);
                fetchRecords(currentPageRef.current);
                // Run setup-tracking then show QR
                await callSetupTracking({
                    deviceId: editingRecord.id,
                    serialNumber: formData.serialNumber?.trim() || "",
                    rfidTagNumber: formData.rfidTagNumber?.trim() || "",
                });

            } else {
                // ── CREATE path ──
                const createRes = await createDeviceDetail(payload);
                const createBody = createRes?.data ?? createRes;

                const newId = createBody?.id;
                const serialNum = createBody?.serialNumber || formData.serialNumber?.trim() || "";
                const rfidTagNum = createBody?.rfidTagNumber || formData.rfidTagNumber?.trim() || "";

                if (!newId) {
                    message.success("Device detail created successfully");
                    setShowModal(false);
                    fetchRecords(currentPageRef.current);
                    return;
                }

                message.success("Device detail created successfully");
                setShowModal(false);
                fetchRecords(currentPageRef.current);

                // Step 3 — setup-tracking → QR modal
                await callSetupTracking({
                    deviceId: newId,
                    serialNumber: serialNum,
                    rfidTagNumber: rfidTagNum,
                });
            }

        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || err?.message || "Operation failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteDeviceDetail(deleteTarget.id);
            message.success("Device detail deleted");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            const newPage =
                records.length === 1 && currentPageRef.current > 1
                    ? currentPageRef.current - 1
                    : currentPageRef.current;
            currentPageRef.current = newPage;
            setCurrentPage(newPage);
            fetchRecords(newPage);
        } catch {
            message.error("Failed to delete device detail");
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F3F4F6", padding: "20px 12px", boxSizing: "border-box" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                    <Title level={4} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <LaptopOutlined style={{ color: "#1890ff" }} />
                        Device Details
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Manage individual device records — IMEI, MAC, warranty, cost
                    </Text>
                </div>
                <Space wrap>
                    <DocumentTypeButton />
                    <Button icon={<ImportOutlined />} onClick={() => setShowImportModal(true)}>Import File</Button>

                    <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}
                        style={{ background: "#1890ff", borderColor: "#1890ff" }}>
                        Add Device Detail
                    </Button>

                    <Tooltip title="Export all filtered records to Excel">
                        <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                            Export
                        </Button>
                        <ExcelExport
                            open={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                            apiUrl="/DeviceDetail/export-devicedetail"
                            fileNamePrefix="DeviceDetail"
                        />
                    </Tooltip>
                    <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
                </Space>
            </div>

            {/* Stats */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                    <StatCard label="Total Devices" value={totalRecords} color="#1890ff" icon={<LaptopOutlined />} />
                </Col>
                <Col xs={12} sm={6}>
                    <StatCard label="This Page" value={records.length} color="#52c41a" icon="📋" />
                </Col>
                <Col xs={12} sm={6}>
                    <StatCard label="Warranty Expired" value={expiredCount} color="#ff4d4f" icon="⚠️" />
                </Col>
                <Col xs={12} sm={6}>
                    <StatCard label="Expiring Soon" value={expiringCount} color="#fa8c16" icon={<CalendarOutlined />} />
                </Col>
            </Row>

            {/* FilterBar */}
            <FilterBar
                searchText={searchText} onSearchChange={handleSearchChange}
                masterFilter={masterFilter} onMasterChange={handleMasterChange}
                categoryFilter={categoryFilter} onCategoryChange={handleCategoryChange}
                typeFilter={typeFilter} onTypeChange={handleTypeChange}
                companyFilter={companyFilter} onCompanyChange={handleCompanyChange}
                onClear={handleClearFilters}
                deviceMasters={deviceMasters}
                deviceCategories={deviceCategories}
                deviceTypes={deviceTypes}
                companies={companies}
                loading={loading}
                totalCount={totalRecords}
            />

            {/* Table + Pagination */}
            <div style={{ background: "white", borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                <DeviceDetailTable
                    dataSource={records}
                    loading={loading}
                    onView={setViewRecord}
                    onEdit={openEdit}
                    onDelete={(record) => { setDeleteTarget(record); setShowDeleteModal(true); }}
                    onShowQR={handleShowQRForRecord}
                    onLifecycle={handleOpenLifecycle}
                    onAssociate={handleOpenAssociateFromGrid}
                    onUploadFiles={handleOpenFilesModal}
                    onAssignLocations={handleOpenLocationsModal}
                />
                <PaginationBar
                    page={currentPage}
                    pageSize={PAGE_SIZE}
                    total={totalRecords}
                    onChange={handlePageChange}

                />
            </div>

            {/* ── Add / Edit Modal ── */}
            {/* ── Add / Edit Modal ── */}
            <DeviceDetailModal
                open={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingRecord(null);
                }}
                onSubmit={handleSubmit}
                editingRecord={editingRecord}
                submitLoading={submitLoading}
                formData={formData}
                onChange={setFormData}
                deviceMasters={deviceMasters}
            />
            {/* ── Files Modal (Images & Documents) ── NEW ── */}
            <DeviceFilesModal
                open={showFilesModal}
                onClose={() => {
                    setShowFilesModal(false);
                    setSelectedDeviceForFiles(null);
                }}
                device={selectedDeviceForFiles}
                docTypes={docTypes}
                issuers={issuers}
                onSuccess={() => {
                    // Optionally refresh records if needed
                    // fetchRecords(currentPageRef.current);
                }}
            />

            {/* ── Locations Modal ── */}
            <DeviceLocationsModal
                open={showLocationsModal}
                onCancel={() => {
                    setShowLocationsModal(false);
                    setSelectedDeviceForLocs(null);
                    setAssignedLocations([]);
                }}
                device={selectedDeviceForLocs}
                assignedLocations={assignedLocations}
                setAssignedLocations={setAssignedLocations}
                locationLoading={locationLoading}
                savingLocIdx={savingLocIdx}
                deletingLocId={deletingLocId}
                countries={countries}
                timezones={timezones}
                docTypes={docTypes}
                issuers={issuers}
                onUpdate={handleUpdateLocation}
                onSave={handleSaveLocation}
                onDelete={handleDeleteLocation}
            />

            {/* Existing modals below... */}
            {/* ── Association Panel (shown when editing) ── */}
            {editingRecord && (
                <DeviceAssociationPanel
                    parentDeviceId={selectedDeviceForAssociation}
                    parentName={editingRecord?.shortName || editingRecord?.longName}
                    onOpenAssociateModal={handleOpenAssociationModal}
                    refreshTrigger={associationRefresh}
                />
            )}

            {/* ── View Modal (UPDATED) ── */}
            <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} deviceMasters={deviceMasters} />

            {/* ── Rest of existing modals... ── */}
            <QRModal
                open={showQRModal}
                onClose={() => { setShowQRModal(false); setQrDeviceId(null); }}
                deviceId={qrDeviceId}
            />

            <DeviceLifecycleModal
                open={showLifecycleModal}
                onClose={() => { setShowLifecycleModal(false); setLifecycleRecord(null); }}
                record={lifecycleRecord}
            />

            <DeviceAssociationModal
                open={showAssociationModal}
                onClose={() => {
                    setShowAssociationModal(false);
                    setSelectedDeviceForAssociation(null);
                }}
                parentDeviceId={selectedDeviceForAssociation}
                onAssociateSuccess={handleAssociationSuccess}
            />

            {/* Delete Confirm Modal */}
            <Modal
                title="Delete Device Detail"
                open={showDeleteModal}
                onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                footer={[
                    <Button key="cancel" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>Cancel</Button>,
                    <Button key="delete" danger loading={deleteLoading} onClick={handleDelete}>Delete</Button>,
                ]}
                width={420}
            >
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <ExclamationCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
                    <p style={{ fontSize: 14 }}>
                        Delete device <strong>{deleteTarget?.shortName || deleteTarget?.imei || `#${deleteTarget?.id}`}</strong>?
                    </p>
                    <Text type="secondary">This action cannot be undone.</Text>
                </div>
            </Modal>

            {/* ── Import Modal ── */}
            {/* <ImportDeviceDetailModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={() => { fetchDropdowns(); fetchRecords(currentPageRef.current); }}
            /> */}

            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchRecords}
                entityName="DeviceDetail"
                apiEndpoint="/DeviceDetail/import-devicedetail"
                backendFields={BACKEND_FIELDS}
            />
        </div>

    );
}