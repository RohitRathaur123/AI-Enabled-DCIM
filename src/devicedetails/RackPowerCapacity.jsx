// RackPowerCapacity.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Typography, Row, Col, Table, Space, Button,
    Input, message, Tag, Badge, Tooltip, Select, Pagination, InputNumber,
} from 'antd';
import {
    ThunderboltOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, EditOutlined, CheckCircleOutlined, PoweroffOutlined,
    CloseOutlined, DashboardOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import { axiosdevice } from "../../config";
import AuditWidget from '../entity/livetoaster';
import AuditWidget2 from '../entity/notify';
import { SuccessModal } from '../entity/popUp';
import ExcelExport from '../entity/excelexport';
import GenericImportModal from './GenericImportFIle';

const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

const BACKEND_FIELDS = [
    { key: "deviceSerialNumber", label: "Device Serial Number", required: true, color: "red", hint: "e.g. SN-2024-001, unique device identifier" },
    { key: "rackName", label: "Rack Name", required: true, color: "blue", hint: "e.g. Rack-A01, Rack-B12" },
    { key: "roomName", label: "Room Name", required: true, color: "purple", hint: "e.g. Server Room 1, DC-Floor2" },
    { key: "startUPosition", label: "Start U Position", required: false, color: "cyan", hint: "e.g. 5, 12 — starting rack unit position" },
    { key: "uOccupied", label: "U Occupied", required: false, color: "orange", hint: "e.g. 1, 2, 4 — number of rack units used" },
    { key: "address", label: "Address", required: false, color: "green", hint: "e.g. Plot 21, Sector 5, Industrial Area" },
    { key: "country", label: "Country", required: false, color: "geekblue", hint: "e.g. India, USA" },
    { key: "state", label: "State", required: false, color: "gold", hint: "e.g. Haryana, Maharashtra" },
    { key: "city", label: "City", required: false, color: "lime", hint: "e.g. Gurugram, Mumbai" },
    { key: "pinCode", label: "Pin Code", required: false, color: "volcano", hint: "e.g. 122001" },
    { key: "latitude", label: "Latitude", required: false, color: "magenta", hint: "e.g. 28.4595" },
    { key: "longitude", label: "Longitude", required: false, color: "default", hint: "e.g. 77.0266" },
];

// ── Normalize ─────────────────────────────────────────────────────────────────
const normalize = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    rackId: obj.rackId ?? obj.RackId,
    rackName: obj.rackName ?? obj.RackName ?? obj.rack?.rackName ?? '',
    pduName: obj.pduName ?? obj.PduName ?? '',
    phaseName: obj.phaseName ?? obj.PhaseName ?? '',
    ratedCapacityKW: obj.ratedCapacityKW ?? obj.RatedCapacityKW ?? 0,
    estimatedLoadKW: obj.estimatedLoadKW ?? obj.EstimatedLoadKW ?? 0,
    measuredLoadKW: obj.measuredLoadKW ?? obj.MeasuredLoadKW ?? 0,
    failoverReservedKW: obj.failoverReservedKW ?? obj.FailoverReservedKW ?? 0,
    isActive: obj.isActive ?? obj.IsActive ?? true,
});

const normalizeRack = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    rackName: obj.rackName ?? obj.RackName,
    isActive: obj.isActive ?? obj.IsActive ?? true,
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
    console.warn('[RackPowerCapacity] unrecognised response shape:', response);
    return { rows: [], total: 0 };
};

const extractList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

// Remaining headroom = rated capacity - estimated load (planning-time check)
const headroomKW = (r) => {
    const rated = Number(r.ratedCapacityKW) || 0;
    const estimated = Number(r.estimatedLoadKW) || 0;
    const headroom = rated - estimated;
    return headroom;
};

// Load percentage against rated capacity, based on the measured (live) reading
// when available, otherwise the estimated (planning) figure.
const loadPercent = (r) => {
    const rated = Number(r.ratedCapacityKW) || 0;
    if (!rated) return null;
    const load = Number(r.measuredLoadKW) || Number(r.estimatedLoadKW) || 0;
    return Math.round((load / rated) * 100);
};

