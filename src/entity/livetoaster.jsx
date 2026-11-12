import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../config';

// Usage: <AuditWidget tableName="Companies" />
// Usage with record: <AuditWidget tableName="Companies" recordId={123} />

const ACTION_META = {
    INSERT: { color: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB', label: 'INS', icon: 'ti-plus' },
    UPDATE: { color: '#534AB7', bg: '#EEEDFE', border: '#AFA9EC', label: 'UPD', icon: 'ti-edit' },
    DELETE: { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', label: 'DEL', icon: 'ti-trash' },
};

const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return (
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
        ' ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
};

const fmtFull = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return (
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
};

// ── Parse any shape of paged API response ──────────────────────────────────
const parseAuditResponse = (raw) => {
    const envelope = raw?.data !== undefined ? raw.data : raw;

    if (Array.isArray(envelope)) {
        return { rows: envelope, total: envelope.length };
    }
    if (Array.isArray(envelope?.data)) {
        return {
            rows: envelope.data,
            total: envelope.totalRecords ?? envelope.totalCount ?? envelope.total ?? envelope.data.length,
        };
    }
    if (Array.isArray(envelope?.items)) {
        return {
            rows: envelope.items,
            total: envelope.totalCount ?? envelope.totalRecords ?? envelope.total ?? envelope.items.length,
        };
    }
    const rows = Array.isArray(envelope) ? envelope : [];
    return { rows, total: rows.length };
};

// ── Expanded detail row in the side panel ───────────────────────────────────
const PanelRow = ({ row, isExpanded, onToggle, onMarkMaster, markingMaster }) => {
    const meta = ACTION_META[row.actionType] || { color: '#888', bg: '#f0f0f0', border: '#ddd', label: row.actionType, icon: 'ti-help' };
    return (
        <div style={{ borderBottom: '1px solid #f5f5f5' }}>
            <div
                onClick={onToggle}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 56px 80px 100px 1fr 1fr 120px 24px',
                    padding: '8px 16px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? '#faf9ff' : 'transparent',
                    fontSize: 11,
                    fontFamily: "'DM Mono', 'Fira Mono', monospace",
                    transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
            >
                <span style={{ color: '#ccc', padding: '0 2px' }}>#{row.id}</span>
                <span style={{ color: '#aaa', padding: '0 2px' }}>{row.recordId ?? '—'}</span>
                <div style={{ padding: '0 2px' }}>
                    <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 700,
                        letterSpacing: '0.04em', background: meta.bg, color: meta.color,
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}>
                        <i className={`ti ${meta.icon}`} style={{ fontSize: 10 }} />
                        {meta.label}
                    </span>
                </div>
                <span style={{ color: '#555', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.columnName || '—'}
                </span>
                <span style={{
                    color: '#A32D2D', padding: '0 2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: row.oldValue ? 'line-through' : 'none',
                    opacity: row.oldValue ? 1 : 0.35,
                }}>
                    {row.oldValue ?? 'null'}
                </span>
                <span style={{
                    color: '#0F6E56', padding: '0 2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    opacity: row.newValue ? 1 : 0.35,
                }}>
                    {row.newValue ?? 'null'}
                </span>
                <span style={{ color: '#bbb', padding: '0 2px', whiteSpace: 'nowrap', fontSize: 10 }}>
                    {fmt(row.changedAt)}
                </span>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ccc', fontSize: 12,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                    <i className="ti ti-chevron-right" />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            background: '#f9f8ff',
                            borderTop: '1px solid #ede9ff',
                            padding: '12px 20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '10px 20px',
                            fontFamily: "'DM Mono', 'Fira Mono', monospace",
                        }}>
                            {[
                                ['id', row.id],
                                ['tableName', row.tableName],
                                ['recordId', row.recordId ?? '—'],
                                ['actionType', row.actionType],
                                ['columnName', row.columnName || '—'],
                                ['changedBy', row.changedBy || '—'],
                                ['changedAt', fmtFull(row.changedAt)],
                                ['oldValue', row.oldValue ?? 'null', row.oldValue ? '#A32D2D' : '#bbb'],
                                ['newValue', row.newValue ?? 'null', row.newValue ? '#0F6E56' : '#bbb'],
                            ].map(([label, value, color]) => (
                                <div key={label}>
                                    <div style={{ fontSize: 9, color: '#b0a8d0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                        {label}
                                    </div>
                                    <div style={{ fontSize: 11, color: color || '#333', wordBreak: 'break-all' }}>
                                        {String(value)}
                                    </div>
                                </div>
                            ))}

                            {/* isFinal badge */}
                            <div>
                                <div style={{ fontSize: 9, color: '#b0a8d0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                    isFinal
                                </div>
                                <span style={{
                                    fontSize: 10, padding: '2px 8px', borderRadius: 99,
                                    background: row.isFinal ? '#E1F5EE' : '#f5f5f5',
                                    color: row.isFinal ? '#0F6E56' : '#bbb',
                                    border: `1px solid ${row.isFinal ? '#9FE1CB' : '#e0e0e0'}`,
                                    fontWeight: 700,
                                }}>
                                    {row.isFinal ? 'YES' : 'NO'}
                                </span>
                            </div>

                            {/* Mark as Master button */}
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    disabled={row.isFinal || markingMaster === row.id}
                                    onClick={(e) => { e.stopPropagation(); onMarkMaster(row); }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '4px 10px', borderRadius: 6,
                                        border: `1px solid ${row.isFinal ? '#e0e0e0' : '#D97706'}`,
                                        background: row.isFinal ? '#f5f5f5' : '#FEF3C7',
                                        color: row.isFinal ? '#ccc' : '#D97706',
                                        fontSize: 10, fontWeight: 700, cursor: row.isFinal ? 'not-allowed' : 'pointer',
                                        fontFamily: "'DM Mono', 'Fira Mono', monospace",
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <i className={`ti ${markingMaster === row.id ? 'ti-loader-2' : 'ti-crown'}`}
                                        style={{ fontSize: 11, animation: markingMaster === row.id ? 'spin 1s linear infinite' : 'none' }} />
                                    {row.isFinal ? 'Master' : markingMaster === row.id ? 'Saving…' : 'Mark Master'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Pagination bar ─────────────────────────────────────────────────────────
const PaginationStrip = ({ page, pageSize, total, onChange, loading }) => {
    const totalPages = Math.ceil(total / pageSize) || 1;
    const pages = [];

    const addPage = (p) => { if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p); };
    addPage(1);
    for (let i = page - 1; i <= page + 1; i++) addPage(i);
    addPage(totalPages);
    pages.sort((a, b) => a - b);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa',
            fontFamily: "'DM Mono', 'Fira Mono', monospace",
            flexShrink: 0,
        }}>
            <span style={{ fontSize: 10, color: '#bbb' }}>
                {total} records · page {page}/{totalPages}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1 || loading}
                    style={navBtnStyle(page <= 1 || loading)}
                >
                    <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
                </button>

                {pages.map((p, i) => {
                    const prev = pages[i - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                        <React.Fragment key={p}>
                            {showEllipsis && <span style={{ fontSize: 10, color: '#ccc', padding: '0 2px' }}>…</span>}
                            <button
                                onClick={() => onChange(p)}
                                disabled={loading}
                                style={pageBtnStyle(p === page)}
                            >
                                {p}
                            </button>
                        </React.Fragment>
                    );
                })}

                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page >= totalPages || loading}
                    style={navBtnStyle(page >= totalPages || loading)}
                >
                    <i className="ti ti-chevron-right" style={{ fontSize: 11 }} />
                </button>
            </div>
        </div>
    );
};

const navBtnStyle = (disabled) => ({
    width: 24, height: 24, borderRadius: 5,
    border: '1px solid #e8e8e8',
    background: disabled ? '#f5f5f5' : '#fff',
    color: disabled ? '#ccc' : '#534AB7',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
});

const pageBtnStyle = (active) => ({
    minWidth: 24, height: 24, padding: '0 6px', borderRadius: 5,
    border: `1px solid ${active ? '#AFA9EC' : '#e8e8e8'}`,
    background: active ? '#EEEDFE' : '#fff',
    color: active ? '#534AB7' : '#888',
    fontWeight: active ? 700 : 400,
    fontSize: 10, cursor: 'pointer',
    fontFamily: "'DM Mono', 'Fira Mono', monospace",
    transition: 'all 0.15s',
});

// ── Main AuditWidget ────────────────────────────────────────────────────────
const AuditWidget = ({ tableName, recordId = null, pollInterval = 15000 }) => {
    const PAGE_SIZE = 10;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);
    const [newCount, setNewCount] = useState(0);
    const [markingMaster, setMarkingMaster] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const pageRef = useRef(1);
    const lastTopIdRef = useRef(null);
    const pollRef = useRef(null);

    // ── Build URL — IsPaginated=true sends Page+PageSize to backend ────────
    const buildUrl = useCallback((p) => {
        const base = recordId
            ? `/Audit/history/${tableName}/${recordId}`
            : `/Audit/history/${tableName}`;
        return `${base}?Page=${p}&PageSize=${PAGE_SIZE}&IsPaginated=true`;
    }, [tableName, recordId]);

    // ── Fetch function ──────────────────────────────────────────────────────
    const fetchPage = useCallback(async (p, isPolling = false) => {
        if (!tableName) return;
        if (!isPolling) setLoading(true);
        try {
            const raw = await axiosInstance.get(buildUrl(p));
            const { rows: newRows, total: newTotal } = parseAuditResponse(raw);

            setLastFetched(new Date());
            setError(null);
            setTotal(newTotal);

            if (isPolling) {
                // Only check for new rows on page 1
                if (pageRef.current === 1 && newRows.length > 0) {
                    const topId = newRows[0]?.id;
                    if (lastTopIdRef.current !== null && topId > lastTopIdRef.current) {
                        const fresh = newRows.filter(r => r.id > lastTopIdRef.current);
                        if (fresh.length > 0) {
                            setNewCount(n => n + fresh.length);
                            setRows(newRows);
                            lastTopIdRef.current = topId;
                        }
                    } else if (lastTopIdRef.current === null && newRows.length > 0) {
                        lastTopIdRef.current = newRows[0]?.id ?? null;
                    }
                }
            } else {
                setRows(newRows);
                if (newRows.length > 0 && p === 1) {
                    lastTopIdRef.current = newRows[0]?.id ?? null;
                }
            }
        } catch (err) {
            console.error('AuditWidget error:', err);
            if (!isPolling) setError(`Failed to load: ${err?.message || 'Unknown error'}`);
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, [tableName, recordId, buildUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── On mount / tableName / recordId change ──────────────────────────────
    useEffect(() => {
        if (!tableName) return;
        setRows([]); setPage(1); setTotal(0); setError(null); setNewCount(0);
        pageRef.current = 1; lastTopIdRef.current = null;
        fetchPage(1);

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            if (pageRef.current === 1) fetchPage(1, true);
        }, pollInterval);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [tableName, recordId, fetchPage]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePageChange = (p) => {
        pageRef.current = p;
        setPage(p);
        fetchPage(p);
        setExpandedId(null);
    };

    const handleOpenPanel = () => {
        setPanelOpen(true);
        setNewCount(0);
        fetchPage(pageRef.current);
    };

    // ── Mark as Master ──────────────────────────────────────────────────────
    const handleMarkMaster = async (row) => {
        setMarkingMaster(row.id);
        try {
            const raw = await axiosInstance.post(`/Audit/mark-as-final/${row.id}`);
            const data = raw?.data !== undefined ? raw.data : raw;
            if (data?.success) {
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, isFinal: true } : r));
            } else {
                alert(data?.message || 'Failed to mark as master.');
            }
        } catch (err) {
            console.error('Mark master error:', err);
            alert(err?.response?.data?.message || err?.message || 'Failed to mark as master.');
        } finally {
            setMarkingMaster(null);
        }
    };

    const counts = rows.reduce(
        (acc, r) => {
            if (r.actionType === 'INSERT') acc.insert++;
            else if (r.actionType === 'UPDATE') acc.update++;
            else if (r.actionType === 'DELETE') acc.delete++;
            return acc;
        },
        { insert: 0, update: 0, delete: 0 }
    );

    return (
        <>
            {/* ── Trigger Button ─────────────────────────────────────────── */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                    onClick={handleOpenPanel}
                    title={`View full history for ${tableName}`}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 7,
                        border: '1px solid #e0e0e0', background: '#fff',
                        color: '#534AB7', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', letterSpacing: '0.03em',
                        transition: 'all 0.15s',
                        fontFamily: "'DM Mono', 'Fira Mono', monospace",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#EEEDFE'; e.currentTarget.style.borderColor = '#AFA9EC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                >
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#0F6E56', boxShadow: '0 0 0 2px #E1F5EE',
                        animation: 'auditPulse 2s infinite', flexShrink: 0,
                    }} />
                    <i className="ti ti-layout-sidebar-right" style={{ fontSize: 13 }} />
                    Full History

                    {newCount > 0 && (
                        <motion.span
                            key={newCount}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            style={{
                                fontSize: 9, padding: '1px 5px', borderRadius: 10,
                                background: '#0F6E56', color: '#fff', fontWeight: 700, lineHeight: '14px',
                            }}
                        >
                            +{newCount}
                        </motion.span>
                    )}

                    {total > 0 && newCount === 0 && (
                        <span style={{
                            fontSize: 9, padding: '1px 5px', borderRadius: 10,
                            background: '#f0f0f0', color: '#888', fontWeight: 600, lineHeight: '14px',
                        }}>
                            {total}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Side Panel ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {panelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setPanelOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 1000 }}
                        />

                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            style={{
                                position: 'fixed', top: 0, right: 0, bottom: 0, width: 820,
                                background: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,0.1)',
                                zIndex: 1001, display: 'flex', flexDirection: 'column',
                                fontFamily: "'DM Mono', 'Fira Mono', monospace",
                            }}
                        >
                            {/* Panel Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
                                background: '#fafafa', flexShrink: 0, flexWrap: 'wrap', gap: 8,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 7, height: 7, borderRadius: '50%', background: '#0F6E56',
                                        boxShadow: '0 0 0 2px #E1F5EE', animation: 'auditPulse 2s infinite',
                                    }} />
                                    <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{tableName}</span>
                                    {recordId && <span style={{ fontSize: 10, color: '#bbb' }}>record #{recordId}</span>}
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#888' }}>
                                        {total} records
                                    </span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[
                                            { label: 'INS', count: counts.insert, meta: ACTION_META.INSERT },
                                            { label: 'UPD', count: counts.update, meta: ACTION_META.UPDATE },
                                            { label: 'DEL', count: counts.delete, meta: ACTION_META.DELETE },
                                        ].map(({ label, count, meta }) => (
                                            <span key={label} style={{
                                                fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                                                fontWeight: 700,
                                            }}>
                                                {label} {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {lastFetched && (
                                        <span style={{ fontSize: 10, color: '#bbb' }}>
                                            updated {lastFetched.toLocaleTimeString()}
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: 10, padding: '2px 8px', borderRadius: 20,
                                        background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB',
                                    }}>
                                        live · {pollInterval / 1000}s
                                    </span>
                                    <button
                                        onClick={() => { fetchPage(pageRef.current); }}
                                        disabled={loading}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '4px 10px', borderRadius: 6,
                                            border: '1px solid #e8e8e8', background: '#fff',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            color: '#888', fontSize: 11,
                                        }}
                                    >
                                        <i className={`ti ti-refresh ${loading ? 'spin' : ''}`} style={{ fontSize: 12 }} />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => setPanelOpen(false)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: 28, height: 28, borderRadius: 6,
                                            border: '1px solid #e8e8e8', background: '#fff',
                                            cursor: 'pointer', color: '#888', fontSize: 14, transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FCEBEB'; e.currentTarget.style.color = '#A32D2D'; e.currentTarget.style.borderColor = '#F7C1C1'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e8e8'; }}
                                    >
                                        <i className="ti ti-x" />
                                    </button>
                                </div>
                            </div>

                            {/* Column Headers */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '48px 56px 80px 100px 1fr 1fr 120px 24px',
                                padding: '6px 16px', background: '#f7f7f7',
                                borderBottom: '1px solid #efefef', flexShrink: 0,
                            }}>
                                {['id', 'rec', 'action', 'column', 'old value', 'new value', 'changed at', ''].map((h, i) => (
                                    <span key={i} style={{
                                        fontSize: 9, color: '#2686aca8',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        fontWeight: 600, padding: '0 2px',
                                    }}>
                                        {h}
                                    </span>
                                ))}
                            </div>

                            {/* Rows */}
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {loading && (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 12 }}>
                                        <i className="ti ti-loader-2" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }} />
                                        <div style={{ marginTop: 8 }}>Loading…</div>
                                    </div>
                                )}
                                {error && (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#A32D2D', fontSize: 12 }}>
                                        {error}
                                    </div>
                                )}
                                {!loading && !error && rows.length === 0 && (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: 12 }}>
                                        No audit records found.
                                    </div>
                                )}
                                {!loading && rows.map((row) => (
                                    <motion.div
                                        key={row.id}
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <PanelRow
                                            row={row}
                                            isExpanded={expandedId === row.id}
                                            onToggle={() => setExpandedId(prev => prev === row.id ? null : row.id)}
                                            onMarkMaster={handleMarkMaster}
                                            markingMaster={markingMaster}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* ── Pagination — always visible when total > PAGE_SIZE ── */}
                            {total > PAGE_SIZE && (
                                <PaginationStrip
                                    page={page}
                                    pageSize={PAGE_SIZE}
                                    total={total}
                                    onChange={handlePageChange}
                                    loading={loading}
                                />
                            )}

                            {/* Panel Footer */}
                            <div style={{
                                padding: '8px 20px', borderTop: '1px solid #f0f0f0',
                                background: '#fafafa', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 6,
                            }}>
                                <span style={{ fontSize: 10, color: '#ccc' }}>
                                    click row to expand · crown icon to mark master
                                </span>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {Object.entries(ACTION_META).map(([k, v]) => (
                                        <span key={k} style={{ fontSize: 10, color: v.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className={`ti ${v.icon}`} style={{ fontSize: 10 }} />
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes auditPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.70; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #5dcb8bff; border-radius: 4px; }
            `}</style>
        </>
    );
};

export default AuditWidget;