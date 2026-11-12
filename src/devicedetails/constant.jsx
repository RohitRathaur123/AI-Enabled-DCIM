// constant.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared constants + helpers for the Device module (Device master, Locations,
// Model Specification, Images, Documents) — everything here is backed by the
// DEVICE API (axiosdevice) using the generic FileStore endpoints:
//
//   POST   /api/FileStore/upload-file
//   GET    /api/FileStore/entity/{entityTypeId}/{entityId}?fileCategory=Image|Document
//   GET    /api/FileStore/{id}
//   POST   /api/FileStore/update-file/{id}
//   DELETE /api/FileStore/remove-file/{fileId}
// ─────────────────────────────────────────────────────────────────────────────

import { fileUrlById } from "../staticData";

export const EMPTY_FORM = {
    deviceMasterId: null,
    imei: "",
    macAddress: "",
    tagNumber: "",
    shortName: "",
    longName: "",
    serialNumber: "",
    purchaseDate: null,
    warrantyExpiry: null,
    purchaseCost: "",
    remarks: "",
    ipAddress: "",
    simNumber: "",
    rfidTagNumber: "",   // ← used in setup-tracking POST after device create
};

// ── Static data only: no Device API / file server ────────────────────────
// Stored files carry data: / blob: URLs (src/staticData/core/files.js).
export const DEVICE_BASE_URL = "";

// ── Download URLs — resolved from the static file store ─────────────────
export const getDeviceImgDownloadUrl = (fileId) => {
    if (!fileId) return null;
    return fileUrlById(fileId);
};

export const getDeviceDocDownloadUrl = (fileId) => {
    if (!fileId) return null;
    return fileUrlById(fileId);
};

// ── Path normalizer ──────────────────────────────────────────────────────────
// Backend stores paths like "Uploads\\Device\\Images\\photo.jpg" (Windows
// style, no host). Passing that straight into <img src=...> / <iframe src=...>
// fails silently in the browser — you only ever see the placeholder icon and
// filename, never the actual image/PDF. This turns whatever we get back
// (already-absolute URL, or a raw relative/Windows path) into something the
// browser can actually load.
// ─────────────────────────────────────────────────────────────────────────────
// export const normalizeDeviceFilePath = (filePath) => {
//     if (!filePath) return null;
//     const normalized = String(filePath).replace(/\\/g, "/");
//     if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;
//     const idx = normalized.toLowerCase().indexOf("uploads/");
//     const relative = idx !== -1 ? normalized.slice(idx) : normalized.replace(/^\/+/, "");
//     return `${DEVICE_BASE_URL}/${relative}`;
// };

// ── Path normalizer ──────────────────────────────────────────────────────────
export const normalizeDeviceFilePath = (filePath) => {
    if (!filePath) return null;
    const normalized = String(filePath).replace(/\\/g, "/");
    if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;
    const idx = normalized.toLowerCase().indexOf("uploads/");
    const relative = idx !== -1 ? normalized.slice(idx) : normalized.replace(/^\/+/, "");
    // 🔧 FIX: DEVICE_BASE_URL kabhi trailing slash ke saath aa sakta hai (fallback wala),
    // isliye ek hi slash guarantee karo (double slash "//uploads" na bane)
    const base = DEVICE_BASE_URL.replace(/\/+$/, "");
    return `${base}/${relative}`;
};

// 🔧 FIX: ab yeh function STRING (filePath) aur OBJECT (record) — dono accept karta hai
export const resolveDeviceFileUrl = (input) => {
    if (!input) return null;

    // Case 1: seedha string filePath diya gaya hai
    if (typeof input === "string") {
        return normalizeDeviceFilePath(input);
    }

    // Case 2: poora record object diya gaya hai
    return (
        input._previewUrl ||
        normalizeDeviceFilePath(input.filePath) ||
        normalizeDeviceFilePath(input.documentPath) ||
        normalizeDeviceFilePath(input.fileUrl) ||
        normalizeDeviceFilePath(input.path) ||
        null
    );
};

// Convenience wrapper for a FileStore record — tries every field name the
// Device API has been seen to use for the stored path, plus any local blob
// preview URL for not-yet-uploaded files. Use this everywhere you need to
// render a preview (image thumbnails, doc iframe/img preview, etc).
// export const resolveDeviceFileUrl = (record) => {
//     if (!record) return null;
//     return (
//         record._previewUrl ||
//         normalizeDeviceFilePath(record.filePath) ||
//         normalizeDeviceFilePath(record.documentPath) ||
//         normalizeDeviceFilePath(record.fileUrl) ||
//         normalizeDeviceFilePath(record.path) ||
//         null
//     );
// };

// ─── Theme tokens (T) ────────────────────────────────────────────────────────
export const T = {
    teal: { text: "#0F766E", bg: "#F0FDFA", border: "#99F6E4" },
    green: { text: "#16A34A", bg: "#F0FDF4" },
    amber: { text: "#B45309", bg: "#FFFBEB", border: "#FDE68A", dark: "#92400E" },
    radius: { md: 8, lg: 12 },
};

// ─── Image file type options for the "File Type" dropdowns ─────────────────
export const IMG_FILE_TYPES = [
    "Device Photo",
    "Installation",
    "Nameplate",
    "Serial Number",
    "Damage",
    "Other",
];