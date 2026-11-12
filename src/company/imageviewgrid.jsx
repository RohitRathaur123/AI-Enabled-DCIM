import { useState } from "react";
import { Tooltip, Button, Image, Modal } from "antd";
import {
    PictureOutlined,
    DownloadOutlined,
    ZoomInOutlined,
    FileOutlined,
    CalendarOutlined,
    TagOutlined,
    AppstoreOutlined,
    IdcardOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {BASE_URL} from "./constant"
import { fileUrlById } from "../staticData";
import React from "react";

// ─── Constants (replace with your actual import from ./constant) ──────────────
// const getImageUrl = (filePath) => filePath ? `https://your-cdn.com/${filePath}` : null;
const getImgDownloadUrl = (id) => (id ? fileUrlById(id) : null);

const getImageUrl = (filePath) => {
    if (!filePath) return null;
    const normalized = filePath.replace(/\\/g, "/");
    if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;
    const idx = normalized.toLowerCase().indexOf("uploads/");
    const relative = idx !== -1 ? normalized.slice(idx) : normalized.replace(/^\/+/, "");
    return `${BASE_URL}${relative}`;
};

// ─── Color tokens ─────────────────────────────────────────────────────────────
const COLORS = {
    purple: { bg: "#EEEDFE", text: "#3C3489", border: "#AFA9EC" },
    blue:   { bg: "#E6F1FB", text: "#0C447C", border: "#85B7EB" },
    teal:   { bg: "#E1F5EE", text: "#085041", border: "#5DCAA5" },
    amber:  { bg: "#FAEEDA", text: "#633806", border: "#EF9F27" },
    coral:  { bg: "#FAECE7", text: "#712B13", border: "#F0997B" },
    gray:   { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
};

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Pill({ label, color = COLORS.gray, icon }) {
    if (!label) return null;
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: color.bg,
            color: color.text,
            border: `1px solid ${color.border}`,
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 99,
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
        }}>
            {icon && <span style={{ fontSize: 11 }}>{icon}</span>}
            {label}
        </span>
    );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, valueStyle }) {
    if (!value) return null;
    return (
        <div style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 12,
            lineHeight: "18px",
        }}>
            <span style={{
                color: "#9CA3AF",
                minWidth: 92,
                flexShrink: 0,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
            }}>
                {icon && <span style={{ fontSize: 12, opacity: 0.7 }}>{icon}</span>}
                {label}
            </span>
            <span style={{
                color: "#374151",
                wordBreak: "break-word",
                flex: 1,
                ...valueStyle,
            }}>
                {value}
            </span>
        </div>
    );
}

// ─── Expiry badge (red if expired / amber if near / green otherwise) ──────────
function ExpiryBadge({ date }) {
    if (!date) return null;
    const d = dayjs(date);
    const now = dayjs();
    const diff = d.diff(now, "day");
    let color = COLORS.teal;
    if (diff < 0) color = { bg: "#FAECE7", text: "#712B13", border: "#F0997B" };
    else if (diff < 30) color = COLORS.amber;

    return (
        <Pill
            label={`Expires ${d.format("DD MMM YYYY")}`}
            color={color}
            icon={<CalendarOutlined />}
        />
    );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumbnail({ url, fileName, onDownload, imgId }) {
    return (
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
                width: 96, height: 76, borderRadius: 10,
                overflow: "hidden", border: "1px solid #E5E7EB",
                background: "#F9FAFB", display: "flex",
                alignItems: "center", justifyContent: "center",
            }}>
                {url ? (
                    <Image
                        src={url}
                        alt={fileName || "image"}
                        width={96}
                        height={76}
                        style={{ objectFit: "cover", display: "block" }}
                        preview={{
                            // ❌ HATAO: mask: (...)
                            // ✅ YAHAN cover use karo
                            cover: (
                                <div style={{
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", gap: 4,
                                    color: "#fff", fontSize: 11,
                                }}>
                                    <ZoomInOutlined style={{ fontSize: 18 }} />
                                    <span>Preview</span>
                                </div>
                            ),
                        }}
                    />
                ) : (
                    <div style={{ textAlign: "center", color: "#D1D5DB" }}>
                        <PictureOutlined style={{ fontSize: 26 }} />
                        <div style={{ fontSize: 10, marginTop: 4 }}>No image</div>
                    </div>
                )}
            </div>
            {/* Download button neeche */}
            {imgId && (
                <Tooltip title="Download file">
                    <Button icon={<DownloadOutlined />} size="small" type="text"
                        onClick={onDownload}
                        style={{ marginTop: 5, width: 96, color: "#16a34a", fontSize: 11, fontWeight: 500 }}>
                        Download
                    </Button>
                </Tooltip>
            )}
        </div>
    );
}

