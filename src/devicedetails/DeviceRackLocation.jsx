// DeviceRackLocation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Typography, Row, Col, Table, Space, Button,
    Input, message, Tag, Badge, Tooltip, Select, Pagination, InputNumber,
} from 'antd';
import {
    EnvironmentOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, EditOutlined, CheckCircleOutlined, PoweroffOutlined,
    CloseOutlined, DashboardOutlined,
    EyeOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import { axiosdevice } from "../../config";
import AuditWidget from '../entity/livetoaster';
import AuditWidget2 from '../entity/notify';
import { SuccessModal } from '../entity/popUp';
import ExcelExport from '../entity/excelexport';
import { EyeIcon } from 'lucide-react';
import GenericImportModal from './GenericImportFIle';

const { Title, Text } = Typography;
const { Option } = Select;




const PAGE_SIZE = 10;

const RACKLocation_BACKEND_FIELDS = []

// ── Normalize ─────────────────────────────────────────────────────────────────
const normalize = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    deviceDetailId: obj.deviceDetailId ?? obj.DeviceDetailId,
    deviceName: obj.deviceName ?? obj.DeviceName ?? obj.deviceDetail?.deviceName ?? '',
    rackId: obj.rackId ?? obj.RackId,
    rackName: obj.rackName ?? obj.RackName ?? obj.rack?.rackName ?? '',
    startUPosition: obj.startUPosition ?? obj.StartUPosition ?? 0,
    uOccupied: obj.uOccupied ?? obj.UOccupied ?? 0,
    address: obj.address ?? obj.Address ?? '',
    country: obj.country ?? obj.Country ?? '',
    state: obj.state ?? obj.State ?? '',
    city: obj.city ?? obj.City ?? '',
    pinCode: obj.pinCode ?? obj.PinCode ?? '',
    latitude: obj.latitude ?? obj.Latitude ?? null,
    longitude: obj.longitude ?? obj.Longitude ?? null,
    isActive: obj.isActive ?? obj.IsActive ?? true,
});

const normalizeRack = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    rackName: obj.rackName ?? obj.RackName,
    isActive: obj.isActive ?? obj.IsActive ?? true,
});
const normalizeDevice = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    deviceName: obj.deviceName ?? obj.DeviceName ?? obj.shortName ?? obj.longName ?? obj.name ?? obj.Name,
    isActive: obj.isActive ?? obj.IsActive ?? true,
});


// // ── Response extractors ───────────────────────────────────────────────────────
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
    console.warn('[DeviceRackLocation] unrecognised response shape:', response);
    return { rows: [], total: 0 };
};


const extractList = (response) => {
    const body = response?.data;
    if (Array.isArray(body?.data)) return body.data;        // { data: { data: [...] } } ya axios wrapper
    if (Array.isArray(response?.data)) return response.data; // { data: [...] }
    if (Array.isArray(body)) return body;
    if (Array.isArray(response)) return response;
    return [];
};

// // End U position = start + occupied - 1 (planning-time check)
const endUPosition = (r) => {
    const start = Number(r.startUPosition) || 0;
    const occ = Number(r.uOccupied) || 0;
    if (!start || !occ) return null;
    return start + occ - 1;
};
const DeviceRackLocationPage = () => {


    //     // ── Pagination + Search state ─────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    //     const currentPageRef = useRef(1);
    //     // ── Data state ────────────────────────────────────────────────────────
    const [records, setRecords] = useState([]);
    const [racks, setRacks] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState('add');
    // ── Filters (Rack, Device, Country, State, City) ────────────────────
    const [rackFilter, setRackFilter] = useState(null);
    const rackFilterRef = useRef(null);
    const [deviceFilter, setDeviceFilter] = useState(null);
    const deviceFilterRef = useRef(null);
    const emptyForm = {
        deviceDetailId: null, rackId: null,
        startUPosition: null, uOccupied: null,
        address: '', country: '', state: '', city: '', pinCode: '',
        latitude: null, longitude: null,
    };
    const emptyErr = { deviceDetailId: '', rackId: '', startUPosition: '', uOccupied: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErr);

    const [exportFile, setExportFile] = useState([]);
    const currentPageRef = useRef(1);

    const [searchText, setSearchText] = useState('');
    const searchTimerRef = useRef(null);

    const [viewmodel, setviewmodel] = useState(false)
    const [viewdetails, setdetails] = useState({})


    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false);

    const fetchDetails = async (id) => {
        try {
            const res = await axiosdevice.get(`/DeviceRackLocation/${id}/get-device-rack-location`);
            const raw = res?.data?.data ?? res?.data ?? res;
            setdetails(normalize(raw));
        } catch (error) {
            console.log("error in getting data", error);
        }
    };
    const openviewModel = (id) => {
        setviewmodel(!viewmodel)
        fetchDetails(id)

    }

    const fetchExportFile = async () => {
        try {
            const res = await axiosdevice.get('/DeviceRackLocation/get-all-device-rack-locations', { params: { IsPaginated: false } });
            const rows = extractList(res?.data ?? res);
            setExportFile(rows.map(normalize));
        } catch (error) {
            console.log('fetchExportFile error:', error);
        }
    };

    //     // ── fetchRecords — Search + RackId + DeviceDetailId server ko jayenge ──
    const fetchRecords = useCallback(async (targetPage, searchQuery, rkId, devId) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchQuery ?? searchText;
        const rackIdVal = rkId !== undefined ? rkId : rackFilterRef.current;
        const deviceIdVal = devId !== undefined ? devId : deviceFilterRef.current;

        setLoading(true);
        try {
            const params = {
                Page: pg,
                PageSize: PAGE_SIZE,
                IsPaginated: true,
            };
            if (search && search.trim()) params.Search = search.trim();
            if (rackIdVal) params.RackId = rackIdVal;
            if (deviceIdVal) params.DeviceDetailId = deviceIdVal;

            const response = await axiosdevice.get('/DeviceRackLocation/get-all-device-rack-locations', { params });
            const { rows, total } = extractPaginated(response);

            console.log('[DeviceRackLocation] page:', pg, 'search:', search || '(none)', 'rack:', rackIdVal || '(all)', 'device:', deviceIdVal || '(all)', 'rows:', rows.length, 'total:', total);

            setRecords(rows.map(normalize));
            setTotalRecords(total);
        } catch (err) {
            console.error('fetchRecords:', err);
            message.error('Failed to fetch device rack location records');
        } finally {
            setLoading(false);
        }
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── fetchRacks — dropdown source ────────────────────────────────────
    const fetchRacks = async () => {
        try {
            const response = await axiosdevice.get('/Rack/get-all-racks', { params: { IsPaginated: false } });
            const rows = extractList(response);
            setRacks(rows.map(normalizeRack).filter(r => r.isActive));
        } catch (err) {
            console.error('fetchRacks:', err);
            message.error('Failed to fetch racks');
        }
    };

    // ── fetchDevices — dropdown source ────────────────────────────────────
    const fetchDevices = async () => {
        try {
            const response = await axiosdevice.get('/DeviceDetail/get-all-devicedetail', { params: { IsPaginated: false } });
            const rows = extractList(response);
            setDevices(rows.map(normalizeDevice).filter(d => d.isActive));
            console.log("devices fetched:", rows);
        } catch (err) {
            console.error('fetchDevices:', err);
            message.error('Failed to fetch devices');
        }
    };

    //     // ── Search input handler — debounced 400ms + page reset ───────────────
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchText(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            currentPageRef.current = 1;
            setCurrentPage(1);
            fetchRecords(1, val, rackFilterRef.current, deviceFilterRef.current);
        }, 400);
    };

    const handleSearchClear = () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setSearchText('');
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRecords(1, '', rackFilterRef.current, deviceFilterRef.current);
    };


    // ── Rack filter handler ────────────────────────────────────────────────
    const handleRackFilterChange = (val) => {
        setRackFilter(val);
        rackFilterRef.current = val;
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRecords(1, searchText, val, deviceFilterRef.current);
    };

    // ── Device filter handler ──────────────────────────────────────────────
    const handleDeviceFilterChange = (val) => {
        setDeviceFilter(val);
        deviceFilterRef.current = val;
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRecords(1, searchText, rackFilterRef.current, val);
    };


    // ── Page change ───────────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchRecords(newPage, searchText, rackFilterRef.current, deviceFilterRef.current);
    };

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchRecords(1, '', null, null);
        fetchRacks();
        fetchDevices();
        fetchExportFile();
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Modal helpers ─────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ ...emptyForm, rackId: rackFilter ?? null, deviceDetailId: deviceFilter ?? null });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingItem(record);
        setFormData({
            deviceDetailId: record.deviceDetailId || null,
            rackId: record.rackId || null,
            startUPosition: record.startUPosition || null,
            uOccupied: record.uOccupied || null,
            address: record.address || '',
            country: record.country || '',
            state: record.state || '',
            city: record.city || '',
            pinCode: record.pinCode || '',
            latitude: record.latitude ?? null,
            longitude: record.longitude ?? null,
        });
        setFormErrors(emptyErr);
        setShowModal(true);
    };


    const closeModal = () => { setShowModal(false); setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); };
    const getRackName = (id) => racks.find(r => r.id === id)?.rackName || '—';
    const getDeviceName = (id) => devices.find(d => d.id === id)?.deviceName || '—';


    // ── Validation ────────────────────────────────────────────────────────
    const validators = {
        deviceDetailId: v => !v ? 'Device is required' : '',
        rackId: v => !v ? 'Rack is required' : '',
        startUPosition: v => (v === null || v === undefined || v === '') ? 'Start U position is required' : (v < 1 ? 'Must be at least 1' : ''),
        uOccupied: v => (v === null || v === undefined || v === '') ? 'U occupied is required' : (v < 1 ? 'Must be at least 1' : ''),
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

        const payload = {
            deviceDetailId: formData.deviceDetailId,
            rackId: formData.rackId,
            startUPosition: formData.startUPosition || 0,
            uOccupied: formData.uOccupied || 0,
            address: formData.address || null,
            country: formData.country || null,
            state: formData.state || null,
            city: formData.city || null,
            pinCode: formData.pinCode || null,
            latitude: formData.latitude ?? null,
            longitude: formData.longitude ?? null,
        };

        const isEdit = !!editingItem;
        setLoading(true);
        try {
            if (isEdit) {
                await axiosdevice.post(`/DeviceRackLocation/${editingItem.id}/update-device-rack-location`, { ...payload, isActive: editingItem.isActive });
                setSuccessType('edit');
            } else {
                await axiosdevice.post('/DeviceRackLocation/add-device-rack-location', payload);
                setSuccessType('add');
            }
            await fetchRecords(currentPageRef.current, searchText, rackFilterRef.current, deviceFilterRef.current);
            fetchExportFile();
            closeModal();
            setSuccessVisible(true);
        } catch (err) {
            console.error('handleSubmit:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };


    const totalRacksUsed =
        new Set(records.map(r => r.rackId).filter(Boolean)).size;

    const totalDevicesUsed =
        new Set(records.map(r => r.deviceDetailId).filter(Boolean)).size;

    const activeCount =
        records.filter(r => r.isActive).length;


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
        {
            title: 'Device', dataIndex: 'deviceDetailId', key: 'device', width: 140,
            render: (id, r) => {
                const dname = r.deviceName || getDeviceName(id);
                return (
                    <Space size={6}>
                        <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                        <Text strong style={{ fontSize: 12, color: '#1e293b' }}>{dname !== '—' ? dname : '-'}</Text>
                    </Space>
                );
            },
        },
        {
            title: 'Rack', dataIndex: 'rackId', key: 'rack', width: 120,
            // sorter: (a, b) => (a.rackId || "").localeCompare(b.rackId || ""),
            sorter: (a, b) => {
                const nameA = a.rackName || getRackName(a.rackId) || '';
                const nameB = b.rackName || getRackName(b.rackId) || '';
                return nameA.localeCompare(nameB);
            },
            render: (id, r) => {
                const rname = r.rackName || getRackName(id);
                return <Text style={{ fontSize: 12 }}>{rname !== '—' ? rname : '-'}</Text>;
            },
        },
        {
            title: 'Start U', dataIndex: 'startUPosition', key: 'startU', width: 80,
            sorter: (a, b) => (Number(a.startUPosition) || 0) - (Number(b.startUPosition) || 0),
            render: v => <Text style={{ fontSize: 12 }}>{v || '-'}</Text>,
        },
        {
            title: 'U Occupied', dataIndex: 'uOccupied', key: 'uOccupied', width: 100,
            sorter: (a, b) => (Number(a.uOccupied) || 0) - (Number(b.uOccupied) || 0),
            render: v => <Text style={{ fontSize: 12 }}>{v || '-'}</Text>,
        },
        {
            title: 'End U', key: 'endU', width: 80,
            render: (_, r) => {
                const e = endUPosition(r);
                return e != null
                    ? <Tag color="blue" style={{ fontSize: 11 }}>{e}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        // {
        //     title: 'City', dataIndex: 'city', key: 'city', width: 100,
        //     render: text => text
        //         ? <Tag color="cyan" style={{ fontSize: 11 }}>{text}</Tag>
        //         : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        // },
        // {
        //     title: 'State', dataIndex: 'state', key: 'state', width: 100,
        //     render: text => <Text style={{ fontSize: 12, color: '#64748b' }}>{text || '-'}</Text>,
        // },
        // {
        //     title: 'Country', dataIndex: 'country', key: 'country', width: 100,
        //     render: text => <Text style={{ fontSize: 12, color: '#64748b' }}>{text || '-'}</Text>,
        // },
        // {
        //     title: 'Pin Code', dataIndex: 'pinCode', key: 'pinCode', width: 90,
        //     render: text => <Text style={{ fontSize: 12, color: '#64748b' }}>{text || '-'}</Text>,
        // },
        // {
        //     title: 'Address', dataIndex: 'address', key: 'address', width: 160,
        //     render: text => (
        //         <Tooltip title={text}>
        //             <Text style={{ fontSize: 12, color: '#64748b' }} ellipsis>{text || '-'}</Text>
        //         </Tooltip>
        //     ),
        // },
        {
            title: 'Lat / Long', key: 'latlong', width: 130,
            render: (_, r) => (r.latitude != null && r.longitude != null)
                ? <Text style={{ fontSize: 11, color: '#64748b' }}>{r.latitude}, {r.longitude}</Text>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: 'Active', dataIndex: 'isActive', key: 'isActive', width: 90,
            render: (active) => (
                <Tag color={active ? 'success' : 'default'} style={{ fontSize: 11 }}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Actions', key: 'actions', width: 90, fixed: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => openEditModal(record)} style={{ color: '#1890ff' }} />
                    </Tooltip>
                    <Tooltip title='view Details'>
                        <Button type="text" size="middle" icon={<EyeOutlined style={{ fontSize: 18 }} />} onClick={() => openviewModel(record.id)} style={{ color: "#52c41a" }} />
                    </Tooltip>
                    <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
                        <Button type="text" size="small"
                            icon={record.isActive ? <PoweroffOutlined /> : <CheckCircleOutlined />}
                            onClick={() => handleToggleActive(record)}
                            style={{ color: record.isActive ? '#ff4d4f' : '#52c41a' }} />
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
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Device Rack Location
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Track where each device sits within a rack, its U-position span, and physical site location
                    </Text>
                </div>
                <Space>
                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>
                    <Button
                        type="primary" icon={<PlusOutlined />} onClick={openAddModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                    >
                        Add Location
                    </Button>

                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/DeviceRackLocation/export"
                        fileNamePrefix="DeviceType"
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            fetchRecords(currentPageRef.current, searchText, rackFilterRef.current, deviceFilterRef.current);
                        }}
                    >
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* STAT CARDS */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                {[
                    { label: 'Total Records', value: totalRecords, color: '#1890ff', icon: <EnvironmentOutlined /> },
                    { label: 'Racks Covered', value: totalRacksUsed, color: '#13c2c2', icon: <DashboardOutlined /> },
                    { label: 'Devices Placed', value: totalDevicesUsed, color: '#722ed1', icon: <DashboardOutlined /> },
                    { label: 'Active (this page)', value: activeCount, color: '#52c41a', icon: <CheckCircleOutlined /> },
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
                    <Col xs={24} md={7}>
                        <Input
                            placeholder="Search by city, address, pin code..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchText}
                            onChange={handleSearchChange}
                            onClear={handleSearchClear}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={5}>
                        <Select
                            value={rackFilter}
                            onChange={handleRackFilterChange}
                            style={{ width: '100%' }}
                            placeholder="Filter by rack"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {racks.map(r => (
                                <Option key={r.id} value={r.id}>{r.rackName}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={12} md={5}>
                        <Select
                            value={deviceFilter}
                            onChange={handleDeviceFilterChange}
                            style={{ width: '100%' }}
                            placeholder="Filter by device"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {devices.map(d => (
                                <Option key={d.id} value={d.id}>{d.deviceName}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={12} md={3} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                            {records.length} / {totalRecords}
                        </Text>
                    </Col>
                    <Col xs={24} md={4} style={{ textAlign: 'right' }}>
                        <AuditWidget tableName="DeviceRackLocations" />
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
                    <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Device Rack Location List</Text>
                    <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={records}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        scroll={{ x: 1200 }}
                        pagination={false}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <EnvironmentOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />
                                    <p style={{ color: '#94a3b8', marginTop: 16 }}>
                                        {searchText.trim()
                                            ? `No results found for "${searchText.trim()}"`
                                            : 'No device rack location records found. Click "Add Location" to create one.'
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
                    <div style={modalBoxStyle('700px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                {editingItem ? 'Edit Device Rack Location' : 'Add Device Rack Location'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} />
                        </div>

                        <div style={{ padding: '4px 0' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Device <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Select
                                            value={formData.deviceDetailId}
                                            onChange={v => { setFormData(p => ({ ...p, deviceDetailId: v })); validate('deviceDetailId', v); }}
                                            style={{ width: '100%' }} size="large" placeholder="Select device"
                                            showSearch optionFilterProp="children"
                                            status={formErrors.deviceDetailId ? 'error' : ''}
                                            notFoundContent={<Text type="secondary">No active devices found</Text>}
                                        >
                                            {devices.map(d => <Option key={d.id} value={d.id}>{d.deviceName}</Option>)}
                                        </Select>
                                        {errText(formErrors.deviceDetailId)}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Rack <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Select
                                            value={formData.rackId}
                                            onChange={v => { setFormData(p => ({ ...p, rackId: v })); validate('rackId', v); }}
                                            style={{ width: '100%' }} size="large" placeholder="Select rack"
                                            showSearch optionFilterProp="children"
                                            status={formErrors.rackId ? 'error' : ''}
                                            notFoundContent={<Text type="secondary">No active racks found</Text>}
                                        >
                                            {racks.map(r => <Option key={r.id} value={r.id}>{r.rackName}</Option>)}
                                        </Select>
                                        {errText(formErrors.rackId)}
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Start U Position <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <InputNumber
                                            value={formData.startUPosition}
                                            onChange={v => { setFormData(p => ({ ...p, startUPosition: v })); validate('startUPosition', v); }}
                                            style={{ width: '100%' }} size="large" min={1} placeholder="e.g., 12"
                                            status={formErrors.startUPosition ? 'error' : ''}
                                        />
                                        {errText(formErrors.startUPosition)}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>U Occupied <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <InputNumber
                                            value={formData.uOccupied}
                                            onChange={v => { setFormData(p => ({ ...p, uOccupied: v })); validate('uOccupied', v); }}
                                            style={{ width: '100%' }} size="large" min={1} placeholder="e.g., 2"
                                            status={formErrors.uOccupied ? 'error' : ''}
                                        />
                                        {errText(formErrors.uOccupied)}
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={24}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Address</label>
                                        <Input
                                            value={formData.address}
                                            onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                                            placeholder="Full site address"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Country</label>
                                        <Input
                                            value={formData.country}
                                            onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                                            placeholder="e.g., India"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>State</label>
                                        <Input
                                            value={formData.state}
                                            onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                                            placeholder="e.g., Uttar Pradesh"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>City</label>
                                        <Input
                                            value={formData.city}
                                            onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                                            placeholder="e.g., Lucknow"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Pin Code</label>
                                        <Input
                                            value={formData.pinCode}
                                            onChange={e => setFormData(p => ({ ...p, pinCode: e.target.value }))}
                                            placeholder="e.g., 226001"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Latitude</label>
                                        <InputNumber
                                            value={formData.latitude}
                                            onChange={v => setFormData(p => ({ ...p, latitude: v }))}
                                            style={{ width: '100%' }} size="large" min={-90} max={90} placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Longitude</label>
                                        <InputNumber
                                            value={formData.longitude}
                                            onChange={v => setFormData(p => ({ ...p, longitude: v }))}
                                            style={{ width: '100%' }} size="large" min={-180} max={180} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <div style={{
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 6, padding: '10px 14px', fontSize: 12.5, color: '#475569',
                            }}>
                                End U Position = <strong style={{ color: '#1e293b' }}>
                                    {(formData.startUPosition && formData.uOccupied)
                                        ? (Number(formData.startUPosition) + Number(formData.uOccupied) - 1)
                                        : '-'}
                                </strong> (start + occupied − 1) — last rack unit this device will occupy
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16, textAlign: 'right' }}>
                            <Button onClick={closeModal} size="large" style={{ marginRight: 8 }}>Cancel</Button>
                            <Button
                                type="primary" size="large" loading={loading}
                                onClick={handleSubmit}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                            >
                                {editingItem ? 'Update Location' : 'Create Location'}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <SuccessModal
                visible={successVisible}
                type={successType}
                onClose={() => setSuccessVisible(false)}
            />

            <AuditWidget2 tableName="DeviceRackLocations" />

            {viewmodel && (
                <>
                    <div style={backdropStyle} onClick={() => setviewmodel(false)} />
                    <div style={modalBoxStyle('650px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                <EyeIcon size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                                Device Rack Location Details
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={() => setviewmodel(false)} />
                        </div>

                        <div style={{ padding: '4px 0' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Device</Text>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                        {viewdetails.deviceName || getDeviceName(viewdetails.deviceDetailId) || '-'}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Rack</Text>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                        {viewdetails.rackName || getRackName(viewdetails.rackId) || '-'}
                                    </div>
                                </Col>

                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Start U Position</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.startUPosition ?? '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>U Occupied</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.uOccupied ?? '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>End U Position</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{endUPosition(viewdetails) ?? '-'}</div>
                                </Col>

                                <Col span={24}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Address</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.address || '-'}</div>
                                </Col>

                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Country</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.country || '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>State</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.state || '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>City</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.city || '-'}</div>
                                </Col>

                                <Col span={8}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Pin Code</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.pinCode || '-'}</div>
                                </Col>
                                <Col span={16}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Lat / Long</Text>
                                    <div style={{ fontSize: 14, color: '#1e293b' }}>
                                        {(viewdetails.latitude != null && viewdetails.longitude != null)
                                            ? `${viewdetails.latitude}, ${viewdetails.longitude}`
                                            : '-'}
                                    </div>
                                </Col>

                                <Col span={12}>
                                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Status</Text>
                                    <div>
                                        <Tag color={viewdetails.isActive ? 'success' : 'default'}>
                                            {viewdetails.isActive ? 'Active' : 'Inactive'}
                                        </Tag>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 20, textAlign: 'right' }}>
                            <Button onClick={() => setviewmodel(false)} size="large">Close</Button>
                        </div>
                    </div>
                </>
            )}
            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchRecords}
                entityName="RackLocation"
                apiEndpoint="/DeviceRackLocation/import"
                backendFields={RACKLocation_BACKEND_FIELDS}
            />



        </div>
    );
}


export default DeviceRackLocationPage