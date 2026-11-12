import { useState, useMemo, useCallback } from "react";
import {
    Modal, Button, Steps, Upload, Spin, Alert,
    Table, Divider, Tag, Tooltip, Select,
} from "antd";
import {
    FileExcelOutlined, CheckCircleOutlined, WarningOutlined,
    CloseCircleOutlined, ReloadOutlined, ImportOutlined,
    ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined, EyeOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { axiosdevice } from "../../config"
import React from "react";
// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
    blue: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", dark: "#1E40AF" },
    green: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", dark: "#15803D" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", dark: "#B45309" },
    emerald: { bg: "#ECFDF5", border: "#A7F3D0", text: "#059669", dark: "#047857" },
    red: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", dark: "#B91C1C" },
    purple: { bg: "#FAF5FF", border: "#E9D5FF", text: "#7C3AED", dark: "#6D28D9" },
    gray: { bg: "#F9FAFB", border: "#E5E7EB", text: "#6B7280", dark: "#374151" },
    slate: { bg: "#F1F5F9", border: "#CBD5E1", text: "#475569", dark: "#1E293B" },
    violet: { bg: "#F5F3FF", border: "#DDD6FE", text: "#7C3AED", dark: "#5B21B6" },
    radius: { sm: 6, md: 8, lg: 12, xl: 16 },
};

// ════════════════════════════════════════════════════════════════════════════════
// BACKEND FIELDS
// ════════════════════════════════════════════════════════════════════════════════
const BACKEND_FIELDS = [
    { key: "oemName", label: "OEM / Company", required: false, color: "blue", hint: "e.g. HP, Dell, Cisco" },
    { key: "category", label: "Device Category", required: false, color: "geekblue", hint: "e.g. Laptop, Printer, Router" },
    { key: "modelName", label: "Model Name", required: false, color: "orange", hint: "e.g. LaserJet Pro M404n" },
    { key: "deviceType", label: "Device Type", required: false, color: "purple", hint: "e.g. Printer, Camera, Switch" },
];

