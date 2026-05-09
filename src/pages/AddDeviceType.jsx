// AddDeviceType.jsx
import React, { useState, useCallback, memo, useRef } from 'react';
import {
  FaServer, FaPlug, FaNetworkWired, FaEdit, FaTrash, FaPlus,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaDesktop,
  FaHdd, FaWifi, FaBolt, FaSnowflake, FaCube, FaList, FaDatabase,
  FaCloud, FaShieldAlt, FaLock, FaVideo, FaBell, FaThermometerHalf,
  FaTachometerAlt, FaCogs, FaCubes, FaSitemap, FaBatteryFull,
  FaFan, FaFire, FaWater, FaSolarPanel, FaWind, FaMicrochip
} from 'react-icons/fa';
import {
  Typography, Row, Col, Table, Tag, Space, Button, Select,
  Input, Badge, Tooltip, Form, message, Popover
} from 'antd';
import {
  SearchOutlined, PlusOutlined, ReloadOutlined, AppstoreOutlined,
  CloseOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AVAILABLE_ICONS = [
  { name: 'FaServer',              component: <FaServer />,              color: '#1890ff', label: 'Server' },
  { name: 'FaPlug',                component: <FaPlug />,                color: '#52c41a', label: 'PDU' },
  { name: 'FaExclamationTriangle', component: <FaExclamationTriangle />, color: '#fa8c16', label: 'UPS' },
  { name: 'FaNetworkWired',        component: <FaNetworkWired />,        color: '#13c2c2', label: 'Network' },
  { name: 'FaFan',                 component: <FaFan />,                 color: '#722ed1', label: 'HVAC' },
  { name: 'FaBolt',                component: <FaBolt />,                color: '#fadb14', label: 'Power' },
  { name: 'FaBatteryFull',         component: <FaBatteryFull />,         color: '#52c41a', label: 'Battery' },
  { name: 'FaFire',                component: <FaFire />,                color: '#ff4d4f', label: 'Fire' },
  { name: 'FaWater',               component: <FaWater />,               color: '#1890ff', label: 'Cooling' },
  { name: 'FaSolarPanel',          component: <FaSolarPanel />,          color: '#faad14', label: 'Solar' },
  { name: 'FaWind',                component: <FaWind />,                color: '#13c2c2', label: 'Wind' },
  { name: 'FaMicrochip',           component: <FaMicrochip />,           color: '#722ed1', label: 'Processor' },
  { name: 'FaHdd',                 component: <FaHdd />,                 color: '#1890ff', label: 'Storage' },
  { name: 'FaDatabase',            component: <FaDatabase />,            color: '#52c41a', label: 'Database' },
  { name: 'FaCloud',               component: <FaCloud />,               color: '#fa8c16', label: 'Cloud' },
  { name: 'FaShieldAlt',           component: <FaShieldAlt />,           color: '#722ed1', label: 'Security' },
  { name: 'FaLock',                component: <FaLock />,                color: '#ff4d4f', label: 'Access' },
  { name: 'FaVideo',               component: <FaVideo />,               color: '#13c2c2', label: 'Camera' },
  { name: 'FaBell',                component: <FaBell />,                color: '#faad14', label: 'Alarm' },
  { name: 'FaThermometerHalf',     component: <FaThermometerHalf />,     color: '#1890ff', label: 'Sensor' },
  { name: 'FaTachometerAlt',       component: <FaTachometerAlt />,       color: '#52c41a', label: 'Meter' },
  { name: 'FaCogs',                component: <FaCogs />,                color: '#722ed1', label: 'Mechanical' },
  { name: 'FaCube',                component: <FaCube />,                color: '#13c2c2', label: 'Module' },
  { name: 'FaCubes',               component: <FaCubes />,               color: '#fa8c16', label: 'Rack' },
  { name: 'FaSitemap',             component: <FaSitemap />,             color: '#1890ff', label: 'Switch' },
  { name: 'FaDesktop',             component: <FaDesktop />,             color: '#52c41a', label: 'Desktop' },
  { name: 'FaWifi',                component: <FaWifi />,                color: '#722ed1', label: 'Wireless' },
  { name: 'FaSnowflake',           component: <FaSnowflake />,           color: '#13c2c2', label: 'Cooling' },
  { name: 'FaList',                component: <FaList />,                color: '#fa8c16', label: 'Other' },
];

const CATEGORIES = [
  'Infrastructure', 'Power Distribution', 'Power Backup', 'Cooling',
  'Networking', 'Computing', 'Storage', 'Security', 'Monitoring', 'Other'
];

const IconSelector = memo(({ selectedIcon, onSelectIcon }) => (
  <div style={{ width: 280, maxHeight: 260, overflowY: 'auto', padding: 4 }}>
    <Row gutter={[6, 6]}>
      {AVAILABLE_ICONS.map(icon => (
        <Col span={6} key={icon.name}>
          <div onClick={() => onSelectIcon(icon.name)} style={{
            padding: '8px 4px', border: selectedIcon === icon.name ? `2px solid ${icon.color}` : '1px solid #e0e0e0',
            borderRadius: 6, textAlign: 'center', cursor: 'pointer',
            backgroundColor: selectedIcon === icon.name ? `${icon.color}18` : 'white',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
          }}>
            <div style={{ fontSize: 18, color: icon.color }}>{icon.component}</div>
            <Text style={{ fontSize: 9, lineHeight: 1.2 }}>{icon.label}</Text>
          </div>
        </Col>
      ))}
    </Row>
  </div>
));

const getIconComponent = (iconName, color = '#1890ff', size = 16) => {
  const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
  const el = icon ? icon.component : <FaCube />;
  return React.cloneElement(el, { style: { color, fontSize: size } });
};

const AddDeviceType = () => {
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm]             = useState('');
  const [categoryFilter, setCategoryFilter]     = useState('all');
  const [statusFilter, setStatusFilter]         = useState('all');
  const [modalVisible, setModalVisible]         = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem]           = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [selectedIcon, setSelectedIcon]         = useState('FaServer');
  const modalModeRef = useRef('add');

  const [deviceTypes, setDeviceTypes] = useState([
    { id:1, device_type_id:'DT001', type_name:'Server Rack',    category:'Infrastructure',     icon:'FaCubes',             iconColor:'#fa8c16', created_at:'2024-01-15', status:'Active',   description:'Standard server rack for mounting equipment' },
    { id:2, device_type_id:'DT002', type_name:'PDU',            category:'Power Distribution', icon:'FaPlug',              iconColor:'#52c41a', created_at:'2024-01-15', status:'Active',   description:'Power Distribution Unit for rack power management' },
    { id:3, device_type_id:'DT003', type_name:'UPS',            category:'Power Backup',       icon:'FaExclamationTriangle',iconColor:'#fa8c16', created_at:'2024-01-16', status:'Active',   description:'Uninterruptible Power Supply for backup power' },
    { id:4, device_type_id:'DT004', type_name:'HVAC',           category:'Cooling',            icon:'FaFan',               iconColor:'#722ed1', created_at:'2024-01-16', status:'Active',   description:'Heating, Ventilation and Air Conditioning units' },
    { id:5, device_type_id:'DT005', type_name:'Network Switch', category:'Networking',         icon:'FaSitemap',           iconColor:'#1890ff', created_at:'2024-01-17', status:'Active',   description:'Network switches for data connectivity' },
    { id:6, device_type_id:'DT006', type_name:'Server',         category:'Computing',          icon:'FaServer',            iconColor:'#1890ff', created_at:'2024-01-17', status:'Active',   description:'Physical servers for computing resources' },
    { id:7, device_type_id:'DT007', type_name:'Storage Array',  category:'Storage',            icon:'FaHdd',               iconColor:'#52c41a', created_at:'2024-01-18', status:'Inactive', description:'Storage arrays for data storage' },
  ]);

  const handleAddNew = useCallback(() => {
    modalModeRef.current = 'add';
    setCurrentItem(null);
    setSelectedIcon('FaServer');
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    modalModeRef.current = 'edit';
    setCurrentItem(record);
    setSelectedIcon(record.icon || 'FaServer');
    form.setFieldsValue({ type_name: record.type_name, category: record.category, description: record.description, status: record.status });
    setModalVisible(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
    form.resetFields();
    setCurrentItem(null);
    setSelectedIcon('FaServer');
  }, [form]);

  const handleDeleteCancel = useCallback(() => { setDeleteModalVisible(false); setCurrentItem(null); }, []);

  const handleDelete = useCallback(() => {
    if (currentItem) {
      setDeviceTypes(prev => prev.filter(item => item.id !== currentItem.id));
      setDeleteModalVisible(false);
      setCurrentItem(null);
      message.success('Device type deleted successfully');
    }
  }, [currentItem]);

  const handleDeleteClick = useCallback((record) => { setCurrentItem(record); setDeleteModalVisible(true); }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const iconInfo = AVAILABLE_ICONS.find(i => i.name === selectedIcon) || AVAILABLE_ICONS[0];
      if (modalModeRef.current === 'edit' && currentItem) {
        setDeviceTypes(prev => prev.map(item => item.id === currentItem.id
          ? { ...item, ...values, icon: selectedIcon, iconColor: iconInfo.color } : item));
        message.success('Device type updated successfully');
      } else {
        setDeviceTypes(prev => [...prev, {
          id: Date.now(),
          device_type_id: `DT${String(prev.length + 1).padStart(3, '0')}`,
          ...values, icon: selectedIcon, iconColor: iconInfo.color,
          created_at: new Date().toISOString().split('T')[0],
        }]);
        message.success('Device type added successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setCurrentItem(null);
      setSelectedIcon('FaServer');
    } catch {
      message.error('Please fill all required fields');
    } finally {
      setLoading(false);
    }
  }, [currentItem, selectedIcon, form]);

  const filteredData = deviceTypes.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s ||
      item.type_name.toLowerCase().includes(s) ||
      item.category.toLowerCase().includes(s) ||
      item.device_type_id.toLowerCase().includes(s) ||
      (item.description && item.description.toLowerCase().includes(s));
    const matchCat    = categoryFilter === 'all' || item.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const total      = deviceTypes.length;
  const active     = deviceTypes.filter(d => d.status === 'Active').length;
  const inactive   = deviceTypes.filter(d => d.status !== 'Active').length;
  const categories = new Set(deviceTypes.map(d => d.category)).size;

  const columns = [
    {
      title: 'S.No', key: 'sno', width: 55,
      render: (_, __, index) => <Text style={{ fontSize: 12 }}>{index + 1}</Text>,
      sorter: (a, b) => a.id - b.id, defaultSortOrder: 'ascend',
    },
    {
      title: 'Type ID', dataIndex: 'device_type_id', key: 'device_type_id', width: 90,
      render: text => <Tag color="blue" style={{ fontSize: 11 }}>{text}</Tag>,
      sorter: (a, b) => a.device_type_id.localeCompare(b.device_type_id),
    },
    {
      title: 'Icon', key: 'icon', width: 55,
      render: (_, r) => <span>{getIconComponent(r.icon, r.iconColor, 18)}</span>,
    },
    {
      title: 'Type Name', dataIndex: 'type_name', key: 'type_name', width: 140,
      render: (text, r) => (
        <Space size={5}>
          {getIconComponent(r.icon, r.iconColor, 13)}
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.type_name.localeCompare(b.type_name),
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 140,
      render: cat => <Tag color="geekblue" style={{ fontSize: 11 }}>{cat}</Tag>,
      sorter: (a, b) => a.category.localeCompare(b.category),
      filters: [...new Set(deviceTypes.map(d => d.category))].map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      ellipsis: true,
      render: text => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>,
    },
    {
      title: 'Date', dataIndex: 'created_at', key: 'created_at', width: 100,
      render: text => <Text style={{ fontSize: 11 }}>{text}</Text>,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 90,
      render: text => <Badge status={text === 'Active' ? 'success' : 'error'} text={<span style={{ fontSize: 11 }}>{text}</span>} />,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [{ text: 'Active', value: 'Active' }, { text: 'Inactive', value: 'Inactive' }],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions', key: 'actions', width: 80, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} style={{ color: '#1890ff', padding: '0 4px' }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteClick(r)} style={{ color: '#ff4d4f', padding: '0 4px' }} />
          </Tooltip>
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
            <AppstoreOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Asset Type Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage device types and categories for DCIM equipment</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew} size="small"
            style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
            Add Device Type
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        {[
          { label: 'Total Device Types', value: total,      color: '#1890ff', icon: <AppstoreOutlined /> },
          { label: 'Active',             value: active,     color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: 'Inactive',           value: inactive,   color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          { label: 'Categories',         value: categories, color: '#fa8c16', icon: getIconComponent('FaList', '#fa8c16', 16) },
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
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input
              placeholder="Search by type name, category, ID or description..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear size="small"
            />
          </Col>
          <Col xs={24} sm={8} md={5} lg={5}>
            <Select value={categoryFilter} onChange={setCategoryFilter} size="small" style={{ width: '100%' }}>
              <Option value="all">All Categories</Option>
              {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: '100%' }}>
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5} lg={5} style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, color: '#888' }}>
              {filteredData.length} / {total} shown
            </Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '7px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Device Types List</Text>
          <Badge count={filteredData.length} style={{ backgroundColor: '#1890ff' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            size="small"
            bordered={false}
            scroll={{ x: 900 }}
            pagination={{
              pageSize: 8, showSizeChanger: false,
              showTotal: total => `${total} device types`,
              size: 'small', style: { padding: '5px 14px', margin: 0 }
            }}
            style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: '12px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>

   

      {/* ══ ADD / EDIT MODAL ══ */}
      {modalVisible && (
        <>
          <div style={backdropStyle} onClick={handleCancel} />
          <div style={modalBoxStyle('560px')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#1890ff', fontSize: 15 }}>
                {modalModeRef.current === 'edit' ? 'Edit Device Type' : 'Add New Device Type'}
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={handleCancel} style={{ color: '#666' }} />
            </div>

            <Form form={form} layout="vertical" preserve={false} size="small">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="category" label={<span style={{ fontSize: 13, fontWeight: 500 }}>Category <span style={{ color: '#ff4d4f' }}>*</span></span>}
                    rules={[{ required: true, message: 'Please select category' }]} style={{ marginBottom: 12 }}>
                    <Select placeholder="Select category">
                      {CATEGORIES.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="type_name" label={<span style={{ fontSize: 13, fontWeight: 500 }}>Type Name <span style={{ color: '#ff4d4f' }}>*</span></span>}
                    rules={[{ required: true, message: 'Please enter type name' }]} style={{ marginBottom: 12 }}>
                    <Input placeholder="Enter device type name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="status" label={<span style={{ fontSize: 13, fontWeight: 500 }}>Status</span>}
                    initialValue="Active" style={{ marginBottom: 12 }}>
                    <Select>
                      <Option value="Active">Active</Option>
                      <Option value="Inactive">Inactive</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={{ fontSize: 13, fontWeight: 500 }}>Device Icon <span style={{ color: '#ff4d4f' }}>*</span></span>} style={{ marginBottom: 12 }}>
                    <Popover content={<IconSelector selectedIcon={selectedIcon} onSelectIcon={setSelectedIcon} />} title="Select an Icon" trigger="click" placement="bottom">
                      <Button style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                        <span style={{ fontSize: 16 }}>
                          {getIconComponent(selectedIcon, AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.color || '#1890ff', 16)}
                        </span>
                        <Text style={{ fontSize: 12 }}>
                          {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.label || 'Select'} — click to change
                        </Text>
                      </Button>
                    </Popover>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label={<span style={{ fontSize: 13, fontWeight: 500 }}>Description</span>} style={{ marginBottom: 12 }}>
                <TextArea rows={3} placeholder="Enter device type description" />
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
              <Button onClick={handleCancel} style={{ marginRight: 8 }}>Cancel</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading}
                icon={modalModeRef.current === 'edit' ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? 'Saving...' : (modalModeRef.current === 'edit' ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ══ DELETE MODAL ══ */}
      {deleteModalVisible && currentItem && (
        <>
          <div style={backdropStyle} onClick={handleDeleteCancel} />
          <div style={{ ...modalBoxStyle('420px'), textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#ff4d4f', marginBottom: 10 }} />
            <h3 style={{ color: '#ff4d4f', marginBottom: 6 }}>Delete Device Type</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this device type?</p>
            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 12, textAlign: 'left', fontSize: 13 }}>
              {[
                ['Type', <Space size={4} key="t">{getIconComponent(currentItem.icon, currentItem.iconColor, 13)}<span>{currentItem.type_name}</span></Space>],
                ['ID', currentItem.device_type_id],
                ['Category', currentItem.category],
                ['Status', currentItem.status],
              ].map(([k, v]) => <p key={k} style={{ margin: '3px 0' }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: '#ff7875', fontSize: 12, marginBottom: 16 }}>This action cannot be undone. This may affect existing devices of this type.</p>
            <Space>
              <Button onClick={handleDeleteCancel}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Device Type</Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default AddDeviceType;