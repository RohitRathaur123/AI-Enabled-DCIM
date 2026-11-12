import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../config';

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

const ToastRow = ({ row }) => {
    const meta = ACTION_META[row.actionType] || {
        color: '#888', bg: '#f0f0f0', border: '#ddd', label: row.actionType, icon: 'ti-help',
    };
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 10px', borderBottom: '1px solid rgba(0,0,0,0.04)',
            fontSize: 11, fontFamily: "'DM Mono', 'Fira Mono', monospace",
        }}>
            <span style={{
                fontSize: 9, padding: '2px 5px', borderRadius: 3,
                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0,
            }}>
                {meta.label}
            </span>
            <span style={{ color: '#555', flexShrink: 0, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.columnName || '—'}
            </span>
            <span style={{ color: '#bbb', flexShrink: 0 }}>→</span>
            <span style={{ color: '#0F6E56', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.newValue ?? 'null'}
            </span>
            <span style={{ color: '#ccc', flexShrink: 0, fontSize: 9 }}>
                {fmt(row.changedAt)}
            </span>
        </div>
    );
};

const ChangeToast = ({ freshRows, onClose, onOpenPanel }) => {
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef(null);
    const DURATION = 10000;

    useEffect(() => {
        const start = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
            setProgress(remaining);
            if (remaining === 0) { clearInterval(intervalRef.current); onClose(); }
        }, 50);
        return () => clearInterval(intervalRef.current);
    }, []);

    const preview = freshRows.slice(0, 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
                position: 'fixed', bottom: 20, right: 20, width: 320,
                background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)',
                overflow: 'hidden', zIndex: 1100,
                fontFamily: "'DM Mono', 'Fira Mono', monospace",
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px 8px 12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#0F6E56',
                        boxShadow: '0 0 0 2px #E1F5EE', animation: 'auditPulse 2s infinite', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#333', letterSpacing: '0.02em' }}>
                        Latest Changes
                    </span>
                    <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 10,
                        background: '#0F6E56', color: '#fff', fontWeight: 700,
                    }}>
                        +{freshRows.length}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button
                        onClick={() => { onClose(); onOpenPanel(); }}
                        title="View full history"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '3px 7px', borderRadius: 5,
                            border: '1px solid #e0e0e0', background: '#fff',
                            color: '#534AB7', fontSize: 9, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Mono', 'Fira Mono', monospace",
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#EEEDFE'; e.currentTarget.style.borderColor = '#AFA9EC'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                    >
                        <i className="ti ti-layout-sidebar-right" style={{ fontSize: 10 }} />
                        All
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: 5,
                            border: '1px solid #e8e8e8', background: '#fff',
                            cursor: 'pointer', color: '#bbb', fontSize: 11, transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FCEBEB'; e.currentTarget.style.color = '#A32D2D'; e.currentTarget.style.borderColor = '#F7C1C1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#bbb'; e.currentTarget.style.borderColor = '#e8e8e8'; }}
                    >
                        <i className="ti ti-x" />
                    </button>
                </div>
            </div>

            <div>
                <AnimatePresence initial={false}>
                    {preview.map((row) => (
                        <motion.div key={row.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
                            <ToastRow row={row} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                {freshRows.length > 3 && (
                    <div
                        onClick={() => { onClose(); onOpenPanel(); }}
                        style={{
                            padding: '5px 12px', textAlign: 'center', fontSize: 10,
                            color: '#534AB7', background: '#fafafa', cursor: 'pointer', letterSpacing: '0.02em',
                        }}
                    >
                        +{freshRows.length - 3} more · click to view all
                    </div>
                )}
            </div>

            <div style={{ height: 2, background: '#f0f0f0' }}>
                <motion.div style={{ height: '100%', background: '#0F6E56', width: `${progress}%`, transformOrigin: 'left' }} transition={{ duration: 0 }} />
            </div>
        </motion.div>
    );
};

const PanelRow = ({ row, isExpanded, onToggle }) => {
    const meta = ACTION_META[row.actionType] || { color: '#888', bg: '#f0f0f0', border: '#ddd', label: row.actionType, icon: 'ti-help' };
    return (
        <div style={{ borderBottom: '1px solid #f5f5f5' }}>
            <div
                onClick={onToggle}
                style={{
                    display: 'grid', gridTemplateColumns: '48px 56px 80px 100px 1fr 1fr 120px 24px',
                    padding: '8px 16px', alignItems: 'center', cursor: 'pointer',
                    background: isExpanded ? '#faf9ff' : 'transparent', fontSize: 11,
                    fontFamily: "'DM Mono', 'Fira Mono', monospace", transition: 'background 0.15s',
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
                <span style={{ color: '#555', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.columnName || '—'}</span>
                <span style={{ color: '#A32D2D', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: row.oldValue ? 'line-through' : 'none', opacity: row.oldValue ? 1 : 0.35 }}>{row.oldValue ?? 'null'}</span>
                <span style={{ color: '#0F6E56', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: row.newValue ? 1 : 0.35 }}>{row.newValue ?? 'null'}</span>
                <span style={{ color: '#bbb', padding: '0 2px', whiteSpace: 'nowrap', fontSize: 10 }}>{fmt(row.changedAt)}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <i className="ti ti-chevron-right" />
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                        <div style={{ background: '#f9f8ff', borderTop: '1px solid #ede9ff', padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px 20px', fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
                            {[
                                ['id', row.id], ['tableName', row.tableName], ['recordId', row.recordId ?? '—'],
                                ['actionType', row.actionType], ['columnName', row.columnName || '—'],
                                ['changedBy', row.changedBy || '—'], ['changedAt', fmtFull(row.changedAt)],
                                ['oldValue', row.oldValue ?? 'null', row.oldValue ? '#A32D2D' : '#bbb'],
                                ['newValue', row.newValue ?? 'null', row.newValue ? '#0F6E56' : '#bbb'],
                            ].map(([label, value, color]) => (
                                <div key={label}>
                                    <div style={{ fontSize: 9, color: '#b0a8d0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 11, color: color || '#333', wordBreak: 'break-all' }}>{String(value)}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
// tableName  → required  (e.g. "Company")
// recordId   → optional  (e.g. 42)  — pass to scope history to a single record
//              if omitted, falls back to /Audit/history/{tableName}
const AuditWidget2 = ({ tableName, recordId, pollInterval = 5000, maxRows = 50 }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);
    const lastIdRef = useRef(null);
    const isFirstFetch = useRef(true);
    const [newCount, setNewCount] = useState(0);
    const [toastRows, setToastRows] = useState([]);
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimerRef = useRef(null);

    // Build endpoint — use recordId-scoped route when available
    const buildUrl = () => {
        if (recordId != null && recordId !== '') {
            return `/Audit/history/${tableName}/${recordId}`;
        }
        return `/Audit/history/${tableName}`;
    };

    const showToast = (freshRows) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastRows(freshRows);
        setToastVisible(true);
        toastTimerRef.current = setTimeout(() => setToastVisible(false), 10000);
    };

    const dismissToast = () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastVisible(false);
    };

    const fetchAudit = async () => {
        if (!tableName) return;
        try {
            const response = await axiosInstance.get(buildUrl());
            const raw = response?.data ?? response;
            const results = Array.isArray(raw) ? raw : raw?.results || [];
            setLastFetched(new Date());
            setError(null);
            if (!results.length) { setLoading(false); return; }

            if (isFirstFetch.current) {
                setRows(results.slice(0, maxRows));
                lastIdRef.current = results[0].id;
                isFirstFetch.current = false;
                setLoading(false);
                return;
            }

            const fresh = results.filter((x) => x.id > lastIdRef.current);
            if (fresh.length) {
                lastIdRef.current = results[0].id;
                setRows((prev) => [...fresh, ...prev].slice(0, maxRows));
                setNewCount((n) => n + fresh.length);
                showToast(fresh);
            }
            setLoading(false);
        } catch (err) {
            console.error('AuditWidget error:', err);
            setError(`Failed to load: ${err?.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    // Re-init whenever tableName OR recordId changes
    useEffect(() => {
        if (!tableName) return;
        isFirstFetch.current = true;
        lastIdRef.current = null;
        setRows([]);
        setLoading(true);
        setError(null);
        fetchAudit();
        const interval = setInterval(fetchAudit, pollInterval);
        return () => { clearInterval(interval); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, [tableName, recordId]); // <-- recordId added as dependency

    const handleOpenPanel = () => { setPanelOpen(true); setNewCount(0); };

    const counts = rows.reduce(
        (acc, r) => {
            if (r.actionType === 'INSERT') acc.insert++;
            else if (r.actionType === 'UPDATE') acc.update++;
            else if (r.actionType === 'DELETE') acc.delete++;
            return acc;
        },
        { insert: 0, update: 0, delete: 0 }
    );

    // Panel title: show recordId scope if present
    const panelTitle = recordId != null && recordId !== ''
        ? `${tableName} #${recordId}`
        : tableName;

    return (
        <>
            {/* ── Toast only — no button ──────────────────────────────── */}
            <AnimatePresence>
                {toastVisible && toastRows.length > 0 && (
                    <ChangeToast freshRows={toastRows} onClose={dismissToast} onOpenPanel={handleOpenPanel} />
                )}
            </AnimatePresence>

            {/* ── Side Panel ──────────────────────────────────────────── */}
            <AnimatePresence>
                {panelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }} onClick={() => setPanelOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 1000 }}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            style={{
                                position: 'fixed', top: 0, right: 0, bottom: 0, width: 780,
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
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0F6E56', boxShadow: '0 0 0 2px #E1F5EE', animation: 'auditPulse 2s infinite' }} />
                                    <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{panelTitle}</span>
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#888' }}>{rows.length} records</span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[
                                            { label: 'INS', count: counts.insert, meta: ACTION_META.INSERT },
                                            { label: 'UPD', count: counts.update, meta: ACTION_META.UPDATE },
                                            { label: 'DEL', count: counts.delete, meta: ACTION_META.DELETE },
                                        ].map(({ label, count, meta }) => (
                                            <span key={label} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontWeight: 700 }}>
                                                {label} {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {lastFetched && <span style={{ fontSize: 10, color: '#bbb' }}>updated {lastFetched.toLocaleTimeString()}</span>}
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB' }}>
                                        live · {pollInterval / 1000}s
                                    </span>
                                    <button
                                        onClick={() => setPanelOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', cursor: 'pointer', color: '#888', fontSize: 14, transition: 'all 0.15s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FCEBEB'; e.currentTarget.style.color = '#A32D2D'; e.currentTarget.style.borderColor = '#F7C1C1'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e8e8e8'; }}
                                    >
                                        <i className="ti ti-x" />
                                    </button>
                                </div>
                            </div>

                            {/* Column Headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: '48px 56px 80px 100px 1fr 1fr 120px 24px', padding: '6px 16px', background: '#f7f7f7', borderBottom: '1px solid #efefef', flexShrink: 0 }}>
                                {['id', 'rec', 'action', 'column', 'old value', 'new value', 'changed at', ''].map((h, i) => (
                                    <span key={i} style={{ fontSize: 9, color: '#2686aca8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, padding: '0 2px' }}>{h}</span>
                                ))}
                            </div>

                            {/* Rows */}
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#bbb', fontSize: 12 }}>Loading...</div>}
                                {error && <div style={{ padding: '24px', textAlign: 'center', color: '#A32D2D', fontSize: 12 }}>{error}</div>}
                                {!loading && !error && rows.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: 12 }}>No audit records found.</div>}
                                <AnimatePresence initial={false}>
                                    {rows.map((row) => (
                                        <motion.div key={row.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                                            <PanelRow row={row} isExpanded={expandedId === row.id} onToggle={() => setExpandedId((prev) => (prev === row.id ? null : row.id))} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Panel Footer */}
                            <div style={{ padding: '8px 20px', borderTop: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ fontSize: 10, color: '#ccc' }}>click row to expand details</span>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {Object.entries(ACTION_META).map(([k, v]) => (
                                        <span key={k} style={{ fontSize: 10, color: v.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <i className={`ti ${v.icon}`} style={{ fontSize: 10 }} /> {k}
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
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #5dcb8bff; border-radius: 4px; }
            `}</style>
        </>
    );
};

export default AuditWidget2;