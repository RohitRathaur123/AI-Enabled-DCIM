import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// All asset data on this page comes from the shared asset register — the same
// 664 assets the 5D View holds — so it matches the Dashboard's DCIM tab and the
// master pages (Onboarding, Type, Category, Manufacturer, Model Specifications).
import {
  ASSETS, ASSET_SUMMARY, SERVER_FLEET, FLEET_AVG, PDU_LIST, NETWORK_LIST, UPS_LIST,
  COOLING_LIST, GENERATOR_LIST, RACK_LIST, ROW_LIST,
} from "./dcimAssetRegister";
import { DCIM, ACTIVE_ALARMS, SEVERITY_COLOR, splitTo100 } from "./dcimDashboardData";

const ANIM = {
  counter: 2800, gauge: 3200, gaugeDelay: 500,
  line: 3500, hbar: 2200, hbarStagger: 150,
  donut: 2600, spark: 2800, kpiStagger: 100,
  interval: 60000
};

const C = {
  bg: "#eef2f9", panel: "#ffffff", border: "#dbe4f1",
  nav: "#1b3060", blue: "#1a5fff", cyan: "#0099d4",
  green: "#09b86e", yellow: "#f0a500", red: "#e02b45",
  orange: "#e8621a", purple: "#6d28d9", teal: "#0891b2",
  indigo: "#3730a3", pink: "#db2777",
  text: "#111d3c", sub: "#46557a", muted: "#6a7a9a",
  accent: "#e9eff9", accentB: "#c9d6ec",
  shadow: "0 4px 18px rgba(20,40,100,0.08)",
  shadowMd: "0 6px 22px rgba(20,40,100,0.13)",
};
// Text drawn in a bright hue is set one shade darker so it reads on white.
const INK = { [C.yellow]: "#b87a00", [C.green]: "#068a55", [C.cyan]: "#0079a8", [C.orange]: "#c9520f", [C.teal]: "#0a7690" };
const ink = (c) => INK[c] || c;

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
  .adx-root{container-type:inline-size}
  .adx-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}
  .adx-g2{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px}
  .adx-g2b{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px}
  .adx-g3{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr);gap:16px}
  .adx-g3r{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.8fr);gap:16px}
  .adx-rows{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
  .adx-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  .adx-tab:hover{background:#eef3ff}
  .adx-tab:focus-visible,.adx-pg:focus-visible{outline:2px solid #1a5fff;outline-offset:2px}
  @container (max-width:1150px){
    .adx-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}
    .adx-g3,.adx-g3r{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
    .adx-rows{grid-template-columns:repeat(3,minmax(0,1fr))}
    .adx-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  }
  @container (max-width:820px){
    .adx-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
    .adx-g2,.adx-g2b,.adx-g3,.adx-g3r{grid-template-columns:minmax(0,1fr)}
    .adx-rows{grid-template-columns:repeat(2,minmax(0,1fr))}
    .adx-cards{grid-template-columns:minmax(0,1fr)}
  }
  @media (prefers-reduced-motion: reduce){
    .fade-up,.pulse,.blink,.glow-btn,.row-in{animation:none !important;opacity:1 !important}
  }
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
  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden", minWidth: 0, ...style }}>{children}</div>
));

const PH = React.memo(({ icon, title, accent = C.blue, right }) => (
  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.accent}`, borderTop: `3px solid ${accent}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: `linear-gradient(90deg,${accent}14,${C.panel} 70%)` }}>
    <span style={{ fontSize: 15, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      {icon && <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17, background: `linear-gradient(135deg,${accent}2e,${accent}12)`, border: `1px solid ${accent}40`, flexShrink: 0 }}>{icon}</span>}
      <span style={{ minWidth: 0, lineHeight: 1.3 }}>{title}</span>
    </span>
    {right && <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, textAlign: "right" }}>{right}</span>}
  </div>
));

// Width of a chart's box, so SVGs are drawn 1:1 and their text never stretches.
function useBoxWidth(fallback = 400) {
  const ref = useRef(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => { const cw = Math.floor(el.getBoundingClientRect().width); if (cw > 0) setW(prev => (Math.abs(prev - cw) > 1 ? cw : prev)); };
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

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

let SPARK_SEQ = 0;
const SparkFill = React.memo(({ data, color, h = 30, delay = 0 }) => {
  const p = useAnim(ANIM.spark, delay);
  const [ref, w] = useBoxWidth(150);
  const [uid] = useState(() => `sf${++SPARK_SEQ}`);
  const mn = Math.min(...data), mx = Math.max(...data);
  const tx = i => 3 + (i / (data.length - 1)) * (w - 8);
  const ty = v => h - 4 - ((v - mn) / (mx - mn + .001)) * (h - 10);
  const lp = data.map((v, i) => `${i ? "L" : "M"} ${tx(i)} ${ty(v)}`).join(" ");
  const ap = lp + ` L ${tx(data.length - 1)} ${h} L ${tx(0)} ${h} Z`;
  return (
    <div ref={ref} style={{ width: "100%", height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".3" /><stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}c`}><rect x={0} y={0} width={w * p} height={h} /></clipPath>
        </defs>
        <path d={ap} fill={`url(#${uid}g)`} clipPath={`url(#${uid}c)`} />
        <path d={lp} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${uid}c)`} />
        <circle cx={tx(data.length - 1)} cy={ty(data[data.length - 1])} r="3.4" fill={color} stroke="#fff" strokeWidth="1.5" style={{ opacity: p > .88 ? 1 : 0 }} />
      </svg>
    </div>
  );
});

const HBar = React.memo(({ label, val, max = 100, color, delay = 0, showVal = true }) => {
  const p = useAnim(ANIM.hbar, delay);
  const w = p * (val / max) * 100;
  const bare = !label && !showVal;          // just the bar (tables, rows with their own labels)
  return (
    <div style={{ marginBottom: bare ? 0 : 12, minWidth: bare ? 70 : 0 }}>
      {!bare && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
          <span style={{ fontSize: 13, color: C.sub, fontWeight: 600, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>{label}</span>
          {showVal && <span style={{ fontSize: 13, color: ink(color), fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace", fontWeight: 700 }}>{Math.round(p * val)}{max !== 100 ? "" : "%"}</span>}
        </div>
      )}
      <div style={{ height: 9, background: `${color}1f`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 6 }} />
      </div>
    </div>
  );
});

const Donut = React.memo(({ segs, size = 88, title, centerVal }) => {
  const p = useAnim(ANIM.donut, 300);
  const sw = Math.max(10, Math.round(size * 0.1));
  const r = size / 2 - sw / 2 - 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth={sw} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.c} strokeWidth={sw}
            strokeDasharray={a.dash} strokeDashoffset={a.doff}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        ))}
        <text x={cx} y={cy + (title ? 2 : 6)} textAnchor="middle" fill={C.text} fontSize={Math.round(size * 0.145)} fontWeight="700" fontFamily="'JetBrains Mono', ui-monospace, Consolas, monospace">{centerVal || Math.round(p * 100) + "%"}</text>
        {title && <text x={cx} y={cy + Math.round(size * 0.145)} textAnchor="middle" fill={C.muted} fontSize={Math.max(10.5, Math.round(size * 0.085))} fontWeight="600" fontFamily="'DM Sans', 'Segoe UI', system-ui, sans-serif">{title}</text>}
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
    <span style={{ background: s.bg, color: ink(s.color), border: `1px solid ${s.color}55`, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block", ...(status === "Online" || status === "Active" ? { animation: "pulse 2s infinite" } : {}) }} />
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
  const sw = Math.max(7, Math.round(size * 0.12));
  const r = (size - sw - 4) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const pct = (val / max) * p;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}22`} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill={ink(color)} fontSize={Math.round(size * 0.21)} fontWeight="700" fontFamily="'JetBrains Mono', ui-monospace, Consolas, monospace">{Math.round(p * val)}{max === 100 ? "%" : ""}</text>
      </svg>
      <span style={{ fontSize: 12, color: C.sub, fontWeight: 600, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
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
            {labels && <text x={x + bW / 2} y={H - 2} textAnchor="middle" fill={C.muted} fontSize="7" fontFamily="'JetBrains Mono', ui-monospace, Consolas, monospace">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
});

const MultiLineChart = React.memo(({ datasets, h = 80, labels, unit = "" }) => {
  const p = useAnim(ANIM.line, 200);
  const [ref, w] = useBoxWidth(400);
  const [uid] = useState(() => `mlc${++SPARK_SEQ}`);
  const padL = 46, padR = 16, padT = 12, padB = 28;
  const allVals = datasets.flatMap(d => d.data);
  const mn = Math.min(...allVals), mx = Math.max(...allVals);
  const n = datasets[0].data.length;
  const gW = Math.max(40, w - padL - padR), gH = h - padT - padB;
  const tx = i => padL + (i / (n - 1)) * gW;
  const ty = v => padT + gH - ((v - mn) / (mx - mn + 1)) * gH;

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <defs>
          <clipPath id={`${uid}c`}><rect x={padL - 2} y={0} width={(gW + 6) * p} height={h} /></clipPath>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const v = mn + frac * (mx - mn);
          return (
            <g key={i}>
              <line x1={padL} y1={ty(v)} x2={padL + gW} y2={ty(v)} stroke={C.accentB} strokeWidth="0.8" strokeDasharray="4,4" />
              <text x={padL - 8} y={ty(v) + 4} textAnchor="end" fill={C.muted} fontSize="11.5" fontWeight="600" fontFamily="'DM Sans', 'Segoe UI', system-ui, sans-serif">{v.toFixed(1)}{unit}</text>
            </g>
          );
        })}
        {datasets.map((ds, di) => {
          const lp = ds.data.map((v, i) => `${i ? "L" : "M"} ${tx(i)} ${ty(v)}`).join(" ");
          return (
            <g key={di} clipPath={`url(#${uid}c)`}>
              {datasets.length <= 2 && <path d={lp + ` L ${tx(ds.data.length - 1)} ${padT + gH} L ${tx(0)} ${padT + gH} Z`} fill={ds.color + "14"} />}
              <path d={lp} fill="none" stroke={ds.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {datasets.map((ds, di) => (
          <circle key={di} cx={tx(n - 1)} cy={ty(ds.data[n - 1])} r="4" fill={ds.color} stroke="#fff" strokeWidth="1.8" style={{ opacity: p > 0.9 ? 1 : 0 }} />
        ))}
        {labels && labels.map((lbl, i) => (
          <text key={i} x={i === n - 1 ? tx(i) + 6 : tx(i)} y={h - 8} textAnchor={i === n - 1 ? "end" : "middle"} fill={C.muted} fontSize="11.5" fontWeight="600" fontFamily="'DM Sans', 'Segoe UI', system-ui, sans-serif">{lbl}</text>
        ))}
      </svg>
    </div>
  );
});

const ThermoBar = React.memo(({ val, min = 15, max = 35, color, label }) => {
  const p = useAnim(ANIM.hbar, 300);
  const pct = ((val - min) / (max - min)) * 100 * p;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{(val * p).toFixed(1)}°C</div>
      <div style={{ width: 12, height: 60, background: C.accent, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.accentB}`, position: "relative" }}>
        <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${pct}%`, background: `linear-gradient(0deg,${color}88,${color})`, borderRadius: 6 }} />
      </div>
      <div style={{ fontSize: 8, color: C.muted, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", textAlign: "center", width: 40 }}>{label}</div>
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
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" fontWeight="700" fontFamily="'JetBrains Mono', ui-monospace, Consolas, monospace">{displayVal}{unit}</text>
      </svg>
      <span style={{ fontSize: 8, color: C.sub, textAlign: "center", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>{label}</span>
    </div>
  );
});

// Long lists (312 servers, 46 racks…) are shown a page at a time.
const PAGE_SIZE = 12;
const pagerBtn = (disabled) => ({
  padding: "6px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", borderRadius: 8,
  border: `1px solid ${disabled ? C.border : C.blue}`, background: disabled ? C.accent : C.panel,
  color: disabled ? C.muted : C.blue, cursor: disabled ? "default" : "pointer",
});

const AssetTable = React.memo(({ data, columns, title, icon, accent, search, filterStatus }) => {
  const filtered = useMemo(() => {
    return data.filter(row =>
      (filterStatus === "All" || row.status === filterStatus) &&
      Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
    );
  }, [data, search, filterStatus]);

  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [filtered]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Panel>
      <PH icon={icon} title={title} accent={accent} right={`${filtered.length} assets`} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: `linear-gradient(90deg, ${accent || C.blue}1c, ${accent || C.blue}08)` }}>
              {columns.map(col => (
                <th key={col.key} scope="col" style={{ padding: "11px 12px", textAlign: "left", fontWeight: 700, color: C.sub, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", fontSize: 12.5, borderBottom: `2px solid ${accent || C.blue}33`, whiteSpace: "nowrap" }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={row.id ?? i} className="row-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms`, opacity: 0 }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: "11px 12px", borderBottom: `1px solid ${C.accent}`, fontFamily: col.mono ? "'JetBrains Mono', ui-monospace, Consolas, monospace" : "'DM Sans', 'Segoe UI', system-ui, sans-serif", fontSize: col.mono ? 12.5 : 13, color: col.color ? col.color(row[col.key]) : C.text, whiteSpace: col.mono || col.render ? "nowrap" : "normal", minWidth: col.mono || col.render ? undefined : 88, lineHeight: 1.35 }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${C.accent}`, gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: C.muted, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>
            {page * PAGE_SIZE + 1}–{Math.min(filtered.length, (page + 1) * PAGE_SIZE)} of {filtered.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="adx-pg" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={pagerBtn(page === 0)}>‹ Prev</button>
            <span style={{ fontSize: 12.5, color: C.sub, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace", fontWeight: 600 }}>Page {page + 1} / {pages}</span>
            <button type="button" className="adx-pg" disabled={page >= pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))} style={pagerBtn(page >= pages - 1)}>Next ›</button>
          </div>
        </div>
      )}
    </Panel>
  );
}, (prev, next) => prev.data === next.data && prev.search === next.search && prev.filterStatus === next.filterStatus);

// ── DATA ──
// Every list comes from dcimAssetRegister.js (the 5D View's 97 floor devices +
// 567 rack-mounted items = 664 assets); nothing below is typed in by hand.
const SERVERS = SERVER_FLEET.map((s) => ({
  id: s.tag, name: s.model, rack: s.rack, slot: `U${s.u}`, row: s.row, role: s.role, key: s.key,
  cpu: s.cpu, ram: s.ram, disk: s.disk, gpu: s.gpu, temp: s.temp, power: s.powerW,
  status: s.status, ip: s.ip, os: s.os, uptime: s.uptime,
}));
const PDUS = PDU_LIST;
const NETWORK = NETWORK_LIST;
const UPS = UPS_LIST;
const COOLING = COOLING_LIST;
const PAC_ONLY = COOLING.filter((c) => c.type === "PAC");
const GENERATORS = GENERATOR_LIST;
const RACKS = RACK_LIST;
const ROWS = ROW_LIST;
const LINE_COLORS = [C.teal, C.orange, C.blue, C.green, C.red, C.purple, C.indigo, C.pink];
const countIn = (list, f) => list.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});

// Facility power, split the same way as the DCIM tab's PUE: IT load vs the
// rest (cooling + UPS losses + lighting). Whole kW that still add up.
const FACILITY_KW = Math.round(DCIM.facilityKw);                         // 216
const IT_KW = Math.round(DCIM.itKw);                                     // 146
const NON_IT_KW = FACILITY_KW - IT_KW;                                   // 70
const [IT_PCT, NON_IT_PCT] = splitTo100([DCIM.itKw, DCIM.facilityKw - DCIM.itKw]); // 67 / 33
const ALARMED = ASSET_SUMMARY.byStatus.Critical + ASSET_SUMMARY.byStatus.Warning; // 8 = active alarms
const FLEET_HEALTH = [
  ["Online", ASSET_SUMMARY.byStatus.Online, C.green],
  ["Warning", ASSET_SUMMARY.byStatus.Warning, C.yellow],
  ["Critical", ASSET_SUMMARY.byStatus.Critical, C.red],
  ["Standby", ASSET_SUMMARY.byStatus.Standby, C.blue],       // DG sets wait for a mains failure
];
// Online + standby (ready to run) as a share of all assets.
const HEALTHY_PCT = Math.round(((ASSET_SUMMARY.byStatus.Online + ASSET_SUMMARY.byStatus.Standby) / ASSET_SUMMARY.total) * 1000) / 10;

// Assets in service at the end of each of the last six months, and today.
const installedTrail = (list) => {
  const now = new Date();
  const points = [5, 4, 3, 2, 1, 0].map((i) => new Date(now.getFullYear(), now.getMonth() - i, 0));
  points.push(now);
  return points.map((d) => list.filter((a) => new Date(a.installedOn) <= d).length);
};

// ── Power Consumption — Full Pie Chart ──
const PowerPieChart = React.memo(() => {
  const p = useAnim(ANIM.donut, 200);

  const totalLoad = FACILITY_KW;   // whole facility (same figure as the DCIM tab's PUE)
  const itLoad    = IT_KW;         // servers + switches + network room
  const nonItLoad = NON_IT_KW;     // cooling + UPS losses + lighting

  const slices = [
    { label: "IT Load",     val: itLoad,    color: C.blue,   share: IT_PCT     },
    { label: "Non-IT Load", val: nonItLoad, color: C.orange, share: NON_IT_PCT },
  ];

  const size = 156;
  const cx = size / 2, cy = size / 2, r = 70;

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
      const lx = cx + (r * 0.7) * Math.cos(midAngle);
      const ly = cy + (r * 0.7) * Math.sin(midAngle);
      const pct = s.share;
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
      <div style={{ padding: "18px 16px", display: "flex", gap: 22, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>

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
              <text key={`t${i}`} x={s.lx} y={s.ly + 5} textAnchor="middle"
                fill="#fff" fontSize="14" fontWeight="700" fontFamily="'JetBrains Mono', ui-monospace, Consolas, monospace"
                style={{ opacity: p > 0.6 ? 1 : 0 }}>
                {Math.round(p * s.pct)}%
              </text>
            ) : null
          ))}
          {/* Center total label */}
          <circle cx={cx} cy={cy} r={32} fill={C.panel} />
          <text x={cx} y={cy + 2} textAnchor="middle" fill={C.text} fontSize="17" fontWeight="700" fontFamily="'JetBrains Mono', ui-monospace, Consolas, monospace">{Math.round(p * totalLoad)}</text>
          <text x={cx} y={cy + 17} textAnchor="middle" fill={C.muted} fontSize="11" fontWeight="600" fontFamily="'DM Sans', 'Segoe UI', system-ui, sans-serif">kW</text>
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Total row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: `1px solid ${C.accent}` }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.yellow, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.sub, fontWeight: 600, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", width: 90 }}>Total Load</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: ink(C.yellow), fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{Math.round(p * totalLoad)} kW</span>
          </div>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.sub, fontWeight: 600, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", width: 90 }}>{s.label}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: ink(s.color), fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace", lineHeight: 1.15 }}>{Math.round(p * s.val)} kW</span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{Math.round(p * s.share)}%</span>
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
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div className="adx-g3">

      {/* ── REPLACED: Power Consumption Pie Chart ── */}
      <PowerPieChart />

      <Panel>
        <PH icon="🩺" title="Fleet Health Status" accent={C.green} right={`${ASSET_SUMMARY.total} assets`} />
        <div style={{ padding: "18px 14px", display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
          <Donut segs={FLEET_HEALTH.map(([, n, c]) => ({ v: n, c }))} size={132} title="Health" centerVal={`${HEALTHY_PCT}%`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {FLEET_HEALTH.map(([l,n,c],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:11,height:11,borderRadius:"50%",background:c}}/><span style={{fontSize: 13,color:C.sub,fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif",width:76}}>{l}</span><span style={{fontSize: 13.5,fontWeight:700,color:c,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <PH icon="🚨" title="Active Alerts" accent={C.red} right={`${ACTIVE_ALARMS.length} open`} />
        <div style={{ padding: "10px 16px" }}>
          {ACTIVE_ALARMS.map((a, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 0", borderBottom: i<ACTIVE_ALARMS.length-1 ? `1px solid ${C.accent}` : "none" }}>
              <span style={{ fontSize: 13.5, animation: a.severity==="critical" ? "pulse 1.5s infinite" : "none" }}>{a.severity==="critical"?"🔴":a.severity==="major"?"🟠":"🟡"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight:700, color: SEVERITY_COLOR[a.severity], fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{a.device}</div>
                <div style={{ fontSize: 13, color:C.sub, fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>{a.title} — {a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>

    <Panel>
      <PH icon="🗄" title="Rack Space & Power Overview" accent={C.blue} right={`${RACKS.length} racks in ${ROWS.length} rows · Server Room`} />
      <div className="adx-rows" style={{ padding: "16px" }}>
        {ROWS.map((rack, i) => {
          const usedPct = rack.used / rack.units;
          const statusColor = rack.status === "Online" ? C.green : rack.status === "Critical" ? C.red : C.yellow;
          return (
            <div key={i} style={{ background: C.accent, border: `1px solid ${statusColor}44`, borderRadius: 8, padding: "10px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{rack.id}</span>
                <Badge status={rack.status} />
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{rack.racks} racks · {rack.maxPower} kW budget</div>
              <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
                {Array.from({length: 12}, (_,j) => (
                  <div key={j} style={{ width: 11, height: 11, borderRadius: 2, background: j < Math.round(usedPct * 12) ? statusColor : C.accentB }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.sub }}>{rack.used}/{rack.units}U · <span style={{ color: statusColor, fontWeight: 700 }}>{rack.power}kW</span></div>
            </div>
          );
        })}
      </div>
    </Panel>
  </div>
));

// ─── Servers Tab Component ───
// The eight servers that need a look first: any with an alarm, then the busiest.
const SERVER_CARDS = [...SERVERS]
  .sort((a, b) => (a.status === "Online") - (b.status === "Online") || b.cpu - a.cpu)
  .slice(0, 8);

const ServersComponent = React.memo(({ search = "", filterStatus = "All" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ fontSize: 13.5, color: C.sub, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <b style={{ color: C.text }}>{SERVERS.length} rack servers</b> in {RACKS.length} racks · average CPU <b style={{ color: C.cyan }}>{FLEET_AVG.cpu}%</b> · RAM <b style={{ color: C.purple }}>{FLEET_AVG.ram}%</b> · disk <b style={{ color: C.green }}>{FLEET_AVG.disk}%</b> — cards show the 8 busiest (alarms first); every server is in the table below.
    </div>
    <div className="adx-cards">
      {SERVER_CARDS.map((s, i) => (
        <Panel key={i} style={{ padding: 16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight:700, color:C.text, fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{s.id}</div>
              <div style={{ fontSize: 12, color:C.muted }}>{s.name}</div>
            </div>
            <Badge status={s.status} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, margin:"10px 0 12px" }}>
            <RingGauge val={s.cpu}  max={100} color={s.cpu>85?C.red:s.cpu>70?C.yellow:C.blue}   size={72} label="CPU" />
            <RingGauge val={s.ram}  max={100} color={s.ram>85?C.red:s.ram>70?C.yellow:C.purple} size={72} label="RAM" />
            <RingGauge val={s.disk} max={100} color={s.disk>85?C.red:s.disk>70?C.yellow:C.green} size={72} label="Disk" />
          </div>
          <div style={{ fontSize: 12, color:C.sub, display:"flex", justifyContent:"space-between" }}>
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
        { key:"rack",   label:"Rack",     render: r => <span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.rack} · {r.slot}</span> },
        { key:"role",   label:"Role" },
        { key:"status", label:"Status",   render: r => <Badge status={r.status} /> },
        { key:"cpu",    label:"CPU %",    render: r => <HBar label="" val={r.cpu} color={r.cpu>85?C.red:r.cpu>70?C.yellow:C.blue} showVal={false} /> },
        { key:"ram",    label:"RAM %",    render: r => <HBar label="" val={r.ram} color={r.ram>85?C.red:r.ram>70?C.yellow:C.purple} showVal={false} /> },
        { key:"temp",   label:"Temp",     render: r => <span style={{color: r.temp>42?C.red:r.temp>38?C.orange:C.green, fontWeight:700, fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.temp}°C</span> },
        { key:"power",  label:"Power",    render: r => <span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.yellow}}>{r.power}W</span> },
        { key:"os",     label:"OS" },
        { key:"uptime", label:"Uptime",   mono:true },
        { key:"ip",     label:"IP",       mono:true },
      ]}
    />
  </div>
));

// ─── PDU Tab Component ───
// The IT load by the path it takes: each server row through its two row PDUs
// (A + B side), the Network Room and the ToR switches straight from the room
// PDUs. Room PDUs feed the row PDUs, so their kW is not added on top.
const PDU_PATHS = [
  ...ROWS.map((r) => ({ label: `${r.id} (row PDUs)`, kw: r.power })),
  { label: "Network Room + ToR", kw: Math.round((DCIM.networkRoomItKw + DCIM.torKw) * 10) / 10 },
].map((x, i) => ({ ...x, c: LINE_COLORS[i % LINE_COLORS.length] }));

const PDUsComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalPower = IT_KW;   // = PDU1 + PDU2 (A + B side) = the IT load

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="adx-g2b">
        <Panel>
          <PH icon="📈" title="PDU Load Comparison (Current vs Max Ampere)" accent={C.orange} />
          <div style={{ padding: "16px 18px" }}>
            {PDUS.map((pdu, i) => {
              const pct = (pdu.ampere / pdu.maxAmp) * 100;
              const color = pct > 85 ? C.red : pct > 70 ? C.yellow : C.orange;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: C.sub, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{pdu.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{pdu.ampere}A / {pdu.maxAmp}A</span>
                  </div>
                  <HBar label="" val={pct} color={color} showVal={false} />
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PH icon="🍩" title="IT Power through the PDUs" accent={C.orange} right="PDU1 (A) + PDU2 (B)" />
          <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
            <Donut segs={PDU_PATHS.map(x => ({ v: x.kw, c: x.c }))} size={140} title="IT load" centerVal={`${totalPower}kW`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PDU_PATHS.map((p,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:p.c }} />
                  <span style={{ fontSize: 13, color:C.sub, width:118 }}>{p.label}</span>
                  <span style={{ fontSize: 13, fontWeight:700, color:p.c, fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{p.kw}kW</span>
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
          {key:"ampere",label:"Current",render:r=><span style={{color:r.ampere/r.maxAmp>0.85?C.red:r.ampere/r.maxAmp>0.7?C.yellow:C.green,fontWeight:700,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.ampere}A</span>},
          {key:"maxAmp",label:"Max",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.maxAmp}A</span>},
          {key:"outlets",label:"Outlets",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.active}/{r.outlets}</span>},
          {key:"voltage",label:"Voltage",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.orange}}>{r.voltage}V</span>},
          {key:"phase",label:"Phase"},
          {key:"powerKW",label:"Power",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.yellow,fontWeight:700}}>{r.powerKW}kW</span>},
        ]}
      />
    </div>
  );
});

// ─── Network Tab Component ───
// Active network devices by type (floor kit + the switches inside the racks).
const NET_TYPES = Object.entries(countIn(NETWORK, (n) => n.type)).map(([l, n], i) => [l, n, LINE_COLORS[i % LINE_COLORS.length]]);
const PASSIVE_NET = [["Patch Panel", "patch panels"], ["Fibre LIU", "fibre LIUs"], ["Cable Manager", "cable managers"]]
  .map(([type, label]) => [label, ASSET_SUMMARY.byType[type] || 0]);

const NetworkComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalThroughput = Math.round(NETWORK.reduce((a,n)=>a+n.throughput,0)/NETWORK.length);
  const totalErrors     = NETWORK.reduce((a,n)=>a+n.errors,0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="adx-g2">
        <Panel>
          <PH icon="📡" title="Throughput by Device" accent={C.cyan} right={`avg ${totalThroughput}% · ${NETWORK.length} devices`} />
          <div style={{ padding: "16px 18px", maxHeight: 420, overflowY: "auto" }}>
            {NETWORK.map((dev, i) => {
              const color = dev.throughput > 80 ? C.red : dev.throughput > 60 ? C.yellow : C.cyan;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>{dev.id} <span style={{ color: C.muted }}>({dev.type})</span></span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{dev.throughput}%</span>
                  </div>
                  <HBar label="" val={dev.throughput} color={color} showVal={false} />
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PH icon="🔌" title="Device Type Distribution" accent={C.cyan} />
          <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
            <Donut segs={NET_TYPES.map(([, n, c]) => ({ v: n, c }))} size={132} centerVal={`${NETWORK.length}`} title="devices" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {NET_TYPES.map(([l,n,c],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:11,height:11,borderRadius:"50%",background:c}}/><span style={{fontSize: 13,color:C.sub,width:150}}>{l}</span><span style={{fontSize: 13.5,fontWeight:700,color:c,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ margin: "0 12px 12px", padding: "6px 8px", background: C.accent, borderRadius: 6, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
            Passive, not in the table: {PASSIVE_NET.map(([label, n]) => `${n} ${label}`).join(" · ")} — mounted in the racks.
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
          {key:"ports",label:"Ports",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.active}/{r.ports}</span>},
          {key:"speed",label:"Speed",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.cyan}}>{r.speed}</span>},
          {key:"throughput",label:"Throughput",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:84,height:8,background:C.accent,borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${r.throughput}%`,height:"100%",background:r.throughput>80?C.red:r.throughput>60?C.yellow:C.blue,borderRadius:3}}/>
              </div>
              <span style={{fontSize: 13,color:C.sub,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.throughput}%</span>
            </div>
          )},
          {key:"rxGbps",label:"RX",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.green}}>{r.rxGbps}G</span>},
          {key:"txGbps",label:"TX",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.blue}}>{r.txGbps}G</span>},
          {key:"errors",label:"Errors",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.errors>0?C.red:C.green,fontWeight:700}}>{r.errors}</span>},
          {key:"vlan",label:"VLANs",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",fontSize: 13,color:C.purple}}>{r.vlan}</span>},
        ]}
      />
    </div>
  );
});

// ─── Storage Tab Component ───
// The 5D View floor has no SAN / NAS / tape library, so storage here is the
// disks inside the rack servers. Fleet average = the DCIM tab's "Storage".
const DISK_BANDS = [
  ["Below 70%", SERVERS.filter(s => s.disk < 70).length, C.green],
  ["70 – 85%", SERVERS.filter(s => s.disk >= 70 && s.disk <= 85).length, C.yellow],
  ["Above 85%", SERVERS.filter(s => s.disk > 85).length, C.red],
];
const DISK_BY_ROW = ROWS.map((r) => {
  const row = r.id.replace("Row ", "");
  const list = SERVERS.filter(s => s.row === row);
  return { id: r.id, n: list.length, avg: list.length ? Math.round(list.reduce((a, s) => a + s.disk, 0) / list.length) : 0 };
}).filter(r => r.n > 0);
const BAYS = { serverA: "5 drive bays", serverB: "8 drive bays", serverC: "PCIe expansion" };   // as in the model specs
const SERVERS_BY_DISK = [...SERVERS].sort((a, b) => b.disk - a.disk);

const StorageComponent = React.memo(({ search = "", filterStatus = "All" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ padding: "8px 12px", background: "#f3eeff", border: `1px solid ${C.purple}33`, borderRadius: 10, fontSize: 13.5, color: C.sub, lineHeight: 1.5 }}>
      💾 No SAN, NAS or tape library is placed on the 5D View floor, so storage here is the local disks of the <b style={{ color: C.text }}>{SERVERS.length} rack servers</b>.
      Fleet average disk use: <b style={{ color: C.purple }}>{FLEET_AVG.disk}%</b> (the same "Storage" figure as the Dashboard's DCIM tab).
    </div>
    <div className="adx-g2">
      <Panel>
        <PH icon="📊" title="Disk Utilization by Row" accent={C.purple} right="average of the servers in each row" />
        <div style={{ padding: "16px 18px" }}>
          {DISK_BY_ROW.map((r, i) => {
            const color = r.avg > 85 ? C.red : r.avg > 70 ? C.yellow : C.purple;
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>{r.id} <span style={{ color: C.muted }}>({r.n} servers)</span></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{r.avg}%</span>
                </div>
                <HBar label="" val={r.avg} color={color} showVal={false} />
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel>
        <PH icon="🍩" title="Servers by Disk Use" accent={C.purple} />
        <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
          <Donut segs={DISK_BANDS.map(([, n, c]) => ({ v: n, c }))} size={132} centerVal={`${FLEET_AVG.disk}%`} title="avg used" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DISK_BANDS.map(([l, n, c], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: c }} /><span style={{ fontSize: 13, color: C.sub, width: 90 }}>{l}</span><span style={{ fontSize: 13.5, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
    <AssetTable
      data={SERVERS_BY_DISK} icon="💾" title="Server Disk Inventory (fullest first)" accent={C.purple}
      search={search} filterStatus={filterStatus}
      columns={[
        {key:"id",label:"ID",mono:true},
        {key:"name",label:"Model"},
        {key:"rack",label:"Rack",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.rack} · {r.slot}</span>},
        {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
        {key:"disk",label:"Disk Used",render:r=>(
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:96,height:8,background:C.accent,borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${r.disk}%`,height:"100%",background:r.disk>85?C.red:r.disk>70?C.yellow:C.purple,borderRadius:3}}/>
            </div>
            <span style={{fontSize: 13,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.purple}}>{r.disk}%</span>
          </div>
        )},
        {key:"key",label:"Drives",render:r=><span style={{fontSize: 13,color:C.sub}}>{BAYS[r.key] || "—"}</span>},
        {key:"role",label:"Role"},
        {key:"os",label:"OS"},
      ]}
    />
  </div>
));

// ─── UPS Tab Component ───
const UPSTabComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalCap  = UPS.reduce((a,u)=>a+u.capacity,0);
  const totalLoad = UPS.reduce((a,u)=>a+u.load,0);
  const avgBatt   = Math.round(UPS.reduce((a,u)=>a+u.battery,0)/UPS.length);
  const battBands = [
    { v: UPS.filter(u => u.battery >= 75).length, c: C.green },
    { v: UPS.filter(u => u.battery >= 50 && u.battery < 75).length, c: C.yellow },
    { v: UPS.filter(u => u.battery < 50).length, c: C.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="adx-g2">
        <Panel>
          <PH icon="📊" title="UPS Load vs Capacity" accent={C.green} right={`2N · ${IT_KW} kW on ${DCIM.upsUsableKw} kW usable (${Math.round(DCIM.upsLoadPct)}%)`} />
          <div style={{ padding: "16px 18px" }}>
            {UPS.map((u, i) => {
              const loadPct = Math.round((u.load / u.capacity) * 100);
              const color   = loadPct > 85 ? C.red : loadPct > 70 ? C.yellow : C.green;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>{u.id} — {u.side}-side · battery {u.batteryTag}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{u.load}/{u.capacity}kVA ({loadPct}%)</span>
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
          <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
            <Donut segs={battBands} size={132} centerVal={`${avgBatt}%`} title="avg battery" />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {UPS.map((u,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize: 13, color:C.sub, fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace", width:70 }}>{u.batteryTag}</span>
                  <div style={{ width:110, height:9, background:C.accent, borderRadius:5 }}>
                    <div style={{ width:`${u.battery}%`, height:"100%", background:u.battery<50?C.red:u.battery<75?C.yellow:C.green, borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight:700, color:u.battery<50?C.red:u.battery<75?C.yellow:C.green, fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{u.battery}%</span>
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
          {key:"capacity",label:"Capacity",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.green}}>{r.capacity}kVA</span>},
          {key:"load",label:"Load",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:76,height:8,background:C.accent,borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${(r.load/r.capacity)*100}%`,height:"100%",background:r.load/r.capacity>0.85?C.red:r.load/r.capacity>0.7?C.yellow:C.blue,borderRadius:3}}/>
              </div>
              <span style={{fontSize: 13,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.load}kVA</span>
            </div>
          )},
          {key:"battery",label:"Battery",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.battery<50?C.red:r.battery<75?C.yellow:C.green,fontWeight:700}}>{r.batteryTag} · {r.battery}%</span>},
          {key:"runtime",label:"Runtime",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.purple}}>{r.runtime}min</span>},
          {key:"inputV",label:"Input V",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.blue}}>{r.inputV}V</span>},
          {key:"temp",label:"Temp",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.temp>32?C.orange:C.green}}>{r.temp}°C</span>},
          {key:"mode",label:"Mode"},
        ]}
      />
    </div>
  );
});

// ─── Cooling Tab Component ───
const CoolingTabComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const avgTemp    = (PAC_ONLY.reduce((a,c)=>a+c.actTemp,0)/PAC_ONLY.length).toFixed(1);
  const avgHum     = Math.round(PAC_ONLY.reduce((a,c)=>a+c.humidity,0)/PAC_ONLY.length);
  const heatKw     = Math.round(DCIM.serverRoomItKw);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="adx-g2">
        <Panel>
          <PH icon="🌡" title="Return Air Temperature by PAC Unit (°C)" accent={C.teal} right={`supply 18°C · avg return ${avgTemp}°C`} />
          <div style={{ padding: "16px 18px" }}>
            <MultiLineChart
              datasets={PAC_ONLY.map((c, i) => ({ data: c.tempHistory, color: LINE_COLORS[i] }))}
              h={200} unit="°"
              labels={["T-6","T-5","T-4","T-3","T-2","T-1","Now"]}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              {PAC_ONLY.map((c,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:16,height:4,background:LINE_COLORS[i],borderRadius:2}}/>
                  <span style={{fontSize: 12,color:C.muted}}>{c.id} · {c.actTemp}°C</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <PH icon="💧" title="Humidity Levels" accent={C.teal} right={`avg ${avgHum}% RH`} />
          <div style={{ padding: "16px 18px" }}>
            {PAC_ONLY.map((c, i) => {
              const color = c.humidity > 50 ? C.orange : c.humidity > 48 ? C.yellow : C.blue;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>{c.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{c.humidity}%</span>
                  </div>
                  <HBar label="" val={c.humidity} max={100} color={color} showVal={false} />
                </div>
              );
            })}
            <div style={{ padding: "8px", background: C.accent, borderRadius: 6, marginTop: 8 }}>
              <div style={{ fontSize: 12, color: C.muted }}>Target Range</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>40% – 60% RH</div>
            </div>
          </div>
        </Panel>
      </div>
      <AssetTable
        data={COOLING} icon="❄️" title={`Cooling Unit Inventory · ${heatKw} kW of Server Room heat`} accent={C.teal}
        search={search} filterStatus={filterStatus}
        columns={[
          {key:"id",label:"ID",mono:true},
          {key:"name",label:"Name"},
          {key:"type",label:"Type"},
          {key:"rack",label:"Location",mono:true},
          {key:"serves",label:"Serves"},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"actTemp",label:"Return",render:r=><span style={{fontWeight:700,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.type!=="PAC"?C.green:r.actTemp>=27?C.red:r.actTemp>=26?C.orange:C.green}}>{r.actTemp}°C</span>},
          {key:"setTemp",label:"Supply",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.blue}}>{r.setTemp}°C</span>},
          {key:"humidity",label:"Humidity",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.humidity>50?C.orange:C.teal}}>{r.humidity == null ? "—" : `${r.humidity}%`}</span>},
          {key:"loadKw",label:"Load",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:76,height:8,background:C.accent,borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${Math.min(100,r.loadPct)}%`,height:"100%",background:r.loadPct>90?C.red:r.loadPct>75?C.orange:C.teal,borderRadius:3}}/>
              </div>
              <span style={{fontSize: 13,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.loadKw}/{r.capacityKw}kW ({Math.round(r.loadPct)}%)</span>
            </div>
          )},
          {key:"power",label:"Power In",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.type==="PAC"?C.muted:C.yellow}}>{r.type==="PAC" ? "via CH-01" : `${r.power}kW`}</span>},
          {key:"airflow",label:"Airflow",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.teal}}>{r.airflow == null ? "—" : `${r.airflow}m³/h`}</span>},
        ]}
      />
    </div>
  );
});

// ─── Generator Tab Component ───
// Both DG sets are ready to start (GEN2 carries a low-fuel warning).
const GEN_STATUS = Object.entries(countIn(GENERATORS, (g) => g.status)).map(([l, n]) => [l, n, l === "Standby" ? C.blue : l === "Warning" ? C.yellow : l === "Critical" ? C.red : C.green]);
const GEN_KVA = GENERATORS.reduce((a, g) => a + g.kva, 0);
const GeneratorTabComponent = React.memo(({ search = "", filterStatus = "All" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div className="adx-g2">
      <Panel>
        <PH icon="📊" title="Generator Metrics Comparison" accent={C.indigo} />
        <div style={{ padding: "16px 18px" }}>
          {[
            { label: "Fuel Level (%)",    g1: GENERATORS[0].fuel,         g2: GENERATORS[1].fuel,         max: 100, colors: [C.green,  C.blue]   },
            { label: "Coolant Temp (°C)", g1: GENERATORS[0].coolantTemp,  g2: GENERATORS[1].coolantTemp,  max: 80,  colors: [C.orange, C.teal]   },
            { label: "Oil Pressure (PSI)",g1: GENERATORS[0].oilPressure,  g2: GENERATORS[1].oilPressure,  max: 80,  colors: [C.purple, C.cyan]   },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 5 }}>{m.label}</div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{GENERATORS[0].id}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.colors[0], fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{m.g1}</span>
                </div>
                <HBar label="" val={(m.g1/m.max)*100} color={m.colors[0]} showVal={false} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{GENERATORS[1].id}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.colors[1], fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{m.g2}</span>
                </div>
                <HBar label="" val={(m.g2/m.max)*100} color={m.colors[1]} showVal={false} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <PH icon="⚙️" title="Generator Status Overview" accent={C.indigo} />
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Donut segs={GEN_STATUS.map(([, n, c]) => ({ v: n, c }))} size={132} centerVal={`${GENERATORS.length}/${GENERATORS.length}`} title="ready" />
          </div>
          {GENERATORS.map((g, i) => (
            <div key={i} style={{ padding: "8px 10px", background: C.accent, borderRadius: 8, marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace", color: C.text }}>{g.id}</span>
                <Badge status={g.status} />
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 13, color: C.sub }}>
                <span>⛽ {g.fuel}%</span><span>🌡 {g.coolantTemp}°C</span><span>⚙️ {g.kva}kVA</span>
              </div>
            </div>
          ))}
          <div style={{ padding: "8px", background: "#eef3ff", borderRadius: 8, marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.blue, fontWeight: 700 }}>⚡ Total Backup Capacity</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.indigo, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{GEN_KVA.toLocaleString("en-IN")} kVA</div>
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
        {key:"kva",label:"Capacity",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.indigo,fontWeight:700}}>{r.kva}kVA</span>},
        {key:"fuel",label:"Fuel",render:r=>(
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:84,height:8,background:C.accent,borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${r.fuel}%`,height:"100%",background:r.fuel<65?C.orange:C.green,borderRadius:3}}/>
            </div>
            <span style={{fontSize: 13,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.fuel<65?C.orange:C.green,fontWeight:700}}>{r.fuel}%</span>
          </div>
        )},
        {key:"voltage",label:"Voltage",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.blue}}>{r.voltage}V</span>},
        {key:"freq",label:"Freq",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.cyan}}>{r.freq}Hz</span>},
        {key:"coolantTemp",label:"Coolant",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.coolantTemp>50?C.red:C.green}}>{r.coolantTemp}°C</span>},
        {key:"oilPressure",label:"Oil PSI",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.oilPressure<25?C.red:C.cyan}}>{r.oilPressure} PSI</span>},
        {key:"mode",label:"Mode"},
        {key:"lastTest",label:"Last Test",mono:true},
        {key:"runtime",label:"Runtime",mono:true},
      ]}
    />
  </div>
));

// ─── Racks Tab Component ───
// 46 racks in six rows of the Server Room: the charts sum them per row, the
// table lists every rack. U figures are the 5D View STORAGE view's.
const RACK_TYPE_LABEL = { ndr: "Network Distribution Rack", rdr: "Row Distribution Rack", rack: "Server Rack" };
const RACKS_BY_ROW = ROWS.map((r, i) => [r.id, r.racks, LINE_COLORS[i % LINE_COLORS.length]]);

const RacksTabComponent = React.memo(({ search = "", filterStatus = "All" }) => {
  const totalU   = RACKS.reduce((a,r)=>a+r.units,0);
  const usedU    = RACKS.reduce((a,r)=>a+r.used,0);
  const totalPwr = RACKS.reduce((a,r)=>a+r.power,0).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="adx-g3r">
        <Panel>
          <PH icon="📊" title="Rack Space & Power Utilization by Row" accent={C.blue} right={`${usedU}/${totalU}U used · ${totalPwr} kW`} />
          <div style={{ padding: "16px 18px" }}>
            {ROWS.map((rack, i) => {
              const spacePct = (rack.used / rack.units) * 100;
              const pwrPct   = (rack.power / rack.maxPower) * 100;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace" }}>{rack.id}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{rack.used}/{rack.units}U · {rack.power}/{rack.maxPower} kW</span>
                  </div>
                  <div style={{ marginBottom: 2 }}>
                    <HBar label="" val={spacePct} color={spacePct>90?C.red:spacePct>75?C.yellow:C.blue} showVal={false} />
                  </div>
                  <HBar label="" val={pwrPct} color={pwrPct>90?C.red:pwrPct>75?C.orange:C.green} showVal={false} />
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{width:16,height:4,background:C.blue,borderRadius:2}}/><span style={{fontSize: 12,color:C.muted}}>Space</span></div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{width:16,height:4,background:C.green,borderRadius:2}}/><span style={{fontSize: 12,color:C.muted}}>Power</span></div>
            </div>
          </div>
        </Panel>
        <Panel>
          <PH icon="🌡" title="Row Temperature Map" accent={C.blue} right="inlet avg → hottest exhaust" />
          <div style={{ padding: "16px 18px" }}>
            {ROWS.map((rack, i) => (
              <div key={i} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace", color: C.sub, width: 56 }}>{rack.id}</span>
                <div style={{ flex: 1, display: "flex", gap: 2 }}>
                  {Array.from({length:20}, (_,j)=>{
                    const temp = rack.tempFront + ((rack.tempRear - rack.tempFront) * (j/19));
                    const intensity = (temp - 18) / (38 - 18);
                    const r = Math.round(intensity * 230);
                    const b = Math.round((1-intensity) * 200);
                    return <div key={j} style={{ flex:1, height:14, background:`rgb(${r},${Math.round(50*(1-intensity))},${b})`, borderRadius:1, opacity:0.8 }} />;
                  })}
                </div>
                <span style={{ fontSize: 12, color: C.muted, width: 54 }}>{rack.tempRear}°C</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 11.5, color: C.blue }}>← Cool (Front)</span>
              <span style={{ fontSize: 11.5, color: C.red }}>Hot (Rear) →</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <PH icon="🍩" title="Racks by Row" accent={C.blue} />
          <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Donut segs={RACKS_BY_ROW.map(([, n, c]) => ({ v: n, c }))} size={124} centerVal={`${RACKS.length}`} title="racks" />
            <div style={{ width: "100%" }}>
              {RACKS_BY_ROW.map(([l,n,c],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom: i<RACKS_BY_ROW.length-1?`1px solid ${C.accent}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
                    <span style={{fontSize: 13,color:C.sub}}>{l}{i === 0 ? " (NDR)" : ""}</span>
                  </div>
                  <span style={{fontSize: 13.5,fontWeight:700,color:c,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{n}</span>
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
          {key:"kind",label:"Type",render:r=><span style={{fontSize: 13,color:C.sub}}>{RACK_TYPE_LABEL[r.kind]}</span>},
          {key:"room",label:"Room"},
          {key:"status",label:"Status",render:r=><Badge status={r.status}/>},
          {key:"used",label:"U Used",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace"}}>{r.used}/{r.units} <span style={{color:C.blue}}>+{r.reserved} rsv</span></span>},
          {key:"free",label:"U Free",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.free<=5?C.red:r.free<=10?C.orange:C.green,fontWeight:700}}>{r.free}</span>},
          {key:"power",label:"Power",render:r=>(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:76,height:8,background:C.accent,borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${(r.power/r.maxPower)*100}%`,height:"100%",background:r.power/r.maxPower>0.9?C.red:r.power/r.maxPower>0.75?C.orange:C.green,borderRadius:3}}/>
              </div>
              <span style={{fontSize: 13,fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.yellow}}>{r.power}/{r.maxPower}kW</span>
            </div>
          )},
          {key:"tempFront",label:"Front Temp",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.tempFront>27?C.red:r.tempFront>25?C.orange:C.green}}>{r.tempFront}°C</span>},
          {key:"tempRear",label:"Rear Temp",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:r.tempRear>40?C.red:r.tempRear>35?C.orange:C.green,fontWeight:700}}>{r.tempRear}°C</span>},
          {key:"airflow",label:"Airflow",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.teal}}>{r.airflow}m³/h</span>},
          {key:"weight",label:"Weight",render:r=><span style={{fontFamily:"'JetBrains Mono', ui-monospace, Consolas, monospace",color:C.purple}}>{r.weight}kg</span>},
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
    { label: "Total Assets",     val: ASSET_SUMMARY.total,          suf: "",    dec: 0, color: C.blue,   bg: "#eef3ff", icon: "📦", spark: installedTrail(ASSETS) },
    { label: "Online Assets",    val: ASSET_SUMMARY.byStatus.Online, suf: "",    dec: 0, color: C.green,  bg: "#eefaf5", icon: "✅", spark: installedTrail(ASSETS.filter(a => a.status === "Online")) },
    { label: "Critical/Warning", val: ALARMED,                       suf: "",    dec: 0, color: C.red,    bg: "#fff0f2", icon: "⚠️", spark: [4,3,3,2,1,1,0].map(d => Math.max(0, ALARMED - d)), blink: true },
    { label: "Total Power (kW)", val: FACILITY_KW,                   suf: " kW", dec: 0, color: C.yellow, bg: "#fffbee", icon: "⚡", spark: [0.96,0.97,0.99,0.98,0.99,1,1].map(f => Math.round(DCIM.facilityKw * f)) },
    { label: "Avg CPU Load",     val: FLEET_AVG.cpu,                 suf: "%",   dec: 1, color: C.cyan,   bg: "#eefaff", icon: "💻", spark: [4,3,3,2,1,1,0].map(d => FLEET_AVG.cpu - d) },
    { label: "Storage Used",     val: FLEET_AVG.disk,                suf: "%",   dec: 0, color: C.purple, bg: "#f3eeff", icon: "💾", spark: [5,4,3,3,2,1,0].map(d => FLEET_AVG.disk - d) },
  ], []);

  const tabs = useMemo(() => [
    { id: "overview",   label: "Overview",   icon: "🏠", color: C.blue },
    { id: "servers",    label: "Servers",    icon: "🖥", color: C.blue },
    { id: "pdu",        label: "PDU",        icon: "🔌", color: C.orange },
    { id: "network",    label: "Network",    icon: "🌐", color: C.cyan },
    { id: "storage",    label: "Storage",    icon: "💾", color: C.purple },
    { id: "ups",        label: "UPS",        icon: "🔋", color: C.green },
    { id: "cooling",    label: "Cooling",    icon: "❄️", color: C.teal },
    { id: "generator",  label: "Generators", icon: "⚙️", color: C.indigo },
    { id: "racks",      label: "Racks",      icon: "🗄", color: C.pink },
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
    <div className="adx-root" style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", color: C.text, fontSize: 14 }}>
      <style>{css}</style>

      {/* KPI STRIP */}
      <div className="adx-kpis" style={{ padding: "16px 18px", background: "linear-gradient(180deg,#e9f0fb,#eef2f9)", borderBottom: `1px solid ${C.border}` }}>
        {kpis.map((k, i) => (
          <div key={i} className="fade-up" style={{ background: `linear-gradient(145deg, ${k.color}1f 0%, #ffffff 58%)`, border: `1.5px solid ${k.color}40`, borderRadius: 14, padding: "14px 16px 12px", boxShadow: C.shadow, animationDelay: `${i * ANIM.kpiStagger}ms`, opacity: 0, position: "relative", overflow: "hidden", minWidth: 0 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${k.color},${k.color}55)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: `linear-gradient(135deg,${k.color}2e,${k.color}12)`, border: `1px solid ${k.color}40`, flexShrink: 0 }}>{k.icon}</span>
              <span style={{ fontSize: 13, color: C.sub, fontWeight: 700, lineHeight: 1.25 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: ink(k.color), lineHeight: 1.05, fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace", marginTop: 10, whiteSpace: "nowrap", ...(k.blink ? { animation: "pulse 2s infinite" } : {}) }}>
              <Ctr end={k.val} dec={k.dec} suf={k.suf} />
            </div>
            <div style={{ marginTop: 6 }}><SparkFill data={k.spark} color={k.color} h={30} delay={i * ANIM.kpiStagger} /></div>
          </div>
        ))}
      </div>

      {/* TABS — stay under the portal header while the page scrolls */}
      <div role="tablist" aria-label="Asset categories" style={{ display: "flex", gap: 6, padding: "10px 18px", background: C.panel, borderBottom: `1px solid ${C.border}`, overflowX: "auto", position: "sticky", top: 64, zIndex: 5, boxShadow: "0 4px 12px rgba(20,40,100,0.06)" }}>
        {tabs.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={on} className="adx-tab" onClick={() => setTab(t.id)} style={{
              padding: "9px 16px", border: on ? `1px solid ${t.color}` : `1px solid transparent`, borderRadius: 10, cursor: "pointer",
              background: on ? `linear-gradient(135deg,${t.color},${t.color}cc)` : "transparent",
              fontSize: 14, fontWeight: on ? 700 : 600,
              color: on ? "#fff" : C.sub,
              boxShadow: on ? `0 4px 12px ${t.color}44` : "none",
              fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", display: "flex", alignItems: "center", gap: 8,
              transition: "all .2s", whiteSpace: "nowrap",
            }}>
              <span aria-hidden="true" style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "18px" }}>
        {renderTab}
      </div>
    </div>
  );
}