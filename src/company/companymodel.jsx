//add and edit
// < -------------------------------------------------
import { useEffect, useState, useRef, useCallback } from "react";
import { Modal, Button, Form, Row, Col, Input, Select, Tag, Space, Spin, Alert, Tooltip, message } from "antd";
import {
    BankOutlined,
    SaveOutlined,
    CloseOutlined,
    LockOutlined,
    AppstoreOutlined,
    PictureOutlined,
    FileTextOutlined,
    UserOutlined,
    HomeOutlined,
    CreditCardOutlined,
    HistoryOutlined,
    CloudUploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { T, MODAL_STEPS, LOCKED_SECTIONS } from "./constant";
import {
    saveDraft, loadDraft, clearDraft, hasDraft,
    normalizeImg, normalizeDoc, normalizeContact, normalizeAddress, normalizeBank,
} from "./helpers";
import SidebarNav from "./sidebarnav";
import CompanyImagesSection from "./companyimage";
import CompanyDocumentsSection from "./companydocument";
import ContactPersonsSection from "./contactpersonsection";
import AddressesSection from "./addresssection";
import BankDetailsSection from "./bankdetailsection";
import React from "react";
import axiosInstance from "../../config";

const { Option } = Select;

export default function CompanyModal({
    open,
    onCancel,
    editingCompany,
    companyForm,
    activeSection,
    setActiveSection,
    liveCompanyName,
    setLiveCompanyName,
    liveCompanyType,
    setLiveCompanyType,
    liveCompanyDescription,
    setLiveCompanyDescription,
    basicInfoFilled,
    contacts,
    setContacts,
    addresses,
    setAddresses,
    banks,
    setBanks,
    companyImages,
    setCompanyImages,
    companyDocs,
    setCompanyDocs,
    selectedDomainIds,
    setSelectedDomainIds,
    domains,
    countries,
    timezones,
    docTypes,
    issuers,
    submitting,
    modalFetching,
    onSubmit,
    sidebarCounts,
}) {
    const [draftBanner, setDraftBanner] = useState(false);
    const [companyrole, setcompanyrole] = useState([])
    const formValuesRef = useRef({
        companyName: "",
        companyType: "",
        companyDescription: "",
    });
    const [companyrolefetched, setcompanyrolefetched] = useState(false);

    const syncRefFromForm = useCallback(() => {
        const vals = companyForm.getFieldsValue();
        formValuesRef.current = {
            companyName:
                vals.companyName || formValuesRef.current.companyName || "",
            companyType:
                vals.companyType || formValuesRef.current.companyType || "",
            companyDescription:
                vals.companyDescription || formValuesRef.current.companyDescription || "",
        };
    }, [companyForm]);

    // ── onChange handlers ─────────────────────────────────────────────────────
    const handleNameChange = (e) => {
        formValuesRef.current.companyName = e.target.value;
        setLiveCompanyName(e.target.value);
    };

    const handleTypeChange = (v) => {
        formValuesRef.current.companyType = v ?? "";
        setLiveCompanyType(v ?? "");
    };

    const handleDescChange = (e) => {
        formValuesRef.current.companyDescription = e.target.value;
        setLiveCompanyDescription(e.target.value);
    };



    const CompanyRole = async () => {
        if (companyrolefetched) return;   // dobara fetch mat karo
        try {
            const res = await axiosInstance.get("/CompanyRole/get-all-companyrole");
            const list = res?.data?.data || res?.data?.items || res?.data || [];
            setcompanyrole(Array.isArray(list) ? list : []);
            setcompanyrolefetched(true);
        } catch (error) {
            console.log("companyrole fetch error", error);
            setcompanyrole([]);
        }
    };

    const handleCompanyroleDropdown = (open) => {
        if (open) CompanyRole();
    };

    useEffect(() => {
        if (open) {
            setDraftBanner(hasDraft());
            syncRefFromForm();
            if (!formValuesRef.current.companyName && liveCompanyName) formValuesRef.current.companyName = liveCompanyName;
            if (!formValuesRef.current.companyType && liveCompanyType) formValuesRef.current.companyType = liveCompanyType;
            if (!formValuesRef.current.companyDescription && liveCompanyDescription) formValuesRef.current.companyDescription = liveCompanyDescription;
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!modalFetching && open) syncRefFromForm();
    }, [modalFetching]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Draft restore ─────────────────────────────────────────────────────────
    const handleRestoreDraft = () => {
        const draft = loadDraft();
        if (!draft) return;

        const fv = draft.formValues || {};
        companyForm.setFieldsValue(fv);
        formValuesRef.current = {
            companyName: fv.companyName || "",
            companyType: fv.companyType || "",
            companyDescription: fv.companyDescription || "",
        };
        setLiveCompanyName(fv.companyName || "");
        setLiveCompanyType(fv.companyType || "");
        setLiveCompanyDescription(fv.companyDescription || "");
        setSelectedDomainIds(draft.selectedDomainIds || []);
        setCompanyImages((draft.companyImages || []).map(normalizeImg));
        setCompanyDocs((draft.companyDocs || []).map(normalizeDoc));
        setContacts((draft.contacts || []).map(normalizeContact));
        setAddresses((draft.addresses || []).map(normalizeAddress));
        setBanks((draft.banks || []).map(normalizeBank));
        clearDraft();
        setDraftBanner(false);
    };

    const handleDismissDraft = () => {
        clearDraft();
        setDraftBanner(false);
    };

    // ── Manual Save Draft button ──────────────────────────────────────────────
    const handleManualSaveDraft = () => {
        if (activeSection === "basic") syncRefFromForm();
        const formValues = { ...formValuesRef.current };
        saveDraft({
            formValues,
            contacts,
            addresses,
            banks,
            companyImages,
            companyDocs,
            selectedDomainIds,
            editingCompanyId: editingCompany?.id || null,
        });
        message.success("Draft saved successfully!");
    };

    // ── Cancel ────────────────────────────────────────────────────────────────
    const handleCancel = () => {
        if (activeSection === "basic") syncRefFromForm();
        const formValues = { ...formValuesRef.current };
        const hasContent =
            formValues.companyName || formValues.companyType ||
            contacts.length || addresses.length || banks.length ||
            companyImages.length || companyDocs.length;

        if (hasContent) {
            saveDraft({
                formValues,
                contacts,
                addresses,
                banks,
                companyImages,
                companyDocs,
                selectedDomainIds,
                editingCompanyId: editingCompany?.id || null,
            });
        }
        onCancel();
    };

    const handleSectionChange = (key) => {
        if (!basicInfoFilled && LOCKED_SECTIONS.includes(key)) return;
        if (activeSection === "basic") syncRefFromForm();
        setActiveSection(key);
    };

    const handleSubmit = () => {
        if (activeSection === "basic") syncRefFromForm();
        companyForm.setFieldsValue({
            companyName: formValuesRef.current.companyName,
            companyType: formValuesRef.current.companyType,
            companyDescription: formValuesRef.current.companyDescription,
        });
        onSubmit();
    };

    // ── Section renderer ──────────────────────────────────────────────────────
    const renderSectionContent = () => {
        if (modalFetching) {
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
                    <Spin tip="Loading company data..." size="large" />
                </div>
            );
        }

        switch (activeSection) {
            case "basic":
                return (
                    <>
                        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 20, marginTop: 0 }}>
                            Enter the core details for this company. All sections below will
                            unlock after the required fields are filled.
                        </p>
                        <Row gutter={[14, 0]}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="companyName"
                                    label={<span style={{ fontWeight: 500 }}>Company Name <span style={{ color: "#EF4444" }}>*</span></span>}
                                    rules={[{ required: true, message: "Required" }]}
                                >
                                    <Input placeholder="Enter company name" size="large" onChange={handleNameChange} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="companyRoleId"
                                    label={<span style={{ fontWeight: 500 }}>Company Role <span style={{ color: "#EF4444" }}>*</span></span>}
                                    rules={[{ required: true, message: "Required" }]}
                                >
                                    <Select
                                        placeholder="Select company role"
                                        style={{ width: "100%" }}
                                        size="large"
                                        onChange={handleTypeChange}
                                        onDropdownVisibleChange={handleCompanyroleDropdown}   // ← ye add karo
                                    >
                                        {companyrole.map((t) => (
                                            <Option key={t.id} value={t.id}>{t.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="companyDescription" label={<span style={{ fontWeight: 500 }}>Description</span>}>
                                    <Input.TextArea rows={3} placeholder="Brief description of the company..." onChange={handleDescChange} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label={<span style={{ fontWeight: 500 }}>Business Domains</span>}>
                                    <Select
                                        mode="multiple" placeholder="Select applicable domains..."
                                        style={{ width: "100%" }} size="large"
                                        value={selectedDomainIds}
                                        onChange={(vals) => setSelectedDomainIds(vals)}
                                        optionLabelProp="label" allowClear
                                    >
                                        {domains.map((d) => (
                                            <Option key={d.id} value={d.id} label={d.domainName}>
                                                <Space>
                                                    <AppstoreOutlined style={{ color: T.purple.text }} />
                                                    {d.domainName}
                                                </Space>
                                            </Option>
                                        ))}
                                    </Select>
                                    {selectedDomainIds.length > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            {selectedDomainIds.map((id) => {
                                                const d = domains.find((x) => x.id === id);
                                                return d ? (
                                                    <Tag key={id} closable
                                                        style={{ marginBottom: 4, background: T.purple.bg, color: T.purple.text, borderColor: T.purple.border }}
                                                        onClose={() => setSelectedDomainIds((p) => p.filter((x) => x !== id))}>
                                                        {d.domainName}
                                                    </Tag>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </Form.Item>
                            </Col>
                        </Row>

                        {!basicInfoFilled && (
                            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: T.radius.md, padding: "10px 14px", marginTop: 4 }}>
                                <Space>
                                    <LockOutlined style={{ color: T.amber.text }} />
                                    <span style={{ fontSize: 12, color: T.amber.dark }}>
                                        Fill in Company Name and Type to unlock all additional sections.
                                    </span>
                                </Space>
                            </div>
                        )}

                        {basicInfoFilled && (
                            <div style={{ marginTop: 24 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                                    Section Overview
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {[
                                        { key: "images", label: "Company Images", icon: <PictureOutlined />, color: T.pink.text, bg: T.pink.bg, border: T.pink.border, count: companyImages.length },
                                        { key: "documents", label: "Documents", icon: <FileTextOutlined />, color: T.amber.text, bg: T.amber.bg, border: T.amber.border, count: companyDocs.length },
                                        { key: "contacts", label: "Contact Persons", icon: <UserOutlined />, color: T.green.text, bg: T.green.bg, border: T.green.border, count: contacts.length },
                                        { key: "addresses", label: "Addresses", icon: <HomeOutlined />, color: T.amber.dark, bg: T.amber.bg, border: T.amber.border, count: addresses.length },
                                        { key: "banks", label: "Bank Accounts", icon: <CreditCardOutlined />, color: T.purple.text, bg: T.purple.bg, border: T.purple.border, count: banks.length },
                                    ].map((s) => (
                                        <div key={s.key} onClick={() => handleSectionChange(s.key)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                padding: "12px 14px",
                                                background: s.count > 0 ? s.bg : "#fff",
                                                border: `1px solid ${s.count > 0 ? s.border : "#E5E7EB"}`,
                                                borderRadius: T.radius.md, cursor: "pointer", transition: "box-shadow 0.15s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                                        >
                                            <span style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{s.label}</div>
                                                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                                                    {s.count > 0 ? `${s.count} ${s.count === 1 ? "entry" : "entries"}` : "No entries yet"}
                                                </div>
                                            </div>
                                            {s.count > 0 && (
                                                <span style={{ background: s.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                                                    {s.count}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );

            case "images":
                return (
                    <>
                        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, marginTop: 0 }}>
                            Upload logos, office photos, and other visual assets for this company.
                        </p>
                        <CompanyImagesSection images={companyImages} onChange={setCompanyImages} />
                    </>
                );

            case "documents":
                return (
                    <>
                        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, marginTop: 0 }}>
                            Attach official documents, certificates, and compliance records.
                        </p>
                        <CompanyDocumentsSection docs={companyDocs} onChange={setCompanyDocs} docTypes={docTypes} issuers={issuers} modalFetching={modalFetching} />
                    </>
                );

            case "contacts":
                return (
                    <>
                        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, marginTop: 0 }}>
                            Add key contact persons and representatives.
                        </p>
                        <ContactPersonsSection contacts={contacts} onChange={setContacts} docTypes={docTypes} issuers={issuers} />
                    </>
                );

            case "addresses":
                return (
                    <>
                        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, marginTop: 0 }}>
                            Manage registered addresses and office locations.
                        </p>
                        <AddressesSection addresses={addresses} onChange={setAddresses} countries={countries} timezones={timezones} docTypes={docTypes} issuers={issuers} />
                    </>
                );

            case "banks":
                return (
                    <>
                        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, marginTop: 0 }}>
                            Add bank accounts used for payments and financial transactions.
                        </p>
                        <BankDetailsSection banks={banks} onChange={setBanks} docTypes={docTypes} issuers={issuers} />
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: T.radius.sm, background: T.blue.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.blue.border}` }}>
                        <BankOutlined style={{ color: T.blue.text, fontSize: 15 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                            {editingCompany ? `Edit — ${editingCompany.companyName}` : "Add New Company"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>
                            {editingCompany ? "Update company information" : "Fill in the details to create a new company record"}
                        </div>
                    </div>
                </div>
            }
            open={open}
            onCancel={handleCancel}
            width={1020}
            style={{ top: 20 }}
            styles={{
                body: {
                    padding: 0,
                    height: "78vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                },
            }}
            footer={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid #F3F4F6" }}>
                    {/* Left: hint + Save Draft */}
                    <Space>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                            on Cancel draft will save
                        </span>
                        <Tooltip title="draft save for now">
                            <Button
                                icon={<CloudUploadOutlined />}
                                size="small"
                                onClick={handleManualSaveDraft}
                                style={{
                                    background: "#FFFBEB",
                                    borderColor: T.amber.border,
                                    color: T.amber.text,
                                    fontWeight: 500,
                                    fontSize: 12,
                                }}
                            >
                                Save Draft
                            </Button>
                        </Tooltip>
                    </Space>

                    {/* Right: Cancel + Submit */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button onClick={handleCancel} icon={<CloseOutlined />}>Cancel</Button>
                        <Button
                            type="primary"
                            loading={submitting}
                            disabled={modalFetching}
                            icon={<SaveOutlined />}
                            onClick={handleSubmit}
                            style={{ background: T.blue.text, borderColor: T.blue.text, minWidth: 160 }}
                        >
                            {submitting
                                ? editingCompany?.id ? "Updating..." : "Creating..."
                                : editingCompany?.id ? "Update Company" : "Create Company"
                            }
                        </Button>
                    </div>
                </div>
            }
            destroyOnClose
        >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

                {/* ── Draft restore banner ── */}
                {draftBanner && (
                    <div style={{ padding: "10px 20px", borderBottom: "1px solid #FDE68A", background: "#FFFBEB", flexShrink: 0 }}>
                        <Alert
                            type="warning"
                            showIcon
                            icon={<HistoryOutlined />}
                            message={
                                <span style={{ fontSize: 12 }}>
                                    you have <strong>unsaved draft</strong>{" "}
                                    {loadDraft()?.savedAt && (
                                        <span style={{ color: "#9CA3AF" }}>
                                            ({dayjs(loadDraft()?.savedAt).format("DD MMM, hh:mm A")})
                                        </span>
                                    )}
                                </span>
                            }
                            action={
                                <Space size="small">
                                    <Button size="small" type="primary" onClick={handleRestoreDraft}
                                        style={{ background: T.amber.text, borderColor: T.amber.text }}>
                                        Restore Draft
                                    </Button>
                                    <Button size="small" onClick={handleDismissDraft}>Dismiss</Button>
                                </Space>
                            }
                            style={{ border: "none", background: "transparent", padding: 0 }}
                        />
                    </div>
                )}

                {/* ── Sidebar + Content ── */}
                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    <SidebarNav
                        active={activeSection}
                        onChange={handleSectionChange}
                        counts={sidebarCounts}
                        basicInfoFilled={basicInfoFilled}
                    />
                    <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", overflowX: "hidden" }}>
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                                {MODAL_STEPS.find((s) => s.key === activeSection)?.label}
                            </div>
                            <div style={{
                                height: 2, width: 32,
                                background: MODAL_STEPS.find((s) => s.key === activeSection)?.color,
                                borderRadius: 2, marginTop: 6,
                            }} />
                        </div>
                        <Form form={companyForm} layout="vertical">
                            {renderSectionContent()}
                        </Form>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

