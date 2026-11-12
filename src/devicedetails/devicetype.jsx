
// DeviceType.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Typography, Row, Col, Table, Space, Button,
    Input, message, Tag, Popover, Badge, Tooltip, Select, Pagination,
} from 'antd';
import {
    ApiOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, EditOutlined, DeleteOutlined,
    CloseOutlined, CheckCircleOutlined, AppstoreOutlined, LinkOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import {
    FaServer, FaMicrochip, FaNetworkWired, FaDatabase,
    FaCloud, FaShieldAlt, FaLock, FaVideo, FaBell,
    FaCogs, FaCube, FaCubes, FaSitemap, FaWifi,
    FaThermometerHalf, FaTachometerAlt, FaHdd,
} from 'react-icons/fa';
import { axiosdevice } from "../../config";
import AuditWidget from '../entity/livetoaster';
import AuditWidget2 from '../entity/notify';
import { SuccessModal } from '../entity/popUp';
import ExcelExport from '../entity/excelexport';
import ImportDeviceTypeModal from './typefile';
import DeviceTypeModelsModal from './devicetypemodelsmodel';
import DeviceTypeAssignModal from './deviceassociationmodel';
// import DeviceTypeDevicesModal from './devicetypedevicemodel';
import DeviceTypeDevicesModal from "./devicetypedevicemodel"
import GenericImportModal from './GenericImportFIle';


const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

// ── Normalize ─────────────────────────────────────────────────────────────────
const normalize = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID ?? obj.deviceTypeId ?? obj.DeviceTypeId,
    name: obj.name ?? obj.Name,
    deviceCategoryId: obj.deviceCategoryId ?? obj.DeviceCategoryId ?? obj.categoryId ?? obj.CategoryId,
    categoryName: obj.categoryName ?? obj.CategoryName ?? obj.category?.name ?? '',
    protocol: obj.protocol ?? obj.Protocol ?? '',
    supportedFeature: obj.supportedFeature ?? obj.SupportedFeature ?? '',
    remarks: obj.remarks ?? obj.Remarks ?? '',
    isActive: obj.isActive ?? obj.IsActive ?? true,
    // ✅ Icon fields ko explicitly map karo (fallback ke saath)
    icon: obj.icon ?? obj.Icon ?? 'FaServer',
    iconColor: obj.iconColor ?? obj.IconColor ?? '#1890ff',
});

const normalizeCategory = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID ?? obj.deviceCategoryId ?? obj.DeviceCategoryId,
    name: obj.name ?? obj.Name,
    isActive: obj.isActive ?? obj.IsActive ?? obj.status === true ?? true,
});

// ── Response extractors ───────────────────────────────────────────────────────
const extractPaginated = (response) => {
    const body1 = response?.data;
    if (body1 && typeof body1 === 'object' && 'totalRecords' in body1)
        return { rows: Array.isArray(body1.data) ? body1.data : [], total: Number(body1.totalRecords) || 0 };
    if (response && typeof response === 'object' && 'totalRecords' in response)
        return { rows: Array.isArray(response.data) ? response.data : [], total: Number(response.totalRecords) || 0 };
    if (Array.isArray(response))
        return { rows: response, total: response.length };
    if (Array.isArray(response?.data))
        return { rows: response.data, total: response.data.length };
    console.warn('[DeviceType] unrecognised response shape:', response);
    return { rows: [], total: 0 };
};

const extractList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

//////////////////////

const BACKEND_FIELDS = [
    { key: "deviceTypeName", label: "Device Type Name", required: true, color: "red", hint: "e.g. Printer, Camera, Router" },
    { key: "deviceCategoryName", label: "Device Category Name", required: false, color: "blue", hint: "e.g. Hardware, Security, Network" },
    { key: "protocol", label: "Protocol", required: false, color: "purple", hint: "e.g. TCP/IP, SNMP, RTSP, USB" },
    { key: "supportedFeature", label: "Supported Feature", required: false, color: "cyan", hint: "e.g. Print, Scan, Recording" },
    { key: "remarks", label: "Remarks", required: false, color: "default", hint: "Any additional notes" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const availableIcons = [
    { name: 'FaServer', component: <FaServer />, color: '#1890ff', label: 'Server' },
    { name: 'FaMicrochip', component: <FaMicrochip />, color: '#722ed1', label: 'Processor' },
    { name: 'FaNetworkWired', component: <FaNetworkWired />, color: '#13c2c2', label: 'Switch' },
    { name: 'FaDatabase', component: <FaDatabase />, color: '#52c41a', label: 'Storage' },
    { name: 'FaCloud', component: <FaCloud />, color: '#fa8c16', label: 'Cloud' },
    { name: 'FaShieldAlt', component: <FaShieldAlt />, color: '#722ed1', label: 'Firewall' },
    { name: 'FaLock', component: <FaLock />, color: '#ff4d4f', label: 'Security' },
    { name: 'FaVideo', component: <FaVideo />, color: '#13c2c2', label: 'Camera' },
    { name: 'FaBell', component: <FaBell />, color: '#faad14', label: 'Alarm' },
    { name: 'FaCogs', component: <FaCogs />, color: '#722ed1', label: 'Mechanical' },
    { name: 'FaCube', component: <FaCube />, color: '#13c2c2', label: 'Module' },
    { name: 'FaCubes', component: <FaCubes />, color: '#fa8c16', label: 'Rack' },
    { name: 'FaSitemap', component: <FaSitemap />, color: '#1890ff', label: 'Router' },
    { name: 'FaWifi', component: <FaWifi />, color: '#52c41a', label: 'Wireless' },
    { name: 'FaThermometerHalf', component: <FaThermometerHalf />, color: '#1890ff', label: 'Sensor' },
    { name: 'FaTachometerAlt', component: <FaTachometerAlt />, color: '#52c41a', label: 'Meter' },
    { name: 'FaHdd', component: <FaHdd />, color: '#1890ff', label: 'Drive' },
];

const getIcon = (iconName, color = '#1890ff', size = 18) => {
    const icon = availableIcons.find(i => i.name === iconName);
    const el = icon ? icon.component : <FaServer />;
    return React.cloneElement(el, { style: { color, fontSize: size } });
};

const protocolOptions = [
    'SNMP', 'Modbus', 'BACnet', 'HTTP', 'HTTPS', 'SSH',
    'Telnet', 'Redfish', 'IPMI', 'MQTT', 'CoAP', 'LoRaWAN', 'Zigbee', 'Other',
];
const featureOptions = [
    'Monitoring', 'Configuration', 'Firmware Update', 'Alerting', 'Remote Control',
    'Data Collection', 'Analytics', 'Automation', 'Inventory Management',
    'Power Management', 'Cooling Management', 'Security Management',
    'Reporting', 'Backup', 'Restore',
];

// ─────────────────────────────────────────────────────────────────────────────
function DeviceTypePage() {

    // ── Pagination + Search state ─────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const currentPageRef = useRef(1);

    // ── FIX: searchText ab server ko jayega, client-side filter nahi ──────
    const [searchText, setSearchText] = useState('');
    const searchTimerRef = useRef(null);   // debounce timer

    // ── Data state ────────────────────────────────────────────────────────
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedIcon, setSelectedIcon] = useState('FaServer');
    // const [sortedInfo,      setSortedInfo]      = useState({ columnKey: 'id', order: 'ascend' });
    const [sortedInfo, setSortedInfo] = useState({ columnKey: null, order: null });

    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState('add');

    const emptyForm = { name: '', deviceCategoryId: null, protocol: null, supportedFeature: null, remarks: '', isActive: true };
    const emptyErr = { name: '', deviceCategoryId: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErr);

    const [devicetypefiel, setdevicetypefile] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    //////////////////////
    const [showModelsModal, setShowModelsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [activeDeviceType, setActiveDeviceType] = useState(null);



    ////////////////////////

    const [showExportModal, setShowExportModal] = useState(false)
    //////////////////////////////
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [devicesDeviceType, setDevicesDeviceType] = useState(null);

    const sortedData = useMemo(() => {
        if (!sortedInfo.columnKey || !sortedInfo.order) return deviceTypes;

        return [...deviceTypes].sort((a, b) => {
            let valA = "", valB = "";

            switch (sortedInfo.columnKey) {
                case "id":
                    return sortedInfo.order === "ascend" ? a.id - b.id : b.id - a.id;

                case "name":
                    valA = a.name ?? "";
                    valB = b.name ?? "";
                    break;

                case "category":
                    valA = categories.find(c => c.id === a.deviceCategoryId)?.name ?? "";
                    valB = categories.find(c => c.id === b.deviceCategoryId)?.name ?? "";
                    break;

                case "protocol":
                    valA = a.protocol ?? "";
                    valB = b.protocol ?? "";
                    break;

                case "supportedFeature":
                    valA = a.supportedFeature ?? "";
                    valB = b.supportedFeature ?? "";
                    break;

                default: return 0;
            }

            const cmp = String(valA).localeCompare(String(valB));
            return sortedInfo.order === "ascend" ? cmp : -cmp;
        });
    }, [deviceTypes, sortedInfo, categories]);

    const fetchdevicefile = async () => {
        try {
            const res = await axiosdevice.get('/DeviceType/get-all-devicetype');
            setdevicetypefile(Array.isArray(res) ? res : res?.data);
        } catch (error) {
            console.log('fetchdevicefile error:', error);
        }
    };

    // ── FIX: fetchDeviceTypes — Search param bhi bhejo ───────────────────
    // Page reset karega jab search change ho
    const fetchDeviceTypes = useCallback(async (targetPage, searchQuery) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchQuery ?? searchText;

        setLoading(true);
        try {
            const params = {
                Page: pg,
                PageSize: PAGE_SIZE,
                IsPaginated: true,
            };

            // Search param sirf tab bhejo jab value ho — empty string mat bhejo
            if (search && search.trim()) {
                params.Search = search.trim();
            }

            const response = await axiosdevice.get('/DeviceType/get-all-devicetype', { params });
            const { rows, total } = extractPaginated(response);

            console.log('[DeviceType] page:', pg, 'search:', search || '(none)', 'rows:', rows.length, 'total:', total);

            setDeviceTypes(rows.map(normalize));
            setTotalRecords(total);
        } catch (err) {
            console.error('fetchDeviceTypes:', err);
            message.error('Failed to fetch device types');
        } finally {
            setLoading(false);
        }
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── fetchCategories ───────────────────────────────────────────────────
    const fetchCategories = async () => {
        try {
            const response = await axiosdevice.get('/DeviceCategory/get-all-category');
            const rows = extractList(response);
            setCategories(rows.map(normalizeCategory).filter(c => c.isActive));
        } catch (err) {
            console.error('fetchCategories:', err);
            message.error('Failed to fetch categories');
        }
    };

    // ── FIX: Search input handler — debounced 400ms + page reset ─────────
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchText(val);

        // Clear existing timer
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        // Debounce: 400ms baad search fire hoga
        searchTimerRef.current = setTimeout(() => {
            // Search change pe page 1 pe wapas jao
            currentPageRef.current = 1;
            setCurrentPage(1);
            fetchDeviceTypes(1, val);
        }, 400);
    };

    // ── FIX: Search clear button handler ─────────────────────────────────
    const handleSearchClear = () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setSearchText('');
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchDeviceTypes(1, '');
    };

    // ── Page change ───────────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        // Page change pe current searchText ke saath fetch karo
        fetchDeviceTypes(newPage, searchText);
    };

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchDeviceTypes(1, '');
        fetchCategories();
        fetchdevicefile();
        return () => {
            // Cleanup debounce timer on unmount
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── FIX: Page change useEffect HATAO — handlePageChange directly fetch karta hai
    // (pehle useEffect([currentPage]) tha jo searchText ko ignore karta tha)

    // ── Modal helpers ─────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingItem(null);
        setSelectedIcon('FaServer');
        setFormData({ ...emptyForm, deviceCategoryId: categories[0]?.id ?? null });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingItem(record);
        setSelectedIcon(record.icon || 'FaServer');   // ✅ ab yeh sahi kaam karega normalize fix ke baad
        setFormData({
            name: record.name || '',
            deviceCategoryId: record.deviceCategoryId || null,
            protocol: record.protocol || null,
            supportedFeature: record.supportedFeature || null,
            remarks: record.remarks || '',
            isActive: record.isActive,
        });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const openDeleteModal = (record) => { setItemToDelete(record); setShowDeleteModal(true); };
    const closeModal = () => { setShowModal(false); setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); setSelectedIcon('FaServer'); };
    const closeDeleteModal = () => { setShowDeleteModal(false); setItemToDelete(null); };
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '—';

    // ── Validation ────────────────────────────────────────────────────────
    const validators = {
        name: v => !v?.trim() ? 'Name is required' : v.trim().length < 2 ? 'Min 2 characters' : v.trim().length > 100 ? 'Max 100 characters' : '',
        deviceCategoryId: v => !v ? 'Category is required' : '',
    };
    const validate = (field, value) => { const e = validators[field]?.(value) ?? ''; setFormErrors(p => ({ ...p, [field]: e })); return e; };
    const validateAll = () => {
        const errs = {};
        Object.keys(validators).forEach(k => { errs[k] = validators[k](formData[k]); });
        setFormErrors(errs);
        return Object.values(errs).every(e => !e);
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validateAll()) { message.error('Please fix form errors before proceeding'); return; }

        const iconInfo = availableIcons.find(i => i.name === selectedIcon) || availableIcons[0];
        const payload = {
            name: formData.name.trim(),
            deviceCategoryId: formData.deviceCategoryId,
            protocol: formData.protocol || null,
            supportedFeature: formData.supportedFeature || null,
            remarks: formData.remarks || null,
            icon: selectedIcon,        // ✅ sahi
            iconColor: iconInfo.color, // ✅ sahi
        };

        const isEdit = !!editingItem;
        setLoading(true);
        try {
            if (isEdit) {
                await axiosdevice.post(`/DeviceType/update-type/${editingItem.id}`, payload);
                setSuccessType('edit');
            } else {
                await axiosdevice.post('/DeviceType/create-devicetype', payload);
                setSuccessType('add');
            }
            await fetchDeviceTypes(currentPageRef.current, searchText);
            closeModal();
            setSuccessVisible(true);
        } catch (err) {
            console.error('handleSubmit:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!itemToDelete?.id) { message.error('Invalid record id'); return; }
        setLoading(true);
        try {
            await axiosdevice.delete(`/DeviceType/soft-delete/${itemToDelete.id}`);
            message.success('Device type deleted successfully!');
            closeDeleteModal();

            const newPage =
                deviceTypes.length === 1 && currentPageRef.current > 1
                    ? currentPageRef.current - 1
                    : currentPageRef.current;

            currentPageRef.current = newPage;
            if (newPage !== currentPage) {
                setCurrentPage(newPage);
                fetchDeviceTypes(newPage, searchText);
            } else {
                await fetchDeviceTypes(newPage, searchText);
            }
        } catch (err) {
            console.error('handleDelete:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────
    const totalCats = new Set(deviceTypes.map(d => d.deviceCategoryId).filter(Boolean)).size;
    const withProtocol = deviceTypes.filter(d => d.protocol).length;
    const withFeature = deviceTypes.filter(d => d.supportedFeature).length;

    // ── IconSelector ──────────────────────────────────────────────────────
    const IconSelector = () => (
        <div style={{ width: 280, maxHeight: 260, overflowY: 'auto', padding: 4 }}>
            <Row gutter={[6, 6]}>
                {availableIcons.map(icon => (
                    <Col span={6} key={icon.name}>
                        <div
                            onClick={() => setSelectedIcon(icon.name)}
                            style={{
                                padding: '8px 4px', borderRadius: 6, textAlign: 'center', cursor: 'pointer',
                                border: selectedIcon === icon.name ? `2px solid ${icon.color}` : '1px solid #e0e0e0',
                                backgroundColor: selectedIcon === icon.name ? `${icon.color}18` : 'white',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            }}
                        >
                            <div style={{ fontSize: 18, color: icon.color }}>{icon.component}</div>
                            <Text style={{ fontSize: 9, lineHeight: 1.2, color: '#333' }}>{icon.label}</Text>
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );

    // ── Shared modal styles ───────────────────────────────────────────────
    const backdropStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
    };
    const modalBoxStyle = (width) => ({
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        backgroundColor: 'white', padding: '24px', borderRadius: '8px',
        width, maxWidth: '95%', maxHeight: '92vh', overflowY: 'auto',
        zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    });
    const lbl = { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' };
    const errText = (msg) => msg
        ? <Text type="danger" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>{msg}</Text>
        : null;

    // ── Columns ───────────────────────────────────────────────────────────
    const columns = [
        // {
        //     title: 'ID', dataIndex: 'id', key: 'id', width: 70,
        //     sorter: true,
        //     sortOrder: sortedInfo.columnKey === 'id' ? sortedInfo.order : null,
        //     render: id => <Text style={{ fontSize: 12, color: '#475569' }}>{id}</Text>,
        // },
        {
            title: 'Icon', key: 'icon', width: 55,
            render: (_, r) => getIcon(r.icon, r.iconColor, 18),
        },
        {
            title: 'Device Type', dataIndex: 'name', key: 'name', width: 180,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
            render: (name, r) => (
                <Space size={6}>
                    {getIcon(r.icon, r.iconColor, 13)}
                    <Text strong style={{ fontSize: 12, color: '#1e293b' }}>{name || '-'}</Text>
                </Space>
            ),
        },
        {
            title: 'Category', dataIndex: 'deviceCategoryId', key: 'category', width: 130,
            render: (catId) => {
                const cat = categories.find(c => c.id === catId);
                return cat
                    ? <Tag color="geekblue" style={{ fontSize: 11 }}>{cat.name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: 'Protocol', dataIndex: 'protocol', key: 'protocol', width: 110,
            render: text => text
                ? <Tag color="cyan" style={{ fontSize: 11 }}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: 'Supported Feature', dataIndex: 'supportedFeature', key: 'supportedFeature', width: 150, ellipsis: true,
            render: text => text
                ? <Tag color="green" style={{ fontSize: 11 }}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 160, ellipsis: true,
            render: text => <Text style={{ fontSize: 12, color: '#475569' }}>{text || '-'}</Text>,
        },
        {
            title: 'Actions', key: 'actions', width: 90, fixed: 'right',
            render: (_, record) => (
                <Space size={4}>

                    {/* View associated models */}
                    {/* <Tooltip title="View Models">
                        <Button
                            type="text" size="small"
                            icon={<FaCubes style={{ fontSize: 13 }} />}
                            onClick={() => { setActiveDeviceType(record); setShowModelsModal(true); }}
                            style={{ color: "#16A34A" }}
                        />
                    </Tooltip>

                    {/* Assign models *
                    <Tooltip title="Assign Models">
                        <Button
                            type="text" size="small"
                            icon={<LinkOutlined />}
                            onClick={() => { setActiveDeviceType(record); setShowAssignModal(true); }}
                            style={{ color: "#7C3AED" }}
                        />
                    </Tooltip> */}

                    {/* View linked Devices */}
                    <Tooltip title="View Devices">
                        <Button
                            type="text" size="small"
                            icon={<ApiOutlined />}
                            onClick={() => { setDevicesDeviceType(record); setShowDevicesModal(true); }}
                            style={{ color: "#EA580C" }}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => openEditModal(record)} style={{ color: '#1890ff' }} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" size="small" icon={<DeleteOutlined />}
                            onClick={() => openDeleteModal(record)} style={{ color: '#ff4d4f' }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            backgroundColor: '#f0f2f5', padding: '16px 12px',
            boxSizing: 'border-box', overflow: 'hidden',
        }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                        <ApiOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Device Type Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Manage device types and communication protocols
                    </Text>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>

                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>

                    <Button
                        type="primary" icon={<PlusOutlined />} onClick={openAddModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                    >
                        Add Device Type
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/DeviceType/export"
                        fileNamePrefix="DeviceType"
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            // Refresh: current page + current search ke saath
                            fetchDeviceTypes(currentPageRef.current, searchText);
                        }}
                    >
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* STAT CARDS */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                {[
                    { label: 'Total Types', value: totalRecords, color: '#1890ff', icon: <ApiOutlined /> },
                    { label: 'Categories Used', value: totalCats, color: '#13c2c2', icon: <AppstoreOutlined /> },
                    { label: 'With Protocol', value: withProtocol, color: '#52c41a', icon: <CheckCircleOutlined /> },
                    { label: 'With Feature', value: withFeature, color: '#722ed1', icon: <CheckCircleOutlined /> },
                ].map(({ label, value, color, icon }) => (
                    <Col span={6} key={label}>
                        <div style={{
                            backgroundColor: 'white', borderRadius: 8, padding: '12px 16px',
                            borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 40,
                                background: `${color}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color,
                            }}>
                                {icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            {/* FILTERS */}
            <div style={{
                backgroundColor: 'white', borderRadius: 8, padding: '12px 16px',
                marginBottom: 16, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
                <Row gutter={12} align="middle">
                    <Col xs={24} md={14}>
                        {/* ── FIX: onChange → debounced server search, onClear → reset ── */}
                        <Input
                            placeholder="Search by name, category, protocol or remarks..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchText}
                            onChange={handleSearchChange}
                            onClear={handleSearchClear}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={5} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                            {/* FIX: filtered array nahi — server se jo aaya woh dikhao */}
                            {deviceTypes.length} / {totalRecords} types
                            {searchText.trim() && (
                                <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                                    "{searchText.trim()}" filtered
                                </Tag>
                            )}
                        </Text>
                    </Col>
                    <Col xs={12} md={5} style={{ textAlign: 'right' }}>
                        <AuditWidget tableName="DeviceType" />
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{
                flex: 1, backgroundColor: 'white', borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', minHeight: 0,
            }}>
                <div style={{
                    padding: '10px 16px', borderBottom: '1px solid #f0f0f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
                }}>
                    <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Device Types List</Text>
                    <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={sortedData}  // ✅ Ye use karo 
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        scroll={{ x: 1000 }}

                        onChange={(_, __, sorter) => {
                            if (sorter && sorter.columnKey && sorter.order) {
                                setSortedInfo(sorter);
                            } else {
                                setSortedInfo({ columnKey: null, order: null });
                            }
                        }}
                        pagination={false}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <ApiOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />
                                    <p style={{ color: '#94a3b8', marginTop: 16 }}>
                                        {searchText.trim()
                                            ? `No results found for "${searchText.trim()}"`
                                            : 'No device types found. Click "Add Device Type" to create one.'
                                        }
                                    </p>
                                </div>
                            )
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    padding: '10px 16px', borderTop: '1px solid #f0f0f0',
                    background: '#fafafa', flexShrink: 0,
                }}>
                    <Pagination
                        current={currentPage}
                        pageSize={PAGE_SIZE}
                        total={totalRecords}
                        size="small"
                        showTotal={(t) => `Total ${t} items`}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </div>
            </div>


            {/* ADD / EDIT MODAL */}
            {showModal && (
                <>
                    <div style={backdropStyle} onClick={closeModal} />
                    <div style={modalBoxStyle('640px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                {editingItem ? 'Edit Device Type' : 'Add New Device Type'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} />
                        </div>

                        <div style={{ padding: '4px 0' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Device Type Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); validate('name', e.target.value); }}
                                            onBlur={() => validate('name', formData.name)}
                                            placeholder="e.g., Rack Server, Network Switch"
                                            size="large" status={formErrors.name ? 'error' : ''}
                                        />
                                        {errText(formErrors.name)}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Category <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Select
                                            value={formData.deviceCategoryId}
                                            onChange={v => { setFormData(p => ({ ...p, deviceCategoryId: v })); validate('deviceCategoryId', v); }}
                                            style={{ width: '100%' }} size="large" placeholder="Select category"
                                            showSearch optionFilterProp="children"
                                            status={formErrors.deviceCategoryId ? 'error' : ''}
                                            notFoundContent={<Text type="secondary">No active categories found</Text>}
                                        >
                                            {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
                                        </Select>
                                        {errText(formErrors.deviceCategoryId)}
                                    </div>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Communication Protocol</label>
                                        <Select
                                            value={formData.protocol}
                                            onChange={v => setFormData(p => ({ ...p, protocol: v }))}
                                            style={{ width: '100%' }} size="large"
                                            placeholder="Select protocol" allowClear showSearch optionFilterProp="children"
                                        >
                                            {protocolOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
                                        </Select>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Supported Feature</label>
                                        <Select
                                            value={formData.supportedFeature}
                                            onChange={v => setFormData(p => ({ ...p, supportedFeature: v }))}
                                            style={{ width: '100%' }} size="large"
                                            placeholder="Select feature" allowClear showSearch optionFilterProp="children"
                                        >
                                            {featureOptions.map(f => <Option key={f} value={f}>{f}</Option>)}
                                        </Select>
                                    </div>
                                </Col>
                            </Row>
                            <div style={{ marginBottom: 16 }}>
                                <label style={lbl}>Remarks</label>
                                <Input.TextArea
                                    value={formData.remarks}
                                    onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
                                    rows={3} placeholder="Additional notes..." maxLength={500} showCount
                                />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={lbl}>Device Icon</label>
                                <Popover content={<IconSelector />} title="Select an Icon" trigger="click" placement="bottom">
                                    <Button style={{
                                        width: '100%', height: 44,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        border: '1px solid #d9d9d9', borderRadius: 6,
                                    }}>
                                        <span style={{ fontSize: 18 }}>
                                            {getIcon(selectedIcon, availableIcons.find(i => i.name === selectedIcon)?.color || '#1890ff', 18)}
                                        </span>
                                        <Text style={{ fontSize: 13, color: '#475569' }}>
                                            {availableIcons.find(i => i.name === selectedIcon)?.label || 'Select Icon'} — click to change
                                        </Text>
                                    </Button>
                                </Popover>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, textAlign: 'right' }}>
                            <Button onClick={closeModal} size="large" style={{ marginRight: 8 }}>Cancel</Button>
                            <Button
                                type="primary" size="large" loading={loading}
                                onClick={handleSubmit}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                            >
                                {editingItem ? 'Update Device Type' : 'Create Device Type'}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && itemToDelete && (
                <>
                    <div style={backdropStyle} onClick={closeDeleteModal} />
                    <div style={{ ...modalBoxStyle('430px'), textAlign: 'center' }}>
                        <DeleteOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
                        <Title level={5} style={{ marginBottom: 8, color: '#1e293b' }}>Confirm Delete</Title>
                        <Text style={{ color: '#475569' }}>
                            Are you sure you want to delete <strong style={{ color: '#1e293b' }}>{itemToDelete?.name}</strong>?
                        </Text>
                        <div style={{
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            padding: '12px', borderRadius: 6, marginTop: 16, textAlign: 'left',
                        }}>
                            {[
                                ['ID', itemToDelete?.id],
                                ['Name', itemToDelete?.name],
                                ['Category', getCategoryName(itemToDelete?.deviceCategoryId)],
                                ['Protocol', itemToDelete?.protocol || '-'],
                                ['Feature', itemToDelete?.supportedFeature || '-'],
                                ['Remarks', itemToDelete?.remarks || '-'],
                            ].map(([k, v]) => (
                                <p key={k} style={{ margin: '4px 0', fontSize: 12, color: '#334155' }}>
                                    <strong style={{ color: '#1e293b' }}>{k}:</strong> {v}
                                </p>
                            ))}
                        </div>
                        <p style={{ color: '#dc2626', fontSize: 12, marginTop: 16 }}>This action cannot be undone.</p>
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                            <Space>
                                <Button onClick={closeDeleteModal} size="large">Cancel</Button>
                                <Button danger type="primary" loading={loading} onClick={handleDelete} size="large">
                                    Delete Device Type
                                </Button>
                            </Space>
                        </div>
                    </div>
                </>
            )}

            {/* <ImportDeviceTypeModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={() => fetchDeviceTypes(currentPageRef.current, searchText)}
            /> */}

            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchDeviceTypes}
                entityName="DeviceType"
                apiEndpoint="/DeviceType/import-devicetype"
                backendFields={BACKEND_FIELDS}
            />

            <SuccessModal
                visible={successVisible}
                type={successType}
                onClose={() => setSuccessVisible(false)}
            />

            <AuditWidget2 tableName="DeviceType" />

            <DeviceTypeModelsModal
                open={showModelsModal}
                onCancel={() => { setShowModelsModal(false); setActiveDeviceType(null); }}
                deviceType={activeDeviceType}
            />

            <DeviceTypeAssignModal
                open={showAssignModal}
                onCancel={() => { setShowAssignModal(false); setActiveDeviceType(null); }}
                deviceType={activeDeviceType}
                onSaved={() => fetchDeviceTypes(currentPageRef.current, searchText)}
            />
            <DeviceTypeDevicesModal
                open={showDevicesModal}
                onCancel={() => { setShowDevicesModal(false); setDevicesDeviceType(null); }}
                deviceType={devicesDeviceType}
            />
        </div>
    );
}

export default DeviceTypePage;





