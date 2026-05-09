import React, { useState } from 'react';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaMapMarkerAlt,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaWarehouse,
  FaIndustry,
  FaHome
} from 'react-icons/fa';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Select, 
  Input,
  Badge,
  Statistic,
  Tooltip,
  Modal,
  Divider,
  Avatar,
  message,
  Switch,
  InputNumber,
  Form
} from 'antd';
import {
  BankOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  CloseOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  IdcardOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Locations = () => {
  // Sample countries data
  const countriesList = [
    { id: 1, name: 'United States', code: 'USA' },
    { id: 2, name: 'United Kingdom', code: 'GBR' },
    { id: 3, name: 'India', code: 'IND' },
    { id: 4, name: 'Germany', code: 'DEU' },
    { id: 5, name: 'Japan', code: 'JPN' },
    { id: 6, name: 'Canada', code: 'CAN' },
    { id: 7, name: 'Australia', code: 'AUS' }
  ];

  // Sample states data (filtered by country)
  const statesList = [
    { id: 1, name: 'California', code: 'CA', countryId: 1 },
    { id: 2, name: 'Texas', code: 'TX', countryId: 1 },
    { id: 3, name: 'New York', code: 'NY', countryId: 1 },
    { id: 4, name: 'Ontario', code: 'ON', countryId: 6 },
    { id: 5, name: 'Quebec', code: 'QC', countryId: 6 },
    { id: 6, name: 'British Columbia', code: 'BC', countryId: 6 },
    { id: 7, name: 'Maharashtra', code: 'MH', countryId: 3 },
    { id: 8, name: 'Karnataka', code: 'KA', countryId: 3 },
    { id: 9, name: 'Tamil Nadu', code: 'TN', countryId: 3 },
    { id: 10, name: 'Bavaria', code: 'BY', countryId: 4 },
    { id: 11, name: 'North Rhine-Westphalia', code: 'NW', countryId: 4 },
    { id: 12, name: 'Tokyo Metropolis', code: '13', countryId: 5 },
    { id: 13, name: 'Osaka', code: '27', countryId: 5 },
    { id: 14, name: 'New South Wales', code: 'NSW', countryId: 7 },
    { id: 15, name: 'Victoria', code: 'VIC', countryId: 7 }
  ];

  // Sample cities data (filtered by state)
  const citiesList = [
    { id: 1, name: 'Los Angeles', code: 'LA', stateId: 1, countryId: 1 },
    { id: 2, name: 'San Francisco', code: 'SF', stateId: 1, countryId: 1 },
    { id: 3, name: 'Houston', code: 'HOU', stateId: 2, countryId: 1 },
    { id: 4, name: 'Austin', code: 'AUS', stateId: 2, countryId: 1 },
    { id: 5, name: 'New York City', code: 'NYC', stateId: 3, countryId: 1 },
    { id: 6, name: 'Toronto', code: 'TOR', stateId: 4, countryId: 6 },
    { id: 7, name: 'Ottawa', code: 'OTT', stateId: 4, countryId: 6 },
    { id: 8, name: 'Montreal', code: 'MTL', stateId: 5, countryId: 6 },
    { id: 9, name: 'Vancouver', code: 'VAN', stateId: 6, countryId: 6 },
    { id: 10, name: 'Mumbai', code: 'BOM', stateId: 7, countryId: 3 },
    { id: 11, name: 'Pune', code: 'PUN', stateId: 7, countryId: 3 },
    { id: 12, name: 'Bangalore', code: 'BLR', stateId: 8, countryId: 3 },
    { id: 13, name: 'Chennai', code: 'MAA', stateId: 9, countryId: 3 },
    { id: 14, name: 'Munich', code: 'MUC', stateId: 10, countryId: 4 },
    { id: 15, name: 'Nuremberg', code: 'NUE', stateId: 10, countryId: 4 },
    { id: 16, name: 'Cologne', code: 'CGN', stateId: 11, countryId: 4 },
    { id: 17, name: 'Tokyo', code: 'TYO', stateId: 12, countryId: 5 },
    { id: 18, name: 'Osaka', code: 'OSA', stateId: 13, countryId: 5 },
    { id: 19, name: 'Sydney', code: 'SYD', stateId: 14, countryId: 7 },
    { id: 20, name: 'Melbourne', code: 'MEL', stateId: 15, countryId: 7 }
  ];

  const [locations, setLocations] = useState([
    { 
      id: 1, 
      name: 'Main Data Center',
      countryId: 1,
      countryName: 'United States',
      stateId: 1,
      stateName: 'California',
      cityId: 1,
      cityName: 'Los Angeles',
      address: '123 Tech Park, Silicon Valley',
      pinCode: '95110',
      latitude: 37.3382,
      longitude: -121.8863,
      status: 'Active',
      regDate: '2024-01-15 09:30 AM'
    },
    { 
      id: 2, 
      name: 'Edge Facility - East',
      countryId: 1,
      countryName: 'United States',
      stateId: 2,
      stateName: 'Texas',
      cityId: 3,
      cityName: 'Houston',
      address: '456 Connectivity Drive',
      pinCode: '20147',
      latitude: 39.0437,
      longitude: -77.4875,
      status: 'Active',
      regDate: '2024-02-20 11:15 AM'
    },
    { 
      id: 3, 
      name: 'Colocation Facility - West',
      countryId: 6,
      countryName: 'Canada',
      stateId: 4,
      stateName: 'Ontario',
      cityId: 6,
      cityName: 'Toronto',
      address: '789 Server Avenue',
      pinCode: 'M5V2T6',
      latitude: 43.6510,
      longitude: -79.3470,
      status: 'Active',
      regDate: '2024-03-10 02:45 PM'
    },
    { 
      id: 4, 
      name: 'DR Site - North',
      countryId: 4,
      countryName: 'Germany',
      stateId: 10,
      stateName: 'Bavaria',
      cityId: 14,
      cityName: 'Munich',
      address: '101 Recovery Road',
      pinCode: '80331',
      latitude: 48.1351,
      longitude: 11.5820,
      status: 'Maintenance',
      regDate: '2024-04-05 09:20 AM'
    },
    { 
      id: 5, 
      name: 'Network Hub - South',
      countryId: 3,
      countryName: 'India',
      stateId: 7,
      stateName: 'Maharashtra',
      cityId: 10,
      cityName: 'Mumbai',
      address: '222 Fiber Lane',
      pinCode: '400001',
      latitude: 19.0760,
      longitude: 72.8777,
      status: 'Warning',
      regDate: '2024-05-12 04:30 PM'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // For dependent dropdowns in form
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  
  // Form errors state
  const [formErrors, setFormErrors] = useState({
    name: '',
    countryId: '',
    stateId: '',
    cityId: '',
    pinCode: '',
    latitude: '',
    longitude: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    countryId: '',
    stateId: '',
    cityId: '',
    address: '',
    pinCode: '',
    latitude: null,
    longitude: null,
    status: true // true for Active, false for Inactive
  });

  // Validation functions
  const validatePinCode = (value, countryId) => {
    if (!value) return { isValid: true, message: '' }; // Optional field
    
    const country = countriesList.find(c => c.id === countryId);
    if (!country) return { isValid: true, message: '' };
    
    let isValid = false;
    let formatHint = '';
    
    switch(country.name) {
      case 'United States':
        isValid = /^\d{5}(-\d{4})?$/.test(value);
        formatHint = 'Format: 12345 or 12345-6789';
        break;
      case 'India':
        isValid = /^\d{6}$/.test(value);
        formatHint = 'Format: 6 digits (e.g., 400001)';
        break;
      case 'Canada':
        isValid = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value);
        formatHint = 'Format: A1A 1A1 (e.g., M5V 2T6)';
        break;
      case 'United Kingdom':
        isValid = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(value);
        formatHint = 'Format: SW1A 1AA';
        break;
      case 'Germany':
        isValid = /^\d{5}$/.test(value);
        formatHint = 'Format: 5 digits (e.g., 80331)';
        break;
      case 'Japan':
        isValid = /^\d{3}-\d{4}$/.test(value);
        formatHint = 'Format: 123-4567';
        break;
      case 'Australia':
        isValid = /^\d{4}$/.test(value);
        formatHint = 'Format: 4 digits (e.g., 2000)';
        break;
      default:
        isValid = /^[A-Za-z0-9\s-]{3,10}$/.test(value);
        formatHint = 'Alphanumeric, 3-10 characters';
    }
    
    return { 
      isValid, 
      message: isValid ? '' : `Invalid PIN code format. ${formatHint}` 
    };
  };

  const validateLatitude = (value) => {
    if (value === null || value === undefined || value === '') return { isValid: true, message: '' };
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: 'Latitude must be a number' };
    if (num < -90 || num > 90) return { isValid: false, message: 'Latitude must be between -90 and 90' };
    return { isValid: true, message: '' };
  };

  const validateLongitude = (value) => {
    if (value === null || value === undefined || value === '') return { isValid: true, message: '' };
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: 'Longitude must be a number' };
    if (num < -180 || num > 180) return { isValid: false, message: 'Longitude must be between -180 and 180' };
    return { isValid: true, message: '' };
  };

  const validateName = (value) => {
    if (!value) return { isValid: false, message: 'Location name is required' };
    if (value.length > 100) return { isValid: false, message: 'Location name must be less than 100 characters' };
    return { isValid: true, message: '' };
  };

  const validateCountry = (value) => {
    if (!value) return { isValid: false, message: 'Country is required' };
    return { isValid: true, message: '' };
  };

  const validateState = (value) => {
    if (!value) return { isValid: false, message: 'State is required' };
    return { isValid: true, message: '' };
  };

  const validateCity = (value) => {
    if (!value) return { isValid: false, message: 'City is required' };
    return { isValid: true, message: '' };
  };

  // Get unique countries for filter
  const countries = [...new Map(locations.map(loc => [loc.countryId, { 
    id: loc.countryId, 
    name: loc.countryName 
  }])).values()];

  // Get states for filter based on selected country
  const getStatesForFilter = () => {
    if (countryFilter === 'all') {
      return [...new Map(locations.map(loc => [loc.stateId, { 
        id: loc.stateId, 
        name: loc.stateName 
      }])).values()];
    } else {
      return locations
        .filter(loc => loc.countryId === countryFilter)
        .map(loc => ({ id: loc.stateId, name: loc.stateName }))
        .filter((state, index, self) => 
          index === self.findIndex(s => s.id === state.id)
        );
    }
  };

  // Get cities for filter based on selected state
  const getCitiesForFilter = () => {
    if (stateFilter === 'all') {
      return [...new Map(locations.map(loc => [loc.cityId, { 
        id: loc.cityId, 
        name: loc.cityName 
      }])).values()];
    } else {
      return locations
        .filter(loc => loc.stateId === stateFilter)
        .map(loc => ({ id: loc.cityId, name: loc.cityName }))
        .filter((city, index, self) => 
          index === self.findIndex(c => c.id === city.id)
        );
    }
  };

  const filterStates = getStatesForFilter();
  const filterCities = getCitiesForFilter();

  // Filter locations
  const getFilteredLocations = () => {
    return locations.filter(location => {
      const matchesSearch = searchTerm === '' || 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.countryName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = countryFilter === 'all' || location.countryId === countryFilter;
      const matchesState = stateFilter === 'all' || location.stateId === stateFilter;
      const matchesCity = cityFilter === 'all' || location.cityId === cityFilter;
      const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
      
      return matchesSearch && matchesCountry && matchesState && matchesCity && matchesStatus;
    });
  };

  const filteredLocations = getFilteredLocations();

  // Statistics
  const totalLocations = locations.length;
  const activeLocations = locations.filter(l => l.status === 'Active').length;

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Active': { color: 'success' },
      'Maintenance': { color: 'warning' },
      'Warning': { color: 'error' }
    };
    const style = statusStyles[status] || { color: 'default' };
    
    return <Badge status={style.color} text={status} />;
  };

  const formatCoordinates = (lat, lng) => {
    if (lat === undefined || lng === undefined || lat === null || lng === null) return '-';
    
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
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
  };

  const validateField = (fieldName, value) => {
    let error = '';
    
    switch(fieldName) {
      case 'name':
        error = validateName(value).message;
        break;
      case 'countryId':
        error = validateCountry(value).message;
        break;
      case 'stateId':
        error = validateState(value).message;
        break;
      case 'cityId':
        error = validateCity(value).message;
        break;
      case 'pinCode':
        if (formData.countryId) {
          error = validatePinCode(value, formData.countryId).message;
        }
        break;
      case 'latitude':
        error = validateLatitude(value).message;
        break;
      case 'longitude':
        error = validateLongitude(value).message;
        break;
      default:
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleCountryChange = (value) => {
    // Filter states based on selected country
    const filteredStates = statesList.filter(state => state.countryId === value);
    setAvailableStates(filteredStates);
    setAvailableCities([]); // Reset cities when country changes
    
    setFormData(prev => ({
      ...prev,
      countryId: value,
      stateId: '', // Reset state when country changes
      cityId: '', // Reset city when country changes
      pinCode: '' // Reset pin code when country changes (validation depends on country)
    }));
    
    // Validate fields
    setFormErrors(prev => ({
      ...prev,
      countryId: validateCountry(value).message,
      stateId: '', // Clear state error since it's reset
      cityId: '', // Clear city error since it's reset
      pinCode: '' // Clear pin code error since it's reset
    }));
  };

  const handleStateChange = (value) => {
    // Filter cities based on selected state
    const filteredCities = citiesList.filter(city => city.stateId === value);
    setAvailableCities(filteredCities);
    
    setFormData(prev => ({
      ...prev,
      stateId: value,
      cityId: '' // Reset city when state changes
    }));
    
    // Validate fields
    setFormErrors(prev => ({
      ...prev,
      stateId: validateState(value).message,
      cityId: '' // Clear city error since it's reset
    }));
  };

  const handleCityChange = (value) => {
    setFormData(prev => ({
      ...prev,
      cityId: value
    }));
    
    // Validate field
    setFormErrors(prev => ({
      ...prev,
      cityId: validateCity(value).message
    }));
  };

  const handleStatusToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      status: checked
    }));
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      countryId: '',
      stateId: '',
      cityId: '',
      address: '',
      pinCode: '',
      latitude: null,
      longitude: null,
      status: true // Default to Active
    });
    setFormErrors({
      name: '',
      countryId: '',
      stateId: '',
      cityId: '',
      pinCode: '',
      latitude: '',
      longitude: ''
    });
    setAvailableStates([]);
    setAvailableCities([]);
    setShowFormModal(true);
  };

  const openEditModal = (location) => {
    // Filter states for the selected country
    const filteredStates = statesList.filter(state => state.countryId === location.countryId);
    setAvailableStates(filteredStates);
    
    // Filter cities for the selected state
    const filteredCities = citiesList.filter(city => city.stateId === location.stateId);
    setAvailableCities(filteredCities);
    
    setEditingLocation(location);
    
    setFormData({
      name: location.name,
      countryId: location.countryId,
      stateId: location.stateId,
      cityId: location.cityId,
      address: location.address || '',
      pinCode: location.pinCode || '',
      latitude: location.latitude,
      longitude: location.longitude,
      status: location.status === 'Active'
    });
    
    // Clear all errors
    setFormErrors({
      name: '',
      countryId: '',
      stateId: '',
      cityId: '',
      pinCode: '',
      latitude: '',
      longitude: ''
    });
    
    setShowFormModal(true);
  };

  const closeModal = () => {
    setShowFormModal(false);
    setEditingLocation(null);
    setAvailableStates([]);
    setAvailableCities([]);
  };

  const openDeleteModal = (location) => {
    setLocationToDelete(location);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setLocationToDelete(null);
  };

  const handleDelete = () => {
    if (locationToDelete) {
      setLocations(locations.filter(loc => loc.id !== locationToDelete.id));
      message.success('Location deleted successfully!');
      closeDeleteModal();
    }
  };

  const validateForm = () => {
    const nameValidation = validateName(formData.name);
    const countryValidation = validateCountry(formData.countryId);
    const stateValidation = validateState(formData.stateId);
    const cityValidation = validateCity(formData.cityId);
    const pinValidation = formData.pinCode ? validatePinCode(formData.pinCode, formData.countryId) : { isValid: true, message: '' };
    const latValidation = validateLatitude(formData.latitude);
    const lngValidation = validateLongitude(formData.longitude);
    
    const errors = {
      name: nameValidation.message,
      countryId: countryValidation.message,
      stateId: stateValidation.message,
      cityId: cityValidation.message,
      pinCode: pinValidation.message,
      latitude: latValidation.message,
      longitude: lngValidation.message
    };
    
    setFormErrors(errors);
    
    return nameValidation.isValid && 
           countryValidation.isValid && 
           stateValidation.isValid && 
           cityValidation.isValid && 
           pinValidation.isValid && 
           latValidation.isValid && 
           lngValidation.isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    // Find country name from countriesList
    const selectedCountry = countriesList.find(c => c.id === formData.countryId);
    // Find state name from statesList
    const selectedState = statesList.find(s => s.id === formData.stateId);
    // Find city name from citiesList
    const selectedCity = citiesList.find(c => c.id === formData.cityId);

    setTimeout(() => {
      if (editingLocation) {
        // Update existing location
        setLocations(locations.map(loc => 
          loc.id === editingLocation.id 
            ? { 
                ...loc,
                name: formData.name,
                countryId: formData.countryId,
                countryName: selectedCountry?.name || '',
                stateId: formData.stateId,
                stateName: selectedState?.name || '',
                cityId: formData.cityId,
                cityName: selectedCity?.name || '',
                address: formData.address,
                pinCode: formData.pinCode,
                latitude: formData.latitude,
                longitude: formData.longitude,
                status: formData.status ? 'Active' : 'Inactive'
              }
            : loc
        ));
        message.success('Location updated successfully!');
      } else {
        // Add new location
        const newLocation = {
          id: locations.length + 1,
          name: formData.name,
          countryId: formData.countryId,
          countryName: selectedCountry?.name || '',
          stateId: formData.stateId,
          stateName: selectedState?.name || '',
          cityId: formData.cityId,
          cityName: selectedCity?.name || '',
          address: formData.address,
          pinCode: formData.pinCode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: formData.status ? 'Active' : 'Inactive',
          regDate: new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', '')
        };
        setLocations([...locations, newLocation]);
        message.success('Location added successfully!');
      }

      setLoading(false);
      closeModal();
    }, 500);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Location Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <Space>
          <Avatar icon={<BankOutlined />} style={{ backgroundColor: '#1890ff' }} size="small" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'countryName',
      key: 'country',
      width: 120,
      render: (text) => (
        <Space>
          <GlobalOutlined style={{ color: '#52c41a' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'State',
      dataIndex: 'stateName',
      key: 'state',
      width: 120,
    },
    {
      title: 'City',
      dataIndex: 'cityName',
      key: 'city',
      width: 120,
    },
    {
      title: 'Address',
      key: 'address',
      width: 200,
      render: (_, record) => (
        <Tooltip title={record.address}>
          <Text>{record.address?.substring(0, 20)}{record.address?.length > 20 ? '...' : ''}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'PIN Code',
      dataIndex: 'pinCode',
      key: 'pinCode',
      width: 90,
      render: (text) => text || '-',
    },
    {
      title: 'Coordinates',
      key: 'coordinates',
      width: 160,
      render: (_, record) => (
        <Text style={{ fontSize: 12 }}>
          {formatCoordinates(record.latitude, record.longitude)}
        </Text>
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
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<FaEdit />} 
              style={{ color: '#1890ff' }}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              icon={<FaTrash />} 
              style={{ color: '#ff4d4f' }}
              onClick={() => openDeleteModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BankOutlined style={{ marginRight: 12, color: "#1890ff" }} />
            Locations Management
          </Title>
          <Text type="secondary">Manage all data center facilities and locations</Text>
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
              Add Location
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card hoverable style={{ borderTop: '3px solid #1890ff' }}>
            <Statistic 
              title="Total Locations" 
              value={totalLocations} 
              valueStyle={{ color: '#1890ff' }} 
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card hoverable style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic 
              title="Active Locations" 
              value={activeLocations} 
              valueStyle={{ color: '#52c41a' }} 
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${totalLocations}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Search locations by name, city, country..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by Country"
              style={{ width: '100%' }}
              value={countryFilter}
              onChange={setCountryFilter}
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Countries</Option>
              {countries.map(country => (
                <Option key={country.id} value={country.id}>{country.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by State"
              style={{ width: '100%' }}
              value={stateFilter}
              onChange={setStateFilter}
              showSearch
              optionFilterProp="children"
              disabled={countryFilter === 'all' && filterStates.length === 0}
            >
              <Option value="all">All States</Option>
              {filterStates.map(state => (
                <Option key={state.id} value={state.id}>{state.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by City"
              style={{ width: '100%' }}
              value={cityFilter}
              onChange={setCityFilter}
              showSearch
              optionFilterProp="children"
              disabled={stateFilter === 'all' && filterCities.length === 0}
            >
              <Option value="all">All Cities</Option>
              {filterCities.map(city => (
                <Option key={city.id} value={city.id}>{city.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Maintenance">Maintenance</Option>
              <Option value="Warning">Warning</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredLocations}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: false }}
        />
      </Card>

      {/* Add/Edit Location Modal */}
      {showFormModal && (
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
            width: '700px',
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
                {editingLocation ? 'Edit Location' : 'Add New Location'}
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

            <Divider orientation="left" style={{ marginTop: 20 }}>Geographical Information</Divider>
            
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Country *</label>
              <Select
                placeholder="Select Country"
                style={{ width: '100%' }}
                value={formData.countryId}
                onChange={handleCountryChange}
                showSearch
                optionFilterProp="children"
                status={formErrors.countryId ? 'error' : ''}
              >
                {countriesList.map(country => (
                  <Option key={country.id} value={country.id}>
                    <Space>
                      <GlobalOutlined />
                      {country.name} ({country.code})
                    </Space>
                  </Option>
                ))}
              </Select>
              {formErrors.countryId && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formErrors.countryId}
                </Text>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>State *</label>
              <Select
                placeholder="Select State"
                style={{ width: '100%' }}
                value={formData.stateId}
                onChange={handleStateChange}
                showSearch
                optionFilterProp="children"
                disabled={!formData.countryId || availableStates.length === 0}
                status={formErrors.stateId ? 'error' : ''}
              >
                {availableStates.map(state => (
                  <Option key={state.id} value={state.id}>
                    {state.name} ({state.code})
                  </Option>
                ))}
              </Select>
              {formErrors.stateId && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formErrors.stateId}
                </Text>
              )}
              {!formData.countryId && !formErrors.stateId && (
                <Text type="secondary" style={{ fontSize: 12 }}>Please select a country first</Text>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>City *</label>
              <Select
                placeholder="Select City"
                style={{ width: '100%' }}
                value={formData.cityId}
                onChange={handleCityChange}
                showSearch
                optionFilterProp="children"
                disabled={!formData.stateId || availableCities.length === 0}
                status={formErrors.cityId ? 'error' : ''}
              >
                {availableCities.map(city => (
                  <Option key={city.id} value={city.id}>
                    {city.name} ({city.code})
                  </Option>
                ))}
              </Select>
              {formErrors.cityId && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formErrors.cityId}
                </Text>
              )}
              {!formData.stateId && !formErrors.cityId && (
                <Text type="secondary" style={{ fontSize: 12 }}>Please select a state first</Text>
              )}
            </div>

            <Divider orientation="left">Basic Information</Divider>
            
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Location Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={() => validateField('name', formData.name)}
                maxLength="100"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: `1px solid ${formErrors.name ? '#ff4d4f' : '#d9d9d9'}`, 
                  borderRadius: 4 
                }}
                placeholder="e.g., Main Data Center"
              />
              {formErrors.name && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formErrors.name}
                </Text>
              )}
            </div>

            

            <Divider orientation="left" style={{ marginTop: 20 }}>Address Details</Divider>
            
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                maxLength="200"
                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4 }}
                placeholder="Enter street address"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>PIN Code</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                onBlur={() => validateField('pinCode', formData.pinCode)}
                maxLength="10"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: `1px solid ${formErrors.pinCode ? '#ff4d4f' : '#d9d9d9'}`, 
                  borderRadius: 4 
                }}
                placeholder="Enter PIN code / postal code"
              />
              {formErrors.pinCode && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formErrors.pinCode}
                </Text>
              )}
              {formData.countryId && !formErrors.pinCode && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {countriesList.find(c => c.id === formData.countryId)?.name} format
                </Text>
              )}
            </div>

            <Divider orientation="left" style={{ marginTop: 20 }}>Coordinates (Optional)</Divider>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Latitude</label>
                <InputNumber
                  name="latitude"
                  value={formData.latitude}
                  onChange={(value) => handleNumberChange('latitude', value)}
                  onBlur={() => validateField('latitude', formData.latitude)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.latitude ? '#ff4d4f' : undefined
                  }}
                  placeholder="e.g., 37.3382"
                  step={0.0001}
                  min={-90}
                  max={90}
                  precision={4}
                  status={formErrors.latitude ? 'error' : ''}
                />
                {formErrors.latitude ? (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.latitude}
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>Range: -90 to 90</Text>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Longitude</label>
                <InputNumber
                  name="longitude"
                  value={formData.longitude}
                  onChange={(value) => handleNumberChange('longitude', value)}
                  onBlur={() => validateField('longitude', formData.longitude)}
                  style={{ 
                    width: '100%',
                    borderColor: formErrors.longitude ? '#ff4d4f' : undefined
                  }}
                  placeholder="e.g., -121.8863"
                  step={0.0001}
                  min={-180}
                  max={180}
                  precision={4}
                  status={formErrors.longitude ? 'error' : ''}
                />
                {formErrors.longitude ? (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.longitude}
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>Range: -180 to 180</Text>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ fontWeight: 500, marginRight: 12 }}>Status:</label>
                <span style={{ marginRight: 8 }}>
                  {formData.status ? 
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                    <StopOutlined style={{ color: '#ff4d4f' }} />
                  }
                </span>
                <Text strong style={{ color: formData.status ? '#52c41a' : '#ff4d4f' }}>
                  {formData.status ? 'Active' : 'Inactive'}
                </Text>
              </div>
              <Switch
                checked={formData.status}
                onChange={handleStatusToggle}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                style={{
                  backgroundColor: formData.status ? '#52c41a' : '#ff4d4f'
                }}
              />
            </div>

            <Divider style={{ margin: '20px 0' }} />

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
                {loading ? 'Saving...' : (editingLocation ? 'Update Location' : 'Create Location')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && locationToDelete && (
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
            
            <h2 style={{ color: '#ff4d4f', marginBottom: '8px' }}>Delete Location</h2>
            
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              Are you sure you want to delete this location?
            </p>
            
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '4px 0' }}><strong>Location:</strong> {locationToDelete.name}</p>
              <p style={{ margin: '4px 0' }}><strong>Country:</strong> {locationToDelete.countryName}</p>
              <p style={{ margin: '4px 0' }}><strong>State:</strong> {locationToDelete.stateName}</p>
              <p style={{ margin: '4px 0' }}><strong>City:</strong> {locationToDelete.cityName}</p>
              <p style={{ margin: '4px 0' }}><strong>Address:</strong> {locationToDelete.address || '-'}</p>
              <p style={{ margin: '4px 0' }}><strong>PIN Code:</strong> {locationToDelete.pinCode || '-'}</p>
              <p style={{ margin: '4px 0' }}><strong>Coordinates:</strong> {formatCoordinates(locationToDelete.latitude, locationToDelete.longitude)}</p>
              <p style={{ margin: '4px 0' }}><strong>Status:</strong> {locationToDelete.status}</p>
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              This action cannot be undone. All associated data will be permanently removed.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={closeDeleteModal}
                style={{
                  padding: '8px 24px',
                  border: '1px solid #d9d9d9',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
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
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Delete Location
              </button>
            </div>
          </div>
        </>
      )}

   
    </div>
  );
};

export default Locations;