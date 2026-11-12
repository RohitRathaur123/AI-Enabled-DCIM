// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Table, Tag, Spin, Alert, Card, Row, Col, Statistic, Typography, Space,
//   Button, Select, message, Input, Switch, Divider, Avatar, Tooltip, Badge,
//   Modal, Timeline, Descriptions, InputNumber
// } from "antd";
// import {
//   DesktopOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, MailOutlined,
//   PhoneOutlined, GlobalOutlined, EnvironmentOutlined, IdcardOutlined,
//   CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, PlusOutlined,
//   SearchOutlined, ExclamationCircleOutlined, UserOutlined, BuildOutlined,
//   ShopOutlined, CloseOutlined, FileTextOutlined, CreditCardOutlined,
//   AccountBookOutlined, CodeOutlined, DashboardOutlined, WarningOutlined,
//   RiseOutlined, FallOutlined, ShoppingCartOutlined, InboxOutlined, ToolOutlined,
//   PlayCircleOutlined, CheckCircleFilled, SyncOutlined, DeleteFilled,
//   DisconnectOutlined, HistoryOutlined, DownOutlined, RightOutlined,
//   CalendarOutlined, SortAscendingOutlined, SortDescendingOutlined,
//   EyeOutlined, EyeInvisibleOutlined, DollarOutlined
// } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { confirm } = Modal;

// const DEFAULT_PRICES = {
//   "Server": 4500, "Network Switch": 2800, "Router": 1800, "Firewall": 3200,
//   "Storage": 6000, "Load Balancer": 3500, "UPS": 1200, "PDU": 800,
//   "HVAC": 5000, "Security Appliance": 2500, "Workstation": 1500,
//   "Laptop": 1200, "Printer": 600, "Scanner": 400, "Other": 1000
// };



// const AddingDevice = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showLifecycleModal, setShowLifecycleModal] = useState(false);
//   const [deviceToDelete, setDeviceToDelete] = useState(null);
//   const [editingDevice, setEditingDevice] = useState(null);
//   const [lifecycleDevice, setLifecycleDevice] = useState(null);
//   const [successMessage, setSuccessMessage] = useState(null);
//   const [error, setError] = useState(null);
//   const [viewOnly, setViewOnly] = useState(false);
//   const [expandedRowKeys, setExpandedRowKeys] = useState([]);

//   // Eye toggle per card — all hidden by default
//   const [showPrice, setShowPrice] = useState({ total: false, commissioned: false, maintenance: false, critical: false });
//   const togglePrice = (key) => setShowPrice(prev => ({ ...prev, [key]: !prev[key] }));

//   const [sortedInfo, setSortedInfo] = useState({ columnKey: 'id', order: 'ascend' });

//   const manufacturerOptions = ['Cisco','Dell','HP','NetApp','Fortinet','Juniper','Arista','Palo Alto','IBM','Lenovo','Supermicro','Huawei','VMware','Microsoft','Apple','Other'];
//   const modelOptions = ['Nexus 9000','PowerEdge R740','ProLiant DL380','FAS2750','FortiGate 100F','MX240','7280R','PA-850','vSphere','ThinkSystem SR650','SYS-1029U','CE6850','Catalyst 9300','PowerEdge R750','StoreOnce 6500','Other'];
//   const userOptions = ['John Smith','Sarah Johnson','Mike Chen','Lisa Wong','David Kumar','Priya Patel','Robert Brown','Emma Wilson'];
//   const locationOptions = ['Data Center - Floor 1','Data Center - Floor 2','Network Closet A','Network Closet B','Server Room - Main','Server Room - Backup','Office - Floor 1','Office - Floor 2','Warehouse','Remote Site - NYC','Remote Site - LA','Remote Site - Chicago','Vendor Location','In Transit'];

//   const lifecycleStages = [
//     { key: 'procurement',  name: 'Procurement',  icon: <ShoppingCartOutlined />, color: '#fa8c16' },
//     { key: 'received',     name: 'Received',     icon: <InboxOutlined />,        color: '#722ed1' },
//     { key: 'installed',    name: 'Installed',    icon: <ToolOutlined />,         color: '#1890ff' },
//     { key: 'commissioned', name: 'Commissioned', icon: <CheckCircleFilled />,    color: '#13c2c2' },
//     { key: 'maintenance',  name: 'Maintenance',  icon: <SyncOutlined />,         color: '#faad14' },
//     { key: 'retired',      name: 'Retired',      icon: <DeleteFilled />,         color: '#ff4d4f' },
//     { key: 'disposed',     name: 'Disposed',     icon: <DisconnectOutlined />,   color: '#000000' }
//   ];
//   const ACTIVE_STAGES = ['commissioned'];
//   const getStateFromStage = (stageKey) => stageKey === 'commissioned' ? 'Active' : 'Inactive';

//   const [lifecycleHistory, setLifecycleHistory] = useState([
//     { id: 1, deviceId: 1, stage: 'received',     changedBy: 'John Smith',    location: 'Data Center - Floor 1', changedAt: '2024-01-15 09:30', notes: 'Device received and verified' },
//     { id: 2, deviceId: 1, stage: 'installed',    changedBy: 'Sarah Johnson', location: 'Data Center - Floor 1', changedAt: '2024-01-16 14:20', notes: 'Installed in rack A12' },
//     { id: 3, deviceId: 1, stage: 'commissioned', changedBy: 'Mike Chen',     location: 'Data Center - Floor 1', changedAt: '2024-01-18 11:45', notes: 'Successfully commissioned and tested' },
//     { id: 4, deviceId: 3, stage: 'received',     changedBy: 'Lisa Wong',     location: 'Data Center - Floor 2', changedAt: '2024-02-10 10:15', notes: 'Storage array received' },
//     { id: 5, deviceId: 3, stage: 'maintenance',  changedBy: 'David Kumar',   location: 'Data Center - Floor 2', changedAt: '2024-02-12 16:30', notes: 'Scheduled maintenance started' },
//     { id: 6, deviceId: 5, stage: 'received',     changedBy: 'Emma Wilson',   location: 'Warehouse',             changedAt: '2024-03-01 11:20', notes: 'Backup server received' },
//   ]);

//   const [devices, setDevices] = useState([
//     { id: 1, deviceName: 'Core Switch-01',   deviceType: 'Network Switch',     category: 'Networking', manufacturer: 'Cisco',    model: 'Nexus 9000',     serialNumber: 'SN123456789', assetTag: 'AST-001-2024', lifecycleStage: 'commissioned', status: 'Active',         criticalityLevel: 'Critical', price: 2800, notes: 'Core network switch for production environment' },
//     { id: 2, deviceName: 'Server-Web-01',    deviceType: 'Server',             category: 'Compute',    manufacturer: 'Dell',     model: 'PowerEdge R740', serialNumber: 'SN987654321', assetTag: 'AST-002-2024', lifecycleStage: 'commissioned', status: 'Active',         criticalityLevel: 'High',     price: 4500, notes: 'Primary web server hosting company website' },
//     { id: 3, deviceName: 'Storage-Array-01', deviceType: 'Storage',            category: 'Storage',    manufacturer: 'NetApp',   model: 'FAS2750',        serialNumber: 'SN456789123', assetTag: 'AST-003-2024', lifecycleStage: 'maintenance',  status: 'In Maintenance', criticalityLevel: 'Critical', price: 6000, notes: 'Primary storage array - undergoing firmware update' },
//     { id: 4, deviceName: 'Firewall-01',      deviceType: 'Security Appliance', category: 'Security',   manufacturer: 'Fortinet', model: 'FortiGate 100F', serialNumber: 'SN789123456', assetTag: 'AST-004-2024', lifecycleStage: 'commissioned', status: 'Active',         criticalityLevel: 'Critical', price: 3200, notes: 'Perimeter firewall with advanced threat protection' },
//     { id: 5, deviceName: 'Backup-Server-01', deviceType: 'Server',             category: 'Compute',    manufacturer: 'HP',       model: 'ProLiant DL380', serialNumber: 'SN321654987', assetTag: 'AST-005-2024', lifecycleStage: 'procurement',  status: 'In Maintenance', criticalityLevel: 'Medium',   price: 4500, notes: 'Backup server - awaiting configuration' }
//   ]);

//   const deviceTypeOptions = ['Server','Network Switch','Router','Firewall','Storage','Load Balancer','UPS','PDU','HVAC','Security Appliance','Workstation','Laptop','Printer','Scanner','Other'];
//   const categoryOptions = ['Compute','Networking','Storage','Security','Power','Cooling','Peripheral','Mobile Device','Other'];
//   const statusOptions = ['Active','Inactive','In Maintenance','Retired','Reserved','Damaged'];
//   const criticalityOptions = ['Critical','High','Medium','Low','Non-Critical'];

//   const [formData, setFormData] = useState({ deviceName: '', deviceType: '', category: '', manufacturer: '', model: '', serialNumber: '', assetTag: '', lifecycleStage: 'procurement', status: 'Active', criticalityLevel: 'Medium', price: 0, _priceTouched: false, notes: '' });
//   const [lifecycleFormData, setLifecycleFormData] = useState({ newStage: '', changedBy: '', location: '', notes: '' });
//   const [searchText, setSearchText] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [typeFilter, setTypeFilter] = useState('all');
//   const [criticalityFilter, setCriticalityFilter] = useState('all');
//   const [lifecycleFilter, setLifecycleFilter] = useState('all');

//   useEffect(() => { if (successMessage) { const t = setTimeout(() => setSuccessMessage(null), 3000); return () => clearTimeout(t); } }, [successMessage]);
//   useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); } }, [error]);

