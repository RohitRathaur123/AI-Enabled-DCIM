// components/DeviceMaster.jsx — FIXED OVERFLOW VERSION
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    Table, Tag, Row, Col, Typography, Space, Button, Select, Input,
    Divider, Tooltip, Badge, Modal, Form, message, Pagination
} from "antd";
import {
    LaptopOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
    ReloadOutlined, SearchOutlined, ExclamationCircleOutlined,
    AppstoreOutlined, DatabaseOutlined, FileTextOutlined, ImportOutlined,
    ClearOutlined, CheckCircleOutlined,
    DownloadOutlined
} from "@ant-design/icons";

import SuccessModal from "../entity/popUp";
import AuditWidget from "../entity/livetoaster";
import AuditWidget2 from "../entity/notify";
import ImportWithFieldMapper from "./fieldselection";
import ExcelExport from "../entity/excelexport";

import axiosInstance, { axiosdevice } from "../../config";
import GenericImportModal from "./GenericImportFIle";

const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

// ── Normalize form payload ─────────────────────────────────────────────────
const normalizeDeviceForm = (values) => ({
    deviceTypeId: values.deviceTypeId ? (values.deviceTypeId) : null,
    deviceCategoryId: values.deviceCategoryId ? (values.deviceCategoryId) : null,
    companyId: values.companyId ? (values.companyId) : null,
    modelSpecificationId: values.modelSpecificationId ? (values.modelSpecificationId) : null,
    deviceShortName: values.deviceShortName?.trim() ?? "",
    deviceLongName: values.deviceLongName?.trim() ?? "",
    remarks: values.remarks?.trim() ?? "",
    dataFormat: values.dataFormat?.trim() ?? "",
});

const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
};

// ── Extract paginated response ─────────────────────────────────────────────
const extractPaginatedResponse = (res) => {
    const body1 = res?.data;
    if (body1 && typeof body1 === "object" && "totalRecords" in body1) {
        return {
            rows: Array.isArray(body1.data) ? body1.data : [],
            total: Number(body1.totalRecords) || 0,
        };
    }
    if (res && typeof res === "object" && "totalRecords" in res) {
        return {
            rows: Array.isArray(res.data) ? res.data : [],
            total: Number(res.totalRecords) || 0,
        };
    }
    if (Array.isArray(res)) {
        return { rows: res, total: res.length };
    }
    if (Array.isArray(res?.data)) {
        return { rows: res.data, total: res.data.length };
    }
    console.warn("[extractPaginatedResponse] unrecognised shape:", res);
    return { rows: [], total: 0 };
};

// ── Inline PaginationBar ───────────────────────────────────────────────────
function PaginationBar({ page, pageSize, total, onChange }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "8px 12px",
            borderTop: "1px solid #f0f0f0",
            background: "#fafafa",
            flexShrink: 0,
            borderRadius: "0 0 6px 6px",
            flexWrap: "wrap",
            gap: "8px"
        }}>
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showTotal={(t) => <span style={{ fontSize: 12, color: '#666' }}>Total <strong>{t}</strong></span>}
                onChange={onChange}
                showSizeChanger={false}
            />
        </div>
    );
}


const BACKEND_FIELDS = [
    { key: "oemName", label: "OEM / Company", required: false, color: "blue", hint: "e.g. HP, Dell, Cisco" },
    { key: "category", label: "Device Category", required: false, color: "geekblue", hint: "e.g. Laptop, Printer, Router" },
    { key: "modelName", label: "Model Name", required: false, color: "orange", hint: "e.g. LaserJet Pro M404n" },
    { key: "deviceType", label: "Device Type", required: false, color: "purple", hint: "e.g. Printer, Camera, Switch" },
];

