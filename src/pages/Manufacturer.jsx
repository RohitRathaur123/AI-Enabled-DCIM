// Manufacturer.jsx
import React, { useState, useEffect } from "react";
import {
  Table, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Divider, Avatar,
  Tooltip, Badge
} from "antd";
import {
  EditOutlined, DeleteOutlined, ReloadOutlined, PhoneOutlined,
  GlobalOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PlusOutlined, SearchOutlined, ExclamationCircleOutlined,
  UserOutlined, CloseOutlined, AppstoreOutlined, LinkOutlined,
  CrownOutlined, RocketOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const Manufacturer = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] = useState(null);
  const [editingManufacturer, setEditingManufacturer] = useState(null);
  const [error, setError] = useState(null);

  const [manufacturers, setManufacturers] = useState([
    { id: 1, name: 'Cisco Systems', websiteUrl: 'https://www.cisco.com', supportUrl: 'https://www.cisco.com/support', responsiblePerson: 'John Smith', contactNo: '+1-408-526-4000', status: 'Active', productCount: 45, createdDate: '2024-01-15' },
    { id: 2, name: 'Dell Technologies', websiteUrl: 'https://www.dell.com', supportUrl: 'https://www.dell.com/support', responsiblePerson: 'Emily Johnson', contactNo: '+1-800-624-9897', status: 'Active', productCount: 78, createdDate: '2024-01-20' },
    { id: 3, name: 'HP Inc', websiteUrl: 'https://www.hp.com', supportUrl: 'https://support.hp.com', responsiblePerson: 'Michael Brown', contactNo: '+1-650-857-1501', status: 'Active', productCount: 62, createdDate: '2024-02-10' },
    { id: 4, name: 'Lenovo', websiteUrl: 'https://www.lenovo.com', supportUrl: 'https://support.lenovo.com', responsiblePerson: 'Sarah Davis', contactNo: '+1-855-253-6686', status: 'Active', productCount: 53, createdDate: '2024-02-15' },
    { id: 5, name: 'Juniper Networks', websiteUrl: 'https://www.juniper.net', supportUrl: 'https://www.juniper.net/support', responsiblePerson: 'Robert Wilson', contactNo: '+1-408-745-2000', status: 'Inactive', productCount: 12, createdDate: '2024-03-01' },
    { id: 6, name: 'Fortinet', websiteUrl: 'https://www.fortinet.com', supportUrl: 'https://www.fortinet.com/support', responsiblePerson: 'Jessica Martinez', contactNo: '+1-408-235-7700', status: 'Active', productCount: 28, createdDate: '2024-03-10' },
    { id: 7, name: 'VMware', websiteUrl: 'https://www.vmware.com', supportUrl: 'https://www.vmware.com/support', responsiblePerson: 'David Anderson', contactNo: '+1-877-486-9273', status: 'Active', productCount: 34, createdDate: '2024-03-15' },
    { id: 8, name: 'Microsoft', websiteUrl: 'https://www.microsoft.com', supportUrl: 'https://support.microsoft.com', responsiblePerson: 'Laura Thompson', contactNo: '+1-800-642-7676', status: 'Active', productCount: 89, createdDate: '2024-04-01' }
  ]);

  const [formData, setFormData] = useState({ name: '', websiteUrl: '', supportUrl: '', responsiblePerson: '', contactNo: '', status: true });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const openAddModal = () => {
    setEditingManufacturer(null);
    setFormData({ name: '', websiteUrl: '', supportUrl: '', responsiblePerson: '', contactNo: '', status: true });
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setEditingManufacturer(m);
    setFormData({ name: m.name, websiteUrl: m.websiteUrl, supportUrl: m.supportUrl, responsiblePerson: m.responsiblePerson || '', contactNo: m.contactNo || '', status: m.status === 'Active' });
    setShowModal(true);
  };

  const openDeleteModal = (m) => { setManufacturerToDelete(m); setShowDeleteModal(true); };
  const closeModal = () => setShowModal(false);
  const closeDeleteModal = () => { setShowDeleteModal(false); setManufacturerToDelete(null); };

  const handleDelete = () => {
    if (manufacturerToDelete) {
      setManufacturers(manufacturers.filter(m => m.id !== manufacturerToDelete.id));
      message.success('Manufacturer deleted successfully!');
      closeDeleteModal();
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.websiteUrl) { setError('Please fill all required fields'); return; }
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(formData.websiteUrl)) { setError('Please enter a valid website URL'); return; }
    if (formData.supportUrl && !urlPattern.test(formData.supportUrl)) { setError('Please enter a valid support URL'); return; }
    if (formData.contactNo) {
      const phonePattern = /^[+]?[\d\s\-().]{7,20}$/;
      if (!phonePattern.test(formData.contactNo)) { setError('Please enter a valid contact number'); return; }
    }
    setLoading(true);
    setTimeout(() => {
      if (editingManufacturer) {
        setManufacturers(manufacturers.map(m => m.id === editingManufacturer.id
          ? { ...m, name: formData.name, websiteUrl: formData.websiteUrl, supportUrl: formData.supportUrl, responsiblePerson: formData.responsiblePerson, contactNo: formData.contactNo, status: formData.status ? 'Active' : 'Inactive' }
          : m));
        message.success('Manufacturer updated successfully!');
      } else {
        setManufacturers([...manufacturers, {
          id: manufacturers.length + 1, name: formData.name, websiteUrl: formData.websiteUrl,
          supportUrl: formData.supportUrl || '-', responsiblePerson: formData.responsiblePerson || '-',
          contactNo: formData.contactNo || '-', status: formData.status ? 'Active' : 'Inactive',
          productCount: 0, createdDate: new Date().toISOString().split('T')[0]
        }]);
        message.success('Manufacturer added successfully!');
      }
      setLoading(false);
      closeModal();
    }, 500);
  };

  const filteredManufacturers = manufacturers.filter(m => {
    const s = searchText.toLowerCase();
    const matchSearch = !s || m.name.toLowerCase().includes(s) || m.websiteUrl.toLowerCase().includes(s)
      || (m.responsiblePerson && m.responsiblePerson.toLowerCase().includes(s))
      || (m.contactNo && m.contactNo.toLowerCase().includes(s));
    const matchStatus = statusFilter === 'all' || m.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalManufacturers = manufacturers.length;
  const activeManufacturers = manufacturers.filter(m => m.status === 'Active').length;
  const inactiveManufacturers = manufacturers.filter(m => m.status === 'Inactive').length;
  const totalProducts = manufacturers.reduce((sum, m) => sum + (m.productCount || 0), 0);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50, sorter: (a, b) => a.id - b.id },
    {
      title: 'Manufacturer', dataIndex: 'name', key: 'name', width: 160,
      render: (text, record) => (
        <Space size={6}>
          <Avatar style={{ backgroundColor: record.status === 'Active' ? '#1890ff' : '#d9d9d9', width: 22, height: 22, minWidth: 22, fontSize: 11, lineHeight: '22px' }} icon={<CrownOutlined />} />
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Website', dataIndex: 'websiteUrl', key: 'websiteUrl', width: 155,
      render: (text) => (
        <Tooltip title={text}>
          <Space size={4}>
            <GlobalOutlined style={{ color: '#1890ff', fontSize: 11 }} />
            <a href={text} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff', fontSize: 11 }}>
              {text.replace('https://www.', '').replace('https://', '').substring(0, 20)}{text.length > 28 ? '…' : ''}
            </a>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Support URL', dataIndex: 'supportUrl', key: 'supportUrl', width: 155,
      render: (text) => text && text !== '-' ? (
        <Tooltip title={text}>
          <Space size={4}>
            <LinkOutlined style={{ color: '#52c41a', fontSize: 11 }} />
            <a href={text} target="_blank" rel="noopener noreferrer" style={{ color: '#52c41a', fontSize: 11 }}>
              {text.replace('https://', '').substring(0, 20)}{text.length > 28 ? '…' : ''}
            </a>
          </Space>
        </Tooltip>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'Responsible Person', dataIndex: 'responsiblePerson', key: 'responsiblePerson', width: 145,
      render: (text) => text && text !== '-' ? (
        <Space size={4}><UserOutlined style={{ color: '#fa8c16', fontSize: 11 }} /><Text style={{ fontSize: 12 }}>{text}</Text></Space>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
      sorter: (a, b) => (a.responsiblePerson || '').localeCompare(b.responsiblePerson || ''),
    },
    {
      title: 'Contact No', dataIndex: 'contactNo', key: 'contactNo', width: 140,
      render: (text) => text && text !== '-' ? (
        <Space size={4}><PhoneOutlined style={{ color: '#13c2c2', fontSize: 11 }} /><Text style={{ fontSize: 12 }}>{text}</Text></Space>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'Products', dataIndex: 'productCount', key: 'productCount', width: 72,
      render: (text) => <Badge count={text} style={{ backgroundColor: '#722ed1', fontSize: 10 }} />,
      sorter: (a, b) => a.productCount - b.productCount,
    },
    {
      title: 'Date', dataIndex: 'createdDate', key: 'createdDate', width: 95,
      render: (text) => <Text style={{ fontSize: 11 }}>{text}</Text>,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 82,
      render: (text) => <Badge status={text === 'Active' ? 'success' : 'error'} text={<span style={{ fontSize: 11 }}>{text}</span>} />,
      filters: [{ text: 'Active', value: 'Active' }, { text: 'Inactive', value: 'Inactive' }],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions', key: 'actions', width: 72, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: '#1890ff', padding: '0 4px' }} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(record)} style={{ color: '#ff4d4f', padding: '0 4px' }} /></Tooltip>
        </Space>
      ),
    },
  ];

  const backdropStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 };
  const modalBoxStyle = (width) => ({
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    backgroundColor: 'white', padding: '20px', borderRadius: '8px', width, maxWidth: '95%',
    maxHeight: '92vh', overflowY: 'auto', zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', padding: '10px 16px', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            <RocketOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Manufacturer Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage device manufacturers and their support information</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
            Add Manufacturer
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
          { label: 'Total Manufacturers', value: totalManufacturers, color: '#1890ff', icon: <CrownOutlined /> },
          { label: 'Active', value: activeManufacturers, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: 'Inactive', value: inactiveManufacturers, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          { label: 'Total Products', value: totalProducts, color: '#722ed1', icon: <AppstoreOutlined /> },
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
          <Col xs={24} sm={24} md={14} lg={14}>
            <Input
              placeholder="Search by name, website, responsible person or contact..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
              allowClear size="small"
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={6}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: '100%' }}>
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4} style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#888' }}>
              {filteredManufacturers.length} / {totalManufacturers} shown
            </Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '7px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Manufacturers List</Text>
          <Badge count={filteredManufacturers.length} style={{ backgroundColor: '#1890ff' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredManufacturers}
            loading={loading}
            bordered={false}
            rowKey="id"
            size="small"
            scroll={{ x: 1050 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `${total} manufacturers`,
              size: 'small',
              style: { padding: '5px 14px', margin: 0 }
            }}
            style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: '12px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>

 

      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={modalBoxStyle('580px')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#1890ff' }}>{editingManufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: '#666' }} />
            </div>

            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Manufacturer Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter manufacturer name" prefix={<CrownOutlined style={{ color: '#1890ff' }} />} />
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Website URL <span style={{ color: '#ff4d4f' }}>*</span></label>
                <Input name="websiteUrl" value={formData.websiteUrl} onChange={handleInputChange} placeholder="https://www.example.com" prefix={<GlobalOutlined style={{ color: '#1890ff' }} />} />
                <Text type="secondary" style={{ fontSize: 11 }}>Include https://</Text>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Support URL</label>
                <Input name="supportUrl" value={formData.supportUrl} onChange={handleInputChange} placeholder="https://support.example.com" prefix={<LinkOutlined style={{ color: '#52c41a' }} />} />
                <Text type="secondary" style={{ fontSize: 11 }}>Optional</Text>
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Responsible Person</label>
                <Input name="responsiblePerson" value={formData.responsiblePerson} onChange={handleInputChange} placeholder="Enter responsible person name" prefix={<UserOutlined style={{ color: '#fa8c16' }} />} />
                <Text type="secondary" style={{ fontSize: 11 }}>Optional</Text>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Contact No</label>
                <Input name="contactNo" value={formData.contactNo} onChange={handleInputChange} placeholder="+1-000-000-0000" prefix={<PhoneOutlined style={{ color: '#13c2c2' }} />} />
                <Text type="secondary" style={{ fontSize: 11 }}>Optional</Text>
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Status</label>
                <div style={{ padding: '7px 12px', backgroundColor: '#f9f9f9', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} style={{ width: 15, height: 15 }} id="status-check" />
                  <label htmlFor="status-check" style={{ fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Active Manufacturer</label>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>Inactive = hidden in other modules</Text>
              </Col>
            </Row>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 10, fontSize: 12 }} />}
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading} icon={editingManufacturer ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? 'Saving...' : (editingManufacturer ? 'Update Manufacturer' : 'Create Manufacturer')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && manufacturerToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle('440px'), textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#ff4d4f', marginBottom: 10 }} />
            <h3 style={{ color: '#ff4d4f', marginBottom: 6 }}>Delete Manufacturer</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this manufacturer?</p>
            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 12, textAlign: 'left', fontSize: 13 }}>
              {[
                ['Name', manufacturerToDelete.name],
                ['Website', manufacturerToDelete.websiteUrl],
                ['Support URL', manufacturerToDelete.supportUrl],
                ['Responsible Person', manufacturerToDelete.responsiblePerson || '-'],
                ['Contact No', manufacturerToDelete.contactNo || '-'],
                ['Products', manufacturerToDelete.productCount],
                ['Status', manufacturerToDelete.status],
              ].map(([k, v]) => (
                <p key={k} style={{ margin: '3px 0' }}><strong>{k}:</strong> {v}</p>
              ))}
            </div>
            <p style={{ color: '#ff4d4f', fontSize: 12, marginBottom: 16 }}>
              Warning: This will affect all products associated with this manufacturer.
            </p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Manufacturer</Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default Manufacturer;