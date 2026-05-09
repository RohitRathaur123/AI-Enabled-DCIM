// AddRoom.jsx
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
  Switch,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  Modal,
  InputNumber,
  Form,
  Progress
} from "antd";
import {
  CloudServerOutlined,
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
  FlagOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  HeatMapOutlined,
  ApiOutlined,
  CompassOutlined,
  WifiOutlined,
  EyeOutlined,
  HolderOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  DatabaseOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

// Room types constant (not using hooks, so safe outside component)
const ROOM_TYPES = [
  { id: 0, name: "Server Room", icon: "fa-server", color: 0x3498db, hex: "#3498db" },
  { id: 1, name: "AC Unit Room", icon: "fa-snowflake", color: 0x2ecc71, hex: "#2ecc71" },
  { id: 2, name: "DG Set Room", icon: "fa-bolt", color: 0xe67e22, hex: "#e67e22" },
  { id: 3, name: "Network Room", icon: "fa-network-wired", color: 0x9b59b6, hex: "#9b59b6" },
  { id: 4, name: "Storage Room", icon: "fa-hdd", color: 0x34495e, hex: "#34495e" },
  { id: 5, name: "UPS Room", icon: "fa-car-battery", color: 0xf39c12, hex: "#f39c12" },
  { id: 6, name: "Cooling Room", icon: "fa-snowflake", color: 0x16a085, hex: "#16a085" },
  { id: 7, name: "Electrical Room", icon: "fa-bolt", color: 0xe74c3c, hex: "#e74c3c" }
];

// Floor options constant
const FLOOR_OPTIONS = [
  'Ground Floor',
  'First Floor',
  'Second Floor',
  'Third Floor',
  'Fourth Floor',
  'Fifth Floor',
  'Basement 1',
  'Basement 2',
  'Mezzanine'
];

// Sample Data Centers data
const DATA_CENTERS = [
  { id: 1, name: 'LAX1 - Main Facility', code: 'LAX-MAIN-01', location: 'Los Angeles, CA' },
  { id: 2, name: 'SFO - Edge Facility', code: 'SFO-EDGE-02', location: 'San Francisco, CA' },
  { id: 3, name: 'TOR - Core Facility', code: 'TOR-CORE-03', location: 'Toronto, ON' },
  { id: 4, name: 'MUM - DR Site', code: 'MUM-DR-04', location: 'Mumbai, India' },
  { id: 5, name: 'SIN - Hub Facility', code: 'SIN-HUB-05', location: 'Singapore' },
  { id: 6, name: 'NYC - Main Hub', code: 'NYC-HUB-06', location: 'New York, NY' },
  { id: 7, name: 'LON - European Hub', code: 'LON-EU-07', location: 'London, UK' },
  { id: 8, name: 'SYD - Pacific Hub', code: 'SYD-PAC-08', location: 'Sydney, Australia' }
];

const AddRoom = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  
  // Sample rooms data
  const [rooms, setRooms] = useState([
    {
      id: 1,
      roomName: "Main Server Room",
      roomCode: "SRV-01",
      dataCenterId: 1,
      dataCenterName: "LAX1 - Main Facility",
      roomType: "Server Room",
      floor: "Ground Floor",
      width: 20,
      length: 20,
      height: 10,
      area: 400,
      capacity: 42,
      utilized: 38,
      coolingCapacity: 150,
      powerCapacity: 250,
      status: "Active",
      createdDate: "2024-01-15",
      color: 0x3498db,
      hex: "#3498db"
    },
    {
      id: 2,
      roomName: "Primary AC Room",
      roomCode: "AC-01",
      dataCenterId: 1,
      dataCenterName: "LAX1 - Main Facility",
      roomType: "AC Unit Room",
      floor: "Ground Floor",
      width: 20,
      length: 20,
      height: 10,
      area: 400,
      capacity: 24,
      utilized: 18,
      coolingCapacity: 300,
      powerCapacity: 180,
      status: "Active",
      createdDate: "2024-02-20",
      color: 0x2ecc71,
      hex: "#2ecc71"
    },
    {
      id: 3,
      roomName: "Backup Generator Room",
      roomCode: "GEN-01",
      dataCenterId: 1,
      dataCenterName: "LAX1 - Main Facility",
      roomType: "DG Set Room",
      floor: "Ground Floor",
      width: 20,
      length: 20,
      height: 10,
      area: 400,
      capacity: 8,
      utilized: 6,
      coolingCapacity: 200,
      powerCapacity: 500,
      status: "Active",
      createdDate: "2024-03-10",
      color: 0xe67e22,
      hex: "#e67e22"
    },
    {
      id: 4,
      roomName: "Network Operations Center",
      roomCode: "NOC-01",
      dataCenterId: 2,
      dataCenterName: "SFO - Edge Facility",
      roomType: "Network Room",
      floor: "First Floor",
      width: 15,
      length: 15,
      height: 8,
      area: 225,
      capacity: 20,
      utilized: 15,
      coolingCapacity: 80,
      powerCapacity: 120,
      status: "Active",
      createdDate: "2024-04-05",
      color: 0x9b59b6,
      hex: "#9b59b6"
    },
    {
      id: 5,
      roomName: "Storage Array Room",
      roomCode: "STR-01",
      dataCenterId: 3,
      dataCenterName: "TOR - Core Facility",
      roomType: "Storage Room",
      floor: "First Floor",
      width: 18,
      length: 18,
      height: 8,
      area: 324,
      capacity: 30,
      utilized: 28,
      coolingCapacity: 120,
      powerCapacity: 200,
      status: "Maintenance",
      createdDate: "2024-05-12",
      color: 0x34495e,
      hex: "#34495e"
    }
  ]);

  // Form errors state
  const [formErrors, setFormErrors] = useState({
    roomName: '',
    roomCode: '',
    dataCenterId: '',
    roomType: '',
    floor: '',
    width: '',
    length: '',
    height: '',
    capacity: '',
    utilized: '',
    coolingCapacity: '',
    powerCapacity: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    roomName: '',
    roomCode: '',
    dataCenterId: '',
    roomType: 'Server Room',
    floor: 'Ground Floor',
    width: 20,
    length: 20,
    height: 10,
    capacity: '',
    utilized: '',
    coolingCapacity: '',
    powerCapacity: '',
    status: true
  });

  const [searchText, setSearchText] = useState('');
  const [dataCenterFilter, setDataCenterFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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

  // Validation functions
  const validateRoomName = (value) => {
    if (!value) return { isValid: false, message: 'Room name is required' };
    if (value.length < 3) return { isValid: false, message: 'Room name must be at least 3 characters' };
    if (value.length > 100) return { isValid: false, message: 'Room name must be less than 100 characters' };
    return { isValid: true, message: '' };
  };

  const validateRoomCode = (value) => {
    if (!value) return { isValid: false, message: 'Room code is required' };
    if (value.length < 3) return { isValid: false, message: 'Room code must be at least 3 characters' };
    if (value.length > 20) return { isValid: false, message: 'Room code must be less than 20 characters' };
    if (!/^[A-Za-z0-9-]+$/.test(value)) {
      return { isValid: false, message: 'Room code can only contain letters, numbers, and hyphens' };
    }
    return { isValid: true, message: '' };
  };

  const validateDataCenter = (value) => {
    if (!value) return { isValid: false, message: 'Data center is required' };
    return { isValid: true, message: '' };
  };

  const validateRoomType = (value) => {
    if (!value) return { isValid: false, message: 'Room type is required' };
    return { isValid: true, message: '' };
  };

  const validateFloor = (value) => {
    if (!value) return { isValid: false, message: 'Floor is required' };
    return { isValid: true, message: '' };
  };

  const validateDimension = (value, fieldName) => {
    if (!value && value !== 0) return { isValid: false, message: `${fieldName} is required` };
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: `${fieldName} must be a number` };
    if (num < 5) return { isValid: false, message: `${fieldName} must be at least 5 meters` };
    if (num > 50) return { isValid: false, message: `${fieldName} cannot exceed 50 meters` };
    return { isValid: true, message: '' };
  };

  const validateCapacity = (value) => {
    if (!value && value !== 0) return { isValid: true, message: '' }; // Optional
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: 'Capacity must be a number' };
    if (num < 0) return { isValid: false, message: 'Capacity cannot be negative' };
    if (num > 100) return { isValid: false, message: 'Capacity cannot exceed 100 units' };
    return { isValid: true, message: '' };
  };

  const validateUtilized = (value) => {
    if (!value && value !== 0) return { isValid: true, message: '' }; // Optional
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: 'Utilized must be a number' };
    if (num < 0) return { isValid: false, message: 'Utilized cannot be negative' };
    if (num > (formData.capacity || 100)) {
      return { isValid: false, message: 'Utilized cannot exceed capacity' };
    }
    return { isValid: true, message: '' };
  };

  const validateCoolingCapacity = (value) => {
    if (!value && value !== 0) return { isValid: true, message: '' }; // Optional
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: 'Cooling capacity must be a number' };
    if (num < 0) return { isValid: false, message: 'Cooling capacity cannot be negative' };
    if (num > 1000) return { isValid: false, message: 'Cooling capacity cannot exceed 1000 TR' };
    return { isValid: true, message: '' };
  };

  const validatePowerCapacity = (value) => {
    if (!value && value !== 0) return { isValid: true, message: '' }; // Optional
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: 'Power capacity must be a number' };
    if (num < 0) return { isValid: false, message: 'Power capacity cannot be negative' };
    if (num > 1000) return { isValid: false, message: 'Power capacity cannot exceed 1000 kW' };
    return { isValid: true, message: '' };
  };

  const validateField = (fieldName, value) => {
    let error = '';
    
    switch(fieldName) {
      case 'roomName':
        error = validateRoomName(value).message;
        break;
      case 'roomCode':
        error = validateRoomCode(value).message;
        break;
      case 'dataCenterId':
        error = validateDataCenter(value).message;
        break;
      case 'roomType':
        error = validateRoomType(value).message;
        break;
      case 'floor':
        error = validateFloor(value).message;
        break;
      case 'width':
        error = validateDimension(value, 'Width').message;
        break;
      case 'length':
        error = validateDimension(value, 'Length').message;
        break;
      case 'height':
        error = validateDimension(value, 'Height').message;
        break;
      case 'capacity':
        error = validateCapacity(value).message;
        break;
      case 'utilized':
        error = validateUtilized(value).message;
        break;
      case 'coolingCapacity':
        error = validateCoolingCapacity(value).message;
        break;
      case 'powerCapacity':
        error = validatePowerCapacity(value).message;
        break;
      default:
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field on change
    validateField(name, value);
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field on change
    validateField(name, value);
    
    // If utilized changed, validate against capacity
    if (name === 'utilized' && formData.capacity) {
      validateField('utilized', value);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field on change
    validateField(name, value);
  };

  const handleStatusToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      status: checked
    }));
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      roomName: '',
      roomCode: '',
      dataCenterId: '',
      roomType: 'Server Room',
      floor: 'Ground Floor',
      width: 20,
      length: 20,
      height: 10,
      capacity: '',
      utilized: '',
      coolingCapacity: '',
      powerCapacity: '',
      status: true
    });
    setFormErrors({
      roomName: '',
      roomCode: '',
      dataCenterId: '',
      roomType: '',
      floor: '',
      width: '',
      length: '',
      height: '',
      capacity: '',
      utilized: '',
      coolingCapacity: '',
      powerCapacity: '',
      status: ''
    });
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      roomName: room.roomName,
      roomCode: room.roomCode,
      dataCenterId: room.dataCenterId,
      roomType: room.roomType,
      floor: room.floor,
      width: room.width,
      length: room.length,
      height: room.height,
      capacity: room.capacity,
      utilized: room.utilized,
      coolingCapacity: room.coolingCapacity,
      powerCapacity: room.powerCapacity,
      status: room.status === 'Active'
    });
    setFormErrors({
      roomName: '',
      roomCode: '',
      dataCenterId: '',
      roomType: '',
      floor: '',
      width: '',
      length: '',
      height: '',
      capacity: '',
      utilized: '',
      coolingCapacity: '',
      powerCapacity: '',
      status: ''
    });
    setShowModal(true);
  };

  const openDeleteModal = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const handleView = (room) => {
    // Find the matching room type ID based on room type name
    const roomType = ROOM_TYPES.find(rt => rt.name === room.roomType);
    const roomId = roomType ? roomType.id : 0;
    
    // Dispatch event for DCIMViewer to zoom to this room
    window.dispatchEvent(new CustomEvent('dcim:zoomRoom', { 
      detail: { id: roomId } 
    }));
    
    // Navigate to DCIMViewer
    navigate("/dcim-viewer", { 
      state: { 
        roomId,
        roomName: room.roomName,
        roomData: room 
      } 
    });
    
    message.success(`Viewing room: ${room.roomName}`);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRoomToDelete(null);
  };

  const handleDelete = () => {
    if (roomToDelete) {
      setRooms(rooms.filter(room => room.id !== roomToDelete.id));
      
      // Dispatch delete event for DCIMViewer
      const roomType = ROOM_TYPES.find(rt => rt.name === roomToDelete.roomType);
      if (roomType) {
        window.dispatchEvent(new CustomEvent('dcim:deleteRoom', { 
          detail: { id: roomType.id } 
        }));
      }
      
      message.success('Room deleted successfully!');
      closeDeleteModal();
    }
  };

  const validateForm = () => {
    const nameValidation = validateRoomName(formData.roomName);
    const codeValidation = validateRoomCode(formData.roomCode);
    const dataCenterValidation = validateDataCenter(formData.dataCenterId);
    const typeValidation = validateRoomType(formData.roomType);
    const floorValidation = validateFloor(formData.floor);
    const widthValidation = validateDimension(formData.width, 'Width');
    const lengthValidation = validateDimension(formData.length, 'Length');
    const heightValidation = validateDimension(formData.height, 'Height');
    const capacityValidation = validateCapacity(formData.capacity);
    const utilizedValidation = validateUtilized(formData.utilized);
    const coolingValidation = validateCoolingCapacity(formData.coolingCapacity);
    const powerValidation = validatePowerCapacity(formData.powerCapacity);
    
    const errors = {
      roomName: nameValidation.message,
      roomCode: codeValidation.message,
      dataCenterId: dataCenterValidation.message,
      roomType: typeValidation.message,
      floor: floorValidation.message,
      width: widthValidation.message,
      length: lengthValidation.message,
      height: heightValidation.message,
      capacity: capacityValidation.message,
      utilized: utilizedValidation.message,
      coolingCapacity: coolingValidation.message,
      powerCapacity: powerValidation.message
    };
    
    setFormErrors(errors);
    
    return nameValidation.isValid && 
           codeValidation.isValid && 
           dataCenterValidation.isValid && 
           typeValidation.isValid && 
           floorValidation.isValid && 
           widthValidation.isValid && 
           lengthValidation.isValid && 
           heightValidation.isValid && 
           capacityValidation.isValid && 
           utilizedValidation.isValid && 
           coolingValidation.isValid && 
           powerValidation.isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    // Calculate area
    const area = formData.width * formData.length;

    // Get color based on room type
    const roomTypeDef = ROOM_TYPES.find(rt => rt.name === formData.roomType) || ROOM_TYPES[0];
    
    // Get data center name
    const selectedDataCenter = DATA_CENTERS.find(dc => dc.id === formData.dataCenterId);

    setTimeout(() => {
      if (editingRoom) {
        // Update existing room
        setRooms(rooms.map(room => 
          room.id === editingRoom.id 
            ? { 
                ...room, 
                roomName: formData.roomName,
                roomCode: formData.roomCode.toUpperCase(),
                dataCenterId: formData.dataCenterId,
                dataCenterName: selectedDataCenter?.name || '',
                roomType: formData.roomType,
                floor: formData.floor,
                width: Number(formData.width),
                length: Number(formData.length),
                height: Number(formData.height),
                area: area,
                capacity: formData.capacity ? parseInt(formData.capacity) : 0,
                utilized: formData.utilized ? parseInt(formData.utilized) : 0,
                coolingCapacity: formData.coolingCapacity ? parseInt(formData.coolingCapacity) : 0,
                powerCapacity: formData.powerCapacity ? parseInt(formData.powerCapacity) : 0,
                status: formData.status ? 'Active' : 'Inactive',
                color: roomTypeDef.color,
                hex: roomTypeDef.hex
              }
            : room
        ));
        message.success('Room updated successfully!');
      } else {
        // Add new room
        const newRoom = {
          id: rooms.length + 1,
          roomName: formData.roomName,
          roomCode: formData.roomCode.toUpperCase(),
          dataCenterId: formData.dataCenterId,
          dataCenterName: selectedDataCenter?.name || '',
          roomType: formData.roomType,
          floor: formData.floor,
          width: Number(formData.width),
          length: Number(formData.length),
          height: Number(formData.height),
          area: area,
          capacity: formData.capacity ? parseInt(formData.capacity) : 0,
          utilized: formData.utilized ? parseInt(formData.utilized) : 0,
          coolingCapacity: formData.coolingCapacity ? parseInt(formData.coolingCapacity) : 0,
          powerCapacity: formData.powerCapacity ? parseInt(formData.powerCapacity) : 0,
          status: formData.status ? 'Active' : 'Inactive',
          color: roomTypeDef.color,
          hex: roomTypeDef.hex,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setRooms([...rooms, newRoom]);
        
        // Dispatch add event for DCIMViewer
        window.dispatchEvent(new CustomEvent('dcim:addRoom', { 
          detail: { 
            id: rooms.length + 1,
            name: formData.roomName,
            type: formData.roomType,
            width: Number(formData.width),
            length: Number(formData.length),
            height: Number(formData.height),
            color: roomTypeDef.color,
            hex: roomTypeDef.hex
          } 
        }));
        
        message.success('Room added successfully!');
      }

      setLoading(false);
      closeModal();
    }, 500);
  };

  // Filter rooms
  const getFilteredRooms = () => {
    return rooms.filter(room => {
      const matchesSearch = searchText === '' || 
        room.roomName.toLowerCase().includes(searchText.toLowerCase()) ||
        room.roomCode.toLowerCase().includes(searchText.toLowerCase()) ||
        room.roomType.toLowerCase().includes(searchText.toLowerCase()) ||
        room.floor.toLowerCase().includes(searchText.toLowerCase()) ||
        (room.dataCenterName && room.dataCenterName.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesDataCenter = dataCenterFilter === 'all' || 
        room.dataCenterId === dataCenterFilter;
      
      const matchesType = typeFilter === 'all' || 
        room.roomType === typeFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        room.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesDataCenter && matchesType && matchesStatus;
    });
  };

  const filteredRooms = getFilteredRooms();

  // Get unique values for filters
  const dataCenters = [...new Map(rooms.map(room => [room.dataCenterId, { 
    id: room.dataCenterId, 
    name: room.dataCenterName 
  }])).values()];
  
  const roomTypes = [...new Set(rooms.map(room => room.roomType))];

  // Statistics
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.status === 'Active').length;
  const totalArea = rooms.reduce((sum, r) => sum + (r.area || 0), 0);
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalUtilized = rooms.reduce((sum, r) => sum + (r.utilized || 0), 0);

  const getUtilizationPercent = (utilized, total) => {
    if (!total) return 0;
    return Math.round((utilized / total) * 100);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Active': 'success',
      'Maintenance': 'warning',
      'Inactive': 'default'
    };
    return <Badge status={statusColors[status] || 'default'} text={status} />;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: 'Room',
      key: 'room',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Avatar 
              style={{ 
                backgroundColor: record.hex || '#1890ff',
              }}
              icon={<HolderOutlined />}
              size="small"
            />
            <Text strong>{record.roomName}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>Code: {record.roomCode}</Text>
        </Space>
      ),
    },
    {
      title: 'Data Center',
      key: 'dataCenter',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <Text>{record.dataCenterName}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 120,
      render: (text, record) => (
        <Tag color={record.hex || '#1890ff'}>{text}</Tag>
      ),
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
      width: 100,
    },
    {
      title: 'Dimensions',
      key: 'dimensions',
      width: 130,
      render: (_, record) => (
        <Tooltip title={`Area: ${record.area} m²`}>
          <Text>{record.width}m × {record.length}m × {record.height}m</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Utilization',
      key: 'utilization',
      width: 150,
      render: (_, record) => {
        const percent = getUtilizationPercent(record.utilized, record.capacity);
        return (
          <Tooltip title={`${record.utilized} of ${record.capacity} units used`}>
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Text>{record.utilized}/{record.capacity}</Text>
              <Progress 
                percent={percent} 
                size="small" 
                status={percent > 90 ? 'exception' : percent > 70 ? 'active' : 'normal'}
                showInfo={false}
              />
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Cooling',
      dataIndex: 'coolingCapacity',
      key: 'cooling',
      width: 100,
      render: (text) => (
        <Space>
          <HeatMapOutlined style={{ color: '#13c2c2' }} />
          <Text>{text} TR</Text>
        </Space>
      ),
    },
    {
      title: 'Power',
      dataIndex: 'powerCapacity',
      key: 'power',
      width: 100,
      render: (text) => (
        <Space>
          <ThunderboltOutlined style={{ color: '#fa8c16' }} />
          <Text>{text} kW</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => getStatusBadge(text),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View in 3D">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Edit Room">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openEditModal(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Delete Room">
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
            <RadiusUpleftOutlined style={{ marginRight: 12, color: "#1890ff" }} />
            Room Management
          </Title>
          <Text type="secondary">Manage data center rooms and spaces</Text>
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
              Add Room
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
                  <RadiusUpleftOutlined /> Total Rooms
                </Space>
              }
              value={totalRooms}
              valueStyle={{ color: "#1890ff", fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #52c41a" }}>
            <Statistic
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  Active
                </Space>
              }
              value={activeRooms}
              valueStyle={{ color: "#52c41a", fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #722ed1" }}>
            <Statistic
              title={
                <Space>
                  <DashboardOutlined style={{ color: "#722ed1" }} />
                  Total Area
                </Space>
              }
              value={`${totalArea} m²`}
              valueStyle={{ color: "#722ed1", fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} md={6}>
          <Card hoverable style={{ borderTop: "3px solid #fa8c16" }}>
            <Statistic
              title={
                <Space>
                  <ApiOutlined style={{ color: "#fa8c16" }} />
                  Utilization
                </Space>
              }
              value={`${totalUtilized}/${totalCapacity}`}
              valueStyle={{ color: "#fa8c16", fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Input
              placeholder="Search rooms by name, code, type, floor..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4} lg={4}>
            <Select
              placeholder="Data Center"
              style={{ width: '100%' }}
              value={dataCenterFilter}
              onChange={setDataCenterFilter}
              allowClear
            >
              <Option value="all">All Data Centers</Option>
              {dataCenters.map(dc => (
                <Option key={dc.id} value={dc.id}>{dc.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4} lg={4}>
            <Select
              placeholder="Room Type"
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
            >
              <Option value="all">All Types</Option>
              {roomTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4} lg={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4} lg={4} style={{ textAlign: 'right' }}>
            <Text>Showing {filteredRooms.length} of {totalRooms}</Text>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        title="Rooms List"
        extra={
          <Space>
            <Badge count={filteredRooms.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        style={{ overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={filteredRooms}
            loading={loading}
            bordered
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `${total} rooms`,
              pageSizeOptions: ['10', '20', '50'],
            }}
            size="middle"
            locale={{
              emptyText: (
                <Alert
                  type="info"
                  message="No rooms found"
                  description="There are no rooms matching your search criteria."
                  showIcon
                />
              ),
            }}
          />
        </div>
      </Card>

      {/* Add/Edit Room Modal */}
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
            width: '900px',
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
                {editingRoom ? 'Edit Room' : 'Add New Room'}
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

            {/* Basic Information */}
            <Divider orientation="left">Basic Information</Divider>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Room Name *</label>
                <Input
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleInputChange}
                  onBlur={() => validateField('roomName', formData.roomName)}
                  placeholder="e.g., Main Server Room"
                  prefix={<RadiusUpleftOutlined />}
                  maxLength={100}
                  style={{ 
                    borderColor: formErrors.roomName ? '#ff4d4f' : undefined
                  }}
                  status={formErrors.roomName ? 'error' : ''}
                />
                {formErrors.roomName && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.roomName}
                  </Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Room Code *</label>
                <Input
                  name="roomCode"
                  value={formData.roomCode}
                  onChange={handleInputChange}
                  onBlur={() => validateField('roomCode', formData.roomCode)}
                  placeholder="e.g., SRV-01"
                  prefix={<CodeOutlined />}
                  maxLength={20}
                  style={{ 
                    borderColor: formErrors.roomCode ? '#ff4d4f' : undefined,
                    textTransform: 'uppercase'
                  }}
                  status={formErrors.roomCode ? 'error' : ''}
                />
                {formErrors.roomCode && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.roomCode}
                  </Text>
                )}
              </div>
            </div>

            {/* Data Center Selection */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Data Center *</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select data center"
                value={formData.dataCenterId || undefined}
                onChange={(value) => handleSelectChange('dataCenterId', value)}
                showSearch
                optionFilterProp="children"
                status={formErrors.dataCenterId ? 'error' : ''}
              >
                {DATA_CENTERS.map(dc => (
                  <Option key={dc.id} value={dc.id}>
                    <Space>
                      <DatabaseOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{dc.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>({dc.location})</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
              {formErrors.dataCenterId && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formErrors.dataCenterId}
                </Text>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Room Type *</label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select room type"
                  value={formData.roomType}
                  onChange={(value) => handleSelectChange('roomType', value)}
                  status={formErrors.roomType ? 'error' : ''}
                >
                  {ROOM_TYPES.map(type => (
                    <Option key={type.id} value={type.name}>{type.name}</Option>
                  ))}
                </Select>
                {formErrors.roomType && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.roomType}
                  </Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Floor *</label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select floor"
                  value={formData.floor}
                  onChange={(value) => handleSelectChange('floor', value)}
                  status={formErrors.floor ? 'error' : ''}
                >
                  {FLOOR_OPTIONS.map(floor => (
                    <Option key={floor} value={floor}>{floor}</Option>
                  ))}
                </Select>
                {formErrors.floor && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.floor}
                  </Text>
                )}
              </div>
            </div>

            {/* Dimensions */}
            <Divider orientation="left" style={{ marginTop: 20 }}>Dimensions (meters)</Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Width *</label>
                <InputNumber
                  name="width"
                  value={formData.width}
                  onChange={(value) => handleNumberChange('width', value)}
                  onBlur={() => validateField('width', formData.width)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.width ? '#ff4d4f' : undefined
                  }}
                  placeholder="Width in meters"
                  min={5}
                  max={50}
                  step={1}
                  status={formErrors.width ? 'error' : ''}
                />
                {formErrors.width && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.width}
                  </Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Length *</label>
                <InputNumber
                  name="length"
                  value={formData.length}
                  onChange={(value) => handleNumberChange('length', value)}
                  onBlur={() => validateField('length', formData.length)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.length ? '#ff4d4f' : undefined
                  }}
                  placeholder="Length in meters"
                  min={5}
                  max={50}
                  step={1}
                  status={formErrors.length ? 'error' : ''}
                />
                {formErrors.length && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.length}
                  </Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Height *</label>
                <InputNumber
                  name="height"
                  value={formData.height}
                  onChange={(value) => handleNumberChange('height', value)}
                  onBlur={() => validateField('height', formData.height)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.height ? '#ff4d4f' : undefined
                  }}
                  placeholder="Height in meters"
                  min={5}
                  max={50}
                  step={1}
                  status={formErrors.height ? 'error' : ''}
                />
                {formErrors.height && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.height}
                  </Text>
                )}
              </div>
            </div>

            {/* Technical Specifications */}
            <Divider orientation="left" style={{ marginTop: 20 }}>Technical Specifications</Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Equipment Capacity</label>
                <InputNumber
                  name="capacity"
                  value={formData.capacity}
                  onChange={(value) => handleNumberChange('capacity', value)}
                  onBlur={() => validateField('capacity', formData.capacity)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.capacity ? '#ff4d4f' : undefined
                  }}
                  placeholder="Max equipment units"
                  min={0}
                  max={100}
                  step={1}
                  status={formErrors.capacity ? 'error' : ''}
                />
                {formErrors.capacity && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.capacity}
                  </Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Utilized Units</label>
                <InputNumber
                  name="utilized"
                  value={formData.utilized}
                  onChange={(value) => handleNumberChange('utilized', value)}
                  onBlur={() => validateField('utilized', formData.utilized)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.utilized ? '#ff4d4f' : undefined
                  }}
                  placeholder="Currently utilized"
                  min={0}
                  max={formData.capacity || 100}
                  step={1}
                  status={formErrors.utilized ? 'error' : ''}
                />
                {formErrors.utilized && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.utilized}
                  </Text>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Cooling Capacity (TR)</label>
                <InputNumber
                  name="coolingCapacity"
                  value={formData.coolingCapacity}
                  onChange={(value) => handleNumberChange('coolingCapacity', value)}
                  onBlur={() => validateField('coolingCapacity', formData.coolingCapacity)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.coolingCapacity ? '#ff4d4f' : undefined
                  }}
                  placeholder="Tons of Refrigeration"
                  min={0}
                  max={1000}
                  step={1}
                  status={formErrors.coolingCapacity ? 'error' : ''}
                />
                {formErrors.coolingCapacity && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.coolingCapacity}
                  </Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Power Capacity (kW)</label>
                <InputNumber
                  name="powerCapacity"
                  value={formData.powerCapacity}
                  onChange={(value) => handleNumberChange('powerCapacity', value)}
                  onBlur={() => validateField('powerCapacity', formData.powerCapacity)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.powerCapacity ? '#ff4d4f' : undefined
                  }}
                  placeholder="Kilowatts"
                  min={0}
                  max={1000}
                  step={1}
                  status={formErrors.powerCapacity ? 'error' : ''}
                />
                {formErrors.powerCapacity && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.powerCapacity}
                  </Text>
                )}
              </div>
            </div>

            {/* Status */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 500 }}>Status:</label>
              <div>
                <span style={{ marginRight: 8 }}>
                  {formData.status ? 
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  }
                </span>
                <Text strong style={{ color: formData.status ? '#52c41a' : '#ff4d4f', marginRight: 12 }}>
                  {formData.status ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                  checked={formData.status}
                  onChange={handleStatusToggle}
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </div>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button onClick={closeModal} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
              >
                {loading ? 'Saving...' : (editingRoom ? 'Update Room' : 'Create Room')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
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
          }} onClick={closeDeleteModal} />
          
          {/* Delete Modal Content */}
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
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
            </div>
            
            <h2 style={{ color: '#ff4d4f', marginBottom: '8px' }}>Delete Room</h2>
            
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              Are you sure you want to delete this room?
            </p>
            
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '4px 0' }}><strong>Room:</strong> {roomToDelete.roomName}</p>
              <p style={{ margin: '4px 0' }}><strong>Code:</strong> {roomToDelete.roomCode}</p>
              <p style={{ margin: '4px 0' }}><strong>Data Center:</strong> {roomToDelete.dataCenterName}</p>
              <p style={{ margin: '4px 0' }}><strong>Type:</strong> {roomToDelete.roomType}</p>
              <p style={{ margin: '4px 0' }}><strong>Floor:</strong> {roomToDelete.floor}</p>
              <p style={{ margin: '4px 0' }}><strong>Dimensions:</strong> {roomToDelete.width}m × {roomToDelete.length}m × {roomToDelete.height}m</p>
              <p style={{ margin: '4px 0' }}><strong>Area:</strong> {roomToDelete.area} m²</p>
              <p style={{ margin: '4px 0' }}><strong>Utilization:</strong> {roomToDelete.utilized}/{roomToDelete.capacity}</p>
              <p style={{ margin: '4px 0' }}><strong>Status:</strong> {roomToDelete.status}</p>
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              This action cannot be undone. All associated data will be permanently removed.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button type="primary" danger onClick={handleDelete}>
                Delete Room
              </Button>
            </div>
          </div>
        </>
      )}

    

    </div>
  );
};

export default AddRoom;