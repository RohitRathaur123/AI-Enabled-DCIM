// InlineHistoryPanel.jsx
// Usage in Company.jsx expandedRowRender:
//   <InlineHistoryPanel companyId={r.id} onRefreshCompanies={...} />
//
// API: GET /api/Audit/history/companies/{recordId}?Page=1&PageSize=10&IsPaginated=true
// Response: { page, pageSize, totalRecords, totalPages, isPaginated, data: [...] }

import { useState, useEffect, useCallback, useRef } from "react";
import { Spin, Button, Tooltip, Pagination, message } from "antd";
import { HistoryOutlined, CrownOutlined } from "@ant-design/icons";
import axiosInstance from "../../config"; 
import dayjs from "dayjs";
import { T } from "./constant";
import React from "react";
// ── Response parser ────────────────────────────────────────────────────────
// Your API returns: { totalRecords: 22, data: [...], page, pageSize, ... }
// axiosInstance interceptor may return response.data directly OR full response
const parseAuditResponse = (raw) => {
    // Case 1: interceptor already unwrapped → raw = { totalRecords, data: [...] }
    if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
        return {
            rows:  raw.data,
            total: raw.totalRecords ?? raw.totalCount ?? raw.data.length,
        };
    }
    // Case 2: interceptor NOT unwrapped → raw = { data: { totalRecords, data: [...] } }
    if (raw?.data && !Array.isArray(raw.data) && Array.isArray(raw.data.data)) {
        return {
            rows:  raw.data.data,
            total: raw.data.totalRecords ?? raw.data.totalCount ?? raw.data.data.length,
        };
    }
    // Case 3: plain array
    if (Array.isArray(raw))      return { rows: raw,      total: raw.length };
    if (Array.isArray(raw?.data)) return { rows: raw.data, total: raw.data.length };

    console.warn("[InlineHistoryPanel] unrecognised response shape:", raw);
    return { rows: [], total: 0 };
};

