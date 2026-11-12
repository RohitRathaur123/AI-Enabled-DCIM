import React, { useState, useEffect, useRef } from 'react';
import { 
  Row, Col, Card, Typography, 
  Button, Space, Select, Statistic, Progress, Alert, Tabs, Divider,
  Table, Badge, Tag, Tooltip, Spin
} from 'antd';
import { 
  DashboardOutlined, 
  SyncOutlined,
  AreaChartOutlined,
  AlertOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import Cookies from "js-cookie";
import { CO2API, gasApi } from '../../../config';

const { Title, Text } = Typography;
const Paragraph = Typography.Paragraph;
const { Option } = Select;
const { TabPane } = Tabs;

// DCIM Theme Colors - Blue theme
const accent = "#3b82f6";     // Good - blue
const moderate = "#faad14";   // Moderate - orange
const poor = "#f5222d";       // Poor - red

// Utility function to normalize -1 values to 0 for display
const normalizeDeviceValue = (value) => {
  if (value === -1 || value === '-1') return 0;
  return value;
};

const normalizeDeviceData = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => {
      if (item && typeof item === 'object') {
        const normalized = { ...item };
        if (normalized.deviceValue === -1 || normalized.deviceValue === '-1') normalized.deviceValue = 0;
        if (normalized.value === -1 || normalized.value === '-1') normalized.value = 0;
        if (normalized.readingValue === -1 || normalized.readingValue === '-1') normalized.readingValue = 0;
        return normalized;
      }
      return item;
    });
  } else if (data && typeof data === 'object') {
    const normalized = { ...data };
    if (normalized.deviceValue === -1 || normalized.deviceValue === '-1') normalized.deviceValue = 0;
    if (normalized.value === -1 || normalized.value === '-1') normalized.value = 0;
    if (normalized.readingValue === -1 || normalized.readingValue === '-1') normalized.readingValue = 0;
    return normalized;
  }
  return data;
}

function getStatusColor(value, thresholds) {
  if (!thresholds) return accent;
  if (value > thresholds.warning) return poor;
  if (value > thresholds.safe) return moderate;
  return accent;
}

function getStatusLabel(value, thresholds) {
  if (!thresholds) return "Normal";
  if (value > thresholds.warning) return "Critical";
  if (value > thresholds.safe) return "Warning";
  return "Normal";
}

const MainDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [realTimeDeviceLogs, setRealTimeDeviceLogs] = useState([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [deviceMetrics, setDeviceMetrics] = useState({});
  
  const refreshIntervalRef = useRef(null);
  const imei = Cookies.get("imei") || "";

  const DEVICE_LOGS_URL = `${CO2API}/api/device-logs`;
  const DEVICES_URL = `${CO2API}/api/devices`;
  const REAL_TIME_DEVICE_LOGS_URL = `${CO2API}/api/device-logs/real-time`;

  const fetchDevices = async () => {
    try {
      const response = await gasApi.get(DEVICES_URL, {
        params: { pageNumber: 1, pageSize: 100 }
      });
      
      if (response.data && response.data.data) {
        setDevices(response.data.data);
        if (response.data.data.length > 0 && !selectedDevice) {
          setSelectedDevice(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const fetchDeviceLogs = async () => {
    try {
      const response = await gasApi.get(DEVICE_LOGS_URL, {
        params: { pageNumber: 1, pageSize: 10 }
      });
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const normalizedData = normalizeDeviceData(response.data.data);
        setDeviceLogs(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching device logs:", error);
    }
  };

  const fetchRealTimeDeviceLogs = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await gasApi.get(REAL_TIME_DEVICE_LOGS_URL, {
        params: { pageNumber: 1, pageSize: 20 }
      });
      
      if (response.data && response.data.data) {
        const normalizedData = normalizeDeviceData(response.data.data);
        setRealTimeDeviceLogs(normalizedData);
        
        // Calculate metrics for the selected device
        const deviceSpecificLogs = normalizedData.filter(log => 
          log.deviceId === selectedDevice.id || 
          log.name === selectedDevice.name
        );
        
        if (deviceSpecificLogs.length > 0) {
          const values = deviceSpecificLogs.map(log => log.deviceValue || 0).filter(v => v > 0);
          if (values.length > 0) {
            setDeviceMetrics({
              current: values[0],
              average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
              max: Math.max(...values),
              min: Math.min(...values),
              count: values.length
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching real-time device logs:", error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDeviceLogs(),
        fetchDevices()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
    setLoading(false);
  };

  const refreshRealTimeData = async () => {
    try {
      await fetchRealTimeDeviceLogs();
    } catch (error) {
      console.error("Error refreshing real-time data:", error);
    }
  };

  useEffect(() => {
    refreshData();
    refreshIntervalRef.current = setInterval(() => {
      refreshRealTimeData();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchRealTimeDeviceLogs();
    }
  }, [selectedDevice]);

  const handleManualRefresh = () => {
    setRefreshCounter(prev => prev + 1);
    refreshData();
    if (selectedDevice) {
      fetchRealTimeDeviceLogs();
    }
  };

  const getCurrentValue = () => {
    if (!selectedDevice || realTimeDeviceLogs.length === 0) return 0;
    
    const deviceLog = realTimeDeviceLogs.find(log => 
      log.deviceId === selectedDevice.id || 
      log.name === selectedDevice.name
    );
    
    return deviceLog ? normalizeDeviceValue(deviceLog.deviceValue || 0) : 0;
  };

  const getLatestDeviceLog = () => {
    if (!selectedDevice || realTimeDeviceLogs.length === 0) return null;
    
    const deviceLogs = realTimeDeviceLogs.filter(log => 
      log.deviceId === selectedDevice.id || 
      log.name === selectedDevice.name
    );
    
    if (deviceLogs.length === 0) return null;
    
    return deviceLogs.reduce((latest, current) => {
      const currentTime = new Date(current.regDate || current.dateTime || 0).getTime();
      const latestTime = new Date(latest.regDate || latest.dateTime || 0).getTime();
      return currentTime > latestTime ? current : latest;
    });
  };

  const latestDeviceLog = getLatestDeviceLog();

  // Table columns for device logs
  const deviceLogColumns = [
    {
      title: 'Date & Time',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (text) => text ? new Date(text).toLocaleString() : 'N/A',
      sorter: (a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0)
    },
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Value',
      dataIndex: 'deviceValue',
      key: 'deviceValue',
      render: (value) => normalizeDeviceValue(value),
      sorter: (a, b) => (a.deviceValue || 0) - (b.deviceValue || 0)
    },
    {
      title: 'Battery',
      dataIndex: 'batteryVoltage',
      key: 'batteryVoltage',
      render: (voltage) => {
        if (!voltage) return 'N/A';
        const percent = Math.min(100, Math.max(0, 
          ((voltage - 300) / (420 - 300)) * 100
        ));
        let color = accent;
        if (percent < 30) color = poor;
        else if (percent < 70) color = moderate;
        return (
          <Tooltip title={`${voltage}mV`}>
            <Progress 
              percent={Math.round(percent)} 
              size="small" 
              strokeColor={color}
            />
          </Tooltip>
        );
      }
    },
    {
      title: 'Signal',
      dataIndex: 'signalStrength',
      key: 'signalStrength',
      render: (signal) => {
        if (!signal) return 'N/A';
        const bars = Math.min(4, Math.max(0, Math.ceil(signal / 5)));
        const icons = [];
        for (let i = 0; i < 4; i++) {
          icons.push(
            <div 
              key={i}
              style={{
                width: '3px',
                height: `${5 + (i * 3)}px`,
                backgroundColor: i < bars ? accent : '#d9d9d9',
                display: 'inline-block',
                marginRight: '2px'
              }}
            />
          );
        }
        return (
          <Tooltip title={`${signal} dBm`}>
            <div>{icons}</div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      render: (status) => (
        <Badge 
          status={status === 'Active' ? "success" : "default"} 
          text={status || 'Unknown'} 
        />
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <DashboardOutlined style={{ marginRight: 12, color: accent }} /> 
              DCIM Monitoring Dashboard
            </Title>
            <Text type="secondary">
              Data Center Infrastructure Management - Real-time monitoring
            </Text>
          </Col>
          <Col>
            <Space>
             
              
              <Button 
                type="primary"
                icon={<SyncOutlined spin={loading} />} 
                onClick={handleManualRefresh}
                loading={loading}
                style={{ background: accent, borderColor: accent }}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
      
      {/* Device Info Cards */}
      {selectedDevice && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="status-card">
              <Statistic
                title={<Space><DashboardOutlined /> Current Reading</Space>}
                value={getCurrentValue()}
                valueStyle={{ color: accent }}
              />
              <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                {latestDeviceLog ? 
                  `Last updated: ${new Date(latestDeviceLog.regDate || latestDeviceLog.dateTime).toLocaleTimeString()}` : 
                  'Last updated: N/A'}
              </Paragraph>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="status-card">
              <Statistic
                title={<Space><AreaChartOutlined /> Average</Space>}
                value={deviceMetrics.average || 0}
                valueStyle={{ color: accent }}
              />
              <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                Based on {deviceMetrics.count || 0} readings
              </Paragraph>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="status-card">
              <Statistic
                title={<Space><AlertOutlined /> Maximum</Space>}
                value={deviceMetrics.max || 0}
                valueStyle={{ color: deviceMetrics.max > 80 ? poor : accent }}
              />
              <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                Peak value
              </Paragraph>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="status-card">
              <Statistic
                title={<Space><CheckCircleOutlined /> Minimum</Space>}
                value={deviceMetrics.min || 0}
                valueStyle={{ color: accent }}
              />
              <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                Lowest value
              </Paragraph>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Main Content */}
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={<span><AreaChartOutlined />Real-time Monitoring</span>}
          key="1"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <AreaChartOutlined />
                    <span>Device Activity</span>
                    {selectedDevice && (
                      <Tag color="blue">Device: {selectedDevice.name}</Tag>
                    )}
                  </Space>
                }
                extra={
                  <Space>
                    <Badge status="success" text="System Online" />
                    <Button size="small" type="text" icon={<SyncOutlined />} onClick={refreshData}>Refresh</Button>
                  </Space>
                }
              >
                {loading ? (
                  <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table
                    dataSource={realTimeDeviceLogs.map((log, index) => ({
                      ...log,
                      key: index,
                      dateTime: log.regDate || log.dateTime
                    }))}
                    columns={deviceLogColumns}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    scroll={{ x: '100%' }}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane 
          tab={<span><HistoryOutlined />Device History</span>} 
          key="2"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card 
                title={<Space><HistoryOutlined /> Device Logs History</Space>}
                loading={loading}
              >
                <Table
                  dataSource={deviceLogs.map((log, index) => ({
                    ...log,
                    key: index,
                    dateTime: log.regDate || log.dateTime
                  }))}
                  columns={deviceLogColumns}
                  pagination={{ pageSize: 10 }}
                  size="middle"
                  scroll={{ x: '100%' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane 
          tab={<span><EnvironmentOutlined />Device Information</span>} 
          key="3"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card 
                title={<Space><EnvironmentOutlined /> Selected Device Details</Space>}
                loading={loading}
              >
                {selectedDevice ? (
                  <Row gutter={[24, 16]}>
                    <Col xs={24} md={12}>
                      <div>
                        <Text strong>Device Name: </Text>
                        <Text>{selectedDevice.name}</Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Device Type: </Text>
                        <Text>{selectedDevice.deviceType === 30000 ? 'Sensor' : `Type ${selectedDevice.deviceType}`}</Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>IP Address: </Text>
                        <Text>{selectedDevice.ipAddress || 'N/A'}</Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Status: </Text>
                        <Badge 
                          status={selectedDevice.status ? "success" : "error"} 
                          text={selectedDevice.status ? "Active" : "Inactive"} 
                        />
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Registration Date: </Text>
                        <Text>{selectedDevice.regDate ? new Date(selectedDevice.regDate).toLocaleDateString() : 'N/A'}</Text>
                      </div>
                    </Col>
                    
                    <Col xs={24} md={12}>
                      <div>
                        <Text strong>Current Value: </Text>
                        <Text>{getCurrentValue()}</Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Device Status: </Text>
                        <Text>{latestDeviceLog?.deviceStatus || 'N/A'}</Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Last Reading Time: </Text>
                        <Text>
                          {latestDeviceLog?.regDate ? 
                            new Date(latestDeviceLog.regDate).toLocaleString() : 
                            'N/A'}
                        </Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Location: </Text>
                        <Text>{latestDeviceLog?.address || selectedDevice.address || 'N/A'}</Text>
                      </div>
                      
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Coordinates: </Text>
                        <Text>
                          {latestDeviceLog?.latitude && latestDeviceLog?.longitude ? 
                            `${latestDeviceLog.latitude}, ${latestDeviceLog.longitude}` : 
                            selectedDevice.latitude && selectedDevice.longitude ?
                            `${selectedDevice.latitude}, ${selectedDevice.longitude}` :
                            'N/A'}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <Alert
                    message="No Device Selected"
                    description="Please select a device to view detailed information."
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card 
                title={<Space><DashboardOutlined /> All Devices</Space>}
                loading={loading}
              >
                <Table
                  dataSource={devices.map((device, index) => ({
                    ...device,
                    key: index,
                    status: device.status ? 'Active' : 'Inactive'
                  }))}
                  columns={[
                    {
                      title: 'Device Name',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: 'Device Type',
                      dataIndex: 'deviceType',
                      key: 'deviceType',
                      render: (type) => type === 30000 ? 'Sensor' : `Type ${type}`
                    },
                    {
                      title: 'IP Address',
                      dataIndex: 'ipAddress',
                      key: 'ipAddress',
                      render: (ip) => ip || 'N/A'
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => (
                        <Badge 
                          status={status === 'Active' ? "success" : "default"} 
                          text={status} 
                        />
                      )
                    },
                    {
                      title: 'Registration Date',
                      dataIndex: 'regDate',
                      key: 'regDate',
                      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
                    },
                    {
                      title: 'Action',
                      key: 'action',
                      render: (_, record) => (
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => setSelectedDevice(record)}
                        >
                          Select
                        </Button>
                      )
                    }
                  ]}
                  pagination={{ pageSize: 5 }}
                  size="middle"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
      
      <div style={{ marginTop: 24, textAlign: 'center', padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
        <Space split={<Divider type="vertical" />}>
          <Text type="secondary">DCIM Monitoring Dashboard</Text>
          <Text type="secondary">
            Last Updated: {latestDeviceLog ? 
            new Date(latestDeviceLog.regDate || latestDeviceLog.dateTime).toLocaleString() : 
            new Date().toLocaleString()}
          </Text>
        </Space>
      </div>

    </div>
  );
};

export default MainDashboard;