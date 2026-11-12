// // import React, { useState, useEffect } from "react";

// // // ─────────────────────────────────────────
// // //  ANIMATION SPEED CONTROL — edit here
// // // ─────────────────────────────────────────
// // const ANIM = {
// //   counter:         3000,   // KPI number roll-up (ms)
// //   gauge:           3500,   // Gauge sweep (ms)
// //   gaugeDelay:       600,   // Gauge start delay (ms)
// //   powerChart:      4000,   // Power line draw (ms)
// //   capForecast:     3500,   // Capacity curve draw (ms)
// //   hbar:            2500,   // Horizontal bar fill (ms)
// //   hbarStagger:      200,   // Extra delay between bars (ms)
// //   thermalInterval: 1200,   // Thermal map update interval (ms)
// //   aiCycle:         5000,   // AI insight cycle (ms)
// //   donut:           2800,   // Donut chart draw (ms)
// //   sparkline:       3000,   // Sparkline / multi-line draw (ms)
// //   kpiStagger:       120,   // KPI card stagger (ms)
// //   chartTransition:  800,   // Chart transition animation (ms)
// // };

// // const C = {
// //   bg: "#f0f4fa", panel: "#ffffff", panelBorder: "#dde4f0",
// //   nav: "#1a2f5e", blue: "#1a6aff", cyan: "#0096c7",
// //   green: "#0cb87a", yellow: "#f5a623", red: "#e8304a",
// //   orange: "#f07030", purple: "#7c3aed",
// //   text: "#1a2340", muted: "#7a8aaa",
// //   accent: "#e8eef8", accentBorder: "#c8d4ea",
// //   shadow: "0 2px 12px rgba(26,47,94,0.10)",
// // };

// // const styles = `
// //   @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700;800&family=Share+Tech+Mono&display=swap');
// //   * { box-sizing: border-box; margin: 0; padding: 0; }
// //   ::-webkit-scrollbar { width: 4px; height: 4px; }
// //   ::-webkit-scrollbar-track { background: #f0f4fa; }
// //   ::-webkit-scrollbar-thumb { background: #c8d4ea; border-radius: 2px; }
// //   @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
// //   @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
// //   @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.4} }
// //   @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
// //   .fade-in   { animation: fadeInUp 0.7s ease-out forwards; }
// //   .pulse-dot { animation: pulse 2s ease-in-out infinite; }
// //   .blink     { animation: blink 1.4s ease-in-out infinite; }
// //   .slide-in  { animation: slideIn 0.5s ease-out forwards; }
// // `;

// // const Panel = ({ children, style = {} }) => (
// //   <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "10px", boxShadow: C.shadow, ...style }}>{children}</div>
// // );
// // const PHead = ({ children, accent }) => (
// //   <div style={{ padding: "9px 13px", borderBottom: `1px solid ${C.accent}`, fontSize: "12px", fontWeight: "700", color: C.text, background: accent ? `linear-gradient(90deg, ${accent}0c, ${C.panel})` : C.panel, borderRadius: "10px 10px 0 0" }}>{children}</div>
// // );

// // // ── Helpers ──
// // function useAnimProg(duration, delay = 0) {
// //   const [p, setP] = useState(0);
// //   useEffect(() => {
// //     let s = null;
// //     const go = ts => { if (!s) s = ts; const v = Math.min((ts - s) / duration, 1); setP(1 - Math.pow(1 - v, 3)); if (v < 1) requestAnimationFrame(go); };
// //     const id = setTimeout(() => requestAnimationFrame(go), delay);
// //     return () => clearTimeout(id);
// //   }, [duration, delay]);
// //   return p;
// // }

// // // ── Counter ──
// // function Counter({ end, duration = ANIM.counter, decimals = 0, suffix = "" }) {
// //   const p = useAnimProg(duration);
// //   return <>{(+(end * p).toFixed(decimals)).toLocaleString()}{suffix}</>;
// // }

// // // ── Sparkline ──
// // function Sparkline({ data, color, width = 72, height = 26, delay = 0 }) {
// //   const prog = useAnimProg(ANIM.sparkline, delay);
// //   const minV = Math.min(...data), maxV = Math.max(...data);
// //   const toX = i => (i / (data.length - 1)) * width;
// //   const toY = v => height - 4 - ((v - minV) / (maxV - minV + 0.001)) * (height - 8);
// //   const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
// //   const ap = lp + ` L ${width} ${height} L 0 ${height} Z`;
// //   const uid = `${color.replace("#","")}_${width}`;
// //   return (
// //     <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
// //       <defs>
// //         <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
// //           <stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" />
// //         </linearGradient>
// //         <clipPath id={`sc${uid}`}><rect x={0} y={0} width={width * prog} height={height} /></clipPath>
// //       </defs>
// //       <path d={ap} fill={`url(#sg${uid})`} clipPath={`url(#sc${uid})`} />
// //       <path d={lp} fill="none" stroke={color} strokeWidth="1.5" clipPath={`url(#sc${uid})`} />
// //       <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2.5" fill={color} style={{ opacity: prog > 0.9 ? 1 : 0, transition: "opacity 0.3s" }} />
// //     </svg>
// //   );
// // }

// // // ── Gauge ──
// // function Gauge({ value, max, color, label, sub }) {
// //   const prog = useAnimProg(ANIM.gauge, ANIM.gaugeDelay);
// //   const pct = (value / max) * prog;
// //   const r = 38, cx = 60, cy = 60;
// //   const toRad = d => (d * Math.PI) / 180;
// //   const sa = -220, sw = 260;
// //   const x1 = cx + r * Math.cos(toRad(sa)), y1 = cy + r * Math.sin(toRad(sa));
// //   const ex = cx + r * Math.cos(toRad(sa + sw)), ey = cy + r * Math.sin(toRad(sa + sw));
// //   const ax = cx + r * Math.cos(toRad(sa + sw * pct)), ay = cy + r * Math.sin(toRad(sa + sw * pct));
// //   const lg = sw * pct > 180 ? 1 : 0;
// //   const id = label.replace(/\s/g, "");
// //   return (
// //     <svg width="120" height="88" viewBox="0 0 120 88">
// //       <defs><linearGradient id={`gg${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={color} stopOpacity="0.45" /><stop offset="100%" stopColor={color} /></linearGradient></defs>
// //       <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke={C.accent} strokeWidth="7" strokeLinecap="round" />
// //       {pct > 0.01 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${ax} ${ay}`} fill="none" stroke={`url(#gg${id})`} strokeWidth="7" strokeLinecap="round" />}
// //       {Array.from({ length: 9 }, (_, i) => { const a = toRad(sa + (i / 8) * sw); return <line key={i} x1={cx + 44 * Math.cos(a)} y1={cy + 44 * Math.sin(a)} x2={cx + 49 * Math.cos(a)} y2={cy + 49 * Math.sin(a)} stroke={C.accentBorder} strokeWidth="1.5" />; })}
// //       <text x="60" y="57" textAnchor="middle" fill={color} fontSize="15" fontWeight="800" fontFamily="'Exo 2'">{(value * prog).toFixed(value % 1 ? 2 : 0)}</text>
// //       <text x="60" y="69" textAnchor="middle" fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{label}</text>
// //       {sub && <text x="60" y="80" textAnchor="middle" fill={C.muted} fontSize="6.5" fontFamily="'Exo 2'">{sub}</text>}
// //     </svg>
// //   );
// // }

// // // ── Donut Chart ──
// // function Donut({ segments, size = 96, title }) {
// //   const prog = useAnimProg(ANIM.donut, 400);
// //   const r = 34, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
// //   const total = segments.reduce((a, s) => a + s.value, 0);
// //   let off = 0;
// //   const arcs = segments.map(seg => {
// //     const frac = (seg.value / total) * prog;
// //     const arc = { ...seg, dash: `${frac * circ} ${circ - frac * circ}`, offset: -(off * circ) };
// //     off += seg.value / total;
// //     return arc;
// //   });
// //   return (
// //     <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
// //       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
// //         <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="9" />
// //         {arcs.map((a, i) => (
// //           <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="9"
// //             strokeDasharray={a.dash} strokeDashoffset={a.offset}
// //             style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
// //         ))}
// //         <text x={cx} y={cy - 3} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="800" fontFamily="'Exo 2'">{Math.round(prog * 100)}%</text>
// //         <text x={cx} y={cy + 8} textAnchor="middle" fill={C.muted} fontSize="6.5" fontFamily="'Exo 2'">{title}</text>
// //       </svg>
// //       <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center", marginTop: "3px" }}>
// //         {segments.map((s, i) => (
// //           <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
// //             <div style={{ width: "6px", height: "6px", background: s.color, borderRadius: "50%" }} />
// //             <span style={{ fontSize: "7.5px", color: C.muted, fontFamily: "'Exo 2'" }}>{s.label}</span>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

// // // ── HBar ──
// // function HBar({ label, value, color, delay = 0 }) {
// //   const prog = useAnimProg(ANIM.hbar, delay);
// //   const w = prog * value;
// //   return (
// //     <div style={{ marginBottom: "7px" }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
// //         <span style={{ fontSize: "10px", color: C.muted, fontFamily: "'Exo 2'" }}>{label}</span>
// //         <span style={{ fontSize: "10px", color, fontFamily: "'Share Tech Mono'", fontWeight: "700" }}>{Math.round(w)}%</span>
// //       </div>
// //       <div style={{ height: "7px", background: C.accent, borderRadius: "4px", overflow: "hidden", border: `1px solid ${C.accentBorder}` }}>
// //         <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: "4px", boxShadow: `0 0 6px ${color}55` }} />
// //       </div>
// //     </div>
// //   );
// // }

// // // ── Power Line Chart ──
// // function PowerChart({ highlightMetric = null }) {
// //   const prog = useAnimProg(ANIM.powerChart);
// //   const W = 560, H = 148;
// //   const data   = [580,610,640,660,700,720,710,730,740,780,820,825,840,860,900,950,980];
// //   const labels = ["6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm"];
  
// //   // Modify data based on highlighted metric
// //   let displayData = [...data];
// //   let highlightColor = C.blue;
  
// //   if (highlightMetric === "Power Load") {
// //     // Slightly increase values for power load highlight
// //     displayData = data.map(v => v * 1.02);
// //     highlightColor = C.yellow;
// //   } else if (highlightMetric === "Temperature") {
// //     // Add temperature-like pattern
// //     displayData = data.map((v, i) => v * (0.8 + Math.sin(i * 0.3) * 0.1));
// //     highlightColor = C.orange;
// //   } else if (highlightMetric === "PUE") {
// //     // Lower, more efficient pattern
// //     displayData = data.map(v => v * 0.85);
// //     highlightColor = C.green;
// //   }
  
// //   const px = 40, py = 10, gW = W - px * 2, gH = H - py * 2 - 18;
// //   const minV = 500, maxV = 1000;
// //   const toX = i => px + (i / (displayData.length - 1)) * gW;
// //   const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
// //   const lp = displayData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
// //   const ap = lp + ` L ${toX(displayData.length - 1)} ${py + gH} L ${px} ${py + gH} Z`;
// //   return (
// //     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
// //       <defs>
// //         <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={highlightColor} stopOpacity="0.15" /><stop offset="100%" stopColor={highlightColor} stopOpacity="0.01" /></linearGradient>
// //         <linearGradient id="lG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.cyan} /><stop offset="100%" stopColor={highlightColor} /></linearGradient>
// //         <filter id="gl"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
// //         <clipPath id="lclip"><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
// //       </defs>
// //       {[600,700,800,900,1000].map(v => (
// //         <g key={v}>
// //           <line x1={px} y1={toY(v)} x2={px + gW} y2={toY(v)} stroke={C.accent} strokeWidth="1" />
// //           <text x={px - 4} y={toY(v) + 3} textAnchor="end" fill={C.muted} fontSize="8" fontFamily="'Share Tech Mono'">{v}</text>
// //         </g>
// //       ))}
// //       <path d={ap} fill="url(#aG)" clipPath="url(#lclip)" />
// //       <path d={lp} fill="none" stroke="url(#lG)" strokeWidth="2.5" clipPath="url(#lclip)" filter="url(#gl)" />
// //       {prog > 0.65 && (() => { const fd = displayData.slice(11); const fp = fd.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(11 + i)} ${toY(v)}`).join(" "); return <path d={fp} fill="none" stroke={highlightColor + "66"} strokeWidth="1.5" strokeDasharray="5 3" clipPath="url(#lclip)" />; })()}
// //       <line x1={px} y1={toY(800)} x2={px + gW} y2={toY(800)} stroke={C.yellow + "aa"} strokeWidth="1" strokeDasharray="7 4" />
// //       <text x={px + gW - 4} y={toY(800) - 3} textAnchor="end" fill={C.yellow} fontSize="7.5" fontFamily="'Share Tech Mono'">800kW Threshold</text>
// //       {prog > 0.6 && <circle cx={toX(11)} cy={toY(825)} r="4.5" fill={highlightColor} stroke="#fff" strokeWidth="2" />}
// //       {displayData.filter((_, i) => i % 4 === 0).map((_, ii) => { const oi = ii * 4; return <text key={ii} x={toX(oi)} y={H - 3} textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="'Share Tech Mono'">{labels[oi]}</text>; })}
// //       <rect x={px + gW - 68} y={py} width="66" height="14" rx="3" fill={C.accent} stroke={C.accentBorder} />
// //       <circle cx={px + gW - 58} cy={py + 7} r="3" fill={highlightColor} />
// //       <text x={px + gW - 51} y={py + 11} fill={highlightColor} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">Forecast</text>
// //       {highlightMetric && (
// //         <text x={px + 10} y={py + 14} fill={highlightColor} fontSize="9" fontWeight="700" fontFamily="'Exo 2'">🔍 {highlightMetric} View</text>
// //       )}
// //     </svg>
// //   );
// // }

// // // ── Thermal Map ──
// // function ThermalMap({ highlightMetric = null }) {
// //   const heat = [[3,3,4,5,6,7,6,5,4,3],[3,4,5,6,7,8,7,6,5,4],[4,5,6,7,8,9,8,7,6,5],[3,4,6,7,9,8,7,7,5,4],[3,4,5,6,7,8,8,6,5,3],[4,5,6,7,8,9,8,7,6,5],[3,4,5,6,7,7,6,5,4,3],[3,3,4,5,5,6,5,4,3,3]];
// //   const [frame, setFrame] = useState(0);
// //   useEffect(() => { const id = setInterval(() => setFrame(f => f + 1), ANIM.thermalInterval); return () => clearInterval(id); }, []);
  
// //   // Modify heat map based on highlighted metric
// //   let modifiedHeat = heat;
// //   if (highlightMetric === "Temperature") {
// //     // Increase temperatures
// //     modifiedHeat = heat.map(row => row.map(v => Math.min(9, v + 1.5)));
// //   } else if (highlightMetric === "Critical Alerts") {
// //     // Add hot spots
// //     modifiedHeat = heat.map((row, r) => row.map((v, c) => (r === 2 && c === 5) || (r === 4 && c === 3) ? 9 : v));
// //   }
  
// //   const getCol = v => v <= 4 ? C.green : v <= 6 ? "#80cc44" : v <= 7 ? C.yellow : v <= 8 ? C.orange : C.red;
// //   const getBg  = v => v <= 4 ? "#e8faf3" : v <= 6 ? "#f4fce8" : v <= 7 ? "#fffae8" : v <= 8 ? "#fff3e8" : "#feeaed";
// //   return (
// //     <div style={{ padding: "8px" }}>
// //       <div style={{ marginBottom: "6px" }}><span className="blink" style={{ fontSize: "10px", fontWeight: "700", color: C.red, fontFamily: "'Exo 2'" }}>⚠ Hotspots Detected</span></div>
// //       <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "2px" }}>
// //         {modifiedHeat.map((row, r) => row.map((v, c) => {
// //           const noise = Math.sin(frame * 0.4 + r * 0.7 + c * 0.3) * 0.6;
// //           const cv = Math.max(1, Math.min(9, Math.round(v + noise)));
// //           return <div key={`${r}-${c}`} style={{ height: "15px", background: getBg(cv), border: `1px solid ${getCol(cv)}55`, borderRadius: "2px", transition: `background ${ANIM.thermalInterval * 0.8}ms ease` }} />;
// //         }))}
// //       </div>
// //       <div style={{ display: "flex", gap: "8px", marginTop: "6px", justifyContent: "center" }}>
// //         {[C.green,"#80cc44",C.yellow,C.orange,C.red].map((col, i) => (
// //           <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
// //             <div style={{ width: "8px", height: "8px", background: col, borderRadius: "2px", opacity: 0.85 }} />
// //             <span style={{ fontSize: "7px", color: C.muted, fontFamily: "'Share Tech Mono'" }}>{["Cool","Low","Med","High","Hot"][i]}</span>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

// // // ── Cap Forecast ──
// // function CapForecast({ color, label, delay = 0, highlightMetric = null }) {
// //   const prog = useAnimProg(ANIM.capForecast, delay);
// //   const W = 220, H = 80;
// //   let data = [10,18,22,30,38,45,52,60,68,75,82,90];
  
// //   // Modify data based on highlighted metric
// //   if (highlightMetric === "Capacity Utilization") {
// //     data = [15,25,35,45,55,65,72,78,82,85,88,92];
// //   } else if (highlightMetric === "Power Load") {
// //     data = [20,28,35,42,50,58,65,72,78,83,87,90];
// //   }
  
// //   const px = 8, py = 8, gW = W - px * 2, gH = H - py * 2 - 14;
// //   const toX = i => px + (i / (data.length - 1)) * gW;
// //   const toY = v => py + gH - (v / 100) * gH;
// //   const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
// //   const ap = lp + ` L ${toX(data.length - 1)} ${py + gH} L ${px} ${py + gH} Z`;
// //   const iid = label[0] + color.replace("#", "");
// //   return (
// //     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
// //       <defs>
// //         <linearGradient id={`cgg${iid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient>
// //         <clipPath id={`ccl${iid}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
// //       </defs>
// //       <path d={ap} fill={`url(#cgg${iid})`} clipPath={`url(#ccl${iid})`} />
// //       <path d={lp} fill="none" stroke={color} strokeWidth="2" clipPath={`url(#ccl${iid})`} />
// //       {prog > 0.88 && <path d={`M ${toX(data.length-2)} ${toY(82)} L ${toX(data.length-1)+18} ${toY(96)}`} fill="none" stroke={color+"88"} strokeWidth="1.5" strokeDasharray="3 2" />}
// //       <circle cx={toX(data.length-1)} cy={toY(90)} r="3" fill={color} stroke="#fff" strokeWidth="1.5" style={{ opacity: prog > 0.88 ? 1 : 0, transition: "opacity 0.4s" }} />
// //       <text x={px} y={H-2} fill={C.yellow} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">· {label}</text>
// //     </svg>
// //   );
// // }

// // // ── Temperature Multi-Line ──
// // function TempChart({ highlightMetric = null }) {
// //   const prog = useAnimProg(ANIM.sparkline, 300);
// //   const W = 340, H = 110;
// //   const zones = [
// //     { label: "Zone A", color: C.blue,   data: [22,22.5,23,22.8,23.2,23.5,23.4,23.8,24,23.6,23.4,23.2] },
// //     { label: "Zone B", color: C.orange, data: [24,24.5,25,25.3,25.8,26,25.6,25.2,25.5,26,26.2,25.8] },
// //     { label: "Zone C", color: C.green,  data: [21,21.5,22,21.8,22.2,22,22.5,22.3,22.8,22.5,22,21.8] },
// //   ];
  
// //   // Modify data based on highlighted metric
// //   let displayZones = zones;
// //   if (highlightMetric === "Temperature") {
// //     // Increase all temperatures
// //     displayZones = zones.map(zone => ({
// //       ...zone,
// //       data: zone.data.map(v => v + 1.2)
// //     }));
// //   } else if (highlightMetric === "Critical Alerts") {
// //     // Add spike in Zone B
// //     displayZones = zones.map(zone => ({
// //       ...zone,
// //       data: zone.label === "Zone B" ? zone.data.map((v, i) => i > 7 ? v + 2.5 : v) : zone.data
// //     }));
// //   }
  
// //   const px = 28, py = 14, gW = W - px * 2, gH = H - py * 2 - 14;
// //   const minV = 20, maxV = 30;
// //   const toX = (i, len) => px + (i / (len - 1)) * gW;
// //   const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
// //   return (
// //     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
// //       <defs>
// //         {displayZones.map(z => <clipPath key={z.label} id={`tc${z.label}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>)}
// //         <filter id="tg"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
// //       </defs>
// //       {[22,24,26,28].map(v => (
// //         <g key={v}>
// //           <line x1={px} y1={toY(v)} x2={px+gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" strokeDasharray="4 3" />
// //           <text x={px-3} y={toY(v)+3} textAnchor="end" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{v}°</text>
// //         </g>
// //       ))}
// //       {displayZones.map(z => {
// //         const lp = z.data.map((v, i) => `${i===0?"M":"L"} ${toX(i,z.data.length)} ${toY(v)}`).join(" ");
// //         return <path key={z.label} d={lp} fill="none" stroke={z.color} strokeWidth="2" clipPath={`url(#tc${z.label})`} filter="url(#tg)" />;
// //       })}
// //       {["6am","8am","10am","12pm","2pm","4pm"].map((l, i) => <text key={i} x={toX(i*2,12)} y={H-2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
// //       {displayZones.map((z, i) => (
// //         <g key={i}>
// //           <line x1={px + i*80} y1={py-4} x2={px+i*80+12} y2={py-4} stroke={z.color} strokeWidth="2" />
// //           <text x={px+i*80+15} y={py-1} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{z.label}</text>
// //         </g>
// //       ))}
// //     </svg>
// //   );
// // }

// // // ── Network Traffic ──
// // function NetworkChart({ highlightMetric = null }) {
// //   const prog = useAnimProg(ANIM.sparkline, 600);
// //   const W = 340, H = 90;
// //   let inD  = [120,145,130,160,175,190,185,200,210,195,220,215];
// //   let outD = [80,95,88,110,125,130,120,140,150,138,155,145];
  
// //   // Modify data based on highlighted metric
// //   if (highlightMetric === "Power Load") {
// //     // Increase both
// //     inD = inD.map(v => v * 1.15);
// //     outD = outD.map(v => v * 1.1);
// //   } else if (highlightMetric === "Critical Alerts") {
// //     // Add spikes
// //     inD = inD.map((v, i) => i === 7 ? v * 1.4 : v);
// //     outD = outD.map((v, i) => i === 8 ? v * 1.3 : v);
// //   }
  
// //   const px = 28, py = 10, gW = W-px*2, gH = H-py*2-12;
// //   const minV = 60, maxV = 260;
// //   const toX = (i, l) => px + (i/(l-1))*gW;
// //   const toY = v => py + gH - ((v-minV)/(maxV-minV))*gH;
// //   const mPath = (d) => d.map((v,i) => `${i===0?"M":"L"} ${toX(i,d.length)} ${toY(v)}`).join(" ");
// //   const mArea = (d, p) => p + ` L ${toX(d.length-1,d)} ${py+gH} L ${px} ${py+gH} Z`;
// //   const ip = mPath(inD), op = mPath(outD);
// //   return (
// //     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
// //       <defs>
// //         <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity="0.2" /><stop offset="100%" stopColor={C.green} stopOpacity="0" /></linearGradient>
// //         <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.15" /><stop offset="100%" stopColor={C.purple} stopOpacity="0" /></linearGradient>
// //         <clipPath id="nc"><rect x={px} y={0} width={gW*prog} height={H} /></clipPath>
// //         <filter id="ng"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
// //       </defs>
// //       {[100,150,200,250].map(v => <line key={v} x1={px} y1={toY(v)} x2={px+gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" />)}
// //       <path d={mArea(inD, ip)} fill="url(#inG)" clipPath="url(#nc)" />
// //       <path d={mArea(outD,op)} fill="url(#outG)" clipPath="url(#nc)" />
// //       <path d={ip} fill="none" stroke={C.green}  strokeWidth="2" clipPath="url(#nc)" filter="url(#ng)" />
// //       <path d={op} fill="none" stroke={C.purple} strokeWidth="2" clipPath="url(#nc)" filter="url(#ng)" />
// //       {["6am","8am","10am","12pm","2pm","4pm"].map((l,i) => <text key={i} x={toX(i*2,12)} y={H-1} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
// //       {[["↑ In",C.green],["↓ Out",C.purple]].map(([l,c],i) => (
// //         <g key={i}><line x1={px+i*70} y1={py+3} x2={px+i*70+12} y2={py+3} stroke={c} strokeWidth="2" /><text x={px+i*70+15} y={py+6} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
// //       ))}
// //     </svg>
// //   );
// // }

// // // ── Stacked Bar ──
// // function StackedBar({ highlightMetric = null }) {
// //   const prog = useAnimProg(ANIM.hbar, 500);
// //   let data = [{l:"Mon",a:320,b:180,c:80},{l:"Tue",a:340,b:190,c:75},{l:"Wed",a:360,b:200,c:85},{l:"Thu",a:300,b:170,c:70},{l:"Fri",a:380,b:210,c:90},{l:"Sat",a:250,b:140,c:60},{l:"Sun",a:230,b:130,c:55}];
  
// //   // Modify data based on highlighted metric
// //   if (highlightMetric === "Power Load") {
// //     // Increase IT load
// //     data = data.map(d => ({...d, a: d.a * 1.12}));
// //   } else if (highlightMetric === "PUE") {
// //     // Decrease cooling (improve efficiency)
// //     data = data.map(d => ({...d, b: d.b * 0.88}));
// //   } else if (highlightMetric === "Capacity Utilization") {
// //     // Increase all
// //     data = data.map(d => ({...d, a: d.a * 1.08, b: d.b * 1.05, c: d.c * 1.1}));
// //   }
  
// //   const W = 320, H = 110, px = 10, py = 14, gW = W-px*2, gH = H-py*2-14, maxV = 700;
// //   const bW = gW/data.length - 4;
// //   const cols = [C.blue, C.cyan, C.yellow];
// //   return (
// //     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
// //       {data.map((d, i) => {
// //         const x = px + i*(gW/data.length) + 2;
// //         let yOff = py + gH;
// //         return (
// //           <g key={i}>
// //             {[[d.a,0],[d.b,1],[d.c,2]].map(([val, ci]) => {
// //               const h = (val/maxV)*gH*prog; yOff -= h;
// //               return <rect key={ci} x={x} y={yOff} width={bW} height={h} fill={cols[ci]} rx="1" opacity="0.85" />;
// //             })}
// //             <text x={x+bW/2} y={H-2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{d.l}</text>
// //           </g>
// //         );
// //       })}
// //       {[["IT Load",C.blue],["Cooling",C.cyan],["Lighting",C.yellow]].map(([l,c],i) => (
// //         <g key={i}><rect x={px+i*85} y={py-8} width="8" height="6" fill={c} rx="1" /><text x={px+i*85+11} y={py-4} fill={C.muted} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
// //       ))}
// //     </svg>
// //   );
// // }

// // // ── Mini Rack ──
// // function MiniRack({ idx, highlightMetric = null }) {
// //   const pal = [C.green,C.yellow,C.green,C.red,C.cyan,C.green,C.orange,C.green];
  
// //   // Modify colors based on highlighted metric
// //   let modifiedPal = pal;
// //   if (highlightMetric === "Critical Alerts") {
// //     // Add more reds
// //     modifiedPal = pal.map((c, i) => i % 3 === 0 ? C.red : c);
// //   } else if (highlightMetric === "Temperature") {
// //     // Add more oranges
// //     modifiedPal = pal.map((c, i) => i % 4 === 0 ? C.orange : c);
// //   }
  
// //   const bg = c => c===C.green?"#e8faf3":c===C.yellow?"#fffae8":c===C.red?"#feeaed":c===C.cyan?"#e8f6ff":"#fff3e8";
// //   return (
// //     <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "8px", padding: "8px", boxShadow: C.shadow }}>
// //       <div style={{ display: "flex", gap: "3px" }}>
// //         {[0,1,2].map(col => (
// //           <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
// //             {[...Array(7)].map((_,row) => { const c=modifiedPal[(idx+col+row)%modifiedPal.length]; return <div key={row} style={{ height:"7px", background:bg(c), border:`1px solid ${c}55`, borderRadius:"1px" }} />; })}
// //           </div>
// //         ))}
// //       </div>
// //       <div style={{ fontSize: "8px", color: C.muted, marginTop: "4px", fontFamily: "'Share Tech Mono'" }}>RACK-0{idx+1}</div>
// //     </div>
// //   );
// // }

// // // ── Detailed KPI View Component ──
// // function DetailedKPIView({ selectedKPI, kpiData }) {
// //   if (!selectedKPI) return null;
  
