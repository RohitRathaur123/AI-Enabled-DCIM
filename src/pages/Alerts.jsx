import React, { useState, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Table, Tag, Space, Button, 
  Badge, Statistic, message, Typography, Select, 
  DatePicker, Input, Form, Input as AntInput
} from 'antd';
import { 
  AlertOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  ReloadOutlined,
  CommentOutlined,
  CloseOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = AntInput;

// Static DCIM alerts data
const alertsData = [
  {
    id: 1,
    timestamp: moment().subtract(5, 'minutes'),
    type: 'UPS Overload',
    location: 'Data Center 1',
    severity: 'critical',
    status: 'active',
    value: '92%',
    remark: ''
  },
  {
    id: 2,
    timestamp: moment().subtract(25, 'minutes'),
    type: 'High Temperature',
    location: 'Server Room A',
    severity: 'high',
    status: 'acknowledged',
    value: '82°F',
    remark: 'Monitoring temperature, will investigate if it persists'
  },
  {
    id: 3,
    timestamp: moment().subtract(2, 'hours'),
    type: 'Disk Failure',
    location: 'Rack A05',
    severity: 'critical',
    status: 'active',
    value: 'Disk 3 failed',
    remark: ''
  },
  {
    id: 4,
    timestamp: moment().subtract(4, 'hours'),
    type: 'Low Humidity',
    location: 'Data Center 2',
    severity: 'medium',
    status: 'active',
    value: '35%',
    remark: ''
  },
  {
    id: 5,
    timestamp: moment().subtract(1, 'day'),
    type: 'Power Supply Failed',
    location: 'Rack B08',
    severity: 'high',
    status: 'resolved',
    value: 'PSU 1 failed',
    remark: 'Replaced PSU, system back to normal'
  },
  {
    id: 6,
    timestamp: moment().subtract(30, 'minutes'),
    type: 'Network Link Down',
    location: 'Core Switch',
    severity: 'critical',
    status: 'active',
    value: 'Port 48 down',
    remark: ''
  },
  {
    id: 7,
    timestamp: moment().subtract(3, 'hours'),
    type: 'Fan Failure',
    location: 'Storage Array',
    severity: 'medium',
    status: 'acknowledged',
    value: 'Fan 4 - 0 RPM',
    remark: 'Replacement fan ordered, ETA 2 hours'
  },
  {
    id: 8,
    timestamp: moment().subtract(12, 'hours'),
    type: 'Chiller Warning',
    location: 'Mechanical Room',
    severity: 'low',
    status: 'resolved',
    value: 'Pressure high',
    remark: 'Pressure normalized, system stable'
  },
  {
    id: 9,
    timestamp: moment().subtract(2, 'days'),
    type: 'Memory Error',
    location: 'Server R12',
    severity: 'high',
    status: 'resolved',
    value: 'ECC Error',
    remark: 'Memory module replaced'
  },
  {
    id: 10,
    timestamp: moment().subtract(3, 'hours'),
    type: 'Cooling Failure',
    location: 'Data Center 2',
    severity: 'critical',
    status: 'active',
    value: 'CRAC-02 Offline',
    remark: ''
  },
  {
    id: 11,
    timestamp: moment().subtract(45, 'minutes'),
    type: 'Power Spike',
    location: 'Rack A12',
    severity: 'medium',
    status: 'acknowledged',
    value: '240V',
    remark: 'Power stabilized, monitoring'
  },
  {
    id: 12,
    timestamp: moment().subtract(6, 'hours'),
    type: 'Network Congestion',
    location: 'Core Switch',
    severity: 'medium',
    status: 'active',
    value: '85% bandwidth',
    remark: ''
  },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState(alertsData);
  const [filteredAlerts, setFilteredAlerts] = useState(alertsData);
  
  // Acknowledge Modal State
  const [acknowledgeModalVisible, setAcknowledgeModalVisible] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState(null);
  const [ackRemark, setAckRemark] = useState('');
  const [ackError, setAckError] = useState('');
  
  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [currentResolveAlertId, setCurrentResolveAlertId] = useState(null);
  const [resolveRemark, setResolveRemark] = useState('');
  const [resolveError, setResolveError] = useState('');
  
  // Individual filter states
  const [searchText, setSearchText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Get unique values for filter options
  const severityOptions = [...new Set(alerts.map(a => a.severity))];
  const statusOptions = [...new Set(alerts.map(a => a.status))];
  const typeOptions = [...new Set(alerts.map(a => a.type))];
  const locationOptions = [...new Set(alerts.map(a => a.location))];

  // ── Shared style tokens (same as AddUser) ────────────────────────────────
  const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
  const modalBoxStyle = (w) => ({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", width: w, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" });
  const lbl = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const inputStyle = { width: "100%", padding: "5px 10px", border: "1px solid #d9d9d9", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...alerts];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(a => 
        a.type.toLowerCase().includes(searchLower) ||
        a.location.toLowerCase().includes(searchLower) ||
        a.value.toLowerCase().includes(searchLower)
      );
    }

    if (selectedSeverity) {
      filtered = filtered.filter(a => a.severity === selectedSeverity);
    }

    if (selectedStatus) {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    if (selectedType) {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    if (selectedLocation) {
      filtered = filtered.filter(a => a.location === selectedLocation);
    }

    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter(a => 
        a.timestamp.isBetween(start, end, 'day', '[]')
      );
    }

    setFilteredAlerts(filtered);
    message.success(`Filtered: ${filtered.length} alerts found`);
  }, [alerts, searchText, selectedSeverity, selectedStatus, selectedType, selectedLocation, dateRange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedSeverity(null);
    setSelectedStatus(null);
    setSelectedType(null);
    setSelectedLocation(null);
    setDateRange(null);
    setFilteredAlerts(alerts);
    message.info('All filters cleared');
  }, [alerts]);

  // Reset to original data
  const resetData = useCallback(() => {
    setAlerts([...alertsData]);
    setFilteredAlerts([...alertsData]);
    clearFilters();
    message.success('Data reset successfully');
  }, [clearFilters]);

  // Show acknowledge modal
  const showAcknowledgeModal = useCallback((id) => {
    setCurrentAlertId(id);
    const alert = alerts.find(a => a.id === id);
    setAckRemark(alert?.remark || '');
    setAckError('');
    setAcknowledgeModalVisible(true);
  }, [alerts]);

  // Close acknowledge modal
  const closeAcknowledgeModal = useCallback(() => {
    setAcknowledgeModalVisible(false);
    setCurrentAlertId(null);
    setAckRemark('');
    setAckError('');
  }, []);

  // Handle acknowledge with remark
  const handleAcknowledgeWithRemark = useCallback(() => {
    if (!ackRemark.trim()) {
      setAckError('Please provide a remark');
      return;
    }

    const updatedAlerts = alerts.map(alert => 
      alert.id === currentAlertId ? { ...alert, status: 'acknowledged', remark: ackRemark.trim() } : alert
    );
    setAlerts(updatedAlerts);
    setFilteredAlerts(prev => 
      prev.map(alert => 
        alert.id === currentAlertId ? { ...alert, status: 'acknowledged', remark: ackRemark.trim() } : alert
      )
    );
    closeAcknowledgeModal();
    message.success('Alert acknowledged with remark');
  }, [alerts, currentAlertId, ackRemark, closeAcknowledgeModal]);

  // Show resolve modal
  const showResolveModal = useCallback((id) => {
    setCurrentResolveAlertId(id);
    const alert = alerts.find(a => a.id === id);
    setResolveRemark(alert?.remark || '');
    setResolveError('');
    setResolveModalVisible(true);
  }, [alerts]);

  // Close resolve modal
  const closeResolveModal = useCallback(() => {
    setResolveModalVisible(false);
    setCurrentResolveAlertId(null);
    setResolveRemark('');
    setResolveError('');
  }, []);

  // Handle resolve with remark
  const handleResolveWithRemark = useCallback(() => {
    if (!resolveRemark.trim()) {
      setResolveError('Please provide a resolution remark');
      return;
    }

    const updatedAlerts = alerts.map(alert => 
      alert.id === currentResolveAlertId ? { ...alert, status: 'resolved', remark: resolveRemark.trim() } : alert
    );
    setAlerts(updatedAlerts);
    setFilteredAlerts(prev => 
      prev.map(alert => 
        alert.id === currentResolveAlertId ? { ...alert, status: 'resolved', remark: resolveRemark.trim() } : alert
      )
    );
    closeResolveModal();
    message.success('Alert resolved successfully');
  }, [alerts, currentResolveAlertId, resolveRemark, closeResolveModal]);

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#f5222d',
      high: '#ff4d4f',
      medium: '#faad14',
      low: '#52c41a',
    };
    return colors[severity] || '#d9d9d9';
  };

  // Get severity label
  const getSeverityLabel = (severity) => {
    const labels = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };
    return labels[severity] || severity;
  };

  // Calculate statistics based on filtered data
  const stats = useMemo(() => ({
    total: filteredAlerts.length,
    active: filteredAlerts.filter(a => a.status === 'active').length,
    acknowledged: filteredAlerts.filter(a => a.status === 'acknowledged').length,
    resolved: filteredAlerts.filter(a => a.status === 'resolved').length,
  }), [filteredAlerts]);

  // Check if any filter is active
  const isFilterActive = useCallback(() => {
    return searchText || selectedSeverity || selectedStatus || 
           selectedType || selectedLocation || dateRange;
  }, [searchText, selectedSeverity, selectedStatus, selectedType, selectedLocation, dateRange]);

  // Get current alert for display in modal
  const getAckAlert = useCallback(() => {
    return alerts.find(a => a.id === currentAlertId);
  }, [alerts, currentAlertId]);

  const getResolveAlert = useCallback(() => {
    return alerts.find(a => a.id === currentResolveAlertId);
  }, [alerts, currentResolveAlertId]);

  // Table columns
  const columns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      fixed: 'left',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {getSeverityLabel(severity)}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (text) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 100,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp) => moment(timestamp).fromNow(),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (remark) => remark ? (
        <Space>
          <CommentOutlined style={{ color: '#1890ff' }} />
          <Text ellipsis={{ tooltip: remark }} style={{ maxWidth: 120, fontSize: 12 }}>
            {remark}
          </Text>
        </Space>
      ) : (
        <Text type="secondary" style={{ fontSize: 11 }}>No remark</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const icons = {
          active: <ExclamationCircleOutlined />,
          acknowledged: <ClockCircleOutlined />,
          resolved: <CheckCircleOutlined />,
        };
        const colors = {
          active: 'error',
          acknowledged: 'warning',
          resolved: 'success',
        };
        return <Tag icon={icons[status]} color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'active' && (
            <Button 
              size="small" 
              onClick={() => showAcknowledgeModal(record.id)}
              icon={<CommentOutlined />}
            >
              Ack
            </Button>
          )}
          {(record.status === 'active' || record.status === 'acknowledged') && (
            <Button 
              size="small" 
              type="primary" 
              danger={record.status === 'active'}
              onClick={() => showResolveModal(record.id)}
            >
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const ackAlert = getAckAlert();
  const resolveAlert = getResolveAlert();

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#000' }}>
          <AlertOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          DCIM Alerts
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Monitor and manage data center infrastructure alerts
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable style={{ borderTop: '3px solid #1890ff' }}>
            <Statistic 
              title="Total Alerts" 
              value={stats.total} 
              valueStyle={{ color: '#1890ff', fontSize: 28 }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable style={{ borderTop: '3px solid #f5222d' }}>
            <Statistic 
              title="Active" 
              value={stats.active} 
              valueStyle={{ color: '#f5222d', fontSize: 28 }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable style={{ borderTop: '3px solid #faad14' }}>
            <Statistic 
              title="Acknowledged" 
              value={stats.acknowledged} 
              valueStyle={{ color: '#faad14', fontSize: 28 }} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic 
              title="Resolved" 
              value={stats.resolved} 
              valueStyle={{ color: '#52c41a', fontSize: 28 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Status Badges */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Badge status="error" text={`${stats.active} Active`} />
          <Badge status="warning" text={`${stats.acknowledged} Acknowledged`} />
          <Badge status="success" text={`${stats.resolved} Resolved`} />
          <Text type="secondary">| Showing {filteredAlerts.length} of {alerts.length} alerts</Text>
          {isFilterActive() && (
            <Button type="link" size="small" onClick={clearFilters} icon={<ClearOutlined />}>
              Clear All Filters
            </Button>
          )}
        </Space>
      </div>

      {/* Table with filters */}
      <Card>
        {/* Filter Bar */}
        <div style={{ marginBottom: 16, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input 
            placeholder="Search..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 150 }}
            size="small"
            allowClear
            onPressEnter={applyFilters}
          />
          
          <Select
            style={{ width: 110 }}
            placeholder="Severity"
            value={selectedSeverity}
            onChange={setSelectedSeverity}
            allowClear
            size="small"
          >
            {severityOptions.map(severity => (
              <Option key={severity} value={severity}>
                <Tag color={getSeverityColor(severity)} style={{ margin: 0, fontSize: 11 }}>{getSeverityLabel(severity)}</Tag>
              </Option>
            ))}
          </Select>

          <Select
            style={{ width: 110 }}
            placeholder="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            allowClear
            size="small"
          >
            {statusOptions.map(status => (
              <Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Option>
            ))}
          </Select>

          <Select
            style={{ width: 120 }}
            placeholder="Type"
            value={selectedType}
            onChange={setSelectedType}
            allowClear
            size="small"
            showSearch
          >
            {typeOptions.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>

          <Select
            style={{ width: 120 }}
            placeholder="Location"
            value={selectedLocation}
            onChange={setSelectedLocation}
            allowClear
            size="small"
            showSearch
          >
            {locationOptions.map(location => (
              <Option key={location} value={location}>{location}</Option>
            ))}
          </Select>

          <RangePicker 
            style={{ width: 200 }}
            value={dateRange}
            onChange={setDateRange}
            placeholder={['Start', 'End']}
            size="small"
          />

          <Button 
            type="primary" 
            onClick={applyFilters}
            size="small"
            icon={<FilterOutlined />}
          >
            Apply
          </Button>

          <Button 
            onClick={() => {
              setAlerts([...alertsData]);
              setFilteredAlerts([...alertsData]);
              message.success('Data refreshed');
            }}
            size="small"
            icon={<SyncOutlined />}
          >
            Refresh
          </Button>

          <Button 
            onClick={resetData}
            size="small"
            icon={<ReloadOutlined />}
          >
            Reset
          </Button>
        </div>

        {/* Active filters display */}
        {isFilterActive() && (
          <div style={{ marginBottom: 12, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Filters:</Text>
            {searchText && (
              <Tag closable onClose={() => { setSearchText(''); setTimeout(applyFilters, 100); }} style={{ fontSize: 11 }}>
                Search: {searchText}
              </Tag>
            )}
            {selectedSeverity && (
              <Tag color={getSeverityColor(selectedSeverity)} closable onClose={() => { setSelectedSeverity(null); setTimeout(applyFilters, 100); }} style={{ fontSize: 11 }}>
                {getSeverityLabel(selectedSeverity)}
              </Tag>
            )}
            {selectedStatus && (
              <Tag closable onClose={() => { setSelectedStatus(null); setTimeout(applyFilters, 100); }} style={{ fontSize: 11 }}>
                {selectedStatus}
              </Tag>
            )}
            {selectedType && (
              <Tag closable onClose={() => { setSelectedType(null); setTimeout(applyFilters, 100); }} style={{ fontSize: 11 }}>
                {selectedType}
              </Tag>
            )}
            {selectedLocation && (
              <Tag closable onClose={() => { setSelectedLocation(null); setTimeout(applyFilters, 100); }} style={{ fontSize: 11 }}>
                {selectedLocation}
              </Tag>
            )}
            {dateRange && (
              <Tag closable onClose={() => { setDateRange(null); setTimeout(applyFilters, 100); }} style={{ fontSize: 11 }}>
                {dateRange[0].format('MMM DD')} - {dateRange[1].format('MMM DD')}
              </Tag>
            )}
          </div>
        )}

        <Table 
          columns={columns}
          dataSource={filteredAlerts}
          rowKey="id"
          pagination={{ 
            pageSize: 5,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} alerts`
          }}
          size="middle"
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* ══ CUSTOM ACKNOWLEDGE MODAL (same pattern as AddUser) ══ */}
      {acknowledgeModalVisible && ackAlert && (
        <>
          <div style={backdropStyle} onClick={closeAcknowledgeModal} />
          <div style={modalBoxStyle("480px")}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#faad14", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <ClockCircleOutlined />
                Acknowledge Alert
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeAcknowledgeModal} style={{ color: "#666" }} />
            </div>

            {/* Alert Info Card */}
            <div style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13 }}>{ackAlert.type}</Text>
                <Tag color={getSeverityColor(ackAlert.severity)} style={{ fontSize: 10, margin: 0 }}>
                  {getSeverityLabel(ackAlert.severity)}
                </Tag>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#666" }}>
                <span><EnvironmentOutlined style={{ marginRight: 4, color: "#1890ff" }} />{ackAlert.location}</span>
                <span>Value: {ackAlert.value}</span>
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                {moment(ackAlert.timestamp).format('YYYY-MM-DD HH:mm')} ({moment(ackAlert.timestamp).fromNow()})
              </div>
            </div>

            {/* Remark Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>
                Acknowledgment Remark <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <textarea
                rows={3}
                value={ackRemark}
                onChange={(e) => { setAckRemark(e.target.value); setAckError(''); }}
                placeholder="Describe the action taken or reason for acknowledgment..."
                style={{ ...inputStyle, resize: "vertical", borderColor: ackError ? "#ff4d4f" : "#d9d9d9" }}
                onFocus={e => e.target.style.borderColor = "#faad14"}
                onBlur={e => e.target.style.borderColor = ackError ? "#ff4d4f" : "#d9d9d9"}
              />
              {ackError && <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{ackError}</Text>}
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                <ExclamationCircleOutlined style={{ color: "#faad14" }} /> Adding a remark helps track the resolution process
              </Text>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={closeAcknowledgeModal}>Cancel</Button>
              <Button 
                type="primary" 
                onClick={handleAcknowledgeWithRemark}
                icon={<ClockCircleOutlined />}
                style={{ backgroundColor: "#faad14", borderColor: "#faad14" }}
              >
                Acknowledge
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ══ CUSTOM RESOLVE MODAL (same pattern as AddUser) ══ */}
      {resolveModalVisible && resolveAlert && (
        <>
          <div style={backdropStyle} onClick={closeResolveModal} />
          <div style={modalBoxStyle("480px")}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#52c41a", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircleOutlined />
                Resolve Alert
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeResolveModal} style={{ color: "#666" }} />
            </div>

            {/* Alert Info Card */}
            <div style={{ backgroundColor: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13 }}>{resolveAlert.type}</Text>
                <Tag color={getSeverityColor(resolveAlert.severity)} style={{ fontSize: 10, margin: 0 }}>
                  {getSeverityLabel(resolveAlert.severity)}
                </Tag>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#666" }}>
                <span><EnvironmentOutlined style={{ marginRight: 4, color: "#1890ff" }} />{resolveAlert.location}</span>
                <span>Value: {resolveAlert.value}</span>
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                {moment(resolveAlert.timestamp).format('YYYY-MM-DD HH:mm')} ({moment(resolveAlert.timestamp).fromNow()})
              </div>
            </div>

            {/* Remark Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>
                Resolution Remark <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <textarea
                rows={3}
                value={resolveRemark}
                onChange={(e) => { setResolveRemark(e.target.value); setResolveError(''); }}
                placeholder="Describe how this alert was resolved..."
                style={{ ...inputStyle, resize: "vertical", borderColor: resolveError ? "#ff4d4f" : "#d9d9d9" }}
                onFocus={e => e.target.style.borderColor = "#52c41a"}
                onBlur={e => e.target.style.borderColor = resolveError ? "#ff4d4f" : "#d9d9d9"}
              />
              {resolveError && <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{resolveError}</Text>}
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                <CheckCircleOutlined style={{ color: "#52c41a" }} /> Provide details about the resolution for future reference
              </Text>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={closeResolveModal}>Cancel</Button>
              <Button 
                type="primary" 
                onClick={handleResolveWithRemark}
                icon={<CheckCircleOutlined />}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Resolve
              </Button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Alerts;