//   // ── Pricing helpers ──────────────────────────────────────────────────────
//   const fmt = (n) => '₹' + n.toLocaleString('en-IN');
//   const totalCost        = devices.reduce((s, d) => s + (d.price || 0), 0);
//   const commissionedCost = devices.filter(d => d.lifecycleStage === 'commissioned').reduce((s, d) => s + (d.price || 0), 0);
//   const maintenanceCost  = devices.filter(d => d.lifecycleStage === 'maintenance').reduce((s, d) => s + (d.price || 0), 0);
//   const criticalCost     = devices.filter(d => d.criticalityLevel === 'Critical').reduce((s, d) => s + (d.price || 0), 0);

//   const handleInputChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
//   const handleSelectChange = (name, value) => {
//     setFormData(prev => {
//       const updated = { ...prev, [name]: value };
//       if (name === 'deviceType' && !prev._priceTouched) updated.price = DEFAULT_PRICES[value] || 1000;
//       return updated;
//     });
//   };
//   const handleLifecycleInputChange = (e) => { const { name, value } = e.target; setLifecycleFormData(prev => ({ ...prev, [name]: value })); };
//   const handleLifecycleSelectChange = (name, value) => setLifecycleFormData(prev => ({ ...prev, [name]: value }));

//   const openAddModal = () => { setEditingDevice(null); setViewOnly(false); setFormData({ deviceName: '', deviceType: '', category: '', manufacturer: '', model: '', serialNumber: '', assetTag: '', lifecycleStage: 'procurement', status: 'Active', criticalityLevel: 'Medium', price: 0, _priceTouched: false, notes: '' }); setShowModal(true); };
//   const openEditModal = (device) => { setEditingDevice(device); setViewOnly(false); setFormData({ deviceName: device.deviceName, deviceType: device.deviceType, category: device.category, manufacturer: device.manufacturer, model: device.model, serialNumber: device.serialNumber, assetTag: device.assetTag, lifecycleStage: device.lifecycleStage || 'procurement', status: device.status, criticalityLevel: device.criticalityLevel, price: device.price || 0, _priceTouched: true, notes: device.notes || '' }); setShowModal(true); };
//   const openLifecycleModal = (device) => { setLifecycleDevice(device); setLifecycleFormData({ newStage: '', changedBy: '', location: '', notes: '' }); setShowLifecycleModal(true); };
//   const openDeleteModal = (device) => { setDeviceToDelete(device); setShowDeleteModal(true); };
//   const closeModal = () => { setShowModal(false); setViewOnly(false); };
//   const closeLifecycleModal = () => { setShowLifecycleModal(false); setLifecycleDevice(null); };
//   const closeDeleteModal = () => { setShowDeleteModal(false); setDeviceToDelete(null); };

//   const handleDelete = () => { if (deviceToDelete) { setDevices(devices.filter(d => d.id !== deviceToDelete.id)); message.success('Device deleted successfully!'); closeDeleteModal(); } };

//   const handleLifecycleUpdate = () => {
//     if (!lifecycleFormData.newStage || !lifecycleFormData.changedBy || !lifecycleFormData.location) { setError('Please select lifecycle stage, user, and location'); return; }
//     if (lifecycleDevice) {
//       setDevices(devices.map(d => d.id === lifecycleDevice.id ? { ...d, lifecycleStage: lifecycleFormData.newStage } : d));
//       setLifecycleHistory([...lifecycleHistory, { id: lifecycleHistory.length + 1, deviceId: lifecycleDevice.id, stage: lifecycleFormData.newStage, changedBy: lifecycleFormData.changedBy, location: lifecycleFormData.location, changedAt: new Date().toLocaleString(), notes: lifecycleFormData.notes || 'Lifecycle stage updated' }]);
//       message.success(`Lifecycle updated to ${getLifecycleStageInfo(lifecycleFormData.newStage).name}!`);
//       closeLifecycleModal();
//     }
//   };

//   const handleSubmit = () => {
//     if (!formData.deviceName || !formData.deviceType || !formData.category || !formData.manufacturer || !formData.model) { setError('Please fill all required fields'); return; }
//     setLoading(true);
//     setTimeout(() => {
//       if (editingDevice) { setDevices(devices.map(d => d.id === editingDevice.id ? { ...d, ...formData } : d)); message.success('Device updated successfully!'); }
//       else { setDevices([...devices, { id: devices.length + 1, ...formData, serialNumber: formData.serialNumber || '-', assetTag: formData.assetTag || '-', notes: formData.notes || '-' }]); message.success('Device added successfully!'); }
//       setLoading(false); closeModal();
//     }, 500);
//   };

//   const handleExpandRow = (expanded, record) => { setExpandedRowKeys(expanded ? [record.id] : []); };
//   const handleTableChange = (pagination, filters, sorter) => setSortedInfo(sorter);

//   const getFilteredDevices = () => devices.filter(device => {
//     const s = searchText.toLowerCase();
//     const matchesSearch = !searchText || device.deviceName.toLowerCase().includes(s) || device.deviceType.toLowerCase().includes(s) || device.category.toLowerCase().includes(s) || device.manufacturer.toLowerCase().includes(s) || device.model.toLowerCase().includes(s) || (device.serialNumber && device.serialNumber.toLowerCase().includes(s)) || (device.assetTag && device.assetTag.toLowerCase().includes(s));
//     const matchesStatus = statusFilter === 'all' || device.status.toLowerCase() === statusFilter.toLowerCase();
//     const matchesType = typeFilter === 'all' || device.deviceType.toLowerCase() === typeFilter.toLowerCase();
//     const matchesCriticality = criticalityFilter === 'all' || device.criticalityLevel.toLowerCase() === criticalityFilter.toLowerCase();
//     const matchesLifecycle = lifecycleFilter === 'all' || device.lifecycleStage === lifecycleFilter;
//     return matchesSearch && matchesStatus && matchesType && matchesCriticality && matchesLifecycle;
//   });
  
//   const filteredDevices = getFilteredDevices();
//   const uniqueTypes = [...new Set(devices.map(d => d.deviceType))];
//   const getLifecycleStageCounts = () => { const counts = {}; lifecycleStages.forEach(stage => { counts[stage.key] = devices.filter(d => d.lifecycleStage === stage.key).length; }); return counts; };
//   const lifecycleCounts = getLifecycleStageCounts();

//   const totalDevices        = devices.length;
//   const commissionedDevices = devices.filter(d => d.lifecycleStage === 'commissioned').length;
//   const maintenanceDevices  = devices.filter(d => d.lifecycleStage === 'maintenance').length;
//   const criticalDevices     = devices.filter(d => d.criticalityLevel === 'Critical').length;

//   const getCriticalityColor = (level) => ({ Critical: '#ff4d4f', High: '#fa8c16', Medium: '#faad14', Low: '#52c41a', 'Non-Critical': '#8c8c8c' }[level] || '#1890ff');
//   const getLifecycleStageInfo = (stageKey) => lifecycleStages.find(s => s.key === stageKey) || lifecycleStages[0];
//   const getStatusBadge = (status) => { const statusColors = { Active: 'success', Inactive: 'default', 'In Maintenance': 'warning', Retired: 'error', Reserved: 'processing', Damaged: 'error' }; return <Badge status={statusColors[status] || 'default'} text={status} />; };
//   const getDeviceHistory = (deviceId) => lifecycleHistory.filter(h => h.deviceId === deviceId).sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

//   const expandedRowRender = (record) => {
//     const history = getDeviceHistory(record.id);
//     const historyColumns = [
//       { title: 'Date/Time', dataIndex: 'changedAt', key: 'changedAt', width: 160, render: (text) => <Space size={4}><CalendarOutlined style={{ color: '#1890ff' }} /><Text style={{ fontSize: 12 }}>{text}</Text></Space> },
//       { title: 'Stage',     dataIndex: 'stage',     key: 'stage',     width: 145, render: (stageKey) => { const s = getLifecycleStageInfo(stageKey); return <Tag color={s.color} icon={s.icon} style={{ fontSize: 11, margin: 0 }}>{s.name}</Tag>; } },
//       { title: 'State',     dataIndex: 'stage',     key: 'state',     width: 90,  render: (stageKey) => { const isActive = ACTIVE_STAGES.includes(stageKey); return <Tag color={isActive ? 'success' : 'default'} style={{ fontSize: 11, margin: 0 }}>{isActive ? 'Active' : 'Inactive'}</Tag>; } },
//       { title: 'Changed By',dataIndex: 'changedBy', key: 'changedBy', width: 140, render: (text) => <Space size={4}><UserOutlined style={{ color: '#fa8c16' }} /><Text style={{ fontSize: 12 }}>{text}</Text></Space> },
//       { title: 'Location',  dataIndex: 'location',  key: 'location',  ellipsis: true, render: (text) => <Space size={4}><EnvironmentOutlined style={{ color: '#722ed1' }} /><Text style={{ fontSize: 12 }}>{text}</Text></Space> },
//       { title: 'Notes',     dataIndex: 'notes',     key: 'notes',     ellipsis: true, render: (text) => <Text type="secondary" style={{ fontSize: 12 }}>{text || '-'}</Text> }
//     ];
//     return (
//       <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: 4 }}>
//         <Space style={{ marginBottom: 12 }}>
//           <HistoryOutlined style={{ fontSize: 16, color: '#1890ff' }} />
//           <Text strong style={{ color: '#1890ff' }}>Lifecycle History</Text>
//           <Badge count={history.length} style={{ backgroundColor: '#1890ff' }} />
//         </Space>
//         {history.length > 0 ? <Table columns={historyColumns} dataSource={history} rowKey="id" pagination={false} size="small" bordered style={{ backgroundColor: 'white' }} /> : <Alert type="info" message="No lifecycle history recorded yet." showIcon />}
//       </div>
//     );
//   };

