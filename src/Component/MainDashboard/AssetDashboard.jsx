import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

const ANIM = {
  counter: 2800, gauge: 3200, gaugeDelay: 500,
  line: 3500, hbar: 2200, hbarStagger: 150,
  donut: 2600, spark: 2800, kpiStagger: 100,
  interval: 60000
};

const C = {
  bg: "#eef2f9", panel: "#ffffff", border: "#d8e2f0",
  nav: "#1b3060", blue: "#1a5fff", cyan: "#0099d4",
  green: "#09b86e", yellow: "#f0a500", red: "#e02b45",
  orange: "#e8621a", purple: "#6d28d9", teal: "#0891b2",
  indigo: "#3730a3", pink: "#db2777",
  text: "#111d3c", sub: "#5a6a8a", muted: "#8898b8",
  accent: "#e4ecf8", accentB: "#c5d4ec",
  shadow: "0 1px 8px rgba(20,40,100,0.09)",
  shadowMd: "0 3px 16px rgba(20,40,100,0.13)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:#eef2f9}
  ::-webkit-scrollbar-thumb{background:#c5d4ec;border-radius:2px}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes glow{0%,100%{box-shadow:0 0 6px #1a5fff44}50%{box-shadow:0 0 18px #1a5fff88}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
  @keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .fade-up{animation:fadeUp .6s ease-out forwards}
  .pulse{animation:pulse 2s ease-in-out infinite}
  .blink{animation:blink 1.3s ease-in-out infinite}
  .glow-btn{animation:glow 2.5s ease-in-out infinite}
  .row-in{animation:rowIn .4s ease-out forwards}
  tr:hover td{background:#f4f8ff !important}
`;

function useAnim(dur, delay = 0) {
  const [p, setP] = useState(0);
  const [key, setKey] = useState(0);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);

  const runAnimation = useCallback(() => {
    setP(0);
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setP(eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    timeoutRef.current = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, delay);
  }, [dur, delay]);

  useEffect(() => {
    runAnimation();
    const intervalId = setInterval(() => {
      setKey(prev => prev + 1);
      runAnimation();
    }, ANIM.interval);
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [runAnimation]);

  return p;
}

const Panel = React.memo(({ children, style = {} }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, ...style }}>{children}</div>
));

const PH = React.memo(({ icon, title, accent, right }) => (
  <div style={{ padding: "9px 13px", borderBottom: `1px solid ${C.accent}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: accent ? `linear-gradient(90deg,${accent}10,${C.panel})` : C.panel, borderRadius: "12px 12px 0 0" }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>{icon}{title}</span>
    {right && <span style={{ fontSize: 10, color: C.muted }}>{right}</span>}
  </div>
));

const Ctr = React.memo(({ end, dec = 0, suf = "", dur = ANIM.counter }) => {
  const p = useAnim(dur);
  return <>{+(end * p).toFixed(dec)}{suf}</>;
});

const Spark = React.memo(({ data, color, w = 72, h = 24, delay = 0 }) => {
  const p = useAnim(ANIM.spark, delay);
  const { lp, ap, uid, tx, ty } = useMemo(() => {
    const mn = Math.min(...data), mx = Math.max(...data);
    const tx = i => (i / (data.length - 1)) * w;
    const ty = v => h - 3 - ((v - mn) / (mx - mn + .001)) * (h - 6);
    const lp = data.map((v, i) => `${i ? "L" : "M"} ${tx(i)} ${ty(v)}`).join(" ");
    const ap = lp + ` L ${w} ${h} L 0 ${h} Z`;
    const uid = color.replace("#", "") + w + h;
    return { lp, ap, uid, tx, ty };
  }, [data, color, w, h]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`sc${uid}`}><rect x={0} y={0} width={w * p} height={h} /></clipPath>
      </defs>
      <path d={ap} fill={`url(#sg${uid})`} clipPath={`url(#sc${uid})`} />
      <path d={lp} fill="none" stroke={color} strokeWidth="1.6" clipPath={`url(#sc${uid})`} />
      <circle cx={tx(data.length - 1)} cy={ty(data[data.length - 1])} r="2.5" fill={color} style={{ opacity: p > .88 ? 1 : 0 }} />
    </svg>
  );
}, (prev, next) => prev.data === next.data && prev.color === next.color && prev.w === next.w && prev.h === next.h);

const HBar = React.memo(({ label, val, max = 100, color, delay = 0, showVal = true }) => {
  const p = useAnim(ANIM.hbar, delay);
  const w = p * (val / max) * 100;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: C.sub, fontFamily: "'DM Sans'" }}>{label}</span>
        {showVal && <span style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{Math.round(p * val)}{max !== 100 ? "" : "%"}</span>}
      </div>
      <div style={{ height: 6, background: C.accent, borderRadius: 4, overflow: "hidden", border: `1px solid ${C.accentB}` }}>
        <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 4 }} />
      </div>
    </div>
  );
});

const Donut = React.memo(({ segs, size = 88, title, centerVal }) => {
  const p = useAnim(ANIM.donut, 300);
  const r = 30, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const arcs = useMemo(() => {
    const total = segs.reduce((a, s) => a + s.v, 0);
    let off = 0;
    return segs.map(s => {
      const frac = (s.v / total) * p;
      const arc = { ...s, dash: `${frac * circ} ${circ}`, doff: -(off * circ) };
      off += s.v / total;
      return arc;
    });
  }, [segs, p, circ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="8" />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.c} strokeWidth="8"
            strokeDasharray={a.dash} strokeDashoffset={a.doff}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        ))}
        <text x={cx} y={cy - 3} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="700" fontFamily="'JetBrains Mono'">{centerVal || Math.round(p * 100) + "%"}</text>
        {title && <text x={cx} y={cy + 8} textAnchor="middle" fill={C.muted} fontSize="6" fontFamily="'DM Sans'">{title}</text>}
      </svg>
    </div>
  );
});

const Badge = React.memo(({ status }) => {
  const map = {
    Online:   { bg: "#eefaf5", color: C.green,  dot: C.green },
    Offline:  { bg: "#fff0f2", color: C.red,    dot: C.red },
    Warning:  { bg: "#fffae8", color: C.yellow, dot: C.yellow },
    Critical: { bg: "#fff0f2", color: C.red,    dot: C.red },
    Standby:  { bg: "#eef3ff", color: C.blue,   dot: C.blue },
    Degraded: { bg: "#fff3e8", color: C.orange, dot: C.orange },
    Active:   { bg: "#eefaf5", color: C.teal,   dot: C.teal },
    Idle:     { bg: "#f4f6fb", color: C.muted,  dot: C.muted },
  };
  const s = map[status] || map.Online;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}44`, borderRadius: 5, padding: "2px 8px", fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans'", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block", ...(status === "Online" || status === "Active" ? { animation: "pulse 2s infinite" } : {}) }} />
      {status}
    </span>
  );
});

const MiniLine = React.memo(({ data, color, w = 100, h = 32 }) => {
  const p = useAnim(ANIM.line, 400);
  const { lp, ap, uid } = useMemo(() => {
    const mn = Math.min(...data), mx = Math.max(...data);
    const tx = i => (i / (data.length - 1)) * w;
    const ty = v => h - 2 - ((v - mn) / (mx - mn + 1)) * (h - 4);
    const lp = data.map((v, i) => `${i ? "L" : "M"} ${tx(i)} ${ty(v)}`).join(" ");
    const ap = lp + ` L ${w} ${h} L 0 ${h} Z`;
    const uid = color.replace("#", "") + w + h + data[0];
    return { lp, ap, uid };
  }, [data, color, w, h]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <clipPath id={`ml${uid}`}><rect x={0} y={0} width={w * p} height={h} /></clipPath>
      </defs>
      <path d={ap} fill={color + "18"} clipPath={`url(#ml${uid})`} />
      <path d={lp} fill="none" stroke={color} strokeWidth="1.5" clipPath={`url(#ml${uid})`} />
    </svg>
  );
});

