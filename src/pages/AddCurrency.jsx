// components/Currency.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Typography,
    Row,
    Col,
    Table,
    Space,
    Button,
    Input,
    Badge,
    Tooltip,
    Switch,
    message,
    Divider,
    Avatar,
    Modal,
    Form,
    Select,
    Tag,
    Pagination,
} from 'antd';
import {
    DollarOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ExclamationCircleOutlined,
    MoneyCollectOutlined,
    BankOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../config';


const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 10;

// ── Extract paginated response ─────────────────────────────────────────────
const extractPaginatedResponse = (res) => {
    console.log("Raw API Response:", res);

    // Case 1: Response has data property with pagination
    if (res?.data && typeof res.data === "object" && "totalRecords" in res.data) {
        return {
            rows: Array.isArray(res.data.data) ? res.data.data : [],
            total: Number(res.data.totalRecords) || 0,
            page: Number(res.data.page) || 1,
            pageSize: Number(res.data.pageSize) || PAGE_SIZE,
        };
    }

    // Case 2: Response itself has pagination
    if (res && typeof res === "object" && "totalRecords" in res) {
        return {
            rows: Array.isArray(res.data) ? res.data : [],
            total: Number(res.totalRecords) || 0,
            page: Number(res.page) || 1,
            pageSize: Number(res.pageSize) || PAGE_SIZE,
        };
    }

    // Case 3: Direct array response
    if (Array.isArray(res)) {
        return { rows: res, total: res.length, page: 1, pageSize: res.length };
    }

    // Case 4: Response.data is array
    if (Array.isArray(res?.data)) {
        return { rows: res.data, total: res.data.length, page: 1, pageSize: res.data.length };
    }

    console.warn("[extractPaginatedResponse] unrecognised shape:", res);
    return { rows: [], total: 0, page: 1, pageSize: PAGE_SIZE };
};

// ── Normalize currency data ────────────────────────────────────────────────
const normalizeCurrencyData = (data) => {
    return data.map((item) => ({
        id: item.id,
        code: item.code || '',
        name: item.name || '',
        symbol: item.symbol || '',
        isActive: item.isActive === true || item.isActive === 'true' || item.isActive === 1,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdAtFormatted: item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : '-',
        updatedAtFormatted: item.updatedAt
            ? new Date(item.updatedAt).toLocaleString()
            : '-',
    }));
};

// ── Inline PaginationBar ───────────────────────────────────────────────────
function PaginationBar({ page, pageSize, total, onChange, loading }) {
    if (total === 0) return null;

    return (
        <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "12px 16px",
            borderTop: "1px solid #f0f0f0",
            background: "#FAFAFA",
            flexShrink: 0,
        }}>
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showTotal={(t) => `Total ${t} currencies`}
                onChange={onChange}
                showSizeChanger={false}
                disabled={loading}
            />
        </div>
    );
}