//   const columns = [
//     { title: 'ID', dataIndex: 'id', key: 'id', width: 60, sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === 'id' && sortedInfo.order, render: (text, record) => (<Space size={2}><Button type="text" icon={expandedRowKeys.includes(record.id) ? <DownOutlined /> : <PlusOutlined />} onClick={() => handleExpandRow(!expandedRowKeys.includes(record.id), record)} size="small" style={{ color: '#1890ff', padding: '0 2px' }} /><Text style={{ fontSize: 12 }}>{text}</Text></Space>) },
//     { title: 'Alias', dataIndex: 'deviceName', key: 'deviceName', sorter: (a, b) => a.deviceName.localeCompare(b.deviceName), sortOrder: sortedInfo.columnKey === 'deviceName' && sortedInfo.order, ellipsis: true, render: (text, record) => (<Space size={6}><Avatar style={{ backgroundColor: getCriticalityColor(record.criticalityLevel), flexShrink: 0 }} icon={<DesktopOutlined />} size={24} /><Text strong style={{ fontSize: 12 }}>{text}</Text></Space>) },
//     { title: 'Type',         dataIndex: 'deviceType',     key: 'deviceType',     width: 110, sorter: (a, b) => a.deviceType.localeCompare(b.deviceType),     sortOrder: sortedInfo.columnKey === 'deviceType' && sortedInfo.order,     render: (text) => <Tag color="blue"   style={{ fontSize: 11, margin: 0 }}>{text}</Tag> },
//     { title: 'Category',     dataIndex: 'category',       key: 'category',       width: 90,  sorter: (a, b) => a.category.localeCompare(b.category),         sortOrder: sortedInfo.columnKey === 'category' && sortedInfo.order,       render: (text) => <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>{text}</Tag> },
//     { title: 'Manufacturer', dataIndex: 'manufacturer',   key: 'manufacturer',   width: 100, sorter: (a, b) => a.manufacturer.localeCompare(b.manufacturer), sortOrder: sortedInfo.columnKey === 'manufacturer' && sortedInfo.order,   ellipsis: true, render: (text) => <Text style={{ fontSize: 12 }}>{text}</Text> },
//     { title: 'Model',        dataIndex: 'model',          key: 'model',          width: 110, sorter: (a, b) => a.model.localeCompare(b.model),               sortOrder: sortedInfo.columnKey === 'model' && sortedInfo.order,          ellipsis: true, render: (text) => <Text style={{ fontSize: 12 }}>{text}</Text> },
//     { title: 'Asset Tag',    dataIndex: 'assetTag',       key: 'assetTag',       width: 110, render: (text) => <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>{text}</Tag> },
//     { title: 'Lifecycle', dataIndex: 'lifecycleStage', key: 'lifecycleStage', width: 120, sorter: (a, b) => a.lifecycleStage.localeCompare(b.lifecycleStage), sortOrder: sortedInfo.columnKey === 'lifecycleStage' && sortedInfo.order, render: (text) => { const stage = getLifecycleStageInfo(text); return <Tag color={stage.color} icon={stage.icon} style={{ fontSize: 11, margin: 0 }}>{stage.name}</Tag>; } },
//     { title: 'Status', dataIndex: 'status', key: 'status', width: 110, sorter: (a, b) => a.status.localeCompare(b.status), sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order, render: (text) => getStatusBadge(text) },
//     { title: 'Actions', key: 'actions', width: 90, render: (_, record) => (<Space size={0}><Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: '#1890ff', padding: '4px 6px' }} /></Tooltip><Tooltip title="Lifecycle"><Button type="text" icon={<HistoryOutlined />} onClick={() => openLifecycleModal(record)} style={{ color: '#fa8c16', padding: '4px 6px' }} /></Tooltip><Tooltip title="Delete"><Button type="text" icon={<DeleteOutlined />} onClick={() => openDeleteModal(record)} style={{ color: '#ff4d4f', padding: '4px 6px' }} /></Tooltip></Space>) },
//   ];

//   // ── Reusable stat card with eye-toggle price ─────────────────────────────
//   const StatCard = ({ borderColor, icon, label, count, priceKey, priceValue, priceLabel }) => {
//     const visible = showPrice[priceKey];
//     return (
//       <Card hoverable style={{ borderTop: `3px solid ${borderColor}`, position: 'relative' }} bodyStyle={{ padding: '14px 16px' }}>
//         {/* Eye icon — top right */}
//         <Tooltip title={visible ? 'Hide price' : 'Show price'}>
//           <Button
//             type="text" size="small"
//             icon={visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
//             onClick={() => togglePrice(priceKey)}
//             style={{ position: 'absolute', top: 6, right: 6, color: visible ? borderColor : '#bfbfbf', padding: '2px 4px' }}
//           />
//         </Tooltip>

//         {/* Count — unchanged */}
//         <Statistic
//           title={<Space>{icon}<span style={{ fontSize: 12 }}>{label}</span></Space>}
//           value={count}
//           valueStyle={{ color: borderColor, fontSize: 22 }}
//         />

//         {/* Price row below count — always occupies space, content toggles */}
//         <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #f0f0f0', display: 'flex', alignItems: 'center', gap: 5, minHeight: 22 }}>
//           <DollarOutlined style={{ fontSize: 11, color: visible ? borderColor : '#e0e0e0' }} />
//           {visible
//             ? <Text style={{ fontSize: 12, fontWeight: 700, color: borderColor }}>{fmt(priceValue)}</Text>
//             : <Text style={{ fontSize: 12, letterSpacing: 3, color: '#d9d9d9' }}>••••••</Text>
//           }
//           <Text type="secondary" style={{ fontSize: 11 }}>{priceLabel}</Text>
//         </div>
//       </Card>
//     );
//   };

//   return (
//     <div style={{ padding: "16px", backgroundColor: "#f5f7fa", minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>

//       {/* Header */}
//       <Row justify="space-between" align="middle" style={{ marginBottom: 16, flexWrap: "wrap" }}>
//         <Col xs={24} sm={24} md={14}>
//           <Title level={3} style={{ margin: 0 }}>
//             <DashboardOutlined style={{ marginRight: 10, color: "#1890ff" }} />
//             Asset Onboarding
//           </Title>
//           <Text type="secondary" style={{ fontSize: 13 }}>Manage IT devices and equipment with lifecycle tracking</Text>
//         </Col>
//         <Col xs={24} sm={24} md={10} style={{ textAlign: "right", marginTop: 8 }}>
//           <Space wrap>
//             <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>Add Device</Button>
//             <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Refresh</Button>
//           </Space>
//         </Col>
//       </Row>

//       {/* Messages */}
//       {successMessage && <Alert message="Success" description={successMessage} type="success" showIcon style={{ marginBottom: 12 }} closable onClose={() => setSuccessMessage(null)} />}
//       {error         && <Alert message="Error"   description={error}          type="error"   showIcon style={{ marginBottom: 12 }} closable onClose={() => setError(null)} />}

//       {/* ── Statistics Cards — with eye-toggle price inside each card ── */}
//       <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
//         <Col xs={12} sm={12} md={6}>
//           <StatCard borderColor="#1890ff" icon={<DesktopOutlined />}                                     label="Total Devices"  count={totalDevices}        priceKey="total"        priceValue={totalCost}        priceLabel="total value"    />
//         </Col>
//         <Col xs={12} sm={12} md={6}>
//           <StatCard borderColor="#13c2c2" icon={<CheckCircleFilled style={{ color: "#13c2c2" }} />}      label="Commissioned"   count={commissionedDevices} priceKey="commissioned" priceValue={commissionedCost} priceLabel="active value"   />
//         </Col>
//         <Col xs={12} sm={12} md={6}>
//           <StatCard borderColor="#fa8c16" icon={<WarningOutlined   style={{ color: "#fa8c16" }} />}      label="In Maintenance" count={maintenanceDevices}  priceKey="maintenance"  priceValue={maintenanceCost}  priceLabel="maint. cost"    />
//         </Col>
//         <Col xs={12} sm={12} md={6}>
//           <StatCard borderColor="#ff4d4f" icon={<RiseOutlined      style={{ color: "#ff4d4f" }} />}      label="Critical"       count={criticalDevices}     priceKey="critical"     priceValue={criticalCost}     priceLabel="at-risk value"  />
//         </Col>
//       </Row>

//       {/* Lifecycle Stages Legend */}
//       <Card style={{ marginBottom: 10, backgroundColor: '#fafafa' }} bodyStyle={{ padding: '8px 16px' }}>
//         <Row gutter={[8, 6]} wrap>
//           {lifecycleStages.map(stage => (
//             <Col key={stage.key}>
//               <Tag color={stage.color} icon={stage.icon} style={{ padding: '3px 7px', fontSize: 11 }}>
//                 {stage.name} ({lifecycleCounts[stage.key] || 0})
//               </Tag>
//             </Col>
//           ))}
//         </Row>
//       </Card>

