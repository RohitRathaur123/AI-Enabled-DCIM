import { useState, useEffect, useRef } from "react";
import {
    Row, Col, Card, Space, Button, Input, Select,
    Typography, Modal, message, Pagination,
} from "antd";
import {
    TableOutlined, PlusOutlined, ReloadOutlined,
    SettingOutlined, AppstoreOutlined,
    CheckCircleOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons";
import axiosInstance, { axiosdevice } from "../../config";

import {
    transformSpec, transformParameters,
    fetchParametersForSpec,
    downloadDatasheet,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE: ModelSpecification images/documents ab DEVICE API ke generic
// FileStore endpoints se handle hote hain (bilkul waise hi jaise DeviceLocation
// mein hota hai) — companyimage.js / companydocument.js ab is page ke lia use
// nahi hote. EntityType lookup ka naam "ModelSpecification" hai.
// ─────────────────────────────────────────────────────────────────────────────
import {
    uploadDeviceEntityFiles,
    getDeviceEntityTypeId,
    fetchDeviceEntityFiles,
} from "../devicedetails/filedevicestore";

import UnitMasterModal from "./unitmasters";
import ModelCategoryModal from "./modelcategorymodel";
import ModelSpecModal from "./modelspecsmodel";
import ModelSpecPreview from "./modelspecspreview";
import ModelSpecTable from "./modelspecstable";
import ModelFileSpecs from "./modelfile";

import React from "react";
const { Title, Text } = Typography;
const { Option } = Select;
const PAGE_SIZE = 10;

// EntityType name registered in the Device API's EntityType master.
// Must exactly match whatever is stored there (case-insensitive / partial
// match is handled by getDeviceEntityTypeId, but keep this in sync).
const MODEL_SPEC_ENTITY_NAME = "ModelSpecification";

// ── ModelSpecification — exact C# model fields only ──────────────────────────
export const EMPTY_FORM = {
    name: "",
    deviceTypeId: null,
    modelCategoryId: null,
    companyId: null,
    modelNumber: "",
    remarks: "",
    parameters: [],
};

// ── ModelParameter — exact C# model fields only ───────────────────────────────
export const EMPTY_PARAM = {
    modelCategoryId: null,
    parameterName: "",
    parameterValue: "",
    unit: "",
    capacity: "",
    processor: "",
    ram: "",
    storage: "",
    remarks: "",
    firmwareVersion: "",
    protocol: "",
    warrantyDuration: "",
    endOfLife: "",
    intro: "",
    uses: "",
    feature: "",
};

function PaginationBar({ page, pageSize, total, onChange }) {
    return (
        <div style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            padding: "10px 16px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA",
        }}>
            <Pagination
                current={page} pageSize={pageSize} total={total} size="small"
                showTotal={(t) => `Total ${t} items`}
                onChange={onChange} showSizeChanger={false}
            />
        </div>
    );
}

// ── Map a raw FileStore record → the shape used inside the modal/preview ────
// (mirrors DeviceLocationsModal — no more companyId/entityType from the old
// company file store; these come straight from Device FileStore now)
const toSavedImage = (img) => ({
    id: img.id,
    _uid: `saved-img-${img.id}`,
    fileName: img.fileName || "",
    _previewUrl: "",
    fileType: img.fileType || "",
    fileUse: img.fileUse || "",
    fileExpiryDate: img.fileExpiryDate || null,
    filePath: img.filePath || img.path || null,
});

const toSavedDoc = (doc) => ({
    id: doc.id,
    _uid: `saved-doc-${doc.id}`,
    fileName: doc.fileName || "",
    documentName: doc.documentName || doc.fileName || "",
    documentNumber: doc.documentNumber || "",
    documentTypeId: doc.documentTypeId || null,
    issuedById: doc.issuedById || null,
    issuedByDate: doc.issuedByDate || null,
    documentValidTill: doc.documentValidTill || null,
    documentPath: doc.documentPath || doc.filePath || null,
});