// //   return (
// //     <div className="slide-in" style={{ marginTop: "10px" }}>
// //       <Panel style={{ border: `2px solid ${selectedKPI.color}40`, background: `linear-gradient(to bottom, ${selectedKPI.color}08, white)` }}>
// //         <PHead accent={selectedKPI.color}>
// //           <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
// //             <span style={{ fontSize: "16px" }}>{selectedKPI.icon}</span>
// //             <span>{selectedKPI.label} - Detailed Analysis</span>
// //             <span style={{ fontSize: "18px", color: selectedKPI.color, fontFamily: "'Share Tech Mono'", marginLeft: "auto" }}>
// //               <Counter end={selectedKPI.end} decimals={selectedKPI.dec || 0} suffix={selectedKPI.unit} />
// //             </span>
// //           </span>
// //         </PHead>
// //         <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
// //           <div>
// //             <div style={{ fontSize: "11px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>Historical Trend (7 Days)</div>
// //             <Sparkline data={selectedKPI.sparkData} color={selectedKPI.color} width={200} height={50} delay={0} />
// //             <div style={{ marginTop: "15px" }}>
// //               <HBar label="Current vs Target" value={85} color={selectedKPI.color} delay={200} />
// //               <HBar label="Efficiency Score" value={92} color={C.green} delay={400} />
// //             </div>
// //           </div>
// //           <div>
// //             <div style={{ fontSize: "11px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>Related Metrics</div>
// //             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
// //               <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
// //                 <div style={{ fontSize: "9px", color: C.muted }}>Peak</div>
// //                 <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.color }}>{Math.max(...selectedKPI.sparkData)}{selectedKPI.unit}</div>
// //               </div>
// //               <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
// //                 <div style={{ fontSize: "9px", color: C.muted }}>Min</div>
// //                 <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.color }}>{Math.min(...selectedKPI.sparkData)}{selectedKPI.unit}</div>
// //               </div>
// //               <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
// //                 <div style={{ fontSize: "9px", color: C.muted }}>Avg</div>
// //                 <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.color }}>
// //                   {Math.round(selectedKPI.sparkData.reduce((a,b) => a+b, 0) / selectedKPI.sparkData.length)}{selectedKPI.unit}
// //                 </div>
// //               </div>
// //               <div style={{ background: `${selectedKPI.color}10`, padding: "8px", borderRadius: "6px" }}>
// //                 <div style={{ fontSize: "9px", color: C.muted }}>Trend</div>
// //                 <div style={{ fontSize: "14px", fontWeight: "700", color: selectedKPI.sparkData[selectedKPI.sparkData.length-1] > selectedKPI.sparkData[0] ? C.green : C.red }}>
// //                   {selectedKPI.sparkData[selectedKPI.sparkData.length-1] > selectedKPI.sparkData[0] ? "↑" : "↓"}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </Panel>
// //     </div>
// //   );
// // }

// // // ══════════════════════════════════════════
// // //  MAIN
// // // ══════════════════════════════════════════
// // export default function DCIMDashboard() {
// //   const [time, setTime] = useState(new Date());
// //   const [aiIdx, setAiIdx] = useState(0);
// //   const [sidebarIdx, setSidebarIdx] = useState(0);
// //   const [selectedKPI, setSelectedKPI] = useState(null);

// //   useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
// //   useEffect(() => { const id = setInterval(() => setAiIdx(i => (i+1)%3), ANIM.aiCycle); return () => clearInterval(id); }, []);

// //   const kpis = [
// //     { icon:"⚡", label:"Power Load",    end:825,  unit:" kW", color:C.yellow, bg:"#fffbf0", sparkData:[700,720,740,710,760,790,825], dec:0 },
// //     { icon:"🌡", label:"Temperature",      end:23.4, unit:"°C", dec:1, color:C.cyan,   bg:"#f0faff",  sparkData:[22.1,22.8,23.2,22.9,23.5,23.1,23.4] },
// //     { icon:"📊", label:"PUE",                  end:1.45, unit:"",   dec:2, color:C.orange, bg:"#fff7f0", sparkData:[1.55,1.52,1.49,1.51,1.47,1.46,1.45] },
// //     { icon:"🚨", label:"Critical Alerts",      end:3,    unit:"",   color:C.red,    bg:"#fff0f3", blink:true, sparkData:[1,2,1,3,2,3,3], dec:0 },
// //     { icon:"💾", label:"Capacity Utilization", end:78,   unit:"%",  color:C.blue,   bg:"#f0f5ff",  sparkData:[65,68,70,72,74,76,78], dec:0 },
// //     { icon:"✅", label:"Uptime SLA",           end:99.9, unit:"%",  dec:1, color:C.green,  bg:"#f0fdf8", sparkData:[99.9,100,99.9,100,99.9,99.9,99.9] },
// //   ];

// //   const maintenance = [
// //     { name:"CRAC Unit 3",    issue:"High Failure Risk",  level:"critical", icon:"🔴" },
// //     { name:"Battery Bank 2", issue:"Replace in 15 Days", level:"warn",     icon:"🟡" },
// //     { name:"Server R14",     issue:"Overheating Alert",  level:"ok",       icon:"🟡" },
// //   ];

// //   const insights = [
// //     "Cooling load in Zone B can be reduced by 12%.",
// //     "UPS-2 battery health deteriorating.",
// //     "Rack 14 predicted to exceed power limit in 2 days.",
// //   ];

// //   const assetDonut = [{label:"Servers",value:45,color:C.blue},{label:"Network",value:25,color:C.cyan},{label:"Storage",value:20,color:C.green},{label:"Other",value:10,color:C.yellow}];
// //   const powerDonut  = [{label:"IT Load",value:55,color:C.blue},{label:"Cooling",value:30,color:C.cyan},{label:"Lighting",value:15,color:C.yellow}];

// //   const handleKPIClick = (kpi) => {
// //     setSelectedKPI(kpi === selectedKPI ? null : kpi);
// //   };

// //   return (
// //     <div style={{ background: C.bg, minHeight:"100vh", fontFamily:"'Exo 2', sans-serif", color:C.text, fontSize:"12px" }}>
// //       <style>{styles}</style>

// //       {/* KPI ROW */}
// //       <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:"10px", padding:"12px 18px 10px", background:"#e4eaf6", borderBottom:`1px solid ${C.panelBorder}` }}>
// //         {kpis.map((kpi, i) => (
// //           <div 
// //             key={i} 
// //             className="fade-in" 
// //             onClick={() => handleKPIClick(kpi)}
// //             style={{ 
// //               background: selectedKPI === kpi ? `${kpi.color}15` : kpi.bg, 
// //               border: `2px solid ${selectedKPI === kpi ? kpi.color : `${kpi.color}44`}`, 
// //               borderRadius:"10px", 
// //               padding:"10px 12px", 
// //               display:"flex", 
// //               flexDirection:"column", 
// //               boxShadow: selectedKPI === kpi ? `0 4px 16px ${kpi.color}40` : C.shadow, 
// //               animationDelay:`${i*ANIM.kpiStagger}ms`, 
// //               opacity:0, 
// //               position:"relative", 
// //               overflow:"hidden",
// //               cursor:"pointer",
// //               transform: selectedKPI === kpi ? "scale(1.02)" : "scale(1)",
// //               transition: "all 0.3s ease",
// //               zIndex: selectedKPI === kpi ? 2 : 1
// //             }}
// //           >
// //             <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:`linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius:"10px 10px 0 0" }} />
// //             <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
// //               <div>
// //                 <div style={{ fontSize:"20px", fontWeight:"800", color:kpi.color, lineHeight:1.1, fontFamily:"'Share Tech Mono'", ...(kpi.blink ? {animation:"pulse 2s infinite"} : {}) }}>
// //                   <Counter end={kpi.end} decimals={kpi.dec||0} suffix={kpi.unit} />
// //                 </div>
// //                 <div style={{ fontSize:"9px", color:C.muted, marginTop:"2px", fontWeight:"600" }}>{kpi.icon} {kpi.label}</div>
// //               </div>
// //               <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i*ANIM.kpiStagger} />
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Detailed KPI View (Appears below KPI row when selected) */}
// //       <DetailedKPIView selectedKPI={selectedKPI} kpiData={kpis} />

// //       {/* BODY */}
// //       <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 250px", gap:"10px", padding:"10px 18px", height: selectedKPI ? "calc(100vh - 210px)" : "calc(100vh - 142px)", overflowY:"auto", transition: "height 0.3s ease" }}>

// //         {/* LEFT */}
// //         <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
// //           <Panel>
// //             {["Site: All","Room: Data Hall 1","Rack: All Racks","Time: Last 7 Days"].map((item, i) => (
// //               <div key={i} onClick={() => setSidebarIdx(i)} style={{ padding:"9px 13px", borderBottom:i<3?`1px solid ${C.accent}`:"none", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", background:sidebarIdx===i?`${C.blue}0d`:"transparent", borderLeft:sidebarIdx===i?`3px solid ${C.blue}`:"3px solid transparent", transition:"all 0.3s" }}>
// //                 <span style={{ fontSize:"11px", color:sidebarIdx===i?C.blue:C.text, fontWeight:sidebarIdx===i?"700":"400" }}>{item}</span>
// //                 <span style={{ color:C.muted, fontSize:"10px" }}>▾</span>
// //               </div>
// //             ))}
// //           </Panel>
// //           {[0,1,2].map(r => <MiniRack key={r} idx={r} highlightMetric={selectedKPI?.label} />)}
// //         </div>

// //         {/* CENTER */}
// //         <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

// //           {/* AI Banner */}
// //           <div style={{ background:"linear-gradient(90deg, #f0f6ff, #eaf4ff)", border:`1px solid ${C.blue}44`, borderRadius:"10px", padding:"10px 14px", display:"flex", gap:"10px", alignItems:"flex-start", boxShadow:C.shadow }}>
// //             <div style={{ background:`linear-gradient(135deg, ${C.blue}, ${C.cyan})`, borderRadius:"7px", padding:"5px 12px", fontSize:"11px", fontWeight:"800", color:"#fff", whiteSpace:"nowrap", flexShrink:0 }}>🤖 AI Insight»</div>
// //             <div style={{ flex:1 }}>
// //               {insights.map((ins, i) => (
// //                 <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"2px 0", opacity:i===aiIdx?1:0.38, transition:"opacity 0.8s" }}>
// //                   <span style={{ color:C.blue, fontSize:"12px", fontWeight:"700" }}>•</span>
// //                   <span style={{ fontSize:"11px", color:i===aiIdx?C.text:C.muted, fontWeight:i===aiIdx?"600":"400" }}>{ins}</span>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>

// //           {/* Power Chart */}
// //           <Panel>
// //             <PHead>⚡ Power Usage Trends {selectedKPI && `- Focus: ${selectedKPI.label}`}</PHead>
// //             <div style={{ padding:"4px 8px 6px" }}><PowerChart highlightMetric={selectedKPI?.label} /></div>
// //           </Panel>

// //           {/* Temp + Network */}
// //           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
// //             <Panel><PHead accent={C.orange}>🌡 Zone Temperature (°C)</PHead><div style={{ padding:"6px 8px 4px" }}><TempChart highlightMetric={selectedKPI?.label} /></div></Panel>
// //             <Panel><PHead accent={C.purple}>🌐 Network Traffic (Mbps)</PHead><div style={{ padding:"6px 8px 4px" }}><NetworkChart highlightMetric={selectedKPI?.label} /></div></Panel>
// //           </div>

// //           {/* Capacity + Thermal */}
// //           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
// //             <Panel style={{ padding:"10px" }}>
// //               <div style={{ fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:"6px" }}>📈 Capacity Forecast</div>
// //               <CapForecast color={C.blue} label="90% Capacity Full by Next Month" delay={300} highlightMetric={selectedKPI?.label} />
// //             </Panel>
// //             <Panel><PHead accent={C.red}>🔥 Data Center Thermal Map</PHead><ThermalMap highlightMetric={selectedKPI?.label} /></Panel>
// //           </div>

// //           {/* Stacked Bar + UPS bars */}
// //           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
// //             <Panel><PHead accent={C.blue}>📊 Weekly Power Breakdown (kW)</PHead><div style={{ padding:"6px 10px 8px" }}><StackedBar highlightMetric={selectedKPI?.label} /></div></Panel>
// //             <Panel style={{ padding:"10px" }}>
// //               <div style={{ fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:"8px" }}>📈 Capacity Forecast</div>
// //               <CapForecast color={C.green} label="90% Capacity Full by Next Month" delay={400} highlightMetric={selectedKPI?.label} />
// //               <div style={{ marginTop:"8px" }}>
// //                 <HBar label="UPS Load"          value={74} color={C.yellow} delay={400} />
// //                 <HBar label="Cooling Efficiency" value={92} color={C.green}  delay={400+ANIM.hbarStagger} />
// //               </div>
// //             </Panel>
// //           </div>
// //         </div>

// //         {/* RIGHT */}
// //         <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

// //           <Panel>
// //             <PHead accent={C.orange}>🔧 Predictive Maintenance</PHead>
// //             <div style={{ padding:"10px" }}>
// //               {maintenance.map((item, i) => (
// //                 <div key={i} style={{ padding:"9px 10px", borderRadius:"8px", marginBottom:i<2?"7px":0, background:item.level==="critical"?"#fff0f3":item.level==="warn"?"#fffae8":"#f0fdf8", border:`1px solid ${item.level==="critical"?C.red:item.level==="warn"?C.yellow:C.green}44`, display:"flex", alignItems:"center", gap:"8px" }}>
// //                   <span style={{ fontSize:"16px", animation:item.level!=="ok"?"pulse 2s infinite":"none" }}>{item.icon}</span>
// //                   <div style={{ flex:1 }}>
// //                     <div style={{ fontSize:"11px", fontWeight:"700", color:C.text }}>{item.name}</div>
// //                     <div style={{ fontSize:"9px", color:item.level==="critical"?C.red:item.level==="warn"?C.yellow:C.green, fontWeight:"600" }}>{item.issue}</div>
// //                   </div>
// //                   <span>{item.level==="ok"?"✅":"⚠️"}</span>
// //                 </div>
// //               ))}
// //             </div>
// //           </Panel>

// //           <Panel>
// //             <PHead accent={C.blue}>🍩 Asset & Power Distribution</PHead>
// //             <div style={{ padding:"8px", display:"flex", justifyContent:"space-around" }}>
// //               <Donut segments={assetDonut} size={96} title="Assets" />
// //               <Donut segments={powerDonut}  size={96} title="Power"  />
// //             </div>
// //           </Panel>

// //           <Panel>
// //             <PHead accent={C.green}>⚡ Energy Efficiency</PHead>
// //             <div style={{ padding:"8px", display:"flex", justifyContent:"space-around" }}>
// //               <Gauge value={1.45} max={3}  color={C.orange} label="PUE"      sub="Power Usage"     />
// //               <Gauge value={18.5} max={30} color={C.green}  label="Tons CO₂" sub="Carbon Footprint" />
// //             </div>
// //           </Panel>

// //           <Panel style={{ padding:"10px" }}>
// //             <div style={{ fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:"10px" }}>📋 System Health</div>
// //             <HBar label="Network Uptime"     value={99} color={C.green}  delay={200} />
// //             <HBar label="Storage Capacity"   value={78} color={C.blue}   delay={200+ANIM.hbarStagger} />
// //             <HBar label="CPU Load Avg"       value={65} color={C.cyan}   delay={200+ANIM.hbarStagger*2} />
// //             <HBar label="Memory Utilization" value={82} color={C.yellow} delay={200+ANIM.hbarStagger*3} />
// //             <HBar label="GPU Utilization"    value={55} color={C.purple} delay={200+ANIM.hbarStagger*4} />
// //           </Panel>

// //           <div style={{ background:"#fff5f7", border:`1px solid ${C.red}44`, borderRadius:"10px", padding:"10px 12px", boxShadow:C.shadow }}>
// //             <div style={{ fontSize:"10px", fontWeight:"800", color:C.red, marginBottom:"6px", display:"flex", alignItems:"center", gap:"5px" }}>
// //               <span className="pulse-dot">🔴</span> LIVE ALERTS
// //             </div>
// //             {["Rack 14 temp: 34°C","UPS-2 battery: 42%","PDU-3 load: 92%"].map((a, i) => (
// //               <div key={i} style={{ fontSize:"10px", color:C.text, padding:"5px 0", borderBottom:i<2?`1px solid ${C.red}22`:"none", fontFamily:"'Share Tech Mono'", display:"flex", gap:"5px", alignItems:"center" }}>
// //                 <span style={{ color:C.red, fontWeight:"800" }}>▶</span> {a}
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// //----------------------------------------------------------------------------------------------

// import React, { useState, useEffect } from "react";

// // ─────────────────────────────────────────
// //  ANIMATION SPEED CONTROL
// // ─────────────────────────────────────────
// const ANIM = {
//   counter: 3000, gauge: 3500, gaugeDelay: 600, powerChart: 4000,
//   capForecast: 3500, hbar: 2500, hbarStagger: 200, thermalInterval: 1200,
//   aiCycle: 5000, donut: 2800, sparkline: 3000, kpiStagger: 120, chartTransition: 800,
// };

// const C = {
//   bg: "#f0f4fa", panel: "#ffffff", panelBorder: "#dde4f0",
//   nav: "#1a2f5e", blue: "#1a6aff", cyan: "#0096c7",
//   green: "#0cb87a", yellow: "#f5a623", red: "#e8304a",
//   orange: "#f07030", purple: "#7c3aed",
//   text: "#1a2340", muted: "#7a8aaa",
//   accent: "#e8eef8", accentBorder: "#c8d4ea",
//   shadow: "0 2px 12px rgba(26,47,94,0.10)",
// };

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700;800&family=Share+Tech+Mono&display=swap');
//   * { box-sizing: border-box; margin: 0; padding: 0; }
//   ::-webkit-scrollbar { width: 6px; height: 6px; }
//   ::-webkit-scrollbar-track { background: #f0f4fa; }
//   ::-webkit-scrollbar-thumb { background: #c8d4ea; border-radius: 6px; }
//   @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
//   @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
//   @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.4} }
//   @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
//   @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
//   .fade-in   { animation: fadeInUp 0.7s ease-out forwards; }
//   .pulse-dot { animation: pulse 2s ease-in-out infinite; }
//   .blink     { animation: blink 1.4s ease-in-out infinite; }
//   .slide-in  { animation: slideIn 0.5s ease-out forwards; }
// `;

// const Panel = ({ children, style = {} }) => (
//   <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "12px", boxShadow: C.shadow, ...style }}>{children}</div>
// );
// const PHead = ({ children, accent }) => (
//   <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.accent}`, fontSize: "13px", fontWeight: "700", color: C.text, background: accent ? `linear-gradient(90deg, ${accent}0c, ${C.panel})` : C.panel, borderRadius: "12px 12px 0 0" }}>{children}</div>
// );

// // ── Helpers ──
// function useAnimProg(duration, delay = 0) {
//   const [p, setP] = useState(0);
//   useEffect(() => {
//     let s = null;
//     const go = ts => { if (!s) s = ts; const v = Math.min((ts - s) / duration, 1); setP(1 - Math.pow(1 - v, 3)); if (v < 1) requestAnimationFrame(go); };
//     const id = setTimeout(() => requestAnimationFrame(go), delay);
//     return () => clearTimeout(id);
//   }, [duration, delay]);
//   return p;
// }

// function Counter({ end, duration = ANIM.counter, decimals = 0, suffix = "" }) {
//   const p = useAnimProg(duration);
//   return <>{(+(end * p).toFixed(decimals)).toLocaleString()}{suffix}</>;
// }

// function Sparkline({ data, color, width = 72, height = 26, delay = 0 }) {
//   const prog = useAnimProg(ANIM.sparkline, delay);
//   const minV = Math.min(...data), maxV = Math.max(...data);
//   const toX = i => (i / (data.length - 1)) * width;
//   const toY = v => height - 4 - ((v - minV) / (maxV - minV + 0.001)) * (height - 8);
//   const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
//   const ap = lp + ` L ${width} ${height} L 0 ${height} Z`;
//   const uid = `${color.replace("#", "")}_${width}_${delay}`;
//   return (
//     <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
//       <defs>
//         <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//         <clipPath id={`sc${uid}`}><rect x={0} y={0} width={width * prog} height={height} /></clipPath>
//       </defs>
//       <path d={ap} fill={`url(#sg${uid})`} clipPath={`url(#sc${uid})`} />
//       <path d={lp} fill="none" stroke={color} strokeWidth="1.5" clipPath={`url(#sc${uid})`} />
//       <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2.5" fill={color} style={{ opacity: prog > 0.9 ? 1 : 0, transition: "opacity 0.3s" }} />
//     </svg>
//   );
// }

// function Gauge({ value, max, color, label, sub }) {
//   const prog = useAnimProg(ANIM.gauge, ANIM.gaugeDelay);
//   const pct = (value / max) * prog;
//   const r = 38, cx = 60, cy = 60;
//   const toRad = d => (d * Math.PI) / 180;
//   const sa = -220, sw = 260;
//   const x1 = cx + r * Math.cos(toRad(sa)), y1 = cy + r * Math.sin(toRad(sa));
//   const ex = cx + r * Math.cos(toRad(sa + sw)), ey = cy + r * Math.sin(toRad(sa + sw));
//   const ax = cx + r * Math.cos(toRad(sa + sw * pct)), ay = cy + r * Math.sin(toRad(sa + sw * pct));
//   const lg = sw * pct > 180 ? 1 : 0;
//   const id = label.replace(/\s/g, "") + Math.round(value * 10);
//   return (
//     <svg width="120" height="88" viewBox="0 0 120 88">
//       <defs><linearGradient id={`gg${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={color} stopOpacity="0.45" /><stop offset="100%" stopColor={color} /></linearGradient></defs>
//       <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke={C.accent} strokeWidth="7" strokeLinecap="round" />
//       {pct > 0.01 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${ax} ${ay}`} fill="none" stroke={`url(#gg${id})`} strokeWidth="7" strokeLinecap="round" />}
//       {Array.from({ length: 9 }, (_, i) => { const a = toRad(sa + (i / 8) * sw); return <line key={i} x1={cx + 44 * Math.cos(a)} y1={cy + 44 * Math.sin(a)} x2={cx + 49 * Math.cos(a)} y2={cy + 49 * Math.sin(a)} stroke={C.accentBorder} strokeWidth="1.5" />; })}
//       <text x="60" y="57" textAnchor="middle" fill={color} fontSize="15" fontWeight="800" fontFamily="'Exo 2'">{(value * prog).toFixed(value % 1 ? 1 : 0)}</text>
//       <text x="60" y="69" textAnchor="middle" fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{label}</text>
//       {sub && <text x="60" y="80" textAnchor="middle" fill={C.muted} fontSize="6.5" fontFamily="'Exo 2'">{sub}</text>}
//     </svg>
//   );
// }

// function Donut({ segments, size = 96, title }) {
//   const prog = useAnimProg(ANIM.donut, 400);
//   const r = 34, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
//   const total = segments.reduce((a, s) => a + s.value, 0);
//   let off = 0;
//   const arcs = segments.map(seg => {
//     const frac = (seg.value / total) * prog;
//     const arc = { ...seg, dash: `${frac * circ} ${circ - frac * circ}`, offset: -(off * circ) };
//     off += seg.value / total;
//     return arc;
//   });
//   return (
//     <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
//       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//         <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="9" />
//         {arcs.map((a, i) => (
//           <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="9"
//             strokeDasharray={a.dash} strokeDashoffset={a.offset}
//             style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
//         ))}
//         <text x={cx} y={cy - 3} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="800" fontFamily="'Exo 2'">{Math.round(prog * 100)}%</text>
//         <text x={cx} y={cy + 8} textAnchor="middle" fill={C.muted} fontSize="6.5" fontFamily="'Exo 2'">{title}</text>
//       </svg>
//       <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center", marginTop: "3px" }}>
//         {segments.map((s, i) => (
//           <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
//             <div style={{ width: "6px", height: "6px", background: s.color, borderRadius: "50%" }} />
//             <span style={{ fontSize: "7.5px", color: C.muted, fontFamily: "'Exo 2'" }}>{s.label}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function HBar({ label, value, color, delay = 0 }) {
//   const prog = useAnimProg(ANIM.hbar, delay);
//   const w = prog * value;
//   return (
//     <div style={{ marginBottom: "8px" }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
//         <span style={{ fontSize: "10px", color: C.muted, fontFamily: "'Exo 2'" }}>{label}</span>
//         <span style={{ fontSize: "10px", color, fontFamily: "'Share Tech Mono'", fontWeight: "700" }}>{Math.round(w)}%</span>
//       </div>
//       <div style={{ height: "8px", background: C.accent, borderRadius: "4px", overflow: "hidden", border: `1px solid ${C.accentBorder}` }}>
//         <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: "4px", boxShadow: `0 0 6px ${color}55` }} />
//       </div>
//     </div>
//   );
// }

// // ── Time Filter Component ──
// function TimeFilter({ onFilterChange, activeFilter }) {
//   const filters = [
//     { id: "day", label: "Day" },
//     { id: "week", label: "Week" },
//     { id: "month", label: "Month" },
//     { id: "year", label: "Year" },
//     { id: "custom", label: "Custom" },
//   ];

//   return (
//     <div style={{ 
//       display: "flex", 
//       gap: "6px", 
//       alignItems: "center",
//       padding: "6px 12px",
//       background: C.panel,
//       borderRadius: "8px",
//       border: `1px solid ${C.panelBorder}`,
//       flexWrap: "wrap"
//     }}>
//       <span style={{ fontSize: "10px", color: C.muted, fontWeight: "600", marginRight: "4px" }}>📊 Trend:</span>
//       {filters.map((filter) => (
//         <button
//           key={filter.id}
//           onClick={() => onFilterChange(filter.id)}
//           style={{
//             padding: "4px 12px",
//             borderRadius: "6px",
//             border: activeFilter === filter.id ? `2px solid ${C.blue}` : `1px solid ${C.accentBorder}`,
//             background: activeFilter === filter.id ? `${C.blue}15` : "transparent",
//             color: activeFilter === filter.id ? C.blue : C.muted,
//             fontSize: "10px",
//             fontWeight: activeFilter === filter.id ? "700" : "500",
//             cursor: "pointer",
//             fontFamily: "'Exo 2'",
//             transition: "all 0.2s ease",
//           }}
//         >
//           {filter.label}
//         </button>
//       ))}
//       {activeFilter === "custom" && (
//         <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
//           <input
//             type="date"
//             style={{
//               padding: "3px 6px",
//               fontSize: "9px",
//               borderRadius: "4px",
//               border: `1px solid ${C.accentBorder}`,
//               fontFamily: "'Exo 2'",
//               background: C.panel,
//               color: C.text,
//               width: "100px",
//             }}
//             defaultValue={new Date().toISOString().split('T')[0]}
//           />
//           <span style={{ fontSize: "10px", color: C.muted }}>to</span>
//           <input
//             type="date"
//             style={{
//               padding: "3px 6px",
//               fontSize: "9px",
//               borderRadius: "4px",
//               border: `1px solid ${C.accentBorder}`,
//               fontFamily: "'Exo 2'",
//               background: C.panel,
//               color: C.text,
//               width: "100px",
//             }}
//             defaultValue={new Date().toISOString().split('T')[0]}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// function PowerChart() {
//   const prog = useAnimProg(ANIM.powerChart);
//   const W = 560, H = 148;
//   const data = [580, 610, 640, 660, 700, 720, 710, 730, 740, 780, 820, 825, 840, 860, 900, 950, 980];
//   const labels = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm"];
//   const px = 40, py = 10, gW = W - px * 2, gH = H - py * 2 - 18;
//   const minV = 500, maxV = 1000;
//   const toX = i => px + (i / (data.length - 1)) * gW;
//   const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
//   const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
//   const ap = lp + ` L ${toX(data.length - 1)} ${py + gH} L ${px} ${py + gH} Z`;
//   return (
//     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//       <defs>
//         <linearGradient id="aGd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity="0.15" /><stop offset="100%" stopColor={C.blue} stopOpacity="0.01" /></linearGradient>
//         <linearGradient id="lGd" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.cyan} /><stop offset="100%" stopColor={C.blue} /></linearGradient>
//         <filter id="gld"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
//         <clipPath id="lclipd"><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
//       </defs>
//       {[600, 700, 800, 900, 1000].map(v => (
//         <g key={v}>
//           <line x1={px} y1={toY(v)} x2={px + gW} y2={toY(v)} stroke={C.accent} strokeWidth="1" />
//           <text x={px - 4} y={toY(v) + 3} textAnchor="end" fill={C.muted} fontSize="8" fontFamily="'Share Tech Mono'">{v}</text>
//         </g>
//       ))}
//       <path d={ap} fill="url(#aGd)" clipPath="url(#lclipd)" />
//       <path d={lp} fill="none" stroke="url(#lGd)" strokeWidth="2.5" clipPath="url(#lclipd)" filter="url(#gld)" />
//       <line x1={px} y1={toY(800)} x2={px + gW} y2={toY(800)} stroke={C.yellow + "aa"} strokeWidth="1" strokeDasharray="7 4" />
//       <text x={px + gW - 4} y={toY(800) - 3} textAnchor="end" fill={C.yellow} fontSize="7.5" fontFamily="'Share Tech Mono'">800kW Threshold</text>
//       {data.filter((_, i) => i % 4 === 0).map((_, ii) => { const oi = ii * 4; return <text key={ii} x={toX(oi)} y={H - 3} textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="'Share Tech Mono'">{labels[oi]}</text>; })}
//     </svg>
//   );
// }

