import { useState } from "react";
import { Modal, Button, Space, Image, Tooltip } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import FileIcon from "./fileicon";
import { T, getDocDownloadUrl } from "./constant";
import { isImageFile } from "./helpers";
import { BASE_URL } from "./constant";
import React from "react";

const DOC_COL_WIDTHS = "26px 1fr 130px 110px 95px 95px 80px";
const DOC_HEADERS    = ["#", "Name", "Type", "Doc No.", "Issue Date", "Valid Till", "Actions"];

// ✅ REPLACE karo existing getDocUrl
const getDocUrl = (filePath) => {
    if (!filePath) return null;
    const normalized = filePath.replace(/\\/g, "/");
    if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;
    const idx = normalized.toLowerCase().indexOf("uploads/");
    if (idx === -1) return null;
    const relative = normalized.slice(idx); // "Uploads/Documents/..."
    
    // BASE_URL se sirf origin nikalo: "https://localhost:7229/api/" → "https://localhost:7229/"
    const origin = BASE_URL.replace(/\/api\/.*/i, "").replace(/\/api$/i, "");
    return `${origin}${relative}`;
};

// ─────────────────────────────────────────────
//  DocumentGridView
// ─────────────────────────────────────────────
const DocumentGridView = ({ documents = [], title = "Documents" }) => {
    const [previewDoc, setPreviewDoc] = useState(null);

    if (!documents.length) return (
        <div style={{ color: "#9CA3AF", fontSize: 12, fontStyle: "italic", padding: "8px 0" }}>
            No documents.
        </div>
    );

    const handleDownload = (id) => {
        const url = getDocDownloadUrl(id);
        if (url) window.open(url, "_blank");
    };

    const handlePreview = (doc) => {
        const docUrl = doc.documentPath ? getDocUrl(doc.documentPath) : null;
        console.log("xKEWJFBFHJKBFHJBFJKKJFABN",docUrl)
        const isImg  = isImageFile(doc.documentPath || doc.fileName || "");
        setPreviewDoc({ ...doc, url: docUrl, isImg });
    };

    return (
        <div>
            {/* Title */}
            {title && (
                <div style={{
                    fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
                }}>
                    {title} ({documents.length})
                </div>
            )}

            {/* Grid Table */}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: T.radius.md, overflow: "hidden" }}>

                {/* Header Row */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: DOC_COL_WIDTHS,
                    gap: 8,
                    padding: "8px 12px",
                    background: "#F9FAFB",
                    borderBottom: "1px solid #E5E7EB",
                }}>
                    {DOC_HEADERS.map(h => (
                        <div key={h} style={{
                            fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                        }}>
                            {h}
                        </div>
                    ))}
                </div>

                {/* Data Rows */}
                {documents.map((doc, idx) => {
                    const hasPath = !!doc.documentPath;

                    return (
                        <div
                            key={doc._uid || doc.id || idx}
                            style={{
                                display: "grid",
                                gridTemplateColumns: DOC_COL_WIDTHS,
                                gap: 8,
                                padding: "9px 12px",
                                alignItems: "center",
                                borderBottom: idx < documents.length - 1 ? "1px solid #F3F4F6" : "none",
                                background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                            }}
                        >
                            {/* # Index */}
                            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{idx + 1}</div>

                            {/* Document Name + Icon */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 6,
                                minWidth: 0, overflow: "hidden",
                            }}>
                                <div style={{ flexShrink: 0 }}>
                                    <FileIcon name={doc.documentPath || doc.fileName || ""} />
                                </div>
                                <span style={{
                                    fontSize: 12, fontWeight: 500, color: "#374151",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    display: "block", minWidth: 0,
                                }}>
                                    {doc.documentName || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Untitled</span>}
                                </span>
                            </div>

                            {/* Document Type Badge */}
                            <div style={{ minWidth: 0 }}>
                                {(doc.documentTypeName || doc.documentTypeId)
                                    ? (
                                        <span style={{
                                            background: T.blue.bg, color: T.blue.text,
                                            fontSize: 10, fontWeight: 600,
                                            padding: "2px 7px",
                                            borderRadius: 99,
                                            border: `1px solid ${T.blue.border}`,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "inline-block",
                                            maxWidth: "100%",
                                        }}>
                                            {doc.documentTypeName || doc.documentTypeId}
                                        </span>
                                    )
                                    : <span style={{ color: "#D1D5DB" }}>—</span>
                                }
                            </div>

                            {/* Document Number */}
                            <div style={{
                                fontSize: 11, fontFamily: "monospace", color: "#374151",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                                {doc.documentNumber || "—"}
                            </div>

                            {/* Issue Date */}
                            <div style={{ fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>
                                {doc.issuedByDate ? dayjs(doc.issuedByDate).format("YYYY-MM-DD") : "—"}
                            </div>

                            {/* Valid Till */}
                            <div style={{ fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>
                                {doc.documentValidTill ? dayjs(doc.documentValidTill).format("YYYY-MM-DD") : "—"}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: 4 }}>
                                {hasPath && (
                                    <Tooltip title="Preview">
                                        <Button
                                            icon={<EyeOutlined />}
                                            size="small" type="text"
                                            style={{ color: T.blue.text }}
                                            onClick={() => handlePreview(doc)}
                                        />
                                    </Tooltip>
                                )}
                                {doc.id && (
                                    <Tooltip title="Download">
                                        <Button
                                            icon={<DownloadOutlined />}
                                            size="small" type="text"
                                            style={{ color: T.green.text }}
                                            onClick={() => handleDownload(doc.id)}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Modal */}
            <Modal
                title={
                    <Space>
                        <FileIcon name={previewDoc?.documentPath || ""} size={18} />
                        <span>{previewDoc?.documentName || "Document Preview"}</span>
                    </Space>
                }
                open={!!previewDoc}
                onCancel={() => setPreviewDoc(null)}
                footer={
                    previewDoc?.id
                        ? [
                            <Button
                                key="dl"
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(previewDoc.id)}
                            >
                                Download
                            </Button>,
                            <Button key="cls" onClick={() => setPreviewDoc(null)}>Close</Button>,
                        ]
                        : [<Button key="cls" onClick={() => setPreviewDoc(null)}>Close</Button>]
                }
                width={800}
                style={{ top: 20 }}
                styles={{
                    body: {
                        padding: "12px 16px",
                        maxHeight: "75vh",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    },
                }}
                destroyOnClose
            >
                {previewDoc && (
                    <>
                        {/* Meta Fields Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            {[
                                { label: "Document Name", value: previewDoc.documentName    || "—" },
                                { label: "Document Type", value: previewDoc.documentTypeName || "—" },
                                { label: "Document No.",  value: previewDoc.documentNumber   || "—" },
                                { label: "Issued By",     value: previewDoc.issuedByName     || "—" },
                                { label: "Issue Date",    value: previewDoc.issuedByDate     ? dayjs(previewDoc.issuedByDate).format("DD MMM YYYY")         : "—" },
                                { label: "Valid Till",    value: previewDoc.documentValidTill ? dayjs(previewDoc.documentValidTill).format("DD MMM YYYY")   : "—" },
                            ].map(f => (
                                <div key={f.label} style={{
                                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                                    borderRadius: T.radius.sm, padding: "8px 10px",
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
                                    <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* File Preview Area */}
<div style={{
    border: "1px solid #E5E7EB", borderRadius: T.radius.md,
    overflow: "hidden", background: "#F9FAFB", minHeight: 300,
    display: "flex", alignItems: "center", justifyContent: "center",
}}>
    {!previewDoc.url ? (
        <div style={{ textAlign: "center", padding: 40 }}>
            <FileIcon name={previewDoc.documentPath || ""} size={48} />
            <div style={{ marginTop: 12, fontSize: 13, color: "#6B7280" }}>
                File not saved on server.
            </div>
        </div>
    ) : previewDoc.isImg ? (
        <Image
            src={previewDoc.url}
            alt={previewDoc.documentName || "preview"}
            style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain" }}
        />
    ) : (previewDoc.url?.toLowerCase().endsWith(".pdf") || previewDoc.documentPath?.toLowerCase().endsWith(".pdf")) ? (
        <iframe
            src={previewDoc.url}
            width="100%"
            height="500px"
            style={{ border: "none" }}
            title="PDF Preview"
        />
    ) : (
        // ✅ Excel / Word / ZIP — preview nahi hota, Open in New Tab + Download dikhao
        <div style={{ textAlign: "center", padding: 40 }}>
            <FileIcon name={previewDoc.documentPath || previewDoc.fileName || ""} size={48} />
            <div style={{ marginTop: 12, fontSize: 13, color: "#6B7280" }}>
                Preview not available for this file type.
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center" }}>
                {previewDoc.url && (
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => window.open(previewDoc.url, "_blank")}
                    >
                        Open in New Tab
                    </Button>
                )}
                {previewDoc.id && (
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(previewDoc.id)}
                    >
                        Download File
                    </Button>
                )}
            </div>
        </div>
    )}
</div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default DocumentGridView;