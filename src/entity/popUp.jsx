// // popUp.jsx — ConfirmMethodModal (Auto Alert Style)
// import React, { useEffect, useState } from 'react';

// const TYPE_CONFIG = {
//     add: {
//         bgGradient:   'linear-gradient(135deg, #0ea36b 0%, #047857 100%)',
//         lightBg:      '#ecfdf5',
//         border:       '#6ee7b7',
//         color:        '#0ea36b',
//         icon:         '＋',
//         label:        'Creating New Record',
//         sublabel:     'New device type will be added to the system',
//         confirmBg:    '#0ea36b',
//         confirmHover: '#047857',
//         confirmShadow:'#0ea36b',
//         confirmText:  'Yes, Create',
//         dotColor:     '#0ea36b',
//     },
//     edit: {
//         bgGradient:   'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
//         lightBg:      '#eff6ff',
//         border:       '#93c5fd',
//         color:        '#2563eb',
//         icon:         '✎',
//         label:        'Updating Record',
//         sublabel:     'Changes will be saved to the existing device type',
//         confirmBg:    '#2563eb',
//         confirmHover: '#1d4ed8',
//         confirmShadow:'#2563eb',
//         confirmText:  'Yes, Update',
//         dotColor:     '#2563eb',
//     },
//     delete: {
//         bgGradient:   'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
//         lightBg:      '#fef2f2',
//         border:       '#fca5a5',
//         color:        '#dc2626',
//         icon:         '⌫',
//         label:        'Delete Record',
//         sublabel:     'This action is permanent and cannot be undone',
//         confirmBg:    '#dc2626',
//         confirmHover: '#b91c1c',
//         confirmShadow:'#dc2626',
//         confirmText:  'Yes, Delete',
//         dotColor:     '#dc2626',
//     },
// };

// /* ── Single key-value row ── */
// const DataRow = ({ label, value, valueColor }) => (
//     <div style={{
//         display:      'flex',
//         alignItems:   'flex-start',
//         gap:          10,
//         padding:      '5px 0',
//         borderBottom: '1px solid rgba(0,0,0,0.05)',
//     }}>
//         <span style={{
//             fontSize:      10,
//             color:         '#94a3b8',
//             minWidth:      70,
//             flexShrink:    0,
//             paddingTop:    1,
//             fontFamily:    "'DM Mono','Fira Mono',monospace",
//             textTransform: 'uppercase',
//             letterSpacing: '0.06em',
//         }}>
//             {label}
//         </span>
//         <span style={{
//             fontSize:   12,
//             color:      valueColor || '#1e293b',
//             fontWeight: valueColor ? 600 : 400,
//             wordBreak:  'break-all',
//             lineHeight: 1.5,
//         }}>
//             {value !== undefined && value !== null && value !== '' ? String(value) : '—'}
//         </span>
//     </div>
// );

// /* ── Section heading ── */
// const SectionHead = ({ dot, label }) => (
//     <div style={{
//         fontSize:      10,
//         fontWeight:    700,
//         color:         dot,
//         letterSpacing: '0.1em',
//         textTransform: 'uppercase',
//         marginBottom:  8,
//         display:       'flex',
//         alignItems:    'center',
//         gap:           6,
//     }}>
//         <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
//         {label}
//     </div>
// );

// /* ══════════════════════════════════════════════════════════════════════════ */
// const ConfirmMethodModal = ({ visible, type = 'add', oldData, newData, onCancel, onConfirm }) => {
//     const [loading, setLoading] = useState(false);
//     const [entered, setEntered] = useState(false);

//     const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.add;

//     useEffect(() => {
//         if (visible) {
//             setLoading(false);
//             setEntered(false);
//             const t = setTimeout(() => setEntered(true), 12);
//             return () => clearTimeout(t);
//         }
//     }, [visible]);

//     if (!visible) return null;

//     const handleConfirm = async () => {
//         setLoading(true);
//         try { await onConfirm(); }
//         finally { setLoading(false); }
//     };

//     const handleBackdrop = (e) => {
//         if (e.target === e.currentTarget && !loading) onCancel();
//     };