const RingGauge = React.memo(({ val, max, color, size = 64, label }) => {
  const p = useAnim(ANIM.gauge, ANIM.gaugeDelay);
  const r = (size - 10) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const pct = (val / max) * p;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="7" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ / 4}
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="'JetBrains Mono'">{Math.round(p * val)}{max === 100 ? "%" : ""}</text>
      </svg>
      <span style={{ fontSize: 8, color: C.sub, fontFamily: "'DM Sans'", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
});

const StackedBar = React.memo(({ data, colors, labels, height = 100 }) => {
  const p = useAnim(ANIM.hbar, 300);
  const W = 300, H = height;
  const px = 8, py = 10, gW = W - px * 2, gH = H - py * 2 - 14;
  const maxV = Math.max(...data.map(d => d.reduce((a, v) => a + v, 0)));
  const bW = gW / data.length - 5;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {data.map((bar, i) => {
        const x = px + i * (gW / data.length) + 2;
        let yOff = py + gH;
        return (
          <g key={i}>
            {bar.map((val, ci) => {
              const h = (val / maxV) * gH * p; yOff -= h;
              return <rect key={ci} x={x} y={yOff} width={bW} height={h} fill={colors[ci]} rx="2" opacity=".85" />;
            })}
            {labels && <text x={x + bW / 2} y={H - 2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'JetBrains Mono'">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
});

const MultiLineChart = React.memo(({ datasets, w = 300, h = 80, labels }) => {
  const p = useAnim(ANIM.line, 200);
  const { mn, mx, tx, ty, uid } = useMemo(() => {
    const allVals = datasets.flatMap(d => d.data);
    const mn = Math.min(...allVals), mx = Math.max(...allVals);
    const n = datasets[0].data.length;
    const tx = i => 10 + (i / (n - 1)) * (w - 20);
    const ty = v => h - 10 - ((v - mn) / (mx - mn + 1)) * (h - 20);
    const uid = w + h + datasets[0].color.replace("#", "");
    return { mn, mx, tx, ty, uid };
  }, [datasets, w, h]);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <clipPath id={`mlc${uid}`}><rect x={0} y={0} width={w * p} height={h} /></clipPath>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
        <line key={i} x1={10} y1={ty(mn + frac * (mx - mn))} x2={w - 10} y2={ty(mn + frac * (mx - mn))} stroke={C.accentB} strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      {datasets.map((ds, di) => {
        const lp = ds.data.map((v, i) => `${i ? "L" : "M"} ${tx(i)} ${ty(v)}`).join(" ");
        return (
          <g key={di}>
            <path d={lp + ` L ${tx(ds.data.length - 1)} ${h} L ${tx(0)} ${h} Z`} fill={ds.color + "18"} clipPath={`url(#mlc${uid})`} />
            <path d={lp} fill="none" stroke={ds.color} strokeWidth="1.8" clipPath={`url(#mlc${uid})`} />
            {ds.data.map((v, i) => i === ds.data.length - 1 ? (
              <circle key={i} cx={tx(i)} cy={ty(v)} r="3" fill={ds.color} style={{ opacity: p > 0.9 ? 1 : 0 }} />
            ) : null)}
          </g>
        );
      })}
      {labels && labels.map((lbl, i) => (
        <text key={i} x={tx(i)} y={h - 1} textAnchor="middle" fill={C.muted} fontSize="6" fontFamily="'JetBrains Mono'">{lbl}</text>
      ))}
    </svg>
  );
});

const ThermoBar = React.memo(({ val, min = 15, max = 35, color, label }) => {
  const p = useAnim(ANIM.hbar, 300);
  const pct = ((val - min) / (max - min)) * 100 * p;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{(val * p).toFixed(1)}°C</div>
      <div style={{ width: 12, height: 60, background: C.accent, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.accentB}`, position: "relative" }}>
        <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${pct}%`, background: `linear-gradient(0deg,${color}88,${color})`, borderRadius: 6 }} />
      </div>
      <div style={{ fontSize: 8, color: C.muted, fontFamily: "'DM Sans'", textAlign: "center", width: 40 }}>{label}</div>
    </div>
  );
});

const RadialBar = React.memo(({ val, max, color, size = 70, label, unit = "%" }) => {
  const p = useAnim(2400, 200);
  const r = (size - 12) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const pct = (val / max) * p;
  const displayVal = Math.round(p * val);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" fontWeight="700" fontFamily="'JetBrains Mono'">{displayVal}{unit}</text>
      </svg>
      <span style={{ fontSize: 8, color: C.sub, textAlign: "center", fontFamily: "'DM Sans'" }}>{label}</span>
    </div>
  );
});

const AssetTable = React.memo(({ data, columns, title, icon, accent, search, filterStatus }) => {
  const filtered = useMemo(() => {
    return data.filter(row =>
      (filterStatus === "All" || row.status === filterStatus) &&
      Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
    );
  }, [data, search, filterStatus]);

  return (
    <Panel>
      <PH icon={icon} title={title} accent={accent} right={`${filtered.length} assets`} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ background: C.accent }}>
              {columns.map(col => (
                <th key={col.key} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: C.sub, fontFamily: "'DM Sans'", fontSize: 10, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className="row-in" style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: "7px 10px", borderBottom: `1px solid ${C.accent}`, fontFamily: col.mono ? "'JetBrains Mono'" : "'DM Sans'", color: col.color ? col.color(row[col.key]) : C.text, whiteSpace: "nowrap" }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}, (prev, next) => prev.data === next.data && prev.search === next.search && prev.filterStatus === next.filterStatus);

// ── DATA ──
const SERVERS = [
  { id: "SVR-001", name: "Dell PowerEdge R750",  rack: "R-01", slot: "U1", cpu: 78, ram: 82, disk: 65, temp: 38, power: 320, status: "Online",   ip: "10.0.1.1", os: "RHEL 9.2",      uptime: "127d 4h" },
  { id: "SVR-002", name: "HP ProLiant DL380",    rack: "R-01", slot: "U3", cpu: 45, ram: 60, disk: 72, temp: 34, power: 280, status: "Online",   ip: "10.0.1.2", os: "Ubuntu 22",     uptime: "89d 12h" },
  { id: "SVR-003", name: "Cisco UCS C240",       rack: "R-02", slot: "U1", cpu: 91, ram: 88, disk: 55, temp: 44, power: 410, status: "Critical", ip: "10.0.1.3", os: "VMware 8",      uptime: "3d 2h" },
  { id: "SVR-004", name: "Lenovo ThinkSystem",   rack: "R-02", slot: "U5", cpu: 32, ram: 40, disk: 48, temp: 29, power: 195, status: "Online",   ip: "10.0.1.4", os: "Windows 2022",  uptime: "210d 7h" },
  { id: "SVR-005", name: "Supermicro 1029P",     rack: "R-03", slot: "U2", cpu: 55, ram: 70, disk: 88, temp: 37, power: 350, status: "Warning",  ip: "10.0.1.5", os: "CentOS 8",      uptime: "45d 18h" },
  { id: "SVR-006", name: "Dell PowerEdge R640",  rack: "R-03", slot: "U4", cpu: 20, ram: 35, disk: 30, temp: 26, power: 160, status: "Standby",  ip: "10.0.1.6", os: "RHEL 8.6",      uptime: "0d 0h" },
  { id: "SVR-007", name: "HP ProLiant DL560",    rack: "R-04", slot: "U1", cpu: 68, ram: 74, disk: 62, temp: 41, power: 390, status: "Online",   ip: "10.0.1.7", os: "SLES 15",       uptime: "302d 1h" },
  { id: "SVR-008", name: "IBM Power10 S1022",    rack: "R-04", slot: "U3", cpu: 44, ram: 58, disk: 77, temp: 35, power: 240, status: "Online",   ip: "10.0.1.8", os: "AIX 7.3",       uptime: "188d 9h" },
];

const PDUS = [
  { id: "PDU-001", name: "Vertiv Geist rPDU",  rack: "R-01", type: "Metered",  ampere: 18.4, maxAmp: 30, outlets: 24, active: 20, voltage: 208, status: "Online",   phase: "3-Phase", powerKW: 3.8, history: [3.2,3.4,3.5,3.6,3.7,3.8,3.8] },
  { id: "PDU-002", name: "APC AP8886",         rack: "R-02", type: "Switched", ampere: 22.1, maxAmp: 30, outlets: 36, active: 28, voltage: 208, status: "Warning",  phase: "3-Phase", powerKW: 4.6, history: [3.8,4.0,4.2,4.1,4.4,4.5,4.6] },
  { id: "PDU-003", name: "Raritan PX3",        rack: "R-03", type: "Smart",    ampere: 14.8, maxAmp: 24, outlets: 24, active: 18, voltage: 120, status: "Online",   phase: "1-Phase", powerKW: 1.8, history: [1.5,1.6,1.6,1.7,1.7,1.8,1.8] },
  { id: "PDU-004", name: "Eaton ePDU G3",      rack: "R-04", type: "Metered",  ampere: 26.5, maxAmp: 30, outlets: 42, active: 35, voltage: 208, status: "Critical", phase: "3-Phase", powerKW: 5.5, history: [4.2,4.6,4.8,5.0,5.2,5.4,5.5] },
  { id: "PDU-005", name: "Vertiv MPH2",        rack: "R-05", type: "Basic",    ampere: 9.2,  maxAmp: 20, outlets: 16, active: 12, voltage: 120, status: "Online",   phase: "1-Phase", powerKW: 1.1, history: [0.9,1.0,1.0,1.0,1.1,1.1,1.1] },
];

const NETWORK = [
  { id: "SW-001", name: "Cisco Nexus 9336C",   type: "Core Switch",   rack: "R-N1", ports: 36, active: 34, speed: "100GbE", throughput: 88, status: "Online",  vlan: "10,20,30", rxGbps: 41, txGbps: 38, errors: 0,  history: [72,78,80,82,85,87,88] },
  { id: "SW-002", name: "Arista 7280CR3",      type: "Core Switch",   rack: "R-N1", ports: 32, active: 28, speed: "100GbE", throughput: 72, status: "Online",  vlan: "10,20,50", rxGbps: 33, txGbps: 30, errors: 2,  history: [60,63,65,67,69,71,72] },
  { id: "SW-003", name: "Cisco Catalyst 9300", type: "Access Switch", rack: "R-N2", ports: 48, active: 42, speed: "10GbE",  throughput: 45, status: "Online",  vlan: "10,40",    rxGbps: 8,  txGbps: 7,  errors: 0,  history: [38,39,41,42,43,44,45] },
  { id: "SW-004", name: "Juniper EX4300",      type: "Access Switch", rack: "R-N2", ports: 48, active: 31, speed: "10GbE",  throughput: 38, status: "Warning", vlan: "20,30",    rxGbps: 6,  txGbps: 5,  errors: 45, history: [30,31,33,34,35,37,38] },
  { id: "FW-001", name: "Palo Alto PA-5250",   type: "Firewall",      rack: "R-N3", ports: 16, active: 10, speed: "10GbE",  throughput: 62, status: "Online",  vlan: "DMZ,MGMT", rxGbps: 14, txGbps: 13, errors: 1,  history: [55,57,58,59,60,61,62] },
  { id: "LB-001", name: "F5 BIG-IP i5800",     type: "Load Balancer", rack: "R-N3", ports: 8,  active: 6,  speed: "10GbE",  throughput: 55, status: "Online",  vlan: "10,20",    rxGbps: 12, txGbps: 11, errors: 0,  history: [48,49,50,51,52,54,55] },
  { id: "RT-001", name: "Cisco ASR 9001",      type: "Router",        rack: "R-N4", ports: 4,  active: 4,  speed: "10GbE",  throughput: 79, status: "Online",  vlan: "WAN",      rxGbps: 18, txGbps: 17, errors: 3,  history: [70,72,74,75,76,78,79] },
];

const STORAGE = [
  { id: "SAN-001", name: "NetApp AFF A800",      type: "All-Flash SAN", rack: "R-S1", total: 200,  used: 148,  iops: 420000, latency: 0.18, status: "Online",  protocol: "NVMe/FC",   readBW: 28, writeBW: 22, iopsHistory: [380,395,400,405,410,415,420] },
  { id: "SAN-002", name: "Pure Storage FA-X70",  type: "All-Flash SAN", rack: "R-S1", total: 150,  used: 89,   iops: 310000, latency: 0.22, status: "Online",  protocol: "NVMe/FC",   readBW: 22, writeBW: 16, iopsHistory: [280,290,295,300,305,308,310] },
  { id: "NAS-001", name: "Dell PowerStore 1200T",type: "Hybrid NAS",    rack: "R-S2", total: 500,  used: 312,  iops: 80000,  latency: 1.20, status: "Warning", protocol: "NFS/SMB",   readBW: 8,  writeBW: 5,  iopsHistory: [70,72,74,76,77,79,80] },
  { id: "NAS-002", name: "NetApp FAS2750",       type: "Hybrid NAS",    rack: "R-S2", total: 320,  used: 198,  iops: 55000,  latency: 1.80, status: "Online",  protocol: "NFS/CIFS",  readBW: 6,  writeBW: 4,  iopsHistory: [48,50,51,52,53,54,55] },
  { id: "BCK-001", name: "Quantum Scalar i3",    type: "Tape Library",  rack: "R-S3", total: 2000, used: 1240, iops: 0,      latency: 0,    status: "Active",  protocol: "SCSI/LTO-8",readBW: 2,  writeBW: 2,  iopsHistory: [0,0,0,0,0,0,0] },
];

const UPS = [
  { id: "UPS-001", name: "Schneider Galaxy VX 40kVA", rack: "UPS-1", capacity: 40, load: 28,  battery: 92, runtime: 18, status: "Online",  mode: "Double Conversion", inputV: 208, outputV: 208, freq: 60, temp: 28, history: [25,26,26,27,27,28,28] },
  { id: "UPS-002", name: "Eaton 9PX 20kVA",           rack: "UPS-2", capacity: 20, load: 17,  battery: 42, runtime: 6,  status: "Warning", mode: "Double Conversion", inputV: 208, outputV: 207, freq: 60, temp: 34, history: [14,15,15,16,16,17,17] },
  { id: "UPS-003", name: "APC Smart-UPS 3000VA",      rack: "UPS-3", capacity: 3,  load: 1.8, battery: 88, runtime: 22, status: "Online",  mode: "Line Interactive",  inputV: 120, outputV: 120, freq: 60, temp: 26, history: [1.5,1.6,1.6,1.7,1.7,1.8,1.8] },
  { id: "UPS-004", name: "Vertiv Liebert EXM 80kVA",  rack: "UPS-4", capacity: 80, load: 52,  battery: 95, runtime: 15, status: "Online",  mode: "Online Double",     inputV: 480, outputV: 480, freq: 60, temp: 30, history: [46,48,49,50,51,51,52] },
];

const COOLING = [
  { id: "CRAC-001", name: "Liebert DS 30kW",      type: "CRAC",      rack: "CL-1", setTemp: 20, actTemp: 21.2, humidity: 45, power: 8.2,  status: "Online",   mode: "Cooling", airflow: 4200, eer: 3.8, tempHistory: [20.8,21.0,21.0,21.1,21.2,21.2,21.2] },
  { id: "CRAC-002", name: "APC InRow RC",          type: "CRAC",      rack: "CL-2", setTemp: 20, actTemp: 22.8, humidity: 48, power: 7.8,  status: "Warning",  mode: "Cooling", airflow: 3800, eer: 3.5, tempHistory: [21.0,21.5,22.0,22.2,22.5,22.7,22.8] },
  { id: "CRAC-003", name: "Vertiv Liebert PEX",    type: "Precision", rack: "CL-3", setTemp: 21, actTemp: 21.0, humidity: 44, power: 12.4, status: "Online",   mode: "Cooling", airflow: 6000, eer: 4.1, tempHistory: [21.0,21.0,21.0,21.0,21.0,21.0,21.0] },
  { id: "CRAH-001", name: "Stulz CyberAir 3 Pro", type: "CRAH",      rack: "CL-4", setTemp: 19, actTemp: 19.5, humidity: 42, power: 15.0, status: "Online",   mode: "Cooling", airflow: 7200, eer: 4.6, tempHistory: [19.2,19.3,19.4,19.4,19.5,19.5,19.5] },
  { id: "CRAH-002", name: "Emerson Liebert XD",    type: "CRAH",      rack: "CL-5", setTemp: 20, actTemp: 24.1, humidity: 52, power: 9.5,  status: "Critical", mode: "Cooling", airflow: 4800, eer: 2.9, tempHistory: [21.0,21.8,22.5,23.0,23.5,23.8,24.1] },
];

const GENERATORS = [
  { id: "GEN-001", name: "Caterpillar C175", kva: 2000, fuel: 78, lastTest: "2025-12-01", status: "Standby", runtime: "0h", mode: "Auto", voltage: 480, freq: 60, coolantTemp: 32, oilPressure: 42 },
  { id: "GEN-002", name: "Cummins C1250D5", kva: 1250, fuel: 85, lastTest: "2025-11-15", status: "Standby", runtime: "0h", mode: "Auto", voltage: 480, freq: 60, coolantTemp: 28, oilPressure: 38 },
];

const RACKS = [
  { id: "R-01", room: "Hall A", units: 42, used: 38, power: 8.2, maxPower: 10, weight: 820, status: "Online",   tempFront: 21, tempRear: 28, airflow: 3200 },
  { id: "R-02", room: "Hall A", units: 42, used: 35, power: 9.4, maxPower: 10, weight: 760, status: "Critical", tempFront: 23, tempRear: 35, airflow: 2900 },
  { id: "R-03", room: "Hall B", units: 42, used: 28, power: 6.1, maxPower: 10, weight: 630, status: "Online",   tempFront: 20, tempRear: 26, airflow: 2400 },
  { id: "R-04", room: "Hall B", units: 42, used: 32, power: 7.8, maxPower: 10, weight: 700, status: "Warning",  tempFront: 22, tempRear: 31, airflow: 2800 },
  { id: "R-05", room: "Hall C", units: 42, used: 18, power: 4.2, maxPower: 10, weight: 410, status: "Online",   tempFront: 19, tempRear: 24, airflow: 1800 },
  { id: "R-N1", room: "Net",   units: 42, used: 12, power: 3.5, maxPower:  8, weight: 280, status: "Online",   tempFront: 20, tempRear: 25, airflow: 1400 },
];

// ── Power Consumption — Full Pie Chart ──
const PowerPieChart = React.memo(() => {
  const p = useAnim(ANIM.donut, 200);

  const totalLoad = 825;
  const itLoad    = 540;
  const nonItLoad = 285;

  const slices = [
    { label: "IT Load",     val: itLoad,    color: C.blue   },
    { label: "Non-IT Load", val: nonItLoad, color: C.orange },
  ];

  const size = 110;
  const cx = size / 2, cy = size / 2, r = 44;

  // Convert slices to SVG pie path arcs
  const paths = useMemo(() => {
    const total = slices.reduce((a, s) => a + s.val, 0);
    let startAngle = -Math.PI / 2; // start from top
    return slices.map(s => {
      const sweep = (s.val / total) * 2 * Math.PI * p;
      const endAngle = startAngle + sweep;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = sweep > Math.PI ? 1 : 0;
      // Label position at mid-angle
      const midAngle = startAngle + sweep / 2;
      const lx = cx + (r * 0.62) * Math.cos(midAngle);
      const ly = cy + (r * 0.62) * Math.sin(midAngle);
      const pct = Math.round((s.val / total) * 100);
      const d = sweep < 0.01
        ? ""
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const result = { ...s, d, lx, ly, pct };
      startAngle = endAngle;
      return result;
    });
  }, [p]);

  return (
    <Panel>
      <PH icon="⚡" title="Power Consumption" accent={C.yellow} />
      <div style={{ padding: "10px 8px 8px", display: "flex", gap: 14, alignItems: "center", justifyContent: "center" }}>

        {/* Pie SVG */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
          {/* Shadow base circle */}
          <circle cx={cx} cy={cy} r={r} fill={C.accent} />
          {paths.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} opacity="0.92" />
          ))}
          {/* Divider lines */}
          {paths.map((s, i) => (
            s.d ? <path key={`l${i}`} d={s.d} fill="none" stroke={C.panel} strokeWidth="1.5" /> : null
          ))}
          {/* Percentage labels inside slices */}
          {paths.map((s, i) => (
            s.pct > 8 ? (
              <text key={`t${i}`} x={s.lx} y={s.ly + 4} textAnchor="middle"
                fill="#fff" fontSize="11" fontWeight="700" fontFamily="'JetBrains Mono'"
                style={{ opacity: p > 0.6 ? 1 : 0 }}>
                {Math.round(p * s.pct)}%
              </text>
            ) : null
          ))}
          {/* Center total label */}
          <circle cx={cx} cy={cy} r={20} fill={C.panel} />
          <text x={cx} y={cy - 2} textAnchor="middle" fill={C.text} fontSize="9" fontWeight="700" fontFamily="'JetBrains Mono'">{Math.round(p * totalLoad)}</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill={C.muted} fontSize="6" fontFamily="'DM Sans'">kW</text>
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Total row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: `1px solid ${C.accent}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.yellow, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: C.sub, fontFamily: "'DM Sans'", width: 64 }}>Total Load</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.yellow, fontFamily: "'JetBrains Mono'" }}>{Math.round(p * totalLoad)} kW</span>
          </div>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: C.sub, fontFamily: "'DM Sans'", width: 64 }}>{s.label}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono'", lineHeight: 1.1 }}>{Math.round(p * s.val)} kW</span>
                <span style={{ fontSize: 8, color: C.muted, fontFamily: "'JetBrains Mono'" }}>{Math.round(p * Math.round((s.val / totalLoad) * 100))}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
});

// ─── Overview Tab Component ───
const OverviewComponent = React.memo(() => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 8 }}>

      {/* ── REPLACED: Power Consumption Pie Chart ── */}
      <PowerPieChart />

      <Panel>
        <PH icon="🩺" title="Fleet Health Status" accent={C.green} />
        <div style={{ padding: "10px 8px 8px", display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
          <Donut segs={[{v:128,c:C.green},{v:5,c:C.yellow},{v:4,c:C.red},{v:5,c:C.blue}]} size={100} title="Health" centerVal="90%" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[["Online",128,C.green],["Warning",5,C.yellow],["Critical",4,C.red],["Standby",5,C.blue]].map(([l,n,c],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c}}/><span style={{fontSize:9,color:C.sub,fontFamily:"'DM Sans'",width:55}}>{l}</span><span style={{fontSize:10,fontWeight:700,color:c,fontFamily:"'JetBrains Mono'"}}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <PH icon="🚨" title="Active Alerts" accent={C.red} />
        <div style={{ padding: "8px 10px" }}>
          {[
            { asset: "SVR-003",  msg: "CPU at 91% — Overheating", level: "critical" },
            { asset: "PDU-004",  msg: "Load 88% — Near Limit",    level: "critical" },
            { asset: "UPS-002",  msg: "Battery 42% — Low",        level: "warning"  },
            { asset: "CRAH-002", msg: "Temp 24.1°C — High",       level: "critical" },
            { asset: "SW-004",   msg: "Packet Loss Detected",      level: "warning"  },
            { asset: "CRAC-002", msg: "Humidity 48% — Monitor",   level: "warning"  },
            { asset: "SVR-005",  msg: "Disk at 88% — Near Full",  level: "warning"  },
          ].map((a, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 0", borderBottom: i<6 ? `1px solid ${C.accent}` : "none" }}>
              <span style={{ fontSize:10, animation: a.level==="critical" ? "pulse 1.5s infinite" : "none" }}>{a.level==="critical"?"🔴":"🟡"}</span>
              <div>
                <div style={{ fontSize:9, fontWeight:700, color: a.level==="critical"?C.red:C.yellow, fontFamily:"'JetBrains Mono'" }}>{a.asset}</div>
                <div style={{ fontSize:9, color:C.sub, fontFamily:"'DM Sans'" }}>{a.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>

    <Panel>
      <PH icon="🗄" title="Rack Space & Power Overview" accent={C.blue} />
      <div style={{ padding: "8px 12px 10px", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
        {RACKS.map((rack, i) => {
          const usedPct = rack.used / rack.units;
          const statusColor = rack.status === "Online" ? C.green : rack.status === "Critical" ? C.red : C.yellow;
          return (
            <div key={i} style={{ background: C.accent, border: `1px solid ${statusColor}44`, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono'" }}>{rack.id}</span>
                <Badge status={rack.status} />
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{rack.room}</div>
              <div style={{ display: "flex", gap: 1, marginBottom: 5, flexWrap: "wrap" }}>
                {Array.from({length: 12}, (_,j) => (
                  <div key={j} style={{ width: 8, height: 8, borderRadius: 1, background: j < Math.round(usedPct * 12) ? statusColor : C.accentB }} />
                ))}
              </div>
              <div style={{ fontSize: 9, color: C.sub }}>{rack.used}/{rack.units}U · <span style={{ color: statusColor, fontWeight: 700 }}>{rack.power}kW</span></div>
            </div>
          );
        })}
      </div>
    </Panel>
  </div>
));

// ─── Servers Tab Component ───
const ServersComponent = React.memo(({ search = "", filterStatus = "All" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
      {SERVERS.slice(0,8).map((s, i) => (
        <Panel key={i} style={{ padding: 10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.text, fontFamily:"'JetBrains Mono'" }}>{s.id}</div>
              <div style={{ fontSize:8, color:C.muted }}>{s.name}</div>
            </div>
            <Badge status={s.status} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, marginBottom:6 }}>
            <RingGauge val={s.cpu}  max={100} color={s.cpu>85?C.red:s.cpu>70?C.yellow:C.blue}   size={52} label="CPU" />
            <RingGauge val={s.ram}  max={100} color={s.ram>85?C.red:s.ram>70?C.yellow:C.purple} size={52} label="RAM" />
            <RingGauge val={s.disk} max={100} color={s.disk>85?C.red:s.disk>70?C.yellow:C.green} size={52} label="Disk" />
          </div>
          <div style={{ fontSize:8, color:C.sub, display:"flex", justifyContent:"space-between" }}>
            <span>🌡 {s.temp}°C</span><span>⚡ {s.power}W</span><span>📍 {s.rack}/{s.slot}</span>
          </div>
        </Panel>
      ))}
    </div>
    <AssetTable
      data={SERVERS} icon="🖥" title="Server Inventory" accent={C.blue}
      search={search} filterStatus={filterStatus}
      columns={[
        { key:"id",     label:"ID",       mono:true },
        { key:"name",   label:"Name" },
        { key:"rack",   label:"Rack",     mono:true },
        { key:"status", label:"Status",   render: r => <Badge status={r.status} /> },
        { key:"cpu",    label:"CPU %",    render: r => <HBar label="" val={r.cpu} color={r.cpu>85?C.red:r.cpu>70?C.yellow:C.blue} showVal={false} /> },
        { key:"ram",    label:"RAM %",    render: r => <HBar label="" val={r.ram} color={r.ram>85?C.red:r.ram>70?C.yellow:C.purple} showVal={false} /> },
        { key:"temp",   label:"Temp",     render: r => <span style={{color: r.temp>42?C.red:r.temp>38?C.orange:C.green, fontWeight:700, fontFamily:"'JetBrains Mono'"}}>{r.temp}°C</span> },
        { key:"power",  label:"Power",    render: r => <span style={{fontFamily:"'JetBrains Mono'",color:C.yellow}}>{r.power}W</span> },
        { key:"os",     label:"OS" },
        { key:"uptime", label:"Uptime",   mono:true },
        { key:"ip",     label:"IP",       mono:true },
      ]}
    />
  </div>
));

// ─── PDU Tab Component ───
const PDUsComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalPower = PDUS.reduce((a, p) => a + p.powerKW, 0).toFixed(1);
  const avgLoad    = (PDUS.reduce((a, p) => a + (p.ampere / p.maxAmp) * 100, 0) / PDUS.length).toFixed(1);
  const totalOutlets  = PDUS.reduce((a, p) => a + p.outlets, 0);
  const activeOutlets = PDUS.reduce((a, p) => a + p.active, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 8 }}>
        <Panel>
          <PH icon="📈" title="PDU Load Comparison (Current vs Max Ampere)" accent={C.orange} />
          <div style={{ padding: "10px 12px" }}>
            {PDUS.map((pdu, i) => {
              const pct = (pdu.ampere / pdu.maxAmp) * 100;
              const color = pct > 85 ? C.red : pct > 70 ? C.yellow : C.orange;
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: C.sub, fontFamily: "'JetBrains Mono'" }}>{pdu.id}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{pdu.ampere}A / {pdu.maxAmp}A</span>
                  </div>
                  <HBar label="" val={pct} color={color} showVal={false} />
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PH icon="🍩" title="Power by PDU Type" accent={C.orange} />
          <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <Donut segs={[{v:3.8,c:C.orange},{v:4.6,c:C.red},{v:1.8,c:C.blue},{v:5.5,c:C.yellow},{v:1.1,c:C.green}]} size={110} title="kW dist" centerVal={`${totalPower}kW`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PDUS.map((p,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:[C.orange,C.red,C.blue,C.yellow,C.green][i] }} />
                  <span style={{ fontSize:9, color:C.sub }}>{p.id}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:[C.orange,C.red,C.blue,C.yellow,C.green][i], fontFamily:"'JetBrains Mono'" }}>{p.powerKW}kW</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <AssetTable
        data={PDUS} icon="🔌" title="PDU Inventory" accent={C.orange}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"name",label:"Name"},
          {key:"rack",label:"Rack",mono:true},
          {key:"type",label:"Type"},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"ampere",label:"Current",render:r=><span style={{color:r.ampere/r.maxAmp>0.85?C.red:r.ampere/r.maxAmp>0.7?C.yellow:C.green,fontWeight:700,fontFamily:"'JetBrains Mono'"}}>{r.ampere}A</span>},
          {key:"maxAmp",label:"Max",render:r=><span style={{fontFamily:"'JetBrains Mono'"}}>{r.maxAmp}A</span>},
          {key:"outlets",label:"Outlets",render:r=><span style={{fontFamily:"'JetBrains Mono'"}}>{r.active}/{r.outlets}</span>},
          {key:"voltage",label:"Voltage",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.orange}}>{r.voltage}V</span>},
          {key:"phase",label:"Phase"},
          {key:"powerKW",label:"Power",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.yellow,fontWeight:700}}>{r.powerKW}kW</span>},
        ]}
      />
    </div>
  );
});

// ─── Network Tab Component ───
const NetworkComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalThroughput = Math.round(NETWORK.reduce((a,n)=>a+n.throughput,0)/NETWORK.length);
  const totalErrors     = NETWORK.reduce((a,n)=>a+n.errors,0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}>
        <Panel>
          <PH icon="📡" title="Throughput by Device" accent={C.cyan} />
          <div style={{ padding: "10px 12px" }}>
            {NETWORK.map((dev, i) => {
              const color = dev.throughput > 80 ? C.red : dev.throughput > 60 ? C.yellow : C.cyan;
              return (
                <div key={i} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: C.sub }}>{dev.id} <span style={{ color: C.muted }}>({dev.type})</span></span>
                    <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{dev.throughput}%</span>
                  </div>
                  <HBar label="" val={dev.throughput} color={color} showVal={false} />
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PH icon="🔌" title="Device Type Distribution" accent={C.cyan} />
          <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <Donut segs={[{v:2,c:C.blue},{v:2,c:C.cyan},{v:1,c:C.red},{v:1,c:C.green},{v:1,c:C.purple}]} size={100} centerVal="7" title="devices" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["Core Switch",2,C.blue],["Access Switch",2,C.cyan],["Firewall",1,C.red],["Load Balancer",1,C.green],["Router",1,C.purple]].map(([l,n,c],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:c}}/><span style={{fontSize:9,color:C.sub,width:80}}>{l}</span><span style={{fontSize:10,fontWeight:700,color:c,fontFamily:"'JetBrains Mono'"}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <AssetTable
        data={NETWORK} icon="🌐" title="Network Device Inventory" accent={C.cyan}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"name",label:"Name"},
          {key:"type",label:"Type"},
          {key:"rack",label:"Rack",mono:true},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"ports",label:"Ports",render:r=><span style={{fontFamily:"'JetBrains Mono'"}}>{r.active}/{r.ports}</span>},
          {key:"speed",label:"Speed",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.cyan}}>{r.speed}</span>},
          {key:"throughput",label:"Throughput",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:60,height:5,background:C.accent,borderRadius:3}}>
                <div style={{width:`${r.throughput}%`,height:"100%",background:r.throughput>80?C.red:r.throughput>60?C.yellow:C.blue,borderRadius:3}}/>
              </div>
              <span style={{fontSize:9,color:C.sub,fontFamily:"'JetBrains Mono'"}}>{r.throughput}%</span>
            </div>
          )},
          {key:"rxGbps",label:"RX",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.green}}>{r.rxGbps}G</span>},
          {key:"txGbps",label:"TX",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.blue}}>{r.txGbps}G</span>},
          {key:"errors",label:"Errors",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.errors>0?C.red:C.green,fontWeight:700}}>{r.errors}</span>},
          {key:"vlan",label:"VLANs",render:r=><span style={{fontFamily:"'JetBrains Mono'",fontSize:9,color:C.purple}}>{r.vlan}</span>},
        ]}
      />
    </div>
  );
});

// ─── Storage Tab Component ───
const StorageComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalTB    = STORAGE.reduce((a,s)=>a+s.total,0);
  const usedTB     = STORAGE.reduce((a,s)=>a+s.used,0);
  const avgLatency = (STORAGE.filter(s=>s.latency>0).reduce((a,s)=>a+s.latency,0)/STORAGE.filter(s=>s.latency>0).length).toFixed(2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}>
        <Panel>
          <PH icon="📊" title="Storage Utilization by Device" accent={C.purple} />
          <div style={{ padding: "10px 12px" }}>
            {STORAGE.map((s, i) => {
              const pct = (s.used / s.total) * 100;
              const color = pct > 85 ? C.red : pct > 70 ? C.yellow : C.purple;
              return (
                <div key={i} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: C.sub }}>{s.id} <span style={{ color: C.muted }}>({s.type})</span></span>
                    <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{s.used}/{s.total}TB ({Math.round(pct)}%)</span>
                  </div>
                  <HBar label="" val={pct} color={color} showVal={false} />
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PH icon="⚡" title="IOPS & Bandwidth" accent={C.purple} />
          <div style={{ padding: "12px 14px" }}>
            {STORAGE.filter(s=>s.iops>0).map((s,i)=>(
              <div key={i} style={{ marginBottom: 10, padding: 8, background: C.accent, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono'" }}>{s.id}</span>
                  <span style={{ fontSize: 9, color: C.blue, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{(s.iops/1000).toFixed(0)}K IOPS</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: 7, color: C.muted, marginBottom: 2 }}>Read {s.readBW}GB/s</div>
                    <div style={{ height: 4, background: C.accentB, borderRadius: 2 }}>
                      <div style={{ width: `${(s.readBW/30)*100}%`, height: "100%", background: C.green, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: 7, color: C.muted, marginBottom: 2 }}>Write {s.writeBW}GB/s</div>
                    <div style={{ height: 4, background: C.accentB, borderRadius: 2 }}>
                      <div style={{ width: `${(s.writeBW/30)*100}%`, height: "100%", background: C.blue, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <AssetTable
        data={STORAGE} icon="💾" title="Storage Inventory" accent={C.purple}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"name",label:"Name"},
          {key:"type",label:"Type"},
          {key:"rack",label:"Rack",mono:true},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"used",label:"Used",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:70,height:5,background:C.accent,borderRadius:3}}>
                <div style={{width:`${(r.used/r.total)*100}%`,height:"100%",background:r.used/r.total>0.85?C.red:r.used/r.total>0.7?C.yellow:C.purple,borderRadius:3}}/>
              </div>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono'",color:C.purple}}>{r.used}/{r.total}TB</span>
            </div>
          )},
          {key:"iops",label:"IOPS",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.blue}}>{r.iops>0?(r.iops/1000).toFixed(0)+"K":"—"}</span>},
          {key:"latency",label:"Latency",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.latency>1.5?C.orange:C.green}}>{r.latency>0?r.latency+"ms":"—"}</span>},
          {key:"readBW",label:"Read",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.green}}>{r.readBW} GB/s</span>},
          {key:"writeBW",label:"Write",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.blue}}>{r.writeBW} GB/s</span>},
          {key:"protocol",label:"Protocol",render:r=><span style={{fontFamily:"'JetBrains Mono'",fontSize:9,color:C.teal}}>{r.protocol}</span>},
        ]}
      />
    </div>
  );
});

// ─── UPS Tab Component ───
const UPSTabComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalCap  = UPS.reduce((a,u)=>a+u.capacity,0);
  const totalLoad = UPS.reduce((a,u)=>a+u.load,0);
  const avgBatt   = Math.round(UPS.reduce((a,u)=>a+u.battery,0)/UPS.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}>
        <Panel>
          <PH icon="📊" title="UPS Load vs Capacity" accent={C.green} />
          <div style={{ padding: "10px 14px" }}>
            {UPS.map((u, i) => {
              const loadPct = Math.round((u.load / u.capacity) * 100);
              const color   = loadPct > 85 ? C.red : loadPct > 70 ? C.yellow : C.green;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: C.sub }}>{u.id} — {u.name.split(" ").slice(-1)[0]}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{u.load}/{u.capacity}kVA ({loadPct}%)</span>
                  </div>
                  <HBar label="" val={loadPct} color={color} showVal={false} />
                  <div style={{ marginTop: 3 }}>
                    <HBar label="" val={u.battery} color={u.battery < 50 ? C.red : u.battery < 75 ? C.yellow : C.green} showVal={false} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PH icon="🔋" title="Battery Status Distribution" accent={C.green} />
          <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <Donut segs={[{v:3,c:C.green},{v:1,c:C.red}]} size={100} centerVal="75%" title="avg battery" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {UPS.map((u,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:9, color:C.sub, fontFamily:"'JetBrains Mono'", width:60 }}>{u.id}</span>
                  <div style={{ width:80, height:6, background:C.accent, borderRadius:4 }}>
                    <div style={{ width:`${u.battery}%`, height:"100%", background:u.battery<50?C.red:u.battery<75?C.yellow:C.green, borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:u.battery<50?C.red:u.battery<75?C.yellow:C.green, fontFamily:"'JetBrains Mono'" }}>{u.battery}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <AssetTable
        data={UPS} icon="🔋" title="UPS Inventory" accent={C.green}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"name",label:"Name"},
          {key:"rack",label:"Rack",mono:true},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"capacity",label:"Capacity",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.green}}>{r.capacity}kVA</span>},
          {key:"load",label:"Load",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:50,height:5,background:C.accent,borderRadius:3}}>
                <div style={{width:`${(r.load/r.capacity)*100}%`,height:"100%",background:r.load/r.capacity>0.85?C.red:r.load/r.capacity>0.7?C.yellow:C.blue,borderRadius:3}}/>
              </div>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono'"}}>{r.load}kVA</span>
            </div>
          )},
          {key:"battery",label:"Battery",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.battery<50?C.red:r.battery<75?C.yellow:C.green,fontWeight:700}}>{r.battery}%</span>},
          {key:"runtime",label:"Runtime",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.purple}}>{r.runtime}min</span>},
          {key:"inputV",label:"Input V",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.blue}}>{r.inputV}V</span>},
          {key:"temp",label:"Temp",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.temp>32?C.orange:C.green}}>{r.temp}°C</span>},
          {key:"mode",label:"Mode"},
        ]}
      />
    </div>
  );
});

// ─── Cooling Tab Component ───
const CoolingTabComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const avgTemp    = (COOLING.reduce((a,c)=>a+c.actTemp,0)/COOLING.length).toFixed(1);
  const avgHum     = Math.round(COOLING.reduce((a,c)=>a+c.humidity,0)/COOLING.length);
  const totalPower = COOLING.reduce((a,c)=>a+c.power,0).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}>
        <Panel>
          <PH icon="🌡" title="Temperature Trend by Unit (°C)" accent={C.teal} />
          <div style={{ padding: "10px 12px" }}>
            <MultiLineChart
              datasets={COOLING.map((c, i) => ({ data: c.tempHistory, color: [C.teal, C.orange, C.blue, C.green, C.red][i] }))}
              w={400} h={100}
              labels={["T-6","T-5","T-4","T-3","T-2","T-1","Now"]}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              {COOLING.map((c,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:8,height:3,background:[C.teal,C.orange,C.blue,C.green,C.red][i],borderRadius:2}}/>
                  <span style={{fontSize:8,color:C.muted}}>{c.id}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <PH icon="💧" title="Humidity Levels" accent={C.teal} />
          <div style={{ padding: "12px 14px" }}>
            {COOLING.map((c, i) => {
              const color = c.humidity > 50 ? C.orange : c.humidity > 48 ? C.yellow : C.blue;
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: C.sub }}>{c.id}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>{c.humidity}%</span>
                  </div>
                  <HBar label="" val={c.humidity} max={100} color={color} showVal={false} />
                </div>
              );
            })}
            <div style={{ padding: "8px", background: C.accent, borderRadius: 6, marginTop: 8 }}>
              <div style={{ fontSize: 8, color: C.muted }}>Target Range</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono'" }}>40% – 60% RH</div>
            </div>
          </div>
        </Panel>
      </div>
      <AssetTable
        data={COOLING} icon="❄️" title="Cooling Unit Inventory" accent={C.teal}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"name",label:"Name"},
          {key:"type",label:"Type"},
          {key:"rack",label:"Location",mono:true},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"actTemp",label:"Temp",render:r=><span style={{fontWeight:700,fontFamily:"'JetBrains Mono'",color:r.actTemp>23?C.red:r.actTemp>22?C.orange:C.green}}>{r.actTemp}°C</span>},
          {key:"setTemp",label:"Setpoint",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.blue}}>{r.setTemp}°C</span>},
          {key:"humidity",label:"Humidity",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.humidity>50?C.orange:C.teal}}>{r.humidity}%</span>},
          {key:"power",label:"Power",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.yellow}}>{r.power}kW</span>},
          {key:"airflow",label:"Airflow",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.teal}}>{r.airflow}m³/h</span>},
          {key:"eer",label:"EER",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.eer<3.2?C.red:C.green,fontWeight:700}}>{r.eer}</span>},
        ]}
      />
    </div>
  );
});

// ─── Generator Tab Component ───
const GeneratorTabComponent = React.memo(({ search = "", filterStatus = "All" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}>
      <Panel>
        <PH icon="📊" title="Generator Metrics Comparison" accent={C.indigo} />
        <div style={{ padding: "10px 14px" }}>
          {[
            { label: "Fuel Level (%)",    g1: GENERATORS[0].fuel,         g2: GENERATORS[1].fuel,         max: 100, colors: [C.green,  C.blue]   },
            { label: "Coolant Temp (°C)", g1: GENERATORS[0].coolantTemp,  g2: GENERATORS[1].coolantTemp,  max: 80,  colors: [C.orange, C.teal]   },
            { label: "Oil Pressure (PSI)",g1: GENERATORS[0].oilPressure,  g2: GENERATORS[1].oilPressure,  max: 80,  colors: [C.purple, C.cyan]   },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, marginBottom: 5 }}>{m.label}</div>
              <div style={{ marginBottom: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 8, color: C.muted }}>GEN-001</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: m.colors[0], fontFamily: "'JetBrains Mono'" }}>{m.g1}</span>
                </div>
                <HBar label="" val={(m.g1/m.max)*100} color={m.colors[0]} showVal={false} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 8, color: C.muted }}>GEN-002</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: m.colors[1], fontFamily: "'JetBrains Mono'" }}>{m.g2}</span>
                </div>
                <HBar label="" val={(m.g2/m.max)*100} color={m.colors[1]} showVal={false} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <PH icon="⚙️" title="Generator Status Overview" accent={C.indigo} />
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Donut segs={[{v:2,c:C.blue},{v:0,c:C.red}]} size={100} centerVal="2/2" title="Standby" />
          </div>
          {GENERATORS.map((g, i) => (
            <div key={i} style={{ padding: "8px 10px", background: C.accent, borderRadius: 8, marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: C.text }}>{g.id}</span>
                <Badge status={g.status} />
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 9, color: C.sub }}>
                <span>⛽ {g.fuel}%</span><span>🌡 {g.coolantTemp}°C</span><span>⚙️ {g.kva}kVA</span>
              </div>
            </div>
          ))}
          <div style={{ padding: "8px", background: "#eef3ff", borderRadius: 8, marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.blue, fontWeight: 700 }}>⚡ Total Backup Capacity</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.indigo, fontFamily: "'JetBrains Mono'" }}>3,250 kVA</div>
          </div>
        </div>
      </Panel>
    </div>
    <AssetTable
      data={GENERATORS} icon="⚙️" title="Generator Inventory" accent={C.indigo}
      search={search} filterStatus={filterStatus}
      columns={[
        {key:"id",label:"ID",mono:true},
        {key:"name",label:"Name"},
        {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
        {key:"kva",label:"Capacity",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.indigo,fontWeight:700}}>{r.kva}kVA</span>},
        {key:"fuel",label:"Fuel",render:r=>(
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:60,height:5,background:C.accent,borderRadius:3}}>
              <div style={{width:`${r.fuel}%`,height:"100%",background:r.fuel<60?C.orange:C.green,borderRadius:3}}/>
            </div>
            <span style={{fontSize:9,fontFamily:"'JetBrains Mono'",color:r.fuel<60?C.orange:C.green,fontWeight:700}}>{r.fuel}%</span>
          </div>
        )},
        {key:"voltage",label:"Voltage",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.blue}}>{r.voltage}V</span>},
        {key:"freq",label:"Freq",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.cyan}}>{r.freq}Hz</span>},
        {key:"coolantTemp",label:"Coolant",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.coolantTemp>50?C.red:C.green}}>{r.coolantTemp}°C</span>},
        {key:"oilPressure",label:"Oil PSI",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.oilPressure<25?C.red:C.cyan}}>{r.oilPressure} PSI</span>},
        {key:"mode",label:"Mode"},
        {key:"lastTest",label:"Last Test",mono:true},
        {key:"runtime",label:"Runtime",mono:true},
      ]}
    />
  </div>
));

// ─── Racks Tab Component ───
const RacksTabComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalU   = RACKS.reduce((a,r)=>a+r.units,0);
  const usedU    = RACKS.reduce((a,r)=>a+r.used,0);
  const totalPwr = RACKS.reduce((a,r)=>a+r.power,0).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 0.8fr", gap: 8 }}>
        <Panel>
          <PH icon="📊" title="Rack Space & Power Utilization" accent={C.blue} />
          <div style={{ padding: "10px 14px" }}>
            {RACKS.map((rack, i) => {
              const spacePct = (rack.used / rack.units) * 100;
              const pwrPct   = (rack.power / rack.maxPower) * 100;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono'" }}>{rack.id}</span>
                    <span style={{ fontSize: 8, color: C.muted }}>{rack.room}</span>
                  </div>
                  <div style={{ marginBottom: 2 }}>
                    <HBar label="" val={spacePct} color={spacePct>90?C.red:spacePct>75?C.yellow:C.blue} showVal={false} />
                  </div>
                  <HBar label="" val={pwrPct} color={pwrPct>90?C.red:pwrPct>75?C.orange:C.green} showVal={false} />
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{width:8,height:3,background:C.blue,borderRadius:2}}/><span style={{fontSize:8,color:C.muted}}>Space</span></div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{width:8,height:3,background:C.green,borderRadius:2}}/><span style={{fontSize:8,color:C.muted}}>Power</span></div>
            </div>
          </div>
        </Panel>
        <Panel>
          <PH icon="🌡" title="Rack Temperature Map" accent={C.blue} />
          <div style={{ padding: "12px 14px" }}>
            {RACKS.map((rack, i) => (
              <div key={i} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", color: C.sub, width: 40 }}>{rack.id}</span>
                <div style={{ flex: 1, display: "flex", gap: 2 }}>
                  {Array.from({length:20}, (_,j)=>{
                    const temp = rack.tempFront + ((rack.tempRear - rack.tempFront) * (j/19));
                    const intensity = (temp - 18) / (38 - 18);
                    const r = Math.round(intensity * 230);
                    const b = Math.round((1-intensity) * 200);
                    return <div key={j} style={{ flex:1, height:10, background:`rgb(${r},${Math.round(50*(1-intensity))},${b})`, borderRadius:1, opacity:0.8 }} />;
                  })}
                </div>
                <span style={{ fontSize: 8, color: C.muted, width: 30 }}>{rack.tempRear}°C</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 7, color: C.blue }}>← Cool (Front)</span>
              <span style={{ fontSize: 7, color: C.red }}>Hot (Rear) →</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <PH icon="🍩" title="Rack by Room" accent={C.blue} />
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Donut segs={[{v:2,c:C.blue},{v:2,c:C.cyan},{v:1,c:C.green},{v:1,c:C.purple}]} size={90} centerVal="6" title="racks" />
            <div style={{ width: "100%" }}>
              {[["Hall A",2,C.blue],["Hall B",2,C.cyan],["Hall C",1,C.green],["Net",1,C.purple]].map(([l,n,c],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom: i<3?`1px solid ${C.accent}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:c}}/>
                    <span style={{fontSize:9,color:C.sub}}>{l}</span>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,color:c,fontFamily:"'JetBrains Mono'"}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <AssetTable
        data={RACKS} icon="🗄" title="Rack Inventory" accent={C.blue}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"room",label:"Room"},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"used",label:"U Used",render:r=><span style={{fontFamily:"'JetBrains Mono'"}}>{r.used}/{r.units}</span>},
          {key:"power",label:"Power",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:50,height:5,background:C.accent,borderRadius:3}}>
                <div style={{width:`${(r.power/r.maxPower)*100}%`,height:"100%",background:r.power/r.maxPower>0.9?C.red:r.power/r.maxPower>0.75?C.orange:C.green,borderRadius:3}}/>
              </div>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono'",color:C.yellow}}>{r.power}/{r.maxPower}kW</span>
            </div>
          )},
          {key:"tempFront",label:"Front Temp",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.tempFront>22?C.orange:C.green}}>{r.tempFront}°C</span>},
          {key:"tempRear",label:"Rear Temp",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:r.tempRear>32?C.red:r.tempRear>28?C.orange:C.green,fontWeight:700}}>{r.tempRear}°C</span>},
          {key:"airflow",label:"Airflow",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.teal}}>{r.airflow}m³/h</span>},
          {key:"weight",label:"Weight",render:r=><span style={{fontFamily:"'JetBrains Mono'",color:C.purple}}>{r.weight}kg</span>},
        ]}
      />
    </div>
  );
});

// ─── Main Component ───
export default function AssetDashboard() {
  const [tab, setTab]               = useState("overview");
  const [time, setTime]             = useState(new Date());
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const kpis = useMemo(() => [
    { label: "Total Assets",     val: 142,  suf: "",    dec: 0, color: C.blue,   bg: "#eef3ff", icon: "📦", spark: [120,125,128,130,133,138,142] },
    { label: "Online Assets",    val: 128,  suf: "",    dec: 0, color: C.green,  bg: "#eefaf5", icon: "✅", spark: [115,118,120,122,124,126,128] },
    { label: "Critical/Warning", val: 9,    suf: "",    dec: 0, color: C.red,    bg: "#fff0f2", icon: "⚠️", spark: [4,6,5,7,6,8,9], blink: true },
    { label: "Total Power (kW)", val: 825,  suf: " kW", dec: 0, color: C.yellow, bg: "#fffbee", icon: "⚡", spark: [700,720,750,760,790,810,825] },
    { label: "Avg CPU Load",     val: 54.1, suf: "%",   dec: 1, color: C.cyan,   bg: "#eefaff", icon: "💻", spark: [48,50,52,51,53,54,54.1] },
    { label: "Storage Used",     val: 68,   suf: "%",   dec: 0, color: C.purple, bg: "#f3eeff", icon: "💾", spark: [58,60,62,63,65,67,68] },
  ], []);

  const tabs = useMemo(() => [
    { id: "overview",   label: "Overview",   icon: "🏠" },
    { id: "servers",    label: "Servers",    icon: "🖥" },
    { id: "pdu",        label: "PDU",        icon: "🔌" },
    { id: "network",    label: "Network",    icon: "🌐" },
    { id: "storage",    label: "Storage",    icon: "💾" },
    { id: "ups",        label: "UPS",        icon: "🔋" },
    { id: "cooling",    label: "Cooling",    icon: "❄️" },
    { id: "generator",  label: "Generators", icon: "⚙️" },
    { id: "racks",      label: "Racks",      icon: "🗄" },
  ], []);

  const renderTab = useMemo(() => {
    switch(tab) {
      case "overview":  return <OverviewComponent />;
      case "servers":   return <ServersComponent   search={search} filterStatus={filterStatus} />;
      case "pdu":       return <PDUsComponent      search={search} filterStatus={filterStatus} />;
      case "network":   return <NetworkComponent   search={search} filterStatus={filterStatus} />;
      case "storage":   return <StorageComponent   search={search} filterStatus={filterStatus} />;
      case "ups":       return <UPSTabComponent    search={search} filterStatus={filterStatus} />;
      case "cooling":   return <CoolingTabComponent search={search} filterStatus={filterStatus} />;
      case "generator": return <GeneratorTabComponent search={search} filterStatus={filterStatus} />;
      case "racks":     return <RacksTabComponent  search={search} filterStatus={filterStatus} />;
      default:          return <OverviewComponent />;
    }
  }, [tab, search, filterStatus]);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.text, fontSize: 12 }}>
      <style>{css}</style>

      {/* KPI STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, padding: "8px 14px 6px", background: "#e8eef8", borderBottom: `1px solid ${C.border}` }}>
        {kpis.map((k, i) => (
          <div key={i} className="fade-up" style={{ background: k.bg, border: `1px solid ${k.color}44`, borderRadius: 10, padding: "8px 12px", boxShadow: C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${k.color}66,${k.color})`, borderRadius: "10px 10px 0 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1.1, fontFamily: "'JetBrains Mono'", ...(k.blink ? { animation: "pulse 2s infinite" } : {}) }}>
                  <Ctr end={k.val} dec={k.dec} suf={k.suf} />
                </div>
                <div style={{ fontSize: 9, color: C.sub, marginTop: 2, fontWeight: 600 }}>{k.icon} {k.label}</div>
              </div>
              <Spark data={k.spark} color={k.color} w={60} h={22} delay={i * ANIM.kpiStagger} />
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 0, padding: "0 14px", background: C.panel, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 16px", border: "none", background: "none", cursor: "pointer",
            fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? C.blue : C.sub,
            borderBottom: tab === t.id ? `2px solid ${C.blue}` : "2px solid transparent",
            fontFamily: "'DM Sans'", display: "flex", alignItems: "center", gap: 5,
            transition: "all .2s", whiteSpace: "nowrap",
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "10px 14px", overflowY: "auto", height: "calc(100vh - 175px)" }}>
        {renderTab}
      </div>
    </div>
  );
}