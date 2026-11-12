// filestore.js — COMPLETE FILE (replace your existing filestore.js with this)
// ─────────────────────────────────────────────────────────────────────────────
// Endpoints:
//   POST   /api/FileStore/upload-files
//   GET    /api/FileStore/entity/{entityTypeId}/{entityId}?fileCategory=Image|Document
//   PUT    /api/FileStore/{id}
//   DELETE /api/FileStore/remove-file/{fileId}
// ─────────────────────────────────────────────────────────────────────────────

import axiosInstance from "../../config"; // adjust path if needed
import React from "react";

// ─── Parse any API response shape into a plain array ─────────────────────────
function toArray(raw) {
    const d = raw?.data !== undefined ? raw.data : raw;
    if (Array.isArray(d))        return d;
    if (Array.isArray(d?.data))  return d.data;
    if (Array.isArray(d?.items)) return d.items;
    return [];
}

// ─── EntityType cache ─────────────────────────────────────────────────────────
let _entityTypeCache = null;

async function fetchEntityTypeList() {
    if (_entityTypeCache) return _entityTypeCache;
    try {
        const raw  = await axiosInstance.get("/EntityType/get-all-entity");
        const data = raw?.data !== undefined ? raw.data : raw;
        _entityTypeCache =
            Array.isArray(data)          ? data
            : Array.isArray(data?.data)  ? data.data
            : Array.isArray(data?.items) ? data.items
            : [];
            console.log("🔍 EntityType list:", _entityTypeCache); // ← ADD THIS
            console.log("🔍 EntityType names:", _entityTypeCache.map(e => e.entityTypeName || e.name || e.typeName));
            return _entityTypeCache;
    } catch (err) {
        console.error("fetchEntityTypeList error:", err);
        _entityTypeCache = [];
    }
    return _entityTypeCache;
}

export function clearEntityTypeCache() {
    _entityTypeCache = null;
}

// export async function getEntityTypeId(entityName) {
//     const list  = await fetchEntityTypeList();
//     const found = list.find(
//         (e) =>
//             (e.entityTypeName || e.name || e.typeName || "")
//                 .toLowerCase() === entityName.toLowerCase()
//     );
//     return found?.id ?? null;
// }

// filestore.js — Fixed getEntityTypeId with better matching
export async function getEntityTypeId(entityName) {
    const list = await fetchEntityTypeList();
    
    // DEBUG: Log what we're searching for
    console.log(`🔍 SEARCH: Looking for entityName = "${entityName}"`);
    console.log("🔍 Available entity types:", list.map(e => ({
        id: e.id,
        entityName: e.entityName,
        entityTypeName: e.entityTypeName,
        name: e.name,
        typeName: e.typeName,
        allFields: Object.keys(e)
    })));
    
    // Try multiple matching strategies
    const searchLower = entityName.toLowerCase();
    
    const found = list.find((e) => {
        // Check all possible name fields
        const possibleNames = [
            e.entityName,
            e.entityTypeName,
            e.name,
            e.typeName,
            e.entityType,
            e.TypeName,
            e.EntityTypeName
        ].filter(Boolean);
        
        // Check if any of these match (case insensitive)
        const matches = possibleNames.some(name => 
            name.toLowerCase() === searchLower ||
            name.toLowerCase() === searchLower.replace(/\s/g, '') ||
            name.toLowerCase().includes(searchLower) ||
            searchLower.includes(name.toLowerCase())
        );
        
        if (matches) {
            console.log(`  ✓ MATCH: "${possibleNames.join(' / ')}" === "${entityName}"`);
        }
        return matches;
    });
    
    if (found) {
        console.log(`✅ FOUND: ${entityName} → ID=${found.id}`);
        // Try to get the ID from any possible field
        return found.id ?? found.Id ?? found.entityTypeId ?? found.EntityTypeId ?? null;
    } else {
        console.warn(`❌ NOT FOUND: "${entityName}" in entity type list`);
        console.warn("Available names:", list.map(e => e.entityName || e.entityTypeName || e.name || e.typeName));
        return null;
    }
}
// ─── FETCH files for an entity ────────────────────────────────────────────────
// fileCategory: "Image" | "Document" | undefined (returns both)
// filestore.js — fetchEntityFiles with better error handling
export async function fetchEntityFiles(entityTypeId, entityId, fileCategory) {
    if (!entityTypeId || !entityId) {
        console.warn("fetchEntityFiles: missing entityTypeId or entityId", { entityTypeId, entityId });
        return [];
    }
    
    try {
        let url = `/FileStore/entity/${entityTypeId}/${entityId}`;
        if (fileCategory) url += `?fileCategory=${fileCategory}`;
        
        console.log(`📡 Fetching from: ${url}`);
        const response = await axiosInstance.get(url);
        console.log(`📡 Response status: ${response.status}`, response.data);
        
        const result = toArray(response);
        console.log(`📡 Parsed result: ${result?.length || 0} items`);
        return result;
    } catch (err) {
        console.error("fetchEntityFiles error:", err);
        console.error("Request URL:", `/FileStore/entity/${entityTypeId}/${entityId}${fileCategory ? `?fileCategory=${fileCategory}` : ''}`);
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", err.response.data);
        }
        return [];
    }
}