//     const showNewOnly = type === 'add'  && newData;
//     const showDiff    = type === 'edit' && oldData && newData;
//     const isDelete    = type === 'delete';

//     return (
//         <>
//             {/* Backdrop */}
//             <div
//                 onClick={handleBackdrop}
//                 style={{
//                     position:        'fixed',
//                     inset:           0,
//                     backgroundColor: 'rgba(2,6,23,0.58)',
//                     backdropFilter:  'blur(3px)',
//                     zIndex:          1050,
//                     display:         'flex',
//                     alignItems:      'center',
//                     justifyContent:  'center',
//                 }}
//             >
//                 {/* Card */}
//                 <div
//                     onClick={(e) => e.stopPropagation()}
//                     style={{
//                         background:   '#ffffff',
//                         borderRadius: 14,
//                         width:        isDelete ? 400 : 480,   // ← delete ke liye thoda narrow
//                         maxWidth:     '94vw',
//                         boxShadow:    '0 24px 64px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.10)',
//                         overflow:     'hidden',
//                         transform:    entered ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(18px)',
//                         opacity:      entered ? 1 : 0,
//                         transition:   'transform 0.24s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
//                     }}
//                 >
//                     {/* ── Header ── */}
//                     <div style={{
//                         background: cfg.bgGradient,
//                         padding:    '18px 20px 16px 20px',
//                         position:   'relative',
//                         overflow:   'hidden',
//                     }}>
//                         {/* decorative circles */}
//                         <div style={{
//                             position: 'absolute', right: -30, top: -30,
//                             width: 110, height: 110, borderRadius: '50%',
//                             background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
//                         }} />
//                         <div style={{
//                             position: 'absolute', right: 18, bottom: -22,
//                             width: 68, height: 68, borderRadius: '50%',
//                             background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
//                         }} />

//                         <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
//                             {/* Icon */}
//                             <div style={{
//                                 width: 46, height: 46, borderRadius: 12,
//                                 background: 'rgba(255,255,255,0.18)',
//                                 border: '1.5px solid rgba(255,255,255,0.28)',
//                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                 fontSize: 22, color: '#fff', flexShrink: 0,
//                             }}>
//                                 {cfg.icon}
//                             </div>

//                             <div style={{ flex: 1 }}>
//                                 <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
//                                     {cfg.label}
//                                 </div>
//                                 <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>
//                                     {cfg.sublabel}
//                                 </div>
//                             </div>

//                             {!loading && (
//                                 <button
//                                     onClick={onCancel}
//                                     style={{
//                                         background: 'rgba(255,255,255,0.15)',
//                                         border: '1px solid rgba(255,255,255,0.25)',
//                                         borderRadius: 7, width: 28, height: 28,
//                                         cursor: 'pointer', color: '#fff', fontSize: 13,
//                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                         flexShrink: 0, transition: 'background 0.15s', lineHeight: 1,
//                                     }}
//                                     onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
//                                     onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
//                                 >
//                                     ✕
//                                 </button>
//                             )}
//                         </div>
//                     </div>

//                     {/* ── Body ── */}
//                     <div style={{ padding: '20px 20px 6px 20px', maxHeight: '54vh', overflowY: 'auto' }}>

//                         {/* ADD — show new data */}
//                         {showNewOnly && (
//                             <div style={{ marginBottom: 14 }}>
//                                 <SectionHead dot={cfg.dotColor} label="New Record Details" />
//                                 <div style={{
//                                     background: cfg.lightBg, border: `1px solid ${cfg.border}`,
//                                     borderRadius: 9, padding: '10px 14px',
//                                 }}>
//                                     {Object.entries(newData).map(([k, v]) => (
//                                         <DataRow key={k} label={k} value={v} />
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         {/* EDIT — before / after diff */}
//                         {showDiff && (
//                             <div style={{ marginBottom: 14 }}>
//                                 <SectionHead dot="#64748b" label="Changes Summary" />
//                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
//                                     <div style={{
//                                         background: '#fef2f2', border: '1px solid #fca5a5',
//                                         borderRadius: 9, padding: '10px 12px',
//                                     }}>
//                                         <div style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Before</div>
//                                         {Object.entries(oldData).map(([k, v]) => (
//                                             <DataRow key={k} label={k} value={v} valueColor="#b91c1c" />
//                                         ))}
//                                     </div>
//                                     <div style={{
//                                         background: '#eff6ff', border: '1px solid #93c5fd',
//                                         borderRadius: 9, padding: '10px 12px',
//                                     }}>
//                                         <div style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>After</div>
//                                         {Object.entries(newData).map(([k, v]) => (
//                                             <DataRow key={k} label={k} value={v} valueColor="#1d4ed8" />
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         DELETE — sirf alert, koi data nahi ──
//                         {isDelete && (
//                             <div style={{ marginBottom: 14 }}>
//                                 {/* Big warning icon block */}
//                                 <div style={{
//                                     display:        'flex',
//                                     flexDirection:  'column',
//                                     alignItems:     'center',
//                                     justifyContent: 'center',
//                                     gap:            12,
//                                     padding:        '20px 16px 16px',
//                                 }}>
//                                     {/* Animated warning ring */}
//                                     <div style={{
//                                         width:        64,
//                                         height:       64,
//                                         borderRadius: '50%',
//                                         background:   '#fef2f2',
//                                         border:       '2px solid #fca5a5',
//                                         display:      'flex',
//                                         alignItems:   'center',
//                                         justifyContent:'center',
//                                         fontSize:     30,
//                                         boxShadow:    '0 0 0 6px #fee2e2',
//                                         animation:    'deletePulse 2s ease-in-out infinite',
//                                     }}>
//                                         🗑️
//                                     </div>

//                                     <div style={{ textAlign: 'center' }}>
//                                         <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
//                                             Are you sure?
//                                         </div>
//                                         <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, maxWidth: 290 }}>
//                                             This record will be <strong style={{ color: '#dc2626' }}>permanently deleted</strong> and cannot be recovered.
//                                         </div>
//                                     </div>

//                                     {/* Warning strip */}
//                                     <div style={{
//                                         width:        '100%',
//                                         background:   '#fff7ed',
//                                         border:       '1px solid #fed7aa',
//                                         borderRadius: 9,
//                                         padding:      '10px 14px',
//                                         display:      'flex',
//                                         alignItems:   'flex-start',
//                                         gap:          9,
//                                     }}>
//                                         <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>⚠️</span>
//                                         <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500, lineHeight: 1.55 }}>
//                                             All associated data may also be affected. This action <strong>cannot be undone</strong>.
//                                         </span>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Fallback */}
//                         {!showNewOnly && !showDiff && !isDelete && (
//                             <div style={{ padding: '12px 0', color: '#475569', fontSize: 13, textAlign: 'center' }}>
//                                 Are you sure you want to proceed?
//                             </div>
//                         )}
//                     </div>

//                     {/* ── Footer ── */}
//                     <div style={{
//                         padding:        '14px 20px',
//                         borderTop:      '1px solid #f1f5f9',
//                         display:        'flex',
//                         justifyContent: 'flex-end',
//                         alignItems:     'center',
//                         gap:            10,
//                         background:     '#f8fafc',
//                     }}>
//                         <button
//                             onClick={onCancel}
//                             disabled={loading}
//                             style={{
//                                 padding: '9px 20px', borderRadius: 8,
//                                 border: '1.5px solid #e2e8f0', background: '#fff',
//                                 color: '#334155', fontSize: 13, fontWeight: 500,
//                                 cursor: loading ? 'not-allowed' : 'pointer',
//                                 opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
//                                 fontFamily: 'inherit', lineHeight: 1,
//                             }}
//                             onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
//                             onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
//                         >
//                             Cancel
//                         </button>