// ── Component ──────────────────────────────────────────────────────────────
export function InlineHistoryPanel({ companyId, onRefreshCompanies }) {
    const PAGE_SIZE = 10;

    const [history,       setHistory]       = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [total,         setTotal]         = useState(0);
    const [page,          setPage]          = useState(1);
    const [expandedId,    setExpandedId]    = useState(null);
    const [markingMaster, setMarkingMaster] = useState(null);
    const pageRef = useRef(1);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const loadHistory = useCallback(async (p) => {
        if (!companyId) return;
        const targetPage = p ?? pageRef.current;
        setLoading(true);
        try {
            // Exact API: /Audit/history/companies/{recordId}?Page=1&PageSize=10&IsPaginated=true
            const raw = await axiosInstance.get(
                `/Audit/history/companies/${companyId}?Page=${targetPage}&PageSize=${PAGE_SIZE}&IsPaginated=true`
            );
            console.log("yyyyy",companyId)
            const { rows, total: t } = parseAuditResponse(raw);
            setHistory(rows);
            console.log(raw,"kkkkkkkkkkkkkkkkkkkkk")
            setTotal(t);
        } catch (err) {
            console.error("[InlineHistoryPanel] fetch error:", err);
            setHistory([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        pageRef.current = 1;
        setPage(1);
        setExpandedId(null);
        setHistory([]);
        loadHistory(1);
    }, [loadHistory]);

    const handlePageChange = (p) => {
        pageRef.current = p;
        setPage(p);
        setExpandedId(null);
        loadHistory(p);
    };

    // ── Mark as Master ─────────────────────────────────────────────────────
    const handleMakeMaster = async (rec) => {
        if (rec.isFinal) return;
        setMarkingMaster(rec.id);
        try {
            const raw  = await axiosInstance.post(`/Audit/mark-as-final/${rec.id}`);
            const data = raw?.data !== undefined ? raw.data : raw;

            // Treat any 2xx as success; also check explicit success field
            const ok =
                data?.success === true ||
                data?.success === "true" ||
                (data?.success === undefined && raw !== null && raw !== undefined);

            if (ok) {
                message.success(data?.message || "Marked as master successfully.");
                setHistory(prev =>
                    prev.map(r =>
                        r.id === rec.id
                            ? { ...r, isFinal: true, finalizedAt: new Date().toISOString() }
                            : r
                    )
                );
                if (onRefreshCompanies) onRefreshCompanies();
            } else {
                message.error(data?.message || "Failed to mark as master.");
            }
        } catch (err) {
            console.error("[InlineHistoryPanel] mark master error:", err);
            message.error(err?.response?.data?.message || err?.message || "Failed to mark as master.");
        } finally {
            setMarkingMaster(null);
        }
    };

    // ── Grid layout ────────────────────────────────────────────────────────
    const COL     = "28px 56px 90px 140px 1fr 1fr 110px 110px";
    const HEADERS = ["", "ID", "Action", "Column", "Old Value", "New Value", "Changed At", "Master"];

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div style={{
            margin: "0 0 8px 52px",
            border: "1px solid #DBEAFE",
            borderRadius: 10,
            overflow: "hidden",
            background: "#F0F7FF",
            boxShadow: "0 2px 8px rgba(59,130,246,0.07)",
        }}>

            {/* ── Header ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: "#EFF6FF",
                borderBottom: "1px solid #DBEAFE",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HistoryOutlined style={{ color: T.teal.text, fontSize: 13 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.teal.text }}>
                        Update History
                    </span>
                    {!loading && total > 0 && (
                        <span style={{
                            background: T.teal.bg, color: T.teal.text,
                            border: `1px solid ${T.teal.border}`,
                            borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "0 7px",
                        }}>
                            {total}
                        </span>
                    )}
                    {!loading && total === 0 && (
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>No records found</span>
                    )}
                </div>
                <Button
                    size="small" type="text"
                    style={{ fontSize: 11, color: T.teal.text }}
                    onClick={() => loadHistory(pageRef.current)}
                    disabled={loading}
                >
                    ↻ Refresh
                </Button>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
                    <Spin size="small" />
                    <span style={{ marginLeft: 8 }}>Loading history…</span>
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && history.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
                    No history records for this company.
                </div>
            )}

            {/* ── Grid ── */}
            {!loading && history.length > 0 && (
                <>
                    {/* Column headers */}
                    <div style={{
                        display: "grid", gridTemplateColumns: COL, gap: 8,
                        padding: "7px 14px",
                        background: "#F9FAFB",
                        borderBottom: "1px solid #E5E7EB",
                    }}>
                        {HEADERS.map((h, i) => (
                            <div key={i} style={{
                                fontSize: 9, fontWeight: 700, color: "#9CA3AF",
                                textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {history.map((rec, idx) => {
                        const isOpen = expandedId === rec.id;
                        const ac     = rec.actionType === "INSERT" ? T.green
                                     : rec.actionType === "DELETE" ? T.pink
                                     : T.blue;

                        return (
                            <div
                                key={rec.id}
                                style={{ borderBottom: idx < history.length - 1 ? "1px solid #E9F0FB" : "none" }}
                            >
                                {/* Main row */}
                                <div style={{
                                    display: "grid", gridTemplateColumns: COL, gap: 8,
                                    padding: "9px 14px", alignItems: "center",
                                    background: isOpen ? "#DBEAFE"
                                        : idx % 2 === 0 ? "#F0F7FF" : "#EBF3FF",
                                    transition: "background 0.15s",
                                }}>

                                    {/* Expand button */}
                                    <button
                                        onClick={() => setExpandedId(isOpen ? null : rec.id)}
                                        style={{
                                            width: 18, height: 18, borderRadius: 4, padding: 0,
                                            border: `1.5px solid ${isOpen ? T.blue.border : "#CBD5E1"}`,
                                            background: isOpen ? T.blue.bg : "#fff",
                                            color: isOpen ? T.blue.text : "#64748B",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer", fontSize: 11, fontWeight: 800,
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {isOpen ? "−" : "+"}
                                    </button>

                                    {/* ID */}
                                    <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>
                                        #{rec.id}
                                    </div>

                                    {/* Action badge */}
                                    <div>
                                        <span style={{
                                            background: ac.bg, color: ac.text,
                                            border: `1px solid ${ac.border}`,
                                            fontSize: 9, fontWeight: 700,
                                            padding: "2px 7px", borderRadius: 99,
                                        }}>
                                            {rec.actionType || "—"}
                                        </span>
                                    </div>

                                    {/* Column name */}
                                    <div style={{
                                        fontSize: 11, fontFamily: "monospace",
                                        color: "#374151", fontWeight: 600,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {rec.columnName || "—"}
                                    </div>

                                    {/* Old value */}
                                    <div style={{
                                        fontSize: 11,
                                        color: rec.oldValue ? "#991B1B" : "#CBD5E1",
                                        fontStyle: rec.oldValue ? "normal" : "italic",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {rec.oldValue ?? "null"}
                                    </div>

                                    {/* New value */}
                                    <div style={{
                                        fontSize: 11,
                                        color: rec.newValue ? "#065F46" : "#CBD5E1",
                                        fontStyle: rec.newValue ? "normal" : "italic",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {rec.newValue ?? "null"}
                                    </div>

                                    {/* Changed at */}
                                    <div style={{ fontSize: 10, color: "#6B7280", whiteSpace: "nowrap" }}>
                                        {rec.changedAt
                                            ? dayjs(rec.changedAt).format("DD MMM YY, HH:mm")
                                            : "—"}
                                    </div>

                                    {/* Master button */}
                                    <div>
                                        <Tooltip title={rec.isFinal ? "Already master" : "Mark as master"}>
                                            <Button
                                                icon={<CrownOutlined />}
                                                size="small"
                                                disabled={rec.isFinal}
                                                loading={markingMaster === rec.id}
                                                onClick={() => handleMakeMaster(rec)}
                                                style={{
                                                    color:       rec.isFinal ? "#D1D5DB" : T.amber.text,
                                                    borderColor: rec.isFinal ? "#E5E7EB"  : T.amber.border,
                                                    background:  rec.isFinal ? "#F9FAFB"  : T.amber.bg,
                                                    fontWeight: 600, fontSize: 11, border: "1px solid",
                                                }}
                                            >
                                                {rec.isFinal ? "✓ Done" : "Master"}
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </div>

                                {/* Expanded detail panel */}
                                {isOpen && (
                                    <div style={{
                                        padding: "12px 16px 14px 46px",
                                        background: "#EFF6FF",
                                        borderTop: "1px dashed #BFDBFE",
                                    }}>
                                        {/* Action + table label */}
                                        <div style={{
                                            display: "flex", alignItems: "center",
                                            gap: 8, marginBottom: 10,
                                        }}>
                                            <span style={{
                                                background: ac.bg, color: ac.text,
                                                border: `1px solid ${ac.border}`,
                                                fontSize: 11, fontWeight: 700,
                                                padding: "2px 10px", borderRadius: 99,
                                            }}>
                                                {rec.actionType}
                                            </span>
                                            <span style={{ fontSize: 11, color: "#6B7280" }}>
                                                on <strong style={{ color: "#374151" }}>{rec.tableName}</strong>
                                            </span>
                                            {rec.isFinal && (
                                                <span style={{
                                                    background: "#FEF3C7", color: "#D97706",
                                                    border: "1px solid #FDE68A",
                                                    fontSize: 10, fontWeight: 700,
                                                    padding: "2px 8px", borderRadius: 99,
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                }}>
                                                    <CrownOutlined style={{ fontSize: 10 }} /> Master Record
                                                </span>
                                            )}
                                        </div>

                                        {/* Detail fields */}
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(4, 1fr)",
                                            gap: 8, marginBottom: 10,
                                        }}>
                                            {[
                                                { label: "Record ID",  value: rec.recordId },
                                                { label: "Column",     value: rec.columnName },
                                                { label: "Changed By", value: rec.changedBy },
                                                { label: "Changed At", value: rec.changedAt ? dayjs(rec.changedAt).format("DD MMM YYYY, HH:mm:ss") : "—" },
                                            ].map(f => (
                                                <div key={f.label} style={{
                                                    background: "#fff",
                                                    border: "1px solid #DBEAFE",
                                                    borderRadius: 6, padding: "7px 10px",
                                                }}>
                                                    <div style={{
                                                        fontSize: 9, fontWeight: 700,
                                                        color: "#93C5FD",
                                                        textTransform: "uppercase", marginBottom: 3,
                                                    }}>
                                                        {f.label}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                                                        {String(f.value ?? "—")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Old / New value */}
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 8, marginBottom: 8,
                                        }}>
                                            <div style={{
                                                background: "#FEF2F2",
                                                border: "1px solid #FECACA",
                                                borderRadius: 6, padding: "9px 12px",
                                            }}>
                                                <div style={{
                                                    fontSize: 9, fontWeight: 700, color: "#991B1B",
                                                    textTransform: "uppercase", marginBottom: 5,
                                                }}>
                                                    Old Value
                                                </div>
                                                <div style={{
                                                    fontSize: 12, color: "#7F1D1D",
                                                    wordBreak: "break-word",
                                                    fontStyle: rec.oldValue ? "normal" : "italic",
                                                }}>
                                                    {rec.oldValue ?? "null"}
                                                </div>
                                            </div>
                                            <div style={{
                                                background: "#F0FDF4",
                                                border: "1px solid #BBF7D0",
                                                borderRadius: 6, padding: "9px 12px",
                                            }}>
                                                <div style={{
                                                    fontSize: 9, fontWeight: 700, color: "#065F46",
                                                    textTransform: "uppercase", marginBottom: 5,
                                                }}>
                                                    New Value
                                                </div>
                                                <div style={{
                                                    fontSize: 12, color: "#14532D",
                                                    wordBreak: "break-word",
                                                    fontStyle: rec.newValue ? "normal" : "italic",
                                                }}>
                                                    {rec.newValue ?? "null"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        {rec.remarks && (
                                            <div style={{
                                                background: T.blue.bg,
                                                border: `1px solid ${T.blue.border}`,
                                                borderRadius: 6, padding: "8px 12px", marginBottom: 8,
                                            }}>
                                                <div style={{
                                                    fontSize: 9, fontWeight: 700,
                                                    color: T.blue.text,
                                                    textTransform: "uppercase", marginBottom: 3,
                                                }}>
                                                    Remarks
                                                </div>
                                                <div style={{ fontSize: 12, color: T.blue.text, lineHeight: 1.6 }}>
                                                    {rec.remarks}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mark as Master button (in detail) */}
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<CrownOutlined />}
                                                disabled={rec.isFinal}
                                                loading={markingMaster === rec.id}
                                                onClick={() => handleMakeMaster(rec)}
                                                style={{
                                                    background:  rec.isFinal ? "#D1D5DB" : T.amber.text,
                                                    borderColor: rec.isFinal ? "#D1D5DB" : T.amber.text,
                                                    fontSize: 11,
                                                    cursor: rec.isFinal ? "not-allowed" : "pointer",
                                                }}
                                            >
                                                {rec.isFinal ? "Already Master" : "Mark as Master"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* ── Pagination ── */}
                    {total > PAGE_SIZE && (
                        <div style={{
                            display: "flex", justifyContent: "flex-end", alignItems: "center",
                            padding: "10px 16px",
                            borderTop: "1px solid #DBEAFE",
                            background: "#EFF6FF",
                        }}>
                            <Pagination
                                current={page}
                                pageSize={PAGE_SIZE}
                                total={total}
                                size="small"
                                showTotal={(t) => `Total ${t} records`}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default InlineHistoryPanel;