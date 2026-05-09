import React, { useState, useEffect, useRef, useCallback } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg:#f0f2f5; --bg2:#e8eaee;
  --surface:#ffffff; --surface2:#f7f8fa;
  --border:#dde1e8; --border2:#c8cdd8;
  --text:#1a2030; --text2:#4a5568; --text3:#8896b0;
  --green:#10b981; --green-bg:#ecfdf5; --green-border:#a7f3d0;
  --amber:#f59e0b; --amber-bg:#fffbeb; --amber-border:#fcd34d;
  --red:#ef4444;   --red-bg:#fef2f2;   --red-border:#fecaca;
  --blue:#3b82f6;  --blue-bg:#eff6ff;  --blue-border:#bfdbfe;
  --purple:#8b5cf6;
  --slot-bg:#e9ebf0; --slot-border:#d1d5db;
  --pdu-a:#3b82f6; --pdu-b:#8b5cf6; --pdu-c:#10b981; --pdu-d:#f59e0b;
}
.rs-wrap * { box-sizing:border-box; margin:0; padding:0; }
.rs-wrap {
  background:var(--bg); font-family:'Inter',sans-serif; color:var(--text);
  height: 100vh; /* Use full viewport height */
  display:flex; flex-direction:column; 
  padding:28px 16px 60px;
  overflow: hidden; /* Prevent outer scroll */
}
.rs-header {
  width:100%; max-width:1280px; margin-bottom:24px;
  display:flex; align-items:center; justify-content:space-between;
  padding-bottom:16px; border-bottom:1px solid var(--border); gap:16px; flex-wrap:wrap;
  flex-shrink: 0; /* Prevent header from shrinking */
}
.rs-title h1 { font-size:1.5rem; font-weight:700; color:var(--text); letter-spacing:-0.02em; }
.rs-title h1 span { color:var(--blue); }
.rs-title p { font-size:0.72rem; color:var(--text3); margin-top:2px; }
.rs-sys-status { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.rs-status-chip { display:flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:4px 12px; font-size:0.68rem; font-weight:500; color:var(--text2); }
.rs-dot { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 0 2px #a7f3d0; animation:rs-pulse 2s infinite; }
@keyframes rs-pulse { 0%,100%{box-shadow:0 0 0 2px #a7f3d0} 50%{box-shadow:0 0 0 4px #d1fae5} }

/* FIXED: Make main content area scrollable */
.rs-main { 
  width:100%; 
  max-width:1280px; 
  margin: 0 auto;
  display:grid; 
  grid-template-columns:300px 1fr; 
  gap:20px;
  overflow-y: auto; /* Make main content scrollable */
  overflow-x: hidden;
  flex: 1; /* Take remaining height */
  min-height: 0; /* Important for flex children to scroll */
  padding-right: 4px; /* Space for scrollbar */
}

/* Custom scrollbar for main content */
.rs-main::-webkit-scrollbar {
  width: 6px;
}
.rs-main::-webkit-scrollbar-track {
  background: var(--bg2);
  border-radius: 3px;
}
.rs-main::-webkit-scrollbar-thumb {
  background: #c5cdd8;
  border-radius: 3px;
}
.rs-main::-webkit-scrollbar-thumb:hover {
  background: #a0aab8;
}

.rs-panel-card { 
  background:var(--surface); 
  border:1px solid var(--border); 
  border-radius:10px; 
  overflow:hidden; 
  box-shadow:0 1px 3px rgba(0,0,0,.06);
}
.rs-card-header { padding:11px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; font-size:.72rem; font-weight:600; color:var(--text2); letter-spacing:.04em; text-transform:uppercase; background:var(--surface2); }
.rs-hicon { width:18px; height:18px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:10px; }
.rs-hicon-blue{background:var(--blue-bg);color:var(--blue)} .rs-hicon-green{background:var(--green-bg);color:var(--green)} .rs-hicon-purple{background:#f5f3ff;color:var(--purple)}
.rs-cap-section { padding:16px; }
.rs-cap-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
.rs-cap-big { font-size:2.6rem; font-weight:700; color:var(--text); line-height:1; font-family:'JetBrains Mono',monospace; }
.rs-cap-big.warn{color:var(--amber)} .rs-cap-big.crit{color:var(--red)}
.rs-cap-label { font-size:.65rem; color:var(--text3); font-weight:500; margin-top:3px; text-transform:uppercase; letter-spacing:.05em; }
.rs-cap-free-badge { background:var(--blue-bg); border:1px solid var(--blue-border); border-radius:8px; padding:5px 10px; text-align:center; }
.rs-cap-free-badge .val { font-size:1.3rem; font-weight:700; color:var(--blue); font-family:'JetBrains Mono',monospace; line-height:1; }
.rs-cap-free-badge .lbl { font-size:.58rem; color:var(--blue); font-weight:500; text-transform:uppercase; letter-spacing:.05em; }
.rs-bar-track { height:7px; background:var(--bg2); border-radius:4px; overflow:hidden; margin-bottom:12px; border:1px solid var(--border); }
.rs-bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,var(--blue),#60a5fa); transition:width .45s cubic-bezier(.4,0,.2,1),background .3s; }
.rs-bar-fill.warn{background:linear-gradient(90deg,var(--amber),#fbbf24)} .rs-bar-fill.crit{background:linear-gradient(90deg,var(--red),#f87171)}
.rs-stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.rs-stat-tile { background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:10px 12px; }
.rs-stat-tile .val { font-size:1.3rem; font-weight:700; font-family:'JetBrains Mono',monospace; line-height:1; }
.rs-stat-tile .lbl { font-size:.58rem; color:var(--text3); font-weight:500; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
.v-blue{color:var(--blue)} .v-green{color:var(--green)} .v-amber{color:var(--amber)} .v-purple{color:var(--purple)}
.rs-add-section { padding:14px 16px; }
.rs-form-row { display:flex; flex-direction:column; gap:5px; margin-bottom:11px; }
.rs-form-row label { font-size:.65rem; font-weight:600; color:var(--text2); letter-spacing:.03em; }
.rs-form-row input { background:var(--surface2); border:1px solid var(--border); border-radius:7px; color:var(--text); font-family:'JetBrains Mono',monospace; font-size:.78rem; padding:8px 11px; outline:none; transition:border-color .2s,box-shadow .2s; }
.rs-form-row input:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-bg); }
.rs-form-row input::placeholder { color:var(--text3); }
.rs-type-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
.rs-type-card { background:var(--surface2); border:1.5px solid var(--border); border-radius:8px; padding:9px 5px; text-align:center; cursor:pointer; transition:all .15s; user-select:none; }
.rs-type-card:hover { border-color:var(--blue); background:var(--blue-bg); }
.rs-type-card.active { border-color:var(--blue); background:var(--blue-bg); box-shadow:0 0 0 3px #bfdbfe55; }
.rs-type-card .tc-sz { font-size:1.1rem; font-weight:700; color:var(--blue); font-family:'JetBrains Mono',monospace; line-height:1; }
.rs-type-card .tc-lb { font-size:.55rem; color:var(--text3); font-weight:500; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
.rs-btn-install { width:100%; padding:10px; border-radius:8px; background:var(--blue); color:#fff; border:none; font-family:'Inter',sans-serif; font-weight:600; font-size:.82rem; cursor:pointer; transition:all .18s; }
.rs-btn-install:hover { background:#2563eb; box-shadow:0 4px 12px #3b82f640; }
.rs-btn-install:active { transform:scale(.98); }
.rs-pdu-section { padding:14px 16px; }
.rs-pdu-slots-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
.rs-pdu-slot-btn { border:1.5px dashed var(--border2); border-radius:8px; padding:10px 6px; text-align:center; cursor:pointer; transition:all .15s; background:var(--surface2); position:relative; }
.rs-pdu-slot-btn:hover:not(.pdu-occupied) { border-color:var(--blue); background:var(--blue-bg); }
.rs-pdu-slot-btn.pdu-occupied { border-style:solid; cursor:default; }
.rs-pdu-slot-btn .slot-pos { font-size:.58rem; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--text3); margin-bottom:4px; }
.rs-pdu-slot-btn .slot-icon { font-size:1.2rem; }
.rs-pdu-slot-btn .slot-name { font-size:.6rem; font-weight:600; margin-top:2px; }
.rs-pdu-slot-btn .slot-remove { position:absolute; top:4px; right:6px; font-size:.6rem; cursor:pointer; color:var(--red); opacity:0; transition:opacity .15s; }
.rs-pdu-slot-btn.pdu-occupied:hover .slot-remove { opacity:1; }
.pos-TL.pdu-occupied{border-color:var(--pdu-a);background:#eff6ff} .pos-TL .slot-name{color:var(--pdu-a)}
.pos-TR.pdu-occupied{border-color:var(--pdu-b);background:#f5f3ff} .pos-TR .slot-name{color:var(--pdu-b)}
.pos-BL.pdu-occupied{border-color:var(--pdu-c);background:#ecfdf5} .pos-BL .slot-name{color:var(--pdu-c)}
.pos-BR.pdu-occupied{border-color:var(--pdu-d);background:#fffbeb} .pos-BR .slot-name{color:var(--pdu-d)}
.rs-pdu-form { display:flex; flex-direction:column; gap:8px; }
.rs-pdu-form select { background:var(--surface2); border:1px solid var(--border); border-radius:7px; color:var(--text); font-family:'Inter',sans-serif; font-size:.78rem; padding:8px 11px; outline:none; cursor:pointer; }
.rs-pdu-form select:focus { border-color:var(--purple); box-shadow:0 0 0 3px #f5f3ff; }
.rs-btn-pdu { width:100%; padding:10px; border-radius:8px; background:var(--purple); color:#fff; border:none; font-family:'Inter',sans-serif; font-weight:600; font-size:.82rem; cursor:pointer; transition:all .18s; }
.rs-btn-pdu:hover { background:#7c3aed; box-shadow:0 4px 12px #8b5cf640; }
.rs-inst-row { display:flex; align-items:center; gap:8px; padding:8px 14px; border-bottom:1px solid var(--border); font-size:.72rem; transition:background .1s; }
.rs-inst-row:last-child { border-bottom:none; }
.rs-inst-row:hover { background:var(--surface2); }
.rs-inst-badge { font-family:'JetBrains Mono',monospace; font-weight:600; font-size:.7rem; padding:2px 7px; border-radius:5px; flex-shrink:0; }
.b1u{background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue-border)}
.b2u{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border)}
.b4u{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-border)}
.rs-inst-name { flex:1; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text); }
.rs-inst-pos { font-family:'JetBrains Mono',monospace; font-size:.62rem; color:var(--text3); flex-shrink:0; }
.rs-btn-rm { background:none; border:1px solid var(--red-border); border-radius:5px; color:var(--red); font-size:.62rem; padding:2px 8px; cursor:pointer; transition:all .12s; flex-shrink:0; font-weight:500; }
.rs-btn-rm:hover { background:var(--red-bg); }
.rs-empty-msg { padding:18px 14px; text-align:center; color:var(--text3); font-size:.68rem; }
.rs-rack-area { display:flex; flex-direction:column; }
.rs-rack-area-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.rs-rack-area-title { font-size:.78rem; font-weight:600; color:var(--text2); letter-spacing:.04em; text-transform:uppercase; }
.rs-rack-area-div { flex:1; height:1px; background:var(--border); }
.rs-rack-with-pdus { display:flex; align-items:stretch; gap:0; }

/* PDU columns */
.rs-pdu-col { display:flex; flex-direction:column; gap:4px; width:0; overflow:hidden; transition:width .35s cubic-bezier(.4,0,.2,1); }
.rs-pdu-col.has-pdu { width:36px; }
.rs-pdu-spacer { height:44px; flex-shrink:0; }
.rs-pdu-spacer-bot { height:32px; flex-shrink:0; }
.rs-pdu-vis { flex:1; display:flex; flex-direction:column; min-height:0; }
.rs-pdu-unit { flex:1; border-radius:6px; display:flex; flex-direction:column; align-items:center; padding:6px 0; gap:4px; border:1.5px solid; min-height:200px; transition:all .3s; }
.rs-pdu-unit.pdu-a{background:#eff6ff;border-color:#93c5fd} .rs-pdu-unit.pdu-b{background:#f5f3ff;border-color:#c4b5fd}
.rs-pdu-unit.pdu-c{background:#ecfdf5;border-color:#6ee7b7} .rs-pdu-unit.pdu-d{background:#fffbeb;border-color:#fcd34d}
.rs-pdu-label { writing-mode:vertical-rl; text-orientation:mixed; transform:rotate(180deg); font-size:.5rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; opacity:.7; flex-shrink:0; font-family:'JetBrains Mono',monospace; }
.rs-pdu-unit.pdu-a .rs-pdu-label{color:var(--pdu-a)} .rs-pdu-unit.pdu-b .rs-pdu-label{color:var(--pdu-b)}
.rs-pdu-unit.pdu-c .rs-pdu-label{color:var(--pdu-c)} .rs-pdu-unit.pdu-d .rs-pdu-label{color:var(--pdu-d)}
.rs-pdu-outlets { display:flex; flex-direction:column; gap:5px; flex:1; justify-content:center; align-items:center; }
.rs-pdu-outlet { width:14px; height:10px; border-radius:3px; border:1px solid; position:relative; flex-shrink:0; }
.rs-pdu-unit.pdu-a .rs-pdu-outlet{background:#dbeafe;border-color:#93c5fd} .rs-pdu-unit.pdu-b .rs-pdu-outlet{background:#ede9fe;border-color:#c4b5fd}
.rs-pdu-unit.pdu-c .rs-pdu-outlet{background:#d1fae5;border-color:#6ee7b7} .rs-pdu-unit.pdu-d .rs-pdu-outlet{background:#fef3c7;border-color:#fcd34d}
.rs-pdu-outlet::before,.rs-pdu-outlet::after { content:''; position:absolute; width:2px; height:4px; border-radius:1px; top:50%; transform:translateY(-50%); }
.rs-pdu-unit.pdu-a .rs-pdu-outlet::before,.rs-pdu-unit.pdu-a .rs-pdu-outlet::after{background:#3b82f6}
.rs-pdu-unit.pdu-b .rs-pdu-outlet::before,.rs-pdu-unit.pdu-b .rs-pdu-outlet::after{background:#8b5cf6}
.rs-pdu-unit.pdu-c .rs-pdu-outlet::before,.rs-pdu-unit.pdu-c .rs-pdu-outlet::after{background:#10b981}
.rs-pdu-unit.pdu-d .rs-pdu-outlet::before,.rs-pdu-unit.pdu-d .rs-pdu-outlet::after{background:#f59e0b}
.rs-pdu-outlet::before{left:3px} .rs-pdu-outlet::after{right:3px}
.rs-pdu-outlet.on::after{top:1px;right:1px;transform:none;width:4px;height:4px;border-radius:50%}
.rs-pdu-unit.pdu-a .rs-pdu-outlet.on::after,.rs-pdu-unit.pdu-b .rs-pdu-outlet.on::after,
.rs-pdu-unit.pdu-c .rs-pdu-outlet.on::after,.rs-pdu-unit.pdu-d .rs-pdu-outlet.on::after{background:var(--green);box-shadow:0 0 3px var(--green)}
.rs-pdu-outlet.on::before{display:none}
.rs-pdu-status-led{width:8px;height:8px;border-radius:50%;flex-shrink:0;animation:rs-pulse 2s infinite}
.rs-pdu-unit.pdu-a .rs-pdu-status-led{background:var(--pdu-a);box-shadow:0 0 0 2px #bfdbfe}
.rs-pdu-unit.pdu-b .rs-pdu-status-led{background:var(--pdu-b);box-shadow:0 0 0 2px #ddd6fe}
.rs-pdu-unit.pdu-c .rs-pdu-status-led{background:var(--pdu-c);box-shadow:0 0 0 2px #a7f3d0}
.rs-pdu-unit.pdu-d .rs-pdu-status-led{background:var(--pdu-d);box-shadow:0 0 0 2px #fde68a}
.rs-pdu-kw{font-size:.42rem;font-weight:700;text-align:center;font-family:'JetBrains Mono',monospace;flex-shrink:0;writing-mode:vertical-rl;transform:rotate(180deg)}
.rs-pdu-unit.pdu-a .rs-pdu-kw{color:var(--pdu-a)} .rs-pdu-unit.pdu-b .rs-pdu-kw{color:var(--pdu-b)}
.rs-pdu-unit.pdu-c .rs-pdu-kw{color:var(--pdu-c)} .rs-pdu-unit.pdu-d .rs-pdu-kw{color:var(--pdu-d)}

/* SCROLLABLE RACK WRAPPER - Keep this for internal rack scrolling */
.rs-rack-scroll-outer {
  flex: 1;
  margin: 0 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,.08), 0 0 0 4px #e5e7eb, 0 0 0 6px #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.rs-rack-scroll-inner {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: #c5cdd8 #f0f2f5;
}
.rs-rack-scroll-inner::-webkit-scrollbar {
  width: 6px;
}
.rs-rack-scroll-inner::-webkit-scrollbar-track {
  background: #f0f2f5;
}
.rs-rack-scroll-inner::-webkit-scrollbar-thumb {
  background: #c5cdd8;
  border-radius: 3px;
}
.rs-rack-scroll-inner::-webkit-scrollbar-thumb:hover {
  background: #a0aab8;
}

/* THE RACK — static */
.rs-rack { 
  background: #f9fafb; 
  border: 2px solid #d1d5db; 
  border-radius: 6px; 
  overflow: visible;
}
.rs-rack-top-bar { 
  background: #e5e7eb; 
  border-bottom: 1.5px solid #d1d5db; 
  padding: 7px 14px; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  position: sticky; 
  top: 0; 
  z-index: 10;
}
.rs-rtl{width:7px;height:7px;border-radius:50%}
.rs-rtl-g{background:#10b981;box-shadow:0 0 0 2px #a7f3d0;animation:rs-pulse 3s infinite}
.rs-rtl-a{background:#f59e0b;box-shadow:0 0 0 2px #fde68a;animation:rs-pulse 4s .8s infinite}
.rs-rtl-r{background:#d1d5db}
.rs-rack-brand{font-family:'JetBrains Mono',monospace;font-size:.62rem;font-weight:600;color:var(--text3);margin-left:auto;letter-spacing:.1em}
.rs-rack-units{padding:3px 10px;display:flex;flex-direction:column;gap:2px}
.rs-rack-unit-row{display:flex;align-items:stretch;height:30px}
.rs-u-num{width:24px;text-align:right;padding-right:5px;font-family:'JetBrains Mono',monospace;font-size:.48rem;color:var(--text3);display:flex;align-items:center;justify-content:flex-end;flex-shrink:0}
.rs-u-slot{flex:1;background:var(--slot-bg);border:1px solid var(--slot-border);border-radius:3px;display:flex;align-items:center;transition:background .12s;position:relative;overflow:hidden;min-width:0}
.rs-u-slot::before,.rs-u-slot::after{content:'';position:absolute;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#c8ccd8,#a8aec0);border:1px solid #b8bece;top:50%;transform:translateY(-50%)}
.rs-u-slot::before{left:5px} .rs-u-slot::after{right:5px}
.rs-slot-hint{width:100%;text-align:center;font-size:.44rem;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;pointer-events:none;font-weight:500}
.rs-u-slot.anchor{overflow:visible;border:none;background:transparent}
.rs-u-slot.anchor::before,.rs-u-slot.anchor::after{display:none}
.rs-u-slot.cont{background:transparent;border-color:transparent;pointer-events:none}
.rs-u-slot.cont::before,.rs-u-slot.cont::after{display:none}
.rs-rack-bottom-bar{background:#e5e7eb;border-top:1.5px solid #d1d5db;padding:5px 14px;display:flex;justify-content:space-between;font-size:.55rem;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;font-weight:500;position:sticky;bottom:0;z-index:10;}

/* SERVER VISUALS */
.rs-server-block{position:absolute;left:0;right:0;top:0;z-index:10;border-radius:3px;overflow:hidden;display:flex;align-items:stretch;transition:filter .15s;cursor:default}
.rs-server-block:hover{filter:brightness(.96);z-index:20}
.rs-srv-eject{background:none;border:1px solid #fecaca;border-radius:3px;color:var(--red);font-size:.5rem;padding:1px 6px;cursor:pointer;transition:all .12s;flex-shrink:0;align-self:center;opacity:0;font-weight:600;font-family:'Inter',sans-serif}
.rs-server-block:hover .rs-srv-eject{opacity:1}
.rs-srv-eject:hover{background:var(--red-bg)}
.rs-led{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.rs-lg{background:var(--green);box-shadow:0 0 4px #10b98166;animation:rs-fastblink 2.2s infinite}
.rs-la{background:var(--amber);box-shadow:0 0 4px #f59e0b66;animation:rs-fastblink 1.4s .3s infinite}
.rs-lb{background:var(--blue);box-shadow:0 0 4px #3b82f666;animation:rs-fastblink 3.1s .7s infinite}
.rs-loff{background:#d1d5db}
@keyframes rs-fastblink{0%,100%{opacity:1}50%{opacity:.2}}
.rs-leds{display:flex;gap:3px;align-items:center;flex-shrink:0}
.rs-pwr{flex-shrink:0;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center}
.rs-pwr::after{content:'⏻';font-size:55%;line-height:1}
.rs-s1u{height:30px;background:linear-gradient(180deg,#ffffff,#f3f6fc);border:1px solid #c5d0e8;border-top:1px solid #e0e8f8;box-shadow:inset 0 1px 0 #fff,0 1px 3px rgba(0,0,0,.08)}
.rs-s1u .acc{width:4px;flex-shrink:0;background:linear-gradient(180deg,var(--blue),#2563eb)}
.rs-s1u .body{flex:1;display:flex;align-items:center;gap:6px;padding:0 7px 0 6px;min-width:0}
.rs-s1u .pwr{width:13px;height:13px;background:#e8f0fe;border:1px solid #93c5fd;color:var(--blue);font-size:8px}
.rs-srv-label{flex:1;min-width:0;overflow:hidden}
.rs-sname{font-size:.72rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1}
.rs-smeta{font-family:'JetBrains Mono',monospace;font-size:.43rem;color:var(--text3);margin-top:1px;letter-spacing:.05em}
.rs-ports{display:flex;gap:3px;align-items:center;flex-shrink:0}
.rs-port{border-radius:1px;background:#e8ecf4;border:1px solid #c5cde0;position:relative}
.rs-port-usb{width:7px;height:6px} .rs-port-eth{width:9px;height:7px}
.rs-port-eth::after{content:'';position:absolute;top:-2px;right:-3px;width:4px;height:4px;border-radius:50%;background:var(--green);box-shadow:0 0 3px var(--green);animation:rs-fastblink 1.8s .5s infinite}
.rs-vents{display:flex;gap:2px;align-items:center;flex-shrink:0}
.rs-vent{width:3px;height:15px;background:#e8ecf4;border:1px solid #c5cde0;border-radius:1px}
.rs-s2u{background:linear-gradient(180deg,#f8fdf8,#f0faf0);border:1px solid #bbddc5;border-top:1px solid #d4eeda;box-shadow:inset 0 1px 0 #fff,0 2px 6px rgba(0,0,0,.08)}
.rs-s2u .acc{width:4px;flex-shrink:0;background:linear-gradient(180deg,var(--green),#059669)}
.rs-s2u .body{flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:5px 8px 5px 7px;min-width:0}
.rs-s2u .top-row,.rs-s2u .bot-row{display:flex;align-items:center;gap:7px}
.rs-s2u .pwr{width:15px;height:15px;background:#ecfdf5;border:1px solid #6ee7b7;color:var(--green);font-size:9px}
.rs-dbays{display:flex;gap:2px;flex-shrink:0}
.rs-dbay{width:13px;height:12px;background:linear-gradient(180deg,#f0faf0,#e8f5e9);border:1px solid #bbddc5;border-radius:2px;position:relative;overflow:hidden}
.rs-dact{position:absolute;bottom:0;left:1px;right:1px;height:2px;border-radius:1px}
.rs-dact.on{background:var(--green);box-shadow:0 0 3px var(--green);animation:rs-driveio .6s infinite}
.rs-dact.idle{background:#a7f3d0;animation:rs-fastblink 3s infinite}
.rs-dact.dead{background:#e5e7eb}
@keyframes rs-driveio{0%,100%{opacity:1}40%{opacity:.1}}
.rs-lcd2{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:3px;padding:1px 6px;flex-shrink:0;font-family:'JetBrains Mono',monospace;font-size:.42rem;color:#059669;letter-spacing:.06em;white-space:nowrap;max-width:80px}
.rs-psus{display:flex;gap:3px;flex-shrink:0}
.rs-psu2{width:18px;height:7px;border-radius:2px;background:#e8f5e9;border:1px solid #bbddc5;position:relative}
.rs-psu2::after{content:'';position:absolute;top:1px;left:2px;width:4px;height:4px;border-radius:50%;background:var(--green);box-shadow:0 0 3px var(--green)}
.rs-psu2.b::after{background:var(--amber);box-shadow:0 0 3px var(--amber)}
.rs-s4u{background:linear-gradient(180deg,#fffdf5,#fffbeb);border:1px solid #e8d090;border-top:1px solid #f0e0a0;box-shadow:inset 0 1px 0 #fff,0 3px 10px rgba(0,0,0,.08)}
.rs-s4u .acc{width:4px;flex-shrink:0;background:linear-gradient(180deg,var(--amber),#d97706)}
.rs-s4u .body{flex:1;display:flex;flex-direction:column;padding:6px 9px 6px 8px;gap:5px;min-width:0}
.rs-s4u .top-row,.rs-s4u .bot-row{display:flex;align-items:center;gap:8px}
.rs-s4u .pwr{width:17px;height:17px;background:#fffbeb;border:1px solid #fcd34d;color:var(--amber);font-size:10px}
.rs-drive-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:3px;flex:1}
.rs-dgbay{background:#fffbeb;border:1px solid #e8d090;border-radius:2px;position:relative;overflow:hidden;min-height:14px}
.rs-dgled{position:absolute;bottom:0;left:0;right:0;height:2px}
.rs-dgled.act{background:var(--amber);box-shadow:0 0 3px var(--amber);animation:rs-driveio .5s infinite}
.rs-dgled.idle{background:#fcd34d;animation:rs-fastblink 4s infinite}
.rs-dgled.emp{background:transparent}
.rs-dgbay.ebay{background:#f3f4f6;border-color:#e5e7eb}
.rs-lcd4{background:#fffdf0;border:1px solid #e8d090;border-radius:3px;padding:3px 8px;flex-shrink:0}
.rs-lcd4 .lcdtop{font-size:.4rem;color:#92400e;font-weight:500;text-transform:uppercase;letter-spacing:.08em}
.rs-lcd4 .lcdval{font-family:'JetBrains Mono',monospace;font-size:.48rem;color:var(--amber);font-weight:600;margin-top:1px;letter-spacing:.04em}
.rs-fans{display:flex;gap:3px}
.rs-fan{width:13px;height:13px;border-radius:50%;background:#fff8e1;border:1px solid #fcd34d;display:flex;align-items:center;justify-content:center;overflow:hidden}
.rs-fan-icon{font-size:7px;color:var(--amber);animation:rs-spin .35s linear infinite}
.rs-fan.fast .rs-fan-icon{animation-duration:.18s}
@keyframes rs-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.rs-psu4s{display:flex;gap:3px;margin-left:auto}
.rs-psu4{width:22px;height:12px;border-radius:2px;background:#fff8e1;border:1px solid #e8d090;position:relative}
.rs-psu4::after{content:'';position:absolute;top:2px;left:2px;width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 3px var(--green)}

.rs-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(50px);background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 22px;font-size:.72rem;color:var(--text);font-weight:500;transition:transform .3s cubic-bezier(.4,0,.2,1),opacity .3s;opacity:0;z-index:9999;pointer-events:none;box-shadow:0 8px 30px rgba(0,0,0,.12)}
.rs-toast.show{transform:translateX(-50%) translateY(0);opacity:1}
.rs-toast.ok{border-color:var(--green-border);color:var(--green);background:var(--green-bg)}
.rs-toast.err{border-color:var(--red-border);color:var(--red);background:var(--red-bg)}
.rs-left-panel{display:flex;flex-direction:column;gap:14px}
@media(max-width:860px){.rs-main{grid-template-columns:1fr}}
`;

const TOTAL_U = 42, ROW_H = 30, GAP = 2;
const PDU_POSITIONS = ['TL','TR','BL','BR'];
const PDU_COLORS  = { TL:'pdu-a', TR:'pdu-b', BL:'pdu-c', BR:'pdu-d' };
const PDU_LABELS  = { TL:'Top-Left', TR:'Top-Right', BL:'Bot-Left', BR:'Bot-Right' };

function Server1U({ srv, onRemove }) {
  return (
    <div className="rs-server-block rs-s1u" style={{height:ROW_H}}>
      <div className="acc"/>
      <div className="body">
        <div className="rs-pwr"/>
        <div className="rs-leds"><div className="rs-led rs-lg"/><div className="rs-led rs-lb"/><div className="rs-led rs-la"/><div className="rs-led rs-loff"/></div>
        <div className="rs-srv-label">
          <div className="rs-sname">{srv.name}</div>
          <div className="rs-smeta">U{srv.startSlot+1} · 1U BLADE</div>
        </div>
        <div className="rs-ports"><div className="rs-port rs-port-usb"/><div className="rs-port rs-port-usb"/><div className="rs-port rs-port-eth"/><div className="rs-port rs-port-eth"/></div>
        <div className="rs-vents"><div className="rs-vent"/><div className="rs-vent"/><div className="rs-vent"/><div className="rs-vent"/></div>
        <button className="rs-srv-eject" onClick={e=>{e.stopPropagation();onRemove(srv.id)}}>✕ Eject</button>
      </div>
    </div>
  );
}

function Server2U({ srv, onRemove }) {
  const states = useRef(Array.from({length:6},()=>['on','idle','dead'][Math.floor(Math.random()*3)])).current;
  return (
    <div className="rs-server-block rs-s2u" style={{height:2*ROW_H+GAP}}>
      <div className="acc"/>
      <div className="body">
        <div className="top-row">
          <div className="rs-pwr"/>
          <div className="rs-leds"><div className="rs-led rs-lg"/><div className="rs-led rs-lg"/><div className="rs-led rs-la"/><div className="rs-led rs-loff"/><div className="rs-led rs-lb"/></div>
          <div className="rs-srv-label"><div className="rs-sname">{srv.name}</div><div className="rs-smeta">U{srv.startSlot+1}–U{srv.startSlot+2} · 2U STD</div></div>
          <div className="rs-lcd2">SYS OK ›</div>
          <button className="rs-srv-eject" onClick={e=>{e.stopPropagation();onRemove(srv.id)}}>✕ Eject</button>
        </div>
        <div className="bot-row">
          <div className="rs-dbays">{states.map((s,i)=><div key={i} className="rs-dbay"><div className={`rs-dact ${s}`}/></div>)}</div>
          <div style={{flex:1}}/>
          <div className="rs-psus"><div className="rs-psu2"/><div className="rs-psu2 b"/></div>
        </div>
      </div>
    </div>
  );
}

function Server4U({ srv, onRemove }) {
  const total=16, filled=useRef(Math.floor(Math.random()*5)+9).current;
  const bayStates=useRef(Array.from({length:total},(_,i)=>i>=filled?'emp':Math.random()<0.25?'idle':'act')).current;
  return (
    <div className="rs-server-block rs-s4u" style={{height:4*ROW_H+3*GAP}}>
      <div className="acc"/>
      <div className="body">
        <div className="top-row">
          <div className="rs-pwr"/>
          <div className="rs-leds"><div className="rs-led rs-lg"/><div className="rs-led rs-lg"/><div className="rs-led rs-la"/><div className="rs-led rs-la"/><div className="rs-led rs-lb"/><div className="rs-led rs-loff"/></div>
          <div className="rs-srv-label" style={{flex:1}}><div className="rs-sname">{srv.name}</div><div className="rs-smeta">U{srv.startSlot+1}–U{srv.startSlot+4} · 4U STORAGE</div></div>
          <div className="rs-lcd4"><div className="lcdtop">Storage Node</div><div className="lcdval">{filled}/{total} Drives</div></div>
          <button className="rs-srv-eject" onClick={e=>{e.stopPropagation();onRemove(srv.id)}}>✕ Eject</button>
        </div>
        <div className="rs-drive-grid">{bayStates.map((s,i)=><div key={i} className={`rs-dgbay${s==='emp'?' ebay':''}`}><div className={`rs-dgled ${s}`}/></div>)}</div>
        <div className="bot-row">
          <div className="rs-fans"><div className="rs-fan fast"><span className="rs-fan-icon">✦</span></div><div className="rs-fan fast"><span className="rs-fan-icon">✦</span></div><div className="rs-fan"><span className="rs-fan-icon">✦</span></div></div>
          <div className="rs-leds" style={{marginLeft:6}}><div className="rs-led rs-lg"/><div className="rs-led rs-la"/></div>
          <div style={{flex:1}}/>
          <div className="rs-psu4s"><div className="rs-psu4"/><div className="rs-psu4"/></div>
        </div>
      </div>
    </div>
  );
}

function PDUUnitVis({ pdu, colorClass, serverCount, pduCount }) {
  const outletCount=12, activeOutlets=serverCount>0?Math.min(serverCount*2,outletCount):0;
  const kw=(serverCount*0.11/(pduCount||1)).toFixed(1);
  return (
    <div className={`rs-pdu-unit ${colorClass}`} style={{flex:1,minHeight:0}}>
      <div className="rs-pdu-status-led"/>
      <div className="rs-pdu-label">{pdu.name} · {pdu.amp}A</div>
      <div className="rs-pdu-outlets">{Array.from({length:outletCount},(_,i)=><div key={i} className={`rs-pdu-outlet${i<activeOutlets?' on':''}`}/>)}</div>
      <div className="rs-pdu-kw">{kw}kW</div>
    </div>
  );
}

export default function RackSimulator() {
  const [slots, setSlots]           = useState(new Array(TOTAL_U).fill(null));
  const [servers, setServers]       = useState([]);
  const [pdus, setPdus]             = useState({});
  const [selectedFF, setSelectedFF] = useState(1);
  const [srvName, setSrvName]       = useState('');
  const [srvPos, setSrvPos]         = useState('');
  const [pduNameInput, setPduNameInput] = useState('');
  const [pduAmpere, setPduAmpere]   = useState('16');
  const [pendingPduSlot, setPendingPduSlot] = useState(null);
  const [toast, setToast]           = useState({msg:'',type:'ok',show:false});
  const srvCtr=useRef(0), pduCtr=useRef(0), toastTimer=useRef(null);

  useEffect(()=>{
    if(document.getElementById('rs-styles')) return;
    const s=document.createElement('style'); s.id='rs-styles'; s.textContent=CSS;
    document.head.appendChild(s);
  },[]);

  const showToast=useCallback((msg,type='ok')=>{
    clearTimeout(toastTimer.current);
    setToast({msg,type,show:true});
    toastTimer.current=setTimeout(()=>setToast(t=>({...t,show:false})),2600);
  },[]);

  const canPlace=(sl,i,size)=>{ if(i<0||i+size>TOTAL_U) return false; for(let j=i;j<i+size;j++) if(sl[j]!==null) return false; return true; };
  const autoFit =(sl,size)=>{ for(let i=0;i<=TOTAL_U-size;i++) if(canPlace(sl,i,size)) return i+1; return -1; };

  const addServer=()=>{
    const name=srvName.trim()||`SRV-${String(++srvCtr.current).padStart(3,'0')}`;
    const size=selectedFF; let pos=parseInt(srvPos);
    if(isNaN(pos)||pos<1||pos>42){ pos=autoFit(slots,size); if(pos===-1){showToast(`No space for ${size}U`,'err');return;} }
    else if(!canPlace(slots,pos-1,size)){showToast(`U${pos}: occupied or out of range`,'err');return;}
    const id=Date.now();
    const newSlots=[...slots]; for(let i=pos-1;i<pos-1+size;i++) newSlots[i]=id;
    setSlots(newSlots);
    setServers(prev=>[...prev,{id,name,size,startSlot:pos-1}]);
    showToast(`${name} (${size}U) → U${pos}`,'ok');
    setSrvName(''); setSrvPos('');
  };

  const removeServer=id=>{
    setServers(prev=>{
      const srv=prev.find(x=>x.id===id); if(!srv) return prev;
      setSlots(sl=>{ const ns=[...sl]; for(let i=srv.startSlot;i<srv.startSlot+srv.size;i++) ns[i]=null; return ns; });
      showToast(`${srv.name} removed`,'err');
      return prev.filter(x=>x.id!==id);
    });
  };

  const pduSlotClick=pos=>{ if(pdus[pos]) return; setPendingPduSlot(pos); showToast(`Click "Mount PDU" to install at ${PDU_LABELS[pos]}`,'ok'); };
  const addPDU=()=>{
    let slot=pendingPduSlot;
    if(!slot){for(const p of PDU_POSITIONS){if(!pdus[p]){slot=p;break;}}}
    if(!slot){showToast('All 4 PDU positions are occupied','err');return;}
    if(pdus[slot]){showToast(`${PDU_LABELS[slot]} already occupied`,'err');return;}
    const name=pduNameInput.trim()||`PDU-${String(++pduCtr.current).padStart(2,'0')}`;
    setPdus(prev=>({...prev,[slot]:{name,amp:pduAmpere,pos:slot}}));
    setPendingPduSlot(null); showToast(`${name} mounted`,'ok'); setPduNameInput('');
  };
  const removePDU=(e,pos)=>{ e.stopPropagation(); if(!pdus[pos]) return; const n=pdus[pos].name; setPdus(prev=>{const x={...prev};delete x[pos];return x;}); showToast(`${n} removed`,'err'); };

  const usedU=slots.filter(s=>s!==null).length, freeU=TOTAL_U-usedU, pct=Math.round((usedU/TOTAL_U)*100);
  const kw=servers.reduce((a,s)=>a+s.size*0.22,0).toFixed(1);
  const pduCount=Object.keys(pdus).length, leftHas=pdus['TL']||pdus['BL'], rightHas=pdus['TR']||pdus['BR'];

  const done = new Set();
const rackRows = [];

for (let i = 0; i < TOTAL_U; i++) {
  const sid = slots[i];
  
  if (sid !== null) {
    // Find the server for this slot
    const server = servers.find(s => s.id === sid);
    
    // Only create anchor if we haven't processed this server yet AND the server exists
    if (server && !done.has(sid)) {
      done.add(sid);
      rackRows.push({ i, type: 'anchor', srv: server });
    } 
    // If the server doesn't exist anymore, treat as empty
    else if (!server) {
      // Clear the slot since the server doesn't exist
      const newSlots = [...slots];
      newSlots[i] = null;
      setSlots(newSlots); // This will trigger a re-render with cleared slot
      rackRows.push({ i, type: 'empty' });
    }
    else {
      rackRows.push({ i, type: 'cont' });
    }
  } else {
    rackRows.push({ i, type: 'empty' });
  }
}

  return (
    <div className="rs-wrap">
      <header className="rs-header">
        <div className="rs-title">
          <h1>42<span>U</span> Rack Simulator</h1>
          <p>Data Center Rack Capacity Manager · EIA-310-E Standard</p>
        </div>
        <div className="rs-sys-status">
          <div className="rs-status-chip"><div className="rs-dot"/>System Online</div>
          <div className="rs-status-chip">{pct}% Utilized</div>
          <div className="rs-status-chip">{pduCount} PDU Active</div>
        </div>
      </header>

      {/* FIXED: Main content area now scrollable */}
      <div className="rs-main">
        {/* LEFT PANEL */}
        <div className="rs-left-panel">
          <div className="rs-panel-card">
            <div className="rs-card-header"><div className="rs-hicon rs-hicon-blue">📊</div>Capacity Overview</div>
            <div className="rs-cap-section">
              <div className="rs-cap-top">
                <div><div className={`rs-cap-big${pct>=90?' crit':pct>=70?' warn':''}`}>{usedU}</div><div className="rs-cap-label">Units used</div></div>
                <div className="rs-cap-free-badge"><div className="val">{freeU}</div><div className="lbl">Free of 42</div></div>
              </div>
              <div className="rs-bar-track"><div className={`rs-bar-fill${pct>=90?' crit':pct>=70?' warn':''}`} style={{width:`${pct}%`}}/></div>
              <div className="rs-stats-grid">
                <div className="rs-stat-tile"><div className="val v-blue">{servers.length}</div><div className="lbl">Servers</div></div>
                <div className="rs-stat-tile"><div className="val" style={{color:pct>=90?'var(--red)':pct>=70?'var(--amber)':'var(--green)'}}>{pct}%</div><div className="lbl">Utilized</div></div>
                <div className="rs-stat-tile"><div className="val v-amber">{kw}</div><div className="lbl">kW Draw</div></div>
                <div className="rs-stat-tile"><div className="val v-purple">{pduCount}/4</div><div className="lbl">PDUs</div></div>
              </div>
            </div>
          </div>

          <div className="rs-panel-card">
            <div className="rs-card-header"><div className="rs-hicon rs-hicon-blue">🖥</div>Install Server</div>
            <div className="rs-add-section">
              <div className="rs-form-row"><label>Server Name</label><input type="text" value={srvName} maxLength={22} placeholder="WEB-01, DB-MAIN …" onChange={e=>setSrvName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addServer()}/></div>
              <div className="rs-form-row">
                <label>Form Factor</label>
                <div className="rs-type-cards">{[1,2,4].map(u=>(<div key={u} className={`rs-type-card${selectedFF===u?' active':''}`} onClick={()=>setSelectedFF(u)}><div className="tc-sz">{u}U</div><div className="tc-lb">{u===1?'Blade':u===2?'Standard':'Storage'}</div></div>))}</div>
              </div>
              <div className="rs-form-row"><label>Start Position (blank = auto-fit)</label><input type="number" value={srvPos} min="1" max="42" placeholder="U1 – U42" onChange={e=>setSrvPos(e.target.value)}/></div>
              <button className="rs-btn-install" onClick={addServer}>Install Server</button>
            </div>
          </div>

          <div className="rs-panel-card">
            <div className="rs-card-header"><div className="rs-hicon rs-hicon-purple">⚡</div>PDU Manager</div>
            <div className="rs-pdu-section">
              <div style={{fontSize:'.65rem',color:'var(--text3)',marginBottom:10,lineHeight:1.5}}>PDUs mount vertically on rack corners. Up to 4 total — one per corner position.</div>
              <div className="rs-pdu-slots-grid">
                {PDU_POSITIONS.map(pos=>(
                  <div key={pos} className={`rs-pdu-slot-btn pos-${pos}${pdus[pos]?' pdu-occupied':''}`} onClick={()=>pduSlotClick(pos)}>
                    <div className="slot-pos">{pos==='TL'?'↖ Top Left':pos==='TR'?'↗ Top Right':pos==='BL'?'↙ Bot Left':'↘ Bot Right'}</div>
                    <div className="slot-icon">{pdus[pos]?'⚡':'➕'}</div>
                    <div className="slot-name">{pdus[pos]?.name||''}</div>
                    {pdus[pos]&&<span className="slot-remove" onClick={e=>removePDU(e,pos)}>✕</span>}
                  </div>
                ))}
              </div>
              <div className="rs-pdu-form">
                <div className="rs-form-row" style={{marginBottom:0}}><label>PDU Name</label><input type="text" value={pduNameInput} maxLength={16} placeholder="PDU-A, Main-L …" onChange={e=>setPduNameInput(e.target.value)}/></div>
                <select value={pduAmpere} onChange={e=>setPduAmpere(e.target.value)}>
                  <option value="16">16A / Single Phase</option><option value="32">32A / Single Phase</option>
                  <option value="16-3">16A / Three Phase</option><option value="32-3">32A / Three Phase</option>
                </select>
                <button className="rs-btn-pdu" onClick={addPDU}>⚡ Mount PDU</button>
              </div>
            </div>
          </div>

          <div className="rs-panel-card">
            <div className="rs-card-header"><div className="rs-hicon rs-hicon-green">📋</div>Installed Servers</div>
            {servers.length===0
              ? <div className="rs-empty-msg">No servers installed</div>
              : [...servers].sort((a,b)=>a.startSlot-b.startSlot).map(s=>(
                <div key={s.id} className="rs-inst-row">
                  <span className={`rs-inst-badge b${s.size}u`}>{s.size}U</span>
                  <span className="rs-inst-name">{s.name}</span>
                  <span className="rs-inst-pos">U{s.startSlot+1}–U{s.startSlot+s.size}</span>
                  <button className="rs-btn-rm" onClick={()=>removeServer(s.id)}>Remove</button>
                </div>
              ))
            }
          </div>
        </div>

        {/* RACK VIEW */}
        <div className="rs-rack-area">
          <div className="rs-rack-area-header">
            <div className="rs-rack-area-title">Physical Rack View</div>
            <div className="rs-rack-area-div"/>
            <div style={{fontSize:'.65rem',color:'var(--text3)',fontWeight:500}}>42U · EIA-310-E · Scroll to view all units</div>
          </div>

          <div className="rs-rack-with-pdus">
            {/* Left PDU column */}
            <div className={`rs-pdu-col${leftHas?' has-pdu':''}`}>
              <div className="rs-pdu-spacer"/>
              {['TL','BL'].map(pos=>(
                <div key={pos} className="rs-pdu-vis">{pdus[pos]&&<PDUUnitVis pdu={pdus[pos]} colorClass={PDU_COLORS[pos]} serverCount={servers.length} pduCount={pduCount}/>}</div>
              ))}
              <div className="rs-pdu-spacer-bot"/>
            </div>

            {/* Scrollable rack */}
            <div className="rs-rack-scroll-outer">
              <div className="rs-rack-scroll-inner">
                <div className="rs-rack">
                  <div className="rs-rack-top-bar">
                    <div className="rs-rtl rs-rtl-g"/><div className="rs-rtl rs-rtl-a"/><div className="rs-rtl rs-rtl-r"/>
                    <div className="rs-rack-brand">RACKMASTER PRO · 42U</div>
                  </div>
                  <div className="rs-rack-units">
                    {rackRows.map(({i,type,srv})=>(
                      <div key={i} className="rs-rack-unit-row">
                        <div className="rs-u-num">{i+1}</div>
                        {type==='anchor'?(
                          <div className="rs-u-slot anchor" style={{position:'relative',overflow:'visible'}}>
                            {srv.size===1&&<Server1U srv={srv} onRemove={removeServer}/>}
                            {srv.size===2&&<Server2U srv={srv} onRemove={removeServer}/>}
                            {srv.size===4&&<Server4U srv={srv} onRemove={removeServer}/>}
                          </div>
                        ):type==='cont'?(
                          <div className="rs-u-slot cont"/>
                        ):(
                          <div className="rs-u-slot"><div className="rs-slot-hint">U{i+1} — Empty</div></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="rs-rack-bottom-bar">
                    <span>PDU: {pduCount} Active</span>
                    <span>{kw} kW</span>
                    <span>{usedU}/42 U Used</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right PDU column */}
            <div className={`rs-pdu-col${rightHas?' has-pdu':''}`}>
              <div className="rs-pdu-spacer"/>
              {['TR','BR'].map(pos=>(
                <div key={pos} className="rs-pdu-vis">{pdus[pos]&&<PDUUnitVis pdu={pdus[pos]} colorClass={PDU_COLORS[pos]} serverCount={servers.length} pduCount={pduCount}/>}</div>
              ))}
              <div className="rs-pdu-spacer-bot"/>
            </div>
          </div>
        </div>
      </div>

      <div className={`rs-toast${toast.show?' show':''} ${toast.type}`}>{toast.msg}</div>
    </div>
  );
}