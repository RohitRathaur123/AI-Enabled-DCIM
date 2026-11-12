// DeviceTypeDevicesModal.jsx
// DeviceType se linked saari Devices dikhao

import { useEffect, useState } from "react";
import { Modal, Spin, Empty, Tag, Badge, Input, Pagination, message } from "antd";
import { 
    SearchOutlined, 
    LaptopOutlined, 
    CalendarOutlined, 
    EnvironmentOutlined,
    WifiOutlined,
    MobileOutlined,
    BarcodeOutlined,
    TagOutlined,
    DollarOutlined
} from "@ant-design/icons";
import { axiosdevice } from "../../config";
import React from "react";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

export default function DeviceTypeDevicesModal({ open, onCancel, deviceType }) {
    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // ── Extract paginated response ──────────────────────────────────────────
    const extractPaginated = (response) => {
        const body = response?.data ?? response;
        if (body && typeof body === 'object' && 'totalRecords' in body) {
            return {
                rows: Array.isArray(body.data) ? body.data : [],
                total: Number(body.totalRecords) || 0
            };
        }
        if (Array.isArray(body)) {
            return { rows: body, total: body.length };
        }
        return { rows: [], total: 0 };
    };

    // ── Fetch devices ───────────────────────────────────────────────────────
    const fetchDevices = async (page, searchQuery) => {
        if (!deviceType?.id) return;

        setLoading(true);
        try {
            const params = {
                Page: page,
                PageSize: PAGE_SIZE,
                IsPaginated: true,
            };

            if (searchQuery && searchQuery.trim()) {
                params.Search = searchQuery.trim();
            }

            const response = await axiosdevice.get(
                `DeviceDetail/by-type/${deviceType.id}`,
                { params }
            );

            const { rows, total } = extractPaginated(response);
            setDevices(rows);
            console.log("ffffffff",response)
            setTotalRecords(total);
        } catch (err) {
            console.error("Fetch devices error:", err);
            message.error("Failed to load devices");
            setDevices([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    // ── Load on modal open ──────────────────────────────────────────────────
    useEffect(() => {
        if (!open || !deviceType?.id) return;
        setSearch("");
        setCurrentPage(1);
        fetchDevices(1, "");
    }, [open, deviceType?.id]);

    // ── Search handler with debounce ───────────────────────────────────────
    const handleSearch = (value) => {
        setSearch(value);
        setCurrentPage(1);
        fetchDevices(1, value);
    };

    // ── Page change ─────────────────────────────────────────────────────────
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchDevices(page, search);
    };

    // ── Format currency ─────────────────────────────────────────────────────
    const formatCurrency = (value) => {
        if (!value) return null;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={760}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: "#FFF7ED", border: "1px solid #FED7AA",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <LaptopOutlined style={{ color: "#EA580C", fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            Devices — {deviceType?.name || "Device Type"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>
                            All devices linked to this type
                        </div>
                    </div>
                </div>
            }
        >
            {/* ── Summary bar ── */}
            {!loading && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: devices.length ? "#FFF7ED" : "#F9FAFB",
                    border: `1px solid ${devices.length ? "#FED7AA" : "#E5E7EB"}`,
                    borderRadius: 8,
                    marginBottom: 12,
                }}>
                    <LaptopOutlined style={{ color: devices.length ? "#EA580C" : "#9CA3AF", fontSize: 14 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: devices.length ? "#C2410C" : "#6B7280" }}>
                        Total Devices:
                    </span>
                    <Badge
                        count={totalRecords}
                        showZero
                        style={{
                            backgroundColor: devices.length ? "#EA580C" : "#9CA3AF",
                            fontSize: 12, fontWeight: 700,
                        }}
                    />
                    {search && (
                        <Tag color="orange" style={{ fontSize: 11, marginLeft: 8 }}>
                            Filtered: "{search}"
                        </Tag>
                    )}
                </div>
            )}

            {/* ── Search ── */}
            <Input
                prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                placeholder="Search by name, serial, IMEI, MAC, tag or RFID..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                size="middle"
                style={{ marginBottom: 12 }}
            />

            {/* ── Body ── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
                        Loading devices…
                    </div>
                </div>
            ) : devices.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                            {search.trim()
                                ? `No devices found for "${search}"`
                                : "No devices linked to this device type"}
                        </span>
                    }
                    style={{ padding: "28px 0" }}
                />
            ) : (
                <>
                    <div style={{
                        maxHeight: 420,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}>
                        {devices.map((device, idx) => {
                            const isExpired = device.warrantyExpiry && 
                                dayjs(device.warrantyExpiry).isBefore(dayjs());

                            return (
                                <div
                                    key={device.id ?? idx}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        padding: "12px 14px",
                                        background: "#FAFAFA",
                                        border: "1px solid #F3F4F6",
                                        borderRadius: 8,
                                        transition: "all 0.15s",
                                        cursor: "default",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "#FED7AA";
                                        e.currentTarget.style.background = "#F8FAFC";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "#F3F4F6";
                                        e.currentTarget.style.background = "#FAFAFA";
                                    }}
                                >
                                    {/* Top row: Index + Short Name + Serial + Tags */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 6,
                                            background: "#FFF7ED", border: "1px solid #FED7AA",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#EA580C",
                                        }}>
                                            {idx + 1}
                                        </div>

                                        <span style={{
                                            fontSize: 14, fontWeight: 600, color: "#111827",
                                        }}>
                                            {device.shortName || "—"}
                                        </span>

                                        {device.serialNumber && (
                                            <Tag icon={<BarcodeOutlined />} color="default" style={{ fontSize: 11, margin: 0 }}>
                                                {device.serialNumber}
                                            </Tag>
                                        )}

                                        {device.imei && (
                                            <Tag icon={<MobileOutlined />} color="blue" style={{ fontSize: 11, margin: 0 }}>
                                                IMEI: {device.imei}
                                            </Tag>
                                        )}

                                        {device.macAddress && (
                                            <Tag icon={<WifiOutlined />} color="cyan" style={{ fontSize: 11, margin: 0 }}>
                                                MAC: {device.macAddress}
                                            </Tag>
                                        )}

                                        {device.tagNumber && (
                                            <Tag icon={<TagOutlined />} color="purple" style={{ fontSize: 11, margin: 0 }}>
                                                Tag: {device.tagNumber}
                                            </Tag>
                                        )}

                                        {device.rfidTagNumber && (
                                            <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                                                RFID: {device.rfidTagNumber}
                                            </Tag>
                                        )}
                                    </div>

                                    {/* Bottom row: Details */}
                                    <div style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "6px 14px",
                                        marginTop: 6,
                                        paddingLeft: 38,
                                    }}>
                                        {/* Purchase Date */}
                                        {device.purchaseDate && (
                                            <span style={{
                                                fontSize: 11, color: "#6B7280",
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}>
                                                <CalendarOutlined style={{ fontSize: 11 }} />
                                                Purchased: {dayjs(device.purchaseDate).format("DD MMM YYYY")}
                                            </span>
                                        )}

                                        {/* Warranty */}
                                        {device.warrantyExpiry && (
                                            <span style={{
                                                fontSize: 11,
                                                display: "flex", alignItems: "center", gap: 4,
                                                color: isExpired ? "#DC2626" : "#16A34A",
                                                fontWeight: isExpired ? 600 : 500,
                                            }}>
                                                <CalendarOutlined style={{ fontSize: 11 }} />
                                                Warranty: {dayjs(device.warrantyExpiry).format("DD MMM YYYY")}
                                                {isExpired && " (Expired)"}
                                            </span>
                                        )}

                                        {/* Purchase Cost */}
                                        {device.purchaseCost && (
                                            <span style={{
                                                fontSize: 11, color: "#065F46",
                                                display: "flex", alignItems: "center", gap: 4,
                                                fontWeight: 600,
                                            }}>
                                                <DollarOutlined style={{ fontSize: 11 }} />
                                                {formatCurrency(device.purchaseCost)}
                                            </span>
                                        )}

                                        {/* IP Address */}
                                        {device.ipAddress && (
                                            <span style={{
                                                fontSize: 11, color: "#6B7280",
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}>
                                                <WifiOutlined style={{ fontSize: 11 }} />
                                                {device.ipAddress}
                                            </span>
                                        )}

                                        {/* SIM Number */}
                                        {device.simNumber && (
                                            <span style={{
                                                fontSize: 11, color: "#6B7280",
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}>
                                                <MobileOutlined style={{ fontSize: 11 }} />
                                                SIM: {device.simNumber}
                                            </span>
                                        )}

                                        {/* Location */}
                                        {device.locationName && (
                                            <span style={{
                                                fontSize: 11, color: "#0369A1",
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}>
                                                <EnvironmentOutlined style={{ fontSize: 11 }} />
                                                {device.locationName}
                                            </span>
                                        )}

                                        {/* Long Name */}
                                        {device.longName && device.longName !== device.shortName && (
                                            <span style={{
                                                fontSize: 11, color: "#6B7280",
                                                fontStyle: "italic",
                                            }}>
                                                {device.longName}
                                            </span>
                                        )}

                                        {/* Remarks */}
                                        {device.remarks && (
                                            <span style={{
                                                fontSize: 11, color: "#9CA3AF",
                                                background: "#F3F4F6",
                                                padding: "0 6px",
                                                borderRadius: 4,
                                            }}>
                                                {device.remarks}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Pagination ── */}
                    {totalRecords > PAGE_SIZE && (
                        <div style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            paddingTop: 12,
                            borderTop: "1px solid #F3F4F6",
                            marginTop: 12,
                        }}>
                            <Pagination
                                current={currentPage}
                                pageSize={PAGE_SIZE}
                                total={totalRecords}
                                size="small"
                                showTotal={(t) => `Total ${t} devices`}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
}