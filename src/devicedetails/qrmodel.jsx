// QRModal.jsx — fetches base64 image from GET /DeviceDetail/generate-qr/{id}
// API response: { message: "...", qrCodeImage: "data:image/png;base64,..." }
import { useState, useEffect } from "react";
import { Modal, Button, Space, message } from "antd";
import { QrcodeOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import {axiosdevice} from "../../config";
import React from "react";
export default function QRModal({ open, onClose, deviceId }) {
    const [qrImage, setQrImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const fetchQR = () => {
        if (!deviceId) return;
        setQrImage(null);
        setErrorMsg(null);
        setLoading(true);
        axiosdevice
            .get(`/DeviceDetail/generate-qr/${deviceId}`)
            .then(res => {
                // axiosdevice may return res.data or the raw object
                const img = res?.qrCodeImage;
                console.log(img,"jjjjj")

                // API returns: { message: "QR Code Generated Successfully", qrCodeImage: "data:image/png;base64,..." }
                // let img = body?.qrCodeImage || body?.qrCode || body?.image || body?.base64 || null;

                if (img) {
                    // Ensure the data URI prefix is present
                    // if (!img.startsWith("data:")) {
                    //     img = `data:image/png;base64,${img}`;
                    // }
                    setQrImage(img);
                } else {
                    setErrorMsg("QR image not found in response");
                }
            })
            .catch(err => {
                console.error("generate-qr failed:", err);
                const msg = err?.response?.data?.message || err?.message || "Failed to load QR code";
                setErrorMsg(msg);
                message.error(msg);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (open && deviceId) fetchQR();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, deviceId]);

    const handleDownload = () => {
        if (!qrImage) return;
        const a = document.createElement("a");
        a.href = qrImage;
        a.download = `QR_device_${deviceId}.png`;
        a.click();
    };

    return (
        <Modal
            title={
                <Space>
                    <QrcodeOutlined style={{ color: "#7C3AED", fontSize: 18 }} />
                    <span style={{ fontWeight: 700 }}>Device QR Code</span>
                    {deviceId && (
                        <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>
                            #{deviceId}
                        </span>
                    )}
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={340}
            centered
            destroyOnClose
            footer={[
                <Button
                    key="retry"
                    icon={<ReloadOutlined />}
                    onClick={fetchQR}
                    disabled={loading}
                    style={{ marginRight: "auto" }}
                >
                    Retry
                </Button>,
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                <Button
                    key="dl"
                    type="primary"
                    icon={<DownloadOutlined />}
                    disabled={!qrImage || loading}
                    onClick={handleDownload}
                    style={{ background: "#7C3AED", borderColor: "#7C3AED" }}
                >
                    Download
                </Button>,
            ]}
        >
            <div style={{ textAlign: "center", padding: "20px 0", minHeight: 240 }}>
                {loading && (
                    <div style={{ padding: 40 }}>
                        <div style={{
                            width: 200, height: 200, margin: "0 auto",
                            background: "#F3F4F6", borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#9CA3AF", fontSize: 13,
                        }}>
                            Loading QR…
                        </div>
                    </div>
                )}
                {!loading && qrImage && (
                    <>
                        <img
                            src={qrImage}
                            alt="Device QR Code"
                            style={{
                                width: 200, height: 200, borderRadius: 8,
                                boxShadow: "0 2px 16px rgba(124,58,237,0.15)",
                                border: "1px solid #EDE9FE",
                                display: "block", margin: "0 auto",
                            }}
                        />
                        <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
                            Scan to view device details
                        </div>
                    </>
                )}
                {!loading && !qrImage && (
                    <div style={{
                        width: 200, height: 200, margin: "0 auto",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 8, background: "#FEF2F2", borderRadius: 8,
                        border: "1px solid #FECACA",
                    }}>
                        <QrcodeOutlined style={{ fontSize: 32, color: "#EF4444" }} />
                        <span style={{ color: "#EF4444", fontSize: 12, textAlign: "center", padding: "0 12px" }}>
                            {errorMsg || "QR not available"}
                        </span>
                    </div>
                )}
            </div>
        </Modal>
    );
}