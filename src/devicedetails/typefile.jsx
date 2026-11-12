import { useState, useMemo, useCallback } from "react";
import {
    Modal, Button, Steps, Upload, Spin, Alert,
    Table, Divider, Tag, Tooltip, Select,
} from "antd";
import {
    FileExcelOutlined, CheckCircleOutlined, WarningOutlined,
    CloseCircleOutlined, ReloadOutlined, ImportOutlined,
    ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined,
    EyeOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { axiosdevice } from "../../config";
import React from "react";
// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
    blue: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", dark: "#1E40AF" },
    green: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", dark: "#15803D" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", dark: "#B45309" },
    red: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", dark: "#B91C1C" },
    purple: { bg: "#FAF5FF", border: "#E9D5FF", text: "#7C3AED", dark: "#6D28D9" },
    gray: { bg: "#F9FAFB", border: "#E5E7EB", text: "#6B7280", dark: "#374151" },
    slate: { bg: "#F1F5F9", border: "#CBD5E1", text: "#475569", dark: "#1E293B" },
    emerald: { bg: "#ECFDF5", border: "#A7F3D0", text: "#059669", dark: "#047857" },
    radius: { sm: 6, md: 8, lg: 12, xl: 16 },
};

const FT = {
    key: "excel",
    label: "Excel/Csv",
    accept: ".xlsx,.xls,.csv",              // ✅ .csv add
    extensions: [".xlsx", ".xls", ".csv"],       // ✅ .csv add
    icon: "📊",
    color: T.emerald,
    description: "Bulk DeviceType import via Excel/Csv spreadsheet",
};

// ════════════════════════════════════════════════════════════════════════════
// BACKEND FIELDS — DeviceType_Import_Template.xlsx ke columns se liye
// ════════════════════════════════════════════════════════════════════════════
const BACKEND_FIELDS = [
    { key: "deviceTypeName", label: "Device Type Name", required: true, color: "red", hint: "e.g. Printer, Camera, Router" },
    { key: "deviceCategoryName", label: "Device Category Name", required: false, color: "blue", hint: "e.g. Hardware, Security, Network" },
    { key: "protocol", label: "Protocol", required: false, color: "purple", hint: "e.g. TCP/IP, SNMP, RTSP, USB" },
    { key: "supportedFeature", label: "Supported Feature", required: false, color: "cyan", hint: "e.g. Print, Scan, Recording" },
    { key: "remarks", label: "Remarks", required: false, color: "default", hint: "Any additional notes" },
];

// ════════════════════════════════════════════════════════════════════════════
// SUBMIT
// ════════════════════════════════════════════════════════════════════════════
async function submitRecords(mappedRows) {
    const ws = XLSX.utils.json_to_sheet(mappedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DeviceTypes");
    const blob = new Blob(
        [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    const formData = new FormData();
    formData.append("file", blob, "import.xlsx");

    const res = await axiosdevice.post("/DeviceType/import-deviceType", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
    });
    return res;   // ✅ res.data nahi, seedha res return karo
}

// ════════════════════════════════════════════════════════════════════════════
// PARSER
// ════════════════════════════════════════════════════════════════════════════
async function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const ext = "." + file.name.split(".").pop().toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let wb;
                if (ext === ".csv") {
                    // ✅ CSV ko text ke roop mein parse karo
                    wb = XLSX.read(e.target.result, { type: "string" });
                } else {
                    // xlsx / xls ke liye array buffer
                    wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                }

                const allCols = new Set();
                const allRows = [];
                let idx = 0;

                wb.SheetNames.forEach((sheetName) => {
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
                    rows.forEach((raw, i) => {
                        Object.keys(raw).forEach(k => allCols.add(k));
                        allRows.push({
                            _key: ++idx,
                            _rowIndex: i + 2,
                            _sheetName: sheetName,
                            _raw: raw,
                        });
                    });
                });

                if (!allRows.length) { reject(new Error("No data rows found.")); return; }
                resolve({ columns: [...allCols], rows: allRows, sheetNames: wb.SheetNames });
            } catch (err) { reject(err); }
        };

        reader.onerror = () => reject(new Error("Failed to read file."));

        // ✅ CSV ke liye readAsText, baaki ke liye readAsArrayBuffer
        if (ext === ".csv") {
            reader.readAsText(file, "UTF-8");
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════
function extractErrorMessage(err) {
    if (typeof err === "string" && err.trim()) return err;
    if (err?.response?.data?.message) return String(err.response.data.message);
    if (err?.message) return String(err.message);
    if (err?.errors) return Object.values(err.errors).flat().join(" | ");
    try { return JSON.stringify(err); } catch { /**/ }
    return "Upload failed";
}

function applyMapping(rows, mapping) {
    return rows.map(row => {
        const rec = { _key: row._key, _rowIndex: row._rowIndex, _sheetName: row._sheetName };
        BACKEND_FIELDS.forEach(({ key }) => {
            const col = mapping[key];
            rec[key] = col ? String(row._raw[col] ?? "").trim() : "";
        });
        return rec;
    });
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — Upload
// ════════════════════════════════════════════════════════════════════════════
function StepUpload({ onParsed }) {
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleFile = async (file) => {
        setError(null);
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!FT.extensions.includes(ext)) {
            setError(`Only ${FT.extensions.join(", ")} files accepted.`);
            return false;
        }
        setFileName(file.name);
        setParsing(true);
        try {
            const parsed = await parseExcel(file);
            onParsed({ ...parsed, fileName: file.name, rawFile: file });
        } catch (err) {
            setError(err?.message || "Failed to parse file.");
        } finally { setParsing(false); }
        return false;
    };

    return (
        <div style={{ padding: "8px 0" }}>
            {/* Info */}
            <div style={{
                marginBottom: 14, padding: "10px 14px",
                background: FT.color.bg, border: `1px solid ${FT.color.border}`,
                borderRadius: T.radius.md, fontSize: 12, color: FT.color.dark,
                display: "flex", alignItems: "center", gap: 10,
            }}>
                <span style={{ fontSize: 22 }}>📊</span>
                <div>
                    <div style={{ fontWeight: 700 }}>DeviceType Excel/Csv file upload here</div>
                    <div style={{ fontSize: 11, marginTop: 2, color: "#6B7280" }}>
                        All sheets  data automatically merge
                    </div>
                </div>
            </div>

            <Upload.Dragger
                beforeUpload={handleFile}
                showUploadList={false}
                accept={FT.accept}
                disabled={parsing}
                style={{ borderRadius: T.radius.lg, borderColor: FT.color.border, background: FT.color.bg }}
            >
                <div style={{ padding: "44px 20px" }}>
                    {parsing ? <Spin size="large" tip="Parsing Excel…" /> : (
                        <>
                            <div style={{ fontSize: 50, marginBottom: 12 }}>📊</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: FT.color.dark, marginBottom: 4 }}>
                                Drop Excel/Csv file here
                            </div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>
                                or <span style={{ color: FT.color.text, fontWeight: 600 }}>click to browse</span>
                                {" — "}.xlsx, .xls,.csv
                            </div>
                            {fileName && (
                                <div style={{
                                    marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6,
                                    background: "#fff", border: `1px solid ${FT.color.border}`,
                                    borderRadius: T.radius.md, padding: "5px 14px",
                                }}>
                                    <FileExcelOutlined style={{ color: FT.color.text }} />
                                    <span style={{ fontSize: 12, color: FT.color.dark, fontWeight: 500 }}>{fileName}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Upload.Dragger>

            {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12, borderRadius: T.radius.md }} />}

            {/* Template reference */}
            <div style={{
                marginTop: 14, padding: "10px 14px",
                background: T.slate.bg, border: `1px solid ${T.slate.border}`,
                borderRadius: T.radius.md,
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate.dark, marginBottom: 8 }}>
                    📋 Template columns (DeviceType_Import_Template.xlsx/.csv):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {BACKEND_FIELDS.map(f => (
                        <span key={f.key} style={{
                            padding: "2px 8px", borderRadius: 4, fontSize: 10,
                            background: f.required ? "#FEF2F2" : "#fff",
                            border: `1px solid ${f.required ? "#FECACA" : "#E5E7EB"}`,
                            color: f.required ? "#B91C1C" : "#374151",
                            fontFamily: "monospace",
                        }}>
                            {f.label}{f.required ? " *" : ""}
                        </span>
                    ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: "#9CA3AF" }}>
                    <span style={{ color: "#B91C1C", fontWeight: 700 }}>* required</span> — rest optional
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — Mapping
// ════════════════════════════════════════════════════════════════════════════
function StepMapping({ parsedData, mapping, onMappingChange }) {
    const { columns, rows } = parsedData;

    const sampleValue = (col) => {
        const val = String(rows[0]?._raw[col] ?? "").trim();
        return val.length > 28 ? val.slice(0, 28) + "…" : val;
    };

    const usedColumns = new Set(Object.values(mapping).filter(Boolean));
    const requiredMet = BACKEND_FIELDS.filter(f => f.required).every(f => mapping[f.key]);
    const mappedCount = BACKEND_FIELDS.filter(f => mapping[f.key]).length;

    return (
        <div style={{ padding: "4px 0" }}>
            <div style={{
                marginBottom: 14, padding: "10px 14px",
                background: FT.color.bg, border: `1px solid ${FT.color.border}`,
                borderRadius: T.radius.md, fontSize: 12, color: FT.color.dark,
                display: "flex", alignItems: "center", gap: 10,
            }}>
                <AppstoreOutlined style={{ fontSize: 18, color: FT.color.text }} />
                <span>
                    <strong>DeviceType Field Mapping:</strong> Select an Excel column for each backend field
                    <span style={{ color: T.red.text, fontWeight: 700 }}> * </span> required.
                </span>
            </div>

            <div style={{
                display: "flex", border: `1px solid ${T.gray.border}`,
                borderRadius: T.radius.lg, overflow: "hidden",
            }}>
                {/* LEFT — backend fields */}
                <div style={{ flex: "0 0 220px", background: "#FAFAFA", borderRight: `1px solid ${T.gray.border}` }}>
                    <div style={{
                        padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`,
                        background: T.blue.bg, display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: 4, background: T.blue.text,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, color: "#fff", fontWeight: 700,
                        }}>B</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.blue.dark }}>Backend Fields</span>
                        <span style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>
                            {mappedCount}/{BACKEND_FIELDS.length}
                        </span>
                    </div>
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{
                            padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`,
                            background: mapping[field.key] ? "#fff" : "transparent",
                            minHeight: 58,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                <Tag color={field.color} style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}>
                                    {field.label}
                                </Tag>
                                {field.required && <span style={{ color: T.red.text, fontSize: 13, fontWeight: 700 }}>*</span>}
                                {mapping[field.key] && (
                                    <CheckCircleOutlined style={{ color: T.green.text, fontSize: 12, marginLeft: "auto" }} />
                                )}
                            </div>
                            <div style={{ fontSize: 9, color: "#9CA3AF", fontFamily: "monospace" }}>{field.hint}</div>
                        </div>
                    ))}
                </div>

                {/* CENTER — arrows */}
                <div style={{
                    width: 36, background: "#F3F4F6", display: "flex",
                    flexDirection: "column", alignItems: "center", flexShrink: 0,
                }}>
                    <div style={{ height: 49, borderBottom: `1px solid ${T.gray.border}`, width: "100%" }} />
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{
                            height: 58, display: "flex", alignItems: "center", justifyContent: "center",
                            borderBottom: `1px solid ${T.gray.border}`, width: "100%",
                        }}>
                            <SwapOutlined style={{
                                color: mapping[field.key] ? T.green.text : "#D1D5DB",
                                fontSize: 12, transition: "color 0.15s",
                            }} />
                        </div>
                    ))}
                </div>

                {/* RIGHT — Excel column selectors */}
                <div style={{ flex: 1, background: "#FAFAFA", minWidth: 0 }}>
                    <div style={{
                        padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`,
                        background: FT.color.bg, display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 18 }}>📊</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: FT.color.dark }}>Excel Columns</span>
                        <span style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>{columns.length} found</span>
                    </div>
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{
                            padding: "8px 10px", borderBottom: `1px solid ${T.gray.border}`,
                            background: mapping[field.key] ? "#fff" : "transparent",
                            minHeight: 58, display: "flex", flexDirection: "column", justifyContent: "center",
                        }}>
                            <Select
                                size="small" allowClear
                                placeholder={`Column for "${field.label}"`}
                                style={{ width: "100%", fontSize: 12 }}
                                value={mapping[field.key] || undefined}
                                onChange={(val) => onMappingChange({ ...mapping, [field.key]: val || null })}
                                options={columns.map(col => ({
                                    value: col,
                                    label: (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 500 }}>{col}</span>
                                            {sampleValue(col) && (
                                                <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>
                                                    {sampleValue(col)}
                                                </span>
                                            )}
                                        </div>
                                    ),
                                    disabled: usedColumns.has(col) && mapping[field.key] !== col,
                                }))}
                                dropdownRender={(menu) => (
                                    <div>
                                        <div style={{
                                            padding: "4px 10px 6px", fontSize: 10, color: "#9CA3AF",
                                            borderBottom: "1px solid #F3F4F6",
                                            display: "flex", justifyContent: "space-between",
                                        }}>
                                            <strong>Column</strong><span>Sample</span>
                                        </div>
                                        {menu}
                                    </div>
                                )}
                            />
                            {mapping[field.key] && (
                                <div style={{ marginTop: 3, fontSize: 10, color: "#6B7280", fontFamily: "monospace", paddingLeft: 2 }}>
                                    e.g. <span style={{ color: T.blue.dark }}>{sampleValue(mapping[field.key]) || "—"}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div style={{
                marginTop: 12, padding: "9px 14px",
                background: requiredMet ? T.green.bg : T.amber.bg,
                border: `1px solid ${requiredMet ? T.green.border : T.amber.border}`,
                borderRadius: T.radius.md, fontSize: 12,
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            }}>
                {requiredMet ? (
                    <><CheckCircleOutlined style={{ color: T.green.text }} />
                        <span style={{ color: T.green.dark }}>Required fields mapped — preview ready.</span></>
                ) : (
                    <><WarningOutlined style={{ color: T.amber.text }} />
                        <span style={{ color: T.amber.dark }}>
                            Required: {BACKEND_FIELDS.filter(f => f.required && !mapping[f.key]).map(f => f.label).join(", ")}
                        </span></>
                )}
                <span style={{ marginLeft: "auto", color: "#9CA3AF", fontSize: 11 }}>
                    {rows.length} rows × {mappedCount} fields
                </span>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 3 — Preview
// ════════════════════════════════════════════════════════════════════════════
function StepPreview({ mappedRows, mapping, submitting }) {
    const mappedFields = BACKEND_FIELDS.filter(f => mapping[f.key]);
    const requiredMissing = mappedRows.filter(row =>
        BACKEND_FIELDS.filter(f => f.required).some(f => !row[f.key])
    ).length;

    const columns = [
        {
            title: "#", dataIndex: "_rowIndex", width: 55,
            render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
        },
        {
            title: "Sheet", dataIndex: "_sheetName", width: 90,
            render: v => <Tag style={{ fontSize: 10 }}>{v}</Tag>,
        },
        ...mappedFields.map(field => ({
            title: <Tag color={field.color} style={{ fontSize: 10, margin: 0 }}>{field.label}</Tag>,
            dataIndex: field.key, ellipsis: true,
            render: (v) => v
                ? <span style={{ fontSize: 12 }}>{v}</span>
                : <span style={{ color: field.required ? T.red.text : "#D1D5DB", fontSize: 11, fontStyle: "italic" }}>
                    {field.required ? "⚠ Empty" : "—"}
                </span>,
        })),
    ];

    return (
        <div>
            <div style={{
                marginBottom: 14, padding: "10px 16px",
                background: FT.color.bg, border: `1px solid ${FT.color.border}`,
                borderRadius: T.radius.md, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
                <EyeOutlined style={{ color: FT.color.text }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: FT.color.dark }}>
                    {mappedRows.length} device type records preview
                </span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{mappedFields.length} fields mapped</span>
                {requiredMissing > 0 && (
                    <Tag color="warning" style={{ marginLeft: "auto", fontSize: 11 }}>
                        ⚠ {requiredMissing} In rows required field empty
                    </Tag>
                )}
            </div>

            {submitting && (
                <div style={{
                    marginBottom: 14, padding: "12px 16px",
                    background: T.purple.bg, border: `1px solid ${T.purple.border}`,
                    borderRadius: T.radius.md, display: "flex", alignItems: "center", gap: 10,
                }}>
                    <Spin size="small" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.purple.dark }}>
                        Submitting {mappedRows.length} records…
                    </span>
                </div>
            )}

            <Table
                dataSource={mappedRows} rowKey="_key" columns={columns}
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} rows` }}
                scroll={{ x: Math.max(600, mappedFields.length * 150) }}
                rowClassName={row =>
                    BACKEND_FIELDS.filter(f => f.required).some(f => !row[f.key]) ? "row-warn" : ""
                }
            />
            <style>{`
                .row-warn td { background: ${T.amber.bg} !important; }
                .ant-table-tbody > tr:hover > td { background: ${T.blue.bg} !important; }
            `}</style>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 4 — Result
// ════════════════════════════════════════════════════════════════════════════
function StepResult({ response, error }) {
    if (error) {
        return (
            <div style={{ padding: "24px 0" }}>
                <Alert type="error" showIcon message="Import Failed"
                    description={typeof error === "string" ? error : JSON.stringify(error)}
                    style={{ borderRadius: T.radius.md }} />
            </div>
        );
    }

    // ✅ Backend ke actual field names use karo
    const {
        totalImported = 0,
        totalSkipped = 0,
        totalErrors = 0,
        importedDeviceTypes = [],
        skippedDeviceTypes = [],
        createdCategories = [],
    } = response ?? {};

    const created = totalImported;
    const skipped = totalSkipped;
    const errors = totalErrors;
    const totalSent = created + skipped + errors;

    // rows table ke liye combined list
    const rows = [
        ...importedDeviceTypes.map(name => ({ deviceTypeName: name, status: "created" })),
        ...skippedDeviceTypes.map(name => ({ deviceTypeName: name, status: "skipped" })),
    ];

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                    { label: "Total Sent", value: totalSent, color: T.blue },
                    { label: "Created", value: created, color: T.green },
                    { label: "Skipped", value: skipped, color: skipped > 0 ? T.amber : T.gray },
                    { label: "Errors", value: errors, color: errors > 0 ? T.red : T.gray },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{
                        padding: "14px 12px", textAlign: "center",
                        background: color.bg, border: `1px solid ${color.border}`,
                        borderRadius: T.radius.lg,
                    }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: color.text }}>{value}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: color.dark }}>{label}</div>
                    </div>
                ))}
            </div>

            {createdCategories.length > 0 && (
                <div style={{
                    marginBottom: 12, padding: "10px 14px",
                    background: T.blue.bg, border: `1px solid ${T.blue.border}`,
                    borderRadius: T.radius.md, fontSize: 12,
                }}>
                    <strong>New categories auto-created:</strong> {createdCategories.join(", ")}
                </div>
            )}

            {rows.length > 0 && (
                <Table
                    dataSource={rows}
                    rowKey={(r, i) => `${r.deviceTypeName}_${i}`}
                    columns={[
                        { title: "Device Type Name", dataIndex: "deviceTypeName" },
                        {
                            title: "Status", dataIndex: "status", width: 110,
                            render: (v) => v === "created"
                                ? <Tag icon={<CheckCircleOutlined />} color="success">Created</Tag>
                                : <Tag icon={<WarningOutlined />} color="warning">Skipped</Tag>,
                        },
                    ]}
                    size="small"
                    pagination={{ pageSize: 10 }}
                />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * ImportDeviceTypeModal
 *
 * Props:
 *   open            {boolean}
 *   onCancel        {Function}
 *   onImportSuccess {Function}
 *
 * Usage:
 *   <ImportDeviceTypeModal
 *     open={showImportModal}
 *     onCancel={() => setShowImportModal(false)}
 *     onImportSuccess={fetchRecords}
 *   />
 */
export default function ImportDeviceTypeModal({ open, onCancel, onImportSuccess }) {
    const [subStep, setSubStep] = useState("upload");
    const [parsedData, setParsedData] = useState(null);
    const [mapping, setMapping] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [response, setResponse] = useState(null);
    const [resultError, setResultError] = useState(null);

    const reset = () => {
        setSubStep("upload");
        setParsedData(null);
        setMapping({});
        setSubmitting(false);
        setResponse(null);
        setResultError(null);
    };

    const handleClose = () => { reset(); onCancel(); };

    const handleParsed = useCallback((data) => {
        setParsedData(data);
        // Auto-map: column name match karo
        const autoMap = {};
        const normalize = s => s.toLowerCase().replace(/[\s_\-\/]/g, "");
        BACKEND_FIELDS.forEach(field => {
            const match = data.columns.find(col =>
                normalize(col) === normalize(field.key) ||
                normalize(col) === normalize(field.label)
            );
            autoMap[field.key] = match || null;
        });
        setMapping(autoMap);
        setSubStep("mapping");
    }, []);

    const mappedRows = useMemo(() => {
        if (!parsedData) return [];
        return applyMapping(parsedData.rows, mapping);
    }, [parsedData, mapping]);

    const requiredMapped = BACKEND_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const cleanRows = mappedRows.map(({ _key, _rowIndex, _sheetName, ...rest }) => rest);
            const data = await submitRecords(cleanRows);
            setResponse(data);
            onImportSuccess?.();
        } catch (err) {
            setResultError(extractErrorMessage(err));
        } finally {
            setSubmitting(false);
            setSubStep("result");
        }
    };

    const STEPS = [
        { title: "Upload", description: "Excel file" },
        { title: "Map", description: "Field mapping" },
        { title: "Preview", description: "Review rows" },
        { title: "Done", description: "Import result" },
    ];
    const stepIdx = { upload: 0, mapping: 1, preview: 2, result: 3 }[subStep] ?? 0;

    const modalWidth =
        subStep === "result" ? 1000 :
            subStep === "preview" ? 900 :
                subStep === "mapping" ? 820 : 560;

    const subtitle = {
        upload: "DeviceType Excel file upload here",
        mapping: parsedData ? `${parsedData.columns.length} columns · ${BACKEND_FIELDS.length} fields` : "",
        preview: `${mappedRows.length} records ready`,
        result: response
            ? `${response.created ?? 0} created · ${response.skipped ?? 0} skipped · ${response.errors ?? 0} errors`
            : resultError ? "Import failed" : "",
    }[subStep] || "";

    const renderFooter = () => {
        if (subStep === "upload") return [
            <Button key="cancel" onClick={handleClose}>Cancel</Button>,
        ];
        if (subStep === "mapping") return [
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("upload")}>Back</Button>,
            <Button key="cancel" onClick={handleClose}>Cancel</Button>,
            <Button key="next" type="primary" icon={<ArrowRightOutlined />}
                disabled={!requiredMapped} onClick={() => setSubStep("preview")}
                style={requiredMapped ? { background: T.blue.text, borderColor: T.blue.text } : {}}>
                Preview {mappedRows.length} Rows
            </Button>,
        ];
        if (subStep === "preview") return [
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("mapping")} disabled={submitting}>Back</Button>,
            <Button key="cancel" onClick={handleClose} disabled={submitting}>Cancel</Button>,
            <Button key="submit" type="primary" icon={<ImportOutlined />}
                loading={submitting}
                disabled={!requiredMapped || mappedRows.length === 0}
                onClick={handleSubmit}
                style={{ background: T.green.text, borderColor: T.green.text }}>
                Import {mappedRows.length} Device Types
            </Button>,
        ];
        return [
            <Button key="more" icon={<ReloadOutlined />} onClick={reset}>Import More</Button>,
            <Button key="done" type="primary" icon={<CheckCircleOutlined />} onClick={handleClose}
                style={{ background: T.green.text, borderColor: T.green.text }}>
                Done
            </Button>,
        ];
    };

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: T.radius.md,
                        background: FT.color.bg, border: `1px solid ${FT.color.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>📊</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            Import Device Types
                            <Tag color="green" style={{ marginLeft: 8, fontSize: 10, verticalAlign: "middle" }}>Excel</Tag>
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>{subtitle}</div>
                    </div>
                </div>
            }
            open={open}
            onCancel={handleClose}
            width={modalWidth}
            style={{ top: 24 }}
            styles={{
                body: {
                    padding: "16px 24px 8px",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                },
            }}
            footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 0 4px" }}>
                    {renderFooter()}
                </div>
            }
            destroyOnClose
            afterClose={reset}
        >
            <Steps
                current={stepIdx} size="small" style={{ marginBottom: 20 }}
                items={STEPS.map((s, i) => ({
                    title: s.title, description: s.description,
                    status: i < stepIdx ? "finish" : i === stepIdx ? "process" : "wait",
                }))}
            />
            <Divider style={{ margin: "0 0 16px" }} />

            {subStep === "upload" && <StepUpload onParsed={handleParsed} />}
            {subStep === "mapping" && parsedData && (
                <StepMapping parsedData={parsedData} mapping={mapping} onMappingChange={setMapping} />
            )}
            {subStep === "preview" && (
                <StepPreview mappedRows={mappedRows} mapping={mapping} submitting={submitting} />
            )}
            {subStep === "result" && (
                <StepResult response={response} error={resultError} />
            )}
        </Modal>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// USAGE
// ════════════════════════════════════════════════════════════════════════════
// import ImportDeviceTypeModal from "./ImportDeviceTypeModal";
//
// <ImportDeviceTypeModal
//   open={showImportModal}
//   onCancel={() => setShowImportModal(false)}
//   onImportSuccess={fetchRecords}
// />