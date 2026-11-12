// Static report helpers for Change Management / Audit: CSV download and a
// printable HTML report (the browser's print dialog saves it as a PDF).

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** rows: array of objects; columns: [{ key, title }] */
export function downloadCsv(filename, rows, columns) {
  const cell = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => cell(c.title)).join(",")]
    .concat(rows.map((r) => columns.map((c) => cell(typeof c.value === "function" ? c.value(r) : r[c.key])).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Simple HTML table for a report section. */
export function htmlTable(rows, columns) {
  return `<table><thead><tr>${columns.map((c) => `<th>${esc(c.title)}</th>`).join("")}</tr></thead><tbody>${
    rows.map((r) => `<tr>${columns.map((c) => `<td>${esc(typeof c.value === "function" ? c.value(r) : r[c.key])}</td>`).join("")}</tr>`).join("")
  }</tbody></table>`;
}

/**
 * Print a report through a hidden iframe (no pop-up blocker involved).
 * sections: [{ title, html }]; kpis: [[label, value]]
 */
export function printReport({ title, subtitle, kpis = [], sections = [] }) {
  const now = new Date();
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    *{box-sizing:border-box} body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;margin:28px}
    h1{font-size:22px;margin:0 0 4px} .sub{color:#475569;font-size:12px;margin-bottom:16px}
    .brand{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:14px}
    .brand b{color:#2563eb;font-size:13px;letter-spacing:.08em}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0 18px}
    .kpi{border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px}
    .kpi .v{font-size:18px;font-weight:800;color:#1d4ed8} .kpi .l{font-size:11px;color:#475569}
    h2{font-size:15px;margin:18px 0 8px;color:#1e3a8a;border-left:4px solid #2563eb;padding-left:8px}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}
    th{background:#eff6ff;color:#1e3a8a;text-align:left;padding:6px;border:1px solid #cbd5e1}
    td{padding:5px 6px;border:1px solid #e2e8f0;vertical-align:top}
    tr:nth-child(even) td{background:#f8fafc}
    .foot{margin-top:18px;font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px}
    @page{size:A4 landscape;margin:12mm}
  </style></head><body>
  <div class="brand"><div><h1>${esc(title)}</h1><div class="sub">${esc(subtitle || "")}</div></div>
  <div style="text-align:right"><b>AI-ENABLED DCIM</b><div class="sub">Generated ${esc(now.toLocaleString())}</div></div></div>
  ${kpis.length ? `<div class="kpis">${kpis.map(([l, v]) => `<div class="kpi"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("")}</div>` : ""}
  ${sections.map((s) => `<h2>${esc(s.title)}</h2>${s.html}`).join("")}
  <div class="foot">Static report generated from the DCIM portal (5D View demo data).</div>
  </body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const w = iframe.contentWindow;
  w.document.open();
  w.document.write(doc);
  w.document.close();
  setTimeout(() => {
    try { w.focus(); w.print(); } finally { setTimeout(() => iframe.remove(), 1500); }
  }, 300);
}