// function ThermalMap() {
//   const heat = [[3, 3, 4, 5, 6, 7, 6, 5, 4, 3], [3, 4, 5, 6, 7, 8, 7, 6, 5, 4], [4, 5, 6, 7, 8, 9, 8, 7, 6, 5], [3, 4, 6, 7, 9, 8, 7, 7, 5, 4], [3, 4, 5, 6, 7, 8, 8, 6, 5, 3], [4, 5, 6, 7, 8, 9, 8, 7, 6, 5], [3, 4, 5, 6, 7, 7, 6, 5, 4, 3], [3, 3, 4, 5, 5, 6, 5, 4, 3, 3]];
//   const [frame, setFrame] = useState(0);
//   useEffect(() => { const id = setInterval(() => setFrame(f => f + 1), ANIM.thermalInterval); return () => clearInterval(id); }, []);
//   const getCol = v => v <= 4 ? C.green : v <= 6 ? "#80cc44" : v <= 7 ? C.yellow : v <= 8 ? C.orange : C.red;
//   const getBg = v => v <= 4 ? "#e8faf3" : v <= 6 ? "#f4fce8" : v <= 7 ? "#fffae8" : v <= 8 ? "#fff3e8" : "#feeaed";
//   return (
//     <div style={{ padding: "8px" }}>
//       <div style={{ marginBottom: "6px" }}><span className="blink" style={{ fontSize: "10px", fontWeight: "700", color: C.red, fontFamily: "'Exo 2'" }}>⚠ Hotspots Detected</span></div>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "2px" }}>
//         {heat.map((row, r) => row.map((v, c) => {
//           const noise = Math.sin(frame * 0.4 + r * 0.7 + c * 0.3) * 0.6;
//           const cv = Math.max(1, Math.min(9, Math.round(v + noise)));
//           return <div key={`${r}-${c}`} style={{ height: "15px", background: getBg(cv), border: `1px solid ${getCol(cv)}55`, borderRadius: "2px", transition: `background ${ANIM.thermalInterval * 0.8}ms ease` }} />;
//         }))}
//       </div>
//       <div style={{ display: "flex", gap: "8px", marginTop: "6px", justifyContent: "center" }}>
//         {[C.green, "#80cc44", C.yellow, C.orange, C.red].map((col, i) => (
//           <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
//             <div style={{ width: "8px", height: "8px", background: col, borderRadius: "2px", opacity: 0.85 }} />
//             <span style={{ fontSize: "7px", color: C.muted, fontFamily: "'Share Tech Mono'"}}>{["Cool", "Low", "Med", "High", "Hot"][i]}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function CapForecast({ color, label, delay = 0 }) {
//   const prog = useAnimProg(ANIM.capForecast, delay);
//   const W = 220, H = 80;
//   const data = [10, 18, 22, 30, 38, 45, 52, 60, 68, 75, 82, 90];
//   const px = 8, py = 8, gW = W - px * 2, gH = H - py * 2 - 14;
//   const toX = i => px + (i / (data.length - 1)) * gW;
//   const toY = v => py + gH - (v / 100) * gH;
//   const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
//   const ap = lp + ` L ${toX(data.length - 1)} ${py + gH} L ${px} ${py + gH} Z`;
//   const iid = (label[0] || "x") + color.replace("#", "") + delay;
//   return (
//     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//       <defs>
//         <linearGradient id={`cgg${iid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient>
//         <clipPath id={`ccl${iid}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
//       </defs>
//       <path d={ap} fill={`url(#cgg${iid})`} clipPath={`url(#ccl${iid})`} />
//       <path d={lp} fill="none" stroke={color} strokeWidth="2" clipPath={`url(#ccl${iid})`} />
//       <circle cx={toX(data.length - 1)} cy={toY(90)} r="3" fill={color} stroke="#fff" strokeWidth="1.5" style={{ opacity: prog > 0.88 ? 1 : 0, transition: "opacity 0.4s" }} />
//       <text x={px} y={H - 2} fill={C.yellow} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">· {label}</text>
//     </svg>
//   );
// }

// function TempChart() {
//   const prog = useAnimProg(ANIM.sparkline, 300);
//   const W = 340, H = 110;
//   const zones = [
//     { label: "Zone A", color: C.blue, data: [22, 22.5, 23, 22.8, 23.2, 23.5, 23.4, 23.8, 24, 23.6, 23.4, 23.2] },
//     { label: "Zone B", color: C.orange, data: [24, 24.5, 25, 25.3, 25.8, 26, 25.6, 25.2, 25.5, 26, 26.2, 25.8] },
//     { label: "Zone C", color: C.green, data: [21, 21.5, 22, 21.8, 22.2, 22, 22.5, 22.3, 22.8, 22.5, 22, 21.8] },
//   ];
//   const px = 28, py = 14, gW = W - px * 2, gH = H - py * 2 - 14;
//   const minV = 20, maxV = 30;
//   const toX = (i, len) => px + (i / (len - 1)) * gW;
//   const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
//   return (
//     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//       <defs>
//         {zones.map(z => <clipPath key={z.label} id={`tcd${z.label}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>)}
//         <filter id="tgd"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
//       </defs>
//       {[22, 24, 26, 28].map(v => (
//         <g key={v}>
//           <line x1={px} y1={toY(v)} x2={px + gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" strokeDasharray="4 3" />
//           <text x={px - 3} y={toY(v) + 3} textAnchor="end" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{v}°</text>
//         </g>
//       ))}
//       {zones.map(z => {
//         const lp = z.data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i, z.data.length)} ${toY(v)}`).join(" ");
//         return <path key={z.label} d={lp} fill="none" stroke={z.color} strokeWidth="2" clipPath={`url(#tcd${z.label})`} filter="url(#tgd)" />;
//       })}
//       {["6am", "8am", "10am", "12pm", "2pm", "4pm"].map((l, i) => <text key={i} x={toX(i * 2, 12)} y={H - 2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
//       {zones.map((z, i) => (
//         <g key={i}>
//           <line x1={px + i * 80} y1={py - 4} x2={px + i * 80 + 12} y2={py - 4} stroke={z.color} strokeWidth="2" />
//           <text x={px + i * 80 + 15} y={py - 1} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{z.label}</text>
//         </g>
//       ))}
//     </svg>
//   );
// }

// function NetworkChart() {
//   const prog = useAnimProg(ANIM.sparkline, 600);
//   const W = 340, H = 90;
//   const inD = [120, 145, 130, 160, 175, 190, 185, 200, 210, 195, 220, 215];
//   const outD = [80, 95, 88, 110, 125, 130, 120, 140, 150, 138, 155, 145];
//   const px = 28, py = 10, gW = W - px * 2, gH = H - py * 2 - 12;
//   const minV = 60, maxV = 260;
//   const toX = (i, l) => px + (i / (l - 1)) * gW;
//   const toY = v => py + gH - ((v - minV) / (maxV - minV)) * gH;
//   const mPath = (d) => d.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i, d.length)} ${toY(v)}`).join(" ");
//   const mArea = (d, p) => p + ` L ${toX(d.length - 1, d.length)} ${py + gH} L ${px} ${py + gH} Z`;
//   const ip = mPath(inD), op = mPath(outD);
//   return (
//     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//       <defs>
//         <linearGradient id="inGd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity="0.2" /><stop offset="100%" stopColor={C.green} stopOpacity="0" /></linearGradient>
//         <linearGradient id="outGd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.15" /><stop offset="100%" stopColor={C.purple} stopOpacity="0" /></linearGradient>
//         <clipPath id="ncd"><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>
//         <filter id="ngd"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
//       </defs>
//       {[100, 150, 200, 250].map(v => <line key={v} x1={px} y1={toY(v)} x2={px + gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" />)}
//       <path d={mArea(inD, ip)} fill="url(#inGd)" clipPath="url(#ncd)" />
//       <path d={mArea(outD, op)} fill="url(#outGd)" clipPath="url(#ncd)" />
//       <path d={ip} fill="none" stroke={C.green} strokeWidth="2" clipPath="url(#ncd)" filter="url(#ngd)" />
//       <path d={op} fill="none" stroke={C.purple} strokeWidth="2" clipPath="url(#ncd)" filter="url(#ngd)" />
//       {["6am", "8am", "10am", "12pm", "2pm", "4pm"].map((l, i) => <text key={i} x={toX(i * 2, 12)} y={H - 1} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
//       {[["↑ In", C.green], ["↓ Out", C.purple]].map(([l, c], i) => (
//         <g key={i}><line x1={px + i * 70} y1={py + 3} x2={px + i * 70 + 12} y2={py + 3} stroke={c} strokeWidth="2" /><text x={px + i * 70 + 15} y={py + 6} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
//       ))}
//     </svg>
//   );
// }

// function StackedBar() {
//   const prog = useAnimProg(ANIM.hbar, 500);
//   const data = [{ l: "Mon", a: 320, b: 180, c: 80 }, { l: "Tue", a: 340, b: 190, c: 75 }, { l: "Wed", a: 360, b: 200, c: 85 }, { l: "Thu", a: 300, b: 170, c: 70 }, { l: "Fri", a: 380, b: 210, c: 90 }, { l: "Sat", a: 250, b: 140, c: 60 }, { l: "Sun", a: 230, b: 130, c: 55 }];
//   const W = 320, H = 110, px = 10, py = 14, gW = W - px * 2, gH = H - py * 2 - 14, maxV = 700;
//   const bW = gW / data.length - 4;
//   const cols = [C.blue, C.cyan, C.yellow];
//   return (
//     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//       {data.map((d, i) => {
//         const x = px + i * (gW / data.length) + 2;
//         let yOff = py + gH;
//         return (
//           <g key={i}>
//             {[[d.a, 0], [d.b, 1], [d.c, 2]].map(([val, ci]) => {
//               const h = (val / maxV) * gH * prog; yOff -= h;
//               return <rect key={ci} x={x} y={yOff} width={bW} height={h} fill={cols[ci]} rx="1" opacity="0.85" />;
//             })}
//             <text x={x + bW / 2} y={H - 2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{d.l}</text>
//           </g>
//         );
//       })}
//       {[["IT Load", C.blue], ["Cooling", C.cyan], ["Lighting", C.yellow]].map(([l, c], i) => (
//         <g key={i}><rect x={px + i * 85} y={py - 8} width="8" height="6" fill={c} rx="1" /><text x={px + i * 85 + 11} y={py - 4} fill={C.muted} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
//       ))}
//     </svg>
//   );
// }

// function MiniRack({ idx }) {
//   const pal = [C.green, C.yellow, C.green, C.red, C.cyan, C.green, C.orange, C.green];
//   const bg = c => c === C.green ? "#e8faf3" : c === C.yellow ? "#fffae8" : c === C.red ? "#feeaed" : c === C.cyan ? "#e8f6ff" : "#fff3e8";
//   return (
//     <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "8px", padding: "8px", boxShadow: C.shadow }}>
//       <div style={{ display: "flex", gap: "3px" }}>
//         {[0, 1, 2].map(col => (
//           <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
//             {[...Array(7)].map((_, row) => { const c = pal[(idx + col + row) % pal.length]; return <div key={row} style={{ height: "7px", background: bg(c), border: `1px solid ${c}55`, borderRadius: "1px" }} />; })}
//           </div>
//         ))}
//       </div>
//       <div style={{ fontSize: "8px", color: C.muted, marginTop: "4px", fontFamily: "'Share Tech Mono'" }}>RACK-0{idx + 1}</div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  DCIM DASHBOARD
// // ══════════════════════════════════════════
// function DCIMDashboard() {
//   const [aiIdx, setAiIdx] = useState(0);
//   const [sidebarIdx, setSidebarIdx] = useState(0);
//   const [selectedKPI, setSelectedKPI] = useState(null);
//   const [timeFilter, setTimeFilter] = useState("day");
  
//   useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

//   const kpis = [
//     { icon: "⚡", label: "Power Load", end: 825, unit: " kW", color: C.yellow, bg: "#fffbf0", sparkData: [700, 720, 740, 710, 760, 790, 825], dec: 0 },
//     { icon: "🌡", label: "Temperature", end: 23.4, unit: "°C", dec: 1, color: C.cyan, bg: "#f0faff", sparkData: [22.1, 22.8, 23.2, 22.9, 23.5, 23.1, 23.4] },
//     { icon: "📊", label: "PUE", end: 1.45, unit: "", dec: 2, color: C.orange, bg: "#fff7f0", sparkData: [1.55, 1.52, 1.49, 1.51, 1.47, 1.46, 1.45] },
//     { icon: "🚨", label: "Critical Alerts", end: 3, unit: "", color: C.red, bg: "#fff0f3", blink: true, sparkData: [1, 2, 1, 3, 2, 3, 3], dec: 0 },
//     { icon: "💾", label: "Capacity", end: 78, unit: "%", color: C.blue, bg: "#f0f5ff", sparkData: [65, 68, 70, 72, 74, 76, 78], dec: 0 },
//     { icon: "✅", label: "Uptime SLA", end: 99.9, unit: "%", dec: 1, color: C.green, bg: "#f0fdf8", sparkData: [99.9, 100, 99.9, 100, 99.9, 99.9, 99.9] },
//   ];
//   const maintenance = [
//     { name: "CRAC Unit 3", issue: "High Failure Risk", level: "critical", icon: "🔴" },
//     { name: "Battery Bank 2", issue: "Replace in 15 Days", level: "warn", icon: "🟡" },
//     { name: "Server R14", issue: "Overheating Alert", level: "ok", icon: "🟡" },
//   ];
//   const insights = ["Cooling load in Zone B can be reduced by 12%.", "UPS-2 battery health deteriorating.", "Rack 14 predicted to exceed power limit in 2 days."];
//   const assetDonut = [{ label: "Servers", value: 45, color: C.blue }, { label: "Network", value: 25, color: C.cyan }, { label: "Storage", value: 20, color: C.green }, { label: "Other", value: 10, color: C.yellow }];
//   const powerDonut = [{ label: "IT Load", value: 55, color: C.blue }, { label: "Cooling", value: 30, color: C.cyan }, { label: "Lighting", value: 15, color: C.yellow }];

//   // Generate time-based data for different filters
//   const getFilteredData = (filter) => {
//     const multipliers = { day: 1, week: 7, month: 30, year: 365, custom: 1 };
//     const days = multipliers[filter] || 1;
//     return days;
//   };

//   return (
//     <div>
//       {/* TIME FILTER ROW */}
//       <div style={{ padding: "8px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <div style={{ fontSize: "11px", fontWeight: "600", color: C.text, fontFamily: "'Exo 2'" }}>
//           📊 Historical Data Analysis — Showing {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View
//         </div>
//         <TimeFilter activeFilter={timeFilter} onFilterChange={setTimeFilter} />
//       </div>

//       {/* KPI ROW */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", padding: "10px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}` }}>
//         {kpis.map((kpi, i) => (
//           <div key={i} className="fade-in" onClick={() => setSelectedKPI(kpi === selectedKPI ? null : kpi)}
//             style={{ background: selectedKPI === kpi ? `${kpi.color}15` : kpi.bg, border: `2px solid ${selectedKPI === kpi ? kpi.color : `${kpi.color}44`}`, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", boxShadow: selectedKPI === kpi ? `0 4px 16px ${kpi.color}40` : C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden", cursor: "pointer", transform: selectedKPI === kpi ? "scale(1.02)" : "scale(1)", transition: "all 0.3s ease" }}>
//             <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius: "10px 10px 0 0" }} />
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//               <div>
//                 <div style={{ fontSize: "20px", fontWeight: "800", color: kpi.color, lineHeight: 1.1, fontFamily: "'Share Tech Mono'", ...(kpi.blink ? { animation: "pulse 2s infinite" } : {}) }}>
//                   <Counter end={kpi.end} decimals={kpi.dec || 0} suffix={kpi.unit} />
//                 </div>
//                 <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px", fontWeight: "600" }}>{kpi.icon} {kpi.label}</div>
//               </div>
//               <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i * ANIM.kpiStagger} />
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* BODY */}
//       <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 250px", gap: "10px", padding: "10px 18px", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
//         {/* LEFT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel>
//             {["Site: All", "Room: Data Hall 1", "Rack: All Racks", "Time: Last 7 Days"].map((item, i) => (
//               <div key={i} onClick={() => setSidebarIdx(i)} style={{ padding: "9px 13px", borderBottom: i < 3 ? `1px solid ${C.accent}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: sidebarIdx === i ? `${C.blue}0d` : "transparent", borderLeft: sidebarIdx === i ? `3px solid ${C.blue}` : "3px solid transparent", transition: "all 0.3s" }}>
//                 <span style={{ fontSize: "11px", color: sidebarIdx === i ? C.blue : C.text, fontWeight: sidebarIdx === i ? "700" : "400" }}>{item}</span>
//                 <span style={{ color: C.muted, fontSize: "10px" }}>▾</span>
//               </div>
//             ))}
//           </Panel>
//           {[0, 1, 2].map(r => <MiniRack key={r} idx={r} />)}
//         </div>

//         {/* CENTER */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <div style={{ background: "linear-gradient(90deg, #f0f6ff, #eaf4ff)", border: `1px solid ${C.blue}44`, borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start", boxShadow: C.shadow }}>
//             <div style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, borderRadius: "7px", padding: "5px 12px", fontSize: "11px", fontWeight: "800", color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>🤖 AI Insight»</div>
//             <div style={{ flex: 1 }}>
//               {insights.map((ins, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", opacity: i === aiIdx ? 1 : 0.38, transition: "opacity 0.8s" }}>
//                   <span style={{ color: C.blue, fontSize: "12px", fontWeight: "700" }}>•</span>
//                   <span style={{ fontSize: "11px", color: i === aiIdx ? C.text : C.muted, fontWeight: i === aiIdx ? "600" : "400" }}>{ins}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <Panel><PHead>⚡ Power Usage Trends {timeFilter !== "day" && `(${timeFilter} view)`}</PHead><div style={{ padding: "4px 8px 6px" }}><PowerChart /></div></Panel>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel><PHead accent={C.orange}>🌡 Zone Temperature (°C)</PHead><div style={{ padding: "6px 8px 4px" }}><TempChart /></div></Panel>
//             <Panel><PHead accent={C.purple}>🌐 Network Traffic (Mbps)</PHead><div style={{ padding: "6px 8px 4px" }}><NetworkChart /></div></Panel>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel style={{ padding: "10px" }}><div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "6px" }}>📈 Capacity Forecast</div><CapForecast color={C.blue} label="90% Capacity by Next Month" delay={300} /></Panel>
//             <Panel><PHead accent={C.red}>🔥 Thermal Map</PHead><ThermalMap /></Panel>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel><PHead accent={C.blue}>📊 Weekly Power Breakdown</PHead><div style={{ padding: "6px 10px 8px" }}><StackedBar /></div></Panel>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>📈 UPS & Cooling</div>
//               <CapForecast color={C.green} label="Forecast" delay={400} />
//               <div style={{ marginTop: "8px" }}>
//                 <HBar label="UPS Load" value={74} color={C.yellow} delay={400} />
//                 <HBar label="Cooling Efficiency" value={92} color={C.green} delay={400 + ANIM.hbarStagger} />
//               </div>
//             </Panel>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel>
//             <PHead accent={C.orange}>🔧 Predictive Maintenance</PHead>
//             <div style={{ padding: "10px" }}>
//               {maintenance.map((item, i) => (
//                 <div key={i} style={{ padding: "9px 10px", borderRadius: "8px", marginBottom: i < 2 ? "7px" : 0, background: item.level === "critical" ? "#fff0f3" : item.level === "warn" ? "#fffae8" : "#f0fdf8", border: `1px solid ${item.level === "critical" ? C.red : item.level === "warn" ? C.yellow : C.green}44`, display: "flex", alignItems: "center", gap: "8px" }}>
//                   <span style={{ fontSize: "16px", animation: item.level !== "ok" ? "pulse 2s infinite" : "none" }}>{item.icon}</span>
//                   <div style={{ flex: 1 }}>
//                     <div style={{ fontSize: "11px", fontWeight: "700", color: C.text }}>{item.name}</div>
//                     <div style={{ fontSize: "9px", color: item.level === "critical" ? C.red : item.level === "warn" ? C.yellow : C.green, fontWeight: "600" }}>{item.issue}</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </Panel>
//           <Panel><PHead accent={C.blue}>🍩 Asset & Power Distribution</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Donut segments={assetDonut} size={96} title="Assets" /><Donut segments={powerDonut} size={96} title="Power" /></div></Panel>
//           <Panel><PHead accent={C.green}>⚡ Energy Efficiency</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Gauge value={1.45} max={3} color={C.orange} label="PUE" sub="Power Usage" /><Gauge value={18.5} max={30} color={C.green} label="Tons CO₂" sub="Carbon" /></div></Panel>
//           <Panel style={{ padding: "10px" }}>
//             <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>📋 System Health</div>
//             <HBar label="Network Uptime" value={99} color={C.green} delay={200} />
//             <HBar label="Storage Capacity" value={78} color={C.blue} delay={200 + ANIM.hbarStagger} />
//             <HBar label="CPU Load Avg" value={65} color={C.cyan} delay={200 + ANIM.hbarStagger * 2} />
//             <HBar label="Memory Utilization" value={82} color={C.yellow} delay={200 + ANIM.hbarStagger * 3} />
//             <HBar label="GPU Utilization" value={55} color={C.purple} delay={200 + ANIM.hbarStagger * 4} />
//           </Panel>
//           <div style={{ background: "#fff5f7", border: `1px solid ${C.red}44`, borderRadius: "10px", padding: "10px 12px", boxShadow: C.shadow }}>
//             <div style={{ fontSize: "10px", fontWeight: "800", color: C.red, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}><span className="pulse-dot">🔴</span> LIVE ALERTS</div>
//             {["Rack 14 temp: 34°C", "UPS-2 battery: 42%", "PDU-3 load: 92%"].map((a, i) => (
//               <div key={i} style={{ fontSize: "10px", color: C.text, padding: "5px 0", borderBottom: i < 2 ? `1px solid ${C.red}22` : "none", fontFamily: "'Share Tech Mono'", display: "flex", gap: "5px", alignItems: "center" }}>
//                 <span style={{ color: C.red, fontWeight: "800" }}>▶</span> {a}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  BMS DASHBOARD — Building Management System
// // ══════════════════════════════════════════
// function BMSLineChart({ data, colors, labels, yMin, yMax, yTicks, timeLabels, height = 110 }) {
//   const prog = useAnimProg(ANIM.sparkline, 200);
//   const W = 400, H = height;
//   const px = 32, py = 12, gW = W - px * 2, gH = H - py * 2 - 14;
//   const toX = (i, len) => px + (i / (len - 1)) * gW;
//   const toY = v => py + gH - ((v - yMin) / (yMax - yMin)) * gH;
//   const uid = colors[0].replace("#", "") + height;
//   return (
//     <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
//       <defs>
//         {data.map((_, di) => <clipPath key={di} id={`bclip${uid}${di}`}><rect x={px} y={0} width={gW * prog} height={H} /></clipPath>)}
//         <filter id={`bfilt${uid}`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
//       </defs>
//       {yTicks.map(v => (
//         <g key={v}>
//           <line x1={px} y1={toY(v)} x2={px + gW} y2={toY(v)} stroke={C.accent} strokeWidth="0.8" strokeDasharray="4 3" />
//           <text x={px - 3} y={toY(v) + 3} textAnchor="end" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{v}</text>
//         </g>
//       ))}
//       {data.map((d, di) => {
//         const lp = d.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i, d.length)} ${toY(v)}`).join(" ");
//         return <path key={di} d={lp} fill="none" stroke={colors[di]} strokeWidth="2" clipPath={`url(#bclip${uid}${di})`} filter={`url(#bfilt${uid})`} />;
//       })}
//       {timeLabels.map((l, i) => <text key={i} x={toX(i * Math.floor((data[0].length - 1) / (timeLabels.length - 1)), data[0].length)} y={H - 2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Share Tech Mono'">{l}</text>)}
//       {labels.map((l, i) => (
//         <g key={i}><line x1={px + i * 90} y1={py - 3} x2={px + i * 90 + 12} y2={py - 3} stroke={colors[i]} strokeWidth="2" /><text x={px + i * 90 + 15} y={py} fill={C.muted} fontSize="7.5" fontFamily="'Exo 2'" fontWeight="600">{l}</text></g>
//       ))}
//     </svg>
//   );
// }

// function FloorPlanHVAC() {
//   const [tick, setTick] = useState(0);
//   useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1500); return () => clearInterval(id); }, []);
//   const zones = [
//     { x: 10, y: 10, w: 80, h: 60, label: "Server Hall", temp: 22.1, status: "ok" },
//     { x: 100, y: 10, w: 70, h: 60, label: "UPS Room", temp: 24.5, status: "warn" },
//     { x: 180, y: 10, w: 60, h: 60, label: "Network", temp: 21.8, status: "ok" },
//     { x: 10, y: 80, w: 90, h: 55, label: "Storage", temp: 23.2, status: "ok" },
//     { x: 110, y: 80, w: 130, h: 55, label: "Operations", temp: 26.1, status: "hot" },
//   ];
//   const getZoneColor = (status) => status === "ok" ? C.green : status === "warn" ? C.yellow : C.red;
//   const getZoneBg = (status) => status === "ok" ? "#e8faf344" : status === "warn" ? "#fffae844" : "#feeaed44";
//   return (
//     <svg width="100%" height="145" viewBox="0 0 250 145" preserveAspectRatio="none">
//       <rect x={0} y={0} width={250} height={145} fill={C.accent} rx="4" />
//       {zones.map((z, i) => {
//         const pulse = Math.sin(tick * 0.5 + i * 1.2) > 0;
//         return (
//           <g key={i}>
//             <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={getZoneBg(z.status)} stroke={getZoneColor(z.status)} strokeWidth="1.5" rx="3" opacity={pulse && z.status !== "ok" ? 0.7 : 1} />
//             <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 5} textAnchor="middle" fill={C.text} fontSize="7" fontFamily="'Exo 2'" fontWeight="700">{z.label}</text>
//             <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 7} textAnchor="middle" fill={getZoneColor(z.status)} fontSize="8" fontFamily="'Share Tech Mono'" fontWeight="700">{z.temp}°C</text>
//           </g>
//         );
//       })}
//       <text x={125} y={140} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Exo 2'">Floor Plan — Zone Temperature View</text>
//     </svg>
//   );
// }

// function BMSDashboard() {
//   const [aiIdx, setAiIdx] = useState(0);
//   const [timeFilter, setTimeFilter] = useState("day");
  
//   useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

//   const kpis = [
//     { icon: "🌡", label: "Avg Temp", end: 22.8, unit: "°C", dec: 1, color: C.cyan, bg: "#f0faff", sparkData: [22.1, 22.3, 22.8, 22.5, 22.9, 22.6, 22.8] },
//     { icon: "💧", label: "Humidity", end: 47, unit: "%", color: C.blue, bg: "#f0f5ff", sparkData: [44, 45, 46, 47, 46, 47, 47] },
//     { icon: "⚡", label: "Energy kWh", end: 1284, unit: "", color: C.yellow, bg: "#fffbf0", sparkData: [1100, 1150, 1200, 1180, 1250, 1270, 1284] },
//     { icon: "🌬", label: "Air Quality", end: 92, unit: "%", color: C.green, bg: "#f0fdf8", sparkData: [88, 89, 90, 91, 91, 92, 92] },
//     { icon: "💡", label: "Lighting Load", end: 38, unit: " kW", color: C.orange, bg: "#fff7f0", sparkData: [30, 32, 34, 36, 37, 38, 38] },
//     { icon: "🔧", label: "HVAC Units", end: 12, unit: "", color: C.purple, bg: "#f5f0ff", sparkData: [12, 12, 12, 11, 12, 12, 12] },
//   ];

//   const hvacUnits = [
//     { id: "AHU-01", zone: "Server Hall", status: "Running", temp: 18.2, load: 78, color: C.green },
//     { id: "AHU-02", zone: "UPS Room", status: "Warning", temp: 21.5, load: 91, color: C.yellow },
//     { id: "AHU-03", zone: "Network", status: "Running", temp: 17.8, load: 65, color: C.green },
//     { id: "CRAC-01", zone: "Storage", status: "Running", temp: 16.5, load: 72, color: C.green },
//     { id: "CRAC-02", zone: "Operations", status: "Fault", temp: 24.1, load: 98, color: C.red },
//   ];

//   const insights = [
//     "AHU-02 running at 91% — schedule maintenance soon.",
//     "Operations zone 2°C above optimal — CRAC-02 fault detected.",
//     "Humidity optimal across all zones. Energy saving mode active.",
//   ];

//   const tempData = [
//     [22.1, 22.3, 22.5, 22.8, 23.0, 22.7, 22.5, 22.3, 22.6, 22.8, 22.5, 22.8],
//     [24.2, 24.5, 24.8, 25.0, 25.3, 25.1, 24.8, 24.5, 24.8, 25.1, 25.3, 24.5],
//     [21.0, 21.2, 21.5, 21.3, 21.6, 21.4, 21.2, 21.0, 21.3, 21.5, 21.2, 21.8],
//   ];
//   const energyData = [
//     [280, 295, 310, 340, 360, 355, 370, 385, 395, 380, 390, 400],
//     [120, 125, 130, 128, 135, 132, 130, 128, 132, 135, 133, 138],
//   ];
//   const donutSegs = [{ label: "HVAC", value: 55, color: C.blue }, { label: "Lighting", value: 22, color: C.yellow }, { label: "IT Misc", value: 15, color: C.cyan }, { label: "Other", value: 8, color: C.muted }];
//   const humidSegs = [{ label: "Optimal", value: 75, color: C.green }, { label: "Monitor", value: 20, color: C.yellow }, { label: "Alert", value: 5, color: C.red }];

