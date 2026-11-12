import { useState, useMemo, useCallback } from "react";
import {
    Modal, Button, Steps, Upload, Spin, Alert,
    Table, Divider, Tag, Tooltip, Select, Checkbox, Progress,
} from "antd";
import {
    FileExcelOutlined, CheckCircleOutlined, WarningOutlined,
    CloseCircleOutlined, ReloadOutlined, ImportOutlined,
    ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined,
    CheckSquareOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import axiosInstance from "../../config";
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
    radius: { sm: 6, md: 8, lg: 12, xl: 16 },
};

// ════════════════════════════════════════════════════════════════════════════════
// BACKEND FIELDS
// ════════════════════════════════════════════════════════════════════════════════
const BACKEND_FIELDS = [
    { key: "CompanyName", label: "Company Name", required: true, color: "blue" },
    { key: "CompanyType", label: "Company Type", required: false, color: "geekblue" },
    { key: "CompanyDescription", label: "Description", required: false, color: "cyan" },
    { key: "ContactName", label: "Contact Name", required: false, color: "purple" },
    { key: "ContactPrimaryEmail", label: "Primary Email", required: false, color: "orange" },
    { key: "ContactSecondaryEmail", label: "Secondary Email", required: false, color: "orange" },
    { key: "ContactPrimaryPhone", label: "Primary Phone", required: false, color: "green" },
    { key: "ContactSecondaryPhone", label: "Secondary Phone", required: false, color: "green" },
    { key: "AddressLine1", label: "Address Line 1", required: false, color: "volcano" },
    { key: "AddressLine2", label: "Address Line 2", required: false, color: "volcano" },
    { key: "Country", label: "Country", required: false, color: "gold" },
    { key: "State", label: "State", required: false, color: "gold" },
    { key: "City", label: "City", required: false, color: "gold" },
    { key: "PinCode", label: "Pin Code", required: false, color: "lime" },
    { key: "Landmark", label: "Landmark", required: false, color: "cyan" },
    { key: "Latitude", label: "Latitude", required: false, color: "default" },
    { key: "Longitude", label: "Longitude", required: false, color: "default" },
    { key: "TimeZone", label: "Time Zone", required: false, color: "default" },
    { key: "LocationContact", label: "Location Contact", required: false, color: "purple" },
    { key: "BankName", label: "Bank Name", required: false, color: "magenta" },
    { key: "AccountHolder", label: "Account Holder", required: false, color: "magenta" },
    { key: "AccountNumber", label: "Account Number", required: false, color: "magenta" },
    { key: "IFSCCode", label: "IFSC Code", required: false, color: "red" },
    { key: "BranchName", label: "Branch Name", required: false, color: "magenta" },
    { key: "SwiftCode", label: "SWIFT Code", required: false, color: "red" },
    { key: "IBAN", label: "IBAN", required: false, color: "red" },
    { key: "AccountType", label: "Account Type", required: false, color: "magenta" },
    { key: "PrimaryAccount", label: "Primary Account", required: false, color: "magenta" },
];

// ════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════
function autoDetectMapping(columns) {
    const normalize = (s) => s.toLowerCase().replace(/[\s_\->/]/g, "");
    const map = {};
    BACKEND_FIELDS.forEach((field) => {
        const match = columns.find((col) => {
            const n = normalize(col);
            return n === normalize(field.key) || n === normalize(field.label);
        });
        map[field.key] = match || null;
    });
    return map;
}

function applyMapping(rows, mapping) {
    return rows.map((row) => {
        const rec = { _key: row._key, _rowIndex: row._rowIndex, _sheetName: row._sheetName };
        BACKEND_FIELDS.forEach(({ key }) => {
            const col = mapping[key];
            rec[key] = col ? String(row._raw[col] ?? "").trim() : "";
        });
        return rec;
    });
}

function extractErrorMessage(err) {
    if (typeof err === "string" && err.trim()) return err;
    if (err?.response?.data?.message) return String(err.response.data.message);
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return "Upload failed"; }
}

