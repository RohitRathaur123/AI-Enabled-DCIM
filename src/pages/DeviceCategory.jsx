// DeviceCategory.jsx
import React, { useState } from 'react';
import {
  Typography, Row, Col, Table, Space, Button,
  Input, message, Tag, Popover, Badge, Tooltip, Alert
} from 'antd';
import {
  DashboardOutlined, PlusOutlined, ReloadOutlined,
  SearchOutlined, EditOutlined, DeleteOutlined,
  CloseOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  FaFolder, FaServer, FaPlug, FaExclamationTriangle, FaNetworkWired,
  FaBolt, FaBatteryFull, FaFan, FaWifi, FaFire, FaWater, FaSolarPanel,
  FaWind, FaMicrochip, FaHdd, FaDatabase, FaCloud, FaShieldAlt,
  FaLock, FaVideo, FaBell, FaThermometerHalf, FaTachometerAlt,
  FaCogs, FaCube, FaCubes, FaSitemap
} from 'react-icons/fa';

const { Title, Text } = Typography;

const availableIcons = [
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
  { name: 'FaMicrochip',           component: <FaMicrochip />,           color: '#722ed1', label: 'Compute' },
  { name: 'FaHdd',                 component: <FaHdd />,                 color: '#1890ff', label: 'Storage' },
  { name: 'FaDatabase',            component: <FaDatabase />,            color: '#52c41a', label: 'Database' },
  { name: 'FaCloud',               component: <FaCloud />,               color: '#fa8c16', label: 'Cloud' },
  { name: 'FaShieldAlt',           component: <FaShieldAlt />,           color: '#722ed1', label: 'Security' },
  { name: 'FaLock',                component: <FaLock />,                color: '#ff4d4f', label: 'Access' },
  { name: 'FaVideo',               component: <FaVideo />,               color: '#13c2c2', label: 'Camera' },
  { name: 'FaBell',                component: <FaBell />,                color: '#faad14', label: 'Alarm' },
  { name: 'FaThermometerHalf',     component: <FaThermometerHalf />,     color: '#1890ff', label: 'Env' },
  { name: 'FaTachometerAlt',       component: <FaTachometerAlt />,       color: '#52c41a', label: 'Meter' },
  { name: 'FaCogs',                component: <FaCogs />,                color: '#722ed1', label: 'Mechanical' },
  { name: 'FaCube',                component: <FaCube />,                color: '#13c2c2', label: 'Module' },
  { name: 'FaCubes',               component: <FaCubes />,               color: '#fa8c16', label: 'Rack' },
  { name: 'FaSitemap',             component: <FaSitemap />,             color: '#1890ff', label: 'Switch' },
];

const getIconComponent = (iconName, color = '#1890ff', size = 18) => {
  const icon = availableIcons.find(i => i.name === iconName);
  const el = icon ? icon.component : <FaFolder />;
  return React.cloneElement(el, { style: { color, fontSize: size } });
};

