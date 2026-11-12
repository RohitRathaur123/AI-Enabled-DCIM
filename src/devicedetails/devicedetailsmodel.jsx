// devicedetailsmodel.jsx
// Add/Edit modal for DeviceDetail
// rfidTagNumber field added — goes to setup-tracking payload on create
import { Modal, Form, Select, Input, DatePicker, InputNumber, Row, Col, Divider, Typography } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import React from "react";
const { Text } = Typography;

export default function DeviceDetailModal({
    open,
    onClose,
    onSubmit,
    editingRecord,
    submitLoading,
    formData,
    onChange,
    deviceMasters,
}) {
    const set = (field) => (val) =>
        onChange(prev => ({ ...prev, [field]: val }));

    const setEv = (field) => (e) =>
        onChange(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <Modal
            title={editingRecord ? "Edit Device Detail" : "Add Device Detail"}
            open={open}
            onCancel={onClose}
            onOk={onSubmit}
            okText={editingRecord ? "Update" : "Save & Generate QR"}
            confirmLoading={submitLoading}
            width={760}
            destroyOnClose
        >
            <Form layout="vertical" size="small">

                {/* ── Device Master ─────────────────────────────── */}
                <Form.Item
                    label={<span>Device Master <span style={{ color: "#ff4d4f" }}>*</span></span>}
                    style={{ marginBottom: 12 }}
                >
                    <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Select device master"
                        value={formData.deviceMasterId ? String(formData.deviceMasterId) : undefined}
                        onChange={(v) => set("deviceMasterId")(v ? v : null)}
                        options={deviceMasters.map(m => ({
                            value: String(m.id),
                            label: m.deviceShortName || m.shortName || m.deviceName || m.name || String(m.id),
                        }))}
                    />
                </Form.Item>

                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item label="Short Name" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="e.g. Dell-LT001"
                                value={formData.shortName}
                                onChange={setEv("shortName")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Long Name" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="e.g. Dell Latitude 5420 Laptop"
                                value={formData.longName}
                                onChange={setEv("longName")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item label="IMEI" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="15-digit IMEI"
                                value={formData.imei}
                                onChange={setEv("imei")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="MAC Address" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="00:1A:2B:3C:4D:5E"
                                value={formData.macAddress}
                                onChange={setEv("macAddress")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item label="Serial Number" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="Device serial number"
                                value={formData.serialNumber}
                                onChange={setEv("serialNumber")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Tag Number" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="Asset tag number"
                                value={formData.tagNumber}
                                onChange={setEv("tagNumber")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── RFID / QR Tracking ───────────────────────── */}
                <Divider style={{ margin: "8px 0 12px" }}>
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
                        <QrcodeOutlined />
                        Tracking Info
                        {!editingRecord && (
                            <Text type="secondary" style={{ fontSize: 10, fontWeight: 400 }}>
                                (used to generate QR after save)
                            </Text>
                        )}
                    </span>
                </Divider>

                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <span>
                                    RFID Tag Number
                                    {!editingRecord && (
                                        <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>
                                            (required for QR)
                                        </Text>
                                    )}
                                </span>
                            }
                            style={{ marginBottom: 12 }}
                        >
                            <Input
                                placeholder="e.g. RFID-STRG-001"
                                prefix={<QrcodeOutlined style={{ color: "#9CA3AF" }} />}
                                value={formData.rfidTagNumber}
                                onChange={setEv("rfidTagNumber")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="IP Address" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="192.168.1.100"
                                value={formData.ipAddress}
                                onChange={setEv("ipAddress")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── Network ──────────────────────────────────── */}
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item label="SIM Number" style={{ marginBottom: 12 }}>
                            <Input
                                placeholder="SIM / ICCID number"
                                value={formData.simNumber}
                                onChange={setEv("simNumber")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Purchase Cost (₹)" style={{ marginBottom: 12 }}>
                            <InputNumber
                                placeholder="e.g. 65000"
                                style={{ width: "100%" }}
                                min={0}
                                value={formData.purchaseCost}
                                onChange={set("purchaseCost")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── Dates ────────────────────────────────────── */}
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item label="Purchase Date" style={{ marginBottom: 12 }}>
                            <DatePicker
                                style={{ width: "100%" }}
                                value={formData.purchaseDate ? dayjs(formData.purchaseDate) : null}
                                onChange={(_, ds) => set("purchaseDate")(ds || null)}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Warranty Expiry" style={{ marginBottom: 12 }}>
                            <DatePicker
                                style={{ width: "100%" }}
                                value={formData.warrantyExpiry ? dayjs(formData.warrantyExpiry) : null}
                                onChange={(_, ds) => set("warrantyExpiry")(ds || null)}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── Remarks ──────────────────────────────────── */}
                <Form.Item label="Remarks" style={{ marginBottom: 0 }}>
                    <Input.TextArea
                        rows={2}
                        placeholder="Any additional notes…"
                        value={formData.remarks}
                        onChange={setEv("remarks")}
                    />
                </Form.Item>

            </Form>
        </Modal>
    );
}