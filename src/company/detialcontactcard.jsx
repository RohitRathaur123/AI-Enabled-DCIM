
import { useState } from "react";
import React from "react";
import { Row, Col, Button, Badge, Divider, Spin } from "antd";
import { UserOutlined, HomeOutlined, CreditCardOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import { T } from "./constant";
import ImageGridView from "./imageviewgrid";
import DocumentGridView from "./documentgridview";
// ✅ filestore.js ka async getEntityTypeId directly use karo — useEntityTypes bypass
import { getEntityTypeId, fetchEntityFiles } from "./filestore";

// ─── Shared hook: fetch images+docs for any entity ────────────────────────────
// entityTypeName: exact string jo /api/EntityType/get-all-entity mein aata hai
function useEntityMedia(entityTypeName, entityId) {
    const [images, setImages] = useState(null); // null = not yet fetched
    const [docs, setDocs] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetched = images !== null;

    const fetch = async () => {
        if (loading || fetched) return; // already fetched or in flight
        if (!entityId) {
            console.warn(`useEntityMedia: no entityId for ${entityTypeName}`);
            setImages([]);
            setDocs([]);
            return;
        }

        setLoading(true);
        try {
            // ✅ async getEntityTypeId from filestore — guaranteed fresh, shared cache
            const entityTypeId = await getEntityTypeId(entityTypeName);
            console.log(`[useEntityMedia] ${entityTypeName} → entityTypeId:`, entityTypeId, "entityId:", entityId);

            if (!entityTypeId) {
                console.warn(`[useEntityMedia] entityTypeId not found for "${entityTypeName}"`);
                setImages([]);
                setDocs([]);
                return;
            }

            const [imgs, documents] = await Promise.all([
                fetchEntityFiles(entityTypeId, entityId, "Image"),
                fetchEntityFiles(entityTypeId, entityId, "Document"),
            ]);

            console.log(`[useEntityMedia] ${entityTypeName}#${entityId} → images:`, imgs?.length, "docs:", documents?.length);

            setImages(Array.isArray(imgs) ? imgs : []);
            setDocs(Array.isArray(documents) ? documents : []);
        } catch (e) {
            console.error(`[useEntityMedia] ${entityTypeName} fetch error:`, e);
            setImages([]);
            setDocs([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        images: images ?? [],
        docs: docs ?? [],
        loading,
        fetched,
        fetch,
    };
}

// ─────────────────────────────────────────────
//  DetailContactCard
// ─────────────────────────────────────────────
export const DetailContactCard = ({ cp, index }) => {
    const [open, setOpen] = useState(false);

    // ⚠️ entityTypeName apne API ke exact value se match karo
    // Console mein dekho: "🔍 EntityType names:" log — wahan jo name aaye woh use karo
    const media = useEntityMedia("UserProfile", cp?.id);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next && !media.fetched) media.fetch();
    };

    const badgeCount = media.fetched
        ? media.images.length + media.docs.length
        : (cp.images?.length || 0) + (cp.documents?.length || 0);

    return (
        <div style={{ border: `1px solid ${open ? T.green.border : "#E5E7EB"}`, borderRadius: T.radius.lg, overflow: "hidden", background: "#fff", marginBottom: 10 }}>
            <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: open ? T.green.bg : "#FAFAFA", cursor: "pointer" }}
                onClick={handleToggle}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.green.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UserOutlined style={{ color: "#fff", fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{cp.userName || `Contact ${index + 1}`}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{[cp.userPrimaryEmail, cp.userPrimaryPhoneNumber].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {index === 0 && (
                        <span style={{ background: T.green.bg, color: T.green.text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.green.border}` }}>
                            Primary
                        </span>
                    )}
                    <Badge count={badgeCount} size="small" style={{ backgroundColor: T.teal.text }} />
                    <Button size="small" type="text" icon={open ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />} style={{ color: T.green.text }} />
                </div>
            </div>

            {open && (
                <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.green.border}` }}>
                    <Row gutter={[12, 8]} style={{ marginBottom: 14 }}>
                        <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Primary Email: </span><span style={{ fontSize: 12 }}>{cp.userPrimaryEmail || "—"}</span></Col>
                        <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Secondary Email: </span><span style={{ fontSize: 12 }}>{cp.userSecondaryEmail || "—"}</span></Col>
                        <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Primary Phone: </span><span style={{ fontSize: 12 }}>{cp.userPrimaryPhoneNumber || "—"}</span></Col>
                        <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Secondary Phone: </span><span style={{ fontSize: 12 }}>{cp.userSecondaryPhoneNumber || "—"}</span></Col>
                    </Row>

                    {media.loading ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}><Spin tip="Loading media..." /></div>
                    ) : (
                        <>
                            <Divider style={{ margin: "8px 0 12px", borderColor: T.green.border }}>
                                <span style={{ fontSize: 11, color: T.green.text, fontWeight: 500 }}>Images ({media.images.length})</span>
                            </Divider>
                            <ImageGridView images={media.images} title="" />

                            <Divider style={{ margin: "12px 0", borderColor: T.green.border }}>
                                <span style={{ fontSize: 11, color: T.green.text, fontWeight: 500 }}>Documents ({media.docs.length})</span>
                            </Divider>
                            <DocumentGridView documents={media.docs} title="" />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
//  DetailAddressCard
// ─────────────────────────────────────────────
export const DetailAddressCard = ({ addr, index }) => {
    const [open, setOpen] = useState(false);
    const media = useEntityMedia("Address", addr?.id);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next && !media.fetched) media.fetch();
    };

    const badgeCount = media.fetched
        ? media.images.length + media.docs.length
        : (addr.images?.length || 0) + (addr.documents?.length || 0);

    return (
        <div style={{ border: `1px solid ${open ? T.amber.border : "#E5E7EB"}`, borderRadius: T.radius.lg, overflow: "hidden", background: "#fff", marginBottom: 10 }}>
            <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: open ? T.amber.bg : "#FAFAFA", cursor: "pointer" }}
                onClick={handleToggle}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.amber.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <HomeOutlined style={{ color: "#fff", fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{addr.addressLine1 || `Address ${index + 1}`}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{[addr.addressLine2, addr.pinCode, addr.landmark].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {index === 0 && (
                        <span style={{ background: T.amber.bg, color: T.amber.text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.amber.border}` }}>
                            Primary
                        </span>
                    )}
                    <Badge count={badgeCount} size="small" style={{ backgroundColor: T.teal.text }} />
                    <Button size="small" type="text" icon={open ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />} style={{ color: T.amber.text }} />
                </div>
            </div>

            {open && (
                <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.amber.border}` }}>
                    <Row gutter={[12, 8]} style={{ marginBottom: 14 }}>
                        <Col xs={24} sm={12}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Address Line 1: </span><span style={{ fontSize: 12 }}>{addr.addressLine1 || "—"}</span></Col>
                        <Col xs={24} sm={12}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Address Line 2: </span><span style={{ fontSize: 12 }}>{addr.addressLine2 || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Pin Code: </span><span style={{ fontSize: 12 }}>{addr.pinCode || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Landmark: </span><span style={{ fontSize: 12 }}>{addr.landmark || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Contact: </span><span style={{ fontSize: 12 }}>{addr.locationContactNumber || "—"}</span></Col>
                        {addr.latitude && (
                            <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Lat/Lng: </span><span style={{ fontSize: 12 }}>{addr.latitude}, {addr.longitude}</span></Col>
                        )}
                    </Row>

                    {media.loading ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}><Spin tip="Loading media..." /></div>
                    ) : (
                        <>
                            <Divider style={{ margin: "8px 0 12px", borderColor: T.amber.border }}>
                                <span style={{ fontSize: 11, color: T.amber.text, fontWeight: 500 }}>Images ({media.images.length})</span>
                            </Divider>
                            <ImageGridView images={media.images} title="" />

                            <Divider style={{ margin: "12px 0", borderColor: T.amber.border }}>
                                <span style={{ fontSize: 11, color: T.amber.text, fontWeight: 500 }}>Documents ({media.docs.length})</span>
                            </Divider>
                            <DocumentGridView documents={media.docs} title="" />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
//  DetailBankCard
// ─────────────────────────────────────────────
export const DetailBankCard = ({ bank, index }) => {
    const [open, setOpen] = useState(false);
    const media = useEntityMedia("bankdetail", bank?.id);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next && !media.fetched) media.fetch();
    };

    const badgeCount = media.fetched
        ? media.images.length + media.docs.length
        : (bank.images?.length || 0) + (bank.documents?.length || 0);

    return (
        <div style={{ border: `1px solid ${open ? T.purple.border : "#E5E7EB"}`, borderRadius: T.radius.lg, overflow: "hidden", background: "#fff", marginBottom: 10 }}>
            <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: open ? T.purple.bg : "#FAFAFA", cursor: "pointer" }}
                onClick={handleToggle}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.purple.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CreditCardOutlined style={{ color: "#fff", fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            {bank.bankName || `Bank ${index + 1}`}
                            {bank.isPrimary && (
                                <span style={{ background: T.purple.bg, color: T.purple.text, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, border: `1px solid ${T.purple.border}` }}>
                                    Primary
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                            {bank.accountHolderName || ""}{bank.accountNumber ? ` · ****${bank.accountNumber.slice(-4)}` : ""}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge count={badgeCount} size="small" style={{ backgroundColor: T.teal.text }} />
                    <Button size="small" type="text" icon={open ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />} style={{ color: T.purple.text }} />
                </div>
            </div>

            {open && (
                <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.purple.border}` }}>
                    <Row gutter={[12, 8]} style={{ marginBottom: 14 }}>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Bank: </span><span style={{ fontSize: 12 }}>{bank.bankName || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Account No.: </span><span style={{ fontSize: 12, fontFamily: "monospace" }}>{bank.accountNumber || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>IFSC: </span><span style={{ fontSize: 12, fontFamily: "monospace" }}>{bank.ifscCode || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Branch: </span><span style={{ fontSize: 12 }}>{bank.branchName || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>SWIFT: </span><span style={{ fontSize: 12 }}>{bank.swiftCode || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>IBAN: </span><span style={{ fontSize: 12 }}>{bank.iban || "—"}</span></Col>
                        <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Type: </span><span style={{ fontSize: 12 }}>{bank.accountType || "—"}</span></Col>
                    </Row>

                    {media.loading ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}><Spin tip="Loading media..." /></div>
                    ) : (
                        <>
                            <Divider style={{ margin: "8px 0 12px", borderColor: T.purple.border }}>
                                <span style={{ fontSize: 11, color: T.purple.text, fontWeight: 500 }}>Images ({media.images.length})</span>
                            </Divider>
                            <ImageGridView images={media.images} title="" />

                            <Divider style={{ margin: "12px 0", borderColor: T.purple.border }}>
                                <span style={{ fontSize: 11, color: T.purple.text, fontWeight: 500 }}>Documents ({media.docs.length})</span>
                            </Divider>
                            <DocumentGridView documents={media.docs} title="" />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

