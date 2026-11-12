// filestoreDevice.js — DEVICE SPECIFIC FILE STORE
// ─────────────────────────────────────────────────────────────────────────────
// Device API ke lia — axiosdevice use karta hai
//
// Endpoints (Device API):
//   POST   /api/FileStore/upload-file          (singular — NOT upload-files)
//   GET    /api/FileStore/entity/{entityTypeId}/{entityId}?fileCategory=Image|Document
//   GET    /api/FileStore/{id}
//   POST   /api/FileStore/update-file/{id}      (POST — NOT PUT)
//   DELETE /api/FileStore/remove-file/{fileId}
//
// EntityType Endpoints (Device API):
//   GET    /api/EntityType/get-all-entity
//   GET    /api/EntityType/get-entity/{id}
//   POST   /api/EntityType/create-entity
//   POST   /api/EntityType/update-entity/{id}
// ─────────────────────────────────────────────────────────────────────────────

import { axiosdevice } from "../../config";

// ─── Parse any API response shape into a plain array ─────────────────────────
function toArray(raw) {
    const d = raw?.data !== undefined ? raw.data : raw;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.items)) return d.items;
    if (Array.isArray(d?.result)) return d.result;
    return [];
}

// ─── EntityType cache (Device API) ──────────────────────────────────────────
let _deviceEntityTypeCache = null;

async function fetchDeviceEntityTypeList() {
    if (_deviceEntityTypeCache) return _deviceEntityTypeCache;
    try {
        const raw = await axiosdevice.get("/EntityType/get-all-entity");
        const data = raw?.data !== undefined ? raw.data : raw;
        _deviceEntityTypeCache =
            Array.isArray(data) ? data
                : Array.isArray(data?.data) ? data.data
                    : Array.isArray(data?.items) ? data.items
                        : Array.isArray(data?.result) ? data.result
                            : [];
        console.log("🔍 [Device] EntityType list loaded:", _deviceEntityTypeCache.length, "items");
        return _deviceEntityTypeCache;
    } catch (err) {
        console.error("[Device] fetchDeviceEntityTypeList error:", err);
        _deviceEntityTypeCache = [];
    }
    return _deviceEntityTypeCache;
}

export function clearDeviceEntityTypeCache() {
    _deviceEntityTypeCache = null;
}

// ─── Get EntityTypeId from Device API ────────────────────────────────────────
export async function getDeviceEntityTypeId(entityName) {
    if (!entityName) {
        console.warn("[Device] getDeviceEntityTypeId: entityName is empty");
        return null;
    }

    const list = await fetchDeviceEntityTypeList();

    console.log(`🔍 [Device] Searching for: "${entityName}"`);
    console.log("🔍 [Device] Available:", list.map(e => e.entityTypeName || e.name || e.typeName || e.entityName));

    const searchLower = entityName.toLowerCase().trim();

    const found = list.find((e) => {
        const names = [
            e.entityTypeName,
            e.name,
            e.typeName,
            e.entityName,
            e.EntityTypeName,
            e.Name,
            e.TypeName,
        ].filter(Boolean);

        return names.some(n =>
            n.toLowerCase() === searchLower ||
            n.toLowerCase().replace(/\s+/g, "") === searchLower.replace(/\s+/g, "") ||
            n.toLowerCase().includes(searchLower) ||
            searchLower.includes(n.toLowerCase())
        );
    });

    if (found) {
        const id = found.id ?? found.Id ?? found.entityTypeId ?? found.EntityTypeId;
        console.log(`✅ [Device] Found "${entityName}" → ID: ${id}`);
        return id;
    }

    console.warn(`❌ [Device] NOT FOUND: "${entityName}"`);
    return null;
}

// ─── FETCH files for a Device entity ────────────────────────────────────────
export async function fetchDeviceEntityFiles(entityTypeId, entityId, fileCategory) {
    if (!entityTypeId || !entityId) {
        console.warn("[Device] fetchDeviceEntityFiles: missing params", { entityTypeId, entityId });
        return [];
    }

    try {
        let url = `/FileStore/entity/${entityTypeId}/${entityId}`;
        if (fileCategory) url += `?fileCategory=${fileCategory}`;

        console.log(`📡 [Device] GET ${url}`);
        const response = await axiosdevice.get(url);
        const result = toArray(response);
        console.log(`📡 [Device] Fetched ${result.length} ${fileCategory || "files"}`);
        return result;
    } catch (err) {
        console.error("[Device] fetchDeviceEntityFiles error:", err?.response?.status, err?.response?.data || err?.message);
        return [];
    }
}

