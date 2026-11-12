import {
    BuildOutlined, PictureOutlined, FileTextOutlined,
    UserOutlined, HomeOutlined, CreditCardOutlined,
} from "@ant-design/icons";

import React from "react"
import { fileUrlById } from "../staticData";
// ─────────────────────────────────────────────────────────────────────────────
//  BASE URL  (trailing slash included — paths append directly)
//  e.g.  BASE_URL + "uploads/img.jpg"  →  "uploads/img.jpg" (static data: no file server)
// ─────────────────────────────────────────────────────────────────────────────
// Static data only: there is no file server. Stored files carry data: / blob:
// URLs (see src/staticData/core/files.js), so no base URL is needed.
export const BASE_URL = "";

// ─────────────────────────────────────────────────────────────────────────────
//  URL HELPERS
//
//  getImageUrl / getDocUrl  →  serve file for <Image> / <iframe> preview
//  getImgDownloadUrl / getDocDownloadUrl  →  force-download by record ID
//
//  HOW TO USE FOR DOWNLOAD  (important — do NOT use <a href> tag):
//    onClick={() => window.open(getImgDownloadUrl(img.id), "_blank")}
//    onClick={() => window.open(getDocDownloadUrl(doc.id), "_blank")}
//
//  Reason: <a href="..." download> inside chrome-error:// frame is blocked
//  by mixed-content policy. window.open() bypasses the restriction.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a browser-renderable URL from a relative file path stored in the DB.
 * Handles leading slashes, absolute URLs, and Windows backslashes.
 *
 * Example:
 *   filePath = "uploads\\images\\logo.png"
 *   → "uploads/images/logo.png"
 * 
 * 
 */
/**
 * Backend kabhi kabhi full Windows absolute path return karta hai:
 *   "D:\\DeviceManagment2\\...\\Uploads\\Images\\Company\\file.png"
 * Ya forward-slash wala:
 *   "D:/DeviceManagment2/.../Uploads/Images/Company/file.png"
 *
 * Hume sirf "Uploads/..." se shuru hone wala relative part chahiye.
 */
const normalizeFilePath = (filePath) => {
    if (!filePath) return filePath;
    // Backslash → forward slash
    const normalized = filePath.replace(/\\/g, "/");
    // "Uploads/" se pehle ka sab kuch hata do (case-insensitive)
    const uploadsIdx = normalized.toLowerCase().indexOf("uploads/");
    if (uploadsIdx !== -1) return normalized.slice(uploadsIdx);
    return normalized;
};
const buildFileUrl = (filePath) => {
    if (!filePath) return null;
    const clean = normalizeFilePath(filePath);           // ← yeh add karo
    if (/^(https?:|data:|blob:)/i.test(clean)) return clean;
    const stripped = clean.replace(/^\/+/, "");
    return `${BASE_URL}${stripped}`;
};

/** URL to display an image in <Image src={...}> */
export const getImageUrl = (filePath) => buildFileUrl(filePath);

/** URL to display a document in <iframe src={...}> or <Image src={...}> */
export const getDocUrl = (filePath) => buildFileUrl(filePath);

/**
 * Force-download URL for an image record by ID.
 * Usage:  window.open(getImgDownloadUrl(img.id), "_blank")
 */
export const getImgDownloadUrl = (id) => {
    if (!id && id !== 0) return null;
    return fileUrlById(id);
};

/**
 * Force-download URL for a document record by ID.
 * Usage:  window.open(getDocDownloadUrl(doc.id), "_blank")
 */
export const getDocDownloadUrl = (id) => {
    if (!id && id !== 0) return null;
    return fileUrlById(id);
};

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
export const T = {
    blue: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", dark: "#1E40AF" },
    green: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", dark: "#15803D" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", dark: "#B45309" },
    purple: { bg: "#FAF5FF", border: "#E9D5FF", text: "#7C3AED", dark: "#6D28D9" },
    pink: { bg: "#FFF1F2", border: "#FECDD3", text: "#E11D48", dark: "#BE123C" },
    teal: { bg: "#F0FDFA", border: "#99F6E4", text: "#0D9488", dark: "#0F766E" },
    gray: { bg: "#F9FAFB", border: "#E5E7EB", text: "#374151", dark: "#1F2937" },
    radius: { sm: 6, md: 8, lg: 12 },
    shadow: { sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE FILE TYPES
// ─────────────────────────────────────────────────────────────────────────────
export const IMG_FILE_TYPES = [
    "Logo",
    "Office Photo",
    "ID Proof",
    "Signature",
    "Building Photo",
    "Map Screenshot",
    "Cheque Scan",
    "Passbook",
    "Other",
];

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL SIDEBAR STEPS
// ─────────────────────────────────────────────────────────────────────────────
export const MODAL_STEPS = [
    { key: "basic", label: "Basic Information", icon: <BuildOutlined />, color: T.blue.text },
    { key: "images", label: "Company Images", icon: <PictureOutlined />, color: T.pink.text },
    { key: "documents", label: "Documents", icon: <FileTextOutlined />, color: T.amber.text },
    { key: "contacts", label: "Contact Persons", icon: <UserOutlined />, color: T.green.text },
    { key: "addresses", label: "Addresses", icon: <HomeOutlined />, color: T.amber.dark },
    { key: "banks", label: "Bank Details", icon: <CreditCardOutlined />, color: T.purple.text },
];

export const LOCKED_SECTIONS = ["images", "documents", "contacts", "addresses", "banks"];