// ─── Entity ID chips ──────────────────────────────────────────────────────────
function EntityChips({ img }) {
    const ids = [
        img.companyId    && { label: `Company #${img.companyId}`,    color: COLORS.purple },
        img.userId       && { label: `User #${img.userId}`,          color: COLORS.blue   },
        img.addressId    && { label: `Address #${img.addressId}`,    color: COLORS.teal   },
        img.bankDetailId && { label: `Bank #${img.bankDetailId}`,    color: COLORS.amber  },
        img.locationId   && { label: `Location #${img.locationId}`,  color: COLORS.coral  },
        img.deviceId     && { label: `Device #${img.deviceId}`,      color: COLORS.gray   },
    ].filter(Boolean);

    if (!ids.length) return null;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
            {ids.map(({ label, color }) => (
                <Pill key={label} label={label} color={color} />
            ))}
        </div>
    );
}

// ─── Single image card ────────────────────────────────────────────────────────
function ImageCard({ img, index }) {
    const url = img._previewUrl || getImageUrl(img.filePath);
   
    
    // 👇 Temporarily add karo — console mein dekho kya aa raha hai
    console.log("ImageCard data:", { url, filePath: img.filePath, previewUrl: img._previewUrl });

    const handleDownload = () => {
        const dlUrl = getImgDownloadUrl(img.id);
        if (dlUrl) window.open(dlUrl, "_blank");
    };

    return (
        <div
            style={{
                display: "flex",
                gap: 16,
                padding: "14px 16px",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                transition: "box-shadow 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
                e.currentTarget.style.borderColor = "#D1D5DB";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#E5E7EB";
            }}
        >
            {/* LEFT: Thumbnail */}
            <Thumbnail
                url={url}
                fileName={img.fileName}
                onDownload={handleDownload}
                imgId={img.id}
            />

            {/* RIGHT: Metadata */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>

                {/* File name */}
                <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}>
                    {img.fileName || `Image ${index + 1}`}
                </div>

                {/* Top pills: fileType + fileUse + entityType */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {img.fileType   && <Pill label={img.fileType}   color={COLORS.purple} icon={<FileOutlined />} />}
                    {img.fileUse    && <Pill label={img.fileUse}    color={COLORS.blue}   icon={<TagOutlined />}  />}
                    {img.entityType && <Pill label={img.entityType} color={COLORS.teal}   icon={<AppstoreOutlined />} />}
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #F3F4F6", margin: "1px 0" }} />

                {/* ─── 4 MAIN FIELDS ─── */}
                <DetailRow
                    icon={<FileOutlined />}
                    label="File type"
                    value={img.fileType}
                />
                <DetailRow
                    icon={<IdcardOutlined />}
                    label="File name"
                    value={img.fileName}
                />
                <DetailRow
                    icon={<TagOutlined />}
                    label="File use"
                    value={img.fileUse}
                />
                <DetailRow
                    icon={<CalendarOutlined />}
                    label="Expiry date"
                    value={
                        img.fileExpiryDate
                            ? (
                                <span>
                                    {dayjs(img.fileExpiryDate).format("DD MMM YYYY")}
                                    &nbsp;
                                    <ExpiryBadge date={img.fileExpiryDate} />
                                </span>
                            )
                            : null
                    }
                />
                <DetailRow
                    icon={<FileOutlined />}
                    label="File path"
                    value={img.filePath}
                    valueStyle={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace" }}
                />

                {/* Entity ID chips */}
                <EntityChips img={img} />

                {/* Timestamps */}
                {(img.createdAt || img.updatedAt) && (
                    <div style={{
                        display: "flex",
                        gap: 14,
                        fontSize: 11,
                        color: "#9CA3AF",
                        marginTop: 2,
                        alignItems: "center",
                    }}>
                        <ClockCircleOutlined style={{ fontSize: 11 }} />
                        {img.createdAt && (
                            <span>Created: {dayjs(img.createdAt).format("DD MMM YYYY, HH:mm")}</span>
                        )}
                        {img.updatedAt && (
                            <span>Updated: {dayjs(img.updatedAt).format("DD MMM YYYY, HH:mm")}</span>
                        )}
                    </div>
                )}

                {/* Server ID */}
                {img.id && (
                    <div style={{ fontSize: 10, color: "#D1D5DB" }}>ID: {img.id}</div>
                )}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ImageGridView = ({ images = [], title = "Images" }) => {
    // Empty state
    if (!images.length) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 16px",
                background: "#F9FAFB",
                border: "1px dashed #E5E7EB",
                borderRadius: 12,
                color: "#9CA3AF",
                gap: 8,
            }}>
                <PictureOutlined style={{ fontSize: 32, color: "#D1D5DB" }} />
                <span style={{ fontSize: 13, fontStyle: "italic" }}>No images found.</span>
            </div>
        );
    }

    return (
        <div>
            {/* Section header */}
            {title && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                }}>
                    <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                    }}>
                        {title}
                    </span>
                    <span style={{
                        background: "#F3F4F6",
                        color: "#6B7280",
                        border: "1px solid #E5E7EB",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "0px 7px",
                        borderRadius: 99,
                    }}>
                        {images.length}
                    </span>
                </div>
            )}

            {/* Cards list */}
            <Image.PreviewGroup>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {images.map((img, i) => (
                        <ImageCard
                            key={img._uid || img.id || i}
                            img={img}
                            index={i}
                        />
                    ))}
                </div>
            </Image.PreviewGroup>
        </div>
    );
};

export default ImageGridView;


