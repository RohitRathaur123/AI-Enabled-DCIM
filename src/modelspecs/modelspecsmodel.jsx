import { useState, useEffect } from "react";
import {
    Modal, Button, Row, Col, Input, Select, Table,
    Space, message, Tag, Divider, Spin,
} from "antd";
import {
    PlusOutlined, DeleteOutlined, SettingOutlined,
    PictureOutlined, FileTextOutlined, EditOutlined,
    CheckCircleOutlined, CloseCircleOutlined, DownOutlined, UpOutlined,
} from "@ant-design/icons";

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE: Images/Documents ab DEVICE API ke generic FileStore endpoints se
// handle hote hain — bilkul waise hi jaise Device / DeviceLocation mein hota
// hai. Company ke CompanyImagesSection / CompanyDocumentsSection aur
// ./filestore (company file store) ab is modal mein use nahi hote.
// ─────────────────────────────────────────────────────────────────────────────
import DeviceImagesSection from "../devicedetails/deviceimagesection";
import DeviceDocumentsSection from "../devicedetails/devicedocumentsection";
import {
    uploadDeviceEntityFiles,
    getDeviceEntityTypeId,
} from "../devicedetails/filedevicestore";

import React from "react";

const { Option } = Select;
const { TextArea } = Input;

const lbl = { fontSize: 12, fontWeight: 500, display: "block", marginBottom: 3 };
const filterOpt = (input, option) => option?.children?.toLowerCase().includes(input.toLowerCase());
const sectionBox = { marginTop: 12, border: "1px solid #d9d9d9", borderRadius: 6, padding: 10 };
const sectionHdr = { marginBottom: 10, fontWeight: 600, fontSize: 13, color: "#333" };

// EntityType name registered in the Device API's EntityType master.
const MODEL_SPEC_ENTITY_NAME = "ModelSpecification";

export default function ModelSpecModal({
    open, onClose, onSubmit,
    editingSpec, submitLoading,
    formData, setFormData,
    newParam, setNewParam,
    pendingImages, setPendingImages,
    pendingDocs, setPendingDocs,
    existingImages, setExistingImages,
    existingDocs, setExistingDocs,
    onDeleteExistingImage, onDeleteExistingDoc,
    deviceTypes, deviceCategories, modelCategories, companies, units,
    onOpenUnitMaster, onOpenModelCategoryMaster,
    onImagePreview,
    docTypes = [],
    issuers = [],
    // Optional overrides passed from the page — default to ModelSpecification.
    entityName = MODEL_SPEC_ENTITY_NAME,
    entityId = null,
}) {
    const [editingParamIdx, setEditingParamIdx] = useState(null);
    const [editingParamData, setEditingParamData] = useState({});
    const [showExtraFields, setShowExtraFields] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);
    const [modelEntityTypeId, setModelEntityTypeId] = useState(null);
    const [loadingEntityType, setLoadingEntityType] = useState(false);

    // ── Resolve the entityId to use for files: editingSpec (edit mode) or the
    //    entityId prop passed by the page (kept in sync post-create too).
    const resolvedEntityId = editingSpec?.id || entityId || null;

    // ── Get ModelSpecification EntityTypeId from DEVICE API on open ─────────
    useEffect(() => {
        if (!open) return;
        setLoadingEntityType(true);
        getDeviceEntityTypeId(entityName)
            .then((id) => {
                if (!id) {
                    message.warning(`Entity type "${entityName}" not found in Device API`);
                }
                setModelEntityTypeId(id);
            })
            .catch((err) => {
                console.error("[ModelSpecModal] Failed to get EntityTypeId:", err);
                message.error("Could not load entity type. File upload may fail.");
            })
            .finally(() => setLoadingEntityType(false));
    }, [open, entityName]);

    // ── merge / split ──────────────────────────────────────────────────────────
    const mergedImages = [...existingImages, ...pendingImages];
    const mergedDocs = [...existingDocs, ...pendingDocs];

    const handleImagesChange = (all) => {
        setExistingImages(all.filter(i => i.id));
        setPendingImages(all.filter(i => !i.id));
    };
    const handleDocsChange = (all) => {
        setExistingDocs(all.filter(d => d.id));
        setPendingDocs(all.filter(d => !d.id));
    };

    // ── spec helpers ───────────────────────────────────────────────────────────
    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };
    const handleSelect = (name, value) =>
        setFormData(p => ({ ...p, [name]: value }));

    const getModelCategoryName = (id) =>
        modelCategories.find(c => c.id === id)?.name || "";

    // ── param helpers ──────────────────────────────────────────────────────────
    const addParameter = () => {
        if (!newParam.modelCategoryId || !newParam.parameterName || !newParam.parameterValue) {
            message.warning("Category, Name and Value are required");
            return;
        }
        setFormData(p => ({
            ...p,
            parameters: [...p.parameters, {
                modelCategoryId: newParam.modelCategoryId,
                categoryName: getModelCategoryName(newParam.modelCategoryId),
                parameterName: newParam.parameterName,
                parameterValue: newParam.parameterValue,
                unit: newParam.unit || "",
                warrantyDuration: newParam.warrantyDuration || "",
                endOfLife: newParam.endOfLife || "",
                intro: newParam.intro || "",
                uses: newParam.uses || "",
                feature: newParam.feature || "",
                remarks: newParam.remarks || "",
            }],
        }));
        setNewParam(p => ({
            ...p,
            modelCategoryId: null,
            parameterName: "",
            parameterValue: "",
            unit: "",
        }));
    };

    const removeParameter = (i) => {
        setFormData(p => ({ ...p, parameters: p.parameters.filter((_, idx) => idx !== i) }));
        setExpandedRows(prev => prev.filter(r => r !== i).map(r => r > i ? r - 1 : r));
        if (editingParamIdx === i) cancelEditParam();
    };

    const startEditParam = (i) => {
        setEditingParamIdx(i);
        setEditingParamData({ ...formData.parameters[i] });
        if (!expandedRows.includes(i)) setExpandedRows(prev => [...prev, i]);
    };
    const cancelEditParam = () => { setEditingParamIdx(null); setEditingParamData({}); };
    const saveEditParam = () => {
        if (!editingParamData.parameterName || !editingParamData.parameterValue) {
            message.warning("Name and Value required"); return;
        }
        setFormData(p => ({
            ...p,
            parameters: p.parameters.map((param, i) =>
                i === editingParamIdx
                    ? { ...param, ...editingParamData, categoryName: getModelCategoryName(editingParamData.modelCategoryId) }
                    : param
            ),
        }));
        cancelEditParam();
    };

    const updateParamField = (idx, field, value) =>
        setFormData(p => ({
            ...p,
            parameters: p.parameters.map((param, i) =>
                i === idx ? { ...param, [field]: value } : param
            ),
        }));

    const toggleExpand = (idx) =>
        setExpandedRows(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );

    // ── MAIN SUBMIT HANDLER — upload files AFTER spec is created/updated ─────
    const handleSubmitWithFiles = async () => {
        const specResult = await onSubmit();

        const modelId = specResult?.id || resolvedEntityId;
        if (!modelId) {
            return;
        }

        const imagesToUpload = pendingImages.filter(img => !img.id && img._file);
        const docsToUpload = pendingDocs.filter(doc => !doc.id && doc._file);

        if (!imagesToUpload.length && !docsToUpload.length) return;

        try {
            const { uploadedImages, uploadedDocs, errors } = await uploadDeviceEntityFiles({
                entityName,
                entityId: modelId,
                deviceId: modelId,
                images: imagesToUpload,
                docs: docsToUpload,
                onSuccess: (imgCount, docCount) => {
                    message.success(`${imgCount} image(s) + ${docCount} document(s) uploaded`);
                },
                onFileError: (fileName) => {
                    message.error(`Failed to upload "${fileName}"`);
                },
            });

            if (!errors?.length) {
                setPendingImages([]);
                setPendingDocs([]);
            }
            console.log("[ModelSpecModal] Upload result:", { uploadedImages, uploadedDocs, errors });
        } catch (err) {
            console.error("[ModelSpecModal] File upload failed:", err);
            message.error("Some files failed to upload. Please try again.");
        }
    };

    // ── extra detail fields config ─────────────────────────────────────────────
    const extraFields = [
        { key: "warrantyDuration", label: "Warranty Duration", type: "input", span: 6 },
        { key: "endOfLife", label: "End of Life", type: "input", span: 6 },
        { key: "intro", label: "Intro", type: "textarea", span: 12 },
        { key: "uses", label: "Uses", type: "textarea", span: 12 },
        { key: "feature", label: "Feature", type: "textarea", span: 12 },
        { key: "remarks", label: "Remarks", type: "textarea", span: 12 },
    ];

    // ── param table columns ────────────────────────────────────────────────────
    const paramColumns = [
        {
            title: "", width: 32,
            render: (_, __, idx) => (
                <Button type="text" size="small"
                    icon={expandedRows.includes(idx) ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
                    onClick={() => toggleExpand(idx)}
                />
            ),
        },
        {
            title: "Category", dataIndex: "categoryName", width: 140,
            render: (t, _, idx) => editingParamIdx === idx
                ? <Select size="small" style={{ width: "100%" }}
                    value={editingParamData.modelCategoryId} allowClear filterOption={filterOpt} showSearch
                    onChange={v => setEditingParamData(p => ({ ...p, modelCategoryId: v }))}>
                    {modelCategories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
                : <Tag color="purple" style={{ fontSize: 11 }}>{t || "—"}</Tag>,
        },
        {
            title: "Parameter Name", dataIndex: "parameterName", width: 170,
            render: (t, _, idx) => editingParamIdx === idx
                ? <Input size="small" value={editingParamData.parameterName}
                    onChange={e => setEditingParamData(p => ({ ...p, parameterName: e.target.value }))} />
                : <span style={{ fontWeight: 500 }}>{t}</span>,
        },
        {
            title: "Value", dataIndex: "parameterValue", width: 160,
            render: (t, _, idx) => editingParamIdx === idx
                ? <Input size="small" value={editingParamData.parameterValue}
                    onChange={e => setEditingParamData(p => ({ ...p, parameterValue: e.target.value }))} />
                : t,
        },
        {
            title: "Unit", dataIndex: "unit", width: 90,
            render: (t, _, idx) => editingParamIdx === idx
                ? <Select size="small" style={{ width: "100%" }}
                    value={editingParamData.unit || undefined} allowClear filterOption={filterOpt} showSearch
                    onChange={v => setEditingParamData(p => ({ ...p, unit: v }))}>
                    {units.map(u => <Option key={u.id} value={u.unitName}>{u.unitName}</Option>)}
                </Select>
                : (t ? <Tag>{t}</Tag> : "—"),
        },
        {
            title: "", width: 72, fixed: "right",
            render: (_, __, idx) => editingParamIdx === idx
                ? <Space size={4}>
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={saveEditParam} />
                    <Button size="small" icon={<CloseCircleOutlined />} onClick={cancelEditParam} />
                </Space>
                : <Space size={4}>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEditParam(idx)} />
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeParameter(idx)} />
                </Space>,
        },
    ];

    return (
        <Modal
            title={editingSpec ? `Edit: ${editingSpec.name}` : "Add New Model Specification"}
            open={open} onCancel={onClose} width={1000}
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" loading={submitLoading || loadingEntityType}
                    onClick={handleSubmitWithFiles}
                    disabled={loadingEntityType}>
                    {editingSpec ? "Update" : "Create"}
                </Button>,
            ]}
        >
            <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>

                {/* ══ SPECIFICATION DETAILS ══════════════════════════════════ */}
                <div style={sectionBox}>
                    <div style={sectionHdr}>📋 Specification Details</div>

                    <Row gutter={12}>
                        <Col span={8}>
                            <label style={lbl}>Device Type <span style={{ color: "red" }}>*</span></label>
                            <Select value={formData.deviceTypeId} style={{ width: "100%" }}
                                onChange={v => handleSelect("deviceTypeId", v)}
                                placeholder="Select device type" size="small" allowClear showSearch
                                filterOption={filterOpt}>
                                {deviceTypes.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                            </Select>
                        </Col>
                        <Col span={8}>
                            <label style={lbl}>Company</label>
                            <Select value={formData.companyId} style={{ width: "100%" }}
                                onChange={v => handleSelect("companyId", v)}
                                placeholder="Select company" size="small" allowClear showSearch
                                filterOption={filterOpt}>
                                {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                            </Select>
                        </Col>
                        <Col span={8}>
                            <label style={lbl}>Name <span style={{ color: "red" }}>*</span></label>
                            <Input name="name" value={formData.name}
                                onChange={handleInput} placeholder="Model name" size="small" />
                        </Col>
                    </Row>

                    <Row gutter={12} style={{ marginTop: 10 }}>
                        <Col span={8}>
                            <label style={lbl}>Model Number</label>
                            <Input name="modelNumber" value={formData.modelNumber}
                                onChange={handleInput} placeholder="e.g. RT-AC5300" size="small" />
                        </Col>
                        <Col span={16}>
                            <label style={lbl}>Remarks</label>
                            <TextArea name="remarks" value={formData.remarks}
                                onChange={handleInput} rows={2}
                                placeholder="Any additional remarks..." style={{ fontSize: 12 }} />
                        </Col>
                    </Row>
                </div>

                {/* ══ PARAMETERS ═════════════════════════════════════════════ */}
                <div style={sectionBox}>
                    <div style={sectionHdr}>
                        <SettingOutlined style={{ marginRight: 4, color: "#722ed1" }} />
                        Parameters
                    </div>

                    <Row gutter={8} align="middle">
                        <Col span={5}>
                            <Select placeholder="Model Category *" size="small" style={{ width: "100%" }}
                                value={newParam.modelCategoryId} allowClear showSearch filterOption={filterOpt}
                                onChange={v => setNewParam(p => ({ ...p, modelCategoryId: v }))}>
                                {modelCategories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                            </Select>
                        </Col>
                        <Col span={6}>
                            <Input placeholder="Parameter Name *" size="small" value={newParam.parameterName}
                                onChange={e => setNewParam(p => ({ ...p, parameterName: e.target.value }))} />
                        </Col>
                        <Col span={6}>
                            <Input placeholder="Parameter Value *" size="small" value={newParam.parameterValue}
                                onChange={e => setNewParam(p => ({ ...p, parameterValue: e.target.value }))} />
                        </Col>
                        <Col span={5}>
                            <Select placeholder="Unit" size="small" style={{ width: "100%" }}
                                value={newParam.unit || undefined} allowClear showSearch filterOption={filterOpt}
                                onChange={v => setNewParam(p => ({ ...p, unit: v }))}>
                                {units.map(u => <Option key={u.id} value={u.unitName}>{u.unitName}</Option>)}
                            </Select>
                        </Col>
                        <Col span={2}>
                            <Button type="primary" size="small" icon={<PlusOutlined />}
                                onClick={addParameter} style={{ width: "100%" }} />
                        </Col>
                    </Row>

                    <div style={{ marginTop: 6 }}>
                        <Button
                            type="link" size="small"
                            style={{ padding: 0, fontSize: 12, color: "#888" }}
                            icon={showExtraFields ? <UpOutlined /> : <DownOutlined />}
                            onClick={() => setShowExtraFields(p => !p)}
                        >
                            {showExtraFields ? "Hide additional fields" : "Add more details (optional)"}
                        </Button>

                        {showExtraFields && (
                            <div style={{
                                marginTop: 8, padding: "10px 12px",
                                background: "#fafafa",
                                border: "1px dashed #d9d9d9",
                                borderRadius: 4,
                            }}>
                                <Row gutter={[10, 8]}>
                                    {extraFields.filter(f => f.type === "input").map(f => (
                                        <Col span={f.span} key={f.key}>
                                            <label style={lbl}>{f.label}</label>
                                            <Input size="small"
                                                value={newParam[f.key] || ""}
                                                placeholder={f.label}
                                                onChange={e => setNewParam(p => ({ ...p, [f.key]: e.target.value }))} />
                                        </Col>
                                    ))}
                                    {extraFields.filter(f => f.type === "textarea").map(f => (
                                        <Col span={f.span} key={f.key}>
                                            <label style={lbl}>{f.label}</label>
                                            <TextArea size="small" rows={2} style={{ fontSize: 12 }}
                                                value={newParam[f.key] || ""}
                                                placeholder={f.label}
                                                onChange={e => setNewParam(p => ({ ...p, [f.key]: e.target.value }))} />
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}
                    </div>

                    {formData.parameters.length > 0 && (
                        <>
                            <Divider style={{ margin: "10px 0" }} />
                            <Table
                                dataSource={formData.parameters}
                                rowKey={(_, i) => i}
                                size="small"
                                pagination={false}
                                columns={paramColumns}
                                expandable={{
                                    expandedRowKeys: expandedRows,
                                    showExpandColumn: false,
                                    expandedRowRender: (record, idx) => (
                                        <div style={{
                                            background: "#f6f0ff",
                                            border: "1px dashed #b37feb",
                                            borderRadius: 4,
                                            padding: "10px 14px",
                                            margin: "2px 0 6px 32px",
                                        }}>
                                            <div style={{ fontSize: 11, color: "#722ed1", marginBottom: 8, fontWeight: 600 }}>
                                                Additional details — {record.parameterName}
                                            </div>
                                            <Row gutter={[10, 8]}>
                                                {extraFields.filter(f => f.type === "input").map(f => (
                                                    <Col span={f.span} key={f.key}>
                                                        <label style={{ ...lbl, color: "#555" }}>{f.label}</label>
                                                        <Input size="small"
                                                            value={
                                                                editingParamIdx === idx
                                                                    ? (editingParamData[f.key] || "")
                                                                    : (record[f.key] || "")
                                                            }
                                                            onChange={e =>
                                                                editingParamIdx === idx
                                                                    ? setEditingParamData(p => ({ ...p, [f.key]: e.target.value }))
                                                                    : updateParamField(idx, f.key, e.target.value)
                                                            }
                                                        />
                                                    </Col>
                                                ))}
                                                {extraFields.filter(f => f.type === "textarea").map(f => (
                                                    <Col span={f.span} key={f.key}>
                                                        <label style={{ ...lbl, color: "#555" }}>{f.label}</label>
                                                        <TextArea size="small" rows={2} style={{ fontSize: 12 }}
                                                            value={
                                                                editingParamIdx === idx
                                                                    ? (editingParamData[f.key] || "")
                                                                    : (record[f.key] || "")
                                                            }
                                                            onChange={e =>
                                                                editingParamIdx === idx
                                                                    ? setEditingParamData(p => ({ ...p, [f.key]: e.target.value }))
                                                                    : updateParamField(idx, f.key, e.target.value)
                                                            }
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    ),
                                }}
                            />
                        </>
                    )}
                </div>

                {/* ══ IMAGES — DEVICE FileStore ══════════════════════════════ */}
                <div style={sectionBox}>
                    <div style={sectionHdr}>
                        <PictureOutlined style={{ marginRight: 4, color: "#fa8c16" }} /> Images
                    </div>
                    {loadingEntityType ? (
                        <Spin tip="Loading..." />
                    ) : (
                        <DeviceImagesSection
                            images={mergedImages}
                            onChange={handleImagesChange}
                            entityTypeId={modelEntityTypeId}
                            entityId={resolvedEntityId}
                            deviceId={resolvedEntityId}
                            autoFetch={false}
                        />
                    )}
                </div>

                {/* ══ DOCUMENTS — DEVICE FileStore ═══════════════════════════ */}
                <div style={{ ...sectionBox, marginBottom: 8 }}>
                    <div style={sectionHdr}>
                        <FileTextOutlined style={{ marginRight: 4, color: "#1890ff" }} /> Documents
                    </div>
                    {loadingEntityType ? (
                        <Spin tip="Loading..." />
                    ) : (
                        <DeviceDocumentsSection
                            docs={mergedDocs}
                            onChange={handleDocsChange}
                            docTypes={docTypes}
                            issuers={issuers}
                            modalFetching={false}
                            entityTypeId={modelEntityTypeId}
                            entityId={resolvedEntityId}
                            deviceId={resolvedEntityId}
                            autoFetch={false}
                        />
                    )}
                </div>

            </div>
        </Modal>
    );
}