//                         <button
//                             onClick={handleConfirm}
//                             disabled={loading}
//                             style={{
//                                 padding: '9px 24px', borderRadius: 8, border: 'none',
//                                 background: loading ? '#94a3b8' : cfg.confirmBg,
//                                 color: '#fff', fontSize: 13, fontWeight: 600,
//                                 cursor: loading ? 'not-allowed' : 'pointer',
//                                 transition: 'all 0.15s', fontFamily: 'inherit',
//                                 display: 'flex', alignItems: 'center', gap: 8,
//                                 boxShadow: loading ? 'none' : `0 2px 10px ${cfg.confirmShadow}55`,
//                                 lineHeight: 1,
//                             }}
//                             onMouseEnter={(e) => {
//                                 if (!loading) {
//                                     e.currentTarget.style.background  = cfg.confirmHover;
//                                     e.currentTarget.style.boxShadow   = `0 4px 16px ${cfg.confirmShadow}77`;
//                                     e.currentTarget.style.transform   = 'translateY(-1px)';
//                                 }
//                             }}
//                             onMouseLeave={(e) => {
//                                 if (!loading) {
//                                     e.currentTarget.style.background  = cfg.confirmBg;
//                                     e.currentTarget.style.boxShadow   = `0 2px 10px ${cfg.confirmShadow}55`;
//                                     e.currentTarget.style.transform   = 'translateY(0)';
//                                 }
//                             }}
//                         >
//                             {loading && (
//                                 <span style={{
//                                     width: 13, height: 13,
//                                     border: '2px solid rgba(255,255,255,0.35)',
//                                     borderTopColor: '#fff', borderRadius: '50%',
//                                     display: 'inline-block', flexShrink: 0,
//                                     animation: 'cmSpin 0.65s linear infinite',
//                                 }} />
//                             )}
//                             {loading ? 'Deleting...' : cfg.confirmText}
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <style>{`
//                 @keyframes cmSpin { to { transform: rotate(360deg); } }
//                 @keyframes deletePulse {
//                     0%, 100% { box-shadow: 0 0 0 6px #fee2e2; }
//                     50%       { box-shadow: 0 0 0 10px #fecaca; }
//                 }
//             `}</style>
//         </>
//     );
// };

// export default ConfirmMethodModal;


{/* <>2-30i4i13-092ui9u9u</> */}


// popUp.jsx — ConfirmMethodModal + SuccessModal
// import React, { useEffect, useState } from 'react';

// const TYPE_CONFIG = {
//     add: {
//         bgGradient:    'linear-gradient(135deg, #0ea36b 0%, #047857 100%)',
//         lightBg:       '#ecfdf5',
//         border:        '#6ee7b7',
//         icon:          '＋',
//         label:         'Creating New Record',
//         sublabel:      'New device type will be added to the system',
//         confirmBg:     '#0ea36b',
//         confirmHover:  '#047857',
//         confirmShadow: '#0ea36b',
//         confirmText:   'Yes, Create',
//         dotColor:      '#0ea36b',
//     },
//     edit: {
//         bgGradient:    'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
//         lightBg:       '#eff6ff',
//         border:        '#93c5fd',
//         icon:          '✎',
//         label:         'Updating Record',
//         sublabel:      'Changes will be saved to the existing device type',
//         confirmBg:     '#2563eb',
//         confirmHover:  '#1d4ed8',
//         confirmShadow: '#2563eb',
//         confirmText:   'Yes, Update',
//         dotColor:      '#2563eb',
//     },
// };

// const SUCCESS_CONFIG = {
//     add: {
//         title:    'Record Created!',
//         subtitle: 'New item has been added successfully.',
//         color:    '#0ea36b',
//         lightBg:  '#ecfdf5',
//         border:   '#6ee7b7',
//     },
//     edit: {
//         title:    'Details Updated!',
//         subtitle: 'Record has been updated successfully.',
//         color:    '#2563eb',
//         lightBg:  '#eff6ff',
//         border:   '#93c5fd',
//     },
// };

// /* ── Single key-value row ── */
// const DataRow = ({ label, value, valueColor }) => (
//     <div style={{
//         display: 'flex', alignItems: 'flex-start', gap: 10,
//         padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
//     }}>
//         <span style={{
//             fontSize: 10, color: '#94a3b8', minWidth: 70, flexShrink: 0,
//             paddingTop: 1, fontFamily: "'DM Mono','Fira Mono',monospace",
//             textTransform: 'uppercase', letterSpacing: '0.06em',
//         }}>
//             {label}
//         </span>
//         <span style={{
//             fontSize: 12, color: valueColor || '#1e293b',
//             fontWeight: valueColor ? 600 : 400, wordBreak: 'break-all', lineHeight: 1.5,
//         }}>
//             {value !== undefined && value !== null && value !== '' ? String(value) : '—'}
//         </span>
//     </div>
// );

