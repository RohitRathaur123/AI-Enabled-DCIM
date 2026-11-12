import { useState, useMemo, useCallback } from "react";
import React from "react";
import {
    Modal, Button, Steps, Upload, Alert,
    Table, Divider, Tag, Select, Progress, Tooltip,
} from "antd";
import {
    FileExcelOutlined, CheckCircleOutlined, WarningOutlined,
    CloseCircleOutlined, ReloadOutlined, ImportOutlined,
    ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined,
    EyeOutlined, LaptopOutlined, ThunderboltOutlined,
    BuildOutlined, AppstoreOutlined, DatabaseOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { axiosdevice } from "../../config";

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
    teal: { bg: "#F0FDFA", border: "#99F6E4", text: "#0D9488", dark: "#0F766E" },
    orange: { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C", dark: "#C2410C" },
    radius: { sm: 6, md: 8, lg: 12, xl: 16 },
};

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════
const FILE_TYPES = {
    excel: {
        key: "excel", label: "Excel", accept: ".xlsx,.xls",
        extensions: [".xlsx", ".xls"], icon: "📊", color: T.emerald,
        description: "Bulk device detail import via Excel spreadsheet",
    },
    // dxf: {
    //     key: "dxf", label: "DXF", accept: ".dxf",
    //     extensions: [".dxf"], icon: "📐", color: T.teal,
    //     description: "Import device layout/metadata from AutoCAD DXF drawing file",
    // },

    csv: {
        key: "csv", label: "CSV", accept: ".csv",
        extensions: [".csv"], icon: "📄", color: T.teal,
        description: "Bulk device detail import via CSV file",
    },
};

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

const BACKEND_COL_ORDER = BACKEND_FIELDS.map(f => f.key);

const STRING_FORCE_KEYS = new Set([
    "IMEI", "SerialNumber", "MACAddress", "TagNumber", "SIMNumber", "IPAddress",
]);

// ════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════
function extractErrorMessage(err) {
    if (typeof err === "string" && err.trim()) return err;
    if (err?.response?.data?.message) return String(err.response.data.message);
    if (err?.response?.data?.title) return String(err.response.data.title);
    if (err?.message) return String(err.message);
    if (err?.errors) return Object.values(err.errors).flat().join(" | ");
    try { return JSON.stringify(err); } catch { /**/ }
    return "Upload failed";
}

function cellToString(key, rawVal) {
    if (rawVal === null || rawVal === undefined || rawVal === "") return "";
    if (rawVal instanceof Date) {
        const y = rawVal.getFullYear();
        const m = String(rawVal.getMonth() + 1).padStart(2, "0");
        const d = String(rawVal.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    if (typeof rawVal === "object") {
        if ("w" in rawVal) return String(rawVal.w).trim();
        return String(rawVal).trim();
    }
    if (typeof rawVal === "number") {
        if (STRING_FORCE_KEYS.has(key)) {
            return Number.isInteger(rawVal) ? BigInt(rawVal).toString() : rawVal.toFixed(0);
        }
        return String(rawVal);
    }
    return String(rawVal).trim();
}

function applyMapping(rows, mapping) {
    return rows.map(row => {
        const rec = { _key: row._key, _rowIndex: row._rowIndex, _sheetName: row._sheetName };
        BACKEND_FIELDS.forEach(({ key }) => {
            const sourceCol = mapping[key];
            rec[key] = cellToString(key, sourceCol != null ? row._raw[sourceCol] : undefined);
        });
        return rec;
    });
}

function buildAutoMapping(columns) {
    const normalize = s => s.toLowerCase().replace(/[\s_\-\/\(\)\.]/g, "");
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
// SUBMIT
// ════════════════════════════════════════════════════════════════════════════════
// async function submitDeviceDetailRecords(fileType, mappedRows) {
//     const aoa = [
//         BACKEND_COL_ORDER,
//         ...mappedRows.map(row => BACKEND_COL_ORDER.map(key => row[key] ?? "")),
//     ];
//     const ws = XLSX.utils.aoa_to_sheet(aoa);

//     const stringForceCols = BACKEND_COL_ORDER
//         .map((key, idx) => ({ key, idx }))
//         .filter(({ key }) => STRING_FORCE_KEYS.has(key));

//     for (let r = 1; r < aoa.length; r++) {
//         stringForceCols.forEach(({ idx }) => {
//             const addr = XLSX.utils.encode_cell({ r, c: idx });
//             if (ws[addr]) { ws[addr].t = "s"; ws[addr].v = String(ws[addr].v ?? ""); delete ws[addr].z; }
//         });
//     }

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "DeviceDetails");
//     const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
//     const f = new File([blob], "device_import.xlsx", { type: blob.type });

//     const fd = new FormData();
//     fd.append("File", f, f.name);

//     const url = fileType === "dxf" ? "/DeviceDetail/import-devicedetail?source=dxf" : "/DeviceDetail/import-devicedetail";
//     const res = await axiosdevice.post(url, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//         timeout: 1200000,
//     });
//     return res.data;
// }


async function submitDeviceDetailRecords(fileType, mappedRows) {
    const aoa = [
        BACKEND_COL_ORDER,
        ...mappedRows.map(row => BACKEND_COL_ORDER.map(key => row[key] ?? "")),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const stringForceCols = BACKEND_COL_ORDER
        .map((key, idx) => ({ key, idx }))
        .filter(({ key }) => STRING_FORCE_KEYS.has(key));

    for (let r = 1; r < aoa.length; r++) {
        stringForceCols.forEach(({ idx }) => {
            const addr = XLSX.utils.encode_cell({ r, c: idx });
            if (ws[addr]) { ws[addr].t = "s"; ws[addr].v = String(ws[addr].v ?? ""); delete ws[addr].z; }
        });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DeviceDetails");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const f = new File([blob], "device_import.xlsx", { type: blob.type });

    const fd = new FormData();
    fd.append("File", f, f.name);

    // ✅ dxf query param hataya — dono file types ab same endpoint use karte hain
    // kyunki hum internally hamesha xlsx bana kar bhejte hain
    const res = await axiosdevice.post("/DeviceDetail/import-devicedetail", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 1200000,
    });
    return res.data;
}

// ════════════════════════════════════════════════════════════════════════════════
// PARSERS
// ════════════════════════════════════════════════════════════════════════════════
const yieldToUI = () => new Promise(r => setTimeout(r, 0));

async function parseExcel(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                onProgress?.(10); await yieldToUI();
                const wb = XLSX.read(new Uint8Array(e.target.result), {
                    type: "array", raw: true, cellDates: true, cellNF: false, cellHTML: false,
                });
                onProgress?.(30); await yieldToUI();

                const allCols = new Set();
                const allRows = [];
                let globalIdx = 0;
                const totalSheets = wb.SheetNames.length;

                for (let si = 0; si < totalSheets; si++) {
                    const sheetName = wb.SheetNames[si];
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: "" });
                    const BATCH = 500;
                    for (let bi = 0; bi < rows.length; bi += BATCH) {
                        rows.slice(bi, bi + BATCH).forEach(raw => {
                            Object.keys(raw).forEach(k => allCols.add(k));
                            allRows.push({ _key: ++globalIdx, _rowIndex: globalIdx + 1, _sheetName: sheetName, _raw: raw });
                        });
                        const pct = 30 + Math.round(((si / totalSheets) + (bi / Math.max(rows.length, 1) / totalSheets)) * 60);
                        onProgress?.(Math.min(pct, 99)); await yieldToUI();
                    }
                }
                if (!allRows.length) { reject(new Error("No data rows found.")); return; }
                onProgress?.(100);
                resolve({ columns: [...allCols], rows: allRows, sheetNames: wb.SheetNames });
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsArrayBuffer(file);
    });
}