// ── Stat Card Component ────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
    <div
        style={{
            background: 'white',
            borderRadius: '8px',
            padding: '12px 16px',
            borderTop: `3px solid ${color}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        }}
    >
        <div
            style={{
                width: 40,
                height: 40,
                borderRadius: '40px',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <span style={{ fontSize: '20px', color }}>{icon}</span>
        </div>
        <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>
                {label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1 }}>
                {value}
            </div>
        </div>
    </div>
);

const Currency = () => {
    // ── State ──────────────────────────────────────────────────────────────
    const [currencies, setCurrencies] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Pagination ──
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const currentPageRef = useRef(1);

    // ── Search and Filters ──
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const searchRef = useRef('');
    const statusFilterRef = useRef('all');
    const searchDebounceRef = useRef(null);

    // ── Modal states ──
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState(null);
    const [form] = Form.useForm();

    // ── Sorting ──
    const [sortedInfo, setSortedInfo] = useState({ columnKey: 'id', order: 'ascend' });

    // ── Fetch currencies from API (server-side pagination) ─────────────────
    const fetchCurrencies = useCallback(async (targetPage) => {
        const pg = targetPage ?? currentPageRef.current;
        const search = searchRef.current;
        const status = statusFilterRef.current;

        console.log("Fetching currencies - Page:", pg, "Search:", search, "Status:", status);

        setTableLoading(true);
        try {
            const params = {
                Page: pg,
                PageSize: PAGE_SIZE,
                IsPaginated: true
            };
            if (search?.trim()) params.Search = search.trim();
            // Note: Status filter may need to be implemented on backend
            // If not, we'll filter client-side

            const response = await axiosInstance.get('/Currency/get-all-currency', { params });
            console.log("API Response:", response);

            const { rows, total, page } = extractPaginatedResponse(response);
            console.log("Extracted - Rows:", rows.length, "Total:", total, "Page:", page);

            const normalizedData = normalizeCurrencyData(rows);

            // Apply status filter client-side if backend doesn't support it
            let filteredData = normalizedData;
            if (status !== 'all') {
                filteredData = normalizedData.filter(c =>
                    status === 'active' ? c.isActive : !c.isActive
                );
            }

            setCurrencies(filteredData);
            setTotalRecords(total);
            setCurrentPage(page);
            currentPageRef.current = page;

            console.log("State updated - TotalRecords:", total, "CurrentPage:", page);
        } catch (error) {
            console.error('Error fetching currencies:', error);
            message.error(error?.message || 'Failed to fetch currencies');
            setCurrencies([]);
            setTotalRecords(0);
        } finally {
            setTableLoading(false);
        }
    }, []);

    // ── Reset to page 1 and fetch ─────────────────────────────────────────
    const resetAndFetch = useCallback(() => {
        currentPageRef.current = 1;
        setCurrentPage(1);
        fetchCurrencies(1);
    }, [fetchCurrencies]);

    // ── Search handler — debounced 400ms ────────────────────────────────────
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        searchRef.current = val;

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            resetAndFetch();
        }, 400);
    };

    const handleSearchClear = () => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        setSearchTerm('');
        searchRef.current = '';
        resetAndFetch();
    };

    // ── Status filter handler ──────────────────────────────────────────────
    const handleStatusFilterChange = (val) => {
        setStatusFilter(val);
        statusFilterRef.current = val;
        resetAndFetch();
    };

    // ── Page change ─────────────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        console.log("Page changed to:", newPage);
        currentPageRef.current = newPage;
        setCurrentPage(newPage);
        fetchCurrencies(newPage);
    };

    // ── Load data on mount ─────────────────────────────────────────────────
    useEffect(() => {
        fetchCurrencies(1);
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [fetchCurrencies]);

    // ── Create / Update Currency ───────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload = {
                code: values.code.toUpperCase().trim(),
                name: values.name.trim(),
                symbol: values.symbol?.trim() || null,
                isActive: values.isActive,
            };

            if (editingCurrency) {
                await axiosInstance.post(`/Currency/update-currency/${editingCurrency.id}`, payload);
                message.success('Currency updated successfully!');
            } else {
                await axiosInstance.post('/Currency/add-currency', payload);
                message.success('Currency created successfully!');
            }

            await fetchCurrencies(currentPageRef.current);
            handleCloseModal();
        } catch (error) {
            console.error('Submit error:', error);
            if (error?.error || error?.message) {
                message.error(error?.error || error?.message || 'Something went wrong!');
            } else {
                message.error('Failed to save currency. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete Currency with confirmation ───────────────────────────────────
    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete Currency',
            icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: (
                <div>
                    <p>Are you sure you want to delete this currency?</p>
                    <div
                        style={{
                            background: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '6px',
                            marginTop: '12px',
                        }}
                    >
                        <p style={{ margin: 0 }}>
                            <strong>Code:</strong> {record.code}
                        </p>
                        <p style={{ margin: '8px 0 0 0' }}>
                            <strong>Name:</strong> {record.name}
                        </p>
                        {record.symbol && (
                            <p style={{ margin: '8px 0 0 0' }}>
                                <strong>Symbol:</strong> {record.symbol}
                            </p>
                        )}
                    </div>
                    <p style={{ color: '#ff7875', marginTop: '12px', fontSize: '12px' }}>
                        This action cannot be undone.
                    </p>
                </div>
            ),
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    setSubmitting(true);
                    await axiosInstance.delete(`/Currency/remove-currency/${record.id}`);
                    message.success('Currency deleted successfully!');

                    // Handle pagination after delete
                    const remainingItems = totalRecords - 1;
                    const newPage = remainingItems <= (currentPage - 1) * PAGE_SIZE && currentPage > 1
                        ? currentPage - 1
                        : currentPage;

                    currentPageRef.current = newPage;
                    setCurrentPage(newPage);
                    await fetchCurrencies(newPage);
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error(error?.message || 'Failed to delete currency');
                } finally {
                    setSubmitting(false);
                }
            },
        });
    };

    // ── Toggle Currency Status ──────────────────────────────────────────────
    const handleStatusToggle = async (record, checked) => {
        try {
            setTableLoading(true);
            await axiosInstance.patch(`/Currency/restore-currency/${record.id}/status`, { isActive: checked });
            message.success(`Currency ${checked ? 'activated' : 'deactivated'} successfully!`);
            await fetchCurrencies(currentPageRef.current);
        } catch (error) {
            console.error('Status toggle error:', error);
            message.error(error?.message || 'Failed to update status');
        } finally {
            setTableLoading(false);
        }
    };

    // ── Modal handlers ──────────────────────────────────────────────────────
    const handleOpenCreateModal = () => {
        setEditingCurrency(null);
        form.resetFields();
        form.setFieldsValue({ isActive: true });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (record) => {
        setEditingCurrency(record);
        form.setFieldsValue({
            code: record.code,
            name: record.name,
            symbol: record.symbol,
            isActive: record.isActive,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCurrency(null);
        form.resetFields();
    };

    // ── Client-side sorting ─────────────────────────────────────────────────
    const getSortedData = () => {
        if (!sortedInfo.columnKey || !sortedInfo.order) return currencies;

        return [...currencies].sort((a, b) => {
            let valA, valB;
            switch (sortedInfo.columnKey) {
                case 'id':
                    return sortedInfo.order === 'ascend' ? a.id - b.id : b.id - a.id;
                case 'code':
                    valA = a.code || '';
                    valB = b.code || '';
                    break;
                case 'name':
                    valA = a.name || '';
                    valB = b.name || '';
                    break;
                case 'isActive':
                    valA = a.isActive ? 1 : 0;
                    valB = b.isActive ? 1 : 0;
                    break;
                case 'createdAt':
                    valA = new Date(a.createdAt || 0);
                    valB = new Date(b.createdAt || 0);
                    return sortedInfo.order === 'ascend' ? valA - valB : valB - valA;
                default:
                    return 0;
            }

            const cmp = String(valA).localeCompare(String(valB));
            return sortedInfo.order === 'ascend' ? cmp : -cmp;
        });
    };

    const sortedCurrencies = getSortedData();

    // ── Table Columns Configuration ─────────────────────────────────────────
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order,
            render: (id, record, index) => (
                <Text style={{ fontSize: 12 }}>{index + 1}</Text>
            ),
        },
        {
            title: 'Currency Code',
            dataIndex: 'code',
            key: 'code',
            width: 130,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'code' ? sortedInfo.order : null,
            render: (code, record) => (
                <Space>
                    <Avatar
                        icon={<DollarOutlined />}
                        style={{
                            backgroundColor: '#1890ff',
                            flexShrink: 0,
                            width: 28,
                            height: 28,
                        }}
                    />
                    <div>
                        <Text strong style={{ fontSize: '13px' }}>
                            {code || '-'}
                        </Text>
                        {record.symbol && (
                            <div>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    Symbol: {record.symbol}
                                </Text>
                            </div>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Currency Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
            render: (name) => (
                <Text style={{ fontSize: '13px' }}>{name || '-'}</Text>
            ),
        },
        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'symbol',
            width: 100,
            render: (symbol) => (
                <Tag color="geekblue" style={{ fontSize: '12px' }}>
                    {symbol || '-'}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAtFormatted',
            key: 'createdAt',
            width: 170,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'createdAt' ? sortedInfo.order : null,
            render: (date) => (
                <Text style={{ fontSize: '11px', color: '#666' }}>
                    {date || '-'}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 130,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'isActive' ? sortedInfo.order : null,
            render: (isActive, record) => (
                <Space>
                    <Switch
                        size="small"
                        checked={isActive}
                        onChange={(checked) => handleStatusToggle(record, checked)}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        style={{
                            backgroundColor: isActive ? '#52c41a' : '#ff4d4f',
                        }}
                    />
                    <Badge
                        status={isActive ? 'success' : 'default'}
                        text={
                            <span style={{ fontSize: '11px' }}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        }
                    />
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditModal(record)}
                            style={{ color: '#1890ff' }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                            style={{ color: '#ff4d4f' }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Handle table change (sorting)
    const handleTableChange = (_, __, sorter) => {
        if (sorter && sorter.columnKey) {
            setSortedInfo({ columnKey: sorter.columnKey, order: sorter.order });
        }
    };

    // Statistics
    const totalCount = totalRecords;
    const activeCount = currencies.filter((c) => c.isActive).length;
    const inactiveCount = currencies.filter((c) => !c.isActive).length;

    // ──────────────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f0f2f5',
                padding: '16px 24px',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            {/* Header Section */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexShrink: 0,
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        <MoneyCollectOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Currency Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Manage all currencies, their codes, symbols, and status
                    </Text>
                </div>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreateModal}
                    >
                        Add Currency
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchCurrencies(currentPageRef.current)}
                        loading={tableLoading}
                    >
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: '16px', flexShrink: 0 }}>
                <Col span={8}>
                    <StatCard
                        label="Total Currencies"
                        value={totalCount}
                        color="#1890ff"
                        icon={<MoneyCollectOutlined />}
                    />
                </Col>
                <Col span={8}>
                    <StatCard
                        label="Active Currencies"
                        value={activeCount}
                        color="#52c41a"
                        icon={<CheckCircleOutlined />}
                    />
                </Col>
                <Col span={8}>
                    <StatCard
                        label="Inactive Currencies"
                        value={inactiveCount}
                        color="#8c8c8c"
                        icon={<StopOutlined />}
                    />
                </Col>
            </Row>

            {/* Filters Section */}
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
            >
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={14} md={14} lg={14}>
                        <Input
                            placeholder="Search by code, name, or symbol..."
                            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            allowClear
                            onClear={handleSearchClear}
                            size="middle"
                        />
                    </Col>
                    <Col xs={24} sm={8} md={8} lg={8}>
                        <Select
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            style={{ width: '100%' }}
                            allowClear={false}
                        >
                            <Option value="all">All Status</Option>
                            <Option value="active">Active Only</Option>
                            <Option value="inactive">Inactive Only</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={2} md={2} lg={2} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: '12px', color: '#888' }}>
                            {currencies.length} / {totalCount}
                        </Text>
                    </Col>
                </Row>
            </div>

            {/* Table Section with Pagination */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Text strong style={{ fontSize: '14px' }}>
                        <BankOutlined style={{ marginRight: 6 }} />
                        Currencies List
                    </Text>
                    <Badge count={totalCount} style={{ backgroundColor: '#1890ff' }} />
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={sortedCurrencies}
                        loading={tableLoading}
                        rowKey="id"
                        size="middle"
                        scroll={{ x: 900 }}
                        pagination={false}
                        onChange={handleTableChange}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <DollarOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                                    <p style={{ color: '#999', marginTop: '16px' }}>
                                        {searchTerm.trim()
                                            ? `No results found for "${searchTerm.trim()}"`
                                            : 'No currencies found. Click "Add Currency" to create one.'}
                                    </p>
                                </div>
                            ),
                        }}
                    />
                </div>

                {/* Pagination Bar */}
                {totalRecords > 0 && (
                    <PaginationBar
                        page={currentPage}
                        pageSize={PAGE_SIZE}
                        total={totalRecords}
                        onChange={handlePageChange}
                        loading={tableLoading}
                    />
                )}
            </div>


            {/* Add/Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingCurrency ? <EditOutlined /> : <PlusOutlined />}
                        <span>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</span>
                    </Space>
                }
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="cancel" onClick={handleCloseModal}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={submitting}
                        onClick={handleSubmit}
                    >
                        {submitting
                            ? 'Saving...'
                            : editingCurrency
                                ? 'Update Currency'
                                : 'Create Currency'}
                    </Button>,
                ]}
                width={520}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
                    <Form.Item
                        name="code"
                        label="Currency Code"
                        rules={[
                            { required: true, message: 'Please enter currency code' },
                            { min: 2, message: 'Code must be at least 2 characters' },
                            { max: 3, message: 'Code cannot exceed 3 characters' },
                            {
                                pattern: /^[A-Za-z]+$/,
                                message: 'Code must contain only letters',
                            },
                        ]}
                    >
                        <Input
                            placeholder="e.g., USD, EUR, INR"
                            style={{ textTransform: 'uppercase' }}
                            maxLength={3}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Currency Name"
                        rules={[{ required: true, message: 'Please enter currency name' }]}
                    >
                        <Input placeholder="e.g., US Dollar, Euro, Indian Rupee" />
                    </Form.Item>

                    <Form.Item name="symbol" label="Currency Symbol">
                        <Input placeholder="e.g., $, €, ₹" maxLength={5} />
                    </Form.Item>

                    <Form.Item
                        name="isActive"
                        label="Status"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                            style={{ backgroundColor: '#1890ff' }}
                        />
                    </Form.Item>

                    <Divider style={{ margin: '16px 0 0 0' }} />
                    <div style={{ background: '#fafafa', padding: '12px', borderRadius: '6px', marginTop: '16px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <DollarOutlined style={{ marginRight: '4px' }} />
                            Currency information will be used across the system for pricing and formatting.
                        </Text>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Currency;