// ── Main Component ─────────────────────────────────────────────────────────
const DeviceMaster = () => {
    // ── State ──────────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [modelSpecs, setModelSpecs] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState("add");

    const [searchText, setSearchText] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [sortedInfo, setSortedInfo] = useState({ columnKey: null, order: null });


    const [showExportModal, setShowExportModal] = useState(false)
    const currentPageRef = useRef(1);
    const searchRef = useRef("");
    const categoryRef = useRef("");
    const typeRef = useRef("");
    const companyRef = useRef("");
    const searchDebounceRef = useRef(null);

    const [form] = Form.useForm();

    const [devicemasterfile, setDevicemasterfile] = useState([]);
    const fetchdevicemasterfile = async () => {
        try {
            const res = await axiosdevice.get('/DeviceMaster/get-all-device');
            setDevicemasterfile(res?.data);
        } catch (error) { }
    };

    // ── Lookup helpers ─────────────────────────────────────────────────────
    const getCompanyName = (id) => companies.find(c => c.id === id)?.companyName ?? null;
    const getModelSpecName = (id) => modelSpecs.find(m => m.id === id)?.name ?? null;

    // ── Client-side sort only ─────────────────────────────────────────────
    const sortedData = useMemo(() => {
        if (!sortedInfo.columnKey || !sortedInfo.order) return devices;
        return [...devices].sort((a, b) => {
            let valA = "", valB = "";
            switch (sortedInfo.columnKey) {
                case "id":
                    return sortedInfo.order === "ascend" ? a.id - b.id : b.id - a.id;
                case "deviceTypeId":
                    valA = types.find(x => x.id === a.deviceTypeId)?.name ?? "";
                    valB = types.find(x => x.id === b.deviceTypeId)?.name ?? "";
                    break;
                case "deviceCategoryId":
                    valA = categories.find(x => x.id === a.deviceCategoryId)?.name ?? "";
                    valB = categories.find(x => x.id === b.deviceCategoryId)?.name ?? "";
                    break;
                case "companyId":
                    valA = getCompanyName(a.companyId) ?? "";
                    valB = getCompanyName(b.companyId) ?? "";
                    break;
                case "modelSpecificationId":
                    valA = getModelSpecName(a.modelSpecificationId) ?? "";
                    valB = getModelSpecName(b.modelSpecificationId) ?? "";
                    break;
                case "deviceShortName":
                    valA = a.deviceShortName ?? "";
                    valB = b.deviceShortName ?? "";
                    break;
                case "deviceLongName":
                    valA = a.deviceLongName ?? "";
                    valB = b.deviceLongName ?? "";
                    break;
                case "dataFormat":
                    valA = a.dataFormat ?? "";
                    valB = b.dataFormat ?? "";
                    break;
                default: return 0;
            }
            const cmp = String(valA).localeCompare(String(valB));
            return sortedInfo.order === "ascend" ? cmp : -cmp;
        });
    }, [devices, sortedInfo, types, categories, companies, modelSpecs]);

    // ── Fetch devices ──────────────────────────────────────────────────────
    const fetchDevices = useCallback(async (targetPage) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchRef.current;
        const category = categoryRef.current;
        const type = typeRef.current;
        const company = companyRef.current;

        try {
            setLoading(true);
            const res = await axiosdevice.get("/DeviceMaster/get-all-device", {
                params: {
                    Page: pg,
                    PageSize: PAGE_SIZE,
                    IsPaginated: true,
                    Search: search || undefined,
                    DeviceCategoryId: category || undefined,
                    DeviceTypeId: type || undefined,
                    CompanyId: company || undefined,
                }
            });
            const { rows, total } = extractPaginatedResponse(res);
            setDevices(rows);
            setTotalRecords(total);
        } catch (err) {
            message.error("Failed to fetch devices");
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Reset to page 1 and fetch ─────────────────────────────────────────
    const resetAndFetch = useCallback(() => {
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchDevices(1);
    }, [fetchDevices]);

    // ── Search input handler ──────────────────────────────────────────────
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchText(val);
        searchRef.current = val;

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            resetAndFetch();
        }, 400);
    };

    const handleSearchClear = () => {
        setSearchText("");
        searchRef.current = "";
        resetAndFetch();
    };

    // ── Dropdown filter handlers ──────────────────────────────────────────
    const handleCategoryChange = (val) => {
        setSelectedCategory(val);
        categoryRef.current = val;
        resetAndFetch();
    };

    const handleTypeChange = (val) => {
        setSelectedType(val);
        typeRef.current = val;
        resetAndFetch();
    };

    const handleCompanyChange = (val) => {
        setSelectedCompany(val);
        companyRef.current = val;
        resetAndFetch();
    };

    const handlePageChange = (newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchDevices(newPage);
    };

    const clearAllFilters = () => {
        setSearchText("");
        setSelectedCompany("");
        setSelectedCategory("");
        setSelectedType("");
        searchRef.current = "";
        categoryRef.current = "";
        typeRef.current = "";
        companyRef.current = "";
        resetAndFetch();
    };

    // ── On mount ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetchDevices(1);
        fetchTypes();
        fetchCategories();
        fetchCompanies();
        fetchModelSpecs();
        fetchdevicemasterfile();
    }, []);

    // ── Lookup fetchers ───────────────────────────────────────────────────
    const fetchTypes = async () => {
        try {
            setTypes(toArray(await axiosdevice.get("DeviceType/get-all-devicetype")));
        } catch {
            message.error("Failed to fetch device types");
        }
    };

    const fetchCategories = async () => {
        try {
            setCategories(toArray(await axiosdevice.get("DeviceCategory/get-all-category")));
        } catch {
            message.error("Failed to fetch categories");
        }
    };

    const fetchModelSpecs = async () => {
        try {
            setModelSpecs(toArray(await axiosdevice.get("ModelSpecification/get-all-modelspecification")));
        } catch {
            message.error("Failed to fetch model specifications");
        }
    };

    const fetchCompanies = async () => {
        try {
            const raw = toArray(await axiosInstance.get("Company/get-all-company"));
            const flat = raw.map(item => ({
                id: item?.company?.id ?? item?.id,
                companyName: item?.company?.companyName ?? item?.companyName ?? item?.name ?? "",
            })).filter(c => c.id && c.companyName);
            setCompanies(flat);
        } catch {
            message.error("Failed to fetch companies");
        }
    };

    const fetchAll = () => {
        fetchDevices(currentPageRef.current);
        fetchTypes();
        fetchCategories();
        fetchCompanies();
        fetchModelSpecs();
    };

    // ── CRUD ──────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const payload = normalizeDeviceForm(values);
            if (editingItem) {
                await axiosdevice.post(`/DeviceMaster/update-device/${editingItem.id}`, payload);
                setSuccessType("edit");
            } else {
                await axiosdevice.post("/DeviceMaster/create-device", payload);
                setSuccessType("add");
            }
            await fetchDevices(currentPageRef.current);
            closeModal();
            setSuccessVisible(true);
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || "Failed to save device");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setSubmitting(true);
        try {
            await axiosdevice.delete(`/DeviceMaster/soft-delete/${itemToDelete.id}`);
            message.success("Device deleted successfully");
            setShowDeleteModal(false);
            setItemToDelete(null);

            const newPage =
                devices.length === 1 && currentPageRef.current > 1
                    ? currentPageRef.current - 1
                    : currentPageRef.current;

            currentPageRef.current = newPage;
            if (newPage !== currentPage) {
                setCurrentPage(newPage);
            } else {
                fetchDevices(newPage);
            }
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to delete device");
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        form.resetFields();
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingItem(record);
        form.setFieldsValue({
            deviceTypeId: record.deviceTypeId ?? null,
            deviceCategoryId: record.deviceCategoryId ?? null,
            companyId: record.companyId ?? null,
            modelSpecificationId: record.modelSpecificationId ?? null,
            deviceShortName: record.deviceShortName ?? "",
            deviceLongName: record.deviceLongName ?? "",
            remarks: record.remarks ?? "",
            dataFormat: record.dataFormat ?? "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        form.resetFields();
    };



    // ── Stat Card ─────────────────────────────────────────────────────────
    const StatCard = ({ label, value, color, icon }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: 6,
            padding: '8px 12px',
            borderTop: `3px solid ${color}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%'
        }}>
            <span style={{ fontSize: 20, color, flexShrink: 0 }}>{icon}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.3, whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
            </div>
        </div>
    );

    // ── Columns ───────────────────────────────────────────────────────────
    const tagStyle = {
        fontSize: 11,
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-block",
        borderRadius: "4px",
        padding: "2px 8px"
    };

    const columns = [
        {
            title: "#",
            key: "sno",
            width: 50,
            render: (_, __, index) => <Text style={{ fontSize: 12 }}>{index + 1}</Text>,
            sorter: (a, b) => a.id - b.id,
            defaultSortOrder: 'ascend',
        },
        {
            title: "Device Type",
            dataIndex: "deviceTypeId",
            key: "deviceTypeId",
            width: 130,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "deviceTypeId" ? sortedInfo.order : null,
            render: id => {
                const t = types.find(x => x.id === id);
                return t ? <Tag color="purple" style={tagStyle}>{t.name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: "Category",
            dataIndex: "deviceCategoryId",
            key: "deviceCategoryId",
            width: 130,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "deviceCategoryId" ? sortedInfo.order : null,
            render: id => {
                const c = categories.find(x => x.id === id);
                return c ? <Tag color="geekblue" style={tagStyle}>{c.name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: "Company",
            dataIndex: "companyId",
            key: "companyId",
            width: 140,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "companyId" ? sortedInfo.order : null,
            render: id => {
                const name = getCompanyName(id);
                return name ? <Tag color="blue" style={tagStyle}>{name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: "Model Spec",
            dataIndex: "modelSpecificationId",
            key: "modelSpecificationId",
            width: 140,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "modelSpecificationId" ? sortedInfo.order : null,
            render: id => {
                const name = getModelSpecName(id);
                return name ? <Tag color="orange" icon={<FileTextOutlined />} style={tagStyle}>{name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: "Short Name",
            dataIndex: "deviceShortName",
            key: "deviceShortName",
            width: 130,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "deviceShortName" ? sortedInfo.order : null,
            render: text => <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: text }}>{text || "-"}</Text>,
        },
        {
            title: "Long Name",
            dataIndex: "deviceLongName",
            key: "deviceLongName",
            width: 160,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "deviceLongName" ? sortedInfo.order : null,
            render: text => <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: text }}>{text || "-"}</Text>,
        },
        {
            title: "Format",
            dataIndex: "dataFormat",
            key: "dataFormat",
            width: 110,
            sorter: true,
            ellipsis: true,
            sortOrder: sortedInfo.columnKey === "dataFormat" ? sortedInfo.order : null,
            render: text => text
                ? <Tag color="cyan" style={tagStyle}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 80,
            fixed: "right",
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => openEditModal(record)}
                            style={{ padding: '0 4px' }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => { setItemToDelete(record); setShowDeleteModal(true); }}
                            style={{ padding: '0 4px' }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    ////steppreview


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f0f2f5",
            padding: "8px 12px",
            boxSizing: "border-box",
            overflow: "hidden",
            maxWidth: "100%",
        }}>
            {/* ── HEADER ── */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
                flexShrink: 0,
                flexWrap: "wrap",
                gap: 8
            }}>
                <div style={{ minWidth: 0 }}>
                    <Title level={4} style={{ margin: 0, lineHeight: 1.3, fontSize: 18 }}>
                        <LaptopOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        Device Master
                    </Title>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Manage device types, categories, and configurations
                    </Text>
                </div>
                <Space wrap size="small">
                    <Button
                        icon={<ImportOutlined />}
                        size="small"
                        onClick={() => setShowImportModal(true)}
                    >
                        Import
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={openCreateModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                    >
                        Add Device
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/DeviceMaster/export"
                        fileNamePrefix="DeviceMaster"
                    />
                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            size="small"
                            onClick={fetchAll}
                            loading={loading}
                        />
                    </Tooltip>
                </Space>
            </div>

            {/* ── STATS ── */}
            <Row gutter={[8, 8]} style={{ marginBottom: 8, flexShrink: 0 }}>
                <Col xs={12} sm={6} md={6} lg={6} xl={6}>
                    <StatCard
                        label="Total Devices"
                        value={totalRecords}
                        color="#1890ff"
                        icon={<LaptopOutlined />}
                    />
                </Col>
                <Col xs={12} sm={6} md={6} lg={6} xl={6}>
                    <StatCard
                        label="Device Types"
                        value={new Set(devices.map(d => d.deviceTypeId).filter(Boolean)).size}
                        color="#722ed1"
                        icon={<AppstoreOutlined />}
                    />
                </Col>
                <Col xs={12} sm={6} md={6} lg={6} xl={6}>
                    <StatCard
                        label="Categories"
                        value={new Set(devices.map(d => d.deviceCategoryId).filter(Boolean)).size}
                        color="#13c2c2"
                        icon={<DatabaseOutlined />}
                    />
                </Col>
                <Col xs={12} sm={6} md={6} lg={6} xl={6}>
                    <StatCard
                        label="Companies"
                        value={new Set(devices.map(d => d.companyId).filter(Boolean)).size}
                        color="#fa8c16"
                        icon={<CheckCircleOutlined />}
                    />
                </Col>
            </Row>


            {/* ── FILTERS ── */}
            <div style={{
                backgroundColor: "white",
                borderRadius: 6,
                padding: "8px 10px",
                marginBottom: 8,
                flexShrink: 0,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden"
            }}>
                <div style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    alignItems: "center",
                    gap: 8,
                    minWidth: "fit-content"
                }}>
                    <Input
                        placeholder="Search..."
                        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                        value={searchText}
                        onChange={handleSearchChange}
                        onClear={handleSearchClear}
                        allowClear
                        size="small"
                        style={{ width: 200, flexShrink: 0 }}
                    />

                    <Select
                        value={selectedCompany}
                        onChange={handleCompanyChange}
                        style={{ width: 150, flexShrink: 0 }}
                        placeholder="Company"
                        size="small"
                        allowClear
                    >
                        <Option value="">All Companies</Option>
                        {companies.map(c => <Option key={c.id} value={c.id}>{c.companyName}</Option>)}
                    </Select>

                    <Select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        style={{ width: 150, flexShrink: 0 }}
                        placeholder="Category"
                        size="small"
                        allowClear
                    >
                        <Option value="">All Categories</Option>
                        {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>

                    <Select
                        value={selectedType}
                        onChange={handleTypeChange}
                        style={{ width: 150, flexShrink: 0 }}
                        placeholder="Type"
                        size="small"
                        allowClear
                    >
                        <Option value="">All Types</Option>
                        {types.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                    </Select>

                    <Button
                        icon={<ClearOutlined />}
                        onClick={clearAllFilters}
                        size="small"
                        style={{ flexShrink: 0 }}
                    >
                        Clear
                    </Button>

                    <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                        <AuditWidget tableName="DeviceMaster" />
                    </div>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 6,
                border: "1px solid #f0f0f0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                width: "100%"
            }}>
                <div style={{
                    padding: "6px 12px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexShrink: 0,
                    backgroundColor: "#fafafa",
                    flexWrap: "wrap",
                    gap: 4
                }}>
                    <Text strong style={{ fontSize: 13 }}>Device List</Text>
                    <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: "#1890ff" }} />
                </div>

                <div style={{
                    flex: 1,
                    overflow: "auto",
                    minHeight: 0,
                    width: "100%"
                }}>
                    <Table
                        columns={columns}
                        dataSource={sortedData}
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1000 }}
                        size="small"
                        onChange={(_, __, sorter) => {
                            if (sorter && sorter.columnKey && sorter.order) {
                                setSortedInfo(sorter);
                            } else {
                                setSortedInfo({ columnKey: null, order: null });
                            }
                        }}
                        locale={{
                            emptyText: <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No devices found</div>
                        }}
                    />
                </div>

                <PaginationBar
                    page={currentPage}
                    pageSize={PAGE_SIZE}
                    total={totalRecords}
                    onChange={handlePageChange}
                />
            </div>


            {/* ── MODALS ── */}
            <Modal
                title={
                    <Space>
                        <LaptopOutlined style={{ color: "#1890ff" }} />
                        <span>{editingItem ? "Edit Device" : "Add New Device"}</span>
                    </Space>
                }
                open={showModal}
                onCancel={closeModal}
                footer={null}
                width={680}
                destroyOnClose
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 8 }}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="deviceCategoryId"
                                label="Category"
                                rules={[{ required: true, message: "Category is required" }]}
                            >
                                <Select placeholder="Select category" showSearch optionFilterProp="children" size="middle">
                                    {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="deviceTypeId"
                                label="Device Type"
                                rules={[{ required: true, message: "Device Type is required" }]}
                            >
                                <Select placeholder="Select device type" showSearch optionFilterProp="children" size="middle">
                                    {types.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="companyId"
                                label="Company"
                                rules={[{ required: true, message: "Company is required" }]}
                            >
                                <Select placeholder="Select company" showSearch optionFilterProp="children" size="middle">
                                    {companies.map(c => <Option key={c.id} value={c.id}>{c.companyName}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="modelSpecificationId"
                                label="Model Specification"
                            >
                                <Select placeholder="Select model" showSearch allowClear optionFilterProp="children" size="middle">
                                    {modelSpecs.map(m => (
                                        <Option key={m.id} value={m.id}>
                                            {m.name}
                                            {m.modelNumber && <span style={{ color: "#999", fontSize: 11, marginLeft: 6 }}>({m.modelNumber})</span>}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="dataFormat"
                                label="Data Format"
                                rules={[{ required: true, message: "Data format is required" }]}
                            >
                                <Input placeholder="e.g., SNMP, MQTT, HTTP" size="middle" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="deviceShortName"
                                label="Short Name"
                                rules={[{ required: true, message: "Short name is required" }]}
                            >
                                <Input placeholder="Short device name" size="middle" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="deviceLongName"
                                label="Long Name"
                                rules={[{ required: true, message: "Long name is required" }]}
                            >
                                <Input placeholder="Full device name" size="middle" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="remarks" label="Remarks">
                                <Input.TextArea rows={3} placeholder="Optional remarks..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: "8px 0 12px" }} />
                    <Row justify="end">
                        <Space>
                            <Button onClick={closeModal}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {editingItem ? "Update" : "Create"}
                            </Button>
                        </Space>
                    </Row>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Confirm Delete"
                open={showDeleteModal}
                onCancel={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                footer={null}
                width={420}
                centered
            >
                <div style={{ textAlign: "center" }}>
                    <ExclamationCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
                    <Title level={5}>Are you sure?</Title>
                    <Text>Device <Text strong>"{itemToDelete?.deviceShortName}"</Text> will be permanently deleted.</Text>
                    <Divider style={{ margin: "16px 0" }} />
                    <Space>
                        <Button onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}>
                            Cancel
                        </Button>
                        <Button danger loading={submitting} onClick={handleDelete}>
                            Delete
                        </Button>
                    </Space>
                </div>
            </Modal>

            {/* <ImportWithFieldMapper
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchAll}
            /> */}

            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchAll}
                entityName="DeviceMaster"
                apiEndpoint="/DeviceMaster/import"
                backendFields={BACKEND_FIELDS}
            />
            <SuccessModal
                visible={successVisible}
                type={successType}
                onClose={() => setSuccessVisible(false)}
            />
            <AuditWidget2 tableName="DeviceMaster" />
        </div>
    );
};

export default DeviceMaster;