// async function parseDXF(file, onProgress) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = async (e) => {
//             try {
//                 onProgress?.(5); await yieldToUI();
//                 const lines = e.target.result.split(/\r?\n/);
//                 const tokens = [];
//                 const total = lines.length;
//                 for (let i = 0; i + 1 < total; i += 2) {
//                     const code = parseInt(lines[i].trim(), 10);
//                     const val = (lines[i + 1] ?? "").trim();
//                     if (!isNaN(code)) tokens.push([code, val]);
//                     if (i % 10000 === 0) { onProgress?.(15 + Math.round((i / total) * 30)); await yieldToUI(); }
//                 }
//                 onProgress?.(45); await yieldToUI();
//                 let t = 0;
//                 while (t < tokens.length) {
//                     if (tokens[t][0] === 2 && tokens[t][1] === "ENTITIES") { t++; break; }
//                     t++;
//                 }
//                 if (t >= tokens.length) { reject(new Error("ENTITIES section not found.")); return; }
//                 onProgress?.(50); await yieldToUI();
//                 const allRows = [], allCols = new Set(["_entityType", "_layer", "_handle", "_blockName", "_x", "_y"]);
//                 let globalIdx = 0, batchCount = 0;
//                 const readFields = (obj) => {
//                     t++;
//                     while (t < tokens.length) {
//                         const [c, v] = tokens[t];
//                         if (c === 0) break;
//                         if (c === 5) obj._handle = v;
//                         else if (c === 8) obj._layer = v;
//                         else if (c === 2) obj._blockName = v;
//                         else if (c === 1) obj._textValue = v;
//                         else if (c === 10) obj._x = v;
//                         else if (c === 20) obj._y = v;
//                         t++;
//                     }
//                 };
//                 while (t < tokens.length) {
//                     const [code, val] = tokens[t];
//                     if (code === 0 && val === "ENDSEC") break;
//                     if (code !== 0) { t++; continue; }
//                     if (val === "INSERT") {
//                         const insert = { _entityType: "INSERT" };
//                         readFields(insert);
//                         const attribs = {};
//                         while (t < tokens.length && tokens[t][0] === 0 && tokens[t][1] === "ATTRIB") {
//                             t++;
//                             let tag = "", v2 = "";
//                             while (t < tokens.length) {
//                                 const [c, v] = tokens[t];
//                                 if (c === 0) break;
//                                 if (c === 2) tag = v; if (c === 1) v2 = v; t++;
//                             }
//                             if (tag) { attribs[tag] = v2; allCols.add(tag); }
//                         }
//                         if (t < tokens.length && tokens[t][0] === 0 && tokens[t][1] === "SEQEND")
//                             while (t < tokens.length && tokens[t][0] !== 0) t++;
//                         allRows.push({ _key: ++globalIdx, _rowIndex: globalIdx, _sheetName: "DXF", _raw: { ...insert, ...attribs } });
//                     } else if (val === "TEXT" || val === "MTEXT") {
//                         const ent = { _entityType: val };
//                         readFields(ent);
//                         allRows.push({ _key: ++globalIdx, _rowIndex: globalIdx, _sheetName: "DXF", _raw: ent });
//                     } else { t++; while (t < tokens.length && tokens[t][0] !== 0) t++; }
//                     if (++batchCount % 200 === 0) { onProgress?.(50 + Math.min(45, Math.round((batchCount / 2000) * 45))); await yieldToUI(); }
//                 }
//                 if (!allRows.length) { reject(new Error("No INSERT or TEXT entities found.")); return; }
//                 onProgress?.(100);
//                 resolve({ columns: [...allCols], rows: allRows, sheetNames: ["DXF"] });
//             } catch (err) { reject(err); }
//         };
//         reader.onerror = () => reject(new Error("Failed to read DXF file."));
//         reader.readAsText(file, "utf-8");
//     });
// }


