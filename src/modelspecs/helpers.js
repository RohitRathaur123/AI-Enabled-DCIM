import { axiosdevice } from "../../config"
import React from "react";
// ── Image URL from base64 ─────────────────────────────────────────────────────
export const getImageUrl = (img) => {
    if (img.base64Image) {
        const ext = img.fileName?.split(".").pop()?.toLowerCase();
        const mime = ext === "png" ? "image/png"
            : ext === "gif" ? "image/gif"
                : ext === "webp" ? "image/webp"
                    : "image/jpeg";
        return `data:${mime};base64,${img.base64Image}`;
    }
    if (img.imageBase64) return `data:${img.mimeType || "image/jpeg"};base64,${img.imageBase64}`;
    if (img.fileData) return `data:${img.contentType || "image/jpeg"};base64,${img.fileData}`;
    return "";
};

// ── transformImages ───────────────────────────────────────────────────────────
export const transformImages = (imgList = []) =>
    imgList.map(img => ({
        id: img.id,
        url: getImageUrl(img),
        name: img.fileName,
    }));

// ── transformDocs ─────────────────────────────────────────────────────────────
export const transformDocs = (docList = []) =>
    docList.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        contentType: doc.contentType,
        fileData: doc.fileData,
    }));

// ── transformParameters — ALL ModelParameter DB fields ────────────────────────
export const transformParameters = (paramList = [], getModelCategoryName) =>
    paramList.map(p => ({
        id: p.id,
        deviceModelId: p.deviceModelId,
        modelCategoryId: p.modelCategoryId,
        categoryName: p.modelCategoryName || getModelCategoryName?.(p.modelCategoryId) || "",
        parameterName: p.parameterName || "",
        parameterValue: p.parameterValue || "",
        unit: p.unit || "",
        capacity: p.capacity || "",
        processor: p.processor || "",
        ram: p.ram || "",
        storage: p.storage || "",
        remarks: p.remarks || "",
        firmwareVersion: p.firmwareVersion || "",
        protocol: p.protocol || "",
        warrantyDuration: p.warrantyDuration || "",
        endOfLife: p.endOfLife || "",
        intro: p.intro || "",
        uses: p.uses || "",
        feature: p.feature || "",
    }));

// ── transformSpec — ONLY ModelSpecification DB fields ────────────────────────
// NOTE: intro / uses / feature / firmwareVersion / protocol / warrantyDuration /
//       endOfLife are ModelParameter fields — they are NOT mapped from spec here.
export const transformSpec = (spec, opts = {}) => {
    const {
        paramList = [], imgList = [], docList = [],
        getDeviceTypeName, getModelCategoryName, getCompanyName,
    } = opts;
    return {
        // ── ModelSpecification fields only ──
        id: spec.id,
        name: spec.name || "",
        modelNumber: spec.modelNumber || "",
        remarks: spec.remarks || "",
        deviceTypeId: spec.deviceTypeId || null,
        deviceTypeName: getDeviceTypeName?.(spec.deviceTypeId) || spec.deviceTypeName || "",
        modelCategoryId: spec.modelCategoryId || null,
        modelCategoryName: getModelCategoryName?.(spec.modelCategoryId) || spec.modelCategoryName || "",
        companyId: spec.companyId || null,
        companyName: getCompanyName?.(spec.companyId) || spec.companyName || "",
        isDeleted: spec.isDeleted || false,
        createdDate: spec.createdAt ? spec.createdAt.split("T")[0] : "",
        // ── Related data ──
        parameters: paramList.length > 0
            ? transformParameters(paramList, getModelCategoryName)
            : transformParameters(spec.parameters || [], getModelCategoryName),
        images: imgList.length > 0
            ? transformImages(imgList)
            : transformImages(spec.images || []),
        documents: docList.length > 0
            ? transformDocs(docList)
            : transformDocs(spec.documents || []),
    };
};

// ── fetchParametersForSpec ────────────────────────────────────────────────────
export const fetchParametersForSpec = async (specId) => {
    try {
        const data = await axiosdevice.get(`ModelParameter/model/${specId}`);
        return Array.isArray(data) ? data : [];
    } catch { return []; }
};

