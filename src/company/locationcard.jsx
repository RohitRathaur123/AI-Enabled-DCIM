import { useState, useEffect } from "react";
import {
    Row, Col, Form, Input, Select, Button,
    Space, Card, Popconfirm, Divider,
} from "antd";
import {
    EnvironmentOutlined, EditOutlined,
    SaveOutlined, DeleteOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../config";
import { T } from "./constant";
import { toArray } from "./helpers";
import CompanyImagesSection, { uploadAllPendingImages } from "./companyimage";
import CompanyDocumentsSection, { uploadAllPendingDocs } from "./companydocument";
import { getEntityTypeId } from "./filestore";
import React from "react";
const { Option } = Select;

const LocationCard = ({
    loc, index,
    onUpdate, onDelete, onSave,
    saving, deleting,
    countries, timezones,
    docTypes, issuers,
}) => {
    const [editing, setEditing] = useState(!loc.id);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const [fetchedImages, setFetchedImages] = useState(null);
    const [fetchedDocs, setFetchedDocs] = useState(null);
    const [mediaLoading, setMediaLoading] = useState(false);

    // ── Location entityTypeId (needed by CompanyImagesSection/CompanyDocumentsSection) ──
    const [locationEntityTypeId, setLocationEntityTypeId] = useState(null);

    useEffect(() => {
        let mounted = true;
        getEntityTypeId("LocationModel")
            .then((id) => { if (mounted) setLocationEntityTypeId(id); })
            .catch(() => { if (mounted) setLocationEntityTypeId(null); });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (loc.countryId) {
            axiosInstance.get(`/State/by-country/${loc.countryId}`)
                .then(r => setStates(toArray(r)))
                .catch(() => { });
        }
    }, []);

    useEffect(() => {
        if (loc.stateId) {
            axiosInstance.get(`/City/by-state/${loc.stateId}`)
                .then(r => setCities(toArray(r)))
                .catch(() => { });
        }
    }, []);

    const handleCountry = async (v) => {
        onUpdate("countryId", v);
        onUpdate("stateId", null);
        onUpdate("cityId", null);
        setStates([]); setCities([]);
        try {
            setStates(toArray(await axiosInstance.get(`/State/by-country/${v}`)));
        } catch { }
    };

    const handleState = async (v) => {
        onUpdate("stateId", v);
        onUpdate("cityId", null);
        setCities([]);
        try {
            setCities(toArray(await axiosInstance.get(`/City/by-state/${v}`)));
        } catch { }
    };

    const handleSaveClick = async () => {
        await onSave();
        setEditing(false);
    };

    return (
        <Card
            size="small"
            style={{
                marginBottom: 12,
                border: editing ? `1px solid ${T.teal.border}` : "1px solid #E5E7EB",
                background: editing ? T.teal.bg : "#FAFAFA",
                borderRadius: T.radius.lg,
            }}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <EnvironmentOutlined style={{ color: T.teal.text }} />
                    <span style={{ fontWeight: 600 }}>Location {index + 1}</span>
                    {loc.locationType && (
                        <span style={{
                            background: T.teal.bg, color: T.teal.text,
                            fontSize: 10, fontWeight: 700,
                            padding: "1px 8px", borderRadius: 99,
                            border: `1px solid ${T.teal.border}`,
                        }}>
                            {loc.locationType}
                        </span>
                    )}
                    {loc.id
                        ? <span style={{ background: T.green.bg, color: T.green.text, fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 99 }}>Saved</span>
                        : <span style={{ background: T.amber.bg, color: T.amber.text, fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 99 }}>New</span>
                    }
                </div>
            }
            extra={
                <Space>
                    {loc.id && !editing && (
                        <Button icon={<EditOutlined />} size="small" onClick={() => setEditing(true)}>
                            Edit
                        </Button>
                    )}
                    {editing && (
                        <>
                            <Button
                                type="primary" size="small"
                                loading={saving} icon={<SaveOutlined />}
                                style={{ background: T.teal.text, borderColor: T.teal.text }}
                                onClick={handleSaveClick}
                            >
                                Save
                            </Button>
                            {loc.id && (
                                <Button size="small" onClick={() => setEditing(false)}>
                                    Cancel
                                </Button>
                            )}
                        </>
                    )}
                    <Popconfirm
                        title="Delete this location?"
                        onConfirm={onDelete}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />} size="small" loading={deleting}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            }
        >
            {loc.id && !editing ? (
                <Row gutter={[12, 6]}>
                    <Col xs={24} sm={8}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Type: </span>
                        <span style={{ fontSize: 12 }}>{loc.locationType || "—"}</span>
                    </Col>
                    <Col xs={24} sm={16}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Address: </span>
                        <span style={{ fontSize: 12 }}>
                            {[loc.addressLine1, loc.addressLine2].filter(Boolean).join(", ") || "—"}
                        </span>
                    </Col>
                    <Col xs={24} sm={8}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Pin: </span>
                        <span style={{ fontSize: 12 }}>{loc.pinCode || "—"}</span>
                    </Col>
                    <Col xs={24} sm={8}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Contact: </span>
                        <span style={{ fontSize: 12 }}>{loc.locationContactNumber || "—"}</span>
                    </Col>
                    <Col xs={24} sm={8}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Landmark: </span>
                        <span style={{ fontSize: 12 }}>{loc.landmark || "—"}</span>
                    </Col>
                </Row>
            ) : (
                <>
                    <Row gutter={[10, 0]}>
                        <Col xs={24} sm={8}>
                            <Form.Item label="Location Type" style={{ marginBottom: 8 }}>
                                <Select
                                    size="small" placeholder="Select type"
                                    style={{ width: "100%" }}
                                    value={loc.locationType || undefined}
                                    onChange={v => onUpdate("locationType", v)}
                                >
                                    {["HQ", "Branch", "Warehouse", "Regional Office"].map(t => (
                                        <Option key={t} value={t}>{t}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Form.Item label="Address Line 1" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.addressLine1}
                                    onChange={e => onUpdate("addressLine1", e.target.value)} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Form.Item label="Address Line 2" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.addressLine2}
                                    onChange={e => onUpdate("addressLine2", e.target.value)} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Form.Item label="Country" style={{ marginBottom: 8 }}>
                                <Select
                                    showSearch size="small" placeholder="Country"
                                    style={{ width: "100%" }}
                                    value={loc.countryId || undefined}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                                    onChange={handleCountry}
                                >
                                    {countries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Form.Item label="State" style={{ marginBottom: 8 }}>
                                <Select
                                    showSearch size="small" placeholder="State"
                                    style={{ width: "100%" }}
                                    value={loc.stateId || undefined}
                                    disabled={!states.length}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                                    onChange={handleState}
                                >
                                    {states.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Form.Item label="City" style={{ marginBottom: 8 }}>
                                <Select
                                    showSearch size="small" placeholder="City"
                                    style={{ width: "100%" }}
                                    value={loc.cityId || undefined}
                                    disabled={!cities.length}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                                    onChange={v => onUpdate("cityId", v)}
                                >
                                    {cities.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={12} sm={6}>
                            <Form.Item label="Pin Code" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.pinCode}
                                    onChange={e => onUpdate("pinCode", e.target.value)} />
                            </Form.Item>
                        </Col>

                        <Col xs={12} sm={6}>
                            <Form.Item label="Landmark" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.landmark}
                                    onChange={e => onUpdate("landmark", e.target.value)} />
                            </Form.Item>
                        </Col>

                        <Col xs={12} sm={6}>
                            <Form.Item label="Latitude" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.latitude}
                                    onChange={e => onUpdate("latitude", e.target.value)} />
                            </Form.Item>
                        </Col>

                        <Col xs={12} sm={6}>
                            <Form.Item label="Longitude" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.longitude}
                                    onChange={e => onUpdate("longitude", e.target.value)} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item label="Timezone" style={{ marginBottom: 8 }}>
                                <Select
                                    showSearch size="small" placeholder="Timezone"
                                    style={{ width: "100%" }}
                                    value={loc.timeZoneId || undefined}
                                    filterOption={(i, o) => o?.children?.toLowerCase().includes(i.toLowerCase())}
                                    onChange={v => onUpdate("timeZoneId", v)}
                                >
                                    {timezones.map(t => (
                                        <Option key={t.id} value={t.id}>
                                            {t.timeZoneName}{t.utcOffset ? ` (${t.utcOffset})` : ""}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item label="Contact Number" style={{ marginBottom: 8 }}>
                                <Input size="small" value={loc.locationContactNumber}
                                    onChange={e => onUpdate("locationContactNumber", e.target.value)} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider style={{ margin: "10px 0", borderColor: T.teal.border }} />

                    <CompanyImagesSection
                        images={fetchedImages ?? (loc.images || [])}
                        onChange={imgs => {
                            setFetchedImages(imgs);
                            onUpdate("images", imgs);
                        }}
                        entityTypeId={locationEntityTypeId}
                        entityId={loc.id || null}
                        autoFetch={true}
                    />

                    <div style={{ marginTop: 10 }} />

                    <CompanyDocumentsSection
                        docs={fetchedDocs ?? (loc.documents || [])}
                        onChange={docs => {
                            setFetchedDocs(docs);
                            onUpdate("documents", docs);
                        }}
                        docTypes={docTypes}
                        issuers={issuers}
                        modalFetching={mediaLoading}
                        entityTypeId={locationEntityTypeId}
                        entityId={loc.id || null}
                        autoFetch={true}
                    />
                </>
            )}
        </Card>
    );
};

export default LocationCard;