// /* ── Section heading ── */
// const SectionHead = ({ dot, label }) => (
//     <div style={{
//         fontSize: 10, fontWeight: 700, color: dot, letterSpacing: '0.1em',
//         textTransform: 'uppercase', marginBottom: 8,
//         display: 'flex', alignItems: 'center', gap: 6,
//     }}>
//         <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
//         {label}
//     </div>
// );

// /* ══════════════════════════════════════════════════════════
//    SUCCESS MODAL — add/edit ke baad dikhta hai
//    Props: visible, type ('add'|'edit'), onClose
// ══════════════════════════════════════════════════════════ */
// export const SuccessModal = ({ visible, type = 'add', onClose }) => {
//     const [entered, setEntered] = useState(false);
//     const cfg = SUCCESS_CONFIG[type] || SUCCESS_CONFIG.add;

//     useEffect(() => {
//         if (visible) {
//             setEntered(false);
//             const t = setTimeout(() => setEntered(true), 12);
//             return () => clearTimeout(t);
//         }
//     }, [visible]);

//     if (!visible) return null;

//     return (
//         <>
//             <div
//                 onClick={onClose}
//                 style={{
//                     position: 'fixed', inset: 0,
//                     backgroundColor: 'rgba(2,6,23,0.50)',
//                     backdropFilter: 'blur(3px)',
//                     zIndex: 1060,
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 }}
//             >
//                 <div
//                     onClick={(e) => e.stopPropagation()}
//                     style={{
//                         background: '#fff', borderRadius: 16,
//                         width: 340, maxWidth: '92vw',
//                         boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
//                         overflow: 'hidden',
//                         transform: entered ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(24px)',
//                         opacity: entered ? 1 : 0,
//                         transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
//                     }}
//                 >
//                     {/* Top accent bar */}
//                     <div style={{ height: 4, background: cfg.color }} />

//                     {/* Body */}
//                     <div style={{
//                         padding: '28px 24px 20px',
//                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
//                         textAlign: 'center',
//                     }}>
//                         {/* Animated checkmark circle */}
//                         <div style={{
//                             width: 64, height: 64, borderRadius: '50%',
//                             background: cfg.lightBg, border: `2px solid ${cfg.border}`,
//                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                             fontSize: 28, color: cfg.color,
//                             boxShadow: `0 0 0 6px ${cfg.lightBg}`,
//                             animation: 'successPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
//                         }}>
//                             ✓
//                         </div>

//                         <div>
//                             <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
//                                 {cfg.title}
//                             </div>
//                             <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
//                                 {cfg.subtitle}
//                             </div>
//                         </div>

//                         {/* Okay button */}
//                         <button
//                             onClick={onClose}
//                             style={{
//                                 marginTop: 6,
//                                 width: '100%', padding: '10px 0',
//                                 borderRadius: 9, border: 'none',
//                                 background: cfg.color, color: '#fff',
//                                 fontSize: 14, fontWeight: 600,
//                                 cursor: 'pointer', transition: 'all 0.15s',
//                                 fontFamily: 'inherit',
//                                 boxShadow: `0 2px 10px ${cfg.color}55`,
//                             }}
//                             onMouseEnter={(e) => {
//                                 e.currentTarget.style.filter = 'brightness(0.9)';
//                                 e.currentTarget.style.transform = 'translateY(-1px)';
//                             }}
//                             onMouseLeave={(e) => {
//                                 e.currentTarget.style.filter = 'none';
//                                 e.currentTarget.style.transform = 'translateY(0)';
//                             }}
//                         >
//                             Okay
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <style>{`
//                 @keyframes successPop {
//                     0%   { transform: scale(0.5); opacity: 0; }
//                     100% { transform: scale(1);   opacity: 1; }
//                 }
//             `}</style>
//         </>
//     );
// };

