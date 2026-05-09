import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────
//  ANIMATION SPEED CONTROL — edit here
// ─────────────────────────────────────────
const ANIM = {
  counter:         3000,   // KPI number roll-up (ms)
  gauge:           3500,   // Gauge sweep (ms)
  gaugeDelay:       600,   // Gauge start delay (ms)
  powerChart:      4000,   // Power line draw (ms)
  capForecast:     3500,   // Capacity curve draw (ms)
  hbar:            2500,   // Horizontal bar fill (ms)
  hbarStagger:      200,   // Extra delay between bars (ms)
  thermalInterval: 1200,   // Thermal map update interval (ms)
  aiCycle:         5000,   // AI insight cycle (ms)
  donut:           2800,   // Donut chart draw (ms)
  sparkline:       3000,   // Sparkline / multi-line draw (ms)
  kpiStagger:       120,   // KPI card stagger (ms)
  chartTransition:  800,   // Chart transition animation (ms)
};

const C = {
  bg: "#f0f4fa", panel: "#ffffff", panelBorder: "#dde4f0",
  nav: "#1a2f5e", blue: "#1a6aff", cyan: "#0096c7",
  green: "#0cb87a", yellow: "#f5a623", red: "#e8304a",
  orange: "#f07030", purple: "#7c3aed",
  text: "#1a2340", muted: "#7a8aaa",
  accent: "#e8eef8", accentBorder: "#c8d4ea",
  shadow: "0 2px 12px rgba(26,47,94,0.10)",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700;800&family=Share+Tech+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #f0f4fa; }
  ::-webkit-scrollbar-thumb { background: #c8d4ea; border-radius: 2px; }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  .fade-in   { animation: fadeInUp 0.7s ease-out forwards; }
  .pulse-dot { animation: pulse 2s ease-in-out infinite; }
  .blink     { animation: blink 1.4s ease-in-out infinite; }
  .slide-in  { animation: slideIn 0.5s ease-out forwards; }
`;

const Panel = ({ children, style = {} }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "10px", boxShadow: C.shadow, ...style }}>{children}</div>
);
const PHead = ({ children, accent }) => (
  <div style={{ padding: "9px 13px", borderBottom: `1px solid ${C.accent}`, fontSize: "12px", fontWeight: "700", color: C.text, background: accent ? `linear-gradient(90deg, ${accent}0c, ${C.panel})` : C.panel, borderRadius: "10px 10px 0 0" }}>{children}</div>
);

// ── Helpers ──
function useAnimProg(duration, delay = 0) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let s = null;
    const go = ts => { if (!s) s = ts; const v = Math.min((ts - s) / duration, 1); setP(1 - Math.pow(1 - v, 3)); if (v < 1) requestAnimationFrame(go); };
    const id = setTimeout(() => requestAnimationFrame(go), delay);
    return () => clearTimeout(id);
  }, [duration, delay]);
  return p;
}

// ── Counter ──
function Counter({ end, duration = ANIM.counter, decimals = 0, suffix = "" }) {
  const p = useAnimProg(duration);
  return <>{(+(end * p).toFixed(decimals)).toLocaleString()}{suffix}</>;
}

// ── Sparkline ──
function Sparkline({ data, color, width = 72, height = 26, delay = 0 }) {
  const prog = useAnimProg(ANIM.sparkline, delay);
  const minV = Math.min(...data), maxV = Math.max(...data);
  const toX = i => (i / (data.length - 1)) * width;
  const toY = v => height - 4 - ((v - minV) / (maxV - minV + 0.001)) * (height - 8);
  const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const ap = lp + ` L ${width} ${height} L 0 ${height} Z`;
  const uid = `${color.replace("#","")}_${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`sc${uid}`}><rect x={0} y={0} width={width * prog} height={height} /></clipPath>
      </defs>
      <path d={ap} fill={`url(#sg${uid})`} clipPath={`url(#sc${uid})`} />
      <path d={lp} fill="none" stroke={color} strokeWidth="1.5" clipPath={`url(#sc${uid})`} />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2.5" fill={color} style={{ opacity: prog > 0.9 ? 1 : 0, transition: "opacity 0.3s" }} />
    </svg>
  );
}