async function parseCSV(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                onProgress?.(10); await yieldToUI();
                const wb = XLSX.read(e.target.result, { type: "string", raw: true, cellDates: true });
                onProgress?.(40); await yieldToUI();

                const allCols = new Set();
                const allRows = [];
                let globalIdx = 0;
                const sheetName = wb.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: "" });

                const BATCH = 500;
                for (let bi = 0; bi < rows.length; bi += BATCH) {
                    rows.slice(bi, bi + BATCH).forEach(raw => {
                        Object.keys(raw).forEach(k => allCols.add(k));
                        allRows.push({ _key: ++globalIdx, _rowIndex: globalIdx + 1, _sheetName: sheetName, _raw: raw });
                    });
                    onProgress?.(Math.min(40 + Math.round((bi / Math.max(rows.length, 1)) * 55), 99));
                    await yieldToUI();
                }

                if (!allRows.length) { reject(new Error("No data rows found in CSV.")); return; }
                onProgress?.(100);
                resolve({ columns: [...allCols], rows: allRows, sheetNames: wb.SheetNames });
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("Failed to read CSV file."));
        reader.readAsText(file, "UTF-8");
    });
}

async function parseFile(file, fileType, onProgress) {
    if (fileType === "excel") return parseExcel(file, onProgress);
    // if (fileType === "dxf") return parseDXF(file, onProgress);
    if (fileType === "csv") return parseCSV(file, onProgress);
    throw new Error("Unknown file type: " + fileType);
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 0 — File Type Selector
// ════════════════════════════════════════════════════════════════════════════════
function StepSelectType({ selectedType, onSelect }) {
    return (
        <div style={{ padding: "12px 0 8px" }}>
            <div style={{ marginBottom: 20, padding: "11px 16px", background: T.blue.bg, border: `1px solid ${T.blue.border}`, borderRadius: T.radius.md, fontSize: 12, color: T.blue.dark, lineHeight: 1.7 }}>
                <strong>Device Detail Bulk Import</strong> — Excel or DXF file  multiple device records added.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {Object.values(FILE_TYPES).map(ft => {
                    const isSel = selectedType === ft.key;
                    return (
                        <button key={ft.key} onClick={() => onSelect(ft.key)} style={{ border: `2px solid ${isSel ? ft.color.text : ft.color.border}`, borderRadius: T.radius.xl, background: isSel ? ft.color.bg : "#fff", padding: "24px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", outline: "none", boxShadow: isSel ? `0 0 0 3px ${ft.color.border}` : "none", position: "relative" }}>
                            {isSel && (
                                <div style={{ position: "absolute", top: 12, right: 14, width: 22, height: 22, borderRadius: "50%", background: ft.color.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CheckCircleOutlined style={{ color: "#fff", fontSize: 12 }} />
                                </div>
                            )}
                            <div style={{ fontSize: 38, marginBottom: 10, lineHeight: 1 }}>{ft.icon}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: isSel ? ft.color.dark : "#111827", marginBottom: 6 }}>{ft.label}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{ft.description}</div>
                            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {ft.extensions.map(ext => (
                                    <span key={ext} style={{ background: ft.color.bg, border: `1px solid ${ft.color.border}`, borderRadius: 4, padding: "2px 10px", fontSize: 11, fontFamily: "monospace", color: ft.color.dark }}>{ext}</span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", background: T.slate.bg, border: `1px solid ${T.slate.border}`, borderRadius: T.radius.md, fontSize: 11, color: T.slate.dark }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>📊 Backend field names — exact match = auto-map:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {BACKEND_FIELDS.map(f => (
                        <code key={f.key} style={{ fontSize: 10, background: "#fff", padding: "1px 6px", borderRadius: 3, border: "1px solid #E5E7EB", color: "#374151" }}>{f.key}</code>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — Upload
// ════════════════════════════════════════════════════════════════════════════════
function StepUpload({ fileType, onParsed }) {
    const [parsing, setParsing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [fileSize, setFileSize] = useState(null);
    const ft = FILE_TYPES[fileType];

    const handleFile = async (file) => {
        setError(null);
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!ft.extensions.includes(ext)) { setError(`Only ${ft.extensions.join(", ")} files accepted.`); return false; }
        setFileName(file.name);
        setFileSize((file.size / 1024 / 1024).toFixed(2));
        setParsing(true); setProgress(0);
        try {
            const parsed = await parseFile(file, fileType, (p) => setProgress(p));
            onParsed({ ...parsed, fileName: file.name });
        } catch (err) {
            setError(err?.message || "Failed to parse file.");
        } finally { setParsing(false); }
        return false;
    };
    const progressLabel = progress < 15 ? "Reading file…" : progress < 45 ? "Parsing…" : progress < 80 ? "Loading rows…" : progress < 100 ? "Finalising…" : "Done!";

    return (
        <div style={{ padding: "8px 0" }}>
            <div style={{ marginBottom: 14, padding: "10px 14px", background: ft.color.bg, border: `1px solid ${ft.color.border}`, borderRadius: T.radius.md, fontSize: 12, color: ft.color.dark, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{ft.icon}</span>
                <div>
                    <div style={{ fontWeight: 700 }}>Device Detail {ft.label} file upload here</div>
                    <div style={{ fontSize: 11, marginTop: 2, color: "#6B7280" }}>
                        {fileType === "excel" ? "All sheet data merge here · .xlsx / .xls" : "CSV file · comma-separated rows parse hongi"}
                    </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: ft.color.dark, background: "#fff", border: `1px solid ${ft.color.border}`, borderRadius: T.radius.sm, padding: "3px 8px" }}>
                    <ThunderboltOutlined /><span>IMEI-safe parser</span>
                </div>
            </div>
            <Upload.Dragger beforeUpload={handleFile} showUploadList={false} accept={ft.accept} disabled={parsing} style={{ borderRadius: T.radius.lg, borderColor: ft.color.border, background: ft.color.bg }}>
                <div style={{ padding: "40px 20px" }}>
                    {parsing ? (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>{ft.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: ft.color.dark, marginBottom: 4 }}>{progressLabel}</div>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 14 }}>{fileName} ({fileSize} MB)</div>
                            <div style={{ maxWidth: 320, margin: "0 auto" }}>
                                <Progress percent={progress} status={progress < 100 ? "active" : "success"} strokeColor={{ from: ft.color.text, to: ft.color.dark }} size="small" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: 50, marginBottom: 12 }}>{ft.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: ft.color.dark, marginBottom: 4 }}>Drop {ft.label} file here</div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>or <span style={{ color: ft.color.text, fontWeight: 600 }}>click to browse</span> — {ft.extensions.join(", ")}</div>
                            {fileName && (
                                <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${ft.color.border}`, borderRadius: T.radius.md, padding: "5px 14px" }}>
                                    <FileExcelOutlined style={{ color: ft.color.text }} />
                                    <span style={{ fontSize: 12, color: ft.color.dark, fontWeight: 500 }}>{fileName}</span>
                                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{fileSize} MB</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Upload.Dragger>
            {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12, borderRadius: T.radius.md }} />}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — Mapping
// ════════════════════════════════════════════════════════════════════════════════
function StepMapping({ parsedData, fileType, mapping, onMappingChange }) {
    const { columns, rows } = parsedData;
    const ft = FILE_TYPES[fileType];

    const sampleValue = useCallback((backendKey, sourceCol) => {
        if (!sourceCol) return "";
        const row = rows.find(r => { const v = r._raw[sourceCol]; return v !== null && v !== undefined && v !== ""; });
        if (!row) return "";
        const s = cellToString(backendKey, row._raw[sourceCol]);
        return s.length > 28 ? s.slice(0, 28) + "…" : s;
    }, [rows]);

    const usedColumns = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping]);
    const mappedCount = useMemo(() => BACKEND_FIELDS.filter(f => mapping[f.key]).length, [mapping]);

    return (
        <div style={{ padding: "4px 0" }}>
            <div style={{ marginBottom: 10, padding: "10px 14px", background: T.amber.bg, border: `1px solid ${T.amber.border}`, borderRadius: T.radius.md, fontSize: 12, color: T.amber.dark, lineHeight: 1.7 }}>
                ⚠️Only the columns assigned in the mapping step will be sent to the backend. Sample values are displayed in the converted format.
            </div>
            <div style={{ display: "flex", border: `1px solid ${T.gray.border}`, borderRadius: T.radius.lg, overflow: "hidden" }}>
                {/* LEFT */}
                <div style={{ flex: "0 0 245px", background: "#FAFAFA", borderRight: `1px solid ${T.gray.border}` }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`, background: T.blue.bg, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: T.blue.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>B</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.blue.dark }}>Backend Fields</span>
                        <span style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>{mappedCount}/{BACKEND_FIELDS.length}</span>
                    </div>
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{ padding: "9px 14px", borderBottom: `1px solid ${T.gray.border}`, background: mapping[field.key] ? "#fff" : "transparent", minHeight: 56 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                <Tag color={field.color} style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}>{field.label}</Tag>
                                {mapping[field.key] && <CheckCircleOutlined style={{ color: T.green.text, fontSize: 11, marginLeft: "auto" }} />}
                            </div>
                            <div style={{ fontSize: 9, color: "#9CA3AF", fontFamily: "monospace" }}>col{field.col} · {field.hint}</div>
                        </div>
                    ))}
                </div>
                {/* CENTER */}
                <div style={{ width: 34, background: "#F3F4F6", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ height: 47, borderBottom: `1px solid ${T.gray.border}`, width: "100%" }} />
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${T.gray.border}`, width: "100%" }}>
                            <SwapOutlined style={{ color: mapping[field.key] ? T.green.text : "#D1D5DB", fontSize: 11 }} />
                        </div>
                    ))}
                </div>
                {/* RIGHT */}
                <div style={{ flex: 1, background: "#FAFAFA", minWidth: 0 }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.gray.border}`, background: ft.color.bg, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{ft.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ft.color.dark }}>{ft.label} Columns</span>
                        <span style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>{columns.length} found</span>
                    </div>
                    {BACKEND_FIELDS.map(field => (
                        <div key={field.key} style={{ padding: "7px 10px", borderBottom: `1px solid ${T.gray.border}`, background: mapping[field.key] ? "#fff" : "transparent", minHeight: 56, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <Select
                                size="small" allowClear
                                placeholder={`Column for "${field.label}"`}
                                style={{ width: "100%", fontSize: 12 }}
                                value={mapping[field.key] || undefined}
                                onChange={val => onMappingChange({ ...mapping, [field.key]: val || null })}
                                options={columns.map(col => ({
                                    value: col,
                                    label: (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 500 }}>{col}</span>
                                            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>{sampleValue(field.key, col)}</span>
                                        </div>
                                    ),
                                    disabled: usedColumns.has(col) && mapping[field.key] !== col,
                                }))}
                            />
                            {mapping[field.key] && (
                                <div style={{ marginTop: 2, fontSize: 10, color: "#6B7280", fontFamily: "monospace", paddingLeft: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                    e.g. <span style={{ color: T.blue.dark }}>{sampleValue(field.key, mapping[field.key]) || "—"}</span>
                                    {STRING_FORCE_KEYS.has(field.key) && (
                                        <span style={{ fontSize: 9, background: T.purple.bg, color: T.purple.dark, border: `1px solid ${T.purple.border}`, borderRadius: 3, padding: "0 4px" }}>TEXT</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — Preview
// ════════════════════════════════════════════════════════════════════════════════
function StepPreview({ mappedRows, fileType, mapping, submitting }) {
    const ft = FILE_TYPES[fileType];
    const mappedFields = BACKEND_FIELDS.filter(f => mapping[f.key]);
    const columns = [
        { title: "#", dataIndex: "_rowIndex", width: 50, render: v => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{v}</span> },
        { title: "Sheet", dataIndex: "_sheetName", width: 75, render: v => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
        ...mappedFields.map(field => ({
            title: <Tag color={field.color} style={{ fontSize: 10, margin: 0 }}>{field.label}</Tag>,
            dataIndex: field.key, ellipsis: true,
            render: v => v
                ? <span style={{ fontSize: 12, fontFamily: STRING_FORCE_KEYS.has(field.key) ? "monospace" : "inherit" }}>{v}</span>
                : <span style={{ color: "#D1D5DB", fontSize: 11, fontStyle: "italic" }}>—</span>,
        })),
    ];
    return (
        <div>
            <div style={{ marginBottom: 14, padding: "10px 16px", background: ft.color.bg, border: `1px solid ${ft.color.border}`, borderRadius: T.radius.md, display: "flex", alignItems: "center", gap: 10 }}>
                <EyeOutlined style={{ color: ft.color.text }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: ft.color.dark }}>{mappedRows.length} records — exactly this data goes to backend </span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{mappedFields.length} fields</span>
            </div>
            {submitting && (
                <div style={{ marginBottom: 14, padding: "10px 16px", background: T.purple.bg, border: `1px solid ${T.purple.border}`, borderRadius: T.radius.md }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.purple.dark }}>Mapped Excel generate - submit…</span>
                </div>
            )}
            <Table dataSource={mappedRows} rowKey="_key" columns={columns} size="small"
                pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} rows` }}
                scroll={{ x: Math.max(900, mappedFields.length * 150) }} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — Result
// FIX: Backend C# returns PascalCase keys — DevicesImported, SkippedDevices etc.
// JSON serializer by default returns camelCase — dono handle karo
// ════════════════════════════════════════════════════════════════════════════════
function StepResult({ response, error, totalSentFromFrontend }) {
    const [skipTab, setSkipTab] = useState("all");

    if (error) {
        return (
            <div style={{ padding: "24px 0" }}>
                <Alert type="error" showIcon message="Import Failed"
                    description={typeof error === "string" ? error : JSON.stringify(error, null, 2)}
                    style={{ borderRadius: T.radius.md }} />
            </div>
        );
    }

    if (!response) return null;

    // ── FIX: Support both camelCase and PascalCase response keys ──────────────
    // .NET default JSON = camelCase, but some configs return PascalCase
    const devicesImported = response.devicesImported ?? response.DevicesImported ?? [];
    const skippedDevices = response.skippedDevices ?? response.SkippedDevices ?? [];
    const categoriesCreated = response.categoriesCreated ?? response.CategoriesCreated ?? [];
    const deviceTypesCreated = response.deviceTypesCreated ?? response.DeviceTypesCreated ?? [];
    const modelsCreated = response.modelsCreated ?? response.ModelsCreated ?? [];
    const deviceMastersCreated = response.deviceMastersCreated ?? response.DeviceMastersCreated ?? [];

    const importedCount = devicesImported.length;
    const skippedCount = skippedDevices.length;
    // totalSent: frontend se pass karo (mappedRows.length) — ye sabse accurate hai
    const totalSent = totalSentFromFrontend ?? (importedCount + skippedCount);
    const autoCreated = categoriesCreated.length + deviceTypesCreated.length + modelsCreated.length + deviceMastersCreated.length;
    const successRate = totalSent > 0 ? ((importedCount / totalSent) * 100).toFixed(0) : 0;

    // ── Categorize skipped messages ───────────────────────────────────────────
    const categorizeSkip = (msg) => {
        const m = (msg ?? "").toLowerCase();
        if (m.includes("already exists")) return "duplicate";
        if (m.includes("not found")) return "not_found";
        if (m.includes("empty")) return "field_empty";
        if (m.includes("exception") || m.includes("save failed") || m.includes("error")) return "exception";
        return "other";
    };

    const skippedParsed = skippedDevices.map((msg, i) => ({ key: i, msg: msg ?? "", type: categorizeSkip(msg) }));

    const groups = {
        all: skippedParsed,
        duplicate: skippedParsed.filter(r => r.type === "duplicate"),
        not_found: skippedParsed.filter(r => r.type === "not_found"),
        field_empty: skippedParsed.filter(r => r.type === "field_empty"),
        exception: skippedParsed.filter(r => r.type === "exception"),
    };

    const typeMap = {
        duplicate: { color: "orange", label: "Duplicate" },
        not_found: { color: "red", label: "Not Found" },
        field_empty: { color: "gold", label: "Empty field" },
        exception: { color: "red", label: "Error" },
        other: { color: "default", label: "Other" },
    };

    return (
        <div>
            {/* ── STATS CARDS ─────────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                    {
                        label: "Total Sent",
                        value: totalSent,
                        sub: `${importedCount} imported + ${skippedCount} skipped`,
                        color: T.blue,
                        icon: <DatabaseOutlined style={{ fontSize: 22, color: T.blue.text }} />,
                    },
                    {
                        label: "Imported",
                        value: importedCount,
                        sub: `${successRate}% success rate`,
                        color: importedCount > 0 ? T.green : T.gray,
                        icon: <CheckCircleOutlined style={{ fontSize: 22, color: importedCount > 0 ? T.green.text : T.gray.text }} />,
                    },
                    {
                        label: "Skipped",
                        value: skippedCount,
                        sub: skippedCount === 0
                            ? "No skipped rows 🎉"
                            : [
                                groups.duplicate.length > 0 ? `${groups.duplicate.length} duplicate` : null,
                                groups.not_found.length > 0 ? `${groups.not_found.length} not found` : null,
                                groups.field_empty.length > 0 ? `${groups.field_empty.length} empty` : null,
                                groups.exception.length > 0 ? `${groups.exception.length} error` : null,
                            ].filter(Boolean).join(" · "),
                        color: skippedCount > 0 ? T.amber : T.gray,
                        icon: <WarningOutlined style={{ fontSize: 22, color: skippedCount > 0 ? T.amber.text : T.gray.text }} />,
                    },
                    {
                        label: "Auto-Created",
                        value: autoCreated,
                        sub: [
                            categoriesCreated.length > 0 ? `${categoriesCreated.length} categories` : null,
                            deviceTypesCreated.length > 0 ? `${deviceTypesCreated.length} types` : null,
                            modelsCreated.length > 0 ? `${modelsCreated.length} models` : null,
                            deviceMastersCreated.length > 0 ? `${deviceMastersCreated.length} masters` : null,
                        ].filter(Boolean).join(" · ") || "Nothing auto-created",
                        color: autoCreated > 0 ? T.purple : T.gray,
                        icon: <AppstoreOutlined style={{ fontSize: 22, color: autoCreated > 0 ? T.purple.text : T.gray.text }} />,
                    },
                ].map(({ label, value, sub, color, icon }) => (
                    <div key={label} style={{ padding: "14px 14px 12px", background: color.bg, border: `1px solid ${color.border}`, borderRadius: T.radius.lg }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ fontSize: 30, fontWeight: 800, color: color.text, lineHeight: 1 }}>{value}</div>
                            {icon}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: color.dark, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.4 }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* ── AUTO-CREATED BREAKDOWN ───────────────────────────────────────── */}
            {autoCreated > 0 && (
                <div style={{ marginBottom: 14, padding: "12px 14px", background: T.purple.bg, border: `1px solid ${T.purple.border}`, borderRadius: T.radius.md }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.purple.dark, marginBottom: 10 }}>✨ Auto-created entries</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {[
                            { label: "Categories", items: categoriesCreated, color: "volcano", icon: <BuildOutlined /> },
                            { label: "Device Types", items: deviceTypesCreated, color: "orange", icon: <AppstoreOutlined /> },
                            { label: "Models", items: modelsCreated, color: "gold", icon: <FileExcelOutlined /> },
                            { label: "Device Masters", items: deviceMastersCreated, color: "green", icon: <LaptopOutlined /> },
                        ].map(group => (
                            <div key={group.label} style={{ background: "#fff", border: `1px solid ${T.purple.border}`, borderRadius: T.radius.md, padding: "8px 10px" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                                    {group.icon} {group.label}
                                    <Tag style={{ fontSize: 10, margin: 0, marginLeft: "auto" }}>{group.items.length}</Tag>
                                </div>
                                {group.items.length === 0
                                    ? <div style={{ fontSize: 10, color: "#D1D5DB", fontStyle: "italic" }}>none</div>
                                    : <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxHeight: 72, overflowY: "auto" }}>
                                        {group.items.map((name, i) => <Tag key={i} color={group.color} style={{ fontSize: 10, margin: 0 }}>{name}</Tag>)}
                                    </div>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── IMPORTED LIST ────────────────────────────────────────────────── */}
            {importedCount > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ padding: "8px 14px", background: T.green.bg, border: `1px solid ${T.green.border}`, borderRadius: `${T.radius.md}px ${T.radius.md}px 0 0`, fontSize: 12, fontWeight: 700, color: T.green.dark, display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircleOutlined /> {importedCount} Devices Imported Successfully
                    </div>
                    <Table
                        dataSource={devicesImported.map((msg, i) => ({ key: i, msg }))}
                        rowKey="key" size="small"
                        pagination={{ pageSize: 8, showSizeChanger: false, showTotal: t => `${t} devices` }}
                        style={{ borderRadius: `0 0 ${T.radius.md}px ${T.radius.md}px`, overflow: "hidden" }}
                        columns={[
                            { title: "#", dataIndex: "key", width: 50, render: (_, __, i) => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{i + 1}</span> },
                            { title: "Device", dataIndex: "msg", render: v => <span style={{ fontSize: 12, color: T.green.dark, fontFamily: "monospace" }}>{v}</span> },
                        ]}
                    />
                </div>
            )}

            {/* ── SKIPPED LIST ─────────────────────────────────────────────────── */}
            {skippedCount > 0 && (
                <div>
                    {/* Header + filter tabs */}
                    <div style={{ padding: "8px 14px", background: T.amber.bg, border: `1px solid ${T.amber.border}`, borderRadius: `${T.radius.md}px ${T.radius.md}px 0 0`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <WarningOutlined style={{ color: T.amber.text }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.amber.dark }}>{skippedCount} Rows Skipped</span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {[
                                { key: "all", label: "All", count: skippedParsed.length, bgColor: T.amber },
                                { key: "duplicate", label: "Duplicate", count: groups.duplicate.length, bgColor: T.orange },
                                { key: "not_found", label: "Not Found", count: groups.not_found.length, bgColor: T.red },
                                { key: "field_empty", label: "Empty", count: groups.field_empty.length, bgColor: T.gray },
                                { key: "exception", label: "Error", count: groups.exception.length, bgColor: T.red },
                            ].filter(tab => tab.count > 0).map(tab => (
                                <button key={tab.key} onClick={() => setSkipTab(tab.key)} style={{
                                    border: `1px solid ${skipTab === tab.key ? tab.bgColor.text : tab.bgColor.border}`,
                                    borderRadius: T.radius.sm, background: skipTab === tab.key ? tab.bgColor.bg : "#fff",
                                    padding: "2px 10px", cursor: "pointer", fontSize: 11,
                                    fontWeight: skipTab === tab.key ? 700 : 400,
                                    color: skipTab === tab.key ? tab.bgColor.dark : "#6B7280", outline: "none",
                                }}>
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                    </div>
                    <Table
                        dataSource={groups[skipTab] ?? groups.all}
                        rowKey="key" size="small"
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} rows` }}
                        style={{ borderRadius: `0 0 ${T.radius.md}px ${T.radius.md}px`, overflow: "hidden" }}
                        rowClassName={() => "row-skipped"}
                        columns={[
                            { title: "#", dataIndex: "key", width: 50, render: (_, __, i) => <span style={{ fontSize: 11, color: "#9CA3AF" }}>#{i + 1}</span> },
                            {
                                title: "Type", dataIndex: "type", width: 120,
                                render: type => {
                                    const m = typeMap[type] ?? typeMap.other;
                                    return <Tag color={m.color} style={{ fontSize: 10 }}>{m.label}</Tag>;
                                },
                            },
                            {
                                title: "Reason / Message", dataIndex: "msg",
                                render: (v, row) => {
                                    // Split long "Available companies: [...]" part into tooltip
                                    if (v && v.includes("Available")) {
                                        const parts = v.split(/Available[^:]*:/i);
                                        return (
                                            <div>
                                                <div style={{ fontSize: 12, color: T.red.dark, fontWeight: 600 }}>{parts[0].trim()}</div>
                                                {parts[1] && (
                                                    <Tooltip title={`Available: ${parts[1].trim()}`}>
                                                        <span style={{ fontSize: 10, color: "#9CA3AF", cursor: "help", textDecoration: "underline dotted" }}>
                                                            Available options (hover to see)
                                                        </span>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        );
                                    }
                                    const c = row.type === "exception" ? T.red.dark : row.type === "duplicate" ? T.orange.dark : T.amber.dark;
                                    return <span style={{ fontSize: 12, fontFamily: "monospace", color: c, wordBreak: "break-word" }}>{v}</span>;
                                },
                            },
                        ]}
                    />
                </div>
            )}

            {/* Empty state — sab import ho gaye */}
            {importedCount === 0 && skippedCount === 0 && (
                <Alert type="warning" showIcon message="No record process  — response empty ." style={{ borderRadius: T.radius.md }} />
            )}

            <style>{`.row-skipped td { background: ${T.amber.bg} !important; }`}</style>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ════════════════════════════════════════════════════════════════════════════════
export default function ImportDeviceDetailModal({ open, onCancel, onImportSuccess }) {
    const [subStep, setSubStep] = useState("selectType");
    const [fileType, setFileType] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [mapping, setMapping] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [response, setResponse] = useState(null);
    const [resultError, setResultError] = useState(null);
    // ── FIX: track how many rows were sent from frontend ──────────────────────
    const [totalSent, setTotalSent] = useState(0);

    const reset = () => {
        setSubStep("selectType"); setFileType(null); setParsedData(null);
        setMapping({}); setSubmitting(false); setResponse(null);
        setResultError(null); setTotalSent(0);
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

    const mappedCount = useMemo(() => BACKEND_FIELDS.filter(f => mapping[f.key]).length, [mapping]);
    const canPreview = mappedCount > 0 && mappedRows.length > 0;

    const handleSubmit = async () => {
        if (!canPreview) return;
        setSubmitting(true);
        // ── FIX: save total rows sent BEFORE submit ────────────────────────────
        setTotalSent(mappedRows.length);
        try {
            const data = await submitDeviceDetailRecords(fileType, mappedRows);
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
        { title: "Format", description: "File type" },
        { title: "Upload", description: "File upload" },
        { title: "Map", description: "Field mapping" },
        { title: "Preview", description: "Review rows" },
        { title: "Done", description: "Import result" },
    ];
    const stepIdx = { selectType: 0, upload: 1, mapping: 2, preview: 3, result: 4 }[subStep] ?? 0;
    const ft = fileType ? FILE_TYPES[fileType] : null;

    const subtitle = {
        selectType: "Choose Bulk import format  (Excel or DXF)",
        upload: `Device detail ${ft?.label ?? ""} file upload here`,
        mapping: parsedData ? `${parsedData.columns.length} columns found · mapping` : "",
        preview: `${mappedRows.length} records ready · ${mappedCount} fields mapped`,
        result: response
            ? `${(response.devicesImported ?? response.DevicesImported ?? []).length} imported · ${(response.skippedDevices ?? response.SkippedDevices ?? []).length} skipped`
            : resultError ? "Import failed" : "",
    }[subStep] || "";

    const modalWidth = subStep === "result" ? 1100 : subStep === "preview" ? 980 : subStep === "mapping" ? 920 : 640;

    const renderFooter = () => {
        if (subStep === "selectType") return [
            <Button key="c" onClick={handleClose}>Cancel</Button>,
            <Button key="n" type="primary" icon={<ArrowRightOutlined />} disabled={!fileType} onClick={() => setSubStep("upload")}>Next</Button>,
        ];
        if (subStep === "upload") return [
            <Button key="b" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("selectType")}>Back</Button>,
            <Button key="c" onClick={handleClose}>Cancel</Button>,
        ];
        if (subStep === "mapping") return [
            <Button key="b" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("upload")}>Back</Button>,
            <Button key="c" onClick={handleClose}>Cancel</Button>,
            <Button key="n" type="primary" icon={<ArrowRightOutlined />} disabled={!canPreview} onClick={() => setSubStep("preview")}>
                Preview {mappedRows.length} Rows
            </Button>,
        ];
        if (subStep === "preview") return [
            <Button key="b" icon={<ArrowLeftOutlined />} onClick={() => setSubStep("mapping")} disabled={submitting}>Back</Button>,
            <Button key="c" onClick={handleClose} disabled={submitting}>Cancel</Button>,
            <Button key="s" type="primary" icon={<ImportOutlined />} loading={submitting} disabled={!canPreview || submitting} onClick={handleSubmit} style={{ background: T.green.text, borderColor: T.green.text }}>
                Import {mappedRows.length} Devices
            </Button>,
        ];
        return [
            <Button key="m" icon={<ReloadOutlined />} onClick={reset}>Import More</Button>,
            <Button key="d" type="primary" icon={<CheckCircleOutlined />} onClick={handleClose} style={{ background: T.green.text, borderColor: T.green.text }}>Done</Button>,
        ];
    };

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: ft ? ft.color.bg : T.blue.bg, border: `1px solid ${ft ? ft.color.border : T.blue.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ft ? 18 : 16 }}>
                        {ft ? ft.icon : <LaptopOutlined style={{ color: T.blue.text }} />}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            Import Device Details
                            {ft && <Tag color={fileType === "csv" ? "cyan" : "green"} style={{ marginLeft: 8, fontSize: 10, verticalAlign: "middle" }}>{ft.label}</Tag>}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>{subtitle}</div>
                    </div>
                </div>
            }
            open={open} onCancel={handleClose} width={modalWidth} style={{ top: 24 }}
            styles={{ body: { padding: "16px 24px 8px", maxHeight: "80vh", overflowY: "auto", overflowX: "hidden" } }}
            footer={<div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 0 4px" }}>{renderFooter()}</div>}
            destroyOnClose afterClose={reset}
        >
            <Steps current={stepIdx} size="small" style={{ marginBottom: 20 }}
                items={STEPS.map((s, i) => ({ title: s.title, description: s.description, status: i < stepIdx ? "finish" : i === stepIdx ? "process" : "wait" }))} />
            <Divider style={{ margin: "0 0 16px" }} />

            {subStep === "selectType" && <StepSelectType selectedType={fileType} onSelect={setFileType} />}
            {subStep === "upload" && fileType && <StepUpload fileType={fileType} onParsed={handleParsed} />}
            {subStep === "mapping" && parsedData && <StepMapping parsedData={parsedData} fileType={fileType} mapping={mapping} onMappingChange={setMapping} />}
            {subStep === "preview" && <StepPreview mappedRows={mappedRows} fileType={fileType} mapping={mapping} submitting={submitting} />}
            {subStep === "result" && <StepResult response={response} error={resultError} totalSentFromFrontend={totalSent} />}
        </Modal>
    );
}