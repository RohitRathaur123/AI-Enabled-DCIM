// AddService.jsx
import React, { useState, useEffect } from "react";
import {
  Table, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Tooltip, Badge, Tag
} from "antd";
import {
  EditOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, CloseOutlined,
  AppstoreOutlined, CustomerServiceOutlined, DollarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const SERVICE_CATEGORIES = [
  'Compute Services',
  'Network Services',
  'Storage Services',
  'Security Services',
  'Cloud Services',
  'Monitoring Services',
  'Backup Services',
  'Support Services',
  'Managed Services',
  'Consulting Services',
];

const VALUE_UNITS = ['/month', '/year', '/hour', '/unit', '/GB', '/TB', '/user', 'fixed', 'custom'];

const AddService = () => {
  const [loading, setLoading]                       = useState(false);
  const [showModal, setShowModal]                   = useState(false);
  const [showDeleteModal, setShowDeleteModal]       = useState(false);
  const [serviceToDelete, setServiceToDelete]       = useState(null);
  const [editingService, setEditingService]         = useState(null);
  const [error, setError]                           = useState(null);
  const [sortedInfo, setSortedInfo]                 = useState({ columnKey: 'id', order: 'ascend' });

  const [searchText, setSearchText]                 = useState('');
  const [categoryFilter, setCategoryFilter]         = useState('all');
  const [statusFilter, setStatusFilter]             = useState('all');

  const [services, setServices] = useState([
    { id: 1, serviceCategory: 'Compute Services',  serviceName: 'Virtual Machine Hosting',    serviceValue: '5000',  valueUnit: '/month',  description: 'Dedicated VM hosting with high availability and auto-scaling.',        status: 'Active',   createdDate: '2024-01-10' },
    { id: 2, serviceCategory: 'Network Services',  serviceName: 'Managed Firewall',            serviceValue: '3200',  valueUnit: '/month',  description: 'Enterprise-grade managed firewall with 24/7 monitoring and support.',  status: 'Active',   createdDate: '2024-02-15' },
    { id: 3, serviceCategory: 'Storage Services',  serviceName: 'Cloud Object Storage',        serviceValue: '12',    valueUnit: '/GB',     description: 'Scalable object storage with 99.99% durability and CDN integration.',  status: 'Active',   createdDate: '2024-03-01' },
    { id: 4, serviceCategory: 'Security Services', serviceName: 'Vulnerability Assessment',    serviceValue: '18000', valueUnit: '/year',   description: 'Quarterly vulnerability scans and detailed remediation reports.',      status: 'Inactive', createdDate: '2024-03-20' },
    { id: 5, serviceCategory: 'Backup Services',   serviceName: 'Automated Daily Backup',      serviceValue: '800',   valueUnit: '/month',  description: 'Automated daily backups with 30-day retention and instant restore.',   status: 'Active',   createdDate: '2024-04-05' },
    { id: 6, serviceCategory: 'Monitoring Services','serviceName': 'Infrastructure Monitoring', serviceValue: '2500',  valueUnit: '/month',  description: 'Real-time monitoring with alerting, dashboards, and incident response.', status: 'Active',  createdDate: '2024-04-18' },
  ]);

  const emptyForm = {
    serviceCategory: '',
    serviceName: '',
    serviceValue: '',
    valueUnit: '/month',
    description: '',
    status: true,
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    setFormData({
      serviceCategory: svc.serviceCategory,
      serviceName:     svc.serviceName,
      serviceValue:    svc.serviceValue,
      valueUnit:       svc.valueUnit || '/month',
      description:     svc.description || '',
      status:          svc.status === 'Active',
    });
    setShowModal(true);
  };

  const openDeleteModal  = (svc) => { setServiceToDelete(svc); setShowDeleteModal(true); };
  const closeModal        = () => setShowModal(false);
  const closeDeleteModal  = () => { setShowDeleteModal(false); setServiceToDelete(null); };

  const handleDelete = () => {
    if (serviceToDelete) {
      setServices(services.filter(s => s.id !== serviceToDelete.id));
      message.success('Service deleted successfully!');
      closeDeleteModal();
    }
  };

  const handleSubmit = () => {
    if (!formData.serviceCategory || !formData.serviceName || !formData.serviceValue) {
      setError('Please fill all required fields: Category, Name, and Value');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const payload = {
        serviceCategory: formData.serviceCategory,
        serviceName:     formData.serviceName,
        serviceValue:    formData.serviceValue,
        valueUnit:       formData.valueUnit,
        description:     formData.description,
        status:          formData.status ? 'Active' : 'Inactive',
      };
      if (editingService) {
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...payload } : s));
        message.success('Service updated successfully!');
      } else {
        setServices([...services, {
          id: services.length + 1,
          ...payload,
          createdDate: new Date().toISOString().split('T')[0],
        }]);
        message.success('Service added successfully!');
      }
      setLoading(false);
      closeModal();
    }, 500);
  };

  const handleTableChange = (pagination, filters, sorter) => setSortedInfo(sorter);

  const filteredServices = services.filter(svc => {
    const s = searchText.toLowerCase();
    const matchSearch = !s
      || svc.serviceCategory.toLowerCase().includes(s)
      || svc.serviceName.toLowerCase().includes(s)
      || svc.serviceValue.toString().includes(s)
      || (svc.description && svc.description.toLowerCase().includes(s));
    const matchCategory = categoryFilter === 'all' || svc.serviceCategory === categoryFilter;
    const matchStatus   = statusFilter   === 'all' || svc.status.toLowerCase() === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalServices    = services.length;
  const activeServices   = services.filter(s => s.status === 'Active').length;
  const inactiveServices = services.filter(s => s.status === 'Inactive').length;
  const uniqueCategories = [...new Set(services.map(s => s.serviceCategory))];

  const getCategoryColor = (cat) => {
    const map = {
      'Compute Services':    'blue',
      'Network Services':    'cyan',
      'Storage Services':    'purple',
      'Security Services':   'red',
      'Cloud Services':      'geekblue',
      'Monitoring Services': 'orange',
      'Backup Services':     'green',
      'Support Services':    'gold',
      'Managed Services':    'volcano',
      'Consulting Services': 'magenta',
    };
    return map[cat] || 'default';
  };

  const columns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 55,
      sorter: (a, b) => a.id - b.id,
      sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text>,
    },
    {
      title: 'Service Category', dataIndex: 'serviceCategory', key: 'serviceCategory', width: 160,
      sorter: (a, b) => a.serviceCategory.localeCompare(b.serviceCategory),
      sortOrder: sortedInfo.columnKey === 'serviceCategory' && sortedInfo.order,
      render: t => (
        <Space size={4}>
          <AppstoreOutlined style={{ color: '#fa8c16', fontSize: 11 }} />
          <Tag color={getCategoryColor(t)} style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>{t}</Tag>
        </Space>
      ),
    },
    {
      title: 'Service Name', dataIndex: 'serviceName', key: 'serviceName', width: 185,
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
      sortOrder: sortedInfo.columnKey === 'serviceName' && sortedInfo.order,
      render: t => (
        <Space size={5}>
          <CustomerServiceOutlined style={{ color: '#1890ff', fontSize: 11 }} />
          <Text strong style={{ fontSize: 12 }}>{t}</Text>
        </Space>
      ),
    },
    {
      title: 'Service Value', key: 'serviceValue', width: 130,
      sorter: (a, b) => parseFloat(a.serviceValue) - parseFloat(b.serviceValue),
      sortOrder: sortedInfo.columnKey === 'serviceValue' && sortedInfo.order,
      render: (_, record) => (
        <Space size={3}>
          <DollarOutlined style={{ color: '#52c41a', fontSize: 11 }} />
          <Text style={{ fontSize: 12, fontWeight: 600, color: '#389e0d' }}>
            ₹{parseFloat(record.serviceValue).toLocaleString('en-IN')}
          </Text>
          <Text type="secondary" style={{ fontSize: 10 }}>{record.valueUnit}</Text>
        </Space>
      ),
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: t => t
        ? <Tooltip title={t}><Text style={{ fontSize: 11 }}>{t.length > 60 ? t.substring(0, 60) + '…' : t}</Text></Tooltip>
        : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'Date', dataIndex: 'createdDate', key: 'createdDate', width: 92,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      sortOrder: sortedInfo.columnKey === 'createdDate' && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 85,
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order,
      render: t => <Badge status={t === 'Active' ? 'success' : 'error'} text={<span style={{ fontSize: 11 }}>{t}</span>} />,
    },
    {
      title: '', key: 'actions', width: 70, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: '#1890ff', padding: '0 4px' }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(record)} style={{ color: '#ff4d4f', padding: '0 4px' }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const backdropStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 };
  const lbl       = { display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const inputStyle = { width: '100%', padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', padding: '10px 16px', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            <CustomerServiceOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Service Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage DCIM services, categories, and pricing</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
            Add Service
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError(null)}
          style={{ marginBottom: 6, padding: '4px 12px', fontSize: 12, flexShrink: 0 }} />
      )}

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        {[
          { label: 'Total Services',  value: totalServices,    color: '#1890ff', icon: <CustomerServiceOutlined /> },
          { label: 'Active',          value: activeServices,   color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: 'Inactive',        value: inactiveServices, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          { label: 'Categories',      value: uniqueCategories.length, color: '#fa8c16', icon: <AppstoreOutlined /> },
        ].map(({ label, value, color, icon }) => (
          <Col key={label} span={6}>
            <div style={{ backgroundColor: 'white', borderRadius: 6, padding: '8px 14px', borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, color }}>{icon}</span>
              <div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.3 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: 'white', borderRadius: 6, padding: '8px 12px', marginBottom: 8, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={8} lg={8}>
            <Input
              placeholder="Search by category, name, value, description..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)}
              allowClear size="small"
            />
          </Col>
          <Col xs={12} sm={8} md={5} lg={5}>
            <Select value={categoryFilter} onChange={setCategoryFilter} size="small" style={{ width: '100%' }}>
              <Option value="all">All Categories</Option>
              {SERVICE_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: '100%' }}>
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={0} sm={0} md={7} lg={7} style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, color: '#888' }}>{filteredServices.length} / {totalServices} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '7px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Services List</Text>
          <Badge count={filteredServices.length} style={{ backgroundColor: '#1890ff' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredServices} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} services`, size: 'small', style: { padding: '5px 14px', margin: 0 } }}
            onChange={handleTableChange} style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: '12px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No services found</div> }}
          />
        </div>
      </div>

   


      {/* ════════════════ ADD / EDIT MODAL ════════════════ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px 24px', borderRadius: 10, width: '640px', maxWidth: '96%', maxHeight: '92vh', overflowY: 'auto', zIndex: 1001, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1890ff, #096dd9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CustomerServiceOutlined style={{ color: 'white', fontSize: 15 }} />
                </div>
                <h3 style={{ margin: 0, color: '#1890ff', fontSize: 15 }}>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
              </div>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: '#666' }} />
            </div>

            {/* ── Row 1: Category + Name ── */}
            <Row gutter={14} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>
                  Service Category <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Select
                  placeholder="Select service category"
                  style={{ width: '100%' }} size="small"
                  value={formData.serviceCategory || undefined}
                  onChange={v => handleSelectChange('serviceCategory', v)}
                  showSearch allowClear
                >
                  {SERVICE_CATEGORIES.map(c => (
                    <Option key={c} value={c}>
                      <Space size={4}>
                        <AppstoreOutlined style={{ color: '#fa8c16', fontSize: 11 }} />
                        {c}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={12}>
                <label style={lbl}>
                  Service Name <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <input
                  type="text" name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="e.g. Virtual Machine Hosting"
                  onFocus={e => e.target.style.borderColor = '#1890ff'}
                  onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                />
              </Col>
            </Row>

            {/* ── Row 2: Value + Unit ── */}
            <Row gutter={14} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>
                  Service Value (₹) <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52c41a', fontSize: 13, fontWeight: 600, zIndex: 1 }}>₹</span>
                    <input
                      type="number" name="serviceValue"
                      value={formData.serviceValue}
                      onChange={handleInputChange}
                      style={{ ...inputStyle, paddingLeft: 26 }}
                      placeholder="0"
                      min="0"
                      onFocus={e => e.target.style.borderColor = '#1890ff'}
                      onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                    />
                  </div>
                  <Select
                    value={formData.valueUnit}
                    onChange={v => handleSelectChange('valueUnit', v)}
                    size="small"
                    style={{ width: 110 }}
                  >
                    {VALUE_UNITS.map(u => <Option key={u} value={u}>{u}</Option>)}
                  </Select>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>Enter pricing value and billing unit</Text>
              </Col>
              <Col span={12}>
                <label style={lbl}>Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '7px 10px', backgroundColor: '#f9f9f9', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                  <input
                    type="checkbox" name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                    id="svc-status-check"
                  />
                  <label htmlFor="svc-status-check" style={{ fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
                    Active Service
                  </label>
                  <Badge status={formData.status ? 'success' : 'default'} style={{ marginLeft: 4 }} />
                </div>
              </Col>
            </Row>

            {/* ── Row 3: Description ── */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="Enter a brief description of this service..."
                onFocus={e => e.target.style.borderColor = '#1890ff'}
                onBlur={e => e.target.style.borderColor = '#d9d9d9'}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit}
                icon={editingService ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ════════════════ DELETE MODAL ════════════════ */}
      {showDeleteModal && serviceToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '24px', borderRadius: 8, width: '440px', maxWidth: '90%', zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: 42, color: '#ff4d4f', marginBottom: 10 }} />
            <h3 style={{ color: '#ff4d4f', marginBottom: 6 }}>Delete Service</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this service?</p>
            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 12, textAlign: 'left', fontSize: 13 }}>
              {[
                ['Category',      serviceToDelete.serviceCategory],
                ['Service Name',  serviceToDelete.serviceName],
                ['Service Value', `₹${serviceToDelete.serviceValue} ${serviceToDelete.valueUnit}`],
                ['Status',        serviceToDelete.status],
                ['Created',       serviceToDelete.createdDate],
              ].map(([k, v]) => (
                <p key={k} style={{ margin: '3px 0' }}><strong>{k}:</strong> {v}</p>
              ))}
            </div>
            <p style={{ color: '#ff7875', fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Service</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddService;