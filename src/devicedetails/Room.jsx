// Room.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Typography, Row, Col, Table, Space, Button,
    Input, message, Tag, Badge, Tooltip, Select, Pagination, InputNumber,
} from 'antd';
import {
    HomeOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, EditOutlined,
    CloseOutlined, CheckCircleOutlined, BorderOutlined, PoweroffOutlined, EyeOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import { axiosdevice } from "../../config";
import AuditWidget from '../entity/livetoaster';
import AuditWidget2 from '../entity/notify';
import { SuccessModal } from '../entity/popUp';
import ExcelExport from '../entity/excelexport';

const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

// ── Normalize ─────────────────────────────────────────────────────────────────
const normalize = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    floorId: obj.floorId ?? obj.FloorId,
    floorName: obj.floorName ?? obj.FloorName ?? obj.floor?.name ?? '',
    name: obj.name ?? obj.Name,
    roomAreaSqFt: obj.roomAreaSqFt ?? obj.RoomAreaSqFt ?? 0,
    reservedAreaSqFt: obj.reservedAreaSqFt ?? obj.ReservedAreaSqFt ?? 0,
    internalUseAreaSqFt: obj.internalUseAreaSqFt ?? obj.InternalUseAreaSqFt ?? 0,
    isActive: obj.isActive ?? obj.IsActive ?? true,
    positionX: obj.positionX ?? obj.PositionX ?? 0,
    positionY: obj.positionY ?? obj.PositionY ?? 0,
    width: obj.width ?? obj.Width ?? 0,
    length: obj.length ?? obj.Length ?? 0,
    rotationAngle: obj.rotationAngle ?? obj.RotationAngle ?? 0,
});

const normalizeFloor = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    name: obj.name ?? obj.Name,
    siteName: obj.siteName ?? obj.SiteName ?? '',
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
    console.warn('[Room] unrecognised response shape:', response);
    return { rows: [], total: 0 };
};