// ─── UPLOAD a single file ─────────────────────────────────────────────────────
export async function uploadFile(params) {
    const fd = new FormData();

    // Required fields
    fd.append("File",         params.file);
    fd.append("EntityTypeId", params.entityTypeId);
    fd.append("EntityId",     params.entityId);
    fd.append("FileCategory", params.fileCategory); // "Image" or "Document" — mandatory

    // Optional image fields
    if (params.fileUse)           fd.append("FileUse",           params.fileUse);
    if (params.fileExpiryDate)    fd.append("FileExpiryDate",    new Date(params.fileExpiryDate).toISOString());

    // Optional document fields
    if (params.documentName)      fd.append("DocumentName",      params.documentName);
    if (params.documentNumber)    fd.append("DocumentNumber",    params.documentNumber);
    if (params.documentTypeId)    fd.append("DocumentTypeId",    params.documentTypeId);
    if (params.issuedById)        fd.append("IssuedById",        params.issuedById);
    if (params.issuedByDate)      fd.append("IssuedByDate",      new Date(params.issuedByDate).toISOString());
    if (params.documentValidTill) fd.append("DocumentValidTill", new Date(params.documentValidTill).toISOString());

    const raw   = await axiosInstance.post("/FileStore/upload-files", fd);
    return raw?.data !== undefined ? raw.data : raw;
}

// ─── UPDATE file metadata ─────────────────────────────────────────────────────
export async function updateFile(fileId, params) {
    const fd = new FormData();
    if (params.file)              fd.append("File",             params.file);
    if (params.fileUse)           fd.append("FileUse",          params.fileUse);
    if (params.fileExpiryDate)    fd.append("FileExpiryDate",   new Date(params.fileExpiryDate).toISOString());
    if (params.documentName)      fd.append("DocumentName",     params.documentName);
    if (params.documentNumber)    fd.append("DocumentNumber",   params.documentNumber);
    if (params.documentTypeId)    fd.append("DocumentTypeId",   params.documentTypeId);
    if (params.issuedById)        fd.append("IssuedById",       params.issuedById);
    if (params.issuedByDate)      fd.append("IssuedByDate",     new Date(params.issuedByDate).toISOString());
    if (params.documentValidTill) fd.append("DocumentValidTill",new Date(params.documentValidTill).toISOString());

    const raw   = await axiosInstance.post(`/FileStore/update-file/${fileId}`, fd);
    return raw?.data !== undefined ? raw.data : raw;
}

// ─── DELETE a file ────────────────────────────────────────────────────────────
export async function deleteFile(fileId) {
    await axiosInstance.delete(`/FileStore/remove-file/${fileId}`);
}

// ─── UPLOAD all pending items (generic) ──────────────────────────────────────
export async function uploadAllPending(items, entityTypeId, entityId, fileCategory, extraFieldsFn) {
    if (!entityTypeId || !entityId) {
        console.warn("uploadAllPending: missing entityTypeId or entityId");
        return items;
    }
    const result = [...items];
    for (let i = 0; i < result.length; i++) {
        const item = result[i];
        if (item.id || !item._file) continue;
        try {
            const extra = extraFieldsFn ? extraFieldsFn(item) : {};
            const saved = await uploadFile({
                file: item._file,
                entityTypeId,
                entityId,
                fileCategory, // "Image" or "Document"
                ...extra,
            });
            result[i] = { ...item, ...saved, id: saved?.id ?? null, _file: null, _pending: false };
        } catch (err) {
            console.error(`uploadAllPending failed for item ${i}:`, err);
        }
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// uploadEntityFiles — main reusable function
//
// Usage from any component:
//
//   import { uploadEntityFiles } from "./filestore";
//
//   await uploadEntityFiles({
//       entityName:  "Company",               // matches EntityType API name
//       entityId:    savedCompanyId,
//       images:      companyImagesRef.current, // full array — pending filtered internally
//       docs:        companyDocsRef.current,
//       onSuccess:   (imgCount, docCount) => message.success(`${imgCount} images uploaded`),
//       onFileError: (fileName, err)      => message.error(`"${fileName}" failed`),
//   });
//
// Returns: { uploadedImages: number, uploadedDocs: number, errors: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadEntityFiles({
    entityName,
    entityId,
    images   = [],
    docs     = [],
    onSuccess,
    onFileError,
}) {
    if (!entityName || !entityId) {
        console.warn("uploadEntityFiles: entityName and entityId are required");
        return { uploadedImages: 0, uploadedDocs: 0, errors: ["Missing entityName or entityId"] };
    }

    const entityTypeId = await getEntityTypeId(entityName);
    if (!entityTypeId) {
        const msg = `EntityTypeId not found for "${entityName}" — check /api/EntityType/get-all-entity`;
        console.warn(msg);
        return { uploadedImages: 0, uploadedDocs: 0, errors: [msg] };
    }

    const pendingImages = images.filter((img) => !img.id && img._file);
    const pendingDocs   = docs.filter((doc)   => !doc.id && doc._file);
    const errors        = [];

    // ── Upload images — FileCategory: "Image" ────────────────────────────────
    let uploadedImages = 0;
    for (const img of pendingImages) {
        try {
            await uploadFile({
                file:          img._file,
                entityTypeId,
                entityId,
                fileCategory:  "Image",           // ← mandatory, always "Image"
                fileUse:       img.fileUse        || undefined,
                fileExpiryDate:img.fileExpiryDate || undefined,
            });
            uploadedImages++;
        } catch (err) {
            const name = img.fileName || img._file?.name || "unknown";
            console.error(`Image upload failed: ${name}`, err);
            errors.push(name);
            onFileError?.(name, err);
        }
    }

    // ── Upload documents — FileCategory: "Document" ──────────────────────────
    let uploadedDocs = 0;
    for (const doc of pendingDocs) {
        try {
            await uploadFile({
                file:             doc._file,
                entityTypeId,
                entityId,
                fileCategory:     "Document",     // ← mandatory, always "Document"
                documentName:     doc.documentName      || undefined,
                documentNumber:   doc.documentNumber    || undefined,
                documentTypeId:   doc.documentTypeId    || undefined,
                issuedById:       doc.issuedById        || undefined,
                issuedByDate:     doc.issuedByDate      || undefined,
                documentValidTill:doc.documentValidTill || undefined,
            });
            uploadedDocs++;
        } catch (err) {
            const name = doc.documentName || doc.fileName || doc._file?.name || "unknown";
            console.error(`Doc upload failed: ${name}`, err);
            errors.push(name);
            onFileError?.(name, err);
        }
    }

    onSuccess?.(uploadedImages, uploadedDocs);

    return { uploadedImages, uploadedDocs, errors };
}