//       {/* Filters */}
//       <Card style={{ marginBottom: 10 }} bodyStyle={{ padding: '10px 16px' }}>
//         <Row gutter={[10, 10]} align="middle">
//           <Col xs={24} sm={24} md={7}><Input placeholder="Search devices..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear size="small" /></Col>
//           <Col xs={12} sm={6} md={4}><Select placeholder="Type" style={{ width: '100%' }} value={typeFilter} onChange={setTypeFilter} size="small"><Option value="all">All Types</Option>{uniqueTypes.map(t => <Option key={t} value={t.toLowerCase()}>{t}</Option>)}</Select></Col>
//           <Col xs={12} sm={6} md={4}><Select placeholder="Lifecycle" style={{ width: '100%' }} value={lifecycleFilter} onChange={setLifecycleFilter} size="small"><Option value="all">All Stages</Option>{lifecycleStages.map(s => <Option key={s.key} value={s.key}>{s.name}</Option>)}</Select></Col>
//           <Col xs={12} sm={6} md={4}><Select placeholder="Criticality" style={{ width: '100%' }} value={criticalityFilter} onChange={setCriticalityFilter} size="small"><Option value="all">All Levels</Option>{criticalityOptions.map(l => <Option key={l} value={l.toLowerCase()}>{l}</Option>)}</Select></Col>
//           <Col xs={12} sm={6} md={3}><Select placeholder="Status" style={{ width: '100%' }} value={statusFilter} onChange={setStatusFilter} size="small"><Option value="all">All Status</Option>{statusOptions.map(s => <Option key={s} value={s.toLowerCase()}>{s}</Option>)}</Select></Col>
//           <Col xs={24} sm={24} md={2} style={{ textAlign: 'right' }}><Text style={{ fontSize: 12 }}>{filteredDevices.length}/{totalDevices}</Text></Col>
//         </Row>
//       </Card>

//       {/* Table */}
//       <Card bodyStyle={{ padding: "0" }} style={{ width: "100%" }}>
//         <Table columns={columns} dataSource={filteredDevices} loading={loading} bordered rowKey="id"
//           expandable={{ expandedRowRender, expandedRowKeys, onExpand: handleExpandRow, expandIcon: () => null, showExpandColumn: false }}
//           pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `${total} devices`, pageSizeOptions: ['10', '20', '50'], size: 'small' }}
//           onChange={handleTableChange} size="small" style={{ width: "100%" }}
//           locale={{ emptyText: <Alert type="info" message="No devices found" description="No devices match your criteria." showIcon /> }}
//           scroll={{ x: true }}
//         />
//       </Card>

//       {/* Add/Edit Device Modal */}
//       {showModal && (
//         <>
//           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={closeModal} />
//           <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '750px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//               <h2 style={{ margin: 0, color: '#1890ff' }}>{editingDevice ? 'Edit Device' : 'Add New Device'}</h2>
//               <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ fontSize: '16px', color: '#666' }} />
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Category *</label>
//                 <Select placeholder="Select category" style={{ width: '100%' }} value={formData.category || undefined} onChange={(v) => handleSelectChange('category', v)}>
//                   {categoryOptions.map(c => <Option key={c} value={c}>{c}</Option>)}
//                 </Select>
//               </div>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Device Type *</label>
//                 <Select placeholder="Select device type" style={{ width: '100%' }} value={formData.deviceType || undefined} onChange={(v) => handleSelectChange('deviceType', v)}>
//                   {deviceTypeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
//                 </Select>
//               </div>
              
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Manufacturer *</label>
//                 <Select placeholder="Select manufacturer" style={{ width: '100%' }} value={formData.manufacturer || undefined} onChange={(v) => handleSelectChange('manufacturer', v)} showSearch allowClear>
//                   {manufacturerOptions.map(m => <Option key={m} value={m}>{m}</Option>)}
//                 </Select>
//               </div>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Model *</label>
//                 <Select placeholder="Select model" style={{ width: '100%' }} value={formData.model || undefined} onChange={(v) => handleSelectChange('model', v)} showSearch allowClear>
//                   {modelOptions.map(m => <Option key={m} value={m}>{m}</Option>)}
//                 </Select>
//               </div>
//             </div>

//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Alias *</label>
//               <input type="text" name="deviceName" value={formData.deviceName} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4 }} placeholder="Enter Alias name" />
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Serial Number</label>
//                 <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4 }} placeholder="Enter serial number" />
//               </div>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Asset Tag</label>
//                 <input type="text" name="assetTag" value={formData.assetTag} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4 }} placeholder="Enter asset tag" />
//               </div>
//             </div>

//             {/* ── Price field ── */}
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>
//                 <DollarOutlined style={{ color: '#52c41a', marginRight: 4 }} />Asset Price (₹)
//               </label>
//               <InputNumber
//                 prefix="₹" min={0} step={100} style={{ width: '100%' }}
//                 value={formData.price}
//                 onChange={(v) => setFormData(prev => ({ ...prev, price: v || 0, _priceTouched: true }))}
//                 formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                 parser={val => val.replace(/₹\s?|(,*)/g, '')}
//                 placeholder="Enter asset price"
//               />
//               <Text type="secondary" style={{ fontSize: 11 }}>
//                 {formData.deviceType && !formData._priceTouched ? `Auto-filled for ${formData.deviceType}` : 'Enter the purchase / acquisition price'}
//               </Text>
//             </div>

//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Lifecycle Stage *</label>
//               <Select placeholder="Select lifecycle stage" style={{ width: '100%' }} value={formData.lifecycleStage} onChange={(v) => handleSelectChange('lifecycleStage', v)}>
//                 {lifecycleStages.map(s => <Option key={s.key} value={s.key}><Space>{s.icon}{s.name}</Space></Option>)}
//               </Select>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
//               <div>
//                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Status *</label>
//                 <Select placeholder="Select status" style={{ width: '100%' }} value={formData.status} onChange={(v) => handleSelectChange('status', v)}>
//                   {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
//                 </Select>
//               </div>
          
//             </div>

//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Notes</label>
//               <textarea name="notes" value={formData.notes} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4, minHeight: '80px' }} placeholder="Enter any additional notes" />
//             </div>

//             <Divider style={{ margin: '16px 0' }} />
//             <div style={{ textAlign: 'right' }}>
//               <button onClick={closeModal} style={{ padding: '8px 16px', marginRight: 8, border: '1px solid #d9d9d9', background: 'white', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
//               <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 16px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
//                 {loading ? 'Saving...' : editingDevice ? 'Update Device' : 'Create Device'}
//               </button>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Lifecycle Update Modal */}
//       {showLifecycleModal && lifecycleDevice && (
//         <>
//           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={closeLifecycleModal} />
//           <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//               <h2 style={{ margin: 0, color: '#fa8c16' }}><HistoryOutlined /> Update Lifecycle Stage</h2>
//               <Button type="text" icon={<CloseOutlined />} onClick={closeLifecycleModal} style={{ fontSize: '16px', color: '#666' }} />
//             </div>
//             <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
//               <p style={{ margin: '4px 0' }}><strong>Device:</strong> {lifecycleDevice.deviceName}</p>
//               <p style={{ margin: '4px 0' }}><strong>Current Stage:</strong> <Tag color={getLifecycleStageInfo(lifecycleDevice.lifecycleStage).color}>{getLifecycleStageInfo(lifecycleDevice.lifecycleStage).name}</Tag></p>
//               <p style={{ margin: '4px 0' }}><strong>Type:</strong> {lifecycleDevice.deviceType} | <strong>Model:</strong> {lifecycleDevice.model}</p>
//             </div>
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>New Lifecycle Stage *</label>
//               <Select placeholder="Select new stage" style={{ width: '100%' }} value={lifecycleFormData.newStage || undefined} onChange={(v) => handleLifecycleSelectChange('newStage', v)}>
//                 {lifecycleStages.filter(s => s.key !== lifecycleDevice.lifecycleStage).map(s => (<Option key={s.key} value={s.key}><Space>{s.icon}{s.name}</Space></Option>))}
//               </Select>
//             </div>
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Changed By *</label>
//               <Select placeholder="Select user" style={{ width: '100%' }} value={lifecycleFormData.changedBy || undefined} onChange={(v) => handleLifecycleSelectChange('changedBy', v)} showSearch>
//                 {userOptions.map(u => <Option key={u} value={u}>{u}</Option>)}
//               </Select>
//             </div>
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Location *</label>
//               <Select placeholder="Select location" style={{ width: '100%' }} value={lifecycleFormData.location || undefined} onChange={(v) => handleLifecycleSelectChange('location', v)} showSearch>
//                 {locationOptions.map(l => <Option key={l} value={l}>{l}</Option>)}
//               </Select>
//             </div>
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Notes</label>
//               <textarea name="notes" value={lifecycleFormData.notes} onChange={handleLifecycleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4, minHeight: '80px' }} placeholder="Enter notes about this lifecycle change" />
//             </div>
//             <Divider style={{ margin: '16px 0' }} />
//             <div style={{ textAlign: 'right' }}>
//               <button onClick={closeLifecycleModal} style={{ padding: '8px 16px', marginRight: 8, border: '1px solid #d9d9d9', background: 'white', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
//               <button onClick={handleLifecycleUpdate} style={{ padding: '8px 16px', background: '#fa8c16', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Update Lifecycle</button>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && deviceToDelete && (
//         <>
//           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={closeDeleteModal} />
//           <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%', zIndex: 1001, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', textAlign: 'center' }}>
//             <div style={{ marginBottom: '16px' }}><ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} /></div>
//             <h2 style={{ color: '#ff4d4f', marginBottom: '8px' }}>Delete Device</h2>
//             <p style={{ fontSize: '16px', marginBottom: '8px' }}>Are you sure you want to delete this device?</p>
//             <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '16px', textAlign: 'left' }}>
//               <p style={{ margin: '4px 0' }}><strong>Device:</strong> {deviceToDelete.deviceName}</p>
//               <p style={{ margin: '4px 0' }}><strong>Type:</strong> {deviceToDelete.deviceType}</p>
//               <p style={{ margin: '4px 0' }}><strong>Manufacturer:</strong> {deviceToDelete.manufacturer} | <strong>Model:</strong> {deviceToDelete.model}</p>
//               <p style={{ margin: '4px 0' }}><strong>Serial:</strong> {deviceToDelete.serialNumber} | <strong>Tag:</strong> {deviceToDelete.assetTag}</p>
//               <p style={{ margin: '4px 0' }}><strong>Lifecycle:</strong> {getLifecycleStageInfo(deviceToDelete.lifecycleStage).name} | <strong>Status:</strong> {deviceToDelete.status}</p>
//             </div>
//             <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>This action cannot be undone.</p>
//             <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
//               <button onClick={closeDeleteModal} style={{ padding: '8px 24px', border: '1px solid #d9d9d9', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
//               <button onClick={handleDelete} style={{ padding: '8px 24px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Delete Device</button>
//             </div>
//           </div>
//         </>
//       )}