// ── Gauge ──
function Gauge({ value, max, color, label, sub }) {
  const prog = useAnimProg(ANIM.gauge, ANIM.gaugeDelay);
  const pct = (value / max) * prog;
  const r = 38, cx = 60, cy = 60;
  const toRad = d => (d * Math.PI) / 180;
  const sa = -220, sw = 260;
  const x1 = cx + r * Math.cos(toRad(sa)), y1 = cy + r * Math.sin(toRad(sa));
  const ex = cx + r * Math.cos(toRad(sa + sw)), ey = cy + r * Math.sin(toRad(sa + sw));
  const ax = cx + r * Math.cos(toRad(sa + sw * pct)), ay = cy + r * Math.sin(toRad(sa + sw * pct));
  const lg = sw * pct > 180 ? 1 : 0;
  const id = label.replace(/\s/g, "");
  return (
    <svg width="120" height="88" viewBox="0 0 120 88">
      <defs><linearGradient id={`gg${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={color} stopOpacity="0.45" /><stop offset="100%" stopColor={color} /></linearGradient></defs>
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke={C.accent} strokeWidth="7" strokeLinecap="round" />
      {pct > 0.01 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${ax} ${ay}`} fill="none" stroke={`url(#gg${id})`} strokeWidth="7" strokeLinecap="round" />}
      {Array.from({ length: 9 }, (_, i) => { const a = toRad(sa + (i / 8) * sw); return <line key={i} x1={cx + 44 * Math.cos(a)} y1={cy + 44 * Math.sin(a)} x2={cx + 49 * Math.cos(a)} y2={cy + 49 * Math.sin(a)} stroke={C.accentBorder} strokeWidth="1.5" />; })}
      <text x="60" y="57" textAnchor="middle" fill={color} fontSize="15" fontWeight="800" fontFamily="'Exo 2'">{(value * prog).toFixed(value % 1 ? 2 : 0)}</text>
      <text x="60" y="69" textAnchor="middle" fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{label}</text>
      {sub && <text x="60" y="80" textAnchor="middle" fill={C.muted} fontSize="6.5" fontFamily="'Exo 2'">{sub}</text>}
    </svg>
  );
}

// ── Donut Chart ──
function Donut({ segments, size = 96, title }) {
  const prog = useAnimProg(ANIM.donut, 400);
  const r = 34, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let off = 0;
  const arcs = segments.map(seg => {
    const frac = (seg.value / total) * prog;
    const arc = { ...seg, dash: `${frac * circ} ${circ - frac * circ}`, offset: -(off * circ) };
    off += seg.value / total;
    return arc;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="9" />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="9"
            strokeDasharray={a.dash} strokeDashoffset={a.offset}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        ))}
        <text x={cx} y={cy - 3} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="800" fontFamily="'Exo 2'">{Math.round(prog * 100)}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill={C.muted} fontSize="6.5" fontFamily="'Exo 2'">{title}</text>
      </svg>
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center", marginTop: "3px" }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div style={{ width: "6px", height: "6px", background: s.color, borderRadius: "50%" }} />
            <span style={{ fontSize: "7.5px", color: C.muted, fontFamily: "'Exo 2'" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HBar ──
function HBar({ label, value, color, delay = 0 }) {
  const prog = useAnimProg(ANIM.hbar, delay);
  const w = prog * value;
  return (
    <div style={{ marginBottom: "7px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        <span style={{ fontSize: "10px", color: C.muted, fontFamily: "'Exo 2'" }}>{label}</span>
        <span style={{ fontSize: "10px", color, fontFamily: "'Share Tech Mono'", fontWeight: "700" }}>{Math.round(w)}%</span>
      </div>
      <div style={{ height: "7px", background: C.accent, borderRadius: "4px", overflow: "hidden", border: `1px solid ${C.accentBorder}` }}>
        <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: "4px", boxShadow: `0 0 6px ${color}55` }} />
      </div>
    </div>
  );
}

// ── Power Line Chart ──
function PowerChart({ highlightMetric = null }) {
  const prog = useAnimProg(ANIM.powerChart);
  const W = 560, H = 148;
  const data   = [580,610,640,660,700,720,710,730,740,780,820,825,840,860,900,950,980];
  const labels = ["6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm"];
  
  // Modify data based on highlighted metric
  let displayData = [...data];
  let highlightColor = C.blue;
  
  if (highlightMetric === "Power Load") {
    // Slightly increase values for power load highlight
    displayData = data.map(v => v * 1.02);
    highlightColor = C.yellow;
  } else if (highlightMetric === "Temperature") {
    // Add temperature-like pattern
    displayData = data.map((v, i) => v * (0.8 + Math.sin(i * 0.3) * 0.1));
    highlightColor = C.orange;
  } else if (highlightMetric === "PUE") {
    // Lower, more efficient pattern
    displayData = data.map(v => v * 0.85);
    highlightColor = C.green;
  }
  
  const px = 40, py = 10, gW = W - px * 2, gH = H - py * 2 - 18;
  const minV = 500, maxV = 1000;
  const toX = i => px + (i / (displayData.length - 1)) * gW;
  const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
  const lp = displayData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const ap = lp + ` L ${toX(displayData.length - 1)} ${py + gH} L ${px} ${py + gH} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={highlightColor} stopOpacity="0.15" /><stop offset="100%" stopColor={highlightColor} stopOpacity="0.01" /></linearGradient>
        <linearGradient id="lG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.cyan} /><stop offset="100%" stopColor={highlightColor} /></linearGradient>
        <filter id="gl"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <clipPath id="lclip"><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
      </defs>
      {[600,700,800,900,1000].map(v => (
        <g key={v}>
          <line x1={px} y1={toY(v)} x2={px + gW} y2={toY(v)} stroke={C.accent} strokeWidth="1" />
          <text x={px - 4} y={toY(v) + 3} textAnchor="end" fill={C.muted} fontSize="8" fontFamily="'Share Tech Mono'">{v}</text>
        </g>
      ))}
      <path d={ap} fill="url(#aG)" clipPath="url(#lclip)" />
      <path d={lp} fill="none" stroke="url(#lG)" strokeWidth="2.5" clipPath="url(#lclip)" filter="url(#gl)" />
      {prog > 0.65 && (() => { const fd = displayData.slice(11); const fp = fd.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(11 + i)} ${toY(v)}`).join(" "); return <path d={fp} fill="none" stroke={highlightColor + "66"} strokeWidth="1.5" strokeDasharray="5 3" clipPath="url(#lclip)" />; })()}
      <line x1={px} y1={toY(800)} x2={px + gW} y2={toY(800)} stroke={C.yellow + "aa"} strokeWidth="1" strokeDasharray="7 4" />
      <text x={px + gW - 4} y={toY(800) - 3} textAnchor="end" fill={C.yellow} fontSize="7.5" fontFamily="'Share Tech Mono'">800kW Threshold</text>
      {prog > 0.6 && <circle cx={toX(11)} cy={toY(825)} r="4.5" fill={highlightColor} stroke="#fff" strokeWidth="2" />}
      {displayData.filter((_, i) => i % 4 === 0).map((_, ii) => { const oi = ii * 4; return <text key={ii} x={toX(oi)} y={H - 3} textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="'Share Tech Mono'">{labels[oi]}</text>; })}
      <rect x={px + gW - 68} y={py} width="66" height="14" rx="3" fill={C.accent} stroke={C.accentBorder} />
      <circle cx={px + gW - 58} cy={py + 7} r="3" fill={highlightColor} />
      <text x={px + gW - 51} y={py + 11} fill={highlightColor} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">Forecast</text>
      {highlightMetric && (
        <text x={px + 10} y={py + 14} fill={highlightColor} fontSize="9" fontWeight="700" fontFamily="'Exo 2'">🔍 {highlightMetric} View</text>
      )}
    </svg>
  );
}

// ── Thermal Map ──
function ThermalMap({ highlightMetric = null }) {
  const heat = [[3,3,4,5,6,7,6,5,4,3],[3,4,5,6,7,8,7,6,5,4],[4,5,6,7,8,9,8,7,6,5],[3,4,6,7,9,8,7,7,5,4],[3,4,5,6,7,8,8,6,5,3],[4,5,6,7,8,9,8,7,6,5],[3,4,5,6,7,7,6,5,4,3],[3,3,4,5,5,6,5,4,3,3]];
  const [frame, setFrame] = useState(0);
  useEffect(() => { const id = setInterval(() => setFrame(f => f + 1), ANIM.thermalInterval); return () => clearInterval(id); }, []);
  
  // Modify heat map based on highlighted metric
  let modifiedHeat = heat;
  if (highlightMetric === "Temperature") {
    // Increase temperatures
    modifiedHeat = heat.map(row => row.map(v => Math.min(9, v + 1.5)));
  } else if (highlightMetric === "Critical Alerts") {
    // Add hot spots
    modifiedHeat = heat.map((row, r) => row.map((v, c) => (r === 2 && c === 5) || (r === 4 && c === 3) ? 9 : v));
  }
  
  const getCol = v => v <= 4 ? C.green : v <= 6 ? "#80cc44" : v <= 7 ? C.yellow : v <= 8 ? C.orange : C.red;
  const getBg  = v => v <= 4 ? "#e8faf3" : v <= 6 ? "#f4fce8" : v <= 7 ? "#fffae8" : v <= 8 ? "#fff3e8" : "#feeaed";
  return (
    <div style={{ padding: "8px" }}>
      <div style={{ marginBottom: "6px" }}><span className="blink" style={{ fontSize: "10px", fontWeight: "700", color: C.red, fontFamily: "'Exo 2'" }}>⚠ Hotspots Detected</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "2px" }}>
        {modifiedHeat.map((row, r) => row.map((v, c) => {
          const noise = Math.sin(frame * 0.4 + r * 0.7 + c * 0.3) * 0.6;
          const cv = Math.max(1, Math.min(9, Math.round(v + noise)));
          return <div key={`${r}-${c}`} style={{ height: "15px", background: getBg(cv), border: `1px solid ${getCol(cv)}55`, borderRadius: "2px", transition: `background ${ANIM.thermalInterval * 0.8}ms ease` }} />;
        }))}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "6px", justifyContent: "center" }}>
        {[C.green,"#80cc44",C.yellow,C.orange,C.red].map((col, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div style={{ width: "8px", height: "8px", background: col, borderRadius: "2px", opacity: 0.85 }} />
            <span style={{ fontSize: "7px", color: C.muted, fontFamily: "'Share Tech Mono'" }}>{["Cool","Low","Med","High","Hot"][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cap Forecast ──
function CapForecast({ color, label, delay = 0, highlightMetric = null }) {
  const prog = useAnimProg(ANIM.capForecast, delay);
  const W = 220, H = 80;
  let data = [10,18,22,30,38,45,52,60,68,75,82,90];
  
  // Modify data based on highlighted metric
  if (highlightMetric === "Capacity Utilization") {
    data = [15,25,35,45,55,65,72,78,82,85,88,92];
  } else if (highlightMetric === "Power Load") {
    data = [20,28,35,42,50,58,65,72,78,83,87,90];
  }
  
  const px = 8, py = 8, gW = W - px * 2, gH = H - py * 2 - 14;
  const toX = i => px + (i / (data.length - 1)) * gW;
  const toY = v => py + gH - (v / 100) * gH;
  const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const ap = lp + ` L ${toX(data.length - 1)} ${py + gH} L ${px} ${py + gH} Z`;
  const iid = label[0] + color.replace("#", "");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`cgg${iid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient>
        <clipPath id={`ccl${iid}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
      </defs>
      <path d={ap} fill={`url(#cgg${iid})`} clipPath={`url(#ccl${iid})`} />
      <path d={lp} fill="none" stroke={color} strokeWidth="2" clipPath={`url(#ccl${iid})`} />
      {prog > 0.88 && <path d={`M ${toX(data.length-2)} ${toY(82)} L ${toX(data.length-1)+18} ${toY(96)}`} fill="none" stroke={color+"88"} strokeWidth="1.5" strokeDasharray="3 2" />}
      <circle cx={toX(data.length-1)} cy={toY(90)} r="3" fill={color} stroke="#fff" strokeWidth="1.5" style={{ opacity: prog > 0.88 ? 1 : 0, transition: "opacity 0.4s" }} />
      <text x={px} y={H-2} fill={C.yellow} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">· {label}</text>
    </svg>
  );
}

// ── Temperature Multi-Line ──
function TempChart({ highlightMetric = null }) {
  const prog = useAnimProg(ANIM.sparkline, 300);
  const W = 340, H = 110;
  const zones = [
    { label: "Zone A", color: C.blue,   data: [22,22.5,23,22.8,23.2,23.5,23.4,23.8,24,23.6,23.4,23.2] },
    { label: "Zone B", color: C.orange, data: [24,24.5,25,25.3,25.8,26,25.6,25.2,25.5,26,26.2,25.8] },
    { label: "Zone C", color: C.green,  data: [21,21.5,22,21.8,22.2,22,22.5,22.3,22.8,22.5,22,21.8] },
  ];
  
  // Modify data based on highlighted metric
  let displayZones = zones;
  if (highlightMetric === "Temperature") {
    // Increase all temperatures
    displayZones = zones.map(zone => ({
      ...zone,
      data: zone.data.map(v => v + 1.2)
    }));
  } else if (highlightMetric === "Critical Alerts") {
    // Add spike in Zone B
    displayZones = zones.map(zone => ({
      ...zone,
      data: zone.label === "Zone B" ? zone.data.map((v, i) => i > 7 ? v + 2.5 : v) : zone.data
    }));
  }
  
  const px = 28, py = 14, gW = W - px * 2, gH = H - py * 2 - 14;
  const minV = 20, maxV = 30;
  const toX = (i, len) => px + (i / (len - 1)) * gW;
  const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        {displayZones.map(z => <clipPath key={z.label} id={`tc${z.label}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>)}
        <filter id="tg"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[22,24,26,28].map(v => (
        <g key={v}>
          <line x1={px} y1={toY(v)} x2={px+gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" strokeDasharray="4 3" />
          <text x={px-3} y={toY(v)+3} textAnchor="end" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{v}°</text>
        </g>
      ))}
      {displayZones.map(z => {
        const lp = z.data.map((v, i) => `${i===0?"M":"L"} ${toX(i,z.data.length)} ${toY(v)}`).join(" ");
        return <path key={z.label} d={lp} fill="none" stroke={z.color} strokeWidth="2" clipPath={`url(#tc${z.label})`} filter="url(#tg)" />;
      })}
      {["6am","8am","10am","12pm","2pm","4pm"].map((l, i) => <text key={i} x={toX(i*2,12)} y={H-2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
      {displayZones.map((z, i) => (
        <g key={i}>
          <line x1={px + i*80} y1={py-4} x2={px+i*80+12} y2={py-4} stroke={z.color} strokeWidth="2" />
          <text x={px+i*80+15} y={py-1} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{z.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Network Traffic ──
function NetworkChart({ highlightMetric = null }) {
  const prog = useAnimProg(ANIM.sparkline, 600);
  const W = 340, H = 90;
  let inD  = [120,145,130,160,175,190,185,200,210,195,220,215];
  let outD = [80,95,88,110,125,130,120,140,150,138,155,145];
  
  // Modify data based on highlighted metric
  if (highlightMetric === "Power Load") {
    // Increase both
    inD = inD.map(v => v * 1.15);
    outD = outD.map(v => v * 1.1);
  } else if (highlightMetric === "Critical Alerts") {
    // Add spikes
    inD = inD.map((v, i) => i === 7 ? v * 1.4 : v);
    outD = outD.map((v, i) => i === 8 ? v * 1.3 : v);
  }
  
  const px = 28, py = 10, gW = W-px*2, gH = H-py*2-12;
  const minV = 60, maxV = 260;
  const toX = (i, l) => px + (i/(l-1))*gW;
  const toY = v => py + gH - ((v-minV)/(maxV-minV))*gH;
  const mPath = (d) => d.map((v,i) => `${i===0?"M":"L"} ${toX(i,d.length)} ${toY(v)}`).join(" ");
  const mArea = (d, p) => p + ` L ${toX(d.length-1,d)} ${py+gH} L ${px} ${py+gH} Z`;
  const ip = mPath(inD), op = mPath(outD);
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity="0.2" /><stop offset="100%" stopColor={C.green} stopOpacity="0" /></linearGradient>
        <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.15" /><stop offset="100%" stopColor={C.purple} stopOpacity="0" /></linearGradient>
        <clipPath id="nc"><rect x={px} y={0} width={gW*prog} height={H} /></clipPath>
        <filter id="ng"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[100,150,200,250].map(v => <line key={v} x1={px} y1={toY(v)} x2={px+gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" />)}
      <path d={mArea(inD, ip)} fill="url(#inG)" clipPath="url(#nc)" />
      <path d={mArea(outD,op)} fill="url(#outG)" clipPath="url(#nc)" />
      <path d={ip} fill="none" stroke={C.green}  strokeWidth="2" clipPath="url(#nc)" filter="url(#ng)" />
      <path d={op} fill="none" stroke={C.purple} strokeWidth="2" clipPath="url(#nc)" filter="url(#ng)" />
      {["6am","8am","10am","12pm","2pm","4pm"].map((l,i) => <text key={i} x={toX(i*2,12)} y={H-1} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
      {[["↑ In",C.green],["↓ Out",C.purple]].map(([l,c],i) => (
        <g key={i}><line x1={px+i*70} y1={py+3} x2={px+i*70+12} y2={py+3} stroke={c} strokeWidth="2" /><text x={px+i*70+15} y={py+6} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
      ))}
    </svg>
  );
}

// ── Stacked Bar ──
function StackedBar({ highlightMetric = null }) {
  const prog = useAnimProg(ANIM.hbar, 500);
  let data = [{l:"Mon",a:320,b:180,c:80},{l:"Tue",a:340,b:190,c:75},{l:"Wed",a:360,b:200,c:85},{l:"Thu",a:300,b:170,c:70},{l:"Fri",a:380,b:210,c:90},{l:"Sat",a:250,b:140,c:60},{l:"Sun",a:230,b:130,c:55}];
  
  // Modify data based on highlighted metric
  if (highlightMetric === "Power Load") {
    // Increase IT load
    data = data.map(d => ({...d, a: d.a * 1.12}));
  } else if (highlightMetric === "PUE") {
    // Decrease cooling (improve efficiency)
    data = data.map(d => ({...d, b: d.b * 0.88}));
  } else if (highlightMetric === "Capacity Utilization") {
    // Increase all
    data = data.map(d => ({...d, a: d.a * 1.08, b: d.b * 1.05, c: d.c * 1.1}));
  }
  
  const W = 320, H = 110, px = 10, py = 14, gW = W-px*2, gH = H-py*2-14, maxV = 700;
  const bW = gW/data.length - 4;
  const cols = [C.blue, C.cyan, C.yellow];
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const x = px + i*(gW/data.length) + 2;
        let yOff = py + gH;
        return (
          <g key={i}>
            {[[d.a,0],[d.b,1],[d.c,2]].map(([val, ci]) => {
              const h = (val/maxV)*gH*prog; yOff -= h;
              return <rect key={ci} x={x} y={yOff} width={bW} height={h} fill={cols[ci]} rx="1" opacity="0.85" />;
            })}
            <text x={x+bW/2} y={H-2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{d.l}</text>
          </g>
        );
      })}
      {[["IT Load",C.blue],["Cooling",C.cyan],["Lighting",C.yellow]].map(([l,c],i) => (
        <g key={i}><rect x={px+i*85} y={py-8} width="8" height="6" fill={c} rx="1" /><text x={px+i*85+11} y={py-4} fill={C.muted} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
      ))}
    </svg>
  );
}

// ── Mini Rack ──
function MiniRack({ idx, highlightMetric = null }) {
  const pal = [C.green,C.yellow,C.green,C.red,C.cyan,C.green,C.orange,C.green];
  
  // Modify colors based on highlighted metric
  let modifiedPal = pal;
  if (highlightMetric === "Critical Alerts") {
    // Add more reds
    modifiedPal = pal.map((c, i) => i % 3 === 0 ? C.red : c);
  } else if (highlightMetric === "Temperature") {
    // Add more oranges
    modifiedPal = pal.map((c, i) => i % 4 === 0 ? C.orange : c);
  }
  
  const bg = c => c===C.green?"#e8faf3":c===C.yellow?"#fffae8":c===C.red?"#feeaed":c===C.cyan?"#e8f6ff":"#fff3e8";
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "8px", padding: "8px", boxShadow: C.shadow }}>
      <div style={{ display: "flex", gap: "3px" }}>
        {[0,1,2].map(col => (
          <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            {[...Array(7)].map((_,row) => { const c=modifiedPal[(idx+col+row)%modifiedPal.length]; return <div key={row} style={{ height:"7px", background:bg(c), border:`1px solid ${c}55`, borderRadius:"1px" }} />; })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: "8px", color: C.muted, marginTop: "4px", fontFamily: "'Share Tech Mono'" }}>RACK-0{idx+1}</div>
    </div>
  );
}

// ── Detailed KPI View Component ──
function DetailedKPIView({ selectedKPI, kpiData }) {
  if (!selectedKPI) return null;
  
  return (
    <div className="slide-in" style={{ marginTop: "10px" }}>
      <Panel style={{ border: `2px solid ${selectedKPI.color}40`, background: `linear-gradient(to bottom, ${selectedKPI.color}08, white)` }}>
        <PHead accent={selectedKPI.color}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>{selectedKPI.icon}</span>
            <span>{selectedKPI.label} - Detailed Analysis</span>
            <span style={{ fontSize: "18px", color: selectedKPI.color, fontFamily: "'Share Tech Mono'", marginLeft: "auto" }}>
              <Counter end={selectedKPI.end} decimals={selectedKPI.dec || 0} suffix={selectedKPI.unit} />
            </span>
          </span>
        </PHead>
        <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>Historical Trend (7 Days)</div>
            <Sparkline data={selectedKPI.sparkData} color={selectedKPI.color} width={200} height={50} delay={0} />
            <div style={{ marginTop: "15px" }}>
              <HBar label="Current vs Target" value={85} color={selectedKPI.color} delay={200} />
              <HBar label="Efficiency Score" value={92} color={C.green} delay={400} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>Related Metrics</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
                <div style={{ fontSize: "9px", color: C.muted }}>Peak</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.color }}>{Math.max(...selectedKPI.sparkData)}{selectedKPI.unit}</div>
              </div>
              <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
                <div style={{ fontSize: "9px", color: C.muted }}>Min</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.color }}>{Math.min(...selectedKPI.sparkData)}{selectedKPI.unit}</div>
              </div>
              <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
                <div style={{ fontSize: "9px", color: C.muted }}>Avg</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.color }}>
                  {Math.round(selectedKPI.sparkData.reduce((a,b) => a+b, 0) / selectedKPI.sparkData.length)}{selectedKPI.unit}
                </div>
              </div>
              <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
                <div style={{ fontSize: "9px", color: C.muted }}>Trend</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.sparkData[selectedKPI.sparkData.length-1] > selectedKPI.sparkData[0] ? C.green : C.red }}>
                  {selectedKPI.sparkData[selectedKPI.sparkData.length-1] > selectedKPI.sparkData[0] ? "↑" : "↓"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════
export default function DCIMDashboard() {
  const [time, setTime] = useState(new Date());
  const [aiIdx, setAiIdx] = useState(0);
  const [sidebarIdx, setSidebarIdx] = useState(0);
  const [selectedKPI, setSelectedKPI] = useState(null);

  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setAiIdx(i => (i+1)%3), ANIM.aiCycle); return () => clearInterval(id); }, []);

  const kpis = [
    { icon:"⚡", label:"Power Load",    end:825,  unit:" kW", color:C.yellow, bg:"#fffbf0", sparkData:[700,720,740,710,760,790,825], dec:0 },
    { icon:"🌡", label:"Temperature",      end:23.4, unit:"°C", dec:1, color:C.cyan,   bg:"#f0faff",  sparkData:[22.1,22.8,23.2,22.9,23.5,23.1,23.4] },
    { icon:"📊", label:"PUE",                  end:1.45, unit:"",   dec:2, color:C.orange, bg:"#fff7f0", sparkData:[1.55,1.52,1.49,1.51,1.47,1.46,1.45] },
    { icon:"🚨", label:"Critical Alerts",      end:3,    unit:"",   color:C.red,    bg:"#fff0f3", blink:true, sparkData:[1,2,1,3,2,3,3], dec:0 },
    { icon:"💾", label:"Capacity Utilization", end:78,   unit:"%",  color:C.blue,   bg:"#f0f5ff",  sparkData:[65,68,70,72,74,76,78], dec:0 },
    { icon:"✅", label:"Uptime SLA",           end:99.9, unit:"%",  dec:1, color:C.green,  bg:"#f0fdf8", sparkData:[99.9,100,99.9,100,99.9,99.9,99.9] },
  ];

  const maintenance = [
    { name:"CRAC Unit 3",    issue:"High Failure Risk",  level:"critical", icon:"🔴" },
    { name:"Battery Bank 2", issue:"Replace in 15 Days", level:"warn",     icon:"🟡" },
    { name:"Server R14",     issue:"Overheating Alert",  level:"ok",       icon:"🟡" },
  ];

  const insights = [
    "Cooling load in Zone B can be reduced by 12%.",
    "UPS-2 battery health deteriorating.",
    "Rack 14 predicted to exceed power limit in 2 days.",
  ];

  const assetDonut = [{label:"Servers",value:45,color:C.blue},{label:"Network",value:25,color:C.cyan},{label:"Storage",value:20,color:C.green},{label:"Other",value:10,color:C.yellow}];
  const powerDonut  = [{label:"IT Load",value:55,color:C.blue},{label:"Cooling",value:30,color:C.cyan},{label:"Lighting",value:15,color:C.yellow}];

  const handleKPIClick = (kpi) => {
    setSelectedKPI(kpi === selectedKPI ? null : kpi);
  };

  return (
    <div style={{ background: C.bg, minHeight:"100vh", fontFamily:"'Exo 2', sans-serif", color:C.text, fontSize:"12px" }}>
      <style>{styles}</style>

      {/* KPI ROW */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:"10px", padding:"12px 18px 10px", background:"#e4eaf6", borderBottom:`1px solid ${C.panelBorder}` }}>
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            className="fade-in" 
            onClick={() => handleKPIClick(kpi)}
            style={{ 
              background: selectedKPI === kpi ? `${kpi.color}15` : kpi.bg, 
              border: `2px solid ${selectedKPI === kpi ? kpi.color : `${kpi.color}44`}`, 
              borderRadius:"10px", 
              padding:"10px 12px", 
              display:"flex", 
              flexDirection:"column", 
              boxShadow: selectedKPI === kpi ? `0 4px 16px ${kpi.color}40` : C.shadow, 
              animationDelay:`${i*ANIM.kpiStagger}ms`, 
              opacity:0, 
              position:"relative", 
              overflow:"hidden",
              cursor:"pointer",
              transform: selectedKPI === kpi ? "scale(1.02)" : "scale(1)",
              transition: "all 0.3s ease",
              zIndex: selectedKPI === kpi ? 2 : 1
            }}
          >
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:`linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius:"10px 10px 0 0" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:"20px", fontWeight:"800", color:kpi.color, lineHeight:1.1, fontFamily:"'Share Tech Mono'", ...(kpi.blink ? {animation:"pulse 2s infinite"} : {}) }}>
                  <Counter end={kpi.end} decimals={kpi.dec||0} suffix={kpi.unit} />
                </div>
                <div style={{ fontSize:"9px", color:C.muted, marginTop:"2px", fontWeight:"600" }}>{kpi.icon} {kpi.label}</div>
              </div>
              <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i*ANIM.kpiStagger} />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed KPI View (Appears below KPI row when selected) */}
      <DetailedKPIView selectedKPI={selectedKPI} kpiData={kpis} />

      {/* BODY */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 250px", gap:"10px", padding:"10px 18px", height: selectedKPI ? "calc(100vh - 210px)" : "calc(100vh - 142px)", overflowY:"auto", transition: "height 0.3s ease" }}>

        {/* LEFT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          <Panel>
            {["Site: All","Room: Data Hall 1","Rack: All Racks","Time: Last 7 Days"].map((item, i) => (
              <div key={i} onClick={() => setSidebarIdx(i)} style={{ padding:"9px 13px", borderBottom:i<3?`1px solid ${C.accent}`:"none", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", background:sidebarIdx===i?`${C.blue}0d`:"transparent", borderLeft:sidebarIdx===i?`3px solid ${C.blue}`:"3px solid transparent", transition:"all 0.3s" }}>
                <span style={{ fontSize:"11px", color:sidebarIdx===i?C.blue:C.text, fontWeight:sidebarIdx===i?"700":"400" }}>{item}</span>
                <span style={{ color:C.muted, fontSize:"10px" }}>▾</span>
              </div>
            ))}
          </Panel>
          {[0,1,2].map(r => <MiniRack key={r} idx={r} highlightMetric={selectedKPI?.label} />)}
        </div>

        {/* CENTER */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          {/* AI Banner */}
          <div style={{ background:"linear-gradient(90deg, #f0f6ff, #eaf4ff)", border:`1px solid ${C.blue}44`, borderRadius:"10px", padding:"10px 14px", display:"flex", gap:"10px", alignItems:"flex-start", boxShadow:C.shadow }}>
            <div style={{ background:`linear-gradient(135deg, ${C.blue}, ${C.cyan})`, borderRadius:"7px", padding:"5px 12px", fontSize:"11px", fontWeight:"800", color:"#fff", whiteSpace:"nowrap", flexShrink:0 }}>🤖 AI Insight»</div>
            <div style={{ flex:1 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"2px 0", opacity:i===aiIdx?1:0.38, transition:"opacity 0.8s" }}>
                  <span style={{ color:C.blue, fontSize:"12px", fontWeight:"700" }}>•</span>
                  <span style={{ fontSize:"11px", color:i===aiIdx?C.text:C.muted, fontWeight:i===aiIdx?"600":"400" }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Power Chart */}
          <Panel>
            <PHead>⚡ Power Usage Trends {selectedKPI && `- Focus: ${selectedKPI.label}`}</PHead>
            <div style={{ padding:"4px 8px 6px" }}><PowerChart highlightMetric={selectedKPI?.label} /></div>
          </Panel>

          {/* Temp + Network */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <Panel><PHead accent={C.orange}>🌡 Zone Temperature (°C)</PHead><div style={{ padding:"6px 8px 4px" }}><TempChart highlightMetric={selectedKPI?.label} /></div></Panel>
            <Panel><PHead accent={C.purple}>🌐 Network Traffic (Mbps)</PHead><div style={{ padding:"6px 8px 4px" }}><NetworkChart highlightMetric={selectedKPI?.label} /></div></Panel>
          </div>

          {/* Capacity + Thermal */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <Panel style={{ padding:"10px" }}>
              <div style={{ fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:"6px" }}>📈 Capacity Forecast</div>
              <CapForecast color={C.blue} label="90% Capacity Full by Next Month" delay={300} highlightMetric={selectedKPI?.label} />
            </Panel>
            <Panel><PHead accent={C.red}>🔥 Data Center Thermal Map</PHead><ThermalMap highlightMetric={selectedKPI?.label} /></Panel>
          </div>

          {/* Stacked Bar + UPS bars */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <Panel><PHead accent={C.blue}>📊 Weekly Power Breakdown (kW)</PHead><div style={{ padding:"6px 10px 8px" }}><StackedBar highlightMetric={selectedKPI?.label} /></div></Panel>
            <Panel style={{ padding:"10px" }}>
              <div style={{ fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:"8px" }}>📈 Capacity Forecast</div>
              <CapForecast color={C.green} label="90% Capacity Full by Next Month" delay={400} highlightMetric={selectedKPI?.label} />
              <div style={{ marginTop:"8px" }}>
                <HBar label="UPS Load"          value={74} color={C.yellow} delay={400} />
                <HBar label="Cooling Efficiency" value={92} color={C.green}  delay={400+ANIM.hbarStagger} />
              </div>
            </Panel>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          <Panel>
            <PHead accent={C.orange}>🔧 Predictive Maintenance</PHead>
            <div style={{ padding:"10px" }}>
              {maintenance.map((item, i) => (
                <div key={i} style={{ padding:"9px 10px", borderRadius:"8px", marginBottom:i<2?"7px":0, background:item.level==="critical"?"#fff0f3":item.level==="warn"?"#fffae8":"#f0fdf8", border:`1px solid ${item.level==="critical"?C.red:item.level==="warn"?C.yellow:C.green}44`, display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"16px", animation:item.level!=="ok"?"pulse 2s infinite":"none" }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"11px", fontWeight:"700", color:C.text }}>{item.name}</div>
                    <div style={{ fontSize:"9px", color:item.level==="critical"?C.red:item.level==="warn"?C.yellow:C.green, fontWeight:"600" }}>{item.issue}</div>
                  </div>
                  <span>{item.level==="ok"?"✅":"⚠️"}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PHead accent={C.blue}>🍩 Asset & Power Distribution</PHead>
            <div style={{ padding:"8px", display:"flex", justifyContent:"space-around" }}>
              <Donut segments={assetDonut} size={96} title="Assets" />
              <Donut segments={powerDonut}  size={96} title="Power"  />
            </div>
          </Panel>

          <Panel>
            <PHead accent={C.green}>⚡ Energy Efficiency</PHead>
            <div style={{ padding:"8px", display:"flex", justifyContent:"space-around" }}>
              <Gauge value={1.45} max={3}  color={C.orange} label="PUE"      sub="Power Usage"     />
              <Gauge value={18.5} max={30} color={C.green}  label="Tons CO₂" sub="Carbon Footprint" />
            </div>
          </Panel>

          <Panel style={{ padding:"10px" }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:"10px" }}>📋 System Health</div>
            <HBar label="Network Uptime"     value={99} color={C.green}  delay={200} />
            <HBar label="Storage Capacity"   value={78} color={C.blue}   delay={200+ANIM.hbarStagger} />
            <HBar label="CPU Load Avg"       value={65} color={C.cyan}   delay={200+ANIM.hbarStagger*2} />
            <HBar label="Memory Utilization" value={82} color={C.yellow} delay={200+ANIM.hbarStagger*3} />
            <HBar label="GPU Utilization"    value={55} color={C.purple} delay={200+ANIM.hbarStagger*4} />
          </Panel>

          <div style={{ background:"#fff5f7", border:`1px solid ${C.red}44`, borderRadius:"10px", padding:"10px 12px", boxShadow:C.shadow }}>
            <div style={{ fontSize:"10px", fontWeight:"800", color:C.red, marginBottom:"6px", display:"flex", alignItems:"center", gap:"5px" }}>
              <span className="pulse-dot">🔴</span> LIVE ALERTS
            </div>
            {["Rack 14 temp: 34°C","UPS-2 battery: 42%","PDU-3 load: 92%"].map((a, i) => (
              <div key={i} style={{ fontSize:"10px", color:C.text, padding:"5px 0", borderBottom:i<2?`1px solid ${C.red}22`:"none", fontFamily:"'Share Tech Mono'", display:"flex", gap:"5px", alignItems:"center" }}>
                <span style={{ color:C.red, fontWeight:"800" }}>▶</span> {a}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}