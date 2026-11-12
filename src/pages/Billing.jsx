import React, { useState } from "react";
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
  HistoryOutlined,
  CalendarOutlined,
  SyncOutlined,
  DownloadOutlined,
  StarOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  CloseOutlined,
  DollarOutlined,
  FilterOutlined,
} from "@ant-design/icons";

// ── Theme ─────────────────────────────────────────────────────────────────
const accent  = "#3b82f6";
const success = "#22c55e";
const warning = "#f59e0b";
const danger  = "#ef4444";

// ── Packages ──────────────────────────────────────────────────────────────
const PACKAGES = {
  silver: {
    name: "Silver",
    icon: <StarOutlined />,
    price: 4999,
    color: "#64748b",
    gradient: "linear-gradient(135deg,#e8edf5 0%,#a8b8cc 100%)",
    features: ["Up to 2 Data Centers","Basic 5D Viewer","5 User Accounts","Email Notifications"],
  },
  gold: {
    name: "Gold",
    icon: <CrownOutlined />,
    price: 12999,
    color: "#d97706",
    gradient: "linear-gradient(135deg,#fef9ec 0%,#f59e0b 100%)",
    features: ["Up to 10 Data Centers","Full 5D Viewer + ToolBox","25 User Accounts","Email + SMS Notifications","Advanced Analytics","API Access"],
  },
  platinum: {
    name: "Platinum",
    icon: <ThunderboltOutlined />,
    price: 29999,
    color: "#4f46e5",
    gradient: "linear-gradient(135deg,#f0f4ff 0%,#818cf8 100%)",
    features: ["Unlimited Data Centers","Full 5D Viewer + ToolBox","Unlimited Users","All Notification Channels","Predictive Maintenance","24/7 Dedicated Support"],
  },
};