//   return (
//     <div>
//       {/* TIME FILTER ROW */}
//       <div style={{ padding: "8px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <div style={{ fontSize: "11px", fontWeight: "600", color: C.text, fontFamily: "'Exo 2'" }}>
//           📊 Historical Data Analysis — Showing {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View
//         </div>
//         <TimeFilter activeFilter={timeFilter} onFilterChange={setTimeFilter} />
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", padding: "10px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}` }}>
//         {kpis.map((kpi, i) => (
//           <div key={i} className="fade-in" style={{ background: kpi.bg, border: `2px solid ${kpi.color}44`, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", boxShadow: C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden" }}>
//             <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius: "10px 10px 0 0" }} />
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//               <div>
//                 <div style={{ fontSize: "20px", fontWeight: "800", color: kpi.color, lineHeight: 1.1, fontFamily: "'Share Tech Mono'" }}>
//                   <Counter end={kpi.end} decimals={kpi.dec || 0} suffix={kpi.unit} />
//                 </div>
//                 <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px", fontWeight: "600" }}>{kpi.icon} {kpi.label}</div>
//               </div>
//               <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i * ANIM.kpiStagger} />
//             </div>
//           </div>
//         ))}
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 250px", gap: "10px", padding: "10px 18px", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
//         {/* LEFT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel>
//             <PHead accent={C.cyan}>🌬 HVAC Units</PHead>
//             <div style={{ padding: "8px", maxHeight: "380px", overflowY: "auto" }}>
//               {hvacUnits.map((u, i) => (
//                 <div key={i} style={{ padding: "8px 10px", borderRadius: "8px", marginBottom: "8px", background: u.color === C.green ? "#e8faf3" : u.color === C.yellow ? "#fffae8" : "#feeaed", border: `1px solid ${u.color}44` }}>
//                   <div style={{ display: "flex", justifyContent: "space-between" }}>
//                     <span style={{ fontSize: "11px", fontWeight: "700", color: C.text, fontFamily: "'Share Tech Mono'" }}>{u.id}</span>
//                     <span style={{ fontSize: "9px", color: u.color, fontWeight: "700" }}>{u.status}</span>
//                   </div>
//                   <div style={{ fontSize: "9px", color: C.muted, marginTop: "3px" }}>{u.zone} · {u.temp}°C · {u.load}%</div>
//                   <div style={{ height: "4px", background: C.accent, borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
//                     <div style={{ width: `${u.load}%`, height: "100%", background: u.color, borderRadius: "2px" }} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </Panel>
//           <Panel style={{ padding: "10px" }}>
//             <div style={{ fontSize: "11px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>🏢 Zone Alerts</div>
//             {[
//               { zone: "Operations", msg: "CRAC-02 Fault", col: C.red },
//               { zone: "UPS Room", msg: "High Load Warning", col: C.yellow },
//               { zone: "Server Hall", msg: "All Systems Normal", col: C.green },
//             ].map((a, i) => (
//               <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center", padding: "5px 0", borderBottom: i < 2 ? `1px solid ${C.accent}` : "none" }}>
//                 <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: a.col, flexShrink: 0, animation: a.col === C.red ? "pulse 2s infinite" : "none" }} />
//                 <div>
//                   <div style={{ fontSize: "10px", fontWeight: "700", color: C.text }}>{a.zone}</div>
//                   <div style={{ fontSize: "8px", color: a.col }}>{a.msg}</div>
//                 </div>
//               </div>
//             ))}
//           </Panel>
//         </div>

//         {/* CENTER */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <div style={{ background: "linear-gradient(90deg, #f0fff8, #eafffa)", border: `1px solid ${C.green}44`, borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start", boxShadow: C.shadow }}>
//             <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, borderRadius: "7px", padding: "5px 12px", fontSize: "11px", fontWeight: "800", color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>🤖 BMS AI»</div>
//             <div style={{ flex: 1 }}>
//               {insights.map((ins, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", opacity: i === aiIdx ? 1 : 0.38, transition: "opacity 0.8s" }}>
//                   <span style={{ color: C.green, fontSize: "12px", fontWeight: "700" }}>•</span>
//                   <span style={{ fontSize: "11px", color: i === aiIdx ? C.text : C.muted, fontWeight: i === aiIdx ? "600" : "400" }}>{ins}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <Panel>
//             <PHead accent={C.cyan}>🗺 Floor Plan — Zone Temperature</PHead>
//             <div style={{ padding: "12px", minHeight: "180px" }}>
//               <div style={{ width: "100%", height: "auto" }}>
//                 <FloorPlanHVAC />
//               </div>
//               <div style={{ fontSize: "9px", color: C.muted, textAlign: "center", marginTop: "8px" }}>
//                 🟢 Normal &nbsp;&nbsp; 🟡 Warning &nbsp;&nbsp; 🔴 Critical
//               </div>
//             </div>
//           </Panel>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel>
//               <PHead accent={C.cyan}>🌡 Zone Temp Trends (°C) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={tempData} colors={[C.cyan, C.orange, C.green]} labels={["Hall", "UPS Rm", "Network"]} yMin={20} yMax={27} yTicks={[21, 23, 25, 27]} timeLabels={["6am", "9am", "12p", "3pm", "6pm", "9pm"]} height={110} />
//               </div>
//             </Panel>
//             <Panel>
//               <PHead accent={C.yellow}>⚡ Energy Consumption (kWh) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={energyData} colors={[C.yellow, C.blue]} labels={["HVAC", "Lighting"]} yMin={100} yMax={450} yTicks={[150, 250, 350, 450]} timeLabels={["6am", "9am", "12p", "3pm", "6pm", "9pm"]} height={110} />
//               </div>
//             </Panel>
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>💨 Air Quality & Ventilation</div>
//               <HBar label="CO₂ Level (ppm)" value={42} color={C.green} delay={200} />
//               <HBar label="PM2.5 Particles" value={18} color={C.cyan} delay={300} />
//               <HBar label="VOC Index" value={25} color={C.blue} delay={400} />
//               <HBar label="Ventilation Flow" value={88} color={C.green} delay={500} />
//             </Panel>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>💡 Lighting Zones</div>
//               <HBar label="Server Hall" value={60} color={C.yellow} delay={200} />
//               <HBar label="Operations" value={85} color={C.yellow} delay={300} />
//               <HBar label="Corridors" value={40} color={C.orange} delay={400} />
//               <HBar label="Emergency" value={100} color={C.green} delay={500} />
//             </Panel>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel><PHead accent={C.blue}>🍩 Energy Distribution</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Donut segments={donutSegs} size={96} title="Energy" /><Donut segments={humidSegs} size={96} title="Humidity" /></div></Panel>
//           <Panel><PHead accent={C.green}>🌡 Environment Gauges</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Gauge value={22.8} max={40} color={C.cyan} label="Avg Temp" sub="°C" /><Gauge value={47} max={100} color={C.blue} label="Humidity" sub="%" /></div></Panel>
//           <Panel style={{ padding: "10px" }}>
//             <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>🔋 System Status</div>
//             <HBar label="HVAC Efficiency" value={88} color={C.green} delay={200} />
//             <HBar label="Chiller Load" value={72} color={C.cyan} delay={300} />
//             <HBar label="Cooling Tower" value={65} color={C.blue} delay={400} />
//             <HBar label="UPS Health" value={94} color={C.green} delay={500} />
//           </Panel>
//           <div style={{ background: "#fff5f7", border: `1px solid ${C.red}44`, borderRadius: "10px", padding: "10px 12px", boxShadow: C.shadow }}>
//             <div style={{ fontSize: "10px", fontWeight: "800", color: C.red, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}><span className="pulse-dot">🔴</span> LIVE BMS ALERTS</div>
//             {["CRAC-02: Fault — Ops Zone", "AHU-02: Load 91% — Warning", "Temp spike: Ops Zone 26.1°C"].map((a, i) => (
//               <div key={i} style={{ fontSize: "10px", color: C.text, padding: "5px 0", borderBottom: i < 2 ? `1px solid ${C.red}22` : "none", fontFamily: "'Share Tech Mono'", display: "flex", gap: "5px", alignItems: "center" }}>
//                 <span style={{ color: C.red, fontWeight: "800" }}>▶</span> {a}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  ACS DASHBOARD — Access Control System
// // ══════════════════════════════════════════
// function AccessLog({ entries }) {
//   return (
//     <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "9px" }}>
//       {entries.map((e, i) => (
//         <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center", padding: "5px 0", borderBottom: i < entries.length - 1 ? `1px solid ${C.accent}` : "none" }}>
//           <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: e.granted ? C.green : C.red, flexShrink: 0, animation: e.recent ? "pulse 2s infinite" : "none" }} />
//           <span style={{ color: C.muted, fontSize: "8px", minWidth: "42px" }}>{e.time}</span>
//           <span style={{ color: C.text, flex: 1, fontSize: "9px" }}>{e.name}</span>
//           <span style={{ color: e.granted ? C.green : C.red, fontWeight: "700", fontSize: "8px" }}>{e.granted ? "✓" : "✗"}</span>
//           <span style={{ color: C.muted, fontSize: "8px" }}>{e.door}</span>
//         </div>
//       ))}
//     </div>
//   );
// }

// function DoorStatusGrid({ doors }) {
//   const [tick, setTick] = useState(0);
//   useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 2000); return () => clearInterval(id); }, []);
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
//       {doors.map((d, i) => {
//         const flash = d.status === "alert" && tick % 2 === 0;
//         const bg = d.status === "open" ? "#e8faf3" : d.status === "locked" ? "#f0f5ff" : "#feeaed";
//         const col = d.status === "open" ? C.green : d.status === "locked" ? C.blue : C.red;
//         const ico = d.status === "open" ? "🔓" : d.status === "locked" ? "🔒" : "🚨";
//         return (
//           <div key={i} style={{ background: flash ? "#feeaed" : bg, border: `1px solid ${flash ? C.red : col}44`, borderRadius: "7px", padding: "7px 9px", opacity: flash ? 0.7 : 1, transition: "opacity 0.3s" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <span style={{ fontSize: "12px" }}>{ico}</span>
//               <span style={{ fontSize: "8px", color: col, fontWeight: "700", fontFamily: "'Share Tech Mono'" }}>{d.status.toUpperCase()}</span>
//             </div>
//             <div style={{ fontSize: "10px", fontWeight: "700", color: C.text, marginTop: "3px" }}>{d.name}</div>
//             <div style={{ fontSize: "8px", color: C.muted }}>{d.floor} · {d.lastAccess}</div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function ACSDashboard() {
//   const [aiIdx, setAiIdx] = useState(0);
//   const [timeFilter, setTimeFilter] = useState("day");
  
//   useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

//   const kpis = [
//     { icon: "🚪", label: "Active Doors", end: 48, unit: "", color: C.blue, bg: "#f0f5ff", sparkData: [46, 47, 48, 47, 48, 48, 48] },
//     { icon: "✅", label: "Access Granted", end: 1284, unit: "", color: C.green, bg: "#f0fdf8", sparkData: [980, 1050, 1100, 1150, 1200, 1250, 1284] },
//     { icon: "🚫", label: "Access Denied", end: 23, unit: "", color: C.red, bg: "#fff0f3", blink: true, sparkData: [10, 12, 15, 18, 20, 22, 23] },
//     { icon: "👤", label: "Active Badges", end: 312, unit: "", color: C.cyan, bg: "#f0faff", sparkData: [295, 300, 305, 308, 310, 311, 312] },
//     { icon: "🔒", label: "Locked Zones", end: 5, unit: "", color: C.purple, bg: "#f5f0ff", sparkData: [4, 5, 5, 5, 5, 4, 5] },
//     { icon: "⚠️", label: "Alerts", end: 2, unit: "", color: C.orange, bg: "#fff7f0", blink: true, sparkData: [0, 1, 1, 2, 1, 2, 2] },
//   ];

//   const doors = [
//     { name: "Main Entry", floor: "G Floor", status: "open", lastAccess: "2 min ago" },
//     { name: "Server Hall", floor: "1F", status: "locked", lastAccess: "8 min ago" },
//     { name: "UPS Room", floor: "1F", status: "locked", lastAccess: "15 min ago" },
//     { name: "NOC", floor: "2F", status: "open", lastAccess: "1 min ago" },
//     { name: "Roof Access", floor: "Top", status: "alert", lastAccess: "Forced Open" },
//     { name: "Network Room", floor: "B1", status: "locked", lastAccess: "30 min ago" },
//     { name: "Loading Bay", floor: "G Floor", status: "open", lastAccess: "5 min ago" },
//     { name: "Control Room", floor: "2F", status: "locked", lastAccess: "22 min ago" },
//   ];

//   const accessLog = [
//     { time: "14:32", name: "Rajesh Kumar", door: "Main Entry", granted: true, recent: true },
//     { time: "14:31", name: "Unknown Badge", door: "Roof Access", granted: false, recent: true },
//     { time: "14:29", name: "Priya Sharma", door: "NOC", granted: true, recent: false },
//     { time: "14:28", name: "Admin Override", door: "Server Hall", granted: true, recent: false },
//     { time: "14:25", name: "Vikram Singh", door: "UPS Room", granted: false, recent: false },
//     { time: "14:22", name: "Sneha Patel", door: "Main Entry", granted: true, recent: false },
//     { time: "14:18", name: "Maintenance", door: "Loading Bay", granted: true, recent: false },
//     { time: "14:15", name: "Visitor V-042", door: "Main Entry", granted: true, recent: false },
//   ];

//   const insights = [
//     "Roof Access forced open — security team dispatched.",
//     "23 access denials today — 8 in last hour. Investigate.",
//     "Visitor V-042 badge expires in 4 hours.",
//   ];

//   const accessHourly = [[8, 15, 22, 35, 42, 38, 45, 55, 48, 40, 32, 25]];
//   const deniedHourly = [[0, 1, 2, 3, 4, 3, 5, 6, 4, 2, 2, 1]];

//   const zoneDonut = [{ label: "Authorized", value: 72, color: C.green }, { label: "Visitor", value: 18, color: C.cyan }, { label: "Temp", value: 10, color: C.yellow }];
//   const statusDonut = [{ label: "Open", value: 20, color: C.green }, { label: "Locked", value: 75, color: C.blue }, { label: "Alert", value: 5, color: C.red }];

//   return (
//     <div>
//       {/* TIME FILTER ROW */}
//       <div style={{ padding: "8px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <div style={{ fontSize: "11px", fontWeight: "600", color: C.text, fontFamily: "'Exo 2'" }}>
//           📊 Historical Data Analysis — Showing {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View
//         </div>
//         <TimeFilter activeFilter={timeFilter} onFilterChange={setTimeFilter} />
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", padding: "10px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}` }}>
//         {kpis.map((kpi, i) => (
//           <div key={i} className="fade-in" style={{ background: kpi.bg, border: `2px solid ${kpi.color}44`, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", boxShadow: C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden" }}>
//             <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius: "10px 10px 0 0" }} />
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//               <div>
//                 <div style={{ fontSize: "20px", fontWeight: "800", color: kpi.color, lineHeight: 1.1, fontFamily: "'Share Tech Mono'", ...(kpi.blink ? { animation: "pulse 2s infinite" } : {}) }}>
//                   <Counter end={kpi.end} decimals={0} suffix={kpi.unit} />
//                 </div>
//                 <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px", fontWeight: "600" }}>{kpi.icon} {kpi.label}</div>
//               </div>
//               <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i * ANIM.kpiStagger} />
//             </div>
//           </div>
//         ))}
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 250px", gap: "10px", padding: "10px 18px", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
//         {/* LEFT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel>
//             <PHead accent={C.blue}>🚪 Door Status</PHead>
//             <div style={{ padding: "8px", maxHeight: "480px", overflowY: "auto" }}>
//               <DoorStatusGrid doors={doors} />
//             </div>
//           </Panel>
//         </div>

//         {/* CENTER */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <div style={{ background: "linear-gradient(90deg, #fff0f3, #ffeef6)", border: `1px solid ${C.red}44`, borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start", boxShadow: C.shadow }}>
//             <div style={{ background: `linear-gradient(135deg, ${C.red}, ${C.orange})`, borderRadius: "7px", padding: "5px 12px", fontSize: "11px", fontWeight: "800", color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>🤖 ACS AI»</div>
//             <div style={{ flex: 1 }}>
//               {insights.map((ins, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", opacity: i === aiIdx ? 1 : 0.38, transition: "opacity 0.8s" }}>
//                   <span style={{ color: C.red, fontSize: "12px", fontWeight: "700" }}>•</span>
//                   <span style={{ fontSize: "11px", color: i === aiIdx ? C.text : C.muted, fontWeight: i === aiIdx ? "600" : "400" }}>{ins}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel>
//               <PHead accent={C.green}>✅ Hourly Access Granted {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={accessHourly} colors={[C.green]} labels={["Granted"]} yMin={0} yMax={65} yTicks={[15, 30, 45, 60]} timeLabels={["6am", "8am", "10am", "12p", "2pm", "4pm"]} height={100} />
//               </div>
//             </Panel>
//             <Panel>
//               <PHead accent={C.red}>🚫 Hourly Access Denied {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={deniedHourly} colors={[C.red]} labels={["Denied"]} yMin={0} yMax={8} yTicks={[2, 4, 6, 8]} timeLabels={["6am", "8am", "10am", "12p", "2pm", "4pm"]} height={100} />
//               </div>
//             </Panel>
//           </div>

//           <Panel>
//             <PHead accent={C.orange}>📋 Recent Access Log</PHead>
//             <div style={{ padding: "8px 12px", maxHeight: "280px", overflowY: "auto" }}>
//               <AccessLog entries={accessLog} />
//             </div>
//           </Panel>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>🔐 Zone Access Load</div>
//               <HBar label="Main Entry" value={88} color={C.blue} delay={200} />
//               <HBar label="Server Hall" value={30} color={C.cyan} delay={300} />
//               <HBar label="NOC" value={65} color={C.green} delay={400} />
//               <HBar label="Operations" value={72} color={C.purple} delay={500} />
//             </Panel>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>👥 Personnel Distribution</div>
//               <HBar label="IT Staff" value={45} color={C.blue} delay={200} />
//               <HBar label="Operations" value={30} color={C.green} delay={300} />
//               <HBar label="Maintenance" value={15} color={C.yellow} delay={400} />
//               <HBar label="Visitors" value={10} color={C.orange} delay={500} />
//             </Panel>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel><PHead accent={C.blue}>🍩 Badge & Door Status</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Donut segments={zoneDonut} size={96} title="Badges" /><Donut segments={statusDonut} size={96} title="Doors" /></div></Panel>
//           <Panel><PHead accent={C.green}>🔑 Access Gauges</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Gauge value={94.7} max={100} color={C.green} label="Grant Rate" sub="%" /><Gauge value={98.2} max={100} color={C.blue} label="Door Health" sub="%" /></div></Panel>
//           <Panel style={{ padding: "10px" }}>
//             <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>🔒 Security Zones</div>
//             <HBar label="Perimeter" value={100} color={C.green} delay={200} />
//             <HBar label="Server Zones" value={98} color={C.blue} delay={300} />
//             <HBar label="Public Areas" value={85} color={C.cyan} delay={400} />
//             <HBar label="Restricted" value={100} color={C.purple} delay={500} />
//           </Panel>
//           <div style={{ background: "#fff5f7", border: `1px solid ${C.red}44`, borderRadius: "10px", padding: "10px 12px", boxShadow: C.shadow }}>
//             <div style={{ fontSize: "10px", fontWeight: "800", color: C.red, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}><span className="pulse-dot">🔴</span> SECURITY ALERTS</div>
//             {["Roof Access: Forced Open!", "5 denied attempts — Badge 7731", "Visitor badge expiring: 4hrs"].map((a, i) => (
//               <div key={i} style={{ fontSize: "10px", color: C.text, padding: "5px 0", borderBottom: i < 2 ? `1px solid ${C.red}22` : "none", fontFamily: "'Share Tech Mono'", display: "flex", gap: "5px", alignItems: "center" }}>
//                 <span style={{ color: C.red, fontWeight: "800" }}>▶</span> {a}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  FAS DASHBOARD — Fire Alarm System
// // ══════════════════════════════════════════
// function FireZoneMap() {
//   const [tick, setTick] = useState(0);
//   useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 800); return () => clearInterval(id); }, []);
//   const zones = [
//     { x: 10, y: 10, w: 90, h: 65, label: "Zone A\nServer Hall", status: "normal" },
//     { x: 110, y: 10, w: 80, h: 65, label: "Zone B\nUPS Room", status: "alert" },
//     { x: 200, y: 10, w: 55, h: 65, label: "Zone C\nNetwork", status: "normal" },
//     { x: 10, y: 85, w: 100, h: 55, label: "Zone D\nStorage", status: "normal" },
//     { x: 120, y: 85, w: 135, h: 55, label: "Zone E\nOperations", status: "warning" },
//   ];
//   const getCol = s => s === "normal" ? C.green : s === "warning" ? C.yellow : C.red;
//   const getBg = s => s === "normal" ? "#e8faf322" : s === "warning" ? "#fffae833" : "#feeaed55";
//   const getIcon = s => s === "normal" ? "✓" : s === "warning" ? "⚠" : "🔥";
//   return (
//     <svg width="100%" height="150" viewBox="0 0 265 150" preserveAspectRatio="none">
//       <rect x={0} y={0} width={265} height={150} fill={C.accent} rx="4" />
//       {zones.map((z, i) => {
//         const flash = z.status === "alert" && tick % 2 === 0;
//         const col = getCol(z.status);
//         return (
//           <g key={i}>
//             <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={flash ? "#feeaed88" : getBg(z.status)} stroke={col} strokeWidth={z.status === "alert" ? "2" : "1.5"} rx="4" opacity={flash ? 0.6 : 1} />
//             <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 4} textAnchor="middle" fill={col} fontSize="14" fontFamily="'Exo 2'">{getIcon(z.status)}</text>
//             {z.label.split("\n").map((line, li) => (
//               <text key={li} x={z.x + z.w / 2} y={z.y + z.h / 2 + 8 + li * 9} textAnchor="middle" fill={C.text} fontSize="7" fontFamily="'Exo 2'" fontWeight="600">{line}</text>
//             ))}
//           </g>
//         );
//       })}
//       <text x={132} y={146} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'Exo 2'">Fire Zone Map — Ground Floor</text>
//     </svg>
//   );
// }

// function FASDashboard() {
//   const [aiIdx, setAiIdx] = useState(0);
//   const [timeFilter, setTimeFilter] = useState("day");
  
//   useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

//   const kpis = [
//     { icon: "🔥", label: "Active Alarms", end: 1, unit: "", color: C.red, bg: "#fff0f3", blink: true, sparkData: [0, 0, 1, 0, 0, 0, 1] },
//     { icon: "⚠️", label: "Warnings", end: 2, unit: "", color: C.yellow, bg: "#fffae8", sparkData: [1, 1, 2, 1, 2, 2, 2] },
//     { icon: "🌡", label: "Max Smoke", end: 18, unit: " ppm", color: C.orange, bg: "#fff7f0", sparkData: [10, 12, 14, 16, 15, 17, 18] },
//     { icon: "🚿", label: "Sprinklers", end: 48, unit: "", color: C.blue, bg: "#f0f5ff", sparkData: [48, 48, 48, 48, 48, 48, 48] },
//     { icon: "📟", label: "Detectors OK", end: 124, unit: "/126", color: C.green, bg: "#f0fdf8", sparkData: [126, 126, 125, 126, 125, 124, 124] },
//     { icon: "🔔", label: "Tests Due", end: 3, unit: "", color: C.purple, bg: "#f5f0ff", sparkData: [5, 4, 4, 3, 3, 3, 3] },
//   ];

//   const detectors = [
//     { id: "SMK-B12", zone: "Zone B - UPS Room", type: "Smoke", value: 22, unit: "ppm", status: "alarm", lastTest: "15 Jun" },
//     { id: "HT-E05", zone: "Zone E - Operations", type: "Heat", value: 34, unit: "°C", status: "warning", lastTest: "15 Jun" },
//     { id: "CO-A03", zone: "Zone A - Server Hall", type: "CO", value: 8, unit: "ppm", status: "normal", lastTest: "15 Jun" },
//     { id: "SMK-C08", zone: "Zone C - Network", type: "Smoke", value: 3, unit: "ppm", status: "normal", lastTest: "10 Jun" },
//     { id: "HT-D11", zone: "Zone D - Storage", type: "Heat", value: 22, unit: "°C", status: "normal", lastTest: "12 Jun" },
//   ];

//   const insights = [
//     "SMK-B12 alarm in UPS Room — possible overheating event.",
//     "Zone E heat sensor elevated — correlates with CRAC-02 fault (BMS).",
//     "3 detector tests overdue — schedule maintenance.",
//   ];

//   const smokeData = [[2, 3, 4, 5, 8, 12, 18, 22, 20, 18, 15, 18]];
//   const heatData = [[22, 22.5, 23, 23.8, 25, 27, 30, 32, 34, 33, 33, 34]];

//   const alarmDonut = [{ label: "Normal", value: 120, color: C.green }, { label: "Warning", value: 4, color: C.yellow }, { label: "Alarm", value: 2, color: C.red }];
//   const typeDonut = [{ label: "Smoke", value: 55, color: C.orange }, { label: "Heat", value: 30, color: C.red }, { label: "CO", value: 15, color: C.purple }];

//   return (
//     <div>
//       {/* TIME FILTER ROW */}
//       <div style={{ padding: "8px 18px", background: "#ffe8ea", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <div style={{ fontSize: "11px", fontWeight: "600", color: C.text, fontFamily: "'Exo 2'" }}>
//           📊 Historical Data Analysis — Showing {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View
//         </div>
//         <TimeFilter activeFilter={timeFilter} onFilterChange={setTimeFilter} />
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", padding: "10px 18px", background: "#ffe8ea", borderBottom: `1px solid ${C.panelBorder}` }}>
//         {kpis.map((kpi, i) => (
//           <div key={i} className="fade-in" style={{ background: kpi.bg, border: `2px solid ${kpi.color}44`, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", boxShadow: C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden" }}>
//             <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius: "10px 10px 0 0" }} />
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//               <div>
//                 <div style={{ fontSize: "20px", fontWeight: "800", color: kpi.color, lineHeight: 1.1, fontFamily: "'Share Tech Mono'", ...(kpi.blink ? { animation: "pulse 2s infinite" } : {}) }}>
//                   <Counter end={kpi.end} decimals={0} suffix={kpi.unit} />
//                 </div>
//                 <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px", fontWeight: "600" }}>{kpi.icon} {kpi.label}</div>
//               </div>
//               <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i * ANIM.kpiStagger} />
//             </div>
//           </div>
//         ))}
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 250px", gap: "10px", padding: "10px 18px", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
//         {/* LEFT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel>
//             <PHead accent={C.red}>🔥 Detector Status</PHead>
//             <div style={{ padding: "8px", maxHeight: "380px", overflowY: "auto" }}>
//               {detectors.map((d, i) => {
//                 const col = d.status === "alarm" ? C.red : d.status === "warning" ? C.yellow : C.green;
//                 return (
//                   <div key={i} style={{ padding: "8px 10px", borderRadius: "8px", marginBottom: "8px", background: col === C.red ? "#feeaed" : col === C.yellow ? "#fffae8" : "#e8faf3", border: `1px solid ${col}44` }}>
//                     <div style={{ display: "flex", justifyContent: "space-between" }}>
//                       <span style={{ fontSize: "11px", fontWeight: "700", color: C.text, fontFamily: "'Share Tech Mono'" }}>{d.id}</span>
//                       <span style={{ fontSize: "9px", color: col, fontWeight: "700", animation: d.status === "alarm" ? "pulse 2s infinite" : "none" }}>{d.status.toUpperCase()}</span>
//                     </div>
//                     <div style={{ fontSize: "9px", color: C.muted, marginTop: "3px" }}>{d.type} · {d.value}{d.unit}</div>
//                     <div style={{ fontSize: "8px", color: C.muted }}>Test: {d.lastTest}</div>
//                   </div>
//                 );
//               })}
//             </div>
//           </Panel>
//         </div>

