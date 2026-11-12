
import { useState, useEffect } from "react";
import { Row, Col, Form, Input, Button, Popconfirm, Divider } from "antd";
import {
    UserOutlined, MailOutlined, PhoneOutlined,
    DeleteOutlined, UpOutlined, DownOutlined, CheckCircleOutlined, PlusOutlined,
} from "@ant-design/icons";
import { T } from "./constant";
import { emptyContact } from "./helpers";
import CompanyImagesSection from "./companyimage";
import CompanyDocumentsSection from "./companydocument";
import EmptyState from "./Emptystate";
import React from "react";


export const ContactCard = ({ ct, index, onUpdate, onRemove, docTypes, issuers }) => {
    const [exp, setExp] = useState(true); // DEFAULT TRUE — pehle se khula

    return (
        <div style={{
            marginBottom: 12,
            border: `1px solid ${exp ? T.green.border : "#E5E7EB"}`,
            borderRadius: T.radius.lg, overflow: "hidden", background: "#fff",
            boxShadow: exp ? "0 2px 8px rgba(22,163,74,0.06)" : "none",
        }}>
            {/* Header */}
            <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: exp ? T.green.bg : "#FAFAFA", cursor: "pointer", userSelect: "none" }}
                onClick={() => setExp(o => !o)}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.green.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <UserOutlined style={{ color: "#fff", fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>{ct.userName || `Contact Person ${index + 1}`}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>
                            {[ct.userPrimaryEmail, ct.userPrimaryPhoneNumber].filter(Boolean).join("  ·  ") || "No contact details added"}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <span style={{ background: T.green.bg, color: T.green.text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.green.border}` }}>
                        Contact {index + 1}
                    </span>
                    <Popconfirm title="Remove this contact?" onConfirm={onRemove} okText="Remove" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                    </Popconfirm>
                    <Button size="small" type="text"
                        icon={exp ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
                        style={{ color: T.green.text }}
                        onClick={(e) => { e.stopPropagation(); setExp(o => !o); }} />
                </div>
            </div>

            {/* Collapsed Preview */}
            {!exp && (ct.userName || ct.userPrimaryEmail) && (
                <div style={{ padding: "8px 16px", background: "#fff", borderTop: "1px solid #E5E7EB" }}>
                    <Row gutter={[12, 4]}>
                        {ct.userName               && <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Name: </span><span style={{ fontSize: 12 }}>{ct.userName}</span></Col>}
                        {ct.userPrimaryEmail       && <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Email: </span><span style={{ fontSize: 12 }}>{ct.userPrimaryEmail}</span></Col>}
                        {ct.userPrimaryPhoneNumber && <Col xs={24} sm={8}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Phone: </span><span style={{ fontSize: 12 }}>{ct.userPrimaryPhoneNumber}</span></Col>}
                    </Row>
                </div>
            )}

            {/* Expanded Form */}
            {exp && (
                <div style={{ padding: 16, borderTop: `1px solid ${T.green.border}`, background: "#fff" }}>
                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Full Name</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" prefix={<UserOutlined style={{ color: "#D1D5DB" }} />} placeholder="Contact person's name"
                                    value={ct.userName} onChange={e => onUpdate("userName", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Primary Email</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" prefix={<MailOutlined style={{ color: "#D1D5DB" }} />} placeholder="primary@company.com"
                                    value={ct.userPrimaryEmail} onChange={e => onUpdate("userPrimaryEmail", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Secondary Email</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" placeholder="secondary@company.com"
                                    value={ct.userSecondaryEmail} onChange={e => onUpdate("userSecondaryEmail", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Primary Phone</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" prefix={<PhoneOutlined style={{ color: "#D1D5DB" }} />} placeholder="+91 XXXXX XXXXX"
                                    value={ct.userPrimaryPhoneNumber} onChange={e => onUpdate("userPrimaryPhoneNumber", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Secondary Phone</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" placeholder="+91 XXXXX XXXXX"
                                    value={ct.userSecondaryPhoneNumber} onChange={e => onUpdate("userSecondaryPhoneNumber", e.target.value)} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: "12px 0", borderColor: T.green.border }}>
                        <span style={{ fontSize: 11, color: T.green.text, fontWeight: 500 }}>Images &amp; Documents</span>
                    </Divider>
                    <CompanyImagesSection images={ct.images} onChange={imgs => onUpdate("images", imgs)} />
                    <div style={{ marginTop: 12 }} />
                    <CompanyDocumentsSection docs={ct.documents} onChange={docs => onUpdate("documents", docs)} docTypes={docTypes} issuers={issuers} />
                    <div style={{ textAlign: "right", marginTop: 12 }}>
                        <Button size="small" icon={<CheckCircleOutlined />} onClick={() => setExp(false)}
                            style={{ background: T.green.text, borderColor: T.green.text, color: "#fff", fontWeight: 500 }}>
                            Collapse
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ContactPersonsSection = ({ contacts = [], onChange, docTypes, issuers }) => {

    // ─── KEY FIX: section open hote hi agar koi contact nahi toh ek add karo ───
    useEffect(() => {
        if (contacts.length === 0) {
            onChange([emptyContact()]);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const updateContact = (uid, field, val) =>
        onChange(contacts.map(c => c._uid === uid ? { ...c, [field]: val } : c));

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UserOutlined style={{ color: T.green.text, fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.gray.dark }}>Contact Persons</span>
                    {contacts.length > 0 && (
                        <span style={{ background: T.green.bg, color: T.green.text, fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99, border: `1px solid ${T.green.border}` }}>
                            {contacts.length}
                        </span>
                    )}
                </div>
                <Button size="small" icon={<PlusOutlined />}
                    style={{ background: T.green.text, borderColor: T.green.text, color: "#fff", fontWeight: 500 }}
                    onClick={() => onChange([...contacts, emptyContact()])}>
                    Add Contact
                </Button>
            </div>

            {contacts.map((ct, i) => (
                <ContactCard
                    key={ct._uid}
                    ct={ct}
                    index={i}
                    docTypes={docTypes}
                    issuers={issuers}
                    onUpdate={(field, val) => updateContact(ct._uid, field, val)}
                    onRemove={() => onChange(contacts.filter(c => c._uid !== ct._uid))}
                />
            ))}
        </div>
    );
};

export default ContactPersonsSection;