const DeviceCategory = () => {
  const [searchTerm, setSearchTerm]           = useState('');
  const [showModal, setShowModal]             = useState(false);
  const [editingItem, setEditingItem]         = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete]       = useState(null);
  const [selectedIcon, setSelectedIcon]       = useState('FaServer');
  const [loading, setLoading]                 = useState(false);
  const [formData, setFormData]               = useState({ name: '' });

  const [categories, setCategories] = useState([
    { id: 1, name: 'Compute',     icon: 'FaMicrochip',       iconColor: '#722ed1', description: 'Servers, processors, compute nodes' },
    { id: 2, name: 'Cooling',     icon: 'FaWater',           iconColor: '#1890ff', description: 'HVAC, CRAC units, cooling towers' },
    { id: 3, name: 'Power',       icon: 'FaBolt',            iconColor: '#fadb14', description: 'PDUs, UPS, generators, batteries' },
    { id: 4, name: 'Network',     icon: 'FaNetworkWired',    iconColor: '#13c2c2', description: 'Switches, routers, firewalls' },
    { id: 5, name: 'Security',    icon: 'FaShieldAlt',       iconColor: '#722ed1', description: 'Firewalls, access control, cameras' },
    { id: 6, name: 'Storage',     icon: 'FaDatabase',        iconColor: '#52c41a', description: 'SAN, NAS, storage arrays' },
    { id: 7, name: 'Safety',      icon: 'FaFire',            iconColor: '#ff4d4f', description: 'Fire suppression, alarms, sensors' },
    { id: 8, name: 'Environment', icon: 'FaThermometerHalf', iconColor: '#1890ff', description: 'Temperature sensors, humidity monitors' },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || formData.name.trim().length < 2) { message.error('Category name must be at least 2 characters'); return; }
    if (formData.name.length > 50) { message.error('Category name cannot exceed 50 characters'); return; }
    const isDuplicate = categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase() && (!editingItem || c.id !== editingItem.id));
    if (isDuplicate) { message.error('Category with this name already exists'); return; }
    setLoading(true);
    setTimeout(() => {
      const iconInfo = availableIcons.find(i => i.name === selectedIcon) || availableIcons[0];
      if (editingItem) {
        setCategories(categories.map(c => c.id === editingItem.id
          ? { ...c, name: formData.name, icon: selectedIcon, iconColor: iconInfo.color, description: `${formData.name} devices and equipment` }
          : c));
        message.success('Category updated successfully');
      } else {
        setCategories([...categories, { id: categories.length + 1, name: formData.name, icon: selectedIcon, iconColor: iconInfo.color, description: `${formData.name} devices and equipment` }]);
        message.success('Category added successfully');
      }
      setLoading(false);
      closeModal();
    }, 500);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      setCategories(categories.filter(c => c.id !== itemToDelete.id));
      message.success('Category deleted successfully');
      closeDeleteModal();
    }
  };

  const openAddModal     = () => { setEditingItem(null); setFormData({ name: '' }); setSelectedIcon('FaServer'); setShowModal(true); };
  const openEditModal    = (r) => { setEditingItem(r); setSelectedIcon(r.icon || 'FaServer'); setFormData({ name: r.name }); setShowModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingItem(null); setFormData({ name: '' }); setSelectedIcon('FaServer'); };
  const openDeleteModal  = (r) => { setItemToDelete(r); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setItemToDelete(null); };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toString().includes(searchTerm)
  );

  const total     = categories.length;
  const compute   = categories.filter(c => ['Compute', 'Power'].includes(c.name)).length;
  const envSafety = categories.filter(c => ['Safety', 'Environment', 'Cooling'].includes(c.name)).length;

  const IconSelector = () => (
    <div style={{ width: 280, maxHeight: 260, overflowY: 'auto', padding: 4 }}>
      <Row gutter={[6, 6]}>
        {availableIcons.map(icon => (
          <Col span={6} key={icon.name}>
            <div onClick={() => setSelectedIcon(icon.name)} style={{
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
  );

  const columns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 55,
      render: id => <Tag color="blue" style={{ fontSize: 11 }}>{id}</Tag>,
      sorter: (a, b) => a.id - b.id, defaultSortOrder: 'ascend',
    },
    {
      title: 'Icon', key: 'icon', width: 60,
      render: (_, r) => <span>{getIconComponent(r.icon, r.iconColor, 18)}</span>,
    },
    {
      title: 'Category Name', dataIndex: 'name', key: 'name', width: 160,
      render: (text, r) => (
        <Space size={6}>
          {getIconComponent(r.icon, r.iconColor, 13)}
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: text => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>,
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: 'Actions', key: 'actions', width: 80, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} style={{ color: '#1890ff', padding: '0 4px' }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(r)} style={{ color: '#ff4d4f', padding: '0 4px' }} />
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
            <DashboardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Asset Category Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage device categories for DCIM equipment</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
            Add Category
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        {[
          { label: 'Total Categories', value: total,     color: '#1890ff', icon: <DashboardOutlined /> },
          { label: 'Active',           value: total,     color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: 'Compute & Power',  value: compute,   color: '#722ed1', icon: getIconComponent('FaMicrochip', '#722ed1', 16) },
          { label: 'Env & Safety',     value: envSafety, color: '#13c2c2', icon: getIconComponent('FaThermometerHalf', '#13c2c2', 16) },
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
          <Col xs={24} sm={24} md={18} lg={18}>
            <Input
              placeholder="Search categories by name or description..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear size="small"
            />
          </Col>
          <Col xs={24} sm={24} md={6} lg={6} style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 12, color: '#888' }}>
              {filteredCategories.length} / {total} shown
            </Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '7px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Categories List</Text>
          <Badge count={filteredCategories.length} style={{ backgroundColor: '#1890ff' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="id"
            size="small"
            bordered={false}
            scroll={{ x: 600 }}
            pagination={{
              pageSize: 8, showSizeChanger: false,
              showTotal: total => `${total} categories`,
              size: 'small', style: { padding: '5px 14px', margin: 0 }
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
          <div style={modalBoxStyle('500px')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#1890ff', fontSize: 15 }}>
                {editingItem ? 'Edit Category' : 'Add New Category'}
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: '#666' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                Category Name <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Compute, Cooling, Power"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#1890ff'}
                onBlur={e => e.target.style.borderColor = '#d9d9d9'}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>Min 2 characters, Max 50 characters</Text>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                Category Icon <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <Popover content={<IconSelector />} title="Select an Icon" trigger="click" placement="bottom">
                <Button style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                  <span style={{ fontSize: 18 }}>
                    {getIconComponent(selectedIcon, availableIcons.find(i => i.name === selectedIcon)?.color || '#1890ff', 18)}
                  </span>
                  <Text style={{ fontSize: 13 }}>
                    {availableIcons.find(i => i.name === selectedIcon)?.label || 'Select Icon'} — click to change
                  </Text>
                </Button>
              </Popover>
            </div>

            <div style={{ marginBottom: 14, padding: '6px 10px', backgroundColor: '#fff7e6', borderRadius: 6, fontSize: 12, color: '#888' }}>
              <ExclamationCircleOutlined style={{ marginRight: 6, color: '#faad14' }} />
              ID will be automatically generated
            </div>

            <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
              <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading}
                icon={editingItem ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? 'Saving...' : (editingItem ? 'Update Category' : 'Create Category')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && itemToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle('420px'), textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#ff4d4f', marginBottom: 10 }} />
            <h3 style={{ color: '#ff4d4f', marginBottom: 6 }}>Delete Category</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this category?</p>
            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 12, textAlign: 'left', fontSize: 13 }}>
              {[
                ['Category', <Space size={4} key="cat">{getIconComponent(itemToDelete.icon, itemToDelete.iconColor, 13)}<span>{itemToDelete.name}</span></Space>],
                ['ID', itemToDelete.id],
                ['Description', itemToDelete.description],
              ].map(([k, v]) => <p key={k} style={{ margin: '3px 0' }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: '#ff7875', fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Category</Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceCategory;