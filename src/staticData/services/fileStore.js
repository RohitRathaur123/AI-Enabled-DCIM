// Shared static "FileStore" (images + documents attached to any entity).
// Used by both the Company and the Device services.
import { Table, toNum, nowIso } from "../core/store";
import { registerFileUrl, urlForUpload, fileUrlById } from "../core/files";

export function createFileStore(seedRows = [], startId = 1) {
  const table = new Table(seedRows.map((r, i) => ({ id: startId + i, ...r })));
  table.seq = Math.max(table.seq, startId - 1);
  table.rows.forEach((r) => registerFileUrl(r.id, r.fileUrl));
  return table;
}

// Normalises a FormData upload body into a FileStore row.
export function fileRowFromBody(body = {}, extra = {}) {
  const file = body.file || body.files;
  const f = Array.isArray(file) ? file[0] : file;
  const url = urlForUpload(f);
  const isImage = String(body.fileCategory || "").toLowerCase() === "image" || /^image\//.test(f?.type || "");
  const fileName = f?.name || body.fileName || (isImage ? "image.png" : "document.pdf");
  return {
    entityTypeId: toNum(body.entityTypeId),
    entityId: toNum(body.entityId) ?? body.entityId,
    fileCategory: body.fileCategory || (isImage ? "Image" : "Document"),
    fileName, originalFileName: fileName,
    fileType: body.fileType || f?.type || "",
    contentType: f?.type || "",
    fileSize: f?.size || 0,
    fileUrl: url, filePath: url, documentPath: isImage ? null : url,
    fileUse: body.fileUse || "",
    fileExpiryDate: body.fileExpiryDate || null,
    documentName: body.documentName || (isImage ? "" : fileName),
    documentNumber: body.documentNumber || "",
    documentTypeId: toNum(body.documentTypeId),
    issuedById: toNum(body.issuedById),
    issuedByDate: body.issuedByDate || null,
    documentValidTill: body.documentValidTill || null,
    deviceId: toNum(body.deviceId),
    createdAt: nowIso(),
    ...extra,
  };
}

export function fileStoreRoutes(route, table, { uploadPath = "/FileStore/upload-file", wrap = (x) => x } = {}) {
  const insertUpload = (body) => {
    const row = table.insert(fileRowFromBody(body));
    registerFileUrl(row.id, row.fileUrl);
    return row;
  };
  return [
    route("GET", "/FileStore/entity/:typeId/:entityId", ({ match, q }) => {
      const cat = String(q("fileCategory", "")).toLowerCase();
      const rows = table.where((r) =>
        String(r.entityTypeId) === String(match.typeId) && String(r.entityId) === String(match.entityId) &&
        (!cat || String(r.fileCategory).toLowerCase() === cat));
      return wrap(rows);
    }),
    route("POST", uploadPath, ({ body }) => wrap(insertUpload(body))),
    route("POST", "/FileStore/upload-files", ({ body }) => wrap(insertUpload(body))),
    route("POST", /^\/FileStore\/update-file\/?(\d+)$/i, ({ match, body }) => {
      const patch = {};
      ["fileUse", "fileExpiryDate", "documentName", "documentNumber", "issuedByDate", "documentValidTill"].forEach((k) => { if (body[k] !== undefined) patch[k] = body[k]; });
      ["documentTypeId", "issuedById"].forEach((k) => { if (body[k] !== undefined) patch[k] = toNum(body[k]); });
      if (body.file) {
        const url = urlForUpload(body.file);
        Object.assign(patch, { fileUrl: url, filePath: url, fileName: body.file.name, originalFileName: body.file.name, contentType: body.file.type });
        registerFileUrl(match[1], url);
      }
      return wrap(table.update(match[1], patch));
    }),
    route("DELETE", "/FileStore/remove-file/:id", ({ match }) => { table.remove(match.id); return { status: true, message: "File removed" }; }),
    route("GET", "/FileStore/:id", ({ match }) => {
      const row = table.find(match.id);
      return row ? wrap(row) : { status: false, message: "File not found", url: fileUrlById(match.id) };
    }),
  ];
}
