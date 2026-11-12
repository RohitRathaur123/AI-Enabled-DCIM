
import React, { useState, useEffect, useCallback } from "react";
import { List, Upload, Button, Input, message, Empty, Typography, Space, Tag, Popconfirm } from "antd";
import { UploadOutlined, DownloadOutlined, PaperClipOutlined, FileTextOutlined } from "@ant-design/icons";
import { axiosTicket } from "../../config";   // ✅ ye line missing thi

const { Text } = Typography;

// Base API path — adjust to your host if the frontend isn't served behind the same origin
const API_BASE = "/api";

const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
};

/**
 * TicketAttachments
 * Meant to be rendered inside the Ticket "View" drawer — pass the ticketId.
 * Maps to:
 *   POST   /api/tickets/{ticketId}/attachments
 *   GET    /api/tickets/{ticketId}/attachments
 *   GET    /api/tickets/{ticketId}/attachments/{id}/download
 */
const TicketAttachments = ({ ticketId, authToken }) => {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [description, setDescription] = useState("");
    const [pendingFile, setPendingFile] = useState(null);

    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    const fetchAttachments = useCallback(async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const data = await axiosTicket.get(`/tickets/${ticketId}/attachments`);
            setAttachments(data);
        } catch (err) {
            message.error(err?.message || "Could not load attachments");
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        fetchAttachments();
    }, [fetchAttachments]);

    const handleUpload = async () => {
        if (!pendingFile) {
            message.warning("Choose a file first");
            return;
        }
        const formData = new FormData();
        formData.append("file", pendingFile);
        if (description) formData.append("description", description);

        setUploading(true);
        try {
            await axiosTicket.post(`/tickets/${ticketId}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            message.success("File attached");
            setPendingFile(null);
            setDescription("");
            fetchAttachments();
        } catch (err) {
            message.error(err?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachment) => {
        try {
            const blob = await axiosTicket.get(
                `/tickets/${ticketId}/attachments/${attachment.id}/download`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = attachment.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            message.error(err?.message || "Could not download file");
        }
    };
    return (
        <div>
            {/* Upload row */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 14,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                <Upload
                    beforeUpload={(file) => {
                        if (file.size / 1024 / 1024 > 50) {
                            message.error("File must be under 50MB");
                            return Upload.LIST_IGNORE;
                        }
                        setPendingFile(file);
                        return false; // prevent auto-upload, we send manually
                    }}
                    onRemove={() => setPendingFile(null)}
                    fileList={pendingFile ? [pendingFile] : []}
                    maxCount={1}
                >
                    <Button size="small" icon={<UploadOutlined />}>
                        Choose file
                    </Button>
                </Upload>
                <Input
                    size="small"
                    placeholder="Optional description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: 220 }}
                />
                <Button
                    type="primary"
                    size="small"
                    loading={uploading}
                    disabled={!pendingFile}
                    onClick={handleUpload}
                >
                    Upload
                </Button>
            </div>

            {/* Attachment list */}
            <List
                loading={loading}
                size="small"
                dataSource={attachments}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No files attached yet"
                        />
                    ),
                }}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Button
                                key="download"
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(item)}
                            >
                                Download
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<PaperClipOutlined style={{ fontSize: 16, color: "#1890ff" }} />}
                            title={<Text style={{ fontSize: 12 }}>{item.fileName}</Text>}
                            description={
                                <Space size={8} wrap>
                                    <Tag style={{ fontSize: 10 }}>{formatSize(item.fileSize)}</Tag>
                                    {item.uploadedBy && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            by {item.uploadedBy}
                                        </Text>
                                    )}
                                    {item.description && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            — {item.description}
                                        </Text>
                                    )}
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
        </div>
    );
};

export default TicketAttachments;