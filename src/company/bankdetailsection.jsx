
import { useState, useEffect } from "react";
import React from "react";
import { Row, Col, Form, Input, Button, Select, Switch, Popconfirm, Divider } from "antd";
import {
    CreditCardOutlined, DeleteOutlined, UpOutlined, DownOutlined,
    CheckCircleOutlined, PlusOutlined,
} from "@ant-design/icons";
import { T } from "./constant";
import { emptyBank } from "./helpers";
import CompanyImagesSection from "./companyimage";
import CompanyDocumentsSection from "./companydocument";
import EmptyState from "./Emptystate";

const { Option } = Select;

export const BankCard = ({ bank, index, onUpdate, onRemove, docTypes, issuers }) => {
    const [exp, setExp] = useState(true); // DEFAULT TRUE — pehle se khula

    return (
        <div style={{
            marginBottom: 12,
            border: `1px solid ${exp ? T.purple.border : "#E5E7EB"}`,
            borderRadius: T.radius.lg, overflow: "hidden", background: "#fff",
            boxShadow: exp ? "0 2px 8px rgba(124,58,237,0.06)" : "none",
        }}>
            {/* Header */}
            <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: exp ? T.purple.bg : "#FAFAFA", cursor: "pointer", userSelect: "none" }}
                onClick={() => setExp(o => !o)}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.purple.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CreditCardOutlined style={{ color: "#fff", fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", display: "flex", alignItems: "center", gap: 6 }}>
                            {bank.bankName || `Bank Account ${index + 1}`}
                            {bank.isPrimary && (
                                <span style={{ background: T.purple.bg, color: T.purple.text, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, border: `1px solid ${T.purple.border}` }}>
                                    Primary
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>
                            {[bank.accountHolderName, bank.accountNumber ? `****${bank.accountNumber.slice(-4)}` : null, bank.ifscCode].filter(Boolean).join("  ·  ") || "No account details"}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <span style={{ background: T.purple.bg, color: T.purple.text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.purple.border}` }}>
                        Bank {index + 1}
                    </span>
                    <Popconfirm title="Remove this bank account?" onConfirm={onRemove} okText="Remove" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                    </Popconfirm>
                    <Button size="small" type="text"
                        icon={exp ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
                        style={{ color: T.purple.text }}
                        onClick={(e) => { e.stopPropagation(); setExp(o => !o); }} />
                </div>
            </div>

            {/* Collapsed Preview */}
            {!exp && bank.bankName && (
                <div style={{ padding: "8px 16px", background: "#fff", borderTop: "1px solid #E5E7EB" }}>
                    <Row gutter={[12, 4]}>
                        {bank.bankName          && <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Bank: </span><span style={{ fontSize: 12 }}>{bank.bankName}</span></Col>}
                        {bank.accountHolderName && <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Holder: </span><span style={{ fontSize: 12 }}>{bank.accountHolderName}</span></Col>}
                        {bank.accountNumber     && <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Account: </span><span style={{ fontSize: 12 }}>****{bank.accountNumber.slice(-4)}</span></Col>}
                        {bank.ifscCode          && <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>IFSC: </span><span style={{ fontSize: 12 }}>{bank.ifscCode}</span></Col>}
                    </Row>
                </div>
            )}

            {/* Expanded Form */}
            {exp && (
                <div style={{ padding: 16, borderTop: `1px solid ${T.purple.border}`, background: "#fff" }}>
                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Bank Name</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.bankName} onChange={e => onUpdate("bankName", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Account Holder Name</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.accountHolderName} onChange={e => onUpdate("accountHolderName", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Account Number</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.accountNumber} onChange={e => onUpdate("accountNumber", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>IFSC Code</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.ifscCode} onChange={e => onUpdate("ifscCode", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Branch Name</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.branchName} onChange={e => onUpdate("branchName", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>SWIFT Code</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.swiftCode} onChange={e => onUpdate("swiftCode", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>IBAN</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={bank.iban} onChange={e => onUpdate("iban", e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Account Type</span>} style={{ marginBottom: 10 }}>
                                <Select size="small" placeholder="Select type" style={{ width: "100%" }} value={bank.accountType || undefined} onChange={v => onUpdate("accountType", v)}>
                                    {["Current", "Savings", "Overdraft", "Fixed Deposit"].map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8} style={{ display: "flex", alignItems: "center", paddingTop: 6 }}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Set as Primary</span>} style={{ marginBottom: 10 }}>
                                <Switch size="small" checked={bank.isPrimary} onChange={v => onUpdate("isPrimary", v)} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: "10px 0 12px", borderColor: T.purple.border }}>
                        <span style={{ fontSize: 11, color: T.purple.text, fontWeight: 500 }}>Images &amp; Documents</span>
                    </Divider>
                    <CompanyImagesSection images={bank.images} onChange={imgs => onUpdate("images", imgs)} />
                    <div style={{ marginTop: 12 }} />
                    <CompanyDocumentsSection docs={bank.documents} onChange={docs => onUpdate("documents", docs)} docTypes={docTypes} issuers={issuers} />
                    <div style={{ textAlign: "right", marginTop: 12 }}>
                        <Button size="small" icon={<CheckCircleOutlined />} onClick={() => setExp(false)}
                            style={{ background: T.purple.text, borderColor: T.purple.text, color: "#fff", fontWeight: 500 }}>
                            Collapse
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const BankDetailsSection = ({ banks = [], onChange, docTypes, issuers }) => {

    // ─── KEY FIX: section open hote hi agar koi bank nahi toh ek add karo ───
    useEffect(() => {
        if (banks.length === 0) {
            onChange([emptyBank()]);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const updateBank = (uid, field, val) =>
        onChange(banks.map(b => b._uid === uid ? { ...b, [field]: val } : b));

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CreditCardOutlined style={{ color: T.purple.text, fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.gray.dark }}>Bank Details</span>
                    {banks.length > 0 && (
                        <span style={{ background: T.purple.bg, color: T.purple.text, fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99, border: `1px solid ${T.purple.border}` }}>
                            {banks.length}
                        </span>
                    )}
                </div>
                <Button size="small" icon={<PlusOutlined />}
                    style={{ background: T.purple.text, borderColor: T.purple.text, color: "#fff", fontWeight: 500 }}
                    onClick={() => onChange([...banks, emptyBank()])}>
                    Add Bank
                </Button>
            </div>

            {banks.map((bank, i) => (
                <BankCard
                    key={bank._uid}
                    bank={bank}
                    index={i}
                    docTypes={docTypes}
                    issuers={issuers}
                    onUpdate={(field, val) => updateBank(bank._uid, field, val)}
                    onRemove={() => onChange(banks.filter(b => b._uid !== bank._uid))}
                />
            ))}
        </div>
    );
};

export default BankDetailsSection;