const loadColor = (pct) => {
    if (pct == null) return 'default';
    if (pct >= 90) return 'error';
    if (pct >= 75) return 'warning';
    return 'success';
};

// ─────────────────────────────────────────────────────────────────────────────
function RackPowerCapacityPage() {


    const [showImportModal, setShowImportModal] = useState(false);
    // ── Pagination + Search state ─────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const currentPageRef = useRef(1);

    const [searchText, setSearchText] = useState('');
    const searchTimerRef = useRef(null);

    // ── Rack filter ─────────────────────────────────────────────────────
    const [rackFilter, setRackFilter] = useState(null);
    const rackFilterRef = useRef(null);


    /////////////

    const [showExportModal, setShowExportModal] = useState(false)
    // ── Data state ────────────────────────────────────────────────────────
    const [records, setRecords] = useState([]);
    const [racks, setRacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState('add');

    const emptyForm = {
        rackId: null, pduName: '', phaseName: '',
        ratedCapacityKW: null, estimatedLoadKW: null,
        measuredLoadKW: null, failoverReservedKW: null,
    };
    const emptyErr = { rackId: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErr);

    const [exportFile, setExportFile] = useState([]);

    const fetchExportFile = async () => {
        try {
            const res = await axiosdevice.get('/RackPowerCapacity/get-all-rack-power-capacities', { params: { IsPaginated: false } });
            const rows = extractList(res?.data ?? res);
            setExportFile(rows.map(normalize));
        } catch (error) {
            console.log('fetchExportFile error:', error);
        }
    };

    // ── fetchRecords — Search + RackId server ko jayenge ──────────────────
    const fetchRecords = useCallback(async (targetPage, searchQuery, rackId) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchQuery ?? searchText;
        const rkId = rackId !== undefined ? rackId : rackFilterRef.current;

        setLoading(true);
        try {
            const params = {
                Page: pg,
                PageSize: PAGE_SIZE,
                IsPaginated: true,
            };
            if (search && search.trim()) params.Search = search.trim();
            if (rkId) params.RackId = rkId;

            const response = await axiosdevice.get('/RackPowerCapacity/get-all-rack-power-capacities', { params });
            const { rows, total } = extractPaginated(response);

            console.log('[RackPowerCapacity] page:', pg, 'search:', search || '(none)', 'rack:', rkId || '(all)', 'rows:', rows.length, 'total:', total);

            setRecords(rows.map(normalize));
            setTotalRecords(total);
        } catch (err) {
            console.error('fetchRecords:', err);
            message.error('Failed to fetch rack power capacity records');
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

    // ── Search input handler — debounced 400ms + page reset ───────────────
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchText(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            currentPageRef.current = 1;
            setCurrentPage(1);
            fetchRecords(1, val, rackFilterRef.current);
        }, 400);
    };

    const handleSearchClear = () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setSearchText('');
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRecords(1, '', rackFilterRef.current);
    };

    // ── Rack filter handler ────────────────────────────────────────────────
    const handleRackFilterChange = (val) => {
        setRackFilter(val);
        rackFilterRef.current = val;
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRecords(1, searchText, val);
    };

    // ── Page change ───────────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchRecords(newPage, searchText, rackFilterRef.current);
    };

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchRecords(1, '', null);
        fetchRacks();
        fetchExportFile();
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Modal helpers ─────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ ...emptyForm, rackId: rackFilter ?? null });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingItem(record);
        setFormData({
            rackId: record.rackId || null,
            pduName: record.pduName || '',
            phaseName: record.phaseName || '',
            ratedCapacityKW: record.ratedCapacityKW || null,
            estimatedLoadKW: record.estimatedLoadKW || null,
            measuredLoadKW: record.measuredLoadKW || null,
            failoverReservedKW: record.failoverReservedKW || null,
        });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); };
    const getRackName = (id) => racks.find(r => r.id === id)?.rackName || '—';

    // ── Validation ────────────────────────────────────────────────────────
    const validators = {
        rackId: v => !v ? 'Rack is required' : '',
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
            rackId: formData.rackId,
            pduName: formData.pduName || null,
            phaseName: formData.phaseName || null,
            ratedCapacityKW: formData.ratedCapacityKW || 0,
            estimatedLoadKW: formData.estimatedLoadKW || 0,
            measuredLoadKW: formData.measuredLoadKW || 0,
            failoverReservedKW: formData.failoverReservedKW || 0,
        };

        const isEdit = !!editingItem;
        setLoading(true);
        try {
            if (isEdit) {
                await axiosdevice.post(`/RackPowerCapacity/${editingItem.id}/update-rack-power-capacity`, { ...payload, isActive: editingItem.isActive });
                setSuccessType('edit');
            } else {
                await axiosdevice.post('/RackPowerCapacity/add-rack-power-capacity', payload);
                setSuccessType('add');
            }
            await fetchRecords(currentPageRef.current, searchText, rackFilterRef.current);
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

    // ── Set-active (Delete ki jagah — real DELETE nahi hai) ────────────────
    const handleToggleActive = async (record) => {
        const nextState = !record.isActive;
        setLoading(true);
        try {
            await axiosdevice.patch(`/RackPowerCapacity/${record.id}/set-active`, null, { params: { isActive: nextState } });
            message.success(`Record ${nextState ? 'activated' : 'deactivated'} successfully!`);
            await fetchRecords(currentPageRef.current, searchText, rackFilterRef.current);
            fetchExportFile();
        } catch (err) {
            console.error('handleToggleActive:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────
    const totalRacksUsed = new Set(records.map(r => r.rackId).filter(Boolean)).size;
    const activeCount = records.filter(r => r.isActive).length;
    const overloadedCount = records.filter(r => (loadPercent(r) ?? 0) >= 90).length;

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
            title: 'Rack', dataIndex: 'rackId', key: 'rack', width: 130,
            render: (rackId, r) => {
                const rname = r.rackName || getRackName(rackId);
                return (
                    <Space size={6}>
                        <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                        <Text strong style={{ fontSize: 12, color: '#1e293b' }}>{rname !== '—' ? rname : '-'}</Text>
                    </Space>
                );
            },
        },
        {
            title: 'PDU', dataIndex: 'pduName', key: 'pduName', width: 110,
            render: text => text
                ? <Tag color="purple" style={{ fontSize: 11 }}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: 'Phase', dataIndex: 'phaseName', key: 'phaseName', width: 80,
            render: text => text
                ? <Tag color="cyan" style={{ fontSize: 11 }}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: 'Rated (kW)', dataIndex: 'ratedCapacityKW', key: 'rated', width: 100,
            render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Estimated (kW)', dataIndex: 'estimatedLoadKW', key: 'estimated', width: 120,
            render: v => <Text style={{ fontSize: 12, color: '#64748b' }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Measured (kW)', dataIndex: 'measuredLoadKW', key: 'measured', width: 120,
            render: v => <Text style={{ fontSize: 12, color: '#64748b' }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Failover Reserve (kW)', dataIndex: 'failoverReservedKW', key: 'failover', width: 140,
            render: v => <Text style={{ fontSize: 12, color: '#64748b' }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Load', key: 'load', width: 90,
            render: (_, r) => {
                const pct = loadPercent(r);
                return pct != null
                    ? <Tag color={loadColor(pct)} style={{ fontSize: 11 }}>{pct}%</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: 'Headroom (kW)', key: 'headroom', width: 110,
            render: (_, r) => {
                const h = headroomKW(r);
                return r.ratedCapacityKW
                    ? <Text style={{ fontSize: 12, color: h < 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>{h.toLocaleString()}</Text>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
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
            backgroundColor: '#f0f2f5', padding: '16px 24px',
            boxSizing: 'border-box', overflow: 'hidden',
        }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                        <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Rack Power Capacity
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Track PDU power ratings, planned and live load, and failover reserve per rack
                    </Text>
                </div>
                <Space>
                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>
                    <Button
                        type="primary" icon={<PlusOutlined />} onClick={openAddModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                    >
                        Add Power Record
                    </Button>

                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/RackPowerCapacity/export"
                        fileNamePrefix="RackPowerCapacity"
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            fetchRecords(currentPageRef.current, searchText, rackFilterRef.current);
                        }}
                    >
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* STAT CARDS */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                {[
                    { label: 'Total Records', value: totalRecords, color: '#1890ff', icon: <ThunderboltOutlined /> },
                    { label: 'Racks Covered', value: totalRacksUsed, color: '#13c2c2', icon: <DashboardOutlined /> },
                    { label: 'Active (this page)', value: activeCount, color: '#52c41a', icon: <CheckCircleOutlined /> },
                    { label: 'Near Capacity (≥90%)', value: overloadedCount, color: '#ff4d4f', icon: <DashboardOutlined /> },
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
                    <Col xs={24} md={9}>
                        <Input
                            placeholder="Search by PDU, phase..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchText}
                            onChange={handleSearchChange}
                            onClear={handleSearchClear}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={6}>
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
                    <Col xs={12} md={4} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                            {records.length} / {totalRecords} records
                            {searchText.trim() && (
                                <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                                    "{searchText.trim()}" filtered
                                </Tag>
                            )}
                        </Text>
                    </Col>
                    <Col xs={24} md={5} style={{ textAlign: 'right' }}>
                        <AuditWidget tableName="RackPowerCapacities" />
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
                    <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Rack Power Capacity List</Text>
                    <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={records}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        scroll={{ x: 1300 }}
                        pagination={false}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <ThunderboltOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />
                                    <p style={{ color: '#94a3b8', marginTop: 16 }}>
                                        {searchText.trim()
                                            ? `No results found for "${searchText.trim()}"`
                                            : 'No power capacity records found. Click "Add Power Record" to create one.'
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
                    <div style={modalBoxStyle('620px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                {editingItem ? 'Edit Power Capacity Record' : 'Add Power Capacity Record'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} />
                        </div>

                        <div style={{ padding: '4px 0' }}>
                            <Row gutter={16}>
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
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>PDU Name</label>
                                        <Input
                                            value={formData.pduName}
                                            onChange={e => setFormData(p => ({ ...p, pduName: e.target.value }))}
                                            placeholder="e.g., PDU-A"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Phase Name</label>
                                        <Input
                                            value={formData.phaseName}
                                            onChange={e => setFormData(p => ({ ...p, phaseName: e.target.value }))}
                                            placeholder="e.g., Phase A"
                                            size="large"
                                        />
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Rated Capacity (kW)</label>
                                        <InputNumber
                                            value={formData.ratedCapacityKW}
                                            onChange={v => setFormData(p => ({ ...p, ratedCapacityKW: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Estimated Load (kW)</label>
                                        <InputNumber
                                            value={formData.estimatedLoadKW}
                                            onChange={v => setFormData(p => ({ ...p, estimatedLoadKW: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Measured Load (kW)</label>
                                        <InputNumber
                                            value={formData.measuredLoadKW}
                                            onChange={v => setFormData(p => ({ ...p, measuredLoadKW: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Failover Reserved (kW)</label>
                                        <InputNumber
                                            value={formData.failoverReservedKW}
                                            onChange={v => setFormData(p => ({ ...p, failoverReservedKW: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <div style={{
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 6, padding: '10px 14px', fontSize: 12.5, color: '#475569',
                            }}>
                                Headroom = <strong style={{ color: '#1e293b' }}>
                                    {((formData.ratedCapacityKW || 0) - (formData.estimatedLoadKW || 0)).toLocaleString()} kW
                                </strong> (rated − estimated) — how much is left before a new device add exceeds this rack's PDU rating
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16, textAlign: 'right' }}>
                            <Button onClick={closeModal} size="large" style={{ marginRight: 8 }}>Cancel</Button>
                            <Button
                                type="primary" size="large" loading={loading}
                                onClick={handleSubmit}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                            >
                                {editingItem ? 'Update Record' : 'Create Record'}
                            </Button>
                        </div>
                    </div>
                </>
            )}


            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchRecords}
                entityName="RackPowerCapacity"
                apiEndpoint="/RackPowerCapacity/import"
                backendFields={BACKEND_FIELDS}
            />

            <SuccessModal
                visible={successVisible}
                type={successType}
                onClose={() => setSuccessVisible(false)}
            />

            <AuditWidget2 tableName="RackPowerCapacities" />
        </div>
    );
}

export default RackPowerCapacityPage;