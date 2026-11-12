// helpers.js
import { axiosdevice } from "../../config";
import React from "react";
const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────
// Response Parser
// Backend returns: { page, pageSize, totalRecords, totalPages, data: [...] }
// axiosdevice interceptor may already unwrap res.data → so "res" might BE
// that body, OR it might still be the raw axios response where res.data is it.
// ─────────────────────────────────────────────────────────────
export const extractPaginatedResponse = (res) => {
    // Helper: try to extract from a candidate object
    const tryExtract = (obj) => {
        if (!obj || typeof obj !== "object") return null;

        // Shape: { totalRecords, data: [...] }
        if ("totalRecords" in obj && Array.isArray(obj.data)) {
            return {
                rows: obj.data,
                total: Number(obj.totalRecords) || 0,
            };
        }

        // Shape: { totalCount, data: [...] }
        if ("totalCount" in obj && Array.isArray(obj.data)) {
            return {
                rows: obj.data,
                total: Number(obj.totalCount) || 0,
            };
        }

        // Shape: { items: [...], totalCount }
        if (Array.isArray(obj.items)) {
            return {
                rows: obj.items,
                total: Number(obj.totalCount ?? obj.totalRecords ?? obj.total) || obj.items.length,
            };
        }

        // Plain array
        if (Array.isArray(obj)) {
            return { rows: obj, total: obj.length };
        }

        return null;
    };

    // 1. Try res directly (interceptor already unwrapped)
    const direct = tryExtract(res);
    if (direct) return direct;

    // 2. Try res.data (raw axios response)
    const nested = tryExtract(res?.data);
    if (nested) return nested;

    console.warn("[extractPaginatedResponse] unrecognised shape:", res);
    return { rows: [], total: 0 };
};

// ─────────────────────────────────────────────────────────────
// Query Builder
// ─────────────────────────────────────────────────────────────
const buildParams = ({ page, pageSize, masterId, categoryId, typeId, companyId }) => {
    const params = new URLSearchParams();

    params.set("Page", String(page));
    params.set("PageSize", String(pageSize));

    if (masterId && masterId !== "all") params.set("DeviceMasterId", String(masterId));
    if (categoryId && categoryId !== "all") params.set("DeviceCategoryId", String(categoryId));
    if (typeId && typeId !== "all") params.set("DeviceTypeId", String(typeId));
    if (companyId && companyId !== "all") params.set("CompanyId", String(companyId));

    return params.toString();
};

// ─────────────────────────────────────────────────────────────
// Single Fetch
// ─────────────────────────────────────────────────────────────
export const fetchDeviceDetails = async ({
    page = 1,
    pageSize = PAGE_SIZE,
    masterId = "all",
    categoryId = "all",
    typeId = "all",
    companyId = "all",
} = {}) => {
    try {
        const queryString = buildParams({ page, pageSize, masterId, categoryId, typeId, companyId });
        const response = await axiosdevice.get(`/DeviceDetail/get-all-devicedetail?${queryString}`);

        const result = extractPaginatedResponse(response);
        console.log("[fetchDeviceDetails] page:", page, "rows:", result.rows.length, "total:", result.total, result);
        return result;
    } catch (error) {
        console.error("[fetchDeviceDetails] error:", error);
        return { rows: [], total: 0 };
    }
};

// ─────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────
export const createDeviceDetail = async (payload) =>
    await axiosdevice.post("/DeviceDetail/create-devicedetail", payload);

export const updateDeviceDetail = async (id, payload) =>
    await axiosdevice.post(`/DeviceDetail/update-devicedetail${id}`, payload);

export const deleteDeviceDetail = async (id) =>
    await axiosdevice.post(`/DeviceDetail/soft-delete/${id}`);

// ─────────────────────────────────────────────────────────────
// Payload Builder
// ─────────────────────────────────────────────────────────────
export const buildPayload = (formData) => ({
    deviceMasterId: formData.deviceMasterId ? formData.deviceMasterId : null,

    imei: formData.imei?.trim() || null,
    macAddress: formData.macAddress?.trim() || null,
    tagNumber: formData.tagNumber?.trim() || null,
    shortName: formData.shortName?.trim() || null,
    longName: formData.longName?.trim() || null,
    serialNumber: formData.serialNumber?.trim() || null,

    purchaseDate: formData.purchaseDate || null,
    warrantyExpiry: formData.warrantyExpiry || null,

    purchaseCost:
        formData.purchaseCost !== "" && formData.purchaseCost !== null
            ? Number(formData.purchaseCost)
            : null,

    remarks: formData.remarks?.trim() || null,
    ipAddress: formData.ipAddress?.trim() || null,
    simNumber: formData.simNumber?.trim() || null,
});

export const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.items && Array.isArray(res.items)) return res.items;
    return [];
};