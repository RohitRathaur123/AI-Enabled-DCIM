// Rack.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Typography, Row, Col, Table, Space, Button,
    Input, message, Tag, Badge, Tooltip, Select, Pagination, InputNumber,
} from 'antd';
import {
    DatabaseOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, EditOutlined, CheckCircleOutlined, PoweroffOutlined,
    CloseOutlined, BorderOutlined, DashboardOutlined,
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

// ── Status options — free-text field, but we pin values for consistency ────
const statusOptions = ['Full', 'Faulty', 'Under-maintenance', 'Reserved', 'Decommissioned'];

const statusColor = (status) => {
    switch (status) {
        case 'Full': return 'success';
        case 'Faulty': return 'error';
        case 'Under-maintenance': return 'warning';
        case 'Reserved': return 'processing';
        case 'Decommissioned': return 'default';
        default: return 'default';
    }
};

/////import rack file import
export const RACK_BACKEND_FIELDS = [
    { key: "roomId", label: "Room", required: true, color: "red", hint: "Select the room this rack belongs to" },
    { key: "rackName", label: "Rack Name", required: true, color: "blue", hint: "e.g. rack-01, rack-02" },
    { key: "totalUHeight", label: "Total U Height", required: true, color: "purple", hint: "e.g. 42, 45, 60" },
    { key: "status", label: "Status", required: false, color: "cyan", hint: "e.g. Empty, Full, Partial" },
    { key: "maxWeightCapacityKg", label: "Max Weight Capacity (Kg)", required: false, color: "orange", hint: "e.g. 160, 200" },
    { key: "positionX", label: "Position X", required: false, color: "default", hint: "X coordinate in room layout" },
    { key: "positionY", label: "Position Y", required: false, color: "default", hint: "Y coordinate in room layout" },
];

// ── Normalize ─────────────────────────────────────────────────────────────────
const normalize = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    roomId: obj.roomId ?? obj.RoomId,
    roomName: obj.roomName ?? obj.RoomName ?? obj.room?.name ?? '',
    floorId: obj.floorId ?? obj.FloorId ?? obj.room?.floorId ?? null,
    floorName: obj.floorName ?? obj.FloorName ?? obj.room?.floor?.name ?? '',
    rackName: obj.rackName ?? obj.RackName,
    totalUHeight: obj.totalUHeight ?? obj.TotalUHeight ?? 0,
    status: obj.status ?? obj.Status ?? '',
    maxWeightCapacityKg: obj.maxWeightCapacityKg ?? obj.MaxWeightCapacityKg ?? null,
    positionX: obj.positionX ?? obj.PositionX ?? null,
    positionY: obj.positionY ?? obj.PositionY ?? null,
    isActive: obj.isActive ?? obj.IsActive ?? true,
});

const normalizeRoom = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID,
    floorId: obj.floorId ?? obj.FloorId,
    name: obj.name ?? obj.Name,
    isActive: obj.isActive ?? obj.IsActive ?? true,
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
    console.warn('[Rack] unrecognised response shape:', response);
    return { rows: [], total: 0 };
};

const extractList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

