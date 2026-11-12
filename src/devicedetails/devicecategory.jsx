
// DeviceCategory.jsx
import React, { useState, useEffect } from 'react';
import {
    Typography, Row, Col, Table, Space, Button,
    Input, message, Badge, Tooltip, Switch, Modal, Tag, Empty
} from 'antd';
import {
    AppstoreOutlined, PlusOutlined, ReloadOutlined,
    SearchOutlined, EditOutlined, DeleteOutlined,
    CloseOutlined, CheckCircleOutlined, StopOutlined,
    ImportOutlined, LaptopOutlined, EyeOutlined,
    DownloadOutlined
} from '@ant-design/icons';

import ExcelExport from '../entity/excelexport';
import ImportDeviceCategoryModal from './categoryfile';
import { axiosdevice } from '../../config';
import GenericImportModal from './GenericImportFIle';

const { Title, Text } = Typography;

const normalize = (obj) => ({
    ...obj,
    id: obj.id ?? obj.Id ?? obj.ID ?? obj.deviceCategoryId ?? obj.DeviceCategoryId,
    name: obj.name ?? obj.Name,
    remarks: obj.remarks ?? obj.Remarks ?? "",
    isActive: obj.isActive ?? obj.IsActive ?? obj.status === true ?? true,
});


const BACKEND_FIELDS = [
    {
        key: "CategoryName",
        label: "Category Name",
        required: true,
        color: "blue",
        hint: "e.g. Laptop, Printer, Camera",
    },
    {
        key: "CategoryDescription",
        label: "Category Description",
        required: false,
        color: "cyan",
        hint: "e.g. Office Devices, Printing Devices",
    },
];