//         {/* CENTER */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <div style={{ background: "linear-gradient(90deg, #fff0f0, #fff5ee)", border: `2px solid ${C.red}44`, borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start", boxShadow: C.shadow, animation: "pulse 3s infinite" }}>
//             <div style={{ background: `linear-gradient(135deg, ${C.red}, ${C.orange})`, borderRadius: "7px", padding: "5px 12px", fontSize: "11px", fontWeight: "800", color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>🤖 FAS AI»</div>
//             <div style={{ flex: 1 }}>
//               {insights.map((ins, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", opacity: i === aiIdx ? 1 : 0.38, transition: "opacity 0.8s" }}>
//                   <span style={{ color: C.red, fontSize: "12px", fontWeight: "700" }}>•</span>
//                   <span style={{ fontSize: "11px", color: i === aiIdx ? C.text : C.muted, fontWeight: i === aiIdx ? "600" : "400" }}>{ins}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <Panel>
//             <PHead accent={C.red}>🗺 Fire Zone Map</PHead>
//             <div style={{ padding: "12px", minHeight: "180px" }}>
//               <div style={{ width: "100%", height: "auto" }}>
//                 <FireZoneMap />
//               </div>
//               <div style={{ fontSize: "9px", color: C.muted, textAlign: "center", marginTop: "8px" }}>
//                 🟢 Normal &nbsp;&nbsp; 🟡 Warning &nbsp;&nbsp; 🔴 Active Alarm
//               </div>
//             </div>
//           </Panel>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel>
//               <PHead accent={C.orange}>💨 Smoke Levels (ppm) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={smokeData} colors={[C.orange]} labels={["Smoke ppm"]} yMin={0} yMax={25} yTicks={[5, 10, 15, 20, 25]} timeLabels={["6am", "8am", "10am", "12p", "2pm", "4pm"]} height={100} />
//               </div>
//             </Panel>
//             <Panel>
//               <PHead accent={C.red}>🌡 Heat Sensor (°C) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={heatData} colors={[C.red]} labels={["Heat °C"]} yMin={20} yMax={36} yTicks={[22, 26, 30, 34]} timeLabels={["6am", "8am", "10am", "12p", "2pm", "4pm"]} height={100} />
//               </div>
//             </Panel>
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>🚿 Suppression Systems</div>
//               <HBar label="Sprinklers Ready" value={100} color={C.green} delay={200} />
//               <HBar label="CO₂ Systems" value={100} color={C.blue} delay={300} />
//               <HBar label="Halon Reserve" value={82} color={C.cyan} delay={400} />
//               <HBar label="FM-200 Pressure" value={95} color={C.purple} delay={500} />
//             </Panel>
//             <Panel style={{ padding: "10px" }}>
//               <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "8px" }}>📡 Panel Status</div>
//               <HBar label="Main Control Panel" value={100} color={C.green} delay={200} />
//               <HBar label="Annunciator Panel" value={100} color={C.green} delay={300} />
//               <HBar label="Battery Backup" value={88} color={C.yellow} delay={400} />
//               <HBar label="Comm Link" value={98} color={C.green} delay={500} />
//             </Panel>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel><PHead accent={C.red}>🍩 Detector Overview</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Donut segments={alarmDonut} size={96} title="Status" /><Donut segments={typeDonut} size={96} title="Types" /></div></Panel>
//           <Panel><PHead accent={C.orange}>🌡 Sensor Gauges</PHead><div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Gauge value={22} max={100} color={C.orange} label="Smoke ppm" sub="UPS Room" /><Gauge value={34} max={80} color={C.red} label="Heat °C" sub="Ops Zone" /></div></Panel>
//           <Panel style={{ padding: "10px" }}>
//             <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>📋 Zone Health</div>
//             <HBar label="Zone A — Server Hall" value={98} color={C.green} delay={200} />
//             <HBar label="Zone B — UPS Room" value={20} color={C.red} delay={300} />
//             <HBar label="Zone C — Network" value={100} color={C.green} delay={400} />
//             <HBar label="Zone D — Storage" value={100} color={C.green} delay={500} />
//             <HBar label="Zone E — Operations" value={60} color={C.yellow} delay={600} />
//           </Panel>
//           <div style={{ background: "#fff0f0", border: `2px solid ${C.red}66`, borderRadius: "10px", padding: "10px 12px", boxShadow: C.shadow, animation: "pulse 2s infinite" }}>
//             <div style={{ fontSize: "10px", fontWeight: "800", color: C.red, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}><span className="pulse-dot">🔴</span> 🔥 FIRE ALERTS</div>
//             {["ALARM: SMK-B12 UPS Room Active!", "WARNING: Zone E temp elevated", "TEST DUE: Zones B, C, E — overdue"].map((a, i) => (
//               <div key={i} style={{ fontSize: "10px", color: i === 0 ? C.red : C.text, padding: "5px 0", borderBottom: i < 2 ? `1px solid ${C.red}22` : "none", fontFamily: "'Share Tech Mono'", display: "flex", gap: "5px", alignItems: "center", fontWeight: i === 0 ? "700" : "400" }}>
//                 <span style={{ color: C.red, fontWeight: "800" }}>▶</span> {a}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  VMS DASHBOARD — Video Management System (Light Theme)
// // ══════════════════════════════════════════
// function CameraFeed({ id, location, status, motionLevel, isAlarm }) {
//   const [scanY, setScanY] = useState(0);
//   const [tick, setTick] = useState(0);
//   useEffect(() => {
//     const id2 = setInterval(() => {
//       setScanY(y => (y + 3) % 100);
//       setTick(t => t + 1);
//     }, 80);
//     return () => clearInterval(id2);
//   }, []);

//   const statusColor = status === "online" ? C.green : status === "motion" ? C.yellow : status === "alarm" ? C.red : C.muted;

//   const noiseBlocks = Array.from({ length: 24 }, (_, i) => {
//     const val = Math.sin(tick * 0.1 + i * 1.7) * 0.5 + 0.5;
//     return { x: (i % 6) * 16 + 8, y: Math.floor(i / 6) * 16 + 10, opacity: val * 0.08 };
//   });

//   return (
//     <div style={{ background: "#f0f4fa", border: `2px solid ${isAlarm ? C.red : status === "motion" ? C.yellow : C.panelBorder}`, borderRadius: "8px", overflow: "hidden", position: "relative", aspectRatio: "16/10" }}>
//       <svg width="100%" height="100%" viewBox="0 0 110 72" preserveAspectRatio="none">
//         <rect x={0} y={0} width={110} height={72} fill="#e8eef8" />
//         {noiseBlocks.map((b, i) => (
//           <rect key={i} x={b.x} y={b.y} width={14} height={14} fill="#8aaad0" opacity={b.opacity} rx="1" />
//         ))}
//         {status !== "offline" && (
//           <>
//             <rect x={15} y={20} width={25} height={30} fill="#d4dfef" rx="3" opacity="0.7" />
//             <rect x={50} y={25} width={20} height={25} fill="#d4dfef" rx="3" opacity="0.7" />
//             <rect x={80} y={22} width={15} height={28} fill="#d4dfef" rx="3" opacity="0.6" />
//             <line x1={0} y1={scanY * 0.72} x2={110} y2={scanY * 0.72} stroke={statusColor} strokeWidth="0.4" opacity="0.3" />
//           </>
//         )}
//         {status === "offline" && (
//           <text x={55} y={40} textAnchor="middle" fill="#7a8aaa" fontSize="8" fontFamily="'Share Tech Mono'">NO SIGNAL</text>
//         )}
//         {isAlarm && tick % 20 < 10 && <rect x={0} y={0} width={110} height={72} fill={C.red} opacity="0.08" />}
//         <rect x={2} y={2} width={40} height={8} fill="#fff" opacity="0.7" rx="1" />
//         <text x={4} y={8} fill={statusColor} fontSize="5" fontFamily="'Share Tech Mono'">{id} · {status.toUpperCase()}</text>
//         <text x={108} y={8} textAnchor="end" fill="#7a8aaa" fontSize="5" fontFamily="'Share Tech Mono'">{new Date().toLocaleTimeString()}</text>
//         {status !== "offline" && (
//           <>
//             <rect x={2} y={62} width={30} height={7} fill="#fff" opacity="0.7" rx="1" />
//             <text x={4} y={67.5} fill="#7a8aaa" fontSize="4.5" fontFamily="'Share Tech Mono'">{location}</text>
//           </>
//         )}
//         {(status === "motion" || isAlarm) && (
//           <text x={56} y={15} textAnchor="middle" fill={isAlarm ? C.red : C.yellow} fontSize="6" fontFamily="'Share Tech Mono'" fontWeight="700">{isAlarm ? "⚠ INTRUSION" : "MOTION"}</text>
//         )}
//       </svg>
//     </div>
//   );
// }

// function VMSDashboard() {
//   const [aiIdx, setAiIdx] = useState(0);
//   const [selectedCam, setSelectedCam] = useState(null);
//   const [timeFilter, setTimeFilter] = useState("day");
  
//   useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

//   const kpis = [
//     { icon: "📹", label: "Total Cameras", end: 32, unit: "", color: C.blue, bg: "#f0f5ff", sparkData: [30, 31, 32, 32, 32, 31, 32] },
//     { icon: "🟢", label: "Online", end: 30, unit: "", color: C.green, bg: "#f0fdf8", sparkData: [28, 29, 30, 29, 30, 30, 30] },
//     { icon: "🔴", label: "Offline", end: 2, unit: "", color: C.red, bg: "#fff0f3", blink: true, sparkData: [1, 1, 2, 2, 1, 2, 2] },
//     { icon: "🚨", label: "Motion Events", end: 47, unit: "", color: C.yellow, bg: "#fffae8", sparkData: [30, 35, 38, 42, 44, 46, 47] },
//     { icon: "💾", label: "Storage Used", end: 68, unit: "%", color: C.orange, bg: "#fff7f0", sparkData: [60, 62, 64, 65, 66, 67, 68] },
//     { icon: "📡", label: "Streams Active", end: 28, unit: "", color: C.cyan, bg: "#f0faff", sparkData: [25, 26, 27, 27, 28, 28, 28] },
//   ];

//   const cameras = [
//     { id: "CAM-01", location: "Main Entry", status: "motion", isAlarm: false },
//     { id: "CAM-02", location: "Server Hall", status: "online", isAlarm: false },
//     { id: "CAM-03", location: "Roof Access", status: "alarm", isAlarm: true },
//     { id: "CAM-04", location: "UPS Room", status: "online", isAlarm: false },
//     { id: "CAM-05", location: "Loading Bay", status: "motion", isAlarm: false },
//     { id: "CAM-06", location: "Parking", status: "online", isAlarm: false },
//     { id: "CAM-07", location: "Corridor B", status: "offline", isAlarm: false },
//     { id: "CAM-08", location: "Operations", status: "online", isAlarm: false },
//   ];

//   const motionData = [[2, 4, 6, 8, 10, 8, 12, 15, 14, 10, 8, 6]];
//   const storageData = [[60, 61, 62, 63, 64, 65, 65, 66, 67, 67, 68, 68]];

//   const insights = [
//     "CAM-03 Roof: Intrusion detected — aligns with ACS forced-open alert.",
//     "Motion spike at Loading Bay — correlates with access log at 14:18.",
//     "CAM-07 offline 45 min — hardware check required.",
//   ];

//   const camDonut = [{ label: "Online", value: 30, color: C.green }, { label: "Motion", value: 8, color: C.yellow }, { label: "Offline", value: 2, color: C.red }];
//   const recDonut = [{ label: "Recording", value: 28, color: C.blue }, { label: "Standby", value: 4, color: C.cyan }];

//   const eventLog = [
//     { time: "14:32", cam: "CAM-03", event: "Intrusion Detected", level: "alarm" },
//     { time: "14:31", cam: "CAM-01", event: "Person Detected", level: "motion" },
//     { time: "14:29", cam: "CAM-05", event: "Vehicle Detected", level: "motion" },
//     { time: "14:25", cam: "CAM-03", event: "Zone Breach", level: "alarm" },
//     { time: "14:22", cam: "CAM-01", event: "Person Detected", level: "motion" },
//     { time: "14:18", cam: "CAM-05", event: "Person Detected", level: "motion" },
//     { time: "14:07", cam: "CAM-07", event: "Camera Offline", level: "fault" },
//   ];

//   return (
//     <div>
//       {/* TIME FILTER ROW */}
//       <div style={{ padding: "8px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <div style={{ fontSize: "11px", fontWeight: "600", color: C.text, fontFamily: "'Exo 2'" }}>
//           📊 Historical Data Analysis — Showing {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View
//         </div>
//         <TimeFilter activeFilter={timeFilter} onFilterChange={setTimeFilter} />
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", padding: "10px 18px", background: "#e4eaf6", borderBottom: `1px solid ${C.panelBorder}` }}>
//         {kpis.map((kpi, i) => (
//           <div key={i} className="fade-in" style={{ background: kpi.bg, border: `2px solid ${kpi.color}44`, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", boxShadow: C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden" }}>
//             <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${kpi.color}88, ${kpi.color})`, borderRadius: "10px 10px 0 0" }} />
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//               <div>
//                 <div style={{ fontSize: "20px", fontWeight: "800", color: kpi.color, lineHeight: 1.1, fontFamily: "'Share Tech Mono'", ...(kpi.blink ? { animation: "pulse 2s infinite" } : {}) }}>
//                   <Counter end={kpi.end} decimals={0} suffix={kpi.unit} />
//                 </div>
//                 <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px", fontWeight: "600" }}>{kpi.icon} {kpi.label}</div>
//               </div>
//               <Sparkline data={kpi.sparkData} color={kpi.color} width={68} height={26} delay={i * ANIM.kpiStagger} />
//             </div>
//           </div>
//         ))}
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "10px", padding: "10px 18px", overflowY: "auto", maxHeight: "calc(100vh - 200px)", background: C.bg }}>
//         {/* LEFT — Camera Grid */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <div style={{ background: "linear-gradient(90deg, #f0f6ff, #eaf4ff)", border: `1px solid ${C.blue}44`, borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start", boxShadow: C.shadow }}>
//             <div style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, borderRadius: "7px", padding: "5px 12px", fontSize: "11px", fontWeight: "800", color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>🤖 VMS AI»</div>
//             <div style={{ flex: 1 }}>
//               {insights.map((ins, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", opacity: i === aiIdx ? 1 : 0.38, transition: "opacity 0.8s" }}>
//                   <span style={{ color: C.blue, fontSize: "12px", fontWeight: "700" }}>•</span>
//                   <span style={{ fontSize: "11px", color: i === aiIdx ? C.text : C.muted, fontWeight: i === aiIdx ? "600" : "400" }}>{ins}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
//             {cameras.map((cam, i) => (
//               <div key={i} onClick={() => setSelectedCam(selectedCam === cam.id ? null : cam.id)} style={{ cursor: "pointer" }}>
//                 <CameraFeed {...cam} />
//                 <div style={{ fontSize: "8px", color: selectedCam === cam.id ? C.cyan : C.muted, textAlign: "center", marginTop: "3px", fontFamily: "'Share Tech Mono'" }}>{cam.id} — {cam.location}</div>
//               </div>
//             ))}
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//             <Panel>
//               <PHead accent={C.yellow}>📈 Motion Events/Hour {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={motionData} colors={[C.yellow]} labels={["Events"]} yMin={0} yMax={18} yTicks={[5, 10, 15]} timeLabels={["6am", "8am", "10am", "12p", "2pm", "4pm"]} height={90} />
//               </div>
//             </Panel>
//             <Panel>
//               <PHead accent={C.orange}>💾 Storage Usage (%) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
//               <div style={{ padding: "6px 8px 4px" }}>
//                 <BMSLineChart data={storageData} colors={[C.orange]} labels={["Storage"]} yMin={58} yMax={70} yTicks={[60, 63, 66, 69]} timeLabels={["6am", "8am", "10am", "12p", "2pm", "4pm"]} height={90} />
//               </div>
//             </Panel>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//           <Panel>
//             <PHead accent={C.blue}>🍩 Camera Overview</PHead>
//             <div style={{ padding: "8px", display: "flex", justifyContent: "space-around" }}><Donut segments={camDonut} size={96} title="Status" /><Donut segments={recDonut} size={96} title="Recording" /></div>
//           </Panel>

//           <Panel style={{ padding: "10px" }}>
//             <div style={{ fontSize: "12px", fontWeight: "700", color: C.text, marginBottom: "10px" }}>📋 System Health</div>
//             <HBar label="Recording Quality" value={94} color={C.green} delay={200} />
//             <HBar label="Stream Uptime" value={98} color={C.blue} delay={300} />
//             <HBar label="Storage Available" value={32} color={C.orange} delay={400} />
//             <HBar label="Network Bandwidth" value={72} color={C.cyan} delay={500} />
//           </Panel>

//           <div style={{ background: "#fff5f7", border: `1px solid ${C.red}44`, borderRadius: "10px", padding: "10px 12px", boxShadow: C.shadow }}>
//             <div style={{ fontSize: "10px", fontWeight: "800", color: C.red, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}><span className="pulse-dot">🔴</span> EVENT LOG</div>
//             {eventLog.map((e, i) => {
//               const col = e.level === "alarm" ? C.red : e.level === "motion" ? C.yellow : C.orange;
//               return (
//                 <div key={i} style={{ fontSize: "9px", color: C.text, padding: "4px 0", borderBottom: i < eventLog.length - 1 ? `1px solid ${C.accent}` : "none", fontFamily: "'Share Tech Mono'", display: "flex", gap: "5px", alignItems: "center" }}>
//                   <span style={{ color: col, fontWeight: "800" }}>▶</span>
//                   <span style={{ color: C.muted, minWidth: "34px" }}>{e.time}</span>
//                   <span style={{ color: col, minWidth: "45px" }}>{e.cam}</span>
//                   <span style={{ flex: 1 }}>{e.event}</span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  CROSS-SYSTEM ALERT BANNER
// // ══════════════════════════════════════════
// function CrossSystemBanner({ alerts }) {
//   const [idx, setIdx] = useState(0);
//   useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % alerts.length), 3000); return () => clearInterval(id); }, [alerts.length]);
//   if (!alerts.length) return null;
//   return (
//     <div style={{ background: `linear-gradient(90deg, #fef0f0, #feeaea)`, border: `1px solid ${C.red}66`, padding: "8px 18px", display: "flex", gap: "10px", alignItems: "center", overflow: "hidden" }}>
//       <div style={{ background: C.red, color: "#fff", fontSize: "9px", fontWeight: "800", padding: "2px 10px", borderRadius: "4px", whiteSpace: "nowrap", fontFamily: "'Exo 2'" }}>🔗 CROSS-SYSTEM</div>
//       {alerts.map((a, i) => (
//         <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", opacity: i === idx ? 1 : 0, position: i === idx ? "relative" : "absolute", transition: "opacity 0.5s" }}>
//           <span style={{ fontSize: "9px", color: C.red, fontFamily: "'Share Tech Mono'" }}>[{a.systems}]</span>
//           <span style={{ fontSize: "10px", color: C.red, fontWeight: "600", fontFamily: "'Exo 2'" }}>{a.msg}</span>
//         </div>
//       ))}
//     </div>
//   );
// }

// // ══════════════════════════════════════════
// //  MAIN APP
// // ══════════════════════════════════════════
// const TABS = [
//   { id: "DCIM", label: "DCIM", full: "Data Center Infrastructure", icon: "🖥", accent: C.blue },
//   { id: "BMS", label: "BMS", full: "Building Management", icon: "🏢", accent: C.green },
//   { id: "ACS", label: "ACS", full: "Access Control", icon: "🔐", accent: C.purple },
//   { id: "FAS", label: "FAS", full: "Fire Alarm System", icon: "🔥", accent: C.red },
//   { id: "VMS", label: "VMS", full: "Video Management", icon: "📹", accent: C.cyan },
// ];

// const CROSS_ALERTS = [
//   { systems: "ACS + VMS + FAS", msg: "Roof forced open → CAM-03 intrusion + FAS perimeter breach — Security Response Required" },
//   { systems: "BMS + DCIM", msg: "CRAC-02 fault (BMS) → Server Hall temp rising (DCIM) — Zone E at 26.1°C" },
//   { systems: "BMS + FAS", msg: "CRAC-02 fault correlates with Zone E elevated heat sensor — SMK-B12 pre-alarm" },
// ];

// export default function SmartCityDashboard() {
//   const [activeTab, setActiveTab] = useState("DCIM");
//   const [time, setTime] = useState(new Date());
//   useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

//   const tab = TABS.find(t => t.id === activeTab);

//   return (
//     <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Exo 2', sans-serif", color: C.text, fontSize: "12px" }}>
//       <style>{styles}</style>

//       {/* TOP NAV - Light color top bar */}
//       <div style={{ background: `linear-gradient(90deg, #f0f4fa, #e8eef8)`, padding: "0 18px", display: "flex", alignItems: "stretch", gap: "0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderBottom: `1px solid ${C.panelBorder}`, position: "sticky", top: 0, zIndex: 10 }}>

//         {/* Tabs */}
//         <div style={{ display: "flex", flex: 1, gap: "2px", alignItems: "stretch", justifyContent:"space-evenly" }}>
//           {TABS.map(t => (
//             <button
//               key={t.id}
//               onClick={() => setActiveTab(t.id)}
//               style={{
//                 background: activeTab === t.id ? `linear-gradient(180deg, ${t.accent}22, ${t.accent}08)` : "transparent",
//                 border: "none", borderBottom: activeTab === t.id ? `3px solid ${t.accent}` : "3px solid transparent",
//                 borderTop: "none", color: activeTab === t.id ? C.text : C.muted,
//                 padding: "0 16px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
//                 gap: "2px", minWidth: "90px", transition: "all 0.25s ease", fontFamily: "'Exo 2'",
//               }}
//             >
//               <div style={{ fontSize: "18px" }}>{t.icon}</div>
//               <div style={{ fontSize: "12px", fontWeight: activeTab === t.id ? "800" : "600", letterSpacing: "0.5px" }}>{t.label}</div>
//             </button>
//           ))}
//         </div>

//         {/* Clock */}
//         <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingLeft: "16px", borderLeft: `1px solid ${C.accentBorder}` }}>
//           <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, fontFamily: "'Share Tech Mono'" }}>
//             {time.toLocaleTimeString()}
//           </div>
//           <div style={{ fontSize: "8px", color: C.muted }}>
//             {time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
//             <div style={{ width: "5px", height: "5px", background: C.green, borderRadius: "50%", animation: "pulse 2s infinite" }} />
//             <span style={{ fontSize: "7px", color: C.green, fontWeight: "700" }}>ALL SYSTEMS LIVE</span>
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div key={activeTab} className="fade-in" style={{ animationDuration: "0.4s" }}>
//         {activeTab === "DCIM" && <DCIMDashboard />}
//         {activeTab === "BMS" && <BMSDashboard />}
//         {activeTab === "ACS" && <ACSDashboard />}
//         {activeTab === "FAS" && <FASDashboard />}
//         {activeTab === "VMS" && <VMSDashboard />}
//       </div>
//     </div>
//   );
// }

//--------------------------------------------------------------------------------------------------------
import React, { useState, useEffect, useRef } from "react";
// DCIM tab: the DCIM Health Index (ported from the reference portal) sits on top, and
// both halves read their numbers from the same 5D View calculation.
import DCIMDashboard2 from "./NewDcimDashBoard";
import {
  DCIM, SHOW, FACILITY, RACKS, RACK_U, RACK_U_MAP, ROOM_TEMP_C, SERVER_ROOM_HEAT_C, ASSUMPTIONS,
  ACTIVE_ALARMS, OPEN_CHANGES, CHANGES, INSIGHTS, MAINTENANCE, CPU_LOAD_AVG_PCT, trail, forecast,
  MEMORY_UTIL_PCT, DISK_UTIL_PCT, GPU_UTIL_PCT,
} from "./dcimDashboardData";

// ─────────────────────────────────────────
//  ANIMATION SPEED CONTROL
// ─────────────────────────────────────────
const ANIM = {
  counter: 3000, gauge: 3500, gaugeDelay: 600, powerChart: 4000,
  capForecast: 3500, hbar: 2500, hbarStagger: 200, thermalInterval: 1200,
  aiCycle: 5000, donut: 2800, sparkline: 3000, kpiStagger: 120, chartTransition: 800,
};

// Light theme on every tab. Type is set for reading at a distance: 13–15 px
// body text, 15 px panel titles, 28 px KPI figures; each panel carries the
// colour of what it shows.
const C = {
  bg: "#ffffff", panel: "#ffffff", panelBorder: "#e1e8f3",   // bg: white page background on every tab
  nav: "#1a2f5e", blue: "#1a6aff", cyan: "#0096c7",
  green: "#0cb87a", yellow: "#f5a623", red: "#e8304a",
  orange: "#f07030", purple: "#7c3aed", teal: "#0d9488", pink: "#db2777", indigo: "#4f46e5",
  text: "#14213d", sub: "#44516f", muted: "#66769a",
  accent: "#edf2fa", accentBorder: "#d3ddef",
  shadow: "0 4px 18px rgba(26,47,94,0.07)",
};
const FONT = "'Exo 2', 'Segoe UI', sans-serif";
const MONO = "'Share Tech Mono', ui-monospace, monospace";
// Bright fills stay as they are; text in the same hue is set a shade darker
// so it reads on white.
const INK = { [C.yellow]: "#c47d00", [C.green]: "#07935f", [C.cyan]: "#007ca6", [C.orange]: "#d4570f", [C.muted]: "#5d6d8f" };
const ink = (c) => INK[c] || c;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800&family=Share+Tech+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f0f4fa; }
  ::-webkit-scrollbar-thumb { background: #c8d4ea; border-radius: 6px; }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
  @keyframes alertGlow { 0%,100%{box-shadow:0 4px 16px rgba(232,48,74,0.10)} 50%{box-shadow:0 4px 26px rgba(232,48,74,0.38)} }
  .fade-in   { animation: fadeInUp 0.7s ease-out forwards; }
  .pulse-dot { animation: pulse 2s ease-in-out infinite; }
  .blink     { animation: blink 1.4s ease-in-out infinite; }
  .slide-in  { animation: slideIn 0.5s ease-out forwards; }
  .ddx-glow  { animation: alertGlow 2.4s ease-in-out infinite; }
  .ddx-root  { container-type: inline-size; }
  .ddx-kpis  { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
  .ddx-body  { display: grid; gap: 16px; align-items: start; }
  .ddx-col   { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .ddx-two   { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px; }
  .ddx-tab:hover { background: #f5f8fe; }
  .ddx-tab:focus-visible, .ddx-chip:focus-visible, .ddx-click:focus-visible { outline: 2px solid #1a6aff; outline-offset: 2px; }
  @container (max-width: 1180px) {
    .ddx-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .ddx-body { grid-template-columns: minmax(220px, 250px) minmax(0, 1fr) !important; }
    .ddx-body > .ddx-right { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .ddx-body.ddx-wide { grid-template-columns: minmax(0, 1fr) !important; }
  }
  @container (max-width: 860px) {
    .ddx-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ddx-body { grid-template-columns: minmax(0, 1fr) !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fade-in, .pulse-dot, .blink, .slide-in, .ddx-glow { animation: none !important; opacity: 1 !important; }
  }
`;

// ── Building blocks ──
let UID = 0;
const useUid = (prefix) => useState(() => `${prefix}${++UID}`)[0];

const Panel = ({ children, style = {} }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden", minWidth: 0, ...style }}>{children}</div>
);
const IconTile = ({ icon, color, size = 34 }) => (
  <span aria-hidden="true" style={{
    width: size, height: size, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: `linear-gradient(135deg, ${color}2e, ${color}12)`, border: `1px solid ${color}40`,
    fontSize: Math.round(size * 0.5), flexShrink: 0,
  }}>{icon}</span>
);
const PHead = ({ icon, children, accent = C.blue, right }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 11, padding: "12px 16px",
    borderBottom: `1px solid ${C.accent}`, borderTop: `3px solid ${accent}`,
    background: `linear-gradient(90deg, ${accent}14, ${C.panel} 70%)`,
  }}>
    {icon && <IconTile icon={icon} color={accent} />}
    <span style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{children}</span>
    {right && <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{right}</span>}
  </div>
);
const StatusPill = ({ color, children, blink }) => (
  <span style={{
    fontSize: 11.5, fontWeight: 800, color: ink(color), background: `${color}1a`, border: `1px solid ${color}55`,
    padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: 0.2,
    ...(blink ? { animation: "pulse 2s infinite" } : {}),
  }}>{children}</span>
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

// Width of a chart's box, so the SVG is drawn 1:1 and its text is never stretched.
function useWidth(fallback = 480) {
  const ref = useRef(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => { const cw = Math.floor(el.getBoundingClientRect().width); if (cw > 0) setW((prev) => (Math.abs(prev - cw) > 1 ? cw : prev)); };
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function Counter({ end, duration = ANIM.counter, decimals = 0, suffix = "" }) {
  const p = useAnimProg(duration);
  return <>{(+(end * p).toFixed(decimals)).toLocaleString()}{suffix}</>;
}

// Sparkline that fills the width of its card.
function SparkFill({ data, color, height = 30, delay = 0 }) {
  const prog = useAnimProg(ANIM.sparkline, delay);
  const [ref, width] = useWidth(150);
  const uid = useUid("sp");
  const minV = Math.min(...data), maxV = Math.max(...data);
  const toX = i => 3 + (i / (data.length - 1)) * (width - 8);
  const toY = v => height - 4 - ((v - minV) / (maxV - minV + 0.001)) * (height - 10);
  const lp = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const ap = lp + ` L ${toX(data.length - 1)} ${height} L ${toX(0)} ${height} Z`;
  return (
    <div ref={ref} style={{ width: "100%", height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" /><stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}c`}><rect x={0} y={0} width={width * prog} height={height} /></clipPath>
        </defs>
        <path d={ap} fill={`url(#${uid}g)`} clipPath={`url(#${uid}c)`} />
        <path d={lp} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${uid}c)`} />
        <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="3.4" fill={color} stroke="#fff" strokeWidth="1.5" style={{ opacity: prog > 0.9 ? 1 : 0, transition: "opacity 0.3s" }} />
      </svg>
    </div>
  );
}

function Gauge({ value, max, color, label, sub, decimals }) {
  const prog = useAnimProg(ANIM.gauge, ANIM.gaugeDelay);
  const pct = (value / max) * prog;
  const r = 46, cx = 70, cy = 60;
  const toRad = d => (d * Math.PI) / 180;
  const sa = -220, sw = 260;
  const x1 = cx + r * Math.cos(toRad(sa)), y1 = cy + r * Math.sin(toRad(sa));
  const ex = cx + r * Math.cos(toRad(sa + sw)), ey = cy + r * Math.sin(toRad(sa + sw));
  const ax = cx + r * Math.cos(toRad(sa + sw * pct)), ay = cy + r * Math.sin(toRad(sa + sw * pct));
  const lg = sw * pct > 180 ? 1 : 0;
  const uid = useUid("gg");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140 }} role="img" aria-label={`${label}: ${value}${sub ? ` ${sub}` : ""}`}>
    <svg width="140" height="106" viewBox="0 0 140 106">
      <defs><linearGradient id={uid} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={color} stopOpacity="0.5" /><stop offset="100%" stopColor={color} /></linearGradient></defs>
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke={`${color}22`} strokeWidth="11" strokeLinecap="round" />
      {pct > 0.01 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${ax} ${ay}`} fill="none" stroke={`url(#${uid})`} strokeWidth="11" strokeLinecap="round" />}
      {Array.from({ length: 9 }, (_, i) => { const a = toRad(sa + (i / 8) * sw); return <line key={i} x1={cx + 54 * Math.cos(a)} y1={cy + 54 * Math.sin(a)} x2={cx + 60 * Math.cos(a)} y2={cy + 60 * Math.sin(a)} stroke={C.accentBorder} strokeWidth="1.6" />; })}
      <text x={cx} y={cy + 8} textAnchor="middle" fill={ink(color)} fontSize="24" fontWeight="800" fontFamily={FONT}>{(value * prog).toFixed(decimals ?? (value % 1 ? 1 : 0))}</text>
    </svg>
    <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, textAlign: "center", lineHeight: 1.3, marginTop: -2 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textAlign: "center", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Donut({ segments, size = 116, title, unit = "" }) {
  const prog = useAnimProg(ANIM.donut, 400);
  const r = size / 2 - 10, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let off = 0;
  const arcs = segments.map(seg => {
    const frac = (seg.value / total) * prog;
    const arc = { ...seg, dash: `${frac * circ} ${circ - frac * circ}`, offset: -(off * circ) };
    off += seg.value / total;
    return arc;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth="13" />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="13"
            strokeDasharray={a.dash} strokeDashoffset={a.offset}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        ))}
        <text x={cx} y={cy + 3} textAnchor="middle" fill={C.text} fontSize="19" fontWeight="800" fontFamily={FONT}>{Math.round(prog * 100)}%</text>
        <text x={cx} y={cy + 19} textAnchor="middle" fill={C.muted} fontSize="11.5" fontWeight="600" fontFamily={FONT}>{title}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 150 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: C.sub, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
            <span style={{ color: ink(s.color), fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{s.value}{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBar({ label, value, color, delay = 0 }) {
  const prog = useAnimProg(ANIM.hbar, delay);
  const w = prog * value;
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 600, minWidth: 0 }}>{label}</span>
        <span style={{ fontSize: 13.5, color: ink(color), fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(w)}%</span>
      </div>
      <div style={{ height: 10, background: `${color}1c`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 6, boxShadow: `0 2px 6px ${color}40` }} />
      </div>
    </div>
  );
}

// ── Time Filter Component ──
function TimeFilter({ onFilterChange, activeFilter }) {
  const filters = [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
    { id: "custom", label: "Custom" },
  ];
  const dateInput = {
    padding: "6px 8px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.accentBorder}`,
    fontFamily: FONT, background: C.panel, color: C.text, width: 140,
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 12px", background: C.panel, borderRadius: 12, border: `1px solid ${C.panelBorder}`, flexWrap: "wrap", boxShadow: C.shadow }}>
      <span style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginRight: 2 }}>📊 Trend:</span>
      {filters.map((filter) => {
        const on = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            className="ddx-chip"
            onClick={() => onFilterChange(filter.id)}
            aria-pressed={on}
            style={{
              padding: "6px 15px", borderRadius: 9,
              border: on ? `1.5px solid ${C.blue}` : `1px solid ${C.accentBorder}`,
              background: on ? `linear-gradient(135deg, ${C.blue}, ${C.cyan})` : "#fff",
              color: on ? "#fff" : C.sub, fontSize: 13, fontWeight: on ? 700 : 600,
              cursor: "pointer", fontFamily: FONT, transition: "all 0.2s ease",
              boxShadow: on ? `0 4px 12px ${C.blue}40` : "none",
            }}
          >
            {filter.label}
          </button>
        );
      })}
      {activeFilter === "custom" && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="date" aria-label="From date" style={dateInput} defaultValue={new Date().toISOString().split('T')[0]} />
          <span style={{ fontSize: 13, color: C.muted }}>to</span>
          <input type="date" aria-label="To date" style={dateInput} defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
      )}
    </div>
  );
}