// ════════════════════════════════════════════════════════════════════════════════
// SUBMIT — original file seedha bhejo
// ════════════════════════════════════════════════════════════════════════════════
async function submitFile(rawFile, parsedRows) {
    const ext = "." + rawFile.name.split(".").pop().toLowerCase();
    let fileToSend = rawFile;

    if (ext === ".csv") {
        // CSV ko Excel mein convert karo taaki backend ko consistent format mile
        const ws = XLSX.utils.json_to_sheet(parsedRows.map(r => r._raw));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        const blob = new Blob(
            [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
            { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        );
        fileToSend = new File([blob], rawFile.name.replace(/\.csv$/i, ".xlsx"));
    }

    const fd = new FormData();
    fd.append("file", fileToSend, fileToSend.name);
    const res = await axiosdevice.post("/DeviceFile/import-bulk", fd, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
}

// ════════════════════════════════════════════════════════════════════════════════
// PARSER — sheetRows:200 for fast preview
// ════════════════════════════════════════════════════════════════════════════════
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
                    // xlsx / xls ke liye array buffer, preview ke liye sirf 200 rows
                    wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", sheetRows: 200 });
                }

                const allCols = new Set();
                const allRows = [];
                let idx = 0;
                wb.SheetNames.forEach((sheetName) => {
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
                    rows.forEach((raw, i) => {
                        Object.keys(raw).forEach(k => allCols.add(k));
                        allRows.push({ _key: ++idx, _rowIndex: i + 2, _sheetName: sheetName, _raw: raw });
                    });
                });
                if (!allRows.length) { reject(new Error("No data rows found in the file.")); return; }
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

// ════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════
function extractErrorMessage(err) {
    if (typeof err === "string" && err.trim()) return err;
    if (err?.response?.data?.message) return String(err.response.data.message);
    if (err?.message) return String(err.message);
    if (err?.title) return String(err.title);
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

function buildAutoMapping(columns) {
    const normalize = s => s.toLowerCase().replace(/[\s_\-\/]/g, "");
    const autoMap = {};
    BACKEND_FIELDS.forEach(field => {
        const match = columns.find(col =>
            normalize(col) === normalize(field.key) ||
            normalize(col) === normalize(field.label)
        );
        autoMap[field.key] = match || null;
    });
    return autoMap;
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — Upload
// ════════════════════════════════════════════════════════════════════════════════
function StepUpload({ onParsed }) {
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleFile = async (file) => {
        setError(null);
        const ext = "." + file.name.split(".").pop().toLowerCase();
        // ✅ .csv add kiya
        if (![".xlsx", ".xls", ".csv"].includes(ext)) {
            setError("Only .xlsx, .xls or .csv files accepted.");
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
            <div style={{
                marginBottom: 14, padding: "10px 14px",
                background: T.emerald.bg, border: `1px solid ${T.emerald.border}`,
                borderRadius: T.radius.md, fontSize: 12, color: T.emerald.dark,
                display: "flex", alignItems: "center", gap: 10,
            }}>
                <span style={{ fontSize: 22 }}>📊</span>
                <div>
                    <div style={{ fontWeight: 700 }}>Device File Excel/CSV upload here</div>
                    <div style={{ fontSize: 11, marginTop: 2, color: "#6B7280" }}>
                        .xlsx / .xls / .csv · for preview 200 rows will be loaded and other are uploaded to backend
                    </div>
                </div>
            </div>

            <Upload.Dragger
                beforeUpload={handleFile}
                showUploadList={false}
                accept=".xlsx,.xls,.csv"
                disabled={parsing}
                style={{ borderRadius: T.radius.lg, borderColor: T.emerald.border, background: T.emerald.bg }}
            >
                <div style={{ padding: "44px 20px" }}>
                    {parsing ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                            <Spin size="large" />
                            <div style={{ fontSize: 13, color: T.emerald.dark, fontWeight: 600 }}>
                                Columns are detecting
                            </div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                first 200 rows are loaded for preview
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: 50, marginBottom: 12, lineHeight: 1 }}>📊</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.emerald.dark, marginBottom: 4 }}>
                                Drop Excel or CSV file here
                            </div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>
                                or <span style={{ color: T.emerald.text, fontWeight: 600 }}>click to browse</span>
                                {" — "}.xlsx, .xls, .csv
                            </div>
                            {fileName && (
                                <div style={{
                                    marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6,
                                    background: "#fff", border: `1px solid ${T.emerald.border}`,
                                    borderRadius: T.radius.md, padding: "5px 14px",
                                }}>
                                    <FileExcelOutlined style={{ color: T.emerald.text }} />
                                    <span style={{ fontSize: 12, color: T.emerald.dark, fontWeight: 500 }}>{fileName}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Upload.Dragger>

            {error && (
                <Alert type="error" message={error} showIcon style={{ marginTop: 12, borderRadius: T.radius.md }} />
            )}

            <div style={{
                marginTop: 14, padding: "12px 16px",
                background: T.slate.bg, border: `1px solid ${T.slate.border}`,
                borderRadius: T.radius.md,
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate.dark, marginBottom: 8 }}>
                    📋 Template columns (All optional):
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {BACKEND_FIELDS.map(f => (
                        <div key={f.key} style={{
                            padding: "5px 10px", borderRadius: T.radius.md, fontSize: 11,
                            background: "#fff", border: `1px solid ${T.gray.border}`,
                        }}>
                            <code style={{ color: T.gray.dark, fontWeight: 700 }}>{f.label}</code>
                            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{f.hint}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — Field Mapping
// ════════════════════════════════════════════════════════════════════════════════
function StepMapping({ parsedData, mapping, onMappingChange }) {
    const { columns, rows } = parsedData;

    const sampleValue = (col) => {
        const val = String(rows[0]?._raw[col] ?? "").trim();
        return val.length > 30 ? val.slice(0, 30) + "…" : val;
    };

    const usedColumns = new Set(Object.values(mapping).filter(Boolean));
    const mappedCount = BACKEND_FIELDS.filter(f => mapping[f.key]).length;

    return (
        <div style={{ padding: "4px 0" }}>
            <div style={{
                marginBottom: 14, padding: "10px 14px",
                background: T.emerald.bg, border: `1px solid ${T.emerald.border}`,
                borderRadius: T.radius.md, fontSize: 12, color: T.emerald.dark,
                display: "flex", alignItems: "center", gap: 10,
            }}>
                <span style={{ fontSize: 20 }}>🗂️</span>
                <span>
                    <strong>Field Mapping:</strong> for every backend field select excel file column.
                    All fields are optional.
                </span>
            </div>

            <div style={{
                display: "flex", border: `1px solid ${T.gray.border}`,
                borderRadius: T.radius.lg, overflow: "hidden",
            }}>
                {/* LEFT — Backend fields */}
                <div style={{ flex: "0 0 210px", background: "#FAFAFA", borderRight: `1px solid ${T.gray.border}` }}>
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
                            padding: "12px 14px", borderBottom: `1px solid ${T.gray.border}`,
                            background: mapping[field.key] ? "#fff" : "transparent",
                            transition: "background 0.15s", minHeight: 64,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <Tag color={field.color} style={{ fontSize: 11, margin: 0, lineHeight: "20px" }}>
                                    {field.label}
                                </Tag>
                                {mapping[field.key] && (
                                    <CheckCircleOutlined style={{ color: T.green.text, fontSize: 13, marginLeft: "auto" }} />
                                )}
                            </div>
                            <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>{field.hint}</div>
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
                            height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                            borderBottom: `1px solid ${T.gray.border}`, width: "100%",
                        }}>
                            <SwapOutlined style={{
                                color: mapping[field.key] ? T.green.text : "#D1D5DB",
                                fontSize: 13, transition: "color 0.15s",
                            }} />
                        </div>
                    ))}
                </div>

                {/* RIGHT — Excel column selectors */}
                <div style={{ flex: 1, background: "#FAFAFA", minWidth: 0 }}>
                    <div style={{
                        padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`,
                        background: T.emerald.bg, display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 18 }}>📊</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.emerald.dark }}>Excel Columns</span>
                        <span style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>
                            {columns.length} found
                        </span>
                    </div>
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{
                            padding: "9px 10px", borderBottom: `1px solid ${T.gray.border}`,
                            background: mapping[field.key] ? "#fff" : "transparent",
                            minHeight: 64, display: "flex", flexDirection: "column", justifyContent: "center",
                        }}>
                            <Select
                                size="small"
                                allowClear
                                placeholder={`Column for "${field.label}" (optional)`}
                                style={{ width: "100%" }}
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
                                            <strong>Column Name</strong><span>Sample Value</span>
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

            <div style={{
                marginTop: 12, padding: "9px 14px",
                background: mappedCount > 0 ? T.green.bg : T.slate.bg,
                border: `1px solid ${mappedCount > 0 ? T.green.border : T.slate.border}`,
                borderRadius: T.radius.md, fontSize: 12,
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            }}>
                {mappedCount > 0 ? (
                    <><CheckCircleOutlined style={{ color: T.green.text }} />
                        <span style={{ color: T.green.dark }}>{mappedCount} field(s) mapped — ready for preview .</span></>
                ) : (
                    <><WarningOutlined style={{ color: T.slate.text }} />
                        <span style={{ color: T.slate.dark }}>if no field are mapped you can move forward.</span></>
                )}
                <span style={{ marginLeft: "auto", color: "#9CA3AF", fontSize: 11 }}>
                    {parsedData.rows.length} rows (preview) × {mappedCount} fields
                </span>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — Preview
// ════════════════════════════════════════════════════════════════════════════════
function StepPreview({ mappedRows, mapping, submitting, fileName }) {
    const mappedFields = BACKEND_FIELDS.filter(f => mapping[f.key]);

    const columns = [
        {
            title: "#", dataIndex: "_rowIndex", width: 55,
            render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
        },
        {
            title: "Sheet", dataIndex: "_sheetName", width: 100,
            render: v => <Tag color="green" style={{ fontSize: 10 }}>{v}</Tag>,
        },
        ...(mappedFields.length > 0
            ? mappedFields.map(field => ({
                title: <Tag color={field.color} style={{ fontSize: 10, margin: 0 }}>{field.label}</Tag>,
                dataIndex: field.key, ellipsis: true,
                render: (v) => v
                    ? <span style={{ fontSize: 12 }}>{v}</span>
                    : <span style={{ color: "#D1D5DB", fontSize: 11, fontStyle: "italic" }}>—</span>,
            }))
            : [{
                title: "Info", dataIndex: "_rowIndex",
                render: (_, row) => (
                    <span style={{ fontSize: 11, color: "#6B7280" }}>
                        Row #{row._rowIndex} — {row._sheetName}
                    </span>
                ),
            }]
        ),
    ];

    return (
        <div>
            <div style={{
                marginBottom: 14, padding: "10px 16px",
                background: T.emerald.bg, border: `1px solid ${T.emerald.border}`,
                borderRadius: T.radius.md, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
                <EyeOutlined style={{ color: T.emerald.text }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.emerald.dark }}>
                    Preview — {mappedRows.length} rows
                </span>
                {fileName && (
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                        <FileExcelOutlined /> {fileName}
                    </span>
                )}
                <span style={{ fontSize: 11, color: "#6B7280" }}>{mappedFields.length} fields mapped</span>
            </div>

            {submitting && (
                <div style={{
                    marginBottom: 14, padding: "12px 16px",
                    background: T.purple.bg, border: `1px solid ${T.purple.border}`,
                    borderRadius: T.radius.md, display: "flex", alignItems: "center", gap: 10,
                }}>
                    <Spin size="small" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.purple.dark }}>
                        Original Excel file uploading...
                    </span>
                </div>
            )}

            <div style={{
                marginBottom: 12, padding: "9px 14px",
                background: T.violet.bg, border: `1px solid ${T.violet.border}`,
                borderRadius: T.radius.md, fontSize: 11, color: T.violet.dark,
                display: "flex", alignItems: "center", gap: 8,
            }}>
                <span>⚡</span>
                <span>Original Excel file backend goes to backend — duplicate rows automatically skip.</span>
            </div>

            <Table
                dataSource={mappedRows}
                rowKey="_key"
                columns={columns}
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} rows (preview)` }}
                scroll={{ x: Math.max(500, mappedFields.length * 150) }}
                style={{ fontSize: 12 }}
            />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — Result  (duplicates silently shown in summary only)
// ════════════════════════════════════════════════════════════════════════════════
function StepResult({ response, error }) {

    // ── Agar backend ne error diya lekin usme sirf duplicate info hai
    //    toh usse bhi success ki tarah treat karo ──────────────────────
    const isDuplicateOnlyError =
        error &&
        typeof error === "string" &&
        (error.toLowerCase().includes("duplicate") ||
            error.toLowerCase().includes("already exist") ||
            error.toLowerCase().includes("unique"));

    if (error && !isDuplicateOnlyError) {
        return (
            <div style={{ padding: "24px 0" }}>
                <Alert type="error" showIcon message="Import Failed"
                    description={error}
                    style={{ borderRadius: T.radius.md }} />
            </div>
        );
    }

    const {
        created = 0,
        skipped = 0,
        duplicate = 0,   // backend "duplicate" field agar ho
        errors = 0,
        message: msg = "",
        rows = [],
    } = response ?? {};

    // Combine skipped + duplicate into one "skipped" number for display
    const totalSkipped = skipped + duplicate;
    // Rows that are NOT duplicates / skipped — only created ones
    const createdRows = rows.filter(r => r.status === "created");
    const skippedRows = rows.filter(r => r.status === "skipped" || r.status === "duplicate");
    const errorRows = rows.filter(r => r.status === "error");

    const allGood = created > 0 && totalSkipped === 0 && errorRows.length === 0;
    const hasSkips = totalSkipped > 0;

    const summaryCards = [
        { label: "Naye Records", value: created, color: T.green, icon: "✅" },
        { label: "Duplicates Skip", value: totalSkipped, color: hasSkips ? T.amber : T.gray, icon: "🔁" },
        { label: "Errors", value: errorRows.length, color: errorRows.length > 0 ? T.red : T.gray, icon: "❌" },
        { label: "Total Rows", value: rows.length || (created + totalSkipped + errorRows.length), color: T.blue, icon: "📋" },
    ];

    const createdColumns = [
        {
            title: "#", dataIndex: "rowIndex", width: 55,
            render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
        },
        ...BACKEND_FIELDS.map(f => ({
            title: <Tag color={f.color} style={{ fontSize: 10, margin: 0 }}>{f.label}</Tag>,
            dataIndex: f.key, ellipsis: true,
            render: v => v ? <span style={{ fontSize: 11 }}>{v}</span> : <span style={{ color: "#D1D5DB" }}>—</span>,
        })),
        {
            title: "Status", width: 110, fixed: "right",
            render: () => <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11 }}>Created</Tag>,
        },
    ];

    const skippedColumns = [
        {
            title: "#", dataIndex: "rowIndex", width: 55,
            render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
        },
        ...BACKEND_FIELDS.map(f => ({
            title: <Tag color={f.color} style={{ fontSize: 10, margin: 0 }}>{f.label}</Tag>,
            dataIndex: f.key, ellipsis: true,
            render: v => v ? <span style={{ fontSize: 11 }}>{v}</span> : <span style={{ color: "#D1D5DB" }}>—</span>,
        })),
        {
            title: "Reason", dataIndex: "reason", width: 140, fixed: "right",
            render: v => (
                <Tooltip title={v}>
                    <Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 11 }}>
                        Duplicate
                    </Tag>
                </Tooltip>
            ),
        },
    ];

    return (
        <div>
            {/* ── Big success banner ── */}
            <div style={{
                marginBottom: 20, padding: "16px 20px",
                background: allGood ? T.green.bg : T.emerald.bg,
                border: `1px solid ${allGood ? T.green.border : T.emerald.border}`,
                borderRadius: T.radius.lg,
                display: "flex", alignItems: "center", gap: 14,
            }}>
                <div style={{ fontSize: 36, lineHeight: 1 }}>
                    {allGood ? "🎉" : hasSkips ? "✅" : "✅"}
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: allGood ? T.green.dark : T.emerald.dark, marginBottom: 3 }}>
                        {allGood
                            ? `${created} records successfully import!`
                            : `${created} records imported · ${totalSkipped} duplicate skipped`}
                    </div>
                    {hasSkips && (
                        <div style={{ fontSize: 12, color: T.amber.dark }}>
                            Duplicate rows already exists — this will safely skip.
                        </div>
                    )}
                    {msg && !hasSkips && (
                        <div style={{ fontSize: 12, color: "#6B7280" }}>{msg}</div>
                    )}
                </div>
            </div>

            {/* ── Summary cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {summaryCards.map(({ label, value, color, icon }) => (
                    <div key={label} style={{
                        padding: "14px 12px", textAlign: "center",
                        background: color.bg, border: `1px solid ${color.border}`,
                        borderRadius: T.radius.lg,
                    }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: color.text, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: color.dark, marginTop: 4 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Created rows table ── */}
            {createdRows.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        marginBottom: 8, padding: "8px 12px",
                        background: T.green.bg, border: `1px solid ${T.green.border}`,
                        borderRadius: T.radius.md,
                    }}>
                        <CheckCircleOutlined style={{ color: T.green.text }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.green.dark }}>
                            Successfully Created — {createdRows.length} records
                        </span>
                    </div>
                    <Table
                        dataSource={createdRows}
                        rowKey={(r, i) => `c_${r.rowIndex ?? i}`}
                        columns={createdColumns}
                        size="small"
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} created` }}
                        scroll={{ x: 700 }}
                        style={{ fontSize: 12 }}
                    />
                </div>
            )}

            {/* ── Skipped/Duplicate rows table — at the bottom ── */}
            {skippedRows.length > 0 && (
                <div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        marginBottom: 8, padding: "8px 12px",
                        background: T.amber.bg, border: `1px solid ${T.amber.border}`,
                        borderRadius: T.radius.md,
                    }}>
                        <WarningOutlined style={{ color: T.amber.text }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.amber.dark }}>
                            Duplicate —  are Skipped({skippedRows.length} rows)
                        </span>
                        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>
                            — this record are already exists
                        </span>
                    </div>
                    <Table
                        dataSource={skippedRows}
                        rowKey={(r, i) => `s_${r.rowIndex ?? i}`}
                        columns={skippedColumns}
                        size="small"
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} skipped` }}
                        scroll={{ x: 700 }}
                        rowClassName={() => "row-skipped"}
                        style={{ fontSize: 12 }}
                    />
                </div>
            )}

            <style>{`
                .row-skipped td { background: ${T.amber.bg} !important; }
            `}</style>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ════════════════════════════════════════════════════════════════════════════════