// /* ══════════════════════════════════════════════════════════
//    CONFIRM MODAL — add / edit only (delete removed)
// ══════════════════════════════════════════════════════════ */
// const ConfirmMethodModal = ({ visible, type = 'add', oldData, newData, onCancel, onConfirm }) => {
//     const [loading, setLoading] = useState(false);
//     const [entered, setEntered] = useState(false);

//     const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.add;

//     useEffect(() => {
//         if (visible) {
//             setLoading(false);
//             setEntered(false);
//             const t = setTimeout(() => setEntered(true), 12);
//             return () => clearTimeout(t);
//         }
//     }, [visible]);

//     if (!visible) return null;

//     const handleConfirm = async () => {
//         setLoading(true);
//         try { await onConfirm(); }
//         finally { setLoading(false); }
//     };

//     const handleBackdrop = (e) => {
//         if (e.target === e.currentTarget && !loading) onCancel();
//     };

//     const showNewOnly = type === 'add'  && newData;
//     const showDiff    = type === 'edit' && oldData && newData;

//     return (
//         <>
//             <div
//                 onClick={handleBackdrop}
//                 style={{
//                     position: 'fixed', inset: 0,
//                     backgroundColor: 'rgba(2,6,23,0.58)',
//                     backdropFilter: 'blur(3px)',
//                     zIndex: 1050,
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 }}
//             >
//                 <div
//                     onClick={(e) => e.stopPropagation()}
//                     style={{
//                         background: '#ffffff', borderRadius: 14,
//                         width: 480, maxWidth: '94vw',
//                         boxShadow: '0 24px 64px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.10)',
//                         overflow: 'hidden',
//                         transform: entered ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(18px)',
//                         opacity: entered ? 1 : 0,
//                         transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
//                     }}
//                 >
//                     {/* Header */}
//                     <div style={{
//                         background: cfg.bgGradient, padding: '18px 20px 16px',
//                         position: 'relative', overflow: 'hidden',
//                     }}>
//                         <div style={{ position: 'absolute', right: -30, top: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
//                         <div style={{ position: 'absolute', right: 18, bottom: -22, width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

//                         <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
//                             <div style={{
//                                 width: 46, height: 46, borderRadius: 12,
//                                 background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.28)',
//                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                 fontSize: 22, color: '#fff', flexShrink: 0,
//                             }}>
//                                 {cfg.icon}
//                             </div>
//                             <div style={{ flex: 1 }}>
//                                 <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{cfg.label}</div>
//                                 <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>{cfg.sublabel}</div>
//                             </div>
//                             {!loading && (
//                                 <button
//                                     onClick={onCancel}
//                                     style={{
//                                         background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
//                                         borderRadius: 7, width: 28, height: 28, cursor: 'pointer',
//                                         color: '#fff', fontSize: 13, display: 'flex',
//                                         alignItems: 'center', justifyContent: 'center',
//                                         flexShrink: 0, transition: 'background 0.15s', lineHeight: 1,
//                                     }}
//                                     onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
//                                     onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
//                                 >
//                                     ✕
//                                 </button>
//                             )}
//                         </div>
//                     </div>

//                     {/* Body */}
//                     <div style={{ padding: '18px 20px 6px', maxHeight: '54vh', overflowY: 'auto' }}>

//                         {/* ADD */}
//                         {showNewOnly && (
//                             <div style={{ marginBottom: 14 }}>
//                                 <SectionHead dot={cfg.dotColor} label="New Record Details" />
//                                 <div style={{ background: cfg.lightBg, border: `1px solid ${cfg.border}`, borderRadius: 9, padding: '10px 14px' }}>
//                                     {Object.entries(newData).map(([k, v]) => (
//                                         <DataRow key={k} label={k} value={v} />
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         {/* EDIT */}
//                         {showDiff && (
//                             <div style={{ marginBottom: 14 }}>
//                                 <SectionHead dot="#64748b" label="Changes Summary" />
//                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
//                                     <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, padding: '10px 12px' }}>
//                                         <div style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Before</div>
//                                         {Object.entries(oldData).map(([k, v]) => (
//                                             <DataRow key={k} label={k} value={v} valueColor="#b91c1c" />
//                                         ))}
//                                     </div>
//                                     <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 9, padding: '10px 12px' }}>
//                                         <div style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>After</div>
//                                         {Object.entries(newData).map(([k, v]) => (
//                                             <DataRow key={k} label={k} value={v} valueColor="#1d4ed8" />
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Fallback */}
//                         {!showNewOnly && !showDiff && (
//                             <div style={{ padding: '12px 0', color: '#475569', fontSize: 13, textAlign: 'center' }}>
//                                 Are you sure you want to proceed?
//                             </div>
//                         )}
//                     </div>