// ─── UPLOAD a single file (Device API) ─────────────────────────────────────
// Device API uses "upload-file" (SINGULAR), not "upload-files"
export async function uploadDeviceFile(params) {
    const fd = new FormData();

    // Required
    fd.append("File", params.file);
    fd.append("EntityTypeId", params.entityTypeId);
    fd.append("EntityId", params.entityId);
    fd.append("FileCategory", params.fileCategory); // "Image" | "Document"

    // Optional — Image fields
    if (params.fileUse) fd.append("FileUse", params.fileUse);
    if (params.fileExpiryDate) fd.append("FileExpiryDate", new Date(params.fileExpiryDate).toISOString());

    // Optional — Document fields
    if (params.documentName) fd.append("DocumentName", params.documentName);
    if (params.documentNumber) fd.append("DocumentNumber", params.documentNumber);
    if (params.documentTypeId != null) fd.append("DocumentTypeId", params.documentTypeId);
    if (params.issuedById != null) fd.append("IssuedById", params.issuedById);
    if (params.issuedByDate) fd.append("IssuedByDate", new Date(params.issuedByDate).toISOString());
    if (params.documentValidTill) fd.append("DocumentValidTill", new Date(params.documentValidTill).toISOString());

    // Device-specific
    if (params.deviceId) fd.append("DeviceId", params.deviceId);

    console.log(`📤 [Device] POST /FileStore/upload-file — Category: ${params.fileCategory}`);
    const raw = await axiosdevice.post("/FileStore/upload-file", fd);
    return raw?.data !== undefined ? raw.data : raw;
}

// ─── UPDATE file metadata (Device API) ──────────────────────────────────────
// Device API uses POST + "update-file/{id}", NOT PUT
export async function updateDeviceFile(fileId, params) {
    const fd = new FormData();

    if (params.file) fd.append("File", params.file);
    if (params.fileUse) fd.append("FileUse", params.fileUse);
    if (params.fileExpiryDate) fd.append("FileExpiryDate", new Date(params.fileExpiryDate).toISOString());
    if (params.documentName) fd.append("DocumentName", params.documentName);
    if (params.documentNumber) fd.append("DocumentNumber", params.documentNumber);
    if (params.documentTypeId != null) fd.append("DocumentTypeId", params.documentTypeId);
    if (params.issuedById != null) fd.append("IssuedById", params.issuedById);
    if (params.issuedByDate) fd.append("IssuedByDate", new Date(params.issuedByDate).toISOString());
    if (params.documentValidTill) fd.append("DocumentValidTill", new Date(params.documentValidTill).toISOString());

    console.log(`✏️ [Device] POST /FileStore/update-file/${fileId}`);
    const raw = await axiosdevice.post(`/FileStore/update-file${fileId}`, fd);
    return raw?.data !== undefined ? raw.data : raw;
}

// ─── DELETE a file (Device API) ─────────────────────────────────────────────
export async function deleteDeviceFile(fileId) {
    if (!fileId) return;
    console.log(`🗑️ [Device] DELETE /FileStore/remove-file/${fileId}`);
    await axiosdevice.delete(`/FileStore/remove-file/${fileId}`);
}

// ─── Batch upload for Device ────────────────────────────────────────────────
export async function uploadAllPendingDeviceFiles(items, entityTypeId, entityId, fileCategory, extraFieldsFn) {
    if (!entityTypeId || !entityId) {
        console.warn("[Device] uploadAllPendingDeviceFiles: missing params");
        return items;
    }

    const result = [...items];
    for (let i = 0; i < result.length; i++) {
        const item = result[i];
        if (item.id || !item._file) continue;
        try {
            const extra = extraFieldsFn ? extraFieldsFn(item) : {};
            const saved = await uploadDeviceFile({
                file: item._file,
                entityTypeId,
                entityId,
                fileCategory,
                ...extra,
            });
            result[i] = { ...item, ...saved, id: saved?.id ?? null, _file: null, _pending: false };
        } catch (err) {
            console.error(`[Device] Upload failed for item ${i}:`, err);
        }
    }
    return result;
}

// ─── Main reusable upload function for Device ───────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//
//   import { uploadDeviceEntityFiles } from "./filestoreDevice";
//
//   const result = await uploadDeviceEntityFiles({
//       entityName: "Device",
//       entityId: savedDeviceId,
//       deviceId: savedDeviceId,
//       images: deviceImagesRef.current,
//       docs: deviceDocsRef.current,
//       onSuccess: (imgCount, docCount) => message.success(...),
//       onFileError: (fileName, err) => message.error(...),
//   });
//
// Returns: { uploadedImages: number, uploadedDocs: number, errors: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadDeviceEntityFiles({
    entityName,
    entityId,
    deviceId,
    images = [],
    docs = [],
    onSuccess,
    onFileError,
}) {
    if (!entityName || !entityId) {
        console.warn("[Device] uploadDeviceEntityFiles: entityName and entityId required");
        return { uploadedImages: 0, uploadedDocs: 0, errors: ["Missing entityName or entityId"] };
    }

    const entityTypeId = await getDeviceEntityTypeId(entityName);
    if (!entityTypeId) {
        const msg = `[Device] EntityTypeId not found for "${entityName}"`;
        console.warn(msg);
        return { uploadedImages: 0, uploadedDocs: 0, errors: [msg] };
    }

    const pendingImages = images.filter(img => !img.id && img._file);
    const pendingDocs = docs.filter(doc => !doc.id && doc._file);
    const errors = [];

    // ── Upload Images ────────────────────────────────────────────────────────
    let uploadedImages = 0;
    for (const img of pendingImages) {
        try {
            await uploadDeviceFile({
                file: img._file,
                entityTypeId,
                entityId,
                fileCategory: "Image",
                fileUse: img.fileUse || undefined,
                fileExpiryDate: img.fileExpiryDate || undefined,
                deviceId: deviceId,
            });
            uploadedImages++;
        } catch (err) {
            const name = img.fileName || img._file?.name || "unknown";
            console.error(`[Device] Image upload failed: ${name}`, err);
            errors.push(name);
            onFileError?.(name, err);
        }
    }

    // ── Upload Documents ────────────────────────────────────────────────────
    let uploadedDocs = 0;
    for (const doc of pendingDocs) {
        try {
            await uploadDeviceFile({
                file: doc._file,
                entityTypeId,
                entityId,
                fileCategory: "Document",
                documentName: doc.documentName || undefined,
                documentNumber: doc.documentNumber || undefined,
                documentTypeId: doc.documentTypeId || undefined,
                issuedById: doc.issuedById || undefined,
                issuedByDate: doc.issuedByDate || undefined,
                documentValidTill: doc.documentValidTill || undefined,
                deviceId: deviceId,
            });
            uploadedDocs++;
        } catch (err) {
            const name = doc.documentName || doc.fileName || doc._file?.name || "unknown";
            console.error(`[Device] Doc upload failed: ${name}`, err);
            errors.push(name);
            onFileError?.(name, err);
        }
    }

    onSuccess?.(uploadedImages, uploadedDocs);
    return { uploadedImages, uploadedDocs, errors };
}

// ─── Empty builders ─────────────────────────────────────────────────────────
export const emptyDeviceDoc = () => ({
    documentName: "",
    documentTypeId: null,
    documentNumber: "",
    issuedById: null,
    issuedByDate: "",
    documentValidTill: "",
    _file: null,
    _uid: `d_${Date.now()}_${Math.random()}`,
});

export const emptyDeviceImg = () => ({
    fileType: "",
    fileName: "",
    _file: null,
    _uid: `i_${Date.now()}_${Math.random()}`,
    _previewUrl: "",
});

// ─── File helpers ────────────────────────────────────────────────────────────
export const isDeviceImageFile = (name = "") => {
    const ext = (name?.split(".").pop() || "").toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
};

// ─── FormData helpers ────────────────────────────────────────────────────────
export const appendDeviceImages = (fd, prefix, images = []) => {
    images.forEach((img, ii) => {
        if (img._file) fd.append(`${prefix}[${ii}].file`, img._file);
        fd.append(`${prefix}[${ii}].fileName`, img.fileName || img._file?.name || "");
        fd.append(`${prefix}[${ii}].fileType`, img.fileType || "");
    });
};

export const appendDeviceDocuments = (fd, prefix, documents = []) => {
    documents.forEach((doc, di) => {
        if (doc._file) fd.append(`${prefix}[${di}].file`, doc._file);
        fd.append(`${prefix}[${di}].fileName`, doc.fileName || doc._file?.name || "");
        fd.append(`${prefix}[${di}].fileType`, doc.fileType || "");
        fd.append(`${prefix}[${di}].documentName`, doc.documentName || "");
        fd.append(`${prefix}[${di}].documentNumber`, doc.documentNumber || "");
        if (doc.documentTypeId != null) fd.append(`${prefix}[${di}].documentTypeId`, doc.documentTypeId);
        if (doc.issuedById != null) fd.append(`${prefix}[${di}].issuedById`, doc.issuedById);
        if (doc.issuedByDate) fd.append(`${prefix}[${di}].issuedByDate`, doc.issuedByDate);
        if (doc.documentValidTill) fd.append(`${prefix}[${di}].documentValidTill`, doc.documentValidTill);
    });
};