// ─────────────────────────────────────────────────────────────────────────────
function RackPage() {

    // ── Pagination + Search state ─────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const currentPageRef = useRef(1);

    const [showExportModal, setShowExportModal] = useState(false)
    const [searchText, setSearchText] = useState('');
    const searchTimerRef = useRef(null);

    // ── Cascading filters: Floor → Room, plus Status ──────────────────────
    const [floorFilter, setFloorFilter] = useState(null);
    const [roomFilter, setRoomFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const floorFilterRef = useRef(null);
    const roomFilterRef = useRef(null);
    const statusFilterRef = useRef(null);




    // ── Data state ────────────────────────────────────────────────────────
    const [racks, setRacks] = useState([]);
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);          // rooms scoped to selected floor (filter bar)
    const [formRooms, setFormRooms] = useState([]);  // rooms scoped to selected floor (add/edit modal)
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [showImportModal, setShowImportModal] = useState(false)
    const [successVisible, setSuccessVisible] = useState(false);
    const [successType, setSuccessType] = useState('add');

    const emptyForm = {
        floorId: null, roomId: null, rackName: '', totalUHeight: null,
        status: null, maxWeightCapacityKg: null, positionX: null, positionY: null,
    };
    const emptyErr = { roomId: '', rackName: '', totalUHeight: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErr);

    const [rackfile, setRackFile] = useState([]);

    const fetchRackFile = async () => {
        try {
            const res = await axiosdevice.get('/Rack/get-all-racks', { params: { IsPaginated: false } });
            const rows = extractList(res?.data ?? res);
            setRackFile(rows.map(normalize));
        } catch (error) {
            console.log('fetchRackFile error:', error);
        }
    };

    // ── fetchRacks — Search + RoomId + FloorId + Status sab server ko jayenge ──
    const fetchRacks = useCallback(async (targetPage, searchQuery, floorId, roomId, status) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchQuery ?? searchText;
        const flId = floorId !== undefined ? floorId : floorFilterRef.current;
        const rmId = roomId !== undefined ? roomId : roomFilterRef.current;
        const st = status !== undefined ? status : statusFilterRef.current;

        setLoading(true);
        try {
            const params = {
                Page: pg,
                PageSize: PAGE_SIZE,
                IsPaginated: true,
            };
            if (search && search.trim()) params.Search = search.trim();
            if (flId) params.FloorId = flId;
            if (rmId) params.RoomId = rmId;
            if (st) params.Status = st;

            const response = await axiosdevice.get('/Rack/get-all-racks', { params });
            const { rows, total } = extractPaginated(response);

            console.log('[Rack] page:', pg, 'search:', search || '(none)', 'floor:', flId || '(all)', 'room:', rmId || '(all)', 'status:', st || '(all)', 'rows:', rows.length, 'total:', total);

            setRacks(rows.map(normalize));
            setTotalRecords(total);
        } catch (err) {
            console.error('fetchRacks:', err);
            message.error('Failed to fetch racks');
        } finally {
            setLoading(false);
        }
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── fetchFloors — top-level dropdown source ────────────────────────────
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

    // ── fetchRoomsForFloor — cascading, used by both filter bar and modal ──
    const fetchRoomsForFloor = async (floorId, target /* 'filter' | 'form' */) => {
        if (!floorId) {
            if (target === 'filter') setRooms([]);
            else setFormRooms([]);
            return;
        }
        try {
            const response = await axiosdevice.get('/Room/get-all-rooms', {
                params: { FloorId: floorId, IsPaginated: false },
            });
            const rows = extractList(response);
            const normalized = rows.map(normalizeRoom).filter(r => r.isActive);
            if (target === 'filter') setRooms(normalized);
            else setFormRooms(normalized);
        } catch (err) {
            console.error('fetchRoomsForFloor:', err);
            message.error('Failed to fetch rooms');
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
            fetchRacks(1, val, floorFilterRef.current, roomFilterRef.current, statusFilterRef.current);
        }, 400);
    };

    const handleSearchClear = () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        setSearchText('');
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRacks(1, '', floorFilterRef.current, roomFilterRef.current, statusFilterRef.current);
    };

    // ── Floor filter change — resets Room filter (cascading) ──────────────
    const handleFloorFilterChange = (val) => {
        setFloorFilter(val);
        floorFilterRef.current = val;
        setRoomFilter(null);
        roomFilterRef.current = null;
        fetchRoomsForFloor(val, 'filter');
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRacks(1, searchText, val, null, statusFilterRef.current);
    };

    const handleRoomFilterChange = (val) => {
        setRoomFilter(val);
        roomFilterRef.current = val;
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRacks(1, searchText, floorFilterRef.current, val, statusFilterRef.current);
    };

    const handleStatusFilterChange = (val) => {
        setStatusFilter(val);
        statusFilterRef.current = val;
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchRacks(1, searchText, floorFilterRef.current, roomFilterRef.current, val);
    };

    // ── Page change ───────────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchRacks(newPage, searchText, floorFilterRef.current, roomFilterRef.current, statusFilterRef.current);
    };

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchRacks(1, '', null, null, null);
        fetchFloors();
        fetchRackFile();
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Modal helpers ─────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingItem(null);
        const preFloor = floorFilter ?? null;
        setFormData({ ...emptyForm, floorId: preFloor, roomId: roomFilter ?? null });
        setFormErrors(emptyErr);
        if (preFloor) fetchRoomsForFloor(preFloor, 'form');
        else setFormRooms([]);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingItem(record);
        setFormData({
            floorId: record.floorId || null,
            roomId: record.roomId || null,
            rackName: record.rackName || '',
            totalUHeight: record.totalUHeight || null,
            status: record.status || null,
            maxWeightCapacityKg: record.maxWeightCapacityKg || null,
            positionX: record.positionX ?? null,
            positionY: record.positionY ?? null,
        });
        setFormErrors(emptyErr);
        if (record.floorId) fetchRoomsForFloor(record.floorId, 'form');
        else setFormRooms([]);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); setFormRooms([]); };

    const getRoomLabel = (id) => {
        const r = rooms.find(r => r.id === id) || formRooms.find(r => r.id === id);
        return r ? r.name : null;
    };

    // ── Validation ────────────────────────────────────────────────────────
    const validators = {
        roomId: v => !v ? 'Room is required' : '',
        rackName: v => !v?.trim() ? 'Rack name is required' : v.trim().length > 100 ? 'Max 100 characters' : '',
        totalUHeight: v => !v ? 'Total U height is required' : (v < 1 || v > 60) ? 'Must be between 1 and 60' : '',
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
            roomId: formData.roomId,
            rackName: formData.rackName.trim(),
            totalUHeight: formData.totalUHeight,
            status: formData.status || null,
            maxWeightCapacityKg: formData.maxWeightCapacityKg || 0,
            positionX: formData.positionX ?? 0,
            positionY: formData.positionY ?? 0,
        };

        const isEdit = !!editingItem;
        setLoading(true);
        try {
            if (isEdit) {
                await axiosdevice.post(`/Rack/${editingItem.id}/update-rack`, { ...payload, isActive: editingItem.isActive });
                setSuccessType('edit');
            } else {
                await axiosdevice.post('/Rack/add-rack', payload);
                setSuccessType('add');
            }
            await fetchRacks(currentPageRef.current, searchText, floorFilterRef.current, roomFilterRef.current, statusFilterRef.current);
            fetchRackFile();
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
            await axiosdevice.patch(`/Rack/${record.id}/set-active`, null, { params: { isActive: nextState } });
            message.success(`Rack ${nextState ? 'activated' : 'deactivated'} successfully!`);
            await fetchRacks(currentPageRef.current, searchText, floorFilterRef.current, roomFilterRef.current, statusFilterRef.current);
            fetchRackFile();
        } catch (err) {
            console.error('handleToggleActive:', err);
            message.error(err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────
    const totalRoomsUsed = new Set(racks.map(r => r.roomId).filter(Boolean)).size;
    const activeCount = racks.filter(r => r.isActive).length;
    const faultyCount = racks.filter(r => r.status === 'Faulty').length;

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
            title: 'Rack', dataIndex: 'rackName', key: 'rackName', width: 150,
            sorter: (a, b) => (a.rackName || "").localeCompare(b.rackName || ""),
            render: (name) => (
                <Space size={6}>
                    <DatabaseOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                    <Text strong style={{ fontSize: 12, color: '#1e293b' }}>{name || '-'}</Text>
                </Space>
            ),
        },
        {
            title: 'Room', dataIndex: 'roomId', key: 'room', width: 140,
            sorter: (a, b) => {
                const nameA = a.roomName || getRoomLabel(a.roomId) || '';
                const nameB = b.roomName || getRoomLabel(b.roomId) || '';
                return nameA.localeCompare(nameB);
            },
            render: (roomId, r) => {
                const rname = r.roomName || getRoomLabel(roomId);
                return rname
                    ? <Tag color="geekblue" style={{ fontSize: 11 }}>{rname}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            title: 'U Height', dataIndex: 'totalUHeight', key: 'totalUHeight', width: 90,
            sorter: (a, b) => (Number(a.totalUHeight) || 0) - (Number(b.totalUHeight) || 0),
            render: v => <Text style={{ fontSize: 12 }}>{v ? `${v}U` : '-'}</Text>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 130,
            render: text => text
                ? <Tag color={statusColor(text)} style={{ fontSize: 11 }}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            title: 'Max Weight (Kg)', dataIndex: 'maxWeightCapacityKg', key: 'maxWeight', width: 130,
            sorter: (a, b) => (Number(a.maxWeightCapacityKg) || 0) - (Number(b.maxWeightCapacityKg) || 0),
            render: v => <Text style={{ fontSize: 12, color: '#64748b' }}>{v ? Number(v).toLocaleString() : '-'}</Text>,
        },
        {
            title: 'Position (X, Y)', key: 'position', width: 120,
            render: (_, r) => (
                (r.positionX != null || r.positionY != null)
                    ? <Text style={{ fontSize: 12, color: '#64748b' }}>{r.positionX ?? 0}, {r.positionY ?? 0}</Text>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
            ),
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
                        <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Rack Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Manage physical server racks / cabinets within each room
                    </Text>
                </div>
                <Space>
                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>

                    <Button
                        type="primary" icon={<PlusOutlined />} onClick={openAddModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                    >
                        Add Rack
                    </Button>

                    <Button onClick={() => setShowExportModal(true)}>Export File</Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            fetchRacks(currentPageRef.current, searchText, floorFilterRef.current, roomFilterRef.current, statusFilterRef.current);
                        }}
                    >
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* STAT CARDS */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                {[
                    { label: 'Total Racks', value: totalRecords, color: '#1890ff', icon: <DatabaseOutlined /> },
                    { label: 'Rooms Used', value: totalRoomsUsed, color: '#13c2c2', icon: <BorderOutlined /> },
                    { label: 'Active (this page)', value: activeCount, color: '#52c41a', icon: <CheckCircleOutlined /> },
                    { label: 'Faulty (this page)', value: faultyCount, color: '#ff4d4f', icon: <DashboardOutlined /> },
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
                <Row gutter={12} align="middle" wrap={false}>
                    <Col xs={24} md={6}>
                        <Input
                            placeholder="Search by rack name..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchText}
                            onChange={handleSearchChange}
                            onClear={handleSearchClear}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={4}>
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
                    <Col xs={12} md={4}>
                        <Select
                            value={roomFilter}
                            onChange={handleRoomFilterChange}
                            style={{ width: '100%' }}
                            placeholder={floorFilter ? "Filter by room" : "Select floor first"}
                            allowClear
                            disabled={!floorFilter}
                            showSearch
                            optionFilterProp="children"
                        >
                            {rooms.map(r => (
                                <Option key={r.id} value={r.id}>{r.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={12} md={3}>
                        <Select
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            style={{ width: '100%' }}
                            placeholder="Filter by status"
                            allowClear
                        >
                            {statusOptions.map(s => (
                                <Option key={s} value={s}>{s}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={12} md={3} style={{ textAlign: 'right' }}>
                        <AuditWidget tableName="Racks" />
                    </Col>
                    <Col xs={24} md={4} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                            {racks.length} / {totalRecords} racks
                            {searchText.trim() && (
                                <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                                    "{searchText.trim()}" filtered
                                </Tag>
                            )}
                        </Text>
                    </Col>
                </Row>
                {/* <Row style={{ marginTop: 8 }}>
                    <Col span={24}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                            {racks.length} / {totalRecords} racks
                            {searchText.trim() && (
                                <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                                    "{searchText.trim()}" filtered
                                </Tag>
                            )}
                        </Text>
                    </Col>
                </Row> */}
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
                    <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Racks List</Text>
                    <Badge count={totalRecords} overflowCount={9999} style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={racks}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        scroll={{ x: 1100 }}
                        pagination={false}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <DatabaseOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />
                                    <p style={{ color: '#94a3b8', marginTop: 16 }}>
                                        {searchText.trim()
                                            ? `No results found for "${searchText.trim()}"`
                                            : 'No racks found. Click "Add Rack" to create one.'
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
                                {editingItem ? 'Edit Rack' : 'Add New Rack'}
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
                                            onChange={v => {
                                                setFormData(p => ({ ...p, floorId: v, roomId: null }));
                                                fetchRoomsForFloor(v, 'form');
                                                validate('roomId', null);
                                            }}
                                            style={{ width: '100%' }} size="large" placeholder="Select floor"
                                            showSearch optionFilterProp="children"
                                            notFoundContent={<Text type="secondary">No active floors found</Text>}
                                        >
                                            {floors.map(f => (
                                                <Option key={f.id} value={f.id}>
                                                    {f.name}{f.siteName ? ` · ${f.siteName}` : ''}
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Room <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Select
                                            value={formData.roomId}
                                            onChange={v => { setFormData(p => ({ ...p, roomId: v })); validate('roomId', v); }}
                                            style={{ width: '100%' }} size="large"
                                            placeholder={formData.floorId ? "Select room" : "Select floor first"}
                                            disabled={!formData.floorId}
                                            showSearch optionFilterProp="children"
                                            status={formErrors.roomId ? 'error' : ''}
                                            notFoundContent={<Text type="secondary">No active rooms found</Text>}
                                        >
                                            {formRooms.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                                        </Select>
                                        {errText(formErrors.roomId)}
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={16}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Rack Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <Input
                                            value={formData.rackName}
                                            onChange={e => { setFormData(p => ({ ...p, rackName: e.target.value })); validate('rackName', e.target.value); }}
                                            onBlur={() => validate('rackName', formData.rackName)}
                                            placeholder="e.g., Rack-01"
                                            maxLength={100}
                                            size="large" status={formErrors.rackName ? 'error' : ''}
                                        />
                                        {errText(formErrors.rackName)}
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Total U Height <span style={{ color: '#ff4d4f' }}>*</span></label>
                                        <InputNumber
                                            value={formData.totalUHeight}
                                            onChange={v => { setFormData(p => ({ ...p, totalUHeight: v })); validate('totalUHeight', v); }}
                                            style={{ width: '100%' }} size="large" min={1} max={60} placeholder="42"
                                            status={formErrors.totalUHeight ? 'error' : ''}
                                        />
                                        {errText(formErrors.totalUHeight)}
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Status</label>
                                        <Select
                                            value={formData.status}
                                            onChange={v => setFormData(p => ({ ...p, status: v }))}
                                            style={{ width: '100%' }} size="large"
                                            placeholder="Select status" allowClear
                                        >
                                            {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
                                        </Select>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Max Weight Capacity (Kg)</label>
                                        <InputNumber
                                            value={formData.maxWeightCapacityKg}
                                            onChange={v => setFormData(p => ({ ...p, maxWeightCapacityKg: v }))}
                                            style={{ width: '100%' }} size="large" min={0} placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Position X</label>
                                        <InputNumber
                                            value={formData.positionX}
                                            onChange={v => setFormData(p => ({ ...p, positionX: v }))}
                                            style={{ width: '100%' }} size="large" placeholder="0"
                                        />
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={lbl}>Position Y</label>
                                        <InputNumber
                                            value={formData.positionY}
                                            onChange={v => setFormData(p => ({ ...p, positionY: v }))}
                                            style={{ width: '100%' }} size="large" placeholder="0"
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, textAlign: 'right' }}>
                            <Button onClick={closeModal} size="large" style={{ marginRight: 8 }}>Cancel</Button>
                            <Button
                                type="primary" size="large" loading={loading}
                                onClick={handleSubmit}
                                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                            >
                                {editingItem ? 'Update Rack' : 'Create Rack'}
                            </Button>
                        </div>
                    </div>
                </>
            )}


            {/* <ImportRoomFile
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={() => fetchRacks(currentPageRef.current, searchText)}
            /> */}

            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchRacks}
                entityName="Rack"
                apiEndpoint="/Rack/import"
                backendFields={RACK_BACKEND_FIELDS}
            />


            <ExcelExport
                open={showExportModal}
                onClose={() => setShowExportModal(false)}
                searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                apiUrl="/Rack/Export"
                fileNamePrefix="RackExport"
            />

            <SuccessModal
                visible={successVisible}
                type={successType}
                onClose={() => setSuccessVisible(false)}
            />

            <AuditWidget2 tableName="Racks" />
        </div>
    );
}

export default RackPage;