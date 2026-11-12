// LifeCycle.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Tag,
  Spin,
  Alert,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Select,
  message,
  Input,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  Modal,
  Timeline,
  Progress
} from "antd";
import {
  BankOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  BuildOutlined,
  ShopOutlined,
  CloseOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  AccountBookOutlined,
  CodeOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  SettingOutlined,
  TableOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ToolOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SyncOutlined,
  DeleteFilled,
  DisconnectOutlined,
  HistoryOutlined,
  CalendarOutlined,
  TagOutlined  // Added missing import
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const LifeCycle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [lifecycleToDelete, setLifecycleToDelete] = useState(null);
  const [selectedLifecycle, setSelectedLifecycle] = useState(null);
  const [editingLifecycle, setEditingLifecycle] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  
  // Companies for dropdown
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Acme Technologies' },
    { id: 2, name: 'Tech Solutions Inc' },
    { id: 3, name: 'Data Center Inc' },
    { id: 4, name: 'Cloud Solutions Ltd' }
  ]);

  // Device Categories
  const [deviceCategories, setDeviceCategories] = useState([
    { id: 1, name: 'Networking Equipment' },
    { id: 2, name: 'Servers' },
    { id: 3, name: 'Storage Devices' },
    { id: 4, name: 'Security Systems' },
    { id: 5, name: 'IoT Devices' }
  ]);

  // Device Types
  const [deviceTypes, setDeviceTypes] = useState([
    { id: 1, categoryId: 1, name: 'Router' },
    { id: 2, categoryId: 1, name: 'Switch' },
    { id: 3, categoryId: 1, name: 'Firewall' },
    { id: 4, categoryId: 1, name: 'Access Point' },
    { id: 5, categoryId: 2, name: 'Rack Server' },
    { id: 6, categoryId: 2, name: 'Tower Server' },
    { id: 7, categoryId: 2, name: 'Blade Server' },
    { id: 8, categoryId: 3, name: 'NAS' },
    { id: 9, categoryId: 3, name: 'SAN' },
    { id: 10, categoryId: 4, name: 'CCTV Camera' },
    { id: 11, categoryId: 4, name: 'Access Control' },
    { id: 12, categoryId: 5, name: 'Sensor' }
  ]);

  // Lifecycle stages
  const lifecycleStages = [
    { key: 'procurement', name: 'Procurement', icon: <ShoppingCartOutlined />, color: '#fa8c16', progress: 10 },
    { key: 'received', name: 'Received', icon: <InboxOutlined />, color: '#722ed1', progress: 25 },
    { key: 'installed', name: 'Installed', icon: <ToolOutlined />, color: '#1890ff', progress: 40 },
    { key: 'commissioned', name: 'Commissioned', icon: <PlayCircleOutlined />, color: '#13c2c2', progress: 55 },
    { key: 'active', name: 'Active', icon: <CheckCircleFilled />, color: '#52c41a', progress: 70 },
    { key: 'maintenance', name: 'Maintenance', icon: <SyncOutlined />, color: '#faad14', progress: 85 },
    { key: 'retired', name: 'Retired', icon: <DeleteFilled />, color: '#ff4d4f', progress: 95 },
    { key: 'disposed', name: 'Disposed', icon: <DisconnectOutlined />, color: '#000000', progress: 100 }
  ];

  // Static lifecycle data
  const [lifecycles, setLifecycles] = useState([
    { 
      id: 1, 
      companyId: 1,
      companyName: 'Acme Technologies',
      deviceCategoryId: 1,
      deviceCategoryName: 'Networking Equipment',
      deviceTypeId: 1,
      deviceTypeName: 'Router',
      deviceModal: 'RT-AC5300',
      serialNumber: 'SN123456789',
      assetTag: 'AST-001-2024',
      currentStage: 'active',
      stageHistory: [
        { stage: 'procurement', date: '2024-01-10', notes: 'PO raised for new router' },
        { stage: 'received', date: '2024-01-15', notes: 'Device received in warehouse' },
        { stage: 'installed', date: '2024-01-18', notes: 'Installed in server room' },
        { stage: 'commissioned', date: '2024-01-20', notes: 'Commissioned and tested' },
        { stage: 'active', date: '2024-01-21', notes: 'In production use' }
      ],
      procurementDate: '2024-01-10',
      receivedDate: '2024-01-15',
      installedDate: '2024-01-18',
      commissionedDate: '2024-01-20',
      activeDate: '2024-01-21',
      warrantyEnd: '2026-01-20',
      location: 'Server Room A',
      department: 'IT Infrastructure',
      assignedTo: 'John Doe',
      notes: 'Primary network router',
      status: 'Active'
    },
    { 
      id: 2, 
      companyId: 1,
      companyName: 'Acme Technologies',
      deviceCategoryId: 2,
      deviceCategoryName: 'Servers',
      deviceTypeId: 5,
      deviceTypeName: 'Rack Server',
      deviceModal: 'PowerEdge R740',
      serialNumber: 'SN987654321',
      assetTag: 'AST-002-2024',
      currentStage: 'maintenance',
      stageHistory: [
        { stage: 'procurement', date: '2024-02-01', notes: 'Server ordered' },
        { stage: 'received', date: '2024-02-10', notes: 'Received in datacenter' },
        { stage: 'installed', date: '2024-02-12', notes: 'Rack mounted' },
        { stage: 'commissioned', date: '2024-02-15', notes: 'OS installed and configured' },
        { stage: 'active', date: '2024-02-16', notes: 'In production' },
        { stage: 'maintenance', date: '2024-03-20', notes: 'Scheduled maintenance - firmware update' }
      ],
      procurementDate: '2024-02-01',
      receivedDate: '2024-02-10',
      installedDate: '2024-02-12',
      commissionedDate: '2024-02-15',
      activeDate: '2024-02-16',
      maintenanceDate: '2024-03-20',
      warrantyEnd: '2027-02-15',
      location: 'Datacenter Row B',
      department: 'IT Operations',
      assignedTo: 'Jane Smith',
      notes: 'Primary application server',
      status: 'Active'
    },
    { 
      id: 3, 
      companyId: 2,
      companyName: 'Tech Solutions Inc',
      deviceCategoryId: 4,
      deviceCategoryName: 'Security Systems',
      deviceTypeId: 10,
      deviceTypeName: 'CCTV Camera',
      deviceModal: 'DS-2CD2385G1',
      serialNumber: 'SN456789123',
      assetTag: 'AST-003-2024',
      currentStage: 'retired',
      stageHistory: [
        { stage: 'procurement', date: '2023-12-01', notes: 'Camera ordered' },
        { stage: 'received', date: '2023-12-10', notes: 'Received' },
        { stage: 'installed', date: '2023-12-15', notes: 'Installed at entrance' },
        { stage: 'commissioned', date: '2023-12-16', notes: 'Configured and tested' },
        { stage: 'active', date: '2023-12-17', notes: 'Active monitoring' },
        { stage: 'retired', date: '2024-03-15', notes: 'Replaced with newer model' }
      ],
      procurementDate: '2023-12-01',
      receivedDate: '2023-12-10',
      installedDate: '2023-12-15',
      commissionedDate: '2023-12-16',
      activeDate: '2023-12-17',
      retiredDate: '2024-03-15',
      location: 'Main Entrance',
      department: 'Security',
      assignedTo: 'Mike Johnson',
      notes: 'Replaced due to upgrade',
      status: 'Inactive'
    }
  ]);

  const [formData, setFormData] = useState({
    companyId: '',
    deviceCategoryId: '',
    deviceTypeId: '',
    deviceModal: '',
    serialNumber: '',
    assetTag: '',
    currentStage: 'procurement',
    procurementDate: '',
    receivedDate: '',
    installedDate: '',
    commissionedDate: '',
    activeDate: '',
    maintenanceDate: '',
    retiredDate: '',
    disposedDate: '',
    warrantyEnd: '',
    location: '',
    department: '',
    assignedTo: '',
    notes: '',
    status: true
  });

  const [searchText, setSearchText] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset device type when category changes
      ...(name === 'deviceCategoryId' ? { deviceTypeId: '' } : {})
    }));
  };

  const openAddModal = () => {
    setEditingLifecycle(null);
    setFormData({
      companyId: '',
      deviceCategoryId: '',
      deviceTypeId: '',
      deviceModal: '',
      serialNumber: '',
      assetTag: '',
      currentStage: 'procurement',
      procurementDate: new Date().toISOString().split('T')[0],
      receivedDate: '',
      installedDate: '',
      commissionedDate: '',
      activeDate: '',
      maintenanceDate: '',
      retiredDate: '',
      disposedDate: '',
      warrantyEnd: '',
      location: '',
      department: '',
      assignedTo: '',
      notes: '',
      status: true
    });
    setShowModal(true);
  };

  const openEditModal = (lifecycle) => {
    setEditingLifecycle(lifecycle);
    setFormData({
      companyId: lifecycle.companyId,
      deviceCategoryId: lifecycle.deviceCategoryId,
      deviceTypeId: lifecycle.deviceTypeId,
      deviceModal: lifecycle.deviceModal,
      serialNumber: lifecycle.serialNumber,
      assetTag: lifecycle.assetTag,
      currentStage: lifecycle.currentStage,
      procurementDate: lifecycle.procurementDate || '',
      receivedDate: lifecycle.receivedDate || '',
      installedDate: lifecycle.installedDate || '',
      commissionedDate: lifecycle.commissionedDate || '',
      activeDate: lifecycle.activeDate || '',
      maintenanceDate: lifecycle.maintenanceDate || '',
      retiredDate: lifecycle.retiredDate || '',
      disposedDate: lifecycle.disposedDate || '',
      warrantyEnd: lifecycle.warrantyEnd || '',
      location: lifecycle.location || '',
      department: lifecycle.department || '',
      assignedTo: lifecycle.assignedTo || '',
      notes: lifecycle.notes || '',
      status: lifecycle.status === 'Active'
    });
    setShowModal(true);
  };

  const openTimelineModal = (lifecycle) => {
    setSelectedLifecycle(lifecycle);
    setShowTimelineModal(true);
  };

  const openDeleteModal = (lifecycle) => {
    setLifecycleToDelete(lifecycle);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeTimelineModal = () => {
    setShowTimelineModal(false);
    setSelectedLifecycle(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setLifecycleToDelete(null);
  };

  const handleDelete = () => {
    if (lifecycleToDelete) {
      setLifecycles(lifecycles.filter(lc => lc.id !== lifecycleToDelete.id));
      message.success('Lifecycle record deleted successfully!');
      closeDeleteModal();
    }
  };

  const handleStageUpdate = (newStage) => {
    const today = new Date().toISOString().split('T')[0];
    const stageDateField = `${newStage}Date`;
    
    setFormData(prev => ({
      ...prev,
      currentStage: newStage,
      [stageDateField]: today
    }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.companyId || !formData.deviceCategoryId || !formData.deviceTypeId || !formData.deviceModal || !formData.serialNumber) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    // Get selected names
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    const selectedCategory = deviceCategories.find(c => c.id === formData.deviceCategoryId);
    const selectedDeviceType = deviceTypes.find(d => d.id === formData.deviceTypeId);

    // Build stage history
    const stageHistory = [];
    const stages = ['procurement', 'received', 'installed', 'commissioned', 'active', 'maintenance', 'retired', 'disposed'];
    
    stages.forEach(stage => {
      const dateField = `${stage}Date`;
      if (formData[dateField]) {
        stageHistory.push({
          stage: stage,
          date: formData[dateField],
          notes: `Device ${stage}`
        });
      }
    });

    setTimeout(() => {
      if (editingLifecycle) {
        // Update existing lifecycle
        setLifecycles(lifecycles.map(lc => 
          lc.id === editingLifecycle.id 
            ? { 
                ...lc, 
                companyId: formData.companyId,
                companyName: selectedCompany?.name || '',
                deviceCategoryId: formData.deviceCategoryId,
                deviceCategoryName: selectedCategory?.name || '',
                deviceTypeId: formData.deviceTypeId,
                deviceTypeName: selectedDeviceType?.name || '',
                deviceModal: formData.deviceModal,
                serialNumber: formData.serialNumber,
                assetTag: formData.assetTag,
                currentStage: formData.currentStage,
                stageHistory: stageHistory,
                procurementDate: formData.procurementDate,
                receivedDate: formData.receivedDate,
                installedDate: formData.installedDate,
                commissionedDate: formData.commissionedDate,
                activeDate: formData.activeDate,
                maintenanceDate: formData.maintenanceDate,
                retiredDate: formData.retiredDate,
                disposedDate: formData.disposedDate,
                warrantyEnd: formData.warrantyEnd,
                location: formData.location,
                department: formData.department,
                assignedTo: formData.assignedTo,
                notes: formData.notes,
                status: formData.status ? 'Active' : 'Inactive'
              }
            : lc
        ));
        message.success('Lifecycle record updated successfully!');
      } else {
        // Add new lifecycle
        const newLifecycle = {
          id: lifecycles.length + 1,
          companyId: formData.companyId,
          companyName: selectedCompany?.name || '',
          deviceCategoryId: formData.deviceCategoryId,
          deviceCategoryName: selectedCategory?.name || '',
          deviceTypeId: formData.deviceTypeId,
          deviceTypeName: selectedDeviceType?.name || '',
          deviceModal: formData.deviceModal,
          serialNumber: formData.serialNumber,
          assetTag: formData.assetTag,
          currentStage: formData.currentStage,
          stageHistory: stageHistory,
          procurementDate: formData.procurementDate,
          receivedDate: formData.receivedDate,
          installedDate: formData.installedDate,
          commissionedDate: formData.commissionedDate,
          activeDate: formData.activeDate,
          maintenanceDate: formData.maintenanceDate,
          retiredDate: formData.retiredDate,
          disposedDate: formData.disposedDate,
          warrantyEnd: formData.warrantyEnd,
          location: formData.location,
          department: formData.department,
          assignedTo: formData.assignedTo,
          notes: formData.notes,
          status: formData.status ? 'Active' : 'Inactive'
        };
        setLifecycles([...lifecycles, newLifecycle]);
        message.success('Lifecycle record added successfully!');
      }

      setLoading(false);
      closeModal();
    }, 500);
  };

  // Filter device types based on selected category
  const getFilteredDeviceTypes = () => {
    if (!formData.deviceCategoryId) return [];
    return deviceTypes.filter(type => type.categoryId === formData.deviceCategoryId);
  };

  // Filter lifecycles
  const getFilteredLifecycles = () => {
    return lifecycles.filter(lc => {
      const matchesSearch = searchText === '' || 
        lc.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.deviceCategoryName.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.deviceTypeName.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.deviceModal.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.serialNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.assetTag.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.location.toLowerCase().includes(searchText.toLowerCase()) ||
        lc.assignedTo.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCompany = companyFilter === 'all' || 
        lc.companyId === parseInt(companyFilter);
      
      const matchesCategory = categoryFilter === 'all' || 
        lc.deviceCategoryId === parseInt(categoryFilter);
      
      const matchesStage = stageFilter === 'all' || 
        lc.currentStage === stageFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        lc.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesCompany && matchesCategory && matchesStage && matchesStatus;
    });
  };

  const filteredLifecycles = getFilteredLifecycles();

  // Get progress percentage for current stage
  const getStageProgress = (currentStage) => {
    const stage = lifecycleStages.find(s => s.key === currentStage);
    return stage ? stage.progress : 0;
  };

  // Get stage color
  const getStageColor = (stage) => {
    const stageObj = lifecycleStages.find(s => s.key === stage);
    return stageObj ? stageObj.color : '#1890ff';
  };

  // Statistics
  const totalDevices = lifecycles.length;
  const activeDevices = lifecycles.filter(l => l.currentStage === 'active').length;
  const maintenanceDevices = lifecycles.filter(l => l.currentStage === 'maintenance').length;
  const retiredDevices = lifecycles.filter(l => l.currentStage === 'retired' || l.currentStage === 'disposed').length;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: 'Device Info',
      key: 'deviceInfo',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ gap: 0 }}>
          <Space>
            <Avatar 
              style={{ 
                backgroundColor: getStageColor(record.currentStage),
              }}
              icon={lifecycleStages.find(s => s.key === record.currentStage)?.icon || <BuildOutlined />}
              size="small"
            />
            <Text strong>{record.deviceTypeName}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.deviceModal}</Text>
          <Tag color="blue" style={{ fontSize: '11px', marginTop: 2 }}>{record.assetTag}</Tag>
        </Space>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 150,
      render: (text) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'deviceCategoryName',
      key: 'deviceCategoryName',
      width: 150,
      render: (text) => (
        <Space>
          <AppstoreOutlined style={{ color: '#fa8c16' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Serial No',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 130,
      render: (text) => (
        <Tag color="purple">{text}</Tag>
      ),
    },
    {
      title: 'Current Stage',
      key: 'currentStage',
      width: 120,
      render: (_, record) => {
        const stage = lifecycleStages.find(s => s.key === record.currentStage);
        return (
          <Space direction="vertical" size={2}>
            <Tag color={stage?.color} icon={stage?.icon}>
              {stage?.name}
            </Tag>
            <Progress 
              percent={getStageProgress(record.currentStage)} 
              size="small" 
              showInfo={false}
              strokeColor={stage?.color}
              style={{ width: 100 }}
            />
          </Space>
        );
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 130,
      render: (text) => (
        <Tooltip title="Location">
          <Space>
            <EnvironmentOutlined style={{ color: '#ff4d4f' }} />
            <Text>{text || '-'}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 130,
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          <Text>{text || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Warranty',
      dataIndex: 'warrantyEnd',
      key: 'warrantyEnd',
      width: 100,
      render: (text) => {
        if (!text) return '-';
        const today = new Date();
        const warrantyDate = new Date(text);
        const isExpired = warrantyDate < today;
        return (
          <Badge 
            status={isExpired ? 'error' : 'success'} 
            text={text}
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (text) => (
        <Badge 
          status={text === 'Active' ? 'success' : 'error'} 
          text={text} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Timeline">
            <Button 
              type="text" 
              icon={<HistoryOutlined />} 
              onClick={() => openTimelineModal(record)}
              style={{ color: '#722ed1' }}
            />
          </Tooltip>
          <Tooltip title="Edit Lifecycle">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openEditModal(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Delete Record">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              onClick={() => openDeleteModal(record)}
              style={{ color: '#ff4d4f' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <HistoryOutlined style={{ marginRight: 12, color: "#1890ff" }} />
            Asset Lifecycle Management
          </Title>
          <Text type="secondary">Track complete lifecycle stages of devices from procurement to disposal</Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              style={{
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                border: "none",
                boxShadow: "0 2px 8px rgba(24, 144, 255, 0.3)"
              }}
            >
              Add Asset Lifecycle
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Messages */}
      {successMessage && (
        <Alert message="Success" description={successMessage} type="success" showIcon style={{ marginBottom: 20 }} closable onClose={() => setSuccessMessage(null)} />
      )}
      {error && (
        <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 20 }} closable onClose={() => setError(null)} />
      )}

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #1890ff" }}>
            <Statistic
              title={
                <Space>
                  <BuildOutlined /> Total Devices
                </Space>
              }
              value={totalDevices}
              valueStyle={{ color: "#1890ff", fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #52c41a" }}>
            <Statistic
              title={
                <Space>
                  <CheckCircleFilled style={{ color: "#52c41a" }} />
                  Active
                </Space>
              }
              value={activeDevices}
              valueStyle={{ color: "#52c41a", fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #faad14" }}>
            <Statistic
              title={
                <Space>
                  <SyncOutlined style={{ color: "#faad14" }} />
                  Maintenance
                </Space>
              }
              value={maintenanceDevices}
              valueStyle={{ color: "#faad14", fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #ff4d4f" }}>
            <Statistic
              title={
                <Space>
                  <DeleteFilled style={{ color: "#ff4d4f" }} />
                  Retired/Disposed
                </Space>
              }
              value={retiredDevices}
              valueStyle={{ color: "#ff4d4f", fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Lifecycle Stages Legend */}
      <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
        <Row gutter={[16, 8]}>
          {lifecycleStages.map(stage => (
            <Col key={stage.key}>
              <Tag color={stage.color} icon={stage.icon} style={{ padding: '4px 8px' }}>
                {stage.name}
              </Tag>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Input
              placeholder="Search by device, serial, asset tag, location..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select
              placeholder="Company"
              style={{ width: '100%' }}
              value={companyFilter}
              onChange={setCompanyFilter}
            >
              <Option value="all">All Companies</Option>
              {companies.map(company => (
                <Option key={company.id} value={company.id}>{company.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select
              placeholder="Category"
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              <Option value="all">All Categories</Option>
              {deviceCategories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select
              placeholder="Lifecycle Stage"
              style={{ width: '100%' }}
              value={stageFilter}
              onChange={setStageFilter}
            >
              <Option value="all">All Stages</Option>
              {lifecycleStages.map(stage => (
                <Option key={stage.key} value={stage.key}>{stage.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4} lg={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={2} lg={2} style={{ textAlign: 'right' }}>
            <Text>Showing {filteredLifecycles.length} of {totalDevices}</Text>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        title="Asset Lifecycle Records"
        extra={
          <Space>
            <Badge count={filteredLifecycles.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        style={{ overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={filteredLifecycles}
            loading={loading}
            bordered
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `${total} records`,
              pageSizeOptions: ['10', '20', '50'],
            }}
            size="middle"
            locale={{
              emptyText: (
                <Alert
                  type="info"
                  message="No records found"
                  description="There are no lifecycle records matching your search criteria."
                  showIcon
                />
              ),
            }}
          />
        </div>
      </Card>

      {/* Add/Edit Lifecycle Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000
          }} onClick={closeModal} />
          
          {/* Modal Content */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '1000px',
            maxWidth: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            {/* Header with close icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#1890ff' }}>
                {editingLifecycle ? 'Edit Asset Lifecycle' : 'Add New Asset Lifecycle'}
              </h2>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={closeModal}
                style={{
                  fontSize: '16px',
                  color: '#666',
                  padding: '4px 8px',
                  height: 'auto'
                }}
              />
            </div>

            {/* Company Dropdown */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Company *</label>
              <Select
                placeholder="Select company"
                style={{ width: '100%' }}
                value={formData.companyId || undefined}
                onChange={(value) => handleSelectChange('companyId', value)}
              >
                {companies.map(company => (
                  <Option key={company.id} value={company.id}>{company.name}</Option>
                ))}
              </Select>
            </div>

            {/* Device Category and Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Device Category *</label>
                <Select
                  placeholder="Select device category"
                  style={{ width: '100%' }}
                  value={formData.deviceCategoryId || undefined}
                  onChange={(value) => handleSelectChange('deviceCategoryId', value)}
                >
                  {deviceCategories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Device Type *</label>
                <Select
                  placeholder="Select device type"
                  style={{ width: '100%' }}
                  value={formData.deviceTypeId || undefined}
                  onChange={(value) => handleSelectChange('deviceTypeId', value)}
                  disabled={!formData.deviceCategoryId}
                >
                  {getFilteredDeviceTypes().map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Device Modal, Serial Number, Asset Tag */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Device Modal *</label>
                <Input
                  name="deviceModal"
                  value={formData.deviceModal}
                  onChange={handleInputChange}
                  placeholder="Enter device modal"
                  prefix={<CodeOutlined style={{ color: '#1890ff' }} />}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Serial Number *</label>
                <Input
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="Enter serial number"
                  prefix={<IdcardOutlined style={{ color: '#fa8c16' }} />}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Asset Tag</label>
                <Input
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleInputChange}
                  placeholder="Enter asset tag"
                  prefix={<TagOutlined style={{ color: '#722ed1' }} />}
                />
              </div>
            </div>

            {/* Current Stage Selection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 500 }}>Current Lifecycle Stage *</label>
              <Row gutter={[8, 8]}>
                {lifecycleStages.map(stage => (
                  <Col key={stage.key}>
                    <Button
                      type={formData.currentStage === stage.key ? 'primary' : 'default'}
                      icon={stage.icon}
                      onClick={() => handleStageUpdate(stage.key)}
                      style={{
                        backgroundColor: formData.currentStage === stage.key ? stage.color : 'transparent',
                        borderColor: stage.color,
                        color: formData.currentStage === stage.key ? 'white' : stage.color,
                      }}
                    >
                      {stage.name}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Dates Section */}
            <div style={{ marginTop: 20, marginBottom: 10 }}>
              <Divider orientation="left" style={{ margin: '10px 0' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Important Dates</Text>
                </Space>
              </Divider>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Procurement Date</label>
                <Input
                  type="date"
                  name="procurementDate"
                  value={formData.procurementDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Received Date</label>
                <Input
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Installed Date</label>
                <Input
                  type="date"
                  name="installedDate"
                  value={formData.installedDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Commissioned Date</label>
                <Input
                  type="date"
                  name="commissionedDate"
                  value={formData.commissionedDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Active Date</label>
                <Input
                  type="date"
                  name="activeDate"
                  value={formData.activeDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Maintenance Date</label>
                <Input
                  type="date"
                  name="maintenanceDate"
                  value={formData.maintenanceDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Retired Date</label>
                <Input
                  type="date"
                  name="retiredDate"
                  value={formData.retiredDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Disposed Date</label>
                <Input
                  type="date"
                  name="disposedDate"
                  value={formData.disposedDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Warranty End Date</label>
                <Input
                  type="date"
                  name="warrantyEnd"
                  value={formData.warrantyEnd}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Assignment Details */}
            <div style={{ marginTop: 20, marginBottom: 10 }}>
              <Divider orientation="left" style={{ margin: '10px 0' }}>
                <Space>
                  <UserOutlined style={{ color: '#722ed1' }} />
                  <Text strong>Assignment Details</Text>
                </Space>
              </Divider>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Location</label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                  prefix={<EnvironmentOutlined style={{ color: '#ff4d4f' }} />}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Department</label>
                <Input
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Enter department"
                  prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Assigned To</label>
                <Input
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  placeholder="Enter assignee name"
                  prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Notes</label>
              <Input.TextArea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            {/* Status Checkbox */}
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  style={{ marginRight: 8 }}
                  id="status-check"
                />
                <label htmlFor="status-check" style={{ fontWeight: 500 }}>Active Record</label>
              </div>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* Form Actions */}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '8px 16px',
                  marginRight: 8,
                  border: '1px solid #d9d9d9',
                  background: 'white',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Saving...' : (editingLifecycle ? 'Update Lifecycle' : 'Create Lifecycle')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Timeline View Modal */}
      {showTimelineModal && selectedLifecycle && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000
          }} onClick={closeTimelineModal} />
          
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#722ed1' }}>
                <HistoryOutlined /> Asset Lifecycle Timeline
              </h2>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={closeTimelineModal}
              />
            </div>

            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Device</Text>
                  <div><Text strong>{selectedLifecycle.deviceTypeName} - {selectedLifecycle.deviceModal}</Text></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Asset Tag</Text>
                  <div><Tag color="blue">{selectedLifecycle.assetTag}</Tag></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Serial Number</Text>
                  <div><Tag color="purple">{selectedLifecycle.serialNumber}</Tag></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Current Stage</Text>
                  <div>
                    {(() => {
                      const stage = lifecycleStages.find(s => s.key === selectedLifecycle.currentStage);
                      return <Tag color={stage?.color} icon={stage?.icon}>{stage?.name}</Tag>;
                    })()}
                  </div>
                </Col>
              </Row>
            </Card>

            <Timeline mode="left" style={{ marginTop: 20 }}>
              {selectedLifecycle.stageHistory.map((history, index) => {
                const stage = lifecycleStages.find(s => s.key === history.stage);
                return (
                  <Timeline.Item 
                    key={index}
                    color={stage?.color}
                    dot={stage?.icon}
                    label={history.date}
                  >
                    <Text strong style={{ color: stage?.color }}>{stage?.name}</Text>
                    <div><Text type="secondary">{history.notes}</Text></div>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            <Divider />

            <div style={{ textAlign: 'right' }}>
              <Button onClick={closeTimelineModal}>Close</Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && lifecycleToDelete && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000
          }} onClick={closeDeleteModal} />
          
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            zIndex: 1001,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
            </div>
            
            <h2 style={{ color: '#ff4d4f', marginBottom: '8px' }}>Delete Lifecycle Record</h2>
            
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              Are you sure you want to delete this lifecycle record?
            </p>
            
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <p><strong>Device:</strong> {lifecycleToDelete.deviceTypeName} - {lifecycleToDelete.deviceModal}</p>
              <p><strong>Serial:</strong> {lifecycleToDelete.serialNumber}</p>
              <p><strong>Asset Tag:</strong> {lifecycleToDelete.assetTag}</p>
              <p><strong>Current Stage:</strong> {lifecycleStages.find(s => s.key === lifecycleToDelete.currentStage)?.name}</p>
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              This action cannot be undone. All stage history will be permanently removed.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={closeDeleteModal}
                style={{
                  padding: '8px 24px',
                  border: '1px solid #d9d9d9',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 24px',
                  background: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

export default LifeCycle;