// ── fetchImagesForSpec ────────────────────────────────────────────────────────
// Tries dedicated model-image endpoint first; falls back to company filter.
export const fetchImagesForSpec = async (specId, companyId) => {
    try {
        // preferred: endpoint scoped to this spec
        const data = await axiosdevice.get(`Image/model/${specId}`);
        if (Array.isArray(data) && data.length > 0) return data;
    } catch { }
    try {
        if (!companyId) return [];
        const data = await axiosdevice.get(`Image/by-company/${companyId}`);
        const all = Array.isArray(data) ? data : [];
        // filter by any of the possible FK field names the backend might use
        return all.filter(img =>
            img.modelSpecificationId === specId ||
            img.deviceModelId === specId ||
            img.entityId === specId
        );
    } catch { return []; }
};

// ── fetchDocsForSpec ──────────────────────────────────────────────────────────
// Same fallback pattern as images.
export const fetchDocsForSpec = async (specId, companyId) => {
    try {
        const data = await axiosdevice.get(`document/model/${specId}`);
        if (Array.isArray(data) && data.length > 0) return data;
    } catch { }
    try {
        if (!companyId) return [];
        const data = await axiosdevice.get(`document/company/${companyId}`);
        const all = Array.isArray(data) ? data : [];
        return all.filter(doc =>
            doc.modelSpecificationId === specId ||
            doc.deviceModelId === specId ||
            doc.entityId === specId
        );
    } catch { return []; }
};

// ── Datasheet download ────────────────────────────────────────────────────────
export const downloadDatasheet = (record) => {
    // Aggregate parameter-level fields for the summary block
    const params = record.parameters || [];
    const firmwares = [...new Set(params.map(p => p.firmwareVersion).filter(Boolean))];
    const protocols = [...new Set(params.map(p => p.protocol).filter(Boolean))];
    const warranties = [...new Set(params.map(p => p.warrantyDuration).filter(Boolean))];
    const eols = [...new Set(params.map(p => p.endOfLife).filter(Boolean))];
    const intros = [...new Set(params.map(p => p.intro).filter(Boolean))];
    const uses = [...new Set(params.map(p => p.uses).filter(Boolean))];
    const features = [...new Set(params.map(p => p.feature).filter(Boolean))];

    const lines = [
        "=".repeat(52),
        "  MODEL SPECIFICATION DATASHEET",
        "=".repeat(52),
        "",
        `  Name              : ${record.name}`,
        `  Model Number      : ${record.modelNumber || "-"}`,
        `  Device Type       : ${record.deviceTypeName || "-"}`,
        `  Model Category    : ${record.modelCategoryName || "-"}`,
        `  Company           : ${record.companyName || "-"}`,
        `  Remarks           : ${record.remarks || "-"}`,
        `  Created           : ${record.createdDate || "-"}`,
        "",
        ...(firmwares.length ? [`  Firmware Version  : ${firmwares.join(", ")}`] : []),
        ...(protocols.length ? [`  Protocol          : ${protocols.join(", ")}`] : []),
        ...(warranties.length ? [`  Warranty Duration : ${warranties.join(", ")}`] : []),
        ...(eols.length ? [`  End of Life       : ${eols.join(", ")}`] : []),
        "",
        ...(intros.length ? ["-".repeat(52), "  INTRODUCTION", "-".repeat(52), ...intros.map(t => `  ${t}`), ""] : []),
        ...(uses.length ? ["-".repeat(52), "  USES", "-".repeat(52), ...uses.map(t => `  ${t}`), ""] : []),
        ...(features.length ? ["-".repeat(52), "  FEATURES", "-".repeat(52), ...features.map(t => `  ${t}`), ""] : []),
        "-".repeat(52),
        `  PARAMETERS (${params.length})`,
        "-".repeat(52),
        ...(params.length > 0
            ? params.map(p => {
                const parts = [
                    `  [${p.categoryName || "-"}]`,
                    `${p.parameterName} : ${p.parameterValue}`,
                    p.unit ? `(${p.unit})` : "",
                    p.capacity ? `| Capacity: ${p.capacity}` : "",
                    p.processor ? `| CPU: ${p.processor}` : "",
                    p.ram ? `| RAM: ${p.ram}` : "",
                    p.storage ? `| Storage: ${p.storage}` : "",
                ].filter(Boolean);
                return parts.join(" ");
            })
            : ["  No parameters defined"]),
        "",
        "=".repeat(52),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.name.replace(/[^a-z0-9]/gi, "_")}_datasheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── File icon helper ──────────────────────────────────────────────────────────
export const getFileExtIcon = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    return ext === "pdf" ? "pdf"
        : (ext === "doc" || ext === "docx") ? "doc"
            : "other";
};