// ── Charts (drawn at their real width, so labels keep their size) ──
// series: [{ label, color, data, area }] · xLabels: [[index, text]]
function LineChart({ series, yMin, yMax, yTicks, xLabels, height = 190, yFormat = (v) => v, refLine, nowIdx, delay = 0, duration = ANIM.sparkline, legend = true }) {
  const prog = useAnimProg(duration, delay);
  const [ref, W] = useWidth();
  const uid = useUid("lc");
  const padL = 46, padR = 16, padT = 16, padB = 30;
  const gW = Math.max(40, W - padL - padR), gH = height - padT - padB;
  const n = series[0].data.length;
  const toX = (i) => padL + (i / (n - 1)) * gW;
  const toY = (v) => padT + gH - ((v - yMin) / (yMax - yMin)) * gH;
  return (
    <div>
      {legend && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginBottom: 8 }}>
          {series.map((s) => (
            <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.sub, fontWeight: 700 }}>
              <span style={{ width: 18, height: 4, borderRadius: 2, background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      )}
      <div ref={ref} style={{ width: "100%" }}>
        <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ display: "block" }}>
          <defs>
            <clipPath id={`${uid}c`}><rect x={padL - 2} y={0} width={(gW + 4) * prog} height={height} /></clipPath>
            {series.map((s, i) => (
              <linearGradient key={i} id={`${uid}g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.24" /><stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>
          {yTicks.map(v => (
            <g key={v}>
              <line x1={padL} y1={toY(v)} x2={padL + gW} y2={toY(v)} stroke="#e4eaf5" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padL - 8} y={toY(v) + 4} textAnchor="end" fill={C.muted} fontSize="11.5" fontWeight="600" fontFamily={FONT}>{yFormat(v)}</text>
            </g>
          ))}
          <line x1={padL} y1={padT + gH} x2={padL + gW} y2={padT + gH} stroke={C.accentBorder} strokeWidth="1" />
          {refLine && (
            <g>
              <line x1={padL} y1={toY(refLine.value)} x2={padL + gW} y2={toY(refLine.value)} stroke={refLine.color} strokeWidth="1.6" strokeDasharray="7 5" />
              <text x={padL + gW - 4} y={toY(refLine.value) - 6} textAnchor="end" fill={ink(refLine.color)} fontSize="11.5" fontWeight="700" fontFamily={FONT}>{refLine.label}</text>
            </g>
          )}
          {nowIdx != null && (
            <g>
              <line x1={toX(nowIdx)} y1={padT} x2={toX(nowIdx)} y2={padT + gH} stroke={C.muted} strokeWidth="1.2" strokeDasharray="4 3" />
              <text x={toX(nowIdx) + 6} y={padT + 11} fill={C.sub} fontSize="11.5" fontWeight="700" fontFamily={FONT}>now {Math.round(series[0].data[nowIdx])}%</text>
            </g>
          )}
          {series.map((s, i) => {
            const lp = s.data.map((v, j) => `${j ? "L" : "M"} ${toX(j)} ${toY(v)}`).join(" ");
            return (
              <g key={i} clipPath={`url(#${uid}c)`}>
                {s.area && <path d={`${lp} L ${toX(n - 1)} ${padT + gH} L ${padL} ${padT + gH} Z`} fill={`url(#${uid}g${i})`} />}
                <path d={lp} fill="none" stroke={s.color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
          {series.map((s, i) => (
            <circle key={i} cx={toX(n - 1)} cy={toY(s.data[n - 1])} r="4.2" fill={s.color} stroke="#fff" strokeWidth="2" style={{ opacity: prog > 0.95 ? 1 : 0, transition: "opacity 0.3s" }} />
          ))}
          {xLabels.map(([i, l]) => {
            const last = i === n - 1;
            return <text key={i} x={last ? toX(i) + 6 : toX(i)} y={height - 9} textAnchor={last ? "end" : "middle"} fill={C.muted} fontSize="11.5" fontWeight="600" fontFamily={FONT}>{l}</text>;
          })}
        </svg>
      </div>
    </div>
  );
}

// IT load through the day, 6am → 10pm: the IT load calculated from the 5D
// View, shaped by a typical day. A datacentre's load is nearly flat — it
// does not double between morning and night.
const HOURLY_LOAD_SHAPE = [0.95, 0.96, 0.97, 0.99, 1.01, 1.02, 1.03, 1.04, 1.05, 1.05, 1.04, 1.03, 1.02, 1.01, 1.0, 0.98, 0.97];
const HOUR_LABELS = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm"];
const TWO_HOURLY = ["6am", "8am", "10am", "12pm", "2pm", "4pm"].map((l, i) => [i * 2, l]);

function PowerChart() {
  const data = HOURLY_LOAD_SHAPE.map((f) => Math.round(DCIM.itKw * f * 10) / 10);
  const limit = DCIM.itBudgetKw;                 // Server + Network room power budgets (5D View)
  return (
    <LineChart
      series={[{ label: "IT load · kW", color: C.blue, data, area: true }]}
      yMin={100} yMax={240} yTicks={[120, 160, 200, 240]}
      xLabels={[0, 4, 8, 12, 16].map((i) => [i, HOUR_LABELS[i]])}
      refLine={{ value: limit, label: `${limit} kW IT budget`, color: C.yellow }}
      height={210} duration={ANIM.powerChart}
    />
  );
}

// Server Room heat map exactly as the 5D View's Thermal Monitoring computes it
// (no failures): bands north → south (cold aisles cool, hot aisles red),
// slices west → east. Bands: Cool < 21 °C · Low < 24 · Med < 27 · High < 35 · Hot.
const heatLevel = (t) => (t < 21 ? 3 : t < 24 ? 5 : t < 27 ? 7 : t < 35 ? 8 : 9);

function ThermalMap() {
  const heat = SERVER_ROOM_HEAT_C;
  const [frame, setFrame] = useState(0);
  useEffect(() => { const id = setInterval(() => setFrame(f => f + 1), ANIM.thermalInterval); return () => clearInterval(id); }, []);
  const getCol = v => v <= 4 ? C.green : v <= 6 ? "#80cc44" : v <= 7 ? C.yellow : v <= 8 ? C.orange : C.red;
  const getBg = v => v <= 4 ? "#c9f2e1" : v <= 6 ? "#e2f6c9" : v <= 7 ? "#ffecb8" : v <= 8 ? "#ffd7bd" : "#fdc6cf";
  return (
    <div style={{ padding: "14px 16px 16px" }}>
      <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span className="blink" style={{ fontSize: 13.5, fontWeight: 800, color: C.red }}>⚠ Hotspots: hot aisles</span>
        <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>avg {ROOM_TEMP_C.server.toFixed(1)}°C · 5D View</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3 }}>
        {heat.map((row, r) => row.map((t, c) => {
          const noise = Math.sin(frame * 0.4 + r * 0.7 + c * 0.3) * 0.3;
          const cv = heatLevel(t + noise);
          return <div key={`${r}-${c}`} title={`${t.toFixed(1)}°C`} style={{ height: 13, background: getBg(cv), border: `1px solid ${getCol(cv)}88`, borderRadius: 3, transition: `background ${ANIM.thermalInterval * 0.8}ms ease` }} />;
        }))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {[C.green, "#80cc44", C.yellow, C.orange, C.red].map((col, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: col, borderRadius: 3 }} />
            <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{["Cool", "Low", "Med", "High", "Hot"][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Twelve monthly points (six up to now, six forecast). `nowIdx` marks today.
function CapForecast({ color, label, delay = 0, data = [10, 18, 22, 30, 38, 45, 52, 60, 68, 75, 82, 90], nowIdx = null }) {
  return (
    <div>
      <LineChart
        series={[{ label: "Allocated", color, data, area: true }]}
        yMin={0} yMax={100} yTicks={[25, 50, 75, 100]} yFormat={(v) => `${v}%`}
        xLabels={[[0, "6 mo ago"], [nowIdx ?? 5, "Today"], [data.length - 1, "+6 mo"]]}
        nowIdx={nowIdx} height={170} delay={delay} duration={ANIM.capForecast} legend={false}
      />
      <div style={{ fontSize: 12.5, color: ink(C.yellow), fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>● {label}</div>
    </div>
  );
}

// Room temperatures through the day around each room's 5D View Thermal
// Monitoring average (the swing below averages out to exactly that value).
const DAY_SWING_C = [-0.5, -0.4, -0.2, 0, 0.2, 0.4, 0.5, 0.4, 0.2, 0, -0.2, -0.4];

function TempChart() {
  const zones = [
    { label: "Server Rm", color: C.blue, base: ROOM_TEMP_C.server },
    { label: "Power Rm", color: C.orange, base: ROOM_TEMP_C.power },
    { label: "Network Rm", color: C.green, base: ROOM_TEMP_C.network },
  ].map(z => ({ ...z, data: DAY_SWING_C.map(d => Math.round((z.base + d) * 10) / 10) }));
  return (
    <LineChart
      series={zones.map((z) => ({ label: `${z.label} ${z.base.toFixed(1)}°`, color: z.color, data: z.data }))}
      yMin={20} yMax={30} yTicks={[22, 24, 26, 28]} yFormat={(v) => `${v}°`}
      xLabels={TWO_HOURLY} height={180} delay={300}
    />
  );
}

function NetworkChart() {
  const inD = [120, 145, 130, 160, 175, 190, 185, 200, 210, 195, 220, 215];
  const outD = [80, 95, 88, 110, 125, 130, 120, 140, 150, 138, 155, 145];
  return (
    <LineChart
      series={[{ label: "↑ In", color: C.green, data: inD, area: true }, { label: "↓ Out", color: C.purple, data: outD, area: true }]}
      yMin={60} yMax={260} yTicks={[100, 150, 200, 250]}
      xLabels={TWO_HOURLY} height={180} delay={600}
    />
  );
}

// Energy per day (MWh), split the same way as the PUE: IT, cooling, and UPS
// losses + lighting. Weekends run a little lighter.
const WEEK_SHAPE = [["Mon", 1.0], ["Tue", 1.01], ["Wed", 1.02], ["Thu", 1.0], ["Fri", 1.03], ["Sat", 0.95], ["Sun", 0.93]];

function StackedBar() {
  const prog = useAnimProg(ANIM.hbar, 500);
  const [ref, W] = useWidth();
  const mwh = (kw, f) => (kw * 24 * f) / 1000;
  const data = WEEK_SHAPE.map(([l, f]) => ({
    l, a: mwh(DCIM.itKw, f), b: mwh(DCIM.coolingInputKw, f), c: mwh(DCIM.upsLossKw + DCIM.lightingKw, f),
  }));
  const H = 200, padL = 10, padR = 10, padT = 22, padB = 28;
  const gW = Math.max(60, W - padL - padR), gH = H - padT - padB;
  const maxV = Math.ceil(Math.max(...data.map(d => d.a + d.b + d.c)) * 1.15);
  const slot = gW / data.length;
  const bW = Math.min(46, slot - 14);
  const cols = [C.blue, C.cyan, C.yellow];
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginBottom: 8 }}>
        {[["IT Load", C.blue], ["Cooling", C.cyan], ["UPS + Lighting", C.yellow]].map(([l, c]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.sub, fontWeight: 700 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: c }} />{l}
          </span>
        ))}
      </div>
      <div ref={ref} style={{ width: "100%" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <line x1={padL} y1={padT + gH} x2={padL + gW} y2={padT + gH} stroke={C.accentBorder} strokeWidth="1" />
          {data.map((d, i) => {
            const x = padL + i * slot + (slot - bW) / 2;
            let yOff = padT + gH;
            const total = d.a + d.b + d.c;
            return (
              <g key={i}>
                {[[d.a, 0], [d.b, 1], [d.c, 2]].map(([val, ci]) => {
                  const h = (val / maxV) * gH * prog; yOff -= h;
                  return <rect key={ci} x={x} y={yOff} width={bW} height={h} fill={cols[ci]} rx="3" opacity="0.9" />;
                })}
                <text x={x + bW / 2} y={padT + gH - (total / maxV) * gH * prog - 6} textAnchor="middle" fill={C.sub} fontSize="11.5" fontWeight="700" fontFamily={FONT} style={{ opacity: prog > 0.9 ? 1 : 0 }}>{total.toFixed(1)}</text>
                <text x={x + bW / 2} y={H - 9} textAnchor="middle" fill={C.muted} fontSize="12" fontWeight="600" fontFamily={FONT}>{d.l}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// One real rack from the 5D View, U by U, in the STORAGE view's colours
// (red occupied · blue reserved · green free). 21 cells of 2U each, read
// top-down column by column: U42 at the top-left, U1 at the bottom-right.
const U_CELL = {
  u: { c: "#ef4444", bg: "#fdd5da" },
  r: { c: "#3b82f6", bg: "#d6e4ff" },
  f: { c: C.green, bg: "#c9f2e1" },
};

function MiniRack({ alias }) {
  const map = RACK_U_MAP[alias] || "f".repeat(RACK_U);
  const rack = RACKS.find(r => r.alias === alias);
  const cells = Array.from({ length: RACK_U / 2 }, (_, i) => {
    const two = map.slice(i * 2, i * 2 + 2);
    return two.includes("u") ? "u" : two.includes("r") ? "r" : "f";
  });
  return (
    <div title={`${alias}: ${rack?.usedU}U occupied · ${rack?.reservedU}U reserved · ${rack?.freeU}U free (U42 → U1)`}
      style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 12, padding: "12px 12px 10px", boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: MONO }}>{alias}</span>
        <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>42U</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map(col => (
          <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {[...Array(7)].map((_, row) => { const st = U_CELL[cells[col * 7 + row]]; return <div key={row} style={{ height: 11, background: st.bg, border: `1px solid ${st.c}77`, borderRadius: 2 }} />; })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginTop: 8, fontWeight: 600 }}>
        <span style={{ color: "#dc2626", fontWeight: 800 }}>{rack?.usedU}U</span> used · <span style={{ color: ink(C.green), fontWeight: 800 }}>{rack?.freeU}U</span> free
      </div>
    </div>
  );
}

// ── Shared tab furniture ──
function FilterBar({ title, subtitle, timeFilter, setTimeFilter }) {
  return (
    <div style={{ padding: "16px 22px", background: "#ffffff", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>}
      </div>
      <TimeFilter activeFilter={timeFilter} onFilterChange={setTimeFilter} />
    </div>
  );
}

function KpiCard({ kpi, index, selected, onClick, children }) {
  const c = kpi.color;
  return (
    <div
      className={`fade-in${onClick ? " ddx-click" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? !!selected : undefined}
      style={{
        background: `linear-gradient(145deg, ${c}1f 0%, #ffffff 58%)`,
        border: `1.5px solid ${selected ? c : `${c}40`}`, borderRadius: 14, padding: "14px 16px 12px",
        boxShadow: selected ? `0 10px 24px ${c}38` : C.shadow, animationDelay: `${index * ANIM.kpiStagger}ms`, opacity: 0,
        position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default", minWidth: 0,
        transform: selected ? "translateY(-2px)" : "none", transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        display: "flex", flexDirection: "column",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${c}, ${c}55)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconTile icon={kpi.icon} color={c} size={36} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.sub, lineHeight: 1.25 }}>{kpi.label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: ink(c), lineHeight: 1.05, fontFamily: MONO, marginTop: 10, whiteSpace: "nowrap", ...(kpi.blink ? { animation: "pulse 2s infinite" } : {}) }}>
        <Counter end={kpi.end} decimals={kpi.dec || 0} suffix={kpi.unit} />
      </div>
      <div style={{ marginTop: 6 }}><SparkFill data={kpi.sparkData} color={c} height={30} delay={index * ANIM.kpiStagger} /></div>
      {children}
    </div>
  );
}

function KpiStrip({ children }) {
  return <div className="ddx-kpis" style={{ padding: "16px 22px", background: "#ffffff", borderBottom: `1px solid ${C.panelBorder}` }}>{children}</div>;
}

function AIBanner({ label, insights, idx, color, color2, bg, glow }) {
  return (
    <div className={glow ? "ddx-glow" : undefined} style={{ background: bg, border: `${glow ? 2 : 1}px solid ${color}44`, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", boxShadow: C.shadow, flexWrap: "wrap" }}>
      <div style={{ background: `linear-gradient(135deg, ${color}, ${color2})`, borderRadius: 10, padding: "8px 14px", fontSize: 13.5, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", flexShrink: 0, boxShadow: `0 4px 12px ${color}44` }}>{label}</div>
      <div style={{ flex: 1, minWidth: 240 }} aria-live="polite">
        {insights.map((ins, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "3px 0", opacity: i === idx ? 1 : 0.45, transition: "opacity 0.8s" }}>
            <span style={{ color, fontSize: 15, fontWeight: 800, lineHeight: "21px" }}>•</span>
            <span style={{ fontSize: 14, lineHeight: "21px", color: i === idx ? C.text : C.sub, fontWeight: i === idx ? 700 : 500 }}>{ins}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// items: [{ text, title?, strong?, color? }]
function AlertBox({ title, items, glow }) {
  return (
    <div className={glow ? "ddx-glow" : undefined} style={{ background: "linear-gradient(135deg, #fff1f4, #fffafb)", border: `1px solid ${C.red}40`, borderLeft: `5px solid ${C.red}`, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pulse-dot" aria-hidden="true">🔴</span> {title}
      </div>
      {items.map((a, i) => (
        <div key={i} title={a.title} style={{ fontSize: 13, color: a.color || C.text, padding: "8px 0", borderBottom: i < items.length - 1 ? `1px solid ${C.red}1f` : "none", display: "flex", gap: 8, alignItems: "flex-start", fontWeight: a.strong ? 700 : 500, lineHeight: 1.45 }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 10.5, lineHeight: "19px" }}>▶</span><span style={{ minWidth: 0 }}>{a.text}</span>
        </div>
      ))}
    </div>
  );
}

// bars: [[label, value, color]] — delays as the original panels used them.
function MetricPanel({ icon, title, accent, bars, baseDelay = 200, step = 100 }) {
  return (
    <Panel>
      <PHead icon={icon} accent={accent}>{title}</PHead>
      <div style={{ padding: "16px 18px 5px" }}>
        {bars.map(([label, value, color], i) => <HBar key={label} label={label} value={value} color={color} delay={baseDelay + i * step} />)}
      </div>
    </Panel>
  );
}

function DonutPanel({ icon, title, accent, left, right }) {
  return (
    <Panel>
      <PHead icon={icon} accent={accent}>{title}</PHead>
      <div style={{ padding: "16px 12px", display: "flex", justifyContent: "space-around", gap: 10 }}>
        <Donut {...left} /><Donut {...right} />
      </div>
    </Panel>
  );
}

function GaugePanel({ icon, title, accent, children }) {
  return (
    <Panel>
      <PHead icon={icon} accent={accent}>{title}</PHead>
      <div style={{ padding: "12px 6px 8px", display: "flex", justifyContent: "space-around", flexWrap: "wrap" }}>{children}</div>
    </Panel>
  );
}

// Schematic floor maps: zones laid out on a VW × VH plan, drawn as HTML so the
// labels stay crisp at any width.
function ZoneMap({ vw, vh, zones, height = 260, caption, renderZone }) {
  return (
    <div>
      <div style={{ position: "relative", height, background: "linear-gradient(135deg, #eef3fb, #f6f9fe)", borderRadius: 12, border: `1px solid ${C.panelBorder}` }}>
        {zones.map((z, i) => (
          <div key={i} style={{
            position: "absolute", left: `${(z.x / vw) * 100}%`, top: `${(z.y / vh) * 100}%`,
            width: `${(z.w / vw) * 100}%`, height: `${(z.h / vh) * 100}%`,
          }}>{renderZone(z, i)}</div>
        ))}
      </div>
      {caption && <div style={{ fontSize: 12.5, color: C.muted, textAlign: "center", marginTop: 8, fontWeight: 600 }}>{caption}</div>}
    </div>
  );
}

const Legend3 = ({ items }) => (
  <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", marginTop: 10 }}>
    {items.map(([label, color]) => (
      <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: C.sub, fontWeight: 700 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />{label}
      </span>
    ))}
  </div>
);

// Free / Reserved / Utilized split inside the DCIM KPI cards: one stacked bar
// and a legend that wraps on narrow cards.
const SplitBar = ({ items }) => (
  <div style={{ marginTop: 10 }}>
    <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: C.accent }}>
      {items.map(([label, value, c]) => <div key={label} title={`${label} ${value}%`} style={{ width: `${value}%`, background: c }} />)}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8 }}>
      {items.map(([label, value, c]) => (
        <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: C.sub, fontWeight: 600, whiteSpace: "nowrap" }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{label}
          <b style={{ color: ink(c), fontWeight: 800 }}>{value}%</b>
        </span>
      ))}
    </div>
  </div>
);
// Two-column figures (Change Request card).
const SplitRow = ({ items, color }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${color}55` }}>
    {items.map(([label, value, c]) => (
      <div key={label} style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: ink(c), fontFamily: MONO }}>{value}</div>
      </div>
    ))}
  </div>
);
const KpiFooter = ({ children }) => <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontWeight: 600, lineHeight: 1.4 }}>{children}</div>;

// ══════════════════════════════════════════
//  DCIM DASHBOARD
//  KPIs: Power Capacity · Space & Cooling (Free/Utilized) · Average PUE ·
//        Workflow & Change Management · Asset Inventory (by room)
//  All numbers come from dcimDashboardData.js (calculated from the 5D View).
// ══════════════════════════════════════════
function DCIMDashboard() {
  const [aiIdx, setAiIdx] = useState(0);
  const [sidebarIdx, setSidebarIdx] = useState(0);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [timeFilter, setTimeFilter] = useState("day");

  useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

  // ── KPI set — every value calculated from the 5D View (dcimDashboardData.js);
  //    Change Request shows "Total Raised" and "Closed" ──
  const kpis = [
    { icon: "⚡", label: "Power Capacity", end: SHOW.powerPct, unit: "%", color: C.yellow, sparkData: trail(SHOW.powerPct, 0.6), dec: 0, footer: `${Math.round(DCIM.itKw)} kW of ${DCIM.itBudgetKw} kW IT budget`, showFreeUtilized: false },
    {
      icon: "📐",
      label: "Space Capacity",
      end: DCIM.usedPct,
      unit: "%",
      color: C.blue,
      sparkData: trail(DCIM.usedPct, 0.5),
      dec: 0,
      footer: `${DCIM.usedU} of ${DCIM.totalU.toLocaleString()} U used · ${DCIM.reservedU} U reserved`,
      showFreeUtilized: true,
      // FREE + RESERVED + UTILIZED = 100, as in the 5D View STORAGE view
      split: [["Free", DCIM.freePct, C.green], ["Reserved", DCIM.reservedPct, "#3b82f6"], ["Utilized", DCIM.usedPct, C.blue]],
    },
    {
      icon: "❄️",
      label: "Cooling Capacity",
      end: SHOW.coolingPct,
      unit: "%",
      color: C.cyan,
      sparkData: trail(SHOW.coolingPct, 0.5),
      dec: 0,
      footer: `${Math.round(DCIM.serverRoomItKw)} kW of ${DCIM.coolingCapKw} kW (${DCIM.pacCount} × PAC)`,
      showFreeUtilized: true,
      split: [["Free", SHOW.coolingFreePct, C.green], ["Utilized", SHOW.coolingPct, C.cyan]],
    },
    {
      icon: "📊",
      label: "Average PUE",
      end: SHOW.pue,
      unit: "",
      dec: 2,
      color: C.orange,
      sparkData: trail(SHOW.pue, -0.005, 7, 3),
      footer: `Target ≤ ${SHOW.pueTarget.toFixed(2)}`,
      showFreeUtilized: false
    },
    {
      icon: "📋",
      label: "Change Request",
      end: CHANGES.open,
      unit: " open",
      color: C.purple,
      sparkData: trail(CHANGES.open, -0.5),
      dec: 0,
      footer: `${CHANGES.raised} total raised this month`,
      showFreeUtilized: false,
      showTotalRaised: true,
      totalRaised: CHANGES.raised,
      closedRequests: CHANGES.completed,
      changeLabel: "Change Requests"
    },
    { icon: "🗄", label: "Asset Inventory", end: DCIM.totalAssets, unit: "", color: C.green, sparkData: trail(DCIM.totalAssets, 4), dec: 0, footer: `${DCIM.floorDevices} floor + ${DCIM.inRackItems} in-rack · ${FACILITY.shortName}`, showFreeUtilized: false },
  ];

  const maintenance = MAINTENANCE;
  const insights = INSIGHTS;
  // Asset donut: the 664 assets by kind; power donut: the same split as the PUE.
  const assetDonut = [
    { label: "Servers", value: DCIM.servers, color: C.blue },
    { label: "Network", value: DCIM.networkDevices, color: C.cyan },
    { label: "Cabling", value: DCIM.passive, color: C.green },
    { label: "Racks", value: DCIM.racksTotal, color: C.purple },
    { label: "Pwr+Cool", value: DCIM.powerDevices + DCIM.coolingDevices, color: C.yellow },
  ];
  const powerDonut = [
    { label: "IT Load", value: DCIM.powerSplit[0], color: C.blue },
    { label: "Cooling", value: DCIM.powerSplit[1], color: C.cyan },
    { label: "UPS Loss", value: DCIM.powerSplit[2], color: C.orange },
    { label: "Lighting", value: DCIM.powerSplit[3], color: C.yellow },
  ];

  // ── Workflow & Change Management data (open requests; the pipeline is counted from them) ──
  const statusColor = { "Approved": C.green, "Pending Approval": C.yellow, "In Progress": C.red, "Submitted": C.blue };
  const changeRequests = OPEN_CHANGES.map((cr) => ({ ...cr, color: statusColor[cr.status] || C.muted }));
  const stageColor = { "Submitted": C.blue, "In Review": C.yellow, "Approved": C.green, "In Progress": C.orange, "Completed": C.cyan };
  const workflowStages = CHANGES.pipeline.map((s) => ({ ...s, color: stageColor[s.label] }));

  // ── Asset Inventory by room — the 5D View floor, room by room ──
  const roomColor = { server: C.blue, network: C.purple, power: C.orange, battery: C.green, outdoor: C.cyan };
  const dcAssets = DCIM.roomTable.map((r) => ({
    ...r,
    color: roomColor[r.id],
    util: r.budgetKw ? Math.round((r.loadKw / r.budgetKw) * 100) : null,
  }));
  const assetTotals = ["racks", "servers", "network", "powerCooling", "total"].reduce(
    (t, k) => ({ ...t, [k]: dcAssets.reduce((s, r) => s + r[k], 0) }), {});
  const liveAlerts = ACTIVE_ALARMS.slice(0, 3);
  const ROOM_COLS = "minmax(100px, 1.2fr) repeat(5, minmax(50px, 0.55fr)) minmax(132px, 1.4fr)";
  const numCell = { fontSize: 13.5, color: C.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 };
  const sideItems = [`Site: ${FACILITY.shortName}`, `Room: All Rooms (${DCIM.rooms})`, `Rack: All Racks (${DCIM.racksTotal})`, "Time: Last 7 Days"];

  return (
    <div>
      <FilterBar
        title={`📊 DCIM — Real-Time KPI Dashboard — Showing ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View`}
        subtitle={`Calculated from 5D View · ${FACILITY.name} · ${DCIM.rooms} rooms · ${DCIM.floorDevices} devices · ${DCIM.racksTotal} racks · ${DCIM.cablesTotal} cables`}
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
      />

      {/* KPI ROW */}
      <KpiStrip>
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} kpi={kpi} index={i} selected={selectedKPI === kpi.label} onClick={() => setSelectedKPI(selectedKPI === kpi.label ? null : kpi.label)}>
            {/* Free / Utilized (and Reserved) for the Space and Cooling cards */}
            {kpi.showFreeUtilized && <SplitBar items={kpi.split} />}
            {/* Total raised and closed for the Change Request card */}
            {kpi.showTotalRaised && <SplitRow color={kpi.color} items={[["Total raised", kpi.totalRaised, kpi.color], ["Closed", kpi.closedRequests, C.green]]} />}
            {kpi.footer && <KpiFooter>{kpi.footer}</KpiFooter>}
          </KpiCard>
        ))}
      </KpiStrip>

      {/* BODY — the DCIM tab scrolls as one page (the Health Index sits above it). */}
      <div className="ddx-body" style={{ gridTemplateColumns: "240px minmax(0, 1fr) 310px", padding: "18px 22px" }}>
        {/* LEFT */}
        <div className="ddx-col">
          <Panel>
            <PHead icon="🧭" accent={C.blue}>Scope</PHead>
            {sideItems.map((item, i) => (
              <div key={i} role="button" tabIndex={0} className="ddx-click"
                onClick={() => setSidebarIdx(i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSidebarIdx(i); } }}
                style={{ padding: "12px 16px", borderBottom: i < sideItems.length - 1 ? `1px solid ${C.accent}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer", background: sidebarIdx === i ? `${C.blue}10` : "transparent", borderLeft: sidebarIdx === i ? `4px solid ${C.blue}` : "4px solid transparent", transition: "all 0.3s" }}>
                <span style={{ fontSize: 13.5, color: sidebarIdx === i ? C.blue : C.text, fontWeight: sidebarIdx === i ? 700 : 500 }}>{item}</span>
                <span style={{ color: C.muted, fontSize: 12 }}>▾</span>
              </div>
            ))}
          </Panel>
          {Object.keys(RACK_U_MAP).map(alias => <MiniRack key={alias} alias={alias} />)}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "0 4px" }}>
            {[["Occupied", "#ef4444"], ["Reserved", "#3b82f6"], ["Free", C.green]].map(([l, c]) => (
              <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, fontWeight: 600 }}>
                <span style={{ width: 11, height: 11, borderRadius: 2, background: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div className="ddx-col">
          <AIBanner label="🤖 AI Insight »" insights={insights} idx={aiIdx} color={C.blue} color2={C.cyan} bg="linear-gradient(90deg, #eef5ff, #e8f6ff)" />

          <Panel>
            <PHead icon="⚡" accent={C.blue}>Power Usage Trends {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
            <div style={{ padding: "14px 16px 10px" }}><PowerChart /></div>
          </Panel>

          <div className="ddx-two">
            <Panel><PHead icon="🌡" accent={C.orange}>Room Temperature (°C)</PHead><div style={{ padding: "14px 16px 10px" }}><TempChart /></div></Panel>
            <Panel><PHead icon="🌐" accent={C.purple}>Network Traffic (Mbps)</PHead><div style={{ padding: "14px 16px 10px" }}><NetworkChart /></div></Panel>
          </div>

          <div className="ddx-two">
            {(() => {
              const f = forecast(DCIM.allocatedPct, ASSUMPTIONS.spaceGrowthPctPerMonth);
              return (
                <Panel>
                  <PHead icon="📈" accent={C.blue}>Space Capacity Forecast</PHead>
                  <div style={{ padding: "14px 16px 14px" }}>
                    <CapForecast color={C.blue} data={f} nowIdx={5} label={`U allocated (used + reserved): ${Math.round(f[11])}% in 6 months at +${ASSUMPTIONS.spaceGrowthPctPerMonth}%/mo`} delay={300} />
                  </div>
                </Panel>
              );
            })()}
            <Panel><PHead icon="🔥" accent={C.red}>Thermal Map · Server Room</PHead><ThermalMap /></Panel>
          </div>

          {/* ── Workflow & Change Management ── */}
          <Panel>
            <PHead icon="🔄" accent={C.purple}>Workflow &amp; Change Management</PHead>
            <div className="ddx-two" style={{ padding: "16px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.sub, marginBottom: 10 }}>Open change requests ({CHANGES.open})</div>
                {changeRequests.map((cr, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 8, background: `${cr.color}12`, border: `1px solid ${cr.color}44`, borderLeft: `4px solid ${cr.color}` }}>
                    <span style={{ fontSize: 12.5, color: ink(cr.color), fontWeight: 800, fontFamily: MONO, minWidth: 74 }}>{cr.id}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div title={cr.title} style={{ fontSize: 13.5, color: C.text, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cr.title}</div>
                      <div style={{ fontSize: 12, color: ink(cr.color), fontWeight: 700, marginTop: 2 }}>{cr.status} · {cr.stage}</div>
                    </div>
                    <span style={{ fontSize: 11.5, padding: "3px 9px", borderRadius: 999, background: cr.color, color: "#fff", fontWeight: 800, flexShrink: 0 }}>{cr.risk}</span>
                  </div>
                ))}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.sub, marginBottom: 10 }}>Workflow pipeline (30 days)</div>
                {/* share of the requests raised this month (stages add up to the total raised) */}
                {workflowStages.map((s, i) => <HBar key={i} label={`${s.label} (${s.value})`} value={Math.round((s.value / CHANGES.raised) * 100)} color={s.color} delay={200 + i * ANIM.hbarStagger} />)}
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: `linear-gradient(135deg, ${C.green}1c, #fff)`, border: `1px solid ${C.green}55`, borderRadius: 12, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: ink(C.green), fontFamily: MONO }}>{Math.round(CHANGES.onTimePct)}%</div>
                    <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>On-Time Completion</div>
                  </div>
                  <div style={{ flex: 1, background: `linear-gradient(135deg, ${C.yellow}22, #fff)`, border: `1px solid ${C.yellow}66`, borderRadius: 12, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: ink(C.yellow), fontFamily: MONO }}>{CHANGES.avgApprovalDays}d</div>
                    <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>Avg Approval Time</div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* ── Asset Inventory by Room — the 5D View floor (one data centre) ── */}
          <Panel>
            <PHead icon="🗄" accent={C.green}>Asset Inventory by Room — {FACILITY.shortName}</PHead>
            <div style={{ padding: "14px 16px", overflowX: "auto" }}>
              <div style={{ minWidth: 540 }}>
                <div style={{ display: "grid", gridTemplateColumns: ROOM_COLS, gap: 8, padding: "0 12px 8px 16px", fontSize: 12, color: C.muted, fontWeight: 800, alignItems: "end", lineHeight: 1.25 }}>
                  <span>Room</span><span>Racks</span><span>Servers</span><span>Network</span><span>Pwr + Cool</span><span>Total</span><span>IT load / power budget</span>
                </div>
                {dcAssets.map((dc, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: ROOM_COLS, gap: 8, alignItems: "center", padding: "10px 12px", borderRadius: 10, marginBottom: 7, background: `${dc.color}0d`, border: `1px solid ${dc.color}33`, borderLeft: `4px solid ${dc.color}` }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{dc.name}</span>
                    <span style={numCell}>{dc.racks.toLocaleString()}</span>
                    <span style={numCell}>{dc.servers.toLocaleString()}</span>
                    <span style={numCell}>{dc.network.toLocaleString()}</span>
                    <span style={numCell}>{dc.powerCooling.toLocaleString()}</span>
                    <span style={{ ...numCell, fontWeight: 800, color: ink(dc.color) }}>{dc.total.toLocaleString()}</span>
                    {dc.util == null ? (
                      <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Outdoor plant · no room budget</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ flex: 1, height: 9, background: `${dc.color}1f`, borderRadius: 5, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, dc.util)}%`, height: "100%", background: `linear-gradient(90deg, ${dc.color}99, ${dc.color})`, borderRadius: 5 }} />
                        </div>
                        <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{Math.round(dc.loadKw)}/{dc.budgetKw} kW</span>
                      </div>
                    )}
                  </div>
                ))}
                {/* Column totals — the TOTAL column adds up to the Asset Inventory KPI */}
                <div style={{ display: "grid", gridTemplateColumns: ROOM_COLS, gap: 8, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: C.accent, border: `1px solid ${C.accentBorder}` }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>Total</span>
                  <span style={{ ...numCell, fontWeight: 800 }}>{assetTotals.racks}</span>
                  <span style={{ ...numCell, fontWeight: 800 }}>{assetTotals.servers}</span>
                  <span style={{ ...numCell, fontWeight: 800 }}>{assetTotals.network}</span>
                  <span style={{ ...numCell, fontWeight: 800 }}>{assetTotals.powerCooling}</span>
                  <span style={{ ...numCell, fontWeight: 800, color: ink(C.green) }}>{assetTotals.total}</span>
                  <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700 }}>IT {Math.round(DCIM.itKw)} / {DCIM.itBudgetKw} kW · {DCIM.facilityBudgetKw} kW all rooms</span>
                </div>
              </div>
            </div>
          </Panel>

          <div className="ddx-two">
            <Panel><PHead icon="📊" accent={C.blue}>Weekly Power Breakdown (MWh / day)</PHead><div style={{ padding: "14px 16px 10px" }}><StackedBar /></div></Panel>
            <Panel>
              <PHead icon="📈" accent={C.cyan}>Cooling Capacity Forecast</PHead>
              <div style={{ padding: "14px 16px 6px" }}>
                <CapForecast color={C.cyan} data={forecast(DCIM.coolingPct, ASSUMPTIONS.coolingGrowthPctPerMonth)} nowIdx={5}
                  label={`N+1 lost above ${Math.round((DCIM.nPlus1LimitKw / DCIM.coolingCapKw) * 100)}% (${DCIM.nPlus1LimitKw} kW) at +${ASSUMPTIONS.coolingGrowthPctPerMonth}%/mo`} delay={400} />
                <div style={{ marginTop: 14 }}>
                  <HBar label="UPS Load (2N basis)" value={Math.round(DCIM.upsLoadPct)} color={C.yellow} delay={400} />
                  <HBar label="Chiller Load (CH-01)" value={Math.round(DCIM.chillerLoadPct)} color={C.green} delay={400 + ANIM.hbarStagger} />
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* RIGHT */}
        <div className="ddx-col ddx-right">
          <Panel>
            <PHead icon="🔧" accent={C.orange}>Predictive Maintenance</PHead>
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {maintenance.map((item, i) => {
                const col = item.level === "critical" ? C.red : item.level === "warn" ? C.yellow : C.green;
                return (
                  <div key={i} style={{ padding: "11px 12px", borderRadius: 12, background: `${col}12`, border: `1px solid ${col}44`, borderLeft: `4px solid ${col}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, animation: item.level !== "ok" ? "pulse 2s infinite" : "none" }} aria-hidden="true">{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{item.name}</div>
                      <div style={{ fontSize: 12.5, color: ink(col), fontWeight: 700, marginTop: 2 }}>{item.issue}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
          <DonutPanel icon="🍩" title="Asset & Power Distribution" accent={C.blue}
            left={{ segments: assetDonut, title: "Assets" }} right={{ segments: powerDonut, title: "Power", unit: "%" }} />
          <GaugePanel icon="⚡" title="Energy Efficiency" accent={C.green}>
            <Gauge value={SHOW.pue} max={3} decimals={2} color={C.orange} label="Average PUE" sub="Power Usage" />
            <Gauge value={Math.round(DCIM.co2TonPerDay * 10) / 10} max={10} color={C.green} label="Tons CO₂ per day" sub={`${DCIM.dailyMwh.toFixed(1)} MWh / day`} />
          </GaugePanel>
          <MetricPanel icon="📋" title="System Health" accent={C.cyan} baseDelay={200} step={ANIM.hbarStagger} bars={[
            ["Network Uptime", 100, C.green],
            ["Storage Capacity", DISK_UTIL_PCT, C.blue],
            ["CPU Load Avg", CPU_LOAD_AVG_PCT, C.cyan],
            ["Memory Utilization", MEMORY_UTIL_PCT, C.yellow],
            ["GPU Utilization", GPU_UTIL_PCT, C.purple],
          ]} />
          <AlertBox title="Live Alerts" items={liveAlerts.map((a) => ({
            title: `${a.severity.toUpperCase()} · ${a.time}`,
            text: `${a.device} ${a.title.toLowerCase()}: ${a.detail.split(" · ")[0]}`,
          }))} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  BMS DASHBOARD — Building Management System
// ══════════════════════════════════════════
const zoneTone = (status) => (status === "ok" || status === "normal" ? C.green : status === "warn" || status === "warning" ? C.yellow : C.red);

function FloorPlanHVAC() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1500); return () => clearInterval(id); }, []);
  const zones = [
    { x: 10, y: 10, w: 80, h: 60, label: "Server Hall", temp: 22.1, status: "ok" },
    { x: 100, y: 10, w: 70, h: 60, label: "UPS Room", temp: 24.5, status: "warn" },
    { x: 180, y: 10, w: 60, h: 60, label: "Network", temp: 21.8, status: "ok" },
    { x: 10, y: 80, w: 90, h: 55, label: "Storage", temp: 23.2, status: "ok" },
    { x: 110, y: 80, w: 130, h: 55, label: "Operations", temp: 26.1, status: "hot" },
  ];
  return (
    <ZoneMap vw={250} vh={145} zones={zones} height={250} caption="Floor Plan — Zone Temperature View"
      renderZone={(z, i) => {
        const col = zoneTone(z.status);
        const pulse = Math.sin(tick * 0.5 + i * 1.2) > 0;
        return (
          <div style={{
            height: "100%", borderRadius: 12, border: `2px solid ${col}`, background: `linear-gradient(135deg, ${col}26, ${col}0d)`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, textAlign: "center", padding: 6,
            opacity: pulse && z.status !== "ok" ? 0.72 : 1, transition: "opacity 0.6s ease",
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{z.label}</span>
            <span style={{ fontSize: 19, fontWeight: 800, color: ink(col), fontFamily: MONO }}>{z.temp}°C</span>
          </div>
        );
      }} />
  );
}

function ListCard({ color, title, status, statusBlink, lines, progress }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${color}14, #ffffff)`, border: `1px solid ${color}44`, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: C.text, fontFamily: MONO }}>{title}</span>
        <StatusPill color={color} blink={statusBlink}>{status}</StatusPill>
      </div>
      {lines.map((l, i) => <div key={i} style={{ fontSize: i ? 12 : 13, color: i ? C.muted : C.sub, marginTop: i ? 2 : 6, fontWeight: 600 }}>{l}</div>)}
      {progress != null && (
        <div style={{ height: 7, background: `${color}22`, borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${color}aa, ${color})`, borderRadius: 4 }} />
        </div>
      )}
    </div>
  );
}

function BMSDashboard() {
  const [aiIdx, setAiIdx] = useState(0);
  const [timeFilter, setTimeFilter] = useState("day");

  useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

  const kpis = [
    { icon: "🌡", label: "Avg Temp", end: 22.8, unit: "°C", dec: 1, color: C.cyan, sparkData: [22.1, 22.3, 22.8, 22.5, 22.9, 22.6, 22.8] },
    { icon: "💧", label: "Humidity", end: 47, unit: "%", color: C.blue, sparkData: [44, 45, 46, 47, 46, 47, 47] },
    { icon: "⚡", label: "Energy kWh", end: 1284, unit: "", color: C.yellow, sparkData: [1100, 1150, 1200, 1180, 1250, 1270, 1284] },
    { icon: "🌬", label: "Air Quality", end: 92, unit: "%", color: C.green, sparkData: [88, 89, 90, 91, 91, 92, 92] },
    { icon: "💡", label: "Lighting Load", end: 38, unit: " kW", color: C.orange, sparkData: [30, 32, 34, 36, 37, 38, 38] },
    { icon: "🔧", label: "HVAC Units", end: 12, unit: "", color: C.purple, sparkData: [12, 12, 12, 11, 12, 12, 12] },
  ];

  const hvacUnits = [
    { id: "AHU-01", zone: "Server Hall", status: "Running", temp: 18.2, load: 78, color: C.green },
    { id: "AHU-02", zone: "UPS Room", status: "Warning", temp: 21.5, load: 91, color: C.yellow },
    { id: "AHU-03", zone: "Network", status: "Running", temp: 17.8, load: 65, color: C.green },
    { id: "CRAC-01", zone: "Storage", status: "Running", temp: 16.5, load: 72, color: C.green },
    { id: "CRAC-02", zone: "Operations", status: "Fault", temp: 24.1, load: 98, color: C.red },
  ];

  const insights = [
    "AHU-02 running at 91% — schedule maintenance soon.",
    "Operations zone 2°C above optimal — CRAC-02 fault detected.",
    "Humidity optimal across all zones. Energy saving mode active.",
  ];

  const tempData = [
    [22.1, 22.3, 22.5, 22.8, 23.0, 22.7, 22.5, 22.3, 22.6, 22.8, 22.5, 22.8],
    [24.2, 24.5, 24.8, 25.0, 25.3, 25.1, 24.8, 24.5, 24.8, 25.1, 25.3, 24.5],
    [21.0, 21.2, 21.5, 21.3, 21.6, 21.4, 21.2, 21.0, 21.3, 21.5, 21.2, 21.8],
  ];
  const energyData = [
    [280, 295, 310, 340, 360, 355, 370, 385, 395, 380, 390, 400],
    [120, 125, 130, 128, 135, 132, 130, 128, 132, 135, 133, 138],
  ];
  const donutSegs = [{ label: "HVAC", value: 55, color: C.blue }, { label: "Lighting", value: 22, color: C.yellow }, { label: "IT Misc", value: 15, color: C.cyan }, { label: "Other", value: 8, color: C.muted }];
  const humidSegs = [{ label: "Optimal", value: 75, color: C.green }, { label: "Monitor", value: 20, color: C.yellow }, { label: "Alert", value: 5, color: C.red }];
  const hourLabels = ["6am", "9am", "12p", "3pm", "6pm", "9pm"].map((l, i) => [i * 2, l]);

  return (
    <div>
      <FilterBar title={`📊 Historical Data Analysis — Showing ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View`} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />

      <KpiStrip>{kpis.map((kpi, i) => <KpiCard key={kpi.label} kpi={kpi} index={i} />)}</KpiStrip>

      <div className="ddx-body" style={{ gridTemplateColumns: "250px minmax(0, 1fr) 310px", padding: "18px 22px" }}>
        {/* LEFT */}
        <div className="ddx-col">
          <Panel>
            <PHead icon="🌬" accent={C.cyan} right={`${hvacUnits.length} units`}>HVAC Units</PHead>
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 10 }}>
              {hvacUnits.map((u) => (
                <ListCard key={u.id} color={u.color} title={u.id} status={u.status} lines={[`${u.zone} · ${u.temp}°C · ${u.load}%`]} progress={u.load} />
              ))}
            </div>
          </Panel>
          <Panel>
            <PHead icon="🏢" accent={C.red}>Zone Alerts</PHead>
            <div style={{ padding: "6px 16px 8px" }}>
              {[
                { zone: "Operations", msg: "CRAC-02 Fault", col: C.red },
                { zone: "UPS Room", msg: "High Load Warning", col: C.yellow },
                { zone: "Server Hall", msg: "All Systems Normal", col: C.green },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.accent}` : "none" }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: a.col, flexShrink: 0, boxShadow: `0 0 0 4px ${a.col}22`, animation: a.col === C.red ? "pulse 2s infinite" : "none" }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{a.zone}</div>
                    <div style={{ fontSize: 12.5, color: ink(a.col), fontWeight: 700 }}>{a.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* CENTER */}
        <div className="ddx-col">
          <AIBanner label="🤖 BMS AI »" insights={insights} idx={aiIdx} color={C.green} color2={C.cyan} bg="linear-gradient(90deg, #eefcf5, #e8fbf8)" />

          <Panel>
            <PHead icon="🗺" accent={C.cyan}>Floor Plan — Zone Temperature</PHead>
            <div style={{ padding: "16px" }}>
              <FloorPlanHVAC />
              <Legend3 items={[["Normal", C.green], ["Warning", C.yellow], ["Critical", C.red]]} />
            </div>
          </Panel>

          <div className="ddx-two">
            <Panel>
              <PHead icon="🌡" accent={C.cyan}>Zone Temp Trends (°C) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={tempData.map((d, i) => ({ label: ["Hall", "UPS Rm", "Network"][i], color: [C.cyan, C.orange, C.green][i], data: d }))}
                  yMin={20} yMax={27} yTicks={[21, 23, 25, 27]} xLabels={hourLabels} height={180} delay={200} />
              </div>
            </Panel>
            <Panel>
              <PHead icon="⚡" accent={C.yellow}>Energy Consumption (kWh) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={energyData.map((d, i) => ({ label: ["HVAC", "Lighting"][i], color: [C.yellow, C.blue][i], data: d, area: true }))}
                  yMin={100} yMax={450} yTicks={[150, 250, 350, 450]} xLabels={hourLabels} height={180} delay={200} />
              </div>
            </Panel>
          </div>

          <div className="ddx-two">
            <MetricPanel icon="💨" title="Air Quality & Ventilation" accent={C.green} bars={[
              ["CO₂ Level (ppm)", 42, C.green], ["PM2.5 Particles", 18, C.cyan], ["VOC Index", 25, C.blue], ["Ventilation Flow", 88, C.green],
            ]} />
            <MetricPanel icon="💡" title="Lighting Zones" accent={C.yellow} bars={[
              ["Server Hall", 60, C.yellow], ["Operations", 85, C.yellow], ["Corridors", 40, C.orange], ["Emergency", 100, C.green],
            ]} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="ddx-col ddx-right">
          <DonutPanel icon="🍩" title="Energy Distribution" accent={C.blue}
            left={{ segments: donutSegs, title: "Energy", unit: "%" }} right={{ segments: humidSegs, title: "Humidity", unit: "%" }} />
          <GaugePanel icon="🌡" title="Environment Gauges" accent={C.green}>
            <Gauge value={22.8} max={40} color={C.cyan} label="Avg Temp" sub="°C" />
            <Gauge value={47} max={100} color={C.blue} label="Humidity" sub="%" />
          </GaugePanel>
          <MetricPanel icon="🔋" title="System Status" accent={C.cyan} bars={[
            ["HVAC Efficiency", 88, C.green], ["Chiller Load", 72, C.cyan], ["Cooling Tower", 65, C.blue], ["UPS Health", 94, C.green],
          ]} />
          <AlertBox title="Live BMS Alerts" items={["CRAC-02: Fault — Ops Zone", "AHU-02: Load 91% — Warning", "Temp spike: Ops Zone 26.1°C"].map((text) => ({ text }))} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  ACS DASHBOARD — Access Control System
// ══════════════════════════════════════════
function AccessLog({ entries }) {
  return (
    <div>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "14px 54px minmax(0, 1fr) 30px minmax(90px, auto)", gap: 10, alignItems: "center", padding: "10px 4px", borderBottom: i < entries.length - 1 ? `1px solid ${C.accent}` : "none" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.granted ? C.green : C.red, boxShadow: `0 0 0 3px ${(e.granted ? C.green : C.red)}22`, animation: e.recent ? "pulse 2s infinite" : "none" }} />
          <span style={{ color: C.muted, fontSize: 13, fontFamily: MONO }}>{e.time}</span>
          <span style={{ color: C.text, fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
          <span style={{ color: e.granted ? ink(C.green) : C.red, fontWeight: 800, fontSize: 14, textAlign: "center" }} aria-label={e.granted ? "Granted" : "Denied"}>{e.granted ? "✓" : "✗"}</span>
          <span style={{ color: C.sub, fontSize: 12.5, fontWeight: 600, textAlign: "right" }}>{e.door}</span>
        </div>
      ))}
    </div>
  );
}

function DoorStatusGrid({ doors }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 2000); return () => clearInterval(id); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {doors.map((d, i) => {
        const flash = d.status === "alert" && tick % 2 === 0;
        const col = d.status === "open" ? C.green : d.status === "locked" ? C.blue : C.red;
        const ico = d.status === "open" ? "🔓" : d.status === "locked" ? "🔒" : "🚨";
        return (
          <div key={i} style={{ background: flash ? "#fde3e8" : `linear-gradient(135deg, ${col}14, #ffffff)`, border: `1px solid ${col}44`, borderLeft: `4px solid ${col}`, borderRadius: 11, padding: "10px 12px", transition: "background 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }} aria-hidden="true">{ico}</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: C.text, flex: 1, minWidth: 0 }}>{d.name}</span>
              <StatusPill color={col}>{d.status.toUpperCase()}</StatusPill>
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 4, paddingLeft: 24 }}>{d.floor} · {d.lastAccess}</div>
          </div>
        );
      })}
    </div>
  );
}

function ACSDashboard() {
  const [aiIdx, setAiIdx] = useState(0);
  const [timeFilter, setTimeFilter] = useState("day");

  useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

  const kpis = [
    { icon: "🚪", label: "Active Doors", end: 48, unit: "", color: C.blue, sparkData: [46, 47, 48, 47, 48, 48, 48] },
    { icon: "✅", label: "Access Granted", end: 1284, unit: "", color: C.green, sparkData: [980, 1050, 1100, 1150, 1200, 1250, 1284] },
    { icon: "🚫", label: "Access Denied", end: 23, unit: "", color: C.red, blink: true, sparkData: [10, 12, 15, 18, 20, 22, 23] },
    { icon: "👤", label: "Active Badges", end: 312, unit: "", color: C.cyan, sparkData: [295, 300, 305, 308, 310, 311, 312] },
    { icon: "🔒", label: "Locked Zones", end: 5, unit: "", color: C.purple, sparkData: [4, 5, 5, 5, 5, 4, 5] },
    { icon: "⚠️", label: "Alerts", end: 2, unit: "", color: C.orange, blink: true, sparkData: [0, 1, 1, 2, 1, 2, 2] },
  ];

  const doors = [
    { name: "Main Entry", floor: "G Floor", status: "open", lastAccess: "2 min ago" },
    { name: "Server Hall", floor: "1F", status: "locked", lastAccess: "8 min ago" },
    { name: "UPS Room", floor: "1F", status: "locked", lastAccess: "15 min ago" },
    { name: "NOC", floor: "2F", status: "open", lastAccess: "1 min ago" },
    { name: "Roof Access", floor: "Top", status: "alert", lastAccess: "Forced Open" },
    { name: "Network Room", floor: "B1", status: "locked", lastAccess: "30 min ago" },
    { name: "Loading Bay", floor: "G Floor", status: "open", lastAccess: "5 min ago" },
    { name: "Control Room", floor: "2F", status: "locked", lastAccess: "22 min ago" },
  ];

  const accessLog = [
    { time: "14:32", name: "Rajesh Kumar", door: "Main Entry", granted: true, recent: true },
    { time: "14:31", name: "Unknown Badge", door: "Roof Access", granted: false, recent: true },
    { time: "14:29", name: "Priya Sharma", door: "NOC", granted: true, recent: false },
    { time: "14:28", name: "Admin Override", door: "Server Hall", granted: true, recent: false },
    { time: "14:25", name: "Vikram Singh", door: "UPS Room", granted: false, recent: false },
    { time: "14:22", name: "Sneha Patel", door: "Main Entry", granted: true, recent: false },
    { time: "14:18", name: "Maintenance", door: "Loading Bay", granted: true, recent: false },
    { time: "14:15", name: "Visitor V-042", door: "Main Entry", granted: true, recent: false },
  ];

  const insights = [
    "Roof Access forced open — security team dispatched.",
    "23 access denials today — 8 in last hour. Investigate.",
    "Visitor V-042 badge expires in 4 hours.",
  ];

  const accessHourly = [8, 15, 22, 35, 42, 38, 45, 55, 48, 40, 32, 25];
  const deniedHourly = [0, 1, 2, 3, 4, 3, 5, 6, 4, 2, 2, 1];
  const hourLabels = ["6am", "8am", "10am", "12p", "2pm", "4pm"].map((l, i) => [i * 2, l]);

  const zoneDonut = [{ label: "Authorized", value: 72, color: C.green }, { label: "Visitor", value: 18, color: C.cyan }, { label: "Temp", value: 10, color: C.yellow }];
  const statusDonut = [{ label: "Open", value: 20, color: C.green }, { label: "Locked", value: 75, color: C.blue }, { label: "Alert", value: 5, color: C.red }];

  return (
    <div>
      <FilterBar title={`📊 Historical Data Analysis — Showing ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View`} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />

      <KpiStrip>{kpis.map((kpi, i) => <KpiCard key={kpi.label} kpi={kpi} index={i} />)}</KpiStrip>

      <div className="ddx-body" style={{ gridTemplateColumns: "250px minmax(0, 1fr) 310px", padding: "18px 22px" }}>
        {/* LEFT */}
        <div className="ddx-col">
          <Panel>
            <PHead icon="🚪" accent={C.blue} right={`${doors.length} doors`}>Door Status</PHead>
            <div style={{ padding: "12px" }}>
              <DoorStatusGrid doors={doors} />
            </div>
          </Panel>
        </div>

        {/* CENTER */}
        <div className="ddx-col">
          <AIBanner label="🤖 ACS AI »" insights={insights} idx={aiIdx} color={C.red} color2={C.orange} bg="linear-gradient(90deg, #fff1f4, #fff3f8)" />

          <div className="ddx-two">
            <Panel>
              <PHead icon="✅" accent={C.green}>Hourly Access Granted {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={[{ label: "Granted", color: C.green, data: accessHourly, area: true }]} yMin={0} yMax={65} yTicks={[15, 30, 45, 60]} xLabels={hourLabels} height={170} delay={200} />
              </div>
            </Panel>
            <Panel>
              <PHead icon="🚫" accent={C.red}>Hourly Access Denied {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={[{ label: "Denied", color: C.red, data: deniedHourly, area: true }]} yMin={0} yMax={8} yTicks={[2, 4, 6, 8]} xLabels={hourLabels} height={170} delay={200} />
              </div>
            </Panel>
          </div>

          <Panel>
            <PHead icon="📋" accent={C.orange} right={`${accessLog.length} latest events`}>Recent Access Log</PHead>
            <div style={{ padding: "6px 16px 8px" }}>
              <AccessLog entries={accessLog} />
            </div>
          </Panel>

          <div className="ddx-two">
            <MetricPanel icon="🔐" title="Zone Access Load" accent={C.blue} bars={[
              ["Main Entry", 88, C.blue], ["Server Hall", 30, C.cyan], ["NOC", 65, C.green], ["Operations", 72, C.purple],
            ]} />
            <MetricPanel icon="👥" title="Personnel Distribution" accent={C.green} bars={[
              ["IT Staff", 45, C.blue], ["Operations", 30, C.green], ["Maintenance", 15, C.yellow], ["Visitors", 10, C.orange],
            ]} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="ddx-col ddx-right">
          <DonutPanel icon="🍩" title="Badge & Door Status" accent={C.blue}
            left={{ segments: zoneDonut, title: "Badges", unit: "%" }} right={{ segments: statusDonut, title: "Doors", unit: "%" }} />
          <GaugePanel icon="🔑" title="Access Gauges" accent={C.green}>
            <Gauge value={94.7} max={100} color={C.green} label="Grant Rate" sub="%" />
            <Gauge value={98.2} max={100} color={C.blue} label="Door Health" sub="%" />
          </GaugePanel>
          <MetricPanel icon="🔒" title="Security Zones" accent={C.purple} bars={[
            ["Perimeter", 100, C.green], ["Server Zones", 98, C.blue], ["Public Areas", 85, C.cyan], ["Restricted", 100, C.purple],
          ]} />
          <AlertBox title="Security Alerts" items={["Roof Access: Forced Open!", "5 denied attempts — Badge 7731", "Visitor badge expiring: 4hrs"].map((text) => ({ text }))} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  FAS DASHBOARD — Fire Alarm System
// ══════════════════════════════════════════
function FireZoneMap() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 800); return () => clearInterval(id); }, []);
  const zones = [
    { x: 10, y: 10, w: 90, h: 65, label: "Zone A\nServer Hall", status: "normal" },
    { x: 110, y: 10, w: 80, h: 65, label: "Zone B\nUPS Room", status: "alert" },
    { x: 200, y: 10, w: 55, h: 65, label: "Zone C\nNetwork", status: "normal" },
    { x: 10, y: 85, w: 100, h: 55, label: "Zone D\nStorage", status: "normal" },
    { x: 120, y: 85, w: 135, h: 55, label: "Zone E\nOperations", status: "warning" },
  ];
  const getIcon = s => s === "normal" ? "✓" : s === "warning" ? "⚠" : "🔥";
  return (
    <ZoneMap vw={265} vh={150} zones={zones} height={260} caption="Fire Zone Map — Ground Floor"
      renderZone={(z) => {
        const col = zoneTone(z.status);
        const flash = z.status === "alert" && tick % 2 === 0;
        const [zone, room] = z.label.split("\n");
        return (
          <div style={{
            height: "100%", borderRadius: 12, border: `${z.status === "alert" ? 3 : 2}px solid ${col}`,
            background: flash ? `${C.red}33` : `linear-gradient(135deg, ${col}24, ${col}0a)`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textAlign: "center", padding: 6,
            transition: "background 0.3s ease",
          }}>
            <span style={{ fontSize: 20, color: ink(col), fontWeight: 800, lineHeight: 1 }}>{getIcon(z.status)}</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{zone}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.sub }}>{room}</span>
          </div>
        );
      }} />
  );
}

function FASDashboard() {
  const [aiIdx, setAiIdx] = useState(0);
  const [timeFilter, setTimeFilter] = useState("day");

  useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

  const kpis = [
    { icon: "🔥", label: "Active Alarms", end: 1, unit: "", color: C.red, blink: true, sparkData: [0, 0, 1, 0, 0, 0, 1] },
    { icon: "⚠️", label: "Warnings", end: 2, unit: "", color: C.yellow, sparkData: [1, 1, 2, 1, 2, 2, 2] },
    { icon: "🌡", label: "Max Smoke", end: 18, unit: " ppm", color: C.orange, sparkData: [10, 12, 14, 16, 15, 17, 18] },
    { icon: "🚿", label: "Sprinklers", end: 48, unit: "", color: C.blue, sparkData: [48, 48, 48, 48, 48, 48, 48] },
    { icon: "📟", label: "Detectors OK", end: 124, unit: "/126", color: C.green, sparkData: [126, 126, 125, 126, 125, 124, 124] },
    { icon: "🔔", label: "Tests Due", end: 3, unit: "", color: C.purple, sparkData: [5, 4, 4, 3, 3, 3, 3] },
  ];

  const detectors = [
    { id: "SMK-B12", zone: "Zone B - UPS Room", type: "Smoke", value: 22, unit: "ppm", status: "alarm", lastTest: "15 Jun" },
    { id: "HT-E05", zone: "Zone E - Operations", type: "Heat", value: 34, unit: "°C", status: "warning", lastTest: "15 Jun" },
    { id: "CO-A03", zone: "Zone A - Server Hall", type: "CO", value: 8, unit: "ppm", status: "normal", lastTest: "15 Jun" },
    { id: "SMK-C08", zone: "Zone C - Network", type: "Smoke", value: 3, unit: "ppm", status: "normal", lastTest: "10 Jun" },
    { id: "HT-D11", zone: "Zone D - Storage", type: "Heat", value: 22, unit: "°C", status: "normal", lastTest: "12 Jun" },
  ];

  const insights = [
    "SMK-B12 alarm in UPS Room — possible overheating event.",
    "Zone E heat sensor elevated — correlates with CRAC-02 fault (BMS).",
    "3 detector tests overdue — schedule maintenance.",
  ];

  const smokeData = [2, 3, 4, 5, 8, 12, 18, 22, 20, 18, 15, 18];
  const heatData = [22, 22.5, 23, 23.8, 25, 27, 30, 32, 34, 33, 33, 34];
  const hourLabels = ["6am", "8am", "10am", "12p", "2pm", "4pm"].map((l, i) => [i * 2, l]);

  const alarmDonut = [{ label: "Normal", value: 120, color: C.green }, { label: "Warning", value: 4, color: C.yellow }, { label: "Alarm", value: 2, color: C.red }];
  const typeDonut = [{ label: "Smoke", value: 55, color: C.orange }, { label: "Heat", value: 30, color: C.red }, { label: "CO", value: 15, color: C.purple }];

  return (
    <div>
      <FilterBar title={`📊 Historical Data Analysis — Showing ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View`} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />

      <KpiStrip>{kpis.map((kpi, i) => <KpiCard key={kpi.label} kpi={kpi} index={i} />)}</KpiStrip>

      <div className="ddx-body" style={{ gridTemplateColumns: "250px minmax(0, 1fr) 310px", padding: "18px 22px" }}>
        {/* LEFT */}
        <div className="ddx-col">
          <Panel>
            <PHead icon="🔥" accent={C.red}>Detector Status</PHead>
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 10 }}>
              {detectors.map((d) => {
                const col = d.status === "alarm" ? C.red : d.status === "warning" ? C.yellow : C.green;
                return <ListCard key={d.id} color={col} title={d.id} status={d.status.toUpperCase()} statusBlink={d.status === "alarm"} lines={[`${d.type} · ${d.value}${d.unit}`, `Test: ${d.lastTest}`]} />;
              })}
            </div>
          </Panel>
        </div>

        {/* CENTER */}
        <div className="ddx-col">
          <AIBanner label="🤖 FAS AI »" insights={insights} idx={aiIdx} color={C.red} color2={C.orange} bg="linear-gradient(90deg, #fff1f1, #fff6ef)" glow />

          <Panel>
            <PHead icon="🗺" accent={C.red}>Fire Zone Map</PHead>
            <div style={{ padding: "16px" }}>
              <FireZoneMap />
              <Legend3 items={[["Normal", C.green], ["Warning", C.yellow], ["Active Alarm", C.red]]} />
            </div>
          </Panel>

          <div className="ddx-two">
            <Panel>
              <PHead icon="💨" accent={C.orange}>Smoke Levels (ppm) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={[{ label: "Smoke ppm", color: C.orange, data: smokeData, area: true }]} yMin={0} yMax={25} yTicks={[5, 10, 15, 20, 25]} xLabels={hourLabels} height={170} delay={200} />
              </div>
            </Panel>
            <Panel>
              <PHead icon="🌡" accent={C.red}>Heat Sensor (°C) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={[{ label: "Heat °C", color: C.red, data: heatData, area: true }]} yMin={20} yMax={36} yTicks={[22, 26, 30, 34]} xLabels={hourLabels} height={170} delay={200} />
              </div>
            </Panel>
          </div>

          <div className="ddx-two">
            <MetricPanel icon="🚿" title="Suppression Systems" accent={C.blue} bars={[
              ["Sprinklers Ready", 100, C.green], ["CO₂ Systems", 100, C.blue], ["Halon Reserve", 82, C.cyan], ["FM-200 Pressure", 95, C.purple],
            ]} />
            <MetricPanel icon="📡" title="Panel Status" accent={C.green} bars={[
              ["Main Control Panel", 100, C.green], ["Annunciator Panel", 100, C.green], ["Battery Backup", 88, C.yellow], ["Comm Link", 98, C.green],
            ]} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="ddx-col ddx-right">
          <DonutPanel icon="🍩" title="Detector Overview" accent={C.red}
            left={{ segments: alarmDonut, title: "Status" }} right={{ segments: typeDonut, title: "Types", unit: "%" }} />
          <GaugePanel icon="🌡" title="Sensor Gauges" accent={C.orange}>
            <Gauge value={22} max={100} color={C.orange} label="Smoke ppm" sub="UPS Room" />
            <Gauge value={34} max={80} color={C.red} label="Heat °C" sub="Ops Zone" />
          </GaugePanel>
          <MetricPanel icon="📋" title="Zone Health" accent={C.green} bars={[
            ["Zone A — Server Hall", 98, C.green], ["Zone B — UPS Room", 20, C.red], ["Zone C — Network", 100, C.green],
            ["Zone D — Storage", 100, C.green], ["Zone E — Operations", 60, C.yellow],
          ]} />
          <AlertBox title="🔥 Fire Alerts" glow items={[
            { text: "ALARM: SMK-B12 UPS Room Active!", strong: true, color: C.red },
            { text: "WARNING: Zone E temp elevated" },
            { text: "TEST DUE: Zones B, C, E — overdue" },
          ]} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  VMS DASHBOARD — Video Management System (Light Theme)
// ══════════════════════════════════════════
function CameraFeed({ id, location, status, isAlarm }) {
  const [scanY, setScanY] = useState(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id2 = setInterval(() => {
      setScanY(y => (y + 3) % 100);
      setTick(t => t + 1);
    }, 80);
    return () => clearInterval(id2);
  }, []);

  const statusColor = status === "online" ? C.green : status === "motion" ? C.yellow : status === "alarm" ? C.red : C.muted;

  const noiseBlocks = Array.from({ length: 24 }, (_, i) => {
    const val = Math.sin(tick * 0.1 + i * 1.7) * 0.5 + 0.5;
    return { x: (i % 6) * 16 + 8, y: Math.floor(i / 6) * 16 + 10, opacity: val * 0.08 };
  });
  const chip = { position: "absolute", background: "rgba(255,255,255,0.88)", borderRadius: 6, padding: "2px 7px", fontSize: 11.5, fontWeight: 700, lineHeight: 1.4, boxShadow: "0 1px 4px rgba(20,33,61,0.12)" };

  return (
    <div style={{ background: "#f0f4fa", border: `2px solid ${isAlarm ? C.red : status === "motion" ? C.yellow : C.panelBorder}`, borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: "16/10", boxShadow: isAlarm ? `0 0 0 3px ${C.red}22` : "none" }}>
      {/* the picture: shapes only, so stretching it to the tile is harmless */}
      <svg width="100%" height="100%" viewBox="0 0 110 72" preserveAspectRatio="none" style={{ display: "block" }}>
        <rect x={0} y={0} width={110} height={72} fill="#e3ebf7" />
        {noiseBlocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={14} height={14} fill="#8aaad0" opacity={b.opacity} rx="1" />
        ))}
        {status !== "offline" && (
          <>
            <rect x={15} y={20} width={25} height={30} fill="#cddaef" rx="3" opacity="0.8" />
            <rect x={50} y={25} width={20} height={25} fill="#cddaef" rx="3" opacity="0.8" />
            <rect x={80} y={22} width={15} height={28} fill="#cddaef" rx="3" opacity="0.7" />
            <line x1={0} y1={scanY * 0.72} x2={110} y2={scanY * 0.72} stroke={statusColor} strokeWidth="0.5" opacity="0.35" />
          </>
        )}
        {isAlarm && tick % 20 < 10 && <rect x={0} y={0} width={110} height={72} fill={C.red} opacity="0.1" />}
      </svg>
      {/* labels: real HTML text at a readable size */}
      <span style={{ ...chip, top: 6, left: 6, color: ink(statusColor) }}>{id} · {status.toUpperCase()}</span>
      <span style={{ ...chip, bottom: 6, right: 6, color: C.sub, fontFamily: MONO, fontWeight: 600 }}>{new Date().toLocaleTimeString()}</span>
      {status !== "offline" && <span style={{ ...chip, bottom: 6, left: 6, color: C.sub }}>{location}</span>}
      {status === "offline" && (
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: C.muted, letterSpacing: 1 }}>NO SIGNAL</span>
      )}
      {(status === "motion" || isAlarm) && (
        <span style={{ ...chip, top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 13, fontWeight: 800, color: isAlarm ? C.red : ink(C.yellow), background: "rgba(255,255,255,0.92)" }}>{isAlarm ? "⚠ INTRUSION" : "MOTION"}</span>
      )}
    </div>
  );
}