// ── Static billing data ───────────────────────────────────────────────────
const INITIAL_BILLING = {
  currentPlan: "gold",
  nextBillingDate: "2026-03-01",
  totalAmount: 12999 * 14,
  paidAmount:  12999 * 12,
  transactions: [
    { id:"TXN-2026-014", date:"2026-02-01", amount:12999, status:"Pending", method:"Bank Transfer", invoice:"INV-2026-014" },
    { id:"TXN-2026-013", date:"2026-01-01", amount:12999, status:"Pending", method:"Bank Transfer", invoice:"INV-2026-013" },
    { id:"TXN-2025-012", date:"2025-12-01", amount:12999, status:"Paid",    method:"UPI",           invoice:"INV-2025-012" },
    { id:"TXN-2025-011", date:"2025-11-01", amount:12999, status:"Paid",    method:"UPI",           invoice:"INV-2025-011" },
    { id:"TXN-2025-010", date:"2025-10-01", amount:12999, status:"Paid",    method:"Credit Card",   invoice:"INV-2025-010" },
    { id:"TXN-2025-009", date:"2025-09-01", amount:12999, status:"Paid",    method:"Credit Card",   invoice:"INV-2025-009" },
    { id:"TXN-2025-008", date:"2025-08-01", amount:12999, status:"Paid",    method:"Credit Card",   invoice:"INV-2025-008" },
    { id:"TXN-2025-007", date:"2025-07-01", amount:12999, status:"Paid",    method:"Net Banking",   invoice:"INV-2025-007" },
    { id:"TXN-2025-006", date:"2025-06-01", amount:12999, status:"Paid",    method:"Net Banking",   invoice:"INV-2025-006" },
    { id:"TXN-2025-005", date:"2025-05-01", amount:12999, status:"Paid",    method:"UPI",           invoice:"INV-2025-005" },
    { id:"TXN-2025-004", date:"2025-04-01", amount:12999, status:"Paid",    method:"UPI",           invoice:"INV-2025-004" },
    { id:"TXN-2025-003", date:"2025-03-01", amount:12999, status:"Paid",    method:"Credit Card",   invoice:"INV-2025-003" },
    { id:"TXN-2025-002", date:"2025-02-01", amount:12999, status:"Paid",    method:"Credit Card",   invoice:"INV-2025-002" },
    { id:"TXN-2025-001", date:"2025-01-01", amount:12999, status:"Paid",    method:"Credit Card",   invoice:"INV-2025-001" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt     = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric" });

// ── Tiny reusable primitives (zero antd) ─────────────────────────────────
const SectionCard = ({ children, style = {} }) => (
  <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5eaf2", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", padding:20, ...style }}>
    {children}
  </div>
);

const StatBox = ({ icon, label, value, sub, color, topColor }) => (
  <SectionCard style={{ borderTop:`3px solid ${topColor}`, display:"flex", flexDirection:"column", gap:6 }}>
    <p style={{ margin:0, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", color:"#94a3b8" }}>{label}</p>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ color, fontSize:18 }}>{icon}</span>
      <span style={{ fontSize:26, fontWeight:800, color }}>{value}</span>
    </div>
    <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>{sub}</p>
  </SectionCard>
);

const Btn = ({ onClick, children, variant = "default", style = {} }) => {
  const base = { padding:"8px 18px", borderRadius:7, fontWeight:600, fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, border:"none", transition:"opacity 0.15s" };
  const variants = {
    default: { background:"#f1f5f9", color:"#374151", border:"1px solid #e2e8f0" },
    primary: { background:accent,  color:"#fff" },
    success: { background:success, color:"#fff" },
    danger:  { background:danger,  color:"#fff" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
};

const ProgressBar = ({ percent, color1 = accent, color2 = success }) => (
  <div style={{ position:"relative", height:14, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
    <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${percent}%`, borderRadius:99, background:`linear-gradient(90deg,${color1},${color2})`, transition:"width 0.5s ease" }} />
  </div>
);

// ── Custom Modal wrapper (pure HTML, no antd) ─────────────────────────────
const CustomModal = ({ open, onClose, title, titleIcon, width = 480, children }) => {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:9000 }}
      />
      <div style={{
        position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto",
        background:"#fff", borderRadius:12,
        boxShadow:"0 12px 40px rgba(0,0,0,0.2)",
        zIndex:9001,
      }}>
        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 22px 14px", borderBottom:"1px solid #f0f0f0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontWeight:700, fontSize:16, color:"#1e293b" }}>
            {titleIcon} {title}
          </div>
          <button onClick={onClose}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", fontSize:16, padding:4, lineHeight:1 }}>
            <CloseOutlined />
          </button>
        </div>
        {/* body */}
        <div style={{ padding:"18px 22px 22px" }}>
          {children}
        </div>
      </div>
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const Billing = () => {
  const [billing,          setBilling         ] = useState(INITIAL_BILLING);
  const [changePlanOpen,   setChangePlanOpen  ] = useState(false);
  const [selectedNewPlan,  setSelectedNewPlan ] = useState(null);
  const [payModalOpen,     setPayModalOpen    ] = useState(false);
  const [selectedTxn,      setSelectedTxn    ] = useState(null);
  const [payMethod,        setPayMethod       ] = useState("UPI");
  const [statusFilter,     setStatusFilter    ] = useState("All");
  const [toast,            setToast           ] = useState(null);
  const [page,             setPage            ] = useState(1);
  const PAGE_SIZE = 8;

  const pkg           = PACKAGES[billing.currentPlan];
  const pendingAmount = billing.totalAmount - billing.paidAmount;
  const pendingTxns   = billing.transactions.filter(t => t.status === "Pending");
  const paidTxns      = billing.transactions.filter(t => t.status === "Paid");
  const payProgress   = Math.round((billing.paidAmount / billing.totalAmount) * 100);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // filtered + paginated rows
  const filteredTxns = statusFilter === "All"
    ? billing.transactions
    : billing.transactions.filter(t => t.status === statusFilter);
  const totalPages  = Math.ceil(filteredTxns.length / PAGE_SIZE);
  const pagedTxns   = filteredTxns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // handlers
  const openChangePlan = () => { setSelectedNewPlan(billing.currentPlan); setChangePlanOpen(true); };

  const handleChangePlan = () => {
    if (selectedNewPlan === billing.currentPlan) { showToast("Already on this plan.", "info"); return; }
    setBilling(prev => ({ ...prev, currentPlan: selectedNewPlan }));
    showToast(`Plan changed to ${PACKAGES[selectedNewPlan].name}!`);
    setChangePlanOpen(false);
  };

  const openPayModal = (txn) => { setSelectedTxn(txn); setPayMethod("UPI"); setPayModalOpen(true); };

  const handlePayNow = () => {
    setBilling(prev => ({
      ...prev,
      paidAmount: prev.paidAmount + selectedTxn.amount,
      transactions: prev.transactions.map(t => t.id === selectedTxn.id ? { ...t, status:"Paid", method:payMethod } : t),
    }));
    showToast(`Payment of ${fmt(selectedTxn.amount)} recorded via ${payMethod}!`);
    setPayModalOpen(false);
    setSelectedTxn(null);
  };

  return (
    <div style={{ padding:"24px", background:"#f5f7fa", minHeight:"100vh", fontFamily:"'Segoe UI',sans-serif" }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position:"fixed", top:20, right:24, zIndex:9999,
          background: toast.type === "success" ? success : toast.type === "info" ? accent : danger,
          color:"#fff", padding:"12px 22px", borderRadius:10,
          fontWeight:600, fontSize:13,
          boxShadow:"0 4px 20px rgba(0,0,0,0.18)",
          animation:"fadeIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, display:"flex", alignItems:"center", gap:10, fontSize:24, fontWeight:800, color:"#1e293b" }}>
            <CreditCardOutlined style={{ color:accent }} />
            Billing &amp; Subscription
          </h2>
          <p style={{ margin:"4px 0 0", color:"#64748b", fontSize:13 }}>Manage your DCIM plan, payments, and invoices</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={() => showToast("Refreshed!", "info")}><SyncOutlined /> Refresh</Btn>
          <Btn onClick={openChangePlan} variant="primary"><SwapOutlined /> Change Plan</Btn>
        </div>
      </div>

      {/* ── 4 Summary Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>

        {/* Active Plan */}
        <SectionCard style={{ borderTop:`3px solid ${pkg.color}` }}>
          <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", color:"#94a3b8" }}>Active Plan</p>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:pkg.gradient, borderRadius:10, padding:"6px 14px", border:`1px solid ${pkg.color}40` }}>
            <span style={{ color:pkg.color, fontSize:16 }}>{pkg.icon}</span>
            <span style={{ fontWeight:700, color:pkg.color, fontSize:14 }}>{pkg.name}</span>
          </div>
          <p style={{ margin:"10px 0 0", fontSize:22, fontWeight:800, color:pkg.color }}>
            {fmt(pkg.price)} <span style={{ fontSize:12, fontWeight:400, color:"#94a3b8" }}>/ month</span>
          </p>
          <p style={{ margin:"6px 0 0", fontSize:11, color:"#94a3b8" }}>
            <CalendarOutlined style={{ marginRight:4 }} /> Next billing: {fmtDate(billing.nextBillingDate)}
          </p>
        </SectionCard>

        <StatBox icon={<DollarOutlined />}             label="Total Invoiced" topColor={accent}                           color={accent}  value={fmt(billing.totalAmount)} sub={`${billing.transactions.length} invoices generated`} />
        <StatBox icon={<CheckCircleOutlined />}         label="Amount Paid"   topColor={success}                          color={success} value={fmt(billing.paidAmount)}  sub={`${paidTxns.length} payments completed`} />
        <StatBox icon={<ExclamationCircleOutlined />}   label="Pending Amount" topColor={pendingAmount > 0 ? danger : success} color={pendingAmount > 0 ? danger : success} value={fmt(pendingAmount)} sub={`${pendingTxns.length} invoice${pendingTxns.length !== 1 ? "s" : ""} outstanding`} />
      </div>

      {/* ── Payment Progress ── */}
      <SectionCard style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>Payment Progress</span>
              <span style={{ fontSize:12, color:"#64748b" }}>{fmt(billing.paidAmount)} of {fmt(billing.totalAmount)}</span>
            </div>
            <ProgressBar percent={payProgress} />
            <p style={{ margin:"6px 0 0", fontSize:12, color:"#64748b", textAlign:"right" }}>{payProgress}% paid</p>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ textAlign:"center", padding:"10px 18px", borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
              <p style={{ margin:0, fontSize:20, fontWeight:800, color:success }}>{paidTxns.length}</p>
              <p style={{ margin:0, fontSize:11, color:"#64748b" }}>Paid</p>
            </div>
            <div style={{ textAlign:"center", padding:"10px 18px", borderRadius:10, background: pendingTxns.length > 0 ? "#fff7ed" : "#f0fdf4", border:`1px solid ${pendingTxns.length > 0 ? "#fed7aa" : "#bbf7d0"}` }}>
              <p style={{ margin:0, fontSize:20, fontWeight:800, color: pendingTxns.length > 0 ? warning : success }}>{pendingTxns.length}</p>
              <p style={{ margin:0, fontSize:11, color:"#64748b" }}>Pending</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Plan Features ── */}
      <SectionCard style={{ marginBottom:24, border:`1px solid ${pkg.color}30`, background:`${pkg.color}04` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:15, color:"#1e293b" }}>
            <span style={{ color:pkg.color, fontSize:16 }}>{pkg.icon}</span>
            Your Plan Features — {pkg.name}
          </div>
          <Btn onClick={openChangePlan} style={{ fontSize:12, padding:"5px 12px", color:pkg.color, background:"transparent", border:`1px solid ${pkg.color}50` }}>
            <SwapOutlined /> Upgrade / Downgrade
          </Btn>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:8 }}>
          {pkg.features.map((f, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151" }}>
              <CheckCircleOutlined style={{ color:pkg.color, flexShrink:0 }} /> {f}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Transaction Table ── */}
      <SectionCard>
        {/* Table header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <HistoryOutlined style={{ color:accent, fontSize:16 }} />
            <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>Transaction History</span>
            <span style={{ background:"#dbeafe", color:accent, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
              {billing.transactions.length} records
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {pendingTxns.length > 0 && (
              <span style={{ background:"#fff7ed", color:warning, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, border:"1px solid #fed7aa" }}>
                <ClockCircleOutlined style={{ marginRight:4 }} />{pendingTxns.length} Pending
              </span>
            )}
            <span style={{ background:"#f0fdf4", color:success, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, border:"1px solid #bbf7d0" }}>
              <CheckCircleOutlined style={{ marginRight:4 }} />{paidTxns.length} Paid
            </span>
            {/* Filter */}
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <FilterOutlined style={{ color:"#94a3b8", fontSize:12 }} />
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:12, color:"#374151", outline:"none", background:"#f8fafc", cursor:"pointer" }}>
                <option value="All">All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e5eaf2" }}>
                {["Invoice","Transaction ID","Date","Amount","Method","Status","Action"].map(h => (
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.5px", color:"#64748b", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedTxns.map((txn, i) => (
                <tr key={txn.id}
                  style={{ borderBottom:"1px solid #f0f4fa", background: txn.status === "Pending" ? "#fffbeb" : i % 2 === 0 ? "#fff" : "#fafbff", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = txn.status === "Pending" ? "#fef3c7" : "#f0f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background = txn.status === "Pending" ? "#fffbeb" : i % 2 === 0 ? "#fff" : "#fafbff"}
                >
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", fontWeight:700, color:accent, whiteSpace:"nowrap" }}>{txn.invoice}</td>
                  <td style={{ padding:"11px 12px", color:"#94a3b8", fontSize:11, whiteSpace:"nowrap" }}>{txn.id}</td>
                  <td style={{ padding:"11px 12px", whiteSpace:"nowrap" }}>{fmtDate(txn.date)}</td>
                  <td style={{ padding:"11px 12px", fontWeight:700, whiteSpace:"nowrap" }}>{fmt(txn.amount)}</td>
                  <td style={{ padding:"11px 12px" }}>
                    <span style={{ background:"#eff6ff", color:accent, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{txn.method}</span>
                  </td>
                  <td style={{ padding:"11px 12px" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontWeight:700, fontSize:12, color: txn.status === "Paid" ? success : warning }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background: txn.status === "Paid" ? success : warning, display:"inline-block" }} />
                      {txn.status}
                    </span>
                  </td>
                  <td style={{ padding:"11px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button
                        title="Download Invoice"
                        onClick={() => alert(`Downloading ${txn.invoice}…`)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:accent, fontSize:14, padding:4, borderRadius:5, lineHeight:1 }}
                        onMouseEnter={e => e.currentTarget.style.background="#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background="none"}
                      >
                        <DownloadOutlined />
                      </button>
                      {txn.status === "Pending" && (
                        <button
                          onClick={() => openPayModal(txn)}
                          style={{ padding:"4px 12px", background:success, color:"#fff", border:"none", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}
                          onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                          onMouseLeave={e => e.currentTarget.style.opacity="1"}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pagedTxns.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding:"32px", textAlign:"center", color:"#94a3b8", fontSize:13 }}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, flexWrap:"wrap", gap:8 }}>
            <span style={{ fontSize:12, color:"#64748b" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTxns.length)} of {filteredTxns.length}
            </span>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0", background: page === 1 ? "#f1f5f9" : "#fff", color: page === 1 ? "#cbd5e1" : "#374151", cursor: page === 1 ? "not-allowed" : "pointer", fontSize:12, fontWeight:600 }}>
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding:"5px 10px", borderRadius:6, border:"1px solid", borderColor: page === p ? accent : "#e2e8f0", background: page === p ? accent : "#fff", color: page === p ? "#fff" : "#374151", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0", background: page === totalPages ? "#f1f5f9" : "#fff", color: page === totalPages ? "#cbd5e1" : "#374151", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize:12, fontWeight:600 }}>
                Next ›
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Footer ── */}
      <div style={{ marginTop:24, textAlign:"center", padding:"14px 0", borderTop:"1px solid #f0f0f0" }}>
        <span style={{ fontSize:12, color:"#94a3b8" }}>DCIM Billing Portal</span>
      </div>


      {/* ══════════ CHANGE PLAN MODAL ══════════ */}
      <CustomModal
        open={changePlanOpen}
        onClose={() => setChangePlanOpen(false)}
        title="Change Plan"
        titleIcon={<SwapOutlined style={{ color:accent }} />}
        width={520}
      >
        <p style={{ margin:"0 0 14px", fontSize:13, color:"#64748b" }}>Select the plan you want to switch to:</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {Object.entries(PACKAGES).map(([key, p]) => (
            <div key={key} onClick={() => setSelectedNewPlan(key)}
              style={{
                borderRadius:12, padding:"14px 16px", cursor:"pointer",
                border:`2px solid ${selectedNewPlan === key ? p.color : "#e2e8f0"}`,
                background: selectedNewPlan === key ? `${p.color}08` : "#fff",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                transition:"all 0.18s",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:p.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, color:p.color }}>{p.icon}</div>
                <div>
                  <div style={{ fontWeight:700, color:"#1e293b", fontSize:14 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{fmt(p.price)} / month</div>
                </div>
              </div>
              {selectedNewPlan === key && <CheckCircleOutlined style={{ color:p.color, fontSize:20 }} />}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:22 }}>
          <Btn onClick={() => setChangePlanOpen(false)}>Cancel</Btn>
          <Btn onClick={handleChangePlan} variant="primary">Confirm Change</Btn>
        </div>
      </CustomModal>

      {/* ══════════ PAY NOW MODAL ══════════ */}
      <CustomModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Make Payment"
        titleIcon={<CreditCardOutlined style={{ color:success }} />}
        width={420}
      >
        {selectedTxn && (
          <>
            {/* Invoice summary */}
            <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px", marginBottom:18, border:"1px solid #e2e8f0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"#64748b", fontSize:13 }}>Invoice</span>
                <span style={{ fontFamily:"monospace", fontWeight:700, color:accent }}>{selectedTxn.invoice}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"#64748b", fontSize:13 }}>Due Date</span>
                <span style={{ fontSize:13 }}>{fmtDate(selectedTxn.date)}</span>
              </div>
              <hr style={{ border:"none", borderTop:"1px solid #e2e8f0", margin:"10px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:14 }}>Amount Due</span>
                <span style={{ fontWeight:800, fontSize:20, color:danger }}>{fmt(selectedTxn.amount)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontWeight:600, marginBottom:8, fontSize:13, color:"#374151" }}>Payment Method</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", borderRadius:7, border:"1px solid #d9d9d9", fontSize:14, color:"#1e293b", outline:"none", background:"#fff" }}>
                <option>UPI</option>
                <option>Credit Card</option>
                <option>Net Banking</option>
                <option>Bank Transfer</option>
              </select>
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <Btn onClick={() => setPayModalOpen(false)}>Cancel</Btn>
              <Btn onClick={handlePayNow} variant="success">
                <CheckCircleOutlined /> Pay {fmt(selectedTxn.amount)}
              </Btn>
            </div>
          </>
        )}
      </CustomModal>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default Billing;