//                     {/* Footer */}
//                     <div style={{
//                         padding: '14px 20px', borderTop: '1px solid #f1f5f9',
//                         display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
//                         gap: 10, background: '#f8fafc',
//                     }}>
//                         <button
//                             onClick={onCancel}
//                             disabled={loading}
//                             style={{
//                                 padding: '9px 20px', borderRadius: 8,
//                                 border: '1.5px solid #e2e8f0', background: '#fff',
//                                 color: '#334155', fontSize: 13, fontWeight: 500,
//                                 cursor: loading ? 'not-allowed' : 'pointer',
//                                 opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
//                                 fontFamily: 'inherit', lineHeight: 1,
//                             }}
//                             onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
//                             onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
//                         >
//                             Cancel
//                         </button>

//                         <button
//                             onClick={handleConfirm}
//                             disabled={loading}
//                             style={{
//                                 padding: '9px 24px', borderRadius: 8, border: 'none',
//                                 background: loading ? '#94a3b8' : cfg.confirmBg,
//                                 color: '#fff', fontSize: 13, fontWeight: 600,
//                                 cursor: loading ? 'not-allowed' : 'pointer',
//                                 transition: 'all 0.15s', fontFamily: 'inherit',
//                                 display: 'flex', alignItems: 'center', gap: 8,
//                                 boxShadow: loading ? 'none' : `0 2px 10px ${cfg.confirmShadow}55`,
//                                 lineHeight: 1,
//                             }}
//                             onMouseEnter={(e) => {
//                                 if (!loading) {
//                                     e.currentTarget.style.background  = cfg.confirmHover;
//                                     e.currentTarget.style.boxShadow   = `0 4px 16px ${cfg.confirmShadow}77`;
//                                     e.currentTarget.style.transform   = 'translateY(-1px)';
//                                 }
//                             }}
//                             onMouseLeave={(e) => {
//                                 if (!loading) {
//                                     e.currentTarget.style.background  = cfg.confirmBg;
//                                     e.currentTarget.style.boxShadow   = `0 2px 10px ${cfg.confirmShadow}55`;
//                                     e.currentTarget.style.transform   = 'translateY(0)';
//                                 }
//                             }}
//                         >
//                             {loading && (
//                                 <span style={{
//                                     width: 13, height: 13,
//                                     border: '2px solid rgba(255,255,255,0.35)',
//                                     borderTopColor: '#fff', borderRadius: '50%',
//                                     display: 'inline-block', flexShrink: 0,
//                                     animation: 'cmSpin 0.65s linear infinite',
//                                 }} />
//                             )}
//                             {loading ? 'Processing...' : cfg.confirmText}
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <style>{`
//                 @keyframes cmSpin { to { transform: rotate(360deg); } }
//             `}</style>
//         </>
//     );
// };

// export default ConfirmMethodModal;


// SuccessModal — sirf "added" aur "updated" alert
import React from "react";

export const SuccessModal = ({ visible, type = 'add', onClose, itemName = 'Item' }) => {
    if (!visible) return null;

    const message =
        type === 'edit'
            ? `${itemName} updated successfully.`
            : `${itemName} added successfully.`;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px',
                zIndex: 1060,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 10,
                    padding: '24px 28px', width: 300, maxWidth: '90vw',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    textAlign: 'center',
                }}
            >
                <p style={{ margin: '0 0 18px', fontSize: 15, color: '#1e293b' }}>
                    {message}
                </p>
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px 24px', borderRadius: 7, border: 'none',
                        background: '#2563eb', color: '#fff',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;