export default function ImportDeviceFileModal({ open, onCancel, onImportSuccess }) {
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
        setMapping(buildAutoMapping(data.columns));
        setSubStep("mapping");
    }, []);

    const mappedRows = useMemo(() => {
        if (!parsedData) return [];
        return applyMapping(parsedData.rows, mapping);
    }, [parsedData, mapping]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // ✅ parsedData.rows pass karo
            const data = await submitFile(parsedData.rawFile, parsedData.rows);
            setResponse(data);
            onImportSuccess?.();
        } catch (err) {
            const raw = err?.response?.data;
            const status = err?.response?.status;

            if ((status === 400 || status === 409) && raw) {
                setResponse({
                    created: raw.created ?? 0,
                    skipped: raw.skipped ?? 0,
                    duplicate: raw.duplicate ?? 0,
                    errors: raw.errors ?? 0,
                    message: raw.message ?? "",
                    rows: raw.rows ?? [],
                });
            } else {
                setResultError(extractErrorMessage(err));
            }
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

    const subtitle = {
        upload: "Excel file upload here (.xlsx / .xls)",
        mapping: parsedData ? `${parsedData.columns.length} columns found · All fields optional` : "",
        preview: parsedData ? `${mappedRows.length} rows preview · original file submit ` : "",
        result: response
            ? `${response.created ?? 0} created · ${(response.skipped ?? 0) + (response.duplicate ?? 0)} duplicate skip`
            : resultError ? "Import failed" : "",
    }[subStep] || "";

    const modalWidth =
        subStep === "result" ? 860 :
            subStep === "preview" ? 720 :
                subStep === "mapping" ? 780 : 560;

    const renderFooter = () => {
        if (subStep === "upload") return [
            <Button key="cancel" onClick={handleClose}>Cancel</Button>,
        ];
        if (subStep === "mapping") return [
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("upload")}>Back</Button>,
            <Button key="cancel" onClick={handleClose}>Cancel</Button>,
            <Button
                key="next" type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => setSubStep("preview")}
                style={{ background: T.blue.text, borderColor: T.blue.text }}
            >
                Preview {mappedRows.length} Rows
            </Button>,
        ];
        if (subStep === "preview") return [
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("mapping")} disabled={submitting}>Back</Button>,
            <Button key="cancel" onClick={handleClose} disabled={submitting}>Cancel</Button>,
            <Button
                key="submit" type="primary"
                icon={<ImportOutlined />}
                loading={submitting}
                onClick={handleSubmit}
                style={{ background: T.green.text, borderColor: T.green.text }}
            >
                Import File
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
                        background: T.emerald.bg, border: `1px solid ${T.emerald.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>
                        📊
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            Import Device Files
                            <Tag color="green" style={{ marginLeft: 8, fontSize: 10, verticalAlign: "middle" }}>
                                Excel
                            </Tag>
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
                current={stepIdx}
                size="small"
                style={{ marginBottom: 20 }}
                items={STEPS.map((s, i) => ({
                    title: s.title,
                    description: s.description,
                    status: i < stepIdx ? "finish" : i === stepIdx ? "process" : "wait",
                }))}
            />
            <Divider style={{ margin: "0 0 16px" }} />

            {subStep === "upload" && <StepUpload onParsed={handleParsed} />}
            {subStep === "mapping" && parsedData && (
                <StepMapping parsedData={parsedData} mapping={mapping} onMappingChange={setMapping} />
            )}
            {subStep === "preview" && (
                <StepPreview mappedRows={mappedRows} mapping={mapping} submitting={submitting} fileName={parsedData?.fileName} />
            )}
            {subStep === "result" && <StepResult response={response} error={resultError} />}
        </Modal>
    );
}