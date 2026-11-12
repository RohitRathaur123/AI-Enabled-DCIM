
import { useState, useEffect } from "react";
import React from "react";
import { Row, Col, Form, Input, Button, Select, Popconfirm, Divider } from "antd";
import {
    HomeOutlined, DeleteOutlined, UpOutlined, DownOutlined, CheckCircleOutlined, PlusOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../config"; 
import { T } from "./constant";
import { emptyAddress, toArray } from "./helpers";
import CompanyImagesSection from "./companyimage";
import CompanyDocumentsSection from "./companydocument";
import EmptyState from "./Emptystate";


const { Option } = Select;

export const AddressCard = ({ addr, index, onUpdate, onRemove, countries, timezones, docTypes, issuers }) => {
    const [exp,    setExp]    = useState(true); // DEFAULT TRUE — pehle se khula
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        if (!addr.countryId) { setStates([]); return; }
        axiosInstance.get(`/State/by-country/${addr.countryId}`)
            .then(r => setStates(toArray(r))).catch(() => setStates([]));
    }, [addr.countryId]);

    useEffect(() => {
        if (!addr.stateId) { setCities([]); return; }
        axiosInstance.get(`/City/by-state/${addr.stateId}`)
            .then(r => setCities(toArray(r))).catch(() => setCities([]));
    }, [addr.stateId]);

    const handleCountry = (v) => onUpdate({ countryId: v, stateId: null, cityId: null });
    const handleState   = (v) => onUpdate({ stateId: v, cityId: null });

    const getCountryLabel = (id) => countries.find(c => c.id === id)?.name || "";
    const getStateLabel   = (id) => states.find(s => s.id === id)?.name   || "";

    return (
        <div style={{
            marginBottom: 12,
            border: `1px solid ${exp ? T.amber.border : "#E5E7EB"}`,
            borderRadius: T.radius.lg, overflow: "hidden", background: "#fff",
            boxShadow: exp ? "0 2px 8px rgba(217,119,6,0.06)" : "none",
        }}>
            {/* Header */}
            <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: exp ? T.amber.bg : "#FAFAFA", cursor: "pointer", userSelect: "none" }}
                onClick={() => setExp(o => !o)}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.amber.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <HomeOutlined style={{ color: "#fff", fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>{addr.addressLine1 || `Address ${index + 1}`}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>
                            {[getCountryLabel(addr.countryId), getStateLabel(addr.stateId), addr.pinCode].filter(Boolean).join("  ·  ") || "No location details"}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <span style={{ background: T.amber.bg, color: T.amber.text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: `1px solid ${T.amber.border}` }}>
                        Address {index + 1}
                    </span>
                    <Popconfirm title="Remove this address?" onConfirm={onRemove} okText="Remove" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                    </Popconfirm>
                    <Button size="small" type="text"
                        icon={exp ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
                        style={{ color: T.amber.text }}
                        onClick={(e) => { e.stopPropagation(); setExp(o => !o); }} />
                </div>
            </div>

            {/* Collapsed Preview */}
            {!exp && addr.addressLine1 && (
                <div style={{ padding: "8px 16px", background: "#fff", borderTop: "1px solid #E5E7EB" }}>
                    <Row gutter={[12, 4]}>
                        {addr.addressLine1 && <Col xs={24} sm={12}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Address: </span><span style={{ fontSize: 12 }}>{addr.addressLine1}</span></Col>}
                        {addr.countryId    && <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Country: </span><span style={{ fontSize: 12 }}>{getCountryLabel(addr.countryId)}</span></Col>}
                        {addr.pinCode      && <Col xs={12} sm={6}><span style={{ fontSize: 11, color: "#9CA3AF" }}>Pin: </span><span style={{ fontSize: 12 }}>{addr.pinCode}</span></Col>}
                    </Row>
                </div>
            )}

            {/* Expanded Form */}
            {exp && (
                <div style={{ padding: 16, borderTop: `1px solid ${T.amber.border}`, background: "#fff" }}>
                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Address Line 1</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.addressLine1} onChange={e => onUpdate({ addressLine1: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Address Line 2</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.addressLine2} onChange={e => onUpdate({ addressLine2: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Country</span>} style={{ marginBottom: 10 }}>
                                <Select showSearch size="small" placeholder="Select country" style={{ width: "100%" }} value={addr.countryId || undefined}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())} onChange={handleCountry}>
                                    {countries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>State</span>} style={{ marginBottom: 10 }}>
                                <Select showSearch size="small" placeholder="Select state" style={{ width: "100%" }} value={addr.stateId || undefined}
                                    disabled={!states.length}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())} onChange={handleState}>
                                    {states.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>City</span>} style={{ marginBottom: 10 }}>
                                <Select showSearch size="small" placeholder="Select city" style={{ width: "100%" }} value={addr.cityId || undefined}
                                    disabled={!cities.length}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                                    onChange={v => onUpdate({ cityId: v })}>
                                    {cities.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Pin Code</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.pinCode} onChange={e => onUpdate({ pinCode: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Landmark</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.landmark} onChange={e => onUpdate({ landmark: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Latitude</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.latitude} onChange={e => onUpdate({ latitude: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Longitude</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.longitude} onChange={e => onUpdate({ longitude: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Timezone</span>} style={{ marginBottom: 10 }}>
                                <Select showSearch size="small" placeholder="Select timezone" style={{ width: "100%" }} value={addr.timeZoneId || undefined}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                                    onChange={v => onUpdate({ timeZoneId: v })}>
                                    {timezones.map(t => <Option key={t.id} value={t.id}>{t.timeZoneName}{t.utcOffset ? ` (${t.utcOffset})` : ""}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500 }}>Contact Number</span>} style={{ marginBottom: 10 }}>
                                <Input size="small" value={addr.locationContactNumber} onChange={e => onUpdate({ locationContactNumber: e.target.value })} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: "10px 0 12px", borderColor: T.amber.border }}>
                        <span style={{ fontSize: 11, color: T.amber.text, fontWeight: 500 }}>Images &amp; Documents</span>
                    </Divider>
                    <CompanyImagesSection images={addr.images} onChange={imgs => onUpdate({ images: imgs })} />
                    <div style={{ marginTop: 12 }} />
                    <CompanyDocumentsSection docs={addr.documents} onChange={docs => onUpdate({ documents: docs })} docTypes={docTypes} issuers={issuers} />
                    <div style={{ textAlign: "right", marginTop: 12 }}>
                        <Button size="small" icon={<CheckCircleOutlined />} onClick={() => setExp(false)}
                            style={{ background: T.amber.text, borderColor: T.amber.text, color: "#fff", fontWeight: 500 }}>
                            Collapse
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AddressesSection = ({ addresses = [], onChange, countries, timezones, docTypes, issuers }) => {

    // ─── KEY FIX: section open hote hi agar koi address nahi toh ek add karo ───
    useEffect(() => {
        if (addresses.length === 0) {
            onChange([emptyAddress()]);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const updateAddress = (uid, fieldsObj) =>
        onChange(addresses.map(a => a._uid === uid ? { ...a, ...fieldsObj } : a));

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HomeOutlined style={{ color: T.amber.text, fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.gray.dark }}>Addresses</span>
                    {addresses.length > 0 && (
                        <span style={{ background: T.amber.bg, color: T.amber.text, fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99, border: `1px solid ${T.amber.border}` }}>
                            {addresses.length}
                        </span>
                    )}
                </div>
                <Button size="small" icon={<PlusOutlined />}
                    style={{ background: T.amber.text, borderColor: T.amber.text, color: "#fff", fontWeight: 500 }}
                    onClick={() => onChange([...addresses, emptyAddress()])}>
                    Add Address
                </Button>
            </div>

            {addresses.map((addr, i) => (
                <AddressCard
                    key={addr._uid}
                    addr={addr}
                    index={i}
                    countries={countries}
                    timezones={timezones}
                    docTypes={docTypes}
                    issuers={issuers}
                    onUpdate={(fieldsObj) => updateAddress(addr._uid, fieldsObj)}
                    onRemove={() => onChange(addresses.filter(a => a._uid !== addr._uid))}
                />
            ))}
        </div>
    );
};

export default AddressesSection;