function VMSDashboard() {
  const [aiIdx, setAiIdx] = useState(0);
  const [selectedCam, setSelectedCam] = useState(null);
  const [timeFilter, setTimeFilter] = useState("day");

  useEffect(() => { const id = setInterval(() => setAiIdx(i => (i + 1) % 3), ANIM.aiCycle); return () => clearInterval(id); }, []);

  const kpis = [
    { icon: "📹", label: "Total Cameras", end: 32, unit: "", color: C.blue, sparkData: [30, 31, 32, 32, 32, 31, 32] },
    { icon: "🟢", label: "Online", end: 30, unit: "", color: C.green, sparkData: [28, 29, 30, 29, 30, 30, 30] },
    { icon: "🔴", label: "Offline", end: 2, unit: "", color: C.red, blink: true, sparkData: [1, 1, 2, 2, 1, 2, 2] },
    { icon: "🚨", label: "Motion Events", end: 47, unit: "", color: C.yellow, sparkData: [30, 35, 38, 42, 44, 46, 47] },
    { icon: "💾", label: "Storage Used", end: 68, unit: "%", color: C.orange, sparkData: [60, 62, 64, 65, 66, 67, 68] },
    { icon: "📡", label: "Streams Active", end: 28, unit: "", color: C.cyan, sparkData: [25, 26, 27, 27, 28, 28, 28] },
  ];

  const cameras = [
    { id: "CAM-01", location: "Main Entry", status: "motion", isAlarm: false },
    { id: "CAM-02", location: "Server Hall", status: "online", isAlarm: false },
    { id: "CAM-03", location: "Roof Access", status: "alarm", isAlarm: true },
    { id: "CAM-04", location: "UPS Room", status: "online", isAlarm: false },
    { id: "CAM-05", location: "Loading Bay", status: "motion", isAlarm: false },
    { id: "CAM-06", location: "Parking", status: "online", isAlarm: false },
    { id: "CAM-07", location: "Corridor B", status: "offline", isAlarm: false },
    { id: "CAM-08", location: "Operations", status: "online", isAlarm: false },
  ];

  const motionData = [2, 4, 6, 8, 10, 8, 12, 15, 14, 10, 8, 6];
  const storageData = [60, 61, 62, 63, 64, 65, 65, 66, 67, 67, 68, 68];
  const hourLabels = ["6am", "8am", "10am", "12p", "2pm", "4pm"].map((l, i) => [i * 2, l]);

  const insights = [
    "CAM-03 Roof: Intrusion detected — aligns with ACS forced-open alert.",
    "Motion spike at Loading Bay — correlates with access log at 14:18.",
    "CAM-07 offline 45 min — hardware check required.",
  ];

  const camDonut = [{ label: "Online", value: 30, color: C.green }, { label: "Motion", value: 8, color: C.yellow }, { label: "Offline", value: 2, color: C.red }];
  const recDonut = [{ label: "Recording", value: 28, color: C.blue }, { label: "Standby", value: 4, color: C.cyan }];

  const eventLog = [
    { time: "14:32", cam: "CAM-03", event: "Intrusion Detected", level: "alarm" },
    { time: "14:31", cam: "CAM-01", event: "Person Detected", level: "motion" },
    { time: "14:29", cam: "CAM-05", event: "Vehicle Detected", level: "motion" },
    { time: "14:25", cam: "CAM-03", event: "Zone Breach", level: "alarm" },
    { time: "14:22", cam: "CAM-01", event: "Person Detected", level: "motion" },
    { time: "14:18", cam: "CAM-05", event: "Person Detected", level: "motion" },
    { time: "14:07", cam: "CAM-07", event: "Camera Offline", level: "fault" },
  ];

  return (
    <div>
      <FilterBar title={`📊 Historical Data Analysis — Showing ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} View`} timeFilter={timeFilter} setTimeFilter={setTimeFilter} />

      <KpiStrip>{kpis.map((kpi, i) => <KpiCard key={kpi.label} kpi={kpi} index={i} />)}</KpiStrip>

      <div className="ddx-body ddx-wide" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px", padding: "18px 22px", background: C.bg }}>
        {/* LEFT — Camera Grid */}
        <div className="ddx-col">
          <AIBanner label="🤖 VMS AI »" insights={insights} idx={aiIdx} color={C.blue} color2={C.cyan} bg="linear-gradient(90deg, #eef5ff, #e8f6ff)" />

          <Panel>
            <PHead icon="📹" accent={C.blue} right={`${cameras.length} live feeds`}>Camera Wall</PHead>
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
              {cameras.map((cam) => (
                <div key={cam.id} role="button" tabIndex={0} className="ddx-click"
                  onClick={() => setSelectedCam(selectedCam === cam.id ? null : cam.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedCam(selectedCam === cam.id ? null : cam.id); } }}
                  style={{ cursor: "pointer", borderRadius: 14, outline: selectedCam === cam.id ? `3px solid ${C.cyan}` : "none", outlineOffset: 2 }}>
                  <CameraFeed {...cam} />
                  <div style={{ fontSize: 13, color: selectedCam === cam.id ? ink(C.cyan) : C.sub, textAlign: "center", marginTop: 6, fontWeight: 700 }}>{cam.id} — {cam.location}</div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="ddx-two">
            <Panel>
              <PHead icon="📈" accent={C.yellow}>Motion Events/Hour {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={[{ label: "Events", color: C.yellow, data: motionData, area: true }]} yMin={0} yMax={18} yTicks={[5, 10, 15]} xLabels={hourLabels} height={170} delay={200} />
              </div>
            </Panel>
            <Panel>
              <PHead icon="💾" accent={C.orange}>Storage Usage (%) {timeFilter !== "day" && `(${timeFilter} view)`}</PHead>
              <div style={{ padding: "14px 16px 10px" }}>
                <LineChart series={[{ label: "Storage", color: C.orange, data: storageData, area: true }]} yMin={58} yMax={70} yTicks={[60, 63, 66, 69]} xLabels={hourLabels} height={170} delay={200} />
              </div>
            </Panel>
          </div>
        </div>

        {/* RIGHT */}
        <div className="ddx-col ddx-right">
          <DonutPanel icon="🍩" title="Camera Overview" accent={C.blue}
            left={{ segments: camDonut, title: "Status" }} right={{ segments: recDonut, title: "Recording" }} />
          <MetricPanel icon="📋" title="System Health" accent={C.green} bars={[
            ["Recording Quality", 94, C.green], ["Stream Uptime", 98, C.blue], ["Storage Available", 32, C.orange], ["Network Bandwidth", 72, C.cyan],
          ]} />
          <div style={{ background: "linear-gradient(135deg, #fff1f4, #fffafb)", border: `1px solid ${C.red}40`, borderLeft: `5px solid ${C.red}`, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><span className="pulse-dot" aria-hidden="true">🔴</span> Event Log</div>
            {eventLog.map((e, i) => {
              const col = e.level === "alarm" ? C.red : e.level === "motion" ? C.yellow : C.orange;
              return (
                <div key={i} style={{ fontSize: 13, color: C.text, padding: "8px 0", borderBottom: i < eventLog.length - 1 ? `1px solid ${C.red}1a` : "none", display: "grid", gridTemplateColumns: "12px 46px 66px minmax(0, 1fr)", gap: 8, alignItems: "center" }}>
                  <span style={{ color: col, fontWeight: 800, fontSize: 10.5 }}>▶</span>
                  <span style={{ color: C.muted, fontFamily: MONO }}>{e.time}</span>
                  <span style={{ color: ink(col), fontWeight: 800 }}>{e.cam}</span>
                  <span style={{ fontWeight: 600 }}>{e.event}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  CROSS-SYSTEM ALERT BANNER
// ══════════════════════════════════════════
function CrossSystemBanner({ alerts }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % alerts.length), 3000); return () => clearInterval(id); }, [alerts.length]);
  if (!alerts.length) return null;
  return (
    <div style={{ background: `linear-gradient(90deg, #fef0f0, #feeaea)`, border: `1px solid ${C.red}66`, padding: "10px 22px", display: "flex", gap: 12, alignItems: "center", overflow: "hidden" }}>
      <div style={{ background: C.red, color: "#fff", fontSize: 12, fontWeight: 800, padding: "3px 12px", borderRadius: 6, whiteSpace: "nowrap" }}>🔗 CROSS-SYSTEM</div>
      {alerts.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", opacity: i === idx ? 1 : 0, position: i === idx ? "relative" : "absolute", transition: "opacity 0.5s" }}>
          <span style={{ fontSize: 12.5, color: C.red, fontFamily: MONO }}>[{a.systems}]</span>
          <span style={{ fontSize: 13.5, color: C.red, fontWeight: 700 }}>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════
const TABS = [
  { id: "DCIM", label: "DCIM", full: "Data Center Infrastructure", icon: "🖥", accent: C.blue },
  { id: "BMS", label: "BMS", full: "Building Management", icon: "🏢", accent: C.green },
  { id: "ACS", label: "ACS", full: "Access Control", icon: "🔐", accent: C.purple },
  { id: "FAS", label: "FAS", full: "Fire Alarm System", icon: "🔥", accent: C.red },
  { id: "VMS", label: "VMS", full: "Video Management", icon: "📹", accent: C.cyan },
];

const CROSS_ALERTS = [
  { systems: "ACS + VMS + FAS", msg: "Roof forced open → CAM-03 intrusion + FAS perimeter breach — Security Response Required" },
  { systems: "BMS + DCIM", msg: "CRAC-02 fault (BMS) → Server Hall temp rising (DCIM) — Zone E at 26.1°C" },
  { systems: "BMS + FAS", msg: "CRAC-02 fault correlates with Zone E elevated heat sensor — SMK-B12 pre-alarm" },
];

export default function SmartCityDashboard() {
  const [activeTab, setActiveTab] = useState("DCIM");
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

  return (
    <div className="ddx-root" style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT, color: C.text, fontSize: 14 }}>
      <style>{styles}</style>

      {/* TOP NAV — light bar; stays under the portal header while the page scrolls */}
      <div role="tablist" aria-label="Dashboard systems" style={{ background: "#ffffff", padding: "0 18px", display: "flex", alignItems: "stretch", gap: 0, boxShadow: "0 4px 14px rgba(20,33,61,0.07)", borderBottom: `1px solid ${C.panelBorder}`, position: "sticky", top: 64, zIndex: 10 }}>

        {/* Tabs */}
        <div style={{ display: "flex", flex: 1, gap: 6, alignItems: "stretch", justifyContent: "space-evenly", minWidth: 0, overflowX: "auto" }}>
          {TABS.map(t => {
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                className="ddx-tab"
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: on ? `linear-gradient(180deg, ${t.accent}1f, ${t.accent}08)` : "transparent",
                  border: "none", borderBottom: on ? `4px solid ${t.accent}` : "4px solid transparent",
                  color: on ? C.text : C.sub,
                  padding: "10px 16px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 10, minWidth: 150, transition: "all 0.25s ease", fontFamily: FONT, textAlign: "left",
                }}
              >
                <IconTile icon={t.icon} color={t.accent} size={38} />
                <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <span style={{ fontSize: 15, fontWeight: on ? 800 : 700, color: on ? ink(t.accent) : C.text, letterSpacing: 0.4 }}>{t.label}</span>
                  <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{t.full}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Clock */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingLeft: 18, marginLeft: 8, borderLeft: `1px solid ${C.accentBorder}`, flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: MONO }}>
            {time.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
            {time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <div style={{ width: 8, height: 8, background: C.green, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: ink(C.green), fontWeight: 800, letterSpacing: 0.4 }}>ALL SYSTEMS LIVE</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="fade-in" style={{ animationDuration: "0.4s" }}>
        {/* DCIM tab: Health Index (from the reference portal) on top, the KPI dashboard below it */}
        {activeTab === "DCIM" && (
          <>
            <DCIMDashboard2 />
            <DCIMDashboard />
          </>
        )}
        {activeTab === "BMS" && <BMSDashboard />}
        {activeTab === "ACS" && <ACSDashboard />}
        {activeTab === "FAS" && <FASDashboard />}
        {activeTab === "VMS" && <VMSDashboard />}
      </div>

      {/* AI Assistant is rendered globally in Layout.jsx */}
    </div>
  );
}