//       <div className="fixed bottom-2 left-4 text-xs font-bold z-50 pointer-events-none">
//       </div>

//       <style jsx="true">{`
//         .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 12px; }
//         .ant-table-small .ant-table-tbody > tr > td { padding: 5px 8px; }
//         .history-table .ant-table-thead > tr > th { background-color: #f0f5ff; font-weight: 600; color: #1890ff; }
//         .history-table .ant-table-tbody > tr:hover > td { background-color: #e6f7ff; }
//       `}</style>
//     </div>
//   );
// };

// export default AddingDevice;

//------------------------------------------------------------------------------------------------------------
// AddingDevice.jsx
import React, { useState, useEffect } from "react";
import {
  Table, Tag, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Divider, Avatar, Tooltip, Badge,
  InputNumber
} from "antd";
import {
  DesktopOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, UserOutlined,
  CloseOutlined, DashboardOutlined, WarningOutlined,
  ShoppingCartOutlined, InboxOutlined, ToolOutlined,
  CheckCircleFilled, SyncOutlined, DeleteFilled,
  DisconnectOutlined, HistoryOutlined, DownOutlined,
  CalendarOutlined, EnvironmentOutlined,
  EyeOutlined, EyeInvisibleOutlined, DollarOutlined
} from "@ant-design/icons";
import { ASSETS, CATALOGUE, CATEGORY_NAMES, MANUFACTURERS, MODELS, TYPES } from "../Component/MainDashboard/dcimAssetRegister";
import { TECHNICIANS } from "../Component/MainDashboard/dcimDashboardData";

const { Title, Text } = Typography;
const { Option } = Select;

// Every device listed here is an asset of the 5D View (97 on the floor + 567
// in its 46 racks = 664), taken from the shared asset register — the same
// list the Asset Dashboard and the Dashboard's DCIM tab count.
const shiftDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

// Default price (₹) per device type: that type's catalogue price.
const DEFAULT_PRICES = Object.fromEntries(TYPES.map(t => [t.type, (MODELS.find(m => m.type === t.type) || {}).priceInr || 0]));

// Who handles which kind of asset (the Ticket page's technicians).
const TECH_FOR = { Power: 'Neha Gupta', Cooling: 'Neha Gupta', Network: 'Priya Sharma', Security: 'Amit Verma', Compute: 'Rajesh Kumar' };
const STORES = 'Stores (goods inward)';

const REGISTER_DEVICES = ASSETS.map(a => ({
  id: a.id, deviceName: a.tag, deviceType: a.type, category: a.category, manufacturer: a.manufacturer, model: a.model,
  serialNumber: a.serialNumber, assetTag: a.assetTag, lifecycleStage: 'commissioned', status: 'Active', price: a.priceInr,
  location: a.location, warrantyDate: a.warrantyUntil, eolDate: a.eolOn,
  notes: a.alarm ? `Active alarm: ${a.alarm.title} (${a.alarm.detail})` : (a.role || CATALOGUE[a.key].description),
}));

// Received → installed → commissioned, dated from each asset's install date.
const REGISTER_HISTORY = ASSETS.flatMap(a => {
  const who = TECH_FOR[a.category] || 'Rajesh Kumar';
  return [
    { deviceId: a.id, stage: 'received',     changedBy: who, location: STORES,     changedAt: `${shiftDays(a.installedOn, -6)} 10:30`, notes: `Received from ${a.manufacturer} — S/N ${a.serialNumber}` },
    { deviceId: a.id, stage: 'installed',    changedBy: who, location: a.location, changedAt: `${a.installedOn} 14:00`,                notes: a.rack ? `Mounted in ${a.rack} at U${a.u}` : `Installed in the ${a.room}` },
    { deviceId: a.id, stage: 'commissioned', changedBy: who, location: a.location, changedAt: `${shiftDays(a.installedOn, 2)} 11:15`,  notes: 'Commissioned and tested' },
  ];
}).map((h, i) => ({ id: i + 1, ...h }));

