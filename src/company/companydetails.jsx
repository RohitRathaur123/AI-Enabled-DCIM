import { Modal, Button, Tabs, Row, Col, Spin, Space, Tooltip, message } from "antd";
import {
    EyeOutlined, EditOutlined, BuildOutlined, UserOutlined,
    HomeOutlined, CreditCardOutlined, EnvironmentOutlined,
    AppstoreOutlined, PictureOutlined, FileTextOutlined,
    DownloadOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { HistoryOutlined, CrownOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { T, getImageUrl, getImgDownloadUrl, getDocUrl, getDocDownloadUrl, BASE_URL } from "./constant";
import EmptyState from "./Emptystate";
import { DetailContactCard, DetailBankCard, DetailAddressCard } from "./detialcontactcard";
import FileIcon from "./fileicon";
import { isImageFile } from "./helpers";
import ImageGridView from "./imageviewgrid";
import DocumentGridView from "./documentgridview";
import axiosInstance from '../../config';
import React from "react";
import { usePagination } from "../entity/usePagination";
import { PaginationBar } from "../entity/paginationbar";
// import { useEntityTypes } from "./useentitype";
// import { fetchEntityFiles } from "./filestore";
import { getEntityTypeId, fetchEntityFiles } from "./filestore";

// ─── Image Card ───────────────────────────────────────────────────────────────
// In companydetails.jsx - Update ImageCard component

function ImageCard({ img, index }) {
    // Construct the full URL with base URL
    const getFullUrl = (path) => {
        if (!path) return null;

        // If it's already a full URL, return as is
        if (/^(https?:|data:|blob:)/i.test(path)) {
            return path;
        }

        // Remove leading slashes
        const cleanPath = path.replace(/^\/+/, "");

        // Use the BASE_URL from constants
        const baseUrl = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
        return `${baseUrl}${cleanPath}`;
    };

    // Get the image URL
    const src = img._previewUrl || img.fileUrl || getFullUrl(img.filePath);

    console.log(`🖼️ Image ${index} final URL:`, src); // Should show https://localhost:7229/uploads/...

    const handleDownload = () => {
        const url = getImgDownloadUrl(img.id);
        if (url) window.open(url, "_blank");
    };

    const getExpiryStyle = () => {
        if (!img.fileExpiryDate) return null;
        const diff = dayjs(img.fileExpiryDate).diff(dayjs(), "day");
        if (diff < 0) return { color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5" };
        if (diff < 30) return { color: "#92400E", bg: "#FEF3C7", border: "#FCD34D" };
        return { color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" };
    };
    const expiryStyle = getExpiryStyle();

    const entityColor = (() => {
        switch ((img.entityType || img.entityName || img.entityTypeName || "").toLowerCase()) {
            case "company": return T.blue;
            case "location": return T.teal;
            case "contactperson": return T.green;
            case "address": return T.amber;
            case "bankdetail": return T.purple;
            default: return T.gray;
        }
    })();

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 0,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: T.radius.md,
            overflow: "hidden",
            width: "100%"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#F9FAFB",
                borderRight: "1px solid #F3F4F6",
                padding: "14px 10px"
            }}>
                <div style={{
                    width: 20, height: 20,
                    borderRadius: "50%",
                    background: T.purple.bg,
                    color: T.purple.text,
                    border: `1px solid ${T.purple.border}`,
                    fontSize: 9, fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    alignSelf: "flex-end",
                    marginBottom: -4
                }}>
                    {index + 1}
                </div>
                <div style={{
                    width: 84, height: 68,
                    borderRadius: T.radius.sm,
                    overflow: "hidden",
                    border: "1px solid #E5E7EB",
                    background: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: src ? "pointer" : "default",
                    flexShrink: 0
                }}
                    onClick={() => src && window.open(src, "_blank")}>
                    {src ? (
                        <img
                            src={src}
                            alt={img.fileName || img.originalFileName || "image"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                                console.error(`❌ Image ${index} failed to load:`, src);
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span style="color: #D1D5DB; font-size: 22px;">📷</span>';
                            }}
                        />
                    ) : (
                        <PictureOutlined style={{ color: "#D1D5DB", fontSize: 22 }} />
                    )}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                    {src && (
                        <Tooltip title="Preview">
                            <Button
                                icon={<EyeOutlined />}
                                size="small"
                                type="primary"
                                ghost
                                onClick={() => window.open(src, "_blank")}
                                style={{ padding: "0 6px", height: 24, fontSize: 11 }}
                            />
                        </Tooltip>
                    )}
                    {img.id && (
                        <Tooltip title="Download">
                            <Button
                                icon={<DownloadOutlined />}
                                size="small"
                                style={{ color: T.green.text, borderColor: T.green.border, padding: "0 6px", height: 24 }}
                                onClick={handleDownload}
                            />
                        </Tooltip>
                    )}
                </div>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1
                    }}>
                        {(img.fileName || img.originalFileName || "").replace(/^[a-f0-9-]{36}_/i, "") || `Image ${index + 1}`}
                    </div>
                    {(img.entityType || img.entityName || img.entityTypeName) && (
                        <span style={{
                            background: entityColor.bg,
                            color: entityColor.text,
                            border: `1px solid ${entityColor.border}`,
                            fontSize: 9, fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 99,
                            whiteSpace: "nowrap",
                            flexShrink: 0
                        }}>
                            {img.entityType || img.entityName || img.entityTypeName}
                        </span>
                    )}
                </div>
                <div style={{ borderTop: "1px solid #F3F4F6" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>File Use</div>
                        {img.fileUse ? (
                            <span style={{ background: T.blue.bg, color: T.blue.text, border: `1px solid ${T.blue.border}`, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                                {img.fileUse}
                            </span>
                        ) : (
                            <span style={{ fontSize: 11, color: "#D1D5DB" }}>—</span>
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Expiry</div>
                        {img.fileExpiryDate && expiryStyle ? (
                            <span style={{ background: expiryStyle.bg, color: expiryStyle.color, border: `1px solid ${expiryStyle.border}`, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                                {dayjs(img.fileExpiryDate).format("DD MMM YYYY")}
                            </span>
                        ) : (
                            <span style={{ fontSize: 11, color: "#D1D5DB" }}>No expiry</span>
                        )}
                    </div>
                </div>
                {img.createdAt && (
                    <div style={{ fontSize: 10, color: "#D1D5DB", marginTop: 2 }}>
                        Uploaded: {dayjs(img.createdAt).format("DD MMM YYYY, HH:mm")}
                    </div>
                )}
            </div>
        </div>
    );
}

function ImageGallery({ images = [], loading = false }) {
    if (loading) return <div style={{ textAlign: "center", padding: 40 }}><Spin tip="Loading images..." /></div>;

    // DEBUG: Log images array
    console.log("🖼️ ImageGallery rendering with images:", images);
    console.log("🖼️ Number of images:", images.length);

    if (!images.length) return <div style={{ color: "#9CA3AF", fontSize: 13, padding: "24px 0", textAlign: "center" }}>No images found.</div>;

    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            width: "100%"
        }}>
            {images.map((img, i) => {
                console.log(`🖼️ Rendering image ${i}:`, img);
                return <ImageCard key={img.id || i} img={img} index={i} />;
            })}
        </div>
    );
}



function DocumentList({ documents = [], loading = false }) {
    const [previewDoc, setPreviewDoc] = useState(null);
    if (loading) return <div style={{ textAlign: "center", padding: 40 }}><Spin tip="Loading documents..." /></div>;
    if (!documents.length) return <div style={{ color: "#9CA3AF", fontSize: 13, padding: "24px 0", textAlign: "center" }}>No documents found.</div>;
    const handleDownload = (id) => { const url = getDocDownloadUrl(id); if (url) window.open(url, "_blank"); };
    const handlePreview = (doc) => {
        const path = doc.documentPath || doc.fileUrl || null;
        const url = path ? (/^(https?:|data:|blob:)/i.test(path) ? path : `${BASE_URL}${path.replace(/^\/+/, "")}`) : null;
        const isImg = isImageFile(doc.documentPath || doc.fileName || "");
        setPreviewDoc({ ...doc, url, isImg });
    };
    const COL_WIDTHS = "24px 1fr 90px 100px 90px 76px";
    const HEADERS = ["#", "Name", "Type", "Doc No.", "Valid Till", "Actions"];
    return (
        <>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: T.radius.md, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: COL_WIDTHS, gap: 8, padding: "8px 12px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {HEADERS.map((h) => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>)}
                </div>
                {documents.map((doc, idx) => (
                    <div key={doc.id || idx} style={{ display: "grid", gridTemplateColumns: COL_WIDTHS, gap: 8, padding: "10px 12px", alignItems: "center", borderBottom: idx < documents.length - 1 ? "1px solid #F3F4F6" : "none", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{idx + 1}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <FileIcon name={doc.documentPath || doc.fileName || ""} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {doc.documentName || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Untitled</span>}
                            </span>
                        </div>
                        <div>{doc.documentTypeName ? <span style={{ background: T.blue.bg, color: T.blue.text, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, border: `1px solid ${T.blue.border}` }}>{doc.documentTypeName}</span> : <span style={{ color: "#D1D5DB" }}>—</span>}</div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#374151" }}>{doc.documentNumber || "—"}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{doc.documentValidTill ? dayjs(doc.documentValidTill).format("DD MMM YY") : "—"}</div>
                        <div style={{ display: "flex", gap: 4 }}>
                            {(doc.documentPath || doc.fileUrl) && <Tooltip title="Preview"><Button icon={<EyeOutlined />} size="small" type="text" style={{ color: T.blue.text }} onClick={() => handlePreview(doc)} /></Tooltip>}
                            {doc.id && <Tooltip title="Download"><Button icon={<DownloadOutlined />} size="small" type="text" style={{ color: T.green.text }} onClick={() => handleDownload(doc.id)} /></Tooltip>}
                        </div>
                    </div>
                ))}
            </div>
            <Modal title={<Space><FileIcon name={previewDoc?.documentPath || ""} size={18} /><span>{previewDoc?.documentName || "Preview"}</span></Space>}
                open={!!previewDoc} onCancel={() => setPreviewDoc(null)}
                footer={[previewDoc?.id && <Button key="dl" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(previewDoc.id)}>Download</Button>, <Button key="cls" onClick={() => setPreviewDoc(null)}>Close</Button>].filter(Boolean)}
                width={880} style={{ top: 20 }} styles={{ body: { padding: "12px 16px", maxHeight: "80vh", overflowY: "auto" } }} destroyOnClose>
                {previewDoc && (
                    <div style={{ border: "1px solid #E5E7EB", borderRadius: T.radius.md, overflow: "hidden", background: "#F9FAFB", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {previewDoc.isImg
                            ? <img src={previewDoc.url} alt={previewDoc.documentName || "preview"} style={{ maxWidth: "100%", maxHeight: 450, objectFit: "contain", borderRadius: T.radius.md }} />
                            : /\.pdf$/i.test(previewDoc.url || "")
                                ? <iframe src={previewDoc.url} width="100%" height="520px" style={{ border: "none" }} title="PDF Preview" />
                                : <div style={{ textAlign: "center", padding: 40 }}>
                                    <FileIcon name={previewDoc.documentPath || ""} size={48} />
                                    <div style={{ marginTop: 12, fontSize: 13, color: "#6B7280" }}>Preview not available.</div>
                                    <Button icon={<EyeOutlined />} style={{ marginTop: 12 }} onClick={() => window.open(previewDoc.url, "_blank")}>Open in Tab</Button>
                                </div>}
                    </div>
                )}
            </Modal>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyDetailModal({
    open, onCancel, selectedCompany, detailLoading,
    detailTab, setDetailTab,
    companyLocations, companyBanks, detailDomains, onEdit,
}) {
    const [allImages, setAllImages] = useState([]);
    const [allDocs, setAllDocs] = useState([]);
    const [allHistory, setAllHistory] = useState([]);
    const [imgLoading, setImgLoading] = useState(false);
    const [docLoading, setDocLoading] = useState(false);
    const [histLoading, setHistLoading] = useState(false);
    const [histDetail, setHistDetail] = useState(null);
    const [makingMaster, setMakingMaster] = useState(null);
    const [locationMedia, setLocationMedia] = useState({});

    // ── histPag PEHLE declare karo ──────────────────────────────────────────
    const histPag = usePagination(20);



    useEffect(() => {
        if (!open || !selectedCompany?.id) {
            setAllImages([]);
            setAllDocs([]);
            setAllHistory([]);
            setLocationMedia({});
            histPag.reset();
            return;
        }
        // entityTypesLoading check NAHI chahiye ab
        fetchImages(selectedCompany.id);
        fetchDocs(selectedCompany.id);
        fetchHistory(selectedCompany.id, 1);
    }, [open, selectedCompany?.id]); // entityTypesLoading HATAO

    // In CompanyDetailModal component - fixed fetchImages and fetchDocs
    // In CompanyDetailModal component
    const fetchImages = async (id) => {
        setImgLoading(true);
        try {
            // Try multiple variations for Company
            let entityTypeId = await getEntityTypeId("Company");

            // If not found, try variations
            if (!entityTypeId) {
                console.log("Trying alternative names for Company...");
                entityTypeId = await getEntityTypeId("Companies") ||
                    await getEntityTypeId("company") ||
                    await getEntityTypeId("CompanyDetail") ||
                    await getEntityTypeId("CompanyEntity");
            }

            console.log(`📸 Fetching images for Company ${id}, EntityTypeId:`, entityTypeId);

            if (!entityTypeId) {
                console.error("⚠️ Company entityTypeId not found after trying all variations");
                message.error("Could not find Company entity type. Please check the API configuration.");
                setAllImages([]);
                return;
            }

            const files = await fetchEntityFiles(entityTypeId, id, "Image");
            console.log(`📸 Found ${files?.length || 0} images for Company ${id}`, files);
            setAllImages(Array.isArray(files) ? files : []);
        } catch (e) {
            console.error("Images fetch error:", e);
            message.error("Failed to fetch images");
            setAllImages([]);
        } finally {
            setImgLoading(false);
        }
    };

    const fetchDocs = async (id) => {
        setDocLoading(true);
        try {
            // Try multiple variations for Company
            let entityTypeId = await getEntityTypeId("Company");

            // If not found, try variations
            if (!entityTypeId) {
                console.log("Trying alternative names for Company...");
                entityTypeId = await getEntityTypeId("Companies") ||
                    await getEntityTypeId("company") ||
                    await getEntityTypeId("CompanyDetail") ||
                    await getEntityTypeId("CompanyEntity");
            }

            console.log(`📄 Fetching docs for Company ${id}, EntityTypeId:`, entityTypeId);

            if (!entityTypeId) {
                console.error("⚠️ Company entityTypeId not found after trying all variations");
                message.error("Could not find Company entity type. Please check the API configuration.");
                setAllDocs([]);
                return;
            }

            const files = await fetchEntityFiles(entityTypeId, id, "Document");
            console.log(`📄 Found ${files?.length || 0} documents for Company ${id}`, files);
            setAllDocs(Array.isArray(files) ? files : []);
        } catch (e) {
            console.error("Docs fetch error:", e);
            message.error("Failed to fetch documents");
            setAllDocs([]);
        } finally {
            setDocLoading(false);
        }
    };



    // ── fetchLocationMedia ──────────────────────────────────────────────────
    const fetchLocationMedia = async (locationId) => {
        setLocationMedia(prev => ({
            ...prev,
            [locationId]: {
                loading: true
            }
        }));

        try {
            const entityTypeId = await getEntityTypeId("loc");

            const images = await fetchEntityFiles(
                entityTypeId,
                locationId,
                "Image"
            );

            const docs = await fetchEntityFiles(
                entityTypeId,
                locationId,
                "Document"
            );

            setLocationMedia(prev => ({
                ...prev,
                [locationId]: {
                    loading: false,
                    images: images || [],
                    docs: docs || []
                }
            }));
        } catch (err) {
            console.error(err);

            setLocationMedia(prev => ({
                ...prev,
                [locationId]: {
                    loading: false,
                    images: [],
                    docs: []
                }
            }));
        }
    };

    // ── parseAuditResponse ──────────────────────────────────────────────────
    const parseAuditResponse = (raw) => {
        const envelope = raw?.data !== undefined ? raw.data : raw;
        if (Array.isArray(envelope)) return { rows: envelope, total: envelope.length };
        if (Array.isArray(envelope?.data)) return { rows: envelope.data, total: envelope.totalRecords ?? envelope.data.length };
        if (Array.isArray(envelope?.items)) return { rows: envelope.items, total: envelope.totalCount ?? envelope.items.length };
        return { rows: [], total: 0 };
    };

    // ── fetchHistory ────────────────────────────────────────────────────────
    const fetchHistory = async (id, pg = histPag.page) => {
        setHistLoading(true);
        try {
            const raw = await axiosInstance.get(`/Audit/history/companies/${id}?Page=${pg}&PageSize=${histPag.pageSize}`);
            const { rows, total } = parseAuditResponse(raw);
            setAllHistory(rows);
            histPag.setTotal(total);
            histPag.setPage(pg);
        } catch (e) {
            console.error("History fetch error:", e);
            setAllHistory([]);
        } finally {
            setHistLoading(false);
        }
    };

    // ── handleMakeMaster ────────────────────────────────────────────────────
    const handleMakeMaster = async (record) => {
        setMakingMaster(record.id);
        try {
            const raw = await axiosInstance.post(`/Audit/mark-as-final/${record.id}`);
            const data = raw?.data !== undefined ? raw.data : raw;
            message.success(data?.message || "Marked as master successfully.");
            setHistDetail(null);
            setAllHistory((prev) => prev.map((r) => r.id === record.id ? { ...r, isFinal: true } : r));
            fetchHistory(selectedCompany.id, histPag.page);
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to mark as master.");
        } finally {
            setMakingMaster(null);
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <EyeOutlined style={{ color: T.blue.text }} />
                    <span style={{ fontWeight: 600 }}>{selectedCompany?.companyName}</span>
                    {selectedCompany?.companyType && (
                        <span style={{ background: T.blue.bg, color: T.blue.text, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, border: `1px solid ${T.blue.border}` }}>
                            {selectedCompany.companyType}
                        </span>
                    )}
                </div>
            }
            open={open} onCancel={onCancel}
            footer={[
                <Button key="edit" icon={<EditOutlined />} onClick={onEdit}>Edit Company</Button>,
                <Button key="close" onClick={onCancel}>Close</Button>,
            ]}
            width={1020} style={{ top: 20 }}
            styles={{ body: { padding: "12px 20px", maxHeight: "82vh", overflowY: "auto", overflowX: "hidden" } }}
            destroyOnClose
        >
            {selectedCompany && (
                <Tabs activeKey={detailTab} onChange={setDetailTab} size="small" items={[

                    // ── 1. OVERVIEW ──────────────────────────────────────────
                    {
                        key: "overview",
                        label: <Space><BuildOutlined />Overview</Space>,
                        children: detailLoading ? <div style={{ textAlign: "center", padding: 40 }}><Spin /></div> : (
                            <>
                                <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
                                    <Col xs={24} sm={12}>
                                        <div style={{ background: T.blue.bg, border: `1px solid ${T.blue.border}`, borderRadius: T.radius.md, padding: "12px 14px" }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.blue.text, textTransform: "uppercase", marginBottom: 6 }}>Company</div>
                                            <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{selectedCompany.companyName}</div>
                                            <span style={{ background: "#fff", color: T.blue.text, fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 99, border: `1px solid ${T.blue.border}`, marginTop: 4, display: "inline-block" }}>{selectedCompany.companyType}</span>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <div style={{ background: T.purple.bg, border: `1px solid ${T.purple.border}`, borderRadius: T.radius.md, padding: "12px 14px" }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.purple.text, textTransform: "uppercase", marginBottom: 6 }}>Business Domains</div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                                {detailDomains.length > 0
                                                    ? detailDomains.map((d, i) => <span key={i} style={{ background: "#fff", color: T.purple.text, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, border: `1px solid ${T.purple.border}` }}>{d.domainName}</span>)
                                                    : <span style={{ fontSize: 12, color: "#9CA3AF" }}>No domains assigned</span>}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                {selectedCompany.companyDescription && (
                                    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: T.radius.md, padding: "12px 14px", marginBottom: 14 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Description</div>
                                        <div style={{ fontSize: 13, color: "#374151" }}>{selectedCompany.companyDescription}</div>
                                    </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
                                    {[
                                        { label: "Contacts", val: selectedCompany.contactPersons?.length || 0, color: T.green.text, bg: T.green.bg, border: T.green.border },
                                        { label: "Addresses", val: (selectedCompany.companyAddresses || []).length, color: T.amber.text, bg: T.amber.bg, border: T.amber.border },
                                        { label: "Locations", val: companyLocations.length, color: T.teal.text, bg: T.teal.bg, border: T.teal.border },
                                        { label: "Banks", val: companyBanks.length, color: T.purple.text, bg: T.purple.bg, border: T.purple.border },
                                        { label: "Images", val: imgLoading ? "…" : allImages.length, color: T.pink.text, bg: T.pink.bg, border: T.pink.border },
                                        { label: "Documents", val: docLoading ? "…" : allDocs.length, color: T.blue.text, bg: T.blue.bg, border: T.blue.border },
                                    ].map((s) => (
                                        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: T.radius.md, padding: "12px", textAlign: "center" }}>
                                            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                            <div style={{ fontSize: 10, color: s.color, opacity: 0.75, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ),
                    },

                    // ── 2. IMAGES ────────────────────────────────────────────
                    {
                        key: "images",
                        label: <Space><PictureOutlined style={{ color: T.pink.text }} />Images{allImages.length > 0 && <span style={{ background: T.pink.bg, color: T.pink.text, border: `1px solid ${T.pink.border}`, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "0 6px" }}>{allImages.length}</span>}</Space>,
                        children: (
                            <div style={{ padding: "8px 0" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #F3F4F6" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: T.radius.md, background: T.pink.bg, border: `1px solid ${T.pink.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><PictureOutlined style={{ color: T.pink.text, fontSize: 15 }} /></div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>All Company Images</div>
                                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{imgLoading ? "Loading…" : `${allImages.length} image${allImages.length !== 1 ? "s" : ""}`}</div>
                                        </div>
                                    </div>
                                    <Button size="small" icon={<ReloadOutlined />} loading={imgLoading} onClick={() => fetchImages(selectedCompany.id)}>Refresh</Button>
                                </div>
                                <ImageGallery images={allImages} loading={imgLoading} />
                            </div>
                        ),
                    },

                    // ── 3. DOCUMENTS ─────────────────────────────────────────
                    {
                        key: "documents",
                        label: <Space><FileTextOutlined style={{ color: T.amber.text }} />Documents{allDocs.length > 0 && <span style={{ background: T.amber.bg, color: T.amber.text, border: `1px solid ${T.amber.border}`, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "0 6px" }}>{allDocs.length}</span>}</Space>,
                        children: (
                            <div style={{ padding: "8px 0" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #F3F4F6" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: T.radius.md, background: T.amber.bg, border: `1px solid ${T.amber.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileTextOutlined style={{ color: T.amber.text, fontSize: 15 }} /></div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>All Company Documents</div>
                                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{docLoading ? "Loading…" : `${allDocs.length} document${allDocs.length !== 1 ? "s" : ""}`}</div>
                                        </div>
                                    </div>
                                    <Button size="small" icon={<ReloadOutlined />} loading={docLoading} onClick={() => fetchDocs(selectedCompany.id)}>Refresh</Button>
                                </div>
                                <DocumentList documents={allDocs} loading={docLoading} />
                            </div>
                        ),
                    },

                    // ── 4. CONTACTS ──────────────────────────────────────────
                    {
                        key: "contacts",
                        label: <Space><UserOutlined />Contacts ({selectedCompany.contactPersons?.length || 0})</Space>,
                        children: (
                            <div>
                                {(selectedCompany.contactPersons || []).length === 0
                                    ? <EmptyState icon={<UserOutlined />} color={T.green.text} bg={T.green.bg} border={T.green.border} message="No contact persons." />
                                    : (selectedCompany.contactPersons || []).map((cp, i) => <DetailContactCard key={cp.id || i} cp={cp} index={i} />)}
                            </div>
                        ),
                    },

                    // ── 5. ADDRESSES ─────────────────────────────────────────
                    {
                        key: "addresses",
                        label: <Space><HomeOutlined />Addresses ({(selectedCompany.companyAddresses || []).length})</Space>,
                        children: (
                            <div>
                                {(selectedCompany.companyAddresses || []).length === 0
                                    ? <EmptyState icon={<HomeOutlined />} color={T.amber.text} bg={T.amber.bg} border={T.amber.border} message="No addresses on record." />
                                    : (selectedCompany.companyAddresses || []).map((addr, i) => <DetailAddressCard key={addr.id || i} addr={addr} index={i} />)}
                            </div>
                        ),
                    },

                    // ── 6. BANKS ─────────────────────────────────────────────
                    {
                        key: "banks",
                        label: <Space><CreditCardOutlined />Banks ({companyBanks.length})</Space>,
                        children: (
                            <div>
                                {companyBanks.length === 0
                                    ? <EmptyState icon={<CreditCardOutlined />} color={T.purple.text} bg={T.purple.bg} border={T.purple.border} message="No bank accounts on record." />
                                    : companyBanks.map((bank, i) => <DetailBankCard key={bank.id || i} bank={bank} index={i} />)}
                            </div>
                        ),
                    },

                    // ── 7. LOCATIONS ─────────────────────────────────────────
                    {
                        key: "locations",
                        label: <Space><EnvironmentOutlined />Locations ({companyLocations.length})</Space>,
                        children: (
                            <div>
                                {companyLocations.length === 0 ? (
                                    <EmptyState icon={<EnvironmentOutlined />} color={T.teal.text} bg={T.teal.bg} border={T.teal.border} message="No locations found." />
                                ) : companyLocations.map((loc, idx) => {
                                    const media = locationMedia[loc.id] || {};
                                    const isOpen = !!media.images;
                                    return (
                                        <div key={loc.id || idx} style={{ marginBottom: 12, border: "1px solid #E5E7EB", borderRadius: T.radius.md, overflow: "hidden" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px 140px 110px auto", gap: 8, padding: "10px 14px", alignItems: "center", background: "#F9FAFB", borderBottom: isOpen ? "1px solid #E5E7EB" : "none" }}>
                                                <div><span style={{ background: T.teal.bg, color: T.teal.text, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.teal.border}` }}>{loc.locationType || "—"}</span></div>
                                                <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[loc.addressLine1, loc.addressLine2].filter(Boolean).join(", ") || "—"}</div>
                                                <div style={{ fontSize: 12, color: "#6B7280" }}>📍 {loc.pinCode || "—"}</div>
                                                <div style={{ fontSize: 12, color: "#6B7280" }}>📞 {loc.locationContactNumber || "—"}</div>
                                                <div style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.landmark || "—"}</div>
                                                <Button size="small"
                                                    icon={media.loading ? <ReloadOutlined spin /> : <PictureOutlined />}
                                                    onClick={() => loc.id && fetchLocationMedia(loc.id)}
                                                    style={{ fontSize: 11, color: isOpen ? T.teal.text : "#6B7280", borderColor: isOpen ? T.teal.border : "#E5E7EB", background: isOpen ? T.teal.bg : "#fff" }}>
                                                    {media.loading ? "Loading…" : isOpen ? `${media.images?.length || 0} imgs · ${media.docs?.length || 0} docs` : "View Media"}
                                                </Button>
                                            </div>
                                            {isOpen && !media.loading && (
                                                <div style={{ padding: "14px 16px", background: "#fff" }}>
                                                    <div style={{ marginBottom: 16 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><PictureOutlined style={{ color: T.pink.text }} />Images ({media.images?.length || 0})</div>
                                                        <ImageGridView images={media.images || []} title="" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><FileTextOutlined style={{ color: T.amber.text }} />Documents ({media.docs?.length || 0})</div>
                                                        <DocumentGridView documents={media.docs || []} title="" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ),
                    },

                    // ── 8. DOMAINS ───────────────────────────────────────────
                    {
                        key: "domains",
                        label: <Space><AppstoreOutlined />Domains ({detailDomains.length})</Space>,
                        children: (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0" }}>
                                {detailDomains.length > 0
                                    ? detailDomains.map((d, i) => <span key={i} style={{ background: T.purple.bg, color: T.purple.text, fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 99, border: `1px solid ${T.purple.border}`, display: "flex", alignItems: "center", gap: 6 }}><AppstoreOutlined style={{ fontSize: 13 }} />{d.domainName}</span>)
                                    : <span style={{ color: "#9CA3AF", fontSize: 13 }}>No domains assigned.</span>}
                            </div>
                        ),
                    },

                    // ── 9. HISTORY ───────────────────────────────────────────
                    {
                        key: "history",
                        label: (
                            <Space>
                                <HistoryOutlined style={{ color: T.teal.text }} />History
                                {histPag.total > 0 && <span style={{ background: T.teal.bg, color: T.teal.text, border: `1px solid ${T.teal.border}`, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "0 6px" }}>{histPag.total}</span>}
                            </Space>
                        ),
                        children: (
                            <div style={{ padding: "8px 0" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #F3F4F6" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: T.radius.md, background: T.teal.bg, border: `1px solid ${T.teal.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><HistoryOutlined style={{ color: T.teal.text, fontSize: 15 }} /></div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Update History</div>
                                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{histLoading ? "Loading…" : `${histPag.total} change${histPag.total !== 1 ? "s" : ""} recorded`}</div>
                                        </div>
                                    </div>
                                    <Button size="small" icon={<ReloadOutlined />} loading={histLoading} onClick={() => fetchHistory(selectedCompany.id, 1)}>Refresh</Button>
                                </div>
                                {histLoading ? (
                                    <div style={{ textAlign: "center", padding: 40 }}><Spin tip="Loading history..." /></div>
                                ) : allHistory.length === 0 ? (
                                    <div style={{ color: "#9CA3AF", fontSize: 13, padding: "24px 0", textAlign: "center" }}>No history found.</div>
                                ) : (
                                    <>
                                        <div style={{ display: "grid", gridTemplateColumns: "60px 100px 130px 1fr 1fr 110px 90px", gap: 8, padding: "8px 12px", background: "#F9FAFB", borderRadius: `${T.radius.md}px ${T.radius.md}px 0 0`, border: "1px solid #E5E7EB", borderBottom: "2px solid #E5E7EB" }}>
                                            {["ID", "Action", "Column", "Old Value", "New Value", "Changed At", "Actions"].map((h) => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>{h}</div>)}
                                        </div>
                                        <div style={{ border: "1px solid #E5E7EB", borderTop: "none", borderRadius: `0 0 ${T.radius.md}px ${T.radius.md}px`, overflow: "hidden" }}>
                                            {allHistory.map((rec, idx) => {
                                                const ac = rec.actionType === "INSERT" ? T.green : rec.actionType === "DELETE" ? T.pink : T.blue;
                                                return (
                                                    <div key={rec.id} style={{ display: "grid", gridTemplateColumns: "60px 100px 130px 1fr 1fr 110px 90px", gap: 8, padding: "10px 12px", alignItems: "center", borderBottom: idx < allHistory.length - 1 ? "1px solid #F3F4F6" : "none", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                                                        <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>#{rec.id}</div>
                                                        <div><span style={{ background: ac.bg, color: ac.text, border: `1px solid ${ac.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{rec.actionType || "—"}</span></div>
                                                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.columnName || "—"}</div>
                                                        <div style={{ fontSize: 11, color: rec.oldValue ? "#991B1B" : "#D1D5DB", fontStyle: rec.oldValue ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.oldValue || "empty"}</div>
                                                        <div style={{ fontSize: 11, color: rec.newValue ? "#065F46" : "#D1D5DB", fontStyle: rec.newValue ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.newValue || "empty"}</div>
                                                        <div style={{ fontSize: 10, color: "#6B7280" }}>{rec.changedAt ? dayjs(rec.changedAt).format("DD MMM YY, HH:mm") : "—"}</div>
                                                        <div style={{ display: "flex", gap: 4 }}>
                                                            <Tooltip title="View Details"><Button icon={<EyeOutlined />} size="small" type="text" style={{ color: T.blue.text }} onClick={() => setHistDetail(rec)} /></Tooltip>
                                                            <Tooltip title="Mark as Master"><Button icon={<CrownOutlined />} size="small" type="text" style={{ color: T.amber.text }} loading={makingMaster === rec.id} onClick={() => handleMakeMaster(rec)} /></Tooltip>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <PaginationBar page={histPag.page} pageSize={histPag.pageSize} total={histPag.total} onChange={(pg) => fetchHistory(selectedCompany.id, pg)} />
                                    </>
                                )}
                                <Modal title={<Space><HistoryOutlined style={{ color: T.teal.text }} /><span>History Record #{histDetail?.id}</span></Space>}
                                    open={!!histDetail} onCancel={() => setHistDetail(null)}
                                    footer={[
                                        <Button key="master" type="primary" icon={<CrownOutlined />} loading={makingMaster === histDetail?.id} onClick={() => handleMakeMaster(histDetail)} style={{ background: T.amber.text }}>Mark as Master</Button>,
                                        <Button key="close" onClick={() => setHistDetail(null)}>Close</Button>,
                                    ]}
                                    width={560} destroyOnClose>
                                    {histDetail && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                {[{ label: "Column", value: histDetail.columnName }, { label: "Changed By", value: histDetail.changedBy }, { label: "Changed At", value: histDetail.changedAt ? dayjs(histDetail.changedAt).format("DD MMM YYYY, HH:mm:ss") : "—" }, { label: "Table", value: histDetail.tableName }].map((f) => (
                                                    <div key={f.label} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: T.radius.sm, padding: "8px 12px" }}>
                                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                                                        <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.value || "—"}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: T.radius.sm, padding: "10px 12px" }}>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#991B1B", textTransform: "uppercase", marginBottom: 6 }}>Old Value</div>
                                                    <div style={{ fontSize: 13, color: "#7F1D1D", wordBreak: "break-word" }}>{histDetail.oldValue || "empty"}</div>
                                                </div>
                                                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: T.radius.sm, padding: "10px 12px" }}>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#065F46", textTransform: "uppercase", marginBottom: 6 }}>New Value</div>
                                                    <div style={{ fontSize: 13, color: "#14532D", wordBreak: "break-word" }}>{histDetail.newValue || "empty"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Modal>
                            </div>
                        ),
                    },
                ]} />
            )}
        </Modal>
    );
}