const parsePagedResponse = (raw) => {
    const envelope =
        raw?.totalRecords !== undefined ? raw
            : raw?.data?.totalRecords !== undefined ? raw.data
                : raw?.data !== undefined ? raw.data
                    : raw;
    if (Array.isArray(envelope)) return { rows: envelope, total: envelope.length };
    if (Array.isArray(envelope?.data)) return { rows: envelope.data, total: envelope.totalRecords ?? envelope.totalCount ?? envelope.data.length };
    if (Array.isArray(envelope?.items)) return { rows: envelope.items, total: envelope.totalCount ?? envelope.items.length };
    const rows = Array.isArray(envelope) ? envelope : [];
    return { rows, total: rows.length };
};

export default function ModelSpecificationPage() {


    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUnitMaster, setShowUnitMaster] = useState(false);
    const [showModelCategoryMaster, setShowModelCategoryMaster] = useState(false);
    const [showImgPreview, setShowImgPreview] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [modalSpecs, setModalSpecs] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [modelCategories, setModelCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [units, setUnits] = useState([]);
    const [deviceCategories, setDeviceCategories] = useState([]);

    const [specPage, setSpecPage] = useState(1);
    const [specTotal, setSpecTotal] = useState(0);
    const specPageRef = useRef(1);

    const [editingSpec, setEditingSpec] = useState(null);
    const [specToDelete, setSpecToDelete] = useState(null);
    const [previewSpec, setPreviewSpec] = useState(null);
    const [activeTab, setActiveTab] = useState("details");

    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [newParam, setNewParam] = useState({ ...EMPTY_PARAM });

    const [existingImages, setExistingImages] = useState([]);
    const [existingDocs, setExistingDocs] = useState([]);
    const [pendingImages, setPendingImages] = useState([]);
    const [pendingDocs, setPendingDocs] = useState([]);

    const [searchText, setSearchText] = useState("");
    const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");
    const [companyFilter, setCompanyFilter] = useState("all");

    const searchRef = useRef("");
    const deviceTypeRef = useRef("all");
    const companyRef = useRef("all");

    // Cache the ModelSpecification EntityTypeId so we don't re-hit
    // /EntityType/get-all-entity on every open/edit/preview.
    const modelSpecEntityTypeIdRef = useRef(null);
    const getModelSpecEntityTypeId = async () => {
        if (modelSpecEntityTypeIdRef.current) return modelSpecEntityTypeIdRef.current;
        const id = await getDeviceEntityTypeId(MODEL_SPEC_ENTITY_NAME);
        if (!id) {
            message.warning(`Entity type "${MODEL_SPEC_ENTITY_NAME}" not found in Device API`);
        }
        modelSpecEntityTypeIdRef.current = id;
        return id;
    };

    const getDeviceTypeName = id => deviceTypes.find(t => t.id === id)?.name || "";
    const getModelCategoryName = id => modelCategories.find(c => c.id === id)?.name || "";
    const getCompanyName = id => companies.find(c => c.id === id)?.name || "";
    const lookups = { getDeviceTypeName, getModelCategoryName, getCompanyName };

    const fetchDropdownData = async () => {
        try {
            const [typesRes, modelCatRes, companiesRes, unitsRes, deviceCatRes] = await Promise.all([
                axiosdevice.get("/DeviceType/get-all-devicetype"),
                axiosdevice.get("/ModelCategory/get-all-model"),
                axiosInstance.get("/Company/get-all-company"),
                axiosdevice.get("/UnitMaster/get-all-units"),
                axiosdevice.get("/DeviceCategory/get-all-category"),
            ]);
            // const toArray = (res) => Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            const toArray = (res) => {
                const body = res?.data ?? res;
                if (Array.isArray(body?.data)) return body.data;
                if (Array.isArray(body)) return body;
                if (Array.isArray(res)) return res;
                return [];
            };
            setDeviceTypes(toArray(typesRes));
            setModelCategories(toArray(modelCatRes));
            setCompanies(toArray(companiesRes).map(c => ({
                ...c,
                id: c.company?.id ?? c.id,
                name: c.company?.companyName ?? c.companyName ?? c.name ?? "",
            })));
            setUnits(toArray(unitsRes));
            setDeviceCategories(toArray(deviceCatRes));
        } catch { message.error("Failed to load form data"); }
    };

    const fetchModels = async (p, search, deviceType, company) => {
        const page = p ?? specPageRef.current;
        const term = search ?? searchRef.current;
        const devFilter = deviceType ?? deviceTypeRef.current;
        const compFilter = company ?? companyRef.current;
        try {
            setLoading(true);
            let url = `ModelSpecification/get-all-modelspecification?Page=${page}&PageSize=${PAGE_SIZE}`;
            if (term) url += `&search=${encodeURIComponent(term)}`;
            if (devFilter && devFilter !== "all") url += `&deviceTypeId=${devFilter}`;
            if (compFilter && compFilter !== "all") url += `&companyId=${compFilter}`;

            const raw = await axiosdevice.get(url);
            const { rows, total } = parsePagedResponse(raw);
            const specs = rows.filter(s => !s.isDeleted);

            const specsWithData = await Promise.all(
                specs.map(async (s) => {
                    let companyName = "", parameters = [];
                    try {
                        if (s.companyId) {
                            const res = await axiosInstance.get(`Company/get-company/${s.companyId}`);
                            companyName = res?.company?.companyName || "";
                        }
                    } catch { }
                    try { parameters = await fetchParametersForSpec(s.id); } catch { }
                    return { ...s, companyName, parameters };
                })
            );
            setModalSpecs(specsWithData.map(s => transformSpec(s, lookups)));
            setSpecTotal(total);
        } catch (e) {
            console.error(e);
            message.error("Failed to load specifications");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchDropdownData(); fetchModels(1); getModelSpecEntityTypeId(); }, []); // eslint-disable-line

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        searchRef.current = searchText;
        deviceTypeRef.current = deviceTypeFilter;
        companyRef.current = companyFilter;
        specPageRef.current = 1; setSpecPage(1);
        fetchModels(1, searchText, deviceTypeFilter, companyFilter);
    }, [searchText, deviceTypeFilter, companyFilter]); // eslint-disable-line

    const handleSpecPageChange = (p) => {
        specPageRef.current = p; setSpecPage(p); fetchModels(p);
    };

    const totalSpecs = specTotal;
    const totalParameters = modalSpecs.reduce((sum, s) => sum + (s.parameters?.length || 0), 0);

    const openAddModal = () => {
        setEditingSpec(null);
        setFormData({ ...EMPTY_FORM });
        setNewParam({ ...EMPTY_PARAM });
        setPendingImages([]); setPendingDocs([]);
        setExistingImages([]); setExistingDocs([]);
        setShowModal(true);
    };

    const openEditModal = async (record) => {
        const original = modalSpecs.find(s => s.id === record.id);
        if (!original) { message.error("Specification not found"); return; }
        setEditingSpec(original);

        const entityTypeId = await getModelSpecEntityTypeId();

        const [params, imgs, docs] = await Promise.all([
            fetchParametersForSpec(original.id),
            entityTypeId ? fetchDeviceEntityFiles(entityTypeId, original.id, "Image") : Promise.resolve([]),
            entityTypeId ? fetchDeviceEntityFiles(entityTypeId, original.id, "Document") : Promise.resolve([]),
        ]);

        setFormData({
            name: original.name || "",
            deviceTypeId: original.deviceTypeId || null,
            modelCategoryId: original.modelCategoryId || null,
            companyId: original.companyId || null,
            modelNumber: original.modelNumber || "",
            remarks: original.remarks || "",
            parameters: params.map(p => ({
                id: p.id,
                deviceModelId: p.deviceModelId,
                modelCategoryId: p.modelCategoryId,
                categoryName: p.modelCategoryName || getModelCategoryName(p.modelCategoryId),
                parameterName: p.parameterName || "",
                parameterValue: p.parameterValue || "",
                unit: p.unit || "",
                capacity: p.capacity || "",
                processor: p.processor || "",
                ram: p.ram || "",
                storage: p.storage || "",
                remarks: p.remarks || "",
                firmwareVersion: p.firmwareVersion || "",
                protocol: p.protocol || "",
                warrantyDuration: p.warrantyDuration || "",
                endOfLife: p.endOfLife || "",
                intro: p.intro || "",
                uses: p.uses || "",
                feature: p.feature || "",
            })),
        });

        setNewParam({ ...EMPTY_PARAM });
        setPendingImages([]); setPendingDocs([]);
        setExistingImages((imgs || []).map(toSavedImage));
        setExistingDocs((docs || []).map(toSavedDoc));
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim()) { message.error("Name is required"); return; }
        if (!formData.deviceTypeId) { message.error("Device Type is required"); return; }

        setSubmitLoading(true);
        try {
            // ── 1. ModelSpecification — only its own DB fields ────────────────
            const specPayload = {
                name: formData.name.trim(),
                deviceTypeId: formData.deviceTypeId,
                modelCategoryId: formData.modelCategoryId || null,
                companyId: formData.companyId || null,
                modelNumber: formData.modelNumber || "",
                remarks: formData.remarks || "",
            };

            let savedSpecId = editingSpec?.id || null;
            if (editingSpec?.id) {
                await axiosdevice.post(`ModelSpecification/update-modelspecification/${editingSpec.id}`, specPayload);
                savedSpecId = editingSpec.id;
                message.success("Specification updated");
            } else {
                const res = await axiosdevice.post("ModelSpecification/create-modelspecification", specPayload);
                savedSpecId = res?.id ?? res?.data?.id ?? null;
                if (!savedSpecId || typeof savedSpecId === "object") {
                    const fresh = await axiosdevice.get("ModelSpecification/get-all-modelspecification");
                    const arr = Array.isArray(fresh) ? fresh : fresh?.data || [];
                    savedSpecId = arr[arr.length - 1]?.id || null;
                }
                message.success("Specification created");
            }

            // ── 2. ModelParameter — all DB fields ─────────────────────────────
            if (savedSpecId && formData.parameters.length > 0) {
                for (const p of formData.parameters) {
                    try {
                        const paramPayload = {
                            deviceModelId: savedSpecId,
                            modelCategoryId: p.modelCategoryId || null,
                            parameterName: p.parameterName,
                            parameterValue: p.parameterValue,
                            unit: p.unit || "",
                            capacity: p.capacity || "",
                            processor: p.processor || "",
                            ram: p.ram || "",
                            storage: p.storage || "",
                            remarks: p.remarks || "",
                            firmwareVersion: p.firmwareVersion || "",
                            protocol: p.protocol || "",
                            warrantyDuration: p.warrantyDuration || "",
                            endOfLife: p.endOfLife || "",
                            intro: p.intro || "",
                            uses: p.uses || "",
                            feature: p.feature || "",
                        };
                        if (p.id) { await axiosdevice.put(`ModelParameter/update-parameter${p.id}`, paramPayload); }
                        else { await axiosdevice.post("ModelParameter/create-modelparameter", paramPayload); }
                    } catch (err) {
                        console.error("Parameter save failed:", err);
                        message.warning(`Parameter "${p.parameterName}" save failed`);
                    }
                }
            }

            // ── 3. Upload pending images + docs — DEVICE FileStore API ────────
            // Same endpoint family used by DeviceLocationsModal: one call
            // uploads both categories together against EntityType "ModelSpecification".
            const imagesToUpload = pendingImages.filter(img => !img.id && img._file);
            const docsToUpload = pendingDocs.filter(doc => !doc.id && doc._file);

            if (savedSpecId && (imagesToUpload.length > 0 || docsToUpload.length > 0)) {
                const { errors } = await uploadDeviceEntityFiles({
                    entityName: MODEL_SPEC_ENTITY_NAME,
                    entityId: savedSpecId,
                    deviceId: savedSpecId,
                    images: imagesToUpload,
                    docs: docsToUpload,
                    onFileError: (name) => message.warning(`Failed to upload "${name}"`),
                });
                if (errors?.length) {
                    console.warn("[ModelSpecification] Some files failed to upload:", errors);
                }
            }

            closeModal();
            fetchModels(specPageRef.current);
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || err?.message || "Operation failed");
        } finally { setSubmitLoading(false); }
    };

    const handleDelete = async () => {
        if (!specToDelete) return;
        try {
            setLoading(true);
            try { await axiosdevice.post(`ModelSpecification/${specToDelete.id}/soft-delete`); }
            catch { await axiosdevice.post(`ModelSpecification/soft-delete/${specToDelete.id}`); }
            message.success("Specification deleted");
            setShowDeleteModal(false); setSpecToDelete(null);
            const newPage = modalSpecs.length === 1 && specPageRef.current > 1
                ? specPageRef.current - 1 : specPageRef.current;
            specPageRef.current = newPage; setSpecPage(newPage);
            fetchModels(newPage);
        } catch { message.error("Failed to delete specification"); }
        finally { setLoading(false); }
    };

    const handlePreview = async (record, tab = "details") => {
        setActiveTab(tab);
        const base = transformSpec(modalSpecs.find(s => s.id === record.id) || record, lookups);
        setPreviewSpec(base);

        const entityTypeId = await getModelSpecEntityTypeId();

        const [params, imgs, docs] = await Promise.all([
            fetchParametersForSpec(record.id),
            entityTypeId ? fetchDeviceEntityFiles(entityTypeId, record.id, "Image") : Promise.resolve([]),
            entityTypeId ? fetchDeviceEntityFiles(entityTypeId, record.id, "Document") : Promise.resolve([]),
        ]);
        setPreviewSpec(prev => ({
            ...prev,
            parameters: transformParameters(params, getModelCategoryName),
            images: imgs || [], documents: docs || [],
        }));
    };

    const closeModal = () => {
        setShowModal(false); setEditingSpec(null);
        setFormData({ ...EMPTY_FORM });
        setPendingImages([]); setPendingDocs([]);
        setExistingImages([]); setExistingDocs([]);
    };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: 12, overflow: "hidden", boxSizing: "border-box" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        <TableOutlined style={{ marginRight: 8, color: "#1890ff" }} />Model Specification
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Manage device model specifications</Text>
                </div>
                <Space>
                    <Button icon={<AppstoreOutlined />} onClick={() => setShowModelCategoryMaster(true)}>Model Category</Button>
                    <Button icon={<SettingOutlined />} onClick={() => setShowUnitMaster(true)}>Unit Master</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add Specification</Button>
                    <Button onClick={() => setModalOpen(true)}>Import</Button>
                    <Button icon={<ReloadOutlined />} loading={loading}
                        onClick={() => { fetchDropdownData(); fetchModels(specPageRef.current); }}>
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* Stats */}
            <Row gutter={12} style={{ marginBottom: 12, flexShrink: 0 }}>
                {[
                    { label: "Total Specs", value: totalSpecs, color: "#1890ff", icon: <TableOutlined /> },
                    { label: "Active", value: totalSpecs, color: "#52c41a", icon: <CheckCircleOutlined /> },
                    { label: "Total Params", value: totalParameters, color: "#722ed1", icon: <SettingOutlined /> },
                    { label: "Device Types", value: deviceTypes.length, color: "#fa8c16", icon: <AppstoreOutlined /> },
                ].map(s => (
                    <Col span={6} key={s.label}>
                        <Card size="small" style={{ borderTop: `3px solid ${s.color}` }}>
                            <Space>
                                <span style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{s.label}</Text>
                                    <div style={{ fontSize: 20, fontWeight: "bold", color: s.color }}>{s.value}</div>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Filters */}
            <div style={{ background: "white", padding: "8px 12px", borderRadius: 6, marginBottom: 12, flexShrink: 0 }}>
                <Row gutter={12} align="middle">
                    <Col span={8}>
                        <Input placeholder="Search by name, device type, company..."
                            prefix={<span>🔍</span>} value={searchText} allowClear size="small"
                            onChange={e => setSearchText(e.target.value)} />
                    </Col>
                    <Col span={5}>
                        <Select value={deviceTypeFilter} onChange={v => setDeviceTypeFilter(v)}
                            style={{ width: "100%" }} size="small">
                            <Option value="all">All Device Types</Option>
                            {deviceTypes.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                        </Select>
                    </Col>
                    <Col span={5}>
                        <Select value={companyFilter} onChange={v => setCompanyFilter(v)}
                            style={{ width: "100%" }} size="small">
                            <Option value="all">All Companies</Option>
                            {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Showing {modalSpecs.length} of {specTotal}
                        </Text>
                    </Col>
                </Row>
            </div>

            {/* Table */}
            <div style={{ flex: 1, background: "white", borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ flex: 1, overflow: "auto" }}>
                    <ModelSpecTable
                        dataSource={modalSpecs} loading={loading}
                        onPreview={handlePreview} onDownload={downloadDatasheet}
                        onEdit={openEditModal}
                        onDelete={(record) => { setSpecToDelete(record); setShowDeleteModal(true); }}
                    />
                </div>
                <PaginationBar page={specPage} pageSize={PAGE_SIZE} total={specTotal} onChange={handleSpecPageChange} />
            </div>


            <ModelSpecModal
                open={showModal} onClose={closeModal} onSubmit={handleSubmit}
                editingSpec={editingSpec} submitLoading={submitLoading}
                formData={formData} setFormData={setFormData}
                newParam={newParam} setNewParam={setNewParam}
                pendingImages={pendingImages} setPendingImages={setPendingImages}
                pendingDocs={pendingDocs} setPendingDocs={setPendingDocs}
                existingImages={existingImages} setExistingImages={setExistingImages}
                existingDocs={existingDocs} setExistingDocs={setExistingDocs}
                onDeleteExistingImage={() => { }} onDeleteExistingDoc={() => { }}
                deviceTypes={deviceTypes}
                deviceCategories={deviceCategories}
                modelCategories={modelCategories}
                companies={companies}
                units={units}
                onOpenUnitMaster={() => setShowUnitMaster(true)}
                onOpenModelCategoryMaster={() => setShowModelCategoryMaster(true)}
                onImagePreview={setShowImgPreview}
                // ── passed through so ModelSpecModal can wire DeviceImagesSection /
                //    DeviceDocumentsSection directly against the Device FileStore
                //    API for THIS spec once it has an id (same pattern as
                //    DeviceLocationsModal → LocationFilesTab).
                entityName={MODEL_SPEC_ENTITY_NAME}
                entityId={editingSpec?.id || null}
            />

            <ModelSpecPreview
                spec={previewSpec} activeTab={activeTab}
                onTabChange={setActiveTab} onClose={() => setPreviewSpec(null)}
            />

            <Modal title="Delete Specification" open={showDeleteModal}
                onCancel={() => { setShowDeleteModal(false); setSpecToDelete(null); }}
                footer={[
                    <Button key="cancel" onClick={() => { setShowDeleteModal(false); setSpecToDelete(null); }}>Cancel</Button>,
                    <Button key="delete" danger loading={loading} onClick={handleDelete}>Delete</Button>,
                ]}
            >
                <div style={{ textAlign: "center" }}>
                    <ExclamationCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
                    <p>Delete <strong>"{specToDelete?.name}"</strong>?</p>
                    <Text type="secondary">This action cannot be undone.</Text>
                </div>
            </Modal>

            <Modal open={!!showImgPreview} footer={null} onCancel={() => setShowImgPreview(null)} width="auto" centered>
                {showImgPreview && (
                    <img src={showImgPreview} alt="Preview"
                        style={{ maxWidth: "90vw", maxHeight: "80vh", display: "block" }} />
                )}
            </Modal>

            <UnitMasterModal open={showUnitMaster} onClose={() => setShowUnitMaster(false)}
                onUnitsUpdated={data => setUnits(data)} />
            <ModelCategoryModal open={showModelCategoryMaster}
                onClose={() => setShowModelCategoryMaster(false)}
                onCategoriesUpdated={data => setModelCategories(data)} />
            <ModelFileSpecs open={modalOpen} onCancel={() => setModalOpen(false)}
                onImportSuccess={() => fetchModels()} />
        </div>
    );
}