const AddingDevice = () => {
  const [loading, setLoading]                         = useState(false);
  const [showModal, setShowModal]                     = useState(false);
  const [showDeleteModal, setShowDeleteModal]         = useState(false);
  const [showLifecycleModal, setShowLifecycleModal]   = useState(false);
  const [deviceToDelete, setDeviceToDelete]           = useState(null);
  const [editingDevice, setEditingDevice]             = useState(null);
  const [lifecycleDevice, setLifecycleDevice]         = useState(null);
  const [error, setError]                             = useState(null);
  const [expandedRowKeys, setExpandedRowKeys]         = useState([]);
  const [showPrice, setShowPrice]                     = useState({ total: false, active: false, inactive: false, eol: false });
  const togglePrice = (key) => setShowPrice(prev => ({ ...prev, [key]: !prev[key] }));
  const [sortedInfo, setSortedInfo]                   = useState({ columnKey: 'id', order: 'ascend' });

  const manufacturerOptions = MANUFACTURERS.map(m => m.name);
  const modelOptions        = MODELS.map(m => m.model);
  const userOptions         = TECHNICIANS.map(t => t.name);
  const locationOptions     = [STORES, ...new Set(ASSETS.map(a => a.room))];
  const deviceTypeOptions   = TYPES.map(t => t.type);
  const categoryOptions     = CATEGORY_NAMES;
  const statusOptions       = ['Active','Inactive','In Maintenance','Retired','Reserved','Damaged'];

  const lifecycleStages = [
    { key: 'procurement',  name: 'Procurement',  icon: <ShoppingCartOutlined />, color: '#fa8c16' },
    { key: 'received',     name: 'Received',     icon: <InboxOutlined />,        color: '#722ed1' },
    { key: 'installed',    name: 'Installed',    icon: <ToolOutlined />,         color: '#1890ff' },
    { key: 'commissioned', name: 'Commissioned', icon: <CheckCircleFilled />,    color: '#13c2c2' },
    { key: 'maintenance',  name: 'Maintenance',  icon: <SyncOutlined />,         color: '#faad14' },
    { key: 'retired',      name: 'Retired',      icon: <DeleteFilled />,         color: '#ff4d4f' },
    { key: 'disposed',     name: 'Disposed',     icon: <DisconnectOutlined />,   color: '#000000' }
  ];
  const ACTIVE_STAGES = ['commissioned'];
  const getStatusFromStage = (stageKey) => stageKey === 'commissioned' ? 'Active' : 'Inactive';
  const getLifecycleStageInfo = (stageKey) => lifecycleStages.find(s => s.key === stageKey) || lifecycleStages[0];

  const [lifecycleHistory, setLifecycleHistory] = useState(REGISTER_HISTORY);

  const [devices, setDevices] = useState(REGISTER_DEVICES);

  const emptyForm = { deviceName:'', deviceType:'', category:'', manufacturer:'', model:'', serialNumber:'', assetTag:'', lifecycleStage:'procurement', status:'Inactive', price:0, _priceTouched:false, location:'', warrantyDate:'', eolDate:'', notes:'' };
  const [formData, setFormData]                   = useState(emptyForm);
  const [lifecycleFormData, setLifecycleFormData] = useState({ newStage:'', changedBy:'', location:'', notes:'' });
  const [searchText, setSearchText]               = useState('');
  const [statusFilter, setStatusFilter]           = useState('all');
  const [typeFilter, setTypeFilter]               = useState('all');
  const [lifecycleFilter, setLifecycleFilter]     = useState('all');

  useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); } }, [error]);

  // ── Computed values ────────────────────────────────────────────────────
  const fmt = (n) => '&#8377;' + n.toLocaleString('en-IN');

  const totalDevices    = devices.length;
  const activeDevices   = devices.filter(d => d.status === 'Active').length;
  const inactiveDevices = devices.filter(d => d.status !== 'Active').length;
  const eolCount        = devices.filter(d => d.eolDate && new Date(d.eolDate) < new Date(Date.now() + 365*24*3600*1000)).length;

  const totalCost    = devices.reduce((s, d) => s + (d.price || 0), 0);
  const activeCost   = devices.filter(d => d.status === 'Active').reduce((s, d) => s + (d.price || 0), 0);
  const inactiveCost = devices.filter(d => d.status !== 'Active').reduce((s, d) => s + (d.price || 0), 0);
  const eolCost      = devices.filter(d => d.eolDate && new Date(d.eolDate) < new Date(Date.now() + 365*24*3600*1000)).reduce((s, d) => s + (d.price || 0), 0);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleSelectChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'deviceType' && !prev._priceTouched) updated.price = DEFAULT_PRICES[value] || 1000;
      if (name === 'lifecycleStage') updated.status = getStatusFromStage(value);
      return updated;
    });
  };
  const handleLifecycleInputChange  = (e) => { const { name, value } = e.target; setLifecycleFormData(prev => ({ ...prev, [name]: value })); };
  const handleLifecycleSelectChange = (name, value) => setLifecycleFormData(prev => ({ ...prev, [name]: value }));

  const openAddModal       = ()  => { setEditingDevice(null); setFormData(emptyForm); setShowModal(true); };
  const openEditModal      = (d) => { setEditingDevice(d); setFormData({ deviceName:d.deviceName, deviceType:d.deviceType, category:d.category, manufacturer:d.manufacturer, model:d.model, serialNumber:d.serialNumber, assetTag:d.assetTag, lifecycleStage:d.lifecycleStage||'procurement', status:d.status, price:d.price||0, _priceTouched:true, location:d.location||'', warrantyDate:d.warrantyDate||'', eolDate:d.eolDate||'', notes:d.notes||'' }); setShowModal(true); };
  const openLifecycleModal = (d) => { setLifecycleDevice(d); setLifecycleFormData({ newStage:'', changedBy:'', location:'', notes:'' }); setShowLifecycleModal(true); };
  const openDeleteModal    = (d) => { setDeviceToDelete(d); setShowDeleteModal(true); };
  const closeModal          = () => setShowModal(false);
  const closeLifecycleModal = () => { setShowLifecycleModal(false); setLifecycleDevice(null); };
  const closeDeleteModal    = () => { setShowDeleteModal(false); setDeviceToDelete(null); };

  const handleDelete = () => {
    if (deviceToDelete) { setDevices(devices.filter(d => d.id !== deviceToDelete.id)); message.success('Device deleted!'); closeDeleteModal(); }
  };

  const handleLifecycleUpdate = () => {
    if (!lifecycleFormData.newStage || !lifecycleFormData.changedBy || !lifecycleFormData.location) { setError('Please select lifecycle stage, user, and location'); return; }
    if (lifecycleDevice) {
      setDevices(devices.map(d => d.id === lifecycleDevice.id ? { ...d, lifecycleStage: lifecycleFormData.newStage, status: getStatusFromStage(lifecycleFormData.newStage) } : d));
      setLifecycleHistory([...lifecycleHistory, { id: lifecycleHistory.length + 1, deviceId: lifecycleDevice.id, stage: lifecycleFormData.newStage, changedBy: lifecycleFormData.changedBy, location: lifecycleFormData.location, changedAt: new Date().toLocaleString(), notes: lifecycleFormData.notes || 'Lifecycle stage updated' }]);
      message.success(`Lifecycle updated to ${getLifecycleStageInfo(lifecycleFormData.newStage).name}!`);
      closeLifecycleModal();
    }
  };

  const handleSubmit = () => {
    if (!formData.deviceName || !formData.deviceType || !formData.category || !formData.manufacturer || !formData.model) { setError('Please fill all required fields'); return; }
    setLoading(true);
    setTimeout(() => {
      if (editingDevice) {
        setDevices(devices.map(d => d.id === editingDevice.id ? { ...d, ...formData } : d));
        message.success('Device updated successfully!');
      } else {
        setDevices([...devices, { id: devices.length + 1, ...formData, serialNumber: formData.serialNumber || '-', assetTag: formData.assetTag || '-', notes: formData.notes || '-' }]);
        message.success('Device added successfully!');
      }
      setLoading(false); closeModal();
    }, 500);
  };

  const handleExpandRow   = (expanded, record) => setExpandedRowKeys(expanded ? [record.id] : []);
  const handleTableChange = (pagination, filters, sorter) => setSortedInfo(sorter);
  const getDeviceHistory  = (deviceId) => lifecycleHistory.filter(h => h.deviceId === deviceId).sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  const filteredDevices = devices.filter(device => {
    const s = searchText.toLowerCase();
    const matchSearch    = !searchText || device.deviceName.toLowerCase().includes(s) || device.deviceType.toLowerCase().includes(s) || device.category.toLowerCase().includes(s) || device.manufacturer.toLowerCase().includes(s) || device.model.toLowerCase().includes(s) || (device.serialNumber && device.serialNumber.toLowerCase().includes(s)) || (device.assetTag && device.assetTag.toLowerCase().includes(s)) || (device.location && device.location.toLowerCase().includes(s));
    const matchStatus    = statusFilter    === 'all' || device.status.toLowerCase()     === statusFilter.toLowerCase();
    const matchType      = typeFilter      === 'all' || device.deviceType.toLowerCase() === typeFilter.toLowerCase();
    const matchLifecycle = lifecycleFilter === 'all' || device.lifecycleStage           === lifecycleFilter;
    return matchSearch && matchStatus && matchType && matchLifecycle;
  });

  const uniqueTypes = [...new Set(devices.map(d => d.deviceType))];
  const getLifecycleStageCounts = () => { const c = {}; lifecycleStages.forEach(s => { c[s.key] = devices.filter(d => d.lifecycleStage === s.key).length; }); return c; };
  const lifecycleCounts = getLifecycleStageCounts();

  const getStatusBadge = (status) => {
    const colors = { Active:'success', Inactive:'default', 'In Maintenance':'warning', Retired:'error', Reserved:'processing', Damaged:'error' };
    return <Badge status={colors[status]||'default'} text={<span style={{ fontSize:11 }}>{status}</span>} />;
  };

  const expandedRowRender = (record) => {
    const history = getDeviceHistory(record.id);
    const historyColumns = [
      { title:'Date/Time', dataIndex:'changedAt', key:'changedAt', width:150, render: t => <Space size={4}><CalendarOutlined style={{ color:'#1890ff' }}/><Text style={{ fontSize:11 }}>{t}</Text></Space> },
      { title:'Stage',     dataIndex:'stage',     key:'stage',     width:130, render: k => { const s = getLifecycleStageInfo(k); return <Tag color={s.color} icon={s.icon} style={{ fontSize:11 }}>{s.name}</Tag>; } },
      { title:'State',     dataIndex:'stage',     key:'state',     width:80,  render: k => <Tag color={ACTIVE_STAGES.includes(k)?'success':'default'} style={{ fontSize:11 }}>{ACTIVE_STAGES.includes(k)?'Active':'Inactive'}</Tag> },
      { title:'Changed By',dataIndex:'changedBy', key:'changedBy', width:130, render: t => <Space size={4}><UserOutlined style={{ color:'#fa8c16' }}/><Text style={{ fontSize:11 }}>{t}</Text></Space> },
      { title:'Location',  dataIndex:'location',  key:'location',  ellipsis:true, render: t => <Space size={4}><EnvironmentOutlined style={{ color:'#722ed1' }}/><Text style={{ fontSize:11 }}>{t}</Text></Space> },
      { title:'Notes',     dataIndex:'notes',     key:'notes',     ellipsis:true, render: t => <Text type="secondary" style={{ fontSize:11 }}>{t||'-'}</Text> }
    ];
    return (
      <div style={{ padding:'10px', backgroundColor:'#f9f9f9', borderRadius:4 }}>
        <Space style={{ marginBottom:8 }}>
          <HistoryOutlined style={{ color:'#1890ff' }}/>
          <Text strong style={{ color:'#1890ff', fontSize:12 }}>Lifecycle History</Text>
          <Badge count={history.length} style={{ backgroundColor:'#1890ff' }}/>
        </Space>
        {history.length > 0
          ? <Table columns={historyColumns} dataSource={history} rowKey="id" pagination={false} size="small" bordered style={{ backgroundColor:'white' }}/>
          : <div style={{ padding:'8px 0', color:'#999', fontSize:12 }}>No lifecycle history recorded yet.</div>
        }
      </div>
    );
  };

  const columns = [
    { title:'ID', dataIndex:'id', key:'id', width:52, sorter:(a,b)=>a.id-b.id, sortOrder:sortedInfo.columnKey==='id'&&sortedInfo.order,
      render:(text,record)=>(<Space size={2}><Button type="text" icon={expandedRowKeys.includes(record.id)?<DownOutlined/>:<PlusOutlined/>} onClick={()=>handleExpandRow(!expandedRowKeys.includes(record.id),record)} size="small" style={{ color:'#1890ff', padding:'0 2px' }}/><Text style={{ fontSize:11 }}>{text}</Text></Space>) },
    { title:'Alias', dataIndex:'deviceName', key:'deviceName', sorter:(a,b)=>a.deviceName.localeCompare(b.deviceName), sortOrder:sortedInfo.columnKey==='deviceName'&&sortedInfo.order, ellipsis:true, width:140,
      render:(text)=>(<Space size={4}><Avatar style={{ backgroundColor:'#1890ff', flexShrink:0 }} icon={<DesktopOutlined/>} size={20}/><Text strong style={{ fontSize:11 }}>{text}</Text></Space>) },
    { title:'Type',         dataIndex:'deviceType',   key:'deviceType',   width:100, sorter:(a,b)=>a.deviceType.localeCompare(b.deviceType),   sortOrder:sortedInfo.columnKey==='deviceType'&&sortedInfo.order,   render:t=><Tag color="blue"   style={{ fontSize:10,margin:0,padding:'0 4px' }}>{t}</Tag> },
    { title:'Cat.',         dataIndex:'category',     key:'category',     width:76,  sorter:(a,b)=>a.category.localeCompare(b.category),       sortOrder:sortedInfo.columnKey==='category'&&sortedInfo.order,     render:t=><Tag color="purple" style={{ fontSize:10,margin:0,padding:'0 4px' }}>{t}</Tag> },
    { title:'Mfr.',         dataIndex:'manufacturer', key:'manufacturer', width:72,  ellipsis:true, render:t=><Text style={{ fontSize:11 }}>{t}</Text> },
    { title:'Model',        dataIndex:'model',        key:'model',        width:100, ellipsis:true, render:t=><Text style={{ fontSize:11 }}>{t}</Text> },
    { title:'Tag',          dataIndex:'assetTag',     key:'assetTag',     width:90,  render:t=><Tag color="cyan" style={{ fontSize:10,margin:0,padding:'0 4px' }}>{t}</Tag> },
    { title:'Location',     dataIndex:'location',     key:'location',     width:130, ellipsis:true, render:t=>t?<Space size={3}><EnvironmentOutlined style={{ color:'#722ed1',fontSize:10 }}/><Text style={{ fontSize:10 }}>{t}</Text></Space>:<Text type="secondary" style={{ fontSize:10 }}>-</Text> },
    { title:'Warranty',     dataIndex:'warrantyDate', key:'warrantyDate', width:86,
      render:t=>t?<Text style={{ fontSize:10 }}>{t}</Text>:<Text type="secondary" style={{ fontSize:10 }}>-</Text>,
      sorter:(a,b)=>new Date(a.warrantyDate||0)-new Date(b.warrantyDate||0), sortOrder:sortedInfo.columnKey==='warrantyDate'&&sortedInfo.order },
    { title:'EOL',          dataIndex:'eolDate',      key:'eolDate',      width:86,
      render:t=>{ if(!t) return <Text type="secondary" style={{ fontSize:10 }}>-</Text>; const expired=new Date(t)<new Date(); const soon=!expired&&new Date(t)<new Date(Date.now()+365*24*3600*1000); return <Tag color={expired?'red':soon?'orange':'default'} style={{ fontSize:10,margin:0,padding:'0 4px' }}>{t}</Tag>; },
      sorter:(a,b)=>new Date(a.eolDate||0)-new Date(b.eolDate||0), sortOrder:sortedInfo.columnKey==='eolDate'&&sortedInfo.order },
    { title:'Lifecycle',    dataIndex:'lifecycleStage', key:'lifecycleStage', width:108,
      sorter:(a,b)=>a.lifecycleStage.localeCompare(b.lifecycleStage), sortOrder:sortedInfo.columnKey==='lifecycleStage'&&sortedInfo.order,
      render:t=>{ const s=getLifecycleStageInfo(t); return <Tag color={s.color} icon={s.icon} style={{ fontSize:10,margin:0,padding:'0 4px' }}>{s.name}</Tag>; } },
    { title:'Status',       dataIndex:'status',       key:'status',       width:90,
      sorter:(a,b)=>a.status.localeCompare(b.status), sortOrder:sortedInfo.columnKey==='status'&&sortedInfo.order, render:t=>getStatusBadge(t) },
    { title:'', key:'actions', width:72, fixed:'right',
      render:(_,r)=>(<Space size={0}><Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>openEditModal(r)} style={{ color:'#1890ff',padding:'0 3px' }}/></Tooltip><Tooltip title="Lifecycle"><Button type="text" size="small" icon={<HistoryOutlined/>} onClick={()=>openLifecycleModal(r)} style={{ color:'#fa8c16',padding:'0 3px' }}/></Tooltip><Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined/>} onClick={()=>openDeleteModal(r)} style={{ color:'#ff4d4f',padding:'0 3px' }}/></Tooltip></Space>) },
  ];

  // ── Shared style tokens ────────────────────────────────────────────────
  const backdropStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1000 };
  const modalBoxStyle = (width) => ({ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'white', padding:'20px', borderRadius:'8px', width, maxWidth:'95%', maxHeight:'92vh', overflowY:'auto', zIndex:1001, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' });
  const lbl       = { display:'block', marginBottom:4, fontWeight:500, fontSize:13 };
  const inputStyle= { width:'100%', padding:'6px 10px', border:'1px solid #d9d9d9', borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };

  // ── Stat Card (AddDeviceType-style with price eye-toggle) ───────────────
  const StatCard = ({ label, count, priceKey, priceValue, color, icon }) => {
    const vis = showPrice[priceKey];
    return (
      <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 14px', borderTop:`3px solid ${color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', gap:0, position:'relative' }}>
        <Tooltip title={vis ? 'Hide value' : 'Show value'}>
          <Button type="text" size="small"
            icon={vis ? <EyeOutlined/> : <EyeInvisibleOutlined/>}
            onClick={() => togglePrice(priceKey)}
            style={{ position:'absolute', top:3, right:3, color:vis?color:'#bbb', padding:'2px 4px' }}/>
        </Tooltip>
        <div style={{ display:'flex', alignItems:'center', gap:10, paddingRight:20 }}>
          <span style={{ fontSize:22, color }}>{icon}</span>
          <div>
            <div style={{ fontSize:11, color:'#888', lineHeight:1.3 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{count}</div>
          </div>
        </div>
        <div style={{ marginTop:4, paddingTop:4, borderTop:'1px dashed #f0f0f0', display:'flex', alignItems:'center', gap:3 }}>
          <DollarOutlined style={{ fontSize:10, color:vis?color:'#e0e0e0' }}/>
          {vis
            ? <Text style={{ fontSize:11, fontWeight:700, color }}>{'\u20B9'}{priceValue.toLocaleString('en-IN')}</Text>
            : <Text style={{ fontSize:11, letterSpacing:1, color:'#d9d9d9' }}>•••••</Text>
          }
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor:'#f0f2f5', padding:'10px 16px', boxSizing:'border-box', overflow:'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexShrink:0 }}>
        <div>
          <Title level={4} style={{ margin:0, lineHeight:1.3 }}>
            <DashboardOutlined style={{ marginRight:8, color:'#1890ff' }}/>
            Asset Onboarding
          </Title>
          <Text type="secondary" style={{ fontSize:12 }}>Manage IT devices and equipment with lifecycle tracking</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined/>} onClick={openAddModal} size="small"
            style={{ background:'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border:'none' }}>
            Add Device
          </Button>
          <Button icon={<ReloadOutlined/>} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError(null)}
          style={{ marginBottom:6, padding:'4px 12px', fontSize:12, flexShrink:0 }}/>
      )}

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom:8, flexShrink:0 }}>
        <Col span={6}><StatCard label="Total Devices"  count={totalDevices}    priceKey="total"    priceValue={totalCost}    color="#1890ff" icon={<DesktopOutlined style={{ color:'#1890ff' }}/>}/></Col>
        <Col span={6}><StatCard label="Active"         count={activeDevices}   priceKey="active"   priceValue={activeCost}   color="#52c41a" icon={<CheckCircleOutlined style={{ color:'#52c41a' }}/>}/></Col>
        <Col span={6}><StatCard label="Inactive"       count={inactiveDevices} priceKey="inactive" priceValue={inactiveCost} color="#8c8c8c" icon={<CloseCircleOutlined style={{ color:'#8c8c8c' }}/>}/></Col>
        <Col span={6}><StatCard label="EOL < 1 Year"   count={eolCount}        priceKey="eol"      priceValue={eolCost}      color="#ff4d4f" icon={<WarningOutlined    style={{ color:'#ff4d4f' }}/>}/></Col>
      </Row>

      {/* ── LIFECYCLE LEGEND ── */}
      <div style={{ backgroundColor:'white', borderRadius:6, padding:'6px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={[8, 4]} wrap>
          {lifecycleStages.map(stage => (
            <Col key={stage.key}>
              <Tag color={stage.color} icon={stage.icon} style={{ padding:'2px 7px', fontSize:11 }}>
                {stage.name} ({lifecycleCounts[stage.key]||0})
              </Tag>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor:'white', borderRadius:6, padding:'8px 12px', marginBottom:8, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={8} lg={8}>
            <Input placeholder="Search devices, location, serial, tag..." prefix={<SearchOutlined style={{ color:'#bbb' }}/>}
              value={searchText} onChange={e=>setSearchText(e.target.value)} allowClear size="small"/>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={typeFilter} onChange={setTypeFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Types</Option>
              {uniqueTypes.map(t=><Option key={t} value={t.toLowerCase()}>{t}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={lifecycleFilter} onChange={setLifecycleFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Stages</Option>
              {lifecycleStages.map(s=><Option key={s.key} value={s.key}>{s.name}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width:'100%' }}>
              <Option value="all">All Status</Option>
              {statusOptions.map(s=><Option key={s} value={s.toLowerCase()}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={0} sm={0} md={4} lg={4} style={{ textAlign:'right' }}>
            <Text style={{ fontSize:12, color:'#888', whiteSpace:'nowrap' }}>{filteredDevices.length} / {totalDevices} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex:1, backgroundColor:'white', borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
        <div style={{ padding:'7px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <Text strong style={{ fontSize:13 }}>Devices List</Text>
          <Badge count={filteredDevices.length} style={{ backgroundColor:'#1890ff' }}/>
        </div>
        <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
          <Table
            columns={columns} dataSource={filteredDevices} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x:'max-content' }}
            expandable={{ expandedRowRender, expandedRowKeys, onExpand:handleExpandRow, expandIcon:()=>null, showExpandColumn:false }}
            pagination={{ pageSize:8, showSizeChanger:false, showTotal:total=>`${total} devices`, size:'small', style:{ padding:'5px 14px', margin:0 } }}
            onChange={handleTableChange} style={{ fontSize:12 }}
            locale={{ emptyText:<div style={{ padding:'12px 0', textAlign:'center', color:'#999', fontSize:13 }}>No data found</div> }}
          />
        </div>
      </div>



      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal}/>
          <div style={modalBoxStyle('760px')}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, color:'#1890ff', fontSize:15 }}>{editingDevice ? 'Edit Device' : 'Add New Device'}</h3>
              <Button type="text" icon={<CloseOutlined/>} onClick={closeModal} style={{ color:'#666' }}/>
            </div>

            {/* Row 1 */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={8}>
                <label style={lbl}>Category <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select category" style={{ width:'100%' }} size="small" value={formData.category||undefined} onChange={v=>handleSelectChange('category',v)}>
                  {categoryOptions.map(c=><Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={lbl}>Device Type <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select device type" style={{ width:'100%' }} size="small" value={formData.deviceType||undefined} onChange={v=>handleSelectChange('deviceType',v)}>
                  {deviceTypeOptions.map(t=><Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={lbl}>Alias <span style={{ color:'#ff4d4f' }}>*</span></label>
                <input type="text" name="deviceName" value={formData.deviceName} onChange={handleInputChange} style={inputStyle}
                  placeholder="Enter alias name"
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
              </Col>
            </Row>

            {/* Row 2 */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={8}>
                <label style={lbl}>Manufacturer <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select manufacturer" style={{ width:'100%' }} size="small" value={formData.manufacturer||undefined} onChange={v=>handleSelectChange('manufacturer',v)} showSearch allowClear>
                  {manufacturerOptions.map(m=><Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={lbl}>Model <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select model" style={{ width:'100%' }} size="small" value={formData.model||undefined} onChange={v=>handleSelectChange('model',v)} showSearch allowClear>
                  {modelOptions.map(m=><Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Col>
              
<Col span={8}>
  <label style={lbl}>Location</label>
  <input type="text" name="location" value={formData.location} onChange={handleInputChange} style={inputStyle}
    placeholder="Enter location"
    onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
</Col>
            </Row>

            {/* Row 3 */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={8}>
                <label style={lbl}>Serial Number</label>
                <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} style={inputStyle}
                  placeholder="Enter serial number"
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
              </Col>
              <Col span={8}>
                <label style={lbl}>Asset Tag</label>
                <input type="text" name="assetTag" value={formData.assetTag} onChange={handleInputChange} style={inputStyle}
                  placeholder="Enter asset tag"
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
              </Col>
              <Col span={8}>
                <label style={lbl}><DollarOutlined style={{ color:'#52c41a', marginRight:4 }}/>Asset Price (&#x20B9;)</label>
                <InputNumber prefix="&#x20B9;" min={0} step={100} size="small" style={{ width:'100%' }} value={formData.price}
                  onChange={v=>setFormData(prev=>({ ...prev, price:v||0, _priceTouched:true }))}
                  formatter={val=>`${val}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
                  parser={val=>val.replace(/[\u20B9]\s?|(,*)/g,'')} placeholder="Enter asset price"/>
                <Text type="secondary" style={{ fontSize:11 }}>
                  {formData.deviceType && !formData._priceTouched ? `Auto-filled for ${formData.deviceType}` : 'Acquisition price'}
                </Text>
              </Col>
            </Row>

            {/* Row 4 */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={8}>
                <label style={lbl}>Warranty Date</label>
                <input type="date" name="warrantyDate" value={formData.warrantyDate} onChange={handleInputChange} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
              </Col>
              <Col span={8}>
                <label style={lbl}>EOL (End of Life) Date</label>
                <input type="date" name="eolDate" value={formData.eolDate} onChange={handleInputChange} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='#1890ff'} onBlur={e=>e.target.style.borderColor='#d9d9d9'}/>
              </Col>
              <Col span={8}>
                <label style={lbl}>Lifecycle Stage <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select lifecycle stage" style={{ width:'100%' }} size="small" value={formData.lifecycleStage} onChange={v=>handleSelectChange('lifecycleStage',v)}>
                  {lifecycleStages.map(s=><Option key={s.key} value={s.key}><Space size={4}>{s.icon}<span>{s.name}</span></Space></Option>)}
                </Select>
              </Col>
            </Row>

            {/* Row 5 */}
            <Row gutter={12} style={{ marginBottom:14 }}>
              <Col span={8}>
                <label style={lbl}>Status <span style={{ color:'#ff4d4f' }}>*</span></label>
                <Select placeholder="Select status" style={{ width:'100%' }} size="small" value={formData.status} onChange={v=>handleSelectChange('status',v)}>
                  {statusOptions.map(s=><Option key={s} value={s}>{s}</Option>)}
                </Select>
                <Text type="secondary" style={{ fontSize:11 }}>Auto-set by lifecycle stage</Text>
              </Col>
              <Col span={16}>
                <label style={lbl}>Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange}
                  style={{ ...inputStyle, minHeight:60, resize:'vertical' }} placeholder="Enter any additional notes"/>
              </Col>
            </Row>

            <Divider style={{ margin:'12px 0' }}/>
            <div style={{ textAlign:'right' }}>
              <Button onClick={closeModal} style={{ marginRight:8 }}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingDevice?<EditOutlined/>:<PlusOutlined/>}>
                {loading ? 'Saving...' : editingDevice ? 'Update Device' : 'Create Device'}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ LIFECYCLE MODAL ══ */}
      {showLifecycleModal && lifecycleDevice && (
        <>
          <div style={backdropStyle} onClick={closeLifecycleModal}/>
          <div style={modalBoxStyle('520px')}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, color:'#fa8c16', fontSize:15 }}><HistoryOutlined style={{ marginRight:6 }}/>Update Lifecycle Stage</h3>
              <Button type="text" icon={<CloseOutlined/>} onClick={closeLifecycleModal} style={{ color:'#666' }}/>
            </div>
            <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:16, fontSize:13 }}>
              <p style={{ margin:'3px 0' }}><strong>Device:</strong> {lifecycleDevice.deviceName}</p>
              <p style={{ margin:'3px 0' }}><strong>Current Stage:</strong> <Tag color={getLifecycleStageInfo(lifecycleDevice.lifecycleStage).color}>{getLifecycleStageInfo(lifecycleDevice.lifecycleStage).name}</Tag></p>
              <p style={{ margin:'3px 0' }}><strong>Type:</strong> {lifecycleDevice.deviceType} | <strong>Model:</strong> {lifecycleDevice.model}</p>
            </div>
            {[
              { label:'New Lifecycle Stage *', field:'newStage',  opts:lifecycleStages.filter(s=>s.key!==lifecycleDevice.lifecycleStage).map(s=>({ key:s.key, label:<Space size={4}>{s.icon}<span>{s.name}</span></Space> })) },
              { label:'Changed By *',          field:'changedBy', opts:userOptions.map(u=>({ key:u, label:u })) },
              { label:'Location *',            field:'location',  opts:locationOptions.map(l=>({ key:l, label:l })) },
            ].map(({ label, field, opts }) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={lbl}>{label}</label>
                <Select placeholder={`Select ${field}`} style={{ width:'100%' }} size="small" value={lifecycleFormData[field]||undefined} onChange={v=>handleLifecycleSelectChange(field,v)} showSearch>
                  {opts.map(o=><Option key={o.key} value={o.key}>{o.label}</Option>)}
                </Select>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Notes</label>
              <textarea name="notes" value={lifecycleFormData.notes} onChange={handleLifecycleInputChange}
                style={{ ...inputStyle, minHeight:70, resize:'vertical' }} placeholder="Enter notes about this lifecycle change"/>
            </div>
            <Divider style={{ margin:'12px 0' }}/>
            <div style={{ textAlign:'right' }}>
              <Button onClick={closeLifecycleModal} style={{ marginRight:8 }}>Cancel</Button>
              <Button style={{ background:'#fa8c16', borderColor:'#fa8c16', color:'white' }} onClick={handleLifecycleUpdate} icon={<HistoryOutlined/>}>
                Update Lifecycle
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && deviceToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal}/>
          <div style={{ ...modalBoxStyle('440px'), textAlign:'center' }}>
            <ExclamationCircleOutlined style={{ fontSize:40, color:'#ff4d4f', marginBottom:10 }}/>
            <h3 style={{ color:'#ff4d4f', marginBottom:6 }}>Delete Device</h3>
            <p style={{ fontSize:14, marginBottom:10 }}>Are you sure you want to delete this device?</p>
            <div style={{ backgroundColor:'#f5f5f5', padding:12, borderRadius:4, marginBottom:12, textAlign:'left', fontSize:13 }}>
              {[
                ['Device',       deviceToDelete.deviceName],
                ['Type',         deviceToDelete.deviceType],
                ['Manufacturer', deviceToDelete.manufacturer + ' \u2014 ' + deviceToDelete.model],
                ['Serial / Tag', deviceToDelete.serialNumber + ' / ' + deviceToDelete.assetTag],
                ['Location',     deviceToDelete.location || '-'],
                ['Lifecycle',    getLifecycleStageInfo(deviceToDelete.lifecycleStage).name + ' \u2014 ' + deviceToDelete.status],
              ].map(([k,v])=><p key={k} style={{ margin:'3px 0' }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color:'#ff7875', fontSize:12, marginBottom:16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined/>}>Delete Device</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddingDevice;