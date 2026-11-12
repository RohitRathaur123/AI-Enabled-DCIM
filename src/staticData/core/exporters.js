// Builds export files (CSV / Excel / PDF) from static rows, in the browser.
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const flat = (row) => {
  const out = {};
  Object.entries(row || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) out[k] = "";
    else if (typeof v === "object") return;
    else out[k] = v;
  });
  return out;
};

const titleCase = (k) => k.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

export function rowsToCsvBlob(rows) {
  const data = rows.map(flat);
  const headers = [...new Set(data.flatMap((r) => Object.keys(r)))];
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(titleCase).join(","), ...data.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  return new Blob([csv], { type: "text/csv" });
}

export function rowsToXlsxBlob(rows, sheetName = "Data") {
  const data = rows.map((r) => {
    const f = flat(r);
    const o = {};
    Object.keys(f).forEach((k) => { o[titleCase(k)] = f[k]; });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ Info: "No records" }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName).slice(0, 31));
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function rowsToPdfBlob(rows, title = "Export") {
  const data = rows.map(flat);
  const headers = [...new Set(data.flatMap((r) => Object.keys(r)))].slice(0, 7);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const colW = (pageW - 60) / Math.max(1, headers.length);
  let y = 50;
  doc.setFontSize(15);
  doc.text(title, 30, y);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, 30, y + 16);
  y += 40;
  const drawHeader = () => {
    doc.setFillColor(29, 78, 216);
    doc.rect(30, y - 12, pageW - 60, 18, "F");
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => doc.text(titleCase(h).slice(0, 22), 34 + i * colW, y));
    doc.setTextColor(30, 41, 59);
    y += 18;
  };
  drawHeader();
  data.forEach((r, idx) => {
    if (y > pageH - 30) { doc.addPage(); y = 40; drawHeader(); }
    if (idx % 2 === 0) { doc.setFillColor(241, 245, 249); doc.rect(30, y - 12, pageW - 60, 16, "F"); }
    headers.forEach((h, i) => doc.text(String(r[h] ?? "").slice(0, 26), 34 + i * colW, y));
    y += 16;
  });
  return doc.output("blob");
}

export function exportBlob(rows, format = "excel", name = "Export") {
  const f = String(format || "excel").toLowerCase();
  if (f === "csv") return rowsToCsvBlob(rows);
  if (f === "pdf") return rowsToPdfBlob(rows, name);
  return rowsToXlsxBlob(rows, name);
}