// ════════════════════════════════════════════════════════════════════════════════
// EXCEL PARSER
// ════════════════════════════════════════════════════════════════════════════════
async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                const allCols = new Set();
                const allRows = [];
                let globalIdx = 0;
                wb.SheetNames.forEach((sheetName) => {
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
                    rows.forEach((raw, i) => {
                        Object.keys(raw).forEach((k) => allCols.add(k));
                        allRows.push({ _key: ++globalIdx, _rowIndex: i + 2, _sheetName: sheetName, _raw: raw });
                    });
                });
                if (!allRows.length) { reject(new Error("No data rows found in file.")); return; }
                resolve({ columns: [...allCols], rows: allRows, sheetNames: wb.SheetNames });
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsArrayBuffer(file);
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════════════════════════════════════════════
// async function uploadBulk(mappedRows, originalName) {
//     const cleanRows = mappedRows.map(({ _key, _rowIndex, _sheetName, ...rest }) => rest);
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(cleanRows);
//     XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//     const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
//     const baseName = originalName.replace(/\.[^.]+$/, "");
//     const uploadFile = new File([blob], `${baseName}_mapped.xlsx`, { type: blob.type });
//     const fd = new FormData();
//     fd.append("file", uploadFile);
//     const res = await axiosInstance.post("/Company/import-company-data", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//         timeout: 120000,
//     });
//     return res?.data !== undefined ? res.data : res;
// }
async function uploadBulk(mappedRows, originalName, mapping) {
    const cleanRows = mappedRows.map(({ _key, _rowIndex, _sheetName, ...rest }) => rest);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(cleanRows);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const baseName = originalName.replace(/\.[^.]+$/, "");
    const uploadFile = new File([blob], `${baseName}_mapped.xlsx`, { type: blob.type });

    // ✅ Filter out null/undefined mappings
    const filteredMapping = Object.fromEntries(
        Object.entries(mapping || {}).filter(([_, value]) => value != null)
    );

    const columnMappingsJson = JSON.stringify(filteredMapping);

    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("ColumnMappingsJson", columnMappingsJson);

    const res = await axiosInstance.post("/CompanyImport/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
    });
    return res?.data !== undefined ? res.data : res;
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
        if (![".xlsx", ".xls"].includes(ext)) {
            setError("Only .xlsx or .xls files accepted.");
            return false;
        }
        setFileName(file.name);
        setParsing(true);
        try {
            const parsed = await parseExcelFile(file);
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
                    <div style={{ fontWeight: 700 }}>Upload a company data Excel file</div>
                    <div style={{ fontSize: 11, marginTop: 2, color: "#6B7280" }}>
                        .xlsx / .xls · multiple sheets supported · duplicate companies auto-skip
                    </div>
                </div>
            </div>

            <Upload.Dragger
                beforeUpload={handleFile}
                showUploadList={false}
                accept=".xlsx,.xls"
                disabled={parsing}
                style={{ borderRadius: T.radius.lg, borderColor: T.emerald.border, background: T.emerald.bg }}
            >
                <div style={{ padding: "44px 20px" }}>
                    {parsing ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                            <Spin size="large" />
                            <div style={{ fontSize: 13, color: T.emerald.dark, fontWeight: 600 }}>
                                Detecting columns...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: 50, marginBottom: 12, lineHeight: 1 }}>📊</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.emerald.dark, marginBottom: 4 }}>
                                Drop the Excel file here
                            </div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>
                                or <span style={{ color: T.emerald.text, fontWeight: 600 }}>click to browse</span>
                                {" — "}.xlsx, .xls
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
                marginTop: 14, padding: "11px 16px",
                background: T.slate.bg, border: `1px solid ${T.slate.border}`,
                borderRadius: T.radius.md,
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.slate.dark, marginBottom: 8 }}>
                    📋 Expected columns (CompanyName required, baaki optional):
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {BACKEND_FIELDS.map(f => (
                        <span key={f.key} style={{
                            padding: "3px 8px", borderRadius: T.radius.sm, fontSize: 10,
                            background: f.required ? T.blue.bg : "#fff",
                            border: `1px solid ${f.required ? T.blue.border : T.gray.border}`,
                            color: f.required ? T.blue.dark : T.gray.dark,
                            fontWeight: f.required ? 700 : 400,
                        }}>
                            {f.label}{f.required ? " *" : ""}
                        </span>
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
        return val.length > 28 ? val.slice(0, 28) + "…" : val;
    };

    const usedColumns = new Set(Object.values(mapping).filter(Boolean));
    const requiredMet = BACKEND_FIELDS.filter(f => f.required).every(f => mapping[f.key]);
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
                    <strong>Field Mapping:</strong> choose the Excel column for each backend field.
                    Fields marked <span style={{ color: T.red.text, fontWeight: 700 }}> * </span> are required.
                    Columns have already been matched automatically where possible.
                </span>
            </div>

            <div style={{
                display: "flex", border: `1px solid ${T.gray.border}`,
                borderRadius: T.radius.lg, overflow: "hidden",
            }}>
                <div style={{ flex: 1, background: "#FAFAFA", borderRight: `1px solid ${T.gray.border}` }}>
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
                            {mappedCount}/{BACKEND_FIELDS.length} mapped
                        </span>
                    </div>
                    {BACKEND_FIELDS.map((field) => (
                        <div key={field.key} style={{
                            padding: "11px 14px", borderBottom: `1px solid ${T.gray.border}`,
                            background: mapping[field.key] ? "#fff" : "transparent",
                            transition: "background 0.15s", minHeight: 58,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                <Tag color={field.color} style={{ fontSize: 11, margin: 0 }}>{field.label}</Tag>
                                {field.required && (
                                    <span style={{ color: T.red.text, fontSize: 13, fontWeight: 700 }}>*</span>
                                )}
                                {mapping[field.key] && (
                                    <CheckCircleOutlined style={{ color: T.green.text, fontSize: 12, marginLeft: "auto" }} />
                                )}
                            </div>
                            <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>
                                key: {field.key}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    width: 38, background: "#F3F4F6", display: "flex",
                    flexDirection: "column", alignItems: "center", flexShrink: 0,
                }}>
                    <div style={{ height: 44, borderBottom: `1px solid ${T.gray.border}`, width: "100%" }} />
                    {BACKEND_FIELDS.map((field) => (
                        <div key={field.key} style={{
                            height: 58, display: "flex", alignItems: "center", justifyContent: "center",
                            borderBottom: `1px solid ${T.gray.border}`, width: "100%",
                        }}>
                            <SwapOutlined style={{
                                color: mapping[field.key] ? T.green.text : "#D1D5DB",
                                fontSize: 13, transition: "color 0.15s",
                            }} />
                        </div>
                    ))}
                </div>

                <div style={{ flex: 1, background: "#FAFAFA" }}>
                    <div style={{
                        padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`,
                        background: T.emerald.bg, display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 16 }}>📊</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.emerald.dark }}>Excel Columns</span>
                        <span style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>
                            {columns.length} found
                        </span>
                    </div>
                    {BACKEND_FIELDS.map((field) => (
                        <div key={field.key} style={{
                            padding: "8px 10px", borderBottom: `1px solid ${T.gray.border}`,
                            background: mapping[field.key] ? "#fff" : "transparent",
                            minHeight: 58, display: "flex", flexDirection: "column", justifyContent: "center",
                        }}>
                            <Select
                                size="small"
                                allowClear
                                placeholder={`Column for "${field.label}"`}
                                style={{ width: "100%" }}
                                value={mapping[field.key] || undefined}
                                onChange={(val) => onMappingChange({ ...mapping, [field.key]: val || null })}
                                options={columns.map((col) => ({
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
                background: requiredMet ? T.green.bg : T.amber.bg,
                border: `1px solid ${requiredMet ? T.green.border : T.amber.border}`,
                borderRadius: T.radius.md, fontSize: 12,
                display: "flex", alignItems: "center", gap: 8,
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
                    {parsedData.rows.length} rows × {mappedCount} fields
                </span>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — Preview & Select Records
// ════════════════════════════════════════════════════════════════════════════════
function StepPreview({ mappedRows, mapping, selectedKeys, onSelectionChange, submitting, importProgress }) {
    const mappedFields = BACKEND_FIELDS.filter(f => mapping[f.key]);
    const totalRows = mappedRows.length;
    const selectedCount = selectedKeys.length;
    const allSelected = selectedCount === totalRows;
    const missingName = mappedRows.filter(r => !r.CompanyName?.trim()).length;

    const progressPercent = importProgress.total > 0
        ? Math.round((importProgress.done / importProgress.total) * 100)
        : 0;

    const columns = [
        {
            title: "",
            width: 36,
            render: (_, row) => (
                <Checkbox
                    checked={selectedKeys.includes(row._key)}
                    onChange={(e) => {
                        if (e.target.checked) onSelectionChange([...selectedKeys, row._key]);
                        else onSelectionChange(selectedKeys.filter(k => k !== row._key));
                    }}
                />
            ),
        },
        {
            title: "Sheet", dataIndex: "_sheetName", width: 100,
            render: v => <Tag color="default" style={{ fontSize: 10 }}>{v}</Tag>,
        },
        {
            title: "#", dataIndex: "_rowIndex", width: 52,
            render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
        },
        ...mappedFields.map(field => ({
            title: <Tag color={field.color} style={{ fontSize: 10, margin: 0 }}>{field.label}</Tag>,
            dataIndex: field.key,
            ellipsis: true,
            render: v => v
                ? <span style={{ fontSize: 12 }}>{v}</span>
                : <span style={{ color: field.required ? T.red.text : "#D1D5DB", fontSize: 11, fontStyle: "italic" }}>
                    {field.required ? "⚠ Empty" : "—"}
                </span>,
        })),
    ];

    return (
        <div>
            <div style={{
                marginBottom: 14, padding: "11px 16px",
                background: T.blue.bg, border: `1px solid ${T.blue.border}`,
                borderRadius: T.radius.md,
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.blue.dark }}>
                        {totalRows} records found
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                        {selectedCount} selected for import
                        {missingName > 0 && (
                            <span style={{ color: T.amber.dark, marginLeft: 10 }}>
                                ⚠ {missingName} rows have no Company Name
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        size="small"
                        icon={<CheckSquareOutlined />}
                        onClick={() => onSelectionChange(
                            mappedRows.filter(r => r.CompanyName?.trim()).map(r => r._key)
                        )}
                        style={{ fontSize: 11 }}
                    >
                        Valid Select
                    </Button>
                    <Button
                        size="small"
                        onClick={() => onSelectionChange(
                            allSelected ? [] : mappedRows.map(r => r._key)
                        )}
                        style={{ fontSize: 11 }}
                    >
                        {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                </div>
            </div>

            {submitting && (
                <div style={{
                    marginBottom: 14, padding: "12px 16px",
                    background: T.purple.bg, border: `1px solid ${T.purple.border}`,
                    borderRadius: T.radius.md,
                }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.purple.dark, marginBottom: 8 }}>
                        Uploading {importProgress.total} records...
                    </div>
                    <Progress percent={progressPercent} strokeColor={T.purple.text} size="small" />
                </div>
            )}

            <Table
                dataSource={mappedRows}
                rowKey="_key"
                columns={columns}
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} rows` }}
                scroll={{ x: Math.max(700, mappedFields.length * 160) }}
                rowClassName={(row) => {
                    if (!row.CompanyName?.trim()) return "row-no-company";
                    if (!selectedKeys.includes(row._key)) return "row-deselected";
                    return "";
                }}
                style={{ fontSize: 12 }}
            />
            <style>{`
                .row-no-company td { background: ${T.red.bg} !important; }
                .row-deselected td { opacity: 0.45; }
            `}</style>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — Result (FULLY FIXED)
// ════════════════════════════════════════════════════════════════════════════════
// function StepResult({ results, rawResponse, error }) {
//     if (error) {
//         return (
//             <div style={{ padding: "24px 0" }}>
//                 <Alert
//                     type="error"
//                     showIcon
//                     message="Import Failed"
//                     description={typeof error === "string" ? error : JSON.stringify(error)}
//                     style={{ borderRadius: T.radius.md }}
//                 />
//             </div>
//         );
//     }

//     // ── Stats from backend ──
//     const total = rawResponse?.totalRows || 0;
//     const created = rawResponse?.totalImported || 0;
//     const skipped = rawResponse?.totalSkipped || 0;
//     const errors = rawResponse?.totalFailed || 0;

//     const allSkipped = created === 0 && skipped > 0 && errors === 0;
//     const allSuccess = created > 0 && skipped === 0 && errors === 0;
//     const hasErrors = errors > 0;

//     // ── Summary Cards ──
//     const cards = [
//         { label: "Total Sent", value: total, color: T.blue, icon: "📋", desc: "rows bheje gaye" },
//         { label: "Created", value: created, color: created > 0 ? T.green : T.gray, icon: "✅", desc: "nayi companies bani" },
//         { label: "Skipped", value: skipped, color: skipped > 0 ? T.amber : T.gray, icon: "⏭️", desc: "already exist" },
//         { label: "Errors", value: errors, color: errors > 0 ? T.red : T.gray, icon: "❌", desc: "failed records" },
//     ];

//     // ── Table Columns ──
//     const tableColumns = [
//         {
//             title: "Sheet",
//             dataIndex: "sheetName",
//             width: 100,
//             render: v => v ? <Tag style={{ fontSize: 10 }}>{v}</Tag> : "—",
//         },
//         {
//             title: "#",
//             dataIndex: "rowIndex",
//             width: 52,
//             render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
//         },
//         {
//             title: "Company Name",
//             dataIndex: "companyName",
//             width: 200,
//             render: v => <span style={{ fontWeight: 600, fontSize: 12 }}>{v || "—"}</span>,
//         },
//         {
//             title: "Status",
//             dataIndex: "status",
//             width: 120,
//             fixed: "right",
//             render: (v, row) => {
//                 if (v === "success" || v === "created" || v === "imported") {
//                     return <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11 }}>✅ Created</Tag>;
//                 }
//                 if (v === "skipped") {
//                     return <Tooltip title={row.reason}><Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 11 }}>⏭️ Skipped</Tag></Tooltip>;
//                 }
//                 if (v === "duplicate") {
//                     return <Tooltip title={row.reason}><Tag icon={<WarningOutlined />} color="orange" style={{ fontSize: 11 }}>🔄 Duplicate</Tag></Tooltip>;
//                 }
//                 if (v === "error" || v === "failed") {
//                     return <Tooltip title={row.reason || row.error}><Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 11 }}>❌ Error</Tag></Tooltip>;
//                 }
//                 return <Tag color="default">{v || "Unknown"}</Tag>;
//             },
//         },
//         {
//             title: "Company ID",
//             dataIndex: "companyId",
//             width: 130,
//             render: v => v
//                 ? <span style={{ fontFamily: "monospace", fontSize: 11, color: T.blue.dark }}>{v}</span>
//                 : <span style={{ color: "#D1D5DB" }}>—</span>,
//         },
//         {
//             title: "Note",
//             dataIndex: "reason",
//             ellipsis: true,
//             render: (v, row) => (v || row.error)
//                 ? <span style={{
//                     color: (row.status === "error" || row.status === "failed") ? T.red.text : T.amber.dark,
//                     fontSize: 11,
//                 }}>{v || row.error}</span>
//                 : "—",
//         },
//     ];

//     return (
//         <div>
//             {/* ── TOP BANNER ── */}
//             <div style={{
//                 marginBottom: 20,
//                 padding: "20px 24px",
//                 background: allSkipped ? T.amber.bg : allSuccess ? T.green.bg : T.emerald.bg,
//                 border: `2px solid ${allSkipped ? T.amber.border : allSuccess ? T.green.border : T.emerald.border}`,
//                 borderRadius: T.radius.lg,
//             }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
//                     <div style={{ fontSize: 48, lineHeight: 1 }}>
//                         {allSkipped ? "⚠️" : allSuccess ? "🎉" : hasErrors ? "⚠️" : "✅"}
//                     </div>
//                     <div style={{ flex: 1 }}>
//                         <div style={{
//                             fontSize: 18,
//                             fontWeight: 800,
//                             color: allSkipped ? T.amber.dark : allSuccess ? T.green.dark : T.emerald.dark,
//                             marginBottom: 4,
//                         }}>
//                             {allSkipped
//                                 ? `📌 All ${total} companies already exist!`
//                                 : allSuccess
//                                     ? `🎉 ${created} companies successfully import ho gayi!`
//                                     : `${created} created · ${skipped} skipped · ${errors} errors`}
//                         </div>
//                         <div style={{ fontSize: 13, color: "#6B7280" }}>
//                             {allSkipped && "All companies already exist in the database, so none were created."}
//                             {skipped > 0 && !allSkipped && `${skipped} records already exist the — safely skip ho gayi.`}
//                             {errors > 0 && `${errors} records mein error tha — niche detail dekho.`}
//                             {created > 0 && !allSkipped && `${created} nayi companies add ho gayi.`}
//                         </div>
//                     </div>
//                     <div style={{
//                         display: "flex",
//                         gap: 12,
//                         padding: "8px 16px",
//                         background: "rgba(255,255,255,0.7)",
//                         borderRadius: T.radius.md,
//                         border: "1px solid rgba(0,0,0,0.05)"
//                     }}>
//                         <div><strong>Total:</strong> {total}</div>
//                         <div><strong style={{ color: T.green.text }}>✅ Created:</strong> {created}</div>
//                         <div><strong style={{ color: T.amber.text }}>⏭️ Skipped:</strong> {skipped}</div>
//                         <div><strong style={{ color: T.red.text }}>❌ Errors:</strong> {errors}</div>
//                     </div>
//                 </div>
//             </div>

//             {/* ── STATS CARDS ── */}
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
//                 {cards.map(({ label, value, color, icon, desc }) => (
//                     <div key={label} style={{
//                         padding: "16px 12px",
//                         textAlign: "center",
//                         background: color.bg,
//                         border: `2px solid ${color.border}`,
//                         borderRadius: T.radius.lg,
//                         boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
//                     }}>
//                         <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
//                         <div style={{
//                             fontSize: 32,
//                             fontWeight: 800,
//                             color: color.text,
//                             lineHeight: 1.2,
//                         }}>
//                             {value.toLocaleString()}
//                         </div>
//                         <div style={{ fontSize: 13, fontWeight: 700, color: color.dark, marginTop: 4 }}>{label}</div>
//                         <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
//                     </div>
//                 ))}
//             </div>

//             {/* ── SKIPPED BANNER ── */}
//             {skipped > 0 && (
//                 <div style={{
//                     marginBottom: 10,
//                     padding: "12px 16px",
//                     background: T.amber.bg,
//                     border: `2px solid ${T.amber.border}`,
//                     borderRadius: T.radius.md,
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 10,
//                 }}>
//                     <div style={{ fontSize: 24 }}>⏭️</div>
//                     <div>
//                         <div style={{ fontSize: 14, color: T.amber.dark, fontWeight: 700 }}>
//                             {skipped} duplicate/skip {skipped !== 1 ? "records" : "record"} — company already exist thi
//                         </div>
//                         {skipped === total && (
//                             <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
//                                 ⚠️ Sab companies pehle se exist karti hain! Koi nayi nahi bani.
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             )}

//             {/* ── ERROR BANNER ── */}
//             {errors > 0 && (
//                 <div style={{
//                     marginBottom: 10,
//                     padding: "12px 16px",
//                     background: T.red.bg,
//                     border: `2px solid ${T.red.border}`,
//                     borderRadius: T.radius.md,
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 10,
//                 }}>
//                     <div style={{ fontSize: 24 }}>❌</div>
//                     <div>
//                         <div style={{ fontSize: 14, color: T.red.dark, fontWeight: 700 }}>
//                             {errors} record{errors !== 1 ? "s" : ""} fail hua — tag pe hover karo detail ke liye
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* ── DETAILED TABLE ── */}
//             {results.length > 0 ? (
//                 <div>
//                     <div style={{
//                         marginBottom: 10,
//                         padding: "8px 12px",
//                         background: T.slate.bg,
//                         borderRadius: T.radius.md,
//                         display: "flex",
//                         justifyContent: "space-between",
//                     }}>
//                         <span style={{ fontSize: 12, fontWeight: 600, color: T.slate.dark }}>
//                             📋 Detailed Results ({results.length} rows)
//                         </span>
//                         <span style={{ fontSize: 11, color: "#6B7280" }}>
//                             {results.filter(r => r.status === "success" || r.status === "created" || r.status === "imported").length} created ·
//                             {results.filter(r => r.status === "skipped" || r.status === "duplicate").length} skipped ·
//                             {results.filter(r => r.status === "error" || r.status === "failed").length} errors
//                         </span>
//                     </div>
//                     <Table
//                         dataSource={results}
//                         rowKey={(r, i) => `${r.rowIndex || i}_${r.companyName}_${i}`}
//                         columns={tableColumns}
//                         size="small"
//                         pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `${t} rows` }}
//                         scroll={{ x: 750 }}
//                         rowClassName={r => {
//                             const status = r.status || '';
//                             if (status === "error" || status === "failed") return "row-error";
//                             if (status === "skipped" || status === "duplicate") return "row-skipped";
//                             return "";
//                         }}
//                         style={{ fontSize: 12 }}
//                     />
//                 </div>
//             ) : (
//                 <Alert
//                     type="info"
//                     message="No detailed results available"
//                     description="The server did not return per-row results. The summary above still shows the totals."
//                     style={{ marginTop: 10 }}
//                 />
//             )}

//             <style>{`
//                 .row-error td { background: ${T.red.bg} !important; }
//                 .row-skipped td { background: ${T.amber.bg} !important; }
//                 .ant-table-row:hover td { opacity: 0.85; }
//             `}</style>
//         </div>
//     );
// }

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — Result (COMPLETELY REWRITTEN)
// ════════════════════════════════════════════════════════════════════════════════
function StepResult({ results, rawResponse, error }) {
    // Debug - Check what we received
    console.log("🔍 StepResult Props:", { results, rawResponse, error });

    if (error) {
        return (
            <div style={{ padding: "24px 0" }}>
                <Alert
                    type="error"
                    showIcon
                    message="Import Failed"
                    description={typeof error === "string" ? error : JSON.stringify(error)}
                    style={{ borderRadius: T.radius.md }}
                />
            </div>
        );
    }

    // If no data yet
    if (!rawResponse) {
        return (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: "#6B7280" }}>Loading results...</div>
            </div>
        );
    }

    // ── Stats from backend ──
    const total = rawResponse?.totalRows || 0;
    const created = rawResponse?.totalImported || 0;
    const skipped = rawResponse?.totalSkipped || 0;
    const errors = rawResponse?.totalFailed || 0;

    const allSkipped = created === 0 && skipped > 0 && errors === 0;
    const allSuccess = created > 0 && skipped === 0 && errors === 0;
    const hasErrors = errors > 0;
    const hasSomeCreated = created > 0;

    // ── Prepare table data from results ──
    const tableData = results.length > 0 ? results : [];

    // ── Summary Cards ──
    const cards = [
        { label: "Total Sent", value: total, color: T.blue, icon: "📋", desc: "rows bheje gaye" },
        { label: "Created", value: created, color: created > 0 ? T.green : T.gray, icon: "✅", desc: "nayi companies bani" },
        { label: "Skipped", value: skipped, color: skipped > 0 ? T.amber : T.gray, icon: "⏭️", desc: "already exist" },
        { label: "Errors", value: errors, color: errors > 0 ? T.red : T.gray, icon: "❌", desc: "failed records" },
    ];

    // ── Table Columns ──
    const tableColumns = [
        {
            title: "Sheet",
            dataIndex: "sheetName",
            width: 100,
            render: v => v ? <Tag style={{ fontSize: 10 }}>{v}</Tag> : "—",
        },
        {
            title: "#",
            dataIndex: "rowIndex",
            width: 60,
            render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span>,
        },
        {
            title: "Company Name",
            dataIndex: "companyName",
            width: 200,
            render: v => <span style={{ fontWeight: 600, fontSize: 12 }}>{v || "—"}</span>,
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 130,
            fixed: "right",
            render: (v, row) => {
                const status = v || row.status || "";
                if (status === "success" || status === "created" || status === "imported") {
                    return <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11 }}>✅ Created</Tag>;
                }
                if (status === "skipped") {
                    return <Tooltip title={row.reason || "Already exists"}><Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 11 }}>⏭️ Skipped</Tag></Tooltip>;
                }
                if (status === "duplicate") {
                    return <Tooltip title={row.reason}><Tag icon={<WarningOutlined />} color="orange" style={{ fontSize: 11 }}>🔄 Duplicate</Tag></Tooltip>;
                }
                if (status === "error" || status === "failed") {
                    return <Tooltip title={row.reason || row.error}><Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 11 }}>❌ Error</Tag></Tooltip>;
                }
                return <Tag color="default">{status || "Unknown"}</Tag>;
            },
        },
        {
            title: "Company ID",
            dataIndex: "companyId",
            width: 180,
            render: v => v
                ? <span style={{ fontFamily: "monospace", fontSize: 11, color: T.blue.dark }}>{v}</span>
                : <span style={{ color: "#D1D5DB" }}>—</span>,
        },
        {
            title: "Note",
            dataIndex: "reason",
            ellipsis: true,
            render: (v, row) => {
                const reason = v || row.reason || row.error || "";
                if (!reason) return "—";
                const isError = row.status === "error" || row.status === "failed";
                return <span style={{
                    color: isError ? T.red.text : T.amber.dark,
                    fontSize: 11,
                }}>{reason}</span>;
            },
        },
    ];

    return (
        <div>
            {/* ── TOP BANNER ── */}
            <div style={{
                marginBottom: 20,
                padding: "20px 24px",
                background: allSkipped ? T.amber.bg : allSuccess ? T.green.bg : hasSomeCreated ? T.emerald.bg : T.blue.bg,
                border: `2px solid ${allSkipped ? T.amber.border : allSuccess ? T.green.border : hasSomeCreated ? T.emerald.border : T.blue.border}`,
                borderRadius: T.radius.lg,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 48, lineHeight: 1 }}>
                        {allSkipped ? "⚠️" : allSuccess ? "🎉" : hasErrors ? "⚠️" : hasSomeCreated ? "✅" : "📊"}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: allSkipped ? T.amber.dark : allSuccess ? T.green.dark : hasSomeCreated ? T.emerald.dark : T.blue.dark,
                            marginBottom: 4,
                        }}>
                            {allSkipped
                                ? `📌 All ${total} companies already exist!`
                                : allSuccess
                                    ? `🎉 ${created} companies successfully imported!`
                                    : hasErrors && created === 0 && skipped === 0
                                        ? `❌ All ${total} records failed!`
                                        : `${created} created · ${skipped} skipped · ${errors} errors`}
                        </div>
                        <div style={{ fontSize: 13, color: "#6B7280" }}>
                            {allSkipped && "All companies already exist in the database, so none were created."}
                            {skipped > 0 && !allSkipped && `${skipped} records already exist — safely skipped.`}
                            {errors > 0 && `${errors} records failed — check details below.`}
                            {created > 0 && !allSkipped && `${created} new companies added.`}
                        </div>
                    </div>
                    <div style={{
                        display: "flex",
                        gap: 12,
                        padding: "8px 16px",
                        background: "rgba(255,255,255,0.7)",
                        borderRadius: T.radius.md,
                        border: "1px solid rgba(0,0,0,0.05)",
                        flexWrap: "wrap",
                    }}>
                        <div><strong>Total:</strong> {total}</div>
                        <div><strong style={{ color: T.green.text }}>✅ Created:</strong> {created}</div>
                        <div><strong style={{ color: T.amber.text }}>⏭️ Skipped:</strong> {skipped}</div>
                        <div><strong style={{ color: T.red.text }}>❌ Errors:</strong> {errors}</div>
                    </div>
                </div>
            </div>

            {/* ── STATS CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                {cards.map(({ label, value, color, icon, desc }) => (
                    <div key={label} style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        background: color.bg,
                        border: `2px solid ${color.border}`,
                        borderRadius: T.radius.lg,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                        <div style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: color.text,
                            lineHeight: 1.2,
                        }}>
                            {value.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: color.dark, marginTop: 4 }}>{label}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
                    </div>
                ))}
            </div>

            {/* ── SKIPPED BANNER ── */}
            {skipped > 0 && (
                <div style={{
                    marginBottom: 10,
                    padding: "12px 16px",
                    background: T.amber.bg,
                    border: `2px solid ${T.amber.border}`,
                    borderRadius: T.radius.md,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}>
                    <div style={{ fontSize: 24 }}>⏭️</div>
                    <div>
                        <div style={{ fontSize: 14, color: T.amber.dark, fontWeight: 700 }}>
                            {skipped} {skipped !== 1 ? "records" : "record"} skipped — company already exists
                        </div>
                        {skipped === total && (
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                                ⚠️ All companies already exist! No new companies created.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── CREATED BANNER ── */}
            {created > 0 && (
                <div style={{
                    marginBottom: 10,
                    padding: "12px 16px",
                    background: T.green.bg,
                    border: `2px solid ${T.green.border}`,
                    borderRadius: T.radius.md,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}>
                    <div style={{ fontSize: 24 }}>✅</div>
                    <div>
                        <div style={{ fontSize: 14, color: T.green.dark, fontWeight: 700 }}>
                            {created} {created !== 1 ? "companies" : "company"} created successfully!
                        </div>
                    </div>
                </div>
            )}

            {/* ── ERROR BANNER ── */}
            {errors > 0 && (
                <div style={{
                    marginBottom: 10,
                    padding: "12px 16px",
                    background: T.red.bg,
                    border: `2px solid ${T.red.border}`,
                    borderRadius: T.radius.md,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}>
                    <div style={{ fontSize: 24 }}>❌</div>
                    <div>
                        <div style={{ fontSize: 14, color: T.red.dark, fontWeight: 700 }}>
                            {errors} {errors !== 1 ? "records" : "record"} failed — hover on status tag for details
                        </div>
                    </div>
                </div>
            )}

            {/* ── DETAILED TABLE ── */}
            {tableData.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                    <div style={{
                        marginBottom: 10,
                        padding: "8px 12px",
                        background: T.slate.bg,
                        borderRadius: T.radius.md,
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.slate.dark }}>
                            📋 Detailed Results ({tableData.length} rows)
                        </span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>
                            {tableData.filter(r => r.status === "success" || r.status === "created" || r.status === "imported").length} created ·
                            {tableData.filter(r => r.status === "skipped" || r.status === "duplicate").length} skipped ·
                            {tableData.filter(r => r.status === "error" || r.status === "failed").length} errors
                        </span>
                    </div>
                    <Table
                        dataSource={tableData}
                        rowKey={(r, i) => `${r.rowIndex || i}_${r.companyName || i}_${i}`}
                        columns={tableColumns}
                        size="small"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: t => `${t} rows`,
                            pageSizeOptions: ['10', '20', '50', '100']
                        }}
                        scroll={{ x: 750 }}
                        rowClassName={r => {
                            const status = r.status || '';
                            if (status === "error" || status === "failed") return "row-error";
                            if (status === "skipped" || status === "duplicate") return "row-skipped";
                            if (status === "success" || status === "created" || status === "imported") return "row-success";
                            return "";
                        }}
                        style={{ fontSize: 12 }}
                    />
                </div>
            ) : (
                <Alert
                    type="info"
                    message="No detailed results available"
                    description="The server did not return per-row results. The summary above still shows the totals."
                    style={{ marginTop: 10 }}
                />
            )}

            <style>{`
                .row-error td { background: ${T.red.bg} !important; }
                .row-skipped td { background: ${T.amber.bg} !important; }
                .row-success td { background: ${T.green.bg} !important; }
                .ant-table-row:hover td { opacity: 0.85; }
            `}</style>
        </div>
    );
}
// ════════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ════════════════════════════════════════════════════════════════════════════════
export default function ImportCompanyWithFieldMapper({ open, onCancel, onImportSuccess }) {
    const [subStep, setSubStep] = useState("upload");
    const [parsedData, setParsedData] = useState(null);
    const [mapping, setMapping] = useState({});
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [rawResponse, setRawResponse] = useState(null);
    const [resultError, setResultError] = useState(null);

    const reset = () => {
        setSubStep("upload");
        setParsedData(null);
        setMapping({});
        setSelectedKeys([]);
        setSubmitting(false);
        setImportProgress({ done: 0, total: 0 });
        setResults([]);
        setRawResponse(null);
        setResultError(null);
    };

    const handleClose = () => { reset(); onCancel(); };

    const handleParsed = useCallback((data) => {
        setParsedData(data);
        setMapping(autoDetectMapping(data.columns));
        setSubStep("mapping");
    }, []);

    const mappedRows = useMemo(() => {
        if (!parsedData) return [];
        return applyMapping(parsedData.rows, mapping);
    }, [parsedData, mapping]);

    const handleGoToPreview = () => {
        const validKeys = mappedRows
            .filter(r => r.CompanyName?.trim())
            .map(r => r._key);
        setSelectedKeys(validKeys);
        setSubStep("preview");
    };

    const requiredMapped = BACKEND_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

    const rowsToImport = useMemo(
        () => mappedRows.filter(r => selectedKeys.includes(r._key)),
        [mappedRows, selectedKeys]
    );
    const validRowsToImport = rowsToImport.filter(r => r.CompanyName?.trim());



    const handleSubmit = async () => {
        if (!validRowsToImport.length) return;
        setSubmitting(true);
        setImportProgress({ done: 0, total: validRowsToImport.length });

        try {
            // const data = await uploadBulk(validRowsToImport, parsedData.fileName);
            const data = await uploadBulk(validRowsToImport, parsedData.fileName, mapping);
            console.log("🚀 Backend Response:", data);

            const allResults = [
                ...(data.imported || []).map(c => ({
                    rowIndex: c.rowIndex ?? c.rowNumber,
                    sheetName: c.sheetName || "",
                    companyName: c.companyName || c.CompanyName || "",
                    companyId: c.id || c.companyId,
                    status: "success",
                })),
                ...(data.skipped || []).map(s => ({
                    rowIndex: s.rowIndex ?? s.rowNumber,
                    sheetName: s.sheetName || "",
                    companyName: s.companyName || s.CompanyName || "",
                    status: "skipped",
                    reason: s.reason,
                })),
                ...(data.duplicates || []).map(d => ({
                    rowIndex: d.rowIndex ?? d.rowNumber,
                    sheetName: d.sheetName || "",
                    companyName: d.companyName || d.CompanyName || "",
                    status: "duplicate",
                    reason: d.reason || "Duplicate entry",
                })),
                ...(data.failed || []).map(f => ({
                    rowIndex: f.rowIndex ?? f.rowNumber,
                    sheetName: f.sheetName || "",
                    companyName: f.companyName || f.CompanyName || "",
                    status: "error",
                    reason: f.error || f.reason,
                })),
            ];

            console.log("📋 All Results:", allResults);

            // ✅ Sab ek saath set karo, FINALLY se bahar
            setRawResponse(data);
            setResults(allResults);
            setImportProgress({ done: validRowsToImport.length, total: validRowsToImport.length });
            setSubmitting(false);        // ← finally se yahan le aao
            setSubStep("result");        // ← yeh LAST mein hona chahiye
            // onImportSuccess?.(data);

        } catch (err) {
            console.error("❌ Upload Error:", err);
            setResultError(extractErrorMessage(err));
            setSubmitting(false);
            setSubStep("result");
        }
        // finally block hatao ya sirf cleanup ke liye rakho
    };

    const STEPS = [
        { title: "Upload", description: "Excel file" },
        { title: "Map Fields", description: "Column mapping" },
        { title: "Preview", description: "Select records" },
        { title: "Result", description: "Import summary" },
    ];
    const stepIdx = { upload: 0, mapping: 1, preview: 2, result: 3 }[subStep] ?? 0;

    const subtitle = {
        upload: "Upload an Excel file (.xlsx / .xls)",
        mapping: parsedData
            ? `${parsedData.columns.length} columns → ${BACKEND_FIELDS.length} backend fields`
            : "",
        preview: `${mappedRows.length} rows — select the rows to import`,
        result: resultError
            ? "Import failed"
            : rawResponse
                ? (() => {
                    const c = rawResponse?.totalImported ?? 0;
                    const s = rawResponse?.totalSkipped ?? 0;
                    const e = rawResponse?.totalFailed ?? 0;
                    return `${c} created · ${s} skipped · ${e} errors`;
                })()
                : "",
    }[subStep] || "";

    const modalWidth =
        subStep === "result" ? 980 :
            subStep === "preview" ? 1060 :
                subStep === "mapping" ? 900 : 600;

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
                disabled={!requiredMapped}
                onClick={handleGoToPreview}
                style={requiredMapped ? { background: T.blue.text, borderColor: T.blue.text } : {}}
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
                disabled={!requiredMapped || validRowsToImport.length === 0}
                onClick={handleSubmit}
                style={{ background: T.green.text, borderColor: T.green.text }}
            >
                Import {validRowsToImport.length} Record{validRowsToImport.length !== 1 ? "s" : ""}
            </Button>,
        ];
        return [
            <Button key="more" icon={<ReloadOutlined />} onClick={reset}>Import Another</Button>,
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
                            Import Companies
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
                body: { padding: "16px 24px 8px", maxHeight: "82vh", overflowY: "auto", overflowX: "hidden" },
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
                <StepPreview
                    mappedRows={mappedRows}
                    mapping={mapping}
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                    submitting={submitting}
                    importProgress={importProgress}
                />
            )}
            {subStep === "result" && (
                <StepResult results={results} rawResponse={rawResponse} error={resultError} />
            )}
        </Modal>
    );
}