const extractList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const usableArea = (r) => {
    const total = Number(r.roomAreaSqFt) || 0;
    const reserved = Number(r.reservedAreaSqFt) || 0;
    const internal = Number(r.internalUseAreaSqFt) || 0;
    const usable = total - reserved - internal;
    return usable > 0 ? usable : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
function RoomManager() {

    // ── Pagination + Search state ─────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const currentPageRef = useRef(1);

    const [searchText, setSearchText] = useState('');
    const searchTimerRef = useRef(null);

    // ── Floor filter (cascading) ────────────────────────────────────────
    const [floorFilter, setFloorFilter] = useState(null);
    const floorFilterRef = useRef(null);

    // ── Data state ────────────────────────────────────────────────────────
    const [rooms, setRooms] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState('add');

    const [viewmodel, setviewmodel] = useState(false);
    const [viewdetails, setviewdetails] = useState({});
    const [viewLoading, setViewLoading] = useState(false);


    const [showExportModal, setShowExportModal] = useState(false)

    const fetchRoomDetails = async (id) => {
        setViewLoading(true);
        try {
            const res = await axiosdevice.get(`/Room/${id}/get-room`);
            const raw = res?.data?.data ?? res?.data ?? res;
            setviewdetails(normalize(raw));
        } catch (error) {
            console.log('error in getting room details', error);
            message.error('Failed to load room details');
        } finally {
            setViewLoading(false);
        }
    };

    const openviewModel = (id) => {
        setviewmodel(true);
        setviewdetails({});
        fetchRoomDetails(id);
    };

    const closeViewModel = () => {
        setviewmodel(false);
        setviewdetails({});
    };

    const emptyForm = {
        floorId: null, name: '', roomAreaSqFt: null, reservedAreaSqFt: null, internalUseAreaSqFt: null,
        positionX: 0, positionY: 0, width: 0, length: 0, rotationAngle: 0

    };
    const emptyErr = { floorId: '', name: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErr);

    const [roomfile, setRoomFile] = useState([]);

    const fetchRoomFile = async () => {
        try {
            const res = await axiosdevice.get('/Room/get-all-rooms', { params: { IsPaginated: false } });
            const rows = extractList(res?.data ?? res);
            setRoomFile(rows.map(normalize));
        } catch (error) {
            console.log('fetchRoomFile error:', error);
        }
    };

    // ── fetchRooms — Search + FloorId dono server ko jayenge ─────────────
    const fetchRooms = useCallback(async (targetPage, searchQuery, floorId) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchQuery ?? searchText;
        const flId = floorId !== undefined ? floorId : floorFilterRef.current;

        setLoading(true);
        try {
            const params = {
                Page: pg,
                PageSize: PAGE_SIZE,
                IsPaginated: true,
            };
            if (search && search.trim()) params.Search = search.trim();
            if (flId) params.FloorId = flId;

            const response = await axiosdevice.get('/Room/get-all-rooms', { params });
            const { rows, total } = extractPaginated(response);

            console.log('[Room] page:', pg, 'search:', search || '(none)', 'floor:', flId || '(all)', 'rows:', rows.length, 'total:', total);

            setRooms(rows.map(normalize));
            setTotalRecords(total);
        } catch (err) {
            console.error('fetchRooms:', err);
            message.error('Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── fetchFloors — dropdown source ────────────────────────────────────
    const fetchFloors = async () => {
        try {
            const response = await axiosdevice.get('/Floor/get-all-floors', { params: { IsPaginated: false } });
            const rows = extractList(response);
            setFloors(rows.map(normalizeFloor).filter(f => f.isActive));
        } catch (err) {
            console.error('fetchFloors:', err);
            message.error('Failed to fetch floors');
        }
    };

    // ── Search input handler — debounced 400ms + page reset ─────────
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchText(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            currentPageRef.current = 1;
            setCurrentPage(1);
            fetchRooms(1, val, floorFilterRef.current);
        }, 400);
    };

    const handleSearchClear = () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setSearchText('');
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRooms(1, '', floorFilterRef.current);
    };

    // ── Floor filter handler — cascading dropdown, page reset ────────────
    const handleFloorFilterChange = (val) => {
        setFloorFilter(val);
        floorFilterRef.current = val;
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRooms(1, searchText, val);
    };

    // ── Page change ───────────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchRooms(newPage, searchText, floorFilterRef.current);
    };

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchRooms(1, '', null);
        fetchFloors();
        fetchRoomFile();
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Modal helpers ─────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ ...emptyForm, floorId: floorFilter ?? floors[0]?.id ?? null });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingItem(record);
        setFormData({
            floorId: record.floorId || null,
            name: record.name || '',
            roomAreaSqFt: record.roomAreaSqFt || null,
            reservedAreaSqFt: record.reservedAreaSqFt || null,
            internalUseAreaSqFt: record.internalUseAreaSqFt || null,
        });
        setFormErrors(emptyErr);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); };
    const getFloorName = (id) => {
        const f = floors.find(f => f.id === id);
        return f ? (f.siteName ? `${f.name} · ${f.siteName}` : f.name) : '—';
    };

    // ── Validation ────────────────────────────────────────────────────────
    const validators = {
        floorId: v => !v ? 'Floor is required' : '',
        name: v => !v?.trim() ? 'Name is required' : v.trim().length > 100 ? 'Max 100 characters' : '',
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
            floorId: formData.floorId,
            name: formData.name.trim(),
            roomAreaSqFt: formData.roomAreaSqFt || 0,
            reservedAreaSqFt: formData.reservedAreaSqFt || 0,
            internalUseAreaSqFt: formData.internalUseAreaSqFt || 0,
        };

        const isEdit = !!editingItem;
        setLoading(true);
        try {
            if (isEdit) {
                await axiosdevice.post(`/Room/${editingItem.id}/update-room`, { ...payload, isActive: editingItem.isActive });
                setSuccessType('edit');
            } else {
                await axiosdevice.post('/Room/add-room', payload);
                setSuccessType('add');
            }
            await fetchRooms(currentPageRef.current, searchText, floorFilterRef.current);
            fetchRoomFile();
            closeModal();
            setSuccessVisible(true);
        } catch (err) {
            console.error('handleSubmit:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    // ── Set-active (Deactivate ki jagah real delete nahi hai) ─────────────
    const handleToggleActive = async (record) => {
        const nextState = !record.isActive;
        setLoading(true);
        try {
            await axiosdevice.patch(`/Room/${record.id}/set-active`, null, { params: { isActive: nextState } });
            message.success(`Room ${nextState ? 'activated' : 'deactivated'} successfully!`);
            await fetchRooms(currentPageRef.current, searchText, floorFilterRef.current);
            fetchRoomFile();
        } catch (err) {
            console.error('handleToggleActive:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────
    const totalFloorsUsed = new Set(rooms.map(r => r.floorId).filter(Boolean)).size;
    const activeCount = rooms.filter(r => r.isActive).length;
    const totalUsableSqFt = rooms.reduce((sum, r) => sum + usableArea(r), 0);

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
            title: 'Room', dataIndex: 'name', key: 'name', width: 170,
            sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
            render: (name) => (
                <Space size={6}>
                    <HomeOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                    <Text strong style={{ fontSize: 12, color: '#1e293b' }}>{name || '-'}</Text>
                </Space>
            ),
        },
        {
            title: 'Floor', dataIndex: 'floorId', key: 'floor', width: 160,
            sorter: (a, b) => {
                const nameA = a.floorName || getFloorName(a.floorId) || '';
                const nameB = b.floorName || getFloorName(b.floorId) || '';
                return nameA.localeCompare(nameB);
            },
            render: (floorId, r) => {
                const fname = r.floorName || getFloorName(floorId);
                return fname && fname !== '—'
                    ? <Tag color="geekblue" style={{ fontSize: 11 }}>{fname}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },

        {
            title: 'PosX', dataIndex: 'positionX', key: 'positionX', width: 80,
            render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'PosY', dataIndex: 'positionY', key: 'positionY', width: 80,
            render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        // {
        //     title: 'Width', dataIndex: 'width', key: 'width', width: 160,
        //     render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        // },
        // {
        //     title: 'Length', dataIndex: 'length', key: 'length', width: 160,
        //     render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        // },
        // {
        //     title: 'Ro Angle', dataIndex: 'rotationAngle', key: 'rotationAngle', width: 160,
        //     render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        // },
        {
            title: 'Total (sq ft)', dataIndex: 'roomAreaSqFt', key: 'total', width: 110,
            sorter: (a, b) => (Number(a.roomAreaSqFt) || 0) - (Number(b.roomAreaSqFt) || 0),
            render: v => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Reserved (sq ft)', dataIndex: 'reservedAreaSqFt', key: 'reserved', width: 130,
            sorter: (a, b) => (Number(a.reservedAreaSqFt) || 0) - (Number(b.reservedAreaSqFt) || 0),
            render: v => <Text style={{ fontSize: 12, color: '#64748b' }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Internal Use (sq ft)', dataIndex: 'internalUseAreaSqFt', key: 'internal', width: 160,
            sorter: (a, b) => (Number(a.internalUseAreaSqFt) || 0) - (Number(b.internalUseAreaSqFt) || 0),
            render: v => <Text style={{ fontSize: 12, color: '#64748b' }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Usable (sq ft)', key: 'usable', width: 120,
            sorter: (a, b) => (Number(a.usable) || 0) - (Number(b.usable) || 0),
            render: (_, r) => {
                const usable = usableArea(r);
                return usable
                    ? <Tag color="green" style={{ fontSize: 11 }}>{usable.toLocaleString()}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        // {
        //     title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 90,
        //     render: (active) => (
        //         <Tag color={active ? 'success' : 'default'} style={{ fontSize: 11 }}>
        //             {active ? 'Active' : 'Inactive'}
        //         </Tag>
        //     ),
        // },
        {
            title: 'Actions', key: 'actions', width: 120, fixed: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="View Details">
                        <Button type="text" size="small" icon={<EyeOutlined />}
                            onClick={() => openviewModel(record.id)} style={{ color: '#52c41a' }} />
                    </Tooltip>
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
                        <HomeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Room Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Manage server rooms / data halls within each floor
                    </Text>
                </div>
                <Space>

                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>

                    <Button
                        type="primary" icon={<PlusOutlined />} onClick={openAddModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                    >
                        Add Room
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/Room/export"
                        fileNamePrefix="Room"
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            fetchRooms(currentPageRef.current, searchText, floorFilterRef.current);
                        }}
                    >
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* STAT CARDS */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                {[
                    { label: 'Total Rooms', value: totalRecords, color: '#1890ff', icon: <HomeOutlined /> },
                    { label: 'Floors Used', value: totalFloorsUsed, color: '#13c2c2', icon: <BorderOutlined /> },
                    { label: 'Active (this page)', value: activeCount, color: '#52c41a', icon: <CheckCircleOutlined /> },
                    { label: 'Usable Area (sq ft)', value: totalUsableSqFt.toLocaleString(), color: '#722ed1', icon: <BorderOutlined /> },
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
                            placeholder="Search by room name..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchText}
                            onChange={handleSearchChange}
                            onClear={handleSearchClear}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            value={floorFilter}
                            onChange={handleFloorFilterChange}
                            style={{ width: '100%' }}
                            placeholder="Filter by floor"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {floors.map(f => (
                                <Option key={f.id} value={f.id}>
                                    {f.name}{f.siteName ? ` · ${f.siteName}` : ''}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={12} md={4} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                            {rooms.length} / {totalRecords} rooms
                            {searchText.trim() && (
                                <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                                    "{searchText.trim()}" filtered
                                </Tag>
                            )}
                        </Text>
                    </Col>
                    <Col xs={24} md={5} style={{ textAlign: 'right' }}>
                        <AuditWidget tableName="Rooms" />
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
                    <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Rooms List</Text>
                    <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={rooms}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        scroll={{ x: 1000 }}
                        pagination={false}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <HomeOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />
                                    <p style={{ color: '#94a3b8', marginTop: 16 }}>
                                        {searchText.trim()
                                            ? `No results found for "${searchText.trim()}"`
                                            : 'No rooms found. Click "Add Room" to create one.'
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
                    <div style={modalBoxStyle('560px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                {editingItem ? 'Edit Room' : 'Add New Room'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} />
                        </div>

                        <div style={{ padding: '4px 0' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Floor <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Select
                                            value={formData.floorId}
                                            onChange={v => { setFormData(p => ({ ...p, floorId: v })); validate('floorId', v); }}
                                            style={{ width: '100%' }} size="large" placeholder="Select floor"
                                            showSearch optionFilterProp="children"
                                            status={formErrors.floorId ? 'error' : ''}
                                            notFoundContent={<Text type="secondary">No active floors found</Text>}
                                        >
                                            {floors.map(f => (
                                                <Option key={f.id} value={f.id}>
                                                    {f.name}{f.siteName ? ` · ${f.siteName}` : ''}
                                                </Option>
                                            ))}
                                        </Select>
                                        {errText(formErrors.floorId)}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Room Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); validate('name', e.target.value); }}
                                            onBlur={() => validate('name', formData.name)}
                                            placeholder="e.g., Server Room A"
                                            maxLength={100}
                                            size="large" status={formErrors.name ? 'error' : ''}
                                        />
                                        {errText(formErrors.name)}
                                    </div>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Total Area (sq ft)</label>
                                        <InputNumber
                                            value={formData.roomAreaSqFt}
                                            onChange={v => setFormData(p => ({ ...p, roomAreaSqFt: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Reserved (sq ft)</label>
                                        <InputNumber
                                            value={formData.reservedAreaSqFt}
                                            onChange={v => setFormData(p => ({ ...p, reservedAreaSqFt: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Internal Use (sq ft)</label>
                                        <InputNumber
                                            value={formData.internalUseAreaSqFt}
                                            onChange={v => setFormData(p => ({ ...p, internalUseAreaSqFt: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Position X</label>
                                        <InputNumber
                                            value={formData.positionX}
                                            onChange={v => setFormData(p => ({ ...p, positionX: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>

                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Position y</label>
                                        <InputNumber
                                            value={formData.positionY}
                                            onChange={v => setFormData(p => ({ ...p, positionY: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Width</label>
                                        <InputNumber
                                            value={formData.width}
                                            onChange={v => setFormData(p => ({ ...p, width: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Length</label>
                                        <InputNumber
                                            value={formData.length}
                                            onChange={v => setFormData(p => ({ ...p, length: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>RotationAngle</label>
                                        <InputNumber
                                            value={formData.rotationAngle}
                                            onChange={v => setFormData(p => ({ ...p, rotationAngle: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <div style={{
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 6, padding: '10px 14px', fontSize: 12.5, color: '#475569',
                            }}>
                                Usable space = <strong style={{ color: '#1e293b' }}>
                                    {usableArea(formData).toLocaleString?.() ?? usableArea(formData)} sq ft
                                </strong> (total − reserved − internal use)
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16, textAlign: 'right' }}>
                            <Button onClick={closeModal} size="large" style={{ marginRight: 8 }}>Cancel</Button>
                            <Button
                                type="primary" size="large" loading={loading}
                                onClick={handleSubmit}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                            >
                                {editingItem ? 'Update Room' : 'Create Room'}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {viewmodel && (
                <>
                    <div style={backdropStyle} onClick={closeViewModel} />
                    <div style={modalBoxStyle('650px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                <HomeOutlined style={{ marginRight: 8 }} />
                                Room Details
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeViewModel} />
                        </div>

                        {viewLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                Loading...
                            </div>
                        ) : (
                            <div style={{ padding: '4px 0' }}>
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Room Name</Text>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                            {viewdetails.name || '-'}
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Floor</Text>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                            {viewdetails.floorName || getFloorName(viewdetails.floorId) || '-'}
                                        </div>
                                    </Col>

                                    <Col span={8}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Position X</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.positionX ?? '-'}</div>
                                    </Col>
                                    <Col span={8}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Position Y</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.positionY ?? '-'}</div>
                                    </Col>
                                    <Col span={8}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Rotation Angle</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.rotationAngle ?? '-'}</div>
                                    </Col>

                                    <Col span={12}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Width</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.width ?? '-'}</div>
                                    </Col>
                                    <Col span={12}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Length</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>{viewdetails.length ?? '-'}</div>
                                    </Col>

                                    <Col span={8}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Total Area (sq ft)</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>
                                            {viewdetails.roomAreaSqFt ? Number(viewdetails.roomAreaSqFt).toLocaleString() : '-'}
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Reserved (sq ft)</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>
                                            {viewdetails.reservedAreaSqFt ? Number(viewdetails.reservedAreaSqFt).toLocaleString() : '-'}
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Internal Use (sq ft)</Text>
                                        <div style={{ fontSize: 14, color: '#1e293b' }}>
                                            {viewdetails.internalUseAreaSqFt ? Number(viewdetails.internalUseAreaSqFt).toLocaleString() : '-'}
                                        </div>
                                    </Col>

                                    <Col span={12}>
                                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>Usable Area (sq ft)</Text>
                                        <div>
                                            <Tag color="green" style={{ fontSize: 12 }}>
                                                {usableArea(viewdetails).toLocaleString()}
                                            </Tag>
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
                        )}

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 20, textAlign: 'right' }}>
                            <Button onClick={closeViewModel} size="large">Close</Button>
                        </div>
                    </div>
                </>
            )}

            <SuccessModal
                visible={successVisible}
                type={successType}
                onClose={() => setSuccessVisible(false)}
            />

            <AuditWidget2 tableName="Rooms" />
        </div>
    );
}

export default RoomManager;