// ── Devices by Category Modal ─────────────────────────────────────────────────
function CategoryDevicesModal({ open, onClose, category }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !category?.id) return;
        setDevices([]);
        setLoading(true);
        axiosdevice.get(`/DeviceModel/by-category/${category.id}`)
            .then(res => {
                const body = res?.data ?? res;
                console.log("devicedeta", body)
                const arr = Array.isArray(body) ? body
                    : Array.isArray(body?.data) ? body.data
                        : Array.isArray(body?.items) ? body.items
                            : [];
                setDevices(arr);
            })
            .catch(() => { setDevices([]); message.error('Failed to load devices'); })
            .finally(() => setLoading(false));
    }, [open, category?.id]);

    // Group by deviceTypeName for the summary badges
    const typeCounts = devices.reduce((acc, d) => {
        const t = d.deviceTypeName || 'Other';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    const TYPE_COLORS = {
        Laptop: 'blue', Desktop: 'geekblue', Printer: 'cyan',
        Mobile: 'green', Server: 'purple', Other: 'default',
    };

    const columns = [
        {
            title: 'ID', dataIndex: 'deviceId', key: 'deviceId', width: 60,
            render: v => <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>#{v}</span>,
        },
        {
            title: 'Short Name', dataIndex: 'deviceShortName', key: 'deviceShortName', width: 130,
            render: (text, r) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{text || '—'}</div>
                    {r.deviceLongName && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{r.deviceLongName}</div>}
                </div>
            ),
        },
        {
            title: 'Type', dataIndex: 'deviceTypeName', key: 'deviceTypeName', width: 100,
            render: t => <Tag color={TYPE_COLORS[t] || 'default'} style={{ fontSize: 11 }}>{t || '—'}</Tag>,
        },
        {
            title: 'Company', dataIndex: 'companyName', key: 'companyName', width: 100,
            render: t => <span style={{ fontSize: 12, color: '#374151' }}>{t || '—'}</span>,
        },

        {
            title: 'Company', dataIndex: 'companyName', key: 'companyName', width: 100,
            render: t => <span style={{ fontSize: 12, color: '#374151' }}>{t || '—'}</span>,
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Close</Button>}
            width={620}
            centered
            destroyOnClose
            title={
                <Space>
                    <LaptopOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                    <span style={{ fontWeight: 700 }}>
                        Devices — {category?.name}
                    </span>
                    {!loading && (
                        <span style={{
                            background: '#1890ff', color: '#fff',
                            borderRadius: 99, fontSize: 11, fontWeight: 700,
                            padding: '1px 8px',
                        }}>
                            {devices.length}
                        </span>
                    )}
                </Space>
            }
        >
            {/* Type summary chips */}
            {!loading && devices.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {Object.entries(typeCounts).map(([type, count]) => (
                        <Tag key={type} color={TYPE_COLORS[type] || 'default'} style={{ fontSize: 12 }}>
                            {type}: {count}
                        </Tag>
                    ))}
                </div>
            )}

            <Table
                columns={columns}
                dataSource={devices}
                rowKey="deviceId"
                size="small"
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} devices` }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<span style={{ color: '#9CA3AF', fontSize: 13 }}>No devices in this category</span>}
                        />
                    )
                }}
            />
        </Modal>
    );
}

function DeviceCategoryPage() {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFiltered] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [sortedInfo, setSortedInfo] = useState({ columnKey: 'id', order: 'ascend' });
    const [devicecategoryfile, setdevicecategoryfile] = useState([]);


    const [showExportModal, setShowExportModal] = useState(false)

    const emptyForm = { name: '', remarks: '', isActive: true };
    const emptyErr = { name: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErr);

    const fetchdevicecategoryfile = async () => {
        try {
            const res = await axiosdevice.get('/DeviceCategory/get-all-category');
            const body = res?.data ?? res;
            const raw = Array.isArray(body) ? body
                : Array.isArray(body?.data) ? body.data
                    : Array.isArray(body?.items) ? body.items
                        : [];
            setdevicecategoryfile(raw);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const q = searchText.toLowerCase();
        setFiltered(categories.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.remarks?.toLowerCase().includes(q) ||
            String(c.id).includes(q)
        ));
    }, [searchText, categories]);

    const validateName = (v) => {
        if (!v || !v.trim()) return 'Name is required';
        if (v.trim().length < 2) return 'Min 2 characters';
        if (v.trim().length > 100) return 'Max 100 characters';
        return '';
    };
    const validateAll = () => {
        const err = validateName(formData.name);
        setFormErrors({ name: err });
        return !err;
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await axiosdevice.get('/DeviceCategory/get-all-category');
            let raw = [];
            if (Array.isArray(data)) raw = data;
            else if (Array.isArray(data?.data)) raw = data.data;
            else if (Array.isArray(data?.items)) raw = data.items;
            setCategories(raw.map(normalize));
        } catch (err) {
            message.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); fetchdevicecategoryfile(); }, []);

    const openAddModal = () => { setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); setShowModal(true); };
    const openEditModal = (record) => {
        setEditingItem(record);
        setFormData({ name: record.name || '', remarks: record.remarks || '', isActive: record.isActive });
        setFormErrors(emptyErr);
        setShowModal(true);
    };
    const openDeleteModal = (record) => { setItemToDelete(record); setShowDeleteModal(true); };
    const closeModal = () => { setShowModal(false); setEditingItem(null); setFormData(emptyForm); setFormErrors(emptyErr); };
    const closeDeleteModal = () => { setShowDeleteModal(false); setItemToDelete(null); };

    const openDevicesModal = (record) => { setSelectedCategory(record); setShowDevicesModal(true); };

    const handleSubmit = async () => {
        if (!validateAll()) { message.error('Please fix form errors'); return; }
        setLoading(true);
        try {
            const payload = { name: formData.name.trim(), remarks: formData.remarks || '', isActive: formData.isActive };
            if (editingItem) {
                await axiosdevice.post(`/DeviceCategory/update-category${editingItem.id}`, payload);
                message.success('Category updated successfully!');
            } else {
                await axiosdevice.post('/DeviceCategory/create-deviceCategory', payload);
                message.success('Category created successfully!');
            }
            await fetchCategories();
            closeModal();
        } catch (err) {
            message.error(err?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete?.id) { message.error('Invalid category id'); return; }
        setLoading(true);
        try {
            await axiosdevice.post(`/DeviceCategory/soft-delete/${itemToDelete.id}`);
            message.success('Category deleted successfully!');
            await fetchCategories();
            closeDeleteModal();
        } catch (err) {
            message.error(err?.message || 'Failed to delete category');
        } finally {
            setLoading(false);
        }
    };

    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const inactive = categories.filter(c => !c.isActive).length;

    const backdropStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
    };
    const modalBoxStyle = (width) => ({
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        backgroundColor: 'white', padding: '24px',
        borderRadius: '8px', width, maxWidth: '95%',
        maxHeight: '90vh', overflowY: 'auto',
        zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    });
    const lbl = { display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 };
    const errText = (msg) => msg
        ? <Text type="danger" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>{msg}</Text>
        : null;

    const columns = [
        // {
        //     title: 'ID', dataIndex: 'id', key: 'id', width: 70,
        //     sorter: (a, b) => a.id - b.id,
        //     sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order,
        //     render: id => <Text style={{ fontSize: 12 }}>{id}</Text>,
        // },
        {
            title: 'Category Name', dataIndex: 'name', key: 'name', width: 220,
            sorter: (a, b) => a.name?.localeCompare(b.name),
            sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
            render: name => (
                <Space size={8}>
                    <AppstoreOutlined style={{ color: '#1890ff' }} />
                    <Text strong style={{ fontSize: 13 }}>{name || '-'}</Text>
                </Space>
            ),
        },
        {
            title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 300,
            ellipsis: true,
            render: text => <Text style={{ fontSize: 12 }}>{text || '-'}</Text>,
        },
        {
            title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 110,
            sorter: (a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1),
            sortOrder: sortedInfo.columnKey === 'isActive' && sortedInfo.order,
            render: isActive => (
                <Badge
                    status={isActive ? 'success' : 'default'}
                    text={<span style={{ fontSize: 12 }}>{isActive ? 'Active' : 'Inactive'}</span>}
                />
            ),
        },
        {
            title: 'Actions', key: 'actions', width: 130, fixed: 'right',
            render: (_, record) => (
                <Space size={4}>
                    {/* ── View Devices button ── */}
                    <Tooltip title="View Devices in this Category">
                        <Button
                            size="small"
                            icon={<LaptopOutlined />}
                            style={{ color: '#1890ff', borderColor: '#1890ff', fontSize: 11, height: 24, padding: '0 7px' }}
                            onClick={() => openDevicesModal(record)}
                        >
                            Devices
                        </Button>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => openEditModal(record)}
                            style={{ color: '#1890ff' }} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" size="small" icon={<DeleteOutlined />}
                            onClick={() => openDeleteModal(record)}
                            style={{ color: '#ff4d4f' }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            backgroundColor: '#f0f2f5', padding: '16px 12px',
            boxSizing: 'border-box', overflow: 'hidden',
        }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        <AppstoreOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Device Category Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Manage device categories for the system
                    </Text>
                </div>
                <Space>
                    <Button icon={<ImportOutlined />} onClick={() => setShowImportModal(true)}>Import File</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
                        Add Category
                    </Button>

                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/DeviceCategory/export"
                        fileNamePrefix="DeviceCategory"
                    />


                    <Button icon={<ReloadOutlined />} onClick={fetchCategories}>Refresh</Button>
                </Space>
            </div>

            {/* STAT CARDS */}
            <Row gutter={16} style={{ marginBottom: 16, flexShrink: 0 }}>
                {[
                    { label: 'Total Categories', value: total, color: '#1890ff', icon: <AppstoreOutlined /> },
                    { label: 'Active', value: active, color: '#52c41a', icon: <CheckCircleOutlined /> },
                    { label: 'Inactive', value: inactive, color: '#8c8c8c', icon: <StopOutlined /> },
                ].map(({ label, value, color, icon }) => (
                    <Col span={8} key={label}>
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
                                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{label}</div>
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
                <Row gutter={16} align="middle">
                    <Col xs={24} md={18}>
                        <Input
                            placeholder="Search by name, remarks or ID..."
                            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 12, color: '#888' }}>
                            {filteredCategories.length} / {total} categories
                        </Text>
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
                    <Text strong style={{ fontSize: 14 }}>Categories List</Text>
                    <Badge count={filteredCategories.length} style={{ backgroundColor: '#1890ff' }} />
                </div>
                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={filteredCategories}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        scroll={{ x: 860 }}
                        onChange={(_, __, sorter) => setSortedInfo(sorter)}
                        pagination={{
                            pageSize: 10, showSizeChanger: true,
                            showTotal: t => `Total ${t} categories`,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <AppstoreOutlined style={{ fontSize: 48, color: '#ccc' }} />
                                    <p style={{ color: '#999', marginTop: 16 }}>No categories found.</p>
                                </div>
                            )
                        }}
                    />
                </div>
            </div>


            {/* ── Devices Modal ── */}
            <CategoryDevicesModal
                open={showDevicesModal}
                onClose={() => { setShowDevicesModal(false); setSelectedCategory(null); }}
                category={selectedCategory}
            />

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <>
                    <div style={backdropStyle} onClick={closeModal} />
                    <div style={modalBoxStyle('520px')}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                {editingItem ? 'Edit Category' : 'Add New Category'}
                            </Title>
                            <Button type="text" icon={<CloseOutlined />} onClick={closeModal} />
                        </div>
                        <div style={{ padding: '8px 0' }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={lbl}>Category Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                                <Input
                                    value={formData.name}
                                    onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: validateName(e.target.value) })); }}
                                    onBlur={() => setFormErrors(p => ({ ...p, name: validateName(formData.name) }))}
                                    placeholder="Enter category name"
                                    size="large"
                                    status={formErrors.name ? 'error' : ''}
                                />
                                {errText(formErrors.name)}
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={lbl}>Remarks</label>
                                <Input.TextArea
                                    value={formData.remarks}
                                    onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
                                    rows={3} placeholder="Additional notes..." maxLength={500} showCount
                                />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={lbl}>Status</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={checked => setFormData(p => ({ ...p, isActive: checked }))}
                                        checkedChildren="Active" unCheckedChildren="Inactive"
                                        style={{ backgroundColor: formData.isActive ? '#52c41a' : '#ff4d4f' }}
                                    />
                                    <Text style={{ fontSize: 13, fontWeight: 500, color: formData.isActive ? '#52c41a' : '#ff4d4f' }}>
                                        {formData.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </div>
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, textAlign: 'right' }}>
                            <Button onClick={closeModal} size="large" style={{ marginRight: 8 }}>Cancel</Button>
                            <Button type="primary" size="large" loading={loading} onClick={handleSubmit}>
                                {editingItem ? 'Update Category' : 'Create Category'}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && itemToDelete && (
                <>
                    <div style={backdropStyle} onClick={closeDeleteModal} />
                    <div style={{ ...modalBoxStyle('420px'), textAlign: 'center' }}>
                        <DeleteOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
                        <Title level={5} style={{ marginBottom: 8 }}>Confirm Delete</Title>
                        <Text>Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?</Text>
                        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: 6, marginTop: 16, textAlign: 'left' }}>
                            {[['ID', itemToDelete?.id], ['Name', itemToDelete?.name], ['Remarks', itemToDelete?.remarks || '-'], ['Status', itemToDelete?.isActive ? 'Active' : 'Inactive']].map(([k, v]) => (
                                <p key={k} style={{ margin: '4px 0' }}><strong>{k}:</strong> {v}</p>
                            ))}
                        </div>
                        <p style={{ color: '#ff7875', fontSize: 12, marginTop: 16 }}>This action cannot be undone.</p>
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                            <Space>
                                <Button onClick={closeDeleteModal} size="large">Cancel</Button>
                                <Button danger type="primary" loading={loading} onClick={handleDelete} size="large">Delete Category</Button>
                            </Space>
                        </div>
                    </div>
                </>
            )}
            {/* 
            <ImportDeviceCategoryModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchCategories}
            /> */}

            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchCategories}
                entityName="DeviceCategory"
                apiEndpoint="/DeviceCategory/import-deviceCategory"
                backendFields={BACKEND_FIELDS}
            />
        </div>
    );
}